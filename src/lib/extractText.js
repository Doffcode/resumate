// Client-side text extraction from an uploaded resume.
//
// The uploaded file NEVER leaves the browser — only the extracted plain text
// is sent to the parse endpoint. These are personal resumes carrying DOB,
// phone and email, so keeping the original file local is a real privacy win,
// not just an implementation convenience.
//
// Both libraries are dynamically imported so they only download when someone
// actually opens the importer — the main bundle is unaffected.
//
// SECURITY: pdfjs-dist is pinned to >=6.2.108. Versions >=5.6.83 <6.2.108
// carry GHSA-hq66-cqwq-w95j (arbitrary JS execution when opening a malicious
// PDF), which matters enormously here because this code opens PDFs supplied
// by users. We also never render — only getTextContent() — and disable eval
// explicitly below as defence in depth.

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export class ExtractError extends Error {}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  // Vite resolves this to a hashed asset URL; without it pdf.js tries to
  // fetch a worker from a CDN path that does not exist in our build.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjs.getDocument({
      data: buf,
      isEvalSupported: false, // defence in depth against the class of bug above
      disableFontFace: true,  // we want text, never rendering
    }).promise;
  } catch {
    // pdf.js throws its own internal-sounding messages here ("Invalid PDF
    // structure.", "The PDF file is empty...") for anything from a 0-byte
    // file to a renamed non-PDF — confirmed by actually uploading both.
    // Neither means anything to a student; give them the same curated
    // message as any other unreadable file.
    throw new ExtractError("Couldn't read that PDF — it may be corrupted. Try re-exporting it and uploading again.");
  }

  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Join items with spaces, then let newlines fall where the y-position
    // changes — good enough structure for an LLM to work with.
    let lastY = null;
    let line = '';
    const lines = [];
    for (const item of content.items) {
      const y = item.transform?.[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (line.trim()) lines.push(line.trim());
        line = '';
      }
      line += item.str + ' ';
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    out += lines.join('\n') + '\n';
  }
  return out;
}

async function extractDocx(file) {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  try {
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value;
  } catch {
    throw new ExtractError("Couldn't read that Word file — it may be corrupted. Try re-saving it and uploading again.");
  }
}

export async function extractText(file) {
  if (!file) throw new ExtractError('No file selected.');
  if (file.size > MAX_BYTES) {
    throw new ExtractError('That file is larger than 10 MB. Please upload a smaller resume.');
  }

  const name = (file.name || '').toLowerCase();
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx');

  let text;
  if (isPdf) text = await extractPdf(file);
  else if (isDocx) text = await extractDocx(file);
  else if (name.endsWith('.doc')) {
    throw new ExtractError('Old .doc files are not supported. Save it as .docx or PDF and try again.');
  } else {
    throw new ExtractError('Please upload a PDF or a Word (.docx) file.');
  }

  // A scanned/photographed resume is a valid PDF with no text layer at all.
  // Say so plainly instead of sending an empty string to the model and
  // getting back confident nonsense.
  if (!text || text.replace(/\s/g, '').length < 50) {
    throw new ExtractError(
      "Couldn't read any text from that file. If it's a scan or photo of a printed resume, " +
      'we can only read files that contain real text — try the original PDF or Word file.'
    );
  }

  return text.trim();
}
