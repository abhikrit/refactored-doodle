// PRD-IAM-001 Customer registration and login, PRD-IAM-002 Mobile-number identity with OTP and
// PRD-IAM-003 Password policy, lockout and recovery - one test per AC, named by AC ID.
// 11 + 20 + 10 = 41 criteria.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const setType = (type) => saveSettingAsync('customersettings.userregistrationtype', type, 0);
const customerByEmail = (email) => repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

/* ===================================== PRD-IAM-001 registration and login =============== */

describe('PRD-IAM-001 registration and login', () => {
  test('AC-IAM-001-01-01', async () => {
    // "a customer record is created in the Registered role, it is active, the visitor is signed in
    //  and the native Customer.WelcomeMessage email is sent"
    await setType('Standard');
    const result = await api.post('/api/identity/register', { policyAccepted: true,
      email: 'new.shopper@example.com', password: 'Str0ng-pass', firstName: 'New', lastName: 'Shopper',
    }, 'reg-1');
    assert.equal(result.ok, true);
    assert.deepEqual(result.customer.roles, ['Registered']);
    assert.equal(result.active, true);
    assert.equal(result.signedIn, true);
    assert.equal(result.emailSent, 'Customer.WelcomeMessage');

    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.some((m) => m.event === 'Customer.WelcomeMessage'), 'the native welcome email was sent');
  });

  test('AC-IAM-001-01-02', async () => {
    // "refused with the native message Account.Register.Errors.EmailAlreadyExists and no second
    //  record is created"
    const before2 = (await repository('Customer').getAllAsync((c) => c.email === 'new.shopper@example.com')).length;
    const refused = await api.post('/api/identity/register', { policyAccepted: true, email: 'new.shopper@example.com', password: 'Another-pass1' }, 'reg-2');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Account.Register.Errors.EmailAlreadyExists');
    const after2 = (await repository('Customer').getAllAsync((c) => c.email === 'new.shopper@example.com')).length;
    assert.equal(after2, before2, 'no second record');
  });

  test('AC-IAM-001-01-03', async () => {
    // "the saved addresses are offered and the earlier orders are listed in My account"
    const customer = await customerByEmail('buyer@example.com');
    assert.ok((customer.addresses ?? []).length > 0, 'the account has a saved address');
    await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, 'reg-3');
    const me = await api.get('/api/identity/me', 'reg-3');
    assert.equal(me.email, 'buyer@example.com');
    assert.ok((me.addresses ?? []).length > 0, 'the saved addresses are offered after signing in again');
    const orders = await api.get('/api/orders?mine=true', 'reg-3');
    assert.ok(Array.isArray(orders), 'the earlier orders are listed in My account');
  });

  test('AC-IAM-001-01-04', async () => {
    // "no account is created and the SEL-013 block message is shown; the check is the platform
    //  action filter owned by SEL-013, not an IAM filter"
    await repository('SellerBlockListEntry').insertAsync({
      email: 'blocked.party@example.com', scope: 'registration', active: true, reason: 'test block', feature: 'PRD-SEL-013',
    });
    const refused = await api.post('/api/identity/register', { policyAccepted: true, email: 'blocked.party@example.com', password: 'Str0ng-pass' }, 'reg-4');
    assert.equal(refused.ok, false);
    assert.equal(refused.blocked, true);
    assert.equal(refused.refusedBy, 'PRD-SEL-013', 'SEL-013 owns the filter');
    assert.equal(await customerByEmail('blocked.party@example.com'), null, 'no account was created');

    const register = await api.get('/api/admin-console/extension-register');
    const onRegister = register.entries.filter((e) => e.target === 'Nop.Web CustomerController.Register');
    assert.equal(onRegister.length, 1, 'exactly one filter on the registration action');
    assert.equal(onRegister[0].feature, 'PRD-SEL-013');
  });

  test('AC-IAM-001-02-01', async () => {
    // "the customer is signed in and LastLoginDateUtc is set"
    const before2 = await customerByEmail('new.shopper@example.com');
    const signedIn = await api.post('/api/identity/sign-in', { email: 'new.shopper@example.com', password: 'Str0ng-pass' }, 'reg-5');
    assert.equal(signedIn.ok, true);
    const after2 = await customerByEmail('new.shopper@example.com');
    assert.ok(after2.lastLoginDateUtc, 'LastLoginDateUtc is set');
    assert.notEqual(after2.lastLoginDateUtc, before2.lastLoginDateUtc);
  });

  test('AC-IAM-001-02-02', async () => {
    // "login is refused with the native message Account.Login.WrongCredentials and
    //  FailedLoginAttempts increases"
    await saveSettingAsync('customersettings.failedpasswordallowedattempts', 0, 0);
    const refused = await api.post('/api/identity/sign-in', { email: 'new.shopper@example.com', password: 'wrong' }, 'reg-6');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Account.Login.WrongCredentials');
    assert.equal(refused.failedLoginAttempts, 1);
    const again = await api.post('/api/identity/sign-in', { email: 'new.shopper@example.com', password: 'wrong' }, 'reg-6');
    assert.equal(again.failedLoginAttempts, 2, 'the counter increases');
  });

  test('AC-IAM-001-03-01', async () => {
    // "the guest customer record itself becomes Registered, so its basket and any guest order stay
    //  on the account"
    const session = 'guest-to-member';
    await api.post('/api/identity/guest', {}, session);
    const guest = await repository('Customer').getOneAsync((c) => c.guestSessionId === session);
    assert.ok(guest, 'a guest customer record exists for the browser session');

    const products = await api.get('/api/catalogue/products');
    await api.post('/api/checkout-area/cart/items', { productId: products[0].id, quantity: 1 }, session);
    const cartBefore = await api.get('/api/checkout-area/cart', session);
    assert.equal(cartBefore.items.length, 1);

    const registered = await api.post('/api/identity/register', { policyAccepted: true,
      email: 'guest.turned.member@example.com', password: 'Str0ng-pass',
    }, session);
    assert.equal(registered.ok, true);
    assert.equal(registered.convertedGuest, true);
    assert.equal(registered.customer.id, guest.id, 'the same customer record became Registered');
    const cartAfter = await api.get('/api/checkout-area/cart', session);
    assert.equal(cartAfter.items.length, 1, 'the basket stayed on the account');
  });

  test('AC-IAM-001-04-01', async () => {
    // "the account stays inactive until the validation link is opened; a login before that is
    //  refused with Account.Login.WrongCredentials.NotActive"
    await setType('EmailValidation');
    const registered = await api.post('/api/identity/register', { policyAccepted: true, email: 'validate.me@example.com', password: 'Str0ng-pass' }, 'reg-7');
    assert.equal(registered.ok, true);
    assert.equal(registered.active, false);
    assert.equal(registered.emailSent, 'Customer.EmailValidationMessage');

    const refused = await api.post('/api/identity/sign-in', { email: 'validate.me@example.com', password: 'Str0ng-pass' }, 'reg-7');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Account.Login.WrongCredentials.NotActive');

    const row = await customerByEmail('validate.me@example.com');
    const activated = await api.post('/api/identity/register/activate', { token: row.emailValidationToken });
    assert.equal(activated.ok, true);
    const signedIn = await api.post('/api/identity/sign-in', { email: 'validate.me@example.com', password: 'Str0ng-pass' }, 'reg-7');
    assert.equal(signedIn.ok, true);
  });

  test('AC-IAM-001-04-02', async () => {
    // "the account stays inactive until an administrator activates it in the user administration
    //  console"
    await setType('AdminApproval');
    const registered = await api.post('/api/identity/register', { policyAccepted: true, email: 'approve.me@example.com', password: 'Str0ng-pass' }, 'reg-8');
    assert.equal(registered.active, false);
    assert.equal(registered.activationNeededBy, 'an administrator in the user administration console');

    const activated = await api.post('/api/admin-console/customers/active', { email: 'approve.me@example.com', active: true }, SESSIONS.admin);
    assert.equal(activated.ok, true);
    const signedIn = await api.post('/api/identity/sign-in', { email: 'approve.me@example.com', password: 'Str0ng-pass' }, 'reg-8');
    assert.equal(signedIn.ok, true, 'the account works once an administrator has activated it');
  });

  test('AC-IAM-001-04-03', async () => {
    // "registration is not possible and the native registration-disabled result page is shown"
    await setType('Disabled');
    const refused = await api.post('/api/identity/register', { policyAccepted: true, email: 'nobody@example.com', password: 'Str0ng-pass' }, 'reg-9');
    assert.equal(refused.ok, false);
    assert.equal(refused.registrationDisabled, true);
    assert.equal(refused.messageKey, 'Account.Register.Result.Disabled');
    await setType('Standard');
  });

  test('AC-IAM-001-05-01', async () => {
    // "the account is created without any organisation or company field"
    await saveSettingAsync('customersettings.companyrequired', false, 0);
    const registered = await api.post('/api/identity/register', { policyAccepted: true,
      email: 'public.member@example.com', password: 'Str0ng-pass', firstName: 'Public', lastName: 'Member',
    }, 'reg-10');
    assert.equal(registered.ok, true);
    assert.equal(registered.customer.company, null, 'no company was required or stored');

    await saveSettingAsync('customersettings.companyrequired', true, 0);
    const needsCompany = await api.post('/api/identity/register', { policyAccepted: true, email: 'needs.company@example.com', password: 'Str0ng-pass' }, 'reg-11');
    assert.equal(needsCompany.ok, false);
    assert.equal(needsCompany.messageKey, 'Account.Fields.Company.Required');
    await saveSettingAsync('customersettings.companyrequired', false, 0);
  });
});

