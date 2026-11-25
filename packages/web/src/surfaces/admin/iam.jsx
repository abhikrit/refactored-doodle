// Customers and access: the administration screens of the identity area.
// Native nopCommerce admin patterns only (section 11.1): the customer list and card are the
// native pages extended; sessions, authentication events, access governance, the privacy queue
// and the account pages are new admin pages in the same shell.

import { useEffect, useMemo, useState } from 'react';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Panel, Button, Badge, Breadcrumb, Grid, SearchPanel, Field, Input, Select, Tabs, useTabs,
  Alert, Spinner, KeyValue, StatTile,
} from '../../ui/nop/kit.jsx';
import { api, qs } from '../../lib/api.js';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, ...items]} />;

const useLoad = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setError(null);
    Promise.resolve(fn())
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return [data, () => setTick((t) => t + 1), error];
};

const when = (value) => (value ? new Date(value).toLocaleString() : '-');
const name = (c) => [c?.firstName, c?.lastName].filter(Boolean).join(' ') || '(no name)';

/* ===================================================================== Customers ======== */

export function AdminCustomers() {
  const [search, setSearch] = useState({
    email: '', name: '', phone: '', company: '', role: '',
  });
  const [applied, setApplied] = useState({});
  const [open, setOpen] = useState(null);
  const [list, reload, error] = useLoad(() => api.get(`/identity/users${qs(applied)}`), [JSON.stringify(applied)]);
  const [roles] = useLoad(() => api.get('/identity/roles'));

  return (
    <AdminPage
      title="Customers"
      breadcrumb={crumb({ label: 'Customers' }, { label: 'Customers' })}
      intro="Search the accounts of this store, open a record, change its details or sign in as the customer."
    >
      {error && <Alert tone="error" title="The list could not be loaded">{error}</Alert>}
      <SearchPanel
        onSearch={() => setApplied({ ...search })}
        onClear={() => {
          setSearch({
            email: '', name: '', phone: '', company: '', role: '',
          });
          setApplied({});
        }}
      >
        <Field label="E-mail"><Input value={search.email} onChange={(e) => setSearch({ ...search, email: e.target.value })} /></Field>
        <Field label="Name"><Input value={search.name} onChange={(e) => setSearch({ ...search, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={search.phone} onChange={(e) => setSearch({ ...search, phone: e.target.value })} /></Field>
        <Field label="Company"><Input value={search.company} onChange={(e) => setSearch({ ...search, company: e.target.value })} /></Field>
        <Field label="Customer role">
          <Select value={search.role} onChange={(e) => setSearch({ ...search, role: e.target.value })}>
            <option value="">All</option>
            {(roles ?? []).map((r) => <option key={r.systemName} value={r.systemName}>{r.name}</option>)}
          </Select>
        </Field>
      </SearchPanel>

      <Panel bodyClass="p-0" title={list ? `${list.total} customers` : 'Customers'}>
        {!list ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'email', header: 'E-mail', render: (c) => c.email ?? c.phone ?? '(mobile account)' },
              { key: 'name', header: 'Name', render: name },
              { key: 'phone', header: 'Phone', render: (c) => c.phone ?? '-' },
              { key: 'company', header: 'Company', render: (c) => c.company ?? '-' },
              {
                key: 'roles',
                header: 'Customer roles',
                render: (c) => <span className="flex flex-wrap gap-1">{(c.roles ?? []).map((r) => <Badge key={r} tone="slate">{r}</Badge>)}</span>,
              },
              { key: 'created', header: 'Registered', render: (c) => when(c.createdOnUtc) },
              { key: 'active', header: 'Active', render: (c) => <Badge tone={c.active ? 'green' : 'red'}>{c.active ? 'Yes' : 'No'}</Badge> },
              {
                key: 'edit',
                header: '',
                align: 'right',
                render: (c) => (
                  <Button size="sm" onClick={() => setOpen(open === (c.email ?? c.id) ? null : (c.email ?? c.id))}>
                    {open === (c.email ?? c.id) ? 'Close' : 'Edit'}
                  </Button>
                ),
              },
            ]}
            rows={list.customers}
            rowKey={(c) => c.email ?? c.id}
          />
        )}
      </Panel>

      {open && list && <CustomerCard customer={list.customers.find((c) => (c.email ?? c.id) === open)} onDone={reload} />}
    </AdminPage>
  );
}

