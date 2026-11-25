// PRD-ADM-002 Workflow engine.
//
// PROTOTYPE DEFAULT - DECISION WF-ENG PENDING (P-1). The PRD holds this feature until the engine
// is chosen (build or embed). IC-ADM-01 is engine-independent, so what is built here is the
// contract and the behaviour the acceptance criteria require, with a small in-process engine
// behind it. Swapping in an embedded engine replaces this file, not its callers.
//
// US-ADM-002-01  design steps with branches and parallel paths; publish only if valid
// US-ADM-002-02  ready-made steps: approval, notification, document, payment release, call
// US-ADM-002-03  simulate with sample data, no side effects
// US-ADM-002-04  versions: running cases finish on the version they started on
// US-ADM-002-05  replay a past case, read-only
// US-ADM-002-06  internal approval stages, shipping and fulfilment workflows
// US-ADM-002-07  one workflow per e-government service entry
//
// BR-ADM-010 publishing validation; BR-ADM-011 steps never change native state directly and
// event consumers only enqueue; BR-ADM-012 simulation has no side effects.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { withLockAsync, lockKey } from '../../../core/locker.js';
import { isEventCodeRegistered, sendEventAsync } from '../../product-trk/services/event-codes.js';
import { evaluateAsync, compileRule } from './rules.js';
import { raiseExceptionAsync } from './exceptions.js';

export const HELD_LABEL = 'Prototype default - decision WF-ENG pending';

const defRepo = () => repository('WorkflowDefinition');
const caseRepo = () => repository('WorkflowCase');
const execRepo = () => repository('WorkflowStepExecution');
const requestRepo = () => repository('WorkflowStartRequest');
// The step-operation catalogue is filled at installation through IC-ADM-01, so it lives beside
// the plugin, not in the data store the pack loader resets.
const operations = new Map();

/* ============================================= the step-operation catalogue (IC-ADM-01) === */

/**
 * RegisterStepOperation. A call-to-another-system step may name only an operation in this
 * catalogue: an INT-005 adapter operation, or a module connector operation its owning module
 * registered (for example EGV IC-EGV-02 VerifyOrRegister).
 */
export async function registerStepOperationAsync({
  code, owningModule, feature, inputSchema = [], outputSchema = [], defaultTimeoutMs = 5000,
  defaultRetries = 2, handler = null, note = '', rule = null,
}) {
  const existing = operations.get(code);
  if (existing && existing.owningModule !== owningModule) {
    throw new Error(`IC-ADM-01: step operation ${code} is already registered by ${existing.owningModule}`);
  }
  operations.set(code, {
    code,
    owningModule,
    feature,
    inputSchema,
    outputSchema,
    defaultTimeoutMs,
    defaultRetries,
    handler,
    note,
    rule,
  });
  return operations.get(code);
}

export const stepOperationsAsync = async () => [...operations.values()]
  .map(({ handler, ...rest }) => ({ ...rest, hasHandler: typeof handler === 'function' }))
  .sort((a, b) => a.code.localeCompare(b.code));

/* ================================================================= definitions =========== */

export const definitionsAsync = () => defRepo().getAllAsync();
export const definitionAsync = (id) => defRepo().getByIdAsync(id);

export async function publishedDefinitionAsync(code) {
  const all = await defRepo().getAllAsync((d) => d.code === code && d.status === 'Published');
  return all.sort((a, b) => b.version - a.version)[0] ?? null;
}

export async function saveDefinitionAsync({
  id = null, code, name, elements, actor = 'admin',
}) {
  if (id) {
    const existing = await defRepo().getByIdAsync(id);
    if (!existing) throw new Error('unknown definition');
    if (existing.status !== 'Draft') throw new Error('a published definition cannot be edited; publish a new version');
    return defRepo().updateAsync({ ...existing, name: name ?? existing.name, elements });
  }
  const published = await defRepo().getAllAsync((d) => d.code === code);
  return defRepo().insertAsync({
    code,
    name,
    version: published.length ? Math.max(...published.map((d) => d.version)) + 1 : 1,
    status: 'Draft',
    elements,
    createdBy: actor,
    heldBy: 'WF-ENG',
    prototypeDefault: HELD_LABEL,
  });
}

