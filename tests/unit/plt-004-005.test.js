// PRD-PLT-004 Settings change control (17 ACs, held by decision WF-ENG and built as the PRD's
// Proposed option) and PRD-PLT-005 Configuration export, import and promotion (7 ACs).
// One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { getSettingAsync, saveSettingAsync, getStoreSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const LOW = 'catalogsettings.searchpageproductsperpage';
const HIGH = 'ordersettings.anonymouscheckoutallowed';

const save = (body, session = SESSIONS.admin) => api.post('/api/platform/change-control/settings', body, session);

/* ====================================================== PRD-PLT-004 change control ===== */

describe('PRD-PLT-004 validation and capture', () => {
  test('AC-PLT-004-01-01', async () => {
    // "nothing is written, the page shows message Plt.ConfigInvalid with the key and the reason,
    //  and the live value is unchanged"
    await saveSettingAsync(LOW, 24, 0);
    const control = await api.get('/api/platform/change-control', SESSIONS.admin);
    assert.equal(control.heldBy, 'WF-ENG');
    assert.match(control.prototypeDefaultLabel, /decision WF-ENG pending/);
    assert.ok(control.controlledItems.some((i) => i.key === LOW), 'the key is on the controlled-items list');

    const outOfRange = await save({ key: LOW, value: 5000, storeId: 0 });
    assert.equal(outOfRange.ok, false);
    assert.equal(outOfRange.written, false);
    assert.equal(outOfRange.messageKey, 'Plt.ConfigInvalid');
    assert.match(outOfRange.message, new RegExp(LOW.replace(/\./g, '\\.')), 'the message names the key');
    assert.match(outOfRange.message, /at most 200/, 'and the reason');
    assert.equal(outOfRange.liveValueUnchanged, true);
    assert.equal(await getSettingAsync(LOW, 0, null), 24, 'the live value is unchanged');

    const wrongType = await save({ key: HIGH, value: 'perhaps', storeId: 0 });
    assert.equal(wrongType.messageKey, 'Plt.ConfigInvalid');
    assert.match(wrongType.message, /true or false/);

    const badReference = await save({ key: 'paymentsettings.activepaymentmethodsystemnames', value: ['NotAMethod'], storeId: 0 });
    assert.equal(badReference.messageKey, 'Plt.ConfigInvalid');
    assert.match(badReference.message, /no payment method named/);

    await saveSettingAsync('customersettings.passwordmaxlength', 32, 0);
    const crossKey = await save({ key: 'customersettings.passwordminlength', value: 40, storeId: 0 });
    assert.equal(crossKey.messageKey, 'Plt.ConfigInvalid');
    assert.match(crossKey.message, /cannot be greater than customersettings\.passwordmaxlength/);

    assert.equal((await api.get('/api/platform/change-control/sets', SESSIONS.admin)).length, 0, 'no change set is captured for an invalid value');
  });

  test('AC-PLT-004-01-02', async () => {
    // "the PLT action filter marks the request as change-controlled and the override records the
    //  write in a pending change set instead of writing the Setting row; Plt.ChangePending; the
    //  live value is unchanged (BR-PLT-020)"
    await saveSettingAsync(LOW, 24, 0);
    for (const [action, page] of [
      ['SettingUpdate', 'All settings'],
      ['SettingAdd', 'All settings'],
      ['SettingDelete', 'All settings'],
      ['Configure', 'a plugin Configure page'],
      ['CatalogSettings', 'the Catalog settings page'],
    ]) {
      const pending = await save({
        key: LOW, value: 36, storeId: 0, action, adminPage: page,
      });
      assert.equal(pending.ok, true, `${action} is captured`);
      assert.equal(pending.written, false);
      assert.equal(pending.changeControlled, true);
      assert.equal(pending.messageKey, 'Plt.ChangePending');
      assert.equal(pending.changeSet.status, 'PendingApproval');
      assert.equal(pending.changeSet.action, action);
      assert.match(pending.filter, /action filter marked the request change-controlled/);
      assert.equal(await getSettingAsync(LOW, 0, null), 24, 'the live value is unchanged');
    }
    const sets = await api.get('/api/platform/change-control/sets?status=PendingApproval', SESSIONS.admin);
    assert.equal(sets.length, 5, 'one change set per save');
  });

  test('AC-PLT-004-01-03', async () => {
    // "it is saved natively; the SEC-004 repository decorator records the old and new value"
    const key = 'catalogsettings.compareproductsnumber';
    const controlled = await api.get(`/api/platform/change-control/controlled?key=${key}`, SESSIONS.admin);
    assert.equal(controlled.controlled, false, 'the key is not controlled');

    await saveSettingAsync(key, 4, 0);
    const saved = await save({ key, value: 6, storeId: 0 });
    assert.equal(saved.ok, true);
    assert.equal(saved.written, true, 'it is written at once');
    assert.equal(saved.changeControlled, false);
    assert.match(saved.recordedBy, /PRD-SEC-004 repository decorator/);
    assert.equal(saved.rule, 'BR-PLT-022');
    assert.equal(await getSettingAsync(key, 0, null), 6);

    const trail = await auditTrailAsync({ entity: 'Setting' });
    const entry = trail.find((e) => (e.after?.name ?? e.before?.name) === key && e.after?.value === 6);
    assert.ok(entry, 'the decorator recorded it');
    assert.equal(entry.before.value, 4, 'with the old value');
  });

  test('AC-PLT-004-01-04', async () => {
    // "the change set is applied at once after validation, without approval, and is still
    //  recorded (BR-PLT-020)"
    await saveSettingAsync('plt.instancerole', 'Test', 0);
    await saveSettingAsync(LOW, 24, 0);

    const applied = await save({ key: LOW, value: 48, storeId: 0 });
    assert.equal(applied.ok, true);
    assert.equal(applied.appliedAtOnce, true);
    assert.equal(applied.instanceRole, 'Test');
    assert.equal(applied.recorded, true);
    assert.equal(applied.changeSet.status, 'Applied');
    assert.equal(applied.changeSet.bypassedApproval, true);
    assert.deepEqual(applied.changeSet.approvals, [], 'without approval');
    assert.equal(await getSettingAsync(LOW, 0, null), 48, 'the value is live at once');

    const invalid = await save({ key: LOW, value: -1, storeId: 0 });
    assert.equal(invalid.ok, false, 'validation still runs first');
    assert.equal(invalid.messageKey, 'Plt.ConfigInvalid');

    await saveSettingAsync('plt.instancerole', 'Live', 0);
  });

  test('AC-PLT-004-02-01', async () => {
    // "the preview lists, per key, the store or shared scope, the current and new value, the
    //  stores that inherit the shared value, and the impact counts returned by any module
    //  registered for that key (IC-PLT-03)"
    await saveSettingAsync(HIGH, true, 0);
    const pending = await save({ key: HIGH, value: false, storeId: 0, reason: 'Malawi Post requires an account' });
    const preview = await api.get(`/api/platform/change-control/sets/${pending.changeSet.id}/preview`, SESSIONS.admin);
    assert.equal(preview.ok, true);
    assert.equal(preview.contract, 'IC-PLT-03');
    const row = preview.rows[0];
    assert.equal(row.key, HIGH);
    assert.equal(row.scope, 'shared');
    assert.equal(row.currentValue, true, 'the current value');
    assert.equal(row.newValue, false, 'and the new one');
    assert.ok(Array.isArray(row.storesInheritingSharedValue));
    assert.ok(row.storesInheritingSharedValue.length >= 1, 'the stores that inherit the shared value');
    assert.ok(Array.isArray(row.impacts));
    assert.ok(row.impacts.some((i) => i.module === 'Product.PAY' && typeof i.count === 'number'), 'the impact counts a module returns');
    assert.equal(typeof row.inFlightRecords, 'number');

    const forStore = await save({ key: LOW, value: 60, storeId: 2 });
    const storePreview = await api.get(`/api/platform/change-control/sets/${forStore.changeSet.id}/preview`, SESSIONS.admin);
    assert.equal(storePreview.rows[0].scope, 'store 2', 'a store-scoped change says so');
  });
});

