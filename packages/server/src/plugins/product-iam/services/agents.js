// PRD-IAM-026 Assisted service by an outlet agent.
//
// BR-IAM-130: an agent signs in to a personal account - one account is never shared - and acts
// for a customer only through the native impersonation, guarded by the single product filter this
// feature owns (the filter itself is in users.js; this service holds the agent rule's data: the
// outlet assignment, the assisted registration and the acting session).
// BR-IAM-141: where IC-PLT-02 IsEnabled is false for PRD-IAM-026 the agent pages are not shown
// and the agent rule returns not applicable, so the filter refuses an agent's acting session.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { normalisePhoneAsync, identityForPhoneAsync } from './phone.js';
import { requestCodeAsync, verifyCodeAsync } from './otp.js';
import { completeMobileRegistrationAsync, registerAsync } from './registration.js';
import { recordAuthEventAsync } from './auth-events.js';

const customerRepo = () => repository('Customer');
const assistedRepo = () => repository('AssistedServiceRecord');
const activityRepo = () => repository('ActivityLog');
const scopeRepo = () => repository('PermissionScope');

/** IC-PLT-02 IsEnabled for PRD-IAM-026. */
export async function assistedServiceEnabledAsync(storeId = 1) {
  const value = await getSettingAsync('productfeature.prd-iam-026', storeId, null);
  return {
    enabled: value === null ? true : Boolean(value),
    contract: 'IC-PLT-02 IsEnabled',
    feature: 'PRD-IAM-026',
    pagesShown: value === null ? true : Boolean(value),
  };
}

/** AC-IAM-026-01-01: the agent's own account, with MFA if Agent is an MFA-required role. */
export async function agentProfileAsync({ customer, storeId = 1 }) {
  const { mfaRequiredRolesAsync } = await import('./mfa.js');
  const mfaRoles = await mfaRequiredRolesAsync(storeId);
  const roles = customer?.roles ?? [];
  return {
    personalAccount: true,
    sharedAccount: false,
    isAgent: roles.includes('Agent'),
    outlet: customer?.outlet ?? null,
    mfaRequired: roles.some((r) => mfaRoles.includes(r)),
    mfaRequiredRoles: mfaRoles,
    rule: 'BR-IAM-130',
  };
}

/** AC-IAM-026-04-02: the outlet assignment, which becomes the IAM-008 "outlet" scope. */
export async function assignOutletAsync({
  email, pickupPointId, actor, by,
}) {
  if (!await authorizeAsync('Identity.Core.Agents.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Identity.Core.Agents.CreateEditDelete' };
  }
  const agent = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
  if (!agent) return { ok: false, message: 'no such account' };
  const point = await repository('StorePickupPoint').getByIdAsync(pickupPointId);
  if (!point) return { ok: false, message: 'no such outlet' };

  const updated = await customerRepo().updateAsync({
    ...agent, outlet: point.name, outletId: point.id,
  });
  // the IAM-008 scope dimension "outlet" of that agent
  const existing = await scopeRepo().getOneAsync((s) => s.customerId === agent.id && s.dimension === 'outlet');
  const scope = existing
    ? await scopeRepo().updateAsync({ ...existing, value: point.name })
    : await scopeRepo().insertAsync({
      customerId: agent.id, dimension: 'outlet', value: point.name, grantedBy: by ?? 'administrator',
    });
  await auditAsync({
    event: 'AUD-IAM-014', area: 'IAM', feature: 'PRD-IAM-026', entity: 'Customer', entityId: agent.id, actor: by, before: { outlet: agent.outlet ?? null }, after: { outlet: point.name }, note: 'agent assigned to an outlet',
  });
  return {
    ok: true,
    agent: { ...updated, password: undefined },
    outlet: point.name,
    outletFrom: 'PRD-LOG-003 StorePickupPoint',
    scope,
    usedForStamps: true,
  };
}

