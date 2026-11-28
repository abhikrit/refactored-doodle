// PAY-011 payment status lifecycle and PAY-012 payment idempotency.
//
// Every payment attempt is a PaymentTransaction (section 9) whose status moves only along the
// transitions of state model SM-PAY-01 (BR-PAY-010). The native order PaymentStatus is never
// written here: each mapped transition calls the CHK-003 IOrderProcessingService host, which is
// the one owner of that write (OVR-REG, BR-PAY-010).
//
// PAY-012: every charge carries an idempotency key (Order.OrderGuid + AttemptNo, BR-PAY-012) and
// every callback is de-duplicated by provider reference and transaction status before a sub-order
// is marked paid - the native CanMarkOrderAsPaid is not enough, because it answers true for a
// PartiallyRefunded order.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { withLockAsync } from '../../../core/locker.js';
import {
  markOrderAsPaidAsync, markAsAuthorizedAsync, voidOfflineAsync, refundOfflineAsync,
  payOrderLockKey,
} from '../../product-chk/services/order-processing.js';
import {
  providerCallAsync, idempotencyKeyFor, connectorFor, callAsync,
} from './connector.js';
import { supportContactAsync } from './routing.js';

const txRepo = () => repository('PaymentTransaction');
const linkRepo = () => repository('PaymentTransactionOrder');

/** SM-PAY-01 statuses. */
export const TX = {
  Initiated: 'Initiated',
  Pending: 'Pending',
  Authorized: 'Authorized',
  Successful: 'Successful',
  Failed: 'Failed',
  FailedFinal: 'Failed (final)',
  AwaitingConfirmation: 'AwaitingConfirmation',
  Voided: 'Voided',
  Reversed: 'Reversed',
  Refunded: 'Refunded',
  PartiallyRefunded: 'PartiallyRefunded',
  SuccessfulAfterCancel: 'SuccessfulAfterCancel',
};

/** The lock a group payment takes (section 12.4). */
export const payCheckoutLockKey = (checkoutSessionId) => `pay-checkout-${checkoutSessionId}`;

/**
 * SM-PAY-01 exactly as section 9 of the module chapter states it. `native` names the
 * IOrderProcessingService method the transition maps to (BR-PAY-010); null means the order is
 * not touched.
 */
export const SM_PAY_01 = [
  {
    from: null, trigger: 'attempt started', guard: null, to: TX.Initiated, native: null, action: 'create record (AttemptNo)',
  },
  {
    from: TX.Initiated, trigger: 'request accepted by provider', guard: null, to: TX.Pending, native: null,
  },
  {
    from: TX.Pending, trigger: 'callback / status: authorised', guard: 'verified, not already Authorized/Successful', to: TX.Authorized, native: 'MarkAsAuthorizedAsync',
  },
  {
    from: TX.Pending, trigger: 'callback / status: success', guard: 'verified, not already Successful', to: TX.Successful, native: 'MarkOrderAsPaidAsync',
  },
  {
    from: TX.Pending, trigger: 'callback / status: failure, shopper rejects', guard: null, to: TX.Failed, native: null, action: 'order stays Pending; retry allowed within window',
  },
  {
    from: TX.Pending, trigger: 'seller marks offline payment paid (PAY-036)', guard: 'vendor owns order', to: TX.AwaitingConfirmation, native: null, action: 'OrderNote with proof; order stays Pending',
  },
  {
    from: TX.AwaitingConfirmation, trigger: 'buyer confirms', guard: null, to: TX.Successful, native: 'MarkOrderAsPaidAsync',
  },
  {
    from: TX.AwaitingConfirmation, trigger: 'buyer contests', guard: null, to: TX.Pending, native: null, action: 'dispute case (RET-007)',
  },
  {
    from: TX.Authorized, trigger: 'capture', guard: null, to: TX.Successful, native: 'CaptureAsync or MarkOrderAsPaidAsync - never both',
  },
  {
    from: TX.Authorized, trigger: 'void', guard: null, to: TX.Voided, native: 'VoidOfflineAsync',
  },
  {
    from: TX.Successful, trigger: 'provider reversal or lost chargeback', guard: null, to: TX.Reversed, native: 'RefundOfflineAsync or PartiallyRefundOfflineAsync',
  },
  {
    from: TX.Successful, trigger: 'refund completed (full / part)', guard: 'BR-PAY-081', to: TX.Refunded, native: 'native refund method per BR-PAY-083',
  },
  {
    from: TX.Successful, trigger: 'refund completed (full / part)', guard: 'BR-PAY-081', to: TX.PartiallyRefunded, native: 'native refund method per BR-PAY-083',
  },
  {
    from: TX.Failed, trigger: 'payment window expires (INV-004)', guard: 'configured action = cancel', to: TX.FailedFinal, native: null, action: 'INV-004 cancels the order',
  },
  {
    from: TX.Failed, trigger: 'payment window expires (INV-004)', guard: 'configured action = remind or flag', to: TX.Failed, native: null, action: 'INV-004 reminds or flags; retry stays possible',
  },
  {
    from: TX.FailedFinal, trigger: 'verified success callback after cancellation', guard: 'order Cancelled', to: TX.SuccessfulAfterCancel, native: null, action: 'no MarkOrderAsPaidAsync; console exception; refund opened (PAY-016)',
  },
  {
    from: TX.Pending, trigger: 'verified success callback after cancellation', guard: 'order Cancelled', to: TX.SuccessfulAfterCancel, native: null, action: 'no MarkOrderAsPaidAsync; console exception; refund opened (PAY-016)',
  },
];

