// PRD-IAM-014 Profile and address book, PRD-IAM-015 Delivery and notification preferences.
//
// The native customer information page and address book are the surfaces; this service holds the
// product rules on top of them: a mobile-number identifier changes only after a code sent to the
// new number (BR-IAM-010), an email change follows the native revalidation when the registration
// type is EmailValidation, and GdprSettings.LogUserProfileChanges writes the change to the GDPR
// log, which IAM-017 reads.
// The preferred pickup point is a StorePickupPoint of PRD-LOG-003; the preferred channel is one
// of the channels the notification engine (PRD-TRK-005) has configured, and PRD-TRK-006 reads it.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { normalisePhoneAsync, identityForPhoneAsync, savePhoneIdentityAsync } from './phone.js';
import { requestCodeAsync, verifyCodeAsync } from './otp.js';
import { recordAuthEventAsync } from './auth-events.js';

const customerRepo = () => repository('Customer');
const addressRepo = () => repository('Address');
const gdprRepo = () => repository('GdprLog');

export const PROFILE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'company', 'dateOfBirth', 'gender'];

/** The native GDPR log. IAM-017 reads it; nothing edits or deletes a row. */
export async function logGdprAsync({
  customerId, requestType, customerInfo = null, note = null,
}) {
  return gdprRepo().insertAsync({
    customerId, requestType, customerInfo, note, createdOnUtc: new Date().toISOString(),
  });
}

export const gdprLogAsync = (customerId = null) => gdprRepo()
  .getAllAsync((r) => (customerId ? r.customerId === customerId : true));

/* ============================================================ PRD-IAM-014 the profile === */

/** AC-IAM-014-01-01: name, phone and email are saved; an email change may need revalidation. */
export async function updateProfileAsync({ customer, changes, storeId = 1 }) {
  const row = await customerRepo().getByIdAsync(customer.id);
  if (!row) return { ok: false, message: 'no such account' };
  const offered = Object.fromEntries(Object.entries(changes)
    .filter(([field]) => PROFILE_FIELDS.includes(field)));
  const ignored = Object.keys(changes).filter((f) => !PROFILE_FIELDS.includes(f));

  // the mobile number that is the account identifier changes only through the code flow
  const identifier = await identityForPhoneAsync(row.phone);
  const phoneIsIdentifier = row.registeredBy === 'mobile' || (identifier && identifier.customerId === row.id && !row.email);
  let phoneHeld = null;
  if (offered.phone !== undefined && phoneIsIdentifier) {
    phoneHeld = offered.phone;
    delete offered.phone;
  }

  const registrationType = await getSettingAsync('customersettings.userregistrationtype', storeId, 'Standard');
  let revalidation = null;
  if (offered.email !== undefined && offered.email !== row.email) {
    const taken = await customerRepo().getOneAsync((c) => c.email === offered.email && c.id !== row.id && !c.deleted);
    if (taken) return { ok: false, messageKey: 'Account.EmailAlreadyExists', message: 'That email address already has an account.' };
    if (registrationType === 'EmailValidation') {
      revalidation = { emailToRevalidate: offered.email, template: 'Customer.EmailRevalidationMessage' };
      delete offered.email;
    }
  }

  const before = Object.fromEntries(Object.keys(offered).map((f) => [f, row[f] ?? null]));
  const updated = await customerRepo().updateAsync({
    ...row,
    ...offered,
    ...(revalidation ? { emailToRevalidate: revalidation.emailToRevalidate } : {}),
  });

  // GdprSettings.LogUserProfileChanges
  const logProfileChanges = await getSettingAsync('gdprsettings.loguserprofilechanges', storeId, true);
  let gdprEntry = null;
  if (logProfileChanges === true && Object.keys(offered).length) {
    gdprEntry = await logGdprAsync({
      customerId: row.id, requestType: 'ProfileChanged', note: `changed: ${Object.keys(offered).join(', ')}`,
    });
  }
  await auditAsync({
    event: 'AUD-IAM-008', area: 'IAM', feature: 'PRD-IAM-014', entity: 'Customer', entityId: row.id, actor: row.email ?? row.phone, before, after: offered, note: 'the owner changed their profile',
  });
  return {
    ok: true,
    customer: { ...updated, password: undefined },
    saved: Object.keys(offered),
    ignoredFields: ignored,
    revalidationRequired: Boolean(revalidation),
    emailToRevalidate: revalidation?.emailToRevalidate ?? null,
    registrationType,
    gdprLogged: Boolean(gdprEntry),
    phoneChangeNeedsCode: phoneHeld ? { phone: phoneHeld, reason: 'the mobile number is the account identifier' } : null,
  };
}

