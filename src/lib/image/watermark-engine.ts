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
 * Desain mengikuti spesifikasi GeoPatriot Mobile (compact content-based card, map di kiri,
 * teks di kanan, dan lencana badge GeoPatriot di pojok kanan atas).
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
  const allLines = buildWatermarkTextLines(data, settings);
  const hasBranding = Boolean(settings.visibleFields.branding);
  // Branding dirender sebagai badge terpisah di pojok kanan atas panel (selaras GeoPatriot mobile)
  const lines = allLines.filter((l) => l.kind !== "branding");

  const hasMap = Boolean(
    mapThumbnailImage && settings.visibleFields.mapThumbnail && settings.mapThumbnailSizePx > 0,
  );
  if (lines.length === 0 && !hasMap && !hasBranding) return;

  // Skala proporsional berbasis resolusi canvas terhadap standar portrait 1080px
  const baseDimension = Math.min(canvasWidth, canvasHeight);
  const scale = Math.max(0.65, Math.min(2.5, baseDimension / 1080));
  const fontSize = Math.round(settings.fontSizePx * scale);
  const margin = Math.round(settings.marginPx * scale);
  const spacing = Math.round(settings.spacingPx * scale);
  const innerPadding = Math.round(14 * scale);
  const cornerRadius = Math.round((settings.radiusPx ?? 12) * scale);
  const lineHeight = Math.round(fontSize * LINE_HEIGHT_MULTIPLIER);
  const attributionFontSize = Math.max(9, Math.round(fontSize * 0.7));

  // Map thumbnail berada di SISI KIRI (selaras GeoPatriot Mobile & rules #6.4)
  const mapSize = hasMap ? Math.round(settings.mapThumbnailSizePx * scale) : 0;
  const thumbnailReservedWidth = hasMap ? mapSize + spacing * 2 : 0;
  const attributionText = hasMap ? data.providerAttribution ?? "© LocationIQ" : "";

  // Lebar maksimal panel dibatasi agar TIDAK melebar penuh (tidak full-width):
  // - Portrait: maks 85% lebar canvas atau (canvasWidth - 2 * margin)
  // - Landscape: maks 55% lebar canvas (~45-55% selaras foto referensi mobile)
  const isLandscape = canvasWidth > canvasHeight;
  const maxPanelWidth = isLandscape
    ? Math.min(canvasWidth - margin * 2, Math.round(canvasWidth * 0.55))
    : Math.min(canvasWidth - margin * 2, Math.round(canvasWidth * 0.85));
  const maxTextWidth = Math.max(60, maxPanelWidth - 2 * innerPadding - thumbnailReservedWidth);

  // Ukur lebar aktual teks untuk menentukan content-based panel width
  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  let maxMeasuredLineWidth = 0;
  for (let i = 0; i < lines.length; i++) {
    const isTitle = i === 0 && lines[i].kind === "location";
    const lineFont = isTitle ? `bold ${Math.round(fontSize * 1.15)}px sans-serif` : `${fontSize}px sans-serif`;
    ctx.font = lineFont;
    const w = ctx.measureText(lines[i].text).width;
    if (w > maxMeasuredLineWidth) maxMeasuredLineWidth = w;
  }
  if (hasMap && attributionText) {
    ctx.font = `${attributionFontSize}px sans-serif`;
    const w = ctx.measureText(attributionText).width;
    if (w > maxMeasuredLineWidth) maxMeasuredLineWidth = w;
  }
  ctx.restore();

  const textBlockWidth = Math.min(maxMeasuredLineWidth, maxTextWidth);
  const textBlockHeight =
    lines.length * lineHeight + (hasMap && attributionText ? attributionFontSize + spacing : 0);
  const contentHeight = hasMap ? Math.max(mapSize, textBlockHeight) : textBlockHeight;

  // Ukuran panel akhir (content-based card)
  const panelWidth = Math.min(
    maxPanelWidth,
    thumbnailReservedWidth + textBlockWidth + 2 * innerPadding,
  );
  const panelHeight = contentHeight + 2 * innerPadding;

  // Penentuan koordinat panel (panelOrigin)
  let panelX: number;
  let panelY: number;

  switch (settings.position) {
    case "top":
    case "topLeft":
      panelX = margin;
      panelY = margin;
      break;
    case "topRight":
      panelX = canvasWidth - margin - panelWidth;
      panelY = margin;
      break;
    case "bottomRight":
      panelX = canvasWidth - margin - panelWidth;
      panelY = canvasHeight - margin - panelHeight;
      break;
    case "bottom":
    case "bottomLeft":
    default:
      panelX = margin;
      panelY = canvasHeight - margin - panelHeight;
      break;
  }

  // 1. Gambar latar panel Deep Navy dengan sudut membulat & opacity
  ctx.save();
  ctx.globalAlpha = settings.opacity ?? 0.85;
  ctx.fillStyle = "#08111d";
  const anyCtx = ctx as unknown as { roundRect?: (...args: unknown[]) => void; beginPath?: () => void; fill?: () => void };
  if (typeof anyCtx.roundRect === "function" && typeof anyCtx.beginPath === "function" && typeof anyCtx.fill === "function") {
    anyCtx.beginPath();
    anyCtx.roundRect(panelX, panelY, panelWidth, panelHeight, cornerRadius);
    anyCtx.fill();
  } else {
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  }
  ctx.restore();

  // 2. Gambar Map Thumbnail di SISI KIRI (selaras GeoPatriot Mobile)
  if (hasMap && mapThumbnailImage) {
    const mapX = panelX + innerPadding;
    const mapY = panelY + innerPadding + Math.max(0, Math.round((contentHeight - mapSize) / 2));

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(mapThumbnailImage, mapX, mapY, mapSize, mapSize);
    ctx.restore();
  }

  // 3. Gambar Baris-baris Teks Metadata di SISI KANAN Thumbnail
  const textStartX = panelX + innerPadding + thumbnailReservedWidth;
  const textStartY = panelY + innerPadding;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    const isTitle = index === 0 && line.kind === "location";
    const lineFontSize = isTitle ? Math.round(fontSize * 1.15) : fontSize;
    ctx.font = isTitle ? `bold ${lineFontSize}px sans-serif` : `${lineFontSize}px sans-serif`;

    const textY = textStartY + index * lineHeight;
    const maxLineAllowed = panelX + panelWidth - innerPadding - textStartX;
    const renderedText = truncateTextToWidth(ctx, line.text, maxLineAllowed);

    switch (line.kind) {
      case "sensor":
        ctx.fillStyle = "#94a3b8";
        break;
      case "coordinate":
        ctx.fillStyle = "#7ec7e8";
        break;
      default:
        ctx.fillStyle = "#ffffff";
    }

    ctx.fillText(renderedText, textStartX, textY);
  });

  // Gambar attribution provider di baris paling bawah tumpukan teks (rules #6.4-6.5)
  if (hasMap && attributionText) {
    ctx.font = `${attributionFontSize}px sans-serif`;
    ctx.fillStyle = "#94a3b8";
    const attrY = textStartY + lines.length * lineHeight;
    const maxAttrWidth = panelX + panelWidth - innerPadding - textStartX;
    ctx.fillText(truncateTextToWidth(ctx, attributionText, maxAttrWidth), textStartX, attrY);
  }
  ctx.restore();

  // 4. Gambar Lencana Brand (Brand Badge) terpisah di pojok kanan-atas panel
  if (hasBranding) {
    const badgeFontSize = Math.max(10, Math.round(fontSize * 0.85));
    const badgePadding = Math.round(6 * scale);
    const badgeOverlap = Math.round(5 * scale);
    const badgeIconSize = Math.round(badgeFontSize * 1.3);
    const brandText = "GeoPatriot";

    ctx.save();
    ctx.font = `600 ${badgeFontSize}px sans-serif`;
    const brandTextWidth = ctx.measureText(brandText).width;
    const iconReservedWidth = logoImage ? badgeIconSize + spacing : 0;
    const badgeWidth = iconReservedWidth + brandTextWidth + 2 * badgePadding;
    const badgeHeight = Math.max(badgeIconSize, badgeFontSize) + 2 * badgePadding;

    // Rata kanan terhadap panel utama
    const badgeX = Math.max(
      margin,
      Math.min(canvasWidth - margin - badgeWidth, panelX + panelWidth - badgeWidth),
    );
    // Menempel di sisi yang menjauhi tepi foto terdekat
    const attachAbove = panelY > canvasHeight / 2;
    const badgeY = attachAbove
      ? Math.max(0, panelY - badgeHeight + badgeOverlap)
      : Math.min(canvasHeight - badgeHeight, panelY + panelHeight - badgeOverlap);

    // Latar belakang badge
    ctx.save();
    ctx.globalAlpha = settings.opacity ?? 0.85;
    ctx.fillStyle = "#08111d";
    if (typeof anyCtx.roundRect === "function" && typeof anyCtx.beginPath === "function" && typeof anyCtx.fill === "function") {
      anyCtx.beginPath();
      anyCtx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, Math.round(6 * scale));
      anyCtx.fill();
    } else {
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
    }
    ctx.restore();

    // Gambar Logo Stamp jika ada
    if (logoImage) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(
        logoImage,
        badgeX + badgePadding,
        badgeY + Math.round((badgeHeight - badgeIconSize) / 2),
        badgeIconSize,
        badgeIconSize,
      );
      ctx.restore();
    }

    // Teks nama brand
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#dcab55";
    ctx.textBaseline = "middle";
    ctx.fillText(
      brandText,
      badgeX + badgePadding + iconReservedWidth,
      badgeY + badgeHeight / 2,
    );
    ctx.restore();
  }
}
