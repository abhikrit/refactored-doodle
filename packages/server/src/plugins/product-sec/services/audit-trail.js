// PRD-SEC-004 the platform audit trail: the repository decorator, the ACL and store-mapping
// overrides, verification, export, replay and the compliance report.
//
// BR-SEC-010 to BR-SEC-015 are implemented in core/audit.js (the chain, the redaction list and
// the transaction rule); this service is what the SEC plugin registers and what the screens and
// IC-SEC-01 callers use.

import { createHash } from 'node:crypto';
import {
  auditAsync, auditTrailAsync, queryAsync, verifyAsync, replayEntityAsync, auditEventsAsync,
  signManifest, redact, AUDITED_ENTITIES, IGNORED_FIELDS, REDACTED_FIELDS, SECRET_SETTING_KEYS,
} from '../../../core/audit.js';
import { auditContext } from '../../../core/audit-context.js';
import {
  repository, plainRepository, registerRepositoryDecorator,
} from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { sendAsync, resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { messageGateways } from '@product/mocks';

// Every automatic entity change is AUD-SEC-001 in the SEC audit catalogue ("Entity inserted,
// updated or deleted (automatic)"), whatever the entity; the module-specific AUD ids are written
// by the modules themselves through IC-SEC-01.
const eventFor = () => 'AUD-SEC-001';

const changedFields = (before, after) => {
  const fields = [];
  for (const key of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    if (key === 'id') continue;
    const a = before?.[key];
    const b = after?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) fields.push(key);
  }
  return fields;
};

const onlyIgnored = (fields) => fields.length > 0 && fields.every((f) => IGNORED_FIELDS.includes(f));

const pick = (row, fields) => Object.fromEntries(fields.map((f) => [f, row?.[f] ?? null]));

/* ================================================= the IRepository<> decorator ========== */

let auditWriteFails = false;

/** Test seam for AC-SEC-004-01-06: make the audit insert fail. */
export function failAuditWrites(value) { auditWriteFails = value === true; }

/**
 * AC-SEC-004-01-01, 01-02, 01-05 and 01-06. The decorator wraps every repository method, reads
 * the original copy before a change, and writes one event per changed row. The entity change and
 * the audit insert are one transaction: if the audit write throws, the row is put back.
 */
