import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DeployModal } from './DeployModal';
import * as api from '../lib/api';

const device = {
  deployment_slug: 'sijagakali-bojong-kulur',
  device_id: 'node-001',
  location_name: 'Bojong Kulur',
  firmware_version: 'sijagakali-v1.0.0',
  last_seen_at: null,
  online: true,
  is_outdated: true,
  latest_firmware_version: 'sijagakali-v1.0.1'
};

describe('DeployModal', () => {
  it('confirms deploy with the selected firmware release', async () => {
    vi.spyOn(api, 'getFirmwareReleases').mockResolvedValue([
      {
        id: 'r1',
        version: 'sijagakali-v1.0.1',
        r2_key: 'firmware/sijagakali-v1.0.1.bin',
        file_size_bytes: 1024,
        notes: null,
        uploaded_by: null,
        created_at: new Date().toISOString()
      }
    ]);
    const deploySpy = vi.spyOn(api, 'deployFirmware').mockResolvedValue({
      id: 'u1',
      deployment_slug: device.deployment_slug,
      device_id: device.device_id,
      firmware_release_id: 'r1',
      requested_by: null,
      requested_at: new Date().toISOString(),
      mqtt_request_id: 'req-1',
      status: 'pending',
      ack_detail: null,
      acked_at: null
    });
    const onDeployed = vi.fn();
    const onClose = vi.fn();

    render(<DeployModal accessToken="tok" device={device} onClose={onClose} onDeployed={onDeployed} />);

    await waitFor(() => screen.getByText('sijagakali-v1.0.1'));
    fireEvent.click(screen.getByRole('button', { name: 'Deploy' }));

    await waitFor(() => {
      expect(deploySpy).toHaveBeenCalledWith('tok', 'r1', 'sijagakali-bojong-kulur', 'node-001');
      expect(onDeployed).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
