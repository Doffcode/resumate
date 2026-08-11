import { useState, useEffect, useCallback, useRef } from 'react';
import { defaultResume, SCHEMA_VERSION } from '../data/defaultResume.js';
import { supabase, isConnected, toRow, fromRow } from '../lib/supabase.js';

const GUEST_STORAGE_KEY = 'resumate.resume.guest';

// Caps live here, not scattered through the UI.
export const LIMITS = { projects: 6, internships: 4, positions: 4, education: 8 };

const clone = (v) => JSON.parse(JSON.stringify(v));
const nextId = (list) => (list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1);
const blank = () => ({ ...clone(defaultResume), schemaVersion: SCHEMA_VERSION });

// Brings a resume up to the current shape WITHOUT overwriting user edits: only
// fills in keys the saved copy is missing. Future schema versions add cases
// here — this is what stops a default-data change from silently clobbering a
// student's saved resume. Exported so PrintPage can apply the same
// shape-safety to data injected from the export function.
export function migrate(saved) {
  const data = { ...blank(), ...saved };
  for (const key of ['personalInfo', 'layoutSettings', 'sectionVisibility', 'footer']) {
    data[key] = { ...defaultResume[key], ...(saved[key] || {}) };
  }

  // pageBreaks needs two different behaviours, and conflating them was a bug.
  //
  // It is stored as an array of only the *enabled* section ids (the live table
  // has a page_breaks_is_array check constraint), so within a saved resume a
  // break that is off is simply absent — "off" and "unset" look identical.
  // Merging defaults on top therefore resurrected any break the student had
  // deliberately turned off: the editor showed the right page count from
  // in-memory state, while a reload or a PDF export re-enabled the default
  // break and silently produced an extra page.
  //
  // But when there is no pageBreaks key at all (a brand new resume, an
  // imported one, or the ?golden=1 fixture) the defaults are exactly what we
  // want. So: key present -> absent means off; key missing -> use defaults.
  const allBreaksOff = Object.fromEntries(Object.keys(defaultResume.pageBreaks).map((k) => [k, false]));
  data.pageBreaks = saved.pageBreaks
    ? { ...allBreaksOff, ...saved.pageBreaks }
    : { ...defaultResume.pageBreaks };

  if (!data.extracurriculars || Array.isArray(data.extracurriculars)) {
    data.extracurriculars = clone(defaultResume.extracurriculars);
  }
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

function loadGuest() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : blank();
  } catch {
    return blank();
  }
}

