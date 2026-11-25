// IC-TRK-04 RegisterEventCode / SendEvent - PRD-TRK-005, the owner of IWorkflowMessageService.
//
// Decision MSG-ROUTE and BR-ADM-085: a module never sends a message itself. It registers its
// event codes with TRK-005 at installation and sends through SendEvent; TRK-005 applies the
// channels from the pack and the TRK-006 preferences. A code that is not registered cannot be
// sent, which is what lets ADM-002 refuse a workflow naming an unknown event code at publishing
// (AC-ADM-002-02-02).

import { sendAsync } from '../../../core/messages.js';

const codes = new Map();

export function registerEventCode({
  code, owner, feature, defaultChannels = ['email'], note = '',
}) {
  if (codes.has(code) && codes.get(code).owner !== owner) {
    throw new Error(`IC-TRK-04: event code ${code} is already registered by ${codes.get(code).owner}`);
  }
  codes.set(code, {
    code, owner, feature, defaultChannels, note,
  });
  return codes.get(code);
}

export const isEventCodeRegistered = (code) => codes.has(code);
export const eventCodes = () => [...codes.values()].sort((a, b) => a.code.localeCompare(b.code));

/** SendEvent: TRK-005 decides what is sent, to whom and on which channel. */
export async function sendEventAsync({
  code, to, tokens = {}, storeId = 1, gateways = null,
}) {
  const registered = codes.get(code);
  if (!registered) throw new Error(`IC-TRK-04: event code ${code} is not registered with TRK-005`);
  return sendAsync({
    event: code,
    to,
    channels: registered.defaultChannels,
    tokens,
    storeId,
    feature: 'PRD-TRK-005',
    gateways,
  });
}
