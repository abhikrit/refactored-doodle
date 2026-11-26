// PRD-TRK-001 buyer shipment tracking, PRD-TRK-011 the guest order-status lookup and
// PRD-TRK-010 seller shipment visibility.
//
// BR-TRK-030: a page without sign-in shows no customer name, address, phone or e-mail - a masked
// contact at most - and repeated lookups from one client beyond the configured number need a
// CAPTCHA (SEC-013). The timeline itself always comes from the TRK-002 hub.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { resource } from '../../../core/messages.js';
import { lookupAsync } from '../../product-sec/services/captcha.js';
import { timelineAsync } from './event-hub.js';
import { signToken } from './preferences.js';

const shareRepo = () => repository('ShareLink');

export const maskContact = (value) => {
  const text = String(value ?? '');
  if (!text) return null;
  if (text.includes('@')) {
    const [name, domain] = text.split('@');
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
  }
  return `${'*'.repeat(Math.max(0, text.length - 3))}${text.slice(-3)}`;
};

const shipmentByReferenceAsync = (reference) => repository('Shipment')
  .getOneAsync((s) => s.trackingNumber === reference
    || s.shipmentNumber === reference
    || s.s10Reference === reference
    || s.waybill === reference);

/* ====================================================== the public tracking page ======= */

/**
 * AC-TRK-001-01-01 to 01-05: the timeline for anyone with the number, newest first, with the
 * expected delivery range, no personal data, a CAPTCHA after the configured number of lookups,
 * and a plain message when the parcel has no events or does not exist.
 */
export async function publicTrackingAsync({
  reference, session = 'anonymous', captchaResponse = null, storeId = 1,
}) {
  const gate = await lookupAsync({ session, response: captchaResponse, storeId });
  if (gate.captchaRequired && gate.ok !== true) {
    return {
      ok: false,
      captchaRequired: true,
      lookups: gate.lookups,
      threshold: gate.threshold,
      messageKey: gate.messageKey ?? 'Sec.CaptchaFailed',
      filter: gate.filter,
      rule: 'BR-TRK-030',
    };
  }

  const shipment = await shipmentByReferenceAsync(reference);
  if (!shipment) {
    return {
      ok: false,
      found: false,
      messageKey: 'Trk.TrackNotFound',
      message: resource('Trk.TrackNotFound'),
      captchaRequired: gate.captchaRequired === true,
    };
  }
  const order = await repository('Order').getByIdAsync(shipment.orderId);
  const { events } = await timelineAsync(shipment.trackingNumber);
  const showAgentContact = await getSettingAsync('trk.public.showagentcontact', storeId, false);
  const refreshSeconds = await getSettingAsync('trk.public.refreshintervalseconds', storeId, null);

  if (events.length === 0) {
    return {
      ok: true,
      found: true,
      reference,
      events: [],
      messageKey: 'Trk.NoEventsYet',
      message: resource('Trk.NoEventsYet'),
      createdOnUtc: shipment.createdOnUtc,
      refreshSeconds,
      lastUpdated: resource('Trk.LastUpdated', { 0: new Date().toLocaleString() }),
    };
  }

  return {
    ok: true,
    found: true,
    reference,
    events: [...events].reverse(),
    newestFirst: true,
    expectedDeliveryRange: shipment.expectedDeliveryRange ?? order?.expectedDeliveryRange ?? null,
    agentContact: showAgentContact === true ? shipment.agentContact ?? null : null,
    refreshSeconds,
    refreshLabel: resource('Trk.Refresh'),
    lastUpdated: resource('Trk.LastUpdated', { 0: new Date().toLocaleString() }),
    personalDataShown: false,
    rule: 'BR-TRK-030',
    lookups: gate.lookups,
    captchaRequired: gate.captchaRequired === true,
  };
}

/**
 * AC-TRK-001-03-02: the refresh. A carrier that supports an on-demand pull is asked no more
 * often than the configured minimum for one shipment.
 */
