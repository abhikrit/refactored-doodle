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
import {
  Badge, Button, ProductPicture, Spinner,
} from './kit.jsx';
import { CookieBanner } from '../../surfaces/storefront/cookies.jsx';

/* ------------------------------------------------------------- storefront --- */

const SURFACES = [
  { to: '/', label: 'Storefront', hint: 'DefaultClean theme' },
  { to: '/admin', label: 'Administration', hint: 'nopCommerce admin area' },
  { to: '/seller', label: 'Seller portal', hint: 'vendor-scoped' },
  { to: '/outlet', label: 'Outlet / agent', hint: 'assisted service' },
  { to: '/explorer', label: 'Product explorer', hint: '434 features, 274 screens, roles, trace' },
];


/* ------------------------------------------------------------- storefront ---- */

/** PRD-TRK-009: what staff, or a quiet tracking source, put at the top of every page. */
function ServiceBanners() {
  const [banners, setBanners] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const { pathname } = useLocation();

  useEffect(() => {
    let live = true;
    api.get('/tracking-hub/banners/active')
      .then((r) => live && setBanners(r.banners ?? []))
      .catch(() => {});
    return () => { live = false; };
  }, [pathname]);

  const showing = banners.filter((b) => !dismissed.includes(b.id));
  if (showing.length === 0) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      {showing.map((banner) => (
        <div key={banner.id} className="mx-auto max-w-[1280px] px-4 py-2 flex items-start gap-3">
          <p className="text-[13px] text-amber-900 flex-1">{banner.text}</p>
          <button
            type="button"
            className="text-[12px] text-amber-900/70 hover:text-amber-900"
            onClick={() => setDismissed((d) => [...d, banner.id])}
          >
            Hide
          </button>
        </div>
      ))}
    </div>
  );
}

