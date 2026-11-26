// Product.LOG - Shipping, logistics and fulfilment
// Spec: docs/prd/modules/PRD-LOG.md (wave 4 Fulfil)
// LOG-002 owns the fee engine (the active shipping rate method); LOG-012 owns the handover step,
// which calls CHK-012 for the pickup code (IC-CHK-09). LOG-011/022/023/024/032 are held by FG-06.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { estimateAsync } from './services/estimates.js';
import {
  shippingMethodsAsync, pickupPointsAsync, createShipmentAsync, dispatchShipmentAsync, handoverAsync, shipmentsAsync,
} from './services/logistics.js';

export default definePlugin({
  area: 'LOG',
  startupOrder: 3300,
  async install(ctx) {
    // IC-CHK-03: LOG-005 supplies the delivery estimate CHK-014 shows (BR-LOG-030). CHK
    // calculates no date of its own.
    ctx.providers.registerProvider('IC-CHK-03', {
      area: 'LOG',
      feature: 'PRD-LOG-005',
      name: 'delivery estimate',
      fn: estimateAsync,
    });

    // AC-IAM-025-01-01: LOG owns the deliveries, so it reports the ones waiting for the customer.
    ctx.providers.registerProvider('PRD-IAM-025 waiting items', {
      name: 'deliveries to confirm',
      area: 'LOG',
      feature: 'PRD-LOG-012',
      fn: async ({ customerId }) => {
        const orders = await ctx.repository('Order').getAllAsync((o) => o.customerId === customerId);
        const numbers = orders.map((o) => o.orderNumber);
        const codes = await ctx.repository('PickupCode').getAllAsync((p) => p.status === 'Issued');
        const waiting = codes.filter((c) => numbers.includes(c.orderNumber));
        return {
          items: waiting.map((c) => ({
            what: 'a parcel to collect', reference: c.orderNumber, target: `/order/details/${c.orderNumber}`, since: c.createdOnUtc,
          })),
        };
      },
    });

    ctx.providers.claimOverride('IShippingService', {
      owner: 'Product.LOG',
      feature: 'PRD-LOG-002',
      startupOrder: 3300,
      note: 'Delivery fee rules and the rate method (LOG-001, LOG-002).',
    });
    // IC-LOG-07 GetOperationalStage (BR-LOG-170): LOG supplies the stage of an open shipment.
    // The ADM-007 operations console reads it and derives no stage of its own (AC-ADM-007-02-01).
    ctx.providers.registerProvider('IC-LOG-07', {
      name: 'shipment operational stage',
      area: 'LOG',
      feature: 'PRD-LOG-011',
      fn: async ({ shipment }) => {
        if (!shipment || shipment.deliveredDateUtc) return { stage: null };
        if (shipment.shippedDateUtc) return { stage: 'OutForLastMile' };
        if (shipment.readyForPickupDateUtc) return { stage: 'AwaitingDispatch' };
        return { stage: 'AwaitingSorting' };
      },
    });
    const r = Router();
    r.get('/methods', async (req, res, next) => {
      try { res.json(await shippingMethodsAsync()); } catch (err) { next(err); }
    });
    r.get('/pickup-points', async (req, res, next) => {
      try { res.json(await pickupPointsAsync()); } catch (err) { next(err); }
    });
    r.get('/shipments', async (req, res, next) => {
      try { res.json(await shipmentsAsync()); } catch (err) { next(err); }
    });
    r.post('/shipments', async (req, res, next) => {
      try {
        res.json(await createShipmentAsync({ orderNumber: req.body.orderNumber, carrier: req.body.carrier ?? null, actor: req.actorEmail ?? 'logistics' }));
      } catch (err) { next(err); }
    });
    r.post('/shipments/:trackingNumber/dispatch', async (req, res, next) => {
      try {
        res.json(await dispatchShipmentAsync({ trackingNumber: req.params.trackingNumber, actor: req.actorEmail ?? 'logistics' }));
      } catch (err) { next(err); }
    });
    r.post('/handover', async (req, res, next) => {
      try { res.json(await handoverAsync({ ...req.body, actor: req.actorEmail ?? 'agent' })); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/logistics', r);
    ctx.declare({ built: true, owns: ['PRD-LOG-001', 'PRD-LOG-002', 'PRD-LOG-003', 'PRD-LOG-010', 'PRD-LOG-012'], note: 'methods, fee engine, outlets, shipments and handover are built in Session 0' });
  },
});
