// PRD-SEC-010 Auditor read-only access. SM-SEC-03: Pending, Active, Expired, Revoked.
//
// BR-IAM-060: the IAM IPermissionService override is where an expired grant is refused, so the
// refusal happens at once on the next request rather than at the next sign-in. The Auditor role
// holds Security.AccessAdminPanel, the native *View permissions and Security.Core.AuditTrail.View
// and nothing that writes.

import { repository } from '../../../core/repository.js';
import { auditAsync, queryAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync, permissionsAsync } from '../../../core/permissions.js';
import { noticeAsync } from './notices.js';

const grantRepo = () => repository('AuditorGrant');

export const STATES = ['Pending', 'Active', 'Expired', 'Revoked'];

const stateOf = (row, at = new Date()) => {
  if (row.revokedOnUtc) return 'Revoked';
  const now = at.getTime();
  if (new Date(row.startsOnUtc).getTime() > now) return 'Pending';
  if (new Date(row.endsOnUtc).getTime() < now) return 'Expired';
  return 'Active';
};

/** AC-SEC-010-01-01: the grant and what the Auditor role may do. */
export async function grantAsync({
  email, startsOnUtc, endsOnUtc, stores = [], periodFrom = null, periodTo = null,
  actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.AuditorAccess.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.AuditorAccess.CreateEditDelete' };
  }
  const customer = await repository('Customer').getOneAsync((c) => c.email === email && !c.deleted);
  if (!customer) return { ok: false, message: 'no such account' };
  if (!startsOnUtc || !endsOnUtc) return { ok: false, message: 'the grant has a start and an end' };

  const roles = [...new Set([...(customer.roles ?? []), 'Auditor'])];
  await repository('Customer').updateAsync({ ...customer, roles });
  const row = await grantRepo().insertAsync({
    customerId: customer.id,
    email,
    startsOnUtc,
    endsOnUtc,
    stores,
    periodFrom,
    periodTo,
    grantedBy: by,
    createdOnUtc: new Date().toISOString(),
  });
  const withState = { ...row, status: stateOf(row) };
  await grantRepo().updateAsync(withState);
  await auditAsync({
    event: 'AUD-SEC-004',
    area: 'SEC',
    feature: 'PRD-SEC-010',
    entity: 'AuditorGrant',
    entityId: row.id,
    actor: by,
    after: {
      email, startsOnUtc, endsOnUtc, stores, status: withState.status,
    },
    storeId,
    note: 'auditor access granted',
  });
  await noticeAsync({
    code: 'Sec.Core.AuditorAccess', to: email, tokens: { startsOnUtc, endsOnUtc }, storeId, senderReference: `AuditorGrant ${row.id}`,
  });

  const all = await permissionsAsync();
  const auditorPermissions = [];
  for (const permission of all) {
    if (await authorizeAsync(permission.systemName, { roles: ['Auditor'] })) auditorPermissions.push(permission.systemName);
  }
  return {
    ok: true,
    grant: withState,
    status: withState.status,
    stateMachine: 'SM-SEC-03',
    role: 'Auditor',
    permissions: auditorPermissions,
    writePermissions: auditorPermissions.filter((p) => /CreateEditDelete|Delete|Manage/.test(p)),
    readOnly: auditorPermissions.every((p) => !/CreateEditDelete/.test(p)),
  };
}

export const grantsAsync = async () => (await grantRepo().getAllAsync())
  .map((g) => ({ ...g, status: stateOf(g) }));

export async function revokeAsync({
  grantId, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.AuditorAccess.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.AuditorAccess.CreateEditDelete' };
  }
  const row = await grantRepo().getByIdAsync(grantId);
  if (!row) return { ok: false, message: 'no such grant' };
  const updated = await grantRepo().updateAsync({
    ...row, revokedOnUtc: new Date().toISOString(), status: 'Revoked',
  });
  await auditAsync({
    event: 'AUD-SEC-004', area: 'SEC', feature: 'PRD-SEC-010', entity: 'AuditorGrant', entityId: row.id, actor: by, before: { status: stateOf(row) }, after: { status: 'Revoked' }, storeId, note: 'auditor access revoked',
  });
  return { ok: true, grant: updated };
}