export async function refreshTrackingAsync({ reference, session = 'anonymous', storeId = 1 }) {
  const shipment = await shipmentByReferenceAsync(reference);
  if (!shipment) return { ok: false, messageKey: 'Trk.TrackNotFound', message: resource('Trk.TrackNotFound') };
  const minimumMinutes = await getSettingAsync('trk.public.minimumpullintervalminutes', storeId, null);
  const last = shipment.lastCarrierPullOnUtc ? new Date(shipment.lastCarrierPullOnUtc) : null;
  const due = minimumMinutes === null
    ? true
    : !last || (Date.now() - last.getTime()) / 60000 >= Number(minimumMinutes);
  if (due) await repository('Shipment').updateAsync({ ...shipment, lastCarrierPullOnUtc: new Date().toISOString() });
  const { events } = await timelineAsync(shipment.trackingNumber);
  return {
    ok: true,
    reference,
    events: [...events].reverse(),
    carrierPullRequested: due,
    minimumPullIntervalMinutes: minimumMinutes,
    lastUpdated: resource('Trk.LastUpdated', { 0: new Date().toLocaleString() }),
    refreshLabel: resource('Trk.Refresh'),
  };
}

/* ============================================================== share links ============ */

/** AC-TRK-001-02-01 and 02-02: a signed link with an expiry, revocable, audited (SM-TRK-06). */
export async function createShareLinkAsync({
  reference, customerId, storeId = 1,
}) {
  const shipment = await shipmentByReferenceAsync(reference);
  if (!shipment) return { ok: false, messageKey: 'Trk.TrackNotFound', message: resource('Trk.TrackNotFound') };
  const order = await repository('Order').getByIdAsync(shipment.orderId);
  if (!order || Number(order.customerId) !== Number(customerId)) {
    return { ok: false, denied: true, message: 'a share link is created by the owner of the shipment' };
  }
  const hours = await getSettingAsync('trk.public.sharelinkexpiryhours', storeId, null);
  const token = signToken(`share:${shipment.id}:${Date.now()}`);
  const row = await shareRepo().insertAsync({
    shipmentId: shipment.id,
    reference: shipment.trackingNumber,
    token,
    status: 'Active',
    createdBy: Number(customerId),
    expiresOnUtc: hours === null ? null : new Date(Date.now() + Number(hours) * 3600000).toISOString(),
  });
  await auditAsync({
    event: 'AUD-TRK-007',
    area: 'TRK',
    feature: 'PRD-TRK-001',
    entity: 'ShareLink',
    entityId: row.id,
    actor: String(customerId),
    after: { shipmentId: shipment.id, status: 'Active', expiresOnUtc: row.expiresOnUtc },
    storeId,
    note: 'tracking share link created',
  });
  return {
    ok: true,
    link: `/track/share/${token}`,
    token,
    status: 'Active',
    expiresOnUtc: row.expiresOnUtc,
    expiryConfigured: hours !== null,
    shareLink: row,
  };
}

export async function revokeShareLinkAsync({ token, customerId, storeId = 1 }) {
  const row = await shareRepo().getOneAsync((s) => s.token === token);
  if (!row) return { ok: false, message: 'no such link' };
  if (Number(row.createdBy) !== Number(customerId)) return { ok: false, denied: true, message: 'only the owner revokes a link' };
  const saved = await shareRepo().updateAsync({ ...row, status: 'Revoked', revokedOnUtc: new Date().toISOString() });
  await auditAsync({
    event: 'AUD-TRK-007',
    area: 'TRK',
    feature: 'PRD-TRK-001',
    entity: 'ShareLink',
    entityId: row.id,
    actor: String(customerId),
    before: { status: 'Active' },
    after: { status: 'Revoked' },
    storeId,
    note: 'tracking share link revoked',
  });
  return { ok: true, status: saved.status };
}

