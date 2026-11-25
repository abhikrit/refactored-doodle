// PRD-ADM-008 Upload and content scanning controls.
//
// US-ADM-008-01  which file types and sizes may be uploaded in each place
// US-ADM-008-02  every upload scanned for viruses before it is stored
//
// BR-ADM-060 and decision SINGLE-FILTER: ADM-008 is the single owner of server-side upload
// checks - file type, size, file signature and virus scan - for every upload in the product.
// Each upload belongs to one context: an ADM context of the native action, or a context a module
// registers through IC-ADM-08 (with a resolver for native actions, or a CheckUpload call from
// its own endpoint); a resolver match takes precedence over the ADM default context of the
// action. No other module keeps a file-type or size check or registers an upload filter.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';

// Upload contexts are configuration registered at installation (IC-ADM-08) and edited on the
// ADM-008 page, so they live beside the plugin rather than in the data store, which the pack
// loader resets when a client pack is applied. Scans are records and go to the repository.
const contexts = new Map();
const scanRepo = () => repository('UploadScan');

/** The fifteen ADM contexts of the native upload actions (AC-ADM-008-01-01, BR-ADM-006/007). */
export const ADM_CONTEXTS = [
  { code: 'storefront-attribute-file', actions: ['Nop.Web ShoppingCartController.UploadFileProductAttribute'] },
  { code: 'checkout-attribute-file', actions: ['Nop.Web ShoppingCartController.UploadFileCheckoutAttribute'] },
  { code: 'return-request-file', actions: ['Nop.Web ReturnRequestController.UploadFileReturnRequest'] },
  { code: 'avatar', actions: ['Nop.Web CustomerController.UploadAvatar'] },
  { code: 'vendor-picture', actions: ['Nop.Web VendorController.ApplyVendorSubmit', 'Nop.Web VendorController.Info'] },
  { code: 'admin-picture', actions: ['Admin PictureController.AsyncUpload'] },
  { code: 'product-picture', actions: ['Admin ProductController.ProductPictureAdd'] },
  { code: 'product-3d-object', actions: ['Admin ProductController.Upload3dObject'] },
  { code: 'admin-download', actions: ['Admin DownloadController.AsyncUpload'] },
  {
    code: 'data-imports',
    actions: ['Admin ProductController.ImportExcel', 'Admin CategoryController.ImportFromXlsx', 'Admin ManufacturerController.ImportFromXlsx',
      'Admin CustomerController.ImportExcel', 'Admin PriceListController.ImportExcel', 'Admin CountryController.ImportCsv',
      'Admin NewsLetterSubscriptionController.ImportCsv', 'Admin FilterLevelValueController.ImportFromXlsx'],
  },
  { code: 'language-import', actions: ['Admin LanguageController.ImportXml'] },
  { code: 'store-icons', actions: ['Admin SettingController.UploadIcons'] },
  { code: 'plugin-upload', actions: ['Admin PluginController.UploadPluginsAndThemes'] },
  { code: 'html-editor-files', actions: ['Admin ElFinderController.Connector'] },
  { code: 'other-upload', actions: [] },
];

/** The file signatures the prototype checks (AC-ADM-008-01-04). */
const SIGNATURES = {
  pdf: ['25504446'],
  png: ['89504e47'],
  jpg: ['ffd8ff'],
  jpeg: ['ffd8ff'],
  gif: ['47494638'],
  zip: ['504b0304'],
  xlsx: ['504b0304'],
  docx: ['504b0304'],
  glb: ['676c5446'],
};

const extensionOf = (fileName) => String(fileName).split('.').pop().toLowerCase();
const sizeKb = (bytes) => Math.ceil((bytes?.length ?? 0) / 1024);

const hexHead = (bytes, length = 4) => Buffer.from(bytes ?? []).subarray(0, length).toString('hex');

/* ============================================================ IC-ADM-08 registration ===== */

/**
 * RegisterUploadContext. A module registers its own context, with a resolver that recognises its
 * uploads from the route values of a native action, or its own endpoint. Values are then edited
 * only on the ADM-008 page (AC-ADM-008-01-06, AC-ADM-008-01-07).
 */