export function registerDecoratorAsync() {
  return registerRepositoryDecorator((plain, entityName) => {
    if (!AUDITED_ENTITIES.includes(entityName)) return plain;

    const write = async ({
      action, entityId, before, after, fields,
    }) => {
      if (auditWriteFails) throw new Error('the audit trail is unavailable');
      if (auditContext().installing === true) return null;
      const isSetting = entityName === 'Setting';
      let name = after?.name ?? before?.name ?? null;
      if (isSetting && !name) {
        const row = await plainRepository('Setting').getByIdAsync(entityId);
        name = row?.name ?? null;
      }
      const secret = isSetting && SECRET_SETTING_KEYS.some((k) => String(name ?? '').toLowerCase().includes(k));
      // AC-SEC-004-05-03: the event records the key even when only the value changed
      const withKey = (values) => (isSetting && values ? { name, ...values } : values);
      return auditAsync({
        event: eventFor(),
        area: 'SEC',
        feature: 'PRD-SEC-004',
        entity: entityName,
        entityId,
        before: secret ? (before ? { name, value: '[redacted]' } : null) : withKey(before),
        after: secret ? (after ? { name, value: '[redacted]' } : null) : withKey(after),
        fields,
        amount: after?.orderTotal ?? after?.amount ?? before?.orderTotal ?? before?.amount ?? null,
        note: `${entityName} ${action}`,
      });
    };

    return {
      entityName,
      get table() { return plain.table; },
      getByIdAsync: (...a) => plain.getByIdAsync(...a),
      getAllAsync: (...a) => plain.getAllAsync(...a),
      getOneAsync: (...a) => plain.getOneAsync(...a),
      countAsync: (...a) => plain.countAsync(...a),
      truncateAsync: (...a) => plain.truncateAsync(...a),

      async insertAsync(entity) {
        const stored = await plain.insertAsync(entity);
        const reported = Object.keys(stored).filter((f) => !IGNORED_FIELDS.includes(f));
        try {
          await write({
            action: 'inserted', entityId: stored.id, before: null, after: redact(pick(stored, reported)), fields: reported,
          });
        } catch (err) {
          // BR-SEC-015: one transaction - the change is rolled back and the error is logged
          await plain.deleteAsync(stored.id);
          await plainRepository('Log').insertAsync({
            logLevel: 'Error',
            shortMessage: 'The audit trail refused an event, so the change was rolled back',
            fullMessage: `${entityName} insert: ${err.message}`,
            createdOnUtc: new Date().toISOString(),
          });
          throw err;
        }
        return stored;
      },

      async insertManyAsync(entities) {
        const out = [];
        for (const e of entities) out.push(await this.insertAsync(e));
        return out;
      },

      async updateAsync(entity) {
        // LoadOriginalCopyAsync: the values before the change
        const original = await plain.getByIdAsync(entity.id);
        const updated = await plain.updateAsync(entity);
        const fields = changedFields(original, updated);
        // AC-SEC-004-01-05: a field on the ignore list is not a change worth an event, and is
        // not recorded as one either
        const reported = fields.filter((f) => !IGNORED_FIELDS.includes(f));
        if (reported.length === 0) return updated;
        try {
          await write({
            action: 'updated',
            entityId: updated.id,
            before: pick(original, reported),
            after: pick(updated, reported),
            fields: reported,
          });
        } catch (err) {
          await plain.updateAsync(original);
          await plainRepository('Log').insertAsync({
            logLevel: 'Error',
            shortMessage: 'The audit trail refused an event, so the change was rolled back',
            fullMessage: `${entityName} update: ${err.message}`,
            createdOnUtc: new Date().toISOString(),
          });
          throw err;
        }
        return updated;
      },

      /**
       * AC-SEC-004-01-02: a delete by predicate reads the matching rows first and writes one
       * event with old values per row.
       */
      async deleteAsync(entityOrPredicate) {
        if (typeof entityOrPredicate === 'function') {
          const rows = await plain.getAllAsync(entityOrPredicate);
          for (const row of rows) {
            await plain.deleteAsync(row.id);
            try {
              await write({
                action: 'deleted', entityId: row.id, before: redact(row), after: null, fields: Object.keys(row),
              });
            } catch (err) {
              await plain.insertAsync(row);
              throw err;
            }
          }
          return { deleted: rows.length };
        }
        const id = entityOrPredicate?.id ?? entityOrPredicate;
        const row = await plain.getByIdAsync(id);
        await plain.deleteAsync(id);
        if (!row) return undefined;
        try {
          await write({
            action: 'deleted', entityId: row.id, before: redact(row), after: null, fields: Object.keys(row),
          });
        } catch (err) {
          await plain.insertAsync(row);
          throw err;
        }
        return undefined;
      },
    };
  });
}

/* ========================= AC-SEC-004-01-03: the ACL and store-mapping overrides ========= */

/**
 * BR-SEC-011: AclService.SaveAclAsync and StoreMappingService.SaveStoreMappingsAsync change the
 * SubjectToAcl and LimitedToStores flags through INopDataProvider, which the decorator never
 * sees, so SEC overrides these two virtual methods and writes the event itself.
 */
