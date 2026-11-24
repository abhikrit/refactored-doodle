// Product.RET - Returns, refunds and disputes
// Spec: docs/prd/modules/PRD-RET.md (wave 4 Fulfil)
// 11 features, 90 acceptance criteria, 4 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'RET',
  startupOrder: 3300,
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 4 (Fulfil)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
