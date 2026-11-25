// PRD-ADM-007 Operations console and work queues.
//
// US-ADM-007-01  one console, queue tabs that keep their place
// US-ADM-007-02  the operational order view by fulfilment stage
// US-ADM-007-03  a personal dashboard of my queues, alerts and figures
// US-ADM-007-04  saved views
// US-ADM-007-05  unfinished work kept across sessions
// US-ADM-007-06  keyboard shortcuts
// US-ADM-007-07  a live count of active users
// US-ADM-007-08  usable on a tablet or phone
//
// BR-ADM-075: assignment, completion and reopen are recorded as WorkItemEvents, which RPT-009
// reads for operator metrics.
// AC-ADM-007-02-01: the stage of an order is the one ORD supplies
// (OrderStageDefinition.OperationalStage) and the stage of an open shipment is the one LOG
// supplies (IC-LOG-07 GetOperationalStage). ADM derives no stage itself.

import { repository } from '../../../core/repository.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { getSettingAsync } from '../../../core/settings.js';
import { runProviders } from '../../../core/providers.js';
import { STAGES as ORDER_STAGES } from '../../product-ord/services/orders.js';

const viewRepo = () => repository('SavedView');
const draftRepo = () => repository('WorkDraft');
const layoutRepo = () => repository('DashboardLayout');
const workItemRepo = () => repository('WorkItemEvent');

/** The queue tabs of the console, each with the permission it needs. */
export const QUEUES = [
  {
    code: 'approvals', name: 'Approvals', permission: 'Administration.Core.Approvals.Act', feature: 'PRD-ADM-006',
  },
  {
    code: 'exceptions', name: 'Exceptions', permission: 'Administration.Core.Exceptions.CreateEditDelete', feature: 'PRD-ADM-009',
  },
  {
    code: 'disputes', name: 'Disputes', permission: 'Customers.CustomersView', feature: 'PRD-CRM-001',
  },
  {
    code: 'audit', name: 'Audit', permission: 'System.ManageSystemLog', feature: 'PRD-SEC-004',
  },
];

/** The dashboard tiles each role may place (AC-ADM-007-03-01). */
export const TILES = [
  { code: 'my-approvals', name: 'Approvals waiting for me', roles: ['Administrators', 'Compliance', 'Operations'] },
  { code: 'open-exceptions', name: 'Open exceptions', roles: ['Administrators', 'Operations'] },
  { code: 'alerts', name: 'Alerts raised', roles: ['Administrators', 'Operations'] },
  { code: 'orders-by-stage', name: 'Orders by operational stage', roles: ['Administrators', 'Operations', 'Logistics'] },
  { code: 'online-customers', name: 'Customers online now', roles: ['Administrators', 'Operations'] },
  { code: 'workflow-cases', name: 'Workflow cases running', roles: ['Administrators'] },
];

/** AC-ADM-007-01-01: a queue whose permission the user lacks is not shown. */
export async function consoleForAsync(customer) {
  const canOpen = await authorizeAsync('Administration.Core.WorkQueues.View', customer);
  const tabs = [];
  for (const q of QUEUES) {
    if (!canOpen) continue;
    if (await authorizeAsync(q.permission, customer)) tabs.push(q);
  }
  return {
    canOpen,
    permission: 'Administration.Core.WorkQueues.View',
    tabs,
    hidden: canOpen ? QUEUES.filter((q) => !tabs.some((t) => t.code === q.code)).map((q) => ({ code: q.code, needs: q.permission })) : QUEUES.map((q) => ({ code: q.code, needs: q.permission })),
    shortcuts: SHORTCUTS,
  };
}

/* ======================================================== the operational order view ===== */

export const OPERATIONAL_STAGES = ['AwaitingPickup', 'AwaitingSorting', 'AwaitingDispatch', 'OutForLastMile'];

/**
 * AC-ADM-007-02-01: grouped by stage with counts, filters by branch or outlet, and a link to the
 * owning LOG action. ADM asks ORD and LOG for the stage; it derives none.
 */
