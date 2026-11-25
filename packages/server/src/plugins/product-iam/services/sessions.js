// PRD-IAM-006 Session management.
//
// SM-IAM-03 UserSession: Active -> Expired / Revoked / LoggedOut.
// BR-IAM-040: every sign-in creates a UserSession (session id claim, customer, created, last
// activity, IP address, user agent). A request whose session is revoked, idle past the timeout of
// its user class, or over the concurrent limit is rejected. Forced logout revokes all sessions
// and sets Customer.RequireReLogin. Session changes for one customer run under ILocker key
// 'iam-session-{CustomerId}'.

import { randomUUID } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';

const sessionRepo = () => repository('UserSession');
const customerRepo = () => repository('Customer');

const STAFF_ROLES = ['Administrators', 'PlatformTeam', 'Finance', 'Catalogue', 'Logistics', 'Warehouse',
  'Support', 'Compliance', 'Agent', 'Auditor', 'Operations', 'SecurityOfficer'];

export const userClassOf = (customer) => ((customer?.roles ?? []).some((r) => STAFF_ROLES.includes(r)) ? 'staff' : 'buyer');

export async function idleTimeoutAsync(customer, storeId = 1) {
  const userClass = userClassOf(customer);
  const minutes = await getSettingAsync(`iam.idletimeoutminutes.${userClass}`, storeId, userClass === 'staff' ? 20 : 60);
  return { userClass, minutes: Number(minutes) };
}

/** AC-IAM-006-02-01: the limit and what happens when it is reached. */
export async function openSessionAsync({
  sessionId, customer, ipAddress = null, userAgent = null, storeId = 1,
}) {
  return withLockAsync(lockKey.session(customer.id), async () => {
    const limit = Number(await getSettingAsync('iam.concurrentsessionlimit', storeId, 3));
    const action = await getSettingAsync('iam.concurrentsessionlimitaction', storeId, 'revoke-oldest');
    const active = (await sessionRepo().getAllAsync((s) => s.customerId === customer.id && s.status === 'Active'))
      .sort((a, b) => new Date(a.createdOnUtc) - new Date(b.createdOnUtc));

    if (limit > 0 && active.length >= limit) {
      if (action === 'refuse') {
        return {
          ok: false, messageKey: 'Iam.SessionLimitReached', message: resource('Iam.SessionLimitReached'), limit, openSessions: active.length,
        };
      }
      const oldest = active[0];
      await sessionRepo().updateAsync({
        ...oldest, status: 'Revoked', revokedBy: 'system', revokedReason: 'the concurrent-session limit was reached',
      });
      await auditAsync({
        event: 'AUD-IAM-005', area: 'IAM', feature: 'PRD-IAM-006', entity: 'UserSession', entityId: oldest.sessionId, actor: 'system', after: { status: 'Revoked' }, note: 'the oldest session was revoked because the limit was reached',
      });
    }

    const timeout = await idleTimeoutAsync(customer, storeId);
    const session = await sessionRepo().insertAsync({
      sessionId: randomUUID(),
      browserSession: sessionId,
      customerId: customer.id,
      userClass: timeout.userClass,
      idleTimeoutMinutes: timeout.minutes,
      ipAddress,
      userAgent,
      status: 'Active',
      createdOnUtc: new Date().toISOString(),
      lastActivityUtc: new Date().toISOString(),
    });
    return { ok: true, session };
  });
}

/** AC-IAM-006-01-01 to 01-03: the check is on the server record, not the cookie. */
export async function checkSessionAsync({ sessionId, storeId = 1 }) {
  const session = await sessionRepo().getOneAsync((s) => s.sessionId === sessionId || s.browserSession === sessionId);
  if (!session) return { valid: false, reason: 'no session record' };
  if (session.status !== 'Active') {
    return {
      valid: false, status: session.status, messageKey: session.status === 'Expired' ? 'Iam.SessionExpired' : null, message: session.status === 'Expired' ? resource('Iam.SessionExpired') : 'This session was ended.',
    };
  }
  const customer = await customerRepo().getByIdAsync(session.customerId);
  if (customer?.requireReLogin === true) {
    await sessionRepo().updateAsync({ ...session, status: 'Revoked', revokedReason: 'forced logout' });
    return { valid: false, status: 'Revoked', message: 'You were signed out. Please log in again.' };
  }
  const idleMs = Date.now() - new Date(session.lastActivityUtc).getTime();
  if (idleMs > session.idleTimeoutMinutes * 60 * 1000) {
    const expired = await sessionRepo().updateAsync({ ...session, status: 'Expired' });
    return {
      valid: false, status: 'Expired', messageKey: 'Iam.SessionExpired', message: resource('Iam.SessionExpired'), session: expired,
    };
  }
  const touched = await sessionRepo().updateAsync({ ...session, lastActivityUtc: new Date().toISOString() });
  return { valid: true, session: touched };
}

