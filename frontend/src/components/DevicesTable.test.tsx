import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DevicesTable } from './DevicesTable';
import * as api from '../lib/api';

const device = {
  deployment_slug: 'sijagakali-bojong-kulur',
  device_id: 'node-001',
  location_name: 'Bojong Kulur',
  firmware_version: 'sijagakali-v1.0.0',
  last_seen_at: new Date().toISOString(),
  online: true,
  is_outdated: true,
  latest_firmware_version: 'sijagakali-v1.0.1'
};

describe('DevicesTable', () => {
  it('renders devices and shows the outdated badge', async () => {
    vi.spyOn(api, 'getDevices').mockResolvedValue([device]);

    render(<DevicesTable accessToken="tok" onDeploy={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Bojong Kulur')).toBeInTheDocument();
      expect(screen.getByText('update tersedia')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  it('calls onDeploy with the clicked device', async () => {
    vi.spyOn(api, 'getDevices').mockResolvedValue([device]);
    const onDeploy = vi.fn();

    render(<DevicesTable accessToken="tok" onDeploy={onDeploy} />);

    await waitFor(() => screen.getByText('Bojong Kulur'));
    fireEvent.click(screen.getByRole('button', { name: 'Deploy' }));

    expect(onDeploy).toHaveBeenCalledWith(expect.objectContaining({ device_id: 'node-001' }));
  });
});