export async function operationalOrderViewAsync({ branch = null, outlet = null } = {}) {
  const orders = await repository('Order').getAllAsync();
  const shipments = await repository('Shipment').getAllAsync();
  const groups = Object.fromEntries(OPERATIONAL_STAGES.map((s) => [s, []]));

  for (const order of orders) {
    const definition = ORDER_STAGES.find((s) => s.stage === order.stage);
    const stage = definition?.operationalStage; // supplied by ORD (BR-ORD-015)
    if (!stage || !groups[stage]) continue;
    if (outlet && order.pickupPointName !== outlet) continue;
    if (branch && order.branch !== branch) continue;
    const open = shipments.filter((s) => s.orderNumber === order.orderNumber && !s.deliveredDateUtc);
    let shipmentStage = null;
    if (open.length) {
      // IC-LOG-07 GetOperationalStage, supplied by LOG (BR-LOG-170)
      const supplied = await runProviders('IC-LOG-07', 'collect', { shipment: open[0] });
      shipmentStage = supplied.find((r) => r.result?.stage)?.result?.stage ?? null;
    }
    groups[shipmentStage && groups[shipmentStage] ? shipmentStage : stage].push({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      total: order.orderTotal,
      stage: order.stage,
      operationalStage: shipmentStage ?? stage,
      stageSuppliedBy: shipmentStage ? 'PRD-LOG-011 (IC-LOG-07)' : 'PRD-ORD-002 (OrderStageDefinition.OperationalStage)',
      outlet: order.pickupPointName ?? null,
      branch: order.branch ?? null,
      logAction: shipmentStage ? `/admin/sales/shipments?order=${order.orderNumber}` : `/admin/sales/orders/${order.orderNumber}`,
    });
  }
  return {
    groups: OPERATIONAL_STAGES.map((stage) => ({ stage, count: groups[stage].length, orders: groups[stage] })),
    filters: {
      outlets: [...new Set(orders.map((o) => o.pickupPointName).filter(Boolean))],
      branches: [...new Set(orders.map((o) => o.branch).filter(Boolean))],
    },
    derivedByAdm: false,
  };
}

/* ====================================================================== dashboards ======= */

export async function tilesForAsync(customer) {
  const roles = customer?.roles ?? [];
  return TILES.filter((t) => t.roles.some((r) => roles.includes(r)));
}

export async function dashboardAsync(customer) {
  const allowed = await tilesForAsync(customer);
  const saved = await layoutRepo().getOneAsync((l) => l.customerId === customer?.id);
  const codes = (saved?.tiles ?? allowed.map((t) => t.code)).filter((c) => allowed.some((t) => t.code === c));
  const counts = await tileCountsAsync(customer);
  return {
    tiles: codes.map((code) => ({
      code, name: TILES.find((t) => t.code === code)?.name ?? code, value: counts[code] ?? 0,
    })),
    allowed,
    saved: Boolean(saved),
  };
}

export async function saveDashboardAsync({ customer, tiles }) {
  const allowed = (await tilesForAsync(customer)).map((t) => t.code);
  const refused = tiles.filter((t) => !allowed.includes(t));
  const kept = tiles.filter((t) => allowed.includes(t));
  const existing = await layoutRepo().getOneAsync((l) => l.customerId === customer?.id);
  const saved = existing
    ? await layoutRepo().updateAsync({ ...existing, tiles: kept })
    : await layoutRepo().insertAsync({ customerId: customer?.id, tiles: kept });
  return { ok: true, layout: saved, refusedTiles: refused };
}

async function tileCountsAsync(customer) {
  const [items, exceptions, alerts, cases] = await Promise.all([
    repository('ApprovalItem').getAllAsync((i) => i.status === 'InReview'),
    repository('ExceptionRecord').getAllAsync((e) => e.status !== 'Resolved'),
    repository('AlertEvent').getAllAsync((a) => a.status === 'Raised'),
    repository('WorkflowCase').getAllAsync((c) => ['Running', 'Waiting'].includes(c.status)),
  ]);
  const roles = customer?.roles ?? [];
  return {
    'my-approvals': items.filter((i) => roles.includes(i.approverRoleOfStep) || roles.includes('Administrators')).length,
    'open-exceptions': exceptions.length,
    alerts: alerts.length,
    'orders-by-stage': (await operationalOrderViewAsync()).groups.reduce((n, g) => n + g.count, 0),
    'online-customers': (await onlineCustomersAsync()).count,
    'workflow-cases': cases.length,
  };
}

/* ====================================================== saved views, drafts, shortcuts === */

export async function saveViewAsync({
  customer, screen, name, filters,
}) {
  const existing = await viewRepo().getOneAsync((v) => v.customerId === customer?.id && v.screen === screen && v.name === name);
  if (existing) return viewRepo().updateAsync({ ...existing, filters });
  return viewRepo().insertAsync({
    customerId: customer?.id, screen, name, filters,
  });
}

