// nopCommerce administration - Configuration.
// The star of this group is Configuration packs: it shows, per key, which layer won the merge.
// That is the mechanism the Product Goal rests on, so it is shown rather than hidden.

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Citation, Field, Grid, Input, KeyValue, Panel, SearchPanel,
  Select, Spinner, Tabs,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Configuration' }, ...items]} />;

const LAYER_TONE = {
  global: 'slate', country: 'blue', vertical: 'purple', client: 'green', store: 'amber',
};

export function AdminSettings() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [layer, setLayer] = useState('');
  const { content } = useProduct();

  useEffect(() => { api.get('/platform/settings').then(setRows).catch(() => {}); }, [content?.clientName]);

  const filtered = (rows ?? []).filter((r) => (!q || r.name.includes(q.toLowerCase())) && (!layer || r.layer === layer));

  return (
    <AdminPage
      title="All settings"
      breadcrumb={crumb({ label: 'Settings' })}
      intro="Every Setting row the pack loader wrote. Runtime resolution is nopCommerce's own two levels: the store value, else the StoreId 0 shared value."
    >
      <SearchPanel onClear={() => { setQ(''); setLayer(''); }}>
        <Field label="Setting name contains"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ordersettings." /></Field>
        <Field label="Pack layer that supplied it">
          <Select value={layer} onChange={(e) => setLayer(e.target.value)}>
            <option value="">All</option>
            {['global', 'country', 'vertical', 'client', 'store'].map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        </Field>
      </SearchPanel>
      <Panel bodyClass="p-0" subtitle={rows ? `${filtered.length} of ${rows.length} rows` : undefined}>
        {!rows ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'name', header: 'Setting name', render: (r) => <span className="font-mono text-[12px]">{r.name}</span> },
              { key: 'value', header: 'Value', render: (r) => <span className="font-mono text-[12px] break-all">{JSON.stringify(r.value)}</span> },
              { key: 'storeId', header: 'Store', align: 'right', render: (r) => (r.storeId === 0 ? <span title="shared value">0 (shared)</span> : r.storeId) },
              { key: 'layer', header: 'From layer', render: (r) => <Badge tone={LAYER_TONE[r.layer]}>{r.layer}</Badge> },
            ]}
            rows={filtered}
            rowKey={(r) => `${r.name}-${r.storeId}`}
          />
        )}
      </Panel>
      <Citation>
        L1 section 6.5: global, country, vertical and client layers exist only in pack files. The PLT-003 loader merges
        them at apply time and writes the result as StoreId 0 rows, store-layer keys as StoreId = n rows (BR-PLT-010).
        No runtime layer resolver is built (NOP-906).
      </Citation>
    </AdminPage>
  );
}

