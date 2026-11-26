// PRD-TRK-009 proactive outreach and outage notices, and PRD-TRK-008 the in-app feed.
//
// A notice is built from criteria, previewed with the number of people it would reach, then sent
// through the TRK-005 engine under the category "Service notices", so every preference still
// applies (SM-TRK-04). A banner is text with a period and stores, shown at the top of the page
// while it is active (SM-TRK-05); a tracking source that goes quiet past its stall limit raises
// one by itself. The in-app feed is what the engine's in-app channel writes (SM-TRK-08).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { resource } from '../../../core/messages.js';
import { messageGateways } from '@product/mocks';
import { sendNotificationAsync, definitionAsync } from './notifications.js';

const noticeRepo = () => repository('OutreachNotice');
const bannerRepo = () => repository('ServiceBanner');
const feedRepo = () => repository('InAppNotification');

export const OUTREACH_CATEGORY = 'Service notices';
export const NOTICE_STATUSES = ['Draft', 'Scheduled', 'Sending', 'Completed', 'Cancelled'];
export const BANNER_STATUSES = ['Scheduled', 'Active', 'Ended'];

/** The definition the engine sends a notice through, installed with the other TRK ones. */
export const OUTREACH_DEFINITION = {
  key: 'Trk.Core.ServiceNotice',
  category: OUTREACH_CATEGORY,
  channels: ['sms', 'email'],
  sms: '%Notice.Text%',
  subject: 'A message about your parcel',
  body: '%Notice.Text%',
};

export async function installOutreachDefinitionAsync() {
  const definitionRepo = repository('NotificationDefinition');
  const existing = await definitionRepo.getOneAsync((d) => d.key === OUTREACH_DEFINITION.key);
  if (!existing) {
    await definitionRepo.insertAsync({
      key: OUTREACH_DEFINITION.key,
      category: OUTREACH_DEFINITION.category,
      channels: OUTREACH_DEFINITION.channels,
      fallback: false,
      mandatory: false,
      urgent: false,
      owningModule: 'Product.TRK',
      native: false,
      feature: 'PRD-TRK-009',
      version: 1,
    });
    const { setChannelContentAsync } = await import('./notifications.js');
    await setChannelContentAsync({
      key: OUTREACH_DEFINITION.key, channel: 'sms', languageId: 1, text: OUTREACH_DEFINITION.sms, system: true,
    });
  }
  const templateRepo = repository('MessageTemplate');
  if (!await templateRepo.getOneAsync((t) => t.name === OUTREACH_DEFINITION.key)) {
    await templateRepo.insertAsync({
      name: OUTREACH_DEFINITION.key,
      subject: OUTREACH_DEFINITION.subject,
      body: OUTREACH_DEFINITION.body,
      storeId: 0,
      languageId: 1,
      limitedToStores: false,
      active: true,
      version: 1,
    });
  }
  return { installed: true };
}

/* ====================================================== who a notice would reach ======= */

/**
 * AC-TRK-009-01-01: the criteria the chapter names - shipment status or last event, outlet,
 * area, carrier, order status and a date range.
 */
