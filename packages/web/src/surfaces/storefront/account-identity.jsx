// My account: the dashboard, preferences, privacy tools, account activity, company pages and the
// trade-account application. Native DefaultClean account pages extended, in the same two-column
// customer layout as the rest of My account.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, qs } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import {
  Alert, Badge, Button, Checkbox, Field, Grid, Input, KeyValue, Panel, Spinner, Select, Textarea,
  StatTile,
} from '../../ui/nop/kit.jsx';
import { AccountLayout } from './account.jsx';

const when = (v) => (v ? new Date(v).toLocaleString('en-GB') : '-');

function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.resolve(fn())
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return [data, () => setTick((t) => t + 1), error];
}

/* ======================================================================= Dashboard ====== */

export function AccountDashboard() {
  const [board] = useAsync(() => api.get('/identity/my/dashboard'));
  const [actions] = useAsync(() => api.get('/identity/my/quick-actions'));
  const [months, setMonths] = useState(6);
  const [figures] = useAsync(() => api.get(`/identity/my/figures${qs({ months })}`), [months]);
  return (
    <AccountLayout title="My dashboard">
      {actions?.actions && (
        <Panel title="Quick actions">
          <div className="flex flex-wrap gap-2">
            {actions.actions.map((a) => <Button key={a.code} as="link" to={a.target}>{a.name}</Button>)}
          </div>
        </Panel>
      )}
      {!board ? <Spinner /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Open orders" value={board.openOrders.length} />
            <StatTile label="Open quotes" value={board.openQuotes.length} />
            <StatTile label="Waiting for you" value={board.waitingForYou.length} tone={board.waitingForYou.length ? 'amber' : 'blue'} />
          </div>

          <Panel title="Waiting for you" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'what', header: 'What', render: (w) => w.what },
                { key: 'reference', header: 'Reference', render: (w) => w.reference },
                { key: 'since', header: 'Since', render: (w) => when(w.since) },
                {
                  key: 'act',
                  header: '',
                  align: 'right',
                  render: (w) => <Link to={w.target} className="brand-text hover:underline text-[13px]">Open</Link>,
                },
              ]}
              rows={board.waitingForYou}
              rowKey={(w, i) => i}
              empty="Nothing needs your attention."
            />
          </Panel>

          <Panel title="Open orders" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'orderNumber', header: 'Order', render: (o) => <Link to={`/account/orders/${o.orderNumber}`} className="font-mono brand-text hover:underline">{o.orderNumber}</Link> },
                { key: 'date', header: 'Date', render: (o) => when(o.createdOnUtc) },
                { key: 'status', header: 'Status', render: (o) => <Badge tone="slate">{o.orderStatus}</Badge> },
                { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.orderTotal, o.currency ?? 'MWK') },
              ]}
              rows={board.openOrders}
              rowKey={(o) => o.orderNumber}
              empty="You have no open orders."
            />
          </Panel>

          <Panel
            title="Orders and spending"
            actions={(
              <Select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-36">
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </Select>
            )}
            bodyClass="p-0"
          >
            {!figures ? <Spinner /> : (
              <Grid
                columns={[
                  { key: 'month', header: 'Month', render: (m) => m.month },
                  { key: 'orders', header: 'Orders', align: 'right', render: (m) => m.orders },
                  { key: 'spending', header: 'Spending', align: 'right', render: (m) => money(m.spending, 'MWK') },
                ]}
                rows={figures.byMonth}
                rowKey={(m) => m.month}
                footer={<tr className="font-semibold"><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right">{figures.totalOrders}</td><td className="px-3 py-2 text-right">{money(figures.totalSpending, 'MWK')}</td></tr>}
              />
            )}
          </Panel>

          <Panel title="Latest messages" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'at', header: 'When', render: (m) => when(m.at) },
                { key: 'subject', header: 'Message', render: (m) => m.subject ?? m.event },
                { key: 'channel', header: 'Sent by', render: (m) => m.channel },
              ]}
              rows={board.latestMessages}
              rowKey={(m, i) => i}
              empty="No messages yet."
            />
          </Panel>
        </>
      )}
    </AccountLayout>
  );
}

/* ================================================================= Quotes and returns === */