/** For the tests and the admin screen: age a session without waiting for the clock. */
export async function ageSessionAsync({ sessionId, minutes }) {
  const session = await sessionRepo().getOneAsync((s) => s.sessionId === sessionId || s.browserSession === sessionId);
  if (!session) return null;
  return sessionRepo().updateAsync({
    ...session, lastActivityUtc: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
  });
}

/** AC-IAM-006-03-01: forced logout revokes every session and sets RequireReLogin. */
export async function forceLogoutAsync({ customerId, by = 'security officer', reason = 'forced logout' }) {
  return withLockAsync(lockKey.session(customerId), async () => {
    const sessions = await sessionRepo().getAllAsync((s) => s.customerId === customerId && s.status === 'Active');
    for (const s of sessions) {
      await sessionRepo().updateAsync({
        ...s, status: 'Revoked', revokedBy: by, revokedReason: reason,
      });
    }
    const customer = await customerRepo().getByIdAsync(customerId);
    await customerRepo().updateAsync({ ...customer, requireReLogin: true });
    await auditAsync({
      event: 'AUD-IAM-005',
      area: 'IAM',
      feature: 'PRD-IAM-006',
      entity: 'Customer',
      entityId: customerId,
      actor: by,
      after: { sessionsRevoked: sessions.length, requireReLogin: true },
      note: reason,
    });
    return { ok: true, revoked: sessions.length, requireReLogin: true };
  });
}

/** AC-IAM-006-03-02: ending one session leaves the others running. */
export async function revokeSessionAsync({ sessionId, by = 'security officer', reason = 'ended by an officer' }) {
  const session = await sessionRepo().getOneAsync((s) => s.sessionId === sessionId);
  if (!session) return { ok: false, message: 'unknown session' };
  const revoked = await sessionRepo().updateAsync({
    ...session, status: 'Revoked', revokedBy: by, revokedReason: reason,
  });
  await auditAsync({
    event: 'AUD-IAM-005', area: 'IAM', feature: 'PRD-IAM-006', entity: 'UserSession', entityId: sessionId, actor: by, after: { status: 'Revoked' }, note: reason,
  });
  return { ok: true, session: revoked };
}

/**
 * AC-IAM-006-04-01: a password, MFA or role change signs the user in again with a new session
 * identifier and revokes the old record.
 */
export async function rotateSessionAsync({
  customerId, browserSession = null, reason = 'credentials changed', ipAddress = null, userAgent = null, storeId = 1,
}) {
  const customer = await customerRepo().getByIdAsync(customerId);
  const open = await sessionRepo().getAllAsync((s) => s.customerId === customerId && s.status === 'Active');
  for (const s of open) {
    await sessionRepo().updateAsync({
      ...s, status: 'Revoked', revokedBy: 'system', revokedReason: reason,
    });
  }
  const opened = await openSessionAsync({
    sessionId: browserSession, customer, ipAddress, userAgent, storeId,
  });
  await auditAsync({
    event: 'AUD-IAM-005', area: 'IAM', feature: 'PRD-IAM-006', entity: 'Customer', entityId: customerId, actor: customer.email ?? customer.phone, after: { newSessionId: opened.session?.sessionId }, note: `session rotated: ${reason}`,
  });
  return { ok: true, revoked: open.map((s) => s.sessionId), session: opened.session };
}

export const sessionsAsync = (customerId = null) => sessionRepo()
  .getAllAsync((s) => (customerId ? s.customerId === customerId : true));

export async function logoutSessionAsync(browserSession) {
  const session = await sessionRepo().getOneAsync((s) => s.browserSession === browserSession && s.status === 'Active');
  if (!session) return { ok: true };
  await sessionRepo().updateAsync({ ...session, status: 'LoggedOut' });
  return { ok: true, session: session.sessionId };
}
