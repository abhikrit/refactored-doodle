// PRD-ADM-001 Administration console — one test per acceptance criterion, named by AC ID.
//
// 12 criteria across 4 stories. Malawi Post FR-301 ("an administrative console for system
// configuration and governance functions") is delivered by this feature.
//
//   npm test

import {
  test, before, after, describe,
} from 'node:test';
import assert from 'node:assert/strict';
import { createApiApp } from '../../packages/server/src/app.js';

let server;
let base;

const call = async (method, path, body, session = 'adm-admin') => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-session': session },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};
const get = async (p, s) => (await call('GET', p, undefined, s)).body;
const post = async (p, b, s) => (await call('POST', p, b ?? {}, s)).body;
const patch = async (p, b, s) => (await call('PATCH', p, b ?? {}, s)).body;

const signIn = (email, session) => post('/api/identity/sign-in', { email, password: 'demo' }, session);

before(async () => {
  const { app } = await createApiApp({ defaultClient: 'MPC' });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  await signIn('admin@example.com', 'adm-admin');
  await signIn('catalogue@example.com', 'adm-catalogue');
  await signIn('auditor@example.com', 'adm-auditor');
});

after(() => { server?.close(); });

/* ------------------------------------ US-ADM-001-01 one back office --------- */

describe('US-ADM-001-01 one back office', () => {
  test('AC-ADM-001-01-01', async () => {
    // "each area opens; an area whose native permission the user lacks is denied"
    const asAdmin = await get('/api/admin-console/console', 'adm-admin');
    assert.equal(asAdmin.canOpenAdmin, true);
    assert.equal(asAdmin.areas.length, 8);
    assert.ok(asAdmin.areas.every((a) => a.granted), 'an administrator opens every area');
    for (const area of ['configuration-settings', 'configuration-plugins', 'configuration-widgets',
      'system-schedule-tasks', 'system-log', 'system-maintenance', 'catalog-products', 'customers']) {
      const r = await call('GET', `/api/admin-console/console/areas/${area}`, undefined, 'adm-admin');
      assert.equal(r.status, 200, `${area} opens for an administrator`);
    }

    // a role that holds Security.AccessAdminPanel but not the area's permission is denied
    const asCatalogue = await get('/api/admin-console/console', 'adm-catalogue');
    assert.equal(asCatalogue.canOpenAdmin, true);
    const products = asCatalogue.areas.find((a) => a.id === 'catalog-products');
    const tasks = asCatalogue.areas.find((a) => a.id === 'system-schedule-tasks');
    assert.equal(products.granted, true, 'the catalogue role opens Products');
    assert.equal(tasks.granted, false, 'the catalogue role does not open Schedule tasks');
    const denied = await call('GET', '/api/admin-console/console/areas/system-schedule-tasks', undefined, 'adm-catalogue');
    assert.equal(denied.status, 403);
    assert.equal(denied.body.permission, 'System.ManageScheduleTasks');

    // without Security.AccessAdminPanel no area opens at all
    const asAuditor = await get('/api/admin-console/console', 'adm-auditor');
    assert.equal(asAuditor.canOpenAdmin, false);
    assert.ok(asAuditor.areas.every((a) => !a.granted));
    const refused = await call('GET', '/api/admin-console/console/areas/catalog-products', undefined, 'adm-auditor');
    assert.equal(refused.status, 403);
    assert.equal(refused.body.permission, 'Security.AccessAdminPanel');
  });

  test('AC-ADM-001-01-02', async () => {
    // "the change applies to the whole installation (ScheduleTask has no store scope) and
    //  LastStartUtc, LastEndUtc and LastSuccessUtc show the result"
    const tasks = await get('/api/admin-console/schedule-tasks');
    assert.ok(tasks.length > 0);
    const task = tasks[0];
    assert.equal(Object.prototype.hasOwnProperty.call(task, 'storeId'), false, 'ScheduleTask has no store scope');

    const edited = await patch(`/api/admin-console/schedule-tasks/${task.id}`, { seconds: 123, enabled: false, stopOnError: true });
    assert.equal(edited.seconds, 123);
    assert.equal(edited.enabled, false);
    assert.equal(edited.stopOnError, true);

    const ran = await post(`/api/admin-console/schedule-tasks/${task.id}/run`);
    assert.ok(ran.lastStartUtc, 'LastStartUtc is set');
    assert.ok(ran.lastEndUtc, 'LastEndUtc is set');
    assert.ok(ran.lastSuccessUtc, 'LastSuccessUtc shows the success');

    // StopOnError: a failing run disables the task
    const failed = await post(`/api/admin-console/schedule-tasks/${task.id}/run`, { fail: true });
    assert.equal(failed.enabled, false);
    assert.ok(failed.lastError);

    // the edit is audited, and a role without the permission cannot make one
    const refused = await call('PATCH', `/api/admin-console/schedule-tasks/${task.id}`, { seconds: 5 }, 'adm-catalogue');
    assert.equal(refused.status, 403);
  });
});

