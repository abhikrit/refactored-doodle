// PRD-TRK-005 the notification engine: the owner of IWorkflowMessageService (OVR-REG).
//
// BR-TRK-020: every notification goes through here. For each send the engine finds the
// notification definition for the native template name or the product event code (IC-TRK-04),
// applies the preferences and the bounce flag, renders each channel variant with the same tokens
// in the customer's language, sends on each channel the definition lists, and logs every attempt
// (TRK-007). It returns the queued e-mail id when e-mail is sent, otherwise 0.
// BR-TRK-021: IWorkflowMessageService has one owner. Installation is refused while the bundled
// Misc.Brevo plugin is installed, because it overrides the same service.
// BR-TRK-022: one message per occurrence - definition, entity, occurrence, channel, recipient.
// BR-TRK-024: an order kind may change what a native order template does (IC-TRK-05).
// BR-TRK-025: a native template with no recipient e-mail address takes the SMS route.

import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { logMessageAsync, updateMessageAsync, duplicateOfAsync } from './delivery-log.js';
import {
  renderAsync, queueEmailAsync, bounceStateAsync,
} from './email-templates.js';

export const CHANNELS = ['email', 'sms', 'whatsapp', 'push', 'inapp'];
export const ENGINE_VERSION = 1;

const definitionRepo = () => repository('NotificationDefinition');
const contentRepo = () => repository('ChannelContent');

/* ====================================================== the definition catalogue ======= */

/**
 * The native 5.00.1 templates the engine installs a definition for. Channels are the Proposed
 * defaults of BR-TRK-025 (an SMS variant where the chapter names one), everything else is
 * e-mail only until the client adds channels; no period or channel is assumed beyond that.
 */
export const NATIVE_DEFINITIONS = [
  { key: 'OrderPlaced.CustomerNotification', category: 'Orders', channels: ['email', 'sms'], smsVariant: 'Your order %Order.OrderNumber% has been received.' },
  { key: 'OrderPaid.CustomerNotification', category: 'Orders', channels: ['email', 'sms'], smsVariant: 'We have received payment for order %Order.OrderNumber%.' },
  { key: 'OrderProcessing.CustomerNotification', category: 'Orders', channels: ['email'] },
  { key: 'OrderCompleted.CustomerNotification', category: 'Orders', channels: ['email'] },
  { key: 'OrderCancelled.CustomerNotification', category: 'Orders', channels: ['email'] },
  { key: 'ShipmentSent.CustomerNotification', category: 'Delivery', channels: ['email', 'sms'], smsVariant: 'Order %Order.OrderNumber% is on its way. Track it with %Shipment.TrackingNumber%.' },
  { key: 'ShipmentDelivered.CustomerNotification', category: 'Delivery', channels: ['email', 'sms'], smsVariant: 'Order %Order.OrderNumber% has been delivered.' },
  { key: 'ShipmentReadyForPickup.CustomerNotification', category: 'Delivery', channels: ['email', 'sms'], smsVariant: 'Order %Order.OrderNumber% is ready for collection. Code %Shipment.PickupCode%.' },
  { key: 'CustomerPasswordRecovery.CustomerNotification', category: 'Account', channels: ['email', 'sms'], mandatory: true, urgent: true, smsVariant: 'Your password reset code is %Customer.PasswordRecoveryCode%.' },
  { key: 'Customer.Gdpr.DeleteRequest', category: 'Account', channels: ['email', 'sms'], mandatory: true, smsVariant: 'Your request to delete your account has been received.' },
  { key: 'Customer.Gdpr.ExportRequest', category: 'Account', channels: ['email', 'sms'], mandatory: true, smsVariant: 'Your copy of your data is ready.' },
  // the templates 5.00 added: an e-mail-only definition each, sent as natively until the client
  // adds channels (AC-TRK-005-01-08)
  { key: 'Reminders.AbandonedCartFollowUp1', category: 'Reminders', channels: ['email'], addedIn: '5.00' },
  { key: 'Reminders.AbandonedCartFollowUp2', category: 'Reminders', channels: ['email'], addedIn: '5.00' },
  { key: 'Reminders.AbandonedCartFollowUp3', category: 'Reminders', channels: ['email'], addedIn: '5.00' },
  { key: 'Reminders.PendingOrderFollowUp1', category: 'Reminders', channels: ['email'], addedIn: '5.00' },
  { key: 'Reminders.PendingOrderFollowUp2', category: 'Reminders', channels: ['email'], addedIn: '5.00' },
  { key: 'Reminders.RegistrationFollowUp', category: 'Reminders', channels: ['email'], addedIn: '5.00' },
  { key: 'NextRecurringPaymentNotification.CustomerNotification', category: 'Orders', channels: ['email'], addedIn: '5.00' },
  { key: 'ReturnRequest.WithdrawalLinkMessage', category: 'Returns', channels: ['email'], addedIn: '5.00' },
];

