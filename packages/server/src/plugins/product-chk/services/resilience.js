// CHK-008 checkout resilience and idempotency.
//
// BR-CHK-012 / SM-CHK-01: one CheckoutSession per customer and store is open at a time; its
// reference is unique, not guessable, and kept on every order it produced.
// BR-CHK-006: with OrderSettings.PlaceOrderWithLock on, the native per-customer mutex is taken
// once for the whole checkout and the minimum-interval cache key is set once, after the last
// sub-order is saved, so a second sub-order is never refused by the interval check.

import { createHash, randomBytes } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { lockHistory } from '../../../core/locker.js';

const sessionRepo = () => repository('CheckoutSession');
const orderRepo = () => repository('Order');

/** The native interval cache: one key per customer, set once per checkout (BR-CHK-006). */
const intervalCache = new Map();

export const INTERVAL_MESSAGE_KEY = 'Checkout.MinOrderPlacementInterval';

export function orderWithLockCacheKey(customerId) {
  return `nop.pres.order-with-lock-${customerId ?? 'guest'}`;
}

/** AC-CHK-008-03-01: the native minimum placement interval, in minutes. */
export async function placementIntervalGuardAsync({ customer, sessionId, storeId = 1 }) {
  const withLock = await getSettingAsync('ordersettings.placeorderwithlock', storeId, true);
  const minutes = Number(await getSettingAsync('ordersettings.minimumorderplacementinterval', storeId, 1));
  const key = orderWithLockCacheKey(customer?.id ?? sessionId);
  const last = intervalCache.get(key) ?? null;
  if (withLock !== true || !minutes || !last) {
    return { ok: true, withLock: withLock === true, intervalMinutes: minutes };
  }
  const elapsed = (Date.now() - last) / 60000;
  if (elapsed >= minutes) return { ok: true, withLock: true, intervalMinutes: minutes };
  return {
    ok: false,
    refused: true,
    withLock: true,
    intervalMinutes: minutes,
    messageKey: INTERVAL_MESSAGE_KEY,
    // the native resource text, reused unchanged (CHK section 11.2)
    message: `You can place the next order in ${minutes} minute(s).`,
    orderCreated: false,
  };
}

/** Set once, after every sub-order of the checkout is saved. */
export function markPlacement({ customer, sessionId }) {
  const key = orderWithLockCacheKey(customer?.id ?? sessionId);
  intervalCache.set(key, Date.now());
  return { key, setOnceForTheCheckout: true };
}

export function clearPlacementInterval(customerOrSession = null) {
  if (customerOrSession === null) intervalCache.clear();
  else intervalCache.delete(orderWithLockCacheKey(customerOrSession));
  return { cleared: true };
}

/** How many times the native placement mutex was taken for a customer during a checkout. */
export function placementLockCount(customerId) {
  return lockHistory().filter((l) => l.key === `nop-order-placement-${customerId}`).length;
}

/* ================================================== the idempotency key (PLT-027) ====== */

/** The cart as the confirm request saw it, so a repeated request is recognised. */
export function cartHash(cart) {
  const lines = (cart?.items ?? [])
    .map((i) => `${i.productId}:${i.quantity}:${i.unitPrice}:${i.fulfilment ?? ''}:${i.pickupPointId ?? ''}`)
    .sort();
  return createHash('sha256').update(lines.join('|')).digest('hex').slice(0, 32);
}

export function idempotencyKey({ reference, cart }) {
  return `${reference}:${cartHash(cart)}`;
}

/**
 * AC-CHK-008-03-02: where PLT-027 idempotency keys are delivered, the second confirm request of
 * the same checkout and cart gets the orders of the first instead of a second order or charge.
 * Until PLT-027 is delivered the setting is off and the native per-host lock and interval are
 * the only protection (AC-CHK-008-03-04).
 */
export async function idempotentPlacementAsync({ session, cart, storeId = 1 }) {
  const enabled = await getSettingAsync('plt.idempotencykeysenabled', storeId, false);
  const key = idempotencyKey({ reference: session.reference, cart });
  if (enabled !== true) {
    return {
      enabled: false, key, replay: false, feature: 'PRD-PLT-027', note: 'PLT-027 is not delivered: the native per-host lock and interval apply',
    };
  }
  const existing = await repository('IdempotencyKey').getOneAsync((r) => r.key === key);
  if (!existing) {
    await repository('IdempotencyKey').insertAsync({
      key,
      checkoutReference: session.reference,
      storeId,
      orderIds: [],
      state: 'InProgress',
      createdOnUtc: new Date().toISOString(),
    });
    return { enabled: true, key, replay: false };
  }
  const orders = [];
  for (const id of existing.orderIds ?? []) {
    const order = await orderRepo().getByIdAsync(id);
    if (order) orders.push(order);
  }
  return {
    enabled: true,
    key,
    replay: true,
    orders,
    checkoutReference: session.reference,
    note: 'the same request was already placed: the existing orders are returned, no second order or charge',
  };
}

export async function recordIdempotentResultAsync({ key, orders, storeId = 1 }) {
  const existing = await repository('IdempotencyKey').getOneAsync((r) => r.key === key);
  if (!existing) return { recorded: false };
  await repository('IdempotencyKey').updateAsync({
    ...existing, orderIds: orders.map((o) => o.id), state: 'Placed', storeId,
  });
  return { recorded: true, orders: orders.length };
}

/* =================================================== the order GUID (AC-CHK-008-03-03) = */

/**
 * The native SetProcessPaymentRequestAsync behaviour: a retry inside
 * PaymentSettings.RegenerateOrderGuidInterval keeps the same OrderGuid, so the provider sees the
 * same merchant reference.
 */