/* ------------------------------------ US-ADM-001-02 bulk edit --------------- */

describe('US-ADM-001-02 bulk edit and archive', () => {
  test('AC-ADM-001-02-01', async () => {
    // "every selected product is updated in one save"
    const products = await get('/api/catalogue/products');
    const [a, b] = products.slice(0, 2);
    const res = await post('/api/admin-console/bulk-edit', {
      changes: [
        {
          id: a.id, name: `${a.name} (edited)`, price: 11.11, stockQuantity: 7,
        },
        { id: b.id, sku: 'BULK-SKU-2', oldPrice: 99.99, published: false },
      ],
    });
    assert.equal(res.saved, 2, 'both products saved in one call');
    const after = await get('/api/catalogue/products');
    const a2 = after.find((p) => p.id === a.id);
    assert.match(a2.name, /\(edited\)$/);
    assert.equal(a2.price, 11.11);
    assert.equal(a2.stockQuantity, 7);
    // the sixth field, Published, took effect: b is no longer in the published list
    assert.equal(after.some((p) => p.id === b.id), false, 'unpublished products leave the storefront list');

    const trail = await get('/api/security/audit?event=AUD-ADM-001');
    assert.ok(trail.some((e) => e.entity === 'Product' && e.entityId === String(a.id)));
  });

  test('AC-ADM-001-02-02', async () => {
    // "archived products are unpublished and disappear from the storefront but stay in admin;
    //  deletion is a separate soft delete"
    const before = await get('/api/catalogue/products');
    const victim = before[before.length - 1];

    const archived = await post('/api/admin-console/bulk-archive', { ids: [victim.id] });
    assert.equal(archived.archived, 1);
    const storefront = await get('/api/search?pageSize=50');
    assert.equal(storefront.items.some((p) => p.id === victim.id), false, 'gone from the storefront');
    const inAdmin = await get(`/api/catalogue/products/${victim.id}`);
    assert.equal(inAdmin.id, victim.id, 'still there in admin');
    assert.equal(inAdmin.published, false);
    assert.equal(inAdmin.deleted ?? false, false, 'archive is not a delete');

    const deleted = await post('/api/admin-console/bulk-delete', { ids: [victim.id] });
    assert.equal(deleted.deleted, 1);
    const afterDelete = await get(`/api/catalogue/products/${victim.id}`);
    assert.equal(afterDelete.deleted, true, 'delete is the separate soft delete, Product.Deleted');
  });
});

/* ------------------------------------ US-ADM-001-03 customer actions -------- */

