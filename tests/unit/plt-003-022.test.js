// PRD-PLT-003 Configuration packs (19 ACs) and PRD-PLT-022 Feature and module registry (6 ACs).
// One test per AC, named by AC ID.
//
// The loader is the mechanism the Product Goal rests on — onboarding a client is configuration,
// not code — so these tests drive it the way a platform operator would: validate, apply, apply
// again, and watch what happens when a pack is wrong, a write fails or the instance has drifted.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository, plainRepository } from '../../packages/server/src/core/repository.js';
import { getSettingAsync, saveSettingAsync, settingCacheClears } from '../../packages/server/src/core/settings.js';
import { auditTrailAsync } from '../../packages/server/src/core/audit.js';
import {
  validatePack, validateChain, convertible, checksumOf, WRITE_LOCK_KEY, ARTEFACT_SERVICES,
} from '../../packages/server/src/core/pack-loader.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const ROOT = process.cwd();
const pack = (layer, id, body) => ({
  layer, id, name: `${layer} ${id}`, version: '1.0.0', ...body,
});
const validate = (body) => validatePack(pack('client', 'probe', body), { root: ROOT, stores: ['main', 'business'] });
const refusals = (problems) => problems.filter((p) => p.severity === 'refused');

/* ================================================= PRD-PLT-003 configuration packs ===== */

