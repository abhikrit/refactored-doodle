// PRD-PLT-004 Settings change control. Held by decision WF-ENG, so this builds the PRD's
// Proposed option on the PRD-ADM-002 engine the prototype already runs, and labels it
// "Prototype default - decision WF-ENG pending".
//
// BR-PLT-020: a change to a controlled key is captured as a change set instead of being written;
// Low impact needs one approver other than the requester, High needs two different approvers; in
// a Test instance a valid change is applied at once and still recorded.
// BR-PLT-021: a change set whose key has moved since it was captured is Stale, not applied.
// BR-PLT-022: an uncontrolled key is saved natively and the SEC-004 decorator records it.
// BR-PLT-023: a rollback is a new change set through the same validation and approval.
// IC-PLT-03: a module registers a controlled configuration type with its validator, preview and
// apply handlers; Setting keys are handled by PLT itself.

import { plainRepository, repository } from '../../../core/repository.js';
import {
  getSettingAsync, getStoreSettingAsync, saveSettingAsync, allSettingsAsync,
} from '../../../core/settings.js';
import { auditAsync, auditTrailAsync, queryAsync } from '../../../core/audit.js';
import { auditContext } from '../../../core/audit-context.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { withLockAsync } from '../../../core/locker.js';
import { WRITE_LOCK_KEY } from '../../../core/pack-loader.js';

const setRepo = () => plainRepository('ConfigurationChangeSet');

export const PROTOTYPE_DEFAULT_LABEL = 'Prototype default - decision WF-ENG pending';
export const IMPACT_LEVELS = ['Low', 'High'];
export const STATES = ['Draft', 'PendingApproval', 'Applied', 'Rejected', 'Stale', 'Withdrawn'];

/** The controlled items and their validators. Every entry is configuration. */
export const DEFAULT_CONTROLLED_ITEMS = [
  {
    key: 'ordersettings.anonymouscheckoutallowed', type: 'boolean', impact: 'High', reason: 'it decides whether a shopper may buy without an account',
  },
  {
    key: 'ordersettings.minimumorderplacementinterval', type: 'number', min: 0, max: 3600, impact: 'Low',
  },
  {
    key: 'catalogsettings.searchpageproductsperpage', type: 'number', min: 1, max: 200, impact: 'Low',
  },
  {
    key: 'paymentsettings.activepaymentmethodsystemnames', type: 'array', reference: 'paymentMethods', impact: 'High', reason: 'it decides how customers may pay',
  },
  {
    key: 'customersettings.passwordminlength', type: 'number', min: 6, max: 64, impact: 'High', crossKey: 'customersettings.passwordmaxlength',
  },
  {
    key: 'shippingsettings.activeshippingratecomputationmethodsystemnames', type: 'array', impact: 'High',
  },
];

export const controlledItemsAsync = (storeId = 1) => getSettingAsync('plt.controlleditems', storeId, DEFAULT_CONTROLLED_ITEMS);

export const instanceRoleAsync = (storeId = 1) => getSettingAsync('plt.instancerole', storeId, 'Live');

export async function controlledAsync(key, storeId = 1) {
  const items = await controlledItemsAsync(storeId);
  const item = items.find((i) => i.key === key);
  if (item) return { controlled: true, ...item };
  const type = registeredTypes.get(key) ?? [...registeredTypes.values()].find((t) => key.startsWith(`${t.typeCode}.`));
  if (type) {
    return {
      controlled: true, key, impact: type.impact, registeredType: type.typeCode, owningModule: type.owningModule,
    };
  }
  return { controlled: false, key };
}

/* ======================================================= IC-PLT-03 registered types ==== */

const registeredTypes = new Map();

export function registerControlledType({
  typeCode, owningModule, impact = 'Low', validate = null, preview = null, apply = null, readCurrent = null,
}) {
  if (registeredTypes.has(typeCode) && registeredTypes.get(typeCode).owningModule !== owningModule) {
    throw new Error(`IC-PLT-03: ${typeCode} is already registered by ${registeredTypes.get(typeCode).owningModule}`);
  }
  registeredTypes.set(typeCode, {
    typeCode, owningModule, impact, validate, preview, apply, readCurrent,
  });
  return registeredTypes.get(typeCode);
}