export const transitionsFrom = (from) => SM_PAY_01.filter((t) => t.from === (from ?? null));

export function transitionFor(from, to) {
  return SM_PAY_01.find((t) => t.from === (from ?? null) && t.to === to) ?? null;
}

/** BR-PAY-010: the native order PaymentStatus each transaction status maps to. */
export const NATIVE_PAYMENT_STATUS = {
  [TX.Initiated]: { paymentStatus: 'Pending', through: null },
  [TX.Pending]: { paymentStatus: 'Pending', through: null },
  [TX.AwaitingConfirmation]: { paymentStatus: 'Pending', through: null },
  [TX.Failed]: { paymentStatus: 'Pending', through: null },
  [TX.FailedFinal]: { paymentStatus: 'Pending', through: null },
  [TX.Authorized]: { paymentStatus: 'Authorized', through: 'IOrderProcessingService.MarkAsAuthorizedAsync' },
  [TX.Successful]: { paymentStatus: 'Paid', through: 'IOrderProcessingService.MarkOrderAsPaidAsync' },
  [TX.Voided]: { paymentStatus: 'Voided', through: 'IOrderProcessingService.VoidOfflineAsync' },
  [TX.Reversed]: { paymentStatus: 'Refunded', through: 'IOrderProcessingService.RefundOfflineAsync / PartiallyRefundOfflineAsync' },
  [TX.Refunded]: { paymentStatus: 'Refunded', through: 'IOrderProcessingService.RefundOfflineAsync' },
  [TX.PartiallyRefunded]: { paymentStatus: 'PartiallyRefunded', through: 'IOrderProcessingService.PartiallyRefundAsync' },
  [TX.SuccessfulAfterCancel]: { paymentStatus: null, through: null },
};

export const nativeMappingFor = (status) => NATIVE_PAYMENT_STATUS[status] ?? { paymentStatus: null, through: null };

/* ====================================================== the orders of a transaction ==== */

/** Every order the transaction pays: the single order, or the linked sub-orders of a group. */
export async function ordersOfAsync(transaction) {
  if (transaction.checkoutSessionId) {
    const links = await linkRepo().getAllAsync((l) => Number(l.transactionId) === Number(transaction.id));
    const orders = [];
    for (const link of links) {
      const order = await repository('Order').getByIdAsync(Number(link.orderId));
      if (order) orders.push({ order, amount: link.amount });
    }
    return orders.sort((a, b) => Number(a.order.id) - Number(b.order.id));
  }
  if (transaction.orderId) {
    const order = await repository('Order').getByIdAsync(Number(transaction.orderId));
    return order ? [{ order, amount: transaction.amount }] : [];
  }
  return [];
}

/* ===================================================== the status change itself ========= */

async function auditStatusAsync({
  transaction, from, to, reason, actor, storeId,
}) {
  await auditAsync({
    event: 'AUD-PAY-001',
    area: 'PAY',
    feature: 'PRD-PAY-011',
    entity: 'PaymentTransaction',
    entityId: transaction.id,
    actor: actor ?? 'system',
    storeId,
    before: { status: from },
    after: { status: to, providerReference: transaction.providerRef ?? null },
    note: reason ?? 'the payment transaction status changed',
  });
}

/**
 * AC-PAY-011-03-02: only the SM-PAY-01 transitions are allowed; each change is timestamped and
 * audited; the native order PaymentStatus changes only through IOrderProcessingService.
 */
