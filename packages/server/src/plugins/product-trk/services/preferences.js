// PRD-TRK-006 notification preferences, and IC-TRK-06 UpdatePreference / CheckAllowed.
//
// Every module asks TRK before it sends, and the engine asks on every channel of every message.
// BR-TRK-031 the order: a mandatory category always goes on its primary channel; otherwise the
// customer's own setting, else the client default, decides, the channel must be opted in where
// it needs opt-in, SMS must not be opted out (by the customer or by a ContactOptOut record for
// the number), and the customer must not have unsubscribed from that order's updates. Channel
// order: the event-level preference, else the IAM-015 default preferred channel, else the order
// the definition lists.
// BR-TRK-032 suppression: quiet hours hold a non-urgent message; a limit suppresses a
// non-mandatory one; urgent messages ignore quiet hours.
// BR-TRK-033: a phone number with no account has its own ContactOptOut record (SM-TRK-09).

import { createHmac } from 'node:crypto';
import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { resource } from '../../../core/messages.js';

const prefRepo = () => repository('NotificationPreference');
const subscriptionRepo = () => repository('OrderSubscription');
const optOutRepo = () => repository('ContactOptOut');

/** The channels a customer must opt in to before anything is sent on them. */
export const OPT_IN_CHANNELS = ['whatsapp', 'telegram', 'push', 'voice'];
export const OPT_OUT_SOURCES = ['My account', 'keyword', 'channel opt-in', 'staff'];

const linkKey = () => process.env.TRK_LINK_KEY ?? 'prototype-tracking-link-key';
export const signToken = (value) => createHmac('sha256', linkKey()).update(String(value)).digest('hex').slice(0, 24);

/* ====================================================== the client defaults ============ */

/**
 * AC-TRK-006-01-01 and 04-02: the client's defaults. Every value is "Not stated in source", so
 * none of them has a hidden default here: an unset value means the engine applies no limit.
 */
const categorySlug = (category) => String(category ?? '').toLowerCase().replace(/\s+/g, '-');

/** A category the client marked mandatory, either in the list or by its own setting key. */
export async function categoryMandatoryAsync(category, storeId = 1) {
  if (!category) return false;
  const list = await getSettingAsync('trk.preferences.mandatorycategories', storeId, ['Account']);
  if ((list ?? []).includes(category)) return true;
  return await getSettingAsync(`trk.category.${categorySlug(category)}.mandatory`, storeId, false) === true;
}

export async function defaultsAsync(storeId = 1) {
  return {
    channels: await getSettingAsync('trk.preferences.channels', storeId, ['email', 'sms', 'inapp']),
    categoryDefaults: await getSettingAsync('trk.preferences.categorydefaults', storeId, {}),
    mandatoryCategories: await getSettingAsync('trk.preferences.mandatorycategories', storeId, ['Account']),
    quietHours: await getSettingAsync('trk.preferences.quiethours', storeId, null),
    limitPerPeriod: await getSettingAsync('trk.preferences.limitperperiod', storeId, null),
    limitPeriodHours: await getSettingAsync('trk.preferences.limitperiodhours', storeId, null),
    primaryChannel: await getSettingAsync('trk.preferences.primarychannel', storeId, 'email'),
  };
}

export async function saveDefaultsAsync({
  channels = null, categoryDefaults = null, mandatoryCategories = null, quietHours = null,
  limitPerPeriod = null, limitPeriodHours = null, primaryChannel = null, actor = null, storeId = 0,
}) {
  if (!await authorizeAsync('Tracking.Core.NotificationSettings.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Tracking.Core.NotificationSettings.CreateEditDelete' };
  }
  const before = await defaultsAsync(storeId || 1);
  const writes = {
    'trk.preferences.channels': channels,
    'trk.preferences.categorydefaults': categoryDefaults,
    'trk.preferences.mandatorycategories': mandatoryCategories,
    'trk.preferences.quiethours': quietHours,
    'trk.preferences.limitperperiod': limitPerPeriod,
    'trk.preferences.limitperiodhours': limitPeriodHours,
    'trk.preferences.primarychannel': primaryChannel,
  };
  const changed = [];
  for (const [key, value] of Object.entries(writes)) {
    if (value === null) continue;
    await saveSettingAsync(key, value, Number(storeId), 'runtime');
    changed.push(key);
  }
  await auditAsync({
    event: 'AUD-TRK-002',
    area: 'TRK',
    feature: 'PRD-TRK-006',
    entity: 'Setting',
    entityId: 'trk.preferences',
    actor: actor?.email ?? null,
    before: {
      quietHours: before.quietHours, limitPerPeriod: before.limitPerPeriod, mandatoryCategories: before.mandatoryCategories,
    },
    after: Object.fromEntries(changed.map((k) => [k, writes[k]])),
    storeId: Number(storeId),
    note: 'notification preference defaults changed',
  });
  return {
    ok: true,
    changed,
    appliesToCustomersWithoutTheirOwnValues: true,
    defaults: await defaultsAsync(storeId || 1),
  };
}