/** Opening a share link shows the public timeline only, never account details. */
export async function openShareLinkAsync({ token, storeId = 1 }) {
  const row = await shareRepo().getOneAsync((s) => s.token === token);
  if (!row) {
    return {
      ok: false, messageKey: 'Trk.ShareLinkExpired', message: resource('Trk.ShareLinkExpired'),
    };
  }
  const expired = row.expiresOnUtc && new Date(row.expiresOnUtc) <= new Date();
  if (row.status !== 'Active' || expired) {
    if (expired && row.status === 'Active') await shareRepo().updateAsync({ ...row, status: 'Expired' });
    return {
      ok: false,
      status: expired ? 'Expired' : row.status,
      messageKey: 'Trk.ShareLinkExpired',
      message: resource('Trk.ShareLinkExpired'),
    };
  }
  const view = await publicTrackingAsync({ reference: row.reference, session: `share:${token}`, storeId });
  return {
    ...view, shared: true, status: 'Active', accountDetails: null,
  };
}

export const shareLinksAsync = (customerId = null) => shareRepo()
  .getAllAsync((s) => customerId === null || Number(s.createdBy) === Number(customerId));

/* ====================================================== the owner's own order ========== */

/** AC-TRK-001-04-01 and 04-02: the owner sees the timeline on the order, and the latest event
 *  with the expected range on the orders list. */
export async function myOrderTrackingAsync({ orderNumber, customerId, storeId = 1 }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  if (Number(order.customerId) !== Number(customerId)) {
    return { ok: false, denied: true, message: 'the order id path to tracking is for the owner only' };
  }
  const show = await getSettingAsync('shippingsettings.displayshipmenteventstocustomers', storeId, true);
  const shipments = await repository('Shipment').getAllAsync((s) => Number(s.orderId) === Number(order.id));
  const rows = [];
  for (const shipment of shipments) {
    const { events } = await timelineAsync(shipment.trackingNumber);
    rows.push({
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      expectedDeliveryRange: shipment.expectedDeliveryRange ?? null,
      events: show === true ? [...events].reverse() : [],
      shownThrough: 'the hub tracker on the native shipment details',
    });
  }
  return {
    ok: true,
    orderNumber,
    displayShipmentEventsToCustomers: show === true,
    shipments: rows,
  };
}

export async function myOrdersTrackingAsync({ customerId, storeId = 1 }) {
  const orders = await repository('Order').getAllAsync((o) => Number(o.customerId) === Number(customerId));
  const rows = [];
  for (const order of orders) {
    const shipments = await repository('Shipment').getAllAsync((s) => Number(s.orderId) === Number(order.id));
    let latest = null;
    for (const shipment of shipments) {
      const { events } = await timelineAsync(shipment.trackingNumber);
      const last = events[events.length - 1];
      if (last && (!latest || String(last.at) > String(latest.at))) latest = last;
    }
    rows.push({
      orderNumber: order.orderNumber,
      stage: order.stage ?? null,
      latestEvent: latest ? { name: latest.displayName, at: latest.at, location: latest.location } : null,
      expectedDeliveryRange: shipments[0]?.expectedDeliveryRange ?? order.expectedDeliveryRange ?? null,
    });
  }
  return { ok: true, orders: rows, storeId };
}

/* ====================================================== TRK-011 guest lookup =========== */

/**
 * AC-TRK-011-01-01 to 01-03: an order number with the phone or e-mail of that order, nothing
 * beyond a masked contact, the same message whichever field is wrong, and a CAPTCHA after the
 * configured number of failures.
 */
