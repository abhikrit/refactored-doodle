// PRD-SEC-002 Edge protection: the WAF and DDoS service in front of the instance, the real client
// IP address behind it, the admin IP allow-list, the honeypot, and the single download-ownership
// filter with its IC-SEC-05 rule providers.
//
// BR-SEC-005: one filter owns download access on Nop.Web DownloadController.GetFileUpload and
// Admin DownloadController.DownloadFile. A module that needs its own rule registers a provider;
// it adds no filter of its own.
// BR-ADM-060: upload type and size checks belong to the ADM-008 policy; SEC adds none.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { providers, runProviders } from '../../../core/providers.js';

const ownershipRepo = () => repository('UploadOwnership');
const logRepo = () => repository('Log');

/* ============================================================ the WAF and DDoS edge ===== */

export const WAF_RULES = [
  { id: 'sql-injection', pattern: /(\bunion\b.+\bselect\b|\bor\b\s+1\s*=\s*1|--\s|;\s*drop\s+table)/i },
  { id: 'cross-site-scripting', pattern: /(<script\b|onerror\s*=|javascript:)/i },
  { id: 'path-traversal', pattern: /\.\.(\/|\\)/ },
];

/** AC-SEC-002-01-01: the hosting checklist records what sits in front of the application. */
export async function edgeAsync({ storeId = 1 } = {}) {
  const recorded = await getSettingAsync('sec.edgeprotection', storeId, null);
  const allowedFrom = await getSettingAsync('sec.applicationacceptstrafficfrom', storeId, null);
  return {
    wafService: recorded?.wafService ?? 'not configured',
    ddosService: recorded?.ddosService ?? 'not configured',
    provider: recorded?.provider ?? 'not configured',
    region: recorded?.region ?? 'not configured',
    encryptionAtRest: recorded?.encryptionAtRest ?? 'not configured',
    evidence: recorded?.evidence ?? 'not configured',
    applicationAcceptsTrafficFrom: allowedFrom ?? 'not configured',
    everyPublicRequestPassesTheEdge: Boolean(recorded?.wafService) && Boolean(allowedFrom),
    ok: Boolean(recorded?.wafService) && Boolean(recorded?.ddosService) && Boolean(allowedFrom)
      && Boolean(recorded?.provider) && Boolean(recorded?.region) && Boolean(recorded?.evidence),
  };
}

export async function recordEdgeAsync({ values, actor = null, storeId = 1 }) {
  const recorded = await getSettingAsync('sec.edgeprotection', storeId, {}) ?? {};
  const next = { ...recorded, ...values, recordedOnUtc: new Date().toISOString() };
  await saveSettingAsync('sec.edgeprotection', next, 0);
  if (values.applicationAcceptsTrafficFrom) {
    await saveSettingAsync('sec.applicationacceptstrafficfrom', values.applicationAcceptsTrafficFrom, 0);
  }
  await auditAsync({
    event: 'AUD-SEC-010', area: 'SEC', feature: 'PRD-SEC-002', entity: 'HostingChecklist', entityId: 'edge', actor, after: values, storeId, note: 'edge protection recorded',
  });
  return { ok: true, edge: await edgeAsync({ storeId }) };
}

/** AC-SEC-002-01-02: a request the WAF blocks never reaches the application, and is logged. */
export async function wafAsync({
  path = '/', query = '', body = '', ipAddress = null, storeId = 1,
}) {
  const payload = `${path} ${query} ${typeof body === 'string' ? body : JSON.stringify(body)}`;
  const rule = WAF_RULES.find((r) => r.pattern.test(payload));
  if (!rule) return { blocked: false, reachedApplication: true };
  const logged = await logRepo().insertAsync({
    logLevel: 'Warning',
    shortMessage: `WAF blocked a request (${rule.id})`,
    fullMessage: `${path}${query ? `?${query}` : ''} from ${ipAddress ?? 'unknown'}`,
    ipAddress,
    createdOnUtc: new Date().toISOString(),
  });
  return {
    blocked: true,
    rule: rule.id,
    reachedApplication: false,
    statusCode: 403,
    logId: logged.id,
    blockedBy: 'the WAF of the hosting or CDN provider',
    storeId,
  };
}

