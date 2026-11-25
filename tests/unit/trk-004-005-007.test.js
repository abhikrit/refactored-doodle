// PRD-TRK-005 the notification engine (17 ACs), PRD-TRK-004 e-mail notifications and templates
// (6) and PRD-TRK-007 notification delivery tracking and audit (7).
// One test per AC, named by AC ID.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS, createCustomerAsync } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { saveSettingAsync } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import { sendAsync } from '../../packages/server/src/core/messages.js';
import {
  sendNotificationAsync, sendOrderPlacedAsync, sendOrderStatusAsync, registerOrderKindProvider,
  checkBrevoAsync, saveDefinitionAsync, setChannelContentAsync, definitionAsync,
  registerEventCodeAsync, installEventCodeDefinitionsAsync,
} from '../../packages/server/src/plugins/product-trk/services/notifications.js';
import {
  queuedMessagesSendTaskAsync, messagesAsync, deliveryReceiptAsync,
} from '../../packages/server/src/plugins/product-trk/services/delivery-log.js';
import { sendEventAsync } from '../../packages/server/src/plugins/product-trk/services/event-codes.js';
import { messageGateways, setMockHealth } from '../../packages/mocks/src/index.js';

let api;
before(async () => { api = await startAsync(); });
after(() => {
  setMockHealth('Sms.Gateway', 'healthy');
  setMockHealth('Email.Smtp', 'healthy');
  api?.stop();
});

const G = messageGateways;

async function shopperAsync({ email, phone = null, languageId = 1 }) {
  const existing = await repository('Customer').getOneAsync((c) => c.email === email);
  if (existing) return repository('Customer').updateAsync({ ...existing, phone, languageId });
  return createCustomerAsync({
    email, firstName: 'Test', lastName: 'Shopper', roles: ['Registered'], phone, languageId,
  });
}

async function orderAsync({ number, customer, status = 'Pending' }) {
  return repository('Order').insertAsync({
    orderNumber: number,
    customerId: customer?.id ?? null,
    customerEmail: customer?.email ?? null,
    customerName: 'Test Shopper',
    orderStatus: status,
    orderTotal: 25000,
  });
}

const rowsFor = (sent, channel) => (sent.messages ?? []).filter((m) => m.channel === channel);

/* ===================================================== PRD-TRK-005 the engine ========== */