function CustomerCard({ customer, onDone }) {
  const tabs = [
    { id: 'info', label: 'Customer info' },
    { id: 'activity', label: 'Account activity' },
    { id: 'orders', label: 'Orders' },
    { id: 'consent', label: 'Consent and privacy' },
  ];
  const [active, setActive] = useTabs(tabs, 'info');
  const [form, setForm] = useState({
    firstName: customer.firstName ?? '', lastName: customer.lastName ?? '', company: customer.company ?? '',
  });
  const [notice, setNotice] = useState(null);
  const [activity, reloadActivity] = useLoad(
    () => (active === 'activity' ? api.get(`/identity/account/activity${qs({ email: customer.email, forStaff: true })}`) : Promise.resolve(null)),
    [active, customer.email],
  );
  const [trail] = useLoad(
    () => (active === 'consent' ? api.get(`/identity/consent-trail${qs({ email: customer.email })}`) : Promise.resolve(null)),
    [active, customer.email],
  );
  const [orders] = useLoad(
    () => (active === 'orders' ? api.get(`/identity/users${qs({ email: customer.email })}`) : Promise.resolve(null)),
    [active, customer.email],
  );

  const run = async (fn, message) => {
    try {
      const result = await fn();
      if (result?.ok === false) setNotice({ tone: 'error', text: result.message ?? 'That could not be done.' });
      else setNotice({ tone: 'success', text: message });
      onDone?.();
      reloadActivity();
    } catch (e) { setNotice({ tone: 'error', text: e.message }); }
  };

  return (
    <Panel title={`Edit customer details — ${customer.email ?? customer.phone}`}>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Tabs tabs={tabs} active={active} onChange={setActive} />

      {active === 'info' && (
        <div className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name"><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
            <Field label="Last name"><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
            <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
            <Field label="Customer roles">
              <div className="flex flex-wrap gap-1 pt-2">{(customer.roles ?? []).map((r) => <Badge key={r} tone="slate">{r}</Badge>)}</div>
            </Field>
          </div>
          <KeyValue rows={[
            ['Active', customer.active ? 'Yes' : 'No'],
            ['Account state', customer.accountState ?? 'Active'],
            ['Registered', when(customer.createdOnUtc)],
            ['Last activity', when(customer.lastActivityUtc)],
            ['Outlet', customer.registeredAtOutlet ?? customer.outlet ?? '-'],
            ['Tax exempt', customer.isTaxExempt ? 'Yes' : 'No'],
            ['VAT number', customer.vatNumber ? `${customer.vatNumber} (${customer.vatNumberStatus ?? 'Unknown'})` : '-'],
          ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => run(() => api.post('/identity/users/edit', { email: customer.email, changes: form }), 'The customer has been updated.')}>Save</Button>
            {customer.active
              ? <Button onClick={() => run(() => api.post('/identity/users/active', { email: customer.email, active: false, reason: 'deactivated in admin' }), 'The account is deactivated and its sessions have ended.')}>Deactivate</Button>
              : <Button onClick={() => run(() => api.post('/identity/users/active', { email: customer.email, active: true }), 'The account is active again.')}>Activate</Button>}
            <Button onClick={() => run(() => api.post('/identity/users/impersonate', { customerEmail: customer.email }), 'You are now acting for this customer in the store.')}>Place order for customer</Button>
            <Button onClick={() => run(() => api.post('/identity/users/open', { email: customer.email, page: 'Customer edit' }), 'The record has been opened.')}>Record read access</Button>
          </div>
        </div>
      )}

      {active === 'activity' && (
        <div className="pt-4">
          {!activity ? <Spinner /> : (
            <Grid
              columns={[
                { key: 'at', header: 'When', render: (e) => when(e.at) },
                { key: 'kind', header: 'What', render: (e) => e.kind },
                { key: 'detail', header: 'Detail', render: (e) => e.fields?.join(', ') ?? e.method ?? e.page ?? e.channel ?? '-' },
                { key: 'outcome', header: 'Outcome', render: (e) => e.outcome ?? e.status ?? '-' },
                { key: 'ip', header: 'IP address', render: (e) => e.ipAddress ?? '-' },
                { key: 'by', header: 'By', render: (e) => e.by ?? '-' },
              ]}
              rows={activity.entries}
              rowKey={(e, i) => `${e.kind}-${i}`}
              empty="No activity in the look-back period."
            />
          )}
        </div>
      )}

      {active === 'orders' && (
        <div className="pt-4 text-[13px] text-nop-muted">
          {!orders ? <Spinner /> : 'Open the order list from Sales to see this customer\'s orders.'}
        </div>
      )}

      {active === 'consent' && (
        <div className="pt-4">
          {!trail ? <Spinner /> : trail.ok === false ? <Alert tone="warning">You do not have access to the consent trail.</Alert> : (
            <Grid
              columns={[
                { key: 'at', header: 'When', render: (e) => when(e.at) },
                { key: 'kind', header: 'Kind', render: (e) => e.kind },
                { key: 'what', header: 'Policy or consent', render: (e) => e.policySystemName ?? e.consent ?? '-' },
                { key: 'version', header: 'Version', render: (e) => e.versionNo ?? '-' },
                { key: 'decision', header: 'Decision', render: (e) => <Badge tone={String(e.decision).includes('Disagree') || e.decision === 'declined' ? 'red' : 'green'}>{e.decision}</Badge> },
                { key: 'channel', header: 'Channel', render: (e) => e.channel ?? '-' },
              ]}
              rows={trail.entries}
              rowKey={(e, i) => i}
              empty="Nothing has been recorded for this customer."
            />
          )}
        </div>
      )}
    </Panel>
  );
}

/* ============================================================= Sessions and security ==== */

export function AdminSecurity() {
  const tabs = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'events', label: 'Authentication events' },
    { id: 'flags', label: 'Suspicious logins' },
  ];
  const [active, setActive] = useTabs(tabs, 'sessions');
  return (
    <AdminPage
      title="Sessions and sign-in security"
      breadcrumb={crumb({ label: 'Customers' }, { label: 'Sessions and sign-in security' })}
      intro="Who is signed in, what happened at sign-in, and the logins that look wrong."
    >
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {active === 'sessions' && <SessionsTab />}
      {active === 'events' && <AuthEventsTab />}
      {active === 'flags' && <FlagsTab />}
    </AdminPage>
  );
}

