import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './App.css';
import defaultLogo from './assets/nitt_logo.png';
import defaultPhoto from './assets/student_photo.png';

const LOCAL_STORAGE_KEY = 'nitt_resume_builder_data';

const initialData = {
  personalInfo: {
    name: "SHIVANSH SHARMA",
    degree: "M.Tech - DA",
    gender: "Male",
    dob: "02/01/2002",
    email: "tp@nitt.edu",
    contact: "+91-431-2501081",
    logo: "", // fallback to defaultLogo
    photo: "" // fallback to defaultPhoto
  },
  education: [
    { id: 1, year: "2025", degree: "M. Tech DA", institution: "National Institute of Technology, Tiruchirappalli", grade: "7.52" },
    { id: 2, year: "2024", degree: "B. Tech CSE", institution: "Shri Mata Vaishno Devi University, Jammu&Kashmir", grade: "7.18" },
    { id: 3, year: "2019", degree: "Class XII", institution: "Mahanand Awasthi Inter College, UP Board", grade: "64.6%" },
    { id: 4, year: "2017", degree: "Class X", institution: "St. Peter Inter College, Nanpara, ICSE", grade: "89.2%" }
  ],
  educationNote: "* - Upto 2nd semester",
  internships: [
    {
      id: 1,
      title: "Summer Internship training at excellence technologies",
      date: "Feb 2024 - May 2024",
      description: "Underwent an Internship training program at Excellence Technologies. The training involved learning different concepts of machine learning along with application in real world. The final project contained a model which could do media control using hand gestures.",
      bullets: [],
      pageBreak: false
    }
  ],
  projects: [
    {
      id: 1,
      title: "Handwritten digit Recognition:",
      date: "Feb 2022- April 2022",
      description: "In this project, i made a model that recognises handwritten digits of MNIST data-set. Learned about various technologies like Open CV, Tensor Flow, understood the basics of image recognition and hoe to implement it.",
      bullets: [],
      pageBreak: false
    },
    {
      id: 2,
      title: "Media control using hand gestures",
      date: "March 2024- Apr 2024",
      description: "In this project, we made a model that can control media players using hand gestures. In this we learned about CNN and how to make ittune itfor specific purpose in image classification.",
      bullets: [],
      pageBreak: false
    }
  ],
  skills: [
    { id: 1, label: "Programming Languages", value: "C, C++, Python", pageBreak: false },
    { id: 2, label: "Engineering Software", value: "Google Colab", pageBreak: false },
    { id: 3, label: "Other Software", value: "Microsoft Word, PowerPoint, Excel, Visual Studio code", pageBreak: false }
  ],
  areas: [
    { id: 1, text: "Data Structures and Algorithms", pageBreak: false },
    { id: 2, text: "Operating System", pageBreak: false },
    { id: 3, text: "Machine Learning", pageBreak: false }
  ],
  positions: [
    {
      id: 1,
      title: "Yoga Instructor:",
      date: "Nov 2023- Jan 2024",
      description: "Worked as a yoga instructor along with my senior under our yoga teacher as a part of nss in SMVDU",
      bullets: [],
      pageBreak: false
    },
    {
      id: 2,
      title: "Group leader:",
      date: "Aug 2023",
      description: "Worked as a group leader from our batch in debate competition for our house (Akash) in SMVDU",
      bullets: [],
      pageBreak: false
    }
  ],
  extracurriculars: {
    social: [
      { id: 1, text: "Participated in a Half marathon held in Katra in 2023." },
      { id: 2, text: "Participated in Youth Parliament form our house" },
      { id: 3, text: "Worked as a teacher for underprivileged student under our college initiative Vikalp" }
    ],
    sport: [
      { id: 1, text: "Participated in 100m, 400m, and 1600m in SMVDU" },
      { id: 2, text: "Participated in badminton tournamentin SMVDU" },
      { id: 3, text: "Participated in chess tournament in SMVDU" },
      { id: 4, text: "Third place in group Debate competition from our house in SMVDU" }
    ],
    sportBreak: false,
    socialBreak: false
  },
  footer: {
    line1: "Department of Training and Placement, NIT Trichy 620015",
    line2: "Telephone : +91-431-2501081 e-mail: tp@nitt.edu, tnp.nitt@gmail.com"
  },
  pageBreaks: {
    education: false,
    internships: false,
    projects: false,
    areas: true, // Page 2 starts with Areas of Interest by default (matches target)
    skills: false,
    positions: false,
    extracurriculars: false
  },
  // Which sections appear on the resume. Internships & Positions are off by
  // default to match the target format, but can be toggled on in Settings.
  sectionVisibility: {
    education: true,
    internships: false,
    projects: true,
    areas: true,
    skills: true,
    positions: false,
    extracurriculars: true
  },
  layoutSettings: {
    baseFontSize: 16 // 16px matches the original PDF's 12pt size
  }
};

// All editable sections in their canonical order. Which ones render on the
// resume is controlled per-section by data.sectionVisibility.
const allSections = [
  { id: 'education', title: 'Educational Qualification', type: 'education' },
  { id: 'internships', title: 'Internship Experience', type: 'internships' },
  // Guide rule #18: "Other Projects" only when internships/work experience are shown;
  // otherwise the heading must read "Projects". Resolved per-render in resolveSectionTitle().
  { id: 'projects', title: 'Other Projects', type: 'projects' },
  { id: 'areas', title: 'Areas of Interest', type: 'areas' },
  { id: 'skills', title: 'Technical Skills and Certifications', type: 'skills' },
  { id: 'positions', title: 'Positions of Responsibility', type: 'positions' },
  { id: 'extracurriculars', title: 'Extracurricular Activities', type: 'extracurriculars' }
];

