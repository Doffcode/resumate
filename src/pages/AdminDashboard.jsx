import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Icon, icons } from '../editor/controls.jsx';

function useAdminStats() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) setState({ status: 'error', data: null, error: body.error || `Failed (${res.status}).` });
      else setState({ status: 'done', data: body, error: null });
    })();
    return () => { cancelled = true; };
  }, []);
  return state;
}

function Bar({ value, max }) {
  const h = max > 0 ? Math.max(2, Math.round((value / max) * 48)) : 2;
  return <div className="rm-bar" style={{ height: h }} title={String(value)} />;
}

function UserDrilldown({ user, onClose }) {
  const [resumes, setResumes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin-user/${user.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) setError(body.error || `Failed (${res.status}).`);
      else setResumes(body.resumes);
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  return (
    <div className="rm-modal-backdrop" onClick={onClose}>
      <div className="rm-modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <h4>{user.email}</h4>
        {error && <div className="rm-notice is-error">{error}</div>}
        {!resumes && !error && <p className="rm-hint">Loading…</p>}
        {resumes && resumes.length === 0 && <p className="rm-hint">No resumes.</p>}
        {resumes?.map((r) => (
          <div className="rm-item" key={r.id} style={{ marginTop: 9 }}>
            <div className="rm-item-title">{r.title}</div>
            <div className="rm-hint">{r.personal_info?.name} · {r.education?.length || 0} education rows · {r.projects?.length || 0} projects</div>
          </div>
        ))}
        <div className="rm-modal-actions">
          <button className="rm-btn rm-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const { status, data, error } = useAdminStats();
  const [drillUser, setDrillUser] = useState(null);

  return (
    <div className="rm-dash">
      <header className="rm-topbar">
        <button className="rm-iconbtn" onClick={onBack} title="Back"><Icon d={icons.back} size={16} /></button>
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate Admin</div>
      </header>

      <div className="rm-dash-body">
        <div className="rm-dash-inner" style={{ maxWidth: 780 }}>
          <h1>Admin</h1>

          {status === 'loading' && <p className="rm-hint">Loading…</p>}
          {status === 'error' && <div className="rm-notice is-error">{error}</div>}

          {status === 'done' && (
            <>
              <div className="rm-admin-counters">
                <div className="rm-admin-counter"><div className="rm-admin-num">{data.totals.signups}</div><div className="rm-hint">Total signups</div></div>
                <div className="rm-admin-counter"><div className="rm-admin-num">{data.totals.pdf_exports_30d}</div><div className="rm-hint">PDF exports (30d)</div></div>
                <div className="rm-admin-counter"><div className="rm-admin-num">{data.totals.ai_calls_30d}</div><div className="rm-hint">AI calls (30d)</div></div>
              </div>

              <h2 style={{ fontSize: 14, fontWeight: 650, marginTop: 28, marginBottom: 10 }}>Last 30 days</h2>
              <div className="rm-chart">
                {data.daily.map((d) => {
                  const max = Math.max(1, ...data.daily.map((x) => Math.max(x.pdf_export, x.ai_call)));
                  return (
                    <div className="rm-chart-col" key={d.day} title={d.day}>
                      <Bar value={d.pdf_export} max={max} />
                      <Bar value={d.ai_call} max={max} />
                    </div>
                  );
                })}
              </div>
              <div className="rm-hint" style={{ marginTop: 6 }}>Left bar = PDF exports · right bar = AI calls, per day</div>

              <h2 style={{ fontSize: 14, fontWeight: 650, marginTop: 28, marginBottom: 10 }}>Users ({data.users.length})</h2>
              <div className="rm-admin-userlist">
                {data.users.map((u) => (
                  <button className="rm-admin-user-row" key={u.id} onClick={() => setDrillUser(u)}>
                    <span>{u.email}</span>
                    <span className="rm-hint">{u.resumeCount} resume{u.resumeCount === 1 ? '' : 's'}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {drillUser && <UserDrilldown user={drillUser} onClose={() => setDrillUser(null)} />}
    </div>
  );
}