export function AdminPacks() {
  const { packReport, clients, client, switchClient, busy } = useProduct();
  const [inventory, setInventory] = useState(null);
  const [tab, setTab] = useState('chain');
  const [q, setQ] = useState('');

  useEffect(() => { api.get('/platform/packs').then(setInventory).catch(() => {}); }, []);

  const overridden = useMemo(
    () => (packReport?.keys ?? []).filter((k) => k.overrode.length > 0),
    [packReport],
  );
  const keys = (packReport?.keys ?? []).filter((k) => !q || k.key.includes(q.toLowerCase()));

  const tabs = [
    { id: 'chain', label: 'Merge chain', count: packReport?.chain?.length },
    { id: 'keys', label: 'Resolved keys', count: packReport?.keys?.length },
    { id: 'overridden', label: 'Overridden by a later layer', count: overridden.length },
    { id: 'inventory', label: 'Pack inventory' },
    { id: 'problems', label: 'Validation', count: packReport?.problems?.length },
  ];

  return (
    <AdminPage
      title="Configuration packs"
      breadcrumb={crumb({ label: 'Configuration packs' })}
      intro="Onboarding a client is a configuration pack, not a code change. The layers are merged in order — global, country, vertical, client, store — when the pack is applied."
      actions={(
        <div className="flex items-center gap-2">
          {clients.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={c.id === client ? 'primary' : 'default'}
              disabled={busy}
              onClick={() => switchClient(c.id)}
            >
              Apply {c.id}
            </Button>
          ))}
        </div>
      )}
    >
      {!packReport ? <Spinner /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Panel bodyClass="p-3"><div className="text-[12px] text-nop-muted">Active client pack</div><div className="text-[17px] font-semibold">{packReport.client}</div></Panel>
            <Panel bodyClass="p-3"><div className="text-[12px] text-nop-muted">Packs in the chain</div><div className="text-[17px] font-semibold">{packReport.chain.length}</div></Panel>
            <Panel bodyClass="p-3"><div className="text-[12px] text-nop-muted">Resolved keys</div><div className="text-[17px] font-semibold">{packReport.keys.length}</div></Panel>
            <Panel bodyClass="p-3"><div className="text-[12px] text-nop-muted">Keys a later layer overrode</div><div className="text-[17px] font-semibold">{overridden.length}</div></Panel>
          </div>

          <div>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            <div className="border border-t-0 border-nop-border bg-white">
              {tab === 'chain' && (
                <Grid
                  columns={[
                    { key: 'layer', header: 'Layer', render: (c) => <Badge tone={LAYER_TONE[c.layer]}>{c.layer}</Badge> },
                    { key: 'id', header: 'Pack', render: (c) => <span className="font-medium">{c.name ?? c.id}</span> },
                    { key: 'file', header: 'File', render: (c) => <span className="font-mono text-[12px]">{c.file}</span> },
                    { key: 'settings', header: 'Settings', align: 'right' },
                    { key: 'features', header: 'Feature toggles', align: 'right' },
                  ]}
                  rows={packReport.chain}
                  rowKey={(c) => c.file}
                />
              )}
              {tab === 'keys' && (
                <>
                  <div className="p-3 border-b border-nop-border">
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter keys, e.g. ordersettings." className="max-w-sm" />
                  </div>
                  <Grid
                    dense
                    columns={[
                      { key: 'key', header: 'Key', render: (k) => <span className="font-mono text-[12px]">{k.key}</span> },
                      { key: 'value', header: 'Value', render: (k) => <span className="font-mono text-[12px] break-all">{JSON.stringify(k.value)}</span> },
                      { key: 'pack', header: 'Won by', render: (k) => <Badge tone={LAYER_TONE[k.layer]}>{k.pack}</Badge> },
                      { key: 'storeId', header: 'Store', align: 'right', render: (k) => k.storeId },
                      { key: 'overrode', header: 'Overrode', align: 'right', render: (k) => (k.overrode.length ? k.overrode.length : '-') },
                    ]}
                    rows={keys.slice(0, 400)}
                    rowKey={(k) => `${k.key}-${k.storeId}`}
                  />
                </>
              )}
              {tab === 'overridden' && (
                <Grid
                  columns={[
                    { key: 'key', header: 'Key', render: (k) => <span className="font-mono text-[12px]">{k.key}</span> },
                    {
                      key: 'chain',
                      header: 'Merge, earliest layer first',
                      render: (k) => (
                        <span className="flex flex-wrap items-center gap-1.5">
                          {k.overrode.map((o, i) => (
                            <React.Fragment key={i}>
                              <span className="line-through text-nop-muted text-[12px]">{o.pack}: {JSON.stringify(o.value)}</span>
                              <span className="text-gray-300">→</span>
                            </React.Fragment>
                          ))}
                          <span className="text-[12px] font-medium">{k.pack}: {JSON.stringify(k.value)}</span>
                        </span>
                      ),
                    },
                  ]}
                  rows={overridden}
                  rowKey={(k) => k.key}
                  empty="No key was overridden by a later layer in this chain."
                />
              )}
              {tab === 'inventory' && (
                !inventory ? <Spinner /> : (
                  <div className="p-3 space-y-4">
                    {Object.entries(inventory).map(([layer, packs]) => (
                      <div key={layer}>
                        <h3 className="text-[13px] font-semibold mb-1.5 flex items-center gap-2">
                          <Badge tone={LAYER_TONE[layer]}>{layer}</Badge> {packs.length} pack{packs.length === 1 ? '' : 's'}
                        </h3>
                        <Grid
                          dense
                          columns={[
                            { key: 'id', header: 'Pack', render: (p) => <span className="font-medium">{p.name ?? p.id}</span> },
                            { key: 'file', header: 'File', render: (p) => <span className="font-mono text-[12px]">{p.file}</span> },
                            { key: 'settings', header: 'Settings', align: 'right' },
                            { key: 'features', header: 'Features', align: 'right' },
                            { key: 'assignment', header: 'From the workbook', render: (p) => (p.packAssignment ? p.packAssignment.packNames.join(', ') : '-') },
                          ]}
                          rows={packs}
                          rowKey={(p) => p.file}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
              {tab === 'problems' && (
                <div className="p-3 space-y-2">
                  {(packReport.problems ?? []).length === 0
                    ? <Alert tone="success">Every pack in this chain passed validation: no secret, no malformed key, no unknown feature toggle.</Alert>
                    : (packReport.problems.map((p, i) => (
                      <Alert key={i} tone={p.severity === 'refused' ? 'error' : 'warning'} title={`${p.pack} · ${p.key}`}>
                        {p.message} <span className="text-nop-muted">({p.rule})</span>
                      </Alert>
                    )))}
                  <Citation>
                    BR-PLT-013 / decision CFG-01: a secret never travels in a pack. The loader refuses a pack whose key
                    ends in a secret word and lists malformed keys and unknown feature IDs (NFR-X-008 pack validation).
                  </Citation>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminPage>
  );
}

export function AdminFeatureRegistry() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState({ q: '', area: '', phase: '', held: '', enabled: '' });
  const { areas, content } = useProduct();

  useEffect(() => { api.get('/platform/features').then(setRows).catch(() => {}); }, [content?.clientName]);

  const filtered = (rows ?? []).filter((r) => (
    (!filter.q || r.id.toLowerCase().includes(filter.q.toLowerCase()) || r.name.toLowerCase().includes(filter.q.toLowerCase()))
    && (!filter.area || r.area === filter.area)
    && (!filter.phase || r.phase === filter.phase)
    && (!filter.held || (filter.held === 'yes' ? r.held : !r.held))
    && (!filter.enabled || (filter.enabled === 'yes' ? r.enabled : !r.enabled))
  ));

  return (
    <AdminPage
      title="Feature and module registry"
      breadcrumb={crumb({ label: 'Feature registry' })}
      intro="Every feature is a switch. It is read before a page, a widget, a provider or a scheduled task does anything for this store."
    >
      <SearchPanel onClear={() => setFilter({ q: '', area: '', phase: '', held: '', enabled: '' })}>
        <Field label="Feature ID or name"><Input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} /></Field>
        <Field label="Area">
          <Select value={filter.area} onChange={(e) => setFilter({ ...filter, area: e.target.value })}>
            <option value="">All</option>
            {areas.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
          </Select>
        </Field>
        <Field label="Phase">
          <Select value={filter.phase} onChange={(e) => setFilter({ ...filter, phase: e.target.value })}>
            <option value="">All</option>
            {['P1', 'P2', 'P3'].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Held by an open decision">
          <Select value={filter.held} onChange={(e) => setFilter({ ...filter, held: e.target.value })}>
            <option value="">All</option>
            <option value="yes">Held</option>
            <option value="no">Not held</option>
          </Select>
        </Field>
      </SearchPanel>
      <Panel bodyClass="p-0" subtitle={rows ? `${filtered.length} of ${rows.length} features · ${rows.filter((r) => r.enabled).length} switched on for this client · ${rows.filter((r) => r.held).length} held` : undefined}>
        {!rows ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'id', header: 'Feature', render: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
              { key: 'name', header: 'Name' },
              { key: 'area', header: 'Area', render: (r) => <Badge tone="slate">{r.area}</Badge> },
              { key: 'phase', header: 'Phase' },
              { key: 'pack', header: 'Pack' },
              { key: 'enabled', header: 'State', render: (r) => <Badge tone={r.enabled ? 'green' : 'slate'}>{r.enabled ? 'On' : 'Off'}</Badge> },
              {
                key: 'held',
                header: 'Decision',
                render: (r) => (r.held
                  ? <span className="text-[11.5px] text-amber-900">Prototype default - decision {r.heldBy.join(' / ')} pending</span>
                  : <span className="text-nop-muted">-</span>),
              },
            ]}
            rows={filtered.slice(0, 500)}
            rowKey={(r) => r.id}
          />
        )}
      </Panel>
      <Citation>
        Decision P-1: a held feature is built with the PRD's Proposed option and labelled here and in /trace. It is not
        hidden and it is not silently finished.
      </Citation>
    </AdminPage>
  );
}

export function AdminStores() {
  const { entities, settings, content } = useProduct();
  return (
    <AdminPage title="Stores" breadcrumb={crumb({ label: 'Stores' })} intro="PLT-013 multi-store: one client can run a trade storefront and a retail storefront from one installation.">
      <Panel bodyClass="p-0">
        <Grid
          columns={[
            { key: 'name', header: 'Store name' },
            { key: 'channel', header: 'Channel' },
            { key: 'sslEnabled', header: 'SSL enabled', render: () => <Badge tone="green">Yes</Badge> },
            { key: 'company', header: 'Company', render: () => content?.clientName },
          ]}
          rows={content?.storefronts ?? []}
          rowKey={(s) => s.id}
        />
      </Panel>
      <Panel title="Store information">
        <KeyValue rows={[
          ['Store name', settings('storeinformationsettings.storename', '-')],
          ['Default theme', settings('storeinformationsettings.defaultstoretheme', '-')],
          ['Time zone', settings('datetimesettings.defaultstoretimezoneid', '-')],
          ['Primary currency', (entities.currencies ?? []).find((c) => c.primary)?.code ?? '-'],
        ]}
        />
      </Panel>
    </AdminPage>
  );
}

export function AdminLanguages() {
  const { entities } = useProduct();
  return (
    <AdminPage title="Languages" breadcrumb={crumb({ label: 'Languages' })} intro="PLT-009 languages and language packs; PLT-025 translation management. Right-to-left layout is supported where the language needs it.">
      <Panel bodyClass="p-0">
        <Grid
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'culture', header: 'Language culture', render: (l) => <span className="font-mono text-[12px]">{l.culture}</span> },
            { key: 'rtl', header: 'Right-to-left', render: (l) => <Badge tone={l.rtl ? 'amber' : 'slate'}>{l.rtl ? 'Yes' : 'No'}</Badge> },
            { key: 'published', header: 'Published', render: (l) => <Badge tone={l.published ? 'green' : 'red'}>{l.published ? 'Yes' : 'No'}</Badge> },
          ]}
          rows={entities.languages ?? []}
          rowKey={(l) => l.culture}
        />
      </Panel>
      <Citation>
        KTDA: Kiswahili, English, French, Arabic, Russian, Mandarin (REQ-KTDA-LOC-001); right-to-left for Arabic is an
        inference (KG-14). Malawi Post: English and Chichewa (REQ-MPC-FR-023, priority Could). Translation content was
        not supplied, so only the language rows exist (P-5).
      </Citation>
    </AdminPage>
  );
}

export function AdminCurrencies() {
  const { entities } = useProduct();
  return (
    <AdminPage title="Currencies" breadcrumb={crumb({ label: 'Currencies' })} intro="PLT-010 currencies and exchange rates; PLT-024 the rate-provider framework.">
      <Panel bodyClass="p-0">
        <Grid
          columns={[
            { key: 'code', header: 'Currency code', render: (c) => <span className="font-mono">{c.code}</span> },
            { key: 'name', header: 'Name' },
            { key: 'symbol', header: 'Symbol' },
            { key: 'rate', header: 'Rate to primary', align: 'right' },
            { key: 'primary', header: 'Primary', render: (c) => (c.primary ? <Badge tone="green">Primary store currency</Badge> : '-') },
          ]}
          rows={entities.currencies ?? []}
          rowKey={(c) => c.code}
        />
      </Panel>
      <Citation>
        KTDA states a USD base with multi-currency (REQ-KTDA-LOC-002). Rates here are synthetic (P-5) and the settlement
        currency per payment method is open (decision C-FX).
      </Citation>
    </AdminPage>
  );
}

export function AdminPaymentMethods() {
  const [methods, setMethods] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/payments/methods').then(setMethods).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage
      title="Payment methods"
      breadcrumb={crumb({ label: 'Payment methods' })}
      intro="The payment methods this store offers, in the order the configuration pack lists them."
    >
      {!methods ? <Spinner /> : (
        <>
          <Panel title="Active for this client" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'name', header: 'Payment method' },
                { key: 'systemName', header: 'System name', render: (m) => <span className="font-mono text-[12px]">{m.systemName}</span> },
                { key: 'kind', header: 'Kind' },
                { key: 'capture', header: 'Capture' },
                { key: 'supportsGroupPayment', header: 'Group payment', render: (m) => <Badge tone={m.supportsGroupPayment ? 'green' : 'slate'}>{m.supportsGroupPayment ? 'Yes' : 'No'}</Badge> },
                { key: 'additionalFee', header: 'Additional fee', align: 'right', render: (m) => (m.additionalFee ? money(m.additionalFee, 'USD') : '-') },
                { key: 'feature', header: 'Feature', render: (m) => <span className="font-mono text-[12px]">{m.feature}</span> },
              ]}
              rows={methods.available}
              rowKey={(m) => m.systemName}
            />
          </Panel>
          {methods.excluded.length > 0 && (
            <Panel title="Active but not offered for the current cart" bodyClass="p-0">
              <Grid
                dense
                columns={[
                  { key: 'name', header: 'Payment method' },
                  { key: 'reason', header: 'Why', render: (m) => m.citation },
                ]}
                rows={methods.excluded}
                rowKey={(m) => m.systemName}
              />
            </Panel>
          )}
        </>
      )}
    </AdminPage>
  );
}

