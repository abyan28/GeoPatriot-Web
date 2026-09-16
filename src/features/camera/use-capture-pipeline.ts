"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Photo, Session } from "@/types/session";
import type { MetadataSnapshot } from "@/types/metadata";
import type { WatermarkVisualSettings } from "@/types/watermark";
import { captureVideoFrame } from "@/lib/image/frame-capture";
import { renderWatermark } from "@/lib/image/watermark-engine";
import { createDefaultTemplate } from "@/lib/image/templates";
import { addPhoto, listPhotosBySession } from "@/lib/storage/photo-repository";
import { createSession, listSessions } from "@/lib/storage/session-repository";

export interface CaptureResult {
  status: "success" | "error";
  photo?: Photo;
  errorMessage?: string;
}

export interface UseCapturePipelineParams {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  watermarkSettings?: WatermarkVisualSettings;
  createSnapshot: () => MetadataSnapshot;
}

export interface UseCapturePipelineReturn {
  capturePhoto: () => Promise<CaptureResult>;
  isCapturing: boolean;
  lastPhoto: Photo | null;
  sessionPhotos: Photo[];
  sessionPhotoCount: number;
  currentSessionId: string | null;
  createNewSession: () => Promise<string>;
  reloadSessionPhotos: () => Promise<void>;
}

/**
 * Hook pengelola Capture Pipeline (Phase 5) & Watermark Rendering (Phase 6).
 * Mengimplementasikan alur pemotretan lengkap sesuai agents/workflow-geopatriot-web.md #7:
 * Shutter -> Freeze Metadata Snapshot -> Capture Frame -> Render Watermark -> Store to IndexedDB -> Update Gallery.
 */
