// PRD-CHK-003 checkout validation: the one host every other module plugs into.
//
// Under decision OVR-REG, CHK-003 owns the only IShoppingCartService override (BR-CHK-015) and
// the only IOrderProcessingService override (BR-CHK-006). This file holds what those overrides
// do: the native warnings with their own resource keys, the cart check providers (IC-CHK-01),
// the one line subtotal adjuster (IC-CHK-05), the placement validators (IC-CHK-02), the
// placement participants (IC-CHK-06), the order-action guards (IC-CHK-07) and the cancellation
// participants (IC-CHK-08). Nothing here depends on an optional pack (D-01).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { runProviders, providers, registerProvider } from '../../../core/providers.js';
import { withLockAsync } from '../../../core/locker.js';
import { auditAsync } from '../../../core/audit.js';

/** The native warning keys the override produces, so a replacer can match one by key. */
export const NATIVE_WARNINGS = {
  outOfStock: 'ShoppingCart.OutOfStock',
  quantityExceedsStock: 'ShoppingCart.QuantityExceedsStock',
  minimumQuantity: 'ShoppingCart.MinimumQuantity',
  maximumQuantity: 'ShoppingCart.MaximumQuantity',
  allowedQuantities: 'ShoppingCart.AllowedQuantities',
  callForPrice: 'Products.CallForPrice',
  unpublished: 'ShoppingCart.ProductUnpublished',
  deleted: 'ShoppingCart.ProductDeleted',
  notAvailable: 'ShoppingCart.ProductNotAvailable',
  selectVendor: 'ShoppingCart.SelectVendorToCheckout',
};

/** AC-CHK-003-02-03: the order the checks run in, and the first failure stops placement. */
export const CHECK_ORDER = [
  'stock and availability',
  'price',
  'buyer eligibility',
  'payment method',
  'fraud signals',
];

/* ====================================================== IC-CHK-01 cart checks ========== */

/**
 * A cart check provider lives in the one provider registry, so a module that registered through
 * ctx.providers.registerProvider('IC-CHK-01', ...) is called by the override as well. The only
 * thing this wrapper adds is the declaration that a provider replaces a named native warning.
 */
export function registerCartCheckProvider({
  area, feature, name, fn, replacesWarning = null,
}) {
  if (replacesWarning && !Object.values(NATIVE_WARNINGS).includes(replacesWarning)) {
    throw new Error(`IC-CHK-01: ${replacesWarning} is not a native warning key`);
  }
  const existing = replacesWarning
    ? providers('IC-CHK-01').find((p) => p.replacesWarning === replacesWarning && p.feature !== feature)
    : null;
  if (existing) {
    throw new Error(`IC-CHK-01: ${replacesWarning} is already replaced by ${existing.feature} (BR-CHK-015)`);
  }
  return registerProvider('IC-CHK-01', {
    area, feature, name, fn, replacesWarning,
  });
}

export const cartCheckProvidersRegistered = () => providers('IC-CHK-01')
  .map(({ fn, ...rest }) => rest);

/**
 * The protected GetStandardWarningsAsync of the override: the native checks, each with the
 * resource key the native service uses, so a registered replacer can match one by key
 * (BR-CHK-015 - no warning is ever matched on its text).
 */
