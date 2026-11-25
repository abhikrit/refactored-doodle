// PRD-ADM-006 Approval queues - one test per AC, named by AC ID.
// 6 stories, 14 criteria.
//
// The feature is held by decision WF-ENG, so what is built is the PRD's Proposed option and
// every item carries the label "Prototype default - decision WF-ENG pending" (P-1).

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const submit = (body) => api.post('/api/admin-console/approvals/submit', body);

describe('US-ADM-006-01 my queue', () => {
  test('AC-ADM-006-01-01', async () => {
    // "only items whose current step names one of the approver's roles, whose amount is within
    //  the approver's authority limit, or that are delegated to the approver are listed"
    const small = await submit({
      objectType: 'PayoutAccountChange', objectId: 9001, summary: 'small change', amount: 100000, chainCode: 'payout-account-change', requesterEmail: 'seller@example.com',
    });
    const large = await submit({
      objectType: 'PayoutAccountChange', objectId: 9002, summary: 'large change', amount: 900000, chainCode: 'payout-account-change', requesterEmail: 'seller@example.com',
    });
    assert.equal(small.ok, true);
    assert.equal(small.item.prototypeDefault, 'Prototype default - decision WF-ENG pending', 'P-1 label');

    // the finance officer is step 1 of the chain, with an authority limit of 500000
    const financeQueue = await api.get('/api/admin-console/approvals/queue', SESSIONS.finance);
    const ids = financeQueue.map((i) => i.id);
    assert.ok(ids.includes(small.item.id), 'within the authority limit');
    assert.ok(!ids.includes(large.item.id), 'above the authority limit, so not listed');

    // compliance is step 2, so neither item is in its queue yet
    const complianceQueue = await api.get('/api/admin-console/approvals/queue', SESSIONS.compliance);
    assert.ok(!complianceQueue.some((i) => i.id === small.item.id), 'step 2 does not see a step 1 item');

    // a delegation (IAM-009) puts an item in another approver's queue
    const item = await repository('ApprovalItem').getByIdAsync(large.item.id);
    await repository('ApprovalItem').updateAsync({ ...item, delegatedTo: ['operations@example.com'] });
    const delegated = await api.get('/api/admin-console/approvals/queue', SESSIONS.operations);
    assert.ok(delegated.some((i) => i.id === large.item.id), 'a delegated item is listed');
  });

  test('AC-ADM-006-01-02', async () => {
    // "the user opens it by direct link: access is denied and nothing changes"
    const submitted = await submit({
      objectType: 'PayoutAccountChange', objectId: 9003, summary: 'not yours', amount: 50000, chainCode: 'payout-account-change',
    });
    const denied = await api.call('GET', `/api/admin-console/approvals/items/${submitted.item.id}`, undefined, SESSIONS.catalogue);
    assert.equal(denied.status, 403, 'the catalogue role does not hold Approvals.Act at all');

    const wrongRole = await api.call('GET', `/api/admin-console/approvals/items/${submitted.item.id}`, undefined, SESSIONS.compliance);
    assert.equal(wrongRole.status, 403, 'a role that is not on the current step is refused');
    assert.equal(wrongRole.body.denied, true);
    const unchanged = await repository('ApprovalItem').getByIdAsync(submitted.item.id);
    assert.equal(unchanged.status, 'InReview', 'nothing changed');
  });

  test('AC-ADM-006-01-03', async () => {
    // "the owning module's callback (IC-ADM-03) applies the effect through the module's own
    //  service; ADM never changes the object itself (BR-ADM-011)"
    const change = await api.post('/api/sellers/payout-account-changes', {
      sellerId: 1, oldAccount: '0000-1111', newAccount: '2222-3333',
    }, SESSIONS.operations);
    assert.equal(change.ok, true);

    const step1 = await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.finance);
    assert.equal(step1.ok, true);
    const step2 = await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(step2.ok, true);
    assert.equal(step2.item.status, 'Approved');
    assert.equal(step2.moduleCallback.called, true);
    assert.equal(step2.moduleCallback.feature, 'PRD-SEL-005', 'the owning module applied it');

    const applied = await repository('PayoutAccountChange').getByIdAsync(change.change.id);
    assert.equal(applied.status, 'Applied', 'the object was changed by SEL, not by ADM');
    assert.equal(applied.newAccount, '2222-3333');

    const callbacks = await api.get('/api/admin-console/approvals/callbacks');
    assert.ok(callbacks.some((c) => c.objectType === 'PayoutAccountChange' && c.feature === 'PRD-SEL-005'));
  });

  test('AC-ADM-006-01-04', async () => {
    // "ADM calls the guard before it records the decision; if the guard refuses, nothing is
    //  recorded, the item stays in its current status and Adm.DecisionBlocked shows the reason;
    //  rejection is not guarded"
    const application = await api.post('/api/sellers/applications', { name: 'Blocked Seller Ltd', documentsOutstanding: true }, SESSIONS.operations);
    const blocked = await api.post(`/api/admin-console/approvals/items/${application.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.messageKey, 'Adm.DecisionBlocked');
    assert.match(blocked.message, /documents are not verified yet/);
    assert.equal(blocked.blockedBy, 'PRD-SEL-003');
    assert.equal(blocked.status, 'InReview', 'the item stays where it was');
    const steps = await repository('ApprovalStep').getAllAsync((s) => s.itemId === application.approvalItemId);
    assert.equal(steps.length, 0, 'nothing was recorded');

    // rejection is not guarded
    const rejected = await api.post(`/api/admin-console/approvals/items/${application.approvalItemId}/decide`, { decision: 'reject', reasonCode: 'INCOMPLETE_DOCS' }, SESSIONS.compliance);
    assert.equal(rejected.ok, true);
    assert.equal(rejected.item.status, 'Rejected');

    // once the module's own check passes, the guard allows the decision
    const second = await api.post('/api/sellers/applications', { name: 'Ready Seller Ltd', documentsOutstanding: false }, SESSIONS.operations);
    const allowed = await api.post(`/api/admin-console/approvals/items/${second.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(allowed.ok, true);
    assert.equal(allowed.item.status, 'Approved');
  });
});

describe('US-ADM-006-02 several steps and conditions', () => {
  test('AC-ADM-006-02-01', async () => {
    // "step 1 approves: the item moves to step 2; it is approved only when the last step approves"
    const submitted = await submit({
      objectType: 'PayoutAccountChange', objectId: 9100, summary: 'two steps', amount: 120000, chainCode: 'payout-account-change', requesterEmail: 'seller@example.com',
    });
    const first = await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/decide`, { decision: 'approve' }, SESSIONS.finance);
    assert.equal(first.ok, true);
    assert.equal(first.movedToStep, 2, 'the item moved to step 2');
    assert.equal(first.item.status, 'InReview', 'not approved yet');
    assert.equal(first.chainLength, 2, 'the chain is shown on the item');

    const second = await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(second.item.status, 'Approved', 'approved when the last step approves');
  });

  test('AC-ADM-006-02-02', async () => {
    // "a step with a condition is included only if the condition is true, otherwise it is
    //  skipped and the skip is recorded"
    // the internal-approval chain's step 2 applies only when the order-approval rule set says
    // RequireApproval, which it does above 500000
    const below = await submit({
      objectType: 'WorkflowStep', objectId: 'c1', summary: 'small internal approval', amount: 10000, chainCode: 'internal-approval-chain',
    });
    const belowItem = await repository('ApprovalItem').getByIdAsync(below.item.id);
    assert.equal(belowItem.currentStep, 1);

    const approvedStep1 = await api.post(`/api/admin-console/approvals/items/${below.item.id}/decide`, { decision: 'approve' }, SESSIONS.finance);
    assert.equal(approvedStep1.item.status, 'Approved', 'step 2 did not apply, so the item is approved at step 1');
    const skipped = (await repository('ApprovalItem').getByIdAsync(below.item.id)).skippedSteps;
    assert.ok(skipped.some((s) => s.order === 2), 'the skip is recorded');
    assert.match(skipped.find((s) => s.order === 2).reason, /order-approval/);

    const above = await submit({
      objectType: 'WorkflowStep', objectId: 'c2', summary: 'large internal approval', amount: 900000, chainCode: 'internal-approval-chain',
    });
    const step1 = await api.post(`/api/admin-console/approvals/items/${above.item.id}/decide`, { decision: 'approve' }, SESSIONS.finance);
    assert.equal(step1.movedToStep, 2, 'above the threshold the conditional step applies');
  });

  test('AC-ADM-006-02-03', async () => {
    // "the requester, or a user who decided an earlier step, cannot approve: Adm.ApproveOwnItem"
    const own = await submit({
      objectType: 'PayoutAccountChange', objectId: 9200, summary: 'my own request', amount: 90000, chainCode: 'payout-account-change', requesterEmail: 'finance@example.com',
    });
    const refused = await api.post(`/api/admin-console/approvals/items/${own.item.id}/decide`, { decision: 'approve' }, SESSIONS.finance);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.ApproveOwnItem');
    assert.match(refused.message, /because you requested it or decided an earlier step/);

    // and one user decides at most one step of an item, even when both steps name their role
    await repository('ApprovalChain').insertAsync({
      code: 'two-compliance-steps',
      objectType: 'TwoStepCheck',
      steps: [{ order: 1, approverRole: 'Compliance' }, { order: 2, approverRole: 'Compliance' }],
    });
    const item = await submit({
      objectType: 'TwoStepCheck', objectId: 9201, summary: 'two steps, one user', amount: 90000, chainCode: 'two-compliance-steps', requesterEmail: 'seller@example.com',
    });
    const first = await api.post(`/api/admin-console/approvals/items/${item.item.id}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(first.ok, true);
    assert.equal(first.movedToStep, 2);
    const second = await api.post(`/api/admin-console/approvals/items/${item.item.id}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(second.ok, false);
    assert.equal(second.messageKey, 'Adm.ApproveOwnItem', 'the same user cannot decide the next step');
  });
});

describe('US-ADM-006-03 and 04 conditions, rejection, resubmission, appeal', () => {
  test('AC-ADM-006-03-01', async () => {
    // "the item becomes ApprovedWithConditions; the owning module is not told to apply the
    //  approval until the requester marks every correction done and the approver confirms"
    const change = await api.post('/api/sellers/payout-account-changes', { sellerId: 2, oldAccount: '1-1', newAccount: '9-9' }, SESSIONS.operations);
    const withConditions = await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, {
      decision: 'approveWithConditions', conditions: ['Send the bank letter', 'Confirm the branch code'],
    }, SESSIONS.finance);
    assert.equal(withConditions.ok, true);
    assert.equal(withConditions.item.status, 'ApprovedWithConditions');
    assert.equal(withConditions.moduleNotified, false, 'the owning module is not told yet');
    assert.equal(withConditions.conditions.length, 2, 'the corrections are tracked');
    assert.equal((await repository('PayoutAccountChange').getByIdAsync(change.change.id)).status, 'PendingApproval');

    const early = await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, { decision: 'confirmConditions' }, SESSIONS.finance);
    assert.equal(early.ok, false, 'confirmation is refused while corrections are open');

    for (const condition of withConditions.conditions) {
      await api.post(`/api/admin-console/approvals/conditions/${condition.id}/done`, {}, SESSIONS.operations);
    }
    const confirmed = await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, { decision: 'confirmConditions' }, SESSIONS.finance);
    assert.equal(confirmed.item.status, 'Approved');
    assert.equal(confirmed.moduleCallback.called, true, 'now the owning module applies it');
    assert.equal((await repository('PayoutAccountChange').getByIdAsync(change.change.id)).status, 'Applied');
  });

  test('AC-ADM-006-04-01', async () => {
    // "with no reason code the rejection is refused with Adm.ReasonRequired; with one the item
    //  becomes Rejected and the requester is notified with the reason and the recourse options"
    const submitted = await submit({
      objectType: 'PayoutAccountChange', objectId: 9300, summary: 'to reject', amount: 70000, chainCode: 'payout-account-change', requesterEmail: 'seller@example.com',
    });
    const noReason = await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/decide`, { decision: 'reject' }, SESSIONS.finance);
    assert.equal(noReason.ok, false);
    assert.equal(noReason.messageKey, 'Adm.ReasonRequired');
    assert.equal(noReason.message, 'Choose a reason.');

    const rejected = await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/decide`, {
      decision: 'reject', reasonCode: 'INCOMPLETE_DOCS', comment: 'the bank letter is missing',
    }, SESSIONS.finance);
    assert.equal(rejected.ok, true);
    assert.equal(rejected.item.status, 'Rejected');
    assert.equal(rejected.reason, 'The supporting documents are incomplete.');
    assert.deepEqual(rejected.recourse, ['resubmit', 'appeal']);

    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.some((m) => m.event === 'Administration.ApprovalDecided'), 'the requester is notified through TRK-005');
  });

  test('AC-ADM-006-04-02', async () => {
    // "a new round of the same item starts at step 1 and the history of earlier rounds is kept"
    const rejected = (await api.get('/api/admin-console/approvals/items')).find((i) => i.status === 'Rejected' && i.objectId === '9300');
    const resubmitted = await api.post(`/api/admin-console/approvals/items/${rejected.id}/resubmit`, {}, SESSIONS.operations);
    assert.equal(resubmitted.ok, true);
    assert.equal(resubmitted.item.status, 'InReview');
    assert.equal(resubmitted.item.round, 2, 'a new round');
    assert.equal(resubmitted.item.currentStep, 1, 'starting at step 1');
    assert.ok(resubmitted.history.some((h) => h.round === 1 && h.decision === 'reject'), 'the earlier round is kept');
  });

  test('AC-ADM-006-04-03', async () => {
    // "the item goes to the appeal step of the chain (an approver role other than the one that
    //  rejected); the appeal outcome is final"
    const submitted = await submit({
      objectType: 'PayoutAccountChange', objectId: 9400, summary: 'to appeal', amount: 60000, chainCode: 'payout-account-change', requesterEmail: 'seller@example.com',
    });
    await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/decide`, { decision: 'reject', reasonCode: 'POLICY_BREACH' }, SESSIONS.finance);
    const appealed = await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/appeal`, {}, SESSIONS.operations);
    assert.equal(appealed.ok, true);
    assert.equal(appealed.item.status, 'InAppeal');
    assert.equal(appealed.appealRole, 'Administrators');
    assert.equal(appealed.rejectedBy, 'finance@example.com');
    assert.notEqual(appealed.appealRole, 'Finance', 'a role other than the one that rejected');
    assert.equal(appealed.final, true);

    const decided = await api.post(`/api/admin-console/approvals/items/${submitted.item.id}/decide`, { decision: 'approve' }, SESSIONS.admin);
    assert.equal(decided.item.status, 'Approved', 'the appeal outcome is final');
  });
});

describe('US-ADM-006-05 and 06 high-risk actions and moderation queues', () => {
  test('AC-ADM-006-05-01', async () => {
    // "an approval item is created through IC-ADM-03; the old account stays in use until the
    //  item is approved; every decision is written to the audit trail (AUD-ADM-004)"
    const change = await api.post('/api/sellers/payout-account-changes', { sellerId: 3, oldAccount: '5-5', newAccount: '7-7' }, SESSIONS.operations);
    assert.ok(change.approvalItemId, 'the change created an approval item');
    const pending = await repository('PayoutAccountChange').getByIdAsync(change.change.id);
    assert.equal(pending.status, 'PendingApproval');
    assert.equal(pending.oldAccount, '5-5', 'the old account stays in use');

    await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.finance);
    await api.post(`/api/admin-console/approvals/items/${change.approvalItemId}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal((await repository('PayoutAccountChange').getByIdAsync(change.change.id)).status, 'Applied');

    const trail = await api.get('/api/security/audit?event=AUD-ADM-004');
    const decisions = trail.filter((e) => e.entityId === String(change.approvalItemId));
    assert.equal(decisions.length, 2, 'every decision is audited');
    assert.ok(decisions.every((d) => d.actor && d.after.decision));
  });

  test('AC-ADM-006-05-02', async () => {
    // "a module registers another action as high-risk: it follows the same approval flow"
    const { registerApprovalCallbacks } = await import('../../packages/server/src/plugins/product-adm/services/approvals.js');
    let applied = false;
    registerApprovalCallbacks('BankDetailsExport', {
      feature: 'PRD-SEC-014',
      onApproved: async () => { applied = true; return { applied: true }; },
    });
    await repository('ApprovalChain').insertAsync({
      code: 'bank-details-export', objectType: 'BankDetailsExport', steps: [{ order: 1, approverRole: 'Compliance' }],
    });
    const item = await submit({
      objectType: 'BankDetailsExport', objectId: 'export-1', summary: 'export seller bank details', chainCode: 'bank-details-export', requesterEmail: 'operations@example.com',
    });
    assert.equal(item.ok, true);
    const decided = await api.post(`/api/admin-console/approvals/items/${item.item.id}/decide`, { decision: 'approve' }, SESSIONS.compliance);
    assert.equal(decided.item.status, 'Approved');
    assert.equal(applied, true, 'the newly registered action followed the same flow');
  });

  test('AC-ADM-006-06-01', async () => {
    // "it is assigned to a member by that rule and appears in that member's queue"
    const queues = await api.get('/api/admin-console/approvals/queues');
    const listing = queues.find((q) => q.objectType === 'Listing');
    assert.equal(listing.assignmentRule, 'round-robin');
    assert.equal(listing.members.length, 2);

    const first = await submit({
      objectType: 'Listing', objectId: 'listing-1', summary: 'new listing', chainCode: 'listing-moderation', requesterEmail: 'seller@example.com',
    });
    const second = await submit({
      objectType: 'Listing', objectId: 'listing-2', summary: 'another listing', chainCode: 'listing-moderation', requesterEmail: 'seller@example.com',
    });
    assert.equal(first.item.assignmentRule, 'round-robin');
    assert.notEqual(first.item.assigneeEmail, second.item.assigneeEmail, 'round robin among the role members');
    assert.ok([first.item.assigneeEmail, second.item.assigneeEmail].includes('catalogue@example.com'));

    // the seller-application queue assigns by seller tier
    const byTier = queues.find((q) => q.objectType === 'SellerApplication');
    assert.equal(byTier.assignmentRule, 'by-seller-tier');
  });
});
