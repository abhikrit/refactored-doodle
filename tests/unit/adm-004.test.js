// PRD-ADM-004 Transaction types and parameter schema - one test per AC, named by AC ID.
// 3 stories, 6 criteria.

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { startAsync } from './helpers/adm.js';

let api;
before(async () => { api = await startAsync(); });
after(() => api?.stop());

describe('US-ADM-004-01 the type registry and its parameter schema', () => {
  test('AC-ADM-004-01-01', async () => {
    // "it lists fixed-price sale, request for quotation, contract, group buying and scheme
    //  application, each with owning module, parameter schema, workflow binding, required
    //  documents and templates; auction and tender types are not offered (D-02)"
    const registry = await api.get('/api/admin-console/transaction-types');
    const codes = registry.types.map((t) => t.code);
    assert.deepEqual(codes, ['fixed-price-sale', 'request-for-quotation', 'contract', 'group-buying', 'scheme-application']);

    const rfq = registry.types.find((t) => t.code === 'request-for-quotation');
    assert.match(rfq.owningModule, /Misc\.RFQ/, 'the bundled RFQ plugin owns it');
    assert.deepEqual(rfq.nativeEntities, ['RequestQuote', 'Quote', 'Order']);
    const contract = registry.types.find((t) => t.code === 'contract');
    assert.equal(contract.workflowCode, 'internal-approval', 'the workflow binding (ADM-002)');
    assert.deepEqual(contract.requiredDocuments, ['SignedContract'], 'the required documents (DOC-005)');
    assert.ok(Array.isArray(contract.templateCodes), 'the templates (ADM-011)');
    for (const t of registry.types) {
      assert.ok(t.owningModule, `${t.code} names its owning module`);
      assert.ok(Array.isArray(t.parameterSchema), `${t.code} has a parameter schema`);
    }
    assert.deepEqual(registry.notOffered.map((n) => n.code).sort(), ['auction', 'tender']);
    assert.ok(registry.notOffered.every((n) => /D-02/.test(n.reason)), 'decision D-02 is the reason');
  });

  test('AC-ADM-004-01-02', async () => {
    // "creation is refused with message Adm.ParameterRequired"
    const refused = await api.post('/api/admin-console/transactions', {
      typeCode: 'request-for-quotation', parameters: { validUntil: '2026-12-31' },
    });
    assert.equal(refused.ok, false);
    const error = refused.errors.find((e) => e.parameter === 'quantity');
    assert.ok(error, 'the missing required parameter is named');
    assert.equal(error.messageKey, 'Adm.ParameterRequired');
    assert.match(error.message, /Quantity/);

    const allowedValues = await api.post('/api/admin-console/transactions', {
      typeCode: 'request-for-quotation', parameters: { quantity: 5, validUntil: '2026-12-31', incoterm: 'XXX' },
    });
    assert.equal(allowedValues.ok, false, 'a value outside the allowed values is refused too');

    const created = await api.post('/api/admin-console/transactions', {
      typeCode: 'request-for-quotation', parameters: { quantity: 5, validUntil: '2026-12-31', incoterm: 'FOB' },
    });
    assert.equal(created.ok, true);
  });

  test('AC-ADM-004-01-03', async () => {
    // "the change is refused with message Adm.ParameterFixed"
    const created = await api.post('/api/admin-console/transactions', { typeCode: 'fixed-price-sale', parameters: {} });
    assert.equal(created.ok, true);
    assert.equal(created.transaction.parameters.currency, 'MWK', 'a Fixed parameter takes the type value');

    const refused = await api.patch(`/api/admin-console/transactions/${created.transaction.id}/parameters`, {
      name: 'currency', value: 'USD',
    });
    assert.equal(refused.ok, false);
    assert.equal(refused.messageKey, 'Adm.ParameterFixed');
    assert.match(refused.message, /Currency is fixed/);
  });
});

describe('US-ADM-004-02 picking the type', () => {
  test('AC-ADM-004-02-01', async () => {
    // "the form shows that type's parameters, the case starts on the type's workflow and the
    //  type's document requirements apply"
    const created = await api.post('/api/admin-console/transactions', {
      typeCode: 'contract', parameters: { quantity: 100, incoterm: 'CIF' },
    });
    assert.equal(created.ok, true);
    assert.deepEqual(created.parametersShown.map((p) => p.name), ['quantity', 'incoterm', 'paymentTermDays']);
    assert.deepEqual(created.documentRequirements, ['SignedContract']);
    assert.ok(created.workflowCase, 'the case started on the type workflow');
    assert.equal(created.workflowCase.definitionCode, 'internal-approval');
    assert.equal(created.transaction.workflowCaseId, created.workflowCase.id);
  });

  test('AC-ADM-004-02-02', async () => {
    // "a reason is required and the override is recorded as a PLT deviation (BR-PLT-017)"
    const created = await api.post('/api/admin-console/transactions', {
      typeCode: 'contract', parameters: { quantity: 20 },
    });
    const noReason = await api.patch(`/api/admin-console/transactions/${created.transaction.id}/parameters`, {
      name: 'paymentTermDays', value: 90,
    });
    assert.equal(noReason.ok, false);
    assert.equal(noReason.needsReason, true);

    const withReason = await api.patch(`/api/admin-console/transactions/${created.transaction.id}/parameters`, {
      name: 'paymentTermDays', value: 90, reason: 'agreed with the customer for this contract only',
    });
    assert.equal(withReason.ok, true);
    assert.equal(withReason.deviationRecorded, true);

    const deviations = await api.get('/api/admin-console/deviations');
    const deviation = deviations.find((d) => d.transactionId === created.transaction.id);
    assert.ok(deviation, 'the override is recorded as a deviation');
    assert.equal(deviation.ref, 'contract.paymentTermDays');
    assert.equal(deviation.from, 30);
    assert.equal(deviation.to, 90);
    assert.equal(deviation.rule, 'BR-PLT-017');
    assert.match(deviation.reason, /agreed with the customer/);
  });
});

describe('US-ADM-004-03 two types in one transaction', () => {
  test('AC-ADM-004-03-01', async () => {
    // "a contract transaction is created with the mapped values and linked to the quote; both
    //  appear as one chained transaction"
    const quote = await api.post('/api/admin-console/transactions', {
      typeCode: 'request-for-quotation', parameters: { quantity: 250, validUntil: '2027-01-31', incoterm: 'DAP' },
    });
    const accepted = await api.post(`/api/admin-console/transactions/${quote.transaction.id}/accept-quote`);
    assert.equal(accepted.ok, true);
    assert.equal(accepted.chain, 'request-for-quotation -> contract');
    assert.equal(accepted.contract.typeCode, 'contract');
    assert.equal(accepted.contract.parameters.quantity, 250, 'the mapped value');
    assert.equal(accepted.contract.parameters.incoterm, 'DAP');
    assert.equal(accepted.contract.chainedFrom, quote.transaction.id, 'linked to the quote');
    assert.equal(accepted.quote.quoteStatus, 'Accepted');

    const chained = await api.get(`/api/admin-console/transactions/${accepted.contract.id}/chain`);
    assert.equal(chained.legs.length, 2, 'both legs appear as one chained transaction');
    assert.deepEqual(chained.legs.map((l) => l.typeCode), ['request-for-quotation', 'contract']);
  });
});
