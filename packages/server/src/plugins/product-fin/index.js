// Product.FIN - Financial products
// Spec: docs/prd/modules/PRD-FIN.md (wave 7 Verticals)
// 5 features, 46 acceptance criteria, 1 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'FIN',
  startupOrder: 3600,
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 7 (Verticals)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
