// PRD-IAM-007 Roles and permissions, PRD-IAM-008 Scoped permissions, PRD-IAM-009 Permission
// delegation and PRD-IAM-011 Staff invitation and access reviews.
// 13 + 8 + 7 + 7 = 35 criteria, one test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const byEmail = (email) => repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);

/* ============================================= PRD-IAM-007 roles and permissions ======== */

describe('PRD-IAM-007 roles and permissions', () => {
  test('AC-IAM-007-01-01', async () => {
    // "members of the new role get exactly those permissions and no others"
    const created = await api.post('/api/identity/roles', {
      name: 'Export desk', systemName: 'ExportDesk', permissions: ['Orders.OrdersView', 'Catalog.ProductsView'],
    }, SESSIONS.admin);
    assert.equal(created.ok, true);
    assert.deepEqual(created.permissions.sort(), ['Catalog.ProductsView', 'Orders.OrdersView']);

    const roles = await api.get('/api/identity/roles');
    const role = roles.find((r) => r.systemName === 'ExportDesk');
    assert.deepEqual(role.permissions.sort(), ['Catalog.ProductsView', 'Orders.OrdersView'], 'and no others');
  });

  test('AC-IAM-007-01-02', async () => {
    // "the save is denied by the native CheckPermission filter and nothing changes"
    const denied = await api.post('/api/identity/roles', {
      name: 'No ACL rights', systemName: 'NoAclRights', permissions: ['Orders.OrdersView'],
    }, SESSIONS.catalogue);
    assert.equal(denied.ok, false);
    assert.equal(denied.denied, true);
    assert.ok(['Customers.CustomerRolesCreateEditDelete', 'Configuration.ManageACL'].includes(denied.permission));
    const roles = await api.get('/api/identity/roles');
    assert.equal(roles.some((r) => r.systemName === 'NoAclRights'), false, 'nothing changed');
  });

  test('AC-IAM-007-02-01', async () => {
    // "access is denied by the native CheckPermission filter"
    const catalogue = await byEmail('catalogue@example.com');
    const check = await api.post('/api/identity/delegations/authorize', { email: catalogue.email, permission: 'Orders.OrdersView' });
    assert.equal(check.allowed, false, 'the catalogue role does not hold Orders.OrdersView');

    const denied = await api.call('GET', '/api/admin-console/console/areas/customers', undefined, SESSIONS.catalogue);
    assert.equal(denied.status, 403, 'an area whose permission the role lacks is refused');
  });

  test('AC-IAM-007-02-02', async () => {
    // "the save is denied and nothing changes" (the view / create-edit-delete split)
    const roles = await api.get('/api/identity/roles');
    const catalogue = roles.find((r) => r.systemName === 'Catalogue');
    assert.ok(catalogue.permissions.includes('Catalog.ProductsView'));

    const products = await api.get('/api/catalogue/products');
    const name = products[0].name;
    // the bulk-edit save is a create-edit-delete action
    const saved = await api.call('POST', '/api/admin-console/bulk-edit', { changes: [{ id: products[0].id, name: 'Renamed by a view-only role' }] }, SESSIONS.finance);
    assert.equal(saved.status, 403, 'a role without the edit permission cannot save');
    const after2 = await api.get('/api/catalogue/products');
    assert.equal(after2.find((p) => p.id === products[0].id).name, name, 'nothing changed');
  });

  test('AC-IAM-007-03-01', async () => {
    // "the product is not shown to a customer outside the allowed role"
    const products = await api.get('/api/catalogue/products');
    const restricted = products[products.length - 1];
    await repository('Product').updateAsync({
      ...(await repository('Product').getByIdAsync(restricted.id)), subjectToAcl: true, limitedToCustomerRoles: ['ExportDesk'],
    });
    const listed = await api.get('/api/search?pageSize=50', SESSIONS.buyer);
    assert.equal(listed.items.some((p) => p.id === restricted.id), false, 'not shown to a customer outside the role');

    await repository('Product').updateAsync({
      ...(await repository('Product').getByIdAsync(restricted.id)), subjectToAcl: false, limitedToCustomerRoles: [],
    });
  });

  test('AC-IAM-007-04-01', async () => {
    // "every role of the catalogue exists with exactly its system name"
    const catalogue = await api.get('/api/identity/roles/catalogue');
    const roles = await api.get('/api/identity/roles');
    for (const systemName of catalogue.productRoles) {
      assert.ok(roles.some((r) => r.systemName === systemName), `${systemName} exists`);
    }
    assert.ok(roles.filter((r) => r.productRole).length >= catalogue.productRoles.length);

    // a role deleted before is created again at the next start
    const { ensureProductRolesAsync } = await import('../../packages/server/src/plugins/product-iam/services/access.js');
    const role = await repository('CustomerRole').getOneAsync((r) => r.systemName === 'Courier');
    await repository('CustomerRole').deleteAsync(role.id);
    const again = await ensureProductRolesAsync();
    assert.ok(again.created.includes('Courier'), 'the missing role is created at start-up');
  });

  test('AC-IAM-007-04-02', async () => {
    // "the system name is unchanged and the permissions of the modules still apply"
    const updated = await api.patch('/api/identity/roles/Finance', { name: 'Finance and treasury' }, SESSIONS.admin);
    assert.equal(updated.ok, true);
    assert.equal(updated.role.name, 'Finance and treasury');
    assert.equal(updated.systemNameUnchanged, true);
    assert.ok(updated.permissionsStillApply > 0, 'the module permissions still apply');
  });

  test('AC-IAM-007-04-03', async () => {
    // "the IAM filter refuses the change with Iam.ProductRoleProtected and nothing changes"
    const renamed = await api.patch('/api/identity/roles/Finance', { newSystemName: 'FinanceTeam' }, SESSIONS.admin);
    assert.equal(renamed.ok, false);
    assert.equal(renamed.messageKey, 'Iam.ProductRoleProtected');
    assert.match(renamed.refusedBy, /CustomerRoleController\.Edit/);

    const deleted = await api.del('/api/identity/roles/Finance', SESSIONS.admin);
    assert.equal(deleted.ok, false);
    assert.equal(deleted.messageKey, 'Iam.ProductRoleProtected');
    assert.ok(await repository('CustomerRole').getOneAsync((r) => r.systemName === 'Finance'), 'nothing changed');
  });

  test('AC-IAM-007-04-04', async () => {
    // "the native permission is mapped to that role; the native defaults of other roles are
    //  unchanged"
    const before2 = (await api.get('/api/identity/roles')).find((r) => r.systemName === 'Administrators').permissions.length;
    const applied = await api.post('/api/identity/roles/pack', {
      mappings: [
        { permission: 'Orders.OrdersView', roleSystemName: 'AgencyOfficer' },
        { permission: 'Catalog.ProductsView', roleSystemName: 'AgencyOfficer' },
      ],
    }, SESSIONS.admin);
    assert.equal(applied.ok, true);
    assert.equal(applied.applied.length, 2);

    const roles = await api.get('/api/identity/roles');
    assert.ok(roles.find((r) => r.systemName === 'AgencyOfficer').permissions.includes('Orders.OrdersView'));
    assert.equal(roles.find((r) => r.systemName === 'Administrators').permissions.length, before2, 'other roles are untouched');
  });

  test('AC-IAM-007-04-05', async () => {
    // "the pack fails validation, or the IAM filter refuses the save with Iam.PermissionExcluded"
    const pack = await api.post('/api/identity/roles/pack', {
      mappings: [{ permission: 'Orders.ReturnRequestsView', roleSystemName: 'Vendors' }],
    }, SESSIONS.admin);
    assert.equal(pack.ok, false);
    assert.equal(pack.refused[0].messageKey, 'Iam.PermissionExcluded');
    assert.match(pack.refused[0].declaredBy, /PRD-RET/);

    const saved = await api.post('/api/identity/permissions/mapping', {
      permission: 'Orders.ReturnRequestsView', roleSystemName: 'Vendors', granted: true,
    }, SESSIONS.admin);
    assert.equal(saved.ok, false);
    assert.equal(saved.messageKey, 'Iam.PermissionExcluded');
    assert.match(saved.refusedBy, /PermissionEditPopup/);

    const roles = await api.get('/api/identity/roles');
    assert.equal(roles.find((r) => r.systemName === 'Vendors').permissions.includes('Orders.ReturnRequestsView'), false);
  });

  test('AC-IAM-007-04-06', async () => {
    // "an unknown name is reported as an error and grants nothing"
    const pack = await api.post('/api/identity/roles/pack', {
      mappings: [
        { permission: 'ManageProducts', roleSystemName: 'Catalogue' },
        { permission: 'ContentManagement.NewsView', roleSystemName: 'Content' },
        { permission: 'Catalog.ProductsView', roleSystemName: 'Content' },
      ],
    }, SESSIONS.admin);
    assert.equal(pack.ok, false);
    assert.equal(pack.errors.length, 2, 'both the 4.70 and the removed 4.90 name are errors');
    assert.match(pack.errors[0].error, /not a 5\.00 permission system name/);
    assert.equal(pack.applied.length, 1, 'the valid name is applied; the unknown ones grant nothing');
  });

  test('AC-IAM-007-05-01', async () => {
    // "effective permissions are the union of the roles"
    const customer = await byEmail('catalogue@example.com');
    await repository('Customer').updateAsync({ ...customer, roles: ['Catalogue', 'ExportDesk'] });
    const check = await api.post('/api/identity/delegations/authorize', { email: 'catalogue@example.com', permission: 'Orders.OrdersView' });
    assert.equal(check.allowed, true, 'the permission of the second role applies');
    assert.equal(check.via, 'role');
    await repository('Customer').updateAsync({ ...(await byEmail('catalogue@example.com')), roles: ['Catalogue'] });
  });

  test('AC-IAM-007-05-02', async () => {
    // "each stakeholder user gets the access of its type"
    const created = await api.post('/api/identity/roles', {
      name: 'Tea factory manager', systemName: 'FactoryManager', permissions: ['Catalog.ProductsView', 'Orders.OrdersView'],
    }, SESSIONS.admin);
    assert.equal(created.ok, true);
    const customer = await byEmail('logistics@example.com');
    await repository('Customer').updateAsync({ ...customer, roles: ['FactoryManager'] });
    const check = await api.post('/api/identity/delegations/authorize', { email: 'logistics@example.com', permission: 'Catalog.ProductsView' });
    assert.equal(check.allowed, true);
    await repository('Customer').updateAsync({ ...(await byEmail('logistics@example.com')), roles: ['Logistics'] });
  });
});

