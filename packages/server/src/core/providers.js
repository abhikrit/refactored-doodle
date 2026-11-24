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

export function claimOverride(service, { owner, feature, startupOrder = 3000, note = '' }) {
  const existing = overrides.get(service);
  if (existing && existing.owner !== owner) {
    throw new Error(
      `OVR-REG violation: ${service} is already owned by ${existing.owner} (${existing.feature}); `
      + `${owner} (${feature}) may only plug in through the owner's contract`,
    );
  }
  overrides.set(service, { service, owner, feature, startupOrder, note });
  return overrides.get(service);
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
}
