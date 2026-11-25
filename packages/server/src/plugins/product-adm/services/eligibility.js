// PRD-ADM-005 Eligibility and quota rules.
//
// US-ADM-005-01  who may see, buy or take part in something
// US-ADM-005-02  a quota reserved for a defined group
// US-ADM-005-03  screening against sanctions lists
//
// BR-ADM-050: eligibility affects visibility only through native ACL by customer role -
// eligibility rules compute role membership. Purchase limits and quotas are enforced by an ADM
// cart rule provider (IC-CHK-01) of the CHK-003 IShoppingCartService override, which
// PlaceOrderAsync re-runs, and reserved at placement by an ADM placement participant (IC-CHK-06)
// under ILocker key 'adm-quota-{quotaId}'. ADM overrides neither IShoppingCartService nor
// IOrderProcessingService (OVR-REG, BR-ADM-002).

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { sendEventAsync } from '../../product-trk/services/event-codes.js';
import { evaluateAsync } from './rules.js';
import { submitAsync } from './approvals.js';

const bindingRepo = () => repository('EligibilityBinding');
const quotaRepo = () => repository('Quota');
const screeningRepo = () => repository('ScreeningResult');
const customerRepo = () => repository('Customer');
const productRepo = () => repository('Product');

export const bindingsAsync = () => bindingRepo().getAllAsync();
export const quotasAsync = () => quotaRepo().getAllAsync();
export const screeningsAsync = () => screeningRepo().getAllAsync();

/* ============================================================== eligibility roles ======== */

/**
 * AC-ADM-005-01-01: a customer's profile change, or the nightly recomputation task, adds the
 * customer to or removes them from the bound role; native ACL (AclRecord by customer role) then
 * decides what the customer sees.
 */
export async function recomputeEligibilityAsync({ customerId = null, actor = 'system' } = {}) {
  const bindings = await bindingRepo().getAllAsync();
  const customers = customerId
    ? [await customerRepo().getByIdAsync(customerId)].filter(Boolean)
    : await customerRepo().getAllAsync((c) => !c.deleted);
  const changes = [];
  for (const binding of bindings) {
    for (const customer of customers) {
      const outcome = await evaluateAsync({
        ruleSetCode: binding.ruleSetCode,
        facts: {
          'Customer.Country': customer.country ?? null,
          'Customer.Roles': customer.roles ?? [],
          'Customer.YearsRegistered': customer.yearsRegistered ?? 0,
          'Customer.AnnualSpend': customer.annualSpend ?? 0,
        },
        callerRef: `eligibility-${binding.id}`,
      });
      const eligible = outcome.outcome === (binding.eligibleOutcome ?? 'Eligible');
      const has = (customer.roles ?? []).includes(binding.customerRole);
      if (eligible === has) continue;
      const roles = eligible
        ? [...(customer.roles ?? []), binding.customerRole]
        : (customer.roles ?? []).filter((r) => r !== binding.customerRole);
      await customerRepo().updateAsync({ ...customer, roles });
      changes.push({
        customer: customer.email, role: binding.customerRole, added: eligible, ruleSet: binding.ruleSetCode,
      });
      await auditAsync({
        event: 'AUD-ADM-005',
        area: 'ADM',
        feature: 'PRD-ADM-005',
        entity: 'EligibilityBinding',
        entityId: binding.id,
        actor,
        actorRole: 'Compliance',
        before: { roles: customer.roles },
        after: { roles },
        note: `${eligible ? 'added to' : 'removed from'} ${binding.customerRole} by rule set ${binding.ruleSetCode}`,
      });
    }
  }
  return { changes, visibility: 'native AclRecord by customer role (BR-ADM-050)' };
}

/* ===================================================== the cart rule provider (IC-CHK-01) = */

/**
 * AC-ADM-005-01-02 Adm.NotEligible and AC-ADM-005-02-01 Adm.QuotaReserved.
 * This is a provider on the CHK-003 override, not an override of its own (BR-ADM-002).
 */
