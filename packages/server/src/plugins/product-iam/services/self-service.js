// PRD-IAM-021 Order and document history, PRD-IAM-025 Customer self-service dashboard.
//
// The order list and details are the native My-account pages reading the ORD-002 order; the PDF
// invoice is the native one. Quotes and return requests come from the bundled Misc.RFQ plugin.
//
// AC-IAM-025-01-01 says the "waiting for you" items come "from the modules that own them" but the
// PRD names no contract for it, so the prototype uses the provider registry under its own key,
// WAITING_ITEMS below. It is the prototype's name, not a PRD contract id, and it keeps IAM free
// of module-specific code; a later IC id replaces the key and nothing else.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { providers, runProviders } from '../../../core/providers.js';
import { ordersAsync, orderAsync } from '../../product-ord/services/orders.js';
import { addToCartAsync } from '../../product-chk/services/cart.js';

const OPEN_STATUSES = ['Pending', 'Processing'];

/** The prototype's own extension key for AC-IAM-025-01-01 (the PRD names no contract). */
export const WAITING_ITEMS = 'PRD-IAM-025 waiting items';

/* ========================================================= PRD-IAM-021 the history ====== */

/** AC-IAM-021-01-01: number, date, status and total per order. */
export async function myOrdersAsync({ customer, storeId = 1 }) {
  const byId = await ordersAsync({ customerId: customer.id });
  const rows = byId.length
    ? byId
    : await repository('Order').getAllAsync((o) => o.customerEmail === customer.email);
  const orders = rows
    .slice()
    .sort((a, b) => new Date(b.createdOnUtc ?? 0) - new Date(a.createdOnUtc ?? 0) || b.id - a.id)
    .map((o) => ({
      orderNumber: o.orderNumber,
      createdOnUtc: o.createdOnUtc ?? null,
      orderStatus: o.orderStatus,
      orderTotal: o.orderTotal,
      currency: o.currencyCode ?? null,
      checkoutReference: o.checkoutReference ?? null,
    }));
  return { orders, total: orders.length, storeId };
}

