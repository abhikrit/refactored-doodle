// TRK - tracking events, the tracking page and the message log.
//
// TRK-001 shipment tracking for buyers, TRK-002 the tracking update hub, TRK-007 message
// delivery records, TRK-011 order status check for guests. Messages go out through
// core/messages.js (TRK-005) to the mock gateways.

import { repository } from '../../../core/repository.js';
import { deliveriesAsync } from '../../../core/messages.js';

const eventRepo = () => repository('TrackingEvent');

export async function addTrackingEventAsync({
  trackingNumber, code, description, location, sourceSystem = 'prototype',
}) {
  return eventRepo().insertAsync({
    trackingNumber,
    code,
    description,
    location,
    sourceSystem,
    occurredOnUtc: new Date().toISOString(),
  });
}

export async function trackAsync(trackingNumber) {
  const events = await eventRepo().getAllAsync((e) => e.trackingNumber === trackingNumber);
  const shipment = await repository('Shipment').getOneAsync((s) => s.trackingNumber === trackingNumber);
  const order = shipment ? await repository('Order').getByIdAsync(shipment.orderId) : null;
  return {
    trackingNumber,
    found: Boolean(shipment),
    carrier: shipment?.carrier ?? null,
    order: order
      ? {
        orderNumber: order.orderNumber, stage: order.stage, fulfilment: order.fulfilment, vendorName: order.vendorName,
      }
      : null,
    events: events.slice().sort((a, b) => b.occurredOnUtc.localeCompare(a.occurredOnUtc) || b.id - a.id),
    feature: 'PRD-TRK-001',
  };
}

/** TRK-011: a guest checks an order with the order number and the e-mail or phone used. */
export async function guestStatusAsync({ orderNumber, contact }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { found: false, feature: 'PRD-TRK-011' };
  const matches = [order.customerEmail, order.billingAddress?.phone].filter(Boolean)
    .some((v) => String(v).toLowerCase() === String(contact ?? '').toLowerCase());
  if (!matches) {
    return { found: false, reason: 'The order number and contact details do not match.', feature: 'PRD-TRK-011' };
  }
  const shipment = await repository('Shipment').getOneAsync((s) => s.orderId === order.id);
  return {
    found: true,
    orderNumber: order.orderNumber,
    stage: order.stage,
    paymentStatus: order.paymentStatus,
    trackingNumber: shipment?.trackingNumber ?? null,
    feature: 'PRD-TRK-011',
  };
}

export async function messageLogAsync(filter) {
  return deliveriesAsync(filter);
}

export async function trackingHubAsync() {
  const rows = await eventRepo().getAllAsync();
  return rows.slice().sort((a, b) => b.occurredOnUtc.localeCompare(a.occurredOnUtc) || b.id - a.id);
}
