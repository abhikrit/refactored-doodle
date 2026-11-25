// Product.INT - Integrations and APIs
// Spec: docs/prd/modules/PRD-INT.md (wave 6 Reach)
// 13 features, 109 acceptance criteria, 4 held by an open decision.
//
// Built here: PRD-INT-004 the single integration outbox (IC-INT-09 Enqueue, SM-INT-01), because
// BR-IAM-100 gives IAM-019 no outbox of its own - every module enqueues into this one. The rest
// of the area is still the Session-0 scaffold.

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  enqueueAsync, runDeliveryTaskAsync, messagesAsync, deadLetterAsync,
} from './services/outbox.js';

export default definePlugin({
  area: 'INT',
  startupOrder: 3500,
  async install(ctx) {
    const send = (fn) => async (req, res, next) => {
      try { res.json(await fn(req)); } catch (err) { next(err); }
    };
    const gate = (permission) => async (req, res, next) => {
      if (!await ctx.security.authorizeAsync(permission, req.actor)) {
        return res.status(403).json({ denied: true, permission });
      }
      return next();
    };
    const r = Router();
    r.get('/messages', gate('Integrations.Core.Messages.View'), send((req) => messagesAsync(req.query.channel ?? null)));
    r.get('/dead-letter', gate('Integrations.Core.Messages.View'), send(() => deadLetterAsync()));
    r.post('/messages', send((req) => enqueueAsync(req.body)));
    r.post('/delivery-task', send((req) => runDeliveryTaskAsync({
      failChannel: req.body?.failChannel ?? null,
      adapter: req.body?.failChannel ? null : {
        // IC-IAM-03 PublishAccountChange is served by the Integration Layer mock
        publishAsync: async () => ({ ok: true, contract: 'IC-IAM-03 PublishAccountChange' }),
      },
    })));
    ctx.addRouter('/api/integrations', r);

    ctx.declare({
      built: false,
      features: ctx.features.length,
      screens: ctx.screens.length,
      note: 'PRD-INT-004 outbox built (IC-INT-09); the rest is a scaffold - built in wave 6 (Reach)',
      builtFeatures: ['PRD-INT-004'],
    });
  },
});