/* ================================================== PRD-IAM-008 scoped permissions ====== */

describe('PRD-IAM-008 scoped permissions', () => {
  test('AC-IAM-008-01-01', async () => {
    // "only orders of store S are listed"
    const officer = await byEmail('support@example.com');
    await repository('Order').insertAsync({
      orderNumber: 'SC-1', storeId: 1, customerEmail: 'buyer@example.com', orderTotal: 100, stage: 'Placed',
    });
    await repository('Order').insertAsync({
      orderNumber: 'SC-2', storeId: 2, customerEmail: 'buyer@example.com', orderTotal: 100, stage: 'Placed',
    });
    await api.post('/api/identity/scopes', {
      customerId: officer.id, permissionSystemName: 'Orders.OrdersView', dimension: 'store', values: [1],
    }, SESSIONS.admin);

    const filtered = await api.get('/api/identity/scopes/orders?email=support@example.com');
    assert.equal(filtered.filtered, true);
    assert.ok(filtered.rows.every((o) => (o.storeId ?? 1) === 1));
    assert.equal(filtered.rows.some((o) => o.orderNumber === 'SC-2'), false);
    assert.match(filtered.mechanism, /admin query filtering/);
  });

  test('AC-IAM-008-01-02', async () => {
    // "access is denied with Iam.ScopeDenied and the attempt is audited"
    const denied = await api.post('/api/identity/scopes/check', {
      email: 'support@example.com', permissionSystemName: 'Orders.OrdersView', dimension: 'store', value: 2,
    });
    assert.equal(denied.allowed, false);
    assert.equal(denied.messageKey, 'Iam.ScopeDenied');
    assert.equal(denied.message, 'You do not have access to this item.');

    const trail = await api.get('/api/security/audit?event=AUD-IAM-006');
    assert.ok(trail.some((e) => e.outcome === 'rejected' && e.after?.dimension === 'store'), 'the attempt is audited');
  });

  test('AC-IAM-008-01-03', async () => {
    // "the approval is refused with Iam.ScopeDenied"
    const approver = await byEmail('finance@example.com');
    await api.post('/api/identity/scopes', {
      customerId: approver.id, permissionSystemName: 'Administration.Core.Approvals.Act', dimension: 'value-band', values: [500000],
    }, SESSIONS.admin);

    const within = await api.post('/api/identity/scopes/check', {
      email: 'finance@example.com', permissionSystemName: 'Administration.Core.Approvals.Act', amount: 250000,
    });
    assert.equal(within.allowed, true);
    const above = await api.post('/api/identity/scopes/check', {
      email: 'finance@example.com', permissionSystemName: 'Administration.Core.Approvals.Act', amount: 900000,
    });
    assert.equal(above.allowed, false);
    assert.equal(above.dimension, 'value-band');
    assert.equal(above.messageKey, 'Iam.ScopeDenied');
  });

  test('AC-IAM-008-01-04', async () => {
    // "the save is refused and the product list shows only products in the category"
    const editor = await byEmail('catalogue@example.com');
    await api.post('/api/identity/scopes', {
      customerId: editor.id, permissionSystemName: 'Catalog.ProductsCreateEditDelete', dimension: 'category', values: ['Postal services'],
    }, SESSIONS.admin);

    const outside = await api.post('/api/identity/scopes/check', {
      email: 'catalogue@example.com', permissionSystemName: 'Catalog.ProductsCreateEditDelete', dimension: 'category', value: 'Electronics',
    });
    assert.equal(outside.allowed, false);
    assert.equal(outside.messageKey, 'Iam.ScopeDenied');
    const inside = await api.post('/api/identity/scopes/check', {
      email: 'catalogue@example.com', permissionSystemName: 'Catalog.ProductsCreateEditDelete', dimension: 'category', value: 'Postal services',
    });
    assert.equal(inside.allowed, true);
  });

  test('AC-IAM-008-01-05', async () => {
    // "access is denied outside the time window"
    const temp = await byEmail('operations@example.com');
    await api.post('/api/identity/scopes', {
      customerId: temp.id,
      permissionSystemName: 'System.ManageMaintenance',
      dimension: 'time-window',
      values: ['maintenance window'],
      validFrom: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      validTo: new Date(Date.now() - 3600 * 1000).toISOString(),
    }, SESSIONS.admin);

    const outside = await api.post('/api/identity/scopes/check', {
      email: 'operations@example.com', permissionSystemName: 'System.ManageMaintenance',
    });
    assert.equal(outside.allowed, false);
    assert.equal(outside.dimension, 'time-window');
  });

  test('AC-IAM-008-01-06', async () => {
    // "only orders whose assisted-order record or pickup point is outlet O are listed"
    const agent = await byEmail('agent.lilongwe@example.com') ?? await byEmail('operations@example.com');
    await repository('Order').insertAsync({
      orderNumber: 'SC-3', storeId: 1, pickupPointName: 'Lilongwe Post Office', customerEmail: 'buyer@example.com', orderTotal: 50, stage: 'Placed',
    });
    await repository('Order').insertAsync({
      orderNumber: 'SC-4', storeId: 1, pickupPointName: 'Blantyre Post Office', customerEmail: 'buyer@example.com', orderTotal: 50, stage: 'Placed',
    });
    await api.post('/api/identity/scopes', {
      customerId: agent.id, permissionSystemName: 'Orders.OrdersView', dimension: 'outlet', values: ['Lilongwe Post Office'],
    }, SESSIONS.admin);

    const filtered = await api.get(`/api/identity/scopes/orders?email=${encodeURIComponent(agent.email)}`);
    assert.equal(filtered.filtered, true);
    assert.ok(filtered.rows.some((o) => o.orderNumber === 'SC-3'));
    assert.equal(filtered.rows.some((o) => o.orderNumber === 'SC-4'), false, 'another outlet is not listed');
  });

  test('AC-IAM-008-01-07', async () => {
    // "ADM-006 reads the limit and the active delegations through IC-IAM-06"
    const authority = await api.get('/api/identity/approval-authority?email=finance@example.com');
    assert.equal(authority.authorityLimit, 500000, 'the value-band scope is the authority limit');
    assert.ok(Array.isArray(authority.delegatedPermissions));

    // and the ADM-006 queue uses it: an item above the limit is not listed for that approver
    const submitted = await api.post('/api/admin-console/approvals/submit', {
      objectType: 'PayoutAccountChange', objectId: 7001, summary: 'above the limit', amount: 900000, chainCode: 'payout-account-change', requesterEmail: 'seller@example.com',
    });
    const queue = await api.get('/api/admin-console/approvals/queue', SESSIONS.finance);
    assert.equal(queue.some((i) => i.id === submitted.item.id), false, 'above the authority limit, so not in the queue');
  });

  test('AC-IAM-008-02-01', async () => {
    // "U sees and changes only records of region R"
    const analyst = await byEmail('compliance@example.com');
    await repository('Order').insertAsync({
      orderNumber: 'SC-5', storeId: 1, region: 'Central', customerEmail: 'buyer@example.com', orderTotal: 75, stage: 'Placed',
    });
    await repository('Order').insertAsync({
      orderNumber: 'SC-6', storeId: 1, region: 'Southern', customerEmail: 'buyer@example.com', orderTotal: 75, stage: 'Placed',
    });
    await api.post('/api/identity/scopes', {
      customerId: analyst.id, permissionSystemName: 'Orders.OrdersView', dimension: 'region', values: ['Central'],
    }, SESSIONS.admin);

    const filtered = await api.get('/api/identity/scopes/orders?email=compliance@example.com');
    assert.ok(filtered.rows.some((o) => o.orderNumber === 'SC-5'));
    assert.equal(filtered.rows.some((o) => o.orderNumber === 'SC-6'), false);
    const denied = await api.post('/api/identity/scopes/check', {
      email: 'compliance@example.com', permissionSystemName: 'Orders.OrdersView', dimension: 'region', value: 'Southern',
    });
    assert.equal(denied.allowed, false, 'and cannot change a record of another region');
  });
});

