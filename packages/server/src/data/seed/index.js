// Synthetic seed data - decision P-5 of the handoff section 4.
//
// "Synthetic data only; client content not supplied (T-MISS) shown as placeholders."
//
// Entity names follow nopCommerce 5.00.1: Customer, CustomerRole, PermissionRecord, Category,
// Product, Vendor, StorePickupPoint, ShippingMethod, Currency, Language, PriceList, Order,
// OrderItem, Shipment, ShipmentItem. Everything a client source does not state is either absent
// or marked as a placeholder - no client data, no real names, no real prices.

import { repository, resetStore } from '../../core/repository.js';
import { withAuditContextAsync } from '../../core/audit-context.js';
import {
  addRoleAsync, addPermissionAsync, grantAsync,
} from '../../core/permissions.js';
import { registry } from '@product/shared';
import { ktdaCatalogue } from './catalogue-ktda.js';
import { mpcCatalogue } from './catalogue-mpc.js';
import { seedAdmAsync } from './adm.js';

// The product role catalogue, BR-IAM-050. System names are the ones the permission tables use.
const ROLES = [
  { name: 'Administrators', systemName: 'Administrators', isSystemRole: true },
  { name: 'Registered', systemName: 'Registered', isSystemRole: true },
  { name: 'Guests', systemName: 'Guests', isSystemRole: true },
  { name: 'Vendors', systemName: 'Vendors', isSystemRole: true },
  { name: 'Platform team', systemName: 'PlatformTeam' },
  { name: 'Client administrator', systemName: 'ClientAdministrator' },
  { name: 'Catalogue staff', systemName: 'Catalogue' },
  { name: 'Finance', systemName: 'Finance' },
  { name: 'Logistics', systemName: 'Logistics' },
  { name: 'Warehouse', systemName: 'Warehouse' },
  { name: 'Support', systemName: 'Support' },
  { name: 'Compliance', systemName: 'Compliance' },
  { name: 'Operations', systemName: 'Operations' },
  { name: 'Agent', systemName: 'Agent' },
  { name: 'Auditor', systemName: 'Auditor' },
  { name: 'Business buyer', systemName: 'BusinessBuyer' },
  { name: 'Company approver', systemName: 'CompanyApprover' },
  { name: 'Bulk buyer', systemName: 'BulkBuyer' },
];

