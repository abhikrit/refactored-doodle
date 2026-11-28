// Browser tests for the payment screens of this wave, named by AC ID.
//
//   npm run dev        (serves http://localhost:4000)
//   npm run test:ui

import {
  test, describe, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const BASE = process.env.PROTOTYPE_URL ?? 'http://localhost:4000';
const SHOTS = 'trace/screens';

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

before(async () => {
  if (skip) return;
  mkdirSync(SHOTS, { recursive: true });
  browser = await chromium.launch({ args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

/** The prototype is one instance: a test that needs a client's rails applies that pack first. */
async function applyAsync(page, client) {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.evaluate(async (c) => {
    const session = localStorage.getItem('nop-prototype-session') ?? 'default';
    await fetch('/api/platform/packs/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-session': session },
      body: JSON.stringify({ clientId: c, storeId: 1 }),
    });
  }, client);
  await page.reload({ waitUntil: 'networkidle' });
}

/**
 * Registers a shopper of this run, fills a cart and places an order, all as the browser's own
 * session. A shopper of its own, because the native minimum order placement interval refuses a
 * second order from the same customer inside a minute.
 */
async function placeOrderAsync(page) {
  return page.evaluate(async () => {
    const session = localStorage.getItem('nop-prototype-session') ?? 'default';
    const call = async (method, path, body) => {
      const res = await fetch(path, {
        method,
        headers: { 'content-type': 'application/json', 'x-session': session },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return res.json();
    };
    const stamp = String(Date.now()).slice(-7);
    const buyer = `pay-ui-${stamp}@example.com`;
    // a phone of its own as well: the product keeps one account per mobile number
    const registered = await call('POST', '/api/identity/register', {
      email: buyer,
      password: 'Prototype-2026',
      firstName: 'Pay',
      lastName: 'Shopper',
      phone: `+2659${stamp}`,
      policyAccepted: true,
    });
    if (registered.ok !== true) return { ok: false, failures: [{ message: registered.message ?? 'the shopper could not be registered' }] };
    await call('POST', '/api/identity/sign-in', { email: buyer, password: 'Prototype-2026' });
    const products = await call('GET', '/api/catalogue/products');
    const item = products.find((p) => p.isShipEnabled !== false && p.vendorId) ?? products[0];
    await call('POST', '/api/checkout-area/cart/items', { productId: item.id, quantity: 1 });
    const placed = await call('POST', '/api/checkout-area/checkout/confirm', {
      paymentMethodSystemName: 'Payments.TnmMpamba',
      termsAccepted: true,
      paymentData: { phone: '265880000001' },
    });
    return placed;
  });
}

describe('PRD-PAY-011 the payment status page in the browser', { skip }, () => {
  test('AC-PAY-011-01-01', async () => {
    // "the page shows the status, the next step (message keys Pay.Status.Pending /
    //  Pay.Status.Failed), a retry button where allowed and the support contact"
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await applyAsync(page, 'MPC');
    const placed = await placeOrderAsync(page);
    assert.equal(placed.ok, true, placed.failures?.[0]?.message ?? 'the order was placed');
    const orderNumber = placed.orders[0].orderNumber;

    await page.goto(`${BASE}/payment-status/${orderNumber}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const body = await page.locator('main').innerText();
    assert.match(body, new RegExp(orderNumber), 'the page is about that order');
    assert.match(body, /Pending/, 'it shows the status');
    assert.match(body, /Your payment is being confirmed/, 'with the pending message');
    assert.match(body, /Keep this page open/, 'and what happens next');
    assert.match(body, /Attempt/, 'every attempt is listed');
    assert.match(body, /Need help\?/, 'and who to contact');
    await page.getByRole('button', { name: 'Try again' }).waitFor();
    await page.screenshot({ path: `${SHOTS}/pay-011-payment-status.png`, fullPage: true });

    // trying again starts a new attempt on the same order
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.waitForTimeout(800);
    const after = await page.locator('main').innerText();
    assert.match(after, /Confirm the payment request on your phone/, 'the shopper is told what to do');
    const attempts = await page.locator('main table tbody tr').count();
    assert.ok(attempts >= 2, 'and the second attempt is listed');
    await context.close();
  });
});

describe('PRD-PAY-001 payment methods and routing rules in the browser', { skip }, () => {
  test('AC-PAY-001-01-01', async () => {
    // "when the administrator deactivates it, then it is not offered at checkout in any store,
    //  and existing orders paid with it keep their records"
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await applyAsync(page, 'MPC');
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'demo');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.waitForTimeout(900);

    await page.goto(`${BASE}/admin/configuration/payment-routing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const row = page.locator('table tbody tr', { hasText: 'Cash on delivery' }).first();
    await row.waitFor();
    assert.match(await row.innerText(), /Active/, 'the method starts active');
    await page.screenshot({ path: `${SHOTS}/pay-001-routing-rules.png`, fullPage: true });

    await row.getByRole('button', { name: 'Deactivate' }).click();
    await page.waitForTimeout(700);
    const off = page.locator('table tbody tr', { hasText: 'Cash on delivery' }).first();
    assert.match(await off.innerText(), /Not active/, 'the screen shows it is no longer active');
    const notice = await page.locator('main').innerText();
    assert.match(notice, /no longer offered at checkout/, 'and says what that means');
    assert.match(notice, /keep their records/, 'and that paid orders are untouched');

    // the storefront payment step no longer offers it
    const offered = await page.evaluate(async () => {
      const session = localStorage.getItem('nop-prototype-session') ?? 'default';
      const res = await fetch('/api/payments/methods', { headers: { 'x-session': session } });
      const body = await res.json();
      return body.available.map((m) => m.systemName);
    });
    assert.equal(offered.includes('Payments.CashOnDelivery'), false, 'it is not offered at checkout');

    await off.getByRole('button', { name: 'Activate' }).click();
    await page.waitForTimeout(700);
    assert.match(
      await page.locator('table tbody tr', { hasText: 'Cash on delivery' }).first().innerText(),
      /Active/,
      'and it can be switched back on',
    );
    await context.close();
  });
});
