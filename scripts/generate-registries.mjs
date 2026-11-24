#!/usr/bin/env node
// Generates packages/shared/data/*.json from /docs.
// Everything the prototype shows about the product is parsed from the PRD set:
// no requirement, ID, phase, rule or acceptance criterion is typed by hand here.
//
//   node scripts/generate-registries.mjs
//
// Sources
//   docs/prd/01-product-prd.md          L1: Appendix A, sections 3.3, 6.5-6.7, 7
//   docs/prd/modules/PRD-<AREA>.md      L2: feature specs, rules, state models, screens, messages, settings
//   docs/client/Client-PRD.md           plain-language feature content and key journeys
//   docs/compliance/Compliance-Traceability.md   KTDA 95 / Malawi Post 411 requirement traceability
//   docs/register/Decisions-Gaps-Register.md     decision log and gap register

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseTables, section, blocksByHeading, bulletsAfter, inlineField, kvTable, splitList, uniq,
} from './lib/md.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const OUT = join(ROOT, 'packages', 'shared', 'data');
// Normalise CRLF on read: a Windows checkout otherwise leaves \r on every line, which stops the
// heading and section regexes matching (in a JS regex "." does not match \r).
const read = (p) => readFileSync(join(DOCS, p), 'utf8').replace(/\r\n?/g, '\n');
const warnings = [];
const warn = (m) => { warnings.push(m); };

const L1 = read('prd/01-product-prd.md');
const CLIENT = read('client/Client-PRD.md');
const COMPLIANCE = read('compliance/Compliance-Traceability.md');
const REGISTER = read('register/Decisions-Gaps-Register.md');
const ROADMAP = (() => {
  try { return read('roadmap/priority-and-category.md'); } catch { return ''; }
})();
const WORKING_GROUPS = (() => {
  try { return read('roadmap/working-groups.md'); } catch { return ''; }
})();
const MPC_CATALOGUE = (() => {
  try { return read('client/MPC-Lot1-FR-Catalogue.md'); } catch { return ''; }
})();
const MODULE_FILES = readdirSync(join(DOCS, 'prd/modules')).filter((f) => f.endsWith('.md')).sort();
const MODULES = Object.fromEntries(MODULE_FILES.map((f) => [f.slice(4, -3), read(`prd/modules/${f}`)]));

// ---------------------------------------------------------------- areas -----
// L1 section 7 header table: Code | Area | Features | P1 | P2 | P3 | Module PRD
// L1 section 6.7: Area | Configuration | Licensed plugin | Code-level | External system | Total
const AREA_ORDER = [];
function buildAreas() {
  const s7 = section(L1, /^7\.\s+Functional scope by module/);
  const t = parseTables(s7)[0];
  const fitTable = parseTables(section(L1, /^6\.7\s+Implementation fit by area/))[0];
  const fit = {};
  for (const r of fitTable.rows) {
    if (!r.Area || r.Area === 'Total') continue;
    fit[r.Area] = {
      configuration: Number(r.Configuration) || 0,
      licensedPlugin: Number(r['Licensed plugin']) || 0,
      codeLevel: Number(r['Code-level']) || 0,
      externalSystem: Number(r['External system']) || 0,
    };
  }
  // handoff section 5.2 build waves
  const waves = {
    1: ['PLT', 'IAM', 'SEC', 'ADM'],
    2: ['CAT', 'INV', 'SRC', 'SEL'],
    3: ['CHK', 'PAY', 'ORD'],
    4: ['LOG', 'TRK', 'RET', 'DOC'],
    5: ['CRM', 'MKT', 'RPT'],
    6: ['CHN', 'INT', 'AI'],
    7: ['FIN', 'EGV', 'SVC'],
  };
  const waveOf = {};
  const waveName = {
    1: 'Foundation', 2: 'Catalogue', 3: 'Buy', 4: 'Fulfil', 5: 'Engage and run', 6: 'Reach', 7: 'Verticals',
  };
  for (const [w, codes] of Object.entries(waves)) codes.forEach((c) => { waveOf[c] = Number(w); });

  const areas = [];
  for (const r of t.rows) {
    const code = r.Code;
    if (!code || code === '' || r.Area === 'Total') continue;
    AREA_ORDER.push(code);
    areas.push({
      code,
      name: r.Area,
      features: Number(r.Features) || 0,
      p1: Number(r.P1) || 0,
      p2: Number(r.P2) || 0,
      p3: Number(r.P3) || 0,
      modulePrd: `docs/prd/modules/PRD-${code}.md`,
      fit: fit[code] || null,
      wave: waveOf[code] || null,
      waveName: waveName[waveOf[code]] || null,
    });
  }
  return areas;
}

