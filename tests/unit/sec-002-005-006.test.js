// PRD-SEC-002 Edge protection (12 ACs), PRD-SEC-005 Anomaly and correlation detection (3) and
// PRD-SEC-006 Data residency (3, held by DP-01). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { registerProvider } from '../../packages/server/src/core/providers.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

/* ==================================================== PRD-SEC-002 edge protection ====== */

describe('PRD-SEC-002 edge protection', () => {
  test('AC-SEC-002-01-01', async () => {
    // "every public request passes the WAF and DDoS service of the hosting or CDN provider, and
    //  the application accepts traffic only from that service"
    const before2 = await api.get('/api/security/edge', SESSIONS.admin);
    assert.equal(before2.ok, false);
    assert.equal(before2.wafService, 'not configured');
    assert.equal(before2.everyPublicRequestPassesTheEdge, false);

    const denied = await api.post('/api/security/edge', { values: { wafService: 'x' } }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Configuration.ManageSettings');

    const recorded = await api.post('/api/security/edge', {
      values: {
        provider: 'AWS',
        region: 'af-south-1',
        wafService: 'AWS WAF',
        ddosService: 'AWS Shield',
        encryptionAtRest: 'KMS-managed volume encryption',
        evidence: 'hosting ticket OPS-2001',
        applicationAcceptsTrafficFrom: 'the CloudFront distribution only',
      },
    }, SESSIONS.admin);
    assert.equal(recorded.ok, true);
    assert.equal(recorded.edge.ok, true);
    assert.equal(recorded.edge.everyPublicRequestPassesTheEdge, true);
    assert.equal(recorded.edge.applicationAcceptsTrafficFrom, 'the CloudFront distribution only');
  });

  test('AC-SEC-002-01-02', async () => {
    // "they are blocked and logged by the WAF"
    const sqli = await api.post('/api/security/edge/waf', {
      path: '/search', query: "q=1' OR 1=1 --", ipAddress: '203.0.113.9',
    }, 'sec-attacker');
    assert.equal(sqli.blocked, true);
    assert.equal(sqli.rule, 'sql-injection');
    assert.equal(sqli.reachedApplication, false);
    assert.equal(sqli.statusCode, 403);

    const xss = await api.post('/api/security/edge/waf', {
      path: '/product/1', query: 'review=<script>alert(1)</script>', ipAddress: '203.0.113.9',
    }, 'sec-attacker');
    assert.equal(xss.blocked, true);
    assert.equal(xss.rule, 'cross-site-scripting');

    const normal = await api.post('/api/security/edge/waf', { path: '/category/5', query: 'page=2' }, 'sec-attacker');
    assert.equal(normal.blocked, false);
    assert.equal(normal.reachedApplication, true);

    const logs = await plainRepository('Log').getAllAsync((l) => l.shortMessage?.includes('WAF blocked'));
    assert.ok(logs.length >= 2, 'each block is logged');
    assert.equal(logs[0].ipAddress, '203.0.113.9');
  });

  test('AC-SEC-002-01-03', async () => {
    // "ForwardedForHeaderName, KnownProxies and KnownNetworks are set so the real client IP
    //  address is recorded, not the proxy address"
    const before2 = await api.get('/api/security/edge/client-ip?forwardedFor=41.70.1.9,10.0.0.5&remoteAddress=10.0.0.5', SESSIONS.admin);
    assert.equal(before2.configured, false);
    assert.equal(before2.recordedIpAddress, '10.0.0.5', 'without them the proxy address is recorded');

    await saveSettingAsync('hostingconfig.forwardedforheadername', 'X-Forwarded-For', 0);
    await saveSettingAsync('hostingconfig.knownproxies', ['10.0.0.5'], 0);
    await saveSettingAsync('hostingconfig.knownnetworks', ['10.0.0.0/8'], 0);

    const after2 = await api.get('/api/security/edge/client-ip?forwardedFor=41.70.1.9,10.0.0.5&remoteAddress=10.0.0.5', SESSIONS.admin);
    assert.equal(after2.configured, true);
    assert.equal(after2.recordedIpAddress, '41.70.1.9', 'the real client address is recorded');
    assert.equal(after2.proxyAddress, '10.0.0.5');
    assert.deepEqual(after2.readBy, ['PRD-IAM-012', 'PRD-SEC-004']);
  });

  test('AC-SEC-002-02-01', async () => {
    // "the hosting checklist records provider, region, WAF / DDoS service and encryption at rest
    //  as evidence"
    const edge = await api.get('/api/security/edge', SESSIONS.admin);
    assert.equal(edge.provider, 'AWS', 'the cloud provider the client chose (AWS or Azure preferred)');
    assert.equal(edge.region, 'af-south-1');
    assert.equal(edge.wafService, 'AWS WAF');
    assert.equal(edge.ddosService, 'AWS Shield');
    assert.equal(edge.encryptionAtRest, 'KMS-managed volume encryption');
    assert.equal(edge.evidence, 'hosting ticket OPS-2001');
    assert.equal(edge.ok, true);

    const trail = await auditTrailAsync({ entity: 'HostingChecklist', entityId: 'edge' });
    assert.ok(trail.length >= 1, 'the record is audited');
  });

  test('AC-SEC-002-03-01', async () => {
    // "it is refused by the native ValidateIpAddress filter"
    const empty = await api.get('/api/security/edge/admin-ip?ipAddress=41.70.1.9', SESSIONS.admin);
    assert.equal(empty.allowed, true);
    assert.equal(empty.listEmpty, true);

    await saveSettingAsync('securitysettings.adminareaallowedipaddresses', ['41.70.1.9'], 0);
    const allowed = await api.get('/api/security/edge/admin-ip?ipAddress=41.70.1.9', SESSIONS.admin);
    assert.equal(allowed.allowed, true);
    const refused = await api.get('/api/security/edge/admin-ip?ipAddress=203.0.113.9', SESSIONS.admin);
    assert.equal(refused.allowed, false);
    assert.equal(refused.statusCode, 403);
    assert.equal(refused.nativeFilter, 'ValidateIpAddress');
    assert.match(refused.refusedBy, /ValidateIpAddress/);
    await saveSettingAsync('securitysettings.adminareaallowedipaddresses', [], 0);
  });

  test('AC-SEC-002-03-02', async () => {
    // "the request is rejected and, with LogHoneypotDetection on, logged"
    const off = await api.post('/api/security/edge/honeypot', { fields: { hpinput: 'bot' } }, 'sec-attacker');
    assert.equal(off.enabled, false);
    assert.equal(off.rejected, false);

    await saveSettingAsync('securitysettings.honeypotenabled', true, 0);
    await saveSettingAsync('securitysettings.loghoneypotdetection', true, 0);

    const human = await api.post('/api/security/edge/honeypot', { fields: { email: 'a@b.com' } }, 'sec-attacker');
    assert.equal(human.rejected, false, 'a person leaves the hidden field empty');

    const bot = await api.post('/api/security/edge/honeypot', { fields: { hpinput: 'filled by a bot' } }, 'sec-attacker');
    assert.equal(bot.rejected, true);
    assert.equal(bot.logged, true);
    const logs = await plainRepository('Log').getAllAsync((l) => l.shortMessage === 'Honeypot detection');
    assert.ok(logs.length >= 1);

    await saveSettingAsync('securitysettings.loghoneypotdetection', false, 0);
    const quiet = await api.post('/api/security/edge/honeypot', { fields: { hpinput: 'again' } }, 'sec-attacker');
    assert.equal(quiet.rejected, true);
    assert.equal(quiet.logged, false, 'with logging off the rejection is not logged');
  });

  test('AC-SEC-002-04-01', async () => {
    // "the SEC action filter records an UploadOwnership row with the download GUID, the uploading
    //  customer and, for a product attribute, the product (BR-SEC-005)"
    const actions = await api.get('/api/security/uploads/actions', SESSIONS.admin);
    assert.equal(actions.actions.length, 3);
    assert.ok(actions.actions.every((a) => /UploadFile/.test(a)));

    const buyer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const product = await repository('Product').getOneAsync((p) => p.published !== false);
    const recorded = await api.post('/api/security/uploads/ownership', {
      action: 'Nop.Web ShoppingCartController.UploadFileProductAttribute',
      downloadGuid: 'dl-guid-product',
      customerId: buyer.id,
      productId: product.id,
    }, SESSIONS.admin);
    assert.equal(recorded.ok, true);
    assert.equal(recorded.ownership.downloadGuid, 'dl-guid-product');
    assert.equal(recorded.ownership.customerId, buyer.id);
    assert.equal(recorded.ownership.productId, product.id, 'the product, for a product attribute');
    assert.equal(recorded.typeCheckOwnedBy, 'PRD-ADM-008');

    const checkout = await api.post('/api/security/uploads/ownership', {
      action: 'Nop.Web ShoppingCartController.UploadFileCheckoutAttribute', downloadGuid: 'dl-guid-checkout', customerId: buyer.id, productId: product.id,
    }, SESSIONS.admin);
    assert.equal(checkout.ownership.productId, null, 'a checkout attribute has no product');

    const other = await api.post('/api/security/uploads/ownership', {
      action: 'Admin SomeController.Upload', downloadGuid: 'dl-x', customerId: buyer.id,
    }, SESSIONS.admin);
    assert.equal(other.ok, false, 'the filter covers the three native actions');
  });

  test('AC-SEC-002-04-02', async () => {
    // "the single SEC ownership filter serves it only to the uploading customer, to a user
    //  holding Orders.OrdersView who is not a vendor user, or to a vendor user whose vendor owns
    //  the product; anyone else gets access denied with Sec.FileAccessDenied and AUD-SEC-012"
    await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, 'sec-owner');
    const owner = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-product' }, 'sec-owner');
    assert.equal(owner.served, true);
    assert.equal(owner.decidedBy, 'the uploading customer');

    const staff = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-product' }, SESSIONS.admin);
    assert.equal(staff.served, true);
    assert.match(staff.decidedBy, /Orders.OrdersView/);

    await createCustomerAsync({
      email: 'nosy.shopper@example.com', firstName: 'Nosy', lastName: 'Shopper', roles: ['Registered'],
    });
    await api.post('/api/identity/sign-in', { email: 'nosy.shopper@example.com', password: 'demo' }, 'sec-nosy');
    const refused = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-product' }, 'sec-nosy');
    assert.equal(refused.served, false);
    assert.equal(refused.messageKey, 'Sec.FileAccessDenied');
    assert.equal(refused.auditEvent, 'AUD-SEC-012');

    const trail = await auditTrailAsync({ event: 'AUD-SEC-012' });
    assert.ok(trail.some((e) => e.entityId === 'dl-guid-product'), 'AUD-SEC-012 is written');
  });

  test('AC-SEC-002-04-03', async () => {
    // "it is served only to a user holding Orders.OrdersView who is not a vendor user"
    const staff = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-legacy' }, SESSIONS.admin);
    assert.equal(staff.served, true);
    assert.equal(staff.noOwnershipRow, true);

    const shopper = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-legacy' }, 'sec-nosy');
    assert.equal(shopper.served, false);
    assert.equal(shopper.noOwnershipRow, true);
    assert.equal(shopper.messageKey, 'Sec.FileAccessDenied');

    const guest = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-legacy', asGuest: true }, 'sec-nosy');
    assert.equal(guest.served, false);
  });

  test('AC-SEC-002-04-04', async () => {
    // "the filter serves it only if the file is recorded for a product of that vendor or is the
    //  download or sample download of a product of that vendor"
    const vendor = await repository('Vendor').getOneAsync(() => true);
    const ownProduct = await repository('Product').getOneAsync((p) => Number(p.vendorId) === Number(vendor.id));
    assert.ok(ownProduct, 'the seller has a product');
    await createCustomerAsync({
      email: 'vendor.user@example.com', firstName: 'Vendor', lastName: 'User', roles: ['Vendors'], vendorId: vendor.id,
    });
    await api.post('/api/identity/sign-in', { email: 'vendor.user@example.com', password: 'demo' }, 'sec-vendor');

    await api.post('/api/security/uploads/ownership', {
      action: 'Nop.Web ShoppingCartController.UploadFileProductAttribute', downloadGuid: 'dl-guid-vendor', customerId: 1, productId: ownProduct.id,
    }, SESSIONS.admin);
    const own = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-vendor', area: 'admin' }, 'sec-vendor');
    assert.equal(own.served, true);
    assert.match(own.decidedBy, /vendor owns the product/);

    const otherProduct = await repository('Product').getOneAsync((p) => Number(p.vendorId) !== Number(vendor.id));
    await api.post('/api/security/uploads/ownership', {
      action: 'Nop.Web ShoppingCartController.UploadFileProductAttribute', downloadGuid: 'dl-guid-other-vendor', customerId: 1, productId: otherProduct?.id ?? 0,
    }, SESSIONS.admin);
    const refused = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-other-vendor', area: 'admin' }, 'sec-vendor');
    assert.equal(refused.served, false);
    assert.equal(refused.messageKey, 'Sec.FileAccessDenied');
    const trail = await auditTrailAsync({ event: 'AUD-SEC-012', entityId: 'dl-guid-other-vendor' });
    assert.ok(trail.length >= 1);
  });

  test('AC-SEC-002-04-05', async () => {
    // "the SEC filter applies the provider decision instead of the base rule: served only when
    //  every claiming provider returns Allow; a Deny gives access denied and AUD-SEC-012; the
    //  provider adds no filter of its own"
    registerProvider('IC-SEC-05', {
      name: 'files of e-Government applications',
      area: 'EGV',
      feature: 'PRD-EGV-002',
      fn: async ({ downloadGuid, requester }) => {
        if (!String(downloadGuid).startsWith('egv-')) return { claimed: false };
        return requester?.email === 'buyer@example.com'
          ? { claimed: true, decision: 'Allow' }
          : { claimed: true, decision: 'Deny', reason: 'the file belongs to another applicant' };
      },
    });

    const registered = await api.get('/api/security/uploads/providers', SESSIONS.admin);
    assert.ok(registered.some((p) => p.feature === 'PRD-EGV-002'));

    const allowed = await api.post('/api/security/downloads/access', { downloadGuid: 'egv-application-1' }, 'sec-owner');
    assert.equal(allowed.served, true);
    assert.equal(allowed.providerDecision, true);
    assert.deepEqual(allowed.decidedBy, ['PRD-EGV-002'], 'the provider decided, not the base rule');

    // even a staff user who would pass the base rule is refused when the provider denies
    const denied = await api.post('/api/security/downloads/access', { downloadGuid: 'egv-application-1' }, SESSIONS.admin);
    assert.equal(denied.served, false);
    assert.equal(denied.decidedBy, 'PRD-EGV-002');
    assert.equal(denied.messageKey, 'Sec.FileAccessDenied');
    const trail = await auditTrailAsync({ event: 'AUD-SEC-012', entityId: 'egv-application-1' });
    assert.ok(trail.length >= 1, 'AUD-SEC-012 is written');

    // a file no provider claims still follows the base rule
    const base = await api.post('/api/security/downloads/access', { downloadGuid: 'dl-guid-product' }, 'sec-owner');
    assert.equal(base.served, true);
    assert.equal(base.providerDecision, undefined);
  });

  test('AC-SEC-002-04-06', async () => {
    // "it is refused by the ADM-008 upload policy (BR-ADM-060), which owns server-side type
    //  checks for all upload actions; SEC adds no type check of its own"
    const refused = await api.post('/api/security/uploads/type-check', {
      action: 'Nop.Web ReturnRequestController.UploadFileReturnRequest', fileName: 'payload.exe', contentType: 'application/octet-stream', content: 'not allowed',
    }, 'sec-owner');
    assert.equal(refused.ok, false);
    assert.equal(refused.checkedBy, 'PRD-ADM-008');
    assert.equal(refused.secAddsNoCheck, true);
    assert.equal(refused.rule, 'BR-ADM-060');
    assert.equal(refused.messageKey, 'Adm.UploadTypeNotAllowed');

    const accepted = await api.post('/api/security/uploads/type-check', {
      action: 'Nop.Web ReturnRequestController.UploadFileReturnRequest', fileName: 'photo.jpg', contentType: 'image/jpeg', content: 'ÿØÿ photo bytes',
    }, 'sec-owner');
    assert.equal(accepted.checkedBy, 'PRD-ADM-008');
  });
});