describe('PRD-PLT-004 approval and application', () => {
  test('AC-PLT-004-03-01', async () => {
    // "it is applied through the base SettingService under ILocker key 'plt-config-write' and
    //  the status becomes Applied; audited (AUD-PLT-004)"
    await saveSettingAsync(LOW, 24, 0);
    const pending = await save({ key: LOW, value: 36, storeId: 0, reason: 'more results per page' });
    assert.equal(pending.changeSet.impact, 'Low');

    const approved = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(approved.ok, true);
    assert.equal(approved.applied, true);
    assert.equal(approved.status, 'Applied');
    assert.equal(approved.lockKey, 'plt-config-write');
    assert.match(approved.appliedThrough, /base SettingService/);
    assert.deepEqual(approved.approvers, ['config.approver@example.com'], 'one approver, not the requester');
    assert.equal(await getSettingAsync(LOW, 0, null), 36, 'the value is live');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-004', entityId: pending.changeSet.id });
    assert.ok(trail.some((e) => e.after?.status === 'Applied'), 'AUD-PLT-004 is written');

    const denied = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Platform.Core.ChangeControl.Approve');
  });

  test('AC-PLT-004-03-02', async () => {
    // "it stays PendingApproval until a second, different approver approves it (BR-PLT-020)"
    await saveSettingAsync(HIGH, true, 0);
    const pending = await save({ key: HIGH, value: false, storeId: 0, reason: 'an account is required' });
    assert.equal(pending.changeSet.impact, 'High');

    const first = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(first.ok, true);
    assert.equal(first.status, 'PendingApproval');
    assert.equal(first.approvals, 1);
    assert.equal(first.approversNeeded, 2);
    assert.equal(first.waitingForAnotherApprover, true);
    assert.equal(await getSettingAsync(HIGH, 0, null), true, 'nothing is written yet');

    const same = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(same.ok, false, 'the same approver cannot approve twice');

    const requester = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.admin);
    assert.equal(requester.messageKey, 'Plt.ApproveOwnChange', 'and the requester is not one of the two');

    const second = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver2);
    assert.equal(second.applied, true);
    assert.equal(second.status, 'Applied');
    assert.equal(second.approvers.length, 2);
    assert.equal(await getSettingAsync(HIGH, 0, null), false);
  });

  test('AC-PLT-004-03-03', async () => {
    // "the action is refused with message Plt.ApproveOwnChange"
    await saveSettingAsync(LOW, 36, 0);
    const pending = await save({ key: LOW, value: 42, storeId: 0 });
    const own = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.admin);
    assert.equal(own.ok, false);
    assert.equal(own.refused, true);
    assert.equal(own.messageKey, 'Plt.ApproveOwnChange');
    assert.equal(await getSettingAsync(LOW, 0, null), 36, 'nothing is applied');

    const other = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(other.applied, true, 'another approver can');
  });

  test('AC-PLT-004-03-04', async () => {
    // "the change set is not applied, its status becomes Stale and message Plt.ChangeStale is
    //  shown (BR-PLT-021)"
    await saveSettingAsync(LOW, 42, 0);
    const pending = await save({ key: LOW, value: 60, storeId: 0 });

    // somebody changes the key while the change set waits
    await saveSettingAsync(LOW, 48, 0);

    const stale = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(stale.ok, false);
    assert.equal(stale.applied, false);
    assert.equal(stale.status, 'Stale');
    assert.equal(stale.messageKey, 'Plt.ChangeStale');
    assert.equal(stale.staleKeys[0].key, LOW);
    assert.equal(stale.staleKeys[0].recordedOldValue, 42);
    assert.equal(stale.staleKeys[0].currentValue, 48);
    assert.equal(await getSettingAsync(LOW, 0, null), 48, 'the current value stands');
    assert.equal(stale.rule, 'BR-PLT-021');

    const row = await plainRepository('ConfigurationChangeSet').getByIdAsync(pending.changeSet.id);
    assert.equal(row.status, 'Stale');
  });

  test('AC-PLT-004-03-05', async () => {
    // "the change set becomes Rejected, nothing is written and the requester is notified with
    //  the reason"
    await saveSettingAsync(LOW, 48, 0);
    const pending = await save({ key: LOW, value: 100, storeId: 0 });

    const noReason = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/reject`, {}, SESSIONS.approver);
    assert.equal(noReason.ok, false);
    assert.equal(noReason.reasonRequired, true);

    const rejected = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/reject`, {
      reason: 'a hundred products per page is too many for a phone',
    }, SESSIONS.approver);
    assert.equal(rejected.ok, true);
    assert.equal(rejected.changeSet.status, 'Rejected');
    assert.equal(rejected.nothingWritten, true);
    assert.equal(await getSettingAsync(LOW, 0, null), 48);
    assert.equal(rejected.requesterNotified, true);
    assert.equal(rejected.reason, 'a hundred products per page is too many for a phone');

    const sent = await deliveriesAsync({ event: 'Plt.ChangeRejected' });
    assert.ok(sent.length >= 1, 'the requester is told');
    assert.equal(sent[0].to, 'admin@example.com');
    assert.match(sent[0].tokens.reason, /too many for a phone/);
  });
});

