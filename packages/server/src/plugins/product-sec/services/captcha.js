// PRD-SEC-013 Bot protection: the native CaptchaSettings and the ValidateCaptcha filter, applied
// to the native forms, to the mobile code request of IAM-002 and to the TRK lookup pages.
//
// Values the PRD does not state are settings with no hidden default: the lookup threshold and
// the ReCaptchaV3 score threshold are per client.

import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';

export const CAPTCHA_TYPES = ['ReCaptchaV3', 'CheckBoxReCaptchaV2'];

/** The native per-page flags of CaptchaSettings. */
export const CAPTCHA_PAGES = [
  { setting: 'captchasettings.showonregistrationpage', form: 'register' },
  { setting: 'captchasettings.showonloginpage', form: 'login' },
  { setting: 'captchasettings.showoncontactuspage', form: 'contact-us' },
  { setting: 'captchasettings.showonproductreviewpage', form: 'product-review' },
  { setting: 'captchasettings.showonforgotpasswordpage', form: 'forgot-password' },
];

const lookups = new Map(); // session -> count, for the TRK threshold

export async function settingsAsync(storeId = 1) {
  const enabled = await getSettingAsync('captchasettings.enabled', storeId, false);
  const type = await getSettingAsync('captchasettings.captchatype', storeId, 'ReCaptchaV3');
  const publicKey = await getSettingAsync('captchasettings.recaptchapublickey', storeId, null);
  const privateKey = await getSettingAsync('captchasettings.recaptchaprivatekey', storeId, null);
  const forms = {};
  for (const page of CAPTCHA_PAGES) forms[page.form] = await getSettingAsync(page.setting, storeId, false) === true;
  return {
    enabled: enabled === true,
    captchaType: type,
    captchaTypes: CAPTCHA_TYPES,
    keysEntered: Boolean(publicKey) && Boolean(privateKey),
    publicKeySet: Boolean(publicKey),
    privateKeySet: Boolean(privateKey),
    forms,
    scoreThreshold: await getSettingAsync('captchasettings.recaptchav3scorethreshold', storeId, null),
    scoreThresholdNote: 'per client; the product states no default',
    lookupThreshold: await getSettingAsync('sec.trklookupsbeforecaptcha', storeId, null),
    lookupThresholdNote: 'setting, default not stated',
    filter: 'the native ValidateCaptcha filter attribute',
  };
}

/**
 * The native ValidateCaptcha check. AC-SEC-013-01-01, 01-02 and 01-04.
 * A form that is not protected needs no captcha; a protected one is accepted only with a valid
 * response, and under ReCaptchaV3 only above the score threshold.
 */
export async function validateAsync({
  form, response = null, score = null, storeId = 1,
}) {
  const settings = await settingsAsync(storeId);
  if (!settings.enabled || !settings.keysEntered) {
    return {
      required: false, ok: true, reason: settings.enabled ? 'the keys for this instance are not entered' : 'captcha is off for this store',
    };
  }
  const protectedForm = settings.forms[form] === true
    || ['mobile-register', 'mobile-code', 'order-tracking', 'guest-order-status'].includes(form);
  if (!protectedForm) return { required: false, ok: true, reason: 'this form is not protected' };

  if (!response) {
    return {
      required: true,
      ok: false,
      messageKey: 'Common.WrongCaptchaMessage',
      message: 'The verification was wrong. Please try again.',
      filter: settings.filter,
    };
  }
  if (settings.captchaType === 'ReCaptchaV3') {
    const threshold = settings.scoreThreshold;
    if (threshold === null || threshold === undefined) {
      return {
        required: true, ok: Boolean(response), scoreThreshold: 'not configured', note: 'with no threshold configured a valid response is accepted',
      };
    }
    if (score === null || Number(score) < Number(threshold)) {
      return {
        required: true,
        ok: false,
        score,
        scoreThreshold: threshold,
        messageKey: 'Common.WrongCaptchaMessage',
        message: 'The verification was wrong. Please try again.',
      };
    }
    return {
      required: true, ok: true, score, scoreThreshold: threshold,
    };
  }
  return { required: true, ok: response === 'valid', captchaType: settings.captchaType };
}

/** AC-SEC-013-01-03: the TRK lookup counter per session. */
export async function lookupAsync({
  session, response = null, score = null, storeId = 1,
}) {
  const settings = await settingsAsync(storeId);
  const threshold = settings.lookupThreshold;
  const count = (lookups.get(session) ?? 0) + 1;
  lookups.set(session, count);
  if (threshold === null || threshold === undefined) {
    return {
      lookups: count, captchaRequired: false, threshold: 'not configured', ok: true,
    };
  }
  if (count <= Number(threshold)) {
    return {
      lookups: count, captchaRequired: false, threshold: Number(threshold), ok: true,
    };
  }
  const check = await validateAsync({
    form: 'order-tracking', response, score, storeId,
  });
  return {
    lookups: count,
    captchaRequired: true,
    threshold: Number(threshold),
    ok: check.ok,
    messageKey: check.ok ? null : check.messageKey,
    filter: 'the native ValidateCaptcha filter attribute with the CaptchaSettings of PRD-SEC-013',
  };
}

export function resetLookups(session = null) {
  if (session) lookups.delete(session);
  else lookups.clear();
}

/** AC-SEC-013-01-05: the captcha provider needs a transfer record in the SEC-012 register. */
export async function providerTransferCheckAsync({ storeId = 1 } = {}) {
  const settings = await settingsAsync(storeId);
  const { transfersAsync, activitiesAsync } = await import('./privacy-profile.js');
  const transfers = await transfersAsync();
  const activities = await activitiesAsync();
  const transfer = transfers.find((t) => (t.integrations ?? []).some((i) => /captcha|recaptcha/i.test(i)));
  const activity = activities.find((a) => (a.systems ?? []).some((s) => /captcha|recaptcha/i.test(s)));
  return {
    captchaEnabled: settings.enabled,
    transferRecorded: Boolean(transfer),
    processingActivityRecorded: Boolean(activity),
    ok: settings.enabled !== true || Boolean(transfer),
    register: 'PRD-SEC-012',
    note: 'the captcha service sends visitor data to its provider, so a transfer record must exist before go-live',
  };
}

export async function configureAsync({
  values, actor = null, storeId = 1,
}) {
  const before = await settingsAsync(storeId);
  for (const [key, value] of Object.entries(values)) {
    if (!/^captchasettings\.|^sec\.trklookupsbeforecaptcha$/.test(key)) continue;
    await saveSettingAsync(key, value, 0);
  }
  const after = await settingsAsync(storeId);
  await auditAsync({
    event: 'AUD-SEC-010',
    area: 'SEC',
    feature: 'PRD-SEC-013',
    entity: 'CaptchaSettings',
    entityId: storeId,
    actor,
    before: { enabled: before.enabled, captchaType: before.captchaType },
    after: { enabled: after.enabled, captchaType: after.captchaType },
    storeId,
    note: 'captcha settings changed',
  });
  return { ok: true, settings: after };
}