export async function matchAsync({ criteria = {}, storeId = 1 }) {
  const {
    lastEventCode = null, shipmentStatus = null, outletId = null, area = null, carrier = null,
    orderStatus = null, from = null, to = null,
  } = criteria;
  const shipments = await repository('Shipment').getAllAsync();
  const orders = await repository('Order').getAllAsync();
  const events = await repository('TrackingEvent').getAllAsync((e) => e.status === 'Applied');
  const customers = await repository('Customer').getAllAsync();

  const matched = [];
  for (const shipment of shipments) {
    const order = orders.find((o) => Number(o.id) === Number(shipment.orderId));
    if (!order) continue;
    if (orderStatus && order.stage !== orderStatus && order.orderStatus !== orderStatus) continue;
    if (outletId && Number(order.pickupPointId) !== Number(outletId)) continue;
    if (carrier && shipment.carrier !== carrier) continue;
    if (area && String(order.deliveryArea ?? order.city ?? '') !== String(area)) continue;
    if (shipmentStatus === 'delivered' && !shipment.deliveredOnUtc) continue;
    if (shipmentStatus === 'in-transit' && (shipment.deliveredOnUtc || !shipment.shippedOnUtc)) continue;
    const mine = events
      .filter((e) => Number(e.shipmentId) === Number(shipment.id))
      .sort((a, b) => String(a.eventTimeUtc).localeCompare(String(b.eventTimeUtc)));
    const last = mine[mine.length - 1] ?? null;
    if (lastEventCode && last?.eventCode !== lastEventCode) continue;
    if (from && !(last && String(last.eventTimeUtc) >= String(from))) continue;
    if (to && !(last && String(last.eventTimeUtc) <= String(to))) continue;
    const customer = order.customerId ? customers.find((c) => Number(c.id) === Number(order.customerId)) : null;
    matched.push({
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: customer?.id ?? null,
      email: customer?.email ?? order.customerEmail ?? null,
      phone: customer?.phone ?? order.customerPhone ?? null,
      languageId: customer?.languageId ?? 1,
      lastEventCode: last?.eventCode ?? null,
    });
  }
  return {
    criteria,
    storeId,
    customers: matched.length,
    people: [...new Set(matched.map((m) => m.customerId ?? m.email).filter(Boolean))].length,
    sample: matched.slice(0, 5).map((m) => ({
      trackingNumber: m.trackingNumber, orderNumber: m.orderNumber, lastEventCode: m.lastEventCode, contact: m.email ?? m.phone,
    })),
    recipients: matched,
  };
}

export async function createNoticeAsync({
  name, text, criteria = {}, sendAtUtc = null, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.Outreach.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Outreach.CreateEditDelete' };
  }
  if (!text) return { ok: false, message: 'a notice needs text' };
  const notice = await noticeRepo().insertAsync({
    name,
    text,
    criteria,
    sendAtUtc,
    status: 'Draft',
    category: OUTREACH_CATEGORY,
    createdBy: actor?.email ?? null,
    counts: null,
  });
  return { ok: true, notice, status: 'Draft' };
}

/** AC-TRK-009-01-01: the preview, before anything is sent. */
export async function previewNoticeAsync({ noticeId, requester = null, storeId = 1 }) {
  if (requester && !await authorizeAsync('Tracking.Core.Outreach.CreateEditDelete', requester)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Outreach.CreateEditDelete' };
  }
  const notice = await noticeRepo().getByIdAsync(noticeId);
  if (!notice) return { ok: false, message: 'no such notice' };
  const match = await matchAsync({ criteria: notice.criteria ?? {}, storeId });
  return {
    ok: true,
    noticeId: Number(noticeId),
    status: notice.status,
    matchingCustomers: match.people,
    matchingShipments: match.customers,
    sample: match.sample,
    nothingSentYet: true,
  };
}

/* ============================================================== sending ================ */

/** AC-TRK-009-01-02: send now or schedule; each person gets it through the engine (SM-TRK-04). */
export async function sendNoticeAsync({
  noticeId, sendAtUtc = null, actor = null, gateways = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.Outreach.Send', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Outreach.Send' };
  }
  const notice = await noticeRepo().getByIdAsync(noticeId);
  if (!notice) return { ok: false, message: 'no such notice' };
  if (!['Draft', 'Scheduled'].includes(notice.status)) return { ok: false, message: `that notice is ${notice.status}` };

  if (sendAtUtc) {
    const scheduled = await noticeRepo().updateAsync({
      ...notice, status: 'Scheduled', sendAtUtc, scheduledBy: actor?.email ?? null,
    });
    await auditAsync({
      event: 'AUD-TRK-006',
      area: 'TRK',
      feature: 'PRD-TRK-009',
      entity: 'OutreachNotice',
      entityId: notice.id,
      actor: actor?.email ?? null,
      before: { status: notice.status },
      after: { status: 'Scheduled', sendAtUtc },
      storeId,
      note: 'service notice scheduled',
    });
    return {
      ok: true, status: 'Scheduled', notice: scheduled, sendAtUtc,
    };
  }
  return deliverNoticeAsync({
    notice, actor: actor?.email ?? null, gateways, storeId,
  });
}

