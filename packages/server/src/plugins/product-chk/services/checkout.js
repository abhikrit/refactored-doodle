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
import { quoteFulfilmentAsync, reserveSlotAsync } from '../../product-log/services/logistics.js';

const sessionRepo = () => repository('CheckoutSession');
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
 * BR-CHK-005 validation order, run inside placement before payment:
 *   native cart and item warnings -> price check -> eligibility -> payment method -> risk.
 * The first failure stops placement.
 */
export async function validateAsync({
  sessionId, customer, storeId = 1, paymentMethodSystemName, termsAccepted, shownTotal,
}) {
  const failures = [];
  const cart = await getCartAsync({ sessionId, customer, storeId });

  if (!cart.items.length) failures.push({ step: 'cart', message: 'Your cart is empty.' });
  for (const item of cart.items) {
    if (item.callForPrice) {
      failures.push({ step: 'cart', message: `${item.product.name} is call for price and cannot be bought directly (CAT-013).` });
    }
    if (item.fulfilment === 'pickup' && !item.pickupPointId) {
      failures.push({ step: 'shipping-method', message: `Choose an outlet to collect ${item.product.name} from.` });
    }
  }
  if (failures.length) return { ok: false, failures, stoppedAt: 'native cart and item warnings' };

  // BR-CHK-004: the confirm-page total is stored server-side; a different total refuses placement
  if (shownTotal != null) {
    const totals = await totalsAsync({ sessionId, customer, storeId, paymentMethodSystemName });
    if (money(shownTotal) !== money(totals.total)) {
      return {
        ok: false,
        stoppedAt: 'price check (BR-CHK-004)',
        failures: [{ step: 'confirm', message: resource('Chk.PriceChanged'), newTotal: totals.total }],
      };
    }
  }

  // sign-in rule, AC-CHK-002-02-02 / 02-03
  const guestAllowed = await getSettingAsync('ordersettings.anonymouscheckoutallowed', storeId, true);
  if (!guestAllowed && !customer) {
    return {
      ok: false,
      stoppedAt: 'eligibility',
      failures: [{ step: 'sign-in', message: 'Sign in or register to place this order.', citation: 'REQ-MPC-FR-125; OrderSettings.AnonymousCheckoutAllowed off' }],
    };
  }

  // terms, enforced on the server by the CHK-009 action filter (BR-CHK-013)
  const termsOnConfirm = await getSettingAsync('ordersettings.termsofserviceonorderconfirmpage', storeId, false);
  if (termsOnConfirm && !termsAccepted) {
    return {
      ok: false,
      stoppedAt: 'eligibility',
      failures: [{ step: 'confirm', message: resource('Chk.TermsRequired'), citation: 'AC-CHK-002-05-01; BR-CHK-013 server-side check' }],
    };
  }

  // IC-CHK-02 validators of other modules
  const results = await runProviders('IC-CHK-02', 'firstFail', { cart, customer, storeId });
  const failed = results.find((r) => r.result && r.result.ok === false);
  if (failed) {
    return {
      ok: false,
      stoppedAt: `validator ${failed.provider} (${failed.feature})`,
      failures: [{ step: 'confirm', message: failed.result.message }],
    };
  }

  // payment method active and allowed (BR-PAY-001), and group-capable for a multi-seller cart
  const methods = await paymentMethodsForStoreAsync({ storeId, multiSeller: cart.multiSeller });
  if (!methods.available.some((m) => m.systemName === paymentMethodSystemName)) {
    const excluded = methods.excluded.find((m) => m.systemName === paymentMethodSystemName);
    return {
      ok: false,
      stoppedAt: 'payment method',
      failures: [{
        step: 'payment-method',
        message: excluded?.reason === 'no-group-support'
          ? resource('Chk.MultiSellerNotSupported')
          : resource('Chk.PaymentMethodInvalid'),
      }],
    };
  }

  return { ok: true, failures: [], cart };
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
  deliverySlotId = null, actor = 'storefront',
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

    // ---- Reserve phase (IC-CHK-06), each under its own ILocker key (BR-CHK-020) ------------
    try {
      if (deliverySlotId) {
        const slot = await reserveSlotAsync({ deliverySlotId, date: new Date().toISOString().slice(0, 10) });
        if (!slot.ok) {
          return {
            ok: false, stoppedAt: 'reserve: delivery slot', failures: [{ step: 'shipping-method', message: resource('Chk.SlotFull') }],
          };
        }
        reservations.push(slot);
      }
      const participants = await runProviders('IC-CHK-06', 'firstFail', {
        phase: 'Reserve', cart, customer, storeId, totals,
      });
      const refused = participants.find((p) => p.result && p.result.ok === false);
      if (refused) {
        return {
          ok: false,
          stoppedAt: `reserve: ${refused.provider}`,
          failures: [{ step: 'confirm', message: refused.result.message }],
        };
      }
      reservations.push(...participants.map((p) => p.result).filter(Boolean));
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
      await runProviders('IC-CHK-06', 'notify', { phase: 'Release', reservations });
      return {
        ok: false,
        stoppedAt: 'payment',
        failures: [{ step: 'payment-info', message: err.message }],
        paymentError: err.message,
      };
    }
    if (payment.status === 'Failed') {
      await runProviders('IC-CHK-06', 'notify', { phase: 'Release', reservations });
      return {
        ok: false, stoppedAt: 'payment', failures: [{ step: 'payment-info', message: payment.reason ?? 'Payment failed' }], payment,
      };
    }

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
        deliverySlotId,
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
        await orderItemRepo().insertAsync({
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
      }
      let pickupCode = null;
      if (group.fulfilment === 'pickup') {
        pickupCode = await issuePickupCodeAsync({ order, pickupPointId: group.pickupPointId, storeId });
      }
      orders.push({ ...order, pickupCode, items: group.items.length });

      // Confirm phase per saved sub-order, then the event (BR-CHK-006)
      await runProviders('IC-CHK-06', 'notify', { phase: 'Confirm', order, reservations });
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
