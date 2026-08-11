import { useState } from 'react';
import { isConnected } from '../lib/supabase.js';

export default function AuthScreen({ auth, initialMode = 'signin', onBack }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        await auth.signUp(email, password);
        setNotice('Account created. Check your e-mail to confirm, then sign in.');
        setMode('signin');
      } else {
        await auth.signIn(email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rm-auth">
      <div className="rm-auth-card">
        {onBack && (
          <button className="rm-btn rm-btn-ghost" style={{ marginBottom: 6, marginLeft: -8 }} onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="rm-brand" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <span className="rm-mark">R</span>Resumate
        </div>

        {!isConnected() && (
          <div className="rm-notice">
            Supabase is not configured. Add VITE_SUPABASE_ANON_KEY to .env.local to enable accounts.
          </div>
        )}

        <h1>{mode === 'signup' ? 'Create an account' : 'Sign in'}</h1>

        <form onSubmit={submit}>
          <div className="rm-field">
            <label>E-mail</label>
            <input
              className="rm-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="rm-field">
            <label>Password</label>
            <input
              className="rm-input"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="rm-notice is-error">{error}</div>}
          {notice && <div className="rm-notice is-ok">{notice}</div>}

          <button className="rm-btn rm-btn-primary rm-auth-submit" disabled={busy || !isConnected()}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="rm-btn rm-btn-ghost rm-auth-switch"
          onClick={() => { setMode((m) => (m === 'signup' ? 'signin' : 'signup')); setError(null); setNotice(null); }}
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