describe('PRD-PLT-003 the merge and the write', () => {
  test('AC-PLT-003-01-01', async () => {
    // "the client value wins over the vertical value, the vertical value over the country value
    //  and the country value over the global value; a key not stated by a higher layer keeps the
    //  value of the lower layer (BR-PLT-010)"
    const chain = [
      pack('global', 'global', { settings: { 'catalogsettings.searchpageproductsperpage': 6, 'ordersettings.anonymouscheckoutallowed': true } }),
      pack('country', 'MW', { settings: { 'catalogsettings.searchpageproductsperpage': 12 } }),
      pack('vertical', 'postal', { settings: { 'catalogsettings.searchpageproductsperpage': 18 } }),
      pack('client', 'MPC', { settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
    ];
    const applied = await api.post('/api/platform/packs/apply-chain', { chain, storeId: 1, force: true }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied');

    const row = applied.keys.find((k) => k.key === 'catalogsettings.searchpageproductsperpage');
    assert.equal(row.value, 24, 'the client value wins');
    assert.equal(row.layer, 'client');
    assert.deepEqual(row.overrode.map((o) => o.layer), ['global', 'country', 'vertical'], 'in that order');
    assert.deepEqual(row.overrode.map((o) => o.value), [6, 12, 18]);

    const kept = applied.keys.find((k) => k.key === 'ordersettings.anonymouscheckoutallowed');
    assert.equal(kept.value, true, 'a key no higher layer states keeps the lower value');
    assert.equal(kept.layer, 'global');
  });

  test('AC-PLT-003-01-02', async () => {
    // "merged shared keys are written as Setting rows with StoreId 0 and store entries as rows
    //  with StoreId of the named store; LoadSettingAsync returns the store row, else the
    //  StoreId 0 row, else the settings-class default; no other layer exists at run time"
    const chain = [
      pack('global', 'global', { settings: { 'catalogsettings.searchpageproductsperpage': 6 } }),
      pack('country', 'MW', {}),
      pack('client', 'MPC', { settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
      pack('store', 'store-1', { storeId: 1, settings: { 'catalogsettings.searchpageproductsperpage': 48 } }),
    ];
    const applied = await api.post('/api/platform/packs/apply-chain', { chain, storeId: 1, force: true }, SESSIONS.admin);
    const shared = applied.keys.find((k) => k.key === 'catalogsettings.searchpageproductsperpage' && k.storeId === 0);
    const store = applied.keys.find((k) => k.key === 'catalogsettings.searchpageproductsperpage' && k.storeId === 1);
    assert.ok(store || shared, 'the key is written');

    const rows = await plainRepository('Setting').getAllAsync((s) => s.name === 'catalogsettings.searchpageproductsperpage');
    const storeRow = rows.find((r) => r.storeId === 1);
    assert.ok(storeRow, 'the store entry is a row with the store id');
    assert.equal(storeRow.value, 48);

    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, 0), 48, 'the store row wins at run time');
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 2, 0), 24, 'another store falls back to the shared row');
    assert.equal(await getSettingAsync('catalogsettings.neverstated', 1, 99), 99, 'and an unstated key falls back to the class default');

    const layers = new Set(rows.map((r) => r.storeId));
    assert.ok([...layers].every((l) => l === 0 || l === 1), 'only StoreId 0 and store rows exist at run time');
  });

  test('AC-PLT-003-01-03', async () => {
    // "the store row for K is deleted, so the store again uses the StoreId 0 value"
    const withStore = [
      pack('country', 'MW', {}),
      pack('client', 'MPC', { settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
      pack('store', 'store-1', { storeId: 1, settings: { 'catalogsettings.searchpageproductsperpage': 48 } }),
    ];
    await api.post('/api/platform/packs/apply-chain', { chain: withStore, storeId: 1, force: true }, SESSIONS.admin);
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, 0), 48);

    const withoutStore = [
      pack('country', 'MW', {}),
      pack('client', 'MPC', { version: '1.1.0', settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
    ];
    const applied = await api.post('/api/platform/packs/apply-chain', {
      chain: withoutStore, storeId: 1, replace: false, force: true,
    }, SESSIONS.admin);
    assert.ok(applied.deletedStoreRows.some((d) => d.key === 'catalogsettings.searchpageproductsperpage' && d.storeId === 1), 'the store row is deleted');
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, 0), 24, 'the store uses the shared value again');
  });

  test('AC-PLT-003-01-04', async () => {
    // "validation fails with message Plt.PackKeyUnknown naming the key and nothing is written"
    const unknownProperty = refusals(validate({ settings: { 'catalogsettings.notaproperty': 1 } }));
    assert.equal(unknownProperty.length, 1);
    assert.equal(unknownProperty[0].messageKey, 'Plt.PackKeyUnknown');
    assert.match(unknownProperty[0].message, /catalogsettings\.notaproperty/);

    const unknownClass = refusals(validate({ settings: { 'inventedsettings.whatever': 1 } }));
    assert.equal(unknownClass[0].messageKey, 'Plt.PackKeyUnknown');
    assert.match(unknownClass[0].message, /no settings class and no installed plugin owns it/);

    const badShape = refusals(validate({ settings: { CatalogSettings: 1 } }));
    assert.equal(badShape[0].messageKey, 'Plt.PackKeyUnknown');

    const badType = refusals(validate({ settings: { 'catalogsettings.searchpageproductsperpage': { a: 1 } } }));
    assert.equal(badType.length, 1, 'a value the property cannot hold is refused');
    assert.match(badType[0].message, /cannot be read as number/);
    assert.equal(convertible('number', '24'), true, 'a string a TypeConverter can read is accepted');
    assert.equal(convertible('number', 'twenty'), false);
    assert.equal(convertible('boolean', 'true'), true);

    // a key an installed plugin owns is accepted
    assert.equal(refusals(validate({ settings: { 'iam.sensitiveroles': ['Administrators'] } })).length, 0);

    // and nothing is written when a pack is refused
    const before2 = await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null);
    const result = await api.post('/api/platform/packs/apply-chain', {
      chain: [pack('country', 'MW', {}), pack('client', 'MPC', { settings: { 'catalogsettings.notaproperty': 1 } })], force: true,
    }, SESSIONS.admin);
    assert.equal(result.status, 'Refused');
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null), before2, 'nothing changed');
  });

  test('AC-PLT-003-01-05', async () => {
    // "every permission system name must exist in the 5.00 permission set; a 4.70 name such as
    //  ManageProducts, or a 4.90 name removed in 5.00, fails with Plt.PackPermissionUnknown"
    const ok = refusals(validate({ permissions: { 'Catalog.ProductsView': ['Catalogue'] } }));
    assert.equal(ok.length, 0, 'a 5.00 permission is accepted');

    const old470 = refusals(validate({ permissions: { ManageProducts: ['Catalogue'] } }));
    assert.equal(old470[0].messageKey, 'Plt.PackPermissionUnknown');
    assert.match(old470[0].message, /ManageProducts/);

    for (const removed of ['ContentManagement.NewsView', 'ContentManagement.PollsCreateEditDelete', 'ContentManagement.ForumsCreateEditDelete']) {
      const problems = refusals(validate({ permissions: { [removed]: ['Administrators'] } }));
      assert.equal(problems[0].messageKey, 'Plt.PackPermissionUnknown', `${removed} is refused`);
      assert.match(problems[0].message, /Misc\.News|Misc\.Polls|Misc\.Forums/, 'and the message names the bundled plugin');
    }

    const badRoles = refusals(validate({ permissions: { 'Catalog.ProductsView': 'Catalogue' } }));
    assert.equal(badRoles.length, 1, 'the roles are a list');
  });

  test('AC-PLT-003-01-06', async () => {
    // "validation fails with message Plt.PackStoreUnknown and nothing is written"
    const unknown = refusals(validate({ stores: { shop99: { 'catalogsettings.searchpageproductsperpage': 12 } } }));
    assert.equal(unknown.length, 1);
    assert.equal(unknown[0].messageKey, 'Plt.PackStoreUnknown');
    assert.match(unknown[0].message, /shop99/);

    const known = refusals(validate({ stores: { business: { 'catalogsettings.searchpageproductsperpage': 12 } } }));
    assert.equal(known.length, 0, 'a store the instance has is accepted');

    const stores = await repository('Store').getAllAsync();
    assert.deepEqual(stores.map((s) => s.code).sort(), ['business', 'main'], 'the instance has the two storefronts');
  });

  test('AC-PLT-003-01-07', async () => {
    // "the import is refused with message Plt.PackSecretRefused naming the key"
    for (const key of ['smtp.password', 'pay.mpesa.consumersecret', 'iam.brevo.apikey']) {
      const problems = refusals(validate({ settings: { [key]: 'value' } }));
      assert.equal(problems.length, 1, `${key} is refused`);
      assert.equal(problems[0].messageKey, 'Plt.PackSecretRefused');
      assert.match(problems[0].message, new RegExp(key.replace('.', '\\.')));
      assert.equal(problems[0].rule, 'BR-PLT-013 / CFG-01');
    }
    assert.equal(refusals(validate({ settings: { 'customersettings.passwordminlength': 8 } })).length, 0, 'a password policy is not a secret');
  });

  test('AC-PLT-003-01-08', async () => {
    // "plugins to install are queued with PreparePluginToInstallAsync and the run ends with
    //  message Plt.RestartRequired; store and role limits are written to each plugin's
    //  plugin.json through PluginDescriptor.Save; active-provider lists are written as settings"
    await plainRepository('PluginDescriptor').insertAsync({
      systemName: 'Payments.AirtelMoney', installed: false, supportsStoreLimits: true,
    });
    const chain = [
      pack('country', 'MW', {}),
      pack('client', 'MPC', {
        plugins: {
          'Payments.AirtelMoney': {
            limitedToStores: [1],
            limitedToCustomerRoles: ['Registered'],
            activeProviderSetting: 'paymentsettings.activepaymentmethodsystemnames',
            activeProviders: ['Payments.AirtelMoney', 'Payments.CashAtOutlet'],
          },
        },
      }),
    ];
    const applied = await api.post('/api/platform/packs/apply-chain', { chain, force: true }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied');
    assert.deepEqual(applied.queuedPlugins, ['Payments.AirtelMoney']);
    assert.equal(applied.restartRequired, true);
    assert.equal(applied.restartMessageKey, 'Plt.RestartRequired');
    assert.ok(applied.restartMessage && applied.restartMessage !== 'Plt.RestartRequired');

    const descriptor = await plainRepository('PluginDescriptor').getOneAsync((d) => d.systemName === 'Payments.AirtelMoney');
    assert.equal(descriptor.queuedForInstall, true);
    assert.match(descriptor.queuedThrough, /PreparePluginToInstallAsync/);
    assert.match(descriptor.installsAt, /application start/);
    assert.deepEqual(descriptor.limitedToStores, [1], 'the store limit is on the descriptor');
    assert.deepEqual(descriptor.limitedToCustomerRoles, ['Registered']);
    assert.match(descriptor.savedThrough, /PluginDescriptor\.Save/);

    assert.deepEqual(
      await getSettingAsync('paymentsettings.activepaymentmethodsystemnames', 1, []),
      ['Payments.AirtelMoney', 'Payments.CashAtOutlet'],
      'the active-provider list is a setting',
    );
  });

  test('AC-PLT-003-01-09', async () => {
    // "each artefact is written through its native or owning service; no artefact is written by
    //  direct SQL"
    const chain = [
      pack('country', 'MW', {}),
      pack('client', 'MPC', {
        artefacts: {
          localeResources: [{ key: 'Account.Login', value: 'Log in' }],
          messageTemplates: [{ name: 'Customer.WelcomeMessage' }],
          roles: [{ systemName: 'TradeBuyer' }],
          categories: [{ name: 'Postal services' }],
          specificationAttributes: [{ name: 'Weight' }],
          features: { 'PRD-IAM-026': true },
          workflows: [{ code: 'service-entry' }],
          rules: [{ code: 'scheme-eligibility' }],
        },
      }),
    ];
    const applied = await api.post('/api/platform/packs/apply-chain', { chain, force: true }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied');
    assert.equal(applied.artefacts.length, 8, 'every artefact kind the pack carries');
    assert.ok(applied.artefacts.every((a) => a.directSql === false));

    const byKind = Object.fromEntries(applied.artefacts.map((a) => [a.kind, a.service]));
    assert.match(byKind.localeResources, /ILocalizationService\.ImportResourcesFromXmlAsync/);
    assert.match(byKind.messageTemplates, /IMessageTemplateService/);
    assert.match(byKind.roles, /IPermissionService\.InsertPermissionMappingAsync/);
    assert.match(byKind.categories, /ICategoryService/);
    assert.match(byKind.features, /PRD-PLT-022/);
    assert.match(byKind.workflows, /PRD-ADM-002/);
    assert.match(byKind.rules, /PRD-ADM-003/);
    assert.deepEqual(Object.keys(ARTEFACT_SERVICES).sort(), [
      'categories', 'features', 'localeResources', 'messageTemplates', 'permissions', 'roles',
      'rules', 'specificationAttributes', 'workflows',
    ]);
  });

  test('AC-PLT-003-02-01', async () => {
    // "all database writes run in one TransactionScope under ILocker key 'plt-config-write'; if
    //  any write fails none is kept and the run status becomes Failed with Plt.PackApplyFailed"
    const lock = await api.get('/api/platform/packs/lock', SESSIONS.admin);
    assert.equal(lock.lockKey, 'plt-config-write');
    assert.equal(WRITE_LOCK_KEY, 'plt-config-write');

    await saveSettingAsync('catalogsettings.searchpageproductsperpage', 24, 0);
    const before2 = await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null);

    const failed = await api.post('/api/platform/packs/apply-chain', {
      chain: [
        pack('country', 'MW', {}),
        pack('client', 'MPC', { settings: { 'catalogsettings.searchpageproductsperpage': 99, 'ordersettings.anonymouscheckoutallowed': false } }),
      ],
      failWrite: 'ordersettings.anonymouscheckoutallowed',
      force: true,
    }, SESSIONS.admin);
    assert.equal(failed.status, 'Failed');
    assert.equal(failed.messageKey, 'Plt.PackApplyFailed');
    assert.equal(failed.nothingKept, true);
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null), before2, 'the first write is not kept either');

    const applied = await plainRepository('AppliedPackSet').getAllAsync((r) => r.status === 'Failed');
    assert.ok(applied.length >= 1, 'the run is recorded as Failed');
  });

  test('AC-PLT-003-02-02', async () => {
    // "it restores the files and the database rows from the pre-apply snapshot, sets the run
    //  Failed and shows message Plt.PackApplyFailed"
    await saveSettingAsync('catalogsettings.searchpageproductsperpage', 24, 0);
    const descriptorsBefore = (await plainRepository('PluginDescriptor').getAllAsync()).length;

    const failed = await api.post('/api/platform/packs/apply-chain', {
      chain: [
        pack('country', 'MW', {}),
        pack('client', 'MPC', {
          settings: { 'catalogsettings.searchpageproductsperpage': 99 },
          plugins: { 'Payments.NewOne': { limitedToStores: [1] } },
        }),
      ],
      failFileWrite: true,
      force: true,
    }, SESSIONS.admin);
    assert.equal(failed.status, 'Failed');
    assert.equal(failed.restoredFromSnapshot, true);
    assert.equal(failed.messageKey, 'Plt.PackApplyFailed');
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null), 24, 'the rows are restored');
    assert.equal(
      (await plainRepository('PluginDescriptor').getAllAsync()).length,
      descriptorsBefore,
      'and so are the plugin files',
    );
    assert.equal(await plainRepository('PluginDescriptor').getOneAsync((d) => d.systemName === 'Payments.NewOne'), null);
  });

  test('AC-PLT-003-02-03', async () => {
    // "the instance records the applied pack set (pack codes, versions, checksums, applied by,
    //  applied at) and the setting cache is cleared once at the end; audited (AUD-PLT-002)"
    const clearsBefore = settingCacheClears().length;
    const chain = [
      pack('global', 'global', { settings: { 'catalogsettings.searchpageproductsperpage': 6 } }),
      pack('country', 'MW', { settings: { 'ordersettings.anonymouscheckoutallowed': false } }),
      pack('client', 'MPC', { settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
    ];
    const applied = await api.post('/api/platform/packs/apply-chain', { chain, force: true }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied');
    assert.equal(applied.packSet.length, 3);
    for (const entry of applied.packSet) {
      assert.ok(entry.code && entry.layer, 'the code and layer');
      assert.equal(entry.version, '1.0.0', 'the version');
      assert.match(entry.checksum, /^[0-9a-f]{16}$/, 'and the checksum');
    }
    assert.equal(applied.appliedBy, 'admin@example.com');
    assert.ok(applied.appliedOnUtc);
    assert.equal(applied.cacheClearedOnce, true);
    assert.equal(settingCacheClears().length, clearsBefore + 1, 'the cache is cleared once, not per write');

    const recorded = (await api.get('/api/platform/packs/applied', SESSIONS.admin)).at(-1);
    assert.equal(recorded.status, 'Applied');
    assert.equal(recorded.setChecksum, applied.setChecksum);
    assert.equal(recorded.appliedBy, 'admin@example.com');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-002' });
    assert.ok(trail.some((e) => e.entityId === applied.setChecksum), 'AUD-PLT-002 is written');
  });

  test('AC-PLT-003-02-04', async () => {
    // "nothing is written and the run reports no changes (BR-PLT-016)"
    const chain = [
      pack('country', 'MW', { settings: { 'ordersettings.anonymouscheckoutallowed': false } }),
      pack('client', 'MPC', { settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
    ];
    const first = await api.post('/api/platform/packs/apply-chain', { chain, force: true }, SESSIONS.admin);
    assert.equal(first.status, 'Applied');

    await saveSettingAsync('catalogsettings.searchpageproductsperpage', 24, 0);
    const again = await api.post('/api/platform/packs/apply-chain', { chain }, SESSIONS.admin);
    assert.equal(again.status, 'NoChanges');
    assert.equal(again.noChanges, true);
    assert.equal(again.message, 'no changes');
    assert.equal(again.setChecksum, first.setChecksum, 'the same checksums');

    const changed = [...chain.slice(0, 1), pack('client', 'MPC', { version: '2.0.0', settings: { 'catalogsettings.searchpageproductsperpage': 36 } })];
    const applied = await api.post('/api/platform/packs/apply-chain', { chain: changed }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied', 'a different pack set is applied');
    assert.notEqual(applied.setChecksum, first.setChecksum);
  });

  test('AC-PLT-003-02-05', async () => {
    // "the run stops before writing and lists each such key with message Plt.PackConflict; for
    //  each key the platform team chooses keep the instance value (recorded as a deviation) or
    //  take the pack value; audited (AUD-PLT-003)"
    const v1 = [
      pack('country', 'MW', {}),
      pack('client', 'MPC', { version: '3.0.0', settings: { 'catalogsettings.searchpageproductsperpage': 24 } }),
    ];
    await api.post('/api/platform/packs/apply-chain', { chain: v1, force: true }, SESSIONS.admin);

    // somebody changes the key in the instance
    await saveSettingAsync('catalogsettings.searchpageproductsperpage', 30, 0);

    const v2 = [
      pack('country', 'MW', {}),
      pack('client', 'MPC', { version: '4.0.0', settings: { 'catalogsettings.searchpageproductsperpage': 36 } }),
    ];
    const stopped = await api.post('/api/platform/packs/apply-chain', { chain: v2 }, SESSIONS.admin);
    assert.equal(stopped.status, 'Conflict');
    assert.equal(stopped.stoppedBeforeWriting, true);
    assert.equal(stopped.messageKey, 'Plt.PackConflict');
    const conflict = stopped.conflicts.find((c) => c.key === 'catalogsettings.searchpageproductsperpage');
    assert.ok(conflict);
    assert.equal(conflict.lastPackValue, 24);
    assert.equal(conflict.instanceValue, 30);
    assert.equal(conflict.newPackValue, 36);
    assert.deepEqual(stopped.choices, ['keep-instance', 'take-pack']);
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null), 30, 'nothing was written');
    const stoppedTrail = await auditTrailAsync({ event: 'AUD-PLT-003' });
    assert.ok(stoppedTrail.length >= 1, 'AUD-PLT-003 is written');

    // keep the instance value: the pack applies and the difference is a recorded deviation
    const kept = await api.post('/api/platform/packs/apply-chain', {
      chain: v2, conflictChoices: { 'catalogsettings.searchpageproductsperpage': 'keep-instance' },
    }, SESSIONS.admin);
    assert.equal(kept.status, 'Applied');
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null), 30, 'the instance value stands');
    const deviations = await api.get('/api/platform/packs/deviations', SESSIONS.admin);
    assert.ok(deviations.some((d) => d.key === 'catalogsettings.searchpageproductsperpage' && d.level === 'instance'));

    // or take the pack value
    await saveSettingAsync('catalogsettings.searchpageproductsperpage', 30, 0);
    const taken = await api.post('/api/platform/packs/apply-chain', {
      chain: [...v2.slice(0, 1), pack('client', 'MPC', { version: '5.0.0', settings: { 'catalogsettings.searchpageproductsperpage': 36 } })],
      conflictChoices: { 'catalogsettings.searchpageproductsperpage': 'take-pack' },
    }, SESSIONS.admin);
    assert.equal(taken.status, 'Applied');
    assert.equal(await getSettingAsync('catalogsettings.searchpageproductsperpage', 1, null), 36, 'the pack value wins');
  });

  test('AC-PLT-003-01-10', async () => {
    // "validation fails with Plt.PackCountryInvalid; a set with exactly one country pack is
    //  applied at the country layer and its code, version and checksum are recorded"
    const none = validateChain([pack('global', 'global', {}), pack('client', 'MPC', {})]);
    assert.equal(none.length, 1);
    assert.equal(none[0].messageKey, 'Plt.PackCountryInvalid');

    const two = validateChain([pack('country', 'MW', {}), pack('country', 'KE', {}), pack('client', 'MPC', {})]);
    assert.equal(two[0].messageKey, 'Plt.PackCountryInvalid');
    assert.match(two[0].message, /2 country packs/);

    const one = validateChain([pack('country', 'MW', {}), pack('client', 'MPC', {})]);
    assert.deepEqual(one, []);

    const applied = await api.post('/api/platform/packs/apply-chain', {
      chain: [pack('country', 'MW', { version: '9.0.0', settings: { 'countrysettings.isocode': 'MW' } }), pack('client', 'MPC', { version: '9.0.0' })],
      force: true,
    }, SESSIONS.admin);
    assert.equal(applied.status, 'Applied');
    const country = applied.packSet.find((p) => p.layer === 'country');
    assert.equal(country.code, 'MW');
    assert.equal(country.version, '9.0.0');
    assert.match(country.checksum, /^[0-9a-f]{16}$/);

    const refused = await api.post('/api/platform/packs/apply-chain', {
      chain: [pack('country', 'MW', {}), pack('country', 'KE', {}), pack('client', 'MPC', {})], force: true,
    }, SESSIONS.admin);
    assert.equal(refused.status, 'Refused');
  });

  test('AC-PLT-003-01-11', async () => {
    // "validation fails with Plt.PackKeyUnknown naming each such key and nothing is written; the
    //  pack is corrected by dropping the removed keys and renaming the moved keys"
    for (const removed of ['customersettings.phonenumbervalidationuseregex', 'customersettings.phonenumbervalidationrule']) {
      const problems = refusals(validate({ settings: { [removed]: true } }));
      assert.equal(problems.length, 1, `${removed} is refused`);
      assert.equal(problems[0].messageKey, 'Plt.PackKeyUnknown');
      assert.match(problems[0].message, /libphonenumber/, 'and the message says what 5.00 does instead');
    }

    const moved = {
      'ordersettings.returnrequestsenabled': 'returnrequestsettings.returnrequestsenabled',
      'ordersettings.returnrequestsallowfiles': 'returnrequestsettings.returnrequestsallowfiles',
      'ordersettings.returnrequestsfilemaximumsize': 'returnrequestsettings.returnrequestsfilemaximumsize',
      'ordersettings.returnrequestnumbermask': 'returnrequestsettings.returnrequestnumbermask',
      'ordersettings.numberofdaysreturnrequestavailable': 'returnrequestsettings.numberofdaysreturnrequestavailable',
    };
    for (const [oldKey, newKey] of Object.entries(moved)) {
      const problems = refusals(validate({ settings: { [oldKey]: true } }));
      assert.equal(problems.length, 1, `${oldKey} is refused`);
      assert.match(problems[0].message, new RegExp(newKey.replace(/\./g, '\\.')), 'and the message names the 5.00 key');
    }

    // the corrected pack validates
    const corrected = refusals(validate({
      settings: {
        'returnrequestsettings.returnrequestsenabled': true,
        'returnrequestsettings.numberofdaysreturnrequestavailable': 30,
        'customersettings.phonenumbervalidationenabled': true,
      },
    }));
    assert.equal(corrected.length, 0);

    const result = await api.post('/api/platform/packs/apply-chain', {
      chain: [pack('country', 'MW', {}), pack('client', 'MPC', { settings: { 'ordersettings.returnrequestsenabled': true } })], force: true,
    }, SESSIONS.admin);
    assert.equal(result.status, 'Refused', 'nothing is written');
  });
});

