// nopCommerce administration - Configuration.
// The star of this group is Configuration packs: it shows, per key, which layer won the merge.
// That is the mechanism the Product Goal rests on, so it is shown rather than hidden.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Field, Grid, Input, KeyValue, Panel, SearchPanel,
  Select, Spinner, Tabs, Textarea,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Configuration' }, ...items]} />;

const LAYER_TONE = {
  global: 'slate', country: 'blue', vertical: 'purple', client: 'green', store: 'amber',
};

export function AdminSettings() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [layer, setLayer] = useState('');
  const [control, setControl] = useState(null);
  const [pending, setPending] = useState([]);
  const { content } = useProduct();

  useEffect(() => {
    api.get('/platform/settings').then(setRows).catch(() => {});
    api.get('/platform/change-control').then(setControl).catch(() => {});
    api.get('/platform/change-control/sets?status=PendingApproval').then(setPending).catch(() => {});
  }, [content?.clientName]);

  const controlledKeys = new Set((control?.controlledItems ?? []).map((i) => i.key));
  const pendingFor = (name) => pending.filter((set) => (set.items ?? []).some((i) => i.key === name));
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
      {pending.length > 0 && (
        <Alert tone="warning" title="Changes waiting for approval">
          {pending.length === 1 ? 'One change to a controlled setting is waiting for approval.' : `${pending.length} changes to controlled settings are waiting for approval.`}
          {' '}
          <Link to="/admin/configuration/change-sets" className="underline">Open the change sets</Link>
          .
        </Alert>
      )}
      <Panel bodyClass="p-0" subtitle={rows ? `${filtered.length} of ${rows.length} rows` : undefined}>
        {!rows ? <Spinner /> : (
          <Grid
            dense
            columns={[
              {
                key: 'name',
                header: 'Setting name',
                render: (r) => (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-mono text-[12px]">{r.name}</span>
                    {pendingFor(r.name).length > 0 && <Badge tone="amber" title="a change to this setting is waiting for approval">Pending change</Badge>}
                    {pendingFor(r.name).length === 0 && controlledKeys.has(r.name) && <Badge tone="slate" title="a change to this setting needs approval">Needs approval</Badge>}
                  </span>
                ),
              },
              { key: 'value', header: 'Value', render: (r) => <span className="font-mono text-[12px] break-all">{JSON.stringify(r.value)}</span> },
              { key: 'storeId', header: 'Store', align: 'right', render: (r) => (r.storeId === 0 ? <span title="shared value">0 (shared)</span> : r.storeId) },
              { key: 'layer', header: 'From layer', render: (r) => <Badge tone={LAYER_TONE[r.layer]}>{r.layer}</Badge> },
            ]}
            rows={filtered}
            rowKey={(r) => `${r.name}-${r.storeId}`}
          />
        )}
      </Panel>
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
        <Field label="Feature name or code"><Input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} /></Field>
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
              { key: 'name', header: 'Feature' },
              { key: 'id', header: 'Code', render: (r) => <span className="font-mono text-[12px]">{String(r.id).replace(/^PRD-/, '')}</span> },
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
    </AdminPage>
  );
}

