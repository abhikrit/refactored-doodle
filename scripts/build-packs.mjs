#!/usr/bin/env node
// Fills the `features` map of every pack from the workbook pack assignment (L1 section 6.6),
// and creates the vertical pack files that do not exist yet. Hand-written settings, content,
// entities and _sources in a pack file are preserved - only `features` and `_packAssignment`
// are rewritten, so the toggles can never drift from /docs.
//
//   node scripts/build-packs.mjs

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const features = JSON.parse(readFileSync(join(ROOT, 'packages/shared/data/features.json'), 'utf8'));

// L1 section 6.6 pack names -> where that pack lives in /packs
const PLACEMENT = {
  'Core (always on)': ['global/global.json'],
  'Core (both clients)': ['global/global.json'],
  'Marketplace pack': ['vertical/marketplace.json'],
  'B2B trade pack': ['vertical/b2b-trade.json'],
  'Postal and logistics pack': ['vertical/postal-logistics.json'],
  'Services and bookings pack': ['vertical/services-bookings.json'],
  'Engagement and loyalty pack': ['vertical/engagement-loyalty.json'],
  'Commerce extensions pack': ['vertical/commerce-extensions.json'],
  'e-Government pack': ['vertical/e-government.json'],
  'AI pack': ['vertical/ai.json'],
  'Analytics pack': ['vertical/analytics.json'],
  'Warehouse pack': ['vertical/warehouse.json'],
  'Channels pack': ['vertical/channels.json'],
  'Agri-finance and schemes pack': ['vertical/agri-finance-schemes.json'],
  'Assisted service pack': ['vertical/assisted-service.json'],
  'Service desk extensions pack': ['vertical/service-desk-extensions.json'],
  'Access and admin extensions pack': ['vertical/access-admin-extensions.json'],
  'Carrier adapter (reusable, Kenya)': ['country/KE.json'],
  'Carrier adapter (reusable)': ['country/KE.json', 'country/MW.json'],
  'Country: Kenya': ['country/KE.json'],
  'Country: Malawi': ['country/MW.json'],
  'Country: Kenya/Malawi': ['country/KE.json', 'country/MW.json'],
  'Client: KTDA': ['client/KTDA.json'],
  'Client: MPC': ['client/MPC.json'],
};

const VERTICAL_META = {
  'vertical/marketplace.json': ['marketplace', 'Marketplace pack', 'Sellers, listings approval, commissions and settlements (SEL, and the marketplace parts of CAT, CHK, PAY).'],
  'vertical/b2b-trade.json': ['b2b-trade', 'B2B trade pack', 'Company accounts, credit terms, price lists, approval limits (IAM-022, CHK-016, CAT-039).'],
  'vertical/postal-logistics.json': ['postal-logistics', 'Postal and logistics pack', 'S10 series, hubs and routes, holding charges, drop-off acceptance (LOG-020, LOG-023, LOG-017).'],
  'vertical/services-bookings.json': ['services-bookings', 'Services and bookings pack', 'Service listings, booking slots, coverage areas (CAT-026, CAT-027, SVC).'],
  'vertical/engagement-loyalty.json': ['engagement-loyalty', 'Engagement and loyalty pack', 'Reward points, promotions, pop-ups, abandoned-cart recovery, affiliates (MKT-002, MKT-003, MKT-012, ORD-028).'],
  'vertical/commerce-extensions.json': ['commerce-extensions', 'Commerce extensions pack', 'Cart restriction rules, return fees, feeds, PayPal enablement (CHK-011, RET-006, CAT-035, PAY-003).'],
  'vertical/e-government.json': ['e-government', 'e-Government pack', 'Agencies, service catalogue, fee schedules (EGV). Held by FG-06 and T-MISS.'],
  'vertical/ai.json': ['ai', 'AI pack', 'AI provider and model per use, translation languages, governance disclosures (AI-001 to AI-010).'],
  'vertical/analytics.json': ['analytics', 'Analytics pack', 'Data warehouse sources, BI connection, dashboard sets, public metrics (RPT-010, RPT-011, RPT-007, RPT-008).'],
  'vertical/warehouse.json': ['warehouse', 'Warehouse pack', 'Warehouses, batch/lot, serial, expiry, cycle counts, WMS/ERP sync (INV-002, INV-009, INV-011, INV-012).'],
  'vertical/channels.json': ['channels', 'Channels pack', 'Mobile app, USSD, IVR, WhatsApp/WeChat/Telegram, push (CHN-001, CHN-003, CHN-004, CHN-006, CHN-013).'],
  'vertical/agri-finance-schemes.json': ['agri-finance-schemes', 'Agri-finance and schemes pack', 'Scheme definitions, eligibility, budgets, partner credit and insurance, disbursement rails (ORD-024, PAY-022, FIN-001 to FIN-004).'],
  'vertical/assisted-service.json': ['assisted-service', 'Assisted service pack', 'Agent roles, outlet assignment, receipt printer profile, cash-up rules (IAM-026, CHK-013, PAY-034).'],
  'vertical/service-desk-extensions.json': ['service-desk-extensions', 'Service desk extensions pack', 'Complaint categories, ADR escalation matrix, support channel directory (CRM-004, CRM-012).'],
  'vertical/access-admin-extensions.json': ['access-admin-extensions', 'Access and admin extensions pack', 'Delegation rules, passwordless and biometric options, guided-tour content (IAM-009, IAM-013, PLT-019).'],
};