export async function standardWarningsAsync({
  product, quantity = 1, customer = null, storeId = 1, cartType = 1,
}) {
  const warnings = [];
  const add = (key, text, extra = {}) => warnings.push({
    key, message: text, native: true, ...extra,
  });

  if (!product) {
    add(NATIVE_WARNINGS.deleted, 'That product is no longer available.');
    return warnings;
  }
  if (product.deleted === true) add(NATIVE_WARNINGS.deleted, 'That product is no longer available.');
  if (product.published === false) add(NATIVE_WARNINGS.unpublished, 'That product is no longer available.');

  // the store mapping and the customer-role ACL of the native checks
  const { authorizedForStoreAsync } = await import('../../../core/store-mapping.js');
  if (!await authorizedForStoreAsync('Product', product, storeId)) {
    add(NATIVE_WARNINGS.notAvailable, 'That product is not available in this store.');
  }
  if (product.subjectToAcl === true && (product.limitedToCustomerRoles ?? []).length) {
    const roles = customer?.roles ?? ['Guests'];
    if (!product.limitedToCustomerRoles.some((r) => roles.includes(r))) {
      add(NATIVE_WARNINGS.notAvailable, 'That product is not available to you.');
    }
  }

  if (product.callForPrice === true) add(NATIVE_WARNINGS.callForPrice, resource('Products.CallForPrice') || 'Call for price');

  if (cartType === 1) {
    const minimum = Number(product.orderMinimumQuantity ?? 1);
    const maximum = product.orderMaximumQuantity === undefined ? null : Number(product.orderMaximumQuantity);
    if (quantity < minimum) {
      add(NATIVE_WARNINGS.minimumQuantity, `The minimum quantity for ${product.name} is ${minimum}.`);
    }
    if (maximum !== null && quantity > maximum) {
      add(NATIVE_WARNINGS.maximumQuantity, `The maximum quantity for ${product.name} is ${maximum}.`);
    }
    if ((product.allowedQuantities ?? '').length) {
      const allowed = String(product.allowedQuantities).split(',').map((q) => Number(q.trim()));
      if (!allowed.includes(Number(quantity))) {
        add(NATIVE_WARNINGS.allowedQuantities, `The allowed quantities are ${allowed.join(', ')}.`);
      }
    }
    if ((product.manageInventoryMethod ?? 'ManageStock') === 'ManageStock') {
      const stock = Number(product.stockQuantity ?? 0);
      if (stock <= 0) add(NATIVE_WARNINGS.outOfStock, `${product.name} is out of stock.`, { stock });
      else if (quantity > stock) {
        add(NATIVE_WARNINGS.quantityExceedsStock, `We have only ${stock} of ${product.name} in stock.`, { stock });
      }
    }
  }
  return warnings;
}

/**
 * GetShoppingCartItemWarningsAsync. The native checks run first, then every provider in its
 * registered order; a provider may only add warnings, except the registered replacer of a named
 * native warning. A provider error refuses the item and is logged: the check fails closed.
 */
export async function itemWarningsAsync({
  product, quantity = 1, customer = null, storeId = 1, cartType = 1, item = null,
  fulfilment = null, attributesXml = null, rental = null, sessionId = null, cart = null,
}) {
  let warnings = await standardWarningsAsync({
    product, quantity, customer, storeId, cartType,
  });
  const ran = [];
  for (const provider of providers('IC-CHK-01')) {
    let result;
    try {
      result = await provider.fn({
        product,
        quantity,
        customer,
        storeId,
        cartType,
        item,
        fulfilment,
        attributesXml,
        rental,
        // the cart this line belongs to, for a rule that looks at the other lines
        sessionId: sessionId ?? item?.sessionId ?? null,
        cart,
        nativeWarnings: warnings.map((w) => ({ key: w.key, message: w.message })),
      });
    } catch (err) {
      await repository('Log').insertAsync({
        level: 'Error',
        shortMessage: `IC-CHK-01 provider ${provider.feature} failed`,
        fullMessage: err.message,
        feature: 'PRD-CHK-003',
        createdOnUtc: new Date().toISOString(),
      });
      return {
        warnings: [{
          key: 'Chk.CartCheckUnavailable', message: resource('Chk.CartCheckUnavailable'), provider: provider.feature, failedClosed: true,
        }],
        refused: true,
        failedClosed: true,
        ran,
      };
    }
    ran.push({ feature: provider.feature, name: provider.name, replacesWarning: provider.replacesWarning });
    if (!result) continue;

    if (provider.replacesWarning) {
      // only the registered replacer may drop or replace that key, and only that key
      if (result.drop === true || result.replaceWith) {
        warnings = warnings.filter((w) => w.key !== provider.replacesWarning);
      }
      for (const added of result.replaceWith ?? []) {
        warnings.push({ ...added, replacedBy: provider.feature, native: false });
      }
    }
    for (const added of result.warnings ?? []) {
      // a provider may return a plain string, which is what the modules built before this host
      // do; anything else it puts on the warning (the rule it came from, what the shopper may do
      // instead) travels with it
      const extra = typeof added === 'string' ? {} : added;
      warnings.push({
        ...extra,
        key: added.key ?? `${provider.feature}.warning`,
        message: typeof added === 'string' ? added : (added.message ?? String(added)),
        addedBy: provider.feature,
        native: false,
      });
    }
  }
  return {
    warnings, refused: warnings.length > 0, ran, providers: providers('IC-CHK-01').length,
  };
}

