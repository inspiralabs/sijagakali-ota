import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';

const insertedRows: any[] = [];

vi.mock('../supabaseClient.js', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => ({
      insert: (row: any) => ({
        select: () => ({
          single: async () => {
            const inserted = { id: 'release-1', created_at: new Date().toISOString(), ...row };
            insertedRows.push(inserted);
            return { data: inserted, error: null };
          }
        })
      }),
      select: () => ({
        order: async () => ({ data: insertedRows, error: null })
      })
    })
  })
}));

vi.mock('../r2Client.js', () => ({
  uploadToR2: vi.fn(async () => {})
}));

vi.mock('../auth.js', () => ({
  requireAuth: async (req: any) => {
    req.userId = 'user-123';
  }
}));

describe('firmware routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    insertedRows.length = 0;
    const { buildApp } = await import('../app.js');
    app = buildApp();
  });

  it('rejects an invalid version string', async () => {
    const form = new FormData();
    form.append('version', 'not a valid version!!');
    form.append('file', new Blob([Buffer.from('fake binary')]), 'firmware.bin');

    const res = await app.inject({
      method: 'POST',
      url: '/api/firmware',
      payload: form
    });
    expect(res.statusCode).toBe(400);
  });

  it('uploads a valid firmware and lists it', async () => {
    const form = new FormData();
    form.append('version', 'sijagakali-v1.0.1');
    form.append('notes', 'test build');
    form.append('file', new Blob([Buffer.from('fake binary')]), 'firmware.bin');

    const uploadRes = await app.inject({
      method: 'POST',
      url: '/api/firmware',
      payload: form
    });
    expect(uploadRes.statusCode).toBe(201);
    const body = uploadRes.json();
    expect(body.version).toBe('sijagakali-v1.0.1');
    expect(body.r2_key).toBe('firmware/sijagakali-v1.0.1.bin');

    const listRes = await app.inject({ method: 'GET', url: '/api/firmware' });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json()).toHaveLength(1);
  });

  it('accepts firmware larger than the 1 MB multipart default', async () => {
    const form = new FormData();
    form.append('version', 'sijagakali-v1.0.2');
    form.append('file', new Blob([Buffer.alloc(2 * 1024 * 1024)]), 'firmware.bin');

    const res = await app.inject({ method: 'POST', url: '/api/firmware', payload: form });
    expect(res.statusCode).toBe(201);
    expect(res.json().file_size_bytes).toBe(2 * 1024 * 1024);
  });
});