/** PRD-TRK-008: the bell and its list, in the header links. */
function NotificationBell() {
  const { customer } = useProduct();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);

  const refresh = async () => {
    if (!customer) return;
    const count = await api.get('/tracking-hub/feed/count').catch(() => null);
    setUnread(count?.unread ?? 0);
  };

  useEffect(() => { refresh(); }, [customer?.id, pathname]);

  const openList = async () => {
    setOpen((o) => !o);
    if (open) return;
    const feed = await api.get('/tracking-hub/feed').catch(() => null);
    setRows(feed?.notifications ?? []);
  };

  if (!customer) return null;
  return (
    <div className="relative">
      <button type="button" onClick={openList} className="relative text-store-text hover:underline" aria-label="Notifications">
        <span aria-hidden>Updates</span>
        {unread > 0 && (
          <span className="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 rounded-full brand-bg text-white text-[10px] leading-4 text-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-[min(22rem,calc(100vw-2rem))] bg-white border border-nop-border rounded-sm shadow-lg">
          <div className="px-3 py-2 border-b border-nop-border text-[13px] font-semibold">Your updates</div>
          <div className="max-h-[60vh] overflow-y-auto">
            {rows.length === 0 && <p className="px-3 py-3 text-[12.5px] text-nop-muted">Nothing new.</p>}
            {rows.map((row) => (
              <div key={row.id} className={`px-3 py-2 border-b border-gray-100 ${row.status === 'Unread' ? 'bg-sky-50/60' : ''}`}>
                <p className="text-[12.5px] text-store-text">{row.text}</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[11.5px] text-nop-muted">{new Date(row.at).toLocaleString('en-GB')}</span>
                  {row.link && (
                    <Link
                      to={row.link}
                      className="text-[11.5px] underline"
                      onClick={async () => {
                        await api.post(`/tracking-hub/feed/${row.id}/open`, {});
                        setOpen(false);
                        refresh();
                      }}
                    >
                      Open
                    </Link>
                  )}
                  <button
                    type="button"
                    className="text-[11.5px] text-nop-muted hover:text-store-text"
                    onClick={async () => {
                      await api.post(`/tracking-hub/feed/${row.id}/clear`, {});
                      setRows((r) => r.filter((x) => x.id !== row.id));
                      refresh();
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The native mini shopping cart flyout of DefaultClean, on the header's cart link: the lines, the
 * sub-total and the two buttons. shoppingcartsettings.minishoppingcartenabled turns it off, and
 * the link alone remains (PRD-CHK-001).
 */
function MiniCart({ cart, currency }) {
  const [open, setOpen] = useState(false);
  const enabled = cart?.miniCartEnabled === true && cart?.miniCart;
  const lines = cart?.items ?? [];
  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => enabled && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        to="/cart"
        className="flex items-center gap-2 border border-store-border px-3 py-2 hover:bg-gray-50"
        onClick={() => setOpen(false)}
        aria-haspopup={enabled ? 'true' : undefined}
        aria-expanded={enabled ? open : undefined}
      >
        <span className="text-[13px] font-medium">Shopping cart</span>
        <Badge tone="blue">{cart?.itemCount ?? 0}</Badge>
        {cart?.subtotal > 0 && <span className="hidden sm:inline text-[12px] text-nop-muted">{money(cart.subtotal, currency)}</span>}
      </Link>
      {enabled && open && (
        <div className="absolute right-0 top-full z-50 w-80 border border-store-border bg-white shadow-lg" role="dialog" aria-label="Mini shopping cart">
          {lines.length === 0 ? (
            <p className="p-4 text-[13px] text-nop-muted">You have no items in your shopping cart.</p>
          ) : (
            <>
              <p className="px-4 pt-3 text-[12.5px] text-nop-muted">
                There {cart.itemCount === 1 ? 'is 1 item' : `are ${cart.itemCount} items`} in your cart.
              </p>
              <ul className="max-h-72 overflow-auto divide-y divide-gray-100 px-4">
                {lines.map((item) => (
                  <li key={item.id} className="flex gap-2 py-2.5">
                    <div className="w-10 shrink-0">
                      <ProductPicture picture={item.product?.picture} name={item.product?.name} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${item.productId}`} className="block truncate text-[13px] font-medium hover:brand-text" onClick={() => setOpen(false)}>
                        {item.product?.name}
                      </Link>
                      <div className="text-[12px] text-nop-muted">
                        {item.quantity} × {money(item.unitPrice, currency)}
                        {item.fulfilment === 'pickup' ? ' · collection' : ''}
                      </div>
                    </div>
                    <div className="text-[12.5px] font-medium whitespace-nowrap">{money(item.subtotal, currency)}</div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-nop-border px-4 py-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-nop-muted">Sub-total</span>
                  <span className="font-semibold">{money(cart.miniCart.subtotal, currency)}</span>
                </div>
                {cart.savedForLater?.length > 0 && (
                  <p className="mt-1 text-[12px] text-nop-muted">
                    {cart.savedForLater.length} item{cart.savedForLater.length === 1 ? '' : 's'} in {cart.savedForLaterName}.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button as="link" to="/cart" size="sm" onClick={() => setOpen(false)}>View cart</Button>
                  <Button as="link" to="/checkout" size="sm" variant="brand" onClick={() => setOpen(false)}>Checkout</Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
      <ServiceBanners />
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
                {/* widget zone header_links_after: the PRD-TRK-008 bell */}
                <NotificationBell />
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
        <div className="mx-auto max-w-[1280px] px-4 py-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="size-9 rounded-sm grid place-items-center font-bold text-white brand-bg">
              {(content?.brand?.logoText ?? 'NC').slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[17px] font-semibold text-nop-ink leading-tight">
              {settings('storeinformationsettings.storename', 'Store')}
            </span>
          </Link>

          <div className="relative flex-1 min-w-[12rem] max-w-xl mx-auto order-last w-full sm:order-none sm:w-auto">
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

          <MiniCart cart={cart} currency={currency?.code} />
        </div>
      </div>

      {/* category menu */}
      <nav aria-label="Categories" className="brand-bg">
        <div className="mx-auto max-w-[1280px] px-4 flex items-center gap-1 overflow-x-auto max-w-full">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.id}`}
              className="px-3 py-2.5 text-[13px] font-medium uppercase tracking-wide whitespace-nowrap hover:bg-black/15"
            >
              {c.name}
            </Link>
          ))}
          <Link to="/order-status" className="sm:ml-auto px-3 py-2.5 text-[13px] whitespace-nowrap hover:bg-black/15">Track an order</Link>
        </div>
      </nav>

      <main className="flex-1 mx-auto max-w-[1280px] w-full px-4 py-6">{children}</main>
      <CookieBanner />

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
      <HelpWidget />
    </div>
  );
}

/**
 * The help widget: the tips of this page and the guided tour for the kind of user who is signed
 * in. The tour starts once by itself; afterwards it can be replayed from here.
 */
function HelpWidget() {
  const { customer } = useProduct();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(null);
  const [tour, setTour] = useState(null);
  const [replayLabel, setReplayLabel] = useState('Replay the tour');
  // the cookie bar sits across the foot of the page; the help button sits above it while it shows
  const [cookieBarHeight, setCookieBarHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const bar = document.querySelector('[data-cookie-bar]');
      setCookieBarHeight(bar ? bar.getBoundingClientRect().height : 0);
    };
    measure();
    const timer = setInterval(measure, 500);
    window.addEventListener('resize', measure);
    return () => { clearInterval(timer); window.removeEventListener('resize', measure); };
  }, [pathname]);

  const offset = { bottom: `${cookieBarHeight + 16}px` };

  const role = (customer?.roles ?? []).some((r) => ['Administrators', 'PlatformTeam', 'Support', 'Operations'].includes(r))
    ? 'staff'
    : ((customer?.roles ?? []).includes('Vendors') ? 'seller' : 'buyer');

  useEffect(() => {
    let live = true;
    api.get(`/platform/help/tips?route=${encodeURIComponent(pathname)}&role=${role}`)
      .then((r) => live && setHelp(r))
      .catch(() => live && setHelp(null));
    return () => { live = false; };
  }, [pathname, role]);

  useEffect(() => {
    if (!customer) return undefined;
    let live = true;
    api.get(`/platform/help/tour?role=${role}&customerId=${customer.id}`)
      .then((r) => {
        if (!live || !r?.tour) return;
        setReplayLabel(r.replayLabel ?? 'Replay the tour');
        if (r.startsNow) { setTour(r.tour); setOpen(true); }
      })
      .catch(() => {});
    return () => { live = false; };
  }, [customer?.id, role]);

  const replay = async () => {
    if (!customer) return;
    try {
      const r = await api.get(`/platform/help/tour?role=${role}&customerId=${customer.id}`);
      if (r?.tour) {
        const played = await api.post('/platform/help/tour/replay', { tourId: r.tour.id, customerId: customer.id });
        setTour(played.tour ?? r.tour);
        setOpen(true);
      }
    } catch { /* the page stands without the tour */ }
  };

  const skip = async () => {
    setTour(null);
    setOpen(false);
    if (!customer || !tour) return;
    try { await api.post('/platform/help/tour/finish', { tourId: tour.id, customerId: customer.id, status: 'Skipped' }); } catch { /* nothing to do */ }
  };

  const tips = help?.tips ?? [];
  if (tips.length === 0 && !tour) {
    return (
      <div className="fixed right-4 z-[60]" style={offset}>
        <button
          type="button"
          onClick={replay}
          className="rounded-full size-10 bg-store-text text-white text-[15px] font-semibold shadow-lg"
          title={replayLabel}
          aria-label={replayLabel}
        >
          ?
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 z-[60] w-[min(22rem,calc(100vw-2rem))]" style={offset}>
      {open && (
        <div className="mb-2 bg-white border border-nop-border rounded-sm shadow-lg">
          <div className="px-3 py-2 border-b border-nop-border flex items-center justify-between">
            <span className="text-[13px] font-semibold">{tour ? tour.name : 'Help for this page'}</span>
            <button type="button" onClick={() => (tour ? skip() : setOpen(false))} className="text-nop-muted text-[12px]">Close</button>
          </div>
          <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
            {tour
              ? (tour.steps ?? []).map((step, i) => (
                <p key={step.target ?? i} className="text-[12.5px] text-store-text">
                  <span className="font-semibold">{`${i + 1}. `}</span>
                  {step.text}
                </p>
              ))
              : tips.map((tip) => (
                <div key={tip.id}>
                  <p className="text-[13px] font-semibold text-store-text">{tip.title}</p>
                  <p className="text-[12.5px] text-nop-muted">{tip.body}</p>
                  {tip.materialLink?.reference && <p className="text-[11.5px] text-nop-muted mt-0.5">{`More: ${tip.materialLink.reference}`}</p>}
                </div>
              ))}
          </div>
          <div className="px-3 py-2 border-t border-nop-border flex gap-2">
            {tour
              ? <Button size="sm" onClick={skip}>Skip</Button>
              : <Button size="sm" onClick={replay}>{replayLabel}</Button>}
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full size-10 bg-store-text text-white text-[15px] font-semibold shadow-lg"
          title="Help for this page"
          aria-label="Help for this page"
        >
          ?
        </button>
      </div>
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
      { label: 'Categories', to: '/admin/catalog/categories' },
      { label: 'Price lists', to: '/admin/catalog/price-lists' },
      { label: 'Bulk edit', to: '/admin/catalog/bulk-edit' },
    ],
  },
  {
    label: 'Sales',
    children: [
      { label: 'Orders', to: '/admin/sales/orders' },
      { label: 'Shipments', to: '/admin/sales/shipments' },
      { label: 'Payments', to: '/admin/sales/payments' },
      { label: 'Checkout exceptions', to: '/admin/sales/checkout-exceptions' },
    ],
  },
  {
    label: 'Customers',
    children: [
      { label: 'Customers', to: '/admin/customers' },
      { label: 'Customer roles', to: '/admin/customers/roles' },
      { label: 'Sellers', to: '/admin/customers/vendors' },
      { label: 'Sessions and sign-in security', to: '/admin/customers/security' },
      { label: 'Access governance', to: '/admin/customers/access' },
      { label: 'Privacy requests', to: '/admin/customers/privacy' },
      { label: 'Business accounts', to: '/admin/customers/business' },
    ],
  },
  {
    label: 'Configuration',
    children: [
      { label: 'Settings', to: '/admin/configuration/settings' },
      { label: 'Configuration packs', to: '/admin/configuration/packs' },
      { label: 'Change sets', to: '/admin/configuration/change-sets' },
      { label: 'Feature registry', to: '/admin/configuration/feature-registry' },
      { label: 'Stores', to: '/admin/configuration/stores' },
      { label: 'Languages', to: '/admin/configuration/languages' },
      { label: 'Currencies', to: '/admin/configuration/currencies' },
      { label: 'Countries', to: '/admin/configuration/countries' },
      { label: 'Payment methods', to: '/admin/configuration/payment-methods' },
      { label: 'Shipping methods', to: '/admin/configuration/shipping-methods' },
      { label: 'Delivery windows', to: '/admin/configuration/delivery-windows' },
      { label: 'Cart restriction rules', to: '/admin/configuration/cart-rules' },
      { label: 'Checkout notices', to: '/admin/configuration/checkout-notices' },
      { label: 'Access control list', to: '/admin/configuration/acl' },
      { label: 'Retention rules and runs', to: '/admin/configuration/retention' },
      { label: 'Tracking sources and events', to: '/admin/configuration/tracking' },
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
    label: 'Content management',
    children: [
      { label: 'Help tips and tours', to: '/admin/content/help' },
      { label: 'Message templates', to: '/admin/content/message-templates' },
      { label: 'Notification definitions', to: '/admin/content/notifications' },
      { label: 'Locale resources', to: '/admin/content/locale-resources' },
    ],
  },
  {
    label: 'Operations',
    children: [
      { label: 'Console', to: '/admin/operations' },
      { label: 'Track and trace', to: '/admin/operations/track-and-trace' },
      { label: 'Notices and banners', to: '/admin/operations/notices' },
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
      { label: 'Audit trail', to: '/admin/system/audit-trail' },
      { label: 'Notification log', to: '/admin/system/notification-log' },
      { label: 'Data protection', to: '/admin/system/data-protection' },
      { label: 'Breach cases', to: '/admin/system/breaches' },
      { label: 'Security operations', to: '/admin/system/security-operations' },
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
    <div className="nop-admin min-h-screen bg-nop-canvas p-6">
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
            Sign in as an account that holds it - admin@example.com opens all eight console areas,
            catalogue@example.com only Products.
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
      <div className="nop-admin min-h-screen flex bg-nop-canvas">
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
