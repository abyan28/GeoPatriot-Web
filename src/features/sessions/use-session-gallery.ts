"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Photo, Session, SessionMode } from "@/types/session";
import {
  listPhotosBySession,
  deletePhoto,
  deletePhotosBySession,
  updatePhoto,
} from "@/lib/storage/photo-repository";
import {
  listSessions,
  createSession,
  deleteSession,
} from "@/lib/storage/session-repository";
import { createZipBlob, type ZipEntry } from "@/lib/downloads/zip-download";
import { downloadBlob } from "@/lib/downloads/single-download";
import { buildPhotoFilename, buildZipFilename } from "@/lib/downloads/filename";
import { createDefaultTemplate } from "@/lib/image/templates";

export interface UseSessionGalleryReturn {
  sessions: Session[];
  activeSessionId: string | null;
  activeSession: Session | null;
  photos: Photo[];
  selectedPhotoIds: Set<string>;
  isLoading: boolean;
  isDownloadingZip: boolean;
  undownloadedCount: number;
  loadSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  toggleSelectPhoto: (photoId: string) => void;
  selectAllPhotos: () => void;
  clearSelection: () => void;
  deleteSelectedPhotos: () => Promise<{ success: boolean; count: number }>;
  deleteSinglePhoto: (photoId: string) => Promise<boolean>;
  clearCurrentSession: () => Promise<boolean>;
  downloadSingle: (photo: Photo) => Promise<void>;
  downloadSelectedAsZip: () => Promise<{ success: boolean; filename?: string; error?: string }>;
  downloadAllAsZip: () => Promise<{ success: boolean; filename?: string; error?: string }>;
  createNewSession: (mode?: SessionMode) => Promise<string>;
}

/**
 * Hook pengelola Galeri Sesi (Phase 9 & 10).
 * Mengelola daftar sesi, foto-foto dalam sesi, multi-selection, unduhan ZIP, dan penghapusan data lokal.
 * Sesuai Rules #8 (Storage Rules), Rules #9 (Session Rules), dan Rules #10 (Download Rules).
 */
