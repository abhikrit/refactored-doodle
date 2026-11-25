// PRD-ADM-001 Administration console.
//
// SCR-ADM-01  Native admin areas: settings, plugins, widgets, schedule tasks, log, maintenance,
//             products (bulk edit), customers                                        [Native]
// SCR-ADM-02  Product extension register and start-up check                          [New]
//
// Every screen here is a native nopCommerce admin page in the real build; the register is the
// one new screen the feature adds.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import { moduleName } from './adm-config.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Checkbox, Field, Grid, Input, KeyValue, Panel,
  SearchPanel, Select, Spinner, StatTile, Tabs,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, ...items]} />;

/** The access gate every area in this feature sits behind (AC-ADM-001-01-01). */
function Denied({ result }) {
  return (
    <Alert tone="error" title="Access denied">
      {result.message}
</Alert>
  );
}

function useArea(areaId) {
  const [gate, setGate] = useState(null);
  const { customer } = useProduct();
  useEffect(() => {
    setGate(null);
    fetch(`/api/admin-console/console/areas/${areaId}`, { headers: { 'x-session': localStorage.getItem('nop-prototype-session') ?? 'default' } })
      .then((r) => r.json()).then(setGate).catch(() => setGate({ ok: false, message: 'could not check the permission' }));
  }, [areaId, customer?.email]);
  return gate;
}

/* ------------------------------------------------------- the console itself -- */

export function AdminConsole() {
  const [data, setData] = useState(null);
  const { customer } = useProduct();
  useEffect(() => { api.get('/admin-console/console').then(setData).catch(() => {}); }, [customer?.email]);

  return (
    <AdminPage
      title="Administration console"
      breadcrumb={crumb({ label: 'Administration console' })}
      intro="One back office for settings, add-ons, page widgets, scheduled jobs, system logs, maintenance, products and customers."
    >
      {!data ? <Spinner /> : (
        <>
          {!data.canOpenAdmin && (
            <Alert tone="error" title="Access denied">
              This account does not have access to the administration area.
            </Alert>
          )}

          <Panel title="Areas of the console" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'group', header: 'Group' },
                { key: 'name', header: 'Area', render: (a) => (a.granted ? <Link to={a.route} className="text-nop-blue hover:underline">{a.name}</Link> : <span className="text-nop-muted">{a.name}</span>) },
                { key: 'permission', header: 'Permission required', render: (a) => <span className="font-mono text-[12px]">{a.permission}</span> },
                {
                  key: 'granted',
                  header: 'This user',
                  render: (a) => (a.granted
                    ? <Badge tone="green">opens</Badge>
                    : <Badge tone="red">no access</Badge>),
                },
              ]}
              rows={data.areas}
              rowKey={(a) => a.id}
            />
          </Panel>
</>
      )}
    </AdminPage>
  );
}

/* ---------------------------------------------------------- schedule tasks -- */