export const registeredTypesAsync = async () => [...registeredTypes.values()].map((t) => ({
  typeCode: t.typeCode, owningModule: t.owningModule, impact: t.impact, hasValidator: typeof t.validate === 'function',
}));

const typeFor = (key) => registeredTypes.get(key)
  ?? [...registeredTypes.values()].find((t) => key.startsWith(`${t.typeCode}.`));

/* ============================================================== validation ============== */

/** AC-PLT-004-01-01: type, range, reference and cross-key rules. */
export async function validateChangeAsync({
  key, value, storeId = 1,
}) {
  const item = await controlledAsync(key, storeId);
  const errors = [];
  const type = typeFor(key);
  if (type?.validate) {
    const result = await type.validate({ key, value, storeId });
    for (const message of result?.errors ?? []) errors.push({ key, reason: message });
    return {
      ok: errors.length === 0,
      errors,
      item,
      validatedBy: type.typeCode,
      messageKey: errors.length ? 'Plt.ConfigInvalid' : null,
      message: errors.length ? `${resource('Plt.ConfigInvalid')} ${errors.map((e) => `${e.key}: ${e.reason}`).join('; ')}` : null,
    };
  }
  if (!item.controlled) return { ok: true, errors: [], validatedBy: 'none: the key is not controlled' };

  if (item.type === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) errors.push({ key, reason: `${key} takes a number` });
    else {
      if (item.min !== undefined && n < item.min) errors.push({ key, reason: `${key} is at least ${item.min}` });
      if (item.max !== undefined && n > item.max) errors.push({ key, reason: `${key} is at most ${item.max}` });
    }
  }
  if (item.type === 'boolean' && typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
    errors.push({ key, reason: `${key} is true or false` });
  }
  if (item.type === 'array' && !Array.isArray(value)) errors.push({ key, reason: `${key} is a list` });

  if (item.reference === 'paymentMethods' && Array.isArray(value)) {
    const { mockRegistry } = await import('@product/mocks');
    const unknown = value.filter((name) => !mockRegistry[name] && !String(name).startsWith('Payments.'));
    if (unknown.length) errors.push({ key, reason: `no payment method named ${unknown.join(', ')}` });
  }

  if (item.crossKey) {
    const other = await getSettingAsync(item.crossKey, storeId, undefined);
    if (other !== undefined && Number(value) > Number(other)) {
      errors.push({ key, reason: `${key} cannot be greater than ${item.crossKey} (${other})` });
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    item,
    messageKey: errors.length ? 'Plt.ConfigInvalid' : null,
    message: errors.length ? `${resource('Plt.ConfigInvalid')} ${errors.map((e) => `${e.key}: ${e.reason}`).join('; ')}` : null,
  };
}

/* ========================================================= capturing a change =========== */

/**
 * The PLT ISettingService override. AC-PLT-004-01-01 to 01-04.
 * A controlled key goes into a pending change set and the live value is untouched; an
 * uncontrolled key is written natively, where the SEC-004 decorator records it.
 */
export async function saveSettingThroughControlAsync({
  key, value, storeId = 0, actor, reason = null, action = 'SettingUpdate', adminPage = 'All settings',
}) {
  const validation = await validateChangeAsync({ key, value, storeId: storeId || 1 });
  if (!validation.ok) {
    return {
      ok: false,
      written: false,
      messageKey: 'Plt.ConfigInvalid',
      message: validation.message,
      errors: validation.errors,
      liveValueUnchanged: true,
      currentValue: await getSettingAsync(key, storeId || 1, null),
    };
  }

  const item = await controlledAsync(key, storeId || 1);
  if (!item.controlled) {
    // BR-PLT-022: written natively; the SEC-004 repository decorator records old and new
    await saveSettingAsync(key, value, storeId, 'runtime');
    return {
      ok: true,
      written: true,
      changeControlled: false,
      recordedBy: 'the PRD-SEC-004 repository decorator',
      rule: 'BR-PLT-022',
    };
  }

  const current = await getStoreSettingAsync(key, storeId);
  const role = await instanceRoleAsync(storeId || 1);
  const changeSet = await setRepo().insertAsync({
    items: [{
      key,
      storeId,
      oldValue: current === undefined ? null : current,
      newValue: value,
      registeredType: item.registeredType ?? null,
    }],
    impact: item.impact ?? 'Low',
    status: 'PendingApproval',
    requestedBy: actor,
    reason,
    action,
    adminPage,
    approvals: [],
    instanceRole: role,
    changeControlled: true,
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
    heldBy: 'WF-ENG',
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-PLT-004',
    area: 'PLT',
    feature: 'PRD-PLT-004',
    entity: 'ConfigurationChangeSet',
    entityId: changeSet.id,
    actor,
    after: { status: 'PendingApproval', key, newValue: value },
    note: 'configuration change captured',
  });

  // AC-PLT-004-01-04: a Test instance applies at once, and still records the change set
  if (role === 'Test') {
    const applied = await applyChangeSetAsync({ changeSetId: changeSet.id, actor, bypassApproval: true });
    return {
      ok: true,
      written: true,
      changeControlled: true,
      appliedAtOnce: true,
      instanceRole: role,
      changeSet: applied.changeSet,
      recorded: true,
      prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
    };
  }

  return {
    ok: true,
    written: false,
    changeControlled: true,
    messageKey: 'Plt.ChangePending',
    message: resource('Plt.ChangePending'),
    changeSet,
    liveValueUnchanged: true,
    currentValue: current === undefined ? null : current,
    filter: 'the PRD-PLT-004 action filter marked the request change-controlled',
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
  };
}