async function deliverNoticeAsync({
  notice, actor = 'system', gateways = null, storeId = 1,
}) {
  await noticeRepo().updateAsync({ ...notice, status: 'Sending' });
  const match = await matchAsync({ criteria: notice.criteria ?? {}, storeId });
  const counts = {
    recipients: 0, sent: 0, suppressed: 0, held: 0,
  };
  const seen = new Set();
  for (const recipient of match.recipients) {
    const key = recipient.customerId ?? recipient.email ?? recipient.phone;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    counts.recipients += 1;
    const customer = recipient.customerId ? await repository('Customer').getByIdAsync(recipient.customerId) : null;
    const sent = await sendNotificationAsync({
      key: OUTREACH_DEFINITION.key,
      tokens: {
        'Notice.Text': notice.text,
        'Order.OrderNumber': recipient.orderNumber,
        'Shipment.TrackingNumber': recipient.trackingNumber,
      },
      recipients: [{
        customer,
        email: recipient.email,
        phone: recipient.phone,
        languageId: recipient.languageId,
      }],
      order: recipient.orderId ? await repository('Order').getByIdAsync(recipient.orderId) : null,
      storeId,
      occurrence: `notice-${notice.id}`,
      reference: `outreach-${notice.id}`,
      gateways: gateways ?? messageGateways,
    });
    for (const message of sent.messages ?? []) {
      if (['Sent', 'Pending', 'Delivered'].includes(message.status)) counts.sent += 1;
      else if (message.status === 'Held') counts.held += 1;
      else counts.suppressed += 1;
    }
  }
  const completed = await noticeRepo().updateAsync({
    ...notice, status: 'Completed', counts, sentOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-TRK-006',
    area: 'TRK',
    feature: 'PRD-TRK-009',
    entity: 'OutreachNotice',
    entityId: notice.id,
    actor,
    before: { status: notice.status },
    after: { status: 'Completed', counts },
    storeId,
    note: 'service notice sent',
  });
  return {
    ok: true,
    status: 'Completed',
    notice: completed,
    counts,
    category: OUTREACH_CATEGORY,
    preferencesApplied: true,
    reference: `outreach-${notice.id}`,
  };
}

