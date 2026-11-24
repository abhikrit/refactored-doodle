// Single source the web and the API both import. Every file under ../data is generated
// from /docs by scripts/generate-registries.mjs - never edit the JSON by hand.
import areas from '../data/areas.json' with { type: 'json' };
import features from '../data/features.json' with { type: 'json' };
import stories from '../data/stories.json' with { type: 'json' };
import criteria from '../data/criteria.json' with { type: 'json' };
import rules from '../data/rules.json' with { type: 'json' };
import states from '../data/states.json' with { type: 'json' };
import screens from '../data/screens.json' with { type: 'json' };
import messages from '../data/messages.json' with { type: 'json' };
import settings from '../data/settings.json' with { type: 'json' };
import packRows from '../data/pack-rows.json' with { type: 'json' };
import packs from '../data/packs.json' with { type: 'json' };
import holds from '../data/holds.json' with { type: 'json' };
import decisions from '../data/decisions.json' with { type: 'json' };
import requirements from '../data/requirements.json' with { type: 'json' };
import journeys from '../data/journeys.json' with { type: 'json' };
import roles from '../data/roles.json' with { type: 'json' };
import channels from '../data/channels.json' with { type: 'json' };
import nfr from '../data/nfr.json' with { type: 'json' };
import definitionOfDone from '../data/definition-of-done.json' with { type: 'json' };
import coreModifications from '../data/core-modifications.json' with { type: 'json' };
import externalSystems from '../data/external-systems.json' with { type: 'json' };
import licensedPlugins from '../data/licensed-plugins.json' with { type: 'json' };
import contracts from '../data/contracts.json' with { type: 'json' };
import auditEvents from '../data/audit-events.json' with { type: 'json' };
import actors from '../data/actors.json' with { type: 'json' };
import permissions from '../data/permissions.json' with { type: 'json' };
import meta from '../data/meta.json' with { type: 'json' };

export const registry = {
  meta,
  areas,
  features,
  stories,
  criteria,
  rules,
  states,
  screens,
  messages,
  settings,
  packRows,
  packs,
  holds,
  decisions,
  requirements,
  journeys,
  roles,
  channels,
  nfr,
  definitionOfDone,
  coreModifications,
  externalSystems,
  licensedPlugins,
  contracts,
  auditEvents,
  actors,
  permissions,
};

export const AREA_CODES = areas.map((a) => a.code);
export const featureById = Object.fromEntries(features.map((f) => [f.id, f]));
export const featuresByArea = Object.fromEntries(
  areas.map((a) => [a.code, features.filter((f) => f.area === a.code)]),
);
export const criteriaByFeature = features.reduce((acc, f) => {
  acc[f.id] = criteria.filter((c) => c.feature === f.id);
  return acc;
}, {});
export const screensByArea = Object.fromEntries(
  areas.map((a) => [a.code, screens.filter((s) => s.area === a.code)]),
);

// ---------------------------------------------------------------------------
// Role catalogue - derived, for the role-by-role implementation view.
// Roles are the beneficiary groups of L1 section 5.2 (the workbook "Who benefits" column);
// actors come from each module chapter's section 4, permissions from the same section's
// permission table. Nothing here is invented: the join keys are the names the PRD uses.
const norm = (s) => String(s).trim().toLowerCase();
const screenById = Object.fromEntries(screens.map((s) => [s.id, s]));

export const roleCatalogue = roles.map((role) => {
  const key = norm(role.group);
  const own = features.filter((f) => (f.whoBenefits || '').split(';').map(norm).includes(key))
    .map((f) => f.id);
  const loose = own.length ? own : features
    .filter((f) => norm(f.whoBenefits || '').includes(key) || norm(f.whoUsesIt || '').includes(key))
    .map((f) => f.id);
  const featureIds = new Set(loose);
  const featureList = features.filter((f) => featureIds.has(f.id));
  const roleAreas = [...new Set(featureList.map((f) => f.area))];
  const roleScreens = [...new Set(featureList.flatMap((f) => f.screens))].map((id) => screenById[id]).filter(Boolean);
  const singular = key.replace(/s$/, '');
  return {
    id: role.group.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase(),
    name: role.group,
    statedFeatureCount: role.features,
    features: [...featureIds],
    areas: roleAreas,
    phases: {
      P1: featureList.filter((f) => f.phase === 'P1').length,
      P2: featureList.filter((f) => f.phase === 'P2').length,
      P3: featureList.filter((f) => f.phase === 'P3').length,
    },
    held: featureList.filter((f) => f.held).length,
    criteria: featureList.reduce((s, f) => s + f.criteria.length, 0),
    screens: roleScreens.map((s) => s.id),
    surfaces: [...new Set(roleScreens.map((s) => s.surface))],
    actors: actors.filter((a) => norm(a.actor).includes(singular) || singular.includes(norm(a.actor).split(' ')[0])),
    permissions: permissions.filter((p) => p.defaultRoles.some((r) => norm(r).includes(singular)
      || singular.includes(norm(r)))).map((p) => p.systemName),
    waves: [...new Set(featureList.map((f) => f.wave))].filter(Boolean).sort(),
  };
}).sort((a, b) => b.features.length - a.features.length);

export const actorsByArea = Object.fromEntries(
  areas.map((a) => [a.code, actors.filter((x) => x.area === a.code)]),
);
export const permissionsByArea = Object.fromEntries(
  areas.map((a) => [a.code, permissions.filter((x) => x.area === a.code)]),
);

export default registry;
