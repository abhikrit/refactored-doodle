// Session 0 acceptance tests.
//
// CLAUDE.md: "one automated test per AC (test name = AC ID)". Every test below is named by an
// acceptance criterion that exists in packages/shared/data/criteria.json, and asserts what the
// criterion states for the part of it the prototype builds. scripts/check-consistency.mjs fails
// if a test name is not a real AC ID; scripts/build-trace.mjs reconciles these results into
// trace/ and marks everything else not-built rather than passing.
//
//   npm test

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createApiApp } from '../../packages/server/src/app.js';

let server;
let base;
const SESSION = 'test-session';

const call = async (method, path, body, session = SESSION) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-session': session },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
const get = (p, s) => call('GET', p, undefined, s);
const post = (p, b, s) => call('POST', p, b ?? {}, s);
const patch = (p, b, s) => call('PATCH', p, b ?? {}, s);

const applyClient = (clientId) => post('/api/platform/packs/apply', { clientId, storeId: 1 });

async function emptyCart(session = SESSION) {
  const cart = await get('/api/checkout-area/cart', session);
  for (const item of [...cart.items, ...cart.savedForLater]) {
    await call('DELETE', `/api/checkout-area/cart/items/${item.id}`, undefined, session);
  }
}

/** Build the Session 0 journey cart: two sellers, one delivered and one collected. */
async function twoSellerCart(session = SESSION) {
  await emptyCart(session);
  const products = await get('/api/catalogue/products', session);
  const sellable = products.filter((p) => !p.callForPrice && p.inStock);
  const first = sellable[0];
  const second = sellable.find((p) => p.vendorId !== first.vendorId);
  assert.ok(second, 'the seeded catalogue must hold products from at least two sellers');
  await post('/api/checkout-area/cart/items', { productId: first.id, quantity: 2 }, session);
  await post('/api/checkout-area/cart/items', { productId: second.id, quantity: 1 }, session);
  const cart = await get('/api/checkout-area/cart', session);
  const points = await get('/api/logistics/pickup-points', session);
  const pickupLine = cart.items.find((i) => i.productId === second.id);
  await patch(`/api/checkout-area/cart/items/${pickupLine.id}`, { fulfilment: 'pickup', pickupPointId: points[0].id }, session);
  return { first, second, pickupPointId: points[0].id };
}

