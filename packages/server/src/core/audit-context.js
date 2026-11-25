// The scoped context an audit event is written in: the actor, the original customer when someone
// is acting for them, the IP address, the store and the correlation id of the request.
//
// In 5.00.1 these come from IWorkContext and IWebHelper, which are scoped services. The faithful
// stand-in on Node is AsyncLocalStorage: one store per request, readable anywhere inside it
// without threading an argument through every call.

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const storage = new AsyncLocalStorage();

const EMPTY = {
  actor: 'system',
  actorRole: 'System',
  originalActor: null,
  ipAddress: null,
  storeId: 1,
  correlationId: null,
  reason: null,
  // installation and seeding are not audited changes by a user: nopCommerce's own installation
  // writes its data before there is an actor or a trail to write to
  installing: false,
};

/** Run `fn` with an audit context. Nested calls inherit what they do not set. */
export function withAuditContextAsync(context, fn) {
  const parent = storage.getStore() ?? EMPTY;
  const merged = {
    ...parent, ...context, correlationId: context.correlationId ?? parent.correlationId ?? randomUUID(),
  };
  return storage.run(merged, fn);
}

export function auditContext() {
  return storage.getStore() ?? EMPTY;
}

/** Set fields on the context in flight (the sign-in handler learns the actor mid-request). */
export function setAuditContext(patch) {
  const current = storage.getStore();
  if (!current) return;
  Object.assign(current, patch);
}

export const newCorrelationId = () => randomUUID();
