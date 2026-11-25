// PRD-PLT-005 Configuration export, import and promotion.
//
// BR-PLT-013: a secret never travels in a pack. The export omits it and lists the key in the
// manifest as "to be entered".
// BR-PLT-014: instance-bound items (store names, URLs, hosts, company details, logos, e-mail
// accounts) are not promoted or cloned; they are listed for entry in the target instance.
// Entity data is not part of a configuration export: a data backup is PRD-PLT-016.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plainRepository, repository } from '../../../core/repository.js';
import { allSettingsAsync, getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { applyPackChainAsync, checksumOf } from '../../../core/pack-loader.js';
import { repoRoot } from './platform.js';
import { changeSetFromDifferencesAsync, compareSnapshots } from './change-control.js';

const SECRET_SUFFIX = /(secret|password|passkey|apikey|api_key|privatekey|accesstoken|token|credential|credentials|consumerkey)$/i;
const isSecret = (key) => SECRET_SUFFIX.test(String(key).split('.').pop());

/** BR-PLT-014: what belongs to one instance and never travels. */
export const INSTANCE_BOUND_KEYS = [
  'storeinformationsettings.storename',
  'storeinformationsettings.storeurl',
  'storeinformationsettings.companyname',
  'storeinformationsettings.companyaddress',
  'storeinformationsettings.companyphonenumber',
  'storeinformationsettings.companyvat',
  'storeinformationsettings.logopictureid',
  'hostingconfig.useproxy',
  'hostingconfig.forwardedprotoheadername',
  'hostingconfig.forwardedforheadername',
  'hostingconfig.knownproxies',
  'hostingconfig.knownnetworks',
  'emailaccountsettings.defaultemailaccountid',
];
export const INSTANCE_BOUND_PREFIXES = ['sec.adapterendpoint.', 'sec.countryprofile.', 'sec.edgeprotection', 'sec.dataresidency'];

const instanceBound = (key) => INSTANCE_BOUND_KEYS.includes(key)
  || INSTANCE_BOUND_PREFIXES.some((prefix) => key.startsWith(prefix));

export const productRelease = () => {
  try {
    const baseline = JSON.parse(readFileSync(join(repoRoot(), 'platform', 'baseline.json'), 'utf8'));
    return baseline.productRelease ?? baseline.tag ?? 'release-5.00.1';
  } catch { return 'release-5.00.1'; }
};

/** AC-PLT-005-01-01 and 01-02: the export. */
export async function exportConfigurationAsync({
  actor, by, instanceCode = null, storeId = 1, excludeInstanceBound = false,
}) {
  if (!await authorizeAsync('Platform.Core.Packs.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Packs.CreateEditDelete' };
  }
  const rows = await allSettingsAsync();
  const stores = await repository('Store').getAllAsync();
  const codeOf = (id) => stores.find((s) => s.id === id)?.code ?? String(id);

  const settings = {};
  const storeEntries = {};
  const secretsToEnter = [];
  const instanceBoundExcluded = [];
  for (const row of rows) {
    if (isSecret(row.name)) { secretsToEnter.push(row.name); continue; }
    if (excludeInstanceBound && instanceBound(row.name)) { instanceBoundExcluded.push(row.name); continue; }
    if (row.storeId === 0) settings[row.name] = row.value;
    else {
      const code = codeOf(row.storeId);
      (storeEntries[code] ||= {})[row.name] = row.value;
    }
  }

  const features = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!key.startsWith('productfeature.')) continue;
    delete settings[key];
    features[key.replace('productfeature.', '').toUpperCase()] = value;
  }

  const permissions = {};
  for (const row of await plainRepository('PermissionRecordCustomerRoleMapping').getAllAsync()) {
    (permissions[row.systemName] ||= []).push(row.roleSystemName);
  }

  const pack = {
    layer: 'client',
    id: instanceCode ?? (await getSettingAsync('plt.instancecode', storeId, 'EXPORT')),
    name: 'Exported configuration',
    version: new Date().toISOString().slice(0, 10),
    settings,
    features,
    permissions,
    stores: storeEntries,
  };
  const manifest = {
    instanceCode: pack.id,
    productRelease: productRelease(),
    exportedOnUtc: new Date().toISOString(),
    exportedBy: by,
    checksum: checksumOf(pack),
    secretsToEnter,
    instanceBoundExcluded,
    entityDataIncluded: false,
    entityDataNote: 'a data backup is PRD-PLT-016, not a configuration export',
    schemaSection: '10.1',
  };
  await auditAsync({
    event: 'AUD-PLT-006',
    area: 'PLT',
    feature: 'PRD-PLT-005',
    entity: 'ConfigurationExport',
    entityId: manifest.checksum,
    actor: by,
    after: {
      instanceCode: manifest.instanceCode, keys: Object.keys(settings).length, secretsToEnter: secretsToEnter.length,
    },
    storeId,
    note: 'configuration exported',
  });
  return {
    ok: true,
    pack,
    manifest,
    file: { name: `configuration-${pack.id}-${pack.version}.json`, contentType: 'application/json' },
    layers: ['client', 'store'],
    storeEntriesKeyedBy: 'store code',
  };
}

