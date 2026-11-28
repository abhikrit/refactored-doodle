// PRD-PAY-024 payment connector SDK (7 ACs), PRD-PAY-001 payment method framework and routing
// (10), PRD-PAY-011 payment status lifecycle (15) and PRD-PAY-012 payment idempotency (4).
// One test per AC, named by AC ID.
//
// These four features are the spine of the module: the contract every rail implements, which
// rails are offered where, the transaction state model SM-PAY-01 with its mapping to the native
// order PaymentStatus, and the guarantee that a retry never charges twice.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import {
  getSettingAsync, saveSettingAsync, allSettingsAsync, deleteSettingAsync,
} from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { validatePack, isDeclaredSecretKey } from '../../packages/server/src/core/pack-loader.js';
import { resource } from '../../packages/server/src/core/messages.js';
import {
  connectorsRegistered, connectorFor, payoutConnectors, checkoutConnectors, callAsync,
  verifyCallbackAsync, saveCredentialAsync, credentialAsync, secretKeyNamesFor, providerCallAsync,
  OPERATIONS, RECURRING_TYPE, METHOD_TYPE, idempotencyKeyFor,
} from '../../packages/server/src/plugins/product-pay/services/connector.js';
import {
  methodsForCheckoutAsync, saveRuleAsync, setRuleActiveAsync, setMethodActiveAsync, rulesAsync,
  locationTypeAsync, methodAdminListAsync, evaluateMethodAsync, supportContactAsync,
  RULE_DIMENSION, RULE_OPERATOR,
} from '../../packages/server/src/plugins/product-pay/services/routing.js';
import {
  beginAttemptAsync, groupPaymentAsync, applyCallbackAsync, transitionAsync, retryAsync,
  retryAllowedAsync, paymentStatusAsync, linkSubOrderAsync, unlinkedSharesAsync,
  hasSuccessfulOrAuthorizedTransactionAsync, postProcessPaymentAsync, attemptsForOrderAsync,
  nativeMappingFor, transitionFor, TX, SM_PAY_01, payCheckoutLockKey,
} from '../../packages/server/src/plugins/product-pay/services/transactions.js';
import { markOrderAsPaidAsync, payOrderLockKey } from '../../packages/server/src/plugins/product-chk/services/order-processing.js';
import {
  placementIntervalGuardAsync, clearPlacementInterval, markPlacement, orderGuidForAsync,
  placementLockCount, checkoutNodeReadinessAsync,
} from '../../packages/server/src/plugins/product-chk/services/resilience.js';
import { cancelOrderAsync } from '../../packages/server/src/plugins/product-chk/services/validation.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const ROOT = process.cwd();
const MOBILE = 'Payments.TnmMpamba';
const CARD = 'Payments.Card';
const OFFLINE = 'Payments.CashAtOutlet';
const BANK = 'Payments.BankTransfer';
const REDIRECT = 'Payments.PayPalStandard';

let n = 0;
async function signedInAsync(label) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `pay-${n}@example.com`, firstName: 'Pay', lastName: 'Shopper', roles: ['Registered'], phone: '+265996000011',
  });
  const sessionId = `${label}-${customer.id}`;
  await api.post('/api/identity/sign-in', { email: customer.email, password: 'demo' }, sessionId);
  clearPlacementInterval(customer.id);
  return { customer, sessionId };
}

/** Products of two different sellers, so a cart can be split. */
async function sellerProductsAsync() {
  const quotas = await repository('Quota').getAllAsync((q) => q.scope === 'product');
  const reserved = new Set(quotas.map((q) => String(q.refId)));
  const rows = await repository('Product').getAllAsync((p) => p.published === true && !p.deleted
    && p.isShipEnabled !== false && p.vendorId && !reserved.has(String(p.id))
    && !(p.limitedToCustomerRoles?.length > 0));
  const byVendor = new Map();
  for (const row of rows) {
    if (!byVendor.has(Number(row.vendorId))) byVendor.set(Number(row.vendorId), row);
  }
  return [...byVendor.values()];
}

const addAsync = (session, productId, quantity = 1) => api.post('/api/checkout-area/cart/items', { productId, quantity }, session);

const confirmAsync = (session, extra = {}) => api.post('/api/checkout-area/checkout/confirm', {
  paymentMethodSystemName: MOBILE, termsAccepted: true, paymentData: { phone: '265880000001' }, ...extra,
}, session);

/** A split checkout paid once, for the group-payment criteria. */
async function splitCheckoutAsync(label, systemName = MOBILE) {
  const [first, second] = await sellerProductsAsync();
  const { sessionId, customer } = await signedInAsync(label);
  await addAsync(sessionId, first.id);
  await addAsync(sessionId, second.id);
  const totals = await api.get(`/api/checkout-area/checkout/totals?paymentMethodSystemName=${systemName}`, sessionId);
  const placed = await confirmAsync(sessionId, { paymentMethodSystemName: systemName });
  assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? placed.paymentError ?? 'placed');
  const transaction = await repository('PaymentTransaction')
    .getOneAsync((t) => t.checkoutReference === placed.checkoutReference);
  return {
    placed, totals, transaction, sessionId, customer,
  };
}

async function withSettingAsync(key, value, fn, storeId = 1) {
  const before = await getSettingAsync(key, storeId);
  await saveSettingAsync(key, value, storeId);
  try { return await fn(); } finally {
    if (before === undefined) await deleteSettingAsync(key, storeId);
    else await saveSettingAsync(key, before, storeId);
  }
}

async function withRuleAsync(rule, fn) {
  const saved = await saveRuleAsync({ storeId: 1, ...rule });
  try { return await fn(saved.rule); } finally {
    await repository('PaymentRoutingRule').deleteAsync(saved.rule.id);
  }
}

/* ==================================================== PRD-PAY-024 the connector SDK ==== */

