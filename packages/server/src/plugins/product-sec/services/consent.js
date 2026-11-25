// PRD-SEC-007 Consent and privacy tools: the cookie categories, the consent banner, the widget
// gating that follows from a visitor's choice, and the GDPR settings a country pack must set.
//
// BR-SEC-020: only necessary cookies are set before a visitor has chosen; a widget whose
// category has not been accepted is not rendered, through the SEC override of
// IWidgetPluginManager.LoadActivePluginsAsync.
// BR-SEC-021: the bundled Widgets.GoogleAnalytics sends server-side order events from event
// consumers for every order, with no per-visitor consent check, so widget gating cannot stop
// them - GoogleAnalyticsSettings.EnableEcommerce stays false unless the country profile says
// consent is not needed.
// SEC-007 owns the cookie choice; IAM-017 offers it on the account page and calls in here.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';

const choiceRepo = () => repository('CookieChoice');
const gdprRepo = () => repository('GdprLog');

/** The category list is Proposed: the PRD names necessary and "others such as ...". */
export const DEFAULT_CATEGORIES = [
  {
    systemName: 'necessary', name: 'Strictly necessary', alwaysOn: true, description: 'Needed to run the shop: your session, your basket and security.',
  },
  {
    systemName: 'functional', name: 'Functional', alwaysOn: false, description: 'Remembers your choices and powers help features such as chat.',
  },
  {
    systemName: 'analytics', name: 'Analytics', alwaysOn: false, description: 'Helps us see how the shop is used.',
  },
  {
    systemName: 'personalisation', name: 'Personalisation', alwaysOn: false, description: 'Suggests products from what you have looked at.',
  },
  {
    systemName: 'marketing', name: 'Marketing', alwaysOn: false, description: 'Lets us show you offers on other sites.',
  },
];

/** WidgetCategoryMap: which cookie category each bundled widget needs. Mapping Proposed. */
export const WIDGET_CATEGORY_MAP = [
  { systemName: 'Widgets.GoogleAnalytics', category: 'analytics' },
  { systemName: 'Widgets.FacebookPixel', category: 'marketing' },
  { systemName: 'Widgets.AiChat', category: 'functional', feature: 'PRD-AI-003' },
  { systemName: 'Widgets.Recommendations', category: 'personalisation', feature: 'PRD-SRC-009' },
  { systemName: 'Widgets.NivoSlider', category: 'necessary' },
];

export const BANNER_VERSION = 1;

export const categoriesAsync = async (storeId = 1) => {
  const configured = await getSettingAsync('sec.cookiecategories', storeId, DEFAULT_CATEGORIES);
  return configured.map((c) => ({ ...c, alwaysOn: c.alwaysOn === true || c.systemName === 'necessary' }));
};

export const widgetMapAsync = (storeId = 1) => getSettingAsync('sec.widgetcategorymap', storeId, WIDGET_CATEGORY_MAP);

const necessaryOnly = (categories) => categories.filter((c) => c.alwaysOn).map((c) => c.systemName);

/** AC-SEC-007-01-01: the banner a visitor without a stored choice sees. */
export async function bannerAsync({ visitorId, storeId = 1 }) {
  const gdprEnabled = await getSettingAsync('gdprsettings.gdprenabled', storeId, true);
  const categories = await categoriesAsync(storeId);
  const stored = visitorId ? await choiceRepo().getOneAsync((r) => r.visitorId === visitorId) : null;
  return {
    show: gdprEnabled === true && !stored,
    messageKey: 'Sec.CookieBanner',
    message: resource('Sec.CookieBanner'),
    bannerVersion: BANNER_VERSION,
    options: ['accept-all', 'reject-all-except-necessary', 'choose-per-category'],
    categories,
    categoriesProposed: true,
    setBeforeChoice: necessaryOnly(categories),
    nativeBanner: {
      setting: 'storeinformationsettings.displayeucookielawwarning',
      enabled: await getSettingAsync('storeinformationsettings.displayeucookielawwarning', storeId, false) === true,
      note: 'the native single-button banner is off: it offers no categories',
    },
    gdprEnabled: gdprEnabled === true,
  };
}

