# Resumate

A resume builder for NIT Trichy students. Fills in the official placement-format
resume, exports a pixel-perfect PDF, and (later) matches a pasted job description
against the student's saved projects.

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
| `src/resume/` | **Sealed renderer.** Components take data as props and return markup — no editor state, no theme, no app awareness. The same components render the on-screen preview and the server-side PDF, which is what makes pixel parity structural. |
| `src/pagination/` | `paginate.js` is pure (units + measured heights → pages, no React, no DOM). `useMeasure.js` does the measuring. |
| `src/data/` | Default template + the canonical section list. |
| `golden/` | The frozen baseline, its generator, and the archived pre-guide version. See `golden/README.md`. |
| `reference/` | Pristine snapshot of the original prototype, plus the T&P "Resume Common Mistakes" PDF the format rules come from. |
| `mockups/` | Clickable UI mockup (Dashboard / Editor / AI panel). Open `editor.html` directly. |
| `scripts/golden-check.mjs` | The pixel-diff guard. |

## Rules from the T&P guide

`reference/Resume Common Mistakes.pdf` lists 20 numbered rules. They split three
ways:

- **Impossible to fail** — fonts, sizes, the full-bleed black line, red-rule
  geometry, section spacing. These live in the sealed renderer, so a student
  cannot get them wrong.
- **Auto-fixable** — leading zeros on CGPA, capitalised first letters,
  institution name, `~Nil~` sections, missing date ranges, NIMCET rank. These
  belong in the planned Format Check validator, *not* in the default data.
- **Needs judgement** — "copied from ChatGPT", photo in TP formals, overall
  professionalism. Advisory nudges only.

One rule is implemented as render logic today: `resolveSectionTitle()` in
`src/resume/text.jsx` returns "Other Projects" only when internships or work
experience are shown, otherwise "Projects" (rule #18).

## Status

Done: sealed renderer ported and verified at 0-pixel parity, pure pagination,
golden-check guard, UI mockup.

Not started: editor UI, Supabase (auth + multi-resume storage), PDF export
service, Format Check validator, AI JD-matching, admin dashboard, mobile pass.

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
