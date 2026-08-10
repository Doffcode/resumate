import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Null until .env.local carries both values. Every caller must handle null so
// the app degrades to a clear "not connected" state instead of a broken button.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isConnected = () => Boolean(supabase);

// The resumes table stores snake_case columns; the editor works in camelCase.
// Confirmed against the recovered match-jd function, which reads personal_info,
// education, internships, projects, skills and positions off the row.
//
// page_breaks is a pure serialization detail: the live table has a
// `page_breaks_is_array` check constraint (discovered by a real failed
// insert, not assumed), but the app's internal model is a per-section
// {sectionId: boolean} object because that's what the pagination code reads.
// Converting here means only this file needs to know the column is an array
// on disk — nothing else in the app is aware of the difference.
const breaksToArray = (obj) => Object.entries(obj || {}).filter(([, v]) => v).map(([k]) => k);
const breaksFromArray = (arr) => Object.fromEntries((arr || []).map((id) => [id, true]));

export function toRow(data) {
  return {
    personal_info: data.personalInfo,
    education: data.education,
    education_note: data.educationNote,
    internships: data.internships,
    projects: data.projects,
    skills: data.skills,
    areas: data.areas,
    positions: data.positions,
    extracurriculars: data.extracurriculars,
    page_breaks: breaksToArray(data.pageBreaks),
    section_visibility: data.sectionVisibility,
    layout_settings: data.layoutSettings,
    schema_version: data.schemaVersion,
  };
}

export function fromRow(row) {
  return {
    personalInfo: row.personal_info,
    education: row.education,
    educationNote: row.education_note,
    internships: row.internships,
    projects: row.projects,
    skills: row.skills,
    areas: row.areas,
    positions: row.positions,
    extracurriculars: row.extracurriculars,
    pageBreaks: breaksFromArray(row.page_breaks),
    sectionVisibility: row.section_visibility,
    layoutSettings: row.layout_settings,
    schemaVersion: row.schema_version,
  };
}
