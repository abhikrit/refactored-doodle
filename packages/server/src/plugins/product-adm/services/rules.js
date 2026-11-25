// PRD-ADM-003 Business rules engine.
//
// US-ADM-003-01  write rules in a constrained language, no code
// US-ADM-003-02  start from a categorised pattern library
// US-ADM-003-03  test against sample data before activating
// US-ADM-003-04  conflicts detected; precedence decides which rule wins
// US-ADM-003-05  every evaluation logged with inputs, result and rule version
// US-ADM-003-06  every change to a rule recorded (AUD-ADM-003)
//
// BR-ADM-020: the language is declarative and constrained - operators over declared facts only;
// no code, reflection, file, network or database access. It is a parser and a tree walker, so
// there is no path by which rule text can execute anything.
// BR-ADM-012: testing has no side effects - no production evaluation-log entry, no outcome acted on.
// IC-ADM-02: Evaluate (writes the log) and Test (does not).

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';

const setRepo = () => repository('RuleSet');
const ruleRepo = () => repository('Rule');
const patternRepo = () => repository('RulePattern');
const logRepo = () => repository('RuleEvaluationLog');

/* ======================================================================== language ===== */

const OPERATORS = ['>=', '<=', '!=', '<>', '=', '>', '<', '+', '-', '*', '/', '(', ')', ',', '[', ']'];
const WORD_OPERATORS = ['and', 'or', 'not', 'in', 'true', 'false'];

/** A refusal carrying the position, for message Adm.RuleInvalid (AC-ADM-003-01-02). */
export class RuleSyntaxError extends Error {
  constructor(position, detail) {
    super(resource('Adm.RuleInvalid', { 0: position, 1: detail }));
    this.name = 'RuleSyntaxError';
    this.position = position;
    this.detail = detail;
    this.messageKey = 'Adm.RuleInvalid';
  }
}

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === '"' || ch === "'") {
      const end = text.indexOf(ch, i + 1);
      if (end === -1) throw new RuleSyntaxError(i + 1, 'the text is not closed');
      tokens.push({ type: 'string', value: text.slice(i + 1, end), pos: i + 1 });
      i = end + 1;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const m = /^[0-9]+(\.[0-9]+)?/.exec(text.slice(i));
      tokens.push({ type: 'number', value: Number(m[0]), pos: i + 1 });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(text.slice(i));
      const word = m[0];
      const lower = word.toLowerCase();
      tokens.push(WORD_OPERATORS.includes(lower)
        ? { type: 'word', value: lower, pos: i + 1 }
        : { type: 'fact', value: word, pos: i + 1 });
      i += word.length;
      continue;
    }
    const op = OPERATORS.find((o) => text.startsWith(o, i));
    if (!op) throw new RuleSyntaxError(i + 1, `"${ch}" is not part of the rule language`);
    tokens.push({ type: 'op', value: op, pos: i + 1 });
    i += op.length;
  }
  tokens.push({ type: 'end', value: '', pos: text.length + 1 });
  return tokens;
}

/**
 * Recursive descent over the grammar the PRD allows: comparison, logical, arithmetic and set
 * operators over declared facts. Anything else - a function call, an unknown word, a fact that
 * the rule set does not declare - is a syntax error with its position.
 */