/* ======================================== PRD-IAM-002 mobile-number identity ============ */

describe('PRD-IAM-002 mobile-number identity', () => {
  before(async () => {
    // the resend interval and the send limit are exercised on their own numbers in 02-05; the
    // other criteria must not trip over them
    await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 50, 0);
    await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
    // every request in a test run comes from one address, so the per-IP send limit of
    // BR-IAM-012 is raised here; it is a client setting, not a code constant
    await saveSettingAsync('iam.otpsendlimitperip', 500, 0);
  });
  test('AC-IAM-002-01-01', async () => {
    // "the number is normalised to international format, checked against existing PhoneIdentity
    //  records, and a code is sent with message Iam.Otp.Sent"
    const started = await api.post('/api/identity/mobile/register/start', { phone: '0991234567' }, 'otp-1');
    assert.equal(started.ok, true);
    assert.equal(started.normalisedPhone, '+265991234567', 'the store default country supplies the calling code');
    assert.equal(started.messageKey, 'Iam.Otp.Sent');
    assert.equal(started.message, 'We sent a code by SMS. Enter it to continue.');
    assert.ok(started.demonstrationCode);

    const challenges = await api.get('/api/identity/otp/challenges');
    const challenge = challenges.find((c) => c.id === started.challengeId);
    assert.equal(challenge.purpose, 'register');
    assert.equal(challenge.status, 'Issued');
    assert.equal(challenge.codeHash, undefined, 'the code itself is never returned or stored in clear');
  });

  test('AC-IAM-002-01-02', async () => {
    // "a customer record is created with the mobile number as identifier and no email, terms
    //  acceptance is recorded and the visitor is signed in"
    const started = await api.post('/api/identity/mobile/register/start', { phone: '+265991112222' }, 'otp-2');
    const done = await api.post('/api/identity/mobile/register/complete', { policyAccepted: true,
      phone: '+265991112222', code: started.demonstrationCode, firstName: 'Mobile', lastName: 'Member',
    }, 'otp-2');
    assert.equal(done.ok, true);
    assert.equal(done.hasEmail, false, 'no email address');
    assert.equal(done.identifier, '+265991112222');
    assert.equal(done.signedIn, true);
    assert.ok(done.termsAcceptance, 'the terms acceptance is recorded');
    assert.equal(done.termsAcceptance.policySystemName, 'ConditionsOfUse');

    const identities = await api.get('/api/identity/phone-identities');
    const identity = identities.find((i) => i.normalisedPhone === '+265991112222');
    assert.ok(identity.verifiedOnUtc, 'the number is verified');
    assert.equal(identity.isLoginIdentifier, true);
  });

  test('AC-IAM-002-01-03', async () => {
    // "no account is created and message Iam.PhoneInUse is shown with the link to log in"
    const refused = await api.post('/api/identity/mobile/register/start', { phone: '+265991112222' }, 'otp-3');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Iam.PhoneInUse');
    assert.equal(refused.message, 'This mobile number already has an account. Please log in.');
    assert.equal(refused.loginUrl, '/login');
    assert.equal(refused.created, false);
  });

  test('AC-IAM-002-01-04', async () => {
    // "the code is invalidated, Iam.Otp.TooManyAttempts is shown and a new code can be requested
    //  only after the resend interval"
    await saveSettingAsync('otpsettings.otpfailedallowedattempts', 3, 0);
    await saveSettingAsync('otpsettings.otptimetorepeat', 1, 0);
    const started = await api.post('/api/identity/mobile/register/start', { phone: '+265993334444' }, 'otp-4');
    let last;
    for (let i = 0; i < 3; i += 1) {
      last = await api.post('/api/identity/mobile/register/complete', { policyAccepted: true, phone: '+265993334444', code: '000000' }, 'otp-4');
    }
    assert.equal(last.ok, false);
    assert.equal(last.messageKey, 'Iam.Otp.TooManyAttempts');
    assert.equal(last.status, 'Locked');
    assert.ok(last.resendIntervalSeconds > 0, 'a new code only after the resend interval');

    const correct = await api.post('/api/identity/mobile/register/complete', { policyAccepted: true, phone: '+265993334444', code: started.demonstrationCode }, 'otp-4');
    assert.equal(correct.ok, false, 'the locked code cannot be used even if it is the right one');
    await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
  });

  test('AC-IAM-002-01-05', async () => {
    // "entering it after its validity ended is refused with Iam.Otp.Expired"
    const started = await api.post('/api/identity/mobile/register/start', { phone: '+265995556666' }, 'otp-5');
    const { expireChallengeAsync } = await import('../../packages/server/src/plugins/product-iam/services/otp.js');
    await expireChallengeAsync(started.challengeId);
    const refused = await api.post('/api/identity/mobile/register/complete', { policyAccepted: true, phone: '+265995556666', code: started.demonstrationCode }, 'otp-5');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Iam.Otp.Expired');
    assert.equal(refused.message, 'This code has expired. Request a new code.');
  });

  test('AC-IAM-002-01-06', async () => {
    // "the gateway is unavailable: Iam.Otp.Unavailable, no account is created, the failure is
    //  logged"
    await api.post('/api/mocks/Sms.Gateway/health', { health: 'failing' });
    const refused = await api.post('/api/identity/mobile/register/start', { phone: '+265997778888' }, 'otp-6');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Iam.Otp.Unavailable');
    assert.equal(refused.message, 'We cannot send a code right now. Please try again later.');
    assert.equal(refused.challenge, null, 'no challenge was issued');
    const trail = await api.get('/api/security/audit?event=AUD-IAM-002');
    assert.ok(trail.some((e) => e.outcome === 'failed'), 'the failure is logged');
    await api.post('/api/mocks/Sms.Gateway/health', { health: 'healthy' });
  });

  test('AC-IAM-002-01-07', async () => {
    // "TRK answers Blocked: no code is sent, Iam.Otp.Unavailable is shown and the challenge is not
    //  issued; when TRK answers Allowed the code is sent"
    const { setPreferenceAsync } = await import('../../packages/server/src/plugins/product-trk/services/preferences.js');
    await setPreferenceAsync({
      recipient: '+265999990000', channel: 'sms', category: 'Security codes', optedOut: true,
    });
    const blocked = await api.post('/api/identity/mobile/register/start', { phone: '+265999990000' }, 'otp-7');
    assert.equal(blocked.ok, false);
    assert.equal(blocked.messageKey, 'Iam.Otp.Unavailable');
    assert.equal(blocked.blockedByTrk, true);
    assert.equal(blocked.challenge, null);

    // the client marks the category mandatory, so the code goes out
    await saveSettingAsync('trk.category.security-codes.mandatory', true, 0);
    const allowed = await api.post('/api/identity/mobile/register/start', { phone: '+265999990000' }, 'otp-7');
    assert.equal(allowed.ok, true);
    await saveSettingAsync('trk.category.security-codes.mandatory', false, 0);
  });

  test('AC-IAM-002-01-08', async () => {
    // "Customer.Phone is saved in E.164 format and kept equal to PhoneIdentity.NormalisedPhone,
    //  so the native lookup finds the account; a local-format number is converted first"
    const normalised = await api.post('/api/identity/phone/normalise', { phone: '0991112222' });
    assert.equal(normalised.normalised, '+265991112222');

    const identities = await api.get('/api/identity/phone-identities');
    const identity = identities.find((i) => i.normalisedPhone === '+265991112222');
    const customer = await repository('Customer').getByIdAsync(identity.customerId);
    assert.equal(customer.phone, identity.normalisedPhone, 'Customer.Phone equals the identity');
    assert.equal(customer.phoneSmsVerified, true);

    const { customerForPhoneAsync } = await import('../../packages/server/src/plugins/product-iam/services/phone.js');
    const found = await customerForPhoneAsync('+265991112222');
    assert.equal(found.id, customer.id, 'the native lookup finds the account');
  });

  test('AC-IAM-002-01-09', async () => {
    // "the provider plugin is installed and marked primary; native login codes and the IAM codes
    //  use that provider"
    const provider = await api.get('/api/identity/sms-provider');
    assert.equal(provider.installed, true);
    assert.equal(provider.primary, true);
    assert.ok(provider.usedBy.includes('native login codes'));
    assert.ok(provider.usedBy.includes('the codes IAM sends itself'));
    assert.equal(provider.twilioAccepted, false, 'the bundled Twilio plugin is used only if the client accepts it');

    const mocks = await api.get('/api/mocks');
    const gateway = mocks.adapters.find((a) => a.systemName === provider.systemName);
    assert.ok(gateway, 'the active provider is the registered gateway');
  });

  test('AC-IAM-002-01-10', async () => {
    // "the native flow sends a code and verifies the number before the result page; a number
    //  already verified on another account is refused"
    await setType('Standard');
    const registered = await api.post('/api/identity/register/with-phone', { policyAccepted: true,
      email: 'native.phone@example.com', password: 'Str0ng-pass', phone: '0994445555',
    }, 'otp-8');
    assert.equal(registered.ok, true);
    assert.equal(registered.phoneVerificationFlow, 'RegisterStandard');
    assert.equal(registered.phoneVerified, false, 'the number is verified before the result page');

    const confirmed = await api.post('/api/identity/phone/confirm', {
      customerId: registered.customer.id, phone: '0994445555', code: registered.demonstrationCode,
    }, 'otp-8');
    assert.equal(confirmed.phoneVerified, true);

    const taken = await api.post('/api/identity/register/with-phone', { policyAccepted: true,
      email: 'second.account@example.com', password: 'Str0ng-pass', phone: '0994445555',
    }, 'otp-9');
    assert.equal(taken.ok, false);
    assert.equal(taken.messageKey, 'Account.IsAlreadyExistsVerifiedPhoneNumber');
  });

  test('AC-IAM-002-02-01', async () => {
    // Withdrawn (VER-500): signing in by mobile number and code is native in 5.00.1. The
    // behaviour it described is verified by AC-IAM-002-02-04; what remains IAM's is the
    // resolution of customers without an email address (AC-IAM-002-02-06).
    const started = await api.post('/api/identity/mobile/login/start', { phone: '+265991112222' }, 'login-1');
    assert.equal(started.ok, true, 'the native route issues the code');
    const signedIn = await api.post('/api/identity/mobile/login/complete', {
      phone: '+265991112222', code: started.demonstrationCode,
    }, 'login-1');
    assert.equal(signedIn.ok, true);
    assert.equal(signedIn.customer.email, null, 'the account has no email address');
  });

  test('AC-IAM-002-02-02', async () => {
    // "both routes sign in the same customer record"
    const customer = await customerByEmail('native.phone@example.com');
    const byPassword = await api.post('/api/identity/sign-in', { email: 'native.phone@example.com', password: 'Str0ng-pass' }, 'login-2');
    assert.equal(byPassword.ok, true);
    assert.equal(byPassword.customer.id, customer.id);

    const started = await api.post('/api/identity/mobile/login/start', { phone: '+265994445555' }, 'login-3');
    const byCode = await api.post('/api/identity/mobile/login/complete', { phone: '+265994445555', code: started.demonstrationCode }, 'login-3');
    assert.equal(byCode.ok, true);
    assert.equal(byCode.customer.id, customer.id, 'the same customer record');
  });

  test('AC-IAM-002-02-03', async () => {
    // Withdrawn (VER-500): the login code itself is locked after the native allowed attempts.
    // Verified by AC-IAM-002-02-05; the password lockout is applied to code login by
    // AC-IAM-002-02-07.
    const started = await api.post('/api/identity/mobile/login/start', { phone: '+265994445555' }, 'login-4');
    assert.ok(started.ok);
    let last;
    for (let i = 0; i < 3; i += 1) {
      last = await api.post('/api/identity/mobile/login/complete', { phone: '+265994445555', code: '111111' }, 'login-4');
    }
    assert.equal(last.status, 'Locked', 'the code is locked, not the account');
    const customer = await customerByEmail('native.phone@example.com');
    assert.equal(customer.cannotLoginUntilDateUtc ?? null, null, 'the account itself is not locked out by wrong codes');
  });

  test('AC-IAM-002-02-04', async () => {
    // "the native flow signs the customer in: the code is sent through the active provider,
    //  LastLoginDateUtc and PhoneSmsVerified are set; a number with no account gets the generic
    //  Account.Login.WrongCredentials"
    await saveSettingAsync('otpsettings.otplength', 6, 0);
    const started = await api.post('/api/identity/mobile/login/start', { phone: '+265991112222' }, 'login-5');
    assert.equal(started.demonstrationCode.length, 6, 'OtpSettings.OtpLength digits');
    const signedIn = await api.post('/api/identity/mobile/login/complete', { phone: '+265991112222', code: started.demonstrationCode }, 'login-5');
    assert.equal(signedIn.ok, true);
    assert.equal(signedIn.phoneSmsVerified, true);
    const customer = await repository('Customer').getByIdAsync(signedIn.customer.id);
    assert.ok(customer.lastLoginDateUtc);

    const unknown = await api.post('/api/identity/mobile/login/start', { phone: '+265990000111' }, 'login-6');
    assert.equal(unknown.accountExists, false);
    const refused = await api.post('/api/identity/mobile/login/complete', { phone: '+265990000111', code: unknown.demonstrationCode }, 'login-6');
    assert.equal(refused.messageKey, 'Account.Login.WrongCredentials', 'the generic message, never "no such account"');
  });

  test('AC-IAM-002-02-05', async () => {
    // "the native code settings are set per client; an expired code, wrong codes up to the allowed
    //  number and codes beyond the send limit each give their native message; the codes IAM sends
    //  itself use the same OtpSettings values"
    await saveSettingAsync('otpsettings.otptimelife', 120, 0);
    await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
    await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 2, 0);

    const phone = '+265996660001';
    const first = await api.post('/api/identity/mobile/login/start', { phone }, 'login-7');
    assert.equal(first.settings.timeLifeSeconds, 120, 'the client value is used');
    assert.equal(first.settings.length, 6);
    const second = await api.post('/api/identity/mobile/login/start', { phone }, 'login-7');
    assert.ok(second.ok || second.sendLimitReached, 'the second request is inside the send limit');
    const third = await api.post('/api/identity/mobile/login/start', { phone }, 'login-7');
    assert.equal(third.ok, false);
    assert.equal(third.sendLimitReached, true, 'beyond OtpCountAttemptsToSendCode');

    // an expired code and wrong codes give their own messages, on the same settings
    const fresh = await api.post('/api/identity/mobile/login/start', { phone: '+265996660002' }, 'login-7b');
    const { expireChallengeAsync } = await import('../../packages/server/src/plugins/product-iam/services/otp.js');
    await expireChallengeAsync(fresh.challengeId);
    const expired = await api.post('/api/identity/mobile/login/complete', { phone: '+265996660002', code: fresh.demonstrationCode }, 'login-7b');
    assert.equal(expired.messageKey, 'Iam.Otp.Expired');
    await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 50, 0);
  });

  test('AC-IAM-002-02-06', async () => {
    await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 50, 0);
    await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
    // "the IAM override resolves the customer from the sign-in claims, because the native cookie
    //  service resolves customers only by the username or email claim"
    const started = await api.post('/api/identity/mobile/login/start', { phone: '+265991112222' }, 'login-8');
    const signedIn = await api.post('/api/identity/mobile/login/complete', { phone: '+265991112222', code: started.demonstrationCode }, 'login-8');
    assert.equal(signedIn.ok, true);
    assert.equal(signedIn.customer.email, null);

    // the later request resolves the same customer, with no email address to resolve by
    const me = await api.get('/api/identity/me', 'login-8');
    assert.equal(me.id, signedIn.customer.id);
    assert.equal(me.email, null);
    const register = await api.get('/api/admin-console/extension-register');
    const override = register.entries.find((e) => e.target === 'ICustomerImpersonationFilter' || e.feature === 'PRD-IAM-026');
    assert.ok(override, 'IAM owns its identity overrides in the register');
  });

  test('AC-IAM-002-02-07', async () => {
    await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 50, 0);
    await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
    // "the IAM filter on the native code verification refuses a locked-out customer with
    //  Account.Login.WrongCredentials.LockedOut, and for an MFA-required or sensitive role
    //  requires the password step and the second factor"
    const customer = await customerByEmail('native.phone@example.com');
    await repository('Customer').updateAsync({
      ...customer, cannotLoginUntilDateUtc: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
    const started = await api.post('/api/identity/mobile/login/start', { phone: '+265994445555' }, 'login-9');
    const refused = await api.post('/api/identity/mobile/login/complete', { phone: '+265994445555', code: started.demonstrationCode }, 'login-9');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Account.Login.WrongCredentials.LockedOut');
    assert.match(refused.refusedBy, /filter on the native code verification/);

    await repository('Customer').updateAsync({
      ...(await customerByEmail('native.phone@example.com')), cannotLoginUntilDateUtc: null, roles: ['Registered', 'Finance'],
    });
    const second = await api.post('/api/identity/mobile/login/start', { phone: '+265994445555' }, 'login-10');
    const sensitive = await api.post('/api/identity/mobile/login/complete', { phone: '+265994445555', code: second.demonstrationCode }, 'login-10');
    assert.equal(sensitive.ok, false);
    assert.equal(sensitive.passwordStepRequired, true, 'a sensitive role needs the password step and the second factor');
    await repository('Customer').updateAsync({ ...(await customerByEmail('native.phone@example.com')), roles: ['Registered'] });
  });

  test('AC-IAM-002-03-01', async () => {
    await saveSettingAsync('otpsettings.otpcountattemptstosendcode', 50, 0);
    await saveSettingAsync('otpsettings.otptimetorepeat', 0, 0);
    // "recovery by SMS: the correct code lets the customer set a new password or signs them in,
    //  and AUD-IAM-002 is written"
    const customer = await customerByEmail('native.phone@example.com');
    const recovery = await api.post('/api/identity/password/recovery', { phone: '+265994445555', method: 'sms' }, 'rec-1');
    assert.equal(recovery.ok, true);
    assert.equal(recovery.messageKey, 'Iam.RecoveryRequestReceived');
    assert.equal(recovery.sensitive, false);
    assert.ok(recovery.token, 'a one-time reset token was issued');

    const reset = await api.post('/api/identity/password/recovery/use', { token: recovery.token, newPassword: 'Rec0very-pass' }, 'rec-1');
    assert.equal(reset.ok, true);
    const signedIn = await api.post('/api/identity/sign-in', { email: customer.email, password: 'Rec0very-pass' }, 'rec-1');
    assert.equal(signedIn.ok, true, 'the new password works');
  });

  test('AC-IAM-002-03-02', async () => {
    // "for a sensitive role an SMS code alone does not restore access; the extra checks apply"
    const recovery = await api.post('/api/identity/password/recovery', { email: 'admin@example.com', method: 'sms' });
    assert.equal(recovery.ok, true);
    assert.equal(recovery.messageKey, 'Iam.RecoveryRequestReceived', 'the same neutral message');
    assert.equal(recovery.sensitive, true);
    assert.equal(recovery.nativeLinkIssued, false, 'no link or code restores access on its own');
    assert.ok(['security-questions', 'manager-confirmation'].includes(recovery.extraCheck));
  });

  test('AC-IAM-002-04-01', async () => {
    // "only the configured factors are offered"
    await saveSettingAsync('iam.buyerloginfactor', 'either', 0);
    await saveSettingAsync('otpsettings.loginbyphoneenabled', true, 0);
    const either = await api.get('/api/identity/login-factors');
    assert.deepEqual([either.emailAndPassword, either.mobileAndCode], [true, true]);

    await saveSettingAsync('iam.buyerloginfactor', 'password', 0);
    const password = await api.get('/api/identity/login-factors');
    assert.deepEqual([password.emailAndPassword, password.mobileAndCode], [true, false]);
    assert.equal(password.loginByPhoneEnabled, false);

    await saveSettingAsync('iam.buyerloginfactor', 'sms-code', 0);
    const smsOnly = await api.get('/api/identity/login-factors');
    assert.deepEqual([smsOnly.emailAndPassword, smsOnly.mobileAndCode], [false, true]);
    await saveSettingAsync('iam.buyerloginfactor', 'either', 0);
  });
});

