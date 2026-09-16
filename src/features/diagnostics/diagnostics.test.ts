import { describe, it, expect } from "vitest";
import { evaluateSystemDiagnostics } from "./use-system-diagnostics";
import { INITIAL_STORAGE_INFO } from "@/features/settings";

describe("evaluateSystemDiagnostics (Phase 14 Explicit State UX)", () => {
  it("memetakan seluruh subsistem ke state normal / optimal saat kondisi siap", () => {
    const result = evaluateSystemDiagnostics({
      cameraStatus: "ready",
      zoomCapabilities: { min: 1, max: 4, step: 0.1 },
      geoStatus: "ready",
      geoCoordinate: { latitude: -6.1754, longitude: 106.8272, accuracy: 8 },
      isResolvingAddress: false,
      hasResolvedAddress: true,
      storageInfo: {
        ...INITIAL_STORAGE_INFO,
        usageBytes: 10 * 1024 * 1024,
        quotaBytes: 100 * 1024 * 1024,
        percentUsed: 10,
      },
      isOnline: true,
    });

    expect(result.camera).toBe("camera_ready");
    expect(result.cameraZoom).toBe("camera_zoom_supported");
    expect(result.gps).toBe("gps_ready");
    expect(result.geocoding).toBe("geocoding_success");
    expect(result.map).toBe("map_success");
    expect(result.storage).toBe("storage_ok");
    expect(result.hasErrors).toBe(false);
    expect(result.hasWarnings).toBe(false);
  });

  it("mendeteksi state error saat kamera atau izin GPS ditolak", () => {
    const result = evaluateSystemDiagnostics({
      cameraStatus: "denied",
      zoomCapabilities: null,
      geoStatus: "denied",
      geoCoordinate: null,
      isResolvingAddress: false,
      hasResolvedAddress: false,
      storageInfo: INITIAL_STORAGE_INFO,
      isOnline: true,
    });

    expect(result.camera).toBe("camera_denied");
    expect(result.cameraZoom).toBe("camera_zoom_unsupported");
    expect(result.gps).toBe("gps_denied");
    expect(result.hasErrors).toBe(true);
    expect(result.recommendedAction).toBeDefined();
  });

  it("mendeteksi storage_warning dan storage_full sesuai persentase kuota IndexedDB", () => {
    // Uji batas warning (>= 80%)
    const warningResult = evaluateSystemDiagnostics({
      cameraStatus: "ready",
      zoomCapabilities: null,
      geoStatus: "ready",
      geoCoordinate: { latitude: 0, longitude: 0, accuracy: 10 },
      isResolvingAddress: false,
      hasResolvedAddress: true,
      storageInfo: {
        ...INITIAL_STORAGE_INFO,
        percentUsed: 85,
      },
    });

    expect(warningResult.storage).toBe("storage_warning");
    expect(warningResult.hasWarnings).toBe(true);
    expect(warningResult.hasErrors).toBe(false);

    // Uji batas full (>= 95%)
    const fullResult = evaluateSystemDiagnostics({
      cameraStatus: "ready",
      zoomCapabilities: null,
      geoStatus: "ready",
      geoCoordinate: { latitude: 0, longitude: 0, accuracy: 10 },
      isResolvingAddress: false,
      hasResolvedAddress: true,
      storageInfo: {
        ...INITIAL_STORAGE_INFO,
        percentUsed: 96,
      },
    });

    expect(fullResult.storage).toBe("storage_full");
    expect(fullResult.hasErrors).toBe(true);
    expect(fullResult.recommendedAction).toContain("Memori perangkat hampir habis");
  });

  it("mendeteksi warning saat akurasi GPS buruk (>50m)", () => {
    const result = evaluateSystemDiagnostics({
      cameraStatus: "ready",
      zoomCapabilities: null,
      geoStatus: "ready",
      geoCoordinate: { latitude: -6.1, longitude: 106.8, accuracy: 65 },
      isResolvingAddress: false,
      hasResolvedAddress: true,
      storageInfo: INITIAL_STORAGE_INFO,
    });

    expect(result.gps).toBe("gps_ready");
    expect(result.hasWarnings).toBe(true);
    expect(result.recommendedAction).toContain("Sinyal GPS kurang akurat (>50m)");
  });

  it("mendeteksi mode offline dan geocoding_error secara elegan", () => {
    const offlineResult = evaluateSystemDiagnostics({
      cameraStatus: "ready",
      zoomCapabilities: null,
      geoStatus: "ready",
      geoCoordinate: { latitude: -6.1, longitude: 106.8, accuracy: 10 },
      isResolvingAddress: false,
      hasResolvedAddress: false,
      storageInfo: INITIAL_STORAGE_INFO,
      isOnline: false,
    });

    expect(offlineResult.map).toBe("map_error");
    expect(offlineResult.geocoding).toBe("geocoding_error");
    expect(offlineResult.hasWarnings).toBe(true);
    expect(offlineResult.recommendedAction).toContain("mode offline");
  });
});
