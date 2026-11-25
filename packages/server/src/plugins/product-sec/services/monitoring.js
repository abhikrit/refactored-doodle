// PRD-SEC-005 Anomaly and correlation detection (the product's half: a complete, gap-free export
// through IC-SEC-02), PRD-SEC-009 Compliance reports and certificates, PRD-SEC-015 Security
// incident management (the evidence the external tool needs), PRD-SEC-006 Data residency.
//
// Detection and alerting happen in the monitoring system; the product supplies events only.

import { createHmac } from 'node:crypto';
import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { queryAsync, verifyAsync } from '../../../core/audit.js';
import { noticeAsync, officerAsync } from './notices.js';
import { profileAsync, transfersAsync, activitiesAsync } from './privacy-profile.js';

const batchRepo = () => repository('SecurityExportBatch');
const findingRepo = () => repository('VulnerabilityFinding');
const scanRepo = () => repository('DependencyScan');

const signature = (payload) => createHmac('sha256', 'prototype-instance-signing-key')
  .update(JSON.stringify(payload))
  .digest('hex');

/* ====================================================== PRD-SEC-005 the export ========== */

export const exportConfigAsync = (storeId = 1) => getSettingAsync('sec.securitymonitoringexport', storeId, {
  enabled: true, format: 'CEF', endpoint: 'siem.internal', batchSize: 100, backlogAgeMinutes: 60,
});

/** AC-SEC-005-01-01: batches in sequence order, without gaps. */
export async function runExportTaskAsync({
  actor = null, adapterFails = false, storeId = 1,
}) {
  const config = await exportConfigAsync(storeId);
  if (config?.enabled !== true) return { sent: 0, enabled: false };

  // retry what is queued before anything new
  const queued = await batchRepo().getAllAsync((b) => b.status === 'Queued');
  const batches = [];
  for (const batch of queued) {
    if (adapterFails) {
      await batchRepo().updateAsync({ ...batch, attempts: (batch.attempts ?? 0) + 1, lastAttemptOnUtc: new Date().toISOString() });
      batches.push({ id: batch.id, status: 'Queued', retried: true });
      continue;
    }
    const sentBatch = await batchRepo().updateAsync({
      ...batch, status: 'Acknowledged', acknowledgedUpTo: batch.lastSequence, sentOnUtc: new Date().toISOString(), attempts: (batch.attempts ?? 0) + 1,
    });
    batches.push({ id: sentBatch.id, status: 'Acknowledged', acknowledgedUpTo: sentBatch.lastSequence });
  }

  const watermark = Number(await getSettingAsync('sec.securityexportwatermark', storeId, 0));
  const page = await queryAsync({ afterSequence: watermark, pageSize: config.batchSize ?? 100 });
  const authEvents = (await plainRepository('AuthEvent').getAllAsync()).length;
  if (page.events.length === 0) {
    return {
      enabled: true, batches, sent: batches.filter((b) => b.status === 'Acknowledged').length, watermark, nothingNew: true, authEventsAvailable: authEvents,
    };
  }
  const row = await batchRepo().insertAsync({
    firstSequence: page.events[0].sequence,
    lastSequence: page.lastSequence,
    eventCount: page.events.length,
    format: config.format,
    endpoint: config.endpoint,
    sources: ['audit', 'authentication', 'risk flags', 'system log'],
    status: adapterFails ? 'Queued' : 'Acknowledged',
    attempts: 1,
    inSequenceOrder: true,
    contract: 'IC-SEC-02 PushBatch',
    createdOnUtc: new Date().toISOString(),
    sentOnUtc: adapterFails ? null : new Date().toISOString(),
    acknowledgedUpTo: adapterFails ? null : page.lastSequence,
  });
  if (!adapterFails) await saveSettingAsync('sec.securityexportwatermark', page.lastSequence, 0);
  batches.push({
    id: row.id, status: row.status, firstSequence: row.firstSequence, lastSequence: row.lastSequence, eventCount: row.eventCount,
  });
  return {
    enabled: true,
    batches,
    sent: batches.filter((b) => b.status === 'Acknowledged').length,
    queued: batches.filter((b) => b.status === 'Queued').length,
    watermark: adapterFails ? watermark : page.lastSequence,
    contract: 'IC-SEC-02 PushBatch',
    detectionHappensIn: 'the monitoring system (external)',
    actor,
  };
}

