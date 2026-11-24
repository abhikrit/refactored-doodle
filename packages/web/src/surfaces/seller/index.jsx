// Seller portal - the vendor-scoped area (SEL-008 seller home page and onboarding checklist).
// Most of SEL is held by C-SELLER (Malawi Post) or by the KTDA seller-model gap KG-01, so the
// prototype shows the Proposed option labelled with the decision (P-1).

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import { PrototypeBar } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Button, Citation, Grid, HeldLabel, KeyValue, Panel, Spinner, StatTile,
} from '../../ui/nop/kit.jsx';

function SellerShell({ children, vendor }) {
  const { content } = useProduct();
  return (
    <div className="min-h-full bg-nop-canvas">
      <div className="bg-nop-sidebar text-gray-200">
        <div className="mx-auto max-w-[1280px] px-4 py-3 flex flex-wrap items-center gap-3">
          <div>
            <div className="text-white font-semibold">{vendor ? vendor.name : 'Seller portal'}</div>
            <div className="text-[11.5px] text-gray-400">
              {content?.clientName} · vendor-scoped area · permission Marketplace.Core.SellerPortal.Access
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button as="link" to="/seller" size="sm">All sellers</Button>
            <Button as="link" to="/" size="sm">Public store</Button>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-[1280px] px-4 py-5 space-y-4">{children}</main>
    </div>
  );
}

export function SellerList() {
  const [sellers, setSellers] = useState(null);
  const { content, features } = useProduct();
  useEffect(() => { api.get('/sellers').then(setSellers).catch(() => {}); }, [content?.clientName]);
  const sel = features.filter((f) => f.area === 'SEL');

  return (
    <SellerShell>
      <Alert tone="info" title="Marketplace pack">
        The seller model is open for both clients: gap KG-01 for KTDA (is KTDA the only seller, or do the factories and
        subsidiaries sell?) and gap MG-02 for Malawi Post (does Malawi Post sell, or do SMEs sell through it?).
        {' '}{sel.filter((f) => f.held).length} of {sel.length} SEL features are held by an open decision.
      </Alert>
      <Panel title="Sellers" bodyClass="p-0">
        {!sellers ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Seller', render: (v) => <Link to={`/seller/${v.id}`} className="text-nop-blue hover:underline font-medium">{v.name}</Link> },
              { key: 'sellerType', header: 'Type' },
              { key: 'location', header: 'Location', render: (v) => v.district ?? v.county ?? '-' },
              { key: 'tier', header: 'Tier', render: (v) => (v.tier ? <Badge tone="slate">{v.tier}</Badge> : '-') },
              { key: 'rating', header: 'Rating', align: 'right', render: (v) => (v.rating ? `${v.rating}/5` : '-') },
              { key: 'open', header: '', align: 'right', render: (v) => <Button size="sm" as="link" to={`/seller/${v.id}`}>Open portal</Button> },
            ]}
            rows={sellers}
            rowKey={(v) => v.id}
          />
        )}
      </Panel>
    </SellerShell>
  );
}

export function SellerDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const { features } = useProduct();
  useEffect(() => { api.get(`/sellers/${id}/dashboard`).then(setData).catch(() => {}); }, [id]);
  if (!data) return <SellerShell><Spinner /></SellerShell>;

  const onboarding = [
    { label: 'Seller application and profile', feature: 'PRD-SEL-001', done: true },
    { label: 'Seller documents', feature: 'PRD-SEL-002', done: false },
    { label: 'Approval stages and levels', feature: 'PRD-SEL-003', done: false },
    { label: 'Identity and registry checks', feature: 'PRD-SEL-004', done: false },
    { label: 'Payout account', feature: 'PRD-SEL-005', done: false },
    { label: 'Seller agreement accepted', feature: 'PRD-SEL-006', done: false },
  ].map((s) => ({ ...s, detail: features.find((f) => f.id === s.feature) }));

  return (
    <SellerShell vendor={data.vendor}>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Products listed" value={data.products} tone="blue" />
        <StatTile label="Orders" value={data.orders} tone="green" hint={`${data.openOrders} open`} />
        <StatTile label="Revenue" value={money(data.revenue, 'USD')} tone="amber" hint="Sum of sub-order sub-totals" />
        <StatTile label="Commission" value={money(data.commission, 'USD')} tone="slate" hint={`${(data.commissionRate * 100).toFixed(0)}% prototype default`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Onboarding checklist" subtitle="SEL-008 seller home page and onboarding checklist">
          <ul className="space-y-2">
            {onboarding.map((s) => (
              <li key={s.feature} className="flex items-start gap-2">
                <span className={`mt-0.5 size-4 rounded-sm border grid place-items-center text-[10px] ${s.done ? 'bg-nop-green border-nop-green text-white' : 'border-nop-border'}`}>
                  {s.done ? '✓' : ''}
                </span>
                <span className="min-w-0">
                  <Link to={`/explorer/features/${s.feature}`} className="text-[13px] text-nop-blue hover:underline">{s.label}</Link>
                  <span className="block"><HeldLabel feature={s.detail} /></span>
                </span>
              </li>
            ))}
          </ul>
          <Citation className="mt-3">
            The checklist steps are SEL features; those shown with a label are held by an open decision and build the
            PRD's Proposed option in the prototype (P-1).
          </Citation>
        </Panel>

        <Panel title="Recent sub-orders" bodyClass="p-0" subtitle="A seller sees only its own sub-order (CHK-004, ORD-005)">
          <Grid
            dense
            columns={[
              { key: 'orderNumber', header: 'Order', render: (o) => <span className="font-mono text-[12px]">{o.orderNumber}</span> },
              { key: 'fulfilment', header: 'Fulfilment' },
              { key: 'stage', header: 'Stage', render: (o) => <Badge tone={o.stage === 'Delivered' ? 'green' : 'slate'}>{o.stage}</Badge> },
              { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.total, o.currency) },
            ]}
            rows={data.recentOrders}
            rowKey={(o) => o.orderNumber}
            empty="No sub-order for this seller yet."
          />
        </Panel>
      </div>

      <Panel title="Commission and settlement">
        <KeyValue rows={[
          ['Commission rate', `${(data.commissionRate * 100).toFixed(0)}% (prototype default)`],
          ['Commission rules', 'SEL-016 - a client configuration (CommissionRule), not code'],
          ['Settlement cycle', 'SEL-017 - held by PAY-DIRECT / LIC-01; Malawi Post states daily and weekly cycles (FR-145)'],
          ['Commission invoices', 'SEL-025 - held by DOC-LIB, E-INV, PAID-STUB, PH-INF and PO-REC-v8'],
        ]}
        />
        <Citation className="mt-3">{data.commissionNote}</Citation>
      </Panel>
    </SellerShell>
  );
}

export { PrototypeBar };
