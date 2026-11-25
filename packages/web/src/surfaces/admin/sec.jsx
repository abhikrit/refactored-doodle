// Security, audit and compliance: the administration screens of the security area.
// Native nopCommerce admin patterns only (section 11.1) — grids, search panels, tab strips and
// the standard panel and button bar — in the same shell as the rest of the admin area.

import { useEffect, useState } from 'react';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Panel, Button, Badge, Breadcrumb, Grid, SearchPanel, Field, Input, Select, Tabs, useTabs,
  Alert, Spinner, KeyValue, StatTile, Textarea,
} from '../../ui/nop/kit.jsx';
import { api, qs } from '../../lib/api.js';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, ...items]} />;
const when = (v) => (v ? new Date(v).toLocaleString() : '-');
const show = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

function useLoad(fn, deps = []) {
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
}

const download = (name, text, type = 'text/csv') => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

/* ======================================================================= audit trail ==== */

export function AdminAuditTrail() {
  const tabs = [
    { id: 'search', label: 'Search' },
    { id: 'history', label: 'Record history' },
    { id: 'access', label: 'Access at a date' },
    { id: 'integrity', label: 'Integrity' },
    { id: 'report', label: 'Compliance report' },
  ];
  const [active, setActive] = useTabs(tabs, 'search');
  return (
    <AdminPage
      title="Audit trail"
      breadcrumb={crumb({ label: 'System' }, { label: 'Audit trail' })}
      intro="Every change made in this store, who made it and what it was before. The records cannot be edited or deleted."
    >
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {active === 'search' && <TrailSearch />}
      {active === 'history' && <RecordHistory />}
      {active === 'access' && <AccessReplay />}
      {active === 'integrity' && <Integrity />}
      {active === 'report' && <ComplianceReport />}
    </AdminPage>
  );
}

function TrailSearch() {
  const [filter, setFilter] = useState({
    event: '', entity: '', actor: '', from: '', to: '',
  });
  const [applied, setApplied] = useState({});
  const [data, , error] = useLoad(() => api.get(`/security/audit/search${qs(applied)}`), [JSON.stringify(applied)]);
  const [notice, setNotice] = useState(null);

  const exportTrail = async () => {
    try {
      const result = await api.post('/security/audit/export', { filter: applied });
      if (result.ok === false) { setNotice(result.message ?? 'That could not be exported.'); return; }
      download('audit-trail.csv', result.csv);
      setNotice(`${result.message} ${result.manifest.eventCount} records, sequence ${result.manifest.firstSequence}–${result.manifest.lastSequence}.`);
    } catch (e) { setNotice(e.message); }
  };

  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning" title="Access denied">{error}</Alert>}
      <SearchPanel
        onSearch={() => setApplied({ ...filter })}
        onClear={() => {
          setFilter({
            event: '', entity: '', actor: '', from: '', to: '',
          });
          setApplied({});
        }}
      >
        <Field label="Event"><Input value={filter.event} onChange={(e) => setFilter({ ...filter, event: e.target.value })} /></Field>
        <Field label="Record type"><Input value={filter.entity} onChange={(e) => setFilter({ ...filter, entity: e.target.value })} /></Field>
        <Field label="Changed by"><Input value={filter.actor} onChange={(e) => setFilter({ ...filter, actor: e.target.value })} /></Field>
        <Field label="From"><Input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} /></Field>
        <Field label="To"><Input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} /></Field>
      </SearchPanel>
      <Panel
        bodyClass="p-0"
        title={data ? `${data.total} records` : 'Records'}
        actions={<Button size="sm" onClick={exportTrail}>Export</Button>}
      >
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'sequence', header: '#', render: (e) => e.sequence },
              { key: 'at', header: 'When', render: (e) => when(e.occurredOnUtc) },
              { key: 'what', header: 'What happened', render: (e) => e.what ?? e.note ?? e.event },
              { key: 'entity', header: 'Record', render: (e) => `${e.entity ?? '-'} ${e.entityId ?? ''}`.trim() },
              { key: 'actor', header: 'Changed by', render: (e) => e.actor },
              { key: 'before', header: 'Before', render: (e) => <span className="font-mono text-[11px]">{show(e.before)}</span> },
              { key: 'after', header: 'After', render: (e) => <span className="font-mono text-[11px]">{show(e.after)}</span> },
              { key: 'outcome', header: 'Outcome', render: (e) => <Badge tone={e.outcome === 'success' ? 'green' : 'red'}>{e.outcome}</Badge> },
            ]}
            rows={data.events.slice(0, 200)}
            rowKey={(e) => e.sequence}
            empty="Nothing matches."
          />
        )}
      </Panel>
    </>
  );
}

