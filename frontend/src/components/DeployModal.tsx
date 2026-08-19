import { useEffect, useState } from 'react';
import { getFirmwareReleases, deployFirmware, type Device, type FirmwareRelease } from '../lib/api';

export function DeployModal({
  accessToken,
  device,
  onClose,
  onDeployed
}: {
  accessToken: string;
  device: Device;
  onClose: () => void;
  onDeployed: () => void;
}) {
  const [releases, setReleases] = useState<FirmwareRelease[]>([]);
  const [releaseId, setReleaseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFirmwareReleases(accessToken)
      .then((data) => {
        setReleases(data);
        if (data.length > 0) setReleaseId(data[0].id);
      })
      .catch((err: Error) => setError(err.message));
  }, [accessToken]);

  const handleConfirm = async () => {
    if (!releaseId) return;

    setError(null);
    setSubmitting(true);
    try {
      await deployFirmware(accessToken, releaseId, device.deployment_slug, device.device_id);
      onDeployed();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Deploy ke {device.device_id}</h2>

        <label htmlFor="deploy-release" className="mb-1 block text-xs font-medium text-gray-600">
          Firmware
        </label>
        <select
          id="deploy-release"
          value={releaseId}
          onChange={(e) => setReleaseId(e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {releases.map((release) => (
            <option key={release.id} value={release.id}>
              {release.version}
            </option>
          ))}
        </select>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm">
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !releaseId}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}
