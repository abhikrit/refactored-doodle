// PRD-CHK-004 multi-seller split checkout (12 ACs, held by WF-ENG and PAY-DIRECT / LIC-01 and
// built as the chapter's Proposed option), PRD-CHK-008 checkout resilience and idempotency
// (9 ACs) and PRD-CHK-019 order confirmation (4 ACs). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { lockHistory } from '../../packages/server/src/core/locker.js';
import { validatePack } from '../../packages/server/src/core/pack-loader.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';
import {
  splitGroups, allocate, groupPaymentAsync, checkoutLinksAsync, requestRefundAsync, sellersOf,
} from '../../packages/server/src/plugins/product-chk/services/split.js';
import {
  resumeAsync, resumePaymentAsync, checkoutNodeReadinessAsync, idempotencyKey, cartHash,
  updateSessionAsync, placementIntervalGuardAsync, clearPlacementInterval, markPlacement,
  orderGuidForAsync, placementLockCount, idempotentPlacementAsync, recordIdempotentResultAsync,
} from '../../packages/server/src/plugins/product-chk/services/resilience.js';
import { registeredEventCodes, isEventCodeRegistered } from '../../packages/server/src/plugins/product-trk/services/notifications.js';
import { setLineFulfilmentAsync, METHOD } from '../../packages/server/src/plugins/product-chk/services/fulfilment.js';
import { getCartAsync } from '../../packages/server/src/plugins/product-chk/services/cart.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

let n = 0;
async function signedInAsync(label) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `chk4-${n}@example.com`, firstName: 'Chk', lastName: 'Shopper', roles: ['Registered'], phone: '+265996000001',
  });
  const sessionId = `${label}-${customer.id}`;
  await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, sessionId);
  clearPlacementInterval(customer.id);
  return { customer, sessionId };
}

/** Products of two different sellers, so a cart can hold items from both. */
async function sellerProductsAsync() {
  const quotas = await repository('Quota').getAllAsync((q) => q.scope === 'product');
  const reserved = new Set(quotas.map((q) => String(q.refId)));
  const rows = await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
    && p.isShipEnabled !== false && p.vendorId && !reserved.has(String(p.id))
    && !(p.limitedToCustomerRoles?.length > 0));
  const byVendor = new Map();
  for (const row of rows) {
    if (!byVendor.has(Number(row.vendorId))) byVendor.set(Number(row.vendorId), row);
  }
  return [...byVendor.values()];
}

const addAsync = (session, productId, quantity = 1) => api.post('/api/checkout-area/cart/items', { productId, quantity }, session);

const confirmAsync = (session, extra = {}) => api.post('/api/checkout-area/checkout/confirm', {
  paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' }, ...extra,
}, session);

async function withSettingAsync(key, value, fn, storeId = 0) {
  const before = await getSettingAsync(key, storeId);
  await saveSettingAsync(key, value, storeId);
  try { return await fn(); } finally { await saveSettingAsync(key, before, storeId); }
}

/* ====================================================== PRD-CHK-004 =================== */