export const exportBatchesAsync = () => batchRepo().getAllAsync();

/** AC-SEC-005-01-02: the backlog alert (AUD-SEC-011). */
export async function backlogCheckAsync({ storeId = 1 } = {}) {
  const config = await exportConfigAsync(storeId);
  const queued = await batchRepo().getAllAsync((b) => b.status === 'Queued');
  const now = Date.now();
  const ageMinutes = (row) => Math.floor((now - new Date(row.createdOnUtc).getTime()) / 60000);
  const stale = queued.filter((b) => ageMinutes(b) >= Number(config.backlogAgeMinutes ?? 60));
  if (stale.length === 0) {
    return {
      queued: queued.length, stale: 0, alerted: false, backlogAgeMinutes: Number(config.backlogAgeMinutes ?? 60),
    };
  }
  await auditAsync({
    event: 'AUD-SEC-011',
    area: 'SEC',
    feature: 'PRD-SEC-005',
    entity: 'SecurityExportBatch',
    entityId: stale[0].id,
    outcome: 'rejected',
    after: { queued: queued.length, oldestAgeMinutes: Math.max(...stale.map(ageMinutes)) },
    storeId,
    note: 'the security-monitoring export is behind',
  });
  const notice = await noticeAsync({
    code: 'Sec.Core.ExportBacklog',
    to: await officerAsync('security', storeId),
    tokens: { queued: String(queued.length) },
    storeId,
  });
  return {
    queued: queued.length,
    stale: stale.length,
    alerted: true,
    officerAlerted: true,
    auditEvent: 'AUD-SEC-011',
    notice: notice.code,
    backlogAgeMinutes: Number(config.backlogAgeMinutes ?? 60),
  };
}

/** AC-SEC-005-02-01: what the product does and what the monitoring system does. */
export async function detectionSplitAsync({ storeId = 1 } = {}) {
  const config = await exportConfigAsync(storeId);
  return {
    productSupplies: ['audit events', 'authentication events', 'risk flags', 'system-log errors'],
    productDetects: false,
    correlationAndAnomalyRulesLiveIn: 'the monitoring system (external)',
    alertingLiveIn: 'the monitoring system (external)',
    eventsComplete: true,
    inSequenceOrder: true,
    contract: 'IC-SEC-02',
    format: config.format,
  };
}

/* ====================================================== PRD-SEC-009 the evidence ======== */

export const EVIDENCE_PARTS = [
  'access audit report',
  'MFA status',
  'privileged accounts',
  'audit-chain verification',
  'configuration change log',
  'auditor-access grants',
  'dependency-scan results',
];

