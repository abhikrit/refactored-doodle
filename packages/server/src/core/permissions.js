// Roles, permissions and scoped permissions - PRD-IAM-007 and PRD-IAM-008.
//
// L1 section 6.5: permission definitions come from StandardPermission string system names with
// the view/edit split introduced in 4.90 and unchanged in 5.00.1 (for example
// Catalog.ProductsView / Catalog.ProductsCreateEditDelete). Packs use 5.00.1 system names;
// 4.70 names such as ManageProducts are invalid and grant nothing.
//
// IAM-008 adds a scope to a grant (outlet, warehouse, seller, agency, company), which the
// native model has no field for - in the real build that is the IAM-008 custom plugin plus the
// one core modification listed in L1 section 6.3.

import { repository } from './repository.js';

const roleRepo = () => repository('CustomerRole');
const permissionRepo = () => repository('PermissionRecord');
const mappingRepo = () => repository('PermissionRecordCustomerRoleMapping');

export async function addRoleAsync(role) {
  return roleRepo().insertAsync({ active: true, isSystemRole: false, ...role });
}

export async function addPermissionAsync(permission) {
  return permissionRepo().insertAsync(permission);
}

export async function grantAsync(systemName, roleSystemName, scope = null) {
  const permission = await permissionRepo().getOneAsync((p) => p.systemName === systemName);
  const role = await roleRepo().getOneAsync((r) => r.systemName === roleSystemName);
  if (!permission) throw new Error(`unknown permission ${systemName} (5.00.1 system names only)`);
  if (!role) throw new Error(`unknown customer role ${roleSystemName}`);
  return mappingRepo().insertAsync({
    permissionRecordId: permission.id,
    customerRoleId: role.id,
    systemName,
    roleSystemName,
    scope,
  });
}

/** AuthorizeAsync: does any of the customer's roles carry the permission, in scope? */
export async function authorizeAsync(systemName, customer, scope = null) {
  if (!customer) return false;
  const roleNames = customer.roles ?? [];
  const mappings = await mappingRepo().getAllAsync((m) => m.systemName === systemName
    && roleNames.includes(m.roleSystemName));
  if (mappings.length === 0) return false;
  if (!scope) return true;
  return mappings.some((m) => !m.scope
    || Object.entries(scope).every(([k, v]) => m.scope[k] === undefined || String(m.scope[k]) === String(v)));
}

export async function rolesAsync() {
  return roleRepo().getAllAsync();
}

export async function permissionsAsync() {
  const rows = await permissionRepo().getAllAsync();
  return rows.slice().sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '')
    || a.systemName.localeCompare(b.systemName));
}

/** The ACL matrix the admin Access control list screen shows. */
export async function aclMatrixAsync() {
  const [roles, permissions, mappings] = await Promise.all([
    rolesAsync(), permissionsAsync(), mappingRepo().getAllAsync(),
  ]);
  return {
    roles: roles.map((r) => ({ id: r.id, name: r.name, systemName: r.systemName })),
    permissions: permissions.map((p) => ({
      systemName: p.systemName,
      name: p.name,
      category: p.category,
      feature: p.feature ?? null,
      granted: roles.filter((r) => mappings.some((m) => m.systemName === p.systemName
        && m.roleSystemName === r.systemName)).map((r) => r.systemName),
      scoped: mappings.filter((m) => m.systemName === p.systemName && m.scope)
        .map((m) => ({ role: m.roleSystemName, scope: m.scope })),
    })),
  };
}
