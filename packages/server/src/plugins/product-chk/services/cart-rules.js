// CHK-011 cart restriction rules.
//
// BR-CHK-015: the rules are one provider on the CHK-003 cart override (IC-CHK-01), not an
// override of their own. A rule is a CartRestrictionRule row: a prohibited combination, an item
// that may only be collected, or a delivery constraint for an area. Every change is audited
// (AUD-CHK-001).

import { repository } from '../../../core/repository.js';
import { resource } from '../../../core/messages.js';
import { auditAsync } from '../../../core/audit.js';

const ruleRepo = () => repository('CartRestrictionRule');

export const RULE_TYPE = {
  ProhibitedCombination: 'ProhibitedCombination',
  PickupOnly: 'PickupOnly',
  DeliveryConstraint: 'DeliveryConstraint',
};

const SCOPE = ['product', 'category', 'vendor'];

/** AC-CHK-011-01-03: who changed a rule, when, and what it was before. */
export async function saveRuleAsync({
  id = null, type, scopeA = null, scopeB = null, areas = [], messageText = null,
  isActive = true, storeId = 1, actor = 'administrator',
}) {
  if (!Object.values(RULE_TYPE).includes(type)) {
    return { ok: false, message: `${type} is not a kind of cart rule` };
  }
  for (const scope of [scopeA, scopeB].filter(Boolean)) {
    if (!SCOPE.includes(scope.kind)) {
      return { ok: false, message: `a rule applies to a ${SCOPE.join(', ')}, not to a ${scope.kind}` };
    }
  }
  if (type === RULE_TYPE.ProhibitedCombination && (!scopeA || !scopeB)) {
    return { ok: false, message: 'a prohibited combination needs both sides' };
  }
  if (!scopeA) return { ok: false, message: 'a rule needs something to apply to' };
  if (!messageText) return { ok: false, message: 'a rule needs the text the shopper is shown' };

  const row = {
    type,
    scopeA,
    scopeB: scopeB ?? null,
    areas: areas ?? [],
    messageText,
    isActive: isActive !== false,
    storeId: Number(storeId),
  };
  const existing = id ? await ruleRepo().getByIdAsync(id) : null;
  const saved = existing
    ? await ruleRepo().updateAsync({ ...existing, ...row })
    : await ruleRepo().insertAsync(row);
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: 'PRD-CHK-011',
    entity: 'CartRestrictionRule',
    entityId: saved.id,
    actor,
    storeId: Number(storeId),
    before: existing ?? null,
    after: saved,
    note: existing ? 'cart rule changed' : 'cart rule created',
  });
  return { ok: true, rule: saved };
}

export async function setRuleActiveAsync({
  id, isActive, actor = 'administrator', storeId = 1,
}) {
  const existing = await ruleRepo().getByIdAsync(id);
  if (!existing) return { ok: false, message: 'unknown rule' };
  const saved = await ruleRepo().updateAsync({ ...existing, isActive: isActive === true });
  await auditAsync({
    event: 'AUD-CHK-001',
    area: 'CHK',
    feature: 'PRD-CHK-011',
    entity: 'CartRestrictionRule',
    entityId: id,
    actor,
    storeId: Number(storeId),
    before: { isActive: existing.isActive },
    after: { isActive: saved.isActive },
    note: saved.isActive ? 'cart rule enabled' : 'cart rule disabled',
  });
  return { ok: true, rule: saved };
}

export async function rulesAsync({ storeId = null, activeOnly = false } = {}) {
  const rows = await ruleRepo().getAllAsync();
  return rows.filter((r) => (storeId == null || r.storeId == null || Number(r.storeId) === Number(storeId))
    && (!activeOnly || r.isActive !== false));
}

/** Does this scope cover that product? */
function covers(scope, product) {
  if (!scope) return false;
  const id = String(scope.id ?? scope.value ?? '');
  if (scope.kind === 'product') return String(product.id) === id;
  if (scope.kind === 'category') return (product.categoryIds ?? []).map(String).includes(id);
  if (scope.kind === 'vendor') return String(product.vendorId ?? 0) === id;
  return false;
}

