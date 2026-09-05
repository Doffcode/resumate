# Resumate

A resume builder for NIT Trichy students. Fills in the official placement-format
resume, exports a pixel-perfect PDF, and includes an AI assistant that matches
a pasted job description against the student's saved projects.

Live: https://resumate-six-kappa.vercel.app

## The one idea this project is built around

The PDF layout is **frozen**. `golden/golden-reference.pdf` is what the app must
produce, and `npm run golden:check` renders the app with headless Chrome and
pixel-diffs it against `golden/page-*.png`. Zero differing pixels or the check
fails.

That turns "does the layout still match?" from a judgement call into a test, so
the UI can be rewritten freely without anyone re-chasing millimetres.

```bash
npm install
npm run dev            # http://localhost:5180
npm run build
npm run golden:check   # must print PASS
```

`golden:check` needs `google-chrome-stable`, `pdftoppm` (poppler-utils) and
Python with Pillow.

## Layout

| Path | What it is |
|---|---|
| `src/resume/` | **Sealed renderer.** Components take data as props and return markup — no editor state, no theme, no app awareness. The same components render the on-screen preview, the print-only route, and the server-side PDF, which is what makes pixel parity structural. |
| `src/pagination/` | `paginate.js` is pure (units + measured heights → pages, no React, no DOM). `useMeasure.js` does the measuring. |
| `src/pages/` | Route-level screens: `AuthScreen`, `Dashboard`, `EditorPage`, `PrintPage` (auth-independent, used by `?golden=1`/`?print=1`), `Settings`, `Privacy`, `Terms`, `AdminDashboard`. `App.jsx` routes between them with plain state — no router dependency. |
| `src/editor/` | The editor UI (sections, page-break inserters, Format Check panel) and `editor.css` — all app chrome, scoped under `.rm-*` classes, never touching `.resume-*`. |
| `src/ai/` | The AI assistant panel, wired to the recovered `match-jd` Edge Function. |
| `src/auth/`, `src/data/`, `src/lib/`, `src/shared/` | Supabase auth, resume list/CRUD, the Supabase client, and `rowMapping.js` (camelCase ⇄ snake_case, isomorphic — imported by both the Vite client and the plain-Node `api/` functions). |
| `api/` | Vercel serverless functions: `export-pdf.js` (real PDF export), `delete-account.js`, `admin-stats.js`, `admin-user/[id].js`. |
| `golden/` | The frozen baseline and its generator. See `golden/README.md`. |
| `reference/` | Pristine snapshot of the original prototype, plus the T&P "Resume Common Mistakes" PDF the format rules come from. |
| `mockups/` | The original clickable UI mockup. Superseded by the real app; kept for history. |
| `schema.sql` | Source of truth for the database schema. Schema changes land here, get reviewed, then the owner applies them by hand — never run directly by an agent. |
| `scripts/golden-check.mjs`, `scripts/golden-update.mjs` | The pixel-diff guard and the tool to regenerate the baseline when a layout change is intentional. |

## Rules from the T&P guide

`reference/Resume Common Mistakes.pdf` lists 20 numbered rules, all now
enforced one of three ways:

- **Impossible to fail** — fonts, sizes, the full-bleed black line, red-rule
  geometry, section spacing, photo box aspect. Live in the sealed renderer.
- **Checked and auto-fixable** — `src/validate/rules.js` (Format Check panel):
  leading zeros on CGPA, institution name, legend wording, empty/`~Nil~`
  sections. One click fixes each.
- **Needs judgement** — "copied from ChatGPT", photo in TP formals. Advisory
  nudges in the same panel.

Rule #18 ("Other Projects" vs "Projects") is render logic:
`resolveSectionTitle()` in `src/resume/text.jsx`.

## Status

**Working end-to-end, verified against the live deployment and database —
not just built:**
- Sealed renderer at 0-pixel parity with the golden reference.
- Full editor: sections, page-break inserters, Format Check.
- Supabase auth + per-resume storage (sign up/in, multi-resume dashboard,
  create/rename/delete, autosave — all confirmed via direct DB queries).
- AI assistant: calls Google's Gemini API (`gemini-2.0-flash`, free tier),
  all four suggestion actions (Replace/Keep Both/Add to Skills/confirm-and-add)
  verified to persist. Switched from DeepSeek after its account ran out of
  paid credits (402) — Gemini's free tier covers current usage.
- PDF export: real auth, real resume data, rate limiting. Verified against a
  real Vercel serverless deployment — cold ~4.9s, warm ~2.7s render times —
  and the RLS-based security model was tested, not assumed (a second test
  user requesting the first user's resume_id gets 404). The 5/hour rate
  limit was pushed to its actual boundary and correctly returned 429 on the
  6th call, with export_logs confirmed populating in the database.
- Privacy policy, terms, self-service account+data deletion. Deletion is
  real, not data-only: a disposable test account was deleted, then a
  sign-in attempt with the same credentials correctly failed with
  `invalid_credentials` — the login itself is gone, not just the resumes.
- Mobile responsive pass: drawer sidebar, scrollable topbar, horizontally
  scrollable A4 preview, zero page-level overflow on every screen.
- Admin dashboard: counters, 30-day chart, per-user drill-down. Negative
  paths (401/403) verified against the live deployment.

`SUPABASE_SERVICE_ROLE_KEY` in Vercel was originally the legacy `eyJ...` JWT
format, which this project rejects ("Legacy API keys are disabled" — this
silently blocked rate-limit enforcement, real account deletion, and admin
reads until it was replaced with the `sb_secret_...` key. All three were
retested end-to-end afterward and now work for real.

**Explicitly deferred, not started:** Google OAuth (email/password only for
now), a second (Render/Railway) PDF-export fallback host beyond Vercel +
`window.print()`.

## Standing rules for anyone working on this

1. Never alter the live database directly. Schema changes go through
   `schema.sql`, proposed for review, then applied by a migration the owner runs.
2. Never hardcode or inline a credential. Any string starting with `sbp_`,
   `sb_secret_`, `eyJ`, or `sk-` appearing in output is a stop-and-rotate signal.
3. No unplanned schema changes — propose and wait.
4. "Done" means manually verified in the running app, with real output shown.
   "The build passed" is not the same thing.
5. Don't build automatic recovery/sync/claim mechanisms to paper over a bug.
   Find the root cause.
6. Keep each change tightly scoped; don't touch verified, unrelated code.
