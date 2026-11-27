// CHK - shopping cart (CHK-001) and the cart-check provider seam (CHK-003).
//
// BR-CHK-015 / decision OVR-REG: CHK-003 owns the only IShoppingCartService override. It calls
// cart check providers (IC-CHK-01) after the native checks; providers may only add warnings,
// except the replacer of a named native warning. A provider error refuses the item with
// Chk.CartCheckUnavailable.
//
// BR-CHK-001: save for later is a native CustomWishlist per customer; moving a line between
// cart and list goes through the service so stock, price and quantity checks run.

import { repository } from '../../../core/repository.js';
import { runProviders } from '../../../core/providers.js';
import { resource } from '../../../core/messages.js';
import { productAsync, finalPriceAsync, viewProductAsync } from '../../product-cat/services/catalogue.js';
import { getSettingAsync } from '../../../core/settings.js';
import { itemWarningsAsync, subTotalAsync } from './validation.js';
import { pickupOnlyAsync } from './cart-rules.js';

const cartRepo = () => repository('ShoppingCartItem');

/**
 * AC-CHK-001-02-01: ShoppingCartItem carries CustomerId, so a signed-in shopper has one cart
 * whatever device they are on. A guest cart is the session's own rows until sign-in migrates
 * them (AC-CHK-001-02-02).
 */
const inScope = (row, { sessionId, customer }) => (customer
  ? (Number(row.customerId) === Number(customer.id)
    || (row.sessionId === sessionId && (row.customerId ?? null) === null))
  : row.sessionId === sessionId);

async function cartRowsAsync({ sessionId, customer = null }) {
  return cartRepo().getAllAsync((row) => inScope(row, { sessionId, customer }));
}

export const CART_TYPE = { ShoppingCart: 1, Wishlist: 2, SavedForLater: 3 };

/**
 * The warnings of one line, through the single CHK-003 override: the native checks first, then
 * the IC-CHK-01 providers in their registered order (BR-CHK-015). Callers get the text; the
 * keys are on the detailed result, which the cart page and the placement host both read.
 */
export async function cartItemWarningsAsync(product, quantity, context = {}) {
  const result = await itemWarningsAsync({
    product,
    quantity,
    customer: context.customer ?? null,
    storeId: context.storeId ?? 1,
    cartType: context.cartType ?? CART_TYPE.ShoppingCart,
    item: context.item ?? null,
    sessionId: context.sessionId ?? context.item?.sessionId ?? null,
    fulfilment: context.fulfilment ?? context.item?.fulfilment ?? null,
  });
  return result.warnings.map((w) => w.message);
}

export async function cartItemWarningDetailAsync(product, quantity, context = {}) {
  return itemWarningsAsync({
    product,
    quantity,
    customer: context.customer ?? null,
    storeId: context.storeId ?? 1,
    cartType: context.cartType ?? CART_TYPE.ShoppingCart,
    item: context.item ?? null,
    fulfilment: context.fulfilment ?? null,
  });
}

export async function addToCartAsync({
  sessionId, productId, quantity = 1, customer = null, cartType = CART_TYPE.ShoppingCart,
  storeId = 1,
}) {
  const product = await productAsync(productId);
  if (!product) throw new Error('product not found');
  const existing = await cartRepo().getOneAsync((i) => inScope(i, { sessionId, customer })
    && i.productId === productId && i.cartType === cartType);
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  // CHK-005: a line that the client's rules make collection-only starts as a collection line
  // (CHK-011 owns the rule; the cart only reads it)
  const collectOnly = await pickupOnlyAsync({ product, storeId: storeId ?? 1 });
  const warnings = await cartItemWarningsAsync(product, newQuantity, {
    sessionId,
    customer,
    item: existing ?? null,
    fulfilment: existing?.fulfilment ?? (collectOnly ? 'pickup' : 'delivery'),
  });
  if (warnings.length) return { ok: false, warnings };

  if (existing) {
    await cartRepo().updateAsync({
      ...existing, quantity: newQuantity, customerId: customer?.id ?? existing.customerId ?? null,
    });
  } else {
    await cartRepo().insertAsync({
      sessionId,
      customerId: customer?.id ?? null,
      productId,
      vendorId: product.vendorId,
      quantity,
      cartType,
      // CHK-005 fulfilment method per line: delivery by default, collection where the product
      // or a CHK-011 rule demands it
      fulfilment: collectOnly ? 'pickup' : 'delivery',
      pickupPointId: null,
      deliverySlotId: null,
    });
  }
  return { ok: true, warnings: [] };
}

