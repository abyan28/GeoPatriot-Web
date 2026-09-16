import type { Photo } from "@/types/session";
import type { StorageResult } from "@/types/storage";
import { getDb } from "./db";
import { toStorageError } from "./storage-error";

/**
 * Repository untuk object store "photos".
 * Lihat agents/workflow-geopatriot-web.md #10 dan agents/rules-geopatriot-web.md #9.
 */

/** Menambahkan foto baru ke sebuah session. */
export async function addPhoto(photo: Photo): Promise<StorageResult<Photo>> {
  try {
    const db = await getDb();
    await db.add("photos", photo);
    return { status: "success", data: photo };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Mengambil satu foto berdasarkan id. */
export async function getPhoto(id: string): Promise<StorageResult<Photo>> {
  try {
    const db = await getDb();
    const photo = await db.get("photos", id);
    if (!photo) {
      return { status: "error", reason: "not-found", message: `Foto ${id} tidak ditemukan.` };
    }
    return { status: "success", data: photo };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Mengambil semua foto milik satu session. */
export async function listPhotosBySession(sessionId: string): Promise<StorageResult<Photo[]>> {
  try {
    const db = await getDb();
    const photos = await db.getAllFromIndex("photos", "by-sessionId", sessionId);
    return { status: "success", data: photos };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Memperbarui field pada foto yang sudah ada (mis. processedBlob, processingStatus, downloaded). */
export async function updatePhoto(photo: Photo): Promise<StorageResult<Photo>> {
  try {
    const db = await getDb();
    await db.put("photos", photo);
    return { status: "success", data: photo };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Menghapus satu foto. */
export async function deletePhoto(id: string): Promise<StorageResult<void>> {
  try {
    const db = await getDb();
    await db.delete("photos", id);
    return { status: "success", data: undefined };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Menghapus seluruh foto milik satu session (dipakai saat clear session, PRD #14). */
export async function deletePhotosBySession(sessionId: string): Promise<StorageResult<void>> {
  try {
    const db = await getDb();
    const tx = db.transaction("photos", "readwrite");
    const index = tx.store.index("by-sessionId");
    let cursor = await index.openCursor(sessionId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
    return { status: "success", data: undefined };
  } catch (error) {
    return toStorageError(error);
  }
}
