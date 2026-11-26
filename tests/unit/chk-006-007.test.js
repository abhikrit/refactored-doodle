// PRD-CHK-006 delivery slot and instructions (10 ACs) and PRD-CHK-007 structured address
// capture (6 ACs). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync, getStoreSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { lockHistory } from '../../packages/server/src/core/locker.js';
import { applyClientAsync } from '../../packages/server/src/plugins/product-plt/services/platform.js';
import {
  defineWindowAsync, windowsAsync, windowDefinitionsAsync, desiredDateOptionsAsync,
  placementParticipantAsync, cancellationParticipantAsync, instructionsAttributeAsync,
  bookingsAsync, BOOKING_STATE,
} from '../../packages/server/src/plugins/product-chk/services/slots.js';
import {
  addressFormAsync, saveAddressAsync, orderAddressAsync, locatorCheck, ATTRIBUTE,
} from '../../packages/server/src/plugins/product-chk/services/address.js';
import { setLineFulfilmentAsync, METHOD } from '../../packages/server/src/plugins/product-chk/services/fulfilment.js';
import { cancelOrderAsync } from '../../packages/server/src/plugins/product-chk/services/validation.js';
import { addressGeoAsync } from '../../packages/server/src/plugins/product-log/services/estimates.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

let n = 0;
async function signedInAsync(label) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `chk6-${n}@example.com`, firstName: 'Chk', lastName: 'Shopper', roles: ['Registered'], phone: '+265996000001',
  });
  const sessionId = `${label}-${customer.id}`;
  await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, sessionId);
  return { customer, sessionId };
}

async function shippableProductAsync(offset = 0) {
  const quotas = await repository('Quota').getAllAsync((q) => q.scope === 'product');
  const reserved = new Set(quotas.map((q) => String(q.refId)));
  const rows = await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
    && p.isShipEnabled !== false && !reserved.has(String(p.id))
    && !(p.limitedToCustomerRoles?.length > 0));
  return rows[offset];
}

const addAsync = (session, productId, quantity = 1) => api.post('/api/checkout-area/cart/items', { productId, quantity }, session);

