/**
 * Tipe dan kontrak status eksplisit sistem GeoPatriot Web (Phase 14).
 * Sesuai agents/workflow-geopatriot-web.md #16 dan agents/prd-geopatriot-web.md #22.
 */

/**
 * State eksplisit subsistem kamera.
 */
export type CameraExplicitState =
  | "camera_idle"
  | "camera_requesting"
  | "camera_ready"
  | "camera_denied"
  | "camera_error";

/**
 * State eksplisit kapabilitas zoom kamera.
 */
export type CameraZoomExplicitState =
  | "camera_zoom_supported"
  | "camera_zoom_unsupported"
  | "camera_zoom_error";

/**
 * State eksplisit penerimaan sinyal GPS perangkat.
 */
export type GpsExplicitState =
  | "gps_idle"
  | "gps_searching"
  | "gps_ready"
  | "gps_denied"
  | "gps_error";

/**
 * State eksplisit layanan reverse geocoding (LocationIQ / Fallback).
 */
export type GeocodingExplicitState =
  | "geocoding_loading"
  | "geocoding_success"
  | "geocoding_error";

/**
 * State eksplisit ketersediaan peta thumbnail.
 */
export type MapExplicitState =
  | "map_loading"
  | "map_success"
  | "map_error";

/**
 * State eksplisit kapasitas penyimpanan lokal browser (IndexedDB).
 */
export type StorageExplicitState =
  | "storage_ok"
  | "storage_warning"
  | "storage_full";

/**
 * Ringkasan menyeluruh kesehatan dan diagnosa seluruh subsistem aplikasi.
 */
export interface SystemHealthDiagnostics {
  camera: CameraExplicitState;
  cameraZoom: CameraZoomExplicitState;
  gps: GpsExplicitState;
  geocoding: GeocodingExplicitState;
  map: MapExplicitState;
  storage: StorageExplicitState;
  storagePercentUsed: number;
  storageUsageBytes: number;
  storageQuotaBytes: number;
  gpsAccuracy?: number;
  hasWarnings: boolean;
  hasErrors: boolean;
  recommendedAction?: string;
}
