// Product.CHK - Cart and checkout
// Spec: docs/prd/modules/PRD-CHK.md (wave 3 Buy)
// CHK-003 owns the IShoppingCartService and IOrderProcessingService overrides (BR-CHK-006,
// BR-CHK-015, decision OVR-REG) and registers the CHK-004 order splitter (IC-CHK-11).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  addToCartAsync, updateItemAsync, removeItemAsync, saveForLaterAsync, getCartAsync,
} from './services/cart.js';
import {
  checkoutStateAsync, totalsAsync, validateAsync, placeOrderAsync, splitCart, checkoutExceptionsAsync,
} from './services/checkout.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

export default definePlugin({
  area: 'CHK',
  startupOrder: 3200,
  async install(ctx) {
    ctx.providers.claimOverride('IShoppingCartService', {
      owner: 'Product.CHK',
      feature: 'PRD-CHK-003',
      startupOrder: 3200,
      note: 'one override, cart check providers run after the native checks.',
    });
    ctx.providers.claimOverride('IOrderProcessingService', {
      owner: 'Product.CHK',
      feature: 'PRD-CHK-003',
      startupOrder: 3200,
      note: 'the placement host. One lock, one payment, one sub-order per splitter group.',
    });
    ctx.providers.registerProvider('IC-CHK-11', {
      area: 'CHK',
      feature: 'PRD-CHK-004',
      name: 'order-splitter',
      fn: async ({ cart }) => ({ groups: splitCart(cart) }),
    });

    const r = Router();
    const withCustomer = async (req) => ({
      sessionId: req.sessionId, storeId: req.storeId, customer: await currentCustomerAsync(req.sessionId),
    });
    r.get('/cart', async (req, res, next) => {
      try { res.json(await getCartAsync(await withCustomer(req))); } catch (err) { next(err); }
    });
    r.post('/cart/items', async (req, res, next) => {
      try {
        const base = await withCustomer(req);
        const result = await addToCartAsync({ ...base, productId: Number(req.body.productId), quantity: Number(req.body.quantity ?? 1) });
        res.json({ ...result, cart: await getCartAsync(base) });
      } catch (err) { next(err); }
    });
    r.patch('/cart/items/:id', async (req, res, next) => {
      try {
        const base = await withCustomer(req);
        const result = await updateItemAsync({ ...base, itemId: Number(req.params.id), ...req.body });
        res.json({ ...result, cart: await getCartAsync(base) });
      } catch (err) { next(err); }
    });
    r.delete('/cart/items/:id', async (req, res, next) => {
      try {
        const base = await withCustomer(req);
        await removeItemAsync({ ...base, itemId: Number(req.params.id) });
        res.json({ ok: true, cart: await getCartAsync(base) });
      } catch (err) { next(err); }
    });
    r.post('/cart/items/:id/save-for-later', async (req, res, next) => {
      try {
        const base = await withCustomer(req);
        const result = await saveForLaterAsync({ ...base, itemId: Number(req.params.id), back: req.body?.back === true });
        res.json({ ...result, cart: await getCartAsync(base) });
      } catch (err) { next(err); }
    });
    r.get('/checkout', async (req, res, next) => {
      try { res.json(await checkoutStateAsync(await withCustomer(req))); } catch (err) { next(err); }
    });
    r.get('/checkout/totals', async (req, res, next) => {
      try {
        res.json(await totalsAsync({ ...(await withCustomer(req)), paymentMethodSystemName: req.query.paymentMethodSystemName ?? null }));
      } catch (err) { next(err); }
    });
    r.post('/checkout/validate', async (req, res, next) => {
      try { res.json(await validateAsync({ ...(await withCustomer(req)), ...req.body })); } catch (err) { next(err); }
    });
    r.post('/checkout/confirm', async (req, res, next) => {
      try {
        res.json(await placeOrderAsync({ ...(await withCustomer(req)), ...req.body, actor: req.actorEmail ?? 'storefront' }));
      } catch (err) { next(err); }
    });
    r.get('/checkout/exceptions', async (req, res, next) => {
      try { res.json(await checkoutExceptionsAsync()); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/checkout-area', r);
    ctx.declare({
      built: true,
      owns: ['PRD-CHK-001', 'PRD-CHK-002', 'PRD-CHK-003', 'PRD-CHK-004', 'PRD-CHK-005', 'PRD-CHK-012', 'PRD-CHK-019'],
      note: 'cart, checkout, validation, split placement, pickup code and confirmation are built in Session 0',
    });
  },
});
