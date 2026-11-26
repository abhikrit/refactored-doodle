// CHK-007 structured address capture.
//
// BR-CHK-011: an address must carry at least the locators the client rule requires (street
// address, landmark or pin); the rule is the client setting chk.address.locatorrule.
// Landmark, address name and PO box are native AddressAttribute values kept in
// Address.CustomAttributes; the coordinates are LOG-015's AddressGeo row (BR-LOG-140), never a
// column of CHK's own (AC-CHK-007-01-02).

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { saveAddressPinAsync, addressGeoAsync } from '../../product-log/services/estimates.js';

const addressRepo = () => repository('Address');
const attributeRepo = () => repository('AddressAttribute');

export const ATTRIBUTE = {
  landmark: 'Landmark',
  addressName: 'Address name',
  poBox: 'PO box',
};

/** The address attributes this store shows, with the required flag the client pack set. */
export async function addressAttributesAsync({ storeId = 1 } = {}) {
  const rows = await attributeRepo().getAllAsync();
  return rows
    .filter((a) => a.isActive !== false && (a.storeId == null || Number(a.storeId) === Number(storeId)))
    .map((a) => ({
      id: a.id,
      name: a.name,
      controlType: a.attributeControlType ?? 'TextBox',
      isRequired: a.isRequired === true,
      maxLength: a.maxLength ?? null,
      values: a.values ?? [],
      note: a.note ?? null,
    }));
}

/**
 * The address form of one country: the native AddressSettings county fields, the state/province
 * list of that country and the client's address attributes (AC-CHK-007-01-04, AC-CHK-007-02-01).
 */
export async function addressFormAsync({ storeId = 1, country = null } = {}) {
  const [countyEnabled, countyRequired, pinEnabled, locatorRule] = await Promise.all([
    getSettingAsync('addresssettings.countyenabled', storeId, false),
    getSettingAsync('addresssettings.countyrequired', storeId, false),
    getSettingAsync('chk.map.pinenabled', storeId, false),
    getSettingAsync('chk.address.locatorrule', storeId, []),
  ]);
  const countries = await repository('Country').getAllAsync((c) => c.published !== false);
  const chosen = country
    ? countries.find((c) => c.name === country || c.twoLetterIsoCode === country) ?? null
    : null;
  const states = chosen
    ? (await repository('StateProvince').getAllAsync((s) => Number(s.countryId) === Number(chosen.id))).map((s) => s.name)
    : [];

  return {
    countries: countries.map((c) => ({
      id: c.id, name: c.name, twoLetterIsoCode: c.twoLetterIsoCode, allowsBilling: c.allowsBilling !== false, allowsShipping: c.allowsShipping !== false,
    })),
    country: chosen?.name ?? null,
    county: { enabled: countyEnabled === true, required: countyRequired === true },
    statesProvinces: states,
    attributes: await addressAttributesAsync({ storeId }),
    mapPinEnabled: pinEnabled === true,
    locatorRule: Array.isArray(locatorRule) ? locatorRule : [],
  };
}

/** BR-CHK-011: at least one of the locators the client rule names must be given. */
export function locatorCheck({ values = {}, attributes = {}, pin = null, locatorRule = [] }) {
  if (!locatorRule.length) return { ok: true, rule: [], given: [] };
  const given = [];
  if (locatorRule.includes('street') && String(values.addressLine1 ?? '').trim()) given.push('street');
  if (locatorRule.includes('landmark') && String(attributes[ATTRIBUTE.landmark] ?? '').trim()) given.push('landmark');
  if (locatorRule.includes('pin') && pin && pin.latitude != null && pin.longitude != null) given.push('pin');
  if (given.length) return { ok: true, rule: locatorRule, given };
  return {
    ok: false,
    rule: locatorRule,
    given,
    messageKey: 'Chk.AddressLocatorRequired',
    message: resource('Chk.AddressLocatorRequired'),
  };
}

/**
 * Save one address: the native fields, the attribute values in CustomAttributes, and the pin
 * handed to LOG-015. Nothing is saved when the locator rule is not met (AC-CHK-007-01-03).
 */
