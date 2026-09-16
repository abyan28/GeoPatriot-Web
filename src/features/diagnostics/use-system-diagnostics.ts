"use client";

import { useMemo } from "react";
import type { CameraStatus, ZoomCapabilities } from "@/lib/browser/camera";
import type { GeolocationStatus } from "@/lib/browser/geolocation";
import type { GeoCoordinate } from "@/types/location";
import type { StorageInfo } from "@/features/settings";
import type {
  CameraExplicitState,
  CameraZoomExplicitState,
  GpsExplicitState,
  GeocodingExplicitState,
  MapExplicitState,
  StorageExplicitState,
  SystemHealthDiagnostics,
} from "@/types/diagnostics";

export interface UseSystemDiagnosticsParams {
  cameraStatus: CameraStatus;
  zoomCapabilities: ZoomCapabilities | null;
  geoStatus: GeolocationStatus;
  geoCoordinate: GeoCoordinate | null;
  isResolvingAddress: boolean;
  hasResolvedAddress: boolean;
  storageInfo: StorageInfo;
  isOnline?: boolean;
}

/**
 * Fungsi murni penentu diagnostik dan pemetaan state eksplisit sistem (Phase 14 / workflow #16).
 * Independen dari lifecycle React untuk kehandalan pengujian unit.
 */
export function evaluateSystemDiagnostics({
  cameraStatus,
  zoomCapabilities,
  geoStatus,
  geoCoordinate,
  isResolvingAddress,
  hasResolvedAddress,
  storageInfo,
  isOnline = true,
}: UseSystemDiagnosticsParams): SystemHealthDiagnostics {
  // 1. Pemetaan State Kamera
  let camera: CameraExplicitState = "camera_idle";
  if (cameraStatus === "requesting") camera = "camera_requesting";
  else if (cameraStatus === "ready") camera = "camera_ready";
  else if (cameraStatus === "denied") camera = "camera_denied";
  else if (cameraStatus === "error" || cameraStatus === "unsupported") camera = "camera_error";

  // 2. Pemetaan State Zoom Kamera
  const cameraZoom: CameraZoomExplicitState = zoomCapabilities
    ? "camera_zoom_supported"
    : "camera_zoom_unsupported";

  // 3. Pemetaan State GPS
  let gps: GpsExplicitState = "gps_idle";
  if (geoStatus === "searching") gps = "gps_searching";
  else if (geoStatus === "ready") gps = "gps_ready";
  else if (geoStatus === "denied") gps = "gps_denied";
  else if (geoStatus === "error" || geoStatus === "unsupported") gps = "gps_error";

  // 4. Pemetaan State Geocoding
  let geocoding: GeocodingExplicitState = "geocoding_loading";
  if (isResolvingAddress) {
    geocoding = "geocoding_loading";
  } else if (hasResolvedAddress) {
    geocoding = "geocoding_success";
  } else if (geoStatus === "ready" && !hasResolvedAddress) {
    geocoding = "geocoding_error";
  } else {
    geocoding = "geocoding_loading";
  }

  // 5. Pemetaan State Peta Thumbnail
  const map: MapExplicitState = isOnline ? "map_success" : "map_error";

  // 6. Pemetaan State Penyimpanan IndexedDB
  let storage: StorageExplicitState = "storage_ok";
  if (storageInfo.percentUsed >= 95) {
    storage = "storage_full";
  } else if (storageInfo.percentUsed >= 80) {
    storage = "storage_warning";
  }

  // Evaluasi Warning & Error
  const isPoorGps = gps === "gps_ready" && (geoCoordinate?.accuracy ?? 0) > 50;
  const hasWarnings =
    storage === "storage_warning" ||
    cameraZoom === "camera_zoom_unsupported" ||
    isPoorGps ||
    geocoding === "geocoding_error" ||
    !isOnline;

  const hasErrors =
    camera === "camera_denied" ||
    camera === "camera_error" ||
    gps === "gps_denied" ||
    storage === "storage_full";

  // Rekomendasi aksi bagi pengguna lapangan
  let recommendedAction: string | undefined;
  if (storage === "storage_full") {
    recommendedAction = "Memori perangkat hampir habis. Segera unduh berkas ZIP dan bersihkan foto.";
  } else if (camera === "camera_denied") {
    recommendedAction = "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser Anda.";
  } else if (gps === "gps_denied") {
    recommendedAction = "Izin GPS ditolak. Gunakan Mode Lokasi Manual untuk tetap mengambil foto.";
  } else if (isPoorGps) {
    recommendedAction = "Sinyal GPS kurang akurat (>50m). Berpindahlah ke area terbuka bila memungkinkan.";
  } else if (!isOnline) {
    recommendedAction = "Perangkat berada di mode offline. Alamat akan menggunakan format koordinat mandiri.";
  }

  return {
    camera,
    cameraZoom,
    gps,
    geocoding,
    map,
    storage,
    storagePercentUsed: storageInfo.percentUsed,
    storageUsageBytes: storageInfo.usageBytes,
    storageQuotaBytes: storageInfo.quotaBytes,
    gpsAccuracy: geoCoordinate?.accuracy,
    hasWarnings,
    hasErrors,
    recommendedAction,
  };
}

/**
 * Hook evaluator diagnostik dan pemetaan state eksplisit sistem (Phase 14 / workflow #16).
 * Memantau kondisi seluruh subsistem dan menghasilkan ringkasan kesehatan aplikasi.
 */
export function useSystemDiagnostics({
  cameraStatus,
  zoomCapabilities,
  geoStatus,
  geoCoordinate,
  isResolvingAddress,
  hasResolvedAddress,
  storageInfo,
  isOnline = true,
}: UseSystemDiagnosticsParams): SystemHealthDiagnostics {
  return useMemo(
    () =>
      evaluateSystemDiagnostics({
        cameraStatus,
        zoomCapabilities,
        geoStatus,
        geoCoordinate,
        isResolvingAddress,
        hasResolvedAddress,
        storageInfo,
        isOnline,
      }),
    [
      cameraStatus,
      zoomCapabilities,
      geoStatus,
      geoCoordinate,
      isResolvingAddress,
      hasResolvedAddress,
      storageInfo,
      isOnline,
    ],
  );
}