function SessionsTab() {
  const [data, reload, error] = useLoad(() => api.get('/identity/sessions'));
  return (
    <Panel bodyClass="p-0" title="Open sessions">
      {error && <Alert tone="error">{error}</Alert>}
      {!data ? <Spinner /> : (
        <Grid
          columns={[
            { key: 'customer', header: 'Customer', render: (s) => s.email ?? s.customerId },
            { key: 'started', header: 'Started', render: (s) => when(s.startedOnUtc) },
            { key: 'last', header: 'Last request', render: (s) => when(s.lastRequestOnUtc) },
            { key: 'ip', header: 'IP address', render: (s) => s.ipAddress ?? '-' },
            { key: 'agent', header: 'Device', render: (s) => s.userAgent ?? '-' },
            { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'Active' ? 'green' : 'slate'}>{s.status}</Badge> },
            {
              key: 'act',
              header: '',
              align: 'right',
              render: (s) => (s.status === 'Active' ? (
                <Button size="sm" onClick={() => api.post(`/identity/sessions/${s.sessionId}/revoke`, { reason: 'ended by an administrator' }).then(reload)}>End session</Button>
              ) : null),
            },
          ]}
          rows={Array.isArray(data) ? data : (data.sessions ?? [])}
          rowKey={(s) => s.sessionId ?? s.id}
          empty="Nobody is signed in."
        />
      )}
    </Panel>
  );
}

function AuthEventsTab() {
  const [filter, setFilter] = useState({ customerId: '', ipAddress: '', outcome: '' });
  const [applied, setApplied] = useState({});
  const [data, , error] = useLoad(() => api.get(`/identity/auth-events${qs(applied)}`), [JSON.stringify(applied)]);
  const download = () => {
    const blob = new Blob([data.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'authentication-events.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <SearchPanel onSearch={() => setApplied({ ...filter })} onClear={() => { setFilter({ customerId: '', ipAddress: '', outcome: '' }); setApplied({}); }}>
        <Field label="Customer id"><Input value={filter.customerId} onChange={(e) => setFilter({ ...filter, customerId: e.target.value })} /></Field>
        <Field label="IP address"><Input value={filter.ipAddress} onChange={(e) => setFilter({ ...filter, ipAddress: e.target.value })} /></Field>
        <Field label="Outcome">
          <Select value={filter.outcome} onChange={(e) => setFilter({ ...filter, outcome: e.target.value })}>
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </Select>
        </Field>
      </SearchPanel>
      {error && <Alert tone="warning" title="Access denied">{error}</Alert>}
      <Panel
        bodyClass="p-0"
        title="Authentication events"
        subtitle="These records cannot be edited or deleted."
        actions={data?.csv ? <Button size="sm" onClick={download}>Export to CSV</Button> : null}
      >
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'at', header: 'When', render: (e) => when(e.createdOnUtc) },
              { key: 'who', header: 'Customer', render: (e) => e.identifierTried ?? e.customerId ?? '-' },
              { key: 'type', header: 'Event', render: (e) => e.type },
              { key: 'channel', header: 'Channel', render: (e) => e.channel },
              { key: 'outcome', header: 'Outcome', render: (e) => <Badge tone={e.outcome === 'success' ? 'green' : 'red'}>{e.outcome}</Badge> },
              { key: 'ip', header: 'IP address', render: (e) => e.ipAddress ?? '-' },
              { key: 'country', header: 'Country', render: (e) => e.countryIso ?? '-' },
            ]}
            rows={data.events ?? []}
            rowKey={(e) => e.id}
            empty="No events match the filter."
          />
        )}
      </Panel>
    </>
  );
}