// Loads saved resume data from localStorage, merging in any new fields.
// Guide rule #18: the projects heading reads "Other Projects" only when the
// resume also shows internship / work experience. With neither, it is "Projects".
function resolveSectionTitle(sec, data) {
  if (sec.id !== 'projects') return sec.title;
  const showsInternships =
    data.sectionVisibility?.internships !== false && (data.internships || []).length > 0;
  return showsInternships ? 'Other Projects' : 'Projects';
}

function loadData() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.layoutSettings) {
        parsed.layoutSettings = { baseFontSize: 16 };
      }
      if (!Array.isArray(parsed.areas)) {
        parsed.areas = initialData.areas;
      }
      if (parsed.educationNote === undefined) {
        parsed.educationNote = initialData.educationNote;
      }
      parsed.pageBreaks = { ...initialData.pageBreaks, ...(parsed.pageBreaks || {}) };
      parsed.sectionVisibility = { ...initialData.sectionVisibility, ...(parsed.sectionVisibility || {}) };
      return parsed;
    } catch (e) {
      console.error("Error loading cached resume data", e);
    }
  }
  return initialData;
}

// Flattens the visible sections into renderable "units". List sections
// (projects/internships/positions) split into a header unit + one unit per item
// so items can flow independently across pages. Block sections render as one unit.
function buildUnits(data) {
  const units = [];
  const hasContent = (sec) => {
    if (sec.type === 'education') return data.education.length > 0;
    if (sec.type === 'areas') return data.areas.length > 0;
    if (sec.type === 'skills') return data.skills.length > 0;
    if (sec.type === 'extracurriculars') {
      return data.extracurriculars.social.length + data.extracurriculars.sport.length > 0;
    }
    return (data[sec.id] || []).length > 0;
  };
  allSections.forEach((sec) => {
    if (data.sectionVisibility?.[sec.id] === false) return;
    if (!hasContent(sec)) return;
    const breakBefore = !!data.pageBreaks?.[sec.id];
    // Education is a table -> keep atomic. Everything else splits so content
    // flows item-by-item and each entry can start its own page.
    if (sec.type === 'education') {
      units.push({ kind: 'block', sec, breakBefore });
    } else if (sec.type === 'extracurriculars') {
      units.push({ kind: 'sectionHeader', sec, breakBefore });
      if (data.extracurriculars.sport.length > 0) {
        units.push({ kind: 'subblock', sec, subType: 'sport', breakBefore: !!data.extracurriculars.sportBreak });
      }
      if (data.extracurriculars.social.length > 0) {
        units.push({ kind: 'subblock', sec, subType: 'social', breakBefore: !!data.extracurriculars.socialBreak });
      }
    } else if (sec.type === 'areas' || sec.type === 'skills') {
      units.push({ kind: 'sectionHeader', sec, breakBefore });
      data[sec.id].forEach((item) => {
        units.push({ kind: 'item', sec, item, breakBefore: !!item.pageBreak });
      });
    } else {
      // projects / internships / positions
      units.push({ kind: 'sectionHeader', sec, breakBefore });
      data[sec.id].forEach((item) => {
        units.push({ kind: 'item', sec, item, breakBefore: !!item.pageBreak });
      });
    }
  });
  return units;
}

// Fills pages greedily from measured unit content heights + top margins.
// contentHeights[i] is the unit's own box height (no margin); margins[i] is the
// unit's top margin. A unit starting a page drops its top margin (first-on-page
// CSS), exactly matching the render. A unit moves to a new page when an explicit
// break is set, when it overflows, or when a section header would be orphaned.
function paginateUnits(units, contentHeights, margins, availableFirst, available) {
  const n = units.length;
  const pages = [];
  let cur = { isFirstPage: true, units: [] };
  let used = 0;
  let suppressNextBreak = false;
  const availFor = (isFirst) => (isFirst ? availableFirst : available);

  units.forEach((u, i) => {
    const h = Math.max(contentHeights[i] || 0, 1);
    const mt = margins[i] || 0;
    const suppressBreak = suppressNextBreak;
    suppressNextBreak = false;

    if (cur.units.length > 0) {
      let breakNow = (!!u.breakBefore && !suppressBreak) || used + mt + h > availFor(cur.isFirstPage);
      if (u.kind === 'sectionHeader') {
        const next = units[i + 1];
        const nextH = i < n - 1 ? Math.max(contentHeights[i + 1] || 0, 1) : 0;
        const nextMt = i < n - 1 ? (margins[i + 1] || 0) : 0;
        // Keep the header with its first item: break if the first item has an
        // explicit break, or if header + first item would not both fit.
        if ((next && next.breakBefore) || used + mt + h + nextMt + nextH > availFor(cur.isFirstPage)) {
          breakNow = true;
        }
      }
      if (breakNow) {
        pages.push(cur);
        cur = { isFirstPage: false, units: [] };
        used = 0;
        suppressNextBreak = u.kind === 'sectionHeader';
      }
    }

    cur.units.push(u);
    used += cur.units.length === 1 ? h : mt + h;
  });

  if (cur.units.length > 0) pages.push(cur);
  if (pages.length === 0) pages.push({ isFirstPage: true, units: [] });

  // When a section's items continue onto the next page, repeat its heading at the
  // top of that page so the continuation is anchored (no orphaned items).
  let prevSecId = null;
  for (const page of pages) {
    const first = page.units[0];
    if (first && (first.kind === 'item' || first.kind === 'subblock') && prevSecId === first.sec.id) {
      page.units.unshift({ kind: 'sectionHeader', sec: first.sec, breakBefore: false, isContinuation: true });
    }
    const last = page.units[page.units.length - 1];
    prevSecId = last ? last.sec.id : null;
  }
  return pages;
}

