// Storefront account screens.
//   Login / Register  IAM-001, IAM-002 (mobile number with a one-time code)
//   My account        IAM-025 customer home page, IAM-014 addresses, IAM-021 order history
//   Order details     ORD-001 buyer view, CHK-012 pickup code block, TRK-001 tracking
//   Order status      TRK-011 guest order status check

import React, { useEffect, useState } from 'react';
import {
  Link, NavLink, useNavigate, useParams, useSearchParams,
} from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import {
  Alert, Badge, Button, Checkbox, Field, Grid, Input, KeyValue, Panel, Spinner,
} from '../../ui/nop/kit.jsx';

/**
 * Login - Presentation/Nop.Web/Views/Customer/Login.cshtml in the DefaultClean theme:
 * page title "Welcome, Please Sign In!", then .customer-blocks with the New Customer block
 * beside the Returning Customer fieldset (Email, Password, Remember me?, Forgot password?,
 * LOG IN), with the mobile-number block the store adds below it.
 *
 * nopCommerce has no separate administrator login: /Admin is an authenticated area, so an
 * unauthenticated request to it is sent to this same page with ReturnUrl, and the user lands in
 * the administration area once signed in.
 */
export function Login() {
  const { refreshCustomer, refreshCart, settings } = useProduct();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo');
  const [remember, setRemember] = useState(true);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otp, setOtp] = useState(null);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const otpEnabled = settings('otpsettings.loginbyphoneenabled', false);

  useEffect(() => { api.get('/identity/customers').then(setCustomers).catch(() => {}); }, []);

  // Where the user lands after signing in: ReturnUrl when the admin area (or any page) sent them
  // here, otherwise the administration area for a user who may open it, else the home page.
  const landAfterSignIn = async () => {
    await refreshCustomer();
    await refreshCart();
    if (returnUrl) { navigate(returnUrl); return; }
    let canOpenAdmin = false;
    try { canOpenAdmin = (await api.get('/admin-console/console')).canOpenAdmin === true; } catch { /* storefront customer */ }
    navigate(canOpenAdmin ? '/admin' : '/');
  };

  const signIn = async (e) => {
    e?.preventDefault?.();
    const res = await api.post('/identity/sign-in', { email, password });
    if (!res.ok) { setError(res.message); return; }
    await landAfterSignIn();
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
    await landAfterSignIn();
  };

  const staff = customers.filter((c) => !(c.roles ?? []).includes('Registered'));
  const shoppers = customers.filter((c) => (c.roles ?? []).includes('Registered'));

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="nop-page-title">Welcome, Please Sign In!</h1>

      {returnUrl && (
        <div className="mb-5">
          <Alert tone="info" title="Sign-in required">
            <span className="font-mono text-[12.5px]">{returnUrl}</span> is an authenticated area. nopCommerce has no
            separate administrator login: sign in here and you are taken back there.
          </Alert>
        </div>
      )}
      {error && <div className="mb-5"><Alert tone="error">{error}</Alert></div>}

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* .new-wrapper .register-block */}
        <div className="border border-store-border">
          <div className="nop-block-title">New Customer</div>
          <div className="p-5 text-[14px] text-store-dark space-y-3">
            <p>Registration is free and easy.</p>
            <ul className="list-disc pl-5 space-y-1 text-store-text">
              <li>Faster checkout</li>
              <li>Save multiple shipping addresses</li>
              <li>View and track orders and more</li>
            </ul>
            <button type="button" className="nop-button" onClick={() => navigate('/register')}>Register</button>
          </div>
        </div>

        {/* .returning-wrapper .fieldset */}
        <form className="border border-store-border" onSubmit={signIn}>
          <div className="nop-block-title">Returning Customer</div>
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="w-28 text-[14px] text-store-dark" htmlFor="login-email">Email:</label>
              <Input id="login-email" className="flex-1 min-w-[12rem]" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="w-28 text-[14px] text-store-dark" htmlFor="login-password">Password:</label>
              <Input id="login-password" className="flex-1 min-w-[12rem]" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pl-0 sm:pl-[7.75rem]">
              <Checkbox label="Remember me?" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <button
                type="button"
                className="text-[13px] text-store-accent hover:underline"
                onClick={() => setError('Password recovery is not switched on for this store yet. Every demonstration account uses the password demo.')}
              >
                Forgot password?
              </button>
            </div>
            <div className="pt-1">
              <button type="submit" className="nop-button">Log in</button>
            </div>
          </div>
        </form>
      </div>

      {/* sign in with a mobile number and a one-time code */}
      <div className="mt-6 border border-store-border">
        <div className="nop-block-title">Sign in with a mobile number</div>
        <div className="p-5">
          {!otpEnabled ? (
            <Alert tone="info">
              This client has not switched on mobile-number sign-in (otpsettings.loginbyphoneenabled). Switch the client
              pack to Malawi Post, where REQ-MPC-FR-001 and FR-002 require it.
            </Alert>
          ) : (
            <div className="space-y-3 max-w-md">
              <Field label="Mobile number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+265880000001" /></Field>
              {!otp ? <button type="button" className="nop-button" onClick={requestOtp} disabled={!phone}>Send me a code</button> : (
                <>
                  <Alert tone="info">
                    The code was sent through the mock SMS gateway. Prototype code: <span className="font-mono font-semibold">{otp.prototypeCode}</span>
                  </Alert>
                  <Field label="One-time code"><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
                  <button type="button" className="nop-button" onClick={verifyOtp} disabled={!code}>Verify and sign in</button>
                </>
              )}
</div>
          )}
        </div>
      </div>

      {/* prototype chrome, not a nopCommerce screen */}
      <div className="mt-6 border border-dashed border-store-border bg-store-panel">
        <button
          type="button"
          className="w-full text-left px-4 py-2.5 text-[13px] text-store-text hover:text-store-dark"
          onClick={() => setShowAccounts((v) => !v)}
        >
          {showAccounts ? '-' : '+'}
          {' '}
          Demonstration accounts - every account uses the password
          {' '}
          <span className="font-mono">demo</span>
        </button>
        {showAccounts && (
          <div className="px-4 pb-4 space-y-4">
            {[['Staff - these open the administration area', staff], ['Shoppers', shoppers]].map(([label, rows]) => (
              <div key={label}>
                <div className="text-[12.5px] font-semibold text-store-dark mb-1">{label}</div>
                <Grid
                  dense
                  columns={[
                    { key: 'email', header: 'E-mail' },
                    { key: 'name', header: 'Name', render: (c) => `${c.firstName} ${c.lastName}` },
                    { key: 'roles', header: 'Roles', render: (c) => <span className="flex flex-wrap gap-1">{(c.roles ?? []).map((r) => <Badge key={r} tone="slate">{r}</Badge>)}</span> },
                    {
                      key: 'use',
                      header: '',
                      align: 'right',
                      render: (c) => <Button size="sm" onClick={() => { setEmail(c.email); setPassword('demo'); setError(null); }}>Use</Button>,
                    },
                  ]}
                  rows={rows}
                  rowKey={(c) => c.email}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Register() {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="nop-page-title">Register</h1>
      <Alert tone="info" title="Registration is not open yet">
        This store registers customers by mobile number. Use the one-time code on the sign-in page, or ask an
        outlet agent to open an account for you.
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
          customer?.acting && ['Acting session', `An agent at ${customer.acting.outlet} is acting for this customer`],
        ]}
        />
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
</Panel>
      )}
    </div>
  );
}
