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
import { registerEventCodesAsync, secEventCodesAsync } from './services/notices.js';
import {
  edgeAsync, recordEdgeAsync, wafAsync, clientIpAsync, adminIpCheckAsync, honeypotAsync,
  recordUploadAsync, ownershipsAsync, downloadProviders, evaluateDownloadAccessAsync,
  uploadTypeCheckAsync, UPLOAD_ACTIONS,
} from './services/edge.js';
import {
  openCaseAsync, casesAsync, caseAsync, freezeAffectedListAsync, notifySubjectsAsync,
  recordRegulatorNoticeAsync, deadlineTaskAsync, assessAsync, confirmAssessmentAsync,
  closeCaseAsync,
} from './services/breach.js';
import {
  exportConfigAsync, runExportTaskAsync, exportBatchesAsync, backlogCheckAsync,
  detectionSplitAsync, evidenceExportAsync, integrityStatementAsync, incidentEvidenceAsync,
  linkIncidentAsync, residencyAsync, recordResidencyAsync, residencyChecklistAsync,
  recordDependencyScanAsync, dependencyScansAsync, recordFindingAsync, findingsAsync,
  decideFindingAsync, penTestScopeAsync, PLATFORM_FINDINGS,
} from './services/monitoring.js';
import {
  grantAsync, grantsAsync, revokeAsync, checkAccessAsync, auditorTrailAsync,
} from './services/auditor-access.js';

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
    // BR-SEC-100: SEC registers its event codes with TRK-005 at installation and sends nothing
    // itself; every SEC notice goes out through IC-TRK-04 SendEvent.
    registerEventCodesAsync();

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

    /* ------------------------------------------------- PRD-SEC-002 edge protection ------ */
    r.get('/edge', send((req) => edgeAsync({ storeId: req.storeId })));
    r.post('/edge', gate('Configuration.ManageSettings'), send((req) => recordEdgeAsync({
      values: req.body?.values ?? {}, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/edge/waf', send((req) => wafAsync({ ...req.body, storeId: req.storeId })));
    r.get('/edge/client-ip', send((req) => clientIpAsync({
      forwardedFor: req.query.forwardedFor ?? null, remoteAddress: req.query.remoteAddress ?? req.ip, storeId: req.storeId,
    })));
    r.get('/edge/admin-ip', send((req) => adminIpCheckAsync({
      ipAddress: req.query.ipAddress ?? req.ip, storeId: req.storeId,
    })));
    r.post('/edge/honeypot', send((req) => honeypotAsync({ fields: req.body?.fields ?? {}, storeId: req.storeId })));
    r.get('/uploads/actions', send(() => ({ actions: UPLOAD_ACTIONS })));
    r.get('/uploads/ownership', send(() => ownershipsAsync()));
    r.post('/uploads/ownership', send(async (req) => recordUploadAsync({
      ...req.body, customerId: req.body?.customerId ?? req.actor?.id ?? null, storeId: req.storeId,
    })));
    r.get('/uploads/providers', send(() => downloadProviders()));
    r.post('/downloads/access', send(async (req) => evaluateDownloadAccessAsync({
      downloadGuid: req.body?.downloadGuid,
      requester: req.body?.asGuest === true ? null : req.actor,
      area: req.body?.area ?? 'storefront',
      storeId: req.storeId,
    })));
    r.post('/uploads/type-check', send((req) => uploadTypeCheckAsync({
      ...req.body, bytes: Buffer.from(req.body?.content ?? '', 'utf8'), actor: req.actorEmail ?? 'customer',
    })));

    /* ----------------------------------------- PRD-SEC-008 the breach workflow ---------- */
    r.get('/breaches', gate('Security.Core.Breaches.View'), send((req) => casesAsync(req.query)));
    r.get('/breaches/:id', gate('Security.Core.Breaches.View'), send((req) => caseAsync(Number(req.params.id))));
    r.post('/breaches', send(async (req) => openCaseAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/:id/affected', send(async (req) => freezeAffectedListAsync({
      caseId: Number(req.params.id), criteria: req.body?.criteria ?? {}, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/:id/assess', send(async (req) => assessAsync({
      caseId: Number(req.params.id), ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/:id/confirm', send(async (req) => confirmAssessmentAsync({
      caseId: Number(req.params.id), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/:id/notify-subjects', send(async (req) => notifySubjectsAsync({
      caseId: Number(req.params.id), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/:id/regulator-notice', send(async (req) => recordRegulatorNoticeAsync({
      caseId: Number(req.params.id), ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/:id/close', send(async (req) => closeCaseAsync({
      caseId: Number(req.params.id), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/breaches/deadline-task', send((req) => deadlineTaskAsync({ storeId: req.storeId })));

    /* ------------------- PRD-SEC-005, PRD-SEC-009, PRD-SEC-015 and PRD-SEC-006 --------- */
    r.get('/monitoring/configuration', send((req) => exportConfigAsync(req.storeId)));
    r.get('/monitoring/batches', send(() => exportBatchesAsync()));
    r.post('/monitoring/export-task', send((req) => runExportTaskAsync({
      actor: req.actorEmail, adapterFails: req.body?.adapterFails === true, storeId: req.storeId,
    })));
    r.post('/monitoring/backlog-check', send((req) => backlogCheckAsync({ storeId: req.storeId })));
    r.get('/monitoring/detection', send((req) => detectionSplitAsync({ storeId: req.storeId })));
    r.post('/evidence/export', send(async (req) => evidenceExportAsync({
      from: req.body?.from, to: req.body?.to ?? new Date().toISOString(), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/evidence/integrity-statement', send(async (req) => integrityStatementAsync({
      from: req.body?.from, to: req.body?.to ?? new Date().toISOString(), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/incidents/evidence', send(async (req) => incidentEvidenceAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/incidents/link', send(async (req) => linkIncidentAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/residency', send((req) => residencyAsync({ storeId: req.storeId })));
    r.post('/residency', gate('Configuration.ManageSettings'), send((req) => recordResidencyAsync({
      ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/residency/checklist', send((req) => residencyChecklistAsync({ storeId: req.storeId })));

    /* ------------------------------------------ PRD-SEC-010 auditor read-only access ---- */
    r.get('/auditor-grants', send(() => grantsAsync()));
    r.post('/auditor-grants', send(async (req) => grantAsync({
      ...req.body, actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/auditor-grants/:id/revoke', send(async (req) => revokeAsync({
      grantId: Number(req.params.id), actor: req.actor, by: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/auditor-grants/check', send(async (req) => checkAccessAsync({
      customer: req.actor, permission: req.query.permission ?? 'Security.Core.AuditTrail.View', storeId: req.storeId,
    })));
    r.get('/auditor-trail', send(async (req) => auditorTrailAsync({
      customer: req.actor,
      from: req.query.from ?? null,
      to: req.query.to ?? null,
      exported: req.query.exported === 'true',
      storeId: req.storeId,
    })));

    /* ------------------------------------------ PRD-SEC-011 vulnerability management ---- */
    r.get('/vulnerabilities/scans', send(() => dependencyScansAsync()));
    r.post('/vulnerabilities/scans', send((req) => recordDependencyScanAsync({
      ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/vulnerabilities/findings', send((req) => findingsAsync(req.query)));
    r.post('/vulnerabilities/findings', send((req) => recordFindingAsync({
      ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.post('/vulnerabilities/findings/:id/decide', send((req) => decideFindingAsync({
      findingId: Number(req.params.id), ...req.body, actor: req.actorEmail, storeId: req.storeId,
    })));
    r.get('/vulnerabilities/pen-test-scope', send((req) => penTestScopeAsync({
      release: req.query.release ?? null, storeId: req.storeId,
    })));
    r.get('/vulnerabilities/platform-findings', send(() => PLATFORM_FINDINGS));
    r.get('/event-codes', send(() => secEventCodesAsync()));

    ctx.addRouter('/api/security', r);
    ctx.declare({
      built: true,
      owns: [
        'PRD-SEC-001', 'PRD-SEC-002', 'PRD-SEC-003', 'PRD-SEC-004', 'PRD-SEC-005', 'PRD-SEC-006',
        'PRD-SEC-007', 'PRD-SEC-008', 'PRD-SEC-009', 'PRD-SEC-010', 'PRD-SEC-011', 'PRD-SEC-012',
        'PRD-SEC-013', 'PRD-SEC-014', 'PRD-SEC-015',
      ],
      builtFeatures: [
        'PRD-SEC-001', 'PRD-SEC-002', 'PRD-SEC-003', 'PRD-SEC-004', 'PRD-SEC-005', 'PRD-SEC-006',
        'PRD-SEC-007', 'PRD-SEC-008', 'PRD-SEC-009', 'PRD-SEC-010', 'PRD-SEC-011', 'PRD-SEC-012',
        'PRD-SEC-013', 'PRD-SEC-014', 'PRD-SEC-015',
      ],
      note: 'the whole security, audit and compliance area',
    });
  },
});
