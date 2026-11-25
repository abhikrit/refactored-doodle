// PRD-PLT-003 US-03: parameter overrides and the deviation record.
//
// BR-PLT-017: a client default comes from the client pack. An override at transaction-type or
// transaction level needs a reason, is recorded as a deviation with the pack value, the override
// value, the reason and the user, and is audited (AUD-PLT-012).
// BR-PLT-011: a native setting resolves only by store and shared value, so an override naming a
// native setting key is refused (Plt.OverrideNotAllowed).

import { repository, plainRepository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { settingsCatalogue } from '../../../core/pack-loader.js';
import { repoRoot } from './platform.js';

const deviationRepo = () => plainRepository('ConfigurationDeviation');

/** Is this the name of a native Setting row rather than a pack parameter? */
export function isNativeSettingKey(name) {
  const cat = settingsCatalogue(repoRoot());
  const key = String(name).toLowerCase();
  if (!key.includes('.')) return false;
  const [className, ...rest] = key.split('.');
  const property = rest.join('.');
  return Boolean(cat.nativeClasses?.[className]?.[property] !== undefined)
    || Boolean(cat.removedIn500?.[key]) || Boolean(cat.movedIn500?.[key]);
}

const refuseNative = (name) => ({
  ok: false,
  refused: true,
  messageKey: 'Plt.OverrideNotAllowed',
  message: `${resource('Plt.OverrideNotAllowed')} (${name})`,
  reason: 'a native setting resolves only by store and shared value',
  rules: ['BR-PLT-011', 'BR-PLT-017'],
});

const needReason = () => ({
  ok: false,
  needsReason: true,
  messageKey: 'Plt.OverrideReasonRequired',
  message: resource('Plt.OverrideReasonRequired'),
});

/** The value a parameter has for a transaction type: the type override, else the client value. */
export async function effectiveParameterAsync({ typeCode, parameter, storeId = 1 }) {
  const packKey = `plt.clientparameter.${parameter.toLowerCase()}`;
  const clientValue = await getSettingAsync(packKey, storeId, undefined);
  const override = await deviationRepo().getOneAsync((d) => d.level === 'transaction-type'
    && d.typeCode === typeCode && d.parameter === parameter && d.active !== false);
  return {
    parameter,
    typeCode,
    value: override ? override.value : clientValue,
    source: override ? 'the type override' : (clientValue === undefined ? 'the type default' : 'the client pack'),
    clientValue: clientValue === undefined ? null : clientValue,
    packKey,
    overridden: Boolean(override),
    reason: override?.reason ?? null,
  };
}

/** AC-PLT-003-03-01: a type-level override, recorded as a deviation. */
export async function setTypeOverrideAsync({
  typeCode, parameter, value, reason = null, actor = 'administrator', storeId = 1,
}) {
  if (isNativeSettingKey(parameter)) return refuseNative(parameter);
  if (!reason) return needReason();
  const type = await repository('TransactionType').getOneAsync((t) => t.code === typeCode);
  if (!type) return { ok: false, message: `no transaction type ${typeCode}` };
  const before = await effectiveParameterAsync({ typeCode, parameter, storeId });

  const existing = await deviationRepo().getOneAsync((d) => d.level === 'transaction-type'
    && d.typeCode === typeCode && d.parameter === parameter);
  const row = existing
    ? await deviationRepo().updateAsync({
      ...existing, value, reason, actor, active: true, recordedOnUtc: new Date().toISOString(),
    })
    : await deviationRepo().insertAsync({
      level: 'transaction-type',
      typeCode,
      parameter,
      packValue: before.clientValue,
      value,
      reason,
      actor,
      active: true,
      rule: 'BR-PLT-017',
      recordedOnUtc: new Date().toISOString(),
    });
  await auditAsync({
    event: 'AUD-PLT-012',
    area: 'PLT',
    feature: 'PRD-PLT-003',
    entity: 'TransactionType',
    entityId: typeCode,
    actor,
    before: { [parameter]: before.value },
    after: { [parameter]: value, reason },
    storeId,
    note: 'transaction-type parameter overridden',
  });
  return {
    ok: true,
    deviation: row,
    packValue: before.clientValue,
    value,
    reason,
    actor,
    appliesTo: `transactions of ${typeCode}`,
    otherTypesUse: 'the client value',
  };
}

/** AC-PLT-003-03-02: a transaction-level override. A reason is required. */
export async function setTransactionOverrideAsync({
  transactionId, typeCode, parameter, value, reason = null, actor = 'operator', storeId = 1,
}) {
  if (isNativeSettingKey(parameter)) return refuseNative(parameter);
  if (!reason) return needReason();
  const before = await effectiveParameterAsync({ typeCode, parameter, storeId });
  const row = await deviationRepo().insertAsync({
    level: 'transaction',
    transactionId,
    typeCode,
    parameter,
    packValue: before.clientValue,
    typeValue: before.value,
    value,
    reason,
    actor,
    rule: 'BR-PLT-017',
    recordedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-PLT-012',
    area: 'PLT',
    feature: 'PRD-PLT-003',
    entity: 'Transaction',
    entityId: transactionId,
    actor,
    before: { [parameter]: before.value },
    after: { [parameter]: value, reason },
    storeId,
    note: 'transaction parameter overridden',
  });
  return {
    ok: true, deviation: row, value, reason, actor,
  };
}

export const deviationsAsync = (filter = {}) => deviationRepo()
  .getAllAsync((d) => (!filter.level || d.level === filter.level)
    && (!filter.typeCode || d.typeCode === filter.typeCode));
