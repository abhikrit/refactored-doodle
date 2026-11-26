// PRD-TRK-003 the scanning and field operations app.
//
// Held by decision FG-06 (postal operations in the product or through PostGlobal), and its
// implementation column says External system, so the prototype builds the app's side of
// IC-TRK-01 as a mock (decision P-3) and labels the feature
// "Prototype default - decision FG-06 pending" (decision P-1). What is real here is everything
// the product owes the app: device registration, the scan route into the TRK-002 hub, the
// offline sync window, coordinates with their consent record, media through the ADM-008 upload
// gate, and the work list the app asks for.

import { createHash, randomBytes } from 'node:crypto';
import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { checkUploadAsync } from '../../product-adm/services/uploads.js';
import { submitEventsAsync, processEventAsync } from './event-hub.js';

export const PROTOTYPE_DEFAULT_LABEL = 'Prototype default - decision FG-06 pending';
export const UPLOAD_CONTEXT = 'tracking-scan-media';
export const SCAN_TYPES = {
  pickup: 'PICKED_UP',
  'hub-arrival': 'ARRIVED_HUB',
  'hub-departure': 'DEPARTED_HUB',
  delivery: 'DELIVERED',
};

const deviceRepo = () => repository('Device');
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

/* ============================================================== devices ================ */

