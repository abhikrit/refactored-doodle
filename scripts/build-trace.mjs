#!/usr/bin/env node
// Generates /trace - handoff section 5.3.5: "update trace/ (feature -> AC -> test -> pass/fail)".
//
//   npm run trace
//
// It runs the Node test suites, reads which AC IDs passed, and reconciles every one of the 434
// features into exactly one state:
//   built            - at least one of its ACs has a passing test named by that AC ID
//   held-default     - held by an open decision; the prototype shows the PRD's Proposed option (P-1)
//   mocked           - an external-system feature standing behind a mock adapter (P-3)
//   not-built        - scaffolded only; Session 0 did not build it
// Nothing is marked done because it looks finished: only a passing AC-named test counts (P-6).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'packages', 'shared', 'data');
const load = (n) => JSON.parse(readFileSync(join(D, n), 'utf8'));

const features = load('features.json');
const criteria = load('criteria.json');
const stories = load('stories.json');
const areas = load('areas.json');
const requirements = load('requirements.json');
const { holds } = load('holds.json');
const meta = load('meta.json');

function runSuite(glob, label, { serial = false } = {}) {
  const results = [];
  let raw = '';
  try {
    // the browser suites drive one running prototype, and one of them switches the client pack,
    // which re-seeds the store - so they run one file at a time
    raw = execFileSync(process.execPath, ['--test', ...(serial ? ['--test-concurrency=1'] : []), glob], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000,
    });
  } catch (err) {
    raw = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
  for (const line of raw.split('\n')) {
    const m = /^\s*(not ok|ok)\s+\d+\s+-\s+(AC-[A-Z]+-\d{3}-\d{2}-\d{2})\s*$/.exec(line);
    if (m) results.push({ criterion: m[2], status: m[1] === 'ok' ? 'pass' : 'fail', suite: label });
  }
  return { results, raw };
}

const unit = runSuite('tests/unit/*.test.js', 'node (API and rules)');
const ui = runSuite('tests/ui/*.test.js', 'playwright (browser)', { serial: true });
const tests = [...unit.results, ...ui.results];
const byCriterion = new Map();
for (const t of tests) {
  const existing = byCriterion.get(t.criterion);
  // a criterion covered twice counts as failed if either run failed
  if (!existing || t.status === 'fail') byCriterion.set(t.criterion, t);
}

const criteriaByFeature = {};
for (const c of criteria) (criteriaByFeature[c.feature] ||= []).push(c);

const rows = features.map((f) => {
  const acs = criteriaByFeature[f.id] ?? [];
  const covered = acs.filter((a) => byCriterion.has(a.id));
  const passing = covered.filter((a) => byCriterion.get(a.id).status === 'pass');
  // Decision P-6: a feature is reported built only when EVERY one of its criteria has a test
  // named by its AC ID and that test passes. A feature with some criteria tested and some not is
  // 'partial' and is never counted as built - "everything else is not-built, never silently green".
  let state;
  if (acs.length > 0 && passing.length === acs.length) state = 'built';
  else if (passing.length > 0 && passing.length === covered.length) state = 'partial';
  else if (covered.length > 0) state = 'built-with-failures';
  else if (f.held) state = 'held-default';
  else if (f.external) state = 'mocked';
  else state = 'not-built';
  return {
    id: f.id,
    name: f.name,
    area: f.area,
    phase: f.phase,
    wave: f.wave,
    pack: f.pack,
    implementation: f.implementation,
    state,
    criteria: acs.length,
    criteriaCovered: covered.length,
    criteriaPassing: passing.length,
    heldBy: f.heldBy,
    prototypeDefaultLabel: f.prototypeDefaultLabel,
    requirements: f.requirements,
    tests: covered.map((a) => ({ criterion: a.id, ...byCriterion.get(a.id) })),
  };
});