describe('PRD-CHK-004 one checkout, one sub-order per seller', () => {
  test('AC-CHK-004-01-01', async () => {
    // "the splitter returns one group per seller and the host creates N native orders, each with
    //  its own OrderGuid and custom order number, all linked to one CheckoutSession; the
    //  confirmation page shows the checkout reference and every sub-order"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('split');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const cart = await api.get('/api/checkout-area/cart', sessionId);
    assert.equal(cart.sellers.length, 2, 'the cart holds items of two sellers');

    const preview = await api.get('/api/checkout-area/split/preview?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(preview.groups.length, 2, 'the splitter returns one group per seller');
    assert.match(preview.prototypeDefault, /Prototype default/, 'and the feature says which decisions are pending');

    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.orders.length, 2, 'one native order per seller');
    assert.equal(new Set(placed.orders.map((o) => o.orderGuid)).size, 2, 'each with its own OrderGuid');
    assert.equal(new Set(placed.orders.map((o) => o.orderNumber)).size, 2, 'and its own order number');
    for (const order of placed.orders) {
      assert.equal(order.checkoutReference, placed.checkoutReference, 'all under one checkout reference');
    }

    const links = await checkoutLinksAsync(placed.checkoutReference);
    assert.equal(links.length, 2, 'one link row per sub-order');
    assert.equal(new Set(links.map((l) => l.checkoutSessionId)).size, 1, 'all linked to one checkout session');

    // the client's own items (no seller) count as one seller
    assert.deepEqual(sellersOf({ items: [{ vendorId: null }, { vendorId: 0 }] }), [0]);
  });

  test('AC-CHK-004-01-02', async () => {
    // "one payment is initiated once, before any sub-order is saved, for the checkout total with
    //  the CheckoutSession reference as merchant reference and the share of each seller; the one
    //  result is applied to every sub-order; after each sub-order is saved the PAY participant
    //  links it to the group transaction"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('one-payment');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const totals = await api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId);

    const before = (await repository('PaymentTransaction').getAllAsync()).length;
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.payments, 1, 'one payment for the checkout');
    const transactions = await repository('PaymentTransaction').getAllAsync((t) => t.checkoutReference === placed.checkoutReference);
    assert.equal(transactions.length, 1);
    assert.equal(transactions[0].checkoutReference, placed.checkoutReference, 'the merchant reference is the checkout reference');
    assert.equal(Number(transactions[0].amount), Number(totals.total), 'for the checkout total');
    assert.equal((await repository('PaymentTransaction').getAllAsync()).length, before + 1);

    for (const order of placed.orders) {
      assert.equal(order.paymentProviderRef, transactions[0].providerRef, 'the one result is applied to every sub-order');
      const link = await repository('OrderPaymentLink').getOneAsync((l) => Number(l.orderId) === Number(order.id));
      assert.ok(link, 'and each sub-order is linked to the group transaction');
      assert.equal(link.groupPayment, true);
      assert.equal(Number(link.share), Number(order.total), 'with its own share');
    }
  });

  test('AC-CHK-004-01-03', async () => {
    // "each amount is allocated to sub-orders by BR-CHK-007, and the sub-order totals add up
    //  exactly to the total shown on the confirm page"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('allocation');
    await addAsync(sessionId, first.id, 2);
    await addAsync(sessionId, second.id);
    const summary = await api.get('/api/checkout-area/checkout/confirm-summary?paymentMethodSystemName=Payments.TnmMpamba', sessionId);

    const preview = await api.get('/api/checkout-area/split/preview?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(preview.allocation.rule, 'BR-CHK-007');
    assert.equal(preview.allocation.addsUp, true, 'the parts add up to the checkout total');
    assert.equal(preview.allocation.checkoutTotal, summary.total, 'which is the total the confirm page shows');

    const placed = await confirmAsync(sessionId, { shownTotal: summary.total });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const sum = Number(placed.orders.reduce((s, o) => s + o.total, 0).toFixed(2));
    assert.equal(sum, summary.total, 'and so do the saved sub-orders');

    // a delivery fee quoted for one seller stays with that seller's sub-order
    for (const order of placed.orders) {
      const quote = placed.totals.perSeller.find((g) => Number(g.vendorId) === Number(order.vendorId));
      if (quote) assert.equal(order.deliveryFee, quote.fee, `${order.orderNumber} keeps its own delivery fee`);
    }
  });

  test('AC-CHK-004-01-04', async () => {
    // "the native per-customer mutex is taken once for the whole checkout and the
    //  MinimumOrderPlacementInterval cache key is set once after all sub-orders are saved, so the
    //  second sub-order is not refused by the interval check"
    const [first, second] = await sellerProductsAsync();
    const { customer, sessionId } = await signedInAsync('one-lock');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);

    const lockBefore = placementLockCount(customer.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.orders.length, 2, 'both sub-orders were saved');
    assert.equal(placementLockCount(customer.id) - lockBefore, 1, 'the mutex is taken once for the checkout');

    // the interval key was set once, after the last sub-order: a new checkout now waits
    const guard = await placementIntervalGuardAsync({ customer, sessionId, storeId: 1 });
    assert.equal(guard.ok, false, 'the interval applies to the next checkout');
    assert.equal(guard.messageKey, 'Checkout.MinOrderPlacementInterval');
    clearPlacementInterval(customer.id);
  });

  test('AC-CHK-004-01-05', async () => {
    // "sub-orders already saved are kept, the CheckoutSession becomes PlacementException, an
    //  exception appears for Checkout.Core.Exceptions.View holders and is audited (AUD-CHK-007),
    //  and the shopper sees Chk.SplitPlacementFailed with the checkout reference"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('placement-exception');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);

    // the second sub-order cannot be saved: its seller row is gone when placement reaches it
    const vendors = await repository('Vendor').getAllAsync();
    const target = vendors.find((v) => Number(v.id) === Number(second.vendorId));
    const originalInsert = repository('OrderItemFulfilment').insertAsync;
    let saved = 0;
    repository('OrderItemFulfilment').insertAsync = async (row) => {
      saved += 1;
      if (saved > 1) throw new Error('the fulfilment row could not be written');
      return originalInsert.call(repository('OrderItemFulfilment'), row);
    };
    let refused;
    try {
      refused = await confirmAsync(sessionId);
    } finally {
      repository('OrderItemFulfilment').insertAsync = originalInsert;
    }
    assert.ok(target, 'the second seller exists');

    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Chk.SplitPlacementFailed');
    assert.match(refused.failures[0].message, new RegExp(refused.checkoutReference));
    assert.equal(refused.ordersKept, 1, 'the sub-order already saved is kept');
    assert.ok(refused.payment, 'the payment stays as it was');

    const session = await repository('CheckoutSession').getOneAsync((s) => s.reference === refused.checkoutReference);
    assert.equal(session.state, 'PlacementException');

    const exceptions = await api.get('/api/checkout-area/checkout/exceptions', SESSIONS.admin);
    const row = exceptions.find((e) => e.checkoutReference === refused.checkoutReference);
    assert.ok(row, 'the exception is listed for the holders of the exceptions permission');
    assert.equal(row.permission, 'Checkout.Core.Exceptions.View');

    const trail = await auditTrailAsync({ event: 'AUD-CHK-007' });
    assert.ok(trail.some((e) => e.after?.state === 'PlacementException'), 'and it is audited');

    // a refund for the share that was never saved goes through RET-005, never straight to PAY
    const refund = await api.post(`/api/checkout-area/checkout/exceptions/${refused.checkoutReference}/refund`, {
      amount: 100, reason: 'the second sub-order was never saved',
    }, SESSIONS.admin);
    assert.equal(refund.ok, true);
    assert.equal(refund.raisedThrough, 'IC-RET-04');
    assert.equal(refund.owner, 'PRD-RET-005');
    assert.equal(refund.trigger.sourceType, 'PlacementFailure');
    assert.equal(refund.trigger.checkoutReference, refused.checkoutReference);
    assert.ok(refund.trigger.paymentTransactionId, 'with the payment transaction of the checkout');
  });

  test('AC-CHK-004-02-01', async () => {
    // "only sub-orders that contain the vendor's products are listed, and each has a seller task
    //  list in state New (ORD-005, created by the split)"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('seller-view');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    for (const order of placed.orders) {
      const task = await repository('SellerTask').getOneAsync((t) => Number(t.orderId) === Number(order.id));
      assert.ok(task, `${order.orderNumber} has a seller task list`);
      assert.equal(task.state, 'New');
      assert.equal(Number(task.vendorId), Number(order.vendorId), 'for that seller');
      assert.match(task.prototypeDefault, /WF-ENG/, 'labelled with the decision still pending');
    }

    // a vendor user sees only the sub-orders that hold their own products
    const sellerAccount = await repository('Customer').getOneAsync((c) => c.email === 'seller@example.com');
    assert.ok(sellerAccount?.vendorId, 'the seller account is linked to a seller');
    const sellerOrders = await api.get('/api/orders', SESSIONS.seller);
    assert.ok(
      sellerOrders.every((o) => Number(o.vendorId) === Number(sellerAccount.vendorId)),
      'no other seller\'s sub-order is listed',
    );
    const otherSeller = placed.orders.find((o) => Number(o.vendorId) !== Number(sellerAccount.vendorId));
    if (otherSeller) {
      assert.equal(
        sellerOrders.some((o) => o.orderNumber === otherSeller.orderNumber),
        false,
        'including the one placed in this test',
      );
    }
  });

  test('AC-CHK-004-02-02', async () => {
    // "the native OrderPlaced.VendorNotification is sent to that seller for that sub-order only"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('vendor-notification');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const deliveries = await deliveriesAsync();
    const sent = deliveries.filter((d) => d.event === 'OrderPlaced.VendorNotification'
      && placed.orders.some((o) => String(d.tokens?.['order number'] ?? '') === o.orderNumber));
    assert.equal(sent.length, 2, 'one vendor notification per sub-order');
    for (const message of sent) {
      const order = placed.orders.find((o) => o.orderNumber === message.tokens['order number']);
      const vendor = await repository('Vendor').getByIdAsync(order.vendorId);
      assert.equal(message.to, vendor.email, 'sent to that seller only');
    }
  });

  test('AC-CHK-004-01-06', async () => {
    // "one order is created and linked to the CheckoutSession; no allocation is needed"
    const [first] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('one-seller');
    await addAsync(sessionId, first.id, 2);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.orders.length, 1, 'one order');
    assert.equal(placed.split, false);
    const links = await checkoutLinksAsync(placed.checkoutReference);
    assert.equal(links.length, 1, 'linked to the checkout session');
    assert.equal(placed.allocation.allocations.length, 1, 'and nothing is shared out');
    assert.equal(placed.allocation.allocations[0].total, placed.orders[0].total);
  });

  test('AC-CHK-004-03-01', async () => {
    // "the remainder in the currency's minor unit goes to the sub-order with the largest
    //  subtotal, so the parts sum exactly"
    const groups = [
      { key: 'a', vendorId: 1, items: [{ subtotal: 100 }] },
      { key: 'b', vendorId: 2, items: [{ subtotal: 50 }] },
      { key: 'c', vendorId: 3, items: [{ subtotal: 50 }] },
    ];
    const totals = {
      deliveryFee: 10, paymentFee: 0.1, discount: 0, tax: 1.33, total: 211.43, perSeller: [],
    };
    const result = allocate({ groups, totals });
    assert.equal(result.remainderTo, 'a', 'the largest subtotal carries the remainder');
    const fees = result.allocations.map((a) => a.paymentFee);
    assert.equal(Number(fees.reduce((s, n) => s + n, 0).toFixed(2)), 0.1, 'the payment fee is shared out exactly');
    const taxes = result.allocations.map((a) => a.tax);
    assert.equal(Number(taxes.reduce((s, n) => s + n, 0).toFixed(2)), 1.33, 'and so is the tax');
    const delivery = result.allocations.map((a) => a.deliveryFee);
    assert.equal(Number(delivery.reduce((s, n) => s + n, 0).toFixed(2)), 10);
    assert.equal(result.addsUp, true, 'and the parts add up to the checkout total');
  });

  test('AC-CHK-004-01-07', async () => {
    // "the CHK-003 cart override returns message Chk.MultiSellerNotSupported, checkout cannot be
    //  confirmed, and the shopper can remove items until one seller remains; when some methods
    //  declare group support, only those are offered"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('no-group-payment');
    const added = await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);

    const group = await api.get('/api/checkout-area/split/group-payment', sessionId);
    assert.equal(group.multiSeller, true);
    assert.equal(group.rule, 'BR-CHK-022');
    assert.equal(group.decision, 'SPLIT-PAY');
    assert.ok(group.methodsOffered.every((m) => m.supportsGroupPayment === true), 'only group-capable methods are offered');

    // with no group-capable method the cart says so and the checkout cannot be confirmed
    const active = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', 1, []);
    await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', ['Payments.CashOnDelivery', 'Payments.CashAtOutlet'], 1);
    try {
      const warned = await api.get('/api/checkout-area/cart', sessionId);
      assert.ok(
        warned.items.length >= 2,
        'the cart still holds the items',
      );
      const check = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
      assert.ok(check.warnings.some((w) => w.key === 'Chk.MultiSellerNotSupported'), 'the cart override returns the warning');
      assert.equal(
        check.warnings.find((w) => w.key === 'Chk.MultiSellerNotSupported').message,
        'Items from different sellers cannot yet be bought in one order. Please buy them in separate orders.',
      );
      const refused = await confirmAsync(sessionId, { paymentMethodSystemName: 'Payments.CashOnDelivery' });
      assert.equal(refused.ok, false, 'and the checkout cannot be confirmed');
    } finally {
      await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', active, 1);
    }

    // removing the other seller's items leaves a cart that can be bought
    const cart = await api.get('/api/checkout-area/cart', sessionId);
    const other = cart.items.find((i) => Number(i.vendorId) !== Number(first.vendorId));
    await api.del(`/api/checkout-area/cart/items/${other.id}`, sessionId);
    const oneSeller = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
    assert.equal(oneSeller.warnings.some((w) => w.key === 'Chk.MultiSellerNotSupported'), false);
    assert.ok(added.ok);
  });

  test('AC-CHK-004-01-08', async () => {
    // "both keys are in the CHK key catalogue with the fixed value off, so pack validation
    //  refuses another value"
    assert.equal(await getSettingAsync('shoppingcartsettings.vendorenabled', 1, null), false);
    assert.equal(await getSettingAsync('shoppingcartsettings.vendorrequired', 1, null), false);

    const refused = validatePack({
      layer: 'client',
      id: 'TEST',
      settings: { 'shoppingcartsettings.vendorenabled': true },
    });
    assert.ok(refused.some((p) => p.key === 'shoppingcartsettings.vendorenabled' && p.severity === 'refused'), 'a pack cannot turn it on');
    assert.match(refused.find((p) => p.key === 'shoppingcartsettings.vendorenabled').message, /CART-500|fixes this key/);

    const required = validatePack({
      layer: 'store',
      id: 'TEST',
      settings: { 'shoppingcartsettings.vendorrequired': true },
    });
    assert.ok(required.some((p) => p.key === 'shoppingcartsettings.vendorrequired' && p.severity === 'refused'));

    const allowed = validatePack({
      layer: 'client',
      id: 'TEST',
      settings: { 'shoppingcartsettings.vendorenabled': false },
    });
    assert.equal(allowed.some((p) => p.key === 'shoppingcartsettings.vendorenabled'), false, 'off is accepted');
  });

  test('AC-CHK-004-01-09', async () => {
    // "no vendor selector is shown, no item is moved to the Stash cart type and the one cart
    //  reaches the CHK-004 split placement"
    const [first, second] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('one-cart');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);

    const cart = await api.get('/api/checkout-area/cart', sessionId);
    assert.equal(cart.items.length, 2, 'both sellers stay in the one cart');
    assert.equal(cart.vendorSelector ?? false, false, 'no vendor selector is shown');
    const stashed = await repository('ShoppingCartItem').getAllAsync((i) => Number(i.customerId) === Number(customer.id)
      && Number(i.cartType) === 4);
    assert.equal(stashed.length, 0, 'nothing is moved to the stash');

    const warnings = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
    assert.equal(
      warnings.warnings.some((w) => w.key === 'ShoppingCart.SelectVendorToCheckout'),
      false,
      'the native vendor warning never fires',
    );
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, 'and the one cart reaches the split placement');
    assert.equal(placed.orders.length, 2);
  });
});

