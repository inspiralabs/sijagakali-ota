import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

vi.mock('./supabaseClient.js', () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser: async (token: string) => {
        if (token === 'valid-token') {
          return { data: { user: { id: 'user-123' } }, error: null };
        }
        return { data: { user: null }, error: new Error('invalid token') };
      }
    }
  })
}));

describe('requireAuth', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    const { requireAuth } = await import('./auth.js');
    app = Fastify();
    app.get('/protected', { onRequest: [requireAuth] }, async (req: any) => {
      return { userId: req.userId };
    });
  });

  it('rejects requests with no Authorization header', async () => {
    const res = await app.inject({ method: 'GET', url: '/protected' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer bad-token' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts requests with a valid token and sets userId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer valid-token' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ userId: 'user-123' });
  });
});
