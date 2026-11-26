// PAY - payment method offer, execution and status.
//
// PAY-001 chooses which methods are offered (PaymentSettings.ActivePaymentMethodSystemNames plus
// PAY-024 routing rules); PAY-011 owns payment status. CLAUDE.md: "Order payment status changes
// only through IOrderProcessingService" - here the placement host and markPaidAsync are the only
// writers. BR-CHK-022 / SPLIT-PAY: a multi-seller checkout offers only methods that declare
// group support (IC-PAY-02).
//
// Every rail is a mock under packages/mocks (decision P-3): M-Pesa, TNM Mpamba, Airtel Money,
// cards, bank transfer, cash at outlet, cash on delivery, PayPal, letter of credit.

import { mockRegistry, paymentMethodsFor } from '@product/mocks';
import { getSettingAsync } from '../../../core/settings.js';
import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { publishAsync } from '../../../core/events.js';

const txRepo = () => repository('PaymentTransaction');

const FEES = {
  'Payments.CashOnDelivery': 1.5,
  'Payments.CashAtOutlet': 0,
};

export async function paymentMethodsForStoreAsync({ storeId = 1, multiSeller = false } = {}) {
  const active = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', storeId, []);
  const adapters = paymentMethodsFor(active);
  const available = [];
  const excluded = [];
  for (const a of adapters) {
    const entry = {
      systemName: a.systemName,
      name: a.name,
      kind: a.kind,
      capture: a.capture,
      requiresPhone: a.requiresPhone,
      offlineAtCounter: a.offlineAtCounter,
      supportsGroupPayment: a.supportsGroupPayment,
      feature: a.feature,
      additionalFee: FEES[a.systemName] ?? 0,
    };
    if (multiSeller && !a.supportsGroupPayment) {
      excluded.push({
        ...entry,
        reason: 'no-group-support',
        explanation: 'This method cannot take one payment for a cart that is split between sellers.',
        citation: 'BR-CHK-022 / decision SPLIT-PAY: paying once for several sub-orders needs group support (IC-CHK-04 = IC-PAY-02)',
      });
      continue;
    }
    available.push(entry);
  }
  return { available, excluded, activeSystemNames: active };
}

export async function processPaymentAsync({
  systemName, amount, currency, checkoutReference, customer, storeId = 1, data = {}, groupPayment = false,
}) {
  const adapter = mockRegistry[systemName];
  if (!adapter) throw new Error(`payment method ${systemName} is not active`);
  const result = await adapter.processPaymentAsync({
    amount, currency, reference: checkoutReference, phone: data.phone ?? customer?.phone ?? null, groupPayment,
  });
  const tx = await txRepo().insertAsync({
    systemName,
    checkoutReference,
    amount,
    currency,
    status: result.status,
    providerRef: result.providerRef,
    customerAction: result.customerAction ?? null,
    groupPayment,
    raw: result.raw ?? null,
    storeId,
  });
  await auditAsync({
    event: 'AUD-PAY-011-01',
    area: 'PAY',
    feature: 'PRD-PAY-011',
    entity: 'PaymentTransaction',
    entityId: tx.id,
    actor: customer?.email ?? 'storefront',
    after: { systemName, amount, status: result.status, providerRef: result.providerRef },
    note: groupPayment ? 'group payment for a multi-seller checkout (IC-PAY-02)' : 'single-seller checkout',
  });
  return { ...result, transactionId: tx.id };
}