before(async () => {
  const { app } = await createApiApp({ defaultClient: 'KTDA' });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => { server?.close(); });

/* ---------------------------------------------- PLT-003 configuration packs -- */

describe('PRD-PLT-003 Configuration packs', () => {
  test('AC-PLT-003-01-01', async () => {
    // "the client value wins over the vertical value, the vertical over the country, the country
    // over the global" - the merge order BR-PLT-010.
    await applyClient('KTDA');
    const report = await get('/api/platform/packs/report');
    const LAYERS = ['global', 'country', 'vertical', 'client', 'store'];
    for (const key of report.keys) {
      for (const earlier of key.overrode) {
        assert.ok(
          LAYERS.indexOf(earlier.layer) < LAYERS.indexOf(key.layer),
          `${key.key}: ${earlier.layer} must not override ${key.layer}`,
        );
      }
    }
    // the chain itself is in layer order
    const order = report.chain.map((c) => LAYERS.indexOf(c.layer));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
  });

  test('AC-PLT-003-01-02', async () => {
    // "merged shared keys are written as Setting rows with StoreId 0 and store entries as rows
    // with StoreId of the named store".
    const settings = await get('/api/platform/settings');
    const shared = settings.filter((s) => s.storeId === 0);
    const scoped = settings.filter((s) => s.storeId !== 0);
    assert.ok(shared.length > 0, 'the chain must write shared rows');
    assert.ok(scoped.length > 0, 'the store layer must write StoreId = n rows');
    for (const row of scoped) assert.equal(row.layer, 'store');
    for (const row of shared) assert.notEqual(row.layer, 'store');
  });
});

describe('PRD-PLT-022 Feature and module registry', () => {
  test('AC-PLT-022-01-02', async () => {
    // "the state is stored as setting productfeature.<prd-id> ... and resolves store value, else
    // client value, else off".
    const [features, settings] = await Promise.all([
      get('/api/platform/features'), get('/api/platform/settings'),
    ]);
    const on = features.filter((f) => f.enabled);
    assert.ok(on.length > 0);
    for (const f of on.slice(0, 20)) {
      const row = settings.find((s) => s.name === `productfeature.${f.id.toLowerCase()}`);
      assert.ok(row, `${f.id} must be stored as productfeature.<prd-id>`);
    }
    const notInPack = features.find((f) => !f.inPackSet);
    if (notInPack) assert.equal(notInPack.enabled, false, 'a feature no pack states resolves to off');
  });
});

/* --------------------------------------------------------- CHK-001 the cart -- */

describe('PRD-CHK-001 Shopping cart', () => {
  test('AC-CHK-001-01-01', async () => {
    // "the cart shows the change and the totals are recalculated from server-side prices;
    // quantity limits give the native cart warnings".
    await emptyCart();
    const products = await get('/api/catalogue/products');
    const p = products.find((x) => !x.callForPrice && x.inStock);
    const added = await post('/api/checkout-area/cart/items', { productId: p.id, quantity: 2 });
    assert.equal(added.ok, true);
    const line = added.cart.items[0];
    assert.equal(line.quantity, 2);
    assert.equal(line.subtotal, Number((line.unitPrice * 2).toFixed(2)));
    assert.equal(added.cart.subtotal, line.subtotal);

    const overMax = await patch(`/api/checkout-area/cart/items/${line.id}`, { quantity: p.orderMaximumQuantity + 1 });
    assert.equal(overMax.ok, false);
    assert.match(overMax.warnings.join(' '), /maximum quantity/i);

    const removed = await call('DELETE', `/api/checkout-area/cart/items/${line.id}`);
    assert.equal(removed.cart.items.length, 0);
  });

  test('AC-CHK-001-01-02', async () => {
    // "the mini cart shows the number of items and the subtotal" when MiniShoppingCartEnabled.
    await emptyCart();
    const products = await get('/api/catalogue/products');
    const p = products.find((x) => !x.callForPrice && x.inStock);
    const added = await post('/api/checkout-area/cart/items', { productId: p.id, quantity: 3 });
    assert.equal(added.cart.miniCartEnabled, true);
    assert.equal(added.cart.itemCount, 3);
    assert.ok(added.cart.subtotal > 0);
  });

  test('AC-CHK-001-03-01', async () => {
    // "the line leaves the cart and appears in the shopper's saved-for-later list (a native
    // CustomWishlist named by locale key Chk.SavedForLater); the cart totals are recalculated".
    await emptyCart();
    const products = await get('/api/catalogue/products');
    const p = products.find((x) => !x.callForPrice && x.inStock);
    const added = await post('/api/checkout-area/cart/items', { productId: p.id, quantity: 1 });
    const line = added.cart.items[0];
    const saved = await post(`/api/checkout-area/cart/items/${line.id}/save-for-later`, { back: false });
    assert.equal(saved.ok, true);
    assert.equal(saved.cart.items.length, 0);
    assert.equal(saved.cart.savedForLater.length, 1);
    assert.equal(saved.cart.subtotal, 0);
    assert.equal(saved.cart.savedForLaterName, 'Saved for later');
  });

  test('AC-CHK-001-03-02', async () => {
    // "the item is added through AddToCartAsync with stock and price checks".
    const cart = await get('/api/checkout-area/cart');
    const saved = cart.savedForLater[0];
    assert.ok(saved, 'the previous criterion leaves one item saved for later');
    const back = await post(`/api/checkout-area/cart/items/${saved.id}/save-for-later`, { back: true });
    assert.equal(back.ok, true);
    assert.equal(back.cart.items.length, 1);
    assert.equal(back.cart.savedForLater.length, 0);
    assert.ok(back.cart.subtotal > 0, 'totals are recalculated on the way back');
  });
});

/* ------------------------------------------------------- CHK-002 checkout --- */

describe('PRD-CHK-002 Checkout', () => {
  test('AC-CHK-002-02-01', async () => {
    // KTDA: "OrderSettings.AnonymousCheckoutAllowed is on ... the guest completes checkout".
    await applyClient('KTDA');
    await twoSellerCart();
    const state = await get('/api/checkout-area/checkout');
    assert.equal(state.guestCheckoutAllowed, true);
    assert.equal(state.signInRequired, false);
  });

  test('AC-CHK-002-02-02', async () => {
    // Malawi Post: "AnonymousCheckoutAllowed is off ... the sign-in / registration page is shown;
    // no address, shipping or payment step is reachable". Same code, a different pack.
    await applyClient('MPC');
    await twoSellerCart();
    const state = await get('/api/checkout-area/checkout');
    assert.equal(state.guestCheckoutAllowed, false);
    assert.equal(state.signInRequired, true);

    const refused = await post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.stoppedAt, 'eligibility');
    assert.match(refused.failures[0].message, /sign in/i);
    await applyClient('KTDA');
  });

  test('AC-CHK-002-03-01', async () => {
    // "it lists every item with quantity and unit price, the subtotal, discounts, tax, payment
    // fee, delivery or pickup fee and the order total, before payment is executed".
    await twoSellerCart();
    const totals = await get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.MPesa');
    for (const key of ['subtotal', 'deliveryFee', 'paymentFee', 'tax', 'total', 'discount']) {
      assert.equal(typeof totals[key], 'number', `${key} must be shown before payment`);
    }
    assert.equal(
      totals.total,
      Number((totals.subtotal + totals.deliveryFee + totals.paymentFee + totals.tax).toFixed(2)),
    );
  });

  test('AC-CHK-002-04-02', async () => {
    // "line prices and the order total are recalculated on the server ... and the sent value is
    // ignored" - the prototype refuses a confirm whose shown total differs (BR-CHK-004).
    await twoSellerCart();
    const refused = await post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.MPesa',
      termsAccepted: true,
      shownTotal: 0.01,
      paymentData: { phone: '254700000001' },
    });
    assert.equal(refused.ok, false);
    assert.match(refused.stoppedAt, /price check/);
    assert.ok(refused.failures[0].newTotal > 0.01, 'the server states its own total');
  });

  test('AC-CHK-002-05-01', async () => {
    // "the order is not placed and message Chk.TermsRequired is shown" - checked on the server.
    await twoSellerCart();
    const totals = await get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.MPesa');
    const refused = await post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.MPesa',
      termsAccepted: false,
      shownTotal: totals.total,
      paymentData: { phone: '254700000001' },
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.failures[0].message, 'Please accept the terms of service to place your order.');
  });
});

