import { useEffect, useRef } from 'react';
import './landing.css';

// Tiny line icons drawn for this page specifically — thin, sharp-cornered,
// closer to a rubber-stamp/form aesthetic than the rounded icon set the
// in-app chrome uses (src/editor/controls.jsx), which fits the workspace,
// not a document.
const IconCheck = (p) => (
  <svg viewBox="0 0 16 16" {...p}><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconX = (p) => (
  <svg viewBox="0 0 16 16" {...p}><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
const IconRuler = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M4 15L15 4l5 5L9 20H4v-5z" /><path d="M13 6l2 2M10 9l2 2M7 12l2 2" /></svg>
);
const IconUpload = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></svg>
);
const IconCrop = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M6 2v14a2 2 0 002 2h14" /><path d="M18 22V8a2 2 0 00-2-2H2" /></svg>
);
const IconStack = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>
);
const IconSpark = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2z" /></svg>
);

// Fires scroll-reveal once per element and never again — a quiet, single
// pass down the page rather than a replaying effect.
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.rm-land-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Landing({ onSignIn, onGetStarted, onPrivacy, onTerms }) {
  const ref = useReveal();

  // The editor workspace (.rm-app) is a fixed-height, non-scrolling shell —
  // body gets `overflow: hidden` globally for it. This page is a normal
  // scrolling document, so it opts back in for as long as it's mounted.
  useEffect(() => {
    document.body.classList.add('rm-landing-active');
    return () => document.body.classList.remove('rm-landing-active');
  }, []);

  return (
    <div className="rm-landing" ref={ref}>
      <nav className="rm-land-nav">
        <div className="rm-land-brand">
          <span className="rm-land-seal">R</span>
          Resumate
        </div>
        <div className="rm-land-nav-actions">
          <a className="rm-land-navlink" href="#how">How it works</a>
          <button className="rm-land-navlink" onClick={onSignIn}>Sign in</button>
          <button className="rm-land-btn rm-land-btn-primary rm-land-btn-sm" onClick={onGetStarted}>
            Get started
          </button>
        </div>
      </nav>

      <header className="rm-land-shell rm-land-hero">
        <div className="rm-land-hero-copy">
          <span className="rm-land-eyebrow">NIT Trichy · Placement resume format</span>
          <h1 className="rm-land-h1">
            Built to pass the<br /><em>T&amp;P check</em> the first time.
          </h1>
          <p className="rm-land-sub">
            Resumate is a resume builder that already knows the Training &amp; Placement
            office's format rules — margins, photo size, date ranges, page limits — and checks
            your resume against them as you type, so the PDF you submit is correct the first time.
          </p>
          <div className="rm-land-hero-ctas">
            <button className="rm-land-btn rm-land-btn-primary" onClick={onGetStarted}>Get started free</button>
            <a className="rm-land-btn rm-land-btn-ghost" href="#how">See how it works</a>
          </div>
          <p className="rm-land-hero-note">NO CREDIT CARD · NO DOCX WRESTLING · EXPORTS AS PDF</p>
        </div>

        <div className="rm-land-mock-wrap">
          <div className="rm-land-mock">
            <div className="rm-land-mock-head">
              <div className="rm-land-mock-photo" />
              <div>
                <div className="rm-land-mock-name">S. VENKATARAMAN</div>
                <div className="rm-land-mock-role">B.Tech Computer Science · NIT Trichy</div>
              </div>
            </div>
            <div className="rm-land-mock-lines">
              <span /><span /><span /><span />
            </div>
            <div className="rm-land-mock-row">
              <div className="rm-land-mock-col"><span /><span /><span /></div>
              <div className="rm-land-mock-col"><span /><span /><span /></div>
            </div>
            <div className="rm-land-mock-foot">
              <span>PAGE 2 OF 2</span>
              <span>RESUMATE.EXPORT</span>
            </div>

            <div className="rm-land-stamp s1"><IconCheck /> Photo in TP formals</div>
            <div className="rm-land-stamp s2"><IconCheck /> CGPA 7.52, not 07.52</div>
            <div className="rm-land-stamp s3"><IconCheck /> Jan 2026 – Mar 2026</div>
          </div>
        </div>
      </header>

      <section className="rm-land-section rm-land-reveal">
        <div className="rm-land-shell">
          <div className="rm-land-compare">
            <div className="rm-land-compare-col bad">
              <div className="rm-land-compare-label"><IconX /> What gets a resume sent back</div>
              <ul className="rm-land-compare-list">
                <li><IconX /><span>CGPA written as <b>07.52</b> instead of <b>7.52</b></span></li>
                <li><IconX /><span>"NIT Trichy" instead of the full institution name</span></li>
                <li><IconX /><span>A tenure listed as <b>Aug 2023</b> instead of a range</span></li>
                <li><IconX /><span>An empty section left as <b>"Nil"</b></span></li>
                <li><IconX /><span>A photo that doesn't fill its box, or isn't in TP formals</span></li>
                <li><IconX /><span>A resume that quietly grew to three pages on export</span></li>
              </ul>
            </div>
            <div className="rm-land-compare-col good">
              <div className="rm-land-compare-label"><IconCheck /> What Resumate catches as you type</div>
              <ul className="rm-land-compare-list">
                <li><IconCheck /><span>Every rule above, flagged inline with the exact fix</span></li>
                <li><IconCheck /><span>The same page count in the editor and the exported PDF</span></li>
                <li><IconCheck /><span>A photo already cropped to the T&amp;P guide's exact box</span></li>
                <li><IconCheck /><span>Section caps enforced — 6 projects, 4 internships, no more</span></li>
                <li><IconCheck /><span>Nothing you can't fix yourself, before you ever export</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rm-land-section rm-land-reveal">
        <div className="rm-land-shell">
          <div className="rm-land-section-head">
            <span className="rm-land-eyebrow">What's in it</span>
            <h2 className="rm-land-h2">Five things doing the actual work</h2>
            <p className="rm-land-section-sub">
              Not a generic template. Four of these exist because of a specific rule in the
              T&amp;P office's own format guide — the fifth is there to make what you actually
              wrote stronger.
            </p>
          </div>
          <div className="rm-land-features">
            <div className="rm-land-feature">
              <div className="rm-land-feature-no">01</div>
              <IconRuler className="rm-land-feature-icon" />
              <h3>Format Check</h3>
              <p>Runs the T&amp;P office's "Resume Common Mistakes" rules against your resume live — CGPA formatting, date ranges, page overflow, and more — each with the exact fix.</p>
            </div>
            <div className="rm-land-feature">
              <div className="rm-land-feature-no">02</div>
              <IconUpload className="rm-land-feature-icon" />
              <h3>Import your old resume</h3>
              <p>Upload a PDF or Word resume you already have. Every section is extracted and pre-filled — you review and edit, nothing is created without your say.</p>
            </div>
            <div className="rm-land-feature">
              <div className="rm-land-feature-no">03</div>
              <IconCrop className="rm-land-feature-icon" />
              <h3>Photo, auto-cropped</h3>
              <p>If your old resume has a photo, it's found and offered up automatically — cropped to the guide's exact 1.23in × 1.35in box, no separate editor needed.</p>
            </div>
            <div className="rm-land-feature">
              <div className="rm-land-feature-no">04</div>
              <IconStack className="rm-land-feature-icon" />
              <h3>Pixel-matched export</h3>
              <p>What you see while editing is what the PDF export produces — down to the pixel. No layout shifting, no surprise third page.</p>
            </div>
            <div className="rm-land-feature">
              <div className="rm-land-feature-no">05</div>
              <IconSpark className="rm-land-feature-icon" />
              <h3>Match a job description</h3>
              <p>Paste a JD and it rewrites your bullets with its keywords and flags what you're missing — nothing is added to your resume without your approval.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="rm-land-section rm-land-reveal">
        <div className="rm-land-shell">
          <div className="rm-land-section-head">
            <span className="rm-land-eyebrow">How it works</span>
            <h2 className="rm-land-h2">Three steps, start to submitted</h2>
          </div>
          <div className="rm-land-steps">
            <div className="rm-land-step">
              <div className="rm-land-step-num"><span>1</span> START</div>
              <h3>Start fresh, or import</h3>
              <p>Begin from a blank T&amp;P-format resume, or upload one you already have and let Resumate fill it in for you to review.</p>
            </div>
            <div className="rm-land-step">
              <div className="rm-land-step-num"><span>2</span> EDIT</div>
              <h3>Fill it in, get checked live</h3>
              <p>Edit projects, internships and skills in a normal form. Format Check flags issues the moment they appear, not after you've exported.</p>
            </div>
            <div className="rm-land-step">
              <div className="rm-land-step-num"><span>3</span> EXPORT</div>
              <h3>Export the PDF</h3>
              <p>Download a PDF that matches the editor exactly — same page count, same margins, ready to submit.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rm-land-shell rm-land-reveal">
        <div className="rm-land-facts">
          <div className="rm-land-fact">
            <div className="rm-land-fact-val">6 / 4 / 4 / 8</div>
            <div className="rm-land-fact-label">PROJECT / INTERNSHIP / POSITION / EDUCATION CAPS ENFORCED</div>
          </div>
          <div className="rm-land-fact">
            <div className="rm-land-fact-val">1.23in × 1.35in</div>
            <div className="rm-land-fact-label">PHOTO CROPPED TO THE GUIDE'S EXACT BOX</div>
          </div>
          <div className="rm-land-fact">
            <div className="rm-land-fact-val">PDF + DOCX</div>
            <div className="rm-land-fact-label">OLD RESUME FORMATS THE IMPORTER READS</div>
          </div>
          <div className="rm-land-fact">
            <div className="rm-land-fact-val">0px</div>
            <div className="rm-land-fact-label">DIFFERENCE BETWEEN EDITOR PREVIEW AND EXPORTED PDF</div>
          </div>
        </div>
      </section>

      <section className="rm-land-cta rm-land-reveal">
        <div className="rm-land-shell rm-land-cta-inner">
          <span className="rm-land-eyebrow">Placement season doesn't wait</span>
          <h2 className="rm-land-h2">Get it right before you hit export.</h2>
          <button className="rm-land-btn rm-land-btn-primary" onClick={onGetStarted}>Get started free</button>
        </div>
      </section>

      <footer className="rm-land-shell rm-land-footer">
        <span>© {new Date().getFullYear()} Resumate — built for NIT Trichy placements.</span>
        <div className="rm-land-footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); onPrivacy(); }}>Privacy</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onTerms(); }}>Terms</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Sign in</a>
        </div>
      </footer>
    </div>
  );
}
