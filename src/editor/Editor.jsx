import { useState } from 'react';
import { allSections } from '../data/defaultResume.js';
import { LIMITS } from '../state/useResumeData.js';
import { resolveSectionTitle } from '../resume/text.jsx';
import { fileToResizedDataUrl, PhotoError } from '../lib/photo.js';
import defaultPhoto from '../assets/student_photo.png';
import { Icon, icons, Switch, Field, IconBtn, Breaker, AddButton, ItemControls } from './controls.jsx';

const ITEM_SECTIONS = ['internships', 'projects', 'positions'];

export default function Editor({ rd, mobileOpen }) {
  const { data } = rd;
  const [open, setOpen] = useState({ personalInfo: true, projects: true });
  const [photoError, setPhotoError] = useState(null);
  const toggleOpen = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const handlePhoto = async (file) => {
    if (!file) return;
    setPhotoError(null);
    try {
      rd.setPersonal('photo', await fileToResizedDataUrl(file));
    } catch (e) {
      setPhotoError(e instanceof PhotoError ? e.message : 'Could not use that image.');
    }
  };

  const countFor = (sec) => {
    if (sec.type === 'extracurriculars') {
      return data.extracurriculars.sport.length + data.extracurriculars.social.length;
    }
    return (data[sec.id] || []).length;
  };

  return (
    <aside className={`rm-editor${mobileOpen ? ' is-open' : ''}`}>
      <div className="rm-editor-head">
        <h2>Sections</h2>
        <button className="rm-btn rm-btn-ghost" style={{ height: 26, padding: '0 8px', fontSize: 12.5 }} onClick={rd.reset}>
          Reset
        </button>
      </div>

      <div className="rm-editor-scroll">
        {/* Personal info is always present — it is the header, not a section. */}
        <div className={`rm-section${open.personalInfo ? ' is-open' : ''}`}>
          <div className="rm-sec-head" onClick={() => toggleOpen('personalInfo')}>
            <span className="rm-sec-name">Personal Info</span>
            <Icon d={icons.chevron} size={14} className="rm-chevron" />
          </div>
          {open.personalInfo && (
            <div className="rm-sec-body">
              <Field label="Full name" value={data.personalInfo.name} onChange={(v) => rd.setPersonal('name', v)} />
              <Field label="Degree / Title" value={data.personalInfo.degree} onChange={(v) => rd.setPersonal('degree', v)} />
              <div className="rm-row">
                <Field label="Gender" value={data.personalInfo.gender} onChange={(v) => rd.setPersonal('gender', v)} />
                <Field label="Date of birth" value={data.personalInfo.dob} onChange={(v) => rd.setPersonal('dob', v)} />
              </div>
              <div className="rm-row">
                <Field label="E-mail" value={data.personalInfo.email} onChange={(v) => rd.setPersonal('email', v)} />
                <Field label="Contact" value={data.personalInfo.contact} onChange={(v) => rd.setPersonal('contact', v)} />
              </div>
              <div className="rm-field">
                <label>Passport photo</label>
                <div className="rm-photo-row">
                  <img className="rm-photo-preview" src={data.personalInfo.photo || defaultPhoto} alt="" />
                  <div className="rm-photo-actions">
                    <label className="rm-photo-btn">
                      {data.personalInfo.photo ? 'Change photo' : 'Upload photo'}
                      <input type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} />
                    </label>
                    {data.personalInfo.photo && (
                      <button className="rm-link" onClick={() => rd.setPersonal('photo', '')}>Remove</button>
                    )}
                  </div>
                </div>
                {photoError && <div className="rm-notice is-error" style={{ marginTop: 8 }}>{photoError}</div>}
                <div className="rm-hint">
                  Cropped to the official box automatically. Use a formal photo in TP formals (rules 4 and 7).
                </div>
              </div>

              <div className="rm-hint">Logo, fonts and spacing are locked to the official NIT Trichy format.</div>
            </div>
          )}
        </div>

        {allSections.map((sec) => {
          const visible = data.sectionVisibility[sec.id] !== false;
          const isOpen = !!open[sec.id];
          const count = countFor(sec);
          return (
            <div key={sec.id} className={`rm-section${isOpen ? ' is-open' : ''}${visible ? '' : ' is-off'}`}>
              <div className="rm-sec-head" onClick={() => toggleOpen(sec.id)}>
                <span className="rm-sec-name">{resolveSectionTitle(sec, data)}</span>
                <span className="rm-count">{visible ? count : 'hidden'}</span>
                <Switch
                  checked={visible}
                  onChange={() => rd.toggleVisibility(sec.id)}
                  label={`Show ${sec.title} on the resume`}
                />
                <Icon d={icons.chevron} size={14} className="rm-chevron" />
              </div>

              {isOpen && (
                <div className="rm-sec-body">
                  {!visible && <div className="rm-hint">Hidden from the PDF. Turn it on to include it.</div>}

                  {visible && (
                    <>
                      <Breaker
                        on={!!data.pageBreaks[sec.id]}
                        onToggle={() => rd.toggleSectionBreak(sec.id)}
                        title="Start section on a new page"
                      />

                      {sec.type === 'education' && <EducationEditor rd={rd} />}
                      {ITEM_SECTIONS.includes(sec.id) && <ItemListEditor rd={rd} secId={sec.id} />}
                      {sec.id === 'areas' && <AreasEditor rd={rd} />}
                      {sec.id === 'skills' && <SkillsEditor rd={rd} />}
                      {sec.type === 'extracurriculars' && <ExtrasEditor rd={rd} />}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function EducationEditor({ rd }) {
  const rows = rd.data.education;
  return (
    <>
      {rows.map((row, i) => (
        <div className="rm-item" key={row.id}>
          <div className="rm-item-head">
            <span className="rm-item-title">{row.year || 'Year'} · {row.degree || 'Degree'}</span>
            <ItemControls
              isFirst={i === 0}
              isLast={i === rows.length - 1}
              onUp={() => rd.moveItem('education', row.id, -1)}
              onDown={() => rd.moveItem('education', row.id, 1)}
              onDelete={() => rd.removeEducation(row.id)}
            />
          </div>
          <div className="rm-row">
            <Field label="Year" value={row.year} onChange={(v) => rd.setEducation(row.id, 'year', v)} />
            <Field label="CGPA / %" value={row.grade} onChange={(v) => rd.setEducation(row.id, 'grade', v)} />
          </div>
          <Field label="Degree / Examination" value={row.degree} onChange={(v) => rd.setEducation(row.id, 'degree', v)} />
          <Field label="Institution / Board" value={row.institution} onChange={(v) => rd.setEducation(row.id, 'institution', v)} />
        </div>
      ))}
      <AddButton onClick={rd.addEducation} disabled={rows.length >= LIMITS.education}>Add row</AddButton>
      <Field label="Legend below the table" value={rd.data.educationNote} onChange={rd.setEducationNote} />
      <div className="rm-hint">Ordinals render as superscript automatically, e.g. 2nd.</div>
    </>
  );
}

function ItemListEditor({ rd, secId }) {
  const items = rd.data[secId];
  const limit = LIMITS[secId];
  return (
    <>
      {items.map((item, i) => (
        <div key={item.id}>
          {i > 0 && (
            <Breaker on={!!item.pageBreak} onToggle={() => rd.toggleItemBreak(secId, item.id)} />
          )}
          <div className="rm-item">
            <div className="rm-item-head">
              <span className="rm-item-title">{item.title || 'Untitled'}</span>
              <ItemControls
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onUp={() => rd.moveItem(secId, item.id, -1)}
                onDown={() => rd.moveItem(secId, item.id, 1)}
                onDelete={() => rd.removeItem(secId, item.id)}
              />
            </div>
            <Field label="Title" value={item.title} onChange={(v) => rd.setItem(secId, item.id, 'title', v)} />
            <Field label="Date range" value={item.date} placeholder="Jan 2026 - Mar 2026" onChange={(v) => rd.setItem(secId, item.id, 'date', v)} />
            <Field label="Description" textarea value={item.description} onChange={(v) => rd.setItem(secId, item.id, 'description', v)} />

            <div className="rm-field">
              <label>Bullet points <span style={{ color: 'var(--rm-text-3)', fontWeight: 400 }}>· optional</span></label>
              {(item.bullets || []).map((b, bi) => (
                <div className="rm-bullet-row" key={bi}>
                  <span className="rm-bullet-dot">•</span>
                  <input
                    className="rm-input"
                    value={b}
                    placeholder="Type a bullet point"
                    onChange={(e) => rd.setBullet(secId, item.id, bi, e.target.value)}
                  />
                  <IconBtn icon="trash" title="Remove bullet" danger onClick={() => rd.removeBullet(secId, item.id, bi)} />
                </div>
              ))}
              <AddButton onClick={() => rd.addBullet(secId, item.id)}>Add bullet point</AddButton>
            </div>
          </div>
        </div>
      ))}
      <AddButton onClick={() => rd.addItem(secId)} disabled={limit && items.length >= limit}>
        Add entry
      </AddButton>
      {limit && (
        <div className="rm-hint">
          {items.length >= limit
            ? `Limit reached — ${limit} maximum. Delete one to add another.`
            : `${limit - items.length} of ${limit} remaining.`}
        </div>
      )}
    </>
  );
}

function AreasEditor({ rd }) {
  const items = rd.data.areas;
  return (
    <>
      {items.map((item, i) => (
        <div key={item.id}>
          {i > 0 && <Breaker on={!!item.pageBreak} onToggle={() => rd.toggleItemBreak('areas', item.id)} />}
          <div className="rm-bullet-row" style={{ marginTop: 9 }}>
            <span className="rm-bullet-dot">•</span>
            <input className="rm-input" value={item.text} placeholder="Area of interest"
              onChange={(e) => rd.setItem('areas', item.id, 'text', e.target.value)} />
            <IconBtn icon="up" title="Move up" disabled={i === 0} onClick={() => rd.moveItem('areas', item.id, -1)} />
            <IconBtn icon="down" title="Move down" disabled={i === items.length - 1} onClick={() => rd.moveItem('areas', item.id, 1)} />
            <IconBtn icon="trash" title="Delete" danger onClick={() => rd.removeItem('areas', item.id)} />
          </div>
        </div>
      ))}
      <AddButton onClick={() => rd.addItem('areas')}>Add area</AddButton>
    </>
  );
}

function SkillsEditor({ rd }) {
  const items = rd.data.skills;
  return (
    <>
      {items.map((item, i) => (
        <div key={item.id}>
          {i > 0 && <Breaker on={!!item.pageBreak} onToggle={() => rd.toggleItemBreak('skills', item.id)} />}
          <div className="rm-item">
            <div className="rm-item-head">
              <span className="rm-item-title">{item.label || 'Category'}</span>
              <ItemControls
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onUp={() => rd.moveItem('skills', item.id, -1)}
                onDown={() => rd.moveItem('skills', item.id, 1)}
                onDelete={() => rd.removeItem('skills', item.id)}
              />
            </div>
            <Field label="Category" value={item.label} placeholder="Programming Languages"
              onChange={(v) => rd.setItem('skills', item.id, 'label', v)} />
            <Field label="Items" value={item.value} placeholder="C, C++, Python"
              onChange={(v) => rd.setItem('skills', item.id, 'value', v)} />
          </div>
        </div>
      ))}
      <AddButton onClick={() => rd.addItem('skills')}>Add category</AddButton>
    </>
  );
}

function ExtrasEditor({ rd }) {
  const ex = rd.data.extracurriculars;
  const group = (kind, title) => (
    <div key={kind}>
      <Breaker
        on={!!ex[`${kind}Break`]}
        onToggle={() => rd.toggleExtraBreak(kind)}
        title={`Start ${title} on a new page`}
      />
      <div className="rm-item">
        <div className="rm-item-head"><span className="rm-item-title">{title}</span></div>
        {ex[kind].map((item) => (
          <div className="rm-bullet-row" key={item.id} style={{ marginTop: 7 }}>
            <span className="rm-bullet-dot">•</span>
            <input className="rm-input" value={item.text} placeholder="Activity"
              onChange={(e) => rd.setExtra(kind, item.id, e.target.value)} />
            <IconBtn icon="trash" title="Delete" danger onClick={() => rd.removeExtra(kind, item.id)} />
          </div>
        ))}
        <AddButton onClick={() => rd.addExtra(kind)}>Add activity</AddButton>
      </div>
    </div>
  );
  // Sports first, then Social — matches the target format.
  return <>{group('sport', 'Sports Activities')}{group('social', 'Social Activities')}</>;
}
