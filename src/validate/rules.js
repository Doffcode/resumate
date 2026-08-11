// Format Check — the T&P "Resume Common Mistakes" rules as pure functions.
//
// Pure: (data, fill) in, findings out. No React, no network, no AI, no cost.
// Source: reference/Resume Common Mistakes.pdf
//
// status:
//   'fail'       something is wrong right now
//   'pass'       the rule applies and is satisfied
//   'guaranteed' cannot fail — the sealed renderer enforces it structurally
//   'advisory'   needs human judgement; we can only prompt

const FULL_NITT = 'National Institute of Technology, Tiruchirappalli';
const UNDERFULL = 70;

const TEXT_ITEM_SECTIONS = ['projects', 'internships', 'positions'];

// Every free-text string on the resume, with a label for where it came from.
function allText(data) {
  const out = [];
  const p = data.personalInfo;
  out.push(['Personal info', `${p.name} ${p.degree}`]);
  data.education.forEach((r) => out.push(['Education', `${r.degree} ${r.institution}`]));
  TEXT_ITEM_SECTIONS.forEach((sec) =>
    (data[sec] || []).forEach((i) =>
      out.push([sec, `${i.title} ${i.description} ${(i.bullets || []).join(' ')}`])
    )
  );
  (data.skills || []).forEach((s) => out.push(['Skills', `${s.label} ${s.value}`]));
  (data.areas || []).forEach((a) => out.push(['Areas of Interest', a.text]));
  ['sport', 'social'].forEach((k) =>
    (data.extracurriculars?.[k] || []).forEach((i) => out.push(['Extracurriculars', i.text]))
  );
  return out;
}

const isVisible = (data, id) => data.sectionVisibility?.[id] !== false;

