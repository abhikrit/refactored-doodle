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
import {
  bannerAsync, saveChoiceAsync, choiceAsync, categoriesAsync, widgetMapAsync,
  loadActiveWidgetsAsync, isWidgetActiveAsync, analyticsEventAsync, personalisationAllowedAsync,
  setEnableEcommerceAsync, validatePackAnalyticsAsync, logConsentAsync, gdprToolsAsync,
  gdprSettingsCheckAsync,
} from './services/consent.js';
import {
  profileAsync, saveProfileAsync, responseDeadlineAsync, recordActivityAsync, activitiesAsync,
  exportActivitiesAsync, recordTransferAsync, transfersAsync, recordAssessmentAsync,
  assessmentRemindersAsync, goLiveChecklistAsync, instanceCountryAsync,
} from './services/privacy-profile.js';
import {
  classificationAsync, fieldClassAsync, setFieldClassAsync, maskAsync, maskRowsAsync,
  revealAsync, exportRowsAsync, maskForLogAsync, crmFieldRulesAsync, CLASSES, MASKING_RULES,
} from './services/classification.js';
import {
  httpsCheckAsync, proxyConfigurationAsync, tlsCheckAsync, saveAdapterEndpointAsync,
  adapterEndpointsAsync, encryptionAtRestAsync, recordEncryptionAtRestAsync,
  securitySettingsAsync, passwordStorageAsync, cardDataScanAsync, reviewCardAdapterAsync,
  recordCardPaymentAsync, CARD_STORAGE_WITHDRAWN, REMOVED_CARD_FIELDS,
} from './services/hardening.js';
import {
  settingsAsync as captchaSettingsAsync, validateAsync as validateCaptchaAsync, lookupAsync,
  providerTransferCheckAsync, configureAsync as configureCaptchaAsync, resetLookups,
} from './services/captcha.js';

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

    /* --------------------------------------- PRD-SEC-007 consent and privacy tools ------ */
    const visitor = (req) => req.query.visitorId ?? req.body?.visitorId ?? req.sessionId;
    r.get('/cookies/banner', send((req) => bannerAsync({ visitorId: visitor(req), storeId: req.storeId })));
    r.get('/cookies/categories', send((req) => categoriesAsync(req.storeId)));
    r.get('/cookies', send((req) => choiceAsync({
      visitorId: visitor(req), customerId: req.actor?.id ?? null, storeId: req.storeId,
    })));
    r.post('/cookies', send((req) => saveChoiceAsync({
      visitorId: visitor(req),
      customerId: req.actor?.id ?? null,
      accepted: req.body?.accepted ?? [],
      option: req.body?.option ?? 'choose-per-category',
      storeId: req.storeId,
      ipAddress: req.ip,
    })));
    r.get('/widgets/active', send((req) => loadActiveWidgetsAsync({
      visitorId: visitor(req), customerId: req.actor?.id ?? null, storeId: req.storeId,
    })));
    r.get('/widgets/map', send((req) => widgetMapAsync(req.storeId)));
    r.get('/widgets/:systemName/active', send((req) => isWidgetActiveAsync({
      systemName: req.params.systemName, visitorId: visitor(req), customerId: req.actor?.id ?? null, storeId: req.storeId,
    })));
    r.post('/analytics/event', send((req) => analyticsEventAsync({
      event: req.body?.event, visitorId: visitor(req), customerId: req.actor?.id ?? null, storeId: req.storeId,
    })));
    r.get('/personalisation', send((req) => personalisationAllowedAsync({
      visitorId: visitor(req), customerId: req.actor?.id ?? null, storeId: req.storeId,
    })));
    r.post('/analytics/enable-ecommerce', send((req) => setEnableEcommerceAsync({
      value: req.body?.value === true, storeId: req.storeId, actor: req.actorEmail,
    })));
    r.post('/analytics/validate-pack', send((req) => validatePackAnalyticsAsync({
      settings: req.body?.settings ?? {}, storeId: req.storeId,
    })));
    r.post('/gdpr/consent-log', send((req) => logConsentAsync({ ...req.body, storeId: req.storeId })));
    r.get('/gdpr/tools', send((req) => gdprToolsAsync({ storeId: req.storeId })));
    r.get('/gdpr/settings-check', send((req) => gdprSettingsCheckAsync({ storeId: req.storeId })));

    /* ------------------------------------- PRD-SEC-012 the country data-protection pack -- */
    r.get('/privacy-profile', gate('Security.Core.PrivacyProfile.View'), send((req) => profileAsync({
      storeId: req.storeId, country: req.query.country ?? null,
    })));
    r.post('/privacy-profile', send(async (req) => saveProfileAsync({
      country: req.body?.country ?? null, values: req.body?.values ?? {}, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/privacy-profile/country', send((req) => instanceCountryAsync(req.storeId).then((c) => ({ country: c }))));
    r.get('/privacy-profile/deadline', send((req) => responseDeadlineAsync({
      storeId: req.storeId, receivedOnUtc: req.query.receivedOnUtc ?? new Date().toISOString(),
    })));
    r.get('/processing-activities', gate('Security.Core.PrivacyProfile.View'), send((req) => activitiesAsync({ current: req.query.all !== 'true' })));
    r.post('/processing-activities', send(async (req) => recordActivityAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/processing-activities/export', gate('Security.Core.PrivacyProfile.View'), send((req) => exportActivitiesAsync({ format: req.query.format ?? 'csv' })));
    r.get('/transfers', gate('Security.Core.PrivacyProfile.View'), send(() => transfersAsync()));
    r.post('/transfers', send(async (req) => recordTransferAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/impact-assessments', send(async (req) => recordAssessmentAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/impact-assessments/reminders', send((req) => assessmentRemindersAsync({ storeId: req.storeId })));
    r.get('/go-live-checklist', send((req) => goLiveChecklistAsync({ storeId: req.storeId })));

    /* --------------------------------- PRD-SEC-014 data classification and masking ------- */
    r.get('/classification', send((req) => classificationAsync(req.storeId).then((rows) => ({
      classification: rows, classes: CLASSES, maskingRules: MASKING_RULES, heldBy: 'DP-01', prototypeDefaultLabel: 'Prototype default - decision DP-01 pending',
    }))));
    r.get('/classification/field', send((req) => fieldClassAsync({
      entity: req.query.entity, field: req.query.field, storeId: req.storeId,
    })));
    r.post('/classification', send(async (req) => setFieldClassAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/classification/mask', send(async (req) => maskAsync({
      ...req.body, user: req.actor, storeId: req.storeId,
    })));
    r.post('/classification/mask-rows', send(async (req) => maskRowsAsync({
      entity: req.body?.entity, rows: req.body?.rows ?? [], user: req.actor, storeId: req.storeId,
    })));
    r.post('/classification/reveal', send(async (req) => revealAsync({
      ...req.body, user: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/classification/export', send(async (req) => exportRowsAsync({
      entity: req.body?.entity, rows: req.body?.rows ?? [], purpose: req.body?.purpose ?? 'staff', user: req.actor, storeId: req.storeId,
    })));
    r.post('/classification/mask-for-log', send((req) => maskForLogAsync({
      entity: req.body?.entity, values: req.body?.values ?? {}, storeId: req.storeId,
    })));
    r.get('/classification/crm-rules', send((req) => crmFieldRulesAsync({
      entity: req.query.entity ?? 'Customer', storeId: req.storeId,
    })));

    /* ------------------- PRD-SEC-001 transport and encryption, PRD-SEC-003 PCI scope ---- */
    r.get('/transport/https', send((req) => httpsCheckAsync({
      scheme: req.query.scheme ?? 'https', path: req.query.path ?? '/', storeId: req.storeId,
    })));
    r.get('/transport/proxy', send((req) => proxyConfigurationAsync({ storeId: req.storeId })));
    r.get('/transport/tls', send((req) => tlsCheckAsync({
      version: req.query.version ?? 'TLS 1.2', cipherSuite: req.query.cipherSuite ?? null, storeId: req.storeId,
    })));
    r.get('/transport/adapters', send((req) => adapterEndpointsAsync({ storeId: req.storeId })));
    r.post('/transport/adapters', send((req) => saveAdapterEndpointAsync({
      ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/encryption/at-rest', send((req) => encryptionAtRestAsync({ storeId: req.storeId })));
    r.post('/encryption/at-rest', gate('Configuration.ManageSettings'), send((req) => recordEncryptionAtRestAsync({
      ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/encryption/settings', send((req) => securitySettingsAsync({ storeId: req.storeId })));
    r.get('/encryption/passwords', send((req) => passwordStorageAsync({ storeId: req.storeId })));
    r.get('/pci/card-scan', gate('Security.Core.AuditTrail.View'), send(() => cardDataScanAsync()));
    r.get('/pci/withdrawn', send(() => ({ ...CARD_STORAGE_WITHDRAWN, removedFields: REMOVED_CARD_FIELDS })));
    r.post('/pci/review-adapter', send((req) => reviewCardAdapterAsync({ ...req.body, storeId: req.storeId })));
    r.post('/pci/card-payment', send((req) => recordCardPaymentAsync({ ...req.body, storeId: req.storeId })));

    /* --------------------------------------------------- PRD-SEC-013 bot protection ----- */
    r.get('/captcha', send((req) => captchaSettingsAsync(req.storeId)));
    r.post('/captcha', gate('Configuration.ManageSettings'), send((req) => configureCaptchaAsync({
      values: req.body?.values ?? {}, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/captcha/validate', send((req) => validateCaptchaAsync({ ...req.body, storeId: req.storeId })));
    r.post('/captcha/lookup', send((req) => lookupAsync({
      session: req.body?.session ?? req.sessionId, response: req.body?.response ?? null, score: req.body?.score ?? null, storeId: req.storeId,
    })));
    r.post('/captcha/lookup/reset', send((req) => {
      resetLookups(req.body?.session ?? null);
      return { reset: true };
    }));
    r.get('/captcha/provider-transfer', send((req) => providerTransferCheckAsync({ storeId: req.storeId })));

    ctx.addRouter('/api/security', r);
    ctx.declare({
      built: true,
      owns: ['PRD-SEC-001', 'PRD-SEC-003', 'PRD-SEC-004', 'PRD-SEC-007', 'PRD-SEC-012', 'PRD-SEC-013', 'PRD-SEC-014'],
      builtFeatures: ['PRD-SEC-001', 'PRD-SEC-003', 'PRD-SEC-004', 'PRD-SEC-007', 'PRD-SEC-012', 'PRD-SEC-013', 'PRD-SEC-014'],
      note: 'the audit trail, the consent and cookie tools, the country data-protection pack and data classification',
    });
  },
});
