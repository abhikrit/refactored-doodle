// Product.ADM - Administration, workflow and operations console
// Spec: docs/prd/modules/PRD-ADM.md (wave 1 Foundation)
// 12 features, 103 acceptance criteria. ADM-002 and ADM-006 are held by decision WF-ENG and are
// built as the PRD's Proposed option, labelled "Prototype default - decision WF-ENG pending" (P-1).
//
// ADM owns the product extension register (BR-ADM-001 to BR-ADM-008) and its start-up check,
// which runs after every other product plugin so that two plugins never silently replace the
// same core service.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  extensionRegister, refusedAttempts, startupCheck, registerActionFilter, registerRuleProvider,
  runActionFilters,
} from '../../core/providers.js';
import { authorizeAsync } from '../../core/permissions.js';
import {
  CONSOLE_AREAS, consoleAreasForAsync, checkAreaAsync, scheduleTasksAsync, updateScheduleTaskAsync,
  runScheduleTaskAsync, logAsync, clearLogAsync, widgetsAsync, setWidgetActiveAsync,
  bulkEditSaveAsync, bulkArchiveAsync, bulkDeleteAsync, setCustomerActiveAsync, gdprDeleteAsync,
} from './services/console.js';
import {
  ruleSetsAsync, ruleSetAsync, patternsAsync, saveRuleAsync, createFromPatternAsync, testRuleAsync,
  activateRuleAsync, setPrecedenceAsync, setStrategyAsync, evaluateAsync, evaluationLogAsync,
} from './services/rules.js';
import {
  typesAsync, createTransactionAsync, setParameterAsync, acceptQuoteAsync, chainedTransactionAsync,
  transactionsAsync, deviationsAsync,
} from './services/transaction-types.js';
import {
  definitionsAsync, definitionAsync, saveDefinitionAsync, publishDefinitionAsync,
  retireDefinitionAsync, validateDefinitionAsync, toBpmnXml, fromBpmnXml, startCaseAsync,
  processStartRequestAsync, runEngineAsync, advanceCaseAsync, signalCaseAsync, cancelCaseAsync,
  retryFailedStepAsync, casesAsync, caseAsync, replayAsync, simulateAsync, registerStepOperationAsync,
  stepOperationsAsync,
} from './services/workflow.js';
import {
  queueForAsync, openItemAsync, submitAsync, decideAsync, resubmitAsync, appealAsync,
  markConditionDoneAsync, withdrawAsync, itemsAsync, chainsAsync, reasonCodesAsync,
  moderationQueuesAsync, registerApprovalCallbacks, approvalCallbacks,
} from './services/approvals.js';
import {
  bindingsAsync, quotasAsync, screeningsAsync, recomputeEligibilityAsync, cartCheckAsync,
  placementParticipantAsync, quotaReportAsync, screenPartyAsync, decideScreeningAsync, saveQuotaAsync,
} from './services/eligibility.js';
import {
  ADM_CONTEXTS, registerUploadContextAsync, uploadContextsAsync, uploadScansAsync,
  setUploadPolicyAsync, checkUploadAsync, completeQuarantineScanAsync,
} from './services/uploads.js';
import {
  raiseExceptionAsync, queueAsync, takeAsync, resolveAsync, retryAsync, escalateAsync,
  bulkActionAsync, detectPatternsAsync, registerExceptionType, exceptionTypes,
  alertRulesAsync, alertsAsync, saveAlertRuleAsync, runAlertTaskAsync, acknowledgeAlertAsync,
} from './services/exceptions.js';
import {
  consoleForAsync, operationalOrderViewAsync, dashboardAsync, saveDashboardAsync, saveViewAsync,
  savedViewsAsync, saveDraftAsync, draftAsync, discardDraftAsync, runShortcutAsync,
  onlineCustomersAsync, workItemMetricsAsync, QUEUES, TILES, SHORTCUTS,
} from './services/operations.js';
import {
  libraryAsync, templatesAsync, saveTemplateAsync, restoreVersionAsync, inheritanceAsync,
  cloneTemplateAsync, analyticsAsync, publishToSharedLibraryAsync, adoptFromSharedLibraryAsync,
  sharedLibraryAsync, recordUsageAsync, registerTemplateApproval, WORKSPACE_AREAS,
} from './services/templates.js';
import { registerEventCode, eventCodes } from '../product-trk/services/event-codes.js';
import { messageGateways } from '@product/mocks';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

// nopCommerce plugins bundled with 5.00.1 that replace a service the product owns.
// Misc.Brevo replaces IWorkflowMessageService at NopStartup Order 3000 (AC-ADM-001-04-05).
const BUNDLED_PLUGINS_THAT_REPLACE = [
  { systemName: 'Misc.Brevo', replaces: ['IWorkflowMessageService'], installed: false },
];

