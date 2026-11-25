// PRD-ADM-009 Exception management and PRD-ADM-010 Operational alerts.
//
// ADM-009
//   US-ADM-009-01  one queue ranked by severity and age
//   US-ADM-009-02  structured reason codes and a record of how each was fixed
//   US-ADM-009-03  the same action on many exceptions where it is safe
//   US-ADM-009-04  exceptions that share a root cause grouped
// ADM-010
//   US-ADM-010-01  alerts when something needs attention, with thresholds the client sets
//
// BR-ADM-070 every resolution records operator, action, reason code, comment and outcome; bulk
// actions only for actions the type declares batch-safe. Section 12.4: each item is processed
// under ILocker key 'adm-exception-{id}'.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { sendEventAsync } from '../../product-trk/services/event-codes.js';

const exRepo = () => repository('ExceptionRecord');
const patternRepo = () => repository('ExceptionPattern');
const alertRuleRepo = () => repository('AlertRule');
const alertRepo = () => repository('AlertEvent');
const workItemRepo = () => repository('WorkItemEvent');

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

/* ================================================= IC-ADM-04 handlers per type =========== */

const handlers = new Map(); // exception type -> { feature, actions: [{action, batchSafe}], handle }

export function registerExceptionType(type, definition) {
  handlers.set(type, definition);
  return definition;
}
export const exceptionTypes = () => [...handlers.entries()].map(([type, d]) => ({
  type, feature: d.feature, actions: d.actions,
}));

/* ======================================================================== raising ======== */

/** IC-ADM-04 Raise exception. Called by any module. */
export async function raiseExceptionAsync({
  type, severity = 'Medium', reasonCode, entityRef = null, details = {}, allowedActions = null,
  source = null, raisedBy = null,
}) {
  const definition = handlers.get(type);
  const record = await exRepo().insertAsync({
    type,
    severity,
    reasonCode,
    entityRef,
    details,
    source: source ?? entityRef?.type ?? null,
    allowedActions: allowedActions ?? definition?.actions ?? [{ action: 'retry', batchSafe: true }],
    status: 'Open',
    attempts: 0,
    raisedBy: raisedBy ?? definition?.feature ?? null,
    raisedOnUtc: new Date().toISOString(),
  });
  await workItemRepo().insertAsync({
    queueCode: 'exceptions',
    itemType: 'ExceptionRecord',
    itemId: record.id,
    event: 'Assigned',
    assigneeId: null,
    actorId: null,
    occurredOnUtc: new Date().toISOString(),
  });
  return record;
}

/** AC-ADM-009-01-01: by severity, then by age (oldest first), with filters. */
export async function queueAsync({ type = null, reasonCode = null, module: moduleFilter = null } = {}) {
  const rows = await exRepo().getAllAsync((r) => (type ? r.type === type : true)
    && (reasonCode ? r.reasonCode === reasonCode : true)
    && (moduleFilter ? r.raisedBy === moduleFilter : true));
  const open = rows.filter((r) => r.status !== 'Resolved');
  const patterns = await patternRepo().getAllAsync();
  return {
    patterns: patterns.sort((a, b) => b.count - a.count),
    exceptions: open.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
      || new Date(a.raisedOnUtc) - new Date(b.raisedOnUtc)),
    resolved: rows.filter((r) => r.status === 'Resolved').length,
    filters: {
      types: [...new Set(rows.map((r) => r.type))],
      reasonCodes: [...new Set(rows.map((r) => r.reasonCode))],
      modules: [...new Set(rows.map((r) => r.raisedBy).filter(Boolean))],
    },
  };
}

export async function takeAsync({ id, customer }) {
  const record = await exRepo().getByIdAsync(id);
  if (!record) return { ok: false, message: 'unknown exception' };
  const updated = await exRepo().updateAsync({ ...record, status: 'InProgress', assignee: customer?.email ?? null });
  return { ok: true, exception: updated };
}

/**
 * AC-ADM-009-02-01 and BR-ADM-070: a reason code AND an action are mandatory; operator, action,
 * reason code, comment and outcome are recorded (AUD-ADM-007).
 */
