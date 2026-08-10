import { useState } from 'react';
import { defaultResume, allSections } from './data/defaultResume.js';
import { useMeasure } from './pagination/useMeasure.js';
import { ResumePages, MeasureArea } from './resume/Resume.jsx';

// Phase 1: preview only. The editor UI lands next; the point of this shell is
// that the sealed renderer reproduces the golden reference exactly.
export default function App() {
  const [data] = useState(defaultResume);
  const { pages, units, baseFontSize, contentRef, headerRef, unitRefs } = useMeasure(data, allSections);

  return (
    <div className="preview-root">
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
