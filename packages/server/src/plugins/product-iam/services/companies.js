// PRD-IAM-022 Company accounts and members, PRD-IAM-027 Cost centres and budgets.
//
// BR-IAM-120: IAM owns the company, its members and their company roles, and nothing else. The
// approval thresholds of a company role are stored by CHK-018, the assortment of a company by
// CAT-040; both read the company and the role of a customer through IC-IAM-07. Where CAT-040 has
// registered a membership provider, IAM calls it inside the same save (IC-IAM-07
// OnMembershipChanged) and does not save the change if the provider fails.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { providers, runProviders } from '../../../core/providers.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';

const companyRepo = () => repository('Company');
const memberRepo = () => repository('CompanyMember');
const costCentreRepo = () => repository('CostCentre');
const chargeRepo = () => repository('CostCentreCharge');

/** BR-IAM-120: the company roles IAM knows. The rights of each are the module's that owns them. */
export const COMPANY_ROLES = ['CompanyBuyer', 'CompanyApprover', 'CompanyAdministrator'];

export const COMPANY_ROLE_RIGHTS = {
  CompanyBuyer: { orders: true, approves: false, managesMembers: false },
  CompanyApprover: { orders: true, approves: true, managesMembers: false, approvalOwnedBy: 'PRD-CHK-018' },
  CompanyAdministrator: { orders: true, approves: false, managesMembers: true },
};

export async function createCompanyAsync({
  name, registrationNumber = null, taxNumber = null, status = 'Active', addresses = [], actor = 'administrator',
}) {
  const row = await companyRepo().insertAsync({
    name, registrationNumber, taxNumber, status, addresses, createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-012', area: 'IAM', feature: 'PRD-IAM-022', entity: 'Company', entityId: row.id, actor, after: { name, status }, note: 'company created',
  });
  return row;
}

export const companiesAsync = () => companyRepo().getAllAsync();

export const companyAsync = async (companyId) => {
  const company = await companyRepo().getByIdAsync(companyId);
  if (!company) return null;
  const members = await memberRepo().getAllAsync((m) => m.companyId === company.id && m.active !== false);
  return { ...company, members };
};

/** IC-IAM-07 GetCompanyOfCustomer. */
export async function companyOfCustomerAsync({ customerId }) {
  const membership = await memberRepo().getOneAsync((m) => m.customerId === Number(customerId) && m.active !== false);
  if (!membership) return { hasCompany: false, note: 'no company' };
  const company = await companyRepo().getByIdAsync(membership.companyId);
  return {
    hasCompany: true,
    companyId: company.id,
    companyName: company.name,
    companyStatus: company.status,
    companyRole: membership.companyRole,
    contract: 'IC-IAM-07 GetCompanyOfCustomer',
  };
}

export const membershipProviders = () => providers('IC-IAM-07').map((p) => ({ feature: p.feature, name: p.name }));

/**
 * AC-IAM-022-02-01 and 02-03: a member is added with a company role; where a membership provider
 * is registered it is called inside the same save and a failure keeps the change unsaved.
 */
export async function addMemberAsync({
  companyId, email, companyRole, actor = 'company administrator', invite = true, storeId = 1,
}) {
  if (!COMPANY_ROLES.includes(companyRole)) {
    return { ok: false, message: `the company role is one of ${COMPANY_ROLES.join(', ')}` };
  }
  const company = await companyRepo().getByIdAsync(companyId);
  if (!company) return { ok: false, message: 'no such company' };
  const customer = await repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);
  if (!customer) return { ok: false, message: 'no such account', invitationNeeded: invite };

  return withLockAsync(lockKey.company ? lockKey.company(companyId) : `iam-company-${companyId}`, async () => {
    const existing = await memberRepo().getOneAsync((m) => m.companyId === companyId && m.customerId === customer.id);
    const row = existing
      ? await memberRepo().updateAsync({ ...existing, companyRole, active: true })
      : await memberRepo().insertAsync({
        companyId, customerId: customer.id, email, companyRole, active: true, addedOnUtc: new Date().toISOString(),
      });

    // IC-IAM-07 OnMembershipChanged, inside the same save
    const results = await runProviders('IC-IAM-07', 'collect', {
      operation: 'OnMembershipChanged', change: 'added', companyId, customerId: customer.id, companyRole, storeId,
    });
    const failed = results.find((r) => r.result?.ok === false);
    if (failed) {
      if (existing) await memberRepo().updateAsync(existing);
      else await memberRepo().deleteAsync(row.id);
      return {
        ok: false,
        providerFailed: failed.feature,
        message: failed.result?.message ?? 'the membership provider refused the change',
        saved: false,
      };
    }
    await auditAsync({
      event: 'AUD-IAM-012', area: 'IAM', feature: 'PRD-IAM-022', entity: 'CompanyMember', entityId: row.id, actor, after: { companyId, customerId: customer.id, companyRole }, note: 'member added to the company',
    });
    return {
      ok: true,
      member: row,
      rights: COMPANY_ROLE_RIGHTS[companyRole],
      providersCalled: results.map((r) => r.feature),
      invitationSent: invite && !existing,
    };
  });
}

