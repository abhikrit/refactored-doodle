// PRD-TRK-002 the tracking event hub.
//
// Every tracking event, wherever it comes from - a scanner app, a carrier adapter, a postal
// interface, PostGlobal through INT-007, the public API with scope shipments.write, or an
// operator typing it in - enters through IC-TRK-01 SubmitEvents, is authenticated, stored as
// Received and then processed (SM-TRK-01): Duplicate, Rejected, or Applied.
//
// BR-TRK-010: the common event codes and the per-source mapping tables.
// BR-TRK-011: a duplicate changes nothing.
// BR-TRK-012: applying an event changes native shipment state only forwards and only through the
// order-processing service, under ILocker key 'shipment-{ShipmentId}'. TRK owns no shipment
// state itself; a refusal from the owner leaves the event Applied and goes to the operations
// queue for retry.

import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { withLockAsync } from '../../../core/locker.js';
import { publishAsync } from '../../../core/events.js';

const sourceRepo = () => repository('TrackingSource');
const codeRepo = () => repository('EventCode');
const mappingRepo = () => repository('SourceCodeMapping');
const eventRepo = () => repository('TrackingEvent');
const ruleRepo = () => repository('ScanExpectationRule');
const alertRepo = () => repository('ScanAlert');
const referenceRepo = () => repository('ExternalReference');
const refusalRepo = () => repository('ShipmentStateRefusal');

export const SHIPMENT_LOCK = (shipmentId) => `shipment-${shipmentId}`;
export const EVENT_STATUSES = ['Received', 'Duplicate', 'Applied', 'Rejected', 'Archived'];
export const ALERT_STATUSES = ['Open', 'Resolved', 'Escalated'];

/** BR-TRK-010: the common codes, with the "shipped" flag the rule gives each of them. */
export const COMMON_EVENT_CODES = [
  { code: 'CREATED', shipped: false, displayName: 'Created' },
  { code: 'ACCEPTED', shipped: true, displayName: 'Accepted' },
  { code: 'PICKED_UP', shipped: true, displayName: 'Picked up' },
  { code: 'ARRIVED_HUB', shipped: true, displayName: 'Arrived at hub' },
  { code: 'DEPARTED_HUB', shipped: true, displayName: 'Departed hub' },
  { code: 'IN_TRANSIT', shipped: true, displayName: 'In transit' },
  { code: 'CUSTOMS_HELD', shipped: false, displayName: 'Held by customs' },
  { code: 'CUSTOMS_CLEARED', shipped: false, displayName: 'Cleared customs' },
  { code: 'OUT_FOR_DELIVERY', shipped: true, displayName: 'Out for delivery' },
  { code: 'ATTEMPT_FAILED', shipped: false, displayName: 'Delivery attempt failed' },
  { code: 'READY_FOR_PICKUP', shipped: false, displayName: 'Ready for collection' },
  { code: 'DELIVERED', shipped: false, displayName: 'Delivered' },
  { code: 'COLLECTED', shipped: false, displayName: 'Collected' },
  { code: 'RETURNED_TO_SENDER', shipped: false, displayName: 'Returned to sender' },
  { code: 'EXCEPTION', shipped: false, displayName: 'Exception' },
  { code: 'CORRECTION', shipped: false, displayName: 'Correction' },
];

/** The sources the prototype installs, each with the mapping rows of its own vocabulary. */
export const DEFAULT_SOURCES = [
  {
    code: 'scanner-app',
    name: 'Scanning app',
    type: 'scanner app',
    mappings: {
      SCAN_IN: 'ARRIVED_HUB', SCAN_OUT: 'DEPARTED_HUB', LOAD: 'OUT_FOR_DELIVERY', POD: 'DELIVERED', HANDOVER: 'COLLECTED', FAIL: 'ATTEMPT_FAILED',
    },
  },
  {
    code: 'postglobal',
    name: 'PostGlobal',
    type: 'PostGlobal',
    mappings: {
      EMA: 'ACCEPTED', EDA: 'DEPARTED_HUB', EDB: 'ARRIVED_HUB', EDC: 'CUSTOMS_HELD', EDD: 'CUSTOMS_CLEARED', EDE: 'OUT_FOR_DELIVERY', EDF: 'ATTEMPT_FAILED', EDG: 'READY_FOR_PICKUP', EDH: 'DELIVERED', EDI: 'RETURNED_TO_SENDER',
    },
  },
  {
    code: 'carrier-api',
    name: 'Carrier API client',
    type: 'carrier',
    mappings: {
      'in-transit': 'IN_TRANSIT', 'out-for-delivery': 'OUT_FOR_DELIVERY', delivered: 'DELIVERED', exception: 'EXCEPTION',
    },
  },
  { code: 'manual', name: 'Manual entry', type: 'manual', mappings: Object.fromEntries(COMMON_EVENT_CODES.map((c) => [c.code, c.code])) },
];

