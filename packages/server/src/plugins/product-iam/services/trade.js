// PRD-IAM-023 Trade account applications, PRD-IAM-024 Tax exemption and VAT numbers.
//
// SM-IAM-07: the application states. The documents are stored as native Download records, because
// native customer attributes carry no file upload. Every file goes through the ADM-008 policy of
// the context "trade application document", which IAM registers at installation through
// IC-ADM-08 RegisterUploadContext and checks with IC-ADM-08 CheckUpload before anything is
// stored (BR-ADM-060): IAM adds no type or size check of its own.
// BR-IAM-121: the native EU VAT logic exempts addresses in countries not subject to VAT, so
// EuVatUseWebService and EuVatAllowVatExemption stay off and Country.SubjectToVat is reviewed.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { sendAsync, resource } from '../../../core/messages.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { messageGateways } from '@product/mocks';
import {
  registerUploadContextAsync, checkUploadAsync,
} from '../../product-adm/services/uploads.js';
import { createCompanyAsync, addMemberAsync } from './companies.js';

const applicationRepo = () => repository('TradeApplication');
const downloadRepo = () => repository('Download');
const customerRepo = () => repository('Customer');

export const TRADE_UPLOAD_CONTEXT = 'trade application document';
export const REQUIRED_FIELDS = ['companyName', 'registrationNumber', 'taxNumber'];

/** IC-ADM-08 RegisterUploadContext, at installation. */
export async function registerTradeUploadContextAsync(storeId = 1) {
  const allowedExtensions = await getSettingAsync('iam.tradedocumentextensions', storeId, ['pdf', 'jpg', 'jpeg', 'png']);
  const maxSizeKb = Number(await getSettingAsync('iam.tradedocumentmaxsizekb', storeId, 4096));
  return registerUploadContextAsync({
    code: TRADE_UPLOAD_CONTEXT,
    owningFeature: 'PRD-IAM-023',
    coveredActions: ['Nop.Web CustomerController.TradeApplication'],
    ownEndpoint: true,
    allowedExtensions,
    maxSizeKb,
    scanEnabled: true,
    failMode: 'reject',
  });
}

export const requiredDocumentsAsync = (storeId = 1) => getSettingAsync('iam.traderequireddocuments', storeId, [
  'certificate of incorporation', 'tax clearance certificate',
]);

/**
 * AC-IAM-023-01-01 and 01-02: the application with its documents. Each file is checked through
 * IC-ADM-08 CheckUpload before anything is stored, so a refused file stores nothing.
 */
export async function submitTradeApplicationAsync({
  customer, companyName, registrationNumber, taxNumber, documents = [], storeId = 1,
}) {
  const missing = REQUIRED_FIELDS.filter((f) => !({ companyName, registrationNumber, taxNumber })[f]);
  if (missing.length) return { ok: false, missingFields: missing, message: `these are required: ${missing.join(', ')}` };

  const required = await requiredDocumentsAsync(storeId);
  if (documents.length < required.length) {
    return { ok: false, requiredDocuments: required, message: 'attach the required documents' };
  }

  // every file through the ADM-008 policy first (BR-ADM-060)
  const checked = [];
  for (const doc of documents) {
    const bytes = Buffer.from(doc.base64 ?? doc.content ?? '', doc.base64 ? 'base64' : 'utf8');
    const check = await checkUploadAsync({
      contextCode: TRADE_UPLOAD_CONTEXT,
      fileName: doc.fileName,
      contentType: doc.contentType ?? null,
      bytes,
      actor: customer.email ?? String(customer.id),
    });
    if (check.ok !== true) {
      return {
        ok: false,
        fileRefused: doc.fileName,
        refusedBy: 'PRD-ADM-008',
        messageKey: check.messageKey ?? null,
        message: check.message ?? 'the file is outside the upload policy',
        storedAnything: false,
        policy: check.policy ?? null,
      };
    }
    checked.push({ doc, bytes, check });
  }

  // only now is anything stored, as native Download records
  const downloads = [];
  for (const { doc, bytes } of checked) {
    downloads.push(await downloadRepo().insertAsync({
      fileName: doc.fileName,
      contentType: doc.contentType ?? null,
      extension: String(doc.fileName).split('.').pop(),
      sizeKb: Math.max(1, Math.ceil(bytes.length / 1024)),
      downloadGuid: `dl-${Date.now()}-${downloads.length}`,
      isNew: true,
      entity: 'TradeApplication',
      createdOnUtc: new Date().toISOString(),
    }));
  }

  const row = await applicationRepo().insertAsync({
    customerId: customer.id,
    companyName,
    registrationNumber,
    taxNumber,
    status: 'Received',
    downloadIds: downloads.map((d) => d.id),
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-IAM-013', area: 'IAM', feature: 'PRD-IAM-023', entity: 'TradeApplication', entityId: row.id, actor: customer.email ?? String(customer.id), after: { status: 'Received', companyName }, note: 'trade account application received',
  });
  return {
    ok: true,
    application: row,
    documentsStored: downloads.map((d) => ({ id: d.id, fileName: d.fileName })),
    storedAs: 'native Download records',
    messageKey: 'Iam.TradeApplicationReceived',
    message: resource('Iam.TradeApplicationReceived'),
  };
}