export async function transitionAsync({
  transactionId, to, trigger = null, reason = null, actor = 'system', storeId = 1,
  providerRef = null, amount = null, applyToOrders = true,
}) {
  const transaction = await txRepo().getByIdAsync(Number(transactionId));
  if (!transaction) return { ok: false, message: 'no such payment transaction' };
  const from = transaction.status;
  const transition = transitionFor(from, to);
  if (!transition) {
    return {
      ok: false,
      refused: true,
      from,
      to,
      allowed: transitionsFrom(from).map((t) => t.to),
      message: `SM-PAY-01 does not allow ${from} to ${to}`,
      rule: 'BR-PAY-010 / SM-PAY-01',
    };
  }
  const changedOnUtc = new Date().toISOString();
  const history = [
    ...(transaction.statusHistory ?? []),
    {
      from, to, trigger: trigger ?? transition.trigger, reason, actor, changedOnUtc,
    },
  ];
  const updated = await txRepo().updateAsync({
    ...transaction,
    status: to,
    providerRef: providerRef ?? transaction.providerRef,
    statusHistory: history,
    updatedOnUtc: changedOnUtc,
  });
  await auditStatusAsync({
    transaction: updated, from, to, reason: reason ?? transition.trigger, actor, storeId,
  });

  const native = nativeMappingFor(to);
  const applied = [];
  if (applyToOrders && native.through) {
    for (const { order, amount: share } of await ordersOfAsync(updated)) {
      const result = await applyNativeAsync({
        to, order, amount: amount ?? share, actor, storeId,
      });
      applied.push({ orderNumber: order.orderNumber, ...result });
    }
  }
  return {
    ok: true,
    transaction: updated,
    from,
    to,
    transition,
    nativePaymentStatus: native.paymentStatus,
    through: native.through,
    orders: applied,
  };
}

async function applyNativeAsync({
  to, order, amount, actor, storeId,
}) {
  if (to === TX.Authorized) return markAsAuthorizedAsync({ orderId: order.id, actor, storeId });
  if (to === TX.Successful) return markOrderAsPaidAsync({ orderId: order.id, actor, storeId });
  if (to === TX.Voided) return voidOfflineAsync({ orderId: order.id, actor, storeId });
  if ([TX.Reversed, TX.Refunded, TX.PartiallyRefunded].includes(to)) {
    return refundOfflineAsync({
      orderId: order.id,
      amount: to === TX.PartiallyRefunded ? amount : null,
      actor,
      storeId,
    });
  }
  return { ok: true, noNativeChange: true };
}

/* ================================================= AC-PAY-011-03-01 the attempt ========= */

const nextAttemptNoAsync = async ({ orderGuid, checkoutReference }) => {
  const rows = await txRepo().getAllAsync((t) => (orderGuid && t.orderGuid
    ? t.orderGuid === orderGuid
    : (checkoutReference ? t.checkoutReference === checkoutReference : false)));
  return rows.reduce((max, r) => Math.max(max, Number(r.attemptNo ?? 1)), 0) + 1;
};

/**
 * Starts one payment attempt. A PaymentTransaction is created with status Initiated, its
 * AttemptNo and the order reference (AC-PAY-011-03-01), the adapter is called through the
 * PAY-024 connector, and the provider's answer moves the transaction along SM-PAY-01.
 *
 * AC-PAY-012-01-01: the same idempotency key twice initiates no second charge; the first result
 * is returned.
 */
