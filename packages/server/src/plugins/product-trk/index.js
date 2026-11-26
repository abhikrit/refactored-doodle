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
import {
  ensureHubInstalledAsync, submitEventsAsync, processEventAsync, reprocessEventAsync,
  manualEventAsync, rejectedEventsAsync, eventsAsync, timelineAsync, sourcesAsync,
  eventCodesAsync, mappingsAsync, saveMappingAsync, registerExternalReferenceAsync,
  externalReferencesAsync, saveExpectationRuleAsync, expectationRulesAsync, runAlertTaskAsync,
  alertsAsync, resolveAlertAsync, searchAsync as hubSearchAsync, archivedEventsAsync,
  stateRefusalsAsync, COMMON_EVENT_CODES,
} from './services/event-hub.js';
import {
  installTrk012DefinitionsAsync, shipmentSentAsync, readyForPickupAsync,
  runPickupReminderTaskAsync, TRK012_DEFINITIONS,
} from './services/shipment-notifications.js';
import {
  matrixAsync, setPreferenceAsync, updatePreferenceAsync, checkAllowedAsync,
  checkAllowedForSenderAsync, defaultsAsync, saveDefaultsAsync, setOrderSubscriptionAsync,
  orderSubscriptionAsync, oneClickUnsubscribeAsync, unsubscribeLinkFor, contactOptOutsAsync,
  contactOptOutStateAsync, releaseHeldAsync, preferencesAsync,
} from './services/preferences.js';
import {
  publicTrackingAsync, refreshTrackingAsync, createShareLinkAsync, revokeShareLinkAsync,
  openShareLinkAsync, shareLinksAsync, myOrderTrackingAsync, myOrdersTrackingAsync,
  guestLookupAsync, sellerShipmentsAsync, sellerShipmentAsync,
} from './services/public-tracking.js';
import {
  createNoticeAsync, previewNoticeAsync, sendNoticeAsync, cancelNoticeAsync, runNoticeTaskAsync,
  noticesAsync, noticeAsync, matchAsync, createBannerAsync, activeBannersAsync, bannersAsync,
  endBannerAsync, runSourceMonitorAsync, feedAsync, feedCountAsync, openNotificationAsync,
  clearNotificationAsync, installOutreachDefinitionAsync,
} from './services/outreach.js';
import {
  registerDeviceAsync, revokeDeviceAsync, devicesAsync, submitScansAsync, workListAsync,
  downloadAccessProviderAsync, scanEventsAsync, UPLOAD_CONTEXT, SCAN_TYPES,
  PROTOTYPE_DEFAULT_LABEL as SCANNING_LABEL,
} from './services/scanning.js';
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

    // PRD-TRK-003: the upload context of the scanning app's media, through the ADM-008 gate
    const { registerUploadContextAsync } = await import('../product-adm/services/uploads.js');
    await registerUploadContextAsync({
      code: UPLOAD_CONTEXT,
      owningFeature: 'PRD-TRK-003',
      coveredActions: ['Product.TRK ScanController.SubmitEvents'],
      ownEndpoint: true,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'mp3', 'mp4', 'm4a'],
      maxSizeKb: 8192,
      scanEnabled: true,
      failMode: 'reject',
    });
    // IC-SEC-05: TRK claims its own scan media on the SEC-002 download filter
    ctx.providers.registerProvider('IC-SEC-05', {
      area: 'TRK',
      feature: 'PRD-TRK-003',
      name: 'tracking scan media',
      fn: (request) => downloadAccessProviderAsync(request),
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

    /* ------------------------------------- PRD-TRK-002 the tracking event hub --------- */
    const h = Router();
    h.get('/sources', send(() => sourcesAsync()));
    h.get('/event-codes', send(() => eventCodesAsync()));
    h.get('/mappings', send((req) => mappingsAsync(req.query.source ?? null)));
    h.post('/mappings', send((req) => saveMappingAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    h.post('/events', send((req) => submitEventsAsync({
      sourceCode: req.body?.sourceCode,
      credentials: req.body?.credentials ?? null,
      events: req.body?.events ?? [],
      actor: req.actorEmail,
      gateways: messageGateways,
    })));
    h.post('/events/manual', send((req) => manualEventAsync({
      ...req.body, actor: req.actor, gateways: messageGateways,
    })));
    h.get('/events', send((req) => eventsAsync({ status: req.query.status ?? null, reference: req.query.reference ?? null })));
    h.get('/events/rejected', send(() => rejectedEventsAsync()));
    h.post('/events/:id/reprocess', send((req) => reprocessEventAsync({
      eventId: Number(req.params.id), actor: req.actor, gateways: messageGateways,
    })));
    h.post('/events/:id/process', send((req) => processEventAsync({ eventId: Number(req.params.id), gateways: messageGateways })));
    h.get('/timeline/:reference', send((req) => timelineAsync(req.params.reference)));
    h.get('/search', send((req) => hubSearchAsync({ term: req.query.q, requester: req.actor })));
    h.get('/archive', send((req) => archivedEventsAsync({ reference: req.query.reference ?? null, requester: req.actor })));
    h.get('/references', send(() => externalReferencesAsync()));
    h.post('/references', send((req) => registerExternalReferenceAsync(req.body)));
    h.get('/expectation-rules', send(() => expectationRulesAsync()));
    h.post('/expectation-rules', send((req) => saveExpectationRuleAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    h.get('/alerts', send((req) => alertsAsync({ status: req.query.status ?? null })));
    h.post('/alerts/task', send((req) => runAlertTaskAsync({ now: req.body?.now ?? null })));
    h.post('/alerts/:id/resolve', send((req) => resolveAlertAsync({
      alertId: Number(req.params.id), note: req.body?.note, actor: req.actor,
    })));
    h.get('/state-refusals', send(() => stateRefusalsAsync()));
    h.get('/common-codes', send(() => COMMON_EVENT_CODES));

    /* ------------------------------------- PRD-TRK-012 shipment notifications --------- */
    h.post('/shipments/sent', send(async (req) => shipmentSentAsync({
      shipment: await ctx.repository('Shipment').getOneAsync((s) => s.trackingNumber === req.body?.trackingNumber),
      gateways: messageGateways,
      storeId: req.storeId,
    })));
    h.post('/shipments/ready-for-pickup', send(async (req) => readyForPickupAsync({
      shipment: await ctx.repository('Shipment').getOneAsync((s) => s.trackingNumber === req.body?.trackingNumber),
      gateways: messageGateways,
      storeId: req.storeId,
    })));
    h.post('/pickup-reminders/task', send((req) => runPickupReminderTaskAsync({
      now: req.body?.now ?? null, gateways: messageGateways, storeId: req.storeId,
    })));
    h.get('/shipment-templates', send(() => TRK012_DEFINITIONS.map((d) => ({ key: d.key, category: d.category, channels: d.channels }))));
    /* ------------------------------------- PRD-TRK-006 notification preferences ------ */
    const p = Router();
    p.get('/defaults', send((req) => defaultsAsync(req.storeId)));
    p.post('/defaults', send((req) => saveDefaultsAsync({ ...req.body, actor: req.actor, storeId: req.body?.storeId ?? 0 })));
    p.get('/matrix', send((req) => matrixAsync({
      customerId: Number(req.query.customerId ?? req.actor?.id ?? 0), storeId: req.storeId,
    })));
    p.post('/matrix', send((req) => setPreferenceAsync({
      customerId: Number(req.body?.customerId ?? req.actor?.id ?? 0), ...req.body, actor: req.actor, storeId: req.storeId,
    })));
    p.get('/rows', send((req) => preferencesAsync(req.query.customerId ? Number(req.query.customerId) : null)));
    p.post('/update', send((req) => updatePreferenceAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    p.get('/check', send((req) => checkAllowedAsync({
      customerId: req.query.customerId ? Number(req.query.customerId) : null,
      phone: req.query.phone ?? null,
      recipient: req.query.recipient ?? null,
      channel: req.query.channel,
      category: req.query.category ?? null,
      sender: req.query.sender ?? null,
      orderId: req.query.orderId ? Number(req.query.orderId) : null,
      storeId: req.storeId,
    })));
    p.post('/check', send((req) => checkAllowedForSenderAsync({ ...req.body, storeId: req.storeId })));
    p.get('/opt-outs', send(() => contactOptOutsAsync()));
    p.get('/opt-outs/state', send((req) => contactOptOutStateAsync({ phone: req.query.phone, channel: req.query.channel })));
    p.get('/orders/:orderId', send((req) => orderSubscriptionAsync(Number(req.params.orderId))));
    p.post('/orders/:orderId', send((req) => setOrderSubscriptionAsync({
      orderId: Number(req.params.orderId), customerId: req.actor?.id ?? null, subscribed: req.body?.subscribed === true, actor: req.actor, storeId: req.storeId,
    })));
    p.get('/orders/:orderId/link', send((req) => ({ link: unsubscribeLinkFor(Number(req.params.orderId)) })));
    p.post('/unsubscribe/:orderId', send((req) => oneClickUnsubscribeAsync({
      orderId: Number(req.params.orderId), token: req.body?.token ?? req.query.t, storeId: req.storeId,
    })));
    p.post('/release-held', send((req) => releaseHeldAsync({
      now: req.body?.now ?? null, gateways: messageGateways, storeId: req.storeId,
    })));
    ctx.addRouter('/api/notification-preferences', p);

    /* ------------------------------------- PRD-TRK-001, 010 and 011 the pages -------- */
    h.get('/public/:reference', send((req) => publicTrackingAsync({
      reference: req.params.reference,
      session: req.sessionId,
      captchaResponse: req.query.captcha ?? null,
      storeId: req.storeId,
    })));
    h.post('/public/:reference/refresh', send((req) => refreshTrackingAsync({
      reference: req.params.reference, session: req.sessionId, storeId: req.storeId,
    })));
    h.post('/share', send((req) => createShareLinkAsync({
      reference: req.body?.reference, customerId: req.actor?.id, storeId: req.storeId,
    })));
    h.post('/share/:token/revoke', send((req) => revokeShareLinkAsync({
      token: req.params.token, customerId: req.actor?.id, storeId: req.storeId,
    })));
    h.get('/share/:token', send((req) => openShareLinkAsync({ token: req.params.token, storeId: req.storeId })));
    h.get('/shares', send((req) => shareLinksAsync(req.actor?.id ?? null)));
    h.get('/my-orders', send((req) => myOrdersTrackingAsync({ customerId: req.actor?.id, storeId: req.storeId })));
    h.get('/my-orders/:orderNumber', send((req) => myOrderTrackingAsync({
      orderNumber: req.params.orderNumber, customerId: req.actor?.id, storeId: req.storeId,
    })));
    h.post('/guest-lookup', send((req) => guestLookupAsync({
      orderNumber: req.body?.orderNumber,
      contact: req.body?.contact,
      session: req.sessionId,
      captchaResponse: req.body?.captcha ?? null,
      storeId: req.storeId,
    })));
    h.get('/seller/:vendorId/shipments', send((req) => sellerShipmentsAsync({
      vendorId: Number(req.params.vendorId), requester: req.actor, storeId: req.storeId,
    })));
    h.get('/seller/:vendorId/shipments/:shipmentId', send((req) => sellerShipmentAsync({
      shipmentId: Number(req.params.shipmentId), vendorId: Number(req.params.vendorId), requester: req.actor, storeId: req.storeId,
    })));

    /* ------------------------------------- PRD-TRK-009 outreach and banners ---------- */
    h.get('/notices', send(() => noticesAsync()));
    h.post('/notices', send((req) => createNoticeAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    h.get('/notices/:id', send((req) => noticeAsync(Number(req.params.id))));
    h.get('/notices/:id/preview', send((req) => previewNoticeAsync({
      noticeId: Number(req.params.id), requester: req.actor, storeId: req.storeId,
    })));
    h.post('/notices/:id/send', send((req) => sendNoticeAsync({
      noticeId: Number(req.params.id), sendAtUtc: req.body?.sendAtUtc ?? null, actor: req.actor, gateways: messageGateways, storeId: req.storeId,
    })));
    h.post('/notices/:id/cancel', send((req) => cancelNoticeAsync({
      noticeId: Number(req.params.id), actor: req.actor, storeId: req.storeId,
    })));
    h.post('/notices/task', send((req) => runNoticeTaskAsync({
      now: req.body?.now ?? null, gateways: messageGateways, storeId: req.storeId,
    })));
    h.post('/notices/match', send((req) => matchAsync({ criteria: req.body?.criteria ?? {}, storeId: req.storeId })));
    h.get('/banners', send(() => bannersAsync()));
    h.get('/banners/active', send((req) => activeBannersAsync({
      storeId: Number(req.query.storeId ?? req.storeId), sourceCode: req.query.source ?? null,
    })));
    h.post('/banners', send((req) => createBannerAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    h.post('/banners/:id/end', send((req) => endBannerAsync({ bannerId: Number(req.params.id), actor: req.actor })));
    h.post('/source-monitor', send((req) => runSourceMonitorAsync({ now: req.body?.now ?? null, storeId: req.storeId })));

    /* ------------------------------------- PRD-TRK-008 the in-app feed --------------- */
    h.get('/feed', send((req) => feedAsync({ customerId: Number(req.query.customerId ?? req.actor?.id ?? 0) })));
    h.get('/feed/count', send((req) => feedCountAsync({ customerId: Number(req.query.customerId ?? req.actor?.id ?? 0) })));
    h.post('/feed/:id/open', send((req) => openNotificationAsync({
      notificationId: Number(req.params.id), customerId: Number(req.body?.customerId ?? req.actor?.id ?? 0),
    })));
    h.post('/feed/:id/clear', send((req) => clearNotificationAsync({
      notificationId: Number(req.params.id), customerId: Number(req.body?.customerId ?? req.actor?.id ?? 0),
    })));

    /* ------------------------------------- PRD-TRK-003 the scanning app -------------- */
    h.get('/devices', send(() => devicesAsync()));
    h.post('/devices', send((req) => registerDeviceAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    h.post('/devices/:deviceId/revoke', send((req) => revokeDeviceAsync({
      deviceId: req.params.deviceId, actor: req.actor, storeId: req.storeId,
    })));
    h.post('/scans', send((req) => submitScansAsync({
      ...req.body, gateways: messageGateways, storeId: req.storeId,
    })));
    h.get('/scans', send(() => scanEventsAsync()));
    h.get('/work-list', send((req) => workListAsync({
      deviceId: req.query.deviceId, token: req.query.token ?? null, storeId: req.storeId,
    })));
    h.get('/scan-types', send(() => ({ types: SCAN_TYPES, uploadContext: UPLOAD_CONTEXT, prototypeDefaultLabel: SCANNING_LABEL })));

    ctx.addRouter('/api/tracking-hub', h);

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
    await ensureHubInstalledAsync();
    await installTrk012DefinitionsAsync();
    await installOutreachDefinitionAsync();

    ctx.declare({
      built: true,
      owns: [
        'PRD-TRK-001', 'PRD-TRK-002', 'PRD-TRK-003', 'PRD-TRK-004', 'PRD-TRK-005', 'PRD-TRK-006',
        'PRD-TRK-007', 'PRD-TRK-008', 'PRD-TRK-009', 'PRD-TRK-010', 'PRD-TRK-011', 'PRD-TRK-012',
      ],
      builtFeatures: [
        'PRD-TRK-001', 'PRD-TRK-002', 'PRD-TRK-003', 'PRD-TRK-004', 'PRD-TRK-005', 'PRD-TRK-006',
        'PRD-TRK-007', 'PRD-TRK-008', 'PRD-TRK-009', 'PRD-TRK-010', 'PRD-TRK-011', 'PRD-TRK-012',
      ],
      holdingDecisions: ['FG-06'],
      note: 'the whole tracking and notification module: the event hub and its pages, the notification engine with preferences, templates, the log, shipment messages, outreach and banners, the in-app feed, and the scanning app behind its mock (decision FG-06 pending)',
    });
  },
});
