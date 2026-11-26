// PRD-TRK-006 notification preferences (16 ACs). One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import {
  sendNotificationAsync, saveDefinitionAsync, setChannelContentAsync,
} from '../../packages/server/src/plugins/product-trk/services/notifications.js';
import {
  checkAllowedAsync, checkAllowedForSenderAsync, updatePreferenceAsync, setPreferenceAsync,
  releaseHeldAsync, unsubscribeLinkFor, oneClickUnsubscribeAsync, matrixAsync,
} from '../../packages/server/src/plugins/product-trk/services/preferences.js';
import { messagesAsync } from '../../packages/server/src/plugins/product-trk/services/delivery-log.js';
import { messageGateways } from '../../packages/mocks/src/index.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const G = messageGateways;
let n = 0;

async function shopperAsync({ phone = null, languageId = 1, email = null } = {}) {
  n += 1;
  return createCustomerAsync({
    email: email ?? `pref${n}@example.com`,
    firstName: 'Pref',
    lastName: 'Shopper',
    roles: ['Registered'],
    phone: phone ?? `+2659930000${String(n).padStart(2, '0')}`,
    languageId,
  });
}

async function orderAsync(customer, number) {
  return repository('Order').insertAsync({
    orderNumber: number,
    customerId: customer.id,
    customerEmail: customer.email,
    orderStatus: 'Processing',
    orderTotal: 9000,
  });
}

const rows = (sent, channel) => (sent.messages ?? []).filter((m) => m.channel === channel);

/** A definition in the Shipping updates category, on e-mail and SMS. */
async function shippingDefinitionAsync() {
  await saveDefinitionAsync({
    key: 'ShipmentSent.CustomerNotification',
    channels: ['email', 'sms'],
    fallback: false,
    category: 'Shipping updates',
    actor: await api.actorAsync(SESSIONS.admin),
  });
  await setChannelContentAsync({
    key: 'ShipmentSent.CustomerNotification', channel: 'sms', languageId: 1, text: 'Order %Order.OrderNumber% is on its way.', system: true,
  });
}