export function AccountHistory() {
  const [filter, setFilter] = useState({ type: '', status: '', from: '' });
  const [applied, setApplied] = useState({});
  const [history] = useAsync(() => api.get(`/identity/my/history${qs(applied)}`), [JSON.stringify(applied)]);
  const [quotes] = useAsync(() => api.get('/identity/my/quotes'));
  const [returns] = useAsync(() => api.get('/identity/my/return-requests'));
  const [notice, setNotice] = useState(null);

  const exportFile = async (format) => {
    try {
      const result = await api.get(`/identity/my/history/export${qs({ ...applied, format })}`);
      if (result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = result.file.name; a.click();
        URL.revokeObjectURL(url);
      } else setNotice(`${result.file.name} is ready (${result.rowCount} rows).`);
    } catch (e) { setNotice(e.message); }
  };

  return (
    <AccountLayout title="Quotes and returns">
      {notice && <Alert tone="info">{notice}</Alert>}
      {quotes?.offered === false && <Alert tone="info">Quotes are not offered on this store.</Alert>}

      {quotes?.offered && (
        <Panel title="My quotes" bodyClass="p-0">
          <Grid
            columns={[
              { key: 'quoteNumber', header: 'Quote', render: (q) => q.quoteNumber },
              { key: 'date', header: 'Date', render: (q) => when(q.createdOnUtc) },
              { key: 'status', header: 'Status', render: (q) => <Badge tone={q.status === 'AwaitingCustomer' ? 'amber' : 'slate'}>{q.status}</Badge> },
              { key: 'total', header: 'Total', align: 'right', render: (q) => money(q.total, 'MWK') },
              {
                key: 'pdf',
                header: '',
                align: 'right',
                render: (q) => (
                  <Button
                    size="sm"
                    onClick={() => api.get(`/identity/my/quotes/${q.quoteNumber}/pdf`).then((r) => setNotice(r.ok ? `${r.file.name} downloaded.` : r.message))}
                  >
                    PDF
                  </Button>
                ),
              },
            ]}
            rows={quotes.quotes}
            rowKey={(q) => q.quoteNumber}
            empty="You have no quotes."
          />
        </Panel>
      )}

      <Panel title="Return requests" bodyClass="p-0">
        <Grid
          columns={[
            { key: 'order', header: 'Order', render: (r) => r.orderNumber },
            { key: 'date', header: 'Date', render: (r) => when(r.createdOnUtc) },
            { key: 'reason', header: 'Reason', render: (r) => r.reason ?? '-' },
            { key: 'status', header: 'Status', render: (r) => <Badge tone="slate">{r.status}</Badge> },
          ]}
          rows={returns?.returnRequests ?? []}
          rowKey={(r) => r.id}
          empty="You have not asked to return anything."
        />
      </Panel>

      <Panel
        title="All activity"
        actions={(
          <div className="flex gap-2">
            <Button size="sm" onClick={() => exportFile('csv')}>Export CSV</Button>
            <Button size="sm" onClick={() => exportFile('xlsx')}>Export Excel</Button>
          </div>
        )}
      >
        <div className="flex flex-wrap items-end gap-2 pb-3">
          <Field label="Type">
            <Select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">All</option>
              <option value="Order">Orders</option>
              <option value="Quote">Quotes</option>
              <option value="Return">Returns</option>
            </Select>
          </Field>
          <Field label="Status"><Input value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} /></Field>
          <Field label="From"><Input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} /></Field>
          <Button onClick={() => setApplied({ ...filter })}>Search</Button>
        </div>
        {!history ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'type', header: 'Type', render: (r) => r.type },
              { key: 'reference', header: 'Reference', render: (r) => r.reference },
              { key: 'date', header: 'Date', render: (r) => when(r.date) },
              { key: 'status', header: 'Status', render: (r) => r.status },
              { key: 'value', header: 'Value', align: 'right', render: (r) => (r.value ? money(r.value, 'MWK') : '-') },
            ]}
            rows={history.rows}
            rowKey={(r, i) => `${r.type}-${r.reference}-${i}`}
            empty="Nothing matches."
          />
        )}
      </Panel>
    </AccountLayout>
  );
}

/* ===================================================================== Preferences ====== */

