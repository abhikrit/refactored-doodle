// Product.PAY - Payments, tax, settlement and reconciliation
// Spec: docs/prd/modules/PRD-PAY.md
//
// Batch A builds the spine: PAY-024 the connector SDK (IC-PAY-01), PAY-001 the method framework
// and routing rules (BR-PAY-001, BR-PAY-002), PAY-011 the transaction lifecycle (SM-PAY-01,
// BR-PAY-010) and PAY-012 idempotency (BR-PAY-012). Every rail is a mock (P-3). PAY owns
// IPaymentService; the native order PaymentStatus is written only by the CHK-003
// IOrderProcessingService host (OVR-REG).

import { Router } from 'express';
import { mockRegistry } from '@product/mocks';
import { definePlugin } from '../../core/plugin-host.js';
import { declareSettingKeys } from '../../core/pack-loader.js';
import { authorizeAsync } from '../../core/permissions.js';
import { registerPlacementParticipant } from '../product-chk/services/validation.js';
import { registerEventCodeAsync } from '../product-trk/services/notifications.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';
import {
  registerConnector, connectorsRegistered, payoutConnectors, checkoutConnectors, verifyCallbackAsync,
  saveCredentialAsync, allSecretKeyNames, secretKeyNamesFor, callAsync, METHOD_TYPE, RECURRING_TYPE,
  OPERATIONS,
} from './services/connector.js';
import {
  methodsForCheckoutAsync, methodAdminListAsync, saveRuleAsync, setRuleActiveAsync, rulesAsync,
  setMethodActiveAsync, registerRoutingValidator, locationTypeAsync,
} from './services/routing.js';
import {
  linkSubOrderAsync, applyCallbackAsync, retryAsync, paymentStatusAsync, transactionsAsync,
  exceptionsAsync, unlinkedSharesAsync, hasSuccessfulOrAuthorizedTransactionAsync,
  postProcessPaymentAsync, SM_PAY_01, NATIVE_PAYMENT_STATUS,
} from './services/transactions.js';
import { confirmPushAsync, markPaidOfflineAsync } from './services/payments.js';

/**
 * AC-PAY-024-01-01: each adapter declares its PaymentMethodType, its RecurringPaymentType and a
 * capability flag per operation. The flags below follow what each mock rail can actually do: an
 * offline rail has no provider callback, status query, reversal or refund API, so those come back
 * NotSupported and the console offers the manual path (AC-PAY-024-01-02).
 */
function registerPaymentConnectors() {
  const registered = [];
  for (const adapter of Object.values(mockRegistry)) {
    if (adapter.category !== 'payment') continue;
    const offline = adapter.kind === 'offline';
    const methodType = adapter.kind === 'wallet' ? METHOD_TYPE.Redirection : METHOD_TYPE.Standard;
    registered.push(registerConnector({
      systemName: adapter.systemName,
      name: adapter.name,
      feature: adapter.feature,
      methodType,
      // AC-PAY-024-01-05: a mobile-money or card adapter holds its own provider token, so it can
      // charge a recurring order with no stored card data; an offline rail cannot.
      recurringPaymentType: offline || methodType === METHOD_TYPE.Redirection
        ? RECURRING_TYPE.NotSupported
        : RECURRING_TYPE.Manual,
      supportsGroupPayment: adapter.supportsGroupPayment === true,
      implementsPaymentMethod: true,
      capabilities: {
        InitiatePayment: true,
        HandleCallback: !offline,
        QueryStatus: !offline,
        Reverse: !offline,
        Refund: !offline && adapter.supportsRefund !== false,
        GetStatement: false,
        Payout: false,
      },
      secretKeys: ['apikey'],
      operations: {
        InitiatePayment: (args) => adapter.processPaymentAsync(args),
        HandleCallback: (args) => adapter.confirmPushAsync(args),
        QueryStatus: async ({ providerRef }) => ({ ok: true, providerRef, status: 'unchanged' }),
        Reverse: (args) => adapter.refundAsync(args),
        Refund: (args) => adapter.refundAsync(args),
      },
    }));
  }

  // A payout-only adapter: the Malawi payments switch settles money out, implements no
  // IPaymentMethod and so appears only in the payout registry (AC-PAY-024-01-01).
  const switchAdapter = mockRegistry.MANEPS;
  if (switchAdapter) {
    registered.push(registerConnector({
      systemName: switchAdapter.systemName,
      name: switchAdapter.name,
      feature: switchAdapter.feature,
      methodType: METHOD_TYPE.Unknown,
      implementsPaymentMethod: false,
      capabilities: { Payout: true },
      secretKeys: ['apikey'],
      operations: { Payout: (args) => switchAdapter.settleAsync(args) },
    }));
  }
  const statements = mockRegistry['Bank.Statements'];
  if (statements) {
    registered.push(registerConnector({
      systemName: statements.systemName,
      name: statements.name,
      feature: statements.feature,
      methodType: METHOD_TYPE.Unknown,
      implementsPaymentMethod: false,
      capabilities: { GetStatement: true },
      secretKeys: ['apikey'],
      operations: { GetStatement: (args) => statements.fetchStatementAsync(args) },
    }));
  }
  return registered;
}