export async function resolveAsync({
  id, action, reasonCode, comment = null, customer = null,
}) {
  return withLockAsync(lockKey.exception(id), async () => {
    const record = await exRepo().getByIdAsync(id);
    if (!record) return { ok: false, message: 'unknown exception' };
    if (record.status === 'Resolved') return { ok: false, alreadyResolved: true, message: 'the exception is already resolved' };
    if (!reasonCode || !action) {
      return { ok: false, messageKey: 'Adm.ReasonRequired', message: resource('Adm.ReasonRequired') };
    }
    const outcome = `resolved by ${action}`;
    const updated = await exRepo().updateAsync({
      ...record,
      status: 'Resolved',
      action,
      reasonCode,
      comment,
      outcome,
      resolvedBy: customer?.email ?? 'operator',
      resolvedOnUtc: new Date().toISOString(),
    });
    await auditAsync({
      event: 'AUD-ADM-007',
      area: 'ADM',
      feature: 'PRD-ADM-009',
      entity: 'ExceptionRecord',
      entityId: id,
      actor: customer?.email ?? 'operator',
      actorRole: (customer?.roles ?? []).join(', ') || 'Operations',
      before: { status: record.status },
      after: {
        status: 'Resolved', action, reasonCode, comment, outcome,
      },
      note: 'exception resolved',
    });
    await workItemRepo().insertAsync({
      queueCode: 'exceptions', itemType: 'ExceptionRecord', itemId: id, event: 'Completed', assigneeId: null, actorId: customer?.id ?? null, occurredOnUtc: new Date().toISOString(),
    });
    return { ok: true, exception: updated };
  });
}

/**
 * AC-ADM-009-03-02: a retry that fails again returns the exception to Open with the attempt
 * count increased. The owning module's handler does the work (IC-ADM-04 Handle action).
 */
export async function retryAsync({ id, customer = null }) {
  return withLockAsync(lockKey.exception(id), async () => {
    const record = await exRepo().getByIdAsync(id);
    if (!record) return { ok: false, message: 'unknown exception' };
    const definition = handlers.get(record.type);
    await exRepo().updateAsync({ ...record, status: 'Retrying' });
    let result = { ok: false, message: 'no handler is registered for this exception type' };
    if (definition?.handle) {
      try { result = await definition.handle({ action: 'retry', record }); } catch (err) { result = { ok: false, message: err.message }; }
    }
    const attempts = (record.attempts ?? 0) + 1;
    if (result.ok) {
      const resolved = await exRepo().updateAsync({
        ...record,
        status: 'Resolved',
        attempts,
        action: 'retry',
        reasonCode: record.reasonCode,
        outcome: 'retry succeeded',
        resolvedBy: customer?.email ?? 'operator',
        resolvedOnUtc: new Date().toISOString(),
      });
      await auditAsync({
        event: 'AUD-ADM-007',
        area: 'ADM',
        feature: 'PRD-ADM-009',
        entity: 'ExceptionRecord',
        entityId: id,
        actor: customer?.email ?? 'operator',
        actorRole: 'Operations',
        before: { status: record.status, attempts: record.attempts },
        after: { status: 'Resolved', attempts, outcome: 'retry succeeded' },
        note: 'exception retried',
      });
      return { ok: true, exception: resolved };
    }
    const reopened = await exRepo().updateAsync({
      ...record, status: 'Open', attempts, lastError: result.message,
    });
    await auditAsync({
      event: 'AUD-ADM-007',
      area: 'ADM',
      feature: 'PRD-ADM-009',
      entity: 'ExceptionRecord',
      entityId: id,
      actor: customer?.email ?? 'operator',
      actorRole: 'Operations',
      before: { status: record.status, attempts: record.attempts },
      after: { status: 'Open', attempts },
      note: `retry failed: ${result.message}`,
    });
    return { ok: true, exception: reopened, retryFailed: true };
  });
}

