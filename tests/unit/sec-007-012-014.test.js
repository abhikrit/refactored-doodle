// PRD-SEC-007 Consent and privacy tools, PRD-SEC-012 Country data-protection pack and
// PRD-SEC-014 Data classification and masking. 10 + 9 + 6 = 25 criteria, one test per AC.
//
// SEC-014 is held by decision DP-01, so it is built as the PRD's Proposed option and labelled
// "Prototype default - decision DP-01 pending".

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const VISITOR = 'sec-visitor';
const choose = (option, accepted = [], visitorId = VISITOR) => api.post('/api/security/cookies', { visitorId, option, accepted }, 'sec-guest');

/* ================================================= PRD-SEC-007 consent and privacy ===== */

describe('PRD-SEC-007 consent and privacy tools', () => {
  test('AC-SEC-007-01-01', async () => {
    // "the consent banner offers accept all, reject all except necessary, and choose per
    //  category; only necessary cookies are set before a choice (BR-SEC-020); the native
    //  single-button DisplayEuCookieLawWarning banner is off"
    const banner = await api.get('/api/security/cookies/banner?visitorId=fresh-visitor', 'sec-guest');
    assert.equal(banner.show, true);
    assert.equal(banner.gdprEnabled, true, 'GdprSettings.GdprEnabled is on');
    assert.equal(banner.messageKey, 'Sec.CookieBanner');
    assert.ok(banner.message && banner.message !== 'Sec.CookieBanner');
    assert.deepEqual(banner.options, ['accept-all', 'reject-all-except-necessary', 'choose-per-category']);
    assert.deepEqual(banner.setBeforeChoice, ['necessary'], 'only necessary cookies before a choice');
    assert.equal(banner.categoriesProposed, true, 'the category list is the PRD Proposed one');
    const names = banner.categories.map((c) => c.systemName);
    assert.ok(names.includes('necessary') && names.includes('analytics') && names.includes('marketing'));
    assert.equal(banner.nativeBanner.enabled, false, 'the native single-button banner is off');
    assert.equal(banner.nativeBanner.setting, 'storeinformationsettings.displayeucookielawwarning');

    const stored = await api.get('/api/security/cookies?visitorId=fresh-visitor', 'sec-guest');
    assert.deepEqual(stored.accepted, ['necessary']);
    assert.equal(stored.onlyNecessaryBeforeChoice, true);
  });

  test('AC-SEC-007-01-02', async () => {
    // "it is kept per visitor, message Sec.CookieSettingsSaved is shown, it applies from the
    //  next page, and a consent record with categories, banner version and time is written
    //  (AUD-SEC-007)"
    const saved = await choose('choose-per-category', ['analytics']);
    assert.equal(saved.ok, true);
    assert.equal(saved.messageKey, 'Sec.CookieSettingsSaved');
    assert.equal(saved.appliesFrom, 'the next page');
    assert.deepEqual(saved.accepted.sort(), ['analytics', 'necessary']);
    assert.equal(saved.bannerVersion, 1);
    assert.match(saved.keptFor, /cookie for this visitor|customer record/);

    const trail = await auditTrailAsync({ event: 'AUD-SEC-007' });
    const entry = trail.find((e) => e.entityId === String(saved.choice.id));
    assert.ok(entry, 'AUD-SEC-007 is written');
    assert.deepEqual(entry.after.accepted.sort(), ['analytics', 'necessary'], 'with the categories');
    assert.equal(entry.after.bannerVersion, 1, 'and the banner version');
    assert.ok(entry.occurredOnUtc, 'and the time');

    const all = await choose('accept-all');
    assert.ok(all.accepted.length > 2, 'accept all takes every category');
    const none = await choose('reject-all-except-necessary');
    assert.deepEqual(none.accepted, ['necessary']);

    // the banner is not shown again once a choice is stored
    const banner = await api.get(`/api/security/cookies/banner?visitorId=${VISITOR}`, 'sec-guest');
    assert.equal(banner.show, false);
  });

  test('AC-SEC-007-04-01', async () => {
    // "widget plugins assigned to that category are not rendered, through the SEC override of
    //  IWidgetPluginManager.LoadActivePluginsAsync"
    await choose('reject-all-except-necessary');
    const withheld = await api.get(`/api/security/widgets/active?visitorId=${VISITOR}`, 'sec-guest');
    assert.equal(withheld.overrideOf, 'IWidgetPluginManager.LoadActivePluginsAsync');
    assert.equal(withheld.rule, 'BR-SEC-020');
    const names = withheld.withheld.map((w) => w.systemName);
    assert.ok(names.includes('Widgets.GoogleAnalytics'), 'the analytics widget is not rendered');
    assert.ok(names.includes('Widgets.FacebookPixel'));
    assert.ok(withheld.active.every((w) => w.category === 'necessary'));

    await choose('choose-per-category', ['analytics']);
    const rendered = await api.get(`/api/security/widgets/active?visitorId=${VISITOR}`, 'sec-guest');
    assert.ok(rendered.active.some((w) => w.systemName === 'Widgets.GoogleAnalytics'), 'and is rendered once accepted');
    assert.ok(rendered.withheld.some((w) => w.systemName === 'Widgets.FacebookPixel'), 'marketing is still withheld');
  });

  test('AC-SEC-007-01-03', async () => {
    // "no search history is kept for personalisation and no data is sent to the recommendation
    //  service for that visitor; on withdrawal IAM-017 informs SRC through IC-IAM-08"
    await choose('reject-all-except-necessary');
    const off = await api.get(`/api/security/personalisation?visitorId=${VISITOR}`, 'sec-guest');
    assert.equal(off.allowed, false);
    assert.equal(off.searchHistoryKept, false);
    assert.equal(off.sentToRecommendationService, false);
    assert.deepEqual(off.readBy, ['PRD-SRC-009', 'PRD-SRC-012']);

    await choose('choose-per-category', ['personalisation']);
    const on = await api.get(`/api/security/personalisation?visitorId=${VISITOR}`, 'sec-guest');
    assert.equal(on.allowed, true);
    assert.equal(on.searchHistoryKept, true);

    // a registered customer who withdraws the consent has SRC told through IC-IAM-08
    await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, 'sec-shopper');
    const withdrawn = await api.post('/api/identity/consents', { systemName: 'PersonalisationConsent', accepted: false }, 'sec-shopper');
    assert.equal(withdrawn.contract, 'IC-IAM-08 ConsentWithdrawn');
    assert.ok(withdrawn.modulesTold.some((m) => m.feature === 'PRD-SRC-009'));
    assert.ok(withdrawn.modulesTold.some((m) => m.feature === 'PRD-SRC-012'));
  });

  test('AC-SEC-007-01-04', async () => {
    // "the chat widget is not rendered ... after the visitor accepts the category it is rendered
    //  from the next page"
    const map = await api.get('/api/security/widgets/map', 'sec-guest');
    const chat = map.find((w) => w.systemName === 'Widgets.AiChat');
    assert.equal(chat.category, 'functional', 'the mapping is Proposed');
    assert.equal(chat.feature, 'PRD-AI-003');

    await choose('reject-all-except-necessary');
    const off = await api.get(`/api/security/widgets/Widgets.AiChat/active?visitorId=${VISITOR}`, 'sec-guest');
    assert.equal(off.active, false);
    assert.equal(off.overrideOf, 'IWidgetPluginManager.IsPluginActiveAsync');

    await choose('choose-per-category', ['functional']);
    const on = await api.get(`/api/security/widgets/Widgets.AiChat/active?visitorId=${VISITOR}`, 'sec-guest');
    assert.equal(on.active, true, 'rendered from the next page');
  });

  test('AC-SEC-007-04-02', async () => {
    // "the pack fails validation, or the SEC action filter refuses the save with message
    //  Sec.ServerSideAnalyticsBlocked; the setting stays false (BR-SEC-021)"
    const profile = await api.get('/api/security/privacy-profile', SESSIONS.privacy);
    assert.equal(profile.serverSideAnalyticsConsent, null, 'the profile value is not configured');

    const refused = await api.post('/api/security/analytics/enable-ecommerce', { value: true }, SESSIONS.admin);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Sec.ServerSideAnalyticsBlocked');
    assert.equal(refused.settingValue, false, 'the setting stays false');
    assert.equal(refused.filterOn, 'WidgetsGoogleAnalyticsController.Configure [POST]');
    assert.equal(refused.rule, 'BR-SEC-021');
    assert.equal(await getSettingAsync('googleanalyticssettings.enableecommerce', 1, false), false);

    const pack = await api.post('/api/security/analytics/validate-pack', {
      settings: { 'googleanalyticssettings.enableecommerce': true },
    }, SESSIONS.admin);
    assert.equal(pack.ok, false, 'a pack that asks for it fails validation');
    assert.equal(pack.failedValidation, true);
    assert.equal(pack.messageKey, 'Sec.ServerSideAnalyticsBlocked');

    const trail = await auditTrailAsync({ event: 'AUD-SEC-010' });
    assert.ok(trail.some((e) => e.outcome === 'rejected'), 'the refusal is audited');

    // where the profile says consent is not needed, the save goes through
    await api.post('/api/security/privacy-profile', { values: { serverSideAnalyticsConsent: false } }, SESSIONS.privacy);
    const allowed = await api.post('/api/security/analytics/enable-ecommerce', { value: true }, SESSIONS.admin);
    assert.equal(allowed.ok, true);
    await api.post('/api/security/analytics/enable-ecommerce', { value: false }, SESSIONS.admin);
    await api.post('/api/security/privacy-profile', { values: { serverSideAnalyticsConsent: null } }, SESSIONS.privacy);
  });

  test('AC-SEC-007-02-01', async () => {
    // "the native GDPR log records the event"
    const customer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const policy = await api.post('/api/security/gdpr/consent-log', {
      customerId: customer.id, kind: 'privacy-policy', accepted: true,
    }, SESSIONS.admin);
    assert.equal(policy.logged, true);
    assert.equal(policy.requestType, 'ConsentAgree');

    const newsletter = await api.post('/api/security/gdpr/consent-log', {
      customerId: customer.id, kind: 'newsletter', accepted: false,
    }, SESSIONS.admin);
    assert.equal(newsletter.requestType, 'ConsentDisagree', 'unsubscribing is recorded too');

    const log = await api.get(`/api/identity/privacy/gdpr-log?customerId=${customer.id}`, SESSIONS.admin);
    assert.ok(log.some((r) => r.customerInfo === 'PrivacyPolicy'));
    assert.ok(log.some((r) => r.customerInfo === 'Newsletter'));

    await saveSettingAsync('gdprsettings.lognewsletterconsent', false, 0);
    const off = await api.post('/api/security/gdpr/consent-log', {
      customerId: customer.id, kind: 'newsletter', accepted: true,
    }, SESSIONS.admin);
    assert.equal(off.logged, false, 'nothing is logged when the setting is off');
    await saveSettingAsync('gdprsettings.lognewsletterconsent', true, 0);
  });

  test('AC-SEC-007-03-01', async () => {
    // "export of personal data (native XLSX) and the deletion request are offered; the flows are
    //  IAM-017"
    const tools = await api.get('/api/security/gdpr/tools', 'sec-shopper');
    assert.equal(tools.offered, true);
    assert.deepEqual(tools.tools.map((t) => t.code), ['export', 'delete']);
    assert.equal(tools.tools[0].format, 'native XLSX');
    assert.ok(tools.tools.every((t) => t.ownedBy === 'PRD-IAM-017'));

    const exported = await api.post('/api/identity/privacy/export', {}, 'sec-shopper');
    assert.equal(exported.ok, true, 'the flow itself is IAM-017');

    await saveSettingAsync('gdprsettings.gdprenabled', false, 0);
    const off = await api.get('/api/security/gdpr/tools', 'sec-shopper');
    assert.equal(off.offered, false);
    assert.deepEqual(off.tools, []);
    await saveSettingAsync('gdprsettings.gdprenabled', true, 0);
  });

  test('AC-SEC-007-05-01', async () => {
    // "GdprEnabled, LogPrivacyPolicyConsent, LogNewsletterConsent and LogUserProfileChanges are
    //  on; the native task stays disabled unless the retention rule says so, and the install
    //  value DeleteInactiveCustomersAfterMonths = 36 is not adopted as a product default"
    const check = await api.get('/api/security/gdpr/settings-check', SESSIONS.admin);
    assert.equal(check.ok, true);
    assert.equal(check.values['gdprsettings.gdprenabled'], true);
    assert.equal(check.values['gdprsettings.logprivacypolicyconsent'], true);
    assert.equal(check.values['gdprsettings.lognewsletterconsent'], true);
    assert.equal(check.values['gdprsettings.loguserprofilechanges'], true);
    assert.deepEqual(check.notOn, []);

    assert.equal(check.inactiveCustomerTask.enabled, false, 'the task stays disabled');
    assert.equal(check.inactiveCustomerTask.shouldBeEnabled, false, 'the retention rule does not ask for it');
    assert.equal(check.inactiveCustomerTask.productDefault, 'not configured', '36 months is not a product default');
    assert.match(check.inactiveCustomerTask.installValueNotAdopted, /not a product default/);
  });

  test('AC-SEC-007-04-03', async () => {
    // "no add-to-cart, remove-from-cart or wishlist event is sent to Google ... after the visitor
    //  accepts analytics the events are sent from the next request (BR-SEC-021)"
    await choose('reject-all-except-necessary');
    for (const event of ['add-to-cart', 'remove-from-cart', 'add-to-wishlist']) {
      const result = await api.post('/api/security/analytics/event', { event, visitorId: VISITOR }, 'sec-guest');
      assert.equal(result.sent, false, `${event} is not sent to Google`);
      assert.equal(result.rule, 'BR-SEC-021');
    }

    await choose('choose-per-category', ['analytics']);
    const sent = await api.post('/api/security/analytics/event', { event: 'add-to-cart', visitorId: VISITOR }, 'sec-guest');
    assert.equal(sent.sent, true, 'and they are sent once analytics is accepted');
    assert.match(sent.reason, /accepted analytics/);
  });
});

