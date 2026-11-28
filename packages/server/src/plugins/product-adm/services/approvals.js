// PRD-ADM-006 Approval queues.
//
// PROTOTYPE DEFAULT - DECISION WF-ENG PENDING (P-1): the PRD holds ADM-006 with ADM-002, because
// an approval step is a workflow step. What is built is the PRD's Proposed behaviour.
//
// US-ADM-006-01  a queue limited to my role, authority and delegations
// US-ADM-006-02  several steps, conditional steps
// US-ADM-006-03  approve subject to corrections, tracked
// US-ADM-006-04  reject with a reason; requester sees reason and recourse
// US-ADM-006-05  high-risk actions (payout account change) need approval, audited
// US-ADM-006-06  moderation queues with an assignment rule
//
// BR-ADM-030 visibility and authority; BR-ADM-031 the pre-decision guard; BR-ADM-011 ADM never
// changes the owning module's object itself - it calls the module's callback (IC-ADM-03).

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { sendEventAsync } from '../../product-trk/services/event-codes.js';
import { evaluateAsync } from './rules.js';

export const HELD_LABEL = 'Prototype default - decision WF-ENG pending';

const chainRepo = () => repository('ApprovalChain');
const itemRepo = () => repository('ApprovalItem');
const stepRepo = () => repository('ApprovalStep');
const conditionRepo = () => repository('ApprovalCondition');
const reasonRepo = () => repository('ReasonCode');
const queueRepo = () => repository('ModerationQueue');
const workItemRepo = () => repository('WorkItemEvent');

/* ================================================== IC-ADM-03 module callbacks =========== */

const callbacks = new Map(); // objectType -> { feature, canDecide, onApproved, onRejected, onConditionsMet }

/** A module registers the callbacks for its own object types (IC-ADM-03). */
export function registerApprovalCallbacks(objectType, handlers) {
  callbacks.set(objectType, handlers);
  return handlers;
}
export const approvalCallbacks = () => [...callbacks.entries()].map(([objectType, h]) => ({
  objectType,
  feature: h.feature,
  hasGuard: typeof h.canDecide === 'function',
  saysWhoSeesIt: typeof h.canSee === 'function',
}));

/* ========================================================================= queue ========= */

const chainForAsync = (objectType) => chainRepo().getOneAsync((c) => c.objectType === objectType);

const authorityOf = (customer) => {
  const limits = (customer?.authorityLimits ?? {});
  return limits.approval ?? customer?.authorityLimit ?? null;
};

/** BR-ADM-030: role named on the current step, within the authority limit, or delegated. */
export async function canSeeItemAsync(item, customer) {
  if (!customer) return false;
  const roles = customer.roles ?? [];
  const step = await currentStepDefinitionAsync(item);
  if (!step) return false;
  const delegated = (item.delegatedTo ?? []).includes(customer.email);
  if (delegated) return true; // an active delegation (IAM-009) carries the authority with it
  // IC-ADM-03: a module may say who its own items belong to, where the right to decide is not a
  // customer role - a company role kept in the IAM company tables, for instance. This is who
  // sees the item; CanDecide is the separate guard that blocks a decision with a reason.
  const owner = callbacks.get(item.objectType);
  if (typeof owner?.canSee === 'function') {
    const allowed = await owner.canSee(item, customer);
    if (allowed !== true) return false;
    const ownerLimit = step.authorityLimit ?? authorityOf(customer);
    if (item.amount != null && ownerLimit != null && item.amount > ownerLimit) return false;
    return true;
  }
  if (!roles.includes(step.approverRole)) return false;
  const limit = step.authorityLimit ?? authorityOf(customer);
  if (item.amount != null && limit != null && item.amount > limit) return false;
  return true;
}

async function currentStepDefinitionAsync(item) {
  const chain = await chainRepo().getByIdAsync(item.chainId);
  if (!chain) return null;
  return chain.steps.find((s) => s.order === item.currentStep) ?? null;
}

/** AC-ADM-006-01-01: the approver's queue. */
export async function queueForAsync(customer) {
  const open = await itemRepo().getAllAsync((i) => ['InReview', 'ApprovedWithConditions', 'InAppeal'].includes(i.status));
  const mine = [];
  for (const item of open) {
    if (await canSeeItemAsync(item, customer)) {
      mine.push({ ...item, chain: await chainRepo().getByIdAsync(item.chainId), step: await currentStepDefinitionAsync(item) });
    }
  }
  return mine.sort((a, b) => a.id - b.id);
}

