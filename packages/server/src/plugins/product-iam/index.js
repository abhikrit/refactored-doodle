// Product.IAM - Identity, access and accounts
// Spec: docs/prd/modules/PRD-IAM.md (wave 1 Foundation)
// Owns the single impersonation filter (IAM-026, decision SINGLE-FILTER) and the mobile-number
// OTP identity (IAM-002). Roles and permissions are configuration (IAM-007).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import {
  signInAsync, signOut, currentCustomerAsync, requestOtpAsync, verifyOtpAsync, startActingSessionAsync, customersAsync,
} from './services/identity.js';

export default definePlugin({
  area: 'IAM',
  startupOrder: 3010,
  async install(ctx) {
    ctx.providers.claimOverride('ICustomerImpersonationFilter', {
      owner: 'Product.IAM',
      feature: 'PRD-IAM-026',
      startupOrder: 3010,
      note: 'BR-IAM-130 / decision SINGLE-FILTER: exactly one filter guards Place order for customer.',
    });

    const r = Router();
    r.get('/me', async (req, res, next) => {
      try { res.json(await currentCustomerAsync(req.sessionId)); } catch (err) { next(err); }
    });
    r.get('/customers', async (req, res, next) => {
      try { res.json((await customersAsync()).map(({ password, ...c }) => c)); } catch (err) { next(err); }
    });
    r.post('/sign-in', async (req, res, next) => {
      try { res.json(await signInAsync({ sessionId: req.sessionId, ...req.body })); } catch (err) { next(err); }
    });
    r.post('/sign-out', (req, res) => { signOut(req.sessionId); res.json({ ok: true }); });
    r.post('/otp/request', async (req, res, next) => {
      try { res.json(await requestOtpAsync({ ...req.body, storeId: req.storeId })); } catch (err) { next(err); }
    });
    r.post('/otp/verify', async (req, res, next) => {
      try { res.json(await verifyOtpAsync({ sessionId: req.sessionId, ...req.body })); } catch (err) { next(err); }
    });
    r.post('/acting-session', async (req, res, next) => {
      try { res.json(await startActingSessionAsync({ sessionId: req.sessionId, ...req.body })); } catch (err) { next(err); }
    });
    r.get('/acl', async (req, res, next) => {
      try { res.json(await ctx.security.aclMatrixAsync()); } catch (err) { next(err); }
    });
    ctx.addRouter('/api/identity', r);
    ctx.declare({ built: true, owns: ['PRD-IAM-001', 'PRD-IAM-002', 'PRD-IAM-007', 'PRD-IAM-026'], note: 'sign-in, OTP, acting session and the ACL matrix are built in Session 0' });
  },
});
