import type { Session } from "@/types/session";
import type { StorageResult } from "@/types/storage";
import { getDb } from "./db";
import { toStorageError } from "./storage-error";

/**
 * Repository untuk object store "sessions".
 * Lihat agents/workflow-geopatriot-web.md #10: create session -> ... -> finish -> clear.
 */

/** Membuat session baru. */
export async function createSession(session: Session): Promise<StorageResult<Session>> {
  try {
    const db = await getDb();
    await db.add("sessions", session);
    return { status: "success", data: session };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Mengambil satu session berdasarkan id. */
export async function getSession(id: string): Promise<StorageResult<Session>> {
  try {
    const db = await getDb();
    const session = await db.get("sessions", id);
    if (!session) {
      return { status: "error", reason: "not-found", message: `Session ${id} tidak ditemukan.` };
    }
    return { status: "success", data: session };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Mengambil seluruh session, diurutkan dari yang terbaru. */
export async function listSessions(): Promise<StorageResult<Session[]>> {
  try {
    const db = await getDb();
    const sessions = await db.getAllFromIndex("sessions", "by-createdAt");
    return { status: "success", data: sessions.reverse() };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Menghapus satu session. Tidak menghapus foto terkait (dipisah agar eksplisit — panggil deletePhotosBySession). */
export async function deleteSession(id: string): Promise<StorageResult<void>> {
  try {
    const db = await getDb();
    await db.delete("sessions", id);
    return { status: "success", data: undefined };
  } catch (error) {
    return toStorageError(error);
  }
}