/* ====================================================== PRD-CHK-008 =================== */

describe('PRD-CHK-008 one reference, no duplicate orders', () => {
  test('AC-CHK-008-01-01', async () => {
    // "a CheckoutSession with a unique reference is created, or the open session of the same
    //  customer and store is reused; the reference is shown on the payment and confirm steps"
    const [first] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('reference');
    await addAsync(sessionId, first.id);

    const steps = await api.get('/api/checkout-area/checkout/steps', sessionId);
    assert.match(steps.reference, /^CHK-[0-9A-F]{10}$/, 'a reference that cannot be guessed');
    const again = await api.get('/api/checkout-area/checkout/steps', sessionId);
    assert.equal(again.reference, steps.reference, 'the open session of the same customer and store is reused');

    const summary = await api.get('/api/checkout-area/checkout/confirm-summary?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(summary.reference, steps.reference, 'the confirm step shows it');

    const open = await repository('CheckoutSession').getAllAsync((s) => Number(s.customerId) === Number(customer.id)
      && s.state === 'Open');
    assert.equal(open.length, 1, 'one open session per customer and store (BR-CHK-012)');
  });

  test('AC-CHK-008-01-02', async () => {
    // "the reference is stored on every sub-order, passed to PAY as merchant reference, shown on
    //  the order details and tracking pages, and searchable in admin; the native custom order
    //  number is still generated"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('reference-on-orders');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    for (const order of placed.orders) {
      assert.equal(order.checkoutReference, placed.checkoutReference);
      assert.match(order.orderNumber, /^[A-Z0-9-]+$/, 'the custom order number is still generated');
      const detail = await api.get(`/api/orders/${order.orderNumber}`, SESSIONS.admin);
      assert.equal(detail.checkoutReference, placed.checkoutReference, 'the order details show the reference');
      const tracking = await api.get(`/api/tracking/orders/${order.orderNumber}`, SESSIONS.admin);
      assert.ok(tracking, 'and the tracking page can be reached by order');
    }

    const transaction = await repository('PaymentTransaction').getOneAsync((t) => t.checkoutReference === placed.checkoutReference);
    assert.ok(transaction, 'PAY received it as the merchant reference');

    const found = await api.get(`/api/orders?checkoutReference=${placed.checkoutReference}`, SESSIONS.admin);
    assert.equal(found.length, 2, 'and admin can search by it');
  });

  test('AC-CHK-008-02-01', async () => {
    // "the order details offer to complete payment through the PAY retry path"
    const [first] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('resume-payment');
    await addAsync(sessionId, first.id);
    const placed = await confirmAsync(sessionId, { paymentMethodSystemName: 'Payments.CashAtOutlet' });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const order = placed.orders[0];
    assert.equal(order.paymentStatus, 'Pending', 'the payment was not completed');

    const resume = await api.get(`/api/checkout-area/orders/${order.orderNumber}/resume-payment`, sessionId);
    assert.equal(resume.canCompletePayment, true, 'the order offers to complete the payment');
    assert.match(resume.retryThrough, /PRD-PAY-011/);
    assert.equal(resume.checkoutReference, placed.checkoutReference);

    // with reposting switched off the order does not offer it
    const off = await withSettingAsync('paymentsettings.allowrepostingpayments', false, async () => resumePaymentAsync({ orderNumber: order.orderNumber, storeId: 1 }), 1);
    assert.equal(off.canCompletePayment, false);
  });

  test('AC-CHK-008-02-02', async () => {
    // "the cart, addresses, chosen shipping option and payment method are kept and the same
    //  CheckoutSession reference is shown"
    const [first] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('resume');
    await addAsync(sessionId, first.id);
    const steps = await api.get('/api/checkout-area/checkout/steps', sessionId);
    await api.post('/api/checkout-area/checkout/steps/billing', {
      antiforgeryToken: 'token',
      values: {
        firstName: 'Chk', lastName: 'Shopper', addressLine1: 'Area 47', city: 'Lilongwe', country: 'Malawi', phone: '+265996000001',
      },
    }, sessionId);
    await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token', values: { shippingMethod: 'Standard' },
    }, sessionId);

    // the shopper comes back later, on another device
    const second = `${sessionId}-again`;
    await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, second);
    const resumed = await api.get('/api/checkout-area/checkout/resume', second);
    assert.equal(resumed.resumed, true);
    assert.equal(resumed.reference, steps.reference, 'the same reference is shown');
    assert.equal(resumed.cartLines, 1, 'the cart is kept');
    assert.equal(resumed.billingAddress.city, 'Lilongwe', 'and the address');
    assert.equal(resumed.shippingMethod, 'Standard', 'and the chosen shipping option');
    assert.ok(resumed.completedSteps.includes('billing'));
  });

  test('AC-CHK-008-03-01', async () => {
    // "only one order is created; the second request receives the native message
    //  Checkout.MinOrderPlacementInterval"
    const [first] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('double-confirm');
    await addAsync(sessionId, first.id);

    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const orders = (await repository('Order').getAllAsync((o) => o.checkoutReference === placed.checkoutReference)).length;

    // the same customer presses pay again
    await addAsync(sessionId, first.id);
    const second = await confirmAsync(sessionId);
    assert.equal(second.ok, false, 'no second order is created');
    assert.equal(second.messageKey, 'Checkout.MinOrderPlacementInterval');
    assert.match(second.failures[0].message, /place the next order/);
    assert.equal(second.orderCreated, false);
    assert.equal(
      (await repository('Order').getAllAsync((o) => o.checkoutReference === placed.checkoutReference)).length,
      orders,
      'and the first checkout still has its one order',
    );
    clearPlacementInterval(customer.id);
  });

  test('AC-CHK-008-03-02', async () => {
    // "the PLT-027 idempotency key (CheckoutSession reference + cart hash) returns the existing
    //  order to the second request; no second order or charge is created"
    const [first] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('idempotent');
    await addAsync(sessionId, first.id);
    const key = await api.get('/api/checkout-area/checkout/idempotency', sessionId);
    assert.ok(key.key.startsWith(`${key.reference}:`), 'the key is the reference and the cart hash');
    assert.equal(key.cartHash.length, 32);

    await withSettingAsync('plt.idempotencykeysenabled', true, async () => {
      const placed = await confirmAsync(sessionId);
      assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
      const transactions = (await repository('PaymentTransaction').getAllAsync((t) => t.checkoutReference === placed.checkoutReference)).length;
      const stored = await repository('IdempotencyKey').getOneAsync((r) => r.checkoutReference === placed.checkoutReference);
      assert.ok(stored, 'the key of the placed checkout is kept');
      assert.deepEqual(stored.orderIds, placed.orders.map((o) => o.id), 'with the orders it produced');

      // the same request reaches a second web node: the same reference and the same cart
      const session = await repository('CheckoutSession').getOneAsync((x) => x.reference === placed.checkoutReference);
      const sameCart = {
        items: placed.orders.flatMap((o) => (o.lines ?? [])),
      };
      const cartOfRequest = {
        items: [{
          productId: first.id, quantity: 1, unitPrice: placed.orders[0].subtotal, fulfilment: 'delivery', pickupPointId: null,
        }],
      };
      const firstNode = await idempotentPlacementAsync({ session, cart: cartOfRequest, storeId: 1 });
      assert.equal(firstNode.enabled, true);
      await recordIdempotentResultAsync({ key: firstNode.key, orders: placed.orders, storeId: 1 });
      const secondNode = await idempotentPlacementAsync({ session, cart: cartOfRequest, storeId: 1 });
      assert.equal(secondNode.replay, true, 'the second request gets the first result');
      assert.deepEqual(
        secondNode.orders.map((o) => o.orderNumber),
        placed.orders.map((o) => o.orderNumber),
        'the existing orders, not new ones',
      );
      assert.equal(
        (await repository('PaymentTransaction').getAllAsync((t) => t.checkoutReference === placed.checkoutReference)).length,
        transactions,
        'and no second charge',
      );
      assert.ok(sameCart);
    }, 1);
    clearPlacementInterval(customer.id);
  });

  test('AC-CHK-008-03-03', async () => {
    // "the same OrderGuid is reused (native) and the provider sees the same merchant reference"
    const { sessionId, customer } = await signedInAsync('order-guid');
    const session = await repository('CheckoutSession').insertAsync({
      sessionId, customerId: customer.id, storeId: 1, state: 'Open', reference: 'CHK-GUIDTEST01',
    });
    const first = await orderGuidForAsync({ session, storeId: 1 });
    assert.equal(first.reused, false, 'the first request gets a new OrderGuid');
    assert.equal(first.merchantReference, 'CHK-GUIDTEST01');

    const fresh = await repository('CheckoutSession').getByIdAsync(session.id);
    const retry = await orderGuidForAsync({ session: fresh, storeId: 1 });
    assert.equal(retry.reused, true, 'a retry inside the interval reuses it');
    assert.equal(retry.orderGuid, first.orderGuid);
    assert.equal(retry.merchantReference, first.merchantReference, 'so the provider sees the same reference');

    // outside the interval a new GUID is issued
    const stale = await repository('CheckoutSession').updateAsync({
      ...fresh, orderGuidIssuedOnUtc: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    const after = await orderGuidForAsync({ session: stale, storeId: 1 });
    assert.equal(after.reused, false);
    assert.notEqual(after.orderGuid, first.orderGuid);
  });

  test('AC-CHK-008-01-03', async () => {
    // "the second write is saved, it fails on the row version of the plugin table and is retried
    //  after re-reading"
    const { sessionId, customer } = await signedInAsync('row-version');
    const session = await repository('CheckoutSession').insertAsync({
      sessionId, customerId: customer.id, storeId: 1, state: 'Open', reference: 'CHK-ROWVER001', rowVersion: 0,
    });

    const firstWrite = await updateSessionAsync({ id: session.id, changes: { shippingMethod: 'Standard' }, expectedRowVersion: 0 });
    assert.equal(firstWrite.ok, true);
    assert.equal(firstWrite.rowVersion, 1, 'the row version moves on');

    // a second request that still holds the old row version is retried after re-reading
    const stale = await updateSessionAsync({ id: session.id, changes: { shippingMethod: 'Express' }, expectedRowVersion: 0 });
    assert.equal(stale.ok, true, 'the retry succeeds');
    assert.equal(stale.retried, true, 'after re-reading the row');
    assert.equal(stale.rowVersion, 2);
    assert.equal((await repository('CheckoutSession').getByIdAsync(session.id)).shippingMethod, 'Express');

    // with no retry left the conflict is reported rather than overwriting
    const conflict = await updateSessionAsync({
      id: session.id, changes: { shippingMethod: 'Standard' }, expectedRowVersion: 0, retries: 0,
    });
    assert.equal(conflict.ok, false);
    assert.equal(conflict.conflict, true);
  });

  test('AC-CHK-008-03-04', async () => {
    // "the checklist item fails and the instance is not set Active; in P1 duplicate-order
    //  protection is the native per-host placement lock and minimum interval"
    const one = await checkoutNodeReadinessAsync({ storeId: 1 });
    assert.equal(one.ok, true, 'one web node is the P1 deployment');
    assert.equal(one.blocksActivation, false);
    assert.equal(one.rule, 'BR-PLT-004');
    assert.equal(one.dependsOn, 'PRD-PLT-027');

    const many = await withSettingAsync('plt.webnodesservingcheckout', 3, async () => checkoutNodeReadinessAsync({ storeId: 1 }), 1);
    assert.equal(many.ok, false, 'more than one web node fails the item');
    assert.equal(many.blocksActivation, true, 'so the instance cannot be set Active');
    assert.match(many.message, /one host only/);

    const withKeys = await withSettingAsync('plt.webnodesservingcheckout', 3, async () => withSettingAsync('plt.idempotencykeysenabled', true, async () => checkoutNodeReadinessAsync({ storeId: 1 }), 1), 1);
    assert.equal(withKeys.ok, true, 'and passes once idempotency keys are delivered');
  });
});