describe('PRD-PAY-024 one plug every provider connects to', () => {
  test('AC-PAY-024-01-01', async () => {
    // "it declares its PaymentMethodType and a capability flag for each of InitiatePayment,
    //  HandleCallback, QueryStatus, Reverse, Refund, GetStatement and Payout (IC-PAY-01);
    //  payment adapters implement IPaymentMethod and appear at checkout; payout-only adapters do
    //  not and appear only in the PAY payout registry"
    const view = await api.get('/api/payments/admin/connectors', SESSIONS.admin);
    assert.deepEqual(view.operations, [
      'InitiatePayment', 'HandleCallback', 'QueryStatus', 'Reverse', 'Refund', 'GetStatement', 'Payout',
    ]);
    const mobile = view.connectors.find((c) => c.systemName === MOBILE);
    assert.ok(mobile, 'the rail is registered through IC-PAY-01');
    assert.equal(mobile.methodType, METHOD_TYPE.Standard);
    for (const operation of OPERATIONS) {
      assert.equal(typeof mobile.capabilities[operation], 'boolean', `${operation} carries a flag`);
    }
    assert.equal(mobile.capabilities.InitiatePayment, true);
    assert.equal(mobile.capabilities.GetStatement, false, 'a payment rail has no statement API');

    assert.ok(view.checkout.includes(MOBILE), 'a payment adapter appears at checkout');
    assert.ok(view.payoutRegistry.includes('MANEPS'), 'the switch is in the payout registry');
    assert.equal(view.checkout.includes('MANEPS'), false, 'and implements no IPaymentMethod');
    const payout = payoutConnectors().find((c) => c.systemName === 'MANEPS');
    assert.equal(payout.implementsPaymentMethod, false);
    assert.equal(payout.capabilities.Payout, true);
    assert.ok(checkoutConnectors().length >= 6, 'every active rail is a registered connector');
  });

  test('AC-PAY-024-01-02', async () => {
    // "an adapter does not support an operation ... the framework returns NotSupported and the
    //  console offers the manual path"
    const statement = await callAsync(OFFLINE, 'GetStatement', {});
    assert.equal(statement.ok, false);
    assert.equal(statement.notSupported, true);
    assert.match(statement.manualPath, /statement file/);

    const refund = await callAsync(OFFLINE, 'Refund', { amount: 10 });
    assert.equal(refund.notSupported, true, 'a counter rail has no refund API');
    assert.match(refund.manualPath, /offline refund/);

    const unknown = await callAsync('Payments.NotInstalled', 'InitiatePayment', {});
    assert.equal(unknown.notSupported, true);
    // an operation the adapter does declare runs
    const supported = await callAsync(MOBILE, 'QueryStatus', { providerRef: 'STK-TEST' });
    assert.equal(supported.ok, true);
  });

  test('AC-PAY-024-01-03', async () => {
    // "the signature, token or IP allow-list is verified before any status change; failures are
    //  logged and audited (AUD-PAY-010)"
    await saveCredentialAsync({
      systemName: MOBILE, key: 'callbacksecret', value: 'shhh-signing-key', storeId: 1,
    });
    const payload = { providerRef: 'STK-SIGNED', status: 'Paid' };
    const good = createHmac('sha256', 'shhh-signing-key').update(JSON.stringify(payload)).digest('hex');

    const refused = await verifyCallbackAsync({
      systemName: MOBILE, payload, signature: 'not-the-signature', ip: '203.0.113.9', storeId: 1,
    });
    assert.equal(refused.verified, false);
    assert.match(refused.reason, /signature/);
    const logs = await repository('Log').getAllAsync((l) => l.feature === 'PRD-PAY-024');
    assert.ok(logs.length >= 1, 'the refusal is logged');
    const trail = await auditTrailAsync({ event: 'AUD-PAY-010' });
    assert.ok(trail.some((e) => e.outcome === 'failure'), 'and audited as AUD-PAY-010');

    const accepted = await verifyCallbackAsync({
      systemName: MOBILE, payload, signature: good, ip: '203.0.113.9', storeId: 1,
    });
    assert.equal(accepted.verified, true);
    assert.equal(accepted.verifiedBy, 'signature');

    // the IP allow-list is checked first, before the signature
    await saveSettingAsync(`pay.callback.allowedips.${MOBILE.toLowerCase()}`, ['198.51.100.7'], 1);
    const wrongIp = await verifyCallbackAsync({
      systemName: MOBILE, payload, signature: good, ip: '203.0.113.9', storeId: 1,
    });
    assert.equal(wrongIp.verified, false);
    assert.match(wrongIp.reason, /allow-list/);
    await saveSettingAsync(`pay.callback.allowedips.${MOBILE.toLowerCase()}`, [], 1);

    // a token provider: the token is compared instead of a signature
    await saveCredentialAsync({
      systemName: CARD, key: 'callbacktoken', value: 'tok-12345', storeId: 1,
    });
    const byToken = await verifyCallbackAsync({
      systemName: CARD, payload, token: 'tok-12345', storeId: 1,
    });
    assert.equal(byToken.verifiedBy, 'token');
    assert.equal((await verifyCallbackAsync({
      systemName: CARD, payload, token: 'tok-wrong', storeId: 1,
    })).verified, false);

    // and a callback that is not verified changes nothing
    const attempt = await beginAttemptAsync({
      systemName: MOBILE, amount: 100, currency: 'MWK', checkoutReference: 'CHK-VERIFY1', orderGuid: 'guid-verify-1', storeId: 1,
    });
    const nothing = await applyCallbackAsync({ providerRef: attempt.providerRef, verified: false, storeId: 1 });
    assert.equal(nothing.ok, false);
    const after = await repository('PaymentTransaction').getByIdAsync(attempt.transactionId);
    assert.equal(after.status, TX.Pending, 'the status is unchanged');
  });

  test('AC-PAY-024-01-04', async () => {
    // "the call uses TLS and the provider's authentication; credentials are read from the
    //  encrypted adapter settings"
    await saveCredentialAsync({
      systemName: CARD, key: 'apikey', value: 'live-key-abc', storeId: 1,
    });
    const call = await providerCallAsync({
      systemName: CARD, operation: 'Refund', args: { providerRef: 'CARD-1', amount: 25 }, storeId: 1,
    });
    assert.equal(call.ok, true);
    assert.equal(call.tls, true);
    assert.equal(call.credentialUsed, true, 'the provider key held by this instance was used');
    assert.equal(await credentialAsync({ systemName: CARD, key: 'apikey', storeId: 1 }), 'live-key-abc');
  });

  test('AC-PAY-024-01-05', async () => {
    // "it declares RecurringPaymentType; ... NotSupported makes the method unavailable for
    //  recurring carts"
    assert.equal(connectorFor(MOBILE).recurringPaymentType, RECURRING_TYPE.Manual);
    assert.equal(connectorFor(CARD).recurringPaymentType, RECURRING_TYPE.Manual);
    assert.equal(connectorFor(OFFLINE).recurringPaymentType, RECURRING_TYPE.NotSupported);
    assert.equal(connectorFor(BANK).recurringPaymentType, RECURRING_TYPE.NotSupported);
    for (const connector of connectorsRegistered()) {
      assert.ok(Object.values(RECURRING_TYPE).includes(connector.recurringPaymentType), `${connector.systemName} declares a recurring type`);
    }
  });

  test('AC-PAY-024-02-01', async () => {
    // "they are stored encrypted and never exported in a configuration pack (BR-PAY-110)"
    const saved = await saveCredentialAsync({
      systemName: MOBILE, key: 'apikey', value: 'a-real-secret', storeId: 1,
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.stored, 'encrypted');
    assert.equal(saved.exportedInPacks, false);
    assert.equal(saved.rule, 'BR-PAY-110');

    const rows = await allSettingsAsync();
    const row = rows.find((r) => r.name === saved.key);
    assert.ok(row, 'the credential is held as a setting of this instance');
    assert.notEqual(row.value, 'a-real-secret', 'but not in the clear');
    assert.equal(await credentialAsync({ systemName: MOBILE, key: 'apikey', storeId: 1 }), 'a-real-secret');

    // the audit entry carries no value
    const trail = await auditTrailAsync({ entity: 'PaymentCredential' });
    assert.ok(trail.length >= 1);
    assert.equal(JSON.stringify(trail).includes('a-real-secret'), false, 'no value is ever written to the trail');

    // and a pack that states it is refused, so it cannot travel between instances
    const problems = validatePack({
      layer: 'client', id: 'probe', name: 'probe', version: '1.0.0', settings: { [saved.key]: 'a-real-secret' },
    }, { root: ROOT, stores: ['main', 'business'] });
    assert.ok(problems.some((p) => p.severity === 'refused' && p.messageKey === 'Plt.PackSecretRefused'));
  });

  test('AC-PAY-024-02-02', async () => {
    // "each such key is flagged secret, so the PLT configuration-pack loader refuses it and
    //  exports omit it (BR-PAY-110)"
    const keys = secretKeyNamesFor(MOBILE);
    assert.ok(keys.length >= 3, 'the adapter lists its credential keys');
    for (const key of keys) {
      assert.equal(isDeclaredSecretKey(key), true, `${key} is flagged secret in the PAY key catalogue`);
      const problems = validatePack({
        layer: 'client', id: 'probe', name: 'probe', version: '1.0.0', settings: { [key]: 'x' },
      }, { root: ROOT, stores: ['main', 'business'] });
      assert.ok(problems.some((p) => p.severity === 'refused'), `${key} is refused in a pack`);
    }
    const exported = await api.post('/api/platform/promotion/export', { instanceCode: 'SOURCE' }, SESSIONS.admin);
    assert.equal(JSON.stringify(exported.pack).includes('a-real-secret'), false, 'an export omits the value');
    for (const key of keys) {
      assert.equal(Object.keys(exported.pack.settings ?? {}).includes(key), false, `${key} is not exported`);
    }
  });
});

/* ============================================ PRD-PAY-001 methods and routing ========== */

describe('PRD-PAY-001 which methods are offered, and where', () => {
  test('AC-PAY-001-01-01', async () => {
    // "when the administrator deactivates it, then it is not offered at checkout in any store,
    //  and existing orders paid with it keep their records"
    const { placed } = await splitCheckoutAsync('deactivate', MOBILE);
    const before = await repository('Order').getOneAsync((o) => o.orderNumber === placed.orders[0].orderNumber);

    const off = await setMethodActiveAsync({ systemName: MOBILE, active: false, storeId: 1 });
    assert.equal(off.activeSystemNames.includes(MOBILE), false);
    const offer = await methodsForCheckoutAsync({ storeId: 1 });
    assert.equal(offer.available.some((m) => m.systemName === MOBILE), false, 'it is not offered');

    const after = await repository('Order').getOneAsync((o) => o.orderNumber === placed.orders[0].orderNumber);
    assert.equal(after.paymentMethodSystemName, before.paymentMethodSystemName, 'the order keeps its method');
    assert.equal(after.paymentStatus, before.paymentStatus, 'and its payment record');
    assert.ok(off.existingOrdersKept >= 1);

    await setMethodActiveAsync({ systemName: MOBILE, active: true, storeId: 1 });
    assert.equal((await methodsForCheckoutAsync({ storeId: 1 })).available.some((m) => m.systemName === MOBILE), true);
  });

  test('AC-PAY-001-01-02', async () => {
    // "each is an independent payment method under the same routing rules"
    const offer = await methodsForCheckoutAsync({ storeId: 1 });
    const gateways = offer.available.filter((m) => [MOBILE, CARD].includes(m.systemName));
    assert.equal(gateways.length, 2, 'two gateways, two methods');
    assert.equal(new Set(gateways.map((g) => g.systemName)).size, 2);

    // a rule on one gateway leaves the other alone, and both are evaluated by BR-PAY-001
    await withRuleAsync({
      methodSystemName: CARD, dimension: RULE_DIMENSION.fulfilment, operator: RULE_OPERATOR.in, values: ['pickup'],
    }, async () => {
      const delivery = await methodsForCheckoutAsync({ storeId: 1, fulfilment: 'delivery' });
      assert.equal(delivery.available.some((m) => m.systemName === CARD), false, 'the rule applies to the card gateway');
      assert.equal(delivery.available.some((m) => m.systemName === MOBILE), true, 'and not to the other gateway');
    });
    const admin = await methodAdminListAsync({ storeId: 1 });
    assert.ok(admin.methods.filter((m) => m.active).length >= 2, 'both are listed as active methods');
  });

  test('AC-PAY-001-02-01', async () => {
    // "a routing rule 'method X only for location type = rural' is active ... an urban shopper
    //  does not see it; a rural shopper does"
    const area = await repository('ServiceArea').insertAsync({
      countryId: 1, county: 'Nkhata Bay', locationType: 'rural', storeId: 1,
    });
    const urban = await repository('ServiceArea').insertAsync({
      countryId: 1, county: 'Blantyre', locationType: 'urban', storeId: 1,
    });
    try {
      await withRuleAsync({
        methodSystemName: OFFLINE, dimension: RULE_DIMENSION.locationType, operator: RULE_OPERATOR.in, values: ['rural'],
      }, async () => {
        const rural = await methodsForCheckoutAsync({ storeId: 1, address: { district: 'Nkhata Bay' } });
        assert.equal(rural.locationType.locationType, 'rural');
        assert.equal(rural.available.some((m) => m.systemName === OFFLINE), true, 'the rural shopper sees it');

        const city = await methodsForCheckoutAsync({ storeId: 1, address: { district: 'Blantyre' } });
        assert.equal(city.locationType.locationType, 'urban');
        const refused = city.excluded.find((m) => m.systemName === OFFLINE);
        assert.ok(refused, 'the urban shopper does not');
        assert.equal(refused.reason, 'routing-rule');
        assert.equal(refused.refusals[0].dimension, 'locationType');
      });
    } finally {
      await repository('ServiceArea').deleteAsync(area.id);
      await repository('ServiceArea').deleteAsync(urban.id);
    }
  });

  test('AC-PAY-001-02-02', async () => {
    // "a rule limits a method to service type S ... the cart holds a service of another type,
    //  then the method is not listed"
    const [product] = await sellerProductsAsync();
    const listing = await repository('ServiceListing').insertAsync({
      productId: product.id, serviceTypeId: 'passport-photo', deliveryMethodId: 'at-counter',
    });
    try {
      await withRuleAsync({
        methodSystemName: OFFLINE, dimension: RULE_DIMENSION.serviceType, operator: RULE_OPERATOR.in, values: ['money-transfer'],
      }, async () => {
        const cart = [{ productId: product.id, quantity: 1 }];
        const offer = await methodsForCheckoutAsync({ storeId: 1, cart });
        const refused = offer.excluded.find((m) => m.systemName === OFFLINE);
        assert.ok(refused, 'a service of another type does not match the rule');
        assert.equal(refused.refusals[0].dimension, 'serviceType');

        // the same cart with the service type the rule names is offered the method
        await repository('ServiceListing').updateAsync({ ...listing, serviceTypeId: 'money-transfer' });
        const allowed = await methodsForCheckoutAsync({ storeId: 1, cart });
        assert.equal(allowed.available.some((m) => m.systemName === OFFLINE), true);
      });
    } finally {
      await repository('ServiceListing').deleteAsync(listing.id);
    }
  });

  test('AC-PAY-001-02-03', async () => {
    // "a rule limits a method to pickup orders ... the shopper chose home delivery, then the
    //  method is not listed"
    await withRuleAsync({
      methodSystemName: OFFLINE, dimension: RULE_DIMENSION.fulfilment, operator: RULE_OPERATOR.in, values: ['pickup'],
    }, async () => {
      const delivery = await methodsForCheckoutAsync({ storeId: 1, fulfilment: 'delivery' });
      assert.equal(delivery.available.some((m) => m.systemName === OFFLINE), false);
      const pickup = await methodsForCheckoutAsync({ storeId: 1, fulfilment: 'pickup' });
      assert.equal(pickup.available.some((m) => m.systemName === OFFLINE), true);
    });
  });

  test('AC-PAY-001-02-04', async () => {
    // "two rules apply to the same method ... the method is shown only if every applicable rule
    //  allows it (BR-PAY-001)"
    await withRuleAsync({
      methodSystemName: CARD, dimension: RULE_DIMENSION.fulfilment, operator: RULE_OPERATOR.in, values: ['delivery'],
    }, async () => {
      await withRuleAsync({
        methodSystemName: CARD, dimension: RULE_DIMENSION.orderValue, operator: RULE_OPERATOR.range, values: [5000, 200000],
      }, async () => {
        const rules = await rulesAsync({ methodSystemName: CARD, storeId: 1 });
        assert.equal(rules.length, 2, 'two rules apply to the method');

        const both = await methodsForCheckoutAsync({ storeId: 1, fulfilment: 'delivery', total: 20000 });
        assert.equal(both.available.some((m) => m.systemName === CARD), true, 'both allow: it is shown');

        const oneRefuses = await methodsForCheckoutAsync({ storeId: 1, fulfilment: 'delivery', total: 100 });
        const refused = oneRefuses.excluded.find((m) => m.systemName === CARD);
        assert.ok(refused, 'one refuses: it is not shown');
        assert.equal(refused.refusals.length, 1);
        assert.match(refused.citation, /BR-PAY-001/);

        const verdict = await evaluateMethodAsync({
          systemName: CARD,
          rules,
          context: { fulfilment: 'pickup', orderValue: 20000 },
        });
        assert.equal(verdict.allowed, false);
        assert.equal(verdict.rulesApplied, 2);
      });
    });
  });

  test('AC-PAY-001-02-05', async () => {
    // "the value is read from that coverage area (ServiceArea.LocationType, LOG-004); PAY keeps
    //  no location-type data of its own; an address in no coverage area matches no rural or urban
    //  rule"
    const nowhere = await locationTypeAsync({ address: { district: 'Nowhere' } });
    assert.equal(nowhere.covered, false);
    assert.equal(nowhere.locationType, null);
    assert.equal(nowhere.source, 'LOG-004 ServiceArea');

    const area = await repository('ServiceArea').insertAsync({
      countryId: 1, county: 'Karonga', postalCodePattern: 'KA*', locationType: 'rural', storeId: 1,
    });
    try {
      const byDistrict = await locationTypeAsync({ address: { district: 'Karonga' } });
      assert.equal(byDistrict.locationType, 'rural');
      assert.equal(byDistrict.areaId, area.id, 'read from the LOG-004 coverage area');
      const byPostcode = await locationTypeAsync({ address: { postalCode: 'KA101' } });
      assert.equal(byPostcode.locationType, 'rural');

      // an address in no coverage area matches neither a rural nor an urban rule
      await withRuleAsync({
        methodSystemName: OFFLINE, dimension: RULE_DIMENSION.locationType, operator: RULE_OPERATOR.in, values: ['rural', 'urban'],
      }, async () => {
        const offer = await methodsForCheckoutAsync({ storeId: 1, address: { district: 'Nowhere' } });
        assert.equal(offer.available.some((m) => m.systemName === OFFLINE), false);
      });
    } finally {
      await repository('ServiceArea').deleteAsync(area.id);
    }
    // PAY holds no location type of its own: the only rows are LOG-004's
    assert.equal((await repository('ServiceArea').getAllAsync()).length, 0);
  });

  test('AC-PAY-001-03-01', async () => {
    // "all available methods are listed with name, logo and any fee (PAY-015)"
    await withSettingAsync(`pay.additionalfee.${'Payments.CashOnDelivery'.toLowerCase()}`, 250, async () => {
      const offer = await methodsForCheckoutAsync({ storeId: 1 });
      assert.ok(offer.available.length >= 2);
      for (const method of offer.available) {
        assert.ok(method.name && method.name.length > 2, 'each has a name');
        assert.ok(method.logo, 'and a logo');
        assert.equal(typeof method.additionalFee, 'number', 'and its fee');
      }
      const cod = offer.available.find((m) => m.systemName === 'Payments.CashOnDelivery');
      assert.equal(cod.additionalFee, 250, 'the fee the client stated is shown');
    });
    const noFee = (await methodsForCheckoutAsync({ storeId: 1 }))
      .available.find((m) => m.systemName === 'Payments.CashOnDelivery');
    assert.equal(noFee.additionalFee, 0, 'and no fee is invented where the client states none');
  });

  test('AC-PAY-001-03-02', async () => {
    // "no method is available for the cart ... checkout stops showing message
    //  Pay.NoMethodAvailable with the support contact, and no order is placed"
    const [product] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('no-method');
    await addAsync(sessionId, product.id);
    const active = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', 1, []);
    const orders = (await repository('Order').getAllAsync()).length;
    try {
      await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', [], 1);
      const offer = await methodsForCheckoutAsync({ storeId: 1 });
      assert.equal(offer.available.length, 0);
      assert.equal(offer.stopCheckout, true);
      assert.equal(offer.messageKey, 'Pay.NoMethodAvailable');
      assert.equal(offer.message, resource('Pay.NoMethodAvailable'));
      assert.ok(Object.prototype.hasOwnProperty.call(offer.supportContact, 'value'), 'with the support contact');

      const refused = await confirmAsync(sessionId);
      assert.equal(refused.ok, false, 'checkout stops');
      assert.equal((await repository('Order').getAllAsync()).length, orders, 'and no order is placed');
    } finally {
      await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', active, 1);
    }
    // the contact itself is not stated in either client source, so it is a setting of its own
    const contact = await supportContactAsync(1);
    assert.equal(contact.key === 'pay.supportcontact' || contact.key === 'storeinformationsettings.companyphonenumber', true);
  });

  test('AC-PAY-001-03-03', async () => {
    // "the routing check BR-PAY-001 is evaluated again on the final cart; if the chosen method is
    //  no longer allowed, placement stops with message Pay.MethodNotAllowed and no order is
    //  placed"
    const [product] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('revalidate');
    await addAsync(sessionId, product.id);
    const orders = (await repository('Order').getAllAsync()).length;

    await withRuleAsync({
      methodSystemName: MOBILE, dimension: RULE_DIMENSION.fulfilment, operator: RULE_OPERATOR.in, values: ['pickup'],
    }, async () => {
      const refused = await confirmAsync(sessionId);
      assert.equal(refused.ok, false);
      assert.equal(refused.messageKey, 'Pay.MethodNotAllowed');
      assert.equal(refused.message, resource('Pay.MethodNotAllowed'));
      assert.equal(refused.refusedBy, 'PRD-PAY-001', 'the PAY validator stopped it (IC-PAY-03)');
      assert.equal((await repository('Order').getAllAsync()).length, orders, 'no order is placed');
    });

    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, 'with the rule gone the same checkout goes through');

    // and the re-check reads the real cart: a pickup-only rule lets a pickup checkout through
    const pickupPoints = await api.get('/api/logistics/pickup-points', sessionId);
    const { sessionId: pickupSession } = await signedInAsync('revalidate-pickup');
    const added = await addAsync(pickupSession, product.id);
    const line = (await api.get('/api/checkout-area/cart', pickupSession)).items[0];
    assert.ok(added.ok !== false);
    const set = await api.post(`/api/checkout-area/fulfilment/lines/${line.id}`, {
      method: 'pickup', pickupPointId: pickupPoints[0].id,
    }, pickupSession);
    assert.equal(set.cart.items[0].fulfilment, 'pickup', 'the line is collected at an outlet');
    await withRuleAsync({
      methodSystemName: MOBILE, dimension: RULE_DIMENSION.fulfilment, operator: RULE_OPERATOR.in, values: ['pickup'],
    }, async () => {
      const pickupOrder = await confirmAsync(pickupSession);
      assert.equal(pickupOrder.ok, true, pickupOrder.message ?? 'a pickup checkout satisfies a pickup-only rule');
    });
  });
});