function parse(text, declaredFacts) {
  const tokens = tokenize(text);
  let at = 0;
  const peek = () => tokens[at];
  const next = () => tokens[at++];
  const expect = (value) => {
    const t = next();
    if (t.value !== value) throw new RuleSyntaxError(t.pos, `expected "${value}"`);
    return t;
  };

  const parseOr = () => {
    let left = parseAnd();
    while (peek().type === 'word' && peek().value === 'or') {
      next();
      left = { kind: 'or', left, right: parseAnd() };
    }
    return left;
  };
  const parseAnd = () => {
    let left = parseNot();
    while (peek().type === 'word' && peek().value === 'and') {
      next();
      left = { kind: 'and', left, right: parseNot() };
    }
    return left;
  };
  const parseNot = () => {
    if (peek().type === 'word' && peek().value === 'not' && tokens[at + 1]?.value !== 'in') {
      next();
      return { kind: 'not', operand: parseNot() };
    }
    return parseComparison();
  };
  const parseComparison = () => {
    const left = parseArith();
    const t = peek();
    if (t.type === 'op' && ['>=', '<=', '!=', '<>', '=', '>', '<'].includes(t.value)) {
      next();
      return { kind: 'compare', op: t.value, left, right: parseArith() };
    }
    if (t.type === 'word' && (t.value === 'in' || t.value === 'not')) {
      if (t.value === 'not') {
        next();
        const inTok = next();
        if (inTok.value !== 'in') throw new RuleSyntaxError(inTok.pos, 'expected "in" after "not"');
        return { kind: 'not', operand: { kind: 'in', left, right: parseSetOperand() } };
      }
      next();
      return { kind: 'in', left, right: parseSetOperand() };
    }
    return left;
  };
  // the right side of "in" is a list literal or a fact that holds a list
  const parseSetOperand = () => (peek().value === '[' ? parseList() : parseArith());
  const parseList = () => {
    expect('[');
    const items = [];
    if (peek().value !== ']') {
      items.push(parseArith());
      while (peek().value === ',') { next(); items.push(parseArith()); }
    }
    expect(']');
    return { kind: 'list', items };
  };
  const parseArith = () => {
    let left = parseTerm();
    while (peek().type === 'op' && ['+', '-'].includes(peek().value)) {
      const op = next().value;
      left = { kind: 'arith', op, left, right: parseTerm() };
    }
    return left;
  };
  const parseTerm = () => {
    let left = parseFactor();
    while (peek().type === 'op' && ['*', '/'].includes(peek().value)) {
      const op = next().value;
      left = { kind: 'arith', op, left, right: parseFactor() };
    }
    return left;
  };
  const parseFactor = () => {
    const t = next();
    if (t.type === 'number' || t.type === 'string') return { kind: 'literal', value: t.value };
    if (t.type === 'word' && (t.value === 'true' || t.value === 'false')) {
      return { kind: 'literal', value: t.value === 'true' };
    }
    if (t.type === 'op' && t.value === '(') {
      const inner = parseOr();
      expect(')');
      return inner;
    }
    if (t.type === 'op' && t.value === '-') return { kind: 'arith', op: '-', left: { kind: 'literal', value: 0 }, right: parseFactor() };
    if (t.type === 'op' && t.value === '[') { at -= 1; return parseList(); }
    if (t.type === 'fact') {
      // BR-ADM-020: no code execution - a name followed by "(" would be a call, and there are none
      if (peek().type === 'op' && peek().value === '(') {
        throw new RuleSyntaxError(t.pos, `"${t.value}(...)" is a function call; the rule language has no code execution (BR-ADM-020)`);
      }
      if (!declaredFacts.includes(t.value)) {
        throw new RuleSyntaxError(t.pos, `"${t.value}" is not a fact of this rule set`);
      }
      return { kind: 'fact', name: t.value };
    }
    throw new RuleSyntaxError(t.pos, t.type === 'end' ? 'the rule ends too early' : `"${t.value}" is not valid here`);
  };

  const ast = parseOr();
  if (peek().type !== 'end') throw new RuleSyntaxError(peek().pos, `"${peek().value}" is not valid here`);
  return ast;
}

const factValue = (facts, name) => name.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), facts)
  ?? facts[name];

function evaluateNode(node, facts, matched) {
  switch (node.kind) {
    case 'literal': return node.value;
    case 'fact': return factValue(facts, node.name);
    case 'list': return node.items.map((n) => evaluateNode(n, facts, matched));
    case 'not': return !evaluateNode(node.operand, facts, matched);
    case 'and': return Boolean(evaluateNode(node.left, facts, matched)) && Boolean(evaluateNode(node.right, facts, matched));
    case 'or': return Boolean(evaluateNode(node.left, facts, matched)) || Boolean(evaluateNode(node.right, facts, matched));
    case 'in': {
      const left = evaluateNode(node.left, facts, matched);
      const right = evaluateNode(node.right, facts, matched);
      const list = Array.isArray(right) ? right : [right];
      const result = Array.isArray(left) ? left.some((x) => list.includes(x)) : list.includes(left);
      matched?.push({ condition: describe(node), result });
      return result;
    }
    case 'arith': {
      const l = Number(evaluateNode(node.left, facts, matched));
      const r = Number(evaluateNode(node.right, facts, matched));
      if (node.op === '+') return l + r;
      if (node.op === '-') return l - r;
      if (node.op === '*') return l * r;
      return r === 0 ? null : l / r;
    }
    case 'compare': {
      const l = evaluateNode(node.left, facts, matched);
      const r = evaluateNode(node.right, facts, matched);
      let result;
      if (node.op === '>') result = l > r;
      else if (node.op === '<') result = l < r;
      else if (node.op === '>=') result = l >= r;
      else if (node.op === '<=') result = l <= r;
      else if (node.op === '=') result = l === r;
      else result = l !== r;
      matched?.push({ condition: describe(node), result });
      return result;
    }
    default: return false;
  }
}

