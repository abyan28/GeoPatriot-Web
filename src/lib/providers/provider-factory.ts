import type { GeocodingProvider, MapProvider } from "@/types/provider";
import { LocationIqGeocodingProvider } from "./locationiq-geocoding-provider";
import { LocationIqMapProvider } from "./locationiq-map-provider";

/**
 * Satu-satunya entry point untuk mendapatkan instance provider eksternal.
 * Komponen UI dan lib lain WAJIB mengambil provider lewat file ini,
 * tidak boleh mengimpor implementasi LocationIQ secara langsung (rules #2.5, #12.1-12.2).
 *
 * Mengganti provider di masa depan (mis. ke penyedia lain) cukup mengubah
 * implementasi di sini tanpa menyentuh pemanggilnya.
 */

let geocodingProviderInstance: GeocodingProvider | null = null;
let mapProviderInstance: MapProvider | null = null;

function readApiKey(): string {
  return process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY ?? "";
}

/** Mengambil instance GeocodingProvider aktif (singleton, lazy-initialized). */
export function getGeocodingProvider(): GeocodingProvider {
  if (!geocodingProviderInstance) {
    geocodingProviderInstance = new LocationIqGeocodingProvider(readApiKey());
  }
  return geocodingProviderInstance;
}

/** Mengambil instance MapProvider aktif (singleton, lazy-initialized). */
export function getMapProvider(): MapProvider {
  if (!mapProviderInstance) {
    mapProviderInstance = new LocationIqMapProvider(readApiKey());
  }
  return mapProviderInstance;
}
