// CHK-018 B2B purchase approval.
//
// Prototype default - decisions PH-INF and WF-ENG pending (P-1): the B2B audience is an
// inference and the engine behind the queue is the ADM-002 workflow decision, so the feature is
// built as the chapter's Proposed option and labelled until both are taken.
//
// BR-CHK-019: an approval is valid only for the cart it was given for - a hash of the lines,
// their quantities and the total - and the requester never approves their own request.
// SM-CHK-05: Pending -> Approved / Rejected / Expired, and Void when the cart changes.

import { createHash } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';
import { submitAsync, decideAsync, registerApprovalCallbacks } from '../../product-adm/services/approvals.js';
import { companyOfCustomerAsync } from '../../product-iam/services/companies.js';

export const PROTOTYPE_DEFAULT = 'Prototype default - decisions PH-INF and WF-ENG pending';

export const REQUEST_STATE = {
  Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected', Expired: 'Expired', Void: 'Void',
};

export const OBJECT_TYPE = 'PurchaseApprovalRequest';

const ruleRepo = () => repository('PurchaseApprovalRule');
const requestRepo = () => repository('PurchaseApprovalRequest');

/** BR-CHK-019: the cart an approval was given for. */
export function cartSnapshot(cart) {
  const lines = (cart?.items ?? [])
    .map((i) => `${i.productId}:${i.quantity}:${i.unitPrice}`)
    .sort();
  const total = Number(cart?.subtotal ?? 0).toFixed(2);
  return {
    lines,
    total: Number(total),
    hash: createHash('sha256').update(`${lines.join('|')}|${total}`).digest('hex').slice(0, 32),
  };
}

/**
 * AC-CHK-018-03-01: a company administrator sets the threshold of a company role; the change is
 * audited (AUD-CHK-001).
 */
export async function saveRuleAsync({
  id = null, companyId, companyRole, threshold, storeId = 1, actor = 'company administrator',
}) {
  if (!companyId) return { ok: false, message: 'a threshold belongs to a company' };
  if (!companyRole) return { ok: false, message: 'a threshold belongs to a company role' };
  if (threshold === null || threshold === undefined || Number(threshold) < 0) {
    return { ok: false, message: 'a threshold needs an amount' };
  }
  const existing = id
    ? await ruleRepo().getByIdAsync(id)
    : await ruleRepo().getOneAsync((r) => Number(r.companyId) === Number(companyId) && r.companyRole === companyRole);
  const row = {
    companyId: Number(companyId), companyRole, threshold: Number(threshold), storeId: Number(storeId),
  };
  const saved = existing
    ? await ruleRepo().updateAsync({ ...existing, ...row })
    : await ruleRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: 'PRD-CHK-018',
    entity: 'PurchaseApprovalRule',
    entityId: saved.id,
    actor,
    storeId,
    before: existing ?? null,
    after: saved,
    note: existing ? 'approval threshold changed' : 'approval threshold set',
  });
  return { ok: true, rule: saved, prototypeDefault: PROTOTYPE_DEFAULT };
}

export const rulesAsync = ({ companyId }) => ruleRepo()
  .getAllAsync((r) => Number(r.companyId) === Number(companyId));

/** The threshold that applies to this buyer, or none. */
export async function thresholdForAsync({ customer, storeId = 1 }) {
  const membership = await companyOfCustomerAsync({ customerId: customer?.id });
  if (membership?.hasCompany !== true) {
    return { company: null, threshold: null, approvalNeeded: false };
  }
  const rules = await rulesAsync({ companyId: membership.companyId });
  const matching = rules.filter((r) => r.companyRole === membership.companyRole);
  if (!matching.length) {
    return { company: membership, companyId: membership.companyId, threshold: null, approvalNeeded: false };
  }
  const threshold = Math.min(...matching.map((r) => Number(r.threshold)));
  return {
    company: membership,
    companyId: membership.companyId,
    companyRole: membership.companyRole,
    threshold,
    storeId,
  };
}

/**
 * AC-CHK-018-01-01: above the buyer's threshold the cart is submitted for approval; the request
 * carries the snapshot and the total and the approvers of the company are notified through the
 * ADM-006 queue.
 */
