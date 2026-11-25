// PRD-IAM-007 Roles and permissions, PRD-IAM-008 Scoped permissions,
// PRD-IAM-009 Permission delegation and PRD-IAM-011 Staff invitation and access reviews.
//
// BR-IAM-050: the product role catalogue; the IAM plugin creates every missing role at install
// and at every start, because PermissionService creates a role only when it installs a permission.
// BR-IAM-051: effective permissions are the union of the roles, plus active delegations, limited
// by the user scopes. There are no deny rules.
// BR-IAM-052 / 053 / 054: packs use 5.00 permission system names; an unknown name grants nothing;
// declared exclusions are refused.
// BR-IAM-060: scopes per user or role and per permission, with the dimensions store, region,
// outlet, category, value band and time window.
// BR-IAM-070: a user delegates only a permission they hold that is marked delegable.

import { createHash, randomUUID } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource, sendAsync } from '../../../core/messages.js';
import { authorizeAsync, addRoleAsync } from '../../../core/permissions.js';
import { messageGateways } from '@product/mocks';

const roleRepo = () => repository('CustomerRole');
const permissionRepo = () => repository('PermissionRecord');
const mappingRepo = () => repository('PermissionRecordCustomerRoleMapping');
const scopeRepo = () => repository('ScopeAssignment');
const delegationRepo = () => repository('Delegation');
const invitationRepo = () => repository('Invitation');
const campaignRepo = () => repository('AccessReviewCampaign');
const reviewItemRepo = () => repository('AccessReviewItem');
const customerRepo = () => repository('Customer');

/** BR-IAM-050: the product role catalogue, with the native roles kept as they are. */
export const PRODUCT_ROLES = [
  'Finance', 'Risk', 'Agent', 'Auditor', 'SecurityOfficer', 'PrivacyOfficer', 'Operations',
  'OperationsManager', 'Compliance', 'PlatformOperator', 'Support', 'SupportManager',
  'AccountManager', 'AgencyOfficer', 'AgencyAdmin', 'Programme', 'Stock', 'Quality', 'Warehouse',
  'LogisticsOps', 'Courier', 'Marketing', 'Content', 'ContentApprover', 'Catalogue', 'Analyst',
  'Procurement', 'TradeBuyer',
];
const NATIVE_ROLES = ['Administrators', 'Registered', 'Guests', 'Vendors'];

/** BR-IAM-054: exclusions declared by the modules. */
export const PERMISSION_EXCLUSIONS = [
  { roleSystemName: 'Vendors', permission: 'Orders.ReturnRequestsView', declaredBy: 'PRD-RET' },
  { roleSystemName: 'Vendors', permission: 'Orders.ReturnRequestsCreateEditDelete', declaredBy: 'PRD-RET' },
  { roleSystemName: 'Support', permission: 'Customers.CustomersView', declaredBy: 'PRD-CRM (BR-CRM-030)' },
  { roleSystemName: 'SupportManager', permission: 'Customers.CustomersView', declaredBy: 'PRD-CRM (BR-CRM-030)' },
];

/* ============================================================ PRD-IAM-007 roles ========= */

/** AC-IAM-007-04-01: every catalogue role exists at start, with exactly its system name. */
export async function ensureProductRolesAsync() {
  const created = [];
  for (const systemName of PRODUCT_ROLES) {
    const existing = await roleRepo().getOneAsync((r) => r.systemName === systemName);
    if (existing) continue;
    await addRoleAsync({ name: systemName, systemName, isSystemRole: false });
    created.push(systemName);
  }
  return { created, catalogue: PRODUCT_ROLES.length };
}

export async function rolesAsync() {
  const roles = await roleRepo().getAllAsync();
  const mappings = await mappingRepo().getAllAsync();
  return roles.map((r) => ({
    ...r,
    productRole: PRODUCT_ROLES.includes(r.systemName),
    nativeRole: NATIVE_ROLES.includes(r.systemName),
    permissions: mappings.filter((m) => m.roleSystemName === r.systemName).map((m) => m.systemName),
  }));
}

