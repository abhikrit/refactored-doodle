// Mock external systems - decision P-3 of the handoff section 4.
//
// "45 external-system features -> Mock services with recorded sample payloads (one mock project),
// switchable to real sandboxes later (e.g. Safaricom Daraja sandbox)."
//
// Each adapter sits behind the interface the PRD names for it (nopCommerce IPaymentMethod,
// IShipmentTracker, ISmsProvider, or a PRD contract IC-...), so the real adapter replaces the
// mock without the callers changing. Nothing here reaches the network: every response comes from
// packages/mocks/payloads/*.json, which are shaped like the real provider's documented payloads.
//
// Each adapter has a health switch - healthy | slow | failing - driven from the admin Mocks
// console, so the prototype can demonstrate the failure paths the acceptance criteria describe.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PAYLOADS = join(HERE, '..', 'payloads');

const payloadCache = new Map();
function payload(name) {
  if (!payloadCache.has(name)) {
    const file = join(PAYLOADS, `${name}.json`);
    payloadCache.set(name, existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);
  }
  return structuredClone(payloadCache.get(name));
}

const state = new Map(); // systemName -> { health, latencyMs, calls: [] }

function ensure(systemName) {
  if (!state.has(systemName)) state.set(systemName, { health: 'healthy', latencyMs: 0, calls: [] });
  return state.get(systemName);
}

const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

/** Wrap an adapter call with the health switch and the call log. */
async function guarded(systemName, operation, request, handler) {
  const s = ensure(systemName);
  const started = Date.now();
  if (s.health === 'slow') await wait(s.latencyMs || 1500);
  let entry;
  try {
    if (s.health === 'failing') {
      const err = new Error(`${systemName} is unavailable (mock set to failing)`);
      err.code = 'MOCK_FAILING';
      throw err;
    }
    const response = await handler();
    entry = {
      systemName, operation, request, response, outcome: 'success', ms: Date.now() - started, at: new Date().toISOString(),
    };
    return response;
  } catch (err) {
    entry = {
      systemName, operation, request, error: err.message, outcome: 'failed', ms: Date.now() - started, at: new Date().toISOString(),
    };
    throw err;
  } finally {
    s.calls.unshift(entry);
    if (s.calls.length > 50) s.calls.pop();
  }
}

const ref = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

// ---------------------------------------------------------------- payments --
function paymentAdapter({
  systemName, name, kind, country, feature, interfaceName = 'IPaymentMethod',
  supportsGroupPayment = false, supportsRefund = true, capture = 'immediate', payloadName,
  requiresPhone = false, offlineAtCounter = false,
}) {
  return {
    systemName,
    name,
    kind,
    category: 'payment',
    country,
    feature,
    interfaceName,
    supportsGroupPayment,
    supportsRefund,
    capture,
    requiresPhone,
    offlineAtCounter,
    /** IPaymentMethod.ProcessPaymentAsync */
    async processPaymentAsync(request) {
      return guarded(systemName, 'ProcessPayment', request, async () => {
        const sample = payload(payloadName) ?? {};
        if (capture === 'push') {
          // A mobile-money STK push: the customer confirms on the handset. The prototype
          // returns Pending and the confirm step calls confirmPushAsync.
          return {
            status: 'Pending',
            providerRef: ref('STK-'),
            customerAction: 'Confirm the payment request on your phone with your PIN',
            raw: { ...sample.request, Amount: request.amount, PhoneNumber: request.phone },
          };
        }
        if (offlineAtCounter) {
          return {
            status: 'Pending',
            providerRef: ref('CASH-'),
            customerAction: 'Pay at the counter with this reference',
            raw: sample.request ?? null,
          };
        }
        return {
          status: 'Paid',
          providerRef: ref(`${systemName.slice(-4).toUpperCase()}-`),
          raw: sample.response ?? null,
        };
      });
    },
    /** Mobile-money callback: the handset confirmation (or its rejection). */
    async confirmPushAsync({ providerRef, accept = true }) {
      return guarded(systemName, 'Callback', { providerRef, accept }, async () => {
        const sample = payload(payloadName) ?? {};
        if (!accept) {
          return {
            status: 'Failed', providerRef, reason: 'Request cancelled by user', raw: sample.callbackCancelled ?? null,
          };
        }
        return {
          status: 'Paid', providerRef, receipt: ref('RCPT-'), raw: sample.callback ?? null,
        };
      });
    },
    async refundAsync({ providerRef, amount }) {
      return guarded(systemName, 'Refund', { providerRef, amount }, async () => ({
        status: 'Refunded', providerRef, refundRef: ref('RF-'),
      }));
    },
  };
}

