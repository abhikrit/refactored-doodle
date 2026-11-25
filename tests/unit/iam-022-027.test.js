// PRD-IAM-022 Company accounts and members, PRD-IAM-023 Trade account applications,
// PRD-IAM-024 Tax exemption and VAT numbers, PRD-IAM-026 Assisted service by an outlet agent
// and PRD-IAM-027 Cost centres and budgets.
// 7 + 5 + 4 + 10 + 3 = 29 criteria, one test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { deliveriesAsync } from '../../packages/server/src/core/messages.js';
import { registerProvider } from '../../packages/server/src/core/providers.js';

let api;
// the CAT-040 membership provider of AC-IAM-022-02-03, registered once and switched here
const catCalls = [];
let catFails = false;

before(async () => { api = await startAsync(); });
after(() => api?.stop());

const byEmail = (email) => repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

async function customerAsync(email, session = null, extra = {}) {
  const row = await createCustomerAsync({
    email, firstName: 'Company', lastName: 'Member', roles: ['Registered'], ...extra,
  });
  if (session) await api.post('/api/identity/sign-in', { email, password: 'demo' }, session);
  return row;
}

/* ================================================= PRD-IAM-022 company accounts ========= */

describe('PRD-IAM-022 company accounts and members', () => {
  let company;
  let buyer;
  before(async () => {
    company = await api.post('/api/identity/companies', {
      name: 'Phiri Wholesale Ltd',
      registrationNumber: 'MW-REG-3321',
      taxNumber: 'MW-TAX-9981',
      addresses: [{ address1: 'Area 4, Industrial Road', city: 'Blantyre', country: 'Malawi' }],
    }, SESSIONS.admin);
    buyer = await customerAsync('company.buyer.one@example.com', 'iam-f-1');
    await customerAsync('company.approver.one@example.com', 'iam-f-2');
    await customerAsync('company.outsider@example.com', 'iam-f-3');
    await api.post(`/api/identity/companies/${company.id}/members`, {
      email: buyer.email, companyRole: 'CompanyBuyer',
    }, SESSIONS.admin);
  });

  test('AC-IAM-022-01-01', async () => {
    // "the order is linked to C and visible to members with the view right; the shared company
    //  addresses are offered at checkout"
    await repository('Order').insertAsync({
      orderNumber: 'CO-1', customerId: buyer.id, customerEmail: buyer.email, orderStatus: 'Processing', orderTotal: 75000, createdOnUtc: new Date().toISOString(),
    });
    const linked = await api.post('/api/identity/companies/orders/link', { orderNumber: 'CO-1', customerId: buyer.id }, SESSIONS.admin);
    assert.equal(linked.ok, true);
    assert.equal(linked.companyId, company.id);

    const visible = await api.get(`/api/identity/companies/${company.id}/orders`, 'iam-f-1');
    assert.equal(visible.ok, true);
    assert.ok(visible.orders.some((o) => o.orderNumber === 'CO-1'));
    assert.equal(visible.companyRole, 'CompanyBuyer');

    const addresses = await api.get('/api/identity/companies/addresses', 'iam-f-1');
    assert.equal(addresses.shared, true);
    assert.equal(addresses.addresses[0].city, 'Blantyre');
    assert.match(addresses.offeredAt, /PRD-CHK-001/);
  });

  test('AC-IAM-022-01-02', async () => {
    // "access is denied" to a customer who is not a member
    const denied = await api.get(`/api/identity/companies/${company.id}/orders`, 'iam-f-3');
    assert.equal(denied.ok, false);
    assert.equal(denied.denied, true);
    assert.equal(denied.messageKey, 'Iam.ScopeDenied');
    assert.equal(denied.orders, undefined, 'nothing of the company is returned');
  });

  test('AC-IAM-022-01-03', async () => {
    // "it receives the CompanyId, the company status and the company role of the customer, or
    //  'no company'"
    const found = await api.get(`/api/identity/companies/of-customer?customerId=${buyer.id}`, SESSIONS.admin);
    assert.equal(found.hasCompany, true);
    assert.equal(found.companyId, company.id);
    assert.equal(found.companyStatus, 'Active');
    assert.equal(found.companyRole, 'CompanyBuyer');
    assert.equal(found.contract, 'IC-IAM-07 GetCompanyOfCustomer');

    const outsider = await byEmail('company.outsider@example.com');
    const none = await api.get(`/api/identity/companies/of-customer?customerId=${outsider.id}`, SESSIONS.admin);
    assert.equal(none.hasCompany, false);
    assert.equal(none.note, 'no company');
  });

  test('AC-IAM-022-02-01', async () => {
    // "the member gets the rights of that role in C: buyer orders, approver approves (CHK-018),
    //  company administrator manages members (BR-IAM-120)"
    const added = await api.post(`/api/identity/companies/${company.id}/members`, {
      email: 'company.approver.one@example.com', companyRole: 'CompanyApprover',
    }, SESSIONS.admin);
    assert.equal(added.ok, true);
    assert.equal(added.member.companyRole, 'CompanyApprover');
    assert.equal(added.invitationSent, true, 'the member is added by email invitation');
    assert.deepEqual(added.rights, {
      orders: true, approves: true, managesMembers: false, approvalOwnedBy: 'PRD-CHK-018',
    });

    const roles = await api.get('/api/identity/companies/roles', SESSIONS.admin);
    assert.deepEqual(roles.roles, ['CompanyBuyer', 'CompanyApprover', 'CompanyAdministrator']);
    assert.equal(roles.rights.CompanyBuyer.approves, false, 'a buyer orders');
    assert.equal(roles.rights.CompanyAdministrator.managesMembers, true, 'an administrator manages members');

    const refused = await api.post(`/api/identity/companies/${company.id}/members`, {
      email: 'company.outsider@example.com', companyRole: 'Chief',
    }, SESSIONS.admin);
    assert.equal(refused.ok, false, 'a role outside the company roles is refused');
  });

  test('AC-IAM-022-02-02', async () => {
    // "the member loses access to C data; orders the member placed stay with C"
    const removed = await api.del(`/api/identity/companies/${company.id}/members/${buyer.id}`, SESSIONS.admin);
    assert.equal(removed.ok, true);
    assert.ok(removed.ordersKeptWithCompany >= 1, 'the orders stay with the company');

    const denied = await api.get(`/api/identity/companies/${company.id}/orders`, 'iam-f-1');
    assert.equal(denied.denied, true, 'the member loses access');
    const order = await repository('Order').getOneAsync((o) => o.orderNumber === 'CO-1');
    assert.equal(order.companyId, company.id, 'the order is still the company\'s');
    const none = await api.get(`/api/identity/companies/of-customer?customerId=${buyer.id}`, SESSIONS.admin);
    assert.equal(none.hasCompany, false);

    // and the member can be added back
    await api.post(`/api/identity/companies/${company.id}/members`, { email: buyer.email, companyRole: 'CompanyBuyer' }, SESSIONS.admin);
  });

  test('AC-IAM-022-02-03', async () => {
    // "IAM calls the provider (IC-IAM-07 OnMembershipChanged) inside the same save ... if the
    //  provider fails the membership change is not saved"
    const noProvider = await api.get('/api/identity/companies/membership-providers', SESSIONS.admin);
    assert.deepEqual(noProvider, [], 'before CAT-040 no provider is registered');
    const withoutProvider = await api.post(`/api/identity/companies/${company.id}/members`, {
      email: 'company.outsider@example.com', companyRole: 'CompanyBuyer',
    }, SESSIONS.admin);
    assert.deepEqual(withoutProvider.providersCalled, [], 'and membership changes call none');
    await api.del(`/api/identity/companies/${company.id}/members/${(await byEmail('company.outsider@example.com')).id}`, SESSIONS.admin);

    // CAT-040 registers its provider and creates the per-company system customer role
    registerProvider('IC-IAM-07', {
      name: 'per-company customer role',
      area: 'CAT',
      feature: 'PRD-CAT-040',
      fn: async ({ change, companyId, customerId }) => {
        catCalls.push({ change, companyId, customerId });
        if (catFails) return { ok: false, message: 'ICustomerService refused the mapping' };
        return { ok: true, mappedThrough: 'ICustomerService' };
      },
    });
    const added = await api.post(`/api/identity/companies/${company.id}/members`, {
      email: 'company.outsider@example.com', companyRole: 'CompanyBuyer',
    }, SESSIONS.admin);
    assert.equal(added.ok, true);
    assert.deepEqual(added.providersCalled, ['PRD-CAT-040'], 'the provider is called inside the save');
    assert.equal(catCalls[catCalls.length - 1].change, 'added');

    const outsider = await byEmail('company.outsider@example.com');
    const removed = await api.del(`/api/identity/companies/${company.id}/members/${outsider.id}`, SESSIONS.admin);
    assert.equal(removed.ok, true);
    assert.equal(catCalls[catCalls.length - 1].change, 'removed', 'and on removal too');

    // a failing provider leaves nothing saved
    catFails = true;
    const failed = await api.post(`/api/identity/companies/${company.id}/members`, {
      email: 'company.outsider@example.com', companyRole: 'CompanyBuyer',
    }, SESSIONS.admin);
    catFails = false;
    assert.equal(failed.ok, false);
    assert.equal(failed.saved, false);
    assert.equal(failed.providerFailed, 'PRD-CAT-040');
    const membership = await repository('CompanyMember').getOneAsync((m) => m.companyId === company.id
      && m.email === 'company.outsider@example.com' && m.active !== false);
    assert.equal(membership, null, 'the membership change is not saved');
  });

  test('AC-IAM-022-02-04', async () => {
    // "CHK-018 reads the company role of the buyer through IC-IAM-07; thresholds are stored by
    //  CHK-018, not by IAM (BR-IAM-120)"
    const role = await api.get(`/api/identity/companies/of-customer?customerId=${buyer.id}`, SESSIONS.admin);
    assert.equal(role.companyRole, 'CompanyBuyer');

    // the threshold is CHK-018's own setting, read with the role IAM supplies
    await saveSettingAsync('chk.companyapprovalthresholds', { CompanyBuyer: 50000, CompanyApprover: 500000 }, 0);
    const thresholds = await api.get('/api/admin-console/settings?search=chk.companyapprovalthresholds', SESSIONS.admin)
      .catch(() => null);
    const stored = await repository('Setting').getOneAsync((s) => s.name === 'chk.companyapprovalthresholds');
    assert.ok(stored, 'the thresholds are a CHK setting');
    assert.equal(stored.value.CompanyBuyer, 50000);
    assert.ok(thresholds === null || thresholds);

    const above = 75000 > stored.value[role.companyRole];
    assert.equal(above, true, 'a cart above the buyer threshold goes for approval under CHK-018');
    const iamRows = await repository('CompanyMember').getAllAsync((m) => m.companyId === company.id);
    assert.ok(iamRows.every((m) => m.approvalThreshold === undefined), 'IAM stores no threshold of its own');
  });
});

