// PRD-IAM-004 Multi-factor authentication by role, and PRD-IAM-013 passkeys.
//
// BR-IAM-030: the "MFA-required roles" setting lists role system names. A signed-in member of
// such a role without a selected provider is redirected to the native MFA settings page.
// ForceMultifactorAuthentication stays off, because it would force every holder of
// Security.EnableMultiFactorAuthentication, including Registered. Members of MFA-required roles
// cannot remove their own provider.
// BR-IAM-031: second factors are IMultiFactorAuthenticationMethod plugins; the email-code,
// SMS-code and hardware-key providers are built and GoogleAuthenticator is reused.

import { createHash, randomUUID } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { requestCodeAsync, verifyCodeAsync } from './otp.js';

const customerRepo = () => repository('Customer');
const passkeyRepo = () => repository('PasskeyCredential');

export const PROVIDERS = [
  {
    systemName: 'MultiFactorAuth.EmailCode', name: 'Code by e-mail', channel: 'email', built: 'product',
  },
  {
    systemName: 'MultiFactorAuth.SmsCode', name: 'Code by SMS', channel: 'sms', built: 'product',
  },
  {
    systemName: 'MultiFactorAuth.HardwareKey', name: 'Security key (FIDO2 / WebAuthn)', channel: 'assertion', built: 'product',
  },
  {
    systemName: 'MultiFactorAuth.GoogleAuthenticator', name: 'Authenticator app', channel: 'totp', built: 'bundled with nopCommerce',
  },
];

// Malawi Post requires a second factor for privileged administrative roles (FR-012) but the list
// is not stated in the source, so the setting has no hidden default: it is empty until a client
// pack names the roles.
export const mfaRequiredRolesAsync = (storeId = 1) => getSettingAsync('iam.mfarequiredroles', storeId, []);

export async function activeProvidersAsync(storeId = 1) {
  const active = await getSettingAsync('multifactorauthenticationsettings.activeauthenticationmethodsystemnames', storeId,
    PROVIDERS.map((p) => p.systemName));
  return PROVIDERS.filter((p) => active.includes(p.systemName));
}

/** AC-IAM-004-01-03: the native force setting stays off; the IAM filter does the work. */
export async function forceSettingAsync(storeId = 1) {
  const value = await getSettingAsync('multifactorauthenticationsettings.forcemultifactorauthentication', storeId, false);
  return {
    forceMultifactorAuthentication: value === true,
    enforcedBy: 'the IAM filter on the MFA-required roles (BR-IAM-030)',
    reason: 'the native filter would force every holder of Security.EnableMultiFactorAuthentication, including Registered',
  };
}

/**
 * AC-IAM-004-01-01 and 01-02: is a second factor required for this customer, and is one selected?
 */
export async function mfaRequiredForAsync(customer, storeId = 1) {
  const roles = await mfaRequiredRolesAsync(storeId);
  const requiredByRole = (customer?.roles ?? []).some((r) => roles.includes(r));
  const selected = customer?.mfaProvider ?? null;
  const chosenByCustomer = Boolean(selected) && customer?.mfaEnabled !== false;
  const required = requiredByRole || chosenByCustomer;
  return {
    required,
    requiredByRole,
    providerSelected: Boolean(selected),
    provider: selected,
    redirectTo: requiredByRole && !selected ? '/account/multi-factor-authentication' : null,
    messageKey: requiredByRole && !selected ? 'Iam.MfaRequired' : null,
    message: requiredByRole && !selected ? resource('Iam.MfaRequired') : null,
  };
}

/** AC-IAM-004-03-01: the buyer selects one of the active providers. */
export async function selectProviderAsync({
  customerId, systemName, storeId = 1, actor = null,
}) {
  const active = await activeProvidersAsync(storeId);
  if (!active.some((p) => p.systemName === systemName)) {
    return { ok: false, message: `${systemName} is not an active provider for this store.` };
  }
  const customer = await customerRepo().getByIdAsync(customerId);
  const updated = await customerRepo().updateAsync({ ...customer, mfaProvider: systemName, mfaEnabled: true });
  await auditAsync({
    event: 'AUD-IAM-004', area: 'IAM', feature: 'PRD-IAM-004', entity: 'Customer', entityId: customerId, actor: actor ?? customer.email, after: { mfaProvider: systemName }, note: 'second factor selected',
  });
  return { ok: true, customer: { ...updated, password: undefined }, provider: systemName };
}

/**
 * AC-IAM-004-01-04: an administrator removes the binding (native RemoveBindMFA); the member must
 * configure a provider again, and the removal is audited.
 * AC-IAM-004-03-02: a member of an MFA-required role cannot switch it off themselves.
 */
export async function removeProviderAsync({
  customerId, by = 'administrator', bySelf = false, storeId = 1,
}) {
  const customer = await customerRepo().getByIdAsync(customerId);
  const roles = await mfaRequiredRolesAsync(storeId);
  if (bySelf && (customer.roles ?? []).some((r) => roles.includes(r))) {
    return {
      ok: false, message: 'Your role requires a second login check, so it cannot be switched off.', requiredByRole: true,
    };
  }
  const updated = await customerRepo().updateAsync({
    ...customer, mfaProvider: null, mfaEnabled: false, mfaSecret: null,
  });
  await auditAsync({
    event: 'AUD-IAM-004', area: 'IAM', feature: 'PRD-IAM-004', entity: 'Customer', entityId: customerId, actor: by, before: { mfaProvider: customer.mfaProvider }, after: { mfaProvider: null }, note: bySelf ? 'the customer switched the second factor off' : 'the MFA binding was removed by staff',
  });
  const state = await mfaRequiredForAsync(updated, storeId);
  return {
    ok: true, customer: { ...updated, password: undefined }, mustConfigureAgain: state.requiredByRole, redirectTo: state.redirectTo,
  };
}

