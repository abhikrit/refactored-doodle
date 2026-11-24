// Product.ADM - Administration, workflow and operations console
// Spec: docs/prd/modules/PRD-ADM.md (wave 1 Foundation)
// 12 features, 123 acceptance criteria, 2 held by an open decision (WF-ENG).
//
// Built in this session: PRD-ADM-001 Administration console, all 12 acceptance criteria.
// ADM owns the product extension register (BR-ADM-001 to BR-ADM-008) and its start-up check,
// which runs after every other product plugin so that two plugins never silently replace the
// same core service.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  extensionRegister, refusedAttempts, startupCheck, registerActionFilter, registerRuleProvider,
  runActionFilters,
} from '../../core/providers.js';
import {
  CONSOLE_AREAS, consoleAreasForAsync, checkAreaAsync, scheduleTasksAsync, updateScheduleTaskAsync,
  runScheduleTaskAsync, logAsync, clearLogAsync, widgetsAsync, setWidgetActiveAsync,
  bulkEditSaveAsync, bulkArchiveAsync, bulkDeleteAsync, setCustomerActiveAsync, gdprDeleteAsync,
} from './services/console.js';
import { currentCustomerAsync } from '../product-iam/services/identity.js';

// nopCommerce plugins bundled with 5.00.1 that replace a service the product owns.
// Misc.Brevo replaces IWorkflowMessageService at NopStartup Order 3000 (AC-ADM-001-04-05).
const BUNDLED_PLUGINS_THAT_REPLACE = [
  { systemName: 'Misc.Brevo', replaces: ['IWorkflowMessageService'], installed: false },
];