export async function escalateAsync({ id, toRole = 'OperationsManager', customer = null }) {
  const record = await exRepo().getByIdAsync(id);
  if (!record) return { ok: false, message: 'unknown exception' };
  const updated = await exRepo().updateAsync({ ...record, status: 'Escalated', escalatedTo: toRole });
  await auditAsync({
    event: 'AUD-ADM-007',
    area: 'ADM',
    feature: 'PRD-ADM-009',
    entity: 'ExceptionRecord',
    entityId: id,
    actor: customer?.email ?? 'operator',
    actorRole: 'Operations',
    before: { status: record.status },
    after: { status: 'Escalated', escalatedTo: toRole },
    note: 'exception escalated',
  });
  return { ok: true, exception: updated };
}

/**
 * AC-ADM-009-03-01: a bulk action runs only for an action the type declares batch-safe, through
 * the owning module's handler, with the result per item.
 */
export async function bulkActionAsync({
  ids, action, reasonCode = null, comment = null, customer = null,
}) {
  const results = [];
  for (const id of ids) {
    const record = await exRepo().getByIdAsync(id);
    if (!record) { results.push({ id, ok: false, message: 'unknown exception' }); continue; }
    const allowed = (record.allowedActions ?? []).find((a) => a.action === action);
    if (!allowed) { results.push({ id, ok: false, message: `${action} is not an allowed action for ${record.type}` }); continue; }
    if (ids.length > 1 && !allowed.batchSafe) {
      results.push({ id, ok: false, message: `${action} is not batch-safe for ${record.type}; it is not offered for several items (BR-ADM-070)` });
      continue;
    }
    if (record.status === 'Resolved') { results.push({ id, ok: false, skipped: true, message: 'already resolved' }); continue; }
    const r = action === 'retry'
      ? await retryAsync({ id, customer })
      : action === 'escalate'
        ? await escalateAsync({ id, customer })
        : await resolveAsync({
          id, action, reasonCode, comment, customer,
        });
    results.push({ id, ...r });
  }
  return {
    ok: results.every((r) => r.ok), action, batchSafeChecked: true, results,
  };
}

export const bulkActionsFor = (record) => (record.allowedActions ?? []).filter((a) => a.batchSafe).map((a) => a.action);

/**
 * AC-ADM-009-04-01: the pattern task groups open exceptions that share reason code and source
 * within the configured window, shown at the top of the queue.
 */
export async function detectPatternsAsync({ windowHours = 24, minimum = 2 } = {}) {
  const open = await exRepo().getAllAsync((r) => r.status !== 'Resolved');
  const since = Date.now() - windowHours * 3600 * 1000;
  const groups = new Map();
  for (const r of open) {
    if (new Date(r.raisedOnUtc).getTime() < since) continue;
    const key = `${r.reasonCode}|${r.source}`;
    const group = groups.get(key) ?? {
      reasonCode: r.reasonCode, source: r.source, count: 0, ids: [], firstSeen: r.raisedOnUtc, lastSeen: r.raisedOnUtc,
    };
    group.count += 1;
    group.ids.push(r.id);
    group.firstSeen = group.firstSeen < r.raisedOnUtc ? group.firstSeen : r.raisedOnUtc;
    group.lastSeen = group.lastSeen > r.raisedOnUtc ? group.lastSeen : r.raisedOnUtc;
    groups.set(key, group);
  }
  for (const existing of await patternRepo().getAllAsync()) await patternRepo().deleteAsync(existing.id);
  const patterns = [];
  for (const group of groups.values()) {
    if (group.count < minimum) continue;
    patterns.push(await patternRepo().insertAsync({ ...group, windowHours, detectedOnUtc: new Date().toISOString() }));
  }
  return { patterns, windowHours };
}

/* ======================================================= PRD-ADM-010 operational alerts == */

export const alertRulesAsync = () => alertRuleRepo().getAllAsync();
export const alertsAsync = () => alertRepo().getAllAsync();