// ------------------------------------------------------------- features -----
// L1 Appendix A tables: PRD ID | Feature | Page | Phase | Implementation | Code change | Pack | Depends on | On hold
function appendixA() {
  const app = section(L1, /^Appendix A\. Feature index/);
  const out = new Map();
  for (const t of parseTables(app)) {
    if (!t.headers.includes('PRD ID')) continue;
    for (const r of t.rows) {
      const id = r['PRD ID'];
      if (!/^PRD-[A-Z]+-\d{3}$/.test(id)) continue;
      out.set(id, {
        id,
        area: id.split('-')[1],
        name: r.Feature,
        phase: r.Phase,
        implementation: r.Implementation,
        codeChange: r['Code change'] || '',
        pack: r.Pack || '',
        dependsOn: (r['Depends on'] || '').split(',').map((x) => x.trim()).filter((x) => /^PRD-/.test(x)),
        onHold: (r['On hold'] || '').trim(),
      });
    }
  }
  return out;
}

// Client-PRD section 7 blocks: ### PRD-XXX-nnn <name>
function clientFeatureContent() {
  const s7 = section(CLIENT, /^7\.\s+Product capabilities/);
  const blocks = blocksByHeading(s7, 3, /^(PRD-[A-Z]+-\d{3})\b/);
  const out = new Map();
  for (const b of blocks) {
    const kv = kvTable(parseTables(b.body).find((t) => /Key facts/.test(t.headers.join('|'))));
    // the summary paragraph is the first non-empty, non-table line after the key-facts table
    const lines = b.body.split('\n');
    let summary = '';
    let seenTable = false;
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('|')) { seenTable = true; continue; }
      if (!seenTable || t === '' || t.startsWith('**')) continue;
      summary = t;
      break;
    }
    out.set(b.id, {
      clientTitle: b.title,
      summary,
      keyFacts: kv,
      whoUsesIt: inlineField(b.body, 'Who uses it'),
      whatItDoes: bulletsAfter(b.body, 'What it does'),
      rules: bulletsAfter(b.body, 'Rules'),
      benefit: inlineField(b.body, 'Benefit'),
    });
  }
  return out;
}

// Module chapters section 7.x: ### 7.n PRD-XXX-nnn <name> with an Item|Value table, stories and ACs
function moduleFeatureContent() {
  const features = new Map();
  const stories = [];
  const criteria = [];
  for (const [area, md] of Object.entries(MODULES)) {
    const specs = section(md, /^7\.\s+Feature specifications/);
    const blocks = blocksByHeading(specs, 3, /^7\.\d+\s+(PRD-[A-Z]+-\d{3})\b/);
    for (const b of blocks) {
      const tables = parseTables(b.body);
      const kv = kvTable(tables.find((t) => t.headers[0] === 'Item'));
      features.set(b.id, {
        description: kv['Description (baseline)'] || '',
        whyItMatters: kv['Why it matters'] || '',
        whoBenefits: kv['Who benefits'] || '',
        nativeCapability: kv['nopCommerce 5.00 capability'] || kv['Native capability'] || '',
        buildScope: kv['Build scope'] || '',
        status: kv.Status || '',
        businessRules: splitList((inlineField(b.body, 'Business rules applied') || '').replace(/\(§[^)]*\)/g, '')),
      });
      const storyTable = tables.find((t) => t.headers.includes('Story') && t.headers.includes('Basis'));
      if (storyTable) {
        for (const r of storyTable.rows) {
          if (!/^US-/.test(r.ID || '')) continue;
          stories.push({
            id: r.ID, feature: b.id, area, story: r.Story, basis: r.Basis, readiness: r.Readiness || '',
          });
        }
      }
      const acTable = tables.find((t) => t.headers.includes('Criterion'));
      if (acTable) {
        for (const r of acTable.rows) {
          if (!/^AC-/.test(r.ID || '')) continue;
          criteria.push({
            id: r.ID, story: r.Story, feature: b.id, area, criterion: r.Criterion, basis: r.Basis || '',
          });
        }
      }
      // Use-case format (PRD-IAM): "**Use case US-...**" + an Attribute|Description table whose
      // "Acceptance Criteria" cell holds "**AC-...** - criterion. Basis: ..." joined by <br>.
      for (const t of tables) {
        if (t.headers[0] !== 'Attribute') continue;
        const kvUc = kvTable(t);
        const usId = (kvUc['Use Case ID'] || '').trim();
        if (!/^US-/.test(usId)) continue;
        if (!stories.some((s) => s.id === usId)) {
          stories.push({
            id: usId,
            feature: b.id,
            area,
            story: kvUc['User Story'] || '',
            basis: (/Story basis:\s*([^<]*)/.exec(kvUc.Notes || '') || [, ''])[1].trim(),
            readiness: kvUc.Readiness || '',
            useCaseName: kvUc['Use Case Name'] || '',
            actors: (kvUc['Actor(s)'] || '').split('<br>').map((x) => x.replace(/^•\s*/, '').trim()).filter(Boolean),
            preconditions: (kvUc.Preconditions || '').split('<br>').map((x) => x.replace(/^•\s*/, '').trim()).filter(Boolean),
            trigger: kvUc.Trigger || '',
            basicFlow: (kvUc['Basic Flow'] || '').split('<br>').map((x) => x.trim()).filter(Boolean),
            exceptionFlow: (kvUc['Exception Flow'] || '').split('<br>').map((x) => x.replace(/^•\s*/, '').trim()).filter(Boolean),
            postconditions: (kvUc.Postconditions || '').split('<br>').map((x) => x.replace(/^•\s*/, '').trim()).filter(Boolean),
          });
        }
        for (const chunk of (kvUc['Acceptance Criteria'] || '').split('<br>')) {
          const m = /^\*\*(AC-[A-Z]+-\d{3}-\d{2}-\d{2})\*\*\s*[—-]\s*([\s\S]*)$/.exec(chunk.trim());
          if (!m) continue;
          if (criteria.some((c) => c.id === m[1])) continue;
          const body = m[2].trim();
          const basisM = /\sBasis:\s*(.*)$/.exec(body);
          criteria.push({
            id: m[1],
            story: usId,
            feature: b.id,
            area,
            criterion: basisM ? body.slice(0, basisM.index).trim() : body,
            basis: basisM ? basisM[1].trim() : '',
          });
        }
      }
    }
  }
  return { features, stories, criteria };
}

