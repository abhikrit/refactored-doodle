// Product.TRK - Tracking and notifications
// Spec: docs/prd/modules/PRD-TRK.md (wave 4 Fulfil)
// TRK-005 owns multi-channel messaging; every gateway is a mock (P-3). TRK-003 is held by FG-06.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  trackAsync, guestStatusAsync, messageLogAsync, trackingHubAsync,
} from './services/tracking.js';

export default definePlugin({
  area: 'TRK',
  startupOrder: 3310,
  async install(ctx) {
    // BR-ADM-003 entry (8): the overridden nopCommerce service is IWorkflowMessageService
    // (SendNotificationAsync, signature unchanged in 5.00); owner TRK-005 under OVR-REG. Other
    // modules send their own event codes through IC-TRK-04 instead of overriding it.
    ctx.providers.claimOverride('IWorkflowMessageService', {
      owner: 'Product.TRK',
      feature: 'PRD-TRK-005',
      startupOrder: 3310,
      rule: 'BR-ADM-003',
      note: 'Multi-channel messaging host (TRK-005). Routing per event and channel comes from the pack (decision MSG-ROUTE).',
    });
    // event consumers only notify (L1 section 6.2 principle 8)
    ctx.events.subscribe('OrderPlacedEvent', {
      area: 'TRK', feature: 'PRD-TRK-005', name: 'order-placed-notify', fn: async () => {},
    });
    ctx.events.subscribe('ShipmentDispatchedEvent', {
      area: 'TRK',
      feature: 'PRD-TRK-005',
      name: 'shipment-dispatched-notify',
      fn: async ({ order }) => {
        await ctx.messages.sendAsync({
          event: 'Trk.ShipmentDispatched',
          to: order.customerEmail,
          tokens: { 'order number': order.orderNumber },
          storeId: order.storeId,
          feature: 'PRD-TRK-005',
          gateways: (await import('@product/mocks')).messageGateways,
        });
      },
    });

    const r = Router();
    r.get('/hub', async (req, res, next) => {
      try { res.json(await trackingHubAsync()); } catch (err) { next(err); }
    });
    r.get('/messages', async (req, res, next) => {
      try { res.json(await messageLogAsync({ channel: req.query.channel, event: req.query.event })); } catch (err) { next(err); }
    });
    r.get('/guest-status', async (req, res, next) => {
      try { res.json(await guestStatusAsync({ orderNumber: req.query.orderNumber, contact: req.query.contact })); } catch (err) { next(err); }
    });
    r.get('/:trackingNumber', async (req, res, next) => {
      try { res.json(await trackAsync(req.params.trackingNumber)); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/tracking', r);
    ctx.declare({ built: true, owns: ['PRD-TRK-001', 'PRD-TRK-005', 'PRD-TRK-007', 'PRD-TRK-011'], note: 'tracking page, hub, message log and guest status are built in Session 0' });
  },
});
