import { DIARY_PHOTO_MAX_BYTES, DIARY_THUMB_MAX_CHARS } from './siteData.js';

// Phone photos are often 3–12 MB. They are re-encoded as JPEG in the browser so each photo fits in a single
// Firestore document (≤ 900 KiB) and carries a small inline thumbnail for the diary list.
const SIZES = [[2048, 0.85], [1600, 0.82], [1600, 0.7], [1280, 0.7], [1024, 0.65], [800, 0.6]];
const THUMBS = [[320, 0.72], [240, 0.6], [160, 0.5]];

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() };
    } catch { /* Fall back to an <img> element, which some browsers decode more broadly. */ }
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try { await image.decode(); }
  catch { URL.revokeObjectURL(url); throw new Error(`${file.name || 'Photo'}: this image format cannot be read on this device. Use a JPEG or PNG photo.`); }
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

function draw({ source, width, height }, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff'; // JPEG has no transparency; keep transparent PNG areas white rather than black.
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}
const toBlob = (canvas, quality) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The photo could not be prepared.')), 'image/jpeg', quality));

/** Resizes a selected photo to a JPEG under the Firestore limit and builds its thumbnail data URL. */
export async function preparePhoto(file) {
  const image = await decode(file);
  try {
    if (!image.width || !image.height) throw new Error(`${file.name || 'Photo'}: the image has no visible size.`);
    let result = null;
    for (const [edge, quality] of SIZES) {
      const canvas = draw(image, edge);
      const blob = await toBlob(canvas, quality);
      if (blob.size <= DIARY_PHOTO_MAX_BYTES) { result = { blob, width: canvas.width, height: canvas.height }; break; }
    }
    if (!result) throw new Error(`${file.name || 'Photo'}: the photo could not be reduced below 900 KB.`);
    let thumb = '';
    for (const [edge, quality] of THUMBS) {
      thumb = draw(image, edge).toDataURL('image/jpeg', quality);
      if (thumb.length <= DIARY_THUMB_MAX_CHARS) break;
    }
    if (!thumb.startsWith('data:image/jpeg;base64,') || thumb.length > DIARY_THUMB_MAX_CHARS) throw new Error(`${file.name || 'Photo'}: the preview could not be created.`);
    const base = (file.name || 'site-photo').replace(/\.[^.]+$/, '').slice(0, 180) || 'site-photo';
    return { ...result, thumb, name: `${base}.jpg` };
  } finally { image.release(); }
}
