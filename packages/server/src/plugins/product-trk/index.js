// Product.TRK - Tracking and notifications
// Spec: docs/prd/modules/PRD-TRK.md (wave 4 Fulfil)
// TRK-005 owns multi-channel messaging; every gateway is a mock (P-3). TRK-003 is held by FG-06.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  trackAsync, guestStatusAsync, messageLogAsync, trackingHubAsync,
} from './services/tracking.js';
import {
  sendNotificationAsync, definitionsAsync, definitionAsync, saveDefinitionAsync,
  setChannelContentAsync, channelContentAsync, ensureInstalledAsync, registeredEventCodes,
  registerOrderKindProvider, orderKindProvidersRegistered, resolveRecipientAsync,
  checkBrevoAsync, sendOrderPlacedAsync, sendOrderStatusAsync, CHANNELS,
} from './services/notifications.js';
import {
  messagesAsync, deliveryReceiptAsync, queuedMessagesSendTaskAsync, orderNotificationsAsync,
  deliveryReportAsync, outcomesByReferenceAsync, STATUSES,
} from './services/delivery-log.js';
import {
  templatesAsync, saveTemplateAsync, templateForAsync, allowedTokens, receiveBounceAsync,
  clearBounceAsync, bounceStateAsync, bouncedCustomersAsync, queuedEmailsAsync,
} from './services/email-templates.js';
import { registerNotificationEngine } from '../../core/messages.js';
import { messageGateways } from '@product/mocks';

