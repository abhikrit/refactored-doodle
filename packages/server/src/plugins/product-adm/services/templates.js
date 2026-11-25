// PRD-ADM-011 Template library and PRD-ADM-012 Template analytics and shared marketplace.
//
// ADM-011
//   US-ADM-011-01  a private library derived from the vertical defaults
//   US-ADM-011-02  every version kept with author, time and summary, with rollback
//   US-ADM-011-03  inheritance with visible overrides, and cloning
//   US-ADM-011-04  changes to active templates approved before use
//   US-ADM-011-05  one configuration workspace
// ADM-012
//   US-ADM-012-01  which templates are used, stale or erroring
//   US-ADM-012-02  publish anonymised templates to a shared library and adopt others
//
// BR-ADM-040 and SM-ADM-06. The approval goes through ADM-006 (IC-ADM-03), by a user holding
// Administration.Core.Templates.Approve other than the author.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { submitAsync, registerApprovalCallbacks } from './approvals.js';

const templateRepo = () => repository('TransactionTemplate');
const versionRepo = () => repository('TemplateVersion');
const usageRepo = () => repository('TemplateUsage');
const sharedRepo = () => repository('SharedTemplatePackage');

export const templatesAsync = async () => {
  const rows = await templateRepo().getAllAsync();
  const versions = await versionRepo().getAllAsync();
  return rows.map((t) => ({
    ...t,
    versions: versions.filter((v) => v.templateId === t.id).sort((a, b) => b.no - a.no),
  }));
};

export const templateAsync = (id) => templateRepo().getByIdAsync(id);

/**
 * AC-ADM-011-01-01: each client template shows the vertical default it derives from, and editing
 * a client template never changes that default.
 */
export async function libraryAsync() {
  const all = await templatesAsync();
  return {
    verticalDefaults: all.filter((t) => t.scope === 'vertical'),
    clientTemplates: all.filter((t) => t.scope === 'client').map((t) => ({
      ...t,
      derivedFrom: all.find((d) => d.id === t.parentId)?.code ?? null,
    })),
  };
}

/**
 * AC-ADM-011-02-01: a change creates a new version with author, time and change summary.
 * AC-ADM-011-04-01: a change to an ACTIVE template waits for approval; transactions keep using
 * the active version until it is approved.
 */
export async function saveTemplateAsync({
  id, values, summary, author = 'admin',
}) {
  const template = await templateRepo().getByIdAsync(id);
  if (!template) throw new Error('unknown template');
  if (template.scope === 'vertical') {
    return { ok: false, message: 'a vertical default is supplied by the pack (PLT-003) and is not edited here' };
  }
  const versions = await versionRepo().getAllAsync((v) => v.templateId === id);
  const version = await versionRepo().insertAsync({
    templateId: id,
    no: versions.length ? Math.max(...versions.map((v) => v.no)) + 1 : 1,
    values,
    author,
    summary,
    status: template.status === 'Active' ? 'PendingApproval' : 'Draft',
    createdOnUtc: new Date().toISOString(),
  });

  if (template.status !== 'Active') {
    const updated = await templateRepo().updateAsync({ ...template, values, activeVersionNo: version.no });
    return { ok: true, template: updated, version, approvalRequired: false };
  }

  const submitted = await submitAsync({
    objectType: 'TransactionTemplate',
    objectId: `${id}:${version.no}`,
    requesterId: null,
    requesterEmail: author,
    summary: `Template ${template.code} version ${version.no}: ${summary}`,
    chainCode: 'template-approval',
    approverRole: 'Administrators',
  });
  const updated = await templateRepo().updateAsync({ ...template, status: 'PendingApproval', pendingVersionNo: version.no });
  return {
    ok: true,
    template: updated,
    version,
    approvalRequired: true,
    approvalItemId: submitted.item?.id ?? null,
    activeVersionInUse: template.activeVersionNo,
  };
}