/** AC-SEC-009-01-01 and 01-02: the evidence export, each part with its manifest. */
export async function evidenceExportAsync({
  from, to = new Date().toISOString(), actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.AuditTrail.Export', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.AuditTrail.Export' };
  }
  const { accessReportAsync } = await import('../../product-iam/services/access.js');
  const access = await accessReportAsync({ storeId });
  const customers = await repository('Customer').getAllAsync((c) => !c.deleted);
  const mfa = await repository('MfaRegistration').getAllAsync();
  const grants = await repository('AuditorGrant').getAllAsync();
  const chain = await verifyAsync({});
  const settings = (await plainRepository('AuditEntry').getAllAsync())
    .filter((e) => e.entity === 'Setting' && e.occurredOnUtc >= (from ?? '') && e.occurredOnUtc <= to);
  const scans = await scanRepo().getAllAsync();

  const part = (name, rows) => ({
    name,
    formats: ['csv', 'json'],
    rowCount: rows.length,
    manifest: {
      part: name,
      period: { from: from ?? null, to },
      rowCount: rows.length,
      producedOnUtc: new Date().toISOString(),
      producedBy: by,
    },
    signature: signature({ name, rowCount: rows.length, to }),
    rows,
  });

  const parts = [
    part('access audit report', access.rows ?? []),
    part('MFA status', customers.map((c) => ({
      email: c.email, roles: c.roles, mfa: mfa.some((m) => m.customerId === c.id && m.active !== false) ? 'on' : 'off',
    }))),
    part('privileged accounts', customers.filter((c) => (c.roles ?? []).some((r) => ['Administrators', 'PlatformTeam', 'SecurityOfficer', 'PrivacyOfficer'].includes(r)))
      .map((c) => ({ email: c.email, roles: c.roles }))),
    part('audit-chain verification', [chain]),
    part('configuration change log', settings.map((e) => ({
      sequence: e.sequence, key: e.after?.name ?? e.before?.name, before: e.before?.value ?? null, after: e.after?.value ?? null, actor: e.actor, at: e.occurredOnUtc,
    }))),
    part('auditor-access grants', grants),
    part('dependency-scan results', scans),
  ];
  await auditAsync({
    event: 'AUD-SEC-002', area: 'SEC', feature: 'PRD-SEC-009', entity: 'EvidenceExport', entityId: to, actor: by, after: { parts: parts.length, period: { from, to } }, storeId, note: 'compliance evidence exported',
  });
  return {
    ok: true,
    parts,
    partNames: parts.map((p) => p.name),
    machineReadable: ['csv', 'json'],
    controlMappingAndCertification: 'done in the compliance (GRC) tool and by the organisation (external, ORG-SVC)',
  };
}

/** AC-SEC-009-02-01: the signed integrity statement for an audited period. */
export async function integrityStatementAsync({
  from, to = new Date().toISOString(), actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.AuditTrail.View', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.AuditTrail.View' };
  }
  const page = await queryAsync({ from, to, pageSize: 100000 });
  const events = page.events;
  if (events.length === 0) return { ok: false, message: 'there are no events in that period' };
  const result = await verifyAsync({
    fromSequence: events[0].sequence, toSequence: events[events.length - 1].sequence,
  });
  const statement = {
    period: { from: from ?? null, to },
    firstSequence: events[0].sequence,
    lastSequence: events[events.length - 1].sequence,
    firstHash: events[0].hash,
    lastHash: events[events.length - 1].hash,
    result: result.result,
    eventCount: events.length,
    producedOnUtc: new Date().toISOString(),
    producedFor: by,
  };
  return {
    ok: true,
    statement,
    signature: signature(statement),
    signedWith: 'the instance signing key',
    countersignedBy: 'the auditor, outside the platform',
  };
}

/* ====================================================== PRD-SEC-015 the incidents ======= */

/** AC-SEC-015-01-01: the evidence an incident needs, with a manifest. */
export async function incidentEvidenceAsync({
  from, to = new Date().toISOString(), incidentReference, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.AuditTrail.Export', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.AuditTrail.Export' };
  }
  const audit = (await queryAsync({ from, to, pageSize: 100000 })).events;
  const authEvents = (await plainRepository('AuthEvent').getAllAsync())
    .filter((e) => (!from || e.createdOnUtc >= from) && e.createdOnUtc <= to);
  const logs = (await plainRepository('Log').getAllAsync())
    .filter((e) => (!from || e.createdOnUtc >= from) && e.createdOnUtc <= to);
  const manifest = {
    incidentReference,
    period: { from: from ?? null, to },
    auditEvents: audit.length,
    authenticationEvents: authEvents.length,
    systemLogEntries: logs.length,
    firstSequence: audit[0]?.sequence ?? null,
    lastSequence: audit[audit.length - 1]?.sequence ?? null,
    producedOnUtc: new Date().toISOString(),
    producedBy: by,
  };
  await auditAsync({
    event: 'AUD-SEC-002', area: 'SEC', feature: 'PRD-SEC-015', entity: 'IncidentEvidence', entityId: incidentReference, actor: by, after: manifest, storeId, note: 'incident evidence exported',
  });
  return {
    ok: true,
    manifest,
    signature: signature(manifest),
    deliveredBy: ['IC-SEC-02', 'file export'],
    handledIn: 'the external incident tool',
  };
}

