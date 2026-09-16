import type { GeoCoordinate, GpsQuality } from "@/types/location";

/**
 * Wrapper tipis di atas Geolocation API browser.
 * Lihat agents/rules-geopatriot-web.md #4 dan agents/workflow-geopatriot-web.md #5.
 *
 * Aturan penting: kegagalan/akurasi buruk TIDAK pernah memblokir shutter (rules #4.4).
 * Fungsi ini hanya melaporkan status, keputusan tetap izinkan capture ada di UI/domain layer.
 */

/** Status eksplisit pencarian GPS (workflow #16). */
export type GeolocationStatus = "idle" | "searching" | "ready" | "denied" | "unsupported" | "error";

/** Hasil satu kali pembacaan GPS. */
export interface GeolocationReadResult {
  status: GeolocationStatus;
  coordinate?: GeoCoordinate;
  quality?: GpsQuality;
  errorMessage?: string;
}

/** Mengecek apakah browser saat ini mendukung Geolocation API. */
export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined";
}

/**
 * Menghitung kategori kualitas GPS dari nilai accuracy (meter), sesuai PRD #9.
 * Satu-satunya tempat business rule ini diimplementasikan (rules #20.8).
 */
export function classifyGpsQuality(accuracyMeters: number): GpsQuality {
  if (accuracyMeters < 5) return "excellent";
  if (accuracyMeters < 15) return "good";
  if (accuracyMeters < 50) return "fair";
  return "poor";
}

const DEFAULT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

/**
 * Membaca posisi GPS saat ini sekali, dibungkus Promise agar mudah dipakai
 * dengan async/await. Tidak pernah melempar exception — kegagalan
 * dikembalikan sebagai status eksplisit.
 */
export function getCurrentPosition(
  options: PositionOptions = DEFAULT_POSITION_OPTIONS,
): Promise<GeolocationReadResult> {
  if (!isGeolocationSupported()) {
    return Promise.resolve({
      status: "unsupported",
      errorMessage: "Browser tidak mendukung Geolocation API.",
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinate: GeoCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
        };
        resolve({
          status: "ready",
          coordinate,
          quality: classifyGpsQuality(position.coords.accuracy),
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ status: "denied", errorMessage: "Izin lokasi ditolak oleh pengguna." });
          return;
        }
        resolve({
          status: "error",
          errorMessage: error.message || "Gagal membaca lokasi GPS.",
        });
      },
      options,
    );
  });
}
