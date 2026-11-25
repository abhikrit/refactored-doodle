// Product.PLT - Platform foundation and multi-client configuration
// Spec: docs/prd/modules/PRD-PLT.md (wave 1 Foundation)
// Owns: the configuration pack loader (PLT-003), the feature registry (PLT-022) and the
// ISettingService override (PLT-004, decision OVR-REG - held by WF-ENG, so the prototype
// records settings changes in the audit trail instead of routing them to a workflow).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  applyClientAsync, availableClientsAsync, currentState, featureRegistryAsync, packInventory,
  settingsViewAsync, repoRoot,
} from './services/platform.js';
import {
  registryAsync, setFeatureAsync, stateAsync, isEnabledAsync, surfaceAsync, scheduledWorkAsync,
  implementingPlugin,
} from './services/registry.js';
import {
  setTypeOverrideAsync, setTransactionOverrideAsync, effectiveParameterAsync, deviationsAsync,
  isNativeSettingKey,
} from './services/overrides.js';
import {
  buildChain, applyPackChainAsync, validatePack, validateChain, discoverPacks, settingsCatalogue,
  declaredSettingKeys, appliedPackSetsAsync, checksumOf, ARTEFACT_SERVICES, WRITE_LOCK_KEY,
} from '../../core/pack-loader.js';
import {
  controlledItemsAsync, controlledAsync, instanceRoleAsync, validateChangeAsync,
  saveSettingThroughControlAsync, changeSetsAsync, changeSetAsync, previewAsync, approveAsync,
  rejectAsync, applyChangeSetAsync, historyAsync, asOfAsync, requestRollbackAsync,
  snapshotAsync, compareSnapshots, changeSetFromDifferencesAsync, registerControlledType,
  registeredTypesAsync, PROTOTYPE_DEFAULT_LABEL,
} from './services/change-control.js';
import {
  exportConfigurationAsync, importConfigurationAsync, promoteAsync, cloneAsync,
  derivedPacksAsync, productRelease, INSTANCE_BOUND_KEYS,
} from './services/promotion.js';
import {
  brandingAsync, themeVariablesAsync, themesPerStoreAsync, documentBrandingAsync,
  setDocumentBrandingAsync, setLogoAsync, setThemeAsync, uploadLogoAsync,
} from './services/branding.js';
import {
  languagesAsync, addLanguageAsync, setLanguageStateAsync, selectorAsync, resourceForAsync,
  interfaceTextAsync, importResourceXmlAsync, coverageAsync, directionAsync, setResourceAsync,
  countriesAsync, addCountryAsync, importStatesCsvAsync, statesForCountryAsync, addressFormAsync,
  setDefaultLanguageAsync,
} from './services/localisation.js';
import {
  storesAsync, storeAsync, resolveStoreAsync, mapToStoresAsync, mappedStoresAsync,
  visibilityAsync, effectiveSettingAsync, settingAcrossStoresAsync, storefrontAsync,
} from './services/stores.js';
import {
  saveTipAsync, deleteTipAsync, tipsForAsync, saveTourAsync, tourForAsync, finishTourAsync,
  replayTourAsync, tourCompletionsAsync, adminFirstRunAsync, setDocumentationLinksAsync,
  tipsAsync, toursAsync, TOUR_ROLES,
} from './services/help.js';
import {
  registerRecordTypeAsync, recordTypesAsync, rulesScreenAsync, rulesAsync, saveRuleAsync,
  runRetentionAsync, runTrackingRetentionAsync, runsAsync, archiveAsync, archiveEntryAsync,
  nativeTasksAsync, holdReasonAsync, recordTypeAsync, ACTIONS, LAYERS, RETENTION_LOCK_KEY,
} from './services/retention.js';

