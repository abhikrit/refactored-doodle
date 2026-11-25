// PRD-ADM-009 Exception management, PRD-ADM-010 Operational alerts, PRD-ADM-011 Template library
// and PRD-ADM-012 Template analytics and shared marketplace - one test per AC, named by AC ID.
// 5 + 3 + 6 + 3 = 17 criteria.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

/* ===================================================== PRD-ADM-009 exception management == */

describe('PRD-ADM-009 exception management', () => {
  test('AC-ADM-009-01-01', async () => {
    // "exceptions are listed by severity, then by age (oldest first), with filters by type,
    //  reason code and module"
    const queue = await api.get('/api/admin-console/exceptions', SESSIONS.operations);
    const order = ['Critical', 'High', 'Medium', 'Low'];
    const severities = queue.exceptions.map((e) => order.indexOf(e.severity));
    assert.deepEqual(severities, [...severities].sort((a, b) => a - b), 'by severity');
    const highs = queue.exceptions.filter((e) => e.severity === 'High');
    assert.deepEqual(highs.map((e) => e.raisedOnUtc), [...highs.map((e) => e.raisedOnUtc)].sort(), 'then oldest first');

    assert.ok(queue.filters.types.includes('IntegrationError'));
    assert.ok(queue.filters.reasonCodes.includes('UPSTREAM_ERROR'));
    assert.ok(queue.filters.modules.includes('PRD-PAY-027'));
    const filtered = await api.get('/api/admin-console/exceptions?reasonCode=UPSTREAM_ERROR', SESSIONS.operations);
    assert.ok(filtered.exceptions.every((e) => e.reasonCode === 'UPSTREAM_ERROR'));

    // modules raise them through IC-ADM-04 with type, severity, reason code, entity reference,
    // details and the allowed actions
    const raised = await api.post('/api/admin-console/exceptions', {
      type: 'IntegrationError', severity: 'Low', reasonCode: 'UPSTREAM_ERROR', entityRef: { type: 'Order', id: 5 }, details: { endpoint: '/post' }, raisedBy: 'PRD-INT-006',
    });
    assert.equal(raised.status, 'Open');
    assert.ok(raised.allowedActions.length > 0);
  });

  test('AC-ADM-009-02-01', async () => {
    // "a reason code and an action are mandatory (Adm.ReasonRequired if missing) and operator,
    //  action, reason code, comment and outcome are recorded (AUD-ADM-007)"
    const queue = await api.get('/api/admin-console/exceptions', SESSIONS.operations);
    const target = queue.exceptions.find((e) => e.type === 'StuckOrder');

    const missing = await api.post(`/api/admin-console/exceptions/${target.id}/resolve`, { action: 'resolve' }, SESSIONS.operations);
    assert.equal(missing.ok, false);
    assert.equal(missing.messageKey, 'Adm.ReasonRequired');

    const resolved = await api.post(`/api/admin-console/exceptions/${target.id}/resolve`, {
      action: 'resolve', reasonCode: 'DATA_FIXED', comment: 'the address was corrected',
    }, SESSIONS.operations);
    assert.equal(resolved.ok, true);
    assert.equal(resolved.exception.status, 'Resolved');
    assert.equal(resolved.exception.resolvedBy, 'operations@example.com');

    const trail = await api.get('/api/security/audit?event=AUD-ADM-007');
    const entry = trail.find((e) => e.entityId === String(target.id));
    assert.ok(entry);
    assert.equal(entry.after.action, 'resolve');
    assert.equal(entry.after.reasonCode, 'DATA_FIXED');
    assert.equal(entry.after.comment, 'the address was corrected');
    assert.ok(entry.after.outcome, 'the outcome is recorded');
  });

  test('AC-ADM-009-03-01', async () => {
    // "the action runs on each item through the owning module's handler and the result per item
    //  is shown; actions not declared batch-safe are not offered for multiple items"
    const queue = await api.get('/api/admin-console/exceptions', SESSIONS.operations);
    const ids = queue.exceptions.filter((e) => e.type === 'IntegrationError').slice(0, 3).map((e) => e.id);
    assert.ok(ids.length >= 2);

    const batch = await api.post('/api/admin-console/exceptions/bulk', { ids, action: 'escalate' }, SESSIONS.operations);
    assert.equal(batch.results.length, ids.length, 'the result per item is shown');
    assert.ok(batch.results.every((r) => r.ok));

    const notBatchSafe = await api.post('/api/admin-console/exceptions/bulk', {
      ids, action: 'resolve', reasonCode: 'DATA_FIXED',
    }, SESSIONS.operations);
    assert.equal(notBatchSafe.ok, false);
    assert.ok(notBatchSafe.results.every((r) => /not batch-safe/.test(r.message ?? '')),
      'resolve is not declared batch-safe, so it is not offered for several items');

    // the same action on a single item is allowed
    const single = await api.post('/api/admin-console/exceptions/bulk', {
      ids: [ids[0]], action: 'resolve', reasonCode: 'DATA_FIXED', comment: 'one at a time',
    }, SESSIONS.operations);
    assert.equal(single.ok, true);
  });

  test('AC-ADM-009-03-02', async () => {
    // "a retry that fails again returns the exception to Open with the attempt count increased"
    const raised = await api.post('/api/admin-console/exceptions', {
      type: 'IntegrationError', severity: 'High', reasonCode: 'UPSTREAM_ERROR', source: 'MRA-EIS', raisedBy: 'PRD-PAY-027',
    });
    const first = await api.post(`/api/admin-console/exceptions/${raised.id}/retry`, {}, SESSIONS.operations);
    assert.equal(first.retryFailed, true, 'the handler reports the other system is still failing');
    assert.equal(first.exception.status, 'Open');
    assert.equal(first.exception.attempts, 1);

    const second = await api.post(`/api/admin-console/exceptions/${raised.id}/retry`, {}, SESSIONS.operations);
    assert.equal(second.exception.attempts, 2, 'the attempt count increases');
  });

  test('AC-ADM-009-04-01', async () => {
    // "several open exceptions share reason code and source within the configured window: they
    //  are grouped under one pattern with a count, shown at the top of the queue"
    const detected = await api.post('/api/admin-console/exceptions/detect-patterns', { windowHours: 24, minimum: 2 }, SESSIONS.operations);
    const pattern = detected.patterns.find((p) => p.reasonCode === 'UPSTREAM_ERROR' && p.source === 'MRA-EIS');
    assert.ok(pattern, 'the shared root cause is grouped');
    assert.ok(pattern.count >= 2);
    assert.ok(pattern.firstSeen && pattern.lastSeen);

    const queue = await api.get('/api/admin-console/exceptions', SESSIONS.operations);
    assert.ok(queue.patterns.length > 0, 'patterns are shown at the top of the queue');
    assert.equal(queue.patterns[0].count >= queue.patterns[queue.patterns.length - 1].count, true);
  });
});

