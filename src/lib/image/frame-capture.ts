/**
 * Utilitas untuk menangkap frame foto dari HTMLVideoElement aktif.
 * Sesuai Rules #7 (Image Processing Rules):
 * - Menggunakan resolusi video asli, bukan ukuran viewport (Rule #7.5)
 * - Memperhatikan aspect ratio foto asli (Rule #7.4)
 * - Menghasilkan originalBlob dan thumbnailBlob terpisah tanpa overwrite (Rule #7.1-7.2)
 * - Error handling eksplisit bila toBlob gagal atau video belum siap (Rule #7.7)
 */

export interface CapturedFrameResult {
  status: "success" | "error";
  originalBlob?: Blob;
  thumbnailBlob?: Blob;
  width?: number;
  height?: number;
  errorMessage?: string;
}

export type CanvasCreator = (
  width: number,
  height: number,
) => {
  width: number;
  height: number;
  getContext(contextId: "2d"): { drawImage: (...args: unknown[]) => void } | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
};

// Nilai HTMLMediaElement.HAVE_CURRENT_DATA per spec (=2), ditulis sebagai
// literal agar tidak bergantung pada global HTMLMediaElement yang tidak ada
// di environment test Node (bukan browser/jsdom).
const HAVE_CURRENT_DATA = 2;

function defaultCanvasCreator(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export interface CaptureVideoFrameOptions {
  outputType?: string;
  outputQuality?: number;
  thumbnailMaxDimension?: number;
  canvasCreator?: CanvasCreator;
}

/**
 * Menangkap frame langsung dari video stream kamera aktif.
 */
export async function captureVideoFrame(
  video: HTMLVideoElement,
  options: CaptureVideoFrameOptions = {},
): Promise<CapturedFrameResult> {
  const {
    outputType = "image/jpeg",
    outputQuality = 0.92,
    thumbnailMaxDimension = 320,
    canvasCreator = defaultCanvasCreator,
  } = options;

  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height || width <= 0 || height <= 0) {
    return {
      status: "error",
      errorMessage: "Dimensi video kamera belum tersedia (video belum aktif).",
    };
  }

  // Guard defensif: videoWidth/videoHeight bisa sudah terisi (dari event
  // loadedmetadata) SEBELUM frame pertama benar-benar ter-decode/tampil.
  // drawImage() pada video dalam kondisi ini menghasilkan Blob JPEG yang
  // VALID ukurannya tapi ISI-nya hitam polos — bukan error, jadi harus
  // dicegah eksplisit di sini (rules #7.7), bukan cuma diandalkan dari
  // use-camera.ts menunda status "ready" (lapisan pertahanan kedua).
  if (video.readyState < HAVE_CURRENT_DATA) {
    return {
      status: "error",
      errorMessage: "Kamera belum benar-benar siap. Coba lagi sesaat.",
    };
  }

  // 1. Render frame asli ke canvas utama
  const canvas = canvasCreator(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return {
      status: "error",
      errorMessage: "Gagal membuat Canvas 2D context untuk capture foto.",
    };
  }

  ctx.drawImage(video, 0, 0, width, height);

  // 2. Export original blob
  const originalBlob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), outputType, outputQuality);
    } catch {
      resolve(null);
    }
  });

  if (!originalBlob) {
    return {
      status: "error",
      errorMessage: "Gagal meng-encode frame asli foto (toBlob null).",
    };
  }

  // 3. Buat thumbnail berukuran ringan untuk performa galeri drawer
  let thumbnailBlob: Blob = originalBlob;
  try {
    const scale = Math.min(1, thumbnailMaxDimension / Math.max(width, height));
    const thumbWidth = Math.round(width * scale);
    const thumbHeight = Math.round(height * scale);

    const thumbCanvas = canvasCreator(thumbWidth, thumbHeight);
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext("2d");

    if (thumbCtx) {
      thumbCtx.drawImage(canvas as unknown as CanvasImageSource, 0, 0, thumbWidth, thumbHeight);
      const generatedThumb = await new Promise<Blob | null>((resolve) => {
        thumbCanvas.toBlob((b) => resolve(b), "image/jpeg", 0.75);
      });
      if (generatedThumb) {
        thumbnailBlob = generatedThumb;
      }
    }
  } catch {
    // Fallback: jika pembuatan thumbnail gagal, gunakan originalBlob
  }

  return {
    status: "success",
    originalBlob,
    thumbnailBlob,
    width,
    height,
  };
}