/* ============================================================ installation ============= */

export async function ensureHubInstalledAsync() {
  if ((await codeRepo().getAllAsync()).length > 0) return { installed: false };
  for (const code of COMMON_EVENT_CODES) {
    await codeRepo().insertAsync({ ...code, isCustomerVisible: true });
  }
  for (const source of DEFAULT_SOURCES) {
    const row = await sourceRepo().insertAsync({
      code: source.code,
      name: source.name,
      type: source.type,
      credentialsRef: `secret:${source.code}`,
      stallLimitMinutes: null,
      lastEventOnUtc: null,
      active: true,
    });
    for (const [sourceCode, eventCode] of Object.entries(source.mappings)) {
      await mappingRepo().insertAsync({ sourceId: row.id, sourceCode, eventCode });
    }
  }
  return { installed: true, codes: COMMON_EVENT_CODES.length, sources: DEFAULT_SOURCES.length };
}

export async function sourcesAsync() {
  await ensureHubInstalledAsync();
  const rows = await sourceRepo().getAllAsync();
  return rows.map(({ credentialsRef, ...rest }) => ({ ...rest, credentialsHeld: Boolean(credentialsRef) }));
}

export async function eventCodesAsync() {
  await ensureHubInstalledAsync();
  return codeRepo().getAllAsync();
}

export async function mappingsAsync(sourceCode = null) {
  await ensureHubInstalledAsync();
  const sources = await sourceRepo().getAllAsync();
  const rows = await mappingRepo().getAllAsync();
  return rows
    .map((m) => ({ ...m, source: sources.find((s) => s.id === m.sourceId)?.code ?? String(m.sourceId) }))
    .filter((m) => !sourceCode || m.source === sourceCode);
}

/** AC-TRK-002-02-01: an administrator edits a mapping; later events use it. */
export async function saveMappingAsync({
  sourceCode, code, eventCode, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.Configuration.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Configuration.CreateEditDelete' };
  }
  await ensureHubInstalledAsync();
  const source = await sourceRepo().getOneAsync((s) => s.code === sourceCode);
  if (!source) return { ok: false, message: `no tracking source ${sourceCode}` };
  const known = await codeRepo().getOneAsync((c) => c.code === eventCode);
  if (!known) return { ok: false, message: `${eventCode} is not a common event code` };
  const existing = await mappingRepo().getOneAsync((m) => m.sourceId === source.id && m.sourceCode === code);
  const saved = existing
    ? await mappingRepo().updateAsync({ ...existing, eventCode })
    : await mappingRepo().insertAsync({ sourceId: source.id, sourceCode: code, eventCode });
  await auditAsync({
    event: 'AUD-TRK-002',
    area: 'TRK',
    feature: 'PRD-TRK-002',
    entity: 'SourceCodeMapping',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before: existing ? { eventCode: existing.eventCode } : null,
    after: { source: sourceCode, sourceCode: code, eventCode },
    storeId,
    note: existing ? 'source code mapping changed' : 'source code mapping created',
  });
  return { ok: true, mapping: { ...saved, source: sourceCode }, usedForEventsReceivedAfterThis: true };
}

