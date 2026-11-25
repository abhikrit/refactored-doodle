// PRD-IAM-001 Customer registration and login, and the mobile-number registration of
// PRD-IAM-002.
//
// SM-IAM-02: the account states. BR-IAM-001: the registration type is one value for the
// installation. BR-IAM-002: an email address and a normalised mobile number each belong to at
// most one customer. BR-IAM-003: the block-list check on the registration and login POSTs is the
// platform action filter owned by SEL-013; IAM keeps no block list and adds no filter.

import { createHash } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { sendAsync, resource } from '../../../core/messages.js';
import { runActionFilters } from '../../../core/providers.js';
import { messageGateways } from '@product/mocks';
import { normalisePhoneAsync, identityForPhoneAsync, savePhoneIdentityAsync } from './phone.js';
import { requestCodeAsync, verifyCodeAsync } from './otp.js';
import { validatePasswordAsync, setPasswordAsync } from './passwords.js';

const customerRepo = () => repository('Customer');

export const REGISTRATION_TYPES = ['Standard', 'EmailValidation', 'AdminApproval', 'Disabled'];

export const registrationTypeAsync = (storeId = 1) => getSettingAsync('customersettings.userregistrationtype', storeId, 'Standard');

const token = (seed) => createHash('sha256').update(`${seed}-${Date.now()}`).digest('hex').slice(0, 32);

/** The guest customer record of this browser session, which registration turns into a member. */
async function guestForSessionAsync(sessionId) {
  if (!sessionId) return null;
  return customerRepo().getOneAsync((c) => c.guestSessionId === sessionId && !c.deleted);
}

export async function ensureGuestAsync({ sessionId }) {
  const existing = await guestForSessionAsync(sessionId);
  if (existing) return existing;
  return customerRepo().insertAsync({
    email: null,
    firstName: null,
    lastName: null,
    roles: ['Guests'],
    active: true,
    deleted: false,
    guestSessionId: sessionId,
    createdOnUtc: new Date().toISOString(),
  });
}

/**
 * AC-IAM-001-01-01 Standard, 04-01 EmailValidation, 04-02 AdminApproval, 04-03 Disabled.
 * AC-IAM-001-01-02 the email is unique. AC-IAM-001-03-01 a guest keeps its basket and orders.
 * AC-IAM-001-05-01 no organisation field is required when CompanyRequired is off.
 */
export async function registerAsync({
  email, password, firstName = null, lastName = null, company = null, phone = null,
  sessionId = null, storeId = 1, ipAddress = null, gateways = messageGateways,
}) {
  const type = await registrationTypeAsync(storeId);
  if (type === 'Disabled') {
    return {
      ok: false, registrationDisabled: true, messageKey: 'Account.Register.Result.Disabled', message: 'Registration is not available.',
    };
  }

  // BR-IAM-003: the SEL-013 filter, not an IAM check
  const filters = await runActionFilters('Nop.Web CustomerController.Register', { email, phone, ipAddress });
  if (filters.ok === false) {
    return {
      ok: false, blocked: true, refusedBy: filters.refusedBy, messageKey: filters.messageKey ?? 'Sel.BlockedParty', message: filters.message,
    };
  }

  const existing = email ? await customerRepo().getOneAsync((c) => c.email === email && !c.deleted) : null;
  if (existing && existing.roles?.includes('Registered')) {
    return {
      ok: false, messageKey: 'Account.Register.Errors.EmailAlreadyExists', message: 'The specified email already exists', created: false,
    };
  }

  const companyRequired = await getSettingAsync('customersettings.companyrequired', storeId, false);
  if (companyRequired === true && !company) {
    return { ok: false, messageKey: 'Account.Fields.Company.Required', message: 'Company is required.' };
  }

  const policy = await validatePasswordAsync({ password, storeId });
  if (!policy.ok) return { ok: false, passwordErrors: policy.errors };

  let normalisedPhone = null;
  if (phone) {
    normalisedPhone = await normalisePhoneAsync(phone, storeId);
    const held = await identityForPhoneAsync(normalisedPhone);
    if (held) {
      return {
        ok: false, messageKey: 'Account.IsAlreadyExistsVerifiedPhoneNumber', message: resource('Iam.PhoneInUse'),
      };
    }
  }

  const active = type === 'Standard';
  const guest = await guestForSessionAsync(sessionId);
  const base = {
    email,
    firstName,
    lastName,
    company: companyRequired === true ? company : company ?? null,
    roles: ['Registered'],
    active,
    deleted: false,
    password,
    accountState: active ? 'Active' : 'Inactive',
    registrationType: type,
    createdOnUtc: new Date().toISOString(),
    emailValidationToken: type === 'EmailValidation' ? token(email) : null,
    guestSessionId: null,
  };
  // AC-IAM-001-03-01: the guest customer record itself becomes Registered, so its basket and any
  // guest order stay on the account
  const customer = guest
    ? await customerRepo().updateAsync({ ...guest, ...base })
    : await customerRepo().insertAsync(base);

  await setPasswordAsync({
    customer, password, storeId, reason: 'set at registration',
  });
  if (normalisedPhone) {
    await savePhoneIdentityAsync({ customerId: customer.id, normalisedPhone, verified: false });
  }

  const template = type === 'EmailValidation' ? 'Customer.EmailValidationMessage' : 'Customer.WelcomeMessage';
  if (email) {
    try {
      await sendAsync({
        event: template,
        to: email,
        channels: ['email'],
        tokens: { token: customer.emailValidationToken ?? '' },
        storeId,
        feature: 'PRD-IAM-001',
        gateways,
      });
    } catch { /* a notification failure never blocks the registration */ }
  }
  await auditAsync({
    event: 'AUD-IAM-001',
    area: 'IAM',
    feature: 'PRD-IAM-001',
    entity: 'Customer',
    entityId: customer.id,
    actor: email ?? normalisedPhone ?? 'visitor',
    after: { accountState: customer.accountState, registrationType: type },
    note: `registered (${type})`,
  });

  return {
    ok: true,
    customer: { ...customer, password: undefined },
    registrationType: type,
    active,
    signedIn: active,
    emailSent: template,
    convertedGuest: Boolean(guest),
    activationNeededBy: type === 'AdminApproval' ? 'an administrator in the user administration console' : type === 'EmailValidation' ? 'the link in the validation email' : null,
  };
}