export async function updateItemAsync({
  sessionId, itemId, quantity, fulfilment, pickupPointId, deliverySlotId, customer = null,
}) {
  const item = await cartRepo().getByIdAsync(itemId);
  if (!item || !inScope(item, { sessionId, customer })) throw new Error('cart item not found');
  const product = await productAsync(item.productId);
  if (quantity != null) {
    if (quantity <= 0) {
      await cartRepo().deleteAsync(item);
      return { ok: true, warnings: [], removed: true };
    }
    const warnings = await cartItemWarningsAsync(product, quantity, {
      sessionId, customer, item, fulfilment: fulfilment ?? item.fulfilment ?? null,
    });
    if (warnings.length) return { ok: false, warnings };
  }
  if (fulfilment === 'delivery' && await pickupOnlyAsync({ product, storeId: 1 })) {
    return { ok: false, warnings: [resource('Chk.PickupOnly')] };
  }
  await cartRepo().updateAsync({
    ...item,
    quantity: quantity ?? item.quantity,
    fulfilment: fulfilment ?? item.fulfilment,
    pickupPointId: pickupPointId !== undefined ? pickupPointId : item.pickupPointId,
    deliverySlotId: deliverySlotId !== undefined ? deliverySlotId : item.deliverySlotId,
  });
  return { ok: true, warnings: [] };
}

export async function removeItemAsync({ sessionId, itemId, customer = null }) {
  const item = await cartRepo().getByIdAsync(itemId);
  if (item && inScope(item, { sessionId, customer })) await cartRepo().deleteAsync(item);
  return { ok: true };
}

/** BR-CHK-001: move a line to the saved-for-later list and back, with the checks re-run. */
export async function saveForLaterAsync({
  sessionId, itemId, back = false, customer = null,
}) {
  const item = await cartRepo().getByIdAsync(itemId);
  if (!item || !inScope(item, { sessionId, customer })) throw new Error('cart item not found');
  const allowed = await getSettingAsync('shoppingcartsettings.allowmultiplewishlist', 1, false);
  if (!allowed) {
    return { ok: false, warnings: ['Save for later is not enabled for this client (shoppingcartsettings.allowmultiplewishlist).'] };
  }
  if (back) {
    const product = await productAsync(item.productId);
    const warnings = await cartItemWarningsAsync(product, item.quantity, { sessionId, customer });
    if (warnings.length) return { ok: false, warnings };
    await cartRepo().updateAsync({ ...item, cartType: CART_TYPE.ShoppingCart });
  } else {
    await cartRepo().updateAsync({ ...item, cartType: CART_TYPE.SavedForLater });
  }
  return { ok: true, warnings: [], listName: resource('Chk.SavedForLater') };
}

/** AC-CHK-001-02-02: MigrateShoppingCartAsync - the guest cart merges into the account cart. */
export async function migrateCartAsync({ fromSessionId, toSessionId, customer }) {
  const items = await cartRepo().getAllAsync((i) => i.sessionId === fromSessionId);
  for (const item of items) {
    const target = await cartRepo().getOneAsync((i) => i.sessionId === toSessionId
      && i.productId === item.productId && i.cartType === item.cartType);
    if (target) {
      await cartRepo().updateAsync({ ...target, quantity: target.quantity + item.quantity });
      await cartRepo().deleteAsync(item);
    } else {
      await cartRepo().updateAsync({ ...item, sessionId: toSessionId, customerId: customer?.id ?? null });
    }
  }
  return { migrated: items.length };
}

/** The cart as the cart page and the mini cart show it, with server-side totals (BR-CHK-003). */
export async function getCartAsync({ sessionId, customer = null, storeId = 1 }) {
  const rows = await cartRowsAsync({ sessionId, customer });
  const build = async (item) => {
    const product = await productAsync(item.productId);
    const view = await viewProductAsync(product, { customer, quantity: item.quantity });
    const price = await finalPriceAsync(product, { customer, quantity: item.quantity });
    const unitPrice = price.price ?? 0;
    const line = await subTotalAsync({
      item: { ...item, unitPrice }, includeDiscounts: true, customer, storeId,
    });
    return {
      ...item,
      product: view,
      unitPrice,
      subtotal: line.subTotal,
      discountAmount: line.discountAmount,
      subtotalAdjustedBy: line.adjustedBy,
      priceParts: price.parts,
      callForPrice: price.callForPrice,
    };
  };
  const items = [];
  for (const r of rows.filter((i) => i.cartType === CART_TYPE.ShoppingCart)) items.push(await build(r));
  const saved = [];
  for (const r of rows.filter((i) => i.cartType === CART_TYPE.SavedForLater)) saved.push(await build(r));

  const subtotal = Number(items.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
  const sellers = [...new Set(items.map((i) => i.vendorId))];
  const miniCartEnabled = await getSettingAsync('shoppingcartsettings.minishoppingcartenabled', storeId, true);

  return {
    sessionId,
    items,
    savedForLater: saved,
    savedForLaterName: resource('Chk.SavedForLater'),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    sellers,
    multiSeller: sellers.length > 1,
    subtotalAdjustedBy: items.find((i) => i.subtotalAdjustedBy)?.subtotalAdjustedBy ?? null,
    miniCartEnabled,
    miniCart: miniCartEnabled === true
      ? { itemCount: items.reduce((s, i) => s + i.quantity, 0), subtotal }
      : null,
    features: ['PRD-CHK-001', 'PRD-CHK-005'],
  };
}
