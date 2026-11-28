// CHK-017 B2B quick order and bulk add.
//
// Prototype default - decision PH-INF pending (P-1): the B2B audience is an inference, so the
// feature is built as the chapter's Proposed option, including the file format, which the
// chapter also marks Proposed.
//
// Every line goes through the same AddToCartAsync as any other add, so the stock, price and
// cart-rule checks are the ones the CHK-003 override already runs. Nothing is added by a path
// of its own.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { addToCartAsync, CART_TYPE } from './cart.js';

export const PROTOTYPE_DEFAULT = 'Prototype default - decision PH-INF pending';

/** The file the shopper may upload: two columns, SKU and Quantity (format Proposed). */
export const FILE_FORMAT = {
  columns: ['SKU', 'Quantity'],
  separator: ',',
  headerRow: true,
  note: 'the chapter marks the format Proposed',
};

const parseLines = (text) => String(text ?? '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [sku, quantity] = line.split(/[,;\t]/).map((x) => String(x ?? '').trim());
    return { sku, quantity: Number(quantity) };
  })
  .filter((line) => line.sku);

/**
 * AC-CHK-017-01-01 and 02-01: each line is added through the cart service with its own checks;
 * an unknown code is listed with Chk.QuickOrderSkuNotFound and the warnings of a refused line
 * are listed against it.
 */
export async function quickOrderAsync({
  sessionId, customer = null, storeId = 1, lines = [], text = null, file = null,
}) {
  const entries = [
    ...lines,
    ...parseLines(text),
    ...(file?.content ? parseLines(file.content).filter((_, i) => !(FILE_FORMAT.headerRow && i === 0)) : []),
  ];
  const added = [];
  const refused = [];
  for (const entry of entries) {
    const quantity = Number.isFinite(entry.quantity) && entry.quantity > 0 ? entry.quantity : 1;
    const product = await repository('Product').getOneAsync((p) => String(p.sku).toLowerCase() === String(entry.sku).toLowerCase()
      && p.published === true && !p.deleted);
    if (!product) {
      refused.push({
        sku: entry.sku,
        quantity,
        messageKey: 'Chk.QuickOrderSkuNotFound',
        message: resource('Chk.QuickOrderSkuNotFound', { code: entry.sku }),
      });
      continue;
    }
    const result = await addToCartAsync({
      sessionId, productId: product.id, quantity, customer, storeId,
    });
    if (result.ok === true) {
      added.push({
        sku: product.sku, productId: product.id, name: product.name, quantity,
      });
    } else {
      refused.push({
        sku: product.sku, productId: product.id, quantity, warnings: result.warnings ?? [],
      });
    }
  }
  return {
    ok: refused.length === 0,
    added,
    refused,
    linesRead: entries.length,
    addedThrough: 'the same AddToCartAsync as any other add',
    fileFormat: file ? FILE_FORMAT : null,
    prototypeDefault: PROTOTYPE_DEFAULT,
  };
}

/* ====================================================== saved lists =================== */

/**
 * AC-CHK-017-03-01: the saved lists are the native CustomWishlist of the customer, so a list is
 * added to the cart through the same service, item by item, and each warning is shown with its
 * own item. The feature needs ShoppingCartSettings.AllowMultipleWishlist.
 */
export async function savedListsAsync({ customer, storeId = 1 }) {
  const allowed = await getSettingAsync('shoppingcartsettings.allowmultiplewishlist', storeId, false);
  if (allowed !== true) {
    return {
      offered: false,
      lists: [],
      reason: 'ShoppingCartSettings.AllowMultipleWishlist is off for this store',
    };
  }
  const lists = await repository('CustomWishlist').getAllAsync((w) => Number(w.customerId) === Number(customer?.id ?? 0));
  const out = [];
  for (const list of lists) {
    const items = await repository('ShoppingCartItem').getAllAsync((i) => Number(i.customWishlistId) === Number(list.id));
    out.push({
      id: list.id, name: list.name, items: items.length, lines: items,
    });
  }
  return { offered: true, lists: out };
}

export async function saveListAsync({
  customer, name, sessionId = null, storeId = 1,
}) {
  const allowed = await getSettingAsync('shoppingcartsettings.allowmultiplewishlist', storeId, false);
  if (allowed !== true) return { ok: false, message: 'Saved lists are not enabled for this client.' };
  if (!customer) return { ok: false, message: 'a saved list belongs to an account' };
  const list = await repository('CustomWishlist').insertAsync({
    customerId: customer.id, name, storeId, createdOnUtc: new Date().toISOString(),
  });
  if (sessionId) {
    const items = await repository('ShoppingCartItem').getAllAsync((i) => i.sessionId === sessionId
      && i.cartType === CART_TYPE.ShoppingCart);
    for (const item of items) {
      await repository('ShoppingCartItem').insertAsync({
        ...item,
        id: undefined,
        customWishlistId: list.id,
        cartType: CART_TYPE.Wishlist,
      });
    }
  }
  return { ok: true, list };
}

export async function addListToCartAsync({
  listId, sessionId, customer, storeId = 1,
}) {
  const allowed = await getSettingAsync('shoppingcartsettings.allowmultiplewishlist', storeId, false);
  if (allowed !== true) return { ok: false, message: 'Saved lists are not enabled for this client.' };
  const list = await repository('CustomWishlist').getByIdAsync(listId);
  if (!list || Number(list.customerId) !== Number(customer?.id ?? 0)) {
    return { ok: false, message: 'that list belongs to another account' };
  }
  const items = await repository('ShoppingCartItem').getAllAsync((i) => Number(i.customWishlistId) === Number(listId));
  const added = [];
  const refused = [];
  for (const item of items) {
    const result = await addToCartAsync({
      sessionId, productId: item.productId, quantity: item.quantity, customer, storeId,
    });
    if (result.ok === true) added.push({ productId: item.productId, quantity: item.quantity });
    else refused.push({ productId: item.productId, quantity: item.quantity, warnings: result.warnings ?? [] });
  }
  return {
    ok: refused.length === 0,
    list: { id: list.id, name: list.name },
    added,
    refused,
    addedThrough: 'the same AddToCartAsync as any other add',
  };
}
