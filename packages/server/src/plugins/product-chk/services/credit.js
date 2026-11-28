// CHK-016 B2B on-account payment and credit limits.
//
// Prototype default - decisions PH-INF and PAID-STUB pending (P-1): the B2B audience is an
// inference and the receivables ledger behind it is a paid stub, so the feature is built as the
// chapter's Proposed option and labelled until both decisions are taken.
//
// BR-CHK-018: available credit = limit - open receivables (PAY-033 through IC-PAY-08) - unpaid
// on-account orders, checked under ILocker key 'chk-credit-{CreditAccountId}'.
// SM-CHK-04: Applied -> Approved -> Suspended -> Approved -> Closed.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { withLockAsync } from '../../../core/locker.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { providers } from '../../../core/providers.js';
import { companyOfCustomerAsync } from '../../product-iam/services/companies.js';

export const PROTOTYPE_DEFAULT = 'Prototype default - decisions PH-INF and PAID-STUB pending';

export const CREDIT_STATE = {
  Applied: 'Applied', Approved: 'Approved', Suspended: 'Suspended', Closed: 'Closed',
};

export const ON_ACCOUNT = 'Payments.OnAccount';

const accountRepo = () => repository('CreditAccount');
const creditLockKey = (id) => `chk-credit-${id}`;

/** SM-CHK-04: a company applies for credit once its company account exists (IAM-022). */
export async function applyAsync({
  companyId, customerId = null, currencyCode = 'MWK', storeId = 1,
}) {
  const existing = await accountRepo().getOneAsync((a) => Number(a.companyId) === Number(companyId));
  if (existing) return { ok: true, account: existing, alreadyApplied: true };
  const account = await accountRepo().insertAsync({
    companyId: companyId ?? null,
    customerId: customerId ?? null,
    creditLimit: 0,
    currencyCode,
    paymentTermsDays: null,
    status: CREDIT_STATE.Applied,
    approvedBy: null,
    storeId,
    rowVersion: 0,
  });
  return { ok: true, account, prototypeDefault: PROTOTYPE_DEFAULT };
}

/**
 * AC-CHK-016-02-01: finance sets the limit, the currency and the terms and approves; the change
 * is audited (AUD-CHK-005). Only a holder of Checkout.Core.Credit.CreateEditDelete may do it.
 */
export async function decideAsync({
  accountId, decision, creditLimit = null, paymentTermsDays = null, currencyCode = null,
  reason = null, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Checkout.Core.Credit.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Checkout.Core.Credit.CreateEditDelete' };
  }
  const account = await accountRepo().getByIdAsync(accountId);
  if (!account) return { ok: false, message: 'unknown credit account' };

  const moves = {
    approve: { from: [CREDIT_STATE.Applied, CREDIT_STATE.Suspended], to: CREDIT_STATE.Approved },
    suspend: { from: [CREDIT_STATE.Approved], to: CREDIT_STATE.Suspended, needsReason: true },
    close: { from: [CREDIT_STATE.Approved, CREDIT_STATE.Suspended], to: CREDIT_STATE.Closed },
  }[decision];
  if (!moves) return { ok: false, message: `${decision} is not a decision on a credit account` };
  if (!moves.from.includes(account.status)) {
    return { ok: false, message: `a ${account.status} account cannot be ${decision}d` };
  }
  if (moves.needsReason && !reason) return { ok: false, message: 'a reason is needed' };
  if (decision === 'approve' && (creditLimit === null || paymentTermsDays === null) && account.creditLimit === 0) {
    return { ok: false, message: 'approving a credit account needs a limit and payment terms' };
  }
  if (decision === 'close') {
    const open = await openReceivablesAsync({ account, storeId });
    if (open.total > 0) return { ok: false, message: 'the account still has open receivables' };
  }

  const saved = await accountRepo().updateAsync({
    ...account,
    status: moves.to,
    creditLimit: creditLimit === null ? account.creditLimit : Number(creditLimit),
    paymentTermsDays: paymentTermsDays === null ? account.paymentTermsDays : Number(paymentTermsDays),
    currencyCode: currencyCode ?? account.currencyCode,
    approvedBy: decision === 'approve' ? (actor?.email ?? 'finance') : account.approvedBy,
    reason: reason ?? account.reason ?? null,
    rowVersion: Number(account.rowVersion ?? 0) + 1,
  });
  await auditAsync({
    event: 'AUD-CHK-005',
    area: 'CHK',
    feature: 'PRD-CHK-016',
    entity: 'CreditAccount',
    entityId: saved.id,
    actor: actor?.email ?? 'finance',
    storeId,
    before: { status: account.status, creditLimit: account.creditLimit, paymentTermsDays: account.paymentTermsDays },
    after: { status: saved.status, creditLimit: saved.creditLimit, paymentTermsDays: saved.paymentTermsDays },
    reason,
    note: `credit account ${decision}d`,
  });
  return { ok: true, account: saved };
}