export async function saveAclAsync({
  entity, entityId, customerRoleIds, actor = null,
}) {
  const aclRepo = repository('AclRecord');
  const existing = await aclRepo.getAllAsync((r) => r.entityName === entity && r.entityId === Number(entityId));
  const before = {
    subjectToAcl: existing.length > 0,
    customerRoleIds: existing.map((r) => r.customerRoleId).sort(),
  };
  for (const row of existing) await plainRepository('AclRecord').deleteAsync(row.id);
  for (const customerRoleId of customerRoleIds ?? []) {
    await plainRepository('AclRecord').insertAsync({ entityName: entity, entityId: Number(entityId), customerRoleId });
  }
  const after = { subjectToAcl: (customerRoleIds ?? []).length > 0, customerRoleIds: [...(customerRoleIds ?? [])].sort() };
  const target = await repository(entity).getByIdAsync(entityId).catch(() => null);
  if (target) await plainRepository(entity).updateAsync({ ...target, subjectToAcl: after.subjectToAcl, limitedToCustomerRoles: after.customerRoleIds });
  const written = await auditAsync({
    event: 'AUD-SEC-001',
    area: 'SEC',
    feature: 'PRD-SEC-004',
    entity,
    entityId,
    actor,
    before,
    after,
    note: 'access control list changed',
  });
  return {
    ok: true, before, after, overrideOf: 'AclService.SaveAclAsync', sequence: written.sequence,
  };
}

export async function saveStoreMappingsAsync({
  entity, entityId, storeIds, actor = null,
}) {
  const mapRepo = plainRepository('StoreMapping');
  const existing = await mapRepo.getAllAsync((r) => r.entityName === entity && r.entityId === Number(entityId));
  const before = { limitedToStores: existing.length > 0, storeIds: existing.map((r) => r.storeId).sort() };
  for (const row of existing) await mapRepo.deleteAsync(row.id);
  for (const storeId of storeIds ?? []) {
    await mapRepo.insertAsync({ entityName: entity, entityId: Number(entityId), storeId });
  }
  const after = { limitedToStores: (storeIds ?? []).length > 0, storeIds: [...(storeIds ?? [])].sort() };
  const written = await auditAsync({
    event: 'AUD-SEC-001',
    area: 'SEC',
    feature: 'PRD-SEC-004',
    entity,
    entityId,
    actor,
    before,
    after,
    note: 'store mapping changed',
  });
  return {
    ok: true, before, after, overrideOf: 'StoreMappingService.SaveStoreMappingsAsync', sequence: written.sequence,
  };
}

/* ======================================= verification, export, replay and reports ======== */

/** AC-SEC-004-02-02: there is no edit and no delete, and the trail says so. */
export const writeRightsAsync = async () => ({
  insert: true,
  select: true,
  update: false,
  delete: false,
  editOrDeleteOffered: false,
  note: 'the application database login holds insert and select rights on the audit tables only (hosting checklist)',
});

/** AC-SEC-004-02-03: verification, with the officer alerted when the chain is broken. */
export async function verifyChainAsync({ fromSequence = 1, toSequence = null, storeId = 1 } = {}) {
  const result = await verifyAsync({ fromSequence, toSequence });
  if (result.result === 'Broken') {
    await auditAsync({
      event: 'AUD-SEC-003',
      area: 'SEC',
      feature: 'PRD-SEC-004',
      entity: 'AuditEntry',
      entityId: result.atSequence,
      outcome: 'rejected',
      after: { result: 'Broken', atSequence: result.atSequence, reason: result.reason },
      note: 'audit chain verification failed',
    });
    try {
      await sendAsync({
        event: 'Sec.ChainBroken',
        to: await getSettingAsync('sec.securityofficeremail', storeId, 'security@example.com'),
        channels: ['email', 'inapp'],
        tokens: { sequence: String(result.atSequence) },
        storeId,
        feature: 'PRD-SEC-004',
        gateways: messageGateways,
      });
    } catch { /* the result stands even if the alert fails */ }
    return {
      ...result, messageKey: 'Sec.ChainBroken', message: resource('Sec.ChainBroken'), officerAlerted: true, auditEvent: 'AUD-SEC-003',
    };
  }
  return result;
}

export const EXPORT_FORMATS = ['csv', 'json', 'xlsx'];