/* ====================================================== the customer's matrix ========== */

const categoriesAsync = async () => {
  // through the engine, so the definitions are there even on a store the pack loader has reset
  const { definitionsAsync } = await import('./notifications.js');
  const definitions = await definitionsAsync();
  return [...new Set(definitions.map((d) => d.category).filter(Boolean))].sort();
};

/** AC-TRK-006-01-01: category by channel, with the client defaults and the mandatory rows. */
export async function matrixAsync({ customerId, storeId = 1 }) {
  const defaults = await defaultsAsync(storeId);
  const categories = await categoriesAsync();
  const mine = await prefRepo().getAllAsync((p) => Number(p.customerId) === Number(customerId));
  const customer = await repository('Customer').getByIdAsync(customerId);
  const optOuts = customer?.phone
    ? await optOutRepo().getAllAsync((o) => o.phone === customer.phone)
    : [];
  return {
    customerId: Number(customerId),
    channels: defaults.channels,
    primaryChannel: defaults.primaryChannel,
    quietHours: (mine.find((p) => p.quietHours)?.quietHours) ?? defaults.quietHours,
    quietHoursFrom: mine.some((p) => p.quietHours) ? 'the customer' : 'the client default',
    rows: categories.map((category) => ({
      category,
      mandatory: (defaults.mandatoryCategories ?? []).includes(category),
      changeable: !(defaults.mandatoryCategories ?? []).includes(category),
      channels: Object.fromEntries(defaults.channels.map((channel) => {
        const own = mine.find((p) => p.category === category && p.channel === channel);
        const fallback = (defaults.categoryDefaults ?? {})[`${category}.${channel}`];
        const optedOutNumber = optOuts.find((o) => o.channel === channel && o.status === 'OptedOut');
        return [channel, {
          allowed: own ? own.optedOut !== true : fallback !== false,
          setByCustomer: Boolean(own),
          needsOptIn: OPT_IN_CHANNELS.includes(channel),
          optedIn: OPT_IN_CHANNELS.includes(channel) ? own?.optedIn === true : true,
          numberOptedOut: Boolean(optedOutNumber),
        }];
      })),
    })),
  };
}

/** AC-TRK-006-01-02: the shopper changes one cell of the matrix. */
export async function setPreferenceAsync({
  customerId = null, phone = null, recipient = null, channel, category = null, optedOut = null,
  optedIn = null, quietHours = null, limitPerPeriod = null, source = 'My account', actor = null,
  storeId = 1,
}) {
  if (!OPT_OUT_SOURCES.includes(source)) return { ok: false, message: `a source is one of ${OPT_OUT_SOURCES.join(', ')}` };
  if (category && await categoryMandatoryAsync(category, storeId) && optedOut === true) {
    return {
      ok: false,
      mandatory: true,
      message: `${category} is a mandatory category and cannot be switched off`,
      rule: 'BR-TRK-031',
    };
  }
  const key = recipient ?? phone ?? null;
  const existing = await prefRepo().getOneAsync((p) => Number(p.customerId ?? 0) === Number(customerId ?? 0)
    && (p.recipient ?? null) === key
    && p.channel === channel && (p.category ?? null) === (category ?? null));
  const row = {
    customerId: customerId === null ? null : Number(customerId),
    phone,
    recipient: key,
    channel,
    category,
    optedOut: optedOut === null ? existing?.optedOut ?? false : optedOut === true,
    optedIn: optedIn === null ? existing?.optedIn ?? false : optedIn === true,
    // an empty value clears it, the way an emptied form field does
    quietHours: quietHours === null ? existing?.quietHours ?? null : (quietHours === '' ? null : quietHours),
    limitPerPeriod: limitPerPeriod === null ? existing?.limitPerPeriod ?? null : Number(limitPerPeriod),
    source,
    updatedOnUtc: new Date().toISOString(),
  };
  const saved = existing ? await prefRepo().updateAsync({ ...existing, ...row }) : await prefRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-TRK-005',
    area: 'TRK',
    feature: 'PRD-TRK-006',
    entity: 'NotificationPreference',
    entityId: saved.id,
    actor: actor?.email ?? source,
    before: existing ? { optedOut: existing.optedOut, optedIn: existing.optedIn } : null,
    after: {
      channel, category, optedOut: saved.optedOut, optedIn: saved.optedIn, source,
    },
    storeId,
    note: 'notification preference changed',
  });
  return { ok: true, preference: saved };
}