function FlagsTab() {
  const [data, reload] = useLoad(() => api.get('/identity/suspicious-logins'));
  const [reason, setReason] = useState({});
  const decide = async (flag, decision) => {
    await api.post(`/identity/suspicious-logins/${flag.id}`, {
      decision, reason: reason[flag.id] ?? null, forceLogout: decision === 'confirm',
    });
    reload();
  };
  return (
    <>
      {data?.rules && (
        <Panel title="Detection rules">
          <KeyValue rows={[
            ['Failed sign-ins', data.rules.failedLogins?.enabled
              ? `More than ${data.rules.failedLogins.failures} failures in ${data.rules.failedLogins.windowMinutes} minutes`
              : 'Off'],
            ['Sign-in from a new country', data.rules.newCountry?.enabled
              ? `Not seen in the last ${data.rules.newCountry.lookBackDays} days${data.rules.newCountry.notifyCustomer ? ', customer is told' : ''}`
              : 'Off'],
          ]}
          />
        </Panel>
      )}
      <Panel bodyClass="p-0" title="Flags">
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'raised', header: 'Raised', render: (f) => when(f.raisedOnUtc) },
              { key: 'rule', header: 'Rule', render: (f) => (f.ruleId === 'failed-logins' ? 'Failed sign-ins' : 'New country') },
              { key: 'customer', header: 'Customer', render: (f) => f.customerId ?? '-' },
              { key: 'detail', header: 'Detail', render: (f) => f.detail },
              { key: 'status', header: 'Status', render: (f) => <Badge tone={f.status === 'Open' ? 'amber' : f.status === 'Confirmed' ? 'red' : 'slate'}>{f.status}</Badge> },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (f) => (f.status !== 'Open' ? <span className="text-[12px] text-nop-muted">{f.reason ?? f.decidedBy ?? ''}</span> : (
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <Input
                      placeholder="Reason (needed to dismiss)"
                      value={reason[f.id] ?? ''}
                      onChange={(e) => setReason({ ...reason, [f.id]: e.target.value })}
                      className="w-56"
                    />
                    <Button size="sm" variant="primary" onClick={() => decide(f, 'confirm')}>Confirm and sign out</Button>
                    <Button size="sm" onClick={() => decide(f, 'dismiss')}>Dismiss</Button>
                  </div>
                )),
              },
            ]}
            rows={data.flags ?? []}
            rowKey={(f) => f.id}
            empty="Nothing has been flagged."
          />
        )}
      </Panel>
    </>
  );
}

/* ============================================================ Access governance ========== */

export function AdminAccess() {
  const tabs = [
    { id: 'scopes', label: 'Scopes' },
    { id: 'delegations', label: 'Delegations' },
    { id: 'invitations', label: 'Invitations' },
    { id: 'reviews', label: 'Access reviews' },
    { id: 'report', label: 'Access report' },
  ];
  const [active, setActive] = useTabs(tabs, 'scopes');
  return (
    <AdminPage
      title="Access governance"
      breadcrumb={crumb({ label: 'Customers' }, { label: 'Access governance' })}
      intro="What each member of staff may reach, who stands in for whom, and the reviews that keep it current."
    >
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {active === 'scopes' && <SimpleList path="/identity/scopes" title="Scopes" columns={[
        ['customerEmail', 'Staff member'], ['dimension', 'Dimension'], ['value', 'Value'], ['grantedBy', 'Granted by'],
      ]}
      />}
      {active === 'delegations' && <SimpleList path="/identity/delegations" title="Delegations" columns={[
        ['fromEmail', 'From'], ['toEmail', 'To'], ['permission', 'Permission'], ['status', 'Status'], ['startsOnUtc', 'From date'], ['endsOnUtc', 'To date'],
      ]}
      />}
      {active === 'invitations' && <SimpleList path="/identity/invitations" title="Invitations" columns={[
        ['email', 'E-mail'], ['roleSystemName', 'Role'], ['status', 'Status'], ['expiresOnUtc', 'Expires'],
      ]}
      />}
      {active === 'reviews' && <SimpleList path="/identity/access-reviews" title="Access-review campaigns" columns={[
        ['name', 'Campaign'], ['status', 'Status'], ['dueOnUtc', 'Due'], ['reviewed', 'Reviewed'], ['revoked', 'Revoked'],
      ]}
      />}
      {active === 'report' && <AccessReport />}
    </AdminPage>
  );
}

