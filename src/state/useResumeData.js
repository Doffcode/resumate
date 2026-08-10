import { useState, useEffect, useCallback } from 'react';
import { defaultResume, SCHEMA_VERSION } from '../data/defaultResume.js';

const STORAGE_KEY = 'resumate.resume.v1';

// Caps live here, not scattered through the UI.
export const LIMITS = { projects: 6, internships: 4, positions: 4, education: 8 };

const clone = (v) => JSON.parse(JSON.stringify(v));
const nextId = (list) => (list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1);

// Brings a stored resume up to the current shape WITHOUT overwriting user edits:
// only fills in keys the saved copy is missing. Future versions add cases here.
function migrate(saved) {
  const data = { ...clone(defaultResume), ...saved };
  for (const key of ['personalInfo', 'layoutSettings', 'pageBreaks', 'sectionVisibility', 'footer']) {
    data[key] = { ...defaultResume[key], ...(saved[key] || {}) };
  }
  if (!data.extracurriculars || Array.isArray(data.extracurriculars)) {
    data.extracurriculars = clone(defaultResume.extracurriculars);
  }
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...clone(defaultResume), schemaVersion: SCHEMA_VERSION };
    return migrate(JSON.parse(raw));
  } catch {
    return { ...clone(defaultResume), schemaVersion: SCHEMA_VERSION };
  }
}

export function useResumeData() {
  const [data, setData] = useState(load);
  const [savedAt, setSavedAt] = useState(null);

  // Autosave. Supabase replaces this body later; the call sites do not change.
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSavedAt(Date.now());
    }, 600);
    return () => clearTimeout(t);
  }, [data]);

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

    reset: () => setData({ ...clone(defaultResume), schemaVersion: SCHEMA_VERSION }),
  };

  return { data, savedAt, ...api };
}
