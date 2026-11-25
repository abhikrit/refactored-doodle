// The four surfaces, each reproducing its nopCommerce shell:
//   Storefront   - the DefaultClean theme: header links, search, category menu, footer columns
//   Admin        - the nopCommerce administration area: dark nav tree, canvas, panels, breadcrumb
//   Seller portal- the vendor-scoped admin area (SEL-008)
//   Outlet/agent - the assisted-service counter screens (IAM-026, CHK-013, PAY-034, LOG-012)
//
// The administration area is authenticated: an unauthenticated request to it is sent to the
// storefront login with a ReturnUrl, as nopCommerce does.

import React, { useEffect, useState } from 'react';
import {
  Link, NavLink, Navigate, useLocation,
} from 'react-router-dom';
import { useProduct, money } from '../../lib/store.jsx';
import { api } from '../../lib/api.js';
import { Badge, Button, Spinner } from './kit.jsx';

/* ------------------------------------------------------------- storefront --- */

const SURFACES = [
  { to: '/', label: 'Storefront', hint: 'DefaultClean theme' },
  { to: '/admin', label: 'Administration', hint: 'nopCommerce admin area' },
  { to: '/seller', label: 'Seller portal', hint: 'vendor-scoped' },
  { to: '/outlet', label: 'Outlet / agent', hint: 'assisted service' },
  { to: '/explorer', label: 'Product explorer', hint: '434 features, 274 screens, roles, trace' },
];


/* ------------------------------------------------------------- storefront ---- */

