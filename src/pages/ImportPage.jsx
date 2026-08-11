import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { extractText, ExtractError } from '../lib/extractText.js';
import { migrate, LIMITS } from '../state/useResumeData.js';
import { useResumeList } from '../data/useResumeList.js';
import { Icon, icons } from '../editor/controls.jsx';

// Sections the review screen lets you pick items from, in resume order.
const PICKABLE = [
  { key: 'education', label: 'Education', labelOf: (r) => `${r.year || '—'} · ${r.degree || 'Degree'} · ${r.institution || ''}` },
  { key: 'internships', label: 'Internships', labelOf: (r) => r.title || 'Untitled' },
  { key: 'projects', label: 'Projects', labelOf: (r) => r.title || 'Untitled' },
  { key: 'positions', label: 'Positions of Responsibility', labelOf: (r) => r.title || 'Untitled' },
  { key: 'skills', label: 'Skills', labelOf: (r) => `${r.label || ''}: ${r.value || ''}` },
  { key: 'areas', label: 'Areas of Interest', labelOf: (r) => r.text || '' },
];

// Pre-tick up to the cap, leave the rest for the student to choose.
function initialSelection(parsed) {
  const sel = {};
  for (const { key } of PICKABLE) {
    const items = parsed[key] || [];
    const cap = LIMITS[key] ?? items.length;
    sel[key] = items.map((_, i) => i < cap);
  }
  sel.sport = (parsed.extracurriculars?.sport || []).map(() => true);
  sel.social = (parsed.extracurriculars?.social || []).map(() => true);
  return sel;
}