/** The next date that falls on a given weekday, as the window definitions are per weekday. */
function nextDateOn(dayOfWeek) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const target = days.indexOf(dayOfWeek);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((target - d.getUTCDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

async function withSettingAsync(key, value, fn, storeId = 0) {
  const before = await getSettingAsync(key, storeId);
  await saveSettingAsync(key, value, storeId);
  try { return await fn(); } finally { await saveSettingAsync(key, before, storeId); }
}

/* ====================================================== PRD-CHK-006 =================== */

describe('PRD-CHK-006 the delivery window and the instructions', () => {
  test('AC-CHK-006-03-01', async () => {
    // "the windows become available for that service and area; the change is audited"
    const date = nextDateOn('Thu');
    const created = await api.post('/api/checkout-area/admin/delivery-windows', {
      shippingMethod: 'Express', area: 'Mzuzu', dayOfWeek: 'Thu', start: '09:00', end: '11:00', capacity: 4,
    }, SESSIONS.admin);
    assert.equal(created.ok, true);
    assert.equal(created.window.area, 'Mzuzu');

    const offered = await windowsAsync({ shippingMethod: 'Express', area: 'Mzuzu', date });
    assert.ok(offered.windows.some((w) => Number(w.id) === Number(created.window.id)), 'the window is offered for that service and area');
    const elsewhere = await windowsAsync({ shippingMethod: 'Express', area: 'Zomba', date });
    assert.equal(elsewhere.windows.some((w) => Number(w.id) === Number(created.window.id)), false, 'and not for another area');

    const trail = await auditTrailAsync({ event: 'AUD-CHK-001', entityId: created.window.id });
    assert.ok(
      trail.some((e) => e.entity === 'DeliverySlotDefinition' && e.before === null && e.after?.area === 'Mzuzu'),
      'the change is audited',
    );

    // what a window needs is checked
    const incomplete = await defineWindowAsync({ shippingMethod: 'Express', area: 'Mzuzu' });
    assert.equal(incomplete.ok, false);
    assert.ok(incomplete.missing.includes('dayOfWeek'));

    // and only an administrator may define one
    const denied = await api.post('/api/checkout-area/admin/delivery-windows', {
      shippingMethod: 'Express', area: 'Mzuzu', dayOfWeek: 'Thu', start: '09:00', end: '11:00', capacity: 4,
    }, SESSIONS.buyer);
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Checkout.Core.Rules.CreateEditDelete');
  });

  test('AC-CHK-006-01-01', async () => {
    // "the windows with remaining capacity are listed and the shopper selects one; the selection
    //  is reserved at placement (SM-CHK-02)"
    const date = nextDateOn('Mon');
    const offered = await windowsAsync({ shippingMethod: 'Standard', area: 'Lilongwe', date });
    assert.ok(offered.windows.length >= 2, 'the windows of that service, area and day are listed');
    assert.ok(offered.windows.every((w) => w.remaining > 0), 'each with capacity left');
    assert.ok(offered.windows.every((w) => w.date === date));

    const window = offered.windows[0];
    const { sessionId } = await signedInAsync('window-reserve');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const step = await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: {
        shippingMethod: 'Standard', area: 'Lilongwe', desiredDeliveryDate: date, deliverySlotId: window.id,
      },
    }, sessionId);
    assert.equal(step.ok, true, JSON.stringify(step.fieldErrors ?? step.lineErrors ?? {}));
    assert.equal(step.deliverySlotId, window.id);

    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const bookings = await bookingsAsync({ definitionId: window.id, date });
    const mine = bookings.find((b) => b.orderNumber === placed.orders[0].orderNumber);
    assert.ok(mine, 'the place is booked against the order');
    assert.equal(mine.status, BOOKING_STATE.Reserved);
    assert.ok(lockHistory().some((l) => l.key === `chk-slot-${window.id}-${date}`), 'reserved under its own lock key');

    const after = await windowsAsync({ shippingMethod: 'Standard', area: 'Lilongwe', date });
    const same = after.windows.find((w) => Number(w.id) === Number(window.id));
    assert.equal(same.remaining, window.remaining - 1, 'and one place fewer is left');
  });

  test('AC-CHK-006-01-02', async () => {
    // "no window selection is shown and checkout continues ('where supported')"
    const date = nextDateOn('Mon');
    const none = await windowsAsync({ shippingMethod: 'A service with no windows', area: 'Lilongwe', date });
    assert.deepEqual(none.windows, []);
    assert.equal(none.offered, false);

    const { sessionId } = await signedInAsync('no-windows');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const step = await api.get('/api/checkout-area/checkout/shipping-step?shippingMethod=A%20service%20with%20no%20windows', sessionId);
    assert.equal(step.windowsOffered, false, 'no window selection is shown');

    const submitted = await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: { shippingMethod: 'A service with no windows', area: 'Lilongwe' },
    }, sessionId);
    assert.equal(submitted.ok, true, 'and checkout continues');
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true);
  });

  test('AC-CHK-006-01-03', async () => {
    // "the order is not placed, message Chk.SlotFull is shown and the shopper chooses another
    //  window (capacity is reserved under lock by the CHK-006 placement participant)"
    const date = nextDateOn('Fri');
    const window = (await defineWindowAsync({
      shippingMethod: 'Standard', area: 'Dedza', dayOfWeek: 'Fri', start: '08:00', end: '10:00', capacity: 1,
    })).window;

    const { sessionId } = await signedInAsync('slot-full');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const chosen = await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: {
        shippingMethod: 'Standard', area: 'Dedza', desiredDeliveryDate: date, deliverySlotId: window.id,
      },
    }, sessionId);
    assert.equal(chosen.ok, true, 'the window had a place when the shopper chose it');

    // another order takes the last place before this shopper confirms
    const taken = await placementParticipantAsync({ phase: 'Reserve', deliverySlotId: window.id, date });
    assert.equal(taken.ok, true);

    const before = (await repository('Order').getAllAsync()).length;
    const refused = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(refused.ok, false, 'the order is not placed');
    assert.equal(refused.messageKey, 'Chk.SlotFull');
    assert.equal(refused.failures[0].step, 'shipping-method', 'and the shopper goes back to choose another window');
    assert.equal(refused.failures[0].message, 'The delivery window you chose is now full. Please choose another window.');
    assert.equal((await repository('Order').getAllAsync()).length, before);
    assert.ok(lockHistory().some((l) => l.key === `chk-slot-${window.id}-${date}`));

    // another window takes the order
    const second = (await defineWindowAsync({
      shippingMethod: 'Standard', area: 'Dedza', dayOfWeek: 'Fri', start: '10:00', end: '12:00', capacity: 2,
    })).window;
    await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: {
        shippingMethod: 'Standard', area: 'Dedza', desiredDeliveryDate: date, deliverySlotId: second.id,
      },
    }, sessionId);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
  });

  test('AC-CHK-006-02-01', async () => {
    // "the text is stored on the order (Order.CheckoutAttributeDescription) and shown on the
    //  order details used by staff, seller and courier"
    const attribute = await instructionsAttributeAsync({ storeId: 1 });
    assert.ok(attribute, 'the store has the Delivery instructions checkout attribute');
    assert.equal(attribute.attributeControlType, 'TextBox');

    const { sessionId } = await signedInAsync('instructions');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const step = await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: { shippingMethod: 'Standard', instructions: 'Blue gate opposite the school, ask for Amina' },
    }, sessionId);
    assert.equal(step.ok, true);
    assert.equal(step.instructions, 'Delivery instructions: Blue gate opposite the school, ask for Amina');

    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const order = await repository('Order').getByIdAsync(placed.orders[0].id);
    assert.equal(order.checkoutAttributeDescription, 'Delivery instructions: Blue gate opposite the school, ask for Amina');
    assert.equal(order.deliveryInstructions, 'Blue gate opposite the school, ask for Amina');

    // the order screens staff, the seller and the courier read show it
    const detail = await api.get(`/api/orders/${order.orderNumber}`, SESSIONS.admin);
    assert.equal(detail.deliveryInstructions, 'Blue gate opposite the school, ask for Amina');
    const forCourier = await api.get(`/api/checkout-area/orders/${order.orderNumber}/address`, SESSIONS.admin);
    assert.equal(forCourier.deliveryInstructions, 'Blue gate opposite the school, ask for Amina');

    // text longer than the attribute allows is refused
    const tooLong = await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: { shippingMethod: 'Standard', instructions: 'x'.repeat(400) },
    }, sessionId);
    assert.equal(tooLong.ok, false);
    assert.match(tooLong.fieldErrors.instructions, /under 200 characters/);
  });

  test('AC-CHK-006-01-04', async () => {
    // "the window place is released by the CHK-006 cancellation participant (IC-CHK-08)"
    const date = nextDateOn('Tue');
    const window = (await windowsAsync({ shippingMethod: 'Standard', area: 'Lilongwe', date })).windows[0];
    const { sessionId } = await signedInAsync('cancel-window');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: {
        shippingMethod: 'Standard', area: 'Lilongwe', desiredDeliveryDate: date, deliverySlotId: window.id,
      },
    }, sessionId);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const orderNumber = placed.orders[0].orderNumber;

    const held = (await bookingsAsync({ definitionId: window.id, date })).find((b) => b.orderNumber === orderNumber);
    assert.equal(held.status, BOOKING_STATE.Reserved);

    const cancelled = await cancelOrderAsync({ orderNumber, reason: 'the shopper changed their mind' });
    assert.equal(cancelled.ok, true);
    const after = (await bookingsAsync({ definitionId: window.id, date })).find((b) => b.id === held.id);
    assert.equal(after.status, BOOKING_STATE.Released, 'the place is given back');
    assert.ok(after.releasedOnUtc);

    // and the participant is the CHK-006 one, on the cancellation contract
    const registered = await api.get('/api/checkout-area/validation/providers', SESSIONS.admin);
    assert.ok(registered.cancellationParticipants.some((p) => p.feature === 'PRD-CHK-006'));
  });

  test('AC-CHK-006-01-05', async () => {
    // "the native desired-date list offers DeliveryDateRangeDays dates starting at today plus the
    //  transit days; the chosen date is stored as Order.DesiredDeliveryDateUtc and shown on the
    //  order details and the admin order page"
    const options = await desiredDateOptionsAsync({ storeId: 1, transitDays: 3 });
    assert.equal(options.enabled, true);
    const rangeDays = Number(await getSettingAsync('shippingsettings.deliverydaterangedays', 1, 7));
    assert.equal(options.dates.length, rangeDays, 'as many dates as DeliveryDateRangeDays');
    const expectedFirst = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    assert.equal(options.first, expectedFirst, 'starting at today plus the transit days');

    const { sessionId } = await signedInAsync('desired-date');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: { shippingMethod: 'Standard', desiredDeliveryDate: options.dates[1] },
    }, sessionId);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const order = await repository('Order').getByIdAsync(placed.orders[0].id);
    assert.equal(order.desiredDeliveryDateUtc, options.dates[1], 'the chosen date is stored on the order');
    const detail = await api.get(`/api/orders/${order.orderNumber}`, SESSIONS.admin);
    assert.equal(detail.desiredDeliveryDateUtc, options.dates[1], 'and the admin order page shows it');

    // with no transit days on the option there is no native list
    const none = await desiredDateOptionsAsync({ storeId: 1, transitDays: 0 });
    assert.equal(none.enabled, false);
    assert.match(none.reason, /no transit days/);
  });

  test('AC-CHK-006-01-06', async () => {
    // "the CHK-006 window list shows only the windows of that date with remaining capacity, and
    //  the booking date is the native desired date; CHK builds no date picker of its own"
    const monday = nextDateOn('Mon');
    const saturday = nextDateOn('Sat');
    const onMonday = await windowsAsync({ shippingMethod: 'Standard', area: 'Lilongwe', date: monday });
    const onSaturday = await windowsAsync({ shippingMethod: 'Standard', area: 'Lilongwe', date: saturday });
    assert.ok(onMonday.windows.length >= 1, 'the Monday windows are listed for a Monday');
    assert.equal(onSaturday.windows.length, 0, 'and nothing is listed for a day with no window');
    assert.ok(onMonday.windows.every((w) => w.dayOfWeek === 'Mon'));

    const { sessionId } = await signedInAsync('window-date');
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const step = await api.get(`/api/checkout-area/checkout/shipping-step?shippingMethod=Standard&area=Lilongwe&date=${monday}`, sessionId);
    assert.equal(step.chosenDate, monday);
    assert.ok(step.windows.every((w) => w.date === monday), 'the window list belongs to the chosen date');
    assert.equal(step.desiredDate.label, 'Preferred delivery date', 'the date comes from the native list');

    const window = step.windows[0];
    await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: {
        shippingMethod: 'Standard', area: 'Lilongwe', desiredDeliveryDate: monday, deliverySlotId: window.id,
      },
    }, sessionId);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const booking = (await bookingsAsync({ definitionId: window.id })).find((b) => b.orderNumber === placed.orders[0].orderNumber);
    assert.equal(booking.date, monday, 'the booking date is the native desired date');
    const order = await repository('Order').getByIdAsync(placed.orders[0].id);
    assert.equal(order.desiredDeliveryDateUtc, monday);
  });

  test('AC-CHK-006-01-07', async () => {
    // "the CHK-003 placement host reads the desired date once and sets it on every sub-order"
    const { sessionId } = await signedInAsync('date-on-all');
    const first = await shippableProductAsync(0);
    const second = await shippableProductAsync(1);
    await addAsync(sessionId, first.id);
    const added = await addAsync(sessionId, second.id);
    const collected = added.cart.items.find((i) => i.productId === second.id);
    const outlet = (await repository('StorePickupPoint').getAllAsync())[0];
    await setLineFulfilmentAsync({ shoppingCartItemId: collected.id, method: METHOD.Pickup, pickupPointId: outlet.id });

    const dates = await desiredDateOptionsAsync({ storeId: 1, transitDays: 3 });
    await api.post('/api/checkout-area/checkout/steps/shipping-method', {
      antiforgeryToken: 'token',
      values: { shippingMethod: 'Standard', desiredDeliveryDate: dates.dates[2] },
    }, sessionId);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.orders.length, 2, 'the checkout split into two sub-orders');
    for (const sub of placed.orders) {
      const order = await repository('Order').getByIdAsync(sub.id);
      assert.equal(order.desiredDeliveryDateUtc, dates.dates[2], `${order.orderNumber} carries the date`);
    }
  });

  test('AC-CHK-006-03-02', async () => {
    // "ShippingSettings.AllowCustomerToChooseDeliveryDate is set off explicitly, because its
    //  install default is on"
    try {
      await applyClientAsync({ clientId: 'KTDA', storeId: 1, actor: 'test' });
      const ktda = await getSettingAsync('shippingsettings.allowcustomertochoosedeliverydate', 1);
      assert.equal(ktda, false, 'the client that offers no date choice sets it off in its pack');
      const row = await repository('Setting').getOneAsync((s) => s.name === 'shippingsettings.allowcustomertochoosedeliverydate'
        && s.value === false);
      assert.ok(row, 'the value is written, not merely absent');
      const options = await desiredDateOptionsAsync({ storeId: 1, transitDays: 3 });
      assert.equal(options.enabled, false, 'so no date list is shown');
      assert.match(options.reason, /AllowCustomerToChooseDeliveryDate is off/);
    } finally {
      await applyClientAsync({ clientId: 'MPC', storeId: 1, actor: 'test' });
    }
    assert.equal(await getSettingAsync('shippingsettings.allowcustomertochoosedeliverydate', 1), true);
  });
});