export async function beginAttemptAsync({
  systemName, amount, currency, checkoutReference = null, checkoutSessionId = null, orderId = null,
  orderGuid = null, shares = [], customer = null, storeId = 1, data = {}, agentId = null,
  attemptNo = null, actor = null,
}) {
  const connector = connectorFor(systemName);
  if (!connector) {
    return { ok: false, notSupported: true, message: `no payment connector is registered as ${systemName}` };
  }
  const no = attemptNo ?? await nextAttemptNoAsync({ orderGuid, checkoutReference });
  const idempotencyKey = idempotencyKeyFor({
    orderGuid, attemptNo: no, checkoutReference,
  });

  const existing = await txRepo().getOneAsync((t) => t.idempotencyKey === idempotencyKey);
  if (existing) {
    return {
      ok: true,
      duplicate: true,
      noSecondCharge: true,
      transactionId: existing.id,
      status: existing.status,
      providerRef: existing.providerRef,
      customerAction: existing.customerAction ?? null,
      amount: existing.amount,
      attemptNo: existing.attemptNo,
      idempotencyKey,
      rule: 'BR-PAY-012 / AC-PAY-012-01-01',
      message: 'this payment request was already received; the original result is returned',
    };
  }

  const transaction = await txRepo().insertAsync({
    orderId: orderId ?? null,
    attemptNo: no,
    methodSystemName: systemName,
    systemName,
    adapterId: connector.systemName,
    status: TX.Initiated,
    amount,
    currency,
    currencyCode: currency,
    customerCurrencyCode: currency,
    exchangeRate: 1,
    providerRef: null,
    paymentReference: checkoutReference,
    checkoutReference,
    orderGuid,
    checkoutSessionId,
    idempotencyKey,
    agentId,
    groupPayment: Boolean(checkoutSessionId),
    shares,
    customerId: customer?.id ?? null,
    statusHistory: [{
      from: null, to: TX.Initiated, trigger: 'attempt started', changedOnUtc: new Date().toISOString(),
    }],
    storeId,
    createdOnUtc: new Date().toISOString(),
    updatedOnUtc: new Date().toISOString(),
  });
  await auditStatusAsync({
    transaction, from: null, to: TX.Initiated, reason: `attempt ${no} started`, actor: actor ?? customer?.email ?? 'storefront', storeId,
  });

  const call = await providerCallAsync({
    systemName,
    operation: 'InitiatePayment',
    storeId,
    args: {
      amount,
      currency,
      reference: checkoutReference,
      orderGuid,
      idempotencyKey,
      phone: data.phone ?? customer?.phone ?? null,
      groupPayment: Boolean(checkoutSessionId),
      shares,
    },
  });
  if (call.notSupported) {
    await transitionAsync({
      transactionId: transaction.id, to: TX.Failed, reason: call.message, actor: 'system', storeId,
    });
    return {
      ok: false, notSupported: true, manualPath: call.manualPath, message: call.message, transactionId: transaction.id,
    };
  }

  // Initiated -> Pending: the request was accepted by the provider
  await transitionAsync({
    transactionId: transaction.id,
    to: TX.Pending,
    reason: 'the request was accepted by the provider',
    providerRef: call.providerRef ?? null,
    actor: 'system',
    storeId,
  });
  await txRepo().updateAsync({
    ...(await txRepo().getByIdAsync(transaction.id)),
    customerAction: call.customerAction ?? null,
    raw: call.raw ?? null,
  });

  // the provider answered at once: Paid -> Successful, Failed -> Failed
  let final = TX.Pending;
  if (call.status === 'Paid') {
    const moved = await transitionAsync({
      transactionId: transaction.id,
      to: TX.Successful,
      trigger: 'callback / status: success',
      reason: 'the provider accepted the payment immediately',
      actor: 'system',
      storeId,
      applyToOrders: Boolean(orderId),
    });
    final = moved.ok ? TX.Successful : TX.Pending;
  } else if (call.status === 'Failed') {
    await transitionAsync({
      transactionId: transaction.id, to: TX.Failed, reason: call.reason ?? 'the provider refused the payment', actor: 'system', storeId,
    });
    final = TX.Failed;
  }

  const row = await txRepo().getByIdAsync(transaction.id);
  return {
    ok: final !== TX.Failed,
    transactionId: row.id,
    attemptNo: no,
    idempotencyKey,
    status: final,
    // the native ProcessPaymentResult the placement host applies to the order it saves
    nativePaymentStatus: nativeMappingFor(final).paymentStatus,
    providerStatus: call.status,
    providerRef: row.providerRef,
    customerAction: row.customerAction ?? null,
    raw: row.raw ?? null,
    reason: call.reason ?? null,
    tls: call.tls === true,
  };
}

/* ====================================== IC-PAY-02 group payment (BR-PAY-014) =========== */

/**
 * AC-PAY-011-04-01: one payment for a checkout of several sellers, taken once before any
 * sub-order is saved, with one share per seller and the CheckoutSession reference as the
 * merchant reference.
 */
export async function groupPaymentAsync({
  checkoutReference, checkoutSessionId = null, total, currency, sharePerSeller = [], systemName,
  customer = null, storeId = 1, data = {}, orderGuid = null, agentId = null, attemptNo = null,
}) {
  const connector = connectorFor(systemName);
  if (connector && connector.supportsGroupPayment !== true && sharePerSeller.length > 1) {
    return {
      ok: false,
      groupPaymentNotSupported: true,
      message: 'This method cannot take one payment for a cart that is split between sellers.',
      rule: 'BR-PAY-014 / AC-PAY-011-04-06',
    };
  }
  const result = await beginAttemptAsync({
    systemName,
    amount: total,
    currency,
    checkoutReference,
    checkoutSessionId: checkoutSessionId ?? checkoutReference,
    orderGuid,
    shares: sharePerSeller,
    customer,
    storeId,
    data,
    agentId,
    attemptNo,
  });
  return {
    ...result,
    groupPayment: true,
    merchantReference: checkoutReference,
    shares: sharePerSeller,
    chargedOnce: true,
    rule: 'BR-PAY-014',
  };
}

/**
 * AC-PAY-011-04-07: the PAY placement participant. The CHK-003 host calls Confirm after it saves
 * each sub-order; PAY writes the PaymentTransactionOrder link with that seller's share. If the
 * group transaction became Successful by callback before the link existed, the sub-order is
 * marked paid once, now.
 */
