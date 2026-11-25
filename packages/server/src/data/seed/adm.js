// Synthetic demonstration data for the ADM module (decision P-5: synthetic only).
//
// Everything here is shaped by the PRD-ADM chapter: rule sets and patterns (ADM-003), the
// transaction-type registry and its chain (ADM-004), eligibility and quotas (ADM-005), approval
// chains, reason codes and moderation queues (ADM-006), workflow definitions (ADM-002),
// exceptions (ADM-009), alert rules (ADM-010) and the template library (ADM-011, ADM-012).

import { repository } from '../../core/repository.js';

export async function seedAdmAsync({ clientId }) {
  const mw = clientId === 'MPC';

  /* ------------------------------------------------ ADM-003 rule sets and patterns ----- */
  const orderApproval = await repository('RuleSet').insertAsync({
    code: 'order-approval',
    owningModule: 'Product.CHK',
    facts: [
      { name: 'Order.Total', type: 'number', classification: 'business' },
      { name: 'Order.Currency', type: 'text', classification: 'business' },
      { name: 'Customer.Roles', type: 'list', classification: 'business' },
      { name: 'Customer.Email', type: 'text', classification: 'personal' },
    ],
    strategy: 'firstMatch',
    defaultOutcome: 'NoApproval',
    testData: [
      { name: 'small order', facts: { 'Order.Total': 12000, 'Order.Currency': mw ? 'MWK' : 'KES', 'Customer.Roles': ['Registered'], 'Customer.Email': 'buyer@example.com' } },
      { name: 'large order', facts: { 'Order.Total': 750000, 'Order.Currency': mw ? 'MWK' : 'KES', 'Customer.Roles': ['Registered'], 'Customer.Email': 'buyer@example.com' } },
      { name: 'business buyer, large', facts: { 'Order.Total': 900000, 'Order.Currency': mw ? 'MWK' : 'KES', 'Customer.Roles': ['BusinessBuyer'], 'Customer.Email': 'company.buyer@example.com' } },
    ],
  });
  await repository('Rule').insertAsync({
    ruleSetId: orderApproval.id,
    code: 'ORDER-OVER-LIMIT',
    version: 1,
    expression: 'Order.Total > 500000',
    outcome: 'RequireApproval',
    priority: 100,
    status: 'Active',
    activatedOnUtc: new Date().toISOString(),
  });

  const eligibility = await repository('RuleSet').insertAsync({
    code: 'scheme-eligibility',
    owningModule: 'Product.ADM',
    facts: [
      { name: 'Customer.Country', type: 'text', classification: 'business' },
      { name: 'Customer.Roles', type: 'list', classification: 'business' },
      { name: 'Customer.YearsRegistered', type: 'number', classification: 'business' },
      { name: 'Customer.AnnualSpend', type: 'number', classification: 'business' },
    ],
    strategy: 'firstMatch',
    defaultOutcome: 'NotEligible',
    testData: [
      { name: 'established local buyer', facts: { 'Customer.Country': mw ? 'MW' : 'KE', 'Customer.Roles': ['Registered'], 'Customer.YearsRegistered': 3, 'Customer.AnnualSpend': 120000 } },
      { name: 'new buyer', facts: { 'Customer.Country': mw ? 'MW' : 'KE', 'Customer.Roles': ['Registered'], 'Customer.YearsRegistered': 0, 'Customer.AnnualSpend': 0 } },
    ],
  });
  await repository('Rule').insertAsync({
    ruleSetId: eligibility.id,
    code: 'SCHEME-ELIGIBLE',
    version: 1,
    expression: `Customer.Country = "${mw ? 'MW' : 'KE'}" and Customer.YearsRegistered >= 1 and Customer.AnnualSpend >= 50000`,
    outcome: 'Eligible',
    priority: 100,
    status: 'Active',
    activatedOnUtc: new Date().toISOString(),
  });

  for (const pattern of [
    {
      code: 'APPROVAL-OVER-AMOUNT', category: 'routing', name: 'Approval above an amount', ruleSetCode: 'order-approval', template: 'Order.Total > {amount}', outcome: 'RequireApproval', parameters: [{ name: 'amount', type: 'number', label: 'Amount' }],
    },
    {
      code: 'ELIGIBLE-BY-COUNTRY', category: 'eligibility', name: 'Eligible by country and spend', ruleSetCode: 'scheme-eligibility', template: 'Customer.Country = "{country}" and Customer.AnnualSpend >= {spend}', outcome: 'Eligible', parameters: [{ name: 'country', type: 'text', label: 'Country' }, { name: 'spend', type: 'number', label: 'Annual spend' }],
    },
    {
      code: 'PRICE-BAND', category: 'pricing', name: 'Price band by role', ruleSetCode: 'order-approval', template: '"{role}" in Customer.Roles', outcome: 'BandPrice', parameters: [{ name: 'role', type: 'text', label: 'Customer role' }],
    },
    {
      code: 'VALIDATE-CURRENCY', category: 'validation', name: 'Currency must be the store currency', ruleSetCode: 'order-approval', template: 'Order.Currency != "{currency}"', outcome: 'Invalid', parameters: [{ name: 'currency', type: 'text', label: 'Currency' }],
    },
  ]) await repository('RulePattern').insertAsync(pattern);

  /* -------------------------------------------------------- ADM-004 transaction types -- */
  const types = [
    {
      code: 'fixed-price-sale',
      name: 'Fixed-price sale',
      owningModule: 'Product.CHK',
      nativeEntities: ['Product', 'Order'],
      displayOrder: 1,
      workflowCode: null,
      requiredDocuments: [],
      templateCodes: [],
      parameterSchema: [
        {
          name: 'currency', label: 'Currency', dataType: 'text', requirement: 'Fixed', fixedValue: mw ? 'MWK' : 'KES',
        },
        { name: 'deliveryTerms', label: 'Delivery terms', dataType: 'text', requirement: 'Optional' },
      ],
    },
    {
      code: 'request-for-quotation',
      name: 'Request for quotation',
      owningModule: 'Misc.RFQ (bundled)',
      nativeEntities: ['RequestQuote', 'Quote', 'Order'],
      displayOrder: 2,
      workflowCode: null,
      requiredDocuments: ['Specification'],
      templateCodes: [],
      parameterSchema: [
        { name: 'quantity', label: 'Quantity', dataType: 'number', requirement: 'Required' },
        { name: 'validUntil', label: 'Valid until', dataType: 'text', requirement: 'Required' },
        { name: 'incoterm', label: 'Incoterm', dataType: 'text', requirement: 'Optional', allowedValues: ['EXW', 'FOB', 'CIF', 'DAP'] },
      ],
    },
    {
      code: 'contract',
      name: 'Contract',
      owningModule: 'Product.ORD (ORD-016)',
      nativeEntities: ['Order'],
      displayOrder: 3,
      workflowCode: 'internal-approval',
      requiredDocuments: ['SignedContract'],
      templateCodes: ['mpc-parcel'],
      parameterSchema: [
        { name: 'quantity', label: 'Quantity', dataType: 'number', requirement: 'Required' },
        { name: 'incoterm', label: 'Incoterm', dataType: 'text', requirement: 'Optional', allowedValues: ['EXW', 'FOB', 'CIF', 'DAP'] },
        {
          name: 'paymentTermDays', label: 'Payment term (days)', dataType: 'number', requirement: 'Optional', defaultValue: 30,
        },
      ],
    },
    {
      code: 'group-buying',
      name: 'Group buying',
      owningModule: 'Product.ORD (ORD-023)',
      nativeEntities: ['Order'],
      displayOrder: 4,
      workflowCode: null,
      requiredDocuments: [],
      templateCodes: [],
      parameterSchema: [{ name: 'minimumParticipants', label: 'Minimum participants', dataType: 'number', requirement: 'Required' }],
    },
    {
      code: 'scheme-application',
      name: 'Scheme application',
      owningModule: 'Product.ORD (ORD-024)',
      nativeEntities: ['Order'],
      displayOrder: 5,
      workflowCode: 'egv-service-entry',
      requiredDocuments: ['IdentityDocument'],
      templateCodes: [],
      parameterSchema: [{ name: 'schemeCode', label: 'Scheme', dataType: 'text', requirement: 'Required' }],
    },
  ];
  for (const t of types) await repository('TransactionType').insertAsync(t);
  await repository('TransactionTypeChain').insertAsync({
    fromType: 'request-for-quotation',
    toType: 'contract',
    parameterMapping: { quantity: 'quantity', incoterm: 'incoterm' },
    note: 'FC-M02-003: a request for quotation followed by a contract stays one chained transaction',
  });

  /* ------------------------------------------------------ ADM-005 eligibility, quotas -- */
  await repository('EligibilityBinding').insertAsync({
    ruleSetCode: 'scheme-eligibility', customerRole: 'BulkBuyer', eligibleOutcome: 'Eligible', note: 'the customer role decides who sees the scheme',
  });
  const quotaProduct = (await repository('Product').getAllAsync())[0];
  if (quotaProduct) {
    await repository('Quota').insertAsync({
      scope: 'product',
      refId: quotaProduct.id,
      customerRole: 'BulkBuyer',
      quantity: 40,
      consumed: 0,
      reserved: 0,
      periodStart: null,
      periodEnd: null,
      note: 'a reserved share for the policy category (FC-M02-028)',
    });
  }

  /* ------------------------------------- ADM-006 chains, reason codes, moderation ------ */
  for (const chain of [
    {
      code: 'payout-account-change',
      objectType: 'PayoutAccountChange',
      steps: [
        { order: 1, approverRole: 'Finance', authorityLimit: null },
        { order: 2, approverRole: 'Compliance', authorityLimit: null },
        { order: 9, approverRole: 'Administrators', isAppealStep: true },
      ],
      note: 'a high-risk change: the old account stays in use until the change is approved',
    },
    {
      code: 'internal-approval-chain',
      objectType: 'WorkflowStep',
      steps: [
        { order: 1, approverRole: 'Finance', authorityLimit: 1000000 },
        {
          order: 2,
          approverRole: 'Administrators',
          conditionRuleSet: 'order-approval',
          includeWhenOutcome: 'RequireApproval',
          conditionFacts: { 'Order.Total': 'amount' },
        },
        { order: 9, approverRole: 'Administrators', isAppealStep: true },
      ],
      note: 'approval stages in order; the second stage applies only above the amount',
    },
    {
      code: 'template-approval', objectType: 'TransactionTemplate', steps: [{ order: 1, approverRole: 'Administrators' }], note: 'FC-M02-011: approved by someone other than the author',
    },
    {
      code: 'screening-review', objectType: 'ScreeningMatch', steps: [{ order: 1, approverRole: 'Compliance' }], note: 'FC-M02-031: a reviewer clears or confirms the match',
    },
    {
      code: 'listing-moderation', objectType: 'Listing', steps: [{ order: 1, approverRole: 'Catalogue' }], note: 'a new listing is checked before it is published',
    },
    {
      code: 'seller-application', objectType: 'SellerApplication', steps: [{ order: 1, approverRole: 'Compliance' }], note: 'SEL-003, with the IC-ADM-03 CanDecide guard',
    },
  ]) await repository('ApprovalChain').insertAsync(chain);

  for (const r of [
    { context: 'approval', code: 'INCOMPLETE_DOCS', text: 'The supporting documents are incomplete.' },
    { context: 'approval', code: 'POLICY_BREACH', text: 'The request is outside policy.' },
    { context: 'approval', code: 'PRICE_OUT_OF_RANGE', text: 'The price is outside the agreed range.' },
    { context: 'exception', code: 'UPSTREAM_ERROR', text: 'The other system returned an error.' },
    { context: 'exception', code: 'DATA_FIXED', text: 'The data was corrected and the item reprocessed.' },
    { context: 'exception', code: 'RETRY_LATER', text: 'A temporary failure; retried later.' },
  ]) await repository('ReasonCode').insertAsync(r);

  const staff = await repository('Customer').getAllAsync((c) => !c.deleted);
  const member = (email) => {
    const c = staff.find((x) => x.email === email);
    return c ? { id: c.id, email: c.email } : null;
  };
  await repository('ModerationQueue').insertAsync({
    code: 'listing-moderation',
    objectType: 'Listing',
    assignmentRule: 'round-robin',
    members: [member('catalogue@example.com'), member('admin@example.com')].filter(Boolean),
    lastAssignedIndex: -1,
  });
  await repository('ModerationQueue').insertAsync({
    code: 'seller-applications',
    objectType: 'SellerApplication',
    assignmentRule: 'by-seller-tier',
    members: [{ ...(member('compliance@example.com') ?? member('admin@example.com')), tiers: ['gold', 'silver'] }].filter(Boolean),
  });

  /* ------------------------------------------------------ ADM-002 workflow definitions - */
  const definitions = [
    {
      code: 'internal-approval',
      name: 'Internal approval stages',
      basis: 'REQ-KTDA-WF-004',
      elements: [
        { id: 'start', type: 'start', next: 'approve' },
        {
          id: 'approve', type: 'approval', name: 'Internal approval', chainCode: 'internal-approval-chain', objectType: 'WorkflowStep', amountVariable: 'Order.Total', approvedPath: 'notify', rejectedPath: 'end-rejected', next: 'notify',
        },
        {
          id: 'notify', type: 'notification', name: 'Tell the requester', eventCode: 'Administration.ApprovalDecided', next: 'end-approved',
        },
        { id: 'end-approved', type: 'end' },
        { id: 'end-rejected', type: 'end' },
      ],
    },
    {
      code: 'shipping-workflow',
      name: 'Shipping workflow',
      basis: 'REQ-KTDA-WF-005',
      boundEvents: ['ShipmentCreatedEvent', 'ShipmentSentEvent', 'ShipmentDeliveredEvent'],
      elements: [
        { id: 'start', type: 'start', next: 'book' },
        {
          id: 'book', type: 'call', name: 'Book the carrier', operation: 'LOG.BookCarrier', retries: 1, next: 'inform',
        },
        {
          id: 'inform', type: 'notification', name: 'Tell the buyer', eventCode: 'Administration.AlertRaised', next: 'end',
        },
        { id: 'end', type: 'end' },
      ],
    },
    {
      code: 'fulfilment-workflow',
      name: 'Fulfilment workflow',
      basis: 'REQ-KTDA-WF-007',
      boundEvents: ['OrderPlacedEvent', 'OrderPaidEvent'],
      elements: [
        { id: 'start', type: 'start', next: 'allocate' },
        {
          id: 'allocate', type: 'call', name: 'Allocate stock', operation: 'LOG.Allocate', next: 'pick',
        },
        { id: 'pick', type: 'task', name: 'Pick and pack', next: 'dispatch' },
        { id: 'dispatch', type: 'task', name: 'Dispatch', next: 'end' },
        { id: 'end', type: 'end' },
      ],
    },
    {
      code: 'egv-service-entry',
      name: 'E-government service entry',
      basis: 'REQ-MPC-FR-307',
      elements: [
        { id: 'start', type: 'start', next: 'split' },
        { id: 'split', type: 'parallel-split', name: 'Pre-approval checks', next: ['external-check', 'fee-check'] },
        {
          id: 'external-check', type: 'call', name: 'External check', operation: 'EGV.VerifyOrRegister', timeoutMs: 4000, retries: 2, next: 'join',
        },
        { id: 'fee-check', type: 'task', name: 'Fee check', next: 'join' },
        {
          id: 'join', type: 'parallel-join', name: 'All pre-approval checks done', split: 'split', incoming: ['external-check', 'fee-check'], next: 'approve',
        },
        {
          id: 'approve', type: 'approval', name: 'Agency approval', approverRole: 'Compliance', objectType: 'WorkflowStep', approvedPath: 'certificate', rejectedPath: 'end-rejected', next: 'certificate',
        },
        {
          id: 'certificate', type: 'document', name: 'Issue the certificate', templateCode: 'ServiceCertificate', next: 'end-issued',
        },
        { id: 'end-issued', type: 'end' },
        { id: 'end-rejected', type: 'end' },
      ],
    },
  ];
  for (const d of definitions) {
    await repository('WorkflowDefinition').insertAsync({
      ...d,
      version: 1,
      status: 'Published',
      publishedBy: 'pack',
      publishedOnUtc: new Date().toISOString(),
      heldBy: 'WF-ENG',
      prototypeDefault: 'Prototype default - decision WF-ENG pending',
    });
  }

  /* ------------------------------------------------- ADM-009 exceptions, ADM-010 alerts  */
  const now = Date.now();
  const exceptions = [
    {
      type: 'IntegrationError', severity: 'High', reasonCode: 'UPSTREAM_ERROR', source: 'MRA-EIS', raisedBy: 'PRD-PAY-027', minutesAgo: 180,
    },
    {
      type: 'IntegrationError', severity: 'High', reasonCode: 'UPSTREAM_ERROR', source: 'MRA-EIS', raisedBy: 'PRD-PAY-027', minutesAgo: 120,
    },
    {
      type: 'IntegrationError', severity: 'Medium', reasonCode: 'UPSTREAM_ERROR', source: 'MRA-EIS', raisedBy: 'PRD-PAY-027', minutesAgo: 60,
    },
    {
      type: 'StuckOrder', severity: 'Critical', reasonCode: 'RETRY_LATER', source: 'Order', raisedBy: 'PRD-ORD-002', minutesAgo: 30,
    },
    {
      type: 'FailedCheck', severity: 'Low', reasonCode: 'DATA_FIXED', source: 'Customer', raisedBy: 'PRD-IAM-020', minutesAgo: 10,
    },
  ];
  for (const e of exceptions) {
    await repository('ExceptionRecord').insertAsync({
      type: e.type,
      severity: e.severity,
      reasonCode: e.reasonCode,
      source: e.source,
      raisedBy: e.raisedBy,
      entityRef: { type: e.source, id: 1 },
      details: { message: `${e.source} returned an error` },
      allowedActions: [{ action: 'retry', batchSafe: true }, { action: 'escalate', batchSafe: true }, { action: 'resolve', batchSafe: false }],
      status: 'Open',
      attempts: 0,
      raisedOnUtc: new Date(now - e.minutesAgo * 60000).toISOString(),
    });
  }
  for (const rule of [
    {
      measure: 'open-exceptions:IntegrationError', threshold: 2, windowMinutes: 60, recipients: ['operations@example.com'], channel: 'email', repeatIntervalMinutes: 240, isActive: true,
    },
    {
      measure: 'orders-in-status:Pending', threshold: 5, windowMinutes: 120, recipients: ['operations@example.com'], channel: 'email', repeatIntervalMinutes: 240, isActive: true,
    },
  ]) await repository('AlertRule').insertAsync(rule);

  /* ------------------------------------------------ ADM-011 and ADM-012 templates ------ */
  const verticalDefault = await repository('TransactionTemplate').insertAsync({
    code: 'postal-parcel-default',
    name: 'Postal parcel (vertical default)',
    scope: 'vertical',
    parentId: null,
    typeCode: 'fixed-price-sale',
    values: {
      incoterm: 'DAP', paymentTermDays: 30, packaging: 'standard', insurance: false,
    },
    status: 'Active',
    activeVersionNo: 1,
    suppliedBy: 'PRD-PLT-003 vertical pack',
  });
  const clientTemplate = await repository('TransactionTemplate').insertAsync({
    code: mw ? 'mpc-parcel' : 'ktda-parcel',
    name: mw ? 'Malawi Post parcel' : 'KTDA parcel',
    scope: 'client',
    parentId: verticalDefault.id,
    typeCode: 'fixed-price-sale',
    values: {
      incoterm: 'DAP', paymentTermDays: 14, packaging: 'standard', insurance: true, clientName: mw ? 'Malawi Posts Corporation' : 'Kenya Tea Development Agency',
    },
    status: 'Active',
    activeVersionNo: 1,
  });
  await repository('TemplateVersion').insertAsync({
    templateId: clientTemplate.id, no: 1, values: clientTemplate.values, author: 'pack', summary: 'derived from the vertical default', status: 'Active', createdOnUtc: new Date().toISOString(),
  });
  const stale = await repository('TransactionTemplate').insertAsync({
    code: 'legacy-bulk', name: 'Legacy bulk shipment', scope: 'client', parentId: verticalDefault.id, typeCode: 'contract', values: { incoterm: 'FOB', paymentTermDays: 60 }, status: 'Active', activeVersionNo: 1,
  });
  for (let i = 0; i < 6; i += 1) {
    await repository('TemplateUsage').insertAsync({
      templateId: clientTemplate.id, transactionRef: `TX-${1000 + i}`, outcome: i === 5 ? 'exception' : 'completed', usedOnUtc: new Date(now - i * 3 * 24 * 3600 * 1000).toISOString(),
    });
  }
  await repository('TemplateUsage').insertAsync({
    templateId: stale.id, transactionRef: 'TX-0001', outcome: 'completed', usedOnUtc: new Date(now - 200 * 24 * 3600 * 1000).toISOString(),
  });

  return {
    ruleSets: (await repository('RuleSet').getAllAsync()).length,
    transactionTypes: (await repository('TransactionType').getAllAsync()).length,
    approvalChains: (await repository('ApprovalChain').getAllAsync()).length,
    workflowDefinitions: (await repository('WorkflowDefinition').getAllAsync()).length,
    exceptions: (await repository('ExceptionRecord').getAllAsync()).length,
    alertRules: (await repository('AlertRule').getAllAsync()).length,
    templates: (await repository('TransactionTemplate').getAllAsync()).length,
  };
}
