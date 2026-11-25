// Platform audit trail - PRD-SEC-004. The one trail every module writes to (CLAUDE.md:
// "audit through SEC-004"), contract IC-SEC-01.
//
// BR-SEC-010: an audited entity change records actor (and the original customer when someone is
// acting for them), IP address, UTC time, store, entity, entity id, old values and new values.
// BR-SEC-012: a field on the redaction list records its name and the value "[redacted]".
// BR-SEC-013: events are appended under ILocker key 'sec-audit-chain'; each one carries the next
// sequence number and a hash over its canonical content and the hash before it.
// BR-SEC-015: the entity change and the audit insert are one transaction - if the audit write
// fails the change is rolled back.
// The trail is append-only: no screen and no service here edits or deletes an event.

import { createHash, createHmac } from 'node:crypto';
import { plainRepository } from './repository.js';
import { withLockAsync } from './locker.js';
import { auditContext } from './audit-context.js';

const auditRepo = () => plainRepository('AuditEntry');

export const CHAIN_LOCK_KEY = 'sec-audit-chain';

/* ------------------------------------------------------- the lists of BR-SEC-012 and 01-05 */

/** BR-SEC-012: never written in clear, whatever the caller passes. */
export const REDACTED_FIELDS = [
  'password', 'passwordHash', 'passwordSalt', 'salt', 'codeHash', 'secret', 'secretKey',
  'apiKey', 'token', 'refreshToken', 'privateKey', 'passkeyPublicKey', 'securityAnswerHash',
  'cardNumber', 'cvv', 'pin',
];

/** AC-SEC-004-01-05: a change to these alone is not worth an event. */
export const IGNORED_FIELDS = [
  'lastActivityUtc', 'lastActivityDateUtc', 'updatedOnUtc', 'lastRequestOnUtc', 'lastIpAddress',
  'draftUpdatedOnUtc', 'lastVisitedPage',
];

/** The entities whose every change is audited through the repository decorator. */
export const AUDITED_ENTITIES = [
  'Customer', 'CustomerRole', 'PermissionRecordCustomerRoleMapping', 'Address', 'Setting',
  'Order', 'OrderItem', 'Shipment', 'PaymentTransaction', 'Product', 'PriceList', 'Vendor',
  'Company', 'CompanyMember', 'CostCentre', 'TradeApplication', 'PolicyAcceptance',
  'PrivacyRequest', 'VerificationCase', 'FraudRule', 'ApprovalItem', 'Delegation',
  'PermissionScope', 'StoreMapping', 'AclRecord', 'GdprConsent', 'CustomerConsent',
];

export const SECRET_SETTING_KEYS = [
  'secret', 'password', 'apikey', 'token', 'privatekey', 'consumersecret', 'passphrase', 'credential',
];

const isSecretSettingName = (name) => SECRET_SETTING_KEYS.some((k) => String(name ?? '').toLowerCase().includes(k));

export function redact(values) {
  if (!values || typeof values !== 'object') return values;
  const out = {};
  for (const [field, value] of Object.entries(values)) {
    out[field] = REDACTED_FIELDS.some((f) => f.toLowerCase() === field.toLowerCase())
      ? '[redacted]'
      : value;
  }
  return out;
}

/* ------------------------------------------------------------------- the hash chain ----- */

const canonical = (event) => JSON.stringify({
  sequence: event.sequence,
  event: event.event,
  entity: event.entity,
  entityId: event.entityId,
  actor: event.actor,
  before: event.before,
  after: event.after,
  storeId: event.storeId,
  occurredOnUtc: event.occurredOnUtc,
});

export const hashOf = (event, previousHash) => createHash('sha256')
  .update(`${previousHash ?? ''}|${canonical(event)}`)
  .digest('hex');

/** The signing key of an export manifest. Not stated in source, so it is a setting. */
let manifestKey = null;
export function setManifestKey(key) { manifestKey = key; }
export const signManifest = (manifest) => createHmac('sha256', manifestKey ?? 'prototype-manifest-key')
  .update(JSON.stringify(manifest))
  .digest('hex');

/* ----------------------------------------------------------------- IC-SEC-01 WriteAsync -- */

/**
 * Write one event. Keeps the shape every module already calls it with, and adds the sequence
 * number, the chain hash and the correlation id of the request (AC-SEC-004-06-01).
 */