/** AC-ADM-006-01-02: opening an item that is not assigned to the user is denied. */
export async function openItemAsync(itemId, customer) {
  const item = await itemRepo().getByIdAsync(itemId);
  if (!item) return { ok: false, message: 'unknown approval item' };
  if (!await canSeeItemAsync(item, customer)) {
    return { ok: false, denied: true, message: 'Access denied: this item is not assigned to you (BR-ADM-030).' };
  }
  return {
    ok: true,
    item,
    chain: await chainRepo().getByIdAsync(item.chainId),
    steps: await stepRepo().getAllAsync((s) => s.itemId === itemId),
    conditions: await conditionRepo().getAllAsync((c) => c.itemId === itemId),
  };
}

/* ======================================================================== submit ========= */

const recordWorkItem = (item, event, assigneeId, actorId) => workItemRepo().insertAsync({
  queueCode: `approvals.${item.objectType}`,
  itemType: 'ApprovalItem',
  itemId: item.id,
  event,
  assigneeId: assigneeId ?? null,
  actorId: actorId ?? null,
  occurredOnUtc: new Date().toISOString(),
});

/**
 * IC-ADM-03 Submit. AC-ADM-006-02-02: a step whose condition is false is skipped and the skip
 * recorded. AC-ADM-006-06-01: a moderation queue assigns the item by its rule.
 */
export async function submitAsync({
  objectType, objectId, requesterId = null, requesterEmail = null, summary, amount = null,
  chainCode = null, approverRole = null, authorityLimit = null, workflow = null,
}) {
  let chain = chainCode ? await chainRepo().getOneAsync((c) => c.code === chainCode) : await chainForAsync(objectType);
  if (!chain && approverRole) {
    // a workflow approval step may carry its own single-step chain
    chain = await chainRepo().insertAsync({
      code: `wf-${objectType}-${approverRole}`,
      objectType,
      steps: [{ order: 1, approverRole, authorityLimit }],
      createdBy: 'PRD-ADM-002',
    });
  }
  if (!chain) return { ok: false, message: `no approval chain for object type ${objectType}` };

  const item = await itemRepo().insertAsync({
    objectType,
    objectId: String(objectId),
    requesterId,
    requesterEmail,
    summary,
    amount,
    chainId: chain.id,
    status: 'InReview',
    currentStep: 1,
    round: 1,
    skippedSteps: [],
    workflow,
    submittedOnUtc: new Date().toISOString(),
    heldBy: 'WF-ENG',
    prototypeDefault: HELD_LABEL,
  });
  const positioned = await skipStepsThatDoNotApplyAsync(item);
  const assigned = await assignFromQueueAsync(positioned);
  await recordWorkItem(assigned, 'Assigned', assigned.assigneeId, requesterId);
  try {
    await sendEventAsync({
      code: 'Administration.ApprovalAssigned', to: assigned.assigneeEmail ?? 'approvals@example.com', tokens: { summary, objectType },
    });
  } catch { /* the code is registered at installation; a send failure never blocks the submit */ }
  return { ok: true, item: assigned };
}

/** AC-ADM-006-02-02: a conditional step is included only if its condition is true. */
async function skipStepsThatDoNotApplyAsync(item) {
  const chain = await chainRepo().getByIdAsync(item.chainId);
  let current = item.currentStep;
  const skipped = [...item.skippedSteps];
  for (;;) {
    const step = chain.steps.find((s) => s.order === current);
    if (!step) break;
    if (!step.conditionRuleSet) break;
    // the step says which item fields its rule set's facts come from
    const facts = { 'Item.Amount': item.amount, 'Item.ObjectType': item.objectType };
    for (const [fact, field] of Object.entries(step.conditionFacts ?? {})) facts[fact] = item[field];
    const outcome = await evaluateAsync({
      ruleSetCode: step.conditionRuleSet,
      facts,
      callerRef: `approval-${item.id}`,
    });
    const include = outcome.outcome === (step.includeWhenOutcome ?? 'RequireApproval');
    if (include) break;
    skipped.push({ order: current, reason: `condition ${step.conditionRuleSet} was not met (outcome ${outcome.outcome})` });
    current += 1;
  }
  const next = chain.steps.find((s) => s.order === current);
  if (!next) {
    return itemRepo().updateAsync({ ...item, currentStep: current, skippedSteps: skipped });
  }
  return itemRepo().updateAsync({ ...item, currentStep: current, skippedSteps: skipped });
}

