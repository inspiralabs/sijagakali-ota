import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FirmwarePage } from './FirmwarePage';
import * as api from '../lib/api';

describe('FirmwarePage', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getFirmwareReleases').mockResolvedValue([
      {
        id: 'r1',
        version: 'sijagakali-v1.0.0',
        r2_key: 'firmware/sijagakali-v1.0.0.bin',
        file_size_bytes: 102400,
        notes: null,
        uploaded_by: null,
        created_at: new Date().toISOString()
      }
    ]);
  });

  it('lists existing firmware releases', async () => {
    render(<FirmwarePage accessToken="tok" />);
    await waitFor(() => {
      expect(screen.getByText('sijagakali-v1.0.0')).toBeInTheDocument();
    });
  });

  it('uploads a new firmware and refreshes the list', async () => {
    const uploadSpy = vi.spyOn(api, 'uploadFirmware').mockResolvedValue({
      id: 'r2',
      version: 'sijagakali-v1.0.1',
      r2_key: 'firmware/sijagakali-v1.0.1.bin',
      file_size_bytes: 2048,
      notes: '',
      uploaded_by: null,
      created_at: new Date().toISOString()
    });

    render(<FirmwarePage accessToken="tok" />);
    await waitFor(() => screen.getByText('sijagakali-v1.0.0'));

    fireEvent.change(screen.getByLabelText('Versi'), { target: { value: 'sijagakali-v1.0.1' } });
    const file = new File(['fake binary'], 'firmware.bin', { type: 'application/octet-stream' });
    fireEvent.change(screen.getByLabelText('File .bin'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Unggah' }));

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith('tok', file, 'sijagakali-v1.0.1', '');
    });
  });
});
