// Product.PAY - Payments, tax, settlement and reconciliation
// Spec: docs/prd/modules/PRD-PAY.md (wave 3 Buy)
// PAY-011 owns payment status; every rail is a mock (P-3). PAY-007/009/010/035/036 are held by
// PAY-DIRECT / LIC-01 and WAL-01, so they show the Proposed option labelled with the decision.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  paymentMethodsForStoreAsync, confirmPushAsync, markPaidOfflineAsync, transactionsAsync,
} from './services/payments.js';

export default definePlugin({
  area: 'PAY',
  startupOrder: 3210,
  async install(ctx) {
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
