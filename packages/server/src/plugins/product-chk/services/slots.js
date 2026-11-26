// CHK-006 delivery windows and delivery instructions.
//
// BR-CHK-010 / SM-CHK-02: window capacity is checked and reserved at placement under ILocker key
// 'chk-slot-{SlotId}-{Date}' by the CHK-006 placement participant (IC-CHK-06); a cancelled order
// releases its place through the CHK-006 cancellation participant (IC-CHK-08).
//
// The window definition is DeliverySlotDefinition (service or shipping method, area, day, start,
// end, capacity, active) and the booking is DeliverySlotBooking, whose Date is the native
// Order.DesiredDeliveryDateUtc: CHK builds no date picker of its own (AC-CHK-006-01-06).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';

const definitionRepo = () => repository('DeliverySlotDefinition');
const bookingRepo = () => repository('DeliverySlotBooking');

export const BOOKING_STATE = {
  Reserved: 'Reserved', Released: 'Released', Fulfilled: 'Fulfilled',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);
const dayOf = (date) => DAYS[new Date(date).getUTCDay()];

/* ==================================================== CHK-006-03 the definitions ======= */

/**
 * AC-CHK-006-03-01: the administrator defines windows for a delivery service and area; the
 * change is audited (AUD-CHK-001).
 */
export async function defineWindowAsync({
  id = null, shippingMethod, area, dayOfWeek, start, end, capacity,
  isActive = true, storeId = 1, name = null, actor = 'administrator',
}) {
  const missing = Object.entries({
    shippingMethod, area, dayOfWeek, start, end, capacity,
  }).filter(([, v]) => v === undefined || v === null || v === '').map(([k]) => k);
  if (missing.length) return { ok: false, missing, message: `A window needs ${missing.join(', ')}.` };
  if (!DAYS.includes(dayOfWeek)) return { ok: false, message: `${dayOfWeek} is not a day of the week.` };
  if (Number(capacity) <= 0) return { ok: false, message: 'Capacity must be more than nothing.' };

  const row = {
    shippingMethod,
    area,
    dayOfWeek,
    start,
    end,
    capacity: Number(capacity),
    isActive: isActive !== false,
    storeId: Number(storeId),
    name: name ?? `${start}-${end}`,
  };
  const existing = id ? await definitionRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await definitionRepo().updateAsync({ ...existing, ...row })
    : await definitionRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-CHK-001',
    entity: 'DeliverySlotDefinition',
    entityId: saved.id,
    note: existing ? 'delivery window changed' : 'delivery window created',
    area: 'CHK',
    actor,
    storeId: Number(storeId),
    before: existing ?? null,
    after: saved,
    feature: 'PRD-CHK-006',
  });
  return { ok: true, window: saved };
}

export async function removeWindowAsync({ id, actor = 'administrator', storeId = 1 }) {
  const existing = await definitionRepo().getByIdAsync(id);
  if (!existing) return { ok: false, message: 'unknown window' };
  await definitionRepo().updateAsync({ ...existing, isActive: false });
  await auditAsync({
    event: 'AUD-CHK-001',
    entity: 'DeliverySlotDefinition',
    entityId: id,
    note: 'delivery window no longer offered',
    area: 'CHK',
    actor,
    storeId: Number(storeId),
    before: existing,
    after: { ...existing, isActive: false },
    feature: 'PRD-CHK-006',
  });
  return { ok: true };
}

export async function windowDefinitionsAsync({ storeId = null } = {}) {
  const rows = await definitionRepo().getAllAsync();
  return rows
    .filter((r) => storeId == null || r.storeId == null || Number(r.storeId) === Number(storeId))
    .sort((a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek) || String(a.start).localeCompare(String(b.start)));
}

/* ==================================================== CHK-006-01 the shopper's choice == */

/** How many places of a window on a date are already taken. */
async function takenAsync(definitionId, date) {
  return bookingRepo().countAsync((b) => Number(b.definitionId) === Number(definitionId)
    && b.date === date && b.status === BOOKING_STATE.Reserved);
}

/**
 * AC-CHK-006-01-01 and AC-CHK-006-01-06: the windows of the chosen delivery service and the
 * address area that still have capacity, for the date the shopper picked from the native list.
 * AC-CHK-006-01-02: a service with no windows gets an empty list and checkout continues.
 */
