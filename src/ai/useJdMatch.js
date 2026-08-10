import { useState, useCallback } from 'react';
import { supabase, isConnected } from '../lib/supabase.js';

// Calls the match-jd Edge Function. Contract taken from the recovered
// supabase/functions/match-jd/index.ts, not guessed:
//
//   match mode   { resume_id, job_description_text }
//     -> { rewritten_projects: [{ original_index, title, date, description }],
//          missing_skills: [{ category, name }],
//          missing_experiences: [string],
//          combined_project_suggestion: { title, date, description } }
//
//   draft mode   { resume_id, mode: 'draft_project', missing_requirement }
//     -> { success: true, drafted_project: { title, date, description } }
//
// The function requires a Bearer token and verifies resume ownership (403).
export function useJdMatch() {
  const [state, setState] = useState({ status: 'idle', result: null, error: null });

  const call = useCallback(async (body) => {
    if (!isConnected()) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_ANON_KEY to .env.local.');
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('You need to be signed in to use the AI assistant.');

    const { data, error } = await supabase.functions.invoke('match-jd', { body });
    if (error) throw new Error(error.message || 'The AI service did not respond.');
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const analyse = useCallback(async (resumeId, jdText) => {
    setState({ status: 'loading', result: null, error: null });
    try {
      const data = await call({ resume_id: resumeId, job_description_text: jdText });
      setState({ status: 'done', result: data, error: null });
      return data;
    } catch (e) {
      setState({ status: 'error', result: null, error: e.message });
      return null;
    }
  }, [call]);

  const draftProject = useCallback(
    (resumeId, missingRequirement) =>
      call({ resume_id: resumeId, mode: 'draft_project', missing_requirement: missingRequirement }),
    [call]
  );

  const reset = useCallback(() => setState({ status: 'idle', result: null, error: null }), []);

  return { ...state, analyse, draftProject, reset };
}