/** AC-IAM-014-01-02: the new number replaces the identifier only after its code is entered. */
export async function requestPhoneChangeAsync({
  customer, phone, storeId = 1, smsProvider = null,
}) {
  const normalised = await normalisePhoneAsync(phone, storeId);
  if (!normalised) return { ok: false, message: 'that mobile number cannot be read' };
  // BR-IAM-002: a normalised mobile number belongs to at most one customer, whether it is already
  // an identifier or only the number on the record
  const held = await identityForPhoneAsync(normalised);
  const onAnotherRecord = await customerRepo().getOneAsync((c) => c.phone === normalised
    && c.id !== customer.id && !c.deleted);
  if ((held && held.customerId !== customer.id) || onAnotherRecord) {
    return { ok: false, messageKey: 'Iam.PhoneInUse', message: resource('Iam.PhoneInUse') };
  }
  const challenge = await requestCodeAsync({
    recipient: normalised, purpose: 'confirm-change', customerId: customer.id, storeId, channel: 'sms', smsProvider,
  });
  return { ...challenge, newPhone: normalised, identifierChanged: false };
}

export async function confirmPhoneChangeAsync({
  customer, phone, code, storeId = 1,
}) {
  const normalised = await normalisePhoneAsync(phone, storeId);
  const verified = await verifyCodeAsync({
    recipient: normalised, purpose: 'confirm-change', code, storeId,
  });
  if (!verified.ok) return { ...verified, identifierChanged: false };
  const row = await customerRepo().getByIdAsync(customer.id);
  const updated = await customerRepo().updateAsync({ ...row, phone: normalised });
  await savePhoneIdentityAsync({ customerId: row.id, normalisedPhone: normalised, verified: true });
  await logGdprAsync({ customerId: row.id, requestType: 'ProfileChanged', note: 'changed: phone' });
  await auditAsync({
    event: 'AUD-IAM-008', area: 'IAM', feature: 'PRD-IAM-014', entity: 'Customer', entityId: row.id, actor: row.email ?? row.phone, before: { phone: row.phone }, after: { phone: normalised }, note: 'the mobile-number identifier was changed after a code to the new number',
  });
  await recordAuthEventAsync({
    customerId: row.id, identifierTried: normalised, type: 'identifier-change', outcome: 'success', channel: 'sms-code', storeId,
  });
  return {
    ok: true, identifierChanged: true, customer: { ...updated, password: undefined }, phone: normalised,
  };
}

/* ====================================================== PRD-IAM-014 the address book ==== */

const addressFields = ['firstName', 'lastName', 'company', 'address1', 'address2', 'city', 'stateProvince', 'postalCode', 'country', 'phoneNumber', 'email'];

const publicAddress = (a) => ({ ...a, isDefault: a.isDefault === true });

/** AC-IAM-014-02-01 and 02-02: the list, with the default first and marked. */
export async function addressesAsync({ customerId }) {
  const rows = await addressRepo().getAllAsync((a) => a.customerId === customerId && !a.deleted);
  const sorted = rows.slice().sort((a, b) => (b.isDefault === true) - (a.isDefault === true) || a.id - b.id);
  return { addresses: sorted.map(publicAddress), total: sorted.length };
}

export async function addAddressAsync({ customerId, address }) {
  const values = Object.fromEntries(Object.entries(address).filter(([f]) => addressFields.includes(f)));
  const existing = await addressRepo().getAllAsync((a) => a.customerId === customerId && !a.deleted);
  const row = await addressRepo().insertAsync({
    ...values,
    customerId,
    deleted: false,
    isDefault: existing.length === 0, // the first address saved is the default
    createdOnUtc: new Date().toISOString(),
  });
  return { ok: true, address: publicAddress(row) };
}

export async function editAddressAsync({ customerId, addressId, address }) {
  const row = await addressRepo().getByIdAsync(addressId);
  if (!row || row.customerId !== customerId || row.deleted) return { ok: false, message: 'no such address' };
  const values = Object.fromEntries(Object.entries(address).filter(([f]) => addressFields.includes(f)));
  const updated = await addressRepo().updateAsync({ ...row, ...values });
  return { ok: true, address: publicAddress(updated) };
}

