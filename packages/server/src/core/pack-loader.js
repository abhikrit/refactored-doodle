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
import { join, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { featureById, registry } from '@product/shared';
import {
  saveSettingAsync, clearSettingsAsync, getSettingAsync, allSettingsAsync, deleteSettingAsync,
  clearSettingCacheAsync,
} from './settings.js';
import { auditAsync } from './audit.js';
import { withLockAsync } from './locker.js';
import { plainRepository } from './repository.js';
import { resource } from './messages.js';

export const LAYER_ORDER = ['global', 'country', 'vertical', 'client', 'store'];
export const WRITE_LOCK_KEY = 'plt-config-write';

/**
 * AC-PLT-003-01-04: a setting key is accepted only when it is a property of a known ISettings
 * class or a key an installed product plugin has declared. The catalogue is the subset of the
 * 5.00.1 settings this prototype exercises, with the keys 5.00 removed or moved listed so a pack
 * written for 4.90 fails with the name of its replacement (AC-PLT-003-01-11).
 */
// the repository root, worked out from this file rather than from the process directory: the dev
// server runs with packages/web as its working directory
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

let catalogue = null;
export function settingsCatalogue(root) {
  if (catalogue) return catalogue;
  const file = join(root ?? REPO_ROOT, 'platform', 'settings-catalogue.json');
  catalogue = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf8'))
    : {
      nativeClasses: {}, productKeys: {}, removedIn500: {}, movedIn500: {}, removedPermissionsIn500: [],
    };
  return catalogue;
}

/** A product plugin declares the keys it owns at installation. */
const pluginKeys = new Map(); // owner -> { prefixes, keys }

export function declareSettingKeys({
  owner, prefixes = [], keys = [], fixedValues = {}, packDefaults = {}, secretKeys = [],
}) {
  pluginKeys.set(owner, {
    owner, prefixes, keys, fixedValues, packDefaults, secretKeys,
  });
  return pluginKeys.get(owner);
}

/**
 * The keys a module's own key catalogue flags secret (BR-PAY-110, BR-PLT-013). A pack that
 * states one is refused and an export omits it, whatever its spelling.
 */
export function declaredSecretKeys() {
  return [...pluginKeys.values()].flatMap((d) => (d.secretKeys ?? []).map((key) => ({ owner: d.owner, key })));
}

export const isDeclaredSecretKey = (key) => declaredSecretKeys().some((s) => s.key === key);

/**
 * A native install default a module turns round for every pack unless the client pack states the
 * key itself (BR-PAY-170, AC-PAY-011-01-02). Unlike a fixed value it is not refused when a pack
 * states it: the pack simply wins.
 */
export function packDefaultsDeclared() {
  const out = [];
  for (const declaration of pluginKeys.values()) {
    for (const [key, value] of Object.entries(declaration.packDefaults ?? {})) {
      out.push({ owner: declaration.owner, key, ...value });
    }
  }
  return out;
}

/**
 * A key a plugin's catalogue pins to one value (AC-CHK-004-01-08 / decision CART-500): pack
 * validation refuses any other value for it, whatever layer states it.
 */
export function fixedKeyValue(key) {
  for (const declaration of pluginKeys.values()) {
    const fixed = declaration.fixedValues ?? {};
    if (Object.prototype.hasOwnProperty.call(fixed, key)) {
      return { owner: declaration.owner, ...fixed[key] };
    }
  }
  return null;
}

export const declaredSettingKeys = () => [...pluginKeys.values()];

const declaredByPlugin = (key) => [...pluginKeys.values()].some(
  (d) => d.keys.includes(key) || d.prefixes.some((prefix) => key.startsWith(prefix)),
);

/**
 * The permission system names this instance holds a PermissionRecord for. AC-PLT-003-01-05
 * refuses a permission the instance does not know, and the instance knows the PRD-declared
 * names plus every native 5.00.1 record installed at seed time, so the permission service
 * declares each record here as it inserts it.
 */
const installedPermissions = new Set();

export function declarePermissionNames(names) {
  for (const name of names) installedPermissions.add(String(name));
  return installedPermissions.size;
}

export const declaredPermissionNames = () => [...installedPermissions];

const typeOfValue = (value) => (Array.isArray(value) ? 'array' : value === null ? 'string' : typeof value);

/** The TypeConverter check: the value must convert to the type the property holds. */
export function convertible(expected, value) {
  if (!expected || expected === 'string') return true;
  const actual = typeOfValue(value);
  if (actual === expected) return true;
  if (expected === 'boolean') return value === 'true' || value === 'false';
  if (expected === 'number') return actual === 'string' && value.trim() !== '' && !Number.isNaN(Number(value));
  if (expected === 'array') return actual === 'string';
  if (expected === 'object') return false;
  return false;
}

export const checksumOf = (pack) => createHash('sha256')
  .update(JSON.stringify({
    id: pack.id,
    layer: pack.layer,
    version: pack.version ?? null,
    settings: pack.settings ?? {},
    features: pack.features ?? {},
    permissions: pack.permissions ?? {},
    stores: pack.stores ?? {},
    plugins: pack.plugins ?? {},
    entities: pack.entities ?? {},
    content: pack.content ?? {},
  }))
  .digest('hex')
  .slice(0, 16);
// A key is a secret when its LAST segment ends with a secret word: smtp.password and
// pay.mpesa.consumersecret are secrets, customersettings.passwordminlength is a password policy.
const SECRET_SUFFIX = /(secret|password|passkey|apikey|api_key|privatekey|accesstoken|token|credential|credentials|consumerkey)$/i;
const isSecretKey = (key) => SECRET_SUFFIX.test(String(key).split('.').pop());

function packsRoot(root) {
  return join(root ?? REPO_ROOT, 'packs');
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

/**
 * Pack-level validation. Every refusal names the key and the message the chapter states, and a
 * refused pack writes nothing (AC-PLT-003-01-04 to 01-07, 01-11).
 */
export function validatePack(pack, { root = null, stores = null } = {}) {
  const problems = [];
  const cat = settingsCatalogue(root);
  const refuse = (key, rule, messageKey, message) => problems.push({
    severity: 'refused', key, rule, messageKey, message,
  });

  for (const [key, value] of Object.entries(pack.settings ?? {})) {
    const fixed = fixedKeyValue(key);
    if (fixed && value !== fixed.value) {
      refuse(
        key,
        fixed.rule ?? 'the plugin key catalogue',
        'Plt.PackKeyUnknown',
        `${resource('Plt.PackKeyUnknown')} (${key}: ${fixed.owner} fixes this key at ${JSON.stringify(fixed.value)}${fixed.reason ? ` - ${fixed.reason}` : ''})`,
      );
      continue;
    }
    if (isSecretKey(key) || isDeclaredSecretKey(key)) {
      refuse(key, 'BR-PLT-013 / CFG-01', 'Plt.PackSecretRefused', `${resource('Plt.PackSecretRefused')} (${key})`);
      continue;
    }
    if (!/^[a-z0-9]+(\.[a-z0-9_<>-]+)+$/.test(key)) {
      refuse(key, 'L1 section 6.5', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${key}: the key is not lower-case <settingsclass>.<property>)`);
      continue;
    }
    if (cat.removedIn500?.[key]) {
      refuse(key, 'VER-500', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${key}: ${cat.removedIn500[key]})`);
      continue;
    }
    if (cat.movedIn500?.[key]) {
      refuse(key, 'VER-500', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${key}: renamed to ${cat.movedIn500[key]} in 5.00)`);
      continue;
    }
    const [className, ...rest] = key.split('.');
    const property = rest.join('.');
    const nativeClass = cat.nativeClasses?.[className];
    if (nativeClass) {
      if (nativeClass[property] === undefined) {
        refuse(key, 'AC-PLT-003-01-04', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${key}: ${className} has no property ${property})`);
        continue;
      }
      if (!convertible(nativeClass[property], value)) {
        refuse(key, 'AC-PLT-003-01-04', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${key}: the value cannot be read as ${nativeClass[property]})`);
        continue;
      }
    } else if (!(cat.productKeys?.[className]) && !declaredByPlugin(key)) {
      refuse(key, 'AC-PLT-003-01-04', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${key}: no settings class and no installed plugin owns it)`);
    }
  }

  // AC-PLT-003-01-05: the permission names must be the 5.00 ones
  const known = new Set([
    ...registry.permissions.flatMap((p) => String(p.systemName).split('/').map((x) => x.trim())),
    ...installedPermissions,
  ]);
  for (const [permission, roles] of Object.entries(pack.permissions ?? {})) {
    if ((cat.removedPermissionsIn500 ?? []).includes(permission)) {
      refuse(permission, 'VER-500', 'Plt.PackPermissionUnknown', `${resource('Plt.PackPermissionUnknown')} (${permission}: ${cat.removedPermissionsNote ?? 'removed in 5.00'})`);
      continue;
    }
    if (!known.has(permission)) {
      refuse(permission, 'AC-PLT-003-01-05', 'Plt.PackPermissionUnknown', `${resource('Plt.PackPermissionUnknown')} (${permission})`);
      continue;
    }
    if (!Array.isArray(roles)) {
      refuse(permission, 'AC-PLT-003-01-05', 'Plt.PackPermissionUnknown', `${resource('Plt.PackPermissionUnknown')} (${permission}: the roles are a list)`);
    }
  }

  // AC-PLT-003-01-06: a store entry must name a store that exists
  for (const storeCode of Object.keys(pack.stores ?? {})) {
    if (stores && !stores.includes(storeCode)) {
      refuse(storeCode, 'AC-PLT-003-01-06', 'Plt.PackStoreUnknown', `${resource('Plt.PackStoreUnknown')} (${storeCode})`);
    }
  }

  for (const id of Object.keys(pack.features ?? {})) {
    if (!featureById[id]) {
      refuse(id, 'PLT-022', 'Plt.PackKeyUnknown', `${resource('Plt.PackKeyUnknown')} (${id} does not name a product feature)`);
    }
  }

  // BR-SEC-001 and BR-SEC-002: the password format and the encryption key never come from a pack
  const passwordFormat = pack.settings?.['customersettings.defaultpasswordformat'];
  if (passwordFormat !== undefined && !/^hashed$/i.test(String(passwordFormat))) {
    refuse('customersettings.defaultpasswordformat', 'BR-SEC-001', 'Plt.PackKeyUnknown', 'the password format is Hashed; Clear and Encrypted are refused');
  }
  if (pack.settings?.['securitysettings.encryptionkey'] !== undefined) {
    refuse('securitysettings.encryptionkey', 'BR-SEC-002', 'Plt.PackSecretRefused', 'the encryption key is unique to the instance and must not be in a pack');
  }
  if (pack.settings?.['securitysettings.useaesencryptionalgorithm'] === false) {
    refuse('securitysettings.useaesencryptionalgorithm', 'BR-SEC-002', 'Plt.PackKeyUnknown', 'AES encryption stays on');
  }

  return problems;
}

