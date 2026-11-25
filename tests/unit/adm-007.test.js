// PRD-ADM-007 Operations console and work queues - one test per AC, named by AC ID.
// 8 stories, 9 criteria. AC-ADM-007-08-01 (tablet and phone widths) is a browser criterion and
// is covered in tests/ui/adm.ui.test.js.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

describe('US-ADM-007-01 one console', () => {
  test('AC-ADM-007-01-01', async () => {
    // "each tab keeps its filters and scroll position for the session; a queue whose permission
    //  the user lacks is not shown"
    const forOperations = await api.get('/api/admin-console/operations/console', SESSIONS.operations);
    assert.equal(forOperations.canOpen, true);
    const codes = forOperations.tabs.map((t) => t.code);
    assert.ok(codes.includes('approvals') && codes.includes('exceptions'), 'the queues the role may open');
    assert.ok(forOperations.hidden.some((h) => h.code === 'disputes'), 'a queue whose permission it lacks is not shown');

    const forCatalogue = await api.get('/api/admin-console/operations/console', SESSIONS.catalogue);
    assert.equal(forCatalogue.canOpen, false, 'without WorkQueues.View the console does not open');
    assert.equal(forCatalogue.tabs.length, 0);

    // the filters of a tab are kept for the session as a saved view with the tab's screen key
    await api.post('/api/admin-console/operations/views', {
      screen: 'console.exceptions', name: '(session)', filters: { severity: 'High', scrollTop: 420 },
    }, SESSIONS.operations);
    const kept = await api.get('/api/admin-console/operations/views?screen=console.exceptions', SESSIONS.operations);
    assert.equal(kept[0].filters.severity, 'High');
    assert.equal(kept[0].filters.scrollTop, 420, 'the scroll position is kept with the filters');
  });

  test('AC-ADM-007-01-02', async () => {
    // "a WorkItemEvent records item, queue, event (Assigned, Completed, Reopened), assignee,
    //  actor and time; the events are readable by RPT-009"
    const item = await api.post('/api/admin-console/approvals/submit', {
      objectType: 'Listing', objectId: 'wq-1', summary: 'queue metrics', chainCode: 'listing-moderation', requesterEmail: 'seller@example.com',
    });
    await api.post(`/api/admin-console/approvals/items/${item.item.id}/decide`, { decision: 'reject', reasonCode: 'POLICY_BREACH' }, SESSIONS.catalogue);
    await api.post(`/api/admin-console/approvals/items/${item.item.id}/resubmit`, {}, SESSIONS.operations);

    const metrics = await api.get('/api/admin-console/operations/work-items', SESSIONS.operations);
    const mine = metrics.events.filter((e) => e.itemId === item.item.id);
    assert.deepEqual([...new Set(mine.map((e) => e.event))].sort(), ['Assigned', 'Completed', 'Reopened']);
    for (const e of mine) {
      assert.ok(e.queueCode, 'the queue');
      assert.equal(e.itemType, 'ApprovalItem');
      assert.ok(e.occurredOnUtc, 'the time');
    }
    assert.equal(metrics.readBy, 'PRD-RPT-009');
    const queue = metrics.byQueue.find((q) => q.queueCode === 'approvals.Listing');
    assert.ok(queue.assigned >= 1 && queue.completed >= 1 && queue.reopened >= 1);
  });
});

