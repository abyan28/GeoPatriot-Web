"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  startCamera,
  stopCamera,
  switchCamera,
  isCameraSupported,
  type CameraStatus,
  type CameraFacingMode,
} from "@/lib/browser/camera";

export interface UseCameraResult {
  status: CameraStatus;
  facingMode: CameraFacingMode;
  stream: MediaStream | null;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
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

  const videoRef = useRef<HTMLVideoElement | null>(null);

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
      if (!isCameraSupported()) {
        setStatus("unsupported");
        setErrorMessage("Browser Anda tidak mendukung akses kamera.");
        return;
      }

      const targetMode = mode ?? facingMode;
      setStatus("requesting");
      setErrorMessage(null);

      // Hentikan stream lama jika sedang berjalan
      if (stream) {
        stopCamera(stream);
        setStream(null);
      }

      const result = await startCamera(targetMode);
      setStatus(result.status);

      if (result.status === "ready" && result.stream) {
        setStream(result.stream);
        setFacingMode(targetMode);
        attachStreamToVideo(result.stream);
      } else {
        setErrorMessage(result.errorMessage ?? "Gagal mengaktifkan kamera.");
      }
    },
    [facingMode, stream, attachStreamToVideo],
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
    setStatus("idle");
  }, [stream, attachStreamToVideo]);

  /**
   * Berpindah arah kamera (depan <-> belakang).
   */
  const toggleFacingMode = useCallback(async () => {
    const nextMode: CameraFacingMode = facingMode === "environment" ? "user" : "environment";

    if (!stream) {
      await start(nextMode);
      return;
    }

    setStatus("requesting");
    const result = await switchCamera(stream, nextMode);
    setStatus(result.status);

    if (result.status === "ready" && result.stream) {
      setStream(result.stream);
      setFacingMode(nextMode);
      attachStreamToVideo(result.stream);
    } else {
      setErrorMessage(result.errorMessage ?? "Gagal beralih kamera.");
    }
  }, [facingMode, stream, start, attachStreamToVideo]);

  // Cleanup otomatis saat unmount agar stream kamera dimatikan
  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream);
      }
    };
  }, [stream]);

  return {
    status,
    facingMode,
    stream,
    errorMessage,
    videoRef,
    start,
    stop,
    toggleFacingMode,
  };
}
