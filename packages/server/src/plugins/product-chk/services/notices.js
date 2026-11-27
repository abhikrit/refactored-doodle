// CHK-009 e-transactions consumer controls.
//
// BR-CHK-014 / decision ONE-RECORD: the notice set is the e-transactions part of the store
// country's CountryPrivacyProfile - the entity belongs to SEC-012 and CHK-009 owns these fields,
// read through IC-SEC-03. Notice texts are native Topics and policy versions are MKT-008's
// (IC-MKT-03). The acknowledgement itself is recorded by IAM through IC-IAM-05; CHK keeps only
// the link from the order to that acceptance.
//
// BR-CHK-013: the acknowledgements and the terms checkbox are enforced on the server by the CHK
// action filter on the confirm post, because those actions take no model.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';
import { getProfileAsync, saveOwnedFieldAsync, instanceCountryAsync } from '../../product-sec/services/privacy-profile.js';
import { recordAcceptanceAsync, effectiveVersionAsync } from '../../product-iam/services/privacy.js';

export const CHECKOUT_POINTS = ['cart', 'shipping', 'payment', 'confirm', 'completed'];

const linkRepo = () => repository('NoticeAcknowledgement');

/** The e-transactions part of the country profile, with its defaults made plain. */
export async function noticeProfileAsync({ storeId = 1, country = null } = {}) {
  const iso = country ?? await instanceCountryAsync(storeId);
  const profile = await getProfileAsync(iso, storeId);
  const eTransactions = profile.eTransactions ?? {};
  return {
    country: iso,
    notices: eTransactions.notices ?? [],
    confirmationTimeLimitHours: eTransactions.confirmationTimeLimitHours ?? null,
    ownedBy: 'PRD-CHK-009 fields of the SEC-012 country profile',
    readThrough: 'IC-SEC-03 GetProfile',
    profileMissing: profile.missing ?? [],
  };
}

/**
 * AC-CHK-009-01-01: an administrator sets which notice is shown at which checkout point. The
 * value is written back into the country profile, so the record stays SEC-012's one record.
 */
export async function saveNoticeAsync({
  checkpoint, topicSystemName, requiresAcknowledgement = false, scope = 'all', scopeValue = null,
  policySystemName = null, storeId = 1, country = null, actor = null, actorEmail = 'administrator',
  remove = false,
}) {
  if (!CHECKOUT_POINTS.includes(checkpoint)) {
    return { ok: false, message: `${checkpoint} is not a checkout point` };
  }
  const iso = country ?? await instanceCountryAsync(storeId);
  const current = await noticeProfileAsync({ storeId, country: iso });
  const notices = current.notices.filter((n) => !(n.checkpoint === checkpoint
    && n.topicSystemName === topicSystemName));
  if (!remove) {
    notices.push({
      checkpoint,
      topicSystemName,
      requiresAcknowledgement: requiresAcknowledgement === true,
      scope,
      scopeValue,
      policySystemName,
    });
  }
  // the record is SEC-012's one record: the write goes through its own service and its own
  // permission check (decision ONE-RECORD)
  const saved = await saveOwnedFieldAsync({
    country: iso,
    storeId,
    field: 'eTransactions',
    owner: 'PRD-CHK-009',
    actorEmail,
    value: { notices, confirmationTimeLimitHours: current.confirmationTimeLimitHours },
  });
  if (saved.ok === false) return { ok: false, ...saved };
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: 'PRD-CHK-009',
    entity: 'CountryPrivacyProfile',
    entityId: iso,
    actor: actorEmail,
    storeId,
    before: { notices: current.notices },
    after: { notices },
    note: remove ? 'a checkout notice was removed' : 'a checkout notice was set',
  });
  return { ok: saved.ok !== false, notices, country: iso };
}

export async function setConfirmationTimeLimitAsync({
  hours, storeId = 1, country = null, actor = null, actorEmail = 'administrator',
}) {
  const iso = country ?? await instanceCountryAsync(storeId);
  const current = await noticeProfileAsync({ storeId, country: iso });
  const saved = await saveOwnedFieldAsync({
    country: iso,
    storeId,
    field: 'eTransactions',
    owner: 'PRD-CHK-009',
    actorEmail,
    value: { notices: current.notices, confirmationTimeLimitHours: Number(hours) },
  });
  if (saved.ok === false) return { ok: false, ...saved };
  return { ok: true, confirmationTimeLimitHours: Number(hours), country: iso };
}

