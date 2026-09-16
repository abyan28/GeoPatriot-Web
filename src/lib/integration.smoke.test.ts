import { describe, expect, it, vi } from "vitest";
import type { Photo, Session } from "@/types/session";
import { createSession } from "@/lib/storage/session-repository";
import { addPhoto, updatePhoto } from "@/lib/storage/photo-repository";
import { createDefaultTemplate } from "@/lib/image/templates";
import { renderWatermark, type Canvas2DLike, type CanvasLike } from "@/lib/image/watermark-engine";
import { createZipBlob } from "@/lib/downloads/zip-download";
import { buildPhotoFilename, buildZipFilename } from "@/lib/downloads/filename";

/**
 * Smoke test lintas layer: memastikan seluruh lib non-UI (storage, image,
 * downloads) dapat dipakai bersama end-to-end tanpa menyentuh UI sama sekali.
 * Alur ini merepresentasikan apa yang nantinya dipanggil Antigravity dari
 * komponen React (Session -> Photo -> Watermark -> ZIP).
 */

function createFakeCanvas(): CanvasLike {
  const ctx: Canvas2DLike = {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: "",
    font: "",
    globalAlpha: 1,
    textBaseline: "top",
  };
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: (callback) => callback(new Blob(["fake-jpeg"], { type: "image/jpeg" })),
  };
}

describe("smoke: session -> photo -> watermark -> zip", () => {
  it("menjalankan seluruh alur non-UI end-to-end", async () => {
    const session: Session = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      mode: "gps-auto-time",
      watermarkSettings: createDefaultTemplate(),
    };
    const sessionResult = await createSession(session);
    expect(sessionResult.status).toBe("success");

    const capturedAt = "2026-09-16T01:31:12.000Z";
    const photo: Photo = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      originalBlob: new Blob(["original-jpeg"], { type: "image/jpeg" }),
      processingStatus: "pending",
      downloaded: false,
      snapshot: {
        coordinate: { latitude: -6.2, longitude: 106.8, accuracy: 4 },
        locationName: "Monas",
        capturedAt,
        timezone: "Asia/Jakarta",
        metadataSource: { location: "gps", time: "auto" },
      },
    };
    expect((await addPhoto(photo)).status).toBe("success");

    const watermarkResult = await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: { snapshot: photo.snapshot },
      settings: session.watermarkSettings,
      canvasFactory: createFakeCanvas,
    });
    expect(watermarkResult.status).toBe("success");
    if (watermarkResult.status !== "success") return;

    const updated: Photo = {
      ...photo,
      processedBlob: watermarkResult.blob,
      processingStatus: "done",
    };
    expect((await updatePhoto(updated)).status).toBe("success");

    const filename = buildPhotoFilename(capturedAt);
    expect(filename).toMatch(/^GeoPatriot_.*\.jpg$/);

    const zipResult = await createZipBlob([{ filename, blob: updated.processedBlob! }]);
    expect(zipResult.status).toBe("success");
    if (zipResult.status === "success") {
      expect(zipResult.blob.size).toBeGreaterThan(0);
    }

    expect(buildZipFilename()).toMatch(/^GeoPatriot_Session_.*\.zip$/);
  });
});
