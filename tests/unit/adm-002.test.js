// PRD-ADM-002 Workflow engine - one test per AC, named by AC ID.
// 7 stories, 20 criteria.
//
// Held by decision WF-ENG: what is built is the PRD's Proposed option, labelled
// "Prototype default - decision WF-ENG pending" (P-1). IC-ADM-01 is engine-independent.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';
import { repository } from '../../packages/server/src/core/repository.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

const save = (body) => api.post('/api/admin-console/workflows', body);
const publish = (id, body = {}) => api.post(`/api/admin-console/workflows/${id}/publish`, body);
const definitionByCode = async (code) => (await api.get('/api/admin-console/workflows')).find((d) => d.code === code);

describe('US-ADM-002-01 design, validate, publish', () => {
  test('AC-ADM-002-01-01', async () => {
    // "accepted only if every path reaches an end, every exclusive gateway has a default path
    //  and every parallel join matches its split; otherwise refused with Adm.WorkflowInvalid
    //  naming the faulty element"
    const noEnd = await save({
      code: 'broken-no-end',
      name: 'No end',
      elements: [
        { id: 'start', type: 'start', next: 'task-1' },
        { id: 'task-1', type: 'task', name: 'Dangling' },
      ],
    });
    const refusedNoEnd = await publish(noEnd.id);
    assert.equal(refusedNoEnd.ok, false);
    assert.equal(refusedNoEnd.messageKey, 'Adm.WorkflowInvalid');
    assert.ok(refusedNoEnd.problems.some((p) => p.element === 'task-1' && /does not reach an end/.test(p.problem)),
      'the faulty element is named');

    const noDefault = await save({
      code: 'broken-gateway',
      name: 'Gateway without a default',
      elements: [
        { id: 'start', type: 'start', next: 'g' },
        { id: 'g', type: 'exclusive', branches: [{ to: 'end', condition: 'amount > 1' }] },
        { id: 'end', type: 'end' },
      ],
    });
    const refusedGateway = await publish(noDefault.id);
    assert.ok(refusedGateway.problems.some((p) => p.element === 'g' && /default path/.test(p.problem)));

    const badJoin = await save({
      code: 'broken-join',
      name: 'Join that does not match its split',
      elements: [
        { id: 'start', type: 'start', next: 'split' },
        { id: 'split', type: 'parallel-split', next: ['a', 'b'] },
        { id: 'a', type: 'task', next: 'join' },
        { id: 'b', type: 'task', next: 'join' },
        {
          id: 'join', type: 'parallel-join', split: 'split', incoming: ['a'], next: 'end',
        },
        { id: 'end', type: 'end' },
      ],
    });
    const refusedJoin = await publish(badJoin.id);
    assert.ok(refusedJoin.problems.some((p) => p.element === 'join' && /incoming branches/.test(p.problem)));

    const valid = await save({
      code: 'valid-definition',
      name: 'Valid',
      elements: [
        { id: 'start', type: 'start', next: 'g' },
        { id: 'g', type: 'exclusive', branches: [{ to: 'end-a', condition: 'amount > 100' }], default: 'end-b' },
        { id: 'end-a', type: 'end' },
        { id: 'end-b', type: 'end' },
      ],
    });
    const published = await publish(valid.id);
    assert.equal(published.ok, true);
    assert.equal(published.definition.status, 'Published');
    assert.equal(published.definition.version, 1);
  });

  test('AC-ADM-002-01-02', async () => {
    // "exactly one outgoing path is taken: the first whose condition is true, else the default"
    const definition = await save({
      code: 'gateway-order',
      name: 'Gateway order',
      elements: [
        { id: 'start', type: 'start', next: 'g' },
        {
          id: 'g',
          type: 'exclusive',
          branches: [
            { to: 'end-high', condition: 'amount > 1000' },
            { to: 'end-medium', condition: 'amount > 100' },
          ],
          default: 'end-low',
        },
        { id: 'end-high', type: 'end' },
        { id: 'end-medium', type: 'end' },
        { id: 'end-low', type: 'end' },
      ],
    });
    await publish(definition.id);

    const run = async (amount) => {
      const started = await api.post('/api/admin-console/workflow-cases', {
        definitionCode: 'gateway-order', businessKey: { type: 'Test', id: `g-${amount}` }, variables: { amount },
      });
      const replay = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
      return replay.steps.find((s) => s.stepId === 'g');
    };
    assert.equal((await run(5000)).output.taken, 'end-high', 'the first true condition, in set order');
    assert.equal((await run(500)).output.taken, 'end-medium');
    const low = await run(5);
    assert.equal(low.output.taken, 'end-low', 'the default path when none is true');
    assert.equal(low.decision, 'default');
  });

  test('AC-ADM-002-01-03', async () => {
    // "all outgoing branches become active; the matching join continues only when every
    //  incoming branch has arrived"
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'egv-service-entry', businessKey: { type: 'Application', id: 'p-1' }, variables: { identityNumber: 'MW-1', notifyTo: 'ops@example.com' },
    });
    const replay = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
    const split = replay.steps.find((s) => s.stepId === 'split');
    assert.deepEqual(split.output.branches, ['external-check', 'fee-check'], 'both branches became active');

    // while the fee-check branch is still waiting, the join has not continued
    const waiting = await repository('WorkflowCase').getByIdAsync(started.case.id);
    assert.equal(waiting.joinArrivals.join, 1, 'one branch has arrived at the join');
    assert.equal(waiting.status, 'Waiting');
    assert.equal(replay.steps.some((s) => s.stepId === 'approve'), false, 'the step after the join has not started');

    await api.post(`/api/admin-console/workflow-cases/${started.case.id}/signal`, { stepId: 'fee-check', outcome: 'done' });
    const after2 = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
    const joins = after2.steps.filter((s) => s.stepId === 'join');
    assert.equal(joins.length, 1, 'the join continued once, when every branch had arrived');
    assert.equal(joins[0].output.arrived, 2);
    assert.equal(joins[0].output.expected, 2);
    const ids = after2.steps.map((s) => s.stepId);
    assert.ok(ids.indexOf('join') < ids.indexOf('approve'), 'the approval step came after the join');
  });

  test('AC-ADM-002-01-04', async () => {
    // "it is exported and imported as BPMN 2.0 XML"
    const definition = await definitionByCode('egv-service-entry');
    const res = await api.call('GET', `/api/admin-console/workflows/${definition.id}/bpmn`, undefined, SESSIONS.admin);
    const xml = res.body.raw ?? res.body;
    assert.match(xml, /<bpmn:definitions/);
    assert.match(xml, /http:\/\/www\.omg\.org\/spec\/BPMN\/20100524\/MODEL/);
    assert.match(xml, /<bpmn:startEvent/);
    assert.match(xml, /<bpmn:parallelGateway/);
    assert.match(xml, /<bpmn:sequenceFlow/);

    const imported = await api.post('/api/admin-console/workflows/import', { xml });
    assert.ok(imported.id, 'the XML is imported back');
    assert.equal(imported.elements.length, definition.elements.length, 'with the same elements');
    assert.ok(imported.elements.some((e) => e.type === 'parallel-split'));
  });

  test('AC-ADM-002-01-05', async () => {
    // "a start request carries an idempotency key; the same request received again starts no
    //  second case"
    const first = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'idem-1' }, variables: { amount: 10 }, idempotencyKey: 'order-idem-1',
    });
    const second = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'idem-1' }, variables: { amount: 10 }, idempotencyKey: 'order-idem-1',
    });
    assert.equal(second.duplicate, true);
    assert.equal(second.case.id, first.case.id, 'no second case');
    const cases = await api.get('/api/admin-console/workflow-cases');
    assert.equal(cases.filter((c) => c.businessKeyId === 'idem-1').length, 1);
  });
});

