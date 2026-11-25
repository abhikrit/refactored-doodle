// PRD-IAM-003 Password policy, lockout and recovery.
//
// BR-IAM-021: the rules are the native CustomerSettings values only; no second password policy.
// BR-IAM-020: for a role listed as sensitive, a recovery link or an SMS code alone is not enough -
// a RecoveryRequest is opened and the configured extra check applies (SM-IAM-09).

import { createHash } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { sendAsync } from '../../../core/messages.js';
import { messageGateways } from '@product/mocks';

const customerRepo = () => repository('Customer');
const passwordRepo = () => repository('CustomerPassword');
const requestRepo = () => repository('RecoveryRequest');
const answerRepo = () => repository('SecurityAnswer');

const sha = (value) => createHash('sha256').update(String(value)).digest('hex');

export async function sensitiveRolesAsync(storeId = 1) {
  return getSettingAsync('iam.sensitiveroles', storeId, ['Administrators', 'PlatformTeam', 'Finance', 'SecurityOfficer']);
}

export async function isSensitiveAsync(customer, storeId = 1) {
  const sensitive = await sensitiveRolesAsync(storeId);
  return (customer?.roles ?? []).some((r) => sensitive.includes(r));
}

/* ===================================================================== policy =========== */

/** AC-IAM-003-01-01 and 01-02: the native rules, with the native validation message for each. */
export async function validatePasswordAsync({ password, customer = null, storeId = 1 }) {
  const [min, max, lower, upper, digit, nonAlpha, unduplicated] = await Promise.all([
    getSettingAsync('customersettings.passwordminlength', storeId, 6),
    getSettingAsync('customersettings.passwordmaxlength', storeId, 64),
    getSettingAsync('customersettings.passwordrequirelowercase', storeId, false),
    getSettingAsync('customersettings.passwordrequireuppercase', storeId, false),
    getSettingAsync('customersettings.passwordrequiredigit', storeId, false),
    getSettingAsync('customersettings.passwordrequirenonalphanumeric', storeId, false),
    getSettingAsync('customersettings.unduplicatedpasswordsnumber', storeId, 0),
  ]);
  const errors = [];
  const value = String(password ?? '');
  if (value.length < Number(min)) errors.push({ rule: 'minLength', messageKey: 'Validation.Password.LengthValidation', message: `The password must be at least ${min} characters.` });
  if (value.length > Number(max)) errors.push({ rule: 'maxLength', messageKey: 'Validation.Password.MaxLengthValidation', message: `The password must be at most ${max} characters.` });
  if (lower === true && !/[a-z]/.test(value)) errors.push({ rule: 'lowercase', messageKey: 'Validation.Password.RequireLowercase', message: 'The password must have at least one lowercase letter.' });
  if (upper === true && !/[A-Z]/.test(value)) errors.push({ rule: 'uppercase', messageKey: 'Validation.Password.RequireUppercase', message: 'The password must have at least one uppercase letter.' });
  if (digit === true && !/[0-9]/.test(value)) errors.push({ rule: 'digit', messageKey: 'Validation.Password.RequireDigit', message: 'The password must have at least one digit.' });
  if (nonAlpha === true && !/[^a-zA-Z0-9]/.test(value)) errors.push({ rule: 'nonAlphanumeric', messageKey: 'Validation.Password.RequireNonAlphanumeric', message: 'The password must have at least one special character.' });

  if (customer && Number(unduplicated) > 0) {
    const history = (await passwordRepo().getAllAsync((p) => p.customerId === customer.id))
      .sort((a, b) => new Date(b.createdOnUtc) - new Date(a.createdOnUtc))
      .slice(0, Number(unduplicated));
    if (history.some((p) => p.passwordHash === sha(value))) {
      errors.push({ rule: 'unduplicated', messageKey: 'Account.ChangePassword.Errors.PasswordWasAlreadyUsed', message: `You cannot reuse any of your last ${unduplicated} passwords.` });
    }
  }
  return { ok: errors.length === 0, errors };
}

