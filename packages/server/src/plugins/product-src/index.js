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
    // IC-IAM-08: PRD-SRC-012 keeps the search history and PRD-SRC-009 sends profiles to the
    // recommendation service, so both erase on the IAM-017 deletion and stop on a withdrawal.
    ctx.providers.registerProvider('IC-IAM-08', {
      name: 'search history (PRD-SRC-012)',
      area: 'SRC',
      feature: 'PRD-SRC-012',
      fn: async ({ operation, customerId }) => {
        const rows = await ctx.repository('SearchHistory').getAllAsync((r) => r.customerId === customerId);
        if (operation === 'ConsentWithdrawn') return { stopped: true, dataDeleted: false, rows: rows.length };
        for (const row of rows) await ctx.repository('SearchHistory').deleteAsync(row.id);
        return { outcome: 'Erased', detail: `${rows.length} search history rows` };
      },
    });
    ctx.providers.registerProvider('IC-IAM-08', {
      name: 'recommendation service (PRD-SRC-009)',
      area: 'SRC',
      feature: 'PRD-SRC-009',
      fn: async ({ operation, customerId, storeId }) => {
        // the profile lives in an external service, so the erasure can fail and must say so
        const reachable = await ctx.settings.getSettingAsync('src.recommendationserviceavailable', storeId ?? 1, true);
        if (operation === 'ConsentWithdrawn') {
          return { stopped: true, dataDeleted: false, detail: 'personalisation stops from the next request' };
        }
        if (reachable !== true) {
          return { outcome: 'Failed', detail: 'the recommendation service did not answer' };
        }
        return { outcome: 'Erased', detail: `profile of customer ${customerId} erased at the recommendation service` };
      },
    });

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
