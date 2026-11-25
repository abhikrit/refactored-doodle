// PRD-TRK-004 e-mail notifications and templates.
//
// The e-mail leg of the engine stays native: a MessageTemplate per event, localized subject and
// body, tokens rendered at send time, the result queued as a QueuedEmail. TRK adds its own
// tokens (outlet opening hours, pickup code, expected delivery range) to the allowed-token list.
// A hard bounce flags the customer (SM-TRK-07), the e-mail channel is skipped for them, and the
// engine uses the fallback channel of the definition.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { resource } from '../../../core/messages.js';

const templateRepo = () => repository('MessageTemplate');
const queueRepo = () => repository('QueuedEmail');

/** The native token list, plus the tokens TRK adds (AC-TRK-004-01-03). */
export const NATIVE_TOKENS = [
  '%Store.Name%', '%Customer.FullName%', '%Customer.Email%', '%Order.OrderNumber%',
  '%Order.OrderId%', '%Order.Total%', '%Shipment.TrackingNumber%', '%Shipment.ShipmentNumber%',
];
export const TRK_TOKENS = [
  '%Outlet.OpeningHours%', '%Shipment.PickupCode%', '%Shipment.ExpectedDeliveryRange%',
  '%Outlet.Name%', '%Outlet.Address%',
];
export const allowedTokens = () => [...NATIVE_TOKENS, ...TRK_TOKENS];

/** The templates TRK installs, one per native definition it sends by e-mail. */
export const DEFAULT_TEMPLATES = [
  { name: 'OrderPlaced.CustomerNotification', subject: 'Your order %Order.OrderNumber%', body: 'Hello %Customer.FullName%, we have received your order %Order.OrderNumber%.' },
  { name: 'OrderPaid.CustomerNotification', subject: 'Payment received for %Order.OrderNumber%', body: 'Hello %Customer.FullName%, we have received your payment for order %Order.OrderNumber%.' },
  { name: 'OrderProcessing.CustomerNotification', subject: 'Order %Order.OrderNumber% is being prepared', body: 'Your order %Order.OrderNumber% is being prepared.' },
  { name: 'OrderCompleted.CustomerNotification', subject: 'Order %Order.OrderNumber% is complete', body: 'Your order %Order.OrderNumber% is complete.' },
  { name: 'OrderCancelled.CustomerNotification', subject: 'Order %Order.OrderNumber% was cancelled', body: 'Your order %Order.OrderNumber% was cancelled.' },
  { name: 'ShipmentSent.CustomerNotification', subject: 'Order %Order.OrderNumber% is on its way', body: 'Your order %Order.OrderNumber% is on its way. Tracking number %Shipment.TrackingNumber%. Expected %Shipment.ExpectedDeliveryRange%.' },
  { name: 'ShipmentDelivered.CustomerNotification', subject: 'Order %Order.OrderNumber% was delivered', body: 'Your order %Order.OrderNumber% was delivered.' },
  { name: 'ShipmentReadyForPickup.CustomerNotification', subject: 'Order %Order.OrderNumber% is ready for collection', body: 'Collect order %Order.OrderNumber% at %Outlet.Name%, %Outlet.Address%. Opening hours: %Outlet.OpeningHours%. Your collection code is %Shipment.PickupCode%.' },
  { name: 'CustomerPasswordRecovery.CustomerNotification', subject: 'Reset your password', body: 'Hello %Customer.FullName%, use this link to set a new password.' },
];

export async function installTemplatesAsync({ storeId = 0 } = {}) {
  const out = [];
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await templateRepo().getOneAsync((t) => t.name === template.name && Number(t.storeId ?? 0) === Number(storeId));
    if (existing) { out.push(existing.name); continue; }
    await templateRepo().insertAsync({
      ...template,
      storeId: Number(storeId),
      limitedToStores: false,
      active: true,
      delayBeforeSend: null,
      attachedDownloadId: null,
      languageId: 1,
      version: 1,
    });
    out.push(template.name);
  }
  return { installed: out.length, templates: out };
}

