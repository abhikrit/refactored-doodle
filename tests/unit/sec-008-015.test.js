// PRD-SEC-008 Breach notification workflow (7 ACs), PRD-SEC-009 Compliance reports and
// certificates (3), PRD-SEC-010 Auditor read-only access (5), PRD-SEC-011 Vulnerability
// management (4) and PRD-SEC-015 Security incident management (2).
// One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync, auditAsync } from '../../packages/server/src/core/audit.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';
import { extensionRegister } from '../../packages/server/src/core/providers.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const DISCOVERED = '2026-11-01T08:00:00.000Z';

/* ===================================================== PRD-SEC-008 breach workflow ===== */

describe('PRD-SEC-008 breach notification workflow', () => {
  test('AC-SEC-008-01-01', async () => {
    // "a BreachCase is Open, its regulator and subject deadlines are computed from the country
    //  profile (SEC-012) and AUD-SEC-005 is written"
    await api.post('/api/security/privacy-profile', {
      values: { breachDeadlineToRegulatorHours: 72, breachDeadlineToPeopleHours: 168 },
    }, SESSIONS.privacy);

    const denied = await api.post('/api/security/breaches', {
      discoveredOnUtc: DISCOVERED, description: 'x',
    }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.Breaches.CreateEditDelete');

    const opened = await api.post('/api/security/breaches', {
      discoveredOnUtc: DISCOVERED,
      description: 'A laptop with an export of the customer list was lost',
      dataCategories: ['name', 'email', 'phone'],
      systems: ['admin export'],
    }, SESSIONS.privacy);
    assert.equal(opened.ok, true);
    assert.equal(opened.case.status, 'Open');
    assert.equal(opened.deadlinesConfigured, true);
    assert.equal(opened.case.regulatorDeadlineUtc, '2026-11-04T08:00:00.000Z', '72 hours after discovery');
    assert.equal(opened.case.subjectDeadlineUtc, '2026-11-08T08:00:00.000Z', '168 hours after discovery');
    assert.match(opened.case.deadlinesFrom, /PRD-SEC-012/);

    const trail = await auditTrailAsync({ event: 'AUD-SEC-005', entityId: opened.case.id });
    assert.ok(trail.length >= 1, 'AUD-SEC-005 is written');

    const incomplete = await api.post('/api/security/breaches', { description: 'no discovery time' }, SESSIONS.privacy);
    assert.equal(incomplete.ok, false);
  });

  test('AC-SEC-008-01-02', async () => {
    // "the case shows message Sec.DeadlineNotConfigured and the privacy officer is alerted; no
    //  default deadline is assumed (BR-SEC-030)"
    await api.post('/api/security/privacy-profile', {
      values: { breachDeadlineToRegulatorHours: null, breachDeadlineToPeopleHours: null },
    }, SESSIONS.privacy);

    const opened = await api.post('/api/security/breaches', {
      discoveredOnUtc: DISCOVERED, description: 'A second case, before the deadlines are configured', dataCategories: ['email'],
    }, SESSIONS.privacy);
    assert.equal(opened.ok, true);
    assert.equal(opened.deadlinesConfigured, false);
    assert.equal(opened.messageKey, 'Sec.DeadlineNotConfigured');
    assert.ok(opened.message && opened.message !== 'Sec.DeadlineNotConfigured');
    assert.deepEqual(opened.missingDeadlines.sort(), ['breachDeadlineToPeopleHours', 'breachDeadlineToRegulatorHours']);
    assert.equal(opened.case.regulatorDeadlineUtc, null, 'no default deadline is assumed');
    assert.equal(opened.case.subjectDeadlineUtc, null);
    assert.equal(opened.noDefaultAssumed, true);
    assert.equal(opened.rule, 'BR-SEC-030');
    assert.equal(opened.privacyOfficerAlerted, true);
    const sent = await deliveriesAsync({ event: 'Sec.Core.BreachDeadline' });
    assert.ok(sent.length >= 1, 'the officer is told through TRK-005');

    await api.post('/api/security/privacy-profile', {
      values: { breachDeadlineToRegulatorHours: 72, breachDeadlineToPeopleHours: 168 },
    }, SESSIONS.privacy);
  });

  test('AC-SEC-008-01-03', async () => {
    // "the list of affected people and their contact channels is produced and frozen with its
    //  count and criteria"
    const [theCase] = await api.get('/api/security/breaches?status=Open', SESSIONS.privacy);
    const buyer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const criteria = { customerIds: [buyer.id], entityTypes: ['Customer'], stores: [1] };

    const frozen = await api.post(`/api/security/breaches/${theCase.id}/affected`, { criteria }, SESSIONS.privacy);
    assert.equal(frozen.ok, true);
    assert.equal(frozen.count, 1);
    assert.equal(frozen.frozen, true);
    assert.ok(frozen.frozenOnUtc);
    assert.deepEqual(frozen.criteria, criteria, 'the criteria are kept with the list');
    assert.equal(frozen.affected[0].customerId, buyer.id);
    assert.equal(frozen.affected[0].channel, 'email', 'with the contact channel of each person');
    assert.deepEqual(frozen.entityTypes, ['Customer']);

    const again = await api.post(`/api/security/breaches/${theCase.id}/affected`, { criteria: {} }, SESSIONS.privacy);
    assert.equal(again.ok, false);
    assert.equal(again.frozen, true, 'a frozen list is not regenerated');
    assert.equal(again.count, 1);
  });

  test('AC-SEC-008-02-01', async () => {
    // "each notice is sent through the notification engine using the breach-notice event code
    //  Sec.BreachNotice that SEC registered at installation, on the channel available for the
    //  person, and each send and its delivery result per person are recorded"
    const codes = await api.get('/api/security/event-codes', SESSIONS.admin);
    const breachCode = codes.find((c) => c.code === 'Sec.BreachNotice');
    assert.equal(breachCode.registered, true, 'registered at installation through IC-TRK-04');
    assert.deepEqual(breachCode.defaultChannels, ['email', 'sms']);
    assert.equal(breachCode.mandatoryCategory, true);

    const [theCase] = await api.get('/api/security/breaches?status=Open', SESSIONS.privacy);
    const tooEarly = await api.post(`/api/security/breaches/${theCase.id}/notify-subjects`, {}, SESSIONS.privacy);
    assert.equal(tooEarly.ok, false, 'the case must be assessed as notifiable first');

    await api.post(`/api/security/breaches/${theCase.id}/assess`, { notifiable: true }, SESSIONS.privacy);
    const sent = await api.post(`/api/security/breaches/${theCase.id}/notify-subjects`, {}, SESSIONS.privacy);
    assert.equal(sent.ok, true);
    assert.equal(sent.eventCode, 'Sec.BreachNotice');
    assert.equal(sent.sentThrough, 'IC-TRK-04 SendEvent');
    assert.match(sent.senderReference, /BreachCase/);
    assert.equal(sent.case.status, 'SubjectsNotified');
    assert.equal(sent.notices.length, 1);
    assert.equal(sent.notices[0].result, 'Sent', 'the delivery result per person is recorded');
    assert.equal(sent.notices[0].channel, 'email');

    const recorded = await repository('BreachNotice').getAllAsync((n) => n.caseId === theCase.id);
    assert.equal(recorded.length, 1);
    assert.equal(recorded[0].eventCode, 'Sec.BreachNotice');
    const deliveries = await deliveriesAsync({ event: 'Sec.BreachNotice' });
    assert.ok(deliveries.length >= 1, 'the notice went out through TRK-005');
  });

  test('AC-SEC-008-02-02', async () => {
    // "the date, channel and reference are stored and the case moves to RegulatorNotified"
    const theCase = (await api.get('/api/security/breaches', SESSIONS.privacy))
      .find((c) => c.status === 'SubjectsNotified');
    const incomplete = await api.post(`/api/security/breaches/${theCase.id}/regulator-notice`, {
      submittedOnUtc: '2026-11-03T09:00:00.000Z',
    }, SESSIONS.privacy);
    assert.equal(incomplete.ok, false, 'the date, the channel and the reference are all recorded');

    const recorded = await api.post(`/api/security/breaches/${theCase.id}/regulator-notice`, {
      submittedOnUtc: '2026-11-03T09:00:00.000Z', channel: 'the regulator portal', reference: 'MW-DPA-2026-0042',
    }, SESSIONS.privacy);
    assert.equal(recorded.ok, true);
    assert.equal(recorded.case.status, 'RegulatorNotified');
    assert.equal(recorded.state, 'RegulatorNotified');
    assert.equal(recorded.stateMachine, 'SM-SEC-02');
    assert.equal(recorded.case.regulatorReference, 'MW-DPA-2026-0042');
    assert.equal(recorded.case.regulatorChannel, 'the regulator portal');
    assert.equal(recorded.case.regulatorSubmittedOnUtc, '2026-11-03T09:00:00.000Z');
  });

  test('AC-SEC-008-02-03', async () => {
    // "the officer is alerted; when the deadline passes the case is marked Overdue"
    const near = await api.post('/api/security/breaches', {
      discoveredOnUtc: new Date(Date.now() - 68 * 3600 * 1000).toISOString(),
      description: 'A case whose regulator deadline is close',
      dataCategories: ['email'],
    }, SESSIONS.privacy);
    const alerting = await api.post('/api/security/breaches/deadline-task', {}, SESSIONS.privacy);
    assert.ok(alerting.alerted.some((a) => a.caseId === near.case.id), 'the officer is alerted before the deadline');
    assert.equal(alerting.officerAlerted, true);
    assert.ok(alerting.leadHours > 0);

    const passed = await api.post('/api/security/breaches', {
      discoveredOnUtc: new Date(Date.now() - 200 * 3600 * 1000).toISOString(),
      description: 'A case whose deadlines have passed',
      dataCategories: ['email'],
    }, SESSIONS.privacy);
    const overdue = await api.post('/api/security/breaches/deadline-task', {}, SESSIONS.privacy);
    assert.ok(overdue.overdue.some((o) => o.caseId === passed.case.id), 'the case is marked Overdue');
    const row = await repository('BreachCase').getByIdAsync(passed.case.id);
    assert.equal(row.status, 'Overdue');
    const trail = await auditTrailAsync({ event: 'AUD-SEC-005', entityId: passed.case.id });
    assert.ok(trail.some((e) => e.after?.status === 'Overdue'));
  });

  test('AC-SEC-008-02-04', async () => {
    // "a second user holding Security.Core.Breaches.CreateEditDelete must confirm it before the
    //  case can close"
    await createCustomerAsync({
      email: 'privacy.second@example.com', firstName: 'Second', lastName: 'Officer', roles: ['PrivacyOfficer'],
    });
    await api.post('/api/identity/sign-in', { email: 'privacy.second@example.com', password: 'demo' }, 'sec-privacy-2');

    const opened = await api.post('/api/security/breaches', {
      discoveredOnUtc: DISCOVERED, description: 'A case assessed as not notifiable', dataCategories: ['order reference'],
    }, SESSIONS.privacy);

    const noReason = await api.post(`/api/security/breaches/${opened.case.id}/assess`, { notifiable: false }, SESSIONS.privacy);
    assert.equal(noReason.reasonRequired, true);

    const assessed = await api.post(`/api/security/breaches/${opened.case.id}/assess`, {
      notifiable: false, reason: 'the data was encrypted and the key was not lost',
    }, SESSIONS.privacy);
    assert.equal(assessed.confirmationRequired, true);
    assert.match(assessed.confirmationBy, /second user/);

    const tooSoon = await api.post(`/api/security/breaches/${opened.case.id}/close`, {}, SESSIONS.privacy);
    assert.equal(tooSoon.ok, false);
    assert.equal(tooSoon.confirmationRequired, true, 'the case cannot close yet');

    const sameUser = await api.post(`/api/security/breaches/${opened.case.id}/confirm`, {}, SESSIONS.privacy);
    assert.equal(sameUser.ok, false);
    assert.equal(sameUser.sameUser, true, 'the person who assessed it cannot confirm it');

    const confirmed = await api.post(`/api/security/breaches/${opened.case.id}/confirm`, {}, 'sec-privacy-2');
    assert.equal(confirmed.ok, true);
    assert.equal(confirmed.confirmedBy, 'privacy.second@example.com');

    const closed = await api.post(`/api/security/breaches/${opened.case.id}/close`, {}, SESSIONS.privacy);
    assert.equal(closed.ok, true);
    assert.equal(closed.case.status, 'Closed');
  });
});

/* ======================================================== PRD-SEC-009 the evidence ====== */

describe('PRD-SEC-009 compliance reports and certificates', () => {
  test('AC-SEC-009-01-01', async () => {
    // "it produces: access audit report, MFA status, privileged accounts, audit-chain
    //  verification results, configuration change log, auditor-access grants and dependency-scan
    //  results, each with its manifest"
    await api.post('/api/security/vulnerabilities/scans', {
      release: '1.0.0', findings: [{ id: 'CVE-2026-0001', severity: 'Low', package: 'left-pad' }],
    }, SESSIONS.admin);

    const denied = await api.post('/api/security/evidence/export', {}, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditTrail.Export');

    const exported = await api.post('/api/security/evidence/export', {
      from: '2026-01-01T00:00:00.000Z',
    }, SESSIONS.admin);
    assert.equal(exported.ok, true);
    assert.deepEqual(exported.partNames, [
      'access audit report',
      'MFA status',
      'privileged accounts',
      'audit-chain verification',
      'configuration change log',
      'auditor-access grants',
      'dependency-scan results',
    ]);
    for (const part of exported.parts) {
      assert.ok(part.manifest, `${part.name} has a manifest`);
      assert.equal(part.manifest.part, part.name);
      assert.equal(part.manifest.rowCount, part.rowCount);
      assert.match(part.signature, /^[0-9a-f]{64}$/);
      assert.deepEqual(part.formats, ['csv', 'json']);
    }
    assert.ok(exported.parts.find((p) => p.name === 'privileged accounts').rowCount >= 1);
    assert.equal(exported.parts.find((p) => p.name === 'audit-chain verification').rows[0].result, 'Verified');
    assert.ok(exported.parts.find((p) => p.name === 'dependency-scan results').rowCount >= 1);

    const trail = await auditTrailAsync({ event: 'AUD-SEC-002', entity: 'EvidenceExport' });
    assert.ok(trail.length >= 1);
  });

  test('AC-SEC-009-01-02', async () => {
    // "the tool can read them (CSV and JSON); control mapping and certification are done in the
    //  tool and by the organisation (external, ORG-SVC)"
    const exported = await api.post('/api/security/evidence/export', { from: '2026-01-01T00:00:00.000Z' }, SESSIONS.admin);
    assert.deepEqual(exported.machineReadable, ['csv', 'json']);
    assert.match(exported.controlMappingAndCertification, /GRC/);
    assert.match(exported.controlMappingAndCertification, /ORG-SVC/);
    assert.ok(exported.parts.every((p) => Array.isArray(p.rows)), 'every part carries rows a tool can read');
    const json = JSON.stringify(exported.parts[0]);
    assert.ok(JSON.parse(json), 'the part is valid JSON');
  });

  test('AC-SEC-009-02-01', async () => {
    // "the platform produces the verification result for the period (first and last sequence
    //  numbers, chain hashes, Verified) signed with the instance signing key"
    const statement = await api.post('/api/security/evidence/integrity-statement', {
      from: '2026-01-01T00:00:00.000Z',
    }, SESSIONS.auditor);
    assert.equal(statement.ok, true);
    assert.equal(statement.statement.result, 'Verified');
    assert.ok(statement.statement.firstSequence >= 1);
    assert.ok(statement.statement.lastSequence >= statement.statement.firstSequence);
    assert.match(statement.statement.firstHash, /^[0-9a-f]{64}$/);
    assert.match(statement.statement.lastHash, /^[0-9a-f]{64}$/);
    assert.match(statement.signature, /^[0-9a-f]{64}$/);
    assert.equal(statement.signedWith, 'the instance signing key');
    assert.match(statement.countersignedBy, /auditor/);

    const denied = await api.post('/api/security/evidence/integrity-statement', {}, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditTrail.View');
  });
});

/* ==================================================== PRD-SEC-010 auditor access ======== */

describe('PRD-SEC-010 auditor read-only access', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  test('AC-SEC-010-01-01', async () => {
    // "the account is in the Auditor role, which holds Security.AccessAdminPanel, native *View
    //  permissions and Security.Core.AuditTrail.View only; between start and end the grant is
    //  Active (SM-SEC-03)"
    const denied = await api.post('/api/security/auditor-grants', {
      email: 'auditor@example.com', startsOnUtc: yesterday, endsOnUtc: tomorrow,
    }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditorAccess.CreateEditDelete');

    const granted = await api.post('/api/security/auditor-grants', {
      email: 'auditor@example.com',
      startsOnUtc: yesterday,
      endsOnUtc: tomorrow,
      stores: [1],
      periodFrom: '2026-01-01T00:00:00.000Z',
      periodTo: tomorrow,
    }, SESSIONS.admin);
    assert.equal(granted.ok, true);
    assert.equal(granted.status, 'Active', 'between start and end the grant is Active');
    assert.equal(granted.stateMachine, 'SM-SEC-03');
    assert.equal(granted.role, 'Auditor');
    assert.ok(granted.permissions.includes('Security.Core.AuditTrail.View'));
    assert.deepEqual(granted.writePermissions, [], 'and nothing that writes');
    assert.equal(granted.readOnly, true);

    const future = await api.post('/api/security/auditor-grants', {
      email: 'auditor@example.com', startsOnUtc: tomorrow, endsOnUtc: new Date(Date.now() + 172800000).toISOString(),
    }, SESSIONS.admin);
    assert.equal(future.status, 'Pending', 'before it starts the grant is Pending');
  });

  test('AC-SEC-010-01-02', async () => {
    // "it is denied by the native permission check and nothing changes"
    const check = await api.get('/api/security/auditor-grants/check?permission=Customers.CustomersCreateEditDelete', SESSIONS.auditor);
    assert.equal(check.auditor, true);
    assert.equal(check.allowed, false);
    assert.equal(check.nothingChanged, true);
    assert.match(check.refusedBy, /native permission check/);

    const read = await api.get('/api/security/auditor-grants/check?permission=Security.Core.AuditTrail.View', SESSIONS.auditor);
    assert.equal(read.allowed, true, 'reading the trail is allowed');

    // and a real write through an admin route is refused
    const write = await api.post('/api/identity/users/edit', {
      email: 'buyer@example.com', changes: { lastName: 'Changed by the auditor' },
    }, SESSIONS.auditor);
    assert.equal(write.denied, true);
    const buyer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    assert.notEqual(buyer.lastName, 'Changed by the auditor', 'nothing changed');
  });

  test('AC-SEC-010-01-03', async () => {
    // "access is denied at once through the IAM IPermissionService override (BR-IAM-060),
    //  message Sec.AuditorAccessExpired is shown and the grant becomes Expired (AUD-SEC-004)"
    await createCustomerAsync({
      email: 'expired.auditor@example.com', firstName: 'Expired', lastName: 'Auditor', roles: ['Registered'],
    });
    const granted = await api.post('/api/security/auditor-grants', {
      email: 'expired.auditor@example.com',
      startsOnUtc: new Date(Date.now() - 172800000).toISOString(),
      endsOnUtc: new Date(Date.now() + 60000).toISOString(),
      stores: [1],
    }, SESSIONS.admin);
    assert.equal(granted.status, 'Active');
    await api.post('/api/identity/sign-in', { email: 'expired.auditor@example.com', password: 'demo' }, 'sec-expired');

    const active = await api.get('/api/security/auditor-grants/check', 'sec-expired');
    assert.equal(active.allowed, true);

    // the end passes
    const row = await repository('AuditorGrant').getByIdAsync(granted.grant.id);
    await repository('AuditorGrant').updateAsync({ ...row, endsOnUtc: new Date(Date.now() - 1000).toISOString() });

    const expired = await api.get('/api/security/auditor-grants/check', 'sec-expired');
    assert.equal(expired.allowed, false, 'access is denied at once');
    assert.equal(expired.status, 'Expired');
    assert.equal(expired.messageKey, 'Sec.AuditorAccessExpired');
    assert.match(expired.refusedBy, /IPermissionService override/);
    assert.equal(expired.auditEvent, 'AUD-SEC-004');

    const grants = await api.get('/api/security/auditor-grants', SESSIONS.admin);
    assert.equal(grants.find((g) => g.id === granted.grant.id).status, 'Expired', 'the grant becomes Expired');
    const trail = await auditTrailAsync({ event: 'AUD-SEC-004', entityId: granted.grant.id });
    assert.ok(trail.some((e) => e.after?.status === 'Expired'));
  });

  test('AC-SEC-010-02-01', async () => {
    // "only events in that period and those stores are returned"
    await auditAsync({
      event: 'AUD-SEC-001', area: 'SEC', entity: 'StoreProbe', entityId: 1, after: { store: 2 }, storeId: 2,
    });
    const trail = await api.get('/api/security/auditor-trail', SESSIONS.auditor);
    assert.equal(trail.ok, true);
    assert.equal(trail.limitedByGrant, true);
    assert.deepEqual(trail.stores, [1], 'the stores of the grant');
    assert.ok(trail.events.every((e) => Number(e.storeId) === 1), 'and only their events');
    assert.ok(trail.period.from, 'the period of the grant');
    assert.ok(trail.events.every((e) => e.occurredOnUtc >= trail.period.from));
    assert.ok(trail.total >= 1);
  });

  test('AC-SEC-010-02-02', async () => {
    // "it is recorded in the audit trail with the auditor as actor"
    const before2 = (await auditTrailAsync({ actor: 'auditor@example.com' })).length;
    await api.get('/api/security/auditor-trail', SESSIONS.auditor);
    await api.get('/api/security/auditor-trail?exported=true', SESSIONS.auditor);

    const entries = await auditTrailAsync({ actor: 'auditor@example.com' });
    assert.ok(entries.length >= before2 + 2);
    assert.ok(entries.some((e) => e.after?.action === 'viewed'));
    assert.ok(entries.some((e) => e.after?.action === 'exported'));
    assert.ok(entries.every((e) => e.actorRole === 'Auditor' || e.actor === 'auditor@example.com'));
  });
});

/* ================================================= PRD-SEC-011 vulnerability management = */

describe('PRD-SEC-011 vulnerability management', () => {
  test('AC-SEC-011-01-01', async () => {
    // "a new high or critical vulnerability fails the build and the Increment does not meet
    //  Definition of Done criterion 5"
    const clean = await api.post('/api/security/vulnerabilities/scans', {
      release: '1.1.0', findings: [{ id: 'CVE-2026-0002', severity: 'Medium', package: 'semver' }],
    }, SESSIONS.admin);
    assert.equal(clean.buildPassed, true);
    assert.equal(clean.definitionOfDone, 'criterion 5 met');
    assert.deepEqual(clean.newHighOrCritical, []);

    const failing = await api.post('/api/security/vulnerabilities/scans', {
      release: '1.2.0',
      findings: [
        { id: 'CVE-2026-0002', severity: 'Medium', package: 'semver' },
        { id: 'CVE-2026-0003', severity: 'Critical', package: 'tar' },
      ],
    }, SESSIONS.admin);
    assert.equal(failing.buildPassed, false);
    assert.equal(failing.definitionOfDone, 'criterion 5 not met');
    assert.equal(failing.newHighOrCritical.length, 1);
    assert.equal(failing.newHighOrCritical[0].id, 'CVE-2026-0003');
    assert.equal(failing.rule, 'BR-SEC-080');
    assert.equal(failing.nfr, 'NFR-X-001');

    // a finding already known does not fail the build again
    const known = await api.post('/api/security/vulnerabilities/scans', {
      release: '1.3.0', findings: [{ id: 'CVE-2026-0003', severity: 'Critical', package: 'tar' }],
    }, SESSIONS.admin);
    assert.equal(known.buildPassed, true, 'only a new high or critical finding fails the build');
    const trail = await auditTrailAsync({ entity: 'DependencyScan' });
    assert.ok(trail.some((e) => e.outcome === 'rejected'), 'the failing scan is audited');
  });

  test('AC-SEC-011-02-01', async () => {
    // "it has a severity, an owner and a fix deadline per severity (deadlines Not stated in
    //  source)"
    const noDeadlines = await api.post('/api/security/vulnerabilities/findings', {
      source: 'runtime scanner', title: 'An out-of-date TLS library on the web node', severity: 'High', owner: 'platform team',
    }, SESSIONS.admin);
    assert.equal(noDeadlines.ok, true);
    assert.equal(noDeadlines.finding.severity, 'High');
    assert.equal(noDeadlines.finding.owner, 'platform team');
    assert.equal(noDeadlines.fixDeadline, 'not configured');
    assert.match(noDeadlines.deadlinesNote, /Not stated in source/);

    await saveSettingAsync('sec.fixdeadlinedays', {
      Critical: 7, High: 14, Medium: 30, Low: 90,
    }, 0);
    const withDeadline = await api.post('/api/security/vulnerabilities/findings', {
      source: 'runtime scanner', title: 'A world-readable backup file', severity: 'Critical', owner: 'hosting provider',
    }, SESSIONS.admin);
    assert.equal(withDeadline.fixDeadline, '7 days');
    assert.ok(new Date(withDeadline.finding.fixDeadlineUtc) > new Date());

    const refused = await api.post('/api/security/vulnerabilities/findings', {
      source: 'runtime scanner', title: 'x', severity: 'Catastrophic', owner: 'y',
    }, SESSIONS.admin);
    assert.equal(refused.ok, false, 'the severity is one of the four');
  });

  test('AC-SEC-011-03-01', async () => {
    // "each finding is tracked to Fixed with retest evidence or to RiskAccepted with the approver
    //  named (SM-SEC-05)"
    const finding = await api.post('/api/security/vulnerabilities/findings', {
      source: 'penetration test', title: 'A session cookie without the Secure flag behind the proxy', severity: 'High', owner: 'platform team', release: '1.2.0',
    }, SESSIONS.admin);

    const noEvidence = await api.post(`/api/security/vulnerabilities/findings/${finding.finding.id}/decide`, { status: 'Fixed' }, SESSIONS.admin);
    assert.equal(noEvidence.evidenceRequired, true);

    const fixed = await api.post(`/api/security/vulnerabilities/findings/${finding.finding.id}/decide`, {
      status: 'Fixed', retestEvidence: 'retest report RT-2026-11 confirms the flag is set',
    }, SESSIONS.admin);
    assert.equal(fixed.ok, true);
    assert.equal(fixed.finding.status, 'Fixed');
    assert.equal(fixed.stateMachine, 'SM-SEC-05');

    const second = await api.post('/api/security/vulnerabilities/findings', {
      source: 'penetration test', title: 'Verbose error page on an internal route', severity: 'Low', owner: 'platform team',
    }, SESSIONS.admin);
    const noApprover = await api.post(`/api/security/vulnerabilities/findings/${second.finding.id}/decide`, { status: 'RiskAccepted' }, SESSIONS.admin);
    assert.equal(noApprover.approverRequired, true);

    const accepted = await api.post(`/api/security/vulnerabilities/findings/${second.finding.id}/decide`, {
      status: 'RiskAccepted', approver: 'the client security officer',
    }, SESSIONS.admin);
    assert.equal(accepted.finding.status, 'RiskAccepted');
    assert.equal(accepted.finding.approver, 'the client security officer');

    const open = await api.get('/api/security/vulnerabilities/findings?source=penetration%20test', SESSIONS.admin);
    assert.ok(open.every((f) => ['Open', 'Fixed', 'RiskAccepted'].includes(f.status)));
  });

  test('AC-SEC-011-03-02', async () => {
    // "it includes every entry of the extension register (BR-ADM-001) and every known platform
    //  finding of BR-SEC-081, each with its product control or accepted risk"
    const scope = await api.get('/api/security/vulnerabilities/pen-test-scope?release=1.2.0', SESSIONS.admin);
    assert.equal(scope.everyEntryInScope, true);
    assert.equal(scope.extensionRegisterEntries, extensionRegister().length);
    assert.equal(scope.everyPlatformFindingInScope, true);
    assert.equal(scope.platformFindings, 5);
    assert.equal(scope.eachWithControl, true, 'each with its product control or accepted risk');
    assert.deepEqual(scope.rules, ['BR-ADM-001', 'BR-SEC-081']);

    const findings = await api.get('/api/security/vulnerabilities/platform-findings', SESSIONS.admin);
    assert.equal(findings.length, 5);
    assert.ok(findings.filter((f) => f.status === 'resolved natively').length === 2);
    assert.ok(findings.some((f) => /download-ownership filter/.test(f.control)));
    assert.ok(findings.every((f) => f.control));

    const firstEntry = extensionRegister()[0];
    await saveSettingAsync('sec.pentestacceptedrisks', [firstEntry.service ?? firstEntry.target], 0);
    const withAccepted = await api.get('/api/security/vulnerabilities/pen-test-scope', SESSIONS.admin);
    assert.ok(withAccepted.items.some((i) => i.control === 'accepted risk'));
  });
});

/* ================================================= PRD-SEC-015 incident management ====== */

describe('PRD-SEC-015 security incident management', () => {
  test('AC-SEC-015-01-01', async () => {
    // "the platform exports the audit events, authentication events and system-log entries of
    //  that period with a manifest (IC-SEC-02 or file export)"
    const denied = await api.post('/api/security/incidents/evidence', { incidentReference: 'INC-1' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditTrail.Export');

    const evidence = await api.post('/api/security/incidents/evidence', {
      incidentReference: 'INC-2026-0007', from: '2026-01-01T00:00:00.000Z',
    }, SESSIONS.admin);
    assert.equal(evidence.ok, true);
    assert.equal(evidence.manifest.incidentReference, 'INC-2026-0007');
    assert.ok(evidence.manifest.auditEvents >= 1);
    assert.ok(evidence.manifest.authenticationEvents >= 1);
    assert.ok(evidence.manifest.systemLogEntries >= 0);
    assert.ok(evidence.manifest.firstSequence >= 1);
    assert.match(evidence.signature, /^[0-9a-f]{64}$/);
    assert.deepEqual(evidence.deliveredBy, ['IC-SEC-02', 'file export']);
    assert.match(evidence.handledIn, /external incident tool/);

    const trail = await auditTrailAsync({ entity: 'IncidentEvidence' });
    assert.ok(trail.some((e) => e.entityId === 'INC-2026-0007'));
  });

  test('AC-SEC-015-01-02', async () => {
    // "a breach case is opened in SEC-008 and linked to the incident reference"
    const noPersonalData = await api.post('/api/security/incidents/link', {
      incidentReference: 'INC-2026-0008', personalDataInvolved: false,
    }, SESSIONS.privacy);
    assert.equal(noPersonalData.breachCaseOpened, false);

    const linked = await api.post('/api/security/incidents/link', {
      incidentReference: 'INC-2026-0009',
      personalDataInvolved: true,
      discoveredOnUtc: DISCOVERED,
      description: 'An intruder read a support mailbox holding customer messages',
      dataCategories: ['name', 'email'],
      systems: ['support mailbox'],
    }, SESSIONS.privacy);
    assert.equal(linked.ok, true);
    assert.equal(linked.breachCaseOpened, true);
    assert.equal(linked.case.incidentReference, 'INC-2026-0009');
    assert.equal(linked.case.status, 'Open');
    assert.equal(linked.linkedTo, 'PRD-SEC-008');

    const byReference = await api.get('/api/security/breaches?incidentReference=INC-2026-0009', SESSIONS.privacy);
    assert.equal(byReference.length, 1, 'the case is found by the incident reference');
    assert.equal(byReference[0].id, linked.case.id);
  });
});
