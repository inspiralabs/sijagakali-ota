import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDevices, getFirmwareReleases, uploadFirmware, deployFirmware, getFirmwareUpdates } from './api';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('api client', () => {
  it('getDevices attaches the bearer token and returns parsed JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ device_id: 'node-001' }]
    });

    const result = await getDevices('token-abc');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/devices'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }) })
    );
    expect(result).toEqual([{ device_id: 'node-001' }]);
  });

  it('throws the backend error message on a non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'boom' })
    });

    await expect(getFirmwareReleases('token-abc')).rejects.toThrow('boom');
  });

  it('uploadFirmware sends multipart form data without a manual Content-Type header', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'r1', version: 'sijagakali-v1.0.1' })
    });
    const file = new File(['fake binary'], 'firmware.bin');

    await uploadFirmware('token-abc', file, 'sijagakali-v1.0.1', 'notes here');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers.Authorization).toBe('Bearer token-abc');
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('deployFirmware posts JSON with deployment_slug and device_id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'update-1', status: 'pending' })
    });

    await deployFirmware('token-abc', 'release-1', 'sijagakali-bojong-kulur', 'node-001');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/firmware/release-1/deploy'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ deployment_slug: 'sijagakali-bojong-kulur', device_id: 'node-001' })
      })
    );
  });

  it('getFirmwareUpdates fetches the update history', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });
    await getFirmwareUpdates('token-abc');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/firmware-updates'), expect.anything());
  });
});
