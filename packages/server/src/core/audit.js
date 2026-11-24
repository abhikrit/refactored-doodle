// Platform audit trail - PRD-SEC-004.
//
// CLAUDE.md: "audit through SEC-004". Every important action is written here with the actor,
// the entity, before/after values and the AUD-... event code from the module chapter's
// audit event catalogue (section 14.2). The trail is append-only; nothing deletes a row.

import { repository } from './repository.js';

const auditRepo = () => repository('AuditEntry');

export async function auditAsync({
  event,
  area,
  feature,
  entity,
  entityId,
  actor,
  actorRole,
  before = null,
  after = null,
  storeId = 1,
  outcome = 'success',
  note = '',
}) {
  return auditRepo().insertAsync({
    event,
    area,
    feature,
    entity,
    entityId: entityId == null ? null : String(entityId),
    actor: actor ?? 'system',
    actorRole: actorRole ?? 'System',
    before,
    after,
    storeId,
    outcome,
    note,
    occurredOnUtc: new Date().toISOString(),
  });
}

export async function auditTrailAsync(filter = {}) {
  const rows = await auditRepo().getAllAsync((r) => (
    (!filter.area || r.area === filter.area)
    && (!filter.event || r.event === filter.event)
    && (!filter.entity || r.entity === filter.entity)
    && (!filter.entityId || r.entityId === String(filter.entityId))
    && (!filter.actor || r.actor === filter.actor)
  ));
  return rows.slice().sort((a, b) => b.occurredOnUtc.localeCompare(a.occurredOnUtc) || b.id - a.id);
}
