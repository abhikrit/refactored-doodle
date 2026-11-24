// Provider registry and override register.
//
// CLAUDE.md: "One owner per overridden nopCommerce service (OVR-REG); other modules plug in as
// providers through the owner's contract (IC-...)." L1 section 6.2 principle 7.
//
// - claimOverride() records the single owner of a nopCommerce service. A second claim throws:
//   the prototype refuses to build what the register forbids.
// - registerProvider() adds a provider to a named contract, in registration order.
// - A provider error is contained: callers decide what a failure means (for cart checks it
//   refuses the item, for consumers it is swallowed).

const overrides = new Map(); // nopCommerce service -> { owner, feature, startupOrder, note }
const providersByContract = new Map(); // IC-... -> [{ area, feature, name, fn, order, substitute }]

// PRD-ADM-001 / BR-ADM-001: the product extension register. Every mechanism by which a product
// plugin changes nopCommerce behaviour is recorded here, so the ADM start-up check can prove that
// two plugins never silently replace the same core service (AC-ADM-001-04-01).
const extensions = []; // { mechanism, target, owner, feature, order, note, providers: [] }
const MECHANISMS = ['DI override', 'decorator', 'action filter', 'result filter', 'middleware', 'model-factory override', 'core modification'];

export function claimOverride(service, {
  owner, feature, startupOrder = 3000, note = '', mechanism = 'DI override', rule = 'BR-ADM-002',
}) {
  const existing = overrides.get(service);
  if (existing && existing.owner !== owner) {
    // AC-ADM-001-04-01: a second product implementation of the same interface is a conflict.
    // It is recorded rather than thrown away, so the start-up check can report it, and it is
    // still refused, because the register's whole purpose is that this never happens silently.
    recordExtension({
      mechanism,
      target: service,
      owner,
      feature,
      rule,
      note,
      conflictWith: existing.owner,
      refused: true,
    });
    throw new Error(
      `OVR-REG violation: ${service} is already owned by ${existing.owner} (${existing.feature}); `
      + `${owner} (${feature}) may only plug in through the owner's contract`,
    );
  }
  overrides.set(service, {
    service, owner, feature, startupOrder, note,
  });
  recordExtension({
    mechanism, target: service, owner, feature, order: startupOrder, note, rule,
  });
  return overrides.get(service);
}

/**
 * BR-ADM-001: record any extension mechanism in the register.
 * AC-ADM-001-04-02 shows target, mechanism, owning feature, provider features and the rule.
 */
export function recordExtension({
  mechanism, target, owner, feature, order = 0, note = '', rule = '', conflictWith = null,
  refused = false,
}) {
  if (!MECHANISMS.includes(mechanism)) {
    throw new Error(`unknown extension mechanism "${mechanism}"; BR-ADM-001 lists: ${MECHANISMS.join(', ')}`);
  }
  const entry = {
    mechanism, target, owner, feature, order, note, rule, conflictWith, refused, providers: [],
  };
  extensions.push(entry);
  return entry;
}

/**
 * AC-ADM-001-04-04: several plugins may put a global action filter on the same action. They run
 * in the recorded order, each may refuse independently, and a refusal stops the action.
 * AC-ADM-001-04-06: an action whose decision has one owner takes rule providers, not a second
 * filter. registerActionFilter refuses the second filter, which is what the release check asserts.
 */
export function registerActionFilter(target, {
  owner, feature, order = 1000, refuses = true, singleOwner = false, note = '', rule = 'BR-ADM-005', fn = null,
}) {
  const existing = extensions.filter((e) => e.mechanism === 'action filter' && e.target === target && !e.refused);
  const ownerEntry = existing.find((e) => e.singleOwner);
  if (ownerEntry && ownerEntry.owner !== owner) {
    // recorded, then refused: the register's purpose is that the attempt is never invisible
    recordExtension({
      mechanism: 'action filter',
      target,
      owner,
      feature,
      order,
      note,
      rule,
      conflictWith: ownerEntry.owner,
      refused: true,
    });
    throw new Error(
      `SINGLE-FILTER violation: ${target} has one filter, owned by ${ownerEntry.owner} `
      + `(${ownerEntry.feature}); ${owner} (${feature}) must supply a rule provider instead`,
    );
  }
  const entry = recordExtension({
    mechanism: 'action filter', target, owner, feature, order, note, rule,
  });
  Object.assign(entry, { refuses, singleOwner, fn });
  return entry;
}

