import { useState, useEffect } from 'react';
import { allSections } from '../data/defaultResume.js';
import { useResumeData } from '../state/useResumeData.js';
import { useMeasure } from '../pagination/useMeasure.js';
import { ResumePages, MeasureArea } from '../resume/Resume.jsx';
import Editor from '../editor/Editor.jsx';
import { Icon, icons } from '../editor/controls.jsx';
import FormatCheck, { useFormatCheck } from '../editor/FormatCheck.jsx';
import AiPanel from '../ai/AiPanel.jsx';
import { exportPdf } from '../lib/exportPdf.js';

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

export default function EditorPage({ resumeId, onBack }) {
  const rd = useResumeData(resumeId);
  const preview = useDebounced(rd.data, 400);
  const { pages, units, fill, baseFontSize, contentRef, headerRef, unitRefs } = useMeasure(preview, allSections);
  const [zoom, setZoom] = useState(100);
  const [panel, setPanel] = useState('check'); // 'check' | 'ai' | null
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setExportNotice(null);
    const result = await exportPdf(resumeId);
    setExporting(false);
    if (result.status === 'error') {
      setExportNotice({ kind: 'error', text: result.message });
    } else if (result.status === 'fallback') {
      setExportNotice({ kind: 'warn', text: `Used your browser's print dialog instead — ${result.reason}` });
    }
  };
  // Checks run against live data, not the debounced copy, so a fix reads as instant.
  const check = useFormatCheck(rd.data, fill);

  const overflowing = fill.findIndex((f) => f > 100);
  const underfull = fill.findIndex((f, i) => i < fill.length - 1 && f < UNDERFULL);

  if (rd.loading) {
    return <div className="rm-app"><div className="rm-page-loading">Loading resume…</div></div>;
  }
  if (rd.loadError) {
    return (
      <div className="rm-app">
        <div className="rm-page-loading">
          <p>Couldn't load this resume: {rd.loadError}</p>
          {onBack && <button className="rm-btn rm-btn-secondary" onClick={onBack}>Back to dashboard</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="rm-app">
      <header className="rm-topbar">
        {onBack && (
          <button className="rm-iconbtn" onClick={onBack} title="Back to dashboard">
            <Icon d={icons.back} size={16} />
          </button>
        )}
        <button
          className="rm-iconbtn rm-drawer-toggle"
          onClick={() => setMobileSidebarOpen((o) => !o)}
          title="Toggle sections"
        >
          <Icon d={icons.menu} size={16} />
        </button>
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
        <div className="rm-sep" />
        <div className="rm-saved">
          <span className="rm-dot" />
          {rd.guestMode ? 'Saved on this device only' : rd.savedAt ? 'Saved' : 'Saving…'}
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
        <button className="rm-btn rm-btn-secondary" onClick={handleExport} disabled={exporting}>
          <Icon d={icons.download} />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </header>

      {exportNotice && (
        <div className={`rm-notice${exportNotice.kind === 'error' ? ' is-error' : ''}`} style={{ margin: '0 14px', marginTop: 8 }}>
          {exportNotice.text}
          <button className="rm-btn rm-btn-ghost" style={{ height: 22, padding: '0 6px', marginLeft: 8 }} onClick={() => setExportNotice(null)}>Dismiss</button>
        </div>
      )}

      <div className="rm-workspace">
        <Editor rd={rd} mobileOpen={mobileSidebarOpen} />
        {mobileSidebarOpen && (
          <div className="rm-drawer-backdrop" onClick={() => setMobileSidebarOpen(false)} />
        )}

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
        <AiPanel rd={rd} resumeId={resumeId} open={panel === 'ai'} onClose={() => setPanel(null)} />
      </div>
    </div>
  );
}
