// Multi-channel messaging - PRD-TRK-005, with TRK-004 e-mail templates and TRK-007 delivery records.
//
// CLAUDE.md: "Messages through TRK-005". Every module raises an event code; routing per
// event and channel comes from the pack (decision MSG-ROUTE), the send itself goes to a mock
// gateway under packages/mocks (P-3), and the attempt is recorded (TRK-007).
//
// Locale keys and their default English text are generated into
// packages/shared/data/messages.json from the module chapters' section 11.2, so the text the
// prototype shows is the text the PRD proposes - never invented here.

import { registry } from '@product/shared';
import { repository } from './repository.js';
import { getSettingAsync } from './settings.js';

const messageRepo = () => repository('MessageDelivery');
const localeByKey = Object.fromEntries(registry.messages.map((m) => [m.key, m]));

/** Resolve a locale resource key to its text, substituting {token} values. */
export function resource(key, tokens = {}) {
  const entry = localeByKey[key];
  let text = entry ? entry.text : key;
  for (const [k, v] of Object.entries(tokens)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

export function resourceExists(key) {
  return Boolean(localeByKey[key]);
}

/**
 * Send a message for an event code on the channels the pack routes it to.
 * `gateways` is the mock registry injected by the plugin host, so no real SMS/WhatsApp/e-mail
 * leaves the prototype.
 */
export async function sendAsync({
  event, to, channels, tokens = {}, storeId = 1, feature = 'PRD-TRK-005', gateways = null,
}) {
  const routed = channels ?? (await getSettingAsync(`trk.route.${event}`, storeId, ['email']));
  const list = Array.isArray(routed) ? routed : [routed];
  const out = [];
  for (const channel of list) {
    const gateway = gateways?.[channel] ?? null;
    let status = 'queued';
    let providerRef = null;
    let error = null;
    try {
      if (gateway) {
        const res = await gateway.sendAsync({ to, event, text: resource(event, tokens), tokens });
        status = res.status;
        providerRef = res.providerRef ?? null;
      } else {
        status = 'no-gateway';
      }
    } catch (err) {
      status = 'failed';
      error = err.message;
    }
    out.push(await messageRepo().insertAsync({
      event,
      feature,
      channel,
      to,
      text: resource(event, tokens),
      tokens,
      status,
      providerRef,
      error,
      storeId,
      sentOnUtc: new Date().toISOString(),
    }));
  }
  return out;
}

export async function deliveriesAsync(filter = {}) {
  const rows = await messageRepo().getAllAsync((r) => (
    (!filter.channel || r.channel === filter.channel)
    && (!filter.event || r.event === filter.event)
    && (!filter.to || r.to === filter.to)
  ));
  return rows.slice().sort((a, b) => b.sentOnUtc.localeCompare(a.sentOnUtc) || b.id - a.id);
}
