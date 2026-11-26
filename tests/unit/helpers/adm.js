// Shared set-up for the PRD-ADM acceptance tests: one API app, signed-in sessions per role.
//
// The roles matter: most ADM screens are gated by a permission the chapter's section 4 names,
// so the tests sign in as the role the criterion names, not as an administrator by default.

import { createApiApp } from '../../../packages/server/src/app.js';
import { repository } from '../../../packages/server/src/core/repository.js';
import { newSalt, hashPassword } from '../../../packages/server/src/plugins/product-iam/services/passwords.js';

/**
 * Create or update a customer with a password the product can verify: a salted SHA-512 hash in
 * CustomerPassword, never a clear value on the customer record (BR-SEC-001, AC-SEC-001-03-01).
 */
export async function createCustomerAsync({ password = 'demo', ...row }) {
  const existing = row.email
    ? await repository('Customer').getOneAsync((c) => c.email === row.email)
    : null;
  const customer = existing
    ? await repository('Customer').updateAsync({ ...existing, ...row, password: null })
    : await repository('Customer').insertAsync({
      active: true,
      deleted: false,
      createdOnUtc: new Date().toISOString(),
      ...row,
      password: null,
    });
  if (password) {
    const passwordSalt = newSalt();
    await repository('CustomerPassword').insertAsync({
      customerId: customer.id,
      passwordFormat: 'Hashed',
      hashedPasswordFormat: 'SHA512',
      passwordSalt,
      password: hashPassword(password, passwordSalt),
      createdOnUtc: new Date().toISOString(),
    });
  }
  return customer;
}

export const SESSIONS = {
  admin: 'adm-admin',
  approver: 'adm-approver',
  approver2: 'adm-approver-2',
  catalogue: 'adm-catalogue',
  finance: 'adm-finance',
  operations: 'adm-operations',
  logistics: 'adm-logistics',
  compliance: 'adm-compliance',
  auditor: 'adm-auditor',
  buyer: 'adm-buyer',
  support: 'adm-support',
  privacy: 'adm-privacy',
  security: 'adm-security',
};

const EMAILS = {
  'adm-admin': 'admin@example.com',
  'adm-approver': 'config.approver@example.com',
  'adm-approver-2': 'config.approver2@example.com',
  'adm-catalogue': 'catalogue@example.com',
  'adm-finance': 'finance@example.com',
  'adm-operations': 'operations@example.com',
  'adm-logistics': 'logistics@example.com',
  'adm-compliance': 'compliance@example.com',
  'adm-auditor': 'auditor@example.com',
  'adm-buyer': 'buyer@example.com',
  'adm-support': 'support@example.com',
  'adm-privacy': 'privacy@example.com',
  'adm-security': 'security@example.com',
};

export async function startAsync({ client = 'MPC' } = {}) {
  const { app } = await createApiApp({ defaultClient: client });
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, body, session = SESSIONS.admin) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', 'x-session': session },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
    return { status: res.status, body: parsed };
  };

  for (const [session, email] of Object.entries(EMAILS)) {
    await call('POST', '/api/identity/sign-in', { email, password: 'demo' }, session);
  }

  return {
    base,
    server,
    call,
    get: async (p, s) => (await call('GET', p, undefined, s)).body,
    post: async (p, b, s) => (await call('POST', p, b ?? {}, s)).body,
    patch: async (p, b, s) => (await call('PATCH', p, b ?? {}, s)).body,
    del: async (p, s) => (await call('DELETE', p, undefined, s)).body,
    /** The customer record behind a session, for the service calls that take an actor. */
    actorAsync: async (session = SESSIONS.admin) => repository('Customer')
      .getOneAsync((c) => c.email === EMAILS[session]),
    stop: () => server.close(),
  };
}