describe('US-ADM-002-02 the ready-made steps', () => {
  test('AC-ADM-002-02-01', async () => {
    // "an ADM-006 approval item is created for that role; the case waits until the item is
    //  decided and then follows the approved or rejected path"
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'appr-1' }, variables: { amount: 50000, requesterId: null },
    });
    assert.equal(started.case.status, 'Waiting', 'the case waits at the approval step');
    const waiting = started.case.waitingOn[0];
    assert.ok(waiting.approvalItemId, 'an ADM-006 approval item was created');

    const item = await repository('ApprovalItem').getByIdAsync(waiting.approvalItemId);
    assert.equal(item.objectType, 'WorkflowStep');
    assert.equal(item.status, 'InReview');

    await api.post(`/api/admin-console/approvals/items/${item.id}/decide`, { decision: 'approve' }, SESSIONS.finance);
    const signalled = await api.post(`/api/admin-console/workflow-cases/${started.case.id}/signal`, {
      stepId: 'approve', outcome: 'approved',
    });
    assert.equal(signalled.case.status, 'Completed', 'the case followed the approved path to the end');

    // and the rejected path is a different one
    const rejectedRun = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'appr-2' }, variables: { amount: 50000 },
    });
    const rejected = await api.post(`/api/admin-console/workflow-cases/${rejectedRun.case.id}/signal`, {
      stepId: 'approve', outcome: 'rejected',
    });
    const replay = await api.get(`/api/admin-console/workflow-cases/${rejectedRun.case.id}/replay`);
    assert.equal(rejected.case.status, 'Completed');
    assert.ok(replay.steps.some((s) => s.stepId === 'end-rejected'), 'it took the rejected path');
    assert.ok(!replay.steps.some((s) => s.stepId === 'notify'), 'and not the approved one');
  });

  test('AC-ADM-002-02-02', async () => {
    // "the notification is sent through the TRK-005 engine for that event code; a definition
    //  naming an event code that is not registered is refused at publishing"
    const unregistered = await save({
      code: 'bad-event-code',
      name: 'Unknown event code',
      elements: [
        { id: 'start', type: 'start', next: 'n' },
        { id: 'n', type: 'notification', eventCode: 'Administration.NotRegistered', next: 'end' },
        { id: 'end', type: 'end' },
      ],
    });
    const refused = await publish(unregistered.id);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.WorkflowInvalid');
    assert.ok(refused.problems.some((p) => /not registered with TRK-005/.test(p.problem)));

    // the registered codes are the ones ADM registered at installation (BR-ADM-085)
    const register = await api.get('/api/admin-console/extension-register');
    const codes = register.eventCodes.map((c) => c.code);
    assert.ok(codes.includes('Administration.ApprovalDecided'));
    assert.ok(register.eventCodes.every((c) => c.owner), 'each code names its owner');

    const before2 = (await api.get('/api/tracking/messages')).length;
    await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'notify-1' }, variables: { amount: 10, notifyTo: 'ops@example.com' },
    });
    const caseRow = (await api.get('/api/admin-console/workflow-cases')).find((c) => c.businessKeyId === 'notify-1');
    await api.post(`/api/admin-console/workflow-cases/${caseRow.id}/signal`, { stepId: 'approve', outcome: 'approved' });
    const messages = await api.get('/api/tracking/messages');
    assert.ok(messages.length > before2, 'the notification step sent through TRK-005');
    assert.ok(messages.some((m) => m.event === 'Administration.ApprovalDecided'));
  });

  test('AC-ADM-002-02-03', async () => {
    // "DOC-001 generates the document from the case record, DOC-002 stores it and its reference
    //  is added to the case variables"
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'egv-service-entry', businessKey: { type: 'Application', id: 'doc-1' }, variables: { identityNumber: 'MW-9' },
    });
    await api.post(`/api/admin-console/workflow-cases/${started.case.id}/signal`, { stepId: 'fee-check', outcome: 'done' });
    await api.post(`/api/admin-console/workflow-cases/${started.case.id}/signal`, { stepId: 'approve', outcome: 'approved' });

    const caseRow = await repository('WorkflowCase').getByIdAsync(started.case.id);
    assert.ok(caseRow.variables.documentReference, 'the reference is added to the case variables');
    const document = await repository('GeneratedDocument').getOneAsync((d) => d.reference === caseRow.variables.documentReference);
    assert.ok(document, 'the document was generated and stored');
    assert.equal(document.feature, 'PRD-DOC-001');
    assert.equal(document.storedBy, 'PRD-DOC-002');
    assert.equal(document.templateCode, 'ServiceCertificate');
  });

  test('AC-ADM-002-02-04', async () => {
    // "the step calls the release operation exposed by PAY for that case and waits for its
    //  result; the workflow never changes payment or order state itself (BR-ADM-011)"
    const definition = await save({
      code: 'escrow-release',
      name: 'Escrow release',
      elements: [
        { id: 'start', type: 'start', next: 'release' },
        {
          id: 'release', type: 'payment-release', operation: 'PAY.ReleaseEscrowStage', next: 'end',
        },
        { id: 'end', type: 'end' },
      ],
    });
    await publish(definition.id);
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'escrow-release', businessKey: { type: 'Order', id: 'pay-1' }, variables: { amount: 2500 },
    });
    const replay = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
    const step = replay.steps.find((s) => s.stepId === 'release');
    assert.equal(step.status, 'Completed');
    assert.equal(step.output.operation, 'PAY.ReleaseEscrowStage');
    assert.equal(step.output.released, 2500, 'PAY returned its result');

    const operations = await api.get('/api/admin-console/step-operations');
    const op = operations.find((o) => o.code === 'PAY.ReleaseEscrowStage');
    assert.equal(op.owningModule, 'Product.PAY', 'the operation belongs to PAY');
    assert.equal(op.rule, 'BR-ADM-011');
    assert.match(op.note, /changes no payment state itself/);
  });

  test('AC-ADM-002-02-05', async () => {
    // "it calls the named operation of the step-operation catalogue with the configured timeout
    //  and retry count; after the last failed retry the case status becomes Failed and an
    //  ADM-009 exception is raised; an operation not in the catalogue cannot be named"
    const unknown = await save({
      code: 'unknown-operation',
      name: 'Unknown operation',
      elements: [
        { id: 'start', type: 'start', next: 'call' },
        { id: 'call', type: 'call', operation: 'SOMEWHERE.Else', next: 'end' },
        { id: 'end', type: 'end' },
      ],
    });
    const refused = await publish(unknown.id);
    assert.equal(refused.ok, false);
    assert.ok(refused.problems.some((p) => /not in the step-operation catalogue/.test(p.problem)));

    const exceptionsBefore = (await api.get('/api/admin-console/exceptions', SESSIONS.operations)).exceptions.length;
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'egv-service-entry', businessKey: { type: 'Application', id: 'fail-1' }, variables: { identityNumber: 'UNKNOWN' },
    });
    const caseRow = await repository('WorkflowCase').getByIdAsync(started.case.id);
    assert.equal(caseRow.status, 'Failed', 'after the last failed retry the case failed');
    assert.equal(caseRow.failedStep, 'external-check');

    const replay = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
    const step = replay.steps.find((s) => s.stepId === 'external-check');
    assert.equal(step.status, 'Failed');
    assert.equal(step.attempts, 3, 'the configured retry count was used (2 retries after the first try)');

    const after2 = await api.get('/api/admin-console/exceptions', SESSIONS.operations);
    assert.ok(after2.exceptions.length > exceptionsBefore, 'an ADM-009 exception was raised');
    const raised = after2.exceptions.find((e) => e.type === 'WorkflowStepFailed');
    assert.equal(raised.entityRef.id, started.case.id);
  });

  test('AC-ADM-002-02-06', async () => {
    // "the AI pack is off for the client: publishing is refused with Adm.WorkflowStepUnavailable"
    const definition = await save({
      code: 'ai-summary',
      name: 'AI summary',
      elements: [
        { id: 'start', type: 'start', next: 'ai' },
        { id: 'ai', type: 'ai-summarise', name: 'Summarise the case', next: 'end' },
        { id: 'end', type: 'end' },
      ],
    });
    const refused = await publish(definition.id, { packs: { AI: false } });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.WorkflowStepUnavailable');
    assert.match(refused.message, /not available for this client/);

    const allowed = await publish(definition.id, { packs: { AI: true } });
    assert.equal(allowed.ok, true, 'with the AI pack on it publishes');
  });
});