export async function guestLookupAsync({
  orderNumber, contact, session = 'anonymous', captchaResponse = null, storeId = 1,
}) {
  const gate = await lookupAsync({ session, response: captchaResponse, storeId });
  if (gate.captchaRequired && gate.ok !== true) {
    return {
      ok: false,
      captchaRequired: true,
      lookups: gate.lookups,
      threshold: gate.threshold,
      messageKey: gate.messageKey ?? 'Sec.CaptchaFailed',
      rule: 'BR-TRK-030',
    };
  }
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  const customer = order?.customerId ? await repository('Customer').getByIdAsync(order.customerId) : null;
  const matches = order && [order.customerEmail, order.customerPhone, customer?.email, customer?.phone]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase() === String(contact ?? '').toLowerCase());
  if (!order || !matches) {
    return {
      ok: false,
      messageKey: 'Trk.GuestLookupFailed',
      message: resource('Trk.GuestLookupFailed'),
      whichFieldIsWrong: null,
      captchaRequired: gate.captchaRequired === true,
      lookups: gate.lookups,
    };
  }
  const shipments = await repository('Shipment').getAllAsync((s) => Number(s.orderId) === Number(order.id));
  const rows = [];
  for (const shipment of shipments) {
    const { events } = await timelineAsync(shipment.trackingNumber);
    rows.push({
      trackingNumber: shipment.trackingNumber,
      shippedOnUtc: shipment.shippedOnUtc ?? null,
      deliveredOnUtc: shipment.deliveredOnUtc ?? null,
      events: [...events].reverse(),
    });
  }
  return {
    ok: true,
    orderNumber: order.orderNumber,
    status: order.stage ?? order.orderStatus ?? null,
    maskedContact: maskContact(contact),
    shipments: rows,
    personalDataShown: false,
    rule: 'BR-TRK-030',
    plugin: 'the licensed guest order-status plugin is not installed in the prototype; this is the custom fallback (decision P-2)',
  };
}

/* ====================================================== TRK-010 seller visibility ====== */

/** AC-TRK-010-01-01, 01-02 and 02-01: a seller sees the shipments of their own products only. */
export async function sellerShipmentsAsync({ vendorId, requester = null, storeId = 1 }) {
  if (requester && !await authorizeAsync('Orders.ShipmentsView', requester)) {
    return { ok: false, denied: true, permission: 'Orders.ShipmentsView' };
  }
  const items = await repository('OrderItem').getAllAsync((i) => Number(i.vendorId) === Number(vendorId));
  const orderIds = [...new Set(items.map((i) => Number(i.orderId)))];
  const shipments = await repository('Shipment').getAllAsync((s) => orderIds.includes(Number(s.orderId)));
  const rows = [];
  for (const shipment of shipments) {
    const order = await repository('Order').getByIdAsync(shipment.orderId);
    rows.push({
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      orderNumber: order?.orderNumber ?? null,
      shippedOnUtc: shipment.shippedOnUtc ?? null,
      readyForPickupOnUtc: order?.readyForPickupOnUtc ?? null,
      deliveredOnUtc: shipment.deliveredOnUtc ?? null,
    });
  }
  return {
    ok: true, vendorId: Number(vendorId), shipments: rows, scopedBy: 'the seller\'s own products', storeId,
  };
}

export async function sellerShipmentAsync({
  shipmentId, vendorId, requester = null, storeId = 1,
}) {
  if (requester && !await authorizeAsync('Orders.ShipmentsView', requester)) {
    return { ok: false, denied: true, permission: 'Orders.ShipmentsView' };
  }
  const shipment = await repository('Shipment').getByIdAsync(shipmentId);
  if (!shipment) return { ok: false, message: 'no such shipment' };
  const items = await repository('OrderItem').getAllAsync((i) => Number(i.orderId) === Number(shipment.orderId));
  const mine = items.some((i) => Number(i.vendorId) === Number(vendorId));
  if (!mine) {
    // the native access check: a seller may not open another seller's shipment
    return {
      ok: false,
      denied: true,
      check: 'HasAccessToShipmentAsync',
      message: 'that shipment belongs to another seller',
    };
  }
  const show = await getSettingAsync('shippingsettings.displayshipmenteventstostoreowner', storeId, true);
  const { events } = await timelineAsync(shipment.trackingNumber);
  return {
    ok: true,
    shipmentId: Number(shipmentId),
    trackingNumber: shipment.trackingNumber,
    displayShipmentEventsToStoreOwner: show === true,
    events: show === true ? [...events].reverse() : [],
    shownThrough: 'the hub tracker',
  };
}
