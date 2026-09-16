import { describe, expect, it } from "vitest";
import { buildMetadataSnapshot } from "./use-metadata-config";
import type { GeoCoordinate } from "@/types/location";

describe("buildMetadataSnapshot", () => {
  const defaultManualLoc = {
    latitude: -6.2088,
    longitude: 106.8456,
    locationName: "Lokasi Dokumentasi",
    address: "Jakarta, Indonesia",
  };

  it("menghasilkan snapshot sesuai mode GPS ketika mode gps aktif", () => {
    const mockGpsCoordinate: GeoCoordinate = {
      latitude: -0.95,
      longitude: 116.8,
      accuracy: 6,
      altitude: 45,
    };

    const snapshot = buildMetadataSnapshot({
      locationMode: "gps",
      timeMode: "auto",
      manualLocation: defaultManualLoc,
      manualDateTime: "2026-09-16T10:00",
      gpsCoordinate: mockGpsCoordinate,
      gpsQuality: "good",
      resolvedAddressInfo: {
        locationName: "IKN Sepaku",
        address: "Penajam Paser Utara, Kalimantan Timur",
      },
    });

    expect(snapshot.metadataSource.location).toBe("gps");
    expect(snapshot.metadataSource.time).toBe("auto");
    expect(snapshot.coordinate.latitude).toBe(-0.95);
    expect(snapshot.coordinate.longitude).toBe(116.8);
    expect(snapshot.coordinate.accuracy).toBe(6);
    expect(snapshot.gpsQuality).toBe("good");
    expect(snapshot.locationName).toBe("IKN Sepaku");
    expect(snapshot.address).toBe("Penajam Paser Utara, Kalimantan Timur");
    expect(snapshot.timezone).toBeDefined();
    expect(snapshot.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("menghasilkan snapshot sesuai input manual saat mode manual dipilih", () => {
    const snapshot = buildMetadataSnapshot({
      locationMode: "manual",
      timeMode: "manual",
      manualLocation: {
        latitude: -7.25,
        longitude: 112.75,
        locationName: "Gedung Inspeksi",
        address: "Surabaya, Jawa Timur",
      },
      manualDateTime: "2026-08-17T09:30",
      customNote: "Pemeriksaan Batas Wilayah",
      gpsCoordinate: { latitude: 0, longitude: 0, accuracy: 1 },
      gpsQuality: "excellent",
    });

    expect(snapshot.metadataSource.location).toBe("manual");
    expect(snapshot.metadataSource.time).toBe("manual");
    expect(snapshot.coordinate.latitude).toBe(-7.25);
    expect(snapshot.coordinate.longitude).toBe(112.75);
    expect(snapshot.gpsQuality).toBeUndefined(); // Manual tidak memiliki GPS quality chip
    expect(snapshot.locationName).toBe("Gedung Inspeksi");
    expect(snapshot.address).toBe("Surabaya, Jawa Timur");
    expect(snapshot.customText).toBe("Pemeriksaan Batas Wilayah");
    expect(snapshot.capturedAt).toContain("2026-08-17T");
  });

  it("mode manual memakai resolvedAddressInfo sebagai fallback hanya bila field manual kosong", () => {
    const snapshotKosong = buildMetadataSnapshot({
      locationMode: "manual",
      timeMode: "auto",
      manualLocation: { latitude: -9.62, longitude: 124.88, locationName: "", address: "" },
      manualDateTime: "2026-09-16T10:00",
      resolvedAddressInfo: {
        locationName: "Kobalima Timur",
        address: "Kobalima Timur, Belu, NTT",
      },
    });
    expect(snapshotKosong.locationName).toBe("Kobalima Timur");
    expect(snapshotKosong.address).toBe("Kobalima Timur, Belu, NTT");

    const snapshotSudahDiisi = buildMetadataSnapshot({
      locationMode: "manual",
      timeMode: "auto",
      manualLocation: {
        latitude: -9.62,
        longitude: 124.88,
        locationName: "Nama Pilihan User",
        address: "Alamat Pilihan User",
      },
      manualDateTime: "2026-09-16T10:00",
      resolvedAddressInfo: {
        locationName: "Kobalima Timur",
        address: "Kobalima Timur, Belu, NTT",
      },
    });
    // Field yang sudah diisi manual oleh user TIDAK BOLEH ditimpa oleh hasil resolve otomatis.
    expect(snapshotSudahDiisi.locationName).toBe("Nama Pilihan User");
    expect(snapshotSudahDiisi.address).toBe("Alamat Pilihan User");
  });

  it("melakukan fallback ke lokasi manual jika mode GPS dipilih tetapi GPS belum terbaca", () => {
    const snapshot = buildMetadataSnapshot({
      locationMode: "gps",
      timeMode: "auto",
      manualLocation: defaultManualLoc,
      manualDateTime: "2026-09-16T10:00",
      gpsCoordinate: null,
      gpsQuality: null,
    });

    expect(snapshot.metadataSource.location).toBe("gps");
    expect(snapshot.coordinate.latitude).toBe(defaultManualLoc.latitude);
    expect(snapshot.coordinate.longitude).toBe(defaultManualLoc.longitude);
    expect(snapshot.locationName).toBe(defaultManualLoc.locationName);
    expect(snapshot.gpsQuality).toBeUndefined();
  });

  it("menyimpan tingkat zoom pada snapshot jika disediakan", () => {
    const snapshot = buildMetadataSnapshot({
      locationMode: "gps",
      timeMode: "auto",
      manualLocation: defaultManualLoc,
      manualDateTime: "2026-09-16T10:00",
      zoom: 2.5,
    });

    expect(snapshot.zoom).toBe(2.5);
  });

  it("membiarkan zoom bernilai undefined jika tidak diberikan", () => {
    const snapshot = buildMetadataSnapshot({
      locationMode: "gps",
      timeMode: "auto",
      manualLocation: defaultManualLoc,
      manualDateTime: "2026-09-16T10:00",
    });

    expect(snapshot.zoom).toBeUndefined();
  });
});