export function useSessionGallery(initialSessionId?: string | null): UseSessionGalleryReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId ?? null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  /**
   * Mengambil daftar seluruh sesi dari IndexedDB.
   */
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listSessions();
      if (res.status === "success") {
        setSessions(res.data);
        if (!activeSessionId && res.data.length > 0) {
          setActiveSessionId(res.data[0].id);
        }
      }
    } catch {
      // Storage error handling
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  /**
   * Memuat daftar foto untuk sesi tertentu.
   */
  const loadPhotosForSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const res = await listPhotosBySession(sessionId);
      if (res.status === "success") {
        setPhotos(res.data);
      } else {
        setPhotos([]);
      }
      setSelectedPhotoIds(new Set());
    } catch {
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sinkronisasi inisialisasi sesi & foto saat pertama kali hook di-mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const res = await listSessions();
        if (!isMounted) return;

        if (res.status === "success") {
          setSessions(res.data);
          const targetId = initialSessionId ?? (res.data.length > 0 ? res.data[0].id : null);
          setActiveSessionId(targetId);

          if (targetId) {
            const photoRes = await listPhotosBySession(targetId);
            if (!isMounted) return;
            if (photoRes.status === "success") {
              setPhotos(photoRes.data);
            }
          }
        }
      } catch {
        // Silently handle
      }
    }

    void init();

    return () => {
      isMounted = false;
    };
  }, [initialSessionId]);

  /**
   * Beralih ke sesi lain.
   */
  const selectSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      await loadPhotosForSession(sessionId);
    },
    [loadPhotosForSession],
  );

  /**
   * Toggle seleksi satu foto.
   */
  const toggleSelectPhoto = useCallback((photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }, []);

  /**
   * Memilih seluruh foto dalam sesi aktif.
   */
  const selectAllPhotos = useCallback(() => {
    setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
  }, [photos]);

  /**
   * Menghapus seluruh pilihan seleksi foto.
   */
  const clearSelection = useCallback(() => {
    setSelectedPhotoIds(new Set());
  }, []);

  /**
   * Menghapus satu foto dari IndexedDB dan state.
   */
  const deleteSinglePhoto = useCallback(async (photoId: string): Promise<boolean> => {
    try {
      const res = await deletePhoto(photoId);
      if (res.status === "success") {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setSelectedPhotoIds((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  /**
   * Menghapus semua foto yang sedang dipilih.
   */
  const deleteSelectedPhotos = useCallback(async (): Promise<{ success: boolean; count: number }> => {
    if (selectedPhotoIds.size === 0) return { success: true, count: 0 };

    let deletedCount = 0;
    const idsToDelete = Array.from(selectedPhotoIds);

    for (const id of idsToDelete) {
      try {
        const res = await deletePhoto(id);
        if (res.status === "success") {
          deletedCount++;
        }
      } catch {
        // Lanjutkan penghapusan foto lain bila salah satu gagal
      }
    }

    setPhotos((prev) => prev.filter((p) => !selectedPhotoIds.has(p.id)));
    setSelectedPhotoIds(new Set());

    return {
      success: deletedCount > 0,
      count: deletedCount,
    };
  }, [selectedPhotoIds]);

  /**
   * Membersihkan seluruh foto dalam sesi saat ini dan menghapus sesi (Rules #8.7-8.8).
   */
  const clearCurrentSession = useCallback(async (): Promise<boolean> => {
    if (!activeSessionId) return false;

    try {
      await deletePhotosBySession(activeSessionId);
      await deleteSession(activeSessionId);

      setPhotos([]);
      setSelectedPhotoIds(new Set());

      // Muat ulang daftar sesi yang tersisa
      const remainingSessions = await listSessions();
      if (remainingSessions.status === "success") {
        setSessions(remainingSessions.data);
        if (remainingSessions.data.length > 0) {
          const nextId = remainingSessions.data[0].id;
          setActiveSessionId(nextId);
          await loadPhotosForSession(nextId);
        } else {
          setActiveSessionId(null);
        }
      }
      return true;
    } catch {
      return false;
    }
  }, [activeSessionId, loadPhotosForSession]);

  /**
   * Mengunduh satu foto dan menandai status `downloaded = true` (PRD #14).
   */
  const downloadSingle = useCallback(async (photo: Photo): Promise<void> => {
    const blobToDownload = photo.processedBlob || photo.originalBlob;
    const filename = buildPhotoFilename(photo.snapshot.capturedAt);
    downloadBlob(blobToDownload, filename);

    // Tandai status downloaded di IndexedDB
    try {
      const updated: Photo = { ...photo, downloaded: true };
      await updatePhoto(updated);
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
    } catch {
      // Abaikan bila update status gagal
    }
  }, []);

  /**
   * Mengunduh foto-foto yang dipilih sebagai satu file ZIP (Phase 11 / PRD #15).
   */
  const downloadSelectedAsZip = useCallback(async (): Promise<{
    success: boolean;
    filename?: string;
    error?: string;
  }> => {
    const selectedPhotos = photos.filter((p) => selectedPhotoIds.has(p.id));
    if (selectedPhotos.length === 0) {
      return { success: false, error: "Tidak ada foto yang dipilih." };
    }

    setIsDownloadingZip(true);
    try {
      const zipEntries = prepareZipEntries(selectedPhotos);
      const zipResult = await createZipBlob(zipEntries);
      if (zipResult.status !== "success") {
        setIsDownloadingZip(false);
        return { success: false, error: zipResult.message };
      }

      const zipFilename = buildZipFilename();
      downloadBlob(zipResult.blob, zipFilename);

      // Tandai seluruh foto yang diunduh sebagai downloaded = true
      for (const p of selectedPhotos) {
        try {
          await updatePhoto({ ...p, downloaded: true });
        } catch {
          // Lanjutkan
        }
      }

      setPhotos((prev) =>
        prev.map((p) => (selectedPhotoIds.has(p.id) ? { ...p, downloaded: true } : p)),
      );

      setIsDownloadingZip(false);
      return { success: true, filename: zipFilename };
    } catch (err) {
      setIsDownloadingZip(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Gagal mengompresi foto ke ZIP.",
      };
    }
  }, [photos, selectedPhotoIds]);

  /**
   * Mengunduh seluruh foto dalam sesi aktif sebagai satu file ZIP (PRD #14 & #15).
   */
  const downloadAllAsZip = useCallback(async (): Promise<{
    success: boolean;
    filename?: string;
    error?: string;
  }> => {
    if (photos.length === 0) {
      return { success: false, error: "Sesi ini belum memiliki foto untuk diunduh." };
    }

    setIsDownloadingZip(true);
    try {
      const zipEntries = prepareZipEntries(photos);
      const zipResult = await createZipBlob(zipEntries);
      if (zipResult.status !== "success") {
        setIsDownloadingZip(false);
        return { success: false, error: zipResult.message };
      }

      const zipFilename = buildZipFilename();
      downloadBlob(zipResult.blob, zipFilename);

      // Tandai seluruh foto sesi sebagai downloaded = true
      for (const p of photos) {
        try {
          await updatePhoto({ ...p, downloaded: true });
        } catch {
          // Lanjutkan
        }
      }

      setPhotos((prev) => prev.map((p) => ({ ...p, downloaded: true })));

      setIsDownloadingZip(false);
      return { success: true, filename: zipFilename };
    } catch (err) {
      setIsDownloadingZip(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Gagal mengompresi seluruh sesi ke ZIP.",
      };
    }
  }, [photos]);

  /**
   * Membuat sesi baru.
   */
  const createNewSessionAction = useCallback(
    async (mode: SessionMode = "gps-auto-time"): Promise<string> => {
      const newSessionId = `session_${Date.now()}`;
      const newSession: Session = {
        id: newSessionId,
        createdAt: new Date().toISOString(),
        mode,
        watermarkSettings: createDefaultTemplate(),
      };

      await createSession(newSession);
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSessionId);
      setPhotos([]);
      setSelectedPhotoIds(new Set());
      return newSessionId;
    },
    [],
  );

  // Sesi aktif saat ini
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) ?? null;
  }, [sessions, activeSessionId]);

  // Jumlah foto yang belum pernah diunduh pengguna (PRD #14)
  const undownloadedCount = useMemo(() => {
    return photos.filter((p) => !p.downloaded).length;
  }, [photos]);

  return {
    sessions,
    activeSessionId,
    activeSession,
    photos,
    selectedPhotoIds,
    isLoading,
    isDownloadingZip,
    undownloadedCount,
    loadSessions,
    selectSession,
    toggleSelectPhoto,
    selectAllPhotos,
    clearSelection,
    deleteSelectedPhotos,
    deleteSinglePhoto,
    clearCurrentSession,
    downloadSingle,
    downloadSelectedAsZip,
    downloadAllAsZip,
    createNewSession: createNewSessionAction,
  };
}

/**
 * Menyiapkan daftar ZipEntry dari array Photo untuk pembuatan berkas ZIP client-side.
 * Memberikan penamaan terstruktur berurutan agar foto terurut saat diekstrak.
 *
 * @param photos Daftar foto yang akan dikonversi menjadi entri ZIP.
 * @returns Array ZipEntry berisi nama file dan Blob gambar.
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

