/**
 * Tipe data terkait lokasi/koordinat GPS dan lokasi manual.
 * Lihat agents/prd-geopatriot-web.md #8.1 dan #9 untuk aturan produk.
 */

/** Sumber lokasi yang dipakai pada satu sesi/capture. */
export type LocationSource = "gps" | "manual";

/** Koordinat mentah yang didapat dari Geolocation API atau input manual. */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  /** Akurasi dalam meter, hanya tersedia untuk hasil GPS. */
  accuracy?: number;
  /** Altitude dalam meter bila tersedia dari perangkat. */
  altitude?: number;
}

/**
 * Kategori kualitas GPS berdasarkan accuracy (meter), sesuai PRD #9.
 * Status ini bersifat informatif dan tidak boleh memblokir shutter (rules #4.4).
 * Fungsi klasifikasi ada di lib/browser/geolocation.ts (classifyGpsQuality)
 * agar business rule ini tidak terduplikasi (rules #20.8).
 */
export type GpsQuality = "excellent" | "good" | "fair" | "poor";

/** Input lokasi yang diisi pengguna secara manual (PRD #8.1). */
export interface ManualLocationInput {
  latitude: number;
  longitude: number;
  locationName: string;
  address?: string;
}
