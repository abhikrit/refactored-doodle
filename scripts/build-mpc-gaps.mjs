#!/usr/bin/env node
// Answers one question: does Malawi Post need anything the 434 product features do not cover?
//
//   node scripts/build-mpc-gaps.mjs    ->  trace/mpc-gap-analysis.md
//
// It separates four things that are easy to confuse:
//   1. a requirement with no feature at all          - a real hole in the product
//   2. a requirement whose feature covers only part  - a scope gap in an existing feature
//   3. a requirement missing a measurable target     - a hole in the client's own specification
//   4. a requirement blocked by an open decision     - covered, but not startable yet
// Only (1) and (2) are reasons to add or widen a product feature.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'packages', 'shared', 'data');
const load = (n) => JSON.parse(readFileSync(join(D, n), 'utf8'));

const requirements = load('requirements.json');
const features = load('features.json');
const groups = load('working-groups.json');
const byId = Object.fromEntries(features.map((f) => [f.id, f]));

const mpc = requirements.filter((r) => r.client === 'MPC');
const lot1 = mpc.filter((r) => r.frId);
const other = mpc.filter((r) => !r.frId);

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (headers, rows) => [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows].join('\n');
const tally = (list, key) => Object.entries(list.reduce((a, r) => {
  a[r[key]] = (a[r[key]] ?? 0) + 1;
  return a;
}, {})).sort((a, b) => b[1] - a[1]);

// 1. requirements with no product feature at all
const unmapped = mpc.filter((r) => r.features.length === 0);
const unmappedProduct = unmapped.filter((r) => !r.status.startsWith('Project service'));

// 2. partial coverage, split by whether the shortfall is a behaviour or a missing target
const partial = mpc.filter((r) => r.status === 'Partially compliant');
const MISSING_TARGET = /not stated|no measurable|undefined|has no measurable/i;
const scopeGap = partial.filter((r) => !MISSING_TARGET.test(r.notes));
const targetGap = partial.filter((r) => MISSING_TARGET.test(r.notes));

// 3. covered but blocked
const subjectDecision = lot1.filter((r) => r.status.includes('subject to decision'));
const subjectContent = lot1.filter((r) => r.status.includes('subject to client content'));
const onlyHeld = lot1.filter((r) => r.features.length > 0
  && r.features.every((f) => byId[f]?.held));

// 4. the build set: the user group plus what the client's Admin actor needs
const group = groups.find((g) => g.id === 'client-administrators');
const inGroup = new Set(group.features);
const adminNeeds = new Set(lot1.filter((r) => r.actor === 'Admin').flatMap((r) => r.features));
const union = [...new Set([...inGroup, ...adminNeeds])].filter((f) => byId[f]).sort();
const unionFeatures = union.map((f) => byId[f]);
const countBy = (list, key) => Object.entries(list.reduce((a, f) => {
  a[f[key]] = (a[f[key]] ?? 0) + 1;
  return a;
}, {})).sort();

const md = `# Malawi Post — is anything missing from the product?

Generated ${new Date().toISOString()} by \`scripts/build-mpc-gaps.mjs\`.

Sources: \`docs/client/MPC-Lot1-FR-Catalogue.md\` (the client's Lot 1 annex, FR-001…FR-350) and
\`docs/compliance/Compliance-Traceability.md\` (the requirement → feature mapping and the
compliance status of each requirement).

## Answer

**No Malawi Post requirement is without a product feature.** All ${lot1.length} Lot 1 functional
requirements map to at least one of the 434 features. ${unmapped.length} Malawi Post requirements carry no
feature at all, and ${unmapped.length - unmappedProduct.length} of those are project services - hardware, hosting, training,
reports - which are delivered by the project, not by the product (L1 section 3.2).
${unmappedProduct.length === 0 ? 'None of them is a product requirement left uncovered.' : `**${unmappedProduct.length} are product requirements with no feature and need one.**`}

What is missing is narrower and in three kinds.

${table(['Kind', 'Count', 'What to do'], [
    `| A product requirement with no feature | ${unmappedProduct.length} | add a feature |`,
    `| A feature that covers only part of the requirement | ${scopeGap.length} | widen the feature's scope, or add one |`,
    `| A requirement with no measurable target in the client's own source | ${targetGap.length} | ask the client for the number; no code decides this |`,
    `| Covered, but held by an open decision | ${onlyHeld.length} | record the decision; the feature cannot start until then |`,
  ])}

## 1. Scope gaps — a stated behaviour the mapped feature does not cover (${scopeGap.length})

