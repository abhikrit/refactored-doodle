// Browser test for the checkout steps screen (PRD-CHK-002), named by AC ID.
//
//   npm run dev        (serves http://localhost:4000)
//   npm run test:ui

import {
  test, describe, before, after,
} from 'node:test';
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

const apply = async (client) => {
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

describe('PRD-CHK-002 the checkout steps in the browser', { skip }, () => {
  test('AC-CHK-002-01-03', async () => {
    // The progress indicator shows where the shopper is and what is still to come; a step that
    // fails the server's checks comes back with the values kept and a message against each field.
    await apply('KTDA');
    await page.goto(`${BASE}/search?pageSize=12`, { waitUntil: 'networkidle' });
    await page.locator('article').first().getByRole('button', { name: 'Add to cart' }).click();
    await page.waitForTimeout(400);
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const progress = page.locator('ol.nop-order-progress');
    await progress.waitFor();
    const indicator = await progress.innerText();
    for (const step of ['Billing address', 'Shipping address', 'Payment method', 'Confirm order']) {
      assert.ok(indicator.includes(step), `the indicator lists ${step}`);
    }
    assert.equal(
      await progress.locator('li[aria-current="step"]').innerText().then((t) => t.includes('Billing address')),
      true,
      'and marks the step the shopper is on',
    );

    // a street address and a city, but no last name and an unusable telephone number
    await page.getByLabel('First name', { exact: false }).first().fill('Amina');
    await page.getByLabel('Street address', { exact: false }).first().fill('12 Moi Avenue');
    await page.getByLabel('City / town', { exact: false }).first().fill('Nairobi');
    await page.getByLabel('Phone', { exact: false }).first().fill('no');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);

    const body = await page.locator('main').innerText();
    assert.match(body, /This field is required\./, 'the step says which field is missing');
    assert.match(body, /telephone number/, 'and which field cannot be used');
    assert.equal(
      await page.getByLabel('Street address', { exact: false }).first().inputValue(),
      '12 Moi Avenue',
      'what was already entered is still there',
    );
    assert.ok(
      (await progress.locator('li[aria-current="step"]').innerText()).includes('Billing address'),
      'and the shopper is still on the same step',
    );

    // corrected, the step is accepted and is not asked for again
    await page.getByLabel('Last name', { exact: false }).first().fill('Otieno');
    await page.getByLabel('Phone', { exact: false }).first().fill('254700000001');
    const country = page.getByLabel('Country', { exact: false }).first();
    const options = await country.locator('option').all();
    if (options.length > 1) await country.selectOption(await options[1].getAttribute('value'));
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(600);

    const done = await progress.innerText();
    assert.ok(done.includes('(completed)'), 'the completed step is marked done');
    assert.ok(
      (await progress.locator('li[aria-current="step"]').innerText()).includes('Shipping address'),
      'and the shopper is moved on to the next step',
    );
  });
});
