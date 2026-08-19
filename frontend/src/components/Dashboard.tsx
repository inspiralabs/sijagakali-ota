import { useState } from 'react';
import { DevicesTable } from './DevicesTable';
import { FirmwarePage } from './FirmwarePage';
import { UpdateHistoryTable } from './UpdateHistoryTable';
import { DeployModal } from './DeployModal';
import type { Device } from '../lib/api';

type Tab = 'devices' | 'firmware' | 'history';

const TAB_LABEL: Record<Tab, string> = {
  devices: 'Perangkat',
  firmware: 'Firmware',
  history: 'Riwayat'
};

export function Dashboard({ accessToken, onLogout }: { accessToken: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('devices');
  const [deployTarget, setDeployTarget] = useState<Device | null>(null);
  const [devicesKey, setDevicesKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">SiJagaKali OTA Dashboard</h1>
        <button onClick={onLogout} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          Keluar
        </button>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {(['devices', 'firmware', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t ? 'border-b-2 border-blue-600 font-medium text-blue-600' : 'text-gray-500'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'devices' && <DevicesTable key={devicesKey} accessToken={accessToken} onDeploy={setDeployTarget} />}
      {tab === 'firmware' && <FirmwarePage accessToken={accessToken} />}
      {tab === 'history' && <UpdateHistoryTable accessToken={accessToken} />}

      {deployTarget && (
        <DeployModal
          accessToken={accessToken}
          device={deployTarget}
          onClose={() => setDeployTarget(null)}
          onDeployed={() => setDevicesKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
