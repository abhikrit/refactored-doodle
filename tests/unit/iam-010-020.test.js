// PRD-IAM-010 User administration console, PRD-IAM-012 Authentication audit and suspicious-login
// detection, PRD-IAM-018 Account activity history, PRD-IAM-019 Account synchronisation and
// PRD-IAM-020 Identity verification.
// 11 + 8 + 4 + 4 + 6 = 33 criteria, one test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { consumerRegister } from '../../packages/server/src/core/events.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const byEmail = (email) => repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

/** A signed-in session of its own, so a forced logout in one test does not break another. */
async function signInAsync(email, session, password = 'demo') {
  const res = await api.post('/api/identity/sign-in', { email, password }, session);
  return res;
}

async function makeCustomerAsync(row) {
  return createCustomerAsync({ isSystemAccount: false, ...row });
}

/* ========================================== PRD-IAM-010 user administration console ===== */

describe('PRD-IAM-010 user administration console', () => {
  test('AC-IAM-010-01-01', async () => {
    // "searches by email, name, phone, company, role, registration date or last activity, then
    //  matching customers are listed and each record can be opened"
    const list = await api.get('/api/identity/users?email=buyer', SESSIONS.admin);
    assert.ok(list.customers.length >= 1);
    assert.ok(list.customers.every((c) => c.email.includes('buyer')));
    assert.deepEqual(list.searchableFields, ['email', 'name', 'phone', 'company', 'role', 'registrationDate', 'lastActivity']);

    const byRole = await api.get('/api/identity/users?role=Administrators', SESSIONS.admin);
    assert.ok(byRole.customers.every((c) => c.roles.includes('Administrators')));
    const byCompany = await api.get('/api/identity/users?company=Phiri', SESSIONS.admin);
    assert.ok(byCompany.customers.length >= 1, 'searchable by company');
    const byName = await api.get('/api/identity/users?name=Grace', SESSIONS.admin);
    assert.ok(byName.customers.length >= 1, 'searchable by name');
    const byDate = await api.get(`/api/identity/users?registeredFrom=${new Date(Date.now() - 86400000).toISOString()}`, SESSIONS.admin);
    assert.ok(byDate.customers.length >= 1, 'searchable by registration date');
    assert.ok(list.customers.every((c) => c.password === undefined), 'the list never carries the password');

    // each record can be opened
    const opened = await api.post('/api/identity/users/open', { email: 'buyer@example.com' }, SESSIONS.admin);
    assert.equal(opened.ok, true);
    assert.equal(opened.customer.email, 'buyer@example.com');

    // without Customers.CustomersView the list is refused by the native permission check
    const denied = await api.get('/api/identity/users?email=buyer', SESSIONS.catalogue);
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Customers.CustomersView');
  });

  test('AC-IAM-010-02-01', async () => {
    // "C cannot log in (native NotActive result), open sessions of C end at their next request,
    //  and AUD-IAM-008 is written"
    const target = await makeCustomerAsync({
      email: 'deactivate.me@example.com', firstName: 'Deactivate', lastName: 'Me', roles: ['Registered'],
    });
    await signInAsync('deactivate.me@example.com', 'iam-d-1');
    const before2 = await api.get('/api/identity/me', 'iam-d-1');
    assert.equal(before2.email, 'deactivate.me@example.com', 'the session is open');

    const off = await api.post('/api/identity/users/active', { email: target.email, active: false, reason: 'fraud review' }, SESSIONS.admin);
    assert.equal(off.ok, true);
    assert.equal(off.dataKept, true, 'BR-IAM-081: nothing is deleted');
    assert.ok(off.sessionsEnded >= 1, 'the open session ends');

    const next = await api.get('/api/identity/me', 'iam-d-1');
    assert.ok(!next || next.email !== target.email, 'the open session does not survive the next request');

    const again = await api.post('/api/identity/sign-in', { email: target.email, password: 'demo' }, 'iam-d-1');
    assert.equal(again.ok, false);
    assert.equal(again.messageKey, 'Account.Login.WrongCredentials.NotActive', 'the native NotActive result');

    const trail = await auditTrailAsync({ entity: 'Customer', entityId: target.id });
    const entry = trail.find((t) => t.event === 'AUD-IAM-008' && t.after?.active === false);
    assert.ok(entry, 'AUD-IAM-008 is written');
    assert.equal(entry.before.active, true);
    assert.equal(entry.actor, 'admin@example.com');
  });

  test('AC-IAM-010-02-02', async () => {
    // "C can log in again and AUD-IAM-008 is written"
    const target = await byEmail('deactivate.me@example.com');
    const on = await api.post('/api/identity/users/active', { email: target.email, active: true }, SESSIONS.admin);
    assert.equal(on.ok, true);
    assert.equal(on.customer.accountState, 'Active');

    const signedIn = await api.post('/api/identity/sign-in', { email: target.email, password: 'demo' }, 'iam-d-2');
    assert.equal(signedIn.ok, true, 'the account can log in again');

    const trail = await auditTrailAsync({ entity: 'Customer', entityId: target.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-008' && t.after?.active === true), 'AUD-IAM-008 is written for the reactivation');

    // a user without Customers.CustomersCreateEditDelete cannot do either
    const denied = await api.post('/api/identity/users/active', { email: target.email, active: false }, SESSIONS.catalogue);
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Customers.CustomersCreateEditDelete');
  });

  test('AC-IAM-010-03-01', async () => {
    // "the IAM impersonation filter allows it (BR-IAM-130), the storefront is shown as that
    //  customer and the native activity Impersonation.Started is written for both people"
    const acting = await api.post('/api/identity/users/impersonate', { customerEmail: 'buyer@example.com' }, SESSIONS.admin);
    assert.equal(acting.ok, true);
    assert.equal(acting.decidedBy, 'Administrators');
    assert.equal(acting.actingFor, 'buyer@example.com');
    assert.equal(acting.activityWrittenForBoth, true);

    const buyer = await byEmail('buyer@example.com');
    const admin = await byEmail('admin@example.com');
    const log = await api.get('/api/identity/activity-log', SESSIONS.admin);
    const started = log.filter((a) => a.systemKeyword === 'Impersonation.Started');
    assert.ok(started.some((a) => a.customerId === buyer.id), 'written for the customer');
    assert.ok(started.some((a) => a.customerId === admin.id), 'written for the administrator');

    // one product filter only (BR-IAM-130), and it is the one IAM-026 owns
    const registered = await api.get('/api/identity/users/impersonation-providers', SESSIONS.admin);
    assert.ok(registered.some((p) => p.feature === 'PRD-IAM-026'), 'the IAM-026 agent rule is a registered provider');
  });

  test('AC-IAM-010-03-02', async () => {
    // "no registered rule provider allows the request, then the filter refuses it with message
    //  Iam.ImpersonationNotAllowed, no impersonation starts and AUD-IAM-019 is written"
    const agent = await makeCustomerAsync({
      email: 'agent.blantyre@example.com', firstName: 'Agent', lastName: 'Blantyre', roles: ['Agent'], outlet: 'Blantyre Post Office',
    });
    const other = await makeCustomerAsync({
      email: 'other.outlet@example.com', firstName: 'Other', lastName: 'Outlet', roles: ['Registered'], outlet: 'Lilongwe Post Office',
    });
    await signInAsync(agent.email, 'iam-d-agent');

    const refused = await api.post('/api/identity/users/impersonate', { customerEmail: other.email }, 'iam-d-agent');
    assert.equal(refused.ok, false);
    // "with message Iam.ImpersonationNotAllowed (or the refusing provider message)": the IAM-026
    // agent rule refuses with its own, Iam.ScopeDenied
    assert.ok(['Iam.ImpersonationNotAllowed', 'Iam.ScopeDenied'].includes(refused.messageKey));
    assert.ok(refused.providersAsked.includes('PRD-IAM-026'), 'every registered rule provider was asked');
    assert.ok(refused.providersAsked.includes('PRD-CRM-015'), 'including the account-manager rule');

    const trail = await auditTrailAsync({ entity: 'Customer', entityId: other.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-019' && t.outcome === 'rejected'), 'AUD-IAM-019 is written');

    const records = await repository('AssistedServiceRecord').getAllAsync((rec) => rec.customerId === other.id);
    assert.equal(records.length, 0, 'no impersonation starts');
  });

  test('AC-IAM-010-03-03', async () => {
    // "a user who is not an administrator is allowed by a rule provider for a customer who is an
    //  administrator, then the native action refuses it
    //  (NonAdminNotImpersonateAsAdminError); the IAM filter does not relax native checks"
    // the rule that allows a non-administrator here is the CRM-015 account-manager rule: the
    // IAM-026 agent rule refuses staff accounts outright (AC-IAM-026-03-02)
    const manager = await makeCustomerAsync({
      email: 'account.manager@example.com', firstName: 'Account', lastName: 'Manager', roles: ['AccountManager'],
    });
    await makeCustomerAsync({
      email: 'managed.admin@example.com', firstName: 'Managed', lastName: 'Administrator', roles: ['Administrators'], accountManagerId: manager.id,
    });
    await signInAsync(manager.email, 'iam-d-manager');

    const refused = await api.post('/api/identity/users/impersonate', { customerEmail: 'managed.admin@example.com' }, 'iam-d-manager');
    assert.equal(refused.filterAllowed, true, 'the rule provider allowed it: the customer is assigned to this manager');
    assert.equal(refused.ok, false);
    assert.equal(refused.nativeRefusal, true);
    assert.equal(refused.messageKey, 'Admin.Customers.Customers.NonAdminNotImpersonateAsAdminError');
  });

  test('AC-IAM-010-04-01', async () => {
    // "the account becomes inactive, all sessions end, message Iam.AccountDeactivated is shown,
    //  no data is deleted and marketing messages stop (BR-IAM-081)"
    const owner = await makeCustomerAsync({
      email: 'self.deactivate@example.com', firstName: 'Self', lastName: 'Owner', roles: ['Registered'], newsletterSubscribed: true,
    });
    await signInAsync(owner.email, 'iam-d-self');

    const noConfirmation = await api.post('/api/identity/account/deactivate', {}, 'iam-d-self');
    assert.equal(noConfirmation.confirmationRequired, true, 'the password or a one-time code is required');

    const done = await api.post('/api/identity/account/deactivate', { password: 'demo' }, 'iam-d-self');
    assert.equal(done.ok, true);
    assert.equal(done.messageKey, 'Iam.AccountDeactivated');
    assert.ok(done.message && done.message !== 'Iam.AccountDeactivated', 'the message resource exists');
    assert.equal(done.customer.active, false);
    assert.equal(done.customer.accountState, 'DeactivatedByUser');
    assert.equal(done.dataDeleted, false, 'BR-IAM-081: nothing is deleted');
    assert.equal(done.marketingStopped, true);
    assert.equal(done.customer.newsletterSubscribed, false);
    assert.ok(done.sessionsEnded >= 1, 'all sessions end');
  });

  test('AC-IAM-010-04-02', async () => {
    // "the account becomes active again and message Iam.AccountReactivated is shown"
    const challenge = await api.post('/api/identity/account/reactivate/start', { email: 'self.deactivate@example.com' }, 'iam-d-self');
    assert.equal(challenge.selfReactivationAllowed, true);
    assert.ok(challenge.demonstrationCode, 'a code is sent to the verified email address');

    const done = await api.post('/api/identity/account/reactivate/complete', {
      email: 'self.deactivate@example.com', code: challenge.demonstrationCode,
    }, 'iam-d-self');
    assert.equal(done.ok, true);
    assert.equal(done.messageKey, 'Iam.AccountReactivated');
    assert.equal(done.customer.active, true);
    assert.equal(done.customer.accountState, 'Active');
  });

  test('AC-IAM-010-04-03', async () => {
    // "self-reactivation is refused and message Iam.ContactSupport is shown"
    const staffOff = await makeCustomerAsync({
      email: 'staff.deactivated@example.com', firstName: 'Staff', lastName: 'Deactivated', roles: ['Registered'],
    });
    await api.post('/api/identity/users/active', { email: staffOff.email, active: false, reason: 'compliance hold' }, SESSIONS.admin);

    const refused = await api.post('/api/identity/account/reactivate/start', { email: staffOff.email }, 'iam-d-staffoff');
    assert.equal(refused.selfReactivationAllowed, false);
    assert.equal(refused.messageKey, 'Iam.ContactSupport');
    const completion = await api.post('/api/identity/account/reactivate/complete', { email: staffOff.email, code: '000000' }, 'iam-d-staffoff');
    assert.equal(completion.ok, false);
    assert.equal(completion.messageKey, 'Iam.ContactSupport');
  });

  test('AC-IAM-010-05-01', async () => {
    // "the platform audit trail (SEC-004) stores old and new values and the native activity
    //  EditCustomer is written"
    const customer = await byEmail('buyer@example.com');
    const edited = await api.post('/api/identity/users/edit', {
      email: customer.email, changes: { lastName: 'Banda-Phiri', company: 'Phiri Wholesale Ltd' },
    }, SESSIONS.admin);
    assert.equal(edited.ok, true);
    assert.equal(edited.before.lastName, customer.lastName);
    assert.equal(edited.after.lastName, 'Banda-Phiri');

    const trail = await auditTrailAsync({ entity: 'Customer', entityId: customer.id });
    const entry = trail.find((t) => t.event === 'AUD-IAM-008' && t.after?.lastName === 'Banda-Phiri');
    assert.ok(entry, 'the trail entry exists');
    assert.equal(entry.before.lastName, customer.lastName, 'old value');
    assert.equal(entry.after.company, 'Phiri Wholesale Ltd', 'new value');

    const log = await api.get(`/api/identity/activity-log?customerId=${customer.id}`, SESSIONS.admin);
    assert.ok(log.some((a) => a.systemKeyword === 'EditCustomer'), 'the native activity EditCustomer is written');
  });

  test('AC-IAM-010-05-02', async () => {
    // "a read-access event AUD-IAM-010 is written (BR-IAM-080)"
    const customer = await byEmail('buyer@example.com');
    for (const page of ['Customer edit', 'Order detail', 'Address']) {
      const opened = await api.post('/api/identity/users/open', { email: customer.email, page }, SESSIONS.admin);
      assert.equal(opened.readAccessRecorded, true);
    }
    const trail = await auditTrailAsync({ entity: 'Customer', entityId: customer.id });
    const reads = trail.filter((t) => t.event === 'AUD-IAM-010');
    assert.ok(reads.length >= 3, 'one read-access event per page shown');
    assert.deepEqual([...new Set(reads.map((t) => t.after.page))].sort(), ['Address', 'Customer edit', 'Order detail']);
    assert.equal(reads[0].actor, 'admin@example.com');

    const denied = await api.post('/api/identity/users/open', { email: customer.email }, SESSIONS.catalogue);
    assert.equal(denied.denied, true);
  });
});

/* ============================================= PRD-IAM-012 authentication audit ========= */

describe('PRD-IAM-012 authentication audit and suspicious-login detection', () => {
  test('AC-IAM-012-01-01', async () => {
    // "the native activity types PublicStore.SuccessfulLogin, PublicStore.FailedLogin and
    //  PublicStore.Logout are enabled (disabled at native install) and StoreIpAddresses is on"
    const config = await api.get('/api/identity/auth-events/configuration', SESSIONS.admin);
    assert.deepEqual(config.activityTypes.map((t) => t.systemKeyword), [
      'PublicStore.SuccessfulLogin', 'PublicStore.FailedLogin', 'PublicStore.Logout',
    ]);
    assert.ok(config.activityTypes.every((t) => t.enabled === true));
    assert.equal(config.storeIpAddresses, true, 'CustomerSettings.StoreIpAddresses is on');
    assert.match(config.note, /disabled at a native install/);

    const stored = await repository('Setting').getAllAsync((s) => s.name.startsWith('activitylogtype.'));
    assert.equal(stored.length, 3, 'the three activity types are stored settings, not assumptions');
    assert.ok(stored.every((s) => s.value === true || s.value === 'true'));
  });

  test('AC-IAM-012-01-02', async () => {
    // "an AuthEvent is written with UTC time, customer (or the identifier tried), IP address,
    //  user agent, channel and outcome, and is copied to the platform audit trail (AUD-IAM-018)"
    const customer = await byEmail('buyer@example.com');
    const kinds = [
      { type: 'login', outcome: 'success', channel: 'password' },
      { type: 'login', outcome: 'failed', channel: 'password' },
      { type: 'login', outcome: 'success', channel: 'sms-code' },
      { type: 'login', outcome: 'success', channel: 'sso' },
      { type: 'logout', outcome: 'success', channel: 'password' },
      { type: 'mfa-challenge', outcome: 'failed', channel: 'mfa' },
      { type: 'password-change', outcome: 'success', channel: 'account' },
      { type: 'password-reset', outcome: 'success', channel: 'account' },
      { type: 'mfa-enrolment', outcome: 'success', channel: 'account' },
      { type: 'mfa-removal', outcome: 'success', channel: 'account' },
      { type: 'role-mapping-change', outcome: 'success', channel: 'admin' },
      { type: 'access-denied', outcome: 'failed', channel: 'admin' },
    ];
    const ids = [];
    for (const kind of kinds) {
      const written = await api.post('/api/identity/auth-events', {
        ...kind, customerId: customer.id, identifierTried: customer.email, ipAddress: '10.20.30.40', userAgent: 'Mozilla/5.0 (prototype)',
      }, SESSIONS.admin);
      const { event } = written;
      assert.ok(event.createdOnUtc.endsWith('Z'), 'UTC time');
      assert.equal(event.customerId, customer.id);
      assert.equal(event.identifierTried, customer.email);
      assert.equal(event.ipAddress, '10.20.30.40');
      assert.equal(event.userAgent, 'Mozilla/5.0 (prototype)');
      assert.equal(event.channel, kind.channel);
      assert.equal(event.outcome, kind.outcome);
      ids.push(event.id);
    }
    const trail = await auditTrailAsync({ entity: 'AuthEvent' });
    for (const id of ids) {
      assert.ok(trail.some((t) => t.event === 'AUD-IAM-018' && String(t.entityId) === String(id)), `AUD-IAM-018 copy for event ${id}`);
    }
    // a real sign-in writes one too, not only the test endpoint
    await signInAsync('support@example.com', 'iam-d-support');
    const support = await byEmail('support@example.com');
    const events = await api.get(`/api/identity/auth-events?customerId=${support.id}`, SESSIONS.admin);
    assert.ok(events.events.some((e) => e.type === 'login' && e.outcome === 'success'), 'the sign-in flow writes an AuthEvent');
  });

  test('AC-IAM-012-01-03', async () => {
    // "no screen or service offers edit or delete; the native activity log can be deleted
    //  (Customers.ActivityLogDelete) but the copy in SEC-004 cannot"
    const list = await api.get('/api/identity/auth-events', SESSIONS.admin);
    assert.equal(list.appendOnly, true);
    assert.equal(list.editOrDeleteOffered, false);
    const first = list.events[0];

    for (const method of ['PATCH', 'DELETE']) {
      const res = await api.call(method, `/api/identity/auth-events/${first.id}`, {}, SESSIONS.admin);
      assert.equal(res.status, 404, `no ${method} route is offered, even for an administrator`);
    }

    const cleared = await api.del('/api/identity/activity-log', SESSIONS.admin);
    assert.ok(cleared.cleared >= 1, 'the native activity log can be cleared');
    assert.equal((await api.get('/api/identity/activity-log', SESSIONS.admin)).length, 0);
    assert.equal(cleared.auditTrailCopyKept, true);

    const trail = await auditTrailAsync({ entity: 'AuthEvent' });
    assert.ok(trail.some((t) => String(t.entityId) === String(first.id)), 'the SEC-004 copy stands');
    const still = await api.get('/api/identity/auth-events', SESSIONS.admin);
    assert.ok(still.events.some((e) => e.id === first.id), 'and so does the AuthEvent');

    const denied = await api.call('DELETE', '/api/identity/activity-log', {}, SESSIONS.catalogue);
    assert.equal(denied.body.permission, 'Customers.ActivityLogDelete');
  });

  test('AC-IAM-012-02-01', async () => {
    // "a suspicious-login flag is raised, the security officer is notified and the flag appears
    //  in the console (SM-IAM-12)"
    await saveSettingAsync('iam.suspiciousloginrules', {
      failedLogins: { enabled: true, failures: 3, windowMinutes: 15 },
      newCountry: { enabled: false, lookBackDays: 90, notifyCustomer: false },
    }, 0);
    const victim = await makeCustomerAsync({
      email: 'brute.force@example.com', firstName: 'Brute', lastName: 'Target', roles: ['Registered'],
    });
    let raised = null;
    for (let i = 0; i < 3; i += 1) {
      const written = await api.post('/api/identity/auth-events', {
        type: 'login', outcome: 'failed', channel: 'password', customerId: victim.id, identifierTried: victim.email, ipAddress: '41.70.1.9',
      }, SESSIONS.admin);
      if (written.flags.length) raised = written.flags[0];
    }
    assert.ok(raised, 'more than N failures in M minutes raises a flag');
    assert.equal(raised.ruleId, 'failed-logins');
    assert.equal(raised.status, 'Open', 'SM-IAM-12 Open');
    assert.match(raised.detail, /3 failures in 15 minutes/);

    const notices = await deliveriesAsync({ event: 'Iam.Core.SuspiciousLogin' });
    assert.ok(notices.length >= 1, 'the security officer is notified');

    const console2 = await api.get('/api/identity/suspicious-logins', SESSIONS.admin);
    assert.ok(console2.flags.some((f) => f.id === raised.id), 'the flag appears in the console');
    assert.equal(console2.rules.failedLogins.failures, 3, 'the rule is a setting');
  });

  test('AC-IAM-012-02-02', async () => {
    // "a flag is raised and, if the setting is on, the customer receives message template
    //  Iam.NewCountryLogin.CustomerNotification"
    await saveSettingAsync('iam.suspiciousloginrules', {
      failedLogins: { enabled: false, failures: 5, windowMinutes: 15 },
      newCountry: { enabled: true, lookBackDays: 90, notifyCustomer: true },
    }, 0);
    const traveller = await makeCustomerAsync({
      email: 'traveller@example.com', firstName: 'Tina', lastName: 'Traveller', roles: ['Registered'],
    });
    // the customer's history: logins from MW inside the look-back period
    await repository('AuthEvent').insertAsync({
      customerId: traveller.id, identifierTried: traveller.email, type: 'login', outcome: 'success', channel: 'password', ipAddress: '41.70.1.9', countryIso: 'MW', createdOnUtc: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    });

    const abroad = await api.post('/api/identity/auth-events', {
      type: 'login', outcome: 'success', channel: 'password', customerId: traveller.id, identifierTried: traveller.email, ipAddress: '102.22.9.1', countryIso: 'ZA',
    }, SESSIONS.admin);
    const flag = abroad.flags.find((f) => f.ruleId === 'new-country');
    assert.ok(flag, 'a login from a country not seen in the look-back period raises a flag');
    assert.match(flag.detail, /first login from ZA in 90 days/);

    const [notice] = await deliveriesAsync({ event: 'Iam.NewCountryLogin.CustomerNotification' });
    assert.ok(notice, 'the customer receives the message template');
    assert.equal(notice.tokens.country, 'ZA');

    // a country already seen in the look-back period raises nothing
    const repeatCustomer = await makeCustomerAsync({
      email: 'repeat.traveller@example.com', firstName: 'Repeat', lastName: 'Traveller', roles: ['Registered'],
    });
    await repository('AuthEvent').insertAsync({
      customerId: repeatCustomer.id, type: 'login', outcome: 'success', channel: 'password', ipAddress: '41.70.1.9', countryIso: 'MW', createdOnUtc: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    });
    const second = await api.post('/api/identity/auth-events', {
      type: 'login', outcome: 'success', customerId: repeatCustomer.id, countryIso: 'MW', ipAddress: '41.70.1.9',
    }, SESSIONS.admin);
    assert.equal(second.flags.length, 0, 'a country already seen raises nothing');

    // and the notice is only sent when the setting says so
    await saveSettingAsync('iam.suspiciousloginrules', {
      failedLogins: { enabled: false, failures: 5, windowMinutes: 15 },
      newCountry: { enabled: true, lookBackDays: 90, notifyCustomer: false },
    }, 0);
    const quiet = await makeCustomerAsync({
      email: 'quiet.traveller@example.com', firstName: 'Quiet', lastName: 'Traveller', roles: ['Registered'],
    });
    const sentBefore = (await deliveriesAsync({ event: 'Iam.NewCountryLogin.CustomerNotification' })).length;
    const raisedQuietly = await api.post('/api/identity/auth-events', {
      type: 'login', outcome: 'success', customerId: quiet.id, countryIso: 'KE', ipAddress: '41.90.2.2',
    }, SESSIONS.admin);
    assert.equal(raisedQuietly.flags.length, 1, 'the flag still stands');
    assert.equal((await deliveriesAsync({ event: 'Iam.NewCountryLogin.CustomerNotification' })).length, sentBefore, 'no notice when the setting is off');
  });

  test('AC-IAM-012-02-03', async () => {
    // "the officer can force the user off (IAM-006) and the flag becomes Confirmed; dismissing
    //  needs a reason (AUD-IAM-016)"
    const victim = await byEmail('brute.force@example.com');
    await signInAsync(victim.email, 'iam-d-victim');
    const open = (await api.get('/api/identity/suspicious-logins', SESSIONS.admin)).flags
      .find((f) => f.customerId === victim.id && f.status === 'Open');
    assert.ok(open, 'the flag is open');

    const confirmed = await api.post(`/api/identity/suspicious-logins/${open.id}`, { decision: 'confirm', forceLogout: true }, SESSIONS.admin);
    assert.equal(confirmed.ok, true);
    assert.equal(confirmed.flag.status, 'Confirmed');
    assert.ok(confirmed.forcedLogout.revoked >= 1, 'the officer can force the user off (IAM-006)');
    const after2 = await api.get('/api/identity/me', 'iam-d-victim');
    assert.ok(!after2 || after2.email !== victim.email, 'the session is gone');

    // dismissing needs a reason
    const traveller = await byEmail('traveller@example.com');
    const openFlag = (await api.get('/api/identity/suspicious-logins', SESSIONS.admin)).flags
      .find((f) => f.customerId === traveller.id && f.status === 'Open');
    const noReason = await api.post(`/api/identity/suspicious-logins/${openFlag.id}`, { decision: 'dismiss' }, SESSIONS.admin);
    assert.equal(noReason.ok, false);
    assert.equal(noReason.reasonRequired, true);

    const dismissed = await api.post(`/api/identity/suspicious-logins/${openFlag.id}`, { decision: 'dismiss', reason: 'the customer confirmed the trip' }, SESSIONS.admin);
    assert.equal(dismissed.flag.status, 'Dismissed');
    const trail = await auditTrailAsync({ entity: 'SuspiciousLoginFlag', entityId: openFlag.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-016' && t.after?.reason === 'the customer confirmed the trip'), 'AUD-IAM-016');
  });

  test('AC-IAM-012-03-01', async () => {
    // "the user filters by date, customer, IP address and outcome, then matching events are
    //  listed and can be exported to CSV"
    const customer = await byEmail('buyer@example.com');
    const byCustomer = await api.get(`/api/identity/auth-events?customerId=${customer.id}`, SESSIONS.auditor);
    assert.ok(byCustomer.events.length >= 1);
    assert.ok(byCustomer.events.every((e) => e.customerId === customer.id));

    const byIp = await api.get('/api/identity/auth-events?ipAddress=10.20.30.40', SESSIONS.auditor);
    assert.ok(byIp.events.every((e) => e.ipAddress === '10.20.30.40'));
    const byOutcome = await api.get('/api/identity/auth-events?outcome=failed', SESSIONS.auditor);
    assert.ok(byOutcome.events.every((e) => e.outcome === 'failed'));
    const byDate = await api.get(`/api/identity/auth-events?from=${new Date(Date.now() - 3600000).toISOString()}`, SESSIONS.auditor);
    assert.ok(byDate.events.length >= 1, 'filtered by date');

    assert.match(byCustomer.csv.split('\n')[0], /^time,customer,identifier,type,outcome,channel,ip,country$/);
    assert.equal(byCustomer.csv.split('\n').length, byCustomer.events.length + 1, 'one CSV row per event');

    const denied = await api.get('/api/identity/auth-events', SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.AuthEvents.View');
  });

  test('AC-IAM-012-03-02', async () => {
    // "they are sent through IC-SEC-02 in the agreed format"
    const exported = await api.get('/api/identity/auth-events/monitoring-export', SESSIONS.admin);
    assert.equal(exported.enabled, true);
    assert.equal(exported.contract, 'IC-SEC-02');
    assert.equal(exported.format, 'CEF');
    assert.ok(exported.sent >= 1);
    assert.match(exported.sample.line, /^CEF:0\|Product\|IAM\|/);

    await saveSettingAsync('sec.securitymonitoringexport', { enabled: false }, 0);
    const off = await api.get('/api/identity/auth-events/monitoring-export', SESSIONS.admin);
    assert.equal(off.enabled, false, 'nothing is sent when the export is not configured');
    await saveSettingAsync('sec.securitymonitoringexport', { enabled: true, format: 'CEF', endpoint: 'siem.internal' }, 0);
  });
});

/* ================================================ PRD-IAM-018 account activity ========== */

describe('PRD-IAM-018 account activity history', () => {
  test('AC-IAM-018-01-01', async () => {
    // "the page lists, newest first and for the configured look-back period: logins and failed
    //  logins, changes (field names, not values), and payment attempts with time, method and status"
    const shopper = await makeCustomerAsync({
      email: 'activity.shopper@example.com', firstName: 'Activity', lastName: 'Shopper', roles: ['Registered'],
    });
    await signInAsync(shopper.email, 'iam-d-activity');
    await api.post('/api/identity/auth-events', {
      type: 'login', outcome: 'failed', channel: 'password', customerId: shopper.id, identifierTried: shopper.email, ipAddress: '41.70.1.9',
    }, SESSIONS.admin);
    await api.post('/api/identity/users/edit', { email: shopper.email, changes: { lastName: 'Shopper-Banda' } }, SESSIONS.admin);
    await repository('PaymentTransaction').insertAsync({
      customerId: shopper.id, paymentMethodSystemName: 'Payments.AirtelMoney', status: 'Authorized', amount: 15000, createdOnUtc: new Date().toISOString(),
    });

    const page = await api.get('/api/identity/account/activity', 'iam-d-activity');
    assert.equal(page.lookBackDays, 90, 'the look-back period is a setting');
    const kinds = new Set(page.entries.map((e) => e.kind));
    assert.ok(kinds.has('login'), 'logins');
    assert.ok(kinds.has('failed login'), 'failed logins');
    assert.ok(kinds.has('change'), 'changes');
    assert.ok(kinds.has('payment attempt'), 'payment attempts');

    const change = page.entries.find((e) => e.kind === 'change');
    assert.ok(change.fields.includes('lastName'), 'the field name is shown');
    assert.equal(JSON.stringify(change).includes('Shopper-Banda'), false, 'the value is not');

    const payment = page.entries.find((e) => e.kind === 'payment attempt');
    assert.equal(payment.method, 'Payments.AirtelMoney');
    assert.equal(payment.status, 'Authorized');
    assert.ok(payment.at, 'with the time');

    const times = page.entries.map((e) => new Date(e.at).getTime());
    assert.deepEqual(times, [...times].sort((a, b) => b - a), 'newest first');
  });

  test('AC-IAM-018-01-02', async () => {
    // "the last octet of an IPv4 address, or the last 80 bits of an IPv6 address, are replaced by
    //  zeros (Proposed - prototype default, decision SEC-014 pending)"
    const shopper = await byEmail('activity.shopper@example.com');
    await api.post('/api/identity/auth-events', {
      type: 'login', outcome: 'success', channel: 'password', customerId: shopper.id, ipAddress: '2001:db8:85a3:1234:5678:8a2e:370:7334',
    }, SESSIONS.admin);

    const page = await api.get('/api/identity/account/activity', 'iam-d-activity');
    const v4 = page.entries.find((e) => e.ipAddress && e.ipAddress.includes('.'));
    assert.equal(v4.ipAddress, '41.70.1.0', 'the last octet is zeroed');
    const v6 = page.entries.find((e) => e.ipAddress && e.ipAddress.includes(':'));
    assert.equal(v6.ipAddress, '2001:db8:85a3:0:0:0:0:0', 'the last 80 bits are zeroed');

    const forStaff = await api.get(`/api/identity/account/activity?email=${shopper.email}&forStaff=true`, SESSIONS.admin);
    assert.ok(forStaff.entries.some((e) => e.ipAddress === '41.70.1.9'), 'staff see the address the event carries');
  });

  test('AC-IAM-018-02-01', async () => {
    // "a 'staff access' entry is shown with date and, as the setting says, the staff member name
    //  or role"
    const shopper = await byEmail('activity.shopper@example.com');
    await api.post('/api/identity/users/open', { email: shopper.email, page: 'Customer edit' }, SESSIONS.admin);

    const withRole = await api.get('/api/identity/account/activity', 'iam-d-activity');
    const entry = withRole.entries.find((e) => e.kind === 'staff access');
    assert.ok(entry, 'the entry is shown');
    assert.ok(entry.at, 'with the date');
    assert.equal(entry.by, 'Administrators', 'the role, because the setting is off');
    assert.equal(withRole.staffNameShown, false);

    await saveSettingAsync('iam.showstaffnametocustomers', true, 0);
    const withName = await api.get('/api/identity/account/activity', 'iam-d-activity');
    assert.equal(withName.entries.find((e) => e.kind === 'staff access').by, 'admin@example.com', 'the name, because the setting is on');
    await saveSettingAsync('iam.showstaffnametocustomers', false, 0);
  });

  test('AC-IAM-018-03-01', async () => {
    // "an Account activity tab shows the same entries"
    const shopper = await byEmail('activity.shopper@example.com');
    const mine = await api.get('/api/identity/account/activity', 'iam-d-activity');
    const staffTab = await api.get(`/api/identity/account/activity?email=${shopper.email}`, SESSIONS.admin);
    assert.deepEqual(staffTab.entries.map((e) => `${e.kind}@${e.at}`), mine.entries.map((e) => `${e.kind}@${e.at}`), 'the same entries');

    const denied = await api.get(`/api/identity/account/activity?email=${shopper.email}`, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Customers.CustomersView');
  });
});

/* ============================================ PRD-IAM-019 account synchronisation ======= */

describe('PRD-IAM-019 account synchronisation', () => {
  test('AC-IAM-019-01-01', async () => {
    // "an IntegrationMessage with channel 'account sync' is written to the INT-004 outbox through
    //  IC-INT-09 Enqueue (the IAM consumer only enqueues) and the INT delivery task sends it"
    const registered = await api.post('/api/identity/register', { policyAccepted: true,
      email: 'sync.new@example.com', password: 'Str0ng!pass', firstName: 'Sync', lastName: 'New',
    }, 'iam-d-sync');
    assert.equal(registered.ok, true);

    const outbox = await api.get('/api/integrations/messages?channel=account%20sync', SESSIONS.admin);
    const onRegister = outbox.find((m) => m.messageType === 'account.registered' && m.payload.email === 'sync.new@example.com');
    assert.ok(onRegister, 'registration enqueues one message');
    assert.equal(onRegister.status, 'Pending');
    assert.equal(onRegister.feature, 'PRD-IAM-019');
    assert.deepEqual(Object.keys(onRegister.payload).sort(), ['active', 'customerId', 'email', 'firstName', 'lastName', 'phone'], 'the configured fields only');

    // the consumer is registered on the events the criterion names, and only enqueues
    const register = consumerRegister().filter((c) => ['CustomerRegisteredEvent', 'EntityUpdatedEvent', 'EntityInsertedEvent'].includes(c.eventName));
    assert.equal(register.length, 3, 'the IAM consumer listens on the three events the criterion names');
    assert.ok(register.every((c) => c.consumers.some((x) => x.feature === 'PRD-IAM-019')));

    // an update and a deactivation enqueue too
    await api.post('/api/identity/users/edit', { email: 'sync.new@example.com', changes: { lastName: 'Renamed' } }, SESSIONS.admin);
    await api.post('/api/identity/users/active', { email: 'sync.new@example.com', active: false }, SESSIONS.admin);
    const after2 = await api.get('/api/integrations/messages?channel=account%20sync', SESSIONS.admin);
    assert.ok(after2.some((m) => m.messageType === 'account.updated'), 'an update enqueues');
    assert.ok(after2.some((m) => m.messageType === 'account.deactivated'), 'a deactivation enqueues');

    const run = await api.post('/api/integrations/delivery-task', {}, SESSIONS.admin);
    assert.ok(run.sent.length >= 3, 'the INT delivery task sends them');
    const sent = await api.get('/api/integrations/messages?channel=account%20sync', SESSIONS.admin);
    assert.ok(sent.every((m) => m.status === 'Sent'), 'nothing is left pending');
  });

  test('AC-IAM-019-01-02', async () => {
    // "the message is retried (SM-INT-01); after the last retry it becomes DeadLettered and
    //  appears in the INT dead-letter list; IAM keeps no outbox of its own (BR-IAM-100)"
    await api.post('/api/identity/users/edit', { email: 'sync.new@example.com', changes: { company: 'Retry Ltd' } }, SESSIONS.admin);
    const queued = (await api.get('/api/integrations/messages?channel=account%20sync', SESSIONS.admin))
      .find((m) => m.status === 'Pending');
    assert.ok(queued, 'a message is waiting');
    assert.equal(queued.maxAttempts, 3);

    const first = await api.post('/api/integrations/delivery-task', { failChannel: 'account sync' }, SESSIONS.admin);
    assert.equal(first.deadLettered.length, 0, 'it is retried, not dead-lettered at once');
    const retrying = (await api.get('/api/integrations/messages?channel=account%20sync', SESSIONS.admin)).find((m) => m.id === queued.id);
    assert.equal(retrying.status, 'Retrying', 'SM-INT-01 Retrying');
    assert.equal(retrying.attempts, 1);

    await api.post('/api/integrations/delivery-task', { failChannel: 'account sync' }, SESSIONS.admin);
    const last = await api.post('/api/integrations/delivery-task', { failChannel: 'account sync' }, SESSIONS.admin);
    assert.ok(last.deadLettered.some((m) => m.id === queued.id), 'after the last retry it is dead-lettered');

    const deadLetter = await api.get('/api/integrations/dead-letter', SESSIONS.admin);
    assert.ok(deadLetter.some((m) => m.id === queued.id), 'and appears in the INT dead-letter list');
    const denied = await api.get('/api/integrations/dead-letter', SESSIONS.catalogue);
    assert.equal(denied.permission, 'Integrations.Core.Messages.View');

    // BR-IAM-100: IAM holds no outbox of its own - the rows live in the one INT entity
    assert.equal((await repository('IamOutbox').getAllAsync()).length, 0);
    assert.ok((await repository('IntegrationMessage').getAllAsync((m) => m.feature === 'PRD-IAM-019')).length >= 1);
  });

  test('AC-IAM-019-01-03', async () => {
    // "only the configured fields are updated; if the platform value changed after the
    //  core-system version, the configured system of record wins and the conflict is logged"
    const customer = await makeCustomerAsync({
      email: 'inbound@example.com', firstName: 'In', lastName: 'Bound', roles: ['Registered'],
    });
    const config = await api.get('/api/identity/sync/configuration', SESSIONS.admin);
    assert.deepEqual(config.fields, ['email', 'firstName', 'lastName', 'phone', 'active']);

    const applied = await api.post('/api/identity/sync/inbound', {
      email: customer.email, values: { firstName: 'Inbound', vatNumber: 'MW-123' },
    }, SESSIONS.admin);
    assert.equal(applied.ok, true);
    assert.deepEqual(Object.keys(applied.applied), ['firstName']);
    assert.deepEqual(applied.ignoredFields, ['vatNumber'], 'a field outside the configured set is not updated');
    assert.equal((await byEmail(customer.email)).firstName, 'Inbound');

    // the platform changed after the core-system version: for email the platform is the system of
    // record, so the inbound value loses; for phone the core system is, so it wins
    await api.post('/api/identity/users/edit', { email: customer.email, changes: { lastName: 'Platform' } }, SESSIONS.admin);
    const older = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const conflicted = await api.post('/api/identity/sync/inbound', {
      email: customer.email, values: { email: 'core.system@example.com', phone: '+265991234567' }, changedOnUtc: older,
    }, SESSIONS.admin);
    const emailConflict = conflicted.conflicts.find((c) => c.field === 'email');
    assert.equal(emailConflict.winner, 'platform');
    assert.equal(conflicted.applied.email, undefined, 'the platform value stands');
    const phoneConflict = conflicted.conflicts.find((c) => c.field === 'phone');
    assert.equal(phoneConflict.winner, 'core-system');
    assert.equal(conflicted.applied.phone, '+265991234567', 'the system of record wins');

    const log = await repository('Log').getAllAsync((l) => l.shortMessage?.includes('Account sync conflict'));
    assert.ok(log.length >= 2, 'the conflict is logged');
  });

  test('AC-IAM-019-01-04', async () => {
    // "the core system receives an erasure notice for that customer"
    // IAM-017 calls this notice when a deletion completes; the notice itself is what this
    // criterion asserts.
    const customer = await byEmail('inbound@example.com');
    const notice = await api.post('/api/identity/sync/erasure-notice', { customerId: customer.id }, SESSIONS.admin);
    assert.equal(notice.ok, true);
    assert.equal(notice.message.channel, 'account sync');
    assert.equal(notice.message.messageType, 'account.erased');
    assert.equal(notice.message.payload.customerId, customer.id);

    const run = await api.post('/api/integrations/delivery-task', {}, SESSIONS.admin);
    assert.ok(run.sent.some((m) => m.messageType === 'account.erased'), 'and it is delivered to the core system');
  });
});

/* ============================================= PRD-IAM-020 identity verification ======== */

describe('PRD-IAM-020 identity verification framework', () => {
  test('AC-IAM-020-01-01', async () => {
    // "the framework calls the adapter for the country (IC-IAM-02) and records the result with
    //  the adapter reference and time; identity document images are not stored (BR-IAM-110)"
    const subject = await byEmail('buyer@example.com');
    const verified = await api.post('/api/identity/verification', {
      subjectType: 'Customer', subjectId: subject.id, country: 'MW', identityType: 'national-id', identifier: 'MW-ID-889321', name: 'Amina Banda',
    }, SESSIONS.admin);
    assert.equal(verified.ok, true);
    assert.equal(verified.adapter, 'Verify.NationalId.MW', 'the adapter for the country');
    assert.equal(verified.result, 'Verified');
    assert.ok(verified.reference, 'the adapter reference');
    assert.ok(verified.case.createdOnUtc, 'and the time');
    assert.equal(verified.case.documentImagesStored, false, 'BR-IAM-110');
    assert.equal(verified.case.identifier, '***321', 'the number itself is not kept in full');

    for (const result of ['NotVerified', 'Inconclusive', 'Unavailable']) {
      const other = await api.post('/api/identity/verification', {
        subjectId: subject.id, country: 'MW', identityType: 'national-id', identifier: 'MW-ID-000001', forceResult: result,
      }, SESSIONS.admin);
      assert.equal(other.adapterResult, result, `the framework records ${result}`);
    }
    const adapters = (await api.get('/api/identity/verification', SESSIONS.admin)).adapters;
    assert.ok(adapters.every((a) => a.contract === 'IC-IAM-02'));
  });

  test('AC-IAM-020-01-02', async () => {
    // "the adapter returns the match result from the mobile-money registration and it is recorded"
    const subject = await byEmail('buyer@example.com');
    const byMobile = await api.post('/api/identity/verification', {
      subjectId: subject.id, country: 'MW', identityType: 'mobile-number', identifier: '+265991000111', name: 'Amina Banda',
    }, SESSIONS.admin);
    assert.equal(byMobile.adapter, 'Verify.MobileMoney.MW');
    assert.equal(byMobile.result, 'Verified');
    assert.ok(byMobile.reference);
    assert.deepEqual(byMobile.case.matchedFields, ['name', 'identifier']);
    assert.equal(byMobile.case.documentImagesStored, false);
  });

  test('AC-IAM-020-01-03', async () => {
    // "the case goes to the manual review queue; a user holding
    //  Identity.Core.Verification.CreateEditDelete decides it with a reason (AUD-IAM-015)"
    const subject = await byEmail('approver@example.com');
    const inconclusive = await api.post('/api/identity/verification', {
      subjectId: subject.id, country: 'MW', identityType: 'national-id', identifier: 'MW-ID-555000', forceResult: 'Inconclusive',
    }, SESSIONS.admin);
    assert.equal(inconclusive.manualReviewOpened, true);
    assert.equal(inconclusive.result, 'ManualReview');

    const unavailable = await api.post('/api/identity/verification', {
      subjectId: subject.id, country: 'MW', identityType: 'national-id', identifier: 'MW-ID-555001', forceResult: 'Unavailable',
    }, SESSIONS.admin);
    assert.equal(unavailable.manualReviewOpened, true);

    const queue = (await api.get('/api/identity/verification', SESSIONS.admin)).cases.filter((c) => c.result === 'ManualReview');
    assert.ok(queue.length >= 2, 'both are in the queue');

    const noReason = await api.post(`/api/identity/verification/${inconclusive.case.id}/decide`, { decision: 'Verified' }, SESSIONS.admin);
    assert.equal(noReason.reasonRequired, true);
    const denied = await api.post(`/api/identity/verification/${inconclusive.case.id}/decide`, { decision: 'Verified', reason: 'checked the papers' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.Verification.CreateEditDelete');

    const decided = await api.post(`/api/identity/verification/${inconclusive.case.id}/decide`, { decision: 'Verified', reason: 'identity confirmed at the counter' }, SESSIONS.admin);
    assert.equal(decided.ok, true);
    assert.equal(decided.case.result, 'Verified');
    const trail = await auditTrailAsync({ entity: 'VerificationCase', entityId: inconclusive.case.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-015' && t.after?.reason === 'identity confirmed at the counter'));
  });

  test('AC-IAM-020-01-04', async () => {
    // "the result is returned as Verified, NotVerified, Inconclusive or Unavailable with the
    //  adapter reference; IAM opens no manual review case for checks requested by SEL"
    const seller = await byEmail('company.buyer@example.com');
    const forSel = await api.post('/api/identity/verification', {
      subjectType: 'Vendor', subjectId: seller.id, country: 'MW', identityType: 'national-id', identifier: 'MW-ID-777000', name: 'Chikondi Traders', requestedBy: 'SEL', forceResult: 'Inconclusive',
    }, SESSIONS.admin);
    assert.ok(['Verified', 'NotVerified', 'Inconclusive', 'Unavailable'].includes(forSel.result), 'the product standard values');
    assert.equal(forSel.result, 'Inconclusive');
    assert.equal(forSel.manualReviewOpened, false, 'IAM opens no manual review case for SEL');
    assert.equal(forSel.case.requestedBy, 'SEL');
    assert.ok(forSel.reference || forSel.adapterResult, 'with the adapter reference');
  });

  test('AC-IAM-020-01-05', async () => {
    // "the AI output is shown to the reviewer as a suggestion only; the result is set by the
    //  adapter or by a reviewer, never by the AI output alone (BR-AI-002, BR-IAM-110)"
    const subject = await byEmail('approver@example.com');
    const open = (await api.get('/api/identity/verification', SESSIONS.admin)).cases.find((c) => c.result === 'ManualReview');
    assert.ok(open, 'a case is waiting for a reviewer');
    assert.ok(subject);

    const decided = await api.post(`/api/identity/verification/${open.id}/decide`, {
      decision: 'NotVerified',
      reason: 'the name on the document does not match',
      aiSuggestion: { source: 'PRD-AI-005', extractedFields: { name: 'C. Banda' }, matchScore: 0.42 },
    }, SESSIONS.admin);
    assert.equal(decided.ok, true);
    assert.equal(decided.aiWasSuggestionOnly, true);
    assert.equal(decided.case.result, 'NotVerified', 'the reviewer set the result');
    assert.equal(decided.case.decidedBy, 'admin@example.com');
    assert.equal(decided.case.aiSuggestion.matchScore, 0.42, 'the AI output is kept as a suggestion');
    assert.equal(decided.case.aiSuggestion.source, 'PRD-AI-005');
  });

  test('AC-IAM-020-02-01', async () => {
    // "a new adapter implements IC-IAM-02, is installed and configured for a country, then it is
    //  used for that country without change to the framework"
    const existing = await api.get('/api/identity/verification', SESSIONS.admin);
    await saveSettingAsync('iam.verificationadapters', [
      ...existing.adapters,
      {
        systemName: 'Verify.NationalId.ZM', country: 'ZM', identityTypes: ['national-id'], contract: 'IC-IAM-02',
      },
    ], 0);

    const subject = await byEmail('buyer@example.com');
    const before2 = await api.post('/api/identity/verification', {
      subjectId: subject.id, country: 'ZM', identityType: 'national-id', identifier: 'ZM-ID-1',
    }, SESSIONS.admin);
    assert.equal(before2.adapter, 'Verify.NationalId.ZM', 'the new adapter is used for its country');
    assert.equal(before2.ok, true);

    const unconfigured = await api.post('/api/identity/verification', {
      subjectId: subject.id, country: 'TZ', identityType: 'national-id', identifier: 'TZ-ID-1',
    }, SESSIONS.admin);
    assert.equal(unconfigured.ok, false, 'a country with no adapter is refused, not guessed');
    assert.match(unconfigured.message, /no verification adapter is configured/);
  });
});
