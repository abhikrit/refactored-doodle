// Plugin host - the stand-in for BasePlugin / IPlugin / PluginDescriptor and INopStartup ordering.
//
// Each of the 24 areas that needs code is one plugin, exactly as CLAUDE.md requires
// ("Everything else is a plugin under src/Plugins/Nop.Plugin.Product.<Area>"); in this prototype
// that is packages/server/src/plugins/product-<area>/ with a plugin.json descriptor whose
// supportedVersions is 5.00 (decision VER-500).
//
// The host:
//   - reads every plugin.json (the installed list, like App_Data/plugins.json)
//   - imports each index.js and runs install() in startupOrder (INopStartup order)
//   - hands each plugin the core services, so a plugin never reaches past the host
//   - collects routers, provider claims and permission/message/audit declarations

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { registry, featuresByArea, screensByArea } from '@product/shared';
import { repository } from './repository.js';
import { saveSettingAsync, getSettingAsync, getSettingGroupAsync } from './settings.js';
import {
  claimOverride, registerProvider, providers, runProviders, overrideRegister, providerRegister,
} from './providers.js';
import { subscribe, publishAsync, consumerRegister } from './events.js';
import { withLockAsync, lockKey } from './locker.js';
import { auditAsync, auditTrailAsync } from './audit.js';
import { sendAsync, resource, resourceExists } from './messages.js';
import {
  addRoleAsync, addPermissionAsync, grantAsync, authorizeAsync, aclMatrixAsync,
} from './permissions.js';

/** Declare a plugin. `install(ctx)` runs once at boot. */
export function definePlugin(definition) {
  return { startupOrder: 3000, ...definition, __plugin: true };
}

const loaded = new Map();

export async function loadPluginsAsync({ root, mocks = {} }) {
  const dir = join(root, 'packages', 'server', 'src', 'plugins');
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('product-'))
    .map((e) => e.name)
    .sort();

  const descriptors = [];
  for (const name of entries) {
    const descriptorPath = join(dir, name, 'plugin.json');
    if (!existsSync(descriptorPath)) continue;
    const descriptor = JSON.parse(readFileSync(descriptorPath, 'utf8'));
    // pathToFileURL: bare "D:\..." paths are rejected by Node's ESM loader on Windows
    const mod = await import(pathToFileURL(join(dir, name, 'index.js')).href);
    descriptors.push({ ...descriptor, directory: `packages/server/src/plugins/${name}`, plugin: mod.default });
  }

  descriptors.sort((a, b) => (a.plugin?.startupOrder ?? 3000) - (b.plugin?.startupOrder ?? 3000)
    || a.systemName.localeCompare(b.systemName));

  const routers = [];
  const declarations = [];

  let installSequence = 0;
  for (const d of descriptors) {
    const area = d.area;
    const ctx = {
      area,
      descriptor: d,
      mocks,
      features: featuresByArea[area] ?? [],
      screens: screensByArea[area] ?? [],
      rules: registry.rules.filter((r) => r.area === area),
      states: registry.states.filter((s) => s.area === area),
      contracts: registry.contracts.filter((c) => c.area === area),
      auditEvents: registry.auditEvents.filter((a) => a.area === area),
      messageKeys: registry.messages.filter((m) => m.area === area),
      // core services
      repository,
      settings: { saveSettingAsync, getSettingAsync, getSettingGroupAsync },
      providers: { claimOverride, registerProvider, providers, runProviders },
      events: { subscribe, publishAsync },
      locker: { withLockAsync, lockKey },
      audit: { auditAsync, auditTrailAsync },
      messages: { sendAsync, resource, resourceExists },
      security: {
        addRoleAsync, addPermissionAsync, grantAsync, authorizeAsync, aclMatrixAsync,
      },
      // registration sinks
      addRouter: (path, router) => routers.push({ area, path, router }),
      declare: (what) => declarations.push({ area, ...what }),
    };
    if (d.plugin?.install) await d.plugin.install(ctx);
    // AC-ADM-001-04-01: the register's reader must run after every other product plugin, so the
    // INopStartup order each plugin declares and the order it actually installed in are both
    // reported on the Local plugins screen.
    loaded.set(d.systemName, {
      ...d,
      plugin: undefined,
      installed: true,
      startupOrder: d.plugin?.startupOrder ?? 3000,
      installSequence: ++installSequence,
    });
  }

  return {
    plugins: [...loaded.values()],
    routers,
    declarations,
    overrideRegister: overrideRegister(),
    providerRegister: providerRegister(),
    consumerRegister: consumerRegister(),
  };
}

export function loadedPlugins() {
  return [...loaded.values()];
}
