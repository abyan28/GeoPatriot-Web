import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  prepareZipEntries,
  executeSingleDownload,
  executeBatchZipDownload,
} from "./use-download-manager";
import type { Photo } from "@/types/session";
import type { DownloadEnvironment } from "@/lib/downloads/single-download";
import { addPhoto, getPhoto } from "@/lib/storage/photo-repository";
import { createSession } from "@/lib/storage/session-repository";
import { createDefaultTemplate } from "@/lib/image/templates";

describe("Download Manager Operations", () => {
  let mockEnv: DownloadEnvironment;
  let clickedAnchor: { href: string; download: string } | null = null;
  let revokedUrls: string[] = [];
  let testSessionId: string;

  beforeEach(async () => {
    clickedAnchor = null;
    revokedUrls = [];

    mockEnv = {
      createObjectURL: vi.fn((blob: Blob) => `blob:mock-${blob.size}`),
      revokeObjectURL: vi.fn((url: string) => {
        revokedUrls.push(url);
      }),
      createAnchor: vi.fn(() => ({
        href: "",
        download: "",
        click: function () {
          clickedAnchor = { href: this.href, download: this.download };
        },
      })),
    };

    const sessionRes = await createSession({
      id: "session_test",
      createdAt: new Date().toISOString(),
      mode: "fixed",
      watermarkSettings: createDefaultTemplate(),
    });
    testSessionId = sessionRes.status === "success" ? sessionRes.data.id : "session_test";
  });

  const createMockPhoto = (id: string, text: string): Photo => ({
    id,
    sessionId: testSessionId,
    originalBlob: new Blob([text], { type: "image/jpeg" }),
    processedBlob: new Blob([`${text}-watermarked`], { type: "image/jpeg" }),
    processingStatus: "done",
    snapshot: {
      coordinate: { latitude: -6.2, longitude: 106.8 },
      capturedAt: "2026-09-16T10:00:00.000Z",
      timezone: "Asia/Jakarta",
      metadataSource: { location: "gps", time: "auto" },
    },
    downloaded: false,
  });

  it("prepareZipEntries menghasilkan daftar ZipEntry dengan penamaan berurutan", () => {
    const photos = [
      createMockPhoto("photo_1", "gambar1"),
      createMockPhoto("photo_2", "gambar2"),
    ];

    const entries = prepareZipEntries(photos);
    expect(entries).toHaveLength(2);
    expect(entries[0].filename).toMatch(/^1_GeoPatriot_2026-09-16/);
    expect(entries[1].filename).toMatch(/^2_GeoPatriot_2026-09-16/);
    expect(entries[0].blob).toBe(photos[0].processedBlob);
  });

  it("executeSingleDownload memicu pengunduhan dan menandai status downloaded di IndexedDB", async () => {
    const photo = createMockPhoto("photo_single_1", "konten-tunggal");
    await addPhoto(photo);

    const success = await executeSingleDownload(photo, mockEnv);

    expect(success).toBe(true);
    expect(mockEnv.createAnchor).toHaveBeenCalled();
    expect(clickedAnchor).not.toBeNull();
    expect(clickedAnchor?.download).toMatch(/^GeoPatriot_2026-09-16/);

    // Verifikasi pembaruan di IndexedDB
    const stored = await getPhoto(photo.id);
    expect(stored.status).toBe("success");
    if (stored.status === "success" && stored.data) {
      expect(stored.data.downloaded).toBe(true);
    }
  });

  it("executeBatchZipDownload mengompresi kumpulan foto ke ZIP dan memanggil callback progres", async () => {
    const photo1 = createMockPhoto("photo_batch_1", "batch-1");
    const photo2 = createMockPhoto("photo_batch_2", "batch-2");
    await addPhoto(photo1);
    await addPhoto(photo2);

    const progressPhases: string[] = [];
    const updatedPhotos: string[] = [];

    const res = await executeBatchZipDownload([photo1, photo2], {
      zipFilename: "Test_Batch.zip",
      env: mockEnv,
      onProgress: (p) => progressPhases.push(p.phase),
      onPhotoUpdated: (p) => updatedPhotos.push(p.id),
    });

    expect(res.success).toBe(true);
    expect(res.filename).toBe("Test_Batch.zip");
    expect(clickedAnchor?.download).toBe("Test_Batch.zip");
    expect(res.blob).toBeDefined();

    // Verifikasi progres dilaporkan
    expect(progressPhases.length).toBeGreaterThan(0);
    expect(progressPhases.some((phase) => phase === "reading" || phase === "compressing")).toBe(
      true,
    );

    // Verifikasi kedua foto ditandai downloaded = true
    expect(updatedPhotos).toEqual(["photo_batch_1", "photo_batch_2"]);
    const p1 = await getPhoto(photo1.id);
    const p2 = await getPhoto(photo2.id);
    if (p1.status === "success" && p1.data) expect(p1.data.downloaded).toBe(true);
    if (p2.status === "success" && p2.data) expect(p2.data.downloaded).toBe(true);
  });

  it("executeBatchZipDownload mengembalikan error jika foto kosong tanpa merusak storage", async () => {
    const res = await executeBatchZipDownload([], { env: mockEnv });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(clickedAnchor).toBeNull();
  });
});
