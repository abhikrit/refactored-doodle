// Browser tests for the Session 0 journey, named by AC ID.
//
//   npm run dev        (in one terminal, serves http://localhost:4000)
//   npm run test:ui    (in another)
//
// Playwright is used from wherever it is installed; if it cannot be resolved the suite skips
// rather than failing, because the Node tests above already cover the same criteria at the API.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const BASE = process.env.PROTOTYPE_URL ?? 'http://localhost:4000';

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {
  try {
    ({ chromium } = require('/opt/node-tools/node_modules/playwright/index.js'));
  } catch { chromium = null; }
}

let reachable = false;
try {
  const res = await fetch(`${BASE}/api/meta`);
  reachable = res.ok;
} catch { reachable = false; }

const skip = !chromium
  ? 'playwright is not installed'
  : !reachable
    ? `nothing is serving ${BASE} - run npm run dev first`
    : false;

let browser;
let page;

before(async () => {
  if (skip) return;
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
});

after(async () => { await browser?.close(); });

const reset = async (client) => {
  await page.goto(`${BASE}/`);
  await page.evaluate(async (c) => {
    const session = localStorage.getItem('nop-prototype-session') ?? 'default';
    await fetch('/api/platform/packs/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session': session },
      body: JSON.stringify({ clientId: c, storeId: 1 }),
    });
  }, client);
  await page.reload({ waitUntil: 'networkidle' });
};

/**
 * The administration area is authenticated (Security.AccessAdminPanel), so a browser test that
 * opens an admin screen signs in first, the way a person does: nopCommerce sends an
 * unauthenticated request to /Admin to the storefront login with a ReturnUrl.
 */
const signInAsAdmin = async () => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  if ((await page.locator('#login-email').count()) === 0) return; // already signed in
  await page.fill('#login-email', 'admin@example.com');
  await page.fill('#login-password', 'demo');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL(/\/(admin|)$/, { timeout: 10000 }).catch(() => {});
};

