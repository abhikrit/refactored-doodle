// PRD-SEC-012 Country data-protection pack: the country profile, the processing register, the
// transfer records, the impact assessments and the go-live checklist.
//
// BR-SEC-040: every value in the profile is configuration. A value that has not been configured
// reads "not configured" - it is never guessed, and the go-live checklist lists it as missing
// (message Sec.ProfileIncomplete). The law names are an inference held by decision DP-01, so the
// profile carries them as text supplied by the client, not as a product default.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource, sendAsync } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { messageGateways } from '@product/mocks';

const activityRepo = () => repository('ProcessingActivity');
const transferRepo = () => repository('TransferRecord');
const assessmentRepo = () => repository('ImpactAssessment');

export const NOT_CONFIGURED = 'not configured';

/** The values the profile must carry before go-live (BR-SEC-040). */
export const REQUIRED_PROFILE_VALUES = [
  'lawNames',
  'regulator',
  'dataRequestResponseDays',
  'breachDeadlineToRegulatorHours',
  'breachDeadlineToPeopleHours',
  'transferConditions',
  'consentTexts',
];

const PROFILE_SETTING = (country) => `sec.countryprofile.${String(country).toLowerCase()}`;

const blank = (country) => ({
  country,
  lawNames: null,
  regulator: null,
  dataRequestResponseDays: null,
  breachDeadlineToRegulatorHours: null,
  breachDeadlineToPeopleHours: null,
  transferConditions: null,
  consentTexts: null,
  externalAiTransfer: null,
  externalAiCountries: null,
  smsOptOut: null,
  essentialMessageTypes: null,
  partnerConsentTexts: null,
  retention: null,
  serverSideAnalyticsConsent: null,
});

const shown = (value) => (value === null || value === undefined || value === '' ? NOT_CONFIGURED : value);

export async function instanceCountryAsync(storeId = 1) {
  return (await getSettingAsync('countrysettings.isocode', storeId, null))
    ?? (await getSettingAsync('sec.instancecountry', storeId, null))
    ?? NOT_CONFIGURED;
}

/** AC-SEC-012-01-01 and 01-03: the profile, with unset values shown as "not configured". */
export async function profileAsync({ storeId = 1, country = null } = {}) {
  const iso = country ?? await instanceCountryAsync(storeId);
  const stored = await getSettingAsync(PROFILE_SETTING(iso), storeId, null) ?? blank(iso);
  const profile = { ...blank(iso), ...stored, country: iso };
  const display = Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, shown(v)]));
  return {
    ...profile,
    display,
    missing: REQUIRED_PROFILE_VALUES.filter((k) => profile[k] === null || profile[k] === undefined || profile[k] === ''),
    lawNamesHeldBy: 'DP-01',
    lawNamesLabel: 'Prototype default - decision DP-01 pending',
    everyValueIsConfiguration: true,
  };
}

/** IC-SEC-03 GetProfile. */
export const getProfileAsync = (country, storeId = 1) => profileAsync({ country, storeId });

export async function saveProfileAsync({
  country = null, values, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.PrivacyProfile.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.PrivacyProfile.CreateEditDelete' };
  }
  const iso = country ?? await instanceCountryAsync(storeId);
  const before = await profileAsync({ storeId, country: iso });
  const merged = { ...blank(iso), ...before, ...values, country: iso };
  delete merged.display;
  delete merged.missing;
  await saveSettingAsync(PROFILE_SETTING(iso), merged, 0);
  await auditAsync({
    event: 'AUD-SEC-006',
    area: 'SEC',
    feature: 'PRD-SEC-012',
    entity: 'CountryPrivacyProfile',
    entityId: iso,
    actor: by,
    before: Object.fromEntries(Object.keys(values).map((k) => [k, before[k] ?? null])),
    after: values,
    storeId,
    note: 'country data-protection profile changed',
  });
  return { ok: true, profile: await profileAsync({ storeId, country: iso }) };
}

/** AC-SEC-012-05-01: the due date of a privacy request comes from the profile. */
export async function responseDeadlineAsync({ storeId = 1, receivedOnUtc = new Date().toISOString() } = {}) {
  const profile = await profileAsync({ storeId });
  const days = profile.dataRequestResponseDays;
  if (days === null || days === undefined) {
    return {
      configured: false, days: null, dueOnUtc: null, display: NOT_CONFIGURED, suppliedBy: 'PRD-SEC-012 country profile',
    };
  }
  return {
    configured: true,
    days: Number(days),
    receivedOnUtc,
    dueOnUtc: new Date(new Date(receivedOnUtc).getTime() + Number(days) * 24 * 3600 * 1000).toISOString(),
    suppliedBy: 'PRD-SEC-012 country profile',
  };
}

/* ====================================================== the processing register ========= */

