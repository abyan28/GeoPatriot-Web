import type { StorageResult } from "@/types/storage";
import { getDb } from "./db";
import { toStorageError } from "./storage-error";

/**
 * Repository untuk object store "settings" (key-value generik).
 * Dipakai untuk menyimpan pengaturan watermark default, provider, dsb (PRD #13, #20).
 */

/** Menyimpan/memperbarui satu pengaturan berdasarkan key. */
export async function setSetting<T>(key: string, value: T): Promise<StorageResult<void>> {
  try {
    const db = await getDb();
    await db.put("settings", { key, value });
    return { status: "success", data: undefined };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Mengambil satu pengaturan berdasarkan key. */
export async function getSetting<T>(key: string): Promise<StorageResult<T>> {
  try {
    const db = await getDb();
    const record = await db.get("settings", key);
    if (!record) {
      return { status: "error", reason: "not-found", message: `Setting "${key}" tidak ditemukan.` };
    }
    return { status: "success", data: record.value as T };
  } catch (error) {
    return toStorageError(error);
  }
}

/** Menghapus satu pengaturan. */
export async function deleteSetting(key: string): Promise<StorageResult<void>> {
  try {
    const db = await getDb();
    await db.delete("settings", key);
    return { status: "success", data: undefined };
  } catch (error) {
    return toStorageError(error);
  }
}