/** A rule provider supplied to the owner of a single-owner filter (AC-ADM-001-04-06). */
export function registerRuleProvider(target, {
  owner, feature, name, fn = null, note = '',
}) {
  const ownerEntry = extensions.find((e) => e.mechanism === 'action filter' && e.target === target && e.singleOwner);
  if (!ownerEntry) {
    throw new Error(`no single-owner filter on ${target}; a rule provider needs an owner to supply`);
  }
  ownerEntry.providers.push({
    feature, owner, name, note, fn,
  });
  return ownerEntry;
}

/** Run the filters on an action in register order; the first refusal stops the action. */
export async function runActionFilters(target, context) {
  const filters = extensions
    .filter((e) => e.mechanism === 'action filter' && e.target === target)
    .sort((a, b) => a.order - b.order);
  const ran = [];
  for (const f of filters) {
    ran.push({ feature: f.feature, order: f.order });
    let verdict = { ok: true };
    if (f.fn) verdict = (await f.fn(context)) ?? { ok: true };
    // a single-owner filter asks its rule providers before deciding
    for (const p of f.providers) {
      if (!p.fn) continue;
      const r = await p.fn(context);
      if (r && r.ok === false) verdict = r;
    }
    if (verdict.ok === false) {
      return {
        ok: false, refusedBy: f.feature, message: verdict.message, ran,
      };
    }
  }
  return { ok: true, ran };
}

const byMechanismThenTarget = (a, b) => a.mechanism.localeCompare(b.mechanism)
  || a.target.localeCompare(b.target) || a.order - b.order;

/** The register: the extensions that are in force (BR-ADM-001). */
export function extensionRegister() {
  return extensions.filter((e) => !e.refused).sort(byMechanismThenTarget);
}

/**
 * Attempts the host refused — a second owner of an overridden service (OVR-REG) or a second
 * filter on a single-owner action (SINGLE-FILTER). They never took effect, so they are not part
 * of the register, but they are reported by the start-up check rather than discarded.
 */
export function refusedAttempts() {
  return extensions.filter((e) => e.refused).sort(byMechanismThenTarget);
}

/**
 * AC-ADM-001-04-01: the start-up check. It runs after every other product plugin has installed
 * and reports, per target, every implementation a product plugin registered.
 * A target with more than one product implementation, or one from a plugin that is not its
 * registered owner, is a conflict (BR-ADM-001). AC-ADM-001-04-05 is the Misc.Brevo case.
 */
