"use client";

import { useState, useCallback } from "react";
import type {
  GeoCoordinate,
  GpsQuality,
  LocationSource,
  ManualLocationInput,
} from "@/types/location";
import type { MetadataSnapshot, TimeMode } from "@/types/metadata";

export interface MetadataConfigState {
  locationMode: LocationSource;
  timeMode: TimeMode;
  manualLocation: ManualLocationInput;
  manualDateTime: string;
  customNote: string;
}

export interface UseMetadataConfigReturn extends MetadataConfigState {
  setLocationMode: (mode: LocationSource) => void;
  setTimeMode: (mode: TimeMode) => void;
  setManualLocation: (input: Partial<ManualLocationInput>) => void;
  setManualDateTime: (dt: string) => void;
  setCustomNote: (note: string) => void;
  prefillFromGps: (
    coordinate: GeoCoordinate,
    addressInfo?: { locationName?: string; address?: string } | null,
  ) => void;
  createSnapshot: (params: {
    gpsCoordinate?: GeoCoordinate | null;
    gpsQuality?: GpsQuality | null;
    /**
     * Alamat hasil reverse geocoding — dipakai untuk mode GPS (posisi live)
     * MAUPUN mode manual (hasil resolve koordinat manual via
     * useGeolocation().resolveForCoordinate), sebagai fallback bila field
     * locationName/address manual belum diisi user sendiri.
     */
    resolvedAddressInfo?: { locationName?: string; address?: string } | null;
    zoom?: number;
  }) => MetadataSnapshot;
  resetToDefaults: () => void;
}

/**
 * Nilai default lokasi manual jika GPS tidak tersedia.
 */
const DEFAULT_MANUAL_LOCATION: ManualLocationInput = {
  latitude: -6.2088,
  longitude: 106.8456,
  locationName: "Lokasi Dokumentasi",
  address: "Indonesia",
};

/**
 * Mendapatkan representasi waktu lokal format YYYY-MM-DDTHH:mm untuk input datetime.
 */
function getLocalDatetimeString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Mengambil nama IANA timezone lokal atau fallback Asia/Jakarta.
 */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  } catch {
    return "Asia/Jakarta";
  }
}

/**
 * Parameter untuk membangun snapshot metadata yang dibekukan secara murni.
 */
export interface BuildMetadataSnapshotParams {
  locationMode: LocationSource;
  timeMode: TimeMode;
  manualLocation: ManualLocationInput;
  manualDateTime: string;
  customNote?: string;
  gpsCoordinate?: GeoCoordinate | null;
  gpsQuality?: GpsQuality | null;
  /** Alamat hasil reverse geocoding — GPS live ATAU koordinat manual (lihat createSnapshot). */
  resolvedAddressInfo?: { locationName?: string; address?: string } | null;
  /** Tingkat zoom aktif saat pengambilan foto (rules #5.5 & #15.9). */
  zoom?: number;
}

/**
 * Fungsi murni untuk membangun objek MetadataSnapshot yang dibekukan (immutable).
 * Sesuai Rules #5 (Metadata Rules) & PRD #9.
 */
export function buildMetadataSnapshot({
  locationMode,
  timeMode,
  manualLocation,
  manualDateTime,
  customNote,
  gpsCoordinate,
  gpsQuality,
  resolvedAddressInfo,
  zoom,
}: BuildMetadataSnapshotParams): MetadataSnapshot {
  const timezone = getLocalTimezone();

  // Penentuan koordinat & alamat berdasarkan mode aktif
  let finalCoordinate: GeoCoordinate;
  let finalQuality: GpsQuality | undefined;
  let finalLocationName: string | undefined;
  let finalAddress: string | undefined;
  const actualLocationSource: LocationSource = locationMode;

  if (locationMode === "gps" && gpsCoordinate) {
    finalCoordinate = { ...gpsCoordinate };
    finalQuality = gpsQuality ?? undefined;
    finalLocationName = resolvedAddressInfo?.locationName;
    finalAddress = resolvedAddressInfo?.address;
  } else {
    // Mode manual atau fallback jika GPS belum terbaca. Field yang diisi
    // manual oleh user tetap prioritas; resolvedAddressInfo (hasil reverse
    // geocoding otomatis untuk koordinat manual) hanya dipakai sebagai
    // fallback bila user belum mengisi nama lokasi/alamat sendiri.
    finalCoordinate = {
      latitude: manualLocation.latitude,
      longitude: manualLocation.longitude,
    };
    finalQuality = undefined;
    finalLocationName =
      manualLocation.locationName || resolvedAddressInfo?.locationName || undefined;
    finalAddress = manualLocation.address || resolvedAddressInfo?.address || undefined;
  }

  // Penentuan waktu capture
  let capturedAtIso: string;
  if (timeMode === "auto") {
    capturedAtIso = new Date().toISOString();
  } else {
    const parsedDate = new Date(manualDateTime);
    capturedAtIso = isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
  }

  return {
    coordinate: finalCoordinate,
    gpsQuality: finalQuality,
    locationName: finalLocationName,
    address: finalAddress,
    capturedAt: capturedAtIso,
    timezone,
    metadataSource: {
      location: actualLocationSource,
      time: timeMode,
    },
    customText: customNote?.trim() ? customNote.trim() : undefined,
    zoom: zoom !== undefined && zoom > 0 ? Number(zoom.toFixed(2)) : undefined,
  };
}

