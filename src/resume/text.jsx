// Display-only text helpers shared by the sealed renderer.
// Guide rule #16: the first letter of every description must be capitalised.
// Matches the first LETTER rather than assuming index 0 is it, so a leading
// **bold** marker (see renderBold below) doesn't get capitalised itself.
export const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.replace(/[a-zA-Z]/, (c) => c.toUpperCase());
};

// Renders **bold** markers (added by the editor's Bold button) as <strong>.
// Apply after capitalizeFirst — operates on the same plain string and only
// changes how already-typed ** pairs render, never introduces its own.
export const renderBold = (text) => {
  if (!text) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    return m ? <strong key={i}>{m[1]}</strong> : part;
  });
};

// Renders ordinals as superscripts: "1st semester" -> 1<sup>st</sup> semester.
export const renderOrdinals = (text) => {
  if (!text) return text;
  const parts = [];
  const re = /(\d+)(st|nd|rd|th)\b/gi;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index));
    parts.push(m[1]);
    parts.push(<sup key={m.index}>{m[2]}</sup>);
    last = re.lastIndex;
  }
  parts.push(text.slice(last));
  return parts;
};

// Guide rule #18: "Other Projects" only when the resume also shows internship or
// work experience. With neither, the heading must read "Projects".
export const resolveSectionTitle = (sec, data) => {
  if (sec.id !== 'projects') return sec.title;
  const showsInternships =
    data.sectionVisibility?.internships !== false && (data.internships || []).length > 0;
  return showsInternships ? 'Other Projects' : 'Projects';
};