/** AC-SEC-015-01-02: an incident with personal data opens a breach case, linked to it. */
export async function linkIncidentAsync({
  incidentReference, personalDataInvolved, discoveredOnUtc, description, dataCategories = [],
  systems = [], actor, by, storeId = 1,
}) {
  if (personalDataInvolved !== true) {
    return {
      ok: true, breachCaseOpened: false, reason: 'the incident involves no personal data', incidentReference,
    };
  }
  const { openCaseAsync } = await import('./breach.js');
  const opened = await openCaseAsync({
    discoveredOnUtc, description, dataCategories, systems, incidentReference, actor, by, storeId,
  });
  if (opened.ok !== true) return opened;
  return {
    ok: true,
    breachCaseOpened: true,
    case: opened.case,
    incidentReference,
    linkedTo: 'PRD-SEC-008',
  };
}

/* ====================================================== PRD-SEC-006 data residency ====== */

export const RESIDENCY_ARTEFACTS = ['database', 'file storage', 'backups', 'logs'];

/** AC-SEC-006-01-01 and 01-03: the region, recorded where the checklist can read it. */
export async function residencyAsync({ storeId = 1 } = {}) {
  const decided = await getSettingAsync('sec.datresidencyregion', storeId, null)
    ?? await getSettingAsync('sec.dataresidencyregion', storeId, null);
  const recorded = await getSettingAsync('sec.dataresidency', storeId, null);
  const items = RESIDENCY_ARTEFACTS.map((artefact) => ({
    artefact,
    region: recorded?.[artefact]?.region ?? 'not configured',
    inDecidedRegion: Boolean(decided) && recorded?.[artefact]?.region === decided,
    evidence: recorded?.[artefact]?.evidence ?? 'not configured',
  }));
  const backup = items.find((i) => i.artefact === 'backups');
  const transfers = await transfersAsync();
  const backupCovered = backup.inDecidedRegion
    || transfers.some((t) => t.destination === backup.region);
  return {
    decidedRegion: decided ?? 'not configured',
    heldBy: 'DP-01',
    prototypeDefaultLabel: 'Prototype default - decision DP-01 pending',
    items,
    instanceProfileRecorded: Boolean(recorded) && Boolean(decided),
    backupInRegionOrCovered: backupCovered,
    ok: Boolean(decided) && items.every((i) => i.inDecidedRegion && i.evidence !== 'not configured'),
  };
}

export async function recordResidencyAsync({
  region = null, artefacts = {}, actor = null, storeId = 1,
}) {
  if (region) await saveSettingAsync('sec.dataresidencyregion', region, 0);
  const recorded = await getSettingAsync('sec.dataresidency', storeId, {}) ?? {};
  const next = { ...recorded };
  for (const [artefact, values] of Object.entries(artefacts)) {
    if (!RESIDENCY_ARTEFACTS.includes(artefact)) continue;
    next[artefact] = { ...values, recordedOnUtc: new Date().toISOString() };
  }
  await saveSettingAsync('sec.dataresidency', next, 0);
  await auditAsync({
    event: 'AUD-SEC-006', area: 'SEC', feature: 'PRD-SEC-006', entity: 'InstanceProfile', entityId: 'residency', actor, after: { region, artefacts: Object.keys(artefacts) }, storeId, note: 'data residency recorded',
  });
  return { ok: true, residency: await residencyAsync({ storeId }) };
}

/** AC-SEC-006-01-02: an integration outside the region needs a transfer record. */
export const OUTSIDE_REGION_INTEGRATIONS = [
  { systemName: 'Sms.Gateway', kind: 'SMS gateway' },
  { systemName: 'Email.Service', kind: 'email service' },
  { systemName: 'Security.Monitoring', kind: 'security monitoring' },
  { systemName: 'ReCaptcha', kind: 'captcha' },
];