export const changeSetsAsync = (filter = {}) => setRepo()
  .getAllAsync((c) => (!filter.status || c.status === filter.status)
    && (!filter.requestedBy || c.requestedBy === filter.requestedBy));

export const changeSetAsync = (id) => setRepo().getByIdAsync(id);

/* ================================================================== the preview ========= */

/** AC-PLT-004-02-01 and 05-02: the scope, the values, the stores that inherit, the impact. */
export async function previewAsync({ changeSetId }) {
  const changeSet = await setRepo().getByIdAsync(changeSetId);
  if (!changeSet) return { ok: false, message: 'no such change set' };
  const stores = await repository('Store').getAllAsync();
  const rows = [];
  for (const item of changeSet.items) {
    const scope = item.storeId === 0 ? 'shared' : `store ${item.storeId}`;
    const inherit = [];
    if (item.storeId === 0) {
      for (const store of stores) {
        const own = await getStoreSettingAsync(item.key, store.id);
        if (own === undefined) inherit.push({ storeId: store.id, storeName: store.name });
      }
    }
    const impacts = [];
    const type = typeFor(item.key);
    if (type?.preview) {
      const result = await type.preview(item);
      for (const entry of result?.impacts ?? []) impacts.push({ ...entry, module: type.owningModule });
    }
    for (const registered of registeredTypes.values()) {
      if (registered === type || !registered.preview) continue;
      const result = await registered.preview(item);
      for (const entry of result?.impacts ?? []) impacts.push({ ...entry, module: registered.owningModule });
    }
    rows.push({
      key: item.key,
      scope,
      currentValue: await getStoreSettingAsync(item.key, item.storeId) ?? item.oldValue,
      newValue: item.newValue,
      storesInheritingSharedValue: inherit,
      impacts,
      inFlightRecords: impacts.reduce((sum, i) => sum + (i.count ?? 0), 0),
    });
  }
  return {
    ok: true,
    changeSetId,
    status: changeSet.status,
    impact: changeSet.impact,
    rows,
    contract: 'IC-PLT-03',
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
  };
}

/* ================================================================ approval ============== */

const approversNeeded = (impact) => (impact === 'High' ? 2 : 1);

/** AC-PLT-004-03-01 to 03-05. */
export async function approveAsync({
  changeSetId, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Platform.Core.ChangeControl.Approve', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.ChangeControl.Approve' };
  }
  const changeSet = await setRepo().getByIdAsync(changeSetId);
  if (!changeSet) return { ok: false, message: 'no such change set' };
  if (changeSet.status !== 'PendingApproval') return { ok: false, message: `that change set is ${changeSet.status}` };
  if (changeSet.requestedBy === by) {
    return {
      ok: false, refused: true, messageKey: 'Plt.ApproveOwnChange', message: resource('Plt.ApproveOwnChange'),
    };
  }
  if ((changeSet.approvals ?? []).some((a) => a.by === by)) {
    return { ok: false, refused: true, message: 'you have already approved this change set' };
  }

  const approvals = [...(changeSet.approvals ?? []), { by, at: new Date().toISOString() }];
  const needed = approversNeeded(changeSet.impact);
  if (approvals.length < needed) {
    const updated = await setRepo().updateAsync({ ...changeSet, approvals });
    await auditAsync({
      event: 'AUD-PLT-004', area: 'PLT', feature: 'PRD-PLT-004', entity: 'ConfigurationChangeSet', entityId: changeSet.id, actor: by, after: { approvals: approvals.length, needed }, note: 'change set approved, waiting for another approver',
    });
    return {
      ok: true,
      changeSet: updated,
      status: 'PendingApproval',
      approvals: approvals.length,
      approversNeeded: needed,
      waitingForAnotherApprover: true,
      rule: 'BR-PLT-020',
    };
  }
  return applyChangeSetAsync({
    changeSetId, actor: by, approvals, storeId,
  });
}

