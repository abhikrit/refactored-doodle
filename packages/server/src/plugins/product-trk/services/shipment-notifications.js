// PRD-TRK-012 shipment and pickup event notifications.
//
// The messages a parcel produces: on its way, out for delivery, a failed attempt, ready for
// collection, a reminder before the deadline, and uncollected. Each one is a definition of the
// TRK-005 engine, so the client decides the channels and the wording; TRK-012 decides which
// event sends which message, and with what in it.
// BR-TRK-022: the same event applied twice sends nothing a second time.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { messageGateways } from '@product/mocks';
import {
  sendNotificationAsync, definitionAsync, setChannelContentAsync,
} from './notifications.js';
import { installTemplatesAsync } from './email-templates.js';

/** The templates TRK-012 adds to the native set (AC-TRK-012-01-02, 03-01, 04-01, 04-02). */
export const TRK012_DEFINITIONS = [
  {
    key: 'ShipmentOutForDelivery.CustomerNotification',
    category: 'Delivery',
    channels: ['sms', 'email'],
    sms: 'Order %Order.OrderNumber% is out for delivery today. %Delivery.OtpLine%',
    subject: 'Order %Order.OrderNumber% is out for delivery',
    body: 'Your order %Order.OrderNumber% is out for delivery today. %Delivery.OtpLine%',
  },
  {
    key: 'ShipmentDeliveryAttemptFailed.CustomerNotification',
    category: 'Delivery',
    channels: ['sms', 'email'],
    sms: 'We could not deliver order %Order.OrderNumber%: %Attempt.ReasonText%. Rebook: %Attempt.RescheduleLink%',
    subject: 'We could not deliver order %Order.OrderNumber%',
    body: 'We could not deliver your order %Order.OrderNumber%. Reason: %Attempt.ReasonText%. Choose a new time here: %Attempt.RescheduleLink%',
  },
  {
    key: 'ShipmentPickupReminder.CustomerNotification',
    category: 'Delivery',
    channels: ['sms', 'email'],
    sms: 'Order %Order.OrderNumber% is waiting at %Outlet.Name% until %Pickup.Deadline%. %Pickup.HoldingChargeLine%',
    subject: 'Collect order %Order.OrderNumber% by %Pickup.Deadline%',
    body: 'Your order %Order.OrderNumber% is waiting at %Outlet.Name% until %Pickup.Deadline%. %Pickup.HoldingChargeLine%',
  },
  {
    key: 'ShipmentUncollected.CustomerNotification',
    category: 'Delivery',
    channels: ['sms', 'email'],
    sms: 'Order %Order.OrderNumber% was not collected by %Pickup.Deadline%.',
    subject: 'Order %Order.OrderNumber% was not collected',
    body: 'Your order %Order.OrderNumber% was not collected by %Pickup.Deadline%. Please contact us about what happens next.',
  },
  {
    key: 'ShipmentUncollected.StoreOwnerNotification',
    category: 'Delivery',
    channels: ['email'],
    subject: 'Uncollected parcel: order %Order.OrderNumber%',
    body: 'Order %Order.OrderNumber% at %Outlet.Name% was not collected by %Pickup.Deadline%.',
  },
];

export async function installTrk012DefinitionsAsync() {
  const definitionRepo = repository('NotificationDefinition');
  const templateRepo = repository('MessageTemplate');
  for (const entry of TRK012_DEFINITIONS) {
    const existing = await definitionRepo.getOneAsync((d) => d.key === entry.key);
    if (!existing) {
      await definitionRepo.insertAsync({
        key: entry.key,
        category: entry.category,
        channels: entry.channels,
        fallback: false,
        mandatory: false,
        urgent: false,
        owningModule: 'Product.TRK',
        native: false,
        feature: 'PRD-TRK-012',
        version: 1,
      });
    }
    if (entry.sms) {
      await setChannelContentAsync({
        key: entry.key, channel: 'sms', languageId: 1, text: entry.sms, system: true,
      });
    }
    const template = await templateRepo.getOneAsync((t) => t.name === entry.key && Number(t.storeId ?? 0) === 0);
    if (!template) {
      await templateRepo.insertAsync({
        name: entry.key,
        subject: entry.subject,
        body: entry.body,
        storeId: 0,
        languageId: 1,
        limitedToStores: false,
        active: true,
        delayBeforeSend: null,
        version: 1,
      });
    }
  }
  await installTemplatesAsync();
  return { installed: TRK012_DEFINITIONS.length };
}

/* ========================================================== tokens of a shipment ======= */

