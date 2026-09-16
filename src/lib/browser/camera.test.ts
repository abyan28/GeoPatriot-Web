import { describe, expect, it, vi } from "vitest";
import {
  isCameraSupported,
  startCamera,
  stopCamera,
  getCameraZoomCapabilities,
  getCameraCurrentZoom,
  applyCameraZoom,
  calculateZoomPresets,
} from "./camera";

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
    const fakeStream = {
      getTracks: () => [{ stop: stopFn }, { stop: stopFn }],
    } as unknown as MediaStream;
    stopCamera(fakeStream);
    expect(stopFn).toHaveBeenCalledTimes(2);
  });
});

describe("Camera Zoom Utilities", () => {
  it("getCameraZoomCapabilities mengembalikan null jika stream null atau track tidak mendukung zoom", () => {
    expect(getCameraZoomCapabilities(null)).toBeNull();

    const fakeStreamWithoutZoom = {
      getVideoTracks: () => [
        {
          getCapabilities: () => ({}),
        },
      ],
    } as unknown as MediaStream;
    expect(getCameraZoomCapabilities(fakeStreamWithoutZoom)).toBeNull();
  });

  it("getCameraZoomCapabilities mengembalikan min, max, step jika didukung", () => {
    const fakeStreamWithZoom = {
      getVideoTracks: () => [
        {
          getCapabilities: () => ({
            zoom: { min: 1, max: 5, step: 0.5 },
          }),
        },
      ],
    } as unknown as MediaStream;

    const caps = getCameraZoomCapabilities(fakeStreamWithZoom);
    expect(caps).toEqual({ min: 1, max: 5, step: 0.5 });
  });

  it("getCameraCurrentZoom membaca nilai zoom aktif atau fallback ke 1", () => {
    expect(getCameraCurrentZoom(null)).toBe(1);

    const fakeStream = {
      getVideoTracks: () => [
        {
          getSettings: () => ({ zoom: 2.5 }),
        },
      ],
    } as unknown as MediaStream;
    expect(getCameraCurrentZoom(fakeStream)).toBe(2.5);
  });

  it("applyCameraZoom memanggil applyConstraints dengan format advanced zoom", async () => {
    const applyConstraintsMock = vi.fn().mockResolvedValue(undefined);
    const fakeStream = {
      getVideoTracks: () => [
        {
          applyConstraints: applyConstraintsMock,
        },
      ],
    } as unknown as MediaStream;

    const ok = await applyCameraZoom(fakeStream, 2);
    expect(ok).toBe(true);
    expect(applyConstraintsMock).toHaveBeenCalledWith({
      advanced: [{ zoom: 2 }],
    });
  });

  it("calculateZoomPresets menghasilkan preset adaptif sesuai kapabilitas", () => {
    expect(calculateZoomPresets(null)).toEqual([]);
    expect(calculateZoomPresets({ min: 1, max: 1, step: 0.1 })).toEqual([]);

    // Perangkat dengan rentang hingga 3x
    const presets3x = calculateZoomPresets({ min: 1, max: 3, step: 0.1 });
    expect(presets3x).toEqual([1, 2, 3]);

    // Perangkat dengan rentang hingga 5x
    const presets5x = calculateZoomPresets({ min: 1, max: 5, step: 0.1 });
    expect(presets5x).toEqual([1, 2, 3, 5]);

    // Perangkat dengan rentang terbatas (misal 1x - 1.8x)
    const presetsLimited = calculateZoomPresets({ min: 1, max: 1.8, step: 0.1 });
    expect(presetsLimited).toEqual([1, 1.8]);
  });
});

