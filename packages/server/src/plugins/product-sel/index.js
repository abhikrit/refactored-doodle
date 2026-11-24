// Product.SEL - Sellers and marketplace onboarding
// Spec: docs/prd/modules/PRD-SEL.md (wave 2 Catalogue)
// Most of SEL is held by C-SELLER (Malawi Post) or the KTDA seller-model gap KG-01, so the
// prototype shows the Proposed option labelled with the decision (P-1).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { sellersAsync, sellerDashboardAsync } from './services/sellers.js';

export default definePlugin({
  area: 'SEL',
  startupOrder: 3120,
  async install(ctx) {
    const r = Router();
    r.get('/', async (req, res, next) => {
      try { res.json(await sellersAsync()); } catch (err) { next(err); }
    });
    r.get('/:id/dashboard', async (req, res, next) => {
      try {
        const data = await sellerDashboardAsync(Number(req.params.id));
        if (!data) return res.status(404).json({ message: 'seller not found' });
        return res.json(data);
      } catch (err) { return next(err); }
    });
    ctx.addRouter('/api/sellers', r);
    ctx.declare({ built: false, partial: true, owns: ['PRD-SEL-001', 'PRD-SEL-008', 'PRD-SEL-016'], note: 'seller list and seller dashboard read model only; onboarding, approval stages and settlements are wave 2' });
  },
});
