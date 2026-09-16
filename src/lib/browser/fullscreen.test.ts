import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isFullscreenSupported,
  getFullscreenElement,
  requestFullscreen,
  exitFullscreen,
} from "./fullscreen";

describe("fullscreen wrapper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isFullscreenSupported membaca fullscreenEnabled standar", () => {
    vi.stubGlobal("document", { fullscreenEnabled: true });
    expect(isFullscreenSupported()).toBe(true);
  });

  it("isFullscreenSupported fallback ke webkitFullscreenEnabled", () => {
    vi.stubGlobal("document", { webkitFullscreenEnabled: true });
    expect(isFullscreenSupported()).toBe(true);
  });

  it("isFullscreenSupported false bila tidak ada dukungan sama sekali", () => {
    vi.stubGlobal("document", {});
    expect(isFullscreenSupported()).toBe(false);
  });

  it("getFullscreenElement membaca fullscreenElement standar", () => {
    const el = {};
    vi.stubGlobal("document", { fullscreenElement: el });
    expect(getFullscreenElement()).toBe(el);
  });

  it("requestFullscreen sukses memanggil element.requestFullscreen()", async () => {
    const requestFn = vi.fn().mockResolvedValue(undefined);
    const el = { requestFullscreen: requestFn } as unknown as Element;
    const result = await requestFullscreen(el);
    expect(result.status).toBe("success");
    expect(requestFn).toHaveBeenCalled();
  });

  it("requestFullscreen fallback ke webkitRequestFullscreen", async () => {
    const requestFn = vi.fn().mockResolvedValue(undefined);
    const el = { webkitRequestFullscreen: requestFn } as unknown as Element;
    const result = await requestFullscreen(el);
    expect(result.status).toBe("success");
    expect(requestFn).toHaveBeenCalled();
  });

  it("requestFullscreen mengembalikan error (bukan throw) saat API tidak ada", async () => {
    const el = {} as unknown as Element;
    const result = await requestFullscreen(el);
    expect(result.status).toBe("error");
  });

  it("requestFullscreen mengembalikan error (bukan throw) saat browser reject", async () => {
    const el = {
      requestFullscreen: vi.fn().mockRejectedValue(new Error("Permission denied")),
    } as unknown as Element;
    const result = await requestFullscreen(el);
    expect(result.status).toBe("error");
  });

  it("exitFullscreen sukses memanggil document.exitFullscreen()", async () => {
    const exitFn = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("document", { exitFullscreen: exitFn });
    const result = await exitFullscreen();
    expect(result.status).toBe("success");
    expect(exitFn).toHaveBeenCalled();
  });

  it("exitFullscreen mengembalikan error (bukan throw) saat API tidak ada", async () => {
    vi.stubGlobal("document", {});
    const result = await exitFullscreen();
    expect(result.status).toBe("error");
  });
});
