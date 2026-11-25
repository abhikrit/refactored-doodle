// PRD-PLT-020 Data retention and archival - 11 ACs. One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync, auditAsync } from '../../packages/server/src/core/audit.js';
import { lockHistory } from '../../packages/server/src/core/locker.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const daysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString();

const rule = (body) => api.post('/api/platform/retention/rules', body, SESSIONS.admin);
const run = (body = {}) => api.post('/api/platform/retention/run', body, SESSIONS.admin);

/** An order of a given age, with no open payment, refund or receivable. */
async function oldOrderAsync({ days, number, extra = {} }) {
  return repository('Order').insertAsync({
    orderNumber: number,
    customerEmail: 'buyer@example.com',
    customerPhone: '+265880000001',
    orderStatus: 'Complete',
    orderTotal: 12000,
    outstandingAmount: 0,
    createdOnUtc: daysAgo(days),
    ...extra,
  });
}

describe('PRD-PLT-020 the rules and the run', () => {
  test('AC-PLT-020-01-01', async () => {
    // "records older than the period are processed by the action in batches; counts per type and
    //  action are written to the retention run log (AUD-PLT-009)"
    const denied = await rule({ recordType: 'orders', period: 365, unit: 'days', action: 'Delete' });
    assert.equal(denied.ok, true, 'an administrator may save a rule');

    const noPermission = await api.post('/api/platform/retention/rules', {
      recordType: 'logs', period: 30, unit: 'days', action: 'Delete',
    }, SESSIONS.buyer);
    assert.equal(noPermission.permission, 'Platform.Core.Retention.CreateEditDelete');

    const saved = await rule({
      recordType: 'payments', period: 7, unit: 'years', action: 'Archive', layer: 'country',
    });
    assert.equal(saved.rule.recordType, 'payments');
    assert.equal(saved.rule.layer, 'country', 'a rule carries its layer: country then client');
    assert.equal(saved.rule.action, 'Archive');
    assert.equal(saved.rule.isActive, true);

    for (let i = 1; i <= 5; i += 1) await oldOrderAsync({ days: 400 + i, number: `RET-OLD-${i}` });
    await oldOrderAsync({ days: 10, number: 'RET-NEW-1' });

    const result = await run({ recordType: 'orders', batchSize: 2 });
    assert.equal(result.ok, true);
    assert.equal(result.lockKey, 'plt-retention-run');
    const counts = result.counts.find((c) => c.recordType === 'orders');
    assert.equal(counts.action, 'Delete');
    assert.equal(counts.processed, 5, 'only the records older than the period');
    assert.equal(counts.deleted, 5);
    assert.equal(counts.batches, 3, 'processed in batches of the given size');
    assert.equal(result.run.status, 'Completed');
    assert.ok(result.run.startedOnUtc && result.run.finishedOnUtc);

    assert.ok(await repository('Order').getOneAsync((o) => o.orderNumber === 'RET-NEW-1'), 'a record inside the period stays');

    const runs = await api.get('/api/platform/retention/runs', SESSIONS.admin);
    assert.ok(runs.length >= 1, 'the run log');
    assert.ok(runs[runs.length - 1].counts.length >= 1, 'with counts per type and action');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-009', entity: 'RetentionRun' });
    assert.ok(trail.length >= 1, 'AUD-PLT-009 is written for the run');
    assert.ok(trail[0].after.counts.some((c) => c.recordType === 'orders' && c.deleted === 5));
    assert.ok(lockHistory().some((l) => l.key === 'plt-retention-run'));
  });

  test('AC-PLT-020-01-02', async () => {
    // "they are physically removed through the repository predicate delete, because the per-entity
    //  delete only sets Deleted for soft-deletable entities such as Order, Customer and Product"
    await rule({ recordType: 'orders', period: 365, unit: 'days', action: 'Delete' });
    const order = await oldOrderAsync({ days: 500, number: 'RET-PHYSICAL-1' });

    // the contrast the criterion draws: the per-entity delete of a soft-deletable entity
    const soft = await oldOrderAsync({ days: 500, number: 'RET-SOFT-1' });
    await plainRepository('Order').softDeleteAsync(soft);
    const afterSoft = await repository('Order').getByIdAsync(soft.id);
    assert.equal(afterSoft.deleted, true, 'the soft delete only sets Deleted');
    assert.ok(afterSoft, 'the row is still there');

    const result = await run({ recordType: 'orders' });
    const counts = result.counts.find((c) => c.recordType === 'orders');
    assert.equal(counts.physicalRemoval, true);
    assert.equal(counts.removedThrough, 'the repository predicate delete');
    assert.equal(counts.softDeletableEntity, true, 'Order is soft-deletable, which is why retention uses the predicate delete');

    assert.equal(await repository('Order').getByIdAsync(order.id), null, 'the row is gone from the live store');
    assert.equal(await repository('Order').getOneAsync((o) => o.orderNumber === 'RET-PHYSICAL-1'), null);
    assert.equal(await repository('Order').getByIdAsync(soft.id), null, 'the soft-deleted row is removed too');
  });

  test('AC-PLT-020-01-03', async () => {
    // "they are written to the archive store with a manifest and checksum, verified, and only
    //  then removed from the live database"
    await rule({ recordType: 'doc.documents', period: 30, unit: 'days', action: 'Archive' });
    const kept = [];
    for (let i = 1; i <= 3; i += 1) {
      kept.push(await repository('GeneratedDocument').insertAsync({
        documentType: 'Invoice', reference: `INV-ARCH-${i}`, createdOnUtc: daysAgo(60 + i),
      }));
    }
    const recent = await repository('GeneratedDocument').insertAsync({ documentType: 'Invoice', reference: 'INV-NEW', createdOnUtc: daysAgo(2) });

    const result = await run({ recordType: 'doc.documents' });
    const counts = result.counts.find((c) => c.recordType === 'doc.documents');
    assert.equal(counts.archived, 3);
    assert.equal(counts.archiveVerifiedBeforeRemoval, true);

    const archive = await api.get('/api/platform/retention/archive?recordType=doc.documents', SESSIONS.admin);
    assert.equal(archive.entries.length, 1);
    const entry = archive.entries[0];
    assert.equal(entry.count, 3, 'the manifest counts the records');
    assert.match(entry.checksum, /^[0-9a-f]{16}$/, 'and carries a checksum');
    assert.equal(entry.verified, true, 'the copy is verified');

    const full = await api.get(`/api/platform/retention/archive/${entry.id}`, SESSIONS.admin);
    assert.deepEqual(full.manifest.ids, kept.map((k) => k.id));
    assert.equal(full.rows.length, 3);
    assert.equal(full.manifest.entity, 'GeneratedDocument');

    for (const doc of kept) {
      assert.equal(await repository('GeneratedDocument').getByIdAsync(doc.id), null, 'and only then is the live row removed');
    }
    assert.ok(await repository('GeneratedDocument').getByIdAsync(recent.id), 'a record inside the period is untouched');
  });

  test('AC-PLT-020-01-04', async () => {
    // "it is skipped and counted as held (BR-PLT-050)" - a legal hold or a link to an open
    // payment, refund, dispute or receivable
    await rule({ recordType: 'orders', period: 365, unit: 'days', action: 'Delete' });

    const openPayment = await oldOrderAsync({ days: 500, number: 'RET-HOLD-PAY' });
    await repository('PaymentTransaction').insertAsync({ orderId: openPayment.id, status: 'Pending', amount: 12000 });
    const openRefund = await oldOrderAsync({ days: 500, number: 'RET-HOLD-REFUND' });
    await repository('ReturnRequest').insertAsync({ orderId: openRefund.id, status: 'Requested' });
    const receivable = await oldOrderAsync({ days: 500, number: 'RET-HOLD-RECEIVABLE', extra: { outstandingAmount: 4500 } });
    const legalHold = await oldOrderAsync({ days: 500, number: 'RET-HOLD-LEGAL', extra: { legalHold: true } });
    const free = await oldOrderAsync({ days: 500, number: 'RET-FREE' });

    for (const [order, expected] of [
      [openPayment, 'an open payment'],
      [openRefund, 'an open refund or dispute'],
      [receivable, 'an open receivable'],
      [legalHold, 'a legal hold (PRD-DOC-002)'],
    ]) {
      const held = await api.get(`/api/platform/retention/hold?recordType=orders&entityId=${order.id}`, SESSIONS.admin);
      assert.equal(held.held, true, `${order.orderNumber} is held`);
      assert.equal(held.reason, expected);
      assert.equal(held.rule, 'BR-PLT-050');
    }
    assert.equal((await api.get(`/api/platform/retention/hold?recordType=orders&entityId=${free.id}`, SESSIONS.admin)).held, false);

    const result = await run({ recordType: 'orders' });
    const counts = result.counts.find((c) => c.recordType === 'orders');
    assert.equal(counts.held, 4, 'the four held records are counted as held');
    assert.equal(counts.deleted, 1, 'and only the free one is processed');
    assert.ok(counts.heldReasons.includes('an open payment'));
    assert.ok(counts.heldReasons.includes('a legal hold (PRD-DOC-002)'));

    for (const order of [openPayment, openRefund, receivable, legalHold]) {
      assert.ok(await repository('Order').getByIdAsync(order.id), `${order.orderNumber} is still there`);
    }
    assert.equal(await repository('Order').getByIdAsync(free.id), null);
  });

  test('AC-PLT-020-01-05', async () => {
    // "the matching native settings are set from the rule (CommonSettings.ClearLogOlderThanDays,
    //  GdprSettings.DeleteInactiveCustomersAfterMonths) so there is one source of the value"
    const logs = await rule({ recordType: 'logs', period: 45, unit: 'days', action: 'Delete' });
    assert.equal(logs.ok, true);
    assert.equal(logs.nativeSetting.key, 'commonsettings.clearlogolderthandays');
    assert.equal(logs.nativeSetting.value, 45);
    assert.equal(logs.nativeSetting.task, 'ClearLogTask');
    assert.equal(logs.nativeSetting.written, true);
    assert.equal(await getSettingAsync('commonsettings.clearlogolderthandays', 0, null), 45);

    const inactive = await rule({ recordType: 'iam.inactivecustomers', period: 24, unit: 'months', action: 'Delete' });
    assert.equal(inactive.nativeSetting.key, 'gdprsettings.deleteinactivecustomersaftermonths');
    assert.equal(inactive.nativeSetting.value, 24);
    assert.equal(inactive.nativeSetting.task, 'DeleteInactiveCustomersTask');
    assert.equal(await getSettingAsync('gdprsettings.deleteinactivecustomersaftermonths', 0, null), 24);

    const tasks = await api.get('/api/platform/retention/native-tasks', SESSIONS.admin);
    assert.deepEqual(tasks.tasks.map((t) => t.name), ['ClearLogTask', 'DeleteInactiveCustomersTask', 'DeleteGuestsTask']);
    assert.equal(tasks.tasks.find((t) => t.name === 'ClearLogTask').value, 45);
    assert.equal(tasks.tasks.find((t) => t.name === 'DeleteInactiveCustomersTask').value, 24);
    assert.match(tasks.oneSourceOfTheValue, /the retention rule sets the native setting/);

    const changed = await rule({ recordType: 'logs', period: 60, unit: 'days', action: 'Delete' });
    assert.equal(changed.nativeSetting.value, 60, 'changing the rule changes the native setting');
    assert.equal(await getSettingAsync('commonsettings.clearlogolderthandays', 0, null), 60);
  });

  test('AC-PLT-020-01-06', async () => {
    // "the change is recorded with old and new values (AUD-PLT-009) and, if the key is
    //  controlled, follows PLT-004"
    const created = await rule({ recordType: 'iam.authevents', period: 180, unit: 'days', action: 'Anonymise' });
    assert.equal(created.recorded, true);
    assert.equal(created.auditEvent, 'AUD-PLT-009');
    const changed = await rule({ recordType: 'iam.authevents', period: 90, unit: 'days', action: 'Delete' });
    assert.equal(changed.ok, true);

    const trail = await auditTrailAsync({ event: 'AUD-PLT-009', entity: 'RetentionRule' });
    const entry = trail.find((e) => e.after?.period === 90);
    assert.ok(entry, 'the change is recorded');
    assert.equal(entry.before.period, 180, 'with the old value');
    assert.equal(entry.before.action, 'Anonymise');
    assert.equal(entry.after.action, 'Delete', 'and the new one');

    // a controlled native key follows PRD-PLT-004 instead of being written
    const controlled = [
      { key: 'commonsettings.clearlogolderthandays', type: 'number', min: 1, max: 3650, impact: 'Low' },
    ];
    await saveSettingAsync('plt.controlleditems', controlled, 0);
    const viaChangeControl = await rule({ recordType: 'logs', period: 90, unit: 'days', action: 'Delete' });
    assert.equal(viaChangeControl.ok, true, 'the rule is saved');
    assert.equal(viaChangeControl.nativeSetting.changeControlled, true);
    assert.equal(viaChangeControl.nativeSetting.written, false, 'the native key is not written yet');
    assert.equal(viaChangeControl.nativeSetting.messageKey, 'Plt.ChangePending');
    assert.equal(viaChangeControl.nativeSetting.followsChangeControl, 'PRD-PLT-004');
    assert.equal(await getSettingAsync('commonsettings.clearlogolderthandays', 0, null), 60, 'the live value is unchanged');

    const approved = await api.post(`/api/platform/change-control/sets/${viaChangeControl.nativeSetting.changeSetId}/approve`, {}, SESSIONS.approver);
    assert.equal(approved.applied, true);
    assert.equal(await getSettingAsync('commonsettings.clearlogolderthandays', 0, null), 90, 'and is written once the change is approved');

    const row = await repository('Setting').getOneAsync((s) => s.name === 'plt.controlleditems');
    await repository('Setting').deleteAsync(row.id);
  });

  test('AC-PLT-020-01-07', async () => {
    // "a rule can be set for each registered type, and the release registers at least: ..."
    const types = await api.get('/api/platform/retention/record-types', SESSIONS.admin);
    const codes = types.map((t) => t.code);
    for (const required of [
      'orders', 'payments', 'crm.tickets', 'logs',
      'doc.documents',
      'crm.calllogs', 'crm.inboundmessages', 'crm.ratings',
      'iam.authevents', 'iam.usersessions', 'iam.policyacceptances', 'iam.privacyrequests', 'iam.verificationcases', 'iam.otpchallenges',
      'ret.returndata', 'ret.disputecases', 'ret.casemessages', 'ret.evidencedownloads',
      'trk.trackingevents', 'trk.notificationlog',
      'sec.audittrail',
      'ai.chattranscripts',
      'adm.ruleevaluationlog', 'adm.workdrafts',
    ]) {
      assert.ok(codes.includes(required), `${required} is registered`);
    }
    // IC-PLT-08: each descriptor names its owning module, entity, date field and allowed actions
    const orders = types.find((t) => t.code === 'orders');
    assert.equal(orders.owningModule, 'Product.ORD');
    assert.equal(orders.entity, 'Order');
    assert.equal(orders.dateField, 'createdOnUtc');
    assert.deepEqual(orders.allowedActions, ['Archive', 'Anonymise', 'Delete']);
    assert.ok(types.filter((t) => t.hasHoldCheck).length >= 4, 'the types that need one supply a hold check');

    const screen = await api.get('/api/platform/retention/rules', SESSIONS.admin);
    assert.equal(screen.contract, 'IC-PLT-08');
    assert.equal(screen.rows.length, types.length, 'a rule can be set for each registered type');
    assert.ok(screen.rows.every((r) => r.ruleCanBeSet === true));
    assert.match(screen.periodNote, /Not stated in source/, 'BR-PLT-051: every period is not stated in source');
    const unset = screen.rows.find((r) => r.rule === null);
    assert.equal(unset.period, 'Not stated in source', 'a type without a rule has no hidden default');
    assert.deepEqual(screen.actions, ['Archive', 'Anonymise', 'Delete']);
    assert.deepEqual(screen.layers, ['country', 'client']);

    const refused = await rule({ recordType: 'not.aregisteredtype', period: 30, unit: 'days', action: 'Delete' });
    assert.equal(refused.ok, false);
    assert.match(refused.message, /IC-PLT-08/);
    const wrongAction = await rule({ recordType: 'iam.policyacceptances', period: 30, unit: 'days', action: 'Delete' });
    assert.equal(wrongAction.ok, false, 'a type allows only the actions it registered');
    assert.deepEqual(wrongAction.allowedActions, ['Archive']);
    const noPeriod = await rule({ recordType: 'iam.otpchallenges', action: 'Delete' });
    assert.equal(noPeriod.ok, false);
    assert.equal(noPeriod.rule, 'BR-PLT-051');
  });

  test('AC-PLT-020-01-08', async () => {
    // "the record is skipped and counted as held; it is never purged while held (BR-PLT-050)" -
    // the hold check a registered type supplies
    await rule({ recordType: 'ret.returndata', period: 30, unit: 'days', action: 'Delete' });
    const open = await repository('ReturnRequest').insertAsync({ status: 'Requested', reference: 'RET-OPEN', createdOnUtc: daysAgo(120) });
    const closed = await repository('ReturnRequest').insertAsync({ status: 'Closed', reference: 'RET-CLOSED', createdOnUtc: daysAgo(120) });

    const held = await api.get(`/api/platform/retention/hold?recordType=ret.returndata&entityId=${open.id}`, SESSIONS.admin);
    assert.equal(held.held, true);
    assert.equal(held.reason, 'an open return', 'the reason the registered hold check gives');

    const first = await run({ recordType: 'ret.returndata' });
    const counts = first.counts.find((c) => c.recordType === 'ret.returndata');
    assert.equal(counts.held, 1);
    assert.equal(counts.deleted, 1);
    assert.ok(await repository('ReturnRequest').getByIdAsync(open.id), 'the held record is never purged');
    assert.equal(await repository('ReturnRequest').getByIdAsync(closed.id), null);

    // it stays held on every later run, until the hold is gone
    const second = await run({ recordType: 'ret.returndata' });
    assert.equal(second.counts.find((c) => c.recordType === 'ret.returndata').held, 1);
    assert.ok(await repository('ReturnRequest').getByIdAsync(open.id));

    await repository('ReturnRequest').updateAsync({ ...open, status: 'Closed' });
    const third = await run({ recordType: 'ret.returndata' });
    assert.equal(third.counts.find((c) => c.recordType === 'ret.returndata').deleted, 1, 'and is processed once it is no longer held');
    assert.equal(await repository('ReturnRequest').getByIdAsync(open.id), null);
  });

  test('AC-PLT-020-01-09', async () => {
    // "only whole closed audit segments past the period are processed, by archive (verified copy)
    //  or removal with the signed checkpoint that SEC-004 writes (BR-SEC-016); single audit
    //  events are never deleted or anonymised"
    for (let i = 0; i < 3; i += 1) {
      await auditAsync({
        event: 'AUD-SEC-001', area: 'SEC', feature: 'PRD-SEC-004', entity: 'Customer', entityId: 900 + i, actor: 'admin@example.com', after: { marker: `segment-${i}` }, note: 'a segment event',
      });
    }
    const closed = await api.post('/api/security/audit/segments/close', {}, SESSIONS.admin);
    assert.equal(closed.ok, true);
    assert.equal(closed.rule, 'BR-SEC-016');
    const segment = closed.segment;
    assert.equal(segment.status, 'Closed');
    assert.ok(segment.signature, 'the checkpoint is signed');
    assert.ok(segment.lastSequence > segment.firstSequence);

    // make the closed segment older than the period
    const row = await plainRepository('AuditSegment').getByIdAsync(segment.id);
    await plainRepository('AuditSegment').updateAsync({ ...row, closedOnUtc: daysAgo(500) });

    const eventsBefore = (await auditTrailAsync({})).length;
    await rule({ recordType: 'sec.audittrail', period: 365, unit: 'days', action: 'Archive' });
    const result = await run({ recordType: 'sec.audittrail' });
    const counts = result.counts.find((c) => c.recordType === 'sec.audittrail');
    assert.equal(counts.wholeSegmentsOnly, true);
    assert.equal(counts.singleEventsTouched, 0, 'single events are never touched');
    assert.ok(counts.archived >= 3, 'the whole segment is archived');
    assert.equal(counts.checkpointKept, true);

    const archive = await api.get('/api/platform/retention/archive?recordType=sec.audittrail', SESSIONS.admin);
    assert.equal(archive.entries[0].verified, true, 'a verified copy');

    const segments = await api.get('/api/security/audit/segments', SESSIONS.admin);
    const after = segments.find((s) => s.number === segment.number);
    assert.equal(after.status, 'Removed');
    assert.equal(after.archivedBeforeRemoval, true);
    assert.equal(after.signature, segment.signature, 'the signed checkpoint is kept');

    const verified = await api.get('/api/security/audit/verify-from-checkpoint', SESSIONS.admin);
    assert.equal(verified.result, 'Verified', 'the chain still verifies from the checkpoint');
    assert.equal(verified.anchoredToCheckpoint, true);
    assert.equal(verified.checkpoint.segment, segment.number);
    assert.equal(verified.rule, 'BR-SEC-016');

    const remaining = (await auditTrailAsync({})).length;
    assert.ok(remaining < eventsBefore, 'the segment is gone from the live trail');

    // a segment that is not past the period is left alone
    const fresh = await api.post('/api/security/audit/segments/close', {}, SESSIONS.admin);
    const again = await run({ recordType: 'sec.audittrail' });
    assert.equal(again.counts.find((c) => c.recordType === 'sec.audittrail').processed, 0, 'a segment inside the period is not processed');
    assert.equal((await api.get('/api/security/audit/segments', SESSIONS.admin)).find((s) => s.number === fresh.segment.number).status, 'Closed');
  });
});

