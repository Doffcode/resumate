// Sealed renderer — the frozen NIT Trichy placement layout.
//
// RULES FOR THIS DIRECTORY:
//   * Components take plain data as props and return markup. Nothing else.
//   * No editor state, no theme, no design system, no app awareness.
//   * The same components render the on-screen preview AND the server-side PDF,
//     which is what makes pixel parity structural instead of hand-maintained.
//   * Any change here must be verified with a pixel-diff against ../../golden/.
import { useLayoutEffect, useRef, useState } from 'react';
import defaultLogo from '../assets/nitt_logo.png';
import defaultPhoto from '../assets/student_photo.png';
import { capitalizeFirst, renderBold, renderOrdinals, resolveSectionTitle } from './text.jsx';

// A title+date header where the date normally sits flush-right on the same
// line (matches the frozen layout for the common case: a short title). When
// the title is long enough that sharing the line with the date pushes it to
// wrap, the date would otherwise stay stranded on line 1 while the title
// continues below it. This measures the rendered title after paint and, only
// if it actually wrapped under that constraint, switches to a layout where
// the date drops to its own left-aligned line directly under the title,
// instead of floating above it on line 1.
//
// One-directional by design: once wrapped is detected true, it is never
// reset back to false during this mount. Re-measuring the reverse (would it
// now fit unwrapped?) would require rendering the OTHER layout to check,
// which risks flip-flopping every render. A shorter edit that no longer
// needs the wrapped layout self-corrects on the next remount (e.g. reload).
function ItemHeader({ title, date }) {
  const titleRef = useRef(null);
  const dateRef = useRef(null);
  const [wrapped, setWrapped] = useState(false);

  useLayoutEffect(() => {
    if (wrapped) return;
    const titleEl = titleRef.current;
    const dateEl = dateRef.current;
    if (!titleEl || !dateEl) return;
    // A flex item is blockified by the flex layout spec, so its
    // getClientRects() always reports exactly one rect no matter how many
    // internal lines its text wraps to — line count isn't observable that
    // way. Compare rendered height against the date's instead: the date
    // never wraps (white-space: nowrap), so its one-line height is a stable
    // per-render reference that scales correctly with the current font size.
    const titleH = titleEl.getBoundingClientRect().height;
    const dateH = dateEl.getBoundingClientRect().height;
    if (titleH > dateH * 1.4) setWrapped(true);
  }, [title, date, wrapped]);

  return (
    <div className={`resume-item-header${wrapped ? ' resume-item-header--wrapped' : ''}`}>
      <span className="resume-item-title" ref={titleRef}>{title}</span>
      {wrapped
        ? <div className="resume-item-date">{date}</div>
        : <span className="resume-item-date" ref={dateRef}>{date}</span>}
    </div>
  );
}

export function Header({ data }) {
  const p = data.personalInfo;
  return (
    <>
      <div className="resume-header">
        <div className="resume-logo-container">
          <img className="resume-logo" src={p.logo || defaultLogo} alt="Institution Logo" />
        </div>
        <div className="resume-info">
          <div className="resume-name">{p.name}</div>
          <div className="resume-subname">{p.degree}</div>
          <div className="resume-details">
            <div className="resume-detail-line"><span className="resume-detail-label">Gender: </span><span>{p.gender}</span></div>
            <div className="resume-detail-line"><span className="resume-detail-label">Date of Birth: </span><span>{p.dob}</span></div>
            <div className="resume-detail-line"><span className="resume-detail-label">E-mail : </span><span>{p.email}</span></div>
            <div className="resume-detail-line"><span className="resume-detail-label">Contact : </span><span>{p.contact}</span></div>
          </div>
        </div>
        <div className="resume-photo-container">
          <img className="resume-photo" src={p.photo || defaultPhoto} alt="Student Photo" />
        </div>
      </div>
      <div className="header-divider-line"></div>
    </>
  );
}

