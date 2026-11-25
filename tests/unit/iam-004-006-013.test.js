// PRD-IAM-004 Multi-factor authentication by role, PRD-IAM-005 Single sign-on,
// PRD-IAM-006 Session management and PRD-IAM-013 Passwordless and biometric login.
// 10 + 6 + 7 + 4 = 27 criteria, one test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';

let api;
before(async () => {
  api = await startAsync();
  await saveSettingAsync('iam.otpsendlimitperip', 500, 0);
  await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
  await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 50, 0);
});
after(() => api?.stop());

const byEmail = (email) => repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

/* ================================================== PRD-IAM-004 second factors ========== */

describe('PRD-IAM-004 multi-factor authentication by role', () => {
  test('AC-IAM-004-01-01', async () => {
    // "every request is redirected to the native MFA settings page with Iam.MfaRequired until a
    //  provider is configured"
    await saveSettingAsync('iam.mfarequiredroles', ['Administrators', 'SecurityOfficer'], 0);
    const admin = await byEmail('admin@example.com');
    await repository('Customer').updateAsync({ ...admin, mfaProvider: null });

    const signIn = await api.post('/api/identity/sign-in', { email: 'admin@example.com', password: 'demo' }, 'mfa-1');
    assert.equal(signIn.ok, false);
    assert.equal(signIn.secondFactorRequired, true);
    assert.equal(signIn.setUpRequired, true);
    assert.equal(signIn.messageKey, 'Iam.MfaRequired');
    assert.equal(signIn.message, 'Your role requires a second login check. Set it up to continue.');

    const state = await api.post('/api/identity/mfa/select', { customerId: admin.id, systemName: 'MultiFactorAuth.EmailCode' });
    assert.equal(state.ok, true);
  });

  test('AC-IAM-004-01-02', async () => {
    // "the login completes only after the provider verification succeeds"
    const admin = await byEmail('admin@example.com');
    const first = await api.post('/api/identity/sign-in', { email: 'admin@example.com', password: 'demo' }, 'mfa-2');
    assert.equal(first.ok, false);
    assert.equal(first.secondFactorRequired, true);
    assert.equal(first.setUpRequired, false, 'a provider is configured, so the second step follows');
    assert.equal(first.provider, 'MultiFactorAuth.EmailCode');

    const started = await api.post('/api/identity/mfa/start', { customerId: admin.id }, 'mfa-2');
    assert.equal(started.ok, true);
    const wrong = await api.post('/api/identity/mfa/verify', { customerId: admin.id, code: '000000' }, 'mfa-2');
    assert.equal(wrong.ok, false, 'a wrong code does not complete the login');

    const right = await api.post('/api/identity/mfa/verify', { customerId: admin.id, code: started.demonstrationCode }, 'mfa-2');
    assert.equal(right.ok, true);
    assert.equal(right.secondFactor, 'one-time code');
    const me = await api.get('/api/identity/me', 'mfa-2');
    assert.equal(me.email, 'admin@example.com', 'the login completed');
  });

  test('AC-IAM-004-01-03', async () => {
    // "ForceMultifactorAuthentication is off; MFA by role is enforced by the IAM filter only"
    const providers = await api.get('/api/identity/mfa/providers');
    assert.equal(providers.force.forceMultifactorAuthentication, false);
    assert.match(providers.force.enforcedBy, /IAM filter/);
    assert.match(providers.force.reason, /including Registered/);
  });

  test('AC-IAM-004-01-04', async () => {
    // "the member must configure a provider again before continuing, and the removal is audited"
    const admin = await byEmail('admin@example.com');
    const removed = await api.post('/api/identity/mfa/remove', { customerId: admin.id }, SESSIONS.approver);
    assert.equal(removed.ok, true);
    assert.equal(removed.mustConfigureAgain, true);
    assert.equal(removed.redirectTo, '/account/multi-factor-authentication');

    const trail = await api.get('/api/security/audit?event=AUD-IAM-004');
    assert.ok(trail.some((e) => e.entityId === String(admin.id) && e.after?.mfaProvider === null), 'the removal is audited');
    await api.post('/api/identity/mfa/select', { customerId: admin.id, systemName: 'MultiFactorAuth.EmailCode' });
  });

  test('AC-IAM-004-02-01', async () => {
    // "a code is sent to the account email and the login completes only with the correct code"
    const customer = await byEmail('support@example.com');
    await api.post('/api/identity/mfa/select', { customerId: customer.id, systemName: 'MultiFactorAuth.EmailCode' });
    const started = await api.post('/api/identity/mfa/start', { customerId: customer.id });
    assert.equal(started.ok, true);
    assert.equal(started.sentTo, 'support@example.com');
    assert.equal(started.provider, 'MultiFactorAuth.EmailCode');

    const verified = await api.post('/api/identity/mfa/verify', { customerId: customer.id, code: started.demonstrationCode }, 'mfa-3');
    assert.equal(verified.ok, true);
  });

  test('AC-IAM-004-02-02', async () => {
    // "a code is sent through IC-IAM-01 to the verified mobile number"
    const customer = await byEmail('logistics@example.com');
    await repository('Customer').updateAsync({ ...customer, phone: '+265991230001', phoneSmsVerified: true });
    await api.post('/api/identity/mfa/select', { customerId: customer.id, systemName: 'MultiFactorAuth.SmsCode' });
    const started = await api.post('/api/identity/mfa/start', { customerId: customer.id });
    assert.equal(started.ok, true);
    assert.equal(started.sentTo, '+265991230001');
    const verified = await api.post('/api/identity/mfa/verify', { customerId: customer.id, code: started.demonstrationCode }, 'mfa-4');
    assert.equal(verified.ok, true);

    // without a verified number the provider cannot start
    const other = await byEmail('catalogue@example.com');
    await api.post('/api/identity/mfa/select', { customerId: other.id, systemName: 'MultiFactorAuth.SmsCode' });
    const refused = await api.post('/api/identity/mfa/start', { customerId: other.id });
    assert.equal(refused.ok, false);
    assert.match(refused.message, /no verified mobile number/);
  });

  test('AC-IAM-004-02-03', async () => {
    // "the login completes only after a valid key assertion for that user"
    const customer = await byEmail('compliance@example.com');
    await api.post('/api/identity/mfa/select', { customerId: customer.id, systemName: 'MultiFactorAuth.HardwareKey' });
    const noKey = await api.post('/api/identity/mfa/start', { customerId: customer.id });
    assert.equal(noKey.ok, false, 'no security key is registered yet');

    const registered = await api.post('/api/identity/passkeys', { customerId: customer.id, purpose: 'mfa', deviceName: 'YubiKey' });
    const started = await api.post('/api/identity/mfa/start', { customerId: customer.id });
    assert.equal(started.ok, true);
    assert.ok(started.assertionChallenge);
    assert.ok(started.credentialIds.includes(registered.passkey.credentialId));

    const wrongKey = await api.post('/api/identity/mfa/verify', { customerId: customer.id, credentialId: 'not-a-key' });
    assert.equal(wrongKey.ok, false);
    const verified = await api.post('/api/identity/mfa/verify', { customerId: customer.id, credentialId: registered.passkey.credentialId }, 'mfa-5');
    assert.equal(verified.ok, true);
    assert.equal(verified.secondFactor, 'key assertion');
  });

  test('AC-IAM-004-02-04', async () => {
    // "time-based codes from an authenticator app are accepted as the second check"
    const customer = await byEmail('finance@example.com');
    await api.post('/api/identity/mfa/select', { customerId: customer.id, systemName: 'MultiFactorAuth.GoogleAuthenticator' });
    const started = await api.post('/api/identity/mfa/start', { customerId: customer.id });
    assert.equal(started.timeBased, true);
    const verified = await api.post('/api/identity/mfa/verify', { customerId: customer.id, code: started.demonstrationCode }, 'mfa-6');
    assert.equal(verified.ok, true);
    assert.equal(verified.secondFactor, 'time-based code');

    const providers = await api.get('/api/identity/mfa/providers');
    const bundled = providers.all.find((p) => p.systemName === 'MultiFactorAuth.GoogleAuthenticator');
    assert.equal(bundled.built, 'bundled with nopCommerce', 'the bundled plugin is reused, not rebuilt');
  });

  test('AC-IAM-004-03-01', async () => {
    // "the buyer selects one of the active providers and later logins require it"
    const buyer = await byEmail('buyer@example.com');
    const selected = await api.post('/api/identity/mfa/select', { customerId: buyer.id, systemName: 'MultiFactorAuth.EmailCode' });
    assert.equal(selected.ok, true);
    const signIn = await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, 'mfa-7');
    assert.equal(signIn.secondFactorRequired, true, 'the selected factor is required at the next login');

    const refused = await api.post('/api/identity/mfa/select', { customerId: buyer.id, systemName: 'MultiFactorAuth.Nothing' });
    assert.equal(refused.ok, false, 'only an active provider can be selected');
  });

  test('AC-IAM-004-03-02', async () => {
    await saveSettingAsync('iam.mfarequiredroles', ['Administrators', 'SecurityOfficer'], 0);
    // "a buyer not in an MFA-required role can switch it off; a member of such a role cannot"
    const buyer = await byEmail('buyer@example.com');
    const off = await api.post('/api/identity/mfa/remove', { customerId: buyer.id, bySelf: true });
    assert.equal(off.ok, true);
    assert.equal(off.mustConfigureAgain, false);

    const admin = await byEmail('admin@example.com');
    const refused = await api.post('/api/identity/mfa/remove', { customerId: admin.id, bySelf: true });
    assert.equal(refused.ok, false);
    assert.equal(refused.requiredByRole, true);
    assert.match(refused.message, /cannot be switched off/);

    // the rest of the suite signs in as an administrator, so the role requirement is lifted again
    await saveSettingAsync('iam.mfarequiredroles', [], 0);
    await api.post('/api/identity/mfa/remove', { customerId: admin.id });
  });
});

