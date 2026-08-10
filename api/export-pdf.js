// Step 1 of PDF export: proves headless Chromium actually runs inside a real
// Vercel serverless function, independent of auth or resume data. This is the
// specific risk the project's own incident log flagged as never verified —
// local dev and a real serverless cold start are not the same environment.
//
// Renders the app's ?golden=1 route (the same auth-independent, fixed-fixture
// route golden-check.mjs uses) rather than a real resume. Auth + a real
// resume_id are added once this baseline is confirmed working in production.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const started = Date.now();
  let browser;
  try {
    const origin = `https://${req.headers.host}`;
    const target = `${origin}/?golden=1`;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(target, { waitUntil: 'networkidle0', timeout: 20000 });
    // useMeasure repaginates over a few renders before settling; give it a beat.
    await new Promise((r) => setTimeout(r, 500));

    const pdf = await page.pdf({
      format: 'a4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="probe.pdf"');
    res.setHeader('X-Render-Ms', String(Date.now() - started));
    res.status(200).send(Buffer.from(pdf));
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack, ms: Date.now() - started });
  } finally {
    if (browser) await browser.close();
  }
}