export const savedViewsAsync = (customer, screen = null) => viewRepo()
  .getAllAsync((v) => v.customerId === customer?.id && (screen ? v.screen === screen : true));

/** AC-ADM-007-05-01: a draft is kept per user and offered for restore in a later session. */
export async function saveDraftAsync({ customer, formKey, draft }) {
  const existing = await draftRepo().getOneAsync((d) => d.customerId === customer?.id && d.formKey === formKey);
  // the repository stamps its own updatedOnUtc on every write, so the draft keeps its own field
  const row = existing
    ? await draftRepo().updateAsync({ ...existing, draft, draftUpdatedOnUtc: new Date().toISOString() })
    : await draftRepo().insertAsync({
      customerId: customer?.id, formKey, draft, draftUpdatedOnUtc: new Date().toISOString(),
    });
  return row;
}

export async function draftAsync({ customer, formKey }) {
  const row = await draftRepo().getOneAsync((d) => d.customerId === customer?.id && d.formKey === formKey);
  if (!row) return { offered: false };
  const days = await getSettingAsync('adm.workdraftretentiondays', 1, 30);
  const age = (Date.now() - new Date(row.draftUpdatedOnUtc).getTime()) / (24 * 3600 * 1000);
  if (age > days) {
    await draftRepo().deleteAsync(row.id);
    return { offered: false, expiredAfterDays: days };
  }
  return { offered: true, draft: row.draft, updatedOnUtc: row.draftUpdatedOnUtc };
}

export async function discardDraftAsync({ customer, formKey }) {
  const row = await draftRepo().getOneAsync((d) => d.customerId === customer?.id && d.formKey === formKey);
  if (row) await draftRepo().deleteAsync(row.id);
  return { ok: true };
}

/** AC-ADM-007-06-01: the shortcut runs the action as if its button was pressed. */
export const SHORTCUTS = [
  { keys: 'g then q', action: 'open-queue', needs: 'Administration.Core.WorkQueues.View' },
  { keys: 'a', action: 'approve', needs: 'Administration.Core.Approvals.Act', confirm: false },
  { keys: 'r', action: 'reject', needs: 'Administration.Core.Approvals.Act', confirm: true },
  { keys: 'c', action: 'comment', needs: 'Administration.Core.Approvals.Act' },
  { keys: 'e', action: 'escalate', needs: 'Administration.Core.Exceptions.CreateEditDelete', confirm: true },
  { keys: '/', action: 'search', needs: 'Administration.Core.WorkQueues.View' },
];

export async function runShortcutAsync({ action, customer, payload = {} }) {
  const shortcut = SHORTCUTS.find((s) => s.action === action);
  if (!shortcut) return { ok: false, message: `unknown shortcut action ${action}` };
  if (!await authorizeAsync(shortcut.needs, customer)) {
    return {
      ok: false, denied: true, permission: shortcut.needs, message: `Access denied: ${shortcut.needs} is required.`,
    };
  }
  if (shortcut.confirm && payload.confirmed !== true) {
    return {
      ok: false, needsConfirmation: true, action, message: 'the shortcut asks for the same confirmation as the button',
    };
  }
  return {
    ok: true, action, ranAs: 'button', permissionChecked: shortcut.needs,
  };
}

/** AC-ADM-007-07-01: the native online-customer count. */
export async function onlineCustomersAsync() {
  const minutes = await getSettingAsync('customersettings.onlinecustomerminutes', 1, 20);
  const since = Date.now() - minutes * 60 * 1000;
  const customers = await repository('Customer').getAllAsync((c) => !c.deleted);
  const count = customers.filter((c) => c.lastActivityUtc && new Date(c.lastActivityUtc).getTime() >= since).length;
  return { count, minutes, source: 'CustomerSettings.OnlineCustomerMinutes (native)' };
}

/** BR-ADM-075 / AC-ADM-007-01-02: what RPT-009 reads. */
export async function workItemMetricsAsync() {
  const events = await workItemRepo().getAllAsync();
  const byQueue = {};
  for (const e of events) {
    const q = (byQueue[e.queueCode] ??= {
      queueCode: e.queueCode, assigned: 0, completed: 0, reopened: 0,
    });
    if (e.event === 'Assigned') q.assigned += 1;
    if (e.event === 'Completed') q.completed += 1;
    if (e.event === 'Reopened') q.reopened += 1;
  }
  return { events: events.slice().sort((a, b) => b.id - a.id), byQueue: Object.values(byQueue), readBy: 'PRD-RPT-009' };
}