/**
 * The pack loader resets the store when a client pack is applied, so the engine makes sure its
 * definitions are there before it answers rather than relying on installation order.
 */
export async function ensureInstalledAsync() {
  if ((await definitionRepo().getAllAsync()).length > 0) return { installed: false };
  await installDefinitionsAsync();
  await installEventCodeDefinitionsAsync();
  const { installTemplatesAsync } = await import('./email-templates.js');
  await installTemplatesAsync();
  // the shipment and pickup messages PRD-TRK-012 adds to the native set
  const { installTrk012DefinitionsAsync } = await import('./shipment-notifications.js');
  await installTrk012DefinitionsAsync();
  const { installOutreachDefinitionAsync } = await import('./outreach.js');
  await installOutreachDefinitionAsync();
  return { installed: true };
}

export async function installDefinitionsAsync() {
  const written = [];
  for (const native of NATIVE_DEFINITIONS) {
    written.push(await upsertDefinitionAsync({
      key: native.key,
      category: native.category,
      channels: native.channels,
      // a definition sends on every channel it lists; fallback is the other arrangement, where
      // the next channel is tried only when the one before it fails (AC-TRK-005-03-01), and the
      // client turns it on per definition
      fallback: false,
      mandatory: native.mandatory === true,
      urgent: native.urgent === true,
      owningModule: 'nopCommerce',
      native: true,
      addedIn: native.addedIn ?? null,
    }));
    if (native.smsVariant) {
      await setChannelContentAsync({
        key: native.key, channel: 'sms', languageId: 1, text: native.smsVariant, system: true,
      });
    }
  }
  return { installed: written.length, definitions: written.map((d) => d.key) };
}

async function upsertDefinitionAsync(row) {
  const existing = await definitionRepo().getOneAsync((d) => d.key === row.key);
  if (existing) return definitionRepo().updateAsync({ ...existing, ...row, version: (existing.version ?? 1) });
  return definitionRepo().insertAsync({ ...row, version: 1 });
}

export async function definitionsAsync() {
  await ensureInstalledAsync();
  return definitionRepo().getAllAsync();
}

export async function definitionAsync(key) {
  await ensureInstalledAsync();
  const found = await definitionRepo().getOneAsync((d) => d.key === key);
  if (found) return found;
  // a module that registered its event code after the engine installed gets its definition now
  const code = eventCodes.get(key);
  if (!code) return null;
  return upsertDefinitionAsync({
    key: code.code,
    category: code.category,
    channels: code.defaultChannels,
    fallback: false,
    mandatory: code.mandatory,
    urgent: code.urgent,
    owningModule: code.owningModule,
    native: false,
    eventCode: true,
    feature: code.feature,
  });
}