const byId = (elements) => Object.fromEntries(elements.map((e) => [e.id, e]));
const outgoing = (el) => {
  if (el.type === 'exclusive') return [...(el.branches ?? []).map((b) => b.to), el.default].filter(Boolean);
  if (Array.isArray(el.next)) return el.next;
  return el.next ? [el.next] : [];
};

/**
 * BR-ADM-010 / AC-ADM-002-01-01: a definition is published only if every path reaches an end,
 * every exclusive gateway has a default path, every parallel join matches its split and every
 * step type is available for the client. The refusal names the faulty element.
 * AC-ADM-002-02-02 adds: a notification step may name only an event code registered with TRK-005.
 * AC-ADM-002-02-05 adds: a call step may name only an operation in the catalogue.
 * AC-ADM-002-02-06 adds: a step whose pack is off for the client is unavailable.
 */
export async function validateDefinitionAsync(definition, { packs = {} } = {}) {
  const problems = [];
  const elements = definition.elements ?? [];
  const map = byId(elements);
  const start = elements.find((e) => e.type === 'start');
  if (!start) problems.push({ element: '(none)', problem: 'the definition has no start' });

  // every path reaches an end
  const reachesEnd = (id, seen = new Set()) => {
    const el = map[id];
    if (!el || seen.has(id)) return false;
    if (el.type === 'end') return true;
    const next = outgoing(el);
    if (next.length === 0) return false;
    const onward = new Set([...seen, id]);
    return next.every((n) => reachesEnd(n, onward));
  };
  for (const el of elements) {
    if (el.type === 'end') continue;
    if (!reachesEnd(el.id)) problems.push({ element: el.id, problem: 'this path does not reach an end' });
  }

  for (const el of elements) {
    if (el.type === 'exclusive' && !el.default) {
      problems.push({ element: el.id, problem: 'an exclusive gateway needs a default path' });
    }
    if (el.type === 'parallel-join') {
      const split = map[el.split];
      if (!split || split.type !== 'parallel-split') {
        problems.push({ element: el.id, problem: 'the parallel join does not name its split' });
      } else if ((split.next ?? []).length !== (el.incoming ?? []).length) {
        problems.push({ element: el.id, problem: `the parallel join has ${(el.incoming ?? []).length} incoming branches but its split has ${(split.next ?? []).length}` });
      }
    }
    if (el.type === 'notification' && !isEventCodeRegistered(el.eventCode)) {
      problems.push({ element: el.id, problem: `the event code ${el.eventCode} is not registered with TRK-005 (IC-TRK-04, BR-ADM-085)` });
    }
    if (el.type === 'call') {
      const op = operations.get(el.operation);
      if (!op) problems.push({ element: el.id, problem: `${el.operation} is not in the step-operation catalogue (IC-ADM-01)` });
    }
  }

  // AC-ADM-002-02-06: a step type whose pack is off for the client
  const unavailable = elements.filter((el) => el.type === 'ai-summarise' && packs.AI === false);
  if (unavailable.length) {
    return {
      ok: false,
      messageKey: 'Adm.WorkflowStepUnavailable',
      message: resource('Adm.WorkflowStepUnavailable', { 0: unavailable.map((e) => `${e.id} (AI summarisation)`).join(', ') }),
      problems: unavailable.map((e) => ({ element: e.id, problem: 'the AI pack is off for this client (PLT-022)' })),
    };
  }
  if (problems.length) {
    return {
      ok: false,
      messageKey: 'Adm.WorkflowInvalid',
      message: resource('Adm.WorkflowInvalid', { 0: problems.map((p) => `${p.element}: ${p.problem}`).join('; ') }),
      problems,
    };
  }
  return { ok: true, problems: [] };
}