/**
 * PRD-CHK-010: the native minimum order value. OrderSettings.MinOrderSubtotalAmount and
 * MinOrderTotalAmount are store-overridable, and the native warnings name the minimum.
 */
export async function minimumOrderWarningsAsync({
  cart, storeId = 1, total = null, currency = null,
}) {
  const [minSubtotal, minTotal, includingTax] = await Promise.all([
    getSettingAsync('ordersettings.minordersubtotalamount', storeId, 0),
    getSettingAsync('ordersettings.minordertotalamount', storeId, 0),
    getSettingAsync('ordersettings.minordersubtotalamountincludingtax', storeId, false),
  ]);
  const warnings = [];
  const subtotal = Number(cart?.subtotal ?? 0);
  const money = (n) => `${currency ? `${currency} ` : ''}${Number(n).toFixed(2)}`;
  if (Number(minSubtotal) > 0 && subtotal < Number(minSubtotal)) {
    warnings.push({
      key: 'Checkout.MinOrderSubtotalAmount',
      message: `The minimum order subtotal amount is ${money(minSubtotal)}.`,
      minimum: Number(minSubtotal),
      includingTax: includingTax === true,
      native: true,
    });
  }
  if (Number(minTotal) > 0 && total !== null && Number(total) < Number(minTotal)) {
    warnings.push({
      key: 'Checkout.MinOrderTotalAmount',
      message: `The minimum order total amount is ${money(minTotal)}.`,
      minimum: Number(minTotal),
      native: true,
    });
  }
  return {
    warnings,
    refused: warnings.length > 0,
    minOrderSubtotalAmount: Number(minSubtotal),
    minOrderTotalAmount: Number(minTotal),
    storeId,
  };
}

/** GetShoppingCartWarningsAsync: the same, for the whole cart. */
export async function cartWarningsAsync({
  cart, customer = null, storeId = 1, fulfilment = null, total = null, currency = null,
}) {
  const warnings = [];
  // PRD-CHK-010: the cart as a whole must reach the store's minimum
  const minimum = await minimumOrderWarningsAsync({
    cart, storeId, total, currency,
  });
  warnings.push(...minimum.warnings);
  for (const line of cart.items ?? []) {
    const product = line.product ?? await repository('Product').getByIdAsync(line.productId);
    const result = await itemWarningsAsync({
      product,
      quantity: line.quantity,
      customer,
      storeId,
      item: line,
      cart,
      sessionId: line.sessionId ?? null,
      fulfilment: fulfilment ?? line.fulfilment ?? null,
    });
    for (const warning of result.warnings) warnings.push({ ...warning, itemId: line.id, productId: product?.id ?? line.productId });
    if (result.failedClosed) return { warnings, refused: true, failedClosed: true };
  }
  return { warnings, refused: warnings.length > 0 };
}

/* ====================================================== IC-CHK-05 subtotal adjuster ==== */

let subtotalAdjuster = null;

export function registerSubtotalAdjuster({ area, feature, name, fn }) {
  if (subtotalAdjuster && subtotalAdjuster.feature !== feature) {
    throw new Error(`IC-CHK-05: the line subtotal adjuster is already registered by ${subtotalAdjuster.feature} (BR-CHK-015)`);
  }
  subtotalAdjuster = {
    area, feature, name, fn,
  };
  return subtotalAdjuster;
}

export const subtotalAdjusterRegistered = () => (subtotalAdjuster
  ? { area: subtotalAdjuster.area, feature: subtotalAdjuster.feature, name: subtotalAdjuster.name }
  : null);