/** AC-SEC-012-02-01: a processing activity is saved as a new version. */
export async function recordActivityAsync({
  purpose, dataCategories = [], peopleConcerned = null, lawfulBasis = null, retentionRule = null,
  recipients = [], transfers = [], systems = [], needsImpactAssessment = false, cookieCategory = null,
  actor, by, storeId = 1, activityId = null,
}) {
  if (!await authorizeAsync('Security.Core.PrivacyProfile.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.PrivacyProfile.CreateEditDelete' };
  }
  const previous = activityId ? await activityRepo().getByIdAsync(activityId) : null;
  const sameKey = previous ?? await activityRepo().getOneAsync((a) => a.purpose === purpose && a.current !== false);
  if (sameKey) await activityRepo().updateAsync({ ...sameKey, current: false });
  const row = await activityRepo().insertAsync({
    purpose,
    dataCategories,
    peopleConcerned,
    lawfulBasis,
    retentionRule,
    retentionReadFrom: 'PRD-PLT-020',
    recipients,
    transfers,
    systems,
    needsImpactAssessment: needsImpactAssessment === true,
    assessmentStatus: needsImpactAssessment === true ? 'Required' : 'Not required',
    cookieCategory,
    version: (sameKey?.version ?? 0) + 1,
    current: true,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-SEC-006',
    area: 'SEC',
    feature: 'PRD-SEC-012',
    entity: 'ProcessingActivity',
    entityId: row.id,
    actor: by,
    before: sameKey ? { version: sameKey.version, purpose: sameKey.purpose } : null,
    after: { version: row.version, purpose, lawfulBasis },
    storeId,
    note: 'processing activity recorded',
  });
  return { ok: true, activity: row, previousVersion: sameKey?.version ?? null };
}

export const activitiesAsync = ({ current = true } = {}) => activityRepo()
  .getAllAsync((a) => (current ? a.current !== false : true));

export async function exportActivitiesAsync({ format = 'csv' } = {}) {
  const rows = await activitiesAsync({ current: false });
  const header = 'version,purpose,lawfulBasis,dataCategories,retentionRule,recipients,transfers,systems,assessmentStatus';
  const csv = [header, ...rows.map((a) => [
    a.version, a.purpose, a.lawfulBasis ?? '', (a.dataCategories ?? []).join(' '), a.retentionRule ?? '',
    (a.recipients ?? []).join(' '), (a.transfers ?? []).join(' '), (a.systems ?? []).join(' '), a.assessmentStatus,
  ].join(','))].join('\n');
  return {
    ok: ['csv', 'xlsx'].includes(format),
    format,
    rowCount: rows.length,
    file: {
      name: `processing-register.${format}`,
      contentType: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      bytes: csv.length,
    },
    csv: format === 'csv' ? csv : null,
  };
}

/* ========================================================== transfers and assessments === */

/** AC-SEC-012-03-01: the transfer record, linked to its activities and integrations. */
export async function recordTransferAsync({
  destination, recipient, safeguard, dataCategories = [], activityIds = [], integrations = [],
  actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.PrivacyProfile.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.PrivacyProfile.CreateEditDelete' };
  }
  const row = await transferRepo().insertAsync({
    destination,
    recipient,
    safeguard,
    dataCategories,
    activityIds,
    integrations,
    linkedTo: 'PRD-SEC-006 data residency',
    createdOnUtc: new Date().toISOString(),
  });
  for (const activityId of activityIds) {
    const activity = await activityRepo().getByIdAsync(activityId);
    if (activity) {
      await activityRepo().updateAsync({ ...activity, transfers: [...new Set([...(activity.transfers ?? []), destination])] });
    }
  }
  await auditAsync({
    event: 'AUD-SEC-006', area: 'SEC', feature: 'PRD-SEC-012', entity: 'TransferRecord', entityId: row.id, actor: by, after: { destination, recipient, safeguard }, storeId, note: 'transfer record created',
  });
  return { ok: true, transfer: row };
}

export const transfersAsync = () => transferRepo().getAllAsync();

/** AC-SEC-012-04-01: the impact assessment and its review date. */
export async function recordAssessmentAsync({
  activityId, risks = [], measures = [], decision, document = null, reviewOnUtc, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.PrivacyProfile.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.PrivacyProfile.CreateEditDelete' };
  }
  const activity = await activityRepo().getByIdAsync(activityId);
  if (!activity) return { ok: false, message: 'no such processing activity' };
  const row = await assessmentRepo().insertAsync({
    activityId: activity.id, risks, measures, decision, document, reviewOnUtc, createdOnUtc: new Date().toISOString(),
  });
  await activityRepo().updateAsync({ ...activity, assessmentStatus: decision ?? 'Assessed', assessmentId: row.id });
  await auditAsync({
    event: 'AUD-SEC-006', area: 'SEC', feature: 'PRD-SEC-012', entity: 'ImpactAssessment', entityId: row.id, actor: by, after: { activityId: activity.id, decision, reviewOnUtc }, storeId, note: 'impact assessment recorded',
  });
  return { ok: true, assessment: row, activity: await activityRepo().getByIdAsync(activity.id) };
}