/* ======================================================= PRD-IAM-005 single sign-on ===== */

describe('PRD-IAM-005 single sign-on', () => {
  test('AC-IAM-005-01-01', async () => {
    // "the user is matched through ExternalAuthenticationRecord or verified email and signed in;
    //  staff accounts are not created by sign-in alone"
    const staff = await byEmail('operations@example.com');
    await repository('Customer').updateAsync({ ...staff, emailVerified: true });
    const signedIn = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.OpenIdConnect', externalIdentifier: 'okta|ops-1', email: 'operations@example.com', mfaAsserted: true,
    }, 'sso-1');
    assert.equal(signedIn.ok, true);
    assert.equal(signedIn.matchedBy, 'verified email');

    const again = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.OpenIdConnect', externalIdentifier: 'okta|ops-1', mfaAsserted: true,
    }, 'sso-1');
    assert.equal(again.matchedBy, 'ExternalAuthenticationRecord', 'the record matches on the next sign-in');

    const unknown = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.OpenIdConnect', externalIdentifier: 'okta|nobody', email: 'nobody.at.all@example.com',
    }, 'sso-2');
    assert.equal(unknown.ok, false);
    assert.equal(unknown.accountCreated, false);
    assert.match(unknown.message, /created by provisioning, not by signing in/);
  });

  test('AC-IAM-005-01-02', async () => {
    // "the native external-authentication error flow runs and the error is logged when LogErrors
    //  is on"
    await saveSettingAsync('externalauthenticationsettings.logerrors', true, 0);
    const failed = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.Saml2', externalIdentifier: 'x', error: 'invalid_assertion',
    });
    assert.equal(failed.ok, false);
    assert.equal(failed.externalError, true);
    assert.equal(failed.logged, true);
    assert.equal(failed.nativeFlow, 'ExternalAuthenticationError');

    const log = await api.get('/api/admin-console/log');
    assert.ok(log.some((l) => /External authentication error/.test(l.shortMessage ?? '')), 'the error is in the system log');
  });

  test('AC-IAM-005-01-03', async () => {
    await saveSettingAsync('iam.mfarequiredroles', ['Administrators', 'SecurityOfficer'], 0);
    // "the sign-in is accepted only if the provider asserts a multi-factor method; otherwise the
    //  IAM second factor is requested"
    const admin = await byEmail('admin@example.com');
    await repository('Customer').updateAsync({ ...admin, emailVerified: true });
    const withoutAssertion = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.Saml2', externalIdentifier: 'saml|admin', email: 'admin@example.com', mfaAsserted: false,
    }, 'sso-3');
    assert.equal(withoutAssertion.ok, false);
    assert.equal(withoutAssertion.secondFactorRequired, true);
    assert.match(withoutAssertion.reason, /did not assert a multi-factor method/);

    const withAssertion = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.OpenIdConnect', externalIdentifier: 'okta|admin', email: 'admin@example.com', mfaAsserted: true,
    }, 'sso-4');
    assert.equal(withAssertion.ok, true, 'the provider asserted it, so no second prompt');
    await saveSettingAsync('iam.mfarequiredroles', [], 0);
  });

  test('AC-IAM-005-02-01', async () => {
    // "the customer is set inactive and RequireReLogin is set, so open sessions end"
    await api.post('/api/identity/sign-in', { email: 'support@example.com', password: 'demo' }, 'sso-5');
    const provisioned = await api.post('/api/identity/sso/provision', { action: 'deactivate', email: 'support@example.com' });
    assert.equal(provisioned.ok, true);
    assert.equal(provisioned.active, false);
    assert.equal(provisioned.requireReLogin, true);

    const customer = await byEmail('support@example.com');
    assert.equal(customer.active, false);
    const sessions = await api.get(`/api/identity/sessions?customerId=${customer.id}`);
    assert.ok(sessions.every((s) => s.status !== 'Active'), 'the open sessions ended');
    const trail = await api.get('/api/security/audit?event=AUD-IAM-008');
    assert.ok(trail.some((e) => e.entityId === String(customer.id)));
    await repository('Customer').updateAsync({
      ...customer, active: true, accountState: 'Active', requireReLogin: false,
    });
  });

  test('AC-IAM-005-02-02', async () => {
    // "the customer is created with the roles mapped from the groups"
    const created = await api.post('/api/identity/sso/provision', {
      action: 'create', email: 'new.staff@example.com', firstName: 'New', lastName: 'Staff', groups: ['post-finance', 'post-operations'],
    });
    assert.equal(created.ok, true);
    assert.deepEqual(created.rolesFromGroups.sort(), ['Finance', 'Operations']);
    assert.deepEqual(created.customer.roles.sort(), ['Finance', 'Operations']);
  });

  test('AC-IAM-005-03-01', async () => {
    // "a company with its own provider signs the member in and links them to that company"
    const company = await repository('Company').insertAsync({
      name: 'Phiri Wholesale Ltd', registrationNo: 'MW-4421', status: 'Active', identityProvider: 'ExternalAuth.OpenIdConnect',
    });
    const buyer = await byEmail('company.buyer@example.com');
    await repository('Customer').updateAsync({ ...buyer, emailVerified: true });
    const signedIn = await api.post('/api/identity/sso/sign-in', {
      providerSystemName: 'ExternalAuth.OpenIdConnect', externalIdentifier: 'okta|company-buyer', email: 'company.buyer@example.com', companyId: company.id, mfaAsserted: true,
    }, 'sso-6');
    assert.equal(signedIn.ok, true);
    assert.equal(signedIn.companyId, company.id);
    const member = await repository('CompanyMember').getOneAsync((m) => m.companyId === company.id && m.customerId === buyer.id);
    assert.ok(member, 'the member is linked to the company');
  });
});