export function ScheduleTasks() {
  const gate = useArea('system-schedule-tasks');
  const [rows, setRows] = useState(null);
  const [notice, setNotice] = useState(null);
  const load = () => api.get('/admin-console/schedule-tasks').then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async (task, patch) => {
    const res = await api.patch(`/admin-console/schedule-tasks/${task.id}`, patch);
    setNotice(res.message ?? `${task.name} saved.`);
    load();
  };
  const run = async (task, fail) => {
    const res = await api.post(`/admin-console/schedule-tasks/${task.id}/run`, { fail });
    setNotice(res.message ?? `${task.name} ran.`);
    load();
  };

  return (
    <AdminPage
      title="Schedule tasks"
      breadcrumb={crumb({ label: 'System' }, { label: 'Schedule tasks' })}
      intro="Scheduled jobs run for the whole installation, not per store. Change the interval, switch one off, or run one now."
    >
      {gate && !gate.ok ? <Denied result={gate} /> : (
        <>
          {notice && <Alert tone="success">{notice}</Alert>}
          <Panel bodyClass="p-0">
            {!rows ? <Spinner /> : (
              <Grid
                columns={[
                  { key: 'name', header: 'Name', render: (t) => <span className="font-medium">{t.name}</span> },
                  { key: 'type', header: 'Type', render: (t) => <span className="font-mono text-[11.5px] text-nop-muted">{t.type}</span> },
                  {
                    key: 'seconds',
                    header: 'Seconds',
                    render: (t) => (
                      <Input
                        type="number"
                        defaultValue={t.seconds}
                        className="w-24"
                        onBlur={(e) => Number(e.target.value) !== t.seconds && save(t, { seconds: Number(e.target.value) })}
                        aria-label={`Interval for ${t.name}`}
                      />
                    ),
                  },
                  { key: 'enabled', header: 'Enabled', render: (t) => <Checkbox label="" checked={t.enabled} onChange={(e) => save(t, { enabled: e.target.checked })} /> },
                  { key: 'stopOnError', header: 'Stop on error', render: (t) => <Checkbox label="" checked={t.stopOnError} onChange={(e) => save(t, { stopOnError: e.target.checked })} /> },
                  { key: 'lastStartUtc', header: 'Last start', render: (t) => (t.lastStartUtc ? new Date(t.lastStartUtc).toLocaleTimeString('en-GB') : '-') },
                  { key: 'lastEndUtc', header: 'Last end', render: (t) => (t.lastEndUtc ? new Date(t.lastEndUtc).toLocaleTimeString('en-GB') : '-') },
                  { key: 'lastSuccessUtc', header: 'Last success', render: (t) => (t.lastSuccessUtc ? <span className="text-emerald-700">{new Date(t.lastSuccessUtc).toLocaleTimeString('en-GB')}</span> : <span className="text-nop-muted">-</span>) },
                  {
                    key: 'run',
                    header: '',
                    align: 'right',
                    render: (t) => (
                      <span className="whitespace-nowrap">
                        <Button size="sm" variant="primary" onClick={() => run(t, false)}>Run now</Button>
                        <Button size="sm" className="ml-1.5" onClick={() => run(t, true)} title="Run it and let it fail, to see Stop on error">Run, fail</Button>
                      </span>
                    ),
                  },
                ]}
                rows={rows}
                rowKey={(t) => t.id}
              />
            )}
          </Panel>
</>
      )}
    </AdminPage>
  );
}

/* ------------------------------------------------------------- log, widgets -- */

