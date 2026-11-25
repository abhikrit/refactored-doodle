// IC-TRK-04 RegisterEventCode / SendEvent - PRD-TRK-005, the owner of IWorkflowMessageService.
//
// Decision MSG-ROUTE and BR-ADM-085: a module never sends a message itself. It registers its
// event codes with TRK-005 at installation and sends through SendEvent; TRK-005 applies the
// channels from the pack and the TRK-006 preferences. A code that is not registered cannot be
// sent, which is what lets ADM-002 refuse a workflow naming an unknown event code at publishing
// (AC-ADM-002-02-02).

import { repository } from '../../../core/repository.js';
import {
  registerEventCodeAsync, registeredEventCodes, isEventCodeRegistered as engineKnows,
  sendNotificationAsync,
} from './notifications.js';

const codes = new Map();

export function registerEventCode({
  code, owner, feature, defaultChannels = ['email'], category = 'Operations', content = {},
  mandatory = false, urgent = false, note = '',
}) {
  if (codes.has(code) && codes.get(code).owner !== owner) {
    throw new Error(`IC-TRK-04: event code ${code} is already registered by ${codes.get(code).owner}`);
  }
  codes.set(code, {
    code, owner, feature, defaultChannels, note,
  });
  // the engine is the one that sends it (BR-TRK-020); this is the module-facing surface
  registerEventCodeAsync({
    code,
    owningModule: owner,
    feature,
    category,
    defaultChannels,
    content,
    mandatory,
    urgent,
  });
  return codes.get(code);
}

export const isEventCodeRegistered = (code) => codes.has(code) || engineKnows(code);
export const eventCodes = () => [...codes.values()].sort((a, b) => a.code.localeCompare(b.code));
export const engineEventCodes = () => registeredEventCodes();

const looksLikeEmail = (value) => /@/.test(String(value ?? ''));

/** SendEvent (IC-TRK-04): the engine decides what is sent, to whom and on which channel. */
export async function sendEventAsync({
  code, to, tokens = {}, storeId = 1, gateways = null, reference = null, order = null,
}) {
  if (!isEventCodeRegistered(code)) throw new Error(`IC-TRK-04: event code ${code} is not registered with TRK-005`);
  const addresses = Array.isArray(to) ? to : [to];
  const recipients = [];
  for (const address of addresses) {
    const customer = looksLikeEmail(address)
      ? await repository('Customer').getOneAsync((c) => c.email === address)
      : await repository('Customer').getOneAsync((c) => c.phone === address);
    recipients.push({
      customer: customer ?? null,
      email: looksLikeEmail(address) ? address : customer?.email ?? null,
      phone: looksLikeEmail(address) ? customer?.phone ?? null : address,
      languageId: customer?.languageId ?? 1,
    });
  }
  const sent = await sendNotificationAsync({
    key: code, tokens, recipients, storeId, gateways, reference, order,
  });
  return sent.messages;
}
