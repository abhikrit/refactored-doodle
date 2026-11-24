// Product.INV - Inventory and warehouses
// Spec: docs/prd/modules/PRD-INV.md (wave 2 Catalogue)
// 13 features, 110 acceptance criteria, 1 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'INV',
  startupOrder: 3100,
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 2 (Catalogue)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