/**
 * AC-TRK-004-01-02: a template limited to one store is used for that store; a store without its
 * own copy uses the shared one (the native LimitedToStores behaviour).
 */
export async function templateForAsync({ name, storeId = 1, languageId = 1 }) {
  const all = await templateRepo().getAllAsync((t) => t.name === name);
  const localized = all.filter((t) => Number(t.languageId ?? 1) === Number(languageId));
  const pool = localized.length ? localized : all;
  const own = pool.find((t) => t.limitedToStores === true && Number(t.storeId) === Number(storeId));
  if (own) return own;
  return pool.find((t) => t.limitedToStores !== true) ?? pool[0] ?? null;
}

export const templatesAsync = () => templateRepo().getAllAsync();

/** AC-TRK-004-03-01: an administrator edits a template; the next message uses it. */
export async function saveTemplateAsync({
  name, storeId = 0, languageId = 1, subject = null, body = null, active = null,
  delayBeforeSend = null, attachedDownloadId = null, limitedToStores = null, actor = null,
}) {
  if (!await authorizeAsync('ContentManagement.MessageTemplatesCreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'ContentManagement.MessageTemplatesCreateEditDelete' };
  }
  const existing = await templateRepo().getOneAsync((t) => t.name === name
    && Number(t.storeId ?? 0) === Number(storeId) && Number(t.languageId ?? 1) === Number(languageId));
  const before = existing
    ? {
      subject: existing.subject, body: existing.body, active: existing.active, delayBeforeSend: existing.delayBeforeSend,
    }
    : null;
  const row = {
    name,
    storeId: Number(storeId),
    languageId: Number(languageId),
    subject: subject ?? existing?.subject ?? '',
    body: body ?? existing?.body ?? '',
    active: active === null ? (existing?.active ?? true) : active === true,
    delayBeforeSend: delayBeforeSend === null ? (existing?.delayBeforeSend ?? null) : delayBeforeSend,
    attachedDownloadId: attachedDownloadId === null ? (existing?.attachedDownloadId ?? null) : attachedDownloadId,
    limitedToStores: limitedToStores === null ? (existing?.limitedToStores ?? false) : limitedToStores === true,
    version: (existing?.version ?? 0) + 1,
  };
  const saved = existing ? await templateRepo().updateAsync({ ...existing, ...row }) : await templateRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-TRK-002',
    area: 'TRK',
    feature: 'PRD-TRK-004',
    entity: 'MessageTemplate',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before,
    after: {
      subject: saved.subject, active: saved.active, delayBeforeSend: saved.delayBeforeSend, version: saved.version,
    },
    storeId: Number(storeId),
    note: existing ? 'message template changed' : 'message template created',
  });
  return { ok: true, template: saved, usedByTheNextMessage: true };
}

/** Token substitution. Unknown tokens are left as they are, the way the native renderer does. */
export function renderAsync(text, tokens = {}) {
  let out = String(text ?? '');
  for (const [name, value] of Object.entries(tokens)) {
    out = out.split(`%${name}%`).join(String(value ?? ''));
  }
  return out;
}

/** AC-TRK-004-01-01: the e-mail is rendered in the customer's language and queued. */
export async function queueEmailAsync({
  to, key, text = null, tokens = {}, languageId = 1, storeId = 1, ignoreDelayBeforeSend = false,
}) {
  const template = await templateForAsync({ name: key, storeId, languageId });
  const subject = template ? renderAsync(template.subject, tokens) : key;
  const body = template ? renderAsync(template.body, tokens) : (text ?? resource(key, tokens));
  return queueRepo().insertAsync({
    to,
    subject,
    body,
    definitionKey: key,
    templateId: template?.id ?? null,
    templateVersion: template?.version ?? null,
    languageId: Number(languageId),
    storeId: Number(storeId),
    attempts: 0,
    sentOnUtc: null,
    // the 5.00 reminder senders have already applied the delay, so the engine passes the flag on
    delayBeforeSend: ignoreDelayBeforeSend ? null : (template?.delayBeforeSend ?? null),
    ignoreDelayBeforeSend,
    createdOnUtc: new Date().toISOString(),
  });
}

