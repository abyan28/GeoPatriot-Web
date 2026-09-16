import { describe, expect, it, vi, beforeEach } from "vitest";
import { LocationIqGeocodingProvider } from "./locationiq-geocoding-provider";

describe("LocationIqGeocodingProvider", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("mengembalikan not-configured bila API key kosong", async () => {
    const provider = new LocationIqGeocodingProvider("");
    const result = await provider.reverseGeocode(-6.2, 106.8);
    expect(result.status).toBe("failure");
    expect(result.status === "failure" && result.reason).toBe("not-configured");
  });

  it("mengembalikan success dengan locationName & address saat fetch berhasil", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ display_name: "Monas, Jakarta Pusat, DKI Jakarta" }),
      }),
    );

    const provider = new LocationIqGeocodingProvider("dummy-key");
    const result = await provider.reverseGeocode(-6.2, 106.8);

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data.locationName).toBe("Monas");
      expect(result.data.address).toBe("Monas, Jakarta Pusat, DKI Jakarta");
    }
  });

  it("mengembalikan network-error bila fetch gagal total", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const provider = new LocationIqGeocodingProvider("dummy-key");
    const result = await provider.reverseGeocode(-6.2, 106.8);
    expect(result.status).toBe("failure");
    expect(result.status === "failure" && result.reason).toBe("network-error");
  });

  it("mengembalikan rate-limited saat response 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }),
    );
    const provider = new LocationIqGeocodingProvider("dummy-key");
    const result = await provider.reverseGeocode(-6.2, 106.8);
    expect(result.status === "failure" && result.reason).toBe("rate-limited");
  });
});
