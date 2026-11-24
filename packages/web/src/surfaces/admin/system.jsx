// nopCommerce administration - System, Local plugins and the screen register.

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Citation, Field, Grid, Input, KeyValue, Panel, SearchPanel,
  Select, Spinner, StatTile, Tabs,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'System' }, ...items]} />;

export function AdminAudit() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState({ area: '', event: '', actor: '' });
  const { areas, content } = useProduct();

  const load = () => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(filter)) if (v) sp.set(k, v);
    api.get(`/security/audit${sp.toString() ? `?${sp}` : ''}`).then(setRows).catch(() => {});
  };
  useEffect(() => { load(); }, [filter, content?.clientName]);

  return (
    <AdminPage
      title="Platform audit trail"
      breadcrumb={crumb({ label: 'Audit trail' })}
      intro="PRD-SEC-004. Every write in the prototype goes through the trail with the actor, the entity, the before and after values and the AUD event code from the module chapter."
    >
      <SearchPanel onClear={() => setFilter({ area: '', event: '', actor: '' })}>
        <Field label="Area">
          <Select value={filter.area} onChange={(e) => setFilter({ ...filter, area: e.target.value })}>
            <option value="">All</option>
            {areas.map((a) => <option key={a.code} value={a.code}>{a.code}</option>)}
          </Select>
        </Field>
        <Field label="Event code"><Input value={filter.event} onChange={(e) => setFilter({ ...filter, event: e.target.value })} placeholder="AUD-CHK-004-01" /></Field>
        <Field label="Actor"><Input value={filter.actor} onChange={(e) => setFilter({ ...filter, actor: e.target.value })} /></Field>
      </SearchPanel>
      <Panel bodyClass="p-0" subtitle={rows ? `${rows.length} entries` : undefined}>
        {!rows ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'occurredOnUtc', header: 'When', width: 160, render: (r) => new Date(r.occurredOnUtc).toLocaleString('en-GB') },
              { key: 'event', header: 'Event', render: (r) => <span className="font-mono text-[12px]">{r.event}</span> },
              { key: 'area', header: 'Area', render: (r) => <Badge tone="slate">{r.area}</Badge> },
              { key: 'feature', header: 'Feature', render: (r) => <Link to={`/explorer/features/${r.feature}`} className="font-mono text-[12px] text-nop-blue hover:underline">{r.feature}</Link> },
              { key: 'entity', header: 'Entity', render: (r) => `${r.entity}${r.entityId ? ` #${r.entityId}` : ''}` },
              { key: 'actor', header: 'Actor', render: (r) => <span>{r.actor}<span className="block text-[11px] text-nop-muted">{r.actorRole}</span></span> },
              { key: 'outcome', header: 'Outcome', render: (r) => <Badge tone={r.outcome === 'success' ? 'green' : 'red'}>{r.outcome}</Badge> },
              {
                key: 'change',
                header: 'Before → after',
                render: (r) => (
                  <span className="font-mono text-[11px] text-nop-muted break-all">
                    {r.before ? JSON.stringify(r.before) : '-'} → {r.after ? JSON.stringify(r.after) : '-'}
                  </span>
                ),
              },
              { key: 'note', header: 'Note' },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="Nothing has been audited yet in this session."
          />
        )}
      </Panel>
      <Citation>
        SEC-010 gives an auditor read-only access. In the prototype the Auditor role reaches this screen and nothing
        that writes.
      </Citation>
    </AdminPage>
  );
}