export async function linkSubOrderAsync({ order, storeId = 1, actor = 'system' }) {
  const reference = order?.checkoutReference ?? null;
  if (!reference) return { ok: true, nothingToLink: true };
  return withLockAsync(payCheckoutLockKey(reference), async () => {
    const transaction = await txRepo().getOneAsync(
      (t) => t.checkoutReference === reference && t.checkoutSessionId,
    );
    if (!transaction) {
      // a single-seller checkout: the attempt was started before the order existed, so the order
      // reference is written on the transaction now (AC-PAY-011-03-01)
      const single = await txRepo().getOneAsync(
        (t) => t.checkoutReference === reference && !t.checkoutSessionId && !t.orderId,
      );
      if (!single) return { ok: true, nothingToLink: true };
      const updated = await txRepo().updateAsync({ ...single, orderId: order.id, orderNumber: order.orderNumber });
      return {
        ok: true, singleOrder: true, transactionId: updated.id, orderReferenceWritten: order.orderNumber,
      };
    }
    const already = await linkRepo().getOneAsync(
      (l) => Number(l.transactionId) === Number(transaction.id) && Number(l.orderId) === Number(order.id),
    );
    const share = (transaction.shares ?? []).find(
      (s) => Number(s.vendorId) === Number(order.vendorId),
    );
    const link = already ?? await linkRepo().insertAsync({
      transactionId: transaction.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: share?.amount ?? order.total,
      providerRef: transaction.providerRef,
      checkoutReference: reference,
    });
    // the group result was Paid: native placement saved the sub-order paid, so PAY calls nothing
    if (order.paymentStatus === 'Paid') {
      return {
        ok: true, link, alreadyPaidByPlacement: true, calledNothing: true, rule: 'AC-PAY-011-04-07',
      };
    }
    if (transaction.status === TX.Successful) {
      const paid = await markOrderAsPaidAsync({
        orderId: order.id,
        actor,
        storeId,
        note: 'the group payment had already succeeded when this sub-order was saved (AC-PAY-011-04-07)',
      });
      return {
        ok: true, link, markedPaidNow: paid.ok === true, rule: 'AC-PAY-011-04-07',
      };
    }
    return { ok: true, link, transactionStatus: transaction.status };
  });
}

/* ============================================ the callback and its de-duplication ====== */

/**
 * A verified provider callback. AC-PAY-012-01-02: the same callback twice is recognised by
 * provider reference and transaction status, logged and ignored; MarkOrderAsPaidAsync is not
 * called again, even for a PartiallyRefunded order.
 */
export async function applyCallbackAsync({
  providerRef, status = 'Paid', verified = true, reason = null, storeId = 1, actor = 'payment-callback',
  receipt = null,
}) {
  const transaction = await txRepo().getOneAsync((t) => t.providerRef === providerRef);
  if (!transaction) return { ok: false, message: `no payment transaction for ${providerRef}` };
  if (verified !== true) {
    return { ok: false, verified: false, message: 'the callback was not verified; nothing changed' };
  }

  const target = status === 'Paid' || status === 'Successful'
    ? TX.Successful
    : status === 'Authorized'
      ? TX.Authorized
      : TX.Failed;

  const lockKey = transaction.checkoutSessionId
    ? payCheckoutLockKey(transaction.checkoutReference)
    : payOrderLockKey(transaction.orderId ?? transaction.id);

  return withLockAsync(lockKey, async () => {
    const current = await txRepo().getByIdAsync(transaction.id);

    // the de-duplication: the same reference already carries that status
    if (current.status === target
      || (target === TX.Successful
        && [TX.Successful, TX.Refunded, TX.PartiallyRefunded, TX.Reversed].includes(current.status))) {
      await repository('Log').insertAsync({
        level: 'Information',
        shortMessage: `A repeated payment callback for ${providerRef} was ignored`,
        fullMessage: `the transaction is already ${current.status}; MarkOrderAsPaidAsync was not called again (BR-PAY-012)`,
        feature: 'PRD-PAY-012',
        createdOnUtc: new Date().toISOString(),
      });
      return {
        ok: true,
        duplicate: true,
        ignored: true,
        logged: true,
        markedPaidAgain: false,
        status: current.status,
        rule: 'BR-PAY-012 / AC-PAY-012-01-02',
      };
    }

    // a success that arrives after the order was cancelled
    const orders = await ordersOfAsync(current);
    const cancelled = orders.filter(({ order }) => order.orderStatus === 'Cancelled');
    if (target === TX.Successful && cancelled.length && cancelled.length === orders.length) {
      return successfulAfterCancelAsync({
        transaction: current, orders: cancelled, storeId, actor, providerRef,
      });
    }

    const moved = await transitionAsync({
      transactionId: current.id,
      to: target,
      trigger: target === TX.Failed ? 'callback / status: failure, shopper rejects' : `callback / status: ${target === TX.Successful ? 'success' : 'authorised'}`,
      reason: reason ?? 'a verified provider callback',
      actor,
      storeId,
    });
    if (!moved.ok) return moved;
    if (receipt) {
      await txRepo().updateAsync({ ...(await txRepo().getByIdAsync(current.id)), receipt });
    }

    // AC-PAY-011-04-05: the share of a sub-order cancelled meanwhile follows SuccessfulAfterCancel
    const exceptions = [];
    if (target === TX.Successful && cancelled.length) {
      for (const { order, amount } of cancelled) {
        exceptions.push(await recordCancelExceptionAsync({
          transaction: current, order, amount, storeId, providerRef,
        }));
      }
    }
    return {
      ok: true,
      status: target,
      transactionId: current.id,
      orders: moved.orders,
      paidOrders: moved.orders.filter((o) => o.ok === true).map((o) => o.orderNumber),
      exceptions,
      messageKey: target === TX.Failed ? 'Pay.Status.Failed' : null,
      message: target === TX.Failed ? resource('Pay.Status.Failed') : null,
    };
  });
}