async function seedSecurityAsync() {
  for (const role of ROLES) await addRoleAsync(role);
  // BR-IAM-050: every role of the product catalogue exists, created by IAM at installation and at
  // every start; the pack loader resets the store after the plugins install, so it is seeded here
  const { ensureProductRolesAsync } = await import('../../plugins/product-iam/services/access.js');
  await ensureProductRolesAsync();

  // Permissions come from the module chapters' section 4 permission tables (304 rows),
  // so the ACL screen shows the real 5.00.1 system names, not invented ones.
  const seen = new Set();
  for (const p of registry.permissions) {
    for (const systemName of p.systemName.split('/').map((x) => x.trim()).filter(Boolean)) {
      if (seen.has(systemName)) continue;
      seen.add(systemName);
      await addPermissionAsync({
        systemName,
        name: systemName,
        category: p.category || 'Configuration',
        area: p.area,
        native: p.native,
        allows: p.allows,
        defaultRoles: p.defaultRoles,
      });
    }
  }

  // AC-ADM-001-01-01 gates the Maintenance area on its native permission. System.ManageMaintenance
  // is a real 5.00.1 permission but it is not in the ADM chapter's permission table, so it is added
  // here and flagged rather than left out, which would leave the area ungated.
  await addPermissionAsync({
    systemName: 'System.ManageMaintenance',
    name: 'System.ManageMaintenance',
    category: 'System',
    area: 'ADM',
    native: true,
    allows: 'Open System > Maintenance and run maintenance actions',
    defaultRoles: ['Administrators'],
    notInChapterTable: 'native 5.00.1 permission; AC-ADM-001-01-01 names the Maintenance area but the ADM chapter permission table does not list it',
  });
  await grantAsync('System.ManageMaintenance', 'Administrators');

  // Customers.ActivityLogDelete is the native 5.00.1 permission AC-IAM-012-01-03 names, and the
  // IAM chapter permission table does not list it either; it is added and flagged rather than
  // left out, which would leave the activity-log clear ungated.
  // Configuration.ManageCountries is the native 5.00.1 permission of the countries and regions
  // screen, which PRD-PLT section 11.1 lists as native for PLT-009 while the PLT permission table
  // does not name it; added and flagged, rather than leaving the region import ungated.
  await addPermissionAsync({
    systemName: 'Configuration.ManageCountries',
    name: 'Configuration.ManageCountries',
    category: 'Configuration',
    area: 'PLT',
    native: true,
    allows: 'Edit countries and import the regions or districts of a country (PLT-009)',
    defaultRoles: ['Administrators'],
    notInChapterTable: 'native 5.00.1 permission of a screen PRD-PLT section 11.1 lists as native; the PLT chapter permission table does not list it',
  });
  await grantAsync('Configuration.ManageCountries', 'Administrators');

  await addPermissionAsync({
    systemName: 'Customers.ActivityLogDelete',
    name: 'Customers.ActivityLogDelete',
    category: 'Customers',
    area: 'IAM',
    native: true,
    allows: 'Clear the native customer activity log',
    defaultRoles: ['Administrators'],
    notInChapterTable: 'native 5.00.1 permission named by AC-IAM-012-01-03; the IAM chapter permission table does not list it',
  });
  await grantAsync('Customers.ActivityLogDelete', 'Administrators');

  // Security.AccessAdminPanel: "Administrators, Vendors and roles granted by IAM-007" (ADM
  // chapter section 4). The staff roles below are the IAM-007 grant for this prototype; Auditor
  // is deliberately left out, because SEC-010 gives an auditor a read-only surface of its own.
  for (const role of ['Catalogue', 'Finance', 'Logistics', 'Warehouse', 'Support', 'Compliance', 'Agent', 'PlatformTeam', 'Operations', 'PrivacyOfficer', 'SecurityOfficer']) {
    try { await grantAsync('Security.AccessAdminPanel', role); } catch { /* role not seeded */ }
  }
  // "Administration.Core.Approvals.Act: Administrators and the roles named on approval steps"
  // (ADM chapter section 4). The roles named on the seeded chains are these, so they are granted
  // here rather than left ungranted, which would empty every approval queue (AC-ADM-006-01-01).
  for (const role of ['Finance', 'Compliance', 'Catalogue', 'Operations']) {
    try { await grantAsync('Administration.Core.Approvals.Act', role); } catch { /* role not seeded */ }
  }

  // the catalogue role runs the bulk edit (AC-ADM-001-02-01)
  for (const p2 of ['Catalog.ProductsView', 'Catalog.ProductsCreateEditDelete']) {
    try { await grantAsync(p2, 'Catalogue'); } catch { /* permission not in the chapter tables */ }
  }

  const roleBySpokenName = {
    administrators: 'Administrators',
    administrator: 'Administrators',
    vendors: 'Vendors',
    vendor: 'Vendors',
    registered: 'Registered',
    guests: 'Guests',
    finance: 'Finance',
    'finance staff': 'Finance',
    agent: 'Agent',
    agents: 'Agent',
    logistics: 'Logistics',
    warehouse: 'Warehouse',
    support: 'Support',
    compliance: 'Compliance',
    operations: 'Operations',
    'operations staff': 'Operations',
    'platform operator': 'PlatformTeam',
    platformoperator: 'PlatformTeam',
    catalogue: 'Catalogue',
    auditor: 'Auditor',
    auditors: 'Auditor',
    'platform team': 'PlatformTeam',
    platform: 'PlatformTeam',
    // the rest of the BR-IAM-050 product role catalogue, as the chapter tables name them
    accountmanager: 'AccountManager',
    'account manager': 'AccountManager',
    securityofficer: 'SecurityOfficer',
    'security officer': 'SecurityOfficer',
    privacyofficer: 'PrivacyOfficer',
    'privacy officer': 'PrivacyOfficer',
    supportmanager: 'SupportManager',
    'support manager': 'SupportManager',
    operationsmanager: 'OperationsManager',
    'operations manager': 'OperationsManager',
    tradebuyer: 'TradeBuyer',
    'trade buyer': 'TradeBuyer',
    risk: 'Risk',
    stock: 'Stock',
    quality: 'Quality',
    courier: 'Courier',
    marketing: 'Marketing',
    content: 'Content',
    contentapprover: 'ContentApprover',
    'content approver': 'ContentApprover',
    analyst: 'Analyst',
    procurement: 'Procurement',
    programme: 'Programme',
    agencyofficer: 'AgencyOfficer',
    'agency officer': 'AgencyOfficer',
    agencyadmin: 'AgencyAdmin',
    'agency administrator': 'AgencyAdmin',
    logisticsops: 'LogisticsOps',
    'logistics operations': 'LogisticsOps',
  };
  for (const p of registry.permissions) {
    for (const systemName of p.systemName.split('/').map((x) => x.trim()).filter(Boolean)) {
      for (const spoken of p.defaultRoles) {
        const target = roleBySpokenName[spoken.trim().toLowerCase()];
        if (!target) continue;
        try {
          await grantAsync(systemName, target);
        } catch { /* a permission named in two modules is granted once */ }
      }
    }
  }
}

