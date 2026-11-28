// PAY-001 payment method framework and routing.
//
// BR-PAY-001: a method is shown only if it is active, allowed for the store and the customer
// role, and every routing rule that applies to it allows it (all rules must allow - the
// Proposed reading of AC-PAY-001-02-04).
// BR-PAY-002 fixes the dimensions a rule may use. Two of them are read from another module and
// never stored here: the location type comes from the LOG-004 coverage area
// (ServiceArea.LocationType, AC-PAY-001-02-05) and the service type from the CAT-026
// ServiceListing of the item. PAY keeps no data of its own for either.

import { paymentMethodsFor } from '@product/mocks';
import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { registerProvider } from '../../../core/providers.js';
import { checkoutConnectors, connectorFor } from './connector.js';

const ruleRepo = () => repository('PaymentRoutingRule');

/** BR-PAY-002: the dimensions a routing rule may be written against. */
export const RULE_DIMENSION = {
  store: 'store',
  country: 'country',
  customerRole: 'customerRole',
  locationType: 'locationType',
  fulfilment: 'fulfilment',
  serviceType: 'serviceType',
  orderValue: 'orderValue',
  seller: 'seller',
  item: 'item',
};

export const RULE_OPERATOR = { in: 'in', notIn: 'notIn', range: 'range' };

const DIMENSION_LABEL = {
  store: 'shop',
  country: 'country',
  customerRole: 'customer type',
  locationType: 'rural or urban location',
  fulfilment: 'pickup or delivery',
  serviceType: 'type of service',
  orderValue: 'order value',
  seller: 'seller',
  item: 'item',
};

/** The additional fee a method carries until PAY-015 fee schedules are built. */
const FEE_KEY = (systemName) => `pay.additionalfee.${String(systemName).toLowerCase()}`;

export async function saveRuleAsync({
  id = null, methodSystemName, dimension, operator = RULE_OPERATOR.in, values = [],
  isActive = true, storeId = 1, actor = 'administrator',
}) {
  if (!Object.values(RULE_DIMENSION).includes(dimension)) {
    return { ok: false, message: `${dimension} is not a routing dimension (BR-PAY-002)` };
  }
  if (!Object.values(RULE_OPERATOR).includes(operator)) {
    return { ok: false, message: `${operator} is not a routing operator` };
  }
  const row = {
    methodSystemName,
    dimension,
    operator,
    values: Array.isArray(values) ? values : [values],
    isActive: isActive !== false,
    storeId: Number(storeId),
  };
  const saved = id
    ? await ruleRepo().updateAsync({ ...(await ruleRepo().getByIdAsync(Number(id))), ...row })
    : await ruleRepo().insertAsync({ ...row, createdOnUtc: new Date().toISOString() });
  await auditAsync({
    event: 'AUD-PAY-002',
    area: 'PAY',
    feature: 'PRD-PAY-001',
    entity: 'PaymentRoutingRule',
    entityId: saved.id,
    actor,
    storeId,
    after: row,
    note: `routing rule for ${methodSystemName} on ${DIMENSION_LABEL[dimension]}`,
  });
  return { ok: true, rule: saved };
}

export async function setRuleActiveAsync({ id, isActive, actor = 'administrator' }) {
  const rule = await ruleRepo().getByIdAsync(Number(id));
  if (!rule) return { ok: false, message: 'no such routing rule' };
  const saved = await ruleRepo().updateAsync({ ...rule, isActive: isActive === true });
  await auditAsync({
    event: 'AUD-PAY-002',
    area: 'PAY',
    feature: 'PRD-PAY-001',
    entity: 'PaymentRoutingRule',
    entityId: rule.id,
    actor,
    before: { isActive: rule.isActive },
    after: { isActive: saved.isActive },
    note: 'a routing rule was switched',
  });
  return { ok: true, rule: saved };
}

export async function rulesAsync({ methodSystemName = null, storeId = null } = {}) {
  const rows = await ruleRepo().getAllAsync();
  return rows
    .filter((r) => (methodSystemName ? r.methodSystemName === methodSystemName : true))
    .filter((r) => (storeId === null ? true : Number(r.storeId) === Number(storeId)))
    .map((r) => ({ ...r, dimensionLabel: DIMENSION_LABEL[r.dimension] }));
}

/* ============================================ AC-PAY-001-01-01 / 01-02 activation ====== */

/**
 * The native activation list (PaymentSettings.ActivePaymentMethodSystemNames). Deactivating a
 * method takes it out of every store's checkout; the orders already paid with it keep their
 * records, because nothing on an order is touched here (AC-PAY-001-01-01).
 */