describe('PRD-TRK-006 the matrix and the channels', () => {
  test('AC-TRK-006-01-01', async () => {
    // "a matrix of category x enabled channel is shown with the client defaults; mandatory
    //  categories are shown as not changeable"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    const matrix = await api.get(`/api/notification-preferences/matrix?customerId=${customer.id}`, SESSIONS.buyer);
    assert.deepEqual(matrix.channels, ['email', 'sms', 'inapp'], 'the channels the client enabled');
    const shipping = matrix.rows.find((r) => r.category === 'Shipping updates');
    assert.ok(shipping, 'a row per category');
    assert.equal(shipping.mandatory, false);
    assert.equal(shipping.changeable, true);
    assert.equal(shipping.channels.email.allowed, true, 'with the client default');
    assert.equal(shipping.channels.email.setByCustomer, false);

    const account = matrix.rows.find((r) => r.category === 'Account');
    assert.equal(account.mandatory, true, 'a mandatory category');
    assert.equal(account.changeable, false, 'is not changeable');

    assert.equal(matrix.rows.find((r) => r.category === 'Delivery').channels.inapp.needsOptIn, false);
  });

  test('AC-TRK-006-01-02', async () => {
    // "no SMS is sent to them; the message is logged Suppressed (preference); other channels
    //  follow their settings; the change is audited (AUD-TRK-005)"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    const order = await orderAsync(customer, 'PREF-OFF-1');

    const saved = await api.post('/api/notification-preferences/matrix', {
      customerId: customer.id, channel: 'sms', category: 'Shipping updates', optedOut: true,
    }, SESSIONS.buyer);
    assert.equal(saved.ok, true);

    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'pref-off', gateways: G,
    });
    const sms = rows(sent, 'sms')[0];
    assert.equal(sms.status, 'Suppressed');
    assert.match(sms.reason, /turned this channel off/);
    assert.equal(sms.rule, 'BR-TRK-031');
    assert.ok(rows(sent, 'email')[0].queuedEmailId, 'the other channel follows its own setting');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-005', entity: 'NotificationPreference' });
    assert.ok(trail.some((e) => e.after?.channel === 'sms' && e.after?.optedOut === true), 'the change is audited');
  });

  test('AC-TRK-006-01-03', async () => {
    // "mandatory messages still go on their primary channel (BR-TRK-031)"
    const customer = await shopperAsync();
    await saveDefinitionAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification', channels: ['email', 'sms'], category: 'Account', mandatory: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const refused = await setPreferenceAsync({
      customerId: customer.id, channel: 'email', category: 'Account', optedOut: true,
    });
    assert.equal(refused.ok, false, 'a mandatory category cannot be switched off');
    assert.equal(refused.mandatory, true);
    assert.equal(refused.rule, 'BR-TRK-031');

    // even with the channel off for everything else, the mandatory message goes
    await setPreferenceAsync({ customerId: customer.id, channel: 'email', category: 'Shipping updates', optedOut: true });
    const sent = await sendNotificationAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification',
      tokens: { 'Customer.FullName': 'Pref Shopper' },
      recipients: [{ customer, email: customer.email, phone: customer.phone, languageId: 1 }],
      occurrence: 'mandatory-1',
      gateways: G,
    });
    const email = rows(sent, 'email')[0];
    assert.ok(email.queuedEmailId, 'the mandatory message goes on the primary channel');
    assert.notEqual(email.status, 'Suppressed');
  });

  test('AC-TRK-006-01-04', async () => {
    // "the channel is skipped for that customer and the next channel is used; opting in ... is
    //  stored in TRK-006 and audited (AUD-TRK-005)"
    const customer = await shopperAsync();
    await saveSettingAsync('trk.channel.whatsapp.enabled', true, 0);
    await saveDefinitionAsync({
      key: 'ShipmentDelivered.CustomerNotification', channels: ['whatsapp', 'email'], fallback: false, category: 'Delivery', actor: await api.actorAsync(SESSIONS.admin),
    });
    await setChannelContentAsync({
      key: 'ShipmentDelivered.CustomerNotification', channel: 'whatsapp', languageId: 1, text: 'Order %Order.OrderNumber% was delivered.', system: true,
    });
    const order = await orderAsync(customer, 'PREF-OPTIN-1');

    const before = await sendNotificationAsync({
      key: 'ShipmentDelivered.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'optin-before', gateways: G,
    });
    const whatsapp = rows(before, 'whatsapp')[0];
    assert.equal(whatsapp.status, 'Suppressed');
    assert.match(whatsapp.reason, /not opted in/);
    assert.ok(rows(before, 'email')[0].queuedEmailId, 'the next channel is used');

    // the customer opts in, from My account or from the channel itself
    const optIn = await api.post('/api/notification-preferences/update', {
      customerId: customer.id, channel: 'whatsapp', category: 'Delivery', allowed: true, source: 'channel opt-in',
    }, SESSIONS.admin);
    assert.equal(optIn.ok, true);

    const after = await sendNotificationAsync({
      key: 'ShipmentDelivered.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'optin-after', gateways: G,
    });
    assert.equal(rows(after, 'whatsapp')[0].status, 'Sent', 'and the channel is used once they opt in');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-005' });
    assert.ok(trail.some((e) => e.after?.source === 'channel opt-in'), 'the opt-in is audited');
  });

  test('AC-TRK-006-01-05', async () => {
    // "SMS is turned off for every non-mandatory category for that customer and the change is
    //  audited; mandatory messages still go by SMS only if SMS is their primary channel"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    const keyword = await updatePreferenceAsync({
      phone: customer.phone, channel: 'sms', allowed: false, allCategories: true, source: 'keyword',
    });
    assert.equal(keyword.ok, true);
    assert.equal(keyword.customerId, customer.id);
    assert.ok(keyword.categories.includes('Shipping updates'), 'every non-mandatory category');
    assert.equal(keyword.categories.includes('Account'), false, 'but not a mandatory one');

    const order = await orderAsync(customer, 'PREF-KEYWORD-1');
    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'keyword-1', gateways: G,
    });
    assert.equal(rows(sent, 'sms')[0].status, 'Suppressed');

    // a mandatory message by SMS: only where SMS is the primary channel
    await saveDefinitionAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification', channels: ['sms'], category: 'Account', mandatory: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const onEmailPrimary = await checkAllowedAsync({
      customerId: customer.id, channel: 'sms', category: 'Account', mandatory: true,
    });
    assert.equal(onEmailPrimary.allowed, true, 'a mandatory category is allowed');
    await saveSettingAsync('trk.preferences.primarychannel', 'sms', 0);
    const onSmsPrimary = await checkAllowedAsync({
      customerId: customer.id, channel: 'sms', category: 'Account', mandatory: true,
    });
    assert.equal(onSmsPrimary.reason, 'a mandatory category on its primary channel');
    await saveSettingAsync('trk.preferences.primarychannel', 'email', 0);

    const trail = await auditTrailAsync({ event: 'AUD-TRK-005' });
    assert.ok(trail.some((e) => e.after?.source === 'keyword'), 'the keyword change is audited');
  });

  test('AC-TRK-006-01-06', async () => {
    // "the default preferred channel is used first, then the definition order (BR-TRK-031)"
    const customer = await shopperAsync();
    await saveDefinitionAsync({
      key: 'OrderProcessing.CustomerNotification', channels: ['email', 'sms'], fallback: false, category: 'Orders', actor: await api.actorAsync(SESSIONS.admin),
    });
    await setChannelContentAsync({
      key: 'OrderProcessing.CustomerNotification', channel: 'sms', languageId: 1, text: 'Order %Order.OrderNumber% is being prepared.', system: true,
    });
    await repository('CustomerPreference').insertAsync({ customerId: customer.id, preferredChannel: 'sms' });
    const order = await orderAsync(customer, 'PREF-CHANNEL-1');

    const sent = await sendNotificationAsync({
      key: 'OrderProcessing.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'channel-order', gateways: G,
    });
    assert.equal(sent.messages[0].channel, 'sms', 'the default preferred channel is used first');
    assert.equal(sent.messages[1].channel, 'email', 'then the definition order');
  });

  test('AC-TRK-006-01-07', async () => {
    // "a ContactOptOut record for that number and channel becomes OptedOut (SM-TRK-09) and is
    //  audited; no customer record is created (BR-TRK-033)"
    const stranger = '+265993999111';
    const customersBefore = (await repository('Customer').getAllAsync()).length;
    const refusedFormat = await updatePreferenceAsync({
      phone: '0993999111', channel: 'sms', allowed: false, source: 'keyword',
    });
    assert.equal(refusedFormat.ok, false, 'the number is given in international format');

    const result = await updatePreferenceAsync({
      phone: stranger, channel: 'sms', allowed: false, source: 'keyword',
    });
    assert.equal(result.ok, true);
    assert.equal(result.status, 'OptedOut');
    assert.equal(result.customerCreated, false);
    assert.equal(result.rule, 'BR-TRK-033');
    assert.equal((await repository('Customer').getAllAsync()).length, customersBefore, 'no customer record is created');

    const state = await api.get(`/api/notification-preferences/opt-outs/state?phone=${encodeURIComponent(stranger)}&channel=sms`, SESSIONS.admin);
    assert.equal(state.status, 'OptedOut');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-005', entity: 'ContactOptOut' });
    assert.ok(trail.some((e) => e.after?.phone === stranger), 'the record is audited');
  });

  test('AC-TRK-006-01-08', async () => {
    // "the SMS is not sent; the message is logged Suppressed with reason opted out and the next
    //  channel of the definition is tried"
    const customer = await shopperAsync({ phone: '+265993999222' });
    await shippingDefinitionAsync();
    await updatePreferenceAsync({ phone: '+265993999222', channel: 'sms', allowed: false, source: 'keyword' });
    const order = await orderAsync(customer, 'PREF-OPTOUT-1');

    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'optout-1', gateways: G,
    });
    const sms = rows(sent, 'sms')[0];
    assert.equal(sms.status, 'Suppressed');
    assert.equal(sms.reason, 'opted out');
    assert.ok(rows(sent, 'email')[0].queuedEmailId, 'the next channel of the definition is tried');

    // the same for a number with no account at all
    const guest = await checkAllowedAsync({ phone: '+265993999111', channel: 'sms', category: 'Shipping updates' });
    assert.equal(guest.allowed, false);
    assert.equal(guest.contactOptOut, true);
    assert.equal(guest.rule, 'BR-TRK-033');
  });

  test('AC-TRK-006-01-09', async () => {
    // "the customer preference is set on and the ContactOptOut record becomes OptedIn with the
    //  source; both changes are audited"
    const customer = await shopperAsync({ phone: '+265993999333' });
    await updatePreferenceAsync({ phone: customer.phone, channel: 'sms', allowed: false, source: 'keyword' });
    assert.equal((await api.get(`/api/notification-preferences/opt-outs/state?phone=${encodeURIComponent(customer.phone)}&channel=sms`, SESSIONS.admin)).status, 'OptedOut');

    const optIn = await updatePreferenceAsync({
      customerId: customer.id, channel: 'sms', category: 'Shipping updates', allowed: true, source: 'My account',
    });
    assert.equal(optIn.ok, true);
    assert.equal(optIn.contactOptOut.status, 'OptedIn', 'the record becomes OptedIn');
    assert.equal(optIn.contactOptOut.source, 'My account', 'with the source');

    const allowed = await checkAllowedAsync({ customerId: customer.id, channel: 'sms', category: 'Shipping updates' });
    assert.equal(allowed.allowed, true, 'and SMS resumes');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-005' });
    assert.ok(trail.some((e) => e.entity === 'ContactOptOut' && e.after?.status === 'OptedIn'), 'the record change is audited');
    assert.ok(trail.some((e) => e.entity === 'NotificationPreference' && e.after?.source === 'My account'), 'and so is the preference');
  });

  test('AC-TRK-006-01-10', async () => {
    // "TRK answers Allowed, or Blocked with the reason ...; the sender sends nothing when
    //  Blocked, and a Blocked answer is logged in the notification log as Suppressed with the
    //  sender module and reason"
    const customer = await shopperAsync({ phone: '+265993999444' });
    const allowed = await checkAllowedForSenderAsync({
      customerId: customer.id, channel: 'sms', category: 'Conversation replies', sender: 'Product.CRM',
    });
    assert.equal(allowed.allowed, true);
    assert.equal(allowed.logged, false, 'an allowed answer is not logged as a message');
    assert.equal(allowed.rule, 'BR-TRK-026');

    await setPreferenceAsync({
      customerId: customer.id, channel: 'sms', category: 'Conversation replies', optedOut: true,
    });
    const blocked = await checkAllowedForSenderAsync({
      customerId: customer.id, recipient: customer.phone, channel: 'sms', category: 'Conversation replies', sender: 'Product.CRM',
    });
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.reason, 'with the reason');
    assert.equal(blocked.logged, true);

    const logged = (await messagesAsync({ status: 'Suppressed' })).find((m) => m.sender === 'Product.CRM');
    assert.ok(logged, 'the blocked answer is in the notification log');
    assert.equal(logged.channel, 'sms');
    assert.ok(logged.reason);

    // quiet hours and limits do not apply to a sender outside the engine
    await saveSettingAsync('trk.preferences.quiethours', '22-06', 0);
    const atNight = await checkAllowedAsync({
      customerId: customer.id, channel: 'email', category: 'Security codes', at: '2026-03-20T23:00:00.000Z',
    });
    assert.equal(atNight.allowed, true, 'the answer is still Allowed inside quiet hours');
    assert.equal(atNight.insideQuietHours, true, 'the engine is told, and decides for itself');
    await saveSettingAsync('trk.preferences.quiethours', null, 0);
  });
});

