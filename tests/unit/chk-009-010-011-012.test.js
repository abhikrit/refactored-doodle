// PRD-CHK-009 e-transactions consumer controls (6 ACs), PRD-CHK-010 minimum order and fee
// thresholds (3), PRD-CHK-011 cart restriction rules (6) and PRD-CHK-012 pickup code / QR (7).
// One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { registerProvider } from '../../packages/server/src/core/providers.js';
import {
  saveRuleAsync, setRuleActiveAsync, rulesAsync, pickupOnlyAsync, RULE_TYPE,
} from '../../packages/server/src/plugins/product-chk/services/cart-rules.js';
import {
  noticeProfileAsync, saveNoticeAsync, setConfirmationTimeLimitAsync, noticesForAsync,
  acknowledgementsRequiredAsync, confirmFilterAsync, acknowledgementsForOrderAsync,
  overdueConfirmationsAsync,
} from '../../packages/server/src/plugins/product-chk/services/notices.js';
import {
  identificationMethodsAsync, codeForOrderAsync, markSentAsync, verifyAsync, markUsedAsync,
  revokeAsync, deliveryRouteAsync, CODE_STATE, METHOD,
} from '../../packages/server/src/plugins/product-chk/services/pickup-code.js';
import { minimumOrderWarningsAsync } from '../../packages/server/src/plugins/product-chk/services/validation.js';
import { getCartAsync } from '../../packages/server/src/plugins/product-chk/services/cart.js';
import { setLineFulfilmentAsync, METHOD as FULFILMENT } from '../../packages/server/src/plugins/product-chk/services/fulfilment.js';
import { acceptancesAsync } from '../../packages/server/src/plugins/product-iam/services/privacy.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

let n = 0;
async function signedInAsync(label) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `chk9-${n}@example.com`, firstName: 'Chk', lastName: 'Shopper', roles: ['Registered'], phone: '+265996000001',
  });
  const sessionId = `${label}-${customer.id}`;
  await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, sessionId);
  return { customer, sessionId };
}

async function productsAsync(count = 2) {
  const quotas = await repository('Quota').getAllAsync((q) => q.scope === 'product');
  const reserved = new Set(quotas.map((q) => String(q.refId)));
  const rows = await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
    && p.isShipEnabled !== false && !reserved.has(String(p.id))
    && !(p.limitedToCustomerRoles?.length > 0));
  return rows.slice(0, count);
}

const addAsync = (session, productId, quantity = 1) => api.post('/api/checkout-area/cart/items', { productId, quantity }, session);

const confirmAsync = (session, extra = {}) => api.post('/api/checkout-area/checkout/confirm', {
  paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, paymentData: { phone: '265880000001' }, ...extra,
}, session);

async function withSettingAsync(key, value, fn, storeId = 0) {
  const before = await getSettingAsync(key, storeId);
  await saveSettingAsync(key, value, storeId);
  try { return await fn(); } finally { await saveSettingAsync(key, before, storeId); }
}

/** Rules and notices are a client's own configuration: each test cleans up after itself. */
async function removeRulesAsync() {
  for (const rule of await rulesAsync({})) await repository('CartRestrictionRule').deleteAsync(rule.id);
}

/* ====================================================== PRD-CHK-009 =================== */

