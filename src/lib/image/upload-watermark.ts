/**
 * Pipeline watermark untuk foto yang diunggah dari galeri perangkat (bukan frame kamera).
 * Memakai renderWatermark yang sama dengan capture kamera, sehingga layout portrait/landscape
 * ditentukan dari ukuran gambar hasil decode (sudah memperhitungkan rotasi EXIF).
 */
import type { MetadataSnapshot } from "@/types/metadata";
import type { WatermarkVisualSettings } from "@/types/watermark";
import { renderWatermark } from "./watermark-engine";
import { loadImageFromUrl } from "@/lib/browser/load-image";

const THUMBNAIL_MAX_DIMENSION = 320;
const DECODE_FALLBACK_TIMEOUT_MS = 15000;

export interface DecodedImage {
  source: unknown;
  width: number;
  height: number;
  release: () => void;
}

export interface ProcessUploadedPhotoParams {
  file: Blob;
  snapshot: MetadataSnapshot;
  settings: WatermarkVisualSettings;
  logoImage?: unknown;
  mapThumbnailImage?: unknown;
  mapThumbnailUrl?: string;
  providerAttribution?: string;
  /** Dapat diganti saat test; default memakai decoder browser. */
  decode?: (file: Blob) => Promise<DecodedImage>;
}

export interface ProcessedUploadResult {
  status: "success" | "error";
  originalBlob?: Blob;
  processedBlob?: Blob;
  thumbnailBlob?: Blob;
  width?: number;
  height?: number;
  errorMessage?: string;
}

/**
 * Decode file gambar menjadi sumber yang bisa digambar ke canvas. Rotasi EXIF diterapkan,
 * jadi width/height yang dikembalikan adalah ukuran tampilan akhir (portrait tetap portrait).
 */
export async function decodeImageFile(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Jatuh ke jalur <img> di bawah (mis. opsi imageOrientation tidak didukung).
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageFromUrl(url, DECODE_FALLBACK_TIMEOUT_MS);
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function makeThumbnail(
  source: unknown,
  width: number,
  height: number,
): Promise<Blob | undefined> {
  try {
    const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | undefined>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? undefined), "image/jpeg", 0.75),
    );
  } catch {
    return undefined;
  }
}

/** Menerapkan watermark ke satu foto unggahan. Tidak pernah throw. */
export async function processUploadedPhoto({
  file,
  snapshot,
  settings,
  logoImage,
  mapThumbnailImage,
  mapThumbnailUrl,
  providerAttribution,
  decode = decodeImageFile,
}: ProcessUploadedPhotoParams): Promise<ProcessedUploadResult> {
  let decoded: DecodedImage;
  try {
    decoded = await decode(file);
  } catch {
    return {
      status: "error",
      errorMessage: "Gambar tidak bisa dibaca. Pastikan file berupa foto (JPG/PNG/WebP).",
    };
  }

  try {
    const watermark = await renderWatermark({
      sourceImage: decoded.source,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      data: { snapshot, mapThumbnailUrl, providerAttribution },
      settings,
      logoImage,
      mapThumbnailImage,
    });
    if (watermark.status !== "success") {
      return { status: "error", errorMessage: watermark.message };
    }

    const thumbnailBlob = await makeThumbnail(decoded.source, decoded.width, decoded.height);
    return {
      status: "success",
      originalBlob: file,
      processedBlob: watermark.blob,
      thumbnailBlob: thumbnailBlob ?? watermark.blob,
      width: decoded.width,
      height: decoded.height,
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Gagal memproses foto.",
    };
  } finally {
    decoded.release();
  }
}
