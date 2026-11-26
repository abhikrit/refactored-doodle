// PRD-TRK-001 buyer shipment tracking (11 ACs), PRD-TRK-010 seller shipment visibility (3) and
// PRD-TRK-011 the guest order-status lookup (3). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { submitEventsAsync } from '../../packages/server/src/plugins/product-trk/services/event-hub.js';
import {
  publicTrackingAsync, refreshTrackingAsync, createShareLinkAsync, revokeShareLinkAsync,
  openShareLinkAsync, myOrderTrackingAsync, myOrdersTrackingAsync, guestLookupAsync,
  sellerShipmentsAsync, sellerShipmentAsync, maskContact,
} from '../../packages/server/src/plugins/product-trk/services/public-tracking.js';
import { resetLookups } from '../../packages/server/src/plugins/product-sec/services/captcha.js';
import { messageGateways } from '../../packages/mocks/src/index.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const G = messageGateways;
let n = 0;

async function parcelAsync({
  number, fulfilment = 'delivery', stage = 'Dispatched', vendorId = null, events = [],
}) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `track${n}@example.com`,
    firstName: 'Track',
    lastName: 'Shopper',
    roles: ['Registered'],
    phone: `+2659940000${String(n).padStart(2, '0')}`,
  });
  const order = await repository('Order').insertAsync({
    orderNumber: number,
    customerId: customer.id,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerName: 'Track Shopper',
    orderStatus: 'Processing',
    stage,
    fulfilment,
    orderTotal: 14000,
  });
  const shipment = await repository('Shipment').insertAsync({
    orderId: order.id,
    shipmentNumber: `SH-${n}`,
    trackingNumber: `TN${String(700000 + n)}`,
    s10Reference: `RS${String(200000000 + n)}MW`,
    expectedDeliveryRange: '18 to 20 March',
  });
  if (vendorId) {
    await repository('OrderItem').insertAsync({
      orderId: order.id, vendorId, productName: 'A parcel of goods', quantity: 1,
    });
  }
  for (const [i, code] of events.entries()) {
    await submitEventsAsync({
      sourceCode: 'scanner-app',
      credentials: 'secret:scanner-app',
      events: [{
        sourceEventId: `${number}-${i}`, reference: shipment.trackingNumber, code, eventTimeUtc: new Date(Date.parse('2026-03-18T06:00:00.000Z') + i * 3600000).toISOString(), location: 'Lilongwe hub',
      }],
      gateways: G,
    });
  }
  return { customer, order, shipment };
}

/* ====================================================== PRD-TRK-001 ==================== */

