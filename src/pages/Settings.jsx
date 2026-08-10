import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Icon, icons } from '../editor/controls.jsx';

export default function Settings({ user, onBack, onSignOut }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Deletion failed (${res.status}).`);
      await onSignOut();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="rm-dash">
      <header className="rm-topbar">
        <button className="rm-iconbtn" onClick={onBack} title="Back to dashboard">
          <Icon d={icons.back} size={16} />
        </button>
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
        <div className="rm-spacer" />
        <span className="rm-dash-email">{user.email}</span>
      </header>

      <div className="rm-dash-body">
        <div className="rm-dash-inner" style={{ maxWidth: 560 }}>
          <h1>Account settings</h1>

          <div className="rm-danger-zone">
            <h2>Delete my account and all data</h2>
            <p>
              This permanently deletes every resume in your account and your login itself —
              you would need to sign up again from scratch to use Resumate. This cannot be undone.
            </p>

            {error && <div className="rm-notice is-error">{error}</div>}

            {!confirming ? (
              <button className="rm-btn rm-btn-danger" onClick={() => setConfirming(true)}>
                Delete my account and all data
              </button>
            ) : (
              <div className="rm-danger-confirm">
                <p>Are you sure? Type <strong>delete</strong> to confirm, or cancel below.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="rm-btn rm-btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>
                    Cancel
                  </button>
                  <button className="rm-btn rm-btn-danger" onClick={handleDelete} disabled={busy}>
                    {busy ? 'Deleting…' : 'Yes, permanently delete everything'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