export function AccountPreferences() {
  const [prefs, reload] = useAsync(() => api.get('/identity/preferences'));
  const [points] = useAsync(() => api.get('/logistics/pickup-points').catch(() => []));
  const [notice, setNotice] = useState(null);
  const save = async (fn) => {
    try {
      const result = await fn();
      setNotice(result?.ok === false ? result.message : 'Your preferences have been saved.');
      reload();
    } catch (e) { setNotice(e.message); }
  };
  return (
    <AccountLayout title="Delivery and notices">
      {notice && <Alert tone="info">{notice}</Alert>}
      {prefs?.cleared && <Alert tone="warning">{prefs.cleared.message}</Alert>}
      {!prefs ? <Spinner /> : (
        <>
          <Panel title="Where you collect" subtitle="We will offer this pickup point first at checkout.">
            <Field label="Preferred pickup point">
              <Select
                value={prefs.preferredPickupPointId ?? ''}
                onChange={(e) => save(() => api.post('/identity/preferences/pickup-point', { pickupPointId: Number(e.target.value) }))}
              >
                <option value="">Choose a pickup point</option>
                {(Array.isArray(points) ? points : points?.pickupPoints ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.city ? ` — ${p.city}` : ''}</option>
                ))}
              </Select>
            </Field>
            {prefs.pickupPoint && (
              <KeyValue rows={[
                ['Pickup point', prefs.pickupPoint.name],
                ['Address', prefs.pickupPoint.city ?? '-'],
                ['Opening hours', prefs.pickupPoint.openingHours ?? '-'],
              ]}
              />
            )}
          </Panel>
          <Panel title="How we contact you" subtitle="We use this channel unless a particular notice has its own setting.">
            <Field label="Preferred channel">
              <Select
                value={prefs.preferredChannel ?? ''}
                onChange={(e) => save(() => api.post('/identity/preferences/channel', { channel: e.target.value }))}
              >
                <option value="">Choose a channel</option>
                {(prefs.channelsOffered ?? []).map((c) => <option key={c} value={c}>{c === 'inapp' ? 'In the store' : c}</option>)}
              </Select>
            </Field>
          </Panel>
        </>
      )}
    </AccountLayout>
  );
}

/* ======================================================================== Privacy ======= */

