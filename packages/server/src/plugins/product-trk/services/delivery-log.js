// PRD-TRK-007 notification delivery tracking and audit.
//
// Every message the engine sends, holds, suppresses or fails is one NotificationMessage row with
// its channel, definition, content version, recipient, order and shipment, status (SM-TRK-03),
// provider message id and times. A provider receipt (IC-TRK-02) moves the row to Delivered,
// Failed or Refused; a failure or a refusal starts the fallback channel.
// The log is personal data, so PRD-PLT-020 retains it under the record type trk.notificationlog.

import { repository, plainRepository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';

export const STATUSES = ['Pending', 'Held', 'Sent', 'Delivered', 'Failed', 'Suppressed', 'Refused'];

const logRepo = () => repository('NotificationMessage');

/** One row per message attempt. AC-TRK-007-01-01. */
export async function logMessageAsync({
  definition, channel, recipient = null, address = null, status = 'Pending', reason = null,
  order = null, shipment = null, tokens = {}, key = null, storeId = 1, reference = null,
  occurrenceKey = null, text = null, contentVersion = null, languageId = null,
  languageFallback = false, ignoreDelayBeforeSend = false, fallbackOfId = null, sender = null,
  heldUntilUtc = null, rule = null, attachments = [],
}) {
  return logRepo().insertAsync({
    definitionId: definition?.id ?? null,
    definitionKey: definition?.key ?? key,
    // the event code and recipient address under the names every module already sends with
    event: definition?.key ?? key,
    to: address ?? recipient?.email ?? recipient?.phone ?? null,
    category: definition?.category ?? null,
    contentVersion,
    channel,
    recipient: address ?? recipient?.email ?? recipient?.phone ?? null,
    customerId: recipient?.customer?.id ?? recipient?.id ?? null,
    orderId: order?.id ?? null,
    shipmentId: shipment?.id ?? null,
    occurrenceKey,
    status,
    reason,
    providerMessageId: null,
    queuedEmailId: null,
    fallbackOfId,
    reference,
    sender,
    text,
    tokens,
    attachments,
    languageId,
    languageFallback,
    ignoreDelayBeforeSend,
    heldUntilUtc,
    rule,
    storeId,
    createdOnUtc: new Date().toISOString(),
    sentOnUtc: null,
    deliveredOnUtc: null,
  });
}

export async function updateMessageAsync(id, changes) {
  const row = await logRepo().getByIdAsync(id);
  if (!row) return null;
  return logRepo().updateAsync({ ...row, ...changes });
}

/** BR-TRK-022: the same occurrence is never sent twice on the same channel to the same person. */
export async function duplicateOfAsync(occurrenceKey) {
  if (!occurrenceKey) return null;
  const rows = await logRepo().getAllAsync((r) => r.occurrenceKey === occurrenceKey
    && !['Failed', 'Refused'].includes(r.status));
  return rows[0] ?? null;
}

export async function messagesAsync(filter = {}) {
  const rows = await logRepo().getAllAsync((r) => (
    (!filter.channel || r.channel === filter.channel)
    && (!filter.status || r.status === filter.status)
    && (!filter.definitionKey || r.definitionKey === filter.definitionKey)
    && (!filter.reference || r.reference === filter.reference)
    && (filter.orderId === undefined || Number(r.orderId) === Number(filter.orderId))
    && (!filter.from || r.createdOnUtc >= filter.from)
    && (!filter.to || r.createdOnUtc <= filter.to)
  ));
  return rows.slice().sort((a, b) => b.createdOnUtc.localeCompare(a.createdOnUtc) || b.id - a.id);
}

/**
 * IC-TRK-02 DeliveryReceipt. AC-TRK-007-01-02: the row moves by provider message id; a failure
 * or a refusal starts the fallback channel of the definition.
 */
export async function deliveryReceiptAsync({
  providerMessageId, status, at = null, reason = null, gateways = null,
}) {
  const row = await logRepo().getOneAsync((r) => r.providerMessageId === providerMessageId);
  if (!row) {
    // an unknown id is kept for retry matching rather than thrown away
    await plainRepository('UnmatchedReceipt').insertAsync({
      providerMessageId, status, reason, receivedOnUtc: new Date().toISOString(),
    });
    return { ok: false, unknownProviderMessageId: providerMessageId, keptForRetryMatching: true };
  }
  if (!['Delivered', 'Failed', 'Refused'].includes(status)) {
    return { ok: false, message: 'a receipt reports Delivered, Failed or Refused' };
  }
  const updated = await updateMessageAsync(row.id, {
    status,
    reason: reason ?? row.reason,
    deliveredOnUtc: status === 'Delivered' ? (at ?? new Date().toISOString()) : null,
  });
  let fallback = null;
  if (['Failed', 'Refused'].includes(status)) fallback = await startFallbackAsync({ row: updated, gateways });
  return {
    ok: true, message: updated, fallbackStarted: Boolean(fallback), fallback,
  };
}

/** The next channel of the definition, as a new row linked to the first (BR-TRK-022). */
export async function startFallbackAsync({ row, gateways = null }) {
  const { definitionAsync, sendNotificationAsync } = await import('./notifications.js');
  const definition = await definitionAsync(row.definitionKey);
  if (!definition || definition.fallback !== true) return null;
  const channels = definition.channels ?? [];
  const next = channels[channels.indexOf(row.channel) + 1];
  if (!next) return null;
  const order = row.orderId ? await repository('Order').getByIdAsync(row.orderId) : null;
  const customer = row.customerId ? await repository('Customer').getByIdAsync(row.customerId) : null;
  const sent = await sendNotificationAsync({
    key: row.definitionKey,
    tokens: row.tokens ?? {},
    customer,
    order,
    storeId: row.storeId,
    occurrence: `${row.occurrenceKey ?? row.id}-fallback`,
    reference: row.reference,
    gateways,
    // only the next channel: the one before it has already been attempted
    onlyChannels: [next],
  });
  const created = (sent.messages ?? []).find((m) => m.channel === next);
  if (created) await updateMessageAsync(created.id, { fallbackOfId: row.id });
  return created ?? null;
}

/**
 * AC-TRK-007-01-04: QueuedMessagesSendTask. An e-mail moves to Sent when it goes out, or to
 * Failed at the native retry limit; Delivered is set only when the provider reports delivery.
 */
export async function queuedMessagesSendTaskAsync({ gateways = null, retryLimit = 3, storeId = 1 } = {}) {
  const queue = repository('QueuedEmail');
  const pending = await queue.getAllAsync((e) => !e.sentOnUtc && (e.attempts ?? 0) < retryLimit && e.failedPermanently !== true);
  const out = { sent: 0, failed: 0, attempted: pending.length };
  for (const email of pending) {
    const gateway = gateways?.email ?? null;
    let ok = false;
    let providerRef = null;
    let reason = null;
    try {
      const result = gateway ? await gateway.sendAsync({ to: email.to, event: email.definitionKey, text: email.body }) : null;
      if (result?.status === 'refused') reason = result.reason ?? 'refused';
      else { ok = Boolean(result); providerRef = result?.providerRef ?? null; }
    } catch (err) { reason = err.message; }
    const attempts = (email.attempts ?? 0) + 1;
    if (ok) {
      await queue.updateAsync({ ...email, attempts, sentOnUtc: new Date().toISOString() });
      for (const row of await logRepo().getAllAsync((r) => Number(r.queuedEmailId) === Number(email.id))) {
        await updateMessageAsync(row.id, { status: 'Sent', sentOnUtc: new Date().toISOString(), providerMessageId: providerRef });
      }
      out.sent += 1;
    } else {
      const exhausted = attempts >= retryLimit;
      await queue.updateAsync({
        ...email, attempts, lastError: reason, failedPermanently: exhausted,
      });
      if (exhausted) {
        for (const row of await logRepo().getAllAsync((r) => Number(r.queuedEmailId) === Number(email.id))) {
          await updateMessageAsync(row.id, { status: 'Failed', reason: reason ?? 'the native retry limit was reached' });
        }
        out.failed += 1;
      }
    }
  }
  return {
    ok: true, ...out, retryLimit, task: 'QueuedMessagesSendTask', storeId,
  };
}

/**
 * AC-TRK-007-01-05: the notifications panel of an order in admin - every message for that order
 * and its shipments, with channel, status and time, and the content.
 */
export async function orderNotificationsAsync({ orderId, requester = null }) {
  if (requester && !await authorizeAsync('Tracking.Core.Notifications.View', requester)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Notifications.View' };
  }
  const shipments = await repository('Shipment').getAllAsync((s) => Number(s.orderId) === Number(orderId));
  const shipmentIds = shipments.map((s) => Number(s.id));
  const rows = await logRepo().getAllAsync((r) => Number(r.orderId) === Number(orderId)
    || shipmentIds.includes(Number(r.shipmentId)));
  return {
    ok: true,
    orderId: Number(orderId),
    widgetZone: 'admin_order_details_block',
    shipments: shipmentIds,
    messages: rows
      .slice()
      .sort((a, b) => a.createdOnUtc.localeCompare(b.createdOnUtc))
      .map((r) => ({
        id: r.id,
        definitionKey: r.definitionKey,
        channel: r.channel,
        status: r.status,
        recipient: r.recipient,
        at: r.sentOnUtc ?? r.createdOnUtc,
        shipmentId: r.shipmentId,
        reason: r.reason,
        text: r.text,
      })),
  };
}

/** AC-TRK-007-02-01: the delivery report, by channel and event type, exportable. */
export async function deliveryReportAsync({
  from = null, to = null, requester = null,
}) {
  if (requester && !await authorizeAsync('Tracking.Core.Notifications.View', requester)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.Notifications.View' };
  }
  const rows = await messagesAsync({ from, to });
  const blank = () => ({
    Sent: 0, Delivered: 0, Failed: 0, Held: 0, Suppressed: 0, Refused: 0, Pending: 0,
  });
  const byChannel = {};
  const byEvent = {};
  for (const row of rows) {
    (byChannel[row.channel] ??= blank())[row.status] += 1;
    (byEvent[row.definitionKey] ??= blank())[row.status] += 1;
  }
  const header = 'scope,name,sent,delivered,failed,held,suppressed,refused';
  const line = (scope, name, c) => [scope, name, c.Sent, c.Delivered, c.Failed, c.Held, c.Suppressed, c.Refused].join(',');
  return {
    ok: true,
    from,
    to,
    total: rows.length,
    byChannel,
    byEventType: byEvent,
    exportable: true,
    csv: [
      header,
      ...Object.entries(byChannel).map(([k, c]) => line('channel', k, c)),
      ...Object.entries(byEvent).map(([k, c]) => line('event', k, c)),
    ].join('\n'),
  };
}

/**
 * AC-TRK-007-01-03: one notice to many people, with one row per person and channel, which the
 * sending module reads back by its own reference (for example the SEC-008 breach notices).
 */
export async function outcomesByReferenceAsync(reference) {
  const rows = await messagesAsync({ reference });
  return {
    reference,
    people: [...new Set(rows.map((r) => r.recipient))].length,
    rows: rows.map((r) => ({
      recipient: r.recipient, channel: r.channel, status: r.status, at: r.sentOnUtc ?? r.createdOnUtc, reason: r.reason,
    })),
  };
}

/** AC-TRK-007-01-06: what PRD-PLT-020 deletes, and the run that is logged. */
export async function retentionRecordTypeAsync() {
  return {
    code: 'trk.notificationlog',
    owningModule: 'Product.TRK',
    entity: 'NotificationMessage',
    dateField: 'createdOnUtc',
    allowedActions: ['Archive', 'Delete'],
    personalData: true,
    anonymiseFields: ['recipient', 'to', 'text'],
  };
}

export async function auditDeliveryAsync({ messageId, actor, note }) {
  const row = await logRepo().getByIdAsync(messageId);
  if (!row) return { ok: false, message: 'no such message' };
  await auditAsync({
    event: 'AUD-TRK-002',
    area: 'TRK',
    feature: 'PRD-TRK-007',
    entity: 'NotificationMessage',
    entityId: row.id,
    actor,
    after: { status: row.status, channel: row.channel },
    note,
  });
  return { ok: true };
}
