"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import {
  isFullscreenSupported,
  getFullscreenElement,
  requestFullscreen,
  exitFullscreen,
  type FullscreenResult,
} from "@/lib/browser/fullscreen";

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  toggleFullscreen: () => Promise<FullscreenResult>;
}

/**
 * Hook Fullscreen API untuk camera mode (App-like Camera Experience).
 * BERBEDA dari PWA standalone (src/features/pwa/use-pwa.ts): fullscreen di sini
 * murni Web Fullscreen API yang dipicu interaksi pengguna, berlaku juga saat
 * app dibuka di tab browser biasa (bukan hanya versi PWA yang di-install).
 *
 * `isFullscreen` HANYA di-derive dari event `fullscreenchange` yang membaca
 * state fullscreen browser sesungguhnya — bukan diasumsikan dari hasil
 * request/exit saja — supaya tetap sinkron ketika pengguna keluar fullscreen
 * lewat tombol browser/Escape/gesture platform, bukan hanya lewat tombol app.
 */
export function useFullscreen(targetRef: RefObject<HTMLElement | null>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSupported] = useState<boolean>(() => isFullscreenSupported());

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(getFullscreenElement() === targetRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [targetRef]);

  /**
   * Toggle fullscreen: request bila belum aktif, exit bila sudah aktif.
   * Kegagalan dikembalikan sebagai status eksplisit (tidak throw) agar caller
   * bisa menampilkan feedback ringan tanpa mengganggu kamera/session (PRD: "Fullscreen
   * error → non-fatal enhancement failure").
   */
  const toggleFullscreen = useCallback(async (): Promise<FullscreenResult> => {
    if (isFullscreen) {
      return exitFullscreen();
    }
    if (!targetRef.current) {
      return { status: "error", message: "Elemen target fullscreen belum siap." };
    }
    return requestFullscreen(targetRef.current);
  }, [isFullscreen, targetRef]);

  return { isFullscreen, isSupported, toggleFullscreen };
}