export async function registerUploadContextAsync({
  code, owningFeature, coveredActions = [], resolver = null, ownEndpoint = false,
  allowedExtensions, maxSizeKb, scanEnabled = true, failMode = 'reject',
}) {
  const existing = contexts.get(code);
  if (existing && existing.owningFeature !== owningFeature) {
    throw new Error(`IC-ADM-08: upload context ${code} is already registered by ${existing.owningFeature}`);
  }
  contexts.set(code, {
    code,
    owningFeature,
    coveredActions,
    resolverName: resolver?.name ?? null,
    resolver,
    ownEndpoint,
    allowedExtensions,
    maxSizeKb,
    scanEnabled,
    failMode,
  });
  return contexts.get(code);
}

export const uploadContextsAsync = async () => [...contexts.values()]
  .map(({ resolver, ...rest }) => ({ ...rest, hasResolver: typeof resolver === 'function' }))
  .sort((a, b) => a.code.localeCompare(b.code));
export const uploadScansAsync = () => scanRepo().getAllAsync();

export async function setUploadPolicyAsync({
  code, allowedExtensions, maxSizeKb, scanEnabled, failMode, customer = null,
}) {
  const context = contexts.get(code);
  if (!context) return { ok: false, message: `unknown upload context ${code}` };
  const before = {
    allowedExtensions: context.allowedExtensions, maxSizeKb: context.maxSizeKb, scanEnabled: context.scanEnabled, failMode: context.failMode,
  };
  const updated = {
    ...context,
    allowedExtensions: allowedExtensions ?? context.allowedExtensions,
    maxSizeKb: maxSizeKb ?? context.maxSizeKb,
    scanEnabled: scanEnabled ?? context.scanEnabled,
    failMode: failMode ?? context.failMode,
  };
  contexts.set(code, updated);
  await auditAsync({
    event: 'AUD-ADM-006',
    area: 'ADM',
    feature: 'PRD-ADM-008',
    entity: 'UploadContext',
    entityId: context.code,
    actor: customer?.email ?? 'admin',
    actorRole: 'Administrators',
    before,
    after: {
      allowedExtensions: updated.allowedExtensions, maxSizeKb: updated.maxSizeKb, scanEnabled: updated.scanEnabled, failMode: updated.failMode,
    },
    note: 'upload policy changed; module contexts are edited here, not in the owning module',
  });
  return { ok: true, context: updated };
}

/**
 * Which context applies to an upload: a module resolver that matches wins over the ADM default
 * context of the action; a file from an endpoint with no context gets "other upload"
 * (BR-ADM-060).
 */
export async function contextForAsync({ action, routeValues = {}, contextCode = null }) {
  const all = [...contexts.values()];
  if (contextCode) return contexts.get(contextCode) ?? contexts.get('other-upload');
  const covering = all.filter((c) => (c.coveredActions ?? []).includes(action));
  const resolved = covering.find((c) => typeof c.resolver === 'function' && c.resolver(routeValues) === true);
  return resolved ?? covering.find((c) => c.owningFeature === 'PRD-ADM-008') ?? covering[0]
    ?? contexts.get('other-upload');
}

/* =================================================================== the check =========== */

/**
 * The single upload check: type, size, file signature, then the scan - all before anything is
 * stored. This is what the one ADM-008 global action filter calls, what the IDownloadService /
 * IPictureService backstop calls, and what IC-ADM-08 CheckUpload exposes to a module endpoint.
 *
 * AC-ADM-008-01-01 Adm.UploadTypeNotAllowed; 01-02 Adm.UploadTooLarge;
 * 01-03 the stricter of the native per-field limit and the policy;
 * 01-04 the file signature; 02-01 Adm.UploadInfected; 02-02 Adm.UploadScanUnavailable.
 */