/* -------------------------------- CHK-004 / CHK-005 split placement --------- */

describe('PRD-CHK-004 Multi-seller split checkout', () => {
  let placed;
  let totals;

  test('AC-CHK-004-01-01', async () => {
    // "the cart holds items from N sellers ... one sub-order per group".
    await applyClient('KTDA');
    await twoSellerCart();
    const cart = await get('/api/checkout-area/cart');
    assert.equal(cart.multiSeller, true);
    totals = await get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.MPesa');
    placed = await post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.MPesa',
      termsAccepted: true,
      shownTotal: totals.total,
      paymentData: { phone: '254700000001' },
      billingAddress: { firstName: 'Amina', lastName: 'Otieno', addressLine1: '12 Moi Avenue', city: 'Nairobi', email: 'buyer@example.com' },
      shippingAddress: { firstName: 'Amina', lastName: 'Otieno', addressLine1: '12 Moi Avenue', city: 'Nairobi' },
    });
    assert.equal(placed.ok, true, JSON.stringify(placed.failures ?? {}));
    assert.equal(placed.orders.length, 2);
    assert.equal(new Set(placed.orders.map((o) => o.vendorId)).size, 2);
    assert.equal(new Set(placed.orders.map((o) => o.checkoutReference)).size, 1);
  });

  test('AC-CHK-004-01-02', async () => {
    // "one payment is initiated once, before any sub-order is saved, for the checkout total".
    const tx = await get('/api/payments/transactions');
    const forCheckout = tx.filter((t) => t.checkoutReference === placed.checkoutReference);
    assert.equal(forCheckout.length, 1, 'exactly one payment per checkout');
    assert.equal(forCheckout[0].amount, totals.total);
    assert.equal(forCheckout[0].groupPayment, true);
  });

  test('AC-CHK-004-01-03', async () => {
    // "each amount is allocated across the sub-orders ... and the sum equals the checkout amount".
    const sum = (f) => Number(placed.orders.reduce((s, o) => s + o[f], 0).toFixed(2));
    assert.equal(sum('deliveryFee'), totals.deliveryFee);
    assert.equal(sum('paymentFee'), totals.paymentFee);
    assert.equal(sum('tax'), totals.tax);
    assert.equal(sum('total'), totals.total);
  });

  test('AC-CHK-005-01-03', async () => {
    // "lines are grouped by seller and fulfilment choice and each group becomes its own sub-order".
    const fulfilments = placed.orders.map((o) => o.fulfilment).sort();
    assert.deepEqual(fulfilments, ['delivery', 'pickup']);
    const pickup = placed.orders.find((o) => o.fulfilment === 'pickup');
    assert.ok(pickup.pickupPointId, 'a collection sub-order carries one outlet');
  });

  test('AC-CHK-012-01-02', async () => {
    // "a pickup code is generated (not guessable; stored as a hash)".
    const pickup = placed.orders.find((o) => o.fulfilment === 'pickup');
    assert.match(pickup.pickupCode, /^\d{6}$/);
    const order = await get(`/api/orders/${pickup.orderNumber}`);
    assert.equal(order.hasPickupCode, true);
    assert.equal(JSON.stringify(order).includes(pickup.pickupCode), false, 'the code itself is never read back');
  });

  test('AC-CHK-019-01-03', async () => {
    // "the buyer receives one confirmation ... naming the number of sub-orders".
    assert.match(placed.confirmation, /has been placed/);
    assert.ok(placed.confirmation.includes(String(placed.orders.length)));
    const messages = await get('/api/tracking/messages');
    const confirmations = messages.filter((m) => m.event === 'Chk.OrderPlacedGroup');
    assert.ok(confirmations.length >= 1, 'one confirmation event, on the pack-routed channels');
  });

  test('AC-ORD-007-01-02', async () => {
    // "the mask uses the padded token {ID:6} ... the number is for example MP-2026-000123".
    for (const o of placed.orders) {
      assert.match(o.orderNumber, /^KTDA-\d{4}-\d{6}$/);
    }
  });

  test('AC-PAY-004-01-01', async () => {
    // "a payment request is sent to the shopper's phone and the payment stays Pending".
    assert.equal(placed.payment.status, 'Pending');
    assert.match(placed.payment.customerAction, /phone/i);
    assert.ok(placed.payment.providerRef);
  });

  test('AC-PAY-004-01-02', async () => {
    // "the provider callback reports success ... the order becomes Paid".
    const cb = await post('/api/payments/callback', { providerRef: placed.payment.providerRef, accept: true });
    assert.equal(cb.status, 'Paid');
    assert.equal(cb.orders.length, placed.orders.length);
    for (const number of cb.orders) {
      const order = await get(`/api/orders/${number}`);
      assert.equal(order.paymentStatus, 'Paid');
    }
  });

  test('AC-SEC-004-03-01', async () => {
    // "matching events are listed with old and new values" - searchable by entity and actor.
    // The trail needs Security.Core.AuditTrail.View, so it is read as an administrator.
    await post('/api/identity/sign-in', { email: 'admin@example.com', password: 'demo' }, 'journey-auditor');
    const trail = await get('/api/security/audit?area=CHK', 'journey-auditor');
    assert.ok(trail.length >= placed.orders.length);
    const entry = trail.find((e) => e.event === 'AUD-CHK-004-01');
    assert.ok(entry, 'placing a sub-order writes an audit event');
    assert.ok(entry.actor && entry.entity === 'Order' && entry.after);
    const byActor = await get(`/api/security/audit?actor=${encodeURIComponent(entry.actor)}`, 'journey-auditor');
    assert.ok(byActor.every((e) => e.actor === entry.actor));
  });

  test('AC-ORD-002-02-01', async () => {
    // "a transition that is not declared ... is refused, the stage is unchanged and the attempt
    // is logged with user, order, from, to".
    const number = placed.orders[0].orderNumber;
    const before = await get(`/api/orders/${number}`);
    const refused = await post(`/api/orders/${number}/advance`, { to: 'Delivered' });
    assert.equal(refused.ok, false);
    const after = await get(`/api/orders/${number}`);
    assert.equal(after.stage, before.stage, 'the stage is unchanged');
    await post('/api/identity/sign-in', { email: 'admin@example.com', password: 'demo' }, 'journey-auditor');
    const trail = await get('/api/security/audit?event=AUD-ORD-002-02', 'journey-auditor');
    assert.ok(trail.some((e) => e.entityId === String(before.id) && e.outcome === 'rejected'));
  });

  test('AC-LOG-012-03-01', async () => {
    // "the buyer presents the pickup code ... IC-CHK-09 Verify answers Valid ... the hand-over is
    // confirmed" - and a wrong code is refused first (AC-CHK-012-02-02).
    const pickup = placed.orders.find((o) => o.fulfilment === 'pickup');
    await post(`/api/orders/${pickup.orderNumber}/advance`, { to: 'Accepted' });
    await post(`/api/orders/${pickup.orderNumber}/advance`, { to: 'Packed' });
    const shipment = await post('/api/logistics/shipments', { orderNumber: pickup.orderNumber });
    await post(`/api/logistics/shipments/${shipment.trackingNumber}/dispatch`);

    const wrong = await post('/api/logistics/handover', {
      orderNumber: pickup.orderNumber, code: '000000', pickupPointId: pickup.pickupPointId,
    });
    assert.equal(wrong.ok, false);

    const ok = await post('/api/logistics/handover', {
      orderNumber: pickup.orderNumber, code: pickup.pickupCode, pickupPointId: pickup.pickupPointId,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.stage.order.stage, 'Delivered');
    assert.ok(ok.proofOfDelivery.capturedOnUtc);
  });

  test('AC-CHK-012-02-03', async () => {
    // "a code already Used ... answers Used and nothing is handed over".
    const pickup = placed.orders.find((o) => o.fulfilment === 'pickup');
    const again = await post('/api/logistics/handover', {
      orderNumber: pickup.orderNumber, code: pickup.pickupCode, pickupPointId: pickup.pickupPointId,
    });
    assert.equal(again.ok, false);
    assert.equal(again.message, 'This pickup code has already been used.');
  });

  test('AC-TRK-001-01-01', async () => {
    // "the page shows the shipment's timeline".
    const shipments = await get('/api/logistics/shipments');
    const tracking = await get(`/api/tracking/${shipments[0].trackingNumber}`);
    assert.equal(tracking.found, true);
    assert.ok(tracking.events.length >= 2);
    assert.ok(tracking.events.every((e) => e.code && e.occurredOnUtc));
  });

  test('AC-TRK-001-01-02', async () => {
    // "the number matches no shipment ... nothing else is revealed".
    const tracking = await get('/api/tracking/NO-SUCH-NUMBER');
    assert.equal(tracking.found, false);
    assert.equal(tracking.order, null);
    assert.equal(tracking.events.length, 0);
  });

  test('AC-TRK-011-01-02', async () => {
    // "the order number and contact do not match ... without saying which field is wrong".
    const number = placed.orders[0].orderNumber;
    const bad = await get(`/api/tracking/guest-status?orderNumber=${number}&contact=wrong@example.com`);
    assert.equal(bad.found, false);
    assert.ok(bad.reason && !/email|phone/i.test(bad.reason.replace('contact details', '')));
  });
});

