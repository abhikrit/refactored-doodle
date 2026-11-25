// PRD-PLT-020 Data retention and archival.
//
// IC-PLT-08: a module registers a record type (code, owning module, entity, the date field that
// starts the period, the allowed actions and a hold check). PLT-020 holds one rule per type
// (period, unit, action Archive / Anonymise / Delete, layer country or client, active flag) and
// runs them in batches.
// BR-PLT-050: Delete removes rows physically through the repository predicate delete, because the
// per-entity delete of a soft-deletable entity (Order, Customer, Product) only sets Deleted;
// Archive verifies the archive copy before removal; a record under legal hold (DOC-002) or linked
// to an open payment, refund, dispute or receivable is skipped and counted as held.
// BR-PLT-051: every period is "Not stated in source", so a rule has no hidden default.
// AC-PLT-020-01-09: the SEC-004 audit trail is retained by whole closed segments only.

import { createHash } from 'node:crypto';
import { plainRepository, repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { providers } from '../../../core/providers.js';
import { withLockAsync } from '../../../core/locker.js';
import { saveSettingThroughControlAsync } from './change-control.js';

export const RETENTION_LOCK_KEY = 'plt-retention-run';
export const ACTIONS = ['Archive', 'Anonymise', 'Delete'];
export const UNITS = ['days', 'months', 'years'];
export const LAYERS = ['country', 'client'];
export const PERIOD_NOT_STATED = 'Not stated in source';

/** The entities whose per-entity delete only sets Deleted (AC-PLT-020-01-02). */
export const SOFT_DELETABLE = ['Order', 'Customer', 'Product', 'Category', 'Manufacturer', 'Vendor'];

const ruleRepo = () => plainRepository('RetentionRule');
const runRepo = () => plainRepository('RetentionRun');
const typeRepo = () => plainRepository('RetentionRecordType');
const archiveRepo = () => plainRepository('ArchiveEntry');

/* ===================================================== IC-PLT-08 record types ========== */

const registered = new Map();

export function registerRecordTypeAsync(descriptor) {
  const {
    code, owningModule, entity, dateField, allowedActions = ACTIONS, holdCheck = null,
    personalData = false, note = null, segmentsOnly = false, activeAndArchivePeriods = false,
    anonymiseFields = [], moduleBuilt = true,
  } = descriptor;
  if (!code || !owningModule) throw new Error('IC-PLT-08: a record type needs a code and an owning module');
  if (registered.has(code) && registered.get(code).owningModule !== owningModule) {
    throw new Error(`IC-PLT-08: record type ${code} is already registered by ${registered.get(code).owningModule}`);
  }
  for (const action of allowedActions) {
    if (!ACTIONS.includes(action)) throw new Error(`IC-PLT-08: ${action} is not one of ${ACTIONS.join(', ')}`);
  }
  registered.set(code, {
    code,
    owningModule,
    entity,
    dateField,
    allowedActions,
    holdCheck,
    holdCheckName: holdCheck ? (descriptor.holdCheckName ?? `${code} hold check`) : null,
    personalData: personalData === true,
    segmentsOnly: segmentsOnly === true,
    activeAndArchivePeriods: activeAndArchivePeriods === true,
    anonymiseFields,
    moduleBuilt: moduleBuilt !== false,
    note,
  });
  return registered.get(code);
}

/** Descriptors registered directly plus those supplied through the IC-PLT-08 contract. */
async function allTypesAsync() {
  for (const provider of providers('IC-PLT-08')) {
    try {
      const descriptor = await provider.fn();
      for (const one of Array.isArray(descriptor) ? descriptor : [descriptor]) {
        if (one && !registered.has(one.code)) registerRecordTypeAsync({ ...one, owningModule: one.owningModule ?? provider.area });
      }
    } catch { /* a module that cannot describe its types does not stop the engine */ }
  }
  return [...registered.values()];
}

export async function recordTypesAsync() {
  const types = await allTypesAsync();
  for (const type of types) {
    const row = await typeRepo().getOneAsync((t) => t.code === type.code);
    const stored = {
      code: type.code,
      owningModule: type.owningModule,
      entityName: type.entity,
      dateField: type.dateField,
      allowedActions: type.allowedActions,
      holdCheckName: type.holdCheckName,
    };
    if (row) await typeRepo().updateAsync({ ...row, ...stored });
    else await typeRepo().insertAsync(stored);
  }
  return types.map(({ holdCheck, ...rest }) => ({ ...rest, hasHoldCheck: typeof holdCheck === 'function' }));
}

export const recordTypeAsync = async (code) => (await allTypesAsync()).find((t) => t.code === code) ?? null;

/* ============================================================== the rules ============== */

/**
 * AC-PLT-020-01-05: a rule for logs or inactive customers also sets the native setting the
 * maintenance task reads, so there is one source of the value. AC-PLT-020-01-06: the change is
 * recorded, and a controlled key follows PRD-PLT-004.
 */
export const NATIVE_SETTING_FOR = {
  logs: { key: 'commonsettings.clearlogolderthandays', unit: 'days', task: 'ClearLogTask' },
  'iam.inactivecustomers': { key: 'gdprsettings.deleteinactivecustomersaftermonths', unit: 'months', task: 'DeleteInactiveCustomersTask' },
};
export const NATIVE_MAINTENANCE_TASKS = ['ClearLogTask', 'DeleteGuestsTask', 'DeleteInactiveCustomersTask'];

const inDays = (period, unit) => {
  if (unit === 'days') return Number(period);
  if (unit === 'months') return Number(period) * 30;
  return Number(period) * 365;
};

export async function saveRuleAsync({
  recordType, period, unit = 'days', action, layer = 'client', isActive = true,
  archivePeriod = null, archiveUnit = null, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Platform.Core.Retention.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Retention.CreateEditDelete' };
  }
  const type = await recordTypeAsync(recordType);
  if (!type) return { ok: false, message: `no record type ${recordType} is registered (IC-PLT-08)` };
  if (!ACTIONS.includes(action)) return { ok: false, message: `an action is one of ${ACTIONS.join(', ')}` };
  if (!type.allowedActions.includes(action)) {
    return { ok: false, message: `${recordType} allows ${type.allowedActions.join(', ')}`, allowedActions: type.allowedActions };
  }
  if (!UNITS.includes(unit)) return { ok: false, message: `a unit is one of ${UNITS.join(', ')}` };
  if (!LAYERS.includes(layer)) return { ok: false, message: `a layer is ${LAYERS.join(' or ')}` };
  if (period === undefined || period === null || Number(period) <= 0) {
    return { ok: false, message: 'a period is required; every period is "Not stated in source" (BR-PLT-051)', rule: 'BR-PLT-051' };
  }

  const existing = await ruleRepo().getOneAsync((r) => r.recordType === recordType);
  const before = existing
    ? {
      period: existing.period, unit: existing.unit, action: existing.action, layer: existing.layer, isActive: existing.isActive,
    }
    : null;
  const row = {
    recordType,
    owningModule: type.owningModule,
    period: Number(period),
    unit,
    action,
    layer,
    isActive: isActive !== false,
    archivePeriod: archivePeriod === null ? null : Number(archivePeriod),
    archiveUnit: archiveUnit ?? (archivePeriod === null ? null : unit),
    updatedBy: actor?.email ?? null,
  };
  const saved = existing ? await ruleRepo().updateAsync({ ...existing, ...row }) : await ruleRepo().insertAsync(row);

  // one source of the value: the native maintenance setting is set from the rule
  let nativeSetting = null;
  const native = NATIVE_SETTING_FOR[recordType];
  if (native) {
    const value = native.unit === unit ? Number(period) : Math.round(inDays(period, unit) / (native.unit === 'months' ? 30 : 1));
    const write = await saveSettingThroughControlAsync({
      key: native.key, value, storeId: 0, actor: actor?.email ?? null, reason: `set from the retention rule for ${recordType}`,
    });
    nativeSetting = {
      key: native.key,
      value,
      task: native.task,
      written: write.written === true,
      changeControlled: write.changeControlled === true,
      messageKey: write.messageKey ?? null,
      changeSetId: write.changeSet?.id ?? null,
      followsChangeControl: write.changeControlled === true ? 'PRD-PLT-004' : null,
    };
  }

  await auditAsync({
    event: 'AUD-PLT-009',
    area: 'PLT',
    feature: 'PRD-PLT-020',
    entity: 'RetentionRule',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before,
    after: {
      period: saved.period, unit: saved.unit, action: saved.action, layer: saved.layer, isActive: saved.isActive,
    },
    storeId,
    note: existing ? 'retention rule changed' : 'retention rule created',
  });
  return {
    ok: true, rule: saved, nativeSetting, recorded: true, auditEvent: 'AUD-PLT-009',
  };
}

export const rulesAsync = () => ruleRepo().getAllAsync();

/** AC-PLT-020-01-07: the rules screen - every registered type, with its rule if it has one. */
export async function rulesScreenAsync() {
  const types = await recordTypesAsync();
  const rules = await rulesAsync();
  return {
    rows: types.map((type) => {
      const rule = rules.find((r) => r.recordType === type.code) ?? null;
      return {
        ...type,
        rule,
        period: rule ? `${rule.period} ${rule.unit}` : PERIOD_NOT_STATED,
        ruleCanBeSet: true,
      };
    }),
    contract: 'IC-PLT-08',
    actions: ACTIONS,
    layers: LAYERS,
    periodNote: 'BR-PLT-051: every period is "Not stated in source"; a rule has no hidden default',
    nativeMaintenanceTasks: NATIVE_MAINTENANCE_TASKS,
  };
}

/* ============================================================== the hold checks ======== */

/**
 * BR-PLT-050: a record linked to an open payment, refund, dispute or receivable is held,
 * whatever its own module says, and the type's own hold check (a DOC-002 legal hold, an open RET
 * case, a legal-hold flag) is asked as well (AC-PLT-020-01-04 and 01-08).
 */
export async function holdReasonAsync(type, row) {
  if (row?.legalHold === true) return 'a legal hold (PRD-DOC-002)';
  if (type.holdCheck) {
    const verdict = await type.holdCheck(row);
    if (verdict === true) return type.holdCheckName ?? `${type.code} hold check`;
    if (verdict && verdict.held === true) return verdict.reason ?? (type.holdCheckName ?? `${type.code} hold check`);
  }
  const orderId = row?.orderId ?? (type.entity === 'Order' ? row?.id : null);
  if (orderId) {
    const payments = await repository('PaymentTransaction').getAllAsync((p) => Number(p.orderId) === Number(orderId));
    if (payments.some((p) => ['Pending', 'Authorised', 'Authorized', 'RefundPending', 'Disputed'].includes(p.status))) {
      return 'an open payment';
    }
    const returns = await repository('ReturnRequest').getAllAsync((r) => Number(r.orderId) === Number(orderId));
    if (returns.some((r) => !['Closed', 'Cancelled', 'Refunded'].includes(r.status))) return 'an open refund or dispute';
    const order = await repository('Order').getByIdAsync(orderId);
    if (order && Number(order.outstandingAmount ?? 0) > 0) return 'an open receivable';
  }
  return null;
}

/* ================================================================== the run ============ */

const checksumOf = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);

