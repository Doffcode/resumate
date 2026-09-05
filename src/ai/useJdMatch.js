import { useState, useCallback } from 'react';
import { supabase, isConnected } from '../lib/supabase.js';

// Calls the match-jd Edge Function. Contract confirmed against a REAL call
// (not just the recovered source, which describes the inner shape but not
// the response wrapper) — the actual response nests everything under
// `suggestions`:
//
//   match mode   { resume_id, job_description_text }
//     -> { success: true, suggestion_id,
//          suggestions: {
//            rewritten_projects: [{ original_index, title, date, description }],
//            missing_skills: [{ category, name }],
//            missing_experiences: [string],
//            combined_project_suggestion: { title, date, description }
//          } }
//     `analyse()` below unwraps `.suggestions` so callers only ever see the
//     inner shape — found the hard way: a real call returned 200 with real
//     content, but the panel silently showed nothing because it was reading
//     result.rewritten_projects instead of result.suggestions.rewritten_projects.
//
//   draft mode   { resume_id, mode: 'draft_project', missing_requirement }
//     -> { success: true, drafted_project: { title, date, description } }
//     (flat already — no unwrap needed; unused by the UI so far)
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
    if (error) {
      // supabase-js's default error.message is just "Edge Function returned a
      // non-2xx status code" regardless of why — the actual reason is JSON in
      // the response body, reachable only through error.context (a Response).
      let message = error.message || 'The AI service did not respond.';
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          if (body?.error) message = body.error;
        } catch { /* body wasn't JSON — keep the generic message */ }
      }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const analyse = useCallback(async (resumeId, jdText) => {
    setState({ status: 'loading', result: null, error: null });
    try {
      const data = await call({ resume_id: resumeId, job_description_text: jdText });
      const suggestions = data?.suggestions || data; // tolerate either shape
      setState({ status: 'done', result: suggestions, error: null });
      return suggestions;
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
