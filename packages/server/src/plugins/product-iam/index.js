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
import {
  PRODUCT_ROLES, PERMISSION_EXCLUSIONS, SCOPE_DIMENSIONS, ensureProductRolesAsync, rolesAsync,
  createRoleAsync, updateRoleAsync, deleteRoleAsync, applyRolePackAsync, savePermissionMappingAsync,
  assignScopeAsync, scopesForAsync, checkScopeAsync, filterByScopeAsync, approvalAuthorityAsync,
  delegablePermissionsAsync, delegateAsync, activeDelegationsForAsync, authorizeWithDelegationAsync,
  revokeDelegationAsync, delegationsAsync, inviteAsync, acceptInvitationAsync, revokeInvitationAsync,
  invitationsAsync, openCampaignAsync, reviewItemsForAsync, decideReviewItemAsync,
  runCampaignDeadlineTaskAsync, campaignsAsync, accessReportAsync,
} from './services/access.js';
import {
  applyAuthLoggingConfigurationAsync, recordAuthEventAsync, authEventsAsync, exportToMonitoringAsync,
  detectionRulesAsync, flagsAsync, decideFlagAsync, accountActivityAsync, maskIp,
  syncFieldsAsync, enqueueAccountChangeAsync, applyInboundChangeAsync, notifyErasureAsync,
  verificationAdaptersAsync, verifyIdentityAsync, decideVerificationAsync, verificationCasesAsync,
} from './services/auth-events.js';
import {
  searchCustomersAsync, setActiveByStaffAsync, selfDeactivateAsync, requestSelfReactivationAsync,
  completeSelfReactivationAsync, impersonateAsync, impersonationProviders, staffEditCustomerAsync,
  openCustomerAsync, activityLogAsync,
} from './services/users.js';
import {
  updateProfileAsync, requestPhoneChangeAsync, confirmPhoneChangeAsync, addressesAsync,
  addAddressAsync, editAddressAsync, deleteAddressAsync, setDefaultAddressAsync,
  offeredAddressesAsync, notificationChannelsAsync, setPreferredChannelAsync,
  setPreferredPickupPointAsync, preferencesAsync, gdprLogAsync,
} from './services/profile.js';
import {
  reacceptanceCheckAsync, declineAsync, consentTrailAsync, customerConsentsAsync, setConsentAsync,
  consentProviders, cookieCategoriesAsync, setCookieChoicesAsync, cookieChoiceAsync,
  analyticsAllowedAsync, exportMyDataAsync, requestCorrectionAsync, decideCorrectionAsync,
  requestDeletionAsync, permanentDeleteCustomerAsync, markOverdueAsync, privacyRequestsAsync,
  privacyTrailAsync, dueDateAsync, recordAcceptanceAsync, effectiveVersionAsync,
  acceptancesAsync, hasAcceptedEffectiveAsync,
} from './services/privacy.js';
import {
  myOrdersAsync, myOrderDetailAsync, invoicePdfAsync, quotesAsync, returnRequestsAsync,
  quotePdfAsync, historyAsync, historyExportAsync, reorderAsync, quickActionsAsync,
  dashboardAsync, figuresAsync, waitingProviders, WAITING_ITEMS,
} from './services/self-service.js';
import {
  COMPANY_ROLES, COMPANY_ROLE_RIGHTS, createCompanyAsync, companiesAsync, companyAsync,
  companyOfCustomerAsync, membershipProviders, addMemberAsync, removeMemberAsync,
  linkOrderToCompanyAsync, companyOrdersAsync, companyAddressesAsync, createCostCentreAsync,
  costCentresAsync, budgetCheckAsync, chargeOrderAsync, releaseChargeAsync,
} from './services/companies.js';
import {
  registerTradeUploadContextAsync, requiredDocumentsAsync, submitTradeApplicationAsync,
  tradeApplicationsAsync, decideTradeApplicationAsync, tradePricesVisibleAsync,
  taxExemptionAsync, calculateLineTaxAsync, setTaxExemptAsync, euVatConfigurationAsync,
  applyEuVatGuardAsync, setVatNumberAsync, markVatNumberAsync,
} from './services/trade.js';
import {
  assistedServiceEnabledAsync, agentProfileAsync, assignOutletAsync, agentsAsync,
  assistedRegistrationStartAsync, assistedRegistrationCompleteAsync, actingConsentStartAsync,
  endActingSessionAsync, assistedRecordsAsync,
} from './services/agents.js';
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

    await ensureProductRolesAsync();
    await applyAuthLoggingConfigurationAsync();
    // IC-ADM-08 RegisterUploadContext for AC-IAM-023-01-02
    await registerTradeUploadContextAsync();

    // IC-IAM-09: the agent rule of IAM-026. Other modules register their own providers; one
    // Allow is enough and the filter itself stays IAM-026's (BR-IAM-130).
    ctx.providers.registerProvider('IC-IAM-09', {
      name: 'agents for customers of their own outlet',
      area: 'IAM',
      feature: 'PRD-IAM-026',
      fn: async ({
        actor, target, customerCode, storeId,
      }) => {
        // BR-IAM-141: with the feature off for the store the rule is not applicable at all
        const feature = await assistedServiceEnabledAsync(storeId ?? 1);
        if (!feature.enabled) {
          return { decision: 'NotApplicable', reason: 'assisted service is not enabled for this store (IC-PLT-02)' };
        }
        if (!await ctx.security.authorizeAsync('Identity.Core.AssistedService.Access', actor)) {
          return { decision: 'NotApplicable', reason: 'the user is not an assisted-service agent' };
        }
        if (!actor?.outlet) {
          return { decision: 'Deny', messageKey: 'Iam.AgentNotAssigned', message: ctx.messages.resource('Iam.AgentNotAssigned') };
        }
        // AC-IAM-026-03-02: an agent never acts for staff; native code refuses only administrators
        const staffRoles = ['Administrators', 'PlatformTeam', 'Finance', 'Compliance', 'SecurityOfficer', 'Catalogue', 'Logistics', 'Operations', 'Support', 'Auditor', 'PrivacyOfficer', 'Warehouse', 'Agent'];
        if ((target.roles ?? []).some((role) => staffRoles.includes(role))) {
          return { decision: 'Deny', messageKey: 'Iam.ScopeDenied', message: ctx.messages.resource('Iam.ScopeDenied') };
        }
        // AC-IAM-026-03-03: agents act only for the customers of their own outlet
        if ((target.registeredAtOutlet ?? target.outlet ?? null) !== actor.outlet) {
          return { decision: 'Deny', messageKey: 'Iam.ScopeDenied', message: ctx.messages.resource('Iam.ScopeDenied') };
        }
        const codeRequired = await ctx.settings.getSettingAsync('iam.customercoderequiredforacting', storeId ?? 1, false);
        if (codeRequired === true && !customerCode) {
          return { decision: 'Deny', messageKey: 'Iam.ScopeDenied', message: 'Ask the customer for their customer code.' };
        }
        return { decision: 'Allow', reason: 'the customer is registered at an outlet of this agent' };
      },
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


    /* ------------------------------- PRD-IAM-007, 008, 009 and 011: access governance -- */
    const gate = (permission) => async (req, res, next) => {
      try {
        const customer = await currentCustomerAsync(req.sessionId);
        if (!await ctx.security.authorizeAsync(permission, customer)) {
          return res.status(403).json({ ok: false, denied: true, permission, message: `Access denied: ${permission} is required.` });
        }
        req.customer = customer;
        return next();
      } catch (err) { return next(err); }
    };

    r.get('/roles', send(() => rolesAsync()));
    r.get('/roles/catalogue', send(() => ({ productRoles: PRODUCT_ROLES, exclusions: PERMISSION_EXCLUSIONS })));
    r.post('/roles', send(async (req) => createRoleAsync({
      ...req.body, actor: req.actorEmail, actorCustomer: await currentCustomerAsync(req.sessionId),
    })));
    r.patch('/roles/:systemName', send((req) => updateRoleAsync({ systemName: req.params.systemName, ...req.body, actor: req.actorEmail })));
    r.delete('/roles/:systemName', send((req) => deleteRoleAsync({ systemName: req.params.systemName })));
    r.post('/roles/pack', send((req) => applyRolePackAsync({ mappings: req.body.mappings ?? [], actor: req.actorEmail })));
    r.post('/permissions/mapping', send((req) => savePermissionMappingAsync(req.body)));

    r.get('/scopes', send(async (req) => {
      const customer = req.query.email
        ? await ctx.repository('Customer').getOneAsync((c) => c.email === req.query.email)
        : await currentCustomerAsync(req.sessionId);
      return { dimensions: SCOPE_DIMENSIONS, scopes: await scopesForAsync(customer) };
    }));
    r.post('/scopes', send((req) => assignScopeAsync({ ...req.body, actor: req.actorEmail })));
    r.post('/scopes/check', send(async (req) => {
      const customer = req.body.email
        ? await ctx.repository('Customer').getOneAsync((c) => c.email === req.body.email)
        : await currentCustomerAsync(req.sessionId);
      return checkScopeAsync({ customer, ...req.body });
    }));
    r.get('/scopes/orders', send(async (req) => {
      const customer = req.query.email
        ? await ctx.repository('Customer').getOneAsync((c) => c.email === req.query.email)
        : await currentCustomerAsync(req.sessionId);
      const orders = await ctx.repository('Order').getAllAsync();
      return filterByScopeAsync({
        customer,
        permissionSystemName: 'Orders.OrdersView',
        rows: orders,
        keyOf: (o, dimension) => ({
          store: o.storeId ?? 1, region: o.region ?? null, outlet: o.pickupPointName ?? null, category: o.category ?? null,
        })[dimension],
      });
    }));
    r.get('/approval-authority', send(async (req) => {
      const customer = req.query.email
        ? await ctx.repository('Customer').getOneAsync((c) => c.email === req.query.email)
        : await currentCustomerAsync(req.sessionId);
      return approvalAuthorityAsync(customer);
    }));

    r.get('/delegations', send(async (req) => ({
      delegable: await delegablePermissionsAsync(req.storeId), delegations: await delegationsAsync(),
    })));
    r.post('/delegations', send(async (req) => delegateAsync({
      delegator: await currentCustomerAsync(req.sessionId), ...req.body, storeId: req.storeId,
    })));
    r.post('/delegations/:id/revoke', send((req) => revokeDelegationAsync({ id: Number(req.params.id), by: req.actorEmail })));
    r.post('/delegations/authorize', send(async (req) => {
      const customer = req.body.email
        ? await ctx.repository('Customer').getOneAsync((c) => c.email === req.body.email)
        : await currentCustomerAsync(req.sessionId);
      return authorizeWithDelegationAsync(req.body.permission, customer);
    }));
    r.get('/delegations/active', send(async (req) => {
      const customer = req.query.email
        ? await ctx.repository('Customer').getOneAsync((c) => c.email === req.query.email)
        : await currentCustomerAsync(req.sessionId);
      return activeDelegationsForAsync(customer);
    }));

    r.get('/invitations', send(() => invitationsAsync()));
    r.post('/invitations', gate('Identity.Core.AccessGovernance.CreateEditDelete'), send((req) => inviteAsync({
      ...req.body, invitedBy: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/invitations/accept', send((req) => acceptInvitationAsync({ ...req.body, storeId: req.storeId })));
    r.post('/invitations/:id/revoke', send((req) => revokeInvitationAsync({ id: Number(req.params.id), by: req.actorEmail })));

    r.get('/access-reviews', send(() => campaignsAsync()));
    r.post('/access-reviews', gate('Identity.Core.AccessGovernance.CreateEditDelete'), send((req) => openCampaignAsync({
      ...req.body, openedBy: req.actorEmail,
    })));
    r.get('/access-reviews/mine', send((req) => reviewItemsForAsync(req.actorEmail)));
    r.post('/access-reviews/items/:id', send((req) => decideReviewItemAsync({
      itemId: Number(req.params.id), decision: req.body.decision, by: req.actorEmail,
    })));
    r.post('/access-reviews/deadline-task', send(() => runCampaignDeadlineTaskAsync()));
    r.get('/access-report', gate('Identity.Core.AccessReports.View'), send((req) => accessReportAsync({
      privilegedOnly: req.query.privilegedOnly === 'true', storeId: req.storeId,
    })));


    /* ---------------------------- PRD-IAM-010, 012, 018, 019 and 020 ------------------- */
    const meOr = async (req, email) => (email
      ? ctx.repository('Customer').getOneAsync((c) => c.email === email && !c.deleted)
      : currentCustomerAsync(req.sessionId));

    r.get('/users', gate('Customers.CustomersView'), send(async (req) => searchCustomersAsync({ ...req.query, staff: req.actorEmail })));
    r.post('/users/active', send(async (req) => setActiveByStaffAsync({
      ...req.body, staff: await currentCustomerAsync(req.sessionId),
    })));
    r.post('/users/edit', send(async (req) => staffEditCustomerAsync({
      ...req.body, staff: await currentCustomerAsync(req.sessionId),
    })));
    r.post('/users/open', send(async (req) => openCustomerAsync({
      ...req.body, staff: await currentCustomerAsync(req.sessionId),
    })));
    r.post('/users/impersonate', send(async (req) => impersonateAsync({
      actor: await currentCustomerAsync(req.sessionId), ...req.body, storeId: req.storeId,
    })));
    r.get('/users/impersonation-providers', send(() => impersonationProviders()));
    r.post('/account/deactivate', send(async (req) => selfDeactivateAsync({
      customer: await currentCustomerAsync(req.sessionId), ...req.body, storeId: req.storeId,
    })));
    r.post('/account/reactivate/start', send((req) => requestSelfReactivationAsync({
      ...req.body, storeId: req.storeId, smsProvider: sms(),
    })));
    r.post('/account/reactivate/complete', send((req) => completeSelfReactivationAsync({ ...req.body, storeId: req.storeId })));
    r.get('/activity-log', send((req) => activityLogAsync(req.query.customerId ? Number(req.query.customerId) : null)));
    // AC-IAM-012-01-03: the native activity log can be cleared; the AUD-IAM-018 copy cannot
    r.delete('/activity-log', gate('Customers.ActivityLogDelete'), send(async () => {
      const rows = await ctx.repository('ActivityLog').getAllAsync();
      for (const row of rows) await ctx.repository('ActivityLog').deleteAsync(row.id);
      return { cleared: rows.length, auditTrailCopyKept: true };
    }));

    r.get('/auth-events', gate('Identity.Core.AuthEvents.View'), send((req) => authEventsAsync(req.query)));
    r.get('/auth-events/configuration', send((req) => applyAuthLoggingConfigurationAsync(req.storeId)));
    r.get('/auth-events/monitoring-export', gate('Identity.Core.AuthEvents.View'), send((req) => exportToMonitoringAsync({ storeId: req.storeId })));
    r.post('/auth-events', send((req) => recordAuthEventAsync({ ...req.body, storeId: req.storeId })));
    r.get('/suspicious-logins', send(async () => ({ rules: await detectionRulesAsync(), flags: await flagsAsync() })));
    r.post('/suspicious-logins/:id', send((req) => decideFlagAsync({
      flagId: Number(req.params.id), ...req.body, by: req.actorEmail,
    })));

    r.get('/account/activity', async (req, res, next) => {
      // AC-IAM-018-03-01: the staff tab needs Customers.CustomersView; a shopper sees only their own
      if (!req.query.email) return next();
      return gate('Customers.CustomersView')(req, res, next);
    }, send(async (req) => {
      const customer = await meOr(req, req.query.email);
      if (!customer) return { entries: [] };
      return accountActivityAsync({ customerId: customer.id, storeId: req.storeId, forStaff: req.query.forStaff === 'true' });
    }));

    r.get('/sync/configuration', send((req) => syncFieldsAsync(req.storeId)));
    r.post('/sync/enqueue', send((req) => enqueueAccountChangeAsync({ ...req.body, storeId: req.storeId })));
    r.post('/sync/inbound', send((req) => applyInboundChangeAsync({ ...req.body, storeId: req.storeId })));
    r.post('/sync/erasure-notice', send((req) => notifyErasureAsync({ ...req.body, storeId: req.storeId })));

    r.get('/verification', send(async (req) => ({
      adapters: await verificationAdaptersAsync(req.storeId), cases: await verificationCasesAsync(),
    })));
    r.post('/verification', send((req) => verifyIdentityAsync({
      ...req.body, storeId: req.storeId, adapter: mockRegistry['Identity.Registry'] && {
        verifyAsync: async ({ country, identityType, identifier, name }) => {
          const r2 = await mockRegistry['Identity.Registry'].verifyAsync({
            country, identityType, identifier, name,
          });
          if (req.body.forceResult) return { result: req.body.forceResult, reference: r2?.providerRef ?? null, matchedFields: [] };
          return {
            result: 'Verified', reference: r2?.providerRef ?? `VER-${Date.now()}`, matchedFields: ['name', 'identifier'],
          };
        },
      },
    })));
    r.post('/verification/:id/decide', gate('Identity.Core.Verification.CreateEditDelete'), send((req) => decideVerificationAsync({
      caseId: Number(req.params.id), ...req.body, by: req.actorEmail,
    })));

    /* ------------------------- PRD-IAM-014, 015, 016, 017, 021 and 025 ------------------ */
    const me = async (req) => currentCustomerAsync(req.sessionId);
    const subject = async (req) => (req.query.email || req.body?.email
      ? ctx.repository('Customer').getOneAsync((c) => c.email === (req.query.email ?? req.body.email) && !c.deleted)
      : me(req));

    r.post('/profile', send(async (req) => updateProfileAsync({
      customer: await me(req), changes: req.body.changes ?? req.body, storeId: req.storeId,
    })));
    r.post('/profile/phone/start', send(async (req) => requestPhoneChangeAsync({
      customer: await me(req), phone: req.body.phone, storeId: req.storeId, smsProvider: sms(),
    })));
    r.post('/profile/phone/confirm', send(async (req) => confirmPhoneChangeAsync({
      customer: await me(req), phone: req.body.phone, code: req.body.code, storeId: req.storeId,
    })));
    r.get('/addresses', send(async (req) => addressesAsync({ customerId: (await me(req)).id })));
    r.post('/addresses', send(async (req) => addAddressAsync({ customerId: (await me(req)).id, address: req.body })));
    r.patch('/addresses/:id', send(async (req) => editAddressAsync({
      customerId: (await me(req)).id, addressId: Number(req.params.id), address: req.body,
    })));
    r.delete('/addresses/:id', send(async (req) => deleteAddressAsync({
      customerId: (await me(req)).id, addressId: Number(req.params.id),
    })));
    r.post('/addresses/:id/default', send(async (req) => setDefaultAddressAsync({
      customerId: (await me(req)).id, addressId: Number(req.params.id),
    })));
    r.get('/addresses/offered', send(async (req) => offeredAddressesAsync({ customerId: (await me(req)).id })));

    r.get('/preferences', send(async (req) => preferencesAsync({ customerId: (await me(req)).id, storeId: req.storeId })));
    r.get('/preferences/channels', send((req) => notificationChannelsAsync(req.storeId)));
    r.post('/preferences/channel', send(async (req) => setPreferredChannelAsync({
      customerId: (await me(req)).id, channel: req.body.channel, storeId: req.storeId,
    })));
    r.post('/preferences/pickup-point', send(async (req) => setPreferredPickupPointAsync({
      customerId: (await me(req)).id, pickupPointId: Number(req.body.pickupPointId),
    })));

    r.get('/terms/check', send(async (req) => reacceptanceCheckAsync({
      customer: await me(req), vendorId: req.query.vendorId ? Number(req.query.vendorId) : null, path: req.query.path ?? '/', storeId: req.storeId,
    })));
    r.post('/terms/accept', send(async (req) => recordAcceptanceAsync({
      customerId: (await me(req)).id,
      vendorId: req.body.vendorId ?? null,
      policySystemName: req.body.policySystemName,
      decision: 'accepted',
      channel: req.body.channel ?? 'storefront',
      ipAddress: req.ip,
      storeId: req.storeId,
    })));
    r.post('/terms/decline', send(async (req) => declineAsync({
      customer: await me(req), policySystemName: req.body.policySystemName, vendorId: req.body.vendorId ?? null, ipAddress: req.ip, storeId: req.storeId,
    })));
    r.get('/terms/effective', send((req) => effectiveVersionAsync({
      policySystemName: req.query.policySystemName, storeId: req.storeId,
    })));
    r.get('/terms/acceptances', send(async (req) => acceptancesAsync((await subject(req)).id)));
    r.get('/terms/accepted', send(async (req) => hasAcceptedEffectiveAsync({
      customerId: (await me(req)).id, policySystemName: req.query.policySystemName, storeId: req.storeId,
    })));
    r.get('/consent-trail', send(async (req) => consentTrailAsync({
      customerId: (await subject(req)).id, actor: await me(req), requestedBy: req.query.requestedBy ?? 'admin',
    })));

    r.get('/consents', send(async (req) => customerConsentsAsync({ customerId: (await me(req)).id })));
    r.post('/consents', send(async (req) => setConsentAsync({
      customerId: (await me(req)).id, systemName: req.body.systemName, accepted: req.body.accepted === true, storeId: req.storeId,
    })));
    r.get('/consents/providers', send(() => consentProviders()));
    r.get('/cookies', send((req) => cookieChoiceAsync({ visitorId: req.query.visitorId ?? req.sessionId, storeId: req.storeId })));
    r.get('/cookies/categories', send((req) => cookieCategoriesAsync(req.storeId)));
    r.post('/cookies', send(async (req) => setCookieChoicesAsync({
      customerId: (await me(req))?.id ?? null, visitorId: req.body.visitorId ?? req.sessionId, accepted: req.body.accepted ?? [], storeId: req.storeId,
    })));
    r.get('/cookies/analytics', send((req) => analyticsAllowedAsync({
      visitorId: req.query.visitorId ?? req.sessionId, storeId: req.storeId,
    })));

    r.post('/privacy/export', send(async (req) => exportMyDataAsync({ customer: await me(req), storeId: req.storeId })));
    r.get('/privacy/gdpr-log', gate('Customers.GDPRManage'), send((req) => gdprLogAsync(req.query.customerId ? Number(req.query.customerId) : null)));
    r.post('/privacy/corrections', send(async (req) => requestCorrectionAsync({
      customer: await me(req), ...req.body, storeId: req.storeId,
    })));
    r.post('/privacy/corrections/:id/decide', send(async (req) => decideCorrectionAsync({
      requestId: Number(req.params.id), ...req.body, by: req.actorEmail, actor: await me(req), storeId: req.storeId,
    })));
    r.post('/privacy/deletion', send(async (req) => requestDeletionAsync({ customer: await me(req), storeId: req.storeId })));
    r.post('/privacy/deletion/run', send(async (req) => permanentDeleteCustomerAsync({
      customerId: Number(req.body.customerId), requestId: req.body.requestId ?? null, actor: await me(req), storeId: req.storeId,
    })));
    r.post('/privacy/overdue-task', send((req) => markOverdueAsync({ storeId: req.storeId })));
    r.get('/privacy/requests', send((req) => privacyRequestsAsync(req.query)));
    r.get('/privacy/due-date', send((req) => dueDateAsync({ storeId: req.storeId, ...req.query })));
    r.get('/privacy/trail', send(async (req) => privacyTrailAsync({
      customerId: (await subject(req)).id, actor: await me(req),
    })));

    r.get('/my/orders', send(async (req) => myOrdersAsync({ customer: await me(req), storeId: req.storeId })));
    r.get('/my/orders/:orderNumber', send(async (req) => myOrderDetailAsync({
      customer: await me(req), orderNumber: req.params.orderNumber,
    })));
    r.get('/my/orders/:orderNumber/invoice', send(async (req) => invoicePdfAsync({
      customer: await me(req), orderNumber: req.params.orderNumber,
    })));
    r.post('/my/orders/:orderNumber/reorder', send(async (req) => reorderAsync({
      customer: await me(req), orderNumber: req.params.orderNumber, sessionId: req.sessionId, storeId: req.storeId,
    })));
    r.get('/my/quotes', send(async (req) => quotesAsync({ customer: await me(req), storeId: req.storeId })));
    r.get('/my/quotes/:quoteNumber/pdf', send(async (req) => quotePdfAsync({
      customer: await me(req), quoteNumber: req.params.quoteNumber, storeId: req.storeId,
    })));
    r.get('/my/return-requests', send(async (req) => returnRequestsAsync({ customer: await me(req) })));
    r.get('/my/history', send(async (req) => historyAsync({
      customer: await me(req), ...req.query, storeId: req.storeId,
    })));
    r.get('/my/history/export', send(async (req) => historyExportAsync({
      customer: await me(req), ...req.query, storeId: req.storeId,
    })));
    r.get('/my/dashboard', send(async (req) => dashboardAsync({ customer: await me(req), storeId: req.storeId })));
    r.get('/my/quick-actions', send((req) => quickActionsAsync({ storeId: req.storeId })));
    r.get('/my/figures', send(async (req) => figuresAsync({
      customer: await me(req), months: req.query.months ? Number(req.query.months) : 6, storeId: req.storeId,
    })));
    r.get('/my/waiting-providers', send(() => waitingProviders()));

    /* ------------------------- PRD-IAM-022, 023, 024, 026 and 027 ----------------------- */
    r.get('/companies', gate('Identity.Core.TradeAccounts.CreateEditDelete'), send(() => companiesAsync()));
    r.post('/companies', gate('Identity.Core.TradeAccounts.CreateEditDelete'), send((req) => createCompanyAsync({ ...req.body, actor: req.actorEmail })));
    r.get('/companies/roles', send(() => ({ roles: COMPANY_ROLES, rights: COMPANY_ROLE_RIGHTS })));
    r.get('/companies/of-customer', send(async (req) => companyOfCustomerAsync({
      customerId: req.query.customerId ? Number(req.query.customerId) : (await me(req)).id,
    })));
    r.get('/companies/membership-providers', send(() => membershipProviders()));
    r.get('/companies/addresses', send(async (req) => companyAddressesAsync({ customer: await me(req) })));
    r.get('/companies/:id', send((req) => companyAsync(Number(req.params.id))));
    r.get('/companies/:id/orders', send(async (req) => companyOrdersAsync({
      companyId: Number(req.params.id), customer: await me(req),
    })));
    r.post('/companies/:id/members', send((req) => addMemberAsync({
      companyId: Number(req.params.id), ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.delete('/companies/:id/members/:customerId', send((req) => removeMemberAsync({
      companyId: Number(req.params.id), customerId: Number(req.params.customerId), actor: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/companies/orders/link', send((req) => linkOrderToCompanyAsync(req.body)));
    r.get('/cost-centres', send((req) => costCentresAsync(req.query.companyId ?? null)));
    r.post('/cost-centres', send((req) => createCostCentreAsync({ ...req.body, actor: req.actorEmail, storeId: req.storeId })));
    r.post('/cost-centres/check', send(async (req) => budgetCheckAsync({
      ...req.body, customer: await me(req), storeId: req.storeId,
    })));
    r.post('/cost-centres/charge', send((req) => chargeOrderAsync({ ...req.body, storeId: req.storeId })));
    r.post('/cost-centres/release', send((req) => releaseChargeAsync(req.body)));

    r.get('/trade-applications', gate('Identity.Core.TradeAccounts.CreateEditDelete'), send((req) => tradeApplicationsAsync(req.query)));
    r.get('/trade-applications/requirements', send(async (req) => ({
      fields: ['companyName', 'registrationNumber', 'taxNumber'],
      documents: await requiredDocumentsAsync(req.storeId),
      uploadContext: 'trade application document',
      policyOwnedBy: 'PRD-ADM-008',
    })));
    r.post('/trade-applications', send(async (req) => submitTradeApplicationAsync({
      customer: await me(req), ...req.body, storeId: req.storeId,
    })));
    r.post('/trade-applications/:id/decide', send(async (req) => decideTradeApplicationAsync({
      applicationId: Number(req.params.id), ...req.body, by: req.actorEmail, actor: await me(req), storeId: req.storeId,
    })));
    r.get('/trade-prices', send(async (req) => tradePricesVisibleAsync({ customer: await me(req) })));

    r.get('/tax/exemption', send(async (req) => taxExemptionAsync({
      customerId: req.query.customerId ? Number(req.query.customerId) : (await me(req)).id,
    })));
    r.post('/tax/calculate', send((req) => calculateLineTaxAsync(req.body)));
    r.post('/tax/exemption', send(async (req) => setTaxExemptAsync({
      ...req.body, by: req.actorEmail, actor: await me(req),
    })));
    r.get('/tax/eu-vat', send((req) => euVatConfigurationAsync({ storeId: req.storeId })));
    r.post('/tax/eu-vat/guard', send((req) => applyEuVatGuardAsync({ storeId: req.storeId })));
    r.post('/tax/vat-number', send(async (req) => setVatNumberAsync({
      customerId: req.body.customerId ?? (await me(req)).id, vatNumber: req.body.vatNumber,
    })));
    r.post('/tax/vat-number/mark', send(async (req) => markVatNumberAsync({
      ...req.body, by: req.actorEmail, actor: await me(req),
    })));

    r.get('/agents', send(() => agentsAsync()));
    r.get('/agents/assisted-service', send((req) => assistedServiceEnabledAsync(req.storeId)));
    r.get('/agents/me', send(async (req) => agentProfileAsync({ customer: await me(req), storeId: req.storeId })));
    r.post('/agents/outlet', send(async (req) => assignOutletAsync({
      ...req.body, by: req.actorEmail, actor: await me(req),
    })));
    r.get('/agents/records', send((req) => assistedRecordsAsync(req.query)));
    r.post('/agents/register/start', send(async (req) => assistedRegistrationStartAsync({
      agent: await me(req), ...req.body, storeId: req.storeId, smsProvider: sms(),
    })));
    r.post('/agents/register/complete', send(async (req) => assistedRegistrationCompleteAsync({
      agent: await me(req), ...req.body, storeId: req.storeId, ipAddress: req.ip,
    })));
    r.post('/agents/acting/consent', send(async (req) => actingConsentStartAsync({
      agent: await me(req), ...req.body, storeId: req.storeId, smsProvider: sms(),
    })));
    r.post('/agents/acting/end', send(async (req) => endActingSessionAsync({
      agent: await me(req), recordId: req.body.recordId ?? null, storeId: req.storeId,
    })));

    // AC-IAM-025-01-01: the bundled Misc.RFQ plugin owns quotes, so its in-house substitute
    // (decision P-2) reports the quotes that wait for the customer.
    ctx.providers.registerProvider(WAITING_ITEMS, {
      name: 'quotes to answer',
      area: 'IAM',
      feature: 'Misc.RFQ',
      fn: async ({ customerId }) => {
        const quotes = await ctx.repository('Quote').getAllAsync((q) => q.customerId === customerId
          && q.status === 'AwaitingCustomer');
        return {
          items: quotes.map((q) => ({
            what: 'a quote to answer', reference: q.quoteNumber, target: `/customer/quotes/${q.quoteNumber}`, since: q.createdOnUtc,
          })),
        };
      },
    });

    // AC-IAM-019-01-01: the IAM consumers only enqueue into the INT-004 outbox (BR-INT-010).
    ctx.events.subscribe('CustomerRegisteredEvent', {
      area: 'IAM',
      feature: 'PRD-IAM-019',
      name: 'enqueue the account-sync message',
      fn: async ({ customer, storeId }) => {
        await enqueueAccountChangeAsync({ customerId: customer.id, changeType: 'registered', storeId: storeId ?? 1 });
      },
    });
    for (const eventName of ['EntityInsertedEvent', 'EntityUpdatedEvent']) {
      ctx.events.subscribe(eventName, {
        area: 'IAM',
        feature: 'PRD-IAM-019',
        name: 'enqueue the account-sync message',
        fn: async ({ entity, id, changeType }) => {
          if (entity !== 'Customer') return;
          await enqueueAccountChangeAsync({ customerId: id, changeType: changeType ?? 'updated' });
        },
      });
    }

    ctx.addRouter('/api/identity', r);
    ctx.declare({
      built: true,
      owns: ['PRD-IAM-001', 'PRD-IAM-002', 'PRD-IAM-003', 'PRD-IAM-004', 'PRD-IAM-005', 'PRD-IAM-006',
        'PRD-IAM-007', 'PRD-IAM-008', 'PRD-IAM-009', 'PRD-IAM-010', 'PRD-IAM-011', 'PRD-IAM-012',
        'PRD-IAM-013', 'PRD-IAM-018', 'PRD-IAM-019', 'PRD-IAM-020', 'PRD-IAM-026'],
      note: 'registration and login, mobile-number identity, password policy and recovery, second factors, single sign-on, sessions and passkeys.',
    });
  },
});
