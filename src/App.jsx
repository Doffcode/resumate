import { useState, useEffect } from 'react';
import { allSections } from './data/defaultResume.js';
import { useResumeData } from './state/useResumeData.js';
import { useMeasure } from './pagination/useMeasure.js';
import { ResumePages, MeasureArea } from './resume/Resume.jsx';
import Editor from './editor/Editor.jsx';
import { Icon, icons } from './editor/controls.jsx';
import FormatCheck, { useFormatCheck } from './editor/FormatCheck.jsx';
import AiPanel from './ai/AiPanel.jsx';
import './editor/editor.css';

// Repaginating on every keystroke is wasteful; the preview settles 400ms after
// typing stops. The editor fields themselves stay fully responsive.
function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Guide rule #12: "first page should not be half blank".
const UNDERFULL = 70;

export default function App() {
  const rd = useResumeData();
  const preview = useDebounced(rd.data, 400);
  const { pages, units, fill, baseFontSize, contentRef, headerRef, unitRefs } = useMeasure(preview, allSections);
  const [zoom, setZoom] = useState(100);
  const [panel, setPanel] = useState('check'); // 'check' | 'ai' | null
  // Checks run against live data, not the debounced copy, so a fix reads as instant.
  const check = useFormatCheck(rd.data, fill);

  const overflowing = fill.findIndex((f) => f > 100);
  const underfull = fill.findIndex((f, i) => i < fill.length - 1 && f < UNDERFULL);

  return (
    <div className="rm-app">
      <header className="rm-topbar">
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
        <div className="rm-sep" />
        <div className="rm-saved">
          <span className="rm-dot" />
          {rd.savedAt ? 'Saved' : 'Saving…'}
        </div>
        <div className="rm-spacer" />
        <button
          className={`rm-btn rm-btn-ghost${check.failCount ? ' rm-has-issues' : ''}`}
          onClick={() => setPanel((p) => (p === 'check' ? null : 'check'))}
        >
          <Icon d={icons.check} />
          Format Check
          {check.failCount > 0 && <span className="rm-pip">{check.failCount}</span>}
        </button>
        <button
          className={`rm-btn rm-btn-ghost${panel === 'ai' ? ' rm-has-issues' : ''}`}
          onClick={() => setPanel((p) => (p === 'ai' ? null : 'ai'))}
        >
          <Icon d={icons.spark} />
          AI Assistant
        </button>
        <button className="rm-btn rm-btn-secondary" onClick={() => window.print()}>
          <Icon d={icons.download} />
          Export PDF
        </button>
      </header>

      <div className="rm-workspace">
        <Editor rd={rd} />

        <section className="rm-preview">
          <div className="rm-preview-bar">
            <div className="rm-pill">
              <button onClick={() => setZoom((z) => Math.max(50, z - 10))} aria-label="Zoom out">−</button>
              <span className="rm-zoomval">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(160, z + 10))} aria-label="Zoom in">+</button>
            </div>
            <span className="rm-pagelabel">{pages.length} page{pages.length === 1 ? '' : 's'} · A4</span>
            <div className="rm-spacer" />
            {overflowing >= 0 && (
              <div className="rm-warn">
                <Icon d={icons.warn} size={14} />
                Page {overflowing + 1} overflows — add a page break
              </div>
            )}
            {overflowing < 0 && underfull >= 0 && (
              <div className="rm-warn">
                <Icon d={icons.warn} size={14} />
                Page {underfull + 1} is only {fill[underfull]}% full — remove a break or add content
              </div>
            )}
          </div>

          <div className="rm-canvas">
            <MeasureArea
              units={units}
              data={preview}
              baseFontSize={baseFontSize}
              contentRef={contentRef}
              headerRef={headerRef}
              unitRefs={unitRefs}
            />
            <div className="rm-pages">
              <div className="rm-scaler" style={{ transform: `scale(${zoom / 100})` }}>
                <ResumePages pages={pages} data={preview} baseFontSize={baseFontSize} />
              </div>
            </div>
          </div>
        </section>

        <FormatCheck result={check} rd={rd} open={panel === 'check'} onClose={() => setPanel(null)} />
        <AiPanel rd={rd} resumeId={null} open={panel === 'ai'} onClose={() => setPanel(null)} />
      </div>
    </div>
  );
}