function SimpleList({ path, title, columns }) {
  const [data, , error] = useLoad(() => api.get(path));
  const rows = useMemo(() => {
    if (!data) return null;
    if (Array.isArray(data)) return data;
    const key = Object.keys(data).find((k) => Array.isArray(data[k]));
    return key ? data[key] : [];
  }, [data]);
  return (
    <Panel bodyClass="p-0" title={title}>
      {error && <Alert tone="warning">{error}</Alert>}
      {!rows ? <Spinner /> : (
        <Grid
          columns={columns.map(([key, header]) => ({
            key,
            header,
            render: (r) => {
              const v = r[key];
              if (v === null || v === undefined || v === '') return '-';
              if (typeof v === 'boolean') return v ? 'Yes' : 'No';
              if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}T/.test(v)) return when(v);
              if (typeof v === 'object') return JSON.stringify(v);
              return String(v);
            },
          }))}
          rows={rows}
          rowKey={(r, i) => r.id ?? i}
          empty="Nothing here yet."
        />
      )}
    </Panel>
  );
}

function AccessReport() {
  const [data, , error] = useLoad(() => api.get('/identity/access-report'));
  return (
    <Panel bodyClass="p-0" title="Who can do what">
      {error && <Alert tone="warning">{error}</Alert>}
      {!data ? <Spinner /> : (
        <Grid
          columns={[
            { key: 'email', header: 'Staff member', render: (r) => r.email ?? '-' },
            { key: 'roles', header: 'Roles', render: (r) => (r.roles ?? []).join(', ') },
            { key: 'permissions', header: 'Permissions', render: (r) => (r.permissions ?? []).length },
            { key: 'scopes', header: 'Scopes', render: (r) => (r.scopes ?? []).map((s) => `${s.dimension}: ${s.value}`).join('; ') || '-' },
          ]}
          rows={data.rows ?? data.report ?? []}
          rowKey={(r, i) => r.email ?? i}
          empty="No staff accounts."
        />
      )}
    </Panel>
  );
}

/* ================================================================ Privacy =============== */

export function AdminPrivacy() {
  const tabs = [
    { id: 'queue', label: 'Requests' },
    { id: 'trail', label: 'Privacy trail' },
  ];
  const [active, setActive] = useTabs(tabs, 'queue');
  const [requests, reload] = useLoad(() => api.get('/identity/privacy/requests'));
  const [email, setEmail] = useState('');
  const [trail, setTrail] = useState(null);
  const [notice, setNotice] = useState(null);
  const [reason, setReason] = useState({});

  const decide = async (row, decision) => {
    try {
      const result = row.type === 'Correction'
        ? await api.post(`/identity/privacy/corrections/${row.id}/decide`, { decision, reason: reason[row.id] ?? null })
        : await api.post('/identity/privacy/deletion/run', { customerId: row.customerId, requestId: row.id });
      if (result?.ok === false) setNotice({ tone: 'error', text: result.message ?? 'That could not be done.' });
      else setNotice({ tone: 'success', text: 'The request has been updated.' });
      reload();
    } catch (e) { setNotice({ tone: 'error', text: e.message }); }
  };

  const open = (requests ?? []).filter((r) => ['Received', 'InProgress', 'Overdue'].includes(r.status));
  return (
    <AdminPage
      title="Privacy requests"
      breadcrumb={crumb({ label: 'Customers' }, { label: 'Privacy requests' })}
      intro="Correction and deletion requests from customers, with the date each one is due."
      actions={<Button size="sm" onClick={() => api.post('/identity/privacy/overdue-task').then(reload)}>Check due dates</Button>}
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Open requests" value={open.length} />
        <StatTile label="Overdue" value={open.filter((r) => r.status === 'Overdue').length} tone={open.some((r) => r.status === "Overdue") ? "red" : "blue"} />
        <StatTile label="Completed" value={(requests ?? []).filter((r) => r.status === 'Completed').length} />
      </div>
      <Tabs tabs={tabs} active={active} onChange={setActive} />

      {active === 'queue' && (
        <Panel bodyClass="p-0" title="Requests">
          {!requests ? <Spinner /> : (
            <Grid
              columns={[
                { key: 'created', header: 'Received', render: (r) => when(r.createdOnUtc) },
                { key: 'type', header: 'Type', render: (r) => r.type },
                { key: 'customer', header: 'Customer', render: (r) => r.customerId },
                { key: 'field', header: 'Field', render: (r) => r.field ?? 'the whole account' },
                { key: 'requested', header: 'Requested value', render: (r) => r.requestedValue ?? '-' },
                { key: 'due', header: 'Due', render: (r) => when(r.dueOnUtc) },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => <Badge tone={r.status === 'Completed' ? 'green' : r.status === 'Overdue' ? 'red' : r.status === 'Rejected' ? 'slate' : 'amber'}>{r.status}</Badge>,
                },
                {
                  key: 'act',
                  header: '',
                  align: 'right',
                  render: (r) => (['Received', 'InProgress', 'Overdue'].includes(r.status) ? (
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {r.type === 'Correction' && (
                        <Input
                          placeholder="Reason"
                          value={reason[r.id] ?? ''}
                          onChange={(e) => setReason({ ...reason, [r.id]: e.target.value })}
                          className="w-48"
                        />
                      )}
                      <Button size="sm" variant="primary" onClick={() => decide(r, 'approve')}>{r.type === 'Correction' ? 'Approve' : 'Run deletion'}</Button>
                      {r.type === 'Correction' && <Button size="sm" onClick={() => decide(r, 'reject')}>Reject</Button>}
                    </div>
                  ) : <span className="text-[12px] text-nop-muted">{r.reason ?? ''}</span>),
                },
              ]}
              rows={requests}
              rowKey={(r) => r.id}
              empty="No requests."
            />
          )}
        </Panel>
      )}

      {active === 'trail' && (
        <Panel title="Privacy trail of a customer">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Customer e-mail"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Button onClick={() => api.get(`/identity/privacy/trail${qs({ email })}`).then(setTrail).catch((e) => setNotice({ tone: 'error', text: e.message }))}>Show</Button>
          </div>
          {trail?.entries && (
            <div className="pt-4">
              <Grid
                columns={[
                  { key: 'at', header: 'When', render: (e) => when(e.at) },
                  { key: 'kind', header: 'What', render: (e) => e.kind },
                  { key: 'what', header: 'Detail', render: (e) => e.what },
                  { key: 'outcome', header: 'Outcome', render: (e) => e.outcome },
                  { key: 'due', header: 'Due', render: (e) => when(e.dueOnUtc) },
                ]}
                rows={trail.entries}
                rowKey={(e, i) => i}
                empty="Nothing recorded for that customer."
              />
            </div>
          )}
        </Panel>
      )}
    </AdminPage>
  );
}