function buildFeatures(areas) {
  const base = appendixA();
  const client = clientFeatureContent();
  const { features: mod, stories, criteria } = moduleFeatureContent();
  const acByFeature = {};
  for (const c of criteria) (acByFeature[c.feature] ||= []).push(c.id);
  const usByFeature = {};
  for (const s of stories) (usByFeature[s.feature] ||= []).push(s.id);
  const areaByCode = Object.fromEntries(areas.map((a) => [a.code, a]));

  const out = [];
  for (const [id, f] of base) {
    const c = client.get(id) || {};
    const m = mod.get(id) || {};
    if (!client.has(id)) warn(`no Client-PRD section for ${id}`);
    if (!mod.has(id)) warn(`no module chapter section for ${id}`);
    out.push({
      ...f,
      clientName: c.clientTitle || f.name,
      summary: c.summary || m.description || '',
      description: m.description || '',
      whyItMatters: m.whyItMatters || '',
      whoBenefits: m.whoBenefits || c.whoUsesIt || '',
      whoUsesIt: c.whoUsesIt || '',
      whatItDoes: c.whatItDoes || [],
      clientRules: c.rules || [],
      benefit: c.benefit || '',
      status: m.status || '',
      businessRules: m.businessRules || [],
      availability: (c.keyFacts || {}).Availability || '',
      stories: usByFeature[id] || [],
      criteria: acByFeature[id] || [],
      wave: (areaByCode[f.area] || {}).wave || null,
      external: /External system/i.test(f.implementation),
      licensed: /Licensed plugin/i.test(f.implementation),
      configuration: /^Configuration/i.test(f.implementation),
      codeLevel: /Code-level/i.test(f.implementation),
    });
  }
  out.sort((a, b) => AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area) || a.id.localeCompare(b.id));
  return { features: out, stories, criteria };
}