export function clearSubtotalAdjuster() { subtotalAdjuster = null; }

/**
 * GetSubTotalAsync: the native result first, then the one adjuster, and the same adjusted value
 * is what the cart page, the order totals and the placement all use.
 */
export async function subTotalAsync({
  item, includeDiscounts = true, customer = null, storeId = 1,
}) {
  const unit = Number(item.unitPrice ?? item.price ?? 0);
  const native = {
    subTotal: Number((unit * Number(item.quantity ?? 1)).toFixed(2)),
    discountAmount: Number(item.discountAmount ?? 0),
    appliedDiscounts: item.appliedDiscounts ?? [],
    maximumDiscountQty: item.maximumDiscountQty ?? null,
  };
  if (!subtotalAdjuster) return { ...native, adjustedBy: null, includeDiscounts };
  const adjusted = await subtotalAdjuster.fn({
    item, includeDiscounts, native, customer, storeId,
  });
  return {
    subTotal: Number((adjusted?.subTotal ?? native.subTotal).toFixed(2)),
    discountAmount: Number(adjusted?.discountAmount ?? native.discountAmount),
    appliedDiscounts: adjusted?.appliedDiscounts ?? native.appliedDiscounts,
    maximumDiscountQty: adjusted?.maximumDiscountQty ?? native.maximumDiscountQty,
    adjustedBy: subtotalAdjuster.feature,
    includeDiscounts,
  };
}

/* ====================================================== IC-CHK-07 order-action guards == */

export function registerOrderActionGuard({
  area, feature, name, fn,
}) {
  return registerProvider('IC-CHK-07', {
    area, feature, name, fn,
  });
}

/**
 * The override of ShipAsync, ReadyForPickupAsync and DeliverAsync: the guards run before the
 * native method, and a refusal raises an error carrying the guard's message, so every path -
 * admin, seller, tracking, handover, API - is refused the same way (AC-CHK-003-04-03).
 */
export async function guardOrderActionAsync({
  action, order, shipment = null, actor = null,
}) {
  if (!['Ship', 'ReadyForPickup', 'Deliver'].includes(action)) {
    return { ok: false, message: `${action} is not a guarded order action` };
  }
  const results = await runProviders('IC-CHK-07', 'firstFail', {
    action, order, shipment, actor, to: action === 'Ship' ? 'Dispatched' : (action === 'ReadyForPickup' ? 'ReadyForPickup' : 'Delivered'),
  });
  const refused = results.find((r) => r.result && r.result.ok === false);
  if (refused) {
    return {
      ok: false,
      refusedBy: refused.feature,
      messageKey: refused.result.messageKey ?? null,
      message: refused.result.message,
      nativeMethodRun: false,
      action,
    };
  }
  return {
    ok: true, action, guards: results.length, nativeMethodRun: true,
  };
}

/* ====================================================== IC-CHK-08 cancellation ========= */

export function registerCancellationParticipant({
  area, feature, name, fn,
}) {
  return registerProvider('IC-CHK-08', {
    area, feature, name, fn,
  });
}

/**
 * CancelOrderAsync: the native cancellation runs first, then each participant. A participant
 * error is logged and listed as a checkout exception, and the cancellation stands
 * (AC-CHK-003-04-04, BR-CHK-021).
 */
export async function cancelOrderAsync({
  orderNumber, reason = null, actor = 'admin', storeId = 1,
}) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  const previousStatus = order.orderStatus;
  const cancelled = await repository('Order').updateAsync({
    ...order,
    orderStatus: 'Cancelled',
    stage: 'Cancelled',
    cancelledOnUtc: new Date().toISOString(),
    cancellationReason: reason,
  });

  const results = await runProviders('IC-CHK-08', 'collect', {
    order: cancelled, previousStatus, reason, actor, storeId,
  });
  const failures = [];
  for (const result of results) {
    if (result.error || result.result?.ok === false) {
      const message = result.error ?? result.result?.message ?? 'the participant failed';
      failures.push({ feature: result.feature, message });
      await repository('CheckoutException').insertAsync({
        kind: 'cancellation-participant',
        orderNumber,
        feature: result.feature,
        message,
        createdOnUtc: new Date().toISOString(),
      });
    }
  }
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: 'PRD-CHK-003',
    entity: 'Order',
    entityId: order.id,
    actor,
    before: { orderStatus: previousStatus },
    after: { orderStatus: 'Cancelled', participantFailures: failures.length },
    storeId,
    note: 'order cancelled',
  });
  return {
    ok: true,
    order: cancelled,
    nativeFirst: true,
    participants: results.length,
    failures,
    cancellationStands: true,
    rule: 'BR-CHK-021',
  };
}