export function startupCheck({ installedPlugins = [] } = {}) {
  const warnings = [];
  const live = extensions.filter((e) => !e.refused);
  const byTarget = new Map();
  for (const e of live) {
    if (!['DI override', 'decorator', 'model-factory override'].includes(e.mechanism)) continue;
    const list = byTarget.get(e.target) ?? [];
    list.push(e);
    byTarget.set(e.target, list);
  }
  for (const [target, list] of byTarget) {
    const owners = [...new Set(list.map((e) => e.owner))];
    if (owners.length > 1) {
      warnings.push({
        level: 'conflict',
        target,
        message: `${target} is implemented by ${owners.length} plugins: ${owners.join(', ')}. `
          + 'One owner per overridden service (decision OVR-REG, L1 section 6.2 principle 7).',
        owners,
        rule: 'BR-ADM-001',
      });
    }
    const registered = overrides.get(target);
    for (const e of list) {
      if (registered && e.owner !== registered.owner) {
        warnings.push({
          level: 'conflict',
          target,
          message: `${target} is owned by ${registered.owner} (${registered.feature}) but `
            + `${e.owner} also registers an implementation.`,
          rule: 'BR-ADM-001',
        });
      }
    }
  }
  // a bundled nopCommerce plugin that replaces a service the product owns (AC-ADM-001-04-05)
  for (const p of installedPlugins) {
    for (const target of p.replaces ?? []) {
      const registered = overrides.get(target);
      if (!registered) continue;
      warnings.push({
        level: 'conflict',
        target,
        message: `the bundled ${p.systemName} plugin replaces ${target}, which ${registered.owner} `
          + `(${registered.feature}) owns. Client instances do not install ${p.systemName}.`,
        rule: 'BR-ADM-003',
        plugin: p.systemName,
      });
    }
  }
  // a single-owner action filter with a second filter on it (AC-ADM-001-04-06)
  const filterTargets = new Map();
  for (const e of live.filter((x) => x.mechanism === 'action filter')) {
    const list = filterTargets.get(e.target) ?? [];
    list.push(e);
    filterTargets.set(e.target, list);
  }
  for (const [target, list] of filterTargets) {
    if (list.some((e) => e.singleOwner) && list.length > 1) {
      warnings.push({
        level: 'conflict',
        target,
        message: `${target} has one owner (decision SINGLE-FILTER) but ${list.length} filters are registered.`,
        rule: 'BR-ADM-006',
      });
    }
  }
  // attempts the host refused never took effect, so they do not fail the check; they are
  // reported, because BR-ADM-001 exists so that no extension attempt is invisible
  for (const e of extensions.filter((x) => x.refused)) {
    warnings.push({
      level: 'refused',
      target: e.target,
      message: `${e.owner} (${e.feature}) tried to register a ${e.mechanism} on ${e.target}, `
        + `which ${e.conflictWith} owns. The host refused it; nothing was replaced.`,
      rule: e.rule,
      plugin: e.owner,
    });
  }
  return {
    checkedOnUtc: new Date().toISOString(),
    targets: byTarget.size,
    extensions: live.length,
    refusedAttempts: extensions.length - live.length,
    warnings,
    ok: !warnings.some((w) => w.level === 'conflict'),
  };
}

export function overrideRegister() {
  return [...overrides.values()].sort((a, b) => a.startupOrder - b.startupOrder
    || a.service.localeCompare(b.service));
}

export function registerProvider(contract, provider) {
  const list = providersByContract.get(contract) ?? [];
  list.push({ order: list.length, substitute: null, ...provider, contract });
  list.sort((a, b) => a.order - b.order);
  providersByContract.set(contract, list);
  return provider;
}

export function providers(contract) {
  return providersByContract.get(contract) ?? [];
}

export function providerRegister() {
  return [...providersByContract.entries()]
    .map(([contract, list]) => ({ contract, providers: list.map(({ fn, ...rest }) => rest) }))
    .sort((a, b) => a.contract.localeCompare(b.contract));
}

/**
 * Run every provider of a contract. `mode`:
 *   'collect'  - gather results, a thrown error becomes { error } (cart checks, validators)
 *   'notify'   - swallow every error (event consumers, L1 section 6.2 principle 8)
 *   'firstFail'- stop at the first provider that returns a failure (placement validators)
 */
export async function runProviders(contract, mode, ...args) {
  const out = [];
  for (const p of providers(contract)) {
    try {
      const result = await p.fn(...args);
      out.push({ provider: p.name, area: p.area, feature: p.feature, result });
      if (mode === 'firstFail' && result && result.ok === false) break;
    } catch (err) {
      if (mode === 'notify') continue; // consumers swallow exceptions
      out.push({
        provider: p.name, area: p.area, feature: p.feature, error: err.message, result: { ok: false, message: err.message },
      });
      if (mode === 'firstFail') break;
    }
  }
  return out;
}

export function resetProviders() {
  overrides.clear();
  providersByContract.clear();
  extensions.length = 0;
}
