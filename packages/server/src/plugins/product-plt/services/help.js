// PRD-PLT-019 Contextual help and guided tours.
//
// Help tips are configuration, keyed by route and role and held per language; a guided tour per
// role starts once for a user, can be skipped and replayed (message Plt.Help.TourReplay) and its
// completion is stored per user. Training material is a link to a DOC-002 document or an MKT-007
// content page - PLT-019 holds the link, the owning module holds the item.
// The native admin first-run steps (resources Admin.ConfigurationSteps.*) and
// AdminAreaSettings.ShowDocumentationReferenceLinks stay available alongside the PLT tips.

import { repository } from '../../../core/repository.js';
import { getSettingAsync, saveSettingAsync } from '../../../core/settings.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { resourceForAsync } from './localisation.js';

const tipRepo = () => repository('HelpTip');
const tourRepo = () => repository('HelpTour');
const completionRepo = () => repository('HelpTourCompletion');

export const TOUR_ROLES = ['buyer', 'seller', 'staff'];
export const NATIVE_FIRST_RUN_RESOURCES = [
  'Admin.ConfigurationSteps.Title',
  'Admin.ConfigurationSteps.GeneralSettings',
  'Admin.ConfigurationSteps.PaymentMethods',
  'Admin.ConfigurationSteps.ShippingMethods',
  'Admin.ConfigurationSteps.Tax',
];

const MATERIAL_SOURCES = ['PRD-DOC-002 document', 'PRD-MKT-007 content page'];

/* ============================================================== help tips =============== */

/** AC-PLT-019-02-01: tips, tour steps and training links are edited behind the permission. */
export async function saveTipAsync({
  route, role = null, languageId = 1, title, body, materialLink = null, displayOrder = 0, actor = null,
}) {
  if (!await authorizeAsync('Platform.Core.Help.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Help.CreateEditDelete' };
  }
  if (materialLink && !MATERIAL_SOURCES.includes(materialLink.source)) {
    return { ok: false, message: `a training link names a ${MATERIAL_SOURCES.join(' or a ')}` };
  }
  const existing = await tipRepo().getOneAsync((t) => t.route === route && (t.role ?? null) === (role ?? null)
    && Number(t.languageId) === Number(languageId) && t.title === title);
  const row = {
    route,
    role: role ?? null,
    languageId: Number(languageId),
    title,
    body,
    materialLink: materialLink ?? null,
    displayOrder,
    updatedBy: actor?.email ?? null,
  };
  const saved = existing ? await tipRepo().updateAsync({ ...existing, ...row }) : await tipRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-SEC-001',
    area: 'PLT',
    feature: 'PRD-PLT-019',
    entity: 'HelpTip',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before: existing ? { title: existing.title, body: existing.body } : null,
    after: { route, role: role ?? null, languageId: Number(languageId), title },
    note: existing ? 'help tip changed' : 'help tip created',
  });
  return {
    ok: true, tip: saved, shownWithoutDeployment: true, deploymentRequired: false,
  };
}

export async function deleteTipAsync({ tipId, actor = null }) {
  if (!await authorizeAsync('Platform.Core.Help.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Help.CreateEditDelete' };
  }
  const row = await tipRepo().getByIdAsync(tipId);
  if (!row) return { ok: false, message: 'no such tip' };
  await tipRepo().deleteAsync(row.id);
  return { ok: true, deleted: Number(tipId) };
}

/** AC-PLT-019-01-01: the tips of that screen and role, in the user's language. */
export async function tipsForAsync({
  route, role = null, languageId = 1, storeId = 1,
}) {
  const all = await tipRepo().getAllAsync((t) => t.route === route);
  const mine = all.filter((t) => t.role === null || t.role === role);
  const rows = [];
  for (const tip of mine) {
    if (Number(tip.languageId) === Number(languageId)) {
      rows.push({ ...tip, translated: true });
      continue;
    }
    // the same tip in the user's language, else the default-language text (PLT-009 fallback)
    const translated = all.find((t) => t.title === tip.title && Number(t.languageId) === Number(languageId)
      && (t.role === null || t.role === role));
    if (!translated) rows.push({ ...tip, translated: false, fallback: 'the default language' });
  }
  return {
    route,
    role,
    languageId: Number(languageId),
    tips: rows.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    hasTips: rows.length > 0,
    native: await adminFirstRunAsync({ storeId, languageId }),
  };
}

/* ============================================================== guided tours ============ */

export async function saveTourAsync({
  role, name, steps, languageId = 1, active = true, actor = null,
}) {
  if (!await authorizeAsync('Platform.Core.Help.CreateEditDelete', actor)) {
    return { ok: false, denied: true, permission: 'Platform.Core.Help.CreateEditDelete' };
  }
  if (!TOUR_ROLES.includes(role)) return { ok: false, message: `a tour is for ${TOUR_ROLES.join(', ')}` };
  const existing = await tourRepo().getOneAsync((t) => t.role === role && Number(t.languageId) === Number(languageId));
  const row = {
    role, name, steps, languageId: Number(languageId), active: active !== false, updatedBy: actor?.email ?? null,
  };
  const saved = existing ? await tourRepo().updateAsync({ ...existing, ...row }) : await tourRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-SEC-001',
    area: 'PLT',
    feature: 'PRD-PLT-019',
    entity: 'HelpTour',
    entityId: saved.id,
    actor: actor?.email ?? null,
    before: existing ? { steps: existing.steps?.length ?? 0 } : null,
    after: { role, steps: (steps ?? []).length },
    note: existing ? 'guided tour changed' : 'guided tour created',
  });
  return { ok: true, tour: saved, shownWithoutDeployment: true };
}

