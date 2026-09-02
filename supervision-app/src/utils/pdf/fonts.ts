import type jsPDF from 'jspdf';

/**
 * jsPDF's built-in fonts have no Thai glyphs — Thai text comes out as boxes or
 * mangled Latin. Sarabun (the Thai government's standard document face) is
 * shipped in `public/fonts` and registered into each document's virtual file
 * system before anything is written.
 */

export const THAI_FONT = 'Sarabun';

const FONT_FILES = {
  normal: '/fonts/Sarabun-Regular.ttf',
  bold: '/fonts/Sarabun-Bold.ttf',
} as const;

type Style = keyof typeof FONT_FILES;

const cache = new Map<Style, string>();

/** ArrayBuffer -> base64, chunked so large fonts don't blow the call stack. */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }

  return btoa(binary);
}

async function fetchFont(style: Style): Promise<string> {
  const cached = cache.get(style);

  if (cached) {
    return cached;
  }

  const response = await fetch(FONT_FILES[style]);

  if (!response.ok) {
    throw new Error(`ไม่พบไฟล์ฟอนต์ ${FONT_FILES[style]} (HTTP ${response.status})`);
  }

  const base64 = toBase64(await response.arrayBuffer());

  cache.set(style, base64);

  return base64;
}

/**
 * Registers Sarabun (regular + bold) and makes it the active font.
 * Returns false when the font files are missing, so callers can warn the user
 * that the PDF will fall back to a non-Thai face instead of failing silently.
 */
export async function registerThaiFont(doc: jsPDF): Promise<boolean> {
  try {
    const [regular, bold] = await Promise.all([fetchFont('normal'), fetchFont('bold')]);

    doc.addFileToVFS('Sarabun-Regular.ttf', regular);
    doc.addFont('Sarabun-Regular.ttf', THAI_FONT, 'normal');

    doc.addFileToVFS('Sarabun-Bold.ttf', bold);
    doc.addFont('Sarabun-Bold.ttf', THAI_FONT, 'bold');

    doc.setFont(THAI_FONT, 'normal');

    return true;
  } catch (error) {
    console.error('[pdf] Thai font registration failed', error);
    doc.setFont('helvetica', 'normal');

    return false;
  }
}

/** Pre-warms the font cache so the first export is not the slow one. */
export function preloadThaiFont(): void {
  void Promise.all([fetchFont('normal'), fetchFont('bold')]).catch(() => undefined);
}