export default definePlugin({
  area: 'ADM',
  // BR-ADM-001: the ADM start-up runs after every other product plugin, so the register is
  // complete before the check reads it.
  startupOrder: 9000,
  async install(ctx) {
    // ---- the register's own entries (BR-ADM-002 to BR-ADM-008) --------------------------
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
      owner: 'Product.IAM', feature: 'PRD-IAM-026', order: 100, singleOwner: true, rule: 'BR-ADM-006', note: 'the single impersonation filter (BR-IAM-130)',
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
      owner: 'Product.CHK', feature: 'PRD-CHK-009', order: 100, singleOwner: true, rule: 'BR-ADM-007', note: 'acknowledgements and the terms checkbox are enforced on the server (BR-CHK-013)',
    });
    registerActionFilter('Admin SettingController.SettingUpdate', {
      owner: 'Product.PLT', feature: 'PRD-PLT-004', order: 100, singleOwner: true, rule: 'BR-ADM-006', note: 'settings change control',
    });

    // ---- the start-up check (AC-ADM-001-04-01) ------------------------------------------
    const check = startupCheck({
      installedPlugins: BUNDLED_PLUGINS_THAT_REPLACE.filter((p) => p.installed),
    });
    for (const w of check.warnings) {
      await ctx.events.publishAsync('SystemWarningCreatedEvent', w);
    }
    ctx.declare({
      built: true,
      owns: ['PRD-ADM-001'],
      note: 'PRD-ADM-001 Administration console: all 12 acceptance criteria. ADM owns the product extension register and its start-up check.',
      startupCheck: { ok: check.ok, warnings: check.warnings.length },
    });

    // ---- routes --------------------------------------------------------------------------
    const r = Router();
    const me = (req) => currentCustomerAsync(req.sessionId);

    // US-ADM-001-01 the console itself
    r.get('/console', async (req, res, next) => {
      try { res.json(await consoleAreasForAsync(await me(req))); } catch (err) { next(err); }
    });
    r.get('/console/areas/:id', async (req, res, next) => {
      try {
        const result = await checkAreaAsync(req.params.id, await me(req));
        res.status(result.ok ? 200 : 403).json(result);
      } catch (err) { next(err); }
    });
    r.get('/schedule-tasks', async (req, res, next) => {
      try { res.json(await scheduleTasksAsync()); } catch (err) { next(err); }
    });
    r.patch('/schedule-tasks/:id', async (req, res, next) => {
      try {
        const gate = await checkAreaAsync('system-schedule-tasks', await me(req));
        if (!gate.ok) return res.status(403).json(gate);
        return res.json(await updateScheduleTaskAsync({ id: Number(req.params.id), ...req.body, actor: req.actorEmail ?? 'admin' }));
      } catch (err) { return next(err); }
    });
    r.post('/schedule-tasks/:id/run', async (req, res, next) => {
      try {
        const gate = await checkAreaAsync('system-schedule-tasks', await me(req));
        if (!gate.ok) return res.status(403).json(gate);
        return res.json(await runScheduleTaskAsync({ id: Number(req.params.id), fail: req.body?.fail === true, actor: req.actorEmail ?? 'admin' }));
      } catch (err) { return next(err); }
    });
    r.get('/log', async (req, res, next) => {
      try { res.json(await logAsync({ level: req.query.level })); } catch (err) { next(err); }
    });
    r.post('/maintenance/clear-log', async (req, res, next) => {
      try {
        const gate = await checkAreaAsync('system-maintenance', await me(req));
        if (!gate.ok) return res.status(403).json(gate);
        return res.json(await clearLogAsync({ actor: req.actorEmail ?? 'admin' }));
      } catch (err) { return next(err); }
    });
    r.get('/widgets', async (req, res, next) => {
      try { res.json(await widgetsAsync()); } catch (err) { next(err); }
    });
    r.patch('/widgets/:id', async (req, res, next) => {
      try {
        const gate = await checkAreaAsync('configuration-widgets', await me(req));
        if (!gate.ok) return res.status(403).json(gate);
        return res.json(await setWidgetActiveAsync({ id: Number(req.params.id), isActive: req.body.isActive, actor: req.actorEmail ?? 'admin' }));
      } catch (err) { return next(err); }
    });

    // US-ADM-001-02 bulk edit
    r.post('/bulk-edit', async (req, res, next) => {
      try {
        const gate = await checkAreaAsync('catalog-products', await me(req));
        if (!gate.ok) return res.status(403).json(gate);
        return res.json(await bulkEditSaveAsync({ changes: req.body.changes, actor: req.actorEmail ?? 'admin' }));
      } catch (err) { return next(err); }
    });
    r.post('/bulk-archive', async (req, res, next) => {
      try { res.json(await bulkArchiveAsync({ ids: req.body.ids, actor: req.actorEmail ?? 'admin' })); } catch (err) { next(err); }
    });
    r.post('/bulk-delete', async (req, res, next) => {
      try { res.json(await bulkDeleteAsync({ ids: req.body.ids, actor: req.actorEmail ?? 'admin' })); } catch (err) { next(err); }
    });

    // US-ADM-001-03 customer actions
    r.post('/customers/active', async (req, res, next) => {
      try { res.json(await setCustomerActiveAsync({ ...req.body, actor: req.actorEmail ?? 'admin' })); } catch (err) { next(err); }
    });
    r.post('/customers/gdpr-delete', async (req, res, next) => {
      try {
        const customer = await me(req);
        const allowed = await ctx.security.authorizeAsync('Customers.GDPRManage', customer);
        if (!allowed) {
          return res.status(403).json({ ok: false, permission: 'Customers.GDPRManage', message: 'Access denied: Customers.GDPRManage is required to process a deletion request.' });
        }
        return res.json(await gdprDeleteAsync({ ...req.body, actor: req.actorEmail ?? 'admin' }));
      } catch (err) { return next(err); }
    });

    // US-ADM-001-04 the extension register
    r.get('/extension-register', async (req, res, next) => {
      try {
        const customer = await me(req);
        const allowed = await ctx.security.authorizeAsync('Administration.Core.Extensions.View', customer);
        if (!allowed) {
          return res.status(403).json({ ok: false, permission: 'Administration.Core.Extensions.View', message: 'Access denied: Administration.Core.Extensions.View is required for the extension register.' });
        }
        return res.json({
          entries: extensionRegister(),
          refusedAttempts: refusedAttempts(),
          startupCheck: startupCheck({ installedPlugins: BUNDLED_PLUGINS_THAT_REPLACE.filter((p) => p.installed) }),
          bundledPlugins: BUNDLED_PLUGINS_THAT_REPLACE,
          areas: CONSOLE_AREAS,
        });
      } catch (err) { return next(err); }
    });
    r.post('/extension-register/simulate', async (req, res, next) => {
      // AC-ADM-001-04-04 / 04-05: run the filters on an action, or install a bundled plugin that
      // replaces a service the product owns, and see what the register and the check say.
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

    ctx.addRouter('/api/admin-console', r);
  },
});
