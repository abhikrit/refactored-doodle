// Storefront catalogue screens - the DefaultClean pages, extended where the PRD extends them.
//   Home              CAT-001, SRC-007, SRC-015
//   Category / Search CAT-001, SRC-001, SRC-003, SRC-005, SRC-006, SRC-018
//   Product details   CAT-002, CAT-004, CAT-012, CAT-013, CAT-016, CAT-020, CAT-029, CAT-031, CAT-041

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api, qs } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import {
  Alert, Badge, Button, KeyValue, Panel, ProductPicture, Spinner, Tabs,
} from '../../ui/nop/kit.jsx';

function useCurrency() {
  const { entities } = useProduct();
  const c = (entities.currencies ?? []).find((x) => x.primary) ?? (entities.currencies ?? [])[0];
  return c?.code ?? 'USD';
}

/* --------------------------------------------------------------- product box -- */

export function ProductBox({ product, onAdd, view = 'grid' }) {
  const currency = useCurrency();
  const price = product.callForPrice ? 'Call for price' : money(product.finalPrice, product.currency ?? currency);
  if (view === 'list') {
    return (
      <article className="flex gap-4 border border-store-border p-3 bg-white">
        <Link to={`/product/${product.id}`} className="w-28 shrink-0"><ProductPicture picture={product.picture} name={product.name} /></Link>
        <div className="min-w-0 flex-1">
          <Link to={`/product/${product.id}`} className="text-[17px] leading-[1.2] brand-text hover:underline">{product.name}</Link>
          <p className="text-[12.5px] text-nop-muted mt-1 line-clamp-2">{product.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {product.vendor && <Badge tone="slate">{product.vendor.name}</Badge>}
            {product.pickupOnly && <Badge tone="amber">Pickup only</Badge>}
            {product.placeholder && <Badge tone="red">Placeholder</Badge>}
            {!product.inStock && <Badge tone="red">Out of stock</Badge>}
          </div>
        </div>
        <div className="w-44 shrink-0 text-right">
          <div className="text-[16px] text-store-text">{price}</div>
          {product.oldPrice > 0 && <div className="text-[12px] text-nop-muted line-through">{money(product.oldPrice, product.currency ?? currency)}</div>}
          <div className="mt-2 flex flex-col gap-1.5">
            <Button variant="brand" onClick={() => onAdd?.(product)} disabled={product.callForPrice}>
              {product.callForPrice ? 'Request a quote' : 'Add to cart'}
            </Button>
            <Button as="link" to={`/product/${product.id}`} size="sm">Details</Button>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article className="border border-store-border bg-white flex flex-col hover:shadow-sm transition">
      <Link to={`/product/${product.id}`} className="p-3 pb-0"><ProductPicture picture={product.picture} name={product.name} /></Link>
      <div className="p-3 flex-1 flex flex-col">
        <Link to={`/product/${product.id}`} className="font-medium text-[13.5px] leading-snug text-nop-ink hover:brand-text line-clamp-2">
          {product.name}
        </Link>
        <p className="text-[12px] text-nop-muted mt-1 line-clamp-2 flex-1">{product.shortDescription}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {product.vendor && <Badge tone="slate">{product.vendor.name}</Badge>}
          {product.pickupOnly && <Badge tone="amber">Pickup only</Badge>}
          {product.placeholder && <Badge tone="red">Placeholder</Badge>}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-[16px] text-store-text">{price}</div>
            {product.priceParts?.applied === 'price-list' && <div className="text-[11px] text-emerald-700">Your price list</div>}
            {product.oldPrice > 0 && <div className="text-[11.5px] text-nop-muted line-through">{money(product.oldPrice, product.currency ?? currency)}</div>}
          </div>
          <Button variant="brand" size="sm" onClick={() => onAdd?.(product)} disabled={product.callForPrice}>
            {product.callForPrice ? 'Quote' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------------- home --- */

export function Home() {
  const { content, settings, refreshCart } = useProduct();
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => { api.get('/search?pageSize=8&sort=position').then(setData).catch(() => {}); }, [content?.clientName]);

  const add = async (p) => {
    const res = await api.post('/checkout-area/cart/items', { productId: p.id, quantity: 1 });
    await refreshCart();
    setNotice(res.ok ? `${p.name} was added to your shopping cart.` : res.warnings.join(' '));
  };

  return (
    <div className="space-y-6">
      {notice && <Alert tone="success">{notice}</Alert>}
      <section className="rounded-sm overflow-hidden border border-nop-border">
        <div className="brand-bg px-6 py-10 md:px-10 md:py-14">
          <h1 className="text-2xl md:text-3xl font-semibold max-w-2xl leading-snug">
            {settings('storeinformationsettings.storename', 'Store')}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] opacity-95">{content?.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button as="link" to="/search" variant="default">Browse the catalogue</Button>
            <Button as="link" to="/order-status" variant="default">Track an order</Button>
          </div>
        </div>
      </section>

      <div>
        <h2 className="nop-page-title">Featured products</h2>
        {!data ? <Spinner /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((p) => <ProductBox key={p.id} product={p} onAdd={add} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- category and search -- */

export function ProductList({ mode = 'search' }) {
  const { categoryId } = useParams();
  const [params, setParams] = useSearchParams();
  const { refreshCart, content } = useProduct();
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState(null);
  const [view, setView] = useState('grid');
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const query = useMemo(() => ({
    q: params.get('q') ?? '',
    categoryId: mode === 'category' ? categoryId : params.get('categoryId'),
    vendorId: params.get('vendorId'),
    minPrice: params.get('minPrice'),
    maxPrice: params.get('maxPrice'),
    inStockOnly: params.get('inStockOnly') === 'true',
    pickupOnly: params.get('pickupOnly') === 'true',
    sort: params.get('sort') ?? 'relevance',
    page: Number(params.get('page') ?? 1),
    pageSize: Number(params.get('pageSize') ?? 12),
  }), [params, categoryId, mode]);

  useEffect(() => {
    setData(null);
    api.get(`/search${qs(query)}`).then(setData).catch(() => {});
  }, [query, content?.clientName]);
  useEffect(() => {
    api.get('/catalogue/categories').then(setCategories).catch(() => {});
    api.get('/catalogue/vendors').then(setVendors).catch(() => {});
  }, [content?.clientName]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === false) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const add = async (p) => {
    const res = await api.post('/checkout-area/cart/items', { productId: p.id, quantity: 1 });
    await refreshCart();
    setNotice(res.ok ? `${p.name} was added to your shopping cart.` : res.warnings.join(' '));
  };

  const category = categories.find((c) => String(c.id) === String(query.categoryId));
  const title = mode === 'category' ? (category?.name ?? 'Category') : (query.q ? `Search: ${query.q}` : 'All products');

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      {/* left column: category navigation + filters (DefaultClean) */}
      <aside className="space-y-4">
        <Panel title="Categories" bodyClass="p-0">
          <ul className="divide-y divide-gray-100 text-[13px]">
            {categories.filter((c) => !c.parentCategoryId).map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.id}`} className={`block px-3 py-2 hover:bg-gray-50 ${String(c.id) === String(query.categoryId) ? 'brand-text font-medium' : ''}`}>
                  {c.name}
                </Link>
                {categories.filter((s) => s.parentCategoryId === c.id).map((s) => (
                  <Link key={s.id} to={`/category/${s.id}`} className={`block pl-6 pr-3 py-1.5 text-[12.5px] hover:bg-gray-50 ${String(s.id) === String(query.categoryId) ? 'brand-text font-medium' : 'text-nop-muted'}`}>
                    {s.name}
                  </Link>
                ))}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Filter by" bodyClass="p-3 space-y-3">
          <div>
            <div className="text-[12px] font-semibold text-gray-700 mb-1.5">Seller</div>
            <select
              className="w-full border border-nop-border rounded-sm px-2 py-1.5 text-[13px]"
              value={query.vendorId ?? ''}
              onChange={(e) => setParam('vendorId', e.target.value)}
            >
              <option value="">All sellers</option>
              {(data?.facets.vendors ?? vendors.map((v) => ({ id: v.id, name: v.name, count: '' }))).map((v) => (
                <option key={v.id} value={v.id}>{v.name}{v.count !== '' ? ` (${v.count})` : ''}</option>
              ))}
            </select>
          </div>
          {data?.facets.priceRange && (
            <div>
              <div className="text-[12px] font-semibold text-gray-700 mb-1.5">Price</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={String(Math.floor(data.facets.priceRange.min))}
                  defaultValue={query.minPrice ?? ''}
                  onBlur={(e) => setParam('minPrice', e.target.value)}
                  className="w-full border border-nop-border rounded-sm px-2 py-1.5 text-[13px]"
                  aria-label="Minimum price"
                />
                <span className="text-nop-muted">–</span>
                <input
                  type="number"
                  placeholder={String(Math.ceil(data.facets.priceRange.max))}
                  defaultValue={query.maxPrice ?? ''}
                  onBlur={(e) => setParam('maxPrice', e.target.value)}
                  className="w-full border border-nop-border rounded-sm px-2 py-1.5 text-[13px]"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={query.inStockOnly} onChange={(e) => setParam('inStockOnly', e.target.checked)} className="size-4" />
            In stock only {data && <span className="text-nop-muted">({data.facets.inStock})</span>}
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={query.pickupOnly} onChange={(e) => setParam('pickupOnly', e.target.checked)} className="size-4" />
            Available for pickup only {data && <span className="text-nop-muted">({data.facets.pickupOnly})</span>}
          </label>
</Panel>
      </aside>

      <div>
        {notice && <div className="mb-3"><Alert tone="success">{notice}</Alert></div>}
        <div className="nop-page-title flex flex-wrap items-end gap-3 justify-between">
          <h1 className="text-[30px] font-normal leading-tight text-store-dark">{title}</h1>
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="text-nop-muted">Sort by</span>
            <select
              className="border border-nop-border rounded-sm px-2 py-1.5"
              value={query.sort}
              onChange={(e) => setParam('sort', e.target.value)}
              aria-label="Sort by"
            >
              {(data?.sortOptions ?? []).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <span className="text-nop-muted ml-2">Display</span>
            <select
              className="border border-nop-border rounded-sm px-2 py-1.5"
              value={query.pageSize}
              onChange={(e) => setParam('pageSize', e.target.value)}
              aria-label="Products per page"
            >
              {[6, 12, 24].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="ml-2 flex border border-nop-border rounded-sm overflow-hidden">
              {['grid', 'list'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-2 py-1.5 ${view === v ? 'bg-nop-blue text-white' : 'bg-white'}`}
                >
                  {v === 'grid' ? 'Grid' : 'List'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {category?.description && <p className="text-[13px] text-nop-muted mb-4">{category.description}</p>}

        {!data ? <Spinner /> : data.items.length === 0 ? (
          <Alert tone="info">No products were found that match the selection.</Alert>
        ) : (
          <>
            <p className="text-[12.5px] text-nop-muted mb-3">{data.total} product{data.total === 1 ? '' : 's'}</p>
            <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
              {data.items.map((p) => <ProductBox key={p.id} product={p} onAdd={add} view={view} />)}
            </div>
            {data.pages > 1 && (
              <nav className="flex items-center gap-1 mt-5" aria-label="Pagination">
                {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setParam('page', n)}
                    className={`size-8 border rounded-sm text-[13px] ${n === data.page ? 'bg-nop-blue text-white border-nop-blue' : 'border-nop-border bg-white'}`}
                  >
                    {n}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- product details --- */

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCart, content } = useProduct();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState('description');
  const currency = useCurrency();

  useEffect(() => {
    setProduct(null);
    api.get(`/catalogue/products/${id}?quantity=${quantity}`).then(setProduct).catch(() => {});
  }, [id, quantity, content?.clientName]);

  if (!product) return <Spinner />;

  const add = async () => {
    const res = await api.post('/checkout-area/cart/items', { productId: product.id, quantity });
    await refreshCart();
    if (res.ok) navigate('/cart');
    else setNotice(res.warnings.join(' '));
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications', count: Object.keys(product.specifications ?? {}).length },
    { id: 'delivery', label: 'Delivery' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="space-y-6">
      {notice && <Alert tone="warning">{notice}</Alert>}
      <div className="text-[12.5px] text-nop-muted flex items-center gap-1.5">
        <Link to="/" className="hover:brand-text">Home</Link>
        {product.categories.map((c) => (
          <React.Fragment key={c.id}>
            <span className="text-gray-300">/</span>
            <Link to={`/category/${c.id}`} className="hover:brand-text">{c.name}</Link>
          </React.Fragment>
        ))}
        <span className="text-gray-300">/</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="max-w-md"><ProductPicture picture={product.picture} name={product.name} size="lg" /></div>

        <div>
          <h1 className="text-[22px] font-semibold leading-snug">{product.name}</h1>
          <p className="text-[13.5px] text-nop-muted mt-2">{product.shortDescription}</p>

          {product.placeholder && (
            <div className="mt-3"><Alert tone="warning" title="Client content not supplied">{product.placeholder}</Alert></div>
          )}

          <div className="mt-4 border-y border-nop-border py-3 space-y-1.5 text-[13px]">
            <div className="flex gap-2"><span className="text-nop-muted w-28">SKU</span><span className="font-mono text-[12.5px]">{product.sku}</span></div>
            <div className="flex gap-2">
              <span className="text-nop-muted w-28">Availability</span>
              <span className={product.inStock ? 'text-emerald-700' : 'text-nop-red'}>
                {product.inStock ? `In stock (${product.stockQuantity} ${product.unit})` : 'Out of stock'}
              </span>
            </div>
            {product.vendor && (
              <div className="flex gap-2">
                <span className="text-nop-muted w-28">Sold by</span>
                <span>{product.vendor.name}{product.vendor.rating ? ` · ${product.vendor.rating}/5` : ''}</span>
              </div>
            )}
            {product.packSize && <div className="flex gap-2"><span className="text-nop-muted w-28">Pack size</span><span>{product.packSize}</span></div>}
            {product.pickupOnly && (
              <div className="flex gap-2"><span className="text-nop-muted w-28">Fulfilment</span><Badge tone="amber">Collection at an outlet only</Badge></div>
            )}
          </div>

          <div className="mt-4">
            {product.callForPrice ? (
              <div>
                <div className="text-[20px] font-semibold">Call for price</div>
<Button variant="brand" size="lg" className="mt-3" disabled>Request a quote (ORD-012, wave 3)</Button>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <div className="text-[26px] font-semibold">{money(product.finalPrice, product.currency ?? currency)}</div>
                  {product.oldPrice > 0 && <div className="text-[15px] text-nop-muted line-through">{money(product.oldPrice, product.currency ?? currency)}</div>}
                  <span className="text-[12.5px] text-nop-muted pb-1">per {product.unit}</span>
                </div>
                {product.priceParts?.applied !== 'base' && (
                  <div className="mt-1.5 text-[12px]">
                    {product.priceParts.priceList && <Badge tone="green">Price list: {product.priceParts.priceList.name}</Badge>}
                    {product.priceParts.tierPrice && <Badge tone="blue">Tier price from {product.priceParts.tierPrice.quantity} {product.unit}</Badge>}
                    {product.priceParts.note && <p className="text-[11.5px] text-nop-muted mt-1">{product.priceParts.note}</p>}
                  </div>
                )}
                {(product.tierPrices ?? []).length > 0 && (
                  <table className="mt-3 text-[12.5px] border border-nop-border">
                    <thead><tr className="bg-nop-head"><th className="text-left px-2 py-1 font-medium">Quantity</th><th className="text-left px-2 py-1 font-medium">Unit price</th></tr></thead>
                    <tbody>
                      {product.tierPrices.map((t) => (
                        <tr key={t.quantity} className="border-t border-nop-border">
                          <td className="px-2 py-1">{t.quantity}+</td>
                          <td className="px-2 py-1">{money(t.price, product.currency ?? currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="mt-4 flex items-end gap-3">
                  <label className="text-[12.5px]">
                    <span className="block text-nop-muted mb-1">Quantity</span>
                    <input
                      type="number"
                      min={product.orderMinimumQuantity}
                      max={product.orderMaximumQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-24 border border-nop-border rounded-sm px-2 py-2 text-[14px]"
                    />
                  </label>
                  <Button variant="brand" size="lg" onClick={add}>Add to cart</Button>
                  <Button size="lg" disabled title="SRC-010 wish list - wave 2">Add to wishlist</Button>
                </div>
                <p className="text-[11.5px] text-nop-muted mt-2">
                  Minimum {product.orderMinimumQuantity}, maximum {product.orderMaximumQuantity} per order (CAT-037 order quantity rules).
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="border border-t-0 border-nop-border bg-white p-4 text-[13px]">
          {tab === 'description' && (
            <div className="space-y-2">
              <p>{product.fullDescription || product.shortDescription || 'No description was supplied.'}</p>
              {product.origin && <p className="text-nop-muted">Origin: {product.origin} (CAT-020 origin and product story).</p>}
            </div>
          )}
          {tab === 'specifications' && (
            Object.keys(product.specifications ?? {}).length
              ? <KeyValue rows={Object.entries(product.specifications)} />
              : <p className="text-nop-muted">No specification attributes were supplied.</p>
          )}
          {tab === 'delivery' && (
            <div className="space-y-2">
              <p>
                {product.isShipEnabled
                  ? 'Delivery and collection options, fees and the expected delivery date are shown at checkout from the LOG-002 fee engine and LOG-005 expected dates.'
                  : 'This is a service or a digital item: it is not shipped (SVC-007 / CAT-026).'}
              </p>
</div>
          )}
          {tab === 'reviews' && (
            <div className="space-y-2">
              <p className="text-nop-muted">No reviews yet.</p>
</div>
          )}
        </div>
      </div>
    </div>
  );
}