// ---------------------------------------------------------------- carriers --
function carrierAdapter({
  systemName, name, country, feature, interfaceName = 'IShipmentTracker',
}) {
  return {
    systemName,
    name,
    category: 'carrier',
    country,
    feature,
    interfaceName,
    async createShipmentAsync(request) {
      return guarded(systemName, 'CreateShipment', request, async () => ({
        trackingNumber: systemName === 'MalawiPostNetwork' ? `MW${Math.floor(Math.random() * 1e9)}MW` : ref(`${systemName.slice(0, 3).toUpperCase()}`),
        labelUrl: `mock://label/${ref('L-')}.pdf`,
        service: request.service ?? 'Standard',
      }));
    },
    async trackAsync({ trackingNumber }) {
      return guarded(systemName, 'Track', { trackingNumber }, async () => {
        const sample = payload('carrier-tracking') ?? { events: [] };
        return { trackingNumber, events: sample.events };
      });
    },
  };
}

// ----------------------------------------------------- messaging and other --
function smsAdapter({ systemName, name, country, feature }) {
  return {
    systemName,
    name,
    category: 'messaging',
    country,
    feature,
    interfaceName: 'ISmsProvider',
    async sendAsync({ to, text, event }) {
      return guarded(systemName, 'SendSms', { to, event, text }, async () => ({
        status: 'sent', providerRef: ref('SMS-'), segments: Math.max(1, Math.ceil((text ?? '').length / 160)),
      }));
    },
  };
}

function channelAdapter({
  systemName, name, category, feature, interfaceName, operations = ['Send'],
}) {
  const adapter = {
    systemName, name, category, feature, interfaceName,
  };
  for (const op of operations) {
    adapter[`${op.charAt(0).toLowerCase()}${op.slice(1)}Async`] = async (request) => guarded(
      systemName,
      op,
      request,
      async () => ({ status: 'accepted', providerRef: ref(`${op.slice(0, 3).toUpperCase()}-`), echo: request }),
    );
  }
  adapter.sendAsync = adapter.sendAsync ?? (async (request) => guarded(systemName, 'Send', request, async () => ({ status: 'sent', providerRef: ref('MSG-') })));
  return adapter;
}

function fiscalAdapter({
  systemName, name, country, feature, decision,
}) {
  return {
    systemName,
    name,
    category: 'fiscal',
    country,
    feature,
    decision,
    interfaceName: 'IFiscalInvoiceAdapter (IC-PAY-11)',
    async submitInvoiceAsync(invoice) {
      return guarded(systemName, 'SubmitInvoice', invoice, async () => {
        const sample = payload(systemName === 'KRA-eTIMS' ? 'kra-etims' : 'mra-eis') ?? {};
        return {
          status: 'Accepted',
          fiscalNumber: ref(systemName === 'KRA-eTIMS' ? 'KRA-' : 'MRA-'),
          qr: `mock://fiscal-qr/${ref('')}`,
          raw: sample.response ?? null,
        };
      });
    },
  };
}

