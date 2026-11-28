// CHK-003: the payment-status half of the IOrderProcessingService override.
//
// OVR-REG names CHK-003 the one owner of IOrderProcessingService, and BR-PAY-010 states that the
// native order PaymentStatus is changed "only through IOrderProcessingService, never by setting
// Order.PaymentStatusId directly". These are the native methods PAY-011 and every adapter call,
// with the native guards: CanMarkOrderAsPaid, CanMarkAsAuthorized, CanVoid, CanRefund,
// CanPartiallyRefund. Nothing here decides a payment: the caller supplies the result, this host
// writes the order and raises the native event.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { publishAsync } from '../../../core/events.js';
import { withLockAsync } from '../../../core/locker.js';

const orderRepo = () => repository('Order');

/** Native PaymentStatus values (Nop.Core.Domain.Payments.PaymentStatus). */
export const PAYMENT_STATUS = {
  Pending: 'Pending',
  Authorized: 'Authorized',
  Paid: 'Paid',
  PartiallyRefunded: 'PartiallyRefunded',
  Refunded: 'Refunded',
  Voided: 'Voided',
};

/** The native per-order lock PAY-011 and INV-004 both take (section 12.4). */
export const payOrderLockKey = (orderId) => `pay-order-${orderId}`;

const orderByAsync = async (orderId) => (orderId === null || orderId === undefined
  ? null
  : orderRepo().getByIdAsync(Number(orderId)));

/**
 * CanMarkOrderAsPaidAsync. BR-PAY-012 notes that this native check alone is not enough, because
 * it answers true for a PartiallyRefunded order; the de-duplication in PAY-012 runs as well.
 */
export async function canMarkOrderAsPaidAsync(order) {
  if (!order) return false;
  if (order.orderStatus === 'Cancelled') return false;
  return ![PAYMENT_STATUS.Paid, PAYMENT_STATUS.Refunded, PAYMENT_STATUS.Voided].includes(order.paymentStatus);
}

export async function canMarkAsAuthorizedAsync(order) {
  if (!order) return false;
  if (order.orderStatus === 'Cancelled') return false;
  return order.paymentStatus === PAYMENT_STATUS.Pending;
}

export async function canVoidAsync(order) {
  return Boolean(order) && order.paymentStatus === PAYMENT_STATUS.Authorized;
}

export async function canRefundAsync(order) {
  return Boolean(order) && order.paymentStatus === PAYMENT_STATUS.Paid
    && Number(order.refundedAmount ?? 0) === 0;
}

export async function canPartiallyRefundAsync(order, amount = 0) {
  if (!order) return false;
  if (![PAYMENT_STATUS.Paid, PAYMENT_STATUS.PartiallyRefunded].includes(order.paymentStatus)) return false;
  return Number(order.refundedAmount ?? 0) + Number(amount) <= Number(order.total);
}

async function writeAsync({
  order, changes, event = null, actor, note, feature, storeId = 1,
}) {
  const before = {
    paymentStatus: order.paymentStatus,
    refundedAmount: order.refundedAmount ?? 0,
  };
  const updated = await orderRepo().updateAsync({ ...order, ...changes });
  if (event) await publishAsync(event, { order: updated });
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: feature ?? 'PRD-CHK-003',
    entity: 'Order',
    entityId: order.id,
    actor,
    storeId,
    before,
    after: { paymentStatus: updated.paymentStatus, refundedAmount: updated.refundedAmount ?? 0 },
    note,
  });
  return updated;
}

/**
 * MarkOrderAsPaidAsync. Called once per order (BR-PAY-012); a second call is refused by the
 * native guard and the caller is told the order was already paid.
 */
export async function markOrderAsPaidAsync({
  orderId, actor = 'payment-callback', note = null, paidOnUtc = null, feature = 'PRD-PAY-011', storeId = 1,
}) {
  return withLockAsync(payOrderLockKey(orderId), async () => {
    const order = await orderByAsync(orderId);
    if (!order) return { ok: false, message: 'no such order' };
    if (!await canMarkOrderAsPaidAsync(order)) {
      return {
        ok: false,
        alreadyApplied: order.paymentStatus === PAYMENT_STATUS.Paid,
        orderCancelled: order.orderStatus === 'Cancelled',
        paymentStatus: order.paymentStatus,
        guard: 'CanMarkOrderAsPaid',
        message: `the order payment status is ${order.paymentStatus}`,
      };
    }
    const updated = await writeAsync({
      order,
      changes: {
        paymentStatus: PAYMENT_STATUS.Paid,
        paidOnUtc: paidOnUtc ?? new Date().toISOString(),
      },
      event: 'OrderPaidEvent',
      actor,
      storeId,
      feature,
      note: note ?? 'the order was marked paid through IOrderProcessingService (BR-PAY-010)',
    });
    return {
      ok: true, order: updated, through: 'IOrderProcessingService.MarkOrderAsPaidAsync', owner: 'PRD-CHK-003',
    };
  });
}