function describe(node) {
  switch (node.kind) {
    case 'literal': return typeof node.value === 'string' ? `"${node.value}"` : String(node.value);
    case 'fact': return node.name;
    case 'list': return `[${node.items.map(describe).join(', ')}]`;
    case 'not': return `not ${describe(node.operand)}`;
    case 'and': return `${describe(node.left)} and ${describe(node.right)}`;
    case 'or': return `${describe(node.left)} or ${describe(node.right)}`;
    case 'in': return `${describe(node.left)} in ${describe(node.right)}`;
    case 'arith': return `${describe(node.left)} ${node.op} ${describe(node.right)}`;
    case 'compare': return `${describe(node.left)} ${node.op} ${describe(node.right)}`;
    default: return '';
  }
}

/** Parse only - used by the editor and by the tests. Throws RuleSyntaxError. */
export function compileRule(expression, declaredFacts) {
  return parse(expression, declaredFacts);
}

/* =========================================================================== sets ====== */

export async function ruleSetsAsync() {
  const sets = await setRepo().getAllAsync();
  const rules = await ruleRepo().getAllAsync();
  return sets.map((s) => ({
    ...s,
    rules: rules.filter((r) => r.ruleSetId === s.id).sort((a, b) => a.priority - b.priority || a.id - b.id),
  }));
}

export async function ruleSetAsync(code) {
  const set = await setRepo().getOneAsync((s) => s.code === code);
  if (!set) return null;
  const rules = await ruleRepo().getAllAsync((r) => r.ruleSetId === set.id);
  return { ...set, rules: rules.sort((a, b) => a.priority - b.priority || a.id - b.id) };
}

export const patternsAsync = () => patternRepo().getAllAsync();

/* ========================================================================== rules ====== */

/**
 * AC-ADM-003-01-01: a rule is saved as a draft.
 * AC-ADM-003-01-02: an undeclared fact or a syntax error is refused with Adm.RuleInvalid and the
 * position of the error.
 * AC-ADM-003-06-01: editing an active rule creates a NEW DRAFT VERSION; the active version stays
 * in force until the new one is activated (AUD-ADM-003).
 */
export async function saveRuleAsync({
  ruleSetCode, ruleId = null, code, expression, outcome, priority = 100, actor = 'admin',
}) {
  const set = await setRepo().getOneAsync((s) => s.code === ruleSetCode);
  if (!set) throw new Error(`unknown rule set ${ruleSetCode}`);
  try {
    compileRule(expression, set.facts.map((f) => f.name));
  } catch (err) {
    if (err instanceof RuleSyntaxError) {
      return {
        ok: false, messageKey: 'Adm.RuleInvalid', message: err.message, position: err.position, detail: err.detail,
      };
    }
    throw err;
  }

  const existing = ruleId ? await ruleRepo().getByIdAsync(ruleId) : null;
  if (existing && existing.status === 'Active') {
    // a new draft version; the active version is untouched (SM-ADM-03)
    const draft = await ruleRepo().insertAsync({
      ruleSetId: set.id,
      code: existing.code,
      version: existing.version + 1,
      expression,
      outcome,
      priority,
      status: 'Draft',
      supersedes: existing.id,
    });
    await auditAsync({
      event: 'AUD-ADM-003',
      area: 'ADM',
      feature: 'PRD-ADM-003',
      entity: 'Rule',
      entityId: draft.id,
      actor,
      actorRole: 'Administrators',
      before: { expression: existing.expression, outcome: existing.outcome, version: existing.version },
      after: { expression, outcome, version: draft.version },
      note: 'new draft version of an active rule; the active version stays in force until the draft is activated',
    });
    return { ok: true, rule: draft, activeVersionStillInForce: existing.version };
  }

  const saved = existing
    ? await ruleRepo().updateAsync({ ...existing, expression, outcome, priority })
    : await ruleRepo().insertAsync({
      ruleSetId: set.id, code: code ?? `R-${Date.now()}`, version: 1, expression, outcome, priority, status: 'Draft',
    });
  await auditAsync({
    event: 'AUD-ADM-003',
    area: 'ADM',
    feature: 'PRD-ADM-003',
    entity: 'Rule',
    entityId: saved.id,
    actor,
    actorRole: 'Administrators',
    before: existing ? { expression: existing.expression, outcome: existing.outcome } : null,
    after: { expression, outcome, status: 'Draft' },
    note: existing ? 'draft rule changed' : 'rule created as a draft',
  });
  return { ok: true, rule: saved };
}

/**
 * AC-ADM-003-02-01: creating a rule from a pattern makes a draft copy with the pattern's
 * parameters to fill in; the pattern itself is unchanged.
 */
