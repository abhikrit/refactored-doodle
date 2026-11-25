// PRD-ADM-003 Business rules engine - one test per acceptance criterion, named by AC ID.
// 6 stories, 9 criteria.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync, SESSIONS } from './helpers/adm.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

describe('US-ADM-003-01 write rules in a constrained language', () => {
  test('AC-ADM-003-01-01', async () => {
    // "the rule is saved as a draft; the language offers no code execution, reflection, file,
    //  network or database access"
    const saved = await api.post('/api/admin-console/rules', {
      ruleSetCode: 'order-approval',
      code: 'BUSINESS-BUYER-REVIEW',
      expression: 'Order.Total > 100000 and "BusinessBuyer" in Customer.Roles',
      outcome: 'RequireApproval',
      priority: 200,
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.rule.status, 'Draft', 'a new rule is a draft');
    assert.equal(saved.rule.version, 1);

    // BR-ADM-020: there is no way to execute anything from rule text
    const { compileRule } = await import('../../packages/server/src/plugins/product-adm/services/rules.js');
    const facts = ['Order.Total', 'Customer.Roles'];
    for (const attempt of [
      'process.exit(1)',
      'require("fs")',
      'Order.Total.constructor("return 1")()',
      'fetch("http://example.com")',
    ]) {
      assert.throws(() => compileRule(attempt, facts), /RuleSyntaxError|not valid|not a fact|function call/,
        `the language refuses ${attempt}`);
    }
    // and the facts it does accept are only the declared ones
    assert.ok(compileRule('Order.Total > 1', facts), 'a declared fact compiles');
  });

  test('AC-ADM-003-01-02', async () => {
    // "refused with message Adm.RuleInvalid giving the position of the error"
    const undeclared = await api.post('/api/admin-console/rules', {
      ruleSetCode: 'order-approval', code: 'BAD-FACT', expression: 'Order.Weight > 10', outcome: 'RequireApproval',
    });
    assert.equal(undeclared.ok, false);
    assert.equal(undeclared.messageKey, 'Adm.RuleInvalid');
    assert.equal(undeclared.position, 1, 'the position of the undeclared fact');
    assert.match(undeclared.message, /not valid at position 1/);
    assert.match(undeclared.detail, /"Order\.Weight" is not a fact of this rule set/);

    const syntax = await api.post('/api/admin-console/rules', {
      ruleSetCode: 'order-approval', code: 'BAD-SYNTAX', expression: 'Order.Total > ', outcome: 'RequireApproval',
    });
    assert.equal(syntax.ok, false);
    assert.equal(syntax.messageKey, 'Adm.RuleInvalid');
    assert.ok(syntax.position > 1);
  });

  test('AC-ADM-003-01-03', async () => {
    // "the outcome RequireApproval is returned with the rule ID and version; for a total not
    //  above A the default outcome is returned"
    const above = await api.post('/api/admin-console/rules/evaluate', {
      ruleSetCode: 'order-approval',
      facts: { 'Order.Total': 750000, 'Order.Currency': 'MWK', 'Customer.Roles': ['Registered'], 'Customer.Email': 'buyer@example.com' },
      callerRef: 'test-above',
    });
    assert.equal(above.outcome, 'RequireApproval');
    assert.equal(above.matched.length, 1);
    assert.equal(above.matched[0].code, 'ORDER-OVER-LIMIT');
    assert.ok(above.matched[0].ruleId > 0, 'the rule ID');
    assert.equal(above.matched[0].version, 1, 'the rule version');

    const below = await api.post('/api/admin-console/rules/evaluate', {
      ruleSetCode: 'order-approval',
      facts: { 'Order.Total': 12000, 'Order.Currency': 'MWK', 'Customer.Roles': ['Registered'], 'Customer.Email': 'buyer@example.com' },
      callerRef: 'test-below',
    });
    assert.equal(below.outcome, 'NoApproval', 'the rule set default outcome');
    assert.equal(below.matched.length, 0);
  });
});

describe('US-ADM-003-02 the pattern library', () => {
  test('AC-ADM-003-02-01', async () => {
    // "patterns in the categories eligibility, pricing, validation and routing; creating from a
    //  pattern makes a draft copy with the parameters to fill in; the pattern is unchanged"
    const patterns = await api.get('/api/admin-console/rules/patterns');
    const categories = [...new Set(patterns.map((p) => p.category))].sort();
    assert.deepEqual(categories, ['eligibility', 'pricing', 'routing', 'validation']);

    const pattern = patterns.find((p) => p.code === 'APPROVAL-OVER-AMOUNT');
    const created = await api.post('/api/admin-console/rules/from-pattern', {
      patternId: pattern.id, ruleSetCode: 'order-approval', parameters: { amount: 250000 },
    });
    assert.equal(created.ok, true);
    assert.equal(created.rule.status, 'Draft', 'a draft copy');
    assert.equal(created.rule.expression, 'Order.Total > 250000');
    assert.deepEqual(created.unfilledParameters, []);
    assert.equal(created.pattern.template, 'Order.Total > {amount}', 'the pattern itself is unchanged');

    const partial = await api.post('/api/admin-console/rules/from-pattern', {
      patternId: patterns.find((p) => p.code === 'ELIGIBLE-BY-COUNTRY').id, ruleSetCode: 'scheme-eligibility', parameters: { country: 'MW' },
    });
    assert.deepEqual(partial.unfilledParameters, ['spend'], 'the parameters still to fill in are listed');
  });
});

describe('US-ADM-003-03 test before activating', () => {
  test('AC-ADM-003-03-01', async () => {
    // "each input is shown as pass or fail with the conditions that matched; no entry is written
    //  to the production evaluation log and no outcome is acted on"
    const before2 = (await api.get('/api/admin-console/rules/log?ruleSet=order-approval')).length;
    const run = await api.post('/api/admin-console/rules/test', {
      ruleSetCode: 'order-approval', expression: 'Order.Total > 500000', outcome: 'RequireApproval',
    });
    assert.equal(run.ok, true);
    assert.equal(run.results.length, 3, 'one result per sample input');
    const small = run.results.find((r) => r.name === 'small order');
    const large = run.results.find((r) => r.name === 'large order');
    assert.equal(small.pass, false);
    assert.equal(large.pass, true);
    assert.ok(large.conditions.length > 0, 'the conditions that matched are shown');
    assert.match(large.conditions[0].condition, /Order\.Total > 500000/);

    const after2 = (await api.get('/api/admin-console/rules/log?ruleSet=order-approval')).length;
    assert.equal(after2, before2, 'the test writes no production evaluation-log entry (BR-ADM-012)');
    assert.equal(run.sideEffects, 'none (BR-ADM-012)');
  });
});

describe('US-ADM-003-04 conflicts and precedence', () => {
  test('AC-ADM-003-04-01', async () => {
    // "activation is refused with message Adm.RuleConflict naming both rules, until a precedence
    //  order is set or a rule is changed"
    const draft = await api.post('/api/admin-console/rules', {
      ruleSetCode: 'order-approval',
      code: 'LARGE-ORDERS-AUTO',
      expression: 'Order.Total > 600000',
      outcome: 'AutoApprove', // a different outcome from the active ORDER-OVER-LIMIT rule
      priority: 100, // the same priority, so precedence resolves nothing
    });
    const refused = await api.post(`/api/admin-console/rules/${draft.rule.id}/activate`);
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.RuleConflict');
    assert.ok(refused.rules.includes('LARGE-ORDERS-AUTO') && refused.rules.includes('ORDER-OVER-LIMIT'),
      'the refusal names both rules');
    assert.ok(refused.conflicts[0].overlappingInputs.length > 0, 'the inputs both rules match');

    // setting a precedence order resolves it
    await api.patch(`/api/admin-console/rules/${draft.rule.id}/precedence`, { priority: 50 });
    const activated = await api.post(`/api/admin-console/rules/${draft.rule.id}/activate`);
    assert.equal(activated.ok, true);
    assert.equal(activated.rule.status, 'Active');
  });

  test('AC-ADM-003-04-02', async () => {
    // "first match by priority returns only the highest-priority matching rule; all matches
    //  returns every matching outcome in priority order"
    const facts = {
      'Order.Total': 900000, 'Order.Currency': 'MWK', 'Customer.Roles': ['Registered'], 'Customer.Email': 'buyer@example.com',
    };
    const first = await api.post('/api/admin-console/rules/evaluate', { ruleSetCode: 'order-approval', facts });
    assert.equal(typeof first.outcome, 'string');
    assert.equal(first.matched.length, 1, 'first match by priority stops at the first rule');
    assert.equal(first.matched[0].code, 'LARGE-ORDERS-AUTO', 'the highest-priority matching rule (50 before 100)');

    await api.patch('/api/admin-console/rules/sets/order-approval/strategy', { strategy: 'allMatches' });
    const all = await api.post('/api/admin-console/rules/evaluate', { ruleSetCode: 'order-approval', facts });
    assert.ok(Array.isArray(all.outcome));
    assert.deepEqual(all.matched.map((m) => m.code), ['LARGE-ORDERS-AUTO', 'ORDER-OVER-LIMIT'],
      'every matching outcome, in priority order');
    await api.patch('/api/admin-console/rules/sets/order-approval/strategy', { strategy: 'firstMatch' });
  });
});

describe('US-ADM-003-05 and 06 the log and the audit trail', () => {
  test('AC-ADM-003-05-01', async () => {
    // "a log entry holds rule set, matched rule IDs and versions, inputs (personal or secret
    //  fields masked), outcome, time and caller reference"
    await api.post('/api/admin-console/rules/evaluate', {
      ruleSetCode: 'order-approval',
      facts: { 'Order.Total': 750000, 'Order.Currency': 'MWK', 'Customer.Roles': ['Registered'], 'Customer.Email': 'buyer@example.com' },
      callerRef: 'order-9001',
    });
    const log = await api.get('/api/admin-console/rules/log?ruleSet=order-approval');
    const entry = log.find((e) => e.callerRef === 'order-9001');
    assert.ok(entry, 'the evaluation is logged');
    assert.equal(entry.ruleSetCode, 'order-approval');
    assert.ok(entry.matched.every((m) => m.ruleId && m.version), 'matched rule IDs and versions');
    assert.ok(entry.outcome);
    assert.ok(entry.evaluatedOnUtc);
    assert.equal(entry.inputs['Customer.Email'], '[masked]', 'a field classified personal is masked');
    assert.equal(entry.inputs['Order.Total'], 750000, 'a business fact is not masked');
    assert.equal(entry.recordType, 'rule-evaluation-log', 'retention follows PLT-020');

    // the log is behind the rules permission
    const denied = await api.call('GET', '/api/admin-console/rules/log', undefined, SESSIONS.catalogue);
    assert.equal(denied.status, 403);
    assert.equal(denied.body.permission, 'Administration.Core.Rules.View');
  });

  test('AC-ADM-003-06-01', async () => {
    // "a new draft version is created; the active version stays in force until the new version
    //  is activated; who, when, old and new expression are audited (AUD-ADM-003)"
    const sets = await api.get('/api/admin-console/rules/sets');
    const set = sets.find((s) => s.code === 'order-approval');
    const active = set.rules.find((r) => r.code === 'ORDER-OVER-LIMIT' && r.status === 'Active');

    const edited = await api.post('/api/admin-console/rules', {
      ruleSetCode: 'order-approval', ruleId: active.id, expression: 'Order.Total > 400000', outcome: active.outcome, priority: active.priority,
    });
    assert.equal(edited.ok, true);
    assert.equal(edited.rule.status, 'Draft', 'the edit is a new draft version');
    assert.equal(edited.rule.version, active.version + 1);
    assert.equal(edited.activeVersionStillInForce, active.version);

    const after2 = await api.get('/api/admin-console/rules/sets/order-approval');
    const stillActive = after2.rules.find((r) => r.id === active.id);
    assert.equal(stillActive.status, 'Active', 'the active version stays in force');
    assert.equal(stillActive.expression, 'Order.Total > 500000', 'and keeps its own expression');

    const trail = await api.get('/api/security/audit?event=AUD-ADM-003');
    const entry = trail.find((e) => e.entity === 'Rule' && e.after?.version === active.version + 1);
    assert.ok(entry, 'the change is audited as AUD-ADM-003');
    assert.equal(entry.before.expression, 'Order.Total > 500000');
    assert.equal(entry.after.expression, 'Order.Total > 400000');
    assert.ok(entry.actor, 'who');
    assert.ok(entry.createdOnUtc ?? entry.occurredOnUtc, 'when');
  });
});
