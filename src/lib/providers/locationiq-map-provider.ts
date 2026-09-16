import type { MapProvider, ProviderResult, StaticMapOptions } from "@/types/provider";

/**
 * Implementasi MapProvider menggunakan LocationIQ Static Maps.
 * Lihat agents/prd-geopatriot-web.md #16 dan docs.locationiq.com/docs/static-maps.
 *
 * Kegagalan map thumbnail bersifat non-fatal (rules #6.6): capture tetap sukses
 * tanpa map bila provider gagal.
 */

const LOCATIONIQ_STATIC_MAP_ENDPOINT = "https://maps.locationiq.com/v3/staticmap";

export class LocationIqMapProvider implements MapProvider {
  constructor(private readonly apiKey: string) {}

  async getStaticMap(
    latitude: number,
    longitude: number,
    options: StaticMapOptions,
  ): Promise<ProviderResult<string>> {
    if (!this.apiKey) {
      return { status: "failure", reason: "not-configured" };
    }

    const url = new URL(LOCATIONIQ_STATIC_MAP_ENDPOINT);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("center", `${latitude},${longitude}`);
    url.searchParams.set("zoom", String(options.zoom));
    url.searchParams.set("size", `${options.widthPx}x${options.heightPx}`);
    url.searchParams.set("markers", `icon:large-red-cutout|${latitude},${longitude}`);
    url.searchParams.set("format", "png");

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
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      return { status: "success", data: objectUrl };
    } catch {
      return { status: "failure", reason: "invalid-response" };
    }
  }
}