export const agentsAsync = async () => (await customerRepo().getAllAsync((c) => (c.roles ?? []).includes('Agent') && !c.deleted))
  .map(({ password, ...c }) => ({
    email: c.email, firstName: c.firstName, lastName: c.lastName, outlet: c.outlet ?? null, outletId: c.outletId ?? null,
  }));

/* -------------------------------------------- the assisted registration ----------------- */

function notAssigned() {
  return {
    ok: false, messageKey: 'Iam.AgentNotAssigned', message: resource('Iam.AgentNotAssigned'), outlet: null,
  };
}

/** AC-IAM-026-02-01 and 02-02: the agent registers a customer who gives the code. */
export async function assistedRegistrationStartAsync({
  agent, phone = null, email = null, storeId = 1, smsProvider = null,
}) {
  const enabled = await assistedServiceEnabledAsync(storeId);
  if (!enabled.enabled) {
    return { ok: false, featureOff: true, message: 'Assisted service is not enabled for this store.' };
  }
  if (!await authorizeAsync('Identity.Core.AssistedService.Access', agent)) {
    return { ok: false, denied: true, permission: 'Identity.Core.AssistedService.Access' };
  }
  if (!agent?.outlet) return notAssigned();

  if (phone) {
    const normalised = await normalisePhoneAsync(phone, storeId);
    const held = await identityForPhoneAsync(normalised);
    const onRecord = await customerRepo().getOneAsync((c) => c.phone === normalised && !c.deleted);
    if (held || onRecord) {
      return {
        ok: false,
        accountCreated: false,
        messageKey: 'Iam.PhoneInUse',
        message: resource('Iam.PhoneInUse'),
        actingSessionPossible: Boolean((held || onRecord) && (onRecord?.outlet ?? null) === agent.outlet),
        rule: 'BR-IAM-130',
      };
    }
    const challenge = await requestCodeAsync({
      recipient: normalised, purpose: 'assisted-consent', storeId, channel: 'sms', smsProvider,
    });
    return { ...challenge, ok: true, identifier: normalised, channel: 'sms' };
  }

  const taken = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted && (c.roles ?? []).includes('Registered'));
  if (taken) {
    return { ok: false, accountCreated: false, messageKey: 'Account.Register.Errors.EmailAlreadyExists', message: 'That email address already has an account.' };
  }
  const challenge = await requestCodeAsync({
    recipient: email, purpose: 'assisted-consent', storeId, channel: 'email',
  });
  return { ...challenge, ok: true, identifier: email, channel: 'email' };
}

export async function assistedRegistrationCompleteAsync({
  agent, phone = null, email = null, code, firstName = null, lastName = null, password = null,
  storeId = 1, ipAddress = null,
}) {
  const enabled = await assistedServiceEnabledAsync(storeId);
  if (!enabled.enabled) return { ok: false, featureOff: true, message: 'Assisted service is not enabled for this store.' };
  if (!await authorizeAsync('Identity.Core.AssistedService.Access', agent)) {
    return { ok: false, denied: true, permission: 'Identity.Core.AssistedService.Access' };
  }
  if (!agent?.outlet) return notAssigned();

  const identifier = phone ? await normalisePhoneAsync(phone, storeId) : email;
  const consent = await verifyCodeAsync({
    recipient: identifier, purpose: 'assisted-consent', code, storeId,
  });
  if (!consent.ok) return { ...consent, accountCreated: false };

  // the account itself is the ordinary registration, with the acceptance stamped Assisted
  let created = null;
  if (phone) {
    const challenge = await requestCodeAsync({
      recipient: identifier, purpose: 'register', storeId, channel: 'sms',
    });
    created = await completeMobileRegistrationAsync({
      phone: identifier,
      code: challenge.demonstrationCode,
      firstName,
      lastName,
      storeId,
      policyAccepted: true,
      agentId: agent.id,
      ipAddress,
    });
  } else {
    created = await registerAsync({
      email,
      password: password ?? `Assisted-${Date.now()}!`,
      firstName,
      lastName,
      storeId,
      ipAddress,
      policyAccepted: true,
      channel: 'assisted-service',
      agentId: agent.id,
    });
  }
  if (created.ok !== true) return created;

  const customer = await customerRepo().getByIdAsync(created.customer.id);
  const stamped = await customerRepo().updateAsync({
    ...customer, registeredByAgentId: agent.id, registeredAtOutlet: agent.outlet, outlet: agent.outlet,
  });
  const record = await assistedRepo().insertAsync({
    agentId: agent.id,
    agentEmail: agent.email,
    outletId: agent.outletId ?? null,
    outlet: agent.outlet,
    customerId: customer.id,
    action: 'register',
    startedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-014',
    area: 'IAM',
    feature: 'PRD-IAM-026',
    entity: 'Customer',
    entityId: customer.id,
    actor: agent.email,
    actorRole: 'Agent',
    after: { registeredAtOutlet: agent.outlet, channel: 'assisted-service' },
    note: 'customer registered by an agent at an outlet',
  });
  const acceptances = await repository('PolicyAcceptance').getAllAsync((a) => a.customerId === customer.id);
  return {
    ok: true,
    accountCreated: true,
    customer: { ...stamped, password: undefined },
    agent: agent.email,
    outlet: agent.outlet,
    record,
    acceptanceChannel: acceptances[0]?.channel ?? null,
    acceptanceAgentId: acceptances[0]?.agentId ?? null,
  };
}