export async function orderGuidForAsync({ session, storeId = 1 }) {
  const minutes = Number(await getSettingAsync('paymentsettings.regenerateorderguidinterval', storeId, 3));
  const now = Date.now();
  const issuedAt = session.orderGuidIssuedOnUtc ? Date.parse(session.orderGuidIssuedOnUtc) : null;
  const withinInterval = session.checkoutOrderGuid && issuedAt !== null
    && (now - issuedAt) / 60000 < minutes;
  if (withinInterval) {
    return {
      orderGuid: session.checkoutOrderGuid,
      reused: true,
      intervalMinutes: minutes,
      merchantReference: session.reference,
    };
  }
  const orderGuid = randomBytes(8).toString('hex');
  await sessionRepo().updateAsync({
    ...await sessionRepo().getByIdAsync(session.id),
    checkoutOrderGuid: orderGuid,
    orderGuidIssuedOnUtc: new Date(now).toISOString(),
  });
  return {
    orderGuid, reused: false, intervalMinutes: minutes, merchantReference: session.reference,
  };
}

/* ============================================ the session's own row version (01-03) ==== */

/**
 * AC-CHK-008-01-03: two requests that update the same CheckoutSession do not overwrite each
 * other - the second write fails on the row version and is retried after re-reading.
 */
export async function updateSessionAsync({ id, changes, expectedRowVersion = null, retries = 1 }) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const current = await sessionRepo().getByIdAsync(id);
    if (!current) return { ok: false, message: 'checkout session not found' };
    const version = Number(current.rowVersion ?? 0);
    const expected = attempt === 0 && expectedRowVersion !== null ? Number(expectedRowVersion) : version;
    if (expected !== version) {
      if (attempt === retries) {
        return {
          ok: false,
          conflict: true,
          rowVersion: version,
          message: 'The checkout was changed in another window. Please try again.',
        };
      }
      continue; // re-read and try again
    }
    const saved = await sessionRepo().updateAsync({
      ...current, ...changes, rowVersion: version + 1,
    });
    return {
      ok: true, session: saved, rowVersion: saved.rowVersion, retried: attempt > 0,
    };
  }
  return { ok: false, conflict: true };
}

/* ================================== the go-live item CHK contributes (AC-CHK-008-03-04) */

/**
 * BR-PLT-004: until PLT-027 is delivered, checkout is served by one web node only, because the
 * native placement lock is per host. CHK-008 supplies the item; PLT-001 records it on the
 * instance checklist and refuses to set the instance Active while it fails.
 */
export async function checkoutNodeReadinessAsync({ storeId = 1 } = {}) {
  const nodes = Number(await getSettingAsync('plt.webnodesservingcheckout', storeId, 1));
  const idempotency = await getSettingAsync('plt.idempotencykeysenabled', storeId, false);
  const ok = nodes <= 1 || idempotency === true;
  return {
    check: 'checkout is served by one web node until idempotency keys are delivered',
    ok,
    webNodesServingCheckout: nodes,
    idempotencyKeysDelivered: idempotency === true,
    blocksActivation: !ok,
    rule: 'BR-PLT-004',
    feature: 'PRD-CHK-008',
    dependsOn: 'PRD-PLT-027',
    message: ok
      ? null
      : `Checkout is served by ${nodes} web nodes and idempotency keys are not delivered: the native placement lock holds on one host only.`,
  };
}

/* ========================================== resuming an interrupted checkout (02-02) == */

/**
 * AC-CHK-008-02-02: the cart, the addresses, the chosen shipping option and the payment method
 * are kept until placement resets the checkout data, so the shopper who comes back finds the
 * same checkout and the same reference.
 */
export async function resumeAsync({ sessionId, customer, storeId = 1 }) {
  const session = await sessionRepo().getOneAsync((s) => (customer
    ? Number(s.customerId) === Number(customer.id)
    : s.sessionId === sessionId)
    && Number(s.storeId) === Number(storeId)
    && s.state === 'Open');
  if (!session) return { resumed: false, reference: null };
  const items = await repository('ShoppingCartItem').getAllAsync((i) => (customer
    ? Number(i.customerId) === Number(customer.id)
    : i.sessionId === sessionId) && i.cartType === 1);
  return {
    resumed: true,
    reference: session.reference,
    sameReference: true,
    cartLines: items.length,
    billingAddress: session.billingAddress ?? null,
    shippingAddress: session.shippingAddress ?? null,
    shippingMethod: session.shippingMethod ?? null,
    desiredDeliveryDate: session.desiredDeliveryDate ?? null,
    deliverySlotId: session.deliverySlotId ?? null,
    paymentMethodSystemName: session.paymentMethodSystemName ?? null,
    completedSteps: session.completedSteps ?? [],
    state: session.state,
    citation: 'checkout data is kept until ResetCheckoutDataAsync runs after placement',
  };
}

/**
 * AC-CHK-008-02-01: an order whose payment was interrupted offers to complete the payment
 * through the PAY retry path (the native RePostPayment for redirection methods).
 */
export async function resumePaymentAsync({ orderNumber, storeId = 1 }) {
  const order = await orderRepo().getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return null;
  const allowReposting = await getSettingAsync('paymentsettings.allowrepostingpayments', storeId, true);
  const canRetry = order.paymentStatus === 'Pending' && allowReposting === true;
  return {
    orderNumber: order.orderNumber,
    checkoutReference: order.checkoutReference,
    paymentStatus: order.paymentStatus,
    canCompletePayment: canRetry,
    retryThrough: canRetry ? 'PRD-PAY-011 (native RePostPayment for redirection methods)' : null,
    paymentMethodSystemName: order.paymentMethodSystemName,
    total: order.total,
    currency: order.currency,
  };
}