function RecordHistory() {
  const [form, setForm] = useState({ entity: 'Customer', entityId: '', at: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const run = async () => {
    try {
      setError(null);
      setResult(await api.get(`/security/audit/replay/entity${qs(form)}`));
    } catch (e) { setError(e.message); }
  };
  return (
    <Panel title="What a record looked like" subtitle="Rebuilt from the audit trail, with the change that set each value.">
      {error && <Alert tone="warning">{error}</Alert>}
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Record type"><Input value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} /></Field>
        <Field label="Record id"><Input value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} /></Field>
        <Field label="At" hint="leave empty for now"><Input type="datetime-local" value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} /></Field>
        <Button variant="primary" onClick={run}>Show</Button>
      </div>
      {result && (result.ok === false
        ? <Alert tone="info">{result.message}</Alert>
        : (
          <div className="pt-4">
            <Grid
              columns={[
                { key: 'field', header: 'Field', render: (r) => r.field },
                { key: 'value', header: 'Value', render: (r) => show(r.value) },
                { key: 'by', header: 'Set by', render: (r) => r.by?.actor ?? '-' },
                { key: 'at', header: 'When', render: (r) => when(r.by?.at) },
                { key: 'seq', header: '#', render: (r) => r.by?.sequence ?? '-' },
              ]}
              rows={Object.entries(result.values).map(([field, value]) => ({ field, value, by: result.setBy[field] }))}
              rowKey={(r) => r.field}
            />
          </div>
        ))}
    </Panel>
  );
}

function AccessReplay() {
  const [form, setForm] = useState({ customerId: '', at: '' });
  const [result, setResult] = useState(null);
  return (
    <Panel title="What someone could reach" subtitle="The roles, permissions, scopes and delegations in force at a past date.">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Customer id"><Input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} /></Field>
        <Field label="At"><Input type="datetime-local" value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} /></Field>
        <Button variant="primary" onClick={() => api.get(`/security/audit/replay/access${qs(form)}`).then(setResult).catch(() => {})}>Show</Button>
      </div>
      {result && (result.ok === false ? <Alert tone="info">{result.message}</Alert> : (
        <div className="pt-4">
          <KeyValue rows={[
            ['Roles', (result.roles ?? []).join(', ') || '-'],
            ['Permissions', (result.permissions ?? []).length],
            ['Scopes', (result.scopes ?? []).map((s) => `${s.dimension}: ${s.value}`).join('; ') || '-'],
            ['Delegations', (result.delegations ?? []).length],
            ['Rebuilt from', result.rebuiltFrom],
          ]}
          />
        </div>
      ))}
    </Panel>
  );
}

function Integrity() {
  const [chain, reload, error] = useLoad(() => api.get('/security/audit/chain'));
  const [rights] = useLoad(() => api.get('/security/audit/write-rights'));
  const [result, setResult] = useState(null);
  return (
    <>
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel title="The chain">
        {!chain ? <Spinner /> : (
          <KeyValue rows={[
            ['Records', chain.events],
            ['First', chain.firstSequence],
            ['Last', chain.lastSequence],
            ['Last fingerprint', <span className="font-mono text-[11px] break-all">{chain.lastHash}</span>],
            ['Can be edited', rights ? (rights.update ? 'Yes' : 'No') : '-'],
            ['Can be deleted', rights ? (rights.delete ? 'Yes' : 'No') : '-'],
          ]}
          />
        )}
        <div className="pt-3">
          <Button
            variant="primary"
            onClick={() => api.post('/security/audit/verify', {}).then((r) => { setResult(r); reload(); }).catch(() => {})}
          >
            Verify now
          </Button>
        </div>
        {result && (
          <div className="pt-3">
            <Alert tone={result.result === 'Verified' ? 'success' : 'error'} title={result.result === 'Verified' ? 'The trail is intact' : 'The trail has been altered'}>
              {result.result === 'Verified'
                ? `${result.checked} records checked, ${result.firstSequence}–${result.lastSequence}.`
                : `${result.message ?? result.reason} First bad record: ${result.atSequence}.`}
            </Alert>
          </div>
        )}
      </Panel>
    </>
  );
}

function ComplianceReport() {
  const [from, setFrom] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const run = async () => {
    try {
      setError(null);
      setReport(await api.get(`/security/audit/compliance-report${qs({ from })}`));
    } catch (e) { setError(e.message); }
  };
  return (
    <>
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel title="Compliance report" subtitle="Sign-ins, changes made in the admin area, configuration changes and staff access to customer records.">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Button variant="primary" onClick={run}>Run</Button>
          {report?.csv && <Button onClick={() => download('compliance-report.csv', report.csv)}>Export</Button>}
        </div>
      </Panel>
      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Sign-ins" value={report.logins} />
            <StatTile label="Failed sign-ins" value={report.failedLogins} tone={report.failedLogins ? 'amber' : 'blue'} />
            <StatTile label="Staff record views" value={report.staffReadAccess.length} />
          </div>
          <Panel bodyClass="p-0" title="Changes by user">
            <Grid
              columns={[
                { key: 'actor', header: 'User', render: (r) => r.actor },
                { key: 'count', header: 'Changes', align: 'right', render: (r) => r.count },
              ]}
              rows={report.adminChangesByUser}
              rowKey={(r) => r.actor}
              empty="No changes in the period."
            />
          </Panel>
          <Panel bodyClass="p-0" title="Configuration changes">
            <Grid
              columns={[
                { key: 'key', header: 'Setting', render: (r) => r.key },
                { key: 'before', header: 'Before', render: (r) => show(r.before) },
                { key: 'after', header: 'After', render: (r) => show(r.after) },
                { key: 'actor', header: 'By', render: (r) => r.actor },
                { key: 'at', header: 'When', render: (r) => when(r.at) },
              ]}
              rows={report.settingChanges.slice(0, 100)}
              rowKey={(r) => r.sequence}
              empty="No configuration changes in the period."
            />
          </Panel>
        </>
      )}
    </>
  );
}