/** AC-PLT-004-03-01 and 03-04: the apply, under the configuration write lock. */
export async function applyChangeSetAsync({
  changeSetId, actor, approvals = null, bypassApproval = false, storeId = 1,
}) {
  const changeSet = await setRepo().getByIdAsync(changeSetId);
  if (!changeSet) return { ok: false, message: 'no such change set' };

  return withLockAsync(WRITE_LOCK_KEY, async () => {
    // BR-PLT-021: the values must still be the ones the change set was captured against
    const stale = [];
    for (const item of changeSet.items) {
      const current = await getStoreSettingAsync(item.key, item.storeId);
      const recorded = item.oldValue;
      if (JSON.stringify(current === undefined ? null : current) !== JSON.stringify(recorded)) {
        stale.push({ key: item.key, recordedOldValue: recorded, currentValue: current === undefined ? null : current });
      }
    }
    if (stale.length) {
      const updated = await setRepo().updateAsync({ ...changeSet, status: 'Stale', staleKeys: stale });
      await auditAsync({
        event: 'AUD-PLT-004', area: 'PLT', feature: 'PRD-PLT-004', entity: 'ConfigurationChangeSet', entityId: changeSet.id, actor, outcome: 'rejected', after: { status: 'Stale', keys: stale.map((s) => s.key) }, note: 'change set is stale: a key moved since it was captured',
      });
      return {
        ok: false,
        applied: false,
        changeSet: updated,
        status: 'Stale',
        staleKeys: stale,
        messageKey: 'Plt.ChangeStale',
        message: resource('Plt.ChangeStale'),
        rule: 'BR-PLT-021',
      };
    }

    for (const item of changeSet.items) {
      const type = typeFor(item.key);
      if (type?.apply) await type.apply(item);
      else await saveSettingAsync(item.key, item.newValue, item.storeId, 'change-set');
    }
    const updated = await setRepo().updateAsync({
      ...changeSet,
      status: 'Applied',
      approvals: approvals ?? changeSet.approvals ?? [],
      appliedBy: actor,
      appliedOnUtc: new Date().toISOString(),
      // the Setting events written by this apply carry the same SEC-004 correlation id, which is
      // how the configuration history joins a change to its change set (AC-PLT-004-04-01)
      correlationId: auditContext().correlationId ?? null,
      appliedThrough: 'the base SettingService',
      lockKey: WRITE_LOCK_KEY,
      bypassedApproval: bypassApproval === true,
    });
    await auditAsync({
      event: 'AUD-PLT-004',
      area: 'PLT',
      feature: 'PRD-PLT-004',
      entity: 'ConfigurationChangeSet',
      entityId: changeSet.id,
      actor,
      before: { status: changeSet.status },
      after: {
        status: 'Applied',
        keys: changeSet.items.map((i) => i.key),
        approvers: (approvals ?? []).map((a) => a.by),
        reason: changeSet.reason ?? null,
      },
      storeId,
      note: 'change set applied',
    });
    return {
      ok: true,
      applied: true,
      changeSet: updated,
      status: 'Applied',
      appliedThrough: 'the base SettingService',
      lockKey: WRITE_LOCK_KEY,
      approvers: (approvals ?? []).map((a) => a.by),
    };
  });
}