/** AC-IAM-001-04-01: the account becomes active when the validation link is opened. */
export async function activateByTokenAsync({ token: value }) {
  const customer = await customerRepo().getOneAsync((c) => c.emailValidationToken === value);
  if (!customer) return { ok: false, message: 'This link is not valid.' };
  const updated = await customerRepo().updateAsync({
    ...customer, active: true, accountState: 'Active', emailValidationToken: null,
  });
  await auditAsync({
    event: 'AUD-IAM-001', area: 'IAM', feature: 'PRD-IAM-001', entity: 'Customer', entityId: customer.id, actor: customer.email, after: { accountState: 'Active' }, note: 'activated by the email validation link',
  });
  return { ok: true, customer: { ...updated, password: undefined } };
}

/* ======================================== mobile-number registration (PRD-IAM-002) ====== */

/**
 * AC-IAM-002-01-01: the number is normalised, checked against PhoneIdentity and a code is sent.
 * AC-IAM-002-01-03: a number that already has an account gets Iam.PhoneInUse and no account.
 * AC-IAM-002-01-06 / 01-07: the gateway failing, or TRK answering Blocked, shows Iam.Otp.Unavailable.
 */
export async function startMobileRegistrationAsync({
  phone, storeId = 1, ipAddress = null, smsProvider = null,
}) {
  const normalised = await normalisePhoneAsync(phone, storeId);
  const held = await identityForPhoneAsync(normalised);
  if (held) {
    return {
      ok: false, messageKey: 'Iam.PhoneInUse', message: resource('Iam.PhoneInUse'), loginUrl: '/login', created: false,
    };
  }
  const challenge = await requestCodeAsync({
    recipient: normalised, purpose: 'register', storeId, ipAddress, smsProvider,
  });
  return { ...challenge, normalisedPhone: normalised };
}

/**
 * AC-IAM-002-01-02: the correct code within its validity creates the account with the mobile
 * number as identifier and no email, records the terms acceptance and signs the visitor in.
 */