describe('PRD-CHK-009 the notices the law requires', () => {
  test('AC-CHK-009-01-01', async () => {
    // "the notice topic is shown; for a policy topic under MKT-008 versioning the text is its
    //  Effective version; CHK keeps no notice versions of its own"
    const profile = await noticeProfileAsync({ storeId: 1 });
    assert.equal(profile.readThrough, 'IC-SEC-03 GetProfile', 'the notice set is read from the country profile');
    assert.match(profile.ownedBy, /SEC-012 country profile/);

    const saved = await api.post('/api/checkout-area/notices', {
      checkpoint: 'cart',
      topicSystemName: 'ETransactionsNotice',
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);

    const { sessionId } = await signedInAsync('notice-cart');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const shown = await api.get('/api/checkout-area/notices/cart', sessionId);
    const notice = shown.notices.find((x) => x.topicSystemName === 'ETransactionsNotice');
    assert.ok(notice, 'the notice is shown at that checkout point');
    assert.equal(notice.title, 'Your rights when buying online', 'with the text of the native topic');
    assert.equal(notice.topicFound, true);
    assert.equal(notice.textIsVersioned, false, 'a plain topic carries no version');

    // a policy topic takes its effective version from MKT-008
    await api.post('/api/checkout-area/notices', {
      checkpoint: 'payment',
      topicSystemName: 'ConditionsOfUse',
      policySystemName: 'ConditionsOfUse',
    }, SESSIONS.admin);
    const atPayment = await api.get('/api/checkout-area/notices/payment', sessionId);
    const policy = atPayment.notices.find((x) => x.topicSystemName === 'ConditionsOfUse');
    assert.equal(policy.textIsVersioned, true);
    assert.equal(policy.versionSuppliedBy, 'IC-MKT-03 GetEffectivePolicyVersion');
    assert.ok(policy.version, 'the effective version is named');

    const kept = await repository('PolicyVersion').getAllAsync((v) => v.policySystemName === 'ConditionsOfUse');
    assert.ok(kept.every((v) => v.suppliedBy === 'PRD-MKT-008'), 'the versions belong to MKT-008, not to CHK');
  });

  test('AC-CHK-009-02-01', async () => {
    // "a checkbox with a link to the policy is shown; if it is not ticked the order is not
    //  placed and message Chk.AcknowledgementRequired is shown"
    await api.post('/api/checkout-area/notices', {
      checkpoint: 'confirm',
      topicSystemName: 'ReturnsAndRefunds',
      requiresAcknowledgement: true,
    }, SESSIONS.admin);

    const { sessionId } = await signedInAsync('acknowledgement');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);

    const asked = await api.get('/api/checkout-area/checkout/acknowledgements', sessionId);
    assert.equal(asked.anyRequired, true, 'the confirm step asks for it');
    assert.equal(asked.required[0].topicSystemName, 'ReturnsAndRefunds');
    assert.equal(asked.required[0].title, 'Returns and refunds policy', 'with a link to the policy text');

    const ordersBefore = (await repository('Order').getAllAsync()).length;
    const refused = await confirmAsync(sessionId);
    assert.equal(refused.ok, false, 'the order is not placed without it');
    assert.equal(refused.messageKey, 'Chk.AcknowledgementRequired');
    assert.equal(refused.failures[0].message, 'Please confirm that you have read the returns and refund policy.');
    assert.deepEqual(refused.missingAcknowledgements, ['ReturnsAndRefunds']);
    assert.equal((await repository('Order').getAllAsync()).length, ordersBefore);

    // the check is on the server, so a direct post cannot skip it
    const direct = await api.post('/api/checkout-area/checkout/acknowledgements/check', {
      acknowledgements: [], termsAccepted: true,
    }, sessionId);
    assert.equal(direct.ok, false);
    assert.match(direct.enforcedBy, /action filter on the confirm post/);
  });

  test('AC-CHK-009-02-02', async () => {
    // "the acceptance is recorded through IAM IC-IAM-05 RecordAcceptance ...; CHK stores only a
    //  NoticeAcknowledgement link of order, notice and the returned acceptance id"
    const { sessionId, customer } = await signedInAsync('acknowledged');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);

    const placed = await confirmAsync(sessionId, {
      acknowledgements: ['ReturnsAndRefunds'], ipAddress: '41.70.12.9',
    });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const acceptances = (await acceptancesAsync(customer.id)).filter((a) => a.channel === 'checkout');
    assert.equal(acceptances.length, 1, 'IAM holds the acceptance');
    assert.equal(acceptances[0].policySystemName, 'ReturnsAndRefunds');
    assert.equal(acceptances[0].ipAddress, '41.70.12.9');
    assert.equal(acceptances[0].decision, 'accepted');

    const links = await acknowledgementsForOrderAsync(placed.orders[0].orderNumber);
    assert.equal(links.length, 1, 'and CHK keeps only the link');
    assert.equal(links[0].iamAcceptanceId, acceptances[0].id);
    assert.equal(links[0].topicSystemName, 'ReturnsAndRefunds');
    assert.ok(Object.keys(links[0]).every((k) => k !== 'ipAddress'), 'the acceptance details stay with IAM');

    const trail = await auditTrailAsync({ event: 'AUD-CHK-002' });
    assert.ok(trail.some((e) => e.after?.orderNumber === placed.orders[0].orderNumber));
  });

  test('AC-CHK-009-02-03', async () => {
    // "no acknowledgement is shown" where nothing in the cart requires one
    await api.post('/api/checkout-area/notices', {
      checkpoint: 'confirm', topicSystemName: 'ReturnsAndRefunds', remove: true,
    }, SESSIONS.admin);
    await api.post('/api/checkout-area/notices', {
      checkpoint: 'confirm',
      topicSystemName: 'ReturnsAndRefunds',
      requiresAcknowledgement: true,
      scope: 'category',
      scopeValue: 999999,
    }, SESSIONS.admin);

    const { sessionId } = await signedInAsync('no-acknowledgement');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const asked = await api.get('/api/checkout-area/checkout/acknowledgements', sessionId);
    assert.equal(asked.anyRequired, false, 'nothing in this cart asks for one');

    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, 'and the order goes through');

    await api.post('/api/checkout-area/notices', {
      checkpoint: 'confirm', topicSystemName: 'ReturnsAndRefunds', remove: true,
    }, SESSIONS.admin);
  });

  test('AC-CHK-009-03-01', async () => {
    // "the order confirmation is queued at placement; if QueuedEmail.SentOnUtc is still empty
    //  when the limit passes, the order appears in the checkout exceptions list and staff are
    //  alerted"
    const limit = await api.post('/api/checkout-area/notices/confirmation-time-limit', { hours: 2 }, SESSIONS.admin);
    assert.equal(limit.ok, true);
    assert.equal((await noticeProfileAsync({ storeId: 1 })).confirmationTimeLimitHours, 2);

    const { sessionId } = await signedInAsync('confirmation-limit');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const queued = await repository('NotificationMessage').getOneAsync((m) => m.channel === 'email'
      && m.tokens?.['order number'] === placed.orders[0].orderNumber);
    assert.ok(queued, 'the confirmation is queued at placement');
    assert.equal(queued.sentOnUtc ?? null, null, 'and has not been sent yet');

    const inTime = await overdueConfirmationsAsync({ storeId: 1 });
    assert.equal(inTime.overdue.some((o) => o.orderNumber === placed.orders[0].orderNumber), false, 'nothing is overdue yet');

    // three hours later it is overdue
    const later = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const overdue = await overdueConfirmationsAsync({ storeId: 1, now: later });
    const mine = overdue.overdue.find((o) => o.orderNumber === placed.orders[0].orderNumber);
    assert.ok(mine, 'the order is reported as overdue');
    assert.equal(mine.staffAlerted, true);

    const exceptions = await api.get('/api/checkout-area/checkout/exceptions', SESSIONS.admin);
    assert.ok(
      exceptions.some((e) => e.kind === 'unsent-confirmation' && e.orderNumber === placed.orders[0].orderNumber),
      'and it is in the checkout exceptions list',
    );
    await api.post('/api/checkout-area/notices/confirmation-time-limit', { hours: 0 }, SESSIONS.admin);
  });

  test('AC-CHK-009-04-01', async () => {
    // "those notices are shown at their configured checkout points and consents are recorded
    //  through SEC-012"
    await api.post('/api/checkout-area/notices', {
      checkpoint: 'completed', topicSystemName: 'PrivacyInfo',
    }, SESSIONS.admin);
    const { sessionId } = await signedInAsync('country-notices');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);

    const completed = await api.get('/api/checkout-area/notices/completed', sessionId);
    assert.ok(completed.notices.some((x) => x.topicSystemName === 'PrivacyInfo'), 'the data-protection notice is shown');
    assert.equal(completed.country, 'MW', 'for the store country');

    const confirm = await api.get('/api/checkout-area/notices/confirm', sessionId);
    assert.notEqual(confirm.consentTexts, undefined, 'the consent texts of the same profile are available');

    // only a holder of the SEC profile permission may change the record
    const denied = await api.post('/api/checkout-area/notices', {
      checkpoint: 'cart', topicSystemName: 'AboutUs',
    }, SESSIONS.buyer);
    assert.equal(denied.denied, true);
  });
});