/* ======================================================== PRD-ADM-010 operational alerts = */

describe('PRD-ADM-010 operational alerts', () => {
  test('AC-ADM-010-01-01', async () => {
    // "when the alert task runs and the threshold is crossed, an alert is raised and sent
    //  through TRK-005 to the recipients; it is not sent again for the same rule and subject
    //  until it is cleared or the repeat interval passes"
    const run = await api.post('/api/admin-console/alerts/run', { measures: { 'open-exceptions:IntegrationError': 9 } }, SESSIONS.operations);
    const raised = run.raised.find((a) => a.measure === 'open-exceptions:IntegrationError');
    assert.ok(raised, 'the threshold was crossed');
    assert.equal(raised.status, 'Raised');
    assert.equal(raised.threshold, 2);

    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.some((m) => m.event === 'Administration.AlertRaised'), 'sent through TRK-005');

    const again = await api.post('/api/admin-console/alerts/run', { measures: { 'open-exceptions:IntegrationError': 9 } }, SESSIONS.operations);
    assert.equal(again.raised.some((a) => a.measure === 'open-exceptions:IntegrationError'), false);
    assert.ok(again.suppressed.length > 0, 'not raised again inside the repeat interval');
  });

  test('AC-ADM-010-01-02', async () => {
    // "an acknowledged alert shows who acknowledged and when; when the measure falls back below
    //  the threshold the alert clears automatically"
    const alerts = await api.get('/api/admin-console/alerts', SESSIONS.operations);
    const open = alerts.alerts.find((a) => a.status === 'Raised');
    const acknowledged = await api.post(`/api/admin-console/alerts/${open.id}/acknowledge`, {}, SESSIONS.operations);
    assert.equal(acknowledged.alert.status, 'Acknowledged');
    assert.equal(acknowledged.alert.acknowledgedBy, 'operations@example.com');
    assert.ok(acknowledged.alert.acknowledgedOnUtc);

    const cleared = await api.post('/api/admin-console/alerts/run', { measures: { 'open-exceptions:IntegrationError': 0 } }, SESSIONS.operations);
    assert.ok(cleared.cleared.some((a) => a.id === open.id), 'the alert clears automatically');
    assert.equal(cleared.cleared.find((a) => a.id === open.id).status, 'Cleared');
  });

  test('AC-ADM-010-01-03', async () => {
    // "a rule created or changed is audited (AUD-ADM-008)"
    const created = await api.post('/api/admin-console/alerts/rules', {
      measure: 'orders-in-status:Pending', threshold: 10, recipients: ['operations@example.com'], channel: 'email',
    }, SESSIONS.operations);
    assert.ok(created.id);

    const changed = await api.post('/api/admin-console/alerts/rules', {
      id: created.id, measure: 'orders-in-status:Pending', threshold: 3, recipients: ['operations@example.com'], channel: 'email',
    }, SESSIONS.operations);
    assert.equal(changed.threshold, 3);

    const trail = await api.get('/api/security/audit?event=AUD-ADM-008');
    const entries = trail.filter((e) => e.entity === 'AlertRule' && e.entityId === String(created.id));
    assert.equal(entries.length, 2, 'both the creation and the change are audited');
    assert.equal(entries.find((e) => e.before)?.before.threshold, 10);
  });
});