// ---------------------------------------------------------------- registry --
const adapters = [
  // Kenya payment rails (PAY-002, PAY-003, PAY-004, PAY-005, PAY-006, PAY-031)
  paymentAdapter({
    systemName: 'Payments.MPesa', name: 'M-Pesa (Safaricom Daraja)', kind: 'mobile-money', country: 'KE', feature: 'PRD-PAY-028', capture: 'push', payloadName: 'mpesa-stkpush', requiresPhone: true, supportsGroupPayment: true,
  }),
  paymentAdapter({
    systemName: 'Payments.KtdaBankGateway', name: 'KTDA bank card gateway (CBK-regulated bank, not named - KG-04)', kind: 'card', country: 'KE', feature: 'PRD-PAY-031', payloadName: 'card-gateway', supportsGroupPayment: true,
  }),
  paymentAdapter({
    systemName: 'Payments.Card', name: 'Card payments', kind: 'card', country: 'KE', feature: 'PRD-PAY-002', payloadName: 'card-gateway', supportsGroupPayment: true,
  }),
  paymentAdapter({
    systemName: 'Payments.PayPalStandard', name: 'PayPal', kind: 'wallet', country: 'KE', feature: 'PRD-PAY-003', payloadName: 'paypal',
  }),
  paymentAdapter({
    systemName: 'Payments.BankTransfer', name: 'Bank transfer', kind: 'offline', country: 'KE/MW', feature: 'PRD-PAY-005', capture: 'manual', payloadName: 'bank-transfer', offlineAtCounter: false,
  }),
  paymentAdapter({
    systemName: 'Payments.LetterOfCredit', name: 'Letter of credit', kind: 'offline', country: 'KE', feature: 'PRD-PAY-006', capture: 'manual', payloadName: 'bank-transfer',
  }),
  // Malawi payment rails (PAY-029, PAY-030, PAY-008, PAY-032)
  paymentAdapter({
    systemName: 'Payments.TnmMpamba', name: 'TNM Mpamba', kind: 'mobile-money', country: 'MW', feature: 'PRD-PAY-029', capture: 'push', payloadName: 'tnm-mpamba', requiresPhone: true, supportsGroupPayment: true,
  }),
  paymentAdapter({
    systemName: 'Payments.AirtelMoney', name: 'Airtel Money', kind: 'mobile-money', country: 'MW', feature: 'PRD-PAY-030', capture: 'push', payloadName: 'airtel-money', requiresPhone: true, supportsGroupPayment: true,
  }),
  paymentAdapter({
    systemName: 'Payments.CashAtOutlet', name: 'Cash at a post office', kind: 'offline', country: 'MW', feature: 'PRD-PAY-008', capture: 'counter', payloadName: 'cash-at-outlet', offlineAtCounter: true,
  }),
  paymentAdapter({
    systemName: 'Payments.CashOnDelivery', name: 'Cash on delivery', kind: 'offline', country: 'MW', feature: 'PRD-PAY-008', capture: 'on-delivery', payloadName: 'cash-at-outlet', offlineAtCounter: true,
  }),
  // Carriers (LOG-006, LOG-025 to LOG-031)
  carrierAdapter({
    systemName: 'DHL', name: 'DHL', country: 'KE', feature: 'PRD-LOG-006',
  }),
  carrierAdapter({
    systemName: 'FedEx', name: 'FedEx', country: 'KE', feature: 'PRD-LOG-025',
  }),
  carrierAdapter({
    systemName: 'G4S', name: 'G4S', country: 'KE', feature: 'PRD-LOG-026',
  }),
  carrierAdapter({
    systemName: 'Skynet', name: 'Skynet', country: 'KE', feature: 'PRD-LOG-027',
  }),
  carrierAdapter({
    systemName: 'WellsFargo', name: 'Wells Fargo (Kenya)', country: 'KE', feature: 'PRD-LOG-028',
  }),
  carrierAdapter({
    systemName: 'Aramex', name: 'Aramex', country: 'KE', feature: 'PRD-LOG-029',
  }),
  carrierAdapter({
    systemName: 'MalawiPostNetwork', name: 'Malawi Post network (outlets, hubs, last mile)', country: 'MW', feature: 'PRD-LOG-031',
  }),
  carrierAdapter({
    systemName: 'PostGlobal', name: 'PostGlobal', country: 'MW', feature: 'PRD-INT-007',
  }),
  // Fiscal e-invoicing (PAY-026, PAY-027) - decision E-INV
  fiscalAdapter({
    systemName: 'KRA-eTIMS', name: 'Kenya Revenue Authority eTIMS', country: 'KE', feature: 'PRD-PAY-026', decision: 'E-INV',
  }),
  fiscalAdapter({
    systemName: 'MRA-EIS', name: 'Malawi Revenue Authority EIS', country: 'MW', feature: 'PRD-PAY-027', decision: 'E-INV',
  }),
  // Messaging (CHN-005, CHN-006, CHN-013, TRK-005)
  smsAdapter({
    systemName: 'Sms.Gateway', name: 'SMS gateway', country: 'KE/MW', feature: 'PRD-CHN-005',
  }),
  channelAdapter({
    systemName: 'WhatsApp.Business', name: 'WhatsApp Business', category: 'messaging', feature: 'PRD-CHN-006', interfaceName: 'IChannelAdapter (IC-CHN-02)',
  }),
  channelAdapter({
    systemName: 'Email.Smtp', name: 'E-mail (SMTP)', category: 'messaging', feature: 'PRD-TRK-004', interfaceName: 'IEmailSender',
  }),
  channelAdapter({
    systemName: 'Push.Provider', name: 'Push notifications', category: 'messaging', feature: 'PRD-CHN-013', interfaceName: 'IPushProvider',
  }),
  channelAdapter({
    systemName: 'Ussd.Gateway', name: 'USSD gateway', category: 'channel', feature: 'PRD-CHN-003', interfaceName: 'IUssdGateway',
  }),
  // Back-office systems (INT-005 to INT-013)
  channelAdapter({
    systemName: 'SAGE200', name: 'SAGE 200', category: 'erp', feature: 'PRD-INT-006', interfaceName: 'IErpAdapter (IC-INT-05)', operations: ['PostJournal', 'SyncMasterData'],
  }),
  channelAdapter({
    systemName: 'MANEPS', name: 'MANEPS', category: 'payments-switch', feature: 'PRD-INT-013', interfaceName: 'IPaymentSwitchAdapter', operations: ['Settle'],
  }),
  channelAdapter({
    systemName: 'Bank.Statements', name: 'Bank statement feed', category: 'bank', feature: 'PRD-INT-008', interfaceName: 'IBankStatementAdapter', operations: ['FetchStatement'],
  }),
  channelAdapter({
    systemName: 'Identity.Registry', name: 'National ID / tax registry / MNO KYC', category: 'identity', feature: 'PRD-IAM-020', interfaceName: 'IIdentityVerificationAdapter', operations: ['Verify'],
  }),
  channelAdapter({
    systemName: 'Google.Services', name: 'Google services (maps, analytics, translate)', category: 'google', feature: 'PRD-LOG-015', interfaceName: 'IGeocodingAdapter', operations: ['Geocode'],
  }),
];

