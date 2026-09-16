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
    opacity: 0.8,
    fontSizePx: 16,
    mapThumbnailSizePx: 140,
    marginPx: 20,
    radiusPx: 14,
    spacingPx: 8,
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
