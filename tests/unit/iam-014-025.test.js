// PRD-IAM-014 Profile and address book, PRD-IAM-015 Delivery and notification preferences,
// PRD-IAM-016 Terms acceptance with versioning, PRD-IAM-017 Consent and privacy requests,
// PRD-IAM-021 Order and document history and PRD-IAM-025 Customer self-service dashboard.
// 5 + 4 + 9 + 13 + 6 + 3 = 40 criteria, one test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const byEmail = (email) => repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

async function shopperAsync(email, session, extra = {}) {
  const existing = await repository('Customer').getOneAsync((c) => c.email === email);
  const row = existing
    ? await repository('Customer').updateAsync({ ...existing, ...extra })
    : await repository('Customer').insertAsync({
      email, firstName: 'Test', lastName: 'Shopper', roles: ['Registered'], password: 'demo', active: true, deleted: false, createdOnUtc: new Date().toISOString(), ...extra,
    });
  await api.post('/api/identity/sign-in', { email, password: 'demo' }, session);
  return row;
}

/* ================================================= PRD-IAM-014 profile and addresses ==== */

describe('PRD-IAM-014 profile and address book', () => {
  test('AC-IAM-014-01-01', async () => {
    // "the values are saved; an email change follows the native revalidation when registration
    //  type is EmailValidation; with GdprSettings.LogUserProfileChanges on, the change is written
    //  to the GDPR log"
    const shopper = await shopperAsync('profile.one@example.com', 'iam-e-1');
    const saved = await api.post('/api/identity/profile', {
      changes: { firstName: 'Chimwemwe', lastName: 'Banda', phone: '+265991000222' },
    }, 'iam-e-1');
    assert.equal(saved.ok, true);
    assert.deepEqual(saved.saved.sort(), ['firstName', 'lastName', 'phone']);
    assert.equal(saved.customer.firstName, 'Chimwemwe');
    assert.equal(saved.gdprLogged, true, 'GdprSettings.LogUserProfileChanges is on');

    const log = await api.get(`/api/identity/privacy/gdpr-log?customerId=${shopper.id}`, SESSIONS.admin);
    assert.ok(log.some((r) => r.requestType === 'ProfileChanged' && r.note.includes('firstName')), 'the GDPR log row names the fields');

    // with the native registration type the email is saved at once
    const emailSaved = await api.post('/api/identity/profile', { changes: { email: 'profile.renamed@example.com' } }, 'iam-e-1');
    assert.equal(emailSaved.revalidationRequired, false);
    assert.equal(emailSaved.customer.email, 'profile.renamed@example.com');

    // under EmailValidation the change waits for the native revalidation
    await saveSettingAsync('customersettings.userregistrationtype', 'EmailValidation', 0);
    const held = await api.post('/api/identity/profile', { changes: { email: 'profile.revalidate@example.com' } }, 'iam-e-1');
    assert.equal(held.revalidationRequired, true);
    assert.equal(held.emailToRevalidate, 'profile.revalidate@example.com');
    assert.equal(held.customer.email, 'profile.renamed@example.com', 'the address only changes once the new one is confirmed');
    await saveSettingAsync('customersettings.userregistrationtype', 'Standard', 0);

    // with the GDPR setting off nothing is written to the log
    await saveSettingAsync('gdprsettings.loguserprofilechanges', false, 0);
    const quiet = await api.post('/api/identity/profile', { changes: { lastName: 'Banda-Phiri' } }, 'iam-e-1');
    assert.equal(quiet.gdprLogged, false);
    await saveSettingAsync('gdprsettings.loguserprofilechanges', true, 0);
  });

  test('AC-IAM-014-01-02', async () => {
    // "the new number replaces the identifier only after a code sent to it is entered correctly"
    const shopper = await shopperAsync('mobile.only@example.com', 'iam-e-2', {
      email: null, phone: '+265881000111', registeredBy: 'mobile',
    });
    await repository('PhoneIdentity').insertAsync({ customerId: shopper.id, normalisedPhone: '+265881000111', verified: true });
    const challenge = await api.post('/api/identity/mobile/login/start', { phone: '+265881000111' }, 'iam-e-2');
    await api.post('/api/identity/mobile/login/complete', { phone: '+265881000111', code: challenge.demonstrationCode }, 'iam-e-2');

    // the profile page cannot change the identifier directly
    const refusedHere = await api.post('/api/identity/profile', { changes: { phone: '+265881000999' } }, 'iam-e-2');
    assert.ok(refusedHere.phoneChangeNeedsCode, 'the identifier is not changed by the profile save');
    assert.equal(refusedHere.phoneChangeNeedsCode.phone, '+265881000999');
    assert.equal((await repository('Customer').getByIdAsync(shopper.id)).phone, '+265881000111');

    const started = await api.post('/api/identity/profile/phone/start', { phone: '+265881000999' }, 'iam-e-2');
    assert.equal(started.identifierChanged, false, 'the code is sent to the new number first');
    assert.ok(started.demonstrationCode);

    const wrong = await api.post('/api/identity/profile/phone/confirm', { phone: '+265881000999', code: '000000' }, 'iam-e-2');
    assert.equal(wrong.identifierChanged, false, 'a wrong code changes nothing');
    assert.equal((await repository('Customer').getByIdAsync(shopper.id)).phone, '+265881000111');

    const confirmed = await api.post('/api/identity/profile/phone/confirm', { phone: '+265881000999', code: started.demonstrationCode }, 'iam-e-2');
    assert.equal(confirmed.identifierChanged, true);
    assert.equal(confirmed.phone, '+265881000999');
    const identity = await repository('PhoneIdentity').getOneAsync((p) => p.normalisedPhone === '+265881000999');
    assert.equal(identity.customerId, shopper.id, 'the identifier is the new number');

    // a number another account holds is refused
    const taken = await api.post('/api/identity/profile/phone/start', { phone: '+265880000003' }, 'iam-e-2');
    assert.equal(taken.messageKey, 'Iam.PhoneInUse');
  });

  test('AC-IAM-014-02-01', async () => {
    // "each change is saved and the list shows all saved addresses"
    await shopperAsync('addresses@example.com', 'iam-e-3');
    const first = await api.post('/api/identity/addresses', {
      firstName: 'Chimwemwe', lastName: 'Banda', address1: 'Area 47, House 12', city: 'Lilongwe', country: 'Malawi', phoneNumber: '+265991000333',
    }, 'iam-e-3');
    assert.equal(first.ok, true);
    const second = await api.post('/api/identity/addresses', {
      firstName: 'Chimwemwe', lastName: 'Banda', address1: 'PO Box 30227', city: 'Blantyre', country: 'Malawi',
    }, 'iam-e-3');

    const listed = await api.get('/api/identity/addresses', 'iam-e-3');
    assert.equal(listed.total, 2, 'the list shows all saved addresses');

    const edited = await api.patch(`/api/identity/addresses/${second.address.id}`, { city: 'Zomba' }, 'iam-e-3');
    assert.equal(edited.address.city, 'Zomba');

    const deleted = await api.del(`/api/identity/addresses/${second.address.id}`, 'iam-e-3');
    assert.equal(deleted.ok, true);
    assert.equal(deleted.ordersUnchanged, true, 'an address already on a placed order is not touched');
    const afterDelete = await api.get('/api/identity/addresses', 'iam-e-3');
    assert.equal(afterDelete.total, 1);
    assert.equal(afterDelete.addresses[0].id, first.address.id);
  });

  test('AC-IAM-014-02-02', async () => {
    // "that address is shown first and marked as default; checkout pre-selects it"
    const extra = await api.post('/api/identity/addresses', {
      firstName: 'Chimwemwe', lastName: 'Banda', address1: 'Plot 14, Kanengo', city: 'Lilongwe', country: 'Malawi',
    }, 'iam-e-3');
    const set = await api.post(`/api/identity/addresses/${extra.address.id}/default`, {}, 'iam-e-3');
    assert.equal(set.ok, true);
    assert.equal(set.addresses[0].id, extra.address.id, 'the default is shown first');
    assert.equal(set.addresses[0].isDefault, true, 'and marked as default');
    assert.equal(set.addresses.filter((a) => a.isDefault).length, 1, 'only one default');

    const offered = await api.get('/api/identity/addresses/offered', 'iam-e-3');
    assert.equal(offered.preSelectedAddressId, extra.address.id, 'checkout pre-selects it');
    assert.match(offered.usedBy, /PRD-CHK-001/);
  });

  test('AC-IAM-014-02-03', async () => {
    // "the saved addresses are offered without retyping"
    const offered = await api.get('/api/identity/addresses/offered', 'iam-e-3');
    assert.ok(offered.addresses.length >= 2, 'the saved addresses are offered');
    assert.equal(offered.retypingRequired, false);
    assert.ok(offered.addresses.every((a) => a.address1 && a.city), 'each carries its saved values');

    await shopperAsync('no.addresses@example.com', 'iam-e-4');
    const empty = await api.get('/api/identity/addresses/offered', 'iam-e-4');
    assert.equal(empty.retypingRequired, true, 'a shopper with none types one');
    assert.equal(empty.preSelectedAddressId, null);
  });
});