/** The IC-ADM-03 callback: ADM-006 decides, ADM-011 applies the effect to its own object. */
export function registerTemplateApproval() {
  registerApprovalCallbacks('TransactionTemplate', {
    feature: 'PRD-ADM-011',
    canDecide: async ({ objectId }) => {
      const [templateId] = String(objectId).split(':');
      const template = await templateRepo().getByIdAsync(Number(templateId));
      if (!template) return { allowed: false, reason: 'the template no longer exists' };
      return { allowed: true };
    },
    onApproved: async ({ objectId }) => {
      const [templateId, versionNo] = String(objectId).split(':');
      const template = await templateRepo().getByIdAsync(Number(templateId));
      const version = await versionRepo().getOneAsync((v) => v.templateId === template.id && v.no === Number(versionNo));
      for (const old of await versionRepo().getAllAsync((v) => v.templateId === template.id && v.status === 'Active')) {
        await versionRepo().updateAsync({ ...old, status: 'Superseded' });
      }
      await versionRepo().updateAsync({ ...version, status: 'Active' });
      const activated = await templateRepo().updateAsync({
        ...template, status: 'Active', values: version.values, activeVersionNo: version.no, pendingVersionNo: null,
      });
      await auditAsync({
        event: 'AUD-ADM-009',
        area: 'ADM',
        feature: 'PRD-ADM-011',
        entity: 'TransactionTemplate',
        entityId: template.id,
        actor: 'approver',
        actorRole: 'Administrators',
        before: { activeVersionNo: template.activeVersionNo },
        after: { activeVersionNo: version.no },
        note: 'template version approved and activated',
      });
      return { activated: activated.code, version: version.no };
    },
    onRejected: async ({ objectId }) => {
      const [templateId] = String(objectId).split(':');
      const template = await templateRepo().getByIdAsync(Number(templateId));
      await templateRepo().updateAsync({ ...template, status: 'Active', pendingVersionNo: null });
      return { reverted: template.code };
    },
  });
}

/** AC-ADM-011-02-01: an earlier version is restored as a new version. */
export async function restoreVersionAsync({ templateId, no, author = 'admin' }) {
  const version = await versionRepo().getOneAsync((v) => v.templateId === templateId && v.no === no);
  if (!version) return { ok: false, message: 'unknown version' };
  return saveTemplateAsync({
    id: templateId, values: version.values, summary: `restored version ${no}`, author,
  });
}

/** AC-ADM-011-03-01: every field shows whether it is inherited or overridden. */
export async function inheritanceAsync(templateId) {
  const template = await templateRepo().getByIdAsync(templateId);
  if (!template) return null;
  const parent = template.parentId ? await templateRepo().getByIdAsync(template.parentId) : null;
  const fields = Object.keys({ ...(parent?.values ?? {}), ...(template.values ?? {}) }).map((key) => {
    const parentValue = parent?.values?.[key];
    const own = Object.prototype.hasOwnProperty.call(template.values ?? {}, key)
      && template.values[key] !== parentValue;
    return {
      field: key,
      value: template.values?.[key] ?? parentValue,
      inherited: !own,
      overridden: own,
      parentValue: own ? parentValue : undefined,
    };
  });
  return { template, parent: parent?.code ?? null, fields };
}

/** AC-ADM-011-03-02: a clone is a new template with the same values and its own history. */
export async function cloneTemplateAsync({ templateId, code, author = 'admin' }) {
  const template = await templateRepo().getByIdAsync(templateId);
  if (!template) return { ok: false, message: 'unknown template' };
  const clone = await templateRepo().insertAsync({
    code: code ?? `${template.code}-copy`,
    name: `${template.name} (copy)`,
    scope: 'client',
    parentId: template.parentId,
    typeCode: template.typeCode,
    values: { ...template.values },
    status: 'Draft',
    activeVersionNo: 1,
  });
  await versionRepo().insertAsync({
    templateId: clone.id, no: 1, values: { ...template.values }, author, summary: `cloned from ${template.code}`, status: 'Draft', createdOnUtc: new Date().toISOString(),
  });
  return { ok: true, template: clone, ownVersionHistory: true };
}

