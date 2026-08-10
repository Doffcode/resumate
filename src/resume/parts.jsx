// Sealed renderer — the frozen NIT Trichy placement layout.
//
// RULES FOR THIS DIRECTORY:
//   * Components take plain data as props and return markup. Nothing else.
//   * No editor state, no theme, no design system, no app awareness.
//   * The same components render the on-screen preview AND the server-side PDF,
//     which is what makes pixel parity structural instead of hand-maintained.
//   * Any change here must be verified with a pixel-diff against ../../golden/.
import defaultLogo from '../assets/nitt_logo.png';
import defaultPhoto from '../assets/student_photo.png';
import { capitalizeFirst, renderOrdinals, resolveSectionTitle } from './text.jsx';

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
    return <div className="resume-item"><span>{capitalizeFirst(item.text)}</span></div>;
  }
  if (sec.type === 'skills') {
    return (
      <div className="resume-skill-item">
        <span className="resume-skill-label">{item.label}</span>
        {item.label && item.value && <span> : </span>}
        <span>{item.value}</span>
      </div>
    );
  }
  // projects / internships / positions
  const bullets = (item.bullets || []).filter((b) => b.trim());
  return (
    <div className="resume-item">
      <div className="resume-item-header">
        <span className="resume-item-title">{item.title}</span>
        <span className="resume-item-date">{item.date}</span>
      </div>
      {item.description && <div className="resume-item-desc">{capitalizeFirst(item.description)}</div>}
      {bullets.length > 0 && (
        <div className="resume-item-bullets">
          {bullets.map((b, bi) => (
            <div className="resume-item" key={bi}><span>{capitalizeFirst(b)}</span></div>
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
          <div className="resume-item" key={item.id}><span>{capitalizeFirst(item.text)}</span></div>
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