const byFile = {};
for (const f of features) {
  for (const target of PLACEMENT[f.pack] ?? []) {
    (byFile[target] ||= []).push(f);
  }
}
const unplaced = features.filter((f) => !PLACEMENT[f.pack]);
if (unplaced.length) {
  console.error(`unknown pack names: ${[...new Set(unplaced.map((f) => f.pack))].join(', ')}`);
  process.exit(1);
}

for (const [rel, meta] of Object.entries(VERTICAL_META)) {
  const file = join(ROOT, 'packs', rel);
  if (existsSync(file)) continue;
  mkdirSync(dirname(file), { recursive: true });
  const [id, name, description] = meta;
  writeFileSync(file, `${JSON.stringify({
    layer: 'vertical', id, name, version: '0.1.0', description, settings: {}, features: {}, content: {}, _sources: {},
  }, null, 2)}\n`);
}

let touched = 0;
for (const [rel, list] of Object.entries(byFile)) {
  const file = join(ROOT, 'packs', rel);
  if (!existsSync(file)) {
    console.error(`missing pack file ${rel} - create it first`);
    process.exit(1);
  }
  const pack = JSON.parse(readFileSync(file, 'utf8'));
  // P-1: a held feature is switched on and carries its prototype-default label; it is not hidden.
  pack.features = Object.fromEntries(list.map((f) => [f.id, true]));
  pack._packAssignment = {
    note: 'generated by scripts/build-packs.mjs from the workbook pack column (L1 section 6.6) - do not edit by hand',
    packNames: [...new Set(list.map((f) => f.pack))],
    count: list.length,
    held: list.filter((f) => f.held).length,
    phases: {
      P1: list.filter((f) => f.phase === 'P1').length,
      P2: list.filter((f) => f.phase === 'P2').length,
      P3: list.filter((f) => f.phase === 'P3').length,
    },
  };
  writeFileSync(file, `${JSON.stringify(pack, null, 2)}\n`);
  touched += 1;
}

const packFiles = [];
for (const layer of ['global', 'country', 'vertical', 'client', 'store']) {
  const dir = join(ROOT, 'packs', layer);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (f.endsWith('.json')) packFiles.push(`${layer}/${f}`);
}
const total = Object.values(byFile).reduce((s, l) => s + l.length, 0);
console.log(`pack files updated: ${touched} of ${packFiles.length}`);
console.log(`feature toggles written: ${total} (434 features, some in two country packs)`);
for (const rel of packFiles.sort()) {
  const p = JSON.parse(readFileSync(join(ROOT, 'packs', rel), 'utf8'));
  console.log(`  ${rel.padEnd(42)} settings ${String(Object.keys(p.settings ?? {}).length).padStart(3)}  features ${String(Object.keys(p.features ?? {}).length).padStart(3)}`);
}
