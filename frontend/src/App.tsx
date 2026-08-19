import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './lib/supabase';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Memuat...</div>;
  }

  if (!session) return <LoginPage />;

  return <Dashboard accessToken={session.access_token} onLogout={() => getSupabase().auth.signOut()} />;
}

export default App;
