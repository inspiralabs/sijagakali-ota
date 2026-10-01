import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | undefined;

export function getMqttClient(): MqttClient {
  if (client) return client;

  const url = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
  client = mqtt.connect(url, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 3000,
  });
  client.on('error', (err) => console.error('MQTT error:', err));
  return client;
}
