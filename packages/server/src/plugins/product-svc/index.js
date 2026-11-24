// Product.SVC - Services commerce (booking, delivery and completion of services; SVC-007 covers electronically delivered goods)
// Spec: docs/prd/modules/PRD-SVC.md (wave 7 Verticals)
// 12 features, 89 acceptance criteria, 8 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'SVC',
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
