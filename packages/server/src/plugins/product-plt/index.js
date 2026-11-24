// Product.PLT - Platform foundation and multi-client configuration
// Spec: docs/prd/modules/PRD-PLT.md (wave 1 Foundation)
// Owns: the configuration pack loader (PLT-003), the feature registry (PLT-022) and the
// ISettingService override (PLT-004, decision OVR-REG - held by WF-ENG, so the prototype
// records settings changes in the audit trail instead of routing them to a workflow).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  applyClientAsync, availableClientsAsync, currentState, featureRegistryAsync, packInventory, settingsViewAsync,
} from './services/platform.js';

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
    ctx.addRouter('/api/platform', r);
    ctx.declare({ built: true, owns: ['PRD-PLT-003', 'PRD-PLT-005', 'PRD-PLT-022'], note: 'pack loader, feature registry and settings view are built in Session 0' });
  },
});