export async function createFromPatternAsync({
  patternId, ruleSetCode, parameters = {}, actor = 'admin',
}) {
  const pattern = await patternRepo().getByIdAsync(patternId);
  if (!pattern) throw new Error('unknown pattern');
  let expression = pattern.template;
  for (const p of pattern.parameters) {
    const value = parameters[p.name];
    expression = expression.split(`{${p.name}}`).join(value === undefined ? `{${p.name}}` : String(value));
  }
  const result = await saveRuleAsync({
    ruleSetCode: ruleSetCode ?? pattern.ruleSetCode,
    code: `${pattern.code}-${Date.now().toString(36)}`,
    expression,
    outcome: pattern.outcome,
    priority: pattern.priority ?? 100,
    actor,
  });
  return {
    ...result,
    fromPattern: pattern.code,
    unfilledParameters: pattern.parameters.filter((p) => parameters[p.name] === undefined).map((p) => p.name),
    pattern: await patternRepo().getByIdAsync(patternId), // unchanged
  };
}

/**
 * AC-ADM-003-03-01 and BR-ADM-012: test a draft against sample inputs. Each input is shown as
 * pass or fail with the conditions that matched. No production log entry, no outcome acted on.
 */
export async function testRuleAsync({ ruleSetCode, expression, outcome, samples = null }) {
  const set = await setRepo().getOneAsync((s) => s.code === ruleSetCode);
  if (!set) throw new Error(`unknown rule set ${ruleSetCode}`);
  let ast;
  try {
    ast = compileRule(expression, set.facts.map((f) => f.name));
  } catch (err) {
    if (err instanceof RuleSyntaxError) {
      return {
        ok: false, messageKey: 'Adm.RuleInvalid', message: err.message, position: err.position,
      };
    }
    throw err;
  }
  const inputs = samples ?? set.testData ?? [];
  const results = inputs.map((sample) => {
    const matched = [];
    const pass = Boolean(evaluateNode(ast, sample.facts, matched));
    return {
      name: sample.name, facts: sample.facts, pass, outcome: pass ? outcome : set.defaultOutcome, conditions: matched,
    };
  });
  const logCountBefore = (await logRepo().getAllAsync()).length;
  return {
    ok: true, results, productionLogEntriesWritten: (await logRepo().getAllAsync()).length - logCountBefore, sideEffects: 'none (BR-ADM-012)',
  };
}

/**
 * AC-ADM-003-04-01 and BR-ADM-021: a draft cannot be activated while it conflicts with an
 * active rule of the same set - both match at least one input of the set's test data and give
 * different outcomes - unless a precedence order resolves it.
 */
export async function conflictsForAsync(set, candidate, activeRules) {
  const facts = set.facts.map((f) => f.name);
  const candidateAst = compileRule(candidate.expression, facts);
  const conflicts = [];
  for (const other of activeRules) {
    if (other.id === candidate.id || other.code === candidate.code) continue;
    if (other.outcome === candidate.outcome) continue;
    const otherAst = compileRule(other.expression, facts);
    const overlap = (set.testData ?? []).filter((sample) => Boolean(evaluateNode(candidateAst, sample.facts))
      && Boolean(evaluateNode(otherAst, sample.facts)));
    if (overlap.length === 0) continue;
    // precedence resolves it only when the set returns one outcome and the priorities differ
    const resolved = set.strategy === 'firstMatch' && other.priority !== candidate.priority;
    if (!resolved) {
      conflicts.push({
        with: other.code,
        withId: other.id,
        outcomes: [candidate.outcome, other.outcome],
        overlappingInputs: overlap.map((s) => s.name),
        resolvedBy: null,
      });
    }
  }
  return conflicts;
}

export async function activateRuleAsync({ ruleId, actor = 'admin' }) {
  const rule = await ruleRepo().getByIdAsync(ruleId);
  if (!rule) throw new Error('unknown rule');
  const set = await setRepo().getByIdAsync(rule.ruleSetId);
  const active = await ruleRepo().getAllAsync((r) => r.ruleSetId === set.id && r.status === 'Active');
  const conflicts = await conflictsForAsync(set, rule, active);
  if (conflicts.length > 0) {
    return {
      ok: false,
      messageKey: 'Adm.RuleConflict',
      message: resource('Adm.RuleConflict', { 0: conflicts.map((c) => c.with).join(', ') }),
      conflicts,
      rules: [rule.code, ...conflicts.map((c) => c.with)],
    };
  }
  // SM-ADM-03: activating retires the previous active version of the same rule
  for (const previous of active.filter((r) => r.code === rule.code)) {
    await ruleRepo().updateAsync({ ...previous, status: 'Retired' });
  }
  const activated = await ruleRepo().updateAsync({ ...rule, status: 'Active', activatedOnUtc: new Date().toISOString() });
  await auditAsync({
    event: 'AUD-ADM-003',
    area: 'ADM',
    feature: 'PRD-ADM-003',
    entity: 'Rule',
    entityId: rule.id,
    actor,
    actorRole: 'Administrators',
    before: { status: 'Draft' },
    after: { status: 'Active', version: rule.version },
    note: 'rule activated',
  });
  return { ok: true, rule: activated };
}

