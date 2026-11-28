// PAY - the entry points the rest of the prototype calls.
//
// PAY-001 (routing.js) decides which methods are offered; PAY-024 (connector.js) is the contract
// every adapter implements; PAY-011 / PAY-012 (transactions.js) own the transaction record, its
// status and the idempotency of every charge and callback. This file is the thin surface those
// three present to CHK-003 placement, the storefront and the admin console, so callers keep one
// import.
//
// Every rail is a mock under packages/mocks (decision P-3): M-Pesa, TNM Mpamba, Airtel Money,
// cards, bank transfer, cash at outlet, cash on delivery, PayPal, letter of credit.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { methodsForCheckoutAsync } from './routing.js';
import {
  beginAttemptAsync, groupPaymentAsync, applyCallbackAsync, retryAsync, transactionsAsync,
  paymentStatusAsync, TX, transitionAsync, attemptsForOrderAsync,
} from './transactions.js';

export { transactionsAsync, paymentStatusAsync, retryAsync as retryPaymentAsync };

/** The payment step list. Kept for callers that only know the store and the split (CHK-004). */
export async function paymentMethodsForStoreAsync({
  storeId = 1, multiSeller = false, cart = [], customer = null, fulfilment = null,
  address = null, pickupPointId = null, total = null, sellerIds = [],
} = {}) {
  return methodsForCheckoutAsync({
    storeId, multiSeller, cart, customer, fulfilment, address, pickupPointId, total, sellerIds,
  });
}

/**
 * The payment the CHK-003 placement host takes once for the whole checkout (BR-CHK-006). A
 * checkout with one seller is a single attempt; a checkout the splitter divided is one group
 * transaction with a share per seller (IC-PAY-02 = IC-CHK-04, BR-PAY-014).
 */
export async function processPaymentAsync({
  systemName, amount, currency, checkoutReference, customer, storeId = 1, data = {},
  groupPayment = false, sharePerSeller = [], orderGuid = null, orderId = null, agentId = null,
}) {
  const result = groupPayment
    ? await groupPaymentAsync({
      checkoutReference,
      checkoutSessionId: checkoutReference,
      total: amount,
      currency,
      sharePerSeller,
      systemName,
      customer,
      storeId,
      data,
      orderGuid,
      agentId,
    })
    : await beginAttemptAsync({
      systemName,
      amount,
      currency,
      checkoutReference,
      orderId,
      orderGuid,
      customer,
      storeId,
      data,
      agentId,
      shares: sharePerSeller,
    });

  if (result.ok === false && (result.notSupported || result.groupPaymentNotSupported)) {
    throw new Error(result.message);
  }
  return {
    // the shape the placement host already applies to the order it saves
    status: result.nativePaymentStatus ?? (result.status === TX.Successful ? 'Paid' : 'Pending'),
    transactionStatus: result.status,
    providerRef: result.providerRef,
    customerAction: result.customerAction ?? null,
    transactionId: result.transactionId,
    attemptNo: result.attemptNo,
    idempotencyKey: result.idempotencyKey,
    reason: result.reason ?? null,
    duplicate: result.duplicate === true,
    raw: result.raw ?? null,
  };
}

/** The mobile-money handset confirmation (or cancellation) coming back from the rail. */
export async function confirmPushAsync({
  providerRef, accept = true, verified = true, storeId = 1,
}) {
  const result = await applyCallbackAsync({
    providerRef,
    status: accept ? 'Paid' : 'Failed',
    verified,
    reason: accept ? 'the shopper confirmed the request on the handset' : 'Request cancelled by user',
    storeId,
  });
  return {
    ...result,
    status: result.status === TX.Successful ? 'Paid' : result.status === TX.Failed ? 'Failed' : result.status,
    orders: result.paidOrders ?? [],
  };
}

/**
 * PAY-036: a payment made outside the platform, confirmed by finance. The transaction moves
 * Pending -> AwaitingConfirmation -> Successful, so the native order status change still goes
 * through IOrderProcessingService (BR-PAY-010).
 */
export async function markPaidOfflineAsync({
  orderNumber, actor = 'finance', note = '', storeId = 1,
}) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) throw new Error('order not found');
  const attempts = await attemptsForOrderAsync(order);
  const transaction = attempts[0] ?? null;
  if (!transaction) {
    throw new Error('this order has no payment transaction to confirm');
  }
  if (transaction.status === TX.Pending) {
    await transitionAsync({
      transactionId: transaction.id,
      to: TX.AwaitingConfirmation,
      trigger: 'seller marks offline payment paid (PAY-036)',
      reason: note || 'payment made outside the platform, recorded by staff',
      actor,
      storeId,
    });
  }
  const moved = await transitionAsync({
    transactionId: transaction.id,
    to: TX.Successful,
    trigger: 'buyer confirms',
    reason: note || 'the payment made outside the platform was confirmed',
    actor,
    storeId,
  });
  await auditAsync({
    event: 'AUD-PAY-036-01',
    area: 'PAY',
    feature: 'PRD-PAY-036',
    entity: 'Order',
    entityId: order.id,
    actor,
    actorRole: 'Finance',
    storeId,
    after: { paymentStatus: 'Paid' },
    note: note || 'payment made outside the platform, confirmed by finance (PAY-036; held by PAY-DIRECT / LIC-01 - prototype default)',
  });
  return repository('Order').getByIdAsync(order.id);
}