/* ====================================================== PRD-CHK-010 =================== */

describe('PRD-CHK-010 the thresholds a client sets', () => {
  test('AC-CHK-010-01-01', async () => {
    // "checkout cannot be completed and the native warning Checkout.MinOrderSubtotalAmount (or
    //  Checkout.MinOrderTotalAmount) shows the minimum"
    const { sessionId, customer } = await signedInAsync('minimum-order');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const cart = await getCartAsync({ sessionId, customer });

    const warnings = await withSettingAsync('ordersettings.minordersubtotalamount', cart.subtotal + 1000, async () => minimumOrderWarningsAsync({ cart, storeId: 1, currency: 'MWK' }), 1);
    assert.equal(warnings.refused, true);
    assert.equal(warnings.warnings[0].key, 'Checkout.MinOrderSubtotalAmount');
    assert.match(warnings.warnings[0].message, /minimum order subtotal amount is MWK/, 'the warning names the minimum');

    const refused = await withSettingAsync('ordersettings.minordersubtotalamount', cart.subtotal + 1000, async () => confirmAsync(sessionId), 1);
    assert.equal(refused.ok, false, 'checkout cannot be completed');
    assert.equal(refused.messageKey, 'Checkout.MinOrderSubtotalAmount');

    // the total has its own minimum
    const totalWarnings = await withSettingAsync('ordersettings.minordertotalamount', 1000000, async () => minimumOrderWarningsAsync({
      cart, storeId: 1, total: 100, currency: 'MWK',
    }), 1);
    assert.equal(totalWarnings.warnings[0].key, 'Checkout.MinOrderTotalAmount');

    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, 'and with no minimum set the order goes through');
  });

  test('AC-CHK-010-02-01', async () => {
    // "the delivery fee and the pickup fee are zero (native: one threshold applies to both)"
    const { sessionId, customer } = await signedInAsync('free-delivery');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id, 2);
    const cart = await getCartAsync({ sessionId, customer });

    const normal = await api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.ok(normal.deliveryFee > 0, 'a delivery fee is charged below the threshold');

    const free = await withSettingAsync('shippingsettings.freeshippingoverxenabled', true, async () => withSettingAsync('shippingsettings.freeshippingoverxvalue', Math.max(1, cart.subtotal - 1), async () => api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId), 1), 1);
    assert.equal(free.deliveryFee, 0, 'above the threshold delivery is free');
    assert.ok(free.perSeller.every((g) => g.fee === 0), 'for every group, delivered or collected');

    // a collected line carries no fee either way: one threshold, both ways
    const line = added.cart.items[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: line.id,
      method: FULFILMENT.Pickup,
      pickupPointId: (await repository('StorePickupPoint').getAllAsync())[0].id,
    });
    const collected = await api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(collected.deliveryFee, 0);
  });

  test('AC-CHK-010-01-02', async () => {
    // "the store's values apply (settings are store-overridable)"
    const shared = await getSettingAsync('ordersettings.minordersubtotalamount', 0);
    await saveSettingAsync('ordersettings.minordersubtotalamount', 50, 0);
    await saveSettingAsync('ordersettings.minordersubtotalamount', 5000, 1);
    try {
      const storeOne = await minimumOrderWarningsAsync({ cart: { subtotal: 1000 }, storeId: 1 });
      assert.equal(storeOne.minOrderSubtotalAmount, 5000, 'the store value applies in that store');
      assert.equal(storeOne.refused, true);

      const otherStore = await minimumOrderWarningsAsync({ cart: { subtotal: 1000 }, storeId: 2 });
      assert.equal(otherStore.minOrderSubtotalAmount, 50, 'another store falls back to the shared value');
      assert.equal(otherStore.refused, false);
    } finally {
      await repository('Setting').deleteManyAsync((x) => x.name === 'ordersettings.minordersubtotalamount' && x.storeId === 1);
      await saveSettingAsync('ordersettings.minordersubtotalamount', shared ?? 0, 0);
    }
  });
});

