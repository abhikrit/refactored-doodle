// PRD-SEC-014 Data classification and masking. Held by decision DP-01, so this builds the PRD's
// Proposed option and labels it "Prototype default - decision DP-01 pending".
//
// BR-SEC-060: masking fails closed. If a masking rule cannot be applied the value is not shown
// at all - never the raw value.
// IC-SEC-04 GetFieldClass / Mask is the contract the result filter, the export override, the log
// writer and the CRM-003 360-degree view all read.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';

/** The classes of FC-M21-004. */
export const CLASSES = ['Public', 'Internal', 'Confidential', 'Restricted', 'Personal', 'Financial'];

export const MASKING_RULES = ['none', 'last-four', 'last-two', 'email', 'ip-last-octet', 'hidden', 'redacted'];

/**
 * The classification the prototype ships with (Proposed, decision DP-01 pending). Every row is a
 * setting: a client changes it without code.
 */
export const DEFAULT_CLASSIFICATION = [
  {
    entity: 'Customer', field: 'phone', class: 'Personal', masking: 'last-four', unmaskedFor: ['Administrators', 'Support'],
  },
  {
    entity: 'Customer', field: 'email', class: 'Personal', masking: 'email', unmaskedFor: ['Administrators', 'Support'],
  },
  {
    entity: 'Customer', field: 'dateOfBirth', class: 'Personal', masking: 'hidden', unmaskedFor: ['Administrators'],
  },
  {
    entity: 'Customer', field: 'vatNumber', class: 'Financial', masking: 'last-four', unmaskedFor: ['Administrators', 'Finance'],
  },
  {
    entity: 'Address', field: 'phoneNumber', class: 'Personal', masking: 'last-four', unmaskedFor: ['Administrators', 'Support'],
  },
  {
    entity: 'PaymentTransaction', field: 'accountNumber', class: 'Financial', masking: 'last-four', unmaskedFor: ['Administrators', 'Finance'],
  },
  {
    entity: 'AuthEvent', field: 'ipAddress', class: 'Personal', masking: 'ip-last-octet', unmaskedFor: ['Administrators', 'SecurityOfficer'],
  },
  {
    entity: 'VerificationCase', field: 'identifier', class: 'Restricted', masking: 'last-four', unmaskedFor: ['Administrators'],
  },
];

export const PROTOTYPE_DEFAULT_LABEL = 'Prototype default - decision DP-01 pending';

export const classificationAsync = (storeId = 1) => getSettingAsync('sec.dataclassification', storeId, DEFAULT_CLASSIFICATION);

/** IC-SEC-04 GetFieldClass. */
export async function fieldClassAsync({ entity, field, storeId = 1 }) {
  const rows = await classificationAsync(storeId);
  const row = rows.find((r) => r.entity === entity && r.field === field);
  return row
    ? {
      ...row, classified: true, contract: 'IC-SEC-04', heldBy: 'DP-01', prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
    }
    : {
      entity, field, class: null, masking: 'none', classified: false, contract: 'IC-SEC-04',
    };
}

/** AC-SEC-014-01-01: the class and the rule are saved and audited. */
export async function setFieldClassAsync({
  entity, field, class: klass, masking, unmaskedFor = ['Administrators'], actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.DataClassification.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Security.Core.DataClassification.CreateEditDelete' };
  }
  if (!CLASSES.includes(klass)) return { ok: false, message: `the class is one of ${CLASSES.join(', ')}`, classes: CLASSES };
  if (!MASKING_RULES.includes(masking)) return { ok: false, message: `the masking rule is one of ${MASKING_RULES.join(', ')}` };
  const rows = await classificationAsync(storeId);
  const existing = rows.find((r) => r.entity === entity && r.field === field);
  const next = [
    ...rows.filter((r) => !(r.entity === entity && r.field === field)),
    {
      entity, field, class: klass, masking, unmaskedFor,
    },
  ];
  await saveSettingAsync('sec.dataclassification', next, 0);
  await auditAsync({
    event: 'AUD-SEC-009',
    area: 'SEC',
    feature: 'PRD-SEC-014',
    entity: 'DataClassification',
    entityId: `${entity}.${field}`,
    actor: by,
    before: existing ? { class: existing.class, masking: existing.masking } : null,
    after: { class: klass, masking },
    storeId,
    note: 'data classification changed',
  });
  return {
    ok: true,
    classification: {
      entity, field, class: klass, masking, unmaskedFor,
    },
    heldBy: 'DP-01',
    prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
  };
}

/* ------------------------------------------------------------------- the masking --------- */