async function shipmentTokensAsync({ shipment, order }) {
  const point = order?.pickupPointId ? await repository('StorePickupPoint').getByIdAsync(order.pickupPointId) : null;
  const pickupCode = await repository('PickupCode').getOneAsync((p) => Number(p.orderId) === Number(order?.id));
  return {
    'Order.OrderNumber': order?.orderNumber ?? null,
    'Order.OrderId': order?.id ?? null,
    'Customer.Email': order?.customerEmail ?? null,
    'Customer.FullName': order?.customerName ?? order?.customerEmail ?? null,
    'Shipment.ShipmentNumber': shipment?.shipmentNumber ?? null,
    'Shipment.TrackingNumber': shipment?.trackingNumber ?? null,
    'Shipment.TrackingLink': shipment?.trackingNumber ? `/track/${shipment.trackingNumber}` : null,
    'Shipment.PickupCode': pickupCode?.code ?? null,
    'Outlet.Name': point?.name ?? null,
    'Outlet.Address': point?.address ?? null,
    'Outlet.OpeningHours': point?.openingHours ?? null,
  };
}

const deadlineOf = async (order, storeId) => {
  if (order?.pickupDeadlineUtc) return order.pickupDeadlineUtc;
  const days = await getSettingAsync('trk.pickup.holdingdays', storeId, null);
  if (days === null) return null;
  const base = order?.readyForPickupOnUtc ?? order?.createdOnUtc ?? new Date().toISOString();
  return new Date(new Date(base).getTime() + Number(days) * 86400000).toISOString();
};

/* ============================================================== the triggers =========== */

/**
 * The TRK-002 hub calls this for every applied event. The engine's own occurrence key keeps a
 * repeated event from sending a second message (BR-TRK-022, AC-TRK-012-01-04).
 */
export async function notifyForEventAsync({
  event, shipment, eventCode, gateways = null, storeId = 1,
}) {
  const order = await repository('Order').getByIdAsync(shipment.orderId);
  if (!order) return { sent: false, reason: 'the shipment has no order' };
  const tokens = await shipmentTokensAsync({ shipment, order });
  const send = (key, extra = {}) => sendNotificationAsync({
    key,
    tokens: { ...tokens, ...extra },
    order,
    shipment,
    storeId,
    occurrence: `${eventCode}:${shipment.id}`,
    gateways: gateways ?? messageGateways,
  });

  if (eventCode === 'OUT_FOR_DELIVERY') {
    // the delivery one-time code where the service level requires it (LOG-012)
    const otpRequired = order.serviceLevel === 'otp-on-delivery'
      || await getSettingAsync('trk.delivery.otprequired', storeId, false) === true;
    const otp = otpRequired
      ? (await repository('PickupCode').getOneAsync((p) => Number(p.orderId) === Number(order.id)))?.code ?? null
      : null;
    const sent = await send('ShipmentOutForDelivery.CustomerNotification', {
      'Delivery.OtpLine': otp ? `Give the courier this code: ${otp}.` : '',
      'Delivery.Otp': otp ?? '',
    });
    return {
      sent: true, key: 'ShipmentOutForDelivery.CustomerNotification', otpIncluded: Boolean(otp), messages: sent.messages,
    };
  }

  if (eventCode === 'ATTEMPT_FAILED') {
    const reasonText = event.reasonCode
      ? (await repository('ReasonCode').getOneAsync((r) => r.code === event.reasonCode))?.name ?? event.reasonCode
      : 'the parcel could not be handed over';
    const sent = await send('ShipmentDeliveryAttemptFailed.CustomerNotification', {
      'Attempt.ReasonText': reasonText,
      'Attempt.RescheduleLink': `/delivery/reschedule/${shipment.trackingNumber}?s=${event.id}`,
    });
    return {
      sent: true, key: 'ShipmentDeliveryAttemptFailed.CustomerNotification', reasonText, messages: sent.messages,
    };
  }

  if (eventCode === 'READY_FOR_PICKUP') return readyForPickupAsync({ shipment, order, gateways, storeId });

  if (['DELIVERED', 'COLLECTED'].includes(eventCode)) {
    const sent = await send('ShipmentDelivered.CustomerNotification');
    return { sent: true, key: 'ShipmentDelivered.CustomerNotification', messages: sent.messages };
  }

  return { sent: false, reason: `no message belongs to ${eventCode}` };
}

/** AC-TRK-012-01-01: the shipment is on its way. */
export async function shipmentSentAsync({
  shipment, order = null, gateways = null, storeId = 1,
}) {
  const theOrder = order ?? await repository('Order').getByIdAsync(shipment.orderId);
  const tokens = await shipmentTokensAsync({ shipment, order: theOrder });
  const sent = await sendNotificationAsync({
    key: 'ShipmentSent.CustomerNotification',
    tokens,
    order: theOrder,
    shipment,
    storeId,
    occurrence: `sent:${shipment.id}`,
    gateways: gateways ?? messageGateways,
  });
  return {
    sent: true, trackingNumber: tokens['Shipment.TrackingNumber'], trackingLink: tokens['Shipment.TrackingLink'], messages: sent.messages,
  };
}

/**
 * AC-TRK-012-02-01: ready for collection - the outlet, its opening hours, the code, the text on
 * what identification to bring and the deadline.
 */
