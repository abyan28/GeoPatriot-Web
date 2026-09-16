import type { WatermarkVisualSettings } from "@/types/watermark";

/**
 * Template "Detail": menampilkan seluruh field termasuk map thumbnail
 * berukuran lebih besar, untuk kebutuhan dokumentasi lengkap (PRD #20).
 */
export function createDetailTemplate(
  overrides: Partial<WatermarkVisualSettings> = {},
): WatermarkVisualSettings {
  return {
    template: "detail",
    position: "bottom",
    // Nilai diselaraskan dengan tuning GeoPatriot mobile (lihat catatan di default.ts).
    opacity: 0.65,
    fontSizePx: 22,
    mapThumbnailSizePx: 160,
    mapZoom: 17,
    marginPx: 16,
    radiusPx: 12,
    spacingPx: 5,
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
