import type { MetadataSnapshot } from "./metadata";
import type { WatermarkVisualSettings } from "./watermark";

/**
 * Tipe data session dan photo untuk storage layer (IndexedDB).
 * Lihat agents/prd-geopatriot-web.md #12 dan #13.
 */

/** Empat pola penggunaan session minimal MVP (PRD #12). */
export type SessionMode =
  | "fixed"
  | "gps-auto-time"
  | "fixed-location-auto-time"
  | "gps-manual-time";

/** Status pemrosesan satu foto dalam pipeline watermark. */
export type PhotoProcessingStatus = "pending" | "processing" | "done" | "failed";

/** Satu sesi pemotretan; menyimpan pengaturan yang berlaku saat sesi dibuat (rules #9.1-9.3). */
export interface Session {
  id: string;
  createdAt: string;
  mode: SessionMode;
  watermarkSettings: WatermarkVisualSettings;
}

/**
 * Satu foto dalam sebuah session. Setiap foto membawa snapshot metadata
 * sendiri agar perubahan settings setelahnya tidak memengaruhi foto lama
 * (rules #9.3).
 */
export interface Photo {
  id: string;
  sessionId: string;
  /** Foto asli hasil capture, sebelum watermark (rules #7.1: tidak di-overwrite). */
  originalBlob: Blob;
  /** Foto hasil akhir setelah watermark dirender, siap diunduh. */
  processedBlob?: Blob;
  thumbnailBlob?: Blob;
  snapshot: MetadataSnapshot;
  processingStatus: PhotoProcessingStatus;
  /** true bila foto sudah pernah diunduh pengguna (PRD #14: indikasi foto belum di-download). */
  downloaded: boolean;
}
