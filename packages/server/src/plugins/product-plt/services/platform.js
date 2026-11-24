// PLT - configuration packs, the feature registry and the platform view.
//
// PLT-003 configuration packs (the pack loader), PLT-005 export/import/promotion,
// PLT-022 feature and module registry. Switching the client pack must change behaviour with no
// code change - that is the Product Goal, and this service is where it is demonstrated.

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from '@product/shared';
import { buildChain, applyPackChainAsync, discoverPacks } from '../../../core/pack-loader.js';
import { allSettingsAsync, getSettingAsync } from '../../../core/settings.js';
import { seedAsync } from '../../../data/seed/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', '..');

let current = { clientId: null, storeId: 1, report: null, seed: null };

export function repoRoot() {
  return ROOT;
}

export function currentState() {
  return current;
}

export async function applyClientAsync({ clientId, storeId = 1, actor = 'platform' }) {
  const chain = buildChain(ROOT, clientId, storeId);
  const report = await applyPackChainAsync(chain, { storeId, replace: true, actor });
  const seed = await seedAsync({ clientId, report });
  // the seed resets the in-memory store, so the merged settings are written again after it
  const report2 = await applyPackChainAsync(chain, { storeId, replace: true, actor });
  current = { clientId, storeId, report: report2, seed };
  return current;
}

export function availableClientsAsync() {
  const packs = discoverPacks(ROOT);
  return packs.client.map((p) => ({
    id: p.id,
    name: p.name,
    country: p.extends?.country ?? null,
    verticals: p.extends?.verticals ?? [],
    description: p.description,
    heldDecisions: p._heldDecisionsVisibleToUsers ?? [],
    notStatedInSource: p._notStatedInSource ?? [],
  }));
}

export function packInventory() {
  const packs = discoverPacks(ROOT);
  return Object.fromEntries(Object.entries(packs).map(([layer, list]) => [layer, list.map((p) => ({
    id: p.id,
    name: p.name,
    version: p.version ?? null,
    file: p._file.replace(/.*\/packs\//, 'packs/'),
    settings: Object.keys(p.settings ?? {}).length,
    features: Object.keys(p.features ?? {}).length,
    description: p.description ?? '',
    packAssignment: p._packAssignment ?? null,
  }))]));
}

/** PLT-022: the feature registry as the admin screen shows it, per store. */
export async function featureRegistryAsync({ storeId = 1 } = {}) {
  const rows = [];
  for (const f of registry.features) {
    const value = await getSettingAsync(`productfeature.${f.id.toLowerCase()}`, storeId, null);
    rows.push({
      id: f.id,
      name: f.name,
      area: f.area,
      phase: f.phase,
      pack: f.pack,
      implementation: f.implementation,
      enabled: value === null ? false : Boolean(value),
      inPackSet: value !== null,
      held: f.held,
      heldBy: f.heldBy,
      prototypeDefaultLabel: f.prototypeDefaultLabel,
      wave: f.wave,
    });
  }
  return rows;
}

export async function settingsViewAsync() {
  return allSettingsAsync();
}