/** AC-TRK-009-01-03: a scheduled notice is cancelled before its time and nothing is sent. */
export async function cancelNoticeAsync({ noticeId, actor = null, storeId = 1 }) {
  if (!await authorizeAsync('Tracking.Core.Outreach.Send', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Outreach.Send' };
  }
  const notice = await noticeRepo().getByIdAsync(noticeId);
  if (!notice) return { ok: false, message: 'no such notice' };
  if (!['Draft', 'Scheduled'].includes(notice.status)) return { ok: false, message: `that notice is ${notice.status}` };
  const cancelled = await noticeRepo().updateAsync({
    ...notice, status: 'Cancelled', cancelledBy: actor?.email ?? null, cancelledOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-TRK-006',
    area: 'TRK',
    feature: 'PRD-TRK-009',
    entity: 'OutreachNotice',
    entityId: notice.id,
    actor: actor?.email ?? null,
    before: { status: notice.status },
    after: { status: 'Cancelled' },
    storeId,
    note: 'service notice cancelled',
  });
  return { ok: true, status: 'Cancelled', notice: cancelled, nothingSent: true };
}

/** The scheduler: a notice whose time has come is sent. */
export async function runNoticeTaskAsync({ now = null, gateways = null, storeId = 1 } = {}) {
  const at = now ? new Date(now) : new Date();
  const due = await noticeRepo().getAllAsync((o) => o.status === 'Scheduled' && o.sendAtUtc && new Date(o.sendAtUtc) <= at);
  const sent = [];
  for (const notice of due) {
    sent.push(await deliverNoticeAsync({
      notice, actor: 'system', gateways, storeId,
    }));
  }
  return { ok: true, sent: sent.length, notices: sent };
}

export const noticesAsync = () => noticeRepo().getAllAsync();
export const noticeAsync = (id) => noticeRepo().getByIdAsync(id);

/* ============================================================== banners ================ */

/** AC-TRK-009-02-01: a banner with text, stores and a period (SM-TRK-05). */
export async function createBannerAsync({
  text, stores = [], fromUtc = null, toUtc = null, activate = false, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.Outreach.Send', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Outreach.Send' };
  }
  if (!text) return { ok: false, message: 'a banner needs text' };
  const now = new Date();
  const starts = fromUtc ? new Date(fromUtc) : now;
  const banner = await bannerRepo().insertAsync({
    text,
    stores: stores.map(Number),
    fromUtc: starts.toISOString(),
    toUtc,
    status: activate || starts <= now ? 'Active' : 'Scheduled',
    automatic: false,
    sourceId: null,
    createdBy: actor?.email ?? null,
  });
  await auditAsync({
    event: 'AUD-TRK-006',
    area: 'TRK',
    feature: 'PRD-TRK-009',
    entity: 'ServiceBanner',
    entityId: banner.id,
    actor: actor?.email ?? null,
    after: { status: banner.status, fromUtc: banner.fromUtc, toUtc },
    storeId,
    note: 'service banner created',
  });
  return { ok: true, banner, status: banner.status };
}

/** What the storefront and the tracking pages show at the top of the page right now. */
export async function activeBannersAsync({ storeId = 1, sourceCode = null, now = null } = {}) {
  const at = now ? new Date(now) : new Date();
  const all = await bannerRepo().getAllAsync();
  const live = [];
  for (const banner of all) {
    const started = !banner.fromUtc || new Date(banner.fromUtc) <= at;
    const ended = banner.toUtc && new Date(banner.toUtc) <= at;
    if (banner.status === 'Ended' || ended) {
      if (banner.status !== 'Ended' && ended) await bannerRepo().updateAsync({ ...banner, status: 'Ended' });
      continue;
    }
    if (!started) continue;
    if ((banner.stores ?? []).length && !banner.stores.includes(Number(storeId))) continue;
    if (banner.sourceId && sourceCode) {
      const source = await repository('TrackingSource').getByIdAsync(banner.sourceId);
      if (source?.code !== sourceCode) continue;
    }
    live.push({
      id: banner.id,
      text: banner.text,
      automatic: banner.automatic === true,
      sourceId: banner.sourceId ?? null,
      widgetZone: 'header_before',
      messageKey: banner.messageKey ?? null,
    });
  }
  return { storeId: Number(storeId), banners: live, widgetZone: 'header_before' };
}

export async function endBannerAsync({ bannerId, actor = null }) {
  const banner = await bannerRepo().getByIdAsync(bannerId);
  if (!banner) return { ok: false, message: 'no such banner' };
  const ended = await bannerRepo().updateAsync({ ...banner, status: 'Ended', endedOnUtc: new Date().toISOString() });
  return { ok: true, status: ended.status };
}

export const bannersAsync = () => bannerRepo().getAllAsync();

/**
 * AC-TRK-009-02-02: the source monitor. A source quiet for longer than its stall limit raises an
 * automatic banner with Trk.UpdatesDelayed, which is removed when its events resume.
 */
