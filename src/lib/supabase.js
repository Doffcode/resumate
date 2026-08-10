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
    page_breaks: data.pageBreaks,
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
    pageBreaks: row.page_breaks,
    sectionVisibility: row.section_visibility,
    layoutSettings: row.layout_settings,
    schemaVersion: row.schema_version,
  };
}