/* ================================================================= privacy and data ===== */

export function AdminDataProtection() {
  const tabs = [
    { id: 'profile', label: 'Country profile' },
    { id: 'register', label: 'Processing register' },
    { id: 'transfers', label: 'Transfers' },
    { id: 'classification', label: 'Data classification' },
    { id: 'checklist', label: 'Go-live checklist' },
  ];
  const [active, setActive] = useTabs(tabs, 'profile');
  return (
    <AdminPage
      title="Data protection"
      breadcrumb={crumb({ label: 'System' }, { label: 'Data protection' })}
      intro="The country profile this store answers to, what personal data it processes, where that data goes, and how fields are masked."
    >
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {active === 'profile' && <CountryProfile />}
      {active === 'register' && <ProcessingRegister />}
      {active === 'transfers' && <Transfers />}
      {active === 'classification' && <Classification />}
      {active === 'checklist' && <GoLiveChecklist />}
    </AdminPage>
  );
}

const PROFILE_FIELDS = [
  ['lawNames', 'Law'],
  ['regulator', 'Regulator'],
  ['dataRequestResponseDays', 'Days to answer a request'],
  ['breachDeadlineToRegulatorHours', 'Hours to tell the regulator'],
  ['breachDeadlineToPeopleHours', 'Hours to tell the people affected'],
  ['transferConditions', 'When data may leave the country'],
  ['smsOptOut', 'SMS opt-out duties'],
  ['serverSideAnalyticsConsent', 'Server-side analytics need consent'],
];