/** AC-SEC-004-03-02: the export, its manifest and its signature. */
export async function exportTrailAsync({ filter = {}, actor, by, storeId = 1 }) {
  if (!await authorizeAsync('Security.Core.AuditTrail.Export', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.AuditTrail.Export' };
  }
  const page = await queryAsync({ ...filter, pageSize: 100000 });
  const events = page.events;
  const header = 'sequence,occurredOnUtc,event,actor,entity,entityId,storeId,outcome,correlationId';
  const csv = [header, ...events.map((e) => [
    e.sequence, e.occurredOnUtc, e.event, e.actor, e.entity ?? '', e.entityId ?? '', e.storeId, e.outcome, e.correlationId ?? '',
  ].join(','))].join('\n');
  const json = JSON.stringify(events, null, 2);
  const manifest = {
    filter,
    eventCount: events.length,
    firstSequence: events[0]?.sequence ?? null,
    lastSequence: events[events.length - 1]?.sequence ?? null,
    firstHash: events[0]?.hash ?? null,
    lastHash: events[events.length - 1]?.hash ?? null,
    exportedBy: by,
    exportedOnUtc: new Date().toISOString(),
    formats: EXPORT_FORMATS,
    formatsProposed: true,
  };
  const signature = signManifest(manifest);
  const written = await auditAsync({
    event: 'AUD-SEC-002',
    area: 'SEC',
    feature: 'PRD-SEC-004',
    entity: 'AuditEntry',
    entityId: manifest.lastSequence,
    actor: by,
    after: { eventCount: events.length, firstSequence: manifest.firstSequence, lastSequence: manifest.lastSequence },
    note: 'audit trail exported',
  });
  return {
    ok: true,
    files: EXPORT_FORMATS.map((format) => ({
      name: `audit-trail.${format}`,
      format,
      contentType: format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      bytes: format === 'json' ? json.length : csv.length,
    })),
    manifest,
    signature,
    signatureAlgorithm: 'HMAC-SHA256',
    csv,
    messageKey: 'Sec.AuditExportReady',
    message: resource('Sec.AuditExportReady'),
    auditEvent: 'AUD-SEC-002',
    sequence: written.sequence,
    storeId,
  };
}

/** AC-SEC-004-04-02: the access of one user at a past time, rebuilt from the audited changes. */
export async function replayAccessAsync({ customerId, at }) {
  const customer = await repository('Customer').getByIdAsync(customerId);
  const events = (await auditEventsAsync())
    .filter((e) => e.occurredOnUtc <= at)
    .sort((a, b) => a.sequence - b.sequence);
  const idOf = String(customerId);
  const state = {
    roles: [],
    permissions: [],
    acl: [],
    storeMappings: [],
    scopes: [],
    delegations: [],
  };
  for (const e of events) {
    if (e.entity === 'Customer' && e.entityId === idOf && e.after?.roles) state.roles = e.after.roles;
    if (e.entity === 'PermissionRecordCustomerRoleMapping' && e.after?.systemName) {
      if (state.roles.includes(e.after.roleSystemName)) {
        if (e.before === null) state.permissions.push({ permission: e.after.systemName, role: e.after.roleSystemName });
        else if (e.after === null) {
          state.permissions = state.permissions.filter((p) => p.permission !== e.before.systemName);
        }
      }
    }
    if (e.entity === 'PermissionScope' && String(e.after?.customerId ?? e.before?.customerId) === idOf) {
      if (e.after) state.scopes.push({ dimension: e.after.dimension, value: e.after.value });
      else state.scopes = state.scopes.filter((s) => s.dimension !== e.before.dimension);
    }
    if (e.entity === 'Delegation' && (String(e.after?.toCustomerId ?? '') === idOf || String(e.after?.fromCustomerId ?? '') === idOf)) {
      state.delegations.push({ permission: e.after.permission, status: e.after.status ?? 'Active' });
    }
    if (e.after?.customerRoleIds) {
      if (e.after.subjectToAcl) state.acl.push({ entity: e.entity, entityId: e.entityId, customerRoleIds: e.after.customerRoleIds });
      if (e.after.storeIds) state.storeMappings.push({ entity: e.entity, entityId: e.entityId, storeIds: e.after.storeIds });
    }
  }
  if (!customer && state.roles.length === 0) {
    return { ok: false, message: 'there are no audited access changes for that user before that time' };
  }
  return {
    ok: true,
    customerId: Number(customerId),
    at,
    ...state,
    rebuiltFrom: 'the audit trail',
    eventsApplied: events.length,
  };
}

/** AC-SEC-004-05-01: the compliance report for a period. */
export async function complianceReportAsync({ from, to = new Date().toISOString(), storeId = 1 }) {
  const events = (await auditEventsAsync())
    .filter((e) => (!from || e.occurredOnUtc >= from) && e.occurredOnUtc <= to);
  const authEvents = (await plainRepository('AuthEvent').getAllAsync())
    .filter((e) => (!from || e.createdOnUtc >= from) && e.createdOnUtc <= to);
  const adminChanges = {};
  for (const e of events.filter((x) => x.actor && x.actor !== 'system')) {
    adminChanges[e.actor] = (adminChanges[e.actor] ?? 0) + 1;
  }
  const settingChanges = events.filter((e) => e.entity === 'Setting').map((e) => ({
    sequence: e.sequence,
    key: e.after?.name ?? e.before?.name ?? null,
    storeId: e.storeId,
    before: e.before?.value ?? null,
    after: e.after?.value ?? null,
    actor: e.actor,
    at: e.occurredOnUtc,
  }));
  const staffReads = events.filter((e) => e.event === 'AUD-IAM-010').map((e) => ({
    sequence: e.sequence, staff: e.actor, customerId: e.entityId, page: e.after?.page ?? null, at: e.occurredOnUtc,
  }));
  const report = {
    period: { from: from ?? null, to },
    logins: authEvents.filter((e) => e.type === 'login' && e.outcome === 'success').length,
    failedLogins: authEvents.filter((e) => e.outcome === 'failed').length,
    adminChangesByUser: Object.entries(adminChanges).map(([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count),
    settingChanges,
    staffReadAccess: staffReads,
    storeId,
  };
  const header = 'section,key,value';
  report.csv = [header,
    `logins,successful,${report.logins}`,
    `logins,failed,${report.failedLogins}`,
    ...report.adminChangesByUser.map((a) => `admin changes,${a.actor},${a.count}`),
    ...settingChanges.map((s) => `setting,${s.key},${JSON.stringify(s.after)}`),
    ...staffReads.map((s) => `staff read,${s.staff},${s.customerId}`),
  ].join('\n');
  report.exportable = true;
  return report;
}

/** The screen of AC-SEC-004-03-01, with the catalogue entry of each event id. */
export async function searchAsync(filter = {}) {
  const rows = await auditTrailAsync(filter);
  return {
    events: rows,
    total: rows.length,
    searchableBy: ['actor', 'entity', 'entityId', 'event', 'storeId', 'from', 'to', 'amount'],
    sqlRequired: false,
  };
}

export const chainStateAsync = async () => {
  const rows = (await auditEventsAsync()).slice().sort((a, b) => a.sequence - b.sequence);
  return {
    events: rows.length,
    firstSequence: rows[0]?.sequence ?? null,
    lastSequence: rows[rows.length - 1]?.sequence ?? null,
    lastHash: rows[rows.length - 1]?.hash ?? null,
    lockKey: 'sec-audit-chain',
    redactedFields: REDACTED_FIELDS,
    ignoredFields: IGNORED_FIELDS,
    auditedEntities: AUDITED_ENTITIES,
  };
};

export {
  auditAsync, queryAsync, replayEntityAsync, auditTrailAsync, auditContext, createHash,
};