const olderThan = (row, type, days) => {
  const value = row?.[type.dateField];
  if (!value) return false;
  return (Date.now() - new Date(value).getTime()) / 86400000 > days;
};

/** AC-PLT-020-01-03: the archive copy is written with a manifest and checksum, and verified. */
async function archiveBatchAsync({ type, rows, run }) {
  const manifest = {
    recordType: type.code,
    entity: type.entity,
    count: rows.length,
    ids: rows.map((r) => r.id),
    runId: run.id,
    writtenOnUtc: new Date().toISOString(),
  };
  const entry = await archiveRepo().insertAsync({
    recordType: type.code,
    entity: type.entity,
    manifest,
    checksum: checksumOf(rows),
    rows,
    verified: false,
    searchableByStaff: true,
  });
  // verify the copy before anything is removed from the live store
  const stored = await archiveRepo().getByIdAsync(entry.id);
  const verified = stored.checksum === checksumOf(stored.rows) && stored.rows.length === manifest.count;
  await archiveRepo().updateAsync({ ...stored, verified });
  return { entry: { ...stored, verified }, verified };
}

/**
 * AC-PLT-020-01-01: records older than the period are processed by the action in batches, and the
 * counts per type and action are written to the retention run log (AUD-PLT-009).
 */
export async function runRetentionAsync({
  actor = null, batchSize = 100, recordType = null, dryRun = false, storeId = 1,
} = {}) {
  const rules = (await rulesAsync()).filter((r) => r.isActive !== false && (!recordType || r.recordType === recordType));
  const types = await allTypesAsync();

  return withLockAsync(RETENTION_LOCK_KEY, async () => {
    const run = await runRepo().insertAsync({
      startedOnUtc: new Date().toISOString(),
      startedBy: actor?.email ?? actor ?? 'system',
      status: 'Running',
      dryRun: dryRun === true,
      batchSize,
      counts: [],
    });
    const counts = [];
    for (const rule of rules) {
      const type = types.find((t) => t.code === rule.recordType);
      if (!type) continue;
      const row = {
        recordType: rule.recordType,
        owningModule: type.owningModule,
        action: rule.action,
        processed: 0,
        archived: 0,
        anonymised: 0,
        deleted: 0,
        held: 0,
        batches: 0,
        heldReasons: [],
        skipped: null,
      };
      if (type.moduleBuilt === false) {
        row.skipped = `the ${type.owningModule} module is not built in this prototype, so there are no records yet`;
        counts.push(row);
        continue;
      }
      if (type.segmentsOnly === true) {
        // AC-PLT-020-01-09: whole closed segments only, never single events
        const { segmentsAsync, segmentEventsAsync, removeSegmentAsync } = await import('../../product-sec/services/audit-trail.js');
        const days = inDays(rule.period, rule.unit);
        const segments = (await segmentsAsync()).filter((s) => s.status === 'Closed'
          && (Date.now() - new Date(s.closedOnUtc).getTime()) / 86400000 > days);
        row.wholeSegmentsOnly = true;
        row.singleEventsTouched = 0;
        for (const segment of segments) {
          const found = await segmentEventsAsync(segment.number);
          row.processed += found.events.length;
          row.batches += 1;
          if (dryRun === true) continue;
          let archived = false;
          if (rule.action === 'Archive') {
            const copy = await archiveBatchAsync({ type, rows: found.events, run });
            if (copy.verified !== true) { row.held += found.events.length; continue; }
            archived = true;
            row.archived += found.events.length;
          }
          const removal = await removeSegmentAsync({ number: segment.number, actor: actor?.email ?? null, archived });
          if (removal.ok === true && rule.action === 'Delete') row.deleted += removal.eventsRemoved;
          row.checkpointKept = true;
        }
        counts.push(row);
        continue;
      }

      const days = inDays(rule.period, rule.unit);
      const candidates = (await repository(type.entity).getAllAsync((r) => olderThan(r, type, days)));
      const due = [];
      for (const candidate of candidates) {
        const reason = await holdReasonAsync(type, candidate);
        if (reason) {
          row.held += 1;
          if (!row.heldReasons.includes(reason)) row.heldReasons.push(reason);
          continue;
        }
        due.push(candidate);
      }
      for (let i = 0; i < due.length; i += batchSize) {
        const batch = due.slice(i, i + batchSize);
        row.batches += 1;
        row.processed += batch.length;
        if (dryRun === true) continue;
        if (rule.action === 'Archive') {
          const copy = await archiveBatchAsync({ type, rows: batch, run });
          if (copy.verified !== true) {
            row.held += batch.length;
            row.processed -= batch.length;
            continue;
          }
          const ids = new Set(batch.map((r) => Number(r.id)));
          await plainRepository(type.entity).deleteManyAsync((r) => ids.has(Number(r.id)));
          row.archived += batch.length;
          row.archiveVerifiedBeforeRemoval = true;
        } else if (rule.action === 'Anonymise') {
          for (const record of batch) {
            const fields = Object.fromEntries((type.anonymiseFields ?? []).map((f) => [f, 'anonymised']));
            await plainRepository(type.entity).updateAsync({
              ...record, ...fields, anonymisedOnUtc: new Date().toISOString(),
            });
          }
          row.anonymised += batch.length;
        } else {
          const ids = new Set(batch.map((r) => Number(r.id)));
          await plainRepository(type.entity).deleteManyAsync((r) => ids.has(Number(r.id)));
          row.deleted += batch.length;
          row.physicalRemoval = true;
          row.removedThrough = 'the repository predicate delete';
          row.softDeletableEntity = SOFT_DELETABLE.includes(type.entity);
        }
      }
      counts.push(row);
    }

    const finished = await runRepo().updateAsync({
      ...run,
      status: 'Completed',
      finishedOnUtc: new Date().toISOString(),
      counts,
      processed: counts.reduce((s, c) => s + c.processed, 0),
      archived: counts.reduce((s, c) => s + c.archived, 0),
      anonymised: counts.reduce((s, c) => s + c.anonymised, 0),
      deleted: counts.reduce((s, c) => s + c.deleted, 0),
      held: counts.reduce((s, c) => s + c.held, 0),
    });
    await auditAsync({
      event: 'AUD-PLT-009',
      area: 'PLT',
      feature: 'PRD-PLT-020',
      entity: 'RetentionRun',
      entityId: finished.id,
      actor: actor?.email ?? actor ?? 'system',
      after: {
        counts: counts.map((c) => ({
          recordType: c.recordType, action: c.action, processed: c.processed, archived: c.archived, anonymised: c.anonymised, deleted: c.deleted, held: c.held,
        })),
      },
      storeId,
      note: 'retention run',
    });
    return {
      ok: true,
      run: finished,
      counts,
      lockKey: RETENTION_LOCK_KEY,
      auditEvent: 'AUD-PLT-009',
      rule: 'BR-PLT-050',
    };
  });
}