export async function saveAddressAsync({
  id = null, customer = null, values = {}, attributes = {}, pin = null, storeId = 1,
}) {
  const form = await addressFormAsync({ storeId, country: values.country ?? null });

  const fieldErrors = {};
  for (const field of ['firstName', 'lastName', 'city', 'country']) {
    if (!String(values[field] ?? '').trim()) fieldErrors[field] = 'This field is required.';
  }
  if (form.county.enabled && form.county.required && !String(values.county ?? '').trim()) {
    fieldErrors.county = 'This field is required.';
  }
  for (const attribute of form.attributes) {
    if (attribute.isRequired && !String(attributes[attribute.name] ?? '').trim()) {
      fieldErrors[attribute.name] = 'This field is required.';
    }
    const value = attributes[attribute.name];
    if (value && attribute.maxLength && String(value).length > Number(attribute.maxLength)) {
      fieldErrors[attribute.name] = `Please keep this under ${attribute.maxLength} characters.`;
    }
  }
  if (pin && !form.mapPinEnabled) {
    return { ok: false, message: 'A map pin is not offered by this store.', saved: false };
  }

  const locator = locatorCheck({
    values, attributes, pin, locatorRule: form.locatorRule,
  });
  if (!locator.ok) {
    return {
      ok: false,
      saved: false,
      messageKey: locator.messageKey,
      message: locator.message,
      locatorRule: locator.rule,
      fieldErrors,
    };
  }
  if (Object.keys(fieldErrors).length) {
    return {
      ok: false, saved: false, fieldErrors, valuesKept: true, values, attributes,
    };
  }

  // only the attributes this store offers are stored, and under their own names
  const customAttributes = {};
  for (const attribute of form.attributes) {
    const value = attributes[attribute.name];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      customAttributes[attribute.name] = String(value).trim();
    }
  }

  const row = {
    customerId: customer?.id ?? null,
    firstName: values.firstName ?? null,
    lastName: values.lastName ?? null,
    email: values.email ?? null,
    phone: values.phone ?? null,
    addressLine1: values.addressLine1 ?? null,
    addressLine2: values.addressLine2 ?? null,
    city: values.city ?? null,
    county: form.county.enabled ? (values.county ?? null) : null,
    stateProvince: values.stateProvince ?? null,
    zip: values.zip ?? null,
    country: values.country ?? null,
    customAttributes,
  };
  const existing = id ? await addressRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await addressRepo().updateAsync({ ...existing, ...row })
    : await addressRepo().insertAsync(row);

  // AC-CHK-007-01-02: the coordinates go to LOG-015, keyed by AddressId with source "pin"
  let geo = null;
  if (pin && pin.latitude != null && pin.longitude != null) {
    geo = await saveAddressPinAsync({
      addressId: saved.id, latitude: pin.latitude, longitude: pin.longitude, source: 'pin',
    });
  }

  return {
    ok: true,
    saved: true,
    address: saved,
    customAttributes,
    geo: geo ? { addressId: geo.addressId, source: geo.source, storedBy: 'PRD-LOG-015' } : null,
    locatorsGiven: locator.given,
  };
}

/**
 * AC-CHK-007-03-01: what staff, the seller and the courier see on an order - the landmark beside
 * the address and the pin with a link to the map.
 */
export async function orderAddressAsync({ orderNumber = null, orderId = null }) {
  const order = orderId
    ? await repository('Order').getByIdAsync(orderId)
    : await repository('Order').getOneAsync((o) => o.orderNumber === orderNumber);
  if (!order) return null;
  const address = order.shippingAddress ?? order.billingAddress ?? null;
  if (!address) {
    return {
      orderNumber: order.orderNumber,
      address: null,
      pickup: order.pickUpInStore === true,
      landmark: null,
      addressName: null,
      poBox: null,
      pin: null,
      deliveryInstructions: order.deliveryInstructions ?? null,
    };
  }

  const addressId = address.id ?? null;
  const geo = addressId ? await addressGeoAsync(addressId) : null;
  const custom = address.customAttributes ?? {};
  return {
    orderNumber: order.orderNumber,
    address,
    landmark: custom[ATTRIBUTE.landmark] ?? null,
    addressName: custom[ATTRIBUTE.addressName] ?? null,
    poBox: custom[ATTRIBUTE.poBox] ?? null,
    pin: geo ? { latitude: geo.latitude, longitude: geo.longitude, mapUrl: geo.mapUrl, source: geo.source } : null,
    deliveryInstructions: order.deliveryInstructions ?? null,
  };
}