/** AC-TRK-005-05-01: an administrator edits a definition; the next message uses it. */
export async function saveDefinitionAsync({
  key, channels = null, fallback = null, category = null, mandatory = null, urgent = null,
  orderKindActions = null, actor = null, storeId = 1,
}) {
  if (!await authorizeAsync('Tracking.Core.NotificationSettings.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.NotificationSettings.CreateEditDelete' };
  }
  const existing = await definitionAsync(key);
  if (!existing) return { ok: false, message: `no notification definition ${key}` };
  for (const channel of channels ?? []) {
    if (!CHANNELS.includes(channel)) return { ok: false, message: `${channel} is not one of ${CHANNELS.join(', ')}` };
  }
  const before = {
    channels: existing.channels, fallback: existing.fallback, category: existing.category, mandatory: existing.mandatory, urgent: existing.urgent,
  };
  const saved = await definitionRepo().updateAsync({
    ...existing,
    channels: channels ?? existing.channels,
    fallback: fallback === null ? existing.fallback : fallback === true,
    category: category ?? existing.category,
    mandatory: mandatory === null ? existing.mandatory : mandatory === true,
    urgent: urgent === null ? existing.urgent : urgent === true,
    orderKindActions: orderKindActions ?? existing.orderKindActions ?? null,
    version: (existing.version ?? 1) + 1,
    updatedBy: actor?.email ?? null,
  });
  await auditAsync({
    event: 'AUD-TRK-002',
    area: 'TRK',
    feature: 'PRD-TRK-005',
    entity: 'NotificationDefinition',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before,
    after: {
      channels: saved.channels, fallback: saved.fallback, category: saved.category, mandatory: saved.mandatory, urgent: saved.urgent,
    },
    storeId,
    note: 'notification definition changed',
  });
  return { ok: true, definition: saved };
}

/** The content of one channel of one definition, per language, versioned. */
export async function setChannelContentAsync({
  key, channel, languageId = 1, text, actor = null, system = false, storeId = 1,
}) {
  if (!system && !await authorizeAsync('Tracking.Core.NotificationSettings.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.NotificationSettings.CreateEditDelete' };
  }
  const definition = await definitionAsync(key);
  if (!definition) return { ok: false, message: `no notification definition ${key}` };
  const existing = await contentRepo().getOneAsync((c) => Number(c.definitionId) === definition.id
    && c.channel === channel && Number(c.languageId) === Number(languageId));
  const saved = existing
    ? await contentRepo().updateAsync({ ...existing, text, version: (existing.version ?? 1) + 1 })
    : await contentRepo().insertAsync({
      definitionId: definition.id, definitionKey: key, channel, languageId: Number(languageId), text, version: 1,
    });
  if (!system) {
    await auditAsync({
      event: 'AUD-TRK-002',
      area: 'TRK',
      feature: 'PRD-TRK-005',
      entity: 'ChannelContent',
      entityId: saved.id,
      actor: actor?.email ?? null,
      before: existing ? { text: existing.text, version: existing.version } : null,
      after: { channel, languageId: Number(languageId), version: saved.version },
      storeId,
      note: 'notification channel content changed',
    });
  }
  return { ok: true, content: saved };
}

export const channelContentAsync = (key) => contentRepo().getAllAsync((c) => c.definitionKey === key);

/* ======================================================= IC-TRK-04 event codes ========= */

const eventCodes = new Map();

/** RegisterEventCode: called by each product plugin at installation (BR-TRK-023). */
export function registerEventCodeAsync({
  code, owningModule, category = 'Operations', defaultChannels = ['email'], content = {},
  mandatory = false, urgent = false, feature = null,
}) {
  if (eventCodes.has(code) && eventCodes.get(code).owningModule !== owningModule) {
    throw new Error(`IC-TRK-04: event code ${code} is already registered by ${eventCodes.get(code).owningModule}`);
  }
  eventCodes.set(code, {
    code, owningModule, category, defaultChannels, content, mandatory, urgent, feature,
  });
  return eventCodes.get(code);
}

export const registeredEventCodes = () => [...eventCodes.values()].sort((a, b) => a.code.localeCompare(b.code));
export const isEventCodeRegistered = (code) => eventCodes.has(code);