/** The mobile-money handset confirmation (or cancellation) coming back from the rail. */
export async function confirmPushAsync({ providerRef, accept = true }) {
  const tx = await txRepo().getOneAsync((t) => t.providerRef === providerRef);
  if (!tx) throw new Error(`no payment transaction for ${providerRef}`);
  const adapter = mockRegistry[tx.systemName];
  const result = await adapter.confirmPushAsync({ providerRef, accept });
  await txRepo().updateAsync({ ...tx, status: result.status, receipt: result.receipt ?? null, raw: result.raw ?? tx.raw });

  const orders = await repository('Order').getAllAsync((o) => o.paymentProviderRef === providerRef);
  for (const order of orders) {
    await repository('Order').updateAsync({
      ...order,
      paymentStatus: result.status === 'Paid' ? 'Paid' : 'Pending',
      paidOnUtc: result.status === 'Paid' ? new Date().toISOString() : null,
    });
    await publishAsync(result.status === 'Paid' ? 'OrderPaidEvent' : 'OrderPaymentFailedEvent', { order });
    await auditAsync({
      event: 'AUD-PAY-011-02',
      area: 'PAY',
      feature: 'PRD-PAY-011',
      entity: 'Order',
      entityId: order.id,
      actor: 'payment-callback',
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: result.status === 'Paid' ? 'Paid' : 'Pending' },
      note: `${tx.systemName} callback (mock) for ${providerRef}`,
    });
  }
  return { ...result, orders: orders.map((o) => o.orderNumber) };
}

/**
 * The retry path an order with an interrupted payment offers (AC-CHK-008-02-01): the native
 * RePostPayment, allowed while PaymentSettings.AllowRepostingPayments is on. The payment keeps
 * the checkout reference and the OrderGuid it had, so the provider sees the same request.
 * PRD-PAY-011 owns payment status; this is the entry point it exposes for the retry.
 */
export async function retryPaymentAsync({
  orderNumber, storeId = 1, data = {}, customer = null,
}) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'order not found' };
  const allowed = await getSettingAsync('paymentsettings.allowrepostingpayments', storeId, true);
  if (allowed !== true) {
    return { ok: false, message: 'This store does not allow a payment to be started again.' };
  }
  if (order.paymentStatus === 'Paid') {
    return { ok: false, alreadyPaid: true, message: 'This order has already been paid.' };
  }
  const result = await processPaymentAsync({
    systemName: order.paymentMethodSystemName,
    amount: order.total,
    currency: order.currency,
    checkoutReference: order.checkoutReference,
    orderGuid: order.orderGuid,
    customer,
    storeId,
    data,
  });
  await repository('Order').updateAsync({
    ...order,
    paymentProviderRef: result.providerRef,
    paymentStatus: result.status === 'Paid' ? 'Paid' : 'Pending',
    paidOnUtc: result.status === 'Paid' ? new Date().toISOString() : null,
  });
  await auditAsync({
    event: 'AUD-PAY-011-02',
    area: 'PAY',
    feature: 'PRD-PAY-011',
    entity: 'Order',
    entityId: order.id,
    actor: customer?.email ?? 'storefront',
    before: { paymentStatus: order.paymentStatus },
    after: { paymentStatus: result.status === 'Paid' ? 'Paid' : 'Pending' },
    note: `the payment of ${order.orderNumber} was started again with the same checkout reference`,
  });
  return {
    ok: true,
    status: result.status,
    providerRef: result.providerRef,
    customerAction: result.customerAction ?? null,
    checkoutReference: order.checkoutReference,
    sameMerchantReference: true,
  };
}

/** PAY-036: confirming a payment made outside the platform (cash at the counter, bank transfer). */
export async function markPaidOfflineAsync({ orderNumber, actor = 'finance', note = '' }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) throw new Error('order not found');
  const before = { paymentStatus: order.paymentStatus };
  const updated = await repository('Order').updateAsync({
    ...order, paymentStatus: 'Paid', paidOnUtc: new Date().toISOString(),
  });
  await publishAsync('OrderPaidEvent', { order: updated });
  await auditAsync({
    event: 'AUD-PAY-036-01',
    area: 'PAY',
    feature: 'PRD-PAY-036',
    entity: 'Order',
    entityId: order.id,
    actor,
    actorRole: 'Finance',
    before,
    after: { paymentStatus: 'Paid' },
    note: note || 'payment made outside the platform, confirmed by finance (PAY-036; held by PAY-DIRECT / LIC-01 - prototype default)',
  });
  return updated;
}

export async function transactionsAsync() {
  const rows = await txRepo().getAllAsync();
  return rows.slice().reverse();
}
