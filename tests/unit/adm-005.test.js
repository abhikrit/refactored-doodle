// PRD-ADM-005 Eligibility and quota rules - one test per AC, named by AC ID.
// 3 stories, 6 criteria.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

describe('US-ADM-005-01 who may see and buy', () => {
  test('AC-ADM-005-01-01', async () => {
    // "the customer is added to or removed from that role according to the rule outcome, and
    //  native ACL (AclRecord by customer role) then decides what the customer sees"
    const buyer = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    await repository('Customer').updateAsync({
      ...buyer, country: 'MW', yearsRegistered: 4, annualSpend: 180000,
    });

    const added = await api.post('/api/admin-console/eligibility/recompute', { customerId: buyer.id }, SESSIONS.compliance);
    const addition = added.changes.find((c) => c.customer === 'buyer@example.com');
    assert.ok(addition, 'the profile change moved the customer');
    assert.equal(addition.role, 'BulkBuyer');
    assert.equal(addition.added, true);
    assert.equal(addition.ruleSet, 'scheme-eligibility');
    assert.match(added.visibility, /native AclRecord by customer role/);

    // and the nightly recomputation takes it away again when the profile no longer qualifies
    await repository('Customer').updateAsync({
      ...(await repository('Customer').getByIdAsync(buyer.id)), annualSpend: 0,
    });
    const removed = await api.post('/api/admin-console/eligibility/recompute', {}, SESSIONS.compliance);
    const removal = removed.changes.find((c) => c.customer === 'buyer@example.com');
    assert.equal(removal.added, false, 'the customer is removed from the role');
    const after2 = await repository('Customer').getByIdAsync(buyer.id);
    assert.equal((after2.roles ?? []).includes('BulkBuyer'), false);

    // the screen is behind the compliance permission
    const denied = await api.call('POST', '/api/admin-console/eligibility/recompute', {}, SESSIONS.catalogue);
    assert.equal(denied.status, 403);
    assert.equal(denied.body.permission, 'Administration.Core.Eligibility.CreateEditDelete');
  });

  test('AC-ADM-005-01-02', async () => {
    // "the ADM cart rule provider (IC-CHK-01, called by the CHK-003 IShoppingCartService
    //  override) returns warning Adm.NotEligible and the item is not added"
    const products = await api.get('/api/catalogue/products');
    const restricted = products[1];
    await repository('Product').updateAsync({
      ...(await repository('Product').getByIdAsync(restricted.id)), limitedToCustomerRoles: ['BulkBuyer'],
    });

    const result = await api.post('/api/checkout-area/cart/items', { productId: restricted.id, quantity: 1 }, SESSIONS.buyer);
    assert.equal(result.ok, false);
    assert.ok(result.warnings.includes('This item is not available for your account.'), 'Adm.NotEligible');
    assert.equal(result.cart.items.some((i) => i.productId === restricted.id), false, 'the item is not added');

    // ADM registers no IShoppingCartService implementation of its own (BR-ADM-002)
    const plugins = await api.get('/api/platform/plugins');
    const cartOwner = plugins.overrideRegister.find((o) => o.service === 'IShoppingCartService');
    assert.equal(cartOwner.owner, 'Product.CHK');
    assert.equal(plugins.overrideRegister.filter((o) => o.service === 'IShoppingCartService').length, 1);
    const provider = plugins.providerRegister.find((p) => p.contract === 'IC-CHK-01')
      .providers.find((x) => x.feature === 'PRD-ADM-005');
    assert.ok(provider, 'ADM plugs in as a cart check provider instead');
  });
});

describe('US-ADM-005-02 reserved quotas', () => {
  test('AC-ADM-005-02-01', async () => {
    // "the ADM cart rule provider returns warning Adm.QuotaReserved and the quantity is not
    //  added; the same check runs again at order placement"
    const quotas = await api.get('/api/admin-console/eligibility', SESSIONS.compliance);
    const quota = quotas.quotas[0];
    const product = await repository('Product').getByIdAsync(quota.refId);
    await repository('Product').updateAsync({ ...product, stockQuantity: 50, limitedToCustomerRoles: [] });
    // 50 in stock, 40 reserved for BulkBuyer, so 10 are free to everyone else

    const ok = await api.post('/api/checkout-area/cart/items', { productId: quota.refId, quantity: 10 }, SESSIONS.buyer);
    assert.equal(ok.ok, true, '10 of the free 10 is allowed');

    const refused = await api.post('/api/checkout-area/cart/items', { productId: quota.refId, quantity: 5 }, SESSIONS.buyer);
    assert.equal(refused.ok, false);
    assert.ok(refused.warnings.some((w) => /reserved/i.test(w)), 'Adm.QuotaReserved');
    assert.match(refused.warnings.find((w) => /reserved/i.test(w)), /You can order up to 10\./);
  });

  test('AC-ADM-005-02-02', async () => {
    // "ADM is a placement participant (IC-CHK-06): Reserve re-checks the quota under ILocker key
    //  'adm-quota-{quotaId}' and reserves the quantity, or refuses placement ... so only one of
    //  the two orders gets the last reserved units"
    const { placementParticipantAsync } = await import('../../packages/server/src/plugins/product-adm/services/eligibility.js');
    const quota = (await repository('Quota').getAllAsync())[0];
    const product = await repository('Product').getByIdAsync(quota.refId);
    await repository('Product').updateAsync({ ...product, stockQuantity: 60 });
    await repository('Quota').updateAsync({ ...quota, consumed: 38, reserved: 0 });
    // 40 reserved for BulkBuyer, 38 already taken: two reserved units are left

    const buyer = { id: 1, roles: ['BulkBuyer'] };
    const cart = [{ productId: product.id, quantity: 2 }];
    const [first, second] = await Promise.all([
      placementParticipantAsync({ phase: 'Reserve', cart, customer: buyer }),
      placementParticipantAsync({ phase: 'Reserve', cart, customer: buyer }),
    ]);
    const winners = [first, second].filter((r) => r.ok !== false);
    const losers = [first, second].filter((r) => r.ok === false);
    assert.equal(winners.length, 1, 'only one of the two placements gets the last units');
    assert.equal(losers.length, 1);
    assert.equal(losers[0].messageKey, 'Adm.QuotaReserved');

    // Confirm consumes the reservation; Release frees it
    await placementParticipantAsync({ phase: 'Confirm', reservations: winners[0].reservations });
    const afterConfirm = await repository('Quota').getByIdAsync(quota.id);
    assert.equal(afterConfirm.consumed, 40, 'Confirm consumes the reservation');
    assert.equal(afterConfirm.reserved, 0);

    const { lockHistory } = await import('../../packages/server/src/core/locker.js');
    assert.ok(lockHistory().some((l) => l.key === `adm-quota-${quota.id}`), 'the reservation ran under the named lock');

    // Release frees a hold when placement or payment fails (BR-CHK-020)
    await repository('Quota').updateAsync({ ...(await repository('Quota').getByIdAsync(quota.id)), consumed: 30, reserved: 0 });
    const holder = await placementParticipantAsync({ phase: 'Reserve', cart, customer: buyer });
    assert.equal((await repository('Quota').getByIdAsync(quota.id)).reserved, 2);
    await placementParticipantAsync({ phase: 'Release', reservations: holder.reservations });
    assert.equal((await repository('Quota').getByIdAsync(quota.id)).reserved, 0, 'Release frees the hold');
  });
});