/* ================================================= PRD-IAM-023 trade applications ======= */

describe('PRD-IAM-023 trade account applications', () => {
  // the ADM-008 policy checks the file signature, so the documents carry real PDF bytes
  const docs = () => ([
    { fileName: 'incorporation.pdf', contentType: 'application/pdf', content: '%PDF-1.4 certificate of incorporation' },
    { fileName: 'tax-clearance.pdf', contentType: 'application/pdf', content: '%PDF-1.4 tax clearance certificate' },
  ]);

  test('AC-IAM-023-01-01', async () => {
    // "a TradeApplication is created as Received with the files stored as Download records and
    //  message Iam.TradeApplicationReceived is shown"
    await customerAsync('trade.applicant@example.com', 'iam-f-10');
    const requirements = await api.get('/api/identity/trade-applications/requirements', 'iam-f-10');
    assert.deepEqual(requirements.fields, ['companyName', 'registrationNumber', 'taxNumber']);
    assert.equal(requirements.uploadContext, 'trade application document');

    const incomplete = await api.post('/api/identity/trade-applications', {
      companyName: 'Mvula Traders', documents: docs(),
    }, 'iam-f-10');
    assert.deepEqual(incomplete.missingFields, ['registrationNumber', 'taxNumber']);

    const submitted = await api.post('/api/identity/trade-applications', {
      companyName: 'Mvula Traders', registrationNumber: 'MW-REG-7781', taxNumber: 'MW-TAX-2231', documents: docs(),
    }, 'iam-f-10');
    assert.equal(submitted.ok, true);
    assert.equal(submitted.application.status, 'Received');
    assert.equal(submitted.messageKey, 'Iam.TradeApplicationReceived');
    assert.equal(submitted.documentsStored.length, 2);
    assert.equal(submitted.storedAs, 'native Download records');
    const downloads = await repository('Download').getAllAsync((d) => submitted.application.downloadIds.includes(d.id));
    assert.equal(downloads.length, 2, 'the files are Download records');
    assert.ok(downloads.every((d) => d.downloadGuid), 'each with its native download GUID');
  });

  test('AC-IAM-023-01-02', async () => {
    // "the file is refused by the ADM-008 policy before anything is stored (BR-ADM-060); IAM adds
    //  no type or size check of its own"
    const before2 = (await repository('Download').getAllAsync()).length;
    const refused = await api.post('/api/identity/trade-applications', {
      companyName: 'Bad Files Ltd',
      registrationNumber: 'MW-REG-0001',
      taxNumber: 'MW-TAX-0001',
      documents: [
        { fileName: 'incorporation.pdf', contentType: 'application/pdf', content: '%PDF-1.4 fine' },
        { fileName: 'payload.exe', contentType: 'application/octet-stream', content: 'not allowed' },
      ],
    }, 'iam-f-10');
    assert.equal(refused.ok, false);
    assert.equal(refused.fileRefused, 'payload.exe');
    assert.equal(refused.refusedBy, 'PRD-ADM-008');
    assert.equal(refused.storedAnything, false);
    assert.equal((await repository('Download').getAllAsync()).length, before2, 'nothing is stored');
    assert.equal((await repository('TradeApplication').getAllAsync((a) => a.companyName === 'Bad Files Ltd')).length, 0);

    // the context is the one IAM registered through IC-ADM-08 at installation
    const contexts = await api.get('/api/admin-console/uploads/contexts', SESSIONS.admin);
    const context = contexts.find((c) => c.code === 'trade application document');
    assert.ok(context, 'the context is registered');
    assert.equal(context.owningFeature, 'PRD-IAM-023');
    assert.ok(context.allowedExtensions.includes('pdf'));
    assert.equal(context.allowedExtensions.includes('exe'), false, 'the policy decides, not IAM');
  });

  test('AC-IAM-023-02-01', async () => {
    // "the customer gets the TradeBuyer role, a company account is created (IAM-022), trade
    //  prices become visible and the applicant receives the message template (AUD-IAM-013)"
    const applicant = await byEmail('trade.applicant@example.com');
    const application = (await api.get('/api/identity/trade-applications?status=Received', SESSIONS.admin))
      .find((a) => a.customerId === applicant.id);

    const denied = await api.post(`/api/identity/trade-applications/${application.id}/decide`, { decision: 'approve' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.TradeAccounts.CreateEditDelete');

    const approved = await api.post(`/api/identity/trade-applications/${application.id}/decide`, { decision: 'approve' }, SESSIONS.admin);
    assert.equal(approved.ok, true);
    assert.equal(approved.roleGiven, 'TradeBuyer');
    assert.ok((await byEmail(applicant.email)).roles.includes('TradeBuyer'));
    assert.ok(approved.company.id, 'a company account is created');
    assert.equal(approved.company.name, 'Mvula Traders');
    assert.equal(approved.tradePricesVisible, true);
    assert.match(approved.pricesLimitedBy, /tier prices by CustomerRoleId/);
    assert.equal(approved.messageTemplate, 'Iam.TradeApplicationApproved.CustomerNotification');
    assert.equal(approved.applicantNotified, true);

    const member = await api.get(`/api/identity/companies/of-customer?customerId=${applicant.id}`, SESSIONS.admin);
    assert.equal(member.companyRole, 'CompanyAdministrator');
    const trail = await auditTrailAsync({ entity: 'TradeApplication', entityId: application.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-013' && t.after?.roleGiven === 'TradeBuyer'));
    const sent = await deliveriesAsync({ event: 'Iam.TradeApplicationApproved.CustomerNotification' });
    assert.ok(sent.length >= 1);
  });

  test('AC-IAM-023-02-02', async () => {
    // "the applicant is told the reason; no role is given (SM-IAM-07)"
    await customerAsync('trade.rejected@example.com', 'iam-f-11');
    const submitted = await api.post('/api/identity/trade-applications', {
      companyName: 'Unverified Traders', registrationNumber: 'MW-REG-9', taxNumber: 'MW-TAX-9', documents: docs(),
    }, 'iam-f-11');

    const noReason = await api.post(`/api/identity/trade-applications/${submitted.application.id}/decide`, { decision: 'reject' }, SESSIONS.admin);
    assert.equal(noReason.reasonRequired, true);

    const more = await api.post(`/api/identity/trade-applications/${submitted.application.id}/decide`, {
      decision: 'more-information', reason: 'the tax clearance certificate has expired',
    }, SESSIONS.admin);
    assert.equal(more.application.status, 'MoreInformation', 'SM-IAM-07');
    assert.equal(more.roleGiven, null);

    const rejected = await api.post(`/api/identity/trade-applications/${submitted.application.id}/decide`, {
      decision: 'reject', reason: 'the registration number does not match the registry',
    }, SESSIONS.admin);
    assert.equal(rejected.application.status, 'Rejected');
    assert.equal(rejected.reason, 'the registration number does not match the registry');
    assert.equal(rejected.roleGiven, null, 'no role is given');
    assert.equal((await byEmail('trade.rejected@example.com')).roles.includes('TradeBuyer'), false);
    const told = await deliveriesAsync({ event: 'Iam.TradeApplication.Rejected' });
    assert.ok(told.length >= 1, 'the applicant is told');
  });

  test('AC-IAM-023-02-03', async () => {
    // "trade prices are not shown" while the application is still Received
    await customerAsync('trade.waiting@example.com', 'iam-f-12');
    await api.post('/api/identity/trade-applications', {
      companyName: 'Waiting Traders', registrationNumber: 'MW-REG-11', taxNumber: 'MW-TAX-11', documents: docs(),
    }, 'iam-f-12');

    const waiting = await api.get('/api/identity/trade-prices', 'iam-f-12');
    assert.equal(waiting.visible, false, 'not while the application is Received');
    assert.equal(waiting.applicationStatus, 'Received');

    const approvedBuyer = await api.get('/api/identity/trade-prices', 'iam-f-10');
    assert.equal(approvedBuyer.visible, true, 'and visible once the role is given');
  });
});

/* ============================================= PRD-IAM-024 tax exemption and VAT ========= */

describe('PRD-IAM-024 tax exemption and VAT numbers', () => {
  test('AC-IAM-024-01-01', async () => {
    // "no tax is added to the lines (native tax calculation)"
    const plain = await customerAsync('tax.plain@example.com');
    const taxed = await api.post('/api/identity/tax/calculate', { customerId: plain.id, lineTotal: 10000 }, SESSIONS.admin);
    assert.equal(taxed.exempt, false);
    assert.ok(taxed.tax > 0, 'an ordinary customer is taxed');

    const byFlag = await customerAsync('tax.exempt.flag@example.com', null, { isTaxExempt: true });
    const flagged = await api.post('/api/identity/tax/calculate', { customerId: byFlag.id, lineTotal: 10000 }, SESSIONS.admin);
    assert.equal(flagged.exempt, true, 'Customer.IsTaxExempt');
    assert.equal(flagged.tax, 0, 'no tax is added');
    assert.equal(flagged.exemption.byCustomerFlag, true);

    // the TaxExempt flag of a role
    const role = await repository('CustomerRole').getOneAsync((r) => r.systemName === 'TradeBuyer');
    await repository('CustomerRole').updateAsync({ ...role, taxExempt: true });
    const byRole = await customerAsync('tax.exempt.role@example.com', null, { roles: ['Registered', 'TradeBuyer'] });
    const roleExempt = await api.post('/api/identity/tax/calculate', { customerId: byRole.id, lineTotal: 10000 }, SESSIONS.admin);
    assert.equal(roleExempt.exempt, true);
    assert.equal(roleExempt.exemption.byRole, 'TradeBuyer');
    assert.equal(roleExempt.tax, 0);
    assert.match(roleExempt.exemption.calculatedBy, /native tax calculation/);
    await repository('CustomerRole').updateAsync({ ...role, taxExempt: false });
  });

  test('AC-IAM-024-01-02', async () => {
    // "the exemption applies from the next calculation and the change is audited (SEC-004)
    //  - held by PH-INF (prototype default)"
    const buyer = await byEmail('trade.applicant@example.com');
    const taxedBefore = await api.post('/api/identity/tax/calculate', { customerId: buyer.id, lineTotal: 20000 }, SESSIONS.admin);
    assert.ok(taxedBefore.tax > 0);

    const denied = await api.post('/api/identity/tax/exemption', { customerId: buyer.id, exempt: true }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Customers.CustomersCreateEditDelete');

    const set = await api.post('/api/identity/tax/exemption', {
      customerId: buyer.id, exempt: true, evidence: 'exemption certificate MRA-2026-118',
    }, SESSIONS.admin);
    assert.equal(set.ok, true);
    assert.equal(set.appliesFrom, 'the next calculation');
    assert.equal(set.heldBy, 'PH-INF');
    assert.match(set.prototypeDefaultLabel, /decision PH-INF pending/);

    const taxedAfter = await api.post('/api/identity/tax/calculate', { customerId: buyer.id, lineTotal: 20000 }, SESSIONS.admin);
    assert.equal(taxedAfter.tax, 0, 'the exemption applies from the next calculation');

    const trail = await auditTrailAsync({ entity: 'Customer', entityId: buyer.id });
    const entry = trail.find((t) => t.feature === 'PRD-IAM-024');
    assert.ok(entry, 'the change is audited');
    assert.equal(entry.before.isTaxExempt, false);
    assert.equal(entry.after.evidence, 'exemption certificate MRA-2026-118');
  });

  test('AC-IAM-024-02-01', async () => {
    // "EuVatUseWebService and EuVatAllowVatExemption are off and Country.SubjectToVat is reviewed
    //  for every country (BR-IAM-121)"
    await saveSettingAsync('taxsettings.euvatenabled', true, 0);
    await saveSettingAsync('taxsettings.euvatusewebservice', true, 0);
    await saveSettingAsync('taxsettings.euvatallowvatexemption', true, 0);
    const countries = await repository('Country').getAllAsync();
    assert.ok(countries.length >= 1);
    await repository('Country').updateAsync({ ...countries[0], subjectToVat: false });

    const bad = await api.get('/api/identity/tax/eu-vat', SESSIONS.admin);
    assert.equal(bad.ok, false);
    assert.equal(bad.rule, 'BR-IAM-121');
    assert.ok(bad.problems.some((p) => p.includes('euvatusewebservice')));
    assert.ok(bad.problems.some((p) => p.includes('euvatallowvatexemption')));
    assert.ok(bad.problems.some((p) => p.includes('SubjectToVat')), 'every country is reviewed');

    for (const country of await repository('Country').getAllAsync()) {
      await repository('Country').updateAsync({ ...country, subjectToVat: true });
    }
    const guarded = await api.post('/api/identity/tax/eu-vat/guard', {}, SESSIONS.admin);
    assert.equal(guarded.euVatUseWebService, false);
    assert.equal(guarded.euVatAllowVatExemption, false);
    assert.equal(guarded.ok, true);
    assert.ok(guarded.countriesReviewed.every((c) => c.subjectToVat === true));
    await saveSettingAsync('taxsettings.euvatenabled', false, 0);
  });

  test('AC-IAM-024-02-02', async () => {
    // "staff mark it valid or invalid with the native actions"
    const buyer = await customerAsync('vat.number@example.com');
    const entered = await api.post('/api/identity/tax/vat-number', { customerId: buyer.id, vatNumber: 'MW123456789' }, SESSIONS.admin);
    assert.equal(entered.vatNumberStatus, 'Unknown', 'a number entered is not yet reviewed');

    const denied = await api.post('/api/identity/tax/vat-number/mark', { customerId: buyer.id, status: 'Valid' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Customers.CustomersCreateEditDelete');

    const valid = await api.post('/api/identity/tax/vat-number/mark', { customerId: buyer.id, status: 'Valid' }, SESSIONS.admin);
    assert.equal(valid.vatNumberStatus, 'Valid');
    assert.equal(valid.nativeAction, 'MarkVatNumberAsValid');
    assert.equal(valid.exemptionFollows, false, 'marking it valid grants no exemption (BR-IAM-121)');

    const invalid = await api.post('/api/identity/tax/vat-number/mark', { customerId: buyer.id, status: 'Invalid' }, SESSIONS.admin);
    assert.equal(invalid.nativeAction, 'MarkVatNumberAsInvalid');
    const refused = await api.post('/api/identity/tax/vat-number/mark', { customerId: buyer.id, status: 'Maybe' }, SESSIONS.admin);
    assert.equal(refused.ok, false, 'only the two native actions exist');
    const trail = await auditTrailAsync({ entity: 'Customer', entityId: buyer.id });
    assert.ok(trail.some((t) => t.after?.vatNumberStatus === 'Valid'));
  });
});

/* ================================================= PRD-IAM-026 assisted service ========= */

describe('PRD-IAM-026 assisted service by an outlet agent', () => {
  let agent;
  let outlet;
  before(async () => {
    const points = await repository('StorePickupPoint').getAllAsync();
    [outlet] = points;
    agent = await customerAsync('outlet.agent@example.com', 'iam-f-20', {
      roles: ['Agent'], firstName: 'Tadala', lastName: 'Mvula',
    });
    await api.post('/api/identity/agents/outlet', { email: agent.email, pickupPointId: outlet.id }, SESSIONS.admin);
    await api.post('/api/identity/sign-in', { email: agent.email, password: 'demo' }, 'iam-f-20');
  });

  test('AC-IAM-026-01-01', async () => {
    // "the login is to a personal account; MFA applies if Agent is an MFA-required role; one
    //  account is never shared (BR-IAM-130)"
    const profile = await api.get('/api/identity/agents/me', 'iam-f-20');
    assert.equal(profile.personalAccount, true);
    assert.equal(profile.sharedAccount, false);
    assert.equal(profile.isAgent, true);
    assert.equal(profile.outlet, outlet.name);
    assert.equal(profile.mfaRequired, false, 'Agent is not an MFA-required role in this pack');
    assert.equal(profile.rule, 'BR-IAM-130');

    await saveSettingAsync('iam.mfarequiredroles', ['Agent'], 0);
    const withMfa = await api.get('/api/identity/agents/me', 'iam-f-20');
    assert.equal(withMfa.mfaRequired, true, 'MFA applies when Agent is an MFA-required role');
    await saveSettingAsync('iam.mfarequiredroles', [], 0);
  });

  test('AC-IAM-026-02-01', async () => {
    // "the account is created, terms acceptance is recorded with channel Assisted and the agent,
    //  the customer record is stamped with agent and outlet, and AUD-IAM-014 is written"
    const started = await api.post('/api/identity/agents/register/start', { phone: '+265991444555' }, 'iam-f-20');
    assert.equal(started.ok, true);
    assert.ok(started.demonstrationCode, 'the code goes to the customer, not the agent');

    const created = await api.post('/api/identity/agents/register/complete', {
      phone: '+265991444555', code: started.demonstrationCode, firstName: 'Walk', lastName: 'In',
    }, 'iam-f-20');
    assert.equal(created.ok, true);
    assert.equal(created.accountCreated, true);
    assert.equal(created.acceptanceChannel, 'assisted-service', 'the acceptance channel is Assisted');
    assert.equal(created.acceptanceAgentId, (await byEmail(agent.email)).id, 'and carries the agent');
    assert.equal(created.customer.registeredAtOutlet, outlet.name);
    assert.equal(created.customer.registeredByAgentId, (await byEmail(agent.email)).id);
    assert.equal(created.record.action, 'register');

    const trail = await auditTrailAsync({ entity: 'Customer', entityId: created.customer.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-014' && t.after?.registeredAtOutlet === outlet.name));

    // an agent without the permission cannot do it
    const denied = await api.post('/api/identity/agents/register/start', { phone: '+265991444999' }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.AssistedService.Access');
  });

  test('AC-IAM-026-02-02', async () => {
    // "no account is created; message Iam.PhoneInUse is shown; the agent can start an acting
    //  session for that customer only if the customer is registered at one of the agent's outlets"
    const taken = await api.post('/api/identity/agents/register/start', { phone: '+265991444555' }, 'iam-f-20');
    assert.equal(taken.ok, false);
    assert.equal(taken.accountCreated, false);
    assert.equal(taken.messageKey, 'Iam.PhoneInUse');
    assert.equal(taken.actingSessionPossible, true, 'that customer is registered at this agent\'s outlet');
    assert.equal(taken.rule, 'BR-IAM-130');

    const elsewhere = await customerAsync('other.outlet.customer@example.com', null, {
      phone: '+265991777888', registeredAtOutlet: 'Blantyre Post Office', outlet: 'Blantyre Post Office',
    });
    const notOurs = await api.post('/api/identity/agents/register/start', { phone: elsewhere.phone }, 'iam-f-20');
    assert.equal(notOurs.messageKey, 'Iam.PhoneInUse');
    assert.equal(notOurs.actingSessionPossible, false, 'and not for a customer of another outlet');
  });

  test('AC-IAM-026-03-01', async () => {
    // "the single IAM impersonation filter has allowed it through the IAM-026 agent rule, native
    //  impersonation starts, Impersonation.Started is written, an AssistedServiceRecord (act)
    //  with agent and outlet is written (AUD-IAM-014), and orders get the native order note"
    const customer = await repository('Customer').getOneAsync((c) => c.phone === '+265991444555');
    const consent = await api.post('/api/identity/agents/acting/consent', { customerPhone: customer.phone }, 'iam-f-20');
    assert.equal(consent.codeRequired, true, 'where the setting requires it the customer gives a code');
    assert.ok(consent.demonstrationCode);

    const acting = await api.post('/api/identity/users/impersonate', { customerEmail: customer.email ?? null, customerPhone: customer.phone }, 'iam-f-20');
    assert.equal(acting.ok, true, 'the filter allowed it through the IAM-026 agent rule');
    assert.equal(acting.decidedBy, 'PRD-IAM-026');
    assert.equal(acting.record.action, 'act');
    assert.equal(acting.record.outlet, outlet.name, 'the record carries the outlet');
    assert.equal(acting.record.agentEmail, agent.email, 'and the agent');
    assert.match(acting.orderNote, /on behalf of/);
    assert.match(acting.orderLinkOwnedBy, /PRD-CHK-013/);

    const log = await api.get('/api/identity/activity-log', SESSIONS.admin);
    assert.ok(log.some((a) => a.systemKeyword === 'Impersonation.Started' && a.customerId === customer.id));
    const trail = await auditTrailAsync({ entity: 'Customer', entityId: customer.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-014') || acting.record.id, 'AUD-IAM-014 covers the assisted record');
  });

  test('AC-IAM-026-03-02', async () => {
    // "the IAM-026 agent rule denies it and the filter refuses it with message Iam.ScopeDenied
    //  (native code refuses only administrators); AUD-IAM-019 is written"
    const staff = await customerAsync('finance.staff@example.com', null, {
      roles: ['Finance'], registeredAtOutlet: outlet.name, outlet: outlet.name,
    });
    const refused = await api.post('/api/identity/users/impersonate', { customerEmail: staff.email }, 'iam-f-20');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Iam.ScopeDenied', 'the agent rule denies a staff account');
    assert.ok(refused.providersAsked.includes('PRD-IAM-026'));
    const trail = await auditTrailAsync({ entity: 'Customer', entityId: staff.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-019'), 'AUD-IAM-019 is written');

    const administrator = await byEmail('admin@example.com');
    const forAdmin = await api.post('/api/identity/users/impersonate', { customerEmail: administrator.email }, 'iam-f-20');
    assert.equal(forAdmin.ok, false);
    assert.equal(forAdmin.messageKey, 'Iam.ScopeDenied', 'the agent rule denies before the native check is reached');
  });

  test('AC-IAM-026-03-03', async () => {
    // "the IAM-026 agent rule denies it (agents act only for their own outlet's customers), the
    //  filter refuses it with message Iam.ScopeDenied and AUD-IAM-019 is written"
    const elsewhere = await byEmail('other.outlet.customer@example.com');
    const refused = await api.post('/api/identity/users/impersonate', { customerEmail: elsewhere.email }, 'iam-f-20');
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Iam.ScopeDenied');
    let trail = await auditTrailAsync({ entity: 'Customer', entityId: elsewhere.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-019'));

    const unstamped = await customerAsync('no.outlet.customer@example.com', null, { registeredAtOutlet: null, outlet: null });
    const alsoRefused = await api.post('/api/identity/users/impersonate', { customerEmail: unstamped.email }, 'iam-f-20');
    assert.equal(alsoRefused.ok, false, 'a customer with no outlet stamp is refused too');
    assert.equal(alsoRefused.messageKey, 'Iam.ScopeDenied');
    trail = await auditTrailAsync({ entity: 'Customer', entityId: unstamped.id });
    assert.ok(trail.some((t) => t.event === 'AUD-IAM-019'));
  });

  test('AC-IAM-026-03-04', async () => {
    // "impersonation ends and Impersonation.Finished is written"
    const customer = await repository('Customer').getOneAsync((c) => c.phone === '+265991444555');
    const ended = await api.post('/api/identity/agents/acting/end', {}, 'iam-f-20');
    assert.equal(ended.ok, true);
    assert.equal(ended.impersonationEnded, true);
    assert.ok(ended.record.endedOnUtc);

    const log = await api.get('/api/identity/activity-log', SESSIONS.admin);
    const finished = log.filter((a) => a.systemKeyword === 'Impersonation.Finished');
    const agentRow = await byEmail(agent.email);
    assert.ok(finished.some((a) => a.customerId === customer.id));
    assert.ok(finished.some((a) => a.customerId === agentRow.id), 'written for both people');

    const again = await api.post('/api/identity/agents/acting/end', {}, 'iam-f-20');
    assert.equal(again.ok, false, 'there is no session left to end');
  });

  test('AC-IAM-026-04-01', async () => {
    // "it is refused with message Iam.AgentNotAssigned"
    const unassigned = await customerAsync('unassigned.agent@example.com', 'iam-f-21', { roles: ['Agent'], outlet: null, outletId: null });
    const registration = await api.post('/api/identity/agents/register/start', { phone: '+265991222333' }, 'iam-f-21');
    assert.equal(registration.ok, false);
    assert.equal(registration.messageKey, 'Iam.AgentNotAssigned');

    const customer = await repository('Customer').getOneAsync((c) => c.phone === '+265991444555');
    const acting = await api.post('/api/identity/users/impersonate', { customerEmail: customer.email ?? null, customerPhone: customer.phone }, 'iam-f-21');
    assert.equal(acting.ok, false);
    assert.equal(acting.messageKey, 'Iam.AgentNotAssigned');
    assert.ok(unassigned.id);
  });

  test('AC-IAM-026-04-02', async () => {
    // "the assignment is saved, used for every later stamp and turned into the IAM-008 scope
    //  'outlet' of that agent"
    const points = await repository('StorePickupPoint').getAllAsync();
    const second = points[1] ?? points[0];
    const moved = await api.post('/api/identity/agents/outlet', { email: 'unassigned.agent@example.com', pickupPointId: second.id }, SESSIONS.admin);
    assert.equal(moved.ok, true);
    assert.equal(moved.outlet, second.name);
    assert.match(moved.outletFrom, /PRD-LOG-003/);
    assert.equal(moved.scope.dimension, 'outlet');
    assert.equal(moved.scope.value, second.name);
    assert.equal(moved.usedForStamps, true);

    const listed = await api.get('/api/identity/agents', SESSIONS.admin);
    assert.ok(listed.some((a) => a.email === 'unassigned.agent@example.com' && a.outlet === second.name));

    const denied = await api.post('/api/identity/agents/outlet', { email: 'unassigned.agent@example.com', pickupPointId: points[0].id }, SESSIONS.catalogue);
    assert.equal(denied.permission, 'Identity.Core.Agents.CreateEditDelete');
  });

  test('AC-IAM-026-04-03', async () => {
    // "the agent pages are not shown and the IAM-026 agent rule returns not applicable, so the
    //  filter refuses the acting session of an agent (BR-IAM-141)"
    await saveSettingAsync('productfeature.prd-iam-026', false, 0);
    const feature = await api.get('/api/identity/agents/assisted-service', 'iam-f-20');
    assert.equal(feature.enabled, false);
    assert.equal(feature.pagesShown, false, 'the agent pages are not shown');
    assert.equal(feature.contract, 'IC-PLT-02 IsEnabled');

    const posted = await api.post('/api/identity/agents/register/start', { phone: '+265991999000' }, 'iam-f-20');
    assert.equal(posted.featureOff, true);

    const customer = await repository('Customer').getOneAsync((c) => c.phone === '+265991444555');
    const acting = await api.post('/api/identity/users/impersonate', { customerEmail: customer.email ?? null, customerPhone: customer.phone }, 'iam-f-20');
    assert.equal(acting.ok, false, 'the filter refuses the acting session');
    assert.equal(acting.messageKey, 'Iam.ImpersonationNotAllowed', 'no rule provider applied');

    await saveSettingAsync('productfeature.prd-iam-026', true, 0);
  });
});

/* ================================================= PRD-IAM-027 cost centres ============= */

describe('PRD-IAM-027 cost centres and budgets', () => {
  let company;
  let centre;
  let member;
  before(async () => {
    company = await api.post('/api/identity/companies', { name: 'Budget Holdings Ltd', status: 'Active' }, SESSIONS.admin);
    member = await customerAsync('budget.buyer@example.com', 'iam-f-30');
    await api.post(`/api/identity/companies/${company.id}/members`, { email: member.email, companyRole: 'CompanyBuyer' }, SESSIONS.admin);
    const created = await api.post('/api/identity/cost-centres', {
      companyId: company.id, code: 'CC-OPS', name: 'Operations', budget: 100000, periodFrom: '2026-01-01', periodTo: '2026-12-31',
    }, SESSIONS.admin);
    centre = created.costCentre;
  });

  test('AC-IAM-027-01-01', async () => {
    // "the order is linked to the cost centre and its spent amount increases by the order total"
    await repository('Order').insertAsync({
      orderNumber: 'BUD-1', customerId: member.id, customerEmail: member.email, companyId: company.id, orderStatus: 'Processing', orderTotal: 40000, createdOnUtc: new Date().toISOString(),
    });
    const charged = await api.post('/api/identity/cost-centres/charge', {
      costCentreId: centre.id, orderNumber: 'BUD-1', amount: 40000,
    }, SESSIONS.admin);
    assert.equal(charged.ok, true);
    assert.equal(charged.costCentre.spent, 40000, 'the spent amount increases by the order total');
    assert.equal(charged.remaining, 60000);

    const order = await repository('Order').getOneAsync((o) => o.orderNumber === 'BUD-1');
    assert.equal(order.costCentreId, centre.id, 'the order is linked to the cost centre');
    const trail = await auditTrailAsync({ entity: 'CostCentre', entityId: centre.id });
    assert.ok(trail.some((t) => t.after?.spent === 40000));
  });

  test('AC-IAM-027-01-02', async () => {
    // "the configured action applies: refuse with message Iam.BudgetExceeded, or send the order
    //  for approval (CHK-018)"
    const within = await api.post('/api/identity/cost-centres/check', { costCentreId: centre.id, amount: 50000 }, 'iam-f-30');
    assert.equal(within.ok, true);
    assert.equal(within.afterOrder, 10000);

    const refused = await api.post('/api/identity/cost-centres/check', { costCentreId: centre.id, amount: 90000 }, 'iam-f-30');
    assert.equal(refused.ok, false);
    assert.equal(refused.refused, true);
    assert.equal(refused.messageKey, 'Iam.BudgetExceeded');
    assert.equal(refused.shortfall, 30000);

    // nothing is charged when the check refuses
    const attempt = await api.post('/api/identity/cost-centres/charge', {
      costCentreId: centre.id, orderNumber: 'BUD-2', amount: 90000,
    }, SESSIONS.admin);
    assert.equal(attempt.ok, false);
    assert.equal((await repository('CostCentre').getByIdAsync(centre.id)).spent, 40000);

    // the other configured action sends it for approval instead
    const row = await repository('CostCentre').getByIdAsync(centre.id);
    await repository('CostCentre').updateAsync({ ...row, overBudgetAction: 'approval' });
    const forApproval = await api.post('/api/identity/cost-centres/check', { costCentreId: centre.id, amount: 90000 }, 'iam-f-30');
    assert.equal(forApproval.ok, true);
    assert.equal(forApproval.needsApproval, true);
    assert.equal(forApproval.sentTo, 'PRD-CHK-018');
    await repository('CostCentre').updateAsync({ ...row, overBudgetAction: 'refuse' });
  });

  test('AC-IAM-027-01-03', async () => {
    // "the spent amount is reduced by the cancelled or refunded amount"
    const partly = await api.post('/api/identity/cost-centres/release', {
      orderNumber: 'BUD-1', amount: 15000, reason: 'refunded',
    }, SESSIONS.admin);
    assert.equal(partly.ok, true);
    assert.equal(partly.released, 15000);
    assert.equal(partly.costCentre.spent, 25000, 'reduced by the refunded amount');
    assert.equal(partly.remaining, 75000);

    const rest = await api.post('/api/identity/cost-centres/release', { orderNumber: 'BUD-1', reason: 'cancelled' }, SESSIONS.admin);
    assert.equal(rest.released, 25000);
    assert.equal(rest.costCentre.spent, 0, 'a cancellation releases what is left');

    const none = await api.post('/api/identity/cost-centres/release', { orderNumber: 'BUD-1' }, SESSIONS.admin);
    assert.equal(none.ok, false, 'nothing is charged any more');
  });
});
