// PRD-SEC-004 Platform audit trail - one test per AC, named by AC ID. 8 stories, 20 criteria.
//
// The trail is the backbone every other module writes to, so these tests exercise it through the
// repository decorator the SEC plugin registers, not by calling the writer directly.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository, plainRepository, repositoryDecoratorRegistered } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import {
  auditAsync, queryAsync, verifyAsync, hashOf, REDACTED_FIELDS, IGNORED_FIELDS, CHAIN_LOCK_KEY,
} from '../../packages/server/src/core/audit.js';
import { withAuditContextAsync, newCorrelationId } from '../../packages/server/src/core/audit-context.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const trail = (query = '') => api.get(`/api/security/audit${query}`, SESSIONS.admin);
const newest = async (query) => (await trail(query))[0] ?? null;

/* ============================================ US-SEC-004-01 the repository decorator ==== */

describe('US-SEC-004-01 every audited change is written', () => {
  test('AC-SEC-004-01-01', async () => {
    // "an AuditEvent is written with actor (and, when impersonating, the original customer), IP
    //  address, UTC time, store, entity name, entity id, old values and new values (BR-SEC-010)"
    assert.equal(repositoryDecoratorRegistered(), true, 'the decorator is registered');
    const registration = await api.get('/api/security/audit/decorator', SESSIONS.admin);
    assert.equal(registration.order, 11, 'after NopDbStartup registers the repository at order 10');

    // an insert through any repository method
    const inserted = await withAuditContextAsync(
      { actor: 'admin@example.com', actorRole: 'Administrators', ipAddress: '41.70.1.9', storeId: 1 },
      () => repository('Company').insertAsync({ name: 'Audited Ltd', status: 'Active' }),
    );
    const onInsert = await newest('?entity=Company');
    assert.equal(onInsert.event, 'AUD-SEC-001');
    assert.equal(onInsert.entity, 'Company');
    assert.equal(onInsert.entityId, String(inserted.id));
    assert.equal(onInsert.actor, 'admin@example.com');
    assert.equal(onInsert.ipAddress, '41.70.1.9');
    assert.equal(onInsert.storeId, 1);
    assert.ok(onInsert.occurredOnUtc.endsWith('Z'), 'UTC time');
    assert.equal(onInsert.before, null);
    assert.equal(onInsert.after.name, 'Audited Ltd');

    // an update records the old and the new values of the fields that changed
    await withAuditContextAsync(
      { actor: 'admin@example.com', ipAddress: '41.70.1.9' },
      () => repository('Company').updateAsync({ ...inserted, status: 'Suspended' }),
    );
    const onUpdate = await newest('?entity=Company');
    assert.deepEqual(onUpdate.before, { status: 'Active' });
    assert.deepEqual(onUpdate.after, { status: 'Suspended' });

    // and the original customer is kept when someone is acting for another
    await withAuditContextAsync(
      { actor: 'buyer@example.com', originalActor: 'agent.lilongwe@example.com' },
      () => repository('Company').updateAsync({ ...inserted, name: 'Audited Ltd (acting)' }),
    );
    const acting = await newest('?entity=Company');
    assert.equal(acting.actor, 'buyer@example.com');
    assert.equal(acting.originalActor, 'agent.lilongwe@example.com', 'the original customer is kept');

    // a delete records the old values
    await repository('Company').deleteAsync(inserted.id);
    const onDelete = await newest('?entity=Company');
    assert.equal(onDelete.after, null);
    assert.equal(onDelete.before.name, 'Audited Ltd (acting)');
  });

  test('AC-SEC-004-01-02', async () => {
    // "the matching rows are read first and one delete event with old values is written per row"
    const made = [];
    for (const code of ['CC-A', 'CC-B', 'CC-C']) {
      made.push(await repository('CostCentre').insertAsync({
        companyId: 9999, code, name: code, budget: 1000, spent: 0,
      }));
    }
    const before = (await trail('?entity=CostCentre')).length;
    const result = await repository('CostCentre').deleteAsync((c) => c.companyId === 9999);
    assert.equal(result.deleted, 3, 'the rows were read before they were deleted');

    const events = await trail('?entity=CostCentre');
    const deletes = events.filter((e) => e.after === null && made.some((m) => String(m.id) === e.entityId));
    assert.equal(deletes.length, 3, 'one delete event per row');
    assert.deepEqual(deletes.map((d) => d.before.code).sort(), ['CC-A', 'CC-B', 'CC-C'], 'each with its old values');
    assert.equal(events.length, before + 3);
    assert.equal((await repository('CostCentre').getAllAsync((c) => c.companyId === 9999)).length, 0);
  });

  test('AC-SEC-004-01-03', async () => {
    // "the SEC overrides of these virtual methods write the change event (BR-SEC-011)"
    const product = await repository('Product').getOneAsync((p) => p.published !== false);
    const acl = await api.post('/api/security/acl', {
      entity: 'Product', entityId: product.id, customerRoleIds: [3, 4],
    }, SESSIONS.admin);
    assert.equal(acl.ok, true);
    assert.equal(acl.overrideOf, 'AclService.SaveAclAsync');
    assert.equal(acl.before.subjectToAcl, false);
    assert.equal(acl.after.subjectToAcl, true);
    assert.deepEqual(acl.after.customerRoleIds, [3, 4]);
    const aclEvent = (await trail('?entity=Product')).find((e) => e.after?.customerRoleIds);
    assert.ok(aclEvent, 'the change is in the trail');
    assert.equal(aclEvent.note, 'access control list changed');

    const mapping = await api.post('/api/security/store-mappings', {
      entity: 'Product', entityId: product.id, storeIds: [1],
    }, SESSIONS.admin);
    assert.equal(mapping.overrideOf, 'StoreMappingService.SaveStoreMappingsAsync');
    assert.equal(mapping.after.limitedToStores, true);
    const mapEvent = (await trail('?entity=Product')).find((e) => e.after?.storeIds);
    assert.ok(mapEvent, 'the store mapping change is in the trail too');

    const denied = await api.post('/api/security/acl', {
      entity: 'Product', entityId: product.id, customerRoleIds: [],
    }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Configuration.ManageACL');
  });

  test('AC-SEC-004-01-04', async () => {
    // "the field name is recorded and the value is written as [redacted] (BR-SEC-012)"
    assert.ok(REDACTED_FIELDS.includes('passwordHash'));
    const customer = await repository('Customer').insertAsync({
      email: 'redaction@example.com', firstName: 'Red', lastName: 'Acted', roles: ['Registered'], password: 'demo', passwordSalt: 'abc123', active: true, deleted: false,
    });
    const onInsert = await newest(`?entity=Customer&entityId=${customer.id}`);
    assert.ok(onInsert.fields.includes('password'), 'the field name is recorded');
    assert.equal(onInsert.after.password, '[redacted]');
    assert.equal(onInsert.after.passwordSalt, '[redacted]');
    assert.equal(JSON.stringify(onInsert).includes('abc123'), false, 'the value never reaches the trail');

    await repository('Customer').updateAsync({ ...customer, password: 'another-one' });
    const onUpdate = await newest(`?entity=Customer&entityId=${customer.id}`);
    assert.deepEqual(onUpdate.fields, ['password']);
    assert.equal(onUpdate.after.password, '[redacted]');
    assert.equal(onUpdate.before.password, '[redacted]');
  });

  test('AC-SEC-004-01-05', async () => {
    // "an update changes only fields on the ignore list ... then no audit event is written"
    assert.ok(IGNORED_FIELDS.includes('lastActivityUtc'));
    const customer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const before = (await trail('?entity=Customer')).length;
    await repository('Customer').updateAsync({ ...customer, lastActivityUtc: new Date().toISOString() });
    assert.equal((await trail('?entity=Customer')).length, before, 'nothing is written');

    // the same save with a real field alongside is written, and names only what changed
    await repository('Customer').updateAsync({
      ...customer, lastActivityUtc: new Date().toISOString(), adminComment: 'called the customer',
    });
    const written = await trail('?entity=Customer');
    assert.equal(written.length, before + 1);
    assert.deepEqual(written[0].fields, ['adminComment'], 'the ignored field is not listed as a change');
  });

  test('AC-SEC-004-01-06', async () => {
    // "the entity change and the audit insert run in one transaction, so the change is rolled
    //  back and an error is logged (BR-SEC-015)"
    const company = await repository('Company').insertAsync({ name: 'Rollback Ltd', status: 'Active' });
    await api.post('/api/security/audit/fail-writes', { value: true }, SESSIONS.admin);
    try {
      let threw = false;
      try {
        await repository('Company').updateAsync({ ...company, status: 'Suspended' });
      } catch { threw = true; }
      assert.equal(threw, true, 'the call fails rather than losing the event');
      const stored = await repository('Company').getByIdAsync(company.id);
      assert.equal(stored.status, 'Active', 'the change is rolled back');

      let insertThrew = false;
      try {
        await repository('Company').insertAsync({ name: 'Never Stored Ltd', status: 'Active' });
      } catch { insertThrew = true; }
      assert.equal(insertThrew, true);
      assert.equal(await repository('Company').getOneAsync((c) => c.name === 'Never Stored Ltd'), null, 'the insert is rolled back too');

      const log = await plainRepository('Log').getAllAsync((l) => l.shortMessage?.includes('audit trail refused'));
      assert.ok(log.length >= 2, 'the error is logged');
      assert.equal(log[0].logLevel, 'Error');
    } finally {
      await api.post('/api/security/audit/fail-writes', { value: false }, SESSIONS.admin);
    }
    // and the trail works again afterwards
    const after2 = await repository('Company').updateAsync({ ...company, status: 'Suspended' });
    assert.equal(after2.status, 'Suspended');
  });
});

/* ================================================ US-SEC-004-02 the chain ============== */

describe('US-SEC-004-02 the chain cannot be rewritten', () => {
  test('AC-SEC-004-02-01', async () => {
    // "each event gets the next sequence number and a hash over its canonical content and the
    //  previous hash (BR-SEC-013)"
    const chain = await api.get('/api/security/audit/chain', SESSIONS.admin);
    assert.equal(chain.lockKey, CHAIN_LOCK_KEY);
    assert.equal(chain.lockKey, 'sec-audit-chain');

    const first = await auditAsync({
      event: 'AUD-SEC-001', area: 'SEC', entity: 'ChainProbe', entityId: 1, after: { step: 'one' },
    });
    const second = await auditAsync({
      event: 'AUD-SEC-001', area: 'SEC', entity: 'ChainProbe', entityId: 2, after: { step: 'two' },
    });
    assert.equal(second.sequence, first.sequence + 1, 'the next sequence number');
    assert.equal(second.previousHash, first.hash, 'and a hash over the one before it');
    assert.equal(second.hash, hashOf(second, first.hash));
    assert.notEqual(first.hash, second.hash);

    // two writers at once still produce one unbroken run of numbers
    const parallel = await Promise.all([1, 2, 3, 4, 5].map((n) => auditAsync({
      event: 'AUD-SEC-001', area: 'SEC', entity: 'ChainProbe', entityId: 10 + n, after: { step: n },
    })));
    const numbers = parallel.map((e) => e.sequence).sort((a, b) => a - b);
    assert.deepEqual(numbers, [...Array(5)].map((_, i) => numbers[0] + i), 'no number is reused or skipped');
  });

  test('AC-SEC-004-02-02', async () => {
    // "none exists; the database login of the application has insert and select rights only"
    const rights = await api.get('/api/security/audit/write-rights', SESSIONS.admin);
    assert.equal(rights.insert, true);
    assert.equal(rights.select, true);
    assert.equal(rights.update, false);
    assert.equal(rights.delete, false);
    assert.equal(rights.editOrDeleteOffered, false);
    assert.match(rights.note, /insert and select/);

    const sequence = (await trail())[0].sequence;
    for (const method of ['PATCH', 'PUT', 'DELETE']) {
      const res = await api.call(method, '/api/security/audit/1', {}, SESSIONS.admin);
      assert.equal(res.status, 404, `no ${method} route is offered, even to an administrator`);
    }
    assert.equal((await trail())[0].sequence, sequence, 'nothing changed');
  });

  test('AC-SEC-004-02-03', async () => {
    // "the result is Broken at the first bad sequence number, the security officer is alerted
    //  with message Sec.ChainBroken and AUD-SEC-003 is written"
    const verified = await api.post('/api/security/audit/verify', {}, SESSIONS.admin);
    assert.equal(verified.result, 'Verified');
    assert.ok(verified.checked > 0);

    // alter an event in the store, the way only a database write could
    const rows = (await plainRepository('AuditEntry').getAllAsync()).sort((a, b) => a.sequence - b.sequence);
    const victim = rows[Math.floor(rows.length / 2)];
    await plainRepository('AuditEntry').updateAsync({ ...victim, after: { tampered: true } });

    const broken = await api.post('/api/security/audit/verify', {}, SESSIONS.admin);
    assert.equal(broken.result, 'Broken');
    assert.equal(broken.atSequence, victim.sequence, 'at the first bad sequence number');
    assert.equal(broken.messageKey, 'Sec.ChainBroken');
    assert.equal(broken.officerAlerted, true);
    const alert = await deliveriesAsync({ event: 'Sec.ChainBroken' });
    assert.ok(alert.length >= 1, 'the security officer is alerted');
    const written = (await trail('?event=AUD-SEC-003'))[0];
    assert.ok(written, 'AUD-SEC-003 is written');
    assert.equal(written.outcome, 'rejected');

    // put it back and the chain verifies again
    await plainRepository('AuditEntry').updateAsync(victim);
    const again = await api.post('/api/security/audit/verify', {}, SESSIONS.admin);
    assert.equal(again.result, 'Verified');

    // a removed event is caught too
    const last = (await plainRepository('AuditEntry').getAllAsync()).sort((a, b) => b.sequence - a.sequence)[0];
    const middle = rows[Math.floor(rows.length / 3)];
    await plainRepository('AuditEntry').deleteAsync(middle.id);
    const gap = await api.post('/api/security/audit/verify', {}, SESSIONS.admin);
    assert.equal(gap.result, 'Broken');
    assert.equal(gap.atSequence, middle.sequence);
    await plainRepository('AuditEntry').insertAsync(middle);
    assert.ok(last.sequence > 0);
  });
});

/* ======================================= US-SEC-004-03 search and export ================ */

describe('US-SEC-004-03 search and export', () => {
  test('AC-SEC-004-03-01', async () => {
    // "matching events are listed with old and new values, without SQL"
    const screen = await api.get('/api/security/audit/search?entity=Customer', SESSIONS.admin);
    assert.equal(screen.sqlRequired, false);
    assert.deepEqual(screen.searchableBy, ['actor', 'entity', 'entityId', 'event', 'storeId', 'from', 'to', 'amount']);
    assert.ok(screen.events.length >= 1);
    assert.ok(screen.events.every((e) => e.entity === 'Customer'));

    const byActor = await api.get('/api/security/audit?actor=admin%40example.com', SESSIONS.admin);
    assert.ok(byActor.every((e) => e.actor === 'admin@example.com'));
    const byEvent = await api.get('/api/security/audit?event=AUD-SEC-001', SESSIONS.admin);
    assert.ok(byEvent.every((e) => e.event === 'AUD-SEC-001'));
    const byStore = await api.get('/api/security/audit?storeId=1', SESSIONS.admin);
    assert.ok(byStore.every((e) => Number(e.storeId) === 1));
    const byDate = await api.get(`/api/security/audit?from=${new Date(Date.now() - 3600000).toISOString()}`, SESSIONS.admin);
    assert.ok(byDate.length >= 1);
    const withValues = byEvent.find((e) => e.before && e.after);
    assert.ok(withValues, 'old and new values are listed');

    // an order event carries the amount the criterion names
    const order = await repository('Order').insertAsync({
      orderNumber: 'AUD-1', customerEmail: 'buyer@example.com', orderStatus: 'Pending', orderTotal: 27500, createdOnUtc: new Date().toISOString(),
    });
    const byAmount = await api.get('/api/security/audit?amount=27500', SESSIONS.admin);
    assert.ok(byAmount.some((e) => e.entityId === String(order.id)), 'searchable by amount where the entity has one');

    const denied = await api.get('/api/security/audit', SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditTrail.View');
  });

  test('AC-SEC-004-03-02', async () => {
    // "files are produced in CSV, JSON and XLSX with a manifest ... and a signature; message
    //  Sec.AuditExportReady is shown and AUD-SEC-002 is written"
    const denied = await api.post('/api/security/audit/export', { filter: { entity: 'Customer' } }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditTrail.Export');

    const exported = await api.post('/api/security/audit/export', { filter: { entity: 'Customer' } }, SESSIONS.admin);
    assert.equal(exported.ok, true);
    assert.deepEqual(exported.files.map((f) => f.format), ['csv', 'json', 'xlsx']);
    assert.equal(exported.manifest.formatsProposed, true, 'the formats are the PRD Proposed set');
    assert.deepEqual(exported.manifest.filter, { entity: 'Customer' });
    assert.ok(exported.manifest.eventCount >= 1, 'the event count');
    assert.ok(exported.manifest.firstSequence && exported.manifest.lastSequence, 'the first and last sequence numbers');
    assert.ok(exported.manifest.firstHash && exported.manifest.lastHash, 'the chain hashes at both ends');
    assert.match(exported.signature, /^[0-9a-f]{64}$/, 'a signature of the manifest');
    assert.equal(exported.signatureAlgorithm, 'HMAC-SHA256');
    assert.equal(exported.messageKey, 'Sec.AuditExportReady');
    assert.ok(exported.message && exported.message !== 'Sec.AuditExportReady');
    assert.equal(exported.csv.split('\n').length, exported.manifest.eventCount + 1);

    const written = (await trail('?event=AUD-SEC-002'))[0];
    assert.ok(written, 'AUD-SEC-002 is written');
    assert.equal(written.actor, 'admin@example.com');
    assert.equal(written.after.eventCount, exported.manifest.eventCount);
  });
});

/* ================================================= US-SEC-004-04 replay ================= */

describe('US-SEC-004-04 replay', () => {
  test('AC-SEC-004-04-01', async () => {
    // "the field values of the entity at T are rebuilt from its events and shown with the event
    //  that set each value"
    const company = await repository('Company').insertAsync({ name: 'Replay Ltd', status: 'Active' });
    await new Promise((r) => setTimeout(r, 5));
    await repository('Company').updateAsync({ ...company, status: 'Suspended' });
    const midpoint = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 5));
    await repository('Company').updateAsync({ ...company, status: 'Closed', name: 'Replay Holdings Ltd' });

    const atMidpoint = await api.get(`/api/security/audit/replay/entity?entity=Company&entityId=${company.id}&at=${encodeURIComponent(midpoint)}`, SESSIONS.admin);
    assert.equal(atMidpoint.ok, true);
    assert.equal(atMidpoint.values.status, 'Suspended', 'the value as it was at that time');
    assert.equal(atMidpoint.values.name, 'Replay Ltd');
    assert.ok(atMidpoint.setBy.status.sequence, 'with the event that set it');
    assert.equal(atMidpoint.setBy.status.event, 'AUD-SEC-001');

    const now = await api.get(`/api/security/audit/replay/entity?entity=Company&entityId=${company.id}`, SESSIONS.admin);
    assert.equal(now.values.status, 'Closed');
    assert.equal(now.values.name, 'Replay Holdings Ltd');

    const before = await api.get(`/api/security/audit/replay/entity?entity=Company&entityId=${company.id}&at=2020-01-01T00:00:00.000Z`, SESSIONS.admin);
    assert.equal(before.ok, false, 'there are no events before that time');
  });

  test('AC-SEC-004-04-02', async () => {
    // "the roles, permission mappings, ACL, store mappings, scopes and delegations in force for
    //  that user at T are rebuilt from their audited changes"
    const staff = await repository('Customer').insertAsync({
      email: 'replay.staff@example.com', firstName: 'Replay', lastName: 'Staff', roles: ['Registered'], password: 'demo', active: true, deleted: false,
    });
    await repository('Customer').updateAsync({ ...staff, roles: ['Registered', 'Catalogue'] });
    await repository('PermissionScope').insertAsync({
      customerId: staff.id, dimension: 'region', value: 'Central', grantedBy: 'admin@example.com',
    });
    const afterGrant = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 5));
    await repository('Customer').updateAsync({ ...staff, roles: ['Registered'] });

    const atGrant = await api.get(`/api/security/audit/replay/access?customerId=${staff.id}&at=${encodeURIComponent(afterGrant)}`, SESSIONS.admin);
    assert.equal(atGrant.ok, true);
    assert.deepEqual(atGrant.roles, ['Registered', 'Catalogue'], 'the roles in force at that time');
    assert.deepEqual(atGrant.scopes, [{ dimension: 'region', value: 'Central' }], 'and the scopes');
    assert.equal(atGrant.rebuiltFrom, 'the audit trail');
    assert.ok(Array.isArray(atGrant.permissions) && Array.isArray(atGrant.acl)
      && Array.isArray(atGrant.storeMappings) && Array.isArray(atGrant.delegations));

    const now = await api.get(`/api/security/audit/replay/access?customerId=${staff.id}`, SESSIONS.admin);
    assert.deepEqual(now.roles, ['Registered'], 'and as they are now');
  });
});

