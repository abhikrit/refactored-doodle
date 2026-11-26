// PRD-TRK-002 the tracking event hub (15 ACs) and PRD-TRK-012 shipment and pickup event
// notifications (8). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { lockHistory } from '../../packages/server/src/core/locker.js';
import { publishedEvents, subscribe } from '../../packages/server/src/core/events.js';
import {
  submitEventsAsync, registerExternalReferenceAsync, runAlertTaskAsync, saveExpectationRuleAsync,
  timelineAsync, eventsAsync,
} from '../../packages/server/src/plugins/product-trk/services/event-hub.js';
import {
  shipmentSentAsync, readyForPickupAsync, runPickupReminderTaskAsync,
} from '../../packages/server/src/plugins/product-trk/services/shipment-notifications.js';
import { messagesAsync } from '../../packages/server/src/plugins/product-trk/services/delivery-log.js';
import { messageGateways } from '../../packages/mocks/src/index.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const G = messageGateways;
const CREDENTIALS = (code) => `secret:${code}`;
let sequence = 0;

/** An order with a shipment, ready to receive tracking events. */
async function parcelAsync({
  number, fulfilment = 'delivery', stage = 'Packed', serviceLevel = 'standard', email = null,
}) {
  sequence += 1;
  const customer = await createCustomerAsync({
    email: email ?? `parcel${sequence}@example.com`,
    firstName: 'Parcel',
    lastName: 'Buyer',
    roles: ['Registered'],
    phone: `+2659920000${String(sequence).padStart(2, '0')}`,
  });
  const order = await repository('Order').insertAsync({
    orderNumber: number,
    customerId: customer.id,
    customerEmail: customer.email,
    customerName: 'Parcel Buyer',
    orderStatus: 'Processing',
    stage,
    fulfilment,
    serviceLevel,
    orderTotal: 18000,
  });
  const shipment = await repository('Shipment').insertAsync({
    orderId: order.id,
    shipmentNumber: `SH-${number}`,
    trackingNumber: `TN-${number}`,
    s10Reference: `RR${String(100000000 + sequence)}MW`,
  });
  return { customer, order, shipment };
}

const post = (sourceCode, events) => submitEventsAsync({
  sourceCode, credentials: CREDENTIALS(sourceCode), events, gateways: G,
});

/* ======================================================= PRD-TRK-002 the hub =========== */

