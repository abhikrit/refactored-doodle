// ILocker with the named keys the PRD states (BR-CHK-010, BR-CHK-018, BR-CHK-020, ...).
//
// Single-node only, which is what P1 requires: decision SINGLE-NODE, L1 section 6.4 -
// "until PLT-027 idempotency keys (P2) are delivered, a client serves checkout from one web node".
// The native order-placement lock (OrderSettings.PlaceOrderWithLock) is a host-local Mutex in
// 5.00.1 (OrderProcessingService.cs:1681-1717), so a single-process lock is the faithful stand-in.

const held = new Map(); // key -> promise chain tail
const history = [];

/** Named lock keys used by the prototype, as the PRD writes them. */
export const lockKey = {
  orderPlacement: (customerId) => `nop-order-placement-${customerId}`,
  deliverySlot: (slotId, date) => `chk-slot-${slotId}-${date}`,
  credit: (creditAccountId) => `chk-credit-${creditAccountId}`,
  wallet: (walletId) => `pay-wallet-${walletId}`,
  quota: (quotaId) => `adm-quota-${quotaId}`,
  discount: (discountId) => `mkt-discount-${discountId}`,
  scheme: (schemeId) => `fin-scheme-${schemeId}`,
  inventory: (productId, warehouseId) => `inv-stock-${productId}-${warehouseId ?? 0}`,
};

/** PerformActionWithLockAsync: serialises work under a named key. */
export async function withLockAsync(key, action) {
  const previous = held.get(key) ?? Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  held.set(key, previous.then(() => current));
  await previous;
  const startedAt = new Date().toISOString();
  try {
    return await action();
  } finally {
    history.push({ key, startedAt, endedAt: new Date().toISOString() });
    if (history.length > 500) history.shift();
    release();
    if (held.get(key) === current) held.delete(key);
  }
}

export function lockHistory() {
  return history.slice().reverse();
}