/** AC-IAM-022-02-02: the member loses access; the orders stay with the company. */
export async function removeMemberAsync({
  companyId, customerId, actor = 'company administrator', storeId = 1,
}) {
  const row = await memberRepo().getOneAsync((m) => m.companyId === Number(companyId) && m.customerId === Number(customerId));
  if (!row) return { ok: false, message: 'that customer is not a member' };
  await memberRepo().updateAsync({ ...row, active: false, removedOnUtc: new Date().toISOString() });
  const results = await runProviders('IC-IAM-07', 'collect', {
    operation: 'OnMembershipChanged', change: 'removed', companyId: Number(companyId), customerId: Number(customerId), companyRole: row.companyRole, storeId,
  });
  const failed = results.find((r) => r.result?.ok === false);
  if (failed) {
    await memberRepo().updateAsync({ ...row, active: true, removedOnUtc: null });
    return { ok: false, providerFailed: failed.feature, saved: false };
  }
  const orders = await repository('Order').getAllAsync((o) => o.companyId === Number(companyId) && o.customerId === Number(customerId));
  await auditAsync({
    event: 'AUD-IAM-012', area: 'IAM', feature: 'PRD-IAM-022', entity: 'CompanyMember', entityId: row.id, actor, before: { active: true }, after: { active: false }, note: 'member removed from the company',
  });
  return {
    ok: true, removed: true, ordersKeptWithCompany: orders.length, providersCalled: results.map((r) => r.feature),
  };
}

/** AC-IAM-022-01-01 and 01-02: company orders, and who may see them. */
export async function linkOrderToCompanyAsync({ orderNumber, customerId }) {
  const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return { ok: false, message: 'no such order' };
  const company = await companyOfCustomerAsync({ customerId });
  if (!company.hasCompany) return { ok: false, message: 'that customer has no company' };
  const updated = await repository('Order').updateAsync({ ...order, companyId: company.companyId });
  return { ok: true, order: updated, companyId: company.companyId };
}

export async function companyOrdersAsync({ companyId, customer }) {
  const membership = await memberRepo().getOneAsync((m) => m.companyId === Number(companyId)
    && m.customerId === customer.id && m.active !== false);
  if (!membership) {
    return {
      ok: false, denied: true, messageKey: 'Iam.ScopeDenied', message: resource('Iam.ScopeDenied'),
    };
  }
  const orders = await repository('Order').getAllAsync((o) => o.companyId === Number(companyId));
  return {
    ok: true,
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber, customerId: o.customerId, orderTotal: o.orderTotal, orderStatus: o.orderStatus,
    })),
    companyRole: membership.companyRole,
  };
}

/** AC-IAM-022-01-01: the shared company addresses are offered at checkout. */
export async function companyAddressesAsync({ customer }) {
  const company = await companyOfCustomerAsync({ customerId: customer.id });
  if (!company.hasCompany) return { addresses: [], shared: false };
  const row = await companyRepo().getByIdAsync(company.companyId);
  return {
    addresses: row.addresses ?? [], shared: true, companyId: row.id, offeredAt: 'PRD-CHK-001 address step',
  };
}

/* ==================================================== PRD-IAM-027 cost centres ========== */

export async function createCostCentreAsync({
  companyId, code, name, budget, periodFrom, periodTo, overBudgetAction = null, actor = 'company administrator', storeId = 1,
}) {
  const company = await companyRepo().getByIdAsync(companyId);
  if (!company) return { ok: false, message: 'no such company' };
  const configured = overBudgetAction ?? await getSettingAsync('iam.overbudgetaction', storeId, 'refuse');
  const row = await costCentreRepo().insertAsync({
    companyId,
    code,
    name,
    budget: Number(budget),
    spent: 0,
    periodFrom,
    periodTo,
    overBudgetAction: configured,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-012', area: 'IAM', feature: 'PRD-IAM-027', entity: 'CostCentre', entityId: row.id, actor, after: { code, budget: row.budget }, note: 'cost centre created',
  });
  return { ok: true, costCentre: row };
}