/* ========================================= PRD-PAY-011 the payment status lifecycle ==== */

describe('PRD-PAY-011 every payment has a status linked to its order', () => {
  test('AC-PAY-011-03-01', async () => {
    // "a PaymentTransaction is created with status Initiated, AttemptNo and the order reference"
    const attempt = await beginAttemptAsync({
      systemName: MOBILE,
      amount: 1500,
      currency: 'MWK',
      checkoutReference: 'CHK-ATTEMPT1',
      orderGuid: 'guid-attempt-1',
      storeId: 1,
    });
    const row = await repository('PaymentTransaction').getByIdAsync(attempt.transactionId);
    assert.equal(row.attemptNo, 1);
    assert.equal(row.checkoutReference, 'CHK-ATTEMPT1', 'with the order reference');
    assert.equal(row.methodSystemName, MOBILE);
    assert.equal(row.statusHistory[0].to, TX.Initiated, 'the record starts at Initiated');
    assert.equal(row.statusHistory[0].trigger, 'attempt started');
    assert.ok(row.createdOnUtc, 'and is timestamped');
    const trail = await auditTrailAsync({ event: 'AUD-PAY-001' });
    assert.ok(trail.some((e) => Number(e.entityId) === Number(row.id) && e.after?.status === TX.Initiated));
  });

  test('AC-PAY-011-03-02', async () => {
    // "only the transitions in state model SM-PAY-01 are allowed; each change is timestamped and
    //  audited (AUD-PAY-001); the native order PaymentStatus changes only through
    //  IOrderProcessingService (BR-PAY-010)"
    const { placed } = await splitCheckoutAsync('lifecycle', MOBILE);
    const transaction = await repository('PaymentTransaction')
      .getOneAsync((t) => t.checkoutReference === placed.checkoutReference);

    // a transition SM-PAY-01 does not hold is refused
    const refused = await transitionAsync({ transactionId: transaction.id, to: TX.Refunded, storeId: 1 });
    assert.equal(refused.ok, false);
    assert.equal(refused.refused, true);
    assert.match(refused.message, /SM-PAY-01 does not allow/);
    assert.equal(refused.rule, 'BR-PAY-010 / SM-PAY-01');
    assert.ok(refused.allowed.includes(TX.Successful), 'the model lists what is allowed instead');

    const moved = await transitionAsync({
      transactionId: transaction.id, to: TX.Successful, reason: 'provider confirmed', storeId: 1,
    });
    assert.equal(moved.ok, true);
    assert.equal(moved.nativePaymentStatus, 'Paid');
    assert.equal(moved.through, 'IOrderProcessingService.MarkOrderAsPaidAsync', 'the native status goes through the host');
    for (const result of moved.orders) {
      assert.equal(result.through, 'IOrderProcessingService.MarkOrderAsPaidAsync');
      assert.equal(result.owner, 'PRD-CHK-003', 'whose one owner is CHK-003 (OVR-REG)');
    }
    const row = await repository('PaymentTransaction').getByIdAsync(transaction.id);
    const last = row.statusHistory.at(-1);
    assert.equal(last.to, TX.Successful);
    assert.ok(last.changedOnUtc, 'the change is timestamped');
    const trail = await auditTrailAsync({ event: 'AUD-PAY-001' });
    assert.ok(trail.some((e) => e.before?.status === TX.Pending && e.after?.status === TX.Successful), 'and audited');

    // the mapping of every status is the BR-PAY-010 table
    assert.equal(nativeMappingFor(TX.Authorized).paymentStatus, 'Authorized');
    assert.equal(nativeMappingFor(TX.Failed).paymentStatus, 'Pending');
    assert.equal(nativeMappingFor(TX.Voided).paymentStatus, 'Voided');
    assert.equal(transitionFor(TX.Authorized, TX.Voided).native, 'VoidOfflineAsync');
    assert.ok(SM_PAY_01.length >= 15, 'the whole state model is declared');
  });

  test('AC-PAY-011-03-03', async () => {
    // "the service returns true if any PaymentTransaction of the order, including a group
    //  transaction linked to it (BR-PAY-014), is Successful or Authorized, otherwise false; it
    //  reads only and changes nothing"
    const { placed, transaction } = await splitCheckoutAsync('inv-read', MOBILE);
    const order = await repository('Order').getOneAsync((o) => o.orderNumber === placed.orders[0].orderNumber);

    const pending = await hasSuccessfulOrAuthorizedTransactionAsync(order.id);
    assert.equal(pending.result, false, 'a pending group payment is not a successful one');
    assert.equal(pending.readOnly, true);
    assert.equal(pending.lock, payOrderLockKey(order.id));
    assert.equal(pending.includesGroupTransaction, true);

    const before = await repository('PaymentTransaction').getByIdAsync(transaction.id);
    await transitionAsync({ transactionId: transaction.id, to: TX.Successful, storeId: 1 });
    const answer = await hasSuccessfulOrAuthorizedTransactionAsync(order.id);
    assert.equal(answer.result, true);
    assert.equal(answer.status, TX.Successful);
    assert.equal(answer.contract, 'IC-PAY-07 (INV-004 names it IC-INV-02)');

    const unrelated = await repository('Order').getAllAsync((o) => !o.checkoutReference);
    if (unrelated.length) {
      assert.equal((await hasSuccessfulOrAuthorizedTransactionAsync(unrelated[0].id)).result, false);
    }
    // the read changed nothing but the transition the test made itself
    const after = await repository('PaymentTransaction').getByIdAsync(transaction.id);
    assert.equal(after.amount, before.amount);
    assert.equal(after.attemptNo, before.attemptNo);
  });

  test('AC-PAY-011-01-01', async () => {
    // "the page shows the status, the next step (message keys Pay.Status.Pending /
    //  Pay.Status.Failed), a retry button where allowed and the support contact"
    const { placed, sessionId } = await splitCheckoutAsync('status-page', MOBILE);
    const orderNumber = placed.orders[0].orderNumber;

    const pending = await api.get(`/api/payments/status/${orderNumber}`, sessionId);
    assert.equal(pending.ok, true);
    assert.equal(pending.paymentStatus, 'Pending');
    assert.equal(pending.messageKey, 'Pay.Status.Pending');
    assert.equal(pending.message, resource('Pay.Status.Pending'));
    assert.equal(pending.retry.allowed, true, 'with a retry button');
    assert.ok(pending.nextStep, 'and what to do next');
    assert.ok(Object.prototype.hasOwnProperty.call(pending.supportContact, 'value'), 'and the support contact');
    assert.ok(pending.attempts.length >= 1, 'every attempt is listed');

    const transaction = await repository('PaymentTransaction')
      .getOneAsync((t) => t.checkoutReference === placed.checkoutReference);
    await transitionAsync({ transactionId: transaction.id, to: TX.Failed, storeId: 1 });
    const failed = await paymentStatusAsync({ orderNumber, storeId: 1 });
    assert.equal(failed.messageKey, 'Pay.Status.Failed');
    assert.equal(failed.message, resource('Pay.Status.Failed'));
    assert.equal(failed.retry.allowed, true, 'a failed payment can be tried again');
  });

  test('AC-PAY-011-01-02', async () => {
    // "ReminderSettings.PendingOrdersEnabled (install default on) and
    //  OrderSettings.AutoCancelEnabled (install default off) are set off unless the client pack
    //  states otherwise under BR-PAY-170"
    const pack = (layer, id, body) => ({
      layer, id, name: `${layer} ${id}`, version: '1.0.0', ...body,
    });
    const chain = [
      pack('global', 'global', { settings: { 'catalogsettings.searchpageproductsperpage': 6 } }),
      pack('country', 'MW', { settings: {} }),
      pack('client', 'MPC', { settings: { 'ordersettings.anonymouscheckoutallowed': false } }),
    ];
    try {
      await runPackCaseAsync(chain, pack);
    } finally {
      // put the instance back the way the rest of the suite expects it
      await api.post('/api/platform/packs/apply', { clientId: 'MPC', storeId: 1 }, SESSIONS.admin);
    }
  });

  async function runPackCaseAsync(chain, pack) {
    const applied = await api.post('/api/platform/packs/apply-chain', { chain, storeId: 1, force: true }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied');
    assert.equal(await getSettingAsync('remindersettings.pendingordersenabled', 0), false, 'no native reminder e-mail');
    assert.equal(await getSettingAsync('ordersettings.autocancelenabled', 0), false, 'and no native automatic cancellation');
    const row = applied.keys.find((k) => k.key === 'remindersettings.pendingordersenabled');
    assert.equal(row.moduleDefault, true);
    assert.match(row.rule, /BR-PAY-170/);

    // a client that asks for the native reminder keeps it: the pack wins
    const stated = [
      ...chain,
      pack('store', 'main', { settings: { 'remindersettings.pendingordersenabled': true } }),
    ];
    const second = await api.post('/api/platform/packs/apply-chain', { chain: stated, storeId: 1, force: true }, SESSIONS.admin);
    assert.equal(second.status, 'Applied');
    assert.equal(await getSettingAsync('remindersettings.pendingordersenabled', 1), true, 'unless the client pack states otherwise');

    // the payment-pending message is the PAY notification, not a native reminder
    const codes = await api.get('/api/notifications/event-codes', SESSIONS.admin);
    assert.ok(codes.some((c) => c.code === 'Pay.Status.Pending' && c.owningModule === 'Product.PAY'));
  }

  test('AC-PAY-011-02-01', async () => {
    // "a new PaymentTransaction (AttemptNo + 1) is created on the same order;
    //  Redirection-type adapters use the native RePostPayment path; Standard-type adapters use
    //  the PAY retry action"
    const [product] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('retry');
    await addAsync(sessionId, product.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const orderNumber = placed.orders[0].orderNumber;
    const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
    assert.equal(order.paymentStatus, 'Pending', 'the push is still pending');

    const first = await attemptsForOrderAsync(order);
    const retried = await api.post('/api/payments/retry', { orderNumber, paymentData: { phone: '265880000002' } }, sessionId);
    assert.equal(retried.ok, true);
    assert.equal(retried.attemptNo, Number(first[0].attemptNo) + 1, 'AttemptNo + 1');
    assert.equal(retried.path, 'PAY retry action', 'a Standard adapter uses the PAY action');
    assert.equal(retried.methodType, METHOD_TYPE.Standard);
    const attempts = await attemptsForOrderAsync(await repository('Order').getByIdAsync(order.id));
    assert.equal(attempts.length, first.length + 1, 'on the same order');

    // a Redirection adapter goes down the native re-post path instead
    const redirect = await retryAllowedAsync({
      order: { ...order, paymentMethodSystemName: REDIRECT }, transaction: attempts[0], storeId: 1,
    });
    assert.equal(redirect.allowed, true);
    assert.equal(redirect.methodType, METHOD_TYPE.Redirection);
    assert.equal(redirect.path, 'native RePostPayment');
    clearPlacementInterval(customer.id);
  });

  test('AC-PAY-011-02-02', async () => {
    // "the order was cancelled after the payment window ... retry is not offered and message
    //  Pay.RetryExpired is shown"
    const [product] = await sellerProductsAsync();
    const { sessionId } = await signedInAsync('retry-expired');
    await addAsync(sessionId, product.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const orderNumber = placed.orders[0].orderNumber;
    await cancelOrderAsync({ orderNumber, reason: 'the payment window passed', actor: 'inventory' });

    const status = await paymentStatusAsync({ orderNumber, storeId: 1 });
    assert.equal(status.retry.allowed, false, 'retry is not offered');
    assert.equal(status.retry.messageKey, 'Pay.RetryExpired');
    assert.equal(status.retry.message, resource('Pay.RetryExpired'));

    const refused = await retryAsync({ orderNumber, storeId: 1 });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Pay.RetryExpired');
  });

  test('AC-PAY-011-04-01', async () => {
    // "one PaymentTransaction is created for the checkout with the CheckoutSession reference as
    //  the merchant reference and one share per seller; the provider is asked for the checkout
    //  total once; one ProcessPaymentResult is returned for the checkout (BR-PAY-014)"
    const { placed, totals } = await splitCheckoutAsync('group-pay', MOBILE);
    assert.equal(placed.orders.length, 2, 'two sellers, two sub-orders');
    assert.equal(placed.payments, 1, 'one payment for the checkout');

    const rows = await repository('PaymentTransaction')
      .getAllAsync((t) => t.checkoutReference === placed.checkoutReference);
    assert.equal(rows.length, 1, 'one PaymentTransaction for the checkout');
    const [transaction] = rows;
    assert.equal(transaction.paymentReference, placed.checkoutReference, 'the merchant reference is the checkout reference');
    assert.equal(Number(transaction.amount), Number(totals.total), 'for the checkout total');
    assert.equal(transaction.shares.length, 2, 'with one share per seller');
    assert.equal(
      Number(transaction.shares.reduce((s, x) => s + Number(x.amount), 0).toFixed(2)),
      Number(totals.total),
      'the shares add up to the total',
    );
    for (const order of placed.orders) {
      assert.equal(order.paymentProviderRef, transaction.providerRef, 'one result for every sub-order');
    }
  });

  test('AC-PAY-011-04-02', async () => {
    // "under the lock 'pay-checkout-{CheckoutSessionId}' and then 'pay-order-{OrderId}' per
    //  sub-order, MarkOrderAsPaidAsync is called once for each linked sub-order; the transaction
    //  becomes Successful"
    const { placed, transaction, sessionId } = await splitCheckoutAsync('group-callback', MOBILE);
    const callback = await api.post('/api/payments/callback', { providerRef: transaction.providerRef, accept: true }, sessionId);
    assert.equal(callback.status, 'Paid');
    assert.equal(callback.orders.length, 2, 'every linked sub-order is marked paid');

    const row = await repository('PaymentTransaction').getByIdAsync(transaction.id);
    assert.equal(row.status, TX.Successful);
    for (const placedOrder of placed.orders) {
      const order = await repository('Order').getOneAsync((o) => o.orderNumber === placedOrder.orderNumber);
      assert.equal(order.paymentStatus, 'Paid');
      assert.ok(order.paidOnUtc);
    }
    assert.equal(payCheckoutLockKey(placed.checkoutReference), `pay-checkout-${placed.checkoutReference}`);
    const trail = await auditTrailAsync({ entity: 'Order', event: 'AUD-CHK-001' });
    const paidEntries = trail.filter((e) => e.after?.paymentStatus === 'Paid'
      && placed.orders.some((o) => Number(o.id) === Number(e.entityId)));
    assert.equal(paidEntries.length, 2, 'once per sub-order');
    for (const entry of paidEntries) {
      assert.match(entry.note, /IOrderProcessingService/, 'through the one owner of that write');
    }
  });

  test('AC-PAY-011-04-03', async () => {
    // "the transaction becomes Failed, every sub-order stays Pending and the retry applies to
    //  the whole checkout: the new attempt is again one group transaction for the sub-orders
    //  still Pending"
    const { placed, transaction, sessionId } = await splitCheckoutAsync('group-failed', MOBILE);
    const callback = await api.post('/api/payments/callback', { providerRef: transaction.providerRef, accept: false }, sessionId);
    assert.equal(callback.status, 'Failed');
    assert.equal((await repository('PaymentTransaction').getByIdAsync(transaction.id)).status, TX.Failed);
    for (const placedOrder of placed.orders) {
      const order = await repository('Order').getOneAsync((o) => o.orderNumber === placedOrder.orderNumber);
      assert.equal(order.paymentStatus, 'Pending', 'every sub-order stays pending');
      assert.notEqual(order.orderStatus, 'Cancelled');
    }

    const retried = await retryAsync({ orderNumber: placed.orders[0].orderNumber, storeId: 1, data: { phone: '265880000003' } });
    assert.equal(retried.ok, true);
    assert.equal(retried.retriedCheckout, true, 'the retry is per checkout');
    assert.equal(retried.subOrders.length, 2, 'for the sub-orders still pending');
    const rows = await repository('PaymentTransaction')
      .getAllAsync((t) => t.checkoutReference === placed.checkoutReference);
    assert.equal(rows.length, 2, 'one new group transaction');
    assert.equal(rows.at(-1).attemptNo, 2);
  });

  test('AC-PAY-011-04-04', async () => {
    // "the adapter finds the group transaction linked to that order and redirects for the
    //  checkout total with the CheckoutSession reference, not for that order alone"
    const active = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', 1, []);
    await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', [...active, REDIRECT], 1);
    try {
      const { placed, totals } = await splitCheckoutAsync('group-redirect', REDIRECT);
      const subOrder = placed.orders[0];
      const post = await postProcessPaymentAsync({ orderNumber: subOrder.orderNumber, storeId: 1 });
      assert.equal(post.redirect, true, 'a Redirection adapter redirects');
      assert.equal(post.orderPassedByNative, subOrder.orderNumber, 'native checkout passes one order');
      assert.equal(post.merchantReference, placed.checkoutReference, 'with the CheckoutSession reference');
      assert.equal(Number(post.amount), Number(totals.total), 'for the checkout total');
      assert.equal(post.forCheckoutTotal, true);
      assert.notEqual(Number(post.amount), Number(subOrder.total), 'not for that order alone');
      assert.equal(connectorFor(REDIRECT).methodType, METHOD_TYPE.Redirection);
    } finally {
      await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', active, 1);
    }
  });

  test('AC-PAY-011-04-05', async () => {
    // "the other sub-orders are marked paid; the share of the cancelled sub-order follows the
    //  SuccessfulAfterCancel path for that share (console exception, provider-side refund
    //  through PAY-016, AUD-PAY-001)"
    const { placed, transaction, sessionId } = await splitCheckoutAsync('cancel-race', MOBILE);
    const cancelled = placed.orders[0];
    const other = placed.orders[1];
    await cancelOrderAsync({ orderNumber: cancelled.orderNumber, reason: 'out of stock', actor: 'operations' });

    const callback = await api.post('/api/payments/callback', { providerRef: transaction.providerRef, accept: true }, sessionId);
    assert.equal(callback.status, 'Paid');
    const paid = await repository('Order').getOneAsync((o) => o.orderNumber === other.orderNumber);
    assert.equal(paid.paymentStatus, 'Paid', 'the other sub-order is paid');
    const stillCancelled = await repository('Order').getOneAsync((o) => o.orderNumber === cancelled.orderNumber);
    assert.equal(stillCancelled.orderStatus, 'Cancelled');
    assert.notEqual(stillCancelled.paymentStatus, 'Paid', 'the cancelled one is not marked paid');

    assert.equal(callback.exceptions.length, 1, 'the share becomes a console exception');
    const exception = await repository('PaymentException')
      .getOneAsync((e) => e.orderNumber === cancelled.orderNumber);
    assert.equal(exception.kind, 'SuccessfulAfterCancel');
    assert.match(exception.refundOpenedBy, /PAY-016/);
    const trail = await auditTrailAsync({ event: 'AUD-PAY-001' });
    assert.ok(trail.some((e) => e.after?.status === TX.SuccessfulAfterCancel
      || e.note?.includes('SuccessfulAfterCancel')), 'and is audited AUD-PAY-001');
  });

  test('AC-PAY-011-04-06', async () => {
    // "the chosen method or adapter does not declare group-payment support ... the method is not
    //  offered for that checkout (BR-PAY-014); single-seller checkouts are not affected"
    assert.equal(connectorFor(BANK).supportsGroupPayment, false);
    const split = await methodsForCheckoutAsync({ storeId: 1, multiSeller: true });
    const refused = split.excluded.find((m) => m.systemName === BANK);
    assert.ok(refused, 'not offered for a split checkout');
    assert.equal(refused.reason, 'no-group-support');
    assert.match(refused.citation, /BR-PAY-014/);

    const single = await methodsForCheckoutAsync({ storeId: 1, multiSeller: false });
    assert.equal(single.available.some((m) => m.systemName === BANK), true, 'single-seller checkouts are not affected');

    // and the group operation itself refuses a method without the flag
    const direct = await groupPaymentAsync({
      checkoutReference: 'CHK-NOGROUP1',
      total: 500,
      currency: 'MWK',
      sharePerSeller: [{ vendorId: 201, amount: 250 }, { vendorId: 202, amount: 250 }],
      systemName: BANK,
      storeId: 1,
    });
    assert.equal(direct.ok, false);
    assert.equal(direct.groupPaymentNotSupported, true);
  });

  test('AC-PAY-011-04-07', async () => {
    // "PAY writes the PaymentTransactionOrder link for that sub-order with its seller share; if
    //  the group result was Paid ... PAY calls nothing more; if the group transaction became
    //  Successful by callback before the link, PAY calls MarkOrderAsPaidAsync for that sub-order
    //  once"
    const { placed, transaction } = await splitCheckoutAsync('confirm-link', MOBILE);
    const links = await repository('PaymentTransactionOrder')
      .getAllAsync((l) => Number(l.transactionId) === Number(transaction.id));
    assert.equal(links.length, 2, 'one link per saved sub-order');
    for (const placedOrder of placed.orders) {
      const link = links.find((l) => Number(l.orderId) === Number(placedOrder.id));
      assert.ok(link, 'written at Confirm');
      assert.equal(Number(link.amount), Number(placedOrder.total), 'with its seller share');
    }

    // a sub-order saved after the callback is marked paid once, now
    await transitionAsync({ transactionId: transaction.id, to: TX.Successful, storeId: 1 });
    const late = await repository('Order').insertAsync({
      orderNumber: `LATE-${transaction.id}`,
      checkoutReference: placed.checkoutReference,
      vendorId: 203,
      total: 100,
      currency: 'MWK',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      storeId: 1,
      placedOnUtc: new Date().toISOString(),
    });
    const linked = await linkSubOrderAsync({ order: late, storeId: 1 });
    assert.equal(linked.markedPaidNow, true, 'the late sub-order is marked paid once');
    assert.equal((await repository('Order').getByIdAsync(late.id)).paymentStatus, 'Paid');

    // a sub-order native placement already saved Paid is not touched again
    const already = await repository('Order').insertAsync({
      orderNumber: `PAID-${transaction.id}`,
      checkoutReference: placed.checkoutReference,
      vendorId: 204,
      total: 100,
      currency: 'MWK',
      paymentStatus: 'Paid',
      orderStatus: 'Pending',
      storeId: 1,
      placedOnUtc: new Date().toISOString(),
    });
    const nothing = await linkSubOrderAsync({ order: already, storeId: 1 });
    assert.equal(nothing.alreadyPaidByPlacement, true);
    assert.equal(nothing.calledNothing, true);
  });

  test('AC-PAY-011-04-08', async () => {
    // "the group transaction is shown with the unlinked share and the CheckoutSession reference
    //  as a console exception; PAY makes no refund on its own; a refund of that share arrives
    //  only from RET"
    const { placed, transaction } = await splitCheckoutAsync('unlinked', MOBILE);
    // placement stopped before one seller's sub-order was saved: its link is missing
    const links = await repository('PaymentTransactionOrder')
      .getAllAsync((l) => Number(l.transactionId) === Number(transaction.id));
    const dropped = links.at(-1);
    const droppedOrder = await repository('Order').getByIdAsync(Number(dropped.orderId));
    await repository('PaymentTransactionOrder').deleteAsync(dropped.id);
    await repository('Order').deleteAsync(droppedOrder.id);

    const unlinked = await unlinkedSharesAsync();
    const row = unlinked.find((u) => Number(u.transactionId) === Number(transaction.id));
    assert.ok(row, 'the group transaction is shown with its unlinked share');
    assert.equal(row.checkoutReference, placed.checkoutReference);
    assert.equal(Number(row.amount), Number(dropped.amount));
    assert.equal(row.payMakesNoRefundItself, true);
    assert.match(row.refundComesFrom, /PlacementFailure/);

    const view = await api.get('/api/payments/exceptions', SESSIONS.finance);
    assert.ok(view.unlinkedShares.some((u) => Number(u.transactionId) === Number(transaction.id)));
    assert.equal((await repository('Refund').getAllAsync()).length, 0, 'PAY opened no refund itself');
  });
});

/* ================================================ PRD-PAY-012 paying once only ========= */

describe('PRD-PAY-012 charged once, whatever the network does', () => {
  test('AC-PAY-012-01-01', async () => {
    // "a payment initiation request carries an idempotency key (default Order.OrderGuid +
    //  AttemptNo) ... the same request is received again, then no second charge is initiated; the
    //  original result is returned"
    const args = {
      systemName: MOBILE,
      amount: 2500,
      currency: 'MWK',
      checkoutReference: 'CHK-IDEM0001',
      orderGuid: 'guid-idem-0001',
      attemptNo: 1,
      storeId: 1,
    };
    const first = await beginAttemptAsync(args);
    const before = (await repository('PaymentTransaction').getAllAsync()).length;
    const again = await beginAttemptAsync(args);

    assert.equal(again.duplicate, true);
    assert.equal(again.noSecondCharge, true);
    assert.equal(again.transactionId, first.transactionId, 'the original result is returned');
    assert.equal(again.providerRef, first.providerRef);
    assert.equal(again.idempotencyKey, idempotencyKeyFor({ orderGuid: 'guid-idem-0001', attemptNo: 1 }));
    assert.equal(again.rule, 'BR-PAY-012 / AC-PAY-012-01-01');
    assert.equal((await repository('PaymentTransaction').getAllAsync()).length, before, 'no second transaction');

    // the next attempt is a different key, so it does charge
    const next = await beginAttemptAsync({ ...args, attemptNo: 2 });
    assert.notEqual(next.transactionId, first.transactionId);
    assert.equal(next.idempotencyKey, 'guid-idem-0001:2');
  });

  test('AC-PAY-012-01-02', async () => {
    // "a provider sends the same callback twice ... it is recognised by provider reference and
    //  transaction status and ignored after logging; MarkOrderAsPaidAsync is not called again,
    //  even if the order is PartiallyRefunded (BR-PAY-012)"
    const { placed, transaction, sessionId } = await splitCheckoutAsync('double-callback', MOBILE);
    const first = await api.post('/api/payments/callback', { providerRef: transaction.providerRef, accept: true }, sessionId);
    assert.equal(first.status, 'Paid');
    const order = await repository('Order').getOneAsync((o) => o.orderNumber === placed.orders[0].orderNumber);
    const paidAt = order.paidOnUtc;

    const second = await applyCallbackAsync({ providerRef: transaction.providerRef, status: 'Paid', storeId: 1 });
    assert.equal(second.duplicate, true);
    assert.equal(second.ignored, true);
    assert.equal(second.logged, true, 'after logging');
    assert.equal(second.markedPaidAgain, false);
    assert.equal((await repository('Order').getByIdAsync(order.id)).paidOnUtc, paidAt, 'the order is untouched');

    // the native guard alone would answer true for a PartiallyRefunded order, so the
    // de-duplication is what stops the second call
    await transitionAsync({
      transactionId: transaction.id, to: TX.PartiallyRefunded, amount: 1, storeId: 1,
    });
    const third = await applyCallbackAsync({ providerRef: transaction.providerRef, status: 'Paid', storeId: 1 });
    assert.equal(third.ignored, true, 'even for a partially refunded order');
    assert.equal(third.markedPaidAgain, false);
    const logs = await repository('Log').getAllAsync((l) => l.feature === 'PRD-PAY-012');
    assert.ok(logs.length >= 2, 'each repeat is logged');
  });

  test('AC-PAY-012-01-03', async () => {
    // "the native placement lock and minimum interval prevent a duplicate order; across several
    //  web nodes the PLT-027 idempotency key (P2) is required because the lock is per host"
    const [product] = await sellerProductsAsync();
    const { sessionId, customer } = await signedInAsync('double-place');
    await addAsync(sessionId, product.id);
    const locksBefore = placementLockCount(customer.id);
    const placed = await confirmAsync(sessionId);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.ok(placementLockCount(customer.id) > locksBefore, 'placement ran under the native lock');

    const second = await placementIntervalGuardAsync({ customer, sessionId, storeId: 1 });
    assert.equal(second.ok, false, 'the minimum interval refuses the second placement');
    assert.equal(second.orderCreated, false);
    assert.equal(second.withLock, true);

    const readiness = await checkoutNodeReadinessAsync({ storeId: 1 });
    assert.match(JSON.stringify(readiness), /PLT-027/, 'several web nodes need the PLT-027 key');
    clearPlacementInterval(customer.id);
  });

  test('AC-PAY-012-01-04', async () => {
    // "checkout is retried within PaymentSettings.RegenerateOrderGuidInterval ... the same
    //  OrderGuid is reused and passed to the provider as the merchant reference"
    const { customer, sessionId } = await signedInAsync('guid-reuse');
    const session = await repository('CheckoutSession').insertAsync({
      sessionId, customerId: customer.id, storeId: 1, state: 'Open', reference: 'CHK-PAYGUID01',
    });
    const first = await orderGuidForAsync({ session, storeId: 1 });
    assert.equal(first.reused, false);
    assert.equal(first.intervalSeconds, 180, 'the native interval is 180 seconds');

    const retry = await orderGuidForAsync({
      session: await repository('CheckoutSession').getByIdAsync(session.id), storeId: 1,
    });
    assert.equal(retry.reused, true, 'the same OrderGuid is reused');
    assert.equal(retry.orderGuid, first.orderGuid);

    const attempt = await beginAttemptAsync({
      systemName: MOBILE,
      amount: 900,
      currency: 'MWK',
      checkoutReference: session.reference,
      orderGuid: retry.orderGuid,
      attemptNo: 7,
      storeId: 1,
    });
    assert.equal(attempt.idempotencyKey, `${first.orderGuid}:7`, 'and carried to the provider as the merchant reference');
    const row = await repository('PaymentTransaction').getByIdAsync(attempt.transactionId);
    assert.equal(row.paymentReference, session.reference);
  });
});
