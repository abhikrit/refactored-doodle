// PRD-IAM-005 Single sign-on for staff and B2B buyers.
//
// The native IExternalAuthenticationMethod framework with an ExternalAuthenticationRecord per
// user. Staff accounts are not created by sign-in alone (Proposed); they arrive through the
// provisioning messages of IC-IAM-04. BR-IAM-141: the feature checks IC-PLT-02 IsEnabled for the
// store before it shows anything.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';

const recordRepo = () => repository('ExternalAuthenticationRecord');
const customerRepo = () => repository('Customer');
const errorRepo = () => repository('Log');

export const providersAsync = (storeId = 1) => getSettingAsync('iam.identityproviders', storeId, [
  {
    systemName: 'ExternalAuth.OpenIdConnect', name: 'Staff directory (OpenID Connect)', protocol: 'OpenID Connect', active: true, assertsMfa: true,
  },
  {
    systemName: 'ExternalAuth.Saml2', name: 'Partner directory (SAML 2.0)', protocol: 'SAML 2.0', active: true, assertsMfa: false,
  },
]);

export const groupRoleMapAsync = (storeId = 1) => getSettingAsync('iam.ssogrouprolemap', storeId, {
  'post-finance': ['Finance'],
  'post-operations': ['Operations'],
  'post-admins': ['Administrators'],
});

/**
 * AC-IAM-005-01-01: the user is matched through ExternalAuthenticationRecord or a verified email
 * and signed in; sign-in alone never creates a staff account.
 * AC-IAM-005-01-03: an MFA-required role needs the provider to assert a multi-factor method.
 * AC-IAM-005-03-01: a company with its own provider links the member to that company.
 */
export async function signInExternalAsync({
  providerSystemName, externalIdentifier, email = null, mfaAsserted = false, companyId = null,
  error = null, storeId = 1,
}) {
  const providers = await providersAsync(storeId);
  const provider = providers.find((p) => p.systemName === providerSystemName && p.active !== false);
  if (!provider) return { ok: false, message: `${providerSystemName} is not an active identity provider.` };

  // AC-IAM-005-01-02: the native error flow, logged when LogErrors is on
  if (error) {
    const logErrors = await getSettingAsync('externalauthenticationsettings.logerrors', storeId, true);
    if (logErrors === true) {
      await errorRepo().insertAsync({
        logLevel: 'Error',
        shortMessage: `External authentication error (${providerSystemName})`,
        fullMessage: String(error),
        createdOnUtc: new Date().toISOString(),
      });
    }
    return {
      ok: false, externalError: true, logged: logErrors === true, nativeFlow: 'ExternalAuthenticationError', message: String(error),
    };
  }

  const record = await recordRepo().getOneAsync((r) => r.providerSystemName === providerSystemName
    && r.externalIdentifier === externalIdentifier);
  let customer = record ? await customerRepo().getByIdAsync(record.customerId) : null;
  if (!customer && email) {
    customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted && c.emailVerified !== false);
  }
  if (!customer) {
    return {
      ok: false,
      accountCreated: false,
      message: 'No account matches this sign-in. Staff accounts are created by provisioning, not by signing in.',
    };
  }

  const { mfaRequiredForAsync } = await import('./mfa.js');
  const mfa = await mfaRequiredForAsync(customer, storeId);
  if (mfa.requiredByRole && !(mfaAsserted && provider.assertsMfa)) {
    return {
      ok: false,
      secondFactorRequired: true,
      reason: 'the identity provider did not assert a multi-factor method',
      provider: provider.systemName,
      customerId: customer.id,
    };
  }

  if (!record) {
    await recordRepo().insertAsync({
      customerId: customer.id, providerSystemName, externalIdentifier, email, createdOnUtc: new Date().toISOString(),
    });
  }
  if (companyId) {
    const member = await repository('CompanyMember').getOneAsync((m) => m.companyId === companyId && m.customerId === customer.id);
    if (!member) {
      await repository('CompanyMember').insertAsync({
        companyId, customerId: customer.id, companyRole: 'buyer', linkedBy: providerSystemName,
      });
    }
  }
  await auditAsync({
    event: 'AUD-IAM-001', area: 'IAM', feature: 'PRD-IAM-005', entity: 'Customer', entityId: customer.id, actor: email ?? externalIdentifier, note: `signed in through ${providerSystemName}`,
  });
  return {
    ok: true,
    customer: { ...customer, password: undefined },
    provider: provider.systemName,
    matchedBy: record ? 'ExternalAuthenticationRecord' : 'verified email',
    companyId: companyId ?? null,
  };
}

/**
 * IC-IAM-04 provisioning.
 * AC-IAM-005-02-01: "deactivate user" sets the customer inactive and RequireReLogin, so open
 * sessions end. AC-IAM-005-02-02: "create user" maps groups to roles.
 */
export async function provisionAsync({
  action, email, groups = [], firstName = null, lastName = null, storeId = 1,
}) {
  if (action === 'deactivate') {
    const customer = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
    if (!customer) return { ok: false, message: 'no such account' };
    await customerRepo().updateAsync({
      ...customer, active: false, accountState: 'DeactivatedByStaff', requireReLogin: true,
    });
    const { forceLogoutAsync } = await import('./sessions.js');
    const logout = await forceLogoutAsync({ customerId: customer.id, by: 'identity provider', reason: 'deactivated by the identity provider' });
    await auditAsync({
      event: 'AUD-IAM-008', area: 'IAM', feature: 'PRD-IAM-005', entity: 'Customer', entityId: customer.id, actor: 'identity provider', after: { active: false, requireReLogin: true }, note: 'deactivated by a provisioning message',
    });
    return {
      ok: true, action, active: false, sessionsRevoked: logout.revoked, requireReLogin: true,
    };
  }
  if (action === 'create') {
    const map = await groupRoleMapAsync(storeId);
    const roles = [...new Set(groups.flatMap((g) => map[g] ?? []))];
    const existing = await customerRepo().getOneAsync((c) => c.email === email && !c.deleted);
    const row = {
      email,
      firstName,
      lastName,
      roles: roles.length ? roles : ['Registered'],
      active: true,
      deleted: false,
      accountState: 'Active',
      provisionedBy: 'identity provider',
      emailVerified: true,
      createdOnUtc: new Date().toISOString(),
    };
    const customer = existing
      ? await customerRepo().updateAsync({ ...existing, ...row })
      : await customerRepo().insertAsync(row);
    await auditAsync({
      event: 'AUD-IAM-001', area: 'IAM', feature: 'PRD-IAM-005', entity: 'Customer', entityId: customer.id, actor: 'identity provider', after: { roles: customer.roles }, note: 'created by a provisioning message',
    });
    return {
      ok: true, action, customer: { ...customer, password: undefined }, rolesFromGroups: roles, groups,
    };
  }
  return { ok: false, message: `unknown provisioning action ${action}` };
}

export const externalRecordsAsync = () => recordRepo().getAllAsync();