export async function myOrderDetailAsync({ customer, orderNumber }) {
  const order = await orderAsync(orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  if (order.customerEmail !== customer.email && order.customerId !== customer.id) {
    return { ok: false, denied: true, message: 'That order belongs to another account.' };
  }
  return {
    ok: true,
    order: {
      orderNumber: order.orderNumber,
      createdOnUtc: order.createdOnUtc ?? null,
      orderStatus: order.orderStatus,
      orderSubtotal: order.orderSubtotal ?? null,
      orderShipping: order.orderShipping ?? null,
      orderTax: order.orderTax ?? null,
      orderTotal: order.orderTotal,
    },
    items: (order.items ?? []).map((i) => ({
      productName: i.productName, quantity: i.quantity, unitPrice: i.unitPriceInclTax ?? i.unitPrice, total: i.priceInclTax ?? i.price,
    })),
    shipments: (order.shipments ?? []).map((s) => ({
      shipmentId: s.id, trackingNumber: s.trackingNumber ?? null, shippedDateUtc: s.shippedDateUtc ?? null, deliveredDateUtc: s.deliveredDateUtc ?? null,
    })),
    pickupCode: order.pickupCode ?? null,
  };
}

/** AC-IAM-021-02-01: the native PDF invoice. */
export async function invoicePdfAsync({ customer, orderNumber }) {
  const detail = await myOrderDetailAsync({ customer, orderNumber });
  if (detail.ok !== true) return detail;
  return {
    ok: true,
    file: {
      name: `order_${orderNumber}.pdf`,
      contentType: 'application/pdf',
      source: 'native PdfService.PrintOrderToPdfAsync',
      pages: 1,
      bytes: 1024 + (detail.items.length * 64),
    },
  };
}

/* ------------------------------------------------- the bundled Misc.RFQ plugin ---------- */

export const rfqActiveAsync = (storeId = 1) => getSettingAsync('misc.rfq.active', storeId, true);

/** AC-IAM-021-03-01: quotes and return requests, each in its own page. */
export async function quotesAsync({ customer, storeId = 1 }) {
  const active = await rfqActiveAsync(storeId);
  if (active !== true) {
    return { offered: false, reason: 'the bundled Misc.RFQ plugin is not active', quotes: [] };
  }
  const quotes = await repository('Quote').getAllAsync((q) => q.customerId === customer.id);
  return {
    offered: true,
    page: '/customer/quotes',
    quotes: quotes.map((q) => ({
      quoteNumber: q.quoteNumber, createdOnUtc: q.createdOnUtc, status: q.status, total: q.total,
    })),
  };
}

export async function returnRequestsAsync({ customer }) {
  const rows = await repository('ReturnRequest').getAllAsync((r) => r.customerId === customer.id);
  return {
    page: '/customer/return-requests',
    returnRequests: rows.map((r) => ({
      id: r.id, orderNumber: r.orderNumber, status: r.status, createdOnUtc: r.createdOnUtc, reason: r.reasonForReturn ?? null,
    })),
  };
}

/** AC-IAM-021-03-03: the quote PDF only when RfqSettings.AllowCustomerGenerateQuotePdf is on. */
export async function quotePdfAsync({ customer, quoteNumber, storeId = 1 }) {
  const allowed = await getSettingAsync('rfqsettings.allowcustomergeneratequotepdf', storeId, false);
  const quote = await repository('Quote').getOneAsync((q) => q.quoteNumber === quoteNumber && q.customerId === customer.id);
  if (!quote) return { ok: false, message: 'no such quote' };
  if (allowed !== true) {
    return {
      ok: false, offered: false, setting: 'rfqsettings.allowcustomergeneratequotepdf', settingDefault: false, message: 'No PDF is offered for quotes on this store.',
    };
  }
  return {
    ok: true,
    offered: true,
    file: {
      name: `quote_${quoteNumber}.pdf`, contentType: 'application/pdf', source: 'native Misc.RFQ quote PDF', bytes: 2048,
    },
  };
}

/** AC-IAM-021-03-02: the filtered history, exported as CSV or XLSX. */
export async function historyAsync({
  customer, type = null, from = null, to = null, status = null, minValue = null, maxValue = null, storeId = 1,
}) {
  const { orders } = await myOrdersAsync({ customer, storeId });
  const { quotes } = await quotesAsync({ customer, storeId });
  const { returnRequests } = await returnRequestsAsync({ customer });
  const rows = [
    ...orders.map((o) => ({
      type: 'Order', reference: o.orderNumber, date: o.createdOnUtc, status: o.orderStatus, value: o.orderTotal,
    })),
    ...quotes.map((q) => ({
      type: 'Quote', reference: q.quoteNumber, date: q.createdOnUtc, status: q.status, value: q.total,
    })),
    ...returnRequests.map((r) => ({
      type: 'Return', reference: `RET-${r.id}`, date: r.createdOnUtc, status: r.status, value: null,
    })),
  ].filter((r) => (!type || r.type === type)
    && (!from || new Date(r.date ?? 0) >= new Date(from))
    && (!to || new Date(r.date ?? 0) <= new Date(to))
    && (!status || r.status === status)
    && (minValue === null || minValue === undefined || (r.value ?? 0) >= Number(minValue))
    && (maxValue === null || maxValue === undefined || (r.value ?? 0) <= Number(maxValue)))
    .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0));
  return { rows, total: rows.length };
}

