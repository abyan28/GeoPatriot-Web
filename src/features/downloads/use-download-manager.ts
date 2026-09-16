"use client";

import { useState, useCallback, useRef } from "react";
import type { Photo } from "@/types/session";
import { downloadBlob, type DownloadEnvironment } from "@/lib/downloads/single-download";
import { createZipBlob, type ZipEntry, type ZipProgressCallback } from "@/lib/downloads/zip-download";
import { buildPhotoFilename, buildZipFilename } from "@/lib/downloads/filename";
import { updatePhoto } from "@/lib/storage/photo-repository";

/**
 * Tahapan status proses pengunduhan (Phase 11).
 */
export type DownloadPhase =
  | "idle"
  | "preparing"
  | "compressing"
  | "downloading"
  | "completed"
  | "error";

/**
 * Status detail progres unduhan untuk ditampilkan pada UI Progress Dialog.
 */
export interface DownloadProgressState {
  isOpen: boolean;
  phase: DownloadPhase;
  percent: number;
  currentCount: number;
  totalCount: number;
  currentFilename?: string;
  targetFilename?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
}

/**
 * Nilai state default saat tidak ada proses unduh aktif.
 */
export const INITIAL_DOWNLOAD_STATE: DownloadProgressState = {
  isOpen: false,
  phase: "idle",
  percent: 0,
  currentCount: 0,
  totalCount: 0,
};

/**
 * Mengonversi daftar Photo menjadi kumpulan ZipEntry dengan penamaan yang terurut.
 * Sesuai PRD #15: GeoPatriot_YYYY-MM-DD_HH-mm-ss.jpg
 */
export function prepareZipEntries(photos: Photo[]): ZipEntry[] {
  return photos.map((photo, index) => {
    const ext = "jpg";
    const baseName = buildPhotoFilename(photo.snapshot.capturedAt, ext);
    const filename = `${index + 1}_${baseName}`;
    return {
      filename,
      blob: photo.processedBlob || photo.originalBlob,
    };
  });
}

/**
 * Operasi murni untuk mengunduh satu foto dan memperbarui status IndexedDB.
 */
export async function executeSingleDownload(
  photo: Photo,
  env?: DownloadEnvironment,
): Promise<boolean> {
  try {
    const blobToDownload = photo.processedBlob || photo.originalBlob;
    const filename = buildPhotoFilename(photo.snapshot.capturedAt);

    downloadBlob(blobToDownload, filename, env);

    // Tandai status downloaded = true di IndexedDB (PRD #14)
    const updatedPhoto: Photo = { ...photo, downloaded: true };
    await updatePhoto(updatedPhoto);

    return true;
  } catch (err) {
    console.error("Gagal mengunduh foto tunggal:", err);
    return false;
  }
}

export interface ExecuteBatchZipOptions {
  zipFilename?: string;
  onProgress?: ZipProgressCallback;
  onPhotoUpdated?: (updatedPhoto: Photo) => void;
  env?: DownloadEnvironment;
}

/**
 * Operasi murni untuk mengompresi sekumpulan foto ke berkas ZIP client-side dan memicu unduhan.
 * Memenuhi Rules #10:
 * - Menggunakan fflate tanpa backend (Rules #10.4, #10.7)
 * - Kegagalan ZIP tidak boleh menghapus/mengubah foto sumber lokal (Rules #10.5)
 */
export async function executeBatchZipDownload(
  photos: Photo[],
  options: ExecuteBatchZipOptions = {},
): Promise<{ success: boolean; filename?: string; blob?: Blob; error?: string }> {
  if (photos.length === 0) {
    return { success: false, error: "Tidak ada foto yang dipilih untuk diunduh." };
  }

  const zipName = options.zipFilename || buildZipFilename();
  const zipEntries = prepareZipEntries(photos);

  const zipResult = await createZipBlob(zipEntries, options.onProgress);

  if (zipResult.status !== "success") {
    // Aturan #10.5: Kegagalan ZIP tidak boleh menghapus foto sumber lokal
    return { success: false, error: zipResult.message };
  }

  downloadBlob(zipResult.blob, zipName, options.env);

  // Tandai seluruh foto yang berhasil di-ZIP sebagai downloaded = true di IndexedDB
  for (const photo of photos) {
    try {
      const updated: Photo = { ...photo, downloaded: true };
      await updatePhoto(updated);
      options.onPhotoUpdated?.(updated);
    } catch {
      // Abaikan minor update error
    }
  }

  return { success: true, filename: zipName, blob: zipResult.blob };
}

