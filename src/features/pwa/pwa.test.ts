import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import fs from "node:fs";
import path from "node:path";

describe("PWA Specification & Safety Tests (Phase 12)", () => {
  it("manifest() menghasilkan konfigurasi PWA yang valid dan sesuai PRD #19", () => {
    const config = manifest();

    expect(config.name).toBe("GeoPatriot Web — GPS Camera");
    expect(config.short_name).toBe("GeoPatriot");
    expect(config.display).toBe("standalone");
    expect(config.orientation).toBe("portrait");
    expect(config.start_url).toBe("/");
    expect(config.theme_color).toBe("#08111d");
    expect(config.background_color).toBe("#08111d");

    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThanOrEqual(2);

    const hasMaskable = config.icons?.some((i) => i.purpose?.includes("maskable"));
    const hasAny = config.icons?.some((i) => i.purpose?.includes("any"));
    expect(hasMaskable).toBe(true);
    expect(hasAny).toBe(true);
  });

  it("public/sw.js mengimplementasikan aturan privasi larangan cache lokasi (Rules #14.3)", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, "utf-8");

    // Verifikasi cache name app shell
    expect(swContent).toContain("geopatriot-shell-v1");

    // Verifikasi perlindungan privasi lokasi pengguna (Rules #14.3)
    expect(swContent).toContain("locationiq.com");
    expect(swContent).toContain("isSafeToCache");

    // Verifikasi precache app shell
    expect(swContent).toContain("PRECACHE_ASSETS");
    expect(swContent).toContain("/manifest.webmanifest");
  });
});
