import { useEffect, useRef, useState } from 'react';
import { getDevices, getFirmwareUpdates, isUpdateActive, type Device, type FirmwareUpdate } from '../lib/api';

const POLL_INTERVAL_MS = 4000;

const deviceKey = (d: { deployment_slug: string; device_id: string }) => `${d.deployment_slug}:${d.device_id}`;

export function DevicesTable({
  accessToken,
  onDeploy
}: {
  accessToken: string;
  onDeploy: (device: Device) => void;
}) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeUpdates, setActiveUpdates] = useState<Map<string, FirmwareUpdate>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Poll while an update runs so the progress shows and the new firmware version appears after reboot.
    const load = async () => {
      try {
        const [deviceData, updates] = await Promise.all([getDevices(accessToken), getFirmwareUpdates(accessToken)]);
        if (cancelled) return;
        const active = new Map<string, FirmwareUpdate>();
        // updates come newest first; keep the newest active one per device
        for (const u of updates) if (isUpdateActive(u) && !active.has(deviceKey(u))) active.set(deviceKey(u), u);
        setDevices(deviceData);
        setActiveUpdates(active);

        if (active.size > 0 && !timerRef.current) {
          timerRef.current = setInterval(load, POLL_INTERVAL_MS);
        } else if (active.size === 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-gray-500">
          <th className="py-2">Lokasi</th>
          <th className="py-2">Deployment</th>
          <th className="py-2">Device ID</th>
          <th className="py-2">Firmware</th>
          <th className="py-2">Status</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {devices.map((device) => {
          const activeUpdate = activeUpdates.get(deviceKey(device));
          return (
            <tr key={deviceKey(device)} className="border-b border-gray-100">
              <td className="py-2">{device.location_name}</td>
              <td className="py-2">{device.deployment_slug}</td>
              <td className="py-2">{device.device_id}</td>
              <td className="py-2">
                {device.firmware_version ?? '-'}
                {device.is_outdated && (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    update tersedia
                  </span>
                )}
              </td>
              <td className="py-2">
                <span className={device.online ? 'text-green-600' : 'text-gray-400'}>
                  {device.online ? 'Online' : 'Offline'}
                </span>
              </td>
              <td className="py-2">
                <button
                  onClick={() => onDeploy(device)}
                  disabled={!!activeUpdate}
                  className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
                >
                  {activeUpdate ? 'Sedang update' : 'Deploy'}
                </button>
                {activeUpdate && (
                  <span className="ml-2 text-xs text-gray-500">
                    {activeUpdate.ack_detail ?? 'menunggu device'}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
