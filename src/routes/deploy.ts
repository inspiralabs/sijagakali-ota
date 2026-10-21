import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { getSupabaseClient } from '../supabaseClient.js';
import { getMqttClient } from '../mqttClient.js';
import { requireAuth } from '../auth.js';
import { ONLINE_THRESHOLD_SECONDS } from './devices.js';

// An unanswered update older than this is treated as lost. Keep in sync with
// NO_RESPONSE_AFTER_MS in frontend/src/lib/api.ts.
const ACTIVE_UPDATE_WINDOW_MS = 10 * 60 * 1000;

export async function registerDeployRoutes(app: FastifyInstance) {
  app.post<{
    Params: { id: string };
    Body: { deployment_slug: string; device_id: string };
  }>('/api/firmware/:id/deploy', { onRequest: [requireAuth] }, async (request, reply) => {
    const { id } = request.params;
    const { deployment_slug, device_id } = request.body;

    if (!deployment_slug || !device_id) {
      return reply.code(400).send({ error: 'deployment_slug and device_id are required' });
    }

    const supabase = getSupabaseClient();

    // Firmware <= v1.3.1 uses a clean session, so the broker drops a command sent while the device
    // is offline. Newer firmware has a persistent session, but an OTA firing hours later is a surprise.
    const { data: device, error: deviceError } = await supabase
      .from('device_configs')
      .select('last_seen_at')
      .eq('deployment_slug', deployment_slug)
      .eq('device_id', device_id)
      .maybeSingle();
    if (deviceError) {
      return reply.code(500).send({ error: deviceError.message });
    }
    const lastSeenMs = device?.last_seen_at ? new Date(device.last_seen_at).getTime() : 0;
    if (Date.now() - lastSeenMs > ONLINE_THRESHOLD_SECONDS * 1000) {
      return reply.code(409).send({ error: 'device is offline; the OTA command would be lost. Wait until it is online again.' });
    }

    const { data: active, error: activeError } = await supabase
      .from('firmware_updates')
      .select('id')
      .eq('deployment_slug', deployment_slug)
      .eq('device_id', device_id)
      .in('status', ['pending', 'in_progress'])
      .gte('requested_at', new Date(Date.now() - ACTIVE_UPDATE_WINDOW_MS).toISOString())
      .limit(1);
    if (activeError) {
      return reply.code(500).send({ error: activeError.message });
    }
    if (active && active.length > 0) {
      return reply.code(409).send({ error: 'an update for this device is already in progress' });
    }

    const { data: release, error: releaseError } = await supabase
      .from('firmware_releases')
      .select('id, version, r2_key')
      .eq('id', id)
      .single();
    if (releaseError || !release) {
      return reply.code(404).send({ error: 'firmware release not found' });
    }

    const mqttRequestId = randomUUID();
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
    if (!publicBaseUrl) {
      return reply.code(500).send({ error: 'R2_PUBLIC_BASE_URL is not set' });
    }
    const url = `${publicBaseUrl}/${release.r2_key}`;

    const { data: updateRow, error: insertError } = await supabase
      .from('firmware_updates')
      .insert({
        deployment_slug,
        device_id,
        firmware_release_id: release.id,
        requested_by: request.userId,
        mqtt_request_id: mqttRequestId,
        status: 'pending'
      })
      .select()
      .single();
    if (insertError) {
      return reply.code(500).send({ error: insertError.message });
    }

    const mqttClient = getMqttClient();
    const topic = `sijagakali/${device_id}/command`;
    const payload = JSON.stringify({
      cmd: 'ota_update',
      request_id: mqttRequestId,
      params: { url }
    });
    mqttClient.publish(topic, payload, { qos: 1 }); // QoS 1: queued in the device's persistent session over a reconnect

    return reply.code(201).send(updateRow);
  });

  app.get('/api/firmware-updates', { onRequest: [requireAuth] }, async (request, reply) => {
    const { device_id, deployment_slug } = request.query as { device_id?: string; deployment_slug?: string };
    const supabase = getSupabaseClient();
    let query = supabase.from('firmware_updates').select('*').order('requested_at', { ascending: false });
    if (device_id) query = query.eq('device_id', device_id);
    if (deployment_slug) query = query.eq('deployment_slug', deployment_slug);

    const { data, error } = await query;
    if (error) {
      return reply.code(500).send({ error: error.message });
    }
    return reply.send(data);
  });
}
