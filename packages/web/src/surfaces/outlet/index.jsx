// Outlet / agent counter screens.
//   Assisted order      CHK-013 (acting session started by the single IAM-026 filter)
//   Pickup handover     LOG-012 proof of delivery, which calls CHK-012 to check the code
//   Cash at the counter PAY-008 / PAY-034 (receipt and end-of-shift cash-up is wave 3)

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import {
  Alert, Badge, Button, Citation, Field, Grid, Input, KeyValue, Panel, Select, Spinner,
} from '../../ui/nop/kit.jsx';

function OutletShell({ children }) {
  const { content } = useProduct();
  return (
    <div className="min-h-full bg-nop-canvas">
      <div className="brand-bg">
        <div className="mx-auto max-w-[1100px] px-4 py-3 flex items-center gap-3">
          <div>
            <div className="font-semibold">Outlet counter</div>
            <div className="text-[11.5px] opacity-90">{content?.clientName} · assisted service (IAM-026, CHK-013, PAY-034, LOG-012)</div>
          </div>
          <Button as="link" to="/" size="sm" className="ml-auto">Public store</Button>
        </div>
      </div>
      <main className="mx-auto max-w-[1100px] px-4 py-5 space-y-4">{children}</main>
    </div>
  );
}

export function OutletCounter() {
  const { customer, refreshCustomer, refreshCart, settings } = useProduct();
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentEmail, setAgentEmail] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  // handover
  const [orders, setOrders] = useState([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [code, setCode] = useState('');
  const [handover, setHandover] = useState(null);

  const load = () => {
    api.get('/identity/customers').then((cs) => {
      setCustomers(cs.filter((c) => !c.roles.some((r) => ['Administrators', 'PlatformTeam', 'Agent'].includes(r))));
      const ag = cs.filter((c) => c.roles.includes('Agent'));
      setAgents(ag);
      if (ag[0] && !agentEmail) setAgentEmail(ag[0].email);
    }).catch(() => {});
    api.get('/orders').then((os) => setOrders(os.filter((o) => o.fulfilment === 'pickup'))).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const start = async () => {
    setError(null);
    const res = await api.post('/identity/acting-session', { agentEmail, customerEmail });
    if (!res.ok) { setError(res.message); return; }
    setActing(res);
    await refreshCustomer();
    await refreshCart();
  };

  const doHandover = async () => {
    const order = orders.find((o) => o.orderNumber === orderNumber);
    const res = await api.post('/logistics/handover', {
      orderNumber, code, pickupPointId: order?.pickupPointId, actor: agentEmail || 'agent',
    });
    setHandover(res);
    load();
  };

  const cashAtOutlet = (settings('paymentsettings.activepaymentmethodsystemnames', []) ?? []).includes('Payments.CashAtOutlet');

  return (
    <OutletShell>
      {agents.length === 0 && (
        <Alert tone="warning" title="This client pack has no outlet agents">
          Agents and outlet assignment are an Assisted service pack setting (IAM-026). Switch the client pack to
          Malawi Post, where named agents and assisted registration are required (REQ-MPC-FR-014, FR-025).
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Place an order for a walk-in customer" subtitle="CHK-013 assisted checkout">
          {error && <div className="mb-3"><Alert tone="error">{error}</Alert></div>}
          <div className="space-y-3">
            <Field label="Agent" hint="BR-IAM-130 / decision SINGLE-FILTER: one filter guards Place order for customer">
              <Select value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)}>
                <option value="">Choose an agent…</option>
                {agents.map((a) => <option key={a.email} value={a.email}>{a.firstName} {a.lastName} - {a.outlet}</option>)}
              </Select>
            </Field>
            <Field label="Customer" hint="Agents act only for non-staff customers of their own outlet (IAM-008 scope)">
              <Select value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}>
                <option value="">Choose a customer…</option>
                {customers.map((c) => <option key={c.email} value={c.email}>{c.firstName} {c.lastName} - {c.email}</option>)}
              </Select>
            </Field>
            <Button variant="brand" onClick={start} disabled={!agentEmail || !customerEmail}>Start acting session</Button>
          </div>
          {acting && (
            <div className="mt-4">
              <Alert tone="success" title={`Acting for ${acting.customer.firstName} ${acting.customer.lastName}`}>
                {acting.agent.firstName} {acting.agent.lastName} at {acting.outlet}. The agent and outlet are recorded once
                per order in AssistedOrder (BR-CHK-017) and the order carries them into the audit trail.
              </Alert>
              <div className="mt-2 flex gap-2">
                <Button as="link" to="/search" variant="primary">Shop for this customer</Button>
                <Button as="link" to="/cart">Open the cart</Button>
              </div>
            </div>
          )}
          {customer?.acting && !acting && (
            <Alert tone="info" title="An acting session is open">
              An agent at {customer.acting.outlet} is acting for {customer.firstName} {customer.lastName}.
            </Alert>
          )}
          {cashAtOutlet && (
            <Citation className="mt-3">
              This client offers cash at the counter (PAY-008): the order is placed Pending and finance or the agent
              confirms the cash against the reference (PAY-036, PAY-034 receipt and end-of-shift cash-up is wave 3).
            </Citation>
          )}
        </Panel>

        <Panel title="Hand over a collection" subtitle="LOG-012 proof of delivery; the code is checked by CHK-012 (IC-CHK-09)">
          <div className="space-y-3">
            <Field label="Order number">
              <Select value={orderNumber} onChange={(e) => { setOrderNumber(e.target.value); setHandover(null); }}>
                <option value="">Choose a collection order…</option>
                {orders.map((o) => (
                  <option key={o.orderNumber} value={o.orderNumber}>
                    {o.orderNumber} - {o.customerName} - {o.stage}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Pickup code" hint="Single use, bound to this order and outlet, stored only as a hash (BR-CHK-016)">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 digits" className="font-mono text-[18px] tracking-widest" />
            </Field>
            <Button variant="brand" onClick={doHandover} disabled={!orderNumber || !code}>Verify and hand over</Button>
          </div>
          {handover && (
            <div className="mt-4">
              {handover.ok
                ? <Alert tone="success" title="Handed over">Proof of delivery captured; the order moved to {handover.stage?.order?.stage}. The code is now used.</Alert>
                : <Alert tone="error" title="Refused">{handover.message}</Alert>}
            </div>
          )}
          <Citation className="mt-3">
            BR-CHK-016: the code is locked after the configured number of failed attempts
            (Chk.PickupCodeLocked: "Too many wrong codes. Check the customer's identity before handing over.").
            The limit is a client setting and is not stated in the Malawi Post source.
          </Citation>
        </Panel>
      </div>

      <Panel title="Collections waiting at outlets" bodyClass="p-0">
        <Grid
          dense
          columns={[
            { key: 'orderNumber', header: 'Order', render: (o) => <Link to={`/admin/sales/orders/${o.orderNumber}`} className="font-mono text-[12px] text-nop-blue hover:underline">{o.orderNumber}</Link> },
            { key: 'customerName', header: 'Customer' },
            { key: 'vendorName', header: 'Seller' },
            { key: 'stage', header: 'Stage', render: (o) => <Badge tone={o.stage === 'Delivered' ? 'green' : 'slate'}>{o.stage}</Badge> },
            { key: 'paymentStatus', header: 'Payment', render: (o) => <Badge tone={o.paymentStatus === 'Paid' ? 'green' : 'amber'}>{o.paymentStatus}</Badge> },
            { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.total, o.currency) },
          ]}
          rows={orders}
          rowKey={(o) => o.orderNumber}
          empty="No collection order yet. Place one on the storefront with an item collected at an outlet."
        />
      </Panel>
    </OutletShell>
  );
}
