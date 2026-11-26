// CHK-004 multi-seller split checkout.
//
// Prototype default - decisions WF-ENG and PAY-DIRECT / LIC-01 pending (P-1): the feature is
// built as the chapter's Proposed option. The seller task list the split creates is the ORD-005
// task (WF-ENG decides the engine behind it) and paying once for several sellers goes through
// PAY group payment (PAY-DIRECT / LIC-01 decides the settlement model).
//
// BR-CHK-006: the CHK-003 placement host saves one sub-order per group the IC-CHK-11 splitter
// returns. BR-CHK-007: order-level amounts are allocated in proportion to sub-order subtotals,
// except a per-seller delivery fee, and the rounding remainder goes to the largest subtotal.
// BR-CHK-022 / decision SPLIT-PAY: a multi-seller checkout needs a payment method that declares
// group support; without one the cart cannot be confirmed (Chk.MultiSellerNotSupported).
// BR-CHK-023 / decision CART-500: the native per-seller cart settings stay off.

import { repository } from '../../../core/repository.js';
import { resource } from '../../../core/messages.js';
import { paymentMethodsForStoreAsync } from '../../product-pay/services/payments.js';

/** The decision label every screen and the trace show for this feature (P-1). */
export const PROTOTYPE_DEFAULT = 'Prototype default - decisions WF-ENG and PAY-DIRECT / LIC-01 pending';

/** VendorId 0 or none = the client's own items, counted as one seller (AC-CHK-004-01-01). */
export const sellerOf = (item) => Number(item.vendorId ?? 0);

export function sellersOf(cart) {
  return [...new Set((cart.items ?? []).map(sellerOf))];
}

/**
 * The IC-CHK-11 splitter: one group per seller and fulfilment choice (BR-CHK-009). The group key
 * is the one the fee engine and the placement host use, so a seller who both delivers and is
 * collected from gets one sub-order for each, each with its own native PickupInStore value.
 */
