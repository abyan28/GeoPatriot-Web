import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MetadataSnapshot } from "@/types/metadata";
import { createDefaultTemplate } from "./templates";
import { processUploadedPhoto, type DecodedImage } from "./upload-watermark";

const renderWatermarkMock = vi.fn();
vi.mock("./watermark-engine", () => ({
  renderWatermark: (...args: unknown[]) => renderWatermarkMock(...args),
}));

const snapshot: MetadataSnapshot = {
  coordinate: { latitude: -9.62, longitude: 124.88 },
  capturedAt: "2024-05-17T07:03:00.000Z",
  timezone: "Asia/Jakarta",
  metadataSource: { location: "manual", time: "manual" },
};

function fakeDecoded(width: number, height: number) {
  const release = vi.fn();
  const decoded: DecodedImage = { source: {}, width, height, release };
  return { decoded, release };
}

describe("processUploadedPhoto", () => {
  beforeEach(() => {
    renderWatermarkMock.mockReset();
  });

  it("memakai ukuran hasil decode (sudah terotasi) sebagai dimensi sumber watermark", async () => {
    const { decoded, release } = fakeDecoded(3000, 4000); // portrait setelah rotasi EXIF
    renderWatermarkMock.mockResolvedValue({ status: "success", blob: new Blob(["wm"]) });
    // thumbnail memakai document.createElement; di test node tidak ada, sehingga fallback ke blob watermark
    const file = new Blob(["orig"], { type: "image/jpeg" });

    const result = await processUploadedPhoto({
      file,
      snapshot,
      settings: createDefaultTemplate(),
      decode: async () => decoded,
    });

    expect(result.status).toBe("success");
    expect(result.originalBlob).toBe(file);
    expect(result.processedBlob).toBeInstanceOf(Blob);
    expect(result.width).toBe(3000);
    expect(result.height).toBe(4000);
    expect(renderWatermarkMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourceWidth: 3000, sourceHeight: 4000 }),
    );
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan error yang jelas bila gambar tidak bisa di-decode", async () => {
    const result = await processUploadedPhoto({
      file: new Blob(["bukan gambar"]),
      snapshot,
      settings: createDefaultTemplate(),
      decode: async () => {
        throw new Error("decode gagal");
      },
    });
    expect(result.status).toBe("error");
    expect(result.errorMessage).toMatch(/tidak bisa dibaca/i);
    expect(renderWatermarkMock).not.toHaveBeenCalled();
  });

  it("melepas resource decode walau render watermark gagal", async () => {
    const { decoded, release } = fakeDecoded(100, 100);
    renderWatermarkMock.mockResolvedValue({ status: "error", message: "canvas gagal" });
    const result = await processUploadedPhoto({
      file: new Blob(["x"]),
      snapshot,
      settings: createDefaultTemplate(),
      decode: async () => decoded,
    });
    expect(result).toMatchObject({ status: "error", errorMessage: "canvas gagal" });
    expect(release).toHaveBeenCalledTimes(1);
  });
});
