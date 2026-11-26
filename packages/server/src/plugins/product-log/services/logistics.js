// LOG - shipping methods, delivery fees, outlets, shipments and handover.
//
// LOG-001 methods and rates, LOG-002 delivery fee rules (the fee engine is the active rate
// method), LOG-003 pickup points and outlets, LOG-004 coverage, LOG-010 shipments,
// LOG-012 proof of delivery, which calls CHK-012 for the pickup code (IC-CHK-09).
// Carrier calls go to the mocks (P-3). LOG-011/022/023/024/032 are held by FG-06.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { auditAsync } from '../../../core/audit.js';
import { publishAsync } from '../../../core/events.js';
import { mockRegistry } from '@product/mocks';
import { verifyPickupCodeAsync, markPickupCodeUsedAsync } from '../../product-chk/services/checkout.js';
import { advanceStageAsync } from '../../product-ord/services/orders.js';
import { addTrackingEventAsync } from '../../product-trk/services/tracking.js';

export async function shippingMethodsAsync() {
  return repository('ShippingMethod').getAllAsync();
}

export async function pickupPointsAsync() {
  return repository('StorePickupPoint').getAllAsync();
}

export async function deliverySlotsAsync() {
  return repository('DeliverySlotDefinition').getAllAsync();
}

/**
 * The LOG-002 fee engine. A delivery fee is calculated per seller group, so it stays with that
 * seller's sub-order (BR-CHK-007 exception). Pickup at an outlet carries no delivery fee.
 */
