// nopCommerce administration - track and trace: what every parcel did, what the hub could not
// place, the scans that did not arrive, and the dictionary behind all of it.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Field, Grid, Input, KeyValue, Panel, SearchPanel,
  Select, Spinner, StatTile, Tabs,
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
