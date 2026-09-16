import { describe, expect, it } from "vitest";
import { buildPhotoFilename, buildZipFilename } from "./filename";

describe("buildPhotoFilename", () => {
  it("menghasilkan format GeoPatriot_YYYY-MM-DD_HH-mm-ss.jpg", () => {
    const filename = buildPhotoFilename("2026-09-16T01:31:12.000Z", "jpg");
    expect(filename).toMatch(/^GeoPatriot_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.jpg$/);
  });

  it("nama file antar foto berurutan tetap sortable secara string", () => {
    const first = buildPhotoFilename("2026-09-16T01:31:12.000Z");
    const second = buildPhotoFilename("2026-09-16T01:32:07.000Z");
    expect(first < second).toBe(true);
  });
});

describe("buildZipFilename", () => {
  it("menghasilkan format GeoPatriot_Session_YYYY-MM-DD_HH-mm-ss.zip", () => {
    const filename = buildZipFilename(new Date("2026-09-16T01:31:12.000Z"));
    expect(filename).toMatch(/^GeoPatriot_Session_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/);
  });
});
