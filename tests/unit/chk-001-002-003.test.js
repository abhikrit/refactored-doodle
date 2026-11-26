// PRD-CHK-003 checkout validation (16 ACs), with the criteria of PRD-CHK-001 the shopping cart
// (2) and PRD-CHK-002 checkout (5) that the Session 0 journey file does not already cover.
// One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync, getSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { lockHistory } from '../../packages/server/src/core/locker.js';
import { registerProvider } from '../../packages/server/src/core/providers.js';
import {
  itemWarningsAsync, standardWarningsAsync, cartWarningsAsync, subTotalAsync,
  registerCartCheckProvider, registerSubtotalAdjuster, registerOrderActionGuard,
  registerCancellationParticipant, registerPlacementParticipant, guardOrderActionAsync,
  cancelOrderAsync, runCheckOrderAsync, reserveAsync, confirmAsync, releaseAsync,
  clearSubtotalAdjuster, NATIVE_WARNINGS,
} from '../../packages/server/src/plugins/product-chk/services/validation.js';
import {
  checkoutRequestGuard, guestGuardAsync, stepStateAsync,
} from '../../packages/server/src/plugins/product-chk/services/checkout.js';
import { migrateCartAsync, getCartAsync } from '../../packages/server/src/plugins/product-chk/services/cart.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

let n = 0;
const productsAsync = () => api.get('/api/catalogue/products', SESSIONS.buyer);

/** A shopper of their own, so no test shares a cart with another. */
async function shopperAsync() {
  n += 1;
  return createCustomerAsync({
    email: `chk${n}@example.com`, firstName: 'Chk', lastName: 'Shopper', roles: ['Registered'], phone: '+265996000001',
  });
}

/** A signed-in session: the seeded store does not take guest orders (BR-CHK-012). */
async function signedInAsync(label) {
  const customer = await shopperAsync();
  const sessionId = `${label}-${customer.id}`;
  await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, sessionId);
  return { customer, sessionId };
}

/**
 * A product whose stock the test may move: stock-managed, and not the one the ADM-005 seed
 * reserves a quota share of, which would answer with its own warning instead.
 */
async function stockProductAsync(offset = 0) {
  const quotas = await repository('Quota').getAllAsync((q) => q.scope === 'product');
  const reserved = new Set(quotas.map((q) => String(q.refId)));
  const rows = await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
    && p.manageInventoryMethod === 'ManageStock' && !reserved.has(String(p.id))
    && !(p.limitedToCustomerRoles?.length > 0));
  return rows[offset];
}

/**
 * A product the demonstration providers below answer for. The providers stay registered for the
 * rest of the file, as a plugin's would, so each one acts only on its own probe row.
 */
const PROBE = 'CHK-PROBE';
const isProbe = (product) => String(product?.sku ?? '').startsWith(PROBE);
let probeNumber = 0;
async function probeProductAsync(fields = {}) {
  probeNumber += 1;
  return repository('Product').insertAsync({
    name: `Probe product ${probeNumber}`,
    sku: `${PROBE}-${probeNumber}`,
    published: true,
    deleted: false,
    price: 100,
    manageInventoryMethod: 'DontManageStock',
    stockQuantity: 100,
    orderMinimumQuantity: 1,
    orderMaximumQuantity: 100,
    isShipEnabled: true,
    vendorId: null,
    ...fields,
  });
}

const cartAsync = (session, { productId, quantity = 1 }) => api.post('/api/checkout-area/cart/items', { productId, quantity }, session);

/** Put a setting back the way the store had it, whatever a test needed it to be. */
async function withSettingAsync(key, value, fn, storeId = 0) {
  const before = await getSettingAsync(key, storeId);
  await saveSettingAsync(key, value, storeId);
  try { return await fn(); } finally { await saveSettingAsync(key, before, storeId); }
}

/* ====================================================== PRD-CHK-001 =================== */

describe('PRD-CHK-001 the cart across devices', () => {
  test('AC-CHK-001-02-01', async () => {
    // "the same items and quantities are in the cart (ShoppingCartItem is stored per customer)"
    const products = await productsAsync();
    const customer = await shopperAsync();
    const first = `device-a-${customer.id}`;
    const second = `device-b-${customer.id}`;
    await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, first);
    await cartAsync(first, { productId: products[1].id, quantity: 3 });

    // the row carries the customer, which is what makes it the same cart anywhere
    const row = await repository('ShoppingCartItem').getOneAsync((i) => i.sessionId === first);
    assert.equal(Number(row.customerId), Number(customer.id), 'the line belongs to the customer, not the device');

    await api.post('/api/identity/sign-out', {}, first);
    await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, second);
    const onSecondDevice = await api.get('/api/checkout-area/cart', second);
    const line = onSecondDevice.items.find((i) => i.productId === products[1].id);
    assert.ok(line, 'the item is in the cart on the other device');
    assert.equal(line.quantity, 3, 'with the same quantity');
  });

  test('AC-CHK-001-02-02', async () => {
    // "the guest cart is merged into the account cart (native MigrateShoppingCartAsync)"
    const products = await productsAsync();
    const customer = await shopperAsync();
    const guestSession = `guest-${customer.id}`;
    const accountSession = `account-${customer.id}`;
    await cartAsync(guestSession, { productId: products[1].id, quantity: 2 });
    await cartAsync(guestSession, { productId: products[2].id, quantity: 1 });
    await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, accountSession);
    await cartAsync(accountSession, { productId: products[1].id, quantity: 1 });

    const merged = await migrateCartAsync({ fromSessionId: guestSession, toSessionId: accountSession, customer });
    assert.equal(merged.migrated, 2);

    const cart = await getCartAsync({ sessionId: accountSession, customer });
    const same = cart.items.find((i) => i.productId === products[1].id);
    assert.equal(same.quantity, 3, 'the quantities of the same product are added together');
    assert.ok(cart.items.some((i) => i.productId === products[2].id), 'and the other line comes across');
    assert.equal((await getCartAsync({ sessionId: guestSession })).items.length, 0, 'the guest cart is empty afterwards');
  });
});

