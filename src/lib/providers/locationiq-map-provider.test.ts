import { describe, expect, it, vi, beforeEach } from "vitest";
import { LocationIqMapProvider } from "./locationiq-map-provider";

const OPTIONS = { widthPx: 300, heightPx: 200, zoom: 15 };

describe("LocationIqMapProvider", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
  });

  it("mengembalikan not-configured bila API key kosong", async () => {
    const provider = new LocationIqMapProvider("");
    const result = await provider.getStaticMap(-6.2, 106.8, OPTIONS);
    expect(result.status === "failure" && result.reason).toBe("not-configured");
  });

  it("mengembalikan object URL saat fetch berhasil", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => new Blob(["fake-image"], { type: "image/png" }),
      }),
    );
    const provider = new LocationIqMapProvider("dummy-key");
    const result = await provider.getStaticMap(-6.2, 106.8, OPTIONS);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data).toBe("blob:mock-url");
    }
  });

  it("mengembalikan network-error bila fetch gagal total (map non-fatal)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const provider = new LocationIqMapProvider("dummy-key");
    const result = await provider.getStaticMap(-6.2, 106.8, OPTIONS);
    expect(result.status === "failure" && result.reason).toBe("network-error");
  });
});