export const runsAsync = () => runRepo().getAllAsync();

/** AC-PLT-020-02-02: the archive stays searchable by staff. */
export async function archiveAsync({ recordType = null, requester = null } = {}) {
  if (requester && !await authorizeAsync('Platform.Core.Retention.CreateEditDelete', requester)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Retention.CreateEditDelete' };
  }
  const rows = await archiveRepo().getAllAsync((a) => !recordType || a.recordType === recordType);
  return {
    ok: true,
    entries: rows.map((a) => ({
      id: a.id,
      recordType: a.recordType,
      entity: a.entity,
      count: a.manifest.count,
      checksum: a.checksum,
      verified: a.verified,
      writtenOnUtc: a.manifest.writtenOnUtc,
      searchableByStaff: a.searchableByStaff === true,
    })),
    searchableByStaff: true,
  };
}

export async function archiveEntryAsync(id) {
  return archiveRepo().getByIdAsync(id);
}

/**
 * AC-PLT-020-02-02: a tracking rule has an active period and an archive period - past the active
 * period an event moves to the archive, past the archive period it is deleted.
 */
export async function runTrackingRetentionAsync({ actor = null, storeId = 1 } = {}) {
  const rule = await ruleRepo().getOneAsync((r) => r.recordType === 'trk.trackingevents');
  if (!rule) return { ok: false, message: 'no retention rule for tracking events' };
  const type = await recordTypeAsync('trk.trackingevents');
  const activeDays = inDays(rule.period, rule.unit);
  const archiveDays = rule.archivePeriod === null ? null : inDays(rule.archivePeriod, rule.archiveUnit ?? rule.unit);

  const run = await runRepo().insertAsync({
    startedOnUtc: new Date().toISOString(),
    startedBy: actor?.email ?? actor ?? 'system',
    status: 'Running',
    recordType: 'trk.trackingevents',
    counts: [],
  });

  const events = await repository('TrackingEvent').getAllAsync();
  const pastActive = events.filter((e) => olderThan(e, type, activeDays));
  let archived = 0;
  if (pastActive.length) {
    const copy = await archiveBatchAsync({ type, rows: pastActive, run });
    if (copy.verified === true) {
      const ids = new Set(pastActive.map((r) => Number(r.id)));
      await plainRepository('TrackingEvent').deleteManyAsync((r) => ids.has(Number(r.id)));
      archived = pastActive.length;
    }
  }

  let deleted = 0;
  if (archiveDays !== null) {
    for (const entry of await archiveRepo().getAllAsync((a) => a.recordType === 'trk.trackingevents')) {
      const keep = (entry.rows ?? []).filter((r) => !olderThan(r, type, archiveDays));
      const drop = (entry.rows ?? []).length - keep.length;
      if (drop === 0) continue;
      deleted += drop;
      if (keep.length === 0) await archiveRepo().deleteAsync(entry.id);
      else {
        await archiveRepo().updateAsync({
          ...entry, rows: keep, checksum: checksumOf(keep), manifest: { ...entry.manifest, count: keep.length, ids: keep.map((r) => r.id) },
        });
      }
    }
  }

  // the notification log follows its own rule
  let notifications = null;
  const logRule = await ruleRepo().getOneAsync((r) => r.recordType === 'trk.notificationlog');
  if (logRule && logRule.isActive !== false) {
    const logType = await recordTypeAsync('trk.notificationlog');
    const days = inDays(logRule.period, logRule.unit);
    const rows = await repository('MessageDelivery').getAllAsync((r) => olderThan(r, logType, days));
    const ids = new Set(rows.map((r) => Number(r.id)));
    if (logRule.action === 'Delete' && ids.size) await plainRepository('MessageDelivery').deleteManyAsync((r) => ids.has(Number(r.id)));
    notifications = { rule: `${logRule.period} ${logRule.unit} ${logRule.action}`, processed: rows.length, ownRule: true };
  }

  const counts = [{
    recordType: 'trk.trackingevents',
    activePeriod: `${rule.period} ${rule.unit}`,
    archivePeriod: rule.archivePeriod === null ? null : `${rule.archivePeriod} ${rule.archiveUnit ?? rule.unit}`,
    movedToArchive: archived,
    deletedFromArchive: deleted,
    stillSearchableByStaff: true,
  }];
  const finished = await runRepo().updateAsync({
    ...run, status: 'Completed', finishedOnUtc: new Date().toISOString(), counts, notifications,
  });
  await auditAsync({
    event: 'AUD-PLT-009',
    area: 'PLT',
    feature: 'PRD-PLT-020',
    entity: 'RetentionRun',
    entityId: finished.id,
    actor: actor?.email ?? actor ?? 'system',
    after: { counts, notifications },
    storeId,
    note: 'tracking retention run',
  });
  return {
    ok: true, run: finished, counts, notifications, auditEvent: 'AUD-PLT-009',
  };
}

/** The native maintenance tasks whose value now comes from a rule (AC-PLT-020-01-05). */
export async function nativeTasksAsync({ storeId = 1 } = {}) {
  return {
    tasks: [
      {
        name: 'ClearLogTask',
        setting: 'commonsettings.clearlogolderthandays',
        value: await getSettingAsync('commonsettings.clearlogolderthandays', storeId, null),
        recordType: 'logs',
      },
      {
        name: 'DeleteInactiveCustomersTask',
        setting: 'gdprsettings.deleteinactivecustomersaftermonths',
        value: await getSettingAsync('gdprsettings.deleteinactivecustomersaftermonths', storeId, null),
        recordType: 'iam.inactivecustomers',
      },
      { name: 'DeleteGuestsTask', setting: null, value: null, recordType: 'iam.guests' },
    ],
    oneSourceOfTheValue: 'the retention rule sets the native setting the task reads',
  };
}