// resumeId === null and no connection -> single unsynced resume in
// localStorage (used for the signed-out / not-configured preview). Otherwise
// the resume is a row in Supabase, identified by resumeId; mutators are
// identical in both modes.
export function useResumeData(resumeId) {
  const guestMode = !resumeId || !isConnected();
  const [data, setData] = useState(guestMode ? loadGuest : blank);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(!guestMode);
  const [loadError, setLoadError] = useState(null);
  const loadedId = useRef(null);

  // Load the row when resumeId changes. Guards against a slow fetch for resume
  // A resolving after the user has already navigated to resume B.
  useEffect(() => {
    if (guestMode) { setData(loadGuest()); setLoading(false); loadedId.current = null; return; }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    supabase.from('resumes').select('*').eq('id', resumeId).single().then(({ data: row, error }) => {
      if (cancelled) return;
      if (error) { setLoadError(error.message); setLoading(false); return; }
      setData(migrate({ ...fromRow(row), title: row.title }));
      loadedId.current = resumeId;
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [resumeId, guestMode]);

  // Autosave on a debounce. Guarded so a fetch that resolves after the id
  // changed again, or the initial load itself, can never write stale content
  // back over a different (or not-yet-loaded) resume.
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      if (guestMode) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
        setSavedAt(Date.now());
        return;
      }
      if (loadedId.current !== resumeId) return;
      const { error } = await supabase
        .from('resumes')
        .update({ ...toRow(data), updated_at: new Date().toISOString() })
        .eq('id', resumeId);
      if (!error) setSavedAt(Date.now());
    }, 600);
    return () => clearTimeout(t);
  }, [data, guestMode, resumeId, loading]);

  const update = useCallback((fn) => setData((prev) => fn(clone(prev))), []);

  const api = {
    setPersonal: (field, value) => update((d) => { d.personalInfo[field] = value; return d; }),

    setEducation: (id, field, value) =>
      update((d) => { const r = d.education.find((x) => x.id === id); if (r) r[field] = value; return d; }),
    addEducation: () =>
      update((d) => {
        if (d.education.length >= LIMITS.education) return d;
        d.education.push({ id: nextId(d.education), year: '', degree: '', institution: '', grade: '' });
        return d;
      }),
    removeEducation: (id) => update((d) => { d.education = d.education.filter((x) => x.id !== id); return d; }),
    setEducationNote: (value) => update((d) => { d.educationNote = value; return d; }),

    setItem: (secId, id, field, value) =>
      update((d) => { const it = d[secId].find((x) => x.id === id); if (it) it[field] = value; return d; }),
    addItem: (secId) =>
      update((d) => {
        const limit = LIMITS[secId];
        if (limit && d[secId].length >= limit) return d;
        const base = { id: nextId(d[secId]), pageBreak: false };
        d[secId].push(
          secId === 'skills' ? { ...base, label: '', value: '' }
          : secId === 'areas' ? { ...base, text: '' }
          : { ...base, title: '', date: '', description: '', bullets: [] }
        );
        return d;
      }),
    removeItem: (secId, id) => update((d) => { d[secId] = d[secId].filter((x) => x.id !== id); return d; }),
    moveItem: (secId, id, dir) =>
      update((d) => {
        const i = d[secId].findIndex((x) => x.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d[secId].length) return d;
        [d[secId][i], d[secId][j]] = [d[secId][j], d[secId][i]];
        return d;
      }),

    setBullet: (secId, itemId, idx, value) =>
      update((d) => { const it = d[secId].find((x) => x.id === itemId); if (it) it.bullets[idx] = value; return d; }),
    addBullet: (secId, itemId) =>
      update((d) => {
        const it = d[secId].find((x) => x.id === itemId);
        if (it) it.bullets = [...(it.bullets || []), ''];
        return d;
      }),
    removeBullet: (secId, itemId, idx) =>
      update((d) => {
        const it = d[secId].find((x) => x.id === itemId);
        if (it) it.bullets = it.bullets.filter((_, i) => i !== idx);
        return d;
      }),

    setExtra: (kind, id, text) =>
      update((d) => { const it = d.extracurriculars[kind].find((x) => x.id === id); if (it) it.text = text; return d; }),
    addExtra: (kind) =>
      update((d) => { d.extracurriculars[kind].push({ id: nextId(d.extracurriculars[kind]), text: '' }); return d; }),
    removeExtra: (kind, id) =>
      update((d) => { d.extracurriculars[kind] = d.extracurriculars[kind].filter((x) => x.id !== id); return d; }),
    toggleExtraBreak: (kind) =>
      update((d) => { const k = `${kind}Break`; d.extracurriculars[k] = !d.extracurriculars[k]; return d; }),

    toggleVisibility: (secId) =>
      update((d) => { d.sectionVisibility[secId] = d.sectionVisibility[secId] === false; return d; }),
    toggleSectionBreak: (secId) =>
      update((d) => { d.pageBreaks[secId] = !d.pageBreaks[secId]; return d; }),
    toggleItemBreak: (secId, id) =>
      update((d) => { const it = d[secId].find((x) => x.id === id); if (it) it.pageBreak = !it.pageBreak; return d; }),

    // Used by the AI panel's "Keep both" / "Add as project". Respects the cap
    // and silently no-ops rather than throwing if it is already reached — the
    // UI disables the button, this is the second line of defence.
    addProject: (p) =>
      update((d) => {
        if (d.projects.length >= LIMITS.projects) return d;
        d.projects.push({
          id: nextId(d.projects),
          title: p.title || '',
          date: p.date || '',
          description: p.description || '',
          bullets: [],
          pageBreak: false,
        });
        return d;
      }),

    // Merges into an existing category when one matches, otherwise adds a row.
    // Never duplicates a skill that is already listed.
    addSkills: (category, names) =>
      update((d) => {
        const existing = d.skills.find(
          (s) => s.label?.trim().toLowerCase() === category.trim().toLowerCase()
        );
        if (existing) {
          const have = existing.value.split(',').map((x) => x.trim().toLowerCase());
          const fresh = names.filter((n) => !have.includes(n.trim().toLowerCase()));
          if (fresh.length) existing.value = [existing.value, ...fresh].filter(Boolean).join(', ');
        } else {
          d.skills.push({ id: nextId(d.skills), label: category, value: names.join(', '), pageBreak: false });
        }
        return d;
      }),

    reset: () => setData(blank()),
  };

  return { data, savedAt, loading, loadError, guestMode, ...api };
}