export const preferencesAsync = (customerId = null) => prefRepo()
  .getAllAsync((p) => customerId === null || Number(p.customerId) === Number(customerId));

/* ====================================================== IC-TRK-06 UpdatePreference ===== */

/**
 * The one way a preference is written from outside My account: a CHN-012 keyword, a channel
 * opt-in, or staff recording a request. A number with no account gets a ContactOptOut record and
 * no customer record is created (BR-TRK-033, SM-TRK-09).
 */
export async function updatePreferenceAsync({
  customerId = null, phone = null, channel, category = null, allowed, source = 'keyword',
  allCategories = false, actor = null, storeId = 1,
}) {
  if (!channel) return { ok: false, message: 'a channel is required' };
  if (phone && !String(phone).startsWith('+')) {
    return { ok: false, message: 'a phone number is given in international format (BR-IAM-010)' };
  }
  const customer = customerId
    ? await repository('Customer').getByIdAsync(customerId)
    : (phone ? await repository('Customer').getOneAsync((c) => c.phone === phone) : null);

  // a number with no account: the opt-out lives on the number itself
  if (!customer) {
    if (!phone) return { ok: false, message: 'no customer and no phone number' };
    const existing = await optOutRepo().getOneAsync((o) => o.phone === phone && o.channel === channel);
    const status = allowed === true ? 'OptedIn' : 'OptedOut';
    const saved = existing
      ? await optOutRepo().updateAsync({
        ...existing, status, source, updatedOnUtc: new Date().toISOString(),
      })
      : await optOutRepo().insertAsync({
        phone, channel, status, source, updatedOnUtc: new Date().toISOString(),
      });
    await auditAsync({
      event: 'AUD-TRK-005',
      area: 'TRK',
      feature: 'PRD-TRK-006',
      entity: 'ContactOptOut',
      entityId: saved.id,
      actor: actor?.email ?? source,
      before: existing ? { status: existing.status } : null,
      after: { phone, channel, status, source },
      storeId,
      note: 'contact opt-out changed',
    });
    return {
      ok: true,
      contactOptOut: saved,
      status,
      customerCreated: false,
      rule: 'BR-TRK-033',
    };
  }

  // a customer: the preference, and the number's record follows it (AC-TRK-006-01-09)
  const settings = await defaultsAsync(storeId);
  const mandatoryCategories = settings.mandatoryCategories ?? [];
  const categories = allCategories
    ? (await categoriesAsync()).filter((c) => !mandatoryCategories.includes(c))
    : [category];
  const written = [];
  for (const one of categories) {
    const result = await setPreferenceAsync({
      customerId: customer.id,
      channel,
      category: one,
      optedOut: allowed === false,
      optedIn: allowed === true ? true : null,
      source,
      actor,
      storeId,
    });
    if (result.ok) written.push(one);
  }
  let contactOptOut = null;
  if (customer.phone) {
    const existing = await optOutRepo().getOneAsync((o) => o.phone === customer.phone && o.channel === channel);
    if (existing || allowed === false) {
      const status = allowed === true ? 'OptedIn' : 'OptedOut';
      contactOptOut = existing
        ? await optOutRepo().updateAsync({
          ...existing, status, source, updatedOnUtc: new Date().toISOString(),
        })
        : await optOutRepo().insertAsync({
          phone: customer.phone, channel, status, source, updatedOnUtc: new Date().toISOString(),
        });
      await auditAsync({
        event: 'AUD-TRK-005',
        area: 'TRK',
        feature: 'PRD-TRK-006',
        entity: 'ContactOptOut',
        entityId: contactOptOut.id,
        actor: actor?.email ?? source,
        before: existing ? { status: existing.status } : null,
        after: { phone: customer.phone, channel, status, source },
        storeId,
        note: 'contact opt-out changed with the customer preference',
      });
    }
  }
  return {
    ok: true,
    customerId: customer.id,
    categories: written,
    allCategories,
    contactOptOut,
    source,
  };
}

