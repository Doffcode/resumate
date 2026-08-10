// Regenerates the golden baseline from the CURRENT build.
//
//   npm run build && npm run golden:update
//
// Only run this when the layout change is intended. Afterwards `golden:check`
// passes by construction, so review the new golden/page-*.png by eye before
// committing — the check can only catch drift from a baseline you trust.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8908;
const CHROME = process.env.CHROME_BIN || 'google-chrome-stable';

if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'golden-up-'));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', join(ROOT, 'dist')], {
  stdio: 'ignore',
});
process.on('exit', () => { server.kill(); rmSync(work, { recursive: true, force: true }); });

await new Promise((r) => setTimeout(r, 1500));

const pdf = join(ROOT, 'golden', 'golden-reference.pdf');
execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--user-data-dir=${join(work, 'chrome-profile')}`,
  '--virtual-time-budget=10000', '--run-all-compositor-stages-before-draw',
  '--no-pdf-header-footer', `--print-to-pdf=${pdf}`,
  `http://localhost:${PORT}/?golden=1`, // bypass auth: render the sealed default fixture
], { stdio: 'ignore' });

// Clear stale page-N.png first so a page-count drop cannot leave orphans behind.
execFileSync('bash', ['-c', `rm -f '${join(ROOT, 'golden')}'/page-*.png`]);
execFileSync('pdftoppm', ['-png', '-r', '110', pdf, join(ROOT, 'golden', 'page')]);

const sha = execFileSync('sha256sum', [pdf]).toString().split(' ')[0];
console.log(`golden-reference.pdf regenerated\n  sha256 ${sha}`);
console.log('Review golden/page-*.png before committing.');
process.exit(0);
