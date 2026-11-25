// Administration — operations screens (PRD-ADM.md §11.1)
//
//   Approval queue and item page; chains, reason codes, moderation queues  ADM-006 [New]
//   Operations console (queue tabs, dashboard, saved views, order view)    ADM-007 [New, mobile-responsive]
//   Exception queue and patterns                                           ADM-009 [New]
//   Alert rules and alerts                                                 ADM-010 [New]

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Field, Grid, Input, KeyValue, Panel, Select,
  Spinner, StatTile, Tabs, Textarea,
} from '../../ui/nop/kit.jsx';
import { HeldByDecision, moduleName } from './adm-config.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, ...items]} />;

function useAdminData(path, deps = []) {
  const { customer } = useProduct();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    api.get(path)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => setState({ loading: false, data: null, error: err.data ?? { message: err.message } }));
  }, [path, customer?.email, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

const Body = ({ state, children }) => {
  if (state.loading) return <Spinner />;
  if (state.error) {
    return (
      <Alert tone="error" title="Access denied">
        {state.error.message}
      </Alert>
    );
  }
  return children(state.data);
};

/* ============================================================= PRD-ADM-006 approvals ==== */

export function Approvals() {
  const queue = useAdminData('/admin-console/approvals/queue');
  const chains = useAdminData('/admin-console/approvals/chains');
  const queues = useAdminData('/admin-console/approvals/queues');
  const reasons = useAdminData('/admin-console/approvals/reason-codes?context=approval');
  const [tab, setTab] = useState('queue');
  const [open, setOpen] = useState(null);
  const [decision, setDecision] = useState({ reasonCode: '', comment: '', conditions: '' });
  const [result, setResult] = useState(null);

  const openItem = async (item) => {
    setResult(null);
    setOpen(await api.get(`/admin-console/approvals/items/${item.id}`));
  };
  const decide = async (kind) => {
    const body = {
      decision: kind,
      reasonCode: decision.reasonCode || null,
      comment: decision.comment || null,
      conditions: decision.conditions ? decision.conditions.split('\n').filter(Boolean) : [],
    };
    const r = await api.post(`/admin-console/approvals/items/${open.item.id}/decide`, body);
    setResult(r);
    queue.reload();
    if (r.ok) setOpen(await api.get(`/admin-console/approvals/items/${open.item.id}`).catch(() => null));
  };

  return (
    <AdminPage
      title="Approvals"
      breadcrumb={crumb({ label: 'Operations' }, { label: 'Approvals' })}
      intro="The items waiting for you, limited to your role, your authority and anything delegated to you. Approvals can have several steps, carry corrections, or be rejected with a reason."
      actions={<Button onClick={queue.reload}>Refresh</Button>}
    >
      <HeldByDecision title="Approval rules not finalised">
        Approval chains and authority limits are still being agreed for this installation. The
        queue works as configured; a decision is applied by the area that owns the item.
      </HeldByDecision>

      <Tabs
        tabs={[
          { id: 'queue', label: 'My queue', count: queue.data?.length ?? 0 },
          { id: 'chains', label: 'Chains', count: chains.data?.length ?? 0 },
          { id: 'queues', label: 'Moderation queues', count: queues.data?.length ?? 0 },
          { id: 'reasons', label: 'Reason codes', count: reasons.data?.length ?? 0 },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="border border-t-0 border-nop-border bg-white">
        {tab === 'queue' && (
          <Body state={queue}>
            {(rows) => (
              <>
                <Grid
                  dense
                  columns={[
                    { key: 'id', header: 'Item', align: 'right' },
                    { key: 'objectType', header: 'Object', render: (i) => <span className="font-mono text-[12px]">{`${i.objectType} ${i.objectId}`}</span> },
                    { key: 'summary', header: 'Summary' },
                    { key: 'amount', header: 'Amount', align: 'right', render: (i) => (i.amount == null ? '—' : i.amount.toLocaleString()) },
                    { key: 'step', header: 'Step', render: (i) => `${i.currentStep} of ${(i.chain?.steps ?? []).filter((s) => !s.isAppealStep).length} (${i.step?.approverRole ?? '—'})` },
                    { key: 'round', header: 'Round', align: 'right' },
                    { key: 'status', header: 'Status', render: (i) => <Badge tone={i.status === 'ApprovedWithConditions' ? 'amber' : 'blue'}>{i.status}</Badge> },
                    { key: 'act', header: '', align: 'right', render: (i) => <Button size="sm" onClick={() => openItem(i)}>Open</Button> },
                  ]}
                  rows={rows}
                  rowKey={(i) => i.id}
                />
                {rows.length === 0 && <div className="p-3 text-[13px] text-nop-muted">Nothing is waiting for your role, your authority limit or anything delegated to you.</div>}

                {open?.ok && (
                  <div className="p-3 border-t border-nop-border grid gap-3 lg:grid-cols-2">
                    <Panel title={`Item ${open.item.id} — ${open.item.summary}`} subtitle={`${open.item.objectType} ${open.item.objectId}`}>
                      <KeyValue
                        rows={[
                          ['Status', open.item.status],
                          ['Current step', `${open.item.currentStep} (${open.chain?.steps.find((s) => s.order === open.item.currentStep)?.approverRole ?? '—'})`],
                          ['Round', open.item.round],
                          ['Requested by', open.item.requesterEmail ?? '—'],
                          ['Skipped steps', (open.item.skippedSteps ?? []).map((s) => `${s.order}: ${s.reason}`).join('; ') || '—'],
                          ['Assigned to', open.item.assigneeEmail ?? '—'],
                        ]}
                      />
                      {open.conditions?.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[12.5px] font-semibold mb-1">Corrections</div>
                          <Grid
                            dense
                            columns={[
                              { key: 'text', header: 'Correction' },
                              { key: 'doneBy', header: 'Done by', render: (c) => c.doneBy ?? '—' },
                              { key: 'confirmedBy', header: 'Confirmed by', render: (c) => c.confirmedBy ?? '—' },
                              {
                                key: 'act',
                                header: '',
                                align: 'right',
                                render: (c) => (!c.doneBy ? (
                                  <Button size="sm" onClick={async () => { await api.post(`/admin-console/approvals/conditions/${c.id}/done`, {}); openItem(open.item); }}>Mark done</Button>
                                ) : null),
                              },
                            ]}
                            rows={open.conditions}
                            rowKey={(c) => c.id}
                          />
                        </div>
                      )}
                      {open.steps?.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[12.5px] font-semibold mb-1">History</div>
                          <Grid
                            dense
                            columns={[
                              { key: 'round', header: 'Round', align: 'right' },
                              { key: 'order', header: 'Step', align: 'right' },
                              { key: 'decision', header: 'Decision' },
                              { key: 'decidedBy', header: 'By' },
                              { key: 'reasonCode', header: 'Reason', render: (s) => s.reasonCode ?? '—' },
                              { key: 'comment', header: 'Comment', render: (s) => s.comment ?? '—' },
                            ]}
                            rows={open.steps}
                            rowKey={(s) => s.id}
                          />
                        </div>
                      )}
                    </Panel>

                    <Panel title="Decide" subtitle="A rejection needs a reason code; the requester sees the reason and what they can do next">
                      {result && (
                        <Alert tone={result.ok ? 'success' : 'error'} title={result.messageKey ?? (result.ok ? 'Recorded' : 'Refused')}>
                          {result.message
                            ?? (result.movedToStep ? `Approved at this step; the item moved to step ${result.movedToStep}.` : null)
                            ?? (result.item?.status === 'Approved' ? `Approved. ${result.moduleCallback?.called ? `${result.moduleCallback.feature} applied it.` : ''}` : null)
                            ?? (result.recourse ? `Rejected: ${result.reason}. Recourse: ${result.recourse.join(', ')}.` : 'Done.')}
                        </Alert>
                      )}
                      <div className="space-y-3">
                        <Field label="Reason code">
                          <Select value={decision.reasonCode} onChange={(e) => setDecision({ ...decision, reasonCode: e.target.value })}>
                            <option value="">(none)</option>
                            {(reasons.data ?? []).map((r) => <option key={r.code} value={r.code}>{`${r.code} — ${r.text}`}</option>)}
                          </Select>
                        </Field>
                        <Field label="Comment"><Input value={decision.comment} onChange={(e) => setDecision({ ...decision, comment: e.target.value })} /></Field>
                        <Field label="Corrections (one per line)">
                          <Textarea rows={3} value={decision.conditions} onChange={(e) => setDecision({ ...decision, conditions: e.target.value })} />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="brand" onClick={() => decide('approve')}>Approve</Button>
                          <Button onClick={() => decide('approveWithConditions')}>Approve with corrections</Button>
                          <Button onClick={() => decide('confirmConditions')}>Confirm corrections done</Button>
                          <Button variant="danger" onClick={() => decide('reject')}>Reject</Button>
                        </div>
                      </div>
                    </Panel>
                  </div>
                )}
                {open && !open.ok && <div className="p-3"><Alert tone="error" title="Access denied">{open.message}</Alert></div>}
              </>
            )}
          </Body>
        )}

        {tab === 'chains' && (
          <Body state={chains}>
            {(rows) => rows.map((c) => (
              <div key={c.code} className="p-3 border-b border-nop-border last:border-b-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-[13px] font-semibold">{c.code}</span>
                  <Badge tone="blue">{c.objectType}</Badge>
                  {c.note && <span className="text-[12px] text-nop-muted">{c.note}</span>}
                </div>
                <Grid
                  dense
                  columns={[
                    { key: 'order', header: 'Step', align: 'right' },
                    { key: 'approverRole', header: 'Approver role' },
                    { key: 'authorityLimit', header: 'Authority limit', align: 'right', render: (s) => (s.authorityLimit == null ? '—' : s.authorityLimit.toLocaleString()) },
                    { key: 'conditionRuleSet', header: 'Applies when', render: (s) => (s.conditionRuleSet ? `${s.conditionRuleSet} = ${s.includeWhenOutcome}` : 'always') },
                    { key: 'isAppealStep', header: 'Appeal step', render: (s) => (s.isAppealStep ? <Badge tone="purple">appeal</Badge> : '—') },
                  ]}
                  rows={c.steps}
                  rowKey={(s) => s.order}
                />
              </div>
            ))}
          </Body>
        )}

        {tab === 'queues' && (
          <Body state={queues}>
            {(rows) => (
              <Grid
                dense
                columns={[
                  { key: 'code', header: 'Queue', render: (q) => <span className="font-mono text-[12px]">{q.code}</span> },
                  { key: 'objectType', header: 'Object type' },
                  { key: 'assignmentRule', header: 'Assignment rule', render: (q) => <Badge tone="blue">{q.assignmentRule}</Badge> },
                  { key: 'members', header: 'Members', render: (q) => (q.members ?? []).map((m) => m?.email).filter(Boolean).join(', ') },
                ]}
                rows={rows}
                rowKey={(q) => q.code}
              />
            )}
          </Body>
        )}

        {tab === 'reasons' && (
          <Body state={reasons}>
            {(rows) => (
              <Grid
                dense
                columns={[
                  { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
                  { key: 'text', header: 'Text shown to the requester' },
                  { key: 'context', header: 'Context' },
                ]}
                rows={rows}
                rowKey={(r) => r.code}
              />
            )}
          </Body>
        )}
      </div>
    </AdminPage>
  );
}

/* ================================================== PRD-ADM-007 the operations console == */

export function OperationsConsole() {
  const console_ = useAdminData('/admin-console/operations/console');
  const dashboard = useAdminData('/admin-console/operations/dashboard');
  const orders = useAdminData('/admin-console/operations/orders');
  const online = useAdminData('/admin-console/operations/online');
  const work = useAdminData('/admin-console/operations/work-items');
  const [tab, setTab] = useState('dashboard');

  return (
    <AdminPage
      title="Operations console"
      breadcrumb={crumb({ label: 'Operations' }, { label: 'Console' })}
      intro="Your queues in one place, a dashboard arranged for your role, the orders waiting at each stage of fulfilment, and who is on the site right now."
      actions={(
        <span className="flex items-center gap-2">
          <Badge tone="green">
            {`${online.data?.count ?? 0} online now`}
          </Badge>
          <Button onClick={() => { dashboard.reload(); orders.reload(); online.reload(); }}>Refresh</Button>
        </span>
      )}
    >
      <Body state={console_}>
        {(data) => (
          <>
            {!data.canOpen && (
              <Alert tone="error" title="Access denied">
                {`The console needs ${data.permission}.`}
              </Alert>
            )}
            {data.canOpen && (
              <>
                <div className="flex flex-wrap gap-2">
                  {data.tabs.map((t) => <Badge key={t.code} tone="blue">{t.name}</Badge>)}
                  {data.hidden.map((h) => <Badge key={h.code} tone="slate" title={`needs ${h.needs}`}>{`${h.code} (hidden)`}</Badge>)}
                </div>

                <Tabs
                  tabs={[
                    { id: 'dashboard', label: 'My dashboard', count: dashboard.data?.tiles.length ?? 0 },
                    { id: 'orders', label: 'Operational orders', count: (orders.data?.groups ?? []).reduce((n, g) => n + g.count, 0) },
                    { id: 'shortcuts', label: 'Shortcuts', count: data.shortcuts.length },
                    { id: 'metrics', label: 'Work items', count: work.data?.events.length ?? 0 },
                  ]}
                  active={tab}
                  onChange={setTab}
                />
                <div className="border border-t-0 border-nop-border bg-white p-3">
                  {tab === 'dashboard' && (
                    <Body state={dashboard}>
                      {(d) => (
                        <>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {d.tiles.map((t) => <StatTile key={t.code} label={t.name} value={t.value} tone="blue" />)}
                          </div>
</>
                      )}
                    </Body>
                  )}

                  {tab === 'orders' && (
                    <Body state={orders}>
                      {(view) => (
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-4">
                            {view.groups.map((g) => <StatTile key={g.stage} label={g.stage.replace(/([A-Z])/g, ' $1').trim()} value={g.count} tone="amber" />)}
                          </div>
                          {view.groups.filter((g) => g.count > 0).map((g) => (
                            <Panel key={g.stage} title={g.stage.replace(/([A-Z])/g, ' $1').trim()} subtitle={`${g.count} order(s)`} bodyClass="p-0">
                              <Grid
                                dense
                                columns={[
                                  { key: 'orderNumber', header: 'Order', render: (o) => <Link to={o.logAction} className="text-nop-blue hover:underline font-mono text-[12px]">{o.orderNumber}</Link> },
                                  { key: 'customerEmail', header: 'Customer' },
                                  { key: 'outlet', header: 'Outlet', render: (o) => o.outlet ?? '—' },
                                  { key: 'branch', header: 'Branch', render: (o) => o.branch ?? '—' },
                                  { key: 'stageSuppliedBy', header: 'Stage supplied by', render: (o) => <span className="text-[11.5px] font-mono">{o.stageSuppliedBy}</span> },
                                ]}
                                rows={g.orders}
                                rowKey={(o) => o.orderNumber}
                              />
                            </Panel>
                          ))}
</div>
                      )}
                    </Body>
                  )}

                  {tab === 'shortcuts' && (
                    <Grid
                      dense
                      columns={[
                        { key: 'keys', header: 'Keys', render: (s) => <span className="font-mono text-[12px]">{s.keys}</span> },
                        { key: 'action', header: 'Action' },
                        { key: 'needs', header: 'Permission checked', render: (s) => <span className="font-mono text-[11.5px]">{s.needs}</span> },
                        { key: 'confirm', header: 'Confirmation', render: (s) => (s.confirm ? <Badge tone="amber">asks first</Badge> : '—') },
                      ]}
                      rows={data.shortcuts}
                      rowKey={(s) => s.action}
                    />
                  )}

                  {tab === 'metrics' && (
                    <Body state={work}>
                      {(w) => (
                        <>
                          <Grid
                            dense
                            columns={[
                              { key: 'queueCode', header: 'Queue', render: (q) => <span className="font-mono text-[12px]">{q.queueCode}</span> },
                              { key: 'assigned', header: 'Assigned', align: 'right' },
                              { key: 'completed', header: 'Completed', align: 'right' },
                              { key: 'reopened', header: 'Reopened', align: 'right' },
                            ]}
                            rows={w.byQueue}
                            rowKey={(q) => q.queueCode}
                          />
</>
                      )}
                    </Body>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </Body>
    </AdminPage>
  );
}

/* ============================================ PRD-ADM-009 exceptions, ADM-010 alerts ==== */

export function Exceptions() {
  const state = useAdminData('/admin-console/exceptions');
  const reasons = useAdminData('/admin-console/approvals/reason-codes?context=exception');
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ action: 'resolve', reasonCode: '', comment: '' });
  const [result, setResult] = useState(null);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const apply = async () => {
    const r = await api.post('/admin-console/exceptions/bulk', { ids: selected, ...form });
    setResult(r);
    setSelected([]);
    state.reload();
  };

  return (
    <AdminPage
      title="Exceptions"
      breadcrumb={crumb({ label: 'Operations' }, { label: 'Exceptions' })}
      intro="Failed checks, stuck items and errors from other systems in one queue, worst first, with reason codes, bulk actions and repeated causes grouped together."
      actions={(
        <span className="flex gap-2">
          <Button onClick={async () => { await api.post('/admin-console/exceptions/detect-patterns', {}); state.reload(); }}>Detect patterns</Button>
          <Button onClick={state.reload}>Refresh</Button>
        </span>
      )}
    >
      <Body state={state}>
        {(data) => (
          <>
            {data.patterns.length > 0 && (
              <Panel title="Repeated causes" subtitle="Open exceptions that share a reason code and a source inside the window" bodyClass="p-0">
                <Grid
                  dense
                  columns={[
                    { key: 'reasonCode', header: 'Reason code', render: (p) => <span className="font-mono text-[12px]">{p.reasonCode}</span> },
                    { key: 'source', header: 'Source' },
                    { key: 'count', header: 'Count', align: 'right' },
                    { key: 'firstSeen', header: 'First seen', render: (p) => p.firstSeen.replace('T', ' ').slice(0, 19) },
                    { key: 'lastSeen', header: 'Last seen', render: (p) => p.lastSeen.replace('T', ' ').slice(0, 19) },
                  ]}
                  rows={data.patterns}
                  rowKey={(p) => `${p.reasonCode}-${p.source}`}
                />
              </Panel>
            )}

            {result && (
              <Alert tone={result.ok ? 'success' : 'warning'} title={`Bulk ${result.action}`}>
                {result.results.map((r) => `#${r.id}: ${r.ok ? 'done' : r.message}`).join(' · ')}
              </Alert>
            )}

            <Panel
              title="Queue"
              subtitle="Worst first, then oldest first"
              bodyClass="p-0"
            >
              {/* the bulk action bar: a grid, so it stacks at tablet and phone widths */}
              <div className="grid gap-2 p-3 border-b border-nop-border sm:grid-cols-2 lg:grid-cols-4">
                <Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} aria-label="Bulk action">
                  <option value="resolve">resolve</option>
                  <option value="retry">retry</option>
                  <option value="escalate">escalate</option>
                </Select>
                <Select value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })} aria-label="Reason code">
                  <option value="">reason code…</option>
                  {(reasons.data ?? []).map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
                </Select>
                <Input placeholder="comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} aria-label="Comment" />
                <Button variant="brand" disabled={selected.length === 0} onClick={apply}>
                  {`Apply to ${selected.length}`}
                </Button>
              </div>
              <Grid
                dense
                columns={[
                  {
                    key: 'pick',
                    header: '',
                    render: (e) => <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} aria-label={`Select exception ${e.id}`} />,
                  },
                  { key: 'severity', header: 'Severity', render: (e) => <Badge tone={e.severity === 'Critical' ? 'red' : e.severity === 'High' ? 'amber' : 'slate'}>{e.severity}</Badge> },
                  { key: 'type', header: 'Type' },
                  { key: 'reasonCode', header: 'Reason code', render: (e) => <span className="font-mono text-[12px]">{e.reasonCode}</span> },
                  { key: 'source', header: 'Source' },
                  { key: 'raisedBy', header: 'Raised by', render: (e) => moduleName(e.raisedBy) },
                  { key: 'attempts', header: 'Attempts', align: 'right' },
                  { key: 'status', header: 'Status' },
                  { key: 'raisedOnUtc', header: 'Raised', render: (e) => e.raisedOnUtc.replace('T', ' ').slice(0, 19) },
                  {
                    key: 'act',
                    header: '',
                    align: 'right',
                    render: (e) => (
                      <span className="flex gap-1 justify-end">
                        <Button size="sm" onClick={async () => { await api.post(`/admin-console/exceptions/${e.id}/retry`, {}); state.reload(); }}>Retry</Button>
                        <Button size="sm" onClick={async () => { await api.post(`/admin-console/exceptions/${e.id}/escalate`, {}); state.reload(); }}>Escalate</Button>
                      </span>
                    ),
                  },
                ]}
                rows={data.exceptions}
                rowKey={(e) => e.id}
              />
</Panel>
          </>
        )}
      </Body>
    </AdminPage>
  );
}

export function Alerts() {
  const state = useAdminData('/admin-console/alerts');
  const [rule, setRule] = useState({ measure: 'open-exceptions:IntegrationError', threshold: 2, recipients: 'operations@example.com' });

  return (
    <AdminPage
      title="Alerts"
      breadcrumb={crumb({ label: 'Operations' }, { label: 'Alerts' })}
      intro="Alerts when something needs attention — orders stuck too long, service targets missed — at the thresholds you set, cleared when the measure comes back."
      actions={(
        <span className="flex gap-2">
          <Button onClick={async () => { await api.post('/admin-console/alerts/run', {}); state.reload(); }}>Run the alert task now</Button>
          <Button onClick={state.reload}>Refresh</Button>
        </span>
      )}
    >
      <Body state={state}>
        {(data) => (
          <>
            <Panel title="Alert rules" bodyClass="p-0">
              <Grid
                dense
                columns={[
                  { key: 'measure', header: 'Measure', render: (r) => <span className="font-mono text-[12px]">{r.measure}</span> },
                  { key: 'threshold', header: 'Threshold', align: 'right' },
                  { key: 'recipients', header: 'Recipients', render: (r) => (r.recipients ?? []).join(', ') },
                  { key: 'channel', header: 'Channel' },
                  { key: 'repeatIntervalMinutes', header: 'Repeat after (min)', align: 'right' },
                  { key: 'isActive', header: 'Active', render: (r) => <Badge tone={r.isActive === false ? 'slate' : 'green'}>{r.isActive === false ? 'off' : 'on'}</Badge> },
                ]}
                rows={data.rules}
                rowKey={(r) => r.id}
              />
              <div className="p-3 border-t border-nop-border grid gap-3 md:grid-cols-4">
                <Field label="Measure"><Input value={rule.measure} onChange={(e) => setRule({ ...rule, measure: e.target.value })} /></Field>
                <Field label="Threshold"><Input type="number" value={rule.threshold} onChange={(e) => setRule({ ...rule, threshold: Number(e.target.value) })} /></Field>
                <Field label="Recipients"><Input value={rule.recipients} onChange={(e) => setRule({ ...rule, recipients: e.target.value })} /></Field>
                <div className="flex items-end">
                  <Button
                    variant="brand"
                    onClick={async () => {
                      await api.post('/admin-console/alerts/rules', { ...rule, recipients: rule.recipients.split(',').map((x) => x.trim()) });
                      state.reload();
                    }}
                  >
                    Add the rule
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel title="Alerts" subtitle="An acknowledged alert shows who and when; it clears when the measure falls back below the threshold" bodyClass="p-0">
              <Grid
                dense
                columns={[
                  { key: 'measure', header: 'Measure', render: (a) => <span className="font-mono text-[12px]">{a.measure}</span> },
                  { key: 'value', header: 'Value', align: 'right' },
                  { key: 'threshold', header: 'Threshold', align: 'right' },
                  { key: 'status', header: 'Status', render: (a) => <Badge tone={a.status === 'Raised' ? 'red' : a.status === 'Acknowledged' ? 'amber' : 'green'}>{a.status}</Badge> },
                  { key: 'raisedOnUtc', header: 'Raised', render: (a) => (a.raisedOnUtc ?? '').replace('T', ' ').slice(0, 19) },
                  { key: 'acknowledgedBy', header: 'Acknowledged by', render: (a) => a.acknowledgedBy ?? '—' },
                  {
                    key: 'act',
                    header: '',
                    align: 'right',
                    render: (a) => (a.status === 'Raised' ? (
                      <Button size="sm" onClick={async () => { await api.post(`/admin-console/alerts/${a.id}/acknowledge`, {}); state.reload(); }}>Acknowledge</Button>
                    ) : null),
                  },
                ]}
                rows={data.alerts}
                rowKey={(a) => a.id}
              />
            </Panel>
          </>
        )}
      </Body>
    </AdminPage>
  );
}
