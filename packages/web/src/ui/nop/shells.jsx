// The four surfaces, each reproducing its nopCommerce shell:
//   Storefront   - the DefaultClean theme: header links, search, category menu, footer columns
//   Admin        - the nopCommerce administration area: dark nav tree, canvas, panels, breadcrumb
//   Seller portal- the vendor-scoped admin area (SEL-008)
//   Outlet/agent - the assisted-service counter screens (IAM-026, CHK-013, PAY-034, LOG-012)
//
// Above them sits one bar that belongs to the prototype, not to nopCommerce: it switches surface
// and client pack. It is labelled as prototype chrome so nobody mistakes it for a product screen.

import React, { useEffect, useState } from 'react';
import {
  Link, NavLink, Navigate, useLocation,
} from 'react-router-dom';
import { useProduct, money } from '../../lib/store.jsx';
import { api } from '../../lib/api.js';
import { Badge, Button, Spinner } from './kit.jsx';

/* ------------------------------------------------------- prototype control --- */

const SURFACES = [
  { to: '/', label: 'Storefront', hint: 'DefaultClean theme' },
  { to: '/admin', label: 'Administration', hint: 'nopCommerce admin area' },
  { to: '/seller', label: 'Seller portal', hint: 'vendor-scoped' },
  { to: '/outlet', label: 'Outlet / agent', hint: 'assisted service' },
  { to: '/explorer', label: 'Product explorer', hint: '434 features, 274 screens, roles, trace' },
];

export function PrototypeBar() {
  const {
    clients, client, switchClient, busy, meta, content,
  } = useProduct();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const activeSurface = SURFACES.slice().reverse().find((s) => (s.to === '/' ? pathname === '/' : pathname.startsWith(s.to)));

  return (
    <div className="bg-nop-sidebar-dark text-gray-300 text-[12px] no-print">
      <div className="mx-auto max-w-[1600px] px-4 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="font-semibold text-white tracking-wide">UI/UX prototype</span>
        <span className="hidden sm:inline text-gray-500">nopCommerce {meta?.baseline?.tag ?? 'release-5.00.1'} replicated in React + Node + Tailwind - no .NET, no database</span>

        <nav className="flex items-center gap-1 ml-auto order-3 lg:order-none w-full lg:w-auto overflow-x-auto">
          {SURFACES.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.to === '/'}
              title={s.hint}
              className={({ isActive }) => `px-2 py-1 rounded-sm whitespace-nowrap ${
                (s.to === '/' ? pathname === '/' : pathname.startsWith(s.to)) || isActive
                  ? 'bg-nop-blue text-white' : 'hover:bg-nop-sidebar-hover'}`}
            >
              {s.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">Client pack</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 bg-nop-sidebar px-2.5 py-1 rounded-sm text-white hover:bg-nop-sidebar-hover"
            >
              <span className="size-2.5 rounded-full" style={{ background: 'var(--brand)' }} />
              {content?.clientName ?? client ?? '-'}
              <span className="text-gray-400">▾</span>
            </button>
            {open && (
              <div className="absolute right-0 z-50 mt-1 w-80 bg-white text-nop-ink border border-nop-border rounded-sm shadow-lg p-2">
                <p className="text-[11.5px] text-nop-muted px-1 pb-2">
                  Applying a pack re-merges global → country → vertical → client → store (BR-PLT-010) and re-seeds.
                  No code path changes - that is the Product Goal.
                </p>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy}
                    onClick={async () => { setOpen(false); await switchClient(c.id); }}
                    className={`w-full text-left px-2 py-2 rounded-sm hover:bg-gray-50 ${c.id === client ? 'bg-sky-50' : ''}`}
                  >
                    <span className="font-medium text-[13px]">{c.name}</span>
                    <span className="block text-[11.5px] text-nop-muted">
                      country {c.country} · {c.verticals.length} vertical packs
                      {c.id === client ? ' · active' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {busy && <span className="text-nop-amber">applying…</span>}
        </div>
      </div>
      {activeSurface && (
        <div className="lg:hidden bg-nop-sidebar px-4 py-1 text-[11px] text-gray-400">{activeSurface.hint}</div>
      )}
    </div>
  );
}

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
              Prototype: no e-mail is sent. Newsletter is MKT-005, built in wave 5.
            </p>
          </div>
        </div>
        <div className="border-t border-nop-border">
          <div className="mx-auto max-w-[1280px] px-4 py-3 text-[11.5px] text-nop-muted flex flex-wrap gap-x-4 gap-y-1">
            <span>{content?.clientName} - synthetic demonstration data only (decision P-5).</span>
            <span className="ml-auto">Powered by the reusable nopCommerce 5.00.1 product (prototype)</span>
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
      { label: 'Categories', to: '/admin/catalog/categories' },
      { label: 'Price lists', to: '/admin/catalog/price-lists' },
    ],
  },
  {
    label: 'Sales',
    children: [
      { label: 'Orders', to: '/admin/sales/orders' },
      { label: 'Shipments', to: '/admin/sales/shipments' },
      { label: 'Payment transactions', to: '/admin/sales/payments' },
      { label: 'Checkout exceptions', to: '/admin/sales/checkout-exceptions' },
    ],
  },
  {
    label: 'Customers',
    children: [
      { label: 'Customers', to: '/admin/customers' },
      { label: 'Customer roles', to: '/admin/customers/roles' },
      { label: 'Vendors', to: '/admin/customers/vendors' },
    ],
  },
  {
    label: 'Configuration',
    children: [
      { label: 'Settings (all settings)', to: '/admin/configuration/settings' },
      { label: 'Widgets', to: '/admin/configuration/widgets' },
      { label: 'Configuration packs', to: '/admin/configuration/packs' },
      { label: 'Feature registry', to: '/admin/configuration/features' },
      { label: 'Stores', to: '/admin/configuration/stores' },
      { label: 'Languages', to: '/admin/configuration/languages' },
      { label: 'Currencies', to: '/admin/configuration/currencies' },
      { label: 'Payment methods', to: '/admin/configuration/payment-methods' },
      { label: 'Shipping methods', to: '/admin/configuration/shipping-methods' },
      { label: 'Access control list', to: '/admin/configuration/acl' },
      { label: 'Message templates', to: '/admin/configuration/message-templates' },
    ],
  },
  {
    label: 'System',
    children: [
      { label: 'Schedule tasks', to: '/admin/system/schedule-tasks' },
      { label: 'Log', to: '/admin/system/log' },
      { label: 'Maintenance', to: '/admin/system/maintenance' },
      { label: 'Extension register', to: '/admin/system/extension-register' },
      { label: 'Audit trail', to: '/admin/system/audit' },
      { label: 'Message queue', to: '/admin/system/messages' },
      { label: 'Tracking hub', to: '/admin/system/tracking' },
      { label: 'Mocks console', to: '/admin/system/mocks' },
      { label: 'Diagnostics', to: '/admin/system/diagnostics' },
    ],
  },
  { label: 'Local plugins', to: '/admin/plugins' },
  { label: 'Screens (274)', to: '/admin/screens' },
];

/**
 * The signed-in staff account, and a way to sign in as another one.
 *
 * nopCommerce shows the account and a Logout link in the admin navbar. The picker beside it is
 * prototype chrome: the console areas are gated by the native permission of the signed-in role
 * (AC-ADM-001-01-01), so the only way to see the gate work is to change role. Roles are the
 * IAM-007 staff roles from the seed, not invented ones.
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
        title="Prototype staff sign-in - the console areas are gated by the role's native permissions"
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