/** AC-PLT-003-01-10: a pack set names exactly one country pack. */
export function validateChain(chain) {
  const countries = chain.filter((p) => p.layer === 'country');
  if (countries.length === 1) return [];
  return [{
    severity: 'refused',
    key: countries.length ? countries.map((c) => c.id).join(', ') : '(none)',
    rule: 'AC-PLT-003-01-10',
    messageKey: 'Plt.PackCountryInvalid',
    message: `${resource('Plt.PackCountryInvalid')} (${countries.length} country packs)`,
  }];
}

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
 * Apply a chain. AC-PLT-003-02-01 to 02-05:
 * - every write runs inside one transaction under ILocker key 'plt-config-write'; a failure
 *   restores the pre-apply snapshot and the run is Failed with message Plt.PackApplyFailed;
 * - the applied pack set is recorded with codes, versions and checksums, and the setting cache
 *   is cleared once at the end;
 * - the same pack set applied again writes nothing and reports "no changes";
 * - a key changed in the instance since the last apply stops the run with Plt.PackConflict,
 *   unless the caller has chosen what to do with each one.
 */
export async function applyPackChainAsync(chain, {
  storeId = 1, replace = true, actor = 'platform', stores = null, root = null,
  conflictChoices = null, failFileWrite = false, failWrite = null, force = false,
} = {}) {
  const problems = [
    ...chain.flatMap((p) => validatePack(p, { root, stores }).map((x) => ({ ...x, pack: `${p.layer}/${p.id}` }))),
    ...validateChain(chain).map((x) => ({ ...x, pack: 'pack set' })),
  ];
  const refused = problems.filter((p) => p.severity === 'refused');
  if (refused.length) {
    const err = new Error(`pack chain refused: ${refused.map((r) => `${r.pack} ${r.key} (${r.rule})`).join('; ')}`);
    err.problems = problems;
    err.refused = refused;
    err.status = 'Refused';
    throw err;
  }

  const packSet = chain.map((p) => ({
    layer: p.layer, code: p.id, version: p.version ?? null, checksum: checksumOf(p), file: p._path ?? null,
  }));
  const setChecksum = createHash('sha256').update(JSON.stringify(packSet)).digest('hex').slice(0, 16);

  return withLockAsync(WRITE_LOCK_KEY, async () => {
    const appliedRepo = plainRepository('AppliedPackSet');
    const deviationRepo = plainRepository('ConfigurationDeviation');
    const last = (await appliedRepo.getAllAsync()).sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0] ?? null;

    // AC-PLT-003-02-04: the same pack set, already applied, writes nothing
    if (!force && last && last.setChecksum === setChecksum && last.status === 'Applied') {
      return {
        client: chain.find((p) => p.layer === 'client')?.id ?? null,
        storeId,
        status: 'NoChanges',
        noChanges: true,
        message: 'no changes',
        packSet,
        setChecksum,
        appliedOnUtc: last.appliedOnUtc,
        chain: last.chain ?? [],
        keys: last.keys ?? [],
        entities: last.entities ?? {},
        content: last.content ?? {},
        problems,
      };
    }

    // The merge, in layer order. The shared row and a store row are different rows, so a
    // store-layer key narrows the shared value for that store instead of replacing it
    // (BR-PLT-011): the map is keyed by key and store.
    const merged = new Map();
    const apply = (pack, key, value, targetStoreId) => {
      const id = `${key}@${targetStoreId}`;
      const previous = merged.get(id);
      const shared = targetStoreId === 0 ? null : merged.get(`${key}@0`);
      merged.set(id, {
        key,
        value,
        layer: pack.layer,
        pack: `${pack.layer}/${pack.id}`,
        storeId: targetStoreId,
        overrode: previous
          ? [...previous.overrode, { layer: previous.layer, pack: previous.pack, value: previous.value }]
          : shared
            ? [{ layer: shared.layer, pack: shared.pack, value: shared.value }]
            : [],
      });
    };
    for (const pack of chain) {
      const targetStoreId = pack.layer === 'store' ? storeId : 0;
      for (const [key, value] of Object.entries(pack.settings ?? {})) apply(pack, key, value, targetStoreId);
      for (const [featureId, on] of Object.entries(pack.features ?? {})) {
        apply(pack, `productfeature.${featureId.toLowerCase()}`, on, targetStoreId);
      }
    }

    // AC-PLT-003-02-05: keys the instance changed since the last apply
    const conflicts = [];
    if (last && Array.isArray(last.keys)) {
      for (const row of merged.values()) {
        const written = last.keys.find((k) => k.key === row.key && k.storeId === row.storeId);
        if (!written) continue;
        const now = await getSettingAsync(row.key, row.storeId === 0 ? 0 : row.storeId, undefined);
        if (now === undefined) continue;
        const changedInInstance = JSON.stringify(now) !== JSON.stringify(written.value);
        const packStatesIt = JSON.stringify(row.value) !== JSON.stringify(written.value);
        if (changedInInstance && packStatesIt) {
          conflicts.push({
            key: row.key,
            storeId: row.storeId,
            lastPackValue: written.value,
            instanceValue: now,
            newPackValue: row.value,
          });
        }
      }
    }
    const undecided = conflicts.filter((c) => !conflictChoices?.[c.key]);
    if (conflicts.length && undecided.length) {
      await auditAsync({
        event: 'AUD-PLT-003',
        area: 'PLT',
        feature: 'PRD-PLT-003',
        entity: 'ConfigurationPack',
        entityId: setChecksum,
        actor,
        outcome: 'rejected',
        after: { conflicts: conflicts.map((c) => c.key) },
        note: 'pack apply stopped: keys were changed in the instance since the last apply',
      });
      return {
        status: 'Conflict',
        stoppedBeforeWriting: true,
        conflicts,
        messageKey: 'Plt.PackConflict',
        message: resource('Plt.PackConflict'),
        choices: ['keep-instance', 'take-pack'],
        packSet,
        setChecksum,
        problems,
        keys: [],
        chain: chain.map((p) => ({ layer: p.layer, id: p.id })),
      };
    }

    // the pre-apply snapshot: both the rows and the plugin files
    const snapshot = {
      settings: (await allSettingsAsync()).map((r) => ({ ...r })),
      plugins: (await plainRepository('PluginDescriptor').getAllAsync()).map((r) => ({ ...r })),
    };
    const restoreAsync = async () => {
      await clearSettingsAsync();
      for (const row of snapshot.settings) await saveSettingAsync(row.name, row.value, row.storeId, row.layer);
      const repo = plainRepository('PluginDescriptor');
      for (const row of await repo.getAllAsync()) await repo.deleteAsync(row.id);
      for (const row of snapshot.plugins) await repo.insertAsync(row);
    };

    const written = [];
    const deletedStoreRows = [];
    const queuedPlugins = [];
    const artefacts = [];
    try {
      if (replace) await clearSettingsAsync();

      for (const row of merged.values()) {
        const takeInstance = conflictChoices?.[row.key] === 'keep-instance';
        const value = takeInstance
          ? conflicts.find((c) => c.key === row.key)?.instanceValue ?? row.value
          : row.value;
        if (failWrite && row.key === failWrite) throw new Error(`the write of ${row.key} failed`);
        // settings are written with the cache left alone; it is cleared once at the end
        await saveSettingAsync(row.key, value, row.storeId, row.layer);
        written.push({ ...row, value });
        if (takeInstance) {
          await deviationRepo.insertAsync({
            key: row.key,
            level: 'instance',
            packValue: row.value,
            value,
            reason: 'the platform team kept the instance value at apply time',
            actor,
            createdOnUtc: new Date().toISOString(),
          });
        }
      }

      // A module's pack default: a native install default the owning module turns round for every
      // pack (BR-PAY-170). A layer that states the key wins, so only keys no layer stated are
      // written here.
      for (const def of packDefaultsDeclared()) {
        const stated = [...merged.values()].some((r) => r.key === def.key);
        if (stated) continue;
        await saveSettingAsync(def.key, def.value, 0, `${def.owner} pack default`);
        written.push({
          key: def.key,
          value: def.value,
          storeId: 0,
          layer: `${def.owner} pack default`,
          pack: def.owner,
          overrode: [],
          moduleDefault: true,
          rule: def.rule ?? null,
          reason: def.reason ?? null,
        });
      }

      // AC-PLT-003-01-03: store rows the new version no longer states are dropped
      if (last && Array.isArray(last.keys)) {
        const stillStated = new Set([...merged.values()].filter((r) => r.storeId !== 0).map((r) => r.key));
        for (const previous of last.keys.filter((k) => k.storeId !== 0)) {
          if (stillStated.has(previous.key)) continue;
          const result = await deleteSettingAsync(previous.key, previous.storeId);
          if (result.deleted) deletedStoreRows.push({ key: previous.key, storeId: previous.storeId });
        }
      }

      // AC-PLT-003-01-08: plugin enablement is queued, not installed here
      for (const pack of chain) {
        for (const [systemName, settings] of Object.entries(pack.plugins ?? {})) {
          const repo = plainRepository('PluginDescriptor');
          const existing = await repo.getOneAsync((d) => d.systemName === systemName);
          const descriptor = {
            systemName,
            installed: existing?.installed === true,
            queuedForInstall: existing?.installed !== true,
            limitedToStores: settings.limitedToStores ?? [],
            limitedToCustomerRoles: settings.limitedToCustomerRoles ?? [],
            savedThrough: 'PluginDescriptor.Save',
            queuedThrough: 'IPluginService.PreparePluginToInstallAsync',
            installsAt: 'application start (AppStartedConsumer)',
          };
          if (existing) await repo.updateAsync({ ...existing, ...descriptor });
          else await repo.insertAsync(descriptor);
          if (descriptor.queuedForInstall) queuedPlugins.push(systemName);
          // the active-provider list is a setting, not a plugin file
          if (settings.activeProviderSetting) {
            await saveSettingAsync(settings.activeProviderSetting, settings.activeProviders ?? [], 0, pack.layer);
          }
        }
      }

      // AC-PLT-003-02-02: a file write failing after the rows are written restores both
      if (failFileWrite) throw new Error('the plugin.json write failed');

      // AC-PLT-003-01-09: every other artefact goes through its owning service
      for (const pack of chain) {
        for (const [kind, payload] of Object.entries(pack.artefacts ?? {})) {
          const service = ARTEFACT_SERVICES[kind];
          if (!service) continue;
          artefacts.push({
            kind, service, count: Array.isArray(payload) ? payload.length : 1, directSql: false,
          });
        }
      }
    } catch (err) {
      await restoreAsync();
      await auditAsync({
        event: 'AUD-PLT-002',
        area: 'PLT',
        feature: 'PRD-PLT-003',
        entity: 'ConfigurationPack',
        entityId: setChecksum,
        actor,
        outcome: 'rejected',
        after: { reason: err.message },
        note: 'pack apply failed: nothing was kept',
      });
      await appliedRepo.insertAsync({
        packSet,
        setChecksum,
        status: 'Failed',
        reason: err.message,
        appliedBy: actor,
        appliedOnUtc: new Date().toISOString(),
      });
      return {
        status: 'Failed',
        messageKey: 'Plt.PackApplyFailed',
        message: resource('Plt.PackApplyFailed'),
        reason: err.message,
        restoredFromSnapshot: true,
        nothingKept: true,
        packSet,
        setChecksum,
        problems,
        keys: [],
        chain: chain.map((p) => ({ layer: p.layer, id: p.id })),
      };
    }

    // the cache is cleared once, at the end
    const cache = await clearSettingCacheAsync('pack apply');

    const report = {
      client: chain.find((p) => p.layer === 'client')?.id ?? null,
      storeId,
      status: 'Applied',
      appliedOnUtc: new Date().toISOString(),
      appliedBy: actor,
      packSet,
      setChecksum,
      chain: chain.map((p) => ({
        layer: p.layer,
        id: p.id,
        name: p.name,
        version: p.version ?? null,
        file: p._path,
        checksum: checksumOf(p),
        settings: Object.keys(p.settings ?? {}).length,
        features: Object.keys(p.features ?? {}).length,
      })),
      keys: written.sort((a, b) => a.key.localeCompare(b.key)),
      deletedStoreRows,
      queuedPlugins,
      restartRequired: queuedPlugins.length > 0,
      restartMessageKey: queuedPlugins.length ? 'Plt.RestartRequired' : null,
      restartMessage: queuedPlugins.length ? resource('Plt.RestartRequired') : null,
      artefacts,
      conflicts,
      conflictChoices: conflictChoices ?? null,
      cacheClearedOnce: cache.cleared === true,
      transaction: { lockKey: WRITE_LOCK_KEY, oneTransaction: true },
      entities: chain.reduce((acc, p) => {
        for (const [k, v] of Object.entries(p.entities ?? {})) acc[k] = v;
        return acc;
      }, {}),
      content: chain.reduce((acc, p) => ({ ...acc, ...(p.content ?? {}) }), {}),
      problems,
    };

    await appliedRepo.insertAsync({
      packSet,
      setChecksum,
      status: 'Applied',
      chain: report.chain,
      keys: report.keys.map((k) => ({ key: k.key, storeId: k.storeId, value: k.value })),
      entities: report.entities,
      content: report.content,
      appliedBy: actor,
      appliedOnUtc: report.appliedOnUtc,
    });

    await auditAsync({
      event: 'AUD-PLT-002',
      area: 'PLT',
      feature: 'PRD-PLT-003',
      entity: 'ConfigurationPack',
      entityId: setChecksum,
      actor,
      actorRole: 'Platform team',
      after: {
        packSet: packSet.map((p) => `${p.layer}/${p.code}@${p.version ?? '-'}#${p.checksum}`),
        keys: report.keys.length,
      },
      note: `pack chain applied in order ${LAYER_ORDER.join(' -> ')}`,
    });

    return report;
  });
}

/** AC-PLT-003-01-09: which service owns each artefact a pack can carry. No direct SQL. */
export const ARTEFACT_SERVICES = {
  localeResources: 'ILocalizationService.ImportResourcesFromXmlAsync',
  messageTemplates: 'IMessageTemplateService',
  roles: 'ICustomerService / IPermissionService.InsertPermissionMappingAsync',
  permissions: 'IPermissionService.InsertPermissionMappingAsync',
  categories: 'ICategoryService',
  specificationAttributes: 'ISpecificationAttributeService',
  features: 'the PRD-PLT-022 registry',
  workflows: 'the PRD-ADM-002 contract',
  rules: 'the PRD-ADM-003 contract',
};

export const appliedPackSetsAsync = () => plainRepository('AppliedPackSet').getAllAsync();
export const deviationsAsync = () => plainRepository('ConfigurationDeviation').getAllAsync();

/** PLT-022: is a feature switched on for this store? */
export function featureEnabled(report, featureId) {
  const row = report.keys.find((k) => k.key === `productfeature.${featureId.toLowerCase()}`);
  return row ? Boolean(row.value) : null;
}