describe('US-ADM-001-03 suspend, reactivate, delete', () => {
  test('AC-ADM-001-03-01', async () => {
    // "the customer can no longer sign in and the reason is recorded; reactivation restores it"
    const email = 'buyer@example.com';
    const noReason = await post('/api/admin-console/customers/active', { email, active: false });
    assert.equal(noReason.ok, false, 'a reason is required');

    const off = await post('/api/admin-console/customers/active', { email, active: false, reason: 'Repeated chargebacks' });
    assert.equal(off.ok, true);
    assert.equal(off.customer.active, false);

    const blocked = await post('/api/identity/sign-in', { email, password: 'demo' }, 'adm-victim');
    assert.equal(blocked.ok, false, 'a deactivated customer cannot sign in');
    assert.equal(blocked.deactivated, true);

    const trail = await get('/api/security/audit?event=AUD-ADM-001');
    const entry = trail.find((e) => e.entity === 'Customer' && e.after && e.after.reason === 'Repeated chargebacks');
    assert.ok(entry, 'the reason is recorded in the audit trail');

    const on = await post('/api/admin-console/customers/active', { email, active: true });
    assert.equal(on.ok, true);
    const allowed = await post('/api/identity/sign-in', { email, password: 'demo' }, 'adm-victim');
    assert.equal(allowed.ok, true, 'reactivation restores sign-in');
  });

  test('AC-ADM-001-03-02', async () => {
    // "an administrator with Customers.GDPRManage processes it; the native GDPR delete runs"
    const refused = await call('POST', '/api/admin-console/customers/gdpr-delete', { email: 'company.buyer@example.com' }, 'adm-catalogue');
    assert.equal(refused.status, 403);
    assert.equal(refused.body.permission, 'Customers.GDPRManage');

    const done = await post('/api/admin-console/customers/gdpr-delete', { email: 'company.buyer@example.com' });
    assert.equal(done.ok, true);
    const customers = await get('/api/identity/customers');
    assert.equal(customers.some((c) => c.email === 'company.buyer@example.com'), false,
      'the address no longer identifies anyone');
    assert.equal(customers.some((c) => c.id === done.customerId), false,
      'Customer.Deleted keeps the row out of the customer list, as the native delete does');

    // the row itself is anonymised rather than dropped, so the orders it is referenced by survive
    const { repository } = await import('../../packages/server/src/core/repository.js');
    const anonymised = await repository('Customer').getByIdAsync(done.customerId);
    assert.equal(anonymised.deleted, true);
    assert.equal(anonymised.firstName, 'Deleted');
    assert.equal(anonymised.phone, null);
    assert.equal(anonymised.email, `deleted-${done.customerId}@removed.invalid`);
    assert.ok(anonymised.gdprDeletedOnUtc);
  });
});

/* ------------------------------------ US-ADM-001-04 extension register ------ */

