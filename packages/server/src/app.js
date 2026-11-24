// The prototype API. One Express app, mounted into the Vite dev server so dev and production
// serve on the same port (4000). No database: everything is the in-memory store (P-4 deviation).

import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry, roleCatalogue, actorsByArea, permissionsByArea } from '@product/shared';
import {
  mockStatus, setMockHealth, mockCalls, mockRegistry,
} from '@product/mocks';
import { readFileSync } from 'node:fs';
import { loadPluginsAsync } from './core/plugin-host.js';
import { storeSnapshot } from './core/repository.js';
import { lockHistory } from './core/locker.js';
import { publishedEvents } from './core/events.js';
import { applyClientAsync, currentState, repoRoot } from './plugins/product-plt/services/platform.js';
import { currentCustomerAsync } from './plugins/product-iam/services/identity.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const baseline = JSON.parse(readFileSync(join(ROOT, 'platform', 'baseline.json'), 'utf8'));

export async function createApiApp({ defaultClient = 'MPC' } = {}) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // session: the prototype keeps one cart and one signed-in customer per x-session header
  app.use((req, res, next) => {
    req.sessionId = req.get('x-session') || 'default';
    req.storeId = Number(req.get('x-store-id') || 1);
    next();
  });
  app.use(async (req, res, next) => {
    try {
      const customer = await currentCustomerAsync(req.sessionId);
      req.actorEmail = customer?.email ?? null;
      next();
    } catch { next(); }
  });

  const host = await loadPluginsAsync({ root: repoRoot(), mocks: mockRegistry });
  await applyClientAsync({ clientId: defaultClient, storeId: 1, actor: 'boot' });

  // ---------------------------------------------------------------- meta ----
  app.get('/api/meta', (req, res) => {
    const state = currentState();
    res.json({
      prototype: {
        name: 'nopCommerce product prototype',
        stack: 'React 19 + Vite + Tailwind 4 + Node 22 + Express 5',
        noDotNet: true,
        noDatabase: true,
        port: 4000,
        decisions: {
          'P-1': 'held features build the PRD Proposed option, labelled "Prototype default - decision <ID> pending"',
          'P-2': 'licensed and paid-stub plugins get an in-house substitute behind the same extension point',
          'P-3': 'external systems are mocks with recorded payloads, switchable later',
          'P-4': 'NOT as recommended: no MySQL/SQL Server/Docker. In-memory store behind an async IRepository interface',
          'P-5': 'synthetic data only; client content not supplied (T-MISS) shown as placeholders',
          'P-6': 'done = demonstrable + ACs pass as named tests; everything else is not-built in /trace',
        },
      },
      baseline,
      registry: registry.meta,
      client: { id: state.clientId, storeId: state.storeId, seed: state.seed },
      plugins: host.plugins.length,
    });
  });

  app.get('/api/registry/:name', (req, res) => {
    const data = registry[req.params.name];
    if (data === undefined) {
      return res.status(404).json({ message: `unknown registry ${req.params.name}`, available: Object.keys(registry) });
    }
    return res.json(data);
  });
  app.get('/api/registry', (req, res) => res.json(Object.fromEntries(
    Object.entries(registry).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]),
  )));

  // ------------------------------------------------------------- roles ------
  app.get('/api/roles', (req, res) => res.json(roleCatalogue));
  app.get('/api/roles/:id', (req, res) => {
    const role = roleCatalogue.find((r) => r.id === req.params.id);
    if (!role) return res.status(404).json({ message: 'unknown role' });
    const features = registry.features.filter((f) => role.features.includes(f.id));
    const screens = registry.screens.filter((s) => role.screens.includes(s.id));
    return res.json({ ...role, featureDetail: features, screenDetail: screens });
  });

  // ------------------------------------------------------------- areas ------
  app.get('/api/areas', (req, res) => res.json(registry.areas.map((a) => {
    const plugin = host.plugins.find((p) => p.area === a.code);
    const declaration = host.declarations.find((d) => d.area === a.code);
    return {
      ...a,
      plugin: plugin ? {
        systemName: plugin.systemName, directory: plugin.directory, counts: plugin.counts, holdingDecisions: plugin.holdingDecisions,
      } : null,
      built: declaration?.built ?? false,
      partial: declaration?.partial ?? false,
      buildNote: declaration?.note ?? null,
      owns: declaration?.owns ?? [],
    };
  })));
  app.get('/api/areas/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const area = registry.areas.find((a) => a.code === code);
    if (!area) return res.status(404).json({ message: 'unknown area' });
    const declaration = host.declarations.find((d) => d.area === code);
    return res.json({
      ...area,
      built: declaration?.built ?? false,
      partial: declaration?.partial ?? false,
      buildNote: declaration?.note ?? null,
      owns: declaration?.owns ?? [],
      plugin: host.plugins.find((p) => p.area === code) ?? null,
      features: registry.features.filter((f) => f.area === code),
      screens: registry.screens.filter((s) => s.area === code),
      rules: registry.rules.filter((r) => r.area === code),
      states: registry.states.filter((s) => s.area === code),
      actors: actorsByArea[code] ?? [],
      permissions: permissionsByArea[code] ?? [],
      messages: registry.messages.filter((m) => m.area === code),
      settings: registry.settings.filter((s) => s.area === code),
      contracts: registry.contracts.filter((c) => c.area === code),
      auditEvents: registry.auditEvents.filter((e) => e.area === code),
    });
  });

  app.get('/api/features/:id', (req, res) => {
    const id = req.params.id.toUpperCase();
    const feature = registry.features.find((f) => f.id === id);
    if (!feature) return res.status(404).json({ message: 'unknown feature' });
    return res.json({
      ...feature,
      storyDetail: registry.stories.filter((s) => s.feature === id),
      criterionDetail: registry.criteria.filter((c) => c.feature === id),
      ruleDetail: registry.rules.filter((r) => r.features.includes(id)),
      screenDetail: registry.screens.filter((s) => s.features.includes(id)),
      requirementDetail: registry.requirements.filter((r) => r.features.includes(id)),
      holdDetail: registry.holds.holds.filter((h) => h.features.includes(id)),
      readinessDetail: registry.holds.readiness.filter((h) => h.features.includes(id)),
    });
  });

  // ----------------------------------------------------------- platform -----
  app.get('/api/platform/plugins', (req, res) => res.json({
    plugins: host.plugins,
    declarations: host.declarations,
    overrideRegister: host.overrideRegister,
    providerRegister: host.providerRegister,
    consumerRegister: host.consumerRegister,
    licensedPlugins: registry.licensedPlugins,
    coreModifications: registry.coreModifications,
  }));
  app.get('/api/platform/diagnostics', (req, res) => res.json({
    store: storeSnapshot(),
    locks: lockHistory().slice(0, 25),
    events: publishedEvents().slice(0, 25),
  }));

  // -------------------------------------------------------------- mocks -----
  app.get('/api/mocks', (req, res) => res.json({
    adapters: mockStatus(),
    externalSystemFeatures: registry.externalSystems,
    note: 'Decision P-3: external systems are mocks with recorded payloads. No request leaves the prototype.',
  }));
  app.post('/api/mocks/:systemName/health', (req, res, next) => {
    try {
      res.json(setMockHealth(req.params.systemName, req.body.health, req.body.latencyMs ?? 1500));
    } catch (err) { next(err); }
  });
  app.get('/api/mocks/calls', (req, res) => res.json(mockCalls(req.query.systemName)));

  // ------------------------------------------------------ plugin routers ----
  for (const { path, router } of host.routers) app.use(path, router);

  app.use('/api', (req, res) => res.status(404).json({ message: `no API route ${req.method} ${req.originalUrl}` }));
  app.use('/api', (err, req, res, next) => {
    res.status(500).json({ message: err.message, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack });
  });

  return { app, host };
}
