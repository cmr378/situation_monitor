import Fastify from 'fastify';

import { registerRoutes } from './api/routes/index.js';

export function createApp() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true }));

  registerRoutes(app);

  return app;
}