/* ========================================================== PRD-ADM-011 template library = */

describe('PRD-ADM-011 template library', () => {
  test('AC-ADM-011-01-01', async () => {
    // "each client template shows the default it derives from; editing a client template never
    //  changes the vertical default"
    const library = await api.get('/api/admin-console/templates/library');
    assert.ok(library.verticalDefaults.length > 0);
    const client = library.clientTemplates.find((t) => t.code === 'mpc-parcel');
    assert.equal(client.derivedFrom, 'postal-parcel-default', 'the default it derives from');

    const before2 = library.verticalDefaults.find((t) => t.code === 'postal-parcel-default').values;
    await api.post(`/api/admin-console/templates/${client.id}/save`, {
      values: { ...client.values, packaging: 'reinforced' }, summary: 'stronger packaging',
    });
    const after2 = (await api.get('/api/admin-console/templates/library')).verticalDefaults
      .find((t) => t.code === 'postal-parcel-default').values;
    assert.deepEqual(after2, before2, 'the vertical default is unchanged');

    // and the vertical default itself is pack content, not edited here
    const refused = await api.post(`/api/admin-console/templates/${library.verticalDefaults[0].id}/save`, { values: {}, summary: 'x' });
    assert.equal(refused.ok, false);
    assert.match(refused.message, /supplied by the pack/);
  });

  test('AC-ADM-011-02-01', async () => {
    // "a new version with author, time and change summary is created; an earlier version can be
    //  restored as a new version"
    const templates = await api.get('/api/admin-console/templates');
    const client = templates.find((t) => t.code === 'mpc-parcel');
    const versionsBefore = client.versions.length;

    const saved = await api.post(`/api/admin-console/templates/${client.id}/save`, {
      values: { ...client.values, insurance: false }, summary: 'insurance off by default',
    });
    assert.ok(saved.version.no > versionsBefore);
    assert.equal(saved.version.summary, 'insurance off by default');
    assert.equal(saved.version.author, 'admin@example.com');
    assert.ok(saved.version.createdOnUtc);

    const restored = await api.post(`/api/admin-console/templates/${client.id}/restore/1`, {});
    assert.equal(restored.ok, true);
    assert.match(restored.version.summary, /restored version 1/);
    assert.ok(restored.version.no > saved.version.no, 'restored as a new version');
  });

  test('AC-ADM-011-03-01', async () => {
    // "every field shows whether it is inherited or overridden, and an overridden field shows
    //  the parent value"
    const templates = await api.get('/api/admin-console/templates');
    const client = templates.find((t) => t.code === 'mpc-parcel');
    const view = await api.get(`/api/admin-console/templates/${client.id}/inheritance`);
    assert.equal(view.parent, 'postal-parcel-default');
    const paymentTerm = view.fields.find((f) => f.field === 'paymentTermDays');
    assert.equal(paymentTerm.overridden, true);
    assert.equal(paymentTerm.parentValue, 30, 'an overridden field shows the parent value');
    const packaging = view.fields.find((f) => f.field === 'incoterm');
    assert.equal(packaging.inherited, true);
  });

  test('AC-ADM-011-03-02', async () => {
    // "the clone is a new template with the same values and its own version history"
    const templates = await api.get('/api/admin-console/templates');
    const client = templates.find((t) => t.code === 'mpc-parcel');
    const cloned = await api.post(`/api/admin-console/templates/${client.id}/clone`, { code: 'mpc-parcel-express' });
    assert.equal(cloned.ok, true);
    assert.notEqual(cloned.template.id, client.id);
    assert.deepEqual(cloned.template.values, client.values, 'the same values');
    assert.equal(cloned.ownVersionHistory, true);

    const after2 = await api.get('/api/admin-console/templates');
    const clone = after2.find((t) => t.code === 'mpc-parcel-express');
    assert.equal(clone.versions.length, 1, 'its own version history, starting at 1');
  });

  test('AC-ADM-011-04-01', async () => {
    // "the change waits for approval (ADM-006) by a user holding
    //  Administration.Core.Templates.Approve other than the author; transactions keep using the
    //  active version until approval"
    const templates = await api.get('/api/admin-console/templates');
    const active = templates.find((t) => t.code === 'legacy-bulk');
    assert.equal(active.status, 'Active');

    const submitted = await api.post(`/api/admin-console/templates/${active.id}/save`, {
      values: { ...active.values, paymentTermDays: 7 }, summary: 'shorter payment term',
    });
    assert.equal(submitted.approvalRequired, true);
    assert.ok(submitted.approvalItemId, 'it waits for an ADM-006 approval');
    assert.equal(submitted.activeVersionInUse, active.activeVersionNo, 'transactions keep using the active version');
    const pending = (await api.get('/api/admin-console/templates')).find((t) => t.code === 'legacy-bulk');
    assert.equal(pending.values.paymentTermDays, 60, 'the active values are untouched until approval');

    // the author cannot approve their own template change
    const ownChange = await api.post(`/api/admin-console/approvals/items/${submitted.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.admin);
    assert.equal(ownChange.ok, false);
    assert.equal(ownChange.messageKey, 'Adm.ApproveOwnItem');

    const decided = await api.post(`/api/admin-console/approvals/items/${submitted.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.approver);
    assert.equal(decided.item.status, 'Approved');
    const activated = (await api.get('/api/admin-console/templates')).find((t) => t.code === 'legacy-bulk');
    assert.equal(activated.values.paymentTermDays, 7, 'the approved version is now active');
    assert.equal(activated.status, 'Active');
  });

  test('AC-ADM-011-05-01', async () => {
    // "choosing an area takes the administrator to the owning screen; no area is edited in a
    //  second place"
    const workspace = await api.get('/api/admin-console/templates/workspace');
    const areas = workspace.map((w) => w.feature);
    assert.ok(areas.includes('PRD-PLT-006'), 'branding and wording');
    assert.ok(areas.includes('PRD-ADM-002'), 'workflows');
    assert.ok(areas.includes('PRD-ADM-003'), 'rules');
    assert.ok(areas.includes('PRD-DOC-001'), 'document templates');
    assert.ok(areas.includes('PRD-TRK-004'), 'notification templates');
    assert.ok(workspace.every((w) => w.editedHere === false && w.route.startsWith('/admin/')),
      'the workspace links to the owning screen and edits nothing itself');
  });
});

/* ====================================== PRD-ADM-012 template analytics and shared library = */

describe('PRD-ADM-012 template analytics and the shared library', () => {
  test('AC-ADM-012-01-01', async () => {
    // "per template the number of transactions in a chosen period, the date last used, and the
    //  number of failed or exception cases; templates unused for the configured period are stale"
    const analytics = await api.get('/api/admin-console/templates/analytics?periodDays=90&staleAfterDays=60');
    const used = analytics.find((t) => t.code === 'mpc-parcel');
    assert.ok(used.transactionsInPeriod >= 5, 'the transactions in the period');
    assert.ok(used.lastUsed, 'the date last used');
    assert.equal(used.failedOrException, 1, 'the failed or exception cases');
    assert.equal(used.stale, false);

    const stale = analytics.find((t) => t.code === 'legacy-bulk');
    assert.equal(stale.stale, true, 'unused for longer than the configured period');
    assert.equal(stale.transactionsInPeriod, 0);
  });

  test('AC-ADM-012-02-01', async () => {
    // "client identifiers are removed and the package goes to the central product library
    //  outside every client instance"
    const templates = await api.get('/api/admin-console/templates');
    const client = templates.find((t) => t.code === 'mpc-parcel');
    assert.ok(client.values.clientName, 'the template carries a client identifier');

    const published = await api.post(`/api/admin-console/templates/${client.id}/publish-shared`, {});
    assert.equal(published.ok, true);
    assert.deepEqual(published.removedIdentifiers, ['clientName']);
    assert.equal(published.package.values.clientName, undefined, 'the identifier is removed');
    assert.match(published.package.destination, /outside every client instance/);
  });

  test('AC-ADM-012-02-02', async () => {
    // "another client imports it: added as a draft template in that client's library and follows
    //  the ADM-011 approval before use"
    const shared = await api.get('/api/admin-console/templates/shared');
    const adopted = await api.post(`/api/admin-console/templates/shared/${shared[0].id}/adopt`, {});
    assert.equal(adopted.ok, true);
    assert.equal(adopted.template.status, 'Draft', 'added as a draft');
    assert.equal(adopted.approvalBeforeUse, 'PRD-ADM-011 (AC-ADM-011-04-01)');
    assert.equal(adopted.template.adoptedFrom, shared[0].code);

    const inLibrary = (await api.get('/api/admin-console/templates/library')).clientTemplates;
    assert.ok(inLibrary.some((t) => t.id === adopted.template.id), "it is in that client's library");
  });
});
