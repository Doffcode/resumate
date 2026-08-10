import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { buildUnits, paginate, staticPaginate, pagesSignature } from './paginate.js';

// Measures every unit's rendered height and recomputes pagination.
// Returns the refs the MeasureArea needs plus the resulting pages.
export function useMeasure(data, allSections) {
  const baseFontSize = data.layoutSettings?.baseFontSize || 16;
  const units = buildUnits(data, allSections);

  const [pages, setPages] = useState(() => staticPaginate(data, allSections));
  const [fill, setFill] = useState([]);
  const [fontTick, setFontTick] = useState(0);

  const contentRef = useRef(null);
  const headerRef = useRef(null);
  const unitRefs = useRef([]);

  // Web fonts change metrics after first paint; re-measure once they land.
  useEffect(() => {
    let mounted = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (mounted) setFontTick((t) => t + 1); });
    }
    return () => { mounted = false; };
  }, []);

  useLayoutEffect(() => {
    const effUnits = buildUnits(data, allSections);
    const contentAvailable = contentRef.current ? contentRef.current.offsetHeight : 0;
    const headerH = headerRef.current ? headerRef.current.offsetHeight : 0;

    const contentHeights = effUnits.map((_, i) => {
      const el = unitRefs.current[i];
      return el ? el.getBoundingClientRect().height : 0;
    });
    const margins = effUnits.map((_, i) => {
      const el = unitRefs.current[i];
      return el ? parseFloat(getComputedStyle(el).marginTop) || 0 : 0;
    });

    // The footer is absolutely positioned, so it does not consume flow space —
    // units may use the full content box. Page 1 only has the header taken out.
    const next = paginate(
      effUnits,
      contentHeights,
      margins,
      contentAvailable - headerH,
      contentAvailable
    );

    setPages((prev) => (pagesSignature(prev) === pagesSignature(next) ? prev : next));

    // Fill ratio per page, rounded so float jitter cannot loop this effect.
    const nextFill = next.map((p) =>
      p.available > 0 ? Math.round((p.used / p.available) * 100) : 0
    );
    setFill((prev) => (prev.join() === nextFill.join() ? prev : nextFill));
  }, [data, baseFontSize, fontTick, allSections]);

  return { pages, units, fill, baseFontSize, contentRef, headerRef, unitRefs };
}
