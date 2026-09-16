import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { loadImageFromUrl } from "./load-image";

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = "";

  set src(value: string) {
    this._src = value;
    if (value.includes("fail")) {
      queueMicrotask(() => this.onerror?.());
    } else {
      queueMicrotask(() => this.onload?.());
    }
  }

  get src() {
    return this._src;
  }
}

describe("loadImageFromUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolve dengan image element saat berhasil dimuat", async () => {
    const img = await loadImageFromUrl("blob:mock-success");
    expect(img).toBeInstanceOf(FakeImage);
  });

  it("reject saat gambar gagal dimuat (bukan hang tanpa batas)", async () => {
    await expect(loadImageFromUrl("blob:mock-fail")).rejects.toThrow();
  });
});
