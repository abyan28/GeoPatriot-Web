import { describe, it, expect, vi } from "vitest";
import {
  getCameraZoomCapabilities,
  applyCameraZoom,
  getCameraCurrentZoom,
  type ZoomCapabilities,
} from "./camera";
import { clampOutputDimensions } from "@/lib/image/watermark-layout";
import { evaluateSystemDiagnostics } from "@/features/diagnostics";
import { INITIAL_STORAGE_INFO } from "@/features/settings";

/**
 * Pengujian Kompatibilitas Mobile Multi-Platform (Phase 15: iOS Safari & Phase 16: Android Chrome).
 * Sesuai agents/workflow-geopatriot-web.md #17 & #18 serta agents/rules-geopatriot-web.md #15.
 */
describe("Mobile Cross-Platform Compatibility (Phase 15 & 16)", () => {
  describe("iPhone Safari (WebKit) Compatibility", () => {
    it("menangani WebKit Safari yang tidak memiliki properti zoom pada MediaTrackCapabilities", () => {
      // Mock stream Safari WebKit di mana getCapabilities() tidak memiliki field 'zoom'
      const mockSafariTrack = {
        getCapabilities: () => ({
          aspectRatio: { min: 0.56, max: 1.78 },
          facingMode: ["environment", "user"],
          // Tidak ada zoom di Safari WebKit iOS
        }),
        getSettings: () => ({
          facingMode: "environment",
        }),
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getVideoTracks: () => [mockSafariTrack],
      } as unknown as MediaStream;

      const capabilities = getCameraZoomCapabilities(mockStream);
      expect(capabilities).toBeNull();

      // Memverifikasi diagnosa sistem mendeteksi camera_zoom_unsupported tanpa memblokir kamera
      const diag = evaluateSystemDiagnostics({
        cameraStatus: "ready",
        zoomCapabilities: capabilities,
        geoStatus: "ready",
        geoCoordinate: { latitude: -6.2, longitude: 106.8, accuracy: 12 },
        isResolvingAddress: false,
        hasResolvedAddress: true,
        storageInfo: INITIAL_STORAGE_INFO,
      });

      expect(diag.camera).toBe("camera_ready");
      expect(diag.cameraZoom).toBe("camera_zoom_unsupported");
      expect(diag.hasErrors).toBe(false); // Tidak ada fatal error
    });

    it("menangani graceful fallback saat applyConstraints zoom tidak didukung di WebKit", async () => {
      const mockSafariTrack = {
        applyConstraints: vi.fn().mockRejectedValue(new Error("OverconstrainedError: zoom is not supported")),
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getVideoTracks: () => [mockSafariTrack],
      } as unknown as MediaStream;

      const success = await applyCameraZoom(mockStream, 2.0);
      expect(success).toBe(false); // Graceful degradation, tidak melempar uncaught exception
    });

    it("mempertahankan rasio aspek untuk orientasi Portrait (iPhone) dan Landscape", () => {
      // Orientasi Portrait standar smartphone: 1080 x 1920 (9:16)
      const portrait = clampOutputDimensions(1080, 1920);
      expect(portrait.width).toBe(1080);
      expect(portrait.height).toBe(1920);

      // Orientasi Landscape: 1920 x 1080 (16:9)
      const landscape = clampOutputDimensions(1920, 1080);
      expect(landscape.width).toBe(1920);
      expect(landscape.height).toBe(1080);

      // Orientasi ultra-tinggi yang melebihi batas 4096px
      const ultraPortrait = clampOutputDimensions(3000, 6000);
      expect(ultraPortrait.height).toBe(4096);
      expect(ultraPortrait.width).toBe(2048);
    });
  });

  describe("Android Chrome Compatibility", () => {
    it("mendeteksi kapabilitas native zoom (min, max, step) pada Android Chrome", () => {
      const mockAndroidTrack = {
        getCapabilities: () => ({
          zoom: { min: 1.0, max: 8.0, step: 0.1 },
          facingMode: ["environment"],
        }),
        getSettings: () => ({
          zoom: 2.5,
        }),
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getVideoTracks: () => [mockAndroidTrack],
      } as unknown as MediaStream;

      const capabilities = getCameraZoomCapabilities(mockStream);
      expect(capabilities).toEqual<ZoomCapabilities>({
        min: 1.0,
        max: 8.0,
        step: 0.1,
      });

      const currentZoom = getCameraCurrentZoom(mockStream);
      expect(currentZoom).toBe(2.5);
    });

    it("menerapkan target zoom dengan struktur advanced constraint pada Android Chrome", async () => {
      const applySpy = vi.fn().mockResolvedValue(undefined);
      const mockAndroidTrack = {
        applyConstraints: applySpy,
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getVideoTracks: () => [mockAndroidTrack],
      } as unknown as MediaStream;

      const success = await applyCameraZoom(mockStream, 3.0);
      expect(success).toBe(true);
      expect(applySpy).toHaveBeenCalledWith({
        advanced: [{ zoom: 3.0 }],
      });
    });

    it("memetakan akurasi sinyal GPS Android dan storage warning secara presisi", () => {
      // Akurasi GPS lapangan baik (<=15m)
      const goodGps = evaluateSystemDiagnostics({
        cameraStatus: "ready",
        zoomCapabilities: { min: 1, max: 8, step: 0.1 },
        geoStatus: "ready",
        geoCoordinate: { latitude: -7.25, longitude: 112.75, accuracy: 5 },
        isResolvingAddress: false,
        hasResolvedAddress: true,
        storageInfo: INITIAL_STORAGE_INFO,
      });

      expect(goodGps.gps).toBe("gps_ready");
      expect(goodGps.gpsAccuracy).toBe(5);
      expect(goodGps.hasWarnings).toBe(false);

      // Akurasi sinyal GPS buruk (>50m) memicu warning diagnostik
      const poorGps = evaluateSystemDiagnostics({
        cameraStatus: "ready",
        zoomCapabilities: { min: 1, max: 8, step: 0.1 },
        geoStatus: "ready",
        geoCoordinate: { latitude: -7.25, longitude: 112.75, accuracy: 85 },
        isResolvingAddress: false,
        hasResolvedAddress: true,
        storageInfo: INITIAL_STORAGE_INFO,
      });

      expect(poorGps.hasWarnings).toBe(true);
      expect(poorGps.recommendedAction).toContain("Sinyal GPS kurang akurat (>50m)");
    });
  });
});
