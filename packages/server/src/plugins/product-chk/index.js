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
  stepStateAsync, submitStepAsync, confirmSummaryAsync, checkoutRequestGuard, guestGuardAsync,
  shippingStepAsync, STEP_FIELDS,
} from './services/checkout.js';
import {
  cartFulfilmentOptionsAsync, lineOptionsAsync, setLineFulfilmentAsync, stepEstimatesAsync,
} from './services/fulfilment.js';
import {
  defineWindowAsync, removeWindowAsync, windowDefinitionsAsync, windowsAsync, bookingsAsync,
  desiredDateOptionsAsync, placementParticipantAsync as slotParticipantAsync,
  cancellationParticipantAsync as slotCancellationAsync, instructionsAttributeAsync,
} from './services/slots.js';
import {
  addressFormAsync, saveAddressAsync, addressAttributesAsync, orderAddressAsync,
} from './services/address.js';
import {
  itemWarningsAsync, cartWarningsAsync, standardWarningsAsync, subTotalAsync,
  guardOrderActionAsync, cancelOrderAsync, runCheckOrderAsync, registerCartCheckProvider,
  registerSubtotalAdjuster, registerOrderActionGuard, registerCancellationParticipant,
  registerPlacementParticipant, cartCheckProvidersRegistered, subtotalAdjusterRegistered,
  placementValidatorsRegistered, placementParticipantsRegistered, orderActionGuardsRegistered,
  cancellationParticipantsRegistered, NATIVE_WARNINGS, CHECK_ORDER,
} from './services/validation.js';
import { productAsync } from '../product-cat/services/catalogue.js';
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
    // CHK-006 reserves and releases the delivery window (BR-CHK-010, IC-CHK-06 and IC-CHK-08)
    registerPlacementParticipant({
      area: 'CHK',
      feature: 'PRD-CHK-006',
      name: 'delivery window',
      lockKey: ({ deliverySlotId, date }) => (deliverySlotId ? `chk-slot-${deliverySlotId}-${date}` : null),
      fn: slotParticipantAsync,
    });
    registerCancellationParticipant({
      area: 'CHK',
      feature: 'PRD-CHK-006',
      name: 'release the delivery window',
      fn: slotCancellationAsync,
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
    /* ------------------------------------- PRD-CHK-002 the steps -------------------- */
    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };
    r.get('/checkout/steps', send(async (req) => stepStateAsync({
      ...await withCustomer(req), currentStep: req.query.step ?? null,
    })));
    r.post('/checkout/steps/:step', send(async (req) => {
      const guard = checkoutRequestGuard({
        method: 'POST',
        secure: req.secure,
        forwardedProto: req.get('x-forwarded-proto') ?? null,
        antiforgeryToken: req.get('x-antiforgery') ?? req.body?.antiforgeryToken ?? null,
      });
      if (guard.ok !== true) return guard;
      const base = await withCustomer(req);
      const challenge = await guestGuardAsync({ action: `step:${req.params.step}`, customer: base.customer, storeId: base.storeId });
      if (challenge.ok !== true) return challenge;
      return submitStepAsync({ ...base, step: req.params.step, values: req.body?.values ?? req.body ?? {} });
    }));
    r.get('/checkout/confirm-summary', send(async (req) => confirmSummaryAsync({
      ...await withCustomer(req), paymentMethodSystemName: req.query.paymentMethodSystemName ?? null,
    })));
    r.post('/checkout/guard', send(async (req) => {
      const base = await withCustomer(req);
      return {
        request: checkoutRequestGuard({
          method: req.body?.method ?? 'POST',
          secure: req.secure,
          forwardedProto: req.get('x-forwarded-proto') ?? null,
          antiforgeryToken: req.body?.antiforgeryToken ?? null,
          sessionToken: req.body?.sessionToken ?? null,
        }),
        guest: await guestGuardAsync({ action: req.body?.action ?? 'confirm', customer: base.customer, storeId: base.storeId }),
      };
    }));
    r.get('/checkout/step-fields', send(() => STEP_FIELDS));

    /* ------------------------------------- PRD-CHK-003 the validation host ---------- */
    r.get('/validation/providers', send(() => ({
      cartChecks: cartCheckProvidersRegistered(),
      subtotalAdjuster: subtotalAdjusterRegistered(),
      placementValidators: placementValidatorsRegistered(),
      placementParticipants: placementParticipantsRegistered(),
      orderActionGuards: orderActionGuardsRegistered(),
      cancellationParticipants: cancellationParticipantsRegistered(),
      nativeWarnings: NATIVE_WARNINGS,
      checkOrder: CHECK_ORDER,
    })));
    r.post('/validation/item-warnings', send(async (req) => {
      const base = await withCustomer(req);
      return itemWarningsAsync({
        product: await productAsync(req.body?.productId),
        quantity: Number(req.body?.quantity ?? 1),
        customer: base.customer,
        storeId: base.storeId,
        cartType: Number(req.body?.cartType ?? 1),
      });
    }));
    r.post('/validation/standard-warnings', send(async (req) => {
      const base = await withCustomer(req);
      return {
        warnings: await standardWarningsAsync({
          product: await productAsync(req.body?.productId),
          quantity: Number(req.body?.quantity ?? 1),
          customer: base.customer,
          storeId: base.storeId,
        }),
      };
    }));
    r.post('/validation/cart-warnings', send(async (req) => {
      const base = await withCustomer(req);
      return cartWarningsAsync({ cart: await getCartAsync(base), customer: base.customer, storeId: base.storeId });
    }));
    r.post('/validation/subtotal', send(async (req) => {
      const base = await withCustomer(req);
      return subTotalAsync({
        item: req.body?.item ?? {}, includeDiscounts: req.body?.includeDiscounts !== false, customer: base.customer, storeId: base.storeId,
      });
    }));
    r.post('/validation/order-action', send(async (req) => guardOrderActionAsync({
      action: req.body?.action,
      order: await ctx.repository('Order').getOneAsync((o) => o.orderNumber === req.body?.orderNumber),
      shipment: req.body?.shipmentId ? await ctx.repository('Shipment').getByIdAsync(req.body.shipmentId) : null,
      actor: req.actorEmail,
    })));
    r.post('/orders/:orderNumber/cancel', send((req) => cancelOrderAsync({
      orderNumber: req.params.orderNumber, reason: req.body?.reason ?? null, actor: req.actorEmail ?? 'admin', storeId: req.storeId,
    })));

    /* --------------------- PRD-CHK-005 fulfilment per line, PRD-CHK-014 the dates --- */
    const gate = (permission) => async (req, res, next) => {
      if (!await ctx.security.authorizeAsync(permission, req.actor)) {
        return res.status(403).json({
          ok: false, denied: true, permission, message: `Access denied: ${permission} is required.`,
        });
      }
      return next();
    };

    r.get('/fulfilment/options', send(async (req) => {
      const base = await withCustomer(req);
      return cartFulfilmentOptionsAsync({
        cart: await getCartAsync(base),
        customer: base.customer,
        storeId: base.storeId,
        date: req.query.date ?? null,
      });
    }));
    r.get('/fulfilment/options/:itemId', send(async (req) => {
      const base = await withCustomer(req);
      const item = await ctx.repository('ShoppingCartItem').getByIdAsync(Number(req.params.itemId));
      if (!item) return { ok: false, message: 'cart item not found' };
      return lineOptionsAsync({
        item, customer: base.customer, storeId: base.storeId, date: req.query.date ?? null,
      });
    }));
    r.post('/fulfilment/lines/:itemId', send(async (req) => {
      const base = await withCustomer(req);
      const result = await setLineFulfilmentAsync({
        shoppingCartItemId: Number(req.params.itemId),
        method: req.body?.method,
        pickupPointId: req.body?.pickupPointId ?? null,
        storeId: base.storeId,
      });
      return { ...result, cart: await getCartAsync(base) };
    }));
    r.get('/fulfilment/estimates', send(async (req) => {
      const base = await withCustomer(req);
      return stepEstimatesAsync({
        cart: await getCartAsync(base), storeId: base.storeId, customer: base.customer,
      });
    }));

    /* --------------------- PRD-CHK-006 windows, preferred date and instructions ------ */
    r.get('/checkout/shipping-step', send(async (req) => shippingStepAsync({
      ...await withCustomer(req),
      shippingMethod: req.query.shippingMethod ?? null,
      area: req.query.area ?? null,
      date: req.query.date ?? null,
    })));
    r.get('/delivery-windows', send(async (req) => windowsAsync({
      shippingMethod: req.query.shippingMethod ?? null,
      area: req.query.area ?? null,
      date: req.query.date ?? null,
      storeId: req.storeId,
    })));
    r.get('/delivery-dates', send(async (req) => desiredDateOptionsAsync({
      storeId: req.storeId, transitDays: Number(req.query.transitDays ?? 0),
    })));
    r.get('/admin/delivery-windows', gate('Checkout.Core.Rules.View'), send(async (req) => ({
      windows: await windowDefinitionsAsync({ storeId: req.storeId }),
      bookings: await bookingsAsync({}),
      instructionsAttribute: await instructionsAttributeAsync({ storeId: req.storeId }),
    })));
    r.post('/admin/delivery-windows', gate('Checkout.Core.Rules.CreateEditDelete'), send(async (req) => defineWindowAsync({
      ...req.body, storeId: req.storeId, actor: req.actorEmail ?? 'administrator',
    })));
    r.delete('/admin/delivery-windows/:id', gate('Checkout.Core.Rules.CreateEditDelete'), send(async (req) => removeWindowAsync({
      id: Number(req.params.id), storeId: req.storeId, actor: req.actorEmail ?? 'administrator',
    })));

    /* --------------------- PRD-CHK-007 the address form ----------------------------- */
    r.get('/address/form', send(async (req) => addressFormAsync({
      storeId: req.storeId, country: req.query.country ?? null,
    })));
    r.get('/address/attributes', send(async (req) => addressAttributesAsync({ storeId: req.storeId })));
    r.post('/address', send(async (req) => {
      const base = await withCustomer(req);
      return saveAddressAsync({
        id: req.body?.id ?? null,
        customer: base.customer,
        values: req.body?.values ?? {},
        attributes: req.body?.attributes ?? {},
        pin: req.body?.pin ?? null,
        storeId: base.storeId,
      });
    }));
    r.get('/orders/:orderNumber/address', send(async (req) => orderAddressAsync({
      orderNumber: req.params.orderNumber,
    })));

    r.get('/checkout/exceptions', async (req, res, next) => {
      try { res.json(await checkoutExceptionsAsync()); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/checkout-area', r);
    ctx.declare({
      built: true,
      owns: ['PRD-CHK-001', 'PRD-CHK-002', 'PRD-CHK-003', 'PRD-CHK-004', 'PRD-CHK-005', 'PRD-CHK-006',
        'PRD-CHK-007', 'PRD-CHK-012', 'PRD-CHK-014', 'PRD-CHK-019'],
      note: 'cart, checkout, the validation host, split placement, fulfilment per line, delivery windows, address capture, the pickup code and the confirmation',
    });
  },
});