/** AC-ADM-006-06-01: assignment rules - round robin among role members, by category, by tier. */
async function assignFromQueueAsync(item) {
  const queue = await queueRepo().getOneAsync((q) => q.objectType === item.objectType);
  if (!queue) return item;
  const step = await currentStepDefinitionAsync(item);
  const members = queue.members ?? [];
  if (!members.length) return item;
  let assignee = null;
  if (queue.assignmentRule === 'round-robin') {
    const index = (queue.lastAssignedIndex ?? -1) + 1;
    assignee = members[index % members.length];
    await queueRepo().updateAsync({ ...queue, lastAssignedIndex: index % members.length });
  } else if (queue.assignmentRule === 'by-category') {
    assignee = members.find((m) => (m.categories ?? []).includes(item.category)) ?? members[0];
  } else if (queue.assignmentRule === 'by-seller-tier') {
    assignee = members.find((m) => (m.tiers ?? []).includes(item.sellerTier)) ?? members[0];
  }
  return itemRepo().updateAsync({
    ...item,
    queueCode: queue.code,
    assignmentRule: queue.assignmentRule,
    assigneeEmail: assignee?.email ?? null,
    assigneeId: assignee?.id ?? null,
    assignedOnUtc: new Date().toISOString(),
    approverRoleOfStep: step?.approverRole ?? null,
  });
}

/* ====================================================================== decisions ======== */

const decidedEarlierBy = async (itemId, email) => {
  const steps = await stepRepo().getAllAsync((s) => s.itemId === itemId);
  return steps.some((s) => s.decidedBy === email);
};

/**
 * AC-ADM-006-02-01 next step; AC-ADM-006-02-03 Adm.ApproveOwnItem; AC-ADM-006-01-04 the
 * IC-ADM-03 CanDecide guard; AC-ADM-006-01-03 the owning module's callback applies the effect;
 * AC-ADM-006-03-01 approve with conditions; AC-ADM-006-04-01 reject with a reason.
 * Section 12.4: the decision runs under ILocker key 'adm-approval-{itemId}'.
 */
