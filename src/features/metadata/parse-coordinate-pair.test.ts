import { describe, expect, it } from "vitest";
import { formatCoordinatePair, parseCoordinatePair } from "./parse-coordinate-pair";

describe("parseCoordinatePair", () => {
  it("mem-parse format Google Maps dengan separator koma tanpa spasi", () => {
    expect(parseCoordinatePair("-9.620308,124.879609")).toEqual({
      latitude: -9.620308,
      longitude: 124.879609,
    });
  });

  it("mem-parse separator koma dengan spasi", () => {
    expect(parseCoordinatePair("-9.620308, 124.879609")).toEqual({
      latitude: -9.620308,
      longitude: 124.879609,
    });
  });

  it("mem-parse separator spasi saja", () => {
    expect(parseCoordinatePair("-9.620308 124.879609")).toEqual({
      latitude: -9.620308,
      longitude: 124.879609,
    });
  });

  it("mengembalikan null untuk format yang tidak dikenali", () => {
    expect(parseCoordinatePair("bukan koordinat")).toBeNull();
    expect(parseCoordinatePair("-9.620308")).toBeNull();
    expect(parseCoordinatePair("")).toBeNull();
  });

  it("mengembalikan null bila latitude/longitude di luar rentang valid", () => {
    expect(parseCoordinatePair("-95,124.8")).toBeNull(); // latitude < -90
    expect(parseCoordinatePair("9.6,190")).toBeNull(); // longitude > 180
  });

  it("menerima nilai batas rentang (90 dan 180)", () => {
    expect(parseCoordinatePair("90,180")).toEqual({ latitude: 90, longitude: 180 });
    expect(parseCoordinatePair("-90,-180")).toEqual({ latitude: -90, longitude: -180 });
  });
});

describe("formatCoordinatePair", () => {
  it("memformat pasangan koordinat menjadi string lat,lon", () => {
    expect(formatCoordinatePair(-9.620308, 124.879609)).toBe("-9.620308,124.879609");
  });
});