/** The text of a notice: a native Topic, and for a policy topic its effective version. */
async function noticeTextAsync({ notice, storeId = 1 }) {
  const topic = await repository('Topic').getOneAsync((t) => t.systemName === notice.topicSystemName);
  const version = notice.policySystemName
    ? await effectiveVersionAsync({ policySystemName: notice.policySystemName, storeId })
    : null;
  return {
    ...notice,
    title: topic?.title ?? notice.topicSystemName,
    body: topic?.body ?? null,
    topicFound: Boolean(topic),
    version: version ? version.versionNo : null,
    versionSuppliedBy: version ? 'IC-MKT-03 GetEffectivePolicyVersion' : null,
    textIsVersioned: Boolean(version),
  };
}

/**
 * AC-CHK-009-01-01 and 04-01: the notices of one checkout point, with the data-protection
 * consent texts of the same profile where that point carries them.
 */
export async function noticesForAsync({
  checkpoint, storeId = 1, cart = null, customer = null,
}) {
  const profile = await noticeProfileAsync({ storeId });
  const full = await getProfileAsync(profile.country, storeId);
  const applies = (notice) => {
    if (notice.scope === 'all' || !notice.scope) return true;
    const lines = cart?.items ?? [];
    if (notice.scope === 'category') {
      return lines.some((l) => (l.product?.categoryIds ?? []).map(String).includes(String(notice.scopeValue)));
    }
    if (notice.scope === 'product') {
      return lines.some((l) => String(l.productId) === String(notice.scopeValue));
    }
    if (notice.scope === 'service type') {
      return lines.some((l) => String(l.product?.serviceType ?? '') === String(notice.scopeValue));
    }
    return true;
  };
  const shown = [];
  for (const notice of profile.notices.filter((n) => n.checkpoint === checkpoint).filter(applies)) {
    shown.push(await noticeTextAsync({ notice, storeId }));
  }
  return {
    checkpoint,
    country: profile.country,
    notices: shown,
    consentTexts: checkpoint === 'confirm' ? full.display?.consentTexts ?? null : null,
    customerId: customer?.id ?? null,
  };
}

/**
 * AC-CHK-009-02-01 and 02-03: which acknowledgements the confirm step must ask for. Nothing is
 * asked where no item, category or service type in the cart requires one.
 */
export async function acknowledgementsRequiredAsync({ cart, storeId = 1, customer = null }) {
  const shown = await noticesForAsync({
    checkpoint: 'confirm', storeId, cart, customer,
  });
  const required = shown.notices.filter((n) => n.requiresAcknowledgement === true);
  return {
    required,
    anyRequired: required.length > 0,
    messageKey: required.length ? 'Chk.AcknowledgementRequired' : null,
  };
}

/**
 * BR-CHK-013: the server-side filter on the confirm post. It refuses the placement when an
 * acknowledgement the cart needs is missing, so a direct post cannot skip it.
 */
export async function confirmFilterAsync({
  cart, storeId = 1, customer = null, acknowledgements = [], termsAccepted = null,
}) {
  const needed = await acknowledgementsRequiredAsync({ cart, storeId, customer });
  const given = new Set((acknowledgements ?? []).map(String));
  const missing = needed.required.filter((n) => !given.has(String(n.topicSystemName)));
  if (missing.length) {
    return {
      ok: false,
      refused: true,
      messageKey: 'Chk.AcknowledgementRequired',
      message: resource('Chk.AcknowledgementRequired'),
      missing: missing.map((n) => n.topicSystemName),
      enforcedBy: 'the CHK action filter on the confirm post (BR-CHK-013)',
    };
  }
  const termsOnConfirm = await getSettingAsync('ordersettings.termsofserviceonorderconfirmpage', storeId, false);
  if (termsOnConfirm === true && termsAccepted !== true) {
    return {
      ok: false,
      refused: true,
      messageKey: 'Chk.TermsRequired',
      message: resource('Chk.TermsRequired'),
      enforcedBy: 'the CHK action filter on the confirm post (BR-CHK-013)',
    };
  }
  return { ok: true, acknowledged: [...given], required: needed.required.map((n) => n.topicSystemName) };
}