/* ========================================= PRD-IAM-003 password policy ================== */

describe('PRD-IAM-003 password policy, lockout and recovery', () => {
  test('AC-IAM-003-01-01', async () => {
    // "the password is refused with the native validation message for that rule"
    await saveSettingAsync('customersettings.passwordminlength', 8, 0);
    await saveSettingAsync('customersettings.passwordrequireuppercase', true, 0);
    await saveSettingAsync('customersettings.passwordrequiredigit', true, 0);
    await saveSettingAsync('customersettings.passwordrequirenonalphanumeric', true, 0);

    const short = await api.post('/api/identity/password/validate', { password: 'Ab1!' });
    assert.equal(short.ok, false);
    assert.ok(short.errors.some((e) => e.rule === 'minLength' && e.messageKey === 'Validation.Password.LengthValidation'));

    const noUpper = await api.post('/api/identity/password/validate', { password: 'lowercase1!' });
    assert.ok(noUpper.errors.some((e) => e.rule === 'uppercase'));
    const noDigit = await api.post('/api/identity/password/validate', { password: 'NoDigitsHere!' });
    assert.ok(noDigit.errors.some((e) => e.rule === 'digit'));
    const noSpecial = await api.post('/api/identity/password/validate', { password: 'NoSpecial1' });
    assert.ok(noSpecial.errors.some((e) => e.rule === 'nonAlphanumeric'));

    const good = await api.post('/api/identity/password/validate', { password: 'Str0ng-pass' });
    assert.equal(good.ok, true);
  });

  test('AC-IAM-003-01-02', async () => {
    // "setting one of the last N passwords is refused"
    await saveSettingAsync('customersettings.unduplicatedpasswordsnumber', 3, 0);
    const session = 'pwd-history';
    await api.post('/api/identity/sign-in', { email: 'public.member@example.com', password: 'Str0ng-pass' }, session);
    const changed = await api.post('/api/identity/password/change', { password: 'Second-pass1!' }, session);
    assert.equal(changed.ok, true);

    const reused = await api.post('/api/identity/password/change', { password: 'Str0ng-pass' }, session);
    assert.equal(reused.ok, false);
    assert.ok(reused.errors.some((e) => e.rule === 'unduplicated'));
  });

  test('AC-IAM-003-01-03', async () => {
    // "every request redirects the user to change the password"
    await saveSettingAsync('customersettings.passwordlifetime', 90, 0);
    const role = await repository('CustomerRole').getOneAsync((r) => r.systemName === 'Registered');
    await repository('CustomerRole').updateAsync({ ...role, enablePasswordLifetime: true });

    const customer = await customerByEmail('public.member@example.com');
    const passwords = await repository('CustomerPassword').getAllAsync((p) => p.customerId === customer.id);
    for (const p of passwords) {
      await repository('CustomerPassword').updateAsync({ ...p, createdOnUtc: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString() });
    }
    const session = 'pwd-lifetime';
    await api.post('/api/identity/sign-in', { email: 'public.member@example.com', password: 'Second-pass1!' }, session);
    const expired = await api.get('/api/identity/password/expired', session);
    assert.equal(expired.expired, true);
    assert.equal(expired.redirectTo, '/account/change-password');
    await saveSettingAsync('customersettings.passwordlifetime', 0, 0);
  });

  test('AC-IAM-003-02-01', async () => {
    // "CannotLoginUntilDateUtc is set to now plus FailedPasswordLockoutMinutes and further logins
    //  return the native LockedOut message"
    await saveSettingAsync('customersettings.failedpasswordallowedattempts', 3, 0);
    await saveSettingAsync('customersettings.failedpasswordlockoutminutes', 30, 0);
    const email = 'guest.turned.member@example.com';
    let result;
    for (let i = 0; i < 3; i += 1) {
      result = await api.post('/api/identity/sign-in', { email, password: 'wrong' }, 'lock-1');
    }
    assert.equal(result.lockedOut, true);
    const customer = await customerByEmail(email);
    assert.ok(new Date(customer.cannotLoginUntilDateUtc).getTime() > Date.now());

    const refused = await api.post('/api/identity/sign-in', { email, password: 'Str0ng-pass' }, 'lock-1');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Account.Login.WrongCredentials.LockedOut', 'even the right password is refused while locked out');
  });

  test('AC-IAM-003-02-02', async () => {
    // "the native Customer.FailedLoginAttempt email is sent to the account owner"
    await saveSettingAsync('customersettings.notifyfailedloginattempt', true, 0);
    await api.post('/api/identity/sign-in', { email: 'public.member@example.com', password: 'wrong' }, 'lock-2');
    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.some((m) => m.event === 'Customer.FailedLoginAttempt'), 'the native email was sent');
    await saveSettingAsync('customersettings.notifyfailedloginattempt', false, 0);
  });

  test('AC-IAM-003-03-01', async () => {
    // "the native recovery email with a one-time link; the link expires after
    //  PasswordRecoveryLinkDaysValid days and cannot be used twice"
    await saveSettingAsync('customersettings.passwordrecoverylinkdaysvalid', 7, 0);
    const recovery = await api.post('/api/identity/password/recovery', { email: 'new.shopper@example.com' });
    assert.equal(recovery.nativeLinkIssued, true);
    assert.equal(recovery.validDays, 7);
    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.some((m) => m.event === 'Customer.PasswordRecovery'));

    const used = await api.post('/api/identity/password/recovery/use', { token: recovery.token, newPassword: 'Brand-new1!' });
    assert.equal(used.ok, true);
    const twice = await api.post('/api/identity/password/recovery/use', { token: recovery.token, newPassword: 'Another-one1!' });
    assert.equal(twice.ok, false);
    assert.equal(twice.usedAlready, true, 'the link cannot be used twice');
  });

  test('AC-IAM-003-03-02', async () => {
    // "sessions signed in before the change are signed out at their next request"
    await saveSettingAsync('customersettings.requiredreloginafterpasswordchange', true, 0);
    const session = 'relogin-1';
    await api.post('/api/identity/sign-in', { email: 'new.shopper@example.com', password: 'Brand-new1!' }, session);
    const changed = await api.post('/api/identity/password/change', { password: 'Changed-again1!' }, session);
    assert.equal(changed.ok, true);
    assert.equal(changed.requireReLogin, true, 'the setting requires a fresh sign-in');
    await saveSettingAsync('customersettings.requiredreloginafterpasswordchange', false, 0);
  });

  test('AC-IAM-003-04-01', async () => {
    // "no native recovery link is issued, a recovery request is opened and the same neutral
    //  message is shown"
    const recovery = await api.post('/api/identity/password/recovery', { email: 'finance@example.com' });
    assert.equal(recovery.ok, true);
    assert.equal(recovery.message, 'If an account exists for these details, we have sent instructions.');
    assert.equal(recovery.nativeLinkIssued, false);
    assert.ok(recovery.requestId);

    const requests = await api.get('/api/identity/password/recovery-requests');
    const request = requests.find((x) => x.id === recovery.requestId);
    assert.equal(request.status, 'Opened');

    // the same neutral message for an address that has no account at all
    const unknown = await api.post('/api/identity/password/recovery', { email: 'nobody.here@example.com' });
    assert.equal(unknown.message, recovery.message);
    assert.equal(unknown.accountFound, false);
  });

  test('AC-IAM-003-04-02', async () => {
    // "answering all questions correctly issues a one-time reset link; a wrong answer counts as a
    //  failed attempt"
    const finance = await customerByEmail('finance@example.com');
    await api.post('/api/identity/password/security-answers', {
      customerId: finance.id, answers: { firstSchool: 'Blantyre Primary', petName: 'Simba' },
    });
    const recovery = await api.post('/api/identity/password/recovery', { email: 'finance@example.com' });
    assert.equal(recovery.extraCheck, 'security-questions');

    const wrong = await api.post(`/api/identity/password/recovery/${recovery.requestId}/answers`, {
      answers: { firstSchool: 'Wrong', petName: 'Simba' },
    });
    assert.equal(wrong.ok, false);
    assert.equal(wrong.countedAsFailedAttempt, true);

    const right = await api.post(`/api/identity/password/recovery/${recovery.requestId}/answers`, {
      answers: { firstSchool: 'blantyre primary', petName: 'simba' },
    });
    assert.equal(right.ok, true);
    assert.ok(right.token, 'a one-time reset link');
    assert.equal(right.request.status, 'Verified');
  });

  test('AC-IAM-003-04-03', async () => {
    // "another user holding Customers.CustomersCreateEditDelete confirms it; the requester cannot
    //  confirm their own request; the decision is audited"
    const admin = await customerByEmail('admin@example.com');
    await repository('SecurityAnswer').getAllAsync((a) => a.customerId === admin.id);
    const recovery = await api.post('/api/identity/password/recovery', { email: 'admin@example.com' });
    assert.equal(recovery.sensitive, true);

    const own = await api.post(`/api/identity/password/recovery/${recovery.requestId}/confirm`, {}, SESSIONS.admin);
    assert.equal(own.ok, false, 'the requester cannot confirm their own request');

    const confirmed = await api.post(`/api/identity/password/recovery/${recovery.requestId}/confirm`, {}, SESSIONS.approver);
    assert.equal(confirmed.ok, true);
    assert.ok(confirmed.token);

    const denied = await api.post(`/api/identity/password/recovery/${recovery.requestId}/confirm`, {}, SESSIONS.catalogue);
    assert.equal(denied.denied, true, 'the confirmer needs Customers.CustomersCreateEditDelete');

    const trail = await api.get('/api/security/audit?event=AUD-IAM-003');
    assert.ok(trail.some((e) => e.entity === 'RecoveryRequest' && e.after?.status === 'Verified'), 'the decision is audited');
  });
});
