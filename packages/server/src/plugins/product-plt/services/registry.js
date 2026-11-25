// PRD-PLT-022 Feature and module registry, and the contract IC-PLT-02 every module reads before
// it shows a page, renders a widget, runs an action or does scheduled work.
//
// BR-PLT-030: a feature state is the setting productfeature.<prd-id> — StoreId 0 for the client,
// StoreId n for a store — and resolves store value, else client value, else off.
// Decision D-01: the Platform core tier is always on.
// BR-PLT-012: a feature whose plugin is not installed queues the plugin and asks for a restart;
// where the plugin type supports store limits the store states are written to LimitedToStores.

import { registry } from '@product/shared';
import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync, getStoreSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';

const key = (featureId) => `productfeature.${String(featureId).toLowerCase()}`;
const descriptorRepo = () => plainRepository('PluginDescriptor');

export const ALWAYS_ON_PACK = 'Core (always on)';

const featureById = Object.fromEntries(registry.features.map((f) => [f.id, f]));

/** The plugin that implements a feature: one module per area. */
export const implementingPlugin = (featureId) => `Product.${String(featureId).split('-')[1]}`;

/** BR-PLT-030: store value, else client value, else off. */
export async function stateAsync({ featureId, storeId = 1 }) {
  const definition = featureById[featureId];
  const store = await getStoreSettingAsync(key(featureId), storeId);
  const client = await getStoreSettingAsync(key(featureId), 0);
  const alwaysOn = definition?.pack === ALWAYS_ON_PACK;
  const resolved = alwaysOn
    ? true
    : store !== undefined ? Boolean(store) : client !== undefined ? Boolean(client) : false;
  return {
    featureId,
    enabled: resolved,
    forStore: store === undefined ? null : Boolean(store),
    forClient: client === undefined ? null : Boolean(client),
    resolvedFrom: alwaysOn ? 'the Platform core tier is always on'
      : store !== undefined ? 'the store value'
        : client !== undefined ? 'the client value' : 'off, because no layer states it',
    alwaysOn,
    rule: 'BR-PLT-030',
  };
}

/** IC-PLT-02 IsEnabled. */
export async function isEnabledAsync(featureId, storeId = 1) {
  return (await stateAsync({ featureId, storeId })).enabled;
}