export async function deleteAddressAsync({ customerId, addressId }) {
  const row = await addressRepo().getByIdAsync(addressId);
  if (!row || row.customerId !== customerId) return { ok: false, message: 'no such address' };
  await addressRepo().updateAsync({ ...row, deleted: true, isDefault: false });
  // an address already copied to a placed order is not touched: the order keeps its own copy
  return { ok: true, deleted: addressId, ordersUnchanged: true };
}

export async function setDefaultAddressAsync({ customerId, addressId }) {
  const rows = await addressRepo().getAllAsync((a) => a.customerId === customerId && !a.deleted);
  if (!rows.some((a) => a.id === Number(addressId))) return { ok: false, message: 'no such address' };
  for (const row of rows) {
    await addressRepo().updateAsync({ ...row, isDefault: row.id === Number(addressId) });
  }
  const listed = await addressesAsync({ customerId });
  return { ok: true, ...listed, defaultAddressId: Number(addressId) };
}

/** AC-IAM-014-02-03: the saved addresses are offered at the address step, default pre-selected. */
export async function offeredAddressesAsync({ customerId }) {
  const { addresses } = await addressesAsync({ customerId });
  return {
    addresses,
    preSelectedAddressId: addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null,
    retypingRequired: addresses.length === 0,
    usedBy: 'PRD-CHK-001 address step',
  };
}

/* ======================================================= PRD-IAM-015 the preferences ==== */

const prefRepo = () => repository('CustomerPreference');

async function preferenceRowAsync(customerId) {
  return (await prefRepo().getOneAsync((p) => p.customerId === customerId))
    ?? prefRepo().insertAsync({ customerId, preferredPickupPointId: null, preferredChannel: null });
}

/** AC-IAM-015-02-01 and 02-02: the channels the notification engine has configured. */
export async function notificationChannelsAsync(storeId = 1) {
  const configured = await getSettingAsync('trk.channels', storeId, ['email', 'sms', 'whatsapp', 'inapp', 'app']);
  const appActive = await getSettingAsync('chn.appchannelactive', storeId, false);
  return {
    channels: configured.filter((c) => c !== 'app' || appActive === true),
    appOffered: appActive === true && configured.includes('app'),
    appRequires: 'PRD-CHN-001 / PRD-CHN-013',
    suppliedBy: 'PRD-TRK-005',
  };
}

export async function setPreferredChannelAsync({ customerId, channel, storeId = 1 }) {
  const { channels } = await notificationChannelsAsync(storeId);
  if (!channels.includes(channel)) {
    return { ok: false, message: `that channel is not offered for this store`, offered: channels };
  }
  const row = await preferenceRowAsync(customerId);
  const updated = await prefRepo().updateAsync({ ...row, preferredChannel: channel });
  return {
    ok: true, preferredChannel: updated.preferredChannel, readBy: 'PRD-TRK-006', appliesWhen: 'the event has no event-level preference',
  };
}

/** AC-IAM-015-01-01 and 01-02: the preferred pickup point, cleared when it is gone. */
export async function setPreferredPickupPointAsync({ customerId, pickupPointId }) {
  const point = await repository('StorePickupPoint').getByIdAsync(pickupPointId);
  if (!point) return { ok: false, message: 'no such pickup point' };
  const row = await preferenceRowAsync(customerId);
  const updated = await prefRepo().updateAsync({ ...row, preferredPickupPointId: point.id });
  return {
    ok: true, preferredPickupPointId: updated.preferredPickupPointId, pickupPoint: point, preSelectedAt: 'PRD-CHK-001 pickup option',
  };
}

export async function preferencesAsync({ customerId, storeId = 1 }) {
  const row = await preferenceRowAsync(customerId);
  const { channels } = await notificationChannelsAsync(storeId);
  let pickupPoint = row.preferredPickupPointId
    ? await repository('StorePickupPoint').getByIdAsync(row.preferredPickupPointId)
    : null;
  let cleared = null;
  if (row.preferredPickupPointId && (!pickupPoint || pickupPoint.open === false || pickupPoint.deleted === true)) {
    await prefRepo().updateAsync({ ...row, preferredPickupPointId: null });
    cleared = {
      messageKey: 'Iam.PickupPointUnavailable',
      message: resource('Iam.PickupPointUnavailable'),
      chooseAnother: true,
    };
    pickupPoint = null;
  }
  return {
    preferredPickupPointId: cleared ? null : row.preferredPickupPointId,
    pickupPoint,
    preferredChannel: row.preferredChannel,
    channelsOffered: channels,
    cleared,
  };
}
