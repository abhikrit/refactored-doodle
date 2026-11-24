#!/usr/bin/env node
// Maps Malawi Post's own Lot 1 requirements onto the product's features, for one actor.
//
//   node scripts/build-mpc-map.mjs            # default: Admin
//   node scripts/build-mpc-map.mjs "MPC Ops"
//
// The client's annex assigns every requirement an Actor/Role. That is the client's own cut of
// who the system serves, and it is not the same cut as the product mapping diagram's user
// groups - so this map also says which of the features an actor needs fall outside that group,
// because those are the ones a group-led build would miss.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'packages', 'shared', 'data');
const load = (n) => JSON.parse(readFileSync(join(D, n), 'utf8'));

const requirements = load('requirements.json').filter((r) => r.frId);
const features = load('features.json');
const areas = load('areas.json');
const groups = load('working-groups.json');
const trace = (() => {
  try { return JSON.parse(readFileSync(join(ROOT, 'trace', 'trace.json'), 'utf8')); } catch { return null; }
})();

const actor = process.argv[2] ?? 'Admin';
const ACTOR_GROUP = { Admin: 'client-administrators', 'MPC Ops': 'logistics-warehouse-and-operations-staff', 'Customer Support': 'support-staff', 'Seller/SME': 'sellers', Buyer: 'shoppers' };

const byId = Object.fromEntries(features.map((f) => [f.id, f]));
const mine = requirements.filter((r) => r.actor === actor);
if (mine.length === 0) {
  console.error(`no requirement has actor "${actor}". Actors: ${[...new Set(requirements.map((r) => r.actor))].join(', ')}`);
  process.exit(1);
}

const group = groups.find((g) => g.id === ACTOR_GROUP[actor]);
const inGroup = new Set(group ? group.features : []);
const needed = [...new Set(mine.flatMap((r) => r.features))].filter((f) => byId[f]).sort();
const outside = needed.filter((f) => !inGroup.has(f));
const stateOf = (id) => trace?.features.find((f) => f.id === id)?.state ?? 'not-built';

const PRIO = { Must: 0, Should: 1, Could: 2 };
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (headers, rows) => [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows].join('\n');
const count = (list, key) => Object.entries(list.reduce((a, r) => {
  a[r[key]] = (a[r[key]] ?? 0) + 1;
  return a;
}, {})).sort((a, b) => b[1] - a[1]);

// a requirement answered "Available" should be met by features the PRD routes as configuration
const availableButBuilt = mine.filter((r) => r.bidderResponse === 'Available'
  && r.features.length > 0
  && !r.features.every((f) => byId[f]?.implementation === 'Configuration'));
const availableButHeld = mine.filter((r) => r.bidderResponse === 'Available'
  && r.features.some((f) => byId[f]?.held));