/** Every registered code gets a definition an administrator can configure like a native one. */
export async function installEventCodeDefinitionsAsync() {
  const out = [];
  for (const entry of eventCodes.values()) {
    const definition = await upsertDefinitionAsync({
      key: entry.code,
      category: entry.category,
      channels: entry.defaultChannels,
      fallback: false,
      mandatory: entry.mandatory,
      urgent: entry.urgent,
      owningModule: entry.owningModule,
      native: false,
      eventCode: true,
      feature: entry.feature,
    });
    for (const [channel, text] of Object.entries(entry.content ?? {})) {
      await setChannelContentAsync({
        key: entry.code, channel, languageId: 1, text, system: true,
      });
    }
    out.push(definition.key);
  }
  return { installed: out.length, codes: out };
}

/* ====================================================== IC-TRK-05 order kinds ========== */

const orderKindProviders = [];

export function registerOrderKindProvider({ owningModule, kind, fn }) {
  orderKindProviders.push({ owningModule, kind, fn });
  return { registered: true, owningModule, kind };
}

export const orderKindProvidersRegistered = () => orderKindProviders
  .map(({ fn, ...rest }) => rest);

async function orderKindOfAsync(order) {
  if (!order) return null;
  for (const provider of orderKindProviders) {
    try {
      const kind = await provider.fn(order);
      if (kind) return { kind, owningModule: provider.owningModule };
    } catch { /* a provider that cannot answer does not stop the send */ }
  }
  return null;
}

/* ========================================================= recipient and language ====== */

/**
 * AC-TRK-005-01-05: the order token, else the shipment token, else the customer e-mail token
 * loads the customer; the phone is the customer's, else the billing address phone (Proposed).
 */
export async function resolveRecipientAsync({ tokens = {}, customer = null, storeId = 1 }) {
  let found = customer;
  let resolvedBy = customer ? 'the customer passed by the caller' : null;
  if (!found && tokens['Order.OrderId']) {
    const order = await repository('Order').getByIdAsync(tokens['Order.OrderId']);
    if (order) {
      found = order.customerId
        ? await repository('Customer').getByIdAsync(order.customerId)
        : await repository('Customer').getOneAsync((c) => c.email === order.customerEmail);
      resolvedBy = 'the Order.OrderId token';
      if (!found && order.customerEmail) found = { email: order.customerEmail, phone: order.customerPhone ?? null };
    }
  }
  if (!found && tokens['Shipment.ShipmentNumber']) {
    const shipment = await repository('Shipment').getOneAsync((s) => s.shipmentNumber === tokens['Shipment.ShipmentNumber']
      || String(s.id) === String(tokens['Shipment.ShipmentNumber']));
    if (shipment) {
      const order = await repository('Order').getByIdAsync(shipment.orderId);
      found = order?.customerId ? await repository('Customer').getByIdAsync(order.customerId) : null;
      if (!found && order?.customerEmail) found = { email: order.customerEmail, phone: order.customerPhone ?? null };
      resolvedBy = 'the Shipment.ShipmentNumber token';
    }
  }
  if (!found && tokens['Customer.Email']) {
    found = await repository('Customer').getOneAsync((c) => c.email === tokens['Customer.Email']);
    if (!found) found = { email: tokens['Customer.Email'] };
    resolvedBy = 'the Customer.Email token';
  }
  let phone = found?.phone ?? null;
  let phoneFrom = phone ? 'the customer record' : null;
  if (!phone && found?.id) {
    const address = await repository('Address').getOneAsync((a) => Number(a.customerId) === Number(found.id));
    if (address?.phone) { phone = address.phone; phoneFrom = 'the billing address'; }
  }
  return {
    customer: found ?? null,
    email: found?.email ?? tokens['Customer.Email'] ?? null,
    phone,
    phoneFrom,
    resolvedBy,
    languageId: Number(found?.languageId ?? await getSettingAsync('localizationsettings.defaultlanguageid', storeId, 1)),
  };
}

