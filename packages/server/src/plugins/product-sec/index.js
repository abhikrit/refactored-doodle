// Product.SEC - Security, audit and compliance
// Spec: docs/prd/modules/PRD-SEC.md (wave 1 Foundation)
// SEC-004 owns the platform audit trail: every write in the prototype goes through it.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { trailAsync, auditEventCatalogue } from './services/audit-read.js';

export default definePlugin({
  area: 'SEC',
  startupOrder: 3020,
  async install(ctx) {
    ctx.providers.claimOverride('IRepository<>', {
      owner: 'Product.SEC',
      feature: 'PRD-SEC-004',
      startupOrder: 3020,
      note: 'The SEC-004 repository decorator writes the audit trail. In 5.00.1 it implements only the async members (the sync IRepository members were removed).',
    });
    const r = Router();
    r.get('/audit', async (req, res, next) => {
      try {
        res.json(await trailAsync({
          area: req.query.area, event: req.query.event, entity: req.query.entity, entityId: req.query.entityId, actor: req.query.actor,
        }));
      } catch (err) { next(err); }
    });
    r.get('/audit/catalogue', (req, res) => res.json(auditEventCatalogue()));
    ctx.addRouter('/api/security', r);
    ctx.declare({ built: true, owns: ['PRD-SEC-004'], note: 'the platform audit trail is built in Session 0; SEC-010 auditor read-only access is demonstrated by the Auditor role' });
  },
});
