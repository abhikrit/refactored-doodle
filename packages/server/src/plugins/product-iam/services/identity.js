// IAM - sign-in, the mobile-number OTP identity and the session the prototype acts in.
//
// IAM-001 registration and login (Configuration), IAM-002 mobile-number identity with OTP
// (ISmsProvider + DI override; OtpSettings.LoginByPhoneEnabled in 5.00), IAM-026 assisted
// service by outlet agents (the single impersonation filter, decision SINGLE-FILTER).
//
// This is a prototype: passwords are not hashed and nothing here is a security control. The
// seeded accounts all use the password "demo" and are marked synthetic (P-5).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { sendAsync, resource } from '../../../core/messages.js';
import { messageGateways } from '@product/mocks';

const sessions = new Map(); // sessionId -> { customerId, actingFor, agentOutlet }
const otps = new Map(); // phone -> { code, expires }

export async function customersAsync() {
  return repository('Customer').getAllAsync((c) => !c.deleted);
}

/**
 * AC-IAM-001-02-01 / 02-02, AC-IAM-001-04-01 and the IAM-003 lockout.
 * The native messages are used unchanged: Account.Login.WrongCredentials,
 * .NotActive and .LockedOut.
 */
export async function signInAsync({
  sessionId, email, password = 'demo', storeId = 1, ipAddress = null, userAgent = null,
}) {
  const {
    lockoutState, recordFailedLoginAsync, passwordExpiredAsync, verifyPasswordAsync,
  } = await import('./passwords.js');
  const customer = await repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

  if (!customer) {
    await auditAsync({
      event: 'AUD-IAM-012-02', area: 'IAM', feature: 'PRD-IAM-012', entity: 'Customer', entityId: email, actor: email, outcome: 'rejected', note: 'failed sign-in: no such account',
    });
    return { ok: false, messageKey: 'Account.Login.WrongCredentials', message: 'The credentials provided are incorrect' };
  }

  const lock = lockoutState(customer);
  if (lock.lockedOut) {
    return {
      ok: false, lockedOut: true, until: lock.until, messageKey: 'Account.Login.WrongCredentials.LockedOut', message: 'The account is locked out',
    };
  }

  if (!await verifyPasswordAsync(customer, password)) {
    const failed = await recordFailedLoginAsync({ customer, storeId });
    await auditAsync({
      event: 'AUD-IAM-012-02', area: 'IAM', feature: 'PRD-IAM-012', entity: 'Customer', entityId: customer.id, actor: email, outcome: 'rejected', note: `failed sign-in (attempt ${failed.attempts})`,
    });
    // AC-IAM-012-01-02: the failure is an authentication event too, which is what the
    // failed-login detection rule of AC-IAM-012-02-01 counts
    const { recordAuthEventAsync: recordFailure } = await import('./auth-events.js').catch(() => ({ recordAuthEventAsync: null }));
    if (recordFailure) {
      await recordFailure({
        customerId: customer.id, identifierTried: email, type: 'login', outcome: 'failed', channel: 'password', ipAddress, userAgent, storeId,
      });
    }
    return {
      ok: false,
      messageKey: failed.lockedOut ? 'Account.Login.WrongCredentials.LockedOut' : 'Account.Login.WrongCredentials',
      message: failed.lockedOut ? 'The account is locked out' : 'The credentials provided are incorrect',
      failedLoginAttempts: failed.attempts,
      lockedOut: failed.lockedOut,
    };
  }

  // AC-IAM-001-04-01 and 04-02: an account awaiting validation or approval cannot sign in.
  // AC-IAM-010-02-01 and 04-01: a deactivated account gets the same native NotActive result; the
  // extra fields only tell the storefront whether self-reactivation is open (AC-IAM-010-04-02).
  if (customer.active === false) {
    const deactivated = String(customer.accountState ?? '').startsWith('Deactivated');
    return {
      ok: false,
      notActive: true,
      deactivated,
      selfReactivationAllowed: customer.accountState === 'DeactivatedByUser',
      messageKey: 'Account.Login.WrongCredentials.NotActive',
      message: deactivated
        ? resource('Iam.AccountDeactivated')
        : 'The account is not active',
      accountState: customer.accountState ?? 'Inactive',
    };
  }

  const signedIn = await completeSignInAsync({
    sessionId, customer, storeId, ipAddress, userAgent, channel: 'password',
  });
  const expired = await passwordExpiredAsync(customer, storeId);
  return { ...signedIn, passwordExpired: expired.expired, redirectTo: expired.expired ? expired.redirectTo : null };
}

/**
 * The part both routes share: the session, LastLoginDateUtc, the authentication event and the
 * second-factor step when the role requires one (IAM-004, IAM-006, IAM-012).
 */
