// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFullscreen } from "./use-fullscreen";

/**
 * Menguji sinkronisasi state fullscreen dengan browser sungguhan (bukan hanya
 * hasil request/exit), termasuk skenario keluar fullscreen lewat mekanisme
 * eksternal (tombol browser/Escape/gesture platform) yang tidak lewat toggleFullscreen().
 */

describe("useFullscreen", () => {
  it("toggleFullscreen sukses masuk fullscreen lalu keluar", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    let currentFullscreenEl: Element | null = null;
    el.requestFullscreen = vi.fn().mockImplementation(async () => {
      currentFullscreenEl = el;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => currentFullscreenEl,
    });
    document.exitFullscreen = vi.fn().mockImplementation(async () => {
      currentFullscreenEl = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    const targetRef = { current: el };
    const { result } = renderHook(() => useFullscreen(targetRef));

    expect(result.current.isFullscreen).toBe(false);

    await act(async () => {
      await result.current.toggleFullscreen();
    });
    expect(result.current.isFullscreen).toBe(true);

    await act(async () => {
      await result.current.toggleFullscreen();
    });
    expect(result.current.isFullscreen).toBe(false);
  });

  it("mendeteksi keluar fullscreen lewat event eksternal (bukan toggleFullscreen)", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    let currentFullscreenEl: Element | null = el;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => currentFullscreenEl,
    });

    const targetRef = { current: el };
    const { result } = renderHook(() => useFullscreen(targetRef));

    // Simulasikan browser sudah dalam keadaan fullscreen sebelum listener sadar,
    // lalu keluar lewat mekanisme eksternal (Escape/tombol browser).
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(true);

    act(() => {
      currentFullscreenEl = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(false);
  });

  it("toggleFullscreen tidak throw saat request ditolak browser", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    el.requestFullscreen = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => null,
    });

    const targetRef = { current: el };
    const { result } = renderHook(() => useFullscreen(targetRef));

    let toggleResult;
    await act(async () => {
      toggleResult = await result.current.toggleFullscreen();
    });

    expect(toggleResult).toEqual({ status: "error", message: "Permission denied" });
    expect(result.current.isFullscreen).toBe(false);
  });
});
