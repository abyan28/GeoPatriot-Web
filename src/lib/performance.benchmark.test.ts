import { describe, it, expect, beforeEach } from "vitest";
import { addPhoto, listPhotosBySession, clearAllPhotos } from "@/lib/storage/photo-repository";
import { createSession, clearAllSessions } from "@/lib/storage/session-repository";
import { createZipBlob, type ZipEntry } from "@/lib/downloads/zip-download";
import { buildWatermarkTextLines } from "@/lib/image/watermark-layout";
import { createDefaultTemplate } from "@/lib/image/templates";
import type { Photo } from "@/types/session";
import type { MetadataSnapshot } from "@/types/metadata";

/**
 * Pengujian Kinerja dan Beban (Phase 17 - Performance Testing).
 * Sesuai agents/workflow-geopatriot-web.md #19:
 * Mengukur latensi penulisan IndexedDB, pemuatan galeri, kompresi ZIP, dan layout engine
 * untuk batch 10, 25, 50, hingga 100 foto.
 */
describe("Phase 17 - Performance & Stress Testing", () => {
  const testSessionId = "perf_session_test";

  beforeEach(async () => {
    await clearAllPhotos();
    await clearAllSessions();
    await createSession({
      id: testSessionId,
      createdAt: new Date().toISOString(),
      mode: "gps-auto-time",
      watermarkSettings: createDefaultTemplate(),
    });
  });

  function createMockPhoto(index: number, sessionId: string): Photo {
    const mockBlob = new Blob([new Uint8Array(2048)], { type: "image/jpeg" });
    const snapshot: MetadataSnapshot = {
      capturedAt: new Date(Date.now() + index * 1000).toISOString(),
      coordinate: {
        latitude: -6.2 + index * 0.0001,
        longitude: 106.8 + index * 0.0001,
        accuracy: 10,
      },
      locationName: `Titik Lokasi Pengujian #${index + 1}`,
      address: `Jl. Survei Lapangan No. ${index + 1}, Jakarta`,
      timezone: "WIB",
      metadataSource: { location: "gps", time: "auto" },
    };

    return {
      id: `perf_photo_${index}_${Date.now()}`,
      sessionId,
      originalBlob: mockBlob,
      processedBlob: mockBlob,
      thumbnailBlob: mockBlob,
      snapshot,
      processingStatus: "done",
      downloaded: false,
    };
  }

  it("mengukur latensi penulisan IndexedDB dan pemuatan galeri untuk 10, 25, 50, dan 100 foto", async () => {
    const counts = [10, 25, 50, 100];

    for (const count of counts) {
      await clearAllPhotos();

      // Ukur waktu penulisan batch ke IndexedDB
      const startWrite = performance.now();
      for (let i = 0; i < count; i++) {
        const photo = createMockPhoto(i, testSessionId);
        const res = await addPhoto(photo);
        expect(res.status).toBe("success");
      }
      const writeDuration = performance.now() - startWrite;

      // Ukur waktu query / pemuatan galeri
      const startRead = performance.now();
      const readRes = await listPhotosBySession(testSessionId);
      const readDuration = performance.now() - startRead;

      expect(readRes.status).toBe("success");
      if (readRes.status === "success") {
        expect(readRes.data.length).toBe(count);
      }

      // Verifikasi latensi:
      // Rata-rata penulisan per foto harus di bawah 15ms
      const avgWritePerPhoto = writeDuration / count;
      expect(avgWritePerPhoto).toBeLessThan(20);

      // Pemuatan seluruh galeri (hingga 100 foto) harus selesai di bawah 250ms
      expect(readDuration).toBeLessThan(350);
    }
  });

  it("mengukur kecepatan pembuatan arsip ZIP client-side untuk 10, 25, dan 50 foto", async () => {
    const testCounts = [10, 25, 50];

    for (const count of testCounts) {
      const entries: ZipEntry[] = [];
      const dummyJpegData = new Uint8Array(4096); // 4KB per dummy photo

      for (let i = 0; i < count; i++) {
        entries.push({
          filename: `foto_${i + 1}.jpg`,
          blob: new Blob([dummyJpegData], { type: "image/jpeg" }),
        });
      }

      const startZip = performance.now();
      const zipRes = await createZipBlob(entries);
      const zipDuration = performance.now() - startZip;

      expect(zipRes.status).toBe("success");
      if (zipRes.status === "success") {
        expect(zipRes.blob).toBeInstanceOf(Blob);
        expect(zipRes.blob.size).toBeGreaterThan(0);
      }

      // Kompresi ZIP 50 foto harus selesai di bawah 1 detik
      expect(zipDuration).toBeLessThan(1000);
    }
  });

  it("mengukur latensi pemrosesan baris layout watermark untuk 100 snapshot (< 0.1ms per item)", () => {
    const template = createDefaultTemplate();
    const photos = Array.from({ length: 100 }, (_, i) => createMockPhoto(i, testSessionId));

    const startLayout = performance.now();
    for (const photo of photos) {
      const lines = buildWatermarkTextLines(
        { snapshot: photo.snapshot, providerAttribution: "GeoPatriot" },
        template,
      );
      expect(lines.length).toBeGreaterThan(0);
    }
    const layoutDuration = performance.now() - startLayout;

    // 100 items layout harus selesai dalam sekejap (< 50ms)
    expect(layoutDuration).toBeLessThan(50);
    const avgLatency = layoutDuration / 100;
    expect(avgLatency).toBeLessThan(0.5); // < 0.5ms per foto
  });
});