export const accountsAsync = async ({ actor, storeId = 1 }) => {
  if (!await authorizeAsync('Checkout.Core.Credit.View', actor)) {
    return { ok: false, denied: true, permission: 'Checkout.Core.Credit.View' };
  }
  const rows = await accountRepo().getAllAsync((a) => a.storeId == null || Number(a.storeId) === Number(storeId));
  return { ok: true, accounts: rows };
};

export async function accountForCustomerAsync({ customer, storeId = 1 }) {
  if (!customer) return null;
  const membership = await companyOfCustomerAsync({ customerId: customer.id });
  const companyId = membership?.hasCompany === true ? membership.companyId : (customer.companyId ?? null);
  if (companyId) {
    const byCompany = await accountRepo().getOneAsync((a) => Number(a.companyId) === Number(companyId));
    if (byCompany) return byCompany;
  }
  return accountRepo().getOneAsync((a) => Number(a.customerId) === Number(customer.id)
    && (a.storeId == null || Number(a.storeId) === Number(storeId)));
}

/** IC-PAY-08 GetOpenReceivables, supplied by PAY-033. Without it, only this store's own orders. */
export async function openReceivablesAsync({ account, storeId = 1 }) {
  for (const provider of providers('IC-PAY-08')) {
    try {
      const answer = await provider.fn({ account, storeId });
      if (answer && typeof answer.total === 'number') {
        return { ...answer, suppliedBy: provider.feature };
      }
    } catch {
      // a ledger that cannot answer leaves the orders below as the only measure
    }
  }
  return { total: 0, items: [], suppliedBy: null };
}

/**
 * BR-CHK-018: what the company may still spend. Open receivables come from the ledger; orders
 * already placed on account and not yet paid count as well.
 */
export async function availableCreditAsync({ account, storeId = 1 }) {
  if (!account) return null;
  const receivables = await openReceivablesAsync({ account, storeId });
  const orders = await repository('Order').getAllAsync((o) => o.paymentMethodSystemName === ON_ACCOUNT
    && o.paymentStatus !== 'Paid'
    && (Number(o.creditAccountId) === Number(account.id)
      || (account.companyId && Number(o.companyId) === Number(account.companyId))));
  const unpaidOrders = Number(orders.reduce((s, o) => s + Number(o.total ?? 0), 0).toFixed(2));
  const available = Number((Number(account.creditLimit ?? 0) - Number(receivables.total ?? 0) - unpaidOrders).toFixed(2));
  return {
    accountId: account.id,
    status: account.status,
    creditLimit: Number(account.creditLimit ?? 0),
    openReceivables: Number(receivables.total ?? 0),
    receivablesFrom: receivables.suppliedBy,
    unpaidOnAccountOrders: unpaidOrders,
    available,
    currencyCode: account.currencyCode,
    rule: 'BR-CHK-018',
  };
}

/** Are the company's receivables overdue beyond the client's grace, where the client blocks that? */
export async function overdueBlockAsync({ account, storeId = 1 }) {
  const blockWhenOverdue = await getSettingAsync('chk.credit.blockwhenoverdue', storeId, false);
  if (blockWhenOverdue !== true) return { blocked: false, settingOn: false };
  const graceDays = await getSettingAsync('chk.credit.overduegracedays', storeId, null);
  const receivables = await openReceivablesAsync({ account, storeId });
  const now = Date.now();
  const overdue = (receivables.items ?? []).filter((item) => {
    if (!item.dueOnUtc) return false;
    const days = (now - Date.parse(item.dueOnUtc)) / 86400000;
    return days > Number(graceDays ?? 0);
  });
  return {
    blocked: overdue.length > 0,
    settingOn: true,
    graceDays: graceDays ?? null,
    graceConfigured: graceDays !== null,
    overdue,
  };
}

