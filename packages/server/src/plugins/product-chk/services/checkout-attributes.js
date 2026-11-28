// CHK-015 checkout attributes.
//
// Prototype default - decision PH-INF pending (P-1): the B2B purchase-order number comes from an
// inference about the audience, not from a stated requirement, so the feature is built as the
// chapter's Proposed option and labelled until the phase decision is taken.
//
// The attributes themselves are the native CheckoutAttribute entity: a text box with length
// validation, values that carry a price adjustment and a tax category, and a condition on
// another attribute.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';

export const PROTOTYPE_DEFAULT = 'Prototype default - decision PH-INF pending';

const attributeRepo = () => repository('CheckoutAttribute');
const valueRepo = () => repository('CheckoutAttributeValue');

export const CONTROL_TYPES = ['TextBox', 'MultilineTextbox', 'DropdownList', 'RadioList', 'Checkboxes'];

/** An administrator's definition of one attribute (Catalog.CheckoutAttributes* guards the route). */
export async function saveAttributeAsync({
  id = null, name, attributeControlType = 'TextBox', isRequired = false,
  validationMinLength = null, validationMaxLength = null, displayOrder = 0,
  conditionAttributeId = null, conditionValue = null, storeId = 1, isActive = true,
  actor = 'administrator',
}) {
  if (!name) return { ok: false, message: 'an attribute needs a name' };
  if (!CONTROL_TYPES.includes(attributeControlType)) {
    return { ok: false, message: `${attributeControlType} is not a kind of field` };
  }
  const row = {
    name,
    attributeControlType,
    isRequired: isRequired === true,
    validationMinLength: validationMinLength === null ? null : Number(validationMinLength),
    validationMaxLength: validationMaxLength === null ? null : Number(validationMaxLength),
    maxLength: validationMaxLength === null ? null : Number(validationMaxLength),
    displayOrder: Number(displayOrder) || 0,
    conditionAttributeId: conditionAttributeId ?? null,
    conditionValue: conditionValue ?? null,
    isActive: isActive !== false,
    storeId: Number(storeId),
  };
  const existing = id ? await attributeRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await attributeRepo().updateAsync({ ...existing, ...row })
    : await attributeRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: 'PRD-CHK-015',
    entity: 'CheckoutAttribute',
    entityId: saved.id,
    actor,
    storeId,
    before: existing ?? null,
    after: saved,
    note: existing ? 'checkout attribute changed' : 'checkout attribute created',
  });
  return { ok: true, attribute: saved, prototypeDefault: PROTOTYPE_DEFAULT };
}

export async function saveAttributeValueAsync({
  id = null, attributeId, name, priceAdjustment = 0, taxCategoryId = null, displayOrder = 0,
  isPreSelected = false, storeId = 1,
}) {
  const attribute = await attributeRepo().getByIdAsync(attributeId);
  if (!attribute) return { ok: false, message: 'unknown checkout attribute' };
  const row = {
    attributeId: Number(attributeId),
    name,
    priceAdjustment: Number(priceAdjustment) || 0,
    taxCategoryId: taxCategoryId ?? null,
    displayOrder: Number(displayOrder) || 0,
    isPreSelected: isPreSelected === true,
    storeId: Number(storeId),
  };
  const existing = id ? await valueRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await valueRepo().updateAsync({ ...existing, ...row })
    : await valueRepo().insertAsync(row);
  return { ok: true, value: saved };
}

/**
 * The attributes the checkout shows, in order, each with its values. An attribute with a
 * condition is marked so the step can show or hide it as the other attribute changes
 * (AC-CHK-015-02-02).
 */
