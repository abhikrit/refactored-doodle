#!/usr/bin/env node
// Writes the build order for a working role group - the mapping a module session starts from.
//
//   node scripts/build-group-map.mjs                       # default: client-administrators
//   node scripts/build-group-map.mjs finance-fraud-and-legal-staff
//
// Order inside the map follows the handoff: wave (section 5.2), then phase P1 -> P2 -> P3, then
// MoSCoW priority, then the workbook "Depends on" order. A feature held by an open decision is
// listed in place and marked: it is built to the PRD's Proposed option and labelled (P-1), and a
// real build does not start it until the decision is recorded.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'packages', 'shared', 'data');
const load = (n) => JSON.parse(readFileSync(join(D, n), 'utf8'));

const groups = load('working-groups.json');
const features = load('features.json');
const areas = load('areas.json');
const screens = load('screens.json');
const trace = (() => {
  try { return JSON.parse(readFileSync(join(ROOT, 'trace', 'trace.json'), 'utf8')); } catch { return null; }
})();

const wanted = process.argv[2] ?? 'client-administrators';
const group = groups.find((g) => g.id === wanted);
if (!group) {
  console.error(`unknown group "${wanted}". Known: ${groups.map((g) => g.id).join(', ')}`);
  process.exit(1);
}

const byId = Object.fromEntries(features.map((f) => [f.id, f]));
const stateOf = (id) => trace?.features.find((f) => f.id === id)?.state ?? 'not-built';
const PRIORITY_ORDER = { 'Must Have': 0, 'Should Have': 1, 'Could Have': 2 };
const PHASE_ORDER = { P1: 0, P2: 1, P3: 2 };

const members = group.features.map((id) => byId[id]).filter(Boolean);

// dependency order inside a wave: a feature comes after the features it depends on
function orderWithinWave(list) {
  const ids = new Set(list.map((f) => f.id));
  const placed = [];
  const seen = new Set();
  const visit = (f, stack = new Set()) => {
    if (seen.has(f.id) || stack.has(f.id)) return;
    stack.add(f.id);
    for (const d of f.dependsOn) if (ids.has(d)) visit(byId[d], stack);
    stack.delete(f.id);
    if (!seen.has(f.id)) { seen.add(f.id); placed.push(f); }
  };
  const sorted = list.slice().sort((a, b) => (PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase])
    || (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
    || a.id.localeCompare(b.id));
  for (const f of sorted) visit(f);
  return placed;
}

const waves = [...new Set(members.map((f) => f.wave))].filter(Boolean).sort((a, b) => a - b);
const plan = waves.map((w) => {
  const inWave = orderWithinWave(members.filter((f) => f.wave === w));
  const area = areas.find((a) => a.wave === w);
  return { wave: w, waveName: area?.waveName ?? '', features: inWave };
});

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (headers, lines) => [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...lines].join('\n');
const screensFor = (f) => screens.filter((s) => f.screens.includes(s.id));

const STATE_LABEL = {
  built: 'built', 'built-with-failures': 'built, a test failing', 'held-default': 'held, prototype default', mocked: 'mocked', 'not-built': 'not built',
};

const md = `# Build map — ${group.group}

Generated ${new Date().toISOString()} by \`scripts/build-group-map.mjs\`.

${group.matchesDiagram
    ? `The product mapping diagram counts **${group.diagramCount}** features for this group and the registry reproduces it exactly.`
    : `The product mapping diagram counts **${group.diagramCount}** features for this group; the registry gives **${group.count}** from the role names in \`docs/roadmap/working-groups.md\`. That list needs a line of confirmation.`}

A feature is in this group when its Client-PRD "Who uses it" list names one of:
${group.roleNames.map((r) => `\`${r}\``).join(' · ')}.

Groups overlap: these features also serve other users, and most of them are not *only* this
group's. Building them is building the spine of the product, not a silo.

## 1. Profile