/**
 * The IC-CHK-01 provider. It runs on every cart check, so a rule that became active after the
 * items were added is caught at the cart, at checkout and again at placement
 * (AC-CHK-011-01-01, 01-02, 02-01 and 02-02).
 */
export async function cartCheckAsync({
  product, quantity = 1, customer = null, storeId = 1, item = null, fulfilment = null, cart = null,
  sessionId = null,
}) {
  if (!product) return { warnings: [] };
  const rules = await rulesAsync({ storeId, activeOnly: true });
  if (!rules.length) return { warnings: [] };
  const warnings = [];

  // the other lines of the same cart, for a combination rule
  let others = cart?.items ?? null;
  const cartSession = sessionId ?? item?.sessionId ?? null;
  if (!others && cartSession) {
    const rows = await repository('ShoppingCartItem').getAllAsync((i) => i.sessionId === cartSession
      && i.cartType === 1 && Number(i.id) !== Number(item?.id ?? 0));
    others = [];
    for (const row of rows) {
      const p = await repository('Product').getByIdAsync(row.productId);
      if (p) others.push({ ...row, product: p });
    }
  }
  const otherProducts = (others ?? [])
    .map((line) => line.product ?? line)
    .filter((p) => p && Number(p.id) !== Number(product.id));

  for (const rule of rules) {
    if (rule.type === RULE_TYPE.ProhibitedCombination) {
      const thisSideA = covers(rule.scopeA, product);
      const thisSideB = covers(rule.scopeB, product);
      if (!thisSideA && !thisSideB) continue;
      const otherSide = thisSideA ? rule.scopeB : rule.scopeA;
      const clash = otherProducts.some((p) => covers(otherSide, p));
      if (clash) {
        warnings.push({
          key: 'Chk.CartRuleViolation',
          message: resource('Chk.CartRuleViolation', { 'rule text': rule.messageText }),
          ruleId: rule.id,
          ruleType: rule.type,
        });
      }
      continue;
    }

    if (rule.type === RULE_TYPE.PickupOnly) {
      if (!covers(rule.scopeA, product)) continue;
      const chosen = fulfilment ?? item?.fulfilment ?? null;
      if (chosen && chosen !== 'pickup') {
        warnings.push({
          key: 'Chk.PickupOnly',
          message: resource('Chk.PickupOnly'),
          ruleId: rule.id,
          ruleType: rule.type,
        });
      }
      continue;
    }

    if (rule.type === RULE_TYPE.DeliveryConstraint) {
      if (!covers(rule.scopeA, product)) continue;
      const area = item?.deliverTo ?? null;
      const chosen = fulfilment ?? item?.fulfilment ?? 'delivery';
      if (chosen === 'pickup' || !area) continue;
      const restricted = (rule.areas ?? []).map((a) => String(a).toLowerCase());
      if (restricted.length && !restricted.includes(String(area).toLowerCase())) {
        warnings.push({
          key: 'Chk.CartRuleViolation',
          message: resource('Chk.CartRuleViolation', { 'rule text': rule.messageText }),
          ruleId: rule.id,
          ruleType: rule.type,
          mayCollectInstead: true,
        });
      }
    }
  }
  return { warnings, checkedRules: rules.length };
}

/**
 * AC-CHK-011-02-01: a product the rules make collection-only is marked, so the fulfilment step
 * offers no delivery for its line. CHK-005 reads this through the same rule set.
 */
export async function pickupOnlyAsync({ product, storeId = 1 }) {
  if (!product) return false;
  if (product.pickupOnly === true) return true;
  const rules = await rulesAsync({ storeId, activeOnly: true });
  return rules.some((r) => r.type === RULE_TYPE.PickupOnly && covers(r.scopeA, product));
}