/** AC-SEC-002-01-03: the real client IP address behind the proxy. */
export async function clientIpAsync({
  forwardedFor = null, remoteAddress = null, storeId = 1,
}) {
  const header = await getSettingAsync('hostingconfig.forwardedforheadername', storeId, null);
  const knownProxies = await getSettingAsync('hostingconfig.knownproxies', storeId, null);
  const knownNetworks = await getSettingAsync('hostingconfig.knownnetworks', storeId, null);
  const configured = Boolean(header) && (Boolean(knownProxies) || Boolean(knownNetworks));
  const chain = (forwardedFor ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    forwardedForHeaderName: header ?? 'not configured',
    knownProxies: knownProxies ?? 'not configured',
    knownNetworks: knownNetworks ?? 'not configured',
    configured,
    recordedIpAddress: configured && chain.length ? chain[0] : remoteAddress,
    proxyAddress: remoteAddress,
    readBy: ['PRD-IAM-012', 'PRD-SEC-004'],
    note: configured
      ? 'the first address of the forwarded chain is the real client'
      : 'without these three the application records the proxy address',
  };
}

/** AC-SEC-002-03-01: the native ValidateIpAddress filter on the admin area. */
export async function adminIpCheckAsync({ ipAddress, storeId = 1 }) {
  const allowed = await getSettingAsync('securitysettings.adminareaallowedipaddresses', storeId, []);
  const list = Array.isArray(allowed) ? allowed : String(allowed).split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) {
    return { allowed: true, listEmpty: true, nativeFilter: 'ValidateIpAddress' };
  }
  const ok = list.includes(ipAddress);
  return {
    allowed: ok,
    ipAddress,
    allowList: list,
    statusCode: ok ? 200 : 403,
    nativeFilter: 'ValidateIpAddress',
    refusedBy: ok ? null : 'the native ValidateIpAddress filter',
  };
}

/** AC-SEC-002-03-02: the native honeypot. */
export async function honeypotAsync({ fields = {}, storeId = 1 }) {
  const enabled = await getSettingAsync('securitysettings.honeypotenabled', storeId, false);
  const fieldName = await getSettingAsync('securitysettings.honeypotinputname', storeId, 'hpinput');
  const logDetection = await getSettingAsync('securitysettings.loghoneypotdetection', storeId, false);
  if (enabled !== true) return { enabled: false, rejected: false };
  const filled = Boolean(fields[fieldName]);
  if (!filled) return { enabled: true, rejected: false, fieldName };
  let logged = null;
  if (logDetection === true) {
    logged = await logRepo().insertAsync({
      logLevel: 'Warning',
      shortMessage: 'Honeypot detection',
      fullMessage: `the hidden field ${fieldName} was filled`,
      createdOnUtc: new Date().toISOString(),
    });
  }
  return {
    enabled: true, rejected: true, fieldName, logged: Boolean(logged), logId: logged?.id ?? null, storeId,
  };
}

/* ======================================== the upload ownership and download filter ====== */

export const UPLOAD_ACTIONS = [
  'Nop.Web ShoppingCartController.UploadFileProductAttribute',
  'Nop.Web ShoppingCartController.UploadFileCheckoutAttribute',
  'Nop.Web ReturnRequestController.UploadFileReturnRequest',
];

/** AC-SEC-002-04-01: the recording filter. The type check is ADM-008's (BR-ADM-060). */
export async function recordUploadAsync({
  action, downloadGuid, customerId, productId = null, storeId = 1,
}) {
  if (!UPLOAD_ACTIONS.includes(action)) {
    return { ok: false, message: `that action is not one the filter covers`, actions: UPLOAD_ACTIONS };
  }
  const row = await ownershipRepo().insertAsync({
    downloadGuid,
    customerId: customerId ?? null,
    productId: action.includes('UploadFileProductAttribute') ? productId : null,
    action,
    createdOnUtc: new Date().toISOString(),
  });
  return {
    ok: true, ownership: row, typeCheckOwnedBy: 'PRD-ADM-008', rule: 'BR-SEC-005',
  };
}

export const ownershipsAsync = () => ownershipRepo().getAllAsync();
export const downloadProviders = () => providers('IC-SEC-05').map((p) => ({ feature: p.feature, name: p.name }));

async function denyAsync({
  downloadGuid, requester, area, reason, storeId,
}) {
  await auditAsync({
    event: 'AUD-SEC-012',
    area: 'SEC',
    feature: 'PRD-SEC-002',
    entity: 'Download',
    entityId: downloadGuid,
    actor: requester?.email ?? 'guest',
    outcome: 'rejected',
    after: { area, reason },
    storeId,
    note: 'file access refused by the download-ownership filter',
  });
  return {
    served: false,
    denied: true,
    messageKey: 'Sec.FileAccessDenied',
    message: resource('Sec.FileAccessDenied'),
    reason,
    auditEvent: 'AUD-SEC-012',
  };
}

