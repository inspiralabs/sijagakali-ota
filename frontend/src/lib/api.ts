const API_BASE_URL = (import.meta.env.VITE_OTA_API_URL as string | undefined) ?? 'http://localhost:3787';

export type Device = {
  deployment_slug: string;
  device_id: string;
  location_name: string;
  firmware_version: string | null;
  last_seen_at: string | null;
  online: boolean;
  is_outdated: boolean;
  latest_firmware_version: string | null;
};

export type FirmwareRelease = {
  id: string;
  version: string;
  r2_key: string;
  file_size_bytes: number;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type FirmwareUpdate = {
  id: string;
  deployment_slug: string;
  device_id: string;
  firmware_release_id: string;
  requested_by: string | null;
  requested_at: string;
  mqtt_request_id: string;
  status: 'pending' | 'acked_ok' | 'acked_fail';
  ack_detail: string | null;
  acked_at: string | null;
};

async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getDevices(accessToken: string): Promise<Device[]> {
  return apiFetch('/api/devices', accessToken);
}

export function getFirmwareReleases(accessToken: string): Promise<FirmwareRelease[]> {
  return apiFetch('/api/firmware', accessToken);
}

export function uploadFirmware(
  accessToken: string,
  file: File,
  version: string,
  notes: string
): Promise<FirmwareRelease> {
  const form = new FormData();
  form.append('version', version);
  if (notes) form.append('notes', notes);
  form.append('file', file);
  return apiFetch('/api/firmware', accessToken, { method: 'POST', body: form });
}

export function deployFirmware(
  accessToken: string,
  releaseId: string,
  deploymentSlug: string,
  deviceId: string
): Promise<FirmwareUpdate> {
  return apiFetch(`/api/firmware/${releaseId}/deploy`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deployment_slug: deploymentSlug, device_id: deviceId })
  });
}

export function getFirmwareUpdates(accessToken: string): Promise<FirmwareUpdate[]> {
  return apiFetch('/api/firmware-updates', accessToken);
}
