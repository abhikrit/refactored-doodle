// CHK-005 fulfilment method per line, and the CHK-014 estimate the shipping step shows.
//
// BR-CHK-009: lines are grouped into sub-orders by seller and fulfilment choice (delivery, or
// pickup at outlet X); each sub-order carries one native PickupInStore value.
// The choice of one line is a CartLineFulfilment row (section 9), keyed by ShoppingCartItemId.
// The outlets a line may be collected from come from LOG-003 and LOG-004; the expected dates
// come from LOG-005 through IC-CHK-03. CHK calculates no date of its own (AC-CHK-014-01-01).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { providers } from '../../../core/providers.js';
import { resource } from '../../../core/messages.js';
import { outletsForLineAsync } from '../../product-log/services/estimates.js';

const lineRepo = () => repository('CartLineFulfilment');
const cartRepo = () => repository('ShoppingCartItem');

export const METHOD = { Delivery: 'delivery', Pickup: 'pickup' };

/** The stored choice of one cart line, or null when the shopper has not chosen yet. */
export async function lineFulfilmentAsync(shoppingCartItemId) {
  const row = await lineRepo().getOneAsync((l) => Number(l.shoppingCartItemId) === Number(shoppingCartItemId));
  return row ?? null;
}

/** Every stored choice of a cart, keyed by line, for the cart and confirm pages. */
export async function cartLineFulfilmentAsync(itemIds = []) {
  const rows = await lineRepo().getAllAsync((l) => itemIds.map(Number).includes(Number(l.shoppingCartItemId)));
  return new Map(rows.map((r) => [Number(r.shoppingCartItemId), r]));
}

/**
 * AC-CHK-005-01-01: the choice is stored per line. The ShoppingCartItem keeps the same values so
 * that the native cart, the splitter and the fee engine read one answer, not two.
 */
export async function setLineFulfilmentAsync({
  shoppingCartItemId, method, pickupPointId = null, storeId = 1,
}) {
  const item = await cartRepo().getByIdAsync(shoppingCartItemId);
  if (!item) throw new Error('cart item not found');
  const product = await repository('Product').getByIdAsync(item.productId);
  const options = await lineOptionsAsync({ item, product, storeId });

  if (!options.methods.some((m) => m.id === method && m.offered)) {
    return { ok: false, messageKey: options.methods.find((m) => m.id === method)?.messageKey ?? null, message: options.methods.find((m) => m.id === method)?.reason ?? 'That choice is not offered for this item.' };
  }
  if (method === METHOD.Pickup) {
    if (!pickupPointId) return { ok: false, message: `Choose an outlet to collect ${product.name} from.` };
    if (!options.outlets.some((o) => Number(o.id) === Number(pickupPointId))) {
      return { ok: false, message: options.outletsNotOffered.find((o) => Number(o.id) === Number(pickupPointId))?.reason ?? 'That outlet is not offered for this item.' };
    }
  }

  const existing = await lineFulfilmentAsync(shoppingCartItemId);
  const row = {
    shoppingCartItemId: Number(shoppingCartItemId),
    method,
    pickupPointId: method === METHOD.Pickup ? Number(pickupPointId) : null,
  };
  const saved = existing
    ? await lineRepo().updateAsync({ ...existing, ...row })
    : await lineRepo().insertAsync(row);
  await cartRepo().updateAsync({ ...item, fulfilment: row.method, pickupPointId: row.pickupPointId });
  return { ok: true, line: saved };
}

/**
 * What the shipping step offers for one line:
 *   AC-CHK-005-01-01 delivery or pickup at a selected outlet,
 *   AC-CHK-005-01-04 only outlets that serve the item and are open on the collection date,
 *   AC-CHK-005-01-05 no delivery for a pickup-only item,
 *   AC-CHK-005-01-06 the IAM-015 preferred outlet pre-selected when it serves the line.
 */
export async function lineOptionsAsync({
  item, product = null, customer = null, storeId = 1, date = null,
}) {
  const full = product ?? await repository('Product').getByIdAsync(item.productId);
  const pickupAllowed = await getSettingAsync('shippingsettings.allowpickupinstore', storeId, true);
  const { offered, notOffered, date: when } = await outletsForLineAsync({ product: full, date, storeId });
  const outletsExist = offered.length > 0;

  const methods = [
    {
      id: METHOD.Delivery,
      name: 'Home delivery',
      offered: full.pickupOnly !== true && full.isShipEnabled !== false,
      reason: full.pickupOnly === true ? resource('Chk.PickupOnly') : null,
      messageKey: full.pickupOnly === true ? 'Chk.PickupOnly' : null,
    },
    {
      id: METHOD.Pickup,
      name: 'Collect at an outlet',
      offered: pickupAllowed === true && outletsExist,
      reason: pickupAllowed !== true
        ? 'Collection is not offered by this store.'
        : (outletsExist ? null : 'No outlet near you handles this item on that date.'),
      messageKey: null,
    },
  ];

  // IAM-015: the preferred outlet, but only where it serves this line
  let preferredPickupPointId = null;
  if (customer) {
    const preference = await repository('CustomerPreference').getOneAsync((p) => Number(p.customerId) === Number(customer.id));
    const preferred = preference?.preferredPickupPointId ?? null;
    if (preferred && offered.some((o) => Number(o.id) === Number(preferred))) {
      preferredPickupPointId = Number(preferred);
    }
  }

  const stored = item?.id ? await lineFulfilmentAsync(item.id) : null;
  return {
    shoppingCartItemId: item?.id ?? null,
    productId: full.id,
    productName: full.name,
    methods,
    outlets: offered,
    outletsNotOffered: notOffered,
    date: when,
    preferredPickupPointId,
    chosen: stored
      ? { method: stored.method, pickupPointId: stored.pickupPointId }
      : { method: item?.fulfilment ?? (full.pickupOnly ? METHOD.Pickup : METHOD.Delivery), pickupPointId: item?.pickupPointId ?? preferredPickupPointId },
  };
}

