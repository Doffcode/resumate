import { Icon, icons } from '../editor/controls.jsx';

export default function Terms({ onBack }) {
  return (
    <div className="rm-dash">
      <header className="rm-topbar">
        <button className="rm-iconbtn" onClick={onBack} title="Back"><Icon d={icons.back} size={16} /></button>
        <div className="rm-brand"><span className="rm-mark">R</span>Resumate</div>
      </header>
      <div className="rm-dash-body">
        <div className="rm-dash-inner rm-legal" style={{ maxWidth: 640 }}>
          <h1>Terms of Service</h1>
          <p className="rm-hint">A free, non-commercial tool built for NIT Trichy students — these terms are intentionally short.</p>

          <h2>What this is</h2>
          <p>Resumate helps you build a resume in the NIT Trichy placement format and export it as a PDF. It's provided as-is, free of charge, with no guarantee of uptime or availability.</p>

          <h2>Your responsibility</h2>
          <p>Everything you put on your resume — including anything added or edited via the AI assistant — is your responsibility. Suggestions are never applied automatically; you choose what goes on your resume, and you should only include work you can genuinely speak to.</p>

          <h2>Accounts</h2>
          <p>You're responsible for keeping your account credentials to yourself. One account is meant for one person.</p>

          <h2>Format accuracy</h2>
          <p>The layout follows the NIT Trichy Training &amp; Placement office's published format as closely as possible, but this is not an official tool of the department — always check your final PDF yourself before submitting it.</p>

          <h2>Changes</h2>
          <p>This tool may change or be discontinued at any time without notice.</p>
        </div>
      </div>
    </div>
  );
}