/** AC-IAM-003-01-03: a password older than the lifetime sends every request to the change page. */
export async function passwordExpiredAsync(customer, storeId = 1) {
  const lifetime = Number(await getSettingAsync('customersettings.passwordlifetime', storeId, 0));
  if (!lifetime || !customer) return { expired: false };
  const role = (await repository('CustomerRole').getAllAsync((r) => (customer.roles ?? []).includes(r.systemName)))
    .find((r) => r.enablePasswordLifetime === true);
  if (!role) return { expired: false, reason: 'no role of this customer enables the password lifetime' };
  const current = (await passwordRepo().getAllAsync((p) => p.customerId === customer.id))
    .sort((a, b) => new Date(b.createdOnUtc) - new Date(a.createdOnUtc))[0];
  const setOn = current?.createdOnUtc ?? customer.createdOnUtc;
  const ageDays = (Date.now() - new Date(setOn).getTime()) / (24 * 3600 * 1000);
  return {
    expired: ageDays > lifetime, ageDays: Math.floor(ageDays), lifetime, redirectTo: '/account/change-password',
  };
}

export async function setPasswordAsync({
  customer, password, storeId = 1, reason = 'changed',
}) {
  const check = await validatePasswordAsync({ password, customer, storeId });
  if (!check.ok) return { ok: false, errors: check.errors };
  await passwordRepo().insertAsync({
    customerId: customer.id, passwordHash: sha(password), createdOnUtc: new Date().toISOString(),
  });
  const updated = await customerRepo().updateAsync({
    ...customer, password, passwordChangedOnUtc: new Date().toISOString(), failedLoginAttempts: 0, cannotLoginUntilDateUtc: null,
  });
  const reLogin = await getSettingAsync('customersettings.requiredreloginafterpasswordchange', storeId, false);
  await auditAsync({
    event: 'AUD-IAM-003',
    area: 'IAM',
    feature: 'PRD-IAM-003',
    entity: 'Customer',
    entityId: customer.id,
    actor: customer.email ?? customer.phone,
    note: `password ${reason}`,
  });
  return { ok: true, customer: updated, requireReLogin: reLogin === true };
}

/* ==================================================================== lockout =========== */

export async function recordFailedLoginAsync({ customer, storeId = 1, gateways = messageGateways }) {
  const [allowed, minutes, notify] = await Promise.all([
    getSettingAsync('customersettings.failedpasswordallowedattempts', storeId, 0),
    getSettingAsync('customersettings.failedpasswordlockoutminutes', storeId, 30),
    getSettingAsync('customersettings.notifyfailedloginattempt', storeId, false),
  ]);
  const attempts = (customer.failedLoginAttempts ?? 0) + 1;
  let updated = await customerRepo().updateAsync({ ...customer, failedLoginAttempts: attempts });
  let lockedOut = false;
  if (Number(allowed) > 0 && attempts >= Number(allowed)) {
    updated = await customerRepo().updateAsync({
      ...updated, cannotLoginUntilDateUtc: new Date(Date.now() + Number(minutes) * 60 * 1000).toISOString(), failedLoginAttempts: 0,
    });
    lockedOut = true;
  }
  if (notify === true && customer.email) {
    // the native Customer.FailedLoginAttempt email, sent by TRK-005
    try {
      await sendAsync({
        event: 'Customer.FailedLoginAttempt', to: customer.email, channels: ['email'], tokens: { attempts }, storeId, feature: 'PRD-IAM-003', gateways,
      });
    } catch { /* a notification failure never changes the lockout */ }
  }
  return { attempts, lockedOut, customer: updated };
}

export function lockoutState(customer) {
  const until = customer?.cannotLoginUntilDateUtc;
  if (!until) return { lockedOut: false };
  const lockedOut = new Date(until).getTime() > Date.now();
  return { lockedOut, until, messageKey: lockedOut ? 'Account.Login.WrongCredentials.LockedOut' : null };
}

