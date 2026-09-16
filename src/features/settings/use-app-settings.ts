"use client";

import { useState, useEffect, useCallback } from "react";
import type { WatermarkVisualSettings } from "@/types/watermark";
import { createDefaultTemplate } from "@/lib/image/templates";
import { getSetting, setSetting, clearAllSettings } from "@/lib/storage/settings-repository";
import { clearAllPhotos, deleteDownloadedPhotos } from "@/lib/storage/photo-repository";
import { clearAllSessions, listSessions } from "@/lib/storage/session-repository";
import { getDb } from "@/lib/storage/db";

export interface LocationAppSettings {
  provider: "locationiq" | "fallback";
  highAccuracy: boolean;
  autoFallbackToManual: boolean;
}

export const DEFAULT_LOCATION_SETTINGS: LocationAppSettings = {
  provider: "locationiq",
  highAccuracy: true,
  autoFallbackToManual: true,
};

export interface StorageInfo {
  usageBytes: number;
  quotaBytes: number;
  percentUsed: number;
  photoCount: number;
  sessionCount: number;
  downloadedPhotoCount: number;
  isEstimateSupported: boolean;
}

export const INITIAL_STORAGE_INFO: StorageInfo = {
  usageBytes: 0,
  quotaBytes: 0,
  percentUsed: 0,
  photoCount: 0,
  sessionCount: 0,
  downloadedPhotoCount: 0,
  isEstimateSupported: false,
};

export interface UseAppSettingsReturn {
  watermarkSettings: WatermarkVisualSettings;
  locationSettings: LocationAppSettings;
  storageInfo: StorageInfo;
  isLoading: boolean;
  updateWatermarkSettings: (settings: Partial<WatermarkVisualSettings>) => Promise<void>;
  updateLocationSettings: (settings: Partial<LocationAppSettings>) => Promise<void>;
  refreshStorageInfo: () => Promise<void>;
  clearDownloaded: () => Promise<number>;
  clearAllLocalData: () => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
}

const SETTING_KEY_WATERMARK = "app_watermark_settings";
const SETTING_KEY_LOCATION = "app_location_settings";

/**
 * Hook pusat konfigurasi aplikasi GeoPatriot Web (Phase 13 / PRD #20 & workflow #15).
 * Mengelola preferensi watermark, penyedia lokasi, dan indikator kapasitas penyimpanan perangkat.
 */
export function useAppSettings(): UseAppSettingsReturn {
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkVisualSettings>(() =>
    createDefaultTemplate(),
  );
  const [locationSettings, setLocationSettings] =
    useState<LocationAppSettings>(DEFAULT_LOCATION_SETTINGS);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(INITIAL_STORAGE_INFO);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Mengukur kapasitas dan penggunaan penyimpanan IndexedDB (PRD #13 & workflow #15).
   */
  const refreshStorageInfo = useCallback(async () => {
    try {
      let usageBytes = 0;
      let quotaBytes = 0;
      let isEstimateSupported = false;

      if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        usageBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
        isEstimateSupported = true;
      }

      const db = await getDb();
      const allPhotos = await db.getAll("photos");
      const sessionRes = await listSessions();

      const photoCount = allPhotos.length;
      const downloadedPhotoCount = allPhotos.filter((p) => p.downloaded).length;
      const sessionCount = sessionRes.status === "success" ? sessionRes.data.length : 0;

      const percentUsed =
        quotaBytes > 0 ? Math.min(100, Math.round((usageBytes / quotaBytes) * 100)) : 0;

      setStorageInfo({
        usageBytes,
        quotaBytes,
        percentUsed,
        photoCount,
        sessionCount,
        downloadedPhotoCount,
        isEstimateSupported,
      });
    } catch (err) {
      console.warn("Gagal memperbarui info penyimpanan:", err);
    }
  }, []);

  // Inisialisasi pengaturan tersimpan dari IndexedDB
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const wmRes = await getSetting<WatermarkVisualSettings>(SETTING_KEY_WATERMARK);
        if (isMounted && wmRes.status === "success" && wmRes.data) {
          setWatermarkSettings(wmRes.data);
        }

        const locRes = await getSetting<LocationAppSettings>(SETTING_KEY_LOCATION);
        if (isMounted && locRes.status === "success" && locRes.data) {
          setLocationSettings(locRes.data);
        }

        if (isMounted) {
          await refreshStorageInfo();
        }
      } catch {
        // Fallback ke default
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [refreshStorageInfo]);

  /**
   * Memperbarui pengaturan visual watermark dan menyimpannya ke IndexedDB.
   */
  const updateWatermarkSettings = useCallback(
    async (partial: Partial<WatermarkVisualSettings>) => {
      setWatermarkSettings((prev) => {
        const updated = {
          ...prev,
          ...partial,
          visibleFields: {
            ...prev.visibleFields,
            ...(partial.visibleFields || {}),
          },
        };
        void setSetting(SETTING_KEY_WATERMARK, updated);
        return updated;
      });
    },
    [],
  );

  /**
   * Memperbarui preferensi penyedia lokasi GPS dan menyimpannya ke IndexedDB.
   */
  const updateLocationSettings = useCallback(async (partial: Partial<LocationAppSettings>) => {
    setLocationSettings((prev) => {
      const updated = { ...prev, ...partial };
      void setSetting(SETTING_KEY_LOCATION, updated);
      return updated;
    });
  }, []);

  /**
   * Menghapus seluruh foto yang sudah diunduh untuk menghemat ruang perangkat (PRD #14).
   */
  const clearDownloaded = useCallback(async (): Promise<number> => {
    const res = await deleteDownloadedPhotos();
    const count = res.status === "success" ? res.data : 0;
    await refreshStorageInfo();
    return count;
  }, [refreshStorageInfo]);

  /**
   * Menghapus seluruh data lokal (foto, sesi, pengaturan) dari IndexedDB.
   */
  const clearAllLocalData = useCallback(async (): Promise<boolean> => {
    try {
      await clearAllPhotos();
      await clearAllSessions();
      await clearAllSettings();

      setWatermarkSettings(createDefaultTemplate());
      setLocationSettings(DEFAULT_LOCATION_SETTINGS);

      await refreshStorageInfo();
      return true;
    } catch {
      return false;
    }
  }, [refreshStorageInfo]);

  /**
   * Mengembalikan semua konfigurasi pengaturan ke default awal.
   */
  const resetToDefaults = useCallback(async () => {
    const defaultWm = createDefaultTemplate();
    setWatermarkSettings(defaultWm);
    setLocationSettings(DEFAULT_LOCATION_SETTINGS);

    await setSetting(SETTING_KEY_WATERMARK, defaultWm);
    await setSetting(SETTING_KEY_LOCATION, DEFAULT_LOCATION_SETTINGS);
  }, []);

  return {
    watermarkSettings,
    locationSettings,
    storageInfo,
    isLoading,
    updateWatermarkSettings,
    updateLocationSettings,
    refreshStorageInfo,
    clearDownloaded,
    clearAllLocalData,
    resetToDefaults,
  };
}
