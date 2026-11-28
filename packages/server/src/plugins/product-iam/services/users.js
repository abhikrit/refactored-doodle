// PRD-IAM-010 User administration console.
//
// SM-IAM-02: the account states. BR-IAM-081: deactivation keeps all data and stops sign-in and
// marketing; deletion with anonymisation is only through IAM-017; self-reactivation is allowed
// only after self-deactivation.
// BR-IAM-130: the acting session is the native impersonation, guarded by the one product filter
// IAM-026 owns, which asks the registered rule providers (IC-IAM-09).

import { repository } from '../../../core/repository.js';
import { beginActingSession } from './identity.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { providers, runProviders } from '../../../core/providers.js';
import { requestCodeAsync, verifyCodeAsync } from './otp.js';
import { verifyPasswordAsync } from './passwords.js';
import { forceLogoutAsync } from './sessions.js';
import { recordReadAccessAsync, recordAuthEventAsync } from './auth-events.js';
import { publishAsync } from '../../../core/events.js';

const customerRepo = () => repository('Customer');
const activityRepo = () => repository('ActivityLog');
const assistedRepo = () => repository('AssistedServiceRecord');

/** AC-IAM-010-01-01: the native admin customer list, searchable on every listed field. */
export async function searchCustomersAsync({
  email = null, name = null, phone = null, company = null, role = null,
  registeredFrom = null, lastActivityFrom = null, staff = null, limit = 100,
}) {
  const rows = await customerRepo().getAllAsync((c) => !c.deleted);
  const match = rows.filter((c) => (!email || String(c.email ?? '').toLowerCase().includes(email.toLowerCase()))
    && (!name || `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(name.toLowerCase()))
    && (!phone || String(c.phone ?? '').includes(phone))
    && (!company || String(c.company ?? '').toLowerCase().includes(company.toLowerCase()))
    && (!role || (c.roles ?? []).includes(role))
    && (!registeredFrom || new Date(c.createdOnUtc ?? 0) >= new Date(registeredFrom))
    && (!lastActivityFrom || new Date(c.lastActivityUtc ?? 0) >= new Date(lastActivityFrom)));
  return {
    customers: match.slice(0, limit).map(({ password, ...c }) => c),
    total: match.length,
    searchableFields: ['email', 'name', 'phone', 'company', 'role', 'registrationDate', 'lastActivity'],
    openedBy: staff ?? null,
  };
}

/**
 * AC-IAM-010-02-01 and 02-02: staff clear or set the Active flag; sign-in stops, open sessions end
 * and AUD-IAM-008 is written.
 */
export async function setActiveByStaffAsync({
  email, active, staff, reason = null,
}) {
  if (!await authorizeAsync('Customers.CustomersCreateEditDelete', staff)) {
    return { ok: false, denied: true, permission: 'Customers.CustomersCreateEditDelete' };
  }
  const customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
  if (!customer) return { ok: false, message: 'no such account' };
  const updated = await customerRepo().updateAsync({
    ...customer,
    active,
    accountState: active ? 'Active' : 'DeactivatedByStaff',
    deactivationReason: active ? null : reason,
  });
  let logout = null;
  if (!active) logout = await forceLogoutAsync({ customerId: customer.id, by: staff?.email ?? 'staff', reason: 'account deactivated' });
  else await customerRepo().updateAsync({ ...updated, requireReLogin: false });
  await auditAsync({
    event: 'AUD-IAM-008',
    area: 'IAM',
    feature: 'PRD-IAM-010',
    entity: 'Customer',
    entityId: customer.id,
    actor: staff?.email ?? 'staff',
    before: { active: customer.active, accountState: customer.accountState ?? 'Active' },
    after: { active, accountState: updated.accountState },
    note: active ? 'reactivated by staff' : `deactivated by staff${reason ? `: ${reason}` : ''}`,
  });
  await activityRepo().insertAsync({
    systemKeyword: 'EditCustomer', customerId: customer.id, comment: active ? 'customer activated' : 'customer deactivated', createdOnUtc: new Date().toISOString(),
  });
  await publishAsync('EntityUpdatedEvent', {
    entity: 'Customer', id: customer.id, changeType: active ? 'updated' : 'deactivated',
  });
  return {
    ok: true, customer: { ...updated, password: undefined }, sessionsEnded: logout?.revoked ?? 0, dataKept: true,
  };
}

/**
 * AC-IAM-010-04-01: the owner deactivates, confirming with the password or a one-time code.
 * Nothing is deleted and marketing stops (BR-IAM-081).
 */
export async function selfDeactivateAsync({
  customer, password = null, code = null, storeId = 1,
}) {
  const row = await customerRepo().getByIdAsync(customer.id);
  const byPassword = Boolean(password) && await verifyPasswordAsync(row, password);
  let byCode = false;
  if (!byPassword && code) {
    const verified = await verifyCodeAsync({
      recipient: row.email ?? row.phone, purpose: 'confirm-change', code, storeId,
    });
    byCode = verified.ok;
  }
  if (!byPassword && !byCode) {
    return { ok: false, confirmationRequired: true, message: 'Confirm with your password or a one-time code.' };
  }
  const updated = await customerRepo().updateAsync({
    ...row, active: false, accountState: 'DeactivatedByUser', newsletterSubscribed: false, marketingStopped: true,
  });
  const logout = await forceLogoutAsync({ customerId: row.id, by: row.email ?? row.phone, reason: 'the owner deactivated the account' });
  await auditAsync({
    event: 'AUD-IAM-008', area: 'IAM', feature: 'PRD-IAM-010', entity: 'Customer', entityId: row.id, actor: row.email ?? row.phone, before: { active: true }, after: { active: false, accountState: 'DeactivatedByUser' }, note: 'the owner deactivated the account',
  });
  return {
    ok: true,
    messageKey: 'Iam.AccountDeactivated',
    message: resource('Iam.AccountDeactivated'),
    sessionsEnded: logout.revoked,
    dataDeleted: false,
    marketingStopped: true,
    customer: { ...updated, password: undefined },
  };
}

/** AC-IAM-010-04-02: reactivation by the owner, after a code; 04-03: not after a staff action. */
export async function requestSelfReactivationAsync({ email, phone = null, storeId = 1, smsProvider = null }) {
  const customer = await customerRepo().getOneAsync((c) => (email ? c.email === email : c.phone === phone));
  if (!customer) return { ok: false, message: 'no such account' };
  if (customer.accountState !== 'DeactivatedByUser') {
    return {
      ok: false, messageKey: 'Iam.ContactSupport', message: resource('Iam.ContactSupport'), selfReactivationAllowed: false,
    };
  }
  const challenge = await requestCodeAsync({
    recipient: customer.email ?? customer.phone,
    purpose: 'confirm-change',
    customerId: customer.id,
    storeId,
    smsProvider: customer.email ? null : smsProvider,
    channel: customer.email ? 'email' : 'sms',
  });
  return { ...challenge, selfReactivationAllowed: true };
}

export async function completeSelfReactivationAsync({ email, phone = null, code, storeId = 1 }) {
  const customer = await customerRepo().getOneAsync((c) => (email ? c.email === email : c.phone === phone));
  if (!customer) return { ok: false, message: 'no such account' };
  if (customer.accountState !== 'DeactivatedByUser') {
    return { ok: false, messageKey: 'Iam.ContactSupport', message: resource('Iam.ContactSupport') };
  }
  const verified = await verifyCodeAsync({
    recipient: customer.email ?? customer.phone, purpose: 'confirm-change', code, storeId,
  });
  if (!verified.ok) return verified;
  const updated = await customerRepo().updateAsync({
    ...customer, active: true, accountState: 'Active', requireReLogin: false,
  });
  await auditAsync({
    event: 'AUD-IAM-008', area: 'IAM', feature: 'PRD-IAM-010', entity: 'Customer', entityId: customer.id, actor: customer.email ?? customer.phone, before: { active: false }, after: { active: true }, note: 'the owner reactivated the account',
  });
  return {
    ok: true, messageKey: 'Iam.AccountReactivated', message: resource('Iam.AccountReactivated'), customer: { ...updated, password: undefined },
  };
}

/* ====================================== the impersonation filter (BR-IAM-130) =========== */

/**
 * The one product filter on Admin CustomerController.Impersonate. Administrators are allowed; for
 * anyone else every registered rule provider (IC-IAM-09) is asked and one Allow is enough.
 */
export async function impersonateAsync({
  actor, customerEmail, customerPhone = null, customerCode = null, sessionId = null, storeId = 1,
}) {
  const target = customerEmail
    ? await customerRepo().getOneAsync((c) => c.email === customerEmail && !c.deleted)
    : await customerRepo().getOneAsync((c) => c.phone === customerPhone && !c.deleted);
  if (!target) return { ok: false, message: 'no such customer' };
  if (!await authorizeAsync('Customers.CustomersImpersonation', actor)) {
    return { ok: false, denied: true, permission: 'Customers.CustomersImpersonation' };
  }

  const isAdministrator = (actor?.roles ?? []).includes('Administrators');
  let decidedBy = 'Administrators';
  if (!isAdministrator) {
    const results = await runProviders('IC-IAM-09', 'collect', {
      actor, target, customerCode, storeId,
    });
    const allow = results.find((r) => r.result?.decision === 'Allow');
    if (!allow) {
      const deny = results.find((r) => r.result?.decision === 'Deny');
      await auditAsync({
        event: 'AUD-IAM-019',
        area: 'IAM',
        feature: 'PRD-IAM-026',
        entity: 'Customer',
        entityId: target.id,
        actor: actor?.email,
        outcome: 'rejected',
        after: { providersAsked: results.length },
        note: 'impersonation refused by the IAM filter',
      });
      return {
        ok: false,
        messageKey: deny?.result?.messageKey ?? 'Iam.ImpersonationNotAllowed',
        message: deny?.result?.message ?? resource('Iam.ImpersonationNotAllowed'),
        providersAsked: results.map((r) => r.feature),
      };
    }
    decidedBy = allow.feature;
  }

  // the native checks still apply: a non-administrator may not act for an administrator
  if (!isAdministrator && (target.roles ?? []).includes('Administrators')) {
    return {
      ok: false,
      nativeRefusal: true,
      messageKey: 'Admin.Customers.Customers.NonAdminNotImpersonateAsAdminError',
      message: 'A non-administrator cannot impersonate an administrator.',
      filterAllowed: true,
    };
  }
  if (target.active === false) {
    return { ok: false, nativeRefusal: true, message: 'The customer is not active.' };
  }

  const record = await assistedRepo().insertAsync({
    agentId: actor?.id ?? null,
    agentEmail: actor?.email ?? null,
    outlet: actor?.outlet ?? null,
    outletId: actor?.outletId ?? null,
    customerId: target.id,
    action: 'act',
    startedOnUtc: new Date().toISOString(),
  });
  for (const who of [actor?.id, target.id]) {
    await activityRepo().insertAsync({
      systemKeyword: 'Impersonation.Started', customerId: who, comment: `${actor?.email} started acting for ${target.email ?? target.phone}`, createdOnUtc: new Date().toISOString(),
    });
  }
  await recordAuthEventAsync({
    customerId: target.id, identifierTried: actor?.email, type: 'impersonation', outcome: 'success', channel: 'admin', storeId,
  });
  // the session now belongs to the customer, with the agent beside it, as native impersonation
  // does; an order placed from here is an assisted order (CHK-013 records it)
  const started = sessionId
    ? beginActingSession({ sessionId, customer: target, agent: actor })
    : { ok: false, message: 'no session to switch' };

  return {
    ok: true,
    actingFor: target.email ?? target.phone,
    decidedBy,
    record,
    actingSessionStarted: started.ok === true,
    activityWrittenForBoth: true,
    // AC-IAM-026-03-01: an order placed in the session carries the native note naming the agent,
    // and the order-to-agent and outlet link is the CHK-013 AssistedOrder record
    orderNote: `Order placed by ${actor?.email} on behalf of the customer`,
    orderLinkOwnedBy: 'PRD-CHK-013 AssistedOrder',
  };
}

export const impersonationProviders = () => providers('IC-IAM-09').map((p) => ({ feature: p.feature, name: p.name }));

/** AC-IAM-010-05-01: staff changes write old and new values to the trail and EditCustomer. */
export async function staffEditCustomerAsync({
  email, changes, staff,
}) {
  if (!await authorizeAsync('Customers.CustomersCreateEditDelete', staff)) {
    return { ok: false, denied: true, permission: 'Customers.CustomersCreateEditDelete' };
  }
  const customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
  if (!customer) return { ok: false, message: 'no such account' };
  const before = Object.fromEntries(Object.keys(changes).map((k) => [k, customer[k] ?? null]));
  const updated = await customerRepo().updateAsync({ ...customer, ...changes });
  await auditAsync({
    event: 'AUD-IAM-008',
    area: 'IAM',
    feature: 'PRD-IAM-010',
    entity: 'Customer',
    entityId: customer.id,
    actor: staff?.email,
    actorRole: (staff?.roles ?? []).join(', '),
    before,
    after: changes,
    note: 'customer record changed by staff',
  });
  await activityRepo().insertAsync({
    systemKeyword: 'EditCustomer', customerId: customer.id, comment: `changed: ${Object.keys(changes).join(', ')}`, createdOnUtc: new Date().toISOString(),
  });
  await publishAsync('EntityUpdatedEvent', { entity: 'Customer', id: customer.id, changeType: 'updated' });
  return {
    ok: true, customer: { ...updated, password: undefined }, before, after: changes,
  };
}

/** AC-IAM-010-05-02 / BR-IAM-080: opening a customer's data writes a read-access event. */
export async function openCustomerAsync({ email, staff, page = 'Customer edit' }) {
  if (!await authorizeAsync('Customers.CustomersView', staff)) {
    return { ok: false, denied: true, permission: 'Customers.CustomersView' };
  }
  const customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
  if (!customer) return { ok: false, message: 'no such account' };
  await recordReadAccessAsync({
    staffEmail: staff?.email, staffRole: (staff?.roles ?? [])[0] ?? null, customerId: customer.id, page,
  });
  return { ok: true, customer: { ...customer, password: undefined }, readAccessRecorded: true };
}

export const activityLogAsync = (customerId = null) => activityRepo()
  .getAllAsync((a) => (customerId ? a.customerId === customerId : true));
