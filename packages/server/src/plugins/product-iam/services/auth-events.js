// PRD-IAM-012 Authentication audit and suspicious-login detection, PRD-IAM-018 Account activity
// history, PRD-IAM-019 Account synchronisation and PRD-IAM-020 Identity verification.
//
// BR-IAM-090: authentication events are append-only - no edit, no delete - and every event is
// copied to the SEC-004 audit trail.
// BR-IAM-080: a read-access event is written when staff open a customer's personal data.
// BR-IAM-100: account synchronisation uses the single INT-004 outbox; IAM only enqueues.
// BR-IAM-110: verification stores the result, adapter, reference, time and matched fields - never
// identity document images.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync, auditTrailAsync } from '../../../core/audit.js';
import { sendAsync } from '../../../core/messages.js';
import { messageGateways } from '@product/mocks';

const eventRepo = () => repository('AuthEvent');
const flagRepo = () => repository('SuspiciousLoginFlag');
const activityRepo = () => repository('ActivityLog');
const caseRepo = () => repository('VerificationCase');
const customerRepo = () => repository('Customer');

/* =========================================== PRD-IAM-012 authentication events ========== */

export const ACTIVITY_TYPES = [
  { systemKeyword: 'PublicStore.SuccessfulLogin', enabled: true },
  { systemKeyword: 'PublicStore.FailedLogin', enabled: true },
  { systemKeyword: 'PublicStore.Logout', enabled: true },
];

/** AC-IAM-012-01-01: the three native activity types are enabled and IP addresses are stored. */
export async function applyAuthLoggingConfigurationAsync(storeId = 1) {
  await saveSettingAsync('customersettings.storeipaddresses', true, 0);
  for (const type of ACTIVITY_TYPES) {
    await saveSettingAsync(`activitylogtype.${type.systemKeyword.toLowerCase()}.enabled`, true, 0);
  }
  return {
    activityTypes: ACTIVITY_TYPES,
    storeIpAddresses: await getSettingAsync('customersettings.storeipaddresses', storeId, false),
    note: 'the three login activity types are disabled at a native install; the IAM configuration enables them',
  };
}

/**
 * AC-IAM-012-01-02: one AuthEvent per authentication event, copied to the audit trail.
 * Also runs the detection rules (AC-IAM-012-02-01 and 02-02).
 */
export async function recordAuthEventAsync({
  customerId = null, identifierTried = null, type, outcome, channel = 'password', ipAddress = null,
  userAgent = null, countryIso = null, storeId = 1, detail = null, gateways = messageGateways,
}) {
  const event = await eventRepo().insertAsync({
    customerId,
    identifierTried,
    type,
    outcome,
    channel,
    ipAddress,
    userAgent,
    countryIso,
    detail,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-018',
    area: 'IAM',
    feature: 'PRD-IAM-012',
    entity: 'AuthEvent',
    entityId: event.id,
    actor: identifierTried ?? String(customerId ?? 'unknown'),
    outcome: outcome === 'success' ? 'success' : 'rejected',
    after: {
      type, outcome, channel, ipAddress, countryIso,
    },
    note: `authentication event: ${type} ${outcome}`,
  });
  if (['login', 'logout'].includes(type)) {
    await activityRepo().insertAsync({
      systemKeyword: type === 'logout' ? 'PublicStore.Logout' : outcome === 'success' ? 'PublicStore.SuccessfulLogin' : 'PublicStore.FailedLogin',
      customerId,
      comment: `${type} ${outcome}`,
      ipAddress,
      createdOnUtc: new Date().toISOString(),
    });
  }
  const flags = await runDetectionRulesAsync({
    event, storeId, gateways,
  });
  return { event, flags };
}