/* ====================================================== IC-CHK-06 participants ========= */

export function registerPlacementParticipant({
  area, feature, name, lockKey, fn,
}) {
  return registerProvider('IC-CHK-06', {
    area, feature, name, lockKey, fn,
  });
}

/**
 * The Reserve phase: each participant reserves under its own lock key; a refusal releases the
 * reservations already taken and stops the placement (BR-CHK-020).
 */
export async function reserveAsync(context) {
  const taken = [];
  for (const participant of providers('IC-CHK-06')) {
    const key = typeof participant.lockKey === 'function'
      ? participant.lockKey(context)
      : (participant.lockKey ?? `chk-participant-${participant.feature}`);
    let result;
    try {
      result = await withLockAsync(key, () => participant.fn({ ...context, phase: 'Reserve' }));
    } catch (err) {
      result = { ok: false, message: err.message };
    }
    if (result && result.ok === false) {
      await releaseAsync({ reservations: taken, reason: `the ${participant.feature} reservation was refused` });
      return {
        ok: false,
        refusedBy: participant.feature,
        messageKey: result.messageKey ?? null,
        message: result.message,
        released: taken.length,
        rule: 'BR-CHK-020',
      };
    }
    taken.push({
      feature: participant.feature,
      name: participant.name,
      lockKey: key,
      reservation: result?.reservation ?? result ?? null,
    });
  }
  return { ok: true, reservations: taken, rule: 'BR-CHK-020' };
}

/** Confirm, per saved sub-order, before OrderPlacedEvent. */
export async function confirmAsync({ reservations = [], order, storeId = 1 }) {
  const confirmed = [];
  // every participant hears Confirm for each saved sub-order, whether or not it reserved
  // anything: PAY-011 links the sub-order to the group payment and ORD-005 creates the seller
  // task at this point, not from an event consumer (BR-CHK-006).
  for (const participant of providers('IC-CHK-06')) {
    const held = reservations.find((r) => r.feature === participant.feature) ?? null;
    try {
      await participant.fn({
        phase: 'Confirm', reservation: held?.reservation ?? null, order, storeId,
      });
      confirmed.push(participant.feature);
    } catch (err) {
      await repository('CheckoutException').insertAsync({
        kind: 'participant-confirm',
        orderNumber: order?.orderNumber ?? null,
        feature: participant.feature,
        message: err.message,
        createdOnUtc: new Date().toISOString(),
      });
    }
  }
  return { confirmed, beforeOrderPlacedEvent: true };
}

/** Release, when a later reservation, the payment or the placement fails. */
export async function releaseAsync({ reservations = [], reason = null }) {
  const released = [];
  for (const held of reservations) {
    const participant = providers('IC-CHK-06').find((p) => p.feature === held.feature);
    if (!participant) continue;
    try {
      await participant.fn({ phase: 'Release', reservation: held.reservation, reason });
      released.push(held.feature);
    } catch { /* a release that fails is not allowed to mask the original failure */ }
  }
  return { released, reason };
}

/* ====================================================== the ordered checks ============= */

/**
 * AC-CHK-003-02-03: the checks run in the order the chapter states and the first failure stops
 * the placement, with its own message key.
 */
