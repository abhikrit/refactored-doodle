// PRD-ADM-001 Administration console.
//
// US-ADM-001-01  one back office: settings, add-ons, page widgets, scheduled jobs, system logs,
//                maintenance, products and customers, each gated by its native permission
// US-ADM-001-02  bulk edit and archive of products
// US-ADM-001-03  suspend / reactivate a customer, and process a deletion request
//
// Implementation route: Configuration — the native admin areas. What this file adds is the
// permission gate, the bulk-edit save and the customer actions, which the acceptance criteria
// name explicitly. Every write goes through the SEC-004 audit trail (AUD-ADM-001).

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { publishAsync } from '../../../core/events.js';

/**
 * AC-ADM-001-01-01: the areas of the console and the native permission each one needs.
 * An area whose permission the user lacks is denied, the way the CheckPermission attribute does.
 */
export const CONSOLE_AREAS = [
  {
    id: 'configuration-settings', group: 'Configuration', name: 'Settings', permission: 'Configuration.ManageSettings', route: '/admin/configuration/settings',
  },
  {
    id: 'configuration-plugins', group: 'Configuration', name: 'Plugins', permission: 'Configuration.ManagePlugins', route: '/admin/plugins',
  },
  {
    id: 'configuration-widgets', group: 'Configuration', name: 'Widgets', permission: 'Configuration.ManageWidgets', route: '/admin/configuration/widgets',
  },
  {
    id: 'system-schedule-tasks', group: 'System', name: 'Schedule tasks', permission: 'System.ManageScheduleTasks', route: '/admin/system/schedule-tasks',
  },
  {
    id: 'system-log', group: 'System', name: 'Log', permission: 'System.ManageSystemLog', route: '/admin/system/log',
  },
  {
    id: 'system-maintenance', group: 'System', name: 'Maintenance', permission: 'System.ManageMaintenance', route: '/admin/system/maintenance',
  },
  {
    id: 'catalog-products', group: 'Catalog', name: 'Products', permission: 'Catalog.ProductsView', route: '/admin/catalog/products',
  },
  {
    id: 'customers', group: 'Customers', name: 'Customers', permission: 'Customers.CustomersView', route: '/admin/customers',
  },
];

/** Security.AccessAdminPanel first, then the area's own permission. */
export async function consoleAreasForAsync(customer) {
  const canOpenAdmin = await authorizeAsync('Security.AccessAdminPanel', customer);
  const areas = [];
  for (const a of CONSOLE_AREAS) {
    const granted = canOpenAdmin && await authorizeAsync(a.permission, customer);
    areas.push({ ...a, granted, deniedBy: granted ? null : (canOpenAdmin ? a.permission : 'Security.AccessAdminPanel') });
  }
  return { canOpenAdmin, areas };
}

export async function checkAreaAsync(areaId, customer) {
  const area = CONSOLE_AREAS.find((a) => a.id === areaId);
  if (!area) return { ok: false, message: 'unknown console area' };
  if (!await authorizeAsync('Security.AccessAdminPanel', customer)) {
    return { ok: false, permission: 'Security.AccessAdminPanel', message: 'Access denied: Security.AccessAdminPanel is required to open the admin area.' };
  }
  if (!await authorizeAsync(area.permission, customer)) {
    return { ok: false, permission: area.permission, message: `Access denied: ${area.permission} is required for ${area.group} > ${area.name}.` };
  }
  return { ok: true, area };
}

/* ------------------------------------------------- scheduled tasks (01-02) -- */

const taskRepo = () => repository('ScheduleTask');

