// SRC - keyword search, filters and sorting.
//
// SRC-001 keyword search, SRC-003 narrowing results, SRC-005 sorting options, SRC-019 which
// products appear in search (eligibility rules). SRC-014 (enhanced engine: relevance, synonyms,
// languages) is a licensed/paid stub in 5.00.1 (Search.Lucene implements IMiscPlugin, not
// ISearchProvider) and is held by PAID-STUB - so the prototype's relevance is the in-house
// substitute allowed by decision P-2, behind the same provider seam.

import { productsAsync, viewProductAsync } from '../../product-cat/services/catalogue.js';
import { repository } from '../../../core/repository.js';

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'position', label: 'Position' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'created-desc', label: 'Created on' },
];

function score(product, terms) {
  if (!terms.length) return 0;
  const name = product.name.toLowerCase();
  const sku = (product.sku ?? '').toLowerCase();
  const short = (product.shortDescription ?? '').toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (name.startsWith(t)) s += 10;
    if (name.includes(t)) s += 6;
    if (sku.includes(t)) s += 5;
    if (short.includes(t)) s += 2;
    for (const v of Object.values(product.specifications ?? {})) {
      if (String(v).toLowerCase().includes(t)) s += 1;
    }
  }
  return s;
}

export async function searchAsync({
  q = '', categoryId = null, vendorId = null, minPrice = null, maxPrice = null,
  inStockOnly = false, pickupOnly = false, sort = 'relevance', page = 1, pageSize = 12,
  specs = {}, customer = null, storeId = null,
} = {}) {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // the store scope of PRD-PLT-013: search finds only what this store carries
  const all = await productsAsync({ storeId });
  const categories = await repository('Category').getAllAsync();

  const descendants = (id) => {
    const direct = categories.filter((c) => c.parentCategoryId === id).map((c) => c.id);
    return [id, ...direct];
  };

  let rows = all;
  // native ACL: a product with SubjectToAcl on is shown only to the customer roles allowed on it
  // (AclRecord by customer role; IAM-007 computes the role membership)
  const roles = customer?.roles ?? ['Guests'];
  rows = rows.filter((p) => !(p.subjectToAcl === true && (p.limitedToCustomerRoles ?? []).length)
    || (p.limitedToCustomerRoles ?? []).some((r) => roles.includes(r)));
  if (terms.length) rows = rows.filter((p) => score(p, terms) > 0);
  if (categoryId) {
    const ids = descendants(Number(categoryId));
    rows = rows.filter((p) => (p.categoryIds ?? []).some((c) => ids.includes(c)));
  }
  if (vendorId) rows = rows.filter((p) => p.vendorId === Number(vendorId));
  if (inStockOnly) rows = rows.filter((p) => (p.stockQuantity ?? 0) > 0);
  if (pickupOnly) rows = rows.filter((p) => p.pickupOnly);
  if (minPrice != null) rows = rows.filter((p) => p.callForPrice || p.price >= Number(minPrice));
  if (maxPrice != null) rows = rows.filter((p) => p.callForPrice || p.price <= Number(maxPrice));
  for (const [key, value] of Object.entries(specs)) {
    if (!value) continue;
    rows = rows.filter((p) => String((p.specifications ?? {})[key] ?? '') === String(value));
  }

  const sorted = rows.slice();
  switch (sort) {
    case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
    case 'price-asc': sorted.sort((a, b) => (a.price || Infinity) - (b.price || Infinity)); break;
    case 'price-desc': sorted.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
    case 'created-desc': sorted.sort((a, b) => b.id - a.id); break;
    case 'position': sorted.sort((a, b) => a.id - b.id); break;
    default:
      sorted.sort((a, b) => score(b, terms) - score(a, terms) || a.id - b.id);
  }

  const total = sorted.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);
  const items = [];
  for (const p of pageRows) items.push(await viewProductAsync(p, { customer }));

  // facets, from the result set - SRC-003
  const vendors = await repository('Vendor').getAllAsync();
  const facetCounts = (fn) => rows.reduce((acc, p) => {
    const k = fn(p);
    if (k == null) return acc;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const specKeys = [...new Set(rows.flatMap((p) => Object.keys(p.specifications ?? {})))];

  return {
    items,
    total,
    page: Math.max(1, page),
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    sort,
    sortOptions: SORT_OPTIONS,
    facets: {
      vendors: Object.entries(facetCounts((p) => p.vendorId)).map(([id, count]) => ({
        id: Number(id), name: vendors.find((v) => v.id === Number(id))?.name ?? `Seller ${id}`, count,
      })),
      categories: Object.entries(facetCounts((p) => (p.categoryIds ?? [])[0])).map(([id, count]) => ({
        id: Number(id), name: categories.find((c) => c.id === Number(id))?.name ?? `Category ${id}`, count,
      })),
      priceRange: rows.length
        ? {
          min: Math.min(...rows.filter((p) => !p.callForPrice).map((p) => p.price)),
          max: Math.max(...rows.filter((p) => !p.callForPrice).map((p) => p.price)),
        }
        : null,
      inStock: rows.filter((p) => (p.stockQuantity ?? 0) > 0).length,
      pickupOnly: rows.filter((p) => p.pickupOnly).length,
      specifications: specKeys.map((k) => ({
        key: k,
        values: [...new Set(rows.map((p) => (p.specifications ?? {})[k]).filter(Boolean))],
      })).filter((s) => s.values.length > 1),
    },
    features: ['PRD-SRC-001', 'PRD-SRC-003', 'PRD-SRC-005'],
  };
}

/** SRC-002 suggestions while typing. */
export async function suggestAsync(q, limit = 6, storeId = null) {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const all = await productsAsync({ storeId });
  return all
    .map((p) => ({ p, s: score(p, terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ p }) => ({
      id: p.id, name: p.name, sku: p.sku, price: p.callForPrice ? null : p.price, picture: p.picture,
    }));
}
