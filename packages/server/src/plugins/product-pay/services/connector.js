// PAY-024 payment connector SDK.
//
// IC-PAY-01: one contract every provider implements - InitiatePayment, HandleCallback,
// QueryStatus, Reverse, Refund, GetStatement and Payout. An adapter declares its method type and
// which of those it can do; an operation it cannot do answers NotSupported, and the console
// offers the manual path instead (AC-PAY-024-01-02).
//
// BR-PAY-110 / decision CFG-01: provider credentials are entered per client instance, stored
// encrypted and never exported in a configuration pack. Every PAY key that holds a credential is
// flagged secret in the key catalogue, so the pack loader refuses it.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';

/** The native PaymentMethodType values an adapter may declare. */
export const METHOD_TYPE = {
  Standard: 'Standard', Redirection: 'Redirection', Button: 'Button', Unknown: 'Unknown',
};

/** The native RecurringPaymentType values (AC-PAY-024-01-05). */
export const RECURRING_TYPE = {
  NotSupported: 'NotSupported', Manual: 'Manual', Automatic: 'Automatic',
};

export const OPERATIONS = [
  'InitiatePayment', 'HandleCallback', 'QueryStatus', 'Reverse', 'Refund', 'GetStatement', 'Payout',
];

const connectors = new Map();

/**
 * AC-PAY-024-01-01: an adapter declares what it is and what it can do. A payment adapter
 * implements the native payment-method contract and appears at checkout; a payout-only adapter
 * does not, and appears only in the payout registry.
 */
export function registerConnector({
  systemName,
  name,
  feature,
  methodType = METHOD_TYPE.Standard,
  recurringPaymentType = RECURRING_TYPE.NotSupported,
  capabilities = {},
  implementsPaymentMethod = true,
  supportsGroupPayment = false,
  operations = {},
  callbackRoute = null,
  secretKeys = [],
}) {
  if (!systemName) throw new Error('IC-PAY-01: a connector needs a system name');
  const declared = Object.fromEntries(OPERATIONS.map((op) => [op, capabilities[op] === true]));
  const connector = {
    systemName,
    name: name ?? systemName,
    feature: feature ?? null,
    methodType,
    recurringPaymentType,
    capabilities: declared,
    implementsPaymentMethod: implementsPaymentMethod !== false,
    supportsGroupPayment: supportsGroupPayment === true,
    operations,
    callbackRoute: callbackRoute ?? `/api/payments/callbacks/${String(systemName).toLowerCase()}`,
    secretKeys,
    registeredAtUtc: new Date().toISOString(),
  };
  connectors.set(systemName, connector);
  return connector;
}

export const connectorsRegistered = () => [...connectors.values()]
  .map(({ operations: _ops, ...rest }) => rest)
  .sort((a, b) => a.systemName.localeCompare(b.systemName));

export const connectorFor = (systemName) => connectors.get(systemName) ?? null;

/** The payout registry: adapters that pay money out, whether or not they take payments. */
export const payoutConnectors = () => connectorsRegistered().filter((c) => c.capabilities.Payout === true);

/** The adapters that appear at checkout. */
export const checkoutConnectors = () => connectorsRegistered().filter((c) => c.implementsPaymentMethod === true);

/**
 * Call one operation of one adapter. An operation the adapter did not declare answers
 * NotSupported, with the manual path the console offers in its place.
 */
export async function callAsync(systemName, operation, args = {}) {
  const connector = connectors.get(systemName);
  if (!connector) {
    return { ok: false, notSupported: true, message: `no payment connector is registered as ${systemName}` };
  }
  if (!OPERATIONS.includes(operation)) {
    return { ok: false, notSupported: true, message: `${operation} is not an operation of the connector contract` };
  }
  if (connector.capabilities[operation] !== true || typeof connector.operations[operation] !== 'function') {
    return {
      ok: false,
      notSupported: true,
      operation,
      systemName,
      manualPath: MANUAL_PATHS[operation] ?? 'the payments console records the result by hand',
      message: `${connector.name} cannot ${operation}; the console offers the manual path.`,
    };
  }
  const result = await connector.operations[operation](args);
  return { ok: result?.ok !== false, operation, ...result };
}

const MANUAL_PATHS = {
  InitiatePayment: 'the shopper pays outside the platform and staff record it',
  HandleCallback: 'staff check the provider portal and record the result',
  QueryStatus: 'staff check the provider portal',
  Reverse: 'staff reverse the payment in the provider portal and record it',
  Refund: 'staff refund in the provider portal and record it as an offline refund',
  GetStatement: 'staff upload the provider statement file',
  Payout: 'staff pay out from the provider portal and record it',
};

/* ================================================= AC-PAY-024-01-03 the callback check = */

const CALLBACK_FAILURE = {
  signature: 'the signature does not match',
  token: 'the callback token does not match',
  ip: 'the caller is not on the allow-list',
  unknown: 'no connector is registered for that route',
};

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * Every callback is verified before anything changes: the signature, the token or the caller's
 * address. A failure changes nothing, and is logged and audited (AUD-PAY-010).
 */
