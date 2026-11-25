// Product.CRM - Customer service, help desk and chat
// Spec: docs/prd/modules/PRD-CRM.md (wave 5 Engage and run)
// 15 features, 112 acceptance criteria, 1 held by an open decision.
//
// Session 0 scaffold: the plugin installs, declares what it owns and reports its features and
// screens to the host. Behaviour is built in the per-module sessions (handoff section 5.3).

import { definePlugin } from '../../core/plugin-host.js';

export default definePlugin({
  area: 'CRM',
  startupOrder: 3400,
  async install(ctx) {
    // IC-IAM-09: the account-manager rule of PRD-CRM-015. An account manager may act for the
    // customers assigned to them; the native checks still apply (AC-IAM-010-03-03), so this rule
    // does not pre-empt them.
    ctx.providers.registerProvider('IC-IAM-09', {
      name: 'account managers for their own customers',
      area: 'CRM',
      feature: 'PRD-CRM-015',
      fn: async ({ actor, target }) => {
        if (!(actor?.roles ?? []).includes('AccountManager')) {
          return { decision: 'NotApplicable', reason: 'the user is not an account manager' };
        }
        if ((target.accountManagerId ?? null) !== actor.id) {
          return { decision: 'Deny', messageKey: 'Iam.ScopeDenied', message: ctx.messages.resource('Iam.ScopeDenied') };
        }
        return { decision: 'Allow', reason: 'the customer is assigned to this account manager' };
      },
    });

    ctx.declare({
      built: false,
      note: 'scaffold only - built in wave 5 (Engage and run)',
      features: ctx.features.length,
      screens: ctx.screens.length,
    });
  },
});