/* ====================================================== Accounts: trade, companies, agents */

export function AdminAccounts() {
  const tabs = [
    { id: 'trade', label: 'Trade applications' },
    { id: 'companies', label: 'Companies' },
    { id: 'agents', label: 'Agents and outlets' },
    { id: 'verification', label: 'Identity verification' },
  ];
  const [active, setActive] = useTabs(tabs, 'trade');
  return (
    <AdminPage
      title="Business accounts"
      breadcrumb={crumb({ label: 'Customers' }, { label: 'Business accounts' })}
      intro="Trade-account applications, company accounts and their cost centres, the agents at each outlet, and identity checks waiting for a decision."
    >
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {active === 'trade' && <TradeTab />}
      {active === 'companies' && <CompaniesTab />}
      {active === 'agents' && <AgentsTab />}
      {active === 'verification' && <VerificationTab />}
    </AdminPage>
  );
}

function TradeTab() {
  const [rows, reload, error] = useLoad(() => api.get('/identity/trade-applications'));
  const [reason, setReason] = useState({});
  const [notice, setNotice] = useState(null);
  const decide = async (row, decision) => {
    try {
      const result = await api.post(`/identity/trade-applications/${row.id}/decide`, { decision, reason: reason[row.id] ?? null });
      setNotice(result?.ok === false
        ? { tone: 'error', text: result.message ?? 'That could not be done.' }
        : { tone: 'success', text: decision === 'approve' ? 'The trade account is approved.' : 'The applicant has been told.' });
      reload();
    } catch (e) { setNotice({ tone: 'error', text: e.message }); }
  };
  return (
    <>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel bodyClass="p-0" title="Applications">
        {!rows ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'created', header: 'Received', render: (r) => when(r.createdOnUtc) },
              { key: 'company', header: 'Company', render: (r) => r.companyName },
              { key: 'registration', header: 'Registration number', render: (r) => r.registrationNumber },
              { key: 'tax', header: 'Tax number', render: (r) => r.taxNumber },
              { key: 'documents', header: 'Documents', render: (r) => (r.downloadIds ?? []).length },
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge tone={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'amber'}>{r.status}</Badge>,
              },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (r) => (['Received', 'MoreInformation'].includes(r.status) ? (
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <Input placeholder="Reason" value={reason[r.id] ?? ''} onChange={(e) => setReason({ ...reason, [r.id]: e.target.value })} className="w-44" />
                    <Button size="sm" variant="primary" onClick={() => decide(r, 'approve')}>Approve</Button>
                    <Button size="sm" onClick={() => decide(r, 'more-information')}>Ask for more</Button>
                    <Button size="sm" onClick={() => decide(r, 'reject')}>Reject</Button>
                  </div>
                ) : <span className="text-[12px] text-nop-muted">{r.reason ?? ''}</span>),
              },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="No applications."
          />
        )}
      </Panel>
    </>
  );
}

