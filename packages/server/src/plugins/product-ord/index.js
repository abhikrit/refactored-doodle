// Product.ORD - Orders and B2B transactions
// Spec: docs/prd/modules/PRD-ORD.md (wave 3 Buy)
// ORD-002 owns the configurable stage model; only the transitions in the state model are allowed.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  ordersAsync, orderAsync, advanceStageAsync, STAGES,
} from './services/orders.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

export default definePlugin({
  area: 'ORD',
  startupOrder: 3220,
  async install(ctx) {
    ctx.providers.claimOverride('IOrderService', {
      owner: 'Product.ORD',
      feature: 'PRD-ORD-001',
      startupOrder: 3220,
      note: 'Order console read model and the stage model (ORD-001, ORD-002).',
    });
    const r = Router();
    r.get('/stages', (req, res) => res.json(STAGES));
    r.get('/', async (req, res, next) => {
      try {
        const customer = await currentCustomerAsync(req.sessionId);
        const mine = req.query.mine === 'true';
        res.json(await ordersAsync({
          customerId: mine && customer ? customer.id : req.query.customerId,
          vendorId: req.query.vendorId,
          checkoutReference: req.query.checkoutReference,
          stage: req.query.stage,
        }));
      } catch (err) { next(err); }
    });
    r.get('/:orderNumber', async (req, res, next) => {
      try {
        const order = await orderAsync(req.params.orderNumber);
        if (!order) return res.status(404).json({ message: 'order not found' });
        return res.json(order);
      } catch (err) { return next(err); }
    });
    r.post('/:orderNumber/advance', async (req, res, next) => {
      try {
        res.json(await advanceStageAsync({
          orderNumber: req.params.orderNumber, to: req.body.to, actor: req.actorEmail ?? 'admin', reason: req.body.reason ?? '',
        }));
      } catch (err) { next(err); }
    });
    ctx.addRouter('/api/orders', r);
    ctx.declare({ built: true, owns: ['PRD-ORD-001', 'PRD-ORD-002', 'PRD-ORD-007'], note: 'order console, stage model and order numbering are built in Session 0' });
  },
});