/** AC-IAM-007-01-01: a new role gets exactly the permissions ticked for it, and no others. */
export async function createRoleAsync({
  name, systemName, permissions = [], actor = null, actorCustomer = null,
}) {
  // AC-IAM-007-01-02: both native permissions are needed
  for (const needed of ['Customers.CustomerRolesCreateEditDelete', 'Configuration.ManageACL']) {
    if (actorCustomer && !await authorizeAsync(needed, actorCustomer)) {
      return { ok: false, denied: true, permission: needed };
    }
  }
  const role = await addRoleAsync({ name, systemName, isSystemRole: false });
  const applied = [];
  const unknown = [];
  for (const permission of permissions) {
    const record = await permissionRepo().getOneAsync((p) => p.systemName === permission);
    if (!record) { unknown.push(permission); continue; }
    const excluded = PERMISSION_EXCLUSIONS.find((e) => e.roleSystemName === systemName && e.permission === permission);
    if (excluded) continue;
    await mappingRepo().insertAsync({
      permissionRecordId: record.id, customerRoleId: role.id, systemName: permission, roleSystemName: systemName, scope: null,
    });
    applied.push(permission);
  }
  await auditAsync({
    event: 'AUD-IAM-006', area: 'IAM', feature: 'PRD-IAM-007', entity: 'CustomerRole', entityId: role.id, actor: actor ?? 'administrator', after: { systemName, permissions: applied }, note: 'role created',
  });
  return {
    ok: true, role, permissions: applied, unknownPermissions: unknown,
  };
}

/**
 * AC-IAM-007-04-02: the display name may change; the system name may not.
 * AC-IAM-007-04-03: changing the system name or deleting a product role is refused with
 * Iam.ProductRoleProtected (the IAM filter on CustomerRoleController.Edit and Delete).
 */
export async function updateRoleAsync({
  systemName, name = null, newSystemName = null, actor = null,
}) {
  const role = await roleRepo().getOneAsync((r) => r.systemName === systemName);
  if (!role) return { ok: false, message: 'unknown role' };
  if (newSystemName && newSystemName !== systemName && PRODUCT_ROLES.includes(systemName)) {
    return {
      ok: false, messageKey: 'Iam.ProductRoleProtected', message: resource('Iam.ProductRoleProtected'), refusedBy: 'the IAM filter on Admin CustomerRoleController.Edit',
    };
  }
  const updated = await roleRepo().updateAsync({ ...role, name: name ?? role.name });
  const mappings = await mappingRepo().getAllAsync((m) => m.roleSystemName === systemName);
  return {
    ok: true, role: updated, systemNameUnchanged: updated.systemName === systemName, permissionsStillApply: mappings.length,
  };
}

export async function deleteRoleAsync({ systemName }) {
  if (PRODUCT_ROLES.includes(systemName) || NATIVE_ROLES.includes(systemName)) {
    return {
      ok: false, messageKey: 'Iam.ProductRoleProtected', message: resource('Iam.ProductRoleProtected'), refusedBy: 'the IAM filter on Admin CustomerRoleController.Delete',
    };
  }
  const role = await roleRepo().getOneAsync((r) => r.systemName === systemName);
  if (!role) return { ok: false, message: 'unknown role' };
  await roleRepo().deleteAsync(role.id);
  return { ok: true, deleted: systemName };
}

/**
 * AC-IAM-007-04-04 to 04-06: applying a role pack. An unknown permission name is an error and
 * grants nothing; an excluded mapping is refused; native mappings of other roles are untouched.
 */
export async function applyRolePackAsync({ mappings, actor = 'pack' }) {
  const applied = [];
  const errors = [];
  const refused = [];
  const before = (await mappingRepo().getAllAsync()).length;
  for (const { permission, roleSystemName } of mappings) {
    const record = await permissionRepo().getOneAsync((p) => p.systemName === permission);
    if (!record) {
      errors.push({ permission, roleSystemName, error: `${permission} is not a 5.00 permission system name` });
      continue;
    }
    const excluded = PERMISSION_EXCLUSIONS.find((e) => e.roleSystemName === roleSystemName && e.permission === permission);
    if (excluded) {
      refused.push({
        permission, roleSystemName, messageKey: 'Iam.PermissionExcluded', message: resource('Iam.PermissionExcluded'), declaredBy: excluded.declaredBy,
      });
      continue;
    }
    const role = await roleRepo().getOneAsync((r) => r.systemName === roleSystemName);
    if (!role) { errors.push({ permission, roleSystemName, error: 'unknown role' }); continue; }
    const existing = await mappingRepo().getOneAsync((m) => m.systemName === permission && m.roleSystemName === roleSystemName);
    if (!existing) {
      await mappingRepo().insertAsync({
        permissionRecordId: record.id, customerRoleId: role.id, systemName: permission, roleSystemName, scope: null,
      });
    }
    applied.push({ permission, roleSystemName });
  }
  return {
    ok: errors.length === 0 && refused.length === 0,
    applied,
    errors,
    refused,
    mappingsBefore: before,
    mappingsAfter: (await mappingRepo().getAllAsync()).length,
  };
}