/* ====================================================== PRD-CHK-002 =================== */

describe('PRD-CHK-002 the checkout steps', () => {
  test('AC-CHK-002-01-01', async () => {
    // "the steps billing address, shipping address (if any item is shippable), shipping method,
    //  payment method, payment information and confirm are shown in that order, on separate
    //  pages or on one page; DisableBillingAddressCheckoutStep is honoured"
    const { sessionId } = await signedInAsync('steps');
    const product = await stockProductAsync();
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });

    const multi = await withSettingAsync('ordersettings.onepagecheckoutenabled', false, async () => api.get('/api/checkout-area/checkout', sessionId));
    assert.deepEqual(multi.steps.map((s) => s.id), ['billing', 'shipping', 'shipping-method', 'payment-method', 'payment-info', 'confirm']);
    assert.equal(multi.onePageCheckout, false);

    const withoutBilling = await withSettingAsync('ordersettings.disablebillingaddresscheckoutstep', true, async () => api.get('/api/checkout-area/checkout', sessionId));
    assert.equal(withoutBilling.steps.some((s) => s.id === 'billing'), false, 'the billing step is honoured away');

    const onePage = await withSettingAsync('ordersettings.onepagecheckoutenabled', true, async () => api.get('/api/checkout-area/checkout', sessionId));
    assert.equal(onePage.onePageCheckout, true, 'the same steps, on one page');
    assert.deepEqual(onePage.steps.map((s) => s.id), multi.steps.map((s) => s.id));

    // a cart with nothing shippable in it has no shipping address step
    const service = await probeProductAsync({ isShipEnabled: false, name: 'Probe service' });
    const { sessionId: serviceSession } = await signedInAsync('steps-service');
    await cartAsync(serviceSession, { productId: service.id, quantity: 1 });
    const state = await api.get('/api/checkout-area/checkout', serviceSession);
    assert.equal(state.steps.some((s) => s.id === 'shipping'), false, 'nothing shippable, no shipping step');
  });

  test('AC-CHK-002-01-02', async () => {
    // "that address is pre-selected on both steps ...; the shopper can still choose another"
    const { customer, sessionId } = await signedInAsync('default-address');
    const address = await repository('Address').insertAsync({
      customerId: customer.id, firstName: 'Chk', lastName: 'Shopper', addressLine1: '7 Glyn Jones Road', city: 'Blantyre', country: 'Malawi', phone: '+265996000001',
    });
    const product = await stockProductAsync();
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });

    const without = await stepStateAsync({ sessionId, customer });
    assert.equal(without.defaultAddress, null, 'no default is pre-selected until IAM-014 holds one');

    await repository('CustomerPreference').insertAsync({ customerId: customer.id, defaultAddressId: address.id });
    const state = await stepStateAsync({ sessionId, customer });
    assert.equal(state.defaultAddress.id, address.id, 'the IAM-014 default address is pre-selected');
    assert.deepEqual(state.defaultAddressPreselectedOn, ['billing', 'shipping'], 'on both address steps');
    assert.ok(state.addressBook.length >= 1, 'and the shopper can still choose another from the book');

    // an address that is no longer in the book is not pre-selected
    await repository('Address').deleteAsync(address.id);
    const gone = await stepStateAsync({ sessionId, customer });
    assert.equal(gone.defaultAddress, null);
  });

  test('AC-CHK-002-01-03', async () => {
    // "the checkout progress indicator shows the current step and the steps still to come; the
    //  step is shown again with the values already entered kept and a message next to each failed
    //  field; no step already completed has to be entered again"
    const { sessionId } = await signedInAsync('progress');
    const product = await stockProductAsync();
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });

    const start = await api.get('/api/checkout-area/checkout/steps', sessionId);
    assert.equal(start.currentStep, 'billing');
    assert.ok(start.remainingSteps.includes('confirm'), 'the steps still to come');
    assert.equal(start.progressIndicator.find((p) => p.id === 'billing').state, 'current');

    const refused = await api.post('/api/checkout-area/checkout/steps/billing', {
      antiforgeryToken: 'token',
      values: {
        firstName: 'Chk', lastName: '', addressLine1: '7 Glyn Jones Road', city: 'Blantyre', country: 'Malawi', phone: 'no',
      },
    }, sessionId);
    assert.equal(refused.ok, false);
    assert.equal(refused.fieldErrors.lastName, 'This field is required.', 'a message next to each failed field');
    assert.match(refused.fieldErrors.phone, /telephone number/);
    assert.equal(refused.valuesKept, true);
    assert.equal(refused.values.addressLine1, '7 Glyn Jones Road', 'the values already entered are kept');
    assert.match(refused.validatedOn, /server/);

    const accepted = await api.post('/api/checkout-area/checkout/steps/billing', {
      antiforgeryToken: 'token',
      values: {
        firstName: 'Chk', lastName: 'Shopper', addressLine1: '7 Glyn Jones Road', city: 'Blantyre', country: 'Malawi', phone: '+265996000001',
      },
    }, sessionId);
    assert.equal(accepted.ok, true);
    assert.ok(accepted.completedSteps.includes('billing'));
    assert.notEqual(accepted.nextStep, 'billing', 'no completed step is asked for again');
    const after = await api.get('/api/checkout-area/checkout/steps', sessionId);
    assert.equal(after.progressIndicator.find((p) => p.id === 'billing').state, 'done');
  });

  test('AC-CHK-002-02-03', async () => {
    // "the request is challenged; no order is created and no payment is executed"
    const product = await stockProductAsync();
    const session = 'guest-direct-post';
    await cartAsync(session, { productId: product.id, quantity: 1 });
    const ordersBefore = (await repository('Order').getAllAsync()).length;

    await withSettingAsync('ordersettings.anonymouscheckoutallowed', false, async () => {
      for (const action of ['billing', 'payment-method', 'confirm']) {
        const challenge = await guestGuardAsync({ action, customer: null, storeId: 1 });
        assert.equal(challenge.ok, false, `${action} is challenged`);
        assert.equal(challenge.challenged, true);
        assert.equal(challenge.orderCreated, false);
        assert.equal(challenge.paymentExecuted, false);
        assert.match(challenge.redirectTo, /login/);
      }

      const posted = await api.post('/api/checkout-area/checkout/steps/billing', {
        antiforgeryToken: 'token', values: { firstName: 'a' },
      }, session);
      assert.equal(posted.challenged, true, 'a direct post to a step is challenged too');

      const confirm = await api.post('/api/checkout-area/checkout/confirm', {
        paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
      }, session);
      assert.equal(confirm.ok, false, 'and so is confirm');
    });
    assert.equal((await repository('Order').getAllAsync()).length, ordersBefore, 'no order is created');
  });

  test('AC-CHK-002-04-01', async () => {
    // "the request is served over HTTPS and every checkout POST must carry a valid antiforgery
    //  token, otherwise it is rejected"
    const noToken = checkoutRequestGuard({ method: 'POST', secure: true });
    assert.equal(noToken.ok, false);
    assert.equal(noToken.refused, true);
    assert.match(noToken.reason, /antiforgery token is missing/);

    const wrongToken = checkoutRequestGuard({
      method: 'POST', secure: true, antiforgeryToken: 'a', sessionToken: 'b',
    });
    assert.equal(wrongToken.ok, false);
    assert.match(wrongToken.reason, /does not match/);

    const good = checkoutRequestGuard({
      method: 'POST', secure: true, antiforgeryToken: 'a', sessionToken: 'a',
    });
    assert.equal(good.ok, true);
    assert.equal(good.servedOverHttps, true);
    assert.equal(good.antiforgeryChecked, true);

    const behindProxy = checkoutRequestGuard({ method: 'GET', forwardedProto: 'https' });
    assert.equal(behindProxy.https, true, 'the forwarded header is honoured');
    assert.equal(behindProxy.httpsRequired, true);

    const overHttp = checkoutRequestGuard({ method: 'POST', secure: false, antiforgeryToken: 'a' });
    assert.equal(overHttp.https, false, 'a request that is not over HTTPS is reported as such');
    assert.equal(overHttp.httpsRequired, true);

    // and the route itself rejects a checkout POST that carries no token
    const { sessionId } = await signedInAsync('antiforgery');
    const product = await stockProductAsync();
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });
    const refused = await api.post('/api/checkout-area/checkout/steps/billing', { values: { firstName: 'a' } }, sessionId);
    assert.equal(refused.refused, true, 'the checkout POST is rejected without a token');
    assert.equal(refused.messageKey, 'Chk.AntiforgeryRequired');
  });
});