export async function checkUploadAsync({
  action = null, contextCode = null, routeValues = {}, fileName, contentType = null, bytes = Buffer.alloc(0),
  nativeLimit = null, antivirus = null, actor = 'system',
}) {
  const context = await contextForAsync({ action, routeValues, contextCode });
  if (!context) return { ok: false, message: 'no upload context' };
  const extension = extensionOf(fileName);
  const size = sizeKb(bytes);

  const refuse = async (messageKey, extra = {}) => {
    const scan = await scanRepo().insertAsync({
      fileHash: hexHead(bytes, 8),
      fileName,
      context: context.code,
      status: 'Rejected',
      result: messageKey,
      scannedOnUtc: new Date().toISOString(),
      ...extra,
    });
    await auditAsync({
      event: 'AUD-ADM-006',
      area: 'ADM',
      feature: 'PRD-ADM-008',
      entity: 'UploadScan',
      entityId: scan.id,
      actor,
      actorRole: 'System',
      before: null,
      after: { context: context.code, fileHash: scan.fileHash, reason: messageKey },
      note: 'upload refused before anything was stored',
    });
    const { tokens, ...detail } = extra;
    return {
      ok: false,
      messageKey,
      message: resource(messageKey, tokens ?? {}),
      context: context.code,
      stored: false,
      scanId: scan.id,
      ...detail,
    };
  };

  // the stricter of the native per-field limit and the context policy (BR-ADM-060)
  const allowed = nativeLimit?.allowedExtensions
    ? context.allowedExtensions.filter((e) => nativeLimit.allowedExtensions.includes(e))
    : context.allowedExtensions;
  const maxKb = nativeLimit?.maxSizeKb != null
    ? Math.min(nativeLimit.maxSizeKb, context.maxSizeKb)
    : context.maxSizeKb;

  if (!allowed.map((e) => e.toLowerCase()).includes(extension)) {
    return refuse('Adm.UploadTypeNotAllowed', { reason: 'extension', effectiveAllowed: allowed });
  }
  if (size > maxKb) {
    return refuse('Adm.UploadTooLarge', { reason: 'size', tokens: { 0: `${maxKb} KB` }, effectiveMaxKb: maxKb });
  }
  const signatures = SIGNATURES[extension];
  if (signatures && bytes.length) {
    const head = hexHead(bytes, 4);
    if (!signatures.some((sig) => head.startsWith(sig))) {
      return refuse('Adm.UploadTypeNotAllowed', { reason: 'file signature does not match the extension' });
    }
  }

  if (!context.scanEnabled) {
    const scan = await scanRepo().insertAsync({
      fileHash: hexHead(bytes, 8), fileName, context: context.code, status: 'Clean', result: 'not scanned (scanning is off for this context)', scannedOnUtc: new Date().toISOString(),
    });
    return {
      ok: true, stored: true, context: context.code, scanId: scan.id, scanned: false,
    };
  }

  // SM-ADM-08: Scanning -> Clean / Infected, or the fail mode when the engine is unavailable
  let verdict;
  try {
    verdict = antivirus ? await antivirus.scanAsync({ fileName, contentType, bytes }) : { result: 'Clean' };
  } catch (err) {
    verdict = { result: 'Error', message: err.message };
  }
  if (verdict.result === 'Infected') {
    return refuse('Adm.UploadInfected', { signature: verdict.signature ?? null, reason: 'infected' });
  }
  if (verdict.result === 'Error') {
    if (context.failMode === 'quarantine') {
      const scan = await scanRepo().insertAsync({
        fileHash: hexHead(bytes, 8), fileName, context: context.code, status: 'Quarantined', result: 'engine unavailable', scannedOnUtc: new Date().toISOString(),
      });
      return {
        ok: true, quarantined: true, usable: false, context: context.code, scanId: scan.id, message: resource('Adm.UploadScanUnavailable'),
      };
    }
    return refuse('Adm.UploadScanUnavailable', { reason: 'engine unavailable' });
  }
  const scan = await scanRepo().insertAsync({
    fileHash: hexHead(bytes, 8), fileName, context: context.code, status: 'Clean', engine: verdict.engine ?? 'mock', result: 'clean', scannedOnUtc: new Date().toISOString(),
  });
  return {
    ok: true, stored: true, scanned: true, context: context.code, scanId: scan.id,
  };
}

/** SM-ADM-08: a quarantined file is released or deleted when the scan completes. */
export async function completeQuarantineScanAsync({ scanId, result }) {
  const scan = await scanRepo().getByIdAsync(scanId);
  if (!scan || scan.status !== 'Quarantined') return { ok: false, message: 'not a quarantined scan' };
  const updated = await scanRepo().updateAsync({ ...scan, status: result === 'Infected' ? 'Infected' : 'Clean', result });
  return { ok: true, scan: updated, released: result !== 'Infected' };
}
