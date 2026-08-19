import { getMqttClient } from './mqttClient.js';
import { getSupabaseClient } from './supabaseClient.js';

export function startMqttListener(): void {
  const client = getMqttClient();

  client.subscribe('sijagakali/+/command/ack');
  client.subscribe('sijagakali/+/sensor/status');

  client.on('message', (topic: string, messageBuffer: Buffer) => {
    void handleMessage(topic, messageBuffer);
  });
}

async function handleMessage(topic: string, messageBuffer: Buffer) {
  const parts = topic.split('/');
  const deviceId = parts[1];
  const messageType = parts.slice(2).join('/');

  let payload: any;
  try {
    payload = JSON.parse(messageBuffer.toString());
  } catch {
    console.error('MQTT listener: invalid JSON on', topic);
    return;
  }

  const supabase = getSupabaseClient();

  if (messageType === 'command/ack') {
    const { request_id, ok, detail } = payload;
    if (!request_id) return;

    await supabase
      .from('firmware_updates')
      .update({
        status: ok ? 'acked_ok' : 'acked_fail',
        ack_detail: detail ?? null,
        acked_at: new Date().toISOString()
      })
      .eq('mqtt_request_id', request_id);

    await supabase.from('mqtt_ingestion').insert({
      deployment_slug: payload.deployment_slug ?? null,
      device_id: deviceId,
      correlation_id: request_id,
      message_type: 'ota_ack',
      payload_json: payload,
      ingest_status: 'received'
    });
    return;
  }

  if (messageType === 'sensor/status') {
    const { deployment_slug, firmware_version } = payload;
    if (!deployment_slug || !deviceId) return;

    await supabase
      .from('device_configs')
      .update({
        firmware_version: firmware_version ?? null,
        firmware_updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('deployment_slug', deployment_slug)
      .eq('device_id', deviceId);
  }
}