/** AC-PLT-022-01-01: the registry screen, per client and per store. */
export async function registryAsync({ storeId = 1, actor = null, area = null } = {}) {
  if (actor && !await authorizeAsync('Platform.Core.Features.View', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Features.View' };
  }
  const stores = await repository('Store').getAllAsync();
  const rows = [];
  for (const f of registry.features) {
    if (area && f.area !== area) continue;
    const state = await stateAsync({ featureId: f.id, storeId });
    const perStore = [];
    for (const store of stores) {
      const s = await stateAsync({ featureId: f.id, storeId: store.id });
      perStore.push({ storeId: store.id, storeName: store.name, enabled: s.enabled, own: s.forStore });
    }
    const plugin = implementingPlugin(f.id);
    const descriptor = await descriptorRepo().getOneAsync((d) => d.systemName === plugin);
    rows.push({
      id: f.id,
      name: f.name,
      area: f.area,
      pack: f.pack,
      tier: f.pack === ALWAYS_ON_PACK ? 'Platform core' : f.pack,
      phase: f.phase,
      dependsOn: f.dependsOn ?? [],
      implementingPlugins: [plugin],
      pluginInstalled: descriptor ? descriptor.installed === true : true,
      forClient: state.forClient,
      enabled: state.enabled,
      alwaysOn: state.alwaysOn,
      perStore,
      held: f.held === true,
      prototypeDefaultLabel: f.prototypeDefaultLabel ?? null,
    });
  }
  return {
    ok: true, features: rows, total: rows.length, stores: stores.map((s) => ({ id: s.id, name: s.name })),
  };
}

/**
 * AC-PLT-022-01-02 to 01-05: switch a feature on or off.
 * The dependency and always-on rules refuse the change; a plugin that is not installed is queued.
 */
export async function setFeatureAsync({
  featureId, enabled, storeId = null, actor = null, by = 'administrator',
}) {
  if (actor && !await authorizeAsync('Platform.Core.Features.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Features.CreateEditDelete' };
  }
  const definition = featureById[featureId];
  if (!definition) return { ok: false, message: `${featureId} does not name a product feature` };

  // decision D-01: the Platform core tier is always on
  if (definition.pack === ALWAYS_ON_PACK && enabled !== true) {
    return {
      ok: false,
      refused: true,
      messageKey: 'Plt.FeatureAlwaysOn',
      message: resource('Plt.FeatureAlwaysOn'),
      tier: 'Platform core',
      decision: 'D-01',
    };
  }

  // a feature cannot be switched on while something it depends on is off
  if (enabled === true) {
    const off = [];
    for (const dependency of definition.dependsOn ?? []) {
      if (!featureById[dependency]) continue;
      const state = await stateAsync({ featureId: dependency, storeId: storeId ?? 1 });
      if (!state.enabled) off.push(dependency);
    }
    if (off.length) {
      return {
        ok: false,
        refused: true,
        messageKey: 'Plt.FeatureDependencyOff',
        message: `${resource('Plt.FeatureDependencyOff')} (${off.join(', ')})`,
        dependenciesOff: off,
      };
    }
  }

  const target = storeId ?? 0;
  const before = await stateAsync({ featureId, storeId: storeId ?? 1 });
  await saveSettingAsync(key(featureId), enabled === true, target, 'runtime');

  // BR-PLT-012: the plugin that implements it may not be installed yet
  const plugin = implementingPlugin(featureId);
  const descriptor = await descriptorRepo().getOneAsync((d) => d.systemName === plugin);
  let queued = false;
  if (enabled === true && descriptor && descriptor.installed !== true) {
    await descriptorRepo().updateAsync({
      ...descriptor,
      queuedForInstall: true,
      queuedThrough: 'IPluginService.PreparePluginToInstallAsync',
      limitedToStores: storeId
        ? [...new Set([...(descriptor.limitedToStores ?? []), storeId])]
        : (descriptor.limitedToStores ?? []),
      savedThrough: 'PluginDescriptor.Save',
    });
    queued = true;
  } else if (descriptor && storeId && descriptor.supportsStoreLimits !== false) {
    const limited = new Set(descriptor.limitedToStores ?? []);
    if (enabled === true) limited.add(storeId); else limited.delete(storeId);
    await descriptorRepo().updateAsync({ ...descriptor, limitedToStores: [...limited], savedThrough: 'PluginDescriptor.Save' });
  }

  await auditAsync({
    event: 'AUD-PLT-007',
    area: 'PLT',
    feature: 'PRD-PLT-022',
    entity: 'ProductFeature',
    entityId: featureId,
    actor: by,
    before: { enabled: before.enabled, scope: storeId ? `store ${storeId}` : 'client' },
    after: { enabled: enabled === true, scope: storeId ? `store ${storeId}` : 'client' },
    storeId: storeId ?? 0,
    note: 'product feature switched',
  });

  const state = await stateAsync({ featureId, storeId: storeId ?? 1 });
  return {
    ok: true,
    featureId,
    state,
    settingKey: key(featureId),
    settingStoreId: target,
    pluginQueued: queued,
    plugin,
    limitedToStores: (await descriptorRepo().getOneAsync((d) => d.systemName === plugin))?.limitedToStores ?? [],
    restartRequired: queued,
    messageKey: queued ? 'Plt.RestartRequired' : null,
    message: queued ? resource('Plt.RestartRequired') : null,
  };
}

/** AC-PLT-022-02-01: what a module may show for a store, and what its scheduled work skips. */
export async function surfaceAsync({ featureId, storeId = 1 }) {
  const state = await stateAsync({ featureId, storeId });
  const definition = featureById[featureId];
  const screens = (registry.screens ?? []).filter((s) => String(s.features ?? '').includes(featureId));
  return {
    featureId,
    storeId,
    enabled: state.enabled,
    pagesShown: state.enabled ? screens.map((s) => s.screen) : [],
    widgetsRendered: state.enabled,
    actionsAllowed: state.enabled,
    scheduledWorkSkipsStore: !state.enabled,
    contract: 'IC-PLT-02',
    area: definition?.area ?? null,
  };
}

/** The scheduled-task view: which stores a product task runs for. */
export async function scheduledWorkAsync({ featureId }) {
  const stores = await repository('Store').getAllAsync();
  const out = [];
  for (const store of stores) {
    const state = await stateAsync({ featureId, storeId: store.id });
    out.push({ storeId: store.id, storeName: store.name, runs: state.enabled, skipped: !state.enabled });
  }
  return { featureId, stores: out, contract: 'IC-PLT-02' };
}
