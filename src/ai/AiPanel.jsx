import { useState } from 'react';
import { isConnected } from '../lib/supabase.js';
import { useJdMatch } from './useJdMatch.js';
import { LIMITS } from '../state/useResumeData.js';
import { Icon, icons } from '../editor/controls.jsx';

// Nothing here ever writes to the resume on its own. Every suggestion needs an
// explicit Replace / Keep Both / Add, and anything describing work the student
// has NOT actually done additionally requires a confirmation step.
export default function AiPanel({ rd, resumeId, open, onClose }) {
  const [jd, setJd] = useState('');
  const [dismissed, setDismissed] = useState({});
  const [confirming, setConfirming] = useState(null);
  const ai = useJdMatch();

  if (!open) return null;

  const drop = (key) => setDismissed((d) => ({ ...d, [key]: true }));
  const projectsFull = rd.data.projects.length >= LIMITS.projects;

  // Preconditions, named precisely — never a button that silently does nothing.
  const blocker = !isConnected()
    ? 'Add VITE_SUPABASE_ANON_KEY to .env.local to enable the AI assistant.'
    : !resumeId
      ? 'Sign in and save this resume before using the AI assistant — the service reads it from your account.'
      : null;

  const r = ai.result;

  return (
    <aside className="rm-drawer">
      <div className="rm-drawer-head">
        <Icon d={icons.spark} />
        <h3>AI Assistant</h3>
        <span className="rm-badge is-beta">BETA</span>
        <button className="rm-iconbtn" onClick={onClose} title="Close"><Icon d={icons.close} size={14} /></button>
      </div>

      <div className="rm-drawer-body">
        {blocker && <div className="rm-notice">{blocker}</div>}

        <div className="rm-jd">
          <label>Paste a job description</label>
          <textarea
            className="rm-textarea"
            value={jd}
            placeholder="Paste the JD text here…"
            onChange={(e) => setJd(e.target.value)}
          />
          <button
            className="rm-btn rm-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 9 }}
            disabled={!!blocker || !jd.trim() || ai.status === 'loading'}
            onClick={() => ai.analyse(resumeId, jd)}
          >
            {ai.status === 'loading' ? 'Analysing…' : 'Analyse against my resume'}
          </button>
        </div>

        {ai.status === 'error' && <div className="rm-notice is-error">{ai.error}</div>}

        {/* 1. Rewritten versions of projects the student actually built */}
        {r?.rewritten_projects?.map((p, i) => {
          const key = `rw-${i}`;
          if (dismissed[key]) return null;
          const target = rd.data.projects[p.original_index];
          return (
            <div className="rm-sugg" key={key}>
              <div className="rm-sugg-head">
                <span className="rm-sugg-label">Suggested rewrite · {target?.title || 'project'}</span>
                <span className="rm-tag-ai">AI</span>
              </div>
              <div className="rm-sugg-body">
                <div className="rm-sugg-title">{p.title}</div>
                <p>{p.description}</p>
              </div>
              <div className="rm-sugg-actions">
                <button
                  className="rm-btn rm-btn-primary"
                  disabled={!target}
                  onClick={() => {
                    rd.setItem('projects', target.id, 'title', p.title);
                    rd.setItem('projects', target.id, 'description', p.description);
                    if (p.date) rd.setItem('projects', target.id, 'date', p.date);
                    drop(key);
                  }}
                >
                  Replace
                </button>
                <button
                  className="rm-btn rm-btn-secondary"
                  disabled={projectsFull}
                  title={projectsFull ? `Limit of ${LIMITS.projects} projects reached` : undefined}
                  onClick={() => { rd.addProject(p); drop(key); }}
                >
                  Keep both
                </button>
                <button className="rm-btn rm-btn-ghost" onClick={() => drop(key)}>Discard</button>
              </div>
            </div>
          );
        })}

        {/* 2. Skill gaps -> Add to Skills, never "draft a project" */}
        {r?.missing_skills?.length > 0 && (
          <div className="rm-sugg">
            <div className="rm-sugg-head">
              <span className="rm-sugg-label">Missing requirements · skills</span>
              <span className="rm-tag-ai is-gap">GAP</span>
            </div>
            <div className="rm-sugg-body">
              {Object.entries(
                r.missing_skills.reduce((acc, s) => {
                  (acc[s.category] ||= []).push(s.name);
                  return acc;
                }, {})
              ).map(([category, names]) => {
                const key = `sk-${category}`;
                if (dismissed[key]) return null;
                return (
                  <div className="rm-gap-row" key={key}>
                    <div>
                      <div className="rm-sugg-title">{category}</div>
                      <p>{names.join(', ')}</p>
                    </div>
                    <div className="rm-gap-actions">
                      <button
                        className="rm-btn rm-btn-secondary"
                        onClick={() => { rd.addSkills(category, names); drop(key); }}
                      >
                        Add to Skills
                      </button>
                      <button className="rm-btn rm-btn-ghost" onClick={() => drop(key)}>Discard</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Experience gaps -> ONE combined project, behind a confirmation */}
        {r?.combined_project_suggestion && !dismissed['combined'] && (
          <div className="rm-sugg">
            <div className="rm-sugg-head">
              <span className="rm-sugg-label">Missing requirements · experience</span>
              <span className="rm-tag-ai is-gap">GAP</span>
            </div>
            <div className="rm-sugg-body">
              <div className="rm-sugg-title">{r.combined_project_suggestion.title}</div>
              <p>{r.combined_project_suggestion.description}</p>
              {r.missing_experiences?.length > 0 && (
                <p className="rm-gap-covers">Covers: {r.missing_experiences.join(', ')}</p>
              )}
            </div>
            <div className="rm-warn-inline">
              <Icon d={icons.warn} size={13} />
              <span>This describes work you have <strong>not</strong> done yet. Adding it will ask you to confirm first.</span>
            </div>
            <div className="rm-sugg-actions">
              <button
                className="rm-btn rm-btn-secondary"
                disabled={projectsFull}
                title={projectsFull ? `Limit of ${LIMITS.projects} projects reached` : undefined}
                onClick={() => setConfirming(r.combined_project_suggestion)}
              >
                Add as project
              </button>
              <button className="rm-btn rm-btn-ghost" onClick={() => drop('combined')}>Discard</button>
            </div>
          </div>
        )}
      </div>

      {confirming && (
        <div className="rm-modal-backdrop" onClick={() => setConfirming(null)}>
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Add work you haven't done yet?</h4>
            <p>
              "{confirming.title}" was written by the AI, not from your resume. Recruiters ask about
              everything on a resume. Only add it if you intend to actually build it before interviews.
            </p>
            <div className="rm-modal-actions">
              <button className="rm-btn rm-btn-ghost" onClick={() => setConfirming(null)}>Cancel</button>
              <button
                className="rm-btn rm-btn-primary"
                onClick={() => { rd.addProject(confirming); drop('combined'); setConfirming(null); }}
              >
                I understand, add it
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
