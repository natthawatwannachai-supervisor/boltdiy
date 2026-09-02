import imageCompression from 'browser-image-compression';
import { IMAGE_TARGET_MAX_KB, IMAGE_TARGET_MIN_KB } from '@/config/constants';

const KB = 1024;

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  /** Percentage saved versus the original, 0 when the file grew. */
  saved: number;
}

export const formatBytes = (bytes: number): string => {
  if (bytes < KB) {
    return `${bytes} B`;
  }

  if (bytes < KB * KB) {
    return `${(bytes / KB).toFixed(0)} KB`;
  }

  return `${(bytes / (KB * KB)).toFixed(2)} MB`;
};

/**
 * Compresses an image into the 200–300 KB window the office requires.
 *
 * `browser-image-compression` only enforces an upper bound, so a photo that
 * lands well under 200 KB is re-encoded at progressively higher quality and
 * the largest result that still fits under 300 KB wins. Images that are
 * already small enough are returned untouched — re-encoding them would only
 * lose detail.
 */
export async function compressToTarget(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<CompressionResult> {
  const originalSize = file.size;
  const maxBytes = IMAGE_TARGET_MAX_KB * KB;
  const minBytes = IMAGE_TARGET_MIN_KB * KB;

  if (originalSize <= maxBytes) {
    onProgress?.(100);

    return { file, originalSize, compressedSize: originalSize, saved: 0 };
  }

  const baseOptions = {
    maxSizeMB: IMAGE_TARGET_MAX_KB / 1024,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    onProgress,
  };

  let best = await imageCompression(file, { ...baseOptions, initialQuality: 0.8 });

  // Nudge the quality up while we are still leaving headroom under 300 KB.
  for (const quality of [0.9, 0.95]) {
    if (best.size >= minBytes) {
      break;
    }

    try {
      const candidate = await imageCompression(file, { ...baseOptions, initialQuality: quality });

      if (candidate.size <= maxBytes && candidate.size > best.size) {
        best = candidate;
      }
    } catch {
      // A failed refinement pass is not fatal — keep the result we have.
      break;
    }
  }

  const renamed = new File([best], replaceExtension(file.name, 'jpg'), {
    type: best.type || 'image/jpeg',
    lastModified: Date.now(),
  });

  onProgress?.(100);

  return {
    file: renamed,
    originalSize,
    compressedSize: renamed.size,
    saved: Math.max(0, Math.round((1 - renamed.size / originalSize) * 100)),
  };
}

function replaceExtension(name: string, extension: string): string {
  return `${name.replace(/\.[^./\\]+$/, '')}.${extension}`;
}

/** Converts a canvas data URL into a File ready for Firebase Storage. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, base64] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
}

/**
 * Shrinks a signature while preserving its alpha channel (PNG in, PNG out) so
 * it still sits transparently on the PDF.
 */
export async function compressSignature(file: File): Promise<File> {
  if (file.size <= 120 * KB) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.12,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/png',
  });

  return new File([compressed], replaceExtension(file.name, 'png'), { type: 'image/png' });
}
