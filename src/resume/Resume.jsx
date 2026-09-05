// Page assembly for the sealed renderer.
//
// ResumePages renders the real A4 pages. MeasureArea renders the identical
// markup off-screen so measured heights match rendered heights exactly — the
// same components, never a second implementation.
import { Header, Footer, Unit, unitTypeClass } from './parts.jsx';
import './resume.css';

// Areas of Interest is the one section with a user-adjustable item spacing
// (data.layoutSettings.areasLineSpacing). Every other section keeps the
// fixed spacing in resume.css's .page-unit.unit-item rule. Returns undefined
// (no inline override) for anything else, or when unset, so the CSS default
// applies exactly as before.
function unitStyle(u, data) {
  if (u.kind === 'item' && u.sec.type === 'areas') {
    const spacing = data.layoutSettings?.areasLineSpacing;
    if (spacing != null) return { marginTop: `${spacing}em` };
  }
  return undefined;
}

export function ResumePages({ pages, data, baseFontSize = 16 }) {
  return (
    <>
      {pages.map((page, pi) => (
        <div className="resume-page" key={pi} style={{ fontSize: `${baseFontSize}px` }}>
          {page.isFirstPage && <Header data={data} />}
          <div className="page-body">
            {page.units.map((u, ui) => (
              <div
                className={`page-unit ${unitTypeClass(u)} ${ui === 0 ? 'first-on-page' : ''}`}
                key={`${u.kind}-${u.sec.id}-${u.item ? u.item.id : u.subType || 'section'}`}
                style={unitStyle(u, data)}
              >
                <Unit u={u} data={data} />
              </div>
            ))}
          </div>
          <Footer data={data} />
        </div>
      ))}
    </>
  );
}

export function MeasureArea({ units, data, baseFontSize = 16, contentRef, headerRef, unitRefs }) {
  return (
    <div className="resume-measure" style={{ fontSize: `${baseFontSize}px` }}>
      <div className="measure-page">
        <div className="measure-content" ref={contentRef}>
          <div className="measure-unit" ref={headerRef}><Header data={data} /></div>
          {units.map((u, i) => (
            <div
              className={`measure-unit ${unitTypeClass(u)}`}
              key={i}
              style={unitStyle(u, data)}
              ref={(el) => { if (el) unitRefs.current[i] = el; }}
            >
              <Unit u={u} data={data} />
            </div>
          ))}
          <Footer data={data} />
        </div>
      </div>
    </div>
  );
}