/* ======================================== PRD-SEC-005 the security-monitoring export ==== */

describe('PRD-SEC-005 anomaly and correlation detection', () => {
  test('AC-SEC-005-01-01', async () => {
    // "they are sent through IC-SEC-02 in batches by a scheduled task, in sequence order,
    //  without gaps"
    const config = await api.get('/api/security/monitoring/configuration', SESSIONS.admin);
    assert.equal(config.enabled, true);
    assert.equal(config.format, 'CEF');

    const first = await api.post('/api/security/monitoring/export-task', {}, SESSIONS.admin);
    assert.equal(first.enabled, true);
    assert.equal(first.contract, 'IC-SEC-02 PushBatch');
    const batch = first.batches[first.batches.length - 1];
    assert.equal(batch.status, 'Acknowledged');
    assert.ok(batch.firstSequence <= batch.lastSequence);
    assert.ok(batch.eventCount > 0);

    // the next run starts after the watermark, so no event is sent twice and none is skipped
    const second = await api.post('/api/security/monitoring/export-task', {}, SESSIONS.admin);
    const next = second.batches[second.batches.length - 1];
    if (next.firstSequence) assert.ok(next.firstSequence > batch.lastSequence, 'the next batch follows the last one');

    const batches = await api.get('/api/security/monitoring/batches', SESSIONS.admin);
    assert.ok(batches.every((b) => b.inSequenceOrder === true));
    assert.ok(batches.every((b) => b.sources.includes('authentication')), 'audit, authentication, risk flags and system log');
  });

  test('AC-SEC-005-01-02', async () => {
    // "the batch stays Queued and is retried; when the backlog exceeds the configured age the
    //  security officer is alerted (AUD-SEC-011)"
    await saveSettingAsync('sec.securitymonitoringexport', {
      enabled: true, format: 'CEF', endpoint: 'siem.internal', batchSize: 50, backlogAgeMinutes: 60,
    }, 0);
    // make something new to export, then fail the adapter
    await api.post('/api/security/audit/write', {
      event: 'AUD-SEC-001', area: 'SEC', entity: 'ExportProbe', entityId: 1, after: { probe: true },
    }, SESSIONS.admin);
    const failed = await api.post('/api/security/monitoring/export-task', { adapterFails: true }, SESSIONS.admin);
    const queued = failed.batches.find((b) => b.status === 'Queued');
    assert.ok(queued, 'the batch stays Queued');

    const retried = await api.post('/api/security/monitoring/export-task', { adapterFails: true }, SESSIONS.admin);
    assert.ok(retried.batches.some((b) => b.retried === true), 'and is retried');

    const young = await api.post('/api/security/monitoring/backlog-check', {}, SESSIONS.admin);
    assert.equal(young.alerted, false, 'a fresh backlog is not an alert');

    // age the queued batch past the configured age
    const row = (await plainRepository('SecurityExportBatch').getAllAsync((b) => b.status === 'Queued'))[0];
    await plainRepository('SecurityExportBatch').updateAsync({
      ...row, createdOnUtc: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    });
    const alerted = await api.post('/api/security/monitoring/backlog-check', {}, SESSIONS.admin);
    assert.equal(alerted.alerted, true);
    assert.equal(alerted.auditEvent, 'AUD-SEC-011');
    assert.equal(alerted.officerAlerted, true);
    const trail = await auditTrailAsync({ event: 'AUD-SEC-011' });
    assert.ok(trail.length >= 1);
    const sent = await deliveriesAsync({ event: 'Sec.Core.ExportBacklog' });
    assert.ok(sent.length >= 1, 'the notice goes out through TRK-005');

    // once the adapter answers, the queued batch is acknowledged
    const recovered = await api.post('/api/security/monitoring/export-task', {}, SESSIONS.admin);
    assert.ok(recovered.batches.some((b) => b.status === 'Acknowledged'));
  });

  test('AC-SEC-005-02-01', async () => {
    // "detection and alerting happen in the monitoring system (external); the product supplies
    //  complete events only"
    const split = await api.get('/api/security/monitoring/detection', SESSIONS.admin);
    assert.equal(split.productDetects, false);
    assert.match(split.correlationAndAnomalyRulesLiveIn, /monitoring system \(external\)/);
    assert.match(split.alertingLiveIn, /monitoring system \(external\)/);
    assert.deepEqual(split.productSupplies, ['audit events', 'authentication events', 'risk flags', 'system-log errors']);
    assert.equal(split.eventsComplete, true);
    assert.equal(split.inSequenceOrder, true);
    assert.equal(split.contract, 'IC-SEC-02');
  });
});

