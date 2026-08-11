import { useState, useEffect, useCallback } from 'react';
import { supabase, isConnected, toRow } from '../lib/supabase.js';
import { defaultResume, SCHEMA_VERSION } from './defaultResume.js';

// Dashboard-level CRUD over the resumes table. Row content itself is opaque
// here (jsonb columns) — useResumeData owns editing a single resume.
export function useResumeList(userId) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isConnected() || !userId) { setResumes([]); setLoading(false); return; }
    setLoading(true);
    // personal_info is fetched too — just enough for the dashboard card
    // preview (name/degree) without pulling the rest of a resume's content.
    const { data, error: err } = await supabase
      .from('resumes')
      .select('id, title, updated_at, personal_info')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else { setResumes(data || []); setError(null); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // `data` lets the importer seed a new resume with parsed content. It must
  // already have been through migrate() so app-config fields (footer,
  // pageBreaks, layoutSettings…) are present and correct — this function
  // does not sanitise, it just writes.
  const create = useCallback(async (title, data = null) => {
    const content = data || { ...defaultResume, schemaVersion: SCHEMA_VERSION };
    const row = { user_id: userId, title, ...toRow(content) };
    const { data: inserted, error: err } = await supabase.from('resumes').insert(row).select('id').single();
    if (err) throw new Error(err.message);
    await refresh();
    return inserted.id;
  }, [userId, refresh]);

  const rename = useCallback(async (id, title) => {
    const { error: err } = await supabase.from('resumes').update({ title }).eq('id', id);
    if (err) throw new Error(err.message);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase.from('resumes').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await refresh();
  }, [refresh]);

  return { resumes, loading, error, create, rename, remove, refresh };
}