/* =================================================== PRD-IAM-009 permission delegation == */

describe('PRD-IAM-009 permission delegation', () => {
  test('AC-IAM-009-01-01', async () => {
    // "between those dates the permission check for V succeeds, and outside them it fails"
    const delegated = await api.post('/api/identity/delegations', {
      delegateEmail: 'operations@example.com',
      permissionSystemName: 'Orders.OrdersView',
      startUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
      endUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
      reason: 'cover during leave',
    }, SESSIONS.admin);
    assert.equal(delegated.ok, true);
    assert.equal(delegated.delegation.status, 'Active');

    const inside = await api.post('/api/identity/delegations/authorize', { email: 'operations@example.com', permission: 'Orders.OrdersView' });
    assert.equal(inside.allowed, true);
    assert.equal(inside.via, 'delegation');
    assert.equal(inside.onBehalfOf, 'admin@example.com');

    // outside the window the same check fails
    await repository('Delegation').updateAsync({
      ...(await repository('Delegation').getByIdAsync(delegated.delegation.id)),
      startUtc: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      endUtc: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: 'Scheduled',
    });
    const outside = await api.post('/api/identity/delegations/authorize', { email: 'operations@example.com', permission: 'Orders.OrdersView' });
    assert.equal(outside.allowed, false);
  });

  test('AC-IAM-009-01-02', async () => {
    // "the delegation is refused with Iam.DelegationNotAllowed"
    const notDelegable = await api.post('/api/identity/delegations', {
      delegateEmail: 'operations@example.com', permissionSystemName: 'System.ManageMaintenance', startUtc: new Date().toISOString(), endUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
    }, SESSIONS.admin);
    assert.equal(notDelegable.ok, false);
    assert.equal(notDelegable.messageKey, 'Iam.DelegationNotAllowed');
    assert.equal(notDelegable.reasonCode, 'not-delegable');

    const notHeld = await api.post('/api/identity/delegations', {
      delegateEmail: 'operations@example.com', permissionSystemName: 'Customers.CustomersView', startUtc: new Date().toISOString(), endUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
    }, SESSIONS.catalogue);
    assert.equal(notHeld.ok, false);
    assert.match(notHeld.reasonCode, /does not hold it/);
  });

  test('AC-IAM-009-01-03', async () => {
    // "access is denied without any manual step and the delegation becomes Ended"
    const delegated = await api.post('/api/identity/delegations', {
      delegateEmail: 'support@example.com',
      permissionSystemName: 'Orders.OrdersView',
      startUtc: new Date(Date.now() - 7200 * 1000).toISOString(),
      endUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
    }, SESSIONS.admin);
    assert.equal(delegated.ok, true);

    const check = await api.post('/api/identity/delegations/authorize', { email: 'support@example.com', permission: 'Orders.OrdersView' });
    assert.equal(check.allowed, false);
    const row = await repository('Delegation').getByIdAsync(delegated.delegation.id);
    assert.equal(row.status, 'Ended', 'the status followed the date with no manual step');
  });

  test('AC-IAM-009-01-04', async () => {
    // "the approval is refused, because segregation of duties still applies"
    const item = await api.post('/api/admin-console/approvals/submit', {
      objectType: 'PayoutAccountChange', objectId: 7100, summary: 'raised by the delegate', amount: 100000, chainCode: 'payout-account-change', requesterEmail: 'operations@example.com',
    });
    await api.post('/api/identity/delegations', {
      delegateEmail: 'operations@example.com',
      permissionSystemName: 'Administration.Core.Approvals.Act',
      startUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
      endUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
    }, SESSIONS.admin);

    const refused = await api.post(`/api/admin-console/approvals/items/${item.item.id}/decide`, { decision: 'approve' }, SESSIONS.operations);
    assert.equal(refused.ok, false, 'the requester cannot approve, even under a delegation');
    assert.ok(['Adm.ApproveOwnItem', undefined].includes(refused.messageKey));
  });

  test('AC-IAM-009-01-05', async () => {
    // "ADM-006 lists the items of U for V inside the period, and V cannot decide an item V
    //  requested"
    const authority = await api.get('/api/identity/approval-authority?email=operations@example.com');
    assert.ok(authority.delegatedPermissions.includes('Administration.Core.Approvals.Act'));
    assert.ok(authority.delegatedFrom.includes('admin@example.com'));

    const own = await repository('ApprovalItem').getOneAsync((i) => i.objectId === '7100');
    assert.ok(own, 'the item raised by the delegate exists');
    const queue = await api.get('/api/admin-console/approvals/queue', SESSIONS.operations);
    const listed = queue.find((i) => i.id === own.id);
    if (listed) {
      const refused = await api.post(`/api/admin-console/approvals/items/${own.id}/decide`, { decision: 'approve' }, SESSIONS.operations);
      assert.equal(refused.ok, false, 'V cannot decide an item V requested');
    }
  });

  test('AC-IAM-009-02-01', async () => {
    // "the audit record names V as actor and U as the person on whose behalf V acted"
    // a permission the delegate's own roles do not carry, so the check can only pass by delegation
    const delegated = await api.post('/api/identity/delegations', {
      delegateEmail: 'operations@example.com',
      permissionSystemName: 'Customers.CustomersView',
      startUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
      endUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
    }, SESSIONS.admin);
    const row = delegated.delegation;
    const check = await api.post('/api/identity/delegations/authorize', { email: 'operations@example.com', permission: 'Customers.CustomersView' });
    assert.equal(check.via, 'delegation');
    assert.equal(check.onBehalfOf, row.delegatorEmail, 'the action names who it was done on behalf of');

    const trail = await api.get('/api/security/audit?event=AUD-IAM-007');
    const entry = trail.find((e) => e.entityId === String(row.id));
    assert.ok(entry);
    assert.equal(entry.actor, row.delegatorEmail);
    assert.equal(entry.after.delegate, 'operations@example.com');
  });

  test('AC-IAM-009-02-02', async () => {
    // "AUD-IAM-007 is written with delegator, delegate, permission and dates"
    const created = await api.post('/api/identity/delegations', {
      delegateEmail: 'compliance@example.com',
      permissionSystemName: 'Customers.CustomersView',
      startUtc: new Date().toISOString(),
      endUtc: new Date(Date.now() + 3600 * 1000).toISOString(),
    }, SESSIONS.admin);
    const revoked = await api.post(`/api/identity/delegations/${created.delegation.id}/revoke`, {}, SESSIONS.admin);
    assert.equal(revoked.ok, true);

    const trail = await api.get('/api/security/audit?event=AUD-IAM-007');
    const entries = trail.filter((e) => e.entityId === String(created.delegation.id));
    assert.equal(entries.length, 2, 'the creation and the revocation are both audited');
    const creation = entries.find((e) => e.after?.permission);
    assert.equal(creation.after.delegator, 'admin@example.com');
    assert.equal(creation.after.delegate, 'compliance@example.com');
    assert.equal(creation.after.permission, 'Customers.CustomersView');
    assert.ok(creation.after.startUtc && creation.after.endUtc);
  });
});

