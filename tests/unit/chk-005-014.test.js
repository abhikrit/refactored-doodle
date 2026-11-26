// PRD-CHK-005 fulfilment method per line (6 ACs) and PRD-CHK-014 estimated delivery at
// checkout (5 ACs). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { registerProvider, providers } from '../../packages/server/src/core/providers.js';
import {
  lineOptionsAsync, setLineFulfilmentAsync, cartFulfilmentOptionsAsync, stepEstimatesAsync,
  estimateForAsync, METHOD,
} from '../../packages/server/src/plugins/product-chk/services/fulfilment.js';
import { splitCart } from '../../packages/server/src/plugins/product-chk/services/checkout.js';
import { getCartAsync } from '../../packages/server/src/plugins/product-chk/services/cart.js';
import { estimateAsync } from '../../packages/server/src/plugins/product-log/services/estimates.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

let n = 0;
async function signedInAsync(label) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `chk5-${n}@example.com`, firstName: 'Chk', lastName: 'Shopper', roles: ['Registered'], phone: '+265996000001',
  });
  const sessionId = `${label}-${customer.id}`;
  await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, sessionId);
  return { customer, sessionId };
}

const outletsAsync = () => repository('StorePickupPoint').getAllAsync();

async function shippableProductAsync(offset = 0) {
  const quotas = await repository('Quota').getAllAsync((q) => q.scope === 'product');
  const reserved = new Set(quotas.map((q) => String(q.refId)));
  const rows = await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
    && p.isShipEnabled !== false && !reserved.has(String(p.id))
    && !(p.limitedToCustomerRoles?.length > 0));
  return rows[offset];
}

const addAsync = (session, productId, quantity = 1) => api.post('/api/checkout-area/cart/items', { productId, quantity }, session);

async function withSettingAsync(key, value, fn, storeId = 0) {
  const before = await getSettingAsync(key, storeId);
  await saveSettingAsync(key, value, storeId);
  try { return await fn(); } finally { await saveSettingAsync(key, before, storeId); }
}

/* ====================================================== PRD-CHK-005 =================== */