/** AC-PLT-004-03-05: a rejection, with its reason, and the requester told. */
export async function rejectAsync({
  changeSetId, reason, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Platform.Core.ChangeControl.Approve', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.ChangeControl.Approve' };
  }
  if (!reason) return { ok: false, reasonRequired: true, message: 'give the requester a reason' };
  const changeSet = await setRepo().getByIdAsync(changeSetId);
  if (!changeSet || changeSet.status !== 'PendingApproval') return { ok: false, message: 'that change set is not pending' };
  const updated = await setRepo().updateAsync({
    ...changeSet, status: 'Rejected', rejectedBy: by, rejectionReason: reason, rejectedOnUtc: new Date().toISOString(),
  });
  const { sendAsync } = await import('../../../core/messages.js');
  const { messageGateways } = await import('@product/mocks');
  let notified = false;
  try {
    await sendAsync({
      event: 'Plt.ChangeRejected',
      to: changeSet.requestedBy,
      channels: ['email', 'inapp'],
      tokens: { changeSetId: String(changeSetId), reason },
      storeId,
      feature: 'PRD-PLT-004',
      gateways: messageGateways,
    });
    notified = true;
  } catch { /* the rejection stands */ }
  await auditAsync({
    event: 'AUD-PLT-004', area: 'PLT', feature: 'PRD-PLT-004', entity: 'ConfigurationChangeSet', entityId: changeSetId, actor: by, before: { status: 'PendingApproval' }, after: { status: 'Rejected', reason }, note: 'change set rejected',
  });
  return {
    ok: true, changeSet: updated, nothingWritten: true, requesterNotified: notified, reason,
  };
}

/* ================================================================= the history ========== */

/**
 * A Setting row carries its own store: StoreId 0 for the shared value, n for a store row. The
 * audit entry also carries the store the request ran in, which is not the same thing, so the
 * history reports the row's store (AC-PLT-004-04-01 lists "store" per key).
 */
const settingStoreOf = (entry) => entry.after?.storeId ?? entry.before?.storeId ?? entry.storeId ?? 0;

/** AC-PLT-004-04-01 and 04-02: the configuration history, read from the SEC-004 trail. */
export async function historyAsync({
  key = null, actor = null, storeId = null, from = null, to = null, requester = null,
}) {
  if (requester && !await authorizeAsync('Platform.Core.ChangeControl.View', requester)) {
    return { ok: false, denied: true, permission: 'Platform.Core.ChangeControl.View' };
  }
  const trail = await auditTrailAsync({ entity: 'Setting', from, to });
  const sets = await setRepo().getAllAsync((c) => c.status === 'Applied');
  const rows = trail
    .filter((e) => (!key || (e.after?.name ?? e.before?.name) === key)
      && (!actor || e.actor === actor)
      && (storeId === null || Number(settingStoreOf(e)) === Number(storeId)))
    .map((e) => {
      const settingKey = e.after?.name ?? e.before?.name ?? null;
      const set = sets.find((c) => c.items.some((i) => i.key === settingKey)
        && ((c.correlationId && c.correlationId === e.correlationId)
          || (!c.correlationId && c.appliedOnUtc
            && Math.abs(new Date(c.appliedOnUtc) - new Date(e.occurredOnUtc)) < 5000)));
      return {
        sequence: e.sequence,
        actor: e.actor,
        at: e.occurredOnUtc,
        key: settingKey,
        storeId: settingStoreOf(e),
        oldValue: e.before?.value ?? null,
        newValue: e.after?.value ?? null,
        reason: set?.reason ?? null,
        approvers: (set?.approvals ?? []).map((a) => a.by),
        changeSetId: set?.id ?? null,
      };
    });
  const header = 'sequence,at,actor,key,storeId,oldValue,newValue,reason,approvers';
  return {
    ok: true,
    rows,
    total: rows.length,
    readFrom: 'the PRD-SEC-004 audit store',
    filters: ['user', 'key', 'store', 'period'],
    csv: [header, ...rows.map((r) => [
      r.sequence, r.at, r.actor, r.key, r.storeId, JSON.stringify(r.oldValue ?? ''), JSON.stringify(r.newValue ?? ''), r.reason ?? '', (r.approvers ?? []).join(' '),
    ].join(','))].join('\n'),
    exportable: true,
  };
}

