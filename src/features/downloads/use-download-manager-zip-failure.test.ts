import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Photo } from "@/types/session";
import type { DownloadEnvironment } from "@/lib/downloads/single-download";
import { addPhoto, getPhoto } from "@/lib/storage/photo-repository";
import { createSession } from "@/lib/storage/session-repository";
import { createDefaultTemplate } from "@/lib/image/templates";

/**
 * Test terpisah khusus skenario ZIP gagal dibuat (bukan kasus trivial "entries
 * kosong"). Memverifikasi Rules #10.5: kegagalan ZIP TIDAK BOLEH mengubah
 * status/menghapus foto sumber di IndexedDB (audit finding AUD-07).
 */
vi.mock("@/lib/downloads/zip-download", () => ({
  createZipBlob: vi.fn().mockResolvedValue({
    status: "error",
    message: "Simulasi kegagalan pembuatan ZIP",
  }),
}));

describe("executeBatchZipDownload - kegagalan pembuatan ZIP", () => {
  let mockEnv: DownloadEnvironment;
  let anchorClicked: boolean;
  let testSessionId: string;

  beforeEach(async () => {
    anchorClicked = false;
    mockEnv = {
      createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
      revokeObjectURL: vi.fn(),
      createAnchor: vi.fn(() => ({
        href: "",
        download: "",
        click: () => {
          anchorClicked = true;
        },
      })),
    };

    const sessionRes = await createSession({
      id: "session_zip_failure_test",
      createdAt: new Date().toISOString(),
      mode: "fixed",
      watermarkSettings: createDefaultTemplate(),
    });
    testSessionId =
      sessionRes.status === "success" ? sessionRes.data.id : "session_zip_failure_test";
  });

  it("tidak menandai downloaded=true dan tidak memicu download saat ZIP gagal dibuat", async () => {
    const { executeBatchZipDownload } = await import("./use-download-manager");

    const photo: Photo = {
      id: "photo_zip_fail_1",
      sessionId: testSessionId,
      originalBlob: new Blob(["konten-asli"], { type: "image/jpeg" }),
      processedBlob: new Blob(["konten-watermark"], { type: "image/jpeg" }),
      processingStatus: "done",
      snapshot: {
        coordinate: { latitude: -6.2, longitude: 106.8 },
        capturedAt: "2026-09-16T10:00:00.000Z",
        timezone: "Asia/Jakarta",
        metadataSource: { location: "gps", time: "auto" },
      },
      downloaded: false,
    };
    await addPhoto(photo);

    const res = await executeBatchZipDownload([photo], { env: mockEnv });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Simulasi kegagalan pembuatan ZIP");

    // Download browser tidak pernah dipicu.
    expect(anchorClicked).toBe(false);

    // Foto sumber di IndexedDB tidak berubah sama sekali (rules #10.5).
    const stored = await getPhoto(photo.id);
    expect(stored.status).toBe("success");
    if (stored.status === "success") {
      expect(stored.data.downloaded).toBe(false);
      expect(stored.data.originalBlob).toBeDefined();
      expect(stored.data.processedBlob).toBeDefined();
    }
  });
});