export async function completeMobileRegistrationAsync({
  phone, code, firstName = null, lastName = null, storeId = 1, sessionId = null, policyAccepted = true,
}) {
  const normalised = await normalisePhoneAsync(phone, storeId);
  const verified = await verifyCodeAsync({
    recipient: normalised, purpose: 'register', code, storeId,
  });
  if (!verified.ok) return verified;

  const filters = await runActionFilters('Nop.Web CustomerController.Register', { phone: normalised });
  if (filters.ok === false) {
    return {
      ok: false, blocked: true, refusedBy: filters.refusedBy, message: filters.message,
    };
  }

  const guest = sessionId ? await guestForSessionAsync(sessionId) : null;
  const base = {
    email: null,
    firstName,
    lastName,
    roles: ['Registered'],
    active: true,
    deleted: false,
    accountState: 'Active',
    registeredBy: 'mobile',
    createdOnUtc: new Date().toISOString(),
    guestSessionId: null,
  };
  const customer = guest
    ? await customerRepo().updateAsync({ ...guest, ...base })
    : await customerRepo().insertAsync(base);
  await savePhoneIdentityAsync({ customerId: customer.id, normalisedPhone: normalised, verified: true });

  // terms acceptance is recorded by IAM-016
  const { recordAcceptanceAsync } = await import('./privacy.js').catch(() => ({ recordAcceptanceAsync: null }));
  let acceptance = null;
  if (policyAccepted && recordAcceptanceAsync) {
    acceptance = await recordAcceptanceAsync({
      customerId: customer.id, policySystemName: 'ConditionsOfUse', channel: 'mobile-registration', storeId,
    });
  }
  await auditAsync({
    event: 'AUD-IAM-001', area: 'IAM', feature: 'PRD-IAM-002', entity: 'Customer', entityId: customer.id, actor: normalised, after: { accountState: 'Active' }, note: 'registered by mobile number and one-time code',
  });
  return {
    ok: true,
    customer: { ...(await customerRepo().getByIdAsync(customer.id)), password: undefined },
    signedIn: true,
    identifier: normalised,
    hasEmail: false,
    termsAcceptance: acceptance,
  };
}

/**
 * AC-IAM-002-01-10: the native page registers with email, password and mobile number, and the
 * native flow verifies the number before the result page.
 */
export async function registerWithPhoneVerificationAsync({
  email, password, phone, firstName = null, lastName = null, storeId = 1, smsProvider = null, sessionId = null,
}) {
  const normalised = await normalisePhoneAsync(phone, storeId);
  const held = await identityForPhoneAsync(normalised);
  if (held) {
    return {
      ok: false, messageKey: 'Account.IsAlreadyExistsVerifiedPhoneNumber', message: resource('Iam.PhoneInUse'),
    };
  }
  const registered = await registerAsync({
    email, password, firstName, lastName, phone, sessionId, storeId,
  });
  if (!registered.ok) return registered;
  const type = await registrationTypeAsync(storeId);
  const challenge = await requestCodeAsync({
    recipient: normalised, purpose: 'confirm-change', customerId: registered.customer.id, storeId, smsProvider,
  });
  return {
    ...registered,
    phoneVerificationFlow: `Register${type}`,
    verificationChallenge: challenge.challengeId ?? null,
    demonstrationCode: challenge.demonstrationCode ?? null,
    phoneVerified: false,
  };
}

export async function confirmPhoneAsync({
  customerId, phone, code, storeId = 1,
}) {
  const normalised = await normalisePhoneAsync(phone, storeId);
  const verified = await verifyCodeAsync({
    recipient: normalised, purpose: 'confirm-change', code, storeId,
  });
  if (!verified.ok) return verified;
  const saved = await savePhoneIdentityAsync({ customerId, normalisedPhone: normalised, verified: true });
  return { ok: true, phoneVerified: true, identity: saved.identity };
}

/** AC-IAM-002-04-01: which login factors the page offers. */
export async function loginFactorsAsync(storeId = 1) {
  const factor = await getSettingAsync('iam.buyerloginfactor', storeId, 'either');
  const byPhone = await getSettingAsync('otpsettings.loginbyphoneenabled', storeId, false);
  if (factor === 'password') {
    return {
      factor, emailAndPassword: true, mobileAndCode: false, loginByPhoneEnabled: false,
    };
  }
  if (factor === 'sms-code') {
    return {
      factor, emailAndPassword: false, mobileAndCode: true, loginByPhoneEnabled: true, note: 'the email and password fields are hidden by the IAM login view override',
    };
  }
  return {
    factor: 'either', emailAndPassword: true, mobileAndCode: byPhone === true, loginByPhoneEnabled: byPhone === true,
  };
}

/** AC-IAM-002-01-09: the active SMS provider for this client. */
export async function smsProviderAsync(storeId = 1) {
  const systemName = await getSettingAsync('messagessettings.activesmsprovidersystemname', storeId, 'Sms.Gateway');
  return {
    systemName,
    primary: true,
    installed: true,
    usedBy: ['native login codes', 'the codes IAM sends itself'],
    twilioAccepted: systemName === 'Sms.Twilio',
  };
}