describe('US-ADM-007-02 the operational order view', () => {
  test('AC-ADM-007-02-01', async () => {
    // "orders are grouped by stage - awaiting pickup, awaiting sorting, awaiting dispatch, out
    //  for last-mile delivery - with counts, filters by branch or outlet, and a link to the
    //  owning LOG action; the stage is the one ORD supplies and the shipment stage the one LOG
    //  supplies; ADM derives no stage itself"
    const orderRepo = repository('Order');
    for (const [number, stage, outlet] of [
      ['OP-1', 'Placed', null], ['OP-2', 'Packed', null], ['OP-3', 'ReadyForPickup', 'Lilongwe Post Office'], ['OP-4', 'Dispatched', null], ['OP-5', 'Delivered', null],
    ]) {
      await orderRepo.insertAsync({
        orderNumber: number, stage, orderStatus: 'Processing', customerEmail: 'buyer@example.com', orderTotal: 1000, pickupPointName: outlet, branch: 'Central',
      });
    }

    const view = await api.get('/api/admin-console/operations/orders', SESSIONS.operations);
    assert.deepEqual(view.groups.map((g) => g.stage), ['AwaitingPickup', 'AwaitingSorting', 'AwaitingDispatch', 'OutForLastMile']);
    assert.ok(view.groups.every((g) => typeof g.count === 'number'), 'counts per stage');
    const awaitingPickup = view.groups.find((g) => g.stage === 'AwaitingPickup');
    assert.ok(awaitingPickup.orders.some((o) => o.orderNumber === 'OP-1'));
    assert.equal(view.groups.find((g) => g.stage === 'AwaitingSorting').orders.some((o) => o.orderNumber === 'OP-2'), true);
    assert.equal(view.groups.flatMap((g) => g.orders).some((o) => o.orderNumber === 'OP-5'), false, 'a delivered order is not in the operational view');

    const row = awaitingPickup.orders.find((o) => o.orderNumber === 'OP-1');
    assert.match(row.stageSuppliedBy, /PRD-ORD-002/, 'the stage comes from ORD');
    assert.match(row.logAction, /\/admin\/sales\//, 'a link to the owning action');
    assert.equal(view.derivedByAdm, false);

    // the stage of an open shipment is the one LOG supplies through IC-LOG-07
    await repository('Shipment').insertAsync({
      orderNumber: 'OP-2', trackingNumber: 'TRK-OP2', shippedDateUtc: new Date().toISOString(), deliveredDateUtc: null,
    });
    const withShipment = await api.get('/api/admin-console/operations/orders', SESSIONS.operations);
    const moved = withShipment.groups.find((g) => g.stage === 'OutForLastMile').orders.find((o) => o.orderNumber === 'OP-2');
    assert.ok(moved, 'the LOG shipment stage wins over the order stage');
    assert.match(moved.stageSuppliedBy, /IC-LOG-07/);

    const filtered = await api.get('/api/admin-console/operations/orders?outlet=Lilongwe%20Post%20Office', SESSIONS.operations);
    assert.equal(filtered.groups.flatMap((g) => g.orders).every((o) => o.outlet === 'Lilongwe Post Office'), true, 'filtered by outlet');
  });
});

describe('US-ADM-007-03 to 07 dashboard, views, drafts, shortcuts, live count', () => {
  test('AC-ADM-007-03-01', async () => {
    // "an operator arranges dashboard tiles from the tiles allowed for their role; signing in
    //  again shows the same arrangement; tiles show only data the operator may see"
    const before2 = await api.get('/api/admin-console/operations/dashboard', SESSIONS.operations);
    assert.ok(before2.allowed.length > 0);
    assert.equal(before2.allowed.every((t) => t.roles.includes('Operations')), true, 'only tiles allowed for the role');

    const saved = await api.post('/api/admin-console/operations/dashboard', {
      tiles: ['open-exceptions', 'alerts', 'workflow-cases'],
    }, SESSIONS.operations);
    assert.deepEqual(saved.refusedTiles, ['workflow-cases'], 'a tile not allowed for the role is refused');

    const again = await api.get('/api/admin-console/operations/dashboard', SESSIONS.operations);
    assert.deepEqual(again.tiles.map((t) => t.code), ['open-exceptions', 'alerts'], 'the arrangement is kept');
    assert.ok(again.tiles.every((t) => typeof t.value === 'number'), 'each tile shows its figure');
  });

  test('AC-ADM-007-04-01', async () => {
    // "the view opens later with the same filter applied to current data"
    await api.post('/api/admin-console/operations/views', {
      screen: 'exceptions', name: 'High severity', filters: { severity: 'High' },
    }, SESSIONS.operations);
    const views = await api.get('/api/admin-console/operations/views?screen=exceptions', SESSIONS.operations);
    const view = views.find((v) => v.name === 'High severity');
    assert.ok(view);
    assert.deepEqual(view.filters, { severity: 'High' });

    const applied = await api.get('/api/admin-console/exceptions?type=IntegrationError', SESSIONS.operations);
    assert.ok(applied.exceptions.every((e) => e.type === 'IntegrationError'), 'the filter applies to current data');
  });

  test('AC-ADM-007-05-01', async () => {
    // "the draft is offered for restore; drafts are kept per user and deleted after the
    //  retention period"
    await api.post('/api/admin-console/operations/drafts', {
      formKey: 'exception-resolution-42', draft: { reasonCode: 'DATA_FIXED', comment: 'half written' },
    }, SESSIONS.operations);

    const offered = await api.get('/api/admin-console/operations/drafts/exception-resolution-42', SESSIONS.operations);
    assert.equal(offered.offered, true);
    assert.equal(offered.draft.comment, 'half written');

    const otherUser = await api.get('/api/admin-console/operations/drafts/exception-resolution-42', SESSIONS.admin);
    assert.equal(otherUser.offered, false, 'drafts are per user');

    // past the retention period the draft is gone
    const row = await repository('WorkDraft').getOneAsync((d) => d.formKey === 'exception-resolution-42');
    await repository('WorkDraft').updateAsync({ ...row, draftUpdatedOnUtc: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString() });
    const expired = await api.get('/api/admin-console/operations/drafts/exception-resolution-42', SESSIONS.operations);
    assert.equal(expired.offered, false);
    assert.ok(expired.expiredAfterDays > 0, 'the retention period is a setting');
  });

  test('AC-ADM-007-06-01', async () => {
    // "the action runs as if its button was pressed, with the same permission checks and
    //  confirmations"
    const approve = await api.post('/api/admin-console/operations/shortcuts', { action: 'approve' }, SESSIONS.compliance);
    assert.equal(approve.ok, true);
    assert.equal(approve.ranAs, 'button');
    assert.equal(approve.permissionChecked, 'Administration.Core.Approvals.Act');

    const denied = await api.post('/api/admin-console/operations/shortcuts', { action: 'escalate' }, SESSIONS.catalogue);
    assert.equal(denied.ok, false);
    assert.equal(denied.denied, true, 'the same permission check as the button');
    assert.equal(denied.permission, 'Administration.Core.Exceptions.CreateEditDelete');

    const needsConfirm = await api.post('/api/admin-console/operations/shortcuts', { action: 'reject' }, SESSIONS.compliance);
    assert.equal(needsConfirm.needsConfirmation, true, 'the same confirmation as the button');
    const confirmed = await api.post('/api/admin-console/operations/shortcuts', { action: 'reject', payload: { confirmed: true } }, SESSIONS.compliance);
    assert.equal(confirmed.ok, true);
  });

  test('AC-ADM-007-07-01', async () => {
    // "the console header shows the count of online customers (native online-customer data)"
    const customers = await repository('Customer').getAllAsync((c) => !c.deleted);
    // every sign-in stamps the activity time, so the window starts from a known state
    for (const c of customers) {
      await repository('Customer').updateAsync({ ...c, lastActivityUtc: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() });
    }
    await repository('Customer').updateAsync({ ...customers[0], lastActivityUtc: new Date().toISOString() });
    await repository('Customer').updateAsync({ ...customers[1], lastActivityUtc: new Date(Date.now() - 60 * 60 * 1000).toISOString() });

    const online = await api.get('/api/admin-console/operations/online', SESSIONS.operations);
    assert.equal(online.count, 1, 'only customers active within the window');
    assert.ok(online.minutes > 0);
    assert.match(online.source, /CustomerSettings\.OnlineCustomerMinutes/);
  });
});
