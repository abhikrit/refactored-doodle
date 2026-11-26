// Product.PAY - Payments, tax, settlement and reconciliation
// Spec: docs/prd/modules/PRD-PAY.md (wave 3 Buy)
// PAY-011 owns payment status; every rail is a mock (P-3). PAY-007/009/010/035/036 are held by
// PAY-DIRECT / LIC-01 and WAL-01, so they show the Proposed option labelled with the decision.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { registerPlacementParticipant } from '../product-chk/services/validation.js';
import {
  paymentMethodsForStoreAsync, confirmPushAsync, markPaidOfflineAsync, transactionsAsync,
  retryPaymentAsync,
} from './services/payments.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

export default definePlugin({
  area: 'PAY',
  startupOrder: 3210,
  async install(ctx) {
    // IC-CHK-06 Confirm only (BR-PAY-014): one payment is taken for the checkout, and each
    // sub-order is linked to that group transaction as it is saved (AC-CHK-004-01-02).
    // PRD-PAY-011 itself is not built in this wave: this is the link the CHK-004 split needs.
    registerPlacementParticipant({
      area: 'PAY',
      feature: 'PRD-PAY-011',
      name: 'group payment link',
      lockKey: () => null,
      fn: async ({ phase, order }) => {
        if (phase !== 'Confirm' || !order?.checkoutReference) return { ok: true };
        const transaction = await ctx.repository('PaymentTransaction')
          .getOneAsync((t) => t.checkoutReference === order.checkoutReference);
        if (!transaction) return { ok: true };
        const existing = await ctx.repository('OrderPaymentLink')
          .getOneAsync((l) => Number(l.orderId) === Number(order.id));
        if (!existing) {
          await ctx.repository('OrderPaymentLink').insertAsync({
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentTransactionId: transaction.id,
            providerRef: transaction.providerRef,
            checkoutReference: order.checkoutReference,
            groupPayment: true,
            share: order.total,
          });
        }
        return { ok: true, linkedTo: transaction.providerRef };
      },
    });

    ctx.providers.claimOverride('IPaymentService', {
      owner: 'Product.PAY',
      feature: 'PRD-PAY-001',
      startupOrder: 3210,
      note: 'Payment method offer and routing rules (PAY-001, PAY-024). Status changes only through the CHK-003 placement host.',
    });
    const r = Router();
    r.get('/methods', async (req, res, next) => {
      try {
        res.json(await paymentMethodsForStoreAsync({ storeId: req.storeId, multiSeller: req.query.multiSeller === 'true' }));
      } catch (err) { next(err); }
    });
    r.post('/callback', async (req, res, next) => {
      try { res.json(await confirmPushAsync({ providerRef: req.body.providerRef, accept: req.body.accept !== false })); } catch (err) { next(err); }
    });
    r.post('/retry', async (req, res, next) => {
      try {
        res.json(await retryPaymentAsync({
          orderNumber: req.body?.orderNumber,
          storeId: req.storeId,
          data: req.body?.paymentData ?? {},
          customer: await currentCustomerAsync(req.sessionId),
        }));
      } catch (err) { next(err); }
    });
    r.post('/mark-paid', async (req, res, next) => {
      try {
        res.json(await markPaidOfflineAsync({ orderNumber: req.body.orderNumber, actor: req.actorEmail ?? 'finance', note: req.body.note }));
      } catch (err) { next(err); }
    });
    r.get('/transactions', async (req, res, next) => {
      try { res.json(await transactionsAsync()); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/payments', r);
    ctx.declare({ built: true, owns: ['PRD-PAY-001', 'PRD-PAY-004', 'PRD-PAY-011', 'PRD-PAY-036'], note: 'method offer, mobile-money push and callback, offline confirmation and the operations list are built in Session 0' });
  },
});
