// PRD-ADM-004 Transaction types and parameter schema.
//
// US-ADM-004-01  define the types the platform supports and what each needs (platform team)
// US-ADM-004-02  pick the type when starting a transaction; fields, workflow and documents adapt
// US-ADM-004-03  combine two types in one transaction (RFQ, then contract)
//
// BR-ADM-040: a parameter marked Fixed cannot be changed on a transaction; a Required parameter
// must be present; an override needs a reason and is recorded as a PLT deviation (BR-PLT-017).
// Decision D-02: auction and tender types are not offered.

import { repository } from '../../../core/repository.js';
import { auditAsync } from '../../../core/audit.js';
import { resource } from '../../../core/messages.js';
import { startCaseAsync } from './workflow.js';

const typeRepo = () => repository('TransactionType');
const chainRepo = () => repository('TransactionTypeChain');
const txRepo = () => repository('Transaction');
const deviationRepo = () => repository('ConfigurationDeviation');

/** AC-ADM-004-01-01: the registry the product ships, with what each type binds to. */
export async function typesAsync() {
  const types = await typeRepo().getAllAsync();
  const chains = await chainRepo().getAllAsync();
  return {
    types: types.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    chains,
    notOffered: [
      { code: 'auction', reason: 'decision D-02: auction is not offered' },
      { code: 'tender', reason: 'decision D-02: tender is not offered' },
    ],
  };
}

export const typeAsync = (code) => typeRepo().getOneAsync((t) => t.code === code);

const validate = (type, parameters) => {
  const errors = [];
  for (const p of type.parameterSchema) {
    const value = parameters[p.name];
    if (p.requirement === 'Required' && (value === undefined || value === null || value === '')) {
      errors.push({
        parameter: p.name, messageKey: 'Adm.ParameterRequired', message: resource('Adm.ParameterRequired', { 0: p.label ?? p.name }),
      });
      continue;
    }
    if (value === undefined) continue;
    if (p.dataType === 'number' && Number.isNaN(Number(value))) {
      errors.push({ parameter: p.name, messageKey: 'Adm.ParameterRequired', message: `${p.label ?? p.name} must be a number.` });
    }
    if (p.allowedValues && p.allowedValues.length && !p.allowedValues.includes(value)) {
      errors.push({ parameter: p.name, messageKey: 'Adm.ParameterRequired', message: `${p.label ?? p.name} must be one of ${p.allowedValues.join(', ')}.` });
    }
  }
  return errors;
};

/**
 * AC-ADM-004-01-02 refuses a missing required parameter with Adm.ParameterRequired.
 * AC-ADM-004-02-01: the case starts on the type's workflow and the type's document requirements
 * apply, both taken from the type, never from the caller.
 */
export async function createTransactionAsync({
  typeCode, parameters = {}, actor = 'operator', chainedFrom = null,
}) {
  const type = await typeAsync(typeCode);
  if (!type) throw new Error(`unknown transaction type ${typeCode}`);
  const errors = validate(type, parameters);
  if (errors.length) return { ok: false, errors };

  // Fixed parameters always take the type's value
  const values = { ...parameters };
  for (const p of type.parameterSchema.filter((x) => x.requirement === 'Fixed')) values[p.name] = p.fixedValue;

  const tx = await txRepo().insertAsync({
    typeCode: type.code,
    owningModule: type.owningModule,
    reference: `TX-${String(Date.now()).slice(-8)}`,
    parameters: values,
    status: 'Open',
    chainedFrom,
    requiredDocuments: type.requiredDocuments,
    actor,
  });

  let workflowCase = null;
  if (type.workflowCode) {
    const started = await startCaseAsync({
      definitionCode: type.workflowCode,
      businessKey: { type: 'Transaction', id: tx.id },
      variables: values,
      idempotencyKey: `transaction-${tx.id}`,
    });
    workflowCase = started.case ?? null;
  }
  const saved = await txRepo().updateAsync({ ...tx, workflowCaseId: workflowCase?.id ?? null });
  return {
    ok: true,
    transaction: saved,
    parametersShown: type.parameterSchema,
    workflowCase,
    documentRequirements: type.requiredDocuments,
  };
}

