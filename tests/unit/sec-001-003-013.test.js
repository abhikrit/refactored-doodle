// PRD-SEC-001 Encryption and transport security, PRD-SEC-003 PCI-DSS scope control and
// PRD-SEC-013 Bot protection. 10 + 4 + 5 = 19 criteria, one test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { validatePack } from '../../packages/server/src/core/pack-loader.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

/* ================================================= PRD-SEC-001 transport and keys ====== */

describe('PRD-SEC-001 encryption and transport security', () => {
  test('AC-SEC-001-01-01', async () => {
    // "it is redirected to HTTPS; Store.SslEnabled is true for every store, because the native
    //  HttpsRequirement filter redirects HTTPS to HTTP when it is false"
    const overHttp = await api.get('/api/security/transport/https?scheme=http&path=/cart', SESSIONS.admin);
    assert.equal(overHttp.redirect, true);
    assert.equal(overHttp.statusCode, 302);
    assert.match(overHttp.redirectTo, /^https:\/\//);

    const overHttps = await api.get('/api/security/transport/https?scheme=https', SESSIONS.admin);
    assert.equal(overHttps.redirect, false);
    assert.equal(overHttps.statusCode, 200);

    assert.equal(overHttps.sslEnabled, true, 'Store.SslEnabled is true');
    assert.deepEqual(overHttps.storesWithoutSsl, [], 'for every store');
    assert.equal(overHttps.nativeFilter, 'HttpsRequirement');
    assert.match(overHttps.note, /redirects HTTPS to HTTP when Store.SslEnabled is false/);
  });

  test('AC-SEC-001-01-02', async () => {
    // "HostingConfig.UseProxy and ForwardedProtoHeaderName are set so the application sees the
    //  original HTTPS scheme and issues the auth cookie with the Secure flag"
    const before2 = await api.get('/api/security/transport/proxy', SESSIONS.admin);
    assert.equal(before2.configured, false);
    assert.equal(before2.authCookieSecureFlag, false, 'without them the cookie is not marked Secure');
    assert.equal(before2.useProxy, 'not configured');

    await saveSettingAsync('hostingconfig.useproxy', true, 0);
    await saveSettingAsync('hostingconfig.forwardedprotoheadername', 'X-Forwarded-Proto', 0);
    const configured = await api.get('/api/security/transport/proxy', SESSIONS.admin);
    assert.equal(configured.configured, true);
    assert.equal(configured.useProxy, true);
    assert.equal(configured.forwardedProtoHeaderName, 'X-Forwarded-Proto');
    assert.equal(configured.schemeSeenByApplication, 'https');
    assert.equal(configured.authCookieSecureFlag, true);
    assert.equal(configured.cookieSecurePolicy, 'CookieSecurePolicy.SameAsRequest');
  });

  test('AC-SEC-001-01-03', async () => {
    // "only the versions and suites in the checklist are accepted; the minimum version is Not
    //  stated in source (catalog target TLS 1.2 or higher, Proposed)"
    const good = await api.get('/api/security/transport/tls?version=TLS%201.3', SESSIONS.admin);
    assert.equal(good.accepted, true);
    assert.equal(good.checklist.minimumVersion, 'TLS 1.2');
    assert.match(good.checklist.minimumVersionSource, /Not stated in source/);
    assert.match(good.prototypeDefault, /not stated in source/);

    for (const version of ['TLS 1.0', 'TLS 1.1', 'SSL 3.0']) {
      const refused = await api.get(`/api/security/transport/tls?version=${encodeURIComponent(version)}`, SESSIONS.admin);
      assert.equal(refused.accepted, false, `${version} is refused`);
    }
    const badSuite = await api.get('/api/security/transport/tls?version=TLS%201.2&cipherSuite=TLS_RSA_WITH_3DES_EDE_CBC_SHA', SESSIONS.admin);
    assert.equal(badSuite.accepted, false, 'a suite not on the checklist is refused');
    const goodSuite = await api.get('/api/security/transport/tls?version=TLS%201.2&cipherSuite=TLS_AES_256_GCM_SHA384', SESSIONS.admin);
    assert.equal(goodSuite.accepted, true);
  });

  test('AC-SEC-001-01-04', async () => {
    // "it uses HTTPS; an adapter configured with a plain-HTTP endpoint is refused at save time"
    const refused = await api.post('/api/security/transport/adapters', {
      systemName: 'Sms.Gateway', endpoint: 'http://sms.example.com/send',
    }, SESSIONS.admin);
    assert.equal(refused.ok, false);
    assert.equal(refused.refused, true);
    assert.equal(refused.saved, false);
    assert.equal(refused.scheme, 'http');

    const saved = await api.post('/api/security/transport/adapters', {
      systemName: 'Sms.Gateway', endpoint: 'https://sms.example.com/send',
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);
    assert.equal(saved.scheme, 'https');

    const listed = await api.get('/api/security/transport/adapters', SESSIONS.admin);
    assert.equal(listed.allHttps, true);
    assert.equal(listed.adapters.find((a) => a.systemName === 'Sms.Gateway').https, true);

    const trail = await auditTrailAsync({ entity: 'ExternalAdapter' });
    assert.ok(trail.some((e) => e.outcome === 'rejected'), 'the refusal is audited');
  });

  test('AC-SEC-001-02-01', async () => {
    // "encryption at rest is enabled for each (hosting function) and recorded with evidence"
    const before2 = await api.get('/api/security/encryption/at-rest', SESSIONS.admin);
    assert.equal(before2.ok, false);
    assert.deepEqual(before2.items.map((i) => i.target), ['database', 'file storage', 'backups']);
    assert.ok(before2.items.every((i) => i.evidence === 'not configured'));
    assert.equal(before2.hostingFunction, true);

    const denied = await api.post('/api/security/encryption/at-rest', {
      target: 'database', enabled: true, mechanism: 'transparent data encryption', evidence: 'hosting ticket OPS-1182',
    }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Configuration.ManageSettings');

    for (const [target, mechanism, evidence] of [
      ['database', 'transparent data encryption', 'hosting ticket OPS-1182'],
      ['file storage', 'provider-managed volume encryption', 'hosting ticket OPS-1183'],
      ['backups', 'encrypted backup bucket', 'hosting ticket OPS-1184'],
    ]) {
      const recorded = await api.post('/api/security/encryption/at-rest', {
        target, enabled: true, mechanism, evidence,
      }, SESSIONS.admin);
      assert.equal(recorded.ok, true);
      assert.equal(recorded.recorded, target);
    }
    const after2 = await api.get('/api/security/encryption/at-rest', SESSIONS.admin);
    assert.equal(after2.ok, true);
    assert.ok(after2.items.every((i) => i.enabled && i.mechanism !== 'not configured' && i.recordedOnUtc));

    const refused = await api.post('/api/security/encryption/at-rest', {
      target: 'laptops', enabled: true, mechanism: 'x', evidence: 'y',
    }, SESSIONS.admin);
    assert.equal(refused.ok, false, 'only the three targets of the checklist');
  });

  test('AC-SEC-001-02-02', async () => {
    // "UseAesEncryptionAlgorithm is true (install default) and EncryptionKey is unique to the
    //  instance and not taken from a configuration pack (BR-SEC-002)"
    const settings = await api.get('/api/security/encryption/settings', SESSIONS.admin);
    assert.equal(settings.useAesEncryptionAlgorithm, true);
    assert.equal(settings.installDefault, true);
    assert.equal(settings.encryptionKeyFromPack, false);
    assert.equal(settings.encryptionKeyUniqueToInstance, true);
    assert.equal(settings.rule, 'BR-SEC-002');

    // a pack carrying the key, or switching AES off, is refused
    const withKey = validatePack({ id: 'bad', settings: { 'securitysettings.encryptionkey': 'shared-key' } });
    assert.ok(withKey.some((p) => p.severity === 'refused' && p.rule === 'BR-SEC-002'));
    const withoutAes = validatePack({ id: 'bad', settings: { 'securitysettings.useaesencryptionalgorithm': false } });
    assert.ok(withoutAes.some((p) => p.severity === 'refused' && p.rule === 'BR-SEC-002'));
  });

  test('AC-SEC-001-03-01', async () => {
    // "CustomerPassword holds a salted hash; DefaultPasswordFormat is Hashed and
    //  HashedPasswordFormat is SHA512 (install defaults)"
    await api.post('/api/identity/register', {
      policyAccepted: true, email: 'hashed.password@example.com', password: 'Str0ng!pass', firstName: 'Hash', lastName: 'Ed',
    }, 'sec-pw');

    const storage = await api.get('/api/security/encryption/passwords', SESSIONS.admin);
    assert.equal(storage.defaultPasswordFormat, 'Hashed');
    assert.equal(storage.hashedPasswordFormat, 'SHA512');
    assert.deepEqual(storage.installDefaults, { defaultPasswordFormat: 'Hashed', hashedPasswordFormat: 'SHA512' });
    assert.ok(storage.passwordsStored >= 1);
    assert.equal(storage.saltedHash, true, 'every stored password has a salt and a hash');
    assert.equal(storage.clearPasswordsStored, 0);

    const row = await plainRepository('CustomerPassword').getOneAsync(() => true);
    assert.ok(row.passwordSalt, 'the salt');
    assert.ok(row.password && row.password.length >= 64, 'and the hash');
  });

  test('AC-SEC-001-03-02', async () => {
    // "it is rejected and nothing is changed (BR-SEC-001)"
    const before2 = await getSettingAsync('customersettings.defaultpasswordformat', 1, 'Hashed');
    for (const format of ['Clear', 'Encrypted']) {
      const problems = validatePack({ id: 'bad-client', settings: { 'customersettings.defaultpasswordformat': format } });
      const refused = problems.find((p) => p.key === 'customersettings.defaultpasswordformat');
      assert.ok(refused, `${format} is refused`);
      assert.equal(refused.severity, 'refused');
      assert.equal(refused.rule, 'BR-SEC-001');
    }
    assert.equal(await getSettingAsync('customersettings.defaultpasswordformat', 1, 'Hashed'), before2, 'nothing is changed');

    const good = validatePack({ id: 'good-client', settings: { 'customersettings.defaultpasswordformat': 'Hashed' } });
    assert.equal(good.filter((p) => p.key === 'customersettings.defaultpasswordformat').length, 0);
  });

  test('AC-SEC-001-04-01', async () => {
    // Withdrawn (VER-500): 5.00.1 removed card storage, so there is nothing to check before
    // go-live. The withdrawal is recorded, and AC-SEC-001-04-02 verifies it.
    const withdrawn = await api.get('/api/security/pci/withdrawn', SESSIONS.admin);
    assert.equal(withdrawn.criterion, 'AC-SEC-001-04-01');
    assert.equal(withdrawn.status, 'Withdrawn');
    assert.equal(withdrawn.decision, 'VER-500');
    assert.equal(withdrawn.verifiedBy, 'AC-SEC-001-04-02');
    assert.match(withdrawn.reason, /ProcessPaymentResult has no AllowStoringCreditCardNumber/);
    assert.ok(withdrawn.removedFields.includes('allowStoringCreditCardNumber'));
    assert.ok(withdrawn.removedFields.includes('maskedCreditCardNumber'));

    // the baseline this prototype is pinned to is the release the withdrawal rests on
    const meta = await api.get('/api/meta', SESSIONS.admin);
    assert.equal(meta.baseline.tag, 'release-5.00.1');
  });

  test('AC-SEC-001-04-02', async () => {
    // "no card number, masked card number, card holder, expiry or security code is stored on the
    //  order or shown in admin, and no admin action to edit card data exists (BR-SEC-003)"
    const order = await repository('Order').insertAsync({
      orderNumber: 'PCI-1', customerEmail: 'buyer@example.com', orderStatus: 'Complete', orderTotal: 15000, createdOnUtc: new Date().toISOString(),
    });
    await api.post('/api/security/pci/card-payment', {
      orderNumber: 'PCI-1', systemName: 'Payments.Card', token: 'tok_9f2b', lastDigits: '4242', amount: 15000,
    }, SESSIONS.admin);

    const scan = await api.get('/api/security/pci/card-scan', SESSIONS.admin);
    assert.equal(scan.clean, true);
    assert.deepEqual(scan.findings, []);
    assert.equal(scan.adminActionExists, false);
    assert.match(scan.adminAction, /EditCreditCardInfo was removed/);
    assert.equal(scan.rule, 'BR-SEC-003');

    const stored = await repository('Order').getByIdAsync(order.id);
    for (const field of scan.fieldsChecked) {
      assert.equal(stored[field], undefined, `the order holds no ${field}`);
    }
    const transaction = await repository('PaymentTransaction').getOneAsync((t) => t.orderNumber === 'PCI-1');
    assert.equal(transaction.gatewayToken, 'tok_9f2b');
    assert.equal(transaction.maskedLastDigits, '4242');
    assert.equal(transaction.cardNumber, undefined);
  });
});

/* ===================================================== PRD-SEC-003 PCI-DSS scope ======== */

describe('PRD-SEC-003 PCI-DSS scope control', () => {
  test('AC-SEC-003-01-01', async () => {
    // "it is Redirection (hosted payment page) or uses gateway-hosted fields; the platform never
    //  receives the card number or security code"
    const redirection = await api.post('/api/security/pci/review-adapter', {
      systemName: 'Payments.CardRedirect', paymentMethodType: 'Redirection',
    }, SESSIONS.admin);
    assert.equal(redirection.accepted, true);
    assert.equal(redirection.platformReceivesCardNumber, false);
    assert.deepEqual(redirection.acceptedTypes, ['Redirection', 'GatewayHostedFields']);
    assert.ok(redirection.rules.includes('BR-PAY-011'));

    const hostedFields = await api.post('/api/security/pci/review-adapter', {
      systemName: 'Payments.CardFields', paymentMethodType: 'GatewayHostedFields',
    }, SESSIONS.admin);
    assert.equal(hostedFields.accepted, true);

    const standard = await api.post('/api/security/pci/review-adapter', {
      systemName: 'Payments.CardStandard', paymentMethodType: 'Standard',
    }, SESSIONS.admin);
    assert.equal(standard.accepted, false, 'a Standard card adapter is not accepted');
  });

  test('AC-SEC-003-01-02', async () => {
    // "only the gateway token and the masked last digits are stored"
    const recorded = await api.post('/api/security/pci/card-payment', {
      orderNumber: 'PCI-2', systemName: 'Payments.CardRedirect', token: 'tok_tokenised', lastDigits: '1881', amount: 9000,
    }, SESSIONS.admin);
    assert.equal(recorded.ok, true);
    assert.deepEqual(recorded.stored, ['gatewayToken', 'maskedLastDigits']);
    assert.equal(recorded.transaction.gatewayToken, 'tok_tokenised');
    assert.equal(recorded.transaction.maskedLastDigits, '1881');
    for (const field of recorded.notStored) {
      assert.equal(recorded.transaction[field], undefined, `${field} is not stored`);
    }

    const review = await api.post('/api/security/pci/review-adapter', {
      systemName: 'Payments.CardRedirect', paymentMethodType: 'Redirection', tokenisation: true,
    }, SESSIONS.admin);
    assert.deepEqual(review.stores, ['gateway token', 'masked last digits']);
  });

  test('AC-SEC-003-01-03', async () => {
    // "it is not accepted for card payments (BR-SEC-003)"
    const refused = await api.post('/api/security/pci/review-adapter', {
      systemName: 'Payments.InlineCard', paymentMethodType: 'Standard', takesCardFieldsInShopPage: true,
    }, SESSIONS.admin);
    assert.equal(refused.accepted, false);
    assert.equal(refused.platformReceivesCardNumber, true);
    assert.match(refused.reason, /takes card fields in the shop page is not accepted/);
    assert.ok(refused.rules.includes('BR-SEC-003'));

    const trail = await auditTrailAsync({ entity: 'PaymentMethod', entityId: 'Payments.InlineCard' });
    assert.ok(trail.some((e) => e.outcome === 'rejected'), 'the refusal is recorded');

    // even a Redirection adapter is refused if it takes the fields itself
    const alsoRefused = await api.post('/api/security/pci/review-adapter', {
      systemName: 'Payments.Hybrid', paymentMethodType: 'Redirection', takesCardFieldsInShopPage: true,
    }, SESSIONS.admin);
    assert.equal(alsoRefused.accepted, false);
  });

  test('AC-SEC-003-02-01', async () => {
    // "the database and the logs are scanned for card-number patterns, then no card number is
    //  found (test note T-PAY-05)"
    await repository('Log').insertAsync({
      logLevel: 'Information', shortMessage: 'Payment authorised', fullMessage: 'token tok_9f2b for order PCI-1', createdOnUtc: new Date().toISOString(),
    });
    const scan = await api.get('/api/security/pci/card-scan', SESSIONS.admin);
    assert.equal(scan.clean, true, 'nothing that looks like a card number');
    assert.equal(scan.testNote, 'T-PAY-05');
    assert.ok(scan.entitiesScanned.includes('Log'));
    assert.ok(scan.entitiesScanned.includes('AuditEntry'));

    // the scan is not blind: a card number put in a log is found
    await repository('Log').insertAsync({
      logLevel: 'Error', shortMessage: 'bad gateway payload', fullMessage: 'card 4111111111111111 refused', createdOnUtc: new Date().toISOString(),
    });
    const dirty = await api.get('/api/security/pci/card-scan', SESSIONS.admin);
    assert.equal(dirty.clean, false);
    assert.ok(dirty.findings.some((f) => f.entity === 'Log' && f.kind === 'value looks like a card number'));
    const planted = await repository('Log').getOneAsync((l) => l.fullMessage?.includes('4111111111111111'));
    await repository('Log').deleteAsync(planted.id);
    assert.equal((await api.get('/api/security/pci/card-scan', SESSIONS.admin)).clean, true);
  });
});

/* ======================================================== PRD-SEC-013 bot protection ==== */

describe('PRD-SEC-013 bot protection', () => {
  before(async () => {
    await api.post('/api/security/captcha', {
      values: {
        'captchasettings.enabled': true,
        'captchasettings.captchatype': 'ReCaptchaV3',
        'captchasettings.recaptchapublickey': 'public-key-for-this-instance',
        'captchasettings.recaptchaprivatekey': 'private-key-for-this-instance',
        'captchasettings.showonregistrationpage': true,
        'captchasettings.showonloginpage': true,
        'captchasettings.showoncontactuspage': true,
        'captchasettings.showonproductreviewpage': true,
        'captchasettings.showonforgotpasswordpage': true,
      },
    }, SESSIONS.admin);
  });

  test('AC-SEC-013-01-01', async () => {
    // "the form is accepted only with a valid captcha; otherwise the native message
    //  Common.WrongCaptchaMessage is shown"
    const settings = await api.get('/api/security/captcha', SESSIONS.admin);
    assert.equal(settings.enabled, true);
    assert.equal(settings.captchaType, 'ReCaptchaV3');
    assert.equal(settings.keysEntered, true, 'the keys are entered for the instance');
    for (const form of ['register', 'login', 'contact-us', 'product-review', 'forgot-password']) {
      assert.equal(settings.forms[form], true, `${form} is protected`);
      const refused = await api.post('/api/security/captcha/validate', { form }, 'sec-bot');
      assert.equal(refused.ok, false);
      assert.equal(refused.messageKey, 'Common.WrongCaptchaMessage');
      const accepted = await api.post('/api/security/captcha/validate', { form, response: 'valid' }, 'sec-bot');
      assert.equal(accepted.ok, true);
    }
    assert.match(settings.filter, /ValidateCaptcha/);

    const notProtected = await api.post('/api/security/captcha/validate', { form: 'newsletter' }, 'sec-bot');
    assert.equal(notProtected.required, false);
  });

  test('AC-SEC-013-01-02', async () => {
    // "the same captcha check applies before a code is sent"
    const refused = await api.post('/api/security/captcha/validate', { form: 'mobile-code' }, 'sec-bot');
    assert.equal(refused.required, true);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Common.WrongCaptchaMessage');

    const register = await api.post('/api/security/captcha/validate', { form: 'mobile-register' }, 'sec-bot');
    assert.equal(register.required, true);
    assert.equal(register.ok, false);

    const accepted = await api.post('/api/security/captcha/validate', { form: 'mobile-code', response: 'valid' }, 'sec-bot');
    assert.equal(accepted.ok, true, 'with a valid captcha the code is sent');
  });

  test('AC-SEC-013-01-03', async () => {
    // "further lookups need a valid captcha; the TRK actions use the native ValidateCaptcha
    //  filter attribute with the CaptchaSettings of SEC-013"
    await api.post('/api/security/captcha/lookup/reset', { session: 'sec-tracker' }, SESSIONS.admin);
    const unset = await api.post('/api/security/captcha/lookup', { session: 'sec-tracker' }, 'sec-bot');
    assert.equal(unset.threshold, 'not configured', 'the default is not stated in the product');
    assert.equal(unset.captchaRequired, false);

    await saveSettingAsync('sec.trklookupsbeforecaptcha', 3, 0);
    await api.post('/api/security/captcha/lookup/reset', { session: 'sec-tracker' }, SESSIONS.admin);
    for (let i = 1; i <= 3; i += 1) {
      const within = await api.post('/api/security/captcha/lookup', { session: 'sec-tracker' }, 'sec-bot');
      assert.equal(within.captchaRequired, false, `lookup ${i} is free`);
      assert.equal(within.lookups, i);
    }
    const beyond = await api.post('/api/security/captcha/lookup', { session: 'sec-tracker' }, 'sec-bot');
    assert.equal(beyond.captchaRequired, true);
    assert.equal(beyond.ok, false);
    assert.equal(beyond.messageKey, 'Common.WrongCaptchaMessage');
    assert.match(beyond.filter, /ValidateCaptcha filter attribute with the CaptchaSettings of PRD-SEC-013/);

    const withCaptcha = await api.post('/api/security/captcha/lookup', { session: 'sec-tracker', response: 'valid', score: 0.9 }, 'sec-bot');
    assert.equal(withCaptcha.ok, true);
  });

  test('AC-SEC-013-01-04', async () => {
    // "a submission scoring below CaptchaSettings.ReCaptchaV3ScoreThreshold is refused; the
    //  threshold value is per client (default not stated for the product)"
    const noThreshold = await api.get('/api/security/captcha', SESSIONS.admin);
    assert.equal(noThreshold.scoreThreshold, null);
    assert.match(noThreshold.scoreThresholdNote, /the product states no default/);
    const accepted = await api.post('/api/security/captcha/validate', { form: 'login', response: 'valid', score: 0.1 }, 'sec-bot');
    assert.equal(accepted.scoreThreshold, 'not configured');
    assert.equal(accepted.ok, true, 'with no threshold a valid response is accepted');

    await api.post('/api/security/captcha', { values: { 'captchasettings.recaptchav3scorethreshold': 0.5 } }, SESSIONS.admin);
    const low = await api.post('/api/security/captcha/validate', { form: 'login', response: 'valid', score: 0.3 }, 'sec-bot');
    assert.equal(low.ok, false);
    assert.equal(low.scoreThreshold, 0.5);
    assert.equal(low.messageKey, 'Common.WrongCaptchaMessage');

    const high = await api.post('/api/security/captcha/validate', { form: 'login', response: 'valid', score: 0.8 }, 'sec-bot');
    assert.equal(high.ok, true);

    const missing = await api.post('/api/security/captcha/validate', { form: 'login', response: 'valid' }, 'sec-bot');
    assert.equal(missing.ok, false, 'no score at all is refused once a threshold is set');
  });

  test('AC-SEC-013-01-05', async () => {
    // "a transfer record for the captcha provider exists in the SEC-012 register"
    const before2 = await api.get('/api/security/captcha/provider-transfer', SESSIONS.privacy);
    assert.equal(before2.captchaEnabled, true);
    assert.equal(before2.transferRecorded, false);
    assert.equal(before2.ok, false, 'the instance cannot go live without it');
    assert.equal(before2.register, 'PRD-SEC-012');

    const activity = await api.post('/api/security/processing-activities', {
      purpose: 'Bot protection', lawfulBasis: 'legitimate interest', dataCategories: ['IP address', 'browser behaviour'], systems: ['ReCaptcha'],
    }, SESSIONS.privacy);
    await api.post('/api/security/transfers', {
      destination: 'US',
      recipient: 'ReCaptcha provider',
      safeguard: 'standard contractual clauses',
      dataCategories: ['IP address'],
      activityIds: [activity.activity.id],
      integrations: ['ReCaptcha'],
    }, SESSIONS.privacy);

    const after2 = await api.get('/api/security/captcha/provider-transfer', SESSIONS.privacy);
    assert.equal(after2.transferRecorded, true);
    assert.equal(after2.processingActivityRecorded, true);
    assert.equal(after2.ok, true);
  });
});