/** MarkAsAuthorizedAsync: the provider holds the funds; the order is not paid yet. */
export async function markAsAuthorizedAsync({
  orderId, actor = 'payment-callback', note = null, feature = 'PRD-PAY-011', storeId = 1,
}) {
  return withLockAsync(payOrderLockKey(orderId), async () => {
    const order = await orderByAsync(orderId);
    if (!order) return { ok: false, message: 'no such order' };
    if (!await canMarkAsAuthorizedAsync(order)) {
      return {
        ok: false, guard: 'CanMarkAsAuthorized', paymentStatus: order.paymentStatus, message: `the order payment status is ${order.paymentStatus}`,
      };
    }
    const updated = await writeAsync({
      order,
      changes: { paymentStatus: PAYMENT_STATUS.Authorized, authorizedOnUtc: new Date().toISOString() },
      actor,
      storeId,
      feature,
      note: note ?? 'the payment was authorised through IOrderProcessingService (BR-PAY-010)',
    });
    return { ok: true, order: updated, through: 'IOrderProcessingService.MarkAsAuthorizedAsync', owner: 'PRD-CHK-003' };
  });
}

/** VoidOfflineAsync: an authorisation released without a provider call. */
export async function voidOfflineAsync({
  orderId, actor = 'finance', note = null, feature = 'PRD-PAY-011', storeId = 1,
}) {
  return withLockAsync(payOrderLockKey(orderId), async () => {
    const order = await orderByAsync(orderId);
    if (!order) return { ok: false, message: 'no such order' };
    if (!await canVoidAsync(order)) {
      return {
        ok: false, guard: 'CanVoid', paymentStatus: order.paymentStatus, message: 'only an authorised payment can be voided',
      };
    }
    const updated = await writeAsync({
      order,
      changes: { paymentStatus: PAYMENT_STATUS.Voided, voidedOnUtc: new Date().toISOString() },
      actor,
      storeId,
      feature,
      note: note ?? 'the authorisation was voided through IOrderProcessingService (BR-PAY-010)',
    });
    return { ok: true, order: updated, through: 'IOrderProcessingService.VoidOfflineAsync', owner: 'PRD-CHK-003' };
  });
}

/**
 * RefundOfflineAsync / PartiallyRefundOfflineAsync. BR-PAY-010: a refund of the whole amount
 * where nothing was refunded before is the full method, otherwise the partial one.
 */
export async function refundOfflineAsync({
  orderId, amount = null, actor = 'finance', note = null, feature = 'PRD-PAY-011', storeId = 1,
}) {
  return withLockAsync(payOrderLockKey(orderId), async () => {
    const order = await orderByAsync(orderId);
    if (!order) return { ok: false, message: 'no such order' };
    const already = Number(order.refundedAmount ?? 0);
    const value = amount === null ? Number(order.total) - already : Number(amount);
    const full = already === 0 && value >= Number(order.total);
    if (full) {
      if (!await canRefundAsync(order)) {
        return { ok: false, guard: 'CanRefund', paymentStatus: order.paymentStatus, message: 'the order cannot be refunded in full' };
      }
    } else if (!await canPartiallyRefundAsync(order, value)) {
      return { ok: false, guard: 'CanPartiallyRefund', paymentStatus: order.paymentStatus, message: 'the order cannot be refunded by that amount' };
    }
    const refunded = already + value;
    const updated = await writeAsync({
      order,
      changes: {
        paymentStatus: refunded >= Number(order.total) ? PAYMENT_STATUS.Refunded : PAYMENT_STATUS.PartiallyRefunded,
        refundedAmount: Number(refunded.toFixed(2)),
        refundedOnUtc: new Date().toISOString(),
      },
      actor,
      storeId,
      feature,
      note: note ?? 'the refund was recorded through IOrderProcessingService (BR-PAY-010)',
    });
    return {
      ok: true,
      order: updated,
      amount: Number(value.toFixed(2)),
      through: full
        ? 'IOrderProcessingService.RefundOfflineAsync'
        : 'IOrderProcessingService.PartiallyRefundOfflineAsync',
      owner: 'PRD-CHK-003',
    };
  });
}

/** The native capture path: Authorized → Paid raised as OrderPaidEvent by the host, never twice. */
export async function captureAsync({
  orderId, actor = 'finance', note = null, feature = 'PRD-PAY-011', storeId = 1,
}) {
  const order = await orderByAsync(orderId);
  if (!order) return { ok: false, message: 'no such order' };
  if (order.paymentStatus !== PAYMENT_STATUS.Authorized) {
    return { ok: false, guard: 'CanCapture', paymentStatus: order.paymentStatus, message: 'only an authorised payment can be captured' };
  }
  return markOrderAsPaidAsync({
    orderId, actor, storeId, feature, note: note ?? 'the authorised payment was captured (IOrderProcessingService.CaptureAsync)',
  });
}