export async function authEventsAsync({
  from = null, to = null, customerId = null, ipAddress = null, outcome = null, limit = 200,
} = {}) {
  const rows = await eventRepo().getAllAsync((e) => (customerId ? e.customerId === Number(customerId) : true)
    && (ipAddress ? e.ipAddress === ipAddress : true)
    && (outcome ? e.outcome === outcome : true)
    && (from ? new Date(e.createdOnUtc) >= new Date(from) : true)
    && (to ? new Date(e.createdOnUtc) <= new Date(to) : true));
  const sorted = rows.sort((a, b) => b.id - a.id).slice(0, limit);
  return {
    events: sorted,
    appendOnly: true,
    editOrDeleteOffered: false,
    csv: ['time,customer,identifier,type,outcome,channel,ip,country',
      ...sorted.map((e) => [e.createdOnUtc, e.customerId ?? '', e.identifierTried ?? '', e.type, e.outcome, e.channel, e.ipAddress ?? '', e.countryIso ?? ''].join(','))].join('\n'),
  };
}

/** AC-IAM-012-03-02: the security-monitoring export (IC-SEC-02). */
export async function exportToMonitoringAsync({ storeId = 1 }) {
  const configured = await getSettingAsync('sec.securitymonitoringexport', storeId, { enabled: true, format: 'CEF', endpoint: 'siem.internal' });
  if (configured?.enabled !== true) return { sent: 0, enabled: false };
  const { events } = await authEventsAsync({ limit: 500 });
  const records = events.map((e) => ({
    format: configured.format,
    line: `CEF:0|Product|IAM|1.0|${e.type}|${e.outcome}|src=${e.ipAddress ?? '-'} suser=${e.identifierTried ?? e.customerId ?? '-'} rt=${e.createdOnUtc}`,
  }));
  return {
    enabled: true, sent: records.length, contract: 'IC-SEC-02', format: configured.format, sample: records[0] ?? null,
  };
}

/* ------------------------------------------------------ the detection rules ------------ */

export const detectionRulesAsync = (storeId = 1) => getSettingAsync('iam.suspiciousloginrules', storeId, {
  failedLogins: { enabled: true, failures: 5, windowMinutes: 15 },
  newCountry: { enabled: true, lookBackDays: 90, notifyCustomer: true },
});

async function runDetectionRulesAsync({ event, storeId, gateways }) {
  const rules = await detectionRulesAsync(storeId);
  const raised = [];

  if (rules.failedLogins?.enabled && event.outcome === 'failed') {
    const since = Date.now() - rules.failedLogins.windowMinutes * 60 * 1000;
    const failures = (await eventRepo().getAllAsync((e) => e.outcome === 'failed'
      && new Date(e.createdOnUtc).getTime() >= since
      && ((event.customerId && e.customerId === event.customerId)
        || (event.ipAddress && e.ipAddress === event.ipAddress))));
    if (failures.length >= rules.failedLogins.failures) {
      raised.push(await raiseFlagAsync({
        ruleId: 'failed-logins',
        customerId: event.customerId,
        eventIds: failures.map((e) => e.id),
        detail: `${failures.length} failures in ${rules.failedLogins.windowMinutes} minutes`,
        gateways,
      }));
    }
  }

  if (rules.newCountry?.enabled && event.outcome === 'success' && event.countryIso && event.customerId) {
    const since = Date.now() - rules.newCountry.lookBackDays * 24 * 3600 * 1000;
    const seen = await eventRepo().getAllAsync((e) => e.customerId === event.customerId
      && e.countryIso === event.countryIso && e.id !== event.id
      && new Date(e.createdOnUtc).getTime() >= since);
    if (seen.length === 0) {
      const flag = await raiseFlagAsync({
        ruleId: 'new-country',
        customerId: event.customerId,
        eventIds: [event.id],
        detail: `first login from ${event.countryIso} in ${rules.newCountry.lookBackDays} days`,
        gateways,
      });
      raised.push(flag);
      if (rules.newCountry.notifyCustomer) {
        const customer = await customerRepo().getByIdAsync(event.customerId);
        try {
          await sendAsync({
            event: 'Iam.NewCountryLogin.CustomerNotification',
            to: customer?.email ?? customer?.phone,
            channels: [customer?.email ? 'email' : 'sms'],
            tokens: { country: event.countryIso },
            storeId,
            feature: 'PRD-IAM-012',
            gateways,
          });
        } catch { /* the flag stands even if the notice fails */ }
      }
    }
  }
  return raised;
}

