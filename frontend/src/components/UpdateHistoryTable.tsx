import { useEffect, useRef, useState } from 'react';
import { getFirmwareUpdates, type FirmwareUpdate } from '../lib/api';

const POLL_INTERVAL_MS = 4000;

const STATUS_LABEL: Record<FirmwareUpdate['status'], string> = {
  pending: 'Menunggu',
  acked_ok: 'Berhasil',
  acked_fail: 'Gagal'
};

export function UpdateHistoryTable({ accessToken }: { accessToken: string }) {
  const [updates, setUpdates] = useState<FirmwareUpdate[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await getFirmwareUpdates(accessToken);
      if (cancelled) return;
      setUpdates(data);

      const hasPending = data.some((u) => u.status === 'pending');
      if (hasPending && !timerRef.current) {
        timerRef.current = setInterval(load, POLL_INTERVAL_MS);
      } else if (!hasPending && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [accessToken]);

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-gray-500">
          <th className="py-2">Device</th>
          <th className="py-2">Diminta</th>
          <th className="py-2">Status</th>
          <th className="py-2">Detail</th>
        </tr>
      </thead>
      <tbody>
        {updates.map((update) => (
          <tr key={update.id} className="border-b border-gray-100">
            <td className="py-2">{update.device_id}</td>
            <td className="py-2">{new Date(update.requested_at).toLocaleString('id-ID')}</td>
            <td className="py-2">{STATUS_LABEL[update.status]}</td>
            <td className="py-2">{update.ack_detail ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
