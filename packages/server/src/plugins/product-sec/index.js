// Product.SEC - Security, audit and compliance
// Spec: docs/prd/modules/PRD-SEC.md (wave 1 Foundation)
//
// PRD-SEC-004 owns the platform audit trail: every write in the product goes through it
// (CLAUDE.md "audit through SEC-004"), and the SEC plugin registers the IRepository<> decorator
// that writes an event for every audited entity change.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { trailAsync, auditEventCatalogue } from './services/audit-read.js';
import {
  registerDecoratorAsync, searchAsync, exportTrailAsync, verifyChainAsync, chainStateAsync,
  writeRightsAsync, replayAccessAsync, complianceReportAsync, saveAclAsync,
  saveStoreMappingsAsync, failAuditWrites,
} from './services/audit-trail.js';
import { queryAsync, replayEntityAsync, auditAsync } from '../../core/audit.js';

export default definePlugin({
  area: 'SEC',
  // INopStartup order greater than 10, after NopDbStartup registers EntityRepository<> at 10
  startupOrder: 11,
  async install(ctx) {
    ctx.providers.claimOverride('IRepository<>', {
      owner: 'Product.SEC',
      feature: 'PRD-SEC-004',
      startupOrder: 11,
      note: 'The SEC-004 repository decorator writes the audit trail. In 5.00.1 it implements only the async members (the sync IRepository members were removed).',
    });
    const registration = registerDecoratorAsync();

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

    const r = Router();

    /* ------------------------------------------------- PRD-SEC-004 the audit trail ------- */
    // the list every module's screens and tests read: the events, newest first
    r.get('/audit', gate('Security.Core.AuditTrail.View'), send(async (req) => (await searchAsync({
      area: req.query.area,
      event: req.query.event,
      entity: req.query.entity,
      entityId: req.query.entityId,
      actor: req.query.actor,
      storeId: req.query.storeId,
      correlationId: req.query.correlationId,
      amount: req.query.amount,
      from: req.query.from,
      to: req.query.to,
    })).events));
    // the trail screen of AC-SEC-004-03-01, with the search fields it offers
    r.get('/audit/search', gate('Security.Core.AuditTrail.View'), send((req) => searchAsync({
      area: req.query.area,
      event: req.query.event,
      entity: req.query.entity,
      entityId: req.query.entityId,
      actor: req.query.actor,
      storeId: req.query.storeId,
      correlationId: req.query.correlationId,
      amount: req.query.amount,
      from: req.query.from,
      to: req.query.to,
    })));
    r.get('/audit/legacy', send((req) => trailAsync({
      area: req.query.area, event: req.query.event, entity: req.query.entity, entityId: req.query.entityId, actor: req.query.actor,
    })));
    r.get('/audit/catalogue', (req, res) => res.json(auditEventCatalogue()));
    r.get('/audit/chain', gate('Security.Core.AuditTrail.View'), send(() => chainStateAsync()));
    r.get('/audit/write-rights', send(() => writeRightsAsync()));
    r.get('/audit/decorator', send(() => ({ ...registration, auditedEntities: undefined })));
    r.post('/audit/verify', gate('Security.Core.AuditTrail.View'), send((req) => verifyChainAsync({
      fromSequence: req.body?.fromSequence ?? 1,
      toSequence: req.body?.toSequence ?? null,
      storeId: req.storeId,
    })));
    r.post('/audit/export', send(async (req) => exportTrailAsync({
      filter: req.body?.filter ?? {}, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/audit/query', gate('Security.Core.AuditTrail.View'), send((req) => queryAsync({
      afterSequence: req.query.afterSequence ?? null,
      entity: req.query.entity,
      event: req.query.event,
      pageSize: req.query.pageSize ?? 100,
    })));
    r.get('/audit/replay/entity', gate('Security.Core.AuditTrail.View'), send((req) => replayEntityAsync({
      entity: req.query.entity, entityId: req.query.entityId, at: req.query.at ?? new Date().toISOString(),
    })));
    r.get('/audit/replay/access', gate('Security.Core.AuditTrail.View'), send((req) => replayAccessAsync({
      customerId: Number(req.query.customerId), at: req.query.at ?? new Date().toISOString(),
    })));
    r.get('/audit/compliance-report', gate('Security.Core.AuditTrail.View'), send((req) => complianceReportAsync({
      from: req.query.from, to: req.query.to ?? new Date().toISOString(), storeId: req.storeId,
    })));
    r.post('/audit/write', send((req) => auditAsync({ ...req.body, storeId: req.body?.storeId ?? req.storeId })));
    r.post('/acl', gate('Configuration.ManageACL'), send((req) => saveAclAsync({ ...req.body, actor: req.actorEmail })));
    r.post('/store-mappings', gate('Configuration.ManageACL'), send((req) => saveStoreMappingsAsync({ ...req.body, actor: req.actorEmail })));
    // the test seam of AC-SEC-004-01-06
    r.post('/audit/fail-writes', send((req) => {
      failAuditWrites(req.body?.value === true);
      return { failing: req.body?.value === true };
    }));

    ctx.addRouter('/api/security', r);
    ctx.declare({
      built: true,
      owns: ['PRD-SEC-004'],
      builtFeatures: ['PRD-SEC-004'],
      note: 'the platform audit trail, its chain, export, replay and compliance report',
    });
  },
});
