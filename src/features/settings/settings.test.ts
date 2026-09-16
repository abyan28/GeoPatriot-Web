import { describe, expect, it, beforeEach } from "vitest";
import {
  addPhoto,
  listPhotosBySession,
  deleteDownloadedPhotos,
  clearAllPhotos,
} from "@/lib/storage/photo-repository";
import {
  createSession,
  listSessions,
  clearAllSessions,
} from "@/lib/storage/session-repository";
import {
  setSetting,
  getSetting,
  clearAllSettings,
} from "@/lib/storage/settings-repository";
import { createDefaultTemplate } from "@/lib/image/templates";
import { DEFAULT_LOCATION_SETTINGS } from "./use-app-settings";
import type { Photo, Session } from "@/types/session";

describe("Settings & Storage Operations (Phase 13)", () => {
  const sessionId = "session_settings_test";

  beforeEach(async () => {
    await clearAllPhotos();
    await clearAllSessions();
    await clearAllSettings();

    const session: Session = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      mode: "fixed",
      watermarkSettings: createDefaultTemplate(),
    };
    await createSession(session);
  });

  const createPhoto = (id: string, downloaded: boolean): Photo => ({
    id,
    sessionId,
    originalBlob: new Blob(["img"], { type: "image/jpeg" }),
    processingStatus: "done",
    snapshot: {
      coordinate: { latitude: -6.2, longitude: 106.8 },
      capturedAt: "2026-09-16T10:00:00.000Z",
      timezone: "Asia/Jakarta",
      metadataSource: { location: "gps", time: "auto" },
    },
    downloaded,
  });

  it("deleteDownloadedPhotos hanya menghapus foto yang sudah diunduh (PRD #14)", async () => {
    await addPhoto(createPhoto("p1", true));
    await addPhoto(createPhoto("p2", false));
    await addPhoto(createPhoto("p3", true));

    const res = await deleteDownloadedPhotos();
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data).toBe(2);
    }

    const remaining = await listPhotosBySession(sessionId);
    expect(remaining.status).toBe("success");
    if (remaining.status === "success") {
      expect(remaining.data).toHaveLength(1);
      expect(remaining.data[0].id).toBe("p2");
    }
  });

  it("clearAllPhotos dan clearAllSessions menghapus seluruh data IndexedDB", async () => {
    await addPhoto(createPhoto("p1", false));
    await addPhoto(createPhoto("p2", true));

    await clearAllPhotos();
    await clearAllSessions();

    const photos = await listPhotosBySession(sessionId);
    const sessions = await listSessions();

    if (photos.status === "success") expect(photos.data).toHaveLength(0);
    if (sessions.status === "success") expect(sessions.data).toHaveLength(0);
  });

  it("clearAllSettings mengosongkan store pengaturan", async () => {
    await setSetting("test_key", "test_value");
    const check1 = await getSetting("test_key");
    expect(check1.status).toBe("success");

    await clearAllSettings();
    const check2 = await getSetting("test_key");
    expect(check2.status).toBe("error");
  });

  it("DEFAULT_LOCATION_SETTINGS memiliki konfigurasi default yang aman", () => {
    expect(DEFAULT_LOCATION_SETTINGS.provider).toBe("locationiq");
    expect(DEFAULT_LOCATION_SETTINGS.highAccuracy).toBe(true);
    expect(DEFAULT_LOCATION_SETTINGS.autoFallbackToManual).toBe(true);
  });
});
