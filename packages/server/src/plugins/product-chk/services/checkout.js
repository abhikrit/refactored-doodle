// CHK - checkout, validation, split placement and confirmation.
//
// The placement host reproduces the sequence BR-CHK-006 states for the IOrderProcessingService
// override owned by CHK-003:
//   take the named lock per customer once (OrderSettings.PlaceOrderWithLock)
//   -> prepare details once
//   -> IC-CHK-02 validators (order per BR-CHK-005)
//   -> IC-CHK-06 placement participants, Reserve phase, each under its own ILocker key
//   -> process payment ONCE for the whole checkout
//   -> save one sub-order per group the IC-CHK-11 splitter returns (BR-CHK-009)
//   -> allocate order-level amounts in proportion to sub-order subtotals (BR-CHK-007)
//   -> Confirm participants per saved sub-order, then publish OrderPlacedEvent
//   -> clear the cart once
// On a payment or reservation failure every reservation is Released and nothing is saved.
//
// CART-500: there is one cart for all sellers; the native per-vendor cart stays off.
// SPLIT-PAY / BR-CHK-022: a multi-seller checkout offers only methods that declare group support.

import { createHash, randomBytes } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { runProviders } from '../../../core/providers.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { publishAsync } from '../../../core/events.js';
import { auditAsync } from '../../../core/audit.js';
import { resource, sendAsync } from '../../../core/messages.js';
import { getSettingAsync } from '../../../core/settings.js';
import { getCartAsync } from './cart.js';
import { paymentMethodsForStoreAsync, processPaymentAsync } from '../../product-pay/services/payments.js';
import { nextOrderNumberAsync, initialStageAsync } from '../../product-ord/services/orders.js';
import { quoteFulfilmentAsync } from '../../product-log/services/logistics.js';
import {
  runCheckOrderAsync, reserveAsync, confirmAsync, releaseAsync, cartWarningsAsync,
} from './validation.js';

const sessionRepo = () => repository('CheckoutSession');
import {
  cartFulfilmentOptionsAsync, setLineFulfilmentAsync, stepEstimatesAsync, estimateForCartAsync,
} from './fulfilment.js';
import {
  windowsAsync, desiredDateOptionsAsync, instructionsAttributeAsync, setInstructionsAsync,
  chosenWindowAsync,
} from './slots.js';
import { addressFormAsync, locatorCheck } from './address.js';

const orderRepo = () => repository('Order');
const orderItemRepo = () => repository('OrderItem');
const pickupCodeRepo = () => repository('PickupCode');
const exceptionRepo = () => repository('CheckoutException');

const money = (n) => Number(Number(n).toFixed(2));

/** SM-CHK-01: one open CheckoutSession per customer and store, with a non-guessable reference. */
export async function openSessionAsync({ sessionId, customer, storeId = 1 }) {
  const open = await sessionRepo().getOneAsync((s) => s.sessionId === sessionId && s.state === 'Open');
  if (open) return open;
  return sessionRepo().insertAsync({
    sessionId,
    customerId: customer?.id ?? null,
    storeId,
    state: 'Open',
    reference: `CHK-${randomBytes(5).toString('hex').toUpperCase()}`,
  });
}

/** The steps the native CheckoutController shows, driven only by settings (AC-CHK-002-01-01). */
export async function checkoutStateAsync({ sessionId, customer, storeId = 1 }) {
  const [onePage, guestAllowed, disableBilling, termsOnConfirm, chooseDate, dateRange, pickupAllowed] = await Promise.all([
    getSettingAsync('ordersettings.onepagecheckoutenabled', storeId, false),
    getSettingAsync('ordersettings.anonymouscheckoutallowed', storeId, true),
    getSettingAsync('ordersettings.disablebillingaddresscheckoutstep', storeId, false),
    getSettingAsync('ordersettings.termsofserviceonorderconfirmpage', storeId, false),
    getSettingAsync('shippingsettings.allowcustomertochoosedeliverydate', storeId, true),
    getSettingAsync('shippingsettings.deliverydaterangedays', storeId, 7),
    getSettingAsync('shippingsettings.allowpickupinstore', storeId, true),
  ]);
  const cart = await getCartAsync({ sessionId, customer, storeId });
  const shippable = cart.items.some((i) => i.product.isShipEnabled);
  const steps = [
    ...(disableBilling ? [] : [{ id: 'billing', name: 'Billing address' }]),
    ...(shippable ? [{ id: 'shipping', name: 'Shipping address' }, { id: 'shipping-method', name: 'Shipping method' }] : []),
    { id: 'payment-method', name: 'Payment method' },
    { id: 'payment-info', name: 'Payment information' },
    { id: 'confirm', name: 'Confirm order' },
  ];
  const session = await openSessionAsync({ sessionId, customer, storeId });
  const methods = await paymentMethodsForStoreAsync({ storeId, multiSeller: cart.multiSeller });

  return {
    session,
    steps,
    onePageCheckout: onePage,
    guestCheckoutAllowed: guestAllowed,
    signInRequired: !guestAllowed && !customer,
    termsRequired: termsOnConfirm,
    deliveryDate: { enabled: chooseDate, rangeDays: dateRange },
    pickupAllowed,
    paymentMethods: methods.available,
    paymentMethodsExcluded: methods.excluded,
    cart,
    features: ['PRD-CHK-002', 'PRD-CHK-005', 'PRD-CHK-006', 'PRD-CHK-014'],
    citations: {
      'guestCheckoutAllowed': 'OrderSettings.AnonymousCheckoutAllowed - BR-CHK-002: a per-client setting, no code differs between clients (KTDA on, Malawi Post off)',
      'paymentMethods': 'BR-CHK-022 / decision SPLIT-PAY: a multi-seller checkout offers only methods that declare group support',
    },
  };
}