export const tradeApplicationsAsync = (filter = {}) => applicationRepo()
  .getAllAsync((a) => (!filter.status || a.status === filter.status)
    && (!filter.customerId || a.customerId === Number(filter.customerId)));

/** AC-IAM-023-02-01 and 02-02: the decision. SM-IAM-07. */
export async function decideTradeApplicationAsync({
  applicationId, decision, reason = null, by, actor, taxExempt = false, storeId = 1,
}) {
  if (!await authorizeAsync('Identity.Core.TradeAccounts.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Identity.Core.TradeAccounts.CreateEditDelete' };
  }
  const row = await applicationRepo().getByIdAsync(applicationId);
  if (!row || !['Received', 'MoreInformation'].includes(row.status)) {
    return { ok: false, message: 'that application is not open' };
  }
  if (['reject', 'more-information'].includes(decision) && !reason) {
    return { ok: false, reasonRequired: true, message: 'Give the applicant a reason.' };
  }
  const customer = await customerRepo().getByIdAsync(row.customerId);

  if (decision !== 'approve') {
    const updated = await applicationRepo().updateAsync({
      ...row,
      status: decision === 'reject' ? 'Rejected' : 'MoreInformation',
      reason,
      decidedBy: by,
      decidedOnUtc: new Date().toISOString(),
    });
    try {
      await sendAsync({
        event: decision === 'reject' ? 'Iam.TradeApplication.Rejected' : 'Iam.TradeApplication.MoreInformation',
        to: customer?.email ?? customer?.phone,
        channels: [customer?.email ? 'email' : 'sms'],
        tokens: { reason },
        storeId,
        feature: 'PRD-IAM-023',
        gateways: messageGateways,
      });
    } catch { /* the decision stands */ }
    await auditAsync({
      event: 'AUD-IAM-013', area: 'IAM', feature: 'PRD-IAM-023', entity: 'TradeApplication', entityId: row.id, actor: by, before: { status: row.status }, after: { status: updated.status, reason }, note: `trade application ${decision}`,
    });
    return {
      ok: true, application: updated, roleGiven: null, reason, applicantTold: true,
    };
  }

  // approval: the TradeBuyer role, a company account (IAM-022) and the trade prices
  const roles = [...new Set([...(customer.roles ?? []), 'TradeBuyer'])];
  await customerRepo().updateAsync({ ...customer, roles, isTaxExempt: taxExempt === true ? true : customer.isTaxExempt === true });
  const company = await createCompanyAsync({
    name: row.companyName, registrationNumber: row.registrationNumber, taxNumber: row.taxNumber, status: 'Active', actor: by,
  });
  await addMemberAsync({
    companyId: company.id, email: customer.email, companyRole: 'CompanyAdministrator', actor: by, invite: false, storeId,
  });
  const updated = await applicationRepo().updateAsync({
    ...row, status: 'Approved', decidedBy: by, companyId: company.id, decidedOnUtc: new Date().toISOString(),
  });
  let notified = false;
  try {
    await sendAsync({
      event: 'Iam.TradeApplicationApproved.CustomerNotification',
      to: customer?.email ?? customer?.phone,
      channels: [customer?.email ? 'email' : 'sms'],
      tokens: { company: row.companyName },
      storeId,
      feature: 'PRD-IAM-023',
      gateways: messageGateways,
    });
    notified = true;
  } catch { /* the approval stands */ }
  await auditAsync({
    event: 'AUD-IAM-013', area: 'IAM', feature: 'PRD-IAM-023', entity: 'TradeApplication', entityId: row.id, actor: by, before: { status: row.status }, after: { status: 'Approved', roleGiven: 'TradeBuyer', companyId: company.id }, note: 'trade application approved',
  });
  return {
    ok: true,
    application: updated,
    roleGiven: 'TradeBuyer',
    company,
    tradePricesVisible: true,
    pricesLimitedBy: 'tier prices by CustomerRoleId and the product ACL',
    messageTemplate: 'Iam.TradeApplicationApproved.CustomerNotification',
    applicantNotified: notified,
  };
}