describe('PRD-TRK-006 quiet hours, limits and per-order updates', () => {
  test('AC-TRK-006-02-01', async () => {
    // "it is Held and released when the quiet period ends; urgent messages are sent at once"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    // the shopper's own quiet hours, set so that this moment falls inside them
    const hour = new Date().getUTCHours();
    const quietHours = `${hour}-${(hour + 3) % 24}`;
    await setPreferenceAsync({
      customerId: customer.id, channel: 'sms', category: null, quietHours,
    });
    const order = await orderAsync(customer, 'PREF-QUIET-1');

    const second = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification',
      tokens: { 'Order.OrderNumber': order.orderNumber },
      order,
      occurrence: 'quiet-2',
      gateways: G,
    });
    const heldRow = (second.messages ?? []).find((m) => m.status === 'Held');
    assert.ok(heldRow, 'a non-urgent message inside quiet hours is Held');
    assert.match(heldRow.reason, /quiet hours/);
    assert.ok(heldRow.heldUntilUtc, 'until the quiet period ends');
    assert.equal(heldRow.rule, 'BR-TRK-032');

    const tooEarly = await releaseHeldAsync({ now: new Date().toISOString(), gateways: G });
    assert.equal(tooEarly.released, 0, 'nothing is released before the period ends');

    const released = await releaseHeldAsync({ now: new Date(Date.now() + 4 * 3600000).toISOString(), gateways: G });
    assert.ok(released.released >= 1, 'and it goes out when the period ends');
    await setPreferenceAsync({
      customerId: customer.id, channel: 'sms', category: null, quietHours: '',
    });

    // an urgent message ignores quiet hours
    await saveDefinitionAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification', channels: ['email'], category: 'Account', mandatory: true, urgent: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const urgent = await sendNotificationAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification',
      tokens: { 'Customer.FullName': 'Pref Shopper' },
      recipients: [{ customer, email: customer.email, phone: customer.phone, languageId: 1 }],
      occurrence: 'urgent-1',
      gateways: G,
    });
    assert.notEqual(urgent.messages[0].status, 'Held', 'an urgent message is sent at once');
    await saveSettingAsync('trk.preferences.quiethours', null, 0);
  });

  test('AC-TRK-006-03-01', async () => {
    // "tracking-update messages for that order are no longer sent to them (Trk.Unsubscribed);
    //  mandatory messages still go"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    const order = await orderAsync(customer, 'PREF-UNSUB-1');

    const off = await api.post(`/api/notification-preferences/orders/${order.id}`, { subscribed: false }, SESSIONS.buyer);
    assert.equal(off.ok, true);
    assert.equal(off.messageKey, 'Trk.Unsubscribed');
    assert.equal(off.message, 'You will no longer receive updates for this order.');

    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'unsub-1', gateways: G,
    });
    for (const message of sent.messages) {
      assert.equal(message.status, 'Suppressed', `${message.channel} is not sent`);
      assert.match(message.reason, /unsubscribed from this order/);
    }

    // a mandatory message still goes
    await saveDefinitionAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification', channels: ['email'], category: 'Account', mandatory: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const mandatory = await sendNotificationAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification',
      tokens: {},
      order,
      recipients: [{ customer, email: customer.email, languageId: 1 }],
      occurrence: 'unsub-mandatory',
      gateways: G,
    });
    assert.ok(mandatory.messages[0].queuedEmailId, 'a mandatory message still goes');
  });

  test('AC-TRK-006-03-02', async () => {
    // "updates resume for later events (message Trk.Subscribed)"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    const order = await orderAsync(customer, 'PREF-RESUB-1');
    await api.post(`/api/notification-preferences/orders/${order.id}`, { subscribed: false }, SESSIONS.buyer);

    const on = await api.post(`/api/notification-preferences/orders/${order.id}`, { subscribed: true }, SESSIONS.buyer);
    assert.equal(on.messageKey, 'Trk.Subscribed');
    assert.equal(on.message, 'You will receive updates for this order.');
    assert.equal((await api.get(`/api/notification-preferences/orders/${order.id}`, SESSIONS.buyer)).subscribed, true);

    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'resub-1', gateways: G,
    });
    assert.ok(rows(sent, 'email')[0].queuedEmailId, 'updates resume for later events');
  });

  test('AC-TRK-006-03-03', async () => {
    // "it contains a signed one-click link to unsubscribe from that order's updates, usable
    //  without signing in"
    const customer = await shopperAsync();
    const order = await orderAsync(customer, 'PREF-LINK-1');
    const link = await api.get(`/api/notification-preferences/orders/${order.id}/link`, SESSIONS.buyer);
    assert.match(link.link, new RegExp(`/notifications/unsubscribe/${order.id}\\?t=[0-9a-f]{24}`), 'a signed link');
    const token = link.link.split('t=')[1];

    const wrong = await oneClickUnsubscribeAsync({ orderId: order.id, token: 'not-the-signature' });
    assert.equal(wrong.ok, false);
    assert.equal(wrong.signatureValid, false);

    // no session: the signature is what authorises it
    const used = await api.post(`/api/notification-preferences/unsubscribe/${order.id}`, { token }, 'nobody-signed-in');
    assert.equal(used.ok, true);
    assert.equal(used.signatureValid, true);
    assert.equal(used.signInRequired, false);
    assert.equal(used.messageKey, 'Trk.Unsubscribed');
    assert.equal((await api.get(`/api/notification-preferences/orders/${order.id}`, SESSIONS.buyer)).subscribed, false);
  });

  test('AC-TRK-006-04-01', async () => {
    // "further non-mandatory messages in the period are Suppressed (limit) and logged"
    const customer = await shopperAsync();
    await shippingDefinitionAsync();
    await saveSettingAsync('trk.preferences.limitperperiod', 2, 0);
    await saveSettingAsync('trk.preferences.limitperiodhours', 24, 0);
    const order = await orderAsync(customer, 'PREF-LIMIT-1');

    const outcomes = [];
    for (let i = 1; i <= 4; i += 1) {
      const sent = await sendNotificationAsync({
        key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: `limit-${i}`, gateways: G,
      });
      outcomes.push(rows(sent, 'email')[0]);
    }
    assert.equal(outcomes[0].status, 'Pending', 'the first is sent');
    assert.equal(outcomes[1].status, 'Pending', 'and the second');
    assert.equal(outcomes[2].status, 'Suppressed', 'the third is over the limit');
    assert.match(outcomes[2].reason, /over the limit of 2/);
    assert.equal(outcomes[2].rule, 'BR-TRK-032');
    assert.equal(outcomes[3].status, 'Suppressed');

    // a mandatory message is not counted against the limit
    await saveDefinitionAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification', channels: ['email'], category: 'Account', mandatory: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const mandatory = await sendNotificationAsync({
      key: 'CustomerPasswordRecovery.CustomerNotification',
      tokens: {},
      recipients: [{ customer, email: customer.email, languageId: 1 }],
      occurrence: 'limit-mandatory',
      gateways: G,
    });
    assert.ok(mandatory.messages[0].queuedEmailId, 'a mandatory message still goes');
    await saveSettingAsync('trk.preferences.limitperperiod', null, 0);
  });

  test('AC-TRK-006-04-02', async () => {
    // "customers who have not set their own values follow the new defaults; the change is
    //  audited (AUD-TRK-002)"
    const denied = await api.post('/api/notification-preferences/defaults', { quietHours: '21-07' }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.NotificationSettings.CreateEditDelete');

    const theirOwn = await shopperAsync();
    await setPreferenceAsync({ customerId: theirOwn.id, channel: 'sms', category: null, quietHours: '23-05' });
    const noneOfTheirOwn = await shopperAsync();

    const saved = await api.post('/api/notification-preferences/defaults', {
      quietHours: '21-07', limitPerPeriod: 5, limitPeriodHours: 24,
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);
    assert.equal(saved.appliesToCustomersWithoutTheirOwnValues, true);

    const follower = await matrixAsync({ customerId: noneOfTheirOwn.id });
    assert.equal(follower.quietHours, '21-07', 'a customer without their own value follows the new default');
    assert.equal(follower.quietHoursFrom, 'the client default');

    const keeper = await matrixAsync({ customerId: theirOwn.id });
    assert.equal(keeper.quietHours, '23-05', 'a customer with their own value keeps it');
    assert.equal(keeper.quietHoursFrom, 'the customer');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-002', entity: 'Setting' });
    assert.ok(trail.some((e) => e.after?.['trk.preferences.quiethours'] === '21-07'), 'the change is audited');
    await saveSettingAsync('trk.preferences.quiethours', null, 0);
    await saveSettingAsync('trk.preferences.limitperperiod', null, 0);
  });
});