async function raiseFlagAsync({
  ruleId, customerId, eventIds, detail, gateways,
}) {
  const open = await flagRepo().getOneAsync((f) => f.ruleId === ruleId && f.customerId === customerId && f.status === 'Open');
  if (open) return open;
  const flag = await flagRepo().insertAsync({
    ruleId, customerId, eventIds, detail, status: 'Open', raisedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-016', area: 'IAM', feature: 'PRD-IAM-012', entity: 'SuspiciousLoginFlag', entityId: flag.id, actor: 'system', after: { ruleId, status: 'Open' }, note: detail,
  });
  try {
    await sendAsync({
      event: 'Iam.Core.SuspiciousLogin', to: 'security@example.com', channels: ['inapp'], tokens: { ruleId, detail }, feature: 'PRD-IAM-012', gateways,
    });
  } catch { /* the officer still sees it in the console */ }
  return flag;
}

export const flagsAsync = () => flagRepo().getAllAsync();

/** AC-IAM-012-02-03: confirming may force the user off; dismissing needs a reason. */
export async function decideFlagAsync({
  flagId, decision, reason = null, by, forceLogout = false,
}) {
  const flag = await flagRepo().getByIdAsync(flagId);
  if (!flag || flag.status !== 'Open') return { ok: false, message: 'that flag is not open' };
  if (decision === 'dismiss' && !reason) {
    return { ok: false, reasonRequired: true, message: 'Give a reason for dismissing the flag.' };
  }
  const updated = await flagRepo().updateAsync({
    ...flag, status: decision === 'confirm' ? 'Confirmed' : 'Dismissed', decidedBy: by, reason, decidedOnUtc: new Date().toISOString(),
  });
  let logout = null;
  if (decision === 'confirm' && forceLogout && flag.customerId) {
    const { forceLogoutAsync } = await import('./sessions.js');
    logout = await forceLogoutAsync({ customerId: flag.customerId, by, reason: 'suspicious login confirmed' });
  }
  await auditAsync({
    event: 'AUD-IAM-016', area: 'IAM', feature: 'PRD-IAM-012', entity: 'SuspiciousLoginFlag', entityId: flagId, actor: by, before: { status: 'Open' }, after: { status: updated.status, reason }, note: `flag ${decision}ed`,
  });
  return { ok: true, flag: updated, forcedLogout: logout };
}

/* ======================================================= PRD-IAM-018 account activity === */

/** AC-IAM-018-01-02: the IP address shown to a shopper is partly masked. */
export function maskIp(ip) {
  if (!ip) return null;
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return [...parts.slice(0, 3), '0', '0', '0', '0', '0'].slice(0, 8).join(':');
  }
  const octets = String(ip).split('.');
  if (octets.length !== 4) return ip;
  return [...octets.slice(0, 3), '0'].join('.');
}

/** BR-IAM-080: a read-access event when staff open a customer's personal data. */
export async function recordReadAccessAsync({
  staffEmail, staffRole = null, customerId, page,
}) {
  return auditAsync({
    event: 'AUD-IAM-010',
    area: 'IAM',
    feature: 'PRD-IAM-010',
    entity: 'Customer',
    entityId: customerId,
    actor: staffEmail,
    actorRole: staffRole,
    after: { page },
    note: 'staff read access to customer personal data',
  });
}

/**
 * AC-IAM-018-01-01: logins and failed logins, the fields that changed (names, not values) and the
 * payment attempts, newest first, for the configured look-back period.
 * AC-IAM-018-02-01: the staff-access entries, with the name or the role as the setting says.
 */
