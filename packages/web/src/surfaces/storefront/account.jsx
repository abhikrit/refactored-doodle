// Storefront account screens.
//   Login / Register  IAM-001, IAM-002 (mobile number with a one-time code)
//   My account        IAM-025 customer home page, IAM-014 addresses, IAM-021 order history
//   Order details     ORD-001 buyer view, CHK-012 pickup code block, TRK-001 tracking
//   Order status      TRK-011 guest order status check

import React, { useEffect, useState } from 'react';
import {
  Link, NavLink, useNavigate, useParams,
} from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import {
  Alert, Badge, Button, Citation, Field, Grid, Input, KeyValue, Panel, Spinner,
} from '../../ui/nop/kit.jsx';

export function Login() {
  const { refreshCustomer, refreshCart, settings } = useProduct();
  const navigate = useNavigate();
  const [email, setEmail] = useState('buyer@example.com');
  const [password, setPassword] = useState('demo');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otp, setOtp] = useState(null);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const otpEnabled = settings('otpsettings.loginbyphoneenabled', false);

  useEffect(() => { api.get('/identity/customers').then(setCustomers).catch(() => {}); }, []);

  const signIn = async () => {
    const res = await api.post('/identity/sign-in', { email, password });
    if (!res.ok) { setError(res.message); return; }
    await refreshCustomer();
    await refreshCart();
    navigate('/account');
  };

  const requestOtp = async () => {
    const res = await api.post('/identity/otp/request', { phone });
    if (!res.ok) { setError(res.message); return; }
    setOtp(res);
    setError(null);
  };

  const verifyOtp = async () => {
    const res = await api.post('/identity/otp/verify', { phone, code });
    if (!res.ok) { setError(res.message); return; }
    await refreshCustomer();
    await refreshCart();
    navigate('/account');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="nop-page-title">Welcome, please sign in</h1>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Returning customer" subtitle="IAM-001 - e-mail address and password">
          <div className="space-y-3">
            <Field label="E-mail"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password" hint="Every seeded account uses the password demo (synthetic data, P-5)">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button variant="brand" onClick={signIn}>Log in</Button>
          </div>
        </Panel>

        <Panel title="Sign in with a mobile number" subtitle="IAM-002 - one-time code by SMS">
          {!otpEnabled ? (
            <Alert tone="info">
              This client has not switched on mobile-number sign-in (otpsettings.loginbyphoneenabled). Switch the client
              pack to Malawi Post, where REQ-MPC-FR-001 and FR-002 require it.
            </Alert>
          ) : (
            <div className="space-y-3">
              <Field label="Mobile number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+265880000001" /></Field>
              {!otp ? <Button variant="brand" onClick={requestOtp} disabled={!phone}>Send me a code</Button> : (
                <>
                  <Alert tone="info">
                    The code was sent through the mock SMS gateway. Prototype code: <span className="font-mono font-semibold">{otp.prototypeCode}</span>
                  </Alert>
                  <Field label="One-time code"><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
                  <Button variant="brand" onClick={verifyOtp} disabled={!code}>Verify and sign in</Button>
                </>
              )}
              <Citation>
                IAM-002: an ISmsProvider plugin plus a DI override; messagessettings.activesmsprovidersystemname selects
                it in 5.00. The gateway here is a mock (P-3) and the code is shown so the journey can be walked.
              </Citation>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Seeded accounts" subtitle="Synthetic only (P-5). Pick one to see the product through that role.">
        <Grid
          dense
          columns={[
            { key: 'email', header: 'E-mail' },
            { key: 'name', header: 'Name', render: (c) => `${c.firstName} ${c.lastName}` },
            { key: 'roles', header: 'Roles', render: (c) => <span className="flex flex-wrap gap-1">{c.roles.map((r) => <Badge key={r} tone="slate">{r}</Badge>)}</span> },
            { key: 'outlet', header: 'Outlet', render: (c) => c.outlet ?? '-' },
            {
              key: 'use',
              header: '',
              align: 'right',
              render: (c) => <Button size="sm" onClick={() => { setEmail(c.email); setPassword('demo'); }}>Use</Button>,
            },
          ]}
          rows={customers}
          rowKey={(c) => c.email}
        />
      </Panel>
    </div>
  );
}

export function Register() {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="nop-page-title">Register</h1>
      <Alert tone="warning" title="Not built in Session 0 - wave 1 Foundation">
        IAM-001 registration is a configuration feature of the native page. The prototype seeds accounts instead
        (P-5) and demonstrates mobile-number registration through the one-time code on the sign-in page (IAM-002).
      </Alert>
      <Button as="link" to="/login" variant="brand">Go to sign in</Button>
    </div>
  );
}

