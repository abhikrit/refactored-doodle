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
import { sendAsync } from '../../../core/messages.js';
import { messageGateways } from '@product/mocks';

const sessions = new Map(); // sessionId -> { customerId, actingFor, agentOutlet }
const otps = new Map(); // phone -> { code, expires }

export async function customersAsync() {
  return repository('Customer').getAllAsync((c) => !c.deleted);
}

export async function signInAsync({ sessionId, email, password = 'demo' }) {
  const customer = await repository('Customer').getOneAsync((c) => c.email === email);
  // AC-ADM-001-03-01: a deactivated account cannot sign in; AC-ADM-001-03-02: a deleted one is gone
  if (customer && (customer.active === false || customer.deleted)) {
    await auditAsync({
      event: 'AUD-IAM-012-02',
      area: 'IAM',
      feature: 'PRD-IAM-012',
      entity: 'Customer',
      entityId: customer.id,
      actor: email,
      outcome: 'rejected',
      note: customer.deleted ? 'sign-in refused: the account was deleted' : `sign-in refused: the account is deactivated (${customer.deactivationReason ?? 'no reason recorded'})`,
    });
    return {
      ok: false,
      deactivated: true,
      message: customer.deleted
        ? 'This account no longer exists.'
        : 'This account has been deactivated. Please contact us.',
    };
  }
  if (!customer || customer.password !== password) {
    await auditAsync({
      event: 'AUD-IAM-012-02', area: 'IAM', feature: 'PRD-IAM-012', entity: 'Customer', entityId: email, actor: email, outcome: 'rejected', note: 'failed sign-in (prototype)',
    });
    return { ok: false, message: 'Sign-in failed. Check the e-mail address and password.' };
  }
  sessions.set(sessionId, { customerId: customer.id });
  await auditAsync({
    event: 'AUD-IAM-012-01', area: 'IAM', feature: 'PRD-IAM-012', entity: 'Customer', entityId: customer.id, actor: customer.email, actorRole: customer.roles[0], note: 'sign-in (prototype)',
  });
  return { ok: true, customer: publicCustomer(customer) };
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
  return { ...publicCustomer(customer), acting: entry.actingFor ? { agentId: entry.agentId, outlet: entry.agentOutlet } : null };
}

function publicCustomer(c) {
  const { password, ...rest } = c;
  return rest;
}
