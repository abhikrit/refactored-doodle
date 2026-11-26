// PRD-PLT-006 Branding and theme (4), PRD-PLT-009 Languages and language packs (5),
// PRD-PLT-013 Multi-store (5) and PRD-PLT-019 Contextual help and guided tours (4).
// One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);

/* ======================================================= PRD-PLT-006 branding ========== */

describe('PRD-PLT-006 branding and theme', () => {
  test('AC-PLT-006-01-01', async () => {
    // "the storefront header shows it for that store (StoreInformationSettings.LogoPictureId,
    //  store-overridable)"
    const uploaded = await api.post('/api/platform/branding/logo/upload', {
      storeId: 1, fileName: 'malawi-post-logo.png', contentType: 'image/png', base64: PNG.toString('base64'),
    }, SESSIONS.admin);
    assert.equal(uploaded.ok, true);
    assert.equal(uploaded.uploadedThrough, 'PRD-ADM-008', 'the upload goes through the ADM-008 gate');
    assert.ok(uploaded.pictureId);

    const set = await api.post('/api/platform/branding/logo', { storeId: 1, pictureId: uploaded.pictureId }, SESSIONS.admin);
    assert.equal(set.ok, true);
    assert.equal(set.key, 'storeinformationsettings.logopictureid');
    assert.equal(set.storeOverridable, true);

    const header = await api.get('/api/platform/branding?storeId=1', SESSIONS.admin);
    assert.equal(header.logo.pictureId, uploaded.pictureId, 'the header of that store shows it');
    assert.equal(header.logo.fileName, 'malawi-post-logo.png');
    assert.match(header.logo.url, /^\/images\//);

    // store-overridable: store 2 keeps the shared value until it has its own row
    const other = await api.get('/api/platform/branding?storeId=2', SESSIONS.admin);
    assert.notEqual(other.logo.pictureId, uploaded.pictureId, 'store 2 does not take store 1\'s row');

    const refused = await api.post('/api/platform/branding/logo', { storeId: 1, pictureId: 1 }, SESSIONS.buyer);
    assert.equal(refused.permission, 'Configuration.ManageSettings');
  });

  test('AC-PLT-006-01-02', async () => {
    // "every storefront page of the store uses those colours and fonts, with no change to
    //  product code" - one variables file of a client child theme of DefaultClean
    const theme = await api.get('/api/platform/branding/theme?storeId=1', SESSIONS.admin);
    assert.equal(theme.baseTheme, 'DefaultClean');
    assert.match(theme.childTheme, /child theme of DefaultClean/);
    assert.equal(theme.file, `themes/${theme.theme}/content/variables.css`, 'one variables file');
    assert.equal(theme.appliesTo, 'every storefront page of the store');
    assert.equal(theme.productCodeChanged, false);
    assert.match(theme.licensedPlugin.item, /open item under VER-500/);

    const names = theme.variables.map((v) => v.name);
    for (const expected of ['--brand-primary', '--brand-accent', '--brand-font-body', '--brand-font-heading']) {
      assert.ok(names.includes(expected), `${expected} is in the file`);
    }
    // the colours come from the client pack, which is where a client difference belongs
    const primary = theme.variables.find((v) => v.name === '--brand-primary');
    assert.equal(primary.value, '#9c1b1f');
    assert.equal(primary.fromPack, true);
    assert.match(theme.css, /:root \{/);
    assert.match(theme.css, /--brand-primary: #9c1b1f;/);

    // a brand change is a configuration change: new values, same code
    await saveSettingAsync('plt.brand', { primary: '#123456', bodyFont: 'Inter, sans-serif' }, 1);
    const changed = await api.get('/api/platform/branding/theme?storeId=1', SESSIONS.admin);
    assert.equal(changed.variables.find((v) => v.name === '--brand-primary').value, '#123456');
    assert.equal(changed.variables.find((v) => v.name === '--brand-font-body').value, 'Inter, sans-serif');
    await repository('Setting').getOneAsync((s) => s.name === 'plt.brand')
      .then((row) => (row ? repository('Setting').deleteAsync(row.id) : null));
  });

  test('AC-PLT-006-01-03', async () => {
    // "each storefront shows its own theme (DefaultStoreTheme stored per store); customer theme
    //  selection is offered only if AllowCustomerToSelectTheme is on"
    await api.post('/api/platform/branding/theme', { storeId: 1, theme: 'mpc-retail' }, SESSIONS.admin);
    await api.post('/api/platform/branding/theme', { storeId: 2, theme: 'mpc-business' }, SESSIONS.admin);

    const themes = await api.get('/api/platform/branding/themes', SESSIONS.admin);
    assert.equal(themes.key, 'storeinformationsettings.defaultstoretheme');
    assert.equal(themes.storedPerStore, true);
    assert.equal(themes.rows.find((r) => r.storeId === 1).theme, 'mpc-retail');
    assert.equal(themes.rows.find((r) => r.storeId === 2).theme, 'mpc-business');
    assert.equal((await api.get('/api/platform/branding?storeId=1', SESSIONS.admin)).theme, 'mpc-retail');
    assert.equal((await api.get('/api/platform/branding?storeId=2', SESSIONS.admin)).theme, 'mpc-business');

    await saveSettingAsync('storeinformationsettings.allowcustomertoselecttheme', false, 0);
    assert.equal((await api.get('/api/platform/branding?storeId=1', SESSIONS.admin)).customerThemeSelector, false, 'not offered while it is off');
    await saveSettingAsync('storeinformationsettings.allowcustomertoselecttheme', true, 1);
    assert.equal((await api.get('/api/platform/branding?storeId=1', SESSIONS.admin)).customerThemeSelector, true, 'offered when it is on');
    assert.equal((await api.get('/api/platform/branding?storeId=2', SESSIONS.admin)).customerThemeSelector, false, 'per store');
  });

  test('AC-PLT-006-02-01', async () => {
    // "the PDF uses the logo of PdfSettings.LogoPictureId (or the DOC-001 template branding) and
    //  the e-mail uses the client header of the message template (TRK-004)"
    const fallback = await api.get('/api/platform/branding/documents?storeId=1', SESSIONS.admin);
    assert.match(fallback.pdf.source, /no PDF logo set/, 'with no PDF logo the storefront logo stands in');
    assert.equal(fallback.pdf.documentTemplate, 'PRD-DOC-001 template branding');

    const uploaded = await api.post('/api/platform/branding/logo/upload', {
      storeId: 1, fileName: 'invoice-logo.png', contentType: 'image/png', base64: PNG.toString('base64'),
    }, SESSIONS.admin);
    const saved = await api.post('/api/platform/branding/documents', {
      storeId: 1, pdfPictureId: uploaded.pictureId, emailHeader: 'Malawi Post Online - official e-mail',
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);

    const branding = await api.get('/api/platform/branding/documents?storeId=1', SESSIONS.admin);
    assert.equal(branding.pdf.logoPictureId, uploaded.pictureId);
    assert.equal(branding.pdf.source, 'pdfsettings.logopictureid');
    assert.equal(branding.email.header, 'Malawi Post Online - official e-mail');
    assert.equal(branding.email.owner, 'PRD-TRK-004');
    assert.equal(branding.sameBrandingAsStorefront, true);
    assert.ok(branding.email.variables.some((v) => v.name === '--brand-primary'), 'the e-mail carries the brand values');

    const denied = await api.post('/api/platform/branding/documents', { storeId: 1, pdfPictureId: 1 }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Configuration.ManageSettings');
  });
});

/* ======================================================= PRD-PLT-009 languages ========= */

describe('PRD-PLT-009 languages and language packs', () => {
  test('AC-PLT-009-01-01', async () => {
    // "the language selector lists only that store's published languages, and choosing one shows
    //  all interface text from that language's resources"
    const french = await api.post('/api/platform/languages', {
      name: 'French', culture: 'fr-FR', published: true, limitedToStores: [2],
    }, SESSIONS.admin);
    assert.equal(french.ok, true);
    const unpublished = await api.post('/api/platform/languages', {
      name: 'Portuguese', culture: 'pt-PT', published: false,
    }, SESSIONS.admin);

    const store1 = await api.get('/api/platform/languages/selector?storeId=1', SESSIONS.buyer);
    const names1 = store1.languages.map((l) => l.name);
    assert.ok(names1.includes('English') && names1.includes('Chichewa'));
    assert.equal(names1.includes('French'), false, 'a language limited to store 2 is not offered in store 1');
    assert.equal(names1.includes('Portuguese'), false, 'an unpublished language is never offered');

    const store2 = await api.get('/api/platform/languages/selector?storeId=2', SESSIONS.buyer);
    assert.ok(store2.languages.map((l) => l.name).includes('French'), 'and it is offered in store 2');

    await api.post(`/api/platform/languages/${french.language.id}/resource`, { name: 'Plt.Help.TourReplay', value: 'Revoir la visite' }, SESSIONS.admin);
    const text = await api.post(`/api/platform/languages/${french.language.id}/interface-text`, {
      keys: ['Plt.Help.TourReplay'],
    }, SESSIONS.buyer);
    assert.equal(text.text['Plt.Help.TourReplay'], 'Revoir la visite', 'the text comes from that language\'s resources');

    const denied = await api.post('/api/platform/languages', { name: 'Spanish', culture: 'es-ES' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Configuration.ManageLanguages');
    assert.equal(unpublished.ok, true);
  });

  test('AC-PLT-009-01-02', async () => {
    // "the interface text is shown in the selected language; untranslated resources show the
    //  default-language text and are reported by PLT-025"
    const wanted = ['Kiswahili', 'English', 'French', 'Arabic', 'Russian', 'Mandarin'];
    const existing = await api.get('/api/platform/languages', SESSIONS.admin);
    for (const name of wanted) {
      if (existing.some((l) => l.name === name)) continue;
      await api.post('/api/platform/languages', { name, culture: `${name.slice(0, 2).toLowerCase()}-XX`, published: true }, SESSIONS.admin);
    }
    const all = await api.get('/api/platform/languages', SESSIONS.admin);
    const idOf = (name) => all.find((l) => l.name === name).id;

    // the default language holds the key, Kiswahili has it translated, Russian does not
    await api.post(`/api/platform/languages/${idOf('English')}/resource`, { name: 'Plt.Accessibility.HighContrast', value: 'High contrast' }, SESSIONS.admin);
    await api.post(`/api/platform/languages/${idOf('Kiswahili')}/resource`, { name: 'Plt.Accessibility.HighContrast', value: 'Utofautishaji mkubwa' }, SESSIONS.admin);

    const swahili = await api.get(`/api/platform/languages/${idOf('Kiswahili')}/resource?key=Plt.Accessibility.HighContrast`, SESSIONS.buyer);
    assert.equal(swahili.value, 'Utofautishaji mkubwa');
    assert.equal(swahili.translated, true);

    const russian = await api.get(`/api/platform/languages/${idOf('Russian')}/resource?key=Plt.Accessibility.HighContrast`, SESSIONS.buyer);
    assert.equal(russian.value, 'High contrast', 'an untranslated resource shows the default-language text');
    assert.equal(russian.translated, false);
    assert.equal(russian.fallback, 'the default language');
    assert.equal(russian.reportedBy, 'PRD-PLT-025');

    const coverage = await api.get('/api/platform/languages/coverage', SESSIONS.admin);
    assert.equal(coverage.reportedBy, 'PRD-PLT-025');
    const row = coverage.rows.find((r) => r.language === 'Russian');
    assert.ok(row.missing.includes('Plt.Accessibility.HighContrast'), 'and it is reported as missing');
    assert.equal(row.showsDefaultLanguageText, true);
    assert.equal(coverage.rows.find((r) => r.language === 'Kiswahili').missing.includes('Plt.Accessibility.HighContrast'), false);
  });

  test('AC-PLT-009-01-03', async () => {
    // "English and Chichewa language packs are installed (interface text packs imported as
    //  resource XML) ... interface text appears in Chichewa"
    const all = await api.get('/api/platform/languages', SESSIONS.admin);
    const chichewa = all.find((l) => l.name === 'Chichewa');
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Language Name="Chichewa" SupportedVersion="5.00">
  <LocaleResource Name="Plt.Help.TourReplay"><Value>Yambitsani ulendo</Value></LocaleResource>
  <LocaleResource Name="Plt.Accessibility.LargerText"><Value>Mawu akulu</Value></LocaleResource>
</Language>`;
    const imported = await api.post(`/api/platform/languages/${chichewa.id}/import-xml`, { xml, fileName: 'chichewa.xml' }, SESSIONS.admin);
    assert.equal(imported.ok, true);
    assert.equal(imported.imported, 2);
    assert.equal(imported.uploadedThrough, 'PRD-ADM-008');
    assert.equal(imported.importedThrough, 'Admin LanguageController.ImportXml');

    const text = await api.post(`/api/platform/languages/${chichewa.id}/interface-text`, {
      keys: ['Plt.Help.TourReplay', 'Plt.Accessibility.LargerText'],
    }, SESSIONS.buyer);
    assert.equal(text.text['Plt.Help.TourReplay'], 'Yambitsani ulendo');
    assert.equal(text.text['Plt.Accessibility.LargerText'], 'Mawu akulu');
    assert.deepEqual(text.untranslated, []);

    const denied = await api.post(`/api/platform/languages/${chichewa.id}/import-xml`, { xml }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Configuration.ManageLanguages');
  });

  test('AC-PLT-009-02-01', async () => {
    // "the storefront uses the right-to-left stylesheet (DefaultClean styles.rtl.css) and the
    //  admin follows LocalizationSettings.IgnoreRtlPropertyForAdminArea"
    const all = await api.get('/api/platform/languages', SESSIONS.admin);
    const arabic = all.find((l) => l.name === 'Arabic');
    await api.post(`/api/platform/languages/${arabic.id}/state`, { rtl: true, published: true }, SESSIONS.admin);

    await saveSettingAsync('localizationsettings.ignorertlpropertyforadminarea', true, 0);
    const ignored = await api.get(`/api/platform/languages/${arabic.id}/direction`, SESSIONS.buyer);
    assert.equal(ignored.rtl, true);
    assert.equal(ignored.storefront.direction, 'rtl');
    assert.equal(ignored.storefront.stylesheet, 'styles.rtl.css');
    assert.equal(ignored.storefront.theme, 'DefaultClean');
    assert.equal(ignored.admin.direction, 'ltr', 'the admin area ignores the flag while the setting is on');
    assert.equal(ignored.admin.setting, 'localizationsettings.ignorertlpropertyforadminarea');

    await saveSettingAsync('localizationsettings.ignorertlpropertyforadminarea', false, 0);
    const followed = await api.get(`/api/platform/languages/${arabic.id}/direction`, SESSIONS.buyer);
    assert.equal(followed.admin.direction, 'rtl', 'and follows it when the setting is off');

    const english = all.find((l) => l.name === 'English');
    const ltr = await api.get(`/api/platform/languages/${english.id}/direction`, SESSIONS.buyer);
    assert.equal(ltr.storefront.direction, 'ltr');
    assert.equal(ltr.storefront.stylesheet, 'styles.css');
  });

  test('AC-PLT-009-03-01', async () => {
    // "address forms offer those regions or districts for that country" - StateProvince records
    // imported through CountryController.ImportCsv
    const countries = await api.get('/api/platform/countries', SESSIONS.admin);
    const malawi = countries.find((c) => c.twoLetterIsoCode === 'MW');
    assert.ok(malawi, 'the country list is maintained');

    const csv = 'Name,Abbreviation,DisplayOrder\nCentral Region,CR,1\nNorthern Region,NR,2\nSouthern Region,SR,3\n';
    const imported = await api.post(`/api/platform/countries/${malawi.id}/import-states`, { csv, fileName: 'malawi-regions.csv' }, SESSIONS.admin);
    assert.equal(imported.ok, true);
    assert.equal(imported.imported, 3);
    assert.equal(imported.importedThrough, 'Admin CountryController.ImportCsv');
    assert.equal(imported.uploadedThrough, 'PRD-ADM-008');

    const form = await api.get(`/api/platform/address-form?countryId=${malawi.id}`, SESSIONS.buyer);
    assert.equal(form.regionsOffered, true);
    const names = form.regions.map((r) => r.name);
    for (const region of ['Central Region', 'Northern Region', 'Southern Region']) {
      assert.ok(names.includes(region), `${region} is offered for that country`);
    }
    assert.ok(names.includes('Lilongwe'), 'beside the districts the configuration pack supplied');
    assert.equal(form.regions.find((r) => r.name === 'Central Region').abbreviation, 'CR');

    const other = countries.find((c) => c.twoLetterIsoCode === 'KE');
    const kenya = await api.get(`/api/platform/address-form?countryId=${other.id}`, SESSIONS.buyer);
    assert.equal(kenya.regions.some((r) => r.name === 'Central Region'), false, 'the regions belong to their own country');

    const denied = await api.post(`/api/platform/countries/${malawi.id}/import-states`, { csv }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Configuration.ManageCountries');
  });
});

/* ======================================================= PRD-PLT-013 multi-store ======= */

describe('PRD-PLT-013 multi-store', () => {
  test('AC-PLT-013-01-01', async () => {
    // "a product mapped only to the trade store is listed, searchable and purchasable only in
    //  the trade store"
    const stores = await api.get('/api/platform/stores', SESSIONS.admin);
    const retail = stores.find((s) => s.channel === 'B2C');
    const trade = stores.find((s) => s.channel === 'B2B');
    assert.ok(retail.url && trade.url, 'each store has its own Url');
    assert.notEqual(retail.url, trade.url);

    const product = await repository('Product').insertAsync({
      name: 'Bulk mailing sacks (trade only)', sku: 'TRADE-SACK-1', price: 42000, published: true, stockQuantity: 80,
    });
    const mapped = await api.post('/api/platform/stores/mappings', {
      entity: 'Product', entityId: product.id, storeIds: [trade.id],
    }, SESSIONS.admin);
    assert.equal(mapped.ok, true);
    assert.equal(mapped.limitedToStores, true);
    assert.match(mapped.savedThrough, /StoreMappingService.SaveStoreMappingsAsync/);

    const inTrade = await api.get(`/api/platform/stores/visibility?entity=Product&entityId=${product.id}&storeId=${trade.id}`, SESSIONS.admin);
    assert.deepEqual([inTrade.listed, inTrade.searchable, inTrade.purchasable], [true, true, true]);
    const inRetail = await api.get(`/api/platform/stores/visibility?entity=Product&entityId=${product.id}&storeId=${retail.id}`, SESSIONS.admin);
    assert.deepEqual([inRetail.listed, inRetail.searchable, inRetail.purchasable], [false, false, false]);
    assert.equal(inRetail.checkedBy, 'StoreMappingService.AuthorizeAsync');

    const tradeList = await api.get(`/api/catalogue/products?storeId=${trade.id}`, SESSIONS.buyer);
    assert.ok(tradeList.some((p) => p.id === product.id), 'listed in the trade store');
    const retailList = await api.get(`/api/catalogue/products?storeId=${retail.id}`, SESSIONS.buyer);
    assert.equal(retailList.some((p) => p.id === product.id), false, 'not listed in the retail store');

    const tradeSearch = await api.get(`/api/search?q=mailing%20sacks&storeId=${trade.id}`, SESSIONS.buyer);
    assert.ok(tradeSearch.items.some((p) => p.id === product.id), 'searchable in the trade store');
    const retailSearch = await api.get(`/api/search?q=mailing%20sacks&storeId=${retail.id}`, SESSIONS.buyer);
    assert.equal(retailSearch.items.some((p) => p.id === product.id), false, 'not searchable in the retail store');

    const detail = await api.get(`/api/catalogue/products/${product.id}?storeId=${retail.id}`, SESSIONS.buyer);
    assert.match(detail.message ?? '', /not found in this store/, 'and not purchasable there');
  });

  test('AC-PLT-013-01-02', async () => {
    // "a guest or registered consumer browses it, then they see retail products and retail
    //  prices of that store"
    const stores = await api.get('/api/platform/stores', SESSIONS.admin);
    const retail = stores.find((s) => s.channel === 'B2C');
    const product = await repository('Product').insertAsync({
      name: 'Prepaid postage pack',
      sku: 'RETAIL-POST-1',
      price: 2500,
      published: true,
      stockQuantity: 500,
      tradingModel: 'retail',
      tierPrices: [{ quantity: 10, price: 1800, storeId: retail.id }],
    });
    await api.post('/api/platform/stores/mappings', { entity: 'Product', entityId: product.id, storeIds: [retail.id] }, SESSIONS.admin);

    const front = await api.get(`/api/platform/stores/${retail.id}/storefront`, SESSIONS.buyer);
    assert.equal(front.ok, true);
    assert.equal(front.store.channel, 'B2C');
    assert.equal(front.audience, 'consumers');
    const row = front.products.find((p) => p.id === product.id);
    assert.ok(row, 'the consumer sees the retail product');
    assert.equal(row.price, 2500, 'at the retail price of that store');
    assert.equal(row.tradingModel, 'retail');

    const guest = await api.get(`/api/catalogue/products/${product.id}?storeId=${retail.id}`, 'guest-session');
    assert.equal(guest.finalPrice, 2500, 'a guest sees the same retail price');
  });

  test('AC-PLT-013-01-03', async () => {
    // "they see the trade catalogue and the prices for their role in that store
    //  (TierPrice.StoreId)"
    const stores = await api.get('/api/platform/stores', SESSIONS.admin);
    const trade = stores.find((s) => s.channel === 'B2B');
    const retail = stores.find((s) => s.channel === 'B2C');
    const product = await repository('Product').insertAsync({
      name: 'Pallet of mailing boxes',
      sku: 'TRADE-PALLET-1',
      price: 90000,
      published: true,
      stockQuantity: 40,
      tradingModel: 'bulk',
      tierPrices: [
        { quantity: 1, price: 72000, storeId: trade.id, customerRole: 'Registered' },
        { quantity: 1, price: 88000, storeId: retail.id },
      ],
    });
    await api.post('/api/platform/stores/mappings', { entity: 'Product', entityId: product.id, storeIds: [trade.id] }, SESSIONS.admin);

    const front = await api.get(`/api/platform/stores/${trade.id}/storefront`, SESSIONS.buyer);
    assert.equal(front.store.channel, 'B2B');
    assert.equal(front.audience, 'business buyers');
    assert.ok(front.customerRoles.includes('Registered'));
    const row = front.products.find((p) => p.id === product.id);
    assert.ok(row, 'the trade catalogue carries it');
    assert.equal(row.lowestTierPrice, 72000, 'at the price of their role in that store');
    assert.equal(row.tierPrices.length, 1, 'the other store\'s tier price is not theirs');

    const priced = await api.get(`/api/catalogue/products/${product.id}?storeId=${trade.id}`, SESSIONS.buyer);
    assert.equal(priced.finalPrice, 72000);
    assert.equal(priced.priceParts.tierPrice.storeId, trade.id);
  });

  test('AC-PLT-013-01-04', async () => {
    // "each model is reachable in the store it is mapped to; the model-specific behaviour is
    //  delivered by CAT and ORD features"
    const stores = await api.get('/api/platform/stores', SESSIONS.admin);
    const trade = stores.find((s) => s.channel === 'B2B');
    const retail = stores.find((s) => s.channel === 'B2C');
    const models = [
      { name: 'Contract packaging service', sku: 'MODEL-CONTRACT-1', tradingModel: 'contract-packaging', store: trade.id },
      { name: 'Forward contract: 2027 season', sku: 'MODEL-FORWARD-1', tradingModel: 'forward-contract', store: trade.id },
      { name: 'Single parcel stamp', sku: 'MODEL-RETAIL-1', tradingModel: 'retail', store: retail.id },
    ];
    for (const model of models) {
      const product = await repository('Product').insertAsync({
        name: model.name, sku: model.sku, price: 10000, published: true, stockQuantity: 25, tradingModel: model.tradingModel,
      });
      await api.post('/api/platform/stores/mappings', { entity: 'Product', entityId: product.id, storeIds: [model.store] }, SESSIONS.admin);
      model.id = product.id;
    }

    const tradeFront = await api.get(`/api/platform/stores/${trade.id}/storefront`, SESSIONS.buyer);
    const retailFront = await api.get(`/api/platform/stores/${retail.id}/storefront`, SESSIONS.buyer);
    for (const model of models) {
      const reachable = model.store === trade.id ? tradeFront : retailFront;
      const elsewhere = model.store === trade.id ? retailFront : tradeFront;
      assert.ok(reachable.products.some((p) => p.id === model.id), `${model.tradingModel} is reachable in its store`);
      assert.equal(elsewhere.products.some((p) => p.id === model.id), false, `${model.tradingModel} is not reachable in the other store`);
    }
    assert.ok(tradeFront.tradingModels.includes('contract-packaging'));
    assert.ok(tradeFront.tradingModels.includes('forward-contract'));
    assert.ok(retailFront.tradingModels.includes('retail'));
  });

  test('AC-PLT-013-01-05', async () => {
    // "each store applies its own value and other stores use the shared value (BR-PLT-011)"
    const key = 'shippingsettings.allowpickupinstore';
    await saveSettingAsync(key, true, 0);
    await saveSettingAsync(key, false, 2);

    const store2 = await api.get(`/api/platform/stores/setting?key=${key}&storeId=2`, SESSIONS.admin);
    assert.equal(store2.value, false, 'the store row wins for its own store');
    assert.equal(store2.level, 'store row');
    assert.equal(store2.sharedValue, true);
    assert.equal(store2.rule, 'BR-PLT-011');
    assert.match(store2.resolvedBy, /LoadSettingAsync with loadSharedValueIfNotFound/);

    const store1 = await api.get(`/api/platform/stores/setting?key=${key}&storeId=1`, SESSIONS.admin);
    assert.equal(store1.value, true, 'a store with no row of its own uses the shared value');
    assert.equal(store1.level, 'shared row (StoreId 0)');

    const across = await api.get(`/api/platform/stores/setting?key=${key}&allStores=true`, SESSIONS.admin);
    assert.equal(across.rows.find((r) => r.storeId === 2).level, 'store row');
    assert.equal(across.rows.find((r) => r.storeId === 1).level, 'shared row (StoreId 0)');

    const unset = await api.get('/api/platform/stores/setting?key=catalogsettings.notsetanywhere&storeId=1', SESSIONS.admin);
    assert.equal(unset.level, 'settings-class default', 'and with no row at all, the class default');
    assert.equal(await getSettingAsync(key, 2, null), false, 'the two-level resolution is the one the product reads');
  });
});

/* ======================================================= PRD-PLT-019 help and tours ==== */

describe('PRD-PLT-019 contextual help and guided tours', () => {
  test('AC-PLT-019-01-01', async () => {
    // "the tips are shown in the user's language; screens without tips show none"
    const saved = await api.post('/api/platform/help/tips', {
      route: '/admin/configuration/packs',
      role: 'staff',
      languageId: 1,
      title: 'Applying a pack',
      body: 'Validate a pack set before you apply it. A refused pack writes nothing.',
      displayOrder: 1,
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);
    assert.equal(saved.shownWithoutDeployment, true);

    const all = await api.get('/api/platform/languages', SESSIONS.admin);
    const chichewa = all.find((l) => l.name === 'Chichewa');
    await api.post('/api/platform/help/tips', {
      route: '/admin/configuration/packs',
      role: 'staff',
      languageId: chichewa.id,
      title: 'Applying a pack',
      body: 'Yang\'anani paketi musanaigwiritse ntchito.',
    }, SESSIONS.admin);

    const english = await api.get('/api/platform/help/tips?route=/admin/configuration/packs&role=staff&languageId=1', SESSIONS.admin);
    assert.equal(english.hasTips, true);
    assert.equal(english.tips.length, 1);
    assert.match(english.tips[0].body, /Validate a pack set/);

    const local = await api.get(`/api/platform/help/tips?route=/admin/configuration/packs&role=staff&languageId=${chichewa.id}`, SESSIONS.admin);
    assert.equal(local.tips.length, 1);
    assert.match(local.tips[0].body, /Yang'anani paketi/, 'in the user\'s language');

    const otherRole = await api.get('/api/platform/help/tips?route=/admin/configuration/packs&role=buyer&languageId=1', SESSIONS.buyer);
    assert.equal(otherRole.hasTips, false, 'a tip for another role is not shown');

    const noTips = await api.get('/api/platform/help/tips?route=/admin/system/log&role=staff&languageId=1', SESSIONS.admin);
    assert.equal(noTips.hasTips, false, 'a screen without tips shows none');
    assert.deepEqual(noTips.tips, []);
  });

  test('AC-PLT-019-01-02', async () => {
    // "the tour starts once; the user can skip it and replay it later (Plt.Help.TourReplay);
    //  completion is stored per user"
    const tour = await api.post('/api/platform/help/tours', {
      role: 'buyer',
      name: 'Your first order',
      steps: [
        { target: '#search', text: 'Search for what you need.' },
        { target: '#cart', text: 'Your cart keeps items from several sellers.' },
      ],
    }, SESSIONS.admin);
    assert.equal(tour.ok, true);

    const shopper = await createCustomerAsync({ email: 'tour.shopper@example.com', firstName: 'Tour', lastName: 'Shopper', roles: ['Registered'] });
    const first = await api.get(`/api/platform/help/tour?role=buyer&customerId=${shopper.id}`, SESSIONS.buyer);
    assert.equal(first.startsNow, true, 'it starts on the first sign-in');
    assert.equal(first.tour.steps.length, 2);
    assert.equal(first.canSkip, true);
    assert.equal(first.replayLabel, 'Replay the tour');
    assert.equal(first.storedPerUser, true);

    const again = await api.get(`/api/platform/help/tour?role=buyer&customerId=${shopper.id}`, SESSIONS.buyer);
    assert.equal(again.startsNow, false, 'and not a second time');
    assert.equal(again.startedBefore, true);

    const skipped = await api.post('/api/platform/help/tour/finish', { tourId: tour.tour.id, customerId: shopper.id, status: 'Skipped' }, SESSIONS.buyer);
    assert.equal(skipped.ok, true);
    assert.equal(skipped.completion.status, 'Skipped');

    const replay = await api.post('/api/platform/help/tour/replay', { tourId: tour.tour.id, customerId: shopper.id }, SESSIONS.buyer);
    assert.equal(replay.replayed, true);
    assert.equal(replay.label, 'Replay the tour');
    assert.equal(replay.tour.steps.length, 2);

    const completions = await api.get(`/api/platform/help/tour/completions?customerId=${shopper.id}`, SESSIONS.admin);
    assert.equal(completions.length, 1, 'one record per user and tour');
    assert.equal(completions[0].status, 'Skipped');
    assert.equal(completions[0].replays, 1);

    const other = await createCustomerAsync({ email: 'tour.second@example.com', firstName: 'Second', lastName: 'Shopper', roles: ['Registered'] });
    assert.equal((await api.get(`/api/platform/help/tour?role=buyer&customerId=${other.id}`, SESSIONS.buyer)).startsNow, true, 'another user gets their own first run');
  });

  test('AC-PLT-019-01-03', async () => {
    // "the native steps and links remain available alongside PLT tips"
    await saveSettingAsync('adminareasettings.showdocumentationreferencelinks', true, 0);
    const native = await api.get('/api/platform/help/admin-first-run', SESSIONS.admin);
    assert.equal(native.resourcePrefix, 'Admin.ConfigurationSteps.');
    assert.ok(native.configurationSteps.length >= 4, 'the native first-run steps exist');
    assert.ok(native.configurationSteps.every((s) => s.resource.startsWith('Admin.ConfigurationSteps.')));
    assert.equal(native.showDocumentationReferenceLinks, true);
    assert.equal(native.setting, 'adminareasettings.showdocumentationreferencelinks');
    assert.equal(native.availableAlongsidePltTips, true);

    const off = await api.post('/api/platform/help/documentation-links', { show: false }, SESSIONS.admin);
    assert.equal(off.ok, true);
    assert.equal((await api.get('/api/platform/help/admin-first-run', SESSIONS.admin)).showDocumentationReferenceLinks, false);
    await api.post('/api/platform/help/documentation-links', { show: true }, SESSIONS.admin);

    // the PLT tips of a screen are returned with the native help, not instead of it
    const screen = await api.get('/api/platform/help/tips?route=/admin/configuration/packs&role=staff&languageId=1', SESSIONS.admin);
    assert.equal(screen.hasTips, true);
    assert.ok(screen.native.configurationSteps.length >= 4, 'both are available on the same screen');
    assert.equal(screen.native.showDocumentationReferenceLinks, true);
  });

  test('AC-PLT-019-02-01', async () => {
    // "a user with Platform.Core.Help.CreateEditDelete ... the change is shown to users without
    //  a deployment"
    const denied = await api.post('/api/platform/help/tips', {
      route: '/account/orders', title: 'Your orders', body: 'Track an order from here.',
    }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Platform.Core.Help.CreateEditDelete');
    assert.equal((await api.get('/api/platform/help/tips?route=/account/orders', SESSIONS.buyer)).hasTips, false, 'and nothing is created');

    const created = await api.post('/api/platform/help/tips', {
      route: '/account/orders',
      role: 'buyer',
      title: 'Your orders',
      body: 'Track an order from here.',
      materialLink: { source: 'PRD-DOC-002 document', reference: 'Buyer guide v1' },
    }, SESSIONS.admin);
    assert.equal(created.ok, true);
    assert.equal(created.tip.materialLink.source, 'PRD-DOC-002 document');
    assert.equal(created.deploymentRequired, false);
    assert.equal((await api.get('/api/platform/help/tips?route=/account/orders&role=buyer', SESSIONS.buyer)).hasTips, true, 'the change is live at once');

    const edited = await api.post('/api/platform/help/tips', {
      route: '/account/orders', role: 'buyer', title: 'Your orders', body: 'Track an order, or ask for help, from here.',
    }, SESSIONS.admin);
    assert.equal(edited.tip.id, created.tip.id, 'an edit changes the same tip');
    assert.match((await api.get('/api/platform/help/tips?route=/account/orders&role=buyer', SESSIONS.buyer)).tips[0].body, /ask for help/);

    const page = await api.post('/api/platform/help/tips', {
      route: '/account/orders', role: 'buyer', title: 'Training', body: 'See the training page.', materialLink: { source: 'PRD-MKT-007 content page', reference: 'Getting started' },
    }, SESSIONS.admin);
    assert.equal(page.ok, true, 'a training link may also be an MKT-007 content page');
    const invalid = await api.post('/api/platform/help/tips', {
      route: '/account/orders', title: 'Bad link', body: '...', materialLink: { source: 'a PDF on my laptop' },
    }, SESSIONS.admin);
    assert.equal(invalid.ok, false);

    const tourDenied = await api.post('/api/platform/help/tours', { role: 'seller', name: 'Selling', steps: [] }, SESSIONS.buyer);
    assert.equal(tourDenied.permission, 'Platform.Core.Help.CreateEditDelete');

    const trail = await auditTrailAsync({ entity: 'HelpTip' });
    assert.ok(trail.length >= 2, 'the edits are recorded');
  });
});
