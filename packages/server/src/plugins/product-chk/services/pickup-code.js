// CHK-012 pickup code / QR.
//
// BR-CHK-016: a pickup code is single-use, bound to one sub-order and one outlet, stored only as
// a hash, and locked after the configured number of failed attempts. CHK-012 issues the code,
// checks it and counts attempts (IC-CHK-09); the LOG-012 handover step calls the check inside
// its shipment lock, stores the proof of collection, calls DeliverAsync and then marks the code
// used.
//
// SM-CHK-03: Issued -> Sent -> Used, or Locked after too many failures, or Revoked when the
// order is cancelled.

import { createHash, randomInt } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';

const codeRepo = () => repository('PickupCode');

export const CODE_STATE = {
  Issued: 'Issued', Sent: 'Sent', Used: 'Used', Locked: 'Locked', Revoked: 'Revoked',
};

export const METHOD = { Code: 'Code', QR: 'QR' };

const hashCode = (code) => createHash('sha256').update(String(code)).digest('hex');

/**
 * AC-CHK-012-01-01: only the identification methods the client enabled are offered. The key
 * catalogue holds chk.pickup.identification; no method is assumed.
 */
export async function identificationMethodsAsync({ storeId = 1 } = {}) {
  const enabled = await getSettingAsync('chk.pickup.identification', storeId, []);
  const list = (Array.isArray(enabled) ? enabled : [enabled]).map(String);
  const offered = Object.values(METHOD).filter((m) => list
    .some((x) => x.toLowerCase() === m.toLowerCase() || x.toLowerCase() === (m === METHOD.QR ? 'qr code' : 'order code')));
  return {
    offered,
    configured: list,
    choiceOffered: offered.length > 1,
    defaultMethod: offered[0] ?? null,
  };
}

/**
 * AC-CHK-012-01-02: a code the shopper could not guess, stored as a hash, state Issued.
 * The code itself is returned once, to be shown and sent; it is never stored in the clear.
 */
export async function issueAsync({
  order, pickupPointId, storeId = 1, method = null,
}) {
  const methods = await identificationMethodsAsync({ storeId });
  const chosen = method && methods.offered.includes(method) ? method : methods.defaultMethod ?? METHOD.Code;
  const code = String(randomInt(100000, 1000000));
  const limit = Number(await getSettingAsync('chk.pickup.failurelimit', storeId, 3));
  const row = await codeRepo().insertAsync({
    orderId: order.id,
    orderNumber: order.orderNumber,
    shipmentId: null,
    pickupPointId: pickupPointId ?? null,
    method: chosen,
    codeHash: hashCode(code),
    status: CODE_STATE.Issued,
    failedAttempts: 0,
    failureLimit: limit,
    issuedOnUtc: new Date().toISOString(),
    usedOnUtc: null,
    verifiedBy: null,
    // the fields the Session 0 screens already read
    used: false,
    locked: false,
  });
  await auditAsync({
    event: 'AUD-CHK-004',
    area: 'CHK',
    feature: 'PRD-CHK-012',
    entity: 'PickupCode',
    entityId: row.id,
    actor: 'placement',
    storeId,
    after: { status: CODE_STATE.Issued, orderNumber: order.orderNumber, method: chosen },
    note: 'a pickup code was issued for the collected sub-order',
  });
  return { code, method: chosen, row };
}

/**
 * AC-CHK-012-01-03: the code goes out when the shipment is ready for pickup, inside the native
 * ShipmentReadyForPickup.CustomerNotification by default (CHK supplies the token) or, where the
 * client turns it on, as the CHK event code Chk.PickupCode. State becomes Sent.
 */
export async function markSentAsync({ orderNumber, shipmentId = null, channel = null }) {
  const row = await codeRepo().getOneAsync((r) => r.orderNumber === orderNumber);
  if (!row) return { ok: false, message: 'no pickup code for that order' };
  if (row.status !== CODE_STATE.Issued && row.status !== CODE_STATE.Sent) {
    return { ok: false, status: row.status, message: `the code of ${orderNumber} is ${row.status}` };
  }
  const saved = await codeRepo().updateAsync({
    ...row, status: CODE_STATE.Sent, shipmentId: shipmentId ?? row.shipmentId, sentOnUtc: new Date().toISOString(), sentChannel: channel,
  });
  return { ok: true, status: saved.status, row: saved };
}

/** Which way the code travels: the native template's token, or the client's own event code. */
export async function deliveryRouteAsync({ storeId = 1 } = {}) {
  const separate = await getSettingAsync('chk.pickup.separatemessage', storeId, false);
  return separate === true
    ? {
      route: 'event code',
      eventCode: 'Chk.PickupCode',
      note: 'the client turned on the separate pickup-code message',
    }
    : {
      route: 'native template token',
      template: 'ShipmentReadyForPickup.CustomerNotification',
      token: 'pickup code',
      note: 'the native ready-for-pickup message carries the code',
    };
}

/* ======================================================= IC-CHK-09 Verify / MarkUsed === */

/**
 * AC-CHK-012-02-01 to 02-04. Called by the LOG-012 handover step inside its shipment lock; it
 * also counts the attempts there, so two counters at two counters cannot race.
 */