describe('PRD-PLT-020 tracking events', () => {
  test('AC-PLT-020-02-01', async () => {
    // "tracking events older than the period are archived or deleted per the rule"
    await plainRepository('TrackingEvent').deleteManyAsync(() => true);
    for (let i = 1; i <= 4; i += 1) {
      await repository('TrackingEvent').insertAsync({
        shipmentId: i, status: 'InTransit', description: `old event ${i}`, occurredOnUtc: daysAgo(200 + i),
      });
    }
    const recent = await repository('TrackingEvent').insertAsync({
      shipmentId: 9, status: 'Delivered', description: 'recent event', occurredOnUtc: daysAgo(3),
    });

    const saved = await rule({
      recordType: 'trk.trackingevents', period: 90, unit: 'days', action: 'Archive', archivePeriod: 365, archiveUnit: 'days',
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.rule.archivePeriod, 365);

    const result = await run({ recordType: 'trk.trackingevents' });
    const counts = result.counts.find((c) => c.recordType === 'trk.trackingevents');
    assert.equal(counts.processed, 4, 'the events past the period');
    assert.equal(counts.archived, 4, 'archived per the rule');
    assert.ok(await repository('TrackingEvent').getByIdAsync(recent.id), 'a recent event stays');
    assert.equal((await repository('TrackingEvent').getAllAsync()).length, 1);

    const archive = await api.get('/api/platform/retention/archive?recordType=trk.trackingevents', SESSIONS.admin);
    assert.equal(archive.entries[0].count, 4);
    assert.equal(archive.entries[0].verified, true);

    // the same rule with Delete removes them instead
    for (let i = 5; i <= 6; i += 1) {
      await repository('TrackingEvent').insertAsync({
        shipmentId: i, status: 'InTransit', description: `old event ${i}`, occurredOnUtc: daysAgo(300),
      });
    }
    await rule({ recordType: 'trk.trackingevents', period: 90, unit: 'days', action: 'Delete' });
    const deleted = await run({ recordType: 'trk.trackingevents' });
    assert.equal(deleted.counts.find((c) => c.recordType === 'trk.trackingevents').deleted, 2);
    assert.equal((await repository('TrackingEvent').getAllAsync()).length, 1, 'only the recent event is left');
  });

  test('AC-PLT-020-02-02', async () => {
    // "events past the active period move to the archive and stay searchable by staff; events
    //  past the archive period are deleted; notification-log entries follow their own rule; each
    //  run is logged (AUD-PLT-009)"
    await plainRepository('TrackingEvent').deleteManyAsync(() => true);
    await plainRepository('ArchiveEntry').deleteManyAsync((a) => a.recordType === 'trk.trackingevents');

    const pastActive = [];
    for (let i = 1; i <= 3; i += 1) {
      pastActive.push(await repository('TrackingEvent').insertAsync({
        shipmentId: i, status: 'InTransit', description: `past active ${i}`, occurredOnUtc: daysAgo(120),
      }));
    }
    const pastArchive = await repository('TrackingEvent').insertAsync({
      shipmentId: 99, status: 'Delivered', description: 'past the archive period', occurredOnUtc: daysAgo(800),
    });
    const inside = await repository('TrackingEvent').insertAsync({
      shipmentId: 100, status: 'Accepted', description: 'inside the active period', occurredOnUtc: daysAgo(5),
    });

    await rule({
      recordType: 'trk.trackingevents', period: 90, unit: 'days', action: 'Archive', archivePeriod: 365, archiveUnit: 'days',
    });
    await rule({ recordType: 'trk.notificationlog', period: 30, unit: 'days', action: 'Delete' });

    const oldNotice = await repository('MessageDelivery').insertAsync({
      event: 'Trk.Delivered', channel: 'sms', to: '+265880000001', status: 'Sent', createdOnUtc: daysAgo(120),
    });
    const newNotice = await repository('MessageDelivery').insertAsync({
      event: 'Trk.Delivered', channel: 'sms', to: '+265880000002', status: 'Sent', createdOnUtc: daysAgo(2),
    });

    const result = await api.post('/api/platform/retention/run-tracking', {}, SESSIONS.admin);
    assert.equal(result.ok, true);
    const counts = result.counts[0];
    assert.equal(counts.activePeriod, '90 days');
    assert.equal(counts.archivePeriod, '365 days');
    assert.equal(counts.movedToArchive, 4, 'everything past the active period moves to the archive');
    assert.equal(counts.deletedFromArchive, 1, 'and what is past the archive period is deleted');
    assert.equal(counts.stillSearchableByStaff, true);

    const archive = await api.get('/api/platform/retention/archive?recordType=trk.trackingevents', SESSIONS.admin);
    assert.equal(archive.searchableByStaff, true, 'the archive stays searchable by staff');
    const entry = await api.get(`/api/platform/retention/archive/${archive.entries[0].id}`, SESSIONS.admin);
    const archived = entry.rows.map((r) => r.id);
    for (const event of pastActive) assert.ok(archived.includes(event.id), 'the event is in the archive');
    assert.equal(archived.includes(pastArchive.id), false, 'the one past the archive period is gone');
    assert.ok(await repository('TrackingEvent').getByIdAsync(inside.id), 'an event inside the active period is untouched');

    assert.equal(result.notifications.ownRule, true, 'the notification log follows its own rule');
    assert.equal(result.notifications.rule, '30 days Delete');
    assert.equal(result.notifications.processed, 1);
    assert.equal(await repository('MessageDelivery').getByIdAsync(oldNotice.id), null);
    assert.ok(await repository('MessageDelivery').getByIdAsync(newNotice.id), 'a recent notification stays');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-009', entity: 'RetentionRun' });
    assert.ok(trail.some((e) => e.note === 'tracking retention run'), 'each run is logged');
    assert.equal(result.auditEvent, 'AUD-PLT-009');
  });
});