export default definePlugin({
  area: 'PAY',
  startupOrder: 3210,
  async install(ctx) {
    ctx.providers.claimOverride('IPaymentService', {
      owner: 'Product.PAY',
      feature: 'PRD-PAY-001',
      startupOrder: 3210,
      note: 'Payment method offer and routing rules (PAY-001, PAY-024). Order payment status is written only by the CHK-003 IOrderProcessingService host (BR-PAY-010).',
    });

    const connectors = registerPaymentConnectors();

    // IC-PAY-03, consumed by CHK-003 as IC-CHK-02: the routing check runs again on the final
    // cart before payment (AC-PAY-001-03-03).
    registerRoutingValidator();

    // IC-CHK-06 Confirm only (BR-PAY-014): one payment is taken for the checkout and each
    // sub-order is linked to that group transaction as it is saved (AC-PAY-011-04-07).
    registerPlacementParticipant({
      area: 'PAY',
      feature: 'PRD-PAY-011',
      name: 'group payment link',
      lockKey: () => null,
      fn: async ({ phase, order, storeId }) => {
        if (phase !== 'Confirm' || !order) return { ok: true };
        return linkSubOrderAsync({ order, storeId });
      },
    });

    // BR-PAY-160 / section 13: the payment-pending and payment-failed notifications are PAY
    // event codes registered with TRK-005 (IC-TRK-04); their text is the section 11.2 resource.
    registerEventCodeAsync({
      code: 'Pay.Status.Pending',
      owningModule: 'Product.PAY',
      feature: 'PRD-PAY-011',
      category: 'Payments',
      defaultChannels: ['inapp'],
      content: {
        inapp: 'Your payment is being confirmed. You will receive a message when it completes.',
        sms: 'Your payment is being confirmed. You will receive a message when it completes.',
      },
    });
    registerEventCodeAsync({
      code: 'Pay.Status.Failed',
      owningModule: 'Product.PAY',
      feature: 'PRD-PAY-011',
      category: 'Payments',
      defaultChannels: ['inapp'],
      content: {
        inapp: 'Your payment did not go through. You can try again or choose another method.',
        sms: 'Your payment did not go through. You can try again or choose another method.',
      },
    });

    // BR-PAY-111: every PAY key is in the key catalogue. BR-PAY-110: a key that holds a
    // credential is flagged secret, so the pack loader refuses it (AC-PAY-024-02-02).
    // BR-PAY-170 / AC-PAY-011-01-02: the native pending-order reminder and the native automatic
    // cancellation are turned off for every pack unless the client pack states otherwise.
    declareSettingKeys({
      owner: 'Product.PAY',
      prefixes: ['pay.'],
      keys: [
        'paymentsettings.activepaymentmethodsystemnames',
        'paymentsettings.allowrepostingpayments',
        'paymentsettings.regenerateorderguidinterval',
        'remindersettings.pendingordersenabled',
        'ordersettings.autocancelenabled',
        'ordersettings.autocanceldelay',
        'ordersettings.autocancelignoredpaymentmethods',
      ],
      secretKeys: allSecretKeyNames(),
      packDefaults: {
        'remindersettings.pendingordersenabled': {
          value: false,
          rule: 'BR-PAY-170 / AC-PAY-011-01-02',
          reason: 'no native reminder e-mail goes to an order that is pending by design; the payment-pending message is Pay.Status.Pending through TRK-005',
        },
        'ordersettings.autocancelenabled': {
          value: false,
          rule: 'BR-PAY-170 / AC-PAY-011-01-02',
          reason: 'the unpaid-order timeout per payment method is INV-004 (decision INV-HOLD), so the native automatic cancellation stays off',
        },
      },
    });

    /* ---- routes ----------------------------------------------------------------------- */
    const r = Router();
    const me = (req) => currentCustomerAsync(req.sessionId);
    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };
    const gate = (permission) => async (req, res, next) => {
      try {
        const customer = await me(req);
        if (!await authorizeAsync(permission, customer)) {
          return res.status(403).json({ ok: false, permission, message: `Access denied: ${permission} is required.` });
        }
        req.customer = customer;
        return next();
      } catch (err) { return next(err); }
    };

    /* -- PRD-PAY-001 the payment step --------------------------------------------------- */
    r.get('/methods', send(async (req) => methodsForCheckoutAsync({
      storeId: req.storeId,
      multiSeller: req.query.multiSeller === 'true',
      fulfilment: req.query.fulfilment ?? null,
      total: req.query.total ? Number(req.query.total) : null,
      customer: await me(req),
    })));

    /* -- PRD-PAY-011 the status and retry page ------------------------------------------ */
    r.get('/status/:orderNumber', send(async (req) => paymentStatusAsync({
      orderNumber: req.params.orderNumber, storeId: req.storeId, customer: await me(req),
    })));
    r.post('/retry', send(async (req) => retryAsync({
      orderNumber: req.body?.orderNumber,
      storeId: req.storeId,
      data: req.body?.paymentData ?? {},
      customer: await me(req),
    })));

    /* -- PRD-PAY-024 the provider callback route ---------------------------------------- */
    r.post('/callbacks/:systemName', send(async (req) => {
      const verification = await verifyCallbackAsync({
        systemName: req.params.systemName,
        payload: req.body ?? {},
        signature: req.get('x-signature') ?? req.body?.signature ?? null,
        token: req.get('x-callback-token') ?? req.body?.token ?? null,
        ip: req.ip ?? null,
        storeId: req.storeId,
      });
      if (!verification.verified) {
        return { ok: false, verified: false, reason: verification.reason, nothingChanged: true };
      }
      return applyCallbackAsync({
        providerRef: req.body?.providerRef,
        status: req.body?.status ?? 'Paid',
        verified: true,
        storeId: req.storeId,
      });
    }));
    // the mobile-money handset confirmation the prototype's waiting page posts
    r.post('/callback', send((req) => confirmPushAsync({
      providerRef: req.body?.providerRef, accept: req.body?.accept !== false, storeId: req.storeId,
    })));

    /* -- the admin console -------------------------------------------------------------- */
    r.get('/transactions', gate('Payments.Core.Transactions.View'), send((req) => transactionsAsync({ storeId: req.storeId })));
    r.get('/exceptions', gate('Payments.Core.Transactions.View'), send(async () => ({
      exceptions: await exceptionsAsync(),
      unlinkedShares: await unlinkedSharesAsync(),
    })));
    r.post('/mark-paid', gate('Payments.Core.Transactions.CreateEditDelete'), send((req) => markPaidOfflineAsync({
      orderNumber: req.body.orderNumber,
      actor: req.actorEmail ?? req.customer?.email ?? 'finance',
      note: req.body.note,
      storeId: req.storeId,
    })));
    r.get('/admin/methods', gate('Configuration.ManageSettings'), send((req) => methodAdminListAsync({ storeId: req.storeId })));
    r.post('/admin/methods/:systemName/active', gate('Configuration.ManageSettings'), send((req) => setMethodActiveAsync({
      systemName: req.params.systemName,
      active: req.body?.active === true,
      storeId: req.storeId,
      actor: req.actorEmail ?? req.customer?.email ?? 'administrator',
    })));
    r.get('/admin/routing-rules', gate('Configuration.ManageSettings'), send((req) => rulesAsync({ storeId: req.storeId })));
    r.post('/admin/routing-rules', gate('Configuration.ManageSettings'), send((req) => saveRuleAsync({
      ...req.body, storeId: req.storeId, actor: req.actorEmail ?? req.customer?.email ?? 'administrator',
    })));
    r.post('/admin/routing-rules/:id/active', gate('Configuration.ManageSettings'), send((req) => setRuleActiveAsync({
      id: req.params.id,
      isActive: req.body?.isActive === true,
      actor: req.actorEmail ?? req.customer?.email ?? 'administrator',
    })));
    r.get('/admin/connectors', gate('Configuration.ManageSettings'), send(async () => ({
      connectors: connectorsRegistered().map((c) => ({ ...c, secretKeyNames: secretKeyNamesFor(c.systemName) })),
      checkout: checkoutConnectors().map((c) => c.systemName),
      payoutRegistry: payoutConnectors().map((c) => c.systemName),
      operations: OPERATIONS,
      stateModel: SM_PAY_01,
      nativeMapping: NATIVE_PAYMENT_STATUS,
    })));
    r.post('/admin/credentials', gate('Configuration.ManageSettings'), send((req) => saveCredentialAsync({
      systemName: req.body?.systemName,
      key: req.body?.key,
      value: req.body?.value,
      storeId: req.storeId,
      actor: req.actorEmail ?? req.customer?.email ?? 'administrator',
    })));
    r.get('/admin/location-type', gate('Configuration.ManageSettings'), send((req) => locationTypeAsync({
      pickupPointId: req.query.pickupPointId ?? null,
    })));
    r.get('/admin/order-check/:orderId', gate('Payments.Core.Transactions.View'), send((req) => hasSuccessfulOrAuthorizedTransactionAsync(req.params.orderId)));
    r.get('/admin/post-process/:orderNumber', gate('Payments.Core.Transactions.View'), send((req) => postProcessPaymentAsync({
      orderNumber: req.params.orderNumber, storeId: req.storeId,
    })));

    ctx.addRouter('/api/payments', r);
    ctx.declare({
      built: true,
      owns: ['PRD-PAY-001', 'PRD-PAY-004', 'PRD-PAY-011', 'PRD-PAY-012', 'PRD-PAY-024', 'PRD-PAY-036'],
      note: `${connectors.length} payment connectors registered through IC-PAY-01; routing rules, the SM-PAY-01 lifecycle and idempotency are built in batch A`,
    });
    // the operations not supported by any installed adapter, so the console shows the manual path
    const unsupported = await callAsync('Payments.CashAtOutlet', 'GetStatement', {});
    return { connectors: connectors.length, manualPathExample: unsupported.manualPath ?? null };
  },
});
