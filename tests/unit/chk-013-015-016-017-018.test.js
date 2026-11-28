// PRD-CHK-013 assisted checkout (6 ACs) and the four features the register holds: PRD-CHK-015
// checkout attributes (3, PH-INF), PRD-CHK-016 B2B on-account payment and credit limits
// (6, PH-INF and PAID-STUB), PRD-CHK-017 B2B quick order (3, PH-INF) and PRD-CHK-018 B2B
// purchase approval (6, PH-INF and WF-ENG). Each held feature is built as the chapter's
// Proposed option and labelled (P-1). One test per AC, named by AC ID.

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
import { createCompanyAsync, addMemberAsync } from '../../packages/server/src/plugins/product-iam/services/companies.js';
import {
  getAssistedOrderAsync, listAssistedOrdersAsync, assistedPaymentMethodsAsync,
} from '../../packages/server/src/plugins/product-chk/services/assisted.js';
import {
  saveAttributeAsync, saveAttributeValueAsync, attributesForAsync, validateAttributesAsync,
  attributeFeeAsync, PROTOTYPE_DEFAULT as ATTRIBUTE_LABEL,
} from '../../packages/server/src/plugins/product-chk/services/checkout-attributes.js';
import {
  applyAsync, decideAsync as decideCreditAsync, onAccountOfferAsync, availableCreditAsync,
  accountForCustomerAsync, reserveCreditAsync, CREDIT_STATE, ON_ACCOUNT,
  PROTOTYPE_DEFAULT as CREDIT_LABEL,
} from '../../packages/server/src/plugins/product-chk/services/credit.js';
import {
  quickOrderAsync, savedListsAsync, saveListAsync, addListToCartAsync,
} from '../../packages/server/src/plugins/product-chk/services/quick-order.js';
import {
  saveRuleAsync, thresholdForAsync, submitForApprovalAsync, decideRequestAsync,
  approvalForCartAsync, cartSnapshot, expireRequestsAsync, REQUEST_STATE,
  PROTOTYPE_DEFAULT as APPROVAL_LABEL,
} from '../../packages/server/src/plugins/product-chk/services/approval.js';
import { getCartAsync } from '../../packages/server/src/plugins/product-chk/services/cart.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

