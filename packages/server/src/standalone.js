// Production server: serves the built web app and the API on the same port.
//   npm run build && npm start   ->  http://localhost:4000
import express from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createApiApp } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DIST = join(ROOT, 'packages', 'web', 'dist');

const { app } = await createApiApp({ defaultClient: process.env.CLIENT ?? 'KTDA' });

if (!existsSync(DIST)) {
  console.error('packages/web/dist is missing - run "npm run build" first.');
  process.exit(1);
}
app.use(express.static(DIST));
app.get(/.*/, (req, res) => res.sendFile(join(DIST, 'index.html')));

app.listen(PORT, () => {
  console.log(`nopCommerce product prototype on http://localhost:${PORT}`);
});
