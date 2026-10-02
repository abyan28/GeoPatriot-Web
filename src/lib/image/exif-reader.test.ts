import { describe, it, expect } from "vitest";
import { parseExifFromBuffer, readExifMetadata } from "./exif-reader";

/** Membangun JPEG minimal (SOI + APP1 Exif little-endian) berisi tanggal & GPS. */
function buildJpegWithExif(opts: {
  date?: string;
  gps?: { latRef: string; lat: [number, number, number]; lonRef: string; lon: [number, number, number] };
}): ArrayBuffer {
  const tiff: number[] = [];
  const u16 = (v: number) => [v & 0xff, (v >> 8) & 0xff];
  const u32 = (v: number) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff];
  const entry = (tag: number, type: number, count: number, value: number[]) => [
    ...u16(tag),
    ...u16(type),
    ...u32(count),
    ...value,
    ...Array(4 - value.length).fill(0),
  ];

  // Layout: header(8) | IFD0 | ExifIFD | GPS IFD | data area
  const ifd0Entries = (opts.date ? 1 : 0) + (opts.gps ? 1 : 0);
  const ifd0Size = 2 + ifd0Entries * 12 + 4;
  const exifIfdOffset = 8 + ifd0Size;
  const exifIfdSize = opts.date ? 2 + 12 + 4 : 0;
  const gpsIfdOffset = exifIfdOffset + exifIfdSize;
  const gpsIfdSize = opts.gps ? 2 + 4 * 12 + 4 : 0;
  const dataOffset = gpsIfdOffset + gpsIfdSize;

  const dataArea: number[] = [];
  const addData = (bytes: number[]) => {
    const off = dataOffset + dataArea.length;
    dataArea.push(...bytes);
    return off;
  };

  const dateBytes = opts.date ? [...opts.date].map((c) => c.charCodeAt(0)).concat(0) : [];
  const dateOff = opts.date ? addData(dateBytes) : 0;

  tiff.push(0x49, 0x49, 0x2a, 0x00, ...u32(8));
  tiff.push(...u16(ifd0Entries));
  if (opts.date) tiff.push(...entry(0x8769, 4, 1, u32(exifIfdOffset)));
  if (opts.gps) tiff.push(...entry(0x8825, 4, 1, u32(gpsIfdOffset)));
  tiff.push(...u32(0));

  if (opts.date) {
    tiff.push(...u16(1));
    tiff.push(...entry(0x9003, 2, dateBytes.length, u32(dateOff)));
    tiff.push(...u32(0));
  }

  if (opts.gps) {
    const rat = (vals: [number, number, number]) =>
      vals.flatMap((v) => [...u32(v), ...u32(1)]);
    const latOff = addData(rat(opts.gps.lat));
    const lonOff = addData(rat(opts.gps.lon));
    tiff.push(...u16(4));
    tiff.push(...entry(0x0001, 2, 2, [opts.gps.latRef.charCodeAt(0), 0]));
    tiff.push(...entry(0x0002, 5, 3, u32(latOff)));
    tiff.push(...entry(0x0003, 2, 2, [opts.gps.lonRef.charCodeAt(0), 0]));
    tiff.push(...entry(0x0004, 5, 3, u32(lonOff)));
    tiff.push(...u32(0));
  }
  tiff.push(...dataArea);

  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0, 0];
  const segmentLength = 2 + exifHeader.length + tiff.length;
  const bytes = [
    0xff, 0xd8,
    0xff, 0xe1, (segmentLength >> 8) & 0xff, segmentLength & 0xff,
    ...exifHeader,
    ...tiff,
    0xff, 0xd9,
  ];
  return new Uint8Array(bytes).buffer;
}

describe("parseExifFromBuffer", () => {
  it("membaca waktu pemotretan ke format datetime-local", () => {
    const result = parseExifFromBuffer(buildJpegWithExif({ date: "2024:05:17 14:03:09" }));
    expect(result.capturedAtLocal).toBe("2024-05-17T14:03");
    expect(result.latitude).toBeUndefined();
  });

  it("membaca GPS dan menerapkan tanda untuk belahan selatan/barat", () => {
    const result = parseExifFromBuffer(
      buildJpegWithExif({
        gps: { latRef: "S", lat: [9, 37, 13], lonRef: "E", lon: [124, 52, 46] },
      }),
    );
    expect(result.latitude).toBeCloseTo(-9.620278, 5);
    expect(result.longitude).toBeCloseTo(124.879444, 5);
  });

  it("mengabaikan GPS (0,0) karena menandakan belum ada fix", () => {
    const result = parseExifFromBuffer(
      buildJpegWithExif({ gps: { latRef: "N", lat: [0, 0, 0], lonRef: "E", lon: [0, 0, 0] } }),
    );
    expect(result.latitude).toBeUndefined();
  });

  it("mengembalikan objek kosong untuk data non-JPEG atau rusak", () => {
    expect(parseExifFromBuffer(new Uint8Array([1, 2, 3, 4, 5]).buffer)).toEqual({});
    expect(parseExifFromBuffer(new ArrayBuffer(0))).toEqual({});
    const truncated = buildJpegWithExif({ date: "2024:05:17 14:03:09" }).slice(0, 40);
    expect(() => parseExifFromBuffer(truncated)).not.toThrow();
  });

  it("menolak tanggal EXIF nol", () => {
    const result = parseExifFromBuffer(buildJpegWithExif({ date: "0000:00:00 00:00:00" }));
    expect(result.capturedAtLocal).toBeUndefined();
  });
});

describe("readExifMetadata", () => {
  it("membaca dari Blob", async () => {
    const blob = new Blob([buildJpegWithExif({ date: "2023:01:02 03:04:05" })]);
    expect((await readExifMetadata(blob)).capturedAtLocal).toBe("2023-01-02T03:04");
  });
});