describe('US-ADM-002-03 to 05 simulation, versions, replay', () => {
  test('AC-ADM-002-03-01', async () => {
    // "the path taken, the step where it would wait or block and the outputs of each step are
    //  shown; no notification is sent, no document stored, no external call made and no payment
    //  step executed (BR-ADM-012)"
    const definition = await definitionByCode('egv-service-entry');
    const messagesBefore = (await api.get('/api/tracking/messages')).length;
    const documentsBefore = (await repository('GeneratedDocument').getAllAsync()).length;

    const run = await api.post(`/api/admin-console/workflows/${definition.id}/simulate`, {
      sampleData: { identityNumber: 'MW-123', amount: 500 },
    });
    assert.equal(run.ok, true);
    assert.ok(run.path.length > 0, 'the path taken');
    assert.ok(run.path.every((p) => p.step && p.type), 'each step with its output');
    assert.equal(run.waitingAt, 'fee-check', 'the first step where it would wait');
    assert.ok(run.suppressedSideEffects.some((s) => s.step === 'external-check'), 'the external call was not made');
    assert.ok(run.suppressedSideEffects.some((s) => s.step === 'certificate'), 'the document was not stored');
    assert.equal(run.rule, 'BR-ADM-012');

    assert.equal((await api.get('/api/tracking/messages')).length, messagesBefore, 'no notification was sent');
    assert.equal((await repository('GeneratedDocument').getAllAsync()).length, documentsBefore, 'no document was stored');
  });

  test('AC-ADM-002-04-01', async () => {
    // "running cases continue on version 1 and new cases start on version 2"
    const v1 = await definitionByCode('internal-approval');
    const running = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'ver-1' }, variables: { amount: 10 },
    });
    assert.equal(running.case.version, 1);

    const v2 = await save({
      code: 'internal-approval',
      name: 'Internal approval stages, version 2',
      elements: [...v1.elements],
    });
    assert.equal(v2.version, 2);
    await publish(v2.id);

    const newCase = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Order', id: 'ver-2' }, variables: { amount: 10 },
    });
    assert.equal(newCase.case.version, 2, 'a new case starts on version 2');
    const stillRunning = await repository('WorkflowCase').getByIdAsync(running.case.id);
    assert.equal(stillRunning.version, 1, 'the running case stays on version 1');
    assert.equal(stillRunning.definitionId, v1.id);
  });

  test('AC-ADM-002-05-01', async () => {
    // "each executed step is shown in order with time, actor, inputs, outputs and gateway
    //  decisions; the replay is read-only and changes nothing"
    const caseRow = (await api.get('/api/admin-console/workflow-cases')).find((c) => c.businessKeyId === 'g-5000');
    const replay = await api.get(`/api/admin-console/workflow-cases/${caseRow.id}/replay`);
    assert.equal(replay.readOnly, true);
    assert.ok(replay.steps.length > 0);
    for (const step of replay.steps) {
      assert.ok(step.stepId && step.stepType, 'the step');
      assert.ok(step.startedOnUtc && step.endedOnUtc, 'the time');
      assert.ok(step.actor, 'the actor');
    }
    assert.equal(replay.steps.find((s) => s.stepType === 'exclusive').decision, 'amount > 1000', 'the gateway decision');

    const before2 = JSON.stringify(await repository('WorkflowCase').getByIdAsync(caseRow.id));
    await api.get(`/api/admin-console/workflow-cases/${caseRow.id}/replay`);
    assert.equal(JSON.stringify(await repository('WorkflowCase').getByIdAsync(caseRow.id)), before2, 'the replay changed nothing');

    // an auditor may read it
    const auditorView = await api.call('GET', `/api/admin-console/workflow-cases/${caseRow.id}/replay`, undefined, SESSIONS.auditor);
    assert.equal(auditorView.status, 200, 'Administration.Core.Workflows.View is granted to the auditor');
  });
});