/** AC-SEC-007-01-02: the choice, kept per visitor, with its consent record (AUD-SEC-007). */
export async function saveChoiceAsync({
  visitorId, customerId = null, accepted = [], option = 'choose-per-category', storeId = 1, ipAddress = null,
}) {
  const categories = await categoriesAsync(storeId);
  const names = categories.map((c) => c.systemName);
  const unknown = (accepted ?? []).filter((a) => !names.includes(a));
  const chosen = option === 'accept-all'
    ? names
    : option === 'reject-all-except-necessary'
      ? necessaryOnly(categories)
      : categories.filter((c) => c.alwaysOn || accepted.includes(c.systemName)).map((c) => c.systemName);

  const existing = await choiceRepo().getOneAsync((r) => r.visitorId === visitorId);
  const row = existing
    ? await choiceRepo().updateAsync({
      ...existing, customerId: customerId ?? existing.customerId, accepted: chosen, bannerVersion: BANNER_VERSION, option,
    })
    : await choiceRepo().insertAsync({
      visitorId, customerId, accepted: chosen, bannerVersion: BANNER_VERSION, option, createdOnUtc: new Date().toISOString(),
    });
  await auditAsync({
    event: 'AUD-SEC-007',
    area: 'SEC',
    feature: 'PRD-SEC-007',
    entity: 'CookieChoice',
    entityId: row.id,
    actor: customerId ? String(customerId) : `visitor:${visitorId}`,
    before: existing ? { accepted: existing.accepted } : null,
    after: { accepted: chosen, bannerVersion: BANNER_VERSION },
    storeId,
    note: 'cookie consent choice',
  });
  return {
    ok: true,
    choice: row,
    accepted: chosen,
    keptFor: customerId ? 'the customer record' : 'a cookie for this visitor',
    messageKey: 'Sec.CookieSettingsSaved',
    message: resource('Sec.CookieSettingsSaved'),
    appliesFrom: 'the next page',
    bannerVersion: BANNER_VERSION,
    unknownCategories: unknown,
  };
}

export async function choiceAsync({ visitorId, customerId = null, storeId = 1 }) {
  const categories = await categoriesAsync(storeId);
  const row = (visitorId && await choiceRepo().getOneAsync((r) => r.visitorId === visitorId))
    || (customerId && await choiceRepo().getOneAsync((r) => r.customerId === Number(customerId)))
    || null;
  return {
    accepted: row?.accepted ?? necessaryOnly(categories),
    categories,
    asked: Boolean(row),
    bannerVersion: row?.bannerVersion ?? null,
    onlyNecessaryBeforeChoice: !row,
  };
}

export async function acceptedAsync({ visitorId, customerId = null, category, storeId = 1 }) {
  const { accepted } = await choiceAsync({ visitorId, customerId, storeId });
  return accepted.includes(category);
}

/* ================================ the widget gating of BR-SEC-020 and BR-SEC-021 ======== */

/**
 * AC-SEC-007-04-01, 01-04 and 04-03: the SEC override of IWidgetPluginManager. A widget whose
 * category the visitor has not accepted is not active for that visitor, so it is not rendered
 * and its events are not sent.
 */
export async function loadActiveWidgetsAsync({ visitorId, customerId = null, storeId = 1 }) {
  const map = await widgetMapAsync(storeId);
  const { accepted } = await choiceAsync({ visitorId, customerId, storeId });
  const active = [];
  const withheld = [];
  for (const widget of map) {
    const allowed = widget.category === 'necessary' || accepted.includes(widget.category);
    (allowed ? active : withheld).push({ systemName: widget.systemName, category: widget.category, feature: widget.feature ?? null });
  }
  return {
    active,
    withheld,
    overrideOf: 'IWidgetPluginManager.LoadActivePluginsAsync',
    rule: 'BR-SEC-020',
  };
}

export async function isWidgetActiveAsync({
  systemName, visitorId, customerId = null, storeId = 1,
}) {
  const { active } = await loadActiveWidgetsAsync({ visitorId, customerId, storeId });
  return {
    systemName,
    active: active.some((w) => w.systemName === systemName),
    overrideOf: 'IWidgetPluginManager.IsPluginActiveAsync',
  };
}

/** AC-SEC-007-04-03: the cart and wishlist events the analytics widget would send. */
export async function analyticsEventAsync({
  event, visitorId, customerId = null, storeId = 1,
}) {
  const { active } = await isWidgetActiveAsync({
    systemName: 'Widgets.GoogleAnalytics', visitorId, customerId, storeId,
  });
  return {
    event,
    sent: active,
    reason: active ? 'the visitor accepted analytics' : 'the visitor has not accepted analytics',
    rule: 'BR-SEC-021',
  };
}

/** AC-SEC-007-01-03: personalisation. SRC-009 and SRC-012 read the consent through here. */
export async function personalisationAllowedAsync({ visitorId, customerId = null, storeId = 1 }) {
  const allowed = await acceptedAsync({
    visitorId, customerId, category: 'personalisation', storeId,
  });
  return {
    allowed,
    searchHistoryKept: allowed,
    sentToRecommendationService: allowed,
    readBy: ['PRD-SRC-009', 'PRD-SRC-012'],
    withdrawalTold: 'IC-IAM-08 ConsentWithdrawn, by PRD-IAM-017',
  };
}

/**
 * AC-SEC-007-04-02: the action filter on the Google Analytics configuration POST. The country
 * profile decides; "not configured" counts as consent needed (BR-SEC-021).
 */
