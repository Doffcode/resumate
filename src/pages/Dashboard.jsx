import { useState } from 'react';
import { useResumeList } from '../data/useResumeList.js';
import { Icon, icons } from '../editor/controls.jsx';

const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) === 1 ? '' : 's'} ago`;
};

// Cosmetic gate only — hides the link for everyone else so it doesn't invite
// clicks that just bounce off a 403. The actual authorization is server-side
// (api/admin-stats.js checks the real ADMIN_EMAIL env var against the
// caller's token-derived email); this is a separate, public VITE_-prefixed
// copy of the same address, safe to ship in the client bundle since knowing
// it grants no access on its own.
const isAdmin = (email) => !!import.meta.env.VITE_ADMIN_EMAIL && email === import.meta.env.VITE_ADMIN_EMAIL;

export default function Dashboard({ user, onOpen, onSignOut, onNavigate }) {
  const { resumes, loading, error, create, rename, remove } = useResumeList(user.id);
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    try {
      const id = await create('Untitled Resume');
      onOpen(id);
    } finally {
      setCreating(false);
    }
  };

  const startRename = (r) => { setRenamingId(r.id); setRenameValue(r.title); };
  const commitRename = async (id) => {
    const title = renameValue.trim() || 'Untitled Resume';
    setRenamingId(null);
    await rename(id, title);
  };

  return (
    <div className="rm-dash">
      <header className="rm-topbar">
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
        <div className="rm-spacer" />
        <span className="rm-dash-email">{user.email}</span>
        <button className="rm-btn rm-btn-ghost" onClick={onSignOut}>Sign out</button>
      </header>

      <div className="rm-dash-body">
        <div className="rm-dash-inner">
          <h1>Your resumes</h1>
          <p className="rm-dash-sub">Each resume keeps its own content, sections and page breaks.</p>

          {error && <div className="rm-notice is-error">{error}</div>}

          {loading ? (
            <p className="rm-hint">Loading…</p>
          ) : (
            <div className="rm-grid">
              {resumes.map((r) => (
                <div className="rm-card" key={r.id}>
                  <button className="rm-card-open" onClick={() => onOpen(r.id)}>
                    <div className="rm-card-thumb">
                      <div className="rm-card-thumb-page">
                        <div className="rm-card-thumb-name">{r.personal_info?.name || 'Untitled'}</div>
                        <div className="rm-card-thumb-degree">{r.personal_info?.degree || 'No degree set'}</div>
                        <div className="rm-card-thumb-rule" />
                        <div className="rm-card-thumb-lines">
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="rm-card-info">
                    {renamingId === r.id ? (
                      <input
                        className="rm-input"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(r.id)}
                        onKeyDown={(e) => e.key === 'Enter' && commitRename(r.id)}
                      />
                    ) : (
                      <div className="rm-card-name" onClick={() => onOpen(r.id)}>{r.title}</div>
                    )}
                    <div className="rm-card-date">Edited {timeAgo(r.updated_at)}</div>
                  </div>
                  <div className="rm-card-actions">
                    <button className="rm-iconbtn" title="Rename" onClick={() => startRename(r)}>
                      <Icon d={icons.edit} size={13} />
                    </button>
                    <button
                      className="rm-iconbtn is-danger"
                      title="Delete"
                      onClick={() => window.confirm(`Delete "${r.title}"? This cannot be undone.`) && remove(r.id)}
                    >
                      <Icon d={icons.trash} size={13} />
                    </button>
                  </div>
                </div>
              ))}

              <button className="rm-card rm-card-new" onClick={handleCreate} disabled={creating}>
                <Icon d={icons.plus} size={22} />
                {creating ? 'Creating…' : 'New resume'}
              </button>

              <button className="rm-card rm-card-new" onClick={() => onNavigate('import')}>
                <Icon d={icons.upload} size={22} />
                Import old resume
              </button>
            </div>
          )}

          <footer className="rm-dash-footer">
            <button className="rm-link" onClick={() => onNavigate('settings')}>Account settings</button>
            <span className="rm-dot-sep">·</span>
            <button className="rm-link" onClick={() => onNavigate('privacy')}>Privacy</button>
            <span className="rm-dot-sep">·</span>
            <button className="rm-link" onClick={() => onNavigate('terms')}>Terms</button>
            {isAdmin(user.email) && (
              <>
                <span className="rm-dot-sep">·</span>
                <button className="rm-link" onClick={() => onNavigate('admin')}>Admin</button>
              </>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