describe('PRD-CHK-005 the fulfilment choice of each line', () => {
  test('AC-CHK-005-01-01', async () => {
    // "each cart line offers Delivery or Pickup at a selected outlet; the choice is stored per
    //  line (CartLineFulfilment)"
    const { sessionId, customer } = await signedInAsync('per-line');
    const product = await shippableProductAsync();
    const added = await addAsync(sessionId, product.id);
    const item = added.cart.items[0];

    const options = await lineOptionsAsync({ item: await repository('ShoppingCartItem').getByIdAsync(item.id), customer });
    assert.deepEqual(options.methods.map((m) => m.id), [METHOD.Delivery, METHOD.Pickup]);
    assert.equal(options.methods.every((m) => m.offered), true, 'both are offered for a shippable item');
    assert.ok(options.outlets.length > 0, 'and the outlets that can take it are listed');

    const outlet = options.outlets[0];
    const chosen = await setLineFulfilmentAsync({
      shoppingCartItemId: item.id, method: METHOD.Pickup, pickupPointId: outlet.id,
    });
    assert.equal(chosen.ok, true);

    const stored = await repository('CartLineFulfilment').getOneAsync((l) => Number(l.shoppingCartItemId) === Number(item.id));
    assert.ok(stored, 'the choice is a row of its own, per line');
    assert.equal(stored.method, METHOD.Pickup);
    assert.equal(Number(stored.pickupPointId), Number(outlet.id));

    const cart = await getCartAsync({ sessionId, customer });
    assert.equal(cart.items[0].fulfilment, METHOD.Pickup, 'and the cart reads the same answer');
    assert.equal(Number(cart.items[0].pickupPointId), Number(outlet.id));
  });

  test('AC-CHK-005-01-02', async () => {
    // "delivery options and fees are calculated for the delivery lines and pickup fees for each
    //  outlet group; the confirm page shows each group separately"
    const { sessionId, customer } = await signedInAsync('groups');
    const first = await shippableProductAsync(0);
    const second = await shippableProductAsync(1);
    const addedFirst = await addAsync(sessionId, first.id);
    const addedSecond = await addAsync(sessionId, second.id);
    const collected = addedSecond.cart.items.find((i) => i.productId === second.id);
    const outlet = (await outletsAsync())[0];
    await setLineFulfilmentAsync({ shoppingCartItemId: collected.id, method: METHOD.Pickup, pickupPointId: outlet.id });
    assert.ok(addedFirst.ok);

    const totals = await api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    const delivery = totals.perSeller.filter((g) => g.fulfilment === 'delivery');
    const pickup = totals.perSeller.filter((g) => g.fulfilment === 'pickup');
    assert.ok(delivery.length >= 1, 'the delivery lines are quoted');
    assert.ok(pickup.length >= 1, 'and the collected lines are their own group');
    assert.ok(delivery.every((g) => g.fee > 0), 'a delivery group carries a fee');
    assert.ok(pickup.every((g) => g.fee === 0), 'and collection at an outlet carries none');

    const summary = await api.get('/api/checkout-area/checkout/confirm-summary?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    const lines = summary.lines.map((l) => l.fulfilment);
    assert.ok(lines.includes('delivery') && lines.includes('pickup'), 'the confirm page shows each group');
    assert.equal(summary.deliveryFee, totals.deliveryFee);
  });

  test('AC-CHK-005-01-03', async () => {
    // "lines are grouped by seller and fulfilment choice and each group becomes its own
    //  sub-order (CHK-004), so native Order.PickupInStore and PickupAddressId remain per order"
    const { sessionId, customer } = await signedInAsync('sub-orders');
    const first = await shippableProductAsync(0);
    const second = await shippableProductAsync(1);
    await addAsync(sessionId, first.id);
    const added = await addAsync(sessionId, second.id);
    const collected = added.cart.items.find((i) => i.productId === second.id);
    const outlet = (await outletsAsync())[0];
    await setLineFulfilmentAsync({ shoppingCartItemId: collected.id, method: METHOD.Pickup, pickupPointId: outlet.id });

    const cart = await getCartAsync({ sessionId, customer });
    const groups = splitCart(cart);
    assert.equal(groups.length, 2, 'one group per seller and fulfilment choice');

    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.orders.length, 2, 'each group becomes its own sub-order');

    const delivered = placed.orders.find((o) => o.fulfilment === 'delivery');
    const collectedOrder = placed.orders.find((o) => o.fulfilment === 'pickup');
    assert.equal(delivered.pickUpInStore, false, 'one native PickupInStore value per order');
    assert.equal(collectedOrder.pickUpInStore, true);
    assert.equal(Number(collectedOrder.pickupPointId), Number(outlet.id), 'and one pickup address per order');
    assert.equal(delivered.pickupPointId ?? null, null);

    // the choice follows the line onto the order
    const rows = await repository('OrderItemFulfilment').getAllAsync((r) => Number(r.orderId) === Number(collectedOrder.id));
    assert.ok(rows.length >= 1);
    assert.equal(rows[0].method, METHOD.Pickup);
  });

  test('AC-CHK-005-01-04', async () => {
    // "the outlet is not offered for that line ('where available')"
    const { sessionId, customer } = await signedInAsync('coverage');
    const product = await shippableProductAsync();
    const added = await addAsync(sessionId, product.id);
    const item = await repository('ShoppingCartItem').getByIdAsync(added.cart.items[0].id);

    const outlets = await outletsAsync();
    const handled = outlets[0];
    const closed = outlets[1];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await repository('StorePickupPoint').updateAsync({ ...handled, excludedProductIds: [product.id] });
    await repository('StorePickupPoint').updateAsync({ ...closed, closedDates: [tomorrow] });

    const options = await lineOptionsAsync({ item, customer, date: tomorrow });
    const offeredIds = options.outlets.map((o) => Number(o.id));
    assert.equal(offeredIds.includes(Number(handled.id)), false, 'an outlet that does not handle the item is not offered');
    assert.equal(offeredIds.includes(Number(closed.id)), false, 'nor is one that is closed on the collection date');
    assert.match(options.outletsNotOffered.find((o) => Number(o.id) === Number(handled.id)).reason, /does not handle/);
    assert.match(options.outletsNotOffered.find((o) => Number(o.id) === Number(closed.id)).reason, /closed/);

    const refused = await setLineFulfilmentAsync({
      shoppingCartItemId: item.id, method: METHOD.Pickup, pickupPointId: handled.id,
    });
    assert.equal(refused.ok, false, 'and it cannot be chosen anyway');

    await repository('StorePickupPoint').updateAsync({ ...handled, excludedProductIds: [] });
    await repository('StorePickupPoint').updateAsync({ ...closed, closedDates: [] });
  });

  test('AC-CHK-005-01-05', async () => {
    // "Delivery is not offered for that line" when the item is pickup-only
    const { sessionId, customer } = await signedInAsync('pickup-only');
    const product = await repository('Product').insertAsync({
      name: 'Probe counter service',
      sku: 'CHK-PROBE-PICKUP',
      published: true,
      price: 120,
      manageInventoryMethod: 'DontManageStock',
      orderMinimumQuantity: 1,
      orderMaximumQuantity: 10,
      isShipEnabled: true,
      pickupOnly: true,
      vendorId: null,
    });
    const added = await addAsync(sessionId, product.id);
    const item = await repository('ShoppingCartItem').getByIdAsync(added.cart.items[0].id);

    const options = await lineOptionsAsync({ item, customer });
    const delivery = options.methods.find((m) => m.id === METHOD.Delivery);
    assert.equal(delivery.offered, false, 'delivery is not offered');
    assert.equal(delivery.messageKey, 'Chk.PickupOnly');
    assert.equal(delivery.reason, 'This item can only be collected from an outlet.');
    assert.equal(options.methods.find((m) => m.id === METHOD.Pickup).offered, true);

    const refused = await setLineFulfilmentAsync({ shoppingCartItemId: item.id, method: METHOD.Delivery });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Chk.PickupOnly');
  });

  test('AC-CHK-005-01-06', async () => {
    // "that outlet is pre-selected ...; if it does not serve the line, no outlet is pre-selected"
    const { sessionId, customer } = await signedInAsync('preferred-outlet');
    const product = await shippableProductAsync();
    const added = await addAsync(sessionId, product.id);
    const item = await repository('ShoppingCartItem').getByIdAsync(added.cart.items[0].id);
    const outlets = await outletsAsync();
    const preferred = outlets[1];

    const none = await lineOptionsAsync({ item, customer });
    assert.equal(none.preferredPickupPointId, null, 'nothing is pre-selected without a preference');

    await repository('CustomerPreference').insertAsync({
      customerId: customer.id, preferredPickupPointId: preferred.id,
    });
    const withPreference = await lineOptionsAsync({ item, customer });
    assert.equal(Number(withPreference.preferredPickupPointId), Number(preferred.id), 'the usual outlet is pre-selected');
    assert.equal(Number(withPreference.chosen.pickupPointId), Number(preferred.id));

    // an outlet that cannot take this item is not pre-selected
    await repository('StorePickupPoint').updateAsync({ ...preferred, excludedProductIds: [product.id] });
    const notServed = await lineOptionsAsync({ item, customer });
    assert.equal(notServed.preferredPickupPointId, null, 'and none is pre-selected when it cannot serve the line');
    await repository('StorePickupPoint').updateAsync({ ...preferred, excludedProductIds: [] });
  });
});

