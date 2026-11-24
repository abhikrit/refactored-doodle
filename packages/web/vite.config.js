// Dev and production serve on the SAME port (4000):
// - dev: this config mounts the Express API as Vite middleware, so one process, one port
// - production: packages/server/src/standalone.js serves dist + the API on 4000
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const apiMiddleware = {
  name: 'product-api',
  async configureServer(server) {
    const { createApiApp } = await import('@product/server');
    const { app } = await createApiApp({ defaultClient: process.env.CLIENT ?? 'MPC' });
    server.middlewares.use(app);
    server.config.logger.info('  API mounted on the same port under /api');
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddleware],
  server: { port: 4000, strictPort: true, host: true },
  preview: { port: 4000, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 1400 },
});