export function AccountPrivacy() {
  const navigate = useNavigate();
  const [consents, reloadConsents] = useAsync(() => api.get('/identity/consents'));
  const [cookies, reloadCookies] = useAsync(() => api.get('/identity/cookies'));
  const [requests, reloadRequests] = useAsync(() => api.get('/identity/privacy/requests'));
  const [correction, setCorrection] = useState({
    field: '', currentValue: '', requestedValue: '', reason: '',
  });
  const [confirm, setConfirm] = useState({ password: '' });
  const [notice, setNotice] = useState(null);

  const act = async (fn, message) => {
    try {
      const result = await fn();
      setNotice(result?.ok === false ? (result.message ?? 'That could not be done.') : (result?.message ?? message));
      reloadConsents(); reloadCookies(); reloadRequests();
      return result;
    } catch (e) { setNotice(e.message); return null; }
  };

  return (
    <AccountLayout title="Privacy">
      {notice && <Alert tone="info">{notice}</Alert>}

      <Panel title="Your choices" subtitle="You can change these at any time.">
        {!consents ? <Spinner /> : consents.map((c) => (
          <Checkbox
            key={c.systemName}
            label={c.message}
            checked={c.accepted}
            onChange={(e) => act(
              () => api.post('/identity/consents', { systemName: c.systemName, accepted: e.target.checked }),
              'Your choice has been saved.',
            )}
          />
        ))}
      </Panel>

      <Panel title="Cookies" subtitle="Strictly necessary cookies are always on. Your choice applies from the next page.">
        {!cookies ? <Spinner /> : cookies.categories.map((cat) => (
          <Checkbox
            key={cat.systemName}
            label={cat.name}
            hint={cat.alwaysOn ? 'Always on' : undefined}
            disabled={cat.alwaysOn}
            checked={cookies.accepted.includes(cat.systemName)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...cookies.accepted, cat.systemName]
                : cookies.accepted.filter((x) => x !== cat.systemName);
              act(() => api.post('/identity/cookies', { accepted: next }), 'Your cookie choices have been saved.');
            }}
          />
        ))}
      </Panel>

      <Panel title="Get a copy of your data">
        <p className="text-[13px] text-nop-muted mb-3">We will prepare a file with the personal data this store holds about you.</p>
        <Button
          variant="brand"
          onClick={() => act(() => api.post('/identity/privacy/export'), 'Your data export is ready to download.')
            .then((r) => r?.files && setNotice(`Ready: ${r.files.map((f) => f.name).join(', ')}`))}
        >
          Export my data
        </Button>
      </Panel>

      <Panel title="Ask us to correct something">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What should change" required>
            <Select value={correction.field} onChange={(e) => setCorrection({ ...correction, field: e.target.value })}>
              <option value="">Choose</option>
              <option value="firstName">First name</option>
              <option value="lastName">Last name</option>
              <option value="phone">Phone number</option>
              <option value="company">Company</option>
            </Select>
          </Field>
          <Field label="What it says now"><Input value={correction.currentValue} onChange={(e) => setCorrection({ ...correction, currentValue: e.target.value })} /></Field>
          <Field label="What it should say" required><Input value={correction.requestedValue} onChange={(e) => setCorrection({ ...correction, requestedValue: e.target.value })} /></Field>
          <Field label="Why" required><Input value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} /></Field>
        </div>
        <div className="pt-3">
          <Button onClick={() => act(() => api.post('/identity/privacy/corrections', correction), 'We have your request.')}>Send the request</Button>
        </div>
      </Panel>

      <Panel title="My requests" bodyClass="p-0">
        <Grid
          columns={[
            { key: 'created', header: 'Sent', render: (r) => when(r.createdOnUtc) },
            { key: 'type', header: 'Request', render: (r) => (r.type === 'Correction' ? `Correct ${r.field}` : 'Delete my account') },
            { key: 'due', header: 'We will reply by', render: (r) => when(r.dueOnUtc) },
            { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Completed' ? 'green' : r.status === 'Rejected' ? 'red' : 'amber'}>{r.status}</Badge> },
            { key: 'reason', header: 'Note', render: (r) => r.reason ?? '-' },
          ]}
          rows={requests ?? []}
          rowKey={(r) => r.id}
          empty="You have not sent a request."
        />
      </Panel>

      <Panel title="Close my account" subtitle="Deactivating keeps your orders and stops marketing messages. You can come back at any time.">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Confirm with your password">
            <Input type="password" value={confirm.password} onChange={(e) => setConfirm({ password: e.target.value })} />
          </Field>
          <Button
            onClick={() => act(() => api.post('/identity/account/deactivate', { password: confirm.password }), 'Your account is deactivated.')
              .then((r) => { if (r?.ok) navigate('/login'); })}
          >
            Deactivate my account
          </Button>
          <Button onClick={() => act(() => api.post('/identity/privacy/deletion'), 'We have your deletion request.')}>Delete my account</Button>
        </div>
      </Panel>
    </AccountLayout>
  );
}

/* =============================================================== Account activity ======= */

export function AccountActivity() {
  const [page] = useAsync(() => api.get('/identity/account/activity'));
  return (
    <AccountLayout title="Account activity">
      <Panel
        bodyClass="p-0"
        title="What has happened on your account"
        subtitle={page ? `The last ${page.lookBackDays} days. Part of each IP address is hidden.` : undefined}
      >
        {!page ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'at', header: 'When', render: (e) => when(e.at) },
              { key: 'kind', header: 'What', render: (e) => e.kind },
              {
                key: 'detail',
                header: 'Detail',
                render: (e) => e.fields?.join(', ') ?? e.method ?? e.page ?? e.channel ?? '-',
              },
              { key: 'outcome', header: 'Result', render: (e) => e.outcome ?? e.status ?? '-' },
              { key: 'ip', header: 'From', render: (e) => e.ipAddress ?? '-' },
              { key: 'by', header: 'By', render: (e) => e.by ?? 'you' },
            ]}
            rows={page.entries}
            rowKey={(e, i) => i}
            empty="Nothing has happened in this period."
          />
        )}
      </Panel>
    </AccountLayout>
  );
}

/* ======================================================================= My company ===== */