const completionAsync = (tourId, customerId) => completionRepo()
  .getOneAsync((c) => Number(c.tourId) === Number(tourId) && Number(c.customerId) === Number(customerId));

/**
 * AC-PLT-019-01-02: the tour of the user's role starts once on the first sign-in; afterwards it
 * does not start by itself, and the user can replay it.
 */
export async function tourForAsync({
  role, customerId, languageId = 1,
}) {
  const tour = await tourRepo().getOneAsync((t) => t.role === role && t.active !== false
    && (Number(t.languageId) === Number(languageId) || Number(t.languageId) === 1));
  if (!tour) {
    return {
      role, tour: null, startsNow: false, replayLabel: resource('Plt.Help.TourReplay'),
    };
  }
  const seen = await completionAsync(tour.id, customerId);
  if (!seen) {
    await completionRepo().insertAsync({
      tourId: tour.id,
      customerId: Number(customerId),
      status: 'Started',
      startedOnUtc: new Date().toISOString(),
    });
  }
  return {
    role,
    tour: {
      id: tour.id, name: tour.name, steps: tour.steps, languageId: tour.languageId,
    },
    startsNow: !seen,
    startedBefore: Boolean(seen),
    status: seen?.status ?? 'Started',
    canSkip: true,
    canReplay: true,
    replayLabel: resource('Plt.Help.TourReplay'),
    storedPerUser: true,
  };
}

export async function finishTourAsync({
  tourId, customerId, status = 'Completed',
}) {
  if (!['Completed', 'Skipped'].includes(status)) return { ok: false, message: 'a tour is Completed or Skipped' };
  const existing = await completionAsync(tourId, customerId);
  const row = {
    tourId: Number(tourId),
    customerId: Number(customerId),
    status,
    finishedOnUtc: new Date().toISOString(),
  };
  const saved = existing ? await completionRepo().updateAsync({ ...existing, ...row }) : await completionRepo().insertAsync(row);
  return { ok: true, completion: saved, storedPerUser: true };
}

/** The replay the user asks for: the tour runs again without changing its completion. */
export async function replayTourAsync({ tourId, customerId }) {
  const tour = await tourRepo().getByIdAsync(tourId);
  if (!tour) return { ok: false, message: 'no such tour' };
  const completion = await completionAsync(tourId, customerId);
  if (completion) {
    await completionRepo().updateAsync({ ...completion, replays: (completion.replays ?? 0) + 1, lastReplayOnUtc: new Date().toISOString() });
  }
  return {
    ok: true,
    tour: { id: tour.id, name: tour.name, steps: tour.steps },
    replayed: true,
    label: resource('Plt.Help.TourReplay'),
    completionStatus: completion?.status ?? null,
  };
}

export const tourCompletionsAsync = (customerId = null) => completionRepo()
  .getAllAsync((c) => customerId === null || Number(c.customerId) === Number(customerId));

/* ======================================================== the native admin help ========= */

/** AC-PLT-019-01-03: the native first-run steps and documentation links stay available. */
export async function adminFirstRunAsync({ storeId = 1, languageId = 1 } = {}) {
  const show = await getSettingAsync('adminareasettings.showdocumentationreferencelinks', storeId, true);
  const steps = [];
  for (const key of NATIVE_FIRST_RUN_RESOURCES) {
    const row = await resourceForAsync({ key, languageId, storeId });
    // the prototype does not ship the nopCommerce resource XML, so a native step whose text has
    // not been imported is reported as not loaded rather than shown with invented text
    const loaded = row.value !== key;
    steps.push({
      resource: key, text: loaded ? row.value : null, textLoaded: loaded, source: 'native 5.00.1 locale resource',
    });
  }
  return {
    configurationSteps: steps,
    nativeResourcesLoaded: steps.every((s) => s.textLoaded),
    resourcePrefix: 'Admin.ConfigurationSteps.',
    showDocumentationReferenceLinks: show === true,
    setting: 'adminareasettings.showdocumentationreferencelinks',
    availableAlongsidePltTips: true,
  };
}

export async function setDocumentationLinksAsync({ storeId = 0, show, actor = null }) {
  if (!await authorizeAsync('Configuration.ManageSettings', actor)) {
    return { ok: false, denied: true, permission: 'Configuration.ManageSettings' };
  }
  await saveSettingAsync('adminareasettings.showdocumentationreferencelinks', show === true, Number(storeId), 'runtime');
  return { ok: true, showDocumentationReferenceLinks: show === true };
}

export const tipsAsync = () => tipRepo().getAllAsync();
export const toursAsync = () => tourRepo().getAllAsync();