/** AC-PLT-004-05-03: the configuration as it was on a date, rebuilt from the history. */
export async function asOfAsync({ at, storeId = 1 }) {
  const items = await controlledItemsAsync(storeId);
  const page = await queryAsync({ entity: 'Setting', to: at, pageSize: 100000 });
  const values = {};
  for (const event of page.events) {
    const key = event.after?.name ?? event.before?.name;
    if (!key) continue;
    if (!items.some((i) => i.key === key)) continue;
    values[key] = {
      value: event.after?.value ?? null, at: event.occurredOnUtc, actor: event.actor, sequence: event.sequence,
    };
  }
  for (const item of items) {
    if (values[item.key]) continue;
    values[item.key] = { value: 'not recorded before that date', at: null, actor: null };
  }
  return {
    at, storeId, controlledKeys: items.map((i) => i.key), values, rebuiltFrom: 'the configuration history',
  };
}

/** AC-PLT-004-05-01: a rollback is a new change set. */
export async function requestRollbackAsync({
  keys, at, actor, storeId = 0, reason = null,
}) {
  const asOf = await asOfAsync({ at, storeId: storeId || 1 });
  const items = [];
  for (const key of keys) {
    const past = asOf.values[key];
    if (!past || past.value === 'not recorded before that date') continue;
    const current = await getStoreSettingAsync(key, storeId);
    items.push({
      key, storeId, oldValue: current === undefined ? null : current, newValue: past.value, restoredFrom: past.at,
    });
  }
  if (items.length === 0) return { ok: false, message: 'none of those keys has a recorded value at that date' };

  const controlled = await Promise.all(items.map((i) => controlledAsync(i.key, storeId || 1)));
  const impact = controlled.some((c) => c.impact === 'High') ? 'High' : 'Low';
  const changeSet = await setRepo().insertAsync({
    items,
    impact,
    status: 'PendingApproval',
    requestedBy: actor,
    reason: reason ?? `rollback to the values of ${at}`,
    rollback: true,
    rollbackTo: at,
    approvals: [],
    changeControlled: true,
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-PLT-005', area: 'PLT', feature: 'PRD-PLT-004', entity: 'ConfigurationChangeSet', entityId: changeSet.id, actor, after: { rollbackTo: at, keys }, note: 'rollback requested',
  });
  return {
    ok: true,
    changeSet,
    nothingWrittenYet: true,
    status: 'PendingApproval',
    sameValidationAndApproval: true,
    rule: 'BR-PLT-023',
  };
}

/* ============================================================== comparison ============== */

/** AC-PLT-004-06-01: compare two snapshots, and copy differences into a change set. */
export async function snapshotAsync({ storeId = 0, label = 'now' } = {}) {
  const items = await controlledItemsAsync(storeId || 1);
  const values = {};
  for (const item of items) {
    const value = await getStoreSettingAsync(item.key, storeId);
    values[item.key] = value === undefined ? null : value;
  }
  return {
    label, storeId, takenOnUtc: new Date().toISOString(), values,
  };
}

export function compareSnapshots({ left, right }) {
  const keys = [...new Set([...Object.keys(left.values ?? {}), ...Object.keys(right.values ?? {})])].sort();
  const differences = [];
  for (const key of keys) {
    const a = left.values?.[key] ?? null;
    const b = right.values?.[key] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) differences.push({ key, left: a, right: b });
  }
  return {
    left: left.label, right: right.label, differences, same: keys.length - differences.length,
  };
}

export async function changeSetFromDifferencesAsync({
  differences, keys = null, actor, storeId = 0, reason = null,
}) {
  const chosen = differences.filter((d) => !keys || keys.includes(d.key));
  if (chosen.length === 0) return { ok: false, message: 'choose at least one difference' };
  const items = [];
  for (const difference of chosen) {
    const current = await getStoreSettingAsync(difference.key, storeId);
    items.push({
      key: difference.key, storeId, oldValue: current === undefined ? null : current, newValue: difference.right,
    });
  }
  const controlled = await Promise.all(items.map((i) => controlledAsync(i.key, storeId || 1)));
  const changeSet = await setRepo().insertAsync({
    items,
    impact: controlled.some((c) => c.impact === 'High') ? 'High' : 'Low',
    status: 'PendingApproval',
    requestedBy: actor,
    reason: reason ?? 'copied from a snapshot comparison',
    fromComparison: true,
    approvals: [],
    changeControlled: true,
    createdOnUtc: new Date().toISOString(),
  });
  return { ok: true, changeSet, copied: items.length };
}

export const allSettingsSnapshotAsync = () => allSettingsAsync();