/**
 * AC-SEC-010-01-02 and 01-03: what an auditor may do now. The IAM IPermissionService override
 * calls this, so an expired grant is refused on the next request (BR-IAM-060).
 */
export async function checkAccessAsync({
  customer, permission, storeId = 1,
}) {
  const roles = customer?.roles ?? [];
  if (!roles.includes('Auditor')) return { auditor: false, allowed: await authorizeAsync(permission, customer) };
  const rows = await grantRepo().getAllAsync((g) => g.customerId === customer.id);
  const grant = rows.map((g) => ({ ...g, status: stateOf(g) }))
    .sort((a, b) => (a.status === 'Active' ? -1 : 1))[0] ?? null;

  if (!grant || grant.status !== 'Active') {
    if (grant && grant.status === 'Expired' && grant.expiredRecordedOnUtc == null) {
      await grantRepo().updateAsync({ ...grant, status: 'Expired', expiredRecordedOnUtc: new Date().toISOString() });
      await auditAsync({
        event: 'AUD-SEC-004', area: 'SEC', feature: 'PRD-SEC-010', entity: 'AuditorGrant', entityId: grant.id, actor: customer.email, before: { status: 'Active' }, after: { status: 'Expired' }, storeId, note: 'auditor access expired',
      });
    }
    return {
      auditor: true,
      allowed: false,
      status: grant?.status ?? 'none',
      messageKey: 'Sec.AuditorAccessExpired',
      message: resource('Sec.AuditorAccessExpired'),
      refusedBy: 'the IAM IPermissionService override (BR-IAM-060)',
      auditEvent: 'AUD-SEC-004',
    };
  }
  const writes = /CreateEditDelete|Delete|Manage/.test(permission);
  const allowed = !writes && await authorizeAsync(permission, customer);
  return {
    auditor: true,
    allowed,
    status: 'Active',
    grant: {
      stores: grant.stores, periodFrom: grant.periodFrom, periodTo: grant.periodTo, endsOnUtc: grant.endsOnUtc,
    },
    refusedBy: allowed ? null : 'the native permission check: the Auditor role holds no write permission',
    nothingChanged: !allowed,
  };
}

/** AC-SEC-010-02-01 and 02-02: the trail an auditor sees, and the record that they saw it. */
export async function auditorTrailAsync({
  customer, from = null, to = null, storeId = 1, pageSize = 200, exported = false,
}) {
  const access = await checkAccessAsync({ customer, permission: 'Security.Core.AuditTrail.View', storeId });
  if (access.allowed !== true) return { ok: false, ...access };
  const grant = access.grant ?? {};
  const periodFrom = [grant.periodFrom, from].filter(Boolean).sort().pop() ?? null;
  const periodTo = [grant.periodTo, to].filter(Boolean).sort().shift() ?? null;
  const page = await queryAsync({ from: periodFrom, to: periodTo, pageSize });
  const stores = (grant.stores ?? []).map(Number);
  const events = stores.length
    ? page.events.filter((e) => stores.includes(Number(e.storeId)))
    : page.events;
  await auditAsync({
    event: 'AUD-SEC-002',
    area: 'SEC',
    feature: 'PRD-SEC-010',
    entity: 'AuditEntry',
    entityId: events[events.length - 1]?.sequence ?? null,
    actor: customer.email,
    actorRole: 'Auditor',
    after: {
      action: exported ? 'exported' : 'viewed', events: events.length, period: { from: periodFrom, to: periodTo }, stores,
    },
    storeId,
    note: exported ? 'the auditor exported records' : 'the auditor viewed records',
  });
  return {
    ok: true,
    events,
    total: events.length,
    period: { from: periodFrom, to: periodTo },
    stores,
    limitedByGrant: true,
    recordedWithAuditorAsActor: true,
  };
}
