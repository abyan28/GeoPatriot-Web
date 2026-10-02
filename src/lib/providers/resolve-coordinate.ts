import { getGeocodingProvider, getMapProvider } from "./provider-factory";
import { loadImageFromUrl } from "@/lib/browser/load-image";

export interface ResolvedCoordinateDetails {
  locationName?: string;
  address?: string;
  /** Object URL map thumbnail; pemanggil wajib memanggil URL.revokeObjectURL setelah dipakai. */
  mapThumbnailUrl?: string;
  mapThumbnailImage?: HTMLImageElement;
}

const MAP_THUMBNAIL_SIZE = { widthPx: 240, heightPx: 240 };

/**
 * Reverse geocoding + static map untuk satu koordinat secara imperatif (tanpa state hook),
 * dipakai pemrosesan batch foto unggahan. Kegagalan salah satu provider (mis. offline)
 * tidak pernah fatal: field terkait dikosongkan dan watermark tetap dirender (rules #6.6).
 */
export async function resolveCoordinateDetails(
  latitude: number,
  longitude: number,
  options: { mapZoom: number; includeMap: boolean },
): Promise<ResolvedCoordinateDetails> {
  const details: ResolvedCoordinateDetails = {};

  const [geocode, map] = await Promise.all([
    getGeocodingProvider()
      .reverseGeocode(latitude, longitude)
      .catch(() => null),
    options.includeMap
      ? getMapProvider()
          .getStaticMap(latitude, longitude, { ...MAP_THUMBNAIL_SIZE, zoom: options.mapZoom })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  if (geocode?.status === "success") {
    details.locationName = geocode.data.locationName;
    details.address = geocode.data.address;
  }

  if (map?.status === "success") {
    try {
      details.mapThumbnailImage = await loadImageFromUrl(map.data);
      details.mapThumbnailUrl = map.data;
    } catch {
      URL.revokeObjectURL(map.data);
    }
  }

  return details;
}
