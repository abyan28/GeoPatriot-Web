import type { MetadataSnapshot } from "./metadata";

/**
 * Tipe data untuk watermark engine (lib/image).
 * Lihat agents/prd-geopatriot-web.md #20 dan #10, agents/workflow-geopatriot-web.md #8.
 */

/** Template watermark minimal yang harus didukung MVP. */
export type WatermarkTemplate = "default" | "ringkas" | "detail";

/** Posisi panel watermark pada foto. */
export type WatermarkPosition = "top" | "bottom";

/** Perataan teks di dalam panel watermark. */
export type WatermarkAlignment = "left" | "center" | "right";

/** Field watermark yang visibilitasnya dapat diatur pengguna (PRD #20). */
export interface WatermarkFieldVisibility {
  locationName: boolean;
  address: boolean;
  coordinate: boolean;
  date: boolean;
  time: boolean;
  timezone: boolean;
  accuracy: boolean;
  altitude: boolean;
  mapThumbnail: boolean;
  customText: boolean;
  branding: boolean;
}

/** Pengaturan visual watermark yang dapat dikustomisasi pengguna (PRD #20). */
export interface WatermarkVisualSettings {
  template: WatermarkTemplate;
  position: WatermarkPosition;
  /** Opacity panel watermark, rentang 0-1. */
  opacity: number;
  fontSizePx: number;
  mapThumbnailSizePx: number;
  /** Level zoom static map thumbnail (12-19), diteruskan ke MapProvider.getStaticMap. */
  mapZoom: number;
  marginPx: number;
  radiusPx: number;
  spacingPx: number;
  alignment: WatermarkAlignment;
  visibleFields: WatermarkFieldVisibility;
}

/**
 * Data terstruktur yang dikonsumsi watermark engine untuk merender satu foto.
 * Engine TIDAK boleh mengambil state UI secara langsung (workflow #8) —
 * seluruh data yang dibutuhkan harus sudah ada di objek ini, diturunkan dari
 * MetadataSnapshot yang sudah dibekukan per capture.
 */
export interface WatermarkData {
  snapshot: MetadataSnapshot;
  /** Data URL atau Blob URL untuk map thumbnail, bila tersedia. */
  mapThumbnailUrl?: string;
  /** Teks attribution provider (mis. LocationIQ) yang wajib tetap terlihat. */
  providerAttribution?: string;
}