/** AC-PLT-005-02-01 and 02-02: the import, through the PLT-003 loader. */
export async function importConfigurationAsync({
  pack, manifest, actor, by, storeId = 1, countryPackId = null,
  conflictChoices = null, conflictChoice = null,
}) {
  if (!await authorizeAsync('Platform.Core.Packs.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Packs.CreateEditDelete' };
  }
  const here = productRelease();
  const from = manifest?.productRelease ?? null;
  const releaseNumber = (release) => Number(String(release).replace(/[^0-9.]/g, '').split('.').slice(0, 2).join('.')) || 0;
  if (from && releaseNumber(from) > releaseNumber(here)) {
    await auditAsync({
      event: 'AUD-PLT-006', area: 'PLT', feature: 'PRD-PLT-005', entity: 'ConfigurationImport', entityId: manifest?.checksum ?? 'unknown', actor: by, outcome: 'rejected', after: { from, here }, note: 'import refused: the pack comes from a newer product release',
    });
    return {
      ok: false,
      refused: true,
      messageKey: 'Plt.PackVersionMismatch',
      message: `${resource('Plt.PackVersionMismatch')} (exported from ${from}, this instance runs ${here})`,
      exportedFrom: from,
      instanceRuns: here,
    };
  }

  const stores = (await repository('Store').getAllAsync()).map((s) => s.code ?? String(s.id));
  // the import is the PLT-003 loader: every one of its criteria applies
  const chain = [
    { layer: 'country', id: countryPackId ?? 'MW', name: 'country', version: manifest?.productRelease ?? '1.0.0' },
    { ...pack, layer: 'client' },
  ];
  const apply = (choices) => applyPackChainAsync(chain, {
    storeId, replace: false, actor: by, stores, root: repoRoot(), force: true, conflictChoices: choices,
  });
  let report;
  try {
    report = await apply(conflictChoices);
    // AC-PLT-003-01-09 and 01-10 apply here too: a key changed in this instance since the last
    // pack stops the run and offers the two choices. An import run may carry one decision for
    // every conflicting key, and is then re-applied with it.
    if (report.status === 'Conflict' && (conflictChoice === 'take-pack' || conflictChoice === 'keep-instance')) {
      report = await apply(Object.fromEntries(report.conflicts.map((c) => [c.key, conflictChoice])));
    }
  } catch (err) {
    return {
      ok: false, status: 'Refused', problems: err.problems ?? [], refused: err.refused ?? [], message: err.message,
    };
  }
  await auditAsync({
    event: 'AUD-PLT-006', area: 'PLT', feature: 'PRD-PLT-005', entity: 'ConfigurationImport', entityId: manifest?.checksum ?? report.setChecksum, actor: by, after: { status: report.status, keys: report.keys?.length ?? 0 }, storeId, note: 'configuration imported',
  });
  return {
    ok: report.status === 'Applied' || report.status === 'NoChanges',
    status: report.status,
    report,
    conflicts: report.conflicts ?? [],
    conflictChoices: report.status === 'Conflict' ? report.choices ?? ['keep-instance', 'take-pack'] : null,
    appliedThrough: 'the PRD-PLT-003 loader',
    secretsToEnter: manifest?.secretsToEnter ?? [],
    secretsNote: 'these keys must be entered in this instance',
  };
}

