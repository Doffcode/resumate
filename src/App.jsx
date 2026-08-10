import { useState } from 'react';
import { isConnected } from './lib/supabase.js';
import { useAuth } from './auth/useAuth.js';
import AuthScreen from './auth/AuthScreen.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EditorPage from './pages/EditorPage.jsx';
import PrintPage from './pages/PrintPage.jsx';
import './editor/editor.css';

// Two auth-independent routes, both served by the chrome-free PrintPage:
//   ?golden=1 — golden-check.mjs/golden-update.mjs. No injected data, so this
//               always renders the fixed default fixture. Without this,
//               adding real accounts silently made the golden baseline
//               untestable (root route showed a login screen instead of a
//               resume) — caught by golden:check going from PASS to
//               "page count: candidate 1, golden 2" the moment auth landed.
//   ?print=1  — api/export-pdf.js. It injects a real, already
//               ownership-verified resume via page.evaluateOnNewDocument
//               before navigating here, so Puppeteer never needs to hold a
//               Supabase session at all.
const isPrintRoute = () => {
  const p = new URLSearchParams(location.search);
  return p.has('golden') || p.has('print');
};

export default function App() {
  const auth = useAuth();
  const [openResumeId, setOpenResumeId] = useState(null);

  if (isPrintRoute()) {
    return <PrintPage />;
  }

  // No Supabase configured at all: skip accounts entirely and fall back to a
  // single unsynced local resume, same as the original preview-only shell.
  if (!isConnected()) {
    return <EditorPage resumeId={null} onBack={null} />;
  }

  if (auth.loading) {
    return <div className="rm-app"><div className="rm-page-loading">Loading…</div></div>;
  }

  if (!auth.user) {
    return <AuthScreen auth={auth} />;
  }

  if (openResumeId) {
    return <EditorPage resumeId={openResumeId} onBack={() => setOpenResumeId(null)} />;
  }

  return (
    <Dashboard
      user={auth.user}
      onOpen={setOpenResumeId}
      onSignOut={auth.signOut}
    />
  );
}
