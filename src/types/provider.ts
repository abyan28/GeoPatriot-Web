/**
 * Kontrak abstraksi provider eksternal (geocoding & map).
 * Lihat agents/prd-geopatriot-web.md #17 dan agents/rules-geopatriot-web.md #12.
 *
 * Komponen UI dan lib lain tidak boleh mengenal provider konkret (mis. LocationIQ)
 * secara langsung — semua akses harus lewat interface di file ini.
 */

/**
 * Hasil operasi provider dalam 3 keadaan eksplisit (rules #18: loading/success/failure).
 * "loading" tidak dimodelkan di sini karena itu urusan state di sisi pemanggil (UI);
 * fungsi provider sendiri hanya pernah resolve ke "success" atau "failure", tidak pernah throw.
 */
export type ProviderResult<T> =
  | { status: "success"; data: T }
  | { status: "failure"; reason: ProviderFailureReason };

/** Alasan kegagalan provider, dipakai untuk menentukan fallback yang tepat (rules #6.6-6.7). */
export type ProviderFailureReason =
  | "network-error"
  | "rate-limited"
  | "invalid-response"
  | "not-configured";

/** Hasil reverse geocoding: nama lokasi dan alamat dari koordinat. */
export interface ReverseGeocodeResult {
  locationName: string;
  address: string;
}

/** Opsi untuk pembuatan static map thumbnail. */
export interface StaticMapOptions {
  widthPx: number;
  heightPx: number;
  zoom: number;
}

/** Provider reverse geocoding (PRD #17: GeocodingProvider). */
export interface GeocodingProvider {
  reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ProviderResult<ReverseGeocodeResult>>;
}

/** Provider static map thumbnail (PRD #17: MapProvider). */
export interface MapProvider {
  /** Mengembalikan URL gambar map thumbnail (mis. data URL atau object URL). */
  getStaticMap(
    latitude: number,
    longitude: number,
    options: StaticMapOptions,
  ): Promise<ProviderResult<string>>;
}
