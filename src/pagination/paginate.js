// Pure pagination. No React, no DOM, no hidden state — units and measured
// heights in, pages out. Ported from the verified prototype.

// data -> ordered list of splittable units.
export function buildUnits(data, allSections) {
  const units = [];
  const hasContent = (sec) => {
    if (sec.type === 'education') return data.education.length > 0;
    if (sec.type === 'areas') return data.areas.length > 0;
    if (sec.type === 'skills') return data.skills.length > 0;
    if (sec.type === 'extracurriculars') {
      return data.extracurriculars.social.length + data.extracurriculars.sport.length > 0;
    }
    return (data[sec.id] || []).length > 0;
  };

  allSections.forEach((sec) => {
    if (data.sectionVisibility?.[sec.id] === false) return;
    if (!hasContent(sec)) return;
    const breakBefore = !!data.pageBreaks?.[sec.id];

    // Education is a table -> keep atomic. Everything else splits so content
    // flows item-by-item and each entry can start its own page.
    if (sec.type === 'education') {
      units.push({ kind: 'block', sec, breakBefore });
    } else if (sec.type === 'extracurriculars') {
      units.push({ kind: 'sectionHeader', sec, breakBefore });
      if (data.extracurriculars.sport.length > 0) {
        units.push({ kind: 'subblock', sec, subType: 'sport', breakBefore: !!data.extracurriculars.sportBreak });
      }
      if (data.extracurriculars.social.length > 0) {
        units.push({ kind: 'subblock', sec, subType: 'social', breakBefore: !!data.extracurriculars.socialBreak });
      }
    } else {
      // areas / skills / projects / internships / positions
      units.push({ kind: 'sectionHeader', sec, breakBefore });
      (data[sec.id] || []).forEach((item) => {
        units.push({ kind: 'item', sec, item, breakBefore: !!item.pageBreak });
      });
    }
  });
  return units;
}

// Fills pages greedily from measured unit content heights + top margins.
// contentHeights[i] is the unit's own box height (no margin); margins[i] is the
// unit's top margin. A unit starting a page drops its top margin (first-on-page
// CSS), exactly matching the render. A unit moves to a new page when an explicit
// break is set, when it overflows, or when a section header would be orphaned.
export function paginate(units, contentHeights, margins, availableFirst, available) {
  const n = units.length;
  const pages = [];
  let cur = { isFirstPage: true, units: [] };
  let used = 0;
  let suppressNextBreak = false;
  const availFor = (isFirst) => (isFirst ? availableFirst : available);

  units.forEach((u, i) => {
    const h = Math.max(contentHeights[i] || 0, 1);
    const mt = margins[i] || 0;
    const suppressBreak = suppressNextBreak;
    suppressNextBreak = false;

    if (cur.units.length > 0) {
      let breakNow = (!!u.breakBefore && !suppressBreak) || used + mt + h > availFor(cur.isFirstPage);
      if (u.kind === 'sectionHeader') {
        const next = units[i + 1];
        const nextH = i < n - 1 ? Math.max(contentHeights[i + 1] || 0, 1) : 0;
        const nextMt = i < n - 1 ? margins[i + 1] || 0 : 0;
        // Keep the header with its first item: break if the first item has an
        // explicit break, or if header + first item would not both fit.
        if ((next && next.breakBefore) || used + mt + h + nextMt + nextH > availFor(cur.isFirstPage)) {
          breakNow = true;
        }
      }
      if (breakNow) {
        cur.used = used;
        cur.available = availFor(cur.isFirstPage);
        pages.push(cur);
        cur = { isFirstPage: false, units: [] };
        used = 0;
        suppressNextBreak = u.kind === 'sectionHeader';
      }
    }

    cur.units.push(u);
    used += cur.units.length === 1 ? h : mt + h;
  });

  if (cur.units.length > 0) {
    cur.used = used;
    cur.available = availFor(cur.isFirstPage);
    pages.push(cur);
  }
  if (pages.length === 0) pages.push({ isFirstPage: true, units: [] });

  // When a section's items continue onto the next page, repeat its heading at
  // the top of that page so the continuation is anchored (no orphaned items).
  let prevSecId = null;
  for (const page of pages) {
    const first = page.units[0];
    if (first && (first.kind === 'item' || first.kind === 'subblock') && prevSecId === first.sec.id) {
      page.units.unshift({ kind: 'sectionHeader', sec: first.sec, breakBefore: false, isContinuation: true });
    }
    const last = page.units[page.units.length - 1];
    prevSecId = last ? last.sec.id : null;
  }
  return pages;
}

// First-paint fallback: group each section onto one page (respecting section
// page breaks) before measured heights are available.
export function staticPaginate(data, allSections) {
  const units = buildUnits(data, allSections);
  const pages = [];
  let cur = { isFirstPage: true, units: [] };
  units.forEach((u) => {
    if (u.breakBefore && cur.units.length > 0) {
      pages.push(cur);
      cur = { isFirstPage: false, units: [] };
    }
    cur.units.push(u);
  });
  if (cur.units.length > 0) pages.push(cur);
  if (pages.length === 0) pages.push({ isFirstPage: true, units: [] });
  return pages;
}

// Stable signature used to skip no-op pagination state updates.
export const pagesSignature = (pages) =>
  JSON.stringify(
    pages.map((p) => p.units.map((u) => [u.kind, u.sec.id, u.item ? u.item.id : u.subType || 'section']))
  );