let n = 0;
async function shopperAsync(label, extra = {}) {
  n += 1;
  const customer = await createCustomerAsync({
    email: `chk13-${n}@example.com`, firstName: 'Chk', lastName: 'Buyer', roles: ['Registered'], phone: '+265996000001', ...extra,
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

/** A company with a buyer and an approver, as IAM-022 holds them. */
async function companyAsync(label) {
  const company = await createCompanyAsync({ name: `${label} Ltd`, registrationNumber: `REG-${label}` });
  const { customer: buyer, sessionId: buyerSession } = await shopperAsync(`${label}-buyer`);
  const { customer: approver, sessionId: approverSession } = await shopperAsync(`${label}-approver`);
  await addMemberAsync({ companyId: company.id, email: buyer.email, companyRole: 'CompanyBuyer' });
  await addMemberAsync({ companyId: company.id, email: approver.email, companyRole: 'CompanyApprover' });
  return {
    company, buyer, buyerSession, approver, approverSession,
  };
}

/* ====================================================== PRD-CHK-013 =================== */

describe('PRD-CHK-013 an order placed at the counter', () => {
  test('AC-CHK-013-01-01', async () => {
    // "the single impersonation filter owned by IAM-026 allows the agent only for a non-staff
    //  customer of the agent's own outlet ...; then native impersonation starts, IAM writes the
    //  session record and the agent shops as that customer"
    const agent = await repository('Customer').getOneAsync((c) => c.email === 'agent.lilongwe@example.com');
    assert.ok(agent, 'the seed has an agent with an outlet');
    assert.ok(agent.outlet, 'and the outlet is assigned (IAM-026)');

    const { customer } = await shopperAsync('walk-in');
    await repository('Customer').updateAsync({
      ...await repository('Customer').getByIdAsync(customer.id), outlet: agent.outlet, registeredAtOutlet: agent.outlet,
    });

    const session = 'counter-1';
    await api.post('/api/identity/sign-in', { email: agent.email, password: 'demo' }, session);
    const acting = await api.post('/api/identity/users/impersonate', { customerEmail: customer.email }, session);
    assert.equal(acting.ok, true, 'the filter allowed it');
    assert.ok(
      (acting.providersAsked ?? [acting.decidedBy]).includes('PRD-IAM-026') || acting.decidedBy === 'PRD-IAM-026'
        || acting.decidedBy === 'Administrators',
      'the one filter decided it, and CHK added none of its own',
    );
    assert.equal(acting.actingSessionStarted, true, 'and the session became the customer\'s');
    assert.equal(acting.record.action, 'act', 'IAM wrote the session record');
    assert.equal(acting.record.outlet, agent.outlet);

    // the agent now shops as that customer
    const me = await api.get('/api/identity/me', session);
    assert.equal(me.email, customer.email);
    assert.ok(me.acting, 'the session knows it is an acting session');
  });

  test('AC-CHK-013-01-02', async () => {
    // "an AssistedOrder record stores OrderId, agent and outlet; this is the only order-to-agent
    //  record; the native order note also names the agent (AUD-CHK-003)"
    const agent = await repository('Customer').getOneAsync((c) => c.email === 'agent.lilongwe@example.com');
    const { customer } = await shopperAsync('walk-in-order');
    await repository('Customer').updateAsync({
      ...await repository('Customer').getByIdAsync(customer.id), outlet: agent.outlet, registeredAtOutlet: agent.outlet,
    });
    const session = 'counter-2';
    await api.post('/api/identity/sign-in', { email: agent.email, password: 'demo' }, session);
    await api.post('/api/identity/users/impersonate', { customerEmail: customer.email }, session);

    const [product] = await productsAsync();
    await addAsync(session, product.id);
    const placed = await confirmAsync(session);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const order = placed.orders[0];

    const assisted = await repository('AssistedOrder').getOneAsync((a) => a.orderNumber === order.orderNumber);
    assert.ok(assisted, 'the order carries its agent');
    assert.equal(assisted.agentEmail, agent.email);
    assert.equal(assisted.outlet, agent.outlet);
    assert.equal(Number(assisted.orderId), Number(order.id));

    const notes = await repository('OrderNote').getAllAsync((x) => x.orderNumber === order.orderNumber);
    assert.ok(notes.some((x) => x.note.includes(agent.email)), 'and the order note names the agent');

    const trail = await auditTrailAsync({ event: 'AUD-CHK-003', entityId: assisted.id });
    assert.ok(trail.length >= 1, 'the record is audited');

    // nothing else keeps an order-to-agent link
    const viaContract = await getAssistedOrderAsync(order.orderNumber);
    assert.equal(viaContract.assisted, true);
    assert.equal(viaContract.servedThrough, 'IC-CHK-10');
  });

  test('AC-CHK-013-02-01', async () => {
    // "only methods allowed for assisted orders by the PAY routing rules are offered, and the
    //  payment taken is recorded by PAY-034 with the agent identity"
    const open = await assistedPaymentMethodsAsync({ storeId: 1 });
    assert.equal(open.routingRuleSet, false, 'with no routing rule the store\'s own methods are offered');

    const routed = await withSettingAsync('pay.routing.assistedordermethods', ['Payments.CashAtOutlet'], async () => assistedPaymentMethodsAsync({ storeId: 1 }), 1);
    assert.deepEqual(routed.available.map((m) => m.systemName), ['Payments.CashAtOutlet'], 'the rule decides what a counter may take');
    assert.ok(routed.excluded.some((m) => m.reason === 'not-allowed-for-assisted'));
    assert.equal(routed.ruleOwnedBy, 'PRD-PAY-024 routing rules');

    // the payment of an assisted order is recorded with the agent
    const agent = await repository('Customer').getOneAsync((c) => c.email === 'agent.lilongwe@example.com');
    const { customer } = await shopperAsync('counter-payment');
    await repository('Customer').updateAsync({
      ...await repository('Customer').getByIdAsync(customer.id), outlet: agent.outlet, registeredAtOutlet: agent.outlet,
    });
    const session = 'counter-3';
    await api.post('/api/identity/sign-in', { email: agent.email, password: 'demo' }, session);
    await api.post('/api/identity/users/impersonate', { customerEmail: customer.email }, session);
    const [product] = await productsAsync();
    await addAsync(session, product.id);
    const placed = await confirmAsync(session, { paymentMethodSystemName: 'Payments.CashAtOutlet' });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');

    const payment = await repository('AssistedPayment').getOneAsync((p) => p.orderNumber === placed.orders[0].orderNumber);
    assert.ok(payment, 'the payment is recorded');
    assert.equal(payment.agentEmail, agent.email, 'with the agent who took it');
    assert.equal(payment.recordedBy, 'PRD-PAY-034');
  });

  test('AC-CHK-013-01-03', async () => {
    // "IAM-026 refuses it with message Iam.AgentNotAssigned and no checkout is possible"
    const agent = await createCustomerAsync({
      email: 'agent.nooutlet@example.com', firstName: 'No', lastName: 'Outlet', roles: ['Registered', 'Agent'], phone: '+265996000777',
    });
    const { customer } = await shopperAsync('no-outlet-customer');
    const session = 'counter-no-outlet';
    await api.post('/api/identity/sign-in', { email: agent.email, password: 'demo' }, session);

    const refused = await api.post('/api/identity/users/impersonate', { customerEmail: customer.email }, session);
    assert.equal(refused.ok, false, 'the agent cannot act for anybody');
    assert.match(
      String(refused.messageKey ?? refused.message ?? ''),
      /Iam.AgentNotAssigned|ScopeDenied/,
      'IAM-026 refuses it',
    );

    const me = await api.get('/api/identity/me', session);
    assert.equal(me.email, agent.email, 'no acting session was started');
    assert.equal(me.acting ?? null, null);
  });

  test('AC-CHK-013-03-01', async () => {
    // "the matching AssistedOrder records are listed; agents see only their own outlet"
    const supervisor = await api.get('/api/checkout-area/assisted/orders', SESSIONS.admin);
    assert.equal(supervisor.ok, true);
    assert.ok(supervisor.rows.length >= 1, 'a supervisor sees the assisted orders');
    assert.equal(supervisor.scope, 'all outlets');

    const agent = await repository('Customer').getOneAsync((c) => c.email === 'agent.lilongwe@example.com');
    const session = 'counter-list';
    await api.post('/api/identity/sign-in', { email: agent.email, password: 'demo' }, session);
    const own = await api.get('/api/checkout-area/assisted/orders', session);
    assert.equal(own.ok, true);
    assert.equal(own.scope, 'outlet', 'an agent is scoped to their own outlet');
    assert.equal(own.outlet, agent.outlet);
    assert.ok(own.rows.every((r) => r.outlet === agent.outlet));

    const filtered = await api.get(`/api/checkout-area/assisted/orders?agent=${encodeURIComponent(agent.email)}`, SESSIONS.admin);
    assert.ok(filtered.rows.every((r) => r.agentEmail === agent.email), 'and the list filters by agent');

    const denied = await api.get('/api/checkout-area/assisted/orders', SESSIONS.buyer);
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Checkout.Core.AssistedOrders.View');
  });

  test('AC-CHK-013-03-02', async () => {
    // "CHK returns agent, outlet and placement time from AssistedOrder, or 'not assisted'; no
    //  other module keeps an order-to-agent link"
    const rows = await listAssistedOrdersAsync({});
    assert.ok(rows.length >= 1);
    const one = await getAssistedOrderAsync(rows[0].orderNumber);
    assert.equal(one.assisted, true);
    assert.ok(one.agentEmail && one.outlet && one.placedOnUtc, 'agent, outlet and time');
    assert.equal(one.servedThrough, 'IC-CHK-10');

    const { sessionId } = await shopperAsync('self-service');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const ownOrder = await confirmAsync(sessionId);
    const notAssisted = await getAssistedOrderAsync(ownOrder.orderNumber ?? ownOrder.orders[0].orderNumber);
    assert.equal(notAssisted.assisted, false);
    assert.equal(notAssisted.reason, 'not assisted');

    const byPeriod = await listAssistedOrdersAsync({ from: '2000-01-01T00:00:00.000Z' });
    assert.ok(byPeriod.length >= 1, 'and the list takes a period');
  });
});

/* ====================================================== PRD-CHK-015 =================== */

describe('PRD-CHK-015 the fields a client asks for at checkout', () => {
  test('AC-CHK-015-01-01', async () => {
    // "the value is required, validated (ValidationMinLength / MaxLength) and stored on the
    //  order and invoice"
    const created = await api.post('/api/checkout-area/checkout-attributes', {
      name: 'Purchase order number',
      attributeControlType: 'TextBox',
      isRequired: true,
      validationMinLength: 4,
      validationMaxLength: 20,
    }, SESSIONS.admin);
    assert.equal(created.ok, true);
    assert.equal(created.prototypeDefault, ATTRIBUTE_LABEL, 'the feature says which decision is pending');

    const missing = await validateAttributesAsync({ storeId: 1, values: {} });
    assert.equal(missing.ok, false);
    assert.equal(missing.fieldErrors[created.attribute.id], 'This field is required.');

    const tooShort = await validateAttributesAsync({ storeId: 1, values: { [created.attribute.id]: 'PO1' } });
    assert.match(tooShort.fieldErrors[created.attribute.id], /at least 4 characters/);
    const tooLong = await validateAttributesAsync({ storeId: 1, values: { [created.attribute.id]: 'P'.repeat(30) } });
    assert.match(tooLong.fieldErrors[created.attribute.id], /under 20 characters/);

    const ok = await validateAttributesAsync({ storeId: 1, values: { [created.attribute.id]: 'PO-99812' } });
    assert.equal(ok.ok, true);

    // it is stored with the order
    const { sessionId } = await shopperAsync('purchase-order');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const refused = await confirmAsync(sessionId);
    assert.equal(refused.ok, false, 'the order cannot be placed without it');
    assert.ok(refused.fieldErrors[created.attribute.id]);

    const placed = await confirmAsync(sessionId, { checkoutAttributes: { [created.attribute.id]: 'PO-99812' } });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    const order = await repository('Order').getByIdAsync(placed.orders[0].id);
    assert.match(order.checkoutAttributeDescription, /Purchase order number: PO-99812/);

    await repository('CheckoutAttribute').updateAsync({ ...created.attribute, isActive: false });
  });

  test('AC-CHK-015-02-01', async () => {
    // "the fee is added to the order total with its tax"
    const attribute = (await api.post('/api/checkout-area/checkout-attributes', {
      name: 'Gift wrapping', attributeControlType: 'DropdownList', isRequired: false,
    }, SESSIONS.admin)).attribute;
    const value = (await api.post(`/api/checkout-area/checkout-attributes/${attribute.id}/values`, {
      name: 'Gift box', priceAdjustment: 1500, taxCategoryId: 2,
    }, SESSIONS.admin)).value;

    const fee = await attributeFeeAsync({ storeId: 1, values: { [attribute.id]: value.id } });
    assert.equal(fee.fee, 1500);
    assert.deepEqual(fee.taxCategories, [2], 'with the tax category the client set');

    const { sessionId } = await shopperAsync('gift-wrap');
    const [product] = await productsAsync();
    await addAsync(sessionId, product.id);
    const plain = await api.get('/api/checkout-area/checkout/totals?paymentMethodSystemName=Payments.TnmMpamba', sessionId);
    const withFee = await api.post('/api/checkout-area/checkout-attributes/fee', {
      values: { [attribute.id]: value.id },
    }, sessionId);
    assert.equal(withFee.fee, 1500);

    const placed = await confirmAsync(sessionId, { checkoutAttributes: { [attribute.id]: value.id } });
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.totals.checkoutAttributeFee, 1500, 'the fee is on the order');
    assert.ok(placed.totals.total > plain.total, 'and the total is higher by the fee and its tax');
    assert.ok(placed.totals.tax > plain.tax);

    await repository('CheckoutAttribute').updateAsync({ ...attribute, isActive: false });
  });

  test('AC-CHK-015-02-02', async () => {
    // "the conditional attribute is shown or hidden accordingly"
    const first = (await saveAttributeAsync({
      name: 'Is this a gift?', attributeControlType: 'DropdownList', storeId: 1,
    })).attribute;
    const yes = (await saveAttributeValueAsync({ attributeId: first.id, name: 'Yes' })).value;
    await saveAttributeValueAsync({ attributeId: first.id, name: 'No' });
    const second = (await saveAttributeAsync({
      name: 'Gift message',
      attributeControlType: 'MultilineTextbox',
      conditionAttributeId: first.id,
      conditionValue: String(yes.id),
      storeId: 1,
    })).attribute;

    const hidden = await attributesForAsync({ storeId: 1, values: {} });
    const hiddenRow = hidden.attributes.find((a) => a.id === second.id);
    assert.equal(hiddenRow.shown, false, 'the message is not asked for until the first answer says so');
    assert.equal(hiddenRow.condition.met, false);

    const shown = await attributesForAsync({ storeId: 1, values: { [first.id]: String(yes.id) } });
    const shownRow = shown.attributes.find((a) => a.id === second.id);
    assert.equal(shownRow.shown, true, 'and then it is');
    assert.equal(shownRow.condition.attributeId, first.id);

    // a hidden conditional attribute is not required
    await saveAttributeAsync({
      id: second.id,
      name: 'Gift message',
      attributeControlType: 'MultilineTextbox',
      isRequired: true,
      conditionAttributeId: first.id,
      conditionValue: String(yes.id),
      storeId: 1,
    });
    const notAsked = await validateAttributesAsync({ storeId: 1, values: {} });
    assert.equal(notAsked.fieldErrors[second.id], undefined, 'nothing is required while it is hidden');
    const asked = await validateAttributesAsync({ storeId: 1, values: { [first.id]: String(yes.id) } });
    assert.equal(asked.fieldErrors[second.id], 'This field is required.');

    for (const row of [first, second]) {
      await repository('CheckoutAttribute').updateAsync({ ...await repository('CheckoutAttribute').getByIdAsync(row.id), isActive: false });
    }
  });
});

/* ====================================================== PRD-CHK-016 =================== */

describe('PRD-CHK-016 buying on account', () => {
  test('AC-CHK-016-02-01', async () => {
    // "the credit account becomes Approved (SM-CHK-04) and the change is audited (AUD-CHK-005)"
    const { company, buyer } = await companyAsync('credit');
    const applied = await applyAsync({ companyId: company.id, customerId: buyer.id, currencyCode: 'MWK' });
    assert.equal(applied.account.status, CREDIT_STATE.Applied);
    assert.equal(applied.prototypeDefault, CREDIT_LABEL, 'the feature says which decisions are pending');

    const finance = await repository('Customer').getOneAsync((c) => c.email === 'finance@example.com');
    const approved = await decideCreditAsync({
      accountId: applied.account.id,
      decision: 'approve',
      creditLimit: 500000,
      paymentTermsDays: 30,
      actor: finance,
    });
    assert.equal(approved.ok, true);
    assert.equal(approved.account.status, CREDIT_STATE.Approved);
    assert.equal(approved.account.creditLimit, 500000);
    assert.equal(approved.account.paymentTermsDays, 30);

    const trail = await auditTrailAsync({ event: 'AUD-CHK-005', entityId: applied.account.id });
    assert.ok(trail.some((e) => e.after?.status === CREDIT_STATE.Approved), 'the approval is audited');

    // only finance may decide
    const denied = await decideCreditAsync({
      accountId: applied.account.id, decision: 'suspend', reason: 'test', actor: buyer,
    });
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Checkout.Core.Credit.CreateEditDelete');
  });

  test('AC-CHK-016-01-01', async () => {
    // "payment method 'On account' is offered; the order is placed with PaymentStatus Pending"
    const { company, buyer, buyerSession } = await companyAsync('on-account');
    const applied = await applyAsync({ companyId: company.id, customerId: buyer.id });
    const finance = await repository('Customer').getOneAsync((c) => c.email === 'finance@example.com');
    await decideCreditAsync({
      accountId: applied.account.id, decision: 'approve', creditLimit: 500000, paymentTermsDays: 30, actor: finance,
    });

    const [product] = await productsAsync();
    await addAsync(buyerSession, product.id);
    const cart = await getCartAsync({ sessionId: buyerSession, customer: buyer });
    const offer = await onAccountOfferAsync({ customer: buyer, total: cart.subtotal, storeId: 1 });
    assert.equal(offer.offered, true, 'on account is offered to a buyer with credit');
    assert.equal(offer.credit.available, 500000);
    assert.equal(offer.credit.rule, 'BR-CHK-018');

    const placed = await withSettingAsync('paymentsettings.activepaymentmethodsystemnames', [...await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', 1, []), ON_ACCOUNT], async () => confirmAsync(buyerSession, { paymentMethodSystemName: ON_ACCOUNT }), 1);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
    assert.equal(placed.orders[0].paymentStatus, 'Pending', 'the order waits for the invoice to be paid');
    assert.equal(placed.orders[0].paymentMethodSystemName, ON_ACCOUNT);
  });

  test('AC-CHK-016-03-01', async () => {
    // "On account is hidden and, if posted, returns Chk.CreditLimitExceeded; no order is placed;
    //  open receivables are read from PAY-033 through IC-PAY-08"
    const { company, buyer, buyerSession } = await companyAsync('over-limit');
    const applied = await applyAsync({ companyId: company.id, customerId: buyer.id });
    const finance = await repository('Customer').getOneAsync((c) => c.email === 'finance@example.com');
    await decideCreditAsync({
      accountId: applied.account.id, decision: 'approve', creditLimit: 2000, paymentTermsDays: 30, actor: finance,
    });

    // PAY-033 answers with the open receivables of this company
    registerProvider('IC-PAY-08', {
      area: 'PAY',
      feature: 'PRD-PAY-033',
      name: 'open receivables',
      fn: async ({ account }) => (Number(account.companyId) === Number(company.id)
        ? { total: 1500, items: [{ amount: 1500, dueOnUtc: new Date(Date.now() + 86400000).toISOString() }] }
        : null),
    });

    const approvedAccount = await accountForCustomerAsync({ customer: buyer, storeId: 1 });
    const credit = await availableCreditAsync({ account: approvedAccount, storeId: 1 });
    assert.equal(credit.openReceivables, 1500, 'the ledger is asked');
    assert.equal(credit.receivablesFrom, 'PRD-PAY-033');
    assert.equal(credit.available, 500, 'and what is left is the limit less what is owed');

    const [product] = await productsAsync();
    await addAsync(buyerSession, product.id);
    const cart = await getCartAsync({ sessionId: buyerSession, customer: buyer });
    assert.ok(cart.subtotal > 500, 'this cart is above the available credit');

    const offer = await onAccountOfferAsync({ customer: buyer, total: cart.subtotal, storeId: 1 });
    assert.equal(offer.offered, false, 'on account is hidden');
    assert.equal(offer.messageKey, 'Chk.CreditLimitExceeded');
    assert.equal(offer.message, 'This order is above your available credit. Choose another payment method or contact us.');

    const before = (await repository('Order').getAllAsync()).length;
    const refused = await reserveCreditAsync({ customer: buyer, total: cart.subtotal, storeId: 1 });
    assert.equal(refused.ok, false, 'and a posted order is refused');
    assert.equal(refused.messageKey, 'Chk.CreditLimitExceeded');
    assert.equal((await repository('Order').getAllAsync()).length, before, 'no order is placed');
  });

  test('AC-CHK-016-03-02', async () => {
    // "the check runs under ILocker key 'chk-credit-{CreditAccountId}'; the second order is
    //  refused if the limit would be exceeded"
    const { company, buyer } = await companyAsync('two-buyers');
    const applied = await applyAsync({ companyId: company.id, customerId: buyer.id });
    const finance = await repository('Customer').getOneAsync((c) => c.email === 'finance@example.com');
    await decideCreditAsync({
      accountId: applied.account.id, decision: 'approve', creditLimit: 10000, paymentTermsDays: 30, actor: finance,
    });

    const first = await reserveCreditAsync({ customer: buyer, total: 8000, storeId: 1 });
    assert.equal(first.ok, true);
    assert.equal(first.lockKey, `chk-credit-${applied.account.id}`, 'the account has its own lock');
    assert.ok(lockHistory().some((l) => l.key === `chk-credit-${applied.account.id}`));

    // the reservation counts against the credit as soon as it is taken
    await repository('Order').insertAsync({
      orderNumber: 'ONACCOUNT-1',
      paymentMethodSystemName: ON_ACCOUNT,
      paymentStatus: 'Pending',
      total: 8000,
      companyId: company.id,
      creditAccountId: applied.account.id,
    });
    const second = await reserveCreditAsync({ customer: buyer, total: 8000, storeId: 1 });
    assert.equal(second.ok, false, 'the second order would take the company over its limit');
    assert.equal(second.messageKey, 'Chk.CreditLimitExceeded');
    assert.equal(second.credit.unpaidOnAccountOrders, 8000, 'because the first order is not paid yet');
  });

  test('AC-CHK-016-02-02', async () => {
    // "On account is not offered; existing receivables are unchanged"
    const { company, buyer } = await companyAsync('suspended');
    const applied = await applyAsync({ companyId: company.id, customerId: buyer.id });
    const finance = await repository('Customer').getOneAsync((c) => c.email === 'finance@example.com');
    await decideCreditAsync({
      accountId: applied.account.id, decision: 'approve', creditLimit: 50000, paymentTermsDays: 30, actor: finance,
    });
    const suspended = await decideCreditAsync({
      accountId: applied.account.id, decision: 'suspend', reason: 'payments behind', actor: finance,
    });
    assert.equal(suspended.account.status, CREDIT_STATE.Suspended);

    const offer = await onAccountOfferAsync({ customer: buyer, total: 100, storeId: 1 });
    assert.equal(offer.offered, false);
    assert.match(offer.reason, /Suspended/);
    const account = await accountForCustomerAsync({ customer: buyer, storeId: 1 });
    assert.equal(account.creditLimit, 50000, 'the limit and what is owed are untouched');

    // a reason is needed to suspend, and finance can put it back
    const noReason = await decideCreditAsync({ accountId: applied.account.id, decision: 'suspend', actor: finance });
    assert.equal(noReason.ok, false);
    const back = await decideCreditAsync({ accountId: applied.account.id, decision: 'approve', actor: finance });
    assert.equal(back.account.status, CREDIT_STATE.Approved);
  });

  test('AC-CHK-016-03-03', async () => {
    // "On account is not offered when the client setting 'block when overdue' is on"
    const { company, buyer } = await companyAsync('overdue');
    const applied = await applyAsync({ companyId: company.id, customerId: buyer.id });
    const finance = await repository('Customer').getOneAsync((c) => c.email === 'finance@example.com');
    await decideCreditAsync({
      accountId: applied.account.id, decision: 'approve', creditLimit: 100000, paymentTermsDays: 30, actor: finance,
    });
    registerProvider('IC-PAY-08', {
      area: 'PAY',
      feature: 'PRD-PAY-033',
      name: 'overdue receivables',
      fn: async ({ account }) => (Number(account.companyId) === Number(company.id)
        ? { total: 1000, items: [{ amount: 1000, dueOnUtc: new Date(Date.now() - 30 * 86400000).toISOString() }] }
        : null),
    });

    const blocked = await withSettingAsync('chk.credit.blockwhenoverdue', true, async () => withSettingAsync('chk.credit.overduegracedays', 7, async () => onAccountOfferAsync({ customer: buyer, total: 100, storeId: 1 }), 1), 1);
    assert.equal(blocked.offered, false, 'the client blocks buying while receivables are overdue');
    assert.match(blocked.reason, /overdue/);

    const allowed = await withSettingAsync('chk.credit.blockwhenoverdue', false, async () => onAccountOfferAsync({ customer: buyer, total: 100, storeId: 1 }), 1);
    assert.equal(allowed.offered, true, 'and where the client does not block it, buying goes on');
  });
});

/* ====================================================== PRD-CHK-017 =================== */

describe('PRD-CHK-017 ordering by product code', () => {
  test('AC-CHK-017-01-01', async () => {
    // "each valid line is added through AddToCartAsync with stock and price checks; unknown SKUs
    //  are listed with message Chk.QuickOrderSkuNotFound and native warnings are listed per line"
    const { customer, sessionId } = await shopperAsync('quick-order');
    const [first, second] = await productsAsync();
    const result = await quickOrderAsync({
      sessionId,
      customer,
      storeId: 1,
      lines: [
        { sku: first.sku, quantity: 2 },
        { sku: second.sku, quantity: 1 },
        { sku: 'NOT-A-CODE', quantity: 5 },
      ],
    });
    assert.equal(result.ok, false, 'one line could not be added');
    assert.equal(result.added.length, 2);
    assert.equal(result.refused.length, 1);
    assert.equal(result.refused[0].messageKey, 'Chk.QuickOrderSkuNotFound');
    assert.equal(result.refused[0].message, 'Product code not found: NOT-A-CODE');
    assert.equal(result.addedThrough, 'the same AddToCartAsync as any other add');
    assert.equal(result.prototypeDefault, 'Prototype default - decision PH-INF pending');

    const cart = await getCartAsync({ sessionId, customer });
    assert.equal(cart.items.length, 2, 'the good lines are in the cart');
    assert.equal(cart.items.find((i) => i.productId === first.id).quantity, 2);

    // a line that breaks a check is listed with its own warnings
    const row = await repository('Product').getByIdAsync(first.id);
    await repository('Product').updateAsync({ ...row, stockQuantity: 0 });
    const { customer: other, sessionId: otherSession } = await shopperAsync('quick-order-stock');
    const refused = await quickOrderAsync({
      sessionId: otherSession, customer: other, storeId: 1, lines: [{ sku: first.sku, quantity: 1 }],
    });
    assert.equal(refused.added.length, 0);
    assert.ok(refused.refused[0].warnings.length >= 1, 'the native warning is shown for that line');
    await repository('Product').updateAsync({ ...row, stockQuantity: row.stockQuantity });
  });

  test('AC-CHK-017-02-01', async () => {
    // "the same per-line rules apply and a result list shows added and refused lines"
    const { customer, sessionId } = await shopperAsync('quick-order-file');
    const [first] = await productsAsync();
    const result = await quickOrderAsync({
      sessionId,
      customer,
      storeId: 1,
      file: {
        name: 'order.csv',
        content: `SKU,Quantity\n${first.sku},3\nUNKNOWN-1,2\n`,
      },
    });
    assert.equal(result.linesRead, 2, 'the header row is not an order line');
    assert.equal(result.added.length, 1);
    assert.equal(result.added[0].quantity, 3);
    assert.equal(result.refused.length, 1);
    assert.equal(result.refused[0].messageKey, 'Chk.QuickOrderSkuNotFound');
    assert.deepEqual(result.fileFormat.columns, ['SKU', 'Quantity']);
    assert.match(result.fileFormat.note, /Proposed/);
  });

  test('AC-CHK-017-03-01', async () => {
    // "all items are added through AddToCartAsync and any warnings are shown per item"
    const { customer, sessionId } = await shopperAsync('saved-lists');
    const [first, second] = await productsAsync();
    await addAsync(sessionId, first.id, 2);
    await addAsync(sessionId, second.id);

    const off = await withSettingAsync('shoppingcartsettings.allowmultiplewishlist', false, async () => savedListsAsync({ customer, storeId: 1 }), 1);
    assert.equal(off.offered, false, 'saved lists need the native setting');

    const saved = await saveListAsync({ customer, name: 'Monthly order', sessionId, storeId: 1 });
    assert.equal(saved.ok, true);
    const lists = await savedListsAsync({ customer, storeId: 1 });
    assert.equal(lists.offered, true);
    assert.equal(lists.lists[0].items, 2, 'the list holds what was in the cart');

    const { customer: again, sessionId: freshSession } = await shopperAsync('reorder');
    const copied = await repository('CustomWishlist').insertAsync({ customerId: again.id, name: 'Monthly order', storeId: 1 });
    for (const line of lists.lists[0].lines) {
      await repository('ShoppingCartItem').insertAsync({ ...line, id: undefined, customerId: again.id, customWishlistId: copied.id });
    }
    const added = await addListToCartAsync({
      listId: copied.id, sessionId: freshSession, customer: again, storeId: 1,
    });
    assert.equal(added.ok, true);
    assert.equal(added.added.length, 2, 'the whole list goes into the cart');
    assert.equal(added.addedThrough, 'the same AddToCartAsync as any other add');
    const cart = await getCartAsync({ sessionId: freshSession, customer: again });
    assert.equal(cart.items.length, 2);
  });
});

/* ====================================================== PRD-CHK-018 =================== */

describe('PRD-CHK-018 orders a colleague must approve', () => {
  test('AC-CHK-018-03-01', async () => {
    // "orders by users in that role above the threshold need approval; the change is audited"
    const { company, buyer } = await companyAsync('threshold');
    const rule = await saveRuleAsync({
      companyId: company.id, companyRole: 'CompanyBuyer', threshold: 5000, storeId: 1, actor: 'company.admin@example.com',
    });
    assert.equal(rule.ok, true);
    assert.equal(rule.prototypeDefault, APPROVAL_LABEL, 'the feature says which decisions are pending');

    const applies = await thresholdForAsync({ customer: buyer, storeId: 1 });
    assert.equal(applies.threshold, 5000, 'the buyer\'s own role decides the limit');
    assert.equal(applies.companyRole, 'CompanyBuyer');

    const trail = await auditTrailAsync({ event: 'AUD-CHK-001', entityId: rule.rule.id });
    assert.ok(trail.length >= 1, 'the change is audited');

    const changed = await saveRuleAsync({
      id: rule.rule.id, companyId: company.id, companyRole: 'CompanyBuyer', threshold: 9000, storeId: 1,
    });
    assert.equal(changed.rule.threshold, 9000);
    const after = await auditTrailAsync({ event: 'AUD-CHK-001', entityId: rule.rule.id });
    assert.ok(after.some((e) => e.before?.threshold === 5000), 'with the old value kept');
  });

  test('AC-CHK-018-01-01', async () => {
    // "a PurchaseApprovalRequest with the cart snapshot and total is created in state Pending
    //  and the approvers of the company are notified (ADM-006 queue)"
    const {
      company, buyer, buyerSession, approver,
    } = await companyAsync('submit');
    await saveRuleAsync({
      companyId: company.id, companyRole: 'CompanyBuyer', threshold: 1, storeId: 1,
    });
    const [product] = await productsAsync();
    await addAsync(buyerSession, product.id);
    const cart = await getCartAsync({ sessionId: buyerSession, customer: buyer });

    const submitted = await submitForApprovalAsync({ customer: buyer, cart, storeId: 1 });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request.status, REQUEST_STATE.Pending);
    assert.equal(submitted.request.total, cart.subtotal, 'the total is kept with the request');
    assert.deepEqual(submitted.request.cartSnapshot, cartSnapshot(cart).lines, 'and the cart it was asked for');
    assert.ok(submitted.queueItemId, 'the approvers see it in the approval queue');
    assert.equal(submitted.approversNotified, true);

    const item = await repository('ApprovalItem').getByIdAsync(submitted.queueItemId);
    assert.equal(item.objectType, 'PurchaseApprovalRequest');
    assert.equal(item.requesterEmail, buyer.email);
    assert.ok(approver, 'the company has an approver to decide it');
  });

  test('AC-CHK-018-01-02', async () => {
    // "the placement override refuses it with message Chk.ApprovalRequired"
    const { company, buyer, buyerSession } = await companyAsync('needs-approval');
    await saveRuleAsync({ companyId: company.id, companyRole: 'CompanyBuyer', threshold: 1, storeId: 1 });
    const [product] = await productsAsync();
    await addAsync(buyerSession, product.id);

    const before = (await repository('Order').getAllAsync()).length;
    const refused = await confirmAsync(buyerSession);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Chk.ApprovalRequired');
    assert.equal(refused.failures[0].message, 'This order needs approval from your company before it can be placed.');
    assert.equal((await repository('Order').getAllAsync()).length, before, 'no order is placed');

    const check = await approvalForCartAsync({
      customer: buyer, cart: await getCartAsync({ sessionId: buyerSession, customer: buyer }), storeId: 1,
    });
    assert.equal(check.required, true);
    assert.equal(check.ok, false);
  });

  test('AC-CHK-018-02-01', async () => {
    // "it becomes Approved; the buyer can place the order while the cart matches the snapshot;
    //  the approver cannot be the requester"
    const {
      company, buyer, buyerSession, approver,
    } = await companyAsync('approve');
    await saveRuleAsync({ companyId: company.id, companyRole: 'CompanyBuyer', threshold: 1, storeId: 1 });
    const [product] = await productsAsync();
    await addAsync(buyerSession, product.id);
    const cart = await getCartAsync({ sessionId: buyerSession, customer: buyer });
    const submitted = await submitForApprovalAsync({ customer: buyer, cart, storeId: 1 });

    const bySelf = await decideRequestAsync({
      requestId: submitted.request.id, decision: 'approve', approver: buyer,
    });
    assert.equal(bySelf.ok, false, 'the person who asked cannot approve it');
    assert.match(bySelf.message, /cannot approve their own/);

    const decided = await decideRequestAsync({
      requestId: submitted.request.id, decision: 'approve', approver,
    });
    assert.equal(decided.ok, true);
    assert.equal(decided.request.status, REQUEST_STATE.Approved);

    const placed = await confirmAsync(buyerSession);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'placed');
  });

  test('AC-CHK-018-02-02', async () => {
    // "a reason is mandatory, the request becomes Rejected and the buyer is notified with the
    //  reason"
    const {
      company, buyer, buyerSession, approver,
    } = await companyAsync('reject');
    await saveRuleAsync({ companyId: company.id, companyRole: 'CompanyBuyer', threshold: 1, storeId: 1 });
    const [product] = await productsAsync();
    await addAsync(buyerSession, product.id);
    const submitted = await submitForApprovalAsync({
      customer: buyer, cart: await getCartAsync({ sessionId: buyerSession, customer: buyer }), storeId: 1,
    });

    const noReason = await decideRequestAsync({
      requestId: submitted.request.id, decision: 'reject', approver,
    });
    assert.equal(noReason.ok, false, 'a rejection needs a reason');
    assert.match(noReason.message, /reason/);

    const rejected = await decideRequestAsync({
      requestId: submitted.request.id, decision: 'reject', approver, reason: 'we already have these in stock',
    });
    assert.equal(rejected.ok, true);
    assert.equal(rejected.request.status, REQUEST_STATE.Rejected);
    assert.equal(rejected.request.reason, 'we already have these in stock');
    assert.equal(rejected.buyerNotified, true, 'the buyer hears about it');
    assert.match(rejected.notifiedThrough, /approval queue/);

    const refused = await confirmAsync(buyerSession);
    assert.equal(refused.ok, false, 'and the order still cannot be placed');
    assert.equal(refused.messageKey, 'Chk.ApprovalRequired');
  });

  test('AC-CHK-018-01-03', async () => {
    // "the approval becomes Void and approval is required again"
    const {
      company, buyer, buyerSession, approver,
    } = await companyAsync('void');
    await saveRuleAsync({ companyId: company.id, companyRole: 'CompanyBuyer', threshold: 1, storeId: 1 });
    const [first, second] = await productsAsync();
    await addAsync(buyerSession, first.id);
    const submitted = await submitForApprovalAsync({
      customer: buyer, cart: await getCartAsync({ sessionId: buyerSession, customer: buyer }), storeId: 1,
    });
    await decideRequestAsync({ requestId: submitted.request.id, decision: 'approve', approver });

    // the buyer adds something after the approval was given
    await addAsync(buyerSession, second.id);
    const check = await approvalForCartAsync({
      customer: buyer, cart: await getCartAsync({ sessionId: buyerSession, customer: buyer }), storeId: 1,
    });
    assert.equal(check.ok, false, 'the approval no longer covers this cart');
    assert.equal(check.voided, 1);
    assert.equal(check.messageKey, 'Chk.ApprovalRequired');

    const stale = await repository('PurchaseApprovalRequest').getByIdAsync(submitted.request.id);
    assert.equal(stale.status, REQUEST_STATE.Void);

    const refused = await confirmAsync(buyerSession);
    assert.equal(refused.ok, false, 'and the order needs approval again');
    assert.equal(refused.messageKey, 'Chk.ApprovalRequired');

    // the client may also expire requests nobody decided
    const expiry = await withSettingAsync('chk.approval.expirydays', 0, async () => expireRequestsAsync({ storeId: 1, now: new Date(Date.now() + 86400000).toISOString() }), 1);
    assert.equal(expiry.expiryConfigured, true);
  });
});
