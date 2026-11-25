// nopCommerce administration - Dashboard, Catalog, Sales and Customers.
// Every grid, panel, tab strip and button bar follows the native admin pattern.

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, ButtonBar, Field, Grid, Input, KeyValue, NotBuilt,
  Panel, ProductPicture, SearchPanel, Select, Spinner, StatTile, Tabs,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, ...items]} />;

/* ---------------------------------------------------------------- dashboard -- */

export function Dashboard() {
  const { content, entities } = useProduct();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [work, setWork] = useState({ approvals: 0, exceptions: 0, alerts: 0 });

  useEffect(() => {
    api.get('/orders').then(setOrders).catch(() => {});
    api.get('/catalogue/products').then(setProducts).catch(() => {});
    api.get('/identity/customers').then(setCustomers).catch(() => {});
    Promise.all([
      api.get('/admin-console/approvals/queue').catch(() => []),
      api.get('/admin-console/exceptions').catch(() => ({ exceptions: [] })),
      api.get('/admin-console/alerts').catch(() => ({ alerts: [] })),
    ]).then(([a, e, al]) => setWork({
      approvals: Array.isArray(a) ? a.length : 0,
      exceptions: (e.exceptions ?? []).length,
      alerts: (al.alerts ?? []).filter((x) => x.status === 'Raised').length,
    }));
  }, [content?.clientName]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const currency = orders[0]?.currency
    ?? (entities?.currencies ?? []).find((c) => c.primary)?.code
    ?? 'USD';

  return (
    <AdminPage title="Dashboard" intro={content?.clientName ?? ''} breadcrumb={crumb()}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Orders" value={orders.length} tone="blue" />
        <StatTile label="Revenue" value={money(revenue, currency)} tone="green" />
        <StatTile label="Products" value={products.length} tone="amber" />
        <StatTile label="Customers" value={customers.length} tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Waiting for the back office">
          <div className="grid gap-2 sm:grid-cols-3">
            <StatTile label="Approvals waiting for me" value={work.approvals} tone="blue" to="/admin/operations/approvals" />
            <StatTile label="Open exceptions" value={work.exceptions} tone="amber" to="/admin/operations/exceptions" />
            <StatTile label="Alerts raised" value={work.alerts} tone="red" to="/admin/operations/alerts" />
          </div>
        </Panel>

        <Panel title="Latest orders" bodyClass="p-0">
          <Grid
            dense
            columns={[
              { key: 'orderNumber', header: 'Order', render: (o) => <span className="font-mono text-[12px]">{o.orderNumber}</span> },
              { key: 'customerName', header: 'Customer' },
              { key: 'vendorName', header: 'Seller' },
              { key: 'stage', header: 'Stage', render: (o) => <Badge tone={o.stage === 'Delivered' ? 'green' : 'slate'}>{o.stage}</Badge> },
              { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.total, o.currency) },
            ]}
            rows={orders.slice(0, 8)}
            rowKey={(o) => o.orderNumber}
            empty="No orders yet."
          />
        </Panel>
      </div>
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ catalog -- */

export function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState({ name: '', vendorId: '', sku: '' });
  const { content } = useProduct();

  useEffect(() => {
    api.get('/catalogue/products').then(setProducts).catch(() => {});
    api.get('/catalogue/vendors').then(setVendors).catch(() => {});
  }, [content?.clientName]);

  const rows = (products ?? []).filter((p) => (
    (!filter.name || p.name.toLowerCase().includes(filter.name.toLowerCase()))
    && (!filter.sku || (p.sku ?? '').toLowerCase().includes(filter.sku.toLowerCase()))
    && (!filter.vendorId || String(p.vendorId) === filter.vendorId)
  ));

  return (
    <AdminPage
      title="Products"
      breadcrumb={crumb({ label: 'Catalog' }, { label: 'Products' })}
      intro="The products of this store. Search the list, open a product and edit it on its tabs."
      actions={<Button variant="primary" disabled title="CAT-002 create - wave 2">Add new</Button>}
    >
      <SearchPanel onClear={() => setFilter({ name: '', vendorId: '', sku: '' })}>
        <Field label="Product name"><Input value={filter.name} onChange={(e) => setFilter({ ...filter, name: e.target.value })} /></Field>
        <Field label="SKU"><Input value={filter.sku} onChange={(e) => setFilter({ ...filter, sku: e.target.value })} /></Field>
        <Field label="Seller">
          <Select value={filter.vendorId} onChange={(e) => setFilter({ ...filter, vendorId: e.target.value })}>
            <option value="">All</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </Select>
        </Field>
      </SearchPanel>

      <Panel bodyClass="p-0">
        {!products ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'picture', header: 'Picture', width: 70, render: (p) => <div className="w-12"><ProductPicture picture={p.picture} name={p.name} size="sm" /></div> },
              { key: 'name', header: 'Product name', render: (p) => <Link to={`/admin/catalog/products/${p.id}`} className="text-nop-blue hover:underline">{p.name}</Link> },
              { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-[12px]">{p.sku}</span> },
              { key: 'vendor', header: 'Seller', render: (p) => p.vendor?.name ?? '-' },
              { key: 'price', header: 'Price', align: 'right', render: (p) => (p.callForPrice ? <Badge tone="amber">Call for price</Badge> : money(p.finalPrice, p.currency)) },
              { key: 'stockQuantity', header: 'Stock', align: 'right' },
              { key: 'published', header: 'Published', render: (p) => <Badge tone={p.published ? 'green' : 'red'}>{p.published ? 'Yes' : 'No'}</Badge> },
              { key: 'edit', header: '', align: 'right', render: (p) => <Button size="sm" as="link" to={`/admin/catalog/products/${p.id}`}>Edit</Button> },
            ]}
            rows={rows}
            rowKey={(p) => p.id}
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminProductEdit() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [tab, setTab] = useState('info');

  useEffect(() => { api.get(`/catalogue/products/${id}`).then(setProduct).catch(() => {}); }, [id]);
  if (!product) return <AdminPage title="Edit product" breadcrumb={crumb({ label: 'Catalog' }, { label: 'Products', to: '/admin/catalog/products' })}><Spinner /></AdminPage>;

  const tabs = [
    { id: 'info', label: 'Product info' },
    { id: 'prices', label: 'Prices' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'pictures', label: 'Pictures' },
    { id: 'attributes', label: 'Specification attributes', count: Object.keys(product.specifications ?? {}).length },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <AdminPage
      title={`Edit product details - ${product.name}`}
      breadcrumb={crumb({ label: 'Catalog' }, { label: 'Products', to: '/admin/catalog/products' }, { label: product.name })}
      actions={<ButtonBar backTo="/admin/catalog/products" />}
    >
      <Alert tone="info">
        Read-only in Session 0: editing the catalogue is CAT-002 and CAT-023 (version history and autosave), built in
        wave 2 Catalogue.
      </Alert>
      <div>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="border border-t-0 border-nop-border bg-white p-4">
          {tab === 'info' && (
            <KeyValue rows={[
              ['Product name', product.name],
              ['Short description', product.shortDescription],
              ['Full description', product.fullDescription || '-'],
              ['SKU', <span className="font-mono">{product.sku}</span>],
              ['Seller', product.vendor?.name],
              ['Categories', product.categories.map((c) => c.name).join(', ')],
              ['Published', product.published ? 'Yes' : 'No'],
              ['Unit of measure', `${product.unit}${product.packSize ? ` (${product.packSize})` : ''} - CAT-041`],
            ]}
            />
          )}
          {tab === 'prices' && (
            <div className="space-y-3">
              <KeyValue rows={[
                ['Price', product.callForPrice ? 'Call for price (CAT-013)' : money(product.price, product.currency)],
                ['Old price', product.oldPrice ? money(product.oldPrice, product.currency) : '-'],
                ['Applied price', product.callForPrice ? '-' : `${money(product.finalPrice, product.currency)} (${product.priceParts.applied})`],
              ]}
              />
              {(product.tierPrices ?? []).length > 0 && (
                <Grid
                  dense
                  columns={[{ key: 'quantity', header: 'Quantity' }, { key: 'price', header: 'Unit price', align: 'right', render: (t) => money(t.price, product.currency) }]}
                  rows={product.tierPrices}
                  rowKey={(t) => t.quantity}
                />
              )}
            </div>
          )}
          {tab === 'inventory' && (
            <KeyValue rows={[
              ['Inventory method', product.manageInventoryMethod],
              ['Stock quantity', String(product.stockQuantity)],
              ['Minimum cart quantity', String(product.orderMinimumQuantity)],
              ['Maximum cart quantity', String(product.orderMaximumQuantity)],
              ['Ship enabled', product.isShipEnabled ? 'Yes' : 'No'],
              ['Weight', `${product.weightKg} kg`],
            ]}
            />
          )}
          {tab === 'pictures' && (
            <div className="flex items-start gap-4">
              <div className="w-40"><ProductPicture picture={product.picture} name={product.name} /></div>
            </div>
          )}
          {tab === 'attributes' && (
            Object.keys(product.specifications ?? {}).length
              ? <KeyValue rows={Object.entries(product.specifications)} />
              : <p className="text-[13px] text-nop-muted">No specification attributes.</p>
          )}
          {tab === 'seo' && <NotBuilt wave={5} waveName="Engage and run" note="MKT-009 SEO: search engine friendly page name, meta title, keywords and description." />}
        </div>
      </div>
    </AdminPage>
  );
}

export function AdminCategories() {
  const [tree, setTree] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/catalogue/categories/tree').then(setTree).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage title="Categories" breadcrumb={crumb({ label: 'Catalog' }, { label: 'Categories' })} intro="The category tree of this store.">
      <Panel bodyClass="p-0">
        {!tree ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'children', header: 'Children', render: (c) => (c.children.length ? c.children.map((x) => x.name).join(', ') : '-') },
              { key: 'displayOrder', header: 'Display order', align: 'right' },
              { key: 'published', header: 'Published', render: (c) => <Badge tone="green">Yes</Badge> },
            ]}
            rows={tree}
            rowKey={(c) => c.id}
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminPriceLists() {
  const [lists, setLists] = useState(null);
  const { content } = useProduct();
  useEffect(() => {
    api.get('/registry/features').then(() => {}).catch(() => {});
    fetch('/api/platform/diagnostics').then(() => {}).catch(() => {});
    api.get('/catalogue/products').then(async () => {
      // price lists are seeded per client; read them through the diagnostics-free route
      const res = await fetch('/api/catalogue/vendors');
      await res.json();
    }).catch(() => {});
  }, [content?.clientName]);
  useEffect(() => {
    api.get('/catalogue/products').then((products) => {
      const withList = products.filter((p) => p.priceParts?.priceList);
      setLists(withList);
    }).catch(() => {});
  }, [content?.clientName]);

  return (
    <AdminPage title="Price lists" breadcrumb={crumb({ label: 'Catalog' }, { label: 'Price lists' })} intro="Price lists give a customer or a customer role its own prices, per currency.">
      <Alert tone="info" title="Native 5.00 capability">
        CAT-039 and CAT-042 use the native price lists; per-currency fixed prices remain a build. The seeded list applies
        to a customer role, so the price a buyer sees depends on who signs in.
      </Alert>
      <Panel title="Products whose applied price came from a price list" bodyClass="p-0">
        {!lists ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Product' },
              { key: 'list', header: 'Price list', render: (p) => p.priceParts.priceList.name },
              { key: 'manual', header: 'Manual price', align: 'right', render: (p) => money(p.priceParts.priceList.price, p.currency) },
              { key: 'strategy', header: 'Strategy', render: (p) => p.priceParts.priceList.strategy },
            ]}
            rows={lists}
            rowKey={(p) => p.id}
            empty="Sign in as a buyer whose role a price list targets (for example the trade account) to see the list applied."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

/* -------------------------------------------------------------------- sales -- */

export function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [stages, setStages] = useState([]);
  const [filter, setFilter] = useState({ stage: '', orderNumber: '' });
  const { content } = useProduct();

  const load = () => api.get('/orders').then(setOrders).catch(() => {});
  useEffect(() => { load(); api.get('/orders/stages').then(setStages).catch(() => {}); }, [content?.clientName]);

  const rows = (orders ?? []).filter((o) => (
    (!filter.stage || o.stage === filter.stage)
    && (!filter.orderNumber || o.orderNumber.toLowerCase().includes(filter.orderNumber.toLowerCase()))
  ));

  return (
    <AdminPage
      title="Orders"
      breadcrumb={crumb({ label: 'Sales' }, { label: 'Orders' })}
      intro="The orders of this store. Orders placed in one checkout share a checkout reference."
    >
      <SearchPanel onClear={() => setFilter({ stage: '', orderNumber: '' })}>
        <Field label="Order number"><Input value={filter.orderNumber} onChange={(e) => setFilter({ ...filter, orderNumber: e.target.value })} /></Field>
        <Field label="Stage">
          <Select value={filter.stage} onChange={(e) => setFilter({ ...filter, stage: e.target.value })}>
            <option value="">All</option>
            {stages.map((s) => <option key={s.stage} value={s.stage}>{s.stage}</option>)}
          </Select>
        </Field>
      </SearchPanel>
      <Panel bodyClass="p-0">
        {!orders ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'orderNumber', header: 'Order', render: (o) => <Link to={`/admin/sales/orders/${o.orderNumber}`} className="font-mono text-nop-blue hover:underline">{o.orderNumber}</Link> },
              { key: 'checkoutReference', header: 'Checkout ref', render: (o) => <span className="font-mono text-[12px] text-nop-muted">{o.checkoutReference}</span> },
              { key: 'customerName', header: 'Customer' },
              { key: 'vendorName', header: 'Seller' },
              { key: 'fulfilment', header: 'Fulfilment', render: (o) => <Badge tone={o.fulfilment === 'pickup' ? 'amber' : 'blue'}>{o.fulfilment}</Badge> },
              { key: 'paymentStatus', header: 'Payment', render: (o) => <Badge tone={o.paymentStatus === 'Paid' ? 'green' : 'amber'}>{o.paymentStatus}</Badge> },
              { key: 'stage', header: 'Stage', render: (o) => <Badge tone={o.stage === 'Delivered' ? 'green' : 'slate'}>{o.stage}</Badge> },
              { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.total, o.currency) },
            ]}
            rows={rows}
            rowKey={(o) => o.orderNumber}
            empty="No orders yet. Place one from the storefront."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminOrderDetails() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [tab, setTab] = useState('info');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/orders/${orderNumber}`).then(setOrder).catch(() => {});
  useEffect(() => { load(); }, [orderNumber]);
  if (!order) return <AdminPage title="Order" breadcrumb={crumb({ label: 'Sales' }, { label: 'Orders', to: '/admin/sales/orders' })}><Spinner /></AdminPage>;

  const act = async (fn) => {
    setBusy(true);
    try {
      const res = await fn();
      setNotice(res.message ?? (res.ok === false ? 'Refused.' : 'Done.'));
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'billing', label: 'Billing and shipping' },
    { id: 'products', label: 'Products', count: order.items.length },
    { id: 'shipments', label: 'Shipments', count: order.shipments.length },
  ];

  return (
    <AdminPage
      title={`Order details - ${order.orderNumber}`}
      breadcrumb={crumb({ label: 'Sales' }, { label: 'Orders', to: '/admin/sales/orders' }, { label: order.orderNumber })}
      actions={<ButtonBar backTo="/admin/sales/orders" />}
    >
      {notice && <Alert tone="info">{notice}</Alert>}
      <Panel title="Stage" subtitle="ORD-002: only the transitions in the state model are allowed; any other is rejected and logged">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={order.stage === 'Delivered' ? 'green' : 'slate'}>{order.stage}</Badge>
          <span className="text-nop-muted text-[12.5px]">→</span>
          {order.allowedTransitions.length === 0 && <span className="text-[12.5px] text-nop-muted">final stage</span>}
          {order.allowedTransitions.map((t) => (
            <Button key={t} size="sm" variant="primary" disabled={busy} onClick={() => act(() => api.post(`/orders/${order.orderNumber}/advance`, { to: t }))}>
              {t}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            {order.paymentStatus !== 'Paid' && (
              <Button size="sm" variant="success" disabled={busy} onClick={() => act(() => api.post('/payments/mark-paid', { orderNumber: order.orderNumber, note: 'confirmed from the admin order page' }))}>
                Mark as paid (PAY-036)
              </Button>
            )}
            {order.shipments.length === 0 && (
              <Button size="sm" disabled={busy} onClick={() => act(() => api.post('/logistics/shipments', { orderNumber: order.orderNumber }))}>
                Create shipment (LOG-010)
              </Button>
            )}
          </div>
        </div>
      </Panel>

      <div>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="border border-t-0 border-nop-border bg-white p-4">
          {tab === 'info' && (
            <div className="grid gap-4 md:grid-cols-2">
              <KeyValue rows={[
                ['Order number', <span className="font-mono">{order.orderNumber}</span>],
                ['Order GUID', <span className="font-mono text-[12px]">{order.orderGuid}</span>],
                ['Checkout reference', <span className="font-mono">{order.checkoutReference}</span>],
                ['Placed', new Date(order.placedOnUtc).toLocaleString('en-GB')],
                ['Store', String(order.storeId)],
                ['Customer', `${order.customerName} (${order.customerEmail})`],
                ['Seller', order.vendorName],
              ]}
              />
              <KeyValue rows={[
                ['Payment method', order.paymentMethodSystemName],
                ['Payment status', order.paymentStatus],
                ['Provider reference', <span className="font-mono text-[12px]">{order.paymentProviderRef}</span>],
                ['Sub-total', money(order.subtotal, order.currency)],
                ['Delivery fee', money(order.deliveryFee, order.currency)],
                ['Payment fee', money(order.paymentFee, order.currency)],
                ['Tax', money(order.tax, order.currency)],
                ['Total', <strong>{money(order.total, order.currency)}</strong>],
              ]}
              />
              {order.siblings.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="text-[13px] font-semibold mb-1.5">Sub-orders of this checkout</h3>
                  <Grid
                    dense
                    columns={[
                      { key: 'orderNumber', header: 'Order', render: (s) => <Link to={`/admin/sales/orders/${s.orderNumber}`} className="font-mono text-nop-blue hover:underline">{s.orderNumber}</Link> },
                      { key: 'vendorName', header: 'Seller' },
                      { key: 'stage', header: 'Stage' },
                      { key: 'total', header: 'Total', align: 'right', render: (s) => money(s.total, order.currency) },
                    ]}
                    rows={order.siblings}
                    rowKey={(s) => s.orderNumber}
                  />
                </div>
              )}
            </div>
          )}
          {tab === 'billing' && (
            <div className="grid gap-4 md:grid-cols-2 text-[13px]">
              <div>
                <h3 className="font-semibold mb-1.5">Billing address</h3>
                {order.billingAddress ? <KeyValue rows={Object.entries(order.billingAddress).filter(([, v]) => v)} /> : <p className="text-nop-muted">-</p>}
              </div>
              <div>
                <h3 className="font-semibold mb-1.5">{order.fulfilment === 'pickup' ? 'Collection' : 'Shipping address'}</h3>
                {order.fulfilment === 'pickup'
                  ? <KeyValue rows={[['Outlet', order.pickupPoint?.name], ['City', order.pickupPoint?.city], ['Opening hours', order.pickupPoint?.openingHours], ['Pickup code', order.hasPickupCode ? (order.pickupCodeUsed ? 'used' : 'issued (stored as a hash)') : '-']]} />
                  : (order.shippingAddress ? <KeyValue rows={Object.entries(order.shippingAddress).filter(([, v]) => v)} /> : <p className="text-nop-muted">-</p>)}
              </div>
            </div>
          )}
          {tab === 'products' && (
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
          )}
          {tab === 'shipments' && (
            order.shipments.length === 0
              ? <p className="text-[13px] text-nop-muted">No shipment yet. Use Create shipment above (LOG-010).</p>
              : (
                <Grid
                  columns={[
                    { key: 'trackingNumber', header: 'Tracking number', render: (s) => <Link to={`/track/${s.trackingNumber}`} className="font-mono text-nop-blue hover:underline">{s.trackingNumber}</Link> },
                    { key: 'carrier', header: 'Carrier' },
                    { key: 'shippedOnUtc', header: 'Shipped', render: (s) => (s.shippedOnUtc ? new Date(s.shippedOnUtc).toLocaleString('en-GB') : '-') },
                    { key: 'deliveredOnUtc', header: 'Delivered', render: (s) => (s.deliveredOnUtc ? new Date(s.deliveredOnUtc).toLocaleString('en-GB') : '-') },
                    {
                      key: 'actions',
                      header: '',
                      align: 'right',
                      render: (s) => (!s.shippedOnUtc ? (
                        <Button size="sm" disabled={busy} onClick={() => act(() => api.post(`/logistics/shipments/${s.trackingNumber}/dispatch`))}>Set as dispatched</Button>
                      ) : null),
                    },
                  ]}
                  rows={order.shipments}
                  rowKey={(s) => s.id}
                />
              )
          )}
        </div>
      </div>
    </AdminPage>
  );
}

export function AdminShipments() {
  const [shipments, setShipments] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/logistics/shipments').then(setShipments).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage title="Shipments" breadcrumb={crumb({ label: 'Sales' }, { label: 'Shipments' })} intro="Shipments, their labels and their tracking numbers.">
      <Panel bodyClass="p-0">
        {!shipments ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'trackingNumber', header: 'Tracking number', render: (s) => <Link to={`/track/${s.trackingNumber}`} className="font-mono text-nop-blue hover:underline">{s.trackingNumber}</Link> },
              { key: 'orderNumber', header: 'Order', render: (s) => <Link to={`/admin/sales/orders/${s.orderNumber}`} className="font-mono text-nop-blue hover:underline">{s.orderNumber}</Link> },
              { key: 'carrier', header: 'Carrier' },
              { key: 'totalWeight', header: 'Items', align: 'right' },
              { key: 'shippedOnUtc', header: 'Shipped', render: (s) => (s.shippedOnUtc ? new Date(s.shippedOnUtc).toLocaleString('en-GB') : '-') },
              { key: 'deliveredOnUtc', header: 'Delivered', render: (s) => (s.deliveredOnUtc ? new Date(s.deliveredOnUtc).toLocaleString('en-GB') : '-') },
            ]}
            rows={shipments}
            rowKey={(s) => s.id}
            empty="No shipment yet."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminPayments() {
  const [tx, setTx] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/payments/transactions').then(setTx).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage
      title="Payment transactions"
      breadcrumb={crumb({ label: 'Sales' }, { label: 'Payment transactions' })}
      intro="Payments taken, refunded and waiting, with the transaction behind each one."
    >
      <Panel bodyClass="p-0">
        {!tx ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'systemName', header: 'Method' },
              { key: 'checkoutReference', header: 'Checkout ref', render: (t) => <span className="font-mono text-[12px]">{t.checkoutReference}</span> },
              { key: 'providerRef', header: 'Provider reference', render: (t) => <span className="font-mono text-[12px]">{t.providerRef}</span> },
              { key: 'amount', header: 'Amount', align: 'right', render: (t) => money(t.amount, t.currency) },
              { key: 'groupPayment', header: 'Group', render: (t) => <Badge tone={t.groupPayment ? 'blue' : 'slate'}>{t.groupPayment ? 'several sellers' : 'single'}</Badge> },
              { key: 'status', header: 'Status', render: (t) => <Badge tone={t.status === 'Paid' ? 'green' : t.status === 'Failed' ? 'red' : 'amber'}>{t.status}</Badge> },
            ]}
            rows={tx}
            rowKey={(t) => t.id}
            empty="No payment yet."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminCheckoutExceptions() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get('/checkout-area/checkout/exceptions').then(setRows).catch(() => {}); }, []);
  return (
    <AdminPage
      title="Checkout exceptions"
      breadcrumb={crumb({ label: 'Sales' }, { label: 'Checkout exceptions' })}
      intro="Checkouts that did not finish cleanly: failed placements, confirmations that were not sent and reservations still held."
    >
      <Panel bodyClass="p-0">
        {!rows ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'kind', header: 'Kind' },
              { key: 'checkoutReference', header: 'Checkout ref', render: (r) => <span className="font-mono text-[12px]">{r.checkoutReference}</span> },
              { key: 'feature', header: 'Feature' },
              { key: 'message', header: 'Message' },
              { key: 'createdOnUtc', header: 'When', render: (r) => new Date(r.createdOnUtc).toLocaleString('en-GB') },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="No checkout exception has been recorded. Set a payment mock to failing in the Mocks console and try a checkout to see one."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

/* ---------------------------------------------------------------- customers -- */

export function AdminRoles() {
  const [acl, setAcl] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/identity/acl').then(setAcl).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage title="Customer roles" breadcrumb={crumb({ label: 'Customers' }, { label: 'Customer roles' })} intro="Customer roles and the permissions each one carries. The roles the product needs are created when it is installed.">
      <Panel bodyClass="p-0">
        {!acl ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'systemName', header: 'System name', render: (r) => <span className="font-mono text-[12px]">{r.systemName}</span> },
              {
                key: 'permissions',
                header: 'Permissions granted',
                align: 'right',
                render: (r) => acl.permissions.filter((p) => p.granted.includes(r.systemName)).length,
              },
            ]}
            rows={acl.roles}
            rowKey={(r) => r.systemName}
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminVendors() {
  const [rows, setRows] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/sellers').then(setRows).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage
      title="Vendors"
      breadcrumb={crumb({ label: 'Customers' }, { label: 'Vendors' })}
      intro="SEL-001 seller profile. Most of SEL is held by C-SELLER (Malawi Post) or the KTDA seller-model gap KG-01."
    >
      <Panel bodyClass="p-0">
        {!rows ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Name', render: (v) => <Link to={`/seller/${v.id}`} className="text-nop-blue hover:underline">{v.name}</Link> },
              { key: 'sellerType', header: 'Type' },
              { key: 'district', header: 'Location', render: (v) => v.district ?? v.county ?? '-' },
              { key: 'tier', header: 'Tier', render: (v) => v.tier ?? '-' },
              { key: 'rating', header: 'Rating', align: 'right', render: (v) => (v.rating ? `${v.rating}/5` : '-') },
              { key: 'active', header: 'Active', render: (v) => <Badge tone={v.active ? 'green' : 'red'}>{v.active ? 'Yes' : 'No'}</Badge> },
            ]}
            rows={rows}
            rowKey={(v) => v.id}
          />
        )}
      </Panel>
    </AdminPage>
  );
}