/** AC-TRK-005-02-01 and 02-02: the customer's language, else the client default, logged. */
async function contentForAsync({
  definition, channel, languageId, storeId,
}) {
  const rows = await contentRepo().getAllAsync((c) => Number(c.definitionId) === definition.id && c.channel === channel);
  const mine = rows.find((r) => Number(r.languageId) === Number(languageId));
  if (mine) {
    return {
      text: mine.text, version: mine.version, languageId: Number(languageId), languageFallback: false,
    };
  }
  const defaultLanguageId = Number(await getSettingAsync('localizationsettings.defaultlanguageid', storeId, 1));
  const fallback = rows.find((r) => Number(r.languageId) === defaultLanguageId) ?? rows[0] ?? null;
  return {
    text: fallback?.text ?? null,
    version: fallback?.version ?? null,
    languageId: fallback ? Number(fallback.languageId) : defaultLanguageId,
    languageFallback: Boolean(fallback) && Number(languageId) !== defaultLanguageId,
    missingFor: Number(languageId),
  };
}

const channelEnabledAsync = async (channel, storeId) => (await getSettingAsync(`trk.channel.${channel}.enabled`, storeId, true)) !== false;

/* ================================================================= the send ============ */

const addressFor = (channel, recipient) => {
  if (channel === 'email') return recipient.email ?? null;
  if (['sms', 'whatsapp'].includes(channel)) return recipient.phone ?? null;
  return recipient.customer?.id ? `customer:${recipient.customer.id}` : (recipient.email ?? recipient.phone ?? null);
};

/**
 * SendNotificationAsync - the override. Returns the queued e-mail id when an e-mail was sent,
 * otherwise 0, exactly as the native service does (BR-TRK-020).
 */