/**
 * Everything the shipping method step shows: the fulfilment choice of each line (CHK-005), the
 * expected dates (CHK-014), the native preferred-date list and the delivery windows of the
 * chosen date (CHK-006) and the delivery instructions attribute.
 */
export async function shippingStepAsync({
  sessionId, customer, storeId = 1, shippingMethod = null, area = null, date = null,
}) {
  const cart = await getCartAsync({ sessionId, customer, storeId });
  const session = await openSessionAsync({ sessionId, customer, storeId });
  const fulfilment = await cartFulfilmentOptionsAsync({
    cart, customer, storeId, date: date ?? session.desiredDeliveryDate ?? null,
  });
  const estimates = await stepEstimatesAsync({
    cart, address: session.shippingAddress ?? null, storeId, customer,
  });
  const chosenMethod = shippingMethod
    ?? estimates.options.find((o) => Number(o.transitDays ?? 0) > 0)?.shippingMethod
    ?? estimates.options[0]?.shippingMethod
    ?? null;
  const transitDays = estimates.options.find((o) => o.shippingMethod === chosenMethod)?.transitDays ?? 0;
  const desiredDate = await desiredDateOptionsAsync({ storeId, transitDays });
  const chosenDate = date ?? session.desiredDeliveryDate ?? null;
  const windows = await windowsAsync({
    shippingMethod: chosenMethod,
    area: area ?? session.shippingAddress?.city ?? null,
    date: chosenDate,
    storeId,
  });
  const instructions = await instructionsAttributeAsync({ storeId });

  return {
    lines: fulfilment.lines,
    estimates,
    shippingMethod: chosenMethod,
    desiredDate,
    chosenDate,
    windows: windows.windows,
    windowsOffered: windows.offered,
    chosenWindow: await chosenWindowAsync(session),
    instructions: instructions
      ? {
        name: instructions.name,
        controlType: instructions.attributeControlType ?? 'TextBox',
        isRequired: instructions.isRequired === true,
        maxLength: instructions.maxLength ?? null,
        value: session.deliveryInstructions ?? '',
      }
      : null,
  };
}

/**
 * BR-CHK-005 validation order, run inside placement before payment:
 *   native cart and item warnings -> price check -> eligibility -> payment method -> risk.
 * The first failure stops placement.
 */