async function recordCancelExceptionAsync({
  transaction, order, amount, storeId, providerRef,
}) {
  const row = await repository('PaymentException').insertAsync({
    kind: 'SuccessfulAfterCancel',
    transactionId: transaction.id,
    orderNumber: order?.orderNumber ?? null,
    checkoutReference: transaction.checkoutReference,
    amount: amount ?? transaction.amount,
    providerRef,
    feature: 'PRD-PAY-011',
    refundOpenedBy: 'PAY-016 (provider-side refund)',
    note: 'the payment was verified after the order was cancelled; the order stays cancelled',
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-PAY-001',
    area: 'PAY',
    feature: 'PRD-PAY-011',
    entity: 'PaymentTransaction',
    entityId: transaction.id,
    actor: 'payment-callback',
    storeId,
    after: { status: TX.SuccessfulAfterCancel, orderNumber: order?.orderNumber ?? null },
    note: 'a verified success arrived after cancellation (SuccessfulAfterCancel)',
  });
  return {
    exceptionId: row.id,
    orderNumber: order?.orderNumber ?? null,
    messageKey: 'Pay.RefundAfterCancel',
    message: resource('Pay.RefundAfterCancel'),
  };
}

async function successfulAfterCancelAsync({
  transaction, orders, storeId, actor, providerRef,
}) {
  const moved = await transitionAsync({
    transactionId: transaction.id,
    to: TX.SuccessfulAfterCancel,
    trigger: 'verified success callback after cancellation',
    reason: 'the order was cancelled before the payment was confirmed',
    actor,
    storeId,
  });
  const exceptions = [];
  for (const { order, amount } of orders) {
    exceptions.push(await recordCancelExceptionAsync({
      transaction, order, amount, storeId, providerRef,
    }));
  }
  return {
    ok: true,
    status: TX.SuccessfulAfterCancel,
    markedPaid: false,
    orderStaysCancelled: true,
    transition: moved.transition ?? null,
    exceptions,
    messageKey: 'Pay.RefundAfterCancel',
    message: resource('Pay.RefundAfterCancel'),
    rule: 'SM-PAY-01 / AC-PAY-011-04-05',
  };
}

/* ======================================== IC-PAY-07 (consumed by INV-004 as IC-INV-02) = */

/**
 * AC-PAY-011-03-03: a read-only answer for INV-004, taken inside the lock 'pay-order-{OrderId}',
 * that includes a group transaction linked to the order (BR-PAY-014).
 */
export async function hasSuccessfulOrAuthorizedTransactionAsync(orderId) {
  return withLockAsync(payOrderLockKey(orderId), async () => {
    const direct = await txRepo().getAllAsync((t) => Number(t.orderId) === Number(orderId));
    const links = await linkRepo().getAllAsync((l) => Number(l.orderId) === Number(orderId));
    const linked = [];
    for (const link of links) {
      const row = await txRepo().getByIdAsync(Number(link.transactionId));
      if (row) linked.push(row);
    }
    const all = [...direct, ...linked];
    const hit = all.find((t) => [TX.Successful, TX.Authorized].includes(t.status)) ?? null;
    return {
      result: Boolean(hit),
      readOnly: true,
      transactionsRead: all.length,
      includesGroupTransaction: linked.length > 0,
      status: hit?.status ?? null,
      lock: payOrderLockKey(orderId),
      contract: 'IC-PAY-07 (INV-004 names it IC-INV-02)',
    };
  });
}

/* ================================================== the status page and the retry ======= */

/**
 * AC-PAY-011-01-01: what the storefront status page shows for a Pending or Failed payment - the
 * status, the next step, a retry button where it is allowed, and the support contact.
 */
