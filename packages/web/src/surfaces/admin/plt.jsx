// nopCommerce administration - the platform screens: change sets, retention rules and runs,
// help tips and guided tours, and countries with their regions.

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
  PendingApproval: 'amber', Applied: 'green', Rejected: 'red', Stale: 'red', Withdrawn: 'slate', Draft: 'slate',
};

const value = (v) => (v === null || v === undefined ? '-' : (typeof v === 'object' ? JSON.stringify(v) : String(v)));
const when = (v) => (v ? new Date(v).toLocaleString() : '-');

/* ======================================================= change sets =================== */

export function AdminChangeSets() {
  const [tab, setTab] = useState('pending');
  const [control, setControl] = useState(null);
  const [sets, setSets] = useState(null);
  const [history, setHistory] = useState(null);
  const [preview, setPreview] = useState(null);
  const [asOf, setAsOf] = useState({ at: new Date().toISOString().slice(0, 16), rows: null });
  const [compare, setCompare] = useState(null);
  const [notice, setNotice] = useState(null);
  const [filters, setFilters] = useState({ actor: '', key: '', storeId: '' });

  const load = useCallback(() => {
    api.get('/platform/change-control').then(setControl).catch(() => {});
    api.get('/platform/change-control/sets').then(setSets).catch(() => setSets([]));
    const query = new URLSearchParams();
    if (filters.actor) query.set('actor', filters.actor);
    if (filters.key) query.set('key', filters.key);
    if (filters.storeId !== '') query.set('storeId', filters.storeId);
    api.get(`/platform/change-control/history?${query.toString()}`).then(setHistory).catch(() => {});
  }, [filters.actor, filters.key, filters.storeId]);

  useEffect(() => { load(); }, [load]);

  const act = async (id, what, body = {}) => {
    try {
      const r = await api.post(`/platform/change-control/sets/${id}/${what}`, body);
      setNotice(r.ok === false
        ? { tone: 'error', text: r.message ?? 'The action was refused.' }
        : { tone: 'success', text: r.applied ? 'The change set was applied.' : (r.waitingForAnotherApprover ? 'Recorded. A second approver is needed.' : 'Done.') });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const showPreview = async (id) => {
    setPreview({ loading: true, id });
    try { setPreview({ id, ...(await api.get(`/platform/change-control/sets/${id}/preview`)) }); } catch (err) { setPreview({ id, error: err.message }); }
  };

  const loadAsOf = async (at) => {
    const r = await api.get(`/platform/change-control/as-of?at=${encodeURIComponent(new Date(at).toISOString())}`);
    setAsOf({ at, rows: Object.entries(r.values ?? {}).map(([key, v]) => ({ key, ...v })) });
  };

  const runCompare = async () => {
    const left = await api.get('/platform/change-control/snapshot?label=live');
    const right = await api.get('/platform/change-control/snapshot?label=selected');
    setCompare(await api.post('/platform/change-control/compare', { left, right }));
  };

  const pending = (sets ?? []).filter((s) => s.status === 'PendingApproval');
  const mine = (sets ?? []).filter((s) => s.requestedBy);

  return (
    <AdminPage
      title="Change sets"
      breadcrumb={crumb('Configuration', { label: 'Change sets' })}
      intro="A change to a controlled setting is captured here instead of being written. It takes effect when it has been approved."
      actions={<Button size="sm" onClick={load}>Refresh</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {control?.prototypeDefaultLabel && (
        <Alert tone="warning" title="Prototype default">
          {control.prototypeDefaultLabel}
          . Approval runs on the built-in approval engine until the workflow engine is chosen.
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Pending approval" value={pending.length} tone="amber" />
        <StatTile label="Applied" value={(sets ?? []).filter((s) => s.status === 'Applied').length} tone="green" />
        <StatTile label="Stale or rejected" value={(sets ?? []).filter((s) => ['Stale', 'Rejected'].includes(s.status)).length} tone="red" />
        <StatTile label="Controlled settings" value={(control?.controlledItems ?? []).length} tone="blue" />
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'pending', label: 'Pending approvals', count: pending.length },
          { id: 'mine', label: 'My changes', count: mine.length },
          { id: 'history', label: 'History' },
          { id: 'asof', label: 'As of a date' },
          { id: 'compare', label: 'Compare' },
          { id: 'controlled', label: 'Controlled settings', count: (control?.controlledItems ?? []).length },
        ]}
      />

      {tab === 'pending' && (
        <Panel bodyClass="p-0" subtitle="A change set is approved by somebody other than the person who requested it. A high-impact change needs two approvers.">
          {!sets ? <Spinner /> : (
            <Grid
              rows={pending}
              rowKey={(r) => r.id}
              empty="No change is waiting for approval."
              columns={[
                { key: 'id', header: 'Reference', render: (r) => <span className="font-mono text-[12px]">{`CS-${r.id}`}</span> },
                { key: 'keys', header: 'Settings', render: (r) => <span className="font-mono text-[12px]">{r.items.map((i) => i.key).join(', ')}</span> },
                { key: 'new', header: 'New value', render: (r) => <span className="font-mono text-[12px]">{r.items.map((i) => value(i.newValue)).join(', ')}</span> },
                { key: 'impact', header: 'Impact', render: (r) => <Badge tone={r.impact === 'High' ? 'red' : 'slate'}>{r.impact}</Badge> },
                { key: 'requestedBy', header: 'Requested by' },
                { key: 'reason', header: 'Reason', render: (r) => r.reason ?? '-' },
                {
                  key: 'approvals',
                  header: 'Approvals',
                  render: (r) => `${(r.approvals ?? []).length} of ${r.impact === 'High' ? 2 : 1}`,
                },
                {
                  key: 'actions',
                  header: '',
                  render: (r) => (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => showPreview(r.id)}>Preview</Button>
                      <Button size="sm" variant="success" onClick={() => act(r.id, 'approve')}>Approve</Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          const reason = window.prompt('Why is this change rejected?');
                          if (reason) act(r.id, 'reject', { reason });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'pending' && preview && (
        <Panel title={`Preview of CS-${preview.id}`} subtitle="What this change touches before it is approved.">
          {preview.loading ? <Spinner /> : preview.error ? <Alert tone="error">{preview.error}</Alert> : (
            <Grid
              dense
              rows={preview.rows ?? []}
              rowKey={(r) => r.key}
              columns={[
                { key: 'key', header: 'Setting', render: (r) => <span className="font-mono text-[12px]">{r.key}</span> },
                { key: 'scope', header: 'Scope' },
                { key: 'currentValue', header: 'Current', render: (r) => value(r.currentValue) },
                { key: 'newValue', header: 'New', render: (r) => value(r.newValue) },
                {
                  key: 'inherit',
                  header: 'Stores using the shared value',
                  render: (r) => ((r.storesInheritingSharedValue ?? []).map((s) => s.storeName ?? s.storeId).join(', ') || '-'),
                },
                {
                  key: 'impacts',
                  header: 'Records affected',
                  render: (r) => ((r.impacts ?? []).map((i) => `${i.count} ${i.what}`).join('; ') || 'none reported'),
                },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'mine' && (
        <Panel bodyClass="p-0">
          {!sets ? <Spinner /> : (
            <Grid
              rows={mine}
              rowKey={(r) => r.id}
              empty="You have not requested a change."
              columns={[
                { key: 'id', header: 'Reference', render: (r) => <span className="font-mono text-[12px]">{`CS-${r.id}`}</span> },
                { key: 'keys', header: 'Settings', render: (r) => <span className="font-mono text-[12px]">{r.items.map((i) => i.key).join(', ')}</span> },
                { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
                { key: 'requestedBy', header: 'Requested by' },
                { key: 'createdOnUtc', header: 'Requested', render: (r) => when(r.createdOnUtc) },
                { key: 'appliedOnUtc', header: 'Applied', render: (r) => when(r.appliedOnUtc) },
                { key: 'rejectionReason', header: 'Rejected because', render: (r) => r.rejectionReason ?? '-' },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'history' && (
        <>
          <SearchPanel onSearch={load} onClear={() => setFilters({ actor: '', key: '', storeId: '' })}>
            <Field label="Changed by"><Input value={filters.actor} onChange={(e) => setFilters({ ...filters, actor: e.target.value })} placeholder="admin@example.com" /></Field>
            <Field label="Setting"><Input value={filters.key} onChange={(e) => setFilters({ ...filters, key: e.target.value })} placeholder="ordersettings.anonymouscheckoutallowed" /></Field>
            <Field label="Store"><Input value={filters.storeId} onChange={(e) => setFilters({ ...filters, storeId: e.target.value })} placeholder="0 for the shared value" /></Field>
          </SearchPanel>
          <Panel
            bodyClass="p-0"
            subtitle={history ? `${history.rows.length} changes` : undefined}
            actions={history && (
              <Button
                size="sm"
                onClick={() => {
                  const blob = new Blob([history.csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'configuration-changes.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export
              </Button>
            )}
          >
            {!history ? <Spinner /> : (
              <Grid
                dense
                rows={history.rows}
                rowKey={(r) => r.sequence}
                empty="Nothing has been changed yet."
                columns={[
                  { key: 'at', header: 'When', render: (r) => when(r.at) },
                  { key: 'actor', header: 'Who' },
                  { key: 'key', header: 'Setting', render: (r) => <span className="font-mono text-[12px]">{r.key}</span> },
                  { key: 'storeId', header: 'Store', align: 'right', render: (r) => (Number(r.storeId) === 0 ? '0 (shared)' : r.storeId) },
                  { key: 'oldValue', header: 'Old value', render: (r) => value(r.oldValue) },
                  { key: 'newValue', header: 'New value', render: (r) => value(r.newValue) },
                  { key: 'reason', header: 'Reason', render: (r) => r.reason ?? '-' },
                  { key: 'approvers', header: 'Approved by', render: (r) => ((r.approvers ?? []).join(', ') || '-') },
                ]}
              />
            )}
          </Panel>
        </>
      )}

      {tab === 'asof' && (
        <Panel title="The configuration as it was" subtitle="Rebuilt from the configuration history.">
          <div className="flex flex-wrap items-end gap-2 mb-3">
            <Field label="Date and time">
              <Input type="datetime-local" value={asOf.at} onChange={(e) => setAsOf({ ...asOf, at: e.target.value })} />
            </Field>
            <Button variant="primary" onClick={() => loadAsOf(asOf.at)}>Show</Button>
          </div>
          {asOf.rows && (
            <Grid
              dense
              rows={asOf.rows}
              rowKey={(r) => r.key}
              columns={[
                { key: 'key', header: 'Setting', render: (r) => <span className="font-mono text-[12px]">{r.key}</span> },
                { key: 'value', header: 'Value then', render: (r) => value(r.value) },
                { key: 'at', header: 'Set on', render: (r) => when(r.at) },
                { key: 'actor', header: 'Set by', render: (r) => r.actor ?? '-' },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'compare' && (
        <Panel
          title="Compare configurations"
          subtitle="Keys whose values differ are listed side by side."
          actions={<Button size="sm" variant="primary" onClick={runCompare}>Compare with the live values</Button>}
        >
          {!compare ? <p className="text-[13px] text-nop-muted">Choose two configurations to compare.</p> : (
            <>
              <KeyValue rows={[['Left', compare.left], ['Right', compare.right], ['Keys that match', compare.same]]} />
              <div className="h-3" />
              <Grid
                dense
                rows={compare.differences}
                rowKey={(r) => r.key}
                empty="The two configurations are identical."
                columns={[
                  { key: 'key', header: 'Setting', render: (r) => <span className="font-mono text-[12px]">{r.key}</span> },
                  { key: 'left', header: compare.left, render: (r) => value(r.left) },
                  { key: 'right', header: compare.right, render: (r) => value(r.right) },
                ]}
              />
            </>
          )}
        </Panel>
      )}

      {tab === 'controlled' && (
        <Panel bodyClass="p-0" subtitle="A change to one of these settings needs approval before it takes effect.">
          <Grid
            dense
            rows={control?.controlledItems ?? []}
            rowKey={(r) => r.key}
            columns={[
              { key: 'key', header: 'Setting', render: (r) => <span className="font-mono text-[12px]">{r.key}</span> },
              { key: 'type', header: 'Value type', render: (r) => r.type ?? '-' },
              { key: 'range', header: 'Allowed', render: (r) => (r.min !== undefined ? `${r.min} to ${r.max}` : (r.reference ?? '-')) },
              { key: 'impact', header: 'Impact', render: (r) => <Badge tone={r.impact === 'High' ? 'red' : 'slate'}>{r.impact}</Badge> },
              { key: 'reason', header: 'Why it is controlled', render: (r) => r.reason ?? '-' },
            ]}
          />
        </Panel>
      )}
    </AdminPage>
  );
}

/* ======================================================= retention ===================== */

export function AdminRetention() {
  const [tab, setTab] = useState('rules');
  const [screen, setScreen] = useState(null);
  const [runs, setRuns] = useState(null);
  const [archive, setArchive] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({
    recordType: '', period: '', unit: 'days', action: 'Archive', layer: 'client', archivePeriod: '', isActive: true,
  });

  const load = useCallback(() => {
    api.get('/platform/retention/rules').then(setScreen).catch(() => {});
    api.get('/platform/retention/runs').then(setRuns).catch(() => setRuns([]));
    api.get('/platform/retention/archive').then(setArchive).catch(() => {});
    api.get('/platform/retention/native-tasks').then(setTasks).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const chosen = (screen?.rows ?? []).find((r) => r.code === form.recordType);

  const save = async () => {
    try {
      const r = await api.post('/platform/retention/rules', {
        ...form,
        period: Number(form.period),
        archivePeriod: form.archivePeriod === '' ? null : Number(form.archivePeriod),
      });
      setNotice(r.ok === false
        ? { tone: 'error', text: r.message ?? 'The rule was not saved.' }
        : {
          tone: 'success',
          text: r.nativeSetting
            ? `Saved. ${r.nativeSetting.changeControlled ? 'The maintenance setting it feeds needs approval.' : `The ${r.nativeSetting.task} setting was set from this rule.`}`
            : 'Saved.',
        });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const runNow = async (recordType = null, tracking = false) => {
    try {
      const r = tracking
        ? await api.post('/platform/retention/run-tracking', {})
        : await api.post('/platform/retention/run', { recordType });
      setNotice(r.ok === false
        ? { tone: 'error', text: r.message ?? 'The run did not start.' }
        : { tone: 'success', text: `Run finished. ${(r.counts ?? []).reduce((s, c) => s + (c.processed ?? 0), 0)} records processed.` });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const latest = (runs ?? [])[(runs ?? []).length - 1] ?? null;

  return (
    <AdminPage
      title="Retention rules and runs"
      breadcrumb={crumb('Configuration', { label: 'Retention' })}
      intro="How long each kind of record is kept, and what happens to it afterwards: archive it, remove the personal details or delete it."
      actions={(
        <>
          <Button size="sm" onClick={load}>Refresh</Button>
          <Button size="sm" variant="primary" onClick={() => runNow(null)}>Run now</Button>
        </>
      )}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Record types" value={(screen?.rows ?? []).length} tone="blue" />
        <StatTile label="Rules set" value={(screen?.rows ?? []).filter((r) => r.rule).length} tone="green" />
        <StatTile label="Last run processed" value={latest?.processed ?? 0} tone="slate" />
        <StatTile label="Held back" value={latest?.held ?? 0} tone="amber" hint="records under a hold or linked to open money" />
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'rules', label: 'Rules', count: (screen?.rows ?? []).length },
          { id: 'runs', label: 'Runs', count: (runs ?? []).length },
          { id: 'archive', label: 'Archive', count: (archive?.entries ?? []).length },
          { id: 'tasks', label: 'Maintenance tasks' },
        ]}
      />

      {tab === 'rules' && (
        <>
          <Panel title="Set a rule" subtitle="Every period has to be entered: the product ships no default retention period.">
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 items-end">
              <Field label="Record type">
                <Select value={form.recordType} onChange={(e) => setForm({ ...form, recordType: e.target.value })}>
                  <option value="">Choose a record type</option>
                  {(screen?.rows ?? []).map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
                </Select>
              </Field>
              <Field label="Keep for"><Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="365" /></Field>
              <Field label="Unit">
                <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['days', 'months', 'years'].map((u) => <option key={u} value={u}>{u}</option>)}
                </Select>
              </Field>
              <Field label="Then" hint={chosen ? `allowed: ${(chosen.allowedActions ?? []).join(', ')}` : undefined}>
                <Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                  {(chosen?.allowedActions ?? screen?.actions ?? []).map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </Field>
              <Field label="Layer">
                <Select value={form.layer} onChange={(e) => setForm({ ...form, layer: e.target.value })}>
                  {(screen?.layers ?? ['country', 'client']).map((l) => <option key={l} value={l}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Archive period" hint="for records that are archived first and deleted later">
                <Input value={form.archivePeriod} onChange={(e) => setForm({ ...form, archivePeriod: e.target.value })} placeholder="optional" />
              </Field>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <Button variant="primary" onClick={save} disabled={!form.recordType || !form.period}>Save</Button>
            </div>
          </Panel>
          <Panel bodyClass="p-0" subtitle={screen?.periodNote ? 'A record type without a rule is never purged.' : undefined}>
            {!screen ? <Spinner /> : (
              <Grid
                dense
                rows={screen.rows}
                rowKey={(r) => r.code}
                columns={[
                  { key: 'code', header: 'Record type', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
                  { key: 'owningModule', header: 'Owned by' },
                  { key: 'entity', header: 'Records', render: (r) => <span className="font-mono text-[12px]">{r.entity}</span> },
                  { key: 'period', header: 'Kept for', render: (r) => (r.rule ? `${r.rule.period} ${r.rule.unit}` : <span className="text-nop-muted">not set</span>) },
                  { key: 'action', header: 'Then', render: (r) => (r.rule ? <Badge tone={r.rule.action === 'Delete' ? 'red' : 'blue'}>{r.rule.action}</Badge> : '-') },
                  { key: 'layer', header: 'Layer', render: (r) => r.rule?.layer ?? '-' },
                  { key: 'hold', header: 'Hold check', render: (r) => (r.hasHoldCheck ? <Badge tone="green">Yes</Badge> : <Badge tone="slate">No</Badge>) },
                  {
                    key: 'active',
                    header: 'Active',
                    render: (r) => (r.rule ? <Badge tone={r.rule.isActive ? 'green' : 'slate'}>{r.rule.isActive ? 'Yes' : 'No'}</Badge> : '-'),
                  },
                  {
                    key: 'run',
                    header: '',
                    render: (r) => (r.rule
                      ? (
                        <Button size="sm" onClick={() => runNow(r.code, r.code === 'trk.trackingevents' && r.rule.archivePeriod)}>
                          Run
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

      {tab === 'runs' && (
        <Panel bodyClass="p-0" subtitle="What each run processed, per record type.">
          {!runs ? <Spinner /> : (
            <Grid
              rows={[...runs].reverse()}
              rowKey={(r) => r.id}
              empty="Nothing has run yet."
              columns={[
                { key: 'startedOnUtc', header: 'Started', render: (r) => when(r.startedOnUtc) },
                { key: 'startedBy', header: 'Started by' },
                { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Completed' ? 'green' : 'amber'}>{r.status}</Badge> },
                { key: 'processed', header: 'Processed', align: 'right', render: (r) => r.processed ?? 0 },
                { key: 'archived', header: 'Archived', align: 'right', render: (r) => r.archived ?? 0 },
                { key: 'anonymised', header: 'Anonymised', align: 'right', render: (r) => r.anonymised ?? 0 },
                { key: 'deleted', header: 'Deleted', align: 'right', render: (r) => r.deleted ?? 0 },
                { key: 'held', header: 'Held', align: 'right', render: (r) => r.held ?? 0 },
                {
                  key: 'types',
                  header: 'Record types',
                  render: (r) => ((r.counts ?? []).map((c) => c.recordType).join(', ') || '-'),
                },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'archive' && (
        <Panel bodyClass="p-0" subtitle="Archived records stay searchable by staff. Each batch carries a checksum and is verified before anything is removed from the live data.">
          {!archive ? <Spinner /> : (
            <Grid
              rows={archive.entries}
              rowKey={(r) => r.id}
              empty="Nothing has been archived."
              columns={[
                { key: 'recordType', header: 'Record type', render: (r) => <span className="font-mono text-[12px]">{r.recordType}</span> },
                { key: 'entity', header: 'Records', render: (r) => <span className="font-mono text-[12px]">{r.entity}</span> },
                { key: 'count', header: 'Records', align: 'right' },
                { key: 'checksum', header: 'Checksum', render: (r) => <span className="font-mono text-[12px]">{r.checksum}</span> },
                { key: 'verified', header: 'Verified', render: (r) => <Badge tone={r.verified ? 'green' : 'red'}>{r.verified ? 'Yes' : 'No'}</Badge> },
                { key: 'writtenOnUtc', header: 'Written', render: (r) => when(r.writtenOnUtc) },
              ]}
            />
          )}
        </Panel>
      )}

      {tab === 'tasks' && (
        <Panel title="Maintenance tasks" subtitle="These tasks read their value from the retention rule, so there is one place to change it.">
          {!tasks ? <Spinner /> : (
            <Grid
              dense
              rows={tasks.tasks}
              rowKey={(r) => r.name}
              columns={[
                { key: 'name', header: 'Task' },
                { key: 'setting', header: 'Setting it reads', render: (r) => (r.setting ? <span className="font-mono text-[12px]">{r.setting}</span> : '-') },
                { key: 'value', header: 'Value now', render: (r) => value(r.value) },
                { key: 'recordType', header: 'Set by the rule for', render: (r) => <span className="font-mono text-[12px]">{r.recordType}</span> },
              ]}
            />
          )}
        </Panel>
      )}
    </AdminPage>
  );
}

/* ======================================================= help tips and tours =========== */

export function AdminHelpContent() {
  const [tab, setTab] = useState('tips');
  const [tips, setTips] = useState(null);
  const [tours, setTours] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [notice, setNotice] = useState(null);
  const [tip, setTip] = useState({
    route: '', role: '', languageId: 1, title: '', body: '', materialSource: '', materialReference: '',
  });
  const [tour, setTour] = useState({ role: 'buyer', name: '', steps: '' });

  const load = useCallback(() => {
    api.get('/platform/help/tips/all').then(setTips).catch(() => setTips([]));
    api.get('/platform/help/tours').then(setTours).catch(() => setTours([]));
    api.get('/platform/languages').then(setLanguages).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveTip = async () => {
    try {
      const r = await api.post('/platform/help/tips', {
        route: tip.route,
        role: tip.role || null,
        languageId: Number(tip.languageId),
        title: tip.title,
        body: tip.body,
        materialLink: tip.materialSource ? { source: tip.materialSource, reference: tip.materialReference } : null,
      });
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'The tip was not saved.' } : { tone: 'success', text: 'Saved. Users see it at once.' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const saveTour = async () => {
    try {
      const steps = tour.steps.split('\n').map((line) => line.trim()).filter(Boolean)
        .map((line) => {
          const [target, ...text] = line.split('|');
          return { target: target.trim(), text: text.join('|').trim() };
        });
      const r = await api.post('/platform/help/tours', { role: tour.role, name: tour.name, steps });
      setNotice(r.ok === false ? { tone: 'error', text: r.message ?? 'The tour was not saved.' } : { tone: 'success', text: 'Saved.' });
      load();
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const remove = async (id) => {
    try { await api.del(`/platform/help/tips/${id}`); load(); } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  const languageName = (id) => languages.find((l) => l.id === Number(id))?.name ?? id;

  return (
    <AdminPage
      title="Help tips and guided tours"
      breadcrumb={crumb('Content management', { label: 'Help tips and tours' })}
      intro="Short tips on each screen and a guided tour per kind of user. Both are content: a change is live as soon as it is saved."
      actions={<Button size="sm" onClick={load}>Refresh</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[{ id: 'tips', label: 'Help tips', count: (tips ?? []).length }, { id: 'tours', label: 'Guided tours', count: (tours ?? []).length }]}
      />

      {tab === 'tips' && (
        <>
          <Panel title="Add or edit a tip">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Screen" required hint="the page address the tip belongs to"><Input value={tip.route} onChange={(e) => setTip({ ...tip, route: e.target.value })} placeholder="/admin/configuration/packs" /></Field>
              <Field label="Shown to">
                <Select value={tip.role} onChange={(e) => setTip({ ...tip, role: e.target.value })}>
                  <option value="">Everybody</option>
                  {['buyer', 'seller', 'staff'].map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
              <Field label="Language">
                <Select value={tip.languageId} onChange={(e) => setTip({ ...tip, languageId: e.target.value })}>
                  {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </Field>
              <Field label="Title" required><Input value={tip.title} onChange={(e) => setTip({ ...tip, title: e.target.value })} /></Field>
              <Field label="Training material">
                <Select value={tip.materialSource} onChange={(e) => setTip({ ...tip, materialSource: e.target.value })}>
                  <option value="">None</option>
                  <option value="PRD-DOC-002 document">A document</option>
                  <option value="PRD-MKT-007 content page">A content page</option>
                </Select>
              </Field>
              <Field label="Material reference"><Input value={tip.materialReference} onChange={(e) => setTip({ ...tip, materialReference: e.target.value })} placeholder="Buyer guide v1" /></Field>
            </div>
            <Field label="Tip" required>
              <Textarea rows={3} value={tip.body} onChange={(e) => setTip({ ...tip, body: e.target.value })} />
            </Field>
            <div className="mt-3">
              <Button variant="primary" onClick={saveTip} disabled={!tip.route || !tip.title || !tip.body}>Save</Button>
            </div>
          </Panel>
          <Panel bodyClass="p-0">
            {!tips ? <Spinner /> : (
              <Grid
                dense
                rows={tips}
                rowKey={(r) => r.id}
                empty="No help tips yet."
                columns={[
                  { key: 'route', header: 'Screen', render: (r) => <span className="font-mono text-[12px]">{r.route}</span> },
                  { key: 'role', header: 'Shown to', render: (r) => r.role ?? 'everybody' },
                  { key: 'languageId', header: 'Language', render: (r) => languageName(r.languageId) },
                  { key: 'title', header: 'Title' },
                  { key: 'body', header: 'Tip', render: (r) => <span className="text-[12.5px]">{r.body}</span> },
                  {
                    key: 'material',
                    header: 'Training material',
                    render: (r) => (r.materialLink ? `${r.materialLink.reference ?? ''} (${r.materialLink.source.includes('document') ? 'document' : 'content page'})` : '-'),
                  },
                  { key: 'actions', header: '', render: (r) => <Button size="sm" variant="danger" onClick={() => remove(r.id)}>Delete</Button> },
                ]}
              />
            )}
          </Panel>
        </>
      )}

      {tab === 'tours' && (
        <>
          <Panel title="Add or edit a tour" subtitle="One tour per kind of user. It starts once, and can be skipped and replayed.">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="For">
                <Select value={tour.role} onChange={(e) => setTour({ ...tour, role: e.target.value })}>
                  {['buyer', 'seller', 'staff'].map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
              <Field label="Name" required><Input value={tour.name} onChange={(e) => setTour({ ...tour, name: e.target.value })} placeholder="Your first order" /></Field>
            </div>
            <Field label="Steps" hint="one per line: the element, then a vertical bar, then the text">
              <Textarea rows={4} value={tour.steps} onChange={(e) => setTour({ ...tour, steps: e.target.value })} placeholder={'#search | Search for what you need.\n#cart | Your cart keeps items from several sellers.'} />
            </Field>
            <div className="mt-3"><Button variant="primary" onClick={saveTour} disabled={!tour.name || !tour.steps}>Save</Button></div>
          </Panel>
          <Panel bodyClass="p-0">
            {!tours ? <Spinner /> : (
              <Grid
                rows={tours}
                rowKey={(r) => r.id}
                empty="No tours yet."
                columns={[
                  { key: 'role', header: 'For' },
                  { key: 'name', header: 'Name' },
                  { key: 'steps', header: 'Steps', align: 'right', render: (r) => (r.steps ?? []).length },
                  { key: 'languageId', header: 'Language', render: (r) => languageName(r.languageId) },
                  { key: 'active', header: 'Active', render: (r) => <Badge tone={r.active ? 'green' : 'slate'}>{r.active ? 'Yes' : 'No'}</Badge> },
                ]}
              />
            )}
          </Panel>
        </>
      )}
    </AdminPage>
  );
}

/* ======================================================= countries and regions ========= */

export function AdminCountries() {
  const [countries, setCountries] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [csv, setCsv] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => { api.get('/platform/countries').then(setCountries).catch(() => setCountries([])); }, []);
  useEffect(() => {
    if (!selected) return;
    api.get(`/platform/address-form?countryId=${selected}`).then(setForm).catch(() => {});
  }, [selected]);

  const importCsv = async () => {
    try {
      const r = await api.post(`/platform/countries/${selected}/import-states`, { csv, fileName: 'regions.csv' });
      setNotice(r.ok === false
        ? { tone: 'error', text: r.message ?? 'The file was not accepted.' }
        : { tone: 'success', text: `${r.imported} regions imported for ${r.country}.` });
      setCsv('');
      api.get(`/platform/address-form?countryId=${selected}`).then(setForm).catch(() => {});
    } catch (err) { setNotice({ tone: 'error', text: err.message }); }
  };

  return (
    <AdminPage
      title="Countries"
      breadcrumb={crumb('Configuration', { label: 'Countries' })}
      intro="The countries addresses may be entered for, and the regions or districts each one offers."
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Panel bodyClass="p-0" subtitle={countries ? `${countries.length} countries` : undefined}>
        {!countries ? <Spinner /> : (
          <Grid
            dense
            rows={countries}
            rowKey={(c) => c.id}
            onRowClick={(c) => setSelected(c.id)}
            columns={[
              { key: 'name', header: 'Country' },
              { key: 'twoLetterIsoCode', header: 'Code', render: (c) => <span className="font-mono text-[12px]">{c.twoLetterIsoCode}</span> },
              { key: 'published', header: 'Published', render: (c) => <Badge tone={c.published === false ? 'slate' : 'green'}>{c.published === false ? 'No' : 'Yes'}</Badge> },
              { key: 'allowsBilling', header: 'Billing', render: (c) => (c.allowsBilling === false ? 'No' : 'Yes') },
              { key: 'allowsShipping', header: 'Delivery', render: (c) => (c.allowsShipping === false ? 'No' : 'Yes') },
              { key: 'open', header: '', render: (c) => <Button size="sm" onClick={() => setSelected(c.id)}>Regions</Button> },
            ]}
          />
        )}
      </Panel>
      {selected && (
        <Panel
          title={`Regions of ${countries?.find((c) => c.id === Number(selected))?.name ?? ''}`}
          subtitle="An address form offers these to a shopper who chooses this country."
        >
          <Grid
            dense
            rows={form?.regions ?? []}
            rowKey={(r) => r.id}
            empty="No regions have been imported for this country."
            columns={[
              { key: 'name', header: 'Region or district' },
              { key: 'abbreviation', header: 'Abbreviation', render: (r) => r.abbreviation ?? '-' },
            ]}
          />
          <div className="mt-4">
            <Field label="Import regions" hint="one per line: name, abbreviation, order">
              <Textarea rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'Name,Abbreviation,DisplayOrder\nCentral Region,CR,1'} />
            </Field>
            <div className="mt-2"><Button variant="primary" onClick={importCsv} disabled={!csv.trim()}>Import</Button></div>
          </div>
        </Panel>
      )}
    </AdminPage>
  );
}
