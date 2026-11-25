// PRD-SEC-008 Breach notification workflow. SM-SEC-02: Open, Assessed, RegulatorNotified,
// SubjectsNotified, Closed, with Overdue when a deadline passes.
//
// BR-SEC-030: no deadline is assumed. A deadline the country profile does not carry shows
// message Sec.DeadlineNotConfigured and the privacy officer is told.
// BR-SEC-100: the notices go out through TRK-005 (IC-TRK-04 SendEvent) under the event codes SEC
// registered at installation.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { profileAsync } from './privacy-profile.js';
import { noticeAsync, officerAsync } from './notices.js';

const caseRepo = () => repository('BreachCase');
const noticeRepo = () => repository('BreachNotice');

export const STATES = ['Open', 'Assessed', 'RegulatorNotified', 'SubjectsNotified', 'Closed', 'Overdue'];

const hours = (from, count) => new Date(new Date(from).getTime() + Number(count) * 3600 * 1000).toISOString();

/** AC-SEC-008-01-01 and 01-02: the case, its deadlines and what happens when they are unset. */
export async function openCaseAsync({
  discoveredOnUtc, description, dataCategories = [], systems = [], incidentReference = null,
  actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  if (!discoveredOnUtc || !description) {
    return { ok: false, message: 'the discovery time and a description are required' };
  }
  const profile = await profileAsync({ storeId });
  const regulatorHours = profile.breachDeadlineToRegulatorHours;
  const peopleHours = profile.breachDeadlineToPeopleHours;
  const missing = [];
  if (regulatorHours === null || regulatorHours === undefined) missing.push('breachDeadlineToRegulatorHours');
  if (peopleHours === null || peopleHours === undefined) missing.push('breachDeadlineToPeopleHours');

  const row = await caseRepo().insertAsync({
    discoveredOnUtc,
    description,
    dataCategories,
    systems,
    incidentReference,
    status: 'Open',
    regulatorDeadlineUtc: regulatorHours ? hours(discoveredOnUtc, regulatorHours) : null,
    subjectDeadlineUtc: peopleHours ? hours(discoveredOnUtc, peopleHours) : null,
    deadlinesFrom: 'PRD-SEC-012 country profile',
    openedBy: by,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-SEC-005',
    area: 'SEC',
    feature: 'PRD-SEC-008',
    entity: 'BreachCase',
    entityId: row.id,
    actor: by,
    after: { status: 'Open', dataCategories, deadlinesConfigured: missing.length === 0 },
    storeId,
    note: 'breach case opened',
  });
  let alerted = null;
  if (missing.length) {
    alerted = await noticeAsync({
      code: 'Sec.Core.BreachDeadline',
      to: await officerAsync('privacy', storeId),
      tokens: { caseId: String(row.id), missing: missing.join(', ') },
      storeId,
      senderReference: `BreachCase ${row.id}`,
    });
  }
  return {
    ok: true,
    case: row,
    deadlinesConfigured: missing.length === 0,
    missingDeadlines: missing,
    messageKey: missing.length ? 'Sec.DeadlineNotConfigured' : null,
    message: missing.length ? resource('Sec.DeadlineNotConfigured') : null,
    privacyOfficerAlerted: Boolean(alerted),
    noDefaultAssumed: true,
    rule: 'BR-SEC-030',
  };
}

export const casesAsync = (filter = {}) => caseRepo()
  .getAllAsync((c) => (!filter.status || c.status === filter.status)
    && (!filter.incidentReference || c.incidentReference === filter.incidentReference));

export const caseAsync = async (caseId) => {
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return null;
  const notices = await noticeRepo().getAllAsync((n) => n.caseId === row.id);
  return { ...row, notices };
};

/** AC-SEC-008-01-03: the affected list, produced and frozen with its count and criteria. */
export async function freezeAffectedListAsync({
  caseId, criteria, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return { ok: false, message: 'no such case' };
  if (row.affectedFrozenOnUtc) {
    return {
      ok: false, frozen: true, message: 'the affected list is frozen', count: row.affectedCount,
    };
  }
  const customers = await repository('Customer').getAllAsync((c) => !c.deleted && c.isSystemAccount !== true);
  const affected = customers.filter((c) => {
    if (criteria.customerIds?.length) return criteria.customerIds.includes(c.id);
    if (criteria.stores?.length && !criteria.stores.includes(c.storeId ?? 1)) return false;
    if (criteria.recordDateFrom && new Date(c.createdOnUtc ?? 0) < new Date(criteria.recordDateFrom)) return false;
    if (criteria.recordDateTo && new Date(c.createdOnUtc ?? 0) > new Date(criteria.recordDateTo)) return false;
    return true;
  }).map((c) => ({
    customerId: c.id,
    name: [c.firstName, c.lastName].filter(Boolean).join(' ') || null,
    channel: c.email ? 'email' : c.phone ? 'sms' : 'none',
    contact: c.email ?? c.phone ?? null,
  }));
  const updated = await caseRepo().updateAsync({
    ...row,
    affected,
    affectedCount: affected.length,
    affectedCriteria: criteria,
    affectedFrozenOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, actor: by, after: { affectedCount: affected.length, criteria }, storeId, note: 'affected list frozen',
  });
  return {
    ok: true,
    count: affected.length,
    affected,
    criteria,
    frozen: true,
    frozenOnUtc: updated.affectedFrozenOnUtc,
    entityTypes: criteria.entityTypes ?? ['Customer'],
  };
}

/** AC-SEC-008-02-01: the subject notices, one per affected person, with the delivery result. */
export async function notifySubjectsAsync({
  caseId, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return { ok: false, message: 'no such case' };
  if (row.notifiable !== true) {
    return { ok: false, message: 'the case has not been assessed as notifiable' };
  }
  if (!row.affectedFrozenOnUtc) return { ok: false, message: 'the affected list is not frozen yet' };

  const sent = [];
  for (const person of row.affected ?? []) {
    if (person.channel === 'none') {
      sent.push({ customerId: person.customerId, result: 'NoChannel' });
      continue;
    }
    const result = await noticeAsync({
      code: 'Sec.BreachNotice',
      to: person.contact,
      tokens: { caseId: String(row.id), dataCategories: (row.dataCategories ?? []).join(', ') },
      storeId,
      senderReference: `BreachCase ${row.id}`,
    });
    const delivery = result.deliveries[0] ?? { result: 'Failed' };
    const record = await noticeRepo().insertAsync({
      caseId: row.id,
      customerId: person.customerId,
      channel: person.channel,
      to: person.contact,
      eventCode: 'Sec.BreachNotice',
      result: delivery.result,
      sentOnUtc: new Date().toISOString(),
    });
    sent.push({ customerId: person.customerId, channel: person.channel, result: delivery.result, noticeId: record.id });
  }
  const updated = await caseRepo().updateAsync({
    ...row, status: 'SubjectsNotified', subjectsNotifiedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, actor: by, before: { status: row.status }, after: { status: 'SubjectsNotified', notices: sent.length }, storeId, note: 'subject notices sent',
  });
  return {
    ok: true,
    case: updated,
    notices: sent,
    eventCode: 'Sec.BreachNotice',
    sentThrough: 'IC-TRK-04 SendEvent',
    senderReference: `BreachCase ${row.id}`,
    mandatoryCategory: true,
  };
}

/** AC-SEC-008-02-02: the regulator notice, recorded after it is submitted elsewhere. */
export async function recordRegulatorNoticeAsync({
  caseId, submittedOnUtc, channel, reference, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return { ok: false, message: 'no such case' };
  if (!submittedOnUtc || !channel || !reference) {
    return { ok: false, message: 'the date, the channel and the reference are all recorded' };
  }
  const updated = await caseRepo().updateAsync({
    ...row,
    status: 'RegulatorNotified',
    regulatorSubmittedOnUtc: submittedOnUtc,
    regulatorChannel: channel,
    regulatorReference: reference,
  });
  await auditAsync({
    event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, actor: by, before: { status: row.status }, after: { status: 'RegulatorNotified', reference }, storeId, note: 'regulator notice recorded',
  });
  return { ok: true, case: updated, state: 'RegulatorNotified', stateMachine: 'SM-SEC-02' };
}

/** AC-SEC-008-02-03: the deadline task. */
export async function deadlineTaskAsync({ storeId = 1 } = {}) {
  const leadHours = await getSettingAsync('sec.breachdeadlineleadhours', storeId, 12);
  const open = await caseRepo().getAllAsync((c) => !['Closed'].includes(c.status));
  const now = Date.now();
  const alerted = [];
  const overdue = [];
  for (const row of open) {
    for (const [which, deadline, met] of [
      ['regulator', row.regulatorDeadlineUtc, Boolean(row.regulatorSubmittedOnUtc)],
      ['people', row.subjectDeadlineUtc, Boolean(row.subjectsNotifiedOnUtc)],
    ]) {
      if (!deadline || met) continue;
      const due = new Date(deadline).getTime();
      if (due <= now) {
        await caseRepo().updateAsync({ ...row, status: 'Overdue', overdueOnUtc: new Date().toISOString() });
        overdue.push({ caseId: row.id, which, deadline });
        await auditAsync({
          event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, before: { status: row.status }, after: { status: 'Overdue', which }, storeId, note: 'breach deadline passed',
        });
      } else if (due - now <= Number(leadHours) * 3600 * 1000) {
        alerted.push({ caseId: row.id, which, deadline });
      }
      if (due - now <= Number(leadHours) * 3600 * 1000) {
        await noticeAsync({
          code: 'Sec.Core.BreachDeadline',
          to: await officerAsync('privacy', storeId),
          tokens: { caseId: String(row.id), which, deadline },
          storeId,
          senderReference: `BreachCase ${row.id}`,
        });
      }
    }
  }
  return {
    alerted, overdue, leadHours: Number(leadHours), officerAlerted: alerted.length + overdue.length > 0,
  };
}

/** AC-SEC-008-02-04: not notifiable needs a second person to confirm before the case closes. */
export async function assessAsync({
  caseId, notifiable, reason = null, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return { ok: false, message: 'no such case' };
  if (notifiable !== true && !reason) {
    return { ok: false, reasonRequired: true, message: 'record why the breach is not notifiable' };
  }
  const updated = await caseRepo().updateAsync({
    ...row,
    status: 'Assessed',
    notifiable: notifiable === true,
    notNotifiableReason: notifiable === true ? null : reason,
    assessedBy: by,
    assessedOnUtc: new Date().toISOString(),
    confirmationRequired: notifiable !== true,
    confirmedBy: null,
  });
  await auditAsync({
    event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, actor: by, before: { status: row.status }, after: { status: 'Assessed', notifiable: notifiable === true, reason }, storeId, note: 'breach case assessed',
  });
  return {
    ok: true,
    case: updated,
    confirmationRequired: notifiable !== true,
    confirmationBy: notifiable !== true ? 'a second user holding Security.Core.Breaches.CreateEditDelete' : null,
  };
}

export async function confirmAssessmentAsync({
  caseId, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return { ok: false, message: 'no such case' };
  if (row.confirmationRequired !== true) return { ok: false, message: 'that case needs no confirmation' };
  if (row.assessedBy === by) {
    return { ok: false, sameUser: true, message: 'a second user must confirm the decision' };
  }
  const updated = await caseRepo().updateAsync({ ...row, confirmedBy: by, confirmedOnUtc: new Date().toISOString() });
  await auditAsync({
    event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, actor: by, after: { confirmedBy: by }, storeId, note: 'not-notifiable decision confirmed',
  });
  return { ok: true, case: updated, confirmedBy: by };
}

export async function closeCaseAsync({
  caseId, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.Breaches.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.Breaches.CreateEditDelete' };
  }
  const row = await caseRepo().getByIdAsync(caseId);
  if (!row) return { ok: false, message: 'no such case' };
  if (row.confirmationRequired === true && !row.confirmedBy) {
    return {
      ok: false,
      confirmationRequired: true,
      message: 'a second user holding Security.Core.Breaches.CreateEditDelete must confirm the not-notifiable decision first',
    };
  }
  const updated = await caseRepo().updateAsync({ ...row, status: 'Closed', closedOnUtc: new Date().toISOString() });
  await auditAsync({
    event: 'AUD-SEC-005', area: 'SEC', feature: 'PRD-SEC-008', entity: 'BreachCase', entityId: row.id, actor: by, before: { status: row.status }, after: { status: 'Closed' }, storeId, note: 'breach case closed',
  });
  return { ok: true, case: updated };
}