describe('PRD-TRK-002 receiving and applying events', () => {
  test('AC-TRK-002-01-01', async () => {
    // "each event is authenticated, stored as Received with source, source code, reference,
    //  event time, location, staff and device identifiers, then processed (SM-TRK-01)"
    const sources = await api.get('/api/tracking-hub/sources', SESSIONS.admin);
    for (const code of ['scanner-app', 'postglobal', 'carrier-api', 'manual']) {
      const row = sources.find((s) => s.code === code);
      assert.ok(row, `${code} is a registered source`);
      assert.equal(row.credentialsHeld, true, 'with credentials');
    }

    const refused = await api.post('/api/tracking-hub/events', {
      sourceCode: 'scanner-app', credentials: 'wrong', events: [{ reference: 'x', code: 'SCAN_IN' }],
    }, SESSIONS.admin);
    assert.equal(refused.authenticated, false);
    assert.match(refused.reason, /credentials/);
    assert.equal(refused.accepted, 0, 'nothing is stored for an unauthenticated batch');
    const auth = await auditTrailAsync({ event: 'AUD-TRK-003' });
    assert.ok(auth.length >= 1, 'the rejection is audited');

    const { shipment } = await parcelAsync({ number: 'HUB-1' });
    const batch = await post('scanner-app', [
      {
        sourceEventId: 'S-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: '2026-03-01T08:00:00.000Z', location: 'Lilongwe hub', staffId: 'staff-7', deviceId: 'dev-3',
      },
      {
        sourceEventId: 'S-2', reference: shipment.trackingNumber, code: 'SCAN_OUT', eventTimeUtc: '2026-03-01T12:00:00.000Z', location: 'Lilongwe hub', staffId: 'staff-7', deviceId: 'dev-3',
      },
    ]);
    assert.equal(batch.authenticated, true);
    assert.equal(batch.accepted, 2, 'a batch of events');
    const stored = (await eventsAsync({})).filter((e) => e.sourceEventId === 'S-1')[0];
    assert.equal(stored.source, 'scanner-app');
    assert.equal(stored.sourceCode, 'SCAN_IN');
    assert.equal(stored.reference, shipment.trackingNumber);
    assert.equal(stored.eventTimeUtc, '2026-03-01T08:00:00.000Z');
    assert.equal(stored.location, 'Lilongwe hub');
    assert.equal(stored.staffId, 'staff-7');
    assert.equal(stored.deviceId, 'dev-3');
    assert.ok(stored.receivedOnUtc, 'and when it was received');
    assert.equal(stored.status, 'Applied', 'then it is processed');
  });

  test('AC-TRK-002-01-02', async () => {
    // "it becomes Applied with its common event code and appears in the shipment timeline"
    const { shipment } = await parcelAsync({ number: 'HUB-2' });
    const result = await post('postglobal', [{
      sourceEventId: 'P-1', reference: shipment.trackingNumber, code: 'EDB', eventTimeUtc: '2026-03-02T09:00:00.000Z', location: 'Blantyre',
    }]);
    assert.equal(result.results[0].status, 'Applied');
    assert.equal(result.results[0].eventCode, 'ARRIVED_HUB', 'mapped to its common code');

    const timeline = await api.get(`/api/tracking-hub/timeline/${shipment.trackingNumber}`, SESSIONS.logistics);
    assert.equal(timeline.shipmentId, shipment.id);
    const entry = timeline.events.find((e) => e.eventCode === 'ARRIVED_HUB');
    assert.ok(entry, 'it appears in the shipment timeline');
    assert.equal(entry.displayName, 'Arrived at hub');
    assert.equal(entry.location, 'Blantyre');
    assert.equal(entry.source, 'postglobal');
  });

  test('AC-TRK-002-01-03', async () => {
    // "the event enters through IC-TRK-01 and is mapped by that source's rows ...; only TRK-002
    //  calls ShipAsync or DeliverAsync for it; the API and INT-007 never change shipment state"
    const { shipment, order } = await parcelAsync({ number: 'HUB-3' });
    const result = await post('carrier-api', [{
      sourceEventId: 'C-1', reference: shipment.trackingNumber, code: 'in-transit', eventTimeUtc: '2026-03-03T07:00:00.000Z',
    }]);
    assert.equal(result.results[0].eventCode, 'IN_TRANSIT', 'mapped by the rows of that source');
    assert.equal(result.results[0].nativeState.called, 'ShipAsync', 'TRK makes the call');
    assert.equal(result.results[0].nativeState.through, 'IOrderProcessingService');
    assert.equal(result.results[0].nativeState.rule, 'BR-TRK-012');

    // the same code from another source is mapped by that source's own rows
    const postglobal = await post('postglobal', [{
      sourceEventId: 'P-3', reference: shipment.trackingNumber, code: 'EDE', eventTimeUtc: '2026-03-03T10:00:00.000Z',
    }]);
    assert.equal(postglobal.results[0].eventCode, 'OUT_FOR_DELIVERY');

    const unmappedForThisSource = await post('carrier-api', [{
      sourceEventId: 'C-2', reference: shipment.trackingNumber, code: 'EDE', eventTimeUtc: '2026-03-03T11:00:00.000Z',
    }]);
    assert.equal(unmappedForThisSource.results[0].status, 'Rejected', 'a code of another source is not mapped here');

    const after = await repository('Order').getByIdAsync(order.id);
    assert.equal(after.stage, 'Dispatched', 'the stage moved once, through the owner');
    assert.ok(lockHistory().some((l) => l.key === `shipment-${shipment.id}`), 'under the named shipment lock');
  });

  test('AC-TRK-002-01-04', async () => {
    // a stand-in for the RET consumer, which only enqueues what it is told
    const seen = [];
    subscribe('Tracking.EventApplied', {
      area: 'RET', feature: 'PRD-RET-003', name: 'return-tracking-enqueue', fn: async (payload) => { seen.push(payload); },
    });
    // "it becomes Applied against that return reference, appears in the return timeline, changes
    //  no native shipment state, sends no TRK-012 message and is published as
    //  Tracking.EventApplied with the ReturnShipment id"
    const registered = await registerExternalReferenceAsync({
      owningModule: 'Product.RET', entityType: 'ReturnShipment', entityId: 4242, reference: 'RET-REF-1',
    });
    assert.equal(registered.ok, true);
    const again = await registerExternalReferenceAsync({
      owningModule: 'Product.RET', entityType: 'ReturnShipment', entityId: 9999, reference: 'RET-REF-1',
    });
    assert.equal(again.ok, false, 'the same reference cannot belong to two entities');

    const messagesBefore = (await messagesAsync({})).length;
    const result = await post('carrier-api', [{
      sourceEventId: 'R-1', reference: 'RET-REF-1', code: 'in-transit', eventTimeUtc: '2026-03-04T09:00:00.000Z',
    }]);
    const applied = result.results[0];
    assert.equal(applied.status, 'Applied');
    assert.equal(applied.externalReference, 'ReturnShipment');
    assert.equal(applied.nativeStateChanged, false, 'no native shipment state changes');
    assert.equal(applied.notificationSent, false, 'and no TRK-012 message is sent');
    assert.equal((await messagesAsync({})).length, messagesBefore);

    assert.ok(publishedEvents().some((e) => e.eventName === 'Tracking.EventApplied'), 'Tracking.EventApplied is published');
    const forReturn = seen.find((p) => p.entityType === 'ReturnShipment');
    assert.ok(forReturn, 'the consumer receives it');
    assert.equal(forReturn.entityId, 4242, 'with the ReturnShipment id');
    assert.equal(forReturn.consumersOnlyEnqueue, true, 'and only enqueues');

    const timeline = await api.get('/api/tracking-hub/timeline/RET-REF-1', SESSIONS.logistics);
    assert.ok(timeline.events.some((e) => e.eventCode === 'IN_TRANSIT'), 'it appears in the return timeline');
    assert.equal(timeline.shipmentId, null);
  });

  test('AC-TRK-002-01-05', async () => {
    // "the second becomes Duplicate and nothing else changes (BR-TRK-011)"
    const { shipment, order } = await parcelAsync({ number: 'HUB-5' });
    const first = await post('scanner-app', [{
      sourceEventId: 'D-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: '2026-03-05T09:00:00.000Z', location: 'Hub',
    }]);
    assert.equal(first.results[0].status, 'Applied');
    const stageAfterFirst = (await repository('Order').getByIdAsync(order.id)).stage;

    const sameId = await post('scanner-app', [{
      sourceEventId: 'D-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: '2026-03-05T09:00:00.000Z', location: 'Hub',
    }]);
    assert.equal(sameId.results[0].status, 'Duplicate', 'the same source event id');
    assert.equal(sameId.results[0].rule, 'BR-TRK-011');
    assert.equal(sameId.results[0].nothingElseChanged, true);

    const noId = await post('scanner-app', [{
      reference: shipment.trackingNumber, code: 'SCAN_OUT', eventTimeUtc: '2026-03-05T11:00:00.000Z', location: 'Hub',
    }]);
    assert.equal(noId.results[0].status, 'Applied');
    const sameShape = await post('scanner-app', [{
      reference: shipment.trackingNumber, code: 'SCAN_OUT', eventTimeUtc: '2026-03-05T11:00:00.000Z', location: 'Hub',
    }]);
    assert.equal(sameShape.results[0].status, 'Duplicate', 'same shipment, code, time and location');
    assert.equal((await repository('Order').getByIdAsync(order.id)).stage, stageAfterFirst, 'nothing else changed');
  });

  test('AC-TRK-002-01-06', async () => {
    // "IOrderProcessingService.ShipAsync is called once under ILocker key 'shipment-{ShipmentId}'"
    const { shipment, order } = await parcelAsync({ number: 'HUB-6' });
    const first = await post('scanner-app', [{
      sourceEventId: 'SH-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: '2026-03-06T08:00:00.000Z',
    }]);
    assert.equal(first.results[0].nativeState.called, 'ShipAsync');
    assert.equal(first.results[0].nativeState.lockKey, `shipment-${shipment.id}`);
    assert.equal((await repository('Order').getByIdAsync(order.id)).stage, 'Dispatched');
    assert.ok((await repository('Shipment').getByIdAsync(shipment.id)).shippedOnUtc, 'ShippedDateUtc is set');

    const second = await post('scanner-app', [{
      sourceEventId: 'SH-2', reference: shipment.trackingNumber, code: 'SCAN_OUT', eventTimeUtc: '2026-03-06T10:00:00.000Z',
    }]);
    assert.equal(second.results[0].status, 'Applied');
    assert.equal(second.results[0].nativeState.called, null, 'ShipAsync is called once');
    assert.match(second.results[0].nativeState.reason, /already shipped/);

    // a pickup order is never shipped this way
    const pickup = await parcelAsync({ number: 'HUB-6P', fulfilment: 'pickup' });
    const onPickup = await post('scanner-app', [{
      sourceEventId: 'SH-3', reference: pickup.shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: '2026-03-06T08:00:00.000Z',
    }]);
    assert.equal(onPickup.results[0].nativeState.called, null, 'not on a pickup order');
  });

  test('AC-TRK-002-01-07', async () => {
    // "ReadyForPickupAsync, or DeliverAsync after the proof check of BR-LOG-080, is called once;
    //  a carrier DELIVERED event counts as proof only where the service level accepts it"
    const pickup = await parcelAsync({ number: 'HUB-7P', fulfilment: 'pickup' });
    const ready = await post('postglobal', [{
      sourceEventId: 'RP-1', reference: pickup.shipment.trackingNumber, code: 'EDG', eventTimeUtc: '2026-03-07T08:00:00.000Z',
    }]);
    assert.equal(ready.results[0].eventCode, 'READY_FOR_PICKUP');
    assert.equal(ready.results[0].nativeState.called, 'ReadyForPickupAsync');
    assert.equal((await repository('Order').getByIdAsync(pickup.order.id)).stage, 'ReadyForPickup');

    const collected = await post('scanner-app', [{
      sourceEventId: 'RP-2', reference: pickup.shipment.trackingNumber, code: 'HANDOVER', eventTimeUtc: '2026-03-07T12:00:00.000Z',
    }]);
    assert.equal(collected.results[0].eventCode, 'COLLECTED');
    assert.equal(collected.results[0].nativeState.called, 'DeliverAsync');
    assert.equal((await repository('Order').getByIdAsync(pickup.order.id)).stage, 'Delivered');

    // a carrier DELIVERED where the service level needs a signature is not proof
    const signature = await parcelAsync({ number: 'HUB-7S', stage: 'Dispatched', serviceLevel: 'signature-required' });
    const refused = await post('carrier-api', [{
      sourceEventId: 'RP-3', reference: signature.shipment.trackingNumber, code: 'delivered', eventTimeUtc: '2026-03-07T13:00:00.000Z',
    }]);
    assert.equal(refused.results[0].status, 'Applied', 'the event is still applied');
    assert.equal(refused.results[0].nativeState.called, null);
    assert.equal(refused.results[0].nativeState.rule, 'BR-LOG-080');
    assert.match(refused.results[0].nativeState.reason, /courier confirmation/);
    assert.equal((await repository('Order').getByIdAsync(signature.order.id)).stage, 'Dispatched', 'the order is not delivered');
    assert.ok((await api.get('/api/tracking-hub/state-refusals', SESSIONS.logistics)).length >= 1, 'and the refusal waits in the queue');

    // where the service level accepts it, the same event delivers
    const standard = await parcelAsync({ number: 'HUB-7C', stage: 'Dispatched' });
    const accepted = await post('carrier-api', [{
      sourceEventId: 'RP-4', reference: standard.shipment.trackingNumber, code: 'delivered', eventTimeUtc: '2026-03-07T14:00:00.000Z',
    }]);
    assert.equal(accepted.results[0].nativeState.called, 'DeliverAsync');
  });

  test('AC-TRK-002-01-08', async () => {
    // "the timeline is ordered by event time; native shipment state never moves backwards"
    const { shipment, order } = await parcelAsync({ number: 'HUB-8', stage: 'Dispatched' });
    await post('scanner-app', [{
      sourceEventId: 'O-3', reference: shipment.trackingNumber, code: 'POD', eventTimeUtc: '2026-03-08T16:00:00.000Z',
    }]);
    assert.equal((await repository('Order').getByIdAsync(order.id)).stage, 'Delivered');

    // an older event arrives afterwards
    const late = await post('scanner-app', [{
      sourceEventId: 'O-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: '2026-03-08T08:00:00.000Z', location: 'Hub',
    }]);
    assert.equal(late.results[0].status, 'Applied');
    assert.equal(late.results[0].nativeState.neverBackwards, true);
    assert.equal((await repository('Order').getByIdAsync(order.id)).stage, 'Delivered', 'the state does not move backwards');

    const timeline = await timelineAsync(shipment.trackingNumber);
    const times = timeline.events.map((e) => e.at);
    assert.deepEqual(times, [...times].sort(), 'the timeline is ordered by event time');
    assert.equal(timeline.events[0].eventCode, 'ARRIVED_HUB', 'the older event is first');
  });
});

