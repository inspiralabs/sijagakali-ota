import { FastifyInstance } from 'fastify';
import { getSupabaseClient } from '../supabaseClient.js';
import { uploadToR2 } from '../r2Client.js';
import { requireAuth } from '../auth.js';

const VERSION_PATTERN = /^[a-zA-Z0-9._-]+$/;

export async function registerFirmwareRoutes(app: FastifyInstance) {
  app.post('/api/firmware', { onRequest: [requireAuth] }, async (request, reply) => {
    const parts = request.parts();
    let version: string | undefined;
    let notes: string | undefined;
    let fileBuffer: Buffer | undefined;

    for await (const part of parts) {
      if (part.type === 'field' && part.fieldname === 'version') {
        version = String(part.value);
      } else if (part.type === 'field' && part.fieldname === 'notes') {
        notes = String(part.value);
      } else if (part.type === 'file' && part.fieldname === 'file') {
        fileBuffer = await part.toBuffer();
      }
    }

    if (!version || !VERSION_PATTERN.test(version)) {
      return reply.code(400).send({ error: 'version must match ^[a-zA-Z0-9._-]+$' });
    }
    if (!fileBuffer) {
      return reply.code(400).send({ error: 'file is required' });
    }

    const r2Key = `firmware/${version}.bin`;
    await uploadToR2(r2Key, fileBuffer, 'application/octet-stream');

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('firmware_releases')
      .insert({
        version,
        r2_key: r2Key,
        file_size_bytes: fileBuffer.length,
        notes: notes ?? null,
        uploaded_by: request.userId
      })
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: error.message });
    }
    return reply.code(201).send(data);
  });

  app.get('/api/firmware', { onRequest: [requireAuth] }, async (_request, reply) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('firmware_releases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return reply.code(500).send({ error: error.message });
    }
    return reply.send(data);
  });
}
