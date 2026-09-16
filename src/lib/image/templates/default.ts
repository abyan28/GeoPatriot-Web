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
    opacity: 0.75,
    fontSizePx: 16,
    mapThumbnailSizePx: 96,
    marginPx: 16,
    radiusPx: 12,
    spacingPx: 6,
    alignment: "left",
    visibleFields: {
      locationName: true,
      address: true,
      coordinate: true,
      date: true,
      time: true,
      timezone: true,
      accuracy: true,
      altitude: true,
      mapThumbnail: true,
      customText: true,
      branding: true,
    },
    ...overrides,
  };
}