export async function windowsAsync({
  shippingMethod = null, area = null, date = null, storeId = 1,
}) {
  const when = date ? isoDate(date) : null;
  const all = await windowDefinitionsAsync({ storeId });
  const matching = all.filter((w) => w.isActive !== false
    && (shippingMethod == null || String(w.shippingMethod) === String(shippingMethod))
    && (area == null || String(w.area).toLowerCase() === String(area).toLowerCase())
    && (when == null || w.dayOfWeek === dayOf(when)));

  const windows = [];
  for (const w of matching) {
    const used = when ? await takenAsync(w.id, when) : 0;
    const remaining = Math.max(0, Number(w.capacity) - used);
    if (when && remaining <= 0) continue; // only the windows with remaining capacity are listed
    windows.push({
      id: w.id,
      name: w.name ?? `${w.start}-${w.end}`,
      shippingMethod: w.shippingMethod,
      area: w.area,
      dayOfWeek: w.dayOfWeek,
      start: w.start,
      end: w.end,
      capacity: Number(w.capacity),
      remaining,
      date: when,
    });
  }
  return {
    windows,
    offered: windows.length > 0,
    date: when,
    shippingMethod,
    area,
  };
}

/**
 * AC-CHK-006-01-05: the native desired-delivery-date list. ShippingSettings
 * AllowCustomerToChooseDeliveryDate and DeliveryDateRangeDays decide it, and the first date is
 * today plus the transit days of the chosen option. CHK adds no date picker of its own.
 */
export async function desiredDateOptionsAsync({ storeId = 1, transitDays = 0, from = null } = {}) {
  const enabled = await getSettingAsync('shippingsettings.allowcustomertochoosedeliverydate', storeId, true);
  const rangeDays = Number(await getSettingAsync('shippingsettings.deliverydaterangedays', storeId, 7));
  if (enabled !== true || Number(transitDays) <= 0) {
    return {
      enabled: false,
      dates: [],
      reason: enabled !== true
        ? 'ShippingSettings.AllowCustomerToChooseDeliveryDate is off for this store'
        : 'the chosen shipping option has no transit days',
      rangeDays,
    };
  }
  const start = new Date(from ?? Date.now());
  start.setUTCDate(start.getUTCDate() + Number(transitDays));
  const dates = [];
  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(isoDate(d));
  }
  return {
    enabled: true,
    dates,
    rangeDays,
    first: dates[0],
    label: 'Preferred delivery date',
    note: 'a choice of preferred date, not the expected delivery date',
  };
}

/** The window and date the checkout session holds, if the shopper chose one. */
export async function chosenWindowAsync(session) {
  if (!session?.deliverySlotId) return null;
  const definition = await definitionRepo().getByIdAsync(session.deliverySlotId);
  if (!definition) return null;
  return {
    id: definition.id,
    name: definition.name ?? `${definition.start}-${definition.end}`,
    date: session.desiredDeliveryDate ?? null,
    start: definition.start,
    end: definition.end,
  };
}

/* ============================================ the IC-CHK-06 placement participant ====== */

/**
 * BR-CHK-010: Reserve takes one place in the window for the date under
 * 'chk-slot-{SlotId}-{Date}'; a full window refuses placement with Chk.SlotFull
 * (AC-CHK-006-01-03). Confirm writes the booking against the saved sub-order and Release gives
 * the place back (AC-CHK-006-01-04, SM-CHK-02).
 */