export function AccountCompany() {
  const [company] = useAsync(() => api.get('/identity/companies/of-customer'));
  const [detail] = useAsync(
    () => (company?.hasCompany ? api.get(`/identity/companies/${company.companyId}`) : Promise.resolve(null)),
    [company?.companyId],
  );
  const [centres] = useAsync(
    () => (company?.hasCompany ? api.get(`/identity/cost-centres${qs({ companyId: company.companyId })}`) : Promise.resolve(null)),
    [company?.companyId],
  );
  const [orders] = useAsync(
    () => (company?.hasCompany ? api.get(`/identity/companies/${company.companyId}/orders`) : Promise.resolve(null)),
    [company?.companyId],
  );

  if (company && company.hasCompany === false) {
    return (
      <AccountLayout title="My company">
        <Panel>
          <p className="text-[13px] text-nop-muted">
            Your account is not part of a company.
            {' '}
            <Link to="/account/trade-application" className="brand-text hover:underline">Apply for a trade account</Link>
            {' '}
            to buy on behalf of your business.
          </p>
        </Panel>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout title="My company">
      {!company ? <Spinner /> : (
        <>
          <Panel title={company.companyName}>
            <KeyValue rows={[
              ['Status', company.companyStatus],
              ['Your role', company.companyRole === 'CompanyAdministrator' ? 'Company administrator'
                : company.companyRole === 'CompanyApprover' ? 'Approver' : 'Buyer'],
            ]}
            />
          </Panel>

          <Panel title="Members" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'email', header: 'Member', render: (m) => m.email },
                { key: 'role', header: 'Role', render: (m) => m.companyRole },
                { key: 'added', header: 'Added', render: (m) => when(m.addedOnUtc) },
              ]}
              rows={detail?.members ?? []}
              rowKey={(m) => m.id}
              empty="No members yet."
            />
          </Panel>

          <Panel title="Company addresses" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'address1', header: 'Address', render: (a) => a.address1 },
                { key: 'city', header: 'City', render: (a) => a.city },
                { key: 'country', header: 'Country', render: (a) => a.country },
              ]}
              rows={detail?.addresses ?? []}
              rowKey={(a, i) => i}
              empty="No shared addresses."
            />
          </Panel>

          <Panel title="Cost centres and budgets" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'code', header: 'Code', render: (c) => c.code },
                { key: 'name', header: 'Name', render: (c) => c.name },
                { key: 'budget', header: 'Budget', align: 'right', render: (c) => money(c.budget, 'MWK') },
                { key: 'spent', header: 'Spent', align: 'right', render: (c) => money(c.spent ?? 0, 'MWK') },
                {
                  key: 'left',
                  header: 'Remaining',
                  align: 'right',
                  render: (c) => <strong>{money(Number(c.budget) - Number(c.spent ?? 0), 'MWK')}</strong>,
                },
                { key: 'period', header: 'Period', render: (c) => `${c.periodFrom ?? ''} – ${c.periodTo ?? ''}` },
              ]}
              rows={centres ?? []}
              rowKey={(c) => c.id}
              empty="No cost centres."
            />
          </Panel>

          <Panel title="Company orders" bodyClass="p-0">
            <Grid
              columns={[
                { key: 'orderNumber', header: 'Order', render: (o) => o.orderNumber },
                { key: 'status', header: 'Status', render: (o) => o.orderStatus },
                { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.orderTotal, 'MWK') },
              ]}
              rows={orders?.orders ?? []}
              rowKey={(o) => o.orderNumber}
              empty="No orders for this company yet."
            />
          </Panel>
        </>
      )}
    </AccountLayout>
  );
}

/* ============================================================ Trade-account application = */