/** The same, for every line of the cart - what the shipping step renders. */
export async function cartFulfilmentOptionsAsync({
  cart, customer = null, storeId = 1, date = null,
}) {
  const lines = [];
  for (const item of cart.items ?? []) {
    lines.push(await lineOptionsAsync({
      item, product: item.product ?? null, customer, storeId, date,
    }));
  }
  return { lines, date: date ?? lines[0]?.date ?? null };
}

/**
 * AC-CHK-005-01-02: fees are calculated for the delivery lines and for each outlet group, and
 * the confirm page shows each group separately. The groups are BR-CHK-009's groups, so the same
 * key the splitter and the fee engine use.
 */
export function fulfilmentGroupKey(item) {
  return `${item.vendorId}|${item.fulfilment}|${item.pickupPointId ?? 0}`;
}

/* ================================================= CHK-014 the dates on the step ======= */

/**
 * IC-CHK-03: the estimate of one option, from LOG-005. When LOG-005 has none, the native transit
 * days of the rate or the outlet are used, and otherwise no date is shown and checkout continues
 * (AC-CHK-014-01-03). CHK never calculates a date.
 */
export async function estimateForAsync({
  shippingMethod = null, pickupPoint = null, address = null, cart = null, storeId = 1, placedAt = null,
}) {
  for (const provider of providers('IC-CHK-03')) {
    try {
      const estimate = await provider.fn({
        shippingMethod, pickupPoint, address, cart, storeId, placedAt,
      });
      if (estimate) return { ...estimate, provider: provider.feature };
    } catch (err) {
      await repository('Log').insertAsync({
        level: 'Warning',
        shortMessage: `IC-CHK-03 provider ${provider.feature} gave no estimate`,
        fullMessage: err.message,
        feature: 'PRD-CHK-014',
        createdOnUtc: new Date().toISOString(),
      });
    }
  }

  // the native fallback: transit days of the rate, or of the outlet
  const transit = Number(pickupPoint?.transitDays ?? shippingMethod?.transitDays ?? 0);
  if (!transit) {
    return {
      earliest: null,
      latest: null,
      source: 'none',
      messageKey: null,
      message: null,
      note: 'no estimate is available for this option',
    };
  }
  const ready = new Date(Date.now() + transit * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    kind: pickupPoint ? 'pickup' : 'delivery',
    earliest: ready,
    latest: ready,
    collectFrom: pickupPoint ? ready : null,
    source: 'native transit days',
    messageKey: pickupPoint ? null : 'Log.EdtRange',
    message: pickupPoint ? null : resource('Log.EdtRange', { 0: ready, 1: ready }),
  };
}

/**
 * The dates the shipping method step shows: one per shipping option (AC-CHK-014-01-01) and one
 * per outlet offered (AC-CHK-014-01-02). AC-CHK-014-01-05: where the native desired-date list is
 * on, this estimate is the expected delivery and the native list is only a preferred date.
 */
export async function stepEstimatesAsync({
  cart, address = null, storeId = 1, customer = null,
}) {
  const methods = await repository('ShippingMethod').getAllAsync();
  const options = [];
  for (const method of methods) {
    const estimate = await estimateForAsync({
      shippingMethod: method, address, cart, storeId,
    });
    options.push({
      shippingMethod: method.name,
      transitDays: method.transitDays ?? null,
      ...estimate,
    });
  }

  const outlets = [];
  const chosen = (cart?.items ?? []).filter((i) => i.fulfilment === 'pickup' && i.pickupPointId);
  const pointIds = [...new Set(chosen.map((i) => Number(i.pickupPointId)))];
  for (const id of pointIds) {
    const point = await repository('StorePickupPoint').getByIdAsync(id);
    if (!point) continue;
    const estimate = await estimateForAsync({
      pickupPoint: point, address, cart, storeId,
    });
    outlets.push({
      pickupPointId: id, name: point.name, city: point.city, ...estimate,
    });
  }

  const chooseDate = await getSettingAsync('shippingsettings.allowcustomertochoosedeliverydate', storeId, true);
  return {
    options,
    outlets,
    expectedDeliveryIs: 'the estimate above',
    desiredDateIsPreferenceOnly: chooseDate === true,
    customerId: customer?.id ?? null,
  };
}

/**
 * AC-CHK-014-01-04: the estimate shown for the chosen option is stored with the order, so the
 * confirm step and tracking show the same dates.
 */
export async function estimateForCartAsync({ cart, address = null, storeId = 1 }) {
  const delivers = (cart?.items ?? []).some((i) => i.fulfilment !== 'pickup');
  if (delivers) {
    const methods = await repository('ShippingMethod').getAllAsync();
    const preferred = methods.find((m) => Number(m.transitDays ?? 0) > 0) ?? methods[0] ?? null;
    if (preferred) {
      return estimateForAsync({
        shippingMethod: preferred, address, cart, storeId,
      });
    }
  }
  const first = (cart?.items ?? []).find((i) => i.fulfilment === 'pickup' && i.pickupPointId);
  if (first) {
    const point = await repository('StorePickupPoint').getByIdAsync(Number(first.pickupPointId));
    if (point) return estimateForAsync({ pickupPoint: point, address, cart, storeId });
  }
  return null;
}