/** IC-TRK-01 RegisterExternalReference: RET-003 registers its return tracking references. */
export async function registerExternalReferenceAsync({
  owningModule, entityType, entityId, reference,
}) {
  const existing = await referenceRepo().getOneAsync((r) => r.reference === reference);
  if (existing) {
    if (Number(existing.entityId) === Number(entityId) && existing.entityType === entityType) {
      return { ok: true, reference, alreadyRegistered: true };
    }
    return { ok: false, message: `${reference} is already registered for ${existing.entityType} ${existing.entityId}` };
  }
  const row = await referenceRepo().insertAsync({
    owningModule, entityType, entityId: Number(entityId), reference,
  });
  return { ok: true, reference, registered: row };
}

export const externalReferencesAsync = () => referenceRepo().getAllAsync();

/* ========================================================= IC-TRK-01 SubmitEvents ====== */

const authenticateAsync = async (sourceCode, credentials) => {
  const source = await sourceRepo().getOneAsync((s) => s.code === sourceCode);
  if (!source) return { ok: false, reason: `unknown tracking source ${sourceCode}` };
  if (source.active === false) return { ok: false, reason: `the ${sourceCode} source is not active` };
  if (source.credentialsRef && credentials !== source.credentialsRef) {
    return { ok: false, reason: 'the credentials of this source are not valid' };
  }
  return { ok: true, source };
};

/**
 * AC-TRK-002-01-01: a batch of events is authenticated, each one stored as Received with its
 * source, source code, reference, event time, location, staff and device, then processed.
 */
export async function submitEventsAsync({
  sourceCode, credentials = null, events = [], actor = null, gateways = null,
}) {
  await ensureHubInstalledAsync();
  const auth = await authenticateAsync(sourceCode, credentials);
  if (!auth.ok) {
    await auditAsync({
      event: 'AUD-TRK-003',
      area: 'TRK',
      feature: 'PRD-TRK-002',
      entity: 'TrackingSource',
      entityId: sourceCode,
      actor: actor ?? sourceCode,
      outcome: 'rejected',
      after: { reason: auth.reason, events: events.length },
      note: 'tracking ingestion authentication rejected',
    });
    return {
      ok: false, authenticated: false, reason: auth.reason, accepted: 0, results: [],
    };
  }

  const results = [];
  for (const event of events) {
    const stored = await eventRepo().insertAsync({
      sourceId: auth.source.id,
      source: auth.source.code,
      sourceEventId: event.sourceEventId ?? null,
      sourceCode: event.code ?? null,
      reference: event.reference ?? null,
      trackingNumber: event.reference ?? null,
      eventTimeUtc: event.eventTimeUtc ?? new Date().toISOString(),
      receivedOnUtc: new Date().toISOString(),
      occurredOnUtc: event.eventTimeUtc ?? new Date().toISOString(),
      location: event.location ?? null,
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      staffId: event.staffId ?? null,
      deviceId: event.deviceId ?? null,
      reasonCode: event.reasonCode ?? null,
      attachmentDownloadIds: event.attachmentDownloadIds ?? [],
      rawPayload: event,
      status: 'Received',
    });
    results.push(await processEventAsync({ eventId: stored.id, gateways }));
  }
  await sourceRepo().updateAsync({ ...auth.source, lastEventOnUtc: new Date().toISOString() });
  return {
    ok: true,
    authenticated: true,
    source: auth.source.code,
    accepted: results.length,
    results,
  };
}

/** BR-TRK-011: the duplicate test, by source event id, else by shipment, code, time and place. */
async function duplicateAsync(event, eventCode, shipmentId) {
  const all = await eventRepo().getAllAsync((e) => e.id !== event.id && e.status !== 'Rejected');
  if (event.sourceEventId) {
    return all.find((e) => e.sourceEventId === event.sourceEventId && e.sourceId === event.sourceId) ?? null;
  }
  return all.find((e) => Number(e.shipmentId) === Number(shipmentId)
    && e.eventCode === eventCode
    && e.eventTimeUtc === event.eventTimeUtc
    && (e.location ?? null) === (event.location ?? null)) ?? null;
}