export async function validateAsync({
  sessionId, customer, storeId = 1, paymentMethodSystemName, termsAccepted, shownTotal,
}) {
  const cart = await getCartAsync({ sessionId, customer, storeId });
  if (!cart.items.length) {
    return {
      ok: false,
      stoppedAt: 'stock and availability',
      failures: [{ step: 'cart', message: 'Your cart is empty.' }],
    };
  }
  for (const item of cart.items) {
    if (item.fulfilment === 'pickup' && !item.pickupPointId) {
      return {
        ok: false,
        stoppedAt: 'stock and availability',
        failures: [{ step: 'shipping-method', message: `Choose an outlet to collect ${item.product.name} from.` }],
      };
    }
  }

  const totals = await totalsAsync({
    sessionId, customer, storeId, paymentMethodSystemName,
  });

  // the payment method must be active and, for a multi-seller cart, group-capable (BR-CHK-022);
  // the check itself happens inside the ordered run, at the payment-method position
  const methods = await paymentMethodsForStoreAsync({ storeId, multiSeller: cart.multiSeller });
  const chosen = methods.available.find((m) => m.systemName === paymentMethodSystemName) ?? null;
  const excluded = methods.excluded.find((m) => m.systemName === paymentMethodSystemName) ?? null;
  const paymentMethod = chosen
    ? { valid: true }
    : {
      valid: false,
      messageKey: excluded?.reason === 'no-group-support' ? 'Chk.MultiSellerNotSupported' : 'Chk.PaymentMethodInvalid',
      message: excluded?.reason === 'no-group-support'
        ? resource('Chk.MultiSellerNotSupported')
        : resource('Chk.PaymentMethodInvalid'),
    };

  // AC-CHK-003-02-03: stock and availability, price, buyer eligibility, payment method, fraud
  const ordered = await runCheckOrderAsync({
    cart,
    customer,
    storeId,
    paymentMethodSystemName,
    paymentMethod,
    shownTotal: shownTotal ?? null,
    currentTotal: totals.total,
  });
  if (ordered.ok !== true) {
    return {
      ok: false,
      stoppedAt: ordered.stoppedAt,
      checkSteps: ordered.steps,
      messageKey: ordered.messageKey,
      newTotal: ordered.newTotal ?? null,
      failures: [{
        step: ordered.stoppedAt === 'price' ? 'confirm' : (ordered.stoppedAt === 'payment method' ? 'payment-method' : 'cart'),
        message: ordered.message,
        messageKey: ordered.messageKey ?? null,
        newTotal: ordered.newTotal ?? null,
      }],
      paymentInitiated: false,
    };
  }

  // the terms, enforced on the server by the CHK-009 action filter (BR-CHK-013)
  const termsOnConfirm = await getSettingAsync('ordersettings.termsofserviceonorderconfirmpage', storeId, false);
  if (termsOnConfirm && !termsAccepted) {
    return {
      ok: false,
      stoppedAt: 'buyer eligibility',
      messageKey: 'Chk.TermsRequired',
      failures: [{ step: 'confirm', message: resource('Chk.TermsRequired'), messageKey: 'Chk.TermsRequired' }],
      paymentInitiated: false,
    };
  }

  return {
    ok: true, failures: [], cart, checkSteps: ordered.steps, checkOrder: ordered.checkOrder,
  };
}

/** Order totals, always recalculated on the server (BR-CHK-003 / AC-CHK-002-04-02). */
export async function totalsAsync({
  sessionId, customer, storeId = 1, paymentMethodSystemName = null,
}) {
  const cart = await getCartAsync({ sessionId, customer, storeId });
  const fulfilment = await quoteFulfilmentAsync({ cart, storeId });
  const methods = await paymentMethodsForStoreAsync({ storeId, multiSeller: cart.multiSeller });
  const method = methods.available.find((m) => m.systemName === paymentMethodSystemName) ?? null;
  const subtotal = cart.subtotal;
  const deliveryFee = fulfilment.totalFee;
  const paymentFee = method?.additionalFee ?? 0;
  const taxRate = await getSettingAsync('taxsettings.defaultrate', storeId, 0.16);
  const tax = money((subtotal + deliveryFee + paymentFee) * taxRate);
  const total = money(subtotal + deliveryFee + paymentFee + tax);
  return {
    subtotal,
    deliveryFee,
    paymentFee,
    taxRate,
    tax,
    total,
    discount: 0,
    perSeller: fulfilment.perGroup,
    currency: fulfilment.currency,
    citation: 'AC-CHK-002-03-01: the confirm step lists every item, subtotal, discounts, tax, payment fee, delivery or pickup fee and the total before payment is executed',
  };
}