const ACCOUNT_NAV = [
  { to: '/account', label: 'Customer info', end: true },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/wishlist', label: 'Wishlist' },
];

function AccountLayout({ children, title }) {
  const { customer } = useProduct();
  if (!customer) {
    return (
      <div className="max-w-xl mx-auto space-y-3">
        <Alert tone="warning">Please sign in to see your account.</Alert>
        <Button as="link" to="/login" variant="brand">Log in</Button>
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="border border-nop-border rounded-sm bg-white overflow-hidden h-fit" aria-label="My account">
        <div className="px-3 py-2 bg-nop-head text-[12px] font-semibold uppercase tracking-wide text-gray-600">My account</div>
        {ACCOUNT_NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `block px-3 py-2 text-[13px] border-t border-gray-100 ${isActive ? 'brand-text font-medium bg-gray-50' : 'hover:bg-gray-50'}`}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <h1 className="nop-page-title">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function AccountInfo() {
  const { customer } = useProduct();
  return (
    <AccountLayout title="Customer info">
      <Panel>
        <KeyValue rows={[
          ['Name', `${customer?.firstName} ${customer?.lastName}`],
          ['E-mail', customer?.email],
          ['Phone', customer?.phone ?? '-'],
          ['Company', customer?.company ?? '-'],
          ['Roles', customer?.roles?.join(', ')],
          ['Credit limit', customer?.creditLimit ? money(customer.creditLimit, 'MWK') : '-'],
          customer?.acting && ['Acting session', `an agent at ${customer.acting.outlet} is acting for this customer (IAM-026)`],
        ]}
        />
        <Citation className="mt-3">
          IAM-025 customer home page and IAM-014 profile. Account data here is synthetic (P-5).
        </Citation>
      </Panel>
    </AccountLayout>
  );
}

export function AccountOrders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.get('/orders?mine=true').then(setOrders).catch(() => {}); }, []);
  return (
    <AccountLayout title="My orders">
      <Panel bodyClass="p-0">
        {!orders ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'orderNumber', header: 'Order', render: (o) => <Link to={`/account/orders/${o.orderNumber}`} className="font-mono brand-text hover:underline">{o.orderNumber}</Link> },
              { key: 'placedOnUtc', header: 'Date', render: (o) => new Date(o.placedOnUtc).toLocaleString('en-GB') },
              { key: 'vendorName', header: 'Seller' },
              { key: 'fulfilment', header: 'Fulfilment', render: (o) => <Badge tone={o.fulfilment === 'pickup' ? 'amber' : 'blue'}>{o.fulfilment}</Badge> },
              { key: 'stage', header: 'Stage', render: (o) => <Badge tone={o.stage === 'Delivered' ? 'green' : 'slate'}>{o.stage}</Badge> },
              { key: 'paymentStatus', header: 'Payment', render: (o) => <Badge tone={o.paymentStatus === 'Paid' ? 'green' : 'amber'}>{o.paymentStatus}</Badge> },
              { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.total, o.currency) },
            ]}
            rows={orders}
            rowKey={(o) => o.orderNumber}
            empty="You have not placed an order yet."
          />
        )}
      </Panel>
    </AccountLayout>
  );
}