/** SM-TRK-01: Received -> Duplicate | Rejected | Applied. */
export async function processEventAsync({ eventId, gateways = null, actor = null }) {
  const event = await eventRepo().getByIdAsync(eventId);
  if (!event) return { ok: false, message: 'no such event' };

  const reject = async (reason) => {
    const row = await eventRepo().updateAsync({ ...event, status: 'Rejected', rejectionReason: reason });
    return {
      ok: false, status: 'Rejected', reason, event: row, customerNotified: false,
    };
  };

  // the source code must be mapped to a common code
  const mapping = await mappingRepo().getOneAsync((m) => m.sourceId === event.sourceId && m.sourceCode === event.sourceCode);
  if (!mapping) return reject(`the code ${event.sourceCode} of this source has no mapping`);
  const eventCode = mapping.eventCode;

  // AC-TRK-002-01-04: the reference may be a return reference RET-003 registered
  const external = await referenceRepo().getOneAsync((r) => r.reference === event.reference);
  if (external) {
    const duplicate = await duplicateAsync(event, eventCode, null);
    if (duplicate) {
      const row = await eventRepo().updateAsync({ ...event, status: 'Duplicate', eventCode, duplicateOfId: duplicate.id });
      return { ok: true, status: 'Duplicate', event: row };
    }
    const row = await eventRepo().updateAsync({
      ...event, status: 'Applied', eventCode, externalEntityType: external.entityType, externalEntityId: external.entityId, appliedOnUtc: new Date().toISOString(),
    });
    await publishAsync('Tracking.EventApplied', {
      eventCode,
      reference: event.reference,
      entityType: external.entityType,
      entityId: external.entityId,
      owningModule: external.owningModule,
      consumersOnlyEnqueue: true,
    });
    return {
      ok: true,
      status: 'Applied',
      event: row,
      externalReference: external.entityType,
      nativeStateChanged: false,
      notificationSent: false,
      rule: 'SM-TRK-01',
    };
  }

  // otherwise the reference must match a shipment
  const shipment = await repository('Shipment').getOneAsync((s) => s.trackingNumber === event.reference
    || s.shipmentNumber === event.reference
    || s.s10Reference === event.reference);
  if (!shipment) return reject(`no shipment carries the reference ${event.reference}`);

  const duplicate = await duplicateAsync(event, eventCode, shipment.id);
  if (duplicate) {
    const row = await eventRepo().updateAsync({
      ...event, status: 'Duplicate', eventCode, shipmentId: shipment.id, duplicateOfId: duplicate.id,
    });
    return {
      ok: true, status: 'Duplicate', event: row, rule: 'BR-TRK-011', nothingElseChanged: true,
    };
  }

  const applied = await eventRepo().updateAsync({
    ...event,
    status: 'Applied',
    eventCode,
    shipmentId: shipment.id,
    orderId: shipment.orderId,
    appliedOnUtc: new Date().toISOString(),
    code: eventCode,
    description: (await codeRepo().getOneAsync((c) => c.code === eventCode))?.displayName ?? eventCode,
  });

  const state = await applyNativeStateAsync({ event: applied, shipment, eventCode });
  await resolveAlertsForAsync({ shipmentId: shipment.id, eventCode });
  await openAlertsForAsync({ shipment, eventCode, at: applied.eventTimeUtc });

  // TRK-012 decides which message belongs to this event
  const { notifyForEventAsync } = await import('./shipment-notifications.js');
  const notified = await notifyForEventAsync({
    event: applied, shipment, eventCode, gateways,
  });

  await publishAsync('Tracking.EventApplied', {
    eventCode, reference: event.reference, shipmentId: shipment.id, orderId: shipment.orderId,
  });
  return {
    ok: true,
    status: 'Applied',
    event: applied,
    eventCode,
    nativeState: state,
    notification: notified,
  };
}

/**
 * BR-TRK-012: forwards only, once, and only through the order-processing service, under
 * ILocker key 'shipment-{ShipmentId}'. A refusal leaves the event Applied and is queued.
 */
