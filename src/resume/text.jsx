// Display-only text helpers shared by the sealed renderer.
// Guide rule #16: the first letter of every description must be capitalised.
export const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
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