describe('Session 0 journey in the browser', { skip }, () => {
  test('AC-CHK-001-01-01', async () => {
    // Adding from the storefront shows the line and a server-calculated total.
    await reset('KTDA');
    await page.goto(`${BASE}/search`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await page.waitForTimeout(400);
    await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
    await assert.doesNotReject(page.getByRole('heading', { name: 'Shopping cart' }).waitFor({ timeout: 5000 }));
    const rows = await page.locator('table tbody tr').count();
    assert.ok(rows >= 1, 'the cart page lists the line');
  });

  test('AC-CHK-002-02-02', async () => {
    // Malawi Post requires sign-in before payment: the same code, a different pack.
    await reset('MPC');
    await page.goto(`${BASE}/search`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Add to cart' }).first().click();
    await page.waitForTimeout(400);
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText();
    assert.match(text, /Sign in to continue/i);
    assert.match(text, /anonymouscheckoutallowed/i);
  });

  test('AC-PLT-003-01-01', async () => {
    // Applying a client pack changes behaviour with no code change: the storefront re-skins and
    // the merge chain is shown with the layer that won each key.
    await reset('KTDA');
    const ktdaStore = await page.locator('header, body').first().innerText();
    assert.match(ktdaStore, /KTDA/);
    await reset('MPC');
    const mpcStore = await page.locator('body').first().innerText();
    assert.match(mpcStore, /Malawi Post/);

    await signInAsAdmin();
    await page.goto(`${BASE}/admin/configuration/packs`, { waitUntil: 'networkidle' });
    const chain = await page.locator('main').innerText();
    for (const layer of ['global', 'country', 'vertical', 'client', 'store']) {
      assert.match(chain, new RegExp(layer, 'i'), `the merge chain shows the ${layer} layer`);
    }
    await reset('KTDA');
  });

  test('AC-CHK-004-01-01', async () => {
    // The whole buyer journey through the user interface: two sellers, one delivered and one
    // collected, one mobile-money payment, one checkout reference, two sub-orders.
    await reset('KTDA');
    await page.goto(`${BASE}/search?pageSize=24`, { waitUntil: 'networkidle' });

    // add one product from each of two sellers
    const cards = page.locator('article');
    const sellers = new Set();
    const count = await cards.count();
    for (let i = 0; i < count && sellers.size < 2; i += 1) {
      const card = cards.nth(i);
      const label = await card.innerText();
      const seller = label.split('\n').find((l) => /Factory|Ltd|Store|Growers|Crafts|Post/.test(l));
      if (!seller || sellers.has(seller)) continue;
      const button = card.getByRole('button', { name: 'Add to cart' });
      if (await button.count() === 0) continue;
      await button.click();
      await page.waitForTimeout(350);
      sellers.add(seller);
    }
    assert.equal(sellers.size, 2, 'two sellers are in the cart');

    // choose collection for the second line
    await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
    const fulfilment = page.locator('select[aria-label^="Fulfilment for"]');
    await fulfilment.nth(1).selectOption('pickup');
    await page.waitForTimeout(500);
    const outlet = page.locator('select[aria-label^="Outlet for"]').first();
    if (await outlet.count()) {
      const options = await outlet.locator('option').all();
      if (options.length > 1) {
        await outlet.selectOption(await options[1].getAttribute('value'));
        await page.waitForTimeout(400);
      }
    }
    assert.match(await page.locator('main').innerText(), /One cart, several sellers/);

    // checkout
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.waitForURL('**/checkout');
    await page.waitForTimeout(500);
    for (const [label, value] of [['First name', 'Amina'], ['Last name', 'Otieno'], ['E-mail', 'buyer@example.com'], ['Street address', '12 Moi Avenue'], ['City / town', 'Nairobi']]) {
      const field = page.getByLabel(label, { exact: false }).first();
      if (await field.count()) await field.fill(value);
    }
    const next = page.getByRole('button', { name: 'Continue' });
    for (let i = 0; i < 5; i += 1) {
      if (await page.getByRole('button', { name: 'Confirm order' }).count()) break;
      // pick mobile money where the step offers it, so the handset confirmation is exercised
      const mpesa = page.locator('label', { hasText: 'M-Pesa' }).first();
      if (await mpesa.count()) {
        await mpesa.click();
        await page.waitForTimeout(300);
      }
      await next.click();
      await page.waitForTimeout(350);
    }
    const phone = page.getByLabel('Mobile money number', { exact: false });
    if (await phone.count()) await phone.fill('254700000001');
    for (let i = 0; i < 3; i += 1) {
      if (await page.getByRole('button', { name: 'Confirm order' }).count()) break;
      await next.click();
      await page.waitForTimeout(350);
    }
    for (const box of await page.locator('input[type="checkbox"]').all()) await box.check();
    await page.getByRole('button', { name: 'Confirm order' }).click();
    await page.waitForTimeout(900);

    // mobile money: confirm on the handset
    const confirmPin = page.getByRole('button', { name: 'Enter PIN and confirm' });
    assert.equal(await confirmPin.count(), 1, 'the mobile-money push asks the shopper to confirm');
    await confirmPin.click();
    await page.waitForURL('**/order-completed', { timeout: 10000 });
    await page.getByRole('heading', { name: 'Your order has been placed' }).waitFor({ timeout: 10000 });

    const completed = await page.locator('main').innerText();
    assert.match(completed, /Your order has been placed/);
    assert.match(completed, /Checkout reference/);
    assert.match(completed, /sub-orders/);
    assert.match(completed, /Pickup code/i, 'the collection sub-order shows its pickup code');
  });

  test('AC-TRK-001-01-01', async () => {
    // The buyer can follow the shipment after an administrator dispatches it.
    await signInAsAdmin();
    await page.goto(`${BASE}/admin/sales/orders`, { waitUntil: 'networkidle' });
    const firstOrder = page.locator('table tbody tr a').first();
    await firstOrder.click();
    await page.waitForTimeout(600);
    const create = page.getByRole('button', { name: /Create shipment/ });
    if (await create.count()) {
      await create.click();
      await page.waitForTimeout(700);
    }
    await page.getByRole('button', { name: 'Shipments' }).click();
    await page.waitForTimeout(400);
    const tracking = page.locator('table tbody tr a').first();
    const number = (await tracking.innerText()).trim();
    await page.goto(`${BASE}/track/${number}`, { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText();
    assert.match(text, new RegExp(number));
    assert.match(text, /Shipment created/i);
  });
});
