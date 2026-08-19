import { FastifyInstance } from 'fastify';
import { getSupabaseClient } from '../supabaseClient.js';
import { requireAuth } from '../auth.js';

const ONLINE_THRESHOLD_SECONDS = 360;

export async function registerDeviceRoutes(app: FastifyInstance) {
  app.get('/api/devices', { onRequest: [requireAuth] }, async (_request, reply) => {
    const supabase = getSupabaseClient();

    const { data: devices, error: devicesError } = await supabase.from('device_configs').select();
    if (devicesError) {
      return reply.code(500).send({ error: devicesError.message });
    }

    const { data: latest, error: latestError } = await supabase
      .from('firmware_releases')
      .select('version')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) {
      return reply.code(500).send({ error: latestError.message });
    }

    const latestVersion = latest?.version ?? null;
    const now = Date.now();

    const result = (devices ?? []).map((d: any) => {
      const lastSeenMs = d.last_seen_at ? new Date(d.last_seen_at).getTime() : 0;
      const online = now - lastSeenMs <= ONLINE_THRESHOLD_SECONDS * 1000;
      const isOutdated = latestVersion !== null && d.firmware_version !== latestVersion;
      return { ...d, online, is_outdated: isOutdated, latest_firmware_version: latestVersion };
    });

    return reply.send(result);
  });
}