export async function runCheckOrderAsync({
  cart, customer = null, storeId = 1, paymentMethodSystemName = null, shownTotal = null,
  currentTotal = null, fulfilment = null, paymentMethod = null, address = null,
  pickupPointId = null, sellerIds = [], multiSeller = false,
}) {
  const steps = [];

  // 1. stock and availability (and the store's own minimum order value, CHK-010)
  const stock = await cartWarningsAsync({
    cart, customer, storeId, fulfilment, total: currentTotal, currency: cart?.currency ?? null,
  });
  steps.push({ check: 'stock and availability', failed: stock.refused });
  if (stock.refused) {
    const first = stock.warnings[0];
    return {
      ok: false,
      stoppedAt: 'stock and availability',
      messageKey: first.key,
      message: first.message,
      warnings: stock.warnings,
      steps,
      paymentInitiated: false,
    };
  }

  // 2. price (BR-CHK-004)
  const priceMoved = shownTotal !== null && currentTotal !== null
    && Number(shownTotal).toFixed(2) !== Number(currentTotal).toFixed(2);
  steps.push({ check: 'price', failed: priceMoved });
  if (priceMoved) {
    return {
      ok: false,
      stoppedAt: 'price',
      messageKey: 'Chk.PriceChanged',
      message: resource('Chk.PriceChanged'),
      newTotal: currentTotal,
      steps,
      paymentInitiated: false,
      rule: 'BR-CHK-004',
    };
  }

  // 3. buyer eligibility: the sign-in rule, the terms, and the IC-CHK-02 validators that check
  //    who may buy (restrictions, cart rules, approval)
  const guestAllowed = await getSettingAsync('ordersettings.anonymouscheckoutallowed', storeId, true);
  if (guestAllowed !== true && !customer) {
    steps.push({ check: 'buyer eligibility', failed: true });
    return {
      ok: false,
      stoppedAt: 'buyer eligibility',
      messageKey: 'Chk.SignInRequired',
      message: 'Sign in or register to place this order.',
      steps,
      paymentInitiated: false,
    };
  }
  steps.push({ check: 'buyer eligibility', failed: false });

  // 4. payment method: the method itself must be active and allowed for this cart, and then the
  //    IC-CHK-02 validators the PAY module registers get their say; 5. fraud signals are the
  //    IC-CHK-02 validators that score the order. Both run in their registered order.
  if (paymentMethod && paymentMethod.valid === false) {
    steps.push({ check: 'payment method', failed: true });
    return {
      ok: false,
      stoppedAt: 'payment method',
      messageKey: paymentMethod.messageKey ?? null,
      message: paymentMethod.message ?? null,
      steps,
      paymentInitiated: false,
    };
  }
  // the validators see the cart as it will be placed: who is buying, how it will be fulfilled,
  // where it is going and which sellers are in it (PAY-001 reads all four, BR-PAY-002)
  const validators = await runProviders('IC-CHK-02', 'firstFail', {
    cart,
    customer,
    storeId,
    paymentMethodSystemName,
    total: currentTotal,
    fulfilment,
    address,
    pickupPointId,
    sellerIds,
    multiSeller,
  });
  const refused = validators.find((r) => r.result && r.result.ok === false);
  steps.push({ check: 'payment method', failed: Boolean(refused) });
  steps.push({ check: 'fraud signals', failed: false });
  if (refused) {
    return {
      ok: false,
      stoppedAt: refused.result.check ?? 'payment method',
      refusedBy: refused.feature,
      messageKey: refused.result.messageKey ?? null,
      message: refused.result.message,
      steps,
      paymentInitiated: false,
    };
  }

  return {
    ok: true, steps, checkOrder: CHECK_ORDER, paymentInitiated: false,
  };
}

export const placementValidatorsRegistered = () => providers('IC-CHK-02')
  .map(({ fn, ...rest }) => rest);
export const placementParticipantsRegistered = () => providers('IC-CHK-06')
  .map(({ fn, ...rest }) => rest);
export const orderActionGuardsRegistered = () => providers('IC-CHK-07')
  .map(({ fn, ...rest }) => rest);
export const cancellationParticipantsRegistered = () => providers('IC-CHK-08')
  .map(({ fn, ...rest }) => rest);
