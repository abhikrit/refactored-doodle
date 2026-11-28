// CHK-013 assisted checkout.
//
// BR-CHK-017 / decision SINGLE-FILTER: the acting session is started through the native Place
// order for customer and allowed by the single impersonation filter IAM-026 owns (BR-IAM-130);
// CHK adds no filter of its own. CHK-013 records the agent and the outlet once per order in
// AssistedOrder - the only order-to-agent record - and serves it to other modules through
// IC-CHK-10. The payment itself is recorded by PAY-034 with the agent's identity.

import { repository } from '../../../core/repository.js';
import { getSettingAsync } from '../../../core/settings.js';
import { auditAsync } from '../../../core/audit.js';
import { authorizeAsync } from '../../../core/permissions.js';
import { paymentMethodsForStoreAsync } from '../../product-pay/services/payments.js';

const assistedRepo = () => repository('AssistedOrder');

/**
 * AC-CHK-013-01-02: inside the placement override, the order gets its agent and outlet. IAM
 * keeps the session; this is the only record that ties an order to an agent.
 */
export async function recordAssistedOrderAsync({
  order, acting = null, storeId = 1,
}) {
  if (!acting?.agentId) return null;
  const agent = await repository('Customer').getByIdAsync(acting.agentId);
  const outlet = acting.outlet ?? acting.agentOutlet ?? agent?.outlet ?? null;
  const row = await assistedRepo().insertAsync({
    orderId: order.id,
    orderNumber: order.orderNumber,
    agentCustomerId: acting.agentId,
    agentEmail: agent?.email ?? null,
    outlet,
    outletId: agent?.outletId ?? null,
    storeId,
    createdOnUtc: new Date().toISOString(),
  });
  // the native order note names the agent as well (AUD-CHK-003)
  await repository('OrderNote').insertAsync({
    orderId: order.id,
    orderNumber: order.orderNumber,
    note: `Placed on behalf of the customer by ${agent?.email ?? 'an agent'} at ${outlet ?? 'the outlet'}.`,
    displayToCustomer: false,
    createdOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-CHK-003',
    area: 'CHK',
    feature: 'PRD-CHK-013',
    entity: 'AssistedOrder',
    entityId: row.id,
    actor: agent?.email ?? 'agent',
    actorRole: 'Agent',
    storeId,
    after: { orderNumber: order.orderNumber, agent: agent?.email ?? null, outlet },
    note: 'an order was placed for a walk-in customer',
  });
  return row;
}

/**
 * AC-CHK-013-02-01: only the methods the PAY routing rules allow for an assisted order are
 * offered. The rules are a client setting; nothing is assumed where none is set.
 */
export async function assistedPaymentMethodsAsync({ storeId = 1, multiSeller = false } = {}) {
  const methods = await paymentMethodsForStoreAsync({ storeId, multiSeller });
  const allowed = await getSettingAsync('pay.routing.assistedordermethods', storeId, null);
  if (!Array.isArray(allowed)) {
    return {
      available: methods.available,
      excluded: methods.excluded,
      routingRuleSet: false,
      note: 'no routing rule names the methods for assisted orders, so the store\'s own methods are offered',
    };
  }
  const available = methods.available.filter((m) => allowed.includes(m.systemName));
  return {
    available,
    excluded: [
      ...methods.excluded,
      ...methods.available
        .filter((m) => !allowed.includes(m.systemName))
        .map((m) => ({ ...m, reason: 'not-allowed-for-assisted', explanation: 'This method is not offered for an order placed at a counter.' })),
    ],
    routingRuleSet: true,
    ruleOwnedBy: 'PRD-PAY-024 routing rules',
  };
}

/**
 * The payment of an assisted order is PAY-034's record, taken with the agent's identity. CHK
 * only hands it the agent and outlet of the order it just placed.
 */
export async function recordAssistedPaymentAsync({
  order, payment, acting, storeId = 1,
}) {
  if (!acting?.agentId) return null;
  const agent = await repository('Customer').getByIdAsync(acting.agentId);
  return repository('AssistedPayment').insertAsync({
    orderId: order.id,
    orderNumber: order.orderNumber,
    agentCustomerId: acting.agentId,
    agentEmail: agent?.email ?? null,
    outlet: acting.outlet ?? agent?.outlet ?? null,
    systemName: payment?.systemName ?? order.paymentMethodSystemName,
    providerRef: payment?.providerRef ?? null,
    amount: order.total,
    currency: order.currency,
    recordedBy: 'PRD-PAY-034',
    storeId,
    createdOnUtc: new Date().toISOString(),
  });
}

/* ======================================================= IC-CHK-10 the read service ==== */

/** GetAssistedOrder: the agent, outlet and time of one order, or "not assisted". */
export async function getAssistedOrderAsync(orderIdOrNumber) {
  const row = await assistedRepo().getOneAsync((r) => Number(r.orderId) === Number(orderIdOrNumber)
    || r.orderNumber === String(orderIdOrNumber));
  if (!row) return { assisted: false, reason: 'not assisted' };
  return {
    assisted: true,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    agentCustomerId: row.agentCustomerId,
    agentEmail: row.agentEmail,
    outlet: row.outlet,
    placedOnUtc: row.createdOnUtc,
    servedThrough: 'IC-CHK-10',
  };
}

/** ListAssistedOrders: by agent, outlet and period. */
export async function listAssistedOrdersAsync({
  agentEmail = null, agentCustomerId = null, outlet = null, from = null, to = null,
} = {}) {
  const rows = await assistedRepo().getAllAsync((r) => (!agentEmail || r.agentEmail === agentEmail)
    && (!agentCustomerId || Number(r.agentCustomerId) === Number(agentCustomerId))
    && (!outlet || String(r.outlet) === String(outlet))
    && (!from || r.createdOnUtc >= from)
    && (!to || r.createdOnUtc <= to));
  return rows.slice().sort((a, b) => String(b.createdOnUtc).localeCompare(String(a.createdOnUtc)));
}

/**
 * AC-CHK-013-03-01: the list a supervisor reads, behind Checkout.Core.AssistedOrders.View. An
 * agent sees only their own outlet (the IAM-008 outlet scope).
 */
export async function assistedOrdersForAsync({
  actor, agentEmail = null, outlet = null, from = null, to = null,
}) {
  if (!await authorizeAsync('Checkout.Core.AssistedOrders.View', actor)) {
    return { ok: false, denied: true, permission: 'Checkout.Core.AssistedOrders.View' };
  }
  const isAgent = (actor?.roles ?? []).includes('Agent');
  const scopedOutlet = isAgent ? (actor.outlet ?? null) : outlet;
  const rows = await listAssistedOrdersAsync({
    agentEmail, outlet: scopedOutlet, from, to,
  });
  return {
    ok: true,
    rows,
    scope: isAgent ? 'outlet' : 'all outlets',
    outlet: scopedOutlet,
    scopeOwnedBy: 'PRD-IAM-008',
  };
}
