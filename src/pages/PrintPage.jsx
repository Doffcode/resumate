import { allSections } from '../data/defaultResume.js';
import { migrate } from '../state/useResumeData.js';
import { useMeasure } from '../pagination/useMeasure.js';
import { ResumePages, MeasureArea } from '../resume/Resume.jsx';

// Auth-independent, no editor chrome. Two callers:
//   ?golden=1  — no injected data, renders the fixed default fixture. Used by
//                golden-check.mjs so the pixel-diff never depends on auth state.
//   ?print=1   — api/export-pdf.js injects a real, already-verified resume via
//                page.evaluateOnNewDocument before navigating here, so
//                Puppeteer never needs to hold a Supabase session at all.
// Both paths run through migrate() so partially-shaped data (or none) can
// never crash pagination — same shape-safety the live editor gets.
export default function PrintPage() {
  const injected = typeof window !== 'undefined' ? window.__RESUMATE_PRINT_DATA__ : null;
  const data = migrate(injected || {});
  const { pages, units, baseFontSize, contentRef, headerRef, unitRefs } = useMeasure(data, allSections);

  return (
    <div className="rm-print-root">
      <MeasureArea
        units={units}
        data={data}
        baseFontSize={baseFontSize}
        contentRef={contentRef}
        headerRef={headerRef}
        unitRefs={unitRefs}
      />
      <ResumePages pages={pages} data={data} baseFontSize={baseFontSize} />
    </div>
  );
}
