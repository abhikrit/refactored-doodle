// Product.PLT - Platform foundation and multi-client configuration
// Spec: docs/prd/modules/PRD-PLT.md (wave 1 Foundation)
// Owns: the configuration pack loader (PLT-003), the feature registry (PLT-022) and the
// ISettingService override (PLT-004, decision OVR-REG - held by WF-ENG, so the prototype
// records settings changes in the audit trail instead of routing them to a workflow).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  applyClientAsync, availableClientsAsync, currentState, featureRegistryAsync, packInventory,
  settingsViewAsync, repoRoot,
} from './services/platform.js';
import {
  registryAsync, setFeatureAsync, stateAsync, isEnabledAsync, surfaceAsync, scheduledWorkAsync,
  implementingPlugin,
} from './services/registry.js';
import {
  setTypeOverrideAsync, setTransactionOverrideAsync, effectiveParameterAsync, deviationsAsync,
  isNativeSettingKey,
} from './services/overrides.js';
import {
  buildChain, applyPackChainAsync, validatePack, validateChain, discoverPacks, settingsCatalogue,
  declaredSettingKeys, appliedPackSetsAsync, checksumOf, ARTEFACT_SERVICES, WRITE_LOCK_KEY,
} from '../../core/pack-loader.js';

export default definePlugin({
  area: 'PLT',
  startupOrder: 3000,
  async install(ctx) {
    ctx.providers.claimOverride('ISettingService', {
      owner: 'Product.PLT',
      feature: 'PRD-PLT-004',
      startupOrder: 3000,
      note: 'Settings change control. Held by WF-ENG: the prototype default records the change in the SEC-004 trail and labels the feature "Prototype default - decision WF-ENG pending".',
    });

    const r = Router();
    r.get('/clients', (req, res) => res.json(availableClientsAsync()));
    r.get('/state', (req, res) => {
      const s = currentState();
      res.json({ clientId: s.clientId, storeId: s.storeId, seed: s.seed, chain: s.report?.chain ?? [] });
    });
    r.get('/packs', (req, res) => res.json(packInventory()));
    r.get('/packs/report', (req, res) => res.json(currentState().report));
    r.post('/packs/apply', async (req, res, next) => {
      try {
        const { clientId, storeId = 1 } = req.body ?? {};
        const state = await applyClientAsync({ clientId, storeId, actor: req.actorEmail ?? 'platform' });
        res.json({ clientId: state.clientId, storeId: state.storeId, seed: state.seed, chain: state.report.chain });
      } catch (err) { next(err); }
    });
    r.get('/settings', async (req, res, next) => {
      try { res.json(await settingsViewAsync()); } catch (err) { next(err); }
    });
    r.get('/features', async (req, res, next) => {
      try { res.json(await featureRegistryAsync({ storeId: Number(req.query.storeId ?? 1) })); } catch (err) { next(err); }
    });
    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };
    const gate = (permission) => async (req, res, next) => {
      if (!await ctx.security.authorizeAsync(permission, req.actor)) {
        return res.status(403).json({
          ok: false, denied: true, permission, message: `Access denied: ${permission} is required.`,
        });
      }
      return next();
    };

    /* ---------------------------------------- PRD-PLT-003 the pack loader --------------- */
    r.get('/packs/catalogue', send(() => {
      const cat = settingsCatalogue(repoRoot());
      return {
        nativeClasses: Object.fromEntries(Object.entries(cat.nativeClasses).map(([k, v]) => [k, Object.keys(v)])),
        productKeys: Object.keys(cat.productKeys ?? {}),
        removedIn500: cat.removedIn500,
        movedIn500: cat.movedIn500,
        removedPermissionsIn500: cat.removedPermissionsIn500,
        declaredByPlugins: declaredSettingKeys(),
        artefactServices: ARTEFACT_SERVICES,
      };
    }));
    r.post('/packs/validate', send(async (req) => {
      const stores = (await ctx.repository('Store').getAllAsync()).map((x) => x.code ?? String(x.id));
      const pack = req.body?.pack ?? {};
      return {
        problems: validatePack(pack, { root: repoRoot(), stores }),
        checksum: checksumOf(pack),
      };
    }));
    r.post('/packs/validate-set', send((req) => ({ problems: validateChain(req.body?.chain ?? []) })));
    r.post('/packs/apply-chain', gate('Platform.Core.Packs.CreateEditDelete'), send(async (req) => {
      const stores = (await ctx.repository('Store').getAllAsync()).map((x) => x.code ?? String(x.id));
      const chain = req.body?.chain
        ?? buildChain(repoRoot(), req.body?.clientId ?? currentState().clientId, req.body?.storeId ?? 1);
      try {
        return await applyPackChainAsync(chain, {
          storeId: req.body?.storeId ?? 1,
          replace: req.body?.replace !== false,
          actor: req.actorEmail ?? 'platform',
          stores,
          root: repoRoot(),
          conflictChoices: req.body?.conflictChoices ?? null,
          failFileWrite: req.body?.failFileWrite === true,
          failWrite: req.body?.failWrite ?? null,
          force: req.body?.force === true,
        });
      } catch (err) {
        return {
          status: 'Refused', refused: err.refused ?? [], problems: err.problems ?? [], message: err.message,
        };
      }
    }));
    r.get('/packs/applied', send(() => appliedPackSetsAsync()));
    r.get('/packs/deviations', send((req) => deviationsAsync(req.query)));
    r.get('/packs/lock', send(() => ({ lockKey: WRITE_LOCK_KEY })));
    r.get('/packs/parameter', send((req) => effectiveParameterAsync({
      typeCode: req.query.typeCode, parameter: req.query.parameter, storeId: Number(req.query.storeId ?? 1),
    })));
    r.post('/packs/parameter/type-override', send(async (req) => setTypeOverrideAsync({
      ...req.body, actor: req.actorEmail ?? 'administrator', storeId: req.storeId,
    })));
    r.post('/packs/parameter/transaction-override', send(async (req) => setTransactionOverrideAsync({
      ...req.body, actor: req.actorEmail ?? 'operator', storeId: req.storeId,
    })));
    r.get('/packs/native-key', send((req) => ({
      key: req.query.key, nativeSetting: isNativeSettingKey(req.query.key),
    })));

    /* ------------------------------------------- PRD-PLT-022 the feature registry ------- */
    r.get('/registry', send(async (req) => registryAsync({
      storeId: Number(req.query.storeId ?? 1), actor: req.actor, area: req.query.area ?? null,
    })));
    r.post('/registry/features', send(async (req) => setFeatureAsync({
      featureId: req.body?.featureId,
      enabled: req.body?.enabled === true,
      storeId: req.body?.storeId ?? null,
      actor: req.actor,
      by: req.actorEmail ?? 'administrator',
    })));
    r.get('/registry/features/:id', send((req) => stateAsync({
      featureId: req.params.id, storeId: Number(req.query.storeId ?? 1),
    })));
    r.get('/registry/features/:id/enabled', send(async (req) => ({
      featureId: req.params.id,
      enabled: await isEnabledAsync(req.params.id, Number(req.query.storeId ?? 1)),
      contract: 'IC-PLT-02 IsEnabled',
      plugin: implementingPlugin(req.params.id),
    })));
    r.get('/registry/features/:id/surface', send((req) => surfaceAsync({
      featureId: req.params.id, storeId: Number(req.query.storeId ?? 1),
    })));
    r.get('/registry/features/:id/scheduled-work', send((req) => scheduledWorkAsync({ featureId: req.params.id })));

    ctx.addRouter('/api/platform', r);
    ctx.declare({
      built: true,
      owns: ['PRD-PLT-003', 'PRD-PLT-022'],
      builtFeatures: ['PRD-PLT-003', 'PRD-PLT-022'],
      note: 'the configuration pack loader with its validation, transaction and deviations, and the feature registry',
    });
  },
});
