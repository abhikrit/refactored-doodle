// Product.IAM - Identity, access and accounts
// Spec: docs/prd/modules/PRD-IAM.md (wave 1 Foundation)
// Owns the single impersonation filter (IAM-026, decision SINGLE-FILTER) and the mobile-number
// OTP identity (IAM-002). Roles and permissions are configuration (IAM-007).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  signInAsync, signOut, currentCustomerAsync, requestOtpAsync, verifyOtpAsync, startActingSessionAsync,
  customersAsync, completeSignInAsync,
} from './services/identity.js';
import {
  registerAsync, activateByTokenAsync, startMobileRegistrationAsync, completeMobileRegistrationAsync,
  registerWithPhoneVerificationAsync, confirmPhoneAsync, loginFactorsAsync, smsProviderAsync,
  registrationTypeAsync, ensureGuestAsync,
} from './services/registration.js';
import {
  requestCodeAsync, verifyCodeAsync, challengesAsync,
} from './services/otp.js';
import { normalisePhoneAsync, customerForPhoneAsync, phoneIdentitiesAsync } from './services/phone.js';
import {
  validatePasswordAsync, setPasswordAsync, passwordExpiredAsync, requestRecoveryAsync,
  useRecoveryTokenAsync, setSecurityAnswersAsync, answerRecoveryQuestionsAsync, confirmRecoveryAsync,
  rejectRecoveryAsync, recoveryRequestsAsync, lockoutState, sensitiveRolesAsync,
} from './services/passwords.js';
import {
  PROVIDERS, mfaRequiredRolesAsync, activeProvidersAsync, forceSettingAsync, mfaRequiredForAsync,
  selectProviderAsync, removeProviderAsync, startSecondFactorAsync, verifySecondFactorAsync,
  registerPasskeyAsync, passkeysAsync, removePasskeyAsync, passkeySupportAsync,
} from './services/mfa.js';
import {
  openSessionAsync, checkSessionAsync, forceLogoutAsync, revokeSessionAsync, rotateSessionAsync,
  sessionsAsync, logoutSessionAsync, idleTimeoutAsync,
} from './services/sessions.js';
import { providersAsync, signInExternalAsync, provisionAsync, externalRecordsAsync } from './services/sso.js';
import { mockRegistry } from '@product/mocks';