/**
 * AC-CHK-016-01-01, 03-01, 02-02 and 03-03: whether "On account" is offered to this buyer, and
 * why not where it is hidden (HidePaymentMethodAsync).
 */
export async function onAccountOfferAsync({
  customer, total = 0, storeId = 1,
}) {
  const account = await accountForCustomerAsync({ customer, storeId });
  if (!account) {
    return { offered: false, reason: 'this buyer has no credit account', account: null };
  }
  if (account.status !== CREDIT_STATE.Approved) {
    return {
      offered: false,
      reason: `the credit account is ${account.status}`,
      account,
      status: account.status,
    };
  }
  const overdue = await overdueBlockAsync({ account, storeId });
  if (overdue.blocked) {
    return {
      offered: false, reason: 'the company has overdue receivables', account, overdue,
    };
  }
  const credit = await availableCreditAsync({ account, storeId });
  if (Number(total) > credit.available) {
    return {
      offered: false,
      reason: 'the order is above the available credit',
      messageKey: 'Chk.CreditLimitExceeded',
      message: resource('Chk.CreditLimitExceeded'),
      account,
      credit,
    };
  }
  return {
    offered: true, account, credit, prototypeDefault: PROTOTYPE_DEFAULT,
  };
}

/**
 * AC-CHK-016-03-02: the check and the reservation run under the account's own lock, so two
 * buyers of the same company cannot both spend the last of the credit.
 */
export async function reserveCreditAsync({
  customer, total, storeId = 1, orderNumber = null,
}) {
  const account = await accountForCustomerAsync({ customer, storeId });
  if (!account) {
    return { ok: false, messageKey: 'Chk.CreditLimitExceeded', message: resource('Chk.CreditLimitExceeded') };
  }
  return withLockAsync(creditLockKey(account.id), async () => {
    const offer = await onAccountOfferAsync({ customer, total, storeId });
    if (!offer.offered) {
      return {
        ok: false,
        messageKey: offer.messageKey ?? 'Chk.CreditLimitExceeded',
        message: offer.message ?? resource('Chk.CreditLimitExceeded'),
        reason: offer.reason,
        credit: offer.credit ?? null,
      };
    }
    const reservation = await repository('CreditReservation').insertAsync({
      creditAccountId: account.id,
      amount: Number(total),
      orderNumber,
      state: 'Reserved',
      storeId,
      createdOnUtc: new Date().toISOString(),
    });
    return {
      ok: true,
      reservation: { creditReservationId: reservation.id, creditAccountId: account.id, amount: Number(total) },
      lockKey: creditLockKey(account.id),
      credit: offer.credit,
    };
  });
}

/** The IC-CHK-06 participant: reserve at placement, confirm on the sub-order, release on failure. */
export async function placementParticipantAsync({
  phase, customer = null, totals = null, storeId = 1, reservation = null, order = null,
  paymentMethodSystemName = null,
}) {
  const method = paymentMethodSystemName ?? totals?.paymentMethodSystemName ?? null;
  if (phase === 'Reserve') {
    if (method !== ON_ACCOUNT) return { ok: true };
    return reserveCreditAsync({ customer, total: totals?.total ?? 0, storeId });
  }
  if (phase === 'Confirm') {
    const id = reservation?.creditReservationId ?? null;
    if (!id || !order) return { ok: true };
    const row = await repository('CreditReservation').getByIdAsync(id);
    if (row) {
      await repository('CreditReservation').updateAsync({ ...row, state: 'Confirmed', orderNumber: order.orderNumber });
      await repository('Order').updateAsync({ ...order, creditAccountId: row.creditAccountId });
    }
    return { ok: true };
  }
  if (phase === 'Release') {
    const id = reservation?.creditReservationId ?? null;
    if (!id) return { ok: true };
    const row = await repository('CreditReservation').getByIdAsync(id);
    if (row && row.state === 'Reserved') {
      await repository('CreditReservation').updateAsync({ ...row, state: 'Released' });
    }
    return { ok: true };
  }
  return { ok: true };
}
