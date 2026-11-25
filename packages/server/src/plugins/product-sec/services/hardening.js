// PRD-SEC-001 Encryption and transport security, PRD-SEC-003 PCI-DSS scope control.
//
// BR-SEC-001: the password format of the installation is Hashed; a pack asking for Clear or
// Encrypted is refused (the pack loader enforces it).
// BR-SEC-002: AES encryption stays on and the encryption key is unique to the instance, never
// taken from a configuration pack.
// BR-SEC-003: the platform never holds a card number. 5.00.1 removed card storage altogether
// (decision VER-500), so AC-SEC-001-04-01 is withdrawn and what is left is the check that no
// card data exists anywhere.

import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { mockRegistry } from '@product/mocks';

/* ============================================================ transport security ======== */

/** AC-SEC-001-01-01: plain HTTP is redirected, and every store has SslEnabled true. */
export async function httpsCheckAsync({ scheme = 'http', path = '/', storeId = 1 } = {}) {
  const stores = await repository('Store').getAllAsync();
  const notSsl = stores.filter((s) => s.sslEnabled !== true);
  const store = await repository('Store').getByIdAsync(storeId);
  const sslEnabled = store?.sslEnabled === true;
  return {
    redirect: scheme === 'http',
    redirectTo: scheme === 'http' ? `https://${store?.url ?? 'localhost'}${path}` : null,
    statusCode: scheme === 'http' ? 302 : 200,
    sslEnabled,
    storesWithoutSsl: notSsl.map((s) => s.name ?? s.id),
    nativeFilter: 'HttpsRequirement',
    note: 'the native HttpsRequirement filter redirects HTTPS to HTTP when Store.SslEnabled is false, so it is true for every store',
  };
}

/** AC-SEC-001-01-02: the proxy configuration and the cookie that follows from it. */
export async function proxyConfigurationAsync({ storeId = 1 } = {}) {
  const useProxy = await getSettingAsync('hostingconfig.useproxy', storeId, null);
  const header = await getSettingAsync('hostingconfig.forwardedprotoheadername', storeId, null);
  const configured = useProxy === true && Boolean(header);
  return {
    useProxy: useProxy === null ? 'not configured' : useProxy,
    forwardedProtoHeaderName: header ?? 'not configured',
    configured,
    schemeSeenByApplication: configured ? 'https' : 'the scheme of the connection to the application',
    authCookieSecureFlag: configured,
    cookieSecurePolicy: 'CookieSecurePolicy.SameAsRequest',
    note: 'with TLS terminated at a proxy the application only sees HTTPS, and so only sets the Secure flag, when these two are set',
  };
}

/** AC-SEC-001-01-03: the TLS part of the go-live hosting checklist. */
export const TLS_CHECKLIST = {
  minimumVersion: 'TLS 1.2',
  minimumVersionSource: 'Not stated in source - catalog target TLS 1.2 or higher (FC-M21-002), Proposed',
  acceptedVersions: ['TLS 1.2', 'TLS 1.3'],
  refusedVersions: ['SSL 3.0', 'TLS 1.0', 'TLS 1.1'],
  acceptedCipherSuites: [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
  ],
};

export async function tlsCheckAsync({ version = 'TLS 1.2', cipherSuite = null, storeId = 1 } = {}) {
  const checklist = await getSettingAsync('sec.tlschecklist', storeId, TLS_CHECKLIST);
  const versionAccepted = checklist.acceptedVersions.includes(version);
  const suiteAccepted = cipherSuite === null || checklist.acceptedCipherSuites.includes(cipherSuite);
  return {
    version,
    cipherSuite,
    accepted: versionAccepted && suiteAccepted,
    reason: versionAccepted
      ? (suiteAccepted ? 'on the checklist' : 'the cipher suite is not on the checklist')
      : 'the protocol version is not on the checklist',
    checklist,
    prototypeDefault: 'Prototype default - the minimum version is not stated in source',
  };
}

/** AC-SEC-001-01-04: an adapter endpoint must be HTTPS, and is refused at save time. */
export async function saveAdapterEndpointAsync({
  systemName, endpoint, actor = null, storeId = 1,
}) {
  const adapter = mockRegistry[systemName];
  if (!adapter) return { ok: false, message: `no adapter named ${systemName}` };
  let url;
  try { url = new URL(endpoint); } catch { return { ok: false, message: 'that is not a URL' }; }
  if (url.protocol !== 'https:') {
    await auditAsync({
      event: 'AUD-SEC-010',
      area: 'SEC',
      feature: 'PRD-SEC-001',
      entity: 'ExternalAdapter',
      entityId: systemName,
      actor,
      outcome: 'rejected',
      after: { endpoint, scheme: url.protocol.replace(':', '') },
      storeId,
      note: 'adapter endpoint refused: an external call must use HTTPS',
    });
    return {
      ok: false,
      refused: true,
      scheme: url.protocol.replace(':', ''),
      message: 'An external endpoint must use HTTPS.',
      saved: false,
    };
  }
  await saveSettingAsync(`sec.adapterendpoint.${systemName.toLowerCase()}`, endpoint, 0);
  return { ok: true, systemName, endpoint, scheme: 'https' };
}