export function AccountOrderDetails() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    api.get(`/orders/${orderNumber}`).then(async (o) => {
      setOrder(o);
      const t = o.shipments?.[0]?.trackingNumber;
      if (t) setTracking(await api.get(`/tracking/${t}`));
    }).catch(() => {});
  }, [orderNumber]);

  if (!order) return <AccountLayout title="Order"><Spinner /></AccountLayout>;

  return (
    <AccountLayout title={`Order ${order.orderNumber}`}>
      <div className="space-y-4">
        <Panel title="Order information">
          <KeyValue rows={[
            ['Order number', <span className="font-mono">{order.orderNumber}</span>],
            ['Checkout reference', <span className="font-mono">{order.checkoutReference}</span>],
            ['Placed', new Date(order.placedOnUtc).toLocaleString('en-GB')],
            ['Seller', order.vendorName],
            ['Stage', <Badge tone={order.stage === 'Delivered' ? 'green' : 'slate'}>{order.stage}</Badge>],
            ['Payment', <Badge tone={order.paymentStatus === 'Paid' ? 'green' : 'amber'}>{order.paymentStatus} · {order.paymentMethodSystemName}</Badge>],
            ['Fulfilment', order.fulfilment === 'pickup' ? `Collection at ${order.pickupPoint?.name}` : 'Home delivery'],
            ['Total', money(order.total, order.currency)],
          ]}
          />
          {order.siblings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-nop-border">
              <div className="text-[12.5px] font-semibold mb-1.5">Other sub-orders of this checkout</div>
              <ul className="text-[12.5px] space-y-1">
                {order.siblings.map((s) => (
                  <li key={s.orderNumber} className="flex items-center gap-2">
                    <Link to={`/account/orders/${s.orderNumber}`} className="font-mono brand-text hover:underline">{s.orderNumber}</Link>
                    <span className="text-nop-muted">{s.vendorName} · {s.stage}</span>
                    <span className="ml-auto">{money(s.total, order.currency)}</span>
                  </li>
                ))}
              </ul>
              <Citation className="mt-2">
                CHK-004: one payment for the checkout, one sub-order per seller and fulfilment choice, all under the one
                checkout reference.
              </Citation>
            </div>
          )}
        </Panel>

        {order.hasPickupCode && (
          <Panel title="Collection">
            <Alert tone={order.pickupCodeUsed ? 'success' : 'info'}>
              {order.pickupCodeUsed
                ? 'This order has been collected: the pickup code was used at the outlet.'
                : `Bring your pickup code to ${order.pickupPoint?.name}. It is single use and was sent to you by SMS.`}
            </Alert>
            <Citation className="mt-2">
              CHK-012 pickup code / QR; the code itself is stored only as a hash (BR-CHK-016) and is verified in the
              LOG-012 handover step.
            </Citation>
          </Panel>
        )}

        <Panel title="Products" bodyClass="p-0">
          <Grid
            columns={[
              { key: 'productName', header: 'Product' },
              { key: 'sku', header: 'SKU', render: (i) => <span className="font-mono text-[12px]">{i.sku}</span> },
              { key: 'quantity', header: 'Qty', align: 'right' },
              { key: 'unitPrice', header: 'Unit price', align: 'right', render: (i) => money(i.unitPrice, order.currency) },
              { key: 'subtotal', header: 'Total', align: 'right', render: (i) => money(i.subtotal, order.currency) },
            ]}
            rows={order.items}
            rowKey={(i) => i.id}
          />
        </Panel>

        {tracking && (
          <Panel title="Tracking" subtitle={`${tracking.carrier} · ${tracking.trackingNumber} (TRK-001)`}>
            <ol className="relative border-l border-nop-border ml-2 space-y-3">
              {tracking.events.map((e) => (
                <li key={e.id} className="pl-4">
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-nop-blue" />
                  <div className="text-[13px] font-medium">{e.description}</div>
                  <div className="text-[12px] text-nop-muted">{e.location} · {new Date(e.occurredOnUtc).toLocaleString('en-GB')} · {e.code}</div>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>
    </AccountLayout>
  );
}

export function AccountAddresses() {
  const { customer } = useProduct();
  return (
    <AccountLayout title="Addresses">
      <Panel>
        {(customer?.addresses ?? []).length === 0 ? (
          <Alert tone="info">No address has been saved yet.</Alert>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {customer.addresses.map((a, i) => (
              <li key={i} className="border border-nop-border rounded-sm p-3 text-[13px]">
                <div className="font-medium">{a.firstName} {a.lastName}</div>
                <div className="text-nop-muted">{a.addressLine1}</div>
                {a.landmark && <div className="text-nop-muted">Landmark: {a.landmark}</div>}
                <div className="text-nop-muted">{a.city}{a.county ? `, ${a.county}` : ''}{a.country ? `, ${a.country}` : ''}</div>
                {a.phone && <div className="text-nop-muted">{a.phone}</div>}
              </li>
            ))}
          </ul>
        )}
        <Citation className="mt-3">
          IAM-014 address book; CHK-007 adds the landmark, address name, PO box and map pin attributes.
        </Citation>
      </Panel>
    </AccountLayout>
  );
}

export function AccountWishlist() {
  return (
    <AccountLayout title="Wishlist">
      <Alert tone="warning" title="Not built in Session 0 - wave 2 Catalogue">
        SRC-010 wish list. The saved-for-later list on the cart page is built, because CHK-001 requires it
        (AC-CHK-001-03-01 uses a native CustomWishlist).
      </Alert>
    </AccountLayout>
  );
}

export function OrderStatus() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState(null);

  const check = async () => {
    setResult(await api.get(`/tracking/guest-status?orderNumber=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact)}`));
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="nop-page-title">Check an order</h1>
      <Panel subtitle="TRK-011 order status check for guests">
        <div className="space-y-3">
          <Field label="Order number" required><Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="KTDA-2026-000001" /></Field>
          <Field label="E-mail or phone used on the order" required><Input value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
          <Button variant="brand" onClick={check} disabled={!orderNumber || !contact}>Check</Button>
        </div>
        {result && (
          <div className="mt-4">
            {result.found ? (
              <Alert tone="success" title={`Order ${result.orderNumber}`}>
                Stage {result.stage} · payment {result.paymentStatus}
                {result.trackingNumber && <> · tracking <Link className="underline" to={`/track/${result.trackingNumber}`}>{result.trackingNumber}</Link></>}
              </Alert>
            ) : (
              <Alert tone="warning">{result.reason ?? 'No order was found for those details.'}</Alert>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function PublicTracking() {
  const { trackingNumber } = useParams();
  const [tracking, setTracking] = useState(null);
  useEffect(() => { api.get(`/tracking/${trackingNumber}`).then(setTracking).catch(() => {}); }, [trackingNumber]);
  if (!tracking) return <Spinner />;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="nop-page-title">Tracking {trackingNumber}</h1>
      {!tracking.found ? <Alert tone="warning">No shipment was found for that number.</Alert> : (
        <Panel title={`${tracking.carrier} · ${tracking.order?.orderNumber}`}>
          <ol className="relative border-l border-nop-border ml-2 space-y-3">
            {tracking.events.map((e) => (
              <li key={e.id} className="pl-4">
                <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-nop-blue" />
                <div className="text-[13px] font-medium">{e.description}</div>
                <div className="text-[12px] text-nop-muted">{e.location} · {new Date(e.occurredOnUtc).toLocaleString('en-GB')} · {e.code}</div>
              </li>
            ))}
          </ol>
          <Citation className="mt-3">
            TRK-001 shipment tracking; TRK-002 normalises carrier codes to the event dictionary. The carrier feed is a
            mock (P-3).
          </Citation>
        </Panel>
      )}
    </div>
  );
}