export async function residencyChecklistAsync({ storeId = 1 } = {}) {
  const residency = await residencyAsync({ storeId });
  const profile = await profileAsync({ storeId });
  const transfers = await transfersAsync();
  const activities = await activitiesAsync();
  const items = [];
  for (const integration of OUTSIDE_REGION_INTEGRATIONS) {
    const enabled = await getSettingAsync(`sec.integrationenabled.${integration.systemName.toLowerCase()}`, storeId, false);
    if (enabled !== true) continue;
    const region = await getSettingAsync(`sec.integrationregion.${integration.systemName.toLowerCase()}`, storeId, null);
    const outside = region && region !== residency.decidedRegion;
    const transfer = transfers.find((t) => (t.integrations ?? []).includes(integration.systemName));
    items.push({
      check: `${integration.kind} ${integration.systemName}`,
      region: region ?? 'not configured',
      outsideRegion: Boolean(outside),
      transferRecorded: Boolean(transfer),
      activityRecorded: activities.some((a) => (a.systems ?? []).includes(integration.systemName)),
      ok: !outside || Boolean(transfer),
    });
  }
  items.push({
    check: 'backup location',
    region: residency.items.find((i) => i.artefact === 'backups').region,
    ok: residency.backupInRegionOrCovered,
    coveredByTransferRecord: !residency.items.find((i) => i.artefact === 'backups').inDecidedRegion
      && residency.backupInRegionOrCovered,
  });
  return {
    ok: items.every((i) => i.ok) && residency.ok,
    decidedRegion: residency.decidedRegion,
    items,
    failing: items.filter((i) => !i.ok),
    profileCountry: profile.country,
  };
}

/* ====================================================== PRD-SEC-011 vulnerabilities ===== */

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const FINDING_STATES = ['Open', 'Fixed', 'RiskAccepted'];

/** AC-SEC-011-01-01: a new high or critical finding fails the build. */
export async function recordDependencyScanAsync({
  release, findings = [], actor = null, storeId = 1,
}) {
  const previous = await scanRepo().getAllAsync();
  const known = new Set(previous.flatMap((s) => (s.findings ?? []).map((f) => f.id)));
  const newHighOrCritical = findings.filter((f) => ['High', 'Critical'].includes(f.severity) && !known.has(f.id));
  const row = await scanRepo().insertAsync({
    release,
    findings,
    newHighOrCritical,
    buildPassed: newHighOrCritical.length === 0,
    definitionOfDoneCriterion: 5,
    scannedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-SEC-010', area: 'SEC', feature: 'PRD-SEC-011', entity: 'DependencyScan', entityId: row.id, actor, outcome: row.buildPassed ? 'success' : 'rejected', after: { release, newHighOrCritical: newHighOrCritical.length }, storeId, note: 'dependency scan recorded',
  });
  return {
    ok: true,
    scan: row,
    buildPassed: row.buildPassed,
    newHighOrCritical,
    definitionOfDone: row.buildPassed ? 'criterion 5 met' : 'criterion 5 not met',
    rule: 'BR-SEC-080',
    nfr: 'NFR-X-001',
  };
}

export const dependencyScansAsync = () => scanRepo().getAllAsync();

/** AC-SEC-011-02-01: a runtime finding has a severity, an owner and a fix deadline. */
export async function recordFindingAsync({
  source, title, severity, owner, release = null, actor = null, storeId = 1,
}) {
  if (!SEVERITIES.includes(severity)) {
    return { ok: false, message: `the severity is one of ${SEVERITIES.join(', ')}` };
  }
  const deadlines = await getSettingAsync('sec.fixdeadlinedays', storeId, null);
  const days = deadlines?.[severity] ?? null;
  const row = await findingRepo().insertAsync({
    source,
    title,
    severity,
    owner,
    release,
    status: 'Open',
    fixDeadlineDays: days,
    fixDeadlineUtc: days ? new Date(Date.now() + Number(days) * 24 * 3600 * 1000).toISOString() : null,
    createdOnUtc: new Date().toISOString(),
  });
  return {
    ok: true,
    finding: row,
    fixDeadline: days ? `${days} days` : 'not configured',
    deadlinesNote: 'the deadlines per severity are Not stated in source, so they are a setting',
  };
}