function CompaniesTab() {
  const [companies, reload, error] = useLoad(() => api.get('/identity/companies'));
  const [centres] = useLoad(() => api.get('/identity/cost-centres'));
  const [open, setOpen] = useState(null);
  const [member, setMember] = useState({ email: '', companyRole: 'CompanyBuyer' });
  const [notice, setNotice] = useState(null);
  const [detail, reloadDetail] = useLoad(
    () => (open ? api.get(`/identity/companies/${open}`) : Promise.resolve(null)),
    [open],
  );
  const add = async () => {
    try {
      const result = await api.post(`/identity/companies/${open}/members`, member);
      setNotice(result?.ok === false ? { tone: 'error', text: result.message } : { tone: 'success', text: 'The member has been added.' });
      reloadDetail(); reload();
    } catch (e) { setNotice({ tone: 'error', text: e.message }); }
  };
  return (
    <>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel bodyClass="p-0" title="Companies">
        {!companies ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Company', render: (c) => c.name },
              { key: 'registration', header: 'Registration number', render: (c) => c.registrationNumber ?? '-' },
              { key: 'tax', header: 'Tax number', render: (c) => c.taxNumber ?? '-' },
              { key: 'status', header: 'Status', render: (c) => <Badge tone={c.status === 'Active' ? 'green' : 'slate'}>{c.status}</Badge> },
              {
                key: 'centres',
                header: 'Cost centres',
                render: (c) => (centres ?? []).filter((x) => x.companyId === c.id).length,
              },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (c) => <Button size="sm" onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Close' : 'Members'}</Button>,
              },
            ]}
            rows={companies}
            rowKey={(c) => c.id}
            empty="No company accounts."
          />
        )}
      </Panel>
      {open && (
        <Panel title={`Members — ${detail?.name ?? ''}`}>
          {!detail ? <Spinner /> : (
            <>
              <Grid
                columns={[
                  { key: 'email', header: 'Member', render: (m) => m.email },
                  { key: 'role', header: 'Company role', render: (m) => m.companyRole },
                  { key: 'added', header: 'Added', render: (m) => when(m.addedOnUtc) },
                  {
                    key: 'act',
                    header: '',
                    align: 'right',
                    render: (m) => (
                      <Button size="sm" onClick={() => api.del(`/identity/companies/${open}/members/${m.customerId}`).then(() => { reloadDetail(); reload(); })}>Remove</Button>
                    ),
                  },
                ]}
                rows={detail.members ?? []}
                rowKey={(m) => m.id}
                empty="This company has no members yet."
              />
              <div className="flex flex-wrap items-end gap-2 pt-4">
                <Field label="E-mail"><Input value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} /></Field>
                <Field label="Company role">
                  <Select value={member.companyRole} onChange={(e) => setMember({ ...member, companyRole: e.target.value })}>
                    <option value="CompanyBuyer">Buyer</option>
                    <option value="CompanyApprover">Approver</option>
                    <option value="CompanyAdministrator">Company administrator</option>
                  </Select>
                </Field>
                <Button variant="primary" onClick={add}>Add member</Button>
              </div>
              {(centres ?? []).filter((c) => c.companyId === open).length > 0 && (
                <div className="pt-6">
                  <h3 className="text-[14px] font-semibold text-nop-ink mb-2">Cost centres</h3>
                  <Grid
                    columns={[
                      { key: 'code', header: 'Code', render: (c) => c.code },
                      { key: 'name', header: 'Name', render: (c) => c.name },
                      { key: 'budget', header: 'Budget', render: (c) => c.budget.toLocaleString() },
                      { key: 'spent', header: 'Spent', render: (c) => Number(c.spent ?? 0).toLocaleString() },
                      { key: 'left', header: 'Remaining', render: (c) => (Number(c.budget) - Number(c.spent ?? 0)).toLocaleString() },
                      { key: 'period', header: 'Period', render: (c) => `${c.periodFrom ?? ''} – ${c.periodTo ?? ''}` },
                      { key: 'over', header: 'Over budget', render: (c) => (c.overBudgetAction === 'approval' ? 'Send for approval' : 'Refuse') },
                    ]}
                    rows={(centres ?? []).filter((c) => c.companyId === open)}
                    rowKey={(c) => c.id}
                  />
                </div>
              )}
            </>
          )}
        </Panel>
      )}
    </>
  );
}