export async function setEnableEcommerceAsync({ value, storeId = 1, actor = null }) {
  const { serverSideAnalyticsConsent } = await import('./privacy-profile.js')
    .then((m) => m.profileAsync({ storeId }));
  const needsConsent = serverSideAnalyticsConsent !== false;
  if (value === true && needsConsent) {
    await auditAsync({
      event: 'AUD-SEC-010',
      area: 'SEC',
      feature: 'PRD-SEC-007',
      entity: 'Setting',
      entityId: 'googleanalyticssettings.enableecommerce',
      actor,
      outcome: 'rejected',
      after: { attempted: true },
      storeId,
      note: 'server-side analytics refused: the country profile requires consent',
    });
    return {
      ok: false,
      refused: true,
      messageKey: 'Sec.ServerSideAnalyticsBlocked',
      message: resource('Sec.ServerSideAnalyticsBlocked'),
      settingValue: await getSettingAsync('googleanalyticssettings.enableecommerce', storeId, false) === true,
      filterOn: 'WidgetsGoogleAnalyticsController.Configure [POST]',
      rule: 'BR-SEC-021',
      profileValue: serverSideAnalyticsConsent ?? 'not configured',
    };
  }
  await saveSettingAsync('googleanalyticssettings.enableecommerce', value === true, 0);
  return {
    ok: true, settingValue: value === true, profileValue: serverSideAnalyticsConsent ?? 'not configured',
  };
}

/** The same check a configuration pack is validated with (AC-SEC-007-04-02, first branch). */
export async function validatePackAnalyticsAsync({ settings, storeId = 1 }) {
  const wants = settings?.['googleanalyticssettings.enableecommerce'] === true;
  if (!wants) return { ok: true };
  const { serverSideAnalyticsConsent } = await import('./privacy-profile.js')
    .then((m) => m.profileAsync({ storeId }));
  if (serverSideAnalyticsConsent === false) return { ok: true };
  return {
    ok: false,
    failedValidation: true,
    key: 'googleanalyticssettings.enableecommerce',
    messageKey: 'Sec.ServerSideAnalyticsBlocked',
    message: resource('Sec.ServerSideAnalyticsBlocked'),
    rule: 'BR-SEC-021',
  };
}

/* ========================================= the GDPR settings and the native GDPR log ==== */

/** AC-SEC-007-02-01: the native GDPR log of policy and newsletter consent. */
export async function logConsentAsync({
  customerId, kind, accepted, storeId = 1,
}) {
  const logPolicy = await getSettingAsync('gdprsettings.logprivacypolicyconsent', storeId, true);
  const logNewsletter = await getSettingAsync('gdprsettings.lognewsletterconsent', storeId, true);
  const on = kind === 'privacy-policy' ? logPolicy === true : logNewsletter === true;
  if (!on) return { logged: false, reason: `the setting for ${kind} consent logging is off` };
  const row = await gdprRepo().insertAsync({
    customerId,
    requestType: accepted ? 'ConsentAgree' : 'ConsentDisagree',
    customerInfo: kind === 'privacy-policy' ? 'PrivacyPolicy' : 'Newsletter',
    createdOnUtc: new Date().toISOString(),
  });
  return { logged: true, entry: row, requestType: row.requestType };
}

/** AC-SEC-007-03-01: the GDPR tools page; the flows themselves are IAM-017. */
export async function gdprToolsAsync({ storeId = 1 }) {
  const enabled = await getSettingAsync('gdprsettings.gdprenabled', storeId, true);
  return {
    offered: enabled === true,
    tools: enabled === true
      ? [
        { code: 'export', name: 'Export my data', format: 'native XLSX', ownedBy: 'PRD-IAM-017' },
        { code: 'delete', name: 'Delete my account', ownedBy: 'PRD-IAM-017' },
      ]
      : [],
    gdprEnabled: enabled === true,
  };
}

/** AC-SEC-007-05-01: what a country pack must set, and the task it must not switch on. */
export const REQUIRED_GDPR_SETTINGS = [
  'gdprsettings.gdprenabled',
  'gdprsettings.logprivacypolicyconsent',
  'gdprsettings.lognewsletterconsent',
  'gdprsettings.loguserprofilechanges',
];

export async function gdprSettingsCheckAsync({ storeId = 1 } = {}) {
  const values = {};
  for (const key of REQUIRED_GDPR_SETTINGS) values[key] = await getSettingAsync(key, storeId, null);
  const off = REQUIRED_GDPR_SETTINGS.filter((k) => values[k] !== true);
  const task = await repository('ScheduleTask').getOneAsync((t) => /inactive customers/i.test(t.name ?? ''));
  const { retention } = await import('./privacy-profile.js').then((m) => m.profileAsync({ storeId }));
  const retentionSaysDelete = Boolean(retention?.deleteInactiveCustomersAfterMonths);
  return {
    ok: off.length === 0 && (!task || task.enabled === retentionSaysDelete),
    values,
    notOn: off,
    inactiveCustomerTask: {
      name: task?.name ?? 'Delete inactive customers (GDPR)',
      present: Boolean(task),
      enabled: task?.enabled === true,
      shouldBeEnabled: retentionSaysDelete,
      installValueNotAdopted: 'DeleteInactiveCustomersAfterMonths = 36 is the native install value, not a product default',
      productDefault: await getSettingAsync('gdprsettings.deleteinactivecustomersaftermonths', storeId, null) ?? 'not configured',
    },
  };
}
