import { useState } from 'react';
import { isConnected } from './lib/supabase.js';
import { useAuth } from './auth/useAuth.js';
import AuthScreen from './auth/AuthScreen.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EditorPage from './pages/EditorPage.jsx';
import './editor/editor.css';

// scripts/golden-check.mjs and golden-check.mjs hit this directly so the
// pixel-diff tests the sealed renderer against the fixed default fixture,
// completely independent of auth state or which Supabase project is
// configured in the build. Without this, adding real accounts would silently
// make the golden baseline untestable (the root route would show a login
// screen instead of a resume) — caught by golden:check going from PASS to
// "page count: candidate 1, golden 2" the moment auth was wired in.
const isGoldenCheck = () => new URLSearchParams(location.search).has('golden');

export default function App() {
  const auth = useAuth();
  const [openResumeId, setOpenResumeId] = useState(null);

  if (isGoldenCheck()) {
    return <EditorPage resumeId={null} onBack={null} />;
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
