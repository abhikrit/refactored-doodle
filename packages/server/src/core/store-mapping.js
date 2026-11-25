// StoreMappingService - native nopCommerce 5.00.1 semantics (Libraries/Nop.Services/Stores).
//
// An entity with LimitedToStores = false is available in every store; one with the flag set is
// available only in the stores its StoreMapping rows name. PRD-PLT-013 configures this and owns
// the read side of the service (OVR-REG); PRD-SEC-004 owns the save side, because SaveStoreMappings
// writes through INopDataProvider, which the audit decorator never sees (BR-SEC-011).

import { repository } from './repository.js';

const mapRepo = () => repository('StoreMapping');

/** The stores an entity is mapped to. An empty list means "every store". */
export async function storesForAsync(entityName, entityId) {
  const rows = await mapRepo().getAllAsync((r) => r.entityName === entityName && Number(r.entityId) === Number(entityId));
  return rows.map((r) => Number(r.storeId)).sort((a, b) => a - b);
}

/** AuthorizeAsync: is this entity available in that store? */
export async function authorizedForStoreAsync(entityName, row, storeId) {
  if (!row) return false;
  if (row.limitedToStores !== true) return true;
  const stores = await storesForAsync(entityName, row.id);
  if (stores.length === 0) return true;
  return stores.includes(Number(storeId));
}

/** The same check over a list, used by every store-scoped read. */
export async function filterForStoreAsync(entityName, rows, storeId) {
  const out = [];
  for (const row of rows) {
    if (await authorizedForStoreAsync(entityName, row, storeId)) out.push(row);
  }
  return out;
}
