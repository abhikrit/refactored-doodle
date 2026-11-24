// CAT - catalogue reads and price calculation.
//
// CAT-002 hosts the IProductService override (decision OVR-REG, L1 section 6.3 core-modification
// register entry for the product record); CAT-039/CAT-042 use native price lists (decision
// PRICE-500). GetFinalPriceAsync applies the price-list price first and a tier price found
// afterwards replaces it (PriceCalculationService.cs:77-140,454-462 in 5.00.1), which is exactly
// the order reproduced below - the conflict rule is owned by the CAT chapter.

import { repository } from '../../../core/repository.js';

export async function categoriesAsync() {
  const rows = await repository('Category').getAllAsync();
  return rows.slice().sort((a, b) => (a.parentCategoryId - b.parentCategoryId)
    || (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function categoryTreeAsync() {
  const all = await categoriesAsync();
  const roots = all.filter((c) => !c.parentCategoryId);
  return roots.map((r) => ({ ...r, children: all.filter((c) => c.parentCategoryId === r.id) }));
}

export async function vendorsAsync() {
  return repository('Vendor').getAllAsync();
}

export async function productsAsync() {
  return repository('Product').getAllAsync((p) => p.published);
}

export async function productAsync(id) {
  return repository('Product').getByIdAsync(id);
}

/**
 * GetFinalPriceAsync.
 * 1. the price-list price for the customer's roles (CAT-039, native PriceList/PriceListItem)
 * 2. a tier price for the quantity, which REPLACES the price-list price (native behaviour)
 * Returns the parts so the UI can show why a price is what it is.
 */
export async function finalPriceAsync(product, { quantity = 1, customer = null } = {}) {
  const parts = { base: product.price, applied: 'base', priceList: null, tierPrice: null };
  if (product.callForPrice) {
    return {
      price: null, callForPrice: true, parts, feature: 'PRD-CAT-013',
    };
  }
  let price = product.price;

  const roles = customer?.roles ?? [];
  const priceLists = await repository('PriceList').getAllAsync();
  for (const list of priceLists) {
    const forRole = (list.customerRoles ?? []).some((r) => roles.includes(r));
    if (!forRole) continue;
    const item = (list.items ?? []).find((i) => i.productId === product.id);
    if (!item) continue;
    if (parts.priceList === null || item.manualPrice < parts.priceList.price) {
      parts.priceList = { name: list.name, price: item.manualPrice, strategy: list.strategy };
    }
  }
  if (parts.priceList) {
    price = parts.priceList.price;
    parts.applied = 'price-list';
  }

  const tier = (product.tierPrices ?? [])
    .filter((t) => quantity >= t.quantity)
    .sort((a, b) => b.quantity - a.quantity)[0];
  if (tier) {
    parts.tierPrice = tier;
    price = tier.price;
    parts.applied = 'tier-price';
    parts.note = parts.priceList
      ? 'A tier price replaces the price-list price (native 5.00 behaviour; the conflict rule is owned by the CAT chapter, decision PRICE-500).'
      : undefined;
  }

  return {
    price, callForPrice: false, parts, feature: parts.applied === 'base' ? 'PRD-CAT-002' : 'PRD-CAT-039',
  };
}

/** A product shaped for a list card or a details page, prices already resolved. */
export async function viewProductAsync(product, { customer, quantity = 1 } = {}) {
  const [vendor, price] = await Promise.all([
    product.vendorId ? repository('Vendor').getByIdAsync(product.vendorId) : null,
    finalPriceAsync(product, { customer, quantity }),
  ]);
  const categories = await repository('Category').getAllAsync((c) => (product.categoryIds ?? []).includes(c.id));
  return {
    ...product,
    vendor: vendor ? { id: vendor.id, name: vendor.name, rating: vendor.rating, tier: vendor.tier ?? null } : null,
    categories: categories.map((c) => ({ id: c.id, name: c.name })),
    finalPrice: price.price,
    priceParts: price.parts,
    callForPrice: price.callForPrice,
    inStock: (product.stockQuantity ?? 0) > 0,
  };
}
