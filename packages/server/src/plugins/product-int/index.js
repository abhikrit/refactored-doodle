// Product.INT - Integrations and APIs
// Spec: docs/prd/modules/PRD-INT.md (wave 6 Reach)
// 13 features, 109 acceptance criteria, 4 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'INT',
  startupOrder: 3500,
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 6 (Reach)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
