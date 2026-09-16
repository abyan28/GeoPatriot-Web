import type { WatermarkVisualSettings } from "@/types/watermark";

/**
 * Template "Default": menampilkan seluruh field utama (PRD #20).
 * Berupa factory function, bukan objek statis, agar pemanggil bisa
 * override sebagian pengaturan (mis. opacity) tanpa mutasi shared state.
 */
export function createDefaultTemplate(
  overrides: Partial<WatermarkVisualSettings> = {},
): WatermarkVisualSettings {
  return {
    template: "default",
    position: "bottom",
    // Nilai opacity/fontSize/spacing/mapThumbnailSizePx/mapZoom diselaraskan
    // dengan hasil tuning GeoPatriot mobile (referensi: referensi/GeoPatriot-main/
    // lib/watermark/models/watermark_configuration.dart) yang sudah diuji di device nyata.
    opacity: 0.5,
    fontSizePx: 16,
    mapThumbnailSizePx: 140,
    mapZoom: 16,
    marginPx: 16,
    radiusPx: 12,
    spacingPx: 4,
    alignment: "left",
    visibleFields: {
      locationName: true,
      address: true,
      coordinate: true,
      date: true,
      time: true,
      timezone: true,
      accuracy: true,
      altitude: false,
      mapThumbnail: true,
      customText: true,
      branding: true,
    },
    ...overrides,
  };
}
