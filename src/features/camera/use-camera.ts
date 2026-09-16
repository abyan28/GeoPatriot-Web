"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  startCamera,
  stopCamera,
  switchCamera,
  isCameraSupported,
  getCameraZoomCapabilities,
  getCameraCurrentZoom,
  applyCameraZoom,
  calculateZoomPresets,
  waitForVideoFrame,
  type CameraStatus,
  type CameraFacingMode,
  type ZoomCapabilities,
} from "@/lib/browser/camera";

export interface UseCameraResult {
  status: CameraStatus;
  facingMode: CameraFacingMode;
  stream: MediaStream | null;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  zoom: number;
  zoomCapabilities: ZoomCapabilities | null;
  isZoomSupported: boolean;
  zoomPresets: number[];
  setZoom: (targetZoom: number) => Promise<boolean>;
  start: (mode?: CameraFacingMode) => Promise<void>;
  stop: () => void;
  toggleFacingMode: () => Promise<void>;
}

/**
 * Custom React Hook untuk mengelola siklus hidup stream kamera.
 * Mengonsumsi src/lib/browser/camera.ts tanpa menduplikasi logic getUserMedia.
 */
export function useCamera(initialFacingMode: CameraFacingMode = "environment"): UseCameraResult {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoom, setZoomState] = useState<number>(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<ZoomCapabilities | null>(null);
  const [zoomPresets, setZoomPresets] = useState<number[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Lock re-entrancy agar start/stop/switch kamera tidak tumpang-tindih saat dipanggil berulang cepat.
  const isTransitioningRef = useRef(false);
  // Menandai apakah kamera dimatikan sementara karena tab/app masuk background,
  // agar bisa dinyalakan ulang otomatis saat kembali ke foreground.
  const pausedByVisibilityRef = useRef(false);
  // Penanda urutan permintaan zoom, agar hasil applyCameraZoom yang resolve
  // basi (setelah ada permintaan zoom lain yang lebih baru, umum terjadi saat
  // gestur pinch cepat) tidak menimpa state zoom yang seharusnya lebih baru.
  const zoomRequestIdRef = useRef(0);

  /**
   * Menyelaraskan kapabilitas dan nilai zoom saat stream kamera berubah (rules #3.8).
   */
  const syncZoomCapabilities = useCallback((activeStream: MediaStream | null) => {
    if (!activeStream) {
      setZoomCapabilities(null);
      setZoomPresets([]);
      setZoomState(1);
      return;
    }

    const caps = getCameraZoomCapabilities(activeStream);
    setZoomCapabilities(caps);
    if (caps) {
      const presets = calculateZoomPresets(caps);
      setZoomPresets(presets);
      const current = getCameraCurrentZoom(activeStream);
      setZoomState(current);
    } else {
      setZoomPresets([]);
      setZoomState(1);
    }
  }, []);

  /**
   * Menerapkan tingkat zoom kamera native melalui MediaTrackConstraints (rules #3.7).
   */
  const setZoom = useCallback(
    async (targetZoom: number): Promise<boolean> => {
      if (!stream || !zoomCapabilities) return false;

      // Batasi dalam rentang min dan max
      const clamped = Math.min(Math.max(targetZoom, zoomCapabilities.min), zoomCapabilities.max);
      const step = zoomCapabilities.step || 0.1;
      const rounded = Number((Math.round(clamped / step) * step).toFixed(2));

      // Tandai permintaan ini sebagai yang terbaru; hasil applyConstraints yang
      // resolve setelah permintaan lebih baru dikirim akan diabaikan
      // (staleness guard, audit finding FINDING-04).
      const requestId = ++zoomRequestIdRef.current;
      const success = await applyCameraZoom(stream, rounded);
      if (success && requestId === zoomRequestIdRef.current) {
        setZoomState(rounded);
      }
      return success;
    },
    [stream, zoomCapabilities],
  );

  /**
   * Menghubungkan MediaStream aktif ke elemen video HTML.
   */
  const attachStreamToVideo = useCallback((activeStream: MediaStream | null) => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeStream;
      if (activeStream) {
        videoRef.current.play().catch((err) => {
          // Play() mungkin memerlukan interaksi pengguna pada beberapa browser
          console.warn("Gagal auto-play video:", err);
        });
      }
    }
  }, []);

  /**
   * Menyalakan kamera dengan facing mode tertentu.
   */
  const start = useCallback(
    async (mode?: CameraFacingMode) => {
      // Cegah start() tumpang-tindih bila sudah ada proses start/switch berjalan (race condition guard).
      if (isTransitioningRef.current) return;

      if (!isCameraSupported()) {
        setStatus("unsupported");
        setErrorMessage("Browser Anda tidak mendukung akses kamera.");
        return;
      }

      isTransitioningRef.current = true;
      try {
        const targetMode = mode ?? facingMode;
        setStatus("requesting");
        setErrorMessage(null);

        // Hentikan stream lama jika sedang berjalan
        if (stream) {
          stopCamera(stream);
          setStream(null);
        }

        const result = await startCamera(targetMode);

        if (result.status === "ready" && result.stream) {
          setStream(result.stream);
          setFacingMode(targetMode);
          attachStreamToVideo(result.stream);
          syncZoomCapabilities(result.stream);
          // Tunda status "ready" (mengaktifkan shutter) sampai frame pertama
          // benar-benar ter-decode — mencegah capture menghasilkan foto hitam
          // (audit finding: foto terbaru tampil hitam di galeri).
          await waitForVideoFrame(videoRef.current);
          setStatus("ready");
        } else {
          setStatus(result.status);
          syncZoomCapabilities(null);
          setErrorMessage(result.errorMessage ?? "Gagal mengaktifkan kamera.");
        }
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [facingMode, stream, attachStreamToVideo, syncZoomCapabilities],
  );

  /**
   * Menghentikan kamera aktif.
   */
  const stop = useCallback(() => {
    if (stream) {
      stopCamera(stream);
      setStream(null);
    }
    attachStreamToVideo(null);
    syncZoomCapabilities(null);
    setStatus("idle");
  }, [stream, attachStreamToVideo, syncZoomCapabilities]);

  /**
   * Berpindah arah kamera (depan <-> belakang).
   */
  const toggleFacingMode = useCallback(async () => {
    // Cegah dua panggilan switch kamera tumpang-tindih (mis. tap flip dua kali cepat).
    if (isTransitioningRef.current) return;

    const nextMode: CameraFacingMode = facingMode === "environment" ? "user" : "environment";

    if (!stream) {
      await start(nextMode);
      return;
    }

    isTransitioningRef.current = true;
    try {
      setStatus("requesting");
      const result = await switchCamera(stream, nextMode);

      if (result.status === "ready" && result.stream) {
        setStream(result.stream);
        setFacingMode(nextMode);
        attachStreamToVideo(result.stream);
        syncZoomCapabilities(result.stream);
        // Sama seperti start(): tunda "ready" sampai frame pertama ter-decode.
        await waitForVideoFrame(videoRef.current);
        setStatus("ready");
      } else {
        setStatus(result.status);
        syncZoomCapabilities(null);
        setErrorMessage(result.errorMessage ?? "Gagal beralih kamera.");
      }
    } finally {
      isTransitioningRef.current = false;
    }
  }, [facingMode, stream, start, attachStreamToVideo, syncZoomCapabilities]);

  // Cleanup otomatis saat unmount agar stream kamera dimatikan
  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream);
      }
    };
  }, [stream]);

  // Hentikan kamera saat tab/app dibawa ke background (privacy & battery),
  // lalu nyalakan kembali otomatis saat kembali ke foreground (rules #3, workflow Phase 15).
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        if (stream) {
          pausedByVisibilityRef.current = true;
          stop();
        }
      } else if (pausedByVisibilityRef.current) {
        pausedByVisibilityRef.current = false;
        void start(facingMode);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stream, facingMode, start, stop]);

  const isZoomSupported = useMemo(() => Boolean(zoomCapabilities), [zoomCapabilities]);

  return {
    status,
    facingMode,
    stream,
    errorMessage,
    videoRef,
    zoom,
    zoomCapabilities,
    isZoomSupported,
    zoomPresets,
    setZoom,
    start,
    stop,
    toggleFacingMode,
  };
}
