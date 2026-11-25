// Mobile numbers and the PhoneIdentity table - PRD-IAM-002.
//
// BR-IAM-010: numbers are stored in international format; a number entered without the
// international prefix gets the calling code of the store default country.
// BR-IAM-002: a normalised mobile number belongs to at most one customer (unique index here).
// AC-IAM-002-01-08: Customer.Phone is kept equal to PhoneIdentity.NormalisedPhone, so the native
// lookup (GetCustomerByPhoneAsync) finds the account.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';

const phoneRepo = () => repository('PhoneIdentity');

/** Calling codes of the countries the two client packs use. */
const CALLING_CODES = { MW: '+265', KE: '+254', ZA: '+27', TZ: '+255', UG: '+256' };

export async function normalisePhoneAsync(input, storeId = 1) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/\D/g, '')}`;
  const country = await getSettingAsync('storeinformationsettings.defaultcountrytwoletterisocode', storeId, 'MW');
  const code = CALLING_CODES[country] ?? '+265';
  // a national number is written with a trunk zero; the international format drops it
  return `${code}${digits.replace(/^0+/, '')}`;
}

export const identityForPhoneAsync = (normalised) => phoneRepo().getOneAsync((p) => p.normalisedPhone === normalised);

export async function customerForPhoneAsync(normalised) {
  const identity = await identityForPhoneAsync(normalised);
  if (!identity) return null;
  const customer = await repository('Customer').getByIdAsync(identity.customerId);
  // the native lookup takes active, not deleted, verified number first
  if (!customer || customer.deleted || customer.active === false) return null;
  return customer;
}

/**
 * Save the number on the customer and in PhoneIdentity, keeping the two equal.
 * Returns { ok: false, messageKey: 'Iam.PhoneInUse' } when another account holds it.
 */
export async function savePhoneIdentityAsync({
  customerId, normalisedPhone, verified = false, isLoginIdentifier = true,
}) {
  const existing = await identityForPhoneAsync(normalisedPhone);
  if (existing && existing.customerId !== customerId) {
    return { ok: false, messageKey: 'Iam.PhoneInUse', nativeKey: 'Account.IsAlreadyExistsVerifiedPhoneNumber' };
  }
  const row = existing
    ? await phoneRepo().updateAsync({
      ...existing, verifiedOnUtc: verified ? new Date().toISOString() : existing.verifiedOnUtc, isLoginIdentifier,
    })
    : await phoneRepo().insertAsync({
      customerId,
      normalisedPhone,
      verifiedOnUtc: verified ? new Date().toISOString() : null,
      isLoginIdentifier,
    });
  const customer = await repository('Customer').getByIdAsync(customerId);
  if (customer) {
    await repository('Customer').updateAsync({
      ...customer, phone: normalisedPhone, phoneSmsVerified: verified || Boolean(customer.phoneSmsVerified),
    });
  }
  return { ok: true, identity: row };
}

export const phoneIdentitiesAsync = () => phoneRepo().getAllAsync();
