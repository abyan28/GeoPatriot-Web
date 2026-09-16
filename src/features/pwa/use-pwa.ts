"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Event antarmuka BeforeInstallPromptEvent per spesifikasi W3C.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePwaReturn {
  isOnline: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
  isServiceWorkerReady: boolean;
  installApp: () => Promise<boolean>;
}

/**
 * Hook pengelola status PWA, offline detection, dan instalasi aplikasi (Phase 12 / PRD #19).
 * Mematuhi Rules #14.5:
 * - PWA install prompt behavior dapat berbeda antar platform; fitur aplikasi tidak boleh bergantung padanya.
 */
export function usePwa(): UsePwaReturn {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    );
  });
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Event listener status koneksi online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 3. Registrasi Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setIsServiceWorkerReady(true);
          // Pantau pembaruan service worker
          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] Konten baru tersedia, silakan refresh.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("[PWA] Registrasi service worker gagal:", err);
        });
    }

    // 4. Tangkap event beforeinstallprompt jika didukung oleh browser (Chrome/Edge Android & Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 5. Tangkap event appinstalled
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /**
   * Memicu dialog instalasi PWA bawaan browser.
   */
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return choice.outcome === "accepted";
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  return {
    isOnline,
    isInstallable,
    isStandalone,
    isServiceWorkerReady,
    installApp,
  };
}
