// SEC - the platform audit trail read model (SEC-004) and the consent/privacy view (SEC-007).
//
// Every write in the prototype goes through core/audit.js, so this is the one place the trail is
// read. SEC-010 gives an auditor read-only access; in the prototype the Auditor role sees this
// screen and nothing that writes.

import { auditTrailAsync } from '../../../core/audit.js';
import { registry } from '@product/shared';

export async function trailAsync(filter) {
  const rows = await auditTrailAsync(filter);
  const catalogue = Object.fromEntries(registry.auditEvents.map((e) => [e.id, e]));
  return rows.map((r) => ({ ...r, catalogue: catalogue[r.event] ?? null }));
}

export function auditEventCatalogue() {
  return registry.auditEvents;
}
