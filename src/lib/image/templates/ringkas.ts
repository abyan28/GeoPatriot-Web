import type { WatermarkVisualSettings } from "@/types/watermark";

/**
 * Template "Ringkas": hanya field paling penting (lokasi, tanggal/waktu),
 * cocok untuk foto yang butuh watermark minim (PRD #20).
 */
export function createRingkasTemplate(
  overrides: Partial<WatermarkVisualSettings> = {},
): WatermarkVisualSettings {
  return {
    template: "ringkas",
    position: "bottom",
    opacity: 0.7,
    fontSizePx: 14,
    mapThumbnailSizePx: 0,
    marginPx: 12,
    radiusPx: 10,
    spacingPx: 4,
    alignment: "left",
    visibleFields: {
      locationName: true,
      address: false,
      coordinate: false,
      date: true,
      time: true,
      timezone: false,
      accuracy: false,
      altitude: false,
      mapThumbnail: false,
      customText: false,
      branding: true,
    },
    ...overrides,
  };
}
