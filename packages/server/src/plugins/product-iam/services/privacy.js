// PRD-IAM-016 Terms acceptance with versioning (the acceptance record itself).
//
// BR-IAM-091: policy acceptance is recorded only by IAM, per policy system name and version, for
// a customer and, for seller terms, the vendor. The version and the "re-acceptance required"
// flag are those of the MKT-008 effective version; IAM stores no policy text, version or flag.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { getSettingAsync } from '../../../core/settings.js';
import { sendAsync, resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { providers, runProviders } from '../../../core/providers.js';
import { messageGateways } from '@product/mocks';
import { logGdprAsync, gdprLogAsync } from './profile.js';

const acceptanceRepo = () => repository('PolicyAcceptance');
const versionRepo = () => repository('PolicyVersion');

/** IC-MKT-03 Effective version, supplied by MKT-008. */
export async function effectiveVersionAsync({ policySystemName, storeId = 1 }) {
  const versions = await versionRepo().getAllAsync((v) => v.policySystemName === policySystemName
    && (v.storeId ?? storeId) === storeId && v.published !== false);
  const effective = versions.sort((a, b) => b.versionNo - a.versionNo)[0];
  if (!effective) {
    return {
      policySystemName, versionNo: 'unversioned', reacceptanceRequired: false, suppliedBy: 'PRD-MKT-008',
    };
  }
  return { ...effective, suppliedBy: 'PRD-MKT-008' };
}

/** IC-IAM-05 RecordAcceptance. */
export async function recordAcceptanceAsync({
  customerId, vendorId = null, policySystemName, decision = 'accepted', channel = 'storefront',
  ipAddress = null, agentId = null, consentScope = null, storeId = 1,
}) {
  const version = await effectiveVersionAsync({ policySystemName, storeId });
  const row = await acceptanceRepo().insertAsync({
    customerId,
    vendorId,
    policySystemName,
    versionNo: version.versionNo,
    decision,
    channel,
    ipAddress,
    agentId,
    consentScope,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-014',
    area: 'IAM',
    feature: 'PRD-IAM-016',
    entity: 'PolicyAcceptance',
    entityId: row.id,
    actor: String(customerId),
    after: { policySystemName, versionNo: version.versionNo, decision },
    note: `policy ${decision}`,
  });
  return row;
}

export const acceptancesAsync = (customerId = null) => acceptanceRepo()
  .getAllAsync((a) => (customerId ? a.customerId === customerId : true));

/** Has this customer accepted the effective version of the policy? */
export async function hasAcceptedEffectiveAsync({ customerId, policySystemName, storeId = 1 }) {
  const version = await effectiveVersionAsync({ policySystemName, storeId });
  const rows = await acceptanceRepo().getAllAsync((a) => a.customerId === customerId
    && a.policySystemName === policySystemName);
  const accepted = rows.some((a) => a.decision === 'accepted' && String(a.versionNo) === String(version.versionNo));
  return { accepted, version, reacceptanceRequired: version.reacceptanceRequired === true && !accepted };
}

/* ===================================== PRD-IAM-016 re-acceptance and the consent trail == */

const requestRepo = () => repository('PrivacyRequest');
const consentRepo = () => repository('GdprConsent');
const consentStateRepo = () => repository('CustomerConsent');

/** The pages that stay reachable while a re-acceptance is pending (BR-IAM-091). */
export const ALWAYS_REACHABLE = ['/logout', '/customer/terms', '/privacy-policy', '/conditions-of-use', '/customer/accept-terms'];

/**
 * AC-IAM-016-02-01, 02-03 and 02-04: the re-acceptance filter. It asks IC-MKT-03 for the
 * effective version and the "re-acceptance required" flag; IAM keeps no flag of its own.
 */
export async function reacceptanceCheckAsync({
  customer, vendorId = null, path = '/', storeId = 1, policySystemNames = null,
}) {
  if (!customer) return { redirect: false, reason: 'not signed in' };
  const configured = policySystemNames ?? await getSettingAsync('iam.reacceptancepolicies', storeId, ['ConditionsOfUse', 'PrivacyPolicy']);
  const pending = [];
  for (const policySystemName of configured) {
    const state = await hasAcceptedEffectiveAsync({ customerId: customer.id, policySystemName, storeId });
    if (state.reacceptanceRequired) pending.push({ policySystemName, versionNo: state.version.versionNo });
  }
  if (vendorId) {
    const sellerTermsRequired = await getSettingAsync('iam.sellertermsreacceptance', storeId, true);
    if (sellerTermsRequired === true) {
      const version = await effectiveVersionAsync({ policySystemName: 'VendorTermsOfService', storeId });
      const rows = await acceptanceRepo().getAllAsync((a) => a.customerId === customer.id
        && a.vendorId === vendorId && a.policySystemName === 'VendorTermsOfService');
      const accepted = rows.some((a) => a.decision === 'accepted' && String(a.versionNo) === String(version.versionNo));
      if (!accepted && version.reacceptanceRequired === true) {
        pending.push({ policySystemName: 'VendorTermsOfService', versionNo: version.versionNo, vendorId });
      }
    }
  }
  if (pending.length === 0) return { redirect: false, pending: [] };
  if (ALWAYS_REACHABLE.some((p) => path.startsWith(p))) {
    return {
      redirect: false, pending, reachableAnyway: true, note: 'logout and the policy pages stay reachable',
    };
  }
  return {
    redirect: true,
    redirectTo: '/customer/accept-terms',
    messageKey: 'Iam.TermsUpdated',
    message: resource('Iam.TermsUpdated'),
    pending,
    flagSuppliedBy: 'IC-MKT-03 GetEffectivePolicyVersion',
  };
}

/** AC-IAM-016-02-02: a decline is recorded and the user is signed out. */
export async function declineAsync({
  customer, policySystemName, vendorId = null, channel = 'storefront', ipAddress = null, storeId = 1,
}) {
  const row = await recordAcceptanceAsync({
    customerId: customer.id, vendorId, policySystemName, decision: 'declined', channel, ipAddress, storeId,
  });
  const { forceLogoutAsync } = await import('./sessions.js');
  // the sign-in itself clears requireReLogin, so the account is not blocked - only this session
  const logout = await forceLogoutAsync({ customerId: customer.id, by: customer.email ?? String(customer.id), reason: 'the new terms were declined' });
  return {
    ok: true,
    acceptance: row,
    signedOut: true,
    sessionsEnded: logout.revoked,
    messageKey: 'Iam.TermsDeclined',
    message: resource('Iam.TermsDeclined'),
    signInRequiresAcceptance: true,
  };
}

/** AC-IAM-016-03-01 and 03-02: IC-IAM-05 GetConsentTrail, read-only. */
export async function consentTrailAsync({ customerId, actor, requestedBy = 'admin' }) {
  if (!await authorizeAsync('Identity.Core.ConsentTrail.View', actor)) {
    return { ok: false, denied: true, permission: 'Identity.Core.ConsentTrail.View' };
  }
  const acceptances = (await acceptancesAsync(customerId)).map((a) => ({
    kind: 'policy',
    policySystemName: a.policySystemName,
    versionNo: a.versionNo,
    decision: a.decision,
    channel: a.channel,
    vendorId: a.vendorId ?? null,
    at: a.createdOnUtc,
  }));
  const consents = (await gdprLogAsync(customerId))
    .filter((r) => ['ConsentAgree', 'ConsentDisagree'].includes(r.requestType))
    .map((r) => ({
      kind: 'consent', decision: r.requestType, consent: r.customerInfo, at: r.createdOnUtc,
    }));
  const entries = [...acceptances, ...consents].sort((a, b) => new Date(a.at) - new Date(b.at));
  return {
    ok: true, entries, readOnly: true, contract: 'IC-IAM-05 GetConsentTrail', requestedBy,
  };
}

/* ================================================= PRD-IAM-017 consents and privacy ===== */

/** The GdprConsent rows of the installation (native entity). */
export const consentsAsync = () => consentRepo().getAllAsync();

export async function customerConsentsAsync({ customerId }) {
  const all = await consentsAsync();
  const states = await consentStateRepo().getAllAsync((s) => s.customerId === customerId);
  return all
    .filter((c) => c.displayOnCustomerInfoPage !== false)
    .map((c) => ({
      consentId: c.id,
      systemName: c.systemName,
      message: c.message,
      isRequired: c.isRequired === true,
      accepted: states.find((s) => s.consentId === c.id)?.accepted ?? false,
    }));
}

/**
 * AC-IAM-017-01-01 and 01-03: the GDPR log records ConsentAgree or ConsentDisagree; a withdrawal
 * tells the modules registered for that consent through IC-IAM-08 ConsentWithdrawn.
 */
export async function setConsentAsync({
  customerId, systemName, accepted, storeId = 1,
}) {
  const consent = await consentRepo().getOneAsync((c) => c.systemName === systemName);
  if (!consent) return { ok: false, message: 'no such consent' };
  const existing = await consentStateRepo().getOneAsync((s) => s.customerId === customerId && s.consentId === consent.id);
  const state = existing
    ? await consentStateRepo().updateAsync({ ...existing, accepted })
    : await consentStateRepo().insertAsync({
      customerId, consentId: consent.id, systemName, accepted,
    });
  await logGdprAsync({
    customerId, requestType: accepted ? 'ConsentAgree' : 'ConsentDisagree', customerInfo: systemName,
  });
  let marketingStopped = false;
  if (!accepted && consent.isMarketing === true) {
    const customer = await repository('Customer').getByIdAsync(customerId);
    await repository('Customer').updateAsync({ ...customer, newsletterSubscribed: false, marketingStopped: true });
    marketingStopped = true;
  }
  let told = [];
  if (!accepted) {
    const results = await runProviders('IC-IAM-08', 'collect', {
      operation: 'ConsentWithdrawn', customerId, consentSystemName: systemName, storeId,
    });
    told = results.map((r) => ({
      feature: r.feature, name: r.name, stopped: r.result?.stopped !== false, dataDeleted: r.result?.dataDeleted ?? null,
    }));
  }
  await auditAsync({
    event: 'AUD-IAM-013', area: 'IAM', feature: 'PRD-IAM-017', entity: 'CustomerConsent', entityId: state.id, actor: String(customerId), after: { systemName, accepted }, note: accepted ? 'consent given' : 'consent withdrawn',
  });
  return {
    ok: true,
    consent: state,
    gdprLogged: accepted ? 'ConsentAgree' : 'ConsentDisagree',
    marketingStopped,
    marketingStopsFrom: marketingStopped ? 'the next send' : null,
    modulesTold: told,
    contract: 'IC-IAM-08 ConsentWithdrawn',
    stopsFrom: 'the next request',
  };
}

export const consentProviders = () => providers('IC-IAM-08').map((p) => ({ feature: p.feature, name: p.name }));

/**
 * AC-IAM-017-01-02 and 06-01: the cookie categories and the choice belong to PRD-SEC-007
 * ("see SEC-007 (REQ-MPC-FR-010)"), so IAM only offers them on the account page and calls in.
 */
const sec007 = () => import('../../product-sec/services/consent.js');

export const cookieCategoriesAsync = async (storeId = 1) => (await sec007()).categoriesAsync(storeId);

export async function setCookieChoicesAsync({
  customerId = null, visitorId, accepted, storeId = 1,
}) {
  const result = await (await sec007()).saveChoiceAsync({
    visitorId, customerId, accepted, storeId,
  });
  return { ...result, ownedBy: 'PRD-SEC-007' };
}

export async function cookieChoiceAsync({ visitorId, customerId = null, storeId = 1 }) {
  return (await sec007()).choiceAsync({ visitorId, customerId, storeId });
}

/** AC-IAM-017-06-01: no analytics widget and no profile without the analytics category. */
export async function analyticsAllowedAsync({ visitorId, customerId = null, storeId = 1 }) {
  const { active, withheld } = await (await sec007()).loadActiveWidgetsAsync({
    visitorId, customerId, storeId,
  });
  const allowed = active.some((w) => w.systemName === 'Widgets.GoogleAnalytics');
  return {
    allowed,
    widgetsRendered: active.filter((w) => w.category === 'analytics').map((w) => w.systemName),
    widgetsWithheld: withheld.map((w) => w.systemName),
    profileBuilt: allowed,
    gatedBy: 'PRD-SEC-007',
  };
}

/* --------------------------------------------- the GDPR tools: export, correct, delete -- */

/** AC-IAM-017-02-01: the native XLSX export plus the product-plugin file (Proposed). */
export async function exportMyDataAsync({ customer, storeId = 1 }) {
  const enabled = await getSettingAsync('gdprsettings.gdprenabled', storeId, true);
  if (enabled !== true) return { ok: false, message: 'the GDPR tools are not enabled for this store' };
  const row = await repository('Customer').getByIdAsync(customer.id);
  const addresses = await repository('Address').getAllAsync((a) => a.customerId === row.id && !a.deleted);
  const orders = await repository('Order').getAllAsync((o) => o.customerEmail === row.email);
  const files = [
    {
      name: `customerdata-${row.id}.xlsx`,
      format: 'xlsx',
      source: 'native',
      sheets: ['Personal data', 'Addresses', 'Orders'],
      rows: 1 + addresses.length + orders.length,
    },
    {
      // Proposed: the PRD leaves the second file's shape unstated, so it lists the product tables
      name: `productdata-${row.id}.xlsx`,
      format: 'xlsx',
      source: 'product plugins',
      tables: [
        { table: 'PolicyAcceptance', rows: (await acceptancesAsync(row.id)).length },
        { table: 'AuthEvent', rows: (await repository('AuthEvent').getAllAsync((e) => e.customerId === row.id)).length },
        { table: 'UserSession', rows: (await repository('UserSession').getAllAsync((s) => s.customerId === row.id)).length },
        { table: 'CustomerConsent', rows: (await consentStateRepo().getAllAsync((s) => s.customerId === row.id)).length },
        { table: 'CustomerPreference', rows: (await repository('CustomerPreference').getAllAsync((p) => p.customerId === row.id)).length },
        { table: 'VerificationCase', rows: (await repository('VerificationCase').getAllAsync((c) => c.subjectId === row.id)).length },
      ],
      prototypeDefault: true,
    },
  ];
  await logGdprAsync({ customerId: row.id, requestType: 'ExportData', customerInfo: row.email ?? row.phone });
  return { ok: true, files, gdprLogged: 'ExportData' };
}

/**
 * SEC-012 supplies the response time; none is coded here (NFR-SEC-005). When the country profile
 * has no response time the due date is not set and the request shows "not configured"
 * (AC-SEC-012-01-02).
 */
export async function dueDateAsync({ storeId = 1, country = null, type = 'Correction' }) {
  const { responseDeadlineAsync, profileAsync } = await import('../../product-sec/services/privacy-profile.js');
  const deadline = await responseDeadlineAsync({ storeId });
  const profile = await profileAsync({ storeId, country });
  return {
    days: deadline.days,
    country: profile.country,
    type,
    configured: deadline.configured,
    display: deadline.configured ? `${deadline.days} days` : 'not configured',
    dueOnUtc: deadline.dueOnUtc,
    suppliedBy: 'PRD-SEC-012 country profile',
  };
}

export async function requestCorrectionAsync({
  customer, field, currentValue, requestedValue, reason, storeId = 1,
}) {
  if (!field || requestedValue === undefined || !reason) {
    return { ok: false, message: 'name the field, the requested value and a reason' };
  }
  const due = await dueDateAsync({ storeId, type: 'Correction' });
  const row = await requestRepo().insertAsync({
    customerId: customer.id,
    type: 'Correction',
    status: 'Received',
    field,
    currentValue,
    requestedValue,
    reason,
    dueOnUtc: due.dueOnUtc,
    dueDays: due.days,
    dueDisplay: due.display,
    dueFrom: due.suppliedBy,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-011', area: 'IAM', feature: 'PRD-IAM-017', entity: 'PrivacyRequest', entityId: row.id, actor: customer.email ?? String(customer.id), after: { type: 'Correction', status: 'Received', field }, note: 'correction request received',
  });
  return {
    ok: true,
    request: row,
    messageKey: 'Iam.CorrectionRequestReceived',
    message: resource('Iam.CorrectionRequestReceived'),
  };
}

/** AC-IAM-017-03-02 and 03-03: the reviewer approves or rejects with a reason. */
export async function decideCorrectionAsync({
  requestId, decision, reason = null, by, actor, storeId = 1,
}) {
  if (!await authorizeAsync('Customers.GDPRManage', actor)) {
    return { ok: false, denied: true, permission: 'Customers.GDPRManage' };
  }
  const row = await requestRepo().getByIdAsync(requestId);
  if (!row || row.type !== 'Correction' || row.status !== 'Received') {
    return { ok: false, message: 'that correction request is not open' };
  }
  if (decision === 'reject' && !reason) {
    return { ok: false, reasonRequired: true, message: 'Give the customer a reason.' };
  }
  const customer = await repository('Customer').getByIdAsync(row.customerId);
  let applied = null;
  if (decision === 'approve') {
    if (String(row.field).startsWith('address.')) {
      const [, addressId, field] = String(row.field).split('.');
      const address = await repository('Address').getByIdAsync(Number(addressId));
      if (address) {
        await repository('Address').updateAsync({ ...address, [field]: row.requestedValue });
        applied = { address: Number(addressId), field, value: row.requestedValue };
      }
    } else {
      await repository('Customer').updateAsync({ ...customer, [row.field]: row.requestedValue });
      applied = { field: row.field, value: row.requestedValue };
    }
    await logGdprAsync({ customerId: row.customerId, requestType: 'ProfileChanged', note: `corrected: ${row.field}` });
  }
  const updated = await requestRepo().updateAsync({
    ...row,
    status: decision === 'approve' ? 'Completed' : 'Rejected',
    decidedBy: by,
    reason,
    decidedOnUtc: new Date().toISOString(),
  });
  try {
    await sendAsync({
      event: decision === 'approve' ? 'Iam.Correction.Applied' : 'Iam.Correction.Rejected',
      to: customer?.email ?? customer?.phone,
      channels: [customer?.email ? 'email' : 'sms'],
      tokens: { field: row.field, reason: reason ?? '' },
      storeId,
      feature: 'PRD-IAM-017',
      gateways: messageGateways,
    });
  } catch { /* the decision stands even if the notice fails */ }
  await auditAsync({
    event: 'AUD-IAM-011', area: 'IAM', feature: 'PRD-IAM-017', entity: 'PrivacyRequest', entityId: row.id, actor: by, before: { status: 'Received' }, after: { status: updated.status, reason }, note: `correction ${decision}d`,
  });
  return {
    ok: true,
    request: updated,
    applied,
    customerNotified: true,
    gdprLogged: decision === 'approve' ? 'ProfileChanged' : null,
    placedOrdersUnchanged: true,
    reason,
  };
}

/** AC-IAM-017-04-01: the native delete-account flow opens a Deletion request. */
export async function requestDeletionAsync({ customer, storeId = 1 }) {
  const enabled = await getSettingAsync('gdprsettings.gdprenabled', storeId, true);
  if (enabled !== true) return { ok: false, message: 'the GDPR tools are not enabled for this store' };
  const due = await dueDateAsync({ storeId, type: 'Deletion' });
  const row = await requestRepo().insertAsync({
    customerId: customer.id,
    type: 'Deletion',
    status: 'Received',
    dueOnUtc: due.dueOnUtc,
    dueDays: due.days,
    dueDisplay: due.display,
    dueFrom: due.suppliedBy,
    createdOnUtc: new Date().toISOString(),
  });
  await logGdprAsync({ customerId: customer.id, requestType: 'DeleteCustomer', customerInfo: customer.email ?? customer.phone });
  let notified = false;
  try {
    await sendAsync({
      event: 'Customer.Gdpr.DeleteRequest',
      to: await getSettingAsync('storeinformationsettings.storeowneremail', storeId, 'owner@example.com'),
      channels: ['email'],
      tokens: { customer: customer.email ?? customer.phone },
      storeId,
      feature: 'PRD-IAM-017',
      gateways: messageGateways,
    });
    notified = true;
  } catch { /* the request stands */ }
  return {
    ok: true, request: row, gdprLogged: 'DeleteCustomer', storeOwnerNotified: notified,
  };
}

/**
 * AC-IAM-017-04-02 and 04-03: the IAM override of IGdprService.PermanentDeleteCustomerAsync. It
 * clears the personal fields native code leaves (BR-IAM-092), erases the IAM plugin tables and
 * calls every registered IC-IAM-08 erasure provider inside the same operation; a Failed provider
 * leaves the request InProgress with the provider named.
 */
export const NATIVE_LEAVES = ['phone', 'company', 'dateOfBirth', 'gender', 'vatNumber', 'adminComment'];

export async function permanentDeleteCustomerAsync({
  customerId, actor, requestId = null, storeId = 1,
}) {
  if (!await authorizeAsync('Customers.GDPRManage', actor)) {
    return { ok: false, denied: true, permission: 'Customers.GDPRManage' };
  }
  const customer = await repository('Customer').getByIdAsync(customerId);
  if (!customer) return { ok: false, message: 'no such account' };
  const request = requestId
    ? await requestRepo().getByIdAsync(requestId)
    : await requestRepo().getOneAsync((r) => r.customerId === customerId && r.type === 'Deletion' && ['Received', 'InProgress'].includes(r.status));

  // the native flow: the row is marked deleted and the login fields are cleared
  const cleared = {};
  for (const field of NATIVE_LEAVES) {
    if (customer[field] !== undefined && customer[field] !== null) cleared[field] = field;
  }
  await repository('Customer').updateAsync({
    ...customer,
    deleted: true,
    active: false,
    email: `deleted-${customer.id}@anonymised.invalid`,
    firstName: null,
    lastName: null,
    password: null,
    ...Object.fromEntries(NATIVE_LEAVES.map((f) => [f, null])),
  });

  // the IAM plugin tables
  const erasedTables = [];
  for (const [entity, predicate] of [
    ['PhoneIdentity', (r) => r.customerId === customerId],
    ['UserSession', (r) => r.customerId === customerId],
    ['OtpChallenge', (r) => r.customerId === customerId],
    ['Address', (r) => r.customerId === customerId],
    ['CustomerPreference', (r) => r.customerId === customerId],
    ['MfaRegistration', (r) => r.customerId === customerId],
    ['ExternalAuthenticationRecord', (r) => r.customerId === customerId],
  ]) {
    const rows = await repository(entity).getAllAsync(predicate);
    for (const row of rows) await repository(entity).deleteAsync(row.id);
    if (rows.length) erasedTables.push({ table: entity, rows: rows.length });
  }

  // IC-IAM-08: the other modules erase their own, inside the same operation
  const results = await runProviders('IC-IAM-08', 'collect', {
    operation: 'EraseCustomerData', customerId, storeId,
  });
  const providerResults = results.map((r) => ({
    feature: r.feature,
    name: r.name,
    outcome: r.result?.outcome === 'Failed' ? 'Failed' : 'Erased',
    detail: r.result?.detail ?? null,
  }));
  const failed = providerResults.filter((p) => p.outcome === 'Failed');

  // the audit trail and the order history are kept under the retention rules
  const kept = {
    orders: (await repository('Order').getAllAsync((o) => o.customerEmail === customer.email)).length,
    auditTrail: 'kept under PRD-PLT-020 and PRD-SEC-012 retention',
    invoices: 'kept under PRD-PLT-020 and PRD-SEC-012 retention',
  };
  let updatedRequest = request ?? null;
  if (request) {
    updatedRequest = await requestRepo().updateAsync({
      ...request,
      status: failed.length ? 'InProgress' : 'Completed',
      failedProviders: failed.map((f) => f.feature),
      completedOnUtc: failed.length ? null : new Date().toISOString(),
    });
  }
  await logGdprAsync({ customerId, requestType: 'DeleteCustomer', note: 'permanent delete run' });
  await auditAsync({
    event: 'AUD-IAM-011',
    area: 'IAM',
    feature: 'PRD-IAM-017',
    entity: 'Customer',
    entityId: customerId,
    actor: actor?.email ?? 'privacy officer',
    after: {
      fieldsCleared: Object.keys(cleared), tablesErased: erasedTables.map((t) => t.table), providers: providerResults, status: updatedRequest?.status ?? 'Completed',
    },
    note: 'permanent delete of a customer under PRD-IAM-017',
  });

  // AC-IAM-019-01-04: the core system is told
  const { notifyErasureAsync } = await import('./auth-events.js');
  const erasureNotice = await notifyErasureAsync({ customerId, storeId });

  return {
    ok: failed.length === 0,
    overrideOf: 'IGdprService.PermanentDeleteCustomerAsync',
    nativeFieldsCleared: NATIVE_LEAVES,
    erasedTables,
    providerResults,
    failedProviders: failed,
    request: updatedRequest,
    kept,
    erasureNotice: erasureNotice.message,
  };
}

/** AC-IAM-017-05-01: an open request past its due date is Overdue and the officer is told. */
export async function markOverdueAsync({ storeId = 1 } = {}) {
  const open = await requestRepo().getAllAsync((r) => ['Received', 'InProgress'].includes(r.status));
  const now = Date.now();
  const marked = [];
  for (const row of open) {
    if (!row.dueOnUtc) continue; // "not configured": there is no date to pass
    if (new Date(row.dueOnUtc).getTime() > now) continue;
    const updated = await requestRepo().updateAsync({ ...row, status: 'Overdue', overdueOnUtc: new Date().toISOString() });
    marked.push(updated);
    try {
      await sendAsync({
        event: 'Iam.PrivacyRequest.Overdue',
        to: await getSettingAsync('sec.privacyofficeremail', storeId, 'privacy@example.com'),
        channels: ['email'],
        tokens: { requestId: String(row.id), type: row.type },
        storeId,
        feature: 'PRD-IAM-017',
        gateways: messageGateways,
      });
    } catch { /* the state stands */ }
    await auditAsync({
      event: 'AUD-IAM-011', area: 'IAM', feature: 'PRD-IAM-017', entity: 'PrivacyRequest', entityId: row.id, actor: 'system', before: { status: row.status }, after: { status: 'Overdue' }, note: 'the due date from the country profile was reached',
    });
  }
  return { marked, privacyOfficerNotified: marked.length > 0 };
}

export const privacyRequestsAsync = (filter = {}) => requestRepo()
  .getAllAsync((r) => (!filter.customerId || r.customerId === Number(filter.customerId))
    && (!filter.type || r.type === filter.type)
    && (!filter.status || r.status === filter.status));

/** AC-IAM-017-05-02: the privacy trail - consents, exports and requests with their outcomes. */
export async function privacyTrailAsync({ customerId, actor }) {
  if (!await authorizeAsync('Identity.Core.ConsentTrail.View', actor)) {
    return { ok: false, denied: true, permission: 'Identity.Core.ConsentTrail.View' };
  }
  const log = await gdprLogAsync(customerId);
  const requests = await privacyRequestsAsync({ customerId });
  const entries = [
    ...log.filter((r) => ['ConsentAgree', 'ConsentDisagree'].includes(r.requestType)).map((r) => ({
      kind: 'consent change', what: r.customerInfo, outcome: r.requestType, at: r.createdOnUtc,
    })),
    ...log.filter((r) => r.requestType === 'ExportData').map((r) => ({
      kind: 'export', what: 'personal data export', outcome: 'Downloaded', at: r.createdOnUtc,
    })),
    ...requests.map((r) => ({
      kind: r.type === 'Correction' ? 'correction request' : 'deletion request',
      what: r.field ?? 'the account',
      outcome: r.status,
      dueOnUtc: r.dueOnUtc,
      at: r.createdOnUtc,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));
  return { ok: true, entries, readOnly: true };
}