/* ============================================================= PRD-SEC-006 residency ==== */

describe('PRD-SEC-006 data residency', () => {
  test('AC-SEC-006-01-01', async () => {
    // "the database, file storage, backups and logs are created in the decided region and the
    //  region is recorded in the instance profile and the hosting checklist" - held by DP-01
    const before2 = await api.get('/api/security/residency', SESSIONS.admin);
    assert.equal(before2.decidedRegion, 'not configured');
    assert.equal(before2.heldBy, 'DP-01');
    assert.match(before2.prototypeDefaultLabel, /decision DP-01 pending/);
    assert.deepEqual(before2.items.map((i) => i.artefact), ['database', 'file storage', 'backups', 'logs']);

    const recorded = await api.post('/api/security/residency', {
      region: 'af-south-1',
      artefacts: {
        database: { region: 'af-south-1', evidence: 'OPS-2001' },
        'file storage': { region: 'af-south-1', evidence: 'OPS-2002' },
        backups: { region: 'af-south-1', evidence: 'OPS-2003' },
        logs: { region: 'af-south-1', evidence: 'OPS-2004' },
      },
    }, SESSIONS.admin);
    assert.equal(recorded.ok, true);
    assert.equal(recorded.residency.decidedRegion, 'af-south-1');
    assert.equal(recorded.residency.ok, true);
    assert.equal(recorded.residency.instanceProfileRecorded, true);
    assert.ok(recorded.residency.items.every((i) => i.inDecidedRegion));

    const denied = await api.post('/api/security/residency', { region: 'eu-west-1' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Configuration.ManageSettings');
  });

  test('AC-SEC-006-01-02', async () => {
    // "a transfer record exists for it in the SEC-012 register; without it the go-live checklist
    //  fails"
    await saveSettingAsync('sec.integrationenabled.sms.gateway', true, 0);
    await saveSettingAsync('sec.integrationregion.sms.gateway', 'eu-west-1', 0);

    const failing = await api.get('/api/security/residency/checklist', SESSIONS.privacy);
    const sms = failing.items.find((i) => i.check.includes('Sms.Gateway'));
    assert.ok(sms, 'the integration is checked');
    assert.equal(sms.outsideRegion, true);
    assert.equal(sms.transferRecorded, false);
    assert.equal(sms.ok, false);
    assert.equal(failing.ok, false);

    const activity = await api.post('/api/security/processing-activities', {
      purpose: 'One-time codes by SMS', lawfulBasis: 'contract', systems: ['Sms.Gateway'],
    }, SESSIONS.privacy);
    await api.post('/api/security/transfers', {
      destination: 'eu-west-1', recipient: 'SMS gateway', safeguard: 'standard contractual clauses', activityIds: [activity.activity.id], integrations: ['Sms.Gateway'],
    }, SESSIONS.privacy);

    const passing = await api.get('/api/security/residency/checklist', SESSIONS.privacy);
    const covered = passing.items.find((i) => i.check.includes('Sms.Gateway'));
    assert.equal(covered.transferRecorded, true);
    assert.equal(covered.ok, true);
    await saveSettingAsync('sec.integrationenabled.sms.gateway', false, 0);
  });

  test('AC-SEC-006-01-03', async () => {
    // "it is in the decided region, or a transfer record covers its location"
    const inRegion = await api.get('/api/security/residency/checklist', SESSIONS.privacy);
    const backup = inRegion.items.find((i) => i.check === 'backup location');
    assert.equal(backup.region, 'af-south-1');
    assert.equal(backup.ok, true);
    assert.equal(backup.coveredByTransferRecord, false, 'it is in the decided region');

    // move the backups to a region no transfer record covers: the checklist fails until one does
    await api.post('/api/security/residency', {
      artefacts: { backups: { region: 'us-east-1', evidence: 'OPS-2003' } },
    }, SESSIONS.admin);
    const outside = await api.get('/api/security/residency/checklist', SESSIONS.privacy);
    const uncovered = outside.items.find((i) => i.check === 'backup location');
    assert.equal(uncovered.region, 'us-east-1');
    assert.equal(uncovered.ok, false);

    const activity = await api.post('/api/security/processing-activities', {
      purpose: 'Backups', lawfulBasis: 'legal obligation', systems: ['Backup.Storage'],
    }, SESSIONS.privacy);
    await api.post('/api/security/transfers', {
      destination: 'us-east-1', recipient: 'Backup storage', safeguard: 'provider data-processing agreement', activityIds: [activity.activity.id], integrations: ['Backup.Storage'],
    }, SESSIONS.privacy);
    const covered = await api.get('/api/security/residency/checklist', SESSIONS.privacy);
    const nowOk = covered.items.find((i) => i.check === 'backup location');
    assert.equal(nowOk.ok, true);
    assert.equal(nowOk.coveredByTransferRecord, true);
  });
});