/** AC-IAM-007-04-05: the same refusal when an administrator saves it on the permission page. */
export async function savePermissionMappingAsync({ permission, roleSystemName, granted = true }) {
  const excluded = PERMISSION_EXCLUSIONS.find((e) => e.roleSystemName === roleSystemName && e.permission === permission);
  if (excluded && granted) {
    return {
      ok: false, messageKey: 'Iam.PermissionExcluded', message: resource('Iam.PermissionExcluded'), declaredBy: excluded.declaredBy, refusedBy: 'the IAM filter on Admin SecurityController.PermissionEditPopup',
    };
  }
  const record = await permissionRepo().getOneAsync((p) => p.systemName === permission);
  const role = await roleRepo().getOneAsync((r) => r.systemName === roleSystemName);
  if (!record || !role) return { ok: false, message: 'unknown permission or role' };
  const existing = await mappingRepo().getOneAsync((m) => m.systemName === permission && m.roleSystemName === roleSystemName);
  if (granted && !existing) {
    await mappingRepo().insertAsync({
      permissionRecordId: record.id, customerRoleId: role.id, systemName: permission, roleSystemName, scope: null,
    });
  }
  if (!granted && existing) await mappingRepo().deleteAsync(existing.id);
  return { ok: true, permission, roleSystemName, granted };
}

/* =========================================================== PRD-IAM-008 scopes ========= */

export const SCOPE_DIMENSIONS = ['store', 'region', 'outlet', 'category', 'value-band', 'time-window'];

export async function assignScopeAsync({
  customerId = null, roleSystemName = null, permissionSystemName, dimension, values,
  validFrom = null, validTo = null, actor = null,
}) {
  if (!SCOPE_DIMENSIONS.includes(dimension)) return { ok: false, message: `unknown scope dimension ${dimension}` };
  const row = await scopeRepo().insertAsync({
    customerId,
    roleSystemName,
    permissionSystemName,
    dimension,
    values: Array.isArray(values) ? values : [values],
    validFrom,
    validTo,
  });
  await auditAsync({
    event: 'AUD-IAM-006', area: 'IAM', feature: 'PRD-IAM-008', entity: 'ScopeAssignment', entityId: row.id, actor: actor ?? 'administrator', after: { dimension, values: row.values, permissionSystemName }, note: 'scope assigned',
  });
  return { ok: true, scope: row };
}

export const scopesForAsync = async (customer) => {
  const all = await scopeRepo().getAllAsync();
  return all.filter((s) => s.customerId === customer?.id
    || (s.roleSystemName && (customer?.roles ?? []).includes(s.roleSystemName)));
};

/**
 * The scope check that the admin query filtering and the single-record filter both use.
 * AC-IAM-008-01-02 to 02-01: outside the scope the answer is Iam.ScopeDenied, and the attempt is
 * audited (AUD-IAM-006).
 */
export async function checkScopeAsync({
  customer, permissionSystemName, dimension, value, amount = null, at = new Date(),
}) {
  const scopes = (await scopesForAsync(customer))
    .filter((s) => s.permissionSystemName === permissionSystemName);
  if (!scopes.length) return { allowed: true, unscoped: true };

  const timeWindows = scopes.filter((s) => s.dimension === 'time-window');
  for (const window of timeWindows) {
    const from = window.validFrom ? new Date(window.validFrom) : null;
    const to = window.validTo ? new Date(window.validTo) : null;
    const inside = (!from || at >= from) && (!to || at <= to);
    if (!inside) {
      await denyAsync({
        customer, permissionSystemName, dimension: 'time-window', value: at.toISOString(),
      });
      return {
        allowed: false, dimension: 'time-window', messageKey: 'Iam.ScopeDenied', message: resource('Iam.ScopeDenied'),
      };
    }
  }

  const band = scopes.find((s) => s.dimension === 'value-band');
  if (band && amount != null && Number(amount) > Number(band.values[0])) {
    await denyAsync({
      customer, permissionSystemName, dimension: 'value-band', value: amount,
    });
    return {
      allowed: false, dimension: 'value-band', limit: Number(band.values[0]), messageKey: 'Iam.ScopeDenied', message: resource('Iam.ScopeDenied'),
    };
  }

  if (dimension) {
    const forDimension = scopes.filter((s) => s.dimension === dimension);
    if (forDimension.length && !forDimension.some((s) => s.values.map(String).includes(String(value)))) {
      await denyAsync({
        customer, permissionSystemName, dimension, value,
      });
      return {
        allowed: false, dimension, allowedValues: forDimension.flatMap((s) => s.values), messageKey: 'Iam.ScopeDenied', message: resource('Iam.ScopeDenied'),
      };
    }
  }
  return { allowed: true, scopes: scopes.map((s) => ({ dimension: s.dimension, values: s.values })) };
}

