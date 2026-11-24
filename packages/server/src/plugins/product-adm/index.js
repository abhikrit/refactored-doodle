// Product.ADM - Administration, workflow and operations console
// Spec: docs/prd/modules/PRD-ADM.md (wave 1 Foundation)
// 12 features, 103 acceptance criteria, 2 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'ADM',
  startupOrder: 3000,
  async install(ctx) {
    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 1 (Foundation)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
