import type { StorageFailureReason } from "@/types/storage";
import { isQuotaExceededError } from "./db";

/**
 * Menerjemahkan error IndexedDB mentah menjadi StorageResult error yang
 * konsisten dan bisa ditampilkan ke pengguna. Dipusatkan di sini agar tidak
 * terduplikasi di tiap repository (rules #20.8).
 */
export function toStorageError(error: unknown): {
  status: "error";
  reason: StorageFailureReason;
  message: string;
} {
  if (isQuotaExceededError(error)) {
    return {
      status: "error",
      reason: "quota-exceeded",
      message: "Penyimpanan browser penuh. Unduh atau hapus foto lama sebelum melanjutkan.",
    };
  }
  return {
    status: "error",
    reason: "unknown",
    message: error instanceof Error ? error.message : "Terjadi kesalahan penyimpanan.",
  };
}