/* ====================================================== PRD-CHK-011 =================== */

describe('PRD-CHK-011 the rules a client sets for carts', () => {
  test('AC-CHK-011-01-01', async () => {
    // "the item is not added and message Chk.CartRuleViolation shows the rule text"
    await removeRulesAsync();
    const [first, second] = await productsAsync();
    const rule = await api.post('/api/checkout-area/cart-rules', {
      type: RULE_TYPE.ProhibitedCombination,
      scopeA: { kind: 'product', id: first.id },
      scopeB: { kind: 'product', id: second.id },
      messageText: 'These two cannot travel in the same parcel.',
    }, SESSIONS.admin);
    assert.equal(rule.ok, true);

    const { sessionId } = await signedInAsync('combination');
    const ok = await addAsync(sessionId, first.id);
    assert.equal(ok.ok, true, 'the first item goes in');

    const refused = await addAsync(sessionId, second.id);
    assert.equal(refused.ok, false, 'the second is not added');
    assert.ok(refused.warnings.some((w) => /cannot travel in the same parcel/.test(w)), 'the rule text is shown');
    const cart = await api.get('/api/checkout-area/cart', sessionId);
    assert.equal(cart.items.length, 1);
    await removeRulesAsync();
  });

  test('AC-CHK-011-01-02', async () => {
    // "the cart warnings list the violation and the order is not placed"
    await removeRulesAsync();
    const [first, second] = await productsAsync();
    const { sessionId } = await signedInAsync('late-rule');
    await addAsync(sessionId, first.id);
    await addAsync(sessionId, second.id);

    // the rule is made after the items were added
    await saveRuleAsync({
      type: RULE_TYPE.ProhibitedCombination,
      scopeA: { kind: 'product', id: first.id },
      scopeB: { kind: 'product', id: second.id },
      messageText: 'These two cannot travel in the same parcel.',
      storeId: 1,
    });

    const warnings = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
    assert.ok(warnings.warnings.some((w) => w.key === 'Chk.CartRuleViolation'), 'the cart warnings list it');
    const refused = await confirmAsync(sessionId);
    assert.equal(refused.ok, false, 'and the order is not placed');
    assert.equal(refused.messageKey, 'Chk.CartRuleViolation');
    await removeRulesAsync();
  });

  test('AC-CHK-011-02-01', async () => {
    // "delivery is not offered; a placement with delivery is refused with message Chk.PickupOnly"
    await removeRulesAsync();
    const [product] = await productsAsync();
    await saveRuleAsync({
      type: RULE_TYPE.PickupOnly,
      scopeA: { kind: 'product', id: product.id },
      messageText: 'This item can only be collected from an outlet.',
      storeId: 1,
    });
    assert.equal(await pickupOnlyAsync({ product, storeId: 1 }), true, 'the rule makes the item collection-only');

    const { sessionId } = await signedInAsync('pickup-rule');
    const added = await addAsync(sessionId, product.id);
    assert.equal(added.ok, true);
    const line = added.cart.items[0];
    const row = await repository('ShoppingCartItem').getByIdAsync(line.id);
    await repository('ShoppingCartItem').updateAsync({ ...row, fulfilment: 'delivery' });

    const warnings = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
    assert.ok(warnings.warnings.some((w) => w.key === 'Chk.PickupOnly'), 'delivery is refused for that line');
    const refused = await confirmAsync(sessionId);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Chk.PickupOnly');
    await removeRulesAsync();
  });

  test('AC-CHK-011-02-02', async () => {
    // "the item gets message Chk.CartRuleViolation with the rule text and the shopper may choose
    //  pickup or remove the item"
    await removeRulesAsync();
    const [product] = await productsAsync();
    await saveRuleAsync({
      type: RULE_TYPE.DeliveryConstraint,
      scopeA: { kind: 'product', id: product.id },
      areas: ['Lilongwe', 'Blantyre'],
      messageText: 'This item is not delivered to that area.',
      storeId: 1,
    });

    const { sessionId, customer } = await signedInAsync('area-rule');
    const added = await addAsync(sessionId, product.id);
    const row = await repository('ShoppingCartItem').getByIdAsync(added.cart.items[0].id);
    await repository('ShoppingCartItem').updateAsync({ ...row, deliverTo: 'Nsanje', fulfilment: 'delivery' });

    const warnings = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
    const violation = warnings.warnings.find((w) => w.key === 'Chk.CartRuleViolation');
    assert.ok(violation, 'the line is warned');
    assert.match(violation.message, /not delivered to that area/);
    assert.equal(violation.mayCollectInstead, true, 'and collection is offered instead');

    // choosing collection clears it
    await setLineFulfilmentAsync({
      shoppingCartItemId: row.id,
      method: FULFILMENT.Pickup,
      pickupPointId: (await repository('StorePickupPoint').getAllAsync())[0].id,
    });
    const after = await api.post('/api/checkout-area/validation/cart-warnings', {}, sessionId);
    assert.equal(after.warnings.some((w) => w.key === 'Chk.CartRuleViolation'), false);
    assert.ok(await getCartAsync({ sessionId, customer }));
    await removeRulesAsync();
  });

  test('AC-CHK-011-03-01', async () => {
    // "the placement override re-checks restrictions and refuses the order with message
    //  Pay.CheckoutRestricted"
    const restricted = new Set();
    registerProvider('IC-CHK-02', {
      area: 'PAY',
      feature: 'PRD-PAY-018',
      name: 'account restrictions',
      fn: async ({ customer }) => (customer && restricted.has(Number(customer.id))
        ? {
          ok: false, check: 'fraud signals', messageKey: 'Pay.CheckoutRestricted', message: 'We cannot take this order at the moment.',
        }
        : { ok: true }),
    });

    const { sessionId, customer } = await signedInAsync('restricted');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const beforeRestriction = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(beforeRestriction.ok, true, 'the checkout was fine when it started');

    // the restriction is set after checkout started
    restricted.add(Number(customer.id));
    const refused = await confirmAsync(sessionId);
    assert.equal(refused.ok, false, 'the placement re-checks and refuses');
    assert.equal(refused.messageKey, 'Pay.CheckoutRestricted');
    assert.equal(refused.paymentInitiated, false);
    restricted.clear();
  });

  test('AC-CHK-011-01-03', async () => {
    // "who, when and old and new values are audited (AUD-CHK-001)"
    await removeRulesAsync();
    const [product] = await productsAsync();
    const created = await api.post('/api/checkout-area/cart-rules', {
      type: RULE_TYPE.PickupOnly,
      scopeA: { kind: 'product', id: product.id },
      messageText: 'Collection only.',
    }, SESSIONS.admin);
    assert.equal(created.ok, true);

    const changed = await api.post('/api/checkout-area/cart-rules', {
      id: created.rule.id,
      type: RULE_TYPE.PickupOnly,
      scopeA: { kind: 'product', id: product.id },
      messageText: 'Collection only, at the counter.',
    }, SESSIONS.admin);
    assert.equal(changed.ok, true);
    const disabled = await api.post(`/api/checkout-area/cart-rules/${created.rule.id}/active`, { isActive: false }, SESSIONS.admin);
    assert.equal(disabled.ok, true);

    const trail = await auditTrailAsync({ event: 'AUD-CHK-001', entityId: created.rule.id });
    assert.ok(trail.length >= 3, 'every change is audited');
    assert.ok(trail.some((e) => e.before === null), 'the creation');
    const change = trail.find((e) => e.before?.messageText === 'Collection only.');
    assert.ok(change, 'the old value is kept');
    assert.equal(change.after.messageText, 'Collection only, at the counter.', 'beside the new one');
    assert.ok(trail.every((e) => e.actor), 'with who made it');
    assert.ok(trail.some((e) => e.after?.isActive === false), 'and the disabling');

    const denied = await api.post('/api/checkout-area/cart-rules', {
      type: RULE_TYPE.PickupOnly, scopeA: { kind: 'product', id: product.id }, messageText: 'x',
    }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Checkout.Core.Rules.CreateEditDelete');
    await removeRulesAsync();
  });
});

/* ====================================================== PRD-CHK-012 =================== */

describe('PRD-CHK-012 the code that collects the parcel', () => {
  test('AC-CHK-012-01-01', async () => {
    // "the shopper selects Order code or QR code; only enabled methods are offered"
    const both = await api.get('/api/checkout-area/pickup-code/methods', SESSIONS.buyer);
    assert.deepEqual(both.offered, [METHOD.Code, METHOD.QR], 'this client enabled both');
    assert.equal(both.choiceOffered, true);

    const onlyCode = await withSettingAsync('chk.pickup.identification', ['code'], async () => identificationMethodsAsync({ storeId: 1 }), 1);
    assert.deepEqual(onlyCode.offered, [METHOD.Code], 'only what the client enabled is offered');
    assert.equal(onlyCode.choiceOffered, false);

    const none = await withSettingAsync('chk.pickup.identification', [], async () => identificationMethodsAsync({ storeId: 1 }), 1);
    assert.deepEqual(none.offered, [], 'and nothing is assumed');
  });

  test('AC-CHK-012-01-02', async () => {
    // "a pickup code is generated (not guessable; stored as a hash), state Issued"
    const { sessionId } = await signedInAsync('issue-code');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id);
    const outlet = (await repository('StorePickupPoint').getAllAsync())[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: FULFILMENT.Pickup, pickupPointId: outlet.id,
    });

    const placed = await confirmAsync(sessionId, { pickupIdentification: METHOD.QR });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const order = placed.orders[0];
    assert.match(String(order.pickupCode), /^\d{6}$/, 'a six-figure code is given to the shopper');

    const row = await repository('PickupCode').getOneAsync((r) => r.orderNumber === order.orderNumber);
    assert.equal(row.status, CODE_STATE.Issued);
    assert.equal(row.method, METHOD.QR, 'in the way the shopper chose');
    assert.equal(row.codeHash.length, 64, 'only a hash is stored');
    assert.equal(row.codeHash.includes(String(order.pickupCode)), false, 'the code itself is not in the row');
    assert.equal(Number(row.pickupPointId), Number(outlet.id), 'bound to one outlet');

    const shown = await codeForOrderAsync({ orderNumber: order.orderNumber });
    assert.equal(shown.codeStored, 'hash only');
  });

  test('AC-CHK-012-01-03', async () => {
    // "the code or QR is sent by TRK-005 on the configured channels ... and the code is shown in
    //  My account order details; state Sent"
    const route = await api.get('/api/checkout-area/pickup-code/route', SESSIONS.buyer);
    assert.equal(route.route, 'native template token', 'by default the native ready-for-pickup message carries it');
    assert.equal(route.template, 'ShipmentReadyForPickup.CustomerNotification');

    const separate = await withSettingAsync('chk.pickup.separatemessage', true, async () => deliveryRouteAsync({ storeId: 1 }), 1);
    assert.equal(separate.route, 'event code', 'a client may turn on the separate message');
    assert.equal(separate.eventCode, 'Chk.PickupCode');

    const { sessionId } = await signedInAsync('send-code');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id);
    const outlet = (await repository('StorePickupPoint').getAllAsync())[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: FULFILMENT.Pickup, pickupPointId: outlet.id,
    });
    const placed = await confirmAsync(sessionId);
    const orderNumber = placed.orders[0].orderNumber;

    const sent = await api.post(`/api/checkout-area/orders/${orderNumber}/pickup-code/sent`, { channel: 'sms' }, SESSIONS.admin);
    assert.equal(sent.ok, true);
    assert.equal(sent.status, CODE_STATE.Sent, 'the code is marked as sent');

    const inAccount = await api.get(`/api/checkout-area/orders/${orderNumber}/pickup-code`, sessionId);
    assert.equal(inAccount.status, CODE_STATE.Sent, 'and My account shows where it stands');
    assert.equal(inAccount.outlet.id, outlet.id);
  });

  test('AC-CHK-012-02-01', async () => {
    // "CHK answers Valid; ... LOG-012 calls DeliverAsync once and then IC-CHK-09 MarkUsed, and
    //  the code becomes Used (AUD-CHK-004)"
    const { sessionId } = await signedInAsync('handover');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id);
    const outlet = (await repository('StorePickupPoint').getAllAsync())[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: FULFILMENT.Pickup, pickupPointId: outlet.id,
    });
    const placed = await confirmAsync(sessionId);
    const { orderNumber, pickupCode } = placed.orders[0];
    await markSentAsync({ orderNumber });

    const verdict = await verifyAsync({
      orderNumber, code: pickupCode, pickupPointId: outlet.id, verifiedBy: 'agent.lilongwe@example.com',
    });
    assert.equal(verdict.ok, true);
    assert.equal(verdict.verdict, 'Valid');

    const used = await markUsedAsync({ orderNumber, verifiedBy: 'agent.lilongwe@example.com' });
    assert.equal(used.status, CODE_STATE.Used);
    const row = await repository('PickupCode').getOneAsync((r) => r.orderNumber === orderNumber);
    assert.equal(row.verifiedBy, 'agent.lilongwe@example.com');
    assert.ok(row.usedOnUtc);

    const trail = await auditTrailAsync({ event: 'AUD-CHK-004', entityId: row.id });
    assert.ok(trail.some((e) => e.after?.status === CODE_STATE.Used), 'the hand-over is audited');
  });

  test('AC-CHK-012-02-02', async () => {
    // "CHK answers Invalid ... and adds one failed attempt; when the failures reach the limit the
    //  code becomes Locked and CHK answers Locked with message Chk.PickupCodeLocked"
    const { sessionId } = await signedInAsync('wrong-code');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id);
    const outlet = (await repository('StorePickupPoint').getAllAsync())[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: FULFILMENT.Pickup, pickupPointId: outlet.id,
    });
    const placed = await confirmAsync(sessionId);
    const { orderNumber } = placed.orders[0];
    await markSentAsync({ orderNumber });

    const limit = Number(await getSettingAsync('chk.pickup.failurelimit', 1, 3));
    assert.ok(limit >= 1, 'the client sets the limit');

    let last = null;
    for (let attempt = 1; attempt <= limit; attempt += 1) {
      last = await verifyAsync({ orderNumber, code: '000000', pickupPointId: outlet.id });
      if (attempt < limit) {
        assert.equal(last.verdict, 'Invalid', `attempt ${attempt} is wrong`);
        assert.equal(last.messageKey, 'Chk.PickupCodeInvalid');
        assert.equal(last.failedAttempts, attempt, 'and is counted');
      }
    }
    assert.equal(last.verdict, 'Locked', 'the limit locks the code');
    assert.equal(last.messageKey, 'Chk.PickupCodeLocked');
    assert.equal(last.message, "Too many wrong codes. Check the customer's identity before handing over.");

    // the right code no longer helps: staff must check identity
    const afterLock = await verifyAsync({ orderNumber, code: placed.orders[0].pickupCode, pickupPointId: outlet.id });
    assert.equal(afterLock.verdict, 'Locked');
    assert.equal(afterLock.ok, false, 'and nothing is handed over');
  });

  test('AC-CHK-012-02-03', async () => {
    // "CHK answers Used with message Chk.PickupCodeUsed and nothing is handed over"
    const { sessionId } = await signedInAsync('used-code');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id);
    const outlet = (await repository('StorePickupPoint').getAllAsync())[0];
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: FULFILMENT.Pickup, pickupPointId: outlet.id,
    });
    const placed = await confirmAsync(sessionId);
    const { orderNumber, pickupCode } = placed.orders[0];
    await markSentAsync({ orderNumber });
    await verifyAsync({ orderNumber, code: pickupCode, pickupPointId: outlet.id });
    await markUsedAsync({ orderNumber });

    const again = await verifyAsync({ orderNumber, code: pickupCode, pickupPointId: outlet.id });
    assert.equal(again.ok, false);
    assert.equal(again.verdict, 'Used');
    assert.equal(again.messageKey, 'Chk.PickupCodeUsed');
    assert.equal(again.message, 'This pickup code has already been used.');
  });

  test('AC-CHK-012-02-04', async () => {
    // "CHK answers Invalid with message Chk.PickupCodeInvalid (the code is bound to one outlet)"
    const { sessionId } = await signedInAsync('other-outlet');
    const [product] = await productsAsync();
    const added = await addAsync(sessionId, product.id);
    const outlets = await repository('StorePickupPoint').getAllAsync();
    await setLineFulfilmentAsync({
      shoppingCartItemId: added.cart.items[0].id, method: FULFILMENT.Pickup, pickupPointId: outlets[0].id,
    });
    const placed = await confirmAsync(sessionId);
    const { orderNumber, pickupCode } = placed.orders[0];
    await markSentAsync({ orderNumber });

    const elsewhere = await verifyAsync({ orderNumber, code: pickupCode, pickupPointId: outlets[1].id });
    assert.equal(elsewhere.ok, false, 'the right code at the wrong outlet is refused');
    assert.equal(elsewhere.verdict, 'Invalid');
    assert.equal(elsewhere.messageKey, 'Chk.PickupCodeInvalid');
    assert.equal(Number(elsewhere.boundToOutlet), Number(outlets[0].id), 'the code belongs to its own outlet');
    assert.equal(elsewhere.attemptCounted, false, 'and the shopper is not punished for it');

    const atItsOwn = await verifyAsync({ orderNumber, code: pickupCode, pickupPointId: outlets[0].id });
    assert.equal(atItsOwn.ok, true, 'while the right outlet accepts it');

    // a cancelled order revokes the code (SM-CHK-03)
    const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
    await revokeAsync({ order });
    const revoked = await verifyAsync({ orderNumber, code: pickupCode, pickupPointId: outlets[0].id });
    assert.equal(revoked.verdict, 'Invalid');
    assert.equal(revoked.revoked, true);
  });
});