function AgentsTab() {
  const [agents, reload, error] = useLoad(() => api.get('/identity/agents'));
  const [points] = useLoad(() => api.get('/logistics/pickup-points').catch(() => []));
  const [form, setForm] = useState({ email: '', pickupPointId: '' });
  const [feature] = useLoad(() => api.get('/identity/agents/assisted-service'));
  const [notice, setNotice] = useState(null);
  const [records] = useLoad(() => api.get('/identity/agents/records'));
  const assign = async () => {
    try {
      const result = await api.post('/identity/agents/outlet', { email: form.email, pickupPointId: Number(form.pickupPointId) });
      setNotice(result?.ok === false ? { tone: 'error', text: result.message } : { tone: 'success', text: 'The agent is assigned to that outlet.' });
      reload();
    } catch (e) { setNotice({ tone: 'error', text: e.message }); }
  };
  return (
    <>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      {feature && feature.enabled === false && (
        <Alert tone="warning" title="Assisted service is switched off">Agents cannot register customers or act for them while it is off.</Alert>
      )}
      <Panel bodyClass="p-0" title="Agents">
        {!agents ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'email', header: 'Agent', render: (a) => a.email },
              { key: 'name', header: 'Name', render: name },
              { key: 'outlet', header: 'Outlet', render: (a) => a.outlet ?? <Badge tone="amber">Not assigned</Badge> },
            ]}
            rows={agents}
            rowKey={(a) => a.email}
            empty="No agents."
          />
        )}
      </Panel>
      <Panel title="Assign an agent to an outlet">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Agent e-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Outlet">
            <Select value={form.pickupPointId} onChange={(e) => setForm({ ...form, pickupPointId: e.target.value })}>
              <option value="">Choose an outlet</option>
              {(Array.isArray(points) ? points : points?.pickupPoints ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Button variant="primary" onClick={assign}>Save</Button>
        </div>
      </Panel>
      <Panel bodyClass="p-0" title="Assisted service records">
        {!records ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'started', header: 'When', render: (r) => when(r.startedOnUtc) },
              { key: 'agent', header: 'Agent', render: (r) => r.agentEmail ?? r.agentId },
              { key: 'outlet', header: 'Outlet', render: (r) => r.outlet ?? '-' },
              { key: 'customer', header: 'Customer', render: (r) => r.customerId },
              { key: 'action', header: 'Action', render: (r) => (r.action === 'act' ? 'Acted for the customer' : 'Registered the customer') },
              { key: 'ended', header: 'Ended', render: (r) => when(r.endedOnUtc) },
            ]}
            rows={records}
            rowKey={(r) => r.id}
            empty="Nothing yet."
          />
        )}
      </Panel>
    </>
  );
}

function VerificationTab() {
  const [data, reload, error] = useLoad(() => api.get('/identity/verification'));
  const [reason, setReason] = useState({});
  const [notice, setNotice] = useState(null);
  const decide = async (row, decision) => {
    try {
      const result = await api.post(`/identity/verification/${row.id}/decide`, { decision, reason: reason[row.id] ?? null });
      setNotice(result?.ok === false ? { tone: 'error', text: result.message ?? 'Give a reason for the decision.' } : { tone: 'success', text: 'The case has been decided.' });
      reload();
    } catch (e) { setNotice({ tone: 'error', text: e.message }); }
  };
  return (
    <>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel bodyClass="p-0" title="Identity checks">
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'created', header: 'When', render: (c) => when(c.createdOnUtc) },
              { key: 'subject', header: 'Subject', render: (c) => `${c.subjectType} ${c.subjectId}` },
              { key: 'country', header: 'Country', render: (c) => c.country },
              { key: 'type', header: 'Identity type', render: (c) => c.identityType },
              { key: 'identifier', header: 'Number', render: (c) => c.identifier ?? '-' },
              { key: 'adapter', header: 'Checked with', render: (c) => c.adapterSystemName },
              {
                key: 'result',
                header: 'Result',
                render: (c) => <Badge tone={c.result === 'Verified' ? 'green' : c.result === 'NotVerified' ? 'red' : 'amber'}>{c.result}</Badge>,
              },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (c) => (c.result === 'ManualReview' ? (
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <Input placeholder="Reason" value={reason[c.id] ?? ''} onChange={(e) => setReason({ ...reason, [c.id]: e.target.value })} className="w-44" />
                    <Button size="sm" variant="primary" onClick={() => decide(c, 'Verified')}>Verified</Button>
                    <Button size="sm" onClick={() => decide(c, 'NotVerified')}>Not verified</Button>
                  </div>
                ) : <span className="text-[12px] text-nop-muted">{c.reason ?? ''}</span>),
              },
            ]}
            rows={data.cases ?? []}
            rowKey={(c) => c.id}
            empty="No identity checks."
          />
        )}
      </Panel>
      {data?.adapters && (
        <Panel title="Checks available">
          <Grid
            columns={[
              { key: 'systemName', header: 'Adapter', render: (a) => a.systemName },
              { key: 'country', header: 'Country', render: (a) => a.country },
              { key: 'types', header: 'Identity types', render: (a) => (a.identityTypes ?? []).join(', ') },
            ]}
            rows={data.adapters}
            rowKey={(a) => a.systemName}
          />
        </Panel>
      )}
    </>
  );
}