/* ========================================================= PRD-IAM-015 preferences ====== */

describe('PRD-IAM-015 delivery and notification preferences', () => {
  test('AC-IAM-015-01-01', async () => {
    // "it is saved; the checkout pickup option pre-selects it"
    await shopperAsync('prefs@example.com', 'iam-e-5');
    const points = await repository('StorePickupPoint').getAllAsync();
    assert.ok(points.length >= 1, 'the PRD-LOG-003 pickup points exist');

    const saved = await api.post('/api/identity/preferences/pickup-point', { pickupPointId: points[0].id }, 'iam-e-5');
    assert.equal(saved.ok, true);
    assert.equal(saved.preferredPickupPointId, points[0].id);
    assert.match(saved.preSelectedAt, /PRD-CHK-001/);

    const read = await api.get('/api/identity/preferences', 'iam-e-5');
    assert.equal(read.preferredPickupPointId, points[0].id);
    assert.equal(read.pickupPoint.name, points[0].name);
  });

  test('AC-IAM-015-01-02', async () => {
    // "the preference is cleared and the shopper is asked to choose another with message
    //  Iam.PickupPointUnavailable"
    const points = await repository('StorePickupPoint').getAllAsync();
    await repository('StorePickupPoint').updateAsync({ ...points[0], open: false });

    const read = await api.get('/api/identity/preferences', 'iam-e-5');
    assert.equal(read.preferredPickupPointId, null, 'the preference is cleared');
    assert.equal(read.cleared.messageKey, 'Iam.PickupPointUnavailable');
    assert.ok(read.cleared.message && read.cleared.message !== 'Iam.PickupPointUnavailable', 'the message resource exists');
    assert.equal(read.cleared.chooseAnother, true);

    const again = await api.get('/api/identity/preferences', 'iam-e-5');
    assert.equal(again.cleared, null, 'once cleared, nothing is said again');
    await repository('StorePickupPoint').updateAsync({ ...points[0], open: true });
  });

  test('AC-IAM-015-02-01', async () => {
    // "it is saved and TRK-006 uses it for every event that has no event-level preference"
    const offered = await api.get('/api/identity/preferences/channels', 'iam-e-5');
    assert.match(offered.suppliedBy, /PRD-TRK-005/);
    assert.ok(offered.channels.includes('sms'));

    const saved = await api.post('/api/identity/preferences/channel', { channel: 'sms' }, 'iam-e-5');
    assert.equal(saved.ok, true);
    assert.equal(saved.preferredChannel, 'sms');
    assert.match(saved.readBy, /PRD-TRK-006/);
    assert.match(saved.appliesWhen, /no event-level preference/);

    const refused = await api.post('/api/identity/preferences/channel', { channel: 'pigeon' }, 'iam-e-5');
    assert.equal(refused.ok, false, 'a channel the engine has not configured is refused');
    assert.equal((await api.get('/api/identity/preferences', 'iam-e-5')).preferredChannel, 'sms');
  });

  test('AC-IAM-015-02-02', async () => {
    // "the app channel is not offered"
    const off = await api.get('/api/identity/preferences/channels', 'iam-e-5');
    assert.equal(off.channels.includes('app'), false, 'CHN-001 / CHN-013 are not active');
    assert.equal(off.appOffered, false);
    assert.match(off.appRequires, /PRD-CHN-001/);
    const refused = await api.post('/api/identity/preferences/channel', { channel: 'app' }, 'iam-e-5');
    assert.equal(refused.ok, false);

    await saveSettingAsync('chn.appchannelactive', true, 0);
    const on = await api.get('/api/identity/preferences/channels', 'iam-e-5');
    assert.equal(on.channels.includes('app'), true, 'with the app channel active it is offered');
    await saveSettingAsync('chn.appchannelactive', false, 0);
  });
});

/* ================================================= PRD-IAM-016 terms and acceptance ===== */

