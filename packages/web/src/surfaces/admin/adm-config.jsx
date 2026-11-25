// Administration — configuration screens (PRD-ADM.md §11.1)
//
//   Workflow designer, simulator, versions; case list and replay      ADM-002   [New]
//   Rule sets, rule editor, pattern library, test harness, log        ADM-003   [New]
//   Transaction types, parameter schemas, chains                      ADM-004   [New]
//   Eligibility bindings, quotas, screening review                    ADM-005   [New]
//   Upload policy                                                     ADM-008   [New settings page]
//   Template library, versions, analytics, shared library; workspace  ADM-011/012 [New]
//
// Layouts follow the native nopCommerce admin patterns only (§11.1 note, CLAUDE.md §11.1).

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct } from '../../lib/store.jsx';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Checkbox, Citation, Field, Grid, Input, KeyValue, Panel,
  Select, Spinner, StatTile, Tabs, Textarea,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, ...items]} />;

/** Held features carry the P-1 label wherever they are shown. */
export function HeldByDecision({ decision = 'WF-ENG', children }) {
  return (
    <Alert tone="warning" title={`Prototype default — decision ${decision} pending`}>
      {children}
    </Alert>
  );
}

/** One place to turn an API refusal into the native "access denied" panel. */
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

function Denied({ error }) {
  return (
    <Alert tone="error" title="Access denied">
      {error.message}
      {error.permission && (
        <Citation className="mt-1">
          The native CheckPermission attribute refuses this screen without
          {' '}
          <span className="font-mono">{error.permission}</span>
          . Sign in as a role that holds it.
        </Citation>
      )}
    </Alert>
  );
}

const Body = ({ state, children }) => {
  if (state.loading) return <Spinner />;
  if (state.error) return <Denied error={state.error} />;
  return children(state.data);
};

/* ============================================================ PRD-ADM-002 workflows ===== */