export function AdminStores() {
  const { entities, settings, content } = useProduct();
  const [stores, setStores] = useState(null);
  const [themes, setThemes] = useState(null);
  const [lookup, setLookup] = useState({ key: 'shippingsettings.allowpickupinstore', rows: null });

  useEffect(() => {
    api.get('/platform/stores').then(setStores).catch(() => setStores([]));
    api.get('/platform/branding/themes').then(setThemes).catch(() => {});
  }, [content?.clientName]);

  const look = async (key) => {
    const r = await api.get(`/platform/stores/setting?key=${encodeURIComponent(key)}&allStores=true`);
    setLookup({ key, rows: r.rows });
  };
  useEffect(() => { look(lookup.key).catch(() => {}); }, []);

  return (
    <AdminPage title="Stores" breadcrumb={crumb({ label: 'Stores' })} intro="One installation can run several storefronts - a trade shop and a retail shop, each with its own address, look, catalogue and settings.">
      <Panel bodyClass="p-0">
        {!stores ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Store name' },
              { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
              { key: 'channel', header: 'Channel', render: (r) => <Badge tone={r.channel === 'B2B' ? 'purple' : 'blue'}>{r.channel}</Badge> },
              { key: 'url', header: 'Address', render: (r) => <span className="font-mono text-[12px]">{r.url}</span> },
              { key: 'theme', header: 'Theme', render: (r) => (themes?.rows ?? []).find((t) => t.storeId === r.id)?.theme ?? '-' },
              {
                key: 'logo',
                header: 'Own logo',
                render: (r) => {
                  const row = (themes?.rows ?? []).find((t) => t.storeId === r.id);
                  return row?.logoPictureId ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">Shared</Badge>;
                },
              },
              { key: 'sslEnabled', header: 'SSL', render: (r) => <Badge tone={r.sslEnabled ? 'green' : 'red'}>{r.sslEnabled ? 'Yes' : 'No'}</Badge> },
              { key: 'companyName', header: 'Company', render: (r) => r.companyName ?? content?.clientName },
            ]}
            rows={stores}
            rowKey={(r) => r.id}
          />
        )}
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
      <Panel
        title="A setting across the stores"
        subtitle="A store uses its own value where it has one, and the shared value where it does not."
      >
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <Field label="Setting">
            <Input
              value={lookup.key}
              onChange={(e) => setLookup({ ...lookup, key: e.target.value })}
              className="md:w-96"
            />
          </Field>
          <Button variant="primary" onClick={() => look(lookup.key)}>Show</Button>
        </div>
        {lookup.rows && (
          <Grid
            dense
            rows={lookup.rows}
            rowKey={(r) => r.storeId}
            columns={[
              { key: 'store', header: 'Store' },
              { key: 'value', header: 'Value in use', render: (r) => JSON.stringify(r.value) },
              { key: 'level', header: 'Taken from' },
              { key: 'storeValue', header: 'Own value', render: (r) => (r.storeValue === null ? '-' : JSON.stringify(r.storeValue)) },
              { key: 'sharedValue', header: 'Shared value', render: (r) => (r.sharedValue === null ? '-' : JSON.stringify(r.sharedValue)) },
            ]}
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminLanguages() {
  const [languages, setLanguages] = useState(null);
  const [selector, setSelector] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [upload, setUpload] = useState({ languageId: '', xml: '' });
  const [notice, setNotice] = useState(null);

  const load = () => {
    api.get('/platform/languages').then(setLanguages).catch(() => setLanguages([]));
    api.get('/platform/languages/selector').then(setSelector).catch(() => {});
    api.get('/platform/languages/coverage').then(setCoverage).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const importXml = async () => {
    try {
      const r = await api.post(`/platform/languages/${upload.languageId}/import-xml`, { xml: upload.xml, fileName: 'language.xml' });
      setNotice(r.ok === false
        ? { tone: 'error', text: r.message ?? 'The file was not accepted.' }
        : { tone: 'success', text: `${r.imported} resources imported into ${r.language}.` });
      setUpload({ languageId: '', xml: '' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  return (
    <AdminPage title="Languages" breadcrumb={crumb({ label: 'Languages' })} intro="The languages a shopper can choose, their resources, and the right-to-left layout where a language needs it.">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Panel bodyClass="p-0">
        {!languages ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'culture', header: 'Language culture', render: (l) => <span className="font-mono text-[12px]">{l.culture}</span> },
              { key: 'rtl', header: 'Right-to-left', render: (l) => <Badge tone={l.rtl ? 'amber' : 'slate'}>{l.rtl ? 'Yes' : 'No'}</Badge> },
              { key: 'published', header: 'Published', render: (l) => <Badge tone={l.published ? 'green' : 'red'}>{l.published ? 'Yes' : 'No'}</Badge> },
              { key: 'limitedToStores', header: 'Limited to stores', render: (l) => (l.limitedToStores ? <Badge tone="amber">Yes</Badge> : 'No') },
              {
                key: 'translated',
                header: 'Resources translated',
                align: 'right',
                render: (l) => {
                  const row = (coverage?.rows ?? []).find((c) => c.languageId === l.id);
                  return row ? `${row.translated} of ${row.total}` : '-';
                },
              },
            ]}
            rows={languages}
            rowKey={(l) => l.id}
          />
        )}
      </Panel>
      <Panel title="The language selector of this store" subtitle="Only the published languages of the store are offered to a shopper.">
        {!selector ? <Spinner /> : (
          <KeyValue rows={[
            ['Offered', (selector.languages ?? []).map((l) => l.name).join(', ') || 'none'],
            ['Default', (selector.languages ?? []).find((l) => l.id === selector.defaultLanguageId)?.name ?? '-'],
          ]}
          />
        )}
      </Panel>
      <Panel title="Untranslated text" subtitle="Where a language has no text of its own, the default language is shown instead.">
        {!coverage ? <Spinner /> : (
          <Grid
            dense
            rows={coverage.rows}
            rowKey={(r) => r.languageId}
            columns={[
              { key: 'language', header: 'Language' },
              { key: 'translated', header: 'Translated', align: 'right' },
              { key: 'total', header: 'Of', align: 'right' },
              { key: 'missing', header: 'Missing', render: (r) => (r.missing.length ? r.missing.slice(0, 4).join(', ') + (r.missing.length > 4 ? ` and ${r.missing.length - 4} more` : '') : '-') },
            ]}
          />
        )}
      </Panel>
      <Panel title="Import a language pack" subtitle="A resource file replaces or adds the text of one language.">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Language">
            <Select value={upload.languageId} onChange={(e) => setUpload({ ...upload, languageId: e.target.value })}>
              <option value="">Choose a language</option>
              {(languages ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Resource file">
          <Textarea rows={4} value={upload.xml} onChange={(e) => setUpload({ ...upload, xml: e.target.value })} placeholder={'<Language Name="Chichewa" SupportedVersion="5.00">\n  <LocaleResource Name="..."><Value>...</Value></LocaleResource>\n</Language>'} />
        </Field>
        <div className="mt-3"><Button variant="primary" onClick={importXml} disabled={!upload.languageId || !upload.xml.trim()}>Import</Button></div>
      </Panel>
    </AdminPage>
  );
}

export function AdminCurrencies() {
  const { entities } = useProduct();
  return (
    <AdminPage title="Currencies" breadcrumb={crumb({ label: 'Currencies' })} intro="The currencies this store prices in, and their exchange rates.">
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
      actions={<Button as="link" to="/admin/configuration/payment-routing">Routing rules and connectors</Button>}
    >
      {!methods ? <Spinner /> : (
        <>
          <Panel title="Active for this client" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'name', header: 'Payment method' },
                { key: 'systemName', header: 'System name', render: (m) => <span className="font-mono text-[12px]">{m.systemName}</span> },
                { key: 'kind', header: 'Kind' },
                { key: 'methodType', header: 'Type' },
                { key: 'capture', header: 'Capture' },
                { key: 'supportsGroupPayment', header: 'Group payment', render: (m) => <Badge tone={m.supportsGroupPayment ? 'green' : 'slate'}>{m.supportsGroupPayment ? 'Yes' : 'No'}</Badge> },
                { key: 'additionalFee', header: 'Additional fee', align: 'right', render: (m) => (m.additionalFee ? money(m.additionalFee, 'USD') : '-') },
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
                  { key: 'reason', header: 'Why', render: (m) => m.explanation ?? '-' },
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
  const { content } = useProduct();
  useEffect(() => {
    api.get('/logistics/methods').then(setMethods).catch(() => {});
    api.get('/logistics/pickup-points').then(setPoints).catch(() => {});
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
      <Panel title="Delivery windows">
        <p className="text-[13px] text-nop-muted">
          The time windows offered at checkout are kept on their own screen, with the places each
          one still has: <Link to="/admin/configuration/delivery-windows" className="underline">Delivery windows</Link>.
        </p>
      </Panel>
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
    </AdminPage>
  );
}

export function AdminMessageTemplates() {
  const [messages, setMessages] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/registry/messages').then(setMessages).catch(() => {}); }, []);
  const rows = (messages ?? [])
    // a key the release withdrew carries a note instead of wording: it is not a resource the
    // store uses, so it is not listed here
    .filter((m) => !String(m.text ?? '').startsWith('Withdrawn'))
    .filter((m) => !q || m.key.toLowerCase().includes(q.toLowerCase()) || m.text.toLowerCase().includes(q.toLowerCase()));
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
              { key: 'text', header: 'Text' },
            ]}
            rows={rows.slice(0, 400)}
            rowKey={(m) => m.key}
          />
        )}
      </Panel>
    </AdminPage>
  );
}