/* ========================================================== PRD-IAM-006 sessions ======== */

describe('PRD-IAM-006 session management', () => {
  test('AC-IAM-006-01-01', async () => {
    // "the next request is treated as signed out, the record becomes Expired and the login page
    //  shows Iam.SessionExpired"
    await saveSettingAsync('iam.idletimeoutminutes.buyer', 60, 0);
    await api.post('/api/identity/sign-in', { email: 'company.buyer@example.com', password: 'demo' }, 'sess-1');
    const { ageSessionAsync } = await import('../../packages/server/src/plugins/product-iam/services/sessions.js');
    await ageSessionAsync({ sessionId: 'sess-1', minutes: 120 });

    const check = await api.post('/api/identity/sessions/check', {}, 'sess-1');
    assert.equal(check.valid, false);
    assert.equal(check.status, 'Expired');
    assert.equal(check.messageKey, 'Iam.SessionExpired');
    assert.equal(check.message, 'You were logged out because you were inactive. Please log in again.');
  });

  test('AC-IAM-006-01-02', async () => {
    // "the session stays valid and its last-activity time moves forward with each request"
    await api.post('/api/identity/sign-in', { email: 'company.buyer@example.com', password: 'demo' }, 'sess-2');
    const first = await api.post('/api/identity/sessions/check', {}, 'sess-2');
    assert.equal(first.valid, true);
    await new Promise((r) => { setTimeout(r, 15); });
    const second = await api.post('/api/identity/sessions/check', {}, 'sess-2');
    assert.equal(second.valid, true);
    assert.ok(new Date(second.session.lastActivityUtc) > new Date(first.session.lastActivityUtc),
      'the last-activity time moved forward');
  });

  test('AC-IAM-006-01-03', async () => {
    // "the session still ends, because the check is on the server session record, not the cookie"
    await api.post('/api/identity/sign-in', { email: 'company.buyer@example.com', password: 'demo', rememberMe: true }, 'sess-3');
    const { ageSessionAsync } = await import('../../packages/server/src/plugins/product-iam/services/sessions.js');
    await ageSessionAsync({ sessionId: 'sess-3', minutes: 600 });
    const check = await api.post('/api/identity/sessions/check', {}, 'sess-3');
    assert.equal(check.valid, false);
    assert.equal(check.status, 'Expired', 'a persistent cookie does not keep the server session alive');
  });

  test('AC-IAM-006-02-01', async () => {
    // "the oldest session is revoked, or the new login is refused with Iam.SessionLimitReached, as
    //  the setting says"
    await saveSettingAsync('iam.concurrentsessionlimit', 2, 0);
    await saveSettingAsync('iam.concurrentsessionlimitaction', 'revoke-oldest', 0);
    const email = 'approver@example.com';
    await api.post('/api/identity/sign-in', { email, password: 'demo' }, 'limit-a');
    await api.post('/api/identity/sign-in', { email, password: 'demo' }, 'limit-b');
    await api.post('/api/identity/sign-in', { email, password: 'demo' }, 'limit-c');
    const customer = await byEmail(email);
    let sessions = await api.get(`/api/identity/sessions?customerId=${customer.id}`);
    assert.equal(sessions.filter((s) => s.status === 'Active').length, 2, 'the limit holds');
    assert.ok(sessions.some((s) => s.revokedReason === 'the concurrent-session limit was reached'));

    await saveSettingAsync('iam.concurrentsessionlimitaction', 'refuse', 0);
    const refused = await api.post('/api/identity/sign-in', { email, password: 'demo' }, 'limit-d');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Iam.SessionLimitReached');
    assert.equal(refused.message, 'You are logged in on too many devices. Log out elsewhere and try again.');
    await saveSettingAsync('iam.concurrentsessionlimit', 10, 0);
    await saveSettingAsync('iam.concurrentsessionlimitaction', 'revoke-oldest', 0);
  });

  test('AC-IAM-006-03-01', async () => {
    // "all session records of U are revoked, RequireReLogin is set so every open cookie is
    //  rejected, and AUD-IAM-005 is written"
    const email = 'approver@example.com';
    await repository('Customer').updateAsync({ ...(await byEmail(email)), requireReLogin: false });
    const signedIn = await api.post('/api/identity/sign-in', { email, password: 'demo' }, 'force-1');
    assert.equal(signedIn.ok, true, 'the user is signed in before the officer forces them off');
    const customer = await byEmail(email);

    const denied = await api.post('/api/identity/sessions/force-logout', { customerId: customer.id }, SESSIONS.catalogue);
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Identity.Core.Sessions.CreateEditDelete');

    const forced = await api.post('/api/identity/sessions/force-logout', { customerId: customer.id, reason: 'suspected compromise' }, SESSIONS.admin);
    assert.equal(forced.ok, true);
    assert.ok(forced.revoked >= 1);
    assert.equal((await byEmail(email)).requireReLogin, true);

    const check = await api.post('/api/identity/sessions/check', {}, 'force-1');
    assert.equal(check.valid, false, 'the open cookie is rejected');
    const trail = await api.get('/api/security/audit?event=AUD-IAM-005');
    assert.ok(trail.some((e) => e.note === 'suspected compromise'));
  });

  test('AC-IAM-006-03-02', async () => {
    // "only that session is revoked; other sessions of U continue"
    const email = 'depot.nairobi@example.com';
    const customer = await byEmail(email) ?? await byEmail('logistics@example.com');
    // the second-factor criteria above selected a provider for this account; this one is about
    // sessions, so the account starts from a clean state
    await repository('Customer').updateAsync({
      ...customer, requireReLogin: false, mfaProvider: null, mfaEnabled: false,
    });
    await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, 'one-a');
    await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, 'one-b');
    const sessions = await api.get(`/api/identity/sessions?customerId=${customer.id}`);
    const active = sessions.filter((s) => s.status === 'Active');
    assert.ok(active.length >= 2);

    const revoked = await api.post(`/api/identity/sessions/${active[0].sessionId}/revoke`, {}, SESSIONS.admin);
    assert.equal(revoked.ok, true);
    const after2 = await api.get(`/api/identity/sessions?customerId=${customer.id}`);
    assert.equal(after2.find((s) => s.sessionId === active[0].sessionId).status, 'Revoked');
    assert.ok(after2.some((s) => s.sessionId === active[1].sessionId && s.status === 'Active'), 'the other session continues');
    assert.notEqual((await byEmail(customer.email)).requireReLogin, true, 'ending one session is not a forced logout');
  });

  test('AC-IAM-006-04-01', async () => {
    // "the user is signed in again with a new session identifier and the old record is revoked"
    const email = 'logistics@example.com';
    const customer = await byEmail(email);
    await repository('Customer').updateAsync({
      ...customer, requireReLogin: false, mfaProvider: null, mfaEnabled: false,
    });
    await api.post('/api/identity/sign-in', { email, password: 'demo' }, 'rotate-1');
    const before2 = (await api.get(`/api/identity/sessions?customerId=${customer.id}`)).filter((s) => s.status === 'Active');

    const rotated = await api.post('/api/identity/sessions/rotate', { customerId: customer.id, reason: 'password changed' }, 'rotate-1');
    assert.equal(rotated.ok, true);
    assert.ok(rotated.session.sessionId);
    assert.ok(!before2.some((s) => s.sessionId === rotated.session.sessionId), 'a new session identifier');
    const after2 = await api.get(`/api/identity/sessions?customerId=${customer.id}`);
    for (const old of before2) {
      assert.equal(after2.find((s) => s.sessionId === old.sessionId).status, 'Revoked', 'the old record is revoked');
    }
  });
});

