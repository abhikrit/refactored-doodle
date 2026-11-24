// Product.RPT - Reporting and analytics
// Spec: docs/prd/modules/PRD-RPT.md (wave 5 Engage and run)
// 12 features, 74 acceptance criteria, 5 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'RPT',
  startupOrder: 3400,
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 5 (Engage and run)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
