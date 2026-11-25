// PRD-PLT-006 Branding and theme.
//
// The logo is StoreInformationSettings.LogoPictureId, store-overridable (AC-PLT-006-01-01); the
// colours and fonts of a store come from one variables file of a client child theme of
// DefaultClean, because whether the licensed theme plugin has a 5.00 build is an open item under
// VER-500 (AC-PLT-006-01-02, decision P-2: the licensed plugin gets an in-house substitute behind
// the same extension point). Documents and e-mails carry the same branding through
// PdfSettings.LogoPictureId and the message-template header (AC-PLT-006-02-01, TRK-004).

import { repository } from '../../../core/repository.js';
import { getSettingAsync, getStoreSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { checkUploadAsync } from '../../product-adm/services/uploads.js';

/** The theme a client child theme of DefaultClean needs values for. One file, no code. */
export const THEME_VARIABLES = [
  { name: '--brand-primary', from: 'primary', fallback: '#2f3640' },
  { name: '--brand-accent', from: 'accent', fallback: '#f0b323' },
  { name: '--brand-on-primary', from: 'onPrimary', fallback: '#ffffff' },
  { name: '--brand-font-body', from: 'bodyFont', fallback: 'system-ui, sans-serif' },
  { name: '--brand-font-heading', from: 'headingFont', fallback: 'system-ui, sans-serif' },
];

export const BASE_THEME = 'DefaultClean';

/**
 * AC-PLT-006-01-01: the logo is uploaded through the ADM-008 upload gate (the native
 * Admin PictureController.AsyncUpload action), then set for the store.
 */
export async function uploadLogoAsync({
  storeId, fileName, bytes, contentType = null, actor = null,
}) {
  if (!await authorizeAsync('Configuration.ManageSettings', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageSettings' };
  }
  const check = await checkUploadAsync({
    action: 'Admin PictureController.AsyncUpload',
    fileName,
    bytes,
    contentType,
    actor: actor?.email ?? 'system',
  });
  if (check.ok !== true) return { ...check, uploadedThrough: 'PRD-ADM-008' };
  const picture = await repository('Picture').insertAsync({
    fileName, mimeType: contentType, seoFilename: String(fileName).replace(/\.[^.]+$/, ''), storeId: Number(storeId),
  });
  return {
    ok: true, pictureId: picture.id, uploadedThrough: 'PRD-ADM-008', scanId: check.scanId ?? null,
  };
}

export async function setLogoAsync({ storeId, pictureId, actor = null }) {
  if (!await authorizeAsync('Configuration.ManageSettings', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageSettings' };
  }
  const before = await getStoreSettingAsync('storeinformationsettings.logopictureid', Number(storeId));
  await saveSettingAsync('storeinformationsettings.logopictureid', Number(pictureId), Number(storeId), 'branding');
  return {
    ok: true,
    key: 'storeinformationsettings.logopictureid',
    storeId: Number(storeId),
    storeOverridable: true,
    previousPictureId: before ?? null,
    pictureId: Number(pictureId),
  };
}

export async function setThemeAsync({ storeId, theme, actor = null }) {
  if (!await authorizeAsync('Configuration.ManageSettings', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageSettings' };
  }
  await saveSettingAsync('storeinformationsettings.defaultstoretheme', theme, Number(storeId), 'branding');
  return {
    ok: true, storeId: Number(storeId), theme, key: 'storeinformationsettings.defaultstoretheme',
  };
}

/** The brand values the client pack supplies, which is where a client difference belongs. */
async function brandValuesAsync(storeId) {
  const { currentState } = await import('./platform.js');
  const brand = currentState()?.report?.content?.brand ?? {};
  const override = await getSettingAsync('plt.brand', storeId, null);
  return { ...brand, ...(override ?? {}) };
}

/**
 * AC-PLT-006-01-02: one variables file per store holds every colour and font value, so a brand
 * change is a configuration change and no product code changes.
 */
export async function themeVariablesAsync({ storeId = 1 } = {}) {
  const brand = await brandValuesAsync(storeId);
  const theme = await getSettingAsync('storeinformationsettings.defaultstoretheme', storeId, BASE_THEME);
  const variables = THEME_VARIABLES.map((v) => ({
    name: v.name, value: brand[v.from] ?? v.fallback, fromPack: brand[v.from] !== undefined,
  }));
  return {
    storeId: Number(storeId),
    theme,
    baseTheme: BASE_THEME,
    childTheme: `${theme} (child theme of ${BASE_THEME})`,
    file: `themes/${theme}/content/variables.css`,
    variables,
    css: `:root {\n${variables.map((v) => `  ${v.name}: ${v.value};`).join('\n')}\n}\n`,
    appliesTo: 'every storefront page of the store',
    productCodeChanged: false,
    licensedPlugin: {
      item: 'whether the licensed theme plugin has a 5.00 build is an open item under VER-500',
      prototype: 'decision P-2: a client child theme of DefaultClean stands in behind the same extension point',
    },
  };
}

/** AC-PLT-006-01-01 and 01-03: what the storefront header of one store shows. */
export async function brandingAsync({ storeId = 1 } = {}) {
  const store = await repository('Store').getByIdAsync(storeId);
  const pictureId = await getSettingAsync('storeinformationsettings.logopictureid', storeId, null);
  const picture = pictureId ? await repository('Picture').getByIdAsync(pictureId) : null;
  const theme = await themeVariablesAsync({ storeId });
  const allowCustomerToSelectTheme = await getSettingAsync('storeinformationsettings.allowcustomertoselecttheme', storeId, false);
  const brand = await brandValuesAsync(storeId);
  return {
    storeId: Number(storeId),
    storeName: await getSettingAsync('storeinformationsettings.storename', storeId, store?.name ?? null),
    logo: pictureId
      ? { pictureId: Number(pictureId), fileName: picture?.fileName ?? null, url: `/images/${pictureId}/${picture?.seoFilename ?? 'logo'}.png` }
      : { pictureId: null, url: null, text: brand.logoText ?? null },
    theme: theme.theme,
    themeFile: theme.file,
    variables: theme.variables,
    allowCustomerToSelectTheme: allowCustomerToSelectTheme === true,
    customerThemeSelector: allowCustomerToSelectTheme === true,
  };
}

/** AC-PLT-006-01-03: each store shows its own theme. */
export async function themesPerStoreAsync() {
  const stores = await repository('Store').getAllAsync();
  const rows = [];
  for (const store of stores) {
    const own = await getStoreSettingAsync('storeinformationsettings.defaultstoretheme', store.id);
    rows.push({
      storeId: store.id,
      store: store.code ?? String(store.id),
      theme: own ?? await getSettingAsync('storeinformationsettings.defaultstoretheme', store.id, BASE_THEME),
      ownRow: own !== undefined,
      logoPictureId: await getStoreSettingAsync('storeinformationsettings.logopictureid', store.id) ?? null,
    });
  }
  return {
    rows,
    key: 'storeinformationsettings.defaultstoretheme',
    storedPerStore: true,
    customerSelection: 'offered only where storeinformationsettings.allowcustomertoselecttheme is on',
  };
}

/**
 * AC-PLT-006-02-01: the invoice PDF and the system e-mail carry the same branding - the PDF from
 * PdfSettings.LogoPictureId (or the DOC-001 template branding) and the e-mail from the client
 * header of the message template (TRK-004).
 */
export async function documentBrandingAsync({ storeId = 1 } = {}) {
  const branding = await brandingAsync({ storeId });
  let pdfPictureId = await getSettingAsync('pdfsettings.logopictureid', storeId, null);
  let pdfSource = 'pdfsettings.logopictureid';
  if (!pdfPictureId) {
    pdfPictureId = branding.logo.pictureId;
    pdfSource = 'storeinformationsettings.logopictureid (no PDF logo set for this store)';
  }
  const template = await repository('MessageTemplate').getOneAsync((t) => t.name === 'ClientHeader'
    && (Number(t.storeId ?? 0) === Number(storeId) || Number(t.storeId ?? 0) === 0));
  return {
    storeId: Number(storeId),
    pdf: {
      logoPictureId: pdfPictureId ? Number(pdfPictureId) : null,
      source: pdfSource,
      documentTemplate: 'PRD-DOC-001 template branding',
    },
    email: {
      header: template?.body ?? `${branding.storeName ?? 'Store'} header`,
      templateHeader: template ? template.name : 'the client header of the message template',
      owner: 'PRD-TRK-004',
      variables: branding.variables,
    },
    sameBrandingAsStorefront: true,
  };
}

export async function setDocumentBrandingAsync({ storeId, pdfPictureId = null, emailHeader = null, actor = null }) {
  if (!await authorizeAsync('Configuration.ManageSettings', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageSettings' };
  }
  if (pdfPictureId !== null) await saveSettingAsync('pdfsettings.logopictureid', Number(pdfPictureId), Number(storeId), 'branding');
  if (emailHeader !== null) {
    const existing = await repository('MessageTemplate').getOneAsync((t) => t.name === 'ClientHeader' && Number(t.storeId ?? 0) === Number(storeId));
    if (existing) await repository('MessageTemplate').updateAsync({ ...existing, body: emailHeader });
    else {
      await repository('MessageTemplate').insertAsync({
        name: 'ClientHeader', storeId: Number(storeId), body: emailHeader, owner: 'PRD-TRK-004',
      });
    }
  }
  await auditAsync({
    event: 'AUD-SEC-001',
    area: 'PLT',
    feature: 'PRD-PLT-006',
    entity: 'Setting',
    entityId: `branding-${storeId}`,
    actor: actor?.email ?? null,
    after: { pdfPictureId, emailHeader: emailHeader ? 'set' : null },
    note: 'document and e-mail branding set',
  });
  return { ok: true, storeId: Number(storeId) };
}