export const queuedEmailsAsync = (filter = {}) => queueRepo()
  .getAllAsync((e) => (!filter.to || e.to === filter.to) && (!filter.key || e.definitionKey === filter.key));

/* ================================================================= bounces ============= */

/**
 * IC-TRK-03 ReceiveBounce. AC-TRK-004-02-01: a hard bounce flags the customer with the date
 * (SM-TRK-07); the flag shows on the admin customer page with Trk.EmailBounced and the engine
 * skips the e-mail channel for them.
 */
export async function receiveBounceAsync({
  address, bounceType = 'hard', at = null, actor = 'bounce feed',
}) {
  const customer = await repository('Customer').getOneAsync((c) => c.email === address);
  if (!customer) {
    return { ok: false, unknownAddress: address, logged: true };
  }
  if (bounceType !== 'hard') {
    return {
      ok: true, address, bounceType, flagged: false, note: 'a soft bounce does not flag the address',
    };
  }
  const bouncedOnUtc = at ?? new Date().toISOString();
  await repository('Customer').updateAsync({ ...customer, emailBounced: true, emailBouncedOnUtc: bouncedOnUtc });
  await auditAsync({
    event: 'AUD-TRK-009',
    area: 'TRK',
    feature: 'PRD-TRK-004',
    entity: 'Customer',
    entityId: customer.id,
    actor,
    before: { emailBounced: customer.emailBounced === true },
    after: { emailBounced: true, bouncedOnUtc },
    note: 'e-mail bounce flag set',
  });
  return {
    ok: true,
    address,
    bounceType,
    flagged: true,
    bouncedOnUtc,
    state: 'Bounced',
    messageKey: 'Trk.EmailBounced',
    message: resource('Trk.EmailBounced'),
    emailChannelSkipped: true,
  };
}

/** AC-TRK-004-02-02: the flag is cleared when the address changes or is revalidated. */
export async function clearBounceAsync({ customerId, newEmail = null, actor = null }) {
  const customer = await repository('Customer').getByIdAsync(customerId);
  if (!customer) return { ok: false, message: 'no such customer' };
  const before = { emailBounced: customer.emailBounced === true, email: customer.email };
  const updated = await repository('Customer').updateAsync({
    ...customer,
    email: newEmail ?? customer.email,
    emailBounced: false,
    emailBouncedOnUtc: null,
    emailRevalidatedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-TRK-009',
    area: 'TRK',
    feature: 'PRD-TRK-004',
    entity: 'Customer',
    entityId: customer.id,
    actor: actor?.email ?? actor ?? null,
    before,
    after: { emailBounced: false, email: updated.email },
    note: newEmail ? 'e-mail changed, bounce flag cleared' : 'e-mail revalidated, bounce flag cleared',
  });
  return {
    ok: true, customerId: Number(customerId), email: updated.email, state: 'Valid', emailResumed: true,
  };
}

export async function bounceStateAsync(address) {
  const customer = await repository('Customer').getOneAsync((c) => c.email === address);
  return {
    address,
    bounced: customer?.emailBounced === true,
    bouncedOnUtc: customer?.emailBouncedOnUtc ?? null,
    customerId: customer?.id ?? null,
    messageKey: customer?.emailBounced === true ? 'Trk.EmailBounced' : null,
    message: customer?.emailBounced === true ? resource('Trk.EmailBounced') : null,
  };
}

export const bouncedCustomersAsync = async () => (await repository('Customer').getAllAsync((c) => c.emailBounced === true))
  .map((c) => ({
    id: c.id, email: c.email, bouncedOnUtc: c.emailBouncedOnUtc, message: resource('Trk.EmailBounced'),
  }));
