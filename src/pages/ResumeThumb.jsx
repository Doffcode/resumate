import { useEffect, useMemo, useRef, useState } from 'react';
import { allSections } from '../data/defaultResume.js';
import { migrate } from '../state/useResumeData.js';
import { fromRow } from '../lib/supabase.js';
import { staticPaginate } from '../pagination/paginate.js';
import { ResumePages } from '../resume/Resume.jsx';

// A real, scaled-down render of the student's actual resume for the
// dashboard card — real logo, real photo, real content.
//
// It reuses the sealed renderer rather than reimplementing a "preview"
// (the previous version drew a fake mini page with invented grey bars,
// which is why cards had no logo or photo in them and all looked alike).
//
// Two deliberate choices:
//   * staticPaginate(), not useMeasure() — useMeasure does a real DOM
//     measure/layout pass per resume, which would mean one per card on
//     every dashboard render. staticPaginate is pure and good enough here
//     because only the top of page 1 is ever visible.
//   * The sheet is rendered at full size and CSS-scaled, so the renderer is
//     consumed exactly as-is. src/resume/** is never modified, which is what
//     keeps the golden PDF reference safe by construction.
//
// An A4 sheet is 210mm wide = 793.7px at the 96dpi CSS reference the sealed
// renderer is built against. Scaling by (frame width / this) makes the sheet
// exactly fill the card at any size.
const SHEET_PX = 793.7;

// The scale is measured rather than expressed in CSS. The obvious-looking
// `transform: scale(calc(100cqw / 793.7))` does NOT work: dividing a length
// by a number yields a length, and scale() needs a unitless number, so the
// whole transform is dropped as invalid (confirmed in a browser — computed
// style came back `none`). A ResizeObserver keeps it correct and fluid.
export default function ResumeThumb({ row }) {
  const data = useMemo(() => migrate(fromRow(row)), [row]);
  const pages = useMemo(() => staticPaginate(data, allSections), [data]);
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const apply = () => setScale(el.clientWidth / SHEET_PX);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // aria-hidden + pointer-events:none — this is decorative. The card's own
    // button owns the click and the accessible name.
    // NB: not `.rm-thumb` — that class is already the toggle-switch knob.
    <div className="rm-thumb-frame" ref={frameRef} aria-hidden="true">
      {/* Held back until measured, so it can't flash at full A4 size first. */}
      <div className="rm-thumb-sheet" style={{ transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}>
        <ResumePages
          pages={pages.slice(0, 1)}
          data={data}
          baseFontSize={data.layoutSettings?.baseFontSize || 16}
        />
      </div>
    </div>
  );
}