/* ====================================================== PRD-CHK-007 =================== */

describe('PRD-CHK-007 the address a courier can find', () => {
  test('AC-CHK-007-01-01', async () => {
    // "the values are validated and stored in Address.CustomAttributes and appear on the order
    //  addresses"
    const form = await addressFormAsync({ storeId: 1, country: 'Malawi' });
    const names = form.attributes.map((a) => a.name);
    assert.ok(names.includes(ATTRIBUTE.landmark), 'the store asks for a landmark');
    assert.ok(names.includes(ATTRIBUTE.addressName), 'and a name for the address');

    const { customer } = await signedInAsync('attributes');
    const saved = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', addressLine1: '7 Glyn Jones Road', city: 'Blantyre', country: 'Malawi', phone: '+265996000001',
      },
      attributes: { [ATTRIBUTE.landmark]: 'Opposite the Catholic church', [ATTRIBUTE.addressName]: 'Home' },
    });
    assert.equal(saved.ok, true);
    const row = await repository('Address').getByIdAsync(saved.address.id);
    assert.equal(row.customAttributes[ATTRIBUTE.landmark], 'Opposite the Catholic church', 'stored in CustomAttributes');
    assert.equal(row.customAttributes[ATTRIBUTE.addressName], 'Home');

    // a value longer than the attribute allows is refused
    const tooLong = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', addressLine1: '7 Glyn Jones Road', city: 'Blantyre', country: 'Malawi',
      },
      attributes: { [ATTRIBUTE.landmark]: 'x'.repeat(200) },
    });
    assert.equal(tooLong.ok, false);
    assert.match(tooLong.fieldErrors[ATTRIBUTE.landmark], /under 120 characters/);
  });

  test('AC-CHK-007-01-02', async () => {
    // "latitude and longitude are passed to LOG-015 and stored in its AddressGeo table keyed by
    //  AddressId with source 'pin'; CHK stores no coordinates of its own"
    const { customer } = await signedInAsync('pin');
    const saved = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi',
      },
      attributes: { [ATTRIBUTE.landmark]: 'Behind the market' },
      pin: { latitude: -13.9626, longitude: 33.7741 },
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.geo.storedBy, 'PRD-LOG-015');

    const geo = await addressGeoAsync(saved.address.id);
    assert.ok(geo, 'the row is in the LOG-015 table');
    assert.equal(Number(geo.addressId), Number(saved.address.id), 'keyed by AddressId');
    assert.equal(geo.source, 'pin');
    assert.match(geo.mapUrl, /maps/);

    const row = await repository('Address').getByIdAsync(saved.address.id);
    assert.equal(row.latitude ?? null, null, 'CHK keeps no coordinates of its own');
    assert.equal(row.longitude ?? null, null);
  });

  test('AC-CHK-007-01-03', async () => {
    // "the address is not saved and message Chk.AddressLocatorRequired is shown"
    const { customer } = await signedInAsync('locator');
    const before = (await repository('Address').getAllAsync()).length;
    const refused = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi',
      },
      attributes: {},
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.saved, false);
    assert.equal(refused.messageKey, 'Chk.AddressLocatorRequired');
    assert.equal(refused.message, 'Please give a street address, a landmark or a map pin so we can find you.');
    assert.equal((await repository('Address').getAllAsync()).length, before, 'nothing is saved');

    // any one of the locators the rule names is enough
    for (const [label, extra] of [
      ['street', { values: { addressLine1: '7 Glyn Jones Road' } }],
      ['landmark', { attributes: { [ATTRIBUTE.landmark]: 'By the big tree' } }],
      ['pin', { pin: { latitude: -13.9, longitude: 33.7 } }],
    ]) {
      const saved = await saveAddressAsync({
        customer,
        storeId: 1,
        values: {
          firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi', ...(extra.values ?? {}),
        },
        attributes: extra.attributes ?? {},
        pin: extra.pin ?? null,
      });
      assert.equal(saved.ok, true, `${label} alone is enough`);
      assert.ok(saved.locatorsGiven.includes(label));
    }

    // the rule itself is the client setting
    const rule = await getSettingAsync('chk.address.locatorrule', 1, []);
    assert.deepEqual(rule, ['street', 'landmark', 'pin']);
    const noRule = locatorCheck({ values: {}, locatorRule: [] });
    assert.equal(noRule.ok, true, 'a client with no rule asks for no locator');
  });

  test('AC-CHK-007-02-01', async () => {
    // "the field is shown and saved; when disabled it is not shown"
    const form = await addressFormAsync({ storeId: 1, country: 'Malawi' });
    const poBox = form.attributes.find((a) => a.name === ATTRIBUTE.poBox);
    assert.ok(poBox, 'the PO box field is offered where the client enabled it');
    assert.match(poBox.note, /virtual post box/);

    const { customer } = await signedInAsync('po-box');
    const saved = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi', addressLine1: 'P.O. collection',
      },
      attributes: { [ATTRIBUTE.poBox]: 'Private Bag 390' },
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.customAttributes[ATTRIBUTE.poBox], 'Private Bag 390', 'and saved');

    // switched off, the field is not shown and nothing is stored for it
    const row = await repository('AddressAttribute').getOneAsync((a) => a.name === ATTRIBUTE.poBox);
    await repository('AddressAttribute').updateAsync({ ...row, isActive: false });
    const without = await addressFormAsync({ storeId: 1, country: 'Malawi' });
    assert.equal(without.attributes.some((a) => a.name === ATTRIBUTE.poBox), false, 'it is not shown');
    const ignored = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi', addressLine1: 'Somewhere',
      },
      attributes: { [ATTRIBUTE.poBox]: 'Private Bag 390' },
    });
    assert.equal(ignored.customAttributes[ATTRIBUTE.poBox], undefined, 'and nothing is stored for it');
    await repository('AddressAttribute').updateAsync({ ...row, isActive: true });
  });

  test('AC-CHK-007-01-04', async () => {
    // "the county and region fields follow the settings (Kenya counties, Malawi districts as
    //  configured)"
    const malawi = await addressFormAsync({ storeId: 1, country: 'Malawi' });
    assert.equal(malawi.county.enabled, true, 'the county field is on for this country');
    assert.equal(malawi.county.required, false);
    assert.ok(malawi.statesProvinces.includes('Lilongwe'), 'and the districts of that country are listed');
    assert.equal(malawi.statesProvinces.includes('Nairobi'), false, 'not another country\'s');

    const { customer } = await signedInAsync('county');
    const required = await withSettingAsync('addresssettings.countyrequired', true, async () => {
      const form = await addressFormAsync({ storeId: 1, country: 'Malawi' });
      assert.equal(form.county.required, true);
      return saveAddressAsync({
        customer,
        storeId: 1,
        values: {
          firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi', addressLine1: 'Area 47',
        },
      });
    }, 1);
    assert.equal(required.ok, false, 'a required county must be given');
    assert.equal(required.fieldErrors.county, 'This field is required.');

    const off = await withSettingAsync('addresssettings.countyenabled', false, async () => {
      const form = await addressFormAsync({ storeId: 1, country: 'Malawi' });
      assert.equal(form.county.enabled, false);
      return saveAddressAsync({
        customer,
        storeId: 1,
        values: {
          firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi', addressLine1: 'Area 47', county: 'Lilongwe',
        },
      });
    }, 1);
    assert.equal(off.ok, true);
    assert.equal(off.address.county, null, 'a county is not kept where the setting is off');
  });

  test('AC-CHK-007-03-01', async () => {
    // "the pin is shown with a link to the map and the landmark is shown beside the address"
    const { customer, sessionId } = await signedInAsync('courier-view');
    const saved = await saveAddressAsync({
      customer,
      storeId: 1,
      values: {
        firstName: 'Chikondi', lastName: 'Banda', city: 'Lilongwe', country: 'Malawi', addressLine1: 'Area 47, house 12', phone: '+265996000001',
      },
      attributes: { [ATTRIBUTE.landmark]: 'Opposite the Catholic church', [ATTRIBUTE.addressName]: 'Home' },
      pin: { latitude: -13.9626, longitude: 33.7741 },
    });
    const product = await shippableProductAsync();
    await addAsync(sessionId, product.id);
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba',
      termsAccepted: true,
      paymentData: { phone: '265880000001' },
      shippingAddress: { ...saved.address },
      billingAddress: { ...saved.address },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const view = await api.get(`/api/checkout-area/orders/${placed.orders[0].orderNumber}/address`, SESSIONS.admin);
    assert.equal(view.landmark, 'Opposite the Catholic church', 'the landmark is beside the address');
    assert.equal(view.addressName, 'Home');
    assert.equal(Number(view.pin.latitude), -13.9626, 'and the pin is shown');
    assert.match(view.pin.mapUrl, /^https:\/\/maps\./, 'with a link to the map');

    // the seller and the courier read the same answer through the same service
    const direct = await orderAddressAsync({ orderNumber: placed.orders[0].orderNumber });
    assert.deepEqual(direct.pin, view.pin);
  });
});
