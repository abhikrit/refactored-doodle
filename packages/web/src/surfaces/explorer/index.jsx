// Product explorer - the prototype's own surface, not a nopCommerce screen.
//
// It is how the programme is run from the working prototype: every one of the 434 features with
// its stories, acceptance criteria, rules, screens, requirements and holds; the 24 areas with
// their build status by wave; the role-by-role implementation plan; the client requirement
// coverage for KTDA (95) and Malawi Post (411); and the open decisions.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Link, NavLink, useParams,
} from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct } from '../../lib/store.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Citation, Field, Grid, HeldLabel, Input, KeyValue, Panel,
  SearchPanel, Select, Spinner, StatTile, Tabs,
} from '../../ui/nop/kit.jsx';

const NAV = [
  { to: '/explorer', label: 'Overview', end: true },
  { to: '/explorer/features', label: 'Features' },
  { to: '/explorer/areas', label: 'Areas and waves' },
  { to: '/explorer/roles', label: 'Roles' },
  { to: '/explorer/journeys', label: 'Journeys' },
  { to: '/explorer/requirements', label: 'Requirement coverage' },
  { to: '/explorer/decisions', label: 'Decisions and gaps' },
  { to: '/explorer/trace', label: 'Trace report' },
];

function ExplorerShell({ children, title, intro, actions }) {
  return (
    <div className="min-h-full bg-nop-canvas">
      <div className="bg-white border-b border-nop-border">
        <div className="mx-auto max-w-[1500px] px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `px-3 py-2.5 text-[13px] whitespace-nowrap border-b-2 ${
                  isActive ? 'border-nop-blue text-nop-blue font-medium' : 'border-transparent text-nop-muted hover:text-nop-ink'}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-[1500px] px-4 py-5 space-y-4">
        {title && (
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold">{title}</h1>
              {intro && <p className="text-[13px] text-nop-muted mt-1 max-w-4xl">{intro}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

const PHASE_TONE = { P1: 'green', P2: 'amber', P3: 'slate' };

/* ----------------------------------------------------------------- overview -- */

export function Overview() {
  const {
    meta, features, areas, screens, roles,
  } = useProduct();
  const [registryCounts, setRegistryCounts] = useState(null);
  useEffect(() => { api.get('/registry').then(setRegistryCounts).catch(() => {}); }, []);

  const built = areas.filter((a) => a.built);
  const held = features.filter((f) => f.held);

  return (
    <ExplorerShell
      title="The product at a glance"
      intro="Everything on this surface is generated from /docs by scripts/generate-registries.mjs. No requirement, ID, phase, rule or acceptance criterion is typed by hand in the prototype."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Product features" value={features.length} tone="blue" to="/explorer/features" hint="PRD-<AREA>-nnn" />
        <StatTile label="Acceptance criteria" value={meta?.registry?.counts?.criteria ?? '-'} tone="green" hint="One test per AC ID is the Definition of Done" />
        <StatTile label="Screens" value={screens.length} tone="amber" to="/admin/screens" hint="From the module chapters' section 11.1" />
        <StatTile label="Held by an open decision" value={held.length} tone="red" to="/explorer/decisions" hint="Built as the PRD's Proposed option (P-1)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Session 0 - what is built" className="lg:col-span-2">
          <div className="space-y-2 text-[13px]">
            <p>
              Session 0 of the handoff (section 5.1) set up the repository, a plugin for each of the 24 areas, the
              configuration packs, the mocks, the tests and the trace report, and built one end-to-end journey to prove
              the skeleton runs. The remaining areas are scaffolded and marked not built.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6, 7].map((w) => {
                const inWave = areas.filter((a) => a.wave === w);
                return (
                  <div key={w} className="border border-nop-border rounded-sm p-2.5 bg-white">
                    <div className="flex items-center gap-2">
                      <Badge tone={inWave.every((a) => a.built) ? 'green' : inWave.some((a) => a.built) ? 'amber' : 'slate'}>
                        Wave {w}
                      </Badge>
                      <span className="text-[12.5px] font-medium">{inWave[0]?.waveName}</span>
                      <span className="ml-auto text-[11.5px] text-nop-muted">
                        {inWave.filter((a) => a.built).length}/{inWave.length} areas
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {inWave.map((a) => (
                        <Link key={a.code} to={`/explorer/areas/${a.code}`}>
                          <Badge tone={a.built ? 'green' : a.partial ? 'amber' : 'slate'}>{a.code}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Citation>
              Handoff section 5.2 build waves. Wave order: Foundation → Catalogue → Buy → Fulfil → Engage and run →
              Reach → Verticals; inside a wave, P1 first, then the workbook "Depends on" order.
            </Citation>
          </div>
        </Panel>

        <Panel title="Platform baseline">
          <KeyValue rows={[
            ['Product', `${meta?.baseline?.product} ${meta?.baseline?.tag}`],
            ['Runtime in the real build', meta?.baseline?.runtime],
            ['Decision', meta?.baseline?.decision],
            ['Prototype stack', meta?.prototype?.stack],
            ['Database', 'none - in-memory store (P-4 deviation)'],
            ['Fit', `${meta?.baseline?.fit?.configuration} configuration · ${meta?.baseline?.fit?.licensedPlugin} licensed · ${meta?.baseline?.fit?.codeLevel} code-level · ${meta?.baseline?.fit?.externalSystem} external`],
            ['Areas built so far', `${built.length} of ${areas.length}`],
            ['Roles in the catalogue', String(roles.length)],
          ]}
          />
        </Panel>
      </div>

      {registryCounts && (
        <Panel title="Generated registries" subtitle="packages/shared/data - the single source the web and the API both read">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(registryCounts)
              .filter(([, v]) => typeof v === 'number')
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => <Badge key={k} tone="slate">{k}: {v}</Badge>)}
          </div>
        </Panel>
      )}
    </ExplorerShell>
  );
}

/* ----------------------------------------------------------------- features -- */

export function FeatureList() {
  const { features, areas } = useProduct();
  const [filter, setFilter] = useState({
    q: '', area: '', phase: '', implementation: '', held: '', pack: '', wave: '',
  });

  const implementations = useMemo(() => [...new Set(features.map((f) => f.implementation))].sort(), [features]);
  const packs = useMemo(() => [...new Set(features.map((f) => f.pack))].sort(), [features]);

  const rows = features.filter((f) => (
    (!filter.q || `${f.id} ${f.name} ${f.summary}`.toLowerCase().includes(filter.q.toLowerCase()))
    && (!filter.area || f.area === filter.area)
    && (!filter.phase || f.phase === filter.phase)
    && (!filter.implementation || f.implementation === filter.implementation)
    && (!filter.pack || f.pack === filter.pack)
    && (!filter.wave || String(f.wave) === filter.wave)
    && (!filter.held || (filter.held === 'yes' ? f.held : !f.held))
  ));

  return (
    <ExplorerShell
      title={`Features (${features.length})`}
      intro="Every product feature with its phase, implementation route, pack, dependencies, acceptance criteria and the decision that holds it. Click a feature for the full chapter content."
    >
      <SearchPanel onClear={() => setFilter({ q: '', area: '', phase: '', implementation: '', held: '', pack: '', wave: '' })}>
        <Field label="ID, name or description"><Input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} /></Field>
        <Field label="Area">
          <Select value={filter.area} onChange={(e) => setFilter({ ...filter, area: e.target.value })}>
            <option value="">All areas</option>
            {areas.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
          </Select>
        </Field>
        <Field label="Phase">
          <Select value={filter.phase} onChange={(e) => setFilter({ ...filter, phase: e.target.value })}>
            <option value="">All</option>
            {['P1', 'P2', 'P3'].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Implementation">
          <Select value={filter.implementation} onChange={(e) => setFilter({ ...filter, implementation: e.target.value })}>
            <option value="">All</option>
            {implementations.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
        </Field>
        <Field label="Pack">
          <Select value={filter.pack} onChange={(e) => setFilter({ ...filter, pack: e.target.value })}>
            <option value="">All</option>
            {packs.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Build wave">
          <Select value={filter.wave} onChange={(e) => setFilter({ ...filter, wave: e.target.value })}>
            <option value="">All</option>
            {[1, 2, 3, 4, 5, 6, 7].map((w) => <option key={w} value={w}>Wave {w}</option>)}
          </Select>
        </Field>
        <Field label="Held by a decision">
          <Select value={filter.held} onChange={(e) => setFilter({ ...filter, held: e.target.value })}>
            <option value="">All</option>
            <option value="yes">Held</option>
            <option value="no">Not held</option>
          </Select>
        </Field>
      </SearchPanel>

      <Panel bodyClass="p-0" subtitle={`${rows.length} of ${features.length} features`}>
        <Grid
          dense
          columns={[
            { key: 'id', header: 'Feature', render: (f) => <Link to={`/explorer/features/${f.id}`} className="font-mono text-[12px] text-nop-blue hover:underline">{f.id}</Link> },
            { key: 'name', header: 'Name', render: (f) => <span><span className="font-medium">{f.name}</span><span className="block text-[11.5px] text-nop-muted line-clamp-1">{f.summary}</span></span> },
            { key: 'area', header: 'Area', render: (f) => <Link to={`/explorer/areas/${f.area}`}><Badge tone="slate">{f.area}</Badge></Link> },
            { key: 'phase', header: 'Phase', render: (f) => <Badge tone={PHASE_TONE[f.phase]}>{f.phase}</Badge> },
            { key: 'implementation', header: 'Implementation' },
            { key: 'pack', header: 'Pack' },
            { key: 'criteria', header: 'ACs', align: 'right', render: (f) => f.criteria.length },
            { key: 'requirements', header: 'Client reqs', align: 'right', render: (f) => f.requirements.length },
            { key: 'held', header: 'Decision', render: (f) => (f.held ? <HeldLabel feature={f} /> : <span className="text-nop-muted">-</span>) },
          ]}
          rows={rows.slice(0, 500)}
          rowKey={(f) => f.id}
        />
      </Panel>
    </ExplorerShell>
  );
}

export function FeatureDetail() {
  const { id } = useParams();
  const [f, setF] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => { setF(null); api.get(`/features/${id}`).then(setF).catch(() => {}); }, [id]);
  if (!f) return <ExplorerShell><Spinner /></ExplorerShell>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stories', label: 'User stories', count: f.storyDetail.length },
    { id: 'criteria', label: 'Acceptance criteria', count: f.criterionDetail.length },
    { id: 'rules', label: 'Business rules', count: f.ruleDetail.length },
    { id: 'screens', label: 'Screens', count: f.screenDetail.length },
    { id: 'requirements', label: 'Client requirements', count: f.requirementDetail.length },
  ];

  return (
    <ExplorerShell>
      <Breadcrumb items={[{ label: 'Features', to: '/explorer/features' }, { label: f.id }]} />
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold">{f.name}</h1>
          <p className="font-mono text-[12.5px] text-nop-muted">{f.id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={PHASE_TONE[f.phase]}>{f.phase}</Badge>
          <Badge tone="slate">{f.implementation}</Badge>
          <Badge tone="blue">Wave {f.wave}</Badge>
          <Button as="link" to={`/explorer/areas/${f.area}`} size="sm">{f.area} module</Button>
        </div>
      </div>

      {f.held && (
        <Alert tone="warning" title={`Prototype default - decision ${f.heldBy.join(' / ')} pending`}>
          This feature is held by an open decision. Decision P-1: the prototype builds the PRD's Proposed option and
          labels it everywhere, including in the trace report. A developer does not start the real build until the
          decision is recorded.
          <ul className="mt-2 space-y-1">
            {f.holdDetail.map((h) => (
              <li key={h.decision} className="text-[12.5px]">
                <span className="font-semibold">{h.decision}</span> · type {h.type} · owner {h.owner}
                {h.heldThroughDependency[f.id] ? ` · held through its dependency on ${h.heldThroughDependency[f.id]}` : ''}
                {h.ifNotConfirmed ? ` · if not confirmed: ${h.ifNotConfirmed}` : ''}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {f.readinessConditions.length > 0 && (
        <Alert tone="info" title="Readiness conditions">
          A story of this feature enters Sprint Planning only when these decisions are recorded, or the Product Owner
          accepts the Proposed design: {f.readinessConditions.join(', ')}.
        </Alert>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="border border-t-0 border-nop-border bg-white p-4">
        {tab === 'overview' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <KeyValue rows={[
                ['Description', f.description || f.summary],
                ['Why it matters', f.whyItMatters],
                ['Who benefits', f.whoBenefits],
                ['Phase', f.phase],
                ['Implementation', f.implementation],
                ['Code change', f.codeChange || '-'],
                ['Pack', f.pack],
                ['Depends on', f.dependsOn.length ? f.dependsOn.map((d) => <Link key={d} to={`/explorer/features/${d}`} className="font-mono text-[12px] text-nop-blue hover:underline mr-2">{d}</Link>) : '-'],
                ['Status', f.status || '-'],
              ]}
              />
            </div>
            <div className="space-y-3">
              {f.whatItDoes.length > 0 && (
                <div>
                  <h3 className="text-[13px] font-semibold mb-1.5">What it does</h3>
                  <ul className="list-disc pl-5 text-[13px] space-y-1">{f.whatItDoes.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              {f.clientRules.length > 0 && (
                <div>
                  <h3 className="text-[13px] font-semibold mb-1.5">Rules</h3>
                  <ul className="list-disc pl-5 text-[13px] space-y-1">{f.clientRules.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </div>
              )}
              {f.benefit && (
                <div>
                  <h3 className="text-[13px] font-semibold mb-1.5">Benefit</h3>
                  <p className="text-[13px]">{f.benefit}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'stories' && (
          <div className="space-y-3">
            {f.storyDetail.map((s) => (
              <div key={s.id} className="border border-nop-border rounded-sm p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] text-nop-muted">{s.id}</span>
                  {s.readiness && <Badge tone={s.readiness.startsWith('Ready') ? 'green' : 'amber'}>{s.readiness}</Badge>}
                </div>
                <p className="text-[13px] mt-1">{s.story}</p>
                {s.basis && <p className="text-[11.5px] text-nop-muted mt-1">Basis: {s.basis}</p>}
                {s.useCaseName && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[12px]">
                    {s.actors?.length > 0 && <div><span className="font-semibold">Actors: </span>{s.actors.join(', ')}</div>}
                    {s.trigger && <div><span className="font-semibold">Trigger: </span>{s.trigger}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {tab === 'criteria' && (
          <div className="space-y-2">
            {f.criterionDetail.map((c) => (
              <div key={c.id} className="border-l-2 border-nop-blue pl-3 py-1">
                <div className="font-mono text-[12px] text-nop-muted">{c.id} · {c.story}</div>
                <p className="text-[13px]">{c.criterion}</p>
                {c.basis && <p className="text-[11.5px] text-nop-muted">Basis: {c.basis}</p>}
              </div>
            ))}
            <Citation className="mt-3">
              Definition of Done: one automated test per acceptance criterion, named by the AC ID. The trace report
              reconciles features to ACs to tests.
            </Citation>
          </div>
        )}
        {tab === 'rules' && (
          <div className="space-y-2">
            {f.ruleDetail.length === 0 ? <p className="text-[13px] text-nop-muted">No business rule cites this feature.</p>
              : f.ruleDetail.map((r) => (
                <div key={r.id} className="border border-nop-border rounded-sm p-3">
                  <div className="font-mono text-[12px] text-nop-muted">{r.id}</div>
                  <p className="text-[13px] mt-0.5">{r.rule}</p>
                  {r.basis && <p className="text-[11.5px] text-nop-muted mt-1">Basis: {r.basis}</p>}
                </div>
              ))}
          </div>
        )}
        {tab === 'screens' && (
          <Grid
            dense
            columns={[
              { key: 'surfaceLabel', header: 'Surface' },
              { key: 'screen', header: 'Screen' },
              { key: 'nativeOrNew', header: 'Native or new' },
            ]}
            rows={f.screenDetail}
            rowKey={(s) => s.id}
            empty="No screen lists this feature."
          />
        )}
        {tab === 'requirements' && (
          <Grid
            dense
            columns={[
              { key: 'id', header: 'Requirement', render: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
              { key: 'client', header: 'Client', render: (r) => <Badge tone={r.client === 'KTDA' ? 'green' : 'red'}>{r.client}</Badge> },
              { key: 'area', header: 'Area' },
              { key: 'text', header: 'Requirement (source text)' },
              { key: 'status', header: 'Compliance status' },
            ]}
            rows={f.requirementDetail}
            rowKey={(r) => r.id}
            empty="No client requirement maps to this feature in the compliance report."
          />
        )}
      </div>
    </ExplorerShell>
  );
}

/* -------------------------------------------------------------------- areas -- */

export function AreaList() {
  const { areas, features } = useProduct();
  return (
    <ExplorerShell
      title="Areas and build waves"
      intro="24 areas, one plugin each. The wave is the handoff's build order (section 5.2); build status is what Session 0 actually delivered."
    >
      <Panel bodyClass="p-0">
        <Grid
          columns={[
            { key: 'code', header: 'Area', render: (a) => <Link to={`/explorer/areas/${a.code}`} className="font-mono text-nop-blue hover:underline">{a.code}</Link> },
            { key: 'name', header: 'Name' },
            { key: 'wave', header: 'Wave', render: (a) => `${a.wave} ${a.waveName}` },
            { key: 'features', header: 'Features', align: 'right' },
            { key: 'phases', header: 'P1 / P2 / P3', render: (a) => `${a.p1} / ${a.p2} / ${a.p3}` },
            { key: 'held', header: 'Held', align: 'right', render: (a) => features.filter((f) => f.area === a.code && f.held).length },
            {
              key: 'fit',
              header: 'Fit (config / licensed / code / external)',
              render: (a) => (a.fit ? `${a.fit.configuration} / ${a.fit.licensedPlugin} / ${a.fit.codeLevel} / ${a.fit.externalSystem}` : '-'),
            },
            {
              key: 'built',
              header: 'Session 0',
              render: (a) => <Badge tone={a.built ? 'green' : a.partial ? 'amber' : 'slate'}>{a.built ? 'behaviour built' : a.partial ? 'partial' : 'scaffold'}</Badge>,
            },
          ]}
          rows={areas}
          rowKey={(a) => a.code}
        />
      </Panel>
    </ExplorerShell>
  );
}

export function AreaDetail() {
  const { code } = useParams();
  const [area, setArea] = useState(null);
  const [tab, setTab] = useState('features');

  useEffect(() => { setArea(null); api.get(`/areas/${code}`).then(setArea).catch(() => {}); }, [code]);
  if (!area) return <ExplorerShell><Spinner /></ExplorerShell>;

  const tabs = [
    { id: 'features', label: 'Features', count: area.features.length },
    { id: 'screens', label: 'Screens', count: area.screens.length },
    { id: 'actors', label: 'Actors', count: area.actors.length },
    { id: 'permissions', label: 'Permissions', count: area.permissions.length },
    { id: 'rules', label: 'Business rules', count: area.rules.length },
    { id: 'states', label: 'State models', count: area.states.length },
    { id: 'settings', label: 'Settings', count: area.settings.length },
    { id: 'contracts', label: 'Contracts', count: area.contracts.length },
    { id: 'messages', label: 'Messages', count: area.messages.length },
  ];

  return (
    <ExplorerShell>
      <Breadcrumb items={[{ label: 'Areas', to: '/explorer/areas' }, { label: area.code }]} />
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div>
          <h1 className="text-[20px] font-semibold">{area.code} - {area.name}</h1>
          <p className="text-[12.5px] text-nop-muted font-mono">{area.modulePrd}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="blue">Wave {area.wave} {area.waveName}</Badge>
          <Badge tone={area.built ? 'green' : area.partial ? 'amber' : 'slate'}>
            {area.built ? 'behaviour built in Session 0' : area.partial ? 'partially built' : 'scaffold only'}
          </Badge>
        </div>
      </div>

      {area.buildNote && <Alert tone={area.built ? 'success' : 'warning'}>{area.buildNote}</Alert>}
      {area.plugin && (
        <Panel title="Plugin" subtitle={`In the .NET build: src/Plugins/Nop.Plugin.Product.${area.code}`}>
          <KeyValue rows={[
            ['System name', <span className="font-mono text-[12px]">{area.plugin.systemName}</span>],
            ['Directory in this repo', <span className="font-mono text-[12px]">{area.plugin.directory}</span>],
            ['Supported versions', (area.plugin.supportedVersions ?? []).join(', ')],
            ['Depends on areas', (area.plugin.dependsOnAreas ?? []).join(', ') || '-'],
            ['Holding decisions', (area.plugin.holdingDecisions ?? []).join(', ') || 'none'],
            ['Owns in Session 0', (area.owns ?? []).join(', ') || '-'],
          ]}
          />
        </Panel>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="border border-t-0 border-nop-border bg-white">
        {tab === 'features' && (
          <Grid
            dense
            columns={[
              { key: 'id', header: 'Feature', render: (f) => <Link to={`/explorer/features/${f.id}`} className="font-mono text-[12px] text-nop-blue hover:underline">{f.id}</Link> },
              { key: 'name', header: 'Name' },
              { key: 'phase', header: 'Phase', render: (f) => <Badge tone={PHASE_TONE[f.phase]}>{f.phase}</Badge> },
              { key: 'implementation', header: 'Implementation' },
              { key: 'criteria', header: 'ACs', align: 'right', render: (f) => f.criteria.length },
              { key: 'held', header: 'Decision', render: (f) => (f.held ? <HeldLabel feature={f} /> : '-') },
            ]}
            rows={area.features}
            rowKey={(f) => f.id}
          />
        )}
        {tab === 'screens' && (
          <Grid
            dense
            columns={[
              { key: 'surfaceLabel', header: 'Surface' },
              { key: 'screen', header: 'Screen' },
              { key: 'features', header: 'Features', render: (s) => s.features.map((x) => x.replace('PRD-', '')).join(', ') },
              { key: 'nativeOrNew', header: 'Native or new' },
            ]}
            rows={area.screens}
            rowKey={(s) => s.id}
          />
        )}
        {tab === 'actors' && (
          <Grid
            dense
            columns={[
              { key: 'actor', header: 'Actor' },
              { key: 'doesWhat', header: 'What they do in this module' },
              { key: 'nopRole', header: 'Role in nopCommerce' },
            ]}
            rows={area.actors}
            rowKey={(a, i) => i}
          />
        )}
        {tab === 'permissions' && (
          <Grid
            dense
            columns={[
              { key: 'systemName', header: 'Permission (system name)', render: (p) => <span className="font-mono text-[12px]">{p.raw}</span> },
              { key: 'category', header: 'Category' },
              { key: 'allows', header: 'Allows' },
              { key: 'defaultRoles', header: 'Default roles', render: (p) => p.defaultRoles.join(', ') },
            ]}
            rows={area.permissions}
            rowKey={(p, i) => i}
          />
        )}
        {tab === 'rules' && (
          <div className="divide-y divide-gray-100">
            {area.rules.map((r) => (
              <div key={r.id} className="p-3">
                <div className="font-mono text-[12px] text-nop-muted">{r.id} · {r.features.map((x) => x.replace('PRD-', '')).join(', ')}</div>
                <p className="text-[13px] mt-0.5">{r.rule}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'states' && (
          <Grid
            dense
            columns={[
              { key: 'model', header: 'Model' },
              { key: 'entity', header: 'Entity' },
              { key: 'from', header: 'From' },
              { key: 'event', header: 'Event' },
              { key: 'guard', header: 'Guard' },
              { key: 'to', header: 'To' },
              { key: 'sideEffect', header: 'Side effect' },
            ]}
            rows={area.states}
            rowKey={(s, i) => i}
          />
        )}
        {tab === 'settings' && (
          <Grid
            dense
            columns={[
              { key: 'setting', header: 'Setting' },
              { key: 'whereItLives', header: 'Where it lives' },
              { key: 'layer', header: 'Layer' },
              { key: 'ktda', header: 'KTDA (source)' },
              { key: 'mpc', header: 'Malawi Post (source)' },
            ]}
            rows={area.settings}
            rowKey={(s, i) => i}
          />
        )}
        {tab === 'contracts' && (
          <Grid
            dense
            columns={Object.keys(area.contracts[0] ?? { id: '' }).filter((k) => !['area', '_cells'].includes(k)).slice(0, 5).map((k) => ({ key: k, header: k }))}
            rows={area.contracts}
            rowKey={(c, i) => i}
          />
        )}
        {tab === 'messages' && (
          <Grid
            dense
            columns={[
              { key: 'key', header: 'Resource key', render: (m) => <span className="font-mono text-[12px]">{m.key}</span> },
              { key: 'text', header: 'Default English text (Proposed)' },
              { key: 'usedBy', header: 'Used by', render: (m) => m.usedBy.slice(0, 3).join(', ') },
            ]}
            rows={area.messages}
            rowKey={(m) => m.key}
          />
        )}
      </div>
    </ExplorerShell>
  );
}

/* -------------------------------------------------------------------- roles -- */

export function RoleList() {
  const { roles } = useProduct();
  const [q, setQ] = useState('');
  const rows = roles.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <ExplorerShell
      title={`Roles (${roles.length})`}
      intro="The beneficiary groups of L1 section 5.2, each with the features that name it, the screens those features touch, the waves they fall in and the permissions whose default roles match. This is the view to plan the build role by role."
    >
      <div className="max-w-sm"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter roles" /></div>
      <Panel bodyClass="p-0" subtitle={`${rows.length} of ${roles.length}`}>
        <Grid
          dense
          columns={[
            { key: 'name', header: 'Role', render: (r) => <Link to={`/explorer/roles/${r.id}`} className="text-nop-blue hover:underline font-medium">{r.name}</Link> },
            { key: 'features', header: 'Features', align: 'right', render: (r) => r.features.length },
            { key: 'phases', header: 'P1 / P2 / P3', render: (r) => `${r.phases.P1} / ${r.phases.P2} / ${r.phases.P3}` },
            { key: 'held', header: 'Held', align: 'right' },
            { key: 'criteria', header: 'ACs', align: 'right' },
            { key: 'screens', header: 'Screens', align: 'right', render: (r) => r.screens.length },
            { key: 'areas', header: 'Areas', render: (r) => r.areas.join(' ') },
            { key: 'waves', header: 'Waves', render: (r) => r.waves.join(', ') },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
        />
      </Panel>
      <Citation>
        The join key is the name the PRD uses in the workbook "Who benefits" column, so a role's feature count matches
        L1 section 5.2 exactly for 104 of the 106 groups; the two that differ are named slightly differently in their
        module chapter and are matched by substring.
      </Citation>
    </ExplorerShell>
  );
}

export function RoleDetail() {
  const { id } = useParams();
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState('features');
  useEffect(() => { setRole(null); api.get(`/roles/${id}`).then(setRole).catch(() => {}); }, [id]);
  if (!role) return <ExplorerShell><Spinner /></ExplorerShell>;

  const byWave = [1, 2, 3, 4, 5, 6, 7].map((w) => ({
    wave: w,
    features: role.featureDetail.filter((f) => f.wave === w),
  })).filter((x) => x.features.length);

  const tabs = [
    { id: 'features', label: 'Features', count: role.featureDetail.length },
    { id: 'plan', label: 'Implementation plan by wave', count: byWave.length },
    { id: 'screens', label: 'Screens', count: role.screenDetail.length },
    { id: 'actors', label: 'Actor rows in the chapters', count: role.actors.length },
  ];

  return (
    <ExplorerShell>
      <Breadcrumb items={[{ label: 'Roles', to: '/explorer/roles' }, { label: role.name }]} />
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <h1 className="text-[20px] font-semibold">{role.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">{role.features.length} features</Badge>
          <Badge tone="green">P1 {role.phases.P1}</Badge>
          <Badge tone="amber">held {role.held}</Badge>
          <Badge tone="slate">{role.criteria} ACs</Badge>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="border border-t-0 border-nop-border bg-white">
        {tab === 'features' && (
          <Grid
            dense
            columns={[
              { key: 'id', header: 'Feature', render: (f) => <Link to={`/explorer/features/${f.id}`} className="font-mono text-[12px] text-nop-blue hover:underline">{f.id}</Link> },
              { key: 'name', header: 'Name' },
              { key: 'area', header: 'Area', render: (f) => <Badge tone="slate">{f.area}</Badge> },
              { key: 'phase', header: 'Phase', render: (f) => <Badge tone={PHASE_TONE[f.phase]}>{f.phase}</Badge> },
              { key: 'wave', header: 'Wave', align: 'right' },
              { key: 'criteria', header: 'ACs', align: 'right', render: (f) => f.criteria.length },
              { key: 'held', header: 'Decision', render: (f) => (f.held ? <HeldLabel feature={f} /> : '-') },
            ]}
            rows={role.featureDetail}
            rowKey={(f) => f.id}
          />
        )}
        {tab === 'plan' && (
          <div className="p-3 space-y-3">
            {byWave.map((w) => (
              <div key={w.wave} className="border border-nop-border rounded-sm">
                <div className="px-3 py-2 bg-nop-head flex items-center gap-2">
                  <Badge tone="blue">Wave {w.wave}</Badge>
                  <span className="text-[13px] font-medium">{w.features.length} features for this role</span>
                  <span className="ml-auto text-[12px] text-nop-muted">
                    {w.features.reduce((s, f) => s + f.criteria.length, 0)} acceptance criteria ·
                    {' '}{w.features.filter((f) => f.held).length} held
                  </span>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {w.features.map((f) => (
                    <Link key={f.id} to={`/explorer/features/${f.id}`} title={f.name}>
                      <Badge tone={f.held ? 'amber' : f.phase === 'P1' ? 'green' : 'slate'}>{f.id.replace('PRD-', '')}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Citation>
              Inside a wave the handoff orders the work P1 first, then P2, then P3, and inside a module by the workbook
              "Depends on" column. A held feature is not started until its decision is recorded.
            </Citation>
          </div>
        )}
        {tab === 'screens' && (
          <Grid
            dense
            columns={[
              { key: 'surfaceLabel', header: 'Surface' },
              { key: 'screen', header: 'Screen' },
              { key: 'area', header: 'Area' },
              { key: 'nativeOrNew', header: 'Native or new' },
            ]}
            rows={role.screenDetail}
            rowKey={(s) => s.id}
          />
        )}
        {tab === 'actors' && (
          <Grid
            dense
            columns={[
              { key: 'area', header: 'Area' },
              { key: 'actor', header: 'Actor' },
              { key: 'doesWhat', header: 'What they do in this module' },
              { key: 'nopRole', header: 'Role in nopCommerce' },
            ]}
            rows={role.actors}
            rowKey={(a, i) => i}
            empty="No actor row in a module chapter matches this beneficiary group by name."
          />
        )}
      </div>
    </ExplorerShell>
  );
}

/* ----------------------------------------------------------------- journeys -- */

export function Journeys() {
  const [journeys, setJourneys] = useState(null);
  useEffect(() => { api.get('/registry/journeys').then(setJourneys).catch(() => {}); }, []);
  return (
    <ExplorerShell
      title="Key user journeys"
      intro="The journeys the client edition states, module by module (Client-PRD section 6). The first bullet of Cart and checkout is the one Session 0 built end to end."
    >
      {!journeys ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {journeys.map((j) => (
            <Panel key={j.id} title={`${j.n}. ${j.title}`} bodyClass="p-3">
              <ul className="space-y-2 text-[13px]">
                {j.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-nop-muted font-mono text-[11px] mt-0.5">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              {j.title.startsWith('Cart and checkout') && (
                <div className="mt-3">
                  <Alert tone="success" title="Built in Session 0">
                    Walk it: storefront → add items from two sellers → choose delivery for one and collection for the
                    other → pay once with mobile money → the order splits into sub-orders under one reference → track it →
                    hand it over at the outlet against the pickup code.
                  </Alert>
                  <Button as="link" to="/" variant="brand" size="sm" className="mt-2">Open the storefront</Button>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </ExplorerShell>
  );
}

/* ------------------------------------------------------------- requirements -- */

export function Requirements() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState({ q: '', client: '', status: '' });
  useEffect(() => { api.get('/registry/requirements').then(setRows).catch(() => {}); }, []);

  const statuses = useMemo(() => [...new Set((rows ?? []).map((r) => r.status))].sort(), [rows]);
  const filtered = (rows ?? []).filter((r) => (
    (!filter.q || `${r.id} ${r.text}`.toLowerCase().includes(filter.q.toLowerCase()))
    && (!filter.client || r.client === filter.client)
    && (!filter.status || r.status === filter.status)
  ));

  const ktda = (rows ?? []).filter((r) => r.client === 'KTDA');
  const mpc = (rows ?? []).filter((r) => r.client === 'MPC');

  return (
    <ExplorerShell
      title="Client requirement coverage"
      intro="The requirement baseline from the compliance report: KTDA 95 and Malawi Post 411, each with its compliance status and the P1 features that deliver it."
    >
      {!rows ? <Spinner /> : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatTile label="KTDA requirements" value={ktda.length} tone="green" />
            <StatTile label="Malawi Post requirements" value={mpc.length} tone="red" />
            <StatTile label="Compliant" value={rows.filter((r) => r.status.startsWith('Compliant')).length} tone="blue" />
            <StatTile label="Project service, not a product feature" value={rows.filter((r) => r.status.startsWith('Project service')).length} tone="slate" />
          </div>
          <SearchPanel onClear={() => setFilter({ q: '', client: '', status: '' })}>
            <Field label="Requirement or text"><Input value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} /></Field>
            <Field label="Client">
              <Select value={filter.client} onChange={(e) => setFilter({ ...filter, client: e.target.value })}>
                <option value="">Both</option>
                <option value="KTDA">KTDA</option>
                <option value="MPC">Malawi Post</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                <option value="">All</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </SearchPanel>
          <Panel bodyClass="p-0" subtitle={`${filtered.length} of ${rows.length}`}>
            <Grid
              dense
              columns={[
                { key: 'id', header: 'Requirement', render: (r) => <span className="font-mono text-[12px]">{r.id}</span> },
                { key: 'client', header: 'Client', render: (r) => <Badge tone={r.client === 'KTDA' ? 'green' : 'red'}>{r.client}</Badge> },
                { key: 'area', header: 'Area' },
                { key: 'text', header: 'Requirement (source text)' },
                { key: 'status', header: 'Status' },
                {
                  key: 'features',
                  header: 'P1 features',
                  render: (r) => (
                    <span className="flex flex-wrap gap-1">
                      {r.features.map((f) => <Link key={f} to={`/explorer/features/${f}`} className="font-mono text-[11px] text-nop-blue hover:underline">{f.replace('PRD-', '')}</Link>)}
                    </span>
                  ),
                },
              ]}
              rows={filtered.slice(0, 400)}
              rowKey={(r) => r.id}
            />
          </Panel>
        </>
      )}
    </ExplorerShell>
  );
}

/* ---------------------------------------------------------------- decisions -- */

export function Decisions() {
  const [data, setData] = useState(null);
  const [holds, setHolds] = useState(null);
  const [tab, setTab] = useState('holds');
  useEffect(() => {
    api.get('/registry/decisions').then(setData).catch(() => {});
    api.get('/registry/holds').then(setHolds).catch(() => {});
  }, []);

  const tabs = [
    { id: 'holds', label: 'Holds', count: holds?.holds?.length },
    { id: 'readiness', label: 'Readiness conditions', count: holds?.readiness?.length },
    { id: 'log', label: 'Decision log', count: data?.decisions?.length },
    { id: 'gaps', label: 'Gap register', count: data?.gaps?.length },
  ];

  return (
    <ExplorerShell
      title="Decisions, holds and gaps"
      intro="100 of the 434 features are held by an open decision. Decision P-1 for this prototype: build the PRD's Proposed option and label it 'Prototype default - decision <ID> pending' everywhere."
    >
      {!data || !holds ? <Spinner /> : (
        <>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="border border-t-0 border-nop-border bg-white">
            {tab === 'holds' && (
              <div className="divide-y divide-gray-100">
                {holds.holds.map((h) => (
                  <div key={h.decision} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold">{h.decision}</span>
                      <Badge tone="amber">{h.features.length} features held</Badge>
                      <Badge tone="slate">type {h.type}</Badge>
                      <span className="text-[12px] text-nop-muted">owner {h.owner}</span>
                    </div>
                    {h.ifNotConfirmed && <p className="text-[12.5px] text-nop-muted mt-1">If not confirmed: {h.ifNotConfirmed}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {h.features.map((f) => (
                        <Link key={f} to={`/explorer/features/${f}`} title={Object.keys(h.heldThroughDependency).includes(f) ? `held through its dependency on ${h.heldThroughDependency[f]}` : undefined}>
                          <Badge tone={Object.keys(h.heldThroughDependency).includes(f) ? 'slate' : 'amber'}>{f.replace('PRD-', '')}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'readiness' && (
              <Grid
                dense
                columns={[
                  { key: 'decision', header: 'Decision', render: (r) => <span className="font-mono text-[12.5px] font-semibold">{r.decision}</span> },
                  { key: 'kind', header: 'Kind' },
                  { key: 'owner', header: 'Owner' },
                  {
                    key: 'features',
                    header: 'Features affected',
                    render: (r) => (
                      <span className="flex flex-wrap gap-1">
                        {r.features.map((f) => <Link key={f} to={`/explorer/features/${f}`}><Badge tone="slate">{f.replace('PRD-', '')}</Badge></Link>)}
                      </span>
                    ),
                  },
                ]}
                rows={holds.readiness}
                rowKey={(r) => r.decision}
              />
            )}
            {tab === 'log' && (
              <Grid
                dense
                columns={[
                  { key: 'id', header: 'ID', render: (d) => <span className="font-mono text-[12.5px]">{d.id}</span> },
                  { key: 'item', header: 'Item' },
                  { key: 'source', header: 'Source' },
                  { key: 'status', header: 'Status / owner', render: (d) => <Badge tone={d.open ? 'amber' : 'green'}>{d.status}</Badge> },
                ]}
                rows={data.decisions}
                rowKey={(d) => d.id}
              />
            )}
            {tab === 'gaps' && (
              <Grid
                dense
                columns={[
                  { key: 'id', header: 'ID', render: (g) => <span className="font-mono text-[12.5px]">{g.id}</span> },
                  { key: 'topic', header: 'Topic' },
                  { key: 'question', header: 'Question (not stated in source)' },
                  { key: 'affects', header: 'Affected PRD IDs', render: (g) => g.affects.join(', ') },
                ]}
                rows={data.gaps}
                rowKey={(g) => g.id}
              />
            )}
          </div>
        </>
      )}
    </ExplorerShell>
  );
}

/* -------------------------------------------------------------------- trace -- */

export function Trace() {
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch('/trace/trace.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('trace/trace.json has not been generated yet'))))
      .then(setTrace)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <ExplorerShell
      title="Trace report"
      intro="Feature → story → acceptance criterion → test → result, with the requirement coverage for both clients. Regenerate it with npm run trace after any test run."
    >
      {error && (
        <Alert tone="warning" title="Not loaded in the browser">
          {error}. The generated report is in the repository at <span className="font-mono">trace/trace.md</span> and{' '}
          <span className="font-mono">trace/trace.json</span>; run <span className="font-mono">npm run verify</span> to rebuild it.
        </Alert>
      )}
      {trace && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatTile label="Features" value={trace.totals.features} tone="blue" />
            <StatTile label="Built and passing" value={trace.totals.built} tone="green" />
            <StatTile label="Held, prototype default" value={trace.totals.heldWithDefault} tone="amber" />
            <StatTile label="Mocked externally" value={trace.totals.mocked} tone="slate" />
            <StatTile label="Not built" value={trace.totals.notBuilt} tone="red" />
          </div>
          <Panel title="Tests by acceptance criterion" bodyClass="p-0">
            <Grid
              dense
              columns={[
                { key: 'criterion', header: 'AC ID', render: (r) => <span className="font-mono text-[12px]">{r.criterion}</span> },
                { key: 'feature', header: 'Feature', render: (r) => <Link to={`/explorer/features/${r.feature}`} className="font-mono text-[12px] text-nop-blue hover:underline">{r.feature}</Link> },
                { key: 'test', header: 'Test' },
                { key: 'status', header: 'Result', render: (r) => <Badge tone={r.status === 'pass' ? 'green' : r.status === 'fail' ? 'red' : 'slate'}>{r.status}</Badge> },
              ]}
              rows={trace.tests ?? []}
              rowKey={(r) => r.criterion}
            />
          </Panel>
        </>
      )}
    </ExplorerShell>
  );
}
