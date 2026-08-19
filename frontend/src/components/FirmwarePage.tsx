import { useEffect, useState, type FormEvent } from 'react';
import { getFirmwareReleases, uploadFirmware, type FirmwareRelease } from '../lib/api';

export function FirmwarePage({ accessToken }: { accessToken: string }) {
  const [releases, setReleases] = useState<FirmwareRelease[]>([]);
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReleases = () => {
    getFirmwareReleases(accessToken)
      .then(setReleases)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(loadReleases, [accessToken]);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      await uploadFirmware(accessToken, file, version, notes);
      setVersion('');
      setNotes('');
      setFile(null);
      loadReleases();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleUpload} className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="fw-version" className="mb-1 block text-xs font-medium text-gray-600">
            Versi
          </label>
          <input
            id="fw-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
            placeholder="sijagakali-v1.0.1"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="fw-notes" className="mb-1 block text-xs font-medium text-gray-600">
            Catatan
          </label>
          <input
            id="fw-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="fw-file" className="mb-1 block text-xs font-medium text-gray-600">
            File .bin
          </label>
          <input
            id="fw-file"
            type="file"
            accept=".bin"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {uploading ? 'Mengunggah...' : 'Unggah'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-2">Versi</th>
            <th className="py-2">Ukuran</th>
            <th className="py-2">Catatan</th>
            <th className="py-2">Diunggah</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((release) => (
            <tr key={release.id} className="border-b border-gray-100">
              <td className="py-2">{release.version}</td>
              <td className="py-2">{(release.file_size_bytes / 1024).toFixed(0)} KB</td>
              <td className="py-2">{release.notes ?? '-'}</td>
              <td className="py-2">{new Date(release.created_at).toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