/** AC-ADM-011-05-01: the configuration workspace - every area opens its owning screen. */
export const WORKSPACE_AREAS = [
  {
    area: 'Branding and look', feature: 'PRD-PLT-006', route: '/admin/configuration/packs', editedHere: false,
  },
  {
    area: 'Wording (locale resources)', feature: 'PRD-PLT-006', route: '/admin/configuration/languages', editedHere: false,
  },
  {
    area: 'Workflows', feature: 'PRD-ADM-002', route: '/admin/configuration/workflows', editedHere: false,
  },
  {
    area: 'Business rules', feature: 'PRD-ADM-003', route: '/admin/configuration/rules', editedHere: false,
  },
  {
    area: 'Document templates', feature: 'PRD-DOC-001', route: '/admin/configuration/message-templates', editedHere: false,
  },
  {
    area: 'Notification templates', feature: 'PRD-TRK-004', route: '/admin/configuration/message-templates', editedHere: false,
  },
];

/* ============================================================ ADM-012 analytics ========== */

export async function recordUsageAsync({
  templateId, transactionRef, outcome = 'completed',
}) {
  return usageRepo().insertAsync({
    templateId, transactionRef, outcome, usedOnUtc: new Date().toISOString(),
  });
}

/**
 * AC-ADM-012-01-01: per template the number of transactions in the period, the date last used
 * and the number of failed or exception cases; unused for the configured period is stale.
 */
export async function analyticsAsync({ periodDays = 90, staleAfterDays = 60 } = {}) {
  const templates = await templateRepo().getAllAsync();
  const usage = await usageRepo().getAllAsync();
  const since = Date.now() - periodDays * 24 * 3600 * 1000;
  return templates.map((t) => {
    const rows = usage.filter((u) => u.templateId === t.id);
    const inPeriod = rows.filter((u) => new Date(u.usedOnUtc).getTime() >= since);
    const lastUsed = rows.map((u) => u.usedOnUtc).sort().pop() ?? null;
    const ageDays = lastUsed ? (Date.now() - new Date(lastUsed).getTime()) / (24 * 3600 * 1000) : Infinity;
    return {
      code: t.code,
      name: t.name,
      transactionsInPeriod: inPeriod.length,
      lastUsed,
      failedOrException: rows.filter((u) => ['failed', 'exception'].includes(u.outcome)).length,
      stale: ageDays > staleAfterDays,
      periodDays,
      staleAfterDays,
    };
  });
}

const CLIENT_IDENTIFIER_FIELDS = ['clientName', 'clientCode', 'address', 'contact', 'user', 'owner', 'email'];

/**
 * AC-ADM-012-02-01: publishing removes client identifiers and the package goes to the central
 * product library outside every client instance (one installation per client, PLT-002).
 */
export async function publishToSharedLibraryAsync({ templateId, author = 'admin' }) {
  const template = await templateRepo().getByIdAsync(templateId);
  if (!template) return { ok: false, message: 'unknown template' };
  const values = { ...template.values };
  const removed = [];
  for (const key of Object.keys(values)) {
    if (CLIENT_IDENTIFIER_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      delete values[key];
      removed.push(key);
    }
  }
  const pkg = await sharedRepo().insertAsync({
    code: template.code,
    name: template.name,
    typeCode: template.typeCode,
    values,
    removedIdentifiers: removed,
    publishedBy: author,
    destination: 'central product library (outside every client instance, PLT-002)',
    publishedOnUtc: new Date().toISOString(),
  });
  return { ok: true, package: pkg, removedIdentifiers: removed };
}

/** AC-ADM-012-02-02: an imported package becomes a DRAFT and follows the ADM-011 approval. */
export async function adoptFromSharedLibraryAsync({ packageId, author = 'admin' }) {
  const pkg = await sharedRepo().getByIdAsync(packageId);
  if (!pkg) return { ok: false, message: 'unknown package' };
  const template = await templateRepo().insertAsync({
    code: `${pkg.code}-adopted`,
    name: pkg.name,
    scope: 'client',
    parentId: null,
    typeCode: pkg.typeCode,
    values: { ...pkg.values },
    status: 'Draft',
    adoptedFrom: pkg.code,
    activeVersionNo: 1,
  });
  await versionRepo().insertAsync({
    templateId: template.id, no: 1, values: { ...pkg.values }, author, summary: `adopted from the shared library (${pkg.code})`, status: 'Draft', createdOnUtc: new Date().toISOString(),
  });
  return {
    ok: true, template, status: 'Draft', approvalBeforeUse: 'PRD-ADM-011 (AC-ADM-011-04-01)',
  };
}

export const sharedLibraryAsync = () => sharedRepo().getAllAsync();