const count = (s) => rows.filter((r) => r.state === s).length;
const totals = {
  features: rows.length,
  built: count('built'),
  partial: count('partial') + count('built-with-failures'),
  heldWithDefault: count('held-default'),
  mocked: count('mocked'),
  notBuilt: count('not-built'),
  criteria: criteria.length,
  criteriaWithTests: byCriterion.size,
  testsPassing: [...byCriterion.values()].filter((t) => t.status === 'pass').length,
  testsFailing: [...byCriterion.values()].filter((t) => t.status === 'fail').length,
  stories: stories.length,
};
totals.reconciles = totals.built + totals.partial + totals.heldWithDefault + totals.mocked
  + totals.notBuilt === totals.features;

// requirement coverage: a requirement counts as demonstrated when one of its features is built
const builtIds = new Set(rows.filter((r) => r.state === 'built').map((r) => r.id));
const requirementCoverage = ['KTDA', 'MPC'].map((client) => {
  const list = requirements.filter((r) => r.client === client);
  const demonstrated = list.filter((r) => r.features.some((f) => builtIds.has(f)));
  return {
    client,
    requirements: list.length,
    demonstratedInPrototype: demonstrated.length,
    mappedToFeatures: list.filter((r) => r.features.length > 0).length,
    projectService: list.filter((r) => r.status.startsWith('Project service')).length,
  };
});

const byArea = areas.map((a) => {
  const inArea = rows.filter((r) => r.area === a.code);
  return {
    area: a.code,
    name: a.name,
    wave: a.wave,
    waveName: a.waveName,
    features: inArea.length,
    built: inArea.filter((r) => r.state === 'built').length,
    partial: inArea.filter((r) => r.state === 'partial' || r.state === 'built-with-failures').length,
    held: inArea.filter((r) => r.state === 'held-default').length,
    mocked: inArea.filter((r) => r.state === 'mocked').length,
    notBuilt: inArea.filter((r) => r.state === 'not-built').length,
  };
});

const trace = {
  generated: new Date().toISOString(),
  generator: 'scripts/build-trace.mjs',
  registry: meta.counts,
  totals,
  byArea,
  requirementCoverage,
  holds: holds.map((h) => ({ decision: h.decision, features: h.features.length, owner: h.owner, type: h.type })),
  tests: [...byCriterion.values()].map((t) => ({
    criterion: t.criterion,
    feature: criteria.find((c) => c.id === t.criterion)?.feature ?? null,
    test: t.criterion,
    suite: t.suite,
    status: t.status,
  })).sort((a, b) => a.criterion.localeCompare(b.criterion)),
  features: rows,
};

mkdirSync(join(ROOT, 'trace'), { recursive: true });
writeFileSync(join(ROOT, 'trace', 'trace.json'), `${JSON.stringify(trace, null, 2)}\n`);

/* ------------------------------------------------------------- markdown ---- */
const table = (headers, lines) => [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...lines].join('\n');

const md = `# Trace report

Generated ${trace.generated} by \`scripts/build-trace.mjs\`. Source of every ID: \`/docs\`.

## 1. Reconciliation

Every one of the ${totals.features} product features is in exactly one state. Nothing is reported
done because it looks finished: a feature counts as built only when EVERY one of its acceptance
criteria has a passing test named by that AC ID (prototype decision P-6). A feature with some of
its criteria tested and the rest not is partial, and is never counted as built.

${table(['State', 'Features', 'Meaning'], [
    `| Built and passing | ${totals.built} | Every AC of the feature has a passing test named by the AC ID |`,
    `| Partly covered | ${totals.partial} | Some ACs have passing tests, the rest have none yet |`,
    `| Held, prototype default | ${totals.heldWithDefault} | Held by an open decision; built as the PRD's Proposed option and labelled (P-1) |`,
    `| Mocked externally | ${totals.mocked} | External-system feature standing behind a mock adapter (P-3) |`,
    `| Not built | ${totals.notBuilt} | Scaffolded in Session 0, built in its own session |`,
    `| **Total** | **${totals.features}** | reconciles: ${totals.reconciles ? 'yes' : 'NO'} |`,
  ])}