/** IC-CHK-11 splitter: group lines by seller and fulfilment choice (BR-CHK-009). */
export function splitCart(cart) {
  const groups = new Map();
  for (const item of cart.items) {
    const key = `${item.vendorId}|${item.fulfilment}|${item.pickupPointId ?? 0}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key, vendorId: item.vendorId, fulfilment: item.fulfilment, pickupPointId: item.pickupPointId, items: [],
      });
    }
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}

function hashCode(code) {
  return createHash('sha256').update(code).digest('hex');
}

/** CHK-012 / BR-CHK-016: single-use code, bound to one sub-order and one outlet, stored hashed. */
async function issuePickupCodeAsync({ order, pickupPointId, storeId }) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const limit = await getSettingAsync('chk.pickup.failurelimit', storeId, 3);
  await pickupCodeRepo().insertAsync({
    orderId: order.id,
    orderNumber: order.orderNumber,
    pickupPointId,
    codeHash: hashCode(code),
    used: false,
    locked: false,
    failedAttempts: 0,
    failureLimit: limit,
  });
  return code;
}

export async function placeOrderAsync({
  sessionId, customer, storeId = 1, paymentMethodSystemName, paymentData = {},
  termsAccepted = false, shownTotal = null, billingAddress = null, shippingAddress = null,
  deliverySlotId = null, desiredDeliveryDate = null, actor = 'storefront',
}) {
  const validation = await validateAsync({
    sessionId, customer, storeId, paymentMethodSystemName, termsAccepted, shownTotal,
  });
  if (!validation.ok) return { ok: false, ...validation };

  const session = await openSessionAsync({ sessionId, customer, storeId });
  const withLock = await getSettingAsync('ordersettings.placeorderwithlock', storeId, true);
  const run = async () => {
    const cart = await getCartAsync({ sessionId, customer, storeId });
    const totals = await totalsAsync({
      sessionId, customer, storeId, paymentMethodSystemName,
    });
    const groups = splitCart(cart);
    const reservations = [];

    // the window and the date the shopper chose on the shipping method step
    const slotId = deliverySlotId ?? session.deliverySlotId ?? null;
    const desiredDate = desiredDeliveryDate ?? session.desiredDeliveryDate ?? null;

    // ---- Reserve phase (IC-CHK-06), each under its own ILocker key (BR-CHK-020) ------------
    try {
      const participants = await runProviders('IC-CHK-06', 'firstFail', {
        phase: 'Reserve',
        cart,
        customer,
        storeId,
        totals,
        deliverySlotId: slotId,
        date: desiredDate,
      });
      const refused = participants.find((p) => p.result && p.result.ok === false);
      if (refused) {
        reservations.push(...participants
          .filter((x) => x.result && x.result.ok !== false && x.result.reservation)
          .map((x) => ({ feature: x.feature, reservation: x.result.reservation })));
        await releaseAsync({ reservations, reason: 'a later reservation was refused' });
        return {
          ok: false,
          stoppedAt: `reserve: ${refused.provider}`,
          messageKey: refused.result.messageKey ?? null,
          failures: [{
            step: refused.result.messageKey === 'Chk.SlotFull' ? 'shipping-method' : 'confirm',
            message: refused.result.message,
            messageKey: refused.result.messageKey ?? null,
          }],
        };
      }
      reservations.push(...participants
        .filter((x) => x.result && x.result.reservation)
        .map((x) => ({ feature: x.feature, reservation: x.result.reservation })));
    } catch (err) {
      return { ok: false, stoppedAt: 'reserve', failures: [{ step: 'confirm', message: err.message }] };
    }

    // ---- payment, ONCE for the whole checkout (BR-CHK-006, BR-CHK-022) ---------------------
    let payment;
    try {
      payment = await processPaymentAsync({
        systemName: paymentMethodSystemName,
        amount: totals.total,
        currency: totals.currency,
        checkoutReference: session.reference,
        customer,
        storeId,
        data: paymentData,
        groupPayment: groups.length > 1,
      });
    } catch (err) {
      await exceptionRepo().insertAsync({
        kind: 'payment-failed', checkoutReference: session.reference, message: err.message, feature: 'PRD-PAY-011',
      });
      await releaseAsync({ reservations, reason: 'the payment failed' });
      return {
        ok: false,
        stoppedAt: 'payment',
        failures: [{ step: 'payment-info', message: err.message }],
        paymentError: err.message,
      };
    }
    if (payment.status === 'Failed') {
      await releaseAsync({ reservations, reason: 'the payment failed' });
      return {
        ok: false, stoppedAt: 'payment', failures: [{ step: 'payment-info', message: payment.reason ?? 'Payment failed' }], payment,
      };
    }

    // AC-CHK-014-01-04: the estimate shown for the chosen option is stored with the order, so
    // the confirm page and tracking show the same dates. CHK does not calculate it (IC-CHK-03).
    const estimate = await estimateForCartAsync({ cart, address: shippingAddress, storeId });

    // ---- save one sub-order per group, allocating order-level amounts (BR-CHK-007) ---------
    const subtotalAll = groups.reduce((s, g) => s + g.items.reduce((x, i) => x + i.subtotal, 0), 0) || 1;
    const orders = [];
    let allocated = { delivery: 0, payment: 0, tax: 0 };
    for (const [index, group] of groups.entries()) {
      const groupSubtotal = money(group.items.reduce((s, i) => s + i.subtotal, 0));
      const share = groupSubtotal / subtotalAll;
      const last = index === groups.length - 1;
      const groupQuote = totals.perSeller.find((p) => p.key === group.key);
      const deliveryFee = groupQuote ? groupQuote.fee : money(totals.deliveryFee * share);
      const paymentFee = last ? money(totals.paymentFee - allocated.payment) : money(totals.paymentFee * share);
      const tax = last ? money(totals.tax - allocated.tax) : money(totals.tax * share);
      allocated = {
        delivery: money(allocated.delivery + deliveryFee),
        payment: money(allocated.payment + paymentFee),
        tax: money(allocated.tax + tax),
      };
      const vendor = await repository('Vendor').getByIdAsync(group.vendorId);
      const orderNumber = await nextOrderNumberAsync(storeId);
      const stage = await initialStageAsync(storeId);
      const order = await orderRepo().insertAsync({
        orderNumber,
        orderGuid: randomBytes(8).toString('hex'),
        checkoutReference: session.reference,
        storeId,
        customerId: customer?.id ?? null,
        customerEmail: customer?.email ?? billingAddress?.email ?? 'guest@example.com',
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : (billingAddress?.firstName ?? 'Guest'),
        vendorId: group.vendorId,
        vendorName: vendor?.name ?? null,
        fulfilment: group.fulfilment,
        pickupPointId: group.pickupPointId,
        pickUpInStore: group.fulfilment === 'pickup',
        deliverySlotId: slotId,
        // AC-CHK-006-01-07: the desired date is read once and set on every sub-order, because
        // the native SaveOrderDetailsAsync copies it only to the first order saved
        desiredDeliveryDateUtc: desiredDate,
        checkoutAttributeDescription: session.checkoutAttributeDescription ?? null,
        deliveryInstructions: session.deliveryInstructions ?? null,
        estimatedDelivery: group.fulfilment === 'pickup'
          ? (estimate?.kind === 'pickup' ? estimate : null)
          : (estimate?.kind === 'delivery' ? estimate : null),
        billingAddress,
        shippingAddress: group.fulfilment === 'pickup' ? null : shippingAddress,
        paymentMethodSystemName,
        paymentStatus: payment.status === 'Paid' ? 'Paid' : 'Pending',
        paymentProviderRef: payment.providerRef,
        orderStatus: stage.orderStatus,
        stage: stage.stage,
        shippingStatus: group.fulfilment === 'pickup' ? 'NotYetShipped' : 'NotYetShipped',
        subtotal: groupSubtotal,
        deliveryFee,
        paymentFee,
        tax,
        total: money(groupSubtotal + deliveryFee + paymentFee + tax),
        currency: totals.currency,
        placedOnUtc: new Date().toISOString(),
      });
      for (const item of group.items) {
        const orderItem = await orderItemRepo().insertAsync({
          orderId: order.id,
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          vendorId: item.vendorId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          fulfilment: item.fulfilment,
          pickupPointId: item.pickupPointId,
        });
        // the line's choice follows the item onto the order (CHK-005, section 9)
        await repository('OrderItemFulfilment').insertAsync({
          orderItemId: orderItem.id,
          orderId: order.id,
          method: item.fulfilment,
          pickupPointId: item.pickupPointId ?? null,
        });
      }
      let pickupCode = null;
      if (group.fulfilment === 'pickup') {
        pickupCode = await issuePickupCodeAsync({ order, pickupPointId: group.pickupPointId, storeId });
      }
      orders.push({ ...order, pickupCode, items: group.items.length });

      // Confirm phase per saved sub-order, then the event (BR-CHK-006)
      await confirmAsync({ reservations, order, storeId });
      await publishAsync('OrderPlacedEvent', { order });
      await auditAsync({
        event: 'AUD-CHK-004-01',
        area: 'CHK',
        feature: 'PRD-CHK-004',
        entity: 'Order',
        entityId: order.id,
        actor: customer?.email ?? actor,
        actorRole: customer?.roles?.[0] ?? 'Guest',
        after: {
          orderNumber: order.orderNumber, total: order.total, vendor: order.vendorName, fulfilment: order.fulfilment,
        },
        note: `sub-order of checkout ${session.reference} (BR-CHK-009 grouping by seller and fulfilment)`,
      });
    }

    // ---- clear the cart once, close the session (BR-CHK-006, SM-CHK-01) -------------------
    for (const item of cart.items) await repository('ShoppingCartItem').deleteAsync(item);
    await sessionRepo().updateAsync({ ...session, state: 'Placed', placedOrderIds: orders.map((o) => o.id) });

    // ---- CHK-019 confirmation, through TRK-005 -------------------------------------------
    const confirmation = orders.length > 1
      ? resource('Chk.OrderPlacedGroup', { reference: session.reference, count: orders.length })
      : `Your order ${orders[0].orderNumber} has been placed.`;
    const to = customer?.email ?? billingAddress?.email ?? 'guest@example.com';
    await sendAsync({
      event: 'Chk.OrderPlacedGroup',
      to,
      tokens: { reference: session.reference, count: orders.length },
      storeId,
      feature: 'PRD-CHK-019',
      gateways: (await import('@product/mocks')).messageGateways,
    });
    for (const o of orders.filter((x) => x.pickupCode)) {
      const point = await repository('StorePickupPoint').getByIdAsync(o.pickupPointId);
      await sendAsync({
        event: 'Chk.PickupCode',
        to: customer?.phone ?? to,
        channels: ['sms', 'inapp'],
        tokens: { 'order number': o.orderNumber, outlet: point?.name ?? 'the outlet', code: o.pickupCode },
        storeId,
        feature: 'PRD-CHK-012',
        gateways: (await import('@product/mocks')).messageGateways,
      });
    }

    return {
      ok: true,
      checkoutReference: session.reference,
      orders,
      totals,
      payment,
      confirmation,
      split: groups.length > 1,
      features: ['PRD-CHK-003', 'PRD-CHK-004', 'PRD-CHK-012', 'PRD-CHK-019', 'PRD-ORD-007', 'PRD-PAY-011'],
    };
  };

  return withLock
    ? withLockAsync(lockKey.orderPlacement(customer?.id ?? sessionId), run)
    : run();
}

/** CHK-012 verification, called by the LOG-012 handover step (IC-CHK-09). */
export async function verifyPickupCodeAsync({ orderNumber, code, pickupPointId }) {
  const row = await pickupCodeRepo().getOneAsync((r) => r.orderNumber === orderNumber);
  if (!row) return { ok: false, message: resource('Chk.PickupCodeInvalid') };
  if (row.locked) return { ok: false, message: resource('Chk.PickupCodeLocked') };
  if (row.used) return { ok: false, message: resource('Chk.PickupCodeUsed') };
  if (pickupPointId != null && Number(row.pickupPointId) !== Number(pickupPointId)) {
    return { ok: false, message: resource('Chk.PickupCodeInvalid') };
  }
  if (row.codeHash !== hashCode(String(code))) {
    const failedAttempts = row.failedAttempts + 1;
    const locked = failedAttempts >= row.failureLimit;
    await pickupCodeRepo().updateAsync({ ...row, failedAttempts, locked });
    return {
      ok: false,
      message: locked ? resource('Chk.PickupCodeLocked') : resource('Chk.PickupCodeInvalid'),
      failedAttempts,
    };
  }
  return { ok: true, row };
}

export async function markPickupCodeUsedAsync(orderNumber) {
  const row = await pickupCodeRepo().getOneAsync((r) => r.orderNumber === orderNumber);
  if (row) await pickupCodeRepo().updateAsync({ ...row, used: true, usedOnUtc: new Date().toISOString() });
}

export async function checkoutExceptionsAsync() {
  return exceptionRepo().getAllAsync();
}

/* ====================================================== PRD-CHK-002 the steps ========== */

/** The fields each step requires, so a missing one comes back against its own field. */
export const STEP_FIELDS = {
  billing: ['firstName', 'lastName', 'addressLine1', 'city', 'country', 'phone'],
  shipping: ['firstName', 'lastName', 'addressLine1', 'city', 'country', 'phone'],
  'shipping-method': ['fulfilment'],
  'payment-method': ['paymentMethodSystemName'],
  'payment-info': [],
  confirm: [],
};

/**
 * AC-CHK-002-04-01: every checkout request is served over HTTPS and every POST carries a valid
 * antiforgery token. The prototype runs on http locally, so the check reports what the filter
 * would enforce and refuses a POST with no token either way.
 */
export function checkoutRequestGuard({
  method = 'GET', secure = false, forwardedProto = null, antiforgeryToken = null, sessionToken = null,
}) {
  const https = secure === true || forwardedProto === 'https';
  if (String(method).toUpperCase() !== 'GET' && !antiforgeryToken) {
    return {
      ok: false,
      refused: true,
      reason: 'the antiforgery token is missing',
      messageKey: 'Chk.AntiforgeryRequired',
      https,
      httpsRequired: true,
    };
  }
  if (String(method).toUpperCase() !== 'GET' && sessionToken && antiforgeryToken !== sessionToken) {
    return {
      ok: false, refused: true, reason: 'the antiforgery token does not match', https, httpsRequired: true,
    };
  }
  return {
    ok: true, https, httpsRequired: true, servedOverHttps: https, antiforgeryChecked: String(method).toUpperCase() !== 'GET',
  };
}

/**
 * AC-CHK-002-02-03: with guest checkout off, a request to any checkout action from somebody who
 * is not signed in is challenged - including a direct post to confirm.
 */
export async function guestGuardAsync({ action, customer, storeId = 1 }) {
  const guestAllowed = await getSettingAsync('ordersettings.anonymouscheckoutallowed', storeId, true);
  if (guestAllowed === true || customer) return { ok: true, challenged: false };
  return {
    ok: false,
    challenged: true,
    action,
    redirectTo: '/login?returnUrl=/checkout',
    orderCreated: false,
    paymentExecuted: false,
    message: 'Sign in or register to place this order.',
  };
}

/**
 * AC-CHK-002-01-02 and 01-03: the progress of the multi-page checkout, the step that is current,
 * the ones still to come, and the address IAM-014 pre-selects on the two address steps.
 */
export async function stepStateAsync({
  sessionId, customer, storeId = 1, currentStep = null,
}) {
  const state = await checkoutStateAsync({ sessionId, customer, storeId });
  const session = state.session;
  const completed = session.completedSteps ?? [];
  const steps = state.steps.map((step, index) => ({
    ...step,
    index,
    completed: completed.includes(step.id),
    current: step.id === (currentStep ?? steps0Current(state.steps, completed)),
  }));
  // the address book, so the step can show the picker the shopper chooses another address from
  const addressBook = customer
    ? await repository('Address').getAllAsync((a) => Number(a.customerId) === Number(customer.id))
    : [];
  let defaultAddress = null;
  if (customer) {
    const preference = await repository('CustomerPreference').getOneAsync((p) => Number(p.customerId) === Number(customer.id));
    if (preference?.defaultAddressId) {
      const address = await repository('Address').getByIdAsync(preference.defaultAddressId);
      const countries = await repository('Country').getAllAsync((c) => c.published !== false);
      const allowed = address && countries.some((c) => c.name === address.country || c.twoLetterIsoCode === address.country);
      if (address && allowed) defaultAddress = address;
    }
  }
  return {
    reference: session.reference,
    onePageCheckout: state.onePageCheckout === true,
    steps,
    currentStep: steps.find((s) => s.current)?.id ?? steps[0]?.id ?? null,
    remainingSteps: steps.filter((s) => !s.completed).map((s) => s.id),
    progressIndicator: steps.map((s) => ({ id: s.id, name: s.name, state: s.completed ? 'done' : (s.current ? 'current' : 'todo') })),
    addressBook,
    defaultAddress,
    defaultAddressPreselectedOn: defaultAddress ? ['billing', 'shipping'] : [],
    values: session.stepValues ?? {},
    signInRequired: state.signInRequired,
  };
}

const steps0Current = (steps, completed) => steps.find((s) => !completed.includes(s.id))?.id ?? steps[steps.length - 1]?.id;

/**
 * AC-CHK-002-01-03: a step is validated on the server; a failure shows the step again with the
 * values kept and a message against each field, and a completed step is not asked for again.
 */
export async function submitStepAsync({
  sessionId, customer, storeId = 1, step, values = {},
}) {
  const session = await openSessionAsync({ sessionId, customer, storeId });
  const required = STEP_FIELDS[step];
  if (!required) return { ok: false, message: `${step} is not a checkout step` };
  // the shipping method step carries the choice of each line, the date and the window
  if (step === 'shipping-method') {
    return submitShippingMethodAsync({
      sessionId, customer, storeId, values, session,
    });
  }
  const fieldErrors = {};
  for (const field of required) {
    if (values[field] === undefined || values[field] === null || String(values[field]).trim() === '') {
      fieldErrors[field] = 'This field is required.';
    }
  }
  if (values.phone && !/^[+0-9 ()-]{6,}$/.test(String(values.phone))) {
    fieldErrors.phone = 'Enter a telephone number we can reach you on.';
  }
  const keptValues = { ...(session.stepValues ?? {}), [step]: values };
  // BR-CHK-011: the address steps must carry at least the locators the client rule requires
  let locator = { ok: true };
  if (step === 'billing' || step === 'shipping') {
    const form = await addressFormAsync({ storeId, country: values.country ?? null });
    locator = locatorCheck({
      values,
      attributes: values.attributes ?? { Landmark: values.landmark ?? '' },
      pin: values.pin ?? null,
      locatorRule: form.locatorRule,
    });
  }

  if (Object.keys(fieldErrors).length || locator.ok !== true) {
    await sessionRepo().updateAsync({ ...session, stepValues: keptValues });
    const state = await stepStateAsync({
      sessionId, customer, storeId, currentStep: step,
    });
    return {
      ok: false,
      step,
      fieldErrors,
      values,
      valuesKept: true,
      messageKey: locator.ok === true ? null : locator.messageKey,
      message: locator.ok === true ? null : locator.message,
      locatorRule: locator.ok === true ? null : locator.rule,
      progressIndicator: state.progressIndicator,
      validatedOn: 'the server (ModelState)',
    };
  }
  const completed = [...new Set([...(session.completedSteps ?? []), step])];
  const addressOnSession = (step === 'billing' || step === 'shipping')
    ? {
      [step === 'billing' ? 'billingAddress' : 'shippingAddress']: {
        ...values,
        customAttributes: values.attributes ?? (values.landmark ? { Landmark: values.landmark } : {}),
      },
    }
    : {};
  await sessionRepo().updateAsync({
    ...session, completedSteps: completed, stepValues: keptValues, ...addressOnSession,
  });
  const state = await stepStateAsync({ sessionId, customer, storeId });
  return {
    ok: true,
    step,
    completedSteps: completed,
    nextStep: state.currentStep,
    progressIndicator: state.progressIndicator,
    noCompletedStepRepeated: true,
  };
}

/**
 * The shipping method step: the fulfilment choice of each line (CHK-005), the preferred delivery
 * date and window (CHK-006) and the delivery instructions. Each is checked on the server, and a
 * failure comes back against the line or the field it belongs to.
 */
async function submitShippingMethodAsync({
  sessionId, customer, storeId = 1, values = {}, session,
}) {
  const fieldErrors = {};
  const lineErrors = [];

  // AC-CHK-005-01-01: the choice of each line, stored per line
  for (const line of values.lines ?? []) {
    const result = await setLineFulfilmentAsync({
      shoppingCartItemId: Number(line.itemId ?? line.shoppingCartItemId),
      method: line.method,
      pickupPointId: line.pickupPointId ?? null,
      storeId,
    });
    if (result.ok !== true) {
      lineErrors.push({
        itemId: Number(line.itemId ?? line.shoppingCartItemId),
        message: result.message,
        messageKey: result.messageKey ?? null,
      });
    }
  }

  // every line must carry a choice, and a collected line must name its outlet
  const cart = await getCartAsync({ sessionId, customer, storeId });
  for (const item of cart.items) {
    if (!item.fulfilment) {
      lineErrors.push({ itemId: item.id, message: `Choose delivery or collection for ${item.product.name}.` });
    } else if (item.fulfilment === 'pickup' && !item.pickupPointId) {
      lineErrors.push({ itemId: item.id, message: `Choose an outlet to collect ${item.product.name} from.` });
    }
  }

  // CHK-006: the preferred date and the window of that date
  const desiredDeliveryDate = values.desiredDeliveryDate ?? session.desiredDeliveryDate ?? null;
  const deliverySlotId = values.deliverySlotId != null && values.deliverySlotId !== ''
    ? Number(values.deliverySlotId)
    : null;
  if (deliverySlotId) {
    const offered = await windowsAsync({
      shippingMethod: values.shippingMethod ?? null,
      area: values.area ?? session.shippingAddress?.city ?? null,
      date: desiredDeliveryDate,
      storeId,
    });
    if (!offered.windows.some((w) => Number(w.id) === deliverySlotId)) {
      fieldErrors.deliverySlotId = resource('Chk.SlotFull');
    }
  }

  // CHK-006-02: the instructions, where the store offers the attribute
  let instructions = null;
  if (values.instructions !== undefined) {
    instructions = await setInstructionsAsync({ session, text: values.instructions, storeId });
    if (instructions.ok !== true && instructions.offered !== false) {
      fieldErrors.instructions = instructions.message;
    }
  }

  if (lineErrors.length || Object.keys(fieldErrors).length) {
    const state = await stepStateAsync({
      sessionId, customer, storeId, currentStep: 'shipping-method',
    });
    return {
      ok: false,
      step: 'shipping-method',
      fieldErrors,
      lineErrors,
      values,
      valuesKept: true,
      progressIndicator: state.progressIndicator,
      validatedOn: 'the server (ModelState)',
    };
  }

  const fresh = await sessionRepo().getByIdAsync(session.id);
  await sessionRepo().updateAsync({
    ...fresh,
    desiredDeliveryDate,
    deliverySlotId,
    shippingMethod: values.shippingMethod ?? fresh.shippingMethod ?? null,
  });
  const completed = [...new Set([...(fresh.completedSteps ?? []), 'shipping-method'])];
  await sessionRepo().updateAsync({
    ...await sessionRepo().getByIdAsync(session.id), completedSteps: completed,
  });
  const state = await stepStateAsync({ sessionId, customer, storeId });
  return {
    ok: true,
    step: 'shipping-method',
    completedSteps: completed,
    nextStep: state.currentStep,
    progressIndicator: state.progressIndicator,
    desiredDeliveryDate,
    deliverySlotId,
    instructions: instructions?.description ?? null,
  };
}

/**
 * AC-CHK-002-03-01: what the confirm step shows, every line and every amount, before payment is
 * executed. The totals are the server's own (BR-CHK-003).
 */
export async function confirmSummaryAsync({
  sessionId, customer, storeId = 1, paymentMethodSystemName = null,
}) {
  const cart = await getCartAsync({ sessionId, customer, storeId });
  const totals = await totalsAsync({
    sessionId, customer, storeId, paymentMethodSystemName,
  });
  const session = await openSessionAsync({ sessionId, customer, storeId });
  await sessionRepo().updateAsync({ ...session, shownTotal: totals.total, shownOnUtc: new Date().toISOString() });
  return {
    reference: session.reference,
    lines: cart.items.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      fulfilment: i.fulfilment ?? null,
    })),
    subtotal: totals.subtotal,
    discount: totals.discount ?? 0,
    tax: totals.tax ?? 0,
    paymentFee: totals.paymentFee ?? 0,
    deliveryFee: totals.deliveryFee ?? 0,
    total: totals.total,
    currency: totals.currency,
    paymentExecuted: false,
    calculatedOn: 'the server',
    rule: 'BR-CHK-003',
  };
}
