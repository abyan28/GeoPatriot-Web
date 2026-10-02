import { describe, expect, it } from "vitest";
import type { WatermarkData } from "@/types/watermark";
import { createDefaultTemplate, createDetailTemplate, createRingkasTemplate } from "./templates";
import {
  buildWatermarkTextLines,
  clampOutputDimensions,
  formatCoordinate,
} from "./watermark-layout";

const SAMPLE_DATA: WatermarkData = {
  snapshot: {
    coordinate: { latitude: -6.175392, longitude: 106.827153, accuracy: 4.2, altitude: 12 },
    locationName: "Monas",
    address: "Monas, Jakarta Pusat, DKI Jakarta",
    capturedAt: "2026-09-16T01:31:12.000Z",
    timezone: "Asia/Jakarta",
    metadataSource: { location: "gps", time: "auto" },
  },
};

describe("buildWatermarkTextLines", () => {
  it("menyertakan field utama pada template default (altitude nonaktif, selaras referensi mobile)", () => {
    const settings = createDefaultTemplate();
    const lines = buildWatermarkTextLines(SAMPLE_DATA, settings).map((l) => l.text);

    expect(lines).toContain("Monas");
    expect(lines).toContain("Monas, Jakarta Pusat, DKI Jakarta");
    expect(lines).toContain(formatCoordinate(-6.175392, 106.827153));
    expect(lines).toContain("Akurasi ±4 m");
    expect(lines).not.toContain("Altitude 12 m");
    expect(lines).toContain("GeoPatriot");
  });

  it("menyertakan altitude pada template detail", () => {
    const settings = createDetailTemplate();
    const lines = buildWatermarkTextLines(SAMPLE_DATA, settings).map((l) => l.text);
    expect(lines).toContain("Altitude 12 m");
  });

  it("template ringkas hanya menampilkan field minimal", () => {
    const settings = createRingkasTemplate();
    const lines = buildWatermarkTextLines(SAMPLE_DATA, settings).map((l) => l.text);

    expect(lines).toContain("Monas");
    expect(lines).not.toContain("Monas, Jakarta Pusat, DKI Jakarta");
    expect(lines.some((l) => l.includes("Akurasi"))).toBe(false);
  });

  it("tidak menampilkan field yang datanya kosong walau visibleFields true", () => {
    const dataWithoutAddress: WatermarkData = {
      snapshot: { ...SAMPLE_DATA.snapshot, address: undefined },
    };
    const settings = createDefaultTemplate();
    const lines = buildWatermarkTextLines(dataWithoutAddress, settings).map((l) => l.text);
    expect(lines).not.toContain(undefined);
  });
});

describe("clampOutputDimensions", () => {
  it("tidak mengubah dimensi bila di bawah batas maksimum", () => {
    expect(clampOutputDimensions(1080, 1920)).toEqual({ width: 1080, height: 1920 });
  });

  it("mengecilkan dimensi secara proporsional bila melebihi batas maksimum", () => {
    const result = clampOutputDimensions(8000, 4000);
    expect(result.width).toBe(4096);
    expect(result.height).toBe(2048);
  });
});

describe("splitCapturedAt", () => {
  it("menampilkan waktu sesuai zona waktu snapshot, bukan UTC", async () => {
    const { splitCapturedAt } = await import("./watermark-layout");
    expect(splitCapturedAt("2026-09-16T01:31:12.000Z", "Asia/Jakarta")).toEqual({
      datePart: "2026-09-16",
      timePart: "08:31:12",
    });
  });

  it("ikut berganti tanggal bila lewat tengah malam di zona tersebut", async () => {
    const { splitCapturedAt } = await import("./watermark-layout");
    expect(splitCapturedAt("2026-09-16T20:00:00.000Z", "Asia/Jakarta")).toEqual({
      datePart: "2026-09-17",
      timePart: "03:00:00",
    });
  });

  it("jatuh ke UTC bila zona waktu tidak diberikan atau tidak valid", async () => {
    const { splitCapturedAt } = await import("./watermark-layout");
    const utc = { datePart: "2026-09-16", timePart: "01:31:12" };
    expect(splitCapturedAt("2026-09-16T01:31:12.000Z")).toEqual(utc);
    expect(splitCapturedAt("2026-09-16T01:31:12.000Z", "Bukan/Zona")).toEqual(utc);
  });
});
