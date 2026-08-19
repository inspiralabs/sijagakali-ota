import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';

const updates: Record<string, any> = {};
const deviceConfigs: Record<string, any> = {};
const ingestionRows: any[] = [];

class FakeMqttClient extends EventEmitter {
  subscribe(_topic: string) {}
}
const fakeClient = new FakeMqttClient();

vi.mock('./mqttClient.js', () => ({
  getMqttClient: () => fakeClient
}));

vi.mock('./supabaseClient.js', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      if (table === 'firmware_updates') {
        return {
          update: (fields: any) => ({
            eq: (_col: string, val: string) => ({
              then: (resolve: any) => {
                updates[val] = { ...(updates[val] ?? {}), ...fields };
                resolve({ error: null });
              }
            })
          })
        };
      }
      if (table === 'mqtt_ingestion') {
        return { insert: async (row: any) => { ingestionRows.push(row); return { error: null }; } };
      }
      if (table === 'device_configs') {
        return {
          update: (fields: any) => ({
            eq: (_c1: string, v1: string) => ({
              eq: (_c2: string, v2: string) => ({
                then: (resolve: any) => {
                  deviceConfigs[`${v1}:${v2}`] = { ...(deviceConfigs[`${v1}:${v2}`] ?? {}), ...fields };
                  resolve({ error: null });
                }
              })
            })
          })
        };
      }
      throw new Error(`unexpected table ${table}`);
    }
  })
}));

describe('MQTT listener', () => {
  beforeEach(async () => {
    Object.keys(updates).forEach((k) => delete updates[k]);
    Object.keys(deviceConfigs).forEach((k) => delete deviceConfigs[k]);
    ingestionRows.length = 0;
    const { startMqttListener } = await import('./mqttListener.js');
    startMqttListener();
  });

  it('updates firmware_updates on an ack message', async () => {
    const payload = JSON.stringify({ request_id: 'req-1', ok: true, detail: 'update ok, restarting' });
    fakeClient.emit('message', 'sijagakali/node-001/command/ack', Buffer.from(payload));
    await new Promise((r) => setTimeout(r, 10));

    expect(updates['req-1']).toEqual(
      expect.objectContaining({ status: 'acked_ok', ack_detail: 'update ok, restarting' })
    );
    expect(ingestionRows).toHaveLength(1);
    expect(ingestionRows[0].correlation_id).toBe('req-1');
  });

  it('updates device_configs on a status message', async () => {
    const payload = JSON.stringify({
      deployment_slug: 'sijagakali-bojong-kulur',
      device_id: 'node-001',
      firmware_version: 'sijagakali-v1.0.1',
      online: true
    });
    fakeClient.emit('message', 'sijagakali/node-001/sensor/status', Buffer.from(payload));
    await new Promise((r) => setTimeout(r, 10));

    expect(deviceConfigs['sijagakali-bojong-kulur:node-001']).toEqual(
      expect.objectContaining({ firmware_version: 'sijagakali-v1.0.1' })
    );
  });
});