export async function setMethodActiveAsync({
  systemName, active, storeId = 1, actor = 'administrator',
}) {
  const current = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', storeId, []);
  const list = Array.isArray(current) ? [...current] : [];
  const was = list.includes(systemName);
  const next = active === true
    ? (was ? list : [...list, systemName])
    : list.filter((s) => s !== systemName);
  await saveSettingAsync('paymentsettings.activepaymentmethodsystemnames', next, Number(storeId), 'admin');
  await auditAsync({
    event: 'AUD-PAY-002',
    area: 'PAY',
    feature: 'PRD-PAY-001',
    entity: 'PaymentMethod',
    entityId: systemName,
    actor,
    storeId,
    before: { active: was },
    after: { active: active === true },
    note: active === true ? 'a payment method was activated' : 'a payment method was deactivated',
  });
  const paidWithIt = (await repository('Order').getAllAsync((o) => o.paymentMethodSystemName === systemName)).length;
  return {
    ok: true,
    activeSystemNames: next,
    existingOrdersKept: paidWithIt,
    independentMethod: true,
    rule: 'AC-PAY-001-01-01 / AC-PAY-001-01-02',
  };
}

/* ====================================== the two reads PAY does not own ================= */

/**
 * AC-PAY-001-02-05: the location type is read from the LOG-004 coverage area that the delivery
 * address or pickup point falls in. An address in no coverage area matches no rural or urban
 * rule, so a rule on that dimension cannot allow the method.
 */
export async function locationTypeAsync({ address = null, pickupPointId = null } = {}) {
  const areas = await repository('ServiceArea').getAllAsync();
  if (!areas.length) {
    return {
      locationType: null, source: 'LOG-004 ServiceArea', covered: false, reason: 'no coverage area is defined (LOG-004)',
    };
  }
  if (pickupPointId !== null && pickupPointId !== undefined) {
    const point = await repository('PickupPoint').getByIdAsync(Number(pickupPointId));
    const match = point ? areas.find((a) => (a.servingStorePickupPointIds ?? []).map(Number).includes(Number(point.id))) : null;
    if (match) {
      return {
        locationType: match.locationType ?? null, source: 'LOG-004 ServiceArea', covered: true, areaId: match.id,
      };
    }
  }
  const district = address?.district ?? address?.stateProvince ?? null;
  const postcode = address?.postalCode ?? null;
  const match = areas.find((a) => {
    const byDistrict = a.county && district ? String(a.county).toLowerCase() === String(district).toLowerCase() : false;
    const byPostcode = a.postalCodePattern && postcode
      ? new RegExp(`^${String(a.postalCodePattern).replace(/\*/g, '.*')}$`, 'i').test(String(postcode))
      : false;
    return byDistrict || byPostcode;
  }) ?? null;
  return match
    ? {
      locationType: match.locationType ?? null, source: 'LOG-004 ServiceArea', covered: true, areaId: match.id,
    }
    : {
      locationType: null, source: 'LOG-004 ServiceArea', covered: false, reason: 'the address is in no coverage area (LOG-004)',
    };
}

/** The service types of the cart, read from the CAT-026 ServiceListing rows of its products. */
export const cartLines = (cart) => (Array.isArray(cart) ? cart : (cart?.items ?? []));

export async function serviceTypesAsync(cart = []) {
  const listings = await repository('ServiceListing').getAllAsync();
  if (!listings.length) return [];
  const ids = cartLines(cart).map((line) => Number(line.productId));
  return [...new Set(listings
    .filter((l) => ids.includes(Number(l.productId)))
    .map((l) => l.serviceTypeId)
    .filter((v) => v !== null && v !== undefined))];
}

/* ======================================================== BR-PAY-001 evaluation ======== */

const matches = (rule, actual) => {
  const values = (rule.values ?? []).map((v) => (typeof v === 'string' ? v.toLowerCase() : v));
  if (rule.operator === RULE_OPERATOR.range) {
    const [min, max] = values;
    const value = Number(actual);
    if (Number.isNaN(value)) return false;
    if (min !== null && min !== undefined && value < Number(min)) return false;
    if (max !== null && max !== undefined && value > Number(max)) return false;
    return true;
  }
  const list = Array.isArray(actual) ? actual : [actual];
  const normalised = list
    .filter((v) => v !== null && v !== undefined)
    .map((v) => (typeof v === 'string' ? v.toLowerCase() : v));
  const hit = normalised.some((v) => values.includes(v));
  return rule.operator === RULE_OPERATOR.notIn ? !hit : hit;
};

/**
 * BR-PAY-001 for one method. `context` carries the values of the dimensions; a dimension with no
 * value (an address in no coverage area, a cart with no service) cannot satisfy an `in` rule.
 */