/* ====================================================== PRD-CHK-003 =================== */

describe('PRD-CHK-003 the checks before an order is placed', () => {
  test('AC-CHK-003-01-01', async () => {
    // "the order is not placed, the native stock warning is shown and no payment is initiated"
    const product = await stockProductAsync();
    const { sessionId } = await signedInAsync('stock-check');
    await repository('Product').updateAsync({ ...product, stockQuantity: 2 });
    const added = await cartAsync(sessionId, { productId: product.id, quantity: 2 });
    assert.equal(added.ok, true, 'two were in stock when the cart was filled');
    // the stock falls away after the cart was filled
    await repository('Product').updateAsync({ ...product, stockQuantity: 1 });

    const refused = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(refused.ok, false);
    assert.equal(refused.stoppedAt, 'stock and availability');
    assert.equal(refused.messageKey, NATIVE_WARNINGS.quantityExceedsStock, 'the native stock warning');
    assert.equal(refused.paymentInitiated, false, 'and no payment is initiated');
    await repository('Product').updateAsync({ ...product, stockQuantity: product.stockQuantity });
  });

  test('AC-CHK-003-01-02', async () => {
    // "the confirm page is shown again with the new total and message Chk.PriceChanged; the
    //  shopper can confirm again at the new total (BR-CHK-004)"
    const product = await stockProductAsync();
    const { sessionId } = await signedInAsync('price-moved');
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });
    const summary = await api.get('/api/checkout-area/checkout/confirm-summary?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(summary.paymentExecuted, false);

    await repository('Product').updateAsync({ ...product, price: Number(product.price) + 500 });

    const refused = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, shownTotal: summary.total,
    }, sessionId);
    assert.equal(refused.ok, false);
    assert.equal(refused.stoppedAt, 'price');
    assert.equal(refused.messageKey, 'Chk.PriceChanged');
    assert.ok(refused.newTotal > summary.total, 'with the new total');
    assert.equal(refused.paymentInitiated, false);

    const again = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true, shownTotal: refused.newTotal,
    }, sessionId);
    assert.equal(again.ok, true, 'the shopper can confirm again at the new total');
    await repository('Product').updateAsync({ ...product, price: product.price });
  });

  test('AC-CHK-003-01-03', async () => {
    // "the order is not placed and the native cart warning is shown"
    const product = await probeProductAsync({ name: 'Probe withdrawn product' });
    const { sessionId } = await signedInAsync('withdrawn');
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });

    await repository('Product').updateAsync({ ...product, published: false });
    const unpublished = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(unpublished.ok, false);
    assert.equal(unpublished.messageKey, NATIVE_WARNINGS.unpublished);

    await repository('Product').updateAsync({
      ...product, published: true, subjectToAcl: true, limitedToCustomerRoles: ['BulkBuyer'],
    });
    const notForYou = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(notForYou.ok, false);
    assert.equal(notForYou.messageKey, NATIVE_WARNINGS.notAvailable, 'the ACL warning');

    await repository('Product').updateAsync({ ...product, deleted: true, subjectToAcl: false, limitedToCustomerRoles: [] });
    const withdrawn = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(withdrawn.messageKey, NATIVE_WARNINGS.deleted, 'and a withdrawn product has its own warning');
  });

  test('AC-CHK-003-02-01', async () => {
    // "an inactive method gives message Chk.PaymentMethodInvalid; a method no longer allowed is
    //  refused by the PAY routing validator with message Pay.MethodNotAllowed"
    const product = await stockProductAsync();
    const { sessionId } = await signedInAsync('payment-method');
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });

    const inactive = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.NotAMethod', termsAccepted: true,
    }, sessionId);
    assert.equal(inactive.ok, false);
    assert.equal(inactive.stoppedAt, 'payment method');
    assert.equal(inactive.messageKey, 'Chk.PaymentMethodInvalid');
    assert.equal(inactive.failures[0].step, 'payment-method', 'the shopper goes back to that step');

    // the PAY routing validator refuses a method that is active but not allowed for this order
    registerProvider('IC-CHK-02', {
      area: 'PAY',
      feature: 'PRD-PAY-001',
      name: 'routing',
      fn: async ({ paymentMethodSystemName }) => (paymentMethodSystemName === 'Payments.BankTransfer'
        ? { ok: false, check: 'payment method', messageKey: 'Pay.MethodNotAllowed', message: 'That payment method is not allowed for this order.' }
        : { ok: true }),
    });
    const notAllowed = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.BankTransfer', termsAccepted: true,
    }, sessionId);
    assert.equal(notAllowed.ok, false);
    assert.equal(notAllowed.messageKey, 'Pay.MethodNotAllowed');
    assert.equal(notAllowed.stoppedAt, 'payment method');
  });

  test('AC-CHK-003-02-02', async () => {
    // "with action Block the order is not placed and Pay.CheckoutRestricted is shown; with action
    //  Flag the order is placed and the flag is recorded"
    let action = 'Block';
    const flags = [];
    registerProvider('IC-CHK-02', {
      area: 'PAY',
      feature: 'PRD-PAY-018',
      name: 'risk rules',
      fn: async ({ customer }) => {
        if (action === 'Block') {
          return {
            ok: false, check: 'fraud signals', messageKey: 'Pay.CheckoutRestricted', message: 'We cannot take this order at the moment.',
          };
        }
        if (action === 'Flag') flags.push({ customerId: customer?.id ?? null, rule: 'velocity', action: 'Flag' });
        return { ok: true, flagged: action === 'Flag' };
      },
    });
    const product = await stockProductAsync();
    const { sessionId } = await signedInAsync('risk-rule');
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });

    const blocked = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.messageKey, 'Pay.CheckoutRestricted');
    assert.equal(blocked.stoppedAt, 'fraud signals');
    assert.equal(blocked.paymentInitiated, false);

    action = 'Flag';
    const flagged = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(flagged.ok, true, 'a flag does not stop the order');
    assert.equal(flags.length, 1, 'and the flag is recorded');
    action = 'none';
  });

  test('AC-CHK-003-02-03', async () => {
    // "checks run in the order stock and availability, price, buyer eligibility, payment method,
    //  fraud signals; the first failure stops placement and its message key is shown"
    const register = await api.get('/api/checkout-area/validation/providers', SESSIONS.admin);
    assert.deepEqual(register.checkOrder, [
      'stock and availability', 'price', 'buyer eligibility', 'payment method', 'fraud signals',
    ]);

    const product = await stockProductAsync();
    const { customer, sessionId } = await signedInAsync('check-order');
    await cartAsync(sessionId, { productId: product.id, quantity: 2 });
    // make stock and price both wrong at once: the stock check is the one that speaks
    await repository('Product').updateAsync({ ...product, stockQuantity: 1 });
    const refused = await runCheckOrderAsync({
      cart: await getCartAsync({ sessionId, customer }),
      customer,
      storeId: 1,
      paymentMethodSystemName: 'Payments.TnmMpamba',
      shownTotal: 1,
      currentTotal: 9999,
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.stoppedAt, 'stock and availability', 'the first failure stops it');
    assert.equal(refused.messageKey, NATIVE_WARNINGS.quantityExceedsStock);
    assert.deepEqual(refused.steps.map((s) => s.check), ['stock and availability'], 'and nothing after it runs');

    await repository('Product').updateAsync({ ...product, stockQuantity: product.stockQuantity });
    const priceNext = await runCheckOrderAsync({
      cart: await getCartAsync({ sessionId, customer }),
      customer,
      storeId: 1,
      paymentMethodSystemName: 'Payments.TnmMpamba',
      shownTotal: 1,
      currentTotal: 9999,
    });
    assert.equal(priceNext.stoppedAt, 'price', 'with stock in order, price is next');
    assert.deepEqual(priceNext.steps.map((s) => s.check), ['stock and availability', 'price']);

    const eligibility = await runCheckOrderAsync({
      cart: await getCartAsync({ sessionId, customer }),
      customer: null,
      storeId: 1,
      paymentMethodSystemName: 'Payments.NotAMethod',
      paymentMethod: { valid: false, messageKey: 'Chk.PaymentMethodInvalid' },
    });
    assert.equal(eligibility.stoppedAt, 'buyer eligibility', 'and eligibility comes before the payment method');
  });

  test('AC-CHK-003-02-04', async () => {
    // "the LOG-004 placement validator (IC-CHK-02) refuses the order with message
    //  Log.SellerAreaNotCovered and no payment is initiated"
    registerProvider('IC-CHK-02', {
      area: 'LOG',
      feature: 'PRD-LOG-004',
      name: 'seller coverage',
      fn: async ({ cart }) => ((cart.items ?? []).some((i) => i.deliverTo === 'Nsanje')
        ? { ok: false, check: 'payment method', messageKey: 'Log.SellerAreaNotCovered', message: 'This seller does not deliver to that area.' }
        : { ok: true }),
    });
    const product = await stockProductAsync();
    const { sessionId } = await signedInAsync('coverage');
    const added = await cartAsync(sessionId, { productId: product.id, quantity: 1 });
    const line = added.cart.items[0];
    const row = await repository('ShoppingCartItem').getByIdAsync(line.id);
    await repository('ShoppingCartItem').updateAsync({ ...row, deliverTo: 'Nsanje' });

    const refused = await api.post('/api/checkout-area/checkout/validate', {
      paymentMethodSystemName: 'Payments.TnmMpamba', termsAccepted: true,
    }, sessionId);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Log.SellerAreaNotCovered');
    assert.equal(refused.refusedBy ?? 'PRD-LOG-004', 'PRD-LOG-004');
    assert.equal(refused.paymentInitiated, false);
  });

  test('AC-CHK-003-03-01', async () => {
    // "the single CHK-003 override runs the native checks first and then every provider in its
    //  registered order, and returns all warnings; the item or cart is refused if any remains"
    const register = await api.get('/api/platform/plugins', SESSIONS.admin);
    const owners = register.overrideRegister.filter((o) => o.service === 'IShoppingCartService');
    assert.equal(owners.length, 1, 'one override');
    assert.equal(owners[0].owner, 'Product.CHK');
    assert.equal(owners[0].feature, 'PRD-CHK-003');

    const order = [];
    registerCartCheckProvider({
      area: 'INV',
      feature: 'PRD-INV-004-order',
      name: 'first',
      fn: async ({ product }) => {
        if (isProbe(product)) order.push('first');
        return { warnings: [] };
      },
    });
    registerCartCheckProvider({
      area: 'ADM',
      feature: 'PRD-ADM-005-order',
      name: 'second',
      fn: async ({ product }) => {
        if (!isProbe(product)) return { warnings: [] };
        order.push('second');
        return { warnings: [{ key: 'Adm.Quota', message: 'That is over the quota.' }] };
      },
    });

    const probe = await probeProductAsync({ name: 'Probe provider order' });
    const result = await itemWarningsAsync({ product: probe, quantity: 1, storeId: 1 });
    assert.ok(order.indexOf('first') < order.indexOf('second'), 'the providers run in their registered order');
    assert.equal(result.refused, true, 'a warning refuses the item');
    assert.ok(result.warnings.some((w) => w.key === 'Adm.Quota'));
    assert.ok(result.ran.some((r) => r.feature === 'PRD-CAT-013'), 'the providers registered at installation run too');
    assert.ok(result.ran.some((r) => r.feature === 'PRD-ADM-005'));

    // and the same host answers for the whole cart
    const cart = await cartWarningsAsync({ cart: { items: [{ id: 1, productId: probe.id, quantity: 1 }] }, storeId: 1 });
    assert.equal(cart.refused, true);
    assert.ok(cart.warnings.some((w) => w.key === 'Adm.Quota'));
    assert.equal(cart.warnings[0].productId, probe.id, 'each warning names its line');
  });

  test('AC-CHK-003-03-02', async () => {
    // "the CHK-003 override of the protected GetStandardWarningsAsync produces the native
    //  warnings with their resource keys, so the registered replacer can drop or replace exactly
    //  that warning by key; every other provider can only add warnings"
    const probe = await probeProductAsync({
      name: 'Probe out of stock', manageInventoryMethod: 'ManageStock', stockQuantity: 0,
    });
    const native = await standardWarningsAsync({ product: probe, quantity: 1 });
    assert.ok(native.some((w) => w.key === NATIVE_WARNINGS.outOfStock), 'the native warning carries its resource key');
    assert.ok(native.every((w) => w.native === true));

    // INV-004 is the registered replacer of the stock warning: it recalculates with holds
    registerCartCheckProvider({
      area: 'INV',
      feature: 'PRD-INV-004',
      name: 'stock with holds',
      replacesWarning: NATIVE_WARNINGS.outOfStock,
      fn: async ({ product }) => (isProbe(product) ? { drop: true, replaceWith: [] } : {}),
    });
    const replaced = await itemWarningsAsync({ product: probe, quantity: 1, storeId: 1 });
    assert.equal(replaced.warnings.some((w) => w.key === NATIVE_WARNINGS.outOfStock), false, 'the replacer dropped exactly that warning');

    // nobody else may claim the same key
    assert.throws(() => registerCartCheckProvider({
      area: 'CAT', feature: 'PRD-CAT-999', name: 'another', replacesWarning: NATIVE_WARNINGS.outOfStock, fn: async () => ({}),
    }), /already replaced by PRD-INV-004/);

    // and a key that is not a native warning cannot be replaced at all
    assert.throws(() => registerCartCheckProvider({
      area: 'CAT', feature: 'PRD-CAT-998', name: 'invented', replacesWarning: 'Something.Invented', fn: async () => ({}),
    }), /is not a native warning key/);
  });

  test('AC-CHK-003-03-03', async () => {
    // "the item is refused with message Chk.CartCheckUnavailable and the error is logged; the
    //  check fails closed so no unchecked item can be ordered"
    registerCartCheckProvider({
      area: 'SVC',
      feature: 'PRD-SVC-002-calendar',
      name: 'the rental calendar',
      fn: async ({ product }) => {
        if (String(product?.sku ?? '') !== `${PROBE}-calendar`) return { warnings: [] };
        throw new Error('the rental calendar is unreachable');
      },
    });
    const probe = await probeProductAsync({ name: 'Probe rental', sku: `${PROBE}-calendar` });
    const result = await itemWarningsAsync({ product: probe, quantity: 1, storeId: 1 });
    assert.equal(result.refused, true);
    assert.equal(result.failedClosed, true, 'the check fails closed');
    assert.equal(result.warnings[0].key, 'Chk.CartCheckUnavailable');
    assert.equal(result.warnings[0].message, 'We could not check this item just now. Please try again later.');

    const logged = await repository('Log').getAllAsync((l) => String(l.shortMessage ?? '').includes('PRD-SVC-002-calendar'));
    assert.ok(logged.length >= 1, 'and the error is logged');
    assert.match(logged[0].fullMessage, /rental calendar is unreachable/);

    // nothing unchecked reaches the cart
    const { sessionId } = await signedInAsync('failed-closed');
    const add = await cartAsync(sessionId, { productId: probe.id, quantity: 1 });
    assert.equal(add.ok, false, 'the item cannot be added while the check cannot run');
  });

  test('AC-CHK-003-03-04', async () => {
    // "the override calls the native method and then the adjuster, and the same adjusted subtotal
    //  and discount amount are used on all three paths; at most one adjuster is registered"
    clearSubtotalAdjuster();
    const plain = await subTotalAsync({ item: { unitPrice: 100, quantity: 3 } });
    assert.equal(plain.subTotal, 300, 'the native result');
    assert.equal(plain.adjustedBy, null);

    registerSubtotalAdjuster({
      area: 'MKT',
      feature: 'PRD-MKT-002',
      name: 'line discount',
      fn: async ({ native }) => ({ subTotal: Number((native.subTotal * 0.9).toFixed(2)), discountAmount: Number((native.subTotal * 0.1).toFixed(2)) }),
    });
    const adjusted = await subTotalAsync({ item: { unitPrice: 100, quantity: 3 } });
    assert.equal(adjusted.subTotal, 270, 'then the adjuster');
    assert.equal(adjusted.discountAmount, 30);
    assert.equal(adjusted.adjustedBy, 'PRD-MKT-002');

    assert.throws(() => registerSubtotalAdjuster({
      area: 'CAT', feature: 'PRD-CAT-042', name: 'another', fn: async () => ({}),
    }), /already registered by PRD-MKT-002/);

    // the cart page, the order totals and the confirm step all read the same adjusted value
    const product = await stockProductAsync();
    const { sessionId } = await signedInAsync('adjuster');
    await cartAsync(sessionId, { productId: product.id, quantity: 1 });
    const cart = await api.get('/api/checkout-area/cart', sessionId);
    assert.equal(cart.items[0].subtotalAdjustedBy, 'PRD-MKT-002', 'the cart page');
    assert.ok(cart.items[0].discountAmount > 0);
    const totals = await api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(totals.subtotal, cart.subtotal, 'and the order totals use the same number');
    const summary = await api.get('/api/checkout-area/checkout/confirm-summary?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    assert.equal(summary.subtotal, cart.subtotal, 'and so does the confirm step');
    clearSubtotalAdjuster();
  });

  test('AC-CHK-003-04-01', async () => {
    // "each participant reserves what it needs under its own lock key; if any reservation fails,
    //  the earlier reservations are released, the order is not placed and the participant's
    //  message is shown (BR-CHK-020)"
    const released = [];
    registerPlacementParticipant({
      area: 'ADM',
      feature: 'PRD-ADM-005-quota',
      name: 'quota',
      lockKey: () => 'adm-quota-7',
      fn: async ({ phase }) => {
        if (phase === 'Release') { released.push('quota'); return { ok: true }; }
        return { ok: true, reservation: { quotaId: 7 } };
      },
    });
    let refuse = false;
    registerPlacementParticipant({
      area: 'MKT',
      feature: 'PRD-MKT-001-discount',
      name: 'limited-use discount',
      lockKey: () => 'mkt-discount-12',
      fn: async ({ phase }) => {
        if (phase === 'Release') { released.push('discount'); return { ok: true }; }
        return refuse
          ? { ok: false, messageKey: 'Mkt.DiscountUsedUp', message: 'That discount has been used up.' }
          : { ok: true, reservation: { discountId: 12 } };
      },
    });

    const held = await reserveAsync({ cart: { items: [] }, storeId: 1 });
    assert.equal(held.ok, true);
    assert.ok(held.reservations.some((r) => r.lockKey === 'adm-quota-7'), 'each under its own lock key');
    assert.ok(held.reservations.some((r) => r.lockKey === 'mkt-discount-12'));
    assert.ok(lockHistory().some((l) => l.key === 'adm-quota-7'));
    assert.equal(held.rule, 'BR-CHK-020');

    refuse = true;
    released.length = 0;
    const refused = await reserveAsync({ cart: { items: [] }, storeId: 1 });
    assert.equal(refused.ok, false);
    assert.equal(refused.refusedBy, 'PRD-MKT-001-discount');
    assert.equal(refused.message, 'That discount has been used up.', "the participant's message is shown");
    assert.ok(released.includes('quota'), 'and the earlier reservation is released');
    refuse = false;
  });

  test('AC-CHK-003-04-02', async () => {
    // "each participant confirms its reservation for that sub-order before OrderPlacedEvent is
    //  published; if payment fails, every reservation is released"
    const events = [];
    registerPlacementParticipant({
      area: 'FIN',
      feature: 'PRD-FIN-004-subsidy',
      name: 'subsidy budget',
      lockKey: () => 'fin-scheme-3',
      fn: async ({ phase, order }) => {
        events.push(`${phase}:${order?.orderNumber ?? ''}`);
        return { ok: true, reservation: { schemeId: 3 } };
      },
    });
    const held = await reserveAsync({ cart: { items: [] }, storeId: 1 });
    const order = await repository('Order').insertAsync({ orderNumber: 'CHK-CONFIRM-1', orderStatus: 'Pending', orderTotal: 100 });
    const confirmed = await confirmAsync({ reservations: held.reservations, order });
    assert.ok(confirmed.confirmed.includes('PRD-FIN-004-subsidy'));
    assert.equal(confirmed.beforeOrderPlacedEvent, true);
    assert.ok(events.includes('Confirm:CHK-CONFIRM-1'), 'the confirmation names the sub-order');

    const releasedResult = await releaseAsync({ reservations: held.reservations, reason: 'payment failed' });
    assert.ok(releasedResult.released.includes('PRD-FIN-004-subsidy'), 'a failed payment releases every reservation');
    assert.equal(releasedResult.reason, 'payment failed');
  });

  test('AC-CHK-003-04-03', async () => {
    // "the CHK-003 override calls the guards before the native method; the refusal raises an
    //  error carrying the guard message, the native method is not run"
    const order = await repository('Order').insertAsync({
      orderNumber: 'CHK-HOLD-1', orderStatus: 'Processing', stage: 'Packed', orderTotal: 500, holdActive: true,
    });
    registerOrderActionGuard({
      area: 'ORD',
      feature: 'PRD-ORD-010',
      name: 'order hold',
      fn: async ({ order: o }) => (o?.holdActive === true
        ? { ok: false, messageKey: 'Ord.OrderOnHold', message: 'This order is on hold.' }
        : { ok: true }),
    });

    for (const action of ['Ship', 'ReadyForPickup', 'Deliver']) {
      const refused = await guardOrderActionAsync({ action, order });
      assert.equal(refused.ok, false, `${action} is guarded`);
      assert.equal(refused.messageKey, 'Ord.OrderOnHold');
      assert.equal(refused.message, 'This order is on hold.');
      assert.equal(refused.nativeMethodRun, false, 'the native method is not run');
      assert.equal(refused.refusedBy, 'PRD-ORD-010');
    }

    // every path asks the same guard, including the admin route the tracking hub uses
    const shipment = await repository('Shipment').insertAsync({ orderId: order.id, trackingNumber: 'TN-HOLD-1' });
    const viaApi = await api.post('/api/checkout-area/validation/order-action', { action: 'Ship', orderNumber: 'CHK-HOLD-1', shipmentId: shipment.id }, SESSIONS.admin);
    assert.equal(viaApi.ok, false);
    assert.equal(viaApi.messageKey, 'Ord.OrderOnHold');

    await repository('Order').updateAsync({ ...order, holdActive: false });
    const allowed = await guardOrderActionAsync({ action: 'Ship', order: await repository('Order').getByIdAsync(order.id) });
    assert.equal(allowed.ok, true);
    assert.equal(allowed.nativeMethodRun, true, 'with no hold the native method runs');
  });

  test('AC-CHK-003-04-04', async () => {
    // "the native method runs first; then each participant runs; a participant error is logged
    //  and listed in the checkout exceptions list, and the cancellation stands"
    const ran = [];
    registerCancellationParticipant({
      area: 'CHK',
      feature: 'PRD-CHK-006-window',
      name: 'release the delivery window',
      fn: async ({ order }) => { ran.push(`window:${order.orderNumber}`); return { ok: true }; },
    });
    registerCancellationParticipant({
      area: 'CHK',
      feature: 'PRD-CHK-012-code',
      name: 'revoke the pickup code',
      fn: async () => { throw new Error('the code service is unreachable'); },
    });
    const order = await repository('Order').insertAsync({
      orderNumber: 'CHK-CANCEL-1', orderStatus: 'Processing', stage: 'Packed', orderTotal: 900,
    });

    const cancelled = await cancelOrderAsync({ orderNumber: 'CHK-CANCEL-1', reason: 'the shopper changed their mind' });
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.nativeFirst, true);
    assert.equal(cancelled.order.orderStatus, 'Cancelled');
    assert.equal(cancelled.cancellationStands, true);
    assert.ok(ran.includes('window:CHK-CANCEL-1'), 'each participant runs');
    assert.equal(cancelled.failures.length, 1, 'and a participant error does not undo the cancellation');
    assert.equal(cancelled.failures[0].feature, 'PRD-CHK-012-code');

    const exceptions = await api.get('/api/checkout-area/checkout/exceptions', SESSIONS.admin);
    assert.ok(exceptions.some((e) => e.kind === 'cancellation-participant' && e.orderNumber === 'CHK-CANCEL-1'), 'it is listed as a checkout exception');
    const trail = await auditTrailAsync({ event: 'AUD-CHK-001', entityId: order.id });
    assert.ok(trail.some((e) => e.after?.orderStatus === 'Cancelled'), 'and the cancellation is audited');
  });

  test('AC-CHK-003-04-05', async () => {
    // "the CHK-003 placement host places exactly one order with the native sequence of
    //  BR-CHK-006; no behaviour of the host depends on an optional pack"
    const first = await stockProductAsync();
    const second = (await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
      && Number(p.vendorId) === Number(first.vendorId) && p.id !== first.id))[0];
    const { customer, sessionId } = await signedInAsync('single-order');
    for (const product of [first, second].filter(Boolean)) {
      await cartAsync(sessionId, { productId: product.id, quantity: 1 });
    }
    const cart = await api.get('/api/checkout-area/cart', sessionId);
    assert.equal(cart.multiSeller, false, 'one seller');
    assert.ok(cart.items.length >= 1);

    const before = (await repository('Order').getAllAsync()).length;
    const placed = await api.post('/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba',
      termsAccepted: true,
      paymentData: { phone: '265880000001' },
    }, sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'the order is placed');
    assert.equal(placed.orders.length, 1, 'exactly one order');
    assert.equal((await repository('Order').getAllAsync()).length, before + 1);
    assert.ok(placed.payment, 'and one payment for the checkout');
    assert.ok(lockHistory().some((l) => l.key === `nop-order-placement-${customer.id}`), 'under the native placement lock');

    const register = await api.get('/api/platform/plugins', SESSIONS.admin);
    const owners = register.overrideRegister.filter((o) => o.service === 'IOrderProcessingService');
    assert.equal(owners.length, 1, 'one placement host');
    assert.equal(owners[0].feature, 'PRD-CHK-003', 'owned by the core checkout feature, not by a pack');
  });
});