export function SystemLog() {
  const gate = useArea('system-log');
  const [rows, setRows] = useState(null);
  const [level, setLevel] = useState('');
  useEffect(() => { api.get(`/admin-console/log${level ? `?level=${level}` : ''}`).then(setRows).catch(() => {}); }, [level]);
  return (
    <AdminPage title="Log" breadcrumb={crumb({ label: 'System' }, { label: 'Log' })} intro="The native system log. Cleared from System > Maintenance.">
      {gate && !gate.ok ? <Denied result={gate} /> : (
        <>
          <SearchPanel onClear={() => setLevel('')}>
            <Field label="Log level">
              <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">All</option>
                {['Information', 'Warning', 'Error'].map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
          </SearchPanel>
          <Panel bodyClass="p-0">
            {!rows ? <Spinner /> : (
              <Grid
                dense
                columns={[
                  { key: 'logLevel', header: 'Level', render: (l) => <Badge tone={l.logLevel === 'Error' ? 'red' : l.logLevel === 'Warning' ? 'amber' : 'slate'}>{l.logLevel}</Badge> },
                  { key: 'shortMessage', header: 'Message' },
                  { key: 'fullMessage', header: 'Full message' },
                  { key: 'createdOnUtc', header: 'Created', render: (l) => new Date(l.createdOnUtc).toLocaleString('en-GB') },
                ]}
                rows={rows}
                rowKey={(l) => l.id}
                empty="The log is empty."
              />
            )}
          </Panel>
        </>
      )}
    </AdminPage>
  );
}

export function Maintenance() {
  const gate = useArea('system-maintenance');
  const [notice, setNotice] = useState(null);
  return (
    <AdminPage title="Maintenance" breadcrumb={crumb({ label: 'System' }, { label: 'Maintenance' })} intro="The native maintenance actions.">
      {gate && !gate.ok ? <Denied result={gate} /> : (
        <>
          {notice && <Alert tone="success">{notice}</Alert>}
          <Panel title="Delete log entries">
            <p className="text-[13px] text-nop-muted mb-3">Clears the system log. The action is recorded in the audit trail.</p>
            <Button
              variant="danger"
              onClick={async () => {
                const res = await api.post('/admin-console/maintenance/clear-log');
                setNotice(res.message ?? `${res.cleared} log entries deleted.`);
              }}
            >
              Delete all log entries
            </Button>
          </Panel>
          <Panel title="Other maintenance actions">
            <Alert tone="info" title="Not available on this installation">
              Delete abandoned carts, delete guests, re-index, backup and restore need the database
              layer, which this installation does not run.
            </Alert>
          </Panel>
        </>
      )}
    </AdminPage>
  );
}

export function Widgets() {
  const gate = useArea('configuration-widgets');
  const [rows, setRows] = useState(null);
  const load = () => api.get('/admin-console/widgets').then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <AdminPage title="Widgets" breadcrumb={crumb({ label: 'Configuration' }, { label: 'Widgets' })} intro="Page widgets and the zones they render in.">
      {gate && !gate.ok ? <Denied result={gate} /> : (
        <Panel bodyClass="p-0">
          {!rows ? <Spinner /> : (
            <Grid
              columns={[
                { key: 'friendlyName', header: 'Widget' },
                { key: 'systemName', header: 'System name', render: (w) => <span className="font-mono text-[12px]">{w.systemName}</span> },
                { key: 'widgetZones', header: 'Widget zones', render: (w) => <span className="font-mono text-[11.5px]">{w.widgetZones.join(', ')}</span> },
                { key: 'feature', header: 'Added by', render: (w) => (w.feature ? moduleName(w.feature) : <span className="text-nop-muted">native</span>) },
                { key: 'displayOrder', header: 'Order', align: 'right' },
                {
                  key: 'isActive',
                  header: 'Active',
                  render: (w) => (
                    <Checkbox
                      label=""
                      checked={w.isActive}
                      onChange={async (e) => { await api.patch(`/admin-console/widgets/${w.id}`, { isActive: e.target.checked }); load(); }}
                    />
                  ),
                },
              ]}
              rows={rows}
              rowKey={(w) => w.id}
            />
          )}
        </Panel>
      )}
    </AdminPage>
  );
}

/* ------------------------------------------------------------- bulk edit ---- */

