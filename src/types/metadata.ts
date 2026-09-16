import type { GeoCoordinate, GpsQuality, LocationSource } from "./location";

/**
 * Tipe data metadata waktu/lokasi yang dibekukan (snapshot) per foto.
 * Lihat agents/rules-geopatriot-web.md #5: metadata harus dibekukan per capture,
 * watermark memakai snapshot yang sama dengan foto tersebut.
 */

/** Mode penentuan waktu capture. */
export type TimeMode = "auto" | "manual";

/** Asal metadata yang benar-benar dipakai pada satu snapshot. */
export interface MetadataSource {
  location: LocationSource;
  time: TimeMode;
}

/**
 * Snapshot metadata yang dibekukan pada saat shutter ditekan (workflow #7).
 * Objek ini bersifat immutable secara konvensi: sekali dibuat, tidak boleh
 * diubah lagi walau pengaturan UI berubah setelahnya (rules #5.3).
 */
export interface MetadataSnapshot {
  coordinate: GeoCoordinate;
  gpsQuality?: GpsQuality;
  locationName?: string;
  address?: string;
  /** Waktu capture dalam format ISO 8601 (mengandung offset timezone). */
  capturedAt: string;
  /** Nama timezone IANA yang dipakai saat capture, mis. "Asia/Jakarta". */
  timezone: string;
  metadataSource: MetadataSource;
  customText?: string;
}