export function AdminShippingMethods() {
  const [methods, setMethods] = useState(null);
  const [points, setPoints] = useState(null);
  const [slots, setSlots] = useState(null);
  const { content } = useProduct();
  useEffect(() => {
    api.get('/logistics/methods').then(setMethods).catch(() => {});
    api.get('/logistics/pickup-points').then(setPoints).catch(() => {});
    api.get('/logistics/delivery-slots').then(setSlots).catch(() => {});
  }, [content?.clientName]);
  return (
    <AdminPage title="Shipping methods" breadcrumb={crumb({ label: 'Shipping methods' })} intro="Delivery methods and their rates, the pickup points and outlets, and the delivery windows offered at checkout.">
      <Panel title="Shipping methods" bodyClass="p-0">
        {!methods ? <Spinner /> : <Grid columns={[{ key: 'name', header: 'Name' }, { key: 'description', header: 'Description' }]} rows={methods} rowKey={(m) => m.name} />}
      </Panel>
      <Panel title="Pickup points and outlets" bodyClass="p-0">
        {!points ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Outlet' },
              { key: 'city', header: 'City' },
              { key: 'openingHours', header: 'Opening hours' },
              { key: 'acceptsReturns', header: 'Accepts returns', render: (p) => <Badge tone={p.acceptsReturns ? 'green' : 'slate'}>{p.acceptsReturns ? 'Yes' : 'No'}</Badge> },
              { key: 'capacityParcels', header: 'Capacity', align: 'right' },
            ]}
            rows={points}
            rowKey={(p) => p.id}
          />
        )}
      </Panel>
      <Panel title="Delivery windows" bodyClass="p-0">
        {!slots ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Window' },
              { key: 'capacity', header: 'Capacity', align: 'right' },
              { key: 'days', header: 'Days', render: (s) => (s.days ?? []).join(', ') },
            ]}
            rows={slots}
            rowKey={(s) => s.id}
          />
        )}
      </Panel>
      <Citation>
        BR-CHK-010: window capacity is checked and reserved at placement under the lock chk-slot-{'{SlotId}'}-{'{Date}'};
        a cancelled order releases its place. Outlet capacity and closures are LOG-003 extensions in the Postal pack.
      </Citation>
    </AdminPage>
  );
}

