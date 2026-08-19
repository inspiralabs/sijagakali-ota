import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

process.env.R2_PUBLIC_BASE_URL = 'https://firmware.example.com';

const publishedMessages: { topic: string; payload: string }[] = [];
const insertedUpdates: any[] = [];

vi.mock('../mqttClient.js', () => ({
  getMqttClient: () => ({
    publish: (topic: string, payload: string) => {
      publishedMessages.push({ topic, payload });
    }
  })
}));

vi.mock('../supabaseClient.js', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      if (table === 'firmware_releases') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'release-1', version: 'sijagakali-v1.0.1', r2_key: 'firmware/sijagakali-v1.0.1.bin' },
                error: null
              })
            })
          })
        };
      }
      if (table === 'firmware_updates') {
        return {
          insert: (row: any) => ({
            select: () => ({
              single: async () => {
                const inserted = { id: 'update-1', ...row };
                insertedUpdates.push(inserted);
                return { data: inserted, error: null };
              }
            })
          }),
          select: () => ({
            order: async () => ({ data: insertedUpdates, error: null })
          })
        };
      }
      throw new Error(`unexpected table ${table}`);
    }
  })
}));

vi.mock('../auth.js', () => ({
  requireAuth: async (req: any) => {
    req.userId = 'user-123';
  }
}));

describe('POST /api/firmware/:id/deploy', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    publishedMessages.length = 0;
    insertedUpdates.length = 0;
    const { registerDeployRoutes } = await import('./deploy.js');
    app = Fastify();
    await registerDeployRoutes(app);
  });

  it('publishes the ota_update command and records the request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/firmware/release-1/deploy',
      payload: { deployment_slug: 'sijagakali-bojong-kulur', device_id: 'node-001' }
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe('pending');
    expect(body.deployment_slug).toBe('sijagakali-bojong-kulur');
    expect(body.device_id).toBe('node-001');

    expect(publishedMessages).toHaveLength(1);
    expect(publishedMessages[0].topic).toBe('sijagakali/node-001/command');
    const payload = JSON.parse(publishedMessages[0].payload);
    expect(payload.cmd).toBe('ota_update');
    expect(payload.request_id).toBe(body.mqtt_request_id);
    expect(payload.params.url).toContain('firmware/sijagakali-v1.0.1.bin');
  });
});