export async function sendNotificationAsync({
  key,
  tokens = {},
  customer = null,
  order = null,
  shipment = null,
  recipients = null,
  languageId = null,
  storeId = 1,
  ignoreDelayBeforeSend = false,
  occurrence = null,
  reference = null,
  gateways = null,
  sender = null,
  onlyChannels = null,
}) {
  const definition = await definitionAsync(key);
  if (!definition) {
    // an unregistered product event code cannot be sent (IC-TRK-04)
    return {
      ok: false,
      queuedEmailId: 0,
      messages: [],
      unknownKey: key,
      message: `IC-TRK-04: ${key} is not a notification definition or a registered event code`,
    };
  }

  // BR-TRK-024: an order kind may change what a native order template does
  let effectiveDefinition = definition;
  let orderKind = null;
  if (order && key === 'OrderCompleted.CustomerNotification') {
    orderKind = await orderKindOfAsync(order);
    const action = orderKind ? (definition.orderKindActions ?? {})[orderKind.kind] ?? null : null;
    if (orderKind && action === 'Suppress') {
      const row = await logMessageAsync({
        definition, channel: 'email', recipient: null, status: 'Suppressed', reason: `order kind ${orderKind.kind}`, order, shipment, tokens, key, storeId,
      });
      return {
        ok: true, queuedEmailId: 0, messages: [row], orderKind: orderKind.kind, action: 'Suppress', rule: 'BR-TRK-024',
      };
    }
    if (orderKind && action && action !== 'Send') {
      const substitute = await definitionAsync(action);
      if (substitute) effectiveDefinition = substitute;
    }
  }

  const resolved = recipients
    ? recipients
    : [await resolveRecipientAsync({
      tokens: {
        ...tokens,
        'Order.OrderId': tokens['Order.OrderId'] ?? order?.id ?? null,
        'Shipment.ShipmentNumber': tokens['Shipment.ShipmentNumber'] ?? shipment?.shipmentNumber ?? null,
      },
      customer,
      storeId,
    })];

  const messages = [];
  let queuedEmailId = 0;
  for (const recipient of resolved) {
    // BR-TRK-031: the customer's own channel order comes first, then the definition's
    const { channelOrderAsync } = await import('./preferences.js');
    const ordered = onlyChannels
      ? { channels: onlyChannels, from: 'the fallback step' }
      : await channelOrderAsync({
        customerId: recipient.customer?.id ?? null,
        category: effectiveDefinition.category ?? null,
        definitionChannels: effectiveDefinition.channels ?? [],
        storeId,
      });
    const channels = ordered.channels;
    let delivered = false;
    for (let i = 0; i < channels.length; i += 1) {
      const channel = channels[i];
      const isFallback = i > 0 && effectiveDefinition.fallback === true;
      if (delivered && effectiveDefinition.fallback === true) break;

      // AC-TRK-005-01-04: a channel the client switched off is skipped and the skip logged
      if (!await channelEnabledAsync(channel, storeId)) {
        messages.push(await logMessageAsync({
          definition: effectiveDefinition, channel, recipient, status: 'Suppressed', reason: `the ${channel} channel is switched off for this client`, order, shipment, tokens, key, storeId, reference,
        }));
        continue;
      }

      const content = await contentForAsync({
        definition: effectiveDefinition,
        channel,
        languageId: Number(languageId ?? recipient.languageId ?? 1),
        storeId,
      });
      const address = addressFor(channel, recipient);

      // BR-TRK-025: a native template with no e-mail address never queues an empty e-mail
      if (channel === 'email' && !address) {
        messages.push(await logMessageAsync({
          definition: effectiveDefinition, channel, recipient, status: 'Suppressed', reason: 'no address', order, shipment, tokens, key, storeId, reference, rule: 'BR-TRK-025',
        }));
        continue;
      }
      if (!address) {
        messages.push(await logMessageAsync({
          definition: effectiveDefinition, channel, recipient, status: 'Failed', reason: 'no address', order, shipment, tokens, key, storeId, reference, fallbackOfId: isFallback ? messages[messages.length - 1]?.id ?? null : null,
        }));
        continue;
      }

      // the e-mail channel is skipped while the address is bouncing (TRK-004, SM-TRK-07)
      if (channel === 'email') {
        const bounce = await bounceStateAsync(address);
        if (bounce.bounced) {
          messages.push(await logMessageAsync({
            definition: effectiveDefinition, channel, recipient, status: 'Suppressed', reason: 'the address is bouncing', order, shipment, tokens, key, storeId, reference,
          }));
          continue;
        }
      }

      // BR-TRK-031 and BR-TRK-032: the preferences of this recipient on this channel
      const { checkAllowedAsync } = await import('./preferences.js');
      const verdict = await checkAllowedAsync({
        customerId: recipient.customer?.id ?? null,
        phone: recipient.phone ?? null,
        recipient: address,
        channel,
        category: effectiveDefinition.category ?? null,
        mandatory: effectiveDefinition.mandatory === true,
        orderId: order?.id ?? null,
        storeId,
      });
      if (verdict.allowed !== true) {
        messages.push(await logMessageAsync({
          definition: effectiveDefinition, channel, recipient, address, status: 'Suppressed', reason: verdict.reason, order, shipment, tokens, key, storeId, reference, rule: 'BR-TRK-031',
        }));
        continue;
      }
      if (verdict.overLimit === true) {
        messages.push(await logMessageAsync({
          definition: effectiveDefinition, channel, recipient, address, status: 'Suppressed', reason: `over the limit of ${verdict.limit} messages for this channel and period`, order, shipment, tokens, key, storeId, reference, rule: 'BR-TRK-032',
        }));
        continue;
      }

      // BR-TRK-022: at most one message per occurrence, channel and recipient
      const occurrenceKey = [
        effectiveDefinition.key,
        order ? `order:${order.id}` : (shipment ? `shipment:${shipment.id}` : 'none'),
        occurrence ?? 'default',
        channel,
        address,
      ].join('|');
      const duplicate = await duplicateOfAsync(occurrenceKey);
      if (duplicate) {
        messages.push({ ...duplicate, duplicate: true, rule: 'BR-TRK-022' });
        delivered = true;
        continue;
      }

      const text = renderAsync(content.text ?? `%${effectiveDefinition.key}%`, tokens);
      if (verdict.insideQuietHours === true && effectiveDefinition.urgent !== true) {
        messages.push(await logMessageAsync({
          definition: effectiveDefinition,
          channel,
          recipient,
          address,
          status: 'Held',
          reason: `inside the quiet hours ${verdict.quietHours}`,
          order,
          shipment,
          tokens,
          key,
          storeId,
          reference,
          occurrenceKey,
          text,
          contentVersion: content.version,
          languageId: content.languageId,
          heldUntilUtc: verdict.quietHoursEnd,
          rule: 'BR-TRK-032',
        }));
        delivered = true;
        continue;
      }
      const row = await logMessageAsync({
        definition: effectiveDefinition,
        channel,
        recipient,
        address,
        status: 'Pending',
        order,
        shipment,
        tokens,
        key,
        storeId,
        reference,
        occurrenceKey,
        text,
        contentVersion: content.version,
        languageId: content.languageId,
        languageFallback: content.languageFallback,
        ignoreDelayBeforeSend,
        fallbackOfId: isFallback ? messages[messages.length - 1]?.id ?? null : null,
        sender,
      });
      if (content.languageFallback) {
        await updateMessageAsync(row.id, { reason: `no text in language ${content.missingFor}; the default language was used` });
      }

      // The e-mail leg is the native one: the engine queues a QueuedEmail and
      // QueuedMessagesSendTask sends it, which is when the row moves to Sent (SM-TRK-03).
      if (channel === 'email') {
        const queued = await queueEmailAsync({
          to: address, key: effectiveDefinition.key, text, tokens, languageId: content.languageId, storeId, ignoreDelayBeforeSend,
        });
        messages.push(await updateMessageAsync(row.id, { queuedEmailId: queued.id, status: 'Pending', reason: 'queued for sending' }));
        queuedEmailId = queued.id;
        delivered = true;
        continue;
      }

      if (channel === 'inapp') {
        // SM-TRK-08: it arrives Unread and stays in the feed until the customer clears it
        await repository('InAppNotification').insertAsync({
          customerId: recipient.customer?.id ?? null,
          definitionKey: effectiveDefinition.key,
          text,
          status: 'Unread',
          read: false,
          orderId: order?.id ?? null,
          orderNumber: order?.orderNumber ?? null,
          trackingNumber: shipment?.trackingNumber ?? null,
          link: order?.orderNumber ? `/account/orders/${order.orderNumber}` : (shipment?.trackingNumber ? `/track/${shipment.trackingNumber}` : null),
          storeId,
          createdOnUtc: new Date().toISOString(),
        });
      }
      const sent = await sendThroughGatewayAsync({
        channel, address, text, tokens, key: effectiveDefinition.key, gateways,
      });
      messages.push(await updateMessageAsync(row.id, {
        status: sent.status,
        providerMessageId: sent.providerMessageId,
        // a send that says nothing keeps the reason an earlier step recorded (a language gap)
        ...(sent.reason ? { reason: sent.reason } : {}),
        sentOnUtc: sent.status === 'Sent' ? new Date().toISOString() : null,
      }));
      if (sent.status === 'Sent') delivered = true;
    }
  }

  return {
    ok: true,
    queuedEmailId,
    messages,
    definition: effectiveDefinition.key,
    orderKind: orderKind?.kind ?? null,
    channels: effectiveDefinition.channels,
    ignoreDelayBeforeSend,
    rule: 'BR-TRK-020',
  };
}

