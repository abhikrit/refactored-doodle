// Synthetic seed data - decision P-5 of the handoff section 4.
//
// "Synthetic data only; client content not supplied (T-MISS) shown as placeholders."
//
// Entity names follow nopCommerce 5.00.1: Customer, CustomerRole, PermissionRecord, Category,
// Product, Vendor, StorePickupPoint, ShippingMethod, Currency, Language, PriceList, Order,
// OrderItem, Shipment, ShipmentItem. Everything a client source does not state is either absent
// or marked as a placeholder - no client data, no real names, no real prices.

import { repository, resetStore } from '../../core/repository.js';
import {
  addRoleAsync, addPermissionAsync, grantAsync,
} from '../../core/permissions.js';
import { registry } from '@product/shared';
import { ktdaCatalogue } from './catalogue-ktda.js';
import { mpcCatalogue } from './catalogue-mpc.js';

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
  { name: 'Agent', systemName: 'Agent' },
  { name: 'Auditor', systemName: 'Auditor' },
  { name: 'Business buyer', systemName: 'BusinessBuyer' },
  { name: 'Company approver', systemName: 'CompanyApprover' },
  { name: 'Bulk buyer', systemName: 'BulkBuyer' },
];

async function seedSecurityAsync() {
  for (const role of ROLES) await addRoleAsync(role);

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
    catalogue: 'Catalogue',
    auditor: 'Auditor',
    auditors: 'Auditor',
    'platform team': 'PlatformTeam',
    platform: 'PlatformTeam',
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
    { email: 'admin@example.com', firstName: 'Platform', lastName: 'Administrator', roles: ['Administrators', 'PlatformTeam'], password: 'demo' },
    { email: 'finance@example.com', firstName: 'Finance', lastName: 'Officer', roles: ['Administrators', 'Finance'], password: 'demo' },
    { email: 'logistics@example.com', firstName: 'Logistics', lastName: 'Officer', roles: ['Administrators', 'Logistics'], password: 'demo' },
    { email: 'support@example.com', firstName: 'Support', lastName: 'Agent', roles: ['Administrators', 'Support'], password: 'demo' },
    { email: 'auditor@example.com', firstName: 'External', lastName: 'Auditor', roles: ['Auditor'], password: 'demo' },
  ];
  const clientSpecific = clientId === 'MPC'
    ? [{
      email: 'agent.lilongwe@example.com', firstName: 'Tadala', lastName: 'Mvula', roles: ['Administrators', 'Agent'], password: 'demo', outlet: 'Lilongwe Post Office',
    }]
    : [{
      email: 'depot.nairobi@example.com', firstName: 'Joseph', lastName: 'Kariuki', roles: ['Administrators', 'Logistics'], password: 'demo', outlet: 'KTDA Nairobi Depot',
    }];

  for (const c of [...common, ...clientSpecific]) {
    await repository('Customer').insertAsync({
      ...c, active: true, deleted: false, isSystemAccount: false, synthetic: true,
    });
  }
}

export async function seedAsync({ clientId, report }) {
  await resetStore();
  await seedSecurityAsync();
  await seedPackEntitiesAsync(report);
  await seedCustomersAsync(clientId);

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
    },
    placeholders: catalogue.placeholders ?? [],
  };
}
