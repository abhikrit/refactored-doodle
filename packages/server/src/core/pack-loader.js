// Configuration packs - PRD-PLT-003, PLT-005, PLT-022.
//
// BR-PLT-010 / L1 section 6.5: the pack loader merges global -> country -> vertical -> client -> store
// at apply time and writes the result as StoreId 0 rows, store-layer keys as StoreId = n rows.
// There is no runtime layer resolver (NOP-906): once applied, a value is just a Setting row.
//
// This is the mechanism the Product Goal rests on - "onboarding a new client means configuring
// the product, not rebuilding it" - so the loader also reports, per key, which layer won, which
// is what the admin Configuration packs screen shows.
//
// BR-PLT-013 / decision CFG-01: a secret never travels in a pack. A pack carrying one is refused.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { featureById } from '@product/shared';
import { saveSettingAsync, clearSettingsAsync } from './settings.js';
import { auditAsync } from './audit.js';

export const LAYER_ORDER = ['global', 'country', 'vertical', 'client', 'store'];
// A key is a secret when its LAST segment ends with a secret word: smtp.password and
// pay.mpesa.consumersecret are secrets, customersettings.passwordminlength is a password policy.
const SECRET_SUFFIX = /(secret|password|passkey|apikey|api_key|privatekey|accesstoken|token|credential|credentials|consumerkey)$/i;
const isSecretKey = (key) => SECRET_SUFFIX.test(String(key).split('.').pop());

function packsRoot(root) {
  return join(root, 'packs');
}

function readPack(file) {
  const pack = JSON.parse(readFileSync(file, 'utf8'));
  pack._file = file;
  // a repo-relative path for display, with forward slashes on every platform
  pack._path = file.split(sep).join('/').replace(/^.*\/packs\//, 'packs/');
  return pack;
}

/** Every pack file on disk, keyed by layer and id. */
export function discoverPacks(root) {
  const base = packsRoot(root);
  const out = { global: [], country: [], vertical: [], client: [], store: [] };
  for (const layer of LAYER_ORDER) {
    const dir = join(base, layer);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.json')) out[layer].push(readPack(join(dir, entry.name)));
      else if (entry.isDirectory()) {
        for (const f of readdirSync(join(dir, entry.name))) {
          if (f.endsWith('.json')) out[layer].push(readPack(join(dir, entry.name, f)));
        }
      }
    }
  }
  return out;
}

/** Pack-level validation: secrets, malformed keys, unknown feature IDs (NFR-X-008). */
export function validatePack(pack) {
  const problems = [];
  for (const key of Object.keys(pack.settings ?? {})) {
    if (isSecretKey(key)) {
      problems.push({
        severity: 'refused', key, rule: 'BR-PLT-013 / CFG-01', message: 'a secret must not be stored in a configuration pack',
      });
    }
    if (!/^[a-z0-9]+(\.[a-z0-9_<>-]+)+$/.test(key)) {
      problems.push({
        severity: 'warning', key, rule: 'L1 section 6.5', message: 'setting key is not lower-case <settingsclass>.<property>',
      });
    }
  }
  for (const id of Object.keys(pack.features ?? {})) {
    if (!featureById[id]) {
      problems.push({
        severity: 'refused', key: id, rule: 'PLT-022', message: 'feature toggle does not name a PRD feature',
      });
    }
  }
  return problems;
}

/**
 * Build the merge chain for a client, then apply it.
 * The client pack names its country and the vertical packs it switches on; nothing else selects
 * a pack, so onboarding a client is exactly: write a client pack.
 */
export function buildChain(root, clientId, storeId = 1) {
  const all = discoverPacks(root);
  const client = all.client.find((p) => p.id === clientId);
  if (!client) throw new Error(`no client pack for ${clientId} (packs/client/${clientId})`);
  const country = all.country.find((p) => p.id === client.extends?.country);
  if (client.extends?.country && !country) throw new Error(`no country pack ${client.extends.country}`);
  const verticals = (client.extends?.verticals ?? [])
    .map((v) => {
      const found = all.vertical.find((p) => p.id === v);
      if (!found) throw new Error(`no vertical pack ${v}`);
      return found;
    });
  const store = all.store.filter((p) => String(p.storeId ?? p.id) === String(storeId)
    && (!p.client || p.client === clientId));
  return [...all.global, ...(country ? [country] : []), ...verticals, client, ...store];
}

/**
 * Apply a chain: merge in layer order, write Setting rows, return the merge report.
 * Resolution of the written rows is then nopCommerce's own two-level rule (settings.js).
 */
export async function applyPackChainAsync(chain, { storeId = 1, replace = true, actor = 'platform' } = {}) {
  const problems = chain.flatMap((p) => validatePack(p).map((x) => ({ ...x, pack: `${p.layer}/${p.id}` })));
  const refused = problems.filter((p) => p.severity === 'refused');
  if (refused.length) {
    const err = new Error(`pack chain refused: ${refused.map((r) => `${r.pack} ${r.key} (${r.rule})`).join('; ')}`);
    err.problems = problems;
    throw err;
  }

  if (replace) await clearSettingsAsync();

  const merged = new Map(); // key -> { value, layer, pack, storeId, overrode: [] }
  const apply = (pack, key, value, targetStoreId) => {
    const previous = merged.get(key);
    merged.set(key, {
      key,
      value,
      layer: pack.layer,
      pack: `${pack.layer}/${pack.id}`,
      storeId: targetStoreId,
      overrode: previous ? [...previous.overrode, { layer: previous.layer, pack: previous.pack, value: previous.value }] : [],
    });
  };

  for (const pack of chain) {
    const targetStoreId = pack.layer === 'store' ? storeId : 0;
    for (const [key, value] of Object.entries(pack.settings ?? {})) apply(pack, key, value, targetStoreId);
    for (const [featureId, on] of Object.entries(pack.features ?? {})) {
      apply(pack, `productfeature.${featureId.toLowerCase()}`, on, targetStoreId);
    }
  }

  for (const row of merged.values()) await saveSettingAsync(row.key, row.value, row.storeId, row.layer);

  const report = {
    client: chain.find((p) => p.layer === 'client')?.id ?? null,
    storeId,
    appliedOnUtc: new Date().toISOString(),
    chain: chain.map((p) => ({
      layer: p.layer, id: p.id, name: p.name, version: p.version ?? null, file: p._path,
      settings: Object.keys(p.settings ?? {}).length,
      features: Object.keys(p.features ?? {}).length,
    })),
    keys: [...merged.values()].sort((a, b) => a.key.localeCompare(b.key)),
    entities: chain.reduce((acc, p) => {
      for (const [k, v] of Object.entries(p.entities ?? {})) acc[k] = v; // later layer replaces
      return acc;
    }, {}),
    content: chain.reduce((acc, p) => ({ ...acc, ...(p.content ?? {}) }), {}),
    problems,
  };

  await auditAsync({
    event: 'AUD-PLT-003-01',
    area: 'PLT',
    feature: 'PRD-PLT-003',
    entity: 'ConfigurationPack',
    entityId: report.client,
    actor,
    actorRole: 'Platform team',
    after: { chain: report.chain.map((c) => `${c.layer}/${c.id}`), keys: report.keys.length },
    note: `pack chain applied in order ${LAYER_ORDER.join(' -> ')} (BR-PLT-010)`,
  });

  return report;
}

/** PLT-022: is a feature switched on for this store? */
export function featureEnabled(report, featureId) {
  const row = report.keys.find((k) => k.key === `productfeature.${featureId.toLowerCase()}`);
  return row ? Boolean(row.value) : null;
}