export async function paymentStatusAsync({ orderNumber, storeId = 1, customer = null }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  if (customer && order.customerId && Number(order.customerId) !== Number(customer.id)) {
    return { ok: false, forbidden: true, message: 'this order belongs to another customer' };
  }
  const attempts = await attemptsForOrderAsync(order);
  const latest = attempts[0] ?? null;
  const retry = await retryAllowedAsync({ order, transaction: latest, storeId });
  const key = order.paymentStatus === 'Paid'
    ? null
    : latest?.status === TX.Failed || latest?.status === TX.FailedFinal
      ? 'Pay.Status.Failed'
      : 'Pay.Status.Pending';
  return {
    ok: true,
    orderNumber: order.orderNumber,
    checkoutReference: order.checkoutReference,
    paymentStatus: order.paymentStatus,
    transactionStatus: latest?.status ?? null,
    methodSystemName: order.paymentMethodSystemName,
    attempts: attempts.map((t) => ({
      attemptNo: t.attemptNo,
      status: t.status,
      providerRef: t.providerRef,
      createdOnUtc: t.createdOnUtc,
      statusHistory: t.statusHistory ?? [],
    })),
    messageKey: key,
    message: key ? resource(key) : null,
    nextStep: key === 'Pay.Status.Failed'
      ? 'Try the payment again, or choose another method.'
      : key === 'Pay.Status.Pending'
        ? 'Keep this page open; the status changes as soon as the provider confirms.'
        : null,
    retry,
    supportContact: await supportContactAsync(storeId),
  };
}

export async function attemptsForOrderAsync(order) {
  const direct = await txRepo().getAllAsync((t) => Number(t.orderId ?? 0) === Number(order.id));
  const links = await linkRepo().getAllAsync((l) => Number(l.orderId) === Number(order.id));
  const linked = [];
  for (const link of links) {
    const row = await txRepo().getByIdAsync(Number(link.transactionId));
    if (row) linked.push(row);
  }
  const byReference = order.checkoutReference
    ? await txRepo().getAllAsync((t) => t.checkoutReference === order.checkoutReference)
    : [];
  const all = [...direct, ...linked, ...byReference];
  const unique = [...new Map(all.map((t) => [t.id, t])).values()];
  return unique.sort((a, b) => Number(b.attemptNo ?? 1) - Number(a.attemptNo ?? 1));
}

/**
 * AC-PAY-011-02-01 and AC-PAY-011-02-02: retry is offered while the order payment status is
 * Pending and the payment window has not passed; a Redirection-type adapter uses the native
 * RePostPayment path, a Standard-type adapter the PAY retry action, because native re-posting is
 * limited to Redirection methods.
 */
export async function retryAllowedAsync({ order, transaction = null, storeId = 1 }) {
  const connector = connectorFor(order.paymentMethodSystemName);
  const methodType = connector?.methodType ?? 'Standard';
  const rePosting = await getSettingAsync('paymentsettings.allowrepostingpayments', storeId, true);
  if (order.paymentStatus === 'Paid') {
    return { allowed: false, reason: 'already-paid', message: 'This order has already been paid.' };
  }
  if (order.orderStatus === 'Cancelled') {
    return {
      allowed: false,
      reason: 'cancelled',
      messageKey: 'Pay.RetryExpired',
      message: resource('Pay.RetryExpired'),
      rule: 'AC-PAY-011-02-02',
    };
  }
  if (rePosting !== true && methodType === 'Redirection') {
    return { allowed: false, reason: 'reposting-off', message: 'This store does not allow a payment to be started again.' };
  }
  return {
    allowed: true,
    methodType,
    path: methodType === 'Redirection' ? 'native RePostPayment' : 'PAY retry action',
    nextAttemptNo: Number(transaction?.attemptNo ?? 0) + 1,
    rule: 'AC-PAY-011-02-01',
  };
}

/**
 * The retry itself: a new PaymentTransaction with AttemptNo + 1 on the same order, or for a
 * group payment one new group transaction for the sub-orders still Pending (AC-PAY-011-04-03).
 */