/** IC-TRK-01 RegisterDevice: a device is linked to a staff identifier before it may scan. */
export async function registerDeviceAsync({
  deviceId, staffCustomerId, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.Devices.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Devices.CreateEditDelete' };
  }
  const staff = await repository('Customer').getByIdAsync(staffCustomerId);
  if (!staff) return { ok: false, message: 'unknown staff member' };
  const token = randomBytes(16).toString('hex');
  const existing = await deviceRepo().getOneAsync((d) => d.deviceId === deviceId);
  const row = {
    deviceId,
    staffCustomerId: Number(staffCustomerId),
    staffName: `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim(),
    tokenHash: tokenHash(token),
    status: 'Active',
    registeredBy: actor?.email ?? null,
    registeredOnUtc: new Date().toISOString(),
  };
  const saved = existing ? await deviceRepo().updateAsync({ ...existing, ...row }) : await deviceRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-TRK-004',
    area: 'TRK',
    feature: 'PRD-TRK-003',
    entity: 'Device',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before: existing ? { status: existing.status } : null,
    after: { deviceId, staffCustomerId: Number(staffCustomerId), status: 'Active' },
    storeId,
    note: 'scanning device registered',
  });
  return {
    ok: true,
    device: { ...saved, tokenHash: undefined },
    token,
    tokenShownOnce: true,
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
  };
}

export async function revokeDeviceAsync({ deviceId, actor = null, storeId = 1 }) {
  if (!await authorizeAsync('Tracking.Core.Devices.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Devices.CreateEditDelete' };
  }
  const device = await deviceRepo().getOneAsync((d) => d.deviceId === deviceId);
  if (!device) return { ok: false, message: 'no such device' };
  const saved = await deviceRepo().updateAsync({
    ...device, status: 'Revoked', revokedBy: actor?.email ?? null, revokedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-TRK-004',
    area: 'TRK',
    feature: 'PRD-TRK-003',
    entity: 'Device',
    entityId: device.id,
    actor: actor?.email ?? null,
    before: { status: 'Active' },
    after: { status: 'Revoked' },
    storeId,
    note: 'scanning device revoked',
  });
  return { ok: true, status: saved.status };
}

export const devicesAsync = async () => (await deviceRepo().getAllAsync())
  .map(({ tokenHash: hash, ...rest }) => ({ ...rest, tokenHeld: Boolean(hash) }));

async function authenticateDeviceAsync({ deviceId, token, storeId }) {
  const device = await deviceRepo().getOneAsync((d) => d.deviceId === deviceId);
  if (!device) {
    await auditAsync({
      event: 'AUD-TRK-003',
      area: 'TRK',
      feature: 'PRD-TRK-003',
      entity: 'Device',
      entityId: deviceId ?? 'unknown',
      actor: deviceId ?? 'unknown device',
      outcome: 'rejected',
      after: { reason: 'the device is not registered' },
      storeId,
      note: 'scan from an unregistered device rejected',
    });
    return { ok: false, reason: 'the device is not registered' };
  }
  if (device.status !== 'Active') {
    await auditAsync({
      event: 'AUD-TRK-003',
      area: 'TRK',
      feature: 'PRD-TRK-003',
      entity: 'Device',
      entityId: device.id,
      actor: deviceId,
      outcome: 'rejected',
      after: { reason: `the device is ${device.status}` },
      storeId,
      note: 'scan from a revoked device rejected',
    });
    return { ok: false, reason: `the device is ${device.status}` };
  }
  if (token && device.tokenHash !== tokenHash(token)) {
    await auditAsync({
      event: 'AUD-TRK-003',
      area: 'TRK',
      feature: 'PRD-TRK-003',
      entity: 'Device',
      entityId: device.id,
      actor: deviceId,
      outcome: 'rejected',
      after: { reason: 'the device token is not valid' },
      storeId,
      note: 'scan with an invalid device token rejected',
    });
    return { ok: false, reason: 'the device token is not valid' };
  }
  return { ok: true, device };
}

/* ============================================================== the scans ============== */

/**
 * The app's batch (IC-TRK-01 SubmitEvents through the scanner-app source). Each scan keeps its
 * capture time, gets a receipt time, carries the staff and device identifiers, and is flagged
 * late when it is older than the sync window.
 */
export async function submitScansAsync({
  deviceId, token = null, scans = [], consentRecorded = null, gateways = null, storeId = 1,
}) {
  const auth = await authenticateDeviceAsync({ deviceId, token, storeId });
  if (!auth.ok) {
    return {
      ok: false, authenticated: false, reason: auth.reason, accepted: 0, results: [], audited: true,
    };
  }
  const windowHours = await getSettingAsync('trk.scan.syncwindowhours', storeId, null);
  const receivedOnUtc = new Date();
  const prepared = [];
  const lateFlags = [];
  for (const scan of scans) {
    // the app sends its own scan type; the hub's mapping table turns it into a common code
    const code = scan.type ?? scan.code ?? null;
    if (!code) { prepared.push(null); continue; }
    const capturedAt = scan.capturedAtUtc ?? receivedOnUtc.toISOString();
    const ageHours = (receivedOnUtc.getTime() - new Date(capturedAt).getTime()) / 3600000;
    const late = windowHours !== null && ageHours > Number(windowHours);
    lateFlags.push(late);
    prepared.push({
      sourceEventId: scan.sourceEventId ?? `${deviceId}-${capturedAt}`,
      reference: scan.reference,
      code,
      eventTimeUtc: capturedAt,
      location: scan.location ?? null,
      latitude: scan.latitude ?? null,
      longitude: scan.longitude ?? null,
      staffId: auth.device.staffCustomerId,
      deviceId,
      reasonCode: scan.reasonCode ?? null,
    });
  }
  const batch = await submitEventsAsync({
    sourceCode: 'scanner-app',
    credentials: (await repository('TrackingSource').getOneAsync((s) => s.code === 'scanner-app'))?.credentialsRef ?? null,
    events: prepared.filter(Boolean),
    actor: deviceId,
    gateways,
  });

  // the capture-time, consent and media details the app sends with each scan
  const results = [];
  for (const [i, result] of (batch.results ?? []).entries()) {
    const scan = scans[i] ?? {};
    const event = result.event ?? null;
    let media = null;
    if (event && (scan.media ?? []).length) {
      media = await attachMediaAsync({
        eventId: event.id, media: scan.media, actor: deviceId, storeId,
      });
    }
    if (event) {
      await plainRepository('TrackingEvent').updateAsync({
        ...await repository('TrackingEvent').getByIdAsync(event.id),
        capturedOnUtc: scan.capturedAtUtc ?? event.eventTimeUtc,
        receivedOnUtc: receivedOnUtc.toISOString(),
        late: lateFlags[i] === true,
        syncWindowHours: windowHours,
        locationConsent: scan.latitude ? (consentRecorded ?? scan.consentRecorded ?? null) : null,
        attachmentDownloadIds: media?.stored ?? [],
        mediaRefusals: media?.refused ?? [],
      });
    }
    results.push({
      ...result,
      late: lateFlags[i] === true,
      capturedOnUtc: scan.capturedAtUtc ?? null,
      media,
    });
  }
  return {
    ok: true,
    authenticated: true,
    device: deviceId,
    staffId: auth.device.staffCustomerId,
    accepted: results.length,
    results,
    syncWindowHours: windowHours,
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
  };
}

/**
 * AC-TRK-003-03-03: every file goes through the ADM-008 gate for the TRK context before it is
 * stored as a Download linked to the event; a refused file is not stored and the event keeps the
 * message key ADM gave as the reason.
 */
export async function attachMediaAsync({
  eventId, media = [], actor = 'device', storeId = 1,
}) {
  const stored = [];
  const refused = [];
  for (const file of media) {
    const bytes = Buffer.from(file.base64 ?? '', 'base64');
    const check = await checkUploadAsync({
      contextCode: UPLOAD_CONTEXT,
      fileName: file.fileName,
      contentType: file.contentType ?? null,
      bytes,
      actor,
    });
    if (check.ok !== true) {
      refused.push({ fileName: file.fileName, messageKey: check.messageKey, message: check.message });
      continue;
    }
    const download = await repository('Download').insertAsync({
      downloadGuid: `scan-${eventId}-${stored.length + 1}-${randomBytes(4).toString('hex')}`,
      fileName: file.fileName,
      contentType: file.contentType ?? null,
      trackingEventId: Number(eventId),
      feature: 'PRD-TRK-003',
      storeId,
    });
    await repository('UploadOwnership').insertAsync({
      downloadGuid: download.downloadGuid,
      owningFeature: 'PRD-TRK-003',
      context: UPLOAD_CONTEXT,
      trackingEventId: Number(eventId),
    });
    stored.push(download.downloadGuid);
  }
  return { stored, refused, checkedThrough: 'PRD-ADM-008' };
}

/**
 * The IC-SEC-05 provider: TRK claims a scan media file and allows it only to a holder of
 * Tracking.Core.Events.View.
 */
export async function downloadAccessProviderAsync({ downloadGuid, requester, ownership }) {
  const mine = ownership?.owningFeature === 'PRD-TRK-003'
    || (await repository('Download').getOneAsync((d) => d.downloadGuid === downloadGuid))?.feature === 'PRD-TRK-003';
  if (!mine) return { claimed: false };
  const allowed = requester ? await authorizeAsync('Tracking.Core.Events.View', requester) : false;
  return {
    claimed: true,
    decision: allowed ? 'Allow' : 'Deny',
    reason: allowed ? null : 'scan media is for holders of Tracking.Core.Events.View',
  };
}

/* ============================================================== the work list ========== */

/**
 * IC-TRK-01 GetWorkList. The route list (LOG-024) and the pickup list (LOG-011) are themselves
 * held by FG-06, so the prototype answers with the staff member's own parcels, which is what the
 * app needs to scan them.
 */
export async function workListAsync({ deviceId, token = null, storeId = 1 }) {
  const auth = await authenticateDeviceAsync({ deviceId, token, storeId });
  if (!auth.ok) return { ok: false, authenticated: false, reason: auth.reason };
  const staff = await repository('Customer').getByIdAsync(auth.device.staffCustomerId);
  const outlet = staff?.outlet ?? null;
  const orders = await repository('Order').getAllAsync((o) => (outlet
    ? o.pickupOutlet === outlet || o.fulfilment === 'pickup'
    : o.fulfilment === 'delivery'));
  const rows = [];
  for (const order of orders.slice(0, 25)) {
    const shipments = await repository('Shipment').getAllAsync((s) => Number(s.orderId) === Number(order.id));
    for (const shipment of shipments) {
      rows.push({
        trackingNumber: shipment.trackingNumber,
        orderNumber: order.orderNumber,
        kind: order.fulfilment === 'pickup' ? 'pickup list' : 'route list',
        outlet,
        stage: order.stage ?? null,
      });
    }
  }
  return {
    ok: true,
    authenticated: true,
    staffId: auth.device.staffCustomerId,
    staffName: auth.device.staffName,
    kind: outlet ? 'pickup list' : 'route list',
    owningFeatures: ['PRD-LOG-011', 'PRD-LOG-024'],
    items: rows,
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
  };
}

export const scanEventsAsync = () => repository('TrackingEvent')
  .getAllAsync((e) => e.deviceId !== null && e.deviceId !== undefined);