async function denyAsync({
  customer, permissionSystemName, dimension, value,
}) {
  await auditAsync({
    event: 'AUD-IAM-006',
    area: 'IAM',
    feature: 'PRD-IAM-008',
    entity: 'Customer',
    entityId: customer?.id,
    actor: customer?.email ?? customer?.phone ?? 'unknown',
    outcome: 'rejected',
    after: { permissionSystemName, dimension, value },
    note: 'access refused by a scope',
  });
}

/** AC-IAM-008-01-01, 01-04, 01-06, 02-01: the list filter the admin queries apply. */
export async function filterByScopeAsync({
  customer, permissionSystemName, rows, keyOf,
}) {
  const scopes = (await scopesForAsync(customer)).filter((s) => s.permissionSystemName === permissionSystemName);
  if (!scopes.length) return { rows, filtered: false };
  const dimensional = scopes.filter((s) => ['store', 'region', 'outlet', 'category'].includes(s.dimension));
  if (!dimensional.length) return { rows, filtered: false };
  const kept = rows.filter((row) => dimensional.every((s) => {
    const value = keyOf(row, s.dimension);
    if (value === undefined || value === null) return false;
    return s.values.map(String).includes(String(value));
  }));
  return {
    rows: kept, filtered: true, dimensions: dimensional.map((s) => s.dimension), mechanism: 'admin query filtering (registered core modification)',
  };
}

/** IC-IAM-06 GetApprovalAuthority, read by ADM-006 (AC-IAM-008-01-07). */
export async function approvalAuthorityAsync(customer) {
  const scopes = (await scopesForAsync(customer)).filter((s) => s.dimension === 'value-band');
  const limit = scopes.length ? Math.max(...scopes.map((s) => Number(s.values[0]))) : null;
  const delegations = await activeDelegationsForAsync(customer);
  return {
    customerId: customer?.id ?? null,
    authorityLimit: limit,
    delegatedPermissions: delegations.map((d) => d.permissionSystemName),
    delegatedFrom: delegations.map((d) => d.delegatorEmail),
  };
}

/* ======================================================= PRD-IAM-009 delegation ========= */

export const delegablePermissionsAsync = (storeId = 1) => getSettingAsync('iam.delegablepermissions', storeId, [
  'Administration.Core.Approvals.Act', 'Orders.OrdersView', 'Customers.CustomersView',
]);

/** AC-IAM-009-01-01 and 01-02: only a permission the delegator holds, and marked delegable. */
export async function delegateAsync({
  delegator, delegateEmail, permissionSystemName, startUtc, endUtc, reason = null, storeId = 1,
}) {
  const delegable = await delegablePermissionsAsync(storeId);
  if (!delegable.includes(permissionSystemName)) {
    return {
      ok: false, messageKey: 'Iam.DelegationNotAllowed', message: resource('Iam.DelegationNotAllowed'), reasonCode: 'not-delegable',
    };
  }
  if (!await authorizeAsync(permissionSystemName, delegator)) {
    return {
      ok: false, messageKey: 'Iam.DelegationNotAllowed', message: resource('Iam.DelegationNotAllowed'), reasonCode: 'the delegator does not hold it',
    };
  }
  const delegate = await customerRepo().getOneAsync((c) => c.email === delegateEmail && !c.deleted);
  if (!delegate) return { ok: false, message: 'unknown delegate' };
  const existing = await delegationRepo().getOneAsync((d) => d.delegateId === delegate.id
    && d.permissionSystemName === permissionSystemName && ['Scheduled', 'Active'].includes(d.status));
  if (existing?.delegatedFromDelegation) {
    return {
      ok: false, messageKey: 'Iam.DelegationNotAllowed', message: resource('Iam.DelegationNotAllowed'), reasonCode: 'a delegated permission cannot be delegated again',
    };
  }
  const now = Date.now();
  const row = await delegationRepo().insertAsync({
    delegatorId: delegator.id,
    delegatorEmail: delegator.email,
    delegateId: delegate.id,
    delegateEmail,
    permissionSystemName,
    startUtc,
    endUtc,
    reason,
    status: new Date(startUtc).getTime() <= now ? 'Active' : 'Scheduled',
  });
  await auditAsync({
    event: 'AUD-IAM-007',
    area: 'IAM',
    feature: 'PRD-IAM-009',
    entity: 'Delegation',
    entityId: row.id,
    actor: delegator.email,
    after: {
      delegator: delegator.email, delegate: delegateEmail, permission: permissionSystemName, startUtc, endUtc,
    },
    note: 'delegation created',
  });
  return { ok: true, delegation: row };
}

