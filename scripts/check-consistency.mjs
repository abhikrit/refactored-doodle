#!/usr/bin/env node
// Gate from PROTOTYPE_HANDOFF.md section 5.5: check_consistency of IDs.
// Asserts the counts the PRD states and that every ID cross-reference resolves.
//
//   npm run check

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'packages', 'shared', 'data');
const load = (n) => JSON.parse(readFileSync(join(D, n), 'utf8'));

const areas = load('areas.json');
const features = load('features.json');
const stories = load('stories.json');
const criteria = load('criteria.json');
const screens = load('screens.json');
const rules = load('rules.json');
const requirements = load('requirements.json');
const { holds, readiness } = load('holds.json');
const { decisions, gaps } = load('decisions.json');
const packs = load('packs.json');
const external = load('external-systems.json');
const licensed = load('licensed-plugins.json');
const coreMods = load('core-modifications.json');

const fails = [];
const ok = [];
function expect(label, actual, wanted, citation) {
  if (actual === wanted) ok.push(`${label}: ${actual}`);
  else fails.push(`${label}: got ${actual}, PRD states ${wanted}  (${citation})`);
}
function expectEmpty(label, list, citation) {
  if (list.length === 0) ok.push(`${label}: none`);
  else fails.push(`${label}: ${list.length} unresolved, e.g. ${list.slice(0, 5).join(', ')}  (${citation})`);
}

// ---- counts stated in the PRD ----------------------------------------------
expect('areas', areas.length, 24, 'L1 section 3.1 / section 7');
expect('features', features.length, 434, 'L1 section 3.1');
expect('user stories', stories.length, 1160, 'Compliance section 5.1');
expect('acceptance criteria', criteria.length, 2850, 'Compliance section 5.1');
expect('screens', screens.length, 274, 'module chapters section 11.1 (24 modules)');
expect('business rules', rules.length, 497, 'module chapters section 8.1');
expect('client requirements', requirements.length, 506, 'Compliance section 5.1');
expect('KTDA requirements', requirements.filter((r) => r.client === 'KTDA').length, 95, 'Compliance section 4.1');
expect('Malawi Post requirements', requirements.filter((r) => r.client === 'MPC').length, 411, 'Compliance section 4.2');
expect('features on hold', features.filter((f) => f.held).length, 100, 'L1 section 3.3');
expect('holding decisions', holds.length, 24, 'L1 section 3.3 table 1');
expect('readiness conditions', readiness.length, 32, 'L1 section 3.3 table 2');
expect('decision log', decisions.length, 75, 'Register section 1.1');
expect('gap register', gaps.length, 40, 'Register section 5.1');
expect('external systems', external.length, 45, 'L1 section 6.9');
expect('licensed plugins', licensed.length, 11, 'L1 section 6.8');
expect('core modifications', coreMods.length, 6, 'L1 section 6.3');

expect('phase P1', features.filter((f) => f.phase === 'P1').length, 337, 'L1 section 3.1');
expect('phase P2', features.filter((f) => f.phase === 'P2').length, 76, 'L1 section 3.1');
expect('phase P3', features.filter((f) => f.phase === 'P3').length, 21, 'L1 section 3.1');

expect('fit: configuration', features.filter((f) => f.configuration).length, 70, 'L1 section 0 / 6.7');
expect('fit: licensed plugin', features.filter((f) => f.licensed).length, 11, 'L1 section 0 / 6.7');
expect('fit: code-level', features.filter((f) => f.codeLevel).length, 308, 'L1 section 0 / 6.7');
expect('fit: external system', features.filter((f) => f.external).length, 45, 'L1 section 0 / 6.7');

expect('pack feature total', packs.packs.reduce((s, p) => s + p.features, 0), 434, 'L1 section 6.6');
expect('reuse tier total', packs.tiers.reduce((s, t) => s + t.features, 0), 434, 'L1 section 6.6');

// per-area feature counts must match the L1 section 7 table
for (const a of areas) {
  const n = features.filter((f) => f.area === a.code).length;
  expect(`area ${a.code} features`, n, a.features, 'L1 section 7');
}

// ---- referential integrity -------------------------------------------------
const featureIds = new Set(features.map((f) => f.id));
const storyIds = new Set(stories.map((s) => s.id));
const criterionIds = new Set(criteria.map((c) => c.id));

expectEmpty('story -> feature', stories.filter((s) => !featureIds.has(s.feature)).map((s) => s.id), 'traceability rule 2');
expectEmpty('criterion -> story', criteria.filter((c) => !storyIds.has(c.story)).map((c) => c.id), 'traceability rule 2');
expectEmpty('criterion -> feature', criteria.filter((c) => !featureIds.has(c.feature)).map((c) => c.id), 'traceability rule 2');
expectEmpty('feature -> depends on', features.flatMap((f) => f.dependsOn.filter((d) => !featureIds.has(d)).map((d) => `${f.id}->${d}`)), 'workbook "Depends on"');
expectEmpty('screen -> feature', screens.flatMap((s) => s.features.filter((f) => !featureIds.has(f)).map((f) => `${s.id}->${f}`)), 'module chapters section 11.1');
expectEmpty('hold -> feature', holds.flatMap((h) => h.features.filter((f) => !featureIds.has(f)).map((f) => `${h.decision}->${f}`)), 'L1 section 3.3');
expectEmpty('requirement -> feature', requirements.flatMap((r) => r.features.filter((f) => !featureIds.has(f)).map((f) => `${r.id}->${f}`)), 'Compliance section 4');
expectEmpty('feature -> criteria present', features.filter((f) => f.criteria.length === 0).map((f) => f.id), 'every feature has at least one AC');

// every feature belongs to exactly one of the 24 areas
const areaCodes = new Set(areas.map((a) => a.code));
expectEmpty('feature -> area', features.filter((f) => !areaCodes.has(f.area)).map((f) => f.id), 'L1 section 7');

// ---- tests must be named by AC ID (Definition of Done / handoff 5.3.4) -----
let testNames = [];
try {
  const { execSync } = await import('node:child_process');
  const out = execSync(
    `grep -rhoE "(test|it)\\(\\s*'(AC-[A-Z]+-[0-9]{3}-[0-9]{2}-[0-9]{2})'" ${join(ROOT, 'tests')} || true`,
    { encoding: 'utf8' },
  );
  testNames = [...out.matchAll(/'(AC-[A-Z]+-\d{3}-\d{2}-\d{2})'/g)].map((m) => m[1]);
} catch { /* tests not present yet */ }
expectEmpty('test name -> AC ID', testNames.filter((t) => !criterionIds.has(t)), 'CLAUDE.md: test name = AC ID');

// ---- report ----------------------------------------------------------------
console.log(`check-consistency: ${ok.length} checks passed`);
if (fails.length) {
  console.error(`\n${fails.length} FAILED:`);
  for (const f of fails) console.error(`  x ${f}`);
  process.exit(1);
}
console.log('all ID counts and cross-references resolve against /docs');
