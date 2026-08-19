import mqtt, { MqttClient } from 'mqtt';

let client: MqttClient | undefined;

export function getMqttClient(): MqttClient {
  if (client) return client;

  const url = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
  client = mqtt.connect(url);
  client.on('error', (err) => console.error('MQTT error:', err));
  return client;
}
