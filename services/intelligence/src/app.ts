import cors from '@fastify/cors';
import Fastify from 'fastify';

import { registerRoutes } from './api/routes/index.js';

const DESKTOP_ALLOWED_ORIGINS = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://tauri.localhost',
  'https://tauri.localhost',
  'tauri://localhost'
]);

export function createApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    methods: ['GET', 'OPTIONS'],
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, DESKTOP_ALLOWED_ORIGINS.has(origin));
    }
  });

  app.get('/health', async () => ({ ok: true }));

  registerRoutes(app);

  return app;
}