/**
 * Hook pengelola konfigurasi metadata & snapshot generator (Phase 4).
 * Memenuhi Rules #5:
 * - Metadata dibekukan per capture (immutable snapshot)
 * - Mode manual benar-benar menggunakan input pengguna
 * - Mode otomatis memakai waktu nyata saat capture
 * - Menyimpan nama timezone (mis. Asia/Jakarta)
 */
export function useMetadataConfig(): UseMetadataConfigReturn {
  const [locationMode, setLocationMode] = useState<LocationSource>("gps");
  const [timeMode, setTimeMode] = useState<TimeMode>("auto");
  const [manualLocation, setManualLocationState] =
    useState<ManualLocationInput>(DEFAULT_MANUAL_LOCATION);
  const [manualDateTime, setManualDateTime] = useState<string>(getLocalDatetimeString);
  const [customNote, setCustomNote] = useState<string>("");

  const setManualLocation = useCallback((input: Partial<ManualLocationInput>) => {
    setManualLocationState((prev) => ({
      ...prev,
      ...input,
    }));
  }, []);

  /**
   * Mengisi field manual dengan data GPS live yang sedang terbaca.
   */
  const prefillFromGps = useCallback(
    (
      coordinate: GeoCoordinate,
      addressInfo?: { locationName?: string; address?: string } | null,
    ) => {
      setManualLocationState({
        latitude: Number(coordinate.latitude.toFixed(6)),
        longitude: Number(coordinate.longitude.toFixed(6)),
        locationName: addressInfo?.locationName || "Titik Koordinat Lapangan",
        address: addressInfo?.address || "",
      });
    },
    [],
  );

  /**
   * Mengembalikan semua konfigurasi ke default awal.
   */
  const resetToDefaults = useCallback(() => {
    setLocationMode("gps");
    setTimeMode("auto");
    setManualLocationState(DEFAULT_MANUAL_LOCATION);
    setManualDateTime(getLocalDatetimeString());
    setCustomNote("");
  }, []);

  /**
   * Menghasilkan MetadataSnapshot yang dibekukan (frozen) pada saat tombol shutter ditekan.
   */
  const createSnapshot = useCallback(
    ({
      gpsCoordinate,
      gpsQuality,
      resolvedAddressInfo,
      zoom,
    }: {
      gpsCoordinate?: GeoCoordinate | null;
      gpsQuality?: GpsQuality | null;
      resolvedAddressInfo?: { locationName?: string; address?: string } | null;
      zoom?: number;
    }): MetadataSnapshot => {
      return buildMetadataSnapshot({
        locationMode,
        timeMode,
        manualLocation,
        manualDateTime,
        customNote,
        gpsCoordinate,
        gpsQuality,
        resolvedAddressInfo,
        zoom,
      });
    },
    [locationMode, timeMode, manualLocation, manualDateTime, customNote],
  );

  return {
    locationMode,
    timeMode,
    manualLocation,
    manualDateTime,
    customNote,
    setLocationMode,
    setTimeMode,
    setManualLocation,
    setManualDateTime,
    setCustomNote,
    prefillFromGps,
    createSnapshot,
    resetToDefaults,
  };
}