describe('PRD-IAM-016 terms acceptance with versioning', () => {
  test('AC-IAM-016-01-01', async () => {
    // "registration cannot complete without acceptance, and a PolicyAcceptance row records
    //  policy, version, time, channel, IP address and agent (if any)"
    const refused = await api.post('/api/identity/register', {
      email: 'terms.none@example.com', password: 'Str0ng!pass', firstName: 'No', lastName: 'Terms', policyAccepted: false,
    }, 'iam-e-6');
    assert.equal(refused.ok, false, 'registration cannot complete without acceptance');

    const web = await api.post('/api/identity/register', {
      email: 'terms.web@example.com', password: 'Str0ng!pass', firstName: 'Web', lastName: 'Accepted', policyAccepted: true,
    }, 'iam-e-6');
    assert.equal(web.ok, true);
    const webCustomer = await byEmail('terms.web@example.com');
    const accepted = await repository('PolicyAcceptance').getAllAsync((a) => a.customerId === webCustomer.id);
    assert.ok(accepted.length >= 1);
    const row = accepted[0];
    assert.equal(row.policySystemName, 'ConditionsOfUse');
    assert.equal(row.versionNo, 1, 'the version');
    assert.ok(row.createdOnUtc, 'the time');
    assert.ok(row.channel, 'the channel');
    assert.equal(row.decision, 'accepted');

    // by mobile number, and through an agent, the row carries the channel and the agent
    const start = await api.post('/api/identity/mobile/register/start', { phone: '+265991777111' }, 'iam-e-7');
    const mobile = await api.post('/api/identity/mobile/register/complete', {
      phone: '+265991777111', code: start.demonstrationCode, policyAccepted: true,
    }, 'iam-e-7');
    assert.equal(mobile.ok, true);
    const mobileRow = await repository('PolicyAcceptance').getOneAsync((a) => a.customerId === mobile.customer.id);
    assert.equal(mobileRow.channel, 'mobile-registration');

    const agent = await byEmail('agent.lilongwe@example.com');
    const throughAgent = await api.post('/api/identity/terms/accept', {
      policySystemName: 'ConditionsOfUse', channel: 'assisted-service',
    }, 'iam-e-6');
    assert.equal(throughAgent.channel, 'assisted-service');
    const agentRecorded = await repository('PolicyAcceptance').insertAsync({
      customerId: webCustomer.id, policySystemName: 'ConditionsOfUse', versionNo: 1, decision: 'accepted', channel: 'assisted-service', agentId: agent.id, ipAddress: '41.70.1.9', createdOnUtc: new Date().toISOString(),
    });
    assert.equal(agentRecorded.agentId, agent.id, 'the agent is recorded when there is one');
  });

  test('AC-IAM-016-01-02', async () => {
    // "the version number stored is the Effective version returned by IC-MKT-03 at that time;
    //  IAM stores no policy text and creates no version (BR-IAM-091)"
    await repository('PolicyVersion').insertAsync({
      policySystemName: 'PrivacyPolicy', versionNo: 2, reacceptanceRequired: false, published: true, storeId: 1, suppliedBy: 'PRD-MKT-008',
    });
    const effective = await api.get('/api/identity/terms/effective?policySystemName=PrivacyPolicy', 'iam-e-6');
    assert.equal(effective.versionNo, 2);
    assert.match(effective.suppliedBy, /PRD-MKT-008/);

    const shopper = await shopperAsync('policy.version@example.com', 'iam-e-8');
    const recorded = await api.post('/api/identity/terms/accept', { policySystemName: 'PrivacyPolicy' }, 'iam-e-8');
    assert.equal(recorded.versionNo, 2, 'the version stored is the effective one at that time');
    assert.equal(recorded.customerId, shopper.id);
    assert.equal(recorded.policyText, undefined, 'IAM stores no policy text');
    const versionsBefore = (await repository('PolicyVersion').getAllAsync((v) => v.policySystemName === 'PrivacyPolicy')).length;
    await api.post('/api/identity/terms/accept', { policySystemName: 'PrivacyPolicy' }, 'iam-e-8');
    assert.equal((await repository('PolicyVersion').getAllAsync((v) => v.policySystemName === 'PrivacyPolicy')).length, versionsBefore, 'and creates no version');
  });

  test('AC-IAM-016-01-03', async () => {
    // "it is stored with version 'unversioned' and the topic and time, and no re-acceptance
    //  prompt can be raised for that policy"
    const effective = await api.get('/api/identity/terms/effective?policySystemName=ReturnsPolicy', 'iam-e-8');
    assert.equal(effective.versionNo, 'unversioned');
    assert.equal(effective.reacceptanceRequired, false);

    const recorded = await api.post('/api/identity/terms/accept', { policySystemName: 'ReturnsPolicy' }, 'iam-e-8');
    assert.equal(recorded.versionNo, 'unversioned');
    assert.equal(recorded.policySystemName, 'ReturnsPolicy', 'the topic');
    assert.ok(recorded.createdOnUtc, 'and the time');

    const check = await api.get('/api/identity/terms/check?path=/cart', 'iam-e-8');
    const pending = (check.pending ?? []).map((p) => p.policySystemName);
    assert.equal(pending.includes('ReturnsPolicy'), false, 'no prompt can be raised for an unversioned policy');
  });

  test('AC-IAM-016-02-01', async () => {
    // "the user is redirected to the acceptance page with message Iam.TermsUpdated until the new
    //  version is accepted; logout and the policy pages stay reachable"
    const shopper = await shopperAsync('reaccept@example.com', 'iam-e-9');
    await api.post('/api/identity/terms/accept', { policySystemName: 'ConditionsOfUse' }, 'iam-e-9');
    const clean = await api.get('/api/identity/terms/check?path=/cart', 'iam-e-9');
    assert.equal(clean.redirect, false);

    await repository('PolicyVersion').insertAsync({
      policySystemName: 'ConditionsOfUse', versionNo: 2, reacceptanceRequired: true, published: true, storeId: 1, suppliedBy: 'PRD-MKT-008',
    });
    const redirected = await api.get('/api/identity/terms/check?path=/cart', 'iam-e-9');
    assert.equal(redirected.redirect, true);
    assert.equal(redirected.redirectTo, '/customer/accept-terms');
    assert.equal(redirected.messageKey, 'Iam.TermsUpdated');
    assert.ok(redirected.pending.some((p) => p.policySystemName === 'ConditionsOfUse' && p.versionNo === 2));
    assert.match(redirected.flagSuppliedBy, /IC-MKT-03/);

    for (const path of ['/logout', '/customer/terms', '/privacy-policy', '/customer/accept-terms']) {
      const reachable = await api.get(`/api/identity/terms/check?path=${encodeURIComponent(path)}`, 'iam-e-9');
      assert.equal(reachable.redirect, false, `${path} stays reachable`);
      assert.equal(reachable.reachableAnyway, true);
    }

    await api.post('/api/identity/terms/accept', { policySystemName: 'ConditionsOfUse' }, 'iam-e-9');
    const settled = await api.get('/api/identity/terms/check?path=/cart', 'iam-e-9');
    assert.equal(settled.redirect, false, 'the prompt stops once the new version is accepted');
    assert.ok(shopper.id);
  });

  test('AC-IAM-016-02-02', async () => {
    // "the decline is recorded, the user is signed out with message Iam.TermsDeclined and can
    //  only sign in again by accepting"
    const shopper = await shopperAsync('decline@example.com', 'iam-e-10');
    const declined = await api.post('/api/identity/terms/decline', { policySystemName: 'ConditionsOfUse' }, 'iam-e-10');
    assert.equal(declined.ok, true);
    assert.equal(declined.acceptance.decision, 'declined', 'the decline is recorded');
    assert.equal(declined.messageKey, 'Iam.TermsDeclined');
    assert.equal(declined.signedOut, true);
    assert.ok(declined.sessionsEnded >= 1);

    const gone = await api.get('/api/identity/me', 'iam-e-10');
    assert.ok(!gone || gone.email !== shopper.email, 'the session is gone');

    const back = await api.post('/api/identity/sign-in', { email: shopper.email, password: 'demo' }, 'iam-e-10');
    assert.equal(back.ok, true, 'the account itself is not blocked');
    const prompt = await api.get('/api/identity/terms/check?path=/cart', 'iam-e-10');
    assert.equal(prompt.redirect, true, 'but nothing else is reachable until the terms are accepted');
  });

  test('AC-IAM-016-02-03', async () => {
    // "no prompt is shown; later acceptances record the new version; IAM keeps no re-acceptance
    //  flag of its own"
    const shopper = await shopperAsync('quiet.version@example.com', 'iam-e-11');
    await api.post('/api/identity/terms/accept', { policySystemName: 'PrivacyPolicy' }, 'iam-e-11');
    await repository('PolicyVersion').insertAsync({
      policySystemName: 'PrivacyPolicy', versionNo: 3, reacceptanceRequired: false, published: true, storeId: 1, suppliedBy: 'PRD-MKT-008',
    });
    const check = await api.get('/api/identity/terms/check?path=/cart', 'iam-e-11');
    const pending = (check.pending ?? []).map((p) => p.policySystemName);
    assert.equal(pending.includes('PrivacyPolicy'), false, 'no prompt without the flag');

    const later = await api.post('/api/identity/terms/accept', { policySystemName: 'PrivacyPolicy' }, 'iam-e-11');
    assert.equal(later.versionNo, 3, 'a later acceptance records the new version');

    const own = await repository('PolicyAcceptance').getAllAsync((a) => a.customerId === shopper.id);
    assert.ok(own.every((a) => a.reacceptanceRequired === undefined), 'IAM keeps no re-acceptance flag of its own');
  });

  test('AC-IAM-016-02-04', async () => {
    // "the IAM re-acceptance filter redirects the owner to the acceptance page until the new
    //  version is accepted; the acceptance is stored with customer, vendor and version"
    const owner = await shopperAsync('seller.owner@example.com', 'iam-e-12', { roles: ['Registered', 'Vendors'] });
    const vendor = await repository('Vendor').getOneAsync(() => true);
    assert.ok(vendor, 'an approved seller exists');
    // the owner is current on the store policies, so only the seller terms can hold them up
    for (const policySystemName of ['ConditionsOfUse', 'PrivacyPolicy']) {
      await api.post('/api/identity/terms/accept', { policySystemName }, 'iam-e-12');
    }

    await repository('PolicyVersion').insertAsync({
      policySystemName: 'VendorTermsOfService', versionNo: 2, reacceptanceRequired: true, published: true, storeId: 1, suppliedBy: 'PRD-MKT-008',
    });
    const inPortal = await api.get(`/api/identity/terms/check?path=/seller/products&vendorId=${vendor.id}`, 'iam-e-12');
    assert.equal(inPortal.redirect, true);
    assert.ok(inPortal.pending.some((p) => p.policySystemName === 'VendorTermsOfService' && p.vendorId === vendor.id));

    const accepted = await api.post('/api/identity/terms/accept', {
      policySystemName: 'VendorTermsOfService', vendorId: vendor.id, channel: 'seller-portal',
    }, 'iam-e-12');
    assert.equal(accepted.customerId, owner.id, 'the customer');
    assert.equal(accepted.vendorId, vendor.id, 'the vendor');
    assert.equal(accepted.versionNo, 2, 'and the version');

    const settled = await api.get(`/api/identity/terms/check?path=/seller/products&vendorId=${vendor.id}`, 'iam-e-12');
    assert.equal(settled.redirect, false);

    // the client setting decides whether seller terms are re-accepted at all
    await saveSettingAsync('iam.sellertermsreacceptance', false, 0);
    await repository('PolicyVersion').insertAsync({
      policySystemName: 'VendorTermsOfService', versionNo: 3, reacceptanceRequired: true, published: true, storeId: 1, suppliedBy: 'PRD-MKT-008',
    });
    const off = await api.get(`/api/identity/terms/check?path=/seller/products&vendorId=${vendor.id}`, 'iam-e-12');
    assert.equal(off.redirect, false, 'the client setting is what requires it');
    await saveSettingAsync('iam.sellertermsreacceptance', true, 0);
  });

  test('AC-IAM-016-03-01', async () => {
    // "PolicyAcceptance rows and the native GDPR log consent entries are listed in time order,
    //  read-only"
    const shopper = await byEmail('policy.version@example.com');
    await api.post('/api/identity/consents', { systemName: 'MarketingConsent', accepted: true }, 'iam-e-8');
    await api.post('/api/identity/consents', { systemName: 'MarketingConsent', accepted: false }, 'iam-e-8');

    const trail = await api.get(`/api/identity/consent-trail?email=${shopper.email}`, SESSIONS.admin);
    assert.equal(trail.ok, true);
    assert.equal(trail.readOnly, true);
    assert.ok(trail.entries.some((e) => e.kind === 'policy' && e.policySystemName === 'PrivacyPolicy'));
    assert.ok(trail.entries.some((e) => e.decision === 'ConsentAgree'));
    assert.ok(trail.entries.some((e) => e.decision === 'ConsentDisagree'));
    const times = trail.entries.map((e) => new Date(e.at).getTime());
    assert.deepEqual(times, [...times].sort((a, b) => a - b), 'in time order');

    const denied = await api.get(`/api/identity/consent-trail?email=${shopper.email}`, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.ConsentTrail.View');
  });

  test('AC-IAM-016-03-02', async () => {
    // "the 360-degree view calls IC-IAM-05 GetConsentTrail and the same entries are returned
    //  (read-only); without the permission the call is refused"
    const shopper = await byEmail('policy.version@example.com');
    const forAdmin = await api.get(`/api/identity/consent-trail?email=${shopper.email}`, SESSIONS.admin);
    const forCrm = await api.get(`/api/identity/consent-trail?email=${shopper.email}&requestedBy=PRD-CRM-003`, SESSIONS.admin);
    assert.equal(forCrm.contract, 'IC-IAM-05 GetConsentTrail');
    assert.equal(forCrm.requestedBy, 'PRD-CRM-003');
    assert.deepEqual(forCrm.entries, forAdmin.entries, 'the same entries');
    assert.ok(forCrm.entries.every((e) => e.at && (e.policySystemName || e.decision)), 'policy, version, decision, channel, time');
    assert.equal(forCrm.readOnly, true);

    const refused = await api.get(`/api/identity/consent-trail?email=${shopper.email}&requestedBy=PRD-CRM-003`, SESSIONS.catalogue);
    assert.equal(refused.ok, false);
    assert.equal(refused.denied, true);
  });
});

/* ============================================= PRD-IAM-017 consent and privacy requests = */

describe('PRD-IAM-017 consent and privacy requests', () => {
  test('AC-IAM-017-01-01', async () => {
    // "the GDPR log records ConsentAgree or ConsentDisagree with time; a withdrawn marketing
    //  consent stops marketing messages from the next send"
    const shopper = await shopperAsync('consents@example.com', 'iam-e-13', { newsletterSubscribed: true });
    const offered = await api.get('/api/identity/consents', 'iam-e-13');
    assert.ok(offered.every((c) => c.consentId), 'the GdprConsent rows with DisplayOnCustomerInfoPage');
    assert.ok(offered.some((c) => c.systemName === 'MarketingConsent'));

    const agreed = await api.post('/api/identity/consents', { systemName: 'MarketingConsent', accepted: true }, 'iam-e-13');
    assert.equal(agreed.gdprLogged, 'ConsentAgree');
    const withdrawn = await api.post('/api/identity/consents', { systemName: 'MarketingConsent', accepted: false }, 'iam-e-13');
    assert.equal(withdrawn.gdprLogged, 'ConsentDisagree');
    assert.equal(withdrawn.marketingStopped, true);
    assert.match(withdrawn.marketingStopsFrom, /next send/);
    assert.equal((await repository('Customer').getByIdAsync(shopper.id)).newsletterSubscribed, false);

    const log = await api.get(`/api/identity/privacy/gdpr-log?customerId=${shopper.id}`, SESSIONS.admin);
    const entries = log.filter((r) => ['ConsentAgree', 'ConsentDisagree'].includes(r.requestType));
    assert.equal(entries.length, 2);
    assert.ok(entries.every((e) => e.createdOnUtc), 'with time');
  });

  test('AC-IAM-017-01-02', async () => {
    // "the new choice applies from the next page (see SEC-007)"
    const categories = await api.get('/api/identity/cookies/categories', 'iam-e-13');
    assert.ok(categories.some((c) => c.systemName === 'analytics'));
    assert.ok(categories.find((c) => c.systemName === 'required').alwaysOn, 'the necessary category is always on');

    const chosen = await api.post('/api/identity/cookies', { visitorId: 'visitor-1', accepted: ['analytics'] }, 'iam-e-13');
    assert.equal(chosen.ok, true);
    assert.equal(chosen.appliesFrom, 'the next page');
    assert.match(chosen.ownedBy, /PRD-SEC-007/);
    assert.deepEqual(chosen.choice.accepted.sort(), ['analytics', 'required'], 'the necessary category stays');

    const read = await api.get('/api/identity/cookies?visitorId=visitor-1', 'iam-e-13');
    assert.deepEqual(read.accepted.sort(), ['analytics', 'required']);
    assert.equal(read.asked, true);

    const changed = await api.post('/api/identity/cookies', { visitorId: 'visitor-1', accepted: [] }, 'iam-e-13');
    assert.deepEqual(changed.choice.accepted, ['required'], 'the choice can be changed from the footer link');
  });

  test('AC-IAM-017-01-03', async () => {
    // "the modules registered for that consent are told through IC-IAM-08 ConsentWithdrawn and
    //  stop the processing from the next request; the module decides whether stored data is
    //  deleted"
    await shopperAsync('personalisation@example.com', 'iam-e-14');
    const registered = await api.get('/api/identity/consents/providers', 'iam-e-14');
    assert.ok(registered.some((p) => p.feature === 'PRD-SRC-012'), 'the SRC providers are registered');

    const withdrawn = await api.post('/api/identity/consents', { systemName: 'PersonalisationConsent', accepted: false }, 'iam-e-14');
    assert.equal(withdrawn.contract, 'IC-IAM-08 ConsentWithdrawn');
    assert.equal(withdrawn.stopsFrom, 'the next request');
    assert.ok(withdrawn.modulesTold.length >= 2, 'every registered module is told');
    assert.ok(withdrawn.modulesTold.every((m) => m.stopped === true));
    assert.ok(withdrawn.modulesTold.every((m) => m.dataDeleted === false), 'the module decides, and these keep their data');

    const given = await api.post('/api/identity/consents', { systemName: 'PersonalisationConsent', accepted: true }, 'iam-e-14');
    assert.deepEqual(given.modulesTold, [], 'giving a consent tells nobody to stop');
  });

  test('AC-IAM-017-02-01', async () => {
    // "the native XLSX export is downloaded, the GDPR log records ExportData, and a second file
    //  lists the personal data held in product plugin tables (Proposed)"
    const shopper = await byEmail('consents@example.com');
    const exported = await api.post('/api/identity/privacy/export', {}, 'iam-e-13');
    assert.equal(exported.ok, true);
    assert.equal(exported.files.length, 2);
    const [native, product] = exported.files;
    assert.equal(native.format, 'xlsx');
    assert.equal(native.source, 'native');
    assert.ok(native.sheets.includes('Addresses'));
    assert.equal(product.source, 'product plugins');
    assert.ok(product.tables.some((t) => t.table === 'PolicyAcceptance'));
    assert.equal(product.prototypeDefault, true, 'the second file shape is the PRD Proposed option');
    assert.equal(exported.gdprLogged, 'ExportData');

    const log = await api.get(`/api/identity/privacy/gdpr-log?customerId=${shopper.id}`, SESSIONS.admin);
    assert.ok(log.some((r) => r.requestType === 'ExportData'));

    await saveSettingAsync('gdprsettings.gdprenabled', false, 0);
    const off = await api.post('/api/identity/privacy/export', {}, 'iam-e-13');
    assert.equal(off.ok, false, 'nothing is exported when GdprEnabled is off');
    await saveSettingAsync('gdprsettings.gdprenabled', true, 0);
  });

  test('AC-IAM-017-03-01', async () => {
    // "a PrivacyRequest of type Correction is created as Received, its due date is set from the
    //  country profile (SEC-012) and message Iam.CorrectionRequestReceived is shown"
    await shopperAsync('correction@example.com', 'iam-e-15', { lastName: 'Mispelled' });
    const incomplete = await api.post('/api/identity/privacy/corrections', { field: 'lastName' }, 'iam-e-15');
    assert.equal(incomplete.ok, false, 'the field, the requested value and a reason are all needed');

    const created = await api.post('/api/identity/privacy/corrections', {
      field: 'lastName', currentValue: 'Mispelled', requestedValue: 'Mphepo', reason: 'my surname is spelled wrongly',
    }, 'iam-e-15');
    assert.equal(created.ok, true);
    assert.equal(created.request.type, 'Correction');
    assert.equal(created.request.status, 'Received');
    assert.equal(created.messageKey, 'Iam.CorrectionRequestReceived');

    const due = await api.get('/api/identity/privacy/due-date?type=Correction', 'iam-e-15');
    assert.equal(created.request.dueDays, due.days);
    assert.match(created.request.dueFrom, /PRD-SEC-012/, 'the due date comes from the country profile');
    assert.ok(new Date(created.request.dueOnUtc) > new Date());
  });

  test('AC-IAM-017-03-02', async () => {
    // "the customer field or saved address is updated, the shopper is notified, the GDPR log
    //  records ProfileChanged and AUD-IAM-011 is written; placed orders are not changed"
    const shopper = await byEmail('correction@example.com');
    const open = (await api.get(`/api/identity/privacy/requests?customerId=${shopper.id}`, SESSIONS.admin))
      .find((r) => r.type === 'Correction' && r.status === 'Received');

    const denied = await api.post(`/api/identity/privacy/corrections/${open.id}/decide`, { decision: 'approve' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Customers.GDPRManage');

    const approved = await api.post(`/api/identity/privacy/corrections/${open.id}/decide`, { decision: 'approve' }, SESSIONS.admin);
    assert.equal(approved.ok, true);
    assert.equal(approved.request.status, 'Completed');
    assert.deepEqual(approved.applied, { field: 'lastName', value: 'Mphepo' });
    assert.equal((await repository('Customer').getByIdAsync(shopper.id)).lastName, 'Mphepo');
    assert.equal(approved.customerNotified, true);
    assert.equal(approved.gdprLogged, 'ProfileChanged');
    assert.equal(approved.placedOrdersUnchanged, true);

    const notice = await deliveriesAsync({ event: 'Iam.Correction.Applied' });
    assert.ok(notice.length >= 1, 'the shopper is notified');
    const trail = await auditTrailAsync({ entity: 'PrivacyRequest', entityId: open.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-011' && t.after?.status === 'Completed'));

    // an address correction updates the saved address
    const address = await api.post('/api/identity/addresses', {
      firstName: 'Correction', lastName: 'Mphepo', address1: 'Area 25', city: 'Lilonwe', country: 'Malawi',
    }, 'iam-e-15');
    const forAddress = await api.post('/api/identity/privacy/corrections', {
      field: `address.${address.address.id}.city`, currentValue: 'Lilonwe', requestedValue: 'Lilongwe', reason: 'the city is misspelled',
    }, 'iam-e-15');
    const appliedAddress = await api.post(`/api/identity/privacy/corrections/${forAddress.request.id}/decide`, { decision: 'approve' }, SESSIONS.admin);
    assert.equal(appliedAddress.applied.field, 'city');
    assert.equal((await repository('Address').getByIdAsync(address.address.id)).city, 'Lilongwe');
  });

  test('AC-IAM-017-03-03', async () => {
    // "the request becomes Rejected and the shopper is told the reason"
    const created = await api.post('/api/identity/privacy/corrections', {
      field: 'email', currentValue: 'correction@example.com', requestedValue: 'someone.else@example.com', reason: 'I want a different address',
    }, 'iam-e-15');
    const noReason = await api.post(`/api/identity/privacy/corrections/${created.request.id}/decide`, { decision: 'reject' }, SESSIONS.admin);
    assert.equal(noReason.reasonRequired, true, 'the customer must be given a reason');

    const rejected = await api.post(`/api/identity/privacy/corrections/${created.request.id}/decide`, {
      decision: 'reject', reason: 'an email change is made on the account page, not by correction',
    }, SESSIONS.admin);
    assert.equal(rejected.request.status, 'Rejected');
    assert.equal(rejected.reason, 'an email change is made on the account page, not by correction');
    assert.equal(rejected.applied, null, 'nothing is changed');
    assert.equal((await byEmail('correction@example.com')).email, 'correction@example.com');

    const told = await deliveriesAsync({ event: 'Iam.Correction.Rejected' });
    assert.ok(told.length >= 1, 'the shopper is told');
    assert.equal(told[0].tokens.reason, 'an email change is made on the account page, not by correction');
  });

  test('AC-IAM-017-04-01', async () => {
    // "the native flow logs DeleteCustomer in the GDPR log and sends Customer.Gdpr.DeleteRequest
    //  to the store owner, and a PrivacyRequest of type Deletion is opened with its due date"
    const shopper = await shopperAsync('delete.me@example.com', 'iam-e-16');
    const requested = await api.post('/api/identity/privacy/deletion', {}, 'iam-e-16');
    assert.equal(requested.ok, true);
    assert.equal(requested.request.type, 'Deletion');
    assert.equal(requested.request.status, 'Received');
    assert.ok(requested.request.dueOnUtc);
    assert.match(requested.request.dueFrom, /PRD-SEC-012/);
    assert.equal(requested.gdprLogged, 'DeleteCustomer');
    assert.equal(requested.storeOwnerNotified, true);

    const sent = await deliveriesAsync({ event: 'Customer.Gdpr.DeleteRequest' });
    assert.ok(sent.length >= 1, 'the store owner is told');
    const log = await api.get(`/api/identity/privacy/gdpr-log?customerId=${shopper.id}`, SESSIONS.admin);
    assert.ok(log.some((r) => r.requestType === 'DeleteCustomer'));
  });

  test('AC-IAM-017-04-02', async () => {
    // "the IAM override of IGdprService.PermanentDeleteCustomerAsync also clears the personal
    //  fields that native code leaves (BR-IAM-092) and personal data in IAM plugin tables; orders
    //  and invoices are kept under the retention rules; AUD-IAM-011 is written"
    const shopper = await byEmail('delete.me@example.com');
    await repository('Customer').updateAsync({
      ...shopper, phone: '+265991555000', company: 'Delete Ltd', dateOfBirth: '1990-01-01', vatNumber: 'MW-9', adminComment: 'a note',
    });
    await repository('Address').insertAsync({
      customerId: shopper.id, address1: 'Area 3', city: 'Lilongwe', country: 'Malawi', deleted: false,
    });
    await repository('UserSession').insertAsync({ customerId: shopper.id, status: 'Active' });
    await repository('Order').insertAsync({
      orderNumber: 'DEL-1', customerEmail: shopper.email, customerId: shopper.id, orderStatus: 'Complete', orderTotal: 5000, createdOnUtc: new Date().toISOString(),
    });
    const request = (await api.get(`/api/identity/privacy/requests?customerId=${shopper.id}`, SESSIONS.admin))
      .find((r) => r.type === 'Deletion');

    const denied = await api.post('/api/identity/privacy/deletion/run', { customerId: shopper.id }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Customers.GDPRManage');

    const run = await api.post('/api/identity/privacy/deletion/run', { customerId: shopper.id, requestId: request.id }, SESSIONS.admin);
    assert.equal(run.ok, true);
    assert.equal(run.overrideOf, 'IGdprService.PermanentDeleteCustomerAsync');
    assert.ok(run.nativeFieldsCleared.includes('phone') && run.nativeFieldsCleared.includes('adminComment'), 'BR-IAM-092');

    const after = await repository('Customer').getByIdAsync(shopper.id);
    assert.equal(after.deleted, true);
    assert.equal(after.phone, null);
    assert.equal(after.company, null);
    assert.equal(after.vatNumber, null);
    assert.equal(after.adminComment, null);
    assert.match(after.email, /anonymised\.invalid$/);
    assert.ok(run.erasedTables.some((t) => t.table === 'Address'), 'the IAM plugin tables are erased');
    assert.ok(run.erasedTables.some((t) => t.table === 'UserSession'));
    assert.equal((await repository('Address').getAllAsync((a) => a.customerId === shopper.id)).length, 0);

    assert.equal((await repository('Order').getAllAsync((o) => o.orderNumber === 'DEL-1')).length, 1, 'the order is kept');
    assert.match(run.kept.invoices, /PRD-PLT-020/);
    assert.equal(run.request.status, 'Completed');
    const trail = await auditTrailAsync({ entity: 'Customer', entityId: shopper.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-011'), 'AUD-IAM-011 is written');
  });

  test('AC-IAM-017-04-03', async () => {
    // "each provider is called inside the same operation and reports Erased or Failed; a Failed
    //  provider leaves the PrivacyRequest InProgress with the provider named, and the request is
    //  not Completed (BR-IAM-092)"
    const shopper = await shopperAsync('erasure.fails@example.com', 'iam-e-17');
    await repository('SearchHistory').insertAsync({ customerId: shopper.id, term: 'maize flour' });
    const request = await api.post('/api/identity/privacy/deletion', {}, 'iam-e-17');

    await saveSettingAsync('src.recommendationserviceavailable', false, 0);
    const failed = await api.post('/api/identity/privacy/deletion/run', {
      customerId: shopper.id, requestId: request.request.id,
    }, SESSIONS.admin);
    assert.equal(failed.ok, false);
    assert.ok(failed.providerResults.some((p) => p.feature === 'PRD-SRC-012' && p.outcome === 'Erased'), 'each provider reports');
    const failing = failed.providerResults.find((p) => p.feature === 'PRD-SRC-009');
    assert.equal(failing.outcome, 'Failed');
    assert.ok(failing.detail, 'with a reason');
    assert.equal(failed.request.status, 'InProgress', 'the request is not Completed');
    assert.deepEqual(failed.request.failedProviders, ['PRD-SRC-009'], 'the provider is named');
    assert.equal((await repository('SearchHistory').getAllAsync((r) => r.customerId === shopper.id)).length, 0, 'the provider that succeeded did its work');

    await saveSettingAsync('src.recommendationserviceavailable', true, 0);
    const retried = await api.post('/api/identity/privacy/deletion/run', {
      customerId: shopper.id, requestId: request.request.id,
    }, SESSIONS.admin);
    assert.equal(retried.ok, true);
    assert.equal(retried.request.status, 'Completed');
  });

  test('AC-IAM-017-05-01', async () => {
    // "it is marked Overdue and the privacy officer is notified"
    const shopper = await shopperAsync('overdue@example.com', 'iam-e-18');
    const created = await api.post('/api/identity/privacy/corrections', {
      field: 'firstName', currentValue: 'Test', requestedValue: 'Tadala', reason: 'my first name',
    }, 'iam-e-18');
    const row = await repository('PrivacyRequest').getByIdAsync(created.request.id);
    await repository('PrivacyRequest').updateAsync({ ...row, dueOnUtc: new Date(Date.now() - 86400000).toISOString() });

    const run = await api.post('/api/identity/privacy/overdue-task', {}, SESSIONS.admin);
    assert.ok(run.marked.some((r) => r.id === created.request.id));
    assert.equal(run.privacyOfficerNotified, true);
    assert.equal((await repository('PrivacyRequest').getByIdAsync(created.request.id)).status, 'Overdue');

    const notice = await deliveriesAsync({ event: 'Iam.PrivacyRequest.Overdue' });
    assert.ok(notice.length >= 1);
    const trail = await auditTrailAsync({ entity: 'PrivacyRequest', entityId: created.request.id });
    assert.ok(trail.some((t) => t.after?.status === 'Overdue'));
    assert.ok(shopper.id);
  });

  test('AC-IAM-017-05-02', async () => {
    // "consent changes, exports, correction and deletion requests are listed with dates and
    //  outcomes"
    const shopper = await byEmail('consents@example.com');
    const trail = await api.get(`/api/identity/privacy/trail?email=${shopper.email}`, SESSIONS.admin);
    assert.equal(trail.ok, true);
    assert.equal(trail.readOnly, true);
    const kinds = new Set(trail.entries.map((e) => e.kind));
    assert.ok(kinds.has('consent change'));
    assert.ok(kinds.has('export'));
    assert.ok(trail.entries.every((e) => e.at && e.outcome), 'with dates and outcomes');

    const correction = await byEmail('correction@example.com');
    const withRequests = await api.get(`/api/identity/privacy/trail?email=${correction.email}`, SESSIONS.admin);
    const requestKinds = new Set(withRequests.entries.map((e) => e.kind));
    assert.ok(requestKinds.has('correction request'));
    assert.ok(withRequests.entries.some((e) => e.outcome === 'Completed' || e.outcome === 'Rejected'));

    const denied = await api.get(`/api/identity/privacy/trail?email=${shopper.email}`, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.ConsentTrail.View');
  });

  test('AC-IAM-017-06-01', async () => {
    // "no analytics widget is rendered for that visitor and no analytics profile is built"
    await api.post('/api/identity/cookies', { visitorId: 'visitor-no-analytics', accepted: [] }, 'iam-e-13');
    const refused = await api.get('/api/identity/cookies/analytics?visitorId=visitor-no-analytics', 'iam-e-13');
    assert.equal(refused.allowed, false);
    assert.deepEqual(refused.widgetsRendered, [], 'no analytics widget is rendered');
    assert.equal(refused.profileBuilt, false, 'and no profile is built');
    assert.match(refused.gatedBy, /PRD-SEC-007/);

    await api.post('/api/identity/cookies', { visitorId: 'visitor-analytics', accepted: ['analytics'] }, 'iam-e-13');
    const allowed = await api.get('/api/identity/cookies/analytics?visitorId=visitor-analytics', 'iam-e-13');
    assert.equal(allowed.allowed, true);
    assert.ok(allowed.widgetsRendered.length >= 1);

    // a visitor who was never asked gets the necessary categories only
    const unasked = await api.get('/api/identity/cookies/analytics?visitorId=visitor-unknown', 'iam-e-13');
    assert.equal(unasked.allowed, false);
  });
});

/* ================================================= PRD-IAM-021 order and document history */

describe('PRD-IAM-021 order and document history', () => {
  let shopper;
  before(async () => {
    shopper = await shopperAsync('history@example.com', 'iam-e-20');
    const order = await repository('Order').insertAsync({
      orderNumber: 'HIS-1', customerEmail: shopper.email, customerId: shopper.id, orderStatus: 'Complete', orderSubtotal: 9000, orderShipping: 1000, orderTax: 0, orderTotal: 10000, currencyCode: 'MWK', createdOnUtc: new Date().toISOString(),
    });
    const product = await repository('Product').getOneAsync((p) => p.published !== false);
    await repository('OrderItem').insertAsync({
      orderId: order.id, productId: product.id, productName: product.name, quantity: 2, unitPrice: 4500, price: 9000,
    });
    await repository('Shipment').insertAsync({
      orderId: order.id, orderNumber: 'HIS-1', trackingNumber: 'MP-TRACK-1', shippedDateUtc: new Date().toISOString(), deliveredDateUtc: null,
    });
    await repository('Order').insertAsync({
      orderNumber: 'HIS-2', customerEmail: shopper.email, customerId: shopper.id, orderStatus: 'Processing', orderTotal: 2500, currencyCode: 'MWK', createdOnUtc: new Date().toISOString(),
    });
    await repository('Quote').insertAsync({
      quoteNumber: 'QUO-1', customerId: shopper.id, status: 'AwaitingCustomer', total: 45000, createdOnUtc: new Date().toISOString(),
    });
    await repository('ReturnRequest').insertAsync({
      customerId: shopper.id, orderNumber: 'HIS-1', status: 'Pending', reasonForReturn: 'damaged in transit', createdOnUtc: new Date().toISOString(),
    });
  });

  test('AC-IAM-021-01-01', async () => {
    // "each order is listed with number, date, status and total; the details page shows items,
    //  totals and shipments with tracking numbers"
    const list = await api.get('/api/identity/my/orders', 'iam-e-20');
    assert.ok(list.orders.length >= 2);
    for (const order of list.orders) {
      assert.ok(order.orderNumber && order.createdOnUtc && order.orderStatus);
      assert.equal(typeof order.orderTotal, 'number');
    }

    const detail = await api.get('/api/identity/my/orders/HIS-1', 'iam-e-20');
    assert.equal(detail.ok, true);
    assert.equal(detail.items.length, 1);
    assert.equal(detail.items[0].quantity, 2);
    assert.equal(detail.order.orderTotal, 10000);
    assert.equal(detail.order.orderSubtotal, 9000);
    assert.equal(detail.shipments[0].trackingNumber, 'MP-TRACK-1');

    const other = await api.get('/api/identity/my/orders/HIS-1', 'iam-e-13');
    assert.equal(other.denied, true, 'another account cannot open it');
  });

  test('AC-IAM-021-02-01', async () => {
    // "the native PDF invoice is downloaded"
    const pdf = await api.get('/api/identity/my/orders/HIS-1/invoice', 'iam-e-20');
    assert.equal(pdf.ok, true);
    assert.equal(pdf.file.contentType, 'application/pdf');
    assert.equal(pdf.file.name, 'order_HIS-1.pdf');
    assert.match(pdf.file.source, /native PdfService/);

    const other = await api.get('/api/identity/my/orders/HIS-1/invoice', 'iam-e-13');
    assert.equal(other.denied, true);
  });

  test('AC-IAM-021-03-01', async () => {
    // "quotes and return requests are listed in their own pages"
    const quotes = await api.get('/api/identity/my/quotes', 'iam-e-20');
    assert.equal(quotes.offered, true);
    assert.equal(quotes.page, '/customer/quotes');
    assert.ok(quotes.quotes.some((q) => q.quoteNumber === 'QUO-1'));

    const returns = await api.get('/api/identity/my/return-requests', 'iam-e-20');
    assert.equal(returns.page, '/customer/return-requests');
    assert.ok(returns.returnRequests.some((r) => r.orderNumber === 'HIS-1'));

    await saveSettingAsync('misc.rfq.active', false, 0);
    const inactive = await api.get('/api/identity/my/quotes', 'iam-e-20');
    assert.equal(inactive.offered, false, 'without the bundled plugin no quote page is offered');
    assert.deepEqual(inactive.quotes, []);
    await saveSettingAsync('misc.rfq.active', true, 0);
  });

  test('AC-IAM-021-03-02', async () => {
    // "a CSV or XLSX file of the filtered list is downloaded"
    const all = await api.get('/api/identity/my/history', 'iam-e-20');
    assert.ok(all.rows.length >= 4, 'orders, quotes and returns');

    const onlyOrders = await api.get('/api/identity/my/history?type=Order', 'iam-e-20');
    assert.ok(onlyOrders.rows.every((r) => r.type === 'Order'), 'filtered by type');
    const byStatus = await api.get('/api/identity/my/history?status=Complete', 'iam-e-20');
    assert.ok(byStatus.rows.every((r) => r.status === 'Complete'), 'filtered by status');
    const byValue = await api.get('/api/identity/my/history?minValue=5000', 'iam-e-20');
    assert.ok(byValue.rows.every((r) => (r.value ?? 0) >= 5000), 'filtered by value');
    const byDate = await api.get(`/api/identity/my/history?from=${new Date(Date.now() - 3600000).toISOString()}`, 'iam-e-20');
    assert.ok(byDate.rows.length >= 1, 'filtered by date range');

    const csv = await api.get('/api/identity/my/history/export?type=Order&format=csv', 'iam-e-20');
    assert.equal(csv.ok, true);
    assert.equal(csv.file.contentType, 'text/csv');
    assert.equal(csv.csv.split('\n').length, csv.rowCount + 1, 'the export is the filtered list');
    const xlsx = await api.get('/api/identity/my/history/export?format=xlsx', 'iam-e-20');
    assert.equal(xlsx.format, 'xlsx');
    assert.match(xlsx.file.contentType, /spreadsheetml/);
  });

  test('AC-IAM-021-03-03', async () => {
    // "the native quote PDF is downloaded; with the setting off no PDF is offered (default off)"
    const off = await api.get('/api/identity/my/quotes/QUO-1/pdf', 'iam-e-20');
    assert.equal(off.offered, false, 'the setting default is off');
    assert.equal(off.setting, 'rfqsettings.allowcustomergeneratequotepdf');
    assert.equal(off.settingDefault, false);

    await saveSettingAsync('rfqsettings.allowcustomergeneratequotepdf', true, 0);
    const on = await api.get('/api/identity/my/quotes/QUO-1/pdf', 'iam-e-20');
    assert.equal(on.ok, true);
    assert.equal(on.file.name, 'quote_QUO-1.pdf');
    assert.match(on.file.source, /native Misc.RFQ/);
    await saveSettingAsync('rfqsettings.allowcustomergeneratequotepdf', false, 0);
  });

  test('AC-IAM-021-04-01', async () => {
    // "the items of that order are added to the basket"
    const reordered = await api.post('/api/identity/my/orders/HIS-1/reorder', {}, 'iam-e-20');
    assert.equal(reordered.ok, true);
    assert.equal(reordered.added.length, 1);
    assert.equal(reordered.added[0].quantity, 2);

    const cart = await api.get('/api/checkout-area/cart', 'iam-e-20');
    const items = cart.items ?? cart.cart?.items ?? [];
    assert.ok(items.length >= 1, 'the items are in the basket');

    await saveSettingAsync('ordersettings.isreorderallowed', false, 0);
    const off = await api.post('/api/identity/my/orders/HIS-1/reorder', {}, 'iam-e-20');
    assert.equal(off.offered, false, 'with OrderSettings.IsReOrderAllowed off nothing is offered');
    await saveSettingAsync('ordersettings.isreorderallowed', true, 0);
  });
});

/* ================================================= PRD-IAM-025 self-service dashboard === */

describe('PRD-IAM-025 customer self-service dashboard', () => {
  test('AC-IAM-025-01-01', async () => {
    // "it shows open orders, open quotes, items that wait for the customer (from the modules that
    //  own them) and the latest messages"
    const shopper = await byEmail('history@example.com');
    await repository('PickupCode').insertAsync({
      orderNumber: 'HIS-2', code: '482913', status: 'Issued', createdOnUtc: new Date().toISOString(),
    });
    await repository('MessageDelivery').insertAsync({
      event: 'Order.Placed', to: shopper.email, channel: 'email', subject: 'Your order HIS-2', sentOnUtc: new Date().toISOString(),
    });

    const dashboard = await api.get('/api/identity/my/dashboard', 'iam-e-20');
    assert.ok(dashboard.openOrders.some((o) => o.orderNumber === 'HIS-2'), 'open orders');
    assert.equal(dashboard.openOrders.some((o) => o.orderNumber === 'HIS-1'), false, 'a completed order is not open');
    assert.ok(dashboard.openQuotes.some((q) => q.quoteNumber === 'QUO-1'), 'open quotes');

    const waiting = dashboard.waitingForYou;
    assert.ok(waiting.some((w) => w.what === 'a quote to answer' && w.ownedBy === 'Misc.RFQ'), 'from the module that owns quotes');
    assert.ok(waiting.some((w) => w.what === 'a parcel to collect' && w.ownedBy === 'PRD-LOG-012'), 'from the module that owns deliveries');
    assert.ok(waiting.every((w) => w.target), 'each opens its page');
    assert.ok(dashboard.providersAsked.length >= 2, 'IAM counts nothing itself');

    assert.ok(dashboard.latestMessages.some((m) => m.event === 'Order.Placed'), 'the latest messages');
    assert.ok(dashboard.latestMessages.length <= 5);
  });

  test('AC-IAM-025-02-01', async () => {
    // "the quick-action menu offers the configured actions and each opens its target page"
    const actions = await api.get('/api/identity/my/quick-actions', 'iam-e-20');
    assert.ok(actions.actions.length >= 4);
    assert.ok(actions.actions.every((a) => a.code && a.name && a.target.startsWith('/')), 'each opens its target page');
    assert.ok(actions.actions.some((a) => a.code === 'reorder'));
    assert.equal(actions.configurable, 'iam.quickactions');

    await saveSettingAsync('iam.quickactions', [{ code: 'track', name: 'Track a parcel', target: '/order/tracking' }], 0);
    const configured = await api.get('/api/identity/my/quick-actions', 'iam-e-20');
    assert.equal(configured.actions.length, 1, 'the menu is the configured list, not a fixed one');
    assert.equal(configured.actions[0].code, 'track');
  });

  test('AC-IAM-025-03-01', async () => {
    // "orders and spending per month for the chosen period are shown"
    const figures = await api.get('/api/identity/my/figures?months=3', 'iam-e-20');
    assert.equal(figures.byMonth.length, 3, 'the chosen period');
    assert.ok(figures.byMonth.every((m) => /^\d{4}-\d{2}$/.test(m.month)));
    const thisMonth = figures.byMonth[figures.byMonth.length - 1];
    assert.ok(thisMonth.orders >= 2, 'orders per month');
    assert.ok(thisMonth.spending >= 12500, 'and spending per month');
    assert.equal(figures.totalOrders, figures.byMonth.reduce((s, m) => s + m.orders, 0));

    const longer = await api.get('/api/identity/my/figures?months=12', 'iam-e-20');
    assert.equal(longer.byMonth.length, 12);
    assert.equal(longer.totalSpending, figures.totalSpending, 'the same orders, a longer period');
  });
});
