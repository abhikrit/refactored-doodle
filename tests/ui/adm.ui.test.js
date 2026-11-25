// Browser criteria of the ADM module, named by AC ID.
//
//   npm run dev        (serves http://localhost:4000)
//   npm run test:ui
//
// AC-ADM-007-08-01 is the only ADM criterion that can only be checked in a browser: the console
// must be usable at tablet and phone widths without horizontal scrolling.

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
  reachable = (await fetch(`${BASE}/api/meta`)).ok;
} catch { reachable = false; }

const skip = !chromium
  ? 'playwright is not installed'
  : !reachable
    ? `nothing is serving ${BASE} - run npm run dev first`
    : false;

let browser;

before(async () => { if (!skip) browser = await chromium.launch(); });
after(async () => { if (browser) await browser.close(); });

describe('PRD-ADM-007 in the browser', { skip }, () => {
  test('AC-ADM-007-08-01', async () => {
    // "at tablet and phone widths all queue actions are usable without horizontal scrolling"
    for (const device of [
      { name: 'phone', width: 390, height: 844 },
      { name: 'tablet', width: 820, height: 1180 },
    ]) {
      const context = await browser.newContext({ viewport: { width: device.width, height: device.height } });
      const page = await context.newPage();

      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
      await page.fill('#login-email', 'operations@example.com');
      await page.fill('#login-password', 'demo');
      await page.getByRole('button', { name: 'Log in', exact: true }).click();
      await page.waitForTimeout(900);

      for (const path of ['/admin/operations', '/admin/operations/exceptions', '/admin/operations/approvals']) {
        await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        assert.ok(
          overflow.scrollWidth <= overflow.clientWidth + 1,
          `${path} scrolls horizontally at ${device.name} width (${overflow.scrollWidth} > ${overflow.clientWidth})`,
        );
        // the queue actions are reachable, not hidden behind a sideways scroll
        const buttons = await page.locator('main button').count();
        assert.ok(buttons > 0, `${path} offers its actions at ${device.name} width`);
      }
      await context.close();
    }
  });
});
