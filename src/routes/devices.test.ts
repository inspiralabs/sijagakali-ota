import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

const deviceRows = [
  {
    deployment_slug: 'sijagakali-bojong-kulur',
    device_id: 'node-001',
    location_name: 'Bojong Kulur',
    firmware_version: 'sijagakali-v1.0.0',
    last_seen_at: new Date().toISOString()
  },
  {
    deployment_slug: 'sijagakali-bojong-kulur',
    device_id: 'node-002',
    location_name: 'Somewhere Else',
    firmware_version: null,
    last_seen_at: new Date(Date.now() - 1000 * 3600).toISOString() // 1 hour ago: offline
  }
];

const latestRelease = { version: 'sijagakali-v1.0.1' };

vi.mock('../supabaseClient.js', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      if (table === 'device_configs') {
        return { select: async () => ({ data: deviceRows, error: null }) };
      }
      if (table === 'firmware_releases') {
        return {
          select: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: latestRelease, error: null })
              })
            })
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

describe('GET /api/devices', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    const { registerDeviceRoutes } = await import('./devices.js');
    app = Fastify();
    await registerDeviceRoutes(app);
  });

  it('derives online and is_outdated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/devices' });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body[0].device_id).toBe('node-001');
    expect(body[0].online).toBe(true);
    expect(body[0].is_outdated).toBe(true); // v1.0.0 != latest v1.0.1

    expect(body[1].device_id).toBe('node-002');
    expect(body[1].online).toBe(false); // last_seen_at 1 hour ago > 360s threshold
    expect(body[1].is_outdated).toBe(true); // null firmware_version != latest
  });
});