/** BR-TRK-032: a held message goes out on its own channel once the quiet period has ended. */
export async function resendHeldAsync({ message, gateways = null, storeId = 1 }) {
  const definition = await definitionAsync(message.definitionKey);
  if (!definition) return { ok: false, message: 'that definition is gone' };
  const { updateMessageAsync } = await import('./delivery-log.js');
  if (message.channel === 'email') {
    const queued = await queueEmailAsync({
      to: message.recipient, key: message.definitionKey, text: message.text, tokens: message.tokens ?? {}, languageId: message.languageId ?? 1, storeId,
    });
    return {
      ok: true,
      message: await updateMessageAsync(message.id, {
        status: 'Pending', queuedEmailId: queued.id, reason: 'released when the quiet period ended', heldUntilUtc: null,
      }),
    };
  }
  const sent = await sendThroughGatewayAsync({
    channel: message.channel, address: message.recipient, text: message.text, tokens: message.tokens ?? {}, key: message.definitionKey, gateways,
  });
  return {
    ok: true,
    message: await updateMessageAsync(message.id, {
      status: sent.status,
      providerMessageId: sent.providerMessageId,
      reason: sent.reason ?? 'released when the quiet period ended',
      heldUntilUtc: null,
      sentOnUtc: sent.status === 'Sent' ? new Date().toISOString() : null,
    }),
  };
}