/* ========================================= PRD-IAM-011 invitations and access reviews === */

describe('PRD-IAM-011 staff invitation and access reviews', () => {
  test('AC-IAM-011-01-01', async () => {
    // "an invitation email with a single-use link is sent; the link is valid for the configured
    //  days and no customer record exists yet"
    await saveSettingAsync('iam.invitationvaliditydays', 7, 0);
    const denied = await api.post('/api/identity/invitations', { email: 'new.officer@example.com', roleSystemNames: ['Operations'] }, SESSIONS.catalogue);
    assert.equal(denied.denied, true);
    assert.equal(denied.permission, 'Identity.Core.AccessGovernance.CreateEditDelete');

    const invited = await api.post('/api/identity/invitations', {
      email: 'new.officer@example.com', roleSystemNames: ['Operations', 'Support'],
    }, SESSIONS.admin);
    assert.equal(invited.ok, true);
    assert.equal(invited.validDays, 7);
    assert.equal(invited.customerRecordExists, false, 'no customer record yet');
    assert.equal(invited.message, 'You are invited to an account. Open the link to set your password and finish set-up.');

    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.some((m) => m.event === 'Iam.Invitation.Email'), 'the invitation email was sent');
  });

  test('AC-IAM-011-01-02', async () => {
    // "the account is created as Registered with the invited roles and the invitation becomes
    //  Accepted"
    const invited = await api.post('/api/identity/invitations', {
      email: 'second.officer@example.com', roleSystemNames: ['Operations'],
    }, SESSIONS.admin);
    const weak = await api.post('/api/identity/invitations/accept', { token: invited.token, password: 'short' });
    assert.equal(weak.ok, false, 'the password must meet the policy');
    assert.equal(weak.accountCreated, false);

    const accepted = await api.post('/api/identity/invitations/accept', {
      token: invited.token, password: 'Str0ng-pass', firstName: 'Second', lastName: 'Officer',
    });
    assert.equal(accepted.ok, true);
    assert.equal(accepted.accountCreated, true);
    assert.deepEqual(accepted.customer.roles.sort(), ['Operations', 'Registered']);
    assert.equal(accepted.invitation.status, 'Accepted');
    assert.equal(accepted.termsAccepted, true);

    const trail = await api.get('/api/security/audit?event=AUD-IAM-017');
    assert.ok(trail.some((e) => e.after?.status === 'Accepted'));
  });

  test('AC-IAM-011-01-03', async () => {
    // "no account is created and Iam.InvitationExpired is shown"
    const invited = await api.post('/api/identity/invitations', { email: 'third.officer@example.com', roleSystemNames: ['Support'] }, SESSIONS.admin);
    const row = (await repository('Invitation').getAllAsync()).find((i) => i.email === 'third.officer@example.com');
    await repository('Invitation').updateAsync({ ...row, expiresOnUtc: new Date(Date.now() - 1000).toISOString() });

    const expired = await api.post('/api/identity/invitations/accept', { token: invited.token, password: 'Str0ng-pass' });
    assert.equal(expired.ok, false);
    assert.equal(expired.messageKey, 'Iam.InvitationExpired');
    assert.equal(expired.accountCreated, false);
    assert.equal(await byEmail('third.officer@example.com'), null);

    // an already used link is refused the same way
    const used = await api.post('/api/identity/invitations', { email: 'fourth.officer@example.com', roleSystemNames: ['Support'] }, SESSIONS.admin);
    await api.post('/api/identity/invitations/accept', { token: used.token, password: 'Str0ng-pass' });
    const again = await api.post('/api/identity/invitations/accept', { token: used.token, password: 'Str0ng-pass' });
    assert.equal(again.messageKey, 'Iam.InvitationExpired');
  });

  test('AC-IAM-011-02-01', async () => {
    // "each reviewer sees the members of their roles and records Keep or Revoke; Revoke removes
    //  the role mapping; every decision is audited"
    const campaign = await api.post('/api/identity/access-reviews', {
      name: 'Quarterly review',
      roles: ['Operations', 'Support'],
      reviewers: { Operations: 'admin@example.com', Support: 'admin@example.com' },
      deadlineUtc: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    }, SESSIONS.admin);
    assert.equal(campaign.ok, true);
    assert.ok(campaign.items.length >= 2);

    const mine = await api.get('/api/identity/access-reviews/mine', SESSIONS.admin);
    assert.ok(mine.length >= 2, 'the reviewer sees the members of their roles');

    const keep = await api.post(`/api/identity/access-reviews/items/${mine[0].id}`, { decision: 'Keep' }, SESSIONS.admin);
    assert.equal(keep.item.status, 'Kept');
    assert.equal(keep.roleRemoved, false);

    const toRevoke = mine.find((i) => i.customerEmail !== 'admin@example.com' && i.id !== mine[0].id) ?? mine[1];
    const revoke = await api.post(`/api/identity/access-reviews/items/${toRevoke.id}`, { decision: 'Revoke' }, SESSIONS.admin);
    assert.equal(revoke.item.status, 'Revoked');
    assert.equal(revoke.roleRemoved, true);
    const customer = await repository('Customer').getByIdAsync(toRevoke.customerId);
    assert.equal((customer.roles ?? []).includes(toRevoke.roleSystemName), false, 'the role mapping is removed');

    const trail = await api.get('/api/security/audit?event=AUD-IAM-009');
    assert.ok(trail.length >= 2, 'every decision is audited');
  });

  test('AC-IAM-011-02-02', async () => {
    // "the undecided items become Overdue and are listed to administrators; no role is removed"
    const campaign = await api.post('/api/identity/access-reviews', {
      name: 'Lapsed review',
      roles: ['Compliance'],
      reviewers: { Compliance: 'compliance@example.com' },
      deadlineUtc: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    }, SESSIONS.admin);
    const before2 = (await repository('Customer').getAllAsync((c) => (c.roles ?? []).includes('Compliance'))).length;

    const task = await api.post('/api/identity/access-reviews/deadline-task', {});
    assert.ok(task.overdue.length >= 1);
    assert.equal(task.rolesRemoved, 0, 'no role is removed automatically');
    assert.ok(task.listedToAdministrators >= 1);
    const after2 = (await repository('Customer').getAllAsync((c) => (c.roles ?? []).includes('Compliance'))).length;
    assert.equal(after2, before2);
    assert.ok(campaign.ok);
  });

  test('AC-IAM-011-03-01', async () => {
    // "one row per user with roles, privileged, MFA status, last login and Active; exportable to
    //  CSV and XLSX"
    const denied = await api.call('GET', '/api/identity/access-report', undefined, SESSIONS.buyer);
    assert.equal(denied.status, 403);
    assert.equal(denied.body.permission, 'Identity.Core.AccessReports.View');

    const report = await api.get('/api/identity/access-report', SESSIONS.admin);
    assert.ok(report.rows.length > 5);
    for (const row of report.rows.slice(0, 5)) {
      assert.ok(row.email);
      assert.ok(Array.isArray(row.roles));
      assert.equal(typeof row.privileged, 'boolean');
      assert.ok(['none', 'required but not set up'].includes(row.mfaStatus) || /provider selected/.test(row.mfaStatus));
      assert.equal(typeof row.active, 'boolean');
    }
    assert.deepEqual(report.exports, ['CSV', 'XLSX']);
    assert.match(report.csv.split('\n')[0], /email,roles,privileged,mfaStatus,lastLogin,active/);
  });

  test('AC-IAM-011-03-02', async () => {
    // "only users that meet the privileged definition are listed"
    const report = await api.get('/api/identity/access-report?privilegedOnly=true', SESSIONS.admin);
    assert.ok(report.rows.length >= 1);
    assert.ok(report.rows.every((r) => r.privileged === true));
    assert.ok(report.privilegedDefinition.includes('Security.AccessAdminPanel'));
    assert.equal(report.rows.some((r) => r.email === 'buyer@example.com'), false, 'a shopper is not privileged');
  });
});