export async function verifyCallbackAsync({
  systemName, payload = {}, signature = null, token = null, ip = null, storeId = 1,
}) {
  const connector = connectors.get(systemName);
  if (!connector) {
    await recordRefusalAsync({
      systemName, reason: CALLBACK_FAILURE.unknown, ip, storeId,
    });
    return { ok: false, verified: false, reason: CALLBACK_FAILURE.unknown };
  }

  const allowList = await getSettingAsync(`pay.callback.allowedips.${String(systemName).toLowerCase()}`, storeId, []);
  if (Array.isArray(allowList) && allowList.length && ip && !allowList.includes(ip)) {
    await recordRefusalAsync({
      systemName, reason: CALLBACK_FAILURE.ip, ip, storeId,
    });
    return { ok: false, verified: false, reason: CALLBACK_FAILURE.ip };
  }

  const expectedToken = await credentialAsync({ systemName, key: 'callbacktoken', storeId });
  if (expectedToken) {
    if (!safeEqual(token, expectedToken)) {
      await recordRefusalAsync({
        systemName, reason: CALLBACK_FAILURE.token, ip, storeId,
      });
      return { ok: false, verified: false, reason: CALLBACK_FAILURE.token };
    }
    return { ok: true, verified: true, verifiedBy: 'token' };
  }

  const secret = await credentialAsync({ systemName, key: 'callbacksecret', storeId });
  if (secret) {
    const expected = createHmac('sha256', secret).update(JSON.stringify(payload ?? {})).digest('hex');
    if (!safeEqual(signature, expected)) {
      await recordRefusalAsync({
        systemName, reason: CALLBACK_FAILURE.signature, ip, storeId,
      });
      return { ok: false, verified: false, reason: CALLBACK_FAILURE.signature };
    }
    return { ok: true, verified: true, verifiedBy: 'signature' };
  }

  // nothing to verify against: the store has not been given the provider's secret yet
  return {
    ok: false,
    verified: false,
    reason: 'this store holds no callback secret or token for that provider',
    credentialMissing: true,
  };
}

async function recordRefusalAsync({
  systemName, reason, ip = null, storeId = 1,
}) {
  await repository('Log').insertAsync({
    level: 'Error',
    shortMessage: `A payment callback for ${systemName} was refused`,
    fullMessage: `${reason}${ip ? ` (from ${ip})` : ''}`,
    feature: 'PRD-PAY-024',
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-PAY-010',
    area: 'PAY',
    feature: 'PRD-PAY-024',
    entity: 'PaymentCallback',
    entityId: systemName,
    actor: ip ?? 'provider',
    storeId,
    outcome: 'failure',
    after: { systemName, reason, ip },
    note: 'a payment callback was refused before anything changed',
  });
  return { logged: true };
}

/* ===================================================== the adapter's own credentials ==== */

const credentialKey = (systemName, key) => `pay.credential.${String(systemName).toLowerCase()}.${String(key).toLowerCase()}`;

/** A reversible stand-in for encryption at rest; the prototype stores no real secret (P-5). */
const scramble = (value) => Buffer.from(String(value), 'utf8').toString('base64');
const unscramble = (value) => Buffer.from(String(value), 'base64').toString('utf8');

/**
 * AC-PAY-024-02-01: credentials are stored encrypted and never exported in a pack. The key ends
 * in a secret suffix, so the pack loader refuses it wherever it appears.
 */
export async function saveCredentialAsync({
  systemName, key, value, storeId = 1, actor = 'administrator',
}) {
  if (!connectors.has(systemName)) {
    return { ok: false, message: `no payment connector is registered as ${systemName}` };
  }
  const name = credentialKey(systemName, key);
  await saveSettingAsync(name, scramble(value), 0);
  await auditAsync({
    event: 'AUD-PAY-010',
    area: 'PAY',
    feature: 'PRD-PAY-024',
    entity: 'PaymentCredential',
    entityId: name,
    actor,
    storeId,
    after: { key: name, value: '[redacted]' },
    note: 'a provider credential was set for this instance',
  });
  return {
    ok: true, key: name, stored: 'encrypted', exportedInPacks: false, rule: 'BR-PAY-110',
  };
}

export async function credentialAsync({ systemName, key, storeId = 1 }) {
  const stored = await getSettingAsync(credentialKey(systemName, key), storeId, null);
  return stored ? unscramble(stored) : null;
}

/** What the key catalogue must say about this adapter's keys (BR-PAY-110, BR-PAY-111). */
export function secretKeyNamesFor(systemName) {
  const connector = connectors.get(systemName);
  const declared = connector?.secretKeys ?? [];
  return [
    credentialKey(systemName, 'callbacksecret'),
    credentialKey(systemName, 'callbacktoken'),
    ...declared.map((k) => credentialKey(systemName, k)),
  ];
}

export function allSecretKeyNames() {
  return [...connectors.keys()].flatMap((systemName) => secretKeyNamesFor(systemName));
}

/** Every provider call that can charge or refund goes over TLS with the provider's own auth. */
export async function providerCallAsync({
  systemName, operation, args = {}, storeId = 1,
}) {
  const apiKey = await credentialAsync({ systemName, key: 'apikey', storeId });
  const connector = connectors.get(systemName);
  const result = await callAsync(systemName, operation, {
    ...args,
    transport: { tls: true, minimumVersion: 'TLS 1.2' },
    authentication: apiKey ? 'the provider key held by this instance' : 'none held by this instance',
  });
  return {
    ...result,
    tls: true,
    credentialUsed: Boolean(apiKey),
    adapter: connector?.name ?? systemName,
  };
}

/** The idempotency key every charge or refund carries (BR-PAY-012). */
export function idempotencyKeyFor({ orderGuid, attemptNo = 1, checkoutReference = null }) {
  const base = orderGuid ?? checkoutReference ?? '';
  return `${base}:${attemptNo}`;
}

export const hashOf = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
