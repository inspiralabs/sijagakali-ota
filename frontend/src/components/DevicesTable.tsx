import { useEffect, useState } from 'react';
import { getDevices, type Device } from '../lib/api';

export function DevicesTable({
  accessToken,
  onDeploy
}: {
  accessToken: string;
  onDeploy: (device: Device) => void;
}) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDevices(accessToken)
      .then(setDevices)
      .catch((err: Error) => setError(err.message));
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
        {devices.map((device) => (
          <tr key={`${device.deployment_slug}:${device.device_id}`} className="border-b border-gray-100">
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
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                Deploy
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