export default definePlugin({
  area: 'TRK',
  startupOrder: 3310,
  async install(ctx) {
    // BR-ADM-003 entry (8): the overridden nopCommerce service is IWorkflowMessageService
    // (SendNotificationAsync, signature unchanged in 5.00); owner TRK-005 under OVR-REG. Other
    // modules send their own event codes through IC-TRK-04 instead of overriding it.
    // BR-TRK-021: TRK and the bundled Misc.Brevo cannot both own IWorkflowMessageService
    const brevo = await checkBrevoAsync({ storeId: 1 });
    if (brevo.refused === true) throw new Error(brevo.message);

    ctx.providers.claimOverride('IWorkflowMessageService', {
      owner: 'Product.TRK',
      feature: 'PRD-TRK-005',
      startupOrder: 3310,
      rule: 'BR-ADM-003',
      note: 'Multi-channel messaging host (TRK-005). Routing per event and channel comes from the pack.',
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

    // BR-TRK-020: every module's sendAsync call lands in the engine from here on
    registerNotificationEngine(async ({
      event, to, tokens, storeId, gateways, reference, order, shipment, customer, languageId, channels,
    }) => {
      const addresses = Array.isArray(to) ? to : [to].filter(Boolean);
      const recipients = [];
      for (const address of addresses) {
        const known = /@/.test(String(address))
          ? await ctx.repository('Customer').getOneAsync((c) => c.email === address)
          : await ctx.repository('Customer').getOneAsync((c) => c.phone === address);
        recipients.push({
          customer: known ?? null,
          email: /@/.test(String(address)) ? address : known?.email ?? null,
          phone: /@/.test(String(address)) ? known?.phone ?? null : address,
          languageId: languageId ?? known?.languageId ?? 1,
        });
      }
      const sent = await sendNotificationAsync({
        key: event,
        tokens,
        recipients: recipients.length ? recipients : null,
        customer,
        order,
        shipment,
        storeId,
        reference,
        languageId,
        gateways: gateways ?? messageGateways,
      });
      if (sent.ok === false && sent.unknownKey) {
        // a key with no definition still has to be recorded, so nothing is sent silently
        const { logMessageAsync } = await import('./services/delivery-log.js');
        return [await logMessageAsync({
          definition: null,
          key: event,
          channel: (channels ?? ['email'])[0],
          recipient: recipients[0] ?? null,
          address: addresses[0] ?? null,
          status: 'Failed',
          reason: 'no notification definition and no registered event code',
          tokens,
          storeId,
          reference,
        })];
      }
      return sent.messages;
    });

    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };

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
    /* ------------------------------------- PRD-TRK-005 the notification engine -------- */
    const n = Router();
    n.get('/definitions', send(() => definitionsAsync()));
    n.get('/definitions/:key', send(async (req) => ({
      definition: await definitionAsync(req.params.key),
      content: await channelContentAsync(req.params.key),
    })));
    n.post('/definitions/:key', send((req) => saveDefinitionAsync({
      key: req.params.key, ...req.body, actor: req.actor, storeId: req.storeId,
    })));
    n.post('/definitions/:key/content', send((req) => setChannelContentAsync({
      key: req.params.key, ...req.body, actor: req.actor, storeId: req.storeId,
    })));
    n.get('/event-codes', send(() => registeredEventCodes()));
    n.get('/order-kinds', send(() => orderKindProvidersRegistered()));
    n.get('/channels', send(() => ({ channels: CHANNELS, statuses: STATUSES })));
    n.post('/send', send((req) => sendNotificationAsync({
      ...req.body, storeId: req.storeId, gateways: messageGateways,
    })));
    n.get('/recipient', send((req) => resolveRecipientAsync({
      tokens: req.query, storeId: req.storeId,
    })));
    n.get('/brevo-check', send((req) => checkBrevoAsync({ storeId: req.storeId })));
    n.post('/orders/placed', send(async (req) => sendOrderPlacedAsync({
      order: await ctx.repository('Order').getByIdAsync(req.body?.orderId), storeId: req.storeId, gateways: messageGateways,
    })));
    n.post('/orders/status', send(async (req) => sendOrderStatusAsync({
      order: await ctx.repository('Order').getByIdAsync(req.body?.orderId),
      status: req.body?.status,
      productStatusCode: req.body?.productStatusCode ?? null,
      storeId: req.storeId,
      gateways: messageGateways,
    })));

    /* ------------------------------------- PRD-TRK-004 templates and bounces ---------- */
    n.get('/templates', send(() => templatesAsync()));
    n.get('/templates/tokens', send(() => ({ tokens: allowedTokens() })));
    n.get('/templates/:name', send((req) => templateForAsync({
      name: req.params.name, storeId: Number(req.query.storeId ?? req.storeId), languageId: Number(req.query.languageId ?? 1),
    })));
    n.post('/templates/:name', send((req) => saveTemplateAsync({
      name: req.params.name, ...req.body, actor: req.actor,
    })));
    n.get('/queued-emails', send((req) => queuedEmailsAsync({ to: req.query.to ?? null, key: req.query.key ?? null })));
    n.post('/bounces', send((req) => receiveBounceAsync({ ...req.body, actor: req.actorEmail ?? 'bounce feed' })));
    n.post('/bounces/clear', send((req) => clearBounceAsync({ ...req.body, actor: req.actor })));
    n.get('/bounces', send(() => bouncedCustomersAsync()));
    n.get('/bounces/:address', send((req) => bounceStateAsync(req.params.address)));

    /* ------------------------------------- PRD-TRK-007 the notification log ----------- */
    n.get('/messages', send((req) => messagesAsync({
      channel: req.query.channel ?? null,
      status: req.query.status ?? null,
      definitionKey: req.query.definitionKey ?? null,
      reference: req.query.reference ?? null,
      orderId: req.query.orderId,
      from: req.query.from ?? null,
      to: req.query.to ?? null,
    })));
    n.post('/receipts', send((req) => deliveryReceiptAsync({ ...req.body, gateways: messageGateways })));
    n.post('/queue/send-task', send((req) => queuedMessagesSendTaskAsync({
      gateways: messageGateways, retryLimit: Number(req.body?.retryLimit ?? 3), storeId: req.storeId,
    })));
    n.get('/orders/:orderId/notifications', send((req) => orderNotificationsAsync({
      orderId: Number(req.params.orderId), requester: req.actor,
    })));
    n.get('/report', send((req) => deliveryReportAsync({
      from: req.query.from ?? null, to: req.query.to ?? null, requester: req.actor,
    })));
    n.get('/reference/:reference', send((req) => outcomesByReferenceAsync(req.params.reference)));
    ctx.addRouter('/api/notifications', n);

    ctx.addRouter('/api/tracking', r);
    // IC-PLT-08: tracking events have an active period and then an archive period; the
    // notification log follows its own rule (AC-PLT-020-02-01, AC-PLT-020-02-02).
    ctx.providers.registerProvider('IC-PLT-08', {
      area: 'TRK',
      feature: 'PRD-TRK-002',
      name: 'tracking record types',
      fn: async () => [
        {
          code: 'trk.trackingevents', owningModule: 'Product.TRK', entity: 'TrackingEvent', dateField: 'occurredOnUtc', allowedActions: ['Archive', 'Delete'], activeAndArchivePeriods: true,
        },
        {
          code: 'trk.notificationlog', owningModule: 'Product.TRK', entity: 'NotificationMessage', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], personalData: true, anonymiseFields: ['recipient', 'to', 'text'],
        },
      ],
    });

    await ensureInstalledAsync();

    ctx.declare({
      built: true,
      owns: ['PRD-TRK-001', 'PRD-TRK-004', 'PRD-TRK-005', 'PRD-TRK-007', 'PRD-TRK-011'],
      builtFeatures: ['PRD-TRK-004', 'PRD-TRK-005', 'PRD-TRK-007'],
      note: 'the notification engine, e-mail templates and bounces, and the notification log',
    });
  },
});