export function AdminMessages() {
  const [rows, setRows] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/tracking/messages').then(setRows).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage
      title="Message queue and delivery records"
      breadcrumb={crumb({ label: 'Message queue' })}
      intro="TRK-005 multi-channel messaging and TRK-007 delivery records. Routing per event and channel comes from the pack (decision MSG-ROUTE); every gateway is a mock (P-3)."
    >
      <Panel bodyClass="p-0" subtitle={rows ? `${rows.length} messages` : undefined}>
        {!rows ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'sentOnUtc', header: 'When', width: 160, render: (r) => new Date(r.sentOnUtc).toLocaleString('en-GB') },
              { key: 'channel', header: 'Channel', render: (r) => <Badge tone={r.channel === 'sms' ? 'amber' : r.channel === 'email' ? 'blue' : 'slate'}>{r.channel}</Badge> },
              { key: 'event', header: 'Event / resource key', render: (r) => <span className="font-mono text-[12px]">{r.event}</span> },
              { key: 'to', header: 'To' },
              { key: 'text', header: 'Text' },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'sent' ? 'green' : r.status === 'failed' ? 'red' : 'slate'}>{r.status}</Badge> },
              { key: 'providerRef', header: 'Provider ref', render: (r) => <span className="font-mono text-[11.5px]">{r.providerRef ?? '-'}</span> },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="No message has been sent yet."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminTracking() {
  const [rows, setRows] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/tracking/hub').then(setRows).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage title="Tracking update hub" breadcrumb={crumb({ label: 'Tracking hub' })} intro="TRK-002. Carrier and postal codes are normalised to the product event dictionary.">
      <Panel bodyClass="p-0">
        {!rows ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'occurredOnUtc', header: 'When', width: 160, render: (r) => new Date(r.occurredOnUtc).toLocaleString('en-GB') },
              { key: 'trackingNumber', header: 'Tracking number', render: (r) => <Link to={`/track/${r.trackingNumber}`} className="font-mono text-[12px] text-nop-blue hover:underline">{r.trackingNumber}</Link> },
              { key: 'code', header: 'Event code' },
              { key: 'description', header: 'Description' },
              { key: 'location', header: 'Location' },
              { key: 'sourceSystem', header: 'Source' },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="No tracking event yet."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

export function AdminMocks() {
  const [data, setData] = useState(null);
  const [calls, setCalls] = useState([]);
  const [tab, setTab] = useState('adapters');

  const load = () => {
    api.get('/mocks').then(setData).catch(() => {});
    api.get('/mocks/calls').then(setCalls).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const setHealth = async (systemName, health) => {
    await api.post(`/mocks/${systemName}/health`, { health });
    load();
  };

  const tabs = [
    { id: 'adapters', label: 'Adapters', count: data?.adapters?.length },
    { id: 'calls', label: 'Recent calls', count: calls.length },
    { id: 'features', label: 'External-system features', count: data?.externalSystemFeatures?.length },
  ];

  return (
    <AdminPage
      title="Mocks console"
      breadcrumb={crumb({ label: 'Mocks console' })}
      intro="Decision P-3: the 45 external-system features are mocks with recorded sample payloads, switchable to real sandboxes later. Nothing here reaches the network."
    >
      {!data ? <Spinner /> : (
        <>
          <Alert tone="info">{data.note}</Alert>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="border border-t-0 border-nop-border bg-white">
            {tab === 'adapters' && (
              <Grid
                columns={[
                  { key: 'name', header: 'External system' },
                  { key: 'systemName', header: 'System name', render: (a) => <span className="font-mono text-[12px]">{a.systemName}</span> },
                  { key: 'category', header: 'Category', render: (a) => <Badge tone="slate">{a.category}</Badge> },
                  { key: 'country', header: 'Country', render: (a) => a.country ?? '-' },
                  { key: 'interfaceName', header: 'Behind the interface', render: (a) => <span className="font-mono text-[11.5px]">{a.interfaceName}</span> },
                  { key: 'feature', header: 'Feature', render: (a) => <Link to={`/explorer/features/${a.feature}`} className="font-mono text-[12px] text-nop-blue hover:underline">{a.feature}</Link> },
                  { key: 'calls', header: 'Calls', align: 'right' },
                  {
                    key: 'health',
                    header: 'Health',
                    render: (a) => (
                      <div className="flex items-center gap-1">
                        {['healthy', 'slow', 'failing'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHealth(a.systemName, h)}
                            className={`px-1.5 py-0.5 rounded-sm border text-[11px] ${a.health === h
                              ? (h === 'healthy' ? 'bg-emerald-600 text-white border-emerald-700'
                                : h === 'slow' ? 'bg-amber-500 text-white border-amber-600'
                                  : 'bg-red-600 text-white border-red-700')
                              : 'bg-white border-nop-border text-nop-muted'}`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    ),
                  },
                ]}
                rows={data.adapters}
                rowKey={(a) => a.systemName}
              />
            )}
            {tab === 'calls' && (
              <Grid
                dense
                columns={[
                  { key: 'at', header: 'When', width: 160, render: (c) => new Date(c.at).toLocaleString('en-GB') },
                  { key: 'systemName', header: 'System', render: (c) => <span className="font-mono text-[12px]">{c.systemName}</span> },
                  { key: 'operation', header: 'Operation' },
                  { key: 'outcome', header: 'Outcome', render: (c) => <Badge tone={c.outcome === 'success' ? 'green' : 'red'}>{c.outcome}</Badge> },
                  { key: 'ms', header: 'ms', align: 'right' },
                  { key: 'request', header: 'Request', render: (c) => <span className="font-mono text-[11px] break-all">{JSON.stringify(c.request).slice(0, 160)}</span> },
                  { key: 'response', header: 'Response / error', render: (c) => <span className="font-mono text-[11px] break-all">{(c.error ?? JSON.stringify(c.response ?? '')).slice(0, 160)}</span> },
                ]}
                rows={calls}
                rowKey={(c, i) => `${c.systemName}-${i}`}
                empty="No adapter has been called yet."
              />
            )}
            {tab === 'features' && (
              <Grid
                dense
                columns={[
                  { key: 'PRD ID', header: 'Feature', render: (f) => <Link to={`/explorer/features/${f['PRD ID']}`} className="font-mono text-[12px] text-nop-blue hover:underline">{f['PRD ID']}</Link> },
                  { key: 'Feature', header: 'Name' },
                  { key: 'External element and integration', header: 'External element and integration' },
                ]}
                rows={data.externalSystemFeatures}
                rowKey={(f) => f['PRD ID']}
              />
            )}
          </div>
        </>
      )}
      <Citation>
        L1 section 6.9 lists the 45 external-system features. Each adapter here sits behind the interface the PRD names,
        so a real sandbox (for example Safaricom Daraja) replaces the mock without changing the callers.
      </Citation>
    </AdminPage>
  );
}

export function AdminDiagnostics() {
  const [data, setData] = useState(null);
  const { content } = useProduct();
  useEffect(() => { api.get('/platform/diagnostics').then(setData).catch(() => {}); }, [content?.clientName]);
  return (
    <AdminPage
      title="Diagnostics"
      breadcrumb={crumb({ label: 'Diagnostics' })}
      intro="Prototype internals: the in-memory store (P-4 deviation - no database), the named locks taken and the events published."
    >
      {!data ? <Spinner /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="In-memory store" subtitle="Entity → row count">
            <KeyValue rows={Object.entries(data.store).sort((a, b) => b[1] - a[1])} />
            <Citation className="mt-3">
              Deviation from handoff decision P-4: there is no MySQL or SQL Server. The store is a Map per table behind
              an async IRepository-shaped interface, so callers port unchanged to Nop.Data.
            </Citation>
          </Panel>
          <Panel title="Named locks taken" subtitle="ILocker keys as the PRD writes them">
            {data.locks.length === 0 ? <p className="text-[13px] text-nop-muted">No lock taken yet.</p> : (
              <ul className="text-[12px] font-mono space-y-1">
                {data.locks.map((l, i) => <li key={i}>{l.key}</li>)}
              </ul>
            )}
          </Panel>
          <Panel title="Events published" subtitle="Consumers only notify or enqueue, and swallow exceptions">
            {data.events.length === 0 ? <p className="text-[13px] text-nop-muted">No event published yet.</p> : (
              <ul className="text-[12px] font-mono space-y-1">
                {data.events.map((e, i) => <li key={i}>{e.eventName}</li>)}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AdminPage>
  );
}

export function AdminPlugins() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('plugins');
  useEffect(() => { api.get('/platform/plugins').then(setData).catch(() => {}); }, []);

  const tabs = [
    { id: 'plugins', label: 'Local plugins', count: data?.plugins?.length },
    { id: 'overrides', label: 'Override register (OVR-REG)', count: data?.overrideRegister?.length },
    { id: 'providers', label: 'Provider register', count: data?.providerRegister?.length },
    { id: 'consumers', label: 'Event consumers', count: data?.consumerRegister?.length },
    { id: 'core', label: 'Core modifications', count: data?.coreModifications?.length },
    { id: 'licensed', label: 'Licensed plugins', count: data?.licensedPlugins?.length },
  ];

  return (
    <AdminPage
      title="Local plugins"
      breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Local plugins' }]} />}
      intro="One plugin per area that needs code, exactly as CLAUDE.md requires. In the .NET build each is src/Plugins/Nop.Plugin.Product.<Area> with plugin.json SupportedVersions 5.00."
    >
      {!data ? <Spinner /> : (
        <>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="border border-t-0 border-nop-border bg-white">
            {tab === 'plugins' && (
              <Grid
                columns={[
                  { key: 'systemName', header: 'System name', render: (p) => <span className="font-mono text-[12px]">{p.systemName}</span> },
                  { key: 'friendlyName', header: 'Friendly name' },
                  { key: 'area', header: 'Area', render: (p) => <Link to={`/explorer/areas/${p.area}`} className="text-nop-blue hover:underline">{p.area}</Link> },
                  { key: 'wave', header: 'Wave', render: (p) => `${p.wave} ${p.waveName}` },
                  { key: 'features', header: 'Features', align: 'right', render: (p) => p.counts.features },
                  { key: 'criteria', header: 'ACs', align: 'right', render: (p) => p.counts.criteria },
                  { key: 'held', header: 'Held', align: 'right', render: (p) => (p.counts.held ? <Badge tone="amber">{p.counts.held}</Badge> : '-') },
                  { key: 'supported', header: 'Supported versions', render: (p) => p.supportedVersions.join(', ') },
                  { key: 'directory', header: 'Directory', render: (p) => <span className="font-mono text-[11px] text-nop-muted">{p.directory}</span> },
                  { key: 'configure', header: '', align: 'right', render: (p) => <Button size="sm" as="link" to={`/explorer/areas/${p.area}`}>Configure</Button> },
                ]}
                rows={data.plugins}
                rowKey={(p) => p.systemName}
              />
            )}
            {tab === 'overrides' && (
              <>
                <Grid
                  columns={[
                    { key: 'service', header: 'nopCommerce service', render: (o) => <span className="font-mono text-[12px]">{o.service}</span> },
                    { key: 'owner', header: 'Owner', render: (o) => <span className="font-mono text-[12px]">{o.owner}</span> },
                    { key: 'feature', header: 'Owning feature', render: (o) => <Link to={`/explorer/features/${o.feature}`} className="font-mono text-[12px] text-nop-blue hover:underline">{o.feature}</Link> },
                    { key: 'startupOrder', header: 'INopStartup order', align: 'right' },
                    { key: 'note', header: 'Note' },
                  ]}
                  rows={data.overrideRegister}
                  rowKey={(o) => o.service}
                />
                <div className="p-3">
                  <Citation>
                    Decision OVR-REG / L1 section 6.2 principle 7: one owner per overridden service. The prototype's
                    registry refuses a second claim, so a module can only plug in through the owner's contract.
                  </Citation>
                </div>
              </>
            )}
            {tab === 'providers' && (
              <div className="divide-y divide-gray-100">
                {data.providerRegister.map((c) => (
                  <div key={c.contract} className="p-3">
                    <div className="font-mono text-[12.5px] font-semibold">{c.contract}</div>
                    <ul className="mt-1 text-[12.5px] text-nop-muted space-y-0.5">
                      {c.providers.map((p) => (
                        <li key={p.name}>
                          {p.order}. <span className="font-mono">{p.area}</span> · {p.name} · {p.feature}
                          {p.substitute ? ` · substitute for a ${p.substitute} product (P-2)` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {tab === 'consumers' && (
              <div className="divide-y divide-gray-100">
                {data.consumerRegister.map((e) => (
                  <div key={e.eventName} className="p-3">
                    <div className="font-mono text-[12.5px] font-semibold">{e.eventName}</div>
                    <ul className="mt-1 text-[12.5px] text-nop-muted">
                      {e.consumers.map((c) => <li key={c.name}>{c.area} · {c.name} · {c.feature}</li>)}
                    </ul>
                  </div>
                ))}
                <div className="p-3">
                  <Citation>
                    L1 section 6.2 principle 8: consumers only notify or enqueue and swallow exceptions. No validation
                    and no state change belongs in a consumer.
                  </Citation>
                </div>
              </div>
            )}
            {tab === 'core' && (
              <>
                <Grid
                  dense
                  columns={Object.keys(data.coreModifications[0] ?? {}).slice(0, 5).map((k) => ({ key: k, header: k }))}
                  rows={data.coreModifications}
                  rowKey={(r, i) => i}
                />
                <div className="p-3">
                  <Citation>
                    L1 section 6.3: six features involve a core modification. Everything else is a plugin
                    (CLAUDE.md: "Never edit nopCommerce core, except entries listed in the core-modification register").
                  </Citation>
                </div>
              </>
            )}
            {tab === 'licensed' && (
              <>
                <Grid
                  dense
                  columns={[
                    { key: 'PRD ID', header: 'Feature', render: (r) => <Link to={`/explorer/features/${r['PRD ID']}`} className="font-mono text-[12px] text-nop-blue hover:underline">{r['PRD ID']}</Link> },
                    { key: 'Feature', header: 'Name' },
                    { key: 'Candidate and condition', header: 'Candidate and condition' },
                  ]}
                  rows={data.licensedPlugins}
                  rowKey={(r) => r['PRD ID']}
                />
                <div className="p-3">
                  <Citation>
                    Decision P-2: no purchases for the prototype. Each licensed or paid-stub feature gets a minimal
                    in-house equivalent behind the same extension point, or a mock. Vendor 5.00 builds are unverified
                    (V-01 / VENDOR-500).
                  </Citation>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </AdminPage>
  );
}

export function AdminScreens() {
  const { screens, areas } = useProduct();
  const [filter, setFilter] = useState({ q: '', area: '', surface: '', native: '' });

  const surfaces = useMemo(() => [...new Set(screens.map((s) => s.surface))].sort(), [screens]);
  const rows = screens.filter((s) => (
    (!filter.q || s.screen.toLowerCase().includes(filter.q.toLowerCase()))
    && (!filter.area || s.area === filter.area)
    && (!filter.surface || s.surface === filter.surface)
    && (!filter.native || (filter.native === 'native' ? s.native : !s.native))
  ));

  return (
    <AdminPage
      title="Screen register"
      breadcrumb={<Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Screens' }]} />}
      intro={`All ${screens.length} screens the 24 module chapters list in their section 11.1, with the surface they live on and whether they are native nopCommerce pages or new.`}
    >
      <SearchPanel onClear={() => setFilter({ q: '', area: '', surface: '', native: '' })}>
        <Field label="Screen contains"><Input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} /></Field>
        <Field label="Area">
          <Select value={filter.area} onChange={(e) => setFilter({ ...filter, area: e.target.value })}>
            <option value="">All</option>
            {areas.map((a) => <option key={a.code} value={a.code}>{a.code}</option>)}
          </Select>
        </Field>
        <Field label="Surface">
          <Select value={filter.surface} onChange={(e) => setFilter({ ...filter, surface: e.target.value })}>
            <option value="">All</option>
            {surfaces.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Native or new">
          <Select value={filter.native} onChange={(e) => setFilter({ ...filter, native: e.target.value })}>
            <option value="">All</option>
            <option value="native">Native (extended)</option>
            <option value="new">New</option>
          </Select>
        </Field>
      </SearchPanel>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Screens in the product" value={screens.length} tone="blue" />
        <StatTile label="Native pages, extended" value={screens.filter((s) => s.native).length} tone="green" />
        <StatTile label="New screens" value={screens.filter((s) => !s.native).length} tone="amber" />
        <StatTile label="Surfaces" value={surfaces.length} tone="slate" />
      </div>
      <Panel bodyClass="p-0" subtitle={`${rows.length} of ${screens.length}`}>
        <Grid
          dense
          columns={[
            { key: 'id', header: 'ID', render: (s) => <span className="font-mono text-[11.5px]">{s.id}</span> },
            { key: 'surfaceLabel', header: 'Surface', render: (s) => <span><Badge tone="slate">{s.surface}</Badge><span className="block text-[11px] text-nop-muted">{s.surfaceLabel}</span></span> },
            { key: 'screen', header: 'Screen' },
            { key: 'area', header: 'Area', render: (s) => <Link to={`/explorer/areas/${s.area}`} className="text-nop-blue hover:underline">{s.area}</Link> },
            {
              key: 'features',
              header: 'Features',
              render: (s) => (
                <span className="flex flex-wrap gap-1">
                  {s.features.map((f) => <Link key={f} to={`/explorer/features/${f}`} className="font-mono text-[11px] text-nop-blue hover:underline">{f.replace('PRD-', '')}</Link>)}
                </span>
              ),
            },
            { key: 'nativeOrNew', header: 'Native or new' },
          ]}
          rows={rows}
          rowKey={(s) => s.id}
        />
      </Panel>
      <Citation>
        Module chapters section 11.1. The note there is explicit: screen layouts are not specified, so this prototype
        builds no layout of its own beyond the native nopCommerce admin and DefaultClean storefront patterns.
      </Citation>
    </AdminPage>
  );
}