export function useCapturePipeline({
  videoRef,
  isCameraReady,
  watermarkSettings = createDefaultTemplate(),
  createSnapshot,
}: UseCapturePipelineParams): UseCapturePipelineReturn {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionPhotos, setSessionPhotos] = useState<Photo[]>([]);
  const [lastPhoto, setLastPhoto] = useState<Photo | null>(null);

  // Cache elemen logo aplikasi resmi di memori agar cepat dirender tanpa delay jaringan
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  // Lock idempotency di level fungsi (bukan hanya UI) agar shutter yang dipencet
  // dua kali sangat cepat tidak memicu dua capture paralel (race condition guard).
  const isCapturingRef = useRef(false);
  // Cache promise session yang sedang dibuat agar dua capture yang terjadi
  // hampir bersamaan tidak masing-masing membuat session baru (TOCTOU guard).
  const ensureSessionPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new window.Image();
      img.src = "/app-icon.png";
      img.onload = () => {
        logoImageRef.current = img;
      };
    }
  }, []);

  /**
   * Mengambil session aktif yang sudah ada, atau membuat session baru jika belum ada.
   */
  const ensureActiveSession = useCallback(async (): Promise<string> => {
    if (currentSessionId) return currentSessionId;

    // Bila sudah ada proses pembuatan session yang berjalan, gunakan promise yang
    // sama alih-alih membuat dua session baru secara bersamaan (TOCTOU guard).
    if (ensureSessionPromiseRef.current) {
      return ensureSessionPromiseRef.current;
    }

    const creationPromise = (async (): Promise<string> => {
      try {
        const existingSessionsResult = await listSessions();
        if (
          existingSessionsResult.status === "success" &&
          existingSessionsResult.data.length > 0
        ) {
          const latestSession = existingSessionsResult.data[0];
          setCurrentSessionId(latestSession.id);
          return latestSession.id;
        }
      } catch {
        // Abaikan jika database baru pertama kali diakses
      }

      // Buat session baru bila belum ada
      const newSessionId = `session_${Date.now()}`;
      const newSession: Session = {
        id: newSessionId,
        createdAt: new Date().toISOString(),
        mode: "gps-auto-time",
        watermarkSettings,
      };

      await createSession(newSession);
      setCurrentSessionId(newSessionId);
      return newSessionId;
    })();

    ensureSessionPromiseRef.current = creationPromise;
    try {
      return await creationPromise;
    } finally {
      ensureSessionPromiseRef.current = null;
    }
  }, [currentSessionId, watermarkSettings]);

  /**
   * Memuat ulang daftar foto sesi aktif dari IndexedDB.
   */
  const reloadSessionPhotos = useCallback(async () => {
    const activeId = await ensureActiveSession();
    try {
      const result = await listPhotosBySession(activeId);
      if (result.status === "success") {
        setSessionPhotos(result.data);
        if (result.data.length > 0) {
          setLastPhoto(result.data[result.data.length - 1]);
        } else {
          setLastPhoto(null);
        }
      }
    } catch {
      // Tangani storage error
    }
  }, [ensureActiveSession]);

  // Muat foto sesi yang ada saat inisialisasi
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const existingSessions = await listSessions();
        let activeId: string;
        if (existingSessions.status === "success" && existingSessions.data.length > 0) {
          activeId = existingSessions.data[0].id;
        } else {
          activeId = `session_${Date.now()}`;
          await createSession({
            id: activeId,
            createdAt: new Date().toISOString(),
            mode: "gps-auto-time",
            watermarkSettings,
          });
        }

        if (!isMounted) return;
        setCurrentSessionId(activeId);

        const result = await listPhotosBySession(activeId);
        if (!isMounted) return;
        if (result.status === "success") {
          setSessionPhotos(result.data);
          if (result.data.length > 0) {
            setLastPhoto(result.data[result.data.length - 1]);
          } else {
            setLastPhoto(null);
          }
        }
      } catch {
        // Tangani storage error
      }
    }

    void init();

    return () => {
      isMounted = false;
    };
  }, [watermarkSettings]);

  /**
   * Membuat session baru secara manual (misal saat berganti lokasi penugasan).
   */
  const createNewSession = useCallback(async (): Promise<string> => {
    const newSessionId = `session_${Date.now()}`;
    const newSession: Session = {
      id: newSessionId,
      createdAt: new Date().toISOString(),
      mode: "gps-auto-time",
      watermarkSettings,
    };
    await createSession(newSession);
    setCurrentSessionId(newSessionId);
    setSessionPhotos([]);
    setLastPhoto(null);
    return newSessionId;
  }, [watermarkSettings]);

  /**
   * Eksekusi alur penangkapan foto (Capture Pipeline):
   * 1. Validasi kesiapan video
   * 2. Pembekuan snapshot metadata secara immutable
   * 3. Ekstraksi frame foto asli (originalBlob) & thumbnail
   * 4. Perenderan watermark ke Canvas (processedBlob)
   * 5. Penyimpanan ke IndexedDB
   */
  const capturePhoto = useCallback(async (): Promise<CaptureResult> => {
    // Guard idempotency di level fungsi: menolak capture kedua bila capture
    // sebelumnya belum selesai, terlepas dari apakah UI sudah re-render (rules #7).
    if (isCapturingRef.current) {
      return {
        status: "error",
        errorMessage: "Sedang memproses foto sebelumnya.",
      };
    }

    if (!isCameraReady || !videoRef.current) {
      return {
        status: "error",
        errorMessage: "Kamera belum aktif. Tunggu hingga video stream siap.",
      };
    }

    isCapturingRef.current = true;
    setIsCapturing(true);

    try {
      // 1. Bekukan snapshot metadata persis di detik shutter ditekan (Rules #5.1)
      const snapshot = createSnapshot();

      // 2. Tangkap frame video kamera asli
      const frameResult = await captureVideoFrame(videoRef.current);
      if (frameResult.status !== "success" || !frameResult.originalBlob) {
        return {
          status: "error",
          errorMessage: frameResult.errorMessage || "Gagal mengambil frame kamera.",
        };
      }

      // 3. Render watermark pada canvas terpisah (Rules #7.1 - foto asli tidak di-overwrite)
      let processedBlob: Blob = frameResult.originalBlob;
      try {
        let sourceImageSource: unknown;
        if (typeof createImageBitmap !== "undefined") {
          sourceImageSource = await createImageBitmap(frameResult.originalBlob);
        } else {
          sourceImageSource = videoRef.current;
        }

        const watermarkResult = await renderWatermark({
          sourceImage: sourceImageSource,
          sourceWidth: frameResult.width || 1080,
          sourceHeight: frameResult.height || 1920,
          // Catatan: mapThumbnailUrl/providerAttribution belum diwire ke provider
          // peta manapun (drawWatermarkPanel juga belum merender field ini) —
          // lihat agents/tasklist.md untuk status fitur map thumbnail watermark.
          data: {
            snapshot,
          },
          settings: watermarkSettings,
          logoImage: logoImageRef.current || undefined,
        });

        if (watermarkResult.status === "success") {
          processedBlob = watermarkResult.blob;
        }
      } catch {
        // Fallback aman: jika rendering canvas bermasalah, tetap gunakan originalBlob (Rule #6.6)
      }

      // 4. Pastikan session aktif tersedia
      const activeSessionId = await ensureActiveSession();

      // 5. Simpan objek foto ke IndexedDB (Rules #8.1)
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newPhoto: Photo = {
        id: photoId,
        sessionId: activeSessionId,
        originalBlob: frameResult.originalBlob,
        processedBlob,
        thumbnailBlob: frameResult.thumbnailBlob || frameResult.originalBlob,
        snapshot,
        processingStatus: "done",
        downloaded: false,
      };

      const saveResult = await addPhoto(newPhoto);
      if (saveResult.status !== "success") {
        return {
          status: "error",
          errorMessage: saveResult.message || "Gagal menyimpan foto ke penyimpanan lokal.",
        };
      }

      // 6. Perbarui state UI galeri
      setSessionPhotos((prev) => [...prev, newPhoto]);
      setLastPhoto(newPhoto);

      return {
        status: "success",
        photo: newPhoto,
      };
    } catch (err) {
      return {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Terjadi kesalahan saat memproses foto.",
      };
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  }, [isCameraReady, videoRef, createSnapshot, watermarkSettings, ensureActiveSession]);

  return {
    capturePhoto,
    isCapturing,
    lastPhoto,
    sessionPhotos,
    sessionPhotoCount: sessionPhotos.length,
    currentSessionId,
    createNewSession,
    reloadSessionPhotos,
  };
}