export function AdminAcl() {
  const [acl, setAcl] = useState(null);
  const [q, setQ] = useState('');
  const { content } = useProduct();
  useEffect(() => { api.get('/identity/acl').then(setAcl).catch(() => {}); }, [content?.clientName]);

  const rows = (acl?.permissions ?? []).filter((p) => !q
    || p.systemName.toLowerCase().includes(q.toLowerCase())
    || (p.category ?? '').toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminPage
      title="Access control list"
      breadcrumb={crumb({ label: 'Access control list' })}
      intro="Which customer roles hold which permissions. Viewing and changing are separate permissions."
    >
      {!acl ? <Spinner /> : (
        <>
          <div className="max-w-sm"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter permissions, e.g. Checkout.Core" /></div>
          <Panel bodyClass="p-0" subtitle={`${rows.length} of ${acl.permissions.length} permissions · ${acl.roles.length} roles`}>
            <div className="overflow-x-auto">
              <table className="w-full nop-grid border-collapse">
                <thead>
                  <tr>
                    <th>Permission (system name)</th>
                    <th>Category</th>
                    <th>Area</th>
                    {acl.roles.map((r) => <th key={r.systemName} className="text-center">{r.name}</th>)}
                  </tr>
                </thead>
                <tbody className="text-[12.5px]">
                  {rows.slice(0, 300).map((p) => (
                    <tr key={p.systemName}>
                      <td className="font-mono text-[12px]">{p.systemName}</td>
                      <td>{p.category}</td>
                      <td><Badge tone="slate">{p.area ?? '-'}</Badge></td>
                      {acl.roles.map((r) => (
                        <td key={r.systemName} className="text-center">
                          {p.granted.includes(r.systemName)
                            ? <span className="text-nop-green font-semibold" title="granted">✓</span>
                            : <span className="text-gray-300">·</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
      <Citation>
        IAM-008 adds a scope to a grant (outlet, warehouse, seller, agency, company), which the native model has no field
        for - in the real build that is the IAM-008 plugin plus the one core modification listed in L1 section 6.3.
      </Citation>
    </AdminPage>
  );
}

export function AdminMessageTemplates() {
  const [messages, setMessages] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/registry/messages').then(setMessages).catch(() => {}); }, []);
  const rows = (messages ?? []).filter((m) => !q || m.key.toLowerCase().includes(q.toLowerCase()) || m.text.toLowerCase().includes(q.toLowerCase()));
  return (
    <AdminPage
      title="Message templates and locale resources"
      breadcrumb={crumb({ label: 'Message templates' })}
      intro="The e-mail templates and the wording used across the store."
    >
      <div className="max-w-sm"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter, e.g. Chk." /></div>
      <Panel bodyClass="p-0" subtitle={messages ? `${rows.length} of ${messages.length} keys` : undefined}>
        {!messages ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'key', header: 'Resource key', render: (m) => <span className="font-mono text-[12px]">{m.key}</span> },
              { key: 'area', header: 'Area', render: (m) => <Badge tone="slate">{m.area}</Badge> },
              { key: 'text', header: 'Default English text (Proposed)' },
              { key: 'usedBy', header: 'Used by', render: (m) => <span className="font-mono text-[11.5px] text-nop-muted">{m.usedBy.slice(0, 3).join(', ')}</span> },
            ]}
            rows={rows.slice(0, 400)}
            rowKey={(m) => m.key}
          />
        )}
      </Panel>
      <Citation>
        Definition of Done criterion 8: all user-facing text is a locale resource, so a client language pack translates
        it. Native resources are reused unchanged.
      </Citation>
    </AdminPage>
  );
}
