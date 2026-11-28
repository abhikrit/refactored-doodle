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
  shippingStepAsync, openSessionAsync, STEP_FIELDS,
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
  splitGroups, allocate, groupPaymentAsync, cartCheckAsync as groupPaymentCartCheckAsync,
  checkoutLinksAsync, requestRefundAsync, PROTOTYPE_DEFAULT,
} from './services/split.js';
import {
  resumeAsync, resumePaymentAsync, checkoutNodeReadinessAsync, idempotencyKey, cartHash,
  placementLockCount, updateSessionAsync, clearPlacementInterval,
} from './services/resilience.js';
import {
  saveRuleAsync, setRuleActiveAsync, rulesAsync, cartCheckAsync as cartRuleCheckAsync,
  RULE_TYPE,
} from './services/cart-rules.js';
import {
  noticeProfileAsync, saveNoticeAsync, setConfirmationTimeLimitAsync, noticesForAsync,
  acknowledgementsRequiredAsync, confirmFilterAsync, acknowledgementsForOrderAsync,
  overdueConfirmationsAsync, CHECKOUT_POINTS,
} from './services/notices.js';
import {
  identificationMethodsAsync, codeForOrderAsync, markSentAsync, deliveryRouteAsync,
  revokeAsync as revokePickupCodeAsync, verifyAsync as verifyCodeAsync, CODE_STATE,
} from './services/pickup-code.js';
import {
  assistedOrdersForAsync, assistedPaymentMethodsAsync, getAssistedOrderAsync,
  listAssistedOrdersAsync,
} from './services/assisted.js';
import {
  saveAttributeAsync, saveAttributeValueAsync, attributesForAsync, validateAttributesAsync,
  attributeFeeAsync, CONTROL_TYPES,
} from './services/checkout-attributes.js';
import {
  applyAsync as applyForCreditAsync, decideAsync as decideCreditAsync, accountsAsync,
  accountForCustomerAsync, availableCreditAsync, onAccountOfferAsync,
  placementParticipantAsync as creditParticipantAsync, CREDIT_STATE, ON_ACCOUNT,
} from './services/credit.js';
import { quickOrderAsync, savedListsAsync, saveListAsync, addListToCartAsync } from './services/quick-order.js';
import {
  saveRuleAsync as saveApprovalRuleAsync, rulesAsync as approvalRulesAsync, thresholdForAsync,
  submitForApprovalAsync, decideRequestAsync, approvalForCartAsync, requestsAsync,
  expireRequestsAsync, registerCallbacks as registerApprovalCallbacksForChk, REQUEST_STATE,
} from './services/approval.js';
import { registerEventCodeAsync } from '../product-trk/services/notifications.js';
import { declareSettingKeys } from '../../core/pack-loader.js';
import { onStoreReset } from '../../core/repository.js';
import {
  itemWarningsAsync, cartWarningsAsync, standardWarningsAsync, subTotalAsync, minimumOrderWarningsAsync,
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
    // a pack switch re-seeds the store and hands out the row ids again, so the native
    // placement-interval cache is dropped with it (it is keyed by customer id)
    onStoreReset(() => { clearPlacementInterval(); });

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
    // AC-CHK-019-01-04: CHK registers its own event codes with TRK-005 (IC-TRK-04); a send with
    // an unregistered code is refused by TRK.
    registerEventCodeAsync({
      code: 'Chk.OrderPlacedGroup',
      owningModule: 'Product.CHK',
      feature: 'PRD-CHK-019',
      category: 'Orders',
      defaultChannels: ['email', 'inapp'],
      content: {
        email: 'Your order {reference} has been placed. It will be delivered by {count} sellers.',
        inapp: 'Your order {reference} has been placed ({count} sellers).',
      },
    });
    registerEventCodeAsync({
      code: 'Chk.PickupCode',
      owningModule: 'Product.CHK',
      feature: 'PRD-CHK-012',
      category: 'Orders',
      // inactive by default: ShipmentReadyForPickup.CustomerNotification carries the code
      defaultChannels: [],
      content: {
        sms: 'Your pickup code for order {order number} at {outlet}: {code}',
      },
    });

    // AC-CHK-004-01-08 / decision CART-500: the native per-seller cart settings are pinned off
    // in the CHK key catalogue, so pack validation refuses any other value (BR-CHK-023).
    declareSettingKeys({
      owner: 'Product.CHK',
      prefixes: ['chk.'],
      keys: ['shoppingcartsettings.vendorenabled', 'shoppingcartsettings.vendorrequired'],
      fixedValues: {
        'shoppingcartsettings.vendorenabled': {
          value: false,
          rule: 'BR-CHK-023 / decision CART-500',
          reason: 'the product keeps one cart for all sellers and splits the order in CHK-004',
        },
        'shoppingcartsettings.vendorrequired': {
          value: false,
          rule: 'BR-CHK-023 / decision CART-500',
          reason: 'the product keeps one cart for all sellers and splits the order in CHK-004',
        },
      },
    });

    // AC-CHK-011-01-01 and 02-01: the client's cart restriction rules are one provider on the
    // CHK-003 override (BR-CHK-015), so they run at the cart, at checkout and at placement
    registerCartCheckProvider({
      area: 'CHK',
      feature: 'PRD-CHK-011',
      name: 'cart restriction rules',
      fn: cartRuleCheckAsync,
    });

    // CHK-016: the credit check and its reservation are a placement participant, so the credit
    // of one company cannot be spent twice at once (BR-CHK-018, 'chk-credit-{id}')
    registerPlacementParticipant({
      area: 'CHK',
      feature: 'PRD-CHK-016',
      name: 'credit account',
      lockKey: ({ customer }) => (customer ? `chk-credit-${customer.id}` : null),
      fn: creditParticipantAsync,
    });

    // CHK-018 decides its own requests inside the ADM-006 queue (IC-ADM-03)
    registerApprovalCallbacksForChk();

    // AC-CHK-012-01-02: a cancelled order revokes its pickup code (SM-CHK-03, IC-CHK-08)
    registerCancellationParticipant({
      area: 'CHK',
      feature: 'PRD-CHK-012',
      name: 'revoke the pickup code',
      fn: revokePickupCodeAsync,
    });

    // AC-CHK-004-01-07: the cart says when a multi-seller cart cannot be paid for in one go
    registerCartCheckProvider({
      area: 'CHK',
      feature: 'PRD-CHK-004',
      name: 'group payment',
      fn: groupPaymentCartCheckAsync,
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

    /* --------------------- PRD-CHK-004 the split, PRD-CHK-008 the one reference ----- */
    r.get('/split/preview', send(async (req) => {
      const base = await withCustomer(req);
      const cart = await getCartAsync(base);
      const totals = await totalsAsync({
        ...base, paymentMethodSystemName: req.query.paymentMethodSystemName ?? null,
      });
      const groups = splitGroups(cart);
      return {
        groups: groups.map((g) => ({
          key: g.key, vendorId: g.vendorId, fulfilment: g.fulfilment, lines: g.items.length,
        })),
        allocation: allocate({ groups, totals }),
        groupPayment: await groupPaymentAsync({ cart, storeId: base.storeId }),
        prototypeDefault: groups.length > 1 ? PROTOTYPE_DEFAULT : null,
      };
    }));
    r.get('/split/group-payment', send(async (req) => {
      const base = await withCustomer(req);
      return groupPaymentAsync({ cart: await getCartAsync(base), storeId: base.storeId });
    }));
    r.get('/checkout/links/:reference', send((req) => checkoutLinksAsync(req.params.reference)));
    r.post('/checkout/exceptions/:reference/refund', gate('Checkout.Core.Exceptions.View'), send((req) => requestRefundAsync({
      reference: req.params.reference,
      amount: Number(req.body?.amount ?? 0),
      reason: req.body?.reason ?? null,
      actor: req.actorEmail ?? 'support',
      storeId: req.storeId,
    })));
    r.get('/checkout/resume', send(async (req) => resumeAsync(await withCustomer(req))));
    r.get('/orders/:orderNumber/resume-payment', send((req) => resumePaymentAsync({
      orderNumber: req.params.orderNumber, storeId: req.storeId,
    })));
    r.get('/checkout/idempotency', send(async (req) => {
      const base = await withCustomer(req);
      const cart = await getCartAsync(base);
      const session = await openSessionAsync(base);
      return {
        reference: session?.reference ?? null,
        cartHash: cartHash(cart),
        key: session ? idempotencyKey({ reference: session.reference, cart }) : null,
        placementLockTaken: placementLockCount(base.customer?.id ?? base.sessionId),
      };
    }));
    r.get('/checkout/node-readiness', send((req) => checkoutNodeReadinessAsync({ storeId: req.storeId })));

    /* --------------------- PRD-CHK-011 cart rules, PRD-CHK-010 thresholds ----------- */
    r.get('/cart-rules', gate('Checkout.Core.Rules.View'), send((req) => rulesAsync({ storeId: req.storeId })));
    r.post('/cart-rules', gate('Checkout.Core.Rules.CreateEditDelete'), send((req) => saveRuleAsync({
      ...req.body, storeId: req.storeId, actor: req.actorEmail ?? 'administrator',
    })));
    r.post('/cart-rules/:id/active', gate('Checkout.Core.Rules.CreateEditDelete'), send((req) => setRuleActiveAsync({
      id: Number(req.params.id),
      isActive: req.body?.isActive === true,
      storeId: req.storeId,
      actor: req.actorEmail ?? 'administrator',
    })));
    r.get('/cart-rules/kinds', send(() => RULE_TYPE));
    r.get('/thresholds', send(async (req) => {
      const base = await withCustomer(req);
      const cart = await getCartAsync(base);
      const totals = await totalsAsync({ ...base, paymentMethodSystemName: req.query.paymentMethodSystemName ?? null });
      return minimumOrderWarningsAsync({
        cart, storeId: base.storeId, total: totals.total, currency: totals.currency,
      });
    }));

    /* --------------------- PRD-CHK-009 notices and acknowledgements ----------------- */
    r.get('/notices/profile', send((req) => noticeProfileAsync({ storeId: req.storeId })));
    r.get('/notices/points', send(() => CHECKOUT_POINTS));
    r.get('/notices/topics', send(async (req) => (await ctx.repository('Topic')
      .getAllAsync((t) => t.published !== false
        && (t.storeId == null || Number(t.storeId) === Number(req.storeId))))
      .map((t) => ({
        systemName: t.systemName, title: t.title, placeholder: t.placeholder === true,
      }))));
    r.get('/notices/:checkpoint', send(async (req) => {
      const base = await withCustomer(req);
      return noticesForAsync({
        checkpoint: req.params.checkpoint,
        storeId: base.storeId,
        cart: await getCartAsync(base),
        customer: base.customer,
      });
    }));
    r.post('/notices', gate('Checkout.Core.Rules.CreateEditDelete'), send((req) => saveNoticeAsync({
      ...req.body, storeId: req.storeId, actor: req.actor, actorEmail: req.actorEmail ?? 'administrator',
    })));
    r.post('/notices/confirmation-time-limit', gate('Checkout.Core.Rules.CreateEditDelete'), send((req) => setConfirmationTimeLimitAsync({
      hours: Number(req.body?.hours ?? 0),
      storeId: req.storeId,
      actor: req.actor,
      actorEmail: req.actorEmail ?? 'administrator',
    })));
    r.get('/checkout/acknowledgements', send(async (req) => {
      const base = await withCustomer(req);
      return acknowledgementsRequiredAsync({
        cart: await getCartAsync(base), storeId: base.storeId, customer: base.customer,
      });
    }));
    r.post('/checkout/acknowledgements/check', send(async (req) => {
      const base = await withCustomer(req);
      return confirmFilterAsync({
        cart: await getCartAsync(base),
        storeId: base.storeId,
        customer: base.customer,
        acknowledgements: req.body?.acknowledgements ?? [],
        termsAccepted: req.body?.termsAccepted ?? null,
      });
    }));
    r.get('/orders/:orderNumber/acknowledgements', send((req) => acknowledgementsForOrderAsync(req.params.orderNumber)));
    r.get('/notices/confirmations/overdue', gate('Checkout.Core.Exceptions.View'), send((req) => overdueConfirmationsAsync({
      storeId: req.storeId, now: req.query.now ?? null,
    })));

    /* --------------------- PRD-CHK-012 the pickup code ------------------------------ */
    r.get('/pickup-code/methods', send((req) => identificationMethodsAsync({ storeId: req.storeId })));
    r.get('/pickup-code/route', send((req) => deliveryRouteAsync({ storeId: req.storeId })));
    r.get('/orders/:orderNumber/pickup-code', send((req) => codeForOrderAsync({ orderNumber: req.params.orderNumber })));
    r.post('/orders/:orderNumber/pickup-code/sent', send((req) => markSentAsync({
      orderNumber: req.params.orderNumber,
      shipmentId: req.body?.shipmentId ?? null,
      channel: req.body?.channel ?? null,
    })));
    r.post('/orders/:orderNumber/pickup-code/verify', send((req) => verifyCodeAsync({
      orderNumber: req.params.orderNumber,
      code: req.body?.code,
      pickupPointId: req.body?.pickupPointId ?? null,
      verifiedBy: req.actorEmail ?? null,
      storeId: req.storeId,
    })));
    r.get('/pickup-code/states', send(() => CODE_STATE));

    /* --------------------- PRD-CHK-013 assisted checkout ---------------------------- */
    r.get('/assisted/orders', send(async (req) => assistedOrdersForAsync({
      actor: req.actor,
      agentEmail: req.query.agent ?? null,
      outlet: req.query.outlet ?? null,
      from: req.query.from ?? null,
      to: req.query.to ?? null,
    })));
    r.get('/assisted/payment-methods', send(async (req) => assistedPaymentMethodsAsync({
      storeId: req.storeId, multiSeller: req.query.multiSeller === 'true',
    })));
    r.get('/assisted/orders/:orderNumber', send((req) => getAssistedOrderAsync(req.params.orderNumber)));
    r.get('/assisted/list', send((req) => listAssistedOrdersAsync({
      agentEmail: req.query.agent ?? null,
      outlet: req.query.outlet ?? null,
      from: req.query.from ?? null,
      to: req.query.to ?? null,
    })));

    /* --------------------- PRD-CHK-015 checkout attributes -------------------------- */
    r.get('/checkout-attributes', send(async (req) => attributesForAsync({
      storeId: req.storeId, values: req.query,
    })));
    r.get('/checkout-attributes/control-types', send(() => CONTROL_TYPES));
    r.post('/checkout-attributes', gate('Catalog.CheckoutAttributesCreateEditDelete'), send((req) => saveAttributeAsync({
      ...req.body, storeId: req.storeId, actor: req.actorEmail ?? 'administrator',
    })));
    r.post('/checkout-attributes/:id/values', gate('Catalog.CheckoutAttributesCreateEditDelete'), send((req) => saveAttributeValueAsync({
      ...req.body, attributeId: Number(req.params.id), storeId: req.storeId,
    })));
    r.post('/checkout-attributes/validate', send((req) => validateAttributesAsync({
      storeId: req.storeId, values: req.body?.values ?? {},
    })));
    r.post('/checkout-attributes/fee', send((req) => attributeFeeAsync({
      storeId: req.storeId, values: req.body?.values ?? {},
    })));

    /* --------------------- PRD-CHK-016 on-account payment and credit ---------------- */
    r.get('/credit/accounts', send((req) => accountsAsync({ actor: req.actor, storeId: req.storeId })));
    r.post('/credit/apply', send((req) => applyForCreditAsync({
      ...req.body, storeId: req.storeId,
    })));
    r.post('/credit/accounts/:id/decision', send((req) => decideCreditAsync({
      accountId: Number(req.params.id), ...req.body, actor: req.actor, storeId: req.storeId,
    })));
    r.get('/credit/mine', send(async (req) => {
      const base = await withCustomer(req);
      const account = await accountForCustomerAsync({ customer: base.customer, storeId: base.storeId });
      if (!account) return { account: null, credit: null };
      return { account, credit: await availableCreditAsync({ account, storeId: base.storeId }) };
    }));
    r.get('/credit/on-account-offer', send(async (req) => {
      const base = await withCustomer(req);
      const totals = await totalsAsync({ ...base, paymentMethodSystemName: ON_ACCOUNT });
      return onAccountOfferAsync({
        customer: base.customer, total: Number(req.query.total ?? totals.total), storeId: base.storeId,
      });
    }));
    r.get('/credit/states', send(() => CREDIT_STATE));

    /* --------------------- PRD-CHK-017 quick order and saved lists ------------------ */
    r.post('/quick-order', send(async (req) => {
      const base = await withCustomer(req);
      return quickOrderAsync({
        ...base, lines: req.body?.lines ?? [], text: req.body?.text ?? null, file: req.body?.file ?? null,
      });
    }));
    r.get('/saved-lists', send(async (req) => {
      const base = await withCustomer(req);
      return savedListsAsync({ customer: base.customer, storeId: base.storeId });
    }));
    r.post('/saved-lists', send(async (req) => {
      const base = await withCustomer(req);
      return saveListAsync({
        customer: base.customer, name: req.body?.name, sessionId: base.sessionId, storeId: base.storeId,
      });
    }));
    r.post('/saved-lists/:id/add-to-cart', send(async (req) => {
      const base = await withCustomer(req);
      return addListToCartAsync({
        listId: Number(req.params.id), sessionId: base.sessionId, customer: base.customer, storeId: base.storeId,
      });
    }));

    /* --------------------- PRD-CHK-018 purchase approval ---------------------------- */
    r.get('/approval/rules', send((req) => approvalRulesAsync({ companyId: Number(req.query.companyId) })));
    r.post('/approval/rules', send((req) => saveApprovalRuleAsync({
      ...req.body, storeId: req.storeId, actor: req.actorEmail ?? 'company administrator',
    })));
    r.get('/approval/threshold', send(async (req) => {
      const base = await withCustomer(req);
      return thresholdForAsync({ customer: base.customer, storeId: base.storeId });
    }));
    r.post('/approval/submit', send(async (req) => {
      const base = await withCustomer(req);
      return submitForApprovalAsync({
        customer: base.customer, cart: await getCartAsync(base), storeId: base.storeId,
      });
    }));
    r.post('/approval/requests/:id/decision', send(async (req) => decideRequestAsync({
      requestId: Number(req.params.id),
      decision: req.body?.decision,
      approver: req.actor,
      reason: req.body?.reason ?? null,
      storeId: req.storeId,
    })));
    r.get('/approval/requests', send(async (req) => requestsAsync({
      companyId: req.query.companyId ?? null,
      requesterId: req.query.requesterId ?? null,
      status: req.query.status ?? null,
    })));
    r.get('/approval/for-cart', send(async (req) => {
      const base = await withCustomer(req);
      return approvalForCartAsync({
        customer: base.customer, cart: await getCartAsync(base), storeId: base.storeId,
      });
    }));
    r.post('/approval/expire', gate('Checkout.Core.Rules.CreateEditDelete'), send((req) => expireRequestsAsync({
      storeId: req.storeId, now: req.body?.now ?? null,
    })));
    r.get('/approval/states', send(() => REQUEST_STATE));

    r.get('/checkout/exceptions', async (req, res, next) => {
      try { res.json(await checkoutExceptionsAsync()); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/checkout-area', r);
    ctx.declare({
      built: true,
      owns: ['PRD-CHK-001', 'PRD-CHK-002', 'PRD-CHK-003', 'PRD-CHK-004', 'PRD-CHK-005', 'PRD-CHK-006',
        'PRD-CHK-007', 'PRD-CHK-008', 'PRD-CHK-009', 'PRD-CHK-010', 'PRD-CHK-011', 'PRD-CHK-012',
        'PRD-CHK-013', 'PRD-CHK-014', 'PRD-CHK-015', 'PRD-CHK-016', 'PRD-CHK-017', 'PRD-CHK-018',
        'PRD-CHK-019'],
      note: 'cart, checkout, the validation host, split placement, fulfilment per line, delivery windows, address capture, the pickup code and the confirmation',
    });
  },
});