export function splitGroups(cart) {
  const groups = new Map();
  for (const item of cart.items ?? []) {
    const key = `${sellerOf(item)}|${item.fulfilment}|${item.pickupPointId ?? 0}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        vendorId: sellerOf(item),
        fulfilment: item.fulfilment,
        pickupPointId: item.pickupPointId,
        items: [],
      });
    }
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}

const round = (n, minorUnit = 2) => Number(Number(n).toFixed(minorUnit));

/**
 * BR-CHK-007 / AC-CHK-004-01-03 and AC-CHK-004-03-01: each order-level amount is shared out in
 * proportion to the sub-order subtotals and rounded to the currency's minor unit; the remainder
 * goes to the sub-order with the largest subtotal, so the parts add up exactly. A delivery fee
 * the LOG-002 fee engine calculated for one seller group stays with that group.
 */
export function allocate({
  groups, totals, minorUnit = 2,
}) {
  const subtotals = groups.map((g) => round(g.items.reduce((s, i) => s + i.subtotal, 0), minorUnit));
  const subtotalAll = subtotals.reduce((s, n) => s + n, 0);
  const largest = subtotals.indexOf(Math.max(...subtotals));

  const shareOut = (amount) => {
    const total = round(amount ?? 0, minorUnit);
    if (!total) return groups.map(() => 0);
    if (!subtotalAll) {
      const each = round(total / groups.length, minorUnit);
      const parts = groups.map(() => each);
      parts[largest] = round(total - each * (groups.length - 1), minorUnit);
      return parts;
    }
    const parts = subtotals.map((s) => round((total * s) / subtotalAll, minorUnit));
    const remainder = round(total - parts.reduce((s, n) => s + n, 0), minorUnit);
    parts[largest] = round(parts[largest] + remainder, minorUnit);
    return parts;
  };

  // the per-seller fees the fee engine quoted stay with their own group
  const perGroupFees = groups.map((g) => {
    const quote = (totals.perSeller ?? []).find((p) => p.key === g.key);
    return quote ? round(quote.fee, minorUnit) : null;
  });
  const quotedTotal = round(perGroupFees.filter((f) => f !== null).reduce((s, n) => s + n, 0), minorUnit);
  const deliveryLeft = round((totals.deliveryFee ?? 0) - quotedTotal, minorUnit);
  const deliveryShare = shareOut(deliveryLeft);
  const delivery = perGroupFees.map((fee, i) => round((fee ?? 0) + deliveryShare[i], minorUnit));

  const paymentFee = shareOut(totals.paymentFee);
  const discount = shareOut(totals.discount);
  const attributeFee = shareOut(totals.checkoutAttributeFee);
  const rewardPoints = shareOut(totals.rewardPointsAmount);
  const giftCards = shareOut(totals.giftCardAmount);
  const tax = shareOut(totals.tax);

  const allocations = groups.map((g, i) => ({
    key: g.key,
    vendorId: g.vendorId,
    subtotal: subtotals[i],
    deliveryFee: delivery[i],
    deliveryFeeFrom: perGroupFees[i] !== null ? 'the fee quoted for this seller' : 'a share of the order delivery fee',
    paymentFee: paymentFee[i],
    discount: discount[i],
    checkoutAttributeFee: attributeFee[i],
    rewardPointsAmount: rewardPoints[i],
    giftCardAmount: giftCards[i],
    tax: tax[i],
    total: round(
      subtotals[i] + delivery[i] + paymentFee[i] + attributeFee[i] + tax[i]
        - discount[i] - rewardPoints[i] - giftCards[i],
      minorUnit,
    ),
  }));

  return {
    allocations,
    rule: 'BR-CHK-007',
    remainderTo: groups[largest]?.key ?? null,
    addsUp: round(allocations.reduce((s, a) => s + a.total, 0), minorUnit) === round(totals.total, minorUnit),
    checkoutTotal: round(totals.total, minorUnit),
  };
}

/**
 * BR-CHK-022: which payment methods may take one payment for a cart split between sellers. With
 * none, a multi-seller cart cannot be confirmed and the cart shows Chk.MultiSellerNotSupported.
 */
export async function groupPaymentAsync({ cart, storeId = 1 }) {
  const sellers = sellersOf(cart);
  const methods = await paymentMethodsForStoreAsync({ storeId, multiSeller: sellers.length > 1 });
  const capable = methods.available.filter((m) => m.supportsGroupPayment === true);
  return {
    sellers,
    multiSeller: sellers.length > 1,
    groupPaymentAvailable: capable.length > 0,
    methodsOffered: sellers.length > 1 ? capable : methods.available,
    methodsExcluded: methods.excluded,
    supported: sellers.length <= 1 || capable.length > 0,
    messageKey: sellers.length > 1 && capable.length === 0 ? 'Chk.MultiSellerNotSupported' : null,
    message: sellers.length > 1 && capable.length === 0 ? resource('Chk.MultiSellerNotSupported') : null,
    rule: 'BR-CHK-022',
    decision: 'SPLIT-PAY',
  };
}

/**
 * The IC-CHK-01 cart check that shows the warning on the cart and checkout pages
 * (AC-CHK-004-01-07). It is a provider on the CHK-003 override, not an override of its own.
 */
export async function cartCheckAsync({ item, storeId = 1, cart = null }) {
  const lines = cart?.items ?? (item?.sessionId
    ? await repository('ShoppingCartItem').getAllAsync((i) => i.sessionId === item.sessionId && i.cartType === 1)
    : []);
  if (lines.length < 2) return { warnings: [] };
  const sellers = [...new Set(lines.map(sellerOf))];
  if (sellers.length < 2) return { warnings: [] };
  const group = await groupPaymentAsync({ cart: { items: lines }, storeId });
  if (group.supported) return { warnings: [] };
  return {
    warnings: [{ key: 'Chk.MultiSellerNotSupported', message: group.message }],
    refusedBy: 'group payment',
  };
}

/* ============================================== the sub-order links (CHK-008) ========== */

/**
 * AC-CHK-004-01-01 and AC-CHK-008-01-02: one OrderCheckoutLink row per sub-order, carrying the
 * checkout session, the seller, the fulfilment group and the amounts allocated to it.
 */
export async function linkOrderAsync({
  order, session, group, allocation,
}) {
  return repository('OrderCheckoutLink').insertAsync({
    orderId: order.id,
    orderNumber: order.orderNumber,
    checkoutSessionId: session.id,
    checkoutReference: session.reference,
    vendorId: group.vendorId,
    fulfilmentGroup: group.key,
    allocatedAmounts: allocation
      ? {
        delivery: allocation.deliveryFee,
        paymentFee: allocation.paymentFee,
        discount: allocation.discount,
        attributeFee: allocation.checkoutAttributeFee,
        tax: allocation.tax,
      }
      : null,
  });
}

export async function checkoutLinksAsync(reference) {
  return repository('OrderCheckoutLink').getAllAsync((l) => l.checkoutReference === reference);
}

/* ======================================= the placement exception (AC-CHK-004-01-05) ==== */

/**
 * A sub-order failed to save after the payment went through: the sub-orders already saved are
 * kept, the session becomes PlacementException, the exception is listed for
 * Checkout.Core.Exceptions.View holders and audited (AUD-CHK-007), and the shopper is told with
 * Chk.SplitPlacementFailed and the checkout reference.
 */
export async function placementExceptionAsync({
  session, savedOrders = [], failedGroup = null, error = null, payment = null, storeId = 1,
}) {
  const row = await repository('CheckoutException').insertAsync({
    kind: 'split-placement',
    checkoutReference: session.reference,
    checkoutSessionId: session.id,
    ordersSaved: savedOrders.map((o) => o.orderNumber),
    failedGroup: failedGroup?.key ?? null,
    vendorId: failedGroup?.vendorId ?? null,
    message: error?.message ?? String(error ?? 'the sub-order could not be saved'),
    paymentProviderRef: payment?.providerRef ?? null,
    feature: 'PRD-CHK-004',
    permission: 'Checkout.Core.Exceptions.View',
    storeId,
    state: 'Open',
    createdOnUtc: new Date().toISOString(),
  });
  return {
    exception: row,
    messageKey: 'Chk.SplitPlacementFailed',
    message: `${resource('Chk.SplitPlacementFailed')} (${session.reference})`,
    reference: session.reference,
    ordersKept: savedOrders.length,
  };
}

/**
 * The refund of a share that was never saved is raised through RET-005 (IC-RET-04), never
 * straight to PAY: CHK only asks for the trigger with the source type the contract names.
 */
export async function requestRefundAsync({
  reference, amount, reason = null, actor = 'support', storeId = 1,
}) {
  const exception = await repository('CheckoutException').getOneAsync((e) => e.checkoutReference === reference
    && e.kind === 'split-placement');
  const payment = await repository('PaymentTransaction').getOneAsync((t) => t.checkoutReference === reference);
  const trigger = await repository('RefundTrigger').insertAsync({
    sourceType: 'PlacementFailure',
    checkoutReference: reference,
    paymentTransactionId: payment?.id ?? null,
    providerRef: payment?.providerRef ?? null,
    amount: Number(amount),
    reason,
    requestedBy: actor,
    storeId,
    state: 'Requested',
    raisedThrough: 'IC-RET-04',
    owner: 'PRD-RET-005',
    createdOnUtc: new Date().toISOString(),
  });
  return {
    ok: true,
    trigger,
    raisedThrough: 'IC-RET-04',
    owner: 'PRD-RET-005',
    note: 'CHK never refunds through PAY directly (AC-CHK-004-01-05)',
    exceptionId: exception?.id ?? null,
  };
}