/**
 * AC-CHK-009-02-02: the acceptance is IAM's record (IC-IAM-05). CHK keeps only the link of
 * order, notice and the acceptance id it was given (AUD-CHK-002).
 */
export async function recordAcknowledgementsAsync({
  order, customer, acknowledgements = [], storeId = 1, ipAddress = null, agentId = null,
}) {
  const links = [];
  for (const topicSystemName of acknowledgements) {
    const profile = await noticeProfileAsync({ storeId });
    const notice = profile.notices.find((n) => n.topicSystemName === topicSystemName) ?? null;
    const acceptance = await recordAcceptanceAsync({
      customerId: customer?.id ?? null,
      policySystemName: notice?.policySystemName ?? topicSystemName,
      decision: 'accepted',
      channel: 'checkout',
      ipAddress,
      agentId,
      storeId,
    });
    const link = await linkRepo().insertAsync({
      orderId: order?.id ?? null,
      orderNumber: order?.orderNumber ?? null,
      topicSystemName,
      policySystemName: notice?.policySystemName ?? null,
      iamAcceptanceId: acceptance.id,
      versionNo: acceptance.versionNo ?? 'unversioned',
      storeId,
      createdOnUtc: new Date().toISOString(),
    });
    await auditAsync({
      event: 'AUD-CHK-002',
      area: 'CHK',
      feature: 'PRD-CHK-009',
      entity: 'NoticeAcknowledgement',
      entityId: link.id,
      actor: customer?.email ?? 'storefront',
      storeId,
      after: { orderNumber: order?.orderNumber ?? null, topicSystemName, iamAcceptanceId: acceptance.id },
      note: 'the shopper acknowledged a notice at checkout',
    });
    links.push(link);
  }
  return {
    links,
    acceptanceRecordedBy: 'PRD-IAM-016 through IC-IAM-05 RecordAcceptance',
    chkStores: 'only the link of order, notice and acceptance id (decision ONE-RECORD)',
  };
}

export const acknowledgementsForOrderAsync = (orderNumber) => linkRepo()
  .getAllAsync((l) => l.orderNumber === orderNumber);

/**
 * AC-CHK-009-03-01: the confirmation is queued at placement; if it is still unsent when the
 * country's time limit passes, the order joins the checkout exceptions list and staff are
 * alerted.
 */
export async function overdueConfirmationsAsync({ storeId = 1, now = null } = {}) {
  const profile = await noticeProfileAsync({ storeId });
  const limit = Number(profile.confirmationTimeLimitHours ?? 0);
  if (!limit) {
    return {
      limitHours: null, overdue: [], note: 'this country sets no confirmation time limit',
    };
  }
  const at = now ? new Date(now) : new Date();
  const messages = await repository('NotificationMessage').getAllAsync((m) => m.channel === 'email'
    && ['OrderPlaced.CustomerNotification', 'Chk.OrderPlacedGroup'].includes(m.event));
  const overdue = [];
  for (const message of messages) {
    if (message.sentOnUtc) continue;
    const queuedAt = Date.parse(message.createdOnUtc ?? message.queuedOnUtc ?? at.toISOString());
    const hours = (at.getTime() - queuedAt) / 3600000;
    if (hours < limit) continue;
    const orderNumber = message.tokens?.['order number'] ?? null;
    const reference = message.tokens?.reference ?? null;
    const already = await repository('CheckoutException').getOneAsync((e) => e.kind === 'unsent-confirmation'
      && (e.orderNumber === orderNumber || e.checkoutReference === reference));
    const row = already ?? await repository('CheckoutException').insertAsync({
      kind: 'unsent-confirmation',
      orderNumber,
      checkoutReference: reference,
      message: `The order confirmation has not been sent within ${limit} hours.`,
      feature: 'PRD-CHK-009',
      permission: 'Checkout.Core.Exceptions.View',
      storeId,
      state: 'Open',
      createdOnUtc: new Date().toISOString(),
    });
    overdue.push({
      orderNumber, reference, hoursWaiting: Number(hours.toFixed(1)), exceptionId: row.id, staffAlerted: true,
    });
  }
  return { limitHours: limit, overdue, country: profile.country };
}