export async function submitForApprovalAsync({
  customer, cart, storeId = 1,
}) {
  const applies = await thresholdForAsync({ customer, storeId });
  if (applies.threshold === null) {
    return { ok: false, approvalNeeded: false, message: 'no approval threshold applies to this buyer' };
  }
  const snapshot = cartSnapshot(cart);
  if (snapshot.total <= applies.threshold) {
    return { ok: false, approvalNeeded: false, message: 'this cart is within the buyer\'s own limit' };
  }
  const request = await requestRepo().insertAsync({
    companyId: applies.companyId,
    requesterId: customer.id,
    requesterEmail: customer.email,
    cartSnapshot: snapshot.lines,
    cartHash: snapshot.hash,
    total: snapshot.total,
    status: REQUEST_STATE.Pending,
    approverId: null,
    reason: null,
    storeId,
    createdOnUtc: new Date().toISOString(),
    prototypeDefault: PROTOTYPE_DEFAULT,
  });
  // the approvers see it in the ADM-006 queue, which is where every approval of the product goes
  const queued = await submitAsync({
    objectType: OBJECT_TYPE,
    objectId: request.id,
    requesterId: customer.id,
    requesterEmail: customer.email,
    summary: `${customer.email} asks to place an order of ${snapshot.total}`,
    amount: snapshot.total,
    approverRole: 'CompanyApprover',
  });
  await requestRepo().updateAsync({ ...request, approvalItemId: queued.item?.id ?? null });
  await auditAsync({
    event: 'AUD-CHK-006',
    area: 'CHK',
    feature: 'PRD-CHK-018',
    entity: 'PurchaseApprovalRequest',
    entityId: request.id,
    actor: customer.email,
    storeId,
    after: { status: REQUEST_STATE.Pending, total: snapshot.total },
    note: 'an order was submitted for approval',
  });
  return {
    ok: true,
    approvalNeeded: true,
    request: await requestRepo().getByIdAsync(request.id),
    queueItemId: queued.item?.id ?? null,
    approversNotified: queued.ok !== false,
    prototypeDefault: PROTOTYPE_DEFAULT,
  };
}

/**
 * AC-CHK-018-02-01 and 02-02: an approver of the same company approves or rejects, with a
 * reason for a rejection; the requester never approves their own request (BR-CHK-019, enforced
 * by the ADM-006 queue as well).
 */
export async function decideRequestAsync({
  requestId, decision, approver, reason = null, reasonCode = null, storeId = 1,
}) {
  const request = await requestRepo().getByIdAsync(requestId);
  if (!request) return { ok: false, message: 'unknown approval request' };
  if (request.status !== REQUEST_STATE.Pending) {
    return { ok: false, message: `the request is ${request.status}` };
  }
  if (Number(request.requesterId) === Number(approver?.id)) {
    return { ok: false, message: 'the person who asked cannot approve their own request (BR-CHK-019)' };
  }
  const membership = await companyOfCustomerAsync({ customerId: approver?.id });
  if (membership?.hasCompany !== true || Number(membership.companyId) !== Number(request.companyId)) {
    return { ok: false, denied: true, message: 'an approver decides only for their own company' };
  }
  if (membership.companyRole !== 'CompanyApprover' && membership.companyRole !== 'CompanyAdministrator') {
    return { ok: false, denied: true, message: 'only an approver of the company decides a request' };
  }
  if (decision === 'reject' && !reason && !reasonCode) {
    return { ok: false, message: 'a rejection needs a reason' };
  }

  // the decision is taken in the ADM-006 queue, so one queue holds every approval
  let queued = { ok: true };
  if (request.approvalItemId) {
    queued = await decideAsync({
      itemId: request.approvalItemId,
      decision: decision === 'approve' ? 'approve' : 'reject',
      customer: approver,
      // the queue keeps the reason as one of its own codes, with the approver's words beside it
      reasonCode: reasonCode ?? (decision === 'reject' ? 'POLICY_BREACH' : null),
      comment: reason,
    });
    if (queued.ok === false) return { ok: false, ...queued };
  }

  const saved = await requestRepo().updateAsync({
    ...request,
    status: decision === 'approve' ? REQUEST_STATE.Approved : REQUEST_STATE.Rejected,
    approverId: approver?.id ?? null,
    approverEmail: approver?.email ?? null,
    reason,
    decidedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-CHK-006',
    area: 'CHK',
    feature: 'PRD-CHK-018',
    entity: 'PurchaseApprovalRequest',
    entityId: saved.id,
    actor: approver?.email ?? null,
    storeId,
    before: { status: request.status },
    after: { status: saved.status },
    reason,
    note: `the request was ${saved.status.toLowerCase()}`,
  });
  // the buyer hears about the decision through the ADM-006 queue, which notifies the requester
  // with the reason; CHK adds no message of its own
  return {
    ok: true,
    request: saved,
    buyerNotified: queued.ok !== false,
    notifiedThrough: 'the ADM-006 approval queue (Administration.ApprovalDecided)',
    reason,
  };
}