export default definePlugin({
  area: 'PLT',
  startupOrder: 3000,
  async install(ctx) {
    ctx.providers.claimOverride('ISettingService', {
      owner: 'Product.PLT',
      feature: 'PRD-PLT-004',
      startupOrder: 3000,
      note: 'Settings change control. Held by WF-ENG: the prototype default records the change in the SEC-004 trail and labels the feature "Prototype default - decision WF-ENG pending".',
    });

    // PRD-PLT-013 configures multi-store and owns the read side of the native store-mapping
    // service; PRD-SEC-004 owns the save side (BR-SEC-011), which is a separate register entry.
    ctx.providers.claimOverride('StoreMappingService.AuthorizeAsync', {
      owner: 'Product.PLT',
      feature: 'PRD-PLT-013',
      startupOrder: 3000,
      note: 'store-scoped catalogue, search and purchase: an entity with LimitedToStores set is available only in the stores its StoreMapping rows name.',
    });

    const r = Router();
    r.get('/clients', (req, res) => res.json(availableClientsAsync()));
    r.get('/state', (req, res) => {
      const s = currentState();
      res.json({ clientId: s.clientId, storeId: s.storeId, seed: s.seed, chain: s.report?.chain ?? [] });
    });
    r.get('/packs', (req, res) => res.json(packInventory()));
    r.get('/packs/report', (req, res) => res.json(currentState().report));
    r.post('/packs/apply', async (req, res, next) => {
      try {
        const { clientId, storeId = 1 } = req.body ?? {};
        const state = await applyClientAsync({ clientId, storeId, actor: req.actorEmail ?? 'platform' });
        res.json({ clientId: state.clientId, storeId: state.storeId, seed: state.seed, chain: state.report.chain });
      } catch (err) { next(err); }
    });
    r.get('/settings', async (req, res, next) => {
      try { res.json(await settingsViewAsync()); } catch (err) { next(err); }
    });
    r.get('/features', async (req, res, next) => {
      try { res.json(await featureRegistryAsync({ storeId: Number(req.query.storeId ?? 1) })); } catch (err) { next(err); }
    });
    // IC-PLT-03: a module registers its own controlled configuration type. PAY-018 risk rules
    // are the example the chapter names, so the prototype registers them here on PAY's behalf
    // until the PAY module is built.
    registerControlledType({
      typeCode: 'pay.riskrule',
      owningModule: 'Product.PAY',
      impact: 'High',
      validate: async ({ value }) => (typeof value?.enabled === 'boolean'
        ? { errors: [] }
        : { errors: ['a risk rule is enabled or disabled'] }),
      preview: async () => {
        const orders = await ctx.repository('Order').getAllAsync((o) => ['Pending', 'Processing'].includes(o.orderStatus));
        return { impacts: [{ what: 'open orders checked by this rule', count: orders.length }] };
      },
      apply: async (item) => ctx.settings.saveSettingAsync(item.key, item.newValue, item.storeId, 'change-set'),
      readCurrent: async (item) => ctx.settings.getSettingAsync(item.key, item.storeId, null),
    });

    // IC-PLT-08: the record types of modules that are not built in this prototype are registered
    // here, so the retention rules screen offers a rule for each of them, as
    // AC-PLT-020-01-07 requires. The owning module registers its own once it is built.
    for (const descriptor of [
      {
        code: 'orders', owningModule: 'Product.ORD', entity: 'Order', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Anonymise', 'Delete'], personalData: true, anonymiseFields: ['customerEmail', 'customerPhone', 'billingAddress', 'shippingAddress'], note: 'REQ-MPC-FR-322; registered here until PRD-ORD is built',
      },
      {
        code: 'payments', owningModule: 'Product.PAY', entity: 'PaymentTransaction', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], holdCheckName: 'an open payment', holdCheck: async (row) => ['Pending', 'Authorised', 'Authorized', 'RefundPending', 'Disputed'].includes(row?.status), note: 'REQ-MPC-FR-322; registered here until PRD-PAY is built',
      },
      {
        code: 'logs', owningModule: 'Product.ADM', entity: 'Log', dateField: 'createdOnUtc', allowedActions: ['Delete', 'Archive'], note: 'the native ClearLogTask reads CommonSettings.ClearLogOlderThanDays, which the rule sets',
      },
      {
        code: 'crm.tickets', owningModule: 'Product.CRM', entity: 'SupportTicket', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Anonymise', 'Delete'], personalData: true, moduleBuilt: false, holdCheckName: 'an open ticket', note: 'support tickets (REQ-MPC-FR-322); registered here until PRD-CRM is built',
      },
      {
        code: 'crm.calllogs', owningModule: 'Product.CRM', entity: 'CallLog', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], personalData: true, moduleBuilt: false,
      },
      {
        code: 'crm.inboundmessages', owningModule: 'Product.CRM', entity: 'InboundMessage', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], personalData: true, moduleBuilt: false,
      },
      {
        code: 'crm.ratings', owningModule: 'Product.CRM', entity: 'Rating', dateField: 'createdOnUtc', allowedActions: ['Anonymise', 'Delete'], personalData: true, moduleBuilt: false,
      },
      {
        code: 'doc.documents', owningModule: 'Product.DOC', entity: 'GeneratedDocument', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], holdCheckName: 'a legal hold (PRD-DOC-002)', holdCheck: async (row) => row?.legalHold === true, note: 'PRD-DOC-002 document types by retention class',
      },
      {
        code: 'ret.returndata', owningModule: 'Product.RET', entity: 'ReturnRequest', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], holdCheckName: 'an open return', holdCheck: async (row) => !['Closed', 'Cancelled', 'Refunded'].includes(row?.status), note: 'registered here until PRD-RET is built',
      },
      {
        code: 'ret.disputecases', owningModule: 'Product.RET', entity: 'DisputeCase', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], moduleBuilt: false,
      },
      {
        code: 'ret.casemessages', owningModule: 'Product.RET', entity: 'CaseMessage', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], personalData: true, moduleBuilt: false,
      },
      {
        code: 'ret.evidencedownloads', owningModule: 'Product.RET', entity: 'Download', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'], note: 'evidence Downloads',
      },
      {
        code: 'ai.chattranscripts', owningModule: 'Product.AI', entity: 'ChatTranscript', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Anonymise', 'Delete'], personalData: true, moduleBuilt: false, note: 'PRD-AI-003 chat transcripts',
      },
    ]) registerRecordTypeAsync(descriptor);

    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };
    const gate = (permission) => async (req, res, next) => {
      if (!await ctx.security.authorizeAsync(permission, req.actor)) {
        return res.status(403).json({
          ok: false, denied: true, permission, message: `Access denied: ${permission} is required.`,
        });
      }
      return next();
    };

    /* ---------------------------------------- PRD-PLT-003 the pack loader --------------- */
    r.get('/packs/catalogue', send(() => {
      const cat = settingsCatalogue(repoRoot());
      return {
        nativeClasses: Object.fromEntries(Object.entries(cat.nativeClasses).map(([k, v]) => [k, Object.keys(v)])),
        productKeys: Object.keys(cat.productKeys ?? {}),
        removedIn500: cat.removedIn500,
        movedIn500: cat.movedIn500,
        removedPermissionsIn500: cat.removedPermissionsIn500,
        declaredByPlugins: declaredSettingKeys(),
        artefactServices: ARTEFACT_SERVICES,
      };
    }));
    r.post('/packs/validate', send(async (req) => {
      const stores = (await ctx.repository('Store').getAllAsync()).map((x) => x.code ?? String(x.id));
      const pack = req.body?.pack ?? {};
      return {
        problems: validatePack(pack, { root: repoRoot(), stores }),
        checksum: checksumOf(pack),
      };
    }));
    r.post('/packs/validate-set', send((req) => ({ problems: validateChain(req.body?.chain ?? []) })));
    r.post('/packs/apply-chain', gate('Platform.Core.Packs.CreateEditDelete'), send(async (req) => {
      const stores = (await ctx.repository('Store').getAllAsync()).map((x) => x.code ?? String(x.id));
      const chain = req.body?.chain
        ?? buildChain(repoRoot(), req.body?.clientId ?? currentState().clientId, req.body?.storeId ?? 1);
      try {
        return await applyPackChainAsync(chain, {
          storeId: req.body?.storeId ?? 1,
          replace: req.body?.replace !== false,
          actor: req.actorEmail ?? 'platform',
          stores,
          root: repoRoot(),
          conflictChoices: req.body?.conflictChoices ?? null,
          failFileWrite: req.body?.failFileWrite === true,
          failWrite: req.body?.failWrite ?? null,
          force: req.body?.force === true,
        });
      } catch (err) {
        return {
          status: 'Refused', refused: err.refused ?? [], problems: err.problems ?? [], message: err.message,
        };
      }
    }));
    r.get('/packs/applied', send(() => appliedPackSetsAsync()));
    r.get('/packs/deviations', send((req) => deviationsAsync(req.query)));
    r.get('/packs/lock', send(() => ({ lockKey: WRITE_LOCK_KEY })));
    r.get('/packs/parameter', send((req) => effectiveParameterAsync({
      typeCode: req.query.typeCode, parameter: req.query.parameter, storeId: Number(req.query.storeId ?? 1),
    })));
    r.post('/packs/parameter/type-override', send(async (req) => setTypeOverrideAsync({
      ...req.body, actor: req.actorEmail ?? 'administrator', storeId: req.storeId,
    })));
    r.post('/packs/parameter/transaction-override', send(async (req) => setTransactionOverrideAsync({
      ...req.body, actor: req.actorEmail ?? 'operator', storeId: req.storeId,
    })));
    r.get('/packs/native-key', send((req) => ({
      key: req.query.key, nativeSetting: isNativeSettingKey(req.query.key),
    })));

    /* ------------------------------------------- PRD-PLT-022 the feature registry ------- */
    r.get('/registry', send(async (req) => registryAsync({
      storeId: Number(req.query.storeId ?? 1), actor: req.actor, area: req.query.area ?? null,
    })));
    r.post('/registry/features', send(async (req) => setFeatureAsync({
      featureId: req.body?.featureId,
      enabled: req.body?.enabled === true,
      storeId: req.body?.storeId ?? null,
      actor: req.actor,
      by: req.actorEmail ?? 'administrator',
    })));
    r.get('/registry/features/:id', send((req) => stateAsync({
      featureId: req.params.id, storeId: Number(req.query.storeId ?? 1),
    })));
    r.get('/registry/features/:id/enabled', send(async (req) => ({
      featureId: req.params.id,
      enabled: await isEnabledAsync(req.params.id, Number(req.query.storeId ?? 1)),
      contract: 'IC-PLT-02 IsEnabled',
      plugin: implementingPlugin(req.params.id),
    })));
    r.get('/registry/features/:id/surface', send((req) => surfaceAsync({
      featureId: req.params.id, storeId: Number(req.query.storeId ?? 1),
    })));
    r.get('/registry/features/:id/scheduled-work', send((req) => scheduledWorkAsync({ featureId: req.params.id })));

    /* ------------------------------------------- PRD-PLT-004 settings change control ---- */
    r.get('/change-control', send(async (req) => ({
      controlledItems: await controlledItemsAsync(req.storeId),
      instanceRole: await instanceRoleAsync(req.storeId),
      registeredTypes: await registeredTypesAsync(),
      heldBy: 'WF-ENG',
      prototypeDefaultLabel: PROTOTYPE_DEFAULT_LABEL,
      contract: 'IC-PLT-03',
    })));
    r.get('/change-control/controlled', send((req) => controlledAsync(req.query.key, req.storeId)));
    r.post('/change-control/validate', send((req) => validateChangeAsync({ ...req.body, storeId: req.storeId })));
    r.post('/change-control/settings', send(async (req) => saveSettingThroughControlAsync({
      ...req.body, actor: req.actorEmail ?? 'administrator',
    })));
    r.get('/change-control/sets', send((req) => changeSetsAsync(req.query)));
    r.get('/change-control/sets/:id', send((req) => changeSetAsync(Number(req.params.id))));
    r.get('/change-control/sets/:id/preview', send((req) => previewAsync({ changeSetId: Number(req.params.id) })));
    r.post('/change-control/sets/:id/approve', send(async (req) => approveAsync({
      changeSetId: Number(req.params.id), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/change-control/sets/:id/reject', send(async (req) => rejectAsync({
      changeSetId: Number(req.params.id), reason: req.body?.reason, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/change-control/history', send(async (req) => historyAsync({
      key: req.query.key ?? null,
      actor: req.query.actor ?? null,
      storeId: req.query.storeId === undefined ? null : Number(req.query.storeId),
      from: req.query.from ?? null,
      to: req.query.to ?? null,
      requester: req.query.gated === 'true' ? req.actor : null,
    })));
    r.get('/change-control/as-of', send((req) => asOfAsync({ at: req.query.at, storeId: req.storeId })));
    r.post('/change-control/rollback', send(async (req) => requestRollbackAsync({
      ...req.body, actor: req.actorEmail ?? 'administrator',
    })));
    r.get('/change-control/snapshot', send((req) => snapshotAsync({
      storeId: Number(req.query.storeId ?? 0), label: req.query.label ?? 'now',
    })));
    r.post('/change-control/compare', send((req) => compareSnapshots({ left: req.body?.left, right: req.body?.right })));
    r.post('/change-control/from-differences', send(async (req) => changeSetFromDifferencesAsync({
      ...req.body, actor: req.actorEmail ?? 'administrator',
    })));
    r.post('/change-control/apply', send(async (req) => applyChangeSetAsync({
      changeSetId: Number(req.body?.changeSetId), actor: req.actorEmail, storeId: req.storeId,
    })));

    /* ---------------------------- PRD-PLT-005 export, import, promotion and clone ------- */
    r.get('/promotion/release', send(() => ({ productRelease: productRelease(), instanceBoundKeys: INSTANCE_BOUND_KEYS })));
    r.post('/promotion/export', send(async (req) => exportConfigurationAsync({
      actor: req.actor, by: req.actorEmail, instanceCode: req.body?.instanceCode ?? null, storeId: req.storeId, excludeInstanceBound: req.body?.excludeInstanceBound === true,
    })));
    r.post('/promotion/import', send(async (req) => importConfigurationAsync({
      pack: req.body?.pack,
      manifest: req.body?.manifest,
      actor: req.actor,
      by: req.actorEmail,
      storeId: req.storeId,
      countryPackId: req.body?.countryPackId ?? null,
      conflictChoices: req.body?.conflictChoices ?? null,
      conflictChoice: req.body?.conflictChoice ?? null,
    })));
    r.post('/promotion/promote', send(async (req) => promoteAsync({
      testSnapshot: req.body?.testSnapshot, keys: req.body?.keys ?? null, actor: req.actor, by: req.actorEmail, storeId: req.body?.storeId ?? 0,
    })));
    r.post('/promotion/clone', send(async (req) => cloneAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/promotion/derived', send(() => derivedPacksAsync()));

    /* ---------------------------------------- PRD-PLT-006 branding and theme ----------- */
    r.get('/branding', send((req) => brandingAsync({ storeId: Number(req.query.storeId ?? req.storeId) })));
    r.get('/branding/theme', send((req) => themeVariablesAsync({ storeId: Number(req.query.storeId ?? req.storeId) })));
    r.get('/branding/themes', send(() => themesPerStoreAsync()));
    r.get('/branding/documents', send((req) => documentBrandingAsync({ storeId: Number(req.query.storeId ?? req.storeId) })));
    r.post('/branding/documents', send((req) => setDocumentBrandingAsync({ ...req.body, actor: req.actor })));
    r.post('/branding/logo/upload', send((req) => uploadLogoAsync({
      storeId: Number(req.body?.storeId ?? req.storeId),
      fileName: req.body?.fileName,
      contentType: req.body?.contentType ?? null,
      bytes: Buffer.from(req.body?.base64 ?? '', 'base64'),
      actor: req.actor,
    })));
    r.post('/branding/logo', send((req) => setLogoAsync({
      storeId: Number(req.body?.storeId ?? req.storeId), pictureId: req.body?.pictureId, actor: req.actor,
    })));
    r.post('/branding/theme', send((req) => setThemeAsync({
      storeId: Number(req.body?.storeId ?? req.storeId), theme: req.body?.theme, actor: req.actor,
    })));

    /* ---------------------------------------- PRD-PLT-009 languages and regions -------- */
    r.get('/languages', send(() => languagesAsync()));
    r.post('/languages', send((req) => addLanguageAsync({ ...req.body, actor: req.actor })));
    r.post('/languages/:id/state', send((req) => setLanguageStateAsync({
      languageId: Number(req.params.id), ...req.body, actor: req.actor,
    })));
    r.get('/languages/selector', send((req) => selectorAsync({ storeId: Number(req.query.storeId ?? req.storeId) })));
    r.get('/languages/coverage', send((req) => coverageAsync({ keys: req.query.keys ? String(req.query.keys).split(',') : null })));
    r.get('/languages/:id/direction', send((req) => directionAsync({
      languageId: Number(req.params.id), storeId: Number(req.query.storeId ?? req.storeId),
    })));
    r.get('/languages/:id/resource', send((req) => resourceForAsync({
      key: req.query.key, languageId: Number(req.params.id), storeId: Number(req.query.storeId ?? req.storeId),
    })));
    r.post('/languages/:id/resource', send(async (req) => ({
      ok: true,
      resource: await setResourceAsync({ languageId: Number(req.params.id), ...req.body, actor: req.actor }),
    })));
    r.post('/languages/:id/interface-text', send((req) => interfaceTextAsync({
      keys: req.body?.keys ?? [], languageId: Number(req.params.id), storeId: Number(req.body?.storeId ?? req.storeId),
    })));
    r.post('/languages/:id/import-xml', send((req) => importResourceXmlAsync({
      languageId: Number(req.params.id), xml: req.body?.xml, fileName: req.body?.fileName ?? 'language.xml', actor: req.actor,
    })));
    r.post('/languages/default', send((req) => setDefaultLanguageAsync({
      languageId: req.body?.languageId, storeId: Number(req.body?.storeId ?? 0), actor: req.actor,
    })));
    r.get('/countries', send(() => countriesAsync()));
    r.post('/countries', send((req) => addCountryAsync({ ...req.body, actor: req.actor })));
    r.post('/countries/:id/import-states', send((req) => importStatesCsvAsync({
      countryId: Number(req.params.id), csv: req.body?.csv, fileName: req.body?.fileName ?? 'states.csv', actor: req.actor,
    })));
    r.get('/countries/:id/states', send((req) => statesForCountryAsync(Number(req.params.id))));
    r.get('/address-form', send((req) => addressFormAsync({ countryId: req.query.countryId ? Number(req.query.countryId) : null })));

    /* ---------------------------------------- PRD-PLT-013 multi-store ------------------ */
    r.get('/stores', send(() => storesAsync()));
    r.get('/stores/resolve', send((req) => resolveStoreAsync({ host: req.query.host ?? null, storeId: req.query.storeId ?? req.storeId })));
    r.get('/stores/setting', send((req) => (req.query.allStores === 'true'
      ? settingAcrossStoresAsync(req.query.key)
      : effectiveSettingAsync({ key: req.query.key, storeId: Number(req.query.storeId ?? req.storeId) }))));
    r.get('/stores/visibility', send((req) => visibilityAsync({
      entity: req.query.entity ?? 'Product', entityId: Number(req.query.entityId), storeId: Number(req.query.storeId ?? req.storeId),
    })));
    r.get('/stores/mappings', send((req) => mappedStoresAsync(req.query.entity ?? 'Product', Number(req.query.entityId))));
    r.post('/stores/mappings', gate('Configuration.ManageStores'), send((req) => mapToStoresAsync({
      ...req.body, actor: req.actorEmail,
    })));
    r.get('/stores/:id/storefront', send(async (req) => storefrontAsync({ storeId: req.params.id, customer: req.actor })));
    r.get('/stores/:id', send((req) => storeAsync(req.params.id)));

    /* ---------------------------------------- PRD-PLT-019 help and tours --------------- */
    r.get('/help/tips', send((req) => tipsForAsync({
      route: req.query.route,
      role: req.query.role ?? null,
      languageId: Number(req.query.languageId ?? 1),
      storeId: Number(req.query.storeId ?? req.storeId),
    })));
    r.get('/help/tips/all', send(() => tipsAsync()));
    r.post('/help/tips', send((req) => saveTipAsync({ ...req.body, actor: req.actor })));
    r.delete('/help/tips/:id', send((req) => deleteTipAsync({ tipId: Number(req.params.id), actor: req.actor })));
    r.get('/help/tours', send(() => toursAsync()));
    r.get('/help/tours/roles', send(() => ({ roles: TOUR_ROLES })));
    r.post('/help/tours', send((req) => saveTourAsync({ ...req.body, actor: req.actor })));
    r.get('/help/tour', send((req) => tourForAsync({
      role: req.query.role,
      customerId: Number(req.query.customerId ?? req.actor?.id ?? 0),
      languageId: Number(req.query.languageId ?? 1),
    })));
    r.post('/help/tour/finish', send((req) => finishTourAsync({
      tourId: Number(req.body?.tourId), customerId: Number(req.body?.customerId ?? req.actor?.id ?? 0), status: req.body?.status,
    })));
    r.post('/help/tour/replay', send((req) => replayTourAsync({
      tourId: Number(req.body?.tourId), customerId: Number(req.body?.customerId ?? req.actor?.id ?? 0),
    })));
    r.get('/help/tour/completions', send((req) => tourCompletionsAsync(req.query.customerId ? Number(req.query.customerId) : null)));
    r.get('/help/admin-first-run', send((req) => adminFirstRunAsync({
      storeId: Number(req.query.storeId ?? req.storeId), languageId: Number(req.query.languageId ?? 1),
    })));
    r.post('/help/documentation-links', send((req) => setDocumentationLinksAsync({
      storeId: Number(req.body?.storeId ?? 0), show: req.body?.show, actor: req.actor,
    })));

    /* ---------------------------------------- PRD-PLT-020 retention and archival ------- */
    r.get('/retention/record-types', send(() => recordTypesAsync()));
    r.get('/retention/record-types/:code', send((req) => recordTypeAsync(req.params.code).then((t) => (t ? { ...t, holdCheck: undefined, hasHoldCheck: typeof t.holdCheck === 'function' } : { ok: false, message: 'no such record type' }))));
    r.get('/retention/rules', send(() => rulesScreenAsync()));
    r.get('/retention/rules/raw', send(() => rulesAsync()));
    r.post('/retention/rules', send((req) => saveRuleAsync({ ...req.body, actor: req.actor, storeId: req.storeId })));
    r.post('/retention/run', gate('Platform.Core.Retention.CreateEditDelete'), send((req) => runRetentionAsync({
      actor: req.actor,
      batchSize: Number(req.body?.batchSize ?? 100),
      recordType: req.body?.recordType ?? null,
      dryRun: req.body?.dryRun === true,
      storeId: req.storeId,
    })));
    r.post('/retention/run-tracking', gate('Platform.Core.Retention.CreateEditDelete'), send((req) => runTrackingRetentionAsync({
      actor: req.actor, storeId: req.storeId,
    })));
    r.get('/retention/runs', gate('Platform.Core.Retention.CreateEditDelete'), send(() => runsAsync()));
    r.get('/retention/archive', send((req) => archiveAsync({ recordType: req.query.recordType ?? null, requester: req.actor })));
    r.get('/retention/archive/:id', gate('Platform.Core.Retention.CreateEditDelete'), send((req) => archiveEntryAsync(Number(req.params.id))));
    r.get('/retention/native-tasks', send((req) => nativeTasksAsync({ storeId: req.storeId })));
    r.get('/retention/hold', send(async (req) => {
      const type = await recordTypeAsync(req.query.recordType);
      if (!type) return { ok: false, message: 'no such record type' };
      const row = await ctx.repository(type.entity).getByIdAsync(req.query.entityId);
      const reason = row ? await holdReasonAsync(type, row) : null;
      return {
        recordType: type.code, entityId: Number(req.query.entityId), held: Boolean(reason), reason, rule: 'BR-PLT-050',
      };
    }));
    r.get('/retention/lock', send(() => ({ lockKey: RETENTION_LOCK_KEY, actions: ACTIONS, layers: LAYERS })));

    ctx.addRouter('/api/platform', r);
    ctx.declare({
      built: true,
      owns: ['PRD-PLT-003', 'PRD-PLT-004', 'PRD-PLT-005', 'PRD-PLT-006', 'PRD-PLT-009', 'PRD-PLT-013', 'PRD-PLT-019', 'PRD-PLT-020', 'PRD-PLT-022'],
      builtFeatures: ['PRD-PLT-003', 'PRD-PLT-004', 'PRD-PLT-005', 'PRD-PLT-006', 'PRD-PLT-009', 'PRD-PLT-013', 'PRD-PLT-019', 'PRD-PLT-020', 'PRD-PLT-022'],
      note: 'the pack loader, settings change control (prototype default, decision WF-ENG pending), export, import and promotion, branding and theme, languages and regions, multi-store, contextual help, data retention and archival, and the feature registry',
    });
  },
});