describe('PRD-TRK-001 the public tracking page', () => {
  test('AC-TRK-001-01-01', async () => {
    // "the timeline lists each event with common event name, local date and time and location
    //  where the source gave one, newest first, plus the expected delivery range"
    const { shipment } = await parcelAsync({ number: 'PUB-1', events: ['SCAN_IN', 'SCAN_OUT', 'LOAD'] });
    const view = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-1');
    assert.equal(view.ok, true);
    assert.equal(view.found, true);
    assert.equal(view.newestFirst, true);
    assert.equal(view.events.length, 3);
    assert.equal(view.events[0].displayName, 'Out for delivery', 'newest first');
    assert.equal(view.events[2].displayName, 'Arrived at hub');
    for (const event of view.events) {
      assert.ok(event.at, 'each event has its time');
      assert.equal(event.location, 'Lilongwe hub', 'and its place where the source gave one');
    }
    assert.equal(view.expectedDeliveryRange, '18 to 20 March');

    // another reference of the same shipment finds it too
    const byS10 = await api.get(`/api/tracking-hub/public/${shipment.s10Reference}`, 'anon-1');
    assert.equal(byS10.found, true, 'the S10 reference finds the same parcel');
  });

  test('AC-TRK-001-01-02', async () => {
    // "message Trk.TrackNotFound is shown and nothing else is revealed"
    const view = await api.get('/api/tracking-hub/public/TN-NOT-A-PARCEL', 'anon-2');
    assert.equal(view.ok, false);
    assert.equal(view.found, false);
    assert.equal(view.messageKey, 'Trk.TrackNotFound');
    assert.equal(view.message, 'We could not find a parcel with this number. Please check it and try again.');
    assert.equal(view.events, undefined, 'nothing else is revealed');
    assert.equal(view.orderNumber, undefined);
  });

  test('AC-TRK-001-01-03', async () => {
    // "it shows no customer name, address, phone or email; delivery-agent contact is shown only
    //  if the source supplied it and the client enabled it (BR-TRK-030)"
    const { shipment, customer, order } = await parcelAsync({ number: 'PUB-3', events: ['SCAN_IN'] });
    await repository('Shipment').updateAsync({ ...shipment, agentContact: '+265991234567' });

    const view = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-3');
    const body = JSON.stringify(view);
    assert.equal(body.includes(customer.email), false, 'no e-mail');
    assert.equal(body.includes(customer.phone), false, 'no phone');
    assert.equal(body.includes('Track Shopper'), false, 'no name');
    assert.equal(body.includes(order.orderNumber), false, 'not even the order number');
    assert.equal(view.personalDataShown, false);
    assert.equal(view.rule, 'BR-TRK-030');
    assert.equal(view.agentContact, null, 'the agent contact is off by default');

    await saveSettingAsync('trk.public.showagentcontact', true, 0);
    const enabled = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-3');
    assert.equal(enabled.agentContact, '+265991234567', 'and shown once the client enables it');
    await saveSettingAsync('trk.public.showagentcontact', false, 0);
  });

  test('AC-TRK-001-01-04', async () => {
    // "a CAPTCHA (SEC-013) is required before the result is shown"
    const { shipment } = await parcelAsync({ number: 'PUB-4', events: ['SCAN_IN'] });
    resetLookups('anon-captcha');
    // the CAPTCHA of PRD-SEC-013 has to be configured for the store, or there is none to require
    await saveSettingAsync('captchasettings.enabled', true, 0);
    await saveSettingAsync('captchasettings.recaptchapublickey', 'public-key', 0);
    await saveSettingAsync('captchasettings.recaptchaprivatekey', 'private-key', 0);
    await saveSettingAsync('sec.trklookupsbeforecaptcha', 3, 0);

    for (let i = 1; i <= 3; i += 1) {
      const view = await publicTrackingAsync({ reference: shipment.trackingNumber, session: 'anon-captcha' });
      assert.equal(view.ok, true, `lookup ${i} inside the limit`);
      assert.equal(view.captchaRequired, false);
    }
    const blocked = await publicTrackingAsync({ reference: shipment.trackingNumber, session: 'anon-captcha' });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.captchaRequired, true, 'the next lookup needs a CAPTCHA');
    assert.equal(blocked.threshold, 3);
    assert.equal(blocked.rule, 'BR-TRK-030');
    assert.equal(blocked.events, undefined, 'and the result is not shown');

    const solved = await publicTrackingAsync({
      reference: shipment.trackingNumber, session: 'anon-captcha', captchaResponse: 'a-valid-token',
    });
    assert.equal(solved.ok, true, 'and is shown once the CAPTCHA is solved');
    assert.ok(solved.events.length >= 1);
    resetLookups('anon-captcha');
    await saveSettingAsync('captchasettings.enabled', false, 0);
  });

  test('AC-TRK-001-01-05', async () => {
    // "message Trk.NoEventsYet is shown with the shipment creation date"
    const { shipment } = await parcelAsync({ number: 'PUB-5' });
    const view = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-5');
    assert.equal(view.ok, true);
    assert.equal(view.found, true);
    assert.deepEqual(view.events, []);
    assert.equal(view.messageKey, 'Trk.NoEventsYet');
    assert.equal(view.message, 'There are no tracking updates for this parcel yet.');
    assert.ok(view.createdOnUtc, 'with the shipment creation date');
  });

  test('AC-TRK-001-02-01', async () => {
    // "a signed link with an expiry is created; opening it shows the public timeline only, never
    //  account details (SM-TRK-06)"
    const { shipment, customer } = await parcelAsync({ number: 'PUB-6', events: ['SCAN_IN', 'LOAD'] });
    await saveSettingAsync('trk.public.sharelinkexpiryhours', 48, 0);

    const notTheOwner = await createShareLinkAsync({ reference: shipment.trackingNumber, customerId: 999999 });
    assert.equal(notTheOwner.ok, false, 'only the owner creates one');

    const created = await createShareLinkAsync({ reference: shipment.trackingNumber, customerId: customer.id });
    assert.equal(created.ok, true);
    assert.match(created.link, /^\/track\/share\/[0-9a-f]{24}$/, 'a signed link');
    assert.equal(created.status, 'Active');
    assert.ok(created.expiresOnUtc, 'with an expiry');
    assert.equal(created.expiryConfigured, true);

    const opened = await api.get(`/api/tracking-hub/share/${created.token}`, 'anon-share');
    assert.equal(opened.ok, true);
    assert.equal(opened.shared, true);
    assert.ok(opened.events.length >= 1, 'the public timeline');
    assert.equal(opened.accountDetails, null, 'never account details');
    assert.equal(JSON.stringify(opened).includes(customer.email), false);
  });

  test('AC-TRK-001-02-02', async () => {
    // "opening it shows message Trk.ShareLinkExpired; creation and revocation are audited
    //  (AUD-TRK-007)"
    const { shipment, customer } = await parcelAsync({ number: 'PUB-7', events: ['SCAN_IN'] });
    const created = await createShareLinkAsync({ reference: shipment.trackingNumber, customerId: customer.id });

    const notTheOwner = await revokeShareLinkAsync({ token: created.token, customerId: 999999 });
    assert.equal(notTheOwner.ok, false);

    const revoked = await revokeShareLinkAsync({ token: created.token, customerId: customer.id });
    assert.equal(revoked.status, 'Revoked');
    const afterRevoke = await openShareLinkAsync({ token: created.token });
    assert.equal(afterRevoke.ok, false);
    assert.equal(afterRevoke.messageKey, 'Trk.ShareLinkExpired');
    assert.equal(afterRevoke.message, 'This tracking link has expired or was withdrawn.');

    // an expired link says the same
    const second = await createShareLinkAsync({ reference: shipment.trackingNumber, customerId: customer.id });
    const row = await repository('ShareLink').getOneAsync((s) => s.token === second.token);
    await repository('ShareLink').updateAsync({ ...row, expiresOnUtc: new Date(Date.now() - 3600000).toISOString() });
    const expired = await openShareLinkAsync({ token: second.token });
    assert.equal(expired.status, 'Expired');
    assert.equal(expired.messageKey, 'Trk.ShareLinkExpired');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-007', entity: 'ShareLink' });
    assert.ok(trail.some((e) => e.after?.status === 'Active'), 'creation is audited');
    assert.ok(trail.some((e) => e.after?.status === 'Revoked'), 'and so is revocation');
  });

  test('AC-TRK-001-03-01', async () => {
    // "the timeline reloads from TRK-002 without a full page reload and the time is shown with
    //  message Trk.LastUpdated"
    const { shipment } = await parcelAsync({ number: 'PUB-8', events: ['SCAN_IN'] });
    const noInterval = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-8');
    assert.equal(noInterval.refreshSeconds, null, 'no interval is set by default');
    assert.match(noInterval.lastUpdated, /^Last updated: /);

    await saveSettingAsync('trk.public.refreshintervalseconds', 60, 0);
    const view = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-8');
    assert.equal(view.refreshSeconds, 60, 'the configured interval is given to the page');
    assert.match(view.lastUpdated, /^Last updated: /);

    // the reload brings the new event in
    await submitEventsAsync({
      sourceCode: 'scanner-app',
      credentials: 'secret:scanner-app',
      events: [{ sourceEventId: 'PUB-8-new', reference: shipment.trackingNumber, code: 'SCAN_OUT', eventTimeUtc: '2026-03-18T12:00:00.000Z' }],
      gateways: G,
    });
    const reloaded = await api.get(`/api/tracking-hub/public/${shipment.trackingNumber}`, 'anon-8');
    assert.equal(reloaded.events.length, 2, 'the timeline reloads from the hub');
    await saveSettingAsync('trk.public.refreshintervalseconds', null, 0);
  });

  test('AC-TRK-001-03-02', async () => {
    // "the timeline reloads at once; if the carrier supports on-demand Track, a pull is requested
    //  no more often than the per-shipment minimum interval"
    const { shipment } = await parcelAsync({ number: 'PUB-9', events: ['SCAN_IN'] });
    const noMinimum = await refreshTrackingAsync({ reference: shipment.trackingNumber });
    assert.equal(noMinimum.ok, true);
    assert.equal(noMinimum.carrierPullRequested, true);
    assert.match(noMinimum.refreshLabel, /Refresh/);
    assert.match(noMinimum.lastUpdated, /^Last updated: /);

    await saveSettingAsync('trk.public.minimumpullintervalminutes', 30, 0);
    const first = await refreshTrackingAsync({ reference: shipment.trackingNumber });
    assert.equal(first.minimumPullIntervalMinutes, 30);
    const tooSoon = await refreshTrackingAsync({ reference: shipment.trackingNumber });
    assert.equal(tooSoon.carrierPullRequested, false, 'no second pull inside the minimum interval');
    assert.ok(tooSoon.events.length >= 1, 'the timeline still reloads at once');
    assert.ok(first.ok);
    await saveSettingAsync('trk.public.minimumpullintervalminutes', null, 0);
  });

  test('AC-TRK-001-04-01', async () => {
    // "each shipment shows its timeline from TRK-002 ...; the order ID path to tracking is
    //  available to the order owner only"
    const { order, customer, shipment } = await parcelAsync({ number: 'PUB-10', events: ['SCAN_IN', 'LOAD'] });
    const mine = await myOrderTrackingAsync({ orderNumber: order.orderNumber, customerId: customer.id });
    assert.equal(mine.ok, true);
    assert.equal(mine.displayShipmentEventsToCustomers, true);
    const row = mine.shipments.find((s) => s.trackingNumber === shipment.trackingNumber);
    assert.ok(row.events.length >= 2, 'the timeline from the hub');
    assert.match(row.shownThrough, /hub tracker/);

    const someoneElse = await myOrderTrackingAsync({ orderNumber: order.orderNumber, customerId: 999999 });
    assert.equal(someoneElse.ok, false);
    assert.equal(someoneElse.denied, true, 'the owner only');

    await saveSettingAsync('shippingsettings.displayshipmenteventstocustomers', false, 0);
    const hidden = await myOrderTrackingAsync({ orderNumber: order.orderNumber, customerId: customer.id });
    assert.deepEqual(hidden.shipments[0].events, [], 'the native setting hides the events');
    await saveSettingAsync('shippingsettings.displayshipmenteventstocustomers', true, 0);
  });

  test('AC-TRK-001-04-02', async () => {
    // "each order shows its latest tracking event and expected delivery range"
    const { customer, order } = await parcelAsync({ number: 'PUB-11', events: ['SCAN_IN', 'SCAN_OUT'] });
    const list = await myOrdersTrackingAsync({ customerId: customer.id });
    assert.equal(list.ok, true);
    const row = list.orders.find((o) => o.orderNumber === order.orderNumber);
    assert.ok(row, 'the order is listed');
    assert.equal(row.latestEvent.name, 'Departed hub', 'with its latest tracking event');
    assert.ok(row.latestEvent.at);
    assert.equal(row.expectedDeliveryRange, '18 to 20 March', 'and the expected delivery range');
  });
});

