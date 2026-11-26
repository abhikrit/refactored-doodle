// Product.ORD - Orders and B2B transactions
// Spec: docs/prd/modules/PRD-ORD.md (wave 3 Buy)
// ORD-002 owns the configurable stage model; only the transitions in the state model are allowed.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { registerPlacementParticipant } from '../product-chk/services/validation.js';
import {
  ordersAsync, orderAsync, advanceStageAsync, STAGES,
} from './services/orders.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

export default definePlugin({
  area: 'ORD',
  startupOrder: 3220,
  async install(ctx) {
    // IC-CHK-06 Confirm only (IC-ORD-09): the seller's task list for a sub-order is created by
    // this participant as the sub-order is saved, not by an event consumer (BR-CHK-006).
    // PRD-ORD-005 is not built in this wave - the workflow behind the task waits for WF-ENG;
    // this is the task row the CHK-004 split needs (AC-CHK-004-02-01).
    registerPlacementParticipant({
      area: 'ORD',
      feature: 'PRD-ORD-005',
      name: 'seller task list',
      lockKey: () => null,
      fn: async ({ phase, order }) => {
        if (phase !== 'Confirm' || !order?.vendorId) return { ok: true };
        const existing = await ctx.repository('SellerTask')
          .getOneAsync((t) => Number(t.orderId) === Number(order.id));
        if (existing) return { ok: true };
        const task = await ctx.repository('SellerTask').insertAsync({
          orderId: order.id,
          orderNumber: order.orderNumber,
          vendorId: order.vendorId,
          state: 'New',
          createdBy: 'PRD-CHK-004 split placement',
          createdOnUtc: new Date().toISOString(),
          prototypeDefault: 'Prototype default - decision WF-ENG pending',
        });
        return { ok: true, task: task.id };
      },
    });

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
        // the native HasAccessToOrderAsync: a vendor user sees only the sub-orders that hold
        // their own products (AC-CHK-004-02-01)
        const vendorScope = customer?.vendorId ?? null;
        res.json(await ordersAsync({
          customerId: mine && customer ? customer.id : req.query.customerId,
          vendorId: vendorScope ?? req.query.vendorId,
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