describe('PRD-TRK-002 dictionary, rejections, alerts and search', () => {
  test('AC-TRK-002-02-01', async () => {
    // "it is saved, audited (AUD-TRK-002) and used for events received after the change"
    const codes = await api.get('/api/tracking-hub/event-codes', SESSIONS.admin);
    assert.equal(codes.length, 16, 'the dictionary holds the common codes');
    assert.ok(codes.find((c) => c.code === 'OUT_FOR_DELIVERY').shipped, 'with the shipped flag');
    assert.equal(codes.find((c) => c.code === 'DELIVERED').shipped, false);

    const denied = await api.post('/api/tracking-hub/mappings', { sourceCode: 'carrier-api', code: 'ARRIVED', eventCode: 'ARRIVED_HUB' }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Configuration.CreateEditDelete');

    const { shipment } = await parcelAsync({ number: 'HUB-MAP' });
    const before = await post('carrier-api', [{
      sourceEventId: 'M-1', reference: shipment.trackingNumber, code: 'ARRIVED', eventTimeUtc: '2026-03-09T08:00:00.000Z',
    }]);
    assert.equal(before.results[0].status, 'Rejected', 'before the mapping exists');

    const saved = await api.post('/api/tracking-hub/mappings', { sourceCode: 'carrier-api', code: 'ARRIVED', eventCode: 'ARRIVED_HUB' }, SESSIONS.admin);
    assert.equal(saved.ok, true);
    assert.equal(saved.usedForEventsReceivedAfterThis, true);

    const after = await post('carrier-api', [{
      sourceEventId: 'M-2', reference: shipment.trackingNumber, code: 'ARRIVED', eventTimeUtc: '2026-03-09T09:00:00.000Z',
    }]);
    assert.equal(after.results[0].status, 'Applied', 'and after it');
    assert.equal(after.results[0].eventCode, 'ARRIVED_HUB');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-002', entity: 'SourceCodeMapping' });
    assert.ok(trail.some((e) => e.after?.sourceCode === 'ARRIVED'), 'the change is audited');
  });

  test('AC-TRK-002-02-02', async () => {
    // "it becomes Rejected with the reason, appears in the rejected-events queue and triggers no
    //  customer notification; after the mapping is added ... staff reprocess it (AUD-TRK-001)"
    const { shipment } = await parcelAsync({ number: 'HUB-REJ' });
    const messagesBefore = (await messagesAsync({})).length;

    const unknownCode = await post('scanner-app', [{
      sourceEventId: 'J-1', reference: shipment.trackingNumber, code: 'WEIGH_IN', eventTimeUtc: '2026-03-10T08:00:00.000Z',
    }]);
    assert.equal(unknownCode.results[0].status, 'Rejected');
    assert.match(unknownCode.results[0].reason, /has no mapping/);
    assert.equal(unknownCode.results[0].customerNotified, false);

    const unknownReference = await post('scanner-app', [{
      sourceEventId: 'J-2', reference: 'TN-NOT-A-PARCEL', code: 'SCAN_IN', eventTimeUtc: '2026-03-10T08:00:00.000Z',
    }]);
    assert.match(unknownReference.results[0].reason, /no shipment carries the reference/);
    assert.equal((await messagesAsync({})).length, messagesBefore, 'no customer notification for a rejected event');

    const queue = await api.get('/api/tracking-hub/events/rejected', SESSIONS.logistics);
    assert.ok(queue.some((e) => e.sourceEventId === 'J-1'), 'both are in the rejected queue');
    assert.ok(queue.some((e) => e.sourceEventId === 'J-2'));

    const rejected = queue.find((e) => e.sourceEventId === 'J-1');
    const denied = await api.post(`/api/tracking-hub/events/${rejected.id}/reprocess`, {}, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Events.CreateEditDelete');

    await api.post('/api/tracking-hub/mappings', { sourceCode: 'scanner-app', code: 'WEIGH_IN', eventCode: 'ARRIVED_HUB' }, SESSIONS.admin);
    const reprocessed = await api.post(`/api/tracking-hub/events/${rejected.id}/reprocess`, {}, SESSIONS.logistics);
    assert.equal(reprocessed.status, 'Applied', 'staff reprocess it and it is applied');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-001', entity: 'TrackingEvent' });
    assert.ok(trail.some((e) => Number(e.entityId) === Number(rejected.id)), 'the reprocessing is audited');
  });

  test('AC-TRK-002-03-01', async () => {
    // "a scan alert opens (SM-TRK-02) in the operations queue with shipment, last event and
    //  expected event"
    const noLimit = await saveExpectationRuleAsync({
      afterCode: 'ARRIVED_HUB', expectedCode: 'DEPARTED_HUB', actor: await api.actorAsync(SESSIONS.admin),
    });
    assert.equal(noLimit.ok, false, 'a limit is required; no default is stated');

    const rule = await api.post('/api/tracking-hub/expectation-rules', {
      afterCode: 'ARRIVED_HUB', expectedCode: 'DEPARTED_HUB', limitMinutes: 120, longStuckLimitMinutes: 720,
    }, SESSIONS.admin);
    assert.equal(rule.ok, true);

    const { shipment } = await parcelAsync({ number: 'HUB-ALERT' });
    await post('scanner-app', [{
      sourceEventId: 'A-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: new Date(Date.now() - 60 * 60000).toISOString(), location: 'Hub',
    }]);
    const early = await api.post('/api/tracking-hub/alerts/task', {}, SESSIONS.admin);
    assert.equal(early.opened, 0, 'nothing opens inside the limit');

    const late = await runAlertTaskAsync({ now: new Date(Date.now() + 3 * 3600000).toISOString() });
    assert.ok(late.opened >= 1, 'the limit passes and an alert opens');
    const alerts = await api.get('/api/tracking-hub/alerts?status=Open', SESSIONS.logistics);
    const alert = alerts.find((a) => Number(a.shipmentId) === Number(shipment.id));
    assert.ok(alert, 'in the operations queue');
    assert.equal(alert.lastEventCode, 'ARRIVED_HUB', 'with the last event');
    assert.equal(alert.expectedCode, 'DEPARTED_HUB', 'and the expected one');
    assert.equal(alert.shipmentReference, shipment.trackingNumber);
  });

  test('AC-TRK-002-03-02', async () => {
    // "the alert becomes Resolved; a staff resolution is audited (AUD-TRK-008)"
    const { shipment } = await parcelAsync({ number: 'HUB-RES' });
    await post('scanner-app', [{
      sourceEventId: 'B-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: new Date(Date.now() - 4 * 3600000).toISOString(),
    }]);
    await runAlertTaskAsync({ now: new Date().toISOString() });
    const open = (await api.get('/api/tracking-hub/alerts?status=Open', SESSIONS.logistics))
      .find((a) => Number(a.shipmentId) === Number(shipment.id));
    assert.ok(open, 'an alert is open');

    // the expected event arrives
    await post('scanner-app', [{
      sourceEventId: 'B-2', reference: shipment.trackingNumber, code: 'SCAN_OUT', eventTimeUtc: new Date().toISOString(),
    }]);
    const afterEvent = (await api.get('/api/tracking-hub/alerts', SESSIONS.logistics)).find((a) => a.id === open.id);
    assert.equal(afterEvent.status, 'Resolved', 'the expected event resolves it');

    // or staff resolve one with a note
    const second = await parcelAsync({ number: 'HUB-RES2' });
    await post('scanner-app', [{
      sourceEventId: 'B-3', reference: second.shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: new Date(Date.now() - 4 * 3600000).toISOString(),
    }]);
    await runAlertTaskAsync({ now: new Date().toISOString() });
    const staffAlert = (await api.get('/api/tracking-hub/alerts?status=Open', SESSIONS.logistics))
      .find((a) => Number(a.shipmentId) === Number(second.shipment.id));

    const noNote = await api.post(`/api/tracking-hub/alerts/${staffAlert.id}/resolve`, {}, SESSIONS.logistics);
    assert.equal(noNote.ok, false, 'a note is required');
    const resolved = await api.post(`/api/tracking-hub/alerts/${staffAlert.id}/resolve`, { note: 'the parcel was rerouted by road' }, SESSIONS.logistics);
    assert.equal(resolved.alert.status, 'Resolved');
    assert.equal(resolved.alert.note, 'the parcel was rerouted by road');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-008', entity: 'ScanAlert' });
    assert.ok(trail.some((e) => Number(e.entityId) === Number(staffAlert.id)), 'the staff resolution is audited');
  });

  test('AC-TRK-002-03-03', async () => {
    // "the alert becomes Escalated and a LOG-013 incident of type delayed is opened"
    const { shipment } = await parcelAsync({ number: 'HUB-ESC' });
    await post('scanner-app', [{
      sourceEventId: 'E-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: new Date(Date.now() - 4 * 3600000).toISOString(),
    }]);
    await runAlertTaskAsync({ now: new Date().toISOString() });
    const open = (await api.get('/api/tracking-hub/alerts?status=Open', SESSIONS.logistics))
      .find((a) => Number(a.shipmentId) === Number(shipment.id));
    assert.ok(open, 'the alert is open');

    const stillOpen = await runAlertTaskAsync({ now: new Date(Date.now() + 2 * 3600000).toISOString() });
    assert.equal(stillOpen.escalated, 0, 'nothing escalates inside the long-stuck limit');

    const escalation = await runAlertTaskAsync({ now: new Date(Date.now() + 13 * 3600000).toISOString() });
    assert.ok(escalation.escalated >= 1);
    const after = (await api.get('/api/tracking-hub/alerts', SESSIONS.logistics)).find((a) => a.id === open.id);
    assert.equal(after.status, 'Escalated');
    assert.ok(after.incidentId, 'with an incident');

    const incident = await repository('DeliveryIncident').getByIdAsync(after.incidentId);
    assert.equal(incident.type, 'delayed');
    assert.equal(incident.feature, 'PRD-LOG-013');
    assert.equal(incident.status, 'Open');
  });

  test('AC-TRK-002-04-01', async () => {
    // "Applied events older than the active period are moved to the archive store and remain
    //  searchable by staff; events older than the archive period are deleted; each run is logged"
    const { shipment } = await parcelAsync({ number: 'HUB-RET' });
    await post('scanner-app', [{
      sourceEventId: 'T-1', reference: shipment.trackingNumber, code: 'SCAN_IN', eventTimeUtc: new Date(Date.now() - 200 * 86400000).toISOString(),
    }]);
    const old = (await eventsAsync({})).find((e) => e.sourceEventId === 'T-1');
    await plainRepository('TrackingEvent').updateAsync({ ...old, occurredOnUtc: new Date(Date.now() - 200 * 86400000).toISOString() });

    await api.post('/api/platform/retention/rules', {
      recordType: 'trk.trackingevents', period: 90, unit: 'days', action: 'Archive', archivePeriod: 365, archiveUnit: 'days',
    }, SESSIONS.admin);
    const run = await api.post('/api/platform/retention/run-tracking', {}, SESSIONS.admin);
    assert.equal(run.ok, true);
    assert.ok(run.counts[0].movedToArchive >= 1, 'events past the active period are archived');
    assert.equal(run.counts[0].stillSearchableByStaff, true);
    assert.equal(await repository('TrackingEvent').getByIdAsync(old.id), null, 'and leave the live store');

    const archive = await api.get(`/api/tracking-hub/archive?reference=${shipment.trackingNumber}`, SESSIONS.logistics);
    assert.equal(archive.searchableByStaff, true);
    assert.ok(archive.events.some((e) => e.sourceEventId === 'T-1'), 'staff can still find the archived event');

    const denied = await api.get('/api/tracking-hub/archive', SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Events.View');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-009', entity: 'RetentionRun' });
    assert.ok(trail.some((e) => e.note === 'tracking retention run'), 'each run is logged');
  });

  test('AC-TRK-002-05-01', async () => {
    // "matching shipments are listed and each opens its full timeline, scan alerts and
    //  notification log (TRK-007)"
    const { shipment, order, customer } = await parcelAsync({ number: 'HUB-SEARCH', stage: 'Dispatched' });
    await post('scanner-app', [{
      sourceEventId: 'F-1', reference: shipment.trackingNumber, code: 'LOAD', eventTimeUtc: new Date().toISOString(),
    }]);

    const denied = await api.get(`/api/tracking-hub/search?q=${order.orderNumber}`, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Events.View');

    for (const [label, term] of [
      ['order number', order.orderNumber],
      ['tracking reference', shipment.trackingNumber],
      ['S10', shipment.s10Reference],
      ['customer phone', customer.phone],
    ]) {
      const found = await api.get(`/api/tracking-hub/search?q=${encodeURIComponent(term)}`, SESSIONS.logistics);
      assert.equal(found.ok, true, `search by ${label}`);
      const row = found.results.find((r) => Number(r.shipmentId) === Number(shipment.id));
      assert.ok(row, `${label} finds the shipment`);
      assert.ok(row.timeline.length >= 1, 'with its full timeline');
      assert.ok(Array.isArray(row.scanAlerts), 'its scan alerts');
      assert.ok(row.notifications.length >= 1, 'and its notification log');
    }
  });
});

/* ======================================================= PRD-TRK-012 messages ========== */

describe('PRD-TRK-012 shipment and pickup messages', () => {
  test('AC-TRK-012-01-01', async () => {
    // "the message is sent on the channels of its definition with the tracking number and
    //  tracking link"
    const { shipment } = await parcelAsync({ number: 'MSG-SENT' });
    const sent = await shipmentSentAsync({ shipment, gateways: G });
    assert.equal(sent.sent, true);
    assert.equal(sent.trackingNumber, shipment.trackingNumber);
    assert.equal(sent.trackingLink, `/track/${shipment.trackingNumber}`);
    const sms = sent.messages.find((m) => m.channel === 'sms');
    assert.ok(sms, 'on the channels of its definition');
    assert.match(sms.text, new RegExp(shipment.trackingNumber), 'with the tracking number');
    assert.ok(sent.messages.some((m) => m.channel === 'email' && m.queuedEmailId));
  });

  test('AC-TRK-012-01-02', async () => {
    // "template ShipmentOutForDelivery.CustomerNotification is sent once per shipment, with the
    //  delivery OTP where the service level requires it"
    const plain = await parcelAsync({ number: 'MSG-OFD', stage: 'Dispatched' });
    const first = await post('scanner-app', [{
      sourceEventId: 'OFD-1', reference: plain.shipment.trackingNumber, code: 'LOAD', eventTimeUtc: '2026-03-11T06:00:00.000Z',
    }]);
    const notification = first.results[0].notification;
    assert.equal(notification.key, 'ShipmentOutForDelivery.CustomerNotification');
    assert.equal(notification.otpIncluded, false, 'no code where the service level does not ask for one');

    // once per shipment, even if the event is applied again
    const again = await post('scanner-app', [{
      sourceEventId: 'OFD-2', reference: plain.shipment.trackingNumber, code: 'LOAD', eventTimeUtc: '2026-03-11T07:00:00.000Z',
    }]);
    const repeats = (await messagesAsync({ definitionKey: 'ShipmentOutForDelivery.CustomerNotification' }))
      .filter((m) => Number(m.shipmentId) === Number(plain.shipment.id) && m.channel === 'sms' && !m.duplicate);
    assert.equal(repeats.length, 1, 'sent once per shipment');
    assert.equal(again.results[0].status, 'Applied');

    // with the code where the service level requires it (LOG-012)
    const otp = await parcelAsync({ number: 'MSG-OFD-OTP', stage: 'Dispatched', serviceLevel: 'otp-on-delivery' });
    await repository('PickupCode').insertAsync({ orderId: otp.order.id, code: 'OTP-7781', used: false });
    const withOtp = await post('scanner-app', [{
      sourceEventId: 'OFD-3', reference: otp.shipment.trackingNumber, code: 'LOAD', eventTimeUtc: '2026-03-11T08:00:00.000Z',
    }]);
    assert.equal(withOtp.results[0].notification.otpIncluded, true);
    const text = withOtp.results[0].notification.messages.find((m) => m.channel === 'sms').text;
    assert.match(text, /OTP-7781/, 'the delivery code is in the message');
  });

  test('AC-TRK-012-01-03', async () => {
    // "ShipmentDelivered.CustomerNotification is sent on the channels of its definition"
    const { shipment, order } = await parcelAsync({ number: 'MSG-DEL', stage: 'Dispatched' });
    const delivered = await post('scanner-app', [{
      sourceEventId: 'DEL-1', reference: shipment.trackingNumber, code: 'POD', eventTimeUtc: '2026-03-12T10:00:00.000Z',
    }]);
    assert.equal(delivered.results[0].eventCode, 'DELIVERED');
    assert.equal(delivered.results[0].notification.key, 'ShipmentDelivered.CustomerNotification');
    assert.ok(delivered.results[0].notification.messages.length >= 1);
    assert.equal((await repository('Order').getByIdAsync(order.id)).stage, 'Delivered');

    const collected = await parcelAsync({ number: 'MSG-COL', fulfilment: 'pickup', stage: 'ReadyForPickup' });
    const handover = await post('scanner-app', [{
      sourceEventId: 'COL-1', reference: collected.shipment.trackingNumber, code: 'HANDOVER', eventTimeUtc: '2026-03-12T11:00:00.000Z',
    }]);
    assert.equal(handover.results[0].eventCode, 'COLLECTED');
    assert.equal(handover.results[0].notification.key, 'ShipmentDelivered.CustomerNotification', 'a collection sends the same message');
  });

  test('AC-TRK-012-01-04', async () => {
    // "no second message is sent for that shipment and event (BR-TRK-022)"
    const { shipment } = await parcelAsync({ number: 'MSG-ONCE', stage: 'Dispatched' });
    await post('scanner-app', [{
      sourceEventId: 'ONCE-1', reference: shipment.trackingNumber, code: 'POD', eventTimeUtc: '2026-03-13T10:00:00.000Z',
    }]);
    const first = (await messagesAsync({ definitionKey: 'ShipmentDelivered.CustomerNotification' }))
      .filter((m) => Number(m.shipmentId) === Number(shipment.id));
    assert.ok(first.length >= 1);

    // the same event again, from another source and with a different id, is applied once more
    await post('postglobal', [{
      sourceEventId: 'ONCE-2', reference: shipment.trackingNumber, code: 'EDH', eventTimeUtc: '2026-03-13T11:00:00.000Z',
    }]);
    const second = (await messagesAsync({ definitionKey: 'ShipmentDelivered.CustomerNotification' }))
      .filter((m) => Number(m.shipmentId) === Number(shipment.id) && !m.duplicate);
    assert.equal(second.length, first.length, 'no second message for that shipment and event');
  });

  test('AC-TRK-012-02-01', async () => {
    // "the message includes the outlet name and address, opening hours, the pickup code or QR,
    //  the configured text on identification to bring, and the pickup deadline"
    const point = await repository('StorePickupPoint').insertAsync({
      name: 'Zomba Post Office', address: 'Kamuzu Highway, Zomba', openingHours: 'Monday to Friday, 8am to 4.30pm',
    });
    await saveSettingAsync('trk.pickup.identificationtext', 'Bring the national ID you ordered with.', 0);
    await saveSettingAsync('trk.pickup.holdingdays', 10, 0);

    const pickup = await parcelAsync({ number: 'MSG-READY', fulfilment: 'pickup', stage: 'Packed' });
    await repository('Order').updateAsync({ ...pickup.order, pickupPointId: point.id, readyForPickupOnUtc: new Date().toISOString() });
    await repository('PickupCode').insertAsync({ orderId: pickup.order.id, code: 'PX-9931', used: false });

    const ready = await readyForPickupAsync({ shipment: pickup.shipment, gateways: G });
    assert.equal(ready.outlet, 'Zomba Post Office');
    assert.equal(ready.openingHours, 'Monday to Friday, 8am to 4.30pm');
    assert.equal(ready.pickupCode, 'PX-9931');
    assert.equal(ready.identificationText, 'Bring the national ID you ordered with.');
    assert.ok(ready.deadline, 'and the deadline');

    const sms = ready.messages.find((m) => m.channel === 'sms');
    assert.match(sms.text, /PX-9931/, 'the code is in the message');
    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(pickup.customer.email)}`, SESSIONS.admin);
    assert.match(queued[0].body, /Zomba Post Office/);
    assert.match(queued[0].body, /Kamuzu Highway/);
    assert.match(queued[0].body, /Monday to Friday/);
  });

  test('AC-TRK-012-03-01', async () => {
    // "template ShipmentDeliveryAttemptFailed.CustomerNotification is sent with the reason text
    //  and a signed link to the LOG-013 rescheduling page"
    await repository('ReasonCode').insertAsync({ code: 'NO_ONE_HOME', name: 'Nobody was at the address', area: 'LOG' });
    const { shipment } = await parcelAsync({ number: 'MSG-FAIL', stage: 'Dispatched' });
    const failed = await post('scanner-app', [{
      sourceEventId: 'FAIL-1', reference: shipment.trackingNumber, code: 'FAIL', eventTimeUtc: '2026-03-14T15:00:00.000Z', reasonCode: 'NO_ONE_HOME',
    }]);
    assert.equal(failed.results[0].eventCode, 'ATTEMPT_FAILED');
    const notification = failed.results[0].notification;
    assert.equal(notification.key, 'ShipmentDeliveryAttemptFailed.CustomerNotification');
    assert.equal(notification.reasonText, 'Nobody was at the address', 'the reason text, not the code');
    const sms = notification.messages.find((m) => m.channel === 'sms');
    assert.match(sms.text, /Nobody was at the address/);
    assert.match(sms.text, /\/delivery\/reschedule\/TN-MSG-FAIL\?s=\d+/, 'with a signed link to the rescheduling page');
  });

  test('AC-TRK-012-04-01', async () => {
    // "ShipmentPickupReminder.CustomerNotification is sent once per reminder step with the
    //  deadline and any holding charge due"
    const noLeadTime = await runPickupReminderTaskAsync({ gateways: G });
    assert.equal(noLeadTime.noLeadTimeConfigured, true, 'no lead time is stated in the source');

    await saveSettingAsync('trk.pickup.reminderleadhours', [72, 24], 0);
    await saveSettingAsync('trk.pickup.holdingchargeperday', 'MWK 500', 0);
    const point = await repository('StorePickupPoint').getOneAsync((p) => p.name === 'Zomba Post Office');
    const pickup = await parcelAsync({ number: 'MSG-REMIND', fulfilment: 'pickup', stage: 'ReadyForPickup' });
    const deadline = new Date(Date.now() + 40 * 3600000).toISOString();
    await repository('Order').updateAsync({ ...pickup.order, pickupPointId: point.id, pickupDeadlineUtc: deadline });

    const run = await runPickupReminderTaskAsync({ gateways: G });
    assert.equal(run.reminded, 1, 'the 72-hour step fires once');
    assert.equal(run.lastReminder.step, 72);
    const sms = run.lastReminder.messages.find((m) => m.channel === 'sms');
    assert.match(sms.text, /MWK 500/, 'with the holding charge');
    assert.match(sms.text, new RegExp(new Date(deadline).toDateString()), 'and the deadline');

    const second = await runPickupReminderTaskAsync({ gateways: G });
    assert.equal(second.reminded, 0, 'and not again for the same step');
  });

  test('AC-TRK-012-04-02', async () => {
    // "ShipmentUncollected.CustomerNotification goes to the buyer and
    //  ShipmentUncollected.StoreOwnerNotification to the outlet and operations contacts"
    await saveSettingAsync('trk.pickup.reminderleadhours', [24], 0);
    await saveSettingAsync('trk.pickup.outletcontact', 'operations@example.com', 0);
    const point = await repository('StorePickupPoint').getOneAsync((p) => p.name === 'Zomba Post Office');
    const pickup = await parcelAsync({ number: 'MSG-UNCOLLECTED', fulfilment: 'pickup', stage: 'ReadyForPickup' });
    await repository('Order').updateAsync({
      ...pickup.order, pickupPointId: point.id, pickupDeadlineUtc: new Date(Date.now() - 3600000).toISOString(),
    });

    const run = await runPickupReminderTaskAsync({ gateways: G });
    assert.equal(run.uncollected, 1);
    const buyer = run.lastUncollected.buyer.find((m) => m.channel === 'sms');
    assert.ok(buyer, 'the buyer is told');
    assert.equal(buyer.recipient, pickup.customer.phone);
    const staff = run.lastUncollected.staff[0];
    assert.equal(staff.definitionKey, 'ShipmentUncollected.StoreOwnerNotification');
    assert.equal(staff.recipient, 'operations@example.com', 'and so are the outlet and operations contacts');

    const after = await repository('Order').getByIdAsync(pickup.order.id);
    assert.equal(after.pickupState, 'Uncollected');
    const second = await runPickupReminderTaskAsync({ gateways: G });
    assert.equal(second.uncollected, 0, 'and only once');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-006', entity: 'Shipment' });
    assert.ok(trail.some((e) => e.after?.uncollected === true));
  });
});