export const costCentresAsync = (companyId = null) => costCentreRepo()
  .getAllAsync((c) => (companyId ? c.companyId === Number(companyId) : true));

const remaining = (centre) => Number(centre.budget) - Number(centre.spent ?? 0);

/** AC-IAM-027-01-02: the configured action when an order would exceed the remaining budget. */
export async function budgetCheckAsync({
  costCentreId, amount, customer = null, storeId = 1,
}) {
  const centre = await costCentreRepo().getByIdAsync(costCentreId);
  if (!centre) return { ok: true, note: 'no cost centre on this order' };
  const left = remaining(centre);
  if (Number(amount) <= left) {
    return {
      ok: true, costCentreId: centre.id, remaining: left, afterOrder: left - Number(amount),
    };
  }
  const action = centre.overBudgetAction ?? await getSettingAsync('iam.overbudgetaction', storeId, 'refuse');
  if (action === 'approval') {
    return {
      ok: true,
      needsApproval: true,
      sentTo: 'PRD-CHK-018',
      costCentreId: centre.id,
      remaining: left,
      shortfall: Number(amount) - left,
      customerId: customer?.id ?? null,
    };
  }
  return {
    ok: false,
    refused: true,
    messageKey: 'Iam.BudgetExceeded',
    message: resource('Iam.BudgetExceeded'),
    costCentreId: centre.id,
    remaining: left,
    shortfall: Number(amount) - left,
  };
}

/** AC-IAM-027-01-01: the order is linked and the spent amount increases. */
export async function chargeOrderAsync({
  costCentreId, orderNumber, amount, storeId = 1,
}) {
  const centre = await costCentreRepo().getByIdAsync(costCentreId);
  if (!centre) return { ok: false, message: 'no such cost centre' };
  return withLockAsync(`iam-cost-centre-${centre.id}`, async () => {
    const check = await budgetCheckAsync({ costCentreId, amount, storeId });
    if (check.ok === false) return check;
    const order = await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
    if (order) await repository('Order').updateAsync({ ...order, costCentreId: centre.id });
    const charge = await chargeRepo().insertAsync({
      costCentreId: centre.id, orderNumber, amount: Number(amount), status: 'Charged', createdOnUtc: new Date().toISOString(),
    });
    const updated = await costCentreRepo().updateAsync({ ...centre, spent: Number(centre.spent ?? 0) + Number(amount) });
    await auditAsync({
      event: 'AUD-IAM-012', area: 'IAM', feature: 'PRD-IAM-027', entity: 'CostCentre', entityId: centre.id, actor: 'system', before: { spent: centre.spent ?? 0 }, after: { spent: updated.spent }, note: `order ${orderNumber} charged to ${centre.code}`,
    });
    return {
      ok: true, charge, costCentre: updated, remaining: remaining(updated), needsApproval: check.needsApproval === true,
    };
  });
}

/** AC-IAM-027-01-03: a cancellation or refund reduces the spent amount. */
export async function releaseChargeAsync({
  orderNumber, amount = null, reason = 'cancelled',
}) {
  const charge = await chargeRepo().getOneAsync((c) => c.orderNumber === orderNumber && c.status === 'Charged');
  if (!charge) return { ok: false, message: 'that order is not charged to a cost centre' };
  const centre = await costCentreRepo().getByIdAsync(charge.costCentreId);
  const released = amount === null ? Number(charge.amount) : Number(amount);
  return withLockAsync(`iam-cost-centre-${centre.id}`, async () => {
    const stillCharged = Number(charge.amount) - released;
    await chargeRepo().updateAsync({
      ...charge,
      amount: stillCharged,
      status: stillCharged <= 0 ? 'Released' : 'Charged',
      releasedAmount: released,
      releaseReason: reason,
    });
    const updated = await costCentreRepo().updateAsync({
      ...centre, spent: Math.max(0, Number(centre.spent ?? 0) - released),
    });
    await auditAsync({
      event: 'AUD-IAM-012', area: 'IAM', feature: 'PRD-IAM-027', entity: 'CostCentre', entityId: centre.id, actor: 'system', before: { spent: centre.spent }, after: { spent: updated.spent }, note: `order ${orderNumber} ${reason}: ${released} released`,
    });
    return {
      ok: true, released, costCentre: updated, remaining: remaining(updated), reason,
    };
  });
}