export async function readyForPickupAsync({
  shipment, order = null, gateways = null, storeId = 1,
}) {
  const theOrder = order ?? await repository('Order').getByIdAsync(shipment.orderId);
  const tokens = await shipmentTokensAsync({ shipment, order: theOrder });
  const deadline = await deadlineOf(theOrder, storeId);
  const identification = await getSettingAsync('trk.pickup.identificationtext', storeId, null);
  const sent = await sendNotificationAsync({
    key: 'ShipmentReadyForPickup.CustomerNotification',
    tokens: {
      ...tokens,
      'Pickup.Deadline': deadline ? new Date(deadline).toDateString() : 'not set',
      'Pickup.Identification': identification ?? '',
    },
    order: theOrder,
    shipment,
    storeId,
    occurrence: `ready:${shipment.id}`,
    gateways: gateways ?? messageGateways,
  });
  return {
    sent: true,
    key: 'ShipmentReadyForPickup.CustomerNotification',
    outlet: tokens['Outlet.Name'],
    openingHours: tokens['Outlet.OpeningHours'],
    pickupCode: tokens['Shipment.PickupCode'],
    identificationText: identification,
    deadline,
    messages: sent.messages,
  };
}

/**
 * AC-TRK-012-04-01 and 04-02: the reminder task. One message per reminder step before the
 * deadline, and the uncollected pair once it passes.
 */
export async function runPickupReminderTaskAsync({
  now = null, gateways = null, storeId = 1,
} = {}) {
  const at = now ? new Date(now) : new Date();
  const leadTimes = await getSettingAsync('trk.pickup.reminderleadhours', storeId, null);
  const steps = Array.isArray(leadTimes) ? leadTimes.map(Number) : (leadTimes === null ? [] : [Number(leadTimes)]);
  const out = {
    reminded: 0, uncollected: 0, steps, noLeadTimeConfigured: steps.length === 0,
  };

  const shipments = await repository('Shipment').getAllAsync((s) => !s.collectedOnUtc && !s.deliveredOnUtc);
  for (const shipment of shipments) {
    const order = await repository('Order').getByIdAsync(shipment.orderId);
    if (!order || order.fulfilment !== 'pickup' || order.stage !== 'ReadyForPickup') continue;
    const deadline = await deadlineOf(order, storeId);
    if (!deadline) continue;
    const tokens = await shipmentTokensAsync({ shipment, order });
    const charge = await getSettingAsync('trk.pickup.holdingchargeperday', storeId, null);

    if (new Date(deadline) <= at) {
      if (order.uncollectedNotifiedOnUtc) continue;
      const buyer = await sendNotificationAsync({
        key: 'ShipmentUncollected.CustomerNotification',
        tokens: { ...tokens, 'Pickup.Deadline': new Date(deadline).toDateString() },
        order,
        shipment,
        storeId,
        occurrence: `uncollected:${shipment.id}`,
        gateways: gateways ?? messageGateways,
      });
      const outletContact = await getSettingAsync('trk.pickup.outletcontact', storeId, 'operations@example.com');
      const staff = await sendNotificationAsync({
        key: 'ShipmentUncollected.StoreOwnerNotification',
        tokens: { ...tokens, 'Pickup.Deadline': new Date(deadline).toDateString() },
        recipients: [{ email: outletContact }],
        order,
        shipment,
        storeId,
        occurrence: `uncollected-staff:${shipment.id}`,
        gateways: gateways ?? messageGateways,
      });
      await repository('Order').updateAsync({ ...order, uncollectedNotifiedOnUtc: at.toISOString(), pickupState: 'Uncollected' });
      await auditAsync({
        event: 'AUD-TRK-006',
        area: 'TRK',
        feature: 'PRD-TRK-012',
        entity: 'Shipment',
        entityId: shipment.id,
        actor: 'system',
        after: { uncollected: true, deadline },
        note: 'uncollected parcel notified to the buyer and the outlet',
      });
      out.uncollected += 1;
      out.lastUncollected = { buyer: buyer.messages, staff: staff.messages };
      continue;
    }

    const hoursLeft = (new Date(deadline).getTime() - at.getTime()) / 3600000;
    const sentSteps = order.pickupRemindersSent ?? [];
    for (const step of steps) {
      if (hoursLeft > step || sentSteps.includes(step)) continue;
      const sent = await sendNotificationAsync({
        key: 'ShipmentPickupReminder.CustomerNotification',
        tokens: {
          ...tokens,
          'Pickup.Deadline': new Date(deadline).toDateString(),
          'Pickup.HoldingChargeLine': charge === null ? '' : `A holding charge of ${charge} a day applies after the deadline.`,
        },
        order,
        shipment,
        storeId,
        occurrence: `reminder-${step}:${shipment.id}`,
        gateways: gateways ?? messageGateways,
      });
      await repository('Order').updateAsync({ ...order, pickupRemindersSent: [...sentSteps, step] });
      sentSteps.push(step);
      out.reminded += 1;
      out.lastReminder = { step, deadline, messages: sent.messages };
      break;
    }
  }
  return { ok: true, ...out };
}

export const trk012DefinitionAsync = (key) => definitionAsync(key);
