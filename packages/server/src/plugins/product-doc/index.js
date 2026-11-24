// Product.DOC - Documents and records
// Spec: docs/prd/modules/PRD-DOC.md (wave 4 Fulfil)
// 6 features, 45 acceptance criteria, 2 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'DOC',
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
