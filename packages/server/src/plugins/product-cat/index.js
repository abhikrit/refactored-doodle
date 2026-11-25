// Product.CAT - Catalogue and listings
// Spec: docs/prd/modules/PRD-CAT.md (wave 2 Catalogue)
// CAT-002 hosts the IProductService override (L1 section 6.3 core-modification register);
// CAT-039/042 use native price lists (decision PRICE-500).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  categoriesAsync, categoryTreeAsync, productsAsync, searchProductsAsync, productAsync,
  viewProductAsync, vendorsAsync,
} from './services/catalogue.js';
import { authorizedForStoreAsync } from '../../core/store-mapping.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

export default definePlugin({
  area: 'CAT',
  startupOrder: 3100,
  async install(ctx) {
    ctx.providers.claimOverride('IProductService', {
      owner: 'Product.CAT',
      feature: 'PRD-CAT-002',
      startupOrder: 3100,
      note: 'Override host for the product record (CAT-002). Other modules plug in through the CAT contracts.',
    });
    ctx.providers.claimOverride('IPriceCalculationService', {
      owner: 'Product.CAT',
      feature: 'PRD-CAT-039',
      startupOrder: 3100,
      note: 'Price lists first, then a tier price replaces them (native 5.00 order; decision PRICE-500).',
    });
    // IC-CHK-01: CAT adds the call-for-price cart check (replacer of the native warning)
    ctx.providers.registerProvider('IC-CHK-01', {
      area: 'CAT',
      feature: 'PRD-CAT-013',
      name: 'call-for-price',
      fn: async ({ product }) => ({
        warnings: product.callForPrice ? ['Products.CallForPrice'] : [],
      }),
    });

    const r = Router();
    r.get('/categories', async (req, res, next) => {
      try { res.json(await categoriesAsync()); } catch (err) { next(err); }
    });
    r.get('/categories/tree', async (req, res, next) => {
      try { res.json(await categoryTreeAsync()); } catch (err) { next(err); }
    });
    r.get('/vendors', async (req, res, next) => {
      try { res.json(await vendorsAsync()); } catch (err) { next(err); }
    });
    r.get('/products', async (req, res, next) => {
      try {
        const customer = await currentCustomerAsync(req.sessionId);
        const storeId = Number(req.query.storeId ?? req.storeId);
        const all = req.query.q
          ? await searchProductsAsync({ term: req.query.q, storeId })
          : await productsAsync({ storeId });
        const out = [];
        for (const p of all) out.push(await viewProductAsync(p, { customer, storeId }));
        res.json(out);
      } catch (err) { next(err); }
    });
    r.get('/products/:id', async (req, res, next) => {
      try {
        const customer = await currentCustomerAsync(req.sessionId);
        const storeId = Number(req.query.storeId ?? req.storeId);
        const product = await productAsync(req.params.id);
        if (!product) return res.status(404).json({ message: 'product not found' });
        // AC-PLT-013-01-01: a product of another store is not reachable in this one
        if (!await authorizedForStoreAsync('Product', product, storeId)) {
          return res.status(404).json({ message: 'product not found in this store', storeId });
        }
        return res.json(await viewProductAsync(product, {
          customer, quantity: Number(req.query.quantity ?? 1), storeId,
        }));
      } catch (err) { return next(err); }
    });
    ctx.addRouter('/api/catalogue', r);
    ctx.declare({ built: true, owns: ['PRD-CAT-001', 'PRD-CAT-002', 'PRD-CAT-012', 'PRD-CAT-013', 'PRD-CAT-039'], note: 'category tree, product record, price lists and tier prices are built in Session 0' });
  },
});
