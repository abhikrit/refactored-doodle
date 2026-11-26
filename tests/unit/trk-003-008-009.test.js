// PRD-TRK-009 proactive outreach and outage notices (5 ACs), PRD-TRK-008 the in-app notification
// feed (3) and PRD-TRK-003 the scanning and field operations app (6, held by decision FG-06 and
// built as the external-system mock). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { submitEventsAsync } from '../../packages/server/src/plugins/product-trk/services/event-hub.js';
import {
  runSourceMonitorAsync, activeBannersAsync, runNoticeTaskAsync, feedAsync, feedCountAsync,
  openNotificationAsync, clearNotificationAsync, matchAsync,
} from '../../packages/server/src/plugins/product-trk/services/outreach.js';
import {
  submitScansAsync, registerDeviceAsync, workListAsync,
} from '../../packages/server/src/plugins/product-trk/services/scanning.js';
import {
  sendNotificationAsync, saveDefinitionAsync, setChannelContentAsync,
} from '../../packages/server/src/plugins/product-trk/services/notifications.js';
import { evaluateDownloadAccessAsync } from '../../packages/server/src/plugins/product-sec/services/edge.js';
import { messagesAsync } from '../../packages/server/src/plugins/product-trk/services/delivery-log.js';
import { messageGateways } from '../../packages/mocks/src/index.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const G = messageGateways;
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 3)]);
let n = 0;

async function parcelAsync({
  number, fulfilment = 'delivery', stage = 'Packed', events = [], outletId = null, carrier = null,
}) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `notice${n}@example.com`,
    firstName: 'Notice',
    lastName: 'Shopper',
    roles: ['Registered'],
    phone: `+2659950000${String(n).padStart(2, '0')}`,
  });
  const order = await repository('Order').insertAsync({
    orderNumber: number,
    customerId: customer.id,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    orderStatus: 'Processing',
    stage,
    fulfilment,
    pickupPointId: outletId,
    orderTotal: 7000,
  });
  const shipment = await repository('Shipment').insertAsync({
    orderId: order.id, shipmentNumber: `SH-N${n}`, trackingNumber: `TN${String(800000 + n)}`, carrier,
  });
  for (const [i, code] of events.entries()) {
    await submitEventsAsync({
      sourceCode: 'scanner-app',
      credentials: 'secret:scanner-app',
      events: [{
        sourceEventId: `${number}-${i}`, reference: shipment.trackingNumber, code, eventTimeUtc: new Date(Date.parse('2026-03-22T06:00:00.000Z') + i * 3600000).toISOString(), location: 'Lilongwe hub',
      }],
      gateways: G,
    });
  }
  return { customer, order, shipment };
}

/* ====================================================== PRD-TRK-009 ==================== */

