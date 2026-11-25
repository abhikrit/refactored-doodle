// PRD-PLT-013 Multi-store (B2B and B2C storefronts).
//
// One installation, several stores, each with its own Url and Hosts, its own catalogue through
// StoreMapping, its own prices through TierPrice.StoreId and its own setting rows.
// BR-PLT-011: run-time resolution has two levels only - the Setting row of the store, else the
// row with StoreId 0, else the settings-class default. No run-time layer resolver is built.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, getStoreSettingAsync } from '../../../core/settings.js';
import {
  storesForAsync, authorizedForStoreAsync, filterForStoreAsync,
} from '../../../core/store-mapping.js';
import { saveStoreMappingsAsync } from '../../product-sec/services/audit-trail.js';

export const storesAsync = () => repository('Store').getAllAsync();

export async function storeAsync(idOrCode) {
  const all = await storesAsync();
  return all.find((s) => String(s.id) === String(idOrCode) || s.code === idOrCode) ?? null;
}

/** The store a request belongs to, resolved the native way: by host, else by id. */
export async function resolveStoreAsync({ host = null, storeId = null }) {
  const all = await storesAsync();
  if (host) {
    const byHost = all.find((s) => String(s.url ?? '').toLowerCase() === String(host).toLowerCase()
      || (s.hosts ?? []).some((h) => String(h).toLowerCase() === String(host).toLowerCase()));
    if (byHost) return byHost;
  }
  return all.find((s) => Number(s.id) === Number(storeId)) ?? all[0] ?? null;
}

/**
 * Map an entity to stores. The write itself is SEC-004's override of
 * StoreMappingService.SaveStoreMappingsAsync, so the change is audited; PLT-013 sets the
 * LimitedToStores flag the native service keys on.
 */
export async function mapToStoresAsync({
  entity, entityId, storeIds, actor = null,
}) {
  const row = await repository(entity).getByIdAsync(entityId);
  if (!row) return { ok: false, message: `no such ${entity}` };
  await repository(entity).updateAsync({ ...row, limitedToStores: (storeIds ?? []).length > 0 });
  const saved = await saveStoreMappingsAsync({
    entity, entityId, storeIds, actor,
  });
  return {
    ok: true,
    entity,
    entityId: Number(entityId),
    storeIds: (storeIds ?? []).map(Number),
    limitedToStores: (storeIds ?? []).length > 0,
    savedThrough: saved.overrideOf,
  };
}

export const mappedStoresAsync = (entity, entityId) => storesForAsync(entity, entityId);

/** AC-PLT-013-01-01: listed, searchable and purchasable only in the stores it is mapped to. */
export async function visibilityAsync({ entity = 'Product', entityId, storeId }) {
  const row = await repository(entity).getByIdAsync(entityId);
  const stores = await storesForAsync(entity, entityId);
  const allowed = await authorizedForStoreAsync(entity, row, storeId);
  return {
    entity,
    entityId: Number(entityId),
    storeId: Number(storeId),
    limitedToStores: row?.limitedToStores === true,
    mappedStores: stores,
    listed: allowed,
    searchable: allowed,
    purchasable: allowed,
    checkedBy: 'StoreMappingService.AuthorizeAsync',
  };
}

export const filterToStoreAsync = (entity, rows, storeId) => filterForStoreAsync(entity, rows, storeId);

/**
 * AC-PLT-013-01-05 and BR-PLT-011: which of the two levels supplied the value, so the admin can
 * see that a store row overrides the shared row and that other stores keep the shared value.
 */
export async function effectiveSettingAsync({ key, storeId }) {
  const own = await getStoreSettingAsync(key, Number(storeId));
  const shared = await getStoreSettingAsync(key, 0);
  const value = own === undefined ? shared : own;
  return {
    key,
    storeId: Number(storeId),
    value: value === undefined ? null : value,
    level: own !== undefined ? 'store row' : (shared !== undefined ? 'shared row (StoreId 0)' : 'settings-class default'),
    storeValue: own === undefined ? null : own,
    sharedValue: shared === undefined ? null : shared,
    rule: 'BR-PLT-011',
    resolvedBy: 'SettingService.LoadSettingAsync with loadSharedValueIfNotFound',
  };
}

/** The same key across every store: what the admin store-scope selector shows. */
export async function settingAcrossStoresAsync(key) {
  const all = await storesAsync();
  const rows = [];
  for (const store of all) rows.push({ store: store.code ?? String(store.id), ...await effectiveSettingAsync({ key, storeId: store.id }) });
  return { key, rows };
}

/**
 * AC-PLT-013-01-02 / 01-03 / 01-04: what a buyer reaches in one store - the store's catalogue,
 * the prices for their roles in that store, and the trading models mapped to it.
 */
export async function storefrontAsync({ storeId, customer = null }) {
  const store = await storeAsync(storeId);
  if (!store) return { ok: false, message: 'no such store' };
  const products = await filterForStoreAsync('Product', await repository('Product').getAllAsync((p) => p.published), store.id);
  const roles = customer?.roles ?? ['Guests'];
  const rows = [];
  for (const product of products) {
    const tiers = (product.tierPrices ?? []).filter((t) => {
      const forStore = t.storeId === undefined || Number(t.storeId) === 0 || Number(t.storeId) === Number(store.id);
      const forRole = !t.customerRole || roles.includes(t.customerRole);
      return forStore && forRole;
    });
    rows.push({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      tradingModel: product.tradingModel ?? 'retail',
      tierPrices: tiers,
      lowestTierPrice: tiers.length ? Math.min(...tiers.map((t) => t.price)) : null,
    });
  }
  return {
    ok: true,
    store: {
      id: store.id, code: store.code, name: store.name, channel: store.channel, url: store.url, hosts: store.hosts ?? [store.url],
    },
    audience: store.channel === 'B2B' ? 'business buyers' : 'consumers',
    customerRoles: roles,
    products: rows,
    tradingModels: [...new Set(rows.map((r) => r.tradingModel))].sort(),
    theme: await getSettingAsync('storeinformationsettings.defaultstoretheme', store.id, null),
  };
}
