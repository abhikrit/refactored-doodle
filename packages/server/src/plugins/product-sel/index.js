// Product.SEL - Sellers and marketplace onboarding
// Spec: docs/prd/modules/PRD-SEL.md (wave 2 Catalogue)
// Most of SEL is held by C-SELLER (Malawi Post) or the KTDA seller-model gap KG-01, so the
// prototype shows the Proposed option labelled with the decision (P-1).

import { Router } from 'express';
import { definePlugin } from '../../core/plugin-host.js';
import { sellersAsync, sellerDashboardAsync } from './services/sellers.js';
import { registerApprovalCallbacks, submitAsync } from '../product-adm/services/approvals.js';
import { repository } from '../../core/repository.js';

export default definePlugin({
  area: 'SEL',
  startupOrder: 3120,
  async install(ctx) {
    // IC-ADM-03: SEL owns these object types, so SEL supplies the guard and the callbacks and
    // ADM-006 only decides. ADM never changes a seller object itself (BR-ADM-011).
    registerApprovalCallbacks('PayoutAccountChange', {
      feature: 'PRD-SEL-005',
      onApproved: async ({ objectId }) => {
        const change = await repository('PayoutAccountChange').getByIdAsync(Number(objectId));
        if (!change) return { applied: false };
        await repository('PayoutAccountChange').updateAsync({ ...change, status: 'Applied', appliedOnUtc: new Date().toISOString() });
        return { applied: true, account: change.newAccount };
      },
      onRejected: async ({ objectId }) => {
        const change = await repository('PayoutAccountChange').getByIdAsync(Number(objectId));
        if (change) await repository('PayoutAccountChange').updateAsync({ ...change, status: 'Rejected' });
        return { applied: false };
      },
    });
    registerApprovalCallbacks('SellerApplication', {
      feature: 'PRD-SEL-003',
      // BR-ADM-031 / Sel.ApprovalBlocked: the owning module refuses the decision while its own
      // checks are outstanding; a rejection is not guarded.
      canDecide: async ({ objectId }) => {
        const application = await repository('SellerApplication').getByIdAsync(Number(objectId));
        if (!application) return { allowed: false, reason: 'the application no longer exists' };
        if (application.documentsOutstanding) {
          return { allowed: false, reason: 'the seller documents are not verified yet (Sel.ApprovalBlocked)' };
        }
        return { allowed: true };
      },
      onApproved: async ({ objectId }) => {
        const application = await repository('SellerApplication').getByIdAsync(Number(objectId));
        await repository('SellerApplication').updateAsync({ ...application, status: 'Approved' });
        return { applied: true };
      },
    });

    const r = Router();
    // SEL-005: a payout account change is a high-risk action, so it goes through ADM-006
    r.post('/payout-account-changes', async (req, res, next) => {
      try {
        const change = await repository('PayoutAccountChange').insertAsync({
          sellerId: req.body.sellerId,
          oldAccount: req.body.oldAccount,
          newAccount: req.body.newAccount,
          status: 'PendingApproval',
          requestedBy: req.actorEmail ?? null,
          requestedOnUtc: new Date().toISOString(),
        });
        const item = await submitAsync({
          objectType: 'PayoutAccountChange',
          objectId: change.id,
          requesterEmail: req.actorEmail ?? null,
          summary: `Payout account change for seller ${req.body.sellerId}`,
          chainCode: 'payout-account-change',
        });
        res.json({ ok: true, change, approvalItemId: item.item?.id ?? null });
      } catch (err) { next(err); }
    });
    r.get('/payout-account-changes', async (req, res, next) => {
      try { res.json(await repository('PayoutAccountChange').getAllAsync()); } catch (err) { next(err); }
    });
    r.post('/applications', async (req, res, next) => {
      try {
        const application = await repository('SellerApplication').insertAsync({
          name: req.body.name,
          tier: req.body.tier ?? 'silver',
          documentsOutstanding: req.body.documentsOutstanding !== false,
          status: 'PendingApproval',
        });
        const item = await submitAsync({
          objectType: 'SellerApplication',
          objectId: application.id,
          requesterEmail: req.actorEmail ?? null,
          summary: `Seller application: ${req.body.name}`,
          chainCode: 'seller-application',
        });
        res.json({ ok: true, application, approvalItemId: item.item?.id ?? null });
      } catch (err) { next(err); }
    });
    r.patch('/applications/:id', async (req, res, next) => {
      try {
        const application = await repository('SellerApplication').getByIdAsync(Number(req.params.id));
        res.json(await repository('SellerApplication').updateAsync({ ...application, ...req.body }));
      } catch (err) { next(err); }
    });
    r.get('/', async (req, res, next) => {
      try { res.json(await sellersAsync()); } catch (err) { next(err); }
    });
    r.get('/:id/dashboard', async (req, res, next) => {
      try {
        const data = await sellerDashboardAsync(Number(req.params.id));
        if (!data) return res.status(404).json({ message: 'seller not found' });
        return res.json(data);
      } catch (err) { return next(err); }
    });
    ctx.addRouter('/api/sellers', r);
    ctx.declare({ built: false, partial: true, owns: ['PRD-SEL-001', 'PRD-SEL-008', 'PRD-SEL-016'], note: 'seller list and seller dashboard read model only; onboarding, approval stages and settlements are wave 2. SEL-005 payout account changes and SEL-003 applications go through the ADM-006 approval queue (IC-ADM-03), which is what AC-ADM-006-05-01 and AC-ADM-006-01-04 require.' });
  },
});