/* ======================================================= the order triggers ============ */

/** The native templates of the order statuses (AC-TRK-005-04-02). */
export const STATUS_TEMPLATES = {
  Pending: null,
  Processing: 'OrderProcessing.CustomerNotification',
  Paid: 'OrderPaid.CustomerNotification',
  Complete: 'OrderCompleted.CustomerNotification',
  Completed: 'OrderCompleted.CustomerNotification',
  Cancelled: 'OrderCancelled.CustomerNotification',
};

const orderTokens = (order) => ({
  'Order.OrderNumber': order.orderNumber,
  'Order.OrderId': order.id,
  'Order.Total': order.orderTotal,
  'Customer.Email': order.customerEmail,
  'Customer.FullName': order.customerName ?? order.customerEmail,
});

/** AC-TRK-005-04-01: native order placement triggers OrderPlaced.CustomerNotification. */
export async function sendOrderPlacedAsync({ order, storeId = 1, gateways = null }) {
  return sendNotificationAsync({
    key: 'OrderPlaced.CustomerNotification', tokens: orderTokens(order), order, storeId, gateways, occurrence: 'placed',
  });
}

/**
 * AC-TRK-005-04-02: an order status change sends the message of that status - the native
 * template, or the definition a module registered for its own status through IC-TRK-04.
 */
export async function sendOrderStatusAsync({
  order, status, productStatusCode = null, storeId = 1, gateways = null,
}) {
  const key = productStatusCode ?? STATUS_TEMPLATES[status] ?? null;
  if (!key) {
    return {
      ok: true, queuedEmailId: 0, messages: [], noDefinitionForStatus: status,
    };
  }
  return sendNotificationAsync({
    key,
    tokens: { ...orderTokens(order), 'Order.Status': status },
    order,
    storeId,
    gateways,
    occurrence: `status:${status}`,
  });
}

/**
 * The channel adapter leg (IC-TRK-02 Send). An adapter only delivers and reports
 * Sent / Delivered / Failed / Refused (BR-CHN-010); a refusal is an answer, not an error.
 */
async function sendThroughGatewayAsync({
  channel, address, text, tokens, key, gateways,
}) {
  const gateway = gateways?.[channel] ?? null;
  if (!gateway) {
    return { status: 'Failed', providerMessageId: null, reason: `no ${channel} adapter is configured` };
  }
  try {
    const result = await gateway.sendAsync({
      to: address, event: key, text, tokens,
    });
    if (result?.status === 'refused') {
      return { status: 'Refused', providerMessageId: result.providerRef ?? null, reason: result.reason ?? 'the provider refused the message' };
    }
    return { status: 'Sent', providerMessageId: result?.providerRef ?? null, reason: null };
  } catch (err) {
    return { status: 'Failed', providerMessageId: null, reason: err.message };
  }
}

/* ============================================================ BR-TRK-021 Brevo ========= */

/** AC-TRK-005-01-06: TRK and Misc.Brevo both override IWorkflowMessageService. */
export async function checkBrevoAsync({ storeId = 1 } = {}) {
  const installed = await getSettingAsync('misc.brevo.installed', storeId, false);
  if (installed !== true) return { ok: true, refused: false };
  return {
    ok: false,
    refused: true,
    message: 'Product.TRK cannot be installed while Misc.Brevo is installed: Misc.Brevo also overrides IWorkflowMessageService.',
    rule: 'BR-TRK-021',
    conflictingPlugin: 'Misc.Brevo',
    service: 'IWorkflowMessageService',
  };
}
