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
  measureText(text: string): { width: number };
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
  logoImage?: CanvasImageSourceLike;
  /** Gambar static map thumbnail yang sudah di-load, dirender sebagai elemen terpisah (rules #6.4). */
  mapThumbnailImage?: CanvasImageSourceLike;
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
    logoImage,
    mapThumbnailImage,
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
  drawWatermarkPanel(ctx, width, height, data, settings, logoImage, mapThumbnailImage);

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
 * Memotong teks dengan ellipsis ("...") bila lebih lebar dari maxWidthPx,
 * menggunakan measureText untuk pengukuran akurat sesuai font yang aktif
 * (mencegah teks alamat/lokasi panjang overflow keluar panel/foto, rules #6.8).
 */
function truncateTextToWidth(ctx: Canvas2DLike, text: string, maxWidthPx: number): string {
  if (maxWidthPx <= 0 || ctx.measureText(text).width <= maxWidthPx) return text;

  const ellipsis = "...";
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = text.slice(0, mid).trimEnd() + ellipsis;
    if (ctx.measureText(candidate).width <= maxWidthPx) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low > 0 ? text.slice(0, low).trimEnd() + ellipsis : ellipsis;
}

/**
 * Menggambar panel watermark Deep Navy & Golden Ochre berisi stempel logo & baris teks di atas foto.
 * Sesuai Rules #6.1: Watermark adalah hasil rendering Canvas nyata pada output Blob.
 */
function drawWatermarkPanel(
  ctx: Canvas2DLike,
  canvasWidth: number,
  canvasHeight: number,
  data: WatermarkData,
  settings: WatermarkVisualSettings,
  logoImage?: CanvasImageSourceLike,
  mapThumbnailImage?: CanvasImageSourceLike,
): void {
  const lines = buildWatermarkTextLines(data, settings);
  const hasMap = Boolean(
    mapThumbnailImage && settings.visibleFields.mapThumbnail && settings.mapThumbnailSizePx > 0,
  );
  if (lines.length === 0 && !hasMap) return;

  // Skala proporsional berbasis resolusi canvas terhadap 1080px (standar portrait modern)
  const scale = Math.max(0.7, Math.min(2.5, canvasWidth / 1080));
  const fontSize = Math.round(settings.fontSizePx * scale);
  const margin = Math.round(settings.marginPx * scale);
  const spacing = Math.round(settings.spacingPx * scale);
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_MULTIPLIER);
  const stripeWidth = Math.max(4, Math.round(5 * scale));
  const attributionFontSize = Math.max(9, Math.round(fontSize * 0.65));

  // Logo size jika logoImage disediakan
  const hasLogo = Boolean(logoImage && settings.visibleFields.branding);
  const logoSize = hasLogo ? Math.round(fontSize * 2.4) : 0;
  const contentLeftOffset = hasLogo ? logoSize + spacing * 2 : 0;

  // Map thumbnail + attribution adalah elemen TERPISAH di sisi kanan panel
  // (rules #6.4). Attribution digambar di bawah map, tidak pernah tertutup
  // elemen lain (rules #6.5) karena tingginya sudah dihitung ke panelHeight.
  const mapSize = hasMap ? Math.round(settings.mapThumbnailSizePx * scale) : 0;
  const attributionText = hasMap ? data.providerAttribution ?? "© LocationIQ" : "";
  const mapBlockHeight = hasMap ? mapSize + 4 + attributionFontSize : 0;
  const mapBlockWidth = hasMap ? mapSize : 0;
  const contentRightReserve = hasMap ? mapBlockWidth + spacing : 0;

  const textBlockHeight = lines.length * lineHeight;
  const panelHeight = margin * 2 + Math.max(textBlockHeight, logoSize, mapBlockHeight);
  const panelY = settings.position === "bottom" ? canvasHeight - panelHeight - margin : margin;

  const panelX = margin;
  const panelWidth = canvasWidth - margin * 2;

  // 1. Gambar latar panel Deep Navy dengan opacity
  ctx.save();
  ctx.globalAlpha = settings.opacity;
  ctx.fillStyle = "#08111d";
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  ctx.restore();

  // 2. Gambar strip aksen vertikal Golden Ochre di sisi kiri panel
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#c5984f";
  ctx.fillRect(panelX, panelY, stripeWidth, panelHeight);
  ctx.restore();

  // 3. Gambar Logo Stamp resmi aplikasi jika ada
  if (hasLogo && logoImage) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(logoImage, panelX + stripeWidth + spacing, panelY + margin, logoSize, logoSize);
    ctx.restore();
  }

  // 4. Gambar baris-baris teks metadata
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    const textX = panelX + stripeWidth + spacing + contentLeftOffset;
    const textY = panelY + margin + index * lineHeight;
    // Batasi lebar teks agar tidak overflow keluar panel/tepi foto, dan agar
    // tidak tertimpa blok map thumbnail di sisi kanan (rules #6.4, #6.8).
    const maxTextWidth = panelX + panelWidth - contentRightReserve - textX - spacing;
    const renderedText = truncateTextToWidth(ctx, line.text, maxTextWidth);

    // Pewarnaan teks berdasarkan kategori semantik baris (bukan menebak dari
    // isi teks), agar custom text/alamat yang mengandung koma/titik tidak
    // salah terwarnai seperti koordinat (audit finding F5).
    switch (line.kind) {
      case "branding":
        ctx.fillStyle = "#dcab55"; // Emas hangat untuk branding
        break;
      case "sensor":
        ctx.fillStyle = "#94a3b8"; // Abu-abu sejuk untuk sensor
        break;
      case "coordinate":
        ctx.fillStyle = "#7ec7e8"; // Muted teal untuk koordinat
        break;
      default:
        ctx.fillStyle = "#ffffff"; // Putih bersih untuk lokasi, waktu, & custom text
    }

    ctx.fillText(renderedText, textX, textY);
  });
  ctx.restore();

  // 5. Gambar map thumbnail + attribution provider sebagai elemen terpisah (rules #6.4-6.5)
  if (hasMap && mapThumbnailImage) {
    const mapX = panelX + panelWidth - margin - mapBlockWidth;
    const mapY = panelY + margin;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(mapThumbnailImage, mapX, mapY, mapSize, mapSize);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.font = `${attributionFontSize}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#94a3b8";
    const attributionMaxWidth = mapSize;
    ctx.fillText(
      truncateTextToWidth(ctx, attributionText, attributionMaxWidth),
      mapX,
      mapY + mapSize + 4,
    );
    ctx.restore();
  }
}