const md = `# Malawi Post requirement map — actor "${actor}"

Generated ${new Date().toISOString()} by \`scripts/build-mpc-map.mjs\`.

Source: \`docs/client/MPC-Lot1-FR-Catalogue.md\`, the client's own annex
(MPC Requirements Catalogue Annex, Deliverable 2 — Lot 1, FR-001…FR-350). The FR numbering is the
same as \`REQ-MPC-FR-nnn\` in the compliance report, which is where the requirement → feature
mapping comes from.

## 1. Profile

${table(['Measure', 'Value'], [
    `| Requirements with actor "${actor}" | ${mine.length} of ${requirements.length} |`,
    `| Client priority | ${count(mine, 'clientPriority').map(([k, v]) => `${k} ${v}`).join(' · ')} |`,
    `| Distinct product features needed | ${needed.length} |`,
    `| Of those, inside the "${group ? group.group : '—'}" user group | ${needed.length - outside.length} |`,
    `| **Outside it** | **${outside.length}** |`,
    `| Client acceptance criteria stated | ${mine.reduce((s, r) => s + r.clientAcceptanceCriteria.length, 0)} |`,
  ])}

### By the client's own domain

${table(['Domain', 'Requirements'], count(mine, 'domain').map(([k, v]) => `| ${esc(k)} | ${v} |`))}

### Bidder response already given to the client

${table(['Response', 'Requirements'], count(mine, 'bidderResponse').map(([k, v]) => `| ${esc(k)} | ${v} |`))}

## 2. Features this actor needs that the user group does not contain (${outside.length})

A build led by the user group would miss these. They are needed by at least one "${actor}"
requirement, but the Client-PRD "Who uses it" list for those features does not name the group.

${outside.length === 0 ? 'None.' : table(['Feature ID', 'Roadmap row', 'Name', 'Module', 'Phase', 'Priority', 'Wave', 'State', 'Required by'],
    outside.map((f) => {
      const x = byId[f];
      const by = mine.filter((r) => r.features.includes(f)).map((r) => r.frId).join(', ');
      return `| ${f} | ${x.roadmapRow ?? '—'} | ${esc(x.name)} | ${x.area} | ${x.phase} | ${esc(x.priority)} | ${x.wave ?? '—'} | ${stateOf(f)} | ${by} |`;
    }))}

## 3. Every requirement, with the features that deliver it

Ordered by the client's priority, then by requirement number. "Client AC" is the client's own
acceptance criteria — what a demo is judged against. They are not the product's AC-\<AREA\>-nnn and
do not replace them; a feature is still only built when its own ACs pass (P-6).

${table(['Req', 'Priority', 'Domain', 'Shall statement', 'Client AC', 'Bidder response', 'Features'],
    mine.slice().sort((a, b) => (PRIO[a.clientPriority] - PRIO[b.clientPriority]) || a.frId.localeCompare(b.frId))
      .map((r) => `| ${r.frId} | ${r.clientPriority} | ${esc(r.domain)} | ${esc(r.shall)} | ${esc(r.clientAcceptanceCriteria.join(' '))} | ${esc(r.bidderResponse)}${r.bidderNote ? ` ${esc(r.bidderNote)}` : ''} | ${r.features.join(', ')} |`))}

## 4. Worth a review before the demo

### 4.1 Answered "Available", delivered by a feature the PRD does not route as configuration (${availableButBuilt.length})

"Available" in the bidder response reads as *the capability exists in the product*; the PRD's
route says *how this product builds it*. The two are not the same statement, so this is a review
list, not a contradiction — but each line is a place where the client may expect to see something
working that is in fact a build.

${availableButBuilt.length === 0 ? 'None.' : table(['Req', 'Priority', 'Shall statement', 'Route', 'Features'],
    availableButBuilt.map((r) => `| ${r.frId} | ${r.clientPriority} | ${esc(r.shall)} | ${[...new Set(r.features.map((f) => byId[f]?.implementation))].join(' / ')} | ${r.features.join(', ')} |`))}

### 4.2 Answered "Available", delivered by a feature held by an open decision (${availableButHeld.length})

These are firmer: the feature cannot be started until the decision is recorded (P-1), yet the
client has been told the capability is available.

${availableButHeld.length === 0 ? 'None.' : table(['Req', 'Shall statement', 'Feature', 'Held by'],
    availableButHeld.flatMap((r) => r.features.filter((f) => byId[f]?.held)
      .map((f) => `| ${r.frId} | ${esc(r.shall)} | ${f} | ${byId[f].heldBy.join(' / ')} |`)))}

## 5. Build order for the features this actor needs

Wave, then the client's priority, then the product's phase.

${[...new Set(needed.map((f) => byId[f].wave))].filter(Boolean).sort().map((w) => {
    const list = needed.filter((f) => byId[f].wave === w);
    const area = areas.find((a) => a.wave === w);
    return `### Wave ${w} — ${area?.waveName ?? ''} (${list.length})

${table(['Feature ID', 'Roadmap row', 'Name', 'Module', 'Phase', 'In the user group', 'State', 'Client requirements'],
    list.map((f) => {
      const x = byId[f];
      const by = mine.filter((r) => r.features.includes(f)).map((r) => r.frId);
      return `| ${f} | ${x.roadmapRow ?? '—'} | ${esc(x.name)} | ${x.area} | ${x.phase} | ${inGroup.has(f) ? 'yes' : '**no**'} | ${stateOf(f)} | ${by.join(', ')} |`;
    }))}`;
  }).join('\n\n')}
`;

mkdirSync(join(ROOT, 'trace'), { recursive: true });
const slug = actor.toLowerCase().replace(/[^a-z0-9]+/g, '-');
writeFileSync(join(ROOT, 'trace', `mpc-map-${slug}.md`), md);
console.log(`Malawi Post map written: trace/mpc-map-${slug}.md`);
console.log(`  actor "${actor}": ${mine.length} requirements -> ${needed.length} features (${outside.length} outside the "${group ? group.group : '—'}" group)`);
console.log(`  review: ${availableButBuilt.length} answered Available but routed as a build, ${availableButHeld.length} answered Available but held`);