/** AC-IAM-023-02-03: trade prices are not shown while the application is still Received. */
export async function tradePricesVisibleAsync({ customer }) {
  const row = await customerRepo().getByIdAsync(customer.id);
  const open = await applicationRepo().getOneAsync((a) => a.customerId === customer.id && ['Received', 'MoreInformation'].includes(a.status));
  const isTradeBuyer = (row?.roles ?? []).includes('TradeBuyer');
  return {
    visible: isTradeBuyer,
    applicationStatus: open ? open.status : (isTradeBuyer ? 'Approved' : 'none'),
    reason: isTradeBuyer ? 'the customer holds TradeBuyer' : 'trade prices are tier prices of the TradeBuyer role',
  };
}

/* ================================================ PRD-IAM-024 tax exemption and VAT ===== */

/** AC-IAM-024-01-01: the native tax calculation adds no tax to an exempt customer's lines. */
export async function taxExemptionAsync({ customerId }) {
  const customer = await customerRepo().getByIdAsync(customerId);
  if (!customer) return { exempt: false };
  const roles = await repository('CustomerRole').getAllAsync((r) => (customer.roles ?? []).includes(r.systemName));
  const exemptRole = roles.find((r) => r.taxExempt === true);
  return {
    exempt: customer.isTaxExempt === true || Boolean(exemptRole),
    byCustomerFlag: customer.isTaxExempt === true,
    byRole: exemptRole?.systemName ?? null,
    calculatedBy: 'native tax calculation',
  };
}

export async function calculateLineTaxAsync({
  customerId, lineTotal, taxRate = 16.5,
}) {
  const exemption = await taxExemptionAsync({ customerId });
  const tax = exemption.exempt ? 0 : Math.round(Number(lineTotal) * (taxRate / 100) * 100) / 100;
  return {
    lineTotal: Number(lineTotal), taxRate: exemption.exempt ? 0 : taxRate, tax, exempt: exemption.exempt, exemption,
  };
}

/** AC-IAM-024-01-02: the flag is set on evidence, the change is audited, and it applies next. */
export async function setTaxExemptAsync({
  customerId, exempt, evidence = null, by, actor, applicationId = null,
}) {
  if (!await authorizeAsync('Customers.CustomersCreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Customers.CustomersCreateEditDelete' };
  }
  const customer = await customerRepo().getByIdAsync(customerId);
  if (!customer) return { ok: false, message: 'no such account' };
  const updated = await customerRepo().updateAsync({
    ...customer, isTaxExempt: exempt === true, taxExemptionEvidence: evidence, taxExemptionApplicationId: applicationId,
  });
  await auditAsync({
    event: 'AUD-IAM-013',
    area: 'IAM',
    feature: 'PRD-IAM-024',
    entity: 'Customer',
    entityId: customerId,
    actor: by,
    before: { isTaxExempt: customer.isTaxExempt === true },
    after: { isTaxExempt: exempt === true, evidence },
    note: 'tax exemption changed on evidence',
  });
  return {
    ok: true,
    customer: { ...updated, password: undefined },
    appliesFrom: 'the next calculation',
    heldBy: 'PH-INF',
    prototypeDefaultLabel: 'Prototype default - decision PH-INF pending',
  };
}

