// Renders the built app to PDF with headless Chrome and pixel-diffs each page
// against golden/page-N.png. Exits non-zero on any difference.
//
//   npm run build && npm run golden:check
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8907;
const CHROME = process.env.CHROME_BIN || 'google-chrome-stable';
const TOLERANCE = Number(process.env.GOLDEN_TOLERANCE || 0); // allowed differing pixels per page

if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'golden-'));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', join(ROOT, 'dist')], {
  stdio: 'ignore',
});

const cleanup = () => { server.kill(); rmSync(work, { recursive: true, force: true }); };
process.on('exit', cleanup);

await new Promise((r) => setTimeout(r, 1500));

const pdf = join(work, 'candidate.pdf');
execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  // Own profile dir: a shared default profile can lock and hang the run.
  `--user-data-dir=${join(work, 'chrome-profile')}`,
  '--virtual-time-budget=10000', '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer', `--print-to-pdf=${pdf}`,
  `http://localhost:${PORT}/?golden=1`, // bypass auth: render the sealed default fixture
], { stdio: 'ignore' });

execFileSync('pdftoppm', ['-png', '-r', '110', pdf, join(work, 'cand')]);

const py = `
import sys, glob, os
from PIL import Image, ImageChops
work, root, tol = sys.argv[1], sys.argv[2], int(sys.argv[3])
cand = sorted(glob.glob(os.path.join(work, 'cand-*.png')))
gold = sorted(glob.glob(os.path.join(root, 'golden', 'page-*.png')))
if len(cand) != len(gold):
    print(f'FAIL page count: candidate {len(cand)}, golden {len(gold)}'); sys.exit(1)
bad = 0
for c, g in zip(cand, gold):
    a, b = Image.open(g).convert('RGB'), Image.open(c).convert('RGB')
    if a.size != b.size:
        print(f'FAIL {os.path.basename(g)}: size {b.size} != golden {a.size}'); bad += 1; continue
    d = ImageChops.difference(a, b)
    n = sum(1 for p in d.getdata() if p != (0, 0, 0))
    total = a.size[0] * a.size[1]
    if n > tol:
        print(f'FAIL {os.path.basename(g)}: {n} differing px ({100*n/total:.3f}%), bbox {d.getbbox()}'); bad += 1
    else:
        print(f'  ok {os.path.basename(g)}: {n} differing px')
sys.exit(1 if bad else 0)
`;

try {
  execFileSync('python3', ['-c', py, work, ROOT, String(TOLERANCE)], { stdio: 'inherit' });
  console.log('\nPASS — output matches the golden reference.');
  process.exit(0); // the http.server child would otherwise hold the process open
} catch {
  console.error('\nFAIL — layout drifted from the golden reference.');
  process.exit(1);
}
