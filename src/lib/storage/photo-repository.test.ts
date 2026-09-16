import { describe, expect, it } from "vitest";
import type { Photo } from "@/types/session";
import {
  addPhoto,
  deletePhoto,
  deletePhotosBySession,
  getPhoto,
  listPhotosBySession,
  updatePhoto,
} from "./photo-repository";

function buildPhoto(sessionId: string, overrides: Partial<Photo> = {}): Photo {
  return {
    id: crypto.randomUUID(),
    sessionId,
    originalBlob: new Blob(["fake-original"], { type: "image/jpeg" }),
    processingStatus: "pending",
    downloaded: false,
    snapshot: {
      coordinate: { latitude: -6.2, longitude: 106.8, accuracy: 5 },
      capturedAt: new Date().toISOString(),
      timezone: "Asia/Jakarta",
      metadataSource: { location: "gps", time: "auto" },
    },
    ...overrides,
  };
}

describe("photo-repository", () => {
  it("add -> get -> update -> delete berjalan sesuai lifecycle", async () => {
    const sessionId = crypto.randomUUID();
    const photo = buildPhoto(sessionId);

    expect((await addPhoto(photo)).status).toBe("success");
    expect((await getPhoto(photo.id)).status).toBe("success");

    const updated = { ...photo, processingStatus: "done" as const, downloaded: true };
    const updateResult = await updatePhoto(updated);
    expect(updateResult.status).toBe("success");

    const fetched = await getPhoto(photo.id);
    expect(fetched.status === "success" && fetched.data.processingStatus).toBe("done");

    expect((await deletePhoto(photo.id)).status).toBe("success");
    expect((await getPhoto(photo.id)).status).toBe("error");
  });

  it("listPhotosBySession hanya mengembalikan foto milik session tersebut", async () => {
    const sessionA = crypto.randomUUID();
    const sessionB = crypto.randomUUID();
    const photoA1 = buildPhoto(sessionA);
    const photoA2 = buildPhoto(sessionA);
    const photoB1 = buildPhoto(sessionB);

    await addPhoto(photoA1);
    await addPhoto(photoA2);
    await addPhoto(photoB1);

    const result = await listPhotosBySession(sessionA);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.map((p) => p.id).sort()).toEqual([photoA1.id, photoA2.id].sort());
    }
  });

  it("deletePhotosBySession menghapus seluruh foto milik session", async () => {
    const sessionId = crypto.randomUUID();
    await addPhoto(buildPhoto(sessionId));
    await addPhoto(buildPhoto(sessionId));

    const deleteResult = await deletePhotosBySession(sessionId);
    expect(deleteResult.status).toBe("success");

    const afterDelete = await listPhotosBySession(sessionId);
    expect(afterDelete.status === "success" && afterDelete.data.length).toBe(0);
  });
});
