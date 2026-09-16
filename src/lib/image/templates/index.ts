import type { WatermarkTemplate, WatermarkVisualSettings } from "@/types/watermark";
import { createDefaultTemplate } from "./default";
import { createRingkasTemplate } from "./ringkas";
import { createDetailTemplate } from "./detail";

export { createDefaultTemplate } from "./default";
export { createRingkasTemplate } from "./ringkas";
export { createDetailTemplate } from "./detail";

/** Mengambil pengaturan visual default untuk sebuah nama template (PRD #20). */
export function createWatermarkSettingsForTemplate(
  template: WatermarkTemplate,
  overrides: Partial<WatermarkVisualSettings> = {},
): WatermarkVisualSettings {
  switch (template) {
    case "default":
      return createDefaultTemplate(overrides);
    case "ringkas":
      return createRingkasTemplate(overrides);
    case "detail":
      return createDetailTemplate(overrides);
  }
}