/**
 * AC-CHK-018-01-02 and 01-03: the placement asks whether this cart may be placed. An approval
 * covers only the cart it was given for, so a changed cart voids it and approval is needed
 * again.
 */
export async function approvalForCartAsync({ customer, cart, storeId = 1 }) {
  const applies = await thresholdForAsync({ customer, storeId });
  if (applies.threshold === null || Number(cart?.subtotal ?? 0) <= applies.threshold) {
    return { required: false, ok: true };
  }
  const snapshot = cartSnapshot(cart);
  const requests = await requestRepo().getAllAsync((r) => Number(r.requesterId) === Number(customer.id)
    && r.status === REQUEST_STATE.Approved);
  const match = requests.find((r) => r.cartHash === snapshot.hash);
  if (match) {
    return {
      required: true, ok: true, request: match, snapshot,
    };
  }
  // an approval for another cart is void from now on
  for (const stale of requests) {
    await requestRepo().updateAsync({ ...stale, status: REQUEST_STATE.Void, voidedOnUtc: new Date().toISOString() });
    await auditAsync({
      event: 'AUD-CHK-006',
      area: 'CHK',
      feature: 'PRD-CHK-018',
      entity: 'PurchaseApprovalRequest',
      entityId: stale.id,
      actor: customer.email,
      storeId,
      before: { status: REQUEST_STATE.Approved },
      after: { status: REQUEST_STATE.Void },
      note: 'the cart changed after the approval was given',
    });
  }
  return {
    required: true,
    ok: false,
    messageKey: 'Chk.ApprovalRequired',
    message: resource('Chk.ApprovalRequired'),
    voided: requests.length,
    snapshot,
    threshold: applies.threshold,
  };
}

/** SM-CHK-05: a request nobody decided within the client's expiry is Expired. */
export async function expireRequestsAsync({ storeId = 1, now = null } = {}) {
  const days = await getSettingAsync('chk.approval.expirydays', storeId, null);
  if (days === null) {
    return { expired: [], expiryConfigured: false, note: 'this client sets no expiry' };
  }
  const at = now ? new Date(now) : new Date();
  const rows = await requestRepo().getAllAsync((r) => r.status === REQUEST_STATE.Pending
    || r.status === REQUEST_STATE.Approved);
  const expired = [];
  for (const row of rows) {
    const age = (at.getTime() - Date.parse(row.createdOnUtc)) / 86400000;
    if (age <= Number(days)) continue;
    await requestRepo().updateAsync({ ...row, status: REQUEST_STATE.Expired });
    expired.push(row.id);
  }
  return { expired, expiryConfigured: true, expiryDays: Number(days) };
}

export const requestsAsync = ({ companyId = null, requesterId = null, status = null } = {}) => requestRepo()
  .getAllAsync((r) => (!companyId || Number(r.companyId) === Number(companyId))
    && (!requesterId || Number(r.requesterId) === Number(requesterId))
    && (!status || r.status === status));

/** The ADM-006 callbacks for this object type (IC-ADM-03). */
export function registerCallbacks() {
  return registerApprovalCallbacks(OBJECT_TYPE, {
    feature: 'PRD-CHK-018',
    // who the request belongs to: an approver of the same company, never the requester. The
    // company role lives in the IAM company tables, not in the customer's own roles.
    canSee: async (item, customer) => {
      const request = await requestRepo().getByIdAsync(item.objectId);
      if (!request) return false;
      if (Number(request.requesterId) === Number(customer?.id)) return false;
      const membership = await companyOfCustomerAsync({ customerId: customer?.id });
      return membership?.hasCompany === true && Number(membership.companyId) === Number(request.companyId);
    },
    onApproved: async (item) => {
      const request = await requestRepo().getByIdAsync(item.objectId);
      if (request && request.status === REQUEST_STATE.Pending) {
        await requestRepo().updateAsync({ ...request, status: REQUEST_STATE.Approved });
      }
    },
    onRejected: async (item) => {
      const request = await requestRepo().getByIdAsync(item.objectId);
      if (request && request.status === REQUEST_STATE.Pending) {
        await requestRepo().updateAsync({ ...request, status: REQUEST_STATE.Rejected });
      }
    },
  });
}