/* ------------------------------------------------- the acting session -------------------- */

/** AC-IAM-026-03-01: the customer's code, where the setting requires it. */
export async function actingConsentStartAsync({
  agent, customerEmail = null, customerPhone = null, storeId = 1, smsProvider = null,
}) {
  if (!agent?.outlet) return notAssigned();
  const customer = await customerRepo().getOneAsync((c) => (customerEmail ? c.email === customerEmail : c.phone === customerPhone) && !c.deleted);
  if (!customer) return { ok: false, message: 'no such customer' };
  const required = await getSettingAsync('iam.actingconsentcoderequired', storeId, true);
  if (required !== true) return { ok: true, codeRequired: false };
  const challenge = await requestCodeAsync({
    recipient: customer.email ?? customer.phone,
    purpose: 'assisted-consent',
    customerId: customer.id,
    storeId,
    channel: customer.email ? 'email' : 'sms',
    smsProvider: customer.email ? null : smsProvider,
  });
  return { ...challenge, ok: true, codeRequired: true };
}

/** AC-IAM-026-03-04: the session ends and Impersonation.Finished is written. */
export async function endActingSessionAsync({ agent, recordId = null, storeId = 1 }) {
  const record = recordId
    ? await assistedRepo().getByIdAsync(recordId)
    : await assistedRepo().getOneAsync((r) => r.agentId === agent?.id && r.action === 'act' && !r.endedOnUtc);
  if (!record) return { ok: false, message: 'no acting session is open' };
  const updated = await assistedRepo().updateAsync({ ...record, endedOnUtc: new Date().toISOString() });
  const customer = await customerRepo().getByIdAsync(record.customerId);
  for (const who of [agent?.id, record.customerId]) {
    await activityRepo().insertAsync({
      systemKeyword: 'Impersonation.Finished',
      customerId: who,
      comment: `${agent?.email} stopped acting for ${customer?.email ?? customer?.phone}`,
      createdOnUtc: new Date().toISOString(),
    });
  }
  await recordAuthEventAsync({
    customerId: record.customerId, identifierTried: agent?.email, type: 'impersonation-end', outcome: 'success', channel: 'admin', storeId,
  });
  return {
    ok: true, record: updated, impersonationEnded: true, activityWritten: 'Impersonation.Finished',
  };
}

export const assistedRecordsAsync = (filter = {}) => assistedRepo()
  .getAllAsync((r) => (!filter.agentId || r.agentId === Number(filter.agentId))
    && (!filter.customerId || r.customerId === Number(filter.customerId))
    && (!filter.action || r.action === filter.action));