/** BR-ADM-085: ADM sends only through TRK-005, under codes it registers at installation. */
const ADM_EVENT_CODES = [
  { code: 'Administration.ApprovalAssigned', feature: 'PRD-ADM-006', defaultChannels: ['email', 'inapp'] },
  { code: 'Administration.ApprovalDecided', feature: 'PRD-ADM-006', defaultChannels: ['email'] },
  { code: 'Administration.WorkflowCaseFailed', feature: 'PRD-ADM-002', defaultChannels: ['inapp'] },
  { code: 'Administration.AlertRaised', feature: 'PRD-ADM-010', defaultChannels: ['email'] },
  { code: 'Administration.UploadInfected', feature: 'PRD-ADM-008', defaultChannels: ['email'] },
  { code: 'Administration.ScreeningMatch', feature: 'PRD-ADM-005', defaultChannels: ['inapp'] },
];

/** The ADM upload contexts of the native upload actions (BR-ADM-006, BR-ADM-007). */
const DEFAULT_UPLOAD_POLICY = {
  'storefront-attribute-file': { allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'], maxSizeKb: 2048 },
  'checkout-attribute-file': { allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'], maxSizeKb: 2048 },
  'return-request-file': { allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'], maxSizeKb: 4096 },
  avatar: { allowedExtensions: ['png', 'jpg', 'jpeg'], maxSizeKb: 512 },
  'vendor-picture': { allowedExtensions: ['png', 'jpg', 'jpeg'], maxSizeKb: 1024 },
  'admin-picture': { allowedExtensions: ['png', 'jpg', 'jpeg', 'gif'], maxSizeKb: 4096 },
  'product-picture': { allowedExtensions: ['png', 'jpg', 'jpeg'], maxSizeKb: 4096 },
  'product-3d-object': { allowedExtensions: ['glb'], maxSizeKb: 20480 },
  'admin-download': { allowedExtensions: ['pdf', 'zip', 'xlsx', 'docx'], maxSizeKb: 20480 },
  'data-imports': { allowedExtensions: ['xlsx', 'csv'], maxSizeKb: 10240 },
  'language-import': { allowedExtensions: ['xml'], maxSizeKb: 2048 },
  'store-icons': { allowedExtensions: ['png', 'ico'], maxSizeKb: 256 },
  'plugin-upload': { allowedExtensions: ['zip'], maxSizeKb: 51200 },
  // the HTML editor applies its own allow-list and 10 MB limit; the stricter of the two applies
  'html-editor-files': { allowedExtensions: ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt'], maxSizeKb: 10240 },
  'other-upload': { allowedExtensions: ['pdf'], maxSizeKb: 1024 },
};

export default definePlugin({
  area: 'ADM',
  // BR-ADM-001: the ADM start-up runs after every other product plugin, so the register is
  // complete before the check reads it.
  startupOrder: 9000,
  async install(ctx) {
    /* ---- the register's own entries (BR-ADM-002 to BR-ADM-008) ------------------------ */
    // Action filters on Admin OrderController.AddShipment: PAY, INV and LOG each guard it and
    // each may refuse independently (AC-ADM-001-04-04, BR-ADM-005).
    registerActionFilter('Admin OrderController.AddShipment', {
      owner: 'Product.PAY', feature: 'PRD-PAY-016', order: 100, rule: 'BR-ADM-005', note: 'refuses while a refund is in flight',
    });
    registerActionFilter('Admin OrderController.AddShipment', {
      owner: 'Product.INV', feature: 'PRD-INV-004', order: 200, rule: 'BR-ADM-005', note: 'refuses when the reservation is not held',
    });
    registerActionFilter('Admin OrderController.AddShipment', {
      owner: 'Product.LOG', feature: 'PRD-LOG-012', order: 300, rule: 'BR-ADM-005', note: 'refuses when the service level requires a proof method (Log.PodRequired)',
    });

    // Single-owner actions: one filter, and other features supply rules to the owner
    // (AC-ADM-001-04-06, decision SINGLE-FILTER, BR-ADM-006 and BR-ADM-007).
    registerActionFilter('Admin CustomerController.Impersonate', {
      owner: 'Product.IAM', feature: 'PRD-IAM-026', order: 100, singleOwner: true, rule: 'BR-ADM-006', note: 'the single impersonation filter',
    });
    registerRuleProvider('Admin CustomerController.Impersonate', {
      owner: 'Product.CRM', feature: 'PRD-CRM-015', name: 'account managers for their assigned customers',
    });
    registerRuleProvider('Admin CustomerController.Impersonate', {
      owner: 'Product.CHK', feature: 'PRD-CHK-013', name: 'agents for customers of their own outlet',
    });
    registerActionFilter('Nop.Web DownloadController.GetFileUpload', {
      owner: 'Product.SEC', feature: 'PRD-SEC-002', order: 100, singleOwner: true, rule: 'BR-ADM-007', note: 'downloads go through SEC-002',
    });
    registerRuleProvider('Nop.Web DownloadController.GetFileUpload', {
      owner: 'Product.EGV', feature: 'PRD-EGV-002', name: 'agency files',
    });
    registerActionFilter('Nop.Web CheckoutController.ConfirmOrder', {
      owner: 'Product.CHK', feature: 'PRD-CHK-009', order: 100, singleOwner: true, rule: 'BR-ADM-007', note: 'acknowledgements and the terms checkbox are enforced on the server',
    });
    registerActionFilter('Admin SettingController.SettingUpdate', {
      owner: 'Product.PLT', feature: 'PRD-PLT-004', order: 100, singleOwner: true, rule: 'BR-ADM-006', note: 'settings change control',
    });

    // ADM-008 is the single upload filter on every upload action (BR-ADM-060, SINGLE-FILTER)
    for (const context of ADM_CONTEXTS) {
      for (const action of context.actions) {
        registerActionFilter(action, {
          owner: 'Product.ADM',
          feature: 'PRD-ADM-008',
          order: 50,
          singleOwner: true,
          rule: action.startsWith('Admin') ? 'BR-ADM-006' : 'BR-ADM-007',
          note: `upload policy and scan for context ${context.code}`,
        });
      }
    }

    /* ---- what ADM registers with other modules --------------------------------------- */
    for (const c of ADM_EVENT_CODES) {
      registerEventCode({ ...c, owner: 'Product.ADM', note: 'ADM sends only through TRK-005' });
    }

    for (const context of ADM_CONTEXTS) {
      await registerUploadContextAsync({
        code: context.code,
        owningFeature: 'PRD-ADM-008',
        coveredActions: context.actions,
        ...DEFAULT_UPLOAD_POLICY[context.code],
        scanEnabled: true,
        failMode: 'reject',
      });
    }

    // IC-ADM-01 RegisterStepOperation: what a call-to-another-system step may name
    await registerStepOperationAsync({
      code: 'EGV.VerifyOrRegister',
      owningModule: 'Product.EGV',
      feature: 'PRD-EGV-002',
      defaultTimeoutMs: 4000,
      defaultRetries: 2,
      note: ', called through the EGV service',
      handler: async (variables) => ({
        ok: variables.identityNumber !== 'UNKNOWN',
        message: variables.identityNumber === 'UNKNOWN' ? 'the registry did not recognise the applicant' : undefined,
        externalReference: `EGV-${String(variables.identityNumber ?? 'REF')}`,
        variables: { verified: variables.identityNumber !== 'UNKNOWN' },
      }),
    });
    await registerStepOperationAsync({
      code: 'LOG.Allocate', owningModule: 'Product.LOG', feature: 'PRD-LOG-004', note: 'allocation through the LOG service', handler: async () => ({ ok: true, variables: { allocated: true } }),
    });
    await registerStepOperationAsync({
      code: 'LOG.BookCarrier', owningModule: 'Product.LOG', feature: 'PRD-LOG-010', note: 'carrier booking through the LOG service', handler: async () => ({ ok: true, variables: { booked: true } }),
    });
    await registerStepOperationAsync({
      code: 'PAY.ReleaseEscrowStage',
      owningModule: 'Product.PAY',
      feature: 'PRD-PAY-007',
      rule: 'BR-ADM-011',
      note: 'the step calls PAY; it changes no payment state itself',
      handler: async (variables) => ({ ok: true, released: variables.amount ?? null }),
    });
    await registerStepOperationAsync({
      code: 'INT.PostJournal', owningModule: 'Product.INT', feature: 'PRD-INT-006', note: 'INT-005 adapter operation (SAGE 200)', handler: async () => ({ ok: true }),
    });

    // IC-ADM-04: the exception types the modules raise, with the actions each declares batch-safe
    registerExceptionType('WorkflowStepFailed', {
      feature: 'PRD-ADM-002',
      actions: [{ action: 'retry', batchSafe: true }, { action: 'escalate', batchSafe: true }, { action: 'resolve', batchSafe: false }],
      handle: async ({ record }) => ({ ok: record.attempts >= 1, message: 'the step failed again' }),
    });
    registerExceptionType('IntegrationError', {
      feature: 'PRD-INT-005',
      actions: [{ action: 'retry', batchSafe: true }, { action: 'escalate', batchSafe: true }, { action: 'resolve', batchSafe: false }],
      handle: async ({ record }) => ({ ok: record.severity !== 'High', message: 'the other system is still returning an error' }),
    });
    registerExceptionType('StuckOrder', {
      feature: 'PRD-ORD-002',
      actions: [{ action: 'escalate', batchSafe: true }, { action: 'resolve', batchSafe: false }],
      handle: async () => ({ ok: false, message: 'a stuck order is resolved by hand' }),
    });

    registerTemplateApproval();

    // ADM-005 plugs into the CHK-003 override as a provider; it overrides nothing (BR-ADM-002)
    ctx.providers.registerProvider('IC-CHK-01', {
      name: 'eligibility and quota',
      area: 'ADM',
      feature: 'PRD-ADM-005',
      fn: async ({ product, quantity, customer }) => cartCheckAsync({ product, quantity, customer }),
    });
    ctx.providers.registerProvider('IC-CHK-06', {
      name: 'quota reservation',
      area: 'ADM',
      feature: 'PRD-ADM-005',
      fn: async (args) => placementParticipantAsync(args),
    });

    // BR-ADM-011: consumers only enqueue a start request; the engine runner processes it
    for (const [event, definitionCode] of [
      ['OrderPlacedEvent', 'fulfilment-workflow'],
      ['OrderPaidEvent', 'fulfilment-workflow'],
      ['ShipmentCreatedEvent', 'shipping-workflow'],
      ['ShipmentDispatchedEvent', 'shipping-workflow'],
      ['ShipmentDeliveredEvent', 'shipping-workflow'],
    ]) {
      ctx.events.subscribe(event, {
        area: 'ADM',
        feature: 'PRD-ADM-002',
        name: `enqueue-${definitionCode}`,
        fn: async (payload) => {
          await startCaseAsync({
            definitionCode,
            businessKey: { type: event.startsWith('Order') ? 'Order' : 'Shipment', id: payload?.orderNumber ?? payload?.id ?? 'unknown' },
            variables: payload ?? {},
            idempotencyKey: `${event}-${payload?.orderNumber ?? payload?.id ?? 'unknown'}`,
            enqueueOnly: true,
          });
        },
      });
    }
    ctx.events.subscribe('EntityUpdatedEvent<Customer>', {
      area: 'ADM',
      feature: 'PRD-ADM-005',
      name: 'enqueue-eligibility-recomputation',
      fn: async () => { /* the nightly task recomputes; the consumer only marks it (BR-ADM-011) */ },
    });

    /* ---- the start-up check (AC-ADM-001-04-01) ---------------------------------------- */
    const check = startupCheck({
      installedPlugins: BUNDLED_PLUGINS_THAT_REPLACE.filter((p) => p.installed),
    });
    for (const w of check.warnings) {
      await ctx.events.publishAsync('SystemWarningCreatedEvent', w);
    }
    // IC-PLT-08: the ADM-003 rule evaluation log and the ADM-007 work drafts.
    ctx.providers.registerProvider('IC-PLT-08', {
      area: 'ADM',
      feature: 'PRD-ADM-003',
      name: 'adm record types',
      fn: async () => [
        {
          code: 'adm.ruleevaluationlog', owningModule: 'Product.ADM', entity: 'RuleEvaluationLog', dateField: 'createdOnUtc', allowedActions: ['Archive', 'Delete'],
        },
        {
          code: 'adm.workdrafts', owningModule: 'Product.ADM', entity: 'WorkDraft', dateField: 'createdOnUtc', allowedActions: ['Delete'], note: 'PRD-ADM-007 work drafts',
        },
      ],
    });

    ctx.declare({
      built: true,
      owns: ['PRD-ADM-001', 'PRD-ADM-002', 'PRD-ADM-003', 'PRD-ADM-004', 'PRD-ADM-005', 'PRD-ADM-006',
        'PRD-ADM-007', 'PRD-ADM-008', 'PRD-ADM-009', 'PRD-ADM-010', 'PRD-ADM-011', 'PRD-ADM-012'],
      heldWithPrototypeDefault: ['PRD-ADM-002', 'PRD-ADM-006'],
      note: 'The whole ADM module. ADM-002 and ADM-006 are held by decision WF-ENG and build the PRD Proposed option (P-1).',
      startupCheck: { ok: check.ok, warnings: check.warnings.length },
    });

    /* ---- routes ----------------------------------------------------------------------- */
    const r = Router();
    const me = (req) => currentCustomerAsync(req.sessionId);
    const actor = (req) => req.actorEmail ?? 'admin';
    /** The native CheckPermission attribute, as one guard for these routes. */
    const gate = (permission) => async (req, res, next) => {
      try {
        const customer = await me(req);
        if (!await authorizeAsync(permission, customer)) {
          return res.status(403).json({ ok: false, permission, message: `Access denied: ${permission} is required.` });
        }
        req.customer = customer;
        return next();
      } catch (err) { return next(err); }
    };
    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };

    /* -- PRD-ADM-001 -------------------------------------------------------------------- */
    r.get('/console', send(async (req) => consoleAreasForAsync(await me(req))));
    r.get('/console/areas/:id', async (req, res, next) => {
      try {
        const result = await checkAreaAsync(req.params.id, await me(req));
        res.status(result.ok ? 200 : 403).json(result);
      } catch (err) { next(err); }
    });
    r.get('/schedule-tasks', send(() => scheduleTasksAsync()));
    r.patch('/schedule-tasks/:id', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('system-schedule-tasks', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await updateScheduleTaskAsync({ id: Number(req.params.id), ...req.body, actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.post('/schedule-tasks/:id/run', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('system-schedule-tasks', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await runScheduleTaskAsync({ id: Number(req.params.id), fail: req.body?.fail === true, actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.get('/log', send((req) => logAsync({ level: req.query.level })));
    r.post('/maintenance/clear-log', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('system-maintenance', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await clearLogAsync({ actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.get('/widgets', send(() => widgetsAsync()));
    r.patch('/widgets/:id', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('configuration-widgets', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await setWidgetActiveAsync({ id: Number(req.params.id), isActive: req.body.isActive, actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.post('/bulk-edit', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('catalog-products', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await bulkEditSaveAsync({ changes: req.body.changes ?? [], actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.post('/bulk-archive', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('catalog-products', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await bulkArchiveAsync({ ids: req.body.ids ?? [], actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.post('/bulk-delete', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('catalog-products', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await bulkDeleteAsync({ ids: req.body.ids ?? [], actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.post('/customers/active', async (req, res, next) => {
      try {
        const g = await checkAreaAsync('customers', await me(req));
        if (!g.ok) return res.status(403).json(g);
        return res.json(await setCustomerActiveAsync({ ...req.body, actor: actor(req) }));
      } catch (err) { return next(err); }
    });
    r.post('/customers/gdpr-delete', gate('Customers.GDPRManage'), send((req) => gdprDeleteAsync({ ...req.body, actor: actor(req) })));
    r.get('/extension-register', gate('Administration.Core.Extensions.View'), send(() => ({
      entries: extensionRegister(),
      refusedAttempts: refusedAttempts(),
      startupCheck: startupCheck({ installedPlugins: BUNDLED_PLUGINS_THAT_REPLACE.filter((p) => p.installed) }),
      bundledPlugins: BUNDLED_PLUGINS_THAT_REPLACE,
      areas: CONSOLE_AREAS,
      eventCodes: eventCodes(),
    })));
    r.post('/extension-register/simulate', async (req, res, next) => {
      try {
        if (req.body.action) return res.json(await runActionFilters(req.body.action, req.body.context ?? {}));
        if (req.body.installPlugin) {
          const p = BUNDLED_PLUGINS_THAT_REPLACE.find((x) => x.systemName === req.body.installPlugin);
          if (!p) return res.status(404).json({ message: 'unknown bundled plugin' });
          p.installed = req.body.installed !== false;
          const check2 = startupCheck({ installedPlugins: BUNDLED_PLUGINS_THAT_REPLACE.filter((x) => x.installed) });
          for (const w of check2.warnings) await ctx.events.publishAsync('SystemWarningCreatedEvent', w);
          return res.json({ plugin: p, startupCheck: check2 });
        }
        return res.status(400).json({ message: 'send { action } or { installPlugin }' });
      } catch (err) { return next(err); }
    });

    /* -- PRD-ADM-003 rules -------------------------------------------------------------- */
    const RULES_VIEW = 'Administration.Core.Rules.View';
    const RULES_EDIT = 'Administration.Core.Rules.CreateEditDelete';
    r.get('/rules/sets', gate(RULES_VIEW), send(() => ruleSetsAsync()));
    r.get('/rules/sets/:code', gate(RULES_VIEW), send((req) => ruleSetAsync(req.params.code)));
    r.get('/rules/patterns', gate(RULES_VIEW), send(() => patternsAsync()));
    r.get('/rules/log', gate(RULES_VIEW), send((req) => evaluationLogAsync({ ruleSetCode: req.query.ruleSet })));
    r.post('/rules', gate(RULES_EDIT), send((req) => saveRuleAsync({ ...req.body, actor: actor(req) })));
    r.post('/rules/from-pattern', gate(RULES_EDIT), send((req) => createFromPatternAsync({ ...req.body, actor: actor(req) })));
    r.post('/rules/test', gate(RULES_VIEW), send((req) => testRuleAsync(req.body)));
    r.post('/rules/:id/activate', gate(RULES_EDIT), send((req) => activateRuleAsync({ ruleId: Number(req.params.id), actor: actor(req) })));
    r.patch('/rules/:id/precedence', gate(RULES_EDIT), send((req) => setPrecedenceAsync({ ruleId: Number(req.params.id), priority: req.body.priority, actor: actor(req) })));
    r.patch('/rules/sets/:code/strategy', gate(RULES_EDIT), send((req) => setStrategyAsync({ ruleSetCode: req.params.code, strategy: req.body.strategy })));
    r.post('/rules/evaluate', send((req) => evaluateAsync(req.body)));

    /* -- PRD-ADM-004 transaction types -------------------------------------------------- */
    const TYPES_EDIT = 'Administration.Core.TransactionTypes.CreateEditDelete';
    r.get('/transaction-types', send(() => typesAsync()));
    r.get('/transactions', send(() => transactionsAsync()));
    r.get('/transactions/:id/chain', send((req) => chainedTransactionAsync(Number(req.params.id))));
    r.get('/deviations', send(() => deviationsAsync()));
    r.post('/transactions', send((req) => createTransactionAsync({ ...req.body, actor: actor(req) })));
    r.patch('/transactions/:id/parameters', send((req) => setParameterAsync({ transactionId: Number(req.params.id), ...req.body, actor: actor(req) })));
    r.post('/transactions/:id/accept-quote', send((req) => acceptQuoteAsync({ transactionId: Number(req.params.id), actor: actor(req) })));
    r.post('/transaction-types/validate', gate(TYPES_EDIT), send((req) => createTransactionAsync({ ...req.body, actor: actor(req) })));

    /* -- PRD-ADM-005 eligibility, quotas, screening ------------------------------------- */
    const ELIG = 'Administration.Core.Eligibility.CreateEditDelete';
    r.get('/eligibility', gate(ELIG), send(async () => ({
      bindings: await bindingsAsync(), quotas: await quotasAsync(), screenings: await screeningsAsync(),
    })));
    r.post('/eligibility/recompute', gate(ELIG), send((req) => recomputeEligibilityAsync({ customerId: req.body.customerId ?? null, actor: actor(req) })));
    r.post('/quotas', gate(ELIG), send((req) => saveQuotaAsync({ ...req.body, customer: req.customer })));
    r.get('/quota-report', gate(ELIG), send(() => quotaReportAsync()));
    r.post('/screening', gate(ELIG), send((req) => screenPartyAsync({
      ...req.body, adapter: ctx.mocks['Sanctions.Provider'], gateways: messageGateways,
    })));
    r.post('/screening/:id/decide', gate(ELIG), send((req) => decideScreeningAsync({
      screeningId: Number(req.params.id), ...req.body, customer: req.customer,
    })));

    /* -- PRD-ADM-002 workflow ----------------------------------------------------------- */
    const WF_VIEW = 'Administration.Core.Workflows.View';
    const WF_EDIT = 'Administration.Core.Workflows.CreateEditDelete';
    r.get('/workflows', gate(WF_VIEW), send(() => definitionsAsync()));
    r.get('/workflows/:id', gate(WF_VIEW), send((req) => definitionAsync(Number(req.params.id))));
    r.get('/workflows/:id/bpmn', gate(WF_VIEW), async (req, res, next) => {
      try {
        const d = await definitionAsync(Number(req.params.id));
        if (!d) return res.status(404).json({ message: 'unknown definition' });
        res.type('application/xml');
        return res.send(toBpmnXml(d));
      } catch (err) { return next(err); }
    });
    r.post('/workflows', gate(WF_EDIT), send((req) => saveDefinitionAsync({ ...req.body, actor: actor(req) })));
    r.post('/workflows/import', gate(WF_EDIT), send((req) => saveDefinitionAsync({ ...fromBpmnXml(req.body.xml), actor: actor(req) })));
    r.post('/workflows/:id/validate', gate(WF_EDIT), send(async (req) => validateDefinitionAsync(await definitionAsync(Number(req.params.id)), { packs: req.body.packs ?? {} })));
    r.post('/workflows/:id/publish', gate(WF_EDIT), send((req) => publishDefinitionAsync({ id: Number(req.params.id), actor: actor(req), packs: req.body.packs ?? {} })));
    r.post('/workflows/:id/retire', gate(WF_EDIT), send((req) => retireDefinitionAsync({ id: Number(req.params.id), actor: actor(req) })));
    r.post('/workflows/:id/simulate', gate(WF_VIEW), send((req) => simulateAsync({ definitionId: Number(req.params.id), sampleData: req.body.sampleData ?? {} })));
    r.get('/step-operations', gate(WF_VIEW), send(() => stepOperationsAsync()));
    r.get('/workflow-cases', gate(WF_VIEW), send(() => casesAsync()));
    r.get('/workflow-cases/:id', gate(WF_VIEW), send((req) => caseAsync(Number(req.params.id))));
    r.get('/workflow-cases/:id/replay', gate(WF_VIEW), send((req) => replayAsync(Number(req.params.id))));
    r.post('/workflow-cases', gate(WF_VIEW), send((req) => startCaseAsync(req.body)));
    r.post('/workflow-cases/:id/signal', gate(WF_VIEW), send((req) => signalCaseAsync({
      caseId: Number(req.params.id), ...req.body, raiseException: raiseExceptionAsync,
    })));
    r.post('/workflow-cases/:id/cancel', gate(WF_EDIT), send((req) => cancelCaseAsync({ caseId: Number(req.params.id), reason: req.body.reason, actor: actor(req) })));
    r.post('/workflow-cases/:id/retry', gate(WF_EDIT), send((req) => retryFailedStepAsync({ caseId: Number(req.params.id), actor: actor(req), raiseException: raiseExceptionAsync })));
    r.post('/engine/run', send(() => runEngineAsync()));

    /* -- PRD-ADM-006 approvals ---------------------------------------------------------- */
    const APPROVE = 'Administration.Core.Approvals.Act';
    const CONFIGURE_APPROVALS = 'Administration.Core.Approvals.Configure';
    r.get('/approvals/queue', gate(APPROVE), send((req) => queueForAsync(req.customer)));
    r.get('/approvals/items', gate(CONFIGURE_APPROVALS), send(() => itemsAsync()));
    r.get('/approvals/chains', gate(CONFIGURE_APPROVALS), send(() => chainsAsync()));
    r.get('/approvals/reason-codes', send((req) => reasonCodesAsync(req.query.context)));
    r.get('/approvals/queues', gate(CONFIGURE_APPROVALS), send(() => moderationQueuesAsync()));
    r.get('/approvals/callbacks', gate(CONFIGURE_APPROVALS), send(() => approvalCallbacks()));
    r.get('/approvals/items/:id', gate(APPROVE), async (req, res, next) => {
      try {
        const result = await openItemAsync(Number(req.params.id), req.customer);
        res.status(result.ok ? 200 : 403).json(result);
      } catch (err) { next(err); }
    });
    r.post('/approvals/submit', send((req) => submitAsync(req.body)));
    r.post('/approvals/items/:id/decide', gate(APPROVE), send((req) => decideAsync({
      itemId: Number(req.params.id), ...req.body, customer: req.customer, gateways: messageGateways,
    })));
    r.post('/approvals/items/:id/resubmit', send(async (req) => resubmitAsync({ itemId: Number(req.params.id), customer: await me(req) })));
    r.post('/approvals/items/:id/appeal', send(async (req) => appealAsync({ itemId: Number(req.params.id), customer: await me(req) })));
    r.post('/approvals/items/:id/withdraw', send(async (req) => withdrawAsync({ itemId: Number(req.params.id), customer: await me(req) })));
    r.post('/approvals/conditions/:id/done', send(async (req) => markConditionDoneAsync({ conditionId: Number(req.params.id), customer: await me(req) })));

    /* -- PRD-ADM-007 operations console -------------------------------------------------- */
    const QUEUES_VIEW = 'Administration.Core.WorkQueues.View';
    r.get('/operations/console', send(async (req) => consoleForAsync(await me(req))));
    r.get('/operations/orders', gate(QUEUES_VIEW), send((req) => operationalOrderViewAsync({ branch: req.query.branch, outlet: req.query.outlet })));
    r.get('/operations/dashboard', gate(QUEUES_VIEW), send((req) => dashboardAsync(req.customer)));
    r.post('/operations/dashboard', gate(QUEUES_VIEW), send((req) => saveDashboardAsync({ customer: req.customer, tiles: req.body.tiles ?? [] })));
    r.get('/operations/views', gate(QUEUES_VIEW), send((req) => savedViewsAsync(req.customer, req.query.screen)));
    r.post('/operations/views', gate(QUEUES_VIEW), send((req) => saveViewAsync({ customer: req.customer, ...req.body })));
    r.get('/operations/drafts/:formKey', gate(QUEUES_VIEW), send((req) => draftAsync({ customer: req.customer, formKey: req.params.formKey })));
    r.post('/operations/drafts', gate(QUEUES_VIEW), send((req) => saveDraftAsync({ customer: req.customer, ...req.body })));
    r.delete('/operations/drafts/:formKey', gate(QUEUES_VIEW), send((req) => discardDraftAsync({ customer: req.customer, formKey: req.params.formKey })));
    r.post('/operations/shortcuts', send(async (req) => runShortcutAsync({ ...req.body, customer: await me(req) })));
    r.get('/operations/online', send(() => onlineCustomersAsync()));
    r.get('/operations/work-items', gate(QUEUES_VIEW), send(() => workItemMetricsAsync()));
    r.get('/operations/reference', send(() => ({ queues: QUEUES, tiles: TILES, shortcuts: SHORTCUTS })));

    /* -- PRD-ADM-008 upload policy ------------------------------------------------------ */
    r.get('/uploads/contexts', send(() => uploadContextsAsync()));
    r.get('/uploads/scans', send(() => uploadScansAsync()));
    r.patch('/uploads/contexts/:code', gate('Configuration.ManageSettings'), send((req) => setUploadPolicyAsync({ code: req.params.code, ...req.body, customer: req.customer })));
    r.post('/uploads/check', send((req) => checkUploadAsync({
      action: req.body.action,
      contextCode: req.body.contextCode,
      routeValues: req.body.routeValues ?? {},
      fileName: req.body.fileName,
      contentType: req.body.contentType,
      bytes: Buffer.from(req.body.contentBase64 ?? '', 'base64'),
      nativeLimit: req.body.nativeLimit ?? null,
      antivirus: ctx.mocks['Antivirus.Engine'],
      actor: actor(req),
    })));
    r.post('/uploads/scans/:id/complete', send((req) => completeQuarantineScanAsync({ scanId: Number(req.params.id), result: req.body.result })));

    /* -- PRD-ADM-009 exceptions and PRD-ADM-010 alerts ---------------------------------- */
    const EXCEPTIONS = 'Administration.Core.Exceptions.CreateEditDelete';
    const ALERTS = 'Administration.Core.Alerts.CreateEditDelete';
    r.get('/exceptions', gate(EXCEPTIONS), send((req) => queueAsync({ type: req.query.type, reasonCode: req.query.reasonCode, module: req.query.module })));
    r.get('/exceptions/types', send(() => exceptionTypes()));
    r.post('/exceptions', send((req) => raiseExceptionAsync(req.body)));
    r.post('/exceptions/detect-patterns', gate(EXCEPTIONS), send((req) => detectPatternsAsync(req.body ?? {})));
    r.post('/exceptions/bulk', gate(EXCEPTIONS), send((req) => bulkActionAsync({ ...req.body, customer: req.customer })));
    r.post('/exceptions/:id/take', gate(EXCEPTIONS), send((req) => takeAsync({ id: Number(req.params.id), customer: req.customer })));
    r.post('/exceptions/:id/resolve', gate(EXCEPTIONS), send((req) => resolveAsync({ id: Number(req.params.id), ...req.body, customer: req.customer })));
    r.post('/exceptions/:id/retry', gate(EXCEPTIONS), send((req) => retryAsync({ id: Number(req.params.id), customer: req.customer })));
    r.post('/exceptions/:id/escalate', gate(EXCEPTIONS), send((req) => escalateAsync({ id: Number(req.params.id), ...req.body, customer: req.customer })));
    r.get('/alerts', gate(ALERTS), send(async () => ({ rules: await alertRulesAsync(), alerts: await alertsAsync() })));
    r.post('/alerts/rules', gate(ALERTS), send((req) => saveAlertRuleAsync({ ...req.body, customer: req.customer })));
    r.post('/alerts/run', gate(ALERTS), send((req) => runAlertTaskAsync({ measures: req.body.measures ?? {}, gateways: messageGateways })));
    r.post('/alerts/:id/acknowledge', gate(ALERTS), send((req) => acknowledgeAlertAsync({ id: Number(req.params.id), customer: req.customer })));

    /* -- PRD-ADM-011 and PRD-ADM-012 templates ------------------------------------------ */
    const TPL_VIEW = 'Administration.Core.Templates.View';
    const TPL_EDIT = 'Administration.Core.Templates.CreateEditDelete';
    r.get('/templates', gate(TPL_VIEW), send(() => templatesAsync()));
    r.get('/templates/library', gate(TPL_VIEW), send(() => libraryAsync()));
    r.get('/templates/analytics', gate(TPL_VIEW), send((req) => analyticsAsync({
      periodDays: Number(req.query.periodDays ?? 90), staleAfterDays: Number(req.query.staleAfterDays ?? 60),
    })));
    r.get('/templates/shared', gate(TPL_VIEW), send(() => sharedLibraryAsync()));
    r.get('/templates/workspace', gate(TPL_VIEW), send(() => WORKSPACE_AREAS));
    r.get('/templates/:id/inheritance', gate(TPL_VIEW), send((req) => inheritanceAsync(Number(req.params.id))));
    r.post('/templates/:id/save', gate(TPL_EDIT), send((req) => saveTemplateAsync({ id: Number(req.params.id), ...req.body, author: actor(req) })));
    r.post('/templates/:id/clone', gate(TPL_EDIT), send((req) => cloneTemplateAsync({ templateId: Number(req.params.id), ...req.body, author: actor(req) })));
    r.post('/templates/:id/restore/:no', gate(TPL_EDIT), send((req) => restoreVersionAsync({ templateId: Number(req.params.id), no: Number(req.params.no), author: actor(req) })));
    r.post('/templates/:id/usage', send((req) => recordUsageAsync({ templateId: Number(req.params.id), ...req.body })));
    r.post('/templates/:id/publish-shared', gate(TPL_EDIT), send((req) => publishToSharedLibraryAsync({ templateId: Number(req.params.id), author: actor(req) })));
    r.post('/templates/shared/:id/adopt', gate(TPL_EDIT), send((req) => adoptFromSharedLibraryAsync({ packageId: Number(req.params.id), author: actor(req) })));

    ctx.addRouter('/api/admin-console', r);
  },
});