export async function saveAlertRuleAsync({
  id = null, measure, threshold, window: windowMinutes = 60, recipients = [], channel = 'email',
  repeatIntervalMinutes = 240, isActive = true, customer = null,
}) {
  const existing = id ? await alertRuleRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await alertRuleRepo().updateAsync({
      ...existing, measure, threshold, windowMinutes, recipients, channel, repeatIntervalMinutes, isActive,
    })
    : await alertRuleRepo().insertAsync({
      measure, threshold, windowMinutes, recipients, channel, repeatIntervalMinutes, isActive,
    });
  // AC-ADM-010-01-03: the change is audited
  await auditAsync({
    event: 'AUD-ADM-008',
    area: 'ADM',
    feature: 'PRD-ADM-010',
    entity: 'AlertRule',
    entityId: saved.id,
    actor: customer?.email ?? 'operator',
    actorRole: (customer?.roles ?? []).join(', ') || 'Operations',
    before: existing ? { measure: existing.measure, threshold: existing.threshold } : null,
    after: { measure, threshold },
    note: existing ? 'alert rule changed' : 'alert rule created',
  });
  return saved;
}

/**
 * AC-ADM-010-01-01: when the alert task runs and the threshold is crossed, an alert is raised
 * and sent through TRK-005; it is not sent again for the same rule and subject until it is
 * cleared or the repeat interval passes.
 * AC-ADM-010-01-02: the measure falling back below the threshold clears the alert.
 */
export async function runAlertTaskAsync({ measures = {}, gateways = null } = {}) {
  const rules = await alertRuleRepo().getAllAsync((r) => r.isActive !== false);
  const raised = [];
  const cleared = [];
  const suppressed = [];
  for (const rule of rules) {
    const subject = rule.measure;
    const value = measures[rule.measure] ?? await measureValueAsync(rule.measure);
    const open = await alertRepo().getOneAsync((a) => a.ruleId === rule.id && a.subject === subject && ['Raised', 'Acknowledged'].includes(a.status));
    if (value > rule.threshold) {
      if (open) {
        const age = Date.now() - new Date(open.raisedOnUtc).getTime();
        if (age < rule.repeatIntervalMinutes * 60 * 1000) { suppressed.push({ rule: rule.id, subject, value }); continue; }
      }
      const alert = await alertRepo().insertAsync({
        ruleId: rule.id, measure: rule.measure, subject, value, threshold: rule.threshold, status: 'Raised', raisedOnUtc: new Date().toISOString(),
      });
      try {
        await sendEventAsync({
          code: 'Administration.AlertRaised',
          to: rule.recipients.join(', ') || 'operations@example.com',
          tokens: { measure: rule.measure, value, threshold: rule.threshold },
          gateways,
        });
      } catch { /* delivery failure never suppresses the alert record */ }
      raised.push(alert);
    } else if (open) {
      cleared.push(await alertRepo().updateAsync({ ...open, status: 'Cleared', clearedOnUtc: new Date().toISOString(), value }));
    }
  }
  return {
    raised, cleared, suppressed, checked: rules.length,
  };
}

async function measureValueAsync(measure) {
  if (measure.startsWith('open-exceptions')) {
    const type = measure.split(':')[1];
    const rows = await exRepo().getAllAsync((r) => r.status !== 'Resolved' && (type ? r.type === type : true));
    return rows.length;
  }
  if (measure.startsWith('orders-in-status')) {
    const [, status] = measure.split(':');
    const rows = await repository('Order').getAllAsync((o) => o.orderStatus === status);
    return rows.length;
  }
  return 0;
}

export async function acknowledgeAlertAsync({ id, customer }) {
  const alert = await alertRepo().getByIdAsync(id);
  if (!alert) return { ok: false, message: 'unknown alert' };
  const updated = await alertRepo().updateAsync({
    ...alert, status: 'Acknowledged', acknowledgedBy: customer?.email ?? 'operator', acknowledgedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-ADM-008',
    area: 'ADM',
    feature: 'PRD-ADM-010',
    entity: 'AlertEvent',
    entityId: id,
    actor: customer?.email ?? 'operator',
    actorRole: 'Operations',
    before: { status: 'Raised' },
    after: { status: 'Acknowledged' },
    note: 'alert acknowledged',
  });
  return { ok: true, alert: updated };
}
