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

    ctx.addRouter('/api/identity', r);
    ctx.declare({
      built: true,
      owns: ['PRD-IAM-001', 'PRD-IAM-002', 'PRD-IAM-003', 'PRD-IAM-007', 'PRD-IAM-026'],
      note: 'registration and login, mobile-number identity with one-time codes, password policy, lockout and recovery.',
    });
  },
});