export function BulkEdit() {
  const gate = useArea('catalog-products');
  const [products, setProducts] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [edits, setEdits] = useState({});
  const [notice, setNotice] = useState(null);
  const { content } = useProduct();

  const load = () => api.get('/catalogue/products').then(setProducts).catch(() => {});
  useEffect(() => { load(); setSelected(new Set()); setEdits({}); }, [content?.clientName]);

  const toggle = (id) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const edit = (id, field, value) => setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));

  const save = async () => {
    const changes = [...selected].map((id) => ({ id, ...(edits[id] ?? {}) })).filter((c) => Object.keys(c).length > 1);
    if (changes.length === 0) { setNotice('Nothing to save: change a field on a selected product first.'); return; }
    const res = await api.post('/admin-console/bulk-edit', { changes });
    setNotice(`${res.saved} product${res.saved === 1 ? '' : 's'} updated in one save.`);
    setEdits({});
    load();
  };
  const archive = async () => {
    const res = await api.post('/admin-console/bulk-archive', { ids: [...selected] });
    setNotice(`${res.archived} archived: unpublished and gone from the storefront, still here in admin.`);
    setSelected(new Set());
    load();
  };
  const remove = async () => {
    const res = await api.post('/admin-console/bulk-delete', { ids: [...selected] });
    setNotice(`${res.deleted} deleted (soft delete, Product.Deleted) — a separate action from archive.`);
    setSelected(new Set());
    load();
  };

  return (
    <AdminPage
      title="Bulk edit products"
      breadcrumb={crumb({ label: 'Catalog' }, { label: 'Products', to: '/admin/catalog/products' }, { label: 'Bulk edit' })}
      intro="Change the name, SKU, price, old price, quantity or published state of many products and save them all at once. Archive takes products off the storefront; delete is separate."
      actions={(
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={save} disabled={selected.size === 0}>Save ({selected.size})</Button>
          <Button variant="warning" onClick={archive} disabled={selected.size === 0}>Archive</Button>
          <Button variant="danger" onClick={remove} disabled={selected.size === 0}>Delete</Button>
        </div>
      )}
    >
      {gate && !gate.ok ? <Denied result={gate} /> : (
        <>
          {notice && <Alert tone="success">{notice}</Alert>}
          <Panel bodyClass="p-0">
            {!products ? <Spinner /> : (
              <Grid
                dense
                columns={[
                  { key: 'sel', header: '', width: 36, render: (p) => <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="size-4" aria-label={`Select ${p.name}`} /> },
                  { key: 'name', header: 'Name', render: (p) => <Input defaultValue={p.name} className="min-w-[16rem]" onChange={(e) => edit(p.id, 'name', e.target.value)} aria-label={`Name of ${p.name}`} /> },
                  { key: 'sku', header: 'SKU', render: (p) => <Input defaultValue={p.sku} className="w-40 font-mono text-[12px]" onChange={(e) => edit(p.id, 'sku', e.target.value)} aria-label={`SKU of ${p.name}`} /> },
                  { key: 'price', header: 'Price', render: (p) => <Input type="number" step="0.01" defaultValue={p.price} className="w-28" onChange={(e) => edit(p.id, 'price', Number(e.target.value))} aria-label={`Price of ${p.name}`} /> },
                  { key: 'oldPrice', header: 'Old price', render: (p) => <Input type="number" step="0.01" defaultValue={p.oldPrice} className="w-28" onChange={(e) => edit(p.id, 'oldPrice', Number(e.target.value))} aria-label={`Old price of ${p.name}`} /> },
                  { key: 'stockQuantity', header: 'Quantity', render: (p) => <Input type="number" defaultValue={p.stockQuantity} className="w-24" onChange={(e) => edit(p.id, 'stockQuantity', Number(e.target.value))} aria-label={`Quantity of ${p.name}`} /> },
                  { key: 'published', header: 'Published', render: (p) => <Checkbox label="" defaultChecked={p.published} onChange={(e) => edit(p.id, 'published', e.target.checked)} /> },
                ]}
                rows={products}
                rowKey={(p) => p.id}
              />
            )}
          </Panel>
</>
      )}
    </AdminPage>
  );
}

/* ------------------------------------------------- the extension register --- */