// ----------------------------------------------------- rules, states, etc ---
function buildRules() {
  const rules = [];
  const states = [];
  const screens = [];
  const messages = [];
  const settings = [];
  const packRows = [];
  const contracts = [];
  const audits = [];
  const actors = [];
  const permissions = [];

  // "CAT-002 to CAT-042", "AI-001 - AI-010" and "FIN-001-FIN-003" are ranges in the PRD tables
  const expandFeatures = (cell) => {
    const out = [];
    for (const part of splitList(cell)) {
      const range = /^([A-Z]+)-(\d{3})\s*(?:to|through|[–—-])\s*(?:[A-Z]+-)?(\d{3})$/.exec(part.replace(/^PRD-/, ''));
      if (range) {
        const [, area, a, b] = range;
        for (let n = Number(a); n <= Number(b); n += 1) out.push(`PRD-${area}-${String(n).padStart(3, '0')}`);
        continue;
      }
      const single = /^(?:PRD-)?([A-Z]+-\d{3})$/.exec(part);
      if (single) out.push(`PRD-${single[1]}`);
    }
    return uniq(out);
  };

  const surfaceOf = (areaCell) => {
    const a = areaCell.toLowerCase();
    if (a.startsWith('storefront')) return 'Storefront';
    if (a.startsWith('admin')) return 'Admin';
    if (a.includes('seller')) return 'Seller portal';
    if (a.includes('outlet') || a.includes('agent') || a.includes('counter')) return 'Outlet / agent';
    if (a.includes('mobile') || a.includes('field') || a.includes('courier')) return 'Mobile / field';
    if (a.includes('external') || a.includes('gateway') || a.includes('bi ') || a.includes('bi platform')) return 'External';
    if (a.includes('public')) return 'Public';
    if (a.includes('chat')) return 'Admin';
    if (a.includes('help desk')) return 'Admin';
    return 'Other';
  };

  for (const [area, md] of Object.entries(MODULES)) {
    const actorsSection = section(md, /^4\.\s+Actors and permissions/);
    for (const t of parseTables(actorsSection)) {
      if (t.headers.includes('Actor')) {
        for (const r of t.rows) {
          if (!r.Actor) continue;
          actors.push({
            area,
            actor: r.Actor,
            doesWhat: r['What they do in this module'] || '',
            nopRole: r['Role in nopCommerce'] || '',
            system: /\(system\)/i.test(r.Actor) || /Internal services/i.test(r['Role in nopCommerce'] || ''),
          });
        }
      }
      if (t.headers.some((h) => /^Permission/.test(h))) {
        const permHeader = t.headers.find((h) => /^Permission/.test(h));
        for (const r of t.rows) {
          const systemName = (r[permHeader] || '').trim();
          if (!systemName) continue;
          permissions.push({
            area,
            systemName: systemName.replace(/\s*\(native\)\s*/g, '').trim(),
            raw: systemName,
            native: /\(native\)/.test(systemName),
            category: r.Category || '',
            allows: r.Allows || '',
            defaultRoles: splitList((r['Default roles'] || '').replace(/\([^)]*\)/g, '')),
          });
        }
      }
    }
    for (const t of parseTables(section(md, /^8\.1\s+Business rules/))) {
      if (!t.headers.includes('Rule')) continue;
      for (const r of t.rows) {
        if (!/^BR-/.test(r.ID || '')) continue;
        rules.push({
          id: r.ID, area, rule: r.Rule, features: expandFeatures(r.Features), basis: r.Basis || '',
        });
      }
    }
    for (const t of parseTables(section(md, /^8\.2\s+State models/))) {
      if (!t.headers.includes('Event')) continue;
      for (const r of t.rows) {
        if (!/^SM-/.test(r.Model || '')) continue;
        states.push({
          model: r.Model, area, entity: r.Entity, from: r.From, event: r.Event,
          guard: r.Guard || '', to: r.To, sideEffect: r['Side effect'] || '',
        });
      }
    }
    for (const t of parseTables(section(md, /^11\.1\s+Screens/))) {
      if (!t.headers.includes('Screen')) continue;
      for (const r of t.rows) {
        if (!r.Screen) continue;
        const features = expandFeatures(r.Features);
        screens.push({
          id: `SCR-${area}-${String(screens.filter((s) => s.area === area).length + 1).padStart(2, '0')}`,
          area,
          surface: surfaceOf(r.Area || ''),
          surfaceLabel: r.Area || '',
          screen: r.Screen,
          features,
          nativeOrNew: r['Native or new'] || '',
          native: /native/i.test(r['Native or new'] || ''),
        });
      }
    }
    for (const t of parseTables(section(md, /^11\.2\s+User-facing messages/))) {
      if (!t.headers.includes('Key')) continue;
      for (const r of t.rows) {
        if (!r.Key) continue;
        messages.push({
          key: r.Key, area, text: r[t.headers[1]] || '', usedBy: splitList(r['Used by']),
        });
      }
    }
    for (const t of parseTables(section(md, /^10\.2\s+Settings and client values/))) {
      if (!t.headers.includes('Setting')) continue;
      for (const r of t.rows) {
        if (!r.Setting) continue;
        settings.push({
          area, setting: r.Setting, whereItLives: r['Where it lives'] || '', layer: r.Layer || '',
          ktda: r['KTDA (source)'] || '', mpc: r['Malawi Post (source)'] || '',
        });
      }
    }
    for (const t of parseTables(section(md, /^10\.1\s+Configuration-pack rows/))) {
      if (!t.headers.includes('Artefact')) continue;
      for (const r of t.rows) {
        if (!r.Artefact) continue;
        packRows.push({
          area, artefact: r.Artefact, source: r['nopCommerce 5.00 source'] || '',
          layers: r.Layers || '', owningPrd: r['Owning PRD'] || '', pack: r.Pack || '',
        });
      }
    }
    for (const t of parseTables(section(md, /^12\.2\s+Interface contracts/))) {
      for (const r of t.rows) {
        const id = r.ID || r.Contract || '';
        if (!/^IC-/.test(id)) continue;
        contracts.push({ id, area, ...Object.fromEntries(t.headers.map((h, i) => [h, r._cells[i] || ''])) , _cells: undefined });
      }
    }
    for (const t of parseTables(section(md, /^14\.2\s+Audit event catalogue/))) {
      for (const r of t.rows) {
        const id = r.ID || r['Event'] || '';
        if (!/^AUD-/.test(id)) continue;
        audits.push({ id, area, event: r.Event || '', entity: r.Entity || '', features: splitList(r.Features || '') });
      }
    }
  }
  return {
    rules, states, screens, messages, settings, packRows, contracts, audits, actors, permissions,
  };
}