export const contactOptOutsAsync = () => optOutRepo().getAllAsync();

export async function contactOptOutStateAsync({ phone, channel }) {
  const row = await optOutRepo().getOneAsync((o) => o.phone === phone && o.channel === channel);
  return { phone, channel, status: row?.status ?? null, optedOut: row?.status === 'OptedOut' };
}

/* ====================================================== per-order subscription ========= */

/** AC-TRK-006-03-01 to 03-03: unsubscribe from one order's updates, with a one-click link. */
export async function setOrderSubscriptionAsync({
  orderId, customerId = null, subscribed, actor = null, storeId = 1,
}) {
  const order = await repository('Order').getByIdAsync(orderId);
  if (!order) return { ok: false, message: 'no such order' };
  const existing = await subscriptionRepo().getOneAsync((s) => Number(s.orderId) === Number(orderId));
  const saved = existing
    ? await subscriptionRepo().updateAsync({ ...existing, subscribed: subscribed === true, updatedOnUtc: new Date().toISOString() })
    : await subscriptionRepo().insertAsync({
      orderId: Number(orderId),
      customerId: customerId === null ? order.customerId ?? null : Number(customerId),
      subscribed: subscribed === true,
      updatedOnUtc: new Date().toISOString(),
    });
  await auditAsync({
    event: 'AUD-TRK-005',
    area: 'TRK',
    feature: 'PRD-TRK-006',
    entity: 'OrderSubscription',
    entityId: saved.id,
    actor: actor?.email ?? 'one-click link',
    before: existing ? { subscribed: existing.subscribed } : null,
    after: { orderId: Number(orderId), subscribed: saved.subscribed },
    storeId,
    note: subscribed ? 'subscribed to order updates' : 'unsubscribed from order updates',
  });
  return {
    ok: true,
    subscription: saved,
    messageKey: subscribed ? 'Trk.Subscribed' : 'Trk.Unsubscribed',
    message: resource(subscribed ? 'Trk.Subscribed' : 'Trk.Unsubscribed'),
    mandatoryStillSent: true,
  };
}

export const unsubscribeLinkFor = (orderId) => `/notifications/unsubscribe/${orderId}?t=${signToken(`order:${orderId}`)}`;

/** The one-click link works without signing in; the signature is what authorises it. */
export async function oneClickUnsubscribeAsync({ orderId, token, storeId = 1 }) {
  if (token !== signToken(`order:${orderId}`)) {
    return { ok: false, message: 'that link is not valid', signatureValid: false };
  }
  const result = await setOrderSubscriptionAsync({
    orderId, subscribed: false, actor: null, storeId,
  });
  return { ...result, signatureValid: true, signInRequired: false };
}

export async function orderSubscriptionAsync(orderId) {
  const row = await subscriptionRepo().getOneAsync((s) => Number(s.orderId) === Number(orderId));
  return { orderId: Number(orderId), subscribed: row ? row.subscribed === true : true, row };
}

/* ====================================================== IC-TRK-06 CheckAllowed ========= */

const inQuietHours = (quietHours, at) => {
  if (!quietHours) return false;
  const [from, to] = String(quietHours).split('-').map((x) => Number(x.trim().split(':')[0]));
  if (Number.isNaN(from) || Number.isNaN(to)) return false;
  const hour = at.getUTCHours();
  return from <= to ? (hour >= from && hour < to) : (hour >= from || hour < to);
};