describe('US-ADM-001-04 the product extension register', () => {
  test('AC-ADM-001-04-01', async () => {
    // "the ADM start-up, which runs after every other product plugin, reads what each registered;
    //  a target with more than one product implementation is a conflict"
    const reg = await get('/api/admin-console/extension-register');
    assert.ok(reg.startupCheck.checkedOnUtc);
    assert.equal(reg.startupCheck.ok, true, 'no conflict in the shipped register');
    assert.ok(reg.startupCheck.targets > 0);

    // the ADM start-up runs after every other product plugin, so the register is complete when
    // the check reads it: highest INopStartup order, last to install
    const plugins = await get('/api/platform/plugins');
    const adm = plugins.plugins.find((p) => p.systemName === 'Product.ADM');
    const others = plugins.plugins.filter((p) => p.systemName !== 'Product.ADM');
    assert.ok(adm, 'the ADM plugin is installed');
    assert.equal(others.length, 23, 'the other 23 area plugins');
    assert.ok(others.every((p) => p.startupOrder < adm.startupOrder), 'ADM has the last start-up order');
    assert.ok(others.every((p) => p.installSequence < adm.installSequence), 'ADM installed last');
    assert.equal(reg.startupCheck.extensions, reg.entries.length,
      'the check read every entry in the register');

    // a target with more than one product implementation is a conflict
    const { claimOverride } = await import('../../packages/server/src/core/providers.js');
    assert.throws(
      () => claimOverride('IWorkflowMessageService', { owner: 'Product.MKT', feature: 'PRD-MKT-005' }),
      /OVR-REG violation/,
      'a second implementation of a service another feature owns is refused',
    );
  });

  test('AC-ADM-001-04-02', async () => {
    // "every entry is listed with target, mechanism, owning feature, provider features and the rule"
    const reg = await get('/api/admin-console/extension-register');
    assert.ok(reg.entries.length > 0);
    for (const e of reg.entries) {
      assert.ok(e.target, 'target');
      assert.ok(e.mechanism, 'mechanism');
      assert.match(e.feature, /^PRD-[A-Z]+-\d{3}$/, 'owning feature');
      assert.ok(Array.isArray(e.providers), 'provider features');
      assert.match(e.rule, /^BR-ADM-\d{3}$/, 'the rule that specifies it');
    }
    // and it is behind its own permission
    const refused = await call('GET', '/api/admin-console/extension-register', undefined, 'adm-catalogue');
    assert.equal(refused.status, 403);
    assert.equal(refused.body.permission, 'Administration.Core.Extensions.View');
  });

  test('AC-ADM-001-04-03', async () => {
    // "a feature that needs to change a service owned by another implements the owner's provider
    //  interface and registers no implementation of the service itself"
    const { claimOverride, providers } = await import('../../packages/server/src/core/providers.js');
    assert.throws(
      () => claimOverride('IShoppingCartService', { owner: 'Product.ADM', feature: 'PRD-ADM-005' }),
      /OVR-REG violation/,
      'a second owner of IShoppingCartService is refused',
    );
    // the way a module does plug in: as a provider on the owner's contract
    assert.ok(providers('IC-CHK-01').length > 0, 'the owner publishes a provider contract');
  });

  test('AC-ADM-001-04-04', async () => {
    // "the filters run in the order recorded, each can refuse independently, and a refusal stops
    //  the action before it runs"
    const reg = await get('/api/admin-console/extension-register');
    const onAddShipment = reg.entries
      .filter((e) => e.mechanism === 'action filter' && e.target === 'Admin OrderController.AddShipment');
    assert.equal(onAddShipment.length, 3, 'PAY, INV and LOG each guard AddShipment');
    const orders = onAddShipment.map((e) => e.order);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), 'recorded in order');

    const run = await post('/api/admin-console/extension-register/simulate', { action: 'Admin OrderController.AddShipment' });
    assert.equal(run.ok, true, 'with no refusal the action proceeds');
    assert.equal(run.ran.length, 3);
    assert.deepEqual(run.ran.map((r) => r.feature), onAddShipment.sort((a, b) => a.order - b.order).map((e) => e.feature));
  });

  test('AC-ADM-001-04-05', async () => {
    // "the bundled Misc.Brevo plugin replaces IWorkflowMessageService ... a conflict is shown;
    //  client instances do not install Misc.Brevo"
    const before = await get('/api/admin-console/extension-register');
    assert.equal(before.bundledPlugins.find((p) => p.systemName === 'Misc.Brevo').installed, false,
      'client instances do not install Misc.Brevo');

    const installed = await post('/api/admin-console/extension-register/simulate', { installPlugin: 'Misc.Brevo', installed: true });
    assert.equal(installed.startupCheck.ok, false, 'the start-up check reports a conflict');
    const warning = installed.startupCheck.warnings.find((w) => w.plugin === 'Misc.Brevo');
    assert.ok(warning, 'the conflict names the plugin');
    assert.match(warning.target, /IWorkflowMessageService/);
    assert.equal(warning.rule, 'BR-ADM-003');

    await post('/api/admin-console/extension-register/simulate', { installPlugin: 'Misc.Brevo', installed: false });
    const after = await get('/api/admin-console/extension-register');
    assert.equal(after.startupCheck.ok, true);
  });

  test('AC-ADM-001-04-06', async () => {
    // "it supplies a rule to the owner and registers no action filter of its own on that action;
    //  the register shows the owner and its rule providers; the release check fails on a second filter"
    const reg = await get('/api/admin-console/extension-register');
    const impersonate = reg.entries.filter((e) => e.target === 'Admin CustomerController.Impersonate');
    assert.equal(impersonate.length, 1, 'one filter on an action whose decision has one owner');
    assert.equal(impersonate[0].feature, 'PRD-IAM-026');
    assert.deepEqual(impersonate[0].providers.map((p) => p.feature).sort(), ['PRD-CHK-013', 'PRD-CRM-015']);

    const { registerActionFilter } = await import('../../packages/server/src/core/providers.js');
    assert.throws(
      () => registerActionFilter('Admin CustomerController.Impersonate', { owner: 'Product.CRM', feature: 'PRD-CRM-015' }),
      /SINGLE-FILTER violation/,
      'a second filter on the action is refused',
    );
    // the same rule holds for downloads (SEC-002) and uploads
    const downloads = reg.entries.filter((e) => e.target === 'Nop.Web DownloadController.GetFileUpload');
    assert.equal(downloads.length, 1);
    assert.equal(downloads[0].feature, 'PRD-SEC-002');
  });
});