async function applyNativeStateAsync({ event, shipment, eventCode }) {
  const code = await codeRepo().getOneAsync((c) => c.code === eventCode);
  const order = await repository('Order').getByIdAsync(shipment.orderId);
  if (!order) return { called: null, reason: 'the shipment has no order' };
  const isPickup = order.fulfilment === 'pickup';

  let call = null;
  if (code?.shipped === true && !isPickup && !shipment.shippedOnUtc) call = 'ShipAsync';
  else if (eventCode === 'READY_FOR_PICKUP' && isPickup) call = 'ReadyForPickupAsync';
  else if (['DELIVERED', 'COLLECTED'].includes(eventCode)) call = 'DeliverAsync';
  if (!call) {
    return {
      called: null,
      reason: code?.shipped === true && shipment.shippedOnUtc ? 'the shipment is already shipped' : 'this code moves no native state',
      rule: 'BR-TRK-012',
    };
  }

  // BR-LOG-080: a delivery needs proof. A carrier DELIVERED event counts as courier
  // confirmation only where the service level accepts it.
  if (call === 'DeliverAsync') {
    const acceptsCourier = (order.serviceLevel ?? 'standard') !== 'signature-required';
    const fromCarrier = ['carrier', 'PostGlobal'].includes((await sourceRepo().getByIdAsync(event.sourceId))?.type);
    if (fromCarrier && !acceptsCourier) {
      await refusalRepo().insertAsync({
        shipmentId: shipment.id, eventId: event.id, call, reason: 'the service level does not accept courier confirmation as proof', status: 'Open',
      });
      return {
        called: null, refused: true, reason: 'the service level does not accept courier confirmation as proof', rule: 'BR-LOG-080',
      };
    }
  }

  const stages = { ShipAsync: 'Dispatched', ReadyForPickupAsync: 'ReadyForPickup', DeliverAsync: 'Delivered' };
  const target = stages[call];

  return withLockAsync(SHIPMENT_LOCK(shipment.id), async () => {
    const fresh = await repository('Order').getByIdAsync(order.id);
    // AC-TRK-002-01-08: native shipment state never moves backwards
    const order0 = ['Placed', 'Paid', 'Packed', 'Dispatched', 'ReadyForPickup', 'Delivered'];
    if (order0.indexOf(target) <= order0.indexOf(fresh.stage)) {
      return {
        called: null, reason: `the order is already ${fresh.stage}`, neverBackwards: true, lockKey: SHIPMENT_LOCK(shipment.id),
      };
    }
    const { advanceStageAsync } = await import('../../product-ord/services/orders.js');
    const result = await advanceStageAsync({
      orderNumber: fresh.orderNumber, to: target, actor: 'tracking hub', actorRole: 'System', reason: `tracking event ${eventCode}`,
    });
    if (result.ok !== true) {
      // the owner refused: the event stays Applied and the refusal waits in the queue
      await refusalRepo().insertAsync({
        shipmentId: shipment.id, eventId: event.id, call, reason: result.message, status: 'Open',
      });
      return {
        called: call, refused: true, reason: result.message, queuedForRetry: true, rule: 'BR-TRK-012',
      };
    }
    if (call === 'ShipAsync') await repository('Shipment').updateAsync({ ...shipment, shippedOnUtc: new Date().toISOString() });
    if (call === 'DeliverAsync') await repository('Shipment').updateAsync({ ...shipment, deliveredOnUtc: new Date().toISOString() });
    return {
      called: call,
      through: 'IOrderProcessingService',
      lockKey: SHIPMENT_LOCK(shipment.id),
      stage: target,
      rule: 'BR-TRK-012',
    };
  });
}

export const stateRefusalsAsync = () => refusalRepo().getAllAsync((r) => r.status === 'Open');

/** AC-TRK-002-02-02: staff reprocess a rejected event after the mapping or link is fixed. */
export async function reprocessEventAsync({ eventId, actor = null, gateways = null }) {
  if (!await authorizeAsync('Tracking.Core.Events.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Events.CreateEditDelete' };
  }
  const event = await eventRepo().getByIdAsync(eventId);
  if (!event) return { ok: false, message: 'no such event' };
  if (event.status !== 'Rejected') return { ok: false, message: `that event is ${event.status}` };
  await eventRepo().updateAsync({ ...event, status: 'Received', rejectionReason: null });
  await auditAsync({
    event: 'AUD-TRK-001',
    area: 'TRK',
    feature: 'PRD-TRK-002',
    entity: 'TrackingEvent',
    entityId: event.id,
    actor: actor?.email ?? null,
    before: { status: 'Rejected', reason: event.rejectionReason },
    after: { status: 'Received' },
    note: 'rejected tracking event reprocessed',
  });
  return processEventAsync({ eventId, gateways, actor });
}