/**
 * AC-ADM-004-01-03: a Fixed parameter cannot be changed on a transaction (Adm.ParameterFixed).
 * AC-ADM-004-02-02: any other override needs a reason and is recorded as a PLT deviation
 * (BR-PLT-017).
 */
export async function setParameterAsync({
  transactionId, name, value, reason = null, actor = 'operator',
}) {
  const tx = await txRepo().getByIdAsync(transactionId);
  if (!tx) throw new Error('unknown transaction');
  const type = await typeAsync(tx.typeCode);
  const p = type.parameterSchema.find((x) => x.name === name);
  if (!p) return { ok: false, message: `${name} is not a parameter of ${type.code}` };
  if (p.requirement === 'Fixed') {
    return {
      ok: false, messageKey: 'Adm.ParameterFixed', message: resource('Adm.ParameterFixed', { 0: p.label ?? p.name }), parameter: name,
    };
  }
  const overridesTypeDefault = p.defaultValue !== undefined && value !== p.defaultValue;
  if (overridesTypeDefault && !reason) {
    return { ok: false, needsReason: true, message: 'An override of a type parameter needs a reason (BR-ADM-040, BR-PLT-017).' };
  }
  const before = tx.parameters[name];
  const updated = await txRepo().updateAsync({ ...tx, parameters: { ...tx.parameters, [name]: value } });
  if (overridesTypeDefault) {
    await deviationRepo().insertAsync({
      scope: 'TransactionType',
      ref: `${type.code}.${name}`,
      transactionId,
      from: p.defaultValue,
      to: value,
      reason,
      recordedBy: actor,
      rule: 'BR-PLT-017',
      recordedOnUtc: new Date().toISOString(),
    });
  }
  await auditAsync({
    event: 'AUD-ADM-009',
    area: 'ADM',
    feature: 'PRD-ADM-004',
    entity: 'Transaction',
    entityId: transactionId,
    actor,
    actorRole: 'Administrators',
    before: { [name]: before },
    after: { [name]: value },
    note: overridesTypeDefault ? `type parameter overridden: ${reason}` : 'transaction parameter set',
  });
  return { ok: true, transaction: updated, deviationRecorded: overridesTypeDefault };
}

/**
 * AC-ADM-004-03-01: a chain "request for quotation, then contract" with a parameter mapping.
 * When the quote is accepted, a contract transaction is created with the mapped values and
 * linked to the quote; both appear as one chained transaction.
 */
export async function acceptQuoteAsync({ transactionId, actor = 'operator' }) {
  const quote = await txRepo().getByIdAsync(transactionId);
  if (!quote) throw new Error('unknown transaction');
  const chain = await chainRepo().getOneAsync((c) => c.fromType === quote.typeCode);
  if (!chain) return { ok: false, message: `no chain is defined from ${quote.typeCode}` };

  const mapped = {};
  for (const [to, from] of Object.entries(chain.parameterMapping)) mapped[to] = quote.parameters[from];
  const created = await createTransactionAsync({
    typeCode: chain.toType, parameters: mapped, actor, chainedFrom: quote.id,
  });
  if (!created.ok) return created;
  const updatedQuote = await txRepo().updateAsync({
    ...quote, status: 'Converted', chainedTo: created.transaction.id, quoteStatus: 'Accepted',
  });
  return {
    ok: true,
    quote: updatedQuote,
    contract: created.transaction,
    chain: `${chain.fromType} -> ${chain.toType}`,
    mappedValues: mapped,
  };
}

/** Both legs of a chained transaction, as one record for the operator. */
export async function chainedTransactionAsync(transactionId) {
  const tx = await txRepo().getByIdAsync(transactionId);
  if (!tx) return null;
  const root = tx.chainedFrom ? await txRepo().getByIdAsync(tx.chainedFrom) : tx;
  const next = root.chainedTo ? await txRepo().getByIdAsync(root.chainedTo) : null;
  return { legs: [root, next].filter(Boolean), reference: root.reference };
}

export const transactionsAsync = () => txRepo().getAllAsync();
export const deviationsAsync = () => deviationRepo().getAllAsync();