describe('PRD-TRK-009 outreach and outage notices', () => {
  test('AC-TRK-009-01-01', async () => {
    // "the number of matching customers and a sample are shown before sending"
    const held = await parcelAsync({ number: 'NOTICE-1', events: ['SCAN_IN'] });
    await parcelAsync({ number: 'NOTICE-2', events: ['SCAN_IN'] });
    await parcelAsync({ number: 'NOTICE-3', events: ['LOAD'] });

    const denied = await api.post('/api/tracking-hub/notices', { name: 'x', text: 'y' }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Outreach.CreateEditDelete');

    const created = await api.post('/api/tracking-hub/notices', {
      name: 'Customs delay',
      text: 'Parcels at the Lilongwe hub are delayed by customs. We are sorry for the wait.',
      criteria: { lastEventCode: 'ARRIVED_HUB' },
    }, SESSIONS.support);
    assert.equal(created.ok, true);
    assert.equal(created.status, 'Draft');

    const preview = await api.get(`/api/tracking-hub/notices/${created.notice.id}/preview`, SESSIONS.support);
    assert.equal(preview.ok, true);
    assert.equal(preview.matchingCustomers, 2, 'the number of matching customers');
    assert.ok(preview.sample.length >= 1, 'and a sample');
    assert.ok(preview.sample.every((s) => s.lastEventCode === 'ARRIVED_HUB'));
    assert.equal(preview.nothingSentYet, true, 'before sending');
    assert.ok(preview.sample.some((s) => s.trackingNumber === held.shipment.trackingNumber));

    // the criteria the chapter names are all understood
    const byCriteria = await matchAsync({ criteria: { orderStatus: 'Dispatched' } });
    assert.ok(byCriteria.customers >= 1, 'order status');
    assert.equal((await matchAsync({ criteria: { carrier: 'nobody' } })).customers, 0, 'carrier');
    assert.equal((await matchAsync({ criteria: { lastEventCode: 'DELIVERED' } })).customers, 0, 'last event');
  });

  test('AC-TRK-009-01-02', async () => {
    // "each matching customer receives it through the TRK-005 engine in their language,
    //  preferences applied for the category Service notices; the send is audited (SM-TRK-04)"
    const first = await parcelAsync({ number: 'NOTICE-SEND-1', events: ['SCAN_IN'] });
    const second = await parcelAsync({ number: 'NOTICE-SEND-2', events: ['SCAN_IN'] });
    // the second shopper does not want SMS for service notices
    await api.post('/api/notification-preferences/matrix', {
      customerId: second.customer.id, channel: 'sms', category: 'Service notices', optedOut: true,
    }, SESSIONS.admin);

    const created = await api.post('/api/tracking-hub/notices', {
      name: 'Hub delay',
      text: 'Your parcel is held at the hub and will move tonight.',
      criteria: { lastEventCode: 'ARRIVED_HUB', from: '2026-03-22T00:00:00.000Z' },
    }, SESSIONS.support);

    const denied = await api.post(`/api/tracking-hub/notices/${created.notice.id}/send`, {}, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Tracking.Core.Outreach.Send');

    const sent = await api.post(`/api/tracking-hub/notices/${created.notice.id}/send`, {}, SESSIONS.support);
    assert.equal(sent.ok, true);
    assert.equal(sent.status, 'Completed', 'SM-TRK-04 ends at Completed');
    assert.equal(sent.category, 'Service notices');
    assert.equal(sent.preferencesApplied, true);
    assert.ok(sent.counts.recipients >= 2, 'each matching customer');
    assert.ok(sent.counts.sent >= 2);

    const rows = await messagesAsync({ reference: sent.reference });
    assert.ok(rows.some((m) => m.recipient === first.customer.phone && m.status === 'Sent'), 'the first gets an SMS');
    const secondSms = rows.find((m) => m.recipient === second.customer.phone);
    assert.equal(secondSms.status, 'Suppressed', 'the second does not, by their preference');
    assert.ok(rows.some((m) => m.recipient === second.customer.email), 'but still gets the e-mail');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-006', entity: 'OutreachNotice' });
    assert.ok(trail.some((e) => e.after?.status === 'Completed'), 'the send is audited');
  });

  test('AC-TRK-009-01-03', async () => {
    // "it is Cancelled and nothing is sent"
    await parcelAsync({ number: 'NOTICE-CANCEL-1', events: ['SCAN_IN'] });
    const created = await api.post('/api/tracking-hub/notices', {
      name: 'Planned works',
      text: 'Collections will be slower on Saturday.',
      criteria: { lastEventCode: 'ARRIVED_HUB' },
    }, SESSIONS.support);
    const scheduled = await api.post(`/api/tracking-hub/notices/${created.notice.id}/send`, {
      sendAtUtc: new Date(Date.now() + 3600000).toISOString(),
    }, SESSIONS.support);
    assert.equal(scheduled.status, 'Scheduled');

    const before = (await messagesAsync({ definitionKey: 'Trk.Core.ServiceNotice' })).length;
    const cancelled = await api.post(`/api/tracking-hub/notices/${created.notice.id}/cancel`, {}, SESSIONS.support);
    assert.equal(cancelled.status, 'Cancelled');
    assert.equal(cancelled.nothingSent, true);

    const task = await runNoticeTaskAsync({ now: new Date(Date.now() + 7200000).toISOString(), gateways: G });
    assert.equal(task.sent, 0, 'the scheduler passes it by');
    assert.equal((await messagesAsync({ definitionKey: 'Trk.Core.ServiceNotice' })).length, before, 'nothing is sent');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-006', entity: 'OutreachNotice' });
    assert.ok(trail.some((e) => e.after?.status === 'Cancelled'), 'the cancellation is audited');
  });

  test('AC-TRK-009-02-01', async () => {
    // "the banner is shown at the top of the page (widget zone header_before) and disappears
    //  after the end time (SM-TRK-05)"
    const denied = await api.post('/api/tracking-hub/banners', { text: 'x' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Tracking.Core.Outreach.Send');

    const future = await api.post('/api/tracking-hub/banners', {
      text: 'Collections close early on Friday.',
      stores: [1],
      fromUtc: new Date(Date.now() + 3600000).toISOString(),
      toUtc: new Date(Date.now() + 7200000).toISOString(),
    }, SESSIONS.support);
    assert.equal(future.status, 'Scheduled', 'before its start time');
    assert.equal((await activeBannersAsync({ storeId: 1 })).banners.some((b) => b.id === future.banner.id), false);

    const live = await api.post('/api/tracking-hub/banners', {
      text: 'Deliveries in Blantyre are running late today.',
      stores: [1],
      toUtc: new Date(Date.now() + 3600000).toISOString(),
    }, SESSIONS.support);
    assert.equal(live.status, 'Active');
    const shown = await api.get('/api/tracking-hub/banners/active?storeId=1', 'anon-banner');
    const banner = shown.banners.find((b) => b.id === live.banner.id);
    assert.ok(banner, 'the banner is shown');
    assert.equal(banner.text, 'Deliveries in Blantyre are running late today.');
    assert.equal(shown.widgetZone, 'header_before');

    assert.equal((await activeBannersAsync({ storeId: 2 })).banners.some((b) => b.id === live.banner.id), false, 'and only in its stores');

    const after = await activeBannersAsync({ storeId: 1, now: new Date(Date.now() + 7200000).toISOString() });
    assert.equal(after.banners.some((b) => b.id === live.banner.id), false, 'it disappears after the end time');
    assert.equal((await repository('ServiceBanner').getByIdAsync(live.banner.id)).status, 'Ended');
  });

  test('AC-TRK-009-02-02', async () => {
    // "an automatic banner with message Trk.UpdatesDelayed is activated on the tracking pages for
    //  shipments of that source, and removed when events resume"
    const source = await repository('TrackingSource').getOneAsync((s) => s.code === 'postglobal');
    const quiet = await runSourceMonitorAsync({});
    assert.ok(quiet.withoutStallLimit >= 1, 'no stall limit is set by default');

    await repository('TrackingSource').updateAsync({
      ...source, stallLimitMinutes: 120, lastEventOnUtc: new Date(Date.now() - 5 * 3600000).toISOString(),
    });
    const raised = await runSourceMonitorAsync({});
    assert.equal(raised.raised, 1, 'the source is quiet past its limit');
    const banners = await activeBannersAsync({ storeId: 1, sourceCode: 'postglobal' });
    const automatic = banners.banners.find((b) => b.automatic === true);
    assert.ok(automatic, 'an automatic banner is activated');
    assert.equal(automatic.messageKey, 'Trk.UpdatesDelayed');
    assert.equal(automatic.text, 'Tracking updates are delayed at the moment. Your parcel is still on its way.');
    assert.equal(Number(automatic.sourceId), Number(source.id), 'for that source');

    const unchanged = await runSourceMonitorAsync({});
    assert.equal(unchanged.raised, 0, 'and only once');

    // events resume
    await repository('TrackingSource').updateAsync({
      ...await repository('TrackingSource').getByIdAsync(source.id), lastEventOnUtc: new Date().toISOString(),
    });
    const resumed = await runSourceMonitorAsync({});
    assert.equal(resumed.removed, 1, 'and it is removed when events resume');
    assert.equal((await activeBannersAsync({ storeId: 1, sourceCode: 'postglobal' })).banners.some((b) => b.automatic), false);
  });
});

/* ====================================================== PRD-TRK-008 ==================== */

describe('PRD-TRK-008 the in-app notification feed', () => {
  async function inAppShopperAsync(number) {
    const parcel = await parcelAsync({ number });
    await saveSettingAsync('trk.channel.inapp.enabled', true, 0);
    await saveDefinitionAsync({
      key: 'ShipmentSent.CustomerNotification',
      channels: ['inapp', 'email'],
      fallback: false,
      category: 'Delivery',
      actor: await api.actorAsync(SESSIONS.admin),
    });
    await setChannelContentAsync({
      key: 'ShipmentSent.CustomerNotification', channel: 'inapp', languageId: 1, text: 'Order %Order.OrderNumber% is on its way.', system: true,
    });
    return parcel;
  }

  test('AC-TRK-008-01-01', async () => {
    // "the bell in the header (widget zone header_links_after) shows the unread count"
    const parcel = await inAppShopperAsync('FEED-1');
    const empty = await api.get(`/api/tracking-hub/feed/count?customerId=${parcel.customer.id}`, SESSIONS.buyer);
    assert.equal(empty.unread, 0);
    assert.equal(empty.widgetZone, 'header_links_after');

    await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification',
      tokens: { 'Order.OrderNumber': parcel.order.orderNumber },
      order: parcel.order,
      shipment: parcel.shipment,
      occurrence: 'feed-1',
      gateways: G,
    });
    const after = await feedCountAsync({ customerId: parcel.customer.id });
    assert.equal(after.unread, 1, 'the bell shows the unread count');
  });

  test('AC-TRK-008-01-02', async () => {
    // "notifications are listed newest first with text, time and link to the order or shipment;
    //  opening one marks it Read (SM-TRK-08)"
    const parcel = await inAppShopperAsync('FEED-2');
    for (const occurrence of ['feed-2a', 'feed-2b']) {
      await sendNotificationAsync({
        key: 'ShipmentSent.CustomerNotification',
        tokens: { 'Order.OrderNumber': parcel.order.orderNumber },
        order: parcel.order,
        shipment: parcel.shipment,
        occurrence,
        gateways: G,
      });
    }
    const feed = await api.get(`/api/tracking-hub/feed?customerId=${parcel.customer.id}`, SESSIONS.buyer);
    assert.equal(feed.notifications.length, 2);
    assert.equal(feed.newestFirst, true);
    const first = feed.notifications[0];
    assert.match(first.text, new RegExp(parcel.order.orderNumber), 'with the text');
    assert.ok(first.at, 'the time');
    assert.equal(first.link, `/account/orders/${parcel.order.orderNumber}`, 'and the link to the order');
    assert.equal(first.status, 'Unread');

    const opened = await openNotificationAsync({ notificationId: first.id, customerId: parcel.customer.id });
    assert.equal(opened.ok, true);
    assert.equal(opened.notification.status, 'Read', 'opening one marks it Read');
    assert.equal(opened.unread, 1, 'and the count drops');

    const other = await openNotificationAsync({ notificationId: first.id, customerId: 999999 });
    assert.equal(other.ok, false, 'another customer cannot open it');
  });

  test('AC-TRK-008-01-03', async () => {
    // "it is Cleared and no longer listed; it stays until cleared otherwise"
    const parcel = await inAppShopperAsync('FEED-3');
    await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification',
      tokens: { 'Order.OrderNumber': parcel.order.orderNumber },
      order: parcel.order,
      shipment: parcel.shipment,
      occurrence: 'feed-3',
      gateways: G,
    });
    const feed = await feedAsync({ customerId: parcel.customer.id });
    assert.equal(feed.notifications.length, 1);
    const row = feed.notifications[0];

    // reading it does not remove it
    await openNotificationAsync({ notificationId: row.id, customerId: parcel.customer.id });
    assert.equal((await feedAsync({ customerId: parcel.customer.id })).notifications.length, 1, 'a read notification stays until cleared');

    const cleared = await clearNotificationAsync({ notificationId: row.id, customerId: parcel.customer.id });
    assert.equal(cleared.status, 'Cleared');
    assert.equal(cleared.listed, false);
    assert.equal((await feedAsync({ customerId: parcel.customer.id })).notifications.length, 0, 'and is no longer listed');
    assert.equal((await repository('InAppNotification').getByIdAsync(row.id)).status, 'Cleared', 'the row is kept, marked Cleared');
  });
});

