// LOG-005 delivery estimate and LOG-015 address coordinates, both read by CHK.
//
// IC-CHK-03: "Supplied by LOG-005 (BR-LOG-030); displayed by CHK-014 with message Log.EdtRange."
// CHK calculates no date of its own (AC-CHK-014-01-01), so the calculation lives here even
// though LOG-005's own criteria are not in this wave - the trace reports LOG-005 as not built.
//
// BR-LOG-140: coordinates are LOG-015's AddressGeo row, keyed by AddressId with source "pin";
// CHK-007 passes them here and stores none of its own (AC-CHK-007-01-02).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';

const day = 24 * 60 * 60 * 1000;
const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

/** Working days only, so an estimate never lands on a day nothing moves. */
function addWorkingDays(from, days) {
  const date = new Date(from);
  let left = Math.max(0, Number(days) || 0);
  while (left > 0) {
    date.setTime(date.getTime() + day);
    if (date.getUTCDay() !== 0) left -= 1; // Sunday is not a working day
  }
  return date;
}

/**
 * BR-LOG-030: the estimate of one shipping option or one outlet. The transit days of the option,
 * the lead time of the outlet and the handling days of the store are the only inputs the sources
 * state; a client's own matrix is not stated in source, so nothing else is assumed here.
 */
export async function estimateAsync({
  shippingMethod = null, pickupPoint = null, address = null, cart = null, storeId = 1, placedAt = null,
}) {
  const handling = await getSettingAsync('log.handlingdays', storeId, 1);
  const from = placedAt ? new Date(placedAt) : new Date();

  if (pickupPoint) {
    const transit = Number(pickupPoint.transitDays ?? 0);
    const ready = addWorkingDays(from, Number(handling) + transit);
    // AC-CHK-014-01-02 states no message key of its own for the collection date, so the date is
    // returned and the screen words it; no key is invented here.
    return {
      kind: 'pickup',
      pickupPointId: pickupPoint.id,
      earliest: isoDate(ready),
      latest: isoDate(ready),
      collectFrom: isoDate(ready),
      source: 'PRD-LOG-005',
      messageKey: null,
    };
  }

  if (!shippingMethod) return null;
  const transit = Number(shippingMethod.transitDays ?? shippingMethod.transitdays ?? 0);
  if (!transit) return null; // no transit days for this option: CHK-014 falls back (AC-CHK-014-01-03)
  const spread = Number(shippingMethod.transitDaysSpread ?? 1);
  const earliest = addWorkingDays(from, Number(handling) + transit);
  const latest = addWorkingDays(earliest, spread);
  return {
    kind: 'delivery',
    shippingMethod: shippingMethod.name,
    earliest: isoDate(earliest),
    latest: isoDate(latest),
    source: 'PRD-LOG-005',
    messageKey: 'Log.EdtRange',
    message: resource('Log.EdtRange', { 0: isoDate(earliest), 1: isoDate(latest) }),
    area: address?.city ?? null,
    lines: cart?.items?.length ?? null,
  };
}

/* ======================================================= LOG-015 AddressGeo ============ */

/** BR-LOG-140: the pin of one address. CHK-007 calls this; the row belongs to LOG-015. */
export async function saveAddressPinAsync({
  addressId, latitude, longitude, source = 'pin', validationResult = null,
}) {
  if (addressId == null) throw new Error('AddressGeo needs an AddressId');
  const existing = await repository('AddressGeo').getOneAsync((g) => Number(g.addressId) === Number(addressId));
  const row = {
    addressId: Number(addressId),
    latitude: Number(latitude),
    longitude: Number(longitude),
    source,
    validationResult,
  };
  const saved = existing
    ? await repository('AddressGeo').updateAsync({ ...existing, ...row })
    : await repository('AddressGeo').insertAsync(row);
  return { ...saved, feature: 'PRD-LOG-015', rule: 'BR-LOG-140' };
}

export async function addressGeoAsync(addressId) {
  const row = await repository('AddressGeo').getOneAsync((g) => Number(g.addressId) === Number(addressId));
  if (!row) return null;
  return {
    ...row,
    mapUrl: `https://maps.google.com/?q=${row.latitude},${row.longitude}`,
  };
}

/* ================================================= LOG-003 outlets for a line ========== */

/**
 * AC-CHK-005-01-04: the outlets that serve one item and are open on the expected collection
 * date. Which outlet serves which item, and when an outlet is closed, are LOG-003 outlet
 * extensions; no client source states values for them, so an outlet serves everything and is
 * open unless its row says otherwise.
 */
export async function outletsForLineAsync({ product = null, date = null, storeId = 1 }) {
  const outlets = await repository('StorePickupPoint').getAllAsync();
  const when = date ?? isoDate(new Date());
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(when).getUTCDay()];
  const offered = [];
  const notOffered = [];
  for (const outlet of outlets) {
    if (outlet.storeId != null && Number(outlet.storeId) !== Number(storeId)) continue;
    const excludedProduct = (outlet.excludedProductIds ?? []).map(Number).includes(Number(product?.id));
    const excludedCategory = (outlet.excludedCategoryIds ?? []).some((c) => (product?.categoryIds ?? []).map(Number).includes(Number(c)));
    const closedOnDate = (outlet.closedDates ?? []).includes(when);
    const closedOnDay = (outlet.closedDays ?? []).includes(weekday);
    if (excludedProduct || excludedCategory) {
      notOffered.push({ ...outlet, reason: 'this outlet does not handle that item' });
      continue;
    }
    if (closedOnDate || closedOnDay) {
      notOffered.push({ ...outlet, reason: `this outlet is closed on ${when}` });
      continue;
    }
    offered.push(outlet);
  }
  return { date: when, offered, notOffered };
}