${table(['Measure', 'Value'], [
    `| Features | ${group.count} |`,
    `| Acceptance criteria | ${group.criteria} |`,
    `| Phase | P1 ${group.phases.P1} · P2 ${group.phases.P2} · P3 ${group.phases.P3} |`,
    `| Priority | Must ${group.priorities['Must Have']} · Should ${group.priorities['Should Have']} · Could ${group.priorities['Could Have']} |`,
    `| Held by an open decision | ${group.held} |`,
    `| Modules touched | ${group.areas.length} of 24 — ${group.areas.join(' ')} |`,
    `| Build waves | ${group.waves.join(', ')} |`,
  ])}

### Implementation route

${table(['Route', 'Features'], Object.entries(members.reduce((acc, f) => {
    acc[f.implementation] = (acc[f.implementation] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`))}

### By module

${table(['Module', 'Name', 'Features', 'P1', 'Must', 'Held', 'ACs'], areas
    .filter((a) => group.areas.includes(a.code))
    .map((a) => {
      const inArea = members.filter((f) => f.area === a.code);
      return `| ${a.code} | ${esc(a.name)} | ${inArea.length} | ${inArea.filter((f) => f.phase === 'P1').length} | ${inArea.filter((f) => f.priority === 'Must Have').length} | ${inArea.filter((f) => f.held).length} | ${inArea.reduce((s, f) => s + f.criteria.length, 0)} |`;
    }))}

## 2. Build order

Wave first (handoff section 5.2), then P1 → P2 → P3, then Must → Should → Could, then the
workbook "Depends on" order. "State" is what the prototype has today, from \`trace/trace.json\`.

${plan.map(({ wave, waveName, features: list }) => `### Wave ${wave} — ${waveName} (${list.length} features)

${table(['#', 'Feature', 'Name', 'Module', 'Phase', 'Priority', 'Implementation', 'ACs', 'Screens', 'State', 'Held by'],
    list.map((f, i) => `| ${i + 1} | ${f.id} | ${esc(f.name)} | ${f.area} | ${f.phase} | ${esc(f.priority)} | ${esc(f.implementation)} | ${f.criteria.length} | ${f.screens.length} | ${STATE_LABEL[stateOf(f.id)]} | ${f.heldBy.join(' / ') || '—'} |`))}`).join('\n\n')}

## 3. Screens these features own

${table(['Surface', 'Screen', 'Module', 'Features', 'Native or new'], [...new Map(members
    .flatMap((f) => screensFor(f).map((s) => [s.id, s]))).values()]
    .sort((a, b) => a.surface.localeCompare(b.surface) || a.area.localeCompare(b.area))
    .map((s) => `| ${esc(s.surfaceLabel)} | ${esc(s.screen)} | ${s.area} | ${s.features.map((x) => x.replace('PRD-', '')).join(', ')} | ${esc(s.nativeOrNew)} |`))}

## 4. Open decisions that hold features in this group

${group.held === 0 ? 'None.' : table(['Decision', 'Features held in this group'],
    Object.entries(members.filter((f) => f.held).reduce((acc, f) => {
      for (const d of f.heldBy) (acc[d] ||= []).push(f.id);
      return acc;
    }, {})).sort((a, b) => b[1].length - a[1].length)
      .map(([d, ids]) => `| ${d} | ${ids.length} — ${ids.map((x) => x.replace('PRD-', '')).join(', ')} |`))}

Each is built to the PRD's Proposed option and labelled "Prototype default — decision <ID> pending"
(prototype decision P-1). A real build does not start a held feature until the decision is recorded.
`;

mkdirSync(join(ROOT, 'trace'), { recursive: true });
const file = join(ROOT, 'trace', `build-map-${group.id}.md`);
writeFileSync(file, md);
console.log(`build map written: trace/build-map-${group.id}.md`);
console.log(`  ${group.group}: ${group.count} features, ${group.criteria} acceptance criteria, ${group.held} held`);
console.log(`  waves: ${plan.map((p) => `${p.wave}=${p.features.length}`).join(' ')}`);