// First-paint fallback: group each section onto one page (respecting section
// page breaks) before measured heights are available.
function staticPaginate(data) {
  const units = buildUnits(data);
  const pages = [];
  let cur = { isFirstPage: true, units: [] };
  units.forEach((u) => {
    if (u.breakBefore && cur.units.length > 0) {
      pages.push(cur);
      cur = { isFirstPage: pages.length === 0, units: [] };
    }
    cur.units.push(u);
  });
  if (cur.units.length > 0) pages.push(cur);
  if (pages.length === 0) pages.push({ isFirstPage: true, units: [] });
  return pages;
}

// Display-only helpers so the generated PDF follows the placement guide rules
const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Renders "1st" as 1<sup>st</sup> like Word does in the education footnote
const renderOrdinals = (text) => {
  if (!text) return text;
  const parts = [];
  const re = /(\d+)(st|nd|rd|th)\b/gi;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index));
    parts.push(m[1]);
    parts.push(<sup key={m.index}>{m[2]}</sup>);
    last = re.lastIndex;
  }
  parts.push(text.slice(last));
  return parts;
};

export default function App() {
  const [data, setData] = useState(loadData);
  const [pages, setPages] = useState(() => staticPaginate(loadData()));

  // Refs for the hidden measurement container
  const contentRef = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const unitRefsRef = useRef([]);

  // Bumps so pagination re-measures once webfonts finish loading (font metrics
  // change the rendered heights, so measuring too early gives a wrong layout).
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    let mounted = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (mounted) setFontTick(t => t + 1);
      });
    }
    return () => { mounted = false; };
  }, []);

  const currentBaseFontSize = data.layoutSettings?.baseFontSize || 16;
  const units = buildUnits(data);

  // Measure rendered content heights + top margins and compute pagination after
  // each layout change. Content height excludes margins (getBoundingClientRect
  // excludes margin); margin is read from computed style so the pagination can
  // drop it for units that start a page, exactly matching the render.
  useLayoutEffect(() => {
    const effUnits = buildUnits(data);
    const contentAvailable = contentRef.current ? contentRef.current.offsetHeight : 0;
    const headerH = headerRef.current ? headerRef.current.offsetHeight : 0;
    const contentHeights = effUnits.map((_, i) => {
      const el = unitRefsRef.current[i];
      return el ? el.getBoundingClientRect().height : 0;
    });
    const margins = effUnits.map((_, i) => {
      const el = unitRefsRef.current[i];
      return el ? (parseFloat(getComputedStyle(el).marginTop) || 0) : 0;
    });
    // The footer is absolutely positioned, so it does not consume flow space —
    // units may use the full content box. Page 1 only has the header taken out.
    const next = paginateUnits(
      effUnits,
      contentHeights,
      margins,
      contentAvailable - headerH,
      contentAvailable
    );
    setPages(prev => {
      const sig = (u) => [u.kind, u.sec.id, u.item ? u.item.id : (u.subType || 'section')];
      const a = JSON.stringify(prev.map(p => p.units.map(sig)));
      const b = JSON.stringify(next.map(p => p.units.map(sig)));
      return a === b ? prev : next;
    });
  }, [data, currentBaseFontSize, fontTick]);

  const [activeSection, setActiveSection] = useState('personalInfo');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const resetData = () => {
    if (window.confirm("Are you sure you want to reset all data back to the default Shivansh Sharma resume?")) {
      setData(initialData);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Image Upload helper
  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            [field]: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Header/Personal changes
  const handlePersonalInfoChange = (field, value) => {
    setData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  // Education Cell changes
  const handleEducationChange = (id, field, value) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addEducationRow = () => {
    setData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { id: Date.now(), year: "", degree: "", institution: "", grade: "" }
      ]
    }));
  };

  const deleteEducationRow = (id) => {
    setData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  // Dynamic Lists (Internships, Projects, Positions, Skills)
  const handleListItemChange = (section, id, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addListItem = (section) => {
    const newItem = section === 'skills'
      ? { id: Date.now(), label: "", value: "", pageBreak: false }
      : { id: Date.now(), title: "", date: "", description: "", bullets: [], pageBreak: false };

    setData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
  };

  const deleteListItem = (section, id) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const moveListItem = (section, index, direction) => {
    const list = [...data[section]];
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    setData(prev => ({
      ...prev,
      [section]: list
    }));
  };

  // Extracurricular items changes
  const handleExtracurricularChange = (subType, id, value) => {
    setData(prev => ({
      ...prev,
      extracurriculars: {
        ...prev.extracurriculars,
        [subType]: prev.extracurriculars[subType].map(item => item.id === id ? { ...item, text: value } : item)
      }
    }));
  };

  const addExtracurricularItem = (subType) => {
    setData(prev => ({
      ...prev,
      extracurriculars: {
        ...prev.extracurriculars,
        [subType]: [
          ...prev.extracurriculars[subType],
          { id: Date.now(), text: "" }
        ]
      }
    }));
  };

  const deleteExtracurricularItem = (subType, id) => {
    setData(prev => ({
      ...prev,
      extracurriculars: {
        ...prev.extracurriculars,
        [subType]: prev.extracurriculars[subType].filter(item => item.id !== id)
      }
    }));
  };

  // Areas of Interest changes
  const handleAreasChange = (id, value) => {
    setData(prev => ({
      ...prev,
      areas: prev.areas.map(item => item.id === id ? { ...item, text: value } : item)
    }));
  };

  const addAreaItem = () => {
    setData(prev => ({
      ...prev,
      areas: [...prev.areas, { id: Date.now(), text: "", pageBreak: false }]
    }));
  };

  const deleteAreaItem = (id) => {
    setData(prev => ({
      ...prev,
      areas: prev.areas.filter(item => item.id !== id)
    }));
  };

  // Bullet points for project/internship/position items
  const handleBulletChange = (section, itemId, bulletIndex, value) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map(item => {
        if (item.id !== itemId) return item;
        const bullets = (item.bullets || []).slice();
        bullets[bulletIndex] = value;
        return { ...item, bullets };
      })
    }));
  };

  const addBullet = (section, itemId) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === itemId ? { ...item, bullets: [...(item.bullets || []), ""] } : item
      )
    }));
  };

  const removeBullet = (section, itemId, bulletIndex) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map(item => {
        if (item.id !== itemId) return item;
        const bullets = (item.bullets || []).filter((_, i) => i !== bulletIndex);
        return { ...item, bullets };
      })
    }));
  };

  // Extracurricular subsection page break
  const handleSubBreakToggle = (subType) => {
    const key = subType === 'sport' ? 'sportBreak' : 'socialBreak';
    setData(prev => ({
      ...prev,
      extracurriculars: {
        ...prev.extracurriculars,
        [key]: !prev.extracurriculars[key]
      }
    }));
  };

  // Education table note
  const handleEducationNoteChange = (value) => {
    setData(prev => ({ ...prev, educationNote: value }));
  };

  // Page Breaks Config
  const handlePageBreakToggle = (sectionId) => {
    setData(prev => ({
      ...prev,
      pageBreaks: {
        ...prev.pageBreaks,
        [sectionId]: !prev.pageBreaks[sectionId]
      }
    }));
  };

  // Per-item page break (start this item on a new page)
  const handleItemPageBreakToggle = (section, itemId) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === itemId ? { ...item, pageBreak: !item.pageBreak } : item)
    }));
  };

  // Section visibility toggle (show/hide a section on the resume)
  const handleVisibilityToggle = (sectionId) => {
    setData(prev => {
      const currentlyVisible = prev.sectionVisibility?.[sectionId] !== false;
      return {
        ...prev,
        sectionVisibility: {
          ...prev.sectionVisibility,
          [sectionId]: !currentlyVisible
        }
      };
    });
  };

  // Layout settings change handler
  const handleLayoutSettingChange = (field, value) => {
    setData(prev => ({
      ...prev,
      layoutSettings: {
        ...prev.layoutSettings,
        [field]: value
      }
    }));
  };

  // Footer changes
  const handleFooterChange = (field, value) => {
    setData(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: value
      }
    }));
  };

  // Render helpers for a single resume unit (section header / item / block).
  // Used identically in the hidden measure container and on real pages so the
  // measured heights match the rendered heights.
  const renderSectionHeader = (sec) => (
    <div className="resume-section-header">
      <h2 className="resume-section-title">{resolveSectionTitle(sec, data)}</h2>
      <div className="resume-section-line"></div>
    </div>
  );

  const renderEducationTable = () => (
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

  const renderItemUnit = (sec, item) => {
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
    return (
      <div className="resume-item">
        <div className="resume-item-header">
          <span className="resume-item-title">{item.title}</span>
          <span className="resume-item-date">{item.date}</span>
        </div>
        {item.description && <div className="resume-item-desc">{capitalizeFirst(item.description)}</div>}
        {(item.bullets || []).filter(b => b.trim()).length > 0 && (
          <div className="resume-item-bullets">
            {(item.bullets || []).filter(b => b.trim()).map((b, bi) => (
              <div className="resume-item" key={bi}>
                <span>{capitalizeFirst(b)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // One Sports / Social subsection of Extracurricular Activities
  const renderSubblock = (sec, subType) => {
    const isSport = subType === 'sport';
    const items = isSport ? data.extracurriculars.sport : data.extracurriculars.social;
    if (items.length === 0) return null;
    return (
      <>
        <div className="resume-subheading">{isSport ? 'Sports Activities:' : 'Social Activities:'}</div>
        <div className="resume-items-container" style={{ gap: '0.2em', marginBottom: '0.5em' }}>
          {items.map((item) => (
            <div className="resume-item" key={item.id}>
              <span>{capitalizeFirst(item.text)}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderBlockSection = (sec) => (
    <>
      {renderSectionHeader(sec)}
      {sec.type === 'education' && renderEducationTable()}
    </>
  );

  const renderUnit = (u) => {
    if (u.kind === 'sectionHeader') return renderSectionHeader(u.sec);
    if (u.kind === 'block') return renderBlockSection(u.sec);
    if (u.kind === 'subblock') return renderSubblock(u.sec, u.subType);
    // Look the item up from live data by id: the unit's stored item reference can
    // be stale when content changed (bullets edited) but pagination didn't.
    const fresh = (data[u.sec.id] || []).find(i => i.id === u.item.id);
    return renderItemUnit(u.sec, fresh || u.item);
  };

  // Spacing class for unit wrappers (drives the top margin used by pagination)
  const unitTypeClass = (u) => {
    if (u.kind === 'sectionHeader') return 'unit-sechead';
    if (u.kind === 'subblock') return 'unit-subblock';
    if (u.kind === 'block') return 'unit-block';
    return 'unit-item';
  };

  const renderHeader = () => (
    <>
      <div className="resume-header">
        <div className="resume-logo-container">
          <img
            className="resume-logo"
            src={data.personalInfo.logo || defaultLogo}
            alt="Institution Logo"
          />
        </div>
        <div className="resume-info">
          <div className="resume-name">{data.personalInfo.name}</div>
          <div className="resume-subname">{data.personalInfo.degree}</div>
          <div className="resume-details">
            <div className="resume-detail-line"><span className="resume-detail-label">Gender: </span><span>{data.personalInfo.gender}</span></div>
            <div className="resume-detail-line"><span className="resume-detail-label">Date of Birth: </span><span>{data.personalInfo.dob}</span></div>
            <div className="resume-detail-line"><span className="resume-detail-label">E-mail : </span><span>{data.personalInfo.email}</span></div>
            <div className="resume-detail-line"><span className="resume-detail-label">Contact : </span><span>{data.personalInfo.contact}</span></div>
          </div>
        </div>
        <div className="resume-photo-container">
          <img
            className="resume-photo"
            src={data.personalInfo.photo || defaultPhoto}
            alt="Student Photo"
          />
        </div>
      </div>
      <div className="header-divider-line"></div>
    </>
  );

  const renderFooter = (ref) => (
    <div className="resume-footer" ref={ref}>
      <div className="resume-footer-text">
        <div>{data.footer.line1}</div>
      </div>
      <div className="resume-footer-blue-row">
        <div className="resume-footer-blue"></div>
        <div className="resume-footer-blue"></div>
      </div>
      <div className="resume-footer-text">
        <div>{data.footer.line2}</div>
      </div>
    </div>
  );

  // Editor helper: "start this section on a new page" toggle (lives in the section editor)
  const sectionBreakToggle = (secId) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.8rem' }}>
      <input
        type="checkbox"
        id={`sec-pb-${secId}`}
        checked={!!data.pageBreaks?.[secId]}
        onChange={() => handlePageBreakToggle(secId)}
        style={{ width: 'auto', cursor: 'pointer' }}
      />
      <label htmlFor={`sec-pb-${secId}`} style={{ cursor: 'pointer', margin: 0, color: 'var(--text-secondary)' }}>
        Start this section on a new page
      </label>
    </div>
  );

  // Editor helper: per-item "start on a new page" toggle
  const itemBreakToggle = (section, item) => (
    <button
      type="button"
      onClick={() => handleItemPageBreakToggle(section, item.id)}
      title="Start this item on a new page"
      style={{
        border: item.pageBreak ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
        background: item.pageBreak ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.2)',
        color: item.pageBreak ? 'var(--accent-color)' : 'var(--text-secondary)',
        borderRadius: '5px',
        padding: '3px 7px',
        fontSize: '0.7rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      {item.pageBreak ? 'Page break ON' : 'New page'}
    </button>
  );

  // Compact "New page" toggle for single-row items (areas) / subsections
  const compactBreakToggle = (label, active, onToggle) => (
    <button
      type="button"
      onClick={onToggle}
      title="Start this on a new page"
      style={{
        border: active ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
        background: active ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.2)',
        color: active ? 'var(--accent-color)' : 'var(--text-secondary)',
        borderRadius: '5px',
        padding: '3px 7px',
        fontSize: '0.7rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      {active ? 'Page break ON' : label}
    </button>
  );

  // Editor for a project/internship/position item's bullet points. Each bullet
  // renders as a bulleted line under the description on the resume.
  const bulletPointsEditor = (section, item) => (
    <div style={{ marginTop: '4px' }}>
      <label>Bullet Points</label>
      {(item.bullets || []).map((b, bi) => (
        <div key={bi} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>•</span>
          <input
            type="text"
            placeholder="Type a bullet point"
            value={b}
            onChange={(e) => handleBulletChange(section, item.id, bi, e.target.value)}
          />
          <button className="btn-icon-danger" onClick={() => removeBullet(section, item.id, bi)} title="Remove">✕</button>
        </div>
      ))}
      <button
        className="btn-secondary"
        style={{ marginTop: '6px', borderStyle: 'dashed' }}
        onClick={() => addBullet(section, item.id)}
      >
        + Add Bullet Point
      </button>
    </div>
  );

  return (
    <div className="app-container">
      {/* Sidebar Editor */}
      <div className="editor-sidebar">
        <div className="editor-header">
          <h1>Resume Builder</h1>
          <button className="btn-primary" onClick={triggerPrint}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 8m0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 10"/>
            </svg>
            Export to PDF
          </button>
        </div>

        <div className="editor-content">
          {/* SECTION 1: Personal Info */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('personalInfo')}>
              <span>1. Header & Personal Details</span>
              <span className={`chevron-icon ${activeSection === 'personalInfo' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'personalInfo' && (
              <div className="form-section-content">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={data.personalInfo.name} 
                    onChange={(e) => handlePersonalInfoChange('name', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Degree / Title</label>
                  <input 
                    type="text" 
                    value={data.personalInfo.degree} 
                    onChange={(e) => handlePersonalInfoChange('degree', e.target.value)} 
                  />
                </div>
                <div className="form-group row-2">
                  <div>
                    <label>Gender</label>
                    <input 
                      type="text" 
                      value={data.personalInfo.gender} 
                      onChange={(e) => handlePersonalInfoChange('gender', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label>Date of Birth</label>
                    <input 
                      type="text" 
                      value={data.personalInfo.dob} 
                      onChange={(e) => handlePersonalInfoChange('dob', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="form-group row-2">
                  <div>
                    <label>E-mail</label>
                    <input 
                      type="email" 
                      value={data.personalInfo.email} 
                      onChange={(e) => handlePersonalInfoChange('email', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label>Contact Number</label>
                    <input 
                      type="text" 
                      value={data.personalInfo.contact} 
                      onChange={(e) => handlePersonalInfoChange('contact', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Institution Logo</label>
                  <div className="image-upload-wrapper">
                    <img 
                      className="image-preview-thumbnail" 
                      src={data.personalInfo.logo || defaultLogo} 
                      alt="Logo Preview" 
                    />
                    <label className="file-input-btn">
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'logo')} 
                      />
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Passport Photo</label>
                  <div className="image-upload-wrapper">
                    <img 
                      className="image-preview-thumbnail" 
                      src={data.personalInfo.photo || defaultPhoto} 
                      alt="Photo Preview" 
                    />
                    <label className="file-input-btn">
                      Upload Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'photo')} 
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Educational Qualifications */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('education')}>
              <span>2. Educational Qualifications</span>
              <span className={`chevron-icon ${activeSection === 'education' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'education' && (
              <div className="form-section-content">
                {sectionBreakToggle('education')}
                <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: '#9ca3af', display: 'grid', gridTemplateColumns: '80px 100px 1fr 80px 40px', gap: '8px' }}>
                  <span>Year</span>
                  <span>Degree</span>
                  <span>Institution</span>
                  <span>CGPA</span>
                  <span></span>
                </div>
                {data.education.map((row) => (
                  <div className="table-editor-row" key={row.id}>
                    <input 
                      type="text" 
                      placeholder="Year" 
                      value={row.year} 
                      onChange={(e) => handleEducationChange(row.id, 'year', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Degree" 
                      value={row.degree} 
                      onChange={(e) => handleEducationChange(row.id, 'degree', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Institution" 
                      value={row.institution} 
                      onChange={(e) => handleEducationChange(row.id, 'institution', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Grade" 
                      value={row.grade} 
                      onChange={(e) => handleEducationChange(row.id, 'grade', e.target.value)} 
                    />
                    <button className="btn-icon-danger" onClick={() => deleteEducationRow(row.id)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button className="btn-secondary" onClick={addEducationRow}>
                  + Add Row
                </button>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Footnote under Education table (legend)</label>
                  <input
                    type="text"
                    value={data.educationNote}
                    onChange={(e) => handleEducationNoteChange(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Internship Experience */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('internships')}>
              <span>3. Internship Experience</span>
              <span className={`chevron-icon ${activeSection === 'internships' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'internships' && (
              <div className="form-section-content">
                {sectionBreakToggle('internships')}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {data.sectionVisibility?.internships === false
                    ? 'Currently hidden from the resume. Toggle "Internship Experience" on in Section 9 → Show Sections in Resume to include it.'
                    : 'This section is currently shown on the resume. You can hide it in Section 9 → Show Sections in Resume.'}
                </div>
                {data.internships.map((item, index) => (
                  <div className="list-item-card" key={item.id}>
                    <div className="list-item-header">
                      <span>Item #{index + 1}</span>
                      <div className="item-actions">
                        {itemBreakToggle('internships', item)}
                        <button className="btn-icon-danger" onClick={() => moveListItem('internships', index, 'up')} title="Move Up">▲</button>
                        <button className="btn-icon-danger" onClick={() => moveListItem('internships', index, 'down')} title="Move Down">▼</button>
                        <button className="btn-icon-danger" onClick={() => deleteListItem('internships', item.id)} title="Delete">✕</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Title / Role & Company</label>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => handleListItemChange('internships', item.id, 'title', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Dates</label>
                      <input 
                        type="text" 
                        value={item.date} 
                        onChange={(e) => handleListItemChange('internships', item.id, 'date', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        value={item.description}
                        onChange={(e) => handleListItemChange('internships', item.id, 'description', e.target.value)}
                      />
                    </div>
                    {bulletPointsEditor('internships', item)}
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => addListItem('internships')}>
                  + Add Internship
                </button>
              </div>
            )}
          </div>

          {/* SECTION 4: Other Projects */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('projects')}>
              <span>4. Other Projects</span>
              <span className={`chevron-icon ${activeSection === 'projects' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'projects' && (
              <div className="form-section-content">
                {sectionBreakToggle('projects')}
                {data.projects.map((item, index) => (
                  <div className="list-item-card" key={item.id}>
                    <div className="list-item-header">
                      <span>Item #{index + 1}</span>
                      <div className="item-actions">
                        {itemBreakToggle('projects', item)}
                        <button className="btn-icon-danger" onClick={() => moveListItem('projects', index, 'up')} title="Move Up">▲</button>
                        <button className="btn-icon-danger" onClick={() => moveListItem('projects', index, 'down')} title="Move Down">▼</button>
                        <button className="btn-icon-danger" onClick={() => deleteListItem('projects', item.id)} title="Delete">✕</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Project Name</label>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => handleListItemChange('projects', item.id, 'title', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Dates</label>
                      <input 
                        type="text" 
                        value={item.date} 
                        onChange={(e) => handleListItemChange('projects', item.id, 'date', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        value={item.description}
                        onChange={(e) => handleListItemChange('projects', item.id, 'description', e.target.value)}
                      />
                    </div>
                    {bulletPointsEditor('projects', item)}
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => addListItem('projects')}>
                  + Add Project
                </button>
              </div>
            )}
          </div>

          {/* SECTION 5: Areas of Interest */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('areas')}>
              <span>5. Areas of Interest</span>
              <span className={`chevron-icon ${activeSection === 'areas' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'areas' && (
              <div className="form-section-content">
                {sectionBreakToggle('areas')}
                {data.areas.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Area of interest"
                      value={item.text}
                      onChange={(e) => handleAreasChange(item.id, e.target.value)}
                    />
                    {compactBreakToggle('New page', !!item.pageBreak, () => handleItemPageBreakToggle('areas', item.id))}
                    <button className="btn-icon-danger" onClick={() => deleteAreaItem(item.id)}>✕</button>
                  </div>
                ))}
                <button className="btn-secondary" onClick={addAreaItem}>
                  + Add Area of Interest
                </button>
              </div>
            )}
          </div>

          {/* SECTION 6: Technical Skills */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('skills')}>
              <span>6. Technical Skills & Certifications</span>
              <span className={`chevron-icon ${activeSection === 'skills' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'skills' && (
              <div className="form-section-content">
                {sectionBreakToggle('skills')}
                {data.skills.map((item, index) => (
                  <div className="list-item-card" key={item.id}>
                    <div className="list-item-header">
                      <span>Skill Area #{index + 1}</span>
                      <div className="item-actions">
                        {itemBreakToggle('skills', item)}
                        <button className="btn-icon-danger" onClick={() => moveListItem('skills', index, 'up')}>▲</button>
                        <button className="btn-icon-danger" onClick={() => moveListItem('skills', index, 'down')}>▼</button>
                        <button className="btn-icon-danger" onClick={() => deleteListItem('skills', item.id)}>✕</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Category Label (e.g. Programming Languages)</label>
                      <input 
                        type="text" 
                        value={item.label} 
                        onChange={(e) => handleListItemChange('skills', item.id, 'label', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Values (separated by comma)</label>
                      <input 
                        type="text" 
                        value={item.value} 
                        onChange={(e) => handleListItemChange('skills', item.id, 'value', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => addListItem('skills')}>
                  + Add Skill Group
                </button>
              </div>
            )}
          </div>

          {/* SECTION 7: Positions of Responsibility */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('positions')}>
              <span>7. Positions of Responsibility</span>
              <span className={`chevron-icon ${activeSection === 'positions' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'positions' && (
              <div className="form-section-content">
                {sectionBreakToggle('positions')}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {data.sectionVisibility?.positions === false
                    ? 'Currently hidden from the resume. Toggle "Positions of Responsibility" on in Section 9 → Show Sections in Resume to include it.'
                    : 'This section is currently shown on the resume. You can hide it in Section 9 → Show Sections in Resume.'}
                </div>
                {data.positions.map((item, index) => (
                  <div className="list-item-card" key={item.id}>
                    <div className="list-item-header">
                      <span>Item #{index + 1}</span>
                      <div className="item-actions">
                        {itemBreakToggle('positions', item)}
                        <button className="btn-icon-danger" onClick={() => moveListItem('positions', index, 'up')}>▲</button>
                        <button className="btn-icon-danger" onClick={() => moveListItem('positions', index, 'down')}>▼</button>
                        <button className="btn-icon-danger" onClick={() => deleteListItem('positions', item.id)}>✕</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Position / Role</label>
                      <input 
                        type="text" 
                        value={item.title} 
                        onChange={(e) => handleListItemChange('positions', item.id, 'title', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Dates</label>
                      <input 
                        type="text" 
                        value={item.date} 
                        onChange={(e) => handleListItemChange('positions', item.id, 'date', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        rows="3"
                        value={item.description}
                        onChange={(e) => handleListItemChange('positions', item.id, 'description', e.target.value)}
                      />
                    </div>
                    {bulletPointsEditor('positions', item)}
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => addListItem('positions')}>
                  + Add Position
                </button>
              </div>
            )}
          </div>

          {/* SECTION 8: Extracurricular Activities */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('extracurriculars')}>
              <span>8. Extracurricular Activities</span>
              <span className={`chevron-icon ${activeSection === 'extracurriculars' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'extracurriculars' && (
              <div className="form-section-content">
                {sectionBreakToggle('extracurriculars')}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Social Activities</h3>
                  {compactBreakToggle('New page', !!data.extracurriculars.socialBreak, () => handleSubBreakToggle('social'))}
                </div>
                {data.extracurriculars.social.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Social Activity" 
                      value={item.text} 
                      onChange={(e) => handleExtracurricularChange('social', item.id, e.target.value)} 
                    />
                    <button className="btn-icon-danger" onClick={() => deleteExtracurricularItem('social', item.id)}>✕</button>
                  </div>
                ))}
                <button className="btn-secondary" style={{ marginBottom: '15px' }} onClick={() => addExtracurricularItem('social')}>
                  + Add Social Activity
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Sports Activities</h3>
                  {compactBreakToggle('New page', !!data.extracurriculars.sportBreak, () => handleSubBreakToggle('sport'))}
                </div>
                {data.extracurriculars.sport.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Sport Activity" 
                      value={item.text} 
                      onChange={(e) => handleExtracurricularChange('sport', item.id, e.target.value)} 
                    />
                    <button className="btn-icon-danger" onClick={() => deleteExtracurricularItem('sport', item.id)}>✕</button>
                  </div>
                ))}
                <button className="btn-secondary" onClick={() => addExtracurricularItem('sport')}>
                  + Add Sport Activity
                </button>
              </div>
            )}
          </div>

          {/* SECTION 9: Footer & Settings */}
          <div className="form-section">
            <div className="form-section-header" onClick={() => toggleSection('settings')}>
              <span>9. Page Breaks & Layout Settings</span>
              <span className={`chevron-icon ${activeSection === 'settings' ? 'open' : ''}`}>▼</span>
            </div>
            {activeSection === 'settings' && (
              <div className="form-section-content">
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Text Font Size Control</h3>
                <div className="form-group" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <input 
                      type="range" 
                      min="12" 
                      max="24" 
                      step="0.5"
                      value={currentBaseFontSize} 
                      onChange={(e) => handleLayoutSettingChange('baseFontSize', parseFloat(e.target.value))}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ width: '85px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input 
                      type="number" 
                      min="12" 
                      max="24" 
                      step="0.5"
                      value={currentBaseFontSize} 
                      onChange={(e) => handleLayoutSettingChange('baseFontSize', parseFloat(e.target.value) || 16)} 
                      style={{ padding: '6px' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>px</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0', marginBottom: '20px' }}>
                  Default is 16px (matches the original PDF's 12pt). Spacing and headers will scale proportionally.
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '15px 0' }} />

                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Show Sections in Resume</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0', marginBottom: '10px' }}>
                  Toggle which sections appear on the PDF. Turn off sections you don't have.
                </div>
                {allSections.map((sec) => (
                  <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      id={`vis-${sec.id}`}
                      checked={data.sectionVisibility?.[sec.id] !== false}
                      onChange={() => handleVisibilityToggle(sec.id)}
                      style={{ width: 'auto', cursor: 'pointer' }}
                    />
                    <label htmlFor={`vis-${sec.id}`} style={{ cursor: 'pointer', margin: 0 }}>
                      {sec.title}
                    </label>
                  </div>
                ))}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0', marginBottom: '10px' }}>
                  To force a page break, open a section and check "Start this section on a new page" (or the per-item "New page" button in list sections).
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '15px 0' }} />

                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Footer Text</h3>
                <div className="form-group">
                  <label>Footer Line 1</label>
                  <input 
                    type="text" 
                    value={data.footer.line1} 
                    onChange={(e) => handleFooterChange('line1', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Footer Line 2</label>
                  <input 
                    type="text" 
                    value={data.footer.line2} 
                    onChange={(e) => handleFooterChange('line2', e.target.value)} 
                  />
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '15px 0' }} />

                <button className="btn-secondary" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }} onClick={resetData}>
                  Reset to Default Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Pane */}
      <div className="preview-area">
        {/* Hidden measure container: sizes every unit for pagination */}
        <div className="resume-measure" style={{ fontSize: `${currentBaseFontSize}px` }}>
          <div className="measure-page">
            <div className="measure-content" ref={contentRef}>
              <div className="measure-unit" ref={headerRef}>{renderHeader()}</div>
              {units.map((u, i) => (
                <div
                  className={`measure-unit ${unitTypeClass(u)}`}
                  key={i}
                  ref={(el) => { if (el) unitRefsRef.current[i] = el; }}
                >
                  {renderUnit(u)}
                </div>
              ))}
              {renderFooter(footerRef)}
            </div>
          </div>
        </div>

        {pages.map((page, pi) => (
          <div
            className="resume-page"
            key={pi}
            style={{ fontSize: `${currentBaseFontSize}px` }}
          >
            {page.isFirstPage && renderHeader()}

            <div className="page-body">
              {page.units.map((u, ui) => (
                <div
                  className={`page-unit ${unitTypeClass(u)} ${ui === 0 ? 'first-on-page' : ''}`}
                  key={`${u.kind}-${u.sec.id}-${u.item ? u.item.id : (u.subType || 'section')}`}
                >
                  {renderUnit(u)}
                </div>
              ))}
            </div>

            {renderFooter()}
          </div>
        ))}
      </div>
    </div>
  );
}