export const quietHoursEndFor = (quietHours, at) => {
  const [, to] = String(quietHours).split('-').map((x) => Number(x.trim().split(':')[0]));
  const end = new Date(at);
  end.setUTCHours(to, 0, 0, 0);
  if (end <= at) end.setUTCDate(end.getUTCDate() + 1);
  return end.toISOString();
};

/**
 * CheckAllowed. Answers Allowed, or Blocked with the reason, for one recipient, channel and
 * category. Quiet hours and limits are the engine's own step and do not apply to the senders
 * outside it (BR-TRK-026), which is why they are reported separately.
 */
export async function checkAllowedAsync({
  customerId = null, phone = null, recipient = null, channel, category = null, sender = null,
  mandatory = null, orderId = null, storeId = 1, at = null,
}) {
  const now = at ? new Date(at) : new Date();
  const defaults = await defaultsAsync(storeId);
  const isMandatory = mandatory === true || await categoryMandatoryAsync(category, storeId);

  const customer = customerId
    ? await repository('Customer').getByIdAsync(customerId)
    : (phone ? await repository('Customer').getOneAsync((c) => c.phone === phone)
      : (recipient ? await repository('Customer').getOneAsync((c) => c.email === recipient || c.phone === recipient) : null));
  const number = phone ?? customer?.phone ?? (String(recipient ?? '').startsWith('+') ? recipient : null);

  const blocked = (reason, extra = {}) => ({
    allowed: false, blocked: true, reason, channel, category, sender, mandatory: isMandatory, ...extra,
  });

  // BR-TRK-031: a mandatory category always goes on its primary channel
  if (isMandatory && channel === (defaults.primaryChannel ?? 'email')) {
    return {
      allowed: true, mandatory: true, channel, category, sender, reason: 'a mandatory category on its primary channel', rule: 'BR-TRK-031',
    };
  }

  if (orderId !== null) {
    const subscription = await orderSubscriptionAsync(orderId);
    if (!subscription.subscribed && !isMandatory) return blocked('the customer unsubscribed from this order');
  }

  if (number && ['sms', 'whatsapp', 'voice'].includes(channel)) {
    const state = await contactOptOutStateAsync({ phone: number, channel });
    if (state.optedOut && !isMandatory) return blocked('opted out', { contactOptOut: true, rule: 'BR-TRK-033' });
  }

  // a number or address with no account may have a row of its own (the senders outside the
  // engine pass the recipient, not a customer)
  const bare = recipient ?? phone ?? null;
  if (bare) {
    const own = await prefRepo().getOneAsync((p) => (p.recipient ?? null) === bare
      && p.channel === channel && (p.category ?? null) === (category ?? null));
    if (own?.optedOut === true && !isMandatory) return blocked('the recipient opted out of this category on this channel');
  }

  if (customer) {
    const own = await prefRepo().getOneAsync((p) => Number(p.customerId) === Number(customer.id)
      && p.channel === channel && (p.category ?? null) === (category ?? null));
    if (own?.optedOut === true && !isMandatory) return blocked('the customer turned this channel off for this category');
    if (OPT_IN_CHANNELS.includes(channel) && own?.optedIn !== true) {
      return blocked('not opted in', { needsOptIn: true });
    }
    if (!own) {
      const fallback = (defaults.categoryDefaults ?? {})[`${category}.${channel}`];
      if (fallback === false && !isMandatory) return blocked('the client default turns this channel off for this category');
      if (OPT_IN_CHANNELS.includes(channel)) return blocked('not opted in', { needsOptIn: true });
    }
  } else if (OPT_IN_CHANNELS.includes(channel)) {
    return blocked('not opted in', { needsOptIn: true });
  }

  // BR-TRK-032, reported for the engine only
  const quietHours = customer
    ? (await prefRepo().getAllAsync((p) => Number(p.customerId) === Number(customer.id) && p.quietHours))[0]?.quietHours ?? defaults.quietHours
    : defaults.quietHours;
  const limit = customer
    ? (await prefRepo().getAllAsync((p) => Number(p.customerId) === Number(customer.id) && p.limitPerPeriod))[0]?.limitPerPeriod ?? defaults.limitPerPeriod
    : defaults.limitPerPeriod;
  let overLimit = false;
  if (limit !== null && limit !== undefined && !isMandatory) {
    const hours = Number(defaults.limitPeriodHours ?? 24);
    const since = new Date(now.getTime() - hours * 3600000).toISOString();
    const sent = await repository('NotificationMessage').getAllAsync((m) => m.channel === channel
      && m.createdOnUtc >= since
      && ['Sent', 'Delivered', 'Pending'].includes(m.status)
      && (customer ? Number(m.customerId) === Number(customer.id) : m.recipient === recipient));
    overLimit = sent.length >= Number(limit);
  }

  return {
    allowed: true,
    channel,
    category,
    sender,
    mandatory: isMandatory,
    quietHours: quietHours ?? null,
    insideQuietHours: inQuietHours(quietHours, now),
    quietHoursEnd: quietHours && inQuietHours(quietHours, now) ? quietHoursEndFor(quietHours, now) : null,
    overLimit,
    limit: limit ?? null,
    rule: 'BR-TRK-031',
  };
}