/**
 * The one filter of BR-SEC-005, on both actions. AC-SEC-002-04-02, 04-03, 04-04 and 04-05.
 * Every claiming IC-SEC-05 provider must return Allow; a Deny refuses the file. With no claiming
 * provider the base rule applies.
 */
export async function evaluateDownloadAccessAsync({
  downloadGuid, requester = null, area = 'storefront', storeId = 1,
}) {
  const ownership = await ownershipRepo().getOneAsync((r) => r.downloadGuid === downloadGuid);
  const roles = requester?.roles ?? [];
  const isVendorUser = roles.includes('Vendors') || Boolean(requester?.vendorId);
  const mayViewOrders = requester ? await authorizeAsync('Orders.OrdersView', requester) : false;

  // IC-SEC-05: the providers that claim this file decide instead of the base rule
  const claims = await runProviders('IC-SEC-05', 'collect', {
    downloadGuid, requester, area, ownership, storeId,
  });
  const claiming = claims.filter((c) => c.result?.claimed === true);
  if (claiming.length) {
    const deny = claiming.find((c) => c.result.decision === 'Deny');
    if (deny) {
      return {
        ...await denyAsync({
          downloadGuid, requester, area, reason: deny.result.reason ?? `refused by ${deny.feature}`, storeId,
        }),
        decidedBy: deny.feature,
        providerDecision: true,
      };
    }
    return {
      served: true,
      decidedBy: claiming.map((c) => c.feature),
      providerDecision: true,
      filter: 'the single SEC download-ownership filter',
    };
  }

  if (area === 'admin') {
    // AC-SEC-002-04-04: a vendor user in admin gets only its own vendor's files
    if (isVendorUser) {
      const product = ownership?.productId
        ? await repository('Product').getByIdAsync(ownership.productId)
        : null;
      const ownProduct = product && Number(product.vendorId) === Number(requester.vendorId);
      const ownDownload = await repository('Product').getOneAsync((p) => Number(p.vendorId) === Number(requester.vendorId)
        && (p.downloadGuid === downloadGuid || p.sampleDownloadGuid === downloadGuid));
      if (!ownProduct && !ownDownload) {
        return denyAsync({
          downloadGuid, requester, area, reason: 'the file is not recorded for a product of this vendor', storeId,
        });
      }
      return { served: true, decidedBy: 'the vendor owns the product', filter: 'the single SEC download-ownership filter' };
    }
    if (!mayViewOrders) {
      return denyAsync({
        downloadGuid, requester, area, reason: 'Orders.OrdersView is required', storeId,
      });
    }
    return { served: true, decidedBy: 'a staff user holding Orders.OrdersView' };
  }

  // AC-SEC-002-04-03: a file uploaded before the plugin was installed has no ownership row
  if (!ownership) {
    if (mayViewOrders && !isVendorUser) {
      return { served: true, decidedBy: 'a staff user holding Orders.OrdersView', noOwnershipRow: true };
    }
    return {
      ...await denyAsync({
        downloadGuid, requester, area, reason: 'there is no ownership row for this file', storeId,
      }),
      noOwnershipRow: true,
    };
  }

  if (requester && Number(ownership.customerId) === Number(requester.id)) {
    return { served: true, decidedBy: 'the uploading customer' };
  }
  if (mayViewOrders && !isVendorUser) {
    return { served: true, decidedBy: 'a staff user holding Orders.OrdersView who is not a vendor user' };
  }
  if (isVendorUser && ownership.productId) {
    const product = await repository('Product').getByIdAsync(ownership.productId);
    if (product && Number(product.vendorId) === Number(requester.vendorId)) {
      return { served: true, decidedBy: 'a vendor user whose vendor owns the product' };
    }
  }
  return denyAsync({
    downloadGuid, requester, area, reason: 'the requester neither uploaded the file nor may see the order', storeId,
  });
}

/** AC-SEC-002-04-06: the type check belongs to ADM-008 and SEC adds none. */
export async function uploadTypeCheckAsync({
  fileName, contentType = null, bytes = Buffer.alloc(0), action, actor = 'customer',
}) {
  const { checkUploadAsync } = await import('../../product-adm/services/uploads.js');
  const result = await checkUploadAsync({
    action, fileName, contentType, bytes, actor,
  });
  return {
    ...result, checkedBy: 'PRD-ADM-008', secAddsNoCheck: true, rule: 'BR-ADM-060',
  };
}
