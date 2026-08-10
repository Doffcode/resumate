// Default resume template + canonical section list.
// Per-student content lives in the database; this is only the empty-state seed.
export const defaultResume = {
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