export async function decideAsync({
  itemId, decision, customer, reasonCode = null, comment = null, conditions = [], gateways = null,
}) {
  return withLockAsync(lockKey.approval(itemId), async () => {
    const item = await itemRepo().getByIdAsync(itemId);
    if (!item) return { ok: false, message: 'unknown approval item' };
    if (!['InReview', 'ApprovedWithConditions', 'InAppeal'].includes(item.status)) {
      return { ok: false, message: `the item is ${item.status}; the step is already decided` };
    }
    if (!await canSeeItemAsync(item, customer)) {
      return { ok: false, denied: true, message: 'Access denied: this item is not assigned to you (BR-ADM-030).' };
    }
    const email = customer?.email ?? null;

    // BR-ADM-030: the requester never approves their own item, and one user decides at most one step
    if (['approve', 'approveWithConditions'].includes(decision)
      && (item.requesterEmail === email || item.requesterId === customer?.id || await decidedEarlierBy(itemId, email))) {
      return {
        ok: false, messageKey: 'Adm.ApproveOwnItem', message: resource('Adm.ApproveOwnItem'),
      };
    }
    // AC-ADM-006-04-01: a rejection needs a reason code
    if (decision === 'reject' && !reasonCode) {
      return { ok: false, messageKey: 'Adm.ReasonRequired', message: resource('Adm.ReasonRequired') };
    }

    // BR-ADM-031: the owning module's pre-decision guard; rejection is not guarded
    const handlers = callbacks.get(item.objectType);
    if (['approve', 'approveWithConditions', 'confirmConditions'].includes(decision) && handlers?.canDecide) {
      const verdict = await handlers.canDecide({
        itemId, objectType: item.objectType, objectId: item.objectId, decision,
      });
      if (verdict && verdict.allowed === false) {
        return {
          ok: false,
          messageKey: 'Adm.DecisionBlocked',
          message: resource('Adm.DecisionBlocked', { 0: verdict.reason }),
          blockedBy: handlers.feature,
          status: item.status, // nothing recorded, the item stays where it was
        };
      }
    }

    const chain = await chainRepo().getByIdAsync(item.chainId);
    await stepRepo().insertAsync({
      itemId,
      order: item.currentStep,
      round: item.round,
      decision,
      decidedBy: email,
      reasonCode,
      comment,
      decidedOnUtc: new Date().toISOString(),
    });
    await auditAsync({
      event: 'AUD-ADM-004',
      area: 'ADM',
      feature: 'PRD-ADM-006',
      entity: 'ApprovalItem',
      entityId: itemId,
      actor: email ?? 'system',
      actorRole: (customer?.roles ?? []).join(', '),
      before: { status: item.status, step: item.currentStep },
      after: { decision, reasonCode, comment },
      note: `approval decision on ${item.objectType} ${item.objectId}`,
    });

    if (decision === 'approveWithConditions') {
      for (const text of conditions) {
        await conditionRepo().insertAsync({
          itemId, text, doneBy: null, confirmedBy: null,
        });
      }
      const updated = await itemRepo().updateAsync({ ...item, status: 'ApprovedWithConditions' });
      return { ok: true, item: updated, moduleNotified: false, conditions: await conditionRepo().getAllAsync((c) => c.itemId === itemId) };
    }

    if (decision === 'reject') {
      const updated = await itemRepo().updateAsync({ ...item, status: item.status === 'InAppeal' ? 'RejectedFinal' : 'Rejected', rejectionReasonCode: reasonCode, rejectionComment: comment });
      const reason = await reasonRepo().getOneAsync((r) => r.code === reasonCode);
      if (handlers?.onRejected) await handlers.onRejected({ itemId, objectId: item.objectId, reasonCode, comment });
      try {
        await sendEventAsync({
          code: 'Administration.ApprovalDecided',
          to: item.requesterEmail ?? 'requester@example.com',
          tokens: {
            decision: 'rejected', reason: reason?.text ?? reasonCode, recourse: 'correct and resubmit, or appeal',
          },
          gateways,
        });
      } catch { /* notification failure never changes the decision */ }
      await recordWorkItem(updated, 'Completed', updated.assigneeId, customer?.id);
      return {
        ok: true, item: updated, recourse: ['resubmit', 'appeal'], reason: reason?.text ?? reasonCode,
      };
    }

    if (decision === 'confirmConditions') {
      const open = await conditionRepo().getAllAsync((c) => c.itemId === itemId && !c.doneBy);
      if (open.length) return { ok: false, message: `${open.length} correction(s) are not marked done` };
      for (const c of await conditionRepo().getAllAsync((x) => x.itemId === itemId)) {
        await conditionRepo().updateAsync({ ...c, confirmedBy: email });
      }
      return finishApprovalAsync(item, customer, handlers, gateways);
    }

    // approve: next step, or the last step
    const remaining = chain.steps.filter((s) => s.order > item.currentStep
      && !item.skippedSteps.some((k) => k.order === s.order) && !s.isAppealStep);
    if (item.status === 'InAppeal' || remaining.length === 0) {
      return finishApprovalAsync(item, customer, handlers, gateways);
    }
    const moved = await itemRepo().updateAsync({ ...item, currentStep: remaining[0].order });
    const positioned = await skipStepsThatDoNotApplyAsync(moved);
    const stepThere = chain.steps.find((s) => s.order === positioned.currentStep && !s.isAppealStep);
    if (!stepThere) {
      // every remaining step was skipped by its condition, so this was the last step
      return finishApprovalAsync(positioned, customer, handlers, gateways);
    }
    await recordWorkItem(positioned, 'Assigned', positioned.assigneeId, customer?.id);
    return {
      ok: true, item: positioned, movedToStep: positioned.currentStep, chainLength: chain.steps.filter((s) => !s.isAppealStep).length,
    };
  });
}