// ---------------------------------------------------------------- holds -----
function buildHolds() {
  const s = section(L1, /^3\.3\s+Conditional scope/);
  const tables = parseTables(s);
  const holdsTable = tables.find((t) => t.headers.includes('Features held'));
  const readyTable = tables.find((t) => t.headers.includes('Features affected'));
  const holds = [];
  const readiness = [];
  if (holdsTable) {
    for (const r of holdsTable.rows) {
      if (!r.Decision) continue;
      const viaDep = {};
      for (const m of (r['Of which held through a dependency (feature → held feature it depends on)'] || '').matchAll(/([A-Z]+-\d{3})\s*→\s*([A-Z]+-\d{3})/g)) {
        viaDep[`PRD-${m[1]}`] = `PRD-${m[2]}`;
      }
      holds.push({
        decision: r.Decision,
        features: splitList(r['Features held']).map((f) => `PRD-${f}`),
        heldThroughDependency: viaDep,
        type: r.Type || '',
        owner: r.Owner || '',
        ifNotConfirmed: r['If not confirmed'] || '',
      });
    }
  }
  if (readyTable) {
    for (const r of readyTable.rows) {
      if (!r.Decision) continue;
      readiness.push({
        decision: r.Decision,
        kind: r.Kind || '',
        features: splitList(r['Features affected']).map((f) => (/^PRD-/.test(f) ? f : `PRD-${f}`)).filter((f) => /^PRD-[A-Z]+-\d{3}/.test(f)),
        owner: r['Owner (decision log)'] || '',
      });
    }
  }
  return { holds, readiness };
}

// ------------------------------------------------------------ decisions -----
function buildDecisions() {
  const log = parseTables(section(REGISTER, /^1\.1\s+Decision log/))[0];
  const decisions = (log ? log.rows : []).filter((r) => r.ID).map((r) => ({
    id: r.ID, item: r.Item, source: r.Source || '', status: r['Status / owner'] || '',
    open: /^open|^deferred/i.test(r['Status / owner'] || ''),
  }));
  const gapTable = parseTables(section(REGISTER, /^5\.1\s+Gap register/))[0];
  const gaps = (gapTable ? gapTable.rows : []).filter((r) => r.ID).map((r) => ({
    id: r.ID, topic: r.Topic, question: r['Question (not stated in source)'] || '',
    source: r['Source reference'] || '', affects: splitList(r['Affected PRD IDs'] || ''),
  }));
  return { decisions, gaps };
}

// ------------------------------------------- Malawi Post Lot 1 catalogue ----
// The client's own annex adds four fields the compliance report does not carry: the actor,
// the client's 14-domain grouping, the client's acceptance criteria and the client's MoSCoW
// priority - plus the bidder response already given to Malawi Post. Joined on FR-nnn, which is
// the same numbering as REQ-MPC-FR-nnn.
function buildMpcCatalogue() {
  if (!MPC_CATALOGUE) return {};
  const table = parseTables(MPC_CATALOGUE).find((t) => t.headers.includes('Shall statement'));
  if (!table) return {};
  const out = {};
  for (const r of table.rows) {
    if (!/^FR-\d{3}$/.test(r['Req ID'] || '')) continue;
    out[`REQ-MPC-${r['Req ID']}`] = {
      frId: r['Req ID'],
      actor: r.Actor,
      domain: r.Domain,
      clientPriority: r.Priority,
      shall: r['Shall statement'],
      rationale: r.Rationale,
      clientAcceptanceCriteria: (r['Acceptance criteria'] || '')
        .split(/(?=\d+\.\s)/).map((x) => x.trim()).filter(Boolean),
      bidderResponse: r['Bidder response'],
      bidderNote: r['Bidder note'] || '',
      bidderComments: r['Bidder comments'] || '',
    };
  }
  return out;
}