export function SectionHeader({ sec, data }) {
  return (
    <div className="resume-section-header">
      <h2 className="resume-section-title">{resolveSectionTitle(sec, data)}</h2>
      <div className="resume-section-line"></div>
    </div>
  );
}

export function EducationTable({ data }) {
  return (
    <>
      <table className="resume-education-table">
        <thead>
          <tr>
            <th style={{ width: '17.6%' }}>Year</th>
            <th style={{ width: '25.7%' }}>Degree/Examination</th>
            <th>Institution/Board</th>
            <th style={{ width: '19.9%' }}>CGPA/Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.education.map((row) => (
            <tr key={row.id}>
              <td>{row.year}</td>
              <td>{row.degree}</td>
              <td>{row.institution}</td>
              <td>{row.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.educationNote && (
        <div className="resume-education-note">{renderOrdinals(data.educationNote)}</div>
      )}
    </>
  );
}

export function Item({ sec, item }) {
  if (sec.type === 'areas') {
    return <div className="resume-item"><span>{renderBold(capitalizeFirst(item.text))}</span></div>;
  }
  if (sec.type === 'skills') {
    return (
      <div className="resume-skill-item">
        <span className="resume-skill-label">{item.label}</span>
        {item.label && item.value && <span> : </span>}
        <span>{renderBold(item.value)}</span>
      </div>
    );
  }
  // projects / internships / positions
  const bullets = (item.bullets || []).filter((b) => b.trim());
  return (
    <div className="resume-item">
      <ItemHeader title={item.title} date={item.date} />
      {item.description && <div className="resume-item-desc">{renderBold(capitalizeFirst(item.description))}</div>}
      {bullets.length > 0 && (
        <div className="resume-item-bullets">
          {bullets.map((b, bi) => (
            <div className="resume-item" key={bi}><span>{renderBold(capitalizeFirst(b))}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

// One Sports / Social subsection of Extracurricular Activities.
export function Subblock({ data, subType }) {
  const isSport = subType === 'sport';
  const items = isSport ? data.extracurriculars.sport : data.extracurriculars.social;
  if (items.length === 0) return null;
  return (
    <>
      <div className="resume-subheading">{isSport ? 'Sports Activities:' : 'Social Activities:'}</div>
      <div className="resume-items-container" style={{ gap: '0.2em', marginBottom: '0.5em' }}>
        {items.map((item) => (
          <div className="resume-item" key={item.id}><span>{renderBold(capitalizeFirst(item.text))}</span></div>
        ))}
      </div>
    </>
  );
}

export function Footer({ data, innerRef }) {
  return (
    <div className="resume-footer" ref={innerRef}>
      <div className="resume-footer-text"><div>{data.footer.line1}</div></div>
      <div className="resume-footer-blue-row">
        <div className="resume-footer-blue"></div>
        <div className="resume-footer-blue"></div>
      </div>
      <div className="resume-footer-text"><div>{data.footer.line2}</div></div>
    </div>
  );
}

// Renders a single pagination unit. Items are looked up from live data by id so
// a stale unit reference can never render stale content.
export function Unit({ u, data }) {
  if (u.kind === 'sectionHeader') return <SectionHeader sec={u.sec} data={data} />;
  if (u.kind === 'block') {
    return (
      <>
        <SectionHeader sec={u.sec} data={data} />
        {u.sec.type === 'education' && <EducationTable data={data} />}
      </>
    );
  }
  if (u.kind === 'subblock') return <Subblock data={data} subType={u.subType} />;
  const fresh = (data[u.sec.id] || []).find((i) => i.id === u.item.id);
  return <Item sec={u.sec} item={fresh || u.item} />;
}

export const unitTypeClass = (u) => {
  if (u.kind === 'sectionHeader') return 'unit-sechead';
  if (u.kind === 'subblock') return 'unit-subblock';
  if (u.kind === 'block') return 'unit-block';
  return 'unit-item';
};
