// PRD-INT-004 the single integration outbox (IC-INT-09 Enqueue), SM-INT-01.
//
// Every module that sends something to another system writes one IntegrationMessage here and
// nothing else: the INT delivery task sends it, retries it and dead-letters it. IAM-019 is the
// first caller (BR-IAM-100, BR-INT-010).

import { repository } from '../../../core/repository.js';

const messageRepo = () => repository('IntegrationMessage');

export async function enqueueAsync({
  channel, messageType, payload, feature = null, maxAttempts = 3,
}) {
  return messageRepo().insertAsync({
    channel,
    messageType,
    payload,
    feature,
    status: 'Pending',
    attempts: 0,
    maxAttempts,
    lastError: null,
    enqueuedOnUtc: new Date().toISOString(),
  });
}

/** The delivery task: sends, retries and dead-letters, per SM-INT-01. */
export async function runDeliveryTaskAsync({ adapter = null, failChannel = null } = {}) {
  const pending = await messageRepo().getAllAsync((m) => ['Pending', 'Retrying'].includes(m.status));
  const sent = [];
  const deadLettered = [];
  for (const message of pending) {
    const attempts = message.attempts + 1;
    let ok = true;
    let error = null;
    if (failChannel && message.channel === failChannel) { ok = false; error = 'the adapter refused the message'; }
    else if (adapter) {
      try { const r = await adapter.publishAsync(message); ok = r?.ok !== false; error = r?.message ?? null; } catch (err) { ok = false; error = err.message; }
    }
    if (ok) {
      sent.push(await messageRepo().updateAsync({
        ...message, status: 'Sent', attempts, sentOnUtc: new Date().toISOString(),
      }));
      continue;
    }
    const exhausted = attempts >= message.maxAttempts;
    const updated = await messageRepo().updateAsync({
      ...message, status: exhausted ? 'DeadLettered' : 'Retrying', attempts, lastError: error,
    });
    if (exhausted) deadLettered.push(updated);
  }
  return { processed: pending.length, sent, deadLettered };
}

export const messagesAsync = (channel = null) => messageRepo()
  .getAllAsync((m) => (channel ? m.channel === channel : true));

export const deadLetterAsync = () => messageRepo().getAllAsync((m) => m.status === 'DeadLettered');