export async function clearLockoutAsync(customer) {
  return customerRepo().updateAsync({ ...customer, cannotLoginUntilDateUtc: null, failedLoginAttempts: 0 });
}

/* =================================================================== recovery =========== */

/**
 * AC-IAM-003-03-01 for an ordinary account: the native Customer.PasswordRecovery email with a
 * one-time link, valid for PasswordRecoveryLinkDaysValid days and usable once.
 * AC-IAM-003-04-01 for a sensitive role: no native link; a RecoveryRequest is opened and the same
 * neutral message is shown (BR-IAM-020, SM-IAM-09).
 */
export async function requestRecoveryAsync({
  email, phone = null, method = 'email', storeId = 1, gateways = messageGateways,
}) {
  const customer = await customerRepo().getOneAsync((c) => (email ? c.email === email : c.phone === phone));
  const neutral = {
    ok: true, messageKey: 'Iam.RecoveryRequestReceived', message: resource('Iam.RecoveryRequestReceived'),
  };
  if (!customer || customer.deleted) return { ...neutral, accountFound: false };

  if (await isSensitiveAsync(customer, storeId)) {
    const request = await requestRepo().insertAsync({
      customerId: customer.id,
      method,
      status: 'Opened',
      extraCheck: (await answerRepo().getAllAsync((a) => a.customerId === customer.id)).length > 0 ? 'security-questions' : 'manager-confirmation',
      openedOnUtc: new Date().toISOString(),
    });
    await auditAsync({
      event: 'AUD-IAM-003',
      area: 'IAM',
      feature: 'PRD-IAM-003',
      entity: 'RecoveryRequest',
      entityId: request.id,
      actor: email ?? phone,
      note: 'recovery requested for a sensitive account: no native link issued (BR-IAM-020)',
    });
    return {
      ...neutral, accountFound: true, sensitive: true, nativeLinkIssued: false, requestId: request.id, extraCheck: request.extraCheck,
    };
  }

  const days = Number(await getSettingAsync('customersettings.passwordrecoverylinkdaysvalid', storeId, 7));
  const token = sha(`${customer.id}-${Date.now()}-recovery`).slice(0, 32);
  await customerRepo().updateAsync({
    ...customer,
    passwordRecoveryToken: token,
    passwordRecoveryTokenUsed: false,
    passwordRecoveryTokenGeneratedOnUtc: new Date().toISOString(),
    passwordRecoveryTokenExpiresOnUtc: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
  });
  try {
    await sendAsync({
      event: 'Customer.PasswordRecovery', to: customer.email, channels: ['email'], tokens: { token }, storeId, feature: 'PRD-IAM-003', gateways,
    });
  } catch { /* the neutral message is shown either way */ }
  return {
    ...neutral, accountFound: true, sensitive: false, nativeLinkIssued: true, token, validDays: days,
  };
}

export async function useRecoveryTokenAsync({ token, newPassword, storeId = 1 }) {
  const customer = await customerRepo().getOneAsync((c) => c.passwordRecoveryToken === token);
  if (!customer) return { ok: false, message: 'This link is not valid.' };
  if (customer.passwordRecoveryTokenUsed === true) return { ok: false, usedAlready: true, message: 'This link has already been used.' };
  if (new Date(customer.passwordRecoveryTokenExpiresOnUtc).getTime() < Date.now()) {
    return { ok: false, expired: true, message: 'This link has expired. Request a new one.' };
  }
  const set = await setPasswordAsync({
    customer, password: newPassword, storeId, reason: 'reset through the recovery link',
  });
  if (!set.ok) return set;
  await customerRepo().updateAsync({ ...set.customer, passwordRecoveryTokenUsed: true });
  return { ok: true, customer: set.customer, requireReLogin: set.requireReLogin };
}