/* ====================================================== PRD-TRK-003 ==================== */

describe('PRD-TRK-003 the scanning and field operations app', () => {
  async function deviceAsync(deviceId = 'SCAN-01') {
    const staff = await repository('Customer').getOneAsync((c) => c.email === 'logistics@example.com');
    const registered = await registerDeviceAsync({
      deviceId, staffCustomerId: staff.id, actor: await api.actorAsync(SESSIONS.logistics),
    });
    return { registered, staff };
  }

  test('AC-TRK-003-01-01', async () => {
    // "each scan becomes a TRK-002 event of the matching common code and appears in the timeline"
    const { registered } = await deviceAsync('SCAN-A');
    assert.equal(registered.ok, true);
    assert.match(registered.prototypeDefaultLabel, /decision FG-06 pending/, 'the feature is held');

    const parcel = await parcelAsync({ number: 'SCAN-1' });
    const batch = await submitScansAsync({
      deviceId: 'SCAN-A',
      token: registered.token,
      scans: [
        { type: 'pickup', reference: parcel.shipment.trackingNumber, capturedAtUtc: '2026-03-23T07:00:00.000Z', location: 'Seller door' },
        { type: 'hub-arrival', reference: parcel.shipment.trackingNumber, capturedAtUtc: '2026-03-23T09:00:00.000Z', location: 'Lilongwe hub' },
        { type: 'delivery', reference: parcel.shipment.trackingNumber, capturedAtUtc: '2026-03-23T15:00:00.000Z', location: 'Door' },
      ],
      gateways: G,
    });
    assert.equal(batch.ok, true);
    assert.equal(batch.accepted, 3);
    assert.deepEqual(batch.results.map((r) => r.eventCode), ['PICKED_UP', 'ARRIVED_HUB', 'DELIVERED']);
    assert.ok(batch.results.every((r) => r.status === 'Applied'));

    const timeline = await api.get(`/api/tracking-hub/timeline/${parcel.shipment.trackingNumber}`, SESSIONS.logistics);
    const names = timeline.events.map((e) => e.displayName);
    assert.deepEqual(names, ['Picked up', 'Arrived at hub', 'Delivered'], 'and they appear in the timeline');
  });

  test('AC-TRK-003-02-01', async () => {
    // "every event stores the staff identifier and device identifier; a scan from an unregistered
    //  or revoked device is rejected and audited (AUD-TRK-003)"
    const denied = await api.post('/api/tracking-hub/devices', { deviceId: 'SCAN-X', staffCustomerId: 1 }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Devices.CreateEditDelete');

    const { registered, staff } = await deviceAsync('SCAN-B');
    const parcel = await parcelAsync({ number: 'SCAN-2' });
    const batch = await submitScansAsync({
      deviceId: 'SCAN-B',
      token: registered.token,
      scans: [{ type: 'hub-arrival', reference: parcel.shipment.trackingNumber, capturedAtUtc: '2026-03-23T10:00:00.000Z' }],
      gateways: G,
    });
    const event = await repository('TrackingEvent').getByIdAsync(batch.results[0].event.id);
    assert.equal(event.deviceId, 'SCAN-B', 'the device identifier');
    assert.equal(Number(event.staffId), Number(staff.id), 'and the staff identifier');

    const unregistered = await submitScansAsync({
      deviceId: 'SCAN-NOT-REGISTERED',
      scans: [{ type: 'pickup', reference: parcel.shipment.trackingNumber }],
      gateways: G,
    });
    assert.equal(unregistered.ok, false);
    assert.match(unregistered.reason, /not registered/);
    assert.equal(unregistered.accepted, 0);

    await api.post('/api/tracking-hub/devices/SCAN-B/revoke', {}, SESSIONS.logistics);
    const revoked = await submitScansAsync({
      deviceId: 'SCAN-B',
      token: registered.token,
      scans: [{ type: 'pickup', reference: parcel.shipment.trackingNumber }],
      gateways: G,
    });
    assert.equal(revoked.ok, false);
    assert.match(revoked.reason, /Revoked/);

    const trail = await auditTrailAsync({ event: 'AUD-TRK-003' });
    assert.ok(trail.some((e) => e.after?.reason?.includes('not registered')), 'the rejection is audited');
    assert.ok(trail.some((e) => e.after?.reason?.includes('Revoked')));
    const devices = await api.get('/api/tracking-hub/devices', SESSIONS.logistics);
    assert.equal(devices.find((d) => d.deviceId === 'SCAN-B').status, 'Revoked');
  });

  test('AC-TRK-003-03-01', async () => {
    // "events keep their capture time from the device, the receipt time is recorded, and events
    //  older than the configured sync window are accepted but flagged late"
    const { registered } = await deviceAsync('SCAN-C');
    const parcel = await parcelAsync({ number: 'SCAN-3' });
    const noWindow = await submitScansAsync({
      deviceId: 'SCAN-C',
      token: registered.token,
      scans: [{ type: 'hub-arrival', reference: parcel.shipment.trackingNumber, capturedAtUtc: new Date(Date.now() - 96 * 3600000).toISOString() }],
      gateways: G,
    });
    assert.equal(noWindow.syncWindowHours, null, 'no window is set by default');
    assert.equal(noWindow.results[0].late, false);

    await saveSettingAsync('trk.scan.syncwindowhours', 48, 0);
    const captured = new Date(Date.now() - 72 * 3600000).toISOString();
    const late = await submitScansAsync({
      deviceId: 'SCAN-C',
      token: registered.token,
      scans: [
        { type: 'hub-departure', reference: parcel.shipment.trackingNumber, capturedAtUtc: captured },
        { type: 'delivery', reference: parcel.shipment.trackingNumber, capturedAtUtc: new Date(Date.now() - 3600000).toISOString() },
      ],
      gateways: G,
    });
    assert.equal(late.syncWindowHours, 48);
    assert.equal(late.results[0].late, true, 'the old scan is flagged late');
    assert.equal(late.results[1].late, false, 'the recent one is not');
    assert.equal(late.results[0].status, 'Applied', 'both are accepted');

    const event = await repository('TrackingEvent').getByIdAsync(late.results[0].event.id);
    assert.equal(event.capturedOnUtc, captured, 'the capture time from the device is kept');
    assert.ok(event.receivedOnUtc, 'and the receipt time is recorded');
    assert.notEqual(event.capturedOnUtc, event.receivedOnUtc);
    await saveSettingAsync('trk.scan.syncwindowhours', null, 0);
  });

  test('AC-TRK-003-03-02', async () => {
    // "the coordinates are kept with the event; location is captured with the consent recorded by
    //  the app"
    const { registered } = await deviceAsync('SCAN-D');
    const parcel = await parcelAsync({ number: 'SCAN-4' });
    const batch = await submitScansAsync({
      deviceId: 'SCAN-D',
      token: registered.token,
      scans: [{
        type: 'delivery',
        reference: parcel.shipment.trackingNumber,
        capturedAtUtc: '2026-03-23T16:00:00.000Z',
        latitude: -13.9626,
        longitude: 33.7741,
        consentRecorded: 'the courier agreed to share location on 2026-03-23',
      }],
      gateways: G,
    });
    const event = await repository('TrackingEvent').getByIdAsync(batch.results[0].event.id);
    assert.equal(event.latitude, -13.9626, 'the coordinates are kept');
    assert.equal(event.longitude, 33.7741);
    assert.match(event.locationConsent, /agreed to share location/, 'with the consent the app recorded');

    const withoutCoordinates = await submitScansAsync({
      deviceId: 'SCAN-D',
      token: registered.token,
      scans: [{ type: 'hub-arrival', reference: parcel.shipment.trackingNumber, capturedAtUtc: '2026-03-23T17:00:00.000Z' }],
      gateways: G,
    });
    const plain = await repository('TrackingEvent').getByIdAsync(withoutCoordinates.results[0].event.id);
    assert.equal(plain.latitude, null);
    assert.equal(plain.locationConsent, null, 'no consent is recorded where no location is sent');
  });

  test('AC-TRK-003-03-03', async () => {
    // "each file is checked through IC-ADM-08 CheckUpload for the TRK upload context before it is
    //  stored as a Download linked to the event; a refused file is not stored and the event keeps
    //  the ADM message key as refusal reason; ... allowed only to holders of
    //  Tracking.Core.Events.View"
    const { registered } = await deviceAsync('SCAN-E');
    const parcel = await parcelAsync({ number: 'SCAN-5' });
    const batch = await submitScansAsync({
      deviceId: 'SCAN-E',
      token: registered.token,
      scans: [{
        type: 'delivery',
        reference: parcel.shipment.trackingNumber,
        capturedAtUtc: '2026-03-23T18:00:00.000Z',
        media: [
          { fileName: 'doorstep.jpg', contentType: 'image/jpeg', base64: JPEG.toString('base64') },
          { fileName: 'notes.exe', contentType: 'application/octet-stream', base64: Buffer.from('MZ not allowed').toString('base64') },
        ],
      }],
      gateways: G,
    });
    const media = batch.results[0].media;
    assert.equal(media.checkedThrough, 'PRD-ADM-008');
    assert.equal(media.stored.length, 1, 'the photo is stored');
    assert.equal(media.refused.length, 1, 'the other file is refused');
    assert.ok(media.refused[0].messageKey, 'with the message key ADM gave');

    const event = await repository('TrackingEvent').getByIdAsync(batch.results[0].event.id);
    assert.deepEqual(event.attachmentDownloadIds, media.stored, 'the stored file is linked to the event');
    assert.equal(event.mediaRefusals[0].fileName, 'notes.exe', 'and the refusal is kept as the reason');

    const guid = media.stored[0];
    const staff = await repository('Customer').getOneAsync((c) => c.email === 'logistics@example.com');
    const allowed = await evaluateDownloadAccessAsync({ downloadGuid: guid, requester: staff, area: 'admin' });
    assert.equal(allowed.served, true, 'a holder of Tracking.Core.Events.View may open it');
    assert.ok((allowed.decidedBy ?? []).includes('PRD-TRK-003'), 'and TRK is what decided');

    const shopper = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const refusedAccess = await evaluateDownloadAccessAsync({ downloadGuid: guid, requester: shopper, area: 'admin' });
    assert.equal(refusedAccess.served, false, 'nobody else may');
    assert.match(refusedAccess.reason ?? '', /Tracking\.Core\.Events\.View/);
    assert.equal(refusedAccess.decidedBy, 'PRD-TRK-003');
  });

  test('AC-TRK-003-01-02', async () => {
    // "it receives that member's route list (LOG-024) or pickup list (LOG-011)"
    const { registered } = await deviceAsync('SCAN-F');
    await parcelAsync({ number: 'SCAN-6', fulfilment: 'delivery' });

    const refused = await workListAsync({ deviceId: 'SCAN-NOT-A-DEVICE' });
    assert.equal(refused.ok, false, 'an unknown device gets no work list');

    const list = await api.get(`/api/tracking-hub/work-list?deviceId=SCAN-F&token=${registered.token}`, SESSIONS.logistics);
    assert.equal(list.ok, true);
    assert.equal(list.authenticated, true);
    assert.ok(['route list', 'pickup list'].includes(list.kind));
    assert.deepEqual(list.owningFeatures, ['PRD-LOG-011', 'PRD-LOG-024']);
    assert.ok(list.items.length >= 1, 'the staff member has parcels to work on');
    assert.ok(list.items.every((i) => i.trackingNumber && i.orderNumber));
    assert.match(list.prototypeDefaultLabel, /decision FG-06 pending/);
  });
});