/** AC-ADM-006-01-03: the owning module's callback applies the effect; ADM changes nothing itself. */
async function finishApprovalAsync(item, customer, handlers, gateways) {
  const approved = await itemRepo().updateAsync({
    ...item, status: 'Approved', approvedOnUtc: new Date().toISOString(), completedOnUtc: new Date().toISOString(),
  });
  let callback = { called: false };
  if (handlers?.onApproved) {
    try {
      const result = await handlers.onApproved({ itemId: item.id, objectType: item.objectType, objectId: item.objectId });
      callback = { called: true, feature: handlers.feature, result };
    } catch (err) {
      // BR-ADM-031: a callback error leaves the item decided and raises an ADM-009 exception
      callback = { called: true, feature: handlers.feature, error: err.message };
    }
  }
  try {
    await sendEventAsync({
      code: 'Administration.ApprovalDecided', to: item.requesterEmail ?? 'requester@example.com', tokens: { decision: 'approved' }, gateways,
    });
  } catch { /* ignore */ }
  await recordWorkItem(approved, 'Completed', approved.assigneeId, customer?.id);
  return { ok: true, item: approved, moduleCallback: callback };
}

/** AC-ADM-006-04-02: resubmission starts a new round at step 1; earlier rounds are kept. */
export async function resubmitAsync({ itemId, customer }) {
  const item = await itemRepo().getByIdAsync(itemId);
  if (!item || item.status !== 'Rejected') return { ok: false, message: 'only a rejected item can be resubmitted' };
  const updated = await itemRepo().updateAsync({
    ...item, status: 'InReview', round: item.round + 1, currentStep: 1, skippedSteps: [],
  });
  await recordWorkItem(updated, 'Reopened', updated.assigneeId, customer?.id);
  return {
    ok: true,
    item: await skipStepsThatDoNotApplyAsync(updated),
    history: await stepRepo().getAllAsync((s) => s.itemId === itemId),
  };
}

/** AC-ADM-006-04-03: the appeal goes to the appeal step, by an approver other than the rejecter. */
export async function appealAsync({ itemId, customer }) {
  const item = await itemRepo().getByIdAsync(itemId);
  if (!item || item.status !== 'Rejected') return { ok: false, message: 'only a rejected item can be appealed' };
  const chain = await chainRepo().getByIdAsync(item.chainId);
  const appealStep = chain.steps.find((s) => s.isAppealStep);
  if (!appealStep) return { ok: false, message: 'no appeal step is defined in the chain' };
  const rejecter = (await stepRepo().getAllAsync((s) => s.itemId === itemId && s.decision === 'reject')).pop();
  const updated = await itemRepo().updateAsync({
    ...item, status: 'InAppeal', currentStep: appealStep.order, appealOf: rejecter?.decidedBy ?? null,
  });
  await recordWorkItem(updated, 'Reopened', updated.assigneeId, customer?.id);
  return {
    ok: true, item: updated, appealRole: appealStep.approverRole, rejectedBy: rejecter?.decidedBy ?? null, final: true,
  };
}

export async function markConditionDoneAsync({ conditionId, customer }) {
  const condition = await conditionRepo().getByIdAsync(conditionId);
  if (!condition) return { ok: false, message: 'unknown condition' };
  return { ok: true, condition: await conditionRepo().updateAsync({ ...condition, doneBy: customer?.email ?? 'requester', doneOnUtc: new Date().toISOString() }) };
}

export async function withdrawAsync({ itemId, customer }) {
  const item = await itemRepo().getByIdAsync(itemId);
  if (!item || !['InReview', 'Rejected'].includes(item.status)) return { ok: false, message: 'the item cannot be withdrawn' };
  return { ok: true, item: await itemRepo().updateAsync({ ...item, status: 'Withdrawn', withdrawnBy: customer?.email ?? null }) };
}

export const itemsAsync = () => itemRepo().getAllAsync();
export const itemAsync = (id) => itemRepo().getByIdAsync(id);
export const chainsAsync = () => chainRepo().getAllAsync();
export const reasonCodesAsync = (context = null) => reasonRepo().getAllAsync((r) => (context ? r.context === context : true));
export const moderationQueuesAsync = () => queueRepo().getAllAsync();
export const workItemEventsAsync = () => workItemRepo().getAllAsync();
