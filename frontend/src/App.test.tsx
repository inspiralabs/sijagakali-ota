import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';

const getSession = vi.fn();
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } }));

vi.mock('./lib/supabase', () => ({
  getSupabase: () => ({
    auth: { getSession, onAuthStateChange }
  })
}));

vi.mock('./lib/api', () => ({
  getDevices: vi.fn().mockResolvedValue([])
}));

describe('App', () => {
  it('shows the login page when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument();
    });
  });

  it('shows the dashboard when a session exists', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123', user: { id: 'u1' } } } });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('SiJagaKali OTA Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Keluar')).toBeInTheDocument();
    });
  });
});