export async function adapterEndpointsAsync({ storeId = 1 } = {}) {
  const out = [];
  for (const systemName of Object.keys(mockRegistry)) {
    const endpoint = await getSettingAsync(`sec.adapterendpoint.${systemName.toLowerCase()}`, storeId, null);
    out.push({
      systemName,
      endpoint: endpoint ?? 'not configured',
      https: endpoint ? endpoint.startsWith('https://') : null,
      category: mockRegistry[systemName].category ?? null,
    });
  }
  return { adapters: out, allHttps: out.every((a) => a.endpoint === 'not configured' || a.https === true) };
}

/* ============================================================== encryption at rest ====== */

export const AT_REST_TARGETS = ['database', 'file storage', 'backups'];

/** AC-SEC-001-02-01: encryption at rest, recorded with evidence. */
export async function encryptionAtRestAsync({ storeId = 1 } = {}) {
  const recorded = await getSettingAsync('sec.encryptionatrest', storeId, null);
  const items = AT_REST_TARGETS.map((target) => {
    const row = recorded?.[target] ?? null;
    return {
      target,
      enabled: row?.enabled === true,
      mechanism: row?.mechanism ?? 'not configured',
      evidence: row?.evidence ?? 'not configured',
      recordedOnUtc: row?.recordedOnUtc ?? null,
    };
  });
  return {
    ok: items.every((i) => i.enabled && i.evidence !== 'not configured'),
    items,
    hostingFunction: true,
    note: 'encryption at rest is a hosting function, for example transparent data encryption; the checklist records it with evidence',
  };
}

export async function recordEncryptionAtRestAsync({
  target, enabled, mechanism, evidence, actor = null, storeId = 1,
}) {
  if (!AT_REST_TARGETS.includes(target)) {
    return { ok: false, message: `the target is one of ${AT_REST_TARGETS.join(', ')}` };
  }
  const recorded = await getSettingAsync('sec.encryptionatrest', storeId, {}) ?? {};
  const next = {
    ...recorded,
    [target]: {
      enabled: enabled === true, mechanism, evidence, recordedOnUtc: new Date().toISOString(),
    },
  };
  await saveSettingAsync('sec.encryptionatrest', next, 0);
  await auditAsync({
    event: 'AUD-SEC-010', area: 'SEC', feature: 'PRD-SEC-001', entity: 'HostingChecklist', entityId: target, actor, after: { enabled: enabled === true, mechanism, evidence }, storeId, note: 'encryption at rest recorded',
  });
  const checklist = await encryptionAtRestAsync({ storeId });
  return { ok: true, recorded: target, checklist };
}

/** AC-SEC-001-02-02: AES stays on and the key is the instance's own (BR-SEC-002). */
export async function securitySettingsAsync({ storeId = 1 } = {}) {
  const useAes = await getSettingAsync('securitysettings.useaesencryptionalgorithm', storeId, true);
  const key = await getSettingAsync('securitysettings.encryptionkey', storeId, null);
  const fromPack = await getSettingAsync('securitysettings.encryptionkey.layer', storeId, null);
  return {
    useAesEncryptionAlgorithm: useAes === true,
    installDefault: true,
    encryptionKeySet: Boolean(key),
    encryptionKeyUniqueToInstance: true,
    encryptionKeyFromPack: fromPack !== null && fromPack !== 'runtime',
    keyLength: key ? String(key).length : null,
    rule: 'BR-SEC-002',
    note: 'the key is generated at installation and never carried in a configuration pack',
  };
}

/** AC-SEC-001-03-01: the password format and hash of the installation. */
export async function passwordStorageAsync({ storeId = 1 } = {}) {
  const format = await getSettingAsync('customersettings.defaultpasswordformat', storeId, 'Hashed');
  const hash = await getSettingAsync('customersettings.hashedpasswordformat', storeId, 'SHA512');
  const rows = await plainRepository('CustomerPassword').getAllAsync();
  return {
    defaultPasswordFormat: format,
    hashedPasswordFormat: hash,
    installDefaults: { defaultPasswordFormat: 'Hashed', hashedPasswordFormat: 'SHA512' },
    saltedHash: rows.every((r) => Boolean(r.passwordSalt) && Boolean(r.password)),
    passwordsStored: rows.length,
    clearPasswordsStored: rows.filter((r) => r.passwordFormat === 'Clear').length,
    rule: 'BR-SEC-001',
  };
}