export async function cartCheckAsync({ product, quantity, customer }) {
  const warnings = [];
  const full = product.id ? await productRepo().getByIdAsync(product.id) ?? product : product;
  const roles = customer?.roles ?? [];

  // eligibility: a product restricted to an eligibility role
  if (full.limitedToCustomerRoles?.length && !full.limitedToCustomerRoles.some((r) => roles.includes(r))) {
    warnings.push(resource('Adm.NotEligible'));
    return { warnings, refusedBy: 'eligibility' };
  }

  // quota: a quantity reserved for a role over a period
  const quota = await quotaRepo().getOneAsync((q) => q.scope === 'product' && String(q.refId) === String(full.id));
  if (quota && !roles.includes(quota.customerRole)) {
    const free = Math.max(0, (full.stockQuantity ?? 0) - (quota.quantity - (quota.consumed ?? 0)));
    if (quantity > free) {
      warnings.push(resource('Adm.QuotaReserved', { 0: free }));
      return { warnings, refusedBy: 'quota', availableToThisCustomer: free };
    }
  }
  return { warnings };
}

/* ============================================ the placement participant (IC-CHK-06) ====== */

/**
 * AC-ADM-005-02-02: Reserve re-checks the quota under ILocker key 'adm-quota-{quotaId}' and
 * reserves the quantity, or refuses placement with Adm.QuotaReserved; Confirm consumes the
 * reservation; Release frees it when placement or payment fails (BR-CHK-020).
 */
export async function placementParticipantAsync({
  phase, cart = [], customer = null, reservations = [],
}) {
  // the checkout passes its cart model; a test may pass the lines directly
  const lines = Array.isArray(cart) ? cart : (cart?.items ?? []);
  if (phase === 'Reserve') {
    const held = [];
    for (const line of lines) {
      const product = await productRepo().getByIdAsync(line.productId);
      if (!product) continue;
      const quota = await quotaRepo().getOneAsync((q) => q.scope === 'product' && String(q.refId) === String(product.id));
      if (!quota) continue;
      const roles = customer?.roles ?? [];
      const inRole = roles.includes(quota.customerRole);
      const refusal = await withLockAsync(lockKey.quota(quota.id), async () => {
        const current = await quotaRepo().getByIdAsync(quota.id);
        // what is still held back for the role, and what is left for everyone else
        const reservedLeft = Math.max(0, current.quantity - (current.consumed ?? 0) - (current.reserved ?? 0));
        const available = inRole
          ? reservedLeft
          : Math.max(0, (product.stockQuantity ?? 0) - reservedLeft);
        if (line.quantity > available) {
          return {
            ok: false, messageKey: 'Adm.QuotaReserved', message: resource('Adm.QuotaReserved', { 0: available }), quotaId: current.id,
          };
        }
        if (inRole) {
          await quotaRepo().updateAsync({ ...current, reserved: (current.reserved ?? 0) + line.quantity });
          held.push({ quotaId: current.id, quantity: line.quantity, by: 'PRD-ADM-005' });
        }
        return null;
      });
      if (refusal) {
        for (const h of held) await releaseAsync(h);
        return refusal;
      }
    }
    return { ok: true, reservations: held, by: 'PRD-ADM-005' };
  }
  if (phase === 'Confirm') {
    for (const held of reservations.filter((r) => r?.by === 'PRD-ADM-005')) {
      const quota = await quotaRepo().getByIdAsync(held.quotaId);
      if (!quota) continue;
      await quotaRepo().updateAsync({
        ...quota, reserved: Math.max(0, (quota.reserved ?? 0) - held.quantity), consumed: (quota.consumed ?? 0) + held.quantity,
      });
    }
    return { ok: true };
  }
  if (phase === 'Release') {
    for (const held of reservations.filter((r) => r?.by === 'PRD-ADM-005')) await releaseAsync(held);
    return { ok: true };
  }
  return { ok: true };
}

async function releaseAsync(held) {
  const quota = await quotaRepo().getByIdAsync(held.quotaId);
  if (!quota) return;
  await quotaRepo().updateAsync({ ...quota, reserved: Math.max(0, (quota.reserved ?? 0) - held.quantity) });
}

/** Nightly quota report (section 14.1): overruns. */
export async function quotaReportAsync() {
  const quotas = await quotaRepo().getAllAsync();
  return quotas.map((q) => ({
    ...q,
    overrun: (q.consumed ?? 0) > q.quantity,
    remaining: q.quantity - (q.consumed ?? 0) - (q.reserved ?? 0),
  }));
}

/* ======================================================= sanctions screening (IC-ADM-06) = */

/**
 * AC-ADM-005-03-01: on a possible match the account is flagged, checkout is blocked with
 * Adm.ScreeningHold and a review item is created (ADM-006).
 */