export async function setPrecedenceAsync({ ruleId, priority, actor = 'admin' }) {
  const rule = await ruleRepo().getByIdAsync(ruleId);
  if (!rule) throw new Error('unknown rule');
  const updated = await ruleRepo().updateAsync({ ...rule, priority });
  await auditAsync({
    event: 'AUD-ADM-003',
    area: 'ADM',
    feature: 'PRD-ADM-003',
    entity: 'Rule',
    entityId: rule.id,
    actor,
    actorRole: 'Administrators',
    before: { priority: rule.priority },
    after: { priority },
    note: 'precedence changed',
  });
  return updated;
}

export async function setStrategyAsync({ ruleSetCode, strategy }) {
  const set = await setRepo().getOneAsync((s) => s.code === ruleSetCode);
  if (!set) throw new Error('unknown rule set');
  if (!['firstMatch', 'allMatches'].includes(strategy)) throw new Error('strategy must be firstMatch or allMatches');
  return setRepo().updateAsync({ ...set, strategy });
}

/* ===================================================================== evaluation ====== */

const maskInputs = (set, facts) => {
  const classified = Object.fromEntries(set.facts.map((f) => [f.name, f.classification]));
  const out = {};
  for (const [key, value] of Object.entries(facts)) {
    // AC-ADM-003-05-01: fields classified personal or secret are masked (SEC-014 when delivered,
    // otherwise by replacing the value)
    out[key] = ['personal', 'secret'].includes(classified[key]) ? '[masked]' : value;
  }
  return out;
};

/**
 * IC-ADM-02 Evaluate. AC-ADM-003-01-03 returns the outcome with the rule ID and version;
 * AC-ADM-003-04-02 applies the rule set's strategy; AC-ADM-003-05-01 writes the log.
 * Concurrency (section 12.4): an evaluation reads the active version at start and records it.
 */
export async function evaluateAsync({ ruleSetCode, facts, callerRef = null }) {
  const set = await setRepo().getOneAsync((s) => s.code === ruleSetCode);
  if (!set) throw new Error(`unknown rule set ${ruleSetCode}`);
  const declared = set.facts.map((f) => f.name);
  const missing = declared.filter((name) => factValue(facts, name) === undefined);
  const active = (await ruleRepo().getAllAsync((r) => r.ruleSetId === set.id && r.status === 'Active'))
    .sort((a, b) => a.priority - b.priority || a.id - b.id);

  const matched = [];
  for (const rule of active) {
    const ast = compileRule(rule.expression, declared);
    if (evaluateNode(ast, facts)) {
      matched.push({
        ruleId: rule.id, code: rule.code, version: rule.version, outcome: rule.outcome, priority: rule.priority,
      });
      if (set.strategy === 'firstMatch') break;
    }
  }
  const outcomes = matched.length ? matched.map((m) => m.outcome) : [set.defaultOutcome];
  const entry = await logRepo().insertAsync({
    ruleSetCode: set.code,
    matched: matched.map((m) => ({ ruleId: m.ruleId, code: m.code, version: m.version })),
    inputs: maskInputs(set, facts),
    outcome: set.strategy === 'firstMatch' ? outcomes[0] : outcomes,
    callerRef,
    evaluatedOnUtc: new Date().toISOString(),
    recordType: 'rule-evaluation-log', // PLT-020 record type (BR-ADM-080, IC-PLT-08)
  });
  return {
    ruleSet: set.code,
    strategy: set.strategy,
    outcome: set.strategy === 'firstMatch' ? outcomes[0] : outcomes,
    matched,
    missingFacts: missing,
    logId: entry.id,
  };
}

export async function evaluationLogAsync({ ruleSetCode = null, limit = 50 } = {}) {
  const rows = await logRepo().getAllAsync((r) => (ruleSetCode ? r.ruleSetCode === ruleSetCode : true));
  return rows.slice().sort((a, b) => b.id - a.id).slice(0, limit);
}
