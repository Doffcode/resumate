# Golden reference — the frozen PDF baseline

`golden-reference.pdf` is what Resumate must produce. Every layout change is
verified by rendering the app and pixel-diffing against `page-1.png` /
`page-2.png`. Zero diff means the layout is intact.

| File | What it is |
|---|---|
| `golden-reference.pdf` | Current baseline. sha256 `c0530798…` |
| `page-1.png`, `page-2.png` | Same, rasterised at 110 DPI — the pixel-diff targets |
| `generator/` | Superseded. The app itself now renders the baseline (it was verified 0-pixel identical to this). Kept only as history. |
| `archive/golden-v1-preguide.pdf` | The Aug 10 prototype output, before the Common Mistakes rules were applied |

Source of the rules: `../reference/Resume Common Mistakes.pdf` (T&P, 8 pages,
20 numbered rules + 3 UPDATEs).

## Rules applied in v2 (v1 → v2)

1. `NIT, Trichy` → `National Institute of Technology, Tiruchirappalli` (UPDATE 2)
2. CGPA `07.52` / `07.18` → `7.52` / `7.18`, no leading zeros (rule 11)
3. Legend `* up to 1st semester` → `* - Upto 2nd semester` (UPDATE 3)
4. Heading `Educational Qualifications` → `Educational Qualification` (singular, per all guide screenshots)
5. Photo box `30 × 38 mm` → `31.24 × 34.29 mm`, i.e. the official 1.23″ × 1.35″ (TIPS + rule 4)
6. Projects heading is now conditional — `Other Projects` only when internships
   or work experience are shown, otherwise `Projects` (rule 18).
   See `resolveSectionTitle()` in `generator/src/App.jsx`.

Page 2 was byte-identical across v1 → v2; all changes are on page 1.

## Known rule not yet satisfied

**Rule 12** — "Complete first page of resume and then only move to second page,
first page should not be half blank." The default template leaves page 1 roughly
40% empty because Areas of Interest is forced onto page 2. The app needs an
*underflow* warning next to the existing overflow warning.

## Regenerating the baseline

```bash
npm run build && npm run golden:update
```

Only when the layout change is intended. Review `golden/page-*.png` by eye
afterwards — `golden:check` passes by construction against whatever baseline
exists, so it only protects a baseline you have actually looked at.

`generator/node_modules` is a symlink to the original prototype's. If that
prototype is ever deleted, run `npm install` inside `generator/` instead.

## Fixture

The baseline renders `src/data/defaultResume.js`, a neutral placeholder
template — deliberately not any real student's resume. Changing that file
changes the golden, so regenerate and re-review when you do.
