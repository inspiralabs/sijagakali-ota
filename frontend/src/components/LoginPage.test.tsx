import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';

const signInWithPassword = vi.fn();

vi.mock('../lib/supabase', () => ({
  getSupabase: () => ({
    auth: { signInWithPassword }
  })
}));

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
  });

  it('calls signInWithPassword with entered credentials', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@sijagakali.com' } });
    fireEvent.change(screen.getByLabelText('Kata Sandi'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@sijagakali.com', password: 'secret123' })
      );
    });
  });

  it('shows an error message when sign-in fails', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@sijagakali.com' } });
    fireEvent.change(screen.getByLabelText('Kata Sandi'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });
});