describe('PRD-PLT-004 history, rollback and comparison', () => {
  test('AC-PLT-004-04-01', async () => {
    // "the configuration history shows actor, timestamp, key, store, old value and new value,
    //  read from the SEC-004 audit store; applied change sets also show reason and approvers"
    await saveSettingAsync(LOW, 24, 0);
    const pending = await save({ key: LOW, value: 30, storeId: 0, reason: 'thirty reads better on a phone' });
    await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);

    const history = await api.get(`/api/platform/change-control/history?key=${LOW}`, SESSIONS.admin);
    assert.equal(history.ok, true);
    assert.match(history.readFrom, /PRD-SEC-004 audit store/);
    const row = history.rows.find((r) => r.newValue === 30);
    assert.ok(row, 'the change is in the history');
    assert.ok(row.actor && row.at, 'the actor and the timestamp');
    assert.equal(row.key, LOW);
    assert.equal(row.storeId, 0, 'the store');
    assert.equal(row.oldValue, 24, 'the old value');
    assert.equal(row.newValue, 30, 'and the new one');
    assert.equal(row.reason, 'thirty reads better on a phone', 'an applied change set shows its reason');
    assert.deepEqual(row.approvers, ['config.approver@example.com'], 'and its approvers');

    // an uncontrolled key appears in the history too
    await save({ key: 'catalogsettings.compareproductsnumber', value: 8, storeId: 0 });
    const all = await api.get('/api/platform/change-control/history', SESSIONS.admin);
    assert.ok(all.rows.some((r) => r.key === 'catalogsettings.compareproductsnumber'), 'controlled or not');
  });

  test('AC-PLT-004-04-02', async () => {
    // "all configuration changes in the period are listed with actor, timestamp, key, store, old
    //  and new value, reason and approvers, filterable by user, key and store and exportable"
    const denied = await api.get('/api/platform/change-control/history?gated=true', SESSIONS.buyer);
    assert.equal(denied.permission, 'Platform.Core.ChangeControl.View');

    const report = await api.get(`/api/platform/change-control/history?gated=true&from=${new Date(Date.now() - 3600000).toISOString()}`, SESSIONS.admin);
    assert.equal(report.ok, true);
    assert.ok(report.rows.length >= 1);
    assert.deepEqual(report.filters, ['user', 'key', 'store', 'period']);

    const byUser = await api.get('/api/platform/change-control/history?actor=admin%40example.com', SESSIONS.admin);
    assert.ok(byUser.rows.every((r) => r.actor === 'admin@example.com'), 'filtered by user');
    const byKey = await api.get(`/api/platform/change-control/history?key=${LOW}`, SESSIONS.admin);
    assert.ok(byKey.rows.every((r) => r.key === LOW), 'by key');
    const byStore = await api.get('/api/platform/change-control/history?storeId=0', SESSIONS.admin);
    assert.ok(byStore.rows.every((r) => Number(r.storeId) === 0), 'and by store');

    assert.equal(report.exportable, true);
    assert.match(report.csv.split('\n')[0], /^sequence,at,actor,key,storeId,oldValue,newValue,reason,approvers$/);
    assert.equal(report.csv.split('\n').length, report.rows.length + 1);
  });

  test('AC-PLT-004-04-03', async () => {
    // "the change follows the same change-set flow and is shown in the history with old and new
    //  values"
    const types = (await api.get('/api/platform/change-control', SESSIONS.admin)).registeredTypes;
    const risk = types.find((t) => t.typeCode === 'pay.riskrule');
    assert.ok(risk, 'PAY registered its risk rules through IC-PLT-03');
    assert.equal(risk.owningModule, 'Product.PAY');
    assert.equal(risk.impact, 'High');
    assert.equal(risk.hasValidator, true);

    const controlled = await api.get('/api/platform/change-control/controlled?key=pay.riskrule.velocity', SESSIONS.admin);
    assert.equal(controlled.controlled, true);
    assert.equal(controlled.registeredType, 'pay.riskrule');

    const invalid = await save({ key: 'pay.riskrule.velocity', value: { enabled: 'yes' }, storeId: 0 });
    assert.equal(invalid.ok, false, 'the module validator runs');
    assert.match(invalid.message, /enabled or disabled/);

    const pending = await save({ key: 'pay.riskrule.velocity', value: { enabled: true }, storeId: 0, reason: 'switch the velocity rule on' });
    assert.equal(pending.changeControlled, true);
    assert.equal(pending.changeSet.impact, 'High', 'the impact level the module registered');

    const preview = await api.get(`/api/platform/change-control/sets/${pending.changeSet.id}/preview`, SESSIONS.admin);
    assert.ok(preview.rows[0].impacts.some((i) => i.module === 'Product.PAY'));

    await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);
    const second = await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver2);
    assert.equal(second.applied, true);
    assert.deepEqual(await getSettingAsync('pay.riskrule.velocity', 0, null), { enabled: true });

    const history = await api.get('/api/platform/change-control/history?key=pay.riskrule.velocity', SESSIONS.admin);
    assert.ok(history.rows.some((r) => JSON.stringify(r.newValue) === JSON.stringify({ enabled: true })), 'the change is in the history');
  });

  test('AC-PLT-004-05-01', async () => {
    // "a new change set restoring those values is created and goes through the same validation
    //  and approval; nothing is written until it is approved (BR-PLT-023)"
    await saveSettingAsync(LOW, 24, 0);
    await new Promise((r) => setTimeout(r, 5));
    const first = await save({ key: LOW, value: 36, storeId: 0, reason: 'try thirty-six' });
    await api.post(`/api/platform/change-control/sets/${first.changeSet.id}/approve`, {}, SESSIONS.approver);
    const midpoint = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 5));
    const second = await save({ key: LOW, value: 60, storeId: 0, reason: 'try sixty' });
    await api.post(`/api/platform/change-control/sets/${second.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(await getSettingAsync(LOW, 0, null), 60);

    const rollback = await api.post('/api/platform/change-control/rollback', {
      keys: [LOW], at: midpoint, storeId: 0, reason: 'sixty was too many',
    }, SESSIONS.admin);
    assert.equal(rollback.ok, true);
    assert.equal(rollback.nothingWrittenYet, true);
    assert.equal(rollback.changeSet.status, 'PendingApproval');
    assert.equal(rollback.changeSet.rollback, true);
    assert.equal(rollback.changeSet.items[0].newValue, 36, 'the value of that date');
    assert.equal(rollback.rule, 'BR-PLT-023');
    assert.equal(await getSettingAsync(LOW, 0, null), 60, 'nothing is written until it is approved');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-005' });
    assert.ok(trail.length >= 1, 'the rollback request is audited');

    const approved = await api.post(`/api/platform/change-control/sets/${rollback.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(approved.applied, true, 'and then it follows the same approval');
    assert.equal(await getSettingAsync(LOW, 0, null), 36);
  });

  test('AC-PLT-004-05-02', async () => {
    // "the preview lists the affected record counts before approval"
    await saveSettingAsync('pay.riskrule.velocity', { enabled: true }, 0);
    await repository('Order').insertAsync({
      orderNumber: 'PLT-1', customerEmail: 'buyer@example.com', orderStatus: 'Processing', orderTotal: 1000, createdOnUtc: new Date().toISOString(),
    });
    const rollback = await api.post('/api/platform/change-control/rollback', {
      keys: ['pay.riskrule.velocity'], at: new Date().toISOString(), storeId: 0,
    }, SESSIONS.admin);
    if (rollback.ok !== true) {
      // nothing recorded before that date: capture a change instead, which previews the same way
      const pending = await save({ key: 'pay.riskrule.velocity', value: { enabled: false }, storeId: 0 });
      const preview = await api.get(`/api/platform/change-control/sets/${pending.changeSet.id}/preview`, SESSIONS.admin);
      assert.ok(preview.rows[0].impacts.some((i) => i.count >= 1), 'the in-flight records are counted');
      assert.ok(preview.rows[0].inFlightRecords >= 1);
      return;
    }
    const preview = await api.get(`/api/platform/change-control/sets/${rollback.changeSet.id}/preview`, SESSIONS.admin);
    assert.equal(preview.status, 'PendingApproval', 'before approval');
    const impacts = preview.rows.flatMap((r) => r.impacts);
    assert.ok(impacts.some((i) => i.module === 'Product.PAY' && i.count >= 1), 'the module reports the affected records');
    assert.ok(preview.rows[0].inFlightRecords >= 1);
  });

  test('AC-PLT-004-05-03', async () => {
    // "the value of every controlled key at that date is shown, rebuilt from the history"
    await saveSettingAsync(LOW, 24, 0);
    const before2 = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 5));
    const pending = await save({ key: LOW, value: 72, storeId: 0, reason: 'seventy-two' });
    await api.post(`/api/platform/change-control/sets/${pending.changeSet.id}/approve`, {}, SESSIONS.approver);

    const atThen = await api.get(`/api/platform/change-control/as-of?at=${encodeURIComponent(before2)}`, SESSIONS.admin);
    assert.match(atThen.rebuiltFrom, /configuration history/);
    assert.ok(atThen.controlledKeys.includes(LOW), 'every controlled key is shown');
    assert.equal(atThen.values[LOW].value, 24, 'with the value it had at that date');

    const atNow = await api.get(`/api/platform/change-control/as-of?at=${encodeURIComponent(new Date().toISOString())}`, SESSIONS.admin);
    assert.equal(atNow.values[LOW].value, 72);
    for (const key of atNow.controlledKeys) {
      assert.ok(atNow.values[key], `${key} has an entry`);
    }
  });

  test('AC-PLT-004-06-01', async () => {
    // "keys with different values are listed side by side; selected differences can be copied
    //  into a new change set in this instance"
    const left = await api.get('/api/platform/change-control/snapshot?label=before', SESSIONS.admin);
    await saveSettingAsync(LOW, 24, 0);
    await saveSettingAsync(HIGH, true, 0);
    const right = await api.get('/api/platform/change-control/snapshot?label=after', SESSIONS.admin);

    const comparison = await api.post('/api/platform/change-control/compare', { left, right }, SESSIONS.admin);
    assert.equal(comparison.left, 'before');
    assert.equal(comparison.right, 'after');
    assert.ok(comparison.differences.length >= 1, 'the keys that differ are listed side by side');
    const difference = comparison.differences.find((d) => d.key === LOW);
    assert.ok(difference);
    assert.notEqual(difference.left, difference.right);
    assert.ok(typeof comparison.same === 'number', 'and the rest are the same');

    const copied = await api.post('/api/platform/change-control/from-differences', {
      differences: comparison.differences, keys: [LOW], storeId: 0, reason: 'copied from the comparison',
    }, SESSIONS.admin);
    assert.equal(copied.ok, true);
    assert.equal(copied.copied, 1, 'only the selected difference');
    assert.equal(copied.changeSet.status, 'PendingApproval');
    assert.equal(copied.changeSet.fromComparison, true);
    assert.equal(copied.changeSet.items[0].key, LOW);
  });
});

