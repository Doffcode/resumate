import { supabase, isConnected } from './supabase.js';

const TIMEOUT_MS = 12000;

// Extracts a filename from Content-Disposition, e.g.
// `attachment; filename="Jane_Doe_Resume.pdf"` -> "Jane_Doe_Resume.pdf".
function filenameFrom(header) {
  const m = /filename="([^"]+)"/.exec(header || '');
  return m ? m[1] : 'Resume.pdf';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Returns one of:
//   { status: 'downloaded' }                    — server export succeeded
//   { status: 'fallback', reason }               — server unreachable/erroring,
//                                                   window.print() was used instead
//   { status: 'error', message }                 — a real problem the fallback
//                                                   would only hide (rate limit,
//                                                   auth, not found) — surfaced,
//                                                   not printed around
//   { status: 'print' }                          — guest mode, no server round trip
//
// Only 5xx / network / timeout fall back to window.print(). A 429 falling
// back would silently defeat the rate limit it's there to enforce; a 401/404
// falling back would mask an actual bug instead of surfacing it.
export async function exportPdf(resumeId) {
  if (!resumeId || !isConnected()) {
    window.print();
    return { status: 'print' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { status: 'error', message: 'Not signed in.' };

    const res = await fetch('/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ resume_id: resumeId }),
      signal: controller.signal,
    });

    if (res.status >= 400 && res.status < 500) {
      const body = await res.json().catch(() => ({}));
      return { status: 'error', message: body.error || `Export failed (${res.status}).` };
    }
    if (!res.ok) {
      window.print();
      return { status: 'fallback', reason: `Server error (${res.status}).` };
    }

    const blob = await res.blob();
    downloadBlob(blob, filenameFrom(res.headers.get('Content-Disposition')));
    return { status: 'downloaded' };
  } catch (e) {
    window.print();
    return { status: 'fallback', reason: e.name === 'AbortError' ? 'Request timed out.' : e.message };
  } finally {
    clearTimeout(timer);
  }
}