export async function screenPartyAsync({
  customerId, adapter, trigger = 'registration', gateways = null,
}) {
  const customer = await customerRepo().getByIdAsync(customerId);
  if (!customer) throw new Error('unknown customer');
  const result = adapter
    ? await adapter.screenAsync({
      name: `${customer.firstName} ${customer.lastName}`, country: customer.country, identifiers: [customer.email],
    })
    : { result: 'NoMatch', score: 0, listVersion: 'none' };

  const record = await screeningRepo().insertAsync({
    customerId,
    customerEmail: customer.email,
    listVersion: result.listVersion,
    result: result.result,
    score: result.score,
    matches: result.matches ?? [],
    trigger,
    screenedOnUtc: new Date().toISOString(),
    status: result.result === 'PossibleMatch' ? 'InReview' : 'Clear',
  });
  if (result.result !== 'PossibleMatch') return { ok: true, screening: record, blocked: false };

  await customerRepo().updateAsync({ ...customer, screeningHold: true });
  const review = await submitAsync({
    objectType: 'ScreeningMatch',
    objectId: record.id,
    requesterId: null,
    summary: `Sanctions screening possible match for ${customer.email}`,
    chainCode: 'screening-review',
    approverRole: 'Compliance',
  });
  try {
    await sendEventAsync({
      code: 'Administration.ScreeningMatch', to: 'compliance@example.com', tokens: { customer: customer.email, score: result.score }, gateways,
    });
  } catch { /* ignore */ }
  return {
    ok: true,
    screening: record,
    blocked: true,
    messageKey: 'Adm.ScreeningHold',
    message: resource('Adm.ScreeningHold'),
    approvalItemId: review.item?.id ?? null,
  };
}

/** The checkout block, applied as a cart/placement check (AC-ADM-005-03-01). */
export async function screeningHoldAsync(customer) {
  if (!customer) return { blocked: false };
  const fresh = await customerRepo().getByIdAsync(customer.id);
  if (!fresh?.screeningHold) return { blocked: false };
  return { blocked: true, messageKey: 'Adm.ScreeningHold', message: resource('Adm.ScreeningHold') };
}

/**
 * AC-ADM-005-03-02: cleared removes the flag and checkout works; confirmed adds the customer to
 * the SEL-013 block list; both are audited (AUD-ADM-005).
 */
export async function decideScreeningAsync({
  screeningId, decision, customer = null, note = null,
}) {
  const record = await screeningRepo().getByIdAsync(screeningId);
  if (!record) return { ok: false, message: 'unknown screening result' };
  const subject = await customerRepo().getByIdAsync(record.customerId);
  const cleared = decision === 'clear';
  await customerRepo().updateAsync({ ...subject, screeningHold: !cleared });
  if (!cleared) {
    await repository('SellerBlockListEntry').insertAsync({
      customerId: subject.id,
      email: subject.email,
      reason: 'confirmed sanctions match',
      addedBy: customer?.email ?? 'compliance',
      feature: 'PRD-SEL-013',
      addedOnUtc: new Date().toISOString(),
    });
  }
  const updated = await screeningRepo().updateAsync({
    ...record,
    status: cleared ? 'Cleared' : 'Confirmed',
    reviewedBy: customer?.email ?? 'compliance',
    decision,
    note,
    reviewedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-ADM-005',
    area: 'ADM',
    feature: 'PRD-ADM-005',
    entity: 'ScreeningResult',
    entityId: screeningId,
    actor: customer?.email ?? 'compliance',
    actorRole: 'Compliance',
    before: { status: record.status, screeningHold: true },
    after: { status: updated.status, screeningHold: !cleared },
    note: note ?? `screening ${decision}`,
  });
  return {
    ok: true, screening: updated, checkoutWorks: cleared, blockListed: !cleared,
  };
}

export async function saveQuotaAsync({
  id = null, scope = 'product', refId, customerRole, quantity, periodStart = null, periodEnd = null, customer = null,
}) {
  const existing = id ? await quotaRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await quotaRepo().updateAsync({
      ...existing, scope, refId, customerRole, quantity, periodStart, periodEnd,
    })
    : await quotaRepo().insertAsync({
      scope, refId, customerRole, quantity, consumed: 0, reserved: 0, periodStart, periodEnd,
    });
  await auditAsync({
    event: 'AUD-ADM-005',
    area: 'ADM',
    feature: 'PRD-ADM-005',
    entity: 'Quota',
    entityId: saved.id,
    actor: customer?.email ?? 'compliance',
    actorRole: 'Compliance',
    before: existing ? { quantity: existing.quantity, customerRole: existing.customerRole } : null,
    after: { quantity, customerRole },
    note: existing ? 'quota changed' : 'quota created',
  });
  return saved;
}
