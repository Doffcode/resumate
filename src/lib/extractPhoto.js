// Finds a candidate passport photo among the images embedded in an uploaded
// resume. Best-effort only — this never blocks the text-based import if it
// finds nothing or throws; callers must treat a null/empty result as normal.
//
// Both APIs here were verified against real fixtures before this was written
// (not assumed from docs, which drift across pdf.js releases in particular):
//   - pdf.js 6.2.108 resolves an embedded image's `bitmap` as either an
//     ImageBitmap or a VideoFrame depending on how it was encoded in the PDF
//     (confirmed against a real NIT student resume: the JPEG photo resolved
//     as a VideoFrame, the PNG logo as an ImageBitmap). Both implement
//     CanvasImageSource, so drawImage() works on either without branching.
//   - mammoth's images.imgElement callback fires once per embedded image
//     with base64 + contentType, confirmed against the real T&P .docx
//     template.

const MIN_DIMENSION = 90;      // drop tiny decorative/bullet images
const LOGO_ASPECT_TOLERANCE = 0.12; // NITT logo ships square (217x216, ~1.0)

// A passport photo is portrait; the institution logo is square. This isn't
// perfect, but on the real fixture tested it cleanly separated a 261x334
// photo (aspect 0.78) from a 217x216 logo (aspect 1.0).
function looksLikeLogo(width, height) {
  return Math.abs(width / height - 1) < LOGO_ASPECT_TOLERANCE;
}

function scoreAsPhoto(width, height) {
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) return -1;
  if (looksLikeLogo(width, height)) return -1;
  const aspect = width / height;
  if (aspect >= 1) return -1; // never portrait -> not a photo
  // Closer to a typical passport-photo ratio (~0.75-0.85) scores higher.
  const distanceFromTypical = Math.abs(aspect - 0.8);
  return width * height - distanceFromTypical * 100000;
}

async function bitmapToDataUrl(bitmap, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.9);
}

async function findPdfPhoto(file) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf, isEvalSupported: false }).promise;
  const OPS = pdfjs.OPS;

  const getObj = (objs, name) => new Promise((resolve) => {
    if (objs.has(name)) resolve(objs.get(name));
    else objs.get(name, resolve);
  });

  let best = null;
  // Resumes are 1-2 pages; scanning all of them is cheap and a photo could
  // in principle sit on either.
  for (let pageNum = 1; pageNum <= Math.min(doc.numPages, 3); pageNum++) {
    const p = await doc.getPage(pageNum);
    const opList = await p.getOperatorList();
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      if (fn !== OPS.paintImageXObject && fn !== OPS.paintJpegXObject) continue;
      const name = opList.argsArray[i][0];
      const obj = await getObj(p.objs, name).catch(() => null);
      if (!obj?.bitmap || !obj.width || !obj.height) continue;
      const score = scoreAsPhoto(obj.width, obj.height);
      if (score > (best?.score ?? -1)) {
        best = { score, bitmap: obj.bitmap, width: obj.width, height: obj.height };
      } else {
        obj.bitmap.close?.();
      }
    }
  }
  if (!best) return null;
  return bitmapToDataUrl(best.bitmap, best.width, best.height);
}

async function findDocxPhoto(file) {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();

  const candidates = [];
  await mammoth.convertToHtml(
    { arrayBuffer: buf },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64');
        candidates.push({ contentType: image.contentType, base64 });
        return { src: '' }; // discarded — only extractText.js's own call produces the text we keep
      }),
    }
  );
  if (candidates.length === 0) return null;

  // Measure each candidate to apply the same photo-vs-logo heuristic used
  // for PDFs — mammoth gives bytes, not dimensions, so decode first.
  let best = null;
  for (const c of candidates) {
    const dataUrl = `data:${c.contentType};base64,${c.base64}`;
    const bitmap = await fetch(dataUrl).then((r) => r.blob()).then((b) => createImageBitmap(b)).catch(() => null);
    if (!bitmap) continue;
    const score = scoreAsPhoto(bitmap.width, bitmap.height);
    if (score > (best?.score ?? -1)) {
      best?.bitmap.close?.();
      best = { score, bitmap, width: bitmap.width, height: bitmap.height };
    } else {
      bitmap.close?.();
    }
  }
  if (!best) return null;
  return bitmapToDataUrl(best.bitmap, best.width, best.height);
}

// Returns a data URL for the best photo-like candidate found, or null if
// none was found or extraction failed for any reason. Never throws — a
// photo miss must never block the text-based import, which is the feature
// that actually matters.
export async function findEmbeddedPhoto(file) {
  try {
    const name = (file.name || '').toLowerCase();
    if (file.type === 'application/pdf' || name.endsWith('.pdf')) return await findPdfPhoto(file);
    if (name.endsWith('.docx')) return await findDocxPhoto(file);
    return null;
  } catch (e) {
    console.warn('Photo extraction skipped:', e.message);
    return null;
  }
}
