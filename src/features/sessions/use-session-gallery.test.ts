import { describe, expect, it, beforeEach } from "vitest";
import { prepareZipEntries } from "./use-session-gallery";
import { createSession, listSessions, deleteSession } from "@/lib/storage/session-repository";
import {
  addPhoto,
  listPhotosBySession,
  deletePhoto,
  updatePhoto,
  deletePhotosBySession,
} from "@/lib/storage/photo-repository";
import { createZipBlob } from "@/lib/downloads/zip-download";
import { createDefaultTemplate } from "@/lib/image/templates";
import type { Photo, Session } from "@/types/session";

describe("use-session-gallery helper and operations", () => {
  const sessionId = "test-session-gallery-1";

  beforeEach(async () => {
    const session: Session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      mode: "gps-auto-time",
      watermarkSettings: createDefaultTemplate(),
    };
    await createSession(session);
  });

  it("prepareZipEntries menghasilkan entri berurutan dengan penamaan file yang benar", () => {
    const photos: Photo[] = [
      {
        id: "p1",
        sessionId,
        originalBlob: new Blob(["blob1"], { type: "image/jpeg" }),
        processedBlob: new Blob(["processed1"], { type: "image/jpeg" }),
        processingStatus: "done",
        downloaded: false,
        snapshot: {
          coordinate: { latitude: -6.1, longitude: 106.8 },
          capturedAt: "2026-09-16T08:00:00.000Z",
          timezone: "Asia/Jakarta",
          metadataSource: { location: "gps", time: "auto" },
        },
      },
      {
        id: "p2",
        sessionId,
        originalBlob: new Blob(["blob2"], { type: "image/jpeg" }),
        processingStatus: "pending",
        downloaded: true,
        snapshot: {
          coordinate: { latitude: -6.2, longitude: 106.9 },
          capturedAt: "2026-09-16T08:05:00.000Z",
          timezone: "Asia/Jakarta",
          metadataSource: { location: "gps", time: "auto" },
        },
      },
    ];

    const entries = prepareZipEntries(photos);
    expect(entries.length).toBe(2);

    // Entri 1 menggunakan processedBlob
    expect(entries[0].filename).toMatch(/^1_GeoPatriot_/);
    expect(entries[0].blob).toBe(photos[0].processedBlob);

    // Entri 2 fallback ke originalBlob karena processedBlob tidak ada
    expect(entries[1].filename).toMatch(/^2_GeoPatriot_/);
    expect(entries[1].blob).toBe(photos[1].originalBlob);
  });

  it("prepareZipEntries dapat langsung diproses oleh createZipBlob untuk batch download", async () => {
    const photos: Photo[] = [
      {
        id: "p1",
        sessionId,
        originalBlob: new Blob(["blob1"], { type: "image/jpeg" }),
        processingStatus: "done",
        downloaded: false,
        snapshot: {
          coordinate: { latitude: -6.1, longitude: 106.8 },
          capturedAt: "2026-09-16T08:00:00.000Z",
          timezone: "Asia/Jakarta",
          metadataSource: { location: "gps", time: "auto" },
        },
      },
    ];

    const entries = prepareZipEntries(photos);
    const zipResult = await createZipBlob(entries);
    expect(zipResult.status).toBe("success");
    if (zipResult.status === "success") {
      expect(zipResult.blob.type).toBe("application/zip");
      expect(zipResult.blob.size).toBeGreaterThan(0);
    }
  });

  it("dapat menambah, memperbarui status downloaded, dan menghapus foto sesi", async () => {
    const photo: Photo = {
      id: "photo-del-test",
      sessionId,
      originalBlob: new Blob(["sample"], { type: "image/jpeg" }),
      processingStatus: "done",
      downloaded: false,
      snapshot: {
        coordinate: { latitude: -6.1, longitude: 106.8 },
        capturedAt: new Date().toISOString(),
        timezone: "Asia/Jakarta",
        metadataSource: { location: "gps", time: "auto" },
      },
    };

    // Tambah foto
    const addRes = await addPhoto(photo);
    expect(addRes.status).toBe("success");

    // Pastikan foto terdaftar
    const listRes1 = await listPhotosBySession(sessionId);
    expect(listRes1.status).toBe("success");
    if (listRes1.status === "success") {
      expect(listRes1.data.some((p) => p.id === photo.id)).toBe(true);
    }

    // Perbarui status unduh
    const updateRes = await updatePhoto({ ...photo, downloaded: true });
    expect(updateRes.status).toBe("success");

    // Hapus satu foto
    const delRes = await deletePhoto(photo.id);
    expect(delRes.status).toBe("success");

    // Pastikan sudah terhapus
    const listRes2 = await listPhotosBySession(sessionId);
    if (listRes2.status === "success") {
      expect(listRes2.data.some((p) => p.id === photo.id)).toBe(false);
    }
  });

  it("dapat membersihkan seluruh foto sesi dan menghapus sesi tersebut", async () => {
    const tempSessionId = "session-to-clear";
    await createSession({
      id: tempSessionId,
      createdAt: new Date().toISOString(),
      mode: "gps-auto-time",
      watermarkSettings: createDefaultTemplate(),
    });

    await addPhoto({
      id: "photo-clear-1",
      sessionId: tempSessionId,
      originalBlob: new Blob(["1"], { type: "image/jpeg" }),
      processingStatus: "done",
      downloaded: false,
      snapshot: {
        coordinate: { latitude: 0, longitude: 0 },
        capturedAt: new Date().toISOString(),
        timezone: "UTC",
        metadataSource: { location: "gps", time: "auto" },
      },
    });

    // Hapus seluruh foto dan sesi
    await deletePhotosBySession(tempSessionId);
    await deleteSession(tempSessionId);

    const photosLeft = await listPhotosBySession(tempSessionId);
    if (photosLeft.status === "success") {
      expect(photosLeft.data.length).toBe(0);
    }

    const sessionsLeft = await listSessions();
    if (sessionsLeft.status === "success") {
      expect(sessionsLeft.data.some((s) => s.id === tempSessionId)).toBe(false);
    }
  });
});