export async function completeSignInAsync({
  sessionId, customer, storeId = 1, ipAddress = null, userAgent = null, channel = 'password',
  secondFactorDone = false,
}) {
  const { mfaRequiredForAsync } = await import('./mfa.js').catch(() => ({ mfaRequiredForAsync: null }));
  const { openSessionAsync } = await import('./sessions.js').catch(() => ({ openSessionAsync: null }));
  const { recordAuthEventAsync } = await import('./auth-events.js').catch(() => ({ recordAuthEventAsync: null }));

  const mfa = mfaRequiredForAsync ? await mfaRequiredForAsync(customer, storeId) : { required: false };
  if (mfa.required && !secondFactorDone) {
    return {
      ok: false,
      secondFactorRequired: true,
      messageKey: mfa.providerSelected ? 'Account.MultiFactorAuthentication.Verify' : 'Iam.MfaRequired',
      message: mfa.providerSelected ? 'Enter the code from your second factor.' : resource('Iam.MfaRequired'),
      provider: mfa.provider ?? null,
      setUpRequired: !mfa.providerSelected,
      customerId: customer.id,
    };
  }

  const updated = await repository('Customer').updateAsync({
    ...customer,
    lastLoginDateUtc: new Date().toISOString(),
    lastActivityUtc: new Date().toISOString(),
    failedLoginAttempts: 0,
    requireReLogin: false,
    lastIpAddress: ipAddress ?? customer.lastIpAddress ?? null,
  });

  let session = null;
  if (openSessionAsync) {
    const opened = await openSessionAsync({
      sessionId, customer: updated, ipAddress, userAgent, storeId,
    });
    if (opened.ok === false) return opened;
    session = opened.session;
  }
  sessions.set(sessionId, { customerId: updated.id, userSessionId: session?.sessionId ?? null });

  if (recordAuthEventAsync) {
    await recordAuthEventAsync({
      customerId: updated.id, identifierTried: updated.email ?? updated.phone, type: 'login', outcome: 'success', channel, ipAddress, userAgent, storeId,
    });
  }
  await auditAsync({
    event: 'AUD-IAM-012-01', area: 'IAM', feature: 'PRD-IAM-012', entity: 'Customer', entityId: updated.id, actor: updated.email ?? updated.phone, actorRole: (updated.roles ?? [])[0], note: `sign-in (${channel})`,
  });
  return { ok: true, customer: publicCustomer(updated), session };
}

/** IAM-002: request a one-time code by SMS, through the mock gateway. */
export async function requestOtpAsync({ phone, storeId = 1 }) {
  const enabled = await getSettingAsync('otpsettings.loginbyphoneenabled', storeId, false);
  if (!enabled) {
    return { ok: false, message: 'Mobile-number sign-in is not enabled for this client (otpsettings.loginbyphoneenabled).' };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otps.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
  await sendAsync({
    event: 'Iam.OtpCode',
    to: phone,
    channels: ['sms'],
    tokens: { code },
    storeId,
    feature: 'PRD-IAM-002',
    gateways: messageGateways,
  });
  // A prototype shows the code so the journey can be walked without a real handset.
  return { ok: true, sentTo: phone, prototypeCode: code, note: 'The code is shown because no real SMS leaves the prototype (P-3).' };
}

export async function verifyOtpAsync({ sessionId, phone, code }) {
  const entry = otps.get(phone);
  if (!entry || entry.expires < Date.now() || entry.code !== String(code)) {
    return { ok: false, message: 'That code is not valid. Ask for a new one.' };
  }
  otps.delete(phone);
  let customer = await repository('Customer').getOneAsync((c) => c.phone === phone);
  if (!customer) {
    customer = await repository('Customer').insertAsync({
      email: `${phone.replace(/[^0-9]/g, '')}@mobile.local`,
      firstName: 'Mobile',
      lastName: 'Customer',
      phone,
      roles: ['Registered'],
      active: true,
      deleted: false,
      password: 'demo',
      synthetic: true,
      registeredBy: 'mobile-otp',
    });
  }
  sessions.set(sessionId, { customerId: customer.id });
  await auditAsync({
    event: 'AUD-IAM-002-01', area: 'IAM', feature: 'PRD-IAM-002', entity: 'Customer', entityId: customer.id, actor: phone, note: 'mobile-number sign-in with a one-time code',
  });
  return { ok: true, customer: publicCustomer(customer) };
}

/** IAM-026 / CHK-013: an agent acts for a walk-in customer of their own outlet. */
export async function startActingSessionAsync({ sessionId, agentEmail, customerEmail }) {
  const [agent, customer] = await Promise.all([
    repository('Customer').getOneAsync((c) => c.email === agentEmail),
    repository('Customer').getOneAsync((c) => c.email === customerEmail),
  ]);
  if (!agent || !agent.roles.includes('Agent')) {
    return { ok: false, message: 'Iam.AgentNotAssigned: the user is not an agent.' };
  }
  if (!agent.outlet) return { ok: false, message: 'Iam.AgentNotAssigned: the agent has no outlet.' };
  if (!customer) return { ok: false, message: 'Customer not found.' };
  if (customer.roles.some((r) => ['Administrators', 'PlatformTeam'].includes(r))) {
    return { ok: false, message: 'Agents act only for non-staff customers (IAM-008 scope).' };
  }
  sessions.set(sessionId, { customerId: customer.id, actingFor: customer.id, agentId: agent.id, agentOutlet: agent.outlet });
  await auditAsync({
    event: 'AUD-CHK-013-01', area: 'CHK', feature: 'PRD-CHK-013', entity: 'Customer', entityId: customer.id, actor: agent.email, actorRole: 'Agent', note: `acting session started at ${agent.outlet} (single impersonation filter owned by IAM-026, decision SINGLE-FILTER)`,
  });
  return {
    ok: true, customer: publicCustomer(customer), agent: publicCustomer(agent), outlet: agent.outlet,
  };
}

export function signOut(sessionId) {
  sessions.delete(sessionId);
}

export async function currentCustomerAsync(sessionId) {
  const entry = sessions.get(sessionId);
  if (!entry) return null;
  const customer = await repository('Customer').getByIdAsync(entry.customerId);
  if (!customer) return null;
  // AC-IAM-010-02-01 and AC-IAM-006-*: an account that was deactivated or forced off keeps no
  // open session - the next request finds none, exactly as the native cookie check does.
  if (customer.active === false || customer.requireReLogin === true) {
    sessions.delete(sessionId);
    return null;
  }
  return { ...publicCustomer(customer), acting: entry.actingFor ? { agentId: entry.agentId, outlet: entry.agentOutlet } : null };
}

function publicCustomer(c) {
  const { password, ...rest } = c;
  return rest;
}