export function Workflows() {
  const state = useAdminData('/admin-console/workflows');
  const [tab, setTab] = useState('definitions');
  const [selected, setSelected] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [sample, setSample] = useState('{\n  "amount": 5000,\n  "identityNumber": "MW-123"\n}');
  const cases = useAdminData('/admin-console/workflow-cases');
  const operations = useAdminData('/admin-console/step-operations');

  const simulate = async (definition) => {
    let sampleData = {};
    try { sampleData = JSON.parse(sample); } catch { sampleData = {}; }
    setSimulation(await api.post(`/admin-console/workflows/${definition.id}/simulate`, { sampleData }));
    setSelected(definition);
  };

  return (
    <AdminPage
      title="Workflows"
      breadcrumb={crumb({ label: 'Configuration' }, { label: 'Workflows' })}
      intro="PRD-ADM-002 (roadmap row 391) — business processes as steps with branches and parallel paths, built from ready-made steps, simulated before publishing, versioned per case and replayable. BR-ADM-010 to BR-ADM-012."
      actions={<Button onClick={() => { state.reload(); cases.reload(); }}>Refresh</Button>}
    >
      <HeldByDecision>
        ADM-002 is held until the workflow engine is chosen (build or embed). What is built here is
        the PRD&apos;s Proposed option behind IC-ADM-01, which is engine-independent, so the engine
        choice replaces the implementation and not its callers.
      </HeldByDecision>

      <Body state={state}>
        {(definitions) => (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <StatTile label="Definitions" value={definitions.length} tone="blue" />
              <StatTile label="Published" value={definitions.filter((d) => d.status === 'Published').length} tone="green" />
              <StatTile label="Cases" value={cases.data?.length ?? 0} tone="slate" />
              <StatTile label="Step operations" value={operations.data?.length ?? 0} tone="amber" />
            </div>

            <Tabs
              tabs={[
                { id: 'definitions', label: 'Definitions', count: definitions.length },
                { id: 'cases', label: 'Cases and replay', count: cases.data?.length ?? 0 },
                { id: 'operations', label: 'Step operations', count: operations.data?.length ?? 0 },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="border border-t-0 border-nop-border bg-white">
              {tab === 'definitions' && (
                <>
                  <Grid
                    dense
                    columns={[
                      { key: 'code', header: 'Code', render: (d) => <span className="font-mono text-[12px]">{d.code}</span> },
                      { key: 'name', header: 'Name' },
                      { key: 'version', header: 'Version', align: 'right' },
                      { key: 'status', header: 'Status', render: (d) => <Badge tone={d.status === 'Published' ? 'green' : d.status === 'Retired' ? 'slate' : 'amber'}>{d.status}</Badge> },
                      { key: 'basis', header: 'Basis', render: (d) => <span className="text-[12px]">{d.basis ?? '—'}</span> },
                      { key: 'steps', header: 'Steps', align: 'right', render: (d) => d.elements.length },
                      {
                        key: 'act',
                        header: '',
                        align: 'right',
                        render: (d) => (
                          <span className="flex gap-1 justify-end">
                            <Button size="sm" onClick={() => simulate(d)}>Simulate</Button>
                            <Button size="sm" as="a" href={`/api/admin-console/workflows/${d.id}/bpmn`} target="_blank">BPMN 2.0</Button>
                          </span>
                        ),
                      },
                    ]}
                    rows={definitions}
                    rowKey={(d) => d.id}
                  />
                  <div className="p-3 border-t border-nop-border grid gap-3 md:grid-cols-2">
                    <Panel title="Simulator" subtitle="AC-ADM-002-03-01 — the path, where it would wait, and the outputs. Nothing is sent, stored, called or paid (BR-ADM-012).">
                      <Field label="Sample case data (JSON)">
                        <Textarea rows={5} value={sample} onChange={(e) => setSample(e.target.value)} />
                      </Field>
                      {simulation && (
                        <div className="mt-3 space-y-2">
                          <div className="text-[12.5px] text-nop-muted">
                            {selected?.code}
                            {' — would wait at '}
                            <span className="font-mono">{simulation.waitingAt ?? 'no waiting step'}</span>
                          </div>
                          <Grid
                            dense
                            columns={[
                              { key: 'step', header: 'Step', render: (p) => <span className="font-mono text-[12px]">{p.step}</span> },
                              { key: 'type', header: 'Type' },
                              { key: 'output', header: 'Output' },
                            ]}
                            rows={simulation.path}
                            rowKey={(p, i) => `${p.step}-${i}`}
                          />
                          {simulation.suppressedSideEffects.length > 0 && (
                            <Alert tone="info" title="Suppressed side effects (BR-ADM-012)">
                              {simulation.suppressedSideEffects.map((s) => `${s.step}: ${s.suppressed}`).join('; ')}
                            </Alert>
                          )}
                        </div>
                      )}
                    </Panel>
                    <Panel title="The definition" subtitle="Elements, in order">
                      {selected ? (
                        <Grid
                          dense
                          columns={[
                            { key: 'id', header: 'Element', render: (e) => <span className="font-mono text-[12px]">{e.id}</span> },
                            { key: 'type', header: 'Type', render: (e) => <Badge tone="slate">{e.type}</Badge> },
                            { key: 'detail', header: 'Detail', render: (e) => e.eventCode ?? e.operation ?? e.templateCode ?? e.chainCode ?? e.role ?? '—' },
                          ]}
                          rows={selected.elements}
                          rowKey={(e) => e.id}
                        />
                      ) : <div className="text-[13px] text-nop-muted">Choose Simulate on a definition to see its steps.</div>}
                    </Panel>
                  </div>
                </>
              )}

              {tab === 'cases' && (
                <Body state={cases}>
                  {(rows) => <CaseList rows={rows} onChange={cases.reload} />}
                </Body>
              )}

              {tab === 'operations' && (
                <Body state={operations}>
                  {(rows) => (
                    <>
                      <Grid
                        dense
                        columns={[
                          { key: 'code', header: 'Operation', render: (o) => <span className="font-mono text-[12px]">{o.code}</span> },
                          { key: 'owningModule', header: 'Owning module', render: (o) => <span className="font-mono text-[12px]">{o.owningModule}</span> },
                          { key: 'feature', header: 'Feature', render: (o) => <Link to={`/explorer/features/${o.feature}`} className="text-nop-blue hover:underline font-mono text-[12px]">{o.feature}</Link> },
                          { key: 'defaultTimeoutMs', header: 'Timeout (ms)', align: 'right' },
                          { key: 'defaultRetries', header: 'Retries', align: 'right' },
                          { key: 'note', header: 'Note' },
                        ]}
                        rows={rows}
                        rowKey={(o) => o.code}
                      />
                      <Citation className="p-3">
                        IC-ADM-01 RegisterStepOperation: a call-to-another-system step may name only an
                        operation in this catalogue — an INT-005 adapter operation, or a module connector
                        operation its owning module registered. BR-ADM-011: the step calls the owning
                        module&apos;s service and changes no state itself.
                      </Citation>
                    </>
                  )}
                </Body>
              )}
            </div>
          </>
        )}
      </Body>
    </AdminPage>
  );
}

function CaseList({ rows, onChange }) {
  const [replay, setReplay] = useState(null);
  const open = async (row) => setReplay(await api.get(`/admin-console/workflow-cases/${row.id}/replay`));
  return (
    <>
      <Grid
        dense
        columns={[
          { key: 'id', header: 'Case', align: 'right' },
          { key: 'definitionCode', header: 'Definition', render: (c) => <span className="font-mono text-[12px]">{c.definitionCode}</span> },
          { key: 'version', header: 'Version', align: 'right' },
          { key: 'businessKey', header: 'Business key', render: (c) => `${c.businessKeyType ?? '—'} ${c.businessKeyId ?? ''}` },
          {
            key: 'status',
            header: 'Status',
            render: (c) => <Badge tone={c.status === 'Completed' ? 'green' : c.status === 'Failed' ? 'red' : c.status === 'Waiting' ? 'amber' : 'blue'}>{c.status}</Badge>,
          },
          { key: 'waiting', header: 'Waiting on', render: (c) => (c.waitingOn ?? []).map((w) => w.stepId).join(', ') || '—' },
          {
            key: 'act',
            header: '',
            align: 'right',
            render: (c) => (
              <span className="flex gap-1 justify-end">
                <Button size="sm" onClick={() => open(c)}>Replay</Button>
                {c.status === 'Failed' && (
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={async () => { await api.post(`/admin-console/workflow-cases/${c.id}/retry`, {}); onChange(); }}
                  >
                    Retry step
                  </Button>
                )}
              </span>
            ),
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
      />
      {replay && (
        <div className="p-3 border-t border-nop-border">
          <Panel
            title={`Replay — case ${replay.case.id} (${replay.case.definitionCode} v${replay.version})`}
            subtitle="AC-ADM-002-05-01 — read-only: every executed step in order, with time, actor, inputs, outputs and gateway decisions"
            bodyClass="p-0"
          >
            <Grid
              dense
              columns={[
                { key: 'stepId', header: 'Step', render: (s) => <span className="font-mono text-[12px]">{s.stepId}</span> },
                { key: 'stepType', header: 'Type', render: (s) => <Badge tone="slate">{s.stepType}</Badge> },
                { key: 'status', header: 'Status' },
                { key: 'actor', header: 'Actor' },
                { key: 'decision', header: 'Decision', render: (s) => s.decision ?? '—' },
                { key: 'output', header: 'Output', render: (s) => (s.output ? JSON.stringify(s.output) : '—') },
                { key: 'attempts', header: 'Attempts', align: 'right', render: (s) => s.attempts ?? '—' },
                { key: 'endedOnUtc', header: 'Ended', render: (s) => (s.endedOnUtc ?? '').replace('T', ' ').slice(0, 19) },
              ]}
              rows={replay.steps}
              rowKey={(s, i) => `${s.stepId}-${i}`}
            />
          </Panel>
        </div>
      )}
    </>
  );
}

/* ================================================================ PRD-ADM-003 rules ===== */

export function Rules() {
  const state = useAdminData('/admin-console/rules/sets');
  const patterns = useAdminData('/admin-console/rules/patterns');
  const log = useAdminData('/admin-console/rules/log');
  const [tab, setTab] = useState('sets');
  const [draft, setDraft] = useState({ ruleSetCode: '', code: '', expression: '', outcome: '', priority: 100 });
  const [result, setResult] = useState(null);

  const save = async () => setResult(await api.post('/admin-console/rules', draft));
  const testRule = async () => setResult(await api.post('/admin-console/rules/test', draft));

  return (
    <AdminPage
      title="Business rules"
      breadcrumb={crumb({ label: 'Configuration' }, { label: 'Business rules' })}
      intro="PRD-ADM-003 (roadmap row 392) — rules in a constrained language over declared facts, started from patterns, tested before activation, with conflict detection, precedence and an evaluation log. BR-ADM-020, BR-ADM-021."
      actions={<Button onClick={() => { state.reload(); log.reload(); }}>Refresh</Button>}
    >
      <Body state={state}>
        {(sets) => (
          <>
            <Tabs
              tabs={[
                { id: 'sets', label: 'Rule sets', count: sets.length },
                { id: 'editor', label: 'Rule editor' },
                { id: 'patterns', label: 'Pattern library', count: patterns.data?.length ?? 0 },
                { id: 'log', label: 'Evaluation log', count: log.data?.length ?? 0 },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="border border-t-0 border-nop-border bg-white">
              {tab === 'sets' && sets.map((set) => (
                <div key={set.code} className="p-3 border-b border-nop-border last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[13px] font-semibold">{set.code}</span>
                    <Badge tone="slate">{set.owningModule}</Badge>
                    <Badge tone={set.strategy === 'firstMatch' ? 'blue' : 'purple'}>{set.strategy === 'firstMatch' ? 'first match by priority' : 'all matches'}</Badge>
                    <span className="text-[12px] text-nop-muted">
                      default outcome
                      {' '}
                      <span className="font-mono">{set.defaultOutcome}</span>
                    </span>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Grid
                      dense
                      columns={[
                        { key: 'code', header: 'Rule', render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
                        { key: 'version', header: 'v', align: 'right' },
                        { key: 'expression', header: 'Expression', render: (r) => <span className="font-mono text-[12px]">{r.expression}</span> },
                        { key: 'outcome', header: 'Outcome' },
                        { key: 'priority', header: 'Priority', align: 'right' },
                        { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'Active' ? 'green' : r.status === 'Retired' ? 'slate' : 'amber'}>{r.status}</Badge> },
                        {
                          key: 'act',
                          header: '',
                          align: 'right',
                          render: (r) => (r.status === 'Draft' ? (
                            <Button
                              size="sm"
                              variant="brand"
                              onClick={async () => { setResult(await api.post(`/admin-console/rules/${r.id}/activate`, {})); state.reload(); }}
                            >
                              Activate
                            </Button>
                          ) : null),
                        },
                      ]}
                      rows={set.rules}
                      rowKey={(r) => r.id}
                    />
                    <Panel title="Declared facts" subtitle="BR-ADM-020 — the only names a rule may use" bodyClass="p-0">
                      <Grid
                        dense
                        columns={[
                          { key: 'name', header: 'Fact', render: (f) => <span className="font-mono text-[12px]">{f.name}</span> },
                          { key: 'type', header: 'Type' },
                          { key: 'classification', header: 'Classification', render: (f) => <Badge tone={['personal', 'secret'].includes(f.classification) ? 'red' : 'slate'}>{f.classification}</Badge> },
                        ]}
                        rows={set.facts}
                        rowKey={(f) => f.name}
                      />
                    </Panel>
                  </div>
                </div>
              ))}

              {tab === 'editor' && (
                <div className="p-3 grid gap-3 md:grid-cols-2">
                  <Panel title="Rule editor" subtitle="AC-ADM-003-01-01 and 01-02 — the language has no code execution; an error gives its position">
                    <div className="space-y-3">
                      <Field label="Rule set">
                        <Select value={draft.ruleSetCode} onChange={(e) => setDraft({ ...draft, ruleSetCode: e.target.value })}>
                          <option value="">Choose a rule set</option>
                          {sets.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
                        </Select>
                      </Field>
                      <Field label="Rule code"><Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></Field>
                      <Field label="Condition" hint='for example: Order.Total > 500000 and "BusinessBuyer" in Customer.Roles'>
                        <Textarea rows={3} value={draft.expression} onChange={(e) => setDraft({ ...draft, expression: e.target.value })} />
                      </Field>
                      <Field label="Outcome"><Input value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value })} /></Field>
                      <Field label="Priority"><Input type="number" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })} /></Field>
                      <div className="flex gap-2">
                        <Button onClick={testRule}>Test against the sample data</Button>
                        <Button variant="brand" onClick={async () => { await save(); state.reload(); }}>Save as draft</Button>
                      </div>
                    </div>
                  </Panel>
                  <Panel title="Result">
                    {!result && <div className="text-[13px] text-nop-muted">Test or save a rule to see the result here.</div>}
                    {result?.messageKey && <Alert tone="error" title={result.messageKey}>{result.message}</Alert>}
                    {result?.conflicts && (
                      <Alert tone="error" title="Adm.RuleConflict">
                        {result.message}
                        <div className="mt-1 text-[12px]">
                          Overlapping inputs:
                          {' '}
                          {result.conflicts.flatMap((c) => c.overlappingInputs).join(', ')}
                        </div>
                      </Alert>
                    )}
                    {result?.results && (
                      <Grid
                        dense
                        columns={[
                          { key: 'name', header: 'Sample' },
                          { key: 'pass', header: 'Result', render: (r) => <Badge tone={r.pass ? 'green' : 'slate'}>{r.pass ? 'pass' : 'fail'}</Badge> },
                          { key: 'outcome', header: 'Outcome' },
                          { key: 'conditions', header: 'Conditions that matched', render: (r) => r.conditions.map((c) => `${c.condition} = ${c.result}`).join('; ') },
                        ]}
                        rows={result.results}
                        rowKey={(r) => r.name}
                      />
                    )}
                    {result?.rule && !result.messageKey && (
                      <Alert tone="success" title="Saved as a draft">
                        {result.rule.code}
                        {' version '}
                        {result.rule.version}
                        {result.activeVersionStillInForce && ` — version ${result.activeVersionStillInForce} stays in force until this one is activated.`}
                      </Alert>
                    )}
                  </Panel>
                </div>
              )}

              {tab === 'patterns' && (
                <Body state={patterns}>
                  {(rows) => (
                    <Grid
                      dense
                      columns={[
                        { key: 'category', header: 'Category', render: (p) => <Badge tone="blue">{p.category}</Badge> },
                        { key: 'code', header: 'Pattern', render: (p) => <span className="font-mono text-[12px]">{p.code}</span> },
                        { key: 'name', header: 'Name' },
                        { key: 'template', header: 'Template', render: (p) => <span className="font-mono text-[12px]">{p.template}</span> },
                        { key: 'outcome', header: 'Outcome' },
                        { key: 'parameters', header: 'Parameters to fill in', render: (p) => p.parameters.map((x) => x.name).join(', ') },
                      ]}
                      rows={rows}
                      rowKey={(p) => p.code}
                    />
                  )}
                </Body>
              )}

              {tab === 'log' && (
                <Body state={log}>
                  {(rows) => (
                    <>
                      <Grid
                        dense
                        columns={[
                          { key: 'evaluatedOnUtc', header: 'When', render: (r) => r.evaluatedOnUtc.replace('T', ' ').slice(0, 19) },
                          { key: 'ruleSetCode', header: 'Rule set', render: (r) => <span className="font-mono text-[12px]">{r.ruleSetCode}</span> },
                          { key: 'matched', header: 'Matched rules', render: (r) => (r.matched.length ? r.matched.map((m) => `${m.code} v${m.version}`).join(', ') : '—') },
                          { key: 'outcome', header: 'Outcome', render: (r) => (Array.isArray(r.outcome) ? r.outcome.join(', ') : r.outcome) },
                          { key: 'inputs', header: 'Inputs', render: (r) => <span className="font-mono text-[11.5px]">{JSON.stringify(r.inputs)}</span> },
                          { key: 'callerRef', header: 'Caller' },
                        ]}
                        rows={rows}
                        rowKey={(r) => r.id}
                      />
                      <Citation className="p-3">
                        AC-ADM-003-05-01: inputs classified personal or secret are masked. Retention
                        follows PLT-020 (record type
                        {' '}
                        <span className="font-mono">rule-evaluation-log</span>
                        ).
                      </Citation>
                    </>
                  )}
                </Body>
              )}
            </div>
          </>
        )}
      </Body>
    </AdminPage>
  );
}

/* ==================================================== PRD-ADM-004 transaction types ===== */

export function TransactionTypes() {
  const state = useAdminData('/admin-console/transaction-types');
  const transactions = useAdminData('/admin-console/transactions');
  const deviations = useAdminData('/admin-console/deviations');
  const [tab, setTab] = useState('types');

  return (
    <AdminPage
      title="Transaction types"
      breadcrumb={crumb({ label: 'Configuration' }, { label: 'Transaction types' })}
      intro="PRD-ADM-004 (roadmap row 393) — the types the platform supports, what each needs, and the chains that join two of them in one transaction. BR-ADM-040."
      actions={<Button onClick={() => { state.reload(); transactions.reload(); }}>Refresh</Button>}
    >
      <Body state={state}>
        {(registry) => (
          <>
            <Tabs
              tabs={[
                { id: 'types', label: 'Types', count: registry.types.length },
                { id: 'chains', label: 'Chains', count: registry.chains.length },
                { id: 'transactions', label: 'Transactions', count: transactions.data?.length ?? 0 },
                { id: 'deviations', label: 'Overrides', count: deviations.data?.length ?? 0 },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="border border-t-0 border-nop-border bg-white">
              {tab === 'types' && registry.types.map((t) => (
                <div key={t.code} className="p-3 border-b border-nop-border last:border-b-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[13px] font-semibold">{t.code}</span>
                    <span className="text-[13px]">{t.name}</span>
                    <Badge tone="slate">{t.owningModule}</Badge>
                    {t.workflowCode && <Badge tone="purple">{`workflow: ${t.workflowCode}`}</Badge>}
                    {(t.requiredDocuments ?? []).map((d) => <Badge key={d} tone="amber">{`document: ${d}`}</Badge>)}
                  </div>
                  <Grid
                    dense
                    columns={[
                      { key: 'name', header: 'Parameter', render: (p) => <span className="font-mono text-[12px]">{p.name}</span> },
                      { key: 'label', header: 'Label' },
                      { key: 'dataType', header: 'Type' },
                      { key: 'requirement', header: 'Requirement', render: (p) => <Badge tone={p.requirement === 'Required' ? 'red' : p.requirement === 'Fixed' ? 'blue' : 'slate'}>{p.requirement}</Badge> },
                      { key: 'values', header: 'Allowed values', render: (p) => (p.allowedValues ?? []).join(', ') || (p.fixedValue !== undefined ? `fixed: ${p.fixedValue}` : '—') },
                      { key: 'defaultValue', header: 'Default', render: (p) => p.defaultValue ?? '—' },
                    ]}
                    rows={t.parameterSchema}
                    rowKey={(p) => p.name}
                  />
                </div>
              ))}

              {tab === 'chains' && (
                <>
                  <Grid
                    dense
                    columns={[
                      { key: 'fromType', header: 'From', render: (c) => <span className="font-mono text-[12px]">{c.fromType}</span> },
                      { key: 'toType', header: 'To', render: (c) => <span className="font-mono text-[12px]">{c.toType}</span> },
                      { key: 'parameterMapping', header: 'Parameter mapping', render: (c) => Object.entries(c.parameterMapping).map(([to, from]) => `${from} → ${to}`).join(', ') },
                      { key: 'note', header: 'Note' },
                    ]}
                    rows={registry.chains}
                    rowKey={(c) => `${c.fromType}-${c.toType}`}
                  />
                  <Citation className="p-3">
                    Decision D-02:
                    {' '}
                    {registry.notOffered.map((n) => n.code).join(' and ')}
                    {' '}
                    are not offered.
                  </Citation>
                </>
              )}

              {tab === 'transactions' && (
                <Body state={transactions}>
                  {(rows) => (
                    <Grid
                      dense
                      columns={[
                        { key: 'reference', header: 'Reference', render: (t) => <span className="font-mono text-[12px]">{t.reference}</span> },
                        { key: 'typeCode', header: 'Type' },
                        { key: 'status', header: 'Status', render: (t) => <Badge tone={t.status === 'Converted' ? 'green' : 'blue'}>{t.status}</Badge> },
                        { key: 'parameters', header: 'Parameters', render: (t) => <span className="font-mono text-[11.5px]">{JSON.stringify(t.parameters)}</span> },
                        { key: 'chainedFrom', header: 'Chained from', render: (t) => t.chainedFrom ?? '—' },
                        { key: 'workflowCaseId', header: 'Case', render: (t) => t.workflowCaseId ?? '—' },
                      ]}
                      rows={rows}
                      rowKey={(t) => t.id}
                    />
                  )}
                </Body>
              )}

              {tab === 'deviations' && (
                <Body state={deviations}>
                  {(rows) => (
                    <>
                      <Grid
                        dense
                        columns={[
                          { key: 'ref', header: 'Parameter', render: (d) => <span className="font-mono text-[12px]">{d.ref}</span> },
                          { key: 'from', header: 'Type default' },
                          { key: 'to', header: 'Overridden to' },
                          { key: 'reason', header: 'Reason' },
                          { key: 'recordedBy', header: 'By' },
                          { key: 'rule', header: 'Rule', render: (d) => <span className="font-mono text-[11.5px]">{d.rule}</span> },
                        ]}
                        rows={rows}
                        rowKey={(d) => d.id}
                      />
                      <Citation className="p-3">
                        AC-ADM-004-02-02: an override of a type parameter needs a reason and is recorded
                        as a PLT deviation (BR-PLT-017). A Fixed parameter cannot be overridden at all.
                      </Citation>
                    </>
                  )}
                </Body>
              )}
            </div>
          </>
        )}
      </Body>
    </AdminPage>
  );
}

/* ============================================================ PRD-ADM-005 eligibility === */

export function Eligibility() {
  const state = useAdminData('/admin-console/eligibility');
  const [tab, setTab] = useState('bindings');
  const [busy, setBusy] = useState(null);

  const recompute = async () => {
    setBusy(await api.post('/admin-console/eligibility/recompute', {}));
    state.reload();
  };
  const decide = async (id, decision) => {
    await api.post(`/admin-console/screening/${id}/decide`, { decision });
    state.reload();
  };

  return (
    <AdminPage
      title="Eligibility, quotas and screening"
      breadcrumb={crumb({ label: 'Configuration' }, { label: 'Eligibility and quotas' })}
      intro="PRD-ADM-005 (roadmap row 394) — who may see, buy or take part; quotas reserved for a group; screening against sanctions lists. BR-ADM-050: visibility is native ACL by customer role; quotas are enforced by the ADM cart provider and reserved at placement."
      actions={<Button variant="brand" onClick={recompute}>Recompute eligibility now</Button>}
    >
      <Body state={state}>
        {(data) => (
          <>
            {busy && (
              <Alert tone="success" title="Recomputation finished">
                {busy.changes.length === 0 ? 'No customer changed role.' : busy.changes.map((c) => `${c.customer}: ${c.added ? 'added to' : 'removed from'} ${c.role}`).join('; ')}
              </Alert>
            )}
            <Tabs
              tabs={[
                { id: 'bindings', label: 'Eligibility bindings', count: data.bindings.length },
                { id: 'quotas', label: 'Quotas', count: data.quotas.length },
                { id: 'screening', label: 'Screening review', count: data.screenings.filter((s) => s.status === 'InReview').length },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="border border-t-0 border-nop-border bg-white">
              {tab === 'bindings' && (
                <>
                  <Grid
                    dense
                    columns={[
                      { key: 'ruleSetCode', header: 'Rule set', render: (b) => <span className="font-mono text-[12px]">{b.ruleSetCode}</span> },
                      { key: 'customerRole', header: 'Customer role', render: (b) => <Badge tone="blue">{b.customerRole}</Badge> },
                      { key: 'eligibleOutcome', header: 'Eligible when the outcome is' },
                      { key: 'note', header: 'Note' },
                    ]}
                    rows={data.bindings}
                    rowKey={(b) => b.id}
                  />
                  <Citation className="p-3">
                    AC-ADM-005-01-01: a profile change, or the nightly task, adds the customer to or
                    removes them from the bound role. Native AclRecord by customer role then decides
                    which products, categories and topics the customer sees.
                  </Citation>
                </>
              )}
              {tab === 'quotas' && (
                <Grid
                  dense
                  columns={[
                    { key: 'scope', header: 'Scope' },
                    { key: 'refId', header: 'Reference', align: 'right' },
                    { key: 'customerRole', header: 'Reserved for', render: (q) => <Badge tone="blue">{q.customerRole}</Badge> },
                    { key: 'quantity', header: 'Quantity', align: 'right' },
                    { key: 'consumed', header: 'Consumed', align: 'right' },
                    { key: 'reserved', header: 'In flight', align: 'right' },
                    { key: 'left', header: 'Left', align: 'right', render: (q) => q.quantity - (q.consumed ?? 0) - (q.reserved ?? 0) },
                  ]}
                  rows={data.quotas}
                  rowKey={(q) => q.id}
                />
              )}
              {tab === 'screening' && (
                <>
                  <Grid
                    dense
                    columns={[
                      { key: 'customerEmail', header: 'Customer' },
                      { key: 'result', header: 'Result', render: (s) => <Badge tone={s.result === 'PossibleMatch' ? 'red' : 'green'}>{s.result}</Badge> },
                      { key: 'score', header: 'Score', align: 'right' },
                      { key: 'listVersion', header: 'List version' },
                      { key: 'status', header: 'Status' },
                      { key: 'reviewedBy', header: 'Reviewed by', render: (s) => s.reviewedBy ?? '—' },
                      {
                        key: 'act',
                        header: '',
                        align: 'right',
                        render: (s) => (s.status === 'InReview' ? (
                          <span className="flex gap-1 justify-end">
                            <Button size="sm" onClick={() => decide(s.id, 'clear')}>Clear</Button>
                            <Button size="sm" variant="danger" onClick={() => decide(s.id, 'confirm')}>Confirm match</Button>
                          </span>
                        ) : null),
                      },
                    ]}
                    rows={data.screenings}
                    rowKey={(s) => s.id}
                  />
                  <Citation className="p-3">
                    AC-ADM-005-03-01 and 03-02: a possible match flags the account, blocks checkout with
                    Adm.ScreeningHold and creates a review item (ADM-006). Clearing removes the flag;
                    confirming adds the customer to the SEL-013 block list. Both are audited (AUD-ADM-005).
                  </Citation>
                </>
              )}
            </div>
          </>
        )}
      </Body>
    </AdminPage>
  );
}

/* ========================================================== PRD-ADM-008 upload policy === */

export function UploadPolicy() {
  const state = useAdminData('/admin-console/uploads/contexts');
  const scans = useAdminData('/admin-console/uploads/scans');
  const [edit, setEdit] = useState(null);

  const save = async () => {
    await api.patch(`/admin-console/uploads/contexts/${edit.code}`, {
      allowedExtensions: edit.allowedExtensions.split(',').map((x) => x.trim()).filter(Boolean),
      maxSizeKb: Number(edit.maxSizeKb),
      scanEnabled: edit.scanEnabled,
      failMode: edit.failMode,
    });
    setEdit(null);
    state.reload();
  };

  return (
    <AdminPage
      title="Upload policy"
      breadcrumb={crumb({ label: 'Configuration' }, { label: 'Upload policy' })}
      intro="PRD-ADM-008 (roadmap row 397) — which file types and sizes may be uploaded in each place, and the virus scan before anything is stored. BR-ADM-060: ADM-008 is the single owner of every server-side upload check (decision SINGLE-FILTER)."
      actions={<Button onClick={() => { state.reload(); scans.reload(); }}>Refresh</Button>}
    >
      <Body state={state}>
        {(contexts) => (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Upload contexts" value={contexts.length} tone="blue" />
              <StatTile label="Module contexts (IC-ADM-08)" value={contexts.filter((c) => c.owningFeature !== 'PRD-ADM-008').length} tone="amber" />
              <StatTile label="Scans recorded" value={scans.data?.length ?? 0} tone="slate" />
            </div>

            <Panel title="Contexts" subtitle="AC-ADM-008-01-07 — every context with its owning feature, covered actions and current values; a module context is edited here, not in the owning module" bodyClass="p-0">
              <Grid
                dense
                columns={[
                  { key: 'code', header: 'Context', render: (c) => <span className="font-mono text-[12px]">{c.code}</span> },
                  { key: 'owningFeature', header: 'Owning feature', render: (c) => <Link to={`/explorer/features/${c.owningFeature}`} className="text-nop-blue hover:underline font-mono text-[12px]">{c.owningFeature}</Link> },
                  { key: 'coveredActions', header: 'Covered actions', render: (c) => <span className="font-mono text-[11.5px]">{(c.coveredActions ?? []).join(', ') || (c.ownEndpoint ? 'its own endpoint' : '—')}</span> },
                  { key: 'allowedExtensions', header: 'Allowed', render: (c) => c.allowedExtensions.join(', ') },
                  { key: 'maxSizeKb', header: 'Max KB', align: 'right' },
                  { key: 'scanEnabled', header: 'Scan', render: (c) => <Badge tone={c.scanEnabled ? 'green' : 'slate'}>{c.scanEnabled ? 'on' : 'off'}</Badge> },
                  { key: 'failMode', header: 'If the engine is down', render: (c) => <Badge tone={c.failMode === 'quarantine' ? 'amber' : 'red'}>{c.failMode}</Badge> },
                  { key: 'hasResolver', header: 'Resolver', render: (c) => (c.hasResolver ? <Badge tone="purple">resolver</Badge> : '—') },
                  {
                    key: 'act',
                    header: '',
                    align: 'right',
                    render: (c) => (
                      <Button
                        size="sm"
                        onClick={() => setEdit({
                          code: c.code, allowedExtensions: c.allowedExtensions.join(', '), maxSizeKb: c.maxSizeKb, scanEnabled: c.scanEnabled, failMode: c.failMode,
                        })}
                      >
                        Edit
                      </Button>
                    ),
                  },
                ]}
                rows={contexts}
                rowKey={(c) => c.code}
              />
            </Panel>

            {edit && (
              <Panel title={`Edit ${edit.code}`} subtitle="The stricter of the native per-field limit and this policy applies (AC-ADM-008-01-03)">
                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Allowed extensions"><Input value={edit.allowedExtensions} onChange={(e) => setEdit({ ...edit, allowedExtensions: e.target.value })} /></Field>
                  <Field label="Maximum size (KB)"><Input type="number" value={edit.maxSizeKb} onChange={(e) => setEdit({ ...edit, maxSizeKb: e.target.value })} /></Field>
                  <Field label="Scanning"><Checkbox label="Scan before storing" checked={edit.scanEnabled} onChange={(e) => setEdit({ ...edit, scanEnabled: e.target.checked })} /></Field>
                  <Field label="If the engine is unavailable">
                    <Select value={edit.failMode} onChange={(e) => setEdit({ ...edit, failMode: e.target.value })}>
                      <option value="reject">reject (Adm.UploadScanUnavailable)</option>
                      <option value="quarantine">accept into quarantine</option>
                    </Select>
                  </Field>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="brand" onClick={save}>Save</Button>
                  <Button onClick={() => setEdit(null)}>Cancel</Button>
                </div>
              </Panel>
            )}

            <Body state={scans}>
              {(rows) => (
                <Panel title="Recent uploads" subtitle="AUD-ADM-006 — every refusal is audited with the context, the file hash and the reason" bodyClass="p-0">
                  <Grid
                    dense
                    columns={[
                      { key: 'scannedOnUtc', header: 'When', render: (s) => (s.scannedOnUtc ?? '').replace('T', ' ').slice(0, 19) },
                      { key: 'fileName', header: 'File' },
                      { key: 'context', header: 'Context', render: (s) => <span className="font-mono text-[12px]">{s.context}</span> },
                      { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'Clean' ? 'green' : s.status === 'Quarantined' ? 'amber' : 'red'}>{s.status}</Badge> },
                      { key: 'result', header: 'Result' },
                      { key: 'fileHash', header: 'Hash', render: (s) => <span className="font-mono text-[11.5px]">{s.fileHash}</span> },
                    ]}
                    rows={rows.slice().reverse().slice(0, 20)}
                    rowKey={(s) => s.id}
                  />
                </Panel>
              )}
            </Body>
          </>
        )}
      </Body>
    </AdminPage>
  );
}

/* ================================================ PRD-ADM-011 and ADM-012 templates ===== */

export function Templates() {
  const library = useAdminData('/admin-console/templates/library');
  const analytics = useAdminData('/admin-console/templates/analytics');
  const shared = useAdminData('/admin-console/templates/shared');
  const workspace = useAdminData('/admin-console/templates/workspace');
  const [tab, setTab] = useState('library');
  const [inheritance, setInheritance] = useState(null);
  const [message, setMessage] = useState(null);

  const openInheritance = async (t) => setInheritance(await api.get(`/admin-console/templates/${t.id}/inheritance`));
  const publishShared = async (t) => {
    const r = await api.post(`/admin-console/templates/${t.id}/publish-shared`, {});
    setMessage(`Published ${t.code} to the shared library; removed ${r.removedIdentifiers.join(', ') || 'no'} client identifier(s).`);
    shared.reload();
  };

  return (
    <AdminPage
      title="Template library"
      breadcrumb={crumb({ label: 'Configuration' }, { label: 'Template library' })}
      intro="PRD-ADM-011 and PRD-ADM-012 (roadmap rows 400 and 401) — reusable transaction templates with versions, inheritance, cloning and approval before use; usage analytics and the shared library. SM-ADM-06."
      actions={<Button onClick={() => { library.reload(); analytics.reload(); }}>Refresh</Button>}
    >
      {message && <Alert tone="success">{message}</Alert>}
      <Body state={library}>
        {(data) => (
          <>
            <Tabs
              tabs={[
                { id: 'library', label: 'Library', count: data.clientTemplates.length },
                { id: 'analytics', label: 'Analytics', count: analytics.data?.length ?? 0 },
                { id: 'shared', label: 'Shared library', count: shared.data?.length ?? 0 },
                { id: 'workspace', label: 'Configuration workspace', count: workspace.data?.length ?? 0 },
              ]}
              active={tab}
              onChange={setTab}
            />
            <div className="border border-t-0 border-nop-border bg-white">
              {tab === 'library' && (
                <>
                  <Grid
                    dense
                    columns={[
                      { key: 'code', header: 'Template', render: (t) => <span className="font-mono text-[12px]">{t.code}</span> },
                      { key: 'name', header: 'Name' },
                      { key: 'derivedFrom', header: 'Derives from', render: (t) => <span className="font-mono text-[12px]">{t.derivedFrom ?? '—'}</span> },
                      { key: 'typeCode', header: 'Transaction type' },
                      { key: 'status', header: 'Status', render: (t) => <Badge tone={t.status === 'Active' ? 'green' : t.status === 'PendingApproval' ? 'amber' : 'slate'}>{t.status}</Badge> },
                      { key: 'activeVersionNo', header: 'Active v', align: 'right' },
                      { key: 'versions', header: 'Versions', align: 'right', render: (t) => t.versions.length },
                      {
                        key: 'act',
                        header: '',
                        align: 'right',
                        render: (t) => (
                          <span className="flex gap-1 justify-end">
                            <Button size="sm" onClick={() => openInheritance(t)}>Fields</Button>
                            <Button size="sm" onClick={() => publishShared(t)}>Publish to shared</Button>
                          </span>
                        ),
                      },
                    ]}
                    rows={data.clientTemplates}
                    rowKey={(t) => t.id}
                  />
                  <div className="p-3 grid gap-3 md:grid-cols-2">
                    <Panel title="Vertical defaults" subtitle="Supplied by the pack (PLT-003); editing a client template never changes them" bodyClass="p-0">
                      <Grid
                        dense
                        columns={[
                          { key: 'code', header: 'Template', render: (t) => <span className="font-mono text-[12px]">{t.code}</span> },
                          { key: 'values', header: 'Values', render: (t) => <span className="font-mono text-[11.5px]">{JSON.stringify(t.values)}</span> },
                        ]}
                        rows={data.verticalDefaults}
                        rowKey={(t) => t.id}
                      />
                    </Panel>
                    <Panel title="Inherited or overridden" subtitle="AC-ADM-011-03-01" bodyClass="p-0">
                      {inheritance ? (
                        <Grid
                          dense
                          columns={[
                            { key: 'field', header: 'Field', render: (f) => <span className="font-mono text-[12px]">{f.field}</span> },
                            { key: 'value', header: 'Value', render: (f) => String(f.value) },
                            { key: 'state', header: 'State', render: (f) => <Badge tone={f.overridden ? 'amber' : 'slate'}>{f.overridden ? 'overridden' : 'inherited'}</Badge> },
                            { key: 'parentValue', header: 'Parent value', render: (f) => (f.parentValue === undefined ? '—' : String(f.parentValue)) },
                          ]}
                          rows={inheritance.fields}
                          rowKey={(f) => f.field}
                        />
                      ) : <div className="p-3 text-[13px] text-nop-muted">Choose Fields on a template.</div>}
                    </Panel>
                  </div>
                </>
              )}

              {tab === 'analytics' && (
                <Body state={analytics}>
                  {(rows) => (
                    <Grid
                      dense
                      columns={[
                        { key: 'code', header: 'Template', render: (t) => <span className="font-mono text-[12px]">{t.code}</span> },
                        { key: 'transactionsInPeriod', header: 'Transactions in the period', align: 'right' },
                        { key: 'lastUsed', header: 'Last used', render: (t) => (t.lastUsed ?? '—').replace('T', ' ').slice(0, 19) },
                        { key: 'failedOrException', header: 'Failed or exception', align: 'right' },
                        { key: 'stale', header: 'Stale', render: (t) => (t.stale ? <Badge tone="red">stale</Badge> : <Badge tone="green">in use</Badge>) },
                      ]}
                      rows={rows}
                      rowKey={(t) => t.code}
                    />
                  )}
                </Body>
              )}

              {tab === 'shared' && (
                <Body state={shared}>
                  {(rows) => (
                    <>
                      <Grid
                        dense
                        columns={[
                          { key: 'code', header: 'Package', render: (p) => <span className="font-mono text-[12px]">{p.code}</span> },
                          { key: 'name', header: 'Name' },
                          { key: 'removedIdentifiers', header: 'Identifiers removed', render: (p) => p.removedIdentifiers.join(', ') || '—' },
                          { key: 'publishedBy', header: 'Published by' },
                          {
                            key: 'act',
                            header: '',
                            align: 'right',
                            render: (p) => (
                              <Button
                                size="sm"
                                variant="brand"
                                onClick={async () => {
                                  const r = await api.post(`/admin-console/templates/shared/${p.id}/adopt`, {});
                                  setMessage(`Adopted ${p.code} as a draft; it follows the ADM-011 approval before use.`);
                                  library.reload();
                                  return r;
                                }}
                              >
                                Adopt
                              </Button>
                            ),
                          },
                        ]}
                        rows={rows}
                        rowKey={(p) => p.id}
                      />
                      <Citation className="p-3">
                        AC-ADM-012-02-01: publishing removes client identifiers and the package goes to the
                        central product library outside every client instance (one installation per client,
                        PLT-002). An adopted package is a draft and follows the ADM-011 approval before use.
                      </Citation>
                    </>
                  )}
                </Body>
              )}

              {tab === 'workspace' && (
                <Body state={workspace}>
                  {(rows) => (
                    <>
                      <Grid
                        dense
                        columns={[
                          { key: 'area', header: 'Area' },
                          { key: 'feature', header: 'Owning feature', render: (w) => <Link to={`/explorer/features/${w.feature}`} className="text-nop-blue hover:underline font-mono text-[12px]">{w.feature}</Link> },
                          { key: 'route', header: 'Opens', render: (w) => <Link to={w.route} className="text-nop-blue hover:underline">{w.route}</Link> },
                        ]}
                        rows={rows}
                        rowKey={(w) => w.area}
                      />
                      <Citation className="p-3">
                        AC-ADM-011-05-01: the workspace takes the administrator to the owning screen. No area
                        is edited in a second place.
                      </Citation>
                    </>
                  )}
                </Body>
              )}
            </div>
          </>
        )}
      </Body>
    </AdminPage>
  );
}