/** AC-IAM-024-02-01: the EU VAT configuration check (BR-IAM-121). */
export async function euVatConfigurationAsync({ storeId = 1 } = {}) {
  const enabled = await getSettingAsync('taxsettings.euvatenabled', storeId, false);
  const useWebService = await getSettingAsync('taxsettings.euvatusewebservice', storeId, false);
  const allowExemption = await getSettingAsync('taxsettings.euvatallowvatexemption', storeId, false);
  const countries = await repository('Country').getAllAsync();
  const reviewed = countries.map((c) => ({
    twoLetterIsoCode: c.twoLetterIsoCode ?? c.isoCode ?? null,
    name: c.name,
    subjectToVat: c.subjectToVat === true,
  }));
  const problems = [];
  if (enabled === true && useWebService === true) problems.push('taxsettings.euvatusewebservice must be off (BR-IAM-121)');
  if (enabled === true && allowExemption === true) problems.push('taxsettings.euvatallowvatexemption must be off (BR-IAM-121)');
  if (enabled === true && reviewed.some((c) => c.subjectToVat !== true)) {
    problems.push(`Country.SubjectToVat is not set for: ${reviewed.filter((c) => c.subjectToVat !== true).map((c) => c.name).join(', ')}`);
  }
  return {
    euVatEnabled: enabled === true,
    euVatUseWebService: useWebService === true,
    euVatAllowVatExemption: allowExemption === true,
    countriesReviewed: reviewed,
    ok: problems.length === 0,
    problems,
    rule: 'BR-IAM-121',
  };
}

export async function applyEuVatGuardAsync({ storeId = 1 } = {}) {
  await saveSettingAsync('taxsettings.euvatusewebservice', false, 0);
  await saveSettingAsync('taxsettings.euvatallowvatexemption', false, 0);
  return euVatConfigurationAsync({ storeId });
}

/** AC-IAM-024-02-02: the native MarkVatNumberAsValid / Invalid actions. */
export const VAT_NUMBER_STATUS = ['Unknown', 'Empty', 'Valid', 'Invalid'];

export async function setVatNumberAsync({ customerId, vatNumber }) {
  const customer = await customerRepo().getByIdAsync(customerId);
  if (!customer) return { ok: false, message: 'no such account' };
  const updated = await customerRepo().updateAsync({
    ...customer,
    vatNumber,
    vatNumberStatus: vatNumber ? 'Unknown' : 'Empty',
  });
  return { ok: true, vatNumber: updated.vatNumber, vatNumberStatus: updated.vatNumberStatus };
}

export async function markVatNumberAsync({
  customerId, status, by, actor,
}) {
  if (!await authorizeAsync('Customers.CustomersCreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Customers.CustomersCreateEditDelete' };
  }
  if (!['Valid', 'Invalid'].includes(status)) {
    return { ok: false, message: 'the native actions are MarkVatNumberAsValid and MarkVatNumberAsInvalid' };
  }
  const customer = await customerRepo().getByIdAsync(customerId);
  if (!customer) return { ok: false, message: 'no such account' };
  const updated = await customerRepo().updateAsync({ ...customer, vatNumberStatus: status });
  await auditAsync({
    event: 'AUD-IAM-013', area: 'IAM', feature: 'PRD-IAM-024', entity: 'Customer', entityId: customerId, actor: by, before: { vatNumberStatus: customer.vatNumberStatus ?? 'Unknown' }, after: { vatNumberStatus: status }, note: `VAT number marked ${status.toLowerCase()}`,
  });
  return {
    ok: true,
    vatNumberStatus: updated.vatNumberStatus,
    nativeAction: status === 'Valid' ? 'MarkVatNumberAsValid' : 'MarkVatNumberAsInvalid',
    exemptionFollows: false,
    note: 'marking a number valid grants no exemption: EuVatAllowVatExemption stays off (BR-IAM-121)',
  };
}