export async function auditAsync({
  event,
  area,
  feature,
  entity,
  entityId,
  actor,
  actorRole,
  before = null,
  after = null,
  storeId,
  outcome = 'success',
  note = '',
  reason = null,
  correlationId = null,
  amount = null,
  fields = null,
}) {
  const context = auditContext();
  if (!event) throw new Error('IC-SEC-01: the event id is required (AUD-<AREA>-nnn)');
  return withLockAsync(CHAIN_LOCK_KEY, async () => {
    const last = (await auditRepo().getAllAsync()).reduce(
      (acc, row) => ((row.sequence ?? 0) > (acc?.sequence ?? 0) ? row : acc),
      null,
    );
    const row = {
      sequence: (last?.sequence ?? 0) + 1,
      event,
      area: area ?? null,
      feature: feature ?? null,
      entity: entity ?? null,
      entityId: entityId == null ? null : String(entityId),
      actor: actor ?? context.actor ?? 'system',
      actorRole: actorRole ?? context.actorRole ?? 'System',
      originalActor: context.originalActor ?? null,
      ipAddress: context.ipAddress ?? null,
      before: redact(before),
      after: redact(after),
      fields: fields ?? (after && typeof after === 'object' ? Object.keys(after) : null),
      amount,
      storeId: storeId ?? context.storeId ?? 1,
      outcome,
      note,
      reason: reason ?? context.reason ?? null,
      correlationId: correlationId ?? context.correlationId ?? null,
      occurredOnUtc: new Date().toISOString(),
    };
    row.previousHash = last?.hash ?? null;
    row.hash = hashOf(row, row.previousHash);
    return auditRepo().insertAsync(row);
  });
}

/* ------------------------------------------------------------------ IC-SEC-01 QueryAsync - */

const matches = (row, filter) => (!filter.area || row.area === filter.area)
  && (!filter.event || row.event === filter.event)
  && (!filter.entity || row.entity === filter.entity)
  && (!filter.entityId || row.entityId === String(filter.entityId))
  && (!filter.actor || row.actor === filter.actor)
  && (!filter.correlationId || row.correlationId === filter.correlationId)
  && (!filter.storeId || Number(row.storeId) === Number(filter.storeId))
  && (filter.amount === undefined || filter.amount === null || Number(row.amount) === Number(filter.amount))
  && (!filter.from || row.occurredOnUtc >= filter.from)
  && (!filter.to || row.occurredOnUtc <= filter.to)
  && (filter.afterSequence === undefined || filter.afterSequence === null
    || (row.sequence ?? 0) > Number(filter.afterSequence));

/** Newest first - the trail screen of AC-SEC-004-03-01. */
export async function auditTrailAsync(filter = {}) {
  const rows = await auditRepo().getAllAsync((r) => matches(r, filter));
  return rows.slice().sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0));
}

/** Sequence order, one page at a time - IC-SEC-01 QueryAsync (AC-SEC-004-06-02). */
export async function queryAsync({ pageSize = 100, ...filter } = {}) {
  const rows = (await auditRepo().getAllAsync((r) => matches(r, filter)))
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const page = rows.slice(0, Number(pageSize));
  return {
    events: page,
    lastSequence: page.length ? page[page.length - 1].sequence : (filter.afterSequence ?? 0),
    returned: page.length,
    more: rows.length > page.length,
    inSequenceOrder: true,
  };
}

/* -------------------------------------------------------------- IC-SEC-01 VerifyAsync ---- */

/** AC-SEC-004-02-03: Broken at the first bad sequence number. */
export async function verifyAsync({ fromSequence = 1, toSequence = null } = {}) {
  const rows = (await auditRepo().getAllAsync())
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .filter((r) => r.sequence >= Number(fromSequence)
      && (toSequence === null || r.sequence <= Number(toSequence)));
  let previousHash = rows.length ? rows[0].previousHash : null;
  let expectedSequence = rows.length ? rows[0].sequence : Number(fromSequence);
  for (const row of rows) {
    if (row.sequence !== expectedSequence) {
      return {
        result: 'Broken', atSequence: expectedSequence, reason: 'a sequence number is missing or out of order', checked: rows.length,
      };
    }
    if ((row.previousHash ?? null) !== (previousHash ?? null)) {
      return {
        result: 'Broken', atSequence: row.sequence, reason: 'the event does not follow the one before it', checked: rows.length,
      };
    }
    if (row.hash !== hashOf(row, row.previousHash)) {
      return {
        result: 'Broken', atSequence: row.sequence, reason: 'the content of the event does not match its hash', checked: rows.length,
      };
    }
    previousHash = row.hash;
    expectedSequence += 1;
  }
  return {
    result: 'Verified',
    checked: rows.length,
    firstSequence: rows[0]?.sequence ?? null,
    lastSequence: rows[rows.length - 1]?.sequence ?? null,
    firstHash: rows[0]?.hash ?? null,
    lastHash: rows[rows.length - 1]?.hash ?? null,
  };
}

/* -------------------------------------------------------------- IC-SEC-01 ReplayAsync ---- */

/** AC-SEC-004-04-01: the field values of an entity at a past time, with the event that set each. */
export async function replayEntityAsync({ entity, entityId, at }) {
  const rows = (await auditRepo().getAllAsync((r) => r.entity === entity
    && r.entityId === String(entityId)
    && r.occurredOnUtc <= at))
    .slice()
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  if (rows.length === 0) return { ok: false, message: 'there are no events for that entity before that time' };
  const values = {};
  const setBy = {};
  for (const row of rows) {
    for (const [field, value] of Object.entries(row.after ?? {})) {
      values[field] = value;
      setBy[field] = {
        sequence: row.sequence, event: row.event, actor: row.actor, at: row.occurredOnUtc,
      };
    }
  }
  return {
    ok: true, entity, entityId: String(entityId), at, values, setBy, eventsApplied: rows.length,
  };
}

export const auditEventsAsync = () => auditRepo().getAllAsync();
