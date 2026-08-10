// Page assembly for the sealed renderer.
//
// ResumePages renders the real A4 pages. MeasureArea renders the identical
// markup off-screen so measured heights match rendered heights exactly — the
// same components, never a second implementation.
import { Header, Footer, Unit, unitTypeClass } from './parts.jsx';
import './resume.css';

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
