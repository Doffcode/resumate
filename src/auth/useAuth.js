import { useState, useEffect } from 'react';
import { supabase, isConnected } from '../lib/supabase.js';

// Wraps Supabase Auth session state. When not connected (no key configured),
// user is always null and every action rejects with a clear message instead
// of silently doing nothing.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isConnected());

  useEffect(() => {
    if (!isConnected()) return;
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setLoading(false); }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (mounted) setSession(next);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const requireConnection = () => {
    if (!isConnected()) throw new Error('Supabase is not configured (missing VITE_SUPABASE_ANON_KEY).');
  };

  return {
    session,
    user: session?.user ?? null,
    loading,
    signUp: async (email, password) => {
      requireConnection();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
    },
    signIn: async (email, password) => {
      requireConnection();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signOut: async () => {
      requireConnection();
      await supabase.auth.signOut();
    },
  };
}
