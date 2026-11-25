// Settings service with nopCommerce 5.00.1 resolution semantics.
//
// L1 section 6.5: "Runtime resolution in nopCommerce is two-level only: store-specific value,
// else the StoreId 0 shared value (SettingService.LoadSettingAsync)." Global, country, vertical
// and client layers exist only in pack files; the PLT-003 pack loader merges them at apply time
// and writes the result as StoreId 0 rows, store-layer keys as StoreId = n rows (BR-PLT-010).
// No runtime layer resolver is built (NOP-906).
//
// Keys are lower-case <SettingsClassName>.<PropertyName>, exactly as the Setting table holds them.

import { repository } from './repository.js';

const settingRepo = () => repository('Setting');

const normalise = (key) => String(key).trim().toLowerCase();

/** Write a setting row. storeId 0 = shared. Records which pack layer the value came from. */
export async function saveSettingAsync(key, value, storeId = 0, layer = 'runtime') {
  const name = normalise(key);
  const existing = await settingRepo().getOneAsync((s) => s.name === name && s.storeId === storeId);
  const row = {
    name, value, storeId, layer, valueType: typeof value,
  };
  return existing
    ? settingRepo().updateAsync({ ...existing, ...row })
    : settingRepo().insertAsync(row);
}

/** LoadSettingAsync: store value, else the shared (StoreId 0) value, else the fallback. */
export async function getSettingAsync(key, storeId = 0, fallback = undefined) {
  const name = normalise(key);
  if (storeId !== 0) {
    const scoped = await settingRepo().getOneAsync((s) => s.name === name && s.storeId === storeId);
    if (scoped) return scoped.value;
  }
  const shared = await settingRepo().getOneAsync((s) => s.name === name && s.storeId === 0);
  return shared ? shared.value : fallback;
}

/** Every key of a settings group, e.g. "ordersettings" -> { anonymouscheckoutallowed: true, ... }. */
export async function getSettingGroupAsync(group, storeId = 0) {
  const prefix = `${normalise(group)}.`;
  const rows = await settingRepo().getAllAsync((s) => s.name.startsWith(prefix));
  const out = {};
  for (const r of rows) {
    const short = r.name.slice(prefix.length);
    if (r.storeId === 0 && out[short] !== undefined) continue;
    if (r.storeId === 0 || r.storeId === storeId) {
      if (r.storeId === storeId || out[short] === undefined) out[short] = r.value;
    }
  }
  return out;
}

/** The row of one store only - no fallback to the shared value (BR-PLT-030, BR-PLT-011). */
export async function getStoreSettingAsync(key, storeId) {
  const name = normalise(key);
  const row = await settingRepo().getOneAsync((s) => s.name === name && s.storeId === Number(storeId));
  return row ? row.value : undefined;
}

export async function allSettingsAsync() {
  const rows = await settingRepo().getAllAsync();
  return rows.slice().sort((a, b) => a.name.localeCompare(b.name) || a.storeId - b.storeId);
}

/** Setting rows a key catalogue declares but no pack supplies - NFR-X-008 pack validation. */
export async function missingKeysAsync(catalogue) {
  const rows = await settingRepo().getAllAsync();
  const present = new Set(rows.map((r) => r.name));
  return catalogue.filter((k) => !present.has(normalise(k)));
}

export async function clearSettingsAsync() {
  await settingRepo().truncateAsync();
}

/**
 * AC-PLT-003-01-03: a store row the new pack version no longer states is deleted, so the store
 * uses the shared (StoreId 0) value again.
 */
export async function deleteSettingAsync(key, storeId) {
  const name = normalise(key);
  const row = await settingRepo().getOneAsync((s) => s.name === name && s.storeId === storeId);
  if (!row) return { deleted: false };
  await settingRepo().deleteAsync(row.id);
  return { deleted: true, name, storeId };
}

/**
 * ISettingService.ClearCacheAsync. The prototype resolves every read from the store, so there is
 * no cache to drop; the call is recorded, because AC-PLT-003-02-03 requires it to happen once at
 * the end of an apply rather than after every write.
 */
const cacheClears = [];
export async function clearSettingCacheAsync(reason = 'pack apply') {
  cacheClears.push({ reason, at: new Date().toISOString() });
  if (cacheClears.length > 100) cacheClears.shift();
  return { cleared: true, reason, clears: cacheClears.length };
}

export const settingCacheClears = () => cacheClears.slice().reverse();