export const mockRegistry = Object.fromEntries(adapters.map((a) => [a.systemName, a]));

/** The payment methods active for a client, in the order the pack lists them. */
export function paymentMethodsFor(activeSystemNames) {
  return (activeSystemNames ?? [])
    .map((n) => mockRegistry[n])
    .filter(Boolean);
}

/** Channel gateways in the shape core/messages.js expects. */
export const messageGateways = {
  email: mockRegistry['Email.Smtp'],
  sms: mockRegistry['Sms.Gateway'],
  whatsapp: mockRegistry['WhatsApp.Business'],
  push: mockRegistry['Push.Provider'],
  inapp: {
    async sendAsync() { return { status: 'sent', providerRef: 'inapp' }; },
  },
};

export function mockStatus() {
  return adapters.map((a) => {
    const s = ensure(a.systemName);
    return {
      systemName: a.systemName,
      name: a.name,
      category: a.category,
      country: a.country ?? null,
      feature: a.feature,
      interfaceName: a.interfaceName,
      supportsGroupPayment: a.supportsGroupPayment ?? null,
      health: s.health,
      latencyMs: s.latencyMs,
      calls: s.calls.length,
      lastCall: s.calls[0] ?? null,
      payloads: existsSync(PAYLOADS) ? readdirSync(PAYLOADS).filter((f) => f.endsWith('.json')).length : 0,
    };
  });
}

export function setMockHealth(systemName, health, latencyMs = 1500) {
  if (!mockRegistry[systemName]) throw new Error(`unknown mock ${systemName}`);
  if (!['healthy', 'slow', 'failing'].includes(health)) throw new Error(`health must be healthy | slow | failing`);
  const s = ensure(systemName);
  s.health = health;
  s.latencyMs = latencyMs;
  return { systemName, health, latencyMs };
}

export function mockCalls(systemName) {
  return systemName ? ensure(systemName).calls : adapters.flatMap((a) => ensure(a.systemName).calls)
    .sort((x, y) => y.at.localeCompare(x.at)).slice(0, 100);
}

export function resetMocks() {
  state.clear();
}