// --------------------------------------------------------- requirements -----
function buildRequirements() {
  const out = [];
  for (const [client, re] of [['KTDA', /^4\.1\s+KTDA requirement traceability/], ['MPC', /^4\.2\s+Malawi Post requirement traceability/]]) {
    const t = parseTables(section(COMPLIANCE, re))[0];
    if (!t) { warn(`requirement traceability table not found for ${client}`); continue; }
    for (const r of t.rows) {
      const id = r.Requirement;
      if (!/^REQ-/.test(id || '')) continue;
      out.push({
        id,
        client,
        area: r.Area || '',
        text: r['Requirement (source text)'] || '',
        status: r.Status || '',
        features: (r['P1 features'] || '').split(',').map((x) => x.trim()).filter((x) => /^PRD-/.test(x)),
        notes: r['Implementation / notes'] || '',
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- packs -----
function buildPacks() {
  const cfg = parseTables(section(L1, /^6\.5\s+Configuration model/))[0];
  const artefacts = (cfg ? cfg.rows : []).filter((r) => r['Configurable artefact']).map((r) => ({
    artefact: r['Configurable artefact'],
    source: r['nopCommerce 5.00.1 source (setting key / entity / file)'] || r[Object.keys(r)[1]] || '',
    layers: (r.Layers || '').split('→').map((x) => x.trim()).filter(Boolean),
    owningPrd: r['Owning PRD'] || '',
    pack: r.Pack || '',
  }));
  const tiersAndPacks = parseTables(section(L1, /^6\.6\s+Reuse tiers and packs/));
  const tiers = (tiersAndPacks[0] ? tiersAndPacks[0].rows : []).filter((r) => r['Reuse tier'] && r['Reuse tier'] !== 'Total')
    .map((r) => ({ tier: r['Reuse tier'], features: Number(r.Features) || 0 }));
  const packs = (tiersAndPacks[1] ? tiersAndPacks[1].rows : []).filter((r) => r.Pack && r.Pack !== 'Total')
    .map((r) => ({ pack: r.Pack, features: Number(r.Features) || 0 }));
  const rules = (parseTables(section(L1, /^6\.5\s+Configuration model/))[1] || { rows: [] }).rows
    .filter((r) => r.Decision).map((r) => ({
      decision: r.Decision, rule: r['Configuration rule'] || '', mechanism: r['Setting / mechanism (5.00.1)'] || '',
    }));
  return { artefacts, tiers, packs, configurationRules: rules };
}

// ------------------------------------------------------------- journeys -----
function buildJourneys() {
  const s6 = section(CLIENT, /^6\.\s+Key user journeys/);
  const out = [];
  const lines = s6.split('\n');
  let cur = null;
  for (const line of lines) {
    const h = /^##\s+6\.(\d+)\s+(.*)$/.exec(line);
    if (h) {
      if (cur) out.push(cur);
      cur = { n: Number(h[1]), title: h[2], steps: [] };
      continue;
    }
    if (cur && line.trim().startsWith('- ')) cur.steps.push(line.trim().slice(2));
  }
  if (cur) out.push(cur);
  return out.map((j, i) => ({ id: `JRN-${String(i + 1).padStart(2, '0')}`, area: AREA_ORDER[i] || null, ...j }));
}

// ----------------------------------------------------------- roles, nfr -----
function buildRoles() {
  const t = parseTables(section(L1, /^5\.2\s+Who the features serve/))[0];
  return (t ? t.rows : []).filter((r) => r['Beneficiary group']).map((r) => ({
    group: r['Beneficiary group'], features: Number(r['Features naming it']) || 0,
  }));
}

function buildChannels() {
  const t = parseTables(section(L1, /^5\.1\s+Channels/))[0];
  return (t ? t.rows : []).filter((r) => r.Channel && r.Channel !== 'Total').map((r) => ({
    channel: r.Channel, features: Number(r.Features) || 0,
  }));
}

function buildNfr() {
  const out = [];
  for (const t of parseTables(section(L1, /^8\.3\s+Cross-cutting requirements/))) {
    for (const r of t.rows) {
      const id = r.ID || r['NFR ID'] || '';
      if (!/^NFR-/.test(id)) continue;
      out.push({ id, ...Object.fromEntries(t.headers.map((h, i) => [h, r._cells[i] || ''])), _cells: undefined });
    }
  }
  return out;
}

function buildDoD() {
  const t = parseTables(section(L1, /^11\.2\s+Definition of Done/))[0];
  return (t ? t.rows : []).filter((r) => r['#'] || r.Area).map((r) => ({
    n: r['#'] || '', area: r.Area || '', criterion: r[t.headers[2]] || '', basis: r[t.headers[3]] || '',
  })).filter((r) => r.criterion);
}

function buildCoreMods() {
  const t = parseTables(section(L1, /^6\.3\s+Register of features that involve a nopCommerce core modification/))[0];
  return (t ? t.rows : []).filter((r) => r._cells && r._cells.length > 1 && /PRD-|[A-Z]{3}-\d{3}/.test(r._cells.join(' ')))
    .map((r) => Object.fromEntries(t.headers.map((h, i) => [h, r._cells[i] || ''])));
}

function buildExternalSystems() {
  const t = parseTables(section(L1, /^6\.9\s+External systems register/))[0];
  return (t ? t.rows : []).filter((r) => r._cells && r._cells[0]).map((r) => Object.fromEntries(t.headers.map((h, i) => [h, r._cells[i] || ''])));
}

function buildLicensed() {
  const t = parseTables(section(L1, /^6\.8\s+Licensed plugin register/))[0];
  return (t ? t.rows : []).filter((r) => r._cells && r._cells[0]).map((r) => Object.fromEntries(t.headers.map((h, i) => [h, r._cells[i] || ''])));
}

// ------------------------------------------------------------- roadmap ------
// The Product Feature List workbook adds three fields on top of the backlog: the MoSCoW
// priority, the category grouping of the 24 modules, and the Phase 3 capability type.
// docs/roadmap/priority-and-category.md carries them, plus its change log from the 4.90 edition.
function buildRoadmap() {
  if (!ROADMAP) {
    return {
      priority: {}, category: {}, capabilityType: {}, changes: [], roadmapRow: {},
    };
  }
  const tables = parseTables(ROADMAP);
  const priority = {};
  const category = {};
  const roadmapRow = {};
  const capabilityType = {};
  const changes = [];
  for (const t of tables) {
    if (t.headers.includes('Priority') && t.headers.includes('Category')) {
      for (const r of t.rows) {
        if (!/^PRD-/.test(r.Feature || '')) continue;
        priority[r.Feature] = r.Priority;
        category[r.Feature] = r.Category;
        if (r['Roadmap row']) roadmapRow[r.Feature] = Number(r['Roadmap row']);
      }
    }
    if (t.headers.includes('Capability type')) {
      for (const r of t.rows) {
        if (/^PRD-/.test(r.Feature || '')) capabilityType[r.Feature] = r['Capability type'];
      }
    }
    if (t.headers.includes('Field') && t.headers.includes('Reason')) {
      for (const r of t.rows) {
        if (!/^PRD-/.test(r.Feature || '')) continue;
        changes.push({
          feature: r.Feature,
          name: r.Name,
          field: r.Field,
          oldValue: r['Old value (4.90)'],
          newValue: r['New value (5.00)'],
          reason: r.Reason,
        });
      }
    }
  }
  return {
    priority, category, capabilityType, changes, roadmapRow,
  };
}

// ------------------------------------------------- working role groups ------
// The product mapping diagram's four clusters and fifteen groups. A feature belongs to a group
// when its Client-PRD "Who uses it" list names one of the group's role names. The counts overlap
// on purpose and do not sum to 434. The grouping is a reading aid, not a client source.
function buildWorkingGroups() {
  if (!WORKING_GROUPS) return [];
  const table = parseTables(WORKING_GROUPS).find((t) => t.headers.includes('Diagram count'));
  if (!table) return [];
  const usersOf = (f) => (f.whoUsesIt || '').split(';').map((x) => x.trim().toLowerCase()).filter(Boolean);
  return table.rows.filter((r) => r.Group).map((r) => {
    const names = r['Role names in the "Who uses it" list'].split(';').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const members = features.filter((f) => usersOf(f).some((u) => names.includes(u)));
    const diagramCount = Number(r['Diagram count']) || 0;
    const actual = members.length;
    if (actual !== diagramCount) {
      warn(`working group "${r.Group}": diagram says ${diagramCount}, the registry gives ${actual}`);
    }
    return {
      id: r.Group.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase(),
      cluster: r.Cluster,
      group: r.Group,
      diagramCount,
      count: actual,
      matchesDiagram: actual === diagramCount,
      confirmed: /yes/i.test(r.Confirmed || ''),
      roleNames: names,
      features: members.map((f) => f.id),
      phases: {
        P1: members.filter((f) => f.phase === 'P1').length,
        P2: members.filter((f) => f.phase === 'P2').length,
        P3: members.filter((f) => f.phase === 'P3').length,
      },
      priorities: {
        'Must Have': members.filter((f) => f.priority === 'Must Have').length,
        'Should Have': members.filter((f) => f.priority === 'Should Have').length,
        'Could Have': members.filter((f) => f.priority === 'Could Have').length,
      },
      held: members.filter((f) => f.held).length,
      criteria: members.reduce((s2, f) => s2 + f.criteria.length, 0),
      areas: [...new Set(members.map((f) => f.area))].sort(),
      waves: [...new Set(members.map((f) => f.wave))].filter(Boolean).sort(),
    };
  });
}

// ----------------------------------------------------------------- main -----
const areas = buildAreas();
const { features, stories, criteria } = buildFeatures(areas);
const {
  rules, states, screens, messages, settings, packRows, contracts, audits, actors, permissions,
} = buildRules();
const { holds, readiness } = buildHolds();
const { decisions, gaps } = buildDecisions();
const requirements = buildRequirements();
const mpcCatalogue = buildMpcCatalogue();
for (const r of requirements) {
  const extra = mpcCatalogue[r.id];
  if (extra) Object.assign(r, extra);
}
const packs = buildPacks();
const journeys = buildJourneys();
const roadmap = buildRoadmap();

// hold / readiness flags onto the features (P-1: build the Proposed option, label the decision)
const heldBy = {};
for (const h of holds) for (const f of h.features) (heldBy[f] ||= []).push(h.decision);
const readyBy = {};
for (const r of readiness) for (const f of r.features) (readyBy[f] ||= []).push(r.decision);
for (const f of features) {
  f.heldBy = uniq([...(f.onHold ? [f.onHold] : []), ...(heldBy[f.id] || [])]);
  f.readinessConditions = uniq(readyBy[f.id] || []);
  f.held = f.heldBy.length > 0;
  f.prototypeDefaultLabel = f.held
    ? `Prototype default — decision ${f.heldBy.join(' / ')} pending`
    : null;
}
// roadmap fields onto the features (MoSCoW priority, category, Phase 3 capability type)
for (const f of features) {
  f.priority = roadmap.priority[f.id] ?? null;
  f.category = roadmap.category[f.id] ?? null;
  f.capabilityType = roadmap.capabilityType[f.id] ?? null;
  // the row of the "Product Features" sheet in Product_Feature_List_nopCommerce_5.00.xlsx
  f.roadmapRow = roadmap.roadmapRow[f.id] ?? null;
  if (roadmap.priority[f.id] === undefined && ROADMAP) warn(`no roadmap priority for ${f.id}`);
}

// requirement coverage onto the features
const reqByFeature = {};
for (const r of requirements) for (const f of r.features) (reqByFeature[f] ||= []).push(r.id);
for (const f of features) f.requirements = uniq(reqByFeature[f.id] || []);
// screens onto the features
const scrByFeature = {};
for (const s of screens) for (const f of s.features) (scrByFeature[f] ||= []).push(s.id);
for (const f of features) f.screens = uniq(scrByFeature[f.id] || []);

const workingGroups = buildWorkingGroups();

const meta = {
  generated: new Date().toISOString(),
  generator: 'scripts/generate-registries.mjs',
  sources: [
    'docs/prd/01-product-prd.md',
    'docs/prd/modules/PRD-<AREA>.md (24)',
    'docs/client/Client-PRD.md',
    'docs/compliance/Compliance-Traceability.md',
    'docs/register/Decisions-Gaps-Register.md',
  ],
  counts: {
    areas: areas.length,
    features: features.length,
    stories: stories.length,
    criteria: criteria.length,
    rules: rules.length,
    stateTransitions: states.length,
    screens: screens.length,
    messages: messages.length,
    settings: settings.length,
    requirements: requirements.length,
    decisions: decisions.length,
    gaps: gaps.length,
    holdDecisions: holds.length,
    readinessConditions: readiness.length,
    held: features.filter((f) => f.held).length,
    contracts: contracts.length,
    audits: audits.length,
    actors: actors.length,
    permissions: permissions.length,
    mustHave: features.filter((f) => f.priority === 'Must Have').length,
    shouldHave: features.filter((f) => f.priority === 'Should Have').length,
    couldHave: features.filter((f) => f.priority === 'Could Have').length,
    roadmapChanges: roadmap.changes.length,
    mpcLot1Requirements: Object.keys(mpcCatalogue).length,
    workingGroups: workingGroups.length,
    workingGroupsMatchingDiagram: workingGroups.filter((g) => g.matchesDiagram).length,
  },
};

mkdirSync(OUT, { recursive: true });
const write = (name, data) => {
  writeFileSync(join(OUT, name), `${JSON.stringify(data, null, 2)}\n`);
  const n = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`  ${name.padEnd(24)} ${n}`);
};
console.log('generated registries:');
write('meta.json', meta);
write('areas.json', areas);
write('features.json', features);
write('stories.json', stories);
write('criteria.json', criteria);
write('rules.json', rules);
write('states.json', states);
write('screens.json', screens);
write('messages.json', messages);
write('settings.json', settings);
write('pack-rows.json', packRows);
write('packs.json', packs);
write('holds.json', { holds, readiness });
write('decisions.json', { decisions, gaps });
write('requirements.json', requirements);
write('journeys.json', journeys);
write('roles.json', buildRoles());
write('channels.json', buildChannels());
write('nfr.json', buildNfr());
write('definition-of-done.json', buildDoD());
write('core-modifications.json', buildCoreMods());
write('external-systems.json', buildExternalSystems());
write('licensed-plugins.json', buildLicensed());
write('contracts.json', contracts);
write('audit-events.json', audits);
write('actors.json', actors);
write('permissions.json', permissions);
write('roadmap-changes.json', roadmap.changes);
write('working-groups.json', workingGroups);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 20)) console.log(`  ! ${w}`);
  if (warnings.length > 20) console.log(`  ... ${warnings.length - 20} more`);
}
console.log('\ncounts:', JSON.stringify(meta.counts, null, 2));