export async function historyExportAsync({ format = 'csv', ...filter }) {
  const { rows } = await historyAsync(filter);
  if (!['csv', 'xlsx'].includes(format)) return { ok: false, message: 'the export is CSV or XLSX' };
  const header = 'type,reference,date,status,value';
  const csv = [header, ...rows.map((r) => [r.type, r.reference, r.date ?? '', r.status, r.value ?? ''].join(','))].join('\n');
  return {
    ok: true,
    format,
    rowCount: rows.length,
    file: {
      name: `history.${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      bytes: csv.length,
    },
    csv: format === 'csv' ? csv : null,
  };
}

/** AC-IAM-021-04-01: Re-order when OrderSettings.IsReOrderAllowed is on. */
export async function reorderAsync({
  customer, orderNumber, sessionId, storeId = 1,
}) {
  const allowed = await getSettingAsync('ordersettings.isreorderallowed', storeId, true);
  if (allowed !== true) {
    return { ok: false, offered: false, setting: 'ordersettings.isreorderallowed', message: 'Re-order is not offered on this store.' };
  }
  const detail = await myOrderDetailAsync({ customer, orderNumber });
  if (detail.ok !== true) return detail;
  const order = await orderAsync(orderNumber);
  const added = [];
  const refused = [];
  for (const item of order.items ?? []) {
    const result = await addToCartAsync({
      sessionId, productId: item.productId, quantity: item.quantity, customer, storeId,
    });
    if (result?.ok === false) refused.push({ productId: item.productId, warnings: result.warnings ?? [result.message] });
    else added.push({ productId: item.productId, quantity: item.quantity });
  }
  return {
    ok: refused.length === 0, added, refused, itemsInOrder: (order.items ?? []).length,
  };
}

/* ====================================================== PRD-IAM-025 the dashboard ======= */

export const DEFAULT_QUICK_ACTIONS = [
  { code: 'reorder', name: 'Re-order', target: '/customer/orders' },
  { code: 'track', name: 'Track a parcel', target: '/order/tracking' },
  { code: 'quote', name: 'Ask for a quote', target: '/customer/quotes' },
  { code: 'support', name: 'Contact us', target: '/contactus' },
];

/** AC-IAM-025-02-01: the configured actions, each opening its target page. */
export async function quickActionsAsync({ storeId = 1 }) {
  const configured = await getSettingAsync('iam.quickactions', storeId, DEFAULT_QUICK_ACTIONS);
  return { actions: configured, configurable: 'iam.quickactions' };
}

/**
 * AC-IAM-025-01-01: open orders, open quotes, the items that wait for the customer - from the
 * modules that own them (IC-IAM-10) - and the latest messages.
 */
export async function dashboardAsync({ customer, storeId = 1 }) {
  const { orders } = await myOrdersAsync({ customer, storeId });
  const openOrders = orders.filter((o) => OPEN_STATUSES.includes(o.orderStatus));
  const { quotes, offered } = await quotesAsync({ customer, storeId });
  const openQuotes = quotes.filter((q) => ['Open', 'Sent', 'AwaitingCustomer'].includes(q.status));

  const results = await runProviders(WAITING_ITEMS, 'collect', { customerId: customer.id, storeId });
  const waitingForYou = results.flatMap((r) => (r.result?.items ?? []).map((item) => ({
    ...item, ownedBy: r.feature,
  })));

  const deliveries = await repository('MessageDelivery').getAllAsync((d) => d.to === customer.email || d.to === customer.phone);
  const latestMessages = deliveries
    .slice()
    .sort((a, b) => new Date(b.sentOnUtc ?? 0) - new Date(a.sentOnUtc ?? 0) || b.id - a.id)
    .slice(0, 5)
    .map((d) => ({
      event: d.event, channel: d.channel, at: d.sentOnUtc, subject: d.subject ?? null,
    }));

  return {
    openOrders,
    openQuotes: offered ? openQuotes : [],
    waitingForYou,
    providersAsked: results.map((r) => r.feature),
    latestMessages,
  };
}

export const waitingProviders = () => providers(WAITING_ITEMS).map((p) => ({ feature: p.feature, name: p.name }));

/** AC-IAM-025-03-01: orders and spending per month for the chosen period. */
export async function figuresAsync({
  customer, months = 6, storeId = 1,
}) {
  const { orders } = await myOrdersAsync({ customer, storeId });
  const buckets = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, orders: 0, spending: 0,
    });
  }
  for (const order of orders) {
    if (!order.createdOnUtc) continue;
    const month = order.createdOnUtc.slice(0, 7);
    const bucket = buckets.find((b) => b.month === month);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.spending += Number(order.orderTotal ?? 0);
  }
  return {
    period: { months, from: buckets[0]?.month ?? null, to: buckets[buckets.length - 1]?.month ?? null },
    byMonth: buckets,
    totalOrders: buckets.reduce((s, b) => s + b.orders, 0),
    totalSpending: buckets.reduce((s, b) => s + b.spending, 0),
  };
}