/* ====================================================== PRD-TRK-011 ==================== */

describe('PRD-TRK-011 the guest order-status lookup', () => {
  test('AC-TRK-011-01-01', async () => {
    // "if both match one order, its status, shipments and TRK-002 timeline are shown without
    //  personal details beyond the masked contact"
    const { order, customer, shipment } = await parcelAsync({ number: 'GUEST-1', events: ['SCAN_IN', 'LOAD'] });
    resetLookups('guest-1');
    const found = await api.post('/api/tracking-hub/guest-lookup', {
      orderNumber: order.orderNumber, contact: customer.email,
    }, 'guest-1');
    assert.equal(found.ok, true);
    assert.equal(found.orderNumber, order.orderNumber);
    assert.ok(found.status, 'its status');
    assert.equal(found.shipments.length, 1, 'its shipments');
    assert.ok(found.shipments[0].events.length >= 2, 'and the timeline');
    assert.equal(found.shipments[0].trackingNumber, shipment.trackingNumber);
    assert.equal(found.maskedContact, maskContact(customer.email), 'the contact is masked');
    assert.equal(JSON.stringify(found).includes(customer.email), false, 'no personal details');
    assert.equal(JSON.stringify(found).includes('Track Shopper'), false);
    assert.equal(found.personalDataShown, false);

    const byPhone = await api.post('/api/tracking-hub/guest-lookup', {
      orderNumber: order.orderNumber, contact: customer.phone,
    }, 'guest-1');
    assert.equal(byPhone.ok, true, 'the phone of the order works too');
  });

  test('AC-TRK-011-01-02', async () => {
    // "message Trk.GuestLookupFailed is shown without saying which field is wrong"
    const { order, customer } = await parcelAsync({ number: 'GUEST-2', events: ['SCAN_IN'] });
    resetLookups('guest-2');
    const wrongContact = await guestLookupAsync({
      orderNumber: order.orderNumber, contact: 'someone.else@example.com', session: 'guest-2',
    });
    assert.equal(wrongContact.ok, false);
    assert.equal(wrongContact.messageKey, 'Trk.GuestLookupFailed');
    assert.equal(wrongContact.message, 'We could not find an order with these details.');
    assert.equal(wrongContact.whichFieldIsWrong, null, 'without saying which field is wrong');

    const wrongOrder = await guestLookupAsync({
      orderNumber: 'MP-NOT-AN-ORDER', contact: customer.email, session: 'guest-2',
    });
    assert.equal(wrongOrder.messageKey, 'Trk.GuestLookupFailed', 'the same message either way');
    assert.deepEqual(Object.keys(wrongOrder).sort(), Object.keys(wrongContact).sort(), 'and the same shape');
  });

  test('AC-TRK-011-01-03', async () => {
    // "a CAPTCHA (SEC-013) is required"
    const { order, customer } = await parcelAsync({ number: 'GUEST-3' });
    resetLookups('guest-3');
    await saveSettingAsync('captchasettings.enabled', true, 0);
    await saveSettingAsync('captchasettings.recaptchapublickey', 'public-key', 0);
    await saveSettingAsync('captchasettings.recaptchaprivatekey', 'private-key', 0);
    await saveSettingAsync('sec.trklookupsbeforecaptcha', 2, 0);

    for (let i = 1; i <= 2; i += 1) {
      const attempt = await guestLookupAsync({
        orderNumber: order.orderNumber, contact: 'wrong@example.com', session: 'guest-3',
      });
      assert.equal(attempt.captchaRequired, false, `attempt ${i} inside the limit`);
    }
    const blocked = await guestLookupAsync({
      orderNumber: order.orderNumber, contact: customer.email, session: 'guest-3',
    });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.captchaRequired, true, 'the next lookup needs a CAPTCHA');
    assert.equal(blocked.rule, 'BR-TRK-030');

    const solved = await guestLookupAsync({
      orderNumber: order.orderNumber, contact: customer.email, session: 'guest-3', captchaResponse: 'a-valid-token',
    });
    assert.equal(solved.ok, true, 'and the lookup runs once it is solved');
    resetLookups('guest-3');
    await saveSettingAsync('captchasettings.enabled', false, 0);
    await saveSettingAsync('sec.trklookupsbeforecaptcha', 10, 0);
  });
});

