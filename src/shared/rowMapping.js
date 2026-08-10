// The resumes table stores snake_case columns; the app works in camelCase.
// Confirmed against the recovered match-jd function, which reads personal_info,
// education, internships, projects, skills and positions off the row.
//
// This file has NO import.meta.env or process.env coupling on purpose: it is
// imported both by the Vite client (src/lib/supabase.js) and by plain Node
// Vercel functions (api/export-pdf.js), which don't share an env-var
// mechanism. Keeping this isomorphic means the two can never drift apart.
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