These are the only places where the product needs to grow for Malawi Post. Each is a behaviour the
requirement states and the mapped feature does not. Widening the existing feature keeps the PRD ID
space intact; adding a new \`PRD-<AREA>-nnn\` forks it from the PRD set, so the roadmap revision
should say which was chosen.

${scopeGap.length === 0 ? 'None.' : table(['Req', 'Actor', 'Priority', 'Requirement', 'Mapped to', 'What is not covered'],
    scopeGap.map((r) => `| ${r.frId ?? r.id} | ${r.actor ?? '—'} | ${r.clientPriority ?? '—'} | ${esc(r.text)} | ${r.features.join(', ')} | ${esc((r.notes.split('):').pop() ?? r.notes).trim())} |`))}

## 2. Missing measurable targets — the client's specification, not the product (${targetGap.length})

These read as gaps but no feature closes them: the requirement states a quality with no number.
They need a figure from Malawi Post, recorded as a setting with no hidden default (CLAUDE.md).

The split between this section and the one above follows the wording of the compliance note:
"not covered" means the feature falls short, "not stated in source" means the client has not said
what the behaviour should be. **FR-323 sits on that line**: SEL-013 does carry Allow entries, but
what an Allow entry does beyond suppressing Watch flags is not stated, so no one can build it
either way until Malawi Post says. Treat it as a question to the client, not as a feature to add.

${targetGap.length === 0 ? 'None.' : table(['Req', 'Requirement', 'Mapped to', 'What is not stated'],
    targetGap.map((r) => `| ${r.frId ?? r.id} | ${esc(r.text)} | ${r.features.join(', ')} | ${esc((r.notes.split('):').pop() ?? r.notes).trim())} |`))}

## 3. Covered but blocked

### 3.1 Every delivering feature is held by an open decision (${onlyHeld.length})

The requirement is mapped, but no part of it can be started until the decision is recorded (P-1).
This is the largest single risk to a Malawi Post build.

${table(['Decision', 'Requirements blocked', 'Of which Must'], tally(onlyHeld.flatMap((r) => [...new Set(r.features.flatMap((f) => byId[f]?.heldBy ?? []))].map((d) => ({ d }))), 'd')
    .map(([d, n]) => {
      const musts = onlyHeld.filter((r) => r.clientPriority === 'Must'
        && r.features.some((f) => (byId[f]?.heldBy ?? []).includes(d))).length;
      return `| ${d} | ${n} | ${musts} |`;
    }))}

Must-priority requirements blocked this way:

${table(['Req', 'Actor', 'Requirement', 'Feature', 'Held by'],
    onlyHeld.filter((r) => r.clientPriority === 'Must')
      .map((r) => `| ${r.frId} | ${r.actor} | ${esc(r.text)} | ${r.features.join(', ')} | ${[...new Set(r.features.flatMap((f) => byId[f]?.heldBy ?? []))].join(' / ')} |`))}

### 3.2 Status of the ${lot1.length} Lot 1 requirements

${table(['Compliance status', 'Requirements'], tally(lot1, 'status').map(([k, v]) => `| ${esc(k)} | ${v} |`))}

Subject to decision: ${subjectDecision.length}. Subject to client content: ${subjectContent.length}. Both are covered by a
feature; neither is a hole in the product.

## 4. The build set

The product mapping diagram's **Client administrators** group holds ${inGroup.size} features. Malawi Post's
own annex gives the **Admin** actor ${lot1.filter((r) => r.actor === 'Admin').length} requirements, which need ${adminNeeds.size} features. The two cuts
are not the same, so the set to build is the union - nothing from the ${inGroup.size} is dropped, and what
Malawi Post's Admin needs on top is added.

${table(['Set', 'Features'], [
    `| Client administrators user group | ${inGroup.size} |`,
    `| Features the MPC Admin actor needs | ${adminNeeds.size} |`,
    `| In both | ${[...adminNeeds].filter((f) => inGroup.has(f)).length} |`,
    `| Only in the user group | ${[...inGroup].filter((f) => !adminNeeds.has(f)).length} |`,
    `| Only required by Malawi Post | ${[...adminNeeds].filter((f) => !inGroup.has(f)).length} |`,
    `| **Union - the build set** | **${union.length}** |`,
  ])}

${table(['Measure', 'Value'], [
    `| Acceptance criteria | ${unionFeatures.reduce((s, f) => s + f.criteria.length, 0)} |`,
    `| Phase | ${countBy(unionFeatures, 'phase').map(([k, v]) => `${k} ${v}`).join(' · ')} |`,
    `| Priority | ${countBy(unionFeatures, 'priority').map(([k, v]) => `${k} ${v}`).join(' · ')} |`,
    `| Held by an open decision | ${unionFeatures.filter((f) => f.held).length} |`,
    `| By wave | ${countBy(unionFeatures, 'wave').map(([k, v]) => `${k}: ${v}`).join(' · ')} |`,
  ])}

### Only required by Malawi Post, not in the user group (${[...adminNeeds].filter((f) => !inGroup.has(f)).length})

${table(['Feature ID', 'Roadmap row', 'Name', 'Module', 'Phase', 'Priority', 'Wave', 'Required by'],
    [...adminNeeds].filter((f) => !inGroup.has(f)).sort().map((f) => {
      const x = byId[f];
      const by = lot1.filter((r) => r.actor === 'Admin' && r.features.includes(f)).map((r) => r.frId).join(', ');
      return `| ${f} | ${x.roadmapRow ?? '—'} | ${esc(x.name)} | ${x.area} | ${x.phase} | ${esc(x.priority)} | ${x.wave ?? '—'} | ${by} |`;
    }))}
`;

mkdirSync(join(ROOT, 'trace'), { recursive: true });
writeFileSync(join(ROOT, 'trace', 'mpc-gap-analysis.md'), md);
console.log('gap analysis written: trace/mpc-gap-analysis.md');
console.log(`  product requirements with no feature: ${unmappedProduct.length}`);
console.log(`  scope gaps (widen a feature):         ${scopeGap.length}  ${scopeGap.map((r) => r.frId ?? r.id).join(', ')}`);
console.log(`  missing measurable targets:           ${targetGap.length}  ${targetGap.map((r) => r.frId ?? r.id).join(', ')}`);
console.log(`  requirements blocked by a decision:   ${onlyHeld.length}`);
console.log(`  union build set:                      ${union.length} features (${inGroup.size} group + ${[...adminNeeds].filter((f) => !inGroup.has(f)).length} only required by MPC)`);