Acceptance criteria in the product: ${totals.criteria}. Criteria with a test in this repository:
${totals.criteriaWithTests} (${totals.testsPassing} passing, ${totals.testsFailing} failing).

## 2. Coverage by area and wave

${table(['Wave', 'Area', 'Name', 'Features', 'Built', 'Partial', 'Held', 'Mocked', 'Not built'],
    byArea.sort((a, b) => a.wave - b.wave || a.area.localeCompare(b.area))
      .map((a) => `| ${a.wave} ${a.waveName} | ${a.area} | ${a.name} | ${a.features} | ${a.built} | ${a.partial} | ${a.held} | ${a.mocked} | ${a.notBuilt} |`))}

## 3. Client requirement coverage

${table(['Client', 'Requirements', 'Mapped to a feature', 'Demonstrated in the prototype', 'Project service'],
    requirementCoverage.map((r) => `| ${r.client === 'MPC' ? 'Malawi Post' : r.client} | ${r.requirements} | ${r.mappedToFeatures} | ${r.demonstratedInPrototype} | ${r.projectService} |`))}

"Demonstrated in the prototype" means at least one feature that delivers the requirement has a
passing AC-named test here. It is not a compliance statement: the compliance status of each
requirement is in \`docs/compliance/Compliance-Traceability.md\`.

## 4. Tests, by acceptance criterion

${table(['AC ID', 'Feature', 'Suite', 'Result'],
    trace.tests.map((t) => `| ${t.criterion} | ${t.feature ?? '-'} | ${t.suite} | ${t.status} |`))}

## 5. Features held by an open decision (${totals.heldWithDefault})

Each is built as the PRD's Proposed option and labelled "Prototype default - decision <ID> pending"
in the user interface and here.

${table(['Decision', 'Features held', 'Type', 'Owner'],
    trace.holds.map((h) => `| ${h.decision} | ${h.features} | ${h.type} | ${h.owner} |`))}

## 6. Every feature

${table(['Feature', 'Name', 'Area', 'Phase', 'Wave', 'State', 'ACs', 'Tested', 'Decision'],
    rows.map((r) => `| ${r.id} | ${r.name} | ${r.area} | ${r.phase} | ${r.wave ?? '-'} | ${r.state} | ${r.criteria} | ${r.criteriaPassing} | ${r.heldBy.join(' / ') || '-'} |`))}
`;

writeFileSync(join(ROOT, 'trace', 'trace.md'), md);