/** SM-IAM-08: the status follows the dates with no manual step. */
export async function activeDelegationsForAsync(customer, at = new Date()) {
  const rows = await delegationRepo().getAllAsync((d) => d.delegateId === customer?.id);
  const active = [];
  for (const d of rows) {
    const started = new Date(d.startUtc).getTime() <= at.getTime();
    const ended = d.endUtc && new Date(d.endUtc).getTime() < at.getTime();
    if (d.status === 'Revoked') continue;
    if (ended && d.status !== 'Ended') {
      await delegationRepo().updateAsync({ ...d, status: 'Ended' });
      await auditAsync({
        event: 'AUD-IAM-007', area: 'IAM', feature: 'PRD-IAM-009', entity: 'Delegation', entityId: d.id, actor: 'system', after: { status: 'Ended' }, note: 'delegation ended',
      });
      continue;
    }
    if (started && !ended) {
      if (d.status === 'Scheduled') await delegationRepo().updateAsync({ ...d, status: 'Active' });
      active.push(d);
    }
  }
  return active;
}

/** The permission check with delegations, used by the IAM IPermissionService override. */
export async function authorizeWithDelegationAsync(permissionSystemName, customer, at = new Date()) {
  if (await authorizeAsync(permissionSystemName, customer)) {
    return { allowed: true, via: 'role' };
  }
  const delegations = await activeDelegationsForAsync(customer, at);
  const match = delegations.find((d) => d.permissionSystemName === permissionSystemName);
  if (match) {
    return {
      allowed: true, via: 'delegation', onBehalfOf: match.delegatorEmail, delegationId: match.id,
    };
  }
  return { allowed: false };
}

export async function revokeDelegationAsync({ id, by }) {
  const row = await delegationRepo().getByIdAsync(id);
  if (!row) return { ok: false, message: 'unknown delegation' };
  const updated = await delegationRepo().updateAsync({ ...row, status: 'Revoked', revokedBy: by });
  await auditAsync({
    event: 'AUD-IAM-007', area: 'IAM', feature: 'PRD-IAM-009', entity: 'Delegation', entityId: id, actor: by ?? 'administrator', after: { status: 'Revoked' }, note: 'delegation revoked',
  });
  return { ok: true, delegation: updated };
}

export const delegationsAsync = () => delegationRepo().getAllAsync();

/* ============================================ PRD-IAM-011 invitations and reviews ======= */

const hash = (value) => createHash('sha256').update(String(value)).digest('hex');

/** AC-IAM-011-01-01: a single-use link, valid for the configured days; no customer record yet. */
export async function inviteAsync({
  email, roleSystemNames = [], invitedBy, storeId = 1, gateways = messageGateways,
}) {
  const days = Number(await getSettingAsync('iam.invitationvaliditydays', storeId, 7));
  const token = randomUUID();
  const row = await invitationRepo().insertAsync({
    email,
    roleSystemNames,
    tokenHash: hash(token),
    status: 'Sent',
    invitedBy,
    createdOnUtc: new Date().toISOString(),
    expiresOnUtc: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
    customerId: null,
  });
  try {
    await sendAsync({
      event: 'Iam.Invitation.Email',
      to: email,
      channels: ['email'],
      tokens: { link: `/invitation/${token}`, roles: roleSystemNames.join(', ') },
      storeId,
      feature: 'PRD-IAM-011',
      gateways,
    });
  } catch { /* the invitation stands even if the email fails */ }
  const customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
  return {
    ok: true,
    invitation: { ...row, tokenHash: undefined },
    token,
    validDays: days,
    messageKey: 'Iam.Invitation',
    message: resource('Iam.Invitation'),
    customerRecordExists: Boolean(customer),
  };
}

