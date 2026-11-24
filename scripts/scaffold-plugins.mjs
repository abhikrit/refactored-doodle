#!/usr/bin/env node
// Generates the 24 area plugin descriptors (plugin.json) from the registry, and a starter
// index.js for any area that does not have one yet. plugin.json is always overwritten so the
// descriptors stay in step with /docs; index.js is never overwritten, because that is code.
//
//   node scripts/scaffold-plugins.mjs

import {
  mkdirSync, writeFileSync, existsSync, readFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = join(ROOT, 'packages', 'shared', 'data');
const load = (n) => JSON.parse(readFileSync(join(D, n), 'utf8'));

const areas = load('areas.json');
const features = load('features.json');
const screens = load('screens.json');
const contracts = load('contracts.json');
const rules = load('rules.json');
const messages = load('messages.json');
const audits = load('audit-events.json');
const { holds } = load('holds.json');

// handoff section 5.2: wave order; startupOrder follows it so foundation plugins install first
const startupOrder = (wave) => 3000 + (wave - 1) * 100;

let written = 0;
let created = 0;

for (const area of areas) {
  const dir = join(ROOT, 'packages', 'server', 'src', 'plugins', `product-${area.code.toLowerCase()}`);
  mkdirSync(dir, { recursive: true });

  const areaFeatures = features.filter((f) => f.area === area.code);
  const dependsOn = [...new Set(areaFeatures
    .flatMap((f) => f.dependsOn)
    .map((d) => d.split('-')[1])
    .filter((a) => a !== area.code))].sort();

  const descriptor = {
    systemName: `Product.${area.code}`,
    friendlyName: `Product - ${area.name}`,
    area: area.code,
    group: 'Product',
    version: '0.1.0',
    supportedVersions: ['5.00'],
    author: 'Product team',
    displayOrder: areas.findIndex((a) => a.code === area.code) + 1,
    // nopCommerce plugin.json keeps these per plugin; the pack loader writes them and
    // deployment must not overwrite them (L1 section 6.5)
    limitedToStores: [],
    limitedToCustomerRoles: [],
    realBuild: {
      note: 'In the .NET build this is src/Plugins/Nop.Plugin.Product.' + area.code,
      projectName: `Nop.Plugin.Product.${area.code}`,
    },
    wave: area.wave,
    waveName: area.waveName,
    dependsOnAreas: dependsOn,
    counts: {
      features: areaFeatures.length,
      p1: areaFeatures.filter((f) => f.phase === 'P1').length,
      p2: areaFeatures.filter((f) => f.phase === 'P2').length,
      p3: areaFeatures.filter((f) => f.phase === 'P3').length,
      held: areaFeatures.filter((f) => f.held).length,
      criteria: areaFeatures.reduce((s, f) => s + f.criteria.length, 0),
      screens: screens.filter((s) => s.area === area.code).length,
      rules: rules.filter((r) => r.area === area.code).length,
      contracts: contracts.filter((c) => c.area === area.code).length,
      messages: messages.filter((m) => m.area === area.code).length,
      auditEvents: audits.filter((a) => a.area === area.code).length,
    },
    fit: area.fit,
    features: areaFeatures.map((f) => f.id),
    heldFeatures: areaFeatures.filter((f) => f.held).map((f) => ({ id: f.id, decisions: f.heldBy })),
    holdingDecisions: [...new Set(areaFeatures.flatMap((f) => f.heldBy))].sort(),
    contracts: contracts.filter((c) => c.area === area.code).map((c) => c.id),
    modulePrd: area.modulePrd,
  };

  writeFileSync(join(dir, 'plugin.json'), `${JSON.stringify(descriptor, null, 2)}\n`);
  written += 1;

  const indexPath = join(dir, 'index.js');
  if (!existsSync(indexPath)) {
    const hasRoutes = false;
    writeFileSync(indexPath, `// Product.${area.code} - ${area.name}
// Spec: ${area.modulePrd} (wave ${area.wave} ${area.waveName})
// ${descriptor.counts.features} features, ${descriptor.counts.criteria} acceptance criteria, ${descriptor.counts.held} held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: '${area.code}',
  startupOrder: ${startupOrder(area.wave)},
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave ${area.wave} (${area.waveName})',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });${hasRoutes ? '' : ''}
  },
});
`);
    created += 1;
  }
}

console.log(`plugin.json written: ${written}`);
console.log(`index.js created:    ${created} (existing files left alone)`);
