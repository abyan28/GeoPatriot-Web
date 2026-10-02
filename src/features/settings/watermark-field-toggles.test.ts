import { describe, it, expect } from "vitest";
import { createDefaultTemplate } from "@/lib/image/templates";
import { buildWatermarkTextLines } from "@/lib/image/watermark-layout";
import type { WatermarkData } from "@/types/watermark";
import { WATERMARK_FIELD_TOGGLES } from "./watermark-field-toggles";
import { mergeSavedWatermarkSettings } from "./use-app-settings";

const DATA: WatermarkData = {
  snapshot: {
    coordinate: { latitude: -9.62, longitude: 124.88, accuracy: 7.4, altitude: 120 },
    locationName: "Kupang",
    address: "Jl. Contoh",
    capturedAt: "2024-05-17T07:03:00.000Z",
    timezone: "Asia/Jakarta",
    metadataSource: { location: "gps", time: "auto" },
    customText: "Patok 12",
  },
};

describe("WATERMARK_FIELD_TOGGLES", () => {
  it("hanya memakai key yang benar-benar ada di visibleFields", () => {
    const realKeys = Object.keys(createDefaultTemplate().visibleFields);
    for (const toggle of WATERMARK_FIELD_TOGGLES) {
      expect(realKeys).toContain(toggle.key);
    }
  });

  it("mencakup semua field visibleFields agar tidak ada yang tak bisa diatur", () => {
    const realKeys = Object.keys(createDefaultTemplate().visibleFields).sort();
    expect(WATERMARK_FIELD_TOGGLES.map((t) => t.key).sort()).toEqual(realKeys);
  });

  it("mematikan setiap toggle menghilangkan barisnya dari watermark", () => {
    const base = createDefaultTemplate({
      visibleFields: { ...createDefaultTemplate().visibleFields, altitude: true },
    });
    const baseText = buildWatermarkTextLines(DATA, base).map((l) => l.text).join("\n");
    expect(baseText).toContain("Akurasi ±7 m");

    const off = createDefaultTemplate({
      visibleFields: { ...base.visibleFields, accuracy: false },
    });
    const offText = buildWatermarkTextLines(DATA, off).map((l) => l.text).join("\n");
    expect(offText).not.toContain("Akurasi");
    expect(offText).toContain("Altitude");
  });
});

describe("mergeSavedWatermarkSettings", () => {
  it("membuang key liar seperti gpsQuality dan mempertahankan pilihan valid", () => {
    const saved = {
      ...createDefaultTemplate(),
      visibleFields: {
        ...createDefaultTemplate().visibleFields,
        accuracy: false,
        gpsQuality: false,
      },
    };
    const merged = mergeSavedWatermarkSettings(saved as never);
    expect(merged.visibleFields).not.toHaveProperty("gpsQuality");
    expect(merged.visibleFields.accuracy).toBe(false);
  });

  it("mengisi field baru yang belum ada di data lama dengan default", () => {
    const merged = mergeSavedWatermarkSettings({ visibleFields: { coordinate: false } as never });
    expect(merged.visibleFields.coordinate).toBe(false);
    expect(merged.visibleFields.customText).toBe(true);
  });
});
