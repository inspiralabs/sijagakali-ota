import Fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { registerFirmwareRoutes } from './routes/firmware.js';
import { registerDeviceRoutes } from './routes/devices.js';
import { registerDeployRoutes } from './routes/deploy.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(multipart);

  app.get('/health', async () => {
    return { ok: true };
  });

  app.register(registerFirmwareRoutes);
  app.register(registerDeviceRoutes);
  app.register(registerDeployRoutes);

  return app;
}