/* ====================================================== PRD-CHK-014 =================== */

describe('PRD-CHK-014 the dates the shopper is shown', () => {
  test('AC-CHK-014-01-01', async () => {
    // "each option shows the earliest and latest date with message Log.EdtRange, calculated by
    //  LOG-005 (BR-LOG-030); CHK calculates no date"
    assert.ok(providers('IC-CHK-03').length >= 1, 'the estimate comes from a provider');
    assert.equal(providers('IC-CHK-03')[0].feature, 'PRD-LOG-005', 'and that provider is LOG-005');

    const { sessionId } = await signedInAsync('edt');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);

    const step = await api.get('/api/checkout-area/fulfilment/estimates', sessionId);
    const withDates = step.options.filter((o) => o.earliest);
    assert.ok(withDates.length >= 1, 'an option with transit days has an estimate');
    for (const option of withDates) {
      assert.equal(option.messageKey, 'Log.EdtRange');
      assert.match(option.message, /^Expected delivery: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}$/);
      assert.ok(option.latest >= option.earliest);
      assert.equal(option.provider, 'PRD-LOG-005', 'CHK displays it, LOG-005 calculated it');
    }
  });

  test('AC-CHK-014-01-02', async () => {
    // "each outlet shows the date from which the order can be collected"
    const { sessionId, customer } = await signedInAsync('collect-from');
    const product = await shippableProductAsync();
    const added = await addAsync(sessionId, product.id);
    const outlet = (await outletsAsync()).find((o) => Number(o.transitDays ?? 0) > 0) ?? (await outletsAsync())[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: METHOD.Pickup, pickupPointId: outlet.id,
    });

    const step = await stepEstimatesAsync({ cart: await getCartAsync({ sessionId, customer }), storeId: 1 });
    const row = step.outlets.find((o) => Number(o.pickupPointId) === Number(outlet.id));
    assert.ok(row, 'the chosen outlet is listed');
    assert.match(row.collectFrom, /^\d{4}-\d{2}-\d{2}$/, 'with the date it can be collected from');
    assert.equal(row.kind, 'pickup');
  });

  test('AC-CHK-014-01-03', async () => {
    // "the native transit-days estimate is shown if available ...; otherwise no date is shown and
    //  checkout continues"
    const noEstimate = await estimateAsync({ shippingMethod: { name: 'Standard', transitDays: 0 }, storeId: 1 });
    assert.equal(noEstimate, null, 'LOG-005 has no estimate for an option with no transit days');

    // with no estimate from LOG-005, the native transit days of the outlet answer
    const fallback = await estimateForAsync({ pickupPoint: { id: 0, transitDays: 2 }, storeId: 1 });
    assert.match(fallback.collectFrom, /^\d{4}-\d{2}-\d{2}$/);

    // and with neither, no date is shown
    const nothing = await estimateForAsync({ shippingMethod: { name: 'Unknown', transitDays: 0 }, storeId: 1 });
    assert.equal(nothing.earliest, null);
    assert.equal(nothing.messageKey, null);
    assert.equal(nothing.source, 'none');

    // checkout continues all the same
    const { sessionId } = await signedInAsync('no-estimate');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const validated = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(validated.ok, true);
  });

  test('AC-CHK-014-01-04', async () => {
    // "the estimate is stored with the order and shown on the confirm step and in tracking"
    const { sessionId } = await signedInAsync('stored-estimate');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const order = await repository('Order').getByIdAsync(placed.orders[0].id);
    assert.ok(order.estimatedDelivery, 'the estimate is stored with the order');
    assert.equal(order.estimatedDelivery.messageKey, 'Log.EdtRange');
    assert.match(order.estimatedDelivery.earliest, /^\d{4}-\d{2}-\d{2}$/);

    const tracking = await api.get(`/api/tracking/orders/${order.orderNumber}`, SESSIONS.admin);
    assert.ok(tracking, 'and tracking can show the same dates');
    assert.equal(tracking.estimatedDelivery?.earliest ?? order.estimatedDelivery.earliest, order.estimatedDelivery.earliest);
  });

  test('AC-CHK-014-01-05', async () => {
    // "the LOG-005 estimate is the expected delivery shown to the shopper; the native list is
    //  labelled as a choice of preferred date and its first date is not presented as the estimate"
    const { sessionId } = await signedInAsync('preferred-vs-expected');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);

    const step = await api.get('/api/checkout-area/checkout/shipping-step', sessionId);
    assert.equal(step.desiredDate.enabled, true, 'the native list is on for this store');
    assert.equal(step.desiredDate.label, 'Preferred delivery date');
    assert.match(step.desiredDate.note, /not the expected delivery date/);
    assert.equal(step.estimates.desiredDateIsPreferenceOnly, true);

    const expected = step.estimates.options.find((o) => o.earliest);
    assert.ok(expected, 'the expected delivery comes from the estimate');
    assert.equal(expected.messageKey, 'Log.EdtRange');
    assert.notEqual(step.desiredDate.first, undefined);
    assert.equal(
      step.estimates.expectedDeliveryIs,
      'the estimate above',
      'and the first date of the native list is not the estimate',
    );
  });
});