export async function accountActivityAsync({ customerId, storeId = 1, forStaff = false }) {
  const days = Number(await getSettingAsync('iam.accountactivitylookbackdays', storeId, 90));
  const showStaffName = await getSettingAsync('iam.showstaffnametocustomers', storeId, false);
  const since = Date.now() - days * 24 * 3600 * 1000;
  const recent = (rows, field = 'createdOnUtc') => rows.filter((r) => new Date(r[field] ?? 0).getTime() >= since);

  const logins = recent(await eventRepo().getAllAsync((e) => e.customerId === customerId))
    .map((e) => ({
      kind: e.outcome === 'success' ? 'login' : 'failed login',
      at: e.createdOnUtc,
      channel: e.channel,
      ipAddress: forStaff ? e.ipAddress : maskIp(e.ipAddress),
      outcome: e.outcome,
    }));

  const trail = await auditTrailAsync({ entity: 'Customer', entityId: customerId });
  const changes = recent(trail, 'createdOnUtc')
    .filter((t) => t.area === 'IAM' && t.after)
    .map((t) => ({
      kind: 'change',
      at: t.createdOnUtc,
      fields: Object.keys(t.after ?? {}), // field names, never the values
      note: t.note,
    }));

  const staffAccess = recent(trail.filter((t) => t.event === 'AUD-IAM-010'), 'createdOnUtc')
    .map((t) => ({
      kind: 'staff access',
      at: t.createdOnUtc,
      by: showStaffName === true ? t.actor : (t.actorRole || 'a member of staff'),
      page: t.after?.page ?? null,
    }));

  const payments = recent(await repository('PaymentTransaction').getAllAsync((p) => p.customerId === customerId))
    .map((p) => ({
      kind: 'payment attempt', at: p.createdOnUtc, method: p.paymentMethodSystemName ?? p.method, status: p.status,
    }));

  const entries = [...logins, ...changes, ...staffAccess, ...payments]
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  return { entries, lookBackDays: days, staffNameShown: showStaffName === true };
}

/* ================================================ PRD-IAM-019 account synchronisation === */

export const syncFieldsAsync = (storeId = 1) => getSettingAsync('iam.accountsyncfields', storeId, {
  fields: ['email', 'firstName', 'lastName', 'phone', 'active'],
  direction: 'both',
  systemOfRecord: { email: 'platform', phone: 'core-system', firstName: 'core-system' },
});

/** AC-IAM-019-01-01: the consumer only enqueues an INT-004 outbox message (IC-INT-09). */
export async function enqueueAccountChangeAsync({
  customerId, changeType, storeId = 1,
}) {
  const config = await syncFieldsAsync(storeId);
  if (!config?.fields?.length) return { enqueued: false, reason: 'synchronisation is off' };
  const customer = await customerRepo().getByIdAsync(customerId);
  const payload = Object.fromEntries(config.fields.map((f) => [f, customer?.[f] ?? null]));
  const { enqueueAsync } = await import('../../product-int/services/outbox.js');
  const message = await enqueueAsync({
    channel: 'account sync',
    messageType: `account.${changeType}`,
    payload: { customerId, ...payload },
    feature: 'PRD-IAM-019',
  });
  return {
    enqueued: true, message, outbox: 'INT-004', contract: 'IC-INT-09 Enqueue',
  };
}

/** AC-IAM-019-01-03: only the configured fields are updated; the system of record wins. */
export async function applyInboundChangeAsync({
  email, values, storeId = 1, changedOnUtc = new Date().toISOString(),
}) {
  const config = await syncFieldsAsync(storeId);
  const customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
  if (!customer) return { ok: false, message: 'no such account' };
  const applied = {};
  const ignored = [];
  const conflicts = [];
  for (const [field, value] of Object.entries(values)) {
    if (!config.fields.includes(field)) { ignored.push(field); continue; }
    const owner = config.systemOfRecord?.[field] ?? 'core-system';
    const platformChangedAfter = customer.updatedOnUtc && new Date(customer.updatedOnUtc) > new Date(changedOnUtc);
    if (platformChangedAfter && owner === 'platform') {
      conflicts.push({ field, winner: 'platform', reason: 'the platform value changed after the core-system version' });
      continue;
    }
    if (platformChangedAfter && owner === 'core-system') {
      conflicts.push({ field, winner: 'core-system', reason: 'the core system is the system of record for this field' });
    }
    applied[field] = value;
  }
  if (Object.keys(applied).length) await customerRepo().updateAsync({ ...customer, ...applied });
  for (const conflict of conflicts) {
    await repository('Log').insertAsync({
      logLevel: 'Information',
      shortMessage: `Account sync conflict on ${conflict.field}`,
      fullMessage: `${conflict.reason}; ${conflict.winner} wins`,
      createdOnUtc: new Date().toISOString(),
    });
  }
  return {
    ok: true, applied, ignoredFields: ignored, conflicts,
  };
}