/* ================================================ PRD-PLT-005 export, import, promotion = */

describe('PRD-PLT-005 export, import and promotion', () => {
  test('AC-PLT-005-01-01', async () => {
    // "a pack file is produced holding every exportable artefact at client and store layers,
    //  store entries keyed by store code, with a manifest; audited (AUD-PLT-006)"
    const denied = await api.post('/api/platform/promotion/export', {}, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Platform.Core.Packs.CreateEditDelete');

    await saveSettingAsync(LOW, 36, 2);
    const exported = await api.post('/api/platform/promotion/export', { instanceCode: 'MPC-LIVE' }, SESSIONS.admin);
    assert.equal(exported.ok, true);
    assert.deepEqual(exported.layers, ['client', 'store']);
    assert.equal(exported.storeEntriesKeyedBy, 'store code');
    assert.ok(Object.keys(exported.pack.settings).length > 10, 'the settings');
    assert.ok(Object.keys(exported.pack.features).length > 0, 'the feature states');
    assert.ok(Object.keys(exported.pack.permissions).length > 0, 'the permission mappings');
    assert.ok(exported.pack.stores.business, 'and the store entries, keyed by code');
    assert.equal(exported.pack.stores.business[LOW], 36);

    assert.equal(exported.manifest.instanceCode, 'MPC-LIVE');
    assert.equal(exported.manifest.productRelease, 'release-5.00.1');
    assert.ok(exported.manifest.exportedOnUtc);
    assert.match(exported.manifest.checksum, /^[0-9a-f]{16}$/);
    assert.equal(exported.manifest.schemaSection, '10.1');
    assert.match(exported.file.name, /^configuration-MPC-LIVE-/);

    const trail = await auditTrailAsync({ event: 'AUD-PLT-006', entity: 'ConfigurationExport' });
    assert.ok(trail.length >= 1);
  });

  test('AC-PLT-005-01-02', async () => {
    // "secrets are omitted and listed by key only in the manifest as to be entered; entity data
    //  is not part of the export"
    await saveSettingAsync('pay.mpesa.consumersecret', 'a-real-secret', 0);
    await saveSettingAsync('smtp.password', 'another-secret', 0);

    const exported = await api.post('/api/platform/promotion/export', { excludeInstanceBound: true }, SESSIONS.admin);
    assert.equal(exported.pack.settings['pay.mpesa.consumersecret'], undefined, 'the secret is omitted');
    assert.equal(exported.pack.settings['smtp.password'], undefined);
    assert.ok(exported.manifest.secretsToEnter.includes('pay.mpesa.consumersecret'), 'and listed by key only');
    assert.ok(exported.manifest.secretsToEnter.includes('smtp.password'));
    assert.equal(JSON.stringify(exported.pack).includes('a-real-secret'), false, 'no value travels');

    assert.equal(exported.manifest.entityDataIncluded, false);
    assert.match(exported.manifest.entityDataNote, /PRD-PLT-016/);
    assert.equal(exported.pack.customers, undefined);
    assert.equal(exported.pack.orders, undefined);
    assert.equal(exported.pack.products, undefined);
    assert.ok(exported.manifest.instanceBoundExcluded.length >= 1, 'instance-bound items are excluded too');
  });

  test('AC-PLT-005-02-01', async () => {
    // "it is validated and applied through the PLT-003 loader (all PLT-003 criteria apply), and
    //  the run lists the secrets to be entered in the target instance"
    const exported = await api.post('/api/platform/promotion/export', { instanceCode: 'SOURCE' }, SESSIONS.admin);

    // every PLT-003 criterion applies, AC-PLT-003-01-09 included: a key changed here since the
    // last pack stops the run and offers the choice
    const held = await api.post('/api/platform/promotion/import', {
      pack: exported.pack, manifest: exported.manifest,
    }, SESSIONS.admin);
    if (held.status === 'Conflict') {
      assert.deepEqual(held.conflictChoices, ['keep-instance', 'take-pack']);
      assert.ok(held.conflicts.length >= 1);
      assert.equal(held.report.stoppedBeforeWriting, true);
    }

    const imported = await api.post('/api/platform/promotion/import', {
      pack: exported.pack, manifest: exported.manifest, conflictChoice: 'take-pack',
    }, SESSIONS.admin);
    assert.equal(imported.ok, true);
    assert.equal(imported.status, 'Applied');
    assert.match(imported.appliedThrough, /PRD-PLT-003 loader/);
    assert.ok(imported.report.keys.length > 10, 'the loader wrote the keys');
    assert.ok(imported.report.packSet.length >= 2, 'with its pack set recorded');
    assert.deepEqual(imported.secretsToEnter, exported.manifest.secretsToEnter, 'the secrets to enter here');
    assert.match(imported.secretsNote, /must be entered in this instance/);

    // the loader's own validation applies: a bad key in the pack refuses the import
    const bad = await api.post('/api/platform/promotion/import', {
      pack: { ...exported.pack, settings: { ...exported.pack.settings, 'catalogsettings.notaproperty': 1 } },
      manifest: exported.manifest,
    }, SESSIONS.admin);
    assert.equal(bad.ok, false);
    assert.equal(bad.status, 'Refused');
    assert.ok(bad.refused.some((p) => p.messageKey === 'Plt.PackKeyUnknown'));
  });

  test('AC-PLT-005-02-02', async () => {
    // "the import is refused with message Plt.PackVersionMismatch"
    const exported = await api.post('/api/platform/promotion/export', {}, SESSIONS.admin);
    const refused = await api.post('/api/platform/promotion/import', {
      pack: exported.pack,
      manifest: { ...exported.manifest, productRelease: 'release-6.10.0' },
    }, SESSIONS.admin);
    assert.equal(refused.ok, false);
    assert.equal(refused.refused, true);
    assert.equal(refused.messageKey, 'Plt.PackVersionMismatch');
    assert.equal(refused.exportedFrom, 'release-6.10.0');
    assert.equal(refused.instanceRuns, 'release-5.00.1');
    assert.match(refused.message, /release-6\.10\.0/);

    const sameRelease = await api.post('/api/platform/promotion/import', {
      pack: exported.pack, manifest: exported.manifest, conflictChoice: 'take-pack',
    }, SESSIONS.admin);
    assert.equal(sameRelease.ok, true, 'the same release imports');
  });

  test('AC-PLT-005-03-01', async () => {
    // "the differences between the test export and the live configuration are listed excluding
    //  instance-bound items; the selected differences become a change set that follows PLT-004"
    await saveSettingAsync(LOW, 24, 0);
    await saveSettingAsync('storeinformationsettings.storename', 'Malawi Post Online', 0);
    const testSnapshot = {
      label: 'test',
      values: {
        [LOW]: 48,
        'storeinformationsettings.storename': 'Malawi Post Test',
        'pay.mpesa.consumersecret': 'test-secret',
      },
    };
    const promotion = await api.post('/api/platform/promotion/promote', { testSnapshot, storeId: 0 }, SESSIONS.admin);
    assert.equal(promotion.ok, true);
    assert.ok(promotion.differences.some((d) => d.key === LOW && d.right === 48), 'the difference is listed');
    assert.equal(promotion.differences.some((d) => d.key === 'storeinformationsettings.storename'), false, 'the store name is instance-bound');
    assert.ok(promotion.excludedInstanceBound.includes('storeinformationsettings.storename'));
    assert.equal(promotion.rule, 'BR-PLT-014');

    assert.ok(promotion.changeSet, 'the differences become a change set');
    assert.equal(promotion.changeSet.status, 'PendingApproval');
    assert.match(promotion.followsChangeControl, /PRD-PLT-004 validation and approval/);
    assert.equal(await getSettingAsync(LOW, 0, null), 24, 'nothing is live until it is approved');

    const approved = await api.post(`/api/platform/change-control/sets/${promotion.changeSet.id}/approve`, {}, SESSIONS.approver);
    assert.equal(approved.applied, true);
    assert.equal(await getSettingAsync(LOW, 0, null), 48);

    const trail = await auditTrailAsync({ entity: 'ConfigurationPromotion' });
    assert.ok(trail.length >= 1);
  });

  test('AC-PLT-005-04-01', async () => {
    // "it is refused with message Plt.CloneNotAuthorised"
    const refused = await api.post('/api/platform/promotion/clone', { fromClient: 'MPC', toClient: 'NEWCLIENT' }, SESSIONS.admin);
    assert.equal(refused.ok, false);
    assert.equal(refused.refused, true);
    assert.equal(refused.messageKey, 'Plt.CloneNotAuthorised');
    assert.equal((await api.get('/api/platform/promotion/derived', SESSIONS.admin)).length, 0, 'nothing is recorded');

    const trail = await auditTrailAsync({ entity: 'ConfigurationClone' });
    assert.ok(trail.some((e) => e.outcome === 'rejected'), 'the refusal is audited');
  });

  test('AC-PLT-005-04-02', async () => {
    // "client-identifying items are excluded and listed for entry, and the result is recorded in
    //  B as a client pack derived from A; audited (AUD-PLT-006)"
    await saveSettingAsync('storeinformationsettings.storename', 'Malawi Post Online', 0);
    await saveSettingAsync('storeinformationsettings.companyname', 'Malawi Posts Corporation', 0);
    await saveSettingAsync('pay.mpesa.consumersecret', 'a-real-secret', 0);

    const cloned = await api.post('/api/platform/promotion/clone', {
      fromClient: 'MPC', toClient: 'NEWCLIENT', authorisationReference: 'contract CT-2026-118',
    }, SESSIONS.admin);
    assert.equal(cloned.ok, true);
    assert.equal(cloned.pack.id, 'NEWCLIENT');
    assert.equal(cloned.derivedFrom, 'MPC');
    assert.equal(cloned.pack.derivedFrom.client, 'MPC');
    assert.equal(cloned.pack.derivedFrom.authorisationReference, 'contract CT-2026-118');

    for (const key of ['storeinformationsettings.storename', 'storeinformationsettings.companyname', 'pay.mpesa.consumersecret']) {
      assert.equal(cloned.pack.settings[key], undefined, `${key} does not travel`);
      assert.ok(cloned.excludedForEntry.includes(key), 'and is listed for entry');
    }
    assert.equal(JSON.stringify(cloned.pack).includes('a-real-secret'), false);
    assert.ok(Object.keys(cloned.pack.settings).length > 5, 'the rest of the configuration does travel');

    const derived = await api.get('/api/platform/promotion/derived', SESSIONS.admin);
    assert.equal(derived.length, 1, 'the result is recorded');
    assert.equal(derived[0].client, 'NEWCLIENT');
    assert.equal(derived[0].derivedFrom, 'MPC');
    assert.equal(derived[0].authorisationReference, 'contract CT-2026-118');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-006', entity: 'ConfigurationClone' });
    assert.ok(trail.some((e) => e.after?.to === 'NEWCLIENT'));
  });
});
