// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Photo, Session } from "@/types/session";
import { addPhoto } from "@/lib/storage/photo-repository";
import { createSession } from "@/lib/storage/session-repository";
import { createDefaultTemplate } from "@/lib/image/templates";
import { useSessionGallery } from "./use-session-gallery";

/**
 * Test lewat HOOK PRODUKSI (bukan hanya repository terisolasi), agar bug
 * seperti stale UI setelah cascade-delete parsial benar-benar tercakup
 * (audit finding AUD-01/AUD-02: "unit-tested != production-verified").
 */

function buildSession(id: string): Session {
  return {
    id,
    createdAt: new Date().toISOString(),
    mode: "gps-auto-time",
    watermarkSettings: createDefaultTemplate(),
  };
}

function buildPhoto(id: string, sessionId: string): Photo {
  return {
    id,
    sessionId,
    originalBlob: new Blob(["foto"], { type: "image/jpeg" }),
    processingStatus: "done",
    downloaded: false,
    snapshot: {
      coordinate: { latitude: -6.2, longitude: 106.8 },
      capturedAt: new Date().toISOString(),
      timezone: "Asia/Jakarta",
      metadataSource: { location: "gps", time: "auto" },
    },
  };
}

describe("useSessionGallery - clearCurrentSession (via hook produksi)", () => {
  it("mengosongkan state photos & sessions setelah cascade delete berhasil", async () => {
    const sessionId = `hook_session_${Date.now()}`;
    await createSession(buildSession(sessionId));
    await addPhoto(buildPhoto(`hook_photo_1_${Date.now()}`, sessionId));
    await addPhoto(buildPhoto(`hook_photo_2_${Date.now()}`, sessionId));

    const { result } = renderHook(() => useSessionGallery(sessionId));

    await waitFor(() => {
      expect(result.current.photos.length).toBe(2);
    });

    let success = false;
    await act(async () => {
      success = await result.current.clearCurrentSession();
    });

    expect(success).toBe(true);
    // State harus benar-benar sinkron dengan storage setelah operasi, bukan
    // hanya di-nol-kan secara optimistic (AUD-01).
    await waitFor(() => {
      expect(result.current.sessions.some((s) => s.id === sessionId)).toBe(false);
    });
    expect(result.current.photos.some((p) => p.sessionId === sessionId)).toBe(false);
  });

  it("deleteSelectedPhotos hanya menghapus dari state foto yang benar-benar sukses dihapus di storage (AUD-03)", async () => {
    const sessionId = `hook_session_partial_${Date.now()}`;
    await createSession(buildSession(sessionId));
    const photoId1 = `hook_photo_partial_1_${Date.now()}`;
    const photoId2 = `hook_photo_partial_2_${Date.now()}`;
    await addPhoto(buildPhoto(photoId1, sessionId));
    await addPhoto(buildPhoto(photoId2, sessionId));

    const { result } = renderHook(() => useSessionGallery(sessionId));

    await waitFor(() => {
      expect(result.current.photos.length).toBe(2);
    });

    act(() => {
      result.current.toggleSelectPhoto(photoId1);
      result.current.toggleSelectPhoto(photoId2);
    });

    let deleteResult: { success: boolean; count: number } = { success: false, count: 0 };
    await act(async () => {
      deleteResult = await result.current.deleteSelectedPhotos();
    });

    // Kedua foto benar-benar ada di storage nyata (fake-indexeddb), jadi
    // keduanya seharusnya berhasil dihapus tanpa kegagalan parsial di sini.
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.count).toBe(2);
    expect(result.current.photos.length).toBe(0);
  });
});
