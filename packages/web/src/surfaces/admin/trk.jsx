// nopCommerce administration - notifications: the definitions behind every message, the e-mail
// templates they render, the channel switches, and the delivery log with its report.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Checkbox, Field, Grid, Input, KeyValue, Panel, SearchPanel,
  Select, Spinner, StatTile, Tabs, Textarea,
} from '../../ui/nop/kit.jsx';

const crumb = (group, ...items) => (
  <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: group }, ...items]} />
);

const STATUS_TONE = {
  Sent: 'blue', Delivered: 'green', Failed: 'red', Refused: 'red', Suppressed: 'slate', Held: 'amber', Pending: 'amber',
};
const when = (v) => (v ? new Date(v).toLocaleString() : '-');

/* ============================================= notification definitions ================ */

export function AdminNotificationDefinitions() {
  const [tab, setTab] = useState('definitions');
  const [definitions, setDefinitions] = useState(null);
  const [channels, setChannels] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [settings, setSettings] = useState(null);
  const [notice, setNotice] = useState(null);
  const [draft, setDraft] = useState({ channel: 'sms', languageId: 1, text: '' });
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    api.get('/notifications/definitions').then(setDefinitions).catch(() => setDefinitions([]));
    api.get('/notifications/channels').then(setChannels).catch(() => {});
    api.get('/platform/languages').then(setLanguages).catch(() => {});
    api.get('/platform/settings').then((rows) => setSettings(rows.filter((r) => r.name.startsWith('trk.channel.')))).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = async (key) => {
    setSelected(key);
    setDetail(await api.get(`/notifications/definitions/${encodeURIComponent(key)}`).catch(() => null));
  };

  const saveDefinition = async (key, body) => {
    try {
      const r = await api.post(`/notifications/definitions/${encodeURIComponent(key)}`, body);
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'That change was not saved.' } : { tone: 'success', text: 'Saved. The next message uses it.' });
      load();
      if (selected === key) open(key);
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const saveContent = async () => {
    try {
      const r = await api.post(`/notifications/definitions/${encodeURIComponent(selected)}/content`, draft);
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'That text was not saved.' } : { tone: 'success', text: 'Saved.' });
      setDraft({ ...draft, text: '' });
      open(selected);
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const toggleChannel = async (channel, on) => {
    try {
      await api.post('/platform/change-control/settings', { key: `trk.channel.${channel}.enabled`, value: on, storeId: 0 });
      setNotice({ tone: 'success', text: `The ${channel} channel is now ${on ? 'on' : 'off'} for this client.` });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const rows = (definitions ?? []).filter((d) => !q || d.key.toLowerCase().includes(q.toLowerCase()));
  const channelState = (channel) => {
    const row = (settings ?? []).find((s) => s.name === `trk.channel.${channel}.enabled`);
    return row ? row.value !== false : true;
  };

  return (
    <AdminPage
      title="Notification definitions"
      breadcrumb={crumb('Content management', { label: 'Notifications' })}
      intro="What is sent for each event, on which channels, and in what wording. A message never leaves the shop except through one of these."
      actions={<Button size="sm" onClick={load}>Refresh</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Definitions" value={(definitions ?? []).length} tone="blue" />
        <StatTile label="From the shop software" value={(definitions ?? []).filter((d) => d.native).length} tone="slate" />
        <StatTile label="From a module" value={(definitions ?? []).filter((d) => d.eventCode).length} tone="purple" />
        <StatTile label="Channels on" value={(channels?.channels ?? []).filter(channelState).length} tone="green" />
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'definitions', label: 'Definitions', count: (definitions ?? []).length },
          { id: 'channels', label: 'Channels' },
        ]}
      />

      {tab === 'definitions' && (
        <>
          <SearchPanel onClear={() => setQ('')}>
            <Field label="Event"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="OrderPlaced" /></Field>
          </SearchPanel>
          <Panel bodyClass="p-0" subtitle={definitions ? `${rows.length} of ${definitions.length}` : undefined}>
            {!definitions ? <Spinner /> : (
              <Grid
                dense
                rows={rows}
                rowKey={(d) => d.key}
                onRowClick={(d) => open(d.key)}
                columns={[
                  { key: 'key', header: 'Event', render: (d) => <span className="font-mono text-[12px]">{d.key}</span> },
                  { key: 'category', header: 'Category' },
                  { key: 'owningModule', header: 'Owned by' },
                  {
                    key: 'channels',
                    header: 'Channels',
                    render: (d) => (d.channels ?? []).map((c) => <Badge key={c} tone={channelState(c) ? 'blue' : 'slate'}>{c}</Badge>),
                  },
                  { key: 'fallback', header: 'Fallback', render: (d) => (d.fallback ? <Badge tone="amber">Next on failure</Badge> : 'All channels') },
                  { key: 'mandatory', header: 'Mandatory', render: (d) => (d.mandatory ? 'Yes' : 'No') },
                  { key: 'urgent', header: 'Urgent', render: (d) => (d.urgent ? 'Yes' : 'No') },
                  { key: 'open', header: '', render: (d) => <Button size="sm" onClick={() => open(d.key)}>Edit</Button> },
                ]}
              />
            )}
          </Panel>

          {selected && detail?.definition && (
            <Panel title={selected} subtitle="The wording of each channel, per language. The e-mail wording lives in the message template.">
              <div className="grid gap-3 md:grid-cols-4 items-end">
                <Field label="Channels" hint="in the order they are used">
                  <Input
                    defaultValue={(detail.definition.channels ?? []).join(', ')}
                    onBlur={(e) => saveDefinition(selected, { channels: e.target.value.split(',').map((c) => c.trim()).filter(Boolean) })}
                  />
                </Field>
                <Field label="Category"><Input defaultValue={detail.definition.category ?? ''} onBlur={(e) => saveDefinition(selected, { category: e.target.value })} /></Field>
                <Checkbox
                  label="Use the next channel only if one fails"
                  checked={detail.definition.fallback === true}
                  onChange={(e) => saveDefinition(selected, { fallback: e.target.checked })}
                />
                <div className="flex gap-4">
                  <Checkbox label="Mandatory" checked={detail.definition.mandatory === true} onChange={(e) => saveDefinition(selected, { mandatory: e.target.checked })} />
                  <Checkbox label="Urgent" checked={detail.definition.urgent === true} onChange={(e) => saveDefinition(selected, { urgent: e.target.checked })} />
                </div>
              </div>

              <div className="mt-4">
                <Grid
                  dense
                  rows={detail.content ?? []}
                  rowKey={(c) => c.id}
                  empty="No wording has been set for a channel yet."
                  columns={[
                    { key: 'channel', header: 'Channel' },
                    { key: 'languageId', header: 'Language', render: (c) => languages.find((l) => l.id === c.languageId)?.name ?? c.languageId },
                    { key: 'text', header: 'Wording' },
                    { key: 'version', header: 'Version', align: 'right' },
                  ]}
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4 items-end">
                <Field label="Channel">
                  <Select value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}>
                    {(channels?.channels ?? []).filter((c) => c !== 'email').map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Language">
                  <Select value={draft.languageId} onChange={(e) => setDraft({ ...draft, languageId: Number(e.target.value) })}>
                    {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Wording" hint="tokens such as %Order.OrderNumber% are filled when the message is sent">
                    <Input value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
                  </Field>
                </div>
              </div>
              <div className="mt-2"><Button variant="primary" onClick={saveContent} disabled={!draft.text.trim()}>Save wording</Button></div>
            </Panel>
          )}
        </>
      )}

      {tab === 'channels' && (
        <Panel title="Channels" subtitle="A channel that is off here is skipped for every message, and the skip is recorded.">
          {!channels ? <Spinner /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {channels.channels.map((c) => (
                <div key={c} className="border border-nop-border rounded-sm p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[13.5px] font-medium">{c}</div>
                    <div className="text-[11.5px] text-nop-muted">
                      {(definitions ?? []).filter((d) => (d.channels ?? []).includes(c)).length}
                      {' '}
                      events use it
                    </div>
                  </div>
                  <Checkbox label={channelState(c) ? 'On' : 'Off'} checked={channelState(c)} onChange={(e) => toggleChannel(c, e.target.checked)} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </AdminPage>
  );
}

/* ============================================= the notification log and report ========= */

export function AdminNotificationLog() {
  const [tab, setTab] = useState('log');
  const [rows, setRows] = useState(null);
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState({ channel: '', status: '', definitionKey: '' });
  const [orderId, setOrderId] = useState('');
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(filter)) if (v) query.set(k, v);
    api.get(`/notifications/messages?${query.toString()}`).then(setRows).catch(() => setRows([]));
    api.get('/notifications/report').then(setReport).catch(() => {});
  }, [filter.channel, filter.status, filter.definitionKey]);
  useEffect(() => { load(); }, [load]);

  const runTask = async () => {
    try {
      const r = await api.post('/notifications/queue/send-task', {});
      setNotice({ tone: 'success', text: `${r.sent} e-mails sent, ${r.failed} failed.` });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const openOrder = async () => {
    if (!orderId) return;
    setPanel(await api.get(`/notifications/orders/${orderId}/notifications`).catch(() => null));
  };

  const exportReport = () => {
    const blob = new Blob([report.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notification-delivery.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = report?.byChannel ?? {};

  return (
    <AdminPage
      title="Notification log"
      breadcrumb={crumb('System', { label: 'Notification log' })}
      intro="Every message the shop sent, held, suppressed or failed, with what the provider said about it."
      actions={(
        <>
          <Button size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" variant="primary" onClick={runTask}>Send queued e-mails</Button>
        </>
      )}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Messages" value={report?.total ?? 0} tone="blue" />
        <StatTile label="Delivered" value={Object.values(totals).reduce((s, c) => s + (c.Delivered ?? 0), 0)} tone="green" />
        <StatTile label="Failed or refused" value={Object.values(totals).reduce((s, c) => s + (c.Failed ?? 0) + (c.Refused ?? 0), 0)} tone="red" />
        <StatTile label="Suppressed" value={Object.values(totals).reduce((s, c) => s + (c.Suppressed ?? 0), 0)} tone="amber" hint="a channel that was off, a preference or a bouncing address" />
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'log', label: 'Messages', count: (rows ?? []).length },
          { id: 'report', label: 'Delivery report' },
          { id: 'order', label: 'By order' },
        ]}
      />

      {tab === 'log' && (
        <>
          <SearchPanel onSearch={load} onClear={() => setFilter({ channel: '', status: '', definitionKey: '' })}>
            <Field label="Channel">
              <Select value={filter.channel} onChange={(e) => setFilter({ ...filter, channel: e.target.value })}>
                <option value="">All</option>
                {['email', 'sms', 'whatsapp', 'push', 'inapp'].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                <option value="">All</option>
                {['Pending', 'Held', 'Sent', 'Delivered', 'Failed', 'Suppressed', 'Refused'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Event"><Input value={filter.definitionKey} onChange={(e) => setFilter({ ...filter, definitionKey: e.target.value })} placeholder="OrderPlaced.CustomerNotification" /></Field>
          </SearchPanel>
          <Panel bodyClass="p-0" subtitle={rows ? `${rows.length} messages` : undefined}>
            {!rows ? <Spinner /> : (
              <Grid
                dense
                rows={rows.slice(0, 300)}
                rowKey={(r) => r.id}
                empty="No message has been sent yet."
                columns={[
                  { key: 'createdOnUtc', header: 'When', render: (r) => when(r.sentOnUtc ?? r.createdOnUtc) },
                  { key: 'definitionKey', header: 'Event', render: (r) => <span className="font-mono text-[12px]">{r.definitionKey}</span> },
                  { key: 'channel', header: 'Channel' },
                  { key: 'recipient', header: 'To' },
                  { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
                  { key: 'reason', header: 'Note', render: (r) => r.reason ?? '-' },
                  { key: 'providerMessageId', header: 'Provider reference', render: (r) => (r.providerMessageId ? <span className="font-mono text-[11.5px]">{r.providerMessageId}</span> : '-') },
                ]}
              />
            )}
          </Panel>
        </>
      )}

      {tab === 'report' && (
        <Panel
          title="Delivery report"
          subtitle="Counts by channel and by event."
          actions={report && <Button size="sm" onClick={exportReport}>Export</Button>}
        >
          {!report ? <Spinner /> : (
            <>
              <Grid
                dense
                rows={Object.entries(report.byChannel).map(([channel, c]) => ({ channel, ...c }))}
                rowKey={(r) => r.channel}
                columns={[
                  { key: 'channel', header: 'Channel' },
                  { key: 'Sent', header: 'Sent', align: 'right' },
                  { key: 'Delivered', header: 'Delivered', align: 'right' },
                  { key: 'Failed', header: 'Failed', align: 'right' },
                  { key: 'Refused', header: 'Refused', align: 'right' },
                  { key: 'Held', header: 'Held', align: 'right' },
                  { key: 'Suppressed', header: 'Suppressed', align: 'right' },
                ]}
              />
              <div className="h-4" />
              <Grid
                dense
                rows={Object.entries(report.byEventType).map(([event, c]) => ({ event, ...c }))}
                rowKey={(r) => r.event}
                columns={[
                  { key: 'event', header: 'Event', render: (r) => <span className="font-mono text-[12px]">{r.event}</span> },
                  { key: 'Sent', header: 'Sent', align: 'right' },
                  { key: 'Delivered', header: 'Delivered', align: 'right' },
                  { key: 'Failed', header: 'Failed', align: 'right' },
                  { key: 'Suppressed', header: 'Suppressed', align: 'right' },
                ]}
              />
            </>
          )}
        </Panel>
      )}

      {tab === 'order' && (
        <Panel title="Messages of one order" subtitle="The same panel the order page carries.">
          <div className="flex flex-wrap items-end gap-2 mb-3">
            <Field label="Order"><Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="order number id" /></Field>
            <Button variant="primary" onClick={openOrder}>Show</Button>
          </div>
          {panel?.ok && (
            <>
              <KeyValue rows={[['Order', panel.orderId], ['Shipments', (panel.shipments ?? []).join(', ') || 'none'], ['Messages', panel.messages.length]]} />
              <div className="h-3" />
              <Grid
                dense
                rows={panel.messages}
                rowKey={(m) => m.id}
                empty="No message was sent for this order."
                columns={[
                  { key: 'at', header: 'When', render: (m) => when(m.at) },
                  { key: 'definitionKey', header: 'Event', render: (m) => <span className="font-mono text-[12px]">{m.definitionKey}</span> },
                  { key: 'channel', header: 'Channel' },
                  { key: 'status', header: 'Status', render: (m) => <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge> },
                  { key: 'recipient', header: 'To' },
                  { key: 'text', header: 'Content', render: (m) => <span className="text-[12px]">{m.text ?? '-'}</span> },
                ]}
              />
            </>
          )}
          {panel && panel.ok === false && <Alert tone="error">{panel.message ?? 'That order could not be read.'}</Alert>}
        </Panel>
      )}
    </AdminPage>
  );
}

/* ============================================= e-mail templates and bounces ============ */

export function AdminEmailTemplates() {
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [bounces, setBounces] = useState(null);
  const [queued, setQueued] = useState(null);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    api.get('/notifications/templates').then(setTemplates).catch(() => setTemplates([]));
    api.get('/notifications/templates/tokens').then((r) => setTokens(r.tokens ?? [])).catch(() => {});
    api.get('/notifications/bounces').then(setBounces).catch(() => setBounces([]));
    api.get('/notifications/queued-emails').then(setQueued).catch(() => setQueued([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const r = await api.post(`/notifications/templates/${encodeURIComponent(editing.name)}`, {
        storeId: editing.storeId ?? 0,
        subject: editing.subject,
        body: editing.body,
        active: editing.active,
        delayBeforeSend: editing.delayBeforeSend === '' ? null : Number(editing.delayBeforeSend),
        limitedToStores: editing.limitedToStores,
      });
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'That template was not saved.' } : { tone: 'success', text: 'Saved. The next message uses it.' });
      setEditing(null);
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const clearBounce = async (customerId) => {
    try {
      await api.post('/notifications/bounces/clear', { customerId });
      setNotice({ tone: 'success', text: 'The address was revalidated and e-mail resumes.' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  return (
    <AdminPage
      title="Message templates"
      breadcrumb={crumb('Content management', { label: 'Message templates' })}
      intro="The e-mails the shop sends: their subject, their wording and the details filled in when they go out."
      actions={<Button size="sm" onClick={load}>Refresh</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'templates', label: 'Templates', count: (templates ?? []).length },
          { id: 'queue', label: 'Outgoing e-mail', count: (queued ?? []).length },
          { id: 'bounces', label: 'Bouncing addresses', count: (bounces ?? []).length },
        ]}
      />

      {tab === 'templates' && (
        <>
          <Panel bodyClass="p-0">
            {!templates ? <Spinner /> : (
              <Grid
                dense
                rows={templates}
                rowKey={(t) => `${t.name}-${t.storeId}-${t.languageId}`}
                columns={[
                  { key: 'name', header: 'Template', render: (t) => <span className="font-mono text-[12px]">{t.name}</span> },
                  { key: 'subject', header: 'Subject' },
                  { key: 'storeId', header: 'Store', render: (t) => (t.limitedToStores ? `store ${t.storeId}` : 'all stores') },
                  { key: 'active', header: 'Active', render: (t) => <Badge tone={t.active ? 'green' : 'slate'}>{t.active ? 'Yes' : 'No'}</Badge> },
                  { key: 'delayBeforeSend', header: 'Delay', render: (t) => (t.delayBeforeSend ? `${t.delayBeforeSend} min` : '-') },
                  { key: 'version', header: 'Version', align: 'right' },
                  { key: 'edit', header: '', render: (t) => <Button size="sm" onClick={() => setEditing({ ...t, delayBeforeSend: t.delayBeforeSend ?? '' })}>Edit</Button> },
                ]}
              />
            )}
          </Panel>
          {editing && (
            <Panel title={editing.name} subtitle="What the customer receives.">
              <div className="grid gap-3">
                <Field label="Subject"><Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
                <Field label="Body"><Textarea rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Delay before sending" hint="minutes; empty for none">
                    <Input value={editing.delayBeforeSend} onChange={(e) => setEditing({ ...editing, delayBeforeSend: e.target.value })} />
                  </Field>
                  <Checkbox label="Active" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                  <Checkbox label="Only for this store" checked={editing.limitedToStores === true} onChange={(e) => setEditing({ ...editing, limitedToStores: e.target.checked })} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="primary" onClick={save}>Save</Button>
                <Button onClick={() => setEditing(null)}>Cancel</Button>
              </div>
              <div className="mt-4">
                <div className="text-[12.5px] font-medium text-gray-700 mb-1">Details you can use</div>
                <div className="flex flex-wrap gap-1.5">
                  {tokens.map((t) => <span key={t} className="font-mono text-[11.5px] border border-nop-border rounded-sm px-1.5 py-0.5 bg-nop-head">{t}</span>)}
                </div>
              </div>
            </Panel>
          )}
        </>
      )}

      {tab === 'queue' && (
        <Panel bodyClass="p-0" subtitle="E-mails waiting to go out, and those that have gone.">
          {!queued ? <Spinner /> : (
            <Grid
              dense
              rows={queued.slice(0, 200)}
              rowKey={(e) => e.id}
              empty="Nothing is queued."
              columns={[
                { key: 'createdOnUtc', header: 'Queued', render: (e) => when(e.createdOnUtc) },
                { key: 'to', header: 'To' },
                { key: 'subject', header: 'Subject' },
                { key: 'attempts', header: 'Attempts', align: 'right' },
                { key: 'sentOnUtc', header: 'Sent', render: (e) => (e.sentOnUtc ? when(e.sentOnUtc) : <Badge tone="amber">Waiting</Badge>) },
                { key: 'lastError', header: 'Last error', render: (e) => e.lastError ?? '-' },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'bounces' && (
        <Panel bodyClass="p-0" subtitle="E-mail to these addresses keeps failing, so the shop uses another channel for them.">
          {!bounces ? <Spinner /> : (
            <Grid
              rows={bounces}
              rowKey={(b) => b.id}
              empty="No address is bouncing."
              columns={[
                { key: 'email', header: 'Address' },
                { key: 'bouncedOnUtc', header: 'Since', render: (b) => when(b.bouncedOnUtc) },
                { key: 'message', header: 'Shown as' },
                { key: 'clear', header: '', render: (b) => <Button size="sm" onClick={() => clearBounce(b.id)}>Revalidate</Button> },
              ]}
            />
          )}
        </Panel>
      )}
    </AdminPage>
  );
}