/** AC-IAM-003-04-02: security questions; a wrong answer counts as a failed attempt. */
export async function setSecurityAnswersAsync({ customerId, answers }) {
  for (const [questionKey, answer] of Object.entries(answers)) {
    const existing = await answerRepo().getOneAsync((a) => a.customerId === customerId && a.questionKey === questionKey);
    const row = { customerId, questionKey, answerHash: sha(String(answer).trim().toLowerCase()) };
    if (existing) await answerRepo().updateAsync({ ...existing, ...row });
    else await answerRepo().insertAsync(row);
  }
  return { ok: true, questions: Object.keys(answers) };
}

export async function answerRecoveryQuestionsAsync({ requestId, answers, storeId = 1 }) {
  const request = await requestRepo().getByIdAsync(requestId);
  if (!request || request.status !== 'Opened') return { ok: false, message: 'This recovery request is not open.' };
  const stored = await answerRepo().getAllAsync((a) => a.customerId === request.customerId);
  const wrong = stored.filter((a) => sha(String(answers[a.questionKey] ?? '').trim().toLowerCase()) !== a.answerHash);
  if (wrong.length > 0 || stored.length === 0) {
    const customer = await customerRepo().getByIdAsync(request.customerId);
    const failed = await recordFailedLoginAsync({ customer, storeId });
    await requestRepo().updateAsync({ ...request, attempts: (request.attempts ?? 0) + 1 });
    return {
      ok: false, wrongAnswers: wrong.map((a) => a.questionKey), countedAsFailedAttempt: true, lockedOut: failed.lockedOut,
    };
  }
  return issueResetLinkAsync(request, 'security questions answered');
}

/** AC-IAM-003-04-03: a second user holding Customers.CustomersCreateEditDelete confirms. */
export async function confirmRecoveryAsync({ requestId, confirmer }) {
  const request = await requestRepo().getByIdAsync(requestId);
  if (!request || request.status !== 'Opened') return { ok: false, message: 'This recovery request is not open.' };
  if (request.customerId === confirmer?.id) {
    return { ok: false, message: 'The requester cannot confirm their own request.' };
  }
  const result = await issueResetLinkAsync(request, `confirmed by ${confirmer?.email}`, confirmer);
  return result;
}

async function issueResetLinkAsync(request, note, confirmer = null) {
  const customer = await customerRepo().getByIdAsync(request.customerId);
  const token = sha(`${customer.id}-${Date.now()}-sensitive`).slice(0, 32);
  await customerRepo().updateAsync({
    ...customer,
    passwordRecoveryToken: token,
    passwordRecoveryTokenUsed: false,
    passwordRecoveryTokenExpiresOnUtc: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
  const updated = await requestRepo().updateAsync({
    ...request, status: 'Verified', confirmedBy: confirmer?.email ?? null, verifiedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-003',
    area: 'IAM',
    feature: 'PRD-IAM-003',
    entity: 'RecoveryRequest',
    entityId: request.id,
    actor: confirmer?.email ?? customer.email ?? 'system',
    before: { status: 'Opened' },
    after: { status: 'Verified' },
    note,
  });
  return {
    ok: true, request: updated, token, oneTimeLink: `/login/reset?token=${token}`,
  };
}

export async function rejectRecoveryAsync({ requestId, by, reason }) {
  const request = await requestRepo().getByIdAsync(requestId);
  if (!request) return { ok: false, message: 'unknown recovery request' };
  const updated = await requestRepo().updateAsync({ ...request, status: 'Rejected', reason });
  await auditAsync({
    event: 'AUD-IAM-003', area: 'IAM', feature: 'PRD-IAM-003', entity: 'RecoveryRequest', entityId: requestId, actor: by ?? 'system', after: { status: 'Rejected' }, note: reason ?? 'rejected',
  });
  return { ok: true, request: updated };
}

export const recoveryRequestsAsync = () => requestRepo().getAllAsync();
