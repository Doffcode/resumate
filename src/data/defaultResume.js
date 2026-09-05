// Default resume template + canonical section list.
//
// This is a neutral placeholder every new student starts from — deliberately
// NOT any real person's resume. It doubles as the fixture the golden-reference
// pixel check renders, so changing it means regenerating golden/.
//
// The example content is written to model the T&P guide's rules: full
// institution name, CGPA with no leading zero, capitalised first letters, and
// date ranges that fit on one line.
export const defaultResume = {
  personalInfo: {
    name: "STUDENT NAME",
    degree: "M.Tech - Data Analytics",
    gender: "Gender",
    dob: "DD/MM/YYYY",
    email: "tp@nitt.edu",
    contact: "+91-431-2501081",
    logo: "", // fallback to defaultLogo
    photo: "" // fallback to defaultPhoto
  },
  education: [
    { id: 1, year: "2027", degree: "M. Tech Data Analytics", institution: "National Institute of Technology, Tiruchirappalli", grade: "8.50*" },
    { id: 2, year: "2025", degree: "B. Tech CSE", institution: "Your Undergraduate College, City", grade: "8.20" },
    { id: 3, year: "2021", degree: "Class XII", institution: "Your Senior Secondary School, Board", grade: "90.0%" },
    { id: 4, year: "2019", degree: "Class X", institution: "Your School, Board", grade: "92.0%" }
  ],
  educationNote: "* - Upto 2nd semester",
  internships: [
    {
      id: 1,
      title: "Summer Internship, Organisation Name:",
      date: "May 2026 - Jul 2026",
      description: "Describe what you built and the technologies you used. Start with a capital letter, keep it to two or three lines, and mention the outcome rather than only the tools.",
      bullets: [],
      pageBreak: false
    }
  ],
  projects: [
    {
      id: 1,
      title: "Project Title:",
      date: "Jan 2026 - Mar 2026",
      description: "Describe the problem the project solves, the approach you took and the technologies involved. Keep the tense consistent and start with a capital letter.",
      bullets: [],
      pageBreak: false
    },
    {
      id: 2,
      title: "Second Project Title:",
      date: "Aug 2025 - Nov 2025",
      description: "A second example entry. Replace this text with your own project. Mention measurable results where you have them, such as accuracy, latency or users served.",
      bullets: [],
      pageBreak: false
    }
  ],
  skills: [
    { id: 1, label: "Programming Languages", value: "C, C++, Python, Java", pageBreak: false },
    { id: 2, label: "Engineering Software", value: "MATLAB, Google Colab", pageBreak: false },
    { id: 3, label: "Other Software", value: "Microsoft Word, PowerPoint, Excel, Visual Studio Code", pageBreak: false }
  ],
  areas: [
    { id: 1, text: "Data Structures and Algorithms", pageBreak: false },
    { id: 2, text: "Operating Systems", pageBreak: false },
    { id: 3, text: "Machine Learning", pageBreak: false }
  ],
  positions: [
    {
      id: 1,
      title: "Position Held, Club or Society:",
      date: "Nov 2025 - Jan 2026",
      description: "Describe the responsibility you held and what you organised or led. Remove this section entirely if you have none — do not write Nil.",
      bullets: [],
      pageBreak: false
    }
  ],
  extracurriculars: {
    social: [
      { id: 1, text: "Volunteered for a social initiative or community programme" },
      { id: 2, text: "Participated in a college society or cultural event" },
      { id: 3, text: "Taught or mentored students under a college outreach initiative" }
    ],
    sport: [
      { id: 1, text: "Represented the department in an inter-department tournament" },
      { id: 2, text: "Participated in an athletics or team sport event" },
      { id: 3, text: "Secured a position in an intra-college sports competition" }
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
  // default to match the target format, but can be toggled on in the editor.
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
    baseFontSize: 16, // 16px matches the original PDF's 12pt size
    // em, gap between bulleted entries — shared by every such section
    // (Projects, Internships, Positions, Areas of Interest, Skills,
    // Extracurricular Activities) so the resume stays uniformly spaced,
    // per the T&P guide's own "maintain uniform spacing" rule.
    itemSpacing: 0.8
  }
};

// All editable sections in their canonical order. Which ones render on the
// resume is controlled per-section by data.sectionVisibility.
export const allSections = [
  { id: 'education', title: 'Educational Qualification', type: 'education' },
  { id: 'internships', title: 'Internship Experience', type: 'internships' },
  { id: 'projects', title: 'Other Projects', type: 'projects' },
  { id: 'areas', title: 'Areas of Interest', type: 'areas' },
  { id: 'skills', title: 'Technical Skills and Certifications', type: 'skills' },
  { id: 'positions', title: 'Positions of Responsibility', type: 'positions' },
  { id: 'extracurriculars', title: 'Extracurricular Activities', type: 'extracurriculars' }
];

export const SCHEMA_VERSION = 1;
