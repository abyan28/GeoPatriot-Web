import { describe, expect, it, vi } from "vitest";
import { isCameraSupported, startCamera, stopCamera } from "./camera";

describe("isCameraSupported", () => {
  it("false bila navigator.mediaDevices tidak ada", () => {
    vi.stubGlobal("navigator", {});
    expect(isCameraSupported()).toBe(false);
  });

  it("true bila getUserMedia tersedia", () => {
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } });
    expect(isCameraSupported()).toBe(true);
  });
});

describe("startCamera", () => {
  it("mengembalikan status unsupported bila browser tidak mendukung", async () => {
    vi.stubGlobal("navigator", {});
    const result = await startCamera();
    expect(result.status).toBe("unsupported");
  });

  it("mengembalikan status ready dan stream saat berhasil", async () => {
    const fakeStream = { getTracks: () => [] } as unknown as MediaStream;
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
    });
    const result = await startCamera("environment");
    expect(result.status).toBe("ready");
    expect(result.stream).toBe(fakeStream);
  });

  it("mengembalikan status denied saat NotAllowedError", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")),
      },
    });
    const result = await startCamera();
    expect(result.status).toBe("denied");
  });
});

describe("stopCamera", () => {
  it("menghentikan semua track pada stream", () => {
    const stopFn = vi.fn();
    const fakeStream = { getTracks: () => [{ stop: stopFn }, { stop: stopFn }] } as unknown as MediaStream;
    stopCamera(fakeStream);
    expect(stopFn).toHaveBeenCalledTimes(2);
  });
});
