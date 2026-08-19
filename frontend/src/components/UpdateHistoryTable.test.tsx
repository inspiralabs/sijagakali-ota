import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UpdateHistoryTable } from './UpdateHistoryTable';
import * as api from '../lib/api';

describe('UpdateHistoryTable', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders update rows with a translated status', async () => {
    vi.spyOn(api, 'getFirmwareUpdates').mockResolvedValue([
      {
        id: 'u1',
        deployment_slug: 'sijagakali-bojong-kulur',
        device_id: 'node-001',
        firmware_release_id: 'r1',
        requested_by: null,
        requested_at: new Date().toISOString(),
        mqtt_request_id: 'req-1',
        status: 'acked_ok',
        ack_detail: 'update ok, restarting',
        acked_at: new Date().toISOString()
      }
    ]);

    render(<UpdateHistoryTable accessToken="tok" />);

    await waitFor(() => {
      expect(screen.getByText('node-001')).toBeInTheDocument();
      expect(screen.getByText('Berhasil')).toBeInTheDocument();
    });
  });

  it('polls again while a row is pending', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const getUpdates = vi.spyOn(api, 'getFirmwareUpdates').mockResolvedValue([
      {
        id: 'u1',
        deployment_slug: 'sijagakali-bojong-kulur',
        device_id: 'node-001',
        firmware_release_id: 'r1',
        requested_by: null,
        requested_at: new Date().toISOString(),
        mqtt_request_id: 'req-1',
        status: 'pending',
        ack_detail: null,
        acked_at: null
      }
    ]);

    render(<UpdateHistoryTable accessToken="tok" />);
    await waitFor(() => expect(getUpdates).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(4000);
    expect(getUpdates).toHaveBeenCalledTimes(2);
  });
});
