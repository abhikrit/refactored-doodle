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

const cartRepo = () => repository('ShoppingCartItem');

export const CART_TYPE = { ShoppingCart: 1, Wishlist: 2, SavedForLater: 3 };

/** Native quantity warnings (ShoppingCartService.GetStandardWarningsAsync). */
function standardWarnings(product, quantity) {
  const w = [];
  if (!product.published) w.push('This product is not available.');
  if (quantity < (product.orderMinimumQuantity ?? 1)) {
    w.push(`The minimum quantity for ${product.name} is ${product.orderMinimumQuantity}.`);
  }
  if (quantity > (product.orderMaximumQuantity ?? 1000)) {
    w.push(`The maximum quantity for ${product.name} is ${product.orderMaximumQuantity}.`);
  }
  if (product.manageInventoryMethod === 'ManageStock' && quantity > (product.stockQuantity ?? 0)) {
    w.push(`We have only ${product.stockQuantity} of ${product.name} in stock.`);
  }
  if (product.callForPrice) w.push(resource('Cat.CallForPrice') || 'Call for price');
  return w;
}

export async function cartItemWarningsAsync(product, quantity, context) {
  const warnings = standardWarnings(product, quantity);
  // IC-CHK-01 providers run after the native checks, in registered order
  const results = await runProviders('IC-CHK-01', 'collect', { product, quantity, ...context });
  for (const r of results) {
    if (r.error) {
      warnings.push(resource('Chk.CartCheckUnavailable'));
      continue;
    }
    for (const w of r.result?.warnings ?? []) warnings.push(w);
  }
  return warnings;
}

export async function addToCartAsync({
  sessionId, productId, quantity = 1, customer = null, cartType = CART_TYPE.ShoppingCart,
}) {
  const product = await productAsync(productId);
  if (!product) throw new Error('product not found');
  const existing = await cartRepo().getOneAsync((i) => i.sessionId === sessionId
    && i.productId === productId && i.cartType === cartType);
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  const warnings = await cartItemWarningsAsync(product, newQuantity, { sessionId, customer });
  if (warnings.length) return { ok: false, warnings };

  if (existing) {
    await cartRepo().updateAsync({ ...existing, quantity: newQuantity });
  } else {
    await cartRepo().insertAsync({
      sessionId,
      customerId: customer?.id ?? null,
      productId,
      vendorId: product.vendorId,
      quantity,
      cartType,
      // CHK-005 fulfilment method per line: delivery by default, pickup where the line demands it
      fulfilment: product.pickupOnly ? 'pickup' : 'delivery',
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
  if (!item || item.sessionId !== sessionId) throw new Error('cart item not found');
  const product = await productAsync(item.productId);
  if (quantity != null) {
    if (quantity <= 0) {
      await cartRepo().deleteAsync(item);
      return { ok: true, warnings: [], removed: true };
    }
    const warnings = await cartItemWarningsAsync(product, quantity, { sessionId, customer });
    if (warnings.length) return { ok: false, warnings };
  }
  if (fulfilment === 'delivery' && product.pickupOnly) {
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

export async function removeItemAsync({ sessionId, itemId }) {
  const item = await cartRepo().getByIdAsync(itemId);
  if (item && item.sessionId === sessionId) await cartRepo().deleteAsync(item);
  return { ok: true };
}

/** BR-CHK-001: move a line to the saved-for-later list and back, with the checks re-run. */
export async function saveForLaterAsync({ sessionId, itemId, back = false, customer = null }) {
  const item = await cartRepo().getByIdAsync(itemId);
  if (!item || item.sessionId !== sessionId) throw new Error('cart item not found');
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
  const rows = await cartRepo().getAllAsync((i) => i.sessionId === sessionId);
  const build = async (item) => {
    const product = await productAsync(item.productId);
    const view = await viewProductAsync(product, { customer, quantity: item.quantity });
    const price = await finalPriceAsync(product, { customer, quantity: item.quantity });
    const unitPrice = price.price ?? 0;
    return {
      ...item,
      product: view,
      unitPrice,
      subtotal: Number((unitPrice * item.quantity).toFixed(2)),
      priceParts: price.parts,
      callForPrice: price.callForPrice,
    };
  };
  const items = [];
  for (const r of rows.filter((i) => i.cartType === CART_TYPE.ShoppingCart)) items.push(await build(r));
  const saved = [];
  for (const r of rows.filter((i) => i.cartType === CART_TYPE.SavedForLater)) saved.push(await build(r));

  const subtotal = Number(items.reduce((s, i) => s + i.subtotal, 0).toFixed(2));
  // IC-CHK-05: the one line subtotal adjuster (MKT-002) would plug in here
  const adjustments = await runProviders('IC-CHK-05', 'collect', { items, subtotal, customer });
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
    adjustments: adjustments.map((a) => a.result).filter(Boolean),
    miniCartEnabled,
    features: ['PRD-CHK-001', 'PRD-CHK-005'],
  };
}