/* ========================================================= PRD-IAM-013 passkeys ========= */

describe('PRD-IAM-013 passwordless and biometric login', () => {
  test('AC-IAM-013-01-01', async () => {
    // "the public key credential is stored for the user and listed under My account, where it can
    //  be removed"
    const session = 'passkey-1';
    await repository('Customer').updateAsync({ ...(await byEmail('buyer@example.com')), requireReLogin: false, mfaProvider: null });
    await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, session);
    const registered = await api.post('/api/identity/passkeys', { deviceName: 'Pixel 8' }, session);
    assert.equal(registered.ok, true);
    assert.ok(registered.passkey.credentialId);
    assert.ok(registered.passkey.publicKey);

    const listed = await api.get('/api/identity/passkeys', session);
    assert.ok(listed.some((k) => k.credentialId === registered.passkey.credentialId), 'listed under My account');

    const removed = await api.del(`/api/identity/passkeys/${registered.passkey.credentialId}`, session);
    assert.equal(removed.ok, true);
    const after2 = await api.get('/api/identity/passkeys', session);
    assert.equal(after2.some((k) => k.credentialId === registered.passkey.credentialId), false);
  });

  test('AC-IAM-013-01-02', async () => {
    // "the user is signed in without a password"
    const session = 'passkey-2';
    await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, session);
    const registered = await api.post('/api/identity/passkeys', { deviceName: 'iPhone 15' }, session);
    await api.post('/api/identity/sign-out', {}, session);

    const signedIn = await api.post('/api/identity/passkeys/sign-in', { credentialId: registered.passkey.credentialId }, 'passkey-3');
    assert.equal(signedIn.ok, true);
    assert.equal(signedIn.withPassword, false);
    assert.equal(signedIn.customer.email, 'buyer@example.com');
  });

  test('AC-IAM-013-01-03', async () => {
    // "password and one-time code login remain available"
    const unsupported = await api.get('/api/identity/passkeys/support?deviceSupports=false');
    assert.equal(unsupported.offered, false);
    assert.deepEqual(unsupported.fallbacks, ['password', 'one-time code']);
    assert.match(unsupported.reason, /does not support passkeys/);

    const signedIn = await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, 'passkey-4');
    assert.equal(signedIn.ok, true, 'password login still works');
  });

  test('AC-IAM-013-01-04', async () => {
    await saveSettingAsync('iam.mfarequiredroles', ['Administrators', 'SecurityOfficer'], 0);
    // "the login completes and no second-factor prompt is shown, because the passkey user
    //  verification counts as the second factor"
    const admin = await byEmail('admin@example.com');
    await repository('Customer').updateAsync({ ...admin, requireReLogin: false });
    const registered = await api.post('/api/identity/passkeys', { customerId: admin.id, deviceName: 'Admin laptop' });

    const signedIn = await api.post('/api/identity/passkeys/sign-in', {
      credentialId: registered.passkey.credentialId, userVerified: true,
    }, 'passkey-5');
    assert.equal(signedIn.ok, true, 'no second-factor prompt for an MFA-required role');
    assert.equal(signedIn.userVerified, true);
    assert.equal(signedIn.secondFactorRequired, undefined);

    // without user verification the second factor is still asked for
    const notVerified = await api.post('/api/identity/passkeys/sign-in', {
      credentialId: registered.passkey.credentialId, userVerified: false,
    }, 'passkey-6');
    assert.equal(notVerified.secondFactorRequired, true);
    await saveSettingAsync('iam.mfarequiredroles', [], 0);
  });
});