function applyRule(rule, value) {
  const text = String(value);
  switch (rule) {
    case 'none': return text;
    case 'last-four': return text.length <= 4 ? '*'.repeat(text.length) : `${'*'.repeat(text.length - 4)}${text.slice(-4)}`;
    case 'last-two': return text.length <= 2 ? '*'.repeat(text.length) : `${'*'.repeat(text.length - 2)}${text.slice(-2)}`;
    case 'email': {
      const [local, domain] = text.split('@');
      if (!domain) throw new Error('not an email address');
      return `${local.slice(0, 1)}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
    }
    case 'ip-last-octet': {
      if (text.includes(':')) return [...text.split(':').slice(0, 3), '0', '0', '0', '0', '0'].slice(0, 8).join(':');
      const octets = text.split('.');
      if (octets.length !== 4) throw new Error('not an IPv4 address');
      return [...octets.slice(0, 3), '0'].join('.');
    }
    case 'hidden': return '••••••';
    case 'redacted': return '[redacted]';
    default: throw new Error(`unknown masking rule ${rule}`);
  }
}

/**
 * IC-SEC-04 Mask. BR-SEC-060: if the rule cannot be applied the value is not shown.
 * A user whose role is on the field's unmasked list, or who holds
 * Security.Core.UnmaskedData.View, sees the value in full.
 */
export async function maskAsync({
  entity, field, value, user = null, storeId = 1,
}) {
  const classification = await fieldClassAsync({ entity, field, storeId });
  if (!classification.classified || classification.masking === 'none' || value === null || value === undefined) {
    return {
      value, masked: false, class: classification.class, contract: 'IC-SEC-04',
    };
  }
  const roles = user?.roles ?? [];
  const byRole = (classification.unmaskedFor ?? []).some((r) => roles.includes(r));
  const byPermission = user ? await authorizeAsync('Security.Core.UnmaskedData.View', user) : false;
  if (byRole || byPermission) {
    return {
      value,
      masked: false,
      class: classification.class,
      unmaskedBecause: byRole ? 'the role is on the unmasked list for this field' : 'the user holds Security.Core.UnmaskedData.View',
      contract: 'IC-SEC-04',
    };
  }
  try {
    return {
      value: applyRule(classification.masking, value),
      masked: true,
      class: classification.class,
      masking: classification.masking,
      contract: 'IC-SEC-04',
    };
  } catch (err) {
    // fail closed
    return {
      value: null,
      masked: true,
      shown: false,
      failedClosed: true,
      reason: err.message,
      rule: 'BR-SEC-060',
      class: classification.class,
    };
  }
}

/** AC-SEC-014-02-01: the global result filter over an admin grid or page. */
export async function maskRowsAsync({
  entity, rows, user = null, storeId = 1,
}) {
  const classification = (await classificationAsync(storeId)).filter((r) => r.entity === entity);
  const out = [];
  for (const row of rows) {
    const copy = { ...row };
    for (const rule of classification) {
      if (copy[rule.field] === undefined) continue;
      const result = await maskAsync({
        entity, field: rule.field, value: copy[rule.field], user, storeId,
      });
      if (result.shown === false) delete copy[rule.field];
      else copy[rule.field] = result.value;
    }
    out.push(copy);
  }
  return { rows: out, maskedFields: classification.map((r) => r.field), filter: 'the SEC global result filter' };
}

/** AC-SEC-014-02-02: Reveal, with AUD-SEC-008. */
export async function revealAsync({
  entity, field, entityId, user, by, storeId = 1,
}) {
  if (!await authorizeAsync('Security.Core.UnmaskedData.View', user)) {
    return { ok: false, denied: true, permission: 'Security.Core.UnmaskedData.View' };
  }
  const row = await repository(entity).getByIdAsync(entityId);
  if (!row) return { ok: false, message: 'no such record' };
  await auditAsync({
    event: 'AUD-SEC-008',
    area: 'SEC',
    feature: 'PRD-SEC-014',
    entity,
    entityId,
    actor: by,
    after: { field, revealed: true },
    storeId,
    note: 'masked value revealed',
  });
  return {
    ok: true, value: row[field] ?? null, field, masked: false, auditEvent: 'AUD-SEC-008',
  };
}

/** AC-SEC-014-02-03: the SEC override of IExportManager. */
export async function exportRowsAsync({
  entity, rows, user = null, purpose = 'staff', storeId = 1,
}) {
  // the customer's own GDPR export is the one place the values are not masked (IAM-017)
  if (purpose === 'gdpr-subject-export') {
    return {
      rows, masked: false, reason: 'the data subject\'s own export under PRD-IAM-017', overrideOf: 'IExportManager',
    };
  }
  const masked = await maskRowsAsync({
    entity, rows, user, storeId,
  });
  return {
    rows: masked.rows, masked: true, maskedFields: masked.maskedFields, overrideOf: 'IExportManager',
  };
}

/** AC-SEC-014-02-04: a classified field in a log or audit entry is masked or redacted. */
export async function maskForLogAsync({ entity, values, storeId = 1 }) {
  const classification = (await classificationAsync(storeId)).filter((r) => r.entity === entity);
  const out = { ...values };
  const applied = [];
  for (const rule of classification) {
    if (out[rule.field] === undefined || out[rule.field] === null) continue;
    const result = await maskAsync({
      entity, field: rule.field, value: out[rule.field], user: null, storeId,
    });
    out[rule.field] = result.shown === false ? '[redacted]' : result.value;
    applied.push({ field: rule.field, class: result.class, masking: rule.masking });
  }
  return { values: out, applied };
}

/**
 * AC-SEC-014-02-05: the CRM-003 360-degree view reads the class and rule from here, so its own
 * masked-field list is no longer used; the reveal right stays with the CRM permission.
 */
export async function crmFieldRulesAsync({ entity = 'Customer', storeId = 1 } = {}) {
  const enabled = await getSettingAsync('sec.dataclassificationenabled', storeId, true);
  const rows = (await classificationAsync(storeId)).filter((r) => r.entity === entity);
  return {
    enabled: enabled === true,
    source: enabled === true ? 'IC-SEC-04' : 'the CRM-003 list',
    crmOwnListUsed: enabled !== true,
    fields: rows.map((r) => ({ field: r.field, class: r.class, masking: r.masking })),
    revealPermission: 'Crm.Core.CustomerView.Unmask',
    note: 'the reveal right for the 360-degree view stays with the CRM permission',
  };
}