describe('PRD-PLT-003 parameter overrides and deviations', () => {
  test('AC-PLT-003-03-01', async () => {
    // "transactions of that type use the override, other types use the client value, and the
    //  override is recorded as a deviation with pack value, override value, reason and user"
    await saveSettingAsync('plt.clientparameter.incoterm', 'DAP', 0);
    const before2 = await api.get('/api/platform/packs/parameter?typeCode=contract&parameter=incoterm', SESSIONS.admin);
    assert.equal(before2.value, 'DAP');
    assert.equal(before2.source, 'the client pack');

    const overridden = await api.post('/api/platform/packs/parameter/type-override', {
      typeCode: 'contract', parameter: 'incoterm', value: 'CIF', reason: 'the contract template of this client states CIF',
    }, SESSIONS.admin);
    assert.equal(overridden.ok, true);
    assert.equal(overridden.packValue, 'DAP', 'the pack value');
    assert.equal(overridden.value, 'CIF', 'the override value');
    assert.equal(overridden.reason, 'the contract template of this client states CIF');
    assert.equal(overridden.actor, 'admin@example.com', 'and the user');
    assert.equal(overridden.deviation.level, 'transaction-type');

    const after2 = await api.get('/api/platform/packs/parameter?typeCode=contract&parameter=incoterm', SESSIONS.admin);
    assert.equal(after2.value, 'CIF', 'transactions of that type use the override');
    assert.equal(after2.overridden, true);

    const otherType = await api.get('/api/platform/packs/parameter?typeCode=request-for-quotation&parameter=incoterm', SESSIONS.admin);
    assert.equal(otherType.value, 'DAP', 'other types use the client value');
    assert.equal(otherType.overridden, false);

    const trail = await auditTrailAsync({ event: 'AUD-PLT-012', entity: 'TransactionType' });
    assert.ok(trail.some((e) => e.entityId === 'contract'));
  });

  test('AC-PLT-003-03-02', async () => {
    // "the save is refused with message Plt.OverrideReasonRequired; with a reason it is saved,
    //  recorded as a deviation and audited (AUD-PLT-012)"
    const noReason = await api.post('/api/platform/packs/parameter/transaction-override', {
      transactionId: 501, typeCode: 'contract', parameter: 'incoterm', value: 'FOB',
    }, SESSIONS.admin);
    assert.equal(noReason.ok, false);
    assert.equal(noReason.needsReason, true);
    assert.equal(noReason.messageKey, 'Plt.OverrideReasonRequired');
    assert.ok(noReason.message && noReason.message !== 'Plt.OverrideReasonRequired');

    const withReason = await api.post('/api/platform/packs/parameter/transaction-override', {
      transactionId: 501, typeCode: 'contract', parameter: 'incoterm', value: 'FOB', reason: 'the buyer arranges carriage for this shipment',
    }, SESSIONS.admin);
    assert.equal(withReason.ok, true);
    assert.equal(withReason.deviation.level, 'transaction');
    assert.equal(withReason.deviation.transactionId, 501);
    assert.equal(withReason.deviation.packValue, 'DAP');
    assert.equal(withReason.deviation.typeValue, 'CIF', 'the type override it departs from');
    assert.equal(withReason.deviation.value, 'FOB');
    assert.equal(withReason.deviation.reason, 'the buyer arranges carriage for this shipment');

    const trail = await auditTrailAsync({ event: 'AUD-PLT-012', entity: 'Transaction' });
    assert.ok(trail.some((e) => e.entityId === '501'));

  });

  test('AC-PLT-003-03-03', async () => {
    // "it is refused with message Plt.OverrideNotAllowed, because native settings resolve only
    //  by store and shared value"
    const native = await api.get('/api/platform/packs/native-key?key=catalogsettings.searchpageproductsperpage', SESSIONS.admin);
    assert.equal(native.nativeSetting, true);

    const atType = await api.post('/api/platform/packs/parameter/type-override', {
      typeCode: 'contract', parameter: 'catalogsettings.searchpageproductsperpage', value: 99, reason: 'a reason that cannot help',
    }, SESSIONS.admin);
    assert.equal(atType.ok, false);
    assert.equal(atType.messageKey, 'Plt.OverrideNotAllowed');
    assert.deepEqual(atType.rules, ['BR-PLT-011', 'BR-PLT-017']);

    const atTransaction = await api.post('/api/platform/packs/parameter/transaction-override', {
      transactionId: 502, typeCode: 'contract', parameter: 'ordersettings.anonymouscheckoutallowed', value: true, reason: 'a reason that cannot help',
    }, SESSIONS.admin);
    assert.equal(atTransaction.ok, false);
    assert.equal(atTransaction.messageKey, 'Plt.OverrideNotAllowed');

    const notNative = await api.get('/api/platform/packs/native-key?key=incoterm', SESSIONS.admin);
    assert.equal(notNative.nativeSetting, false, 'a pack parameter is not a native setting');
  });
});