export async function retryAsync({
  orderNumber, storeId = 1, data = {}, customer = null, actor = null,
}) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  const attempts = await attemptsForOrderAsync(order);
  const latest = attempts[0] ?? null;
  const allowed = await retryAllowedAsync({ order, transaction: latest, storeId });
  if (!allowed.allowed) return { ok: false, ...allowed };

  const group = latest?.checkoutSessionId ? latest : null;
  if (group) {
    const links = await linkRepo().getAllAsync((l) => Number(l.transactionId) === Number(group.id));
    const pending = [];
    for (const link of links) {
      const sub = await repository('Order').getByIdAsync(Number(link.orderId));
      if (sub && sub.paymentStatus !== 'Paid' && sub.orderStatus !== 'Cancelled') {
        pending.push({ order: sub, amount: link.amount });
      }
    }
    const result = await groupPaymentAsync({
      checkoutReference: group.checkoutReference,
      checkoutSessionId: group.checkoutSessionId,
      total: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      currency: group.currency,
      sharePerSeller: pending.map((p) => ({ vendorId: p.order.vendorId, amount: p.amount })),
      systemName: order.paymentMethodSystemName,
      customer,
      storeId,
      data,
      orderGuid: group.orderGuid ?? order.orderGuid,
      attemptNo: Number(group.attemptNo ?? 0) + 1,
    });
    if (result.ok) {
      for (const p of pending) {
        await linkRepo().insertAsync({
          transactionId: result.transactionId,
          orderId: p.order.id,
          orderNumber: p.order.orderNumber,
          amount: p.amount,
          providerRef: result.providerRef,
          checkoutReference: group.checkoutReference,
        });
      }
    }
    return {
      ...result, retriedCheckout: true, subOrders: pending.map((p) => p.order.orderNumber), path: allowed.path,
    };
  }

  const result = await beginAttemptAsync({
    systemName: order.paymentMethodSystemName,
    amount: order.total,
    currency: order.currency,
    checkoutReference: order.checkoutReference,
    orderId: order.id,
    orderGuid: order.orderGuid,
    customer,
    storeId,
    data,
    attemptNo: Number(latest?.attemptNo ?? 0) + 1,
    actor: actor ?? customer?.email ?? 'storefront',
  });
  return {
    ...result,
    sameOrder: order.orderNumber,
    path: allowed.path,
    methodType: allowed.methodType,
    sameMerchantReference: true,
  };
}

/**
 * AC-PAY-011-04-04: a Redirection adapter asked to post-process the one order native checkout
 * hands it finds the group transaction linked to that order and redirects for the checkout
 * total, with the CheckoutSession reference.
 */
export async function postProcessPaymentAsync({ orderNumber, storeId = 1 }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  const link = await linkRepo().getOneAsync((l) => Number(l.orderId) === Number(order.id));
  const transaction = link
    ? await txRepo().getByIdAsync(Number(link.transactionId))
    : await txRepo().getOneAsync((t) => Number(t.orderId ?? 0) === Number(order.id));
  if (!transaction) return { ok: false, message: 'no payment transaction for that order' };
  const connector = connectorFor(transaction.methodSystemName ?? order.paymentMethodSystemName);
  if ((connector?.methodType ?? 'Standard') !== 'Redirection') {
    return {
      ok: true, redirect: false, methodType: connector?.methodType ?? 'Standard', note: 'only a Redirection adapter redirects',
    };
  }
  const query = await callAsync(connector.systemName, 'QueryStatus', { providerRef: transaction.providerRef });
  return {
    ok: true,
    redirect: true,
    orderPassedByNative: order.orderNumber,
    merchantReference: transaction.checkoutSessionId
      ? transaction.checkoutReference
      : order.orderGuid,
    amount: transaction.amount,
    forCheckoutTotal: Boolean(transaction.checkoutSessionId),
    amountOfThatOrderAlone: order.total,
    providerStatus: query.ok ? (query.status ?? null) : null,
    rule: 'AC-PAY-011-04-04',
  };
}

/* ======================================= AC-PAY-011-04-08 the unlinked share ============ */

/** The group transactions whose seller share never reached a saved sub-order. */
export async function unlinkedSharesAsync() {
  const rows = await txRepo().getAllAsync((t) => Boolean(t.checkoutSessionId));
  const out = [];
  for (const transaction of rows) {
    const links = await linkRepo().getAllAsync((l) => Number(l.transactionId) === Number(transaction.id));
    const linkedVendors = links.map((l) => Number(l.orderId));
    for (const share of transaction.shares ?? []) {
      const order = await repository('Order').getOneAsync(
        (o) => o.checkoutReference === transaction.checkoutReference
          && Number(o.vendorId) === Number(share.vendorId),
      );
      if (order && linkedVendors.includes(Number(order.id))) continue;
      out.push({
        transactionId: transaction.id,
        checkoutReference: transaction.checkoutReference,
        vendorId: share.vendorId,
        amount: share.amount,
        status: transaction.status,
        refundComesFrom: 'RET through IC-PAY-05, source type PlacementFailure (AC-PAY-016-01-08)',
        payMakesNoRefundItself: true,
        rule: 'AC-PAY-011-04-08',
      });
    }
  }
  return out;
}

export async function transactionsAsync({ storeId = null } = {}) {
  const rows = await txRepo().getAllAsync();
  return rows
    .filter((t) => (storeId === null ? true : Number(t.storeId) === Number(storeId)))
    .slice()
    .reverse();
}

export async function exceptionsAsync() {
  return (await repository('PaymentException').getAllAsync()).slice().reverse();
}