export async function publishDefinitionAsync({ id, actor = 'admin', packs = {} }) {
  const definition = await defRepo().getByIdAsync(id);
  if (!definition) throw new Error('unknown definition');
  const check = await validateDefinitionAsync(definition, { packs });
  if (!check.ok) return { ...check, definition };
  const published = await defRepo().updateAsync({
    ...definition, status: 'Published', publishedBy: actor, publishedOnUtc: new Date().toISOString(),
  });
  await auditAsync({
    event: 'AUD-ADM-002',
    area: 'ADM',
    feature: 'PRD-ADM-002',
    entity: 'WorkflowDefinition',
    entityId: id,
    actor,
    actorRole: 'Administrators',
    before: { status: 'Draft' },
    after: { status: 'Published', version: published.version },
    note: `workflow definition ${published.code} version ${published.version} published`,
  });
  return { ok: true, definition: published };
}

export async function retireDefinitionAsync({ id, actor = 'admin' }) {
  const definition = await defRepo().getByIdAsync(id);
  const retired = await defRepo().updateAsync({ ...definition, status: 'Retired' });
  await auditAsync({
    event: 'AUD-ADM-002',
    area: 'ADM',
    feature: 'PRD-ADM-002',
    entity: 'WorkflowDefinition',
    entityId: id,
    actor,
    actorRole: 'Administrators',
    before: { status: 'Published' },
    after: { status: 'Retired' },
    note: 'running cases continue on this version',
  });
  return retired;
}

/* ================================================================= BPMN 2.0 ============== */