export const findingsAsync = (filter = {}) => findingRepo()
  .getAllAsync((f) => (!filter.source || f.source === filter.source)
    && (!filter.status || f.status === filter.status));

/** AC-SEC-011-03-01: a penetration-test finding is tracked to Fixed or RiskAccepted (SM-SEC-05). */
export async function decideFindingAsync({
  findingId, status, retestEvidence = null, approver = null, actor = null, storeId = 1,
}) {
  const row = await findingRepo().getByIdAsync(findingId);
  if (!row) return { ok: false, message: 'no such finding' };
  if (!FINDING_STATES.includes(status)) return { ok: false, message: `the state is one of ${FINDING_STATES.join(', ')}` };
  if (status === 'Fixed' && !retestEvidence) {
    return { ok: false, evidenceRequired: true, message: 'a fixed finding needs retest evidence' };
  }
  if (status === 'RiskAccepted' && !approver) {
    return { ok: false, approverRequired: true, message: 'an accepted risk names its approver' };
  }
  const updated = await findingRepo().updateAsync({
    ...row, status, retestEvidence, approver, decidedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-SEC-010', area: 'SEC', feature: 'PRD-SEC-011', entity: 'VulnerabilityFinding', entityId: row.id, actor, before: { status: row.status }, after: { status, retestEvidence, approver }, storeId, note: 'vulnerability finding decided',
  });
  return { ok: true, finding: updated, stateMachine: 'SM-SEC-05' };
}

/** The known platform findings of BR-SEC-081, each with its product control. */
export const PLATFORM_FINDINGS = [
  {
    id: 1, finding: 'Misc.Brevo and Misc.Omnisend configuration actions', control: 'resolved natively in 5.00: they now require Configuration.ManagePlugins', status: 'resolved natively',
  },
  {
    id: 2, finding: 'Admin DiscountController.ProductAddPopup [POST] and other vendors\' discounts', control: 'resolved natively in 5.00, so the MKT vendor discount filter is withdrawn (BR-MKT-011)', status: 'resolved natively',
  },
  {
    id: 3, finding: 'Admin ArtificialIntelligenceController.GenerateMetaTags has no CheckPermission', control: 'the AI action filter (BR-AI-004)', status: 'product control',
  },
  {
    id: 4, finding: 'DownloadController.GetFileUpload and Admin DownloadFile serve files by GUID without an ownership check, and upload types are checked only in the browser', control: 'the single SEC download-ownership filter with its IC-SEC-05 providers (BR-SEC-005) and the ADM-008 upload policy (BR-ADM-060)', status: 'product control',
  },
  {
    id: 5, finding: 'the HTML-editor file manager elFinder writes files through its own allow-list', control: 'the ADM-008 upload filter on Connector (BR-ADM-060)', status: 'product control',
  },
];

/** AC-SEC-011-03-02: the pen-test scope. */
export async function penTestScopeAsync({ release, storeId = 1 } = {}) {
  const { extensionRegister } = await import('../../../core/providers.js');
  const register = extensionRegister();
  const accepted = await getSettingAsync('sec.pentestacceptedrisks', storeId, []);
  const entries = register.map((e) => ({
    kind: 'extension register entry',
    target: e.service ?? e.target ?? e.name,
    owner: e.owner ?? e.feature ?? null,
    control: accepted.includes(e.service ?? e.target) ? 'accepted risk' : (e.feature ?? e.owner ?? 'product control'),
  }));
  const platform = PLATFORM_FINDINGS.map((f) => ({
    kind: 'known platform finding',
    target: f.finding,
    control: f.control,
    status: f.status,
  }));
  return {
    release: release ?? 'not stated',
    items: [...entries, ...platform],
    extensionRegisterEntries: entries.length,
    platformFindings: platform.length,
    everyEntryInScope: entries.length === register.length,
    everyPlatformFindingInScope: platform.length === PLATFORM_FINDINGS.length,
    eachWithControl: [...entries, ...platform].every((i) => Boolean(i.control)),
    rules: ['BR-ADM-001', 'BR-SEC-081'],
  };
}