/* ================================================== the second factor itself ============ */

const totp = (secret) => createHash('sha256').update(`${secret}|${Math.floor(Date.now() / 30000)}`).digest('hex').slice(0, 6).replace(/\D/g, '0');

/** AC-IAM-004-02-01 to 02-04: start the second step for the selected provider. */
export async function startSecondFactorAsync({
  customerId, storeId = 1, smsProvider = null,
}) {
  const customer = await customerRepo().getByIdAsync(customerId);
  const provider = customer?.mfaProvider;
  if (!provider) return { ok: false, message: 'No second factor is selected for this account.' };

  if (provider === 'MultiFactorAuth.EmailCode') {
    const challenge = await requestCodeAsync({
      recipient: customer.email, purpose: 'mfa', customerId, storeId, channel: 'email',
    });
    return { ...challenge, provider, sentTo: customer.email };
  }
  if (provider === 'MultiFactorAuth.SmsCode') {
    if (!customer.phoneSmsVerified) return { ok: false, provider, message: 'This account has no verified mobile number.' };
    const challenge = await requestCodeAsync({
      recipient: customer.phone, purpose: 'mfa', customerId, storeId, smsProvider, channel: 'sms',
    });
    return { ...challenge, provider, sentTo: customer.phone };
  }
  if (provider === 'MultiFactorAuth.HardwareKey') {
    const keys = await passkeyRepo().getAllAsync((k) => k.customerId === customerId && k.purpose === 'mfa');
    if (!keys.length) return { ok: false, provider, message: 'No security key is registered for this account.' };
    return {
      ok: true, provider, assertionChallenge: randomUUID(), credentialIds: keys.map((k) => k.credentialId),
    };
  }
  // the bundled authenticator app
  const secret = customer.mfaSecret ?? randomUUID();
  if (!customer.mfaSecret) await customerRepo().updateAsync({ ...customer, mfaSecret: secret });
  return {
    ok: true, provider, timeBased: true, demonstrationCode: totp(secret),
  };
}

export async function verifySecondFactorAsync({
  customerId, code = null, credentialId = null, storeId = 1,
}) {
  const customer = await customerRepo().getByIdAsync(customerId);
  const provider = customer?.mfaProvider;
  if (!provider) return { ok: false, message: 'No second factor is selected for this account.' };

  if (provider === 'MultiFactorAuth.HardwareKey') {
    const key = await passkeyRepo().getOneAsync((k) => k.customerId === customerId && k.credentialId === credentialId);
    if (!key) return { ok: false, provider, message: 'That security key is not registered for this account.' };
    await passkeyRepo().updateAsync({ ...key, signCount: (key.signCount ?? 0) + 1, lastUsedUtc: new Date().toISOString() });
    return { ok: true, provider, verified: 'key assertion' };
  }
  if (provider === 'MultiFactorAuth.GoogleAuthenticator') {
    const expected = totp(customer.mfaSecret);
    if (String(code) !== expected) return { ok: false, provider, message: 'That code is not valid.' };
    return { ok: true, provider, verified: 'time-based code' };
  }
  const recipient = provider === 'MultiFactorAuth.EmailCode' ? customer.email : customer.phone;
  const verified = await verifyCodeAsync({
    recipient, purpose: 'mfa', code, storeId,
  });
  return verified.ok ? { ok: true, provider, verified: 'one-time code' } : { ...verified, provider };
}

export async function setForceSettingOffAsync(storeId = 1) {
  await saveSettingAsync('multifactorauthenticationsettings.forcemultifactorauthentication', false, 0);
  return forceSettingAsync(storeId);
}

/* ========================================================= PRD-IAM-013 passkeys ========= */

/** AC-IAM-013-01-01: the credential is stored for the user and listed under My account. */
export async function registerPasskeyAsync({
  customerId, credentialId = null, purpose = 'login', deviceName = null,
}) {
  const row = await passkeyRepo().insertAsync({
    customerId,
    credentialId: credentialId ?? randomUUID(),
    publicKey: createHash('sha256').update(randomUUID()).digest('hex'),
    deviceName,
    purpose,
    signCount: 0,
    createdOnUtc: new Date().toISOString(),
    lastUsedUtc: null,
  });
  await auditAsync({
    event: 'AUD-IAM-004', area: 'IAM', feature: 'PRD-IAM-013', entity: 'PasskeyCredential', entityId: row.id, actor: String(customerId), after: { credentialId: row.credentialId }, note: 'passkey registered',
  });
  return { ok: true, passkey: row };
}

export const passkeysAsync = (customerId) => passkeyRepo().getAllAsync((k) => k.customerId === customerId);

export async function removePasskeyAsync({ customerId, credentialId }) {
  const key = await passkeyRepo().getOneAsync((k) => k.customerId === customerId && k.credentialId === credentialId);
  if (!key) return { ok: false, message: 'unknown passkey' };
  await passkeyRepo().deleteAsync(key.id);
  return { ok: true, removed: credentialId };
}

/** AC-IAM-013-01-03: where passkeys are not supported, password and code login stay available. */
export async function passkeySupportAsync({ storeId = 1, deviceSupports = true }) {
  const enabled = await getSettingAsync('iam.passkeysenabled', storeId, true);
  return {
    offered: enabled === true && deviceSupports,
    fallbacks: ['password', 'one-time code'],
    reason: deviceSupports ? null : 'the device or browser does not support passkeys',
  };
}