export async function attributesForAsync({ storeId = 1, values = {} } = {}) {
  const rows = (await attributeRepo().getAllAsync((a) => a.isActive !== false
    && (a.storeId == null || Number(a.storeId) === Number(storeId))))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const out = [];
  for (const attribute of rows) {
    const attributeValues = (await valueRepo().getAllAsync((v) => Number(v.attributeId) === Number(attribute.id)))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const condition = attribute.conditionAttributeId
      ? {
        attributeId: attribute.conditionAttributeId,
        value: attribute.conditionValue,
        met: String(values[attribute.conditionAttributeId] ?? '') === String(attribute.conditionValue),
      }
      : null;
    out.push({
      id: attribute.id,
      name: attribute.name,
      controlType: attribute.attributeControlType,
      isRequired: attribute.isRequired === true,
      validationMinLength: attribute.validationMinLength ?? null,
      validationMaxLength: attribute.validationMaxLength ?? null,
      values: attributeValues.map((v) => ({
        id: v.id, name: v.name, priceAdjustment: v.priceAdjustment, taxCategoryId: v.taxCategoryId, isPreSelected: v.isPreSelected,
      })),
      condition,
      shown: condition ? condition.met : true,
    });
  }
  return { attributes: out, prototypeDefault: PROTOTYPE_DEFAULT };
}

/**
 * AC-CHK-015-01-01: what the shopper entered is required where the client says so and checked
 * against the length the client set, before it is stored with the order.
 */
export async function validateAttributesAsync({ storeId = 1, values = {} } = {}) {
  const { attributes } = await attributesForAsync({ storeId, values });
  const fieldErrors = {};
  for (const attribute of attributes) {
    if (!attribute.shown) continue;
    const value = values[attribute.id] ?? values[attribute.name] ?? '';
    const text = String(value ?? '').trim();
    if (attribute.isRequired && !text) {
      fieldErrors[attribute.id] = 'This field is required.';
      continue;
    }
    if (!text) continue;
    if (attribute.validationMinLength && text.length < attribute.validationMinLength) {
      fieldErrors[attribute.id] = `Please give at least ${attribute.validationMinLength} characters.`;
    }
    if (attribute.validationMaxLength && text.length > attribute.validationMaxLength) {
      fieldErrors[attribute.id] = `Please keep this under ${attribute.validationMaxLength} characters.`;
    }
  }
  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    attributes,
  };
}

/**
 * AC-CHK-015-02-01: the fee of the selected values, with the tax category each one carries, so
 * the order total and its tax follow the client's own configuration.
 */
export async function attributeFeeAsync({ storeId = 1, values = {} } = {}) {
  const { attributes } = await attributesForAsync({ storeId, values });
  const chosen = [];
  let fee = 0;
  for (const attribute of attributes) {
    if (!attribute.shown) continue;
    const value = values[attribute.id] ?? values[attribute.name] ?? null;
    if (value === null || value === '') continue;
    const picked = attribute.values.find((v) => String(v.id) === String(value) || v.name === String(value));
    if (!picked) continue;
    fee += Number(picked.priceAdjustment ?? 0);
    chosen.push({
      attributeId: attribute.id,
      attribute: attribute.name,
      value: picked.name,
      priceAdjustment: Number(picked.priceAdjustment ?? 0),
      taxCategoryId: picked.taxCategoryId ?? null,
    });
  }
  return {
    fee: Number(fee.toFixed(2)),
    chosen,
    taxCategories: [...new Set(chosen.map((c) => c.taxCategoryId).filter((x) => x !== null))],
  };
}

/** What is stored with the order, in the native CheckoutAttributeDescription shape. */
export async function describeAttributesAsync({ storeId = 1, values = {} } = {}) {
  const { attributes } = await attributesForAsync({ storeId, values });
  const parts = [];
  for (const attribute of attributes) {
    if (!attribute.shown) continue;
    const value = values[attribute.id] ?? values[attribute.name] ?? null;
    if (value === null || value === '') continue;
    const picked = attribute.values.find((v) => String(v.id) === String(value) || v.name === String(value));
    parts.push(`${attribute.name}: ${picked?.name ?? value}`);
  }
  return { description: parts.join('; ') || null, parts };
}
