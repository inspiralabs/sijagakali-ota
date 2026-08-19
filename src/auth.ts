import { FastifyRequest, FastifyReply } from 'fastify';
import { getSupabaseClient } from './supabaseClient.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing bearer token' });
  }

  const token = authHeader.slice('Bearer '.length);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return reply.code(401).send({ error: 'Invalid token' });
  }

  request.userId = data.user.id;
}
