/**
 * Tipe hasil operasi storage layer (IndexedDB), dipakai seluruh repository
 * di lib/storage agar error handling konsisten (rules #8.4, PRD #22).
 */
export type StorageResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; reason: StorageFailureReason; message: string };

export type StorageFailureReason = "quota-exceeded" | "not-found" | "unknown";