export async function quoteFulfilmentAsync({ cart, storeId = 1 }) {
  const freeOver = await getSettingAsync('shippingsettings.freeshippingoverxvalue', storeId, null);
  const currency = cart.items[0]?.product?.currency ?? 'USD';
  const groups = new Map();
  for (const item of cart.items) {
    const key = `${item.vendorId}|${item.fulfilment}|${item.pickupPointId ?? 0}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key, vendorId: item.vendorId, vendorName: item.product.vendor?.name ?? null, fulfilment: item.fulfilment, pickupPointId: item.pickupPointId, weightKg: 0, subtotal: 0, lines: 0,
      });
    }
    const g = groups.get(key);
    g.weightKg += (item.product.weightKg ?? 0) * item.quantity;
    g.subtotal += item.subtotal;
    g.lines += 1;
  }
  const perGroup = [...groups.values()].map((g) => {
    if (g.fulfilment === 'pickup') {
      return {
        ...g, fee: 0, basis: 'Pickup at an outlet - no delivery fee (LOG-003)', basisText: 'Collection at an outlet - no delivery fee.',
      };
    }
    if (freeOver != null && g.subtotal >= Number(freeOver)) {
      return {
        ...g,
        fee: 0,
        basis: `Free delivery over ${freeOver} (ShippingSettings.FreeShippingOverXValue)`,
        basisText: `Free delivery on orders over ${freeOver}.`,
      };
    }
    // weight band - the real fee table (DeliveryFeeTable) is a new entity owned by LOG-002
    const base = 3.5;
    const perKg = 0.45;
    const fee = Number((base + perKg * g.weightKg).toFixed(2));
    return {
      ...g,
      fee,
      basis: `Weight band: base ${base} + ${perKg}/kg x ${g.weightKg.toFixed(2)} kg (LOG-002 fee engine; the client fee table is not stated in source)`,
      basisText: `Weight ${g.weightKg.toFixed(2)} kg - a base fee plus a charge for each kilogram.`,
    };
  });
  return {
    perGroup,
    totalFee: Number(perGroup.reduce((s, g) => s + g.fee, 0).toFixed(2)),
    currency,
    features: ['PRD-LOG-001', 'PRD-LOG-002', 'PRD-LOG-003'],
  };
}

/** BR-CHK-010: slot capacity is checked and reserved under ILocker key chk-slot-{SlotId}-{Date}. */
export async function reserveSlotAsync({ deliverySlotId, date }) {
  return withLockAsync(lockKey.deliverySlot(deliverySlotId, date), async () => {
    const slot = await repository('DeliverySlotDefinition').getByIdAsync(deliverySlotId);
    if (!slot) return { ok: false, message: 'unknown delivery window' };
    const taken = await repository('DeliverySlotReservation').countAsync((r) => r.deliverySlotId === Number(deliverySlotId) && r.date === date && !r.released);
    if (taken >= slot.capacity) return { ok: false, message: 'slot full' };
    const row = await repository('DeliverySlotReservation').insertAsync({ deliverySlotId: Number(deliverySlotId), date, released: false });
    return { ok: true, reservationId: row.id, slot: slot.name, remaining: slot.capacity - taken - 1 };
  });
}

/** LOG-010: create a shipment, label and tracking number through the carrier adapter (mock). */
export async function createShipmentAsync({ orderNumber, carrier = null, actor = 'logistics' }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) throw new Error('order not found');
  const items = await repository('OrderItem').getAllAsync((i) => i.orderId === order.id);
  const chosen = carrier ?? (await getSettingAsync('log.country.carriers', order.storeId, ['DHL']))[0];
  const adapter = mockRegistry[chosen];
  if (!adapter) throw new Error(`carrier ${chosen} has no adapter`);
  const created = await adapter.createShipmentAsync({
    service: order.fulfilment === 'pickup' ? 'Pickup' : 'Standard',
    weightKg: items.reduce((s, i) => s + i.quantity, 0),
    to: order.shippingAddress ?? order.pickupPointId,
  });
  const shipment = await repository('Shipment').insertAsync({
    orderId: order.id,
    orderNumber,
    carrier: chosen,
    trackingNumber: created.trackingNumber,
    labelUrl: created.labelUrl,
    totalWeight: items.reduce((s, i) => s + i.quantity, 0),
    shippedOnUtc: null,
    deliveredOnUtc: null,
    items: items.map((i) => ({ orderItemId: i.id, quantity: i.quantity })),
  });
  await auditAsync({
    event: 'AUD-LOG-010-01',
    area: 'LOG',
    feature: 'PRD-LOG-010',
    entity: 'Shipment',
    entityId: shipment.id,
    actor,
    actorRole: 'Logistics',
    after: { trackingNumber: created.trackingNumber, carrier: chosen },
  });
  await addTrackingEventAsync({
    trackingNumber: created.trackingNumber, code: 'ShipmentCreated', description: 'Shipment created and label printed', location: 'Origin',
  });
  return shipment;
}

export async function dispatchShipmentAsync({ trackingNumber, actor = 'logistics' }) {
  const shipment = await repository('Shipment').getOneAsync((s) => s.trackingNumber === trackingNumber);
  if (!shipment) throw new Error('shipment not found');
  const order = await repository('Order').getByIdAsync(shipment.orderId);
  await repository('Shipment').updateAsync({ ...shipment, shippedOnUtc: new Date().toISOString() });
  const to = order.fulfilment === 'pickup' ? 'ReadyForPickup' : 'Dispatched';
  const result = await advanceStageAsync({ orderNumber: order.orderNumber, to, actor, actorRole: 'Logistics' });
  await addTrackingEventAsync({
    trackingNumber, code: to === 'ReadyForPickup' ? 'ArrivedAtOutlet' : 'Dispatched', description: to === 'ReadyForPickup' ? 'Arrived at the collection outlet' : 'Dispatched from the origin', location: 'In network',
  });
  await publishAsync('ShipmentDispatchedEvent', { shipment, order });
  return { shipment, stage: result };
}

/**
 * LOG-012 handover: proof of delivery. For a pickup, the step calls CHK-012 to check the code
 * (IC-CHK-09), stores the proof, advances the order and only then marks the code used
 * (BR-CHK-016).
 */
export async function handoverAsync({
  orderNumber, code = null, pickupPointId = null, proof = 'signature', actor = 'agent',
}) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) throw new Error('order not found');
  if (order.fulfilment === 'pickup') {
    const check = await verifyPickupCodeAsync({ orderNumber, code, pickupPointId: pickupPointId ?? order.pickupPointId });
    if (!check.ok) {
      await auditAsync({
        event: 'AUD-CHK-012-02',
        area: 'CHK',
        feature: 'PRD-CHK-012',
        entity: 'Order',
        entityId: order.id,
        actor,
        actorRole: 'Agent',
        outcome: 'rejected',
        note: check.message,
      });
      return { ok: false, message: check.message };
    }
  }
  const pod = await repository('ProofOfDelivery').insertAsync({
    orderId: order.id,
    orderNumber,
    method: order.fulfilment === 'pickup' ? 'pickup-code' : proof,
    capturedBy: actor,
    capturedOnUtc: new Date().toISOString(),
  });
  const shipment = await repository('Shipment').getOneAsync((s) => s.orderId === order.id);
  if (shipment) {
    await repository('Shipment').updateAsync({ ...shipment, deliveredOnUtc: new Date().toISOString() });
    await addTrackingEventAsync({
      trackingNumber: shipment.trackingNumber, code: 'Delivered', description: order.fulfilment === 'pickup' ? 'Collected by the customer at the outlet' : 'Delivered', location: 'Destination',
    });
  }
  const stage = await advanceStageAsync({ orderNumber, to: 'Delivered', actor, actorRole: 'Agent' });
  if (order.fulfilment === 'pickup') await markPickupCodeUsedAsync(orderNumber);
  await auditAsync({
    event: 'AUD-LOG-012-01',
    area: 'LOG',
    feature: 'PRD-LOG-012',
    entity: 'ProofOfDelivery',
    entityId: pod.id,
    actor,
    actorRole: 'Agent',
    after: { method: pod.method, orderNumber },
  });
  return { ok: true, proofOfDelivery: pod, stage };
}

export async function shipmentsAsync() {
  const rows = await repository('Shipment').getAllAsync();
  return rows.slice().reverse();
}