/**
 * AC-IAM-011-01-02: the invitee sets a password that meets IAM-003, sets up MFA where a role
 * requires it, accepts the current terms, and the account is created with the invited roles.
 * AC-IAM-011-01-03: an expired, revoked or used link creates nothing (Iam.InvitationExpired).
 */
export async function acceptInvitationAsync({
  token, password, firstName = null, lastName = null, acceptTerms = true, storeId = 1,
}) {
  const invitation = await invitationRepo().getOneAsync((i) => i.tokenHash === hash(token));
  if (!invitation || invitation.status !== 'Sent' || new Date(invitation.expiresOnUtc).getTime() < Date.now()) {
    if (invitation && invitation.status === 'Sent') await invitationRepo().updateAsync({ ...invitation, status: 'Expired' });
    return {
      ok: false, messageKey: 'Iam.InvitationExpired', message: resource('Iam.InvitationExpired'), accountCreated: false,
    };
  }
  const { validatePasswordAsync, setPasswordAsync } = await import('./passwords.js');
  const policy = await validatePasswordAsync({ password, storeId });
  if (!policy.ok) return { ok: false, passwordErrors: policy.errors, accountCreated: false };

  const customer = await customerRepo().insertAsync({
    email: invitation.email,
    firstName,
    lastName,
    roles: ['Registered', ...invitation.roleSystemNames],
    active: true,
    deleted: false,
    accountState: 'Active',
    invitedBy: invitation.invitedBy,
    createdOnUtc: new Date().toISOString(),
  });
  await setPasswordAsync({
    customer, password, storeId, reason: 'set from an invitation',
  });

  const { mfaRequiredForAsync } = await import('./mfa.js');
  const mfa = await mfaRequiredForAsync(customer, storeId);
  let acceptance = null;
  if (acceptTerms) {
    const { recordAcceptanceAsync } = await import('./privacy.js');
    acceptance = await recordAcceptanceAsync({
      customerId: customer.id, policySystemName: 'ConditionsOfUse', channel: 'invitation', storeId,
    });
  }
  const accepted = await invitationRepo().updateAsync({
    ...invitation, status: 'Accepted', customerId: customer.id, acceptedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-017', area: 'IAM', feature: 'PRD-IAM-011', entity: 'Invitation', entityId: invitation.id, actor: invitation.email, after: { status: 'Accepted', roles: customer.roles }, note: 'invitation accepted',
  });
  return {
    ok: true,
    accountCreated: true,
    customer: { ...customer, password: undefined },
    invitation: { ...accepted, tokenHash: undefined },
    mfaSetUpRequired: mfa.requiredByRole && !mfa.providerSelected,
    termsAccepted: Boolean(acceptance),
  };
}

export async function revokeInvitationAsync({ id, by }) {
  const invitation = await invitationRepo().getByIdAsync(id);
  if (!invitation) return { ok: false, message: 'unknown invitation' };
  return { ok: true, invitation: await invitationRepo().updateAsync({ ...invitation, status: 'Revoked', revokedBy: by }) };
}

export const invitationsAsync = async () => (await invitationRepo().getAllAsync())
  .map(({ tokenHash, ...rest }) => rest);

/** AC-IAM-011-02-01: a campaign per set of roles, with a reviewer for each role. */
export async function openCampaignAsync({
  name, roles, reviewers, deadlineUtc, openedBy,
}) {
  const campaign = await campaignRepo().insertAsync({
    name, roles, reviewers, deadlineUtc, status: 'Open', openedBy, openedOnUtc: new Date().toISOString(),
  });
  const customers = await customerRepo().getAllAsync((c) => !c.deleted);
  const items = [];
  for (const role of roles) {
    for (const customer of customers.filter((c) => (c.roles ?? []).includes(role))) {
      items.push(await reviewItemRepo().insertAsync({
        campaignId: campaign.id,
        customerId: customer.id,
        customerEmail: customer.email,
        roleSystemName: role,
        reviewerEmail: reviewers[role] ?? reviewers.default ?? null,
        decision: null,
        status: 'Pending',
      }));
    }
  }
  return { ok: true, campaign, items };
}

