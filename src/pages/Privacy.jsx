import { Icon, icons } from '../editor/controls.jsx';

export default function Privacy({ onBack }) {
  return (
    <div className="rm-dash">
      <header className="rm-topbar">
        <button className="rm-iconbtn" onClick={onBack} title="Back"><Icon d={icons.back} size={16} /></button>
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
      </header>
      <div className="rm-dash-body">
        <div className="rm-dash-inner rm-legal" style={{ maxWidth: 640 }}>
          <h1>Privacy Policy</h1>
          <p className="rm-hint">Last updated: this is a free tool built for NIT Trichy students, not a commercial product — this policy is intentionally short.</p>

          <h2>What we store</h2>
          <p>Your account email, and the resume content you enter: personal details, education, projects, skills and similar fields. Nothing else is collected.</p>

          <h2>Where it's stored</h2>
          <p>In a Supabase (PostgreSQL) database. Access is restricted so you can only ever read or write your own resumes — not other students'.</p>

          <h2>The AI assistant</h2>
          <p>If you use it, the text of your resume and any job description you paste is sent to Google's Gemini API to generate suggestions. Nothing is sent unless you explicitly use that feature, and suggestions are never applied without you clicking to accept them.</p>

          <h2>Importing an old resume</h2>
          <p>If you import an existing resume, the file itself never leaves your browser — it is read on your own device, and only the extracted plain text is sent to Google's Gemini API to work out which parts go where. Nothing is saved until you review the result and choose to create the resume.</p>

          <h2>Your photo</h2>
          <p>If you upload a passport photo it is resized in your browser and stored with your resume data, the same as any other field. It is only ever used to render your own resume.</p>

          <h2>Exported PDFs</h2>
          <p>Generated on demand and returned directly to you. They are not stored anywhere after the export completes.</p>

          <h2>Deleting your data</h2>
          <p>Account Settings has a "Delete my account and all data" option that permanently removes your login and every resume you've created.</p>

          <h2>Contact</h2>
          <p>Questions about this policy can be raised through the Department of Training and Placement, NIT Trichy.</p>
        </div>
      </div>
    </div>
  );
}