describe('US-ADM-002-06 and 07 the workflows the clients asked for', () => {
  test('AC-ADM-002-06-01', async () => {
    // "it passes each stage in order and continues only after every stage approves; a rejection
    //  at any stage stops it"
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Document', id: 'stage-1' }, variables: { 'Order.Total': 900000 },
    });
    const itemId = started.case.waitingOn[0].approvalItemId;
    const step1 = await api.post(`/api/admin-console/approvals/items/${itemId}/decide`, { decision: 'approve' }, SESSIONS.finance);
    assert.equal(step1.movedToStep, 2, 'it passes to the next stage');
    assert.equal(step1.item.status, 'InReview', 'and continues only after every stage approves');

    const step2 = await api.post(`/api/admin-console/approvals/items/${itemId}/decide`, { decision: 'approve' }, SESSIONS.approver);
    assert.equal(step2.item.status, 'Approved');

    // a rejection at any stage stops it
    const other = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'internal-approval', businessKey: { type: 'Document', id: 'stage-2' }, variables: { 'Order.Total': 900000 },
    });
    const rejected = await api.post(`/api/admin-console/approvals/items/${other.case.waitingOn[0].approvalItemId}/decide`, {
      decision: 'reject', reasonCode: 'POLICY_BREACH',
    }, SESSIONS.finance);
    assert.equal(rejected.item.status, 'Rejected', 'a rejection at stage 1 stops it');
  });

  test('AC-ADM-002-06-02', async () => {
    // "the event consumer only enqueues a start or signal request and the engine runner starts
    //  or advances the shipping case (BR-ADM-011)"
    const { publishAsync } = await import('../../packages/server/src/core/events.js');
    await publishAsync('ShipmentCreatedEvent', { id: 'SH-1', orderNumber: 'OP-1' });

    const queued = await repository('WorkflowStartRequest').getOneAsync((r) => r.idempotencyKey === 'ShipmentCreatedEvent-OP-1');
    assert.ok(queued, 'the consumer enqueued a start request');
    assert.equal(queued.processedOnUtc, null, 'and started nothing itself');
    assert.equal(queued.definitionCode, 'shipping-workflow');

    const run = await api.post('/api/admin-console/engine/run', {});
    assert.ok(run.processed >= 1, 'the engine runner processed it');
    const processed = await repository('WorkflowStartRequest').getByIdAsync(queued.id);
    assert.ok(processed.processedOnUtc);
    const caseRow = await repository('WorkflowCase').getByIdAsync(processed.caseId);
    assert.equal(caseRow.definitionCode, 'shipping-workflow');
  });

  test('AC-ADM-002-06-03', async () => {
    // "a fulfilment case is started through the queue and runs its configured steps, calling
    //  LOG services for allocation, picking and dispatch"
    const { publishAsync } = await import('../../packages/server/src/core/events.js');
    await publishAsync('OrderPlacedEvent', { orderNumber: 'FUL-1' });
    await api.post('/api/admin-console/engine/run', {});

    const caseRow = (await api.get('/api/admin-console/workflow-cases')).find((c) => c.businessKeyId === 'FUL-1');
    assert.ok(caseRow, 'the fulfilment case started through the queue');
    assert.equal(caseRow.definitionCode, 'fulfilment-workflow');
    const replay = await api.get(`/api/admin-console/workflow-cases/${caseRow.id}/replay`);
    const allocate = replay.steps.find((s) => s.stepId === 'allocate');
    assert.equal(allocate.status, 'Completed');
    assert.equal(allocate.input.operation, 'LOG.Allocate', 'it called the LOG service');
    assert.equal(caseRow.status, 'Waiting', 'and waits at the picking step');
  });

  test('AC-ADM-002-07-01', async () => {
    // "the application runs as a case of that definition"
    const service = await repository('Product').insertAsync({
      name: 'Business licence application', sku: 'EGV-LIC', price: 0, workflowCode: 'egv-service-entry', productType: 'egv-service', synthetic: true,
    });
    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: service.workflowCode,
      businessKey: { type: 'EgvApplication', id: 'APP-1' },
      variables: { identityNumber: 'MW-77', serviceProductId: service.id },
    });
    assert.ok(started.case, 'the application runs as a case of the service definition');
    assert.equal(started.case.definitionCode, 'egv-service-entry');
    assert.equal(started.case.businessKeyType, 'EgvApplication');
  });

  test('AC-ADM-002-07-02', async () => {
    // "applications already submitted continue on version 1; applications submitted after
    //  publication start on version 2"
    const v1 = await definitionByCode('egv-service-entry');
    const submitted = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'egv-service-entry', businessKey: { type: 'EgvApplication', id: 'APP-PIN-1' }, variables: { identityNumber: 'MW-1' },
    });
    assert.equal(submitted.case.version, 1);

    const v2 = await save({ code: 'egv-service-entry', name: 'E-government service entry, next version', elements: [...v1.elements] });
    assert.ok(v2.version > v1.version, 'a new version of the same definition');
    await publish(v2.id);

    const later = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'egv-service-entry', businessKey: { type: 'EgvApplication', id: 'APP-PIN-2' }, variables: { identityNumber: 'MW-2' },
    });
    assert.equal(later.case.version, v2.version, 'submitted after publication, so the new version');
    assert.equal((await repository('WorkflowCase').getByIdAsync(submitted.case.id)).version, v1.version,
      'the application submitted earlier stays on the version it started on');
  });

  test('AC-ADM-002-07-03', async () => {
    // "the External check step calls IC-EGV-02 through the EGV service with the configured
    //  timeout and retry count and stores the result and external reference in the case
    //  variables; the approval step starts only when every pre-approval branch has completed"
    const operations = await api.get('/api/admin-console/step-operations');
    const egv = operations.find((o) => o.code === 'EGV.VerifyOrRegister');
    assert.equal(egv.owningModule, 'Product.EGV');
    assert.equal(egv.feature, 'PRD-EGV-002');
    assert.equal(egv.defaultTimeoutMs, 4000);
    assert.equal(egv.defaultRetries, 2);

    const started = await api.post('/api/admin-console/workflow-cases', {
      definitionCode: 'egv-service-entry', businessKey: { type: 'EgvApplication', id: 'APP-EXT-1' }, variables: { identityNumber: 'MW-555' },
    });
    const caseRow = await repository('WorkflowCase').getByIdAsync(started.case.id);
    assert.equal(caseRow.variables.externalReference, 'EGV-MW-555', 'the external reference is in the case variables');
    assert.equal(caseRow.variables.verified, true, 'and the result');

    // the approval step starts only once every pre-approval branch has arrived at the join
    const beforeJoin = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
    assert.ok(beforeJoin.steps.some((s) => s.stepId === 'external-check' && s.status === 'Completed'));
    assert.equal(beforeJoin.steps.some((s) => s.stepId === 'approve'), false,
      'the approval has not started while the fee check is still open');
    assert.equal(caseRow.status, 'Waiting');

    await api.post(`/api/admin-console/workflow-cases/${started.case.id}/signal`, { stepId: 'fee-check', outcome: 'done' });
    const afterJoin = await api.get(`/api/admin-console/workflow-cases/${started.case.id}/replay`);
    const ids = afterJoin.steps.map((s) => s.stepId);
    assert.ok(ids.indexOf('external-check') < ids.indexOf('join'));
    assert.ok(ids.indexOf('fee-check') < ids.indexOf('join'));
    assert.ok(ids.indexOf('join') < ids.indexOf('approve'), 'approval waits for the join');
  });
});