/* ====================================================== PRD-PLT-022 the registry ======== */

describe('PRD-PLT-022 feature and module registry', () => {
  test('AC-PLT-022-01-01', async () => {
    // "every product feature is listed with its state for the client and for each store"
    const denied = await api.get('/api/platform/registry', SESSIONS.buyer);
    assert.equal(denied.permission, 'Platform.Core.Features.View');

    const registry = await api.get('/api/platform/registry', SESSIONS.admin);
    assert.equal(registry.ok, true);
    assert.equal(registry.total, 434, 'every product feature');
    assert.equal(registry.stores.length, 2, 'and both storefronts');

    const row = registry.features.find((f) => f.id === 'PRD-IAM-026');
    assert.ok(row.name && row.area === 'IAM' && row.pack && row.phase, 'the definition the release ships');
    assert.ok(Array.isArray(row.dependsOn));
    assert.deepEqual(row.implementingPlugins, ['Product.IAM']);
    assert.equal(typeof row.enabled, 'boolean', 'its state for the client');
    assert.equal(row.perStore.length, 2, 'and for each store');
    assert.ok(row.perStore.every((s) => typeof s.enabled === 'boolean'));
  });

  test('AC-PLT-022-01-02', async () => {
    // "the state is stored as setting productfeature.<prd-id> (StoreId 0 for the client, StoreId
    //  n for a store) and resolves store value, else client value, else off; audited"
    const off = await api.post('/api/platform/registry/features', { featureId: 'PRD-SEL-001', enabled: false }, SESSIONS.admin);
    assert.equal(off.ok, true);
    assert.equal(off.settingKey, 'productfeature.prd-sel-001');
    assert.equal(off.settingStoreId, 0, 'the client state is StoreId 0');
    assert.equal(await getSettingAsync('productfeature.prd-sel-001', 0, null), false);

    const beforeStore = await api.get('/api/platform/registry/features/PRD-SEL-001?storeId=2', SESSIONS.admin);
    assert.equal(beforeStore.forStore, null, 'store 2 states nothing of its own');
    assert.equal(beforeStore.enabled, false, 'so the client value applies');
    assert.equal(beforeStore.resolvedFrom, 'the client value');

    const onForStore = await api.post('/api/platform/registry/features', {
      featureId: 'PRD-SEL-001', enabled: true, storeId: 2,
    }, SESSIONS.admin);
    assert.equal(onForStore.settingStoreId, 2, 'a store state is StoreId n');
    assert.equal(onForStore.state.enabled, true);
    assert.equal(onForStore.state.resolvedFrom, 'the store value', 'and then the store value wins');

    const neverStated = await api.get('/api/platform/registry/features/PRD-SVC-009?storeId=1', SESSIONS.admin);
    if (neverStated.forClient === null && neverStated.forStore === null) {
      assert.equal(neverStated.enabled, false, 'a feature no layer states is off');
      assert.match(neverStated.resolvedFrom, /off, because no layer states it/);
    }

    const trail = await auditTrailAsync({ event: 'AUD-PLT-007', entityId: 'PRD-SEL-001' });
    assert.ok(trail.length >= 2, 'AUD-PLT-007 is written for each change');
    assert.equal(trail[0].actor, 'admin@example.com');
  });

  test('AC-PLT-022-01-03', async () => {
    // "the change is refused with message Plt.FeatureDependencyOff naming the dependency"
    // PRD-IAM-027 cost centres depend on PRD-IAM-022 company accounts
    const dependant = 'PRD-IAM-027';
    const dependency = 'PRD-IAM-022';
    const registry = await api.get('/api/platform/registry?area=IAM', SESSIONS.admin);
    assert.ok(registry.features.find((f) => f.id === dependant).dependsOn.includes(dependency), 'the dependency is in the definitions');

    await api.post('/api/platform/registry/features', { featureId: dependency, enabled: false }, SESSIONS.admin);
    const refused = await api.post('/api/platform/registry/features', { featureId: dependant, enabled: true }, SESSIONS.admin);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Plt.FeatureDependencyOff');
    assert.ok(refused.dependenciesOff.includes(dependency));
    assert.match(refused.message, new RegExp(dependency), 'the message names the dependency');

    await api.post('/api/platform/registry/features', { featureId: dependency, enabled: true }, SESSIONS.admin);
    const allowed = await api.post('/api/platform/registry/features', { featureId: dependant, enabled: true }, SESSIONS.admin);
    assert.equal(allowed.ok, true, 'with the dependency on, the change is saved');
  });

  test('AC-PLT-022-01-04', async () => {
    // "the change is refused with message Plt.FeatureAlwaysOn (Platform core is always on)"
    const core = (await api.get('/api/platform/registry?area=PLT', SESSIONS.admin))
      .features.find((f) => f.tier === 'Platform core');
    assert.ok(core, 'the Platform core tier exists');
    assert.equal(core.alwaysOn, true);
    assert.equal(core.enabled, true);

    const refused = await api.post('/api/platform/registry/features', { featureId: core.id, enabled: false }, SESSIONS.admin);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Plt.FeatureAlwaysOn');
    assert.equal(refused.decision, 'D-01');
    assert.equal((await api.get(`/api/platform/registry/features/${core.id}`, SESSIONS.admin)).enabled, true, 'it stays on');
  });

  test('AC-PLT-022-01-05', async () => {
    // "the plugin is queued for installation and the registry shows message Plt.RestartRequired;
    //  for plugin types that support store limits, store-level states are also written to the
    //  plugin's LimitedToStores"
    await plainRepository('PluginDescriptor').insertAsync({
      systemName: 'Product.EGV', installed: false, supportsStoreLimits: true, limitedToStores: [],
    });
    const queued = await api.post('/api/platform/registry/features', {
      featureId: 'PRD-EGV-002', enabled: true, storeId: 2,
    }, SESSIONS.admin);
    assert.equal(queued.ok, true);
    assert.equal(queued.pluginQueued, true);
    assert.equal(queued.plugin, 'Product.EGV');
    assert.equal(queued.restartRequired, true);
    assert.equal(queued.messageKey, 'Plt.RestartRequired');
    assert.deepEqual(queued.limitedToStores, [2], 'the store state is on the descriptor');

    const descriptor = await plainRepository('PluginDescriptor').getOneAsync((d) => d.systemName === 'Product.EGV');
    assert.equal(descriptor.queuedForInstall, true);
    assert.match(descriptor.queuedThrough, /PreparePluginToInstallAsync/);

    // an installed plugin needs no restart, and its store limits follow the state
    const installed = await api.post('/api/platform/registry/features', {
      featureId: 'PRD-IAM-026', enabled: true, storeId: 2,
    }, SESSIONS.admin);
    assert.equal(installed.pluginQueued, false);
    assert.equal(installed.restartRequired, false);
  });

  test('AC-PLT-022-02-01', async () => {
    // "the feature's pages, widgets and actions are not shown for S and its scheduled work skips S"
    await api.post('/api/platform/registry/features', { featureId: 'PRD-IAM-026', enabled: true, storeId: 1 }, SESSIONS.admin);
    await api.post('/api/platform/registry/features', { featureId: 'PRD-IAM-026', enabled: false, storeId: 2 }, SESSIONS.admin);

    const onStore1 = await api.get('/api/platform/registry/features/PRD-IAM-026/surface?storeId=1', SESSIONS.admin);
    assert.equal(onStore1.enabled, true);
    assert.ok(onStore1.pagesShown.length >= 1, 'the pages are shown');
    assert.equal(onStore1.widgetsRendered, true);
    assert.equal(onStore1.actionsAllowed, true);
    assert.equal(onStore1.scheduledWorkSkipsStore, false);
    assert.equal(onStore1.contract, 'IC-PLT-02');

    const offStore2 = await api.get('/api/platform/registry/features/PRD-IAM-026/surface?storeId=2', SESSIONS.admin);
    assert.equal(offStore2.enabled, false);
    assert.deepEqual(offStore2.pagesShown, [], 'no page is shown for that store');
    assert.equal(offStore2.widgetsRendered, false);
    assert.equal(offStore2.actionsAllowed, false);
    assert.equal(offStore2.scheduledWorkSkipsStore, true);

    const work = await api.get('/api/platform/registry/features/PRD-IAM-026/scheduled-work', SESSIONS.admin);
    assert.equal(work.stores.find((s) => s.storeId === 1).runs, true);
    assert.equal(work.stores.find((s) => s.storeId === 2).skipped, true);

    // and the module itself reads it: assisted service answers for the store it is off in
    const enabled = await api.get('/api/platform/registry/features/PRD-IAM-026/enabled?storeId=2', SESSIONS.admin);
    assert.equal(enabled.enabled, false);
    assert.equal(enabled.contract, 'IC-PLT-02 IsEnabled');
    await api.post('/api/platform/registry/features', { featureId: 'PRD-IAM-026', enabled: true, storeId: 2 }, SESSIONS.admin);
  });
});