export function ExtensionRegister() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('register');
  const [sim, setSim] = useState(null);
  const { customer } = useProduct();

  const load = () => fetch('/api/admin-console/extension-register', { headers: { 'x-session': localStorage.getItem('nop-prototype-session') ?? 'default' } })
    .then((r) => r.json()).then(setData).catch(() => {});
  useEffect(() => { load(); }, [customer?.email]);

  if (!data) return <AdminPage title="Product extension register" breadcrumb={crumb({ label: 'System' }, { label: 'Extension register' })}><Spinner /></AdminPage>;
  if (data.ok === false) {
    return (
      <AdminPage title="Product extension register" breadcrumb={crumb({ label: 'System' }, { label: 'Extension register' })}>
        <Denied result={data} />
      </AdminPage>
    );
  }

  const check = data.startupCheck;
  // a conflict is live and fails the check; a refused attempt never took effect and is reported
  const conflicts = check.warnings.filter((w) => w.level === 'conflict');
  const refused = check.warnings.filter((w) => w.level === 'refused');
  const tabs = [
    { id: 'register', label: 'Register', count: data.entries.length },
    { id: 'check', label: 'Start-up check', count: check.warnings.length },
    { id: 'filters', label: 'Filter order', count: data.entries.filter((e) => e.mechanism === 'action filter').length },
  ];
  const byTarget = {};
  for (const e of data.entries.filter((x) => x.mechanism === 'action filter')) (byTarget[e.target] ||= []).push(e);

  return (
    <AdminPage
      title="Product extension register"
      breadcrumb={crumb({ label: 'System' }, { label: 'Extension register' })}
      intro="Every service the product replaces or extends, with the module that owns it, so two add-ons can never quietly replace the same thing."
      actions={<Button onClick={load}>Re-run the check</Button>}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Entries in the register" value={data.entries.length} tone="blue" />
        <StatTile label="Targets with an owner" value={check.targets} tone="slate" />
        <StatTile label="Start-up conflicts" value={conflicts.length} tone={check.ok ? 'green' : 'red'} />
        <StatTile label="Console areas gated" value={data.areas.length} tone="amber" />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="border border-t-0 border-nop-border bg-white">
        {tab === 'register' && (
          <Grid
            dense
            columns={[
              { key: 'mechanism', header: 'Mechanism', render: (e) => <Badge tone={e.mechanism === 'DI override' ? 'blue' : e.mechanism === 'action filter' ? 'purple' : 'slate'}>{e.mechanism}</Badge> },
              { key: 'target', header: 'Target (interface and method, or controller and action)', render: (e) => <span className="font-mono text-[12px]">{e.target}</span> },
              { key: 'owner', header: 'Owner', render: (e) => <span className="font-mono text-[12px]">{e.owner}</span> },
              { key: 'feature', header: 'Owned by', render: (e) => moduleName(e.feature) },
              {
                key: 'providers',
                header: 'Provider features',
                render: (e) => (e.providers.length
                  ? <span className="flex flex-wrap gap-1">{e.providers.map((p) => <Badge key={p.feature} tone="green" title={p.name}>{moduleName(p.feature)}</Badge>)}</span>
                  : <span className="text-nop-muted">—</span>),
              },
              { key: 'order', header: 'Order', align: 'right' },
              { key: 'note', header: 'Note' },
            ]}
            rows={data.entries}
            rowKey={(e, i) => `${e.target}-${e.feature}-${i}`}
          />
        )}

        {tab === 'check' && (
          <div className="p-3 space-y-3">
            {check.ok
              ? <Alert tone="success" title="No conflict">Every target in the register has exactly one owner, and no bundled plugin replaces a service the product owns.</Alert>
              : conflicts.map((w, i) => (
                <Alert key={i} tone="error" title={w.target}>
                  {w.message}
                </Alert>
              ))}
            {refused.length > 0 && (
              <Panel
                title="Attempts the host refused at start-up"
                subtitle="Recorded so that no attempt is invisible. Nothing was replaced, so the check still passes."
                bodyClass="p-3 space-y-2"
              >
                {refused.map((w, i) => (
                  <Alert key={i} tone="warning" title={w.target}>
                    {w.message}
                  </Alert>
                ))}
              </Panel>
            )}
            <Panel title="Bundled nopCommerce plugins that replace a service the product owns" bodyClass="p-0" subtitle="Install one and the check reports the conflict">
              <Grid
                dense
                columns={[
                  { key: 'systemName', header: 'Plugin', render: (p) => <span className="font-mono text-[12px]">{p.systemName}</span> },
                  { key: 'replaces', header: 'Replaces', render: (p) => <span className="font-mono text-[12px]">{p.replaces.join(', ')}</span> },
                  { key: 'installed', header: 'Installed', render: (p) => <Badge tone={p.installed ? 'red' : 'slate'}>{p.installed ? 'installed' : 'not installed'}</Badge> },
                  {
                    key: 'act',
                    header: '',
                    align: 'right',
                    render: (p) => (
                      <Button
                        size="sm"
                        variant={p.installed ? 'default' : 'danger'}
                        onClick={async () => {
                          await api.post('/admin-console/extension-register/simulate', { installPlugin: p.systemName, installed: !p.installed });
                          load();
                        }}
                      >
                        {p.installed ? 'Uninstall' : 'Install it and see'}
                      </Button>
                    ),
                  },
                ]}
                rows={data.bundledPlugins}
                rowKey={(p) => p.systemName}
              />
            </Panel>
</div>
        )}

        {tab === 'filters' && (
          <div className="p-3 space-y-3">
            {Object.entries(byTarget).map(([target, list]) => (
              <Panel key={target} title={target} bodyClass="p-3">
                <ol className="space-y-1.5">
                  {list.sort((a, b) => a.order - b.order).map((e) => (
                    <li key={e.feature} className="flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="font-mono text-[11.5px] text-nop-muted w-10">{e.order}</span>
                      <span className="text-[12px]">{moduleName(e.feature)}</span>
                      <span className="text-nop-muted">{e.note}</span>
                      {e.singleOwner && <Badge tone="amber">single owner — others supply a rule</Badge>}
                    </li>
                  ))}
                </ol>
                {list.some((e) => e.singleOwner) && list[0].providers.length > 0 && (
                  <div className="mt-2 pl-12 text-[12.5px]">
                    <span className="font-semibold">Rule providers: </span>
                    {list.find((e) => e.singleOwner).providers.map((p) => `${p.feature} (${p.name})`).join(' · ')}
                  </div>
                )}
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={async () => setSim({ target, result: await api.post('/admin-console/extension-register/simulate', { action: target }) })}
                >
                  Run the filters
                </Button>
                {sim?.target === target && (
                  <div className="mt-2">
                    <Alert tone={sim.result.ok ? 'success' : 'warning'}>
                      {sim.result.ok
                        ? `All ${sim.result.ran.length} filters allowed the action.`
                        : `Refused by ${sim.result.refusedBy}${sim.result.message ? `: ${sim.result.message}` : ''}. Filters that ran before it: ${sim.result.ran.map((x) => x.feature).join(', ')}.`}
                    </Alert>
                  </div>
                )}
              </Panel>
            ))}
</div>
        )}
      </div>
    </AdminPage>
  );
}

