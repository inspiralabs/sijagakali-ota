import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import * as api from '../lib/api';

describe('Dashboard', () => {
  it('switches between tabs', async () => {
    vi.spyOn(api, 'getDevices').mockResolvedValue([]);
    vi.spyOn(api, 'getFirmwareReleases').mockResolvedValue([]);
    vi.spyOn(api, 'getFirmwareUpdates').mockResolvedValue([]);

    render(<Dashboard accessToken="tok" onLogout={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Firmware' }));
    await waitFor(() => expect(screen.getByLabelText('Versi')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    await waitFor(() => expect(screen.getByText('Device')).toBeInTheDocument());
  });

  it('opens the deploy modal when a device Deploy button is clicked', async () => {
    vi.spyOn(api, 'getDevices').mockResolvedValue([
      {
        deployment_slug: 'sijagakali-bojong-kulur',
        device_id: 'node-001',
        location_name: 'Bojong Kulur',
        firmware_version: 'sijagakali-v1.0.0',
        last_seen_at: null,
        online: true,
        is_outdated: true,
        latest_firmware_version: 'sijagakali-v1.0.1'
      }
    ]);
    vi.spyOn(api, 'getFirmwareReleases').mockResolvedValue([]);

    render(<Dashboard accessToken="tok" onLogout={() => {}} />);

    await waitFor(() => screen.getByText('Bojong Kulur'));
    fireEvent.click(screen.getByRole('button', { name: 'Deploy' }));

    await waitFor(() => {
      expect(screen.getByText('Deploy ke node-001')).toBeInTheDocument();
    });
  });
});