/* ============================================= PRD-SEC-012 the country pack ============= */

describe('PRD-SEC-012 country data-protection pack', () => {
  test('AC-SEC-012-01-01', async () => {
    // "it holds: law name(s) as text, regulator, data-request response time, breach deadlines,
    //  transfer conditions, consent texts per language; every value comes from configuration and
    //  unset values are shown as not configured"
    const country = await api.get('/api/security/privacy-profile/country', SESSIONS.privacy);
    assert.equal(country.country, 'MW', 'the instance country is set');

    const profile = await api.get('/api/security/privacy-profile', SESSIONS.privacy);
    assert.equal(profile.country, 'MW');
    assert.equal(profile.lawNames, 'Malawi Data Protection Act 2024', 'the law name is text from configuration');
    assert.equal(profile.lawNamesLabel, 'Prototype default - decision DP-01 pending');
    assert.equal(profile.everyValueIsConfiguration, true);
    for (const key of ['regulator', 'breachDeadlineToRegulatorHours', 'breachDeadlineToPeopleHours', 'transferConditions', 'consentTexts']) {
      assert.equal(profile.display[key], 'not configured', `${key} shows "not configured"`);
    }

    const denied = await api.get('/api/security/privacy-profile', SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.PrivacyProfile.View');

    // a country whose pack is not applied has no values at all: the profile is configuration,
    // and this instance is Malawi (the Kenya pack carries Kenya's law when the KTDA client runs)
    const kenya = await api.get('/api/security/privacy-profile?country=KE', SESSIONS.privacy);
    assert.equal(kenya.country, 'KE');
    assert.equal(kenya.display.lawNames, 'not configured');
    assert.ok(kenya.missing.includes('lawNames'));
  });

  test('AC-SEC-012-01-02', async () => {
    // "it lists the missing value with message Sec.ProfileIncomplete; IAM-017 and SEC-008 timers
    //  show not configured (BR-SEC-040)"
    const checklist = await api.get('/api/security/go-live-checklist', SESSIONS.privacy);
    assert.equal(checklist.ok, false);
    assert.equal(checklist.rule, 'BR-SEC-040');
    const missing = checklist.failing.filter((i) => i.messageKey === 'Sec.ProfileIncomplete');
    assert.ok(missing.length >= 1, 'the missing values are listed');
    assert.ok(missing.every((i) => i.value === 'not configured'));
    assert.ok(missing.some((i) => i.check.includes('regulator')));

    assert.equal(checklist.timersShown.breachToRegulator, 'not configured', 'the SEC-008 timer shows it too');
    const due = await api.get('/api/identity/privacy/due-date', SESSIONS.privacy);
    assert.ok(due.display === 'not configured' || due.configured === true, 'the IAM-017 timer reads the profile');
  });

  test('AC-SEC-012-01-03', async () => {
    // "it also holds: external AI and translation transfer rule, SMS opt-out duties and
    //  essential message types, partner consent texts, and retention per record type"
    const profile = await api.get('/api/security/privacy-profile', SESSIONS.privacy);
    for (const key of ['externalAiTransfer', 'externalAiCountries', 'smsOptOut', 'essentialMessageTypes', 'partnerConsentTexts', 'retention']) {
      assert.ok(key in profile, `the profile holds ${key}`);
      assert.equal(profile.display[key], 'not configured');
    }

    const saved = await api.post('/api/security/privacy-profile', {
      values: {
        externalAiTransfer: 'allowed to providers in the EU with a data-processing agreement',
        externalAiCountries: ['IE', 'DE'],
        smsOptOut: 'opt-out honoured within 24 hours',
        essentialMessageTypes: ['order', 'delivery', 'one-time code'],
        partnerConsentTexts: { lender: 'I agree that my order history is shared with the lender' },
        retention: { orders: '7 years', chatTranscripts: '90 days' },
      },
    }, SESSIONS.privacy);
    assert.equal(saved.ok, true);
    assert.equal(saved.profile.display.smsOptOut, 'opt-out honoured within 24 hours');
    assert.deepEqual(saved.profile.retention, { orders: '7 years', chatTranscripts: '90 days' }, 'read by PRD-PLT-020');

    const denied = await api.post('/api/security/privacy-profile', { values: { regulator: 'x' } }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.PrivacyProfile.CreateEditDelete');
  });

  test('AC-SEC-012-02-01', async () => {
    // "it is saved as a new version, listed, and exportable to CSV and XLSX (AUD-SEC-006)"
    const first = await api.post('/api/security/processing-activities', {
      purpose: 'Order fulfilment',
      dataCategories: ['name', 'address', 'phone'],
      peopleConcerned: 'shoppers',
      lawfulBasis: 'contract',
      retentionRule: 'orders: 7 years',
      recipients: ['courier'],
      systems: ['nopCommerce', 'PostGlobal'],
    }, SESSIONS.privacy);
    assert.equal(first.ok, true);
    assert.equal(first.activity.version, 1);
    assert.equal(first.activity.retentionReadFrom, 'PRD-PLT-020');

    const second = await api.post('/api/security/processing-activities', {
      purpose: 'Order fulfilment', dataCategories: ['name', 'address', 'phone', 'email'], lawfulBasis: 'contract',
    }, SESSIONS.privacy);
    assert.equal(second.activity.version, 2, 'a change is a new version');
    assert.equal(second.previousVersion, 1);

    const listed = await api.get('/api/security/processing-activities', SESSIONS.privacy);
    assert.equal(listed.filter((a) => a.purpose === 'Order fulfilment').length, 1, 'the current version is listed');
    const all = await api.get('/api/security/processing-activities?all=true', SESSIONS.privacy);
    assert.ok(all.filter((a) => a.purpose === 'Order fulfilment').length >= 2, 'the versions are kept');

    const csv = await api.get('/api/security/processing-activities/export?format=csv', SESSIONS.privacy);
    assert.equal(csv.ok, true);
    assert.equal(csv.file.contentType, 'text/csv');
    assert.ok(csv.csv.split('\n').length > 2);
    const xlsx = await api.get('/api/security/processing-activities/export?format=xlsx', SESSIONS.privacy);
    assert.equal(xlsx.ok, true);
    assert.match(xlsx.file.contentType, /spreadsheetml/);

    const trail = await auditTrailAsync({ event: 'AUD-SEC-006', entity: 'ProcessingActivity' });
    assert.ok(trail.length >= 2, 'AUD-SEC-006 is written');

    const denied = await api.post('/api/security/processing-activities', { purpose: 'x' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.PrivacyProfile.CreateEditDelete');
  });

  test('AC-SEC-012-03-01', async () => {
    // "it is linked to the processing activities and integrations concerned (SEC-006)"
    const activity = (await api.get('/api/security/processing-activities', SESSIONS.privacy))
      .find((a) => a.purpose === 'Order fulfilment');
    const transfer = await api.post('/api/security/transfers', {
      destination: 'IE',
      recipient: 'Cloud hosting provider',
      safeguard: 'standard contractual clauses',
      dataCategories: ['name', 'address'],
      activityIds: [activity.id],
      integrations: ['AI.Translation'],
    }, SESSIONS.privacy);
    assert.equal(transfer.ok, true);
    assert.equal(transfer.transfer.destination, 'IE');
    assert.equal(transfer.transfer.safeguard, 'standard contractual clauses');
    assert.deepEqual(transfer.transfer.activityIds, [activity.id], 'linked to the activity');
    assert.deepEqual(transfer.transfer.integrations, ['AI.Translation'], 'and to the integration');
    assert.match(transfer.transfer.linkedTo, /PRD-SEC-006/);

    const updated = (await api.get('/api/security/processing-activities', SESSIONS.privacy))
      .find((a) => a.id === activity.id);
    assert.ok(updated.transfers.includes('IE'), 'the activity shows the transfer');
  });

  test('AC-SEC-012-03-02', async () => {
    // "a processing activity and, when outside the instance country, a transfer record exist for
    //  it and the country profile allows it; otherwise the go-live checklist fails (BR-SEC-040)"
    await saveSettingAsync('sec.integrationenabled.recommendations', true, 0);
    await saveSettingAsync('sec.integrationcountry.recommendations', 'ZA', 0);

    const failing = await api.get('/api/security/go-live-checklist', SESSIONS.privacy);
    const item = failing.items.find((i) => i.check.includes('Recommendations'));
    assert.ok(item, 'the integration is checked');
    assert.equal(item.ok, false);
    assert.equal(item.activityRecorded, false, 'it has no processing activity');
    assert.equal(item.outsideInstanceCountry, true);
    assert.equal(item.feature, 'PRD-SRC-009');

    const activity = await api.post('/api/security/processing-activities', {
      purpose: 'Product recommendations', lawfulBasis: 'consent', systems: ['Recommendations'], cookieCategory: 'personalisation',
    }, SESSIONS.privacy);
    await api.post('/api/security/transfers', {
      destination: 'ZA', recipient: 'Recommendation service', safeguard: 'data-processing agreement', activityIds: [activity.activity.id], integrations: ['Recommendations'],
    }, SESSIONS.privacy);
    const stillFailing = await api.get('/api/security/go-live-checklist', SESSIONS.privacy);
    const withoutConditions = stillFailing.items.find((i) => i.check.includes('Recommendations'));
    assert.equal(withoutConditions.profileAllowsTransfer, 'not configured', 'the profile has no transfer conditions yet');
    assert.equal(withoutConditions.ok, false);

    await api.post('/api/security/privacy-profile', {
      values: { transferConditions: 'a transfer needs a data-processing agreement and the regulator notified' },
    }, SESSIONS.privacy);
    const passing = await api.get('/api/security/go-live-checklist', SESSIONS.privacy);
    const allowed = passing.items.find((i) => i.check.includes('Recommendations'));
    assert.equal(allowed.ok, true, 'with the activity, the transfer and the conditions it passes');
    await saveSettingAsync('sec.integrationenabled.recommendations', false, 0);
  });

  test('AC-SEC-012-04-01', async () => {
    // "the processing activity shows the assessment status; on the review date the privacy
    //  officer is reminded"
    const flagged = await api.post('/api/security/processing-activities', {
      purpose: 'Credit scoring', lawfulBasis: 'consent', needsImpactAssessment: true, systems: ['Lender'],
    }, SESSIONS.privacy);
    assert.equal(flagged.activity.assessmentStatus, 'Required');

    const assessment = await api.post('/api/security/impact-assessments', {
      activityId: flagged.activity.id,
      risks: ['a wrong score refuses credit'],
      measures: ['a person reviews every refusal'],
      decision: 'Approved with measures',
      document: 'dpia-credit-scoring.pdf',
      reviewOnUtc: new Date(Date.now() - 1000).toISOString(),
    }, SESSIONS.privacy);
    assert.equal(assessment.ok, true);
    assert.equal(assessment.activity.assessmentStatus, 'Approved with measures', 'the activity shows the status');
    assert.equal(assessment.assessment.document, 'dpia-credit-scoring.pdf');

    const reminders = await api.post('/api/security/impact-assessments/reminders', {}, SESSIONS.privacy);
    assert.ok(reminders.reminded >= 1, 'the review date is reached');
    assert.equal(reminders.privacyOfficerReminded, true);
    const sent = await deliveriesAsync({ event: 'Sec.ImpactAssessment.Review' });
    assert.ok(sent.length >= 1);

    const again = await api.post('/api/security/impact-assessments/reminders', {}, SESSIONS.privacy);
    assert.equal(again.reminded, 0, 'and the reminder is not repeated');
  });

  test('AC-SEC-012-05-01', async () => {
    // "the due date is the receipt time plus the response time of the profile; requests past it
    //  are listed as Overdue"
    await api.post('/api/security/privacy-profile', { values: { dataRequestResponseDays: 14 } }, SESSIONS.privacy);
    const receivedOnUtc = '2026-03-01T00:00:00.000Z';
    const deadline = await api.get(`/api/security/privacy-profile/deadline?receivedOnUtc=${encodeURIComponent(receivedOnUtc)}`, SESSIONS.privacy);
    assert.equal(deadline.configured, true);
    assert.equal(deadline.days, 14);
    assert.equal(deadline.dueOnUtc, '2026-03-15T00:00:00.000Z', 'the receipt time plus the response time');

    await api.post('/api/identity/sign-in', { email: 'buyer@example.com', password: 'demo' }, 'sec-shopper');
    const request = await api.post('/api/identity/privacy/corrections', {
      field: 'firstName', currentValue: 'Amina', requestedValue: 'Aminata', reason: 'my first name',
    }, 'sec-shopper');
    assert.equal(request.request.dueDays, 14, 'the request takes the response time of the profile');

    const row = await repository('PrivacyRequest').getByIdAsync(request.request.id);
    await repository('PrivacyRequest').updateAsync({ ...row, dueOnUtc: new Date(Date.now() - 86400000).toISOString() });
    const run = await api.post('/api/identity/privacy/overdue-task', {}, SESSIONS.admin);
    assert.ok(run.marked.some((r) => r.id === request.request.id), 'and is listed as Overdue once it is past');
  });

  test('AC-SEC-012-06-01', async () => {
    // "an analytics processing activity exists with lawful basis consent, and it is linked to the
    //  SEC-007 analytics cookie category"
    const before = await api.get('/api/security/go-live-checklist', SESSIONS.privacy);
    const missing = before.items.find((i) => i.check === 'analytics processing activity');
    assert.ok(missing, 'the checklist looks for it');
    assert.equal(missing.ok, false);
    assert.equal(missing.linkedCookieCategory, 'not configured');

    await api.post('/api/security/processing-activities', {
      purpose: 'Website analytics', lawfulBasis: 'consent', dataCategories: ['pages viewed'], cookieCategory: 'analytics', systems: ['Widgets.GoogleAnalytics'],
    }, SESSIONS.privacy);

    const after2 = await api.get('/api/security/go-live-checklist', SESSIONS.privacy);
    const found = after2.items.find((i) => i.check === 'analytics processing activity');
    assert.equal(found.ok, true);
    assert.equal(found.lawfulBasis, 'consent');
    assert.equal(found.linkedCookieCategory, 'analytics');
    assert.equal(found.linkedTo, 'PRD-SEC-007');
  });
});

/* ========================================= PRD-SEC-014 classification and masking ======= */

describe('PRD-SEC-014 data classification and masking', () => {
  test('AC-SEC-014-01-01', async () => {
    // "the classification is saved and audited (AUD-SEC-009)" - held by DP-01, built as Proposed
    const listed = await api.get('/api/security/classification', SESSIONS.admin);
    assert.deepEqual(listed.classes, ['Public', 'Internal', 'Confidential', 'Restricted', 'Personal', 'Financial'], 'the classes of FC-M21-004');
    assert.equal(listed.heldBy, 'DP-01');
    assert.equal(listed.prototypeDefaultLabel, 'Prototype default - decision DP-01 pending');

    const denied = await api.post('/api/security/classification', {
      entity: 'Customer', field: 'adminComment', class: 'Internal', masking: 'hidden',
    }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.DataClassification.CreateEditDelete');

    const saved = await api.post('/api/security/classification', {
      entity: 'Customer', field: 'adminComment', class: 'Internal', masking: 'hidden', unmaskedFor: ['Administrators'],
    }, SESSIONS.privacy);
    assert.equal(saved.ok, true);
    assert.equal(saved.classification.class, 'Internal');

    const read = await api.get('/api/security/classification/field?entity=Customer&field=adminComment', SESSIONS.admin);
    assert.equal(read.classified, true);
    assert.equal(read.masking, 'hidden');
    assert.equal(read.contract, 'IC-SEC-04');

    const refused = await api.post('/api/security/classification', {
      entity: 'Customer', field: 'adminComment', class: 'Secret', masking: 'hidden',
    }, SESSIONS.privacy);
    assert.equal(refused.ok, false, 'a class outside the list is refused');

    const trail = await auditTrailAsync({ event: 'AUD-SEC-009' });
    assert.ok(trail.some((e) => e.entityId === 'Customer.adminComment'), 'AUD-SEC-009 is written');
  });

  test('AC-SEC-014-02-01', async () => {
    // "the value is masked by the SEC global result filter; if masking fails the value is not
    //  shown (fail closed, BR-SEC-060)"
    const rows = [
      { id: 1, phone: '+265991000222', email: 'amina.banda@example.com' },
      { id: 2, phone: '+265881000111', email: 'chimwemwe@example.com' },
    ];
    const masked = await api.post('/api/security/classification/mask-rows', { entity: 'Customer', rows }, SESSIONS.catalogue);
    assert.equal(masked.filter, 'the SEC global result filter');
    assert.equal(masked.rows[0].phone, '*********0222', 'only the last digits of a phone number');
    assert.equal(masked.rows[0].email, 'a**********@example.com');

    const unmasked = await api.post('/api/security/classification/mask-rows', { entity: 'Customer', rows }, SESSIONS.support);
    assert.equal(unmasked.rows[0].phone, '+265991000222', 'a role on the unmasked list sees the value');

    // fail closed: a value the rule cannot be applied to is not shown
    const broken = await api.post('/api/security/classification/mask', {
      entity: 'Customer', field: 'email', value: 'not-an-email',
    }, SESSIONS.catalogue);
    assert.equal(broken.shown, false);
    assert.equal(broken.value, null, 'the value is not shown');
    assert.equal(broken.failedClosed, true);
    assert.equal(broken.rule, 'BR-SEC-060');
  });

  test('AC-SEC-014-02-02', async () => {
    // "the full value is shown and AUD-SEC-008 is written"
    const customer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const denied = await api.post('/api/security/classification/reveal', {
      entity: 'Customer', field: 'phone', entityId: customer.id,
    }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Security.Core.UnmaskedData.View');

    const revealed = await api.post('/api/security/classification/reveal', {
      entity: 'Customer', field: 'phone', entityId: customer.id,
    }, SESSIONS.admin);
    assert.equal(revealed.ok, true);
    assert.equal(revealed.value, customer.phone, 'the full value');
    assert.equal(revealed.masked, false);

    const trail = await auditTrailAsync({ event: 'AUD-SEC-008' });
    const entry = trail.find((e) => e.entityId === String(customer.id));
    assert.ok(entry, 'AUD-SEC-008 is written');
    assert.equal(entry.after.field, 'phone');
    assert.equal(entry.actor, 'admin@example.com');
  });

  test('AC-SEC-014-02-03', async () => {
    // "masked fields are masked in the file through the SEC override of IExportManager, except in
    //  the customer's own GDPR export"
    const rows = [{ id: 1, phone: '+265991000222', email: 'amina.banda@example.com' }];
    const staffExport = await api.post('/api/security/classification/export', {
      entity: 'Customer', rows, purpose: 'staff',
    }, SESSIONS.catalogue);
    assert.equal(staffExport.overrideOf, 'IExportManager');
    assert.equal(staffExport.masked, true);
    assert.equal(staffExport.rows[0].phone, '*********0222');
    assert.ok(staffExport.maskedFields.includes('phone'));

    const subjectExport = await api.post('/api/security/classification/export', {
      entity: 'Customer', rows, purpose: 'gdpr-subject-export',
    }, SESSIONS.catalogue);
    assert.equal(subjectExport.masked, false, 'the customer gets their own data in full');
    assert.equal(subjectExport.rows[0].phone, '+265991000222');
    assert.match(subjectExport.reason, /PRD-IAM-017/);
  });

  test('AC-SEC-014-02-04', async () => {
    // "the value is masked or redacted according to its class"
    const forLog = await api.post('/api/security/classification/mask-for-log', {
      entity: 'Customer',
      values: { phone: '+265991000222', email: 'amina.banda@example.com', firstName: 'Amina' },
    }, SESSIONS.admin);
    assert.equal(forLog.values.phone, '*********0222', 'the classified field is masked');
    assert.equal(forLog.values.email, 'a**********@example.com');
    assert.equal(forLog.values.firstName, 'Amina', 'an unclassified field is written as it is');
    assert.ok(forLog.applied.some((a) => a.field === 'phone' && a.class === 'Personal'));

    // a value the rule cannot be applied to is redacted rather than written
    const bad = await api.post('/api/security/classification/mask-for-log', {
      entity: 'Customer', values: { email: 'not-an-email' },
    }, SESSIONS.admin);
    assert.equal(bad.values.email, '[redacted]');
  });

  test('AC-SEC-014-02-05', async () => {
    // "CRM-003 reads the class and masking rule of each field through IC-SEC-04 and the CRM list
    //  is no longer used; reveal rights stay with the CRM permission"
    const rules = await api.get('/api/security/classification/crm-rules?entity=Customer', SESSIONS.admin);
    assert.equal(rules.enabled, true);
    assert.equal(rules.source, 'IC-SEC-04');
    assert.equal(rules.crmOwnListUsed, false, 'the CRM list is no longer used');
    assert.ok(rules.fields.some((f) => f.field === 'phone' && f.masking === 'last-four'));
    assert.equal(rules.revealPermission, 'Crm.Core.CustomerView.Unmask', 'the reveal right stays with the CRM permission');

    await saveSettingAsync('sec.dataclassificationenabled', false, 0);
    const off = await api.get('/api/security/classification/crm-rules', SESSIONS.admin);
    assert.equal(off.source, 'the CRM-003 list', 'with SEC-014 off CRM uses its own list again');
    assert.equal(off.crmOwnListUsed, true);
    await saveSettingAsync('sec.dataclassificationenabled', true, 0);
  });
});