export async function runSourceMonitorAsync({ now = null, storeId = 1 } = {}) {
  const at = now ? new Date(now) : new Date();
  const sources = await repository('TrackingSource').getAllAsync();
  const out = { raised: 0, removed: 0, checked: sources.length, withoutStallLimit: 0 };
  for (const source of sources) {
    const limit = source.stallLimitMinutes ?? await getSettingAsync(`trk.source.${source.code}.stalllimitminutes`, storeId, null);
    if (limit === null || limit === undefined) { out.withoutStallLimit += 1; continue; }
    const quietFor = source.lastEventOnUtc
      ? (at.getTime() - new Date(source.lastEventOnUtc).getTime()) / 60000
      : Infinity;
    const existing = await bannerRepo().getOneAsync((b) => Number(b.sourceId) === Number(source.id) && b.status === 'Active');
    if (quietFor > Number(limit)) {
      if (existing) continue;
      await bannerRepo().insertAsync({
        text: resource('Trk.UpdatesDelayed'),
        messageKey: 'Trk.UpdatesDelayed',
        stores: [],
        fromUtc: at.toISOString(),
        toUtc: null,
        status: 'Active',
        automatic: true,
        sourceId: source.id,
      });
      out.raised += 1;
      continue;
    }
    if (existing) {
      await bannerRepo().updateAsync({ ...existing, status: 'Ended', endedOnUtc: at.toISOString() });
      out.removed += 1;
    }
  }
  return { ok: true, ...out, messageKey: 'Trk.UpdatesDelayed' };
}

/* ====================================================== TRK-008 the in-app feed ======== */

/** AC-TRK-008-01-01: the bell, in the header widget zone. */
export async function feedCountAsync({ customerId }) {
  const rows = await feedRepo().getAllAsync((n) => Number(n.customerId) === Number(customerId));
  return {
    customerId: Number(customerId),
    unread: rows.filter((n) => (n.status ?? (n.read === true ? 'Read' : 'Unread')) === 'Unread').length,
    widgetZone: 'header_links_after',
  };
}

/** AC-TRK-008-01-02: the list, newest first, with the link to the order or shipment. */
export async function feedAsync({ customerId }) {
  const rows = await feedRepo().getAllAsync((n) => Number(n.customerId) === Number(customerId)
    && (n.status ?? 'Unread') !== 'Cleared');
  return {
    customerId: Number(customerId),
    notifications: rows
      .slice()
      .sort((a, b) => String(b.createdOnUtc).localeCompare(String(a.createdOnUtc)) || b.id - a.id)
      .map((n) => ({
        id: n.id,
        text: n.text,
        at: n.createdOnUtc,
        link: n.link ?? (n.orderId ? `/account/orders/${n.orderNumber ?? n.orderId}` : (n.trackingNumber ? `/track/${n.trackingNumber}` : null)),
        status: n.status ?? (n.read === true ? 'Read' : 'Unread'),
        definitionKey: n.definitionKey ?? null,
      })),
    newestFirst: true,
  };
}

export async function openNotificationAsync({ notificationId, customerId }) {
  const row = await feedRepo().getByIdAsync(notificationId);
  if (!row || Number(row.customerId) !== Number(customerId)) return { ok: false, message: 'no such notification' };
  const saved = await feedRepo().updateAsync({
    ...row, status: 'Read', read: true, readOnUtc: new Date().toISOString(),
  });
  return {
    ok: true,
    notification: { id: saved.id, status: saved.status, link: saved.link ?? null },
    unread: (await feedCountAsync({ customerId })).unread,
  };
}

/** AC-TRK-008-01-03: a cleared notification is no longer listed; the rest stay until cleared. */
export async function clearNotificationAsync({ notificationId, customerId }) {
  const row = await feedRepo().getByIdAsync(notificationId);
  if (!row || Number(row.customerId) !== Number(customerId)) return { ok: false, message: 'no such notification' };
  const saved = await feedRepo().updateAsync({
    ...row, status: 'Cleared', clearedOnUtc: new Date().toISOString(),
  });
  return { ok: true, status: saved.status, listed: false };
}