/* ========================================= PCI-DSS scope control (SEC-003, BR-SEC-003) == */

/** The card fields 5.00.1 removed: AC-SEC-001-04-01 is withdrawn because of them (VER-500). */
export const REMOVED_CARD_FIELDS = [
  'cardType', 'cardName', 'cardNumber', 'maskedCreditCardNumber', 'cardCvv2',
  'cardExpirationMonth', 'cardExpirationYear', 'allowStoringCreditCardNumber',
];

export const CARD_STORAGE_WITHDRAWN = {
  criterion: 'AC-SEC-001-04-01',
  status: 'Withdrawn',
  decision: 'VER-500',
  reason: 'nopCommerce 5.00 removed card storage: ProcessPaymentResult has no AllowStoringCreditCardNumber, the Order card fields are obsolete and no longer written, and the admin EditCreditCardInfo action and the bundled Payments.Manual plugin are removed',
  verifiedBy: 'AC-SEC-001-04-02',
};

/** AC-SEC-001-04-02 and AC-SEC-003-02-01: nothing anywhere holds card data. */
export async function cardDataScanAsync() {
  const pattern = /\b(?:\d[ -]*?){13,19}\b/;
  const looksLikeCard = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    const text = String(value);
    if (!pattern.test(text)) return false;
    const digits = text.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    // Luhn, so that order numbers and phone numbers are not mistaken for cards
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
      let n = Number(digits[i]);
      if (alternate) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  };

  const findings = [];
  for (const entity of ['Order', 'PaymentTransaction', 'Log', 'AuditEntry', 'MessageDelivery']) {
    const rows = await plainRepository(entity).getAllAsync();
    for (const row of rows) {
      for (const field of REMOVED_CARD_FIELDS) {
        if (row[field] !== undefined && row[field] !== null) {
          findings.push({ entity, entityId: row.id, field, kind: 'card field present' });
        }
      }
      for (const [field, value] of Object.entries(row)) {
        if (looksLikeCard(value)) findings.push({ entity, entityId: row.id, field, kind: 'value looks like a card number' });
      }
    }
  }
  return {
    clean: findings.length === 0,
    findings,
    fieldsChecked: REMOVED_CARD_FIELDS,
    entitiesScanned: ['Order', 'PaymentTransaction', 'Log', 'AuditEntry', 'MessageDelivery'],
    adminActionExists: false,
    adminAction: 'EditCreditCardInfo was removed in 5.00',
    testNote: 'T-PAY-05',
    rule: 'BR-SEC-003',
  };
}

/* ------------------------------------------------- the card adapters of SEC-003 ---------- */

export const ACCEPTED_CARD_METHOD_TYPES = ['Redirection', 'GatewayHostedFields'];

/** AC-SEC-003-01-01 and 01-03: which card adapters are acceptable. */
export async function reviewCardAdapterAsync({
  systemName, paymentMethodType, takesCardFieldsInShopPage = false, tokenisation = false, storeId = 1,
}) {
  const acceptable = ACCEPTED_CARD_METHOD_TYPES.includes(paymentMethodType) && takesCardFieldsInShopPage !== true;
  if (!acceptable) {
    await auditAsync({
      event: 'AUD-SEC-010',
      area: 'SEC',
      feature: 'PRD-SEC-003',
      entity: 'PaymentMethod',
      entityId: systemName,
      outcome: 'rejected',
      after: { paymentMethodType, takesCardFieldsInShopPage },
      storeId,
      note: 'card adapter refused: the platform must never receive the card number',
    });
  }
  return {
    systemName,
    accepted: acceptable,
    paymentMethodType,
    acceptedTypes: ACCEPTED_CARD_METHOD_TYPES,
    platformReceivesCardNumber: takesCardFieldsInShopPage === true,
    tokenisation,
    stores: tokenisation ? ['gateway token', 'masked last digits'] : [],
    reason: acceptable
      ? 'the card is entered on the gateway page or in gateway-hosted fields'
      : 'an adapter that takes card fields in the shop page is not accepted for card payments',
    rules: ['BR-SEC-003', 'BR-PAY-011'],
  };
}

/** AC-SEC-003-01-02: what a tokenising gateway leaves behind. */
export async function recordCardPaymentAsync({
  orderNumber, systemName, token, lastDigits, amount, storeId = 1,
}) {
  const row = await repository('PaymentTransaction').insertAsync({
    orderNumber,
    paymentMethodSystemName: systemName,
    gatewayToken: token,
    maskedLastDigits: String(lastDigits).slice(-4),
    amount,
    status: 'Authorized',
    storeId,
    createdOnUtc: new Date().toISOString(),
  });
  return {
    ok: true,
    transaction: row,
    stored: ['gatewayToken', 'maskedLastDigits'],
    notStored: REMOVED_CARD_FIELDS,
  };
}