/* ====================================================== PRD-CHK-019 =================== */

describe('PRD-CHK-019 the confirmation', () => {
  test('AC-CHK-019-01-01', async () => {
    // "the completed page shows the custom order number, the checkout reference and, for a split
    //  checkout, every sub-order with its seller"
    const [first, second] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('completed-page');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    assert.match(placed.checkoutReference, /^CHK-/, 'the checkout reference');
    assert.equal(placed.orders.length, 2);
    for (const order of placed.orders) {
      assert.ok(order.orderNumber, 'each sub-order with its own order number');
      assert.ok(order.vendorName, 'and its seller');
    }
    assert.equal(placed.split, true);

    const disabled = await getSettingAsync('ordersettings.disableordercompletedpage', 1, false);
    assert.equal(disabled, false, 'the completed page is not switched off for this store');
  });

  test('AC-CHK-019-01-02', async () => {
    // "the native OrderPlaced.CustomerNotification email with the order number is queued, with
    //  the PDF invoice attached when AttachPdfInvoiceToOrderPlacedEmail is on"
    const [first] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('customer-notification');
    await addAsync(sessionId, first.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const deliveries = await deliveriesAsync();
    const sent = deliveries.filter((d) => d.event === 'OrderPlaced.CustomerNotification'
      && d.tokens?.['order number'] === placed.orders[0].orderNumber);
    assert.ok(sent.length >= 1, 'the native customer notification is queued');
    const email = sent.find((d) => d.channel === 'email');
    assert.ok(email, 'on the e-mail channel');
    assert.equal(email.to, customer.email);
    assert.equal(email.status, 'Pending', 'queued for sending, not sent from the request');
    assert.deepEqual(email.attachments ?? [], [], 'with no invoice while the setting is off');

    // with the setting on the invoice is attached
    const { sessionId: withInvoice, customer: buyer } = await signedInAsync('invoice-attached');
    await addAsync(withInvoice, first.id);
    const second = await withSettingAsync('ordersettings.attachpdfinvoicetoorderplacedemail', true, async () => confirmAsync(withInvoice), 1);
    assert.equal(second.ok, true, second.failures?.[0]?.message ?? 'placed');
    const invoiceMail = (await deliveriesAsync()).find((d) => d.event === 'OrderPlaced.CustomerNotification'
      && d.channel === 'email'
      && d.tokens?.['order number'] === second.orders[0].orderNumber);
    assert.deepEqual(invoiceMail.attachments, [`invoice-${second.orders[0].orderNumber}.pdf`]);
    assert.equal(invoiceMail.to, buyer.email);
  });

  test('AC-CHK-019-01-03', async () => {
    // "the buyer receives one confirmation (Chk.OrderPlacedGroup) listing all sub-orders instead
    //  of one native email per sub-order, sent by TRK-005; seller notifications are unchanged"
    const [first, second] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('group-confirmation');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const deliveries = await deliveriesAsync();
    const group = deliveries.filter((d) => d.event === 'Chk.OrderPlacedGroup'
      && d.tokens?.reference === placed.checkoutReference);
    const toBuyer = group.filter((d) => d.to === customer.email);
    assert.ok(toBuyer.length >= 1, 'one confirmation for the checkout, to the buyer');
    assert.equal(new Set(group.map((d) => d.tokens.reference)).size, 1);
    assert.equal(group[0].tokens.count, 2, 'listing every sub-order');
    for (const order of placed.orders) {
      assert.match(group[0].tokens['sub-orders'], new RegExp(order.orderNumber));
    }

    const perOrder = deliveries.filter((d) => d.event === 'OrderPlaced.CustomerNotification'
      && placed.orders.some((o) => d.tokens?.['order number'] === o.orderNumber));
    assert.equal(perOrder.length, 0, 'and no native e-mail per sub-order');

    const vendorMail = deliveries.filter((d) => d.event === 'OrderPlaced.VendorNotification'
      && placed.orders.some((o) => d.tokens?.['order number'] === o.orderNumber));
    assert.equal(vendorMail.length, 2, 'seller notifications are unchanged');
  });

  test('AC-CHK-019-01-04', async () => {
    // "CHK registers its product event codes with TRK-005 through IC-TRK-04 RegisterEventCode,
    //  with default channels and localised default content: Chk.OrderPlacedGroup (active) and
    //  Chk.PickupCode (inactive by default); a send with an unregistered code is refused by TRK"
    const codes = registeredEventCodes().filter((c) => c.owningModule === 'Product.CHK');
    const group = codes.find((c) => c.code === 'Chk.OrderPlacedGroup');
    assert.ok(group, 'the group confirmation code is registered');
    assert.equal(group.feature, 'PRD-CHK-019');
    assert.ok(group.defaultChannels.includes('email'), 'active, with its default channels');
    assert.ok(group.content.email, 'and its default content');

    const pickup = codes.find((c) => c.code === 'Chk.PickupCode');
    assert.ok(pickup, 'the pickup code event is registered too');
    assert.deepEqual(pickup.defaultChannels, [], 'inactive by default');
    assert.equal(pickup.feature, 'PRD-CHK-012');

    assert.equal(isEventCodeRegistered('Chk.OrderPlacedGroup'), true);
    assert.equal(isEventCodeRegistered('Chk.NotRegistered'), false);

    // an administrator can configure each registered code like a native template
    const definitions = await api.get('/api/notifications/definitions', SESSIONS.admin);
    assert.ok(definitions.some((d) => d.key === 'Chk.OrderPlacedGroup'), 'each code has a definition');
    const pickupDefinition = definitions.find((d) => d.key === 'Chk.PickupCode');
    assert.ok(pickupDefinition, 'including the pickup code');

    // a send with a code TRK does not know is refused
    const refused = await api.post('/api/notifications/send', {
      key: 'Chk.NotRegistered', recipients: [{ email: 'buyer@example.com' }],
    }, SESSIONS.admin);
    assert.equal(refused.ok, false, 'TRK refuses an unregistered code');
    assert.match(String(refused.message ?? ''), /not a notification definition or a registered event code/);
  });
});
