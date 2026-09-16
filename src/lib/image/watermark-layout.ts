import type { WatermarkData, WatermarkVisualSettings } from "@/types/watermark";

/**
 * Logic murni (tanpa Canvas) untuk menyusun baris teks watermark dari
 * WatermarkData + WatermarkVisualSettings. Dipisah dari watermark-engine.ts
 * agar dapat diuji tanpa environment Canvas/browser (workflow #8: engine
 * menerima data terstruktur, bukan mengambil state UI langsung).
 */

/**
 * Kategori semantik satu baris teks watermark, dipakai untuk menentukan
 * warna rendering di watermark-engine.ts TANPA menebak dari isi teks
 * (menghindari salah warna bila customText/alamat mengandung koma/titik).
 */
export type WatermarkLineKind =
  | "location"
  | "coordinate"
  | "datetime"
  | "sensor"
  | "custom"
  | "branding";

/** Satu baris teks yang akan digambar pada panel watermark. */
export interface WatermarkTextLine {
  text: string;
  kind: WatermarkLineKind;
}

/**
 * Menyusun baris-baris teks watermark berdasarkan template dan field yang
 * aktif (visibleFields). Urutan baris konsisten untuk ketiga template;
 * yang membedakan template adalah field mana saja yang ditampilkan (PRD #20).
 */
export function buildWatermarkTextLines(
  data: WatermarkData,
  settings: WatermarkVisualSettings,
): WatermarkTextLine[] {
  const { snapshot } = data;
  const { visibleFields } = settings;
  const lines: WatermarkTextLine[] = [];

  if (visibleFields.locationName && snapshot.locationName) {
    lines.push({ text: snapshot.locationName, kind: "location" });
  }
  if (visibleFields.address && snapshot.address) {
    lines.push({ text: snapshot.address, kind: "location" });
  }
  if (visibleFields.coordinate) {
    lines.push({
      text: formatCoordinate(snapshot.coordinate.latitude, snapshot.coordinate.longitude),
      kind: "coordinate",
    });
  }

  const dateTimeParts: string[] = [];
  if (visibleFields.date || visibleFields.time) {
    const { datePart, timePart } = splitCapturedAt(snapshot.capturedAt);
    if (visibleFields.date) dateTimeParts.push(datePart);
    if (visibleFields.time) dateTimeParts.push(timePart);
    if (visibleFields.timezone) dateTimeParts.push(snapshot.timezone);
    lines.push({ text: dateTimeParts.join(" "), kind: "datetime" });
  }

  if (visibleFields.accuracy && snapshot.coordinate.accuracy !== undefined) {
    lines.push({ text: `Akurasi ±${Math.round(snapshot.coordinate.accuracy)} m`, kind: "sensor" });
  }
  if (visibleFields.altitude && snapshot.coordinate.altitude !== undefined) {
    lines.push({ text: `Altitude ${Math.round(snapshot.coordinate.altitude)} m`, kind: "sensor" });
  }
  if (visibleFields.customText && snapshot.customText) {
    lines.push({ text: snapshot.customText, kind: "custom" });
  }
  if (visibleFields.branding) {
    lines.push({ text: "GeoPatriot", kind: "branding" });
  }

  return lines;
}

/** Memformat koordinat menjadi string "lat, lon" dengan 6 desimal. */
export function formatCoordinate(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/** Memecah string ISO 8601 capturedAt menjadi bagian tanggal dan waktu yang mudah dibaca. */
export function splitCapturedAt(capturedAtIso: string): { datePart: string; timePart: string } {
  const date = new Date(capturedAtIso);
  const datePart = date.toISOString().slice(0, 10);
  const timePart = date.toISOString().slice(11, 19);
  return { datePart, timePart };
}

/** Dimensi maksimum sisi terpanjang output foto, untuk mencegah memori berlebihan (rules #7.6). */
export const MAX_OUTPUT_DIMENSION_PX = 4096;

/**
 * Menghitung dimensi output dengan membatasi sisi terpanjang ke
 * MAX_OUTPUT_DIMENSION_PX, tetap mempertahankan aspect ratio (rules #7.4).
 */
export function clampOutputDimensions(
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  const longestSide = Math.max(sourceWidth, sourceHeight);
  if (longestSide <= MAX_OUTPUT_DIMENSION_PX) {
    return { width: sourceWidth, height: sourceHeight };
  }
  const scale = MAX_OUTPUT_DIMENSION_PX / longestSide;
  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  };
}