async function seedPackEntitiesAsync(report) {
  const { entities = {}, content = {} } = report;
  for (const lang of entities.languages ?? []) {
    await repository('Language').insertAsync({
      ...lang, limitedToStores: [], published: lang.published !== false,
    });
  }
  for (const cur of entities.currencies ?? []) {
    await repository('Currency').insertAsync({ ...cur, published: true });
  }
  for (const m of entities.shippingMethods ?? []) {
    await repository('ShippingMethod').insertAsync(m);
  }
  for (const p of entities.pickupPoints ?? []) {
    await repository('StorePickupPoint').insertAsync({
      ...p,
      // LOG-003 outlet extensions: capacity and closures (new entities in the real build)
      acceptsReturns: true,
      capacityParcels: 150,
      openNow: true,
    });
  }
  for (const s of content.storefronts ?? []) {
    await repository('Store').insertAsync({
      ...s, sslEnabled: true, companyName: content.clientName,
    });
  }
  for (const state of entities.statesProvinces ?? []) {
    await repository('StateProvince').insertAsync({ name: state, published: true });
  }
}

async function seedCustomersAsync(clientId) {
  const common = [
    {
      email: 'buyer@example.com',
      firstName: 'Amina',
      lastName: 'Otieno',
      roles: ['Registered'],
      phone: '+254700000001',
      password: 'demo',
      addresses: [{
        firstName: 'Amina', lastName: 'Otieno', addressLine1: '12 Moi Avenue', city: 'Nairobi', county: 'Nairobi', country: 'Kenya', zip: '00100', phone: '+254700000001', landmark: 'Opposite the city market',
      }],
    },
    {
      email: 'company.buyer@example.com',
      firstName: 'Daniel',
      lastName: 'Phiri',
      roles: ['Registered', 'BusinessBuyer'],
      phone: '+265880000002',
      password: 'demo',
      company: 'Phiri Wholesale Ltd',
      creditLimit: 500000,
      addresses: [{
        firstName: 'Daniel', lastName: 'Phiri', addressLine1: 'Plot 44, Area 4', city: 'Lilongwe', county: 'Lilongwe', country: 'Malawi', phone: '+265880000002', landmark: 'Next to the Area 4 filling station',
      }],
    },
    {
      email: 'approver@example.com', firstName: 'Grace', lastName: 'Banda', roles: ['Registered', 'CompanyApprover'], phone: '+265880000003', password: 'demo', company: 'Phiri Wholesale Ltd',
    },
    // IAM-007: not every staff member is an Administrator. Each role carries only the
    // permissions its chapter grants it, which is what AC-ADM-001-01-01 is about - an area whose
    // native permission the user lacks is denied.
    { email: 'admin@example.com', firstName: 'Platform', lastName: 'Administrator', roles: ['Administrators', 'PlatformTeam'], password: 'demo' },
    // a second administrator: AC-ADM-011-04-01 needs an approver other than the author, and
    // BR-ADM-030 keeps one user to one step of an item, so the role needs two people in it
    { email: 'config.approver@example.com', firstName: 'Configuration', lastName: 'Approver', roles: ['Administrators'], password: 'demo' },
    // BR-PLT-020: a High-impact configuration change needs two approvers, neither of them the
    // requester, so the role needs a third person in it
    { email: 'config.approver2@example.com', firstName: 'Second', lastName: 'Approver', roles: ['Administrators'], password: 'demo' },
    { email: 'catalogue@example.com', firstName: 'Catalogue', lastName: 'Manager', roles: ['Catalogue'], password: 'demo' },
    {
      email: 'finance@example.com', firstName: 'Finance', lastName: 'Officer', roles: ['Finance'], password: 'demo', authorityLimits: { approval: 500000 },
    },
    { email: 'logistics@example.com', firstName: 'Logistics', lastName: 'Officer', roles: ['Logistics'], password: 'demo' },
    { email: 'support@example.com', firstName: 'Support', lastName: 'Agent', roles: ['Support'], password: 'demo' },
    { email: 'auditor@example.com', firstName: 'External', lastName: 'Auditor', roles: ['Auditor'], password: 'demo' },
    {
      email: 'operations@example.com', firstName: 'Operations', lastName: 'Supervisor', roles: ['Operations'], password: 'demo', authorityLimits: { approval: 250000 },
    },
    {
      email: 'compliance@example.com', firstName: 'Compliance', lastName: 'Officer', roles: ['Compliance'], password: 'demo', authorityLimits: { approval: 1000000 },
    },
    // the SEC chapter's own roles: the privacy officer holds the data-protection permissions and
    // the security officer the sign-in and audit ones
    { email: 'privacy@example.com', firstName: 'Privacy', lastName: 'Officer', roles: ['PrivacyOfficer'], password: 'demo' },
    { email: 'security@example.com', firstName: 'Security', lastName: 'Officer', roles: ['SecurityOfficer'], password: 'demo' },
  ];
  const clientSpecific = clientId === 'MPC'
    ? [{
      email: 'agent.lilongwe@example.com', firstName: 'Tadala', lastName: 'Mvula', roles: ['Administrators', 'Agent'], password: 'demo', outlet: 'Lilongwe Post Office',
    }]
    : [{
      email: 'depot.nairobi@example.com', firstName: 'Joseph', lastName: 'Kariuki', roles: ['Logistics'], password: 'demo', outlet: 'KTDA Nairobi Depot',
    }];

  const { newSalt, hashPassword } = await import('../../plugins/product-iam/services/passwords.js');
  for (const c of [...common, ...clientSpecific]) {
    const { password, ...rest } = c;
    const customer = await repository('Customer').insertAsync({
      ...rest, password: null, active: true, deleted: false, isSystemAccount: false, synthetic: true,
    });
    // BR-SEC-001: the password is a salted SHA-512 hash in CustomerPassword, never a clear value
    if (password) {
      const passwordSalt = newSalt();
      await repository('CustomerPassword').insertAsync({
        customerId: customer.id,
        passwordFormat: 'Hashed',
        hashedPasswordFormat: 'SHA512',
        passwordSalt,
        password: hashPassword(password, passwordSalt),
        createdOnUtc: new Date().toISOString(),
      });
    }
  }
}