/** AC-ADM-002-01-04: export and import as BPMN 2.0 XML. */
export function toBpmnXml(definition) {
  const flows = [];
  const nodes = definition.elements.map((el) => {
    for (const target of outgoing(el)) {
      const branch = (el.branches ?? []).find((b) => b.to === target);
      flows.push(`    <bpmn:sequenceFlow id="flow-${el.id}-${target}" sourceRef="${el.id}" targetRef="${target}"`
        + `${branch ? ` name="${branch.condition}"` : ''} />`);
    }
    const tag = {
      start: 'startEvent',
      end: 'endEvent',
      exclusive: 'exclusiveGateway',
      'parallel-split': 'parallelGateway',
      'parallel-join': 'parallelGateway',
    }[el.type] ?? 'serviceTask';
    return `    <bpmn:${tag} id="${el.id}" name="${el.name ?? el.type}"`
      + `${tag === 'serviceTask' ? ` nop:stepType="${el.type}"` : ''} />`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:nop="http://product/adm" id="${definition.code}" targetNamespace="http://product/adm">
  <bpmn:process id="${definition.code}" name="${definition.name}" isExecutable="true">
${nodes.join('\n')}
${flows.join('\n')}
  </bpmn:process>
</bpmn:definitions>`;
}

export function fromBpmnXml(xml) {
  const elements = [];
  const tagOf = {
    startEvent: 'start', endEvent: 'end', exclusiveGateway: 'exclusive', parallelGateway: 'parallel-split',
  };
  const nodeRe = /<bpmn:(startEvent|endEvent|exclusiveGateway|parallelGateway|serviceTask)\s+id="([^"]+)"\s+name="([^"]*)"([^/]*)\/>/g;
  let m = nodeRe.exec(xml);
  while (m) {
    const [, tag, id, name, rest] = m;
    const stepType = /nop:stepType="([^"]+)"/.exec(rest)?.[1];
    elements.push({ id, name, type: stepType ?? tagOf[tag] });
    m = nodeRe.exec(xml);
  }
  const flowRe = /<bpmn:sequenceFlow[^>]*sourceRef="([^"]+)"\s+targetRef="([^"]+)"(?:\s+name="([^"]*)")?\s*\/>/g;
  const map = byId(elements);
  let f = flowRe.exec(xml);
  while (f) {
    const [, from, to, condition] = f;
    const el = map[from];
    if (el) {
      if (el.type === 'exclusive') {
        if (condition) (el.branches ??= []).push({ to, condition });
        else el.default = to;
      } else if (el.type === 'parallel-split') {
        (el.next ??= []).push(to);
      } else {
        el.next = to;
      }
    }
    f = flowRe.exec(xml);
  }
  const code = /<bpmn:process id="([^"]+)" name="([^"]*)"/.exec(xml);
  return { code: code?.[1], name: code?.[2], elements };
}

/* ====================================================================== cases ============ */

/**
 * IC-ADM-01 StartCase. AC-ADM-002-01-05: a start request carries an idempotency key, and the
 * same request received again starts no second case.
 * AC-ADM-002-04-01 and 07-02: a case is pinned to the version published when it started.
 */
export async function startCaseAsync({
  definitionCode, businessKey, variables = {}, idempotencyKey = null, enqueueOnly = false,
}) {
  const key = idempotencyKey ?? `${definitionCode}-${businessKey?.type}-${businessKey?.id}`;
  const existing = await requestRepo().getOneAsync((r) => r.idempotencyKey === key);
  if (existing) {
    return {
      ok: true, duplicate: true, requestId: existing.id, case: existing.caseId ? await caseRepo().getByIdAsync(existing.caseId) : null,
    };
  }
  const request = await requestRepo().insertAsync({
    idempotencyKey: key, definitionCode, businessKey, payload: variables, processedOnUtc: null, caseId: null,
  });
  // BR-ADM-011: an event consumer only enqueues; the engine runner (a scheduled task) processes it
  if (enqueueOnly) return { ok: true, queued: true, requestId: request.id, case: null };
  return processStartRequestAsync(request.id);
}

export async function processStartRequestAsync(requestId) {
  const request = await requestRepo().getByIdAsync(requestId);
  if (!request || request.processedOnUtc) return { ok: true, alreadyProcessed: true, requestId };
  const definition = await publishedDefinitionAsync(request.definitionCode);
  if (!definition) {
    await requestRepo().updateAsync({ ...request, processedOnUtc: new Date().toISOString(), error: 'no published definition' });
    return { ok: false, message: `no published definition for ${request.definitionCode}` };
  }
  const created = await caseRepo().insertAsync({
    definitionId: definition.id,
    definitionCode: definition.code,
    version: definition.version, // version pinning (AC-ADM-002-04-01)
    businessKeyType: request.businessKey?.type ?? null,
    businessKeyId: request.businessKey?.id ?? null,
    status: 'Running',
    variables: { ...request.payload },
    tokens: [definition.elements.find((e) => e.type === 'start')?.id].filter(Boolean),
    joinArrivals: {},
    startedOnUtc: new Date().toISOString(),
    heldBy: 'WF-ENG',
    prototypeDefault: HELD_LABEL,
  });
  await requestRepo().updateAsync({ ...request, processedOnUtc: new Date().toISOString(), caseId: created.id });
  const advanced = await advanceCaseAsync(created.id);
  return { ok: true, case: advanced, requestId };
}

/** The engine runner: the scheduled task that processes queued start requests (BR-ADM-011). */
export async function runEngineAsync() {
  const pending = await requestRepo().getAllAsync((r) => !r.processedOnUtc);
  const out = [];
  for (const r of pending) out.push(await processStartRequestAsync(r.id));
  return { processed: out.length, results: out };
}

const recordExecution = (caseId, element, extra = {}) => execRepo().insertAsync({
  caseId,
  stepId: element.id,
  stepType: element.type,
  name: element.name ?? element.type,
  startedOnUtc: new Date().toISOString(),
  endedOnUtc: new Date().toISOString(),
  ...extra,
});

/**
 * Advance the case until every token waits or ends.
 * AC-ADM-002-01-02 exclusive gateways; AC-ADM-002-01-03 parallel split and join;
 * AC-ADM-002-02-01..05 the ready-made step types; AC-ADM-002-02-05 timeout and retries, then
 * Failed with an ADM-009 exception.
 */
export async function advanceCaseAsync(caseId, { raiseException = raiseExceptionAsync, gateways = null } = {}) {
  return withLockAsync(lockKey.workflowCase(caseId), async () => {
    let wfCase = await caseRepo().getByIdAsync(caseId);
    const definition = await defRepo().getByIdAsync(wfCase.definitionId);
    const map = byId(definition.elements);
    let guard = 0;

    while (wfCase.status === 'Running' && wfCase.tokens.length && guard < 200) {
      guard += 1;
      const tokenId = wfCase.tokens[0];
      const el = map[tokenId];
      const rest = wfCase.tokens.slice(1);
      if (!el) { wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: rest }); continue; }

      if (el.type === 'start') {
        wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: [...rest, ...outgoing(el)] });
        continue;
      }

      if (el.type === 'end') {
        const remaining = rest;
        wfCase = await caseRepo().updateAsync({
          ...wfCase,
          tokens: remaining,
          status: remaining.length ? 'Running' : 'Completed',
          endedOnUtc: remaining.length ? null : new Date().toISOString(),
        });
        await recordExecution(caseId, el, { status: 'Completed' });
        continue;
      }

      if (el.type === 'exclusive') {
        // conditions are ADM-003 expressions over the case variables, in their set order
        let taken = el.default;
        let decided = 'default';
        for (const branch of el.branches ?? []) {
          let result = false;
          try {
            const ast = compileRule(branch.condition, Object.keys(wfCase.variables));
            // eslint-disable-next-line no-eval -- not eval: compileRule returns a tree the engine walks
            result = Boolean(evaluateCondition(ast, wfCase.variables));
          } catch { result = false; }
          if (result) { taken = branch.to; decided = branch.condition; break; }
        }
        await recordExecution(caseId, el, { status: 'Completed', decision: decided, output: { taken } });
        wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: [...rest, taken] });
        continue;
      }

      if (el.type === 'parallel-split') {
        await recordExecution(caseId, el, { status: 'Completed', output: { branches: el.next } });
        wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: [...rest, ...el.next] });
        continue;
      }

      if (el.type === 'parallel-join') {
        const arrivals = { ...wfCase.joinArrivals, [el.id]: (wfCase.joinArrivals[el.id] ?? 0) + 1 };
        const expected = (map[el.split]?.next ?? []).length;
        if (arrivals[el.id] < expected) {
          // this branch waits at the join; the others keep running
          wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: rest, joinArrivals: arrivals });
          continue;
        }
        await recordExecution(caseId, el, { status: 'Completed', output: { arrived: arrivals[el.id], expected } });
        wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: [...rest, ...outgoing(el)], joinArrivals: arrivals });
        continue;
      }

      if (el.type === 'approval') {
        // AC-ADM-002-02-01: an ADM-006 approval item is created and the case waits
        const { submitAsync } = await import('./approvals.js');
        const item = await submitAsync({
          objectType: el.objectType ?? 'WorkflowStep',
          objectId: `${caseId}:${el.id}`,
          requesterId: wfCase.variables.requesterId ?? null,
          summary: el.name ?? 'Workflow approval',
          amount: wfCase.variables[el.amountVariable ?? 'amount'] ?? null,
          chainCode: el.chainCode ?? null,
          approverRole: el.role ?? null,
          authorityLimit: el.authorityLimit ?? null,
          workflow: { caseId, stepId: el.id },
        });
        await recordExecution(caseId, el, { status: 'Waiting', output: { approvalItemId: item.item?.id } });
        wfCase = await caseRepo().updateAsync({
          ...wfCase, tokens: rest, status: rest.length ? 'Running' : 'Waiting', waitingOn: [...(wfCase.waitingOn ?? []), { stepId: el.id, approvalItemId: item.item?.id }],
        });
        continue;
      }

      if (el.type === 'notification') {
        // AC-ADM-002-02-02: through TRK-005 for that event code (IC-TRK-04 SendEvent)
        let sent = null;
        try {
          sent = await sendEventAsync({
            code: el.eventCode, to: wfCase.variables.notifyTo ?? 'operations@example.com', tokens: wfCase.variables, gateways,
          });
        } catch (err) { sent = { error: err.message }; }
        await recordExecution(caseId, el, { status: 'Completed', output: { eventCode: el.eventCode, sent } });
        wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: [...rest, ...outgoing(el)] });
        continue;
      }

      if (el.type === 'document') {
        // AC-ADM-002-02-03: DOC-001 generates, DOC-002 stores, the reference joins the variables
        const reference = `DOC-${el.templateCode}-${caseId}`;
        await repository('GeneratedDocument').insertAsync({
          reference, templateCode: el.templateCode, caseId, feature: 'PRD-DOC-001', storedBy: 'PRD-DOC-002', generatedOnUtc: new Date().toISOString(),
        });
        await recordExecution(caseId, el, { status: 'Completed', output: { documentReference: reference } });
        wfCase = await caseRepo().updateAsync({
          ...wfCase, tokens: [...rest, ...outgoing(el)], variables: { ...wfCase.variables, documentReference: reference },
        });
        continue;
      }

      if (el.type === 'payment-release') {
        // AC-ADM-002-02-04 and BR-ADM-011: call the release operation PAY exposes; the workflow
        // never changes payment or order state itself
        const op = operations.get(el.operation ?? 'PAY.ReleaseEscrowStage');
        let output = { calledBy: 'workflow', operation: el.operation ?? 'PAY.ReleaseEscrowStage' };
        if (op?.handler) output = { ...output, ...(await op.handler(wfCase.variables)) };
        await recordExecution(caseId, el, { status: 'Completed', output, note: 'the step called the owning module; it changed no state itself (BR-ADM-011)' });
        wfCase = await caseRepo().updateAsync({ ...wfCase, tokens: [...rest, ...outgoing(el)] });
        continue;
      }

      if (el.type === 'call') {
        const op = operations.get(el.operation);
        const retries = el.retries ?? op?.defaultRetries ?? 2;
        let attempt = 0;
        let output = null;
        let lastError = null;
        while (attempt <= retries) {
          attempt += 1;
          try {
            output = op?.handler ? await op.handler(wfCase.variables, { timeoutMs: el.timeoutMs ?? op.defaultTimeoutMs }) : { ok: true };
            if (output?.ok === false) throw new Error(output.message ?? 'the operation refused');
            lastError = null;
            break;
          } catch (err) { lastError = err.message; output = null; }
        }
        await recordExecution(caseId, el, {
          status: lastError ? 'Failed' : 'Completed', attempts: attempt, output, error: lastError, input: { operation: el.operation },
        });
        if (lastError) {
          // after the last failed retry: Failed, and an ADM-009 exception is raised
          wfCase = await caseRepo().updateAsync({
            ...wfCase, tokens: [], status: 'Failed', failedStep: el.id, failedReason: lastError,
          });
          if (raiseException) {
            await raiseException({
              type: 'WorkflowStepFailed',
              severity: 'High',
              reasonCode: 'WORKFLOW_STEP_FAILED',
              entityRef: { type: 'WorkflowCase', id: caseId },
              details: { step: el.id, operation: el.operation, attempts: attempt, error: lastError },
              allowedActions: [{ action: 'retry', batchSafe: true }, { action: 'escalate', batchSafe: true }],
              raisedBy: 'PRD-ADM-002',
            });
          }
          try {
            await sendEventAsync({ code: 'Administration.WorkflowCaseFailed', to: 'operations@example.com', tokens: { caseId, step: el.id }, gateways });
          } catch { /* the code is registered at installation; a send failure never fails the case */ }
          continue;
        }
        wfCase = await caseRepo().updateAsync({
          ...wfCase,
          tokens: [...rest, ...outgoing(el)],
          variables: {
            ...wfCase.variables, ...(output?.variables ?? {}), ...(output?.externalReference ? { externalReference: output.externalReference } : {}),
          },
        });
        continue;
      }

      // a plain task step waits for CompleteTask
      await recordExecution(caseId, el, { status: 'Waiting' });
      wfCase = await caseRepo().updateAsync({
        ...wfCase, tokens: rest, status: rest.length ? 'Running' : 'Waiting', waitingOn: [...(wfCase.waitingOn ?? []), { stepId: el.id }],
      });
    }
    // a branch that reached a join and stopped there leaves no token behind, but the case is
    // waiting on its other branches, not running
    const settled = await caseRepo().getByIdAsync(caseId);
    if (settled.status === 'Running' && settled.tokens.length === 0 && (settled.waitingOn ?? []).length > 0) {
      return caseRepo().updateAsync({ ...settled, status: 'Waiting' });
    }
    return settled;
  });
}

// the tree walker the exclusive gateway uses; kept here so the engine never evaluates strings
function evaluateCondition(ast, variables) {
  const walk = (node) => {
    switch (node.kind) {
      case 'literal': return node.value;
      case 'fact': return node.name.split('.').reduce((acc, p) => (acc == null ? acc : acc[p]), variables) ?? variables[node.name];
      case 'list': return node.items.map(walk);
      case 'not': return !walk(node.operand);
      case 'and': return Boolean(walk(node.left)) && Boolean(walk(node.right));
      case 'or': return Boolean(walk(node.left)) || Boolean(walk(node.right));
      case 'in': {
        const l = walk(node.left); const r = walk(node.right);
        return (Array.isArray(r) ? r : [r]).includes(l);
      }
      case 'arith': {
        const l = Number(walk(node.left)); const r = Number(walk(node.right));
        return node.op === '+' ? l + r : node.op === '-' ? l - r : node.op === '*' ? l * r : l / r;
      }
      case 'compare': {
        const l = walk(node.left); const r = walk(node.right);
        if (node.op === '>') return l > r;
        if (node.op === '<') return l < r;
        if (node.op === '>=') return l >= r;
        if (node.op === '<=') return l <= r;
        if (node.op === '=') return l === r;
        return l !== r;
      }
      default: return false;
    }
  };
  return walk(ast);
}

/** IC-ADM-01 CompleteTask / Signal - called by ADM-006 on a decision, or by a module. */
export async function signalCaseAsync({
  caseId, stepId, outcome = 'done', data = {}, raiseException = null,
}) {
  const wfCase = await caseRepo().getByIdAsync(caseId);
  if (!wfCase) throw new Error('unknown case');
  const waiting = (wfCase.waitingOn ?? []).find((w) => w.stepId === stepId);
  if (!waiting) return { ok: false, message: `step ${stepId} is not waiting` };
  const definition = await defRepo().getByIdAsync(wfCase.definitionId);
  const el = byId(definition.elements)[stepId];
  const next = el.type === 'approval'
    ? (outcome === 'approved' ? (el.approvedPath ?? el.next) : (el.rejectedPath ?? el.next))
    : outgoing(el)[0];
  const executions = await execRepo().getAllAsync((e) => e.caseId === caseId && e.stepId === stepId);
  const last = executions[executions.length - 1];
  if (last) await execRepo().updateAsync({ ...last, status: 'Completed', decision: outcome, output: { ...last.output, ...data } });
  await caseRepo().updateAsync({
    ...wfCase,
    status: 'Running',
    tokens: [...wfCase.tokens, next].filter(Boolean),
    waitingOn: (wfCase.waitingOn ?? []).filter((w) => w.stepId !== stepId),
    variables: { ...wfCase.variables, ...data },
  });
  const advanced = await advanceCaseAsync(caseId, { raiseException });
  return { ok: true, case: advanced };
}

export async function cancelCaseAsync({ caseId, reason, actor = 'admin' }) {
  const wfCase = await caseRepo().getByIdAsync(caseId);
  if (!reason) return { ok: false, message: 'a reason is required to cancel a case' };
  const cancelled = await caseRepo().updateAsync({
    ...wfCase, status: 'Cancelled', tokens: [], cancelReason: reason,
  });
  await auditAsync({
    event: 'AUD-ADM-002',
    area: 'ADM',
    feature: 'PRD-ADM-002',
    entity: 'WorkflowCase',
    entityId: caseId,
    actor,
    actorRole: 'Administrators',
    before: { status: wfCase.status },
    after: { status: 'Cancelled' },
    note: reason,
  });
  return { ok: true, case: cancelled };
}

export async function retryFailedStepAsync({ caseId, actor = 'operator', raiseException = null }) {
  const wfCase = await caseRepo().getByIdAsync(caseId);
  if (wfCase.status !== 'Failed') return { ok: false, message: 'only a failed case can be retried' };
  await caseRepo().updateAsync({
    ...wfCase, status: 'Running', tokens: [wfCase.failedStep], failedReason: null,
  });
  await auditAsync({
    event: 'AUD-ADM-002',
    area: 'ADM',
    feature: 'PRD-ADM-002',
    entity: 'WorkflowCase',
    entityId: caseId,
    actor,
    actorRole: 'Operations',
    before: { status: 'Failed' },
    after: { status: 'Running' },
    note: `step ${wfCase.failedStep} retried manually`,
  });
  return { ok: true, case: await advanceCaseAsync(caseId, { raiseException }) };
}

export const casesAsync = () => caseRepo().getAllAsync();
export const caseAsync = (id) => caseRepo().getByIdAsync(id);

/** AC-ADM-002-05-01: the replay - read-only, in order, with time, actor, inputs, outputs and decisions. */
export async function replayAsync(caseId) {
  const wfCase = await caseRepo().getByIdAsync(caseId);
  if (!wfCase) return null;
  const steps = (await execRepo().getAllAsync((e) => e.caseId === caseId)).sort((a, b) => a.id - b.id);
  return {
    case: wfCase,
    readOnly: true,
    version: wfCase.version,
    steps: steps.map((s) => ({
      stepId: s.stepId,
      stepType: s.stepType,
      name: s.name,
      status: s.status,
      actor: s.actor ?? 'engine',
      input: s.input ?? null,
      output: s.output ?? null,
      decision: s.decision ?? null,
      attempts: s.attempts ?? null,
      error: s.error ?? null,
      startedOnUtc: s.startedOnUtc,
      endedOnUtc: s.endedOnUtc,
    })),
  };
}

/**
 * AC-ADM-002-03-01 and BR-ADM-012: the simulator shows the path taken, the step where the case
 * would wait or block and the outputs of each step. No notification is sent, no document stored,
 * no external call made and no payment step executed.
 */
export async function simulateAsync({ definitionId, sampleData = {} }) {
  const definition = await defRepo().getByIdAsync(definitionId);
  if (!definition) throw new Error('unknown definition');
  const map = byId(definition.elements);
  const path = [];
  const sideEffects = [];
  let tokens = [definition.elements.find((e) => e.type === 'start')?.id].filter(Boolean);
  const arrivals = {};
  let waitingAt = null;
  let guard = 0;

  while (tokens.length && guard < 200) {
    guard += 1;
    const id = tokens.shift();
    const el = map[id];
    if (!el) continue;
    if (el.type === 'start') { path.push({ step: id, type: el.type }); tokens.push(...outgoing(el)); continue; }
    if (el.type === 'end') { path.push({ step: id, type: el.type, output: 'end reached' }); continue; }
    if (el.type === 'exclusive') {
      let taken = el.default;
      let condition = 'default';
      for (const branch of el.branches ?? []) {
        let result = false;
        try { result = Boolean(evaluateCondition(compileRule(branch.condition, Object.keys(sampleData)), sampleData)); } catch { result = false; }
        if (result) { taken = branch.to; condition = branch.condition; break; }
      }
      path.push({ step: id, type: el.type, output: `took ${taken} (${condition})` });
      tokens.push(taken);
      continue;
    }
    if (el.type === 'parallel-split') { path.push({ step: id, type: el.type, output: `branches ${el.next.join(', ')}` }); tokens.push(...el.next); continue; }
    if (el.type === 'parallel-join') {
      arrivals[id] = (arrivals[id] ?? 0) + 1;
      const expected = (map[el.split]?.next ?? []).length;
      if (arrivals[id] < expected) { path.push({ step: id, type: el.type, output: `waiting for ${expected - arrivals[id]} more branch(es)` }); continue; }
      path.push({ step: id, type: el.type, output: 'all branches arrived' });
      tokens.push(...outgoing(el));
      continue;
    }
    if (['approval', 'task'].includes(el.type)) {
      path.push({ step: id, type: el.type, output: 'the case would wait here' });
      waitingAt = waitingAt ?? id;
      tokens.push(...outgoing(el));
      continue;
    }
    // every step with a side effect is described, never run (BR-ADM-012)
    const described = {
      notification: `would send ${el.eventCode} through TRK-005`,
      document: `would generate ${el.templateCode} through DOC-001`,
      'payment-release': `would call ${el.operation ?? 'PAY.ReleaseEscrowStage'}`,
      call: `would call ${el.operation}`,
      'ai-summarise': 'would call the AI pack',
    }[el.type] ?? 'step';
    sideEffects.push({ step: id, suppressed: described });
    path.push({ step: id, type: el.type, output: `${described} (not executed)` });
    tokens.push(...outgoing(el));
  }
  return {
    ok: true,
    path,
    waitingAt,
    suppressedSideEffects: sideEffects,
    rule: 'BR-ADM-012',
    note: 'simulation sends no notification, stores no document, makes no external call and executes no payment step',
  };
}