export default function ImportPage({ user, onCancel, onCreated }) {
  const { create } = useResumeList(user.id);
  const [stage, setStage] = useState('pick'); // 'pick' | 'working' | 'review' | 'creating'
  const [error, setError] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [selected, setSelected] = useState({});
  const [fileName, setFileName] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setStage('working');
    try {
      const text = await extractText(file);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ text }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Import failed (${res.status}).`);
      setParsed(body.parsed);
      setSelected(initialSelection(body.parsed));
      setStage('review');
    } catch (e) {
      setError(e instanceof ExtractError ? e.message : e.message || 'Something went wrong.');
      setStage('pick');
    }
  };

  const toggle = (key, i) =>
    setSelected((s) => ({ ...s, [key]: s[key].map((v, j) => (j === i ? !v : v)) }));

  const countSel = (key) => (selected[key] || []).filter(Boolean).length;

  const handleCreate = async () => {
    setStage('creating');
    setError(null);
    try {
      const picked = {};
      for (const { key } of PICKABLE) {
        picked[key] = (parsed[key] || []).filter((_, i) => selected[key]?.[i]);
      }
      const extracurriculars = {
        sport: (parsed.extracurriculars?.sport || []).filter((_, i) => selected.sport?.[i]),
        social: (parsed.extracurriculars?.social || []).filter((_, i) => selected.social?.[i]),
        sportBreak: false,
        socialBreak: false,
      };

      // migrate() fills in every app-config field from defaultResume and
      // guarantees the shape is complete, so partial model output can't
      // reach pagination. IDs are assigned here since the model doesn't
      // produce them.
      const withIds = (arr) => arr.map((item, i) => ({ ...item, id: i + 1, pageBreak: false }));
      const data = migrate({
        personalInfo: parsed.personalInfo || {},
        educationNote: parsed.educationNote || '',
        education: withIds(picked.education),
        internships: withIds(picked.internships),
        projects: withIds(picked.projects),
        positions: withIds(picked.positions),
        skills: withIds(picked.skills),
        areas: withIds(picked.areas),
        extracurriculars: {
          ...extracurriculars,
          sport: withIds(extracurriculars.sport),
          social: withIds(extracurriculars.social),
        },
      });

      // Turn on sections the import actually found — both default to off.
      // This also drives rule #18: with internships present, the projects
      // heading correctly renders as "Other Projects".
      data.sectionVisibility = {
        ...data.sectionVisibility,
        internships: picked.internships.length > 0,
        positions: picked.positions.length > 0,
      };

      const title = parsed.personalInfo?.name ? `${parsed.personalInfo.name}'s Resume` : 'Imported Resume';
      const id = await create(title, data);
      onCreated(id);
    } catch (e) {
      setError(e.message || 'Could not create the resume.');
      setStage('review');
    }
  };

  return (
    <div className="rm-dash">
      <header className="rm-topbar">
        <button className="rm-iconbtn" onClick={onCancel} title="Back"><Icon d={icons.back} size={16} /></button>
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
      </header>

      <div className="rm-dash-body">
        <div className="rm-dash-inner" style={{ maxWidth: 680 }}>
          <h1>Import an old resume</h1>
          <p className="rm-dash-sub">
            Upload your existing resume and we'll fill in what we can find. You'll review
            everything before anything is created — and you can edit it all afterwards.
          </p>

          {error && <div className="rm-notice is-error">{error}</div>}

          {stage === 'pick' && (
            <>
              <label className="rm-dropzone">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <Icon d={icons.doc} size={28} />
                <strong>Choose a PDF or Word file</strong>
                <span className="rm-hint">Your file stays in your browser — only the text is sent for reading.</span>
              </label>
              <button className="rm-btn rm-btn-ghost" style={{ marginTop: 14 }} onClick={onCancel}>Cancel</button>
            </>
          )}

          {stage === 'working' && (
            <div className="rm-import-working">
              <p><strong>Reading {fileName}…</strong></p>
              <p className="rm-hint">Extracting the text, then working out which parts go where.</p>
            </div>
          )}

          {(stage === 'review' || stage === 'creating') && parsed && (
            <>
              <div className="rm-item" style={{ marginTop: 16 }}>
                <div className="rm-item-title">Personal details</div>
                <div className="rm-hint">
                  {parsed.personalInfo?.name || '(no name found)'} · {parsed.personalInfo?.degree || '—'} ·{' '}
                  {parsed.personalInfo?.email || '—'} · {parsed.personalInfo?.contact || '—'}
                </div>
              </div>

              {PICKABLE.map(({ key, label, labelOf }) => {
                const items = parsed[key] || [];
                if (items.length === 0) return null;
                const cap = LIMITS[key];
                const overCap = cap && items.length > cap;
                return (
                  <div className="rm-import-section" key={key}>
                    <div className="rm-import-sechead">
                      {label}
                      <span className="rm-hint">{countSel(key)} of {items.length} selected</span>
                    </div>
                    {overCap && (
                      <div className="rm-hint" style={{ marginBottom: 6 }}>
                        The NIT Trichy format allows {cap}. We've pre-selected the first {cap} — untick and
                        pick different ones if you'd rather.
                      </div>
                    )}
                    {items.map((item, i) => (
                      <label className="rm-import-item" key={i}>
                        <input
                          type="checkbox"
                          checked={!!selected[key]?.[i]}
                          disabled={cap && !selected[key]?.[i] && countSel(key) >= cap}
                          onChange={() => toggle(key, i)}
                        />
                        <span>{labelOf(item)}</span>
                      </label>
                    ))}
                  </div>
                );
              })}

              {['sport', 'social'].map((kind) => {
                const items = parsed.extracurriculars?.[kind] || [];
                if (items.length === 0) return null;
                return (
                  <div className="rm-import-section" key={kind}>
                    <div className="rm-import-sechead">
                      {kind === 'sport' ? 'Sports Activities' : 'Social Activities'}
                      <span className="rm-hint">{countSel(kind)} of {items.length} selected</span>
                    </div>
                    {items.map((item, i) => (
                      <label className="rm-import-item" key={i}>
                        <input type="checkbox" checked={!!selected[kind]?.[i]} onChange={() => toggle(kind, i)} />
                        <span>{item.text}</span>
                      </label>
                    ))}
                  </div>
                );
              })}

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button className="rm-btn rm-btn-ghost" onClick={onCancel} disabled={stage === 'creating'}>Cancel</button>
                <button className="rm-btn rm-btn-primary" onClick={handleCreate} disabled={stage === 'creating'}>
                  {stage === 'creating' ? 'Creating…' : 'Create this resume'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