export function TradeApplication() {
  const [requirements] = useAsync(() => api.get('/identity/trade-applications/requirements'));
  const [mine, reload] = useAsync(() => api.get('/identity/trade-applications').catch(() => null));
  const [form, setForm] = useState({ companyName: '', registrationNumber: '', taxNumber: '' });
  const [files, setFiles] = useState([]);
  const [notice, setNotice] = useState(null);

  const pick = async (event) => {
    const chosen = [...(event.target.files ?? [])];
    const read = await Promise.all(chosen.map((f) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        fileName: f.name,
        contentType: f.type,
        base64: String(reader.result).split(',')[1] ?? '',
      });
      reader.readAsDataURL(f);
    })));
    setFiles(read);
  };

  const submit = async () => {
    try {
      const result = await api.post('/identity/trade-applications', { ...form, documents: files });
      setNotice(result.ok ? result.message : (result.message ?? 'Please check the form.'));
      reload();
    } catch (e) { setNotice(e.message); }
  };

  return (
    <AccountLayout title="Apply for a trade account">
      {notice && <Alert tone="info">{notice}</Alert>}
      <Panel title="Your business">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company name" required><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
          <Field label="Registration number" required><Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} /></Field>
          <Field label="Tax or VAT number" required><Input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} /></Field>
        </div>
        <div className="pt-3">
          <Field
            label="Documents"
            hint={requirements ? `Please attach: ${requirements.documents.join(', ')}` : undefined}
            required
          >
            <input type="file" multiple onChange={pick} className="text-[13px]" />
          </Field>
          {files.length > 0 && (
            <ul className="text-[12px] text-nop-muted list-disc pl-5 pt-2">
              {files.map((f) => <li key={f.fileName}>{f.fileName}</li>)}
            </ul>
          )}
        </div>
        <div className="pt-4">
          <Button variant="brand" onClick={submit}>Send my application</Button>
        </div>
      </Panel>

      {Array.isArray(mine) && mine.length > 0 && (
        <Panel title="My applications" bodyClass="p-0">
          <Grid
            columns={[
              { key: 'created', header: 'Sent', render: (a) => when(a.createdOnUtc) },
              { key: 'company', header: 'Company', render: (a) => a.companyName },
              { key: 'status', header: 'Status', render: (a) => <Badge tone={a.status === 'Approved' ? 'green' : a.status === 'Rejected' ? 'red' : 'amber'}>{a.status}</Badge> },
              { key: 'reason', header: 'Note', render: (a) => a.reason ?? '-' },
            ]}
            rows={mine}
            rowKey={(a) => a.id}
          />
        </Panel>
      )}
    </AccountLayout>
  );
}

/* ================================================================ Policy acceptance ===== */

export function AcceptTerms() {
  const navigate = useNavigate();
  const [check, reload] = useAsync(() => api.get(`/identity/terms/check${qs({ path: '/customer/accept-terms' })}`));
  const [notice, setNotice] = useState(null);
  const pending = check?.pending ?? [];

  const title = (policy) => (policy === 'ConditionsOfUse' ? 'Conditions of use'
    : policy === 'PrivacyPolicy' ? 'Privacy policy'
      : policy === 'VendorTermsOfService' ? 'Seller terms of service' : policy);

  const accept = async () => {
    for (const p of pending) {
      // eslint-disable-next-line no-await-in-loop
      await api.post('/identity/terms/accept', { policySystemName: p.policySystemName, vendorId: p.vendorId ?? null });
    }
    setNotice('Thank you. You can carry on.');
    reload();
    navigate('/');
  };

  const decline = async () => {
    const [first] = pending;
    if (!first) return;
    const result = await api.post('/identity/terms/decline', { policySystemName: first.policySystemName, vendorId: first.vendorId ?? null });
    setNotice(result.message ?? 'You have been signed out.');
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="nop-page-title">Our terms have changed</h1>
      {notice && <Alert tone="info">{notice}</Alert>}
      {!check ? <Spinner /> : pending.length === 0 ? (
        <Alert tone="success">There is nothing to accept. <Link to="/" className="brand-text hover:underline">Continue shopping</Link></Alert>
      ) : (
        <Panel title="Please read and accept">
          <p className="text-[13px] text-nop-muted mb-3">
            We have published a new version of the following. Please accept to carry on using your account.
          </p>
          <ul className="text-[13px] list-disc pl-5 space-y-1">
            {pending.map((p) => (
              <li key={`${p.policySystemName}-${p.vendorId ?? ''}`}>
                {title(p.policySystemName)}
                {' '}
                <span className="text-nop-muted">(version {String(p.versionNo)})</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-4">
            <Button variant="brand" onClick={accept}>I accept</Button>
            <Button onClick={decline}>I do not accept</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
