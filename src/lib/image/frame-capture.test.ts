import { describe, expect, it, vi } from "vitest";
import { captureVideoFrame } from "./frame-capture";

describe("captureVideoFrame", () => {
  it("mengembalikan status error jika videoWidth atau videoHeight 0", async () => {
    const fakeVideo = {
      videoWidth: 0,
      videoHeight: 0,
    } as unknown as HTMLVideoElement;

    const result = await captureVideoFrame(fakeVideo);
    expect(result.status).toBe("error");
    expect(result.errorMessage).toContain("belum tersedia");
  });

  it("menangkap frame video dan mengekspor originalBlob dan thumbnailBlob saat canvas siap", async () => {
    const fakeCtx = {
      drawImage: vi.fn(),
    };

    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => fakeCtx),
      toBlob: vi.fn((callback: (b: Blob | null) => void) => {
        callback(new Blob(["mock-jpeg-data"], { type: "image/jpeg" }));
      }),
    };

    const fakeVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      readyState: 4, // HAVE_ENOUGH_DATA
    } as unknown as HTMLVideoElement;

    const result = await captureVideoFrame(fakeVideo, {
      canvasCreator: () => fakeCanvas,
    });

    expect(result.status).toBe("success");
    expect(result.originalBlob).toBeInstanceOf(Blob);
    expect(result.thumbnailBlob).toBeInstanceOf(Blob);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(fakeCtx.drawImage).toHaveBeenCalled();
  });

  it("mengembalikan status error bila video belum benar-benar siap (readyState < HAVE_CURRENT_DATA), bukan drawImage frame hitam", async () => {
    const fakeCtx = { drawImage: vi.fn() };
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => fakeCtx),
      toBlob: vi.fn(),
    };

    // videoWidth/videoHeight sudah terisi (dari loadedmetadata) TAPI frame
    // pertama belum ter-decode (readyState 1 = HAVE_METADATA) — skenario
    // race yang menghasilkan foto hitam bila tidak dicegah (audit finding).
    const fakeVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      readyState: 1,
    } as unknown as HTMLVideoElement;

    const result = await captureVideoFrame(fakeVideo, {
      canvasCreator: () => fakeCanvas,
    });

    expect(result.status).toBe("error");
    expect(result.errorMessage).toContain("belum benar-benar siap");
    // drawImage TIDAK BOLEH terpanggil sama sekali — mencegah frame hitam, bukan menggambarnya lalu dibuang.
    expect(fakeCtx.drawImage).not.toHaveBeenCalled();
  });
});