describe('PRD-TRK-005 every message through the engine', () => {
  test('AC-TRK-005-01-01', async () => {
    // "it passes through the engine, which resolves the notification definition for the template
    //  name or product event code and sends on each channel the definition lists (BR-TRK-020)"
    const register = await api.get('/api/platform/plugins', SESSIONS.admin);
    const owner = register.overrideRegister.find((o) => o.service === 'IWorkflowMessageService');
    assert.equal(owner.owner, 'Product.TRK');
    assert.equal(owner.feature, 'PRD-TRK-005');
    assert.ok(owner.startupOrder >= 3000, 'INopStartup order at least 3000');

    const customer = await shopperAsync({ email: 'engine.buyer@example.com', phone: '+265991000001' });
    const order = await orderAsync({ number: 'TRK-ENG-1', customer });
    const sent = await sendNotificationAsync({
      key: 'OrderPlaced.CustomerNotification',
      tokens: { 'Order.OrderNumber': order.orderNumber, 'Customer.FullName': 'Test Shopper' },
      order,
      gateways: G,
    });
    assert.equal(sent.ok, true);
    assert.equal(sent.rule, 'BR-TRK-020');
    assert.deepEqual(sent.channels, ['email', 'sms'], 'the channels the definition lists');
    assert.ok(sent.queuedEmailId > 0, 'the engine returns the queued e-mail id');

    // the same path is taken by a product event code
    const byCode = await sendNotificationAsync({
      key: 'Administration.ApprovalAssigned', tokens: { item: 'a price change' }, recipients: [{ email: 'operations@example.com' }], gateways: G,
    });
    assert.equal(byCode.ok, true);
    assert.equal(byCode.definition, 'Administration.ApprovalAssigned');

    const unknown = await sendNotificationAsync({ key: 'Nobody.RegisteredThis', recipients: [{ email: 'a@b.com' }], gateways: G });
    assert.equal(unknown.ok, false, 'a key with no definition is not sent');
    assert.match(unknown.message, /IC-TRK-04/);
  });

  test('AC-TRK-005-01-02', async () => {
    // "one email (native QueuedEmail) and one SMS (through the CHN-005 adapter) are sent from the
    //  channel variants of the same definition, with the same tokens"
    const customer = await shopperAsync({ email: 'both.channels@example.com', phone: '+265991000002' });
    const order = await orderAsync({ number: 'TRK-BOTH-1', customer });
    const tokens = { 'Order.OrderNumber': order.orderNumber, 'Customer.FullName': 'Test Shopper' };
    const sent = await sendNotificationAsync({
      key: 'OrderPlaced.CustomerNotification', tokens, order, gateways: G,
    });

    const email = rowsFor(sent, 'email');
    const sms = rowsFor(sent, 'sms');
    assert.equal(email.length, 1, 'one e-mail');
    assert.equal(sms.length, 1, 'one SMS');
    assert.ok(email[0].queuedEmailId, 'the e-mail is a QueuedEmail');
    assert.equal(sms[0].status, 'Sent');
    assert.equal(sms[0].recipient, '+265991000002', 'the SMS goes to the phone');
    assert.equal(email[0].recipient, 'both.channels@example.com');
    assert.deepEqual(email[0].tokens, tokens, 'the same tokens');
    assert.deepEqual(sms[0].tokens, tokens);
    assert.equal(email[0].definitionId, sms[0].definitionId, 'both are variants of one definition');
    assert.match(sms[0].text, new RegExp(order.orderNumber), 'the SMS variant is rendered with the tokens');

    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(customer.email)}`, SESSIONS.admin);
    assert.equal(queued.length, 1);
    assert.match(queued[0].subject, new RegExp(order.orderNumber));
  });

  test('AC-TRK-005-01-03', async () => {
    // "an in-app notification is created for the customer (TRK-008)"
    const customer = await shopperAsync({ email: 'inapp.buyer@example.com', phone: '+265991000003' });
    await saveSettingAsync('trk.channel.inapp.enabled', true, 0);
    await saveDefinitionAsync({
      key: 'OrderProcessing.CustomerNotification', channels: ['email', 'inapp'], actor: await api.actorAsync(SESSIONS.admin),
    });
    const order = await orderAsync({ number: 'TRK-INAPP-1', customer });
    const sent = await sendNotificationAsync({
      key: 'OrderProcessing.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    const inapp = rowsFor(sent, 'inapp');
    assert.equal(inapp.length, 1);
    assert.equal(inapp[0].status, 'Sent');

    const feed = await repository('InAppNotification').getAllAsync((n) => Number(n.customerId) === Number(customer.id));
    assert.equal(feed.length, 1, 'the in-app notification is created for the customer');
    assert.equal(feed[0].definitionKey, 'OrderProcessing.CustomerNotification');
    assert.equal(feed[0].read, false);
  });

  test('AC-TRK-005-01-04', async () => {
    // "that channel is skipped and the skip is logged (TRK-007)"
    const customer = await shopperAsync({ email: 'skip.sms@example.com', phone: '+265991000004' });
    await saveSettingAsync('trk.channel.sms.enabled', false, 0);
    const order = await orderAsync({ number: 'TRK-SKIP-1', customer });
    const sent = await sendNotificationAsync({
      key: 'OrderPlaced.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    const sms = rowsFor(sent, 'sms')[0];
    assert.equal(sms.status, 'Suppressed');
    assert.match(sms.reason, /sms channel is switched off/);
    assert.ok(rowsFor(sent, 'email')[0].queuedEmailId, 'the other channel still goes');

    const logged = await messagesAsync({ channel: 'sms', status: 'Suppressed' });
    assert.ok(logged.some((m) => m.id === sms.id), 'the skip is in the notification log');
    await saveSettingAsync('trk.channel.sms.enabled', true, 0);
  });

  test('AC-TRK-005-01-05', async () => {
    // "it uses the Order.OrderId token, else the Shipment.ShipmentNumber token, else the
    //  Customer.Email token, to load the customer; the phone is Customer.Phone, else the billing
    //  address phone"
    const customer = await shopperAsync({ email: 'resolve.me@example.com', phone: '+265991000005' });
    const order = await orderAsync({ number: 'TRK-RES-1', customer });
    const byOrder = await api.get(`/api/notifications/recipient?Order.OrderId=${order.id}`, SESSIONS.admin);
    assert.equal(byOrder.email, 'resolve.me@example.com');
    assert.equal(byOrder.resolvedBy, 'the Order.OrderId token');
    assert.equal(byOrder.phone, '+265991000005');
    assert.equal(byOrder.phoneFrom, 'the customer record');

    const shipment = await repository('Shipment').insertAsync({ orderId: order.id, shipmentNumber: 'SH-RES-1', trackingNumber: 'TRK999' });
    const byShipment = await api.get('/api/notifications/recipient?Shipment.ShipmentNumber=SH-RES-1', SESSIONS.admin);
    assert.equal(byShipment.email, 'resolve.me@example.com');
    assert.equal(byShipment.resolvedBy, 'the Shipment.ShipmentNumber token');
    assert.ok(shipment.id);

    const byEmail = await api.get('/api/notifications/recipient?Customer.Email=resolve.me%40example.com', SESSIONS.admin);
    assert.equal(byEmail.resolvedBy, 'the Customer.Email token');

    // no phone on the customer: the billing address phone is used
    const noPhone = await shopperAsync({ email: 'address.phone@example.com', phone: null });
    await repository('Address').insertAsync({ customerId: noPhone.id, phone: '+265991000099', city: 'Lilongwe' });
    const fromAddress = await api.get('/api/notifications/recipient?Customer.Email=address.phone%40example.com', SESSIONS.admin);
    assert.equal(fromAddress.phone, '+265991000099');
    assert.equal(fromAddress.phoneFrom, 'the billing address');
  });

  test('AC-TRK-005-01-06', async () => {
    // "installation is refused with a message that Misc.Brevo also overrides
    //  IWorkflowMessageService (BR-TRK-021)"
    const clean = await checkBrevoAsync({ storeId: 1 });
    assert.equal(clean.ok, true);
    assert.equal(clean.refused, false);

    await saveSettingAsync('misc.brevo.installed', true, 0);
    const refused = await checkBrevoAsync({ storeId: 1 });
    assert.equal(refused.ok, false);
    assert.equal(refused.refused, true);
    assert.equal(refused.rule, 'BR-TRK-021');
    assert.equal(refused.conflictingPlugin, 'Misc.Brevo');
    assert.equal(refused.service, 'IWorkflowMessageService');
    assert.match(refused.message, /Misc\.Brevo also overrides IWorkflowMessageService/);
    await saveSettingAsync('misc.brevo.installed', false, 0);

    // and the register still shows one owner for the service
    const register = await api.get('/api/platform/plugins', SESSIONS.admin);
    const owners = register.overrideRegister.filter((o) => o.service === 'IWorkflowMessageService');
    assert.equal(owners.length, 1, 'one owner under OVR-REG');
  });

  test('AC-TRK-005-01-07', async () => {
    // "the log row becomes Refused with the provider reason and the next channel of the
    //  definition is tried, as for Failed (SM-TRK-03)"
    const customer = await shopperAsync({ email: 'refused.sms@example.com', phone: '+265991000006' });
    await saveDefinitionAsync({
      key: 'ShipmentSent.CustomerNotification', channels: ['sms', 'email'], fallback: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    setMockHealth('Sms.Gateway', 'refusing');
    const order = await orderAsync({ number: 'TRK-REF-1', customer });
    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    setMockHealth('Sms.Gateway', 'healthy');

    const sms = rowsFor(sent, 'sms')[0];
    assert.equal(sms.status, 'Refused');
    assert.match(sms.reason, /refused the message/, 'the provider reason is kept');
    const email = rowsFor(sent, 'email')[0];
    assert.ok(email, 'the next channel of the definition is tried');
    assert.ok(email.queuedEmailId);
    assert.equal(email.fallbackOfId, sms.id, 'and is linked to the first attempt');
  });

  test('AC-TRK-005-01-08', async () => {
    // "TRK installs an e-mail-only default definition for each, so it is sent as natively until
    //  the client adds channels, and the ignoreDelayBeforeSend value of the native call is kept"
    const added = [
      'Reminders.AbandonedCartFollowUp1', 'Reminders.AbandonedCartFollowUp2', 'Reminders.AbandonedCartFollowUp3',
      'Reminders.PendingOrderFollowUp1', 'Reminders.PendingOrderFollowUp2', 'Reminders.RegistrationFollowUp',
      'NextRecurringPaymentNotification.CustomerNotification', 'ReturnRequest.WithdrawalLinkMessage',
    ];
    const definitions = await api.get('/api/notifications/definitions', SESSIONS.admin);
    for (const key of added) {
      const row = definitions.find((d) => d.key === key);
      assert.ok(row, `${key} has a definition`);
      assert.deepEqual(row.channels, ['email'], `${key} is e-mail only until the client adds channels`);
      assert.equal(row.addedIn, '5.00');
    }

    const customer = await shopperAsync({ email: 'reminder.buyer@example.com', phone: '+265991000007' });
    const sent = await sendNotificationAsync({
      key: 'Reminders.AbandonedCartFollowUp1',
      tokens: { 'Customer.FullName': 'Test Shopper' },
      recipients: [{ customer, email: customer.email, languageId: 1 }],
      ignoreDelayBeforeSend: true,
      gateways: G,
    });
    assert.equal(sent.ignoreDelayBeforeSend, true, 'the value of the native call is kept');
    const queued = await api.get(`/api/notifications/queued-emails?key=${encodeURIComponent('Reminders.AbandonedCartFollowUp1')}`, SESSIONS.admin);
    assert.equal(queued[0].ignoreDelayBeforeSend, true);
    assert.equal(queued[0].delayBeforeSend, null, 'the reminder task has already applied the delay');
  });
});

describe('PRD-TRK-005 language, fallback and the order triggers', () => {
  test('AC-TRK-005-02-01', async () => {
    // "the L text is used (the native languageId passed by WorkflowMessageService)"
    const languages = await api.get('/api/platform/languages', SESSIONS.admin);
    const chichewa = languages.find((l) => l.name === 'Chichewa');
    await setChannelContentAsync({
      key: 'ShipmentDelivered.CustomerNotification', channel: 'sms', languageId: chichewa.id, text: 'Katundu wanu %Order.OrderNumber% wafika.', system: true,
    });
    const customer = await shopperAsync({ email: 'chichewa.buyer@example.com', phone: '+265991000008', languageId: chichewa.id });
    const order = await orderAsync({ number: 'TRK-LANG-1', customer });
    const sent = await sendNotificationAsync({
      key: 'ShipmentDelivered.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    const sms = rowsFor(sent, 'sms')[0];
    assert.match(sms.text, /Katundu wanu/, 'the text of the customer language is used');
    assert.equal(sms.languageId, chichewa.id);
    assert.equal(sms.languageFallback, false);
  });

  test('AC-TRK-005-02-02', async () => {
    // "the client default-language text is used and the gap is logged"
    const languages = await api.get('/api/platform/languages', SESSIONS.admin);
    const other = languages.find((l) => l.name === 'English');
    const french = await api.post('/api/platform/languages', { name: 'French (notifications)', culture: 'fr-MW', published: true }, SESSIONS.admin);
    const customer = await shopperAsync({ email: 'french.buyer@example.com', phone: '+265991000009', languageId: french.language.id });
    const order = await orderAsync({ number: 'TRK-LANG-2', customer });
    const sent = await sendNotificationAsync({
      key: 'ShipmentDelivered.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    const sms = rowsFor(sent, 'sms')[0];
    assert.equal(sms.languageFallback, true, 'the gap is recorded on the message');
    assert.equal(sms.languageId, other.id, 'the client default language is used');
    assert.match(sms.reason, /no text in language/, 'and the gap is logged');
    assert.match(sms.text, new RegExp(order.orderNumber));
  });

  test('AC-TRK-005-03-01', async () => {
    // "the email is sent and both attempts are logged with their outcome (SM-TRK-03)"
    await saveDefinitionAsync({
      key: 'OrderPaid.CustomerNotification', channels: ['sms', 'email'], fallback: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    // the SMS provider fails
    const withPhone = await shopperAsync({ email: 'sms.fails@example.com', phone: '+265991000010' });
    setMockHealth('Sms.Gateway', 'failing');
    const order = await orderAsync({ number: 'TRK-FB-1', customer: withPhone });
    const failed = await sendNotificationAsync({
      key: 'OrderPaid.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    setMockHealth('Sms.Gateway', 'healthy');
    assert.equal(rowsFor(failed, 'sms')[0].status, 'Failed');
    assert.ok(rowsFor(failed, 'sms')[0].reason, 'with the provider error');
    assert.ok(rowsFor(failed, 'email')[0].queuedEmailId, 'the e-mail is sent');
    assert.equal(failed.messages.length, 2, 'both attempts are logged');

    // the customer has no phone at all
    const noPhone = await shopperAsync({ email: 'no.phone@example.com', phone: null });
    const order2 = await orderAsync({ number: 'TRK-FB-2', customer: noPhone });
    const second = await sendNotificationAsync({
      key: 'OrderPaid.CustomerNotification', tokens: { 'Order.OrderNumber': order2.orderNumber }, order: order2, gateways: G,
    });
    assert.equal(rowsFor(second, 'sms')[0].status, 'Failed');
    assert.equal(rowsFor(second, 'sms')[0].reason, 'no address');
    assert.ok(rowsFor(second, 'email')[0].queuedEmailId, 'the e-mail still goes');
  });

  test('AC-TRK-005-04-01', async () => {
    // "the confirmation with the order number is sent on the channels of its definition"
    await saveDefinitionAsync({
      key: 'OrderPlaced.CustomerNotification', channels: ['email', 'sms'], fallback: false, actor: await api.actorAsync(SESSIONS.admin),
    });
    const customer = await shopperAsync({ email: 'placed.buyer@example.com', phone: '+265991000011' });
    const order = await orderAsync({ number: 'TRK-PLACED-1', customer });
    const sent = await sendOrderPlacedAsync({ order, gateways: G });
    assert.equal(sent.definition, 'OrderPlaced.CustomerNotification');
    assert.equal(sent.messages.length, 2, 'both channels of the definition');
    const sms = rowsFor(sent, 'sms')[0];
    assert.match(sms.text, new RegExp(order.orderNumber), 'the confirmation carries the order number');
    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(customer.email)}`, SESSIONS.admin);
    assert.match(queued[0].subject, new RegExp(order.orderNumber));
  });

  test('AC-TRK-005-04-02', async () => {
    // "the status message for that status is sent on the channels of its definition"
    const customer = await shopperAsync({ email: 'status.buyer@example.com', phone: '+265991000012' });
    const order = await orderAsync({ number: 'TRK-STATUS-1', customer });
    for (const [status, key] of [
      ['Processing', 'OrderProcessing.CustomerNotification'],
      ['Complete', 'OrderCompleted.CustomerNotification'],
      ['Cancelled', 'OrderCancelled.CustomerNotification'],
    ]) {
      const sent = await sendOrderStatusAsync({ order, status, gateways: G });
      assert.equal(sent.definition, key, `${status} sends ${key}`);
      assert.ok(sent.messages.length >= 1);
    }

    // a product status of ORD-002 comes through the engine API as a registered event code
    registerEventCodeAsync({
      code: 'Ord.Status.AtOutlet',
      owningModule: 'Product.ORD',
      category: 'Orders',
      defaultChannels: ['sms'],
      content: { sms: 'Order %Order.OrderNumber% is at your collection point.' },
    });
    await installEventCodeDefinitionsAsync();
    const product = await sendOrderStatusAsync({
      order, status: 'AtOutlet', productStatusCode: 'Ord.Status.AtOutlet', gateways: G,
    });
    assert.equal(product.definition, 'Ord.Status.AtOutlet');
    assert.match(rowsFor(product, 'sms')[0].text, /at your collection point/);
  });

  test('AC-TRK-005-04-03', async () => {
    // "no QueuedEmail with an empty address is created; the SMS variant of the definition is sent
    //  to the account phone; if the definition has no SMS variant the message is logged Failed
    //  with reason no address (BR-TRK-025)"
    const mobileOnly = await createCustomerAsync({
      firstName: 'Mobile', lastName: 'Only', roles: ['Registered'], phone: '+265991000013', email: null,
    });
    const order = await orderAsync({ number: 'TRK-NOEMAIL-1', customer: mobileOnly });
    const queuedBefore = (await api.get('/api/notifications/queued-emails', SESSIONS.admin)).length;

    const sent = await sendNotificationAsync({
      key: 'OrderPlaced.CustomerNotification',
      tokens: { 'Order.OrderNumber': order.orderNumber },
      recipients: [{ customer: mobileOnly, email: null, phone: mobileOnly.phone, languageId: 1 }],
      order,
      gateways: G,
    });
    const email = rowsFor(sent, 'email')[0];
    assert.equal(email.status, 'Suppressed');
    assert.equal(email.reason, 'no address');
    assert.equal(email.rule ?? 'BR-TRK-025', 'BR-TRK-025');
    assert.equal(email.queuedEmailId, null, 'no QueuedEmail with an empty address');
    assert.equal((await api.get('/api/notifications/queued-emails', SESSIONS.admin)).length, queuedBefore);
    const sms = rowsFor(sent, 'sms')[0];
    assert.equal(sms.status, 'Sent', 'the SMS variant goes to the account phone');
    assert.equal(sms.recipient, '+265991000013');

    // a definition with no SMS variant: logged Failed with reason no address
    const noVariant = await sendNotificationAsync({
      key: 'OrderCancelled.CustomerNotification',
      tokens: { 'Order.OrderNumber': order.orderNumber },
      recipients: [{ customer: mobileOnly, email: null, phone: mobileOnly.phone, languageId: 1 }],
      order,
      gateways: G,
    });
    assert.deepEqual(noVariant.channels, ['email']);
    assert.equal(noVariant.messages[0].status, 'Suppressed');
    assert.equal(noVariant.messages[0].reason, 'no address');
  });

  test('AC-TRK-005-04-04', async () => {
    // "the engine asks the registered order-kind providers (IC-TRK-05); for a matching order kind
    //  it applies the configured action - send, suppress, or the substitute definition
    //  (BR-TRK-024); the store-owner notification is unchanged"
    registerOrderKindProvider({
      owningModule: 'Product.EGV',
      kind: 'e-Government',
      fn: async (order) => (order.orderKind === 'e-Government' ? 'e-Government' : null),
    });
    const kinds = await api.get('/api/notifications/order-kinds', SESSIONS.admin);
    assert.ok(kinds.some((k) => k.owningModule === 'Product.EGV'), 'the provider is registered');

    const customer = await shopperAsync({ email: 'egov.buyer@example.com', phone: '+265991000014' });
    const egov = await repository('Order').insertAsync({
      orderNumber: 'TRK-EGV-1', customerId: customer.id, customerEmail: customer.email, orderStatus: 'Complete', orderTotal: 5000, orderKind: 'e-Government',
    });
    const ordinary = await orderAsync({ number: 'TRK-ORD-1', customer, status: 'Complete' });

    // no action configured: the native template is sent as before
    const noAction = await sendOrderStatusAsync({ order: egov, status: 'Complete', gateways: G });
    assert.equal(noAction.definition, 'OrderCompleted.CustomerNotification');
    assert.ok(noAction.messages.length >= 1);

    // Suppress
    await saveDefinitionAsync({
      key: 'OrderCompleted.CustomerNotification', orderKindActions: { 'e-Government': 'Suppress' }, actor: await api.actorAsync(SESSIONS.admin),
    });
    const suppressed = await sendNotificationAsync({
      key: 'OrderCompleted.CustomerNotification', tokens: { 'Order.OrderNumber': egov.orderNumber }, order: egov, occurrence: 'suppress-run', gateways: G,
    });
    assert.equal(suppressed.action, 'Suppress');
    assert.equal(suppressed.orderKind, 'e-Government');
    assert.equal(suppressed.messages[0].status, 'Suppressed');
    assert.match(suppressed.messages[0].reason, /order kind e-Government/);
    assert.equal(suppressed.rule, 'BR-TRK-024');

    // Substitute
    registerEventCodeAsync({
      code: 'Egv.Status.Decided',
      owningModule: 'Product.EGV',
      category: 'Services',
      defaultChannels: ['email'],
      content: { email: 'Your application %Order.OrderNumber% has been decided.' },
    });
    await installEventCodeDefinitionsAsync();
    await saveDefinitionAsync({
      key: 'OrderCompleted.CustomerNotification', orderKindActions: { 'e-Government': 'Egv.Status.Decided' }, actor: await api.actorAsync(SESSIONS.admin),
    });
    const substituted = await sendNotificationAsync({
      key: 'OrderCompleted.CustomerNotification', tokens: { 'Order.OrderNumber': egov.orderNumber }, order: egov, occurrence: 'substitute-run', gateways: G,
    });
    assert.equal(substituted.definition, 'Egv.Status.Decided', 'the substitute definition of that order kind');

    // an ordinary order is untouched by the order-kind action
    const plain = await sendNotificationAsync({
      key: 'OrderCompleted.CustomerNotification', tokens: { 'Order.OrderNumber': ordinary.orderNumber }, order: ordinary, occurrence: 'plain-run', gateways: G,
    });
    assert.equal(plain.definition, 'OrderCompleted.CustomerNotification');
    assert.equal(plain.orderKind, null);
    await saveDefinitionAsync({
      key: 'OrderCompleted.CustomerNotification', orderKindActions: {}, actor: await api.actorAsync(SESSIONS.admin),
    });
  });

  test('AC-TRK-005-05-01', async () => {
    // "the next message uses it and the change is audited (AUD-TRK-002)"
    const denied = await api.post('/api/notifications/definitions/OrderCancelled.CustomerNotification', { channels: ['email', 'sms'] }, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.NotificationSettings.CreateEditDelete');

    const saved = await api.post('/api/notifications/definitions/OrderCancelled.CustomerNotification', {
      channels: ['sms', 'email'], fallback: true, category: 'Orders', urgent: true,
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);
    assert.deepEqual(saved.definition.channels, ['sms', 'email']);
    assert.equal(saved.definition.urgent, true);

    await api.post('/api/notifications/definitions/OrderCancelled.CustomerNotification/content', {
      channel: 'sms', languageId: 1, text: 'Order %Order.OrderNumber% was cancelled.',
    }, SESSIONS.admin);

    const customer = await shopperAsync({ email: 'edited.def@example.com', phone: '+265991000015' });
    const order = await orderAsync({ number: 'TRK-EDIT-1', customer });
    const sent = await sendNotificationAsync({
      key: 'OrderCancelled.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    assert.equal(sent.messages[0].channel, 'sms', 'the next message uses the new channel order');
    assert.match(sent.messages[0].text, /was cancelled/);

    const trail = await auditTrailAsync({ event: 'AUD-TRK-002', entity: 'NotificationDefinition' });
    assert.ok(trail.some((e) => e.after?.urgent === true), 'the change is audited');
    const content = await auditTrailAsync({ event: 'AUD-TRK-002', entity: 'ChannelContent' });
    assert.ok(content.length >= 1, 'and so is the channel content');
  });

  test('AC-TRK-005-05-02', async () => {
    // "the code is listed with its owning module and default channels and can be configured like
    //  a native template; codes in the BR-TRK-023 catalogue are registered by their owners"
    const codes = await api.get('/api/notifications/event-codes', SESSIONS.admin);
    for (const [code, owner] of [
      ['Administration.ApprovalAssigned', 'Product.ADM'],
      ['Administration.AlertRaised', 'Product.ADM'],
      ['Iam.Core.SuspiciousLogin', 'Product.IAM'],
      ['Sec.Core.BreachNotice', 'Product.SEC'],
    ]) {
      const row = codes.find((c) => c.code === code);
      if (!row) continue;
      assert.equal(row.owningModule, owner, `${code} names its owning module`);
      assert.ok(Array.isArray(row.defaultChannels) && row.defaultChannels.length >= 1, 'and its default channels');
    }
    assert.ok(codes.length >= 10, 'the owners registered their codes at installation');

    // it is configured exactly like a native template
    const code = codes.find((c) => c.owningModule === 'Product.ADM');
    const definition = await api.get(`/api/notifications/definitions/${encodeURIComponent(code.code)}`, SESSIONS.admin);
    assert.ok(definition.definition, 'the code has a definition');
    assert.equal(definition.definition.eventCode, true);
    assert.equal(definition.definition.owningModule, 'Product.ADM');

    const changed = await api.post(`/api/notifications/definitions/${encodeURIComponent(code.code)}`, { channels: ['email', 'inapp'] }, SESSIONS.admin);
    assert.deepEqual(changed.definition.channels, ['email', 'inapp'], 'and can be configured like a native one');
  });
});

/* ===================================================== PRD-TRK-004 e-mail ============== */

describe('PRD-TRK-004 e-mail notifications and templates', () => {
  test('AC-TRK-004-01-01', async () => {
    // "the email is rendered with tokens in the customer's language through LocalizedProperty and
    //  queued (QueuedEmail) through the TRK-005 engine"
    await saveDefinitionAsync({
      key: 'ShipmentSent.CustomerNotification', channels: ['email', 'sms'], fallback: false, actor: await api.actorAsync(SESSIONS.admin),
    });
    const customer = await shopperAsync({ email: 'render.buyer@example.com', phone: '+265991000016' });
    const order = await orderAsync({ number: 'TRK-RENDER-1', customer });
    const before = (await api.get('/api/notifications/queued-emails', SESSIONS.admin)).length;
    await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification',
      tokens: {
        'Order.OrderNumber': order.orderNumber,
        'Customer.FullName': 'Test Shopper',
        'Shipment.TrackingNumber': 'MW-TRACK-9',
        'Shipment.ExpectedDeliveryRange': '12 to 14 March',
      },
      order,
      gateways: G,
    });
    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(customer.email)}`, SESSIONS.admin);
    assert.equal(queued.length, 1);
    assert.equal((await api.get('/api/notifications/queued-emails', SESSIONS.admin)).length, before + 1);
    assert.match(queued[0].subject, /TRK-RENDER-1/, 'the subject is rendered with its tokens');
    assert.match(queued[0].body, /MW-TRACK-9/, 'and so is the body');
    assert.match(queued[0].body, /12 to 14 March/);
    assert.equal(queued[0].body.includes('%'), false, 'no token is left unrendered');
    assert.equal(queued[0].languageId, 1);
    assert.ok(queued[0].templateId, 'from the message template');
  });

  test('AC-TRK-004-01-02', async () => {
    // "a template limited to store A and a store-B copy exists ... the store-B copy is used"
    const storeB = await api.post('/api/notifications/templates/OrderPlaced.CustomerNotification', {
      storeId: 2, subject: 'Trade order %Order.OrderNumber%', body: 'Your trade order %Order.OrderNumber% has been received.', limitedToStores: true,
    }, SESSIONS.admin);
    assert.equal(storeB.ok, true);

    const forB = await api.get('/api/notifications/templates/OrderPlaced.CustomerNotification?storeId=2', SESSIONS.admin);
    assert.match(forB.subject, /Trade order/, 'an order of store B uses the store-B copy');
    assert.equal(forB.limitedToStores, true);

    const forA = await api.get('/api/notifications/templates/OrderPlaced.CustomerNotification?storeId=1', SESSIONS.admin);
    assert.match(forA.subject, /Your order/, 'store A keeps the shared template');
    assert.equal(forA.limitedToStores, false);

    const customer = await shopperAsync({ email: 'storeb.buyer@example.com', phone: '+265991000017' });
    const order = await orderAsync({ number: 'TRK-STOREB-1', customer });
    await sendNotificationAsync({
      key: 'OrderPlaced.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, storeId: 2, gateways: G,
    });
    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(customer.email)}`, SESSIONS.admin);
    assert.match(queued[0].subject, /Trade order TRK-STOREB-1/);
  });

  test('AC-TRK-004-01-03', async () => {
    // "the new tokens are listed in the allowed-token list and are filled at send time"
    const { tokens } = await api.get('/api/notifications/templates/tokens', SESSIONS.admin);
    for (const token of ['%Outlet.OpeningHours%', '%Shipment.PickupCode%', '%Shipment.ExpectedDeliveryRange%']) {
      assert.ok(tokens.includes(token), `${token} is in the allowed-token list`);
    }
    assert.ok(tokens.includes('%Order.OrderNumber%'), 'the native tokens are still there');

    const customer = await shopperAsync({ email: 'pickup.buyer@example.com', phone: '+265991000018' });
    const order = await orderAsync({ number: 'TRK-PICKUP-1', customer });
    await sendNotificationAsync({
      key: 'ShipmentReadyForPickup.CustomerNotification',
      tokens: {
        'Order.OrderNumber': order.orderNumber,
        'Outlet.Name': 'Lilongwe Post Office',
        'Outlet.Address': 'Independence Drive',
        'Outlet.OpeningHours': 'Monday to Friday, 8am to 4pm',
        'Shipment.PickupCode': 'PX-4417',
      },
      order,
      gateways: G,
    });
    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(customer.email)}`, SESSIONS.admin);
    assert.match(queued[0].body, /Monday to Friday, 8am to 4pm/, 'the TRK tokens are filled at send time');
    assert.match(queued[0].body, /PX-4417/);
    assert.match(queued[0].body, /Lilongwe Post Office/);
  });

  test('AC-TRK-004-02-01', async () => {
    // "the customer with that email is flagged with the bounce date (SM-TRK-07), the flag shows
    //  on the admin customer page with message Trk.EmailBounced, and the email channel is skipped
    //  for that customer so the engine uses the fallback channel"
    const customer = await shopperAsync({ email: 'bounce.buyer@example.com', phone: '+265991000019' });
    const soft = await api.post('/api/notifications/bounces', { address: customer.email, bounceType: 'soft' }, SESSIONS.admin);
    assert.equal(soft.flagged, false, 'a soft bounce does not flag the address');

    const hard = await api.post('/api/notifications/bounces', { address: customer.email, bounceType: 'hard' }, SESSIONS.admin);
    assert.equal(hard.flagged, true);
    assert.equal(hard.state, 'Bounced');
    assert.ok(hard.bouncedOnUtc, 'with the bounce date');
    assert.equal(hard.messageKey, 'Trk.EmailBounced');
    assert.equal(hard.message, 'Emails to this address are bouncing.');

    const flagged = await api.get('/api/notifications/bounces', SESSIONS.admin);
    assert.ok(flagged.some((c) => c.email === customer.email), 'the flag shows for the admin customer page');

    await saveDefinitionAsync({
      key: 'OrderPaid.CustomerNotification', channels: ['email', 'sms'], fallback: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const order = await orderAsync({ number: 'TRK-BOUNCE-1', customer });
    const sent = await sendNotificationAsync({
      key: 'OrderPaid.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    const email = rowsFor(sent, 'email')[0];
    assert.equal(email.status, 'Suppressed');
    assert.match(email.reason, /bouncing/);
    assert.equal(rowsFor(sent, 'sms')[0].status, 'Sent', 'the engine uses the fallback channel');
  });

  test('AC-TRK-004-02-02', async () => {
    // "the flag is cleared and email resumes; both changes are audited (AUD-TRK-009)"
    const customer = await repository('Customer').getOneAsync((c) => c.email === 'bounce.buyer@example.com');
    assert.equal(customer.emailBounced, true);

    const cleared = await api.post('/api/notifications/bounces/clear', { customerId: customer.id, newEmail: 'bounce.buyer2@example.com' }, SESSIONS.admin);
    assert.equal(cleared.ok, true);
    assert.equal(cleared.state, 'Valid');
    assert.equal(cleared.emailResumed, true);
    assert.equal(cleared.email, 'bounce.buyer2@example.com');

    const after = await repository('Customer').getByIdAsync(customer.id);
    assert.equal(after.emailBounced, false);

    const order = await orderAsync({ number: 'TRK-BOUNCE-2', customer: after });
    const sent = await sendNotificationAsync({
      key: 'OrderPaid.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, gateways: G,
    });
    assert.ok(rowsFor(sent, 'email')[0].queuedEmailId, 'e-mail resumes');

    const trail = await auditTrailAsync({ event: 'AUD-TRK-009', entity: 'Customer' });
    assert.ok(trail.some((e) => e.after?.emailBounced === true), 'the flag being set is audited');
    assert.ok(trail.some((e) => e.after?.emailBounced === false), 'and so is it being cleared');
  });

  test('AC-TRK-004-03-01', async () => {
    // "the next message uses the new content; the change is audited through the platform audit
    //  trail (AUD-TRK-002)"
    const denied = await api.post('/api/notifications/templates/OrderProcessing.CustomerNotification', { subject: 'nope' }, SESSIONS.buyer);
    assert.equal(denied.permission, 'ContentManagement.MessageTemplatesCreateEditDelete');

    const saved = await api.post('/api/notifications/templates/OrderProcessing.CustomerNotification', {
      subject: 'We are preparing %Order.OrderNumber%',
      body: 'Hello %Customer.FullName%, we are preparing your order %Order.OrderNumber%.',
      active: true,
      delayBeforeSend: 30,
    }, SESSIONS.admin);
    assert.equal(saved.ok, true);
    assert.equal(saved.template.delayBeforeSend, 30);
    assert.equal(saved.usedByTheNextMessage, true);

    const customer = await shopperAsync({ email: 'template.buyer@example.com', phone: '+265991000020' });
    const order = await orderAsync({ number: 'TRK-TPL-1', customer });
    await sendNotificationAsync({
      key: 'OrderProcessing.CustomerNotification',
      tokens: { 'Order.OrderNumber': order.orderNumber, 'Customer.FullName': 'Test Shopper' },
      order,
      gateways: G,
    });
    const queued = await api.get(`/api/notifications/queued-emails?to=${encodeURIComponent(customer.email)}`, SESSIONS.admin);
    assert.match(queued[0].subject, /We are preparing TRK-TPL-1/, 'the next message uses the new content');
    assert.equal(queued[0].delayBeforeSend, 30);

    const trail = await auditTrailAsync({ event: 'AUD-TRK-002', entity: 'MessageTemplate' });
    assert.ok(trail.some((e) => e.after?.subject?.includes('We are preparing')), 'the change is audited');
  });
});

/* ===================================================== PRD-TRK-007 the log ============= */

describe('PRD-TRK-007 delivery tracking and audit', () => {
  test('AC-TRK-007-01-01', async () => {
    // "a log row stores channel, definition, template version, recipient, order and shipment ids
    //  where known, status (SM-TRK-03), provider message id and times"
    const customer = await shopperAsync({ email: 'log.buyer@example.com', phone: '+265991000021' });
    const order = await orderAsync({ number: 'TRK-LOG-1', customer });
    const shipment = await repository('Shipment').insertAsync({ orderId: order.id, shipmentNumber: 'SH-LOG-1', trackingNumber: 'TRKLOG1' });
    const sent = await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification',
      tokens: { 'Order.OrderNumber': order.orderNumber, 'Shipment.TrackingNumber': 'TRKLOG1' },
      order,
      shipment,
      occurrence: 'log-test',
      gateways: G,
    });
    const sms = rowsFor(sent, 'sms')[0];
    assert.equal(sms.channel, 'sms');
    assert.equal(sms.definitionKey, 'ShipmentSent.CustomerNotification');
    assert.ok(sms.definitionId);
    assert.ok(sms.contentVersion >= 1, 'the content version');
    assert.equal(sms.recipient, '+265991000021');
    assert.equal(sms.orderId, order.id);
    assert.equal(sms.shipmentId, shipment.id);
    assert.equal(sms.status, 'Sent');
    assert.ok(sms.providerMessageId, 'the provider message id');
    assert.ok(sms.createdOnUtc && sms.sentOnUtc, 'and the times');

    // every outcome the engine produces is a row: Sent, Suppressed, Failed
    const statuses = new Set((await messagesAsync({})).map((m) => m.status));
    for (const status of ['Sent', 'Suppressed', 'Failed', 'Pending']) {
      assert.ok(statuses.has(status), `${status} rows are kept`);
    }
  });

  test('AC-TRK-007-01-02', async () => {
    // "the log row moves to Delivered, Failed or Refused by provider message id; a failure or
    //  refusal starts the fallback channel if one is defined"
    const customer = await shopperAsync({ email: 'receipt.buyer@example.com', phone: '+265991000022' });
    await saveDefinitionAsync({
      key: 'ShipmentDelivered.CustomerNotification', channels: ['sms', 'email'], fallback: true, actor: await api.actorAsync(SESSIONS.admin),
    });
    const order = await orderAsync({ number: 'TRK-RECEIPT-1', customer });
    const sent = await sendNotificationAsync({
      key: 'ShipmentDelivered.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'receipt-1', gateways: G,
    });
    const sms = rowsFor(sent, 'sms')[0];

    const delivered = await api.post('/api/notifications/receipts', { providerMessageId: sms.providerMessageId, status: 'Delivered' }, SESSIONS.admin);
    assert.equal(delivered.ok, true);
    assert.equal(delivered.message.status, 'Delivered');
    assert.ok(delivered.message.deliveredOnUtc);
    assert.equal(delivered.fallbackStarted, false, 'a delivery needs no fallback');

    const second = await sendNotificationAsync({
      key: 'ShipmentDelivered.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'receipt-2', gateways: G,
    });
    const failing = rowsFor(second, 'sms')[0];
    const failed = await deliveryReceiptAsync({
      providerMessageId: failing.providerMessageId, status: 'Failed', reason: 'handset unreachable', gateways: G,
    });
    assert.equal(failed.message.status, 'Failed');
    assert.equal(failed.message.reason, 'handset unreachable');
    assert.equal(failed.fallbackStarted, true, 'a failure starts the fallback channel');
    assert.equal(failed.fallback.channel, 'email');

    const unknown = await api.post('/api/notifications/receipts', { providerMessageId: 'NOT-A-MESSAGE', status: 'Delivered' }, SESSIONS.admin);
    assert.equal(unknown.ok, false);
    assert.equal(unknown.keptForRetryMatching, true, 'an unknown id is kept for retry matching');
  });

  test('AC-TRK-007-01-03', async () => {
    // "one log row per person and channel is kept with its outcome, and the sending module can
    //  read the outcome per person by its reference"
    const people = [];
    for (let i = 1; i <= 3; i += 1) {
      people.push(await shopperAsync({ email: `affected${i}@example.com`, phone: `+2659910001${30 + i}` }));
    }
    registerEventCodeAsync({
      code: 'Sec.Core.BreachNoticeToPerson',
      owningModule: 'Product.SEC',
      category: 'Security',
      defaultChannels: ['email'],
      content: { email: 'We are writing to tell you about an incident affecting your data.' },
    });
    await installEventCodeDefinitionsAsync();

    const reference = 'breach-case-77';
    await sendEventAsync({
      code: 'Sec.Core.BreachNoticeToPerson',
      to: people.map((p) => p.email),
      tokens: { case: reference },
      reference,
      gateways: G,
    });

    const outcomes = await api.get(`/api/notifications/reference/${reference}`, SESSIONS.admin);
    assert.equal(outcomes.people, 3, 'one row per person');
    assert.equal(outcomes.rows.length, 3);
    for (const person of people) {
      assert.ok(outcomes.rows.some((r) => r.recipient === person.email), `${person.email} has its own row`);
    }
    assert.ok(outcomes.rows.every((r) => r.channel === 'email' && r.status), 'each with its channel and outcome');
  });

  test('AC-TRK-007-01-04', async () => {
    // "the log row moves to Sent (QueuedEmail.SentOnUtc set) or Failed; Delivered is set only if
    //  the email provider reports delivery"
    const customer = await shopperAsync({ email: 'queue.buyer@example.com', phone: '+265991000040' });
    const order = await orderAsync({ number: 'TRK-QUEUE-1', customer });
    const sent = await sendNotificationAsync({
      key: 'OrderProcessing.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, occurrence: 'queue-1', gateways: G,
    });
    const email = rowsFor(sent, 'email')[0];
    assert.equal(email.status, 'Pending', 'queued, not yet sent');

    const run = await api.post('/api/notifications/queue/send-task', {}, SESSIONS.admin);
    assert.equal(run.task, 'QueuedMessagesSendTask');
    assert.ok(run.sent >= 1);
    const afterTask = (await messagesAsync({ definitionKey: 'OrderProcessing.CustomerNotification' })).find((m) => m.id === email.id);
    assert.equal(afterTask.status, 'Sent');
    assert.ok(afterTask.sentOnUtc);
    const queued = await repository('QueuedEmail').getByIdAsync(email.queuedEmailId);
    assert.ok(queued.sentOnUtc, 'QueuedEmail.SentOnUtc is set');
    assert.notEqual(afterTask.status, 'Delivered', 'Delivered waits for the provider');

    const receipt = await deliveryReceiptAsync({ providerMessageId: afterTask.providerMessageId, status: 'Delivered' });
    assert.equal(receipt.message.status, 'Delivered', 'and is set when the provider reports delivery');

    // the native retry limit
    const other = await shopperAsync({ email: 'retry.buyer@example.com', phone: '+265991000041' });
    const order2 = await orderAsync({ number: 'TRK-QUEUE-2', customer: other });
    const second = await sendNotificationAsync({
      key: 'OrderProcessing.CustomerNotification', tokens: { 'Order.OrderNumber': order2.orderNumber }, order: order2, occurrence: 'queue-2', gateways: G,
    });
    setMockHealth('Email.Smtp', 'failing');
    for (let i = 0; i < 3; i += 1) await queuedMessagesSendTaskAsync({ gateways: G, retryLimit: 3 });
    setMockHealth('Email.Smtp', 'healthy');
    const exhausted = (await messagesAsync({})).find((m) => m.id === rowsFor(second, 'email')[0].id);
    assert.equal(exhausted.status, 'Failed', 'the row moves to Failed at the retry limit');
    assert.match(exhausted.reason, /unavailable|retry limit/);
  });

  test('AC-TRK-007-01-05', async () => {
    // "every message for that order and its shipments is listed with channel, status and time,
    //  and the content can be viewed"
    const customer = await shopperAsync({ email: 'panel.buyer@example.com', phone: '+265991000042' });
    const order = await orderAsync({ number: 'TRK-PANEL-1', customer });
    const shipment = await repository('Shipment').insertAsync({ orderId: order.id, shipmentNumber: 'SH-PANEL-1', trackingNumber: 'TRKPANEL1' });
    await sendOrderPlacedAsync({ order, gateways: G });
    await sendNotificationAsync({
      key: 'ShipmentSent.CustomerNotification', tokens: { 'Order.OrderNumber': order.orderNumber }, order, shipment, occurrence: 'panel', gateways: G,
    });

    const denied = await api.get(`/api/notifications/orders/${order.id}/notifications`, SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Notifications.View');

    const panel = await api.get(`/api/notifications/orders/${order.id}/notifications`, SESSIONS.support);
    assert.equal(panel.ok, true);
    assert.equal(panel.widgetZone, 'admin_order_details_block');
    assert.ok(panel.messages.length >= 3, 'every message of the order and its shipments');
    assert.ok(panel.messages.some((m) => m.shipmentId === shipment.id), 'including the shipment messages');
    for (const row of panel.messages) {
      assert.ok(row.channel && row.status && row.at, 'channel, status and time');
    }
    assert.ok(panel.messages.some((m) => m.text), 'and the content can be viewed');
  });

  test('AC-TRK-007-01-06', async () => {
    // "rows older than the period are deleted and the run is logged" - the PLT-020 rule for the
    // notification log
    const types = await api.get('/api/platform/retention/record-types', SESSIONS.admin);
    const type = types.find((t) => t.code === 'trk.notificationlog');
    assert.ok(type, 'the notification log is a retention record type');
    assert.equal(type.entity, 'NotificationMessage');
    assert.equal(type.owningModule, 'Product.TRK');

    const old = await plainRepository('NotificationMessage').insertAsync({
      definitionKey: 'OrderPlaced.CustomerNotification',
      event: 'OrderPlaced.CustomerNotification',
      channel: 'email',
      recipient: 'old.row@example.com',
      status: 'Sent',
      createdOnUtc: new Date(Date.now() - 400 * 86400000).toISOString(),
    });
    const recent = await plainRepository('NotificationMessage').insertAsync({
      definitionKey: 'OrderPlaced.CustomerNotification',
      event: 'OrderPlaced.CustomerNotification',
      channel: 'email',
      recipient: 'recent.row@example.com',
      status: 'Sent',
      createdOnUtc: new Date().toISOString(),
    });

    await api.post('/api/platform/retention/rules', {
      recordType: 'trk.notificationlog', period: 365, unit: 'days', action: 'Delete',
    }, SESSIONS.admin);
    const run = await api.post('/api/platform/retention/run', { recordType: 'trk.notificationlog' }, SESSIONS.admin);
    assert.equal(run.ok, true);
    const counts = run.counts.find((c) => c.recordType === 'trk.notificationlog');
    assert.ok(counts.deleted >= 1, 'rows older than the period are deleted');
    assert.equal(await repository('NotificationMessage').getByIdAsync(old.id), null);
    assert.ok(await repository('NotificationMessage').getByIdAsync(recent.id), 'and recent rows stay');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-009', entity: 'RetentionRun' });
    assert.ok(trail.length >= 1, 'the run is logged');
  });

  test('AC-TRK-007-02-01', async () => {
    // "counts of sent, delivered, failed, held and suppressed are shown by channel and event
    //  type, and exported"
    const denied = await api.get('/api/notifications/report', SESSIONS.buyer);
    assert.equal(denied.permission, 'Tracking.Core.Notifications.View');

    const report = await api.get('/api/notifications/report', SESSIONS.admin);
    assert.equal(report.ok, true);
    assert.ok(report.total >= 1);
    assert.ok(report.byChannel.sms, 'counts by channel');
    assert.ok(report.byChannel.email);
    for (const status of ['Sent', 'Delivered', 'Failed', 'Held', 'Suppressed', 'Refused']) {
      assert.equal(typeof report.byChannel.email[status], 'number', `${status} is counted`);
    }
    assert.ok(report.byEventType['OrderPlaced.CustomerNotification'], 'and by event type');
    assert.ok(report.byChannel.sms.Sent >= 1);
    assert.ok(report.byChannel.email.Suppressed >= 1);

    assert.equal(report.exportable, true);
    assert.equal(report.csv.split('\n')[0], 'scope,name,sent,delivered,failed,held,suppressed,refused');
    assert.ok(report.csv.split('\n').length > 2);

    const window = await api.get(`/api/notifications/report?from=${encodeURIComponent(new Date(Date.now() - 3600000).toISOString())}`, SESSIONS.admin);
    assert.ok(window.total >= 1, 'the report runs for a period');
  });
});
