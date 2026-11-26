// nopCommerce administration - track and trace: what every parcel did, what the hub could not
// place, the scans that did not arrive, and the dictionary behind all of it.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminPage } from '../../ui/nop/shells.jsx';
import { useProduct } from '../../lib/store.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Field, Grid, Input, KeyValue, Panel, SearchPanel,
  Select, Spinner, StatTile, Tabs, Textarea,
} from '../../ui/nop/kit.jsx';

const crumb = (group, ...items) => (
  <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: group }, ...items]} />
);

const ALERT_TONE = {
  Watching: 'slate', Open: 'amber', Escalated: 'red', Resolved: 'green',
};
const when = (v) => (v ? new Date(v).toLocaleString() : '-');

/* ====================================================== track and trace ================ */

export function AdminTrackAndTrace() {
  const [tab, setTab] = useState('search');
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [rejected, setRejected] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [refusals, setRefusals] = useState(null);
  const [codes, setCodes] = useState([]);
  const [manual, setManual] = useState({ reference: '', code: 'ARRIVED_HUB', location: '' });
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    api.get('/tracking-hub/events/rejected').then(setRejected).catch(() => setRejected([]));
    api.get('/tracking-hub/alerts').then(setAlerts).catch(() => setAlerts([]));
    api.get('/tracking-hub/state-refusals').then(setRefusals).catch(() => setRefusals([]));
    api.get('/tracking-hub/common-codes').then(setCodes).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const search = async () => {
    const found = await api.get(`/tracking-hub/search?q=${encodeURIComponent(term)}`).catch((err) => ({ ok: false, message: err.message }));
    if (found.ok === false) { setNotice({ tone: 'error', text: found.message ?? 'That search is not available to you.' }); return; }
    setResults(found.results ?? []);
  };

  const reprocess = async (id) => {
    try {
      const r = await api.post(`/tracking-hub/events/${id}/reprocess`, {});
      setNotice(r.status === 'Applied'
        ? { tone: 'success', text: 'The event was applied.' }
        : { tone: 'error', text: r.reason ?? r.message ?? 'It could not be applied yet.' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const resolve = async (id) => {
    const note = window.prompt('What happened to this parcel?');
    if (!note) return;
    try {
      const r = await api.post(`/tracking-hub/alerts/${id}/resolve`, { note });
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'It could not be resolved.' } : { tone: 'success', text: 'Resolved.' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const runTask = async () => {
    try {
      const r = await api.post('/tracking-hub/alerts/task', {});
      setNotice({ tone: 'success', text: `${r.opened} alerts opened, ${r.escalated} escalated.` });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const enterEvent = async () => {
    try {
      const r = await api.post('/tracking-hub/events/manual', manual);
      const outcome = r.results?.[0];
      setNotice(outcome?.status === 'Applied'
        ? { tone: 'success', text: 'The event was added to the parcel.' }
        : { tone: 'error', text: outcome?.reason ?? r.message ?? 'The event was not added.' });
      setManual({ ...manual, reference: '', location: '' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const openAlerts = (alerts ?? []).filter((a) => a.status === 'Open');

  return (
    <AdminPage
      title="Track and trace"
      breadcrumb={crumb('Operations', { label: 'Track and trace' })}
      intro="Find a parcel and see everything that happened to it, deal with scans the system could not place, and chase the ones that have gone quiet."
      actions={(
        <>
          <Button size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" variant="primary" onClick={runTask}>Check for missed scans</Button>
        </>
      )}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Open alerts" value={openAlerts.length} tone="amber" />
        <StatTile label="Escalated" value={(alerts ?? []).filter((a) => a.status === 'Escalated').length} tone="red" />
        <StatTile label="Scans not placed" value={(rejected ?? []).length} tone="slate" />
        <StatTile label="Waiting to retry" value={(refusals ?? []).length} tone="blue" hint="a status change the order refused" />
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'search', label: 'Search' },
          { id: 'rejected', label: 'Scans not placed', count: (rejected ?? []).length },
          { id: 'alerts', label: 'Missed scans', count: (alerts ?? []).length },
          { id: 'manual', label: 'Add an event' },
        ]}
      />

      {tab === 'search' && (
        <>
          <SearchPanel onSearch={search} onClear={() => { setTerm(''); setResults(null); }}>
            <Field label="Order number, tracking reference, S10 or phone">
              <Input value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="MP-2026-000123" />
            </Field>
          </SearchPanel>
          {results && results.length === 0 && <Alert tone="info">Nothing matched that.</Alert>}
          {(results ?? []).map((row) => (
            <Panel
              key={row.shipmentId}
              title={row.trackingNumber}
              subtitle={`Order ${row.orderNumber ?? '-'}${row.stage ? ` - ${row.stage}` : ''}`}
            >
              <KeyValue rows={[
                ['Tracking reference', row.trackingNumber],
                ['S10', row.s10Reference ?? '-'],
                ['Customer phone', row.customerPhone ?? '-'],
              ]}
              />
              <div className="h-3" />
              <Grid
                dense
                rows={row.timeline}
                rowKey={(e) => e.id}
                empty="No events yet."
                columns={[
                  { key: 'at', header: 'When', render: (e) => when(e.at) },
                  { key: 'displayName', header: 'Event' },
                  { key: 'location', header: 'Where', render: (e) => e.location ?? '-' },
                  { key: 'source', header: 'From' },
                ]}
              />
              {row.scanAlerts.length > 0 && (
                <>
                  <div className="h-3" />
                  <div className="text-[12.5px] font-medium text-gray-700 mb-1">Missed scans</div>
                  <Grid
                    dense
                    rows={row.scanAlerts}
                    rowKey={(a) => a.id}
                    columns={[
                      { key: 'expectedCode', header: 'Expected' },
                      { key: 'lastEventCode', header: 'After' },
                      { key: 'status', header: 'Status', render: (a) => <Badge tone={ALERT_TONE[a.status]}>{a.status}</Badge> },
                    ]}
                  />
                </>
              )}
              <div className="h-3" />
              <div className="text-[12.5px] font-medium text-gray-700 mb-1">Messages sent</div>
              <Grid
                dense
                rows={row.notifications}
                rowKey={(m, i) => `${m.definitionKey}-${i}`}
                empty="No message was sent for this parcel."
                columns={[
                  { key: 'at', header: 'When', render: (m) => when(m.at) },
                  { key: 'definitionKey', header: 'Message', render: (m) => <span className="font-mono text-[12px]">{m.definitionKey}</span> },
                  { key: 'channel', header: 'Channel' },
                  { key: 'status', header: 'Status' },
                ]}
              />
            </Panel>
          ))}
        </>
      )}

      {tab === 'rejected' && (
        <Panel bodyClass="p-0" subtitle="A scan the hub could not place: an unknown code, or a reference that matches no parcel. Nothing is sent to the customer for these.">
          {!rejected ? <Spinner /> : (
            <Grid
              dense
              rows={rejected}
              rowKey={(e) => e.id}
              empty="Every scan was placed."
              columns={[
                { key: 'receivedOnUtc', header: 'Received', render: (e) => when(e.receivedOnUtc) },
                { key: 'source', header: 'From' },
                { key: 'sourceCode', header: 'Their code', render: (e) => <span className="font-mono text-[12px]">{e.sourceCode}</span> },
                { key: 'reference', header: 'Reference', render: (e) => <span className="font-mono text-[12px]">{e.reference}</span> },
                { key: 'rejectionReason', header: 'Why' },
                { key: 'retry', header: '', render: (e) => <Button size="sm" onClick={() => reprocess(e.id)}>Try again</Button> },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'alerts' && (
        <>
          <Panel bodyClass="p-0" subtitle="A parcel whose next scan did not arrive in time. One that stays quiet long enough becomes a delay incident.">
            {!alerts ? <Spinner /> : (
              <Grid
                dense
                rows={alerts}
                rowKey={(a) => a.id}
                empty="Nothing is overdue."
                columns={[
                  { key: 'shipmentReference', header: 'Parcel', render: (a) => a.shipmentReference ?? a.shipmentId },
                  { key: 'lastEventCode', header: 'Last scan' },
                  { key: 'expectedCode', header: 'Expected next' },
                  { key: 'dueAtUtc', header: 'Due by', render: (a) => when(a.dueAtUtc) },
                  { key: 'status', header: 'Status', render: (a) => <Badge tone={ALERT_TONE[a.status]}>{a.status}</Badge> },
                  { key: 'note', header: 'Note', render: (a) => a.note ?? '-' },
                  {
                    key: 'resolve',
                    header: '',
                    render: (a) => (['Open', 'Escalated'].includes(a.status)
                      ? <Button size="sm" onClick={() => resolve(a.id)}>Resolve</Button>
                      : null),
                  },
                ]}
              />
            )}
          </Panel>
          {(refusals ?? []).length > 0 && (
            <Panel title="Waiting to retry" subtitle="The parcel moved, but the order would not take the change yet.">
              <Grid
                dense
                rows={refusals}
                rowKey={(r) => r.id}
                columns={[
                  { key: 'shipmentId', header: 'Parcel' },
                  { key: 'call', header: 'Change' },
                  { key: 'reason', header: 'Why it waited' },
                ]}
              />
            </Panel>
          )}
        </>
      )}

      {tab === 'manual' && (
        <Panel title="Add an event by hand" subtitle="For a scan that never arrived, or a correction.">
          <div className="grid gap-3 md:grid-cols-4 items-end">
            <Field label="Parcel reference" required>
              <Input value={manual.reference} onChange={(e) => setManual({ ...manual, reference: e.target.value })} placeholder="tracking number or S10" />
            </Field>
            <Field label="Event">
              <Select value={manual.code} onChange={(e) => setManual({ ...manual, code: e.target.value })}>
                {codes.map((c) => <option key={c.code} value={c.code}>{c.displayName}</option>)}
              </Select>
            </Field>
            <Field label="Where"><Input value={manual.location} onChange={(e) => setManual({ ...manual, location: e.target.value })} placeholder="Lilongwe hub" /></Field>
            <Button variant="primary" onClick={enterEvent} disabled={!manual.reference.trim()}>Add</Button>
          </div>
        </Panel>
      )}
    </AdminPage>
  );
}

/* ====================================================== the dictionary ================= */

export function AdminTrackingConfiguration() {
  const [tab, setTab] = useState('codes');
  const [codes, setCodes] = useState(null);
  const [sources, setSources] = useState(null);
  const [mappings, setMappings] = useState(null);
  const [rules, setRules] = useState(null);
  const [devices, setDevices] = useState(null);
  const [notice, setNotice] = useState(null);
  const [mapping, setMapping] = useState({ sourceCode: '', code: '', eventCode: '' });
  const [rule, setRule] = useState({
    afterCode: '', expectedCode: '', routeOrServiceLevel: '', limitMinutes: '', longStuckLimitMinutes: '',
  });

  const load = useCallback(() => {
    api.get('/tracking-hub/event-codes').then(setCodes).catch(() => setCodes([]));
    api.get('/tracking-hub/sources').then(setSources).catch(() => setSources([]));
    api.get('/tracking-hub/mappings').then(setMappings).catch(() => setMappings([]));
    api.get('/tracking-hub/expectation-rules').then(setRules).catch(() => setRules([]));
    api.get('/tracking-hub/devices').then(setDevices).catch(() => setDevices([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveMapping = async () => {
    try {
      const r = await api.post('/tracking-hub/mappings', mapping);
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'That mapping was not saved.' } : { tone: 'success', text: 'Saved. Scans received from now on use it.' });
      setMapping({ ...mapping, code: '' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const saveRule = async () => {
    try {
      const r = await api.post('/tracking-hub/expectation-rules', {
        ...rule,
        routeOrServiceLevel: rule.routeOrServiceLevel || null,
        limitMinutes: Number(rule.limitMinutes),
        longStuckLimitMinutes: rule.longStuckLimitMinutes === '' ? null : Number(rule.longStuckLimitMinutes),
      });
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'That rule was not saved.' } : { tone: 'success', text: 'Saved.' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  return (
    <AdminPage
      title="Tracking sources and events"
      breadcrumb={crumb('Configuration', { label: 'Tracking' })}
      intro="The events a parcel can have, what each partner calls them, and how long a parcel may go without its next scan."
      actions={<Button size="sm" onClick={load}>Refresh</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'codes', label: 'Events', count: (codes ?? []).length },
          { id: 'sources', label: 'Sources', count: (sources ?? []).length },
          { id: 'mappings', label: 'What partners call them', count: (mappings ?? []).length },
          { id: 'rules', label: 'Expected scans', count: (rules ?? []).length },
          { id: 'devices', label: 'Scanning devices', count: (devices ?? []).length },
        ]}
      />

      {tab === 'codes' && (
        <Panel bodyClass="p-0" subtitle="The events every parcel is described with, whoever reported them.">
          {!codes ? <Spinner /> : (
            <Grid
              dense
              rows={codes}
              rowKey={(c) => c.code}
              columns={[
                { key: 'displayName', header: 'Event' },
                { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-[12px]">{c.code}</span> },
                { key: 'shipped', header: 'Counts as on its way', render: (c) => (c.shipped ? <Badge tone="blue">Yes</Badge> : 'No') },
                { key: 'isCustomerVisible', header: 'Shown to the customer', render: (c) => (c.isCustomerVisible ? 'Yes' : 'No') },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'sources' && (
        <Panel bodyClass="p-0" subtitle="Who may send scans, and when each of them last did.">
          {!sources ? <Spinner /> : (
            <Grid
              rows={sources}
              rowKey={(s) => s.code}
              columns={[
                { key: 'name', header: 'Source' },
                { key: 'type', header: 'Kind' },
                { key: 'credentialsHeld', header: 'Credentials', render: (s) => <Badge tone={s.credentialsHeld ? 'green' : 'red'}>{s.credentialsHeld ? 'Held' : 'None'}</Badge> },
                { key: 'lastEventOnUtc', header: 'Last scan', render: (s) => when(s.lastEventOnUtc) },
                { key: 'active', header: 'Active', render: (s) => <Badge tone={s.active === false ? 'slate' : 'green'}>{s.active === false ? 'No' : 'Yes'}</Badge> },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'mappings' && (
        <>
          <Panel title="Add a mapping" subtitle="A partner's own word for one of our events.">
            <div className="grid gap-3 md:grid-cols-4 items-end">
              <Field label="Source">
                <Select value={mapping.sourceCode} onChange={(e) => setMapping({ ...mapping, sourceCode: e.target.value })}>
                  <option value="">Choose a source</option>
                  {(sources ?? []).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Their code"><Input value={mapping.code} onChange={(e) => setMapping({ ...mapping, code: e.target.value })} placeholder="EDB" /></Field>
              <Field label="Our event">
                <Select value={mapping.eventCode} onChange={(e) => setMapping({ ...mapping, eventCode: e.target.value })}>
                  <option value="">Choose an event</option>
                  {(codes ?? []).map((c) => <option key={c.code} value={c.code}>{c.displayName}</option>)}
                </Select>
              </Field>
              <Button variant="primary" onClick={saveMapping} disabled={!mapping.sourceCode || !mapping.code || !mapping.eventCode}>Save</Button>
            </div>
          </Panel>
          <Panel bodyClass="p-0">
            {!mappings ? <Spinner /> : (
              <Grid
                dense
                rows={mappings}
                rowKey={(m) => m.id}
                columns={[
                  { key: 'source', header: 'Source' },
                  { key: 'sourceCode', header: 'Their code', render: (m) => <span className="font-mono text-[12px]">{m.sourceCode}</span> },
                  { key: 'eventCode', header: 'Our event', render: (m) => <span className="font-mono text-[12px]">{m.eventCode}</span> },
                ]}
              />
            )}
          </Panel>
        </>
      )}

      {tab === 'devices' && (
        <Panel
          bodyClass="p-0"
          subtitle="The handsets that may send scans, and the staff member each one belongs to. A revoked handset is refused."
        >
          {!devices ? <Spinner /> : (
            <Grid
              rows={devices}
              rowKey={(d) => d.deviceId}
              empty="No scanning device has been registered."
              columns={[
                { key: 'deviceId', header: 'Device', render: (d) => <span className="font-mono text-[12px]">{d.deviceId}</span> },
                { key: 'staffName', header: 'Used by' },
                { key: 'status', header: 'Status', render: (d) => <Badge tone={d.status === 'Active' ? 'green' : 'red'}>{d.status}</Badge> },
                { key: 'registeredOnUtc', header: 'Registered', render: (d) => when(d.registeredOnUtc) },
                { key: 'registeredBy', header: 'Registered by', render: (d) => d.registeredBy ?? '-' },
                {
                  key: 'revoke',
                  header: '',
                  render: (d) => (d.status === 'Active'
                    ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          await api.post(`/tracking-hub/devices/${d.deviceId}/revoke`, {});
                          load();
                        }}
                      >
                        Revoke
                      </Button>
                    )
                    : null),
                },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'rules' && (
        <>
          <Panel title="Add an expected scan" subtitle="How long a parcel may wait for its next scan before somebody is told.">
            <div className="grid gap-3 md:grid-cols-5 items-end">
              <Field label="After">
                <Select value={rule.afterCode} onChange={(e) => setRule({ ...rule, afterCode: e.target.value })}>
                  <option value="">Choose an event</option>
                  {(codes ?? []).map((c) => <option key={c.code} value={c.code}>{c.displayName}</option>)}
                </Select>
              </Field>
              <Field label="Expect">
                <Select value={rule.expectedCode} onChange={(e) => setRule({ ...rule, expectedCode: e.target.value })}>
                  <option value="">Choose an event</option>
                  {(codes ?? []).map((c) => <option key={c.code} value={c.code}>{c.displayName}</option>)}
                </Select>
              </Field>
              <Field label="Within (minutes)" required><Input value={rule.limitMinutes} onChange={(e) => setRule({ ...rule, limitMinutes: e.target.value })} /></Field>
              <Field label="Treat as stuck after (minutes)"><Input value={rule.longStuckLimitMinutes} onChange={(e) => setRule({ ...rule, longStuckLimitMinutes: e.target.value })} /></Field>
              <Field label="Route or service level"><Input value={rule.routeOrServiceLevel} onChange={(e) => setRule({ ...rule, routeOrServiceLevel: e.target.value })} placeholder="all" /></Field>
            </div>
            <div className="mt-3"><Button variant="primary" onClick={saveRule} disabled={!rule.afterCode || !rule.expectedCode || !rule.limitMinutes}>Save</Button></div>
          </Panel>
          <Panel bodyClass="p-0">
            {!rules ? <Spinner /> : (
              <Grid
                dense
                rows={rules}
                rowKey={(r) => r.id}
                empty="No expected scans are set, so nothing is chased."
                columns={[
                  { key: 'afterCode', header: 'After' },
                  { key: 'expectedCode', header: 'Expect' },
                  { key: 'limitMinutes', header: 'Within', render: (r) => `${r.limitMinutes} min` },
                  { key: 'longStuckLimitMinutes', header: 'Stuck after', render: (r) => (r.longStuckLimitMinutes ? `${r.longStuckLimitMinutes} min` : '-') },
                  { key: 'routeOrServiceLevel', header: 'Applies to', render: (r) => r.routeOrServiceLevel ?? 'every parcel' },
                ]}
              />
            )}
          </Panel>
        </>
      )}
    </AdminPage>
  );
}

/* ====================================================== the seller's shipments ========= */

export function AdminSellerShipments() {
  const { customer } = useProduct();
  const [shipments, setShipments] = useState(null);
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState(null);
  const vendorId = customer?.vendorId ?? null;

  const load = useCallback(() => {
    if (!vendorId) return;
    api.get(`/tracking-hub/seller/${vendorId}/shipments`)
      .then((r) => setShipments(r.shipments ?? []))
      .catch((err) => setNotice({ tone: 'error', text: err.message }));
  }, [vendorId]);
  useEffect(() => { load(); }, [load]);

  const openShipment = async (shipmentId) => {
    const view = await api.get(`/tracking-hub/seller/${vendorId}/shipments/${shipmentId}`).catch((err) => ({ ok: false, message: err.message }));
    if (view.ok === false) { setNotice({ tone: 'error', text: view.message ?? 'That shipment is not yours.' }); return; }
    setOpen(view);
  };

  if (!vendorId) {
    return (
      <AdminPage title="My shipments" breadcrumb={crumb('Sales', { label: 'Shipments' })}>
        <Alert tone="info">This page belongs to a seller account. Sign in as a seller to see the parcels of your own products.</Alert>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="My shipments"
      breadcrumb={crumb('Sales', { label: 'Shipments' })}
      intro="The parcels of your own products, and what has happened to each of them."
      actions={<Button size="sm" onClick={load}>Refresh</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Panel bodyClass="p-0" subtitle={shipments ? `${shipments.length} parcels` : undefined}>
        {!shipments ? <Spinner /> : (
          <Grid
            rows={shipments}
            rowKey={(s) => s.shipmentId}
            empty="None of your products has been shipped yet."
            onRowClick={(s) => openShipment(s.shipmentId)}
            columns={[
              { key: 'trackingNumber', header: 'Parcel', render: (s) => <span className="font-mono text-[12px]">{s.trackingNumber}</span> },
              { key: 'orderNumber', header: 'Order' },
              { key: 'shippedOnUtc', header: 'Shipped', render: (s) => when(s.shippedOnUtc) },
              { key: 'readyForPickupOnUtc', header: 'Ready for collection', render: (s) => when(s.readyForPickupOnUtc) },
              { key: 'deliveredOnUtc', header: 'Delivered', render: (s) => when(s.deliveredOnUtc) },
              { key: 'open', header: '', render: (s) => <Button size="sm" onClick={() => openShipment(s.shipmentId)}>Open</Button> },
            ]}
          />
        )}
      </Panel>
      {open?.ok && (
        <Panel title={open.trackingNumber} subtitle="Every scan on this parcel, including hand-over and delivery.">
          {open.displayShipmentEventsToStoreOwner === false
            ? <Alert tone="info">The shop does not show scan events to sellers.</Alert>
            : (
              <Grid
                dense
                rows={open.events}
                rowKey={(e) => e.id}
                empty="No scans yet."
                columns={[
                  { key: 'at', header: 'When', render: (e) => when(e.at) },
                  { key: 'displayName', header: 'Event' },
                  { key: 'location', header: 'Where', render: (e) => e.location ?? '-' },
                ]}
              />
            )}
        </Panel>
      )}
    </AdminPage>
  );
}

/* ====================================================== notices and banners ============ */

export function AdminOutreach() {
  const [tab, setTab] = useState('notices');
  const [notices, setNotices] = useState(null);
  const [banners, setBanners] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState(null);
  const [draft, setDraft] = useState({
    name: '', text: '', lastEventCode: '', orderStatus: '', sendAtUtc: '',
  });
  const [banner, setBanner] = useState({ text: '', stores: '', toUtc: '' });
  const [codes, setCodes] = useState([]);

  const load = useCallback(() => {
    api.get('/tracking-hub/notices').then(setNotices).catch(() => setNotices([]));
    api.get('/tracking-hub/banners').then(setBanners).catch(() => setBanners([]));
    api.get('/tracking-hub/common-codes').then(setCodes).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const criteria = {};
    if (draft.lastEventCode) criteria.lastEventCode = draft.lastEventCode;
    if (draft.orderStatus) criteria.orderStatus = draft.orderStatus;
    const created = await api.post('/tracking-hub/notices', { name: draft.name, text: draft.text, criteria })
      .catch((err) => ({ ok: false, message: err.message }));
    if (created.ok === false) { setNotice({ tone: 'error', text: created.message ?? 'That notice was not created.' }); return; }
    setNotice({ tone: 'success', text: 'Saved as a draft. Preview it before you send it.' });
    setDraft({
      name: '', text: '', lastEventCode: '', orderStatus: '', sendAtUtc: '',
    });
    load();
  };

  const showPreview = async (id) => {
    setPreview(await api.get(`/tracking-hub/notices/${id}/preview`).catch(() => null));
  };

  const send = async (id, sendAtUtc = null) => {
    const sent = await api.post(`/tracking-hub/notices/${id}/send`, { sendAtUtc })
      .catch((err) => ({ ok: false, message: err.message }));
    setNotice(sent.ok === false
      ? { tone: 'error', text: sent.message ?? 'It was not sent.' }
      : { tone: 'success', text: sent.status === 'Scheduled' ? 'Scheduled.' : `Sent to ${sent.counts?.recipients ?? 0} people.` });
    load();
  };

  const cancel = async (id) => {
    await api.post(`/tracking-hub/notices/${id}/cancel`, {}).catch(() => {});
    setNotice({ tone: 'success', text: 'Cancelled. Nothing was sent.' });
    load();
  };

  const createBanner = async () => {
    const created = await api.post('/tracking-hub/banners', {
      text: banner.text,
      stores: banner.stores ? banner.stores.split(',').map((s) => Number(s.trim())).filter(Boolean) : [],
      toUtc: banner.toUtc || null,
    }).catch((err) => ({ ok: false, message: err.message }));
    setNotice(created.ok === false
      ? { tone: 'error', text: created.message ?? 'That banner was not created.' }
      : { tone: 'success', text: 'The banner is on the storefront.' });
    setBanner({ text: '', stores: '', toUtc: '' });
    load();
  };

  const runMonitor = async () => {
    const r = await api.post('/tracking-hub/source-monitor', {}).catch(() => null);
    setNotice({ tone: 'success', text: `${r?.raised ?? 0} banners raised, ${r?.removed ?? 0} removed.` });
    load();
  };

  return (
    <AdminPage
      title="Notices and banners"
      breadcrumb={crumb('Operations', { label: 'Notices' })}
      intro="Tell a group of customers about a delay, and put a message at the top of the shop while it lasts."
      actions={(
        <>
          <Button size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" variant="primary" onClick={runMonitor}>Check the sources</Button>
        </>
      )}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'notices', label: 'Notices', count: (notices ?? []).length },
          { id: 'banners', label: 'Banners', count: (banners ?? []).filter((b) => b.status === 'Active').length },
        ]}
      />

      {tab === 'notices' && (
        <>
          <Panel title="Write a notice" subtitle="Choose who it reaches, then preview it before anything goes out.">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Name" required><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Customs delay" /></Field>
              <Field label="Parcels whose last scan was">
                <Select value={draft.lastEventCode} onChange={(e) => setDraft({ ...draft, lastEventCode: e.target.value })}>
                  <option value="">Any</option>
                  {codes.map((c) => <option key={c.code} value={c.code}>{c.displayName}</option>)}
                </Select>
              </Field>
              <Field label="Orders at stage">
                <Select value={draft.orderStatus} onChange={(e) => setDraft({ ...draft, orderStatus: e.target.value })}>
                  <option value="">Any</option>
                  {['Packed', 'Dispatched', 'ReadyForPickup', 'Delivered'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="What to tell them" required>
              <Textarea rows={3} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
            </Field>
            <div className="mt-3"><Button variant="primary" onClick={create} disabled={!draft.name || !draft.text}>Save as a draft</Button></div>
          </Panel>

          <Panel bodyClass="p-0">
            {!notices ? <Spinner /> : (
              <Grid
                rows={[...notices].reverse()}
                rowKey={(o) => o.id}
                empty="No notice has been written yet."
                columns={[
                  { key: 'name', header: 'Notice' },
                  { key: 'text', header: 'Message', render: (o) => <span className="text-[12.5px]">{o.text}</span> },
                  { key: 'status', header: 'Status', render: (o) => <Badge tone={{ Draft: 'slate', Scheduled: 'amber', Completed: 'green', Cancelled: 'red', Sending: 'blue' }[o.status]}>{o.status}</Badge> },
                  { key: 'sendAtUtc', header: 'Scheduled for', render: (o) => when(o.sendAtUtc) },
                  { key: 'counts', header: 'Reached', render: (o) => (o.counts ? `${o.counts.sent} of ${o.counts.recipients}` : '-') },
                  {
                    key: 'actions',
                    header: '',
                    render: (o) => (
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => showPreview(o.id)}>Preview</Button>
                        {['Draft', 'Scheduled'].includes(o.status) && <Button size="sm" variant="success" onClick={() => send(o.id)}>Send now</Button>}
                        {['Draft', 'Scheduled'].includes(o.status) && <Button size="sm" variant="danger" onClick={() => cancel(o.id)}>Cancel</Button>}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </Panel>

          {preview?.ok && (
            <Panel title="Who this reaches" subtitle="Nothing has been sent.">
              <KeyValue rows={[['Customers', preview.matchingCustomers], ['Parcels', preview.matchingShipments], ['Status', preview.status]]} />
              <div className="h-3" />
              <Grid
                dense
                rows={preview.sample}
                rowKey={(s) => s.trackingNumber}
                empty="Nothing matches those criteria."
                columns={[
                  { key: 'trackingNumber', header: 'Parcel', render: (s) => <span className="font-mono text-[12px]">{s.trackingNumber}</span> },
                  { key: 'orderNumber', header: 'Order' },
                  { key: 'lastEventCode', header: 'Last scan' },
                  { key: 'contact', header: 'Reached at' },
                ]}
              />
            </Panel>
          )}
        </>
      )}

      {tab === 'banners' && (
        <>
          <Panel title="Put a message on the shop" subtitle="It appears at the top of every page while it is active.">
            <div className="grid gap-3 md:grid-cols-3 items-end">
              <div className="md:col-span-2">
                <Field label="Message" required><Input value={banner.text} onChange={(e) => setBanner({ ...banner, text: e.target.value })} placeholder="Deliveries in Blantyre are running late today." /></Field>
              </div>
              <Field label="Stores" hint="empty for every store"><Input value={banner.stores} onChange={(e) => setBanner({ ...banner, stores: e.target.value })} placeholder="1, 2" /></Field>
              <Field label="Until"><Input type="datetime-local" value={banner.toUtc} onChange={(e) => setBanner({ ...banner, toUtc: e.target.value })} /></Field>
              <Button variant="primary" onClick={createBanner} disabled={!banner.text.trim()}>Show it</Button>
            </div>
          </Panel>
          <Panel bodyClass="p-0">
            {!banners ? <Spinner /> : (
              <Grid
                rows={[...banners].reverse()}
                rowKey={(b) => b.id}
                empty="No banner has been used."
                columns={[
                  { key: 'text', header: 'Message' },
                  { key: 'automatic', header: 'Raised by', render: (b) => (b.automatic ? 'A quiet source' : 'Staff') },
                  { key: 'status', header: 'Status', render: (b) => <Badge tone={{ Active: 'green', Scheduled: 'amber', Ended: 'slate' }[b.status]}>{b.status}</Badge> },
                  { key: 'fromUtc', header: 'From', render: (b) => when(b.fromUtc) },
                  { key: 'toUtc', header: 'Until', render: (b) => when(b.toUtc) },
                  { key: 'stores', header: 'Stores', render: (b) => ((b.stores ?? []).join(', ') || 'all') },
                  {
                    key: 'end',
                    header: '',
                    render: (b) => (b.status !== 'Ended'
                      ? (
                        <Button
                          size="sm"
                          onClick={async () => {
                            await api.post(`/tracking-hub/banners/${b.id}/end`, {});
                            load();
                          }}
                        >
                          Take it down
                        </Button>
                      )
                      : null),
                  },
                ]}
              />
            )}
          </Panel>
        </>
      )}
    </AdminPage>
  );
}
