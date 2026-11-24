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