/* ------------------------------------------------------- customer actions --- */

export function CustomerActions({ customer: row, onDone }) {
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  if (!row) return null;
  const act = async (active) => {
    const res = await api.post('/admin-console/customers/active', { email: row.email, active, reason });
    setResult(res);
    if (res.ok) onDone?.();
  };
  const gdpr = async () => {
    const res = await api.post('/admin-console/customers/gdpr-delete', { email: row.email });
    setResult(res);
    if (res.ok) onDone?.();
  };
  return (
    <div className="space-y-2">
      {result && (
        <Alert tone={result.ok ? 'success' : 'error'}>
          {result.ok
            ? (result.customerId ? 'Deletion request processed: the account is anonymised and deleted.' : `${row.email} is now ${result.customer?.active ? 'active' : 'deactivated'}.`)
            : (result.message ?? 'Refused.')}
        </Alert>
      )}
      {row.active ? (
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Reason" required hint="The reason is recorded in the audit trail">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} className="w-72" placeholder="Why is this account being deactivated?" />
          </Field>
          <Button variant="warning" onClick={() => act(false)}>Deactivate</Button>
          <Button variant="danger" onClick={gdpr} title="Needs Customers.GDPRManage">Process deletion request</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="red">deactivated{row.deactivationReason ? ` — ${row.deactivationReason}` : ''}</Badge>
          <Button variant="success" onClick={() => act(true)}>Reactivate</Button>
        </div>
      )}
</div>
  );
}
