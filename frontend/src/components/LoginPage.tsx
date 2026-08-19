import { useState, type FormEvent } from 'react';
import { getSupabase } from '../lib/supabase';
import { TurnstileField, isTurnstileConfigured } from './TurnstileField';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captchaRequired = isTurnstileConfigured();
  const captchaReady = !captchaRequired || Boolean(captchaToken);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = getSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined
    });

    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-gray-900">SiJagaKali OTA Dashboard</h1>

        <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-gray-600">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-gray-600">
          Kata Sandi
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        {isTurnstileConfigured() && (
          <div className="mb-4">
            <TurnstileField onToken={setCaptchaToken} />
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !captchaReady}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