export const rejectedEventsAsync = () => eventRepo().getAllAsync((e) => e.status === 'Rejected');

/** AC-TRK-002-01-01 and 01-02: an operator types an event in. */
export async function manualEventAsync({
  reference, code, eventTimeUtc = null, location = null, note = null, actor = null, gateways = null,
}) {
  if (!await authorizeAsync('Tracking.Core.Events.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Events.CreateEditDelete' };
  }
  await ensureHubInstalledAsync();
  const source = await sourceRepo().getOneAsync((s) => s.code === 'manual');
  const result = await submitEventsAsync({
    sourceCode: 'manual',
    credentials: source.credentialsRef,
    events: [{
      reference, code, eventTimeUtc: eventTimeUtc ?? new Date().toISOString(), location, staffId: actor?.id ?? null, note,
    }],
    actor: actor?.email ?? 'operator',
    gateways,
  });
  await auditAsync({
    event: 'AUD-TRK-001',
    area: 'TRK',
    feature: 'PRD-TRK-002',
    entity: 'TrackingEvent',
    entityId: result.results?.[0]?.event?.id ?? 'none',
    actor: actor?.email ?? null,
    after: { reference, code, location },
    note: 'manual tracking event entered',
  });
  return result;
}

/* ============================================================ the timeline ============= */

/** AC-TRK-002-01-02 and 01-08: ordered by event time, whatever order they arrived in. */
export async function timelineAsync(reference) {
  const shipment = await repository('Shipment').getOneAsync((s) => s.trackingNumber === reference
    || s.shipmentNumber === reference || s.s10Reference === reference);
  const rows = await eventRepo().getAllAsync((e) => (shipment ? Number(e.shipmentId) === Number(shipment.id) : false)
    || e.reference === reference || e.trackingNumber === reference);
  const codes = await codeRepo().getAllAsync();
  const events = rows
    .filter((e) => ['Applied', 'Archived'].includes(e.status) || !e.status)
    .map((e) => ({
      id: e.id,
      eventCode: e.eventCode ?? e.code ?? null,
      displayName: codes.find((c) => c.code === (e.eventCode ?? e.code))?.displayName ?? e.description ?? e.code ?? null,
      at: e.eventTimeUtc ?? e.occurredOnUtc,
      receivedOnUtc: e.receivedOnUtc ?? e.createdOnUtc,
      location: e.location,
      source: e.source ?? e.sourceSystem ?? null,
      status: e.status ?? 'Applied',
      reasonCode: e.reasonCode ?? null,
    }))
    .sort((a, b) => String(a.at).localeCompare(String(b.at)) || a.id - b.id);
  return { reference, shipmentId: shipment?.id ?? null, events };
}

/* ====================================================== expected scans and alerts ====== */

export async function saveExpectationRuleAsync({
  afterCode, expectedCode, routeOrServiceLevel = null, limitMinutes, longStuckLimitMinutes = null,
  actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.Configuration.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Configuration.CreateEditDelete' };
  }
  if (!limitMinutes) return { ok: false, message: 'a limit is required; no default is stated in the source' };
  const existing = await ruleRepo().getOneAsync((r) => r.afterCode === afterCode
    && r.expectedCode === expectedCode && (r.routeOrServiceLevel ?? null) === (routeOrServiceLevel ?? null));
  const row = {
    afterCode, expectedCode, routeOrServiceLevel, limitMinutes: Number(limitMinutes), longStuckLimitMinutes: longStuckLimitMinutes === null ? null : Number(longStuckLimitMinutes), active: true,
  };
  const saved = existing ? await ruleRepo().updateAsync({ ...existing, ...row }) : await ruleRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-TRK-002',
    area: 'TRK',
    feature: 'PRD-TRK-002',
    entity: 'ScanExpectationRule',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before: existing ? { limitMinutes: existing.limitMinutes } : null,
    after: row,
    storeId,
    note: existing ? 'expected-scan rule changed' : 'expected-scan rule created',
  });
  return { ok: true, rule: saved };
}

