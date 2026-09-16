import { describe, expect, it, vi, beforeEach } from "vitest";
import { classifyGpsQuality, getCurrentPosition, isGeolocationSupported } from "./geolocation";

describe("classifyGpsQuality", () => {
  it("mengkategorikan accuracy sesuai ambang batas PRD #9", () => {
    expect(classifyGpsQuality(4)).toBe("excellent");
    expect(classifyGpsQuality(10)).toBe("good");
    expect(classifyGpsQuality(30)).toBe("fair");
    expect(classifyGpsQuality(100)).toBe("poor");
  });
});

describe("getCurrentPosition", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn(),
      },
    });
  });

  it("mengembalikan status unsupported bila geolocation tidak tersedia", async () => {
    vi.stubGlobal("navigator", {});
    expect(isGeolocationSupported()).toBe(false);
    const result = await getCurrentPosition();
    expect(result.status).toBe("unsupported");
  });

  it("mengembalikan koordinat dan quality saat sukses", async () => {
    const mockGetCurrentPosition = navigator.geolocation
      .getCurrentPosition as unknown as ReturnType<typeof vi.fn>;
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: {
          latitude: -6.2,
          longitude: 106.8,
          accuracy: 3,
          altitude: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    const result = await getCurrentPosition();
    expect(result.status).toBe("ready");
    expect(result.coordinate?.latitude).toBe(-6.2);
    expect(result.quality).toBe("excellent");
  });

  it("mengembalikan status denied saat permission ditolak", async () => {
    const mockGetCurrentPosition = navigator.geolocation
      .getCurrentPosition as unknown as ReturnType<typeof vi.fn>;
    mockGetCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, PERMISSION_DENIED: 1, message: "denied" } as GeolocationPositionError);
      },
    );

    const result = await getCurrentPosition();
    expect(result.status).toBe("denied");
  });
});