/**
 * AC-TRK-006-01-10: a Blocked answer to a sender outside the engine is logged in the
 * notification log as Suppressed, with the sender module and the reason.
 */
export async function checkAllowedForSenderAsync(request) {
  const verdict = await checkAllowedAsync(request);
  if (verdict.allowed !== true) {
    const { logMessageAsync } = await import('./delivery-log.js');
    await logMessageAsync({
      definition: null,
      key: request.category ? `${request.sender ?? 'external'}:${request.category}` : (request.sender ?? 'external'),
      channel: request.channel,
      recipient: { email: request.recipient, phone: request.phone },
      address: request.recipient ?? request.phone ?? null,
      status: 'Suppressed',
      reason: verdict.reason,
      sender: request.sender,
      storeId: request.storeId ?? 1,
    });
  }
  return { ...verdict, logged: verdict.allowed !== true, outsideTheEngine: true, rule: 'BR-TRK-026' };
}

/** The channel order BR-TRK-031 states, for the engine to follow. */
export async function channelOrderAsync({
  customerId = null, category = null, definitionChannels = [], storeId = 1,
}) {
  const order = [...definitionChannels];
  if (!customerId) return { channels: order, from: 'the definition order' };
  const own = await prefRepo().getAllAsync((p) => Number(p.customerId) === Number(customerId)
    && (p.category ?? null) === (category ?? null) && p.preferredChannel);
  const eventLevel = own[0]?.preferredChannel ?? null;
  const preference = await repository('CustomerPreference').getOneAsync((p) => Number(p.customerId) === Number(customerId));
  const first = eventLevel ?? preference?.preferredChannel ?? null;
  if (!first || !order.includes(first)) {
    return { channels: order, from: 'the definition order', preferredChannel: first ?? null };
  }
  return {
    channels: [first, ...order.filter((c) => c !== first)],
    from: eventLevel ? 'the event-level preference' : 'the default preferred channel',
    preferredChannel: first,
  };
}

/** AC-TRK-006-02-01: a held message is released when the quiet period ends, and re-checked. */
export async function releaseHeldAsync({ now = null, gateways = null, storeId = 1 } = {}) {
  const at = now ? new Date(now) : new Date();
  const held = await repository('NotificationMessage').getAllAsync((m) => m.status === 'Held');
  const out = { released: 0, stillHeld: 0, suppressed: 0 };
  for (const message of held) {
    if (message.heldUntilUtc && new Date(message.heldUntilUtc) > at) { out.stillHeld += 1; continue; }
    const verdict = await checkAllowedAsync({
      customerId: message.customerId,
      recipient: message.recipient,
      channel: message.channel,
      category: message.category,
      orderId: message.orderId,
      storeId,
      at: at.toISOString(),
    });
    const { updateMessageAsync } = await import('./delivery-log.js');
    if (verdict.allowed !== true) {
      await updateMessageAsync(message.id, { status: 'Suppressed', reason: verdict.reason });
      out.suppressed += 1;
      continue;
    }
    const { resendHeldAsync } = await import('./notifications.js');
    await resendHeldAsync({ message, gateways, storeId });
    out.released += 1;
  }
  return { ok: true, ...out, rule: 'BR-TRK-032' };
}