/** The reminder on the review date. */
export async function assessmentRemindersAsync({ storeId = 1 } = {}) {
  const due = (await assessmentRepo().getAllAsync())
    .filter((a) => a.reviewOnUtc && new Date(a.reviewOnUtc) <= new Date() && a.reminderSentOnUtc == null);
  for (const row of due) {
    try {
      await sendAsync({
        event: 'Sec.ImpactAssessment.Review',
        to: await getSettingAsync('sec.privacyofficeremail', storeId, 'privacy@example.com'),
        channels: ['email'],
        tokens: { assessmentId: String(row.id) },
        storeId,
        feature: 'PRD-SEC-012',
        gateways: messageGateways,
      });
    } catch { /* the reminder stands in the list */ }
    await assessmentRepo().updateAsync({ ...row, reminderSentOnUtc: new Date().toISOString() });
  }
  return { reminded: due.length, assessments: due.map((a) => a.id), privacyOfficerReminded: due.length > 0 };
}

/* ============================================================ the go-live checklist ===== */

/** The integrations that must have an activity, and a transfer record when they leave the country. */
export const EXTERNAL_PERSONAL_DATA_INTEGRATIONS = [
  { systemName: 'AI.Translation', feature: 'PRD-AI-003', kind: 'external AI or translation provider' },
  { systemName: 'AI.Chat', feature: 'PRD-AI-003', kind: 'external AI or translation provider' },
  { systemName: 'Recommendations', feature: 'PRD-SRC-009', kind: 'recommendation service' },
  { systemName: 'Lender', feature: 'PRD-FIN-001', kind: 'lender' },
];

/** AC-SEC-012-01-02, 03-02 and 06-01: the checklist. */
export async function goLiveChecklistAsync({ storeId = 1 } = {}) {
  const profile = await profileAsync({ storeId });
  const activities = await activitiesAsync();
  const transfers = await transfersAsync();
  const items = [];

  for (const key of profile.missing) {
    items.push({
      check: `country profile: ${key}`,
      ok: false,
      messageKey: 'Sec.ProfileIncomplete',
      message: resource('Sec.ProfileIncomplete'),
      value: NOT_CONFIGURED,
    });
  }

  for (const integration of EXTERNAL_PERSONAL_DATA_INTEGRATIONS) {
    const enabled = await getSettingAsync(`sec.integrationenabled.${integration.systemName.toLowerCase()}`, storeId, false);
    if (enabled !== true) continue;
    const activity = activities.find((a) => (a.systems ?? []).includes(integration.systemName));
    const destinationCountry = await getSettingAsync(`sec.integrationcountry.${integration.systemName.toLowerCase()}`, storeId, null);
    const outside = destinationCountry && destinationCountry !== profile.country;
    const transfer = transfers.find((t) => (t.integrations ?? []).includes(integration.systemName));
    const allowed = profile.transferConditions !== null && profile.transferConditions !== undefined;
    items.push({
      check: `${integration.kind} ${integration.systemName}`,
      ok: Boolean(activity) && (!outside || (Boolean(transfer) && allowed)),
      activityRecorded: Boolean(activity),
      transferRecorded: Boolean(transfer),
      outsideInstanceCountry: Boolean(outside),
      profileAllowsTransfer: allowed ? true : NOT_CONFIGURED,
      feature: integration.feature,
    });
  }

  // AC-SEC-012-06-01: analytics needs an activity with lawful basis consent, linked to the
  // SEC-007 analytics cookie category
  const analyticsUsed = await getSettingAsync('sec.analyticsinuse', storeId, true);
  if (analyticsUsed === true) {
    const analytics = activities.find((a) => a.cookieCategory === 'analytics');
    items.push({
      check: 'analytics processing activity',
      ok: Boolean(analytics) && analytics.lawfulBasis === 'consent',
      activityRecorded: Boolean(analytics),
      lawfulBasis: analytics?.lawfulBasis ?? NOT_CONFIGURED,
      linkedCookieCategory: analytics?.cookieCategory ?? NOT_CONFIGURED,
      linkedTo: 'PRD-SEC-007',
    });
  }

  const failing = items.filter((i) => !i.ok);
  return {
    ok: failing.length === 0,
    items,
    failing,
    timersShown: {
      privacyRequests: profile.dataRequestResponseDays ?? NOT_CONFIGURED,
      breachToRegulator: profile.breachDeadlineToRegulatorHours ?? NOT_CONFIGURED,
      breachToPeople: profile.breachDeadlineToPeopleHours ?? NOT_CONFIGURED,
    },
    rule: 'BR-SEC-040',
  };
}