export default definePlugin({
  area: 'IAM',
  startupOrder: 3010,
  async install(ctx) {
    ctx.providers.claimOverride('ICustomerImpersonationFilter', {
      owner: 'Product.IAM',
      feature: 'PRD-IAM-026',
      startupOrder: 3010,
      note: 'BR-IAM-130 / decision SINGLE-FILTER: exactly one filter guards Place order for customer.',
    });

    const r = Router();
    r.get('/me', async (req, res, next) => {
      try { res.json(await currentCustomerAsync(req.sessionId)); } catch (err) { next(err); }
    });
    r.get('/customers', async (req, res, next) => {
      try { res.json((await customersAsync()).map(({ password, ...c }) => c)); } catch (err) { next(err); }
    });
    r.post('/sign-in', async (req, res, next) => {
      try { res.json(await signInAsync({ sessionId: req.sessionId, ...req.body })); } catch (err) { next(err); }
    });
    r.post('/sign-out', (req, res) => { signOut(req.sessionId); res.json({ ok: true }); });
    r.post('/otp/request', async (req, res, next) => {
      try { res.json(await requestOtpAsync({ ...req.body, storeId: req.storeId })); } catch (err) { next(err); }
    });
    r.post('/otp/verify', async (req, res, next) => {
      try { res.json(await verifyOtpAsync({ sessionId: req.sessionId, ...req.body })); } catch (err) { next(err); }
    });
    r.post('/acting-session', async (req, res, next) => {
      try { res.json(await startActingSessionAsync({ sessionId: req.sessionId, ...req.body })); } catch (err) { next(err); }
    });
    r.get('/acl', async (req, res, next) => {
      try { res.json(await ctx.security.aclMatrixAsync()); } catch (err) { next(err); }
    });

    /* ------------------------------------------- PRD-IAM-001 registration and login ---- */
    const sms = () => mockRegistry['Sms.Gateway'];
    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };
    r.get('/registration-type', send(async (req) => ({
      type: await registrationTypeAsync(req.storeId), types: ['Standard', 'EmailValidation', 'AdminApproval', 'Disabled'],
    })));
    r.get('/login-factors', send((req) => loginFactorsAsync(req.storeId)));
    r.get('/sms-provider', send((req) => smsProviderAsync(req.storeId)));
    r.post('/guest', send((req) => ensureGuestAsync({ sessionId: req.sessionId })));
    r.post('/register', send((req) => registerAsync({
      ...req.body, sessionId: req.sessionId, storeId: req.storeId, ipAddress: req.ip,
    })));
    r.post('/register/activate', send((req) => activateByTokenAsync({ token: req.body.token })));
    r.post('/register/with-phone', send((req) => registerWithPhoneVerificationAsync({
      ...req.body, sessionId: req.sessionId, storeId: req.storeId, smsProvider: sms(),
    })));
    r.post('/phone/confirm', send((req) => confirmPhoneAsync({ ...req.body, storeId: req.storeId })));

    /* ------------------------------------------------ PRD-IAM-002 mobile identity ------ */
    r.post('/mobile/register/start', send((req) => startMobileRegistrationAsync({
      ...req.body, storeId: req.storeId, ipAddress: req.ip, smsProvider: sms(),
    })));
    r.post('/mobile/register/complete', send((req) => completeMobileRegistrationAsync({
      ...req.body, sessionId: req.sessionId, storeId: req.storeId,
    })));
    r.post('/mobile/login/start', send(async (req) => {
      const normalised = await normalisePhoneAsync(req.body.phone, req.storeId);
      const customer = await customerForPhoneAsync(normalised);
      const challenge = await requestCodeAsync({
        recipient: normalised, purpose: 'login', customerId: customer?.id ?? null, storeId: req.storeId, ipAddress: req.ip, smsProvider: sms(),
      });
      // a number with no account gets the generic message, never "no such account"
      return { ...challenge, normalisedPhone: normalised, accountExists: Boolean(customer) };
    }));
    r.post('/mobile/login/complete', send(async (req) => {
      const normalised = await normalisePhoneAsync(req.body.phone, req.storeId);
      const verified = await verifyCodeAsync({
        recipient: normalised, purpose: 'login', code: req.body.code, storeId: req.storeId,
      });
      if (!verified.ok) return verified;
      const customer = await customerForPhoneAsync(normalised);
      if (!customer) {
        return { ok: false, messageKey: 'Account.Login.WrongCredentials', message: 'The credentials provided are incorrect' };
      }
      // BR-IAM-013: the native code login checks neither the lockout nor MFA, so the IAM filter does
      const lock = lockoutState(customer);
      if (lock.lockedOut) {
        return {
          ok: false, lockedOut: true, messageKey: 'Account.Login.WrongCredentials.LockedOut', message: 'The account is locked out', refusedBy: 'PRD-IAM-002 filter on the native code verification',
        };
      }
      const sensitive = await sensitiveRolesAsync(req.storeId);
      if ((customer.roles ?? []).some((x) => sensitive.includes(x))) {
        return {
          ok: false,
          passwordStepRequired: true,
          messageKey: 'Iam.MfaRequired',
          message: 'This account needs the password step and a second factor.',
          refusedBy: 'PRD-IAM-002 filter on the native code verification',
        };
      }
      const signedIn = await completeSignInAsync({
        sessionId: req.sessionId, customer, storeId: req.storeId, ipAddress: req.ip, channel: 'sms-code',
      });
      return { ...signedIn, phoneSmsVerified: true };
    }));
    r.get('/otp/challenges', send(() => challengesAsync()));
    r.get('/phone-identities', send(() => phoneIdentitiesAsync()));
    r.post('/phone/normalise', send((req) => normalisePhoneAsync(req.body.phone, req.storeId).then((p) => ({ normalised: p }))));

    /* --------------------------------------------- PRD-IAM-003 passwords and recovery -- */
    r.post('/password/validate', send((req) => validatePasswordAsync({ password: req.body.password, storeId: req.storeId })));
    r.post('/password/change', send(async (req) => {
      const customer = await currentCustomerAsync(req.sessionId);
      if (!customer) return { ok: false, message: 'Sign in first.' };
      const full = await ctx.repository('Customer').getByIdAsync(customer.id);
      return setPasswordAsync({ customer: full, password: req.body.password, storeId: req.storeId });
    }));
    r.get('/password/expired', send(async (req) => {
      const customer = await currentCustomerAsync(req.sessionId);
      if (!customer) return { expired: false };
      return passwordExpiredAsync(await ctx.repository('Customer').getByIdAsync(customer.id), req.storeId);
    }));
    r.post('/password/recovery', send((req) => requestRecoveryAsync({ ...req.body, storeId: req.storeId })));
    r.post('/password/recovery/use', send((req) => useRecoveryTokenAsync({ ...req.body, storeId: req.storeId })));
    r.post('/password/security-answers', send(async (req) => {
      const customer = await currentCustomerAsync(req.sessionId);
      return setSecurityAnswersAsync({ customerId: req.body.customerId ?? customer?.id, answers: req.body.answers });
    }));
    r.post('/password/recovery/:id/answers', send((req) => answerRecoveryQuestionsAsync({
      requestId: Number(req.params.id), answers: req.body.answers, storeId: req.storeId,
    })));
    r.post('/password/recovery/:id/confirm', send(async (req) => {
      const confirmer = await currentCustomerAsync(req.sessionId);
      if (!await ctx.security.authorizeAsync('Customers.CustomersCreateEditDelete', confirmer)) {
        return { ok: false, denied: true, permission: 'Customers.CustomersCreateEditDelete' };
      }
      return confirmRecoveryAsync({ requestId: Number(req.params.id), confirmer });
    }));
    r.post('/password/recovery/:id/reject', send(async (req) => rejectRecoveryAsync({
      requestId: Number(req.params.id), by: req.actorEmail, reason: req.body.reason,
    })));
    r.get('/password/recovery-requests', send(() => recoveryRequestsAsync()));
    r.get('/sensitive-roles', send((req) => sensitiveRolesAsync(req.storeId).then((roles) => ({ roles }))));


    /* -------------------------------------------- PRD-IAM-004 and PRD-IAM-013 ---------- */
    r.get('/mfa/providers', send(async (req) => ({
      all: PROVIDERS,
      active: await activeProvidersAsync(req.storeId),
      requiredRoles: await mfaRequiredRolesAsync(req.storeId),
      force: await forceSettingAsync(req.storeId),
    })));
    r.get('/mfa/state', send(async (req) => {
      const me = await currentCustomerAsync(req.sessionId);
      if (!me) return { required: false };
      return mfaRequiredForAsync(await ctx.repository('Customer').getByIdAsync(me.id), req.storeId);
    }));
    r.post('/mfa/select', send(async (req) => selectProviderAsync({
      customerId: req.body.customerId ?? (await currentCustomerAsync(req.sessionId))?.id,
      systemName: req.body.systemName,
      storeId: req.storeId,
      actor: req.actorEmail,
    })));
    r.post('/mfa/remove', send(async (req) => removeProviderAsync({
      customerId: req.body.customerId ?? (await currentCustomerAsync(req.sessionId))?.id,
      by: req.actorEmail ?? 'administrator',
      bySelf: req.body.bySelf === true,
      storeId: req.storeId,
    })));
    r.post('/mfa/start', send((req) => startSecondFactorAsync({
      customerId: req.body.customerId, storeId: req.storeId, smsProvider: sms(),
    })));
    r.post('/mfa/verify', send(async (req) => {
      const verified = await verifySecondFactorAsync({ ...req.body, storeId: req.storeId });
      if (!verified.ok) return verified;
      const customer = await ctx.repository('Customer').getByIdAsync(req.body.customerId);
      const signedIn = await completeSignInAsync({
        sessionId: req.sessionId, customer, storeId: req.storeId, ipAddress: req.ip, channel: 'password+mfa', secondFactorDone: true,
      });
      return { ...signedIn, secondFactor: verified.verified };
    }));
    r.get('/passkeys', send(async (req) => {
      const me = await currentCustomerAsync(req.sessionId);
      return me ? passkeysAsync(me.id) : [];
    }));
    r.get('/passkeys/support', send((req) => passkeySupportAsync({
      storeId: req.storeId, deviceSupports: req.query.deviceSupports !== 'false',
    })));
    r.post('/passkeys', send(async (req) => registerPasskeyAsync({
      customerId: req.body.customerId ?? (await currentCustomerAsync(req.sessionId))?.id, ...req.body,
    })));
    r.delete('/passkeys/:credentialId', send(async (req) => removePasskeyAsync({
      customerId: (await currentCustomerAsync(req.sessionId))?.id, credentialId: req.params.credentialId,
    })));
    r.post('/passkeys/sign-in', send(async (req) => {
      const key = await ctx.repository('PasskeyCredential').getOneAsync((k) => k.credentialId === req.body.credentialId);
      if (!key) return { ok: false, message: 'That passkey is not registered.' };
      const customer = await ctx.repository('Customer').getByIdAsync(key.customerId);
      await ctx.repository('PasskeyCredential').updateAsync({
        ...key, signCount: (key.signCount ?? 0) + 1, lastUsedUtc: new Date().toISOString(),
      });
      // AC-IAM-013-01-04: the device verified the user, so this counts as the second factor
      const signedIn = await completeSignInAsync({
        sessionId: req.sessionId, customer, storeId: req.storeId, ipAddress: req.ip, channel: 'passkey', secondFactorDone: req.body.userVerified !== false,
      });
      return { ...signedIn, withPassword: false, userVerified: req.body.userVerified !== false };
    }));

    /* ---------------------------------------------------- PRD-IAM-006 sessions --------- */
    r.get('/sessions', send((req) => sessionsAsync(req.query.customerId ? Number(req.query.customerId) : null)));
    r.get('/sessions/timeout', send(async (req) => idleTimeoutAsync(await currentCustomerAsync(req.sessionId), req.storeId)));
    r.post('/sessions/check', send((req) => checkSessionAsync({ sessionId: req.body.sessionId ?? req.sessionId, storeId: req.storeId })));
    r.post('/sessions/force-logout', send(async (req) => {
      const officer = await currentCustomerAsync(req.sessionId);
      if (!await ctx.security.authorizeAsync('Identity.Core.Sessions.CreateEditDelete', officer)) {
        return { ok: false, denied: true, permission: 'Identity.Core.Sessions.CreateEditDelete' };
      }
      return forceLogoutAsync({ customerId: Number(req.body.customerId), by: officer?.email ?? 'security officer', reason: req.body.reason ?? 'forced logout' });
    }));
    r.post('/sessions/:sessionId/revoke', send(async (req) => {
      const officer = await currentCustomerAsync(req.sessionId);
      if (!await ctx.security.authorizeAsync('Identity.Core.Sessions.CreateEditDelete', officer)) {
        return { ok: false, denied: true, permission: 'Identity.Core.Sessions.CreateEditDelete' };
      }
      return revokeSessionAsync({ sessionId: req.params.sessionId, by: officer?.email ?? 'security officer' });
    }));
    r.post('/sessions/rotate', send((req) => rotateSessionAsync({
      customerId: Number(req.body.customerId), browserSession: req.sessionId, reason: req.body.reason, storeId: req.storeId,
    })));

    /* --------------------------------------------------------- PRD-IAM-005 SSO -------- */
    r.get('/sso/providers', send(async (req) => ({
      providers: await providersAsync(req.storeId), records: await externalRecordsAsync(),
    })));
    r.post('/sso/sign-in', send(async (req) => {
      const result = await signInExternalAsync({ ...req.body, storeId: req.storeId });
      if (!result.ok) return result;
      const customer = await ctx.repository('Customer').getByIdAsync(result.customer.id);
      const signedIn = await completeSignInAsync({
        sessionId: req.sessionId, customer, storeId: req.storeId, ipAddress: req.ip, channel: 'sso', secondFactorDone: true,
      });
      return { ...result, ...signedIn };
    }));
    r.post('/sso/provision', send((req) => provisionAsync({ ...req.body, storeId: req.storeId })));

    ctx.addRouter('/api/identity', r);
    ctx.declare({
      built: true,
      owns: ['PRD-IAM-001', 'PRD-IAM-002', 'PRD-IAM-003', 'PRD-IAM-004', 'PRD-IAM-005', 'PRD-IAM-006',
        'PRD-IAM-007', 'PRD-IAM-013', 'PRD-IAM-026'],
      note: 'registration and login, mobile-number identity, password policy and recovery, second factors, single sign-on, sessions and passkeys.',
    });
  },
});
