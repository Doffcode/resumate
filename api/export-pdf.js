// Real PDF export: authenticates as the requesting user (anon key + their own
// bearer token as a global header), so the resume fetch is RLS-scoped by
// construction — a resume that isn't theirs simply returns no rows, no
// separate ownership-check code to get wrong. Only the export_logs rate-limit
// write uses the service-role client, and only for that narrow purpose.
//
// Puppeteer never authenticates: the server fetches and verifies the data
// itself, then hands it directly to the browser via
// page.evaluateOnNewDocument before navigating to the auth-independent
// /?print=1 route (src/pages/PrintPage.jsx). No session-faking in headless
// Chrome, no second round trip.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';
import { fromRow } from '../src/shared/rowMapping.js';

export const config = { maxDuration: 30 };

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const err = (res, status, message) => res.status(status).json({ error: message });

const sanitizeFilename = (name) => {
  const parts = (name || 'Resume').trim().split(/\s+/).filter(Boolean);
  const safe = (s) => s.replace(/[^A-Za-z0-9]/g, '') || 'Resume';
  if (parts.length === 0) return 'Resume.pdf';
  if (parts.length === 1) return `${safe(parts[0])}_Resume.pdf`;
  return `${safe(parts[0])}_${safe(parts[parts.length - 1])}_Resume.pdf`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed.');

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return err(res, 401, 'Unauthorized: missing Authorization Bearer token.');

  const { resume_id } = req.body || {};
  if (!resume_id) return err(res, 400, 'Bad request: missing resume_id.');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey) return err(res, 500, 'Server misconfigured: Supabase env vars missing.');

  // Scoped as the requesting user — every query below is RLS-restricted to
  // rows they own, by construction.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return err(res, 401, 'Unauthorized: invalid or expired token.');

  const { data: row, error: fetchError } = await userClient
    .from('resumes')
    .select('*')
    .eq('id', resume_id)
    .single();
  // A resume that exists but isn't theirs is indistinguishable from one that
  // doesn't exist at all — RLS never returns the row either way. Intentional:
  // doesn't leak whether a given resume_id belongs to someone else.
  if (fetchError || !row) return err(res, 404, 'Resume not found.');

  const resumeData = fromRow(row);

  // Rate limit: fail CLOSED here (unlike the log write below) since this is
  // the actual security/cost control the limit exists for.
  const serviceClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
  if (serviceClient) {
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count, error: countError } = await serviceClient
      .from('export_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('exported_at', since);
    if (!countError && count >= RATE_LIMIT) {
      return err(res, 429, `Rate limit reached: ${RATE_LIMIT} exports per hour. Try again later.`);
    }
  }

  let browser;
  try {
    const origin = `https://${req.headers.host}`;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument((data) => {
      window.__RESUMATE_PRINT_DATA__ = data;
    }, resumeData);
    await page.goto(`${origin}/?print=1`, { waitUntil: 'networkidle0', timeout: 20000 });

    // Real content varies in how many measure-cycles it takes to settle
    // (unlike the fixed golden fixture) — poll page-count stability instead
    // of a blind fixed delay.
    let lastCount = -1;
    for (let i = 0; i < 10; i++) {
      const count = await page.$$eval('.resume-page', (els) => els.length);
      if (count > 0 && count === lastCount) break;
      lastCount = count;
      await new Promise((r) => setTimeout(r, 300));
    }

    const pdf = await page.pdf({ format: 'a4', printBackground: true, preferCSSPageSize: true });
    const filename = sanitizeFilename(resumeData.personalInfo?.name);

    // Log write: AWAITED (a fire-and-forget promise here is unreliable — a
    // serverless function can be frozen right after the response is sent,
    // before a background write ever completes). Still fails OPEN: a
    // missing/misbehaving export_logs table never blocks the export itself,
    // only the rate-limit accounting for that one call.
    if (serviceClient) {
      const { error } = await serviceClient.from('export_logs').insert({ user_id: user.id });
      if (error) console.error('export_logs insert failed:', error.message);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(Buffer.from(pdf));
  } catch (e) {
    console.error('export-pdf render failed:', e);
    return err(res, 500, 'PDF generation failed. Please try again.');
  } finally {
    if (browser) await browser.close();
  }
}