export async function scheduleTasksAsync() {
  const rows = await taskRepo().getAllAsync();
  return rows.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * AC-ADM-001-01-02: editing Seconds, Enabled or StopOnError applies to the whole installation -
 * ScheduleTask has no store scope (L1 section 6.5).
 */
export async function updateScheduleTaskAsync({
  id, seconds, enabled, stopOnError, actor = 'admin',
}) {
  const task = await taskRepo().getByIdAsync(id);
  if (!task) throw new Error('schedule task not found');
  const before = { seconds: task.seconds, enabled: task.enabled, stopOnError: task.stopOnError };
  const updated = await taskRepo().updateAsync({
    ...task,
    seconds: seconds ?? task.seconds,
    enabled: enabled ?? task.enabled,
    stopOnError: stopOnError ?? task.stopOnError,
  });
  await auditAsync({
    event: 'AUD-ADM-001',
    area: 'ADM',
    feature: 'PRD-ADM-001',
    entity: 'ScheduleTask',
    entityId: task.id,
    actor,
    actorRole: 'Administrators',
    before,
    after: { seconds: updated.seconds, enabled: updated.enabled, stopOnError: updated.stopOnError },
    note: 'schedule task edited; ScheduleTask has no store scope, so the change applies to the whole installation',
  });
  return updated;
}

/** Run now. LastStartUtc, LastEndUtc and LastSuccessUtc show the result. */
export async function runScheduleTaskAsync({ id, actor = 'admin', fail = false }) {
  const task = await taskRepo().getByIdAsync(id);
  if (!task) throw new Error('schedule task not found');
  const lastStartUtc = new Date().toISOString();
  const succeeded = !fail;
  const updated = await taskRepo().updateAsync({
    ...task,
    lastStartUtc,
    lastEndUtc: new Date().toISOString(),
    lastSuccessUtc: succeeded ? new Date().toISOString() : task.lastSuccessUtc,
    lastError: succeeded ? null : 'the task reported an error (prototype)',
    enabled: !succeeded && task.stopOnError ? false : task.enabled,
  });
  await auditAsync({
    event: 'AUD-ADM-001',
    area: 'ADM',
    feature: 'PRD-ADM-001',
    entity: 'ScheduleTask',
    entityId: task.id,
    actor,
    actorRole: 'Administrators',
    after: { ranAt: lastStartUtc, succeeded },
    outcome: succeeded ? 'success' : 'rejected',
    note: succeeded ? 'run now' : 'run now failed; StopOnError disabled the task',
  });
  return updated;
}

/* ------------------------------------------------------------ log, widgets -- */

export async function logAsync({ level = '' } = {}) {
  const rows = await repository('Log').getAllAsync((r) => !level || r.logLevel === level);
  return rows.slice().sort((a, b) => b.createdOnUtc.localeCompare(a.createdOnUtc));
}

export async function clearLogAsync({ actor = 'admin' }) {
  const before = (await repository('Log').getAllAsync()).length;
  await repository('Log').truncateAsync();
  await auditAsync({
    event: 'AUD-ADM-001',
    area: 'ADM',
    feature: 'PRD-ADM-001',
    entity: 'Log',
    actor,
    actorRole: 'Administrators',
    before: { entries: before },
    after: { entries: 0 },
    note: 'system log cleared from System > Maintenance',
  });
  return { cleared: before };
}

export async function widgetsAsync() {
  const rows = await repository('Widget').getAllAsync();
  return rows.slice().sort((a, b) => (a.displayOrder - b.displayOrder) || a.systemName.localeCompare(b.systemName));
}

export async function setWidgetActiveAsync({ id, isActive, actor = 'admin' }) {
  const widget = await repository('Widget').getByIdAsync(id);
  if (!widget) throw new Error('widget not found');
  const updated = await repository('Widget').updateAsync({ ...widget, isActive });
  await auditAsync({
    event: 'AUD-ADM-001',
    area: 'ADM',
    feature: 'PRD-ADM-001',
    entity: 'Widget',
    entityId: widget.id,
    actor,
    actorRole: 'Administrators',
    before: { isActive: widget.isActive },
    after: { isActive },
    note: 'widgetsettings.activewidgetsystemnames changed',
  });
  return updated;
}

/* ----------------------------------------------------- bulk edit (02-01/02) -- */

const BULK_FIELDS = ['name', 'sku', 'price', 'oldPrice', 'stockQuantity', 'published'];

/**
 * AC-ADM-001-02-01: every selected product is updated in one save, the way the native
 * ProductController.BulkEditSave does it. Only the six fields the criterion names are editable.
 */
export async function bulkEditSaveAsync({ changes, actor = 'admin' }) {
  const productRepo = repository('Product');
  const saved = [];
  const rejected = [];
  for (const change of changes ?? []) {
    const product = await productRepo.getByIdAsync(change.id);
    if (!product || product.deleted) {
      rejected.push({ id: change.id, message: 'product not found' });
      continue;
    }
    const before = {};
    const after = {};
    for (const field of BULK_FIELDS) {
      if (change[field] === undefined) continue;
      before[field] = product[field];
      after[field] = change[field];
    }
    if (Object.keys(after).length === 0) continue;
    saved.push(await productRepo.updateAsync({ ...product, ...after }));
    await auditAsync({
      event: 'AUD-ADM-001',
      area: 'ADM',
      feature: 'PRD-ADM-001',
      entity: 'Product',
      entityId: product.id,
      actor,
      actorRole: 'Administrators',
      before,
      after,
      note: 'bulk edit save',
    });
  }
  return { saved: saved.length, rejected, products: saved };
}

/**
 * AC-ADM-001-02-02: archive unpublishes (there is no separate archive status in 5.00.1), so the
 * products leave the storefront and stay in admin. Delete is a separate soft delete.
 */
export async function bulkArchiveAsync({ ids, actor = 'admin' }) {
  const productRepo = repository('Product');
  const archived = [];
  for (const id of ids ?? []) {
    const product = await productRepo.getByIdAsync(id);
    if (!product) continue;
    archived.push(await productRepo.updateAsync({ ...product, published: false, archivedOnUtc: new Date().toISOString() }));
    await auditAsync({
      event: 'AUD-ADM-001',
      area: 'ADM',
      feature: 'PRD-ADM-001',
      entity: 'Product',
      entityId: id,
      actor,
      actorRole: 'Administrators',
      before: { published: product.published },
      after: { published: false },
      note: 'archived: unpublished and removed from the storefront, kept in admin (there is no separate archive status in 5.00.1)',
    });
  }
  return { archived: archived.length };
}

export async function bulkDeleteAsync({ ids, actor = 'admin' }) {
  const productRepo = repository('Product');
  let deleted = 0;
  for (const id of ids ?? []) {
    const product = await productRepo.getByIdAsync(id);
    if (!product) continue;
    await productRepo.updateAsync({ ...product, deleted: true, published: false });
    deleted += 1;
    await auditAsync({
      event: 'AUD-ADM-001',
      area: 'ADM',
      feature: 'PRD-ADM-001',
      entity: 'Product',
      entityId: id,
      actor,
      actorRole: 'Administrators',
      before: { deleted: false },
      after: { deleted: true },
      note: 'soft delete (Product.Deleted), separate from archive',
    });
  }
  return { deleted };
}

/* ------------------------------------------------- customer actions (03) ---- */

/**
 * AC-ADM-001-03-01: deactivating sets Customer.Active false with a reason; the customer can no
 * longer sign in and the reason is recorded. Reactivation restores sign-in.
 */
export async function setCustomerActiveAsync({
  email, active, reason, actor = 'admin',
}) {
  const customerRepo = repository('Customer');
  const customer = await customerRepo.getOneAsync((c) => c.email === email);
  if (!customer) throw new Error('customer not found');
  if (!active && !reason) {
    return { ok: false, message: 'Choose a reason.' }; // Adm.ReasonRequired
  }
  const updated = await customerRepo.updateAsync({
    ...customer,
    active,
    deactivationReason: active ? null : reason,
    deactivatedOnUtc: active ? null : new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-ADM-001',
    area: 'ADM',
    feature: 'PRD-ADM-001',
    entity: 'Customer',
    entityId: customer.id,
    actor,
    actorRole: 'Administrators',
    before: { active: customer.active },
    after: { active, reason: active ? null : reason },
    note: active ? 'customer reactivated; sign-in restored' : `customer deactivated: ${reason}`,
  });
  await publishAsync('CustomerActiveChangedEvent', { customer: updated });
  return { ok: true, customer: { ...updated, password: undefined } };
}

/** AC-ADM-001-03-02: the native GDPR delete, behind Customers.GDPRManage. */
export async function gdprDeleteAsync({ email, actor = 'admin', requestedBy = 'customer' }) {
  const customerRepo = repository('Customer');
  const customer = await customerRepo.getOneAsync((c) => c.email === email);
  if (!customer) throw new Error('customer not found');
  const updated = await customerRepo.updateAsync({
    ...customer,
    deleted: true,
    active: false,
    email: `deleted-${customer.id}@removed.invalid`,
    firstName: 'Deleted',
    lastName: 'Customer',
    phone: null,
    addresses: [],
    gdprDeletedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-ADM-001',
    area: 'ADM',
    feature: 'PRD-ADM-001',
    entity: 'Customer',
    entityId: customer.id,
    actor,
    actorRole: 'Administrators',
    before: { email: customer.email, active: customer.active },
    after: { deleted: true },
    note: `GDPR delete processed (requested by ${requestedBy}); consent and privacy rules are SEC-007's`,
  });
  return { ok: true, customerId: updated.id };
}