export async function evaluateMethodAsync({ systemName, rules, context }) {
  const applicable = rules.filter((r) => r.methodSystemName === systemName && r.isActive !== false);
  const refusals = [];
  for (const rule of applicable) {
    const actual = context[rule.dimension];
    const allowed = matches(rule, actual);
    if (!allowed) {
      refusals.push({
        ruleId: rule.id,
        dimension: rule.dimension,
        dimensionLabel: DIMENSION_LABEL[rule.dimension],
        operator: rule.operator,
        values: rule.values,
        actual: actual ?? null,
        explanation: actual === null || actual === undefined
          ? `this order has no ${DIMENSION_LABEL[rule.dimension]} to match`
          : `the ${DIMENSION_LABEL[rule.dimension]} of this order is not allowed for the method`,
      });
    }
  }
  return {
    allowed: refusals.length === 0,
    rulesApplied: applicable.length,
    refusals,
    rule: 'BR-PAY-001 (every applicable rule must allow)',
  };
}

const roleNames = (customer) => (customer?.roles ?? []).map((r) => String(r));

/**
 * The list the payment step shows (AC-PAY-001-03-01) and the list the placement validator
 * re-checks (AC-PAY-001-03-03).
 */
export async function methodsForCheckoutAsync({
  storeId = 1, cart = [], customer = null, fulfilment = null, address = null, pickupPointId = null,
  multiSeller = false, total = null, sellerIds = [], countryCode = null,
}) {
  const active = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', storeId, []);
  const activeList = Array.isArray(active) ? active : [];
  const adapters = paymentMethodsFor(activeList);
  const rules = await rulesAsync({ storeId });
  const location = await locationTypeAsync({ address, pickupPointId });
  const lines = cartLines(cart);
  const serviceTypes = await serviceTypesAsync(lines);
  const country = countryCode ?? address?.countryCode ?? null;

  const context = {
    store: Number(storeId),
    country,
    customerRole: roleNames(customer),
    locationType: location.locationType,
    fulfilment,
    serviceType: serviceTypes,
    orderValue: total,
    seller: sellerIds.map(Number),
    item: lines.map((line) => Number(line.productId)),
  };

  const available = [];
  const excluded = [];
  for (const adapter of adapters) {
    const connector = connectorFor(adapter.systemName);
    const entry = {
      systemName: adapter.systemName,
      name: adapter.name,
      kind: adapter.kind,
      capture: adapter.capture,
      requiresPhone: adapter.requiresPhone,
      offlineAtCounter: adapter.offlineAtCounter,
      supportsGroupPayment: adapter.supportsGroupPayment,
      methodType: connector?.methodType ?? 'Standard',
      feature: adapter.feature,
      additionalFee: await getSettingAsync(FEE_KEY(adapter.systemName), storeId, 0),
      logo: `payment-${String(adapter.kind)}`,
    };

    // the native country restriction, kept alongside the new rules (section 10.2)
    const restricted = await getSettingAsync(
      `paymentmethodrestictions.${String(adapter.systemName).toLowerCase()}`, 0, [],
    );
    if (country && Array.isArray(restricted) && restricted.includes(country)) {
      excluded.push({
        ...entry,
        reason: 'country-restriction',
        explanation: 'This method is not offered in this country.',
        citation: 'setting paymentmethodrestictions.<systemname> (native; source spelling)',
      });
      continue;
    }

    // BR-PAY-014 / AC-PAY-011-04-06: one payment for several sub-orders needs group support
    if (multiSeller && adapter.supportsGroupPayment !== true) {
      excluded.push({
        ...entry,
        reason: 'no-group-support',
        explanation: 'This method cannot take one payment for a cart that is split between sellers.',
        citation: 'BR-PAY-014 / AC-PAY-011-04-06 (IC-PAY-02 group payment)',
      });
      continue;
    }

    const verdict = await evaluateMethodAsync({ systemName: adapter.systemName, rules, context });
    if (!verdict.allowed) {
      excluded.push({
        ...entry,
        reason: 'routing-rule',
        explanation: verdict.refusals[0].explanation,
        refusals: verdict.refusals,
        citation: 'BR-PAY-001',
      });
      continue;
    }
    available.push({ ...entry, rulesApplied: verdict.rulesApplied });
  }

  if (!available.length) {
    const supportContact = await supportContactAsync(storeId);
    return {
      available,
      excluded,
      activeSystemNames: activeList,
      locationType: location,
      stopCheckout: true,
      messageKey: 'Pay.NoMethodAvailable',
      message: resource('Pay.NoMethodAvailable'),
      supportContact,
      rule: 'AC-PAY-001-03-02',
    };
  }
  return {
    available, excluded, activeSystemNames: activeList, locationType: location, stopCheckout: false,
  };
}