export async function seedAsync({ clientId, report }) {
  return withAuditContextAsync({ installing: true, actor: 'installation', actorRole: 'System' }, () => seedInnerAsync({ clientId, report }));
}

async function seedInnerAsync({ clientId, report }) {
  await resetStore();
  await seedSecurityAsync();
  await seedPackEntitiesAsync(report);
  await seedCustomersAsync(clientId);

  // The native Country rows the address book and PRD-IAM-024 need. BR-IAM-121 requires
  // Country.SubjectToVat to be reviewed for every country rather than left at a default, so each
  // row below carries the reviewed value for the countries these two clients trade in.
  for (const c of [
    { name: 'Malawi', twoLetterIsoCode: 'MW', threeLetterIsoCode: 'MWI', subjectToVat: true },
    { name: 'Kenya', twoLetterIsoCode: 'KE', threeLetterIsoCode: 'KEN', subjectToVat: true },
    { name: 'South Africa', twoLetterIsoCode: 'ZA', threeLetterIsoCode: 'ZAF', subjectToVat: true },
    { name: 'Zambia', twoLetterIsoCode: 'ZM', threeLetterIsoCode: 'ZMB', subjectToVat: true },
  ]) {
    await repository('Country').insertAsync({
      ...c, published: true, allowsBilling: true, allowsShipping: true, subjectToVatReviewedBy: 'BR-IAM-121',
    });
  }

  // PRD-IAM-016 and PRD-IAM-017: the policy versions MKT-008 supplies through IC-MKT-03, the
  // native GdprConsent rows and the quotes and return requests of the bundled Misc.RFQ plugin.
  for (const v of [
    {
      policySystemName: 'ConditionsOfUse', versionNo: 1, reacceptanceRequired: false, published: true, effectiveFromUtc: '2025-01-01T00:00:00.000Z',
    },
    {
      policySystemName: 'PrivacyPolicy', versionNo: 1, reacceptanceRequired: false, published: true, effectiveFromUtc: '2025-01-01T00:00:00.000Z',
    },
    {
      policySystemName: 'VendorTermsOfService', versionNo: 1, reacceptanceRequired: false, published: true, effectiveFromUtc: '2025-01-01T00:00:00.000Z',
    },
  ]) await repository('PolicyVersion').insertAsync({ ...v, storeId: 1, suppliedBy: 'PRD-MKT-008' });

  for (const c of [
    {
      systemName: 'MarketingConsent', message: 'I agree to receive offers and news', isRequired: false, displayOnCustomerInfoPage: true, isMarketing: true, displayOrder: 1,
    },
    {
      systemName: 'PersonalisationConsent', message: 'I agree to personalised recommendations', isRequired: false, displayOnCustomerInfoPage: true, isMarketing: false, displayOrder: 2,
    },
    {
      systemName: 'ServiceTermsConsent', message: 'I accept the conditions of use', isRequired: true, displayOnCustomerInfoPage: true, isMarketing: false, displayOrder: 3,
    },
  ]) await repository('GdprConsent').insertAsync(c);

  // PRD-ADM-001: the console's own data - scheduled tasks, the system log and page widgets.
  // Names and intervals are the nopCommerce 5.00.1 defaults; ScheduleTask has no store scope.
  for (const t of [
    { name: 'Send emails', seconds: 60, type: 'Nop.Services.Messages.QueuedMessagesSendTask' },
    { name: 'Keep alive', seconds: 300, type: 'Nop.Services.Common.KeepAliveTask' },
    { name: 'Delete guests', seconds: 600, type: 'Nop.Services.Customers.DeleteGuestsTask' },
    { name: 'Clear cache', seconds: 600, type: 'Nop.Services.Caching.ClearCacheTask' },
    { name: 'Clear log', seconds: 3600, type: 'Nop.Services.Logging.ClearLogTask' },
    { name: 'Update currency exchange rates', seconds: 3600, type: 'Nop.Services.Directory.UpdateExchangeRateTask' },
    { name: 'Pack loader: apply pending configuration pack', seconds: 1800, type: 'Product.PLT.ApplyPackTask', productTask: 'PRD-PLT-003' },
    { name: 'Tracking: poll carrier events', seconds: 900, type: 'Product.TRK.PollCarrierEventsTask', productTask: 'PRD-TRK-002' },
  ]) {
    await repository('ScheduleTask').insertAsync({
      ...t,
      enabled: true,
      stopOnError: false,
      lastStartUtc: null,
      lastEndUtc: null,
      lastSuccessUtc: null,
      lastError: null,
      synthetic: true,
    });
  }
  for (const l of [
    { logLevel: 'Information', shortMessage: 'Application started', fullMessage: 'The prototype started and applied the client configuration pack.' },
    { logLevel: 'Information', shortMessage: 'Configuration pack applied', fullMessage: 'The configuration layers were merged in order: global, country, vertical, client, store.' },
    { logLevel: 'Warning', shortMessage: 'Mock adapter not configured for a real sandbox', fullMessage: 'Every external system is a mock (decision P-3).' },
    { logLevel: 'Error', shortMessage: 'Payment callback for an unknown reference', fullMessage: 'A callback arrived for a provider reference with no transaction. Synthetic sample.' },
  ]) {
    await repository('Log').insertAsync({ ...l, ipAddress: '127.0.0.1', pageUrl: '/', customerId: null, createdOnUtc: new Date().toISOString(), synthetic: true });
  }
  for (const w of [
    { systemName: 'Widgets.NivoSlider', friendlyName: 'Nivo slider', widgetZones: ['home_page_top'], displayOrder: 1, isActive: true },
    { systemName: 'Product.MKT.PolicyNotice', friendlyName: 'Policy notice (MKT-008)', widgetZones: ['checkout_confirm_bottom'], displayOrder: 2, isActive: true, feature: 'PRD-MKT-008' },
    { systemName: 'Product.CRM.CustomerBlock', friendlyName: 'Support block on the customer page (CRM-003)', widgetZones: ['admin_customer_details_block'], displayOrder: 3, isActive: true, feature: 'PRD-CRM-003' },
    { systemName: 'Product.TRK.OrderTracking', friendlyName: 'Tracking on the order page (TRK-001)', widgetZones: ['orderdetails_page_overview'], displayOrder: 4, isActive: false, feature: 'PRD-TRK-001' },
  ]) {
    await repository('Widget').insertAsync({ ...w, synthetic: true });
  }

  const catalogue = clientId === 'KTDA' ? ktdaCatalogue : mpcCatalogue;
  for (const vendor of catalogue.vendors) {
    await repository('Vendor').insertAsync({ ...vendor, active: true, synthetic: true });
  }
  for (const category of catalogue.categories) {
    await repository('Category').insertAsync({ ...category, published: true, synthetic: true });
  }
  for (const product of catalogue.products) {
    await repository('Product').insertAsync({
      ...product,
      published: true,
      synthetic: true,
      stockQuantity: product.stockQuantity ?? 120,
      manageInventoryMethod: product.manageInventoryMethod ?? 'ManageStock',
    });
  }
  for (const priceList of catalogue.priceLists ?? []) {
    await repository('PriceList').insertAsync({ ...priceList, synthetic: true });
  }
  for (const slot of catalogue.deliverySlots ?? []) {
    await repository('DeliverySlotDefinition').insertAsync({ ...slot, synthetic: true });
  }

  // PRD-ADM-002 to PRD-ADM-012: rule sets, transaction types, eligibility, approval chains,
  // workflow definitions, exceptions, alert rules and the template library. Last, because the
  // quota and the template analytics are seeded against the catalogue above.
  const adm = await seedAdmAsync({ clientId });

  return {
    clientId,
    counts: {
      vendors: catalogue.vendors.length,
      categories: catalogue.categories.length,
      products: catalogue.products.length,
      priceLists: (catalogue.priceLists ?? []).length,
      customers: (await repository('Customer').getAllAsync()).length,
      roles: (await repository('CustomerRole').getAllAsync()).length,
      permissions: (await repository('PermissionRecord').getAllAsync()).length,
      pickupPoints: (await repository('StorePickupPoint').getAllAsync()).length,
      languages: (await repository('Language').getAllAsync()).length,
      currencies: (await repository('Currency').getAllAsync()).length,
      scheduleTasks: (await repository('ScheduleTask').getAllAsync()).length,
      logEntries: (await repository('Log').getAllAsync()).length,
      widgets: (await repository('Widget').getAllAsync()).length,
      ...adm,
    },
    placeholders: catalogue.placeholders ?? [],
  };
}