describe('US-ADM-005-03 sanctions screening', () => {
  test('AC-ADM-005-03-01', async () => {
    // "the party is screened through the sanctions-screening adapter; on a possible match the
    //  account is flagged, checkout is blocked with Adm.ScreeningHold and a review item is
    //  created (ADM-006)"
    const clean = await repository('Customer').getOneAsync((c) => c.email === 'buyer@example.com');
    const noMatch = await api.post('/api/admin-console/screening', { customerId: clean.id }, SESSIONS.compliance);
    assert.equal(noMatch.blocked, false);
    assert.equal(noMatch.screening.result, 'NoMatch');

    const flagged = await repository('Customer').insertAsync({
      email: 'sanctioned.party@example.com', firstName: 'Sanctioned', lastName: 'Party', roles: ['Registered'], active: true, deleted: false, country: 'MW', synthetic: true,
    });
    const match = await api.post('/api/admin-console/screening', { customerId: flagged.id }, SESSIONS.compliance);
    assert.equal(match.blocked, true);
    assert.equal(match.screening.result, 'PossibleMatch');
    assert.equal(match.messageKey, 'Adm.ScreeningHold');
    assert.match(match.message, /complete a check on your account/);
    assert.ok(match.approvalItemId, 'a review item is created (ADM-006)');

    const held = await repository('Customer').getByIdAsync(flagged.id);
    assert.equal(held.screeningHold, true, 'the account is flagged');

    const { screeningHoldAsync } = await import('../../packages/server/src/plugins/product-adm/services/eligibility.js');
    const checkout = await screeningHoldAsync(held);
    assert.equal(checkout.blocked, true, 'checkout is blocked while the hold stands');
  });

  test('AC-ADM-005-03-02', async () => {
    // "cleared: the flag is removed and checkout works; confirmed: the customer is added to the
    //  SEL-013 block list; both are audited (AUD-ADM-005)"
    const screenings = (await api.get('/api/admin-console/eligibility', SESSIONS.compliance)).screenings;
    const open = screenings.filter((s) => s.status === 'InReview');
    assert.ok(open.length >= 1);

    const confirmed = await api.post(`/api/admin-console/screening/${open[0].id}/decide`, { decision: 'confirm', note: 'identity matches the list entry' }, SESSIONS.compliance);
    assert.equal(confirmed.ok, true);
    assert.equal(confirmed.blockListed, true);
    assert.equal(confirmed.checkoutWorks, false);
    const blockList = await repository('SellerBlockListEntry').getAllAsync();
    assert.ok(blockList.some((b) => b.email === 'sanctioned.party@example.com'), 'added to the SEL-013 block list');

    // a second party, cleared this time
    const other = await repository('Customer').insertAsync({
      email: 'second.party@example.com', firstName: 'Blocked Trading Co', lastName: 'Agent', roles: ['Registered'], active: true, deleted: false, country: 'MW', synthetic: true,
    });
    const raised = await api.post('/api/admin-console/screening', { customerId: other.id }, SESSIONS.compliance);
    assert.equal(raised.blocked, true);
    const cleared = await api.post(`/api/admin-console/screening/${raised.screening.id}/decide`, { decision: 'clear', note: 'false positive' }, SESSIONS.compliance);
    assert.equal(cleared.checkoutWorks, true);
    assert.equal((await repository('Customer').getByIdAsync(other.id)).screeningHold, false, 'the flag is removed');

    const trail = await api.get('/api/security/audit?event=AUD-ADM-005');
    const decisions = trail.filter((e) => e.entity === 'ScreeningResult');
    assert.ok(decisions.length >= 2, 'both decisions are audited as AUD-ADM-005');
    assert.ok(decisions.every((d) => d.actor));
  });
});