export async function reviewItemsForAsync(reviewerEmail) {
  return reviewItemRepo().getAllAsync((i) => i.reviewerEmail === reviewerEmail);
}

export async function decideReviewItemAsync({ itemId, decision, by }) {
  const item = await reviewItemRepo().getByIdAsync(itemId);
  if (!item) return { ok: false, message: 'unknown review item' };
  if (!['Keep', 'Revoke'].includes(decision)) return { ok: false, message: 'the decision is Keep or Revoke' };
  let roleRemoved = false;
  if (decision === 'Revoke') {
    const customer = await customerRepo().getByIdAsync(item.customerId);
    await customerRepo().updateAsync({
      ...customer, roles: (customer.roles ?? []).filter((r) => r !== item.roleSystemName),
    });
    roleRemoved = true;
  }
  const updated = await reviewItemRepo().updateAsync({
    ...item, decision, status: decision === 'Keep' ? 'Kept' : 'Revoked', decidedBy: by, decidedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-009', area: 'IAM', feature: 'PRD-IAM-011', entity: 'AccessReviewItem', entityId: itemId, actor: by, after: { decision, roleRemoved }, note: `access review: ${decision}`,
  });
  return { ok: true, item: updated, roleRemoved };
}

/** AC-IAM-011-02-02: the deadline task marks undecided items Overdue and removes no role. */
export async function runCampaignDeadlineTaskAsync() {
  const campaigns = await campaignRepo().getAllAsync((c) => c.status === 'Open');
  const overdue = [];
  for (const campaign of campaigns) {
    if (new Date(campaign.deadlineUtc).getTime() > Date.now()) continue;
    const items = await reviewItemRepo().getAllAsync((i) => i.campaignId === campaign.id && i.status === 'Pending');
    for (const item of items) {
      overdue.push(await reviewItemRepo().updateAsync({ ...item, status: 'Overdue' }));
    }
  }
  return { overdue, rolesRemoved: 0, listedToAdministrators: overdue.length };
}

export const campaignsAsync = async () => {
  const campaigns = await campaignRepo().getAllAsync();
  const items = await reviewItemRepo().getAllAsync();
  return campaigns.map((c) => ({ ...c, items: items.filter((i) => i.campaignId === c.id) }));
};

/** AC-IAM-011-03-01 and 03-02: the access audit report. */
export async function accessReportAsync({ privilegedOnly = false, storeId = 1 } = {}) {
  const privilegedList = await getSettingAsync('iam.privilegedpermissions', storeId, [
    'Security.AccessAdminPanel', 'Customers.CustomersCreateEditDelete', 'Configuration.ManageACL',
    'Identity.Core.Sessions.CreateEditDelete',
  ]);
  const customers = await customerRepo().getAllAsync((c) => !c.deleted);
  const mappings = await mappingRepo().getAllAsync();
  const { mfaRequiredForAsync } = await import('./mfa.js');

  const rows = [];
  for (const customer of customers) {
    const permissions = [...new Set(mappings
      .filter((m) => (customer.roles ?? []).includes(m.roleSystemName))
      .map((m) => m.systemName))];
    const privileged = permissions.some((p) => privilegedList.includes(p));
    const mfa = await mfaRequiredForAsync(customer, storeId);
    rows.push({
      email: customer.email ?? customer.phone,
      roles: customer.roles ?? [],
      privileged,
      mfaStatus: mfa.providerSelected ? `provider selected (${mfa.provider})` : mfa.requiredByRole ? 'required but not set up' : 'none',
      lastLoginDateUtc: customer.lastLoginDateUtc ?? null,
      active: customer.active !== false,
    });
  }
  const filtered = privilegedOnly ? rows.filter((r) => r.privileged) : rows;
  return {
    rows: filtered,
    privilegedDefinition: privilegedList,
    exports: ['CSV', 'XLSX'],
    csv: ['email,roles,privileged,mfaStatus,lastLogin,active',
      ...filtered.map((r) => [r.email, `"${r.roles.join(' ')}"`, r.privileged, `"${r.mfaStatus}"`, r.lastLoginDateUtc ?? '', r.active].join(','))].join('\n'),
  };
}
