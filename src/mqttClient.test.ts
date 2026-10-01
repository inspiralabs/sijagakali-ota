import { describe, it, expect, vi, beforeEach } from 'vitest';

const connect = vi.hoisted(() => vi.fn(() => ({ on: vi.fn() })));
vi.mock('mqtt', () => ({ default: { connect } }));

describe('getMqttClient', () => {
  beforeEach(() => {
    vi.resetModules();
    connect.mockClear();
  });

  it('passes MQTT_USERNAME/MQTT_PASSWORD to the broker', async () => {
    process.env.MQTT_BROKER_URL = 'mqtt://sijagakali-mosquitto:1883';
    process.env.MQTT_USERNAME = 'sijagakali-backend';
    process.env.MQTT_PASSWORD = 'rahasia';
    const { getMqttClient } = await import('./mqttClient.js');
    getMqttClient();
    expect(connect).toHaveBeenCalledWith(
      'mqtt://sijagakali-mosquitto:1883',
      expect.objectContaining({ username: 'sijagakali-backend', password: 'rahasia' })
    );
  });

  it('connects anonymously when no username is set', async () => {
    delete process.env.MQTT_USERNAME;
    delete process.env.MQTT_PASSWORD;
    const { getMqttClient } = await import('./mqttClient.js');
    getMqttClient();
    expect(connect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ username: undefined, password: undefined })
    );
  });
});
