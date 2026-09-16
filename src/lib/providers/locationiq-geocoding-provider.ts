import type {
  GeocodingProvider,
  ProviderResult,
  ReverseGeocodeResult,
} from "@/types/provider";

/**
 * Implementasi GeocodingProvider menggunakan LocationIQ Reverse Geocoding.
 * Lihat agents/prd-geopatriot-web.md #16 dan docs.locationiq.com/docs/reverse-geocoding.
 *
 * PENTING: kegagalan provider ini tidak boleh menggagalkan capture foto
 * (rules #6.7, #11.5) — kegagalan dikembalikan sebagai ProviderResult, bukan throw.
 */

const LOCATIONIQ_REVERSE_ENDPOINT = "https://us1.locationiq.com/v1/reverse";

export class LocationIqGeocodingProvider implements GeocodingProvider {
  constructor(private readonly apiKey: string) {}

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ProviderResult<ReverseGeocodeResult>> {
    if (!this.apiKey) {
      return { status: "failure", reason: "not-configured" };
    }

    const url = new URL(LOCATIONIQ_REVERSE_ENDPOINT);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch {
      return { status: "failure", reason: "network-error" };
    }

    if (response.status === 429) {
      return { status: "failure", reason: "rate-limited" };
    }
    if (!response.ok) {
      return { status: "failure", reason: "invalid-response" };
    }

    try {
      const body = (await response.json()) as { display_name?: string };
      if (!body.display_name) {
        return { status: "failure", reason: "invalid-response" };
      }
      return {
        status: "success",
        data: {
          locationName: body.display_name.split(",")[0]?.trim() ?? body.display_name,
          address: body.display_name,
        },
      };
    } catch {
      return { status: "failure", reason: "invalid-response" };
    }
  }
}
