// PRD-PLT-009 Languages and language packs (and the countries and regions used in addresses).
//
// Native 5.00.1 model: Language (Published, Rtl, LimitedToStores, DisplayOrder),
// LocaleStringResource rows per language imported from resource XML
// (Admin LanguageController.ImportXml), LocalizationSettings.DefaultLanguageId and
// .IgnoreRtlPropertyForAdminArea, StateProvince rows imported per country
// (Admin CountryController.ImportCsv). Interface text the client has not supplied is a T-MISS
// placeholder (decision P-5) and is reported by PRD-PLT-025.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { resource, resourceExists } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { checkUploadAsync } from '../../product-adm/services/uploads.js';
import { storesForAsync } from '../../../core/store-mapping.js';

const languageRepo = () => repository('Language');
const resourceRepo = () => repository('LocaleStringResource');
const countryRepo = () => repository('Country');
const stateRepo = () => repository('StateProvince');

export const RTL_STYLESHEET = 'styles.rtl.css';

export async function languagesAsync() {
  const rows = await languageRepo().getAllAsync();
  return rows.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id - b.id);
}

export async function addLanguageAsync({
  name, culture, rtl = false, published = true, limitedToStores = [], displayOrder = 0, actor = null,
}) {
  if (!await authorizeAsync('Configuration.ManageLanguages', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageLanguages' };
  }
  const row = await languageRepo().insertAsync({
    name,
    culture,
    rtl: rtl === true,
    published: published !== false,
    limitedToStores: (limitedToStores ?? []).length > 0,
    displayOrder,
  });
  for (const storeId of limitedToStores ?? []) {
    await repository('StoreMapping').insertAsync({ entityName: 'Language', entityId: row.id, storeId: Number(storeId) });
  }
  return { ok: true, language: row, stores: (limitedToStores ?? []).map(Number) };
}

export async function setLanguageStateAsync({
  languageId, published = null, rtl = null, limitedToStores = null, actor = null,
}) {
  if (!await authorizeAsync('Configuration.ManageLanguages', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageLanguages' };
  }
  const row = await languageRepo().getByIdAsync(languageId);
  if (!row) return { ok: false, message: 'no such language' };
  const next = { ...row };
  if (published !== null) next.published = published === true;
  if (rtl !== null) next.rtl = rtl === true;
  if (limitedToStores !== null) {
    next.limitedToStores = (limitedToStores ?? []).length > 0;
    for (const existing of await repository('StoreMapping').getAllAsync((m) => m.entityName === 'Language' && Number(m.entityId) === Number(languageId))) {
      await repository('StoreMapping').deleteAsync(existing.id);
    }
    for (const storeId of limitedToStores ?? []) {
      await repository('StoreMapping').insertAsync({ entityName: 'Language', entityId: Number(languageId), storeId: Number(storeId) });
    }
  }
  const saved = await languageRepo().updateAsync(next);
  return { ok: true, language: saved, stores: await storesForAsync('Language', languageId) };
}

/** AC-PLT-009-01-01: the selector lists only the published languages of that store. */
export async function selectorAsync({ storeId = 1 } = {}) {
  const all = await languagesAsync();
  const rows = [];
  for (const language of all) {
    if (language.published !== true) continue;
    const stores = await storesForAsync('Language', language.id);
    if (language.limitedToStores === true && stores.length > 0 && !stores.includes(Number(storeId))) continue;
    rows.push({
      id: language.id, name: language.name, culture: language.culture, rtl: language.rtl === true,
    });
  }
  return {
    storeId: Number(storeId),
    languages: rows,
    defaultLanguageId: Number(await getSettingAsync('localizationsettings.defaultlanguageid', storeId, rows[0]?.id ?? 1)),
  };
}

/* ======================================================== resources per language ======== */

const nameOf = (languageId) => Number(languageId);

export async function setResourceAsync({
  languageId, name, value, actor = null,
}) {
  const existing = await resourceRepo().getOneAsync((r) => Number(r.languageId) === nameOf(languageId) && r.resourceName === name);
  if (existing) return resourceRepo().updateAsync({ ...existing, resourceValue: value });
  return resourceRepo().insertAsync({ languageId: nameOf(languageId), resourceName: name, resourceValue: value });
}

/**
 * GetResourceAsync: the resource of that language, else the default-language text, which in this
 * prototype is the PRD's own proposed English text (packages/shared/data/messages.json).
 */
export async function resourceForAsync({ key, languageId, storeId = 1 }) {
  const row = await resourceRepo().getOneAsync((r) => Number(r.languageId) === nameOf(languageId) && r.resourceName === key);
  if (row) {
    return {
      key, languageId: Number(languageId), value: row.resourceValue, translated: true, fallback: null,
    };
  }
  const defaultLanguageId = Number(await getSettingAsync('localizationsettings.defaultlanguageid', storeId, 1));
  const fallbackRow = await resourceRepo().getOneAsync((r) => Number(r.languageId) === defaultLanguageId && r.resourceName === key);
  const value = fallbackRow?.resourceValue ?? (resourceExists(key) ? resource(key) : key);
  return {
    key,
    languageId: Number(languageId),
    value,
    translated: false,
    fallback: 'the default language',
    reportedBy: 'PRD-PLT-025',
  };
}

/** Every interface string of one screen, the way a page renders it. */
export async function interfaceTextAsync({ keys, languageId, storeId = 1 }) {
  const out = {};
  const untranslated = [];
  for (const key of keys) {
    const row = await resourceForAsync({ key, languageId, storeId });
    out[key] = row.value;
    if (!row.translated) untranslated.push(key);
  }
  return {
    languageId: Number(languageId), text: out, untranslated, reportedBy: 'PRD-PLT-025',
  };
}

/**
 * AC-PLT-009-01-03: a language pack is imported as resource XML through the ADM-008 upload gate
 * (Admin LanguageController.ImportXml).
 */
export async function importResourceXmlAsync({
  languageId, xml, fileName = 'language.xml', actor = null,
}) {
  if (!await authorizeAsync('Configuration.ManageLanguages', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageLanguages' };
  }
  const language = await languageRepo().getByIdAsync(languageId);
  if (!language) return { ok: false, message: 'no such language' };
  const bytes = Buffer.from(xml, 'utf8');
  const check = await checkUploadAsync({
    action: 'Admin LanguageController.ImportXml',
    fileName,
    bytes,
    contentType: 'text/xml',
    actor: actor?.email ?? 'system',
  });
  if (check.ok !== true) return { ...check, uploadedThrough: 'PRD-ADM-008' };

  const entries = [...String(xml).matchAll(/<LocaleResource\s+Name="([^"]+)"\s*>\s*<Value>([\s\S]*?)<\/Value>\s*<\/LocaleResource>/g)];
  for (const [, name, value] of entries) {
    await setResourceAsync({ languageId, name, value: value.trim(), actor });
  }
  await auditAsync({
    event: 'AUD-SEC-001',
    area: 'PLT',
    feature: 'PRD-PLT-009',
    entity: 'LocaleStringResource',
    entityId: `language-${languageId}`,
    actor: actor?.email ?? null,
    after: { languageId: Number(languageId), imported: entries.length },
    note: 'language pack imported',
  });
  return {
    ok: true,
    languageId: Number(languageId),
    language: language.name,
    imported: entries.length,
    uploadedThrough: 'PRD-ADM-008',
    importedThrough: 'Admin LanguageController.ImportXml',
  };
}

/** AC-PLT-009-01-02: what PRD-PLT-025 reports - the untranslated resources per language. */
export async function coverageAsync({ keys = null } = {}) {
  const languages = await languagesAsync();
  const defaultLanguageId = Number(await getSettingAsync('localizationsettings.defaultlanguageid', 1, 1));
  const all = await resourceRepo().getAllAsync();
  const names = keys ?? [...new Set(all.filter((r) => Number(r.languageId) === defaultLanguageId).map((r) => r.resourceName))];
  const rows = languages.map((language) => {
    const mine = new Set(all.filter((r) => Number(r.languageId) === language.id).map((r) => r.resourceName));
    const missing = names.filter((n) => !mine.has(n));
    return {
      languageId: language.id,
      language: language.name,
      culture: language.culture,
      translated: names.length - missing.length,
      total: names.length,
      missing,
      showsDefaultLanguageText: missing.length > 0,
    };
  });
  return { rows, reportedBy: 'PRD-PLT-025', defaultLanguageId };
}

/** AC-PLT-009-02-01: the direction of the storefront and of the admin area. */
export async function directionAsync({ languageId, storeId = 1 }) {
  const language = await languageRepo().getByIdAsync(languageId);
  if (!language) return { ok: false, message: 'no such language' };
  const ignoreForAdmin = await getSettingAsync('localizationsettings.ignorertlpropertyforadminarea', storeId, true);
  return {
    ok: true,
    languageId: Number(languageId),
    language: language.name,
    rtl: language.rtl === true,
    storefront: {
      direction: language.rtl === true ? 'rtl' : 'ltr',
      stylesheet: language.rtl === true ? RTL_STYLESHEET : 'styles.css',
      theme: 'DefaultClean',
    },
    admin: {
      direction: language.rtl === true && ignoreForAdmin !== true ? 'rtl' : 'ltr',
      setting: 'localizationsettings.ignorertlpropertyforadminarea',
      ignoreRtlPropertyForAdminArea: ignoreForAdmin === true,
    },
  };
}

/* ============================================= countries, regions and districts ========= */

export const countriesAsync = () => countryRepo().getAllAsync();

export async function addCountryAsync({
  name, twoLetterIsoCode, published = true, actor = null,
}) {
  if (!await authorizeAsync('Configuration.ManageCountries', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageCountries' };
  }
  const row = await countryRepo().insertAsync({
    name, twoLetterIsoCode, published: published !== false, allowsBilling: true, allowsShipping: true,
  });
  return { ok: true, country: row };
}

/**
 * AC-PLT-009-03-01: the region or district list of a country is imported as StateProvince
 * records through the native Admin CountryController.ImportCsv action (ADM-008 gate), and the
 * address form then offers those regions for that country.
 */
export async function importStatesCsvAsync({
  countryId, csv, fileName = 'states.csv', actor = null,
}) {
  if (!await authorizeAsync('Configuration.ManageCountries', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageCountries' };
  }
  const country = await countryRepo().getByIdAsync(countryId);
  if (!country) return { ok: false, message: 'no such country' };
  const check = await checkUploadAsync({
    action: 'Admin CountryController.ImportCsv',
    fileName,
    bytes: Buffer.from(csv, 'utf8'),
    contentType: 'text/csv',
    actor: actor?.email ?? 'system',
  });
  if (check.ok !== true) return { ...check, uploadedThrough: 'PRD-ADM-008' };

  const lines = String(csv).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const header = lines[0]?.toLowerCase().startsWith('name') ? lines.shift() : null;
  const imported = [];
  for (const line of lines) {
    const [name, abbreviation = '', displayOrder = '0'] = line.split(',').map((x) => x.trim());
    if (!name) continue;
    const existing = await stateRepo().getOneAsync((s) => Number(s.countryId) === Number(countryId) && s.name === name);
    if (existing) { imported.push(existing.name); continue; }
    await stateRepo().insertAsync({
      countryId: Number(countryId), name, abbreviation, displayOrder: Number(displayOrder) || 0, published: true,
    });
    imported.push(name);
  }
  await auditAsync({
    event: 'AUD-SEC-001',
    area: 'PLT',
    feature: 'PRD-PLT-009',
    entity: 'StateProvince',
    entityId: `country-${countryId}`,
    actor: actor?.email ?? null,
    after: { countryId: Number(countryId), imported: imported.length },
    note: 'regions imported for a country',
  });
  return {
    ok: true,
    countryId: Number(countryId),
    country: country.name,
    header,
    imported: imported.length,
    regions: imported,
    uploadedThrough: 'PRD-ADM-008',
    importedThrough: 'Admin CountryController.ImportCsv',
  };
}

export async function statesForCountryAsync(countryId) {
  const rows = await stateRepo().getAllAsync((s) => Number(s.countryId) === Number(countryId) && s.published !== false);
  return rows.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
}

/** The address form's country and region pickers: what a shopper actually sees. */
export async function addressFormAsync({ countryId = null } = {}) {
  const countries = (await countriesAsync()).filter((c) => c.published !== false);
  const chosen = countryId ?? countries[0]?.id ?? null;
  const states = chosen ? await statesForCountryAsync(chosen) : [];
  return {
    countries: countries.map((c) => ({ id: c.id, name: c.name, twoLetterIsoCode: c.twoLetterIsoCode })),
    countryId: chosen ? Number(chosen) : null,
    regions: states.map((s) => ({ id: s.id, name: s.name, abbreviation: s.abbreviation ?? null })),
    regionsOffered: states.length > 0,
  };
}

export async function setDefaultLanguageAsync({ languageId, storeId = 0, actor = null }) {
  if (!await authorizeAsync('Configuration.ManageLanguages', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageLanguages' };
  }
  await saveSettingAsync('localizationsettings.defaultlanguageid', Number(languageId), Number(storeId), 'runtime');
  return { ok: true, defaultLanguageId: Number(languageId), storeId: Number(storeId) };
}
