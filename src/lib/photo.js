// Resizes a chosen image to the exact photo box the T&P guide specifies and
// returns it as a base64 JPEG for personalInfo.photo.
//
// The guide's TIPS section gives the box as 1.23in wide x 1.35in tall — the
// same ratio src/resume/resume.css uses (31.24mm x 34.29mm). Matching it here
// means the stored image already has the right aspect, so `object-fit: cover`
// in the renderer crops nothing and rule #4 ("image still not filling the
// box") cannot be failed.
//
// Output lands around 20-40 KB, which sits comfortably inside the existing
// personal_info jsonb column — no Storage bucket, no policies, no migration.

const BOX_W = 1.23;
const BOX_H = 1.35;
const OUT_W = 300;                                  // ~244 DPI at 1.23in — plenty for print
const OUT_H = Math.round((OUT_W * BOX_H) / BOX_W);  // preserves the guide's exact ratio
const MAX_BYTES = 8 * 1024 * 1024;

export class PhotoError extends Error {}

export async function fileToResizedDataUrl(file) {
  if (!file) throw new PhotoError('No image selected.');
  if (!file.type.startsWith('image/')) throw new PhotoError('Please choose an image file (JPG or PNG).');
  if (file.size > MAX_BYTES) throw new PhotoError('That image is larger than 8 MB. Please choose a smaller one.');

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new PhotoError("Couldn't read that image. Try a JPG or PNG.");
  });

  const canvas = document.createElement('canvas');
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');

  // Cover-crop: fill the box completely, centring whatever overflows, rather
  // than letterboxing — a passport photo squeezed with bars would fail the
  // same guide rule this is here to satisfy.
  const scale = Math.max(OUT_W / bitmap.width, OUT_H / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (OUT_W - w) / 2, (OUT_H - h) / 2, w, h);
  bitmap.close?.();

  return canvas.toDataURL('image/jpeg', 0.88);
}