export async function placementParticipantAsync({
  phase, deliverySlotId = null, date = null, reservation = null, order = null,
}) {
  if (phase === 'Reserve') {
    if (!deliverySlotId) return { ok: true };
    const when = isoDate(date ?? Date.now());
    return withLockAsync(lockKey.deliverySlot(deliverySlotId, when), async () => {
      const definition = await definitionRepo().getByIdAsync(deliverySlotId);
      if (!definition || definition.isActive === false) {
        return { ok: false, messageKey: 'Chk.SlotFull', message: resource('Chk.SlotFull') };
      }
      const used = await takenAsync(deliverySlotId, when);
      if (used >= Number(definition.capacity)) {
        return { ok: false, messageKey: 'Chk.SlotFull', message: resource('Chk.SlotFull') };
      }
      const booking = await bookingRepo().insertAsync({
        definitionId: Number(deliverySlotId),
        orderId: null,
        date: when,
        status: BOOKING_STATE.Reserved,
        reservedOnUtc: new Date().toISOString(),
      });
      return {
        ok: true,
        reservation: { bookingId: booking.id, definitionId: Number(deliverySlotId), date: when },
      };
    });
  }

  if (phase === 'Confirm') {
    const bookingId = reservation?.bookingId ?? reservation?.reservation?.bookingId ?? null;
    if (!bookingId || !order) return { ok: true };
    const booking = await bookingRepo().getByIdAsync(bookingId);
    if (!booking) return { ok: true };
    await bookingRepo().updateAsync({ ...booking, orderId: order.id, orderNumber: order.orderNumber });
    return { ok: true };
  }

  if (phase === 'Release') {
    const bookingId = reservation?.bookingId ?? reservation?.reservation?.bookingId ?? null;
    if (!bookingId) return { ok: true };
    const booking = await bookingRepo().getByIdAsync(bookingId);
    if (!booking || booking.status !== BOOKING_STATE.Reserved) return { ok: true };
    await bookingRepo().updateAsync({
      ...booking, status: BOOKING_STATE.Released, releasedOnUtc: new Date().toISOString(),
    });
    return { ok: true };
  }
  return { ok: true };
}

/**
 * AC-CHK-006-01-04: the CHK-006 cancellation participant (IC-CHK-08) gives the place back when
 * the order is cancelled, whichever path cancelled it.
 */
export async function cancellationParticipantAsync({ order }) {
  if (!order) return { ok: true };
  const bookings = await bookingRepo().getAllAsync((b) => Number(b.orderId) === Number(order.id)
    && b.status === BOOKING_STATE.Reserved);
  for (const booking of bookings) {
    await bookingRepo().updateAsync({
      ...booking, status: BOOKING_STATE.Released, releasedOnUtc: new Date().toISOString(),
    });
  }
  return { ok: true, released: bookings.length };
}

/** SM-CHK-02: a delivered order's booking is Fulfilled. */
export async function fulfilBookingAsync({ orderId }) {
  const bookings = await bookingRepo().getAllAsync((b) => Number(b.orderId) === Number(orderId)
    && b.status === BOOKING_STATE.Reserved);
  for (const booking of bookings) {
    await bookingRepo().updateAsync({ ...booking, status: BOOKING_STATE.Fulfilled });
  }
  return { fulfilled: bookings.length };
}

export async function bookingsAsync({ definitionId = null, date = null } = {}) {
  const rows = await bookingRepo().getAllAsync();
  return rows.filter((b) => (definitionId == null || Number(b.definitionId) === Number(definitionId))
    && (date == null || b.date === isoDate(date)));
}

/* ================================================ CHK-006-02 delivery instructions ===== */

export const INSTRUCTIONS_ATTRIBUTE = 'Delivery instructions';

/**
 * AC-CHK-006-02-01: the instructions are a native CheckoutAttribute (text box). The text is
 * stored on the order as CheckoutAttributeDescription and shown to staff, seller and courier.
 */
export async function instructionsAttributeAsync({ storeId = 1 } = {}) {
  const rows = await repository('CheckoutAttribute').getAllAsync((a) => a.name === INSTRUCTIONS_ATTRIBUTE
    && (a.storeId == null || Number(a.storeId) === Number(storeId)));
  return rows[0] ?? null;
}

export async function setInstructionsAsync({ session, text, storeId = 1 }) {
  const attribute = await instructionsAttributeAsync({ storeId });
  if (!attribute) {
    return { ok: false, offered: false, message: 'Delivery instructions are not enabled for this store.' };
  }
  const value = String(text ?? '').trim();
  if (attribute.maxLength && value.length > Number(attribute.maxLength)) {
    return { ok: false, message: `Please keep the instructions under ${attribute.maxLength} characters.` };
  }
  await repository('CheckoutSession').updateAsync({
    ...session,
    checkoutAttributeDescription: value ? `${attribute.name}: ${value}` : null,
    deliveryInstructions: value || null,
  });
  return { ok: true, offered: true, description: value ? `${attribute.name}: ${value}` : null };
}