export async function verifyAsync({
  orderNumber, code, pickupPointId = null, verifiedBy = null, storeId = 1,
}) {
  const row = await codeRepo().getOneAsync((r) => r.orderNumber === orderNumber);
  if (!row) {
    return {
      ok: false, verdict: 'Invalid', messageKey: 'Chk.PickupCodeInvalid', message: resource('Chk.PickupCodeInvalid'),
    };
  }
  if (row.status === CODE_STATE.Locked) {
    return {
      ok: false, verdict: 'Locked', messageKey: 'Chk.PickupCodeLocked', message: resource('Chk.PickupCodeLocked'), failedAttempts: row.failedAttempts,
    };
  }
  if (row.status === CODE_STATE.Used) {
    return {
      ok: false, verdict: 'Used', messageKey: 'Chk.PickupCodeUsed', message: resource('Chk.PickupCodeUsed'),
    };
  }
  if (row.status === CODE_STATE.Revoked) {
    return {
      ok: false, verdict: 'Invalid', messageKey: 'Chk.PickupCodeInvalid', message: resource('Chk.PickupCodeInvalid'), revoked: true,
    };
  }
  // the code is bound to one outlet
  if (pickupPointId != null && Number(row.pickupPointId) !== Number(pickupPointId)) {
    return {
      ok: false,
      verdict: 'Invalid',
      messageKey: 'Chk.PickupCodeInvalid',
      message: resource('Chk.PickupCodeInvalid'),
      boundToOutlet: row.pickupPointId,
      attemptCounted: false,
    };
  }
  if (row.codeHash !== hashCode(code)) {
    const failedAttempts = Number(row.failedAttempts ?? 0) + 1;
    const locked = failedAttempts >= Number(row.failureLimit ?? 3);
    const saved = await codeRepo().updateAsync({
      ...row,
      failedAttempts,
      status: locked ? CODE_STATE.Locked : row.status,
      locked,
    });
    if (locked) {
      await auditAsync({
        event: 'AUD-CHK-004',
        area: 'CHK',
        feature: 'PRD-CHK-012',
        entity: 'PickupCode',
        entityId: row.id,
        actor: verifiedBy ?? 'outlet',
        storeId,
        before: { status: row.status, failedAttempts: row.failedAttempts },
        after: { status: CODE_STATE.Locked, failedAttempts },
        note: 'the pickup code was locked after too many wrong codes',
      });
    }
    return {
      ok: false,
      verdict: locked ? 'Locked' : 'Invalid',
      messageKey: locked ? 'Chk.PickupCodeLocked' : 'Chk.PickupCodeInvalid',
      message: locked ? resource('Chk.PickupCodeLocked') : resource('Chk.PickupCodeInvalid'),
      failedAttempts: saved.failedAttempts,
      failureLimit: saved.failureLimit,
    };
  }
  return {
    ok: true, verdict: 'Valid', row, method: row.method,
  };
}

/** MarkUsed: LOG-012 calls it after DeliverAsync. State becomes Used (AUD-CHK-004). */
export async function markUsedAsync({ orderNumber, verifiedBy = null, storeId = 1 }) {
  const row = await codeRepo().getOneAsync((r) => r.orderNumber === orderNumber);
  if (!row) return { ok: false, message: 'no pickup code for that order' };
  if (row.status === CODE_STATE.Used) return { ok: true, alreadyUsed: true, status: row.status };
  const saved = await codeRepo().updateAsync({
    ...row,
    status: CODE_STATE.Used,
    used: true,
    usedOnUtc: new Date().toISOString(),
    verifiedBy,
  });
  await auditAsync({
    event: 'AUD-CHK-004',
    area: 'CHK',
    feature: 'PRD-CHK-012',
    entity: 'PickupCode',
    entityId: row.id,
    actor: verifiedBy ?? 'outlet',
    storeId,
    before: { status: row.status },
    after: { status: CODE_STATE.Used },
    note: 'the parcel was handed over and the pickup code was used',
  });
  return { ok: true, status: saved.status, row: saved };
}

/** SM-CHK-03: a cancelled order revokes its code (the CHK-012 cancellation participant). */
export async function revokeAsync({ order }) {
  if (!order) return { ok: true, revoked: 0 };
  const rows = await codeRepo().getAllAsync((r) => Number(r.orderId) === Number(order.id)
    && [CODE_STATE.Issued, CODE_STATE.Sent, CODE_STATE.Locked].includes(r.status));
  for (const row of rows) {
    await codeRepo().updateAsync({ ...row, status: CODE_STATE.Revoked, revokedOnUtc: new Date().toISOString() });
  }
  return { ok: true, revoked: rows.length };
}

/** What My account shows the shopper for a collected order. */
export async function codeForOrderAsync({ orderNumber }) {
  const row = await codeRepo().getOneAsync((r) => r.orderNumber === orderNumber);
  if (!row) return null;
  const point = row.pickupPointId ? await repository('StorePickupPoint').getByIdAsync(row.pickupPointId) : null;
  return {
    orderNumber: row.orderNumber,
    method: row.method,
    status: row.status,
    issuedOnUtc: row.issuedOnUtc,
    sentOnUtc: row.sentOnUtc ?? null,
    usedOnUtc: row.usedOnUtc,
    failedAttempts: row.failedAttempts,
    failureLimit: row.failureLimit,
    outlet: point ? { id: point.id, name: point.name, city: point.city } : null,
    // the code itself is only in the message that was sent: the store keeps a hash
    codeStored: 'hash only',
  };
}
