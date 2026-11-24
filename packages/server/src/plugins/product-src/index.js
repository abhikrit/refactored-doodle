// Product.SRC - Search, discovery and merchandising
// Spec: docs/prd/modules/PRD-SRC.md (wave 2 Catalogue)
// SRC-014 (Lucene) is a paid stub in 5.00.1 and held by PAID-STUB; the in-house relevance below
// is the substitute decision P-2 allows, behind the same provider seam.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { searchAsync, suggestAsync } from './services/search.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

export default definePlugin({
  area: 'SRC',
  startupOrder: 3110,
  async install(ctx) {
    ctx.providers.claimOverride('ISearchProvider', {
      owner: 'Product.SRC',
      feature: 'PRD-SRC-001',
      startupOrder: 3110,
      note: 'In-house search provider. SRC-014 (Search.Lucene) is a configuration stub in 5.00.1 that implements IMiscPlugin, not ISearchProvider, so it cannot be selected - held by PAID-STUB.',
    });
    const r = Router();
    r.get('/', async (req, res, next) => {
      try {
        const customer = await currentCustomerAsync(req.sessionId);
        const specs = {};
        for (const [k, v] of Object.entries(req.query)) {
          if (k.startsWith('spec.')) specs[k.slice(5)] = v;
        }
        res.json(await searchAsync({
          q: req.query.q ?? '',
          categoryId: req.query.categoryId ?? null,
          vendorId: req.query.vendorId ?? null,
          minPrice: req.query.minPrice ?? null,
          maxPrice: req.query.maxPrice ?? null,
          inStockOnly: req.query.inStockOnly === 'true',
          pickupOnly: req.query.pickupOnly === 'true',
          sort: req.query.sort ?? 'relevance',
          page: Number(req.query.page ?? 1),
          pageSize: Number(req.query.pageSize ?? 12),
          specs,
          customer,
        }));
      } catch (err) { next(err); }
    });
    r.get('/suggest', async (req, res, next) => {
      try { res.json(await suggestAsync(req.query.q ?? '')); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/search', r);
    ctx.declare({ built: true, owns: ['PRD-SRC-001', 'PRD-SRC-002', 'PRD-SRC-003', 'PRD-SRC-005'], note: 'keyword search, suggestions, facets and sorting are built in Session 0' });
  },
});