/**
 * "with the support contact" (AC-PAY-001-03-02 and AC-PAY-011-01-01). No contact value is stated
 * in either client source, so it is a setting with no default; the native company phone number is
 * used when the pack states one.
 */
export async function supportContactAsync(storeId = 1) {
  const stated = await getSettingAsync('pay.supportcontact', storeId, null);
  if (stated) return { value: stated, key: 'pay.supportcontact' };
  const phone = await getSettingAsync('storeinformationsettings.companyphonenumber', storeId, null);
  if (phone) return { value: phone, key: 'storeinformationsettings.companyphonenumber' };
  return {
    value: null,
    key: 'pay.supportcontact',
    notStatedInSource: true,
    note: 'the support contact is not stated in either client source; the pack supplies it',
  };
}

/* ============================================= IC-PAY-03 placement validator =========== */

/**
 * AC-PAY-001-03-03: the routing check runs again on the final cart inside the CHK-003 placement
 * override, before payment. If the chosen method is no longer allowed, placement stops with
 * Pay.MethodNotAllowed and no order is placed.
 */
export async function routingValidatorAsync({
  storeId = 1, cart = [], customer = null, paymentMethodSystemName = null, groups = [], totals = null,
  total = null, fulfilment: fulfilmentIn = null, address = null, shippingAddress = null,
  pickupPointId: pickupPointIn = null, sellerIds: sellerIdsIn = null, multiSeller: multiSellerIn = null,
  session = null,
}) {
  if (!paymentMethodSystemName) return { ok: true };
  const list = Array.isArray(groups) ? groups : [];
  const multiSeller = multiSellerIn ?? list.length > 1;
  const fulfilment = fulfilmentIn ?? (list.length
    ? [...new Set(list.map((g) => g.fulfilment ?? 'delivery'))]
    : null);
  const pickupPointId = pickupPointIn ?? list.find((g) => g.pickupPointId)?.pickupPointId ?? null;
  const offer = await methodsForCheckoutAsync({
    storeId,
    cart,
    customer,
    fulfilment,
    address: address ?? shippingAddress,
    pickupPointId,
    multiSeller,
    total: totals?.total ?? total ?? null,
    sellerIds: sellerIdsIn ?? list.map((g) => g.vendorId),
  });
  const chosen = offer.available.find((m) => m.systemName === paymentMethodSystemName);
  if (chosen) return { ok: true, method: paymentMethodSystemName, revalidated: true };
  const refused = offer.excluded.find((m) => m.systemName === paymentMethodSystemName) ?? null;
  await repository('CheckoutException').insertAsync({
    kind: 'payment-method-not-allowed',
    checkoutReference: session?.reference ?? null,
    feature: 'PRD-PAY-001',
    message: refused?.explanation ?? 'the chosen payment method is no longer allowed for this order',
    createdOnUtc: new Date().toISOString(),
  });
  return {
    ok: false,
    messageKey: 'Pay.MethodNotAllowed',
    message: resource('Pay.MethodNotAllowed'),
    check: 'payment method',
    step: 'payment-method',
    reason: refused?.reason ?? 'not-offered',
    refusals: refused?.refusals ?? [],
    citation: 'AC-PAY-001-03-03 / BR-PAY-001',
  };
}

/** Registers the PAY validators with the CHK-003 placement host (IC-PAY-03 = IC-CHK-02). */
export function registerRoutingValidator() {
  return registerProvider('IC-CHK-02', {
    area: 'PAY',
    feature: 'PRD-PAY-001',
    name: 'payment routing (BR-PAY-001)',
    order: 10,
    fn: routingValidatorAsync,
  });
}

/** The admin list: every checkout adapter with its rules, for the routing-rules page. */
export async function methodAdminListAsync({ storeId = 1 } = {}) {
  const active = await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', storeId, []);
  const activeList = Array.isArray(active) ? active : [];
  const rules = await rulesAsync({ storeId });
  return {
    methods: checkoutConnectors().map((connector) => ({
      systemName: connector.systemName,
      name: connector.name,
      methodType: connector.methodType,
      recurringPaymentType: connector.recurringPaymentType,
      feature: connector.feature,
      active: activeList.includes(connector.systemName),
      supportsGroupPayment: connector.supportsGroupPayment,
      capabilities: connector.capabilities,
      rules: rules.filter((r) => r.methodSystemName === connector.systemName),
    })),
    dimensions: Object.entries(DIMENSION_LABEL).map(([value, label]) => ({ value, label })),
    operators: Object.values(RULE_OPERATOR),
    coverageAreaSource: 'LOG-004 coverage areas (ServiceArea.LocationType)',
  };
}