export function runChecks(data, fill = []) {
  const items = [];
  const add = (o) => items.push(o);

  // --- Rule 11: CGPA format, no leading zeros -----------------------------
  const badGrades = data.education.filter((r) => /^0\d/.test((r.grade || '').trim()));
  add({
    id: 'cgpa-leading-zero',
    rule: 'Rule 11',
    title: 'CGPA format',
    status: badGrades.length ? 'fail' : 'pass',
    detail: badGrades.length
      ? `${badGrades.map((r) => r.grade).join(', ')} — drop the leading zero.`
      : 'No leading zeros.',
    fix: badGrades.length
      ? (rd) => badGrades.forEach((r) =>
          rd.setEducation(r.id, 'grade', r.grade.trim().replace(/^0+(?=\d)/, '')))
      : null,
  });

  // --- UPDATE 2: full institution name ------------------------------------
  const shortNitt = data.education.filter((r) =>
    /\bnit\b/i.test(r.institution || '') && !/national institute of technology/i.test(r.institution || '')
  );
  add({
    id: 'institution-name',
    rule: 'Update 2',
    title: 'Institution name written in full',
    status: shortNitt.length ? 'fail' : 'pass',
    detail: shortNitt.length
      ? `"${shortNitt[0].institution}" should be "${FULL_NITT}".`
      : 'Written in full.',
    fix: shortNitt.length
      ? (rd) => shortNitt.forEach((r) => rd.setEducation(r.id, 'institution', FULL_NITT))
      : null,
  });

  // --- UPDATE 3: legend wording -------------------------------------------
  const note = (data.educationNote || '').trim();
  const legendOk = /^\*\s*-\s*Upto\s+\d+(st|nd|rd|th)\s+semester$/i.test(note);
  const ordinal = note.match(/\d+(st|nd|rd|th)/i)?.[0];
  add({
    id: 'legend-format',
    rule: 'Update 3',
    title: 'Table legend wording',
    status: !note ? 'pass' : legendOk ? 'pass' : 'fail',
    detail: !note
      ? 'No legend used.'
      : legendOk
        ? 'Matches the required wording.'
        : `Should read "* - Upto ${ordinal || 'Nth'} semester".`,
    fix: !legendOk && note && ordinal ? (rd) => rd.setEducationNote(`* - Upto ${ordinal} semester`) : null,
  });

  // --- Rule 17: never write Nil; remove the section instead ----------------
  const nilHits = [];
  TEXT_ITEM_SECTIONS.concat(['areas']).forEach((sec) =>
    (data[sec] || []).forEach((i) => {
      const s = `${i.title || ''}${i.text || ''}`.trim();
      if (/^~?\s*nil\s*~?$/i.test(s)) nilHits.push({ sec, id: i.id });
    })
  );
  const emptyVisible = ['internships', 'projects', 'positions', 'areas', 'skills']
    .filter((id) => isVisible(data, id) && (data[id] || []).length === 0);
  add({
    id: 'no-nil-sections',
    rule: 'Rule 17',
    title: 'No empty or "Nil" sections',
    status: nilHits.length || emptyVisible.length ? 'fail' : 'pass',
    detail: nilHits.length
      ? 'An entry says "Nil" — delete it and hide the section instead.'
      : emptyVisible.length
        ? `${emptyVisible.join(', ')} ${emptyVisible.length === 1 ? 'is' : 'are'} shown but empty.`
        : 'No empty sections shown.',
    fix: emptyVisible.length && !nilHits.length
      ? (rd) => emptyVisible.forEach((id) => rd.toggleVisibility(id))
      : nilHits.length
        ? (rd) => nilHits.forEach((h) => rd.removeItem(h.sec, h.id))
        : null,
  });

  // --- Rule 14: no NIMCET rank --------------------------------------------
  const nimcet = allText(data).filter(([, t]) => /nimcet/i.test(t));
  add({
    id: 'no-nimcet',
    rule: 'Rule 14',
    title: 'No NIMCET rank',
    status: nimcet.length ? 'fail' : 'pass',
    detail: nimcet.length ? `Mentioned under ${nimcet[0][0]} — remove it.` : 'Not mentioned.',
    fix: null, // needs a human edit; we will not guess what to delete
  });

  // --- Rule 6: dates present and in a range -------------------------------
  // Accept every dash people realistically end up with, not just the three
  // obvious ones: Word and Google Docs autocorrect a typed "-" into en/em
  // dashes, and text pasted out of them can carry U+2010 hyphen, U+2011
  // non-breaking hyphen, U+2012 figure dash or U+2212 minus. Matching only
  // [-–—] flagged those as "not a range" when they were perfectly fine.
  const RANGE_SEPARATOR = /[-‐‑‒–—―−~]|\bto\b/i;
  const SECTION_LABEL = {
    internships: 'Internships',
    projects: 'Projects',
    positions: 'Positions of Responsibility',
  };

  const dateProblems = [];
  TEXT_ITEM_SECTIONS.forEach((sec) => {
    if (!isVisible(data, sec)) return;
    (data[sec] || []).forEach((i) => {
      const d = (i.date || '').trim();
      // Always name the section and the entry. A bare `Not a range: "Aug 2023"`
      // is unactionable — there's no way to tell which entry it means.
      const where = `${SECTION_LABEL[sec] || sec} → "${(i.title || '').trim() || 'untitled'}"`;
      if (!d) dateProblems.push(`${where} has no date`);
      else if (!RANGE_SEPARATOR.test(d)) dateProblems.push(`${where} has "${d}" (a single date, not a range)`);
    });
  });
  add({
    id: 'date-ranges',
    rule: 'Rule 6',
    title: 'Tenures given as a range',
    status: dateProblems.length ? 'fail' : 'pass',
    // Every offender, not just the first — and missing dates and non-ranges
    // are reported together instead of one hiding the other.
    detail: dateProblems.length
      ? `${dateProblems.join('; ')}. Use a range like "Jan 2026 - Mar 2026".`
      : 'All entries have a date range.',
    fix: null,
  });

  // --- Rule 13: skills entries complete -----------------------------------
  const halfSkills = (data.skills || []).filter((s) => !s.label?.trim() || !s.value?.trim());
  add({
    id: 'skills-complete',
    rule: 'Rule 13',
    title: 'Skills entries complete',
    status: isVisible(data, 'skills') && halfSkills.length ? 'fail' : 'pass',
    detail: halfSkills.length ? `${halfSkills.length} entry missing a category or its items.` : 'All entries complete.',
    fix: null,
  });

  // --- Rule 12: page 1 must not be half blank -----------------------------
  const underIdx = fill.findIndex((f, i) => i < fill.length - 1 && f < UNDERFULL);
  add({
    id: 'page-fill',
    rule: 'Rule 12',
    title: 'Pages filled before moving on',
    status: fill.length === 0 ? 'pass' : underIdx >= 0 ? 'fail' : 'pass',
    detail: underIdx >= 0
      ? `Page ${underIdx + 1} is only ${fill[underIdx]}% full — remove a page break or add content.`
      : 'No half-empty pages.',
    fix: null,
  });

  const overIdx = fill.findIndex((f) => f > 100);
  add({
    id: 'page-overflow',
    rule: 'Layout',
    title: 'No page overflows',
    status: overIdx >= 0 ? 'fail' : 'pass',
    detail: overIdx >= 0 ? `Page ${overIdx + 1} overflows its printable area.` : 'Everything fits.',
    fix: null,
  });

  // --- Structurally guaranteed by the sealed renderer ----------------------
  [
    ['Update 1', 'Black line touches both page borders'],
    ['Rule 3', 'Lato throughout; 18/14/11pt sizes'],
    ['Rule 1', 'Red section rules run to the right margin'],
    ['Rules 2 & 5', 'Uniform spacing between sections'],
    ['Rule 4', 'Photo fills its box (1.23in x 1.35in)'],
    ['Rule 16', 'Descriptions start with a capital letter'],
    ['Rule 18', 'Correct "Projects" / "Other Projects" heading'],
    ['Rule 8', 'Alignment and line spacing'],
  ].forEach(([rule, title], i) =>
    add({ id: `guaranteed-${i}`, rule, title, status: 'guaranteed', detail: 'Enforced by the template — cannot be got wrong.', fix: null })
  );

  // --- Needs a human ------------------------------------------------------
  add({
    id: 'own-words',
    rule: 'Rule 10',
    title: 'Written in your own words',
    status: 'advisory',
    detail: 'Descriptions pasted from ChatGPT get flagged. Read each one aloud and check it sounds like you.',
    fix: null,
  });
  add({
    id: 'tp-formals',
    rule: 'Rule 7',
    title: 'Photo in TP formals',
    status: 'advisory',
    detail: 'Formal shirt, plain background, face clearly visible.',
    fix: null,
  });

  const failCount = items.filter((i) => i.status === 'fail').length;
  const fixableCount = items.filter((i) => i.status === 'fail' && i.fix).length;
  return { items, failCount, fixableCount };
}