export interface UseDownloadManagerOptions {
  env?: DownloadEnvironment;
}

export interface DownloadBatchOptions {
  zipFilename?: string;
  onPhotoUpdated?: (updatedPhoto: Photo) => void;
  showDialog?: boolean;
}

export interface UseDownloadManagerReturn {
  state: DownloadProgressState;
  isDownloading: boolean;
  downloadSingle: (photo: Photo) => Promise<boolean>;
  downloadBatchZip: (
    photos: Photo[],
    options?: DownloadBatchOptions,
  ) => Promise<{ success: boolean; filename?: string; error?: string }>;
  closeDialog: () => void;
  reset: () => void;
}

/**
 * Hook pengelola unduhan foto tunggal dan batch ZIP dengan pelacakan progres (Phase 11).
 */
export function useDownloadManager(
  options: UseDownloadManagerOptions = {},
): UseDownloadManagerReturn {
  const [state, setState] = useState<DownloadProgressState>(INITIAL_DOWNLOAD_STATE);
  const isCancelledRef = useRef<boolean>(false);

  /**
   * Mengunduh satu foto ke penyimpanan lokal browser pengguna.
   */
  const downloadSingle = useCallback(
    async (photo: Photo): Promise<boolean> => {
      return executeSingleDownload(photo, options.env);
    },
    [options.env],
  );

  /**
   * Mengunduh banyak foto sebagai satu file ZIP dengan visualisasi progres real-time.
   */
  const downloadBatchZip = useCallback(
    async (
      photos: Photo[],
      batchOpts: DownloadBatchOptions = {},
    ): Promise<{ success: boolean; filename?: string; error?: string }> => {
      if (photos.length === 0) {
        return { success: false, error: "Tidak ada foto yang dipilih untuk diunduh." };
      }

      isCancelledRef.current = false;
      const totalCount = photos.length;
      const zipName = batchOpts.zipFilename || buildZipFilename();
      const shouldShowDialog = batchOpts.showDialog ?? true;

      if (shouldShowDialog) {
        setState({
          isOpen: true,
          phase: "preparing",
          percent: 5,
          currentCount: 0,
          totalCount,
          targetFilename: zipName,
        });
      }

      try {
        const res = await executeBatchZipDownload(photos, {
          zipFilename: zipName,
          env: options.env,
          onPhotoUpdated: batchOpts.onPhotoUpdated,
          onProgress: (progress) => {
            if (isCancelledRef.current) return;

            if (progress.phase === "reading") {
              setState((prev) => ({
                ...prev,
                phase: "preparing",
                percent: Math.min(progress.percent, 60),
                currentCount: progress.current,
                currentFilename: progress.filename,
              }));
            } else if (progress.phase === "compressing") {
              setState((prev) => ({
                ...prev,
                phase: "compressing",
                percent: 75,
                currentCount: totalCount,
              }));
            } else if (progress.phase === "done") {
              setState((prev) => ({
                ...prev,
                phase: "downloading",
                percent: 90,
              }));
            }
          },
        });

        if (!res.success) {
          if (shouldShowDialog) {
            setState((prev) => ({
              ...prev,
              phase: "error",
              errorMessage: res.error,
            }));
          }
          return { success: false, error: res.error };
        }

        if (shouldShowDialog) {
          setState((prev) => ({
            ...prev,
            phase: "completed",
            percent: 100,
            fileSizeBytes: res.blob?.size,
          }));
        }

        return { success: true, filename: res.filename };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan saat memproses file ZIP.";
        if (shouldShowDialog) {
          setState((prev) => ({
            ...prev,
            phase: "error",
            errorMessage: message,
          }));
        }
        return { success: false, error: message };
      }
    },
    [options.env],
  );

  /**
   * Menutup dialog progres unduhan.
   */
  const closeDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  /**
   * Mengatur ulang seluruh state unduhan ke default.
   */
  const reset = useCallback(() => {
    isCancelledRef.current = true;
    setState(INITIAL_DOWNLOAD_STATE);
  }, []);

  return {
    state,
    isDownloading:
      state.isOpen &&
      (state.phase === "preparing" ||
        state.phase === "compressing" ||
        state.phase === "downloading"),
    downloadSingle,
    downloadBatchZip,
    closeDialog,
    reset,
  };
}