/* ====================================================== PRD-TRK-010 ==================== */

describe('PRD-TRK-010 seller shipment visibility', () => {
  test('AC-TRK-010-01-01', async () => {
    // "only shipments of their own products are listed with shipped, ready-for-pickup and
    //  delivered dates"
    const vendors = await repository('Vendor').getAllAsync();
    const mine = vendors[0];
    const theirs = vendors[1] ?? await repository('Vendor').insertAsync({ name: 'Another seller' });

    const ours = await parcelAsync({
      number: 'SEL-1', vendorId: mine.id, stage: 'Packed', events: ['SCAN_IN', 'POD'],
    });
    const other = await parcelAsync({ number: 'SEL-2', vendorId: theirs.id, events: ['SCAN_IN'] });

    const denied = await sellerShipmentsAsync({ vendorId: mine.id, requester: { id: 0, roles: ['Guests'] } });
    assert.equal(denied.permission, 'Orders.ShipmentsView');

    const list = await sellerShipmentsAsync({ vendorId: mine.id, requester: null });
    assert.equal(list.ok, true);
    assert.ok(list.shipments.some((s) => s.trackingNumber === ours.shipment.trackingNumber), 'their own parcel is listed');
    assert.equal(list.shipments.some((s) => s.trackingNumber === other.shipment.trackingNumber), false, 'another seller\'s is not');
    const row = list.shipments.find((s) => s.trackingNumber === ours.shipment.trackingNumber);
    assert.ok('shippedOnUtc' in row && 'readyForPickupOnUtc' in row && 'deliveredOnUtc' in row, 'with the three dates');
    assert.ok(row.shippedOnUtc, 'the parcel was shipped');
    assert.ok(row.deliveredOnUtc, 'and delivered');
  });

  test('AC-TRK-010-01-02', async () => {
    // "access is refused (native HasAccessToShipmentAsync)"
    const vendors = await repository('Vendor').getAllAsync();
    const mine = vendors[0];
    const theirs = vendors[1];
    const other = await parcelAsync({ number: 'SEL-3', vendorId: theirs.id, events: ['SCAN_IN'] });

    const refused = await sellerShipmentAsync({ shipmentId: other.shipment.id, vendorId: mine.id, requester: null });
    assert.equal(refused.ok, false);
    assert.equal(refused.denied, true);
    assert.equal(refused.check, 'HasAccessToShipmentAsync');
    assert.equal(refused.events, undefined, 'and nothing of the parcel is shown');
  });

  test('AC-TRK-010-02-01', async () => {
    // "the TRK-002 timeline is shown through the hub tracker, including hand-over events and
    //  delivery"
    const vendors = await repository('Vendor').getAllAsync();
    const mine = vendors[0];
    const ours = await parcelAsync({ number: 'SEL-4', vendorId: mine.id, events: ['SCAN_IN', 'LOAD', 'POD'] });

    await saveSettingAsync('shippingsettings.displayshipmenteventstostoreowner', true, 0);
    const view = await sellerShipmentAsync({ shipmentId: ours.shipment.id, vendorId: mine.id, requester: null });
    assert.equal(view.ok, true);
    assert.equal(view.displayShipmentEventsToStoreOwner, true);
    assert.match(view.shownThrough, /hub tracker/);
    const names = view.events.map((e) => e.displayName);
    assert.ok(names.includes('Arrived at hub'), 'the hand-over events');
    assert.ok(names.includes('Delivered'), 'and the delivery');

    await saveSettingAsync('shippingsettings.displayshipmenteventstostoreowner', false, 0);
    const hidden = await sellerShipmentAsync({ shipmentId: ours.shipment.id, vendorId: mine.id, requester: null });
    assert.deepEqual(hidden.events, [], 'the native setting hides them');
    await saveSettingAsync('shippingsettings.displayshipmenteventstostoreowner', true, 0);
  });
});