export const expectationRulesAsync = () => ruleRepo().getAllAsync();

/** The rules that watch for an event after this one; nothing opens until the limit passes. */
async function openAlertsForAsync({ shipment, eventCode, at }) {
  const order = await repository('Order').getByIdAsync(shipment.orderId);
  const rules = await ruleRepo().getAllAsync((r) => r.afterCode === eventCode && r.active !== false);
  for (const rule of rules) {
    if (rule.routeOrServiceLevel && rule.routeOrServiceLevel !== (order?.serviceLevel ?? shipment.route ?? null)) continue;
    const existing = await alertRepo().getOneAsync((a) => Number(a.shipmentId) === Number(shipment.id)
      && Number(a.ruleId) === Number(rule.id) && a.status === 'Open');
    if (existing) continue;
    await alertRepo().insertAsync({
      shipmentId: shipment.id,
      ruleId: rule.id,
      status: 'Watching',
      lastEventCode: eventCode,
      lastEventAt: at,
      expectedCode: rule.expectedCode,
      dueAtUtc: new Date(new Date(at).getTime() + rule.limitMinutes * 60000).toISOString(),
    });
  }
}

/** AC-TRK-002-03-02: the expected event arrives. */
async function resolveAlertsForAsync({ shipmentId, eventCode }) {
  const open = await alertRepo().getAllAsync((a) => Number(a.shipmentId) === Number(shipmentId)
    && ['Watching', 'Open', 'Escalated'].includes(a.status) && a.expectedCode === eventCode);
  for (const alert of open) {
    await alertRepo().updateAsync({
      ...alert, status: 'Resolved', resolvedOnUtc: new Date().toISOString(), resolvedBy: 'the expected event arrived',
    });
  }
  return open.length;
}

/**
 * AC-TRK-002-03-01 and 03-03: the alert task. A watch past its limit opens an alert; an alert
 * past the long-stuck limit is escalated and a LOG-013 incident of type delayed is opened.
 */
export async function runAlertTaskAsync({ now = null, actor = 'system' } = {}) {
  const at = now ? new Date(now) : new Date();
  const opened = [];
  const escalated = [];
  for (const alert of await alertRepo().getAllAsync((a) => ['Watching', 'Open'].includes(a.status))) {
    const rule = await ruleRepo().getByIdAsync(alert.ruleId);
    if (alert.status === 'Watching' && new Date(alert.dueAtUtc) <= at) {
      const shipment = await repository('Shipment').getByIdAsync(alert.shipmentId);
      const row = await alertRepo().updateAsync({
        ...alert,
        status: 'Open',
        openedOnUtc: at.toISOString(),
        shipmentReference: shipment?.trackingNumber ?? null,
        orderId: shipment?.orderId ?? null,
      });
      opened.push(row);
      continue;
    }
    if (alert.status === 'Open' && rule?.longStuckLimitMinutes) {
      const stuckSince = new Date(alert.openedOnUtc ?? alert.dueAtUtc).getTime() + rule.longStuckLimitMinutes * 60000;
      if (stuckSince <= at.getTime()) {
        const incident = await repository('DeliveryIncident').insertAsync({
          shipmentId: alert.shipmentId,
          type: 'delayed',
          source: 'PRD-TRK-002 scan alert',
          openedOnUtc: at.toISOString(),
          status: 'Open',
          feature: 'PRD-LOG-013',
        });
        escalated.push(await alertRepo().updateAsync({
          ...alert, status: 'Escalated', escalatedOnUtc: at.toISOString(), incidentId: incident.id,
        }));
      }
    }
  }
  return {
    ok: true, opened: opened.length, escalated: escalated.length, alerts: [...opened, ...escalated],
  };
}