export function StorefrontShell({ children }) {
  const {
    content, cart, customer, entities, settings, refreshCustomer,
  } = useProduct();
  const [categories, setCategories] = useState([]);
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const currency = (entities.currencies ?? []).find((c) => c.primary) ?? (entities.currencies ?? [])[0];

  useEffect(() => { api.get('/catalogue/categories/tree').then(setCategories).catch(() => {}); }, [content?.clientName]);
  useEffect(() => {
    if (term.trim().length < 2) { setSuggestions([]); return undefined; }
    const t = setTimeout(() => {
      api.get(`/search/suggest?q=${encodeURIComponent(term)}`).then(setSuggestions).catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [term]);

  const languages = (entities.languages ?? []).filter((l) => l.published);

  return (
    <div className="min-h-full flex flex-col bg-white">
      {/* .header-upper - border-bottom 1px solid #ddd */}
      <div className="border-b border-store-border text-[12px] text-store-text">
        <div className="mx-auto max-w-[1280px] px-4 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="hidden md:inline">{content?.tagline}</span>
          <div className="ml-auto flex items-center gap-3">
            {currency && (
              <select aria-label="Currency selector" className="border border-nop-border rounded-sm px-1.5 py-0.5 text-[12px]" defaultValue={currency.code}>
                {(entities.currencies ?? []).map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            )}
            {languages.length > 1 && (
              <select aria-label="Language selector" className="border border-nop-border rounded-sm px-1.5 py-0.5 text-[12px]" defaultValue={languages[0].culture}>
                {languages.map((l) => <option key={l.culture} value={l.culture}>{l.name}</option>)}
              </select>
            )}
            {customer ? (
              <>
                <Link to="/account" className="hover:text-nop-blue">My account</Link>
                <button
                  type="button"
                  className="hover:text-nop-blue"
                  onClick={async () => { await api.post('/identity/sign-out'); refreshCustomer(); }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="hover:text-nop-blue">Register</Link>
                <Link to="/login" className="hover:text-nop-blue">Log in</Link>
              </>
            )}
            <Link to="/account/wishlist" className="hover:text-nop-blue">Wishlist</Link>
          </div>
        </div>
      </div>

      {/* .header-lower - padding 35px 0 in the theme; tightened for a 1280 canvas */}
      <div className="border-b border-store-border">
        <div className="mx-auto max-w-[1280px] px-4 py-5 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="size-9 rounded-sm grid place-items-center font-bold text-white brand-bg">
              {(content?.brand?.logoText ?? 'NC').slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[17px] font-semibold text-nop-ink leading-tight">
              {settings('storeinformationsettings.storename', 'Store')}
            </span>
          </Link>

          <div className="relative flex-1 max-w-xl mx-auto">
            <form
              onSubmit={(e) => { e.preventDefault(); window.location.assign(`/search?q=${encodeURIComponent(term)}`); }}
              className="flex"
              role="search"
            >
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search store"
                aria-label="Search store"
                className="w-full border border-store-border px-3 py-2 h-9 text-[13px] focus:border-store-accent"
              />
              <button type="submit" className="brand-bg px-5 h-9 text-[13px] font-medium uppercase tracking-wide">Search</button>
            </form>
            {suggestions.length > 0 && (
              <ul className="absolute z-40 left-0 right-0 bg-white border border-nop-border border-t-0 shadow-lg max-h-80 overflow-auto">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/product/${s.id}`}
                      onClick={() => { setTerm(''); setSuggestions([]); }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-[13px]"
                    >
                      <span className="text-gray-700 flex-1 truncate">{s.name}</span>
                      <span className="text-nop-muted text-[12px]">{s.price == null ? 'Call for price' : money(s.price, currency?.code)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link to="/cart" className="flex items-center gap-2 shrink-0 border border-store-border px-3 py-2 hover:bg-gray-50">
            <span className="text-[13px] font-medium">Shopping cart</span>
            <Badge tone="blue">{cart?.itemCount ?? 0}</Badge>
            {cart?.subtotal > 0 && <span className="hidden sm:inline text-[12px] text-nop-muted">{money(cart.subtotal, currency?.code)}</span>}
          </Link>
        </div>
      </div>

      {/* category menu */}
      <nav aria-label="Categories" className="brand-bg">
        <div className="mx-auto max-w-[1280px] px-4 flex items-center gap-1 overflow-x-auto">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.id}`}
              className="px-3 py-2.5 text-[13px] font-medium uppercase tracking-wide whitespace-nowrap hover:bg-black/15"
            >
              {c.name}
            </Link>
          ))}
          <Link to="/order-status" className="ml-auto px-3 py-2.5 text-[13px] whitespace-nowrap hover:bg-black/15">Track an order</Link>
        </div>
      </nav>

      <main className="flex-1 mx-auto max-w-[1280px] w-full px-4 py-6">{children}</main>

      <footer className="border-t border-store-border mt-8 bg-store-panel">
        <div className="mx-auto max-w-[1280px] px-4 py-8 grid gap-6 md:grid-cols-4 text-[13px]">
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Information</h3>
            <ul className="space-y-1 text-nop-muted">
              <li>Shipping and returns</li>
              <li>Privacy notice</li>
              <li>Conditions of use</li>
              <li>About us</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Customer service</h3>
            <ul className="space-y-1 text-nop-muted">
              <li>Contact us</li>
              <li><Link to="/order-status" className="hover:text-nop-blue">Order status</Link></li>
              <li>Returns</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">My account</h3>
            <ul className="space-y-1 text-nop-muted">
              <li><Link to="/account" className="hover:text-nop-blue">My account</Link></li>
              <li><Link to="/account/orders" className="hover:text-nop-blue">Orders</Link></li>
              <li><Link to="/account/addresses" className="hover:text-nop-blue">Addresses</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">Newsletter</h3>
            <div className="flex">
              <input aria-label="Newsletter e-mail" placeholder="Enter your email here..." className="w-full border border-nop-border rounded-l-sm px-2.5 py-1.5 text-[13px]" />
              <button type="button" className="border border-nop-border border-l-0 rounded-r-sm px-3 text-[13px] bg-white">Subscribe</button>
            </div>
            <p className="text-[11.5px] text-nop-muted mt-2">
              We send one e-mail a month. You can unsubscribe at any time.
            </p>
          </div>
        </div>
        <div className="border-t border-nop-border">
          <div className="mx-auto max-w-[1280px] px-4 py-3 text-[11.5px] text-nop-muted flex flex-wrap gap-x-4 gap-y-1">
            <span>{`\u00a9 ${new Date().getFullYear()} ${content?.clientName ?? ''}. All rights reserved.`}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ admin ---- */

const ADMIN_NAV = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Administration console', to: '/admin/console' },
  {
    label: 'Catalog',
    children: [
      { label: 'Products', to: '/admin/catalog/products' },
      { label: 'Bulk edit', to: '/admin/catalog/bulk-edit' },
    ],
  },
  { label: 'Customers', to: '/admin/customers' },
  {
    label: 'Configuration',
    children: [
      { label: 'Settings', to: '/admin/configuration/settings' },
      { label: 'Widgets', to: '/admin/configuration/widgets' },
      { label: 'Workflows', to: '/admin/configuration/workflows' },
      { label: 'Business rules', to: '/admin/configuration/rules' },
      { label: 'Transaction types', to: '/admin/configuration/transaction-types' },
      { label: 'Eligibility and quotas', to: '/admin/configuration/eligibility' },
      { label: 'Upload policy', to: '/admin/configuration/upload-policy' },
      { label: 'Template library', to: '/admin/configuration/templates' },
    ],
  },
  {
    label: 'Operations',
    children: [
      { label: 'Console', to: '/admin/operations' },
      { label: 'Approvals', to: '/admin/operations/approvals' },
      { label: 'Exceptions', to: '/admin/operations/exceptions' },
      { label: 'Alerts', to: '/admin/operations/alerts' },
    ],
  },
  {
    label: 'System',
    children: [
      { label: 'Schedule tasks', to: '/admin/system/schedule-tasks' },
      { label: 'Log', to: '/admin/system/log' },
      { label: 'Maintenance', to: '/admin/system/maintenance' },
      { label: 'Extension register', to: '/admin/system/extension-register' },
    ],
  },
  { label: 'Plugins', to: '/admin/plugins' },
];


/**
 * The signed-in staff account, and a way to sign in as another one.
 *
 * nopCommerce shows the account and a Logout link in the admin navbar. The picker beside it is
 * a convenience of this build: every console area is gated by the permission of the signed-in
 * role, so the picker is how a reviewer sees the gate work without a second browser.
 */
function StaffAccount() {
  const { customer, refreshCustomer } = useProduct();
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    api.get('/identity/customers')
      .then((all) => setStaff(all.filter((c) => !(c.roles ?? []).includes('Registered'))))
      .catch(() => setStaff([]));
  }, []);

  const signInAs = async (email) => {
    if (!email) await api.post('/identity/sign-out');
    else await api.post('/identity/sign-in', { email, password: 'demo' });
    await refreshCustomer();
  };

  return (
    <label className="flex items-center gap-1.5">
      <span className="text-nop-muted hidden lg:inline">Signed in as</span>
      <select
        className="border border-nop-border bg-white px-1.5 py-1 text-[12.5px] max-w-[18rem]"
        value={customer?.email ?? ''}
        onChange={(e) => signInAs(e.target.value)}
        title="Each console area is gated by the permissions of the signed-in role"
      >
        <option value="">not signed in</option>
        {staff.map((c) => (
          <option key={c.id} value={c.email}>
            {c.email}
            {' - '}
            {(c.roles ?? []).join(', ') || 'no role'}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The administration area is authenticated: Security.AccessAdminPanel.
 * nopCommerce has no administrator login page of its own - an unauthenticated request to /Admin
 * is sent to the storefront login with ReturnUrl, and a signed-in customer without the
 * permission gets Access denied. Both are reproduced here, once, for every admin route.
 */
function AdminGate({ children }) {
  const { customer } = useProduct();
  const { pathname, search } = useLocation();
  const [state, setState] = useState({ loading: true, canOpenAdmin: false });

  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    api.get('/admin-console/console')
      .then((r) => live && setState({ loading: false, canOpenAdmin: r.canOpenAdmin === true }))
      .catch(() => live && setState({ loading: false, canOpenAdmin: false }));
    return () => { live = false; };
  }, [customer?.id]);

  if (state.loading) return <div className="p-10"><Spinner label="Checking permissions" /></div>;
  if (state.canOpenAdmin) return children;
  if (!customer) return <Navigate to={`/login?returnUrl=${encodeURIComponent(pathname + search)}`} replace />;

  return (
    <div className="nop-admin min-h-full bg-nop-canvas p-6">
      <div className="max-w-2xl mx-auto bg-white border border-nop-border">
        <div className="bg-nop-red text-white px-4 py-2.5 text-[15px] font-semibold">Access denied</div>
        <div className="p-4 space-y-3 text-[13.5px] text-nop-ink">
          <p>
            You are signed in as
            {' '}
            <span className="font-mono">{customer.email}</span>
            {' '}
            (
            {(customer.roles ?? []).join(', ') || 'no role'}
            ), which does not hold
            {' '}
            <span className="font-mono">Security.AccessAdminPanel</span>
            .
          </p>
          <p className="text-nop-muted">
            IAM-007 grants the permission to the staff roles. Sign in as an account that holds it -
            admin@example.com opens all eight console areas, catalogue@example.com only Products.
          </p>
          <div className="flex gap-2">
            <Button as="link" to={`/login?returnUrl=${encodeURIComponent(pathname + search)}`} variant="brand">Sign in as another user</Button>
            <Button as="link" to="/">Public store</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children, breadcrumb }) {
  const { content, client } = useProduct();
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState(() => ADMIN_NAV
    .filter((g) => g.children?.some((c) => pathname.startsWith(c.to)))
    .map((g) => g.label));

  const toggle = (label) => setOpenGroups((g) => (g.includes(label) ? g.filter((x) => x !== label) : [...g, label]));

  return (
    <AdminGate>
      <div className="nop-admin min-h-full flex bg-nop-canvas">
      <aside className="w-60 shrink-0 bg-nop-sidebar text-gray-300 hidden md:flex md:flex-col">
        <div className="px-4 py-3 bg-nop-sidebar-dark">
          <div className="text-white font-semibold text-[14px]">nopCommerce</div>
          <div className="text-[11.5px] text-gray-400">administration</div>
        </div>
        <div className="px-4 py-3 border-b border-black/20 text-[12px]">
          <div className="text-gray-400">Store</div>
          <div className="text-white">{content?.clientName ?? client}</div>
        </div>
        <nav className="py-2 overflow-y-auto flex-1 text-[13px]">
          {ADMIN_NAV.map((g) => (g.children ? (
            <div key={g.label}>
              <button
                type="button"
                onClick={() => toggle(g.label)}
                className="w-full text-left px-4 py-2 hover:bg-nop-sidebar-hover flex items-center justify-between"
              >
                <span>{g.label}</span>
                <span className="text-gray-500 text-[11px]">{openGroups.includes(g.label) ? '▾' : '▸'}</span>
              </button>
              {openGroups.includes(g.label) && (
                <div className="bg-nop-sidebar-dark/60">
                  {g.children.map((c) => (
                    <NavLink
                      key={c.to}
                      to={c.to}
                      className={({ isActive }) => `block pl-8 pr-3 py-1.5 text-[12.5px] ${
                        isActive ? 'bg-nop-blue text-white' : 'hover:bg-nop-sidebar-hover'}`}
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={g.to}
              to={g.to}
              end={g.to === '/admin'}
              className={({ isActive }) => `block px-4 py-2 ${isActive ? 'bg-nop-blue text-white' : 'hover:bg-nop-sidebar-hover'}`}
            >
              {g.label}
            </NavLink>
          )))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-nop-border px-4 py-2 flex items-center gap-3">
          <div className="min-w-0">
            {breadcrumb}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[12.5px]">
            <Button as="link" to="/" size="sm">Public store</Button>
            <StaffAccount />
          </div>
        </header>
        <main className="flex-1 p-4 min-w-0">{children}</main>
        </div>
      </div>
    </AdminGate>
  );
}

export function AdminPage({
  title, intro, breadcrumb, actions, children,
}) {
  return (
    <AdminShell breadcrumb={breadcrumb}>
      <div className="flex flex-wrap items-start gap-3 justify-between mb-4">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-nop-ink">{title}</h1>
          {intro && <p className="text-[13px] text-nop-muted mt-1 max-w-3xl">{intro}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </AdminShell>
  );
}