/* ----------------------------------------------------------------- html ---- */
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trace report</title>
<style>
 :root{color-scheme:light}
 body{font:14px/1.5 "Segoe UI",system-ui,sans-serif;margin:0;background:#ecf0f5;color:#333}
 main{max-width:1200px;margin:0 auto;padding:24px 16px}
 h1{font-size:22px;margin:0 0 4px} p.sub{color:#6b7280;margin:0 0 20px}
 .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px}
 .tile{background:#fff;border:1px solid #d2d6de;border-radius:2px;overflow:hidden}
 .tile b{display:block;font-size:24px;padding:10px 12px 2px;color:#fff}
 .tile span{display:block;padding:0 12px 10px;font-size:12px;color:#fff;opacity:.9}
 .blue b,.blue span{background:#3c8dbc}.green b,.green span{background:#00a65a}
 .amber b,.amber span{background:#f39c12}.red b,.red span{background:#dd4b39}.slate b,.slate span{background:#475569}
 section{background:#fff;border:1px solid #d2d6de;border-radius:2px;margin-bottom:16px}
 section h2{font-size:15px;margin:0;padding:10px 14px;border-bottom:1px solid #d2d6de}
 table{border-collapse:collapse;width:100%;font-size:12.5px}
 th{background:#f9fafb;text-align:left;padding:7px 10px;border-bottom:1px solid #d2d6de;color:#4b5563}
 td{padding:6px 10px;border-bottom:1px solid #eef1f4}
 tr:hover td{background:#f8fafc}
 .pill{display:inline-block;padding:1px 6px;border-radius:2px;font-size:11px;border:1px solid}
 .built{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
 .held-default{background:#fffbeb;color:#78350f;border-color:#fde68a}
 .mocked{background:#f1f5f9;color:#334155;border-color:#cbd5e1}
 .not-built{background:#fef2f2;color:#7f1d1d;border-color:#fecaca}
 code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
</style></head><body><main>
<h1>Trace report</h1>
<p class="sub">Generated ${trace.generated} · feature → acceptance criterion → test → result · ${totals.features} features, ${totals.criteria} criteria</p>
<div class="tiles">
 <div class="tile blue"><b>${totals.features}</b><span>Features</span></div>
 <div class="tile green"><b>${totals.built}</b><span>Built and passing</span></div>
 <div class="tile amber"><b>${totals.heldWithDefault}</b><span>Held, prototype default</span></div>
 <div class="tile slate"><b>${totals.mocked}</b><span>Mocked externally</span></div>
 <div class="tile red"><b>${totals.notBuilt}</b><span>Not built</span></div>
</div>
<section><h2>Coverage by area and wave</h2><table><thead><tr><th>Wave</th><th>Area</th><th>Name</th><th>Features</th><th>Built</th><th>Held</th><th>Mocked</th><th>Not built</th></tr></thead><tbody>
${byArea.map((a) => `<tr><td>${a.wave} ${a.waveName}</td><td><code>${a.area}</code></td><td>${a.name}</td><td>${a.features}</td><td>${a.built}</td><td>${a.held}</td><td>${a.mocked}</td><td>${a.notBuilt}</td></tr>`).join('\n')}
</tbody></table></section>
<section><h2>Tests by acceptance criterion</h2><table><thead><tr><th>AC ID</th><th>Feature</th><th>Suite</th><th>Result</th></tr></thead><tbody>
${trace.tests.map((t) => `<tr><td><code>${t.criterion}</code></td><td><code>${t.feature ?? '-'}</code></td><td>${t.suite}</td><td><span class="pill ${t.status === 'pass' ? 'built' : 'not-built'}">${t.status}</span></td></tr>`).join('\n')}
</tbody></table></section>
<section><h2>Every feature</h2><table><thead><tr><th>Feature</th><th>Name</th><th>Area</th><th>Phase</th><th>Wave</th><th>State</th><th>ACs</th><th>Tested</th><th>Decision</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><code>${r.id}</code></td><td>${r.name}</td><td><code>${r.area}</code></td><td>${r.phase}</td><td>${r.wave ?? '-'}</td><td><span class="pill ${r.state.replace('built-with-failures', 'not-built')}">${r.state}</span></td><td>${r.criteria}</td><td>${r.criteriaPassing}</td><td>${r.heldBy.join(' / ') || '-'}</td></tr>`).join('\n')}
</tbody></table></section>
</main></body></html>
`;
writeFileSync(join(ROOT, 'trace', 'coverage.html'), html);

// a copy the running prototype can fetch at /trace/trace.json
const publicDir = join(ROOT, 'packages', 'web', 'public', 'trace');
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'trace.json'), `${JSON.stringify(trace, null, 2)}\n`);

console.log('trace written:');
console.log(`  trace/trace.json, trace/trace.md, trace/coverage.html`);
console.log(`  features ${totals.features} = built ${totals.built} + partial ${totals.partial} + held ${totals.heldWithDefault} + mocked ${totals.mocked} + not built ${totals.notBuilt} (reconciles: ${totals.reconciles})`);
console.log(`  tests ${totals.criteriaWithTests} AC-named (${totals.testsPassing} pass, ${totals.testsFailing} fail)`);
if (!totals.reconciles || totals.testsFailing > 0) process.exitCode = 1;