export async function alertsAsync(filter = {}) {
  const rows = await alertRepo().getAllAsync((a) => (!filter.status || a.status === filter.status));
  return rows.slice().sort((a, b) => b.id - a.id);
}

/** AC-TRK-002-03-02: staff resolve an alert with a note; the resolution is audited. */
export async function resolveAlertAsync({ alertId, note, actor = null }) {
  if (!await authorizeAsync('Tracking.Core.Events.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Events.CreateEditDelete' };
  }
  if (!note) return { ok: false, message: 'a note is required to resolve an alert' };
  const alert = await alertRepo().getByIdAsync(alertId);
  if (!alert) return { ok: false, message: 'no such alert' };
  const saved = await alertRepo().updateAsync({
    ...alert, status: 'Resolved', note, resolvedBy: actor?.email ?? null, resolvedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-TRK-008',
    area: 'TRK',
    feature: 'PRD-TRK-002',
    entity: 'ScanAlert',
    entityId: alert.id,
    actor: actor?.email ?? null,
    before: { status: alert.status },
    after: { status: 'Resolved', note },
    note: 'scan alert resolved by staff',
  });
  return { ok: true, alert: saved };
}

/* ================================================================ staff search ========= */

/**
 * AC-TRK-002-05-01: search by order number, tracking reference, S10 or customer phone; each
 * result opens its timeline, its scan alerts and its notification log.
 */
export async function searchAsync({ term, requester = null }) {
  if (requester && !await authorizeAsync('Tracking.Core.Events.View', requester)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Events.View' };
  }
  const needle = String(term ?? '').trim().toLowerCase();
  if (!needle) return { ok: true, term, results: [] };
  const shipments = await repository('Shipment').getAllAsync();
  const orders = await repository('Order').getAllAsync();
  const customers = await repository('Customer').getAllAsync();

  const matched = [];
  for (const shipment of shipments) {
    const order = orders.find((o) => Number(o.id) === Number(shipment.orderId));
    const customer = order?.customerId ? customers.find((c) => Number(c.id) === Number(order.customerId)) : null;
    const hit = [shipment.trackingNumber, shipment.shipmentNumber, shipment.s10Reference, order?.orderNumber, customer?.phone, order?.customerPhone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
    if (!hit) continue;
    const { messagesAsync } = await import('./delivery-log.js');
    matched.push({
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      s10Reference: shipment.s10Reference ?? null,
      orderNumber: order?.orderNumber ?? null,
      customerPhone: customer?.phone ?? order?.customerPhone ?? null,
      stage: order?.stage ?? null,
      timeline: (await timelineAsync(shipment.trackingNumber)).events,
      scanAlerts: (await alertsAsync()).filter((a) => Number(a.shipmentId) === Number(shipment.id)),
      notifications: (await messagesAsync({ orderId: order?.id })).map((m) => ({
        definitionKey: m.definitionKey, channel: m.channel, status: m.status, at: m.sentOnUtc ?? m.createdOnUtc,
      })),
    });
  }
  return { ok: true, term, results: matched, searchedBy: ['order number', 'tracking reference', 'S10', 'customer phone'] };
}

/** AC-TRK-002-04-01: archived events stay searchable by staff. */
export async function archivedEventsAsync({ reference = null, requester = null } = {}) {
  if (requester && !await authorizeAsync('Tracking.Core.Events.View', requester)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Events.View' };
  }
  const entries = await plainRepository('ArchiveEntry').getAllAsync((a) => a.recordType === 'trk.trackingevents');
  const rows = entries.flatMap((entry) => (entry.rows ?? []).map((r) => ({
    ...r, archivedIn: entry.id, checksum: entry.checksum, verified: entry.verified,
  })));
  return {
    ok: true,
    searchableByStaff: true,
    events: reference ? rows.filter((r) => r.reference === reference || r.trackingNumber === reference) : rows,
  };
}

export const eventsAsync = (filter = {}) => eventRepo().getAllAsync((e) => (!filter.status || e.status === filter.status)
  && (!filter.reference || e.reference === filter.reference));