/* ========================================== US-SEC-004-05 the compliance report ========= */

describe('US-SEC-004-05 the compliance report', () => {
  test('AC-SEC-004-05-01', async () => {
    // "it lists logins and failed logins, changes made in the admin area by user, setting
    //  changes and staff read access to customer records, and can be exported"
    await api.post('/api/identity/sign-in', { email: 'support@example.com', password: 'demo' }, 'sec-report-1');
    await api.post('/api/identity/sign-in', { email: 'support@example.com', password: 'wrong' }, 'sec-report-2');
    await saveSettingAsync('sec.reportprobe', 'value-one', 0);
    await api.post('/api/identity/users/open', { email: 'buyer@example.com', page: 'Customer edit' }, SESSIONS.admin);

    const report = await api.get(`/api/security/audit/compliance-report?from=${new Date(Date.now() - 3600000).toISOString()}`, SESSIONS.admin);
    assert.ok(report.logins >= 1, 'logins');
    assert.ok(report.failedLogins >= 1, 'and failed logins');
    assert.ok(report.adminChangesByUser.some((a) => a.actor === 'admin@example.com'), 'changes in the admin area by user');
    assert.ok(report.settingChanges.some((s) => s.key === 'sec.reportprobe'), 'setting changes');
    assert.ok(report.staffReadAccess.some((s) => s.staff === 'admin@example.com'), 'staff read access');
    assert.equal(report.exportable, true);
    assert.ok(report.csv.split('\n').length > 3, 'and it can be exported');

    const denied = await api.get('/api/security/audit/compliance-report', SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.AuditTrail.View');
  });

  test('AC-SEC-004-05-02', async () => {
    // "the view events are returned with staff user, customer, page and time in sequence order;
    //  views of other record types are not captured"
    const customer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    for (const page of ['Customer edit', 'Order detail', 'Address']) {
      await api.post('/api/identity/users/open', { email: customer.email, page }, SESSIONS.admin);
    }
    const page = await queryAsync({ event: 'AUD-IAM-010', pageSize: 100 });
    assert.ok(page.events.length >= 3);
    const sequences = page.events.map((e) => e.sequence);
    assert.deepEqual(sequences, [...sequences].sort((a, b) => a - b), 'in sequence order');
    for (const e of page.events) {
      assert.equal(e.event, 'AUD-IAM-010');
      assert.ok(e.actor, 'the staff user');
      assert.ok(e.entityId, 'the customer');
      assert.ok(e.after.page, 'the page');
      assert.ok(e.occurredOnUtc, 'and the time');
      assert.equal(e.entity, 'Customer', 'views of other record types are not captured');
    }
  });

  test('AC-SEC-004-05-03', async () => {
    // "the event records actor, time, key, StoreId, old value and new value; for a key flagged
    //  secret both values are written as [redacted] (BR-SEC-012)"
    await withAuditContextAsync({ actor: 'admin@example.com', storeId: 1 }, async () => {
      await saveSettingAsync('sec.plainprobe', 'first', 0);
      await saveSettingAsync('sec.plainprobe', 'second', 0);
      await saveSettingAsync('pay.gateway.apikey', 'live-key-1', 0);
      await saveSettingAsync('pay.gateway.apikey', 'live-key-2', 0);
    });

    const settings = await trail('?entity=Setting');
    const plain = settings.find((e) => e.after?.name === 'sec.plainprobe' && e.before?.value === 'first');
    assert.ok(plain, 'the setting change is written');
    assert.equal(plain.actor, 'admin@example.com');
    assert.ok(plain.occurredOnUtc);
    assert.equal(plain.after.name, 'sec.plainprobe', 'the key');
    assert.equal(plain.storeId, 1);
    assert.equal(plain.before.value, 'first', 'the old value');
    assert.equal(plain.after.value, 'second', 'and the new value');

    const secret = settings.find((e) => e.after?.name === 'pay.gateway.apikey' && e.before);
    assert.ok(secret, 'a secret key is written too');
    assert.equal(secret.before.value, '[redacted]');
    assert.equal(secret.after.value, '[redacted]');
    assert.equal(JSON.stringify(settings).includes('live-key-2'), false, 'the value never reaches the trail');
  });
});

/* ====================================== US-SEC-004-06 the contract IC-SEC-01 ============ */

describe('US-SEC-004-06 IC-SEC-01', () => {
  test('AC-SEC-004-06-01', async () => {
    // "the event is in the same chain, linked to the entity changes of the same request by a
    //  correlation id"
    const correlationId = newCorrelationId();
    const result = await withAuditContextAsync({ correlationId, actor: 'finance@example.com' }, async () => {
      const company = await repository('Company').insertAsync({ name: 'Correlated Ltd', status: 'Active' });
      const written = await auditAsync({
        event: 'AUD-PAY-003',
        area: 'PAY',
        feature: 'PRD-PAY-019',
        entity: 'FraudRule',
        entityId: 77,
        after: { name: 'velocity', enabled: true },
        note: 'fraud rule changed',
      });
      return { company, written };
    });
    assert.ok(result.written.sequence > 0, 'IC-SEC-01 WriteAsync returns the sequence number');
    assert.equal(result.written.correlationId, correlationId);

    const sameRequest = await api.get(`/api/security/audit?correlationId=${correlationId}`, SESSIONS.admin);
    assert.ok(sameRequest.length >= 2, 'the module event and the entity changes of the request are linked');
    assert.ok(sameRequest.some((e) => e.event === 'AUD-PAY-003'));
    assert.ok(sameRequest.some((e) => e.entity === 'Company'));
    const chain = await api.post('/api/security/audit/verify', {}, SESSIONS.admin);
    assert.equal(chain.result, 'Verified', 'and they are in the same chain');

    let rejected = false;
    try { await auditAsync({ entity: 'Company', entityId: 1, after: {} }); } catch { rejected = true; }
    assert.equal(rejected, true, 'an event with no event id is a validation error');
  });

  test('AC-SEC-004-06-02', async () => {
    // "events are returned in sequence order without gaps, one page at a time, with the last
    //  sequence number of the page, so a repeated call from that number returns the next page"
    for (let i = 0; i < 7; i += 1) {
      await auditAsync({
        event: 'AUD-SEC-001', area: 'SEC', entity: 'PagingProbe', entityId: i, after: { i },
      });
    }
    const first = await api.get('/api/security/audit/query?entity=PagingProbe&pageSize=3', SESSIONS.admin);
    assert.equal(first.returned, 3);
    assert.equal(first.inSequenceOrder, true);
    assert.equal(first.more, true);
    assert.equal(first.lastSequence, first.events[2].sequence);
    const sequences = first.events.map((e) => e.sequence);
    assert.deepEqual(sequences, [...sequences].sort((a, b) => a - b));

    const second = await api.get(`/api/security/audit/query?entity=PagingProbe&pageSize=3&afterSequence=${first.lastSequence}`, SESSIONS.admin);
    assert.equal(second.returned, 3);
    assert.ok(second.events[0].sequence > first.lastSequence, 'the next page starts after the watermark');
    const third = await api.get(`/api/security/audit/query?entity=PagingProbe&pageSize=3&afterSequence=${second.lastSequence}`, SESSIONS.admin);
    assert.equal(third.returned, 1);
    assert.equal(third.more, false);

    const all = [...first.events, ...second.events, ...third.events].map((e) => e.sequence);
    assert.equal(new Set(all).size, 7, 'no event is returned twice and none is missed');
  });
});

/* ============================ US-SEC-004-07 and 08: fraud rules and approvals ============ */

describe('US-SEC-004-07 and 08', () => {
  test('AC-SEC-004-07-01', async () => {
    // "the audit trail holds the old and new values, the actor and the time, and the event is
    //  found by searching for the rule"
    const rule = await repository('FraudRule').insertAsync({
      name: 'velocity-limit', enabled: false, threshold: 5,
    });
    await withAuditContextAsync({ actor: 'finance@example.com' }, async () => {
      await repository('FraudRule').updateAsync({ ...rule, enabled: true });
      await repository('FraudRule').updateAsync({ ...rule, enabled: true, threshold: 3 });
    });

    const byRule = await api.get(`/api/security/audit?entity=FraudRule&entityId=${rule.id}`, SESSIONS.admin);
    assert.ok(byRule.length >= 3, 'the rule is found by searching for it');
    const enabledEvent = byRule.find((e) => e.before?.enabled === false && e.after?.enabled === true);
    assert.ok(enabledEvent, 'enabling it is in the trail with old and new values');
    assert.equal(enabledEvent.actor, 'finance@example.com', 'the actor');
    assert.ok(enabledEvent.occurredOnUtc, 'and the time');
    const thresholdEvent = byRule.find((e) => e.before?.threshold === 5 && e.after?.threshold === 3);
    assert.ok(thresholdEvent, 'and so is changing it');
  });

  test('AC-SEC-004-08-01', async () => {
    // "the request, the approval decision, the approver and the resulting change are linked by
    //  one correlation id in the audit trail"
    const correlationId = newCorrelationId();
    await withAuditContextAsync({ correlationId, actor: 'seller@example.com' }, async () => {
      await auditAsync({
        event: 'AUD-SEC-001', area: 'SEL', feature: 'PRD-SEL-005', entity: 'PayoutAccount', entityId: 5, after: { requested: 'MW-BANK-9981' }, note: 'payout account change requested',
      });
    });
    await withAuditContextAsync({ correlationId, actor: 'finance@example.com' }, async () => {
      await auditAsync({
        event: 'AUD-ADM-004', area: 'ADM', feature: 'PRD-ADM-006', entity: 'ApprovalItem', entityId: 42, after: { decision: 'approved', approver: 'finance@example.com' }, note: 'approval decision',
      });
      await auditAsync({
        event: 'AUD-SEC-001', area: 'SEL', feature: 'PRD-SEL-005', entity: 'PayoutAccount', entityId: 5, before: { accountNumber: 'MW-BANK-0001' }, after: { accountNumber: 'MW-BANK-9981' }, note: 'payout account changed',
      });
    });

    const linked = await api.get(`/api/security/audit?correlationId=${correlationId}`, SESSIONS.admin);
    assert.equal(linked.length, 3, 'the request, the decision and the change are one story');
    assert.ok(linked.some((e) => e.note === 'payout account change requested'));
    const decision = linked.find((e) => e.entity === 'ApprovalItem');
    assert.equal(decision.after.approver, 'finance@example.com', 'the approver');
    assert.ok(linked.some((e) => e.before?.accountNumber === 'MW-BANK-0001' && e.after?.accountNumber === 'MW-BANK-9981'), 'and the resulting change');
    assert.equal(new Set(linked.map((e) => e.correlationId)).size, 1, 'linked by one correlation id');
  });
});