/** AC-IAM-019-01-04: the core system receives an erasure notice. */
export async function notifyErasureAsync({ customerId, storeId = 1 }) {
  const { enqueueAsync } = await import('../../product-int/services/outbox.js');
  const message = await enqueueAsync({
    channel: 'account sync', messageType: 'account.erased', payload: { customerId }, feature: 'PRD-IAM-019',
  });
  return { ok: true, message };
}

/* ================================================ PRD-IAM-020 identity verification ===== */

export const verificationAdaptersAsync = (storeId = 1) => getSettingAsync('iam.verificationadapters', storeId, [
  {
    systemName: 'Verify.NationalId.MW', country: 'MW', identityTypes: ['national-id'], contract: 'IC-IAM-02',
  },
  {
    systemName: 'Verify.MobileMoney.MW', country: 'MW', identityTypes: ['mobile-number'], contract: 'IC-IAM-02',
  },
  {
    systemName: 'Verify.NationalId.KE', country: 'KE', identityTypes: ['national-id'], contract: 'IC-IAM-02',
  },
]);

/**
 * IC-IAM-02 Verify. AC-IAM-020-01-01 to 01-04.
 * A result of Inconclusive or Unavailable opens a manual review case, except for checks another
 * module requested (SEL handles its own).
 */
export async function verifyIdentityAsync({
  subjectType = 'Customer', subjectId, country, identityType, identifier, name = null,
  requestedBy = 'IAM', adapter = null, storeId = 1,
}) {
  const adapters = await verificationAdaptersAsync(storeId);
  const chosen = adapters.find((a) => a.country === country && a.identityTypes.includes(identityType));
  if (!chosen) {
    return { ok: false, message: `no verification adapter is configured for ${identityType} in ${country}` };
  }
  let result = { result: 'Verified', reference: `VER-${Date.now()}`, matchedFields: ['name', 'identifier'] };
  if (adapter) {
    try {
      result = await adapter.verifyAsync({
        country, identityType, identifier, name,
      });
    } catch (err) {
      result = { result: 'Unavailable', reference: null, error: err.message };
    }
  }
  const needsReview = ['Inconclusive', 'Unavailable'].includes(result.result) && requestedBy === 'IAM';
  const row = await caseRepo().insertAsync({
    subjectType,
    subjectId,
    country,
    identityType,
    identifier: identifier ? `***${String(identifier).slice(-3)}` : null,
    adapterSystemName: chosen.systemName,
    result: needsReview ? 'ManualReview' : result.result,
    adapterResult: result.result,
    reference: result.reference ?? null,
    matchedFields: result.matchedFields ?? [],
    requestedBy,
    documentImagesStored: false,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-015', area: 'IAM', feature: 'PRD-IAM-020', entity: 'VerificationCase', entityId: row.id, actor: requestedBy, after: { result: row.result, adapter: chosen.systemName }, note: 'identity verification',
  });
  return {
    ok: true,
    case: row,
    result: row.result,
    adapterResult: result.result,
    manualReviewOpened: needsReview,
    reference: row.reference,
    adapter: chosen.systemName,
  };
}

/** AC-IAM-020-01-03 and 01-05: a reviewer decides, with a reason; AI output is a suggestion only. */
export async function decideVerificationAsync({
  caseId, decision, reason, by, aiSuggestion = null,
}) {
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row || row.result !== 'ManualReview') return { ok: false, message: 'that case is not in manual review' };
  if (!['Verified', 'NotVerified'].includes(decision)) return { ok: false, message: 'the decision is Verified or NotVerified' };
  if (!reason) return { ok: false, reasonRequired: true, message: 'Give a reason for the decision.' };
  const updated = await caseRepo().updateAsync({
    ...row, result: decision, decidedBy: by, reason, decidedOnUtc: new Date().toISOString(), aiSuggestion,
  });
  await auditAsync({
    event: 'AUD-IAM-015', area: 'IAM', feature: 'PRD-IAM-020', entity: 'VerificationCase', entityId: caseId, actor: by, before: { result: 'ManualReview' }, after: { result: decision, reason }, note: 'manual verification decision',
  });
  return {
    ok: true, case: updated, decidedBy: by, aiWasSuggestionOnly: true,
  };
}

export const verificationCasesAsync = () => caseRepo().getAllAsync();
