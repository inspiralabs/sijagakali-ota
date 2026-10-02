import Fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { registerFirmwareRoutes } from './routes/firmware.js';
import { registerDeviceRoutes } from './routes/devices.js';
import { registerDeployRoutes } from './routes/deploy.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  // Default fileSize is 1 MB; ESP32 firmware images are larger (OTA partitions go up to ~16 MB).
  app.register(multipart, { limits: { fileSize: 16 * 1024 * 1024 } });

  app.get('/health', async () => {
    return { ok: true };
  });

  app.register(registerFirmwareRoutes);
  app.register(registerDeviceRoutes);
  app.register(registerDeployRoutes);

  return app;
}