function CountryProfile() {
  const [profile, reload, error] = useLoad(() => api.get('/security/privacy-profile'));
  const [form, setForm] = useState({});
  const [notice, setNotice] = useState(null);
  const save = async () => {
    try {
      const values = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      const result = await api.post('/security/privacy-profile', { values });
      setNotice(result.ok === false ? (result.message ?? 'That could not be saved.') : 'The country profile has been saved.');
      setForm({});
      reload();
    } catch (e) { setNotice(e.message); }
  };
  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      {!profile ? <Spinner /> : (
        <>
          {profile.missing?.length > 0 && (
            <Alert tone="warning" title="The profile is incomplete">
              {`Still to set: ${profile.missing.join(', ')}. Deadlines and response times are never assumed.`}
            </Alert>
          )}
          <Panel title={`Country: ${profile.country}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFILE_FIELDS.map(([key, label]) => (
                <Field key={key} label={label} hint={`Now: ${show(profile.display[key])}`}>
                  <Input
                    value={form[key] ?? ''}
                    placeholder={show(profile.display[key])}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            <div className="pt-4"><Button variant="primary" onClick={save}>Save</Button></div>
          </Panel>
        </>
      )}
    </>
  );
}

function ProcessingRegister() {
  const [rows, reload, error] = useLoad(() => api.get('/security/processing-activities'));
  const [form, setForm] = useState({ purpose: '', lawfulBasis: '', dataCategories: '' });
  const [notice, setNotice] = useState(null);
  const add = async () => {
    try {
      const result = await api.post('/security/processing-activities', {
        purpose: form.purpose,
        lawfulBasis: form.lawfulBasis,
        dataCategories: form.dataCategories.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setNotice(result.ok === false ? (result.message ?? 'That could not be saved.') : 'The activity has been recorded.');
      reload();
    } catch (e) { setNotice(e.message); }
  };
  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel
        bodyClass="p-0"
        title="What this store processes"
        actions={(
          <Button
            size="sm"
            onClick={() => api.get('/security/processing-activities/export?format=csv')
              .then((r) => download('processing-register.csv', r.csv)).catch(() => {})}
          >
            Export
          </Button>
        )}
      >
        {!rows ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'purpose', header: 'Purpose', render: (r) => r.purpose },
              { key: 'basis', header: 'Lawful basis', render: (r) => r.lawfulBasis ?? '-' },
              { key: 'categories', header: 'Data', render: (r) => (r.dataCategories ?? []).join(', ') },
              { key: 'retention', header: 'Kept for', render: (r) => r.retentionRule ?? '-' },
              { key: 'transfers', header: 'Goes to', render: (r) => (r.transfers ?? []).join(', ') || '-' },
              { key: 'assessment', header: 'Impact assessment', render: (r) => <Badge tone={r.assessmentStatus === 'Required' ? 'amber' : 'slate'}>{r.assessmentStatus}</Badge> },
              { key: 'version', header: 'Version', render: (r) => r.version },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="Nothing recorded yet."
          />
        )}
      </Panel>
      <Panel title="Record an activity">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Purpose" required><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field>
          <Field label="Lawful basis">
            <Select value={form.lawfulBasis} onChange={(e) => setForm({ ...form, lawfulBasis: e.target.value })}>
              <option value="">Choose</option>
              <option value="consent">consent</option>
              <option value="contract">contract</option>
              <option value="legal obligation">legal obligation</option>
              <option value="legitimate interest">legitimate interest</option>
            </Select>
          </Field>
          <Field label="Data categories" hint="comma separated"><Input value={form.dataCategories} onChange={(e) => setForm({ ...form, dataCategories: e.target.value })} /></Field>
        </div>
        <div className="pt-3"><Button variant="primary" onClick={add}>Record</Button></div>
      </Panel>
    </>
  );
}

function Transfers() {
  const [rows, , error] = useLoad(() => api.get('/security/transfers'));
  const [residency] = useLoad(() => api.get('/security/residency'));
  return (
    <>
      {error && <Alert tone="warning">{error}</Alert>}
      {residency && (
        <Panel title="Where the data lives">
          <KeyValue rows={[
            ['Region', show(residency.decidedRegion)],
            ...residency.items.map((i) => [i.artefact, `${show(i.region)}${i.inDecidedRegion ? '' : ' (outside the region)'}`]),
          ]}
          />
        </Panel>
      )}
      <Panel bodyClass="p-0" title="Transfers out of the country">
        {!rows ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'destination', header: 'To', render: (r) => r.destination },
              { key: 'recipient', header: 'Recipient', render: (r) => r.recipient },
              { key: 'safeguard', header: 'Safeguard', render: (r) => r.safeguard },
              { key: 'categories', header: 'Data', render: (r) => (r.dataCategories ?? []).join(', ') },
              { key: 'integrations', header: 'Systems', render: (r) => (r.integrations ?? []).join(', ') || '-' },
            ]}
            rows={rows}
            rowKey={(r) => r.id}
            empty="No transfers recorded."
          />
        )}
      </Panel>
    </>
  );
}

function Classification() {
  const [data, reload, error] = useLoad(() => api.get('/security/classification'));
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({
    entity: 'Customer', field: '', class: 'Personal', masking: 'last-four',
  });
  const save = async () => {
    try {
      const result = await api.post('/security/classification', form);
      setNotice(result.ok === false ? (result.message ?? 'That could not be saved.') : 'The classification has been saved.');
      reload();
    } catch (e) { setNotice(e.message); }
  };
  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      {data?.prototypeDefaultLabel && <Alert tone="info">{data.prototypeDefaultLabel}</Alert>}
      <Panel bodyClass="p-0" title="How fields are classified and masked">
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'entity', header: 'Record', render: (r) => r.entity },
              { key: 'field', header: 'Field', render: (r) => r.field },
              { key: 'class', header: 'Class', render: (r) => <Badge tone="slate">{r.class}</Badge> },
              { key: 'masking', header: 'Masking', render: (r) => r.masking },
              { key: 'unmasked', header: 'Shown in full to', render: (r) => (r.unmaskedFor ?? []).join(', ') || '-' },
            ]}
            rows={data.classification}
            rowKey={(r) => `${r.entity}.${r.field}`}
          />
        )}
      </Panel>
      <Panel title="Classify a field">
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Record"><Input value={form.entity} onChange={(e) => setForm({ ...form, entity: e.target.value })} /></Field>
          <Field label="Field"><Input value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></Field>
          <Field label="Class">
            <Select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })}>
              {(data?.classes ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Masking">
            <Select value={form.masking} onChange={(e) => setForm({ ...form, masking: e.target.value })}>
              {(data?.maskingRules ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
        </div>
        <div className="pt-3"><Button variant="primary" onClick={save}>Save</Button></div>
      </Panel>
    </>
  );
}

function GoLiveChecklist() {
  const [privacy, , privacyError] = useLoad(() => api.get('/security/go-live-checklist'));
  const [residency] = useLoad(() => api.get('/security/residency/checklist'));
  const [edge] = useLoad(() => api.get('/security/edge'));
  const [gdpr] = useLoad(() => api.get('/security/gdpr/settings-check'));
  const items = [
    ...(privacy?.items ?? []),
    ...(residency?.items ?? []),
    ...(edge ? [{ check: 'edge protection (WAF and DDoS)', ok: edge.ok }] : []),
    ...(gdpr ? [{ check: 'GDPR settings', ok: gdpr.ok }] : []),
  ];
  return (
    <>
      {privacyError && <Alert tone="warning">{privacyError}</Alert>}
      <Panel bodyClass="p-0" title="Before this store goes live">
        {!privacy ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'check', header: 'Check', render: (i) => i.check },
              { key: 'ok', header: 'Ready', render: (i) => <Badge tone={i.ok ? 'green' : 'red'}>{i.ok ? 'Yes' : 'No'}</Badge> },
              { key: 'detail', header: 'Detail', render: (i) => i.message ?? i.value ?? i.region ?? i.lawfulBasis ?? '-' },
            ]}
            rows={items}
            rowKey={(i, n) => n}
            empty="Nothing to check."
          />
        )}
      </Panel>
    </>
  );
}

/* ====================================================================== breach cases ==== */

export function AdminBreaches() {
  const [cases, reload, error] = useLoad(() => api.get('/security/breaches'));
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({
    discoveredOnUtc: '', description: '', dataCategories: '',
  });
  const [detail, reloadDetail] = useLoad(
    () => (open ? api.get(`/security/breaches/${open}`) : Promise.resolve(null)),
    [open],
  );

  const act = async (fn, message) => {
    try {
      const result = await fn();
      setNotice(result?.ok === false ? (result.message ?? 'That could not be done.') : message);
      reload(); reloadDetail();
    } catch (e) { setNotice(e.message); }
  };

  return (
    <AdminPage
      title="Breach cases"
      breadcrumb={crumb({ label: 'System' }, { label: 'Breach cases' })}
      intro="Incidents that touched personal data, who must be told, and by when."
      actions={<Button size="sm" onClick={() => act(() => api.post('/security/breaches/deadline-task'), 'The deadlines have been checked.')}>Check deadlines</Button>}
    >
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel bodyClass="p-0" title={cases ? `${cases.length} cases` : 'Cases'}>
        {!cases ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'discovered', header: 'Discovered', render: (c) => when(c.discoveredOnUtc) },
              { key: 'description', header: 'What happened', render: (c) => c.description },
              { key: 'data', header: 'Data', render: (c) => (c.dataCategories ?? []).join(', ') },
              { key: 'affected', header: 'People', render: (c) => c.affectedCount ?? '-' },
              { key: 'regulator', header: 'Tell the regulator by', render: (c) => (c.regulatorDeadlineUtc ? when(c.regulatorDeadlineUtc) : 'not configured') },
              { key: 'people', header: 'Tell the people by', render: (c) => (c.subjectDeadlineUtc ? when(c.subjectDeadlineUtc) : 'not configured') },
              {
                key: 'status',
                header: 'Status',
                render: (c) => <Badge tone={c.status === 'Closed' ? 'slate' : c.status === 'Overdue' ? 'red' : 'amber'}>{c.status}</Badge>,
              },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (c) => <Button size="sm" onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Close' : 'Open'}</Button>,
              },
            ]}
            rows={cases}
            rowKey={(c) => c.id}
            empty="No cases."
          />
        )}
      </Panel>

      {open && detail && (
        <Panel title={`Case ${detail.id}`} subtitle={detail.description}>
          <KeyValue rows={[
            ['Status', detail.status],
            ['Discovered', when(detail.discoveredOnUtc)],
            ['Notifiable', detail.notifiable === undefined ? 'not assessed' : (detail.notifiable ? 'Yes' : 'No')],
            ['People affected', detail.affectedCount ?? 'list not produced'],
            ['Regulator reference', detail.regulatorReference ?? '-'],
            ['Notices sent', (detail.notices ?? []).length],
          ]}
          />
          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={() => act(() => api.post(`/security/breaches/${open}/affected`, { criteria: { stores: [1] } }), 'The affected list has been produced and frozen.')}>Produce the affected list</Button>
            <Button onClick={() => act(() => api.post(`/security/breaches/${open}/assess`, { notifiable: true }), 'The case is assessed as notifiable.')}>Assess as notifiable</Button>
            <Button variant="primary" onClick={() => act(() => api.post(`/security/breaches/${open}/notify-subjects`), 'The notices have been sent.')}>Send the notices</Button>
            <Button onClick={() => act(() => api.post(`/security/breaches/${open}/close`), 'The case is closed.')}>Close the case</Button>
          </div>
          {(detail.notices ?? []).length > 0 && (
            <div className="pt-4">
              <Grid
                columns={[
                  { key: 'customer', header: 'Person', render: (n) => n.customerId },
                  { key: 'channel', header: 'Channel', render: (n) => n.channel },
                  { key: 'to', header: 'Sent to', render: (n) => n.to },
                  { key: 'result', header: 'Result', render: (n) => <Badge tone={n.result === 'Sent' ? 'green' : 'red'}>{n.result}</Badge> },
                  { key: 'at', header: 'When', render: (n) => when(n.sentOnUtc) },
                ]}
                rows={detail.notices}
                rowKey={(n) => n.id}
              />
            </div>
          )}
        </Panel>
      )}

      <Panel title="Record a breach">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Discovered" required><Input type="datetime-local" value={form.discoveredOnUtc} onChange={(e) => setForm({ ...form, discoveredOnUtc: e.target.value })} /></Field>
          <Field label="Data categories" hint="comma separated"><Input value={form.dataCategories} onChange={(e) => setForm({ ...form, dataCategories: e.target.value })} /></Field>
          <Field label="What happened" required className="sm:col-span-3">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="pt-3">
          <Button
            variant="primary"
            onClick={() => act(() => api.post('/security/breaches', {
              discoveredOnUtc: form.discoveredOnUtc ? new Date(form.discoveredOnUtc).toISOString() : null,
              description: form.description,
              dataCategories: form.dataCategories.split(',').map((s) => s.trim()).filter(Boolean),
            }), 'The case has been recorded.')}
          >
            Record
          </Button>
        </div>
      </Panel>
    </AdminPage>
  );
}

/* ============================================= auditors, monitoring and vulnerabilities = */

export function AdminSecurityOperations() {
  const tabs = [
    { id: 'auditors', label: 'Auditor access' },
    { id: 'monitoring', label: 'Security monitoring' },
    { id: 'evidence', label: 'Evidence export' },
    { id: 'vulnerabilities', label: 'Vulnerabilities' },
    { id: 'edge', label: 'Hosting and edge' },
  ];
  const [active, setActive] = useTabs(tabs, 'auditors');
  return (
    <AdminPage
      title="Security operations"
      breadcrumb={crumb({ label: 'System' }, { label: 'Security operations' })}
      intro="Auditor access, what is sent to the monitoring system, the evidence an audit needs, and the findings still open."
    >
      <Tabs tabs={tabs} active={active} onChange={setActive} />
      {active === 'auditors' && <AuditorGrants />}
      {active === 'monitoring' && <Monitoring />}
      {active === 'evidence' && <Evidence />}
      {active === 'vulnerabilities' && <Vulnerabilities />}
      {active === 'edge' && <EdgeAndHosting />}
    </AdminPage>
  );
}

function AuditorGrants() {
  const [grants, reload, error] = useLoad(() => api.get('/security/auditor-grants'));
  const [form, setForm] = useState({ email: '', startsOnUtc: '', endsOnUtc: '' });
  const [notice, setNotice] = useState(null);
  const grant = async () => {
    try {
      const result = await api.post('/security/auditor-grants', {
        email: form.email,
        startsOnUtc: form.startsOnUtc ? new Date(form.startsOnUtc).toISOString() : null,
        endsOnUtc: form.endsOnUtc ? new Date(form.endsOnUtc).toISOString() : null,
        stores: [1],
      });
      setNotice(result.ok === false ? (result.message ?? 'That could not be saved.') : 'The auditor has access.');
      reload();
    } catch (e) { setNotice(e.message); }
  };
  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel bodyClass="p-0" title="Grants">
        {!grants ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'email', header: 'Auditor', render: (g) => g.email },
              { key: 'from', header: 'From', render: (g) => when(g.startsOnUtc) },
              { key: 'to', header: 'To', render: (g) => when(g.endsOnUtc) },
              { key: 'stores', header: 'Stores', render: (g) => (g.stores ?? []).join(', ') || 'all' },
              { key: 'period', header: 'Records from', render: (g) => (g.periodFrom ? when(g.periodFrom) : 'all') },
              {
                key: 'status',
                header: 'Status',
                render: (g) => <Badge tone={g.status === 'Active' ? 'green' : g.status === 'Expired' || g.status === 'Revoked' ? 'slate' : 'amber'}>{g.status}</Badge>,
              },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (g) => (g.status === 'Active'
                  ? <Button size="sm" onClick={() => api.post(`/security/auditor-grants/${g.id}/revoke`).then(reload).catch(() => {})}>Revoke</Button>
                  : null),
              },
            ]}
            rows={grants}
            rowKey={(g) => g.id}
            empty="No auditor has access."
          />
        )}
      </Panel>
      <Panel title="Give an auditor access">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Auditor e-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="From"><Input type="datetime-local" value={form.startsOnUtc} onChange={(e) => setForm({ ...form, startsOnUtc: e.target.value })} /></Field>
          <Field label="To"><Input type="datetime-local" value={form.endsOnUtc} onChange={(e) => setForm({ ...form, endsOnUtc: e.target.value })} /></Field>
        </div>
        <div className="pt-3"><Button variant="primary" onClick={grant}>Give access</Button></div>
      </Panel>
    </>
  );
}

function Monitoring() {
  const [config] = useLoad(() => api.get('/security/monitoring/configuration'));
  const [batches, reload, error] = useLoad(() => api.get('/security/monitoring/batches'));
  const [notice, setNotice] = useState(null);
  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      {error && <Alert tone="warning">{error}</Alert>}
      {config && (
        <Panel title="Where the events go">
          <KeyValue rows={[
            ['Switched on', config.enabled ? 'Yes' : 'No'],
            ['Format', config.format],
            ['Endpoint', config.endpoint],
            ['Records per batch', config.batchSize],
            ['Alert when a batch waits', `${config.backlogAgeMinutes} minutes`],
          ]}
          />
          <div className="flex flex-wrap gap-2 pt-3">
            <Button variant="primary" onClick={() => api.post('/security/monitoring/export-task').then((r) => { setNotice(`${r.sent} batch(es) sent.`); reload(); }).catch(() => {})}>Send now</Button>
            <Button onClick={() => api.post('/security/monitoring/backlog-check').then((r) => { setNotice(r.alerted ? 'The officer has been alerted about the backlog.' : 'Nothing is behind.'); reload(); }).catch(() => {})}>Check the backlog</Button>
          </div>
        </Panel>
      )}
      <Panel bodyClass="p-0" title="Batches">
        {!batches ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'id', header: 'Batch', render: (b) => b.id },
              { key: 'range', header: 'Records', render: (b) => `${b.firstSequence}–${b.lastSequence}` },
              { key: 'count', header: 'Count', align: 'right', render: (b) => b.eventCount },
              { key: 'attempts', header: 'Attempts', align: 'right', render: (b) => b.attempts },
              { key: 'status', header: 'Status', render: (b) => <Badge tone={b.status === 'Acknowledged' ? 'green' : 'amber'}>{b.status}</Badge> },
              { key: 'sent', header: 'Sent', render: (b) => when(b.sentOnUtc) },
            ]}
            rows={batches}
            rowKey={(b) => b.id}
            empty="Nothing has been sent yet."
          />
        )}
      </Panel>
    </>
  );
}

function Evidence() {
  const [from, setFrom] = useState('');
  const [result, setResult] = useState(null);
  const [statement, setStatement] = useState(null);
  const [notice, setNotice] = useState(null);
  return (
    <>
      {notice && <Alert tone="info">{notice}</Alert>}
      <Panel title="Evidence for an audit" subtitle="Access, second-factor status, privileged accounts, the audit chain, configuration changes, auditor grants and dependency scans.">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Button
            variant="primary"
            onClick={() => api.post('/security/evidence/export', { from: from ? new Date(from).toISOString() : undefined })
              .then((r) => { setResult(r); if (r.ok === false) setNotice(r.message); }).catch((e) => setNotice(e.message))}
          >
            Produce
          </Button>
          <Button
            onClick={() => api.post('/security/evidence/integrity-statement', { from: from ? new Date(from).toISOString() : undefined })
              .then(setStatement).catch((e) => setNotice(e.message))}
          >
            Integrity statement
          </Button>
        </div>
      </Panel>
      {result?.parts && (
        <Panel bodyClass="p-0" title="Files">
          <Grid
            columns={[
              { key: 'name', header: 'Part', render: (p) => p.name },
              { key: 'rows', header: 'Records', align: 'right', render: (p) => p.rowCount },
              { key: 'formats', header: 'Formats', render: (p) => (p.formats ?? []).join(', ') },
              {
                key: 'act',
                header: '',
                align: 'right',
                render: (p) => (
                  <Button size="sm" onClick={() => download(`${p.name.replace(/\s+/g, '-')}.json`, JSON.stringify(p.rows, null, 2), 'application/json')}>Download</Button>
                ),
              },
            ]}
            rows={result.parts}
            rowKey={(p) => p.name}
          />
        </Panel>
      )}
      {statement?.statement && (
        <Panel title="Integrity statement">
          <KeyValue rows={[
            ['Result', statement.statement.result],
            ['Records', `${statement.statement.firstSequence}–${statement.statement.lastSequence}`],
            ['Count', statement.statement.eventCount],
            ['Signed with', statement.signedWith],
            ['Signature', <span className="font-mono text-[11px] break-all">{statement.signature}</span>],
          ]}
          />
        </Panel>
      )}
    </>
  );
}

function Vulnerabilities() {
  const [scans, , scanError] = useLoad(() => api.get('/security/vulnerabilities/scans'));
  const [findings, reload] = useLoad(() => api.get('/security/vulnerabilities/findings'));
  const [scope] = useLoad(() => api.get('/security/vulnerabilities/pen-test-scope'));
  return (
    <>
      {scanError && <Alert tone="warning">{scanError}</Alert>}
      <Panel bodyClass="p-0" title="Dependency scans">
        {!scans ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'release', header: 'Release', render: (s) => s.release },
              { key: 'findings', header: 'Findings', align: 'right', render: (s) => (s.findings ?? []).length },
              { key: 'new', header: 'New high or critical', align: 'right', render: (s) => (s.newHighOrCritical ?? []).length },
              { key: 'build', header: 'Build', render: (s) => <Badge tone={s.buildPassed ? 'green' : 'red'}>{s.buildPassed ? 'Passed' : 'Failed'}</Badge> },
              { key: 'at', header: 'Scanned', render: (s) => when(s.scannedOnUtc) },
            ]}
            rows={scans}
            rowKey={(s) => s.id}
            empty="No scan has been recorded."
          />
        )}
      </Panel>
      <Panel bodyClass="p-0" title="Findings">
        {!findings ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'title', header: 'Finding', render: (f) => f.title },
              { key: 'source', header: 'Found by', render: (f) => f.source },
              { key: 'severity', header: 'Severity', render: (f) => <Badge tone={['Critical', 'High'].includes(f.severity) ? 'red' : f.severity === 'Medium' ? 'amber' : 'slate'}>{f.severity}</Badge> },
              { key: 'owner', header: 'Owner', render: (f) => f.owner },
              { key: 'deadline', header: 'Fix by', render: (f) => (f.fixDeadlineUtc ? when(f.fixDeadlineUtc) : 'not configured') },
              { key: 'status', header: 'Status', render: (f) => <Badge tone={f.status === 'Fixed' ? 'green' : f.status === 'RiskAccepted' ? 'slate' : 'amber'}>{f.status}</Badge> },
            ]}
            rows={findings}
            rowKey={(f) => f.id}
            empty="No findings."
            footer={null}
          />
        )}
      </Panel>
      {scope && (
        <Panel title="Penetration-test scope" subtitle={`${scope.extensionRegisterEntries} product extensions and ${scope.platformFindings} known platform findings.`}>
          <Grid
            columns={[
              { key: 'kind', header: 'Kind', render: (i) => i.kind },
              { key: 'target', header: 'Target', render: (i) => i.target },
              { key: 'control', header: 'Control', render: (i) => i.control },
            ]}
            rows={scope.items.slice(0, 60)}
            rowKey={(i, n) => n}
          />
        </Panel>
      )}
      <div className="hidden">{reload ? '' : ''}</div>
    </>
  );
}

function EdgeAndHosting() {
  const [edge, , error] = useLoad(() => api.get('/security/edge'));
  const [proxy] = useLoad(() => api.get('/security/transport/proxy'));
  const [atRest] = useLoad(() => api.get('/security/encryption/at-rest'));
  const [passwords] = useLoad(() => api.get('/security/encryption/passwords'));
  const [cards] = useLoad(() => api.get('/security/pci/card-scan').catch(() => null));
  return (
    <>
      {error && <Alert tone="warning">{error}</Alert>}
      <Panel title="In front of the store">
        {!edge ? <Spinner /> : (
          <KeyValue rows={[
            ['Provider', show(edge.provider)],
            ['Region', show(edge.region)],
            ['Web application firewall', show(edge.wafService)],
            ['DDoS protection', show(edge.ddosService)],
            ['Accepts traffic from', show(edge.applicationAcceptsTrafficFrom)],
            ['Evidence', show(edge.evidence)],
          ]}
          />
        )}
      </Panel>
      {proxy && (
        <Panel title="Behind the proxy">
          <KeyValue rows={[
            ['Proxy configured', proxy.configured ? 'Yes' : 'No'],
            ['Header', show(proxy.forwardedProtoHeaderName)],
            ['Sign-in cookie marked Secure', proxy.authCookieSecureFlag ? 'Yes' : 'No'],
          ]}
          />
        </Panel>
      )}
      {atRest && (
        <Panel bodyClass="p-0" title="Encryption at rest">
          <Grid
            columns={[
              { key: 'target', header: 'What', render: (i) => i.target },
              { key: 'enabled', header: 'Encrypted', render: (i) => <Badge tone={i.enabled ? 'green' : 'red'}>{i.enabled ? 'Yes' : 'No'}</Badge> },
              { key: 'mechanism', header: 'How', render: (i) => show(i.mechanism) },
              { key: 'evidence', header: 'Evidence', render: (i) => show(i.evidence) },
            ]}
            rows={atRest.items}
            rowKey={(i) => i.target}
          />
        </Panel>
      )}
      {passwords && (
        <Panel title="Passwords and cards">
          <KeyValue rows={[
            ['Password storage', `${passwords.defaultPasswordFormat} (${passwords.hashedPasswordFormat})`],
            ['Salted', passwords.saltedHash ? 'Yes' : 'No'],
            ['Passwords stored in clear', passwords.clearPasswordsStored],
            ['Card data anywhere', cards ? (cards.clean ? 'None' : `${cards.findings.length} found`) : '-'],
          ]}
          />
        </Panel>
      )}
    </>
  );
}
