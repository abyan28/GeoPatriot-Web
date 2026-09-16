import { describe, expect, it, vi } from "vitest";
import type { WatermarkData } from "@/types/watermark";
import { createDefaultTemplate } from "./templates";
import { renderWatermark, type Canvas2DLike, type CanvasLike } from "./watermark-engine";

const SAMPLE_DATA: WatermarkData = {
  snapshot: {
    coordinate: { latitude: -6.2, longitude: 106.8, accuracy: 5 },
    locationName: "Monas",
    capturedAt: "2026-09-16T01:31:12.000Z",
    timezone: "Asia/Jakarta",
    metadataSource: { location: "gps", time: "auto" },
  },
};

function createFakeContext(): Canvas2DLike {
  return {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: "",
    font: "",
    globalAlpha: 1,
    textBaseline: "top",
  };
}

function createFakeCanvas(shouldFailEncode = false): { canvas: CanvasLike; ctx: Canvas2DLike } {
  const ctx = createFakeContext();
  const canvas: CanvasLike = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: (callback) => {
      if (shouldFailEncode) {
        callback(null);
        return;
      }
      callback(new Blob(["fake-jpeg"], { type: "image/jpeg" }));
    },
  };
  return { canvas, ctx };
}

describe("renderWatermark", () => {
  it("menghasilkan Blob baru saat encoding berhasil", async () => {
    const { canvas, ctx } = createFakeCanvas();
    const result = await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: SAMPLE_DATA,
      settings: createDefaultTemplate(),
      canvasFactory: () => canvas,
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.blob).toBeInstanceOf(Blob);
    }
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it("mengembalikan error eksplisit saat toBlob gagal (bukan throw)", async () => {
    const { canvas } = createFakeCanvas(true);
    const result = await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: SAMPLE_DATA,
      settings: createDefaultTemplate(),
      canvasFactory: () => canvas,
    });

    expect(result.status).toBe("error");
  });

  it("mengembalikan error saat getContext mengembalikan null", async () => {
    const canvas: CanvasLike = {
      width: 0,
      height: 0,
      getContext: () => null,
      toBlob: vi.fn(),
    };
    const result = await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: SAMPLE_DATA,
      settings: createDefaultTemplate(),
      canvasFactory: () => canvas,
    });

    expect(result.status).toBe("error");
  });

  it("tidak memodifikasi objek sourceImage yang diberikan (foto asli tidak di-overwrite)", async () => {
    const { canvas } = createFakeCanvas();
    const sourceImage = { marker: "original" };
    const sourceSnapshot = { ...sourceImage };

    await renderWatermark({
      sourceImage,
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: SAMPLE_DATA,
      settings: createDefaultTemplate(),
      canvasFactory: () => canvas,
    });

    expect(sourceImage).toEqual(sourceSnapshot);
  });

  it("menggambar logoImage jika disediakan pada options", async () => {
    const { canvas, ctx } = createFakeCanvas();
    const mockLogo = { brand: "geopatriot" };

    const result = await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: SAMPLE_DATA,
      settings: createDefaultTemplate(),
      canvasFactory: () => canvas,
      logoImage: mockLogo,
    });

    expect(result.status).toBe("success");
    // ctx.drawImage dipanggil minimal 2x (sekali untuk sourceImage, sekali untuk logo)
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    expect(ctx.drawImage).toHaveBeenCalledWith(
      mockLogo,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("memotong teks dengan ellipsis bila melebihi lebar panel (audit finding F2)", async () => {
    const ctx = createFakeContext();
    // measureText mengembalikan lebar proporsional panjang teks agar truncation benar-benar teruji.
    (ctx.measureText as ReturnType<typeof vi.fn>).mockImplementation((text: string) => ({
      width: text.length * 20,
    }));
    const canvas: CanvasLike = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toBlob: (callback) => callback(new Blob(["fake-jpeg"], { type: "image/jpeg" })),
    };

    const longAddressData: WatermarkData = {
      snapshot: {
        ...SAMPLE_DATA.snapshot,
        address:
          "Jalan Sangat Panjang Sekali Nomor 123, Kelurahan Contoh, Kecamatan Contoh, Kabupaten Contoh, Provinsi Contoh",
      },
    };

    await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: longAddressData,
      settings: createDefaultTemplate(),
      canvasFactory: () => canvas,
    });

    const renderedTexts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map(
      (call) => call[0] as string,
    );
    const addressLine = renderedTexts.find((text) => text.startsWith("Jalan Sangat Panjang"));
    expect(addressLine).toBeDefined();
    expect(addressLine!.endsWith("...")).toBe(true);
    expect(addressLine!.length).toBeLessThan(longAddressData.snapshot.address!.length);
  });

  it("menggambar mapThumbnailImage & attribution provider sebagai elemen terpisah bila mapThumbnail aktif", async () => {
    const { canvas, ctx } = createFakeCanvas();
    const mockMapImage = { kind: "static-map" };
    const dataWithMap: WatermarkData = {
      snapshot: SAMPLE_DATA.snapshot,
      providerAttribution: "© LocationIQ",
    };
    const settings = createDefaultTemplate({
      visibleFields: { ...createDefaultTemplate().visibleFields, mapThumbnail: true },
    });

    const result = await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: dataWithMap,
      settings,
      canvasFactory: () => canvas,
      mapThumbnailImage: mockMapImage,
    });

    expect(result.status).toBe("success");
    // Map thumbnail digambar sebagai drawImage terpisah (bukan bagian dari teks).
    expect(ctx.drawImage).toHaveBeenCalledWith(
      mockMapImage,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
    // Attribution provider digambar sebagai baris teks tersendiri, tidak boleh hilang.
    const renderedTexts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map(
      (call) => call[0] as string,
    );
    expect(renderedTexts.some((text) => text.includes("LocationIQ"))).toBe(true);
  });

  it("tidak menggambar map thumbnail bila visibleFields.mapThumbnail nonaktif meski image disediakan", async () => {
    const { canvas, ctx } = createFakeCanvas();
    const mockMapImage = { kind: "static-map" };
    const settings = createDefaultTemplate({
      visibleFields: { ...createDefaultTemplate().visibleFields, mapThumbnail: false },
    });

    await renderWatermark({
      sourceImage: {},
      sourceWidth: 1080,
      sourceHeight: 1920,
      data: SAMPLE_DATA,
      settings,
      canvasFactory: () => canvas,
      mapThumbnailImage: mockMapImage,
    });

    expect(ctx.drawImage).not.toHaveBeenCalledWith(
      mockMapImage,
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    );
  });
});
