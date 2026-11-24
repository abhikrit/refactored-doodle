// ORD - order numbering, stages and the order console.
//
// ORD-007 order numbering uses the native OrderSettings.CustomOrderNumberMask; ORD-002 holds the
// configurable stage model (OrderStageDefinition / Transition are new entities in the real build).
// Only the transitions in the state model are allowed; anything else is rejected and logged
// (module chapters section 8.2).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { publishAsync } from '../../../core/events.js';
import { runProviders } from '../../../core/providers.js';

const orderRepo = () => repository('Order');

export const STAGES = [
  { stage: 'Placed', orderStatus: 'Pending', next: ['Accepted', 'Cancelled'] },
  { stage: 'Accepted', orderStatus: 'Processing', next: ['Packed', 'Cancelled'] },
  { stage: 'Packed', orderStatus: 'Processing', next: ['Dispatched', 'ReadyForPickup', 'Cancelled'] },
  { stage: 'Dispatched', orderStatus: 'Processing', next: ['Delivered'] },
  { stage: 'ReadyForPickup', orderStatus: 'Processing', next: ['Delivered'] },
  { stage: 'Delivered', orderStatus: 'Complete', next: [] },
  { stage: 'Cancelled', orderStatus: 'Cancelled', next: [] },
];

export async function initialStageAsync() {
  return { stage: 'Placed', orderStatus: 'Pending' };
}

export async function nextOrderNumberAsync(storeId = 1) {
  const mask = await getSettingAsync('ordersettings.customordernumbermask', storeId, '{ID:000000}');
  const count = (await orderRepo().getAllAsync()).length + 1;
  return mask
    .replace('{YYYY}', String(new Date().getUTCFullYear()))
    .replace(/\{ID:(0+)\}/, (_, zeros) => String(count).padStart(zeros.length, '0'))
    .replace('{ID}', String(count));
}

/** Guarded stage change: the transition must exist, and IC-CHK-07 order-action guards run first. */
export async function advanceStageAsync({
  orderNumber, to, actor = 'admin', actorRole = 'Administrators', reason = '',
}) {
  const order = await orderRepo().getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) throw new Error('order not found');
  const current = STAGES.find((s) => s.stage === order.stage);
  if (!current || !current.next.includes(to)) {
    await auditAsync({
      event: 'AUD-ORD-002-02',
      area: 'ORD',
      feature: 'PRD-ORD-002',
      entity: 'Order',
      entityId: order.id,
      actor,
      actorRole,
      outcome: 'rejected',
      before: { stage: order.stage },
      after: { stage: to },
      note: 'transition not in the state model (module chapter section 8.2: any other transition is rejected and logged)',
    });
    return { ok: false, message: `${order.stage} -> ${to} is not an allowed transition`, allowed: current?.next ?? [] };
  }
  const guards = await runProviders('IC-CHK-07', 'firstFail', { order, to });
  const refused = guards.find((g) => g.result && g.result.ok === false);
  if (refused) return { ok: false, message: refused.result.message };

  const target = STAGES.find((s) => s.stage === to);
  const updated = await orderRepo().updateAsync({
    ...order,
    stage: to,
    orderStatus: target.orderStatus,
    shippingStatus: to === 'Dispatched' ? 'Shipped' : to === 'Delivered' ? 'Delivered' : to === 'ReadyForPickup' ? 'ReadyForPickup' : order.shippingStatus,
  });
  await publishAsync('OrderStageChangedEvent', { order: updated, from: order.stage, to });
  await auditAsync({
    event: 'AUD-ORD-002-01',
    area: 'ORD',
    feature: 'PRD-ORD-002',
    entity: 'Order',
    entityId: order.id,
    actor,
    actorRole,
    before: { stage: order.stage, orderStatus: order.orderStatus },
    after: { stage: to, orderStatus: target.orderStatus },
    note: reason || 'stage advanced from the order console (ORD-001)',
  });
  return { ok: true, order: updated };
}

export async function ordersAsync(filter = {}) {
  const rows = await orderRepo().getAllAsync((o) => (
    (!filter.customerId || o.customerId === Number(filter.customerId))
    && (!filter.vendorId || o.vendorId === Number(filter.vendorId))
    && (!filter.checkoutReference || o.checkoutReference === filter.checkoutReference)
    && (!filter.stage || o.stage === filter.stage)
  ));
  return rows.slice().sort((a, b) => b.id - a.id);
}

export async function orderAsync(orderNumber) {
  const order = await orderRepo().getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return null;
  const [items, shipments, pickupCode, point, siblings] = await Promise.all([
    repository('OrderItem').getAllAsync((i) => i.orderId === order.id),
    repository('Shipment').getAllAsync((s) => s.orderId === order.id),
    repository('PickupCode').getOneAsync((p) => p.orderId === order.id),
    order.pickupPointId ? repository('StorePickupPoint').getByIdAsync(order.pickupPointId) : null,
    orderRepo().getAllAsync((o) => o.checkoutReference === order.checkoutReference),
  ]);
  return {
    ...order,
    items,
    shipments,
    pickupPoint: point,
    hasPickupCode: Boolean(pickupCode),
    pickupCodeUsed: pickupCode?.used ?? null,
    siblings: siblings.filter((s) => s.id !== order.id).map((s) => ({
      orderNumber: s.orderNumber, vendorName: s.vendorName, total: s.total, stage: s.stage,
    })),
    allowedTransitions: STAGES.find((s) => s.stage === order.stage)?.next ?? [],
  };
}
