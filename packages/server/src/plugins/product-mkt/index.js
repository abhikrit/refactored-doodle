// Product.MKT - Marketing, promotions, loyalty, content and SEO
// Spec: docs/prd/modules/PRD-MKT.md (wave 5 Engage and run)
// 14 features, 106 acceptance criteria, 1 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'MKT',
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
