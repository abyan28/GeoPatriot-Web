"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Photo, Session, SessionMode } from "@/types/session";
import {
  listPhotosBySession,
  deletePhoto,
  deletePhotosBySession,
} from "@/lib/storage/photo-repository";
import {
  listSessions,
  createSession,
  deleteSession,
} from "@/lib/storage/session-repository";
import { executeSingleDownload, executeBatchZipDownload } from "@/features/downloads";
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
  loadError: string | null;
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
  reloadPhotos: () => Promise<void>;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  // Menandai request sesi terbaru agar response yang basi (dari rapid session
  // switching) tidak menimpa state foto milik sesi yang sudah tidak aktif lagi.
  const latestSessionRequestRef = useRef<string | null>(null);

  /**
   * Mengambil daftar seluruh sesi dari IndexedDB.
   */
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listSessions();
      if (res.status === "success") {
        setSessions(res.data);
        setLoadError(null);
        if (!activeSessionId && res.data.length > 0) {
          setActiveSessionId(res.data[0].id);
        }
      } else {
        setLoadError(res.message);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat daftar sesi.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  /**
   * Memuat daftar foto untuk sesi tertentu. Mengabaikan hasil bila sudah ada
   * permintaan sesi lain yang lebih baru (staleness guard, mencegah race
   * condition saat pengguna berpindah sesi dengan cepat).
   */
  const loadPhotosForSession = useCallback(async (sessionId: string) => {
    latestSessionRequestRef.current = sessionId;
    setIsLoading(true);
    try {
      const res = await listPhotosBySession(sessionId);
      if (latestSessionRequestRef.current !== sessionId) return;
      if (res.status === "success") {
        setPhotos(res.data);
        setLoadError(null);
      } else {
        setPhotos([]);
        setLoadError(res.message);
      }
      setSelectedPhotoIds(new Set());
    } catch (err) {
      if (latestSessionRequestRef.current !== sessionId) return;
      setPhotos([]);
      setLoadError(err instanceof Error ? err.message : "Gagal memuat foto sesi.");
    } finally {
      if (latestSessionRequestRef.current === sessionId) {
        setIsLoading(false);
      }
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
            latestSessionRequestRef.current = targetId;
            const photoRes = await listPhotosBySession(targetId);
            if (!isMounted || latestSessionRequestRef.current !== targetId) return;
            if (photoRes.status === "success") {
              setPhotos(photoRes.data);
              setLoadError(null);
            } else {
              setLoadError(photoRes.message);
            }
          }
        } else {
          setLoadError(res.message);
        }
      } catch (err) {
        if (!isMounted) return;
        setLoadError(err instanceof Error ? err.message : "Gagal memuat data sesi.");
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

    const idsToDelete = Array.from(selectedPhotoIds);
    // Hanya foto yang BENAR-BENAR terhapus dari IndexedDB yang boleh dihapus
    // dari state UI, agar state tidak pernah menyimpang dari storage bila ada
    // kegagalan parsial (rules #8.4).
    const succeededIds = new Set<string>();

    for (const id of idsToDelete) {
      try {
        const res = await deletePhoto(id);
        if (res.status === "success") {
          succeededIds.add(id);
        }
      } catch {
        // Lanjutkan penghapusan foto lain bila salah satu gagal
      }
    }

    setPhotos((prev) => prev.filter((p) => !succeededIds.has(p.id)));
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });

    return {
      success: succeededIds.size === idsToDelete.length,
      count: succeededIds.size,
    };
  }, [selectedPhotoIds]);

  /**
   * Membersihkan seluruh foto dalam sesi saat ini dan menghapus sesi (Rules #8.7-8.8).
   */
  const clearCurrentSession = useCallback(async (): Promise<boolean> => {
    if (!activeSessionId) return false;
    const sessionIdToClear = activeSessionId;
    let success = true;

    try {
      await deletePhotosBySession(sessionIdToClear);
      await deleteSession(sessionIdToClear);
    } catch {
      success = false;
    }

    // Selalu sinkronkan ulang state dari IndexedDB (baik sukses maupun gagal
    // sebagian) agar UI tidak pernah menampilkan foto/sesi yang sudah tidak
    // konsisten dengan storage sesungguhnya (rules #8.4, mencegah stale UI).
    const remainingSessions = await listSessions();
    if (remainingSessions.status === "success") {
      setSessions(remainingSessions.data);
      const nextId = remainingSessions.data.length > 0 ? remainingSessions.data[0].id : null;
      setActiveSessionId(nextId);
      if (nextId) {
        await loadPhotosForSession(nextId);
      } else {
        setPhotos([]);
        setSelectedPhotoIds(new Set());
      }
    }

    return success;
  }, [activeSessionId, loadPhotosForSession]);

  /**
   * Mengunduh satu foto dan menandai status `downloaded = true` (PRD #14).
   */
  const downloadSingle = useCallback(async (photo: Photo): Promise<void> => {
    const success = await executeSingleDownload(photo);
    if (success) {
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, downloaded: true } : p)));
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
    const res = await executeBatchZipDownload(selectedPhotos);
    setIsDownloadingZip(false);

    if (res.success) {
      setPhotos((prev) =>
        prev.map((p) => (selectedPhotoIds.has(p.id) ? { ...p, downloaded: true } : p)),
      );
    }

    return res;
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
    const res = await executeBatchZipDownload(photos);
    setIsDownloadingZip(false);

    if (res.success) {
      setPhotos((prev) => prev.map((p) => ({ ...p, downloaded: true })));
    }

    return res;
  }, [photos]);

  /**
   * Memuat ulang daftar foto sesi yang sedang aktif.
   */
  const reloadPhotos = useCallback(async () => {
    if (activeSessionId) {
      await loadPhotosForSession(activeSessionId);
    }
  }, [activeSessionId, loadPhotosForSession]);

  /**
   * Membuat sesi baru dengan mode yang ditentukan (Phase 9).
   */
  const createNewSessionAction = useCallback(
    async (mode: SessionMode = "gps-auto-time"): Promise<string> => {
      const newSessionId = `session_${Date.now()}`;
      const sessionData: Session = {
        id: newSessionId,
        createdAt: new Date().toISOString(),
        mode,
        watermarkSettings: createDefaultTemplate(),
      };

      await createSession(sessionData);

      // Invalidasi request loadPhotosForSession sesi sebelumnya yang mungkin
      // masih berjalan, agar responsnya tidak menimpa state sesi baru ini.
      latestSessionRequestRef.current = newSessionId;
      setSessions((prev) => [sessionData, ...prev]);
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
    loadError,
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
    reloadPhotos,
  };
}

export { prepareZipEntries } from "@/features/downloads";
