import type { WatermarkData, WatermarkVisualSettings } from "@/types/watermark";
import { buildWatermarkTextLines, clampOutputDimensions } from "./watermark-layout";

/**
 * Engine perender watermark berbasis Canvas.
 * Lihat agents/rules-geopatriot-web.md #6-#7 dan agents/workflow-geopatriot-web.md #8.
 *
 * PENTING:
 * - Watermark adalah hasil rendering ke Blob baru, BUKAN overlay HTML (rules #6.1).
 * - Foto asli tidak pernah di-overwrite (rules #7.2): fungsi ini selalu
 *   mengembalikan Blob baru, sumber (sourceImage) tidak dimutasi.
 * - Canvas context di-inject lewat parameter opsional agar engine dapat diuji
 *   tanpa environment browser sungguhan (dependency injection untuk testability).
 */

/** Subset API 2D context yang dipakai engine ini. */
export interface Canvas2DLike {
  drawImage(image: CanvasImageSourceLike, dx: number, dy: number, dw: number, dh: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  save(): void;
  restore(): void;
  fillStyle: string;
  font: string;
  globalAlpha: number;
  textBaseline: CanvasTextBaseline;
}

/** Subset elemen canvas yang dipakai engine ini. */
export interface CanvasLike {
  width: number;
  height: number;
  getContext(contextId: "2d"): Canvas2DLike | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void;
}

/** Sumber gambar generik (ImageBitmap/HTMLImageElement) yang dipakai drawImage. */
export type CanvasImageSourceLike = unknown;

/** Factory pembuat canvas, default memakai `document.createElement("canvas")` di browser. */
export type CanvasFactory = (width: number, height: number) => CanvasLike;

function defaultCanvasFactory(width: number, height: number): CanvasLike {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas as unknown as CanvasLike;
}

/** Hasil proses watermark: sukses dengan Blob, atau gagal dengan alasan eksplisit. */
export type WatermarkRenderResult =
  { status: "success"; blob: Blob } | { status: "error"; message: string };

export interface RenderWatermarkOptions {
  sourceImage: CanvasImageSourceLike;
  sourceWidth: number;
  sourceHeight: number;
  data: WatermarkData;
  settings: WatermarkVisualSettings;
  canvasFactory?: CanvasFactory;
  outputType?: string;
  outputQuality?: number;
}

const LINE_HEIGHT_MULTIPLIER = 1.4;

/**
 * Merender foto sumber + panel watermark ke Canvas, lalu meng-export
 * hasilnya sebagai Blob baru. Foto sumber tidak pernah dimutasi (rules #7.1-7.2).
 */
export function renderWatermark(options: RenderWatermarkOptions): Promise<WatermarkRenderResult> {
  const {
    sourceImage,
    sourceWidth,
    sourceHeight,
    data,
    settings,
    canvasFactory = defaultCanvasFactory,
    outputType = "image/jpeg",
    outputQuality = 0.92,
  } = options;

  const { width, height } = clampOutputDimensions(sourceWidth, sourceHeight);
  const canvas = canvasFactory(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.resolve({
      status: "error",
      message: "Tidak dapat membuat Canvas 2D context.",
    });
  }

  ctx.drawImage(sourceImage, 0, 0, width, height);
  drawWatermarkPanel(ctx, width, height, data, settings);

  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              status: "error",
              message: "Gagal meng-encode hasil watermark (toBlob null).",
            });
            return;
          }
          resolve({ status: "success", blob });
        },
        outputType,
        outputQuality,
      );
    } catch (error) {
      resolve({
        status: "error",
        message: error instanceof Error ? error.message : "Gagal meng-encode hasil watermark.",
      });
    }
  });
}

/**
 * Menggambar panel watermark semi-transparan berisi baris teks di atas foto.
 * Map thumbnail & attribution digambar terpisah lewat drawMapThumbnail/drawAttribution
 * (rules #6.4: map thumbnail dan attribution adalah elemen terpisah).
 */
function drawWatermarkPanel(
  ctx: Canvas2DLike,
  canvasWidth: number,
  canvasHeight: number,
  data: WatermarkData,
  settings: WatermarkVisualSettings,
): void {
  const lines = buildWatermarkTextLines(data, settings);
  if (lines.length === 0) return;

  const lineHeight = settings.fontSizePx * LINE_HEIGHT_MULTIPLIER;
  const panelHeight = settings.marginPx * 2 + lines.length * lineHeight;
  const panelY =
    settings.position === "bottom"
      ? canvasHeight - panelHeight - settings.marginPx
      : settings.marginPx;

  ctx.save();
  ctx.globalAlpha = settings.opacity;
  ctx.fillStyle = "#000000";
  ctx.fillRect(settings.marginPx, panelY, canvasWidth - settings.marginPx * 2, panelHeight);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.font = `${settings.fontSizePx}px sans-serif`;
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    const textX = settings.marginPx + settings.spacingPx;
    const textY = panelY + settings.marginPx + index * lineHeight;
    ctx.fillText(line.text, textX, textY);
  });
  ctx.restore();
}