/** AC-PLT-005-03-01: promotion from the test instance to the live one. */
export async function promoteAsync({
  testSnapshot, actor, by, keys = null, storeId = 0,
}) {
  if (!await authorizeAsync('Platform.Core.Packs.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Packs.CreateEditDelete' };
  }
  const { snapshotAsync } = await import('./change-control.js');
  const live = await snapshotAsync({ storeId, label: 'live' });
  // only the keys the test export states are compared: a key it does not carry is not a
  // difference, so promotion never proposes to blank a live value (BR-PLT-014)
  const stated = Object.keys(testSnapshot.values ?? {});
  const comparison = compareSnapshots({
    left: { ...live, values: Object.fromEntries(stated.map((k) => [k, live.values?.[k] ?? null])) },
    right: { ...testSnapshot, label: 'test' },
  });
  const promotable = comparison.differences.filter((d) => !instanceBound(d.key) && !isSecret(d.key));
  const excluded = comparison.differences.filter((d) => instanceBound(d.key) || isSecret(d.key));

  const changeSet = promotable.length
    ? await changeSetFromDifferencesAsync({
      differences: promotable, keys, actor: by, storeId, reason: 'promoted from the test instance',
    })
    : { ok: false, message: 'there is nothing to promote' };

  await auditAsync({
    event: 'AUD-PLT-006', area: 'PLT', feature: 'PRD-PLT-005', entity: 'ConfigurationPromotion', entityId: changeSet.changeSet?.id ?? 'none', actor: by, after: { differences: promotable.length, excluded: excluded.length }, note: 'promotion started',
  });
  return {
    ok: true,
    differences: promotable,
    excludedInstanceBound: excluded.map((d) => d.key),
    rule: 'BR-PLT-014',
    changeSet: changeSet.changeSet ?? null,
    followsChangeControl: 'PRD-PLT-004 validation and approval',
  };
}

/** AC-PLT-005-04-01 and 04-02: cloning one client's configuration for another. */
export const CLIENT_IDENTIFYING_KEYS = [
  ...INSTANCE_BOUND_KEYS,
  'storeinformationsettings.defaultstoretheme',
];

export async function cloneAsync({
  fromClient, toClient, authorisationReference = null, actor, by, storeId = 1,
}) {
  if (!await authorizeAsync('Platform.Core.Packs.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Packs.CreateEditDelete' };
  }
  if (!authorisationReference) {
    await auditAsync({
      event: 'AUD-PLT-006', area: 'PLT', feature: 'PRD-PLT-005', entity: 'ConfigurationClone', entityId: `${fromClient}->${toClient}`, actor: by, outcome: 'rejected', after: { authorisationReference: null }, note: 'clone refused: no recorded authorisation',
    });
    return {
      ok: false,
      refused: true,
      messageKey: 'Plt.CloneNotAuthorised',
      message: resource('Plt.CloneNotAuthorised'),
    };
  }
  const exported = await exportConfigurationAsync({
    actor, by, instanceCode: fromClient, storeId, excludeInstanceBound: true,
  });
  if (exported.ok !== true) return exported;

  const excluded = [...new Set([
    ...exported.manifest.instanceBoundExcluded,
    ...exported.manifest.secretsToEnter,
    ...CLIENT_IDENTIFYING_KEYS.filter((k) => exported.pack.settings[k] !== undefined),
  ])];
  for (const key of CLIENT_IDENTIFYING_KEYS) delete exported.pack.settings[key];

  const derived = {
    ...exported.pack,
    id: toClient,
    name: `Client pack for ${toClient}`,
    derivedFrom: { client: fromClient, checksum: exported.manifest.checksum, authorisationReference },
  };
  const record = await plainRepository('DerivedClientPack').insertAsync({
    client: toClient,
    derivedFrom: fromClient,
    authorisationReference,
    excludedKeys: excluded,
    checksum: checksumOf(derived),
    createdBy: by,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-PLT-006',
    area: 'PLT',
    feature: 'PRD-PLT-005',
    entity: 'ConfigurationClone',
    entityId: record.id,
    actor: by,
    after: {
      from: fromClient, to: toClient, authorisationReference, excluded: excluded.length,
    },
    storeId,
    note: 'client configuration cloned',
  });
  return {
    ok: true,
    pack: derived,
    excludedForEntry: excluded,
    recordedIn: toClient,
    derivedFrom: fromClient,
    authorisationReference,
    record,
    rule: 'BR-PLT-014',
  };
}

export const derivedPacksAsync = () => plainRepository('DerivedClientPack').getAllAsync();
export const checksum = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