/* ------------------------------------------- pickup-only and group payment -- */

describe('PRD-CHK-005 Fulfilment method per line', () => {
  test('AC-CHK-005-01-05', async () => {
    // "an item is pickup-only ... Delivery is not offered for that line".
    await applyClient('MPC');
    await emptyCart('pickup-only-session');
    const products = await get('/api/catalogue/products', 'pickup-only-session');
    const pickupOnly = products.find((p) => p.pickupOnly);
    assert.ok(pickupOnly, 'the Malawi Post seed holds a pickup-only product');
    const added = await post('/api/checkout-area/cart/items', { productId: pickupOnly.id, quantity: 1 }, 'pickup-only-session');
    const line = added.cart.items[0];
    assert.equal(line.fulfilment, 'pickup');
    const refused = await patch(`/api/checkout-area/cart/items/${line.id}`, { fulfilment: 'delivery' }, 'pickup-only-session');
    assert.equal(refused.ok, false);
    assert.equal(refused.warnings[0], 'This item can only be collected from an outlet.');
    await applyClient('KTDA');
  });
});

describe('PRD-CHK-004 group payment support', () => {
  test('AC-CHK-004-01-07', async () => {
    // "items from different sellers cannot yet be bought in one order" is the fallback when no
    // method declares group support (BR-CHK-022 / SPLIT-PAY): a method without it is not offered.
    await applyClient('KTDA');
    await twoSellerCart('group-session');
    const state = await get('/api/checkout-area/checkout', 'group-session');
    assert.ok(state.paymentMethods.every((m) => m.supportsGroupPayment));
    assert.ok(state.paymentMethodsExcluded.length > 0);
    assert.ok(state.paymentMethodsExcluded.every((m) => m.reason === 'no-group-support'));

    const refused = await post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: state.paymentMethodsExcluded[0].systemName,
      termsAccepted: true,
      paymentData: {},
    }, 'group-session');
    assert.equal(refused.ok, false);
    assert.equal(refused.failures[0].message, 'Items from different sellers cannot yet be bought in one order. Please buy them in separate orders.');
  });
});
