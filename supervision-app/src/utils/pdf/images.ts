export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
}

/**
 * Fetches an image and hands jsPDF something it can embed.
 *
 * SVG (the default logo) is rasterised through a canvas first, because
 * `addImage` only understands PNG/JPEG. Firebase Storage download URLs are
 * fetched as blobs, which keeps the canvas untainted and works as long as the
 * bucket's CORS config allows the app origin (see `storage.cors.json`).
 */
export async function loadImage(url: string, rasterSize = 512): Promise<LoadedImage | null> {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();

    if (blob.type.includes('svg')) {
      return rasterise(URL.createObjectURL(blob), rasterSize, true);
    }

    const dataUrl = await blobToDataUrl(blob);
    const { width, height } = await measure(dataUrl);

    return {
      dataUrl,
      width,
      height,
      format: blob.type.includes('png') ? 'PNG' : 'JPEG',
    };
  } catch (error) {
    console.warn('[pdf] could not load image', url, error);

    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function measure(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

/** Draws a (vector) image onto a canvas and returns a PNG data URL. */
function rasterise(src: string, size: number, revoke = false): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const ratio = image.naturalWidth && image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 1;
      const width = ratio >= 1 ? size : Math.round(size * ratio);
      const height = ratio >= 1 ? Math.round(size / ratio) : size;
      const canvas = document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);

      if (revoke) {
        URL.revokeObjectURL(src);
      }

      resolve({ dataUrl: canvas.toDataURL('image/png'), width, height, format: 'PNG' });
    };

    image.onerror = (event) => {
      if (revoke) {
        URL.revokeObjectURL(src);
      }

      reject(event);
    };

    image.src = src;
  });
}

/** Fits `image` inside a box while preserving its aspect ratio. */
export function fitInside(
  image: { width: number; height: number },
  boxWidth: number,
  boxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(boxWidth / image.width, boxHeight / image.height);

  return { width: image.width * scale, height: image.height * scale };
}
