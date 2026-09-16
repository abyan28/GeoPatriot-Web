"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GeoCoordinate, GpsQuality } from "@/types/location";
import {
  getCurrentPosition,
  watchPosition,
  isGeolocationSupported,
  type GeolocationStatus,
  type GeolocationReadResult,
} from "@/lib/browser/geolocation";
import { getGeocodingProvider, getMapProvider } from "@/lib/providers/provider-factory";

export interface AddressInfo {
  locationName?: string;
  address?: string;
}

export interface UseGeolocationOptions {
  /** Memulai pengawasan GPS otomatis saat hook di-mount jika diizinkan (default: true). */
  autoStart?: boolean;
  /** Mengaktifkan reverse geocoding otomatis untuk mendapatkan nama lokasi/alamat (default: true). */
  resolveAddress?: boolean;
  /**
   * Mengaktifkan pengambilan static map thumbnail otomatis (default: false).
   * Dimatikan secara default agar tidak menambah beban kuota LocationIQ saat
   * template watermark aktif tidak menampilkan map thumbnail (rules #12.6-12.7).
   */
  resolveMapThumbnail?: boolean;
}

/** Ukuran & zoom static map thumbnail yang diminta ke MapProvider. */
const MAP_THUMBNAIL_OPTIONS = { widthPx: 240, heightPx: 240, zoom: 16 };

export interface UseGeolocationReturn {
  status: GeolocationStatus;
  coordinate: GeoCoordinate | null;
  quality: GpsQuality | null;
  errorMessage: string | null;
  isWatching: boolean;
  addressInfo: AddressInfo | null;
  isResolvingAddress: boolean;
  /** Object URL map thumbnail terbaru, atau null bila belum tersedia/gagal (rules #6.6: non-fatal). */
  mapThumbnailUrl: string | null;
  startWatching: () => void;
  stopWatching: () => void;
  refresh: () => Promise<GeolocationReadResult>;
}

/**
 * Hook pengelola Geolocation browser & reverse geocoding otomatis.
 * Sesuai Rules #4 (Location Rules):
 * - Meminta izin secara eksplisit
 * - Melaporkan akurasi dan kualitas secara informatif
 * - Tidak pernah memblokir capture walau GPS gagal/akurasi rendah
 * - Graceful fallback bila geocoding tidak tersedia atau offline
 */
export function useGeolocation({
  autoStart = true,
  resolveAddress = true,
  resolveMapThumbnail = false,
}: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [status, setStatus] = useState<GeolocationStatus>(() => {
    if (!isGeolocationSupported()) return "unsupported";
    return autoStart ? "searching" : "idle";
  });
  const [coordinate, setCoordinate] = useState<GeoCoordinate | null>(null);
  const [quality, setQuality] = useState<GpsQuality | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (!isGeolocationSupported()) return "Browser Anda tidak mendukung Geolocation API.";
    return null;
  });
  const [isWatching, setIsWatching] = useState<boolean>(() =>
    Boolean(autoStart && isGeolocationSupported()),
  );
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
  const [mapThumbnailUrl, setMapThumbnailUrl] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastResolvedKeyRef = useRef<string>("");
  // Penanda urutan request geocoding untuk mengabaikan response basi yang
  // resolve setelah request yang lebih baru dikirim (mencegah race condition
  // di mana alamat lama menimpa alamat baru pada koordinat terkini).
  const geocodeRequestIdRef = useRef(0);
  const lastMapKeyRef = useRef<string>("");
  const mapRequestIdRef = useRef(0);
  // Object URL blob map thumbnail aktif saat ini, disimpan di ref agar dapat
  // di-revoke dengan aman sebelum diganti/di-unmount tanpa closure stale.
  const currentMapObjectUrlRef = useRef<string | null>(null);

  /**
   * Mengambil alamat reverse geocoding dari koordinat bila berubah secara signifikan.
   */
  const resolveLocationAddress = useCallback(
    async (lat: number, lon: number) => {
      if (!resolveAddress) return;

      // Kunci cache berbasis 4 desimal (~11 meter) untuk mencegah spam request
      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (lastResolvedKeyRef.current === cacheKey) return;

      // Tandai request ini sebagai request terbaru; response yang resolve setelah
      // request yang lebih baru dikirim akan diabaikan (staleness guard).
      const requestId = ++geocodeRequestIdRef.current;

      setIsResolvingAddress(true);
      try {
        const geocoder = getGeocodingProvider();
        const result = await geocoder.reverseGeocode(lat, lon);

        // Abaikan hasil ini bila sudah ada request geocoding lain yang lebih baru.
        if (requestId !== geocodeRequestIdRef.current) return;

        if (result.status === "success") {
          lastResolvedKeyRef.current = cacheKey;
          setAddressInfo({
            locationName: result.data.locationName,
            address: result.data.address,
          });
        }
      } catch {
        // Fallback aman: geocoding error tidak boleh menggagalkan status lokasi
      } finally {
        if (requestId === geocodeRequestIdRef.current) {
          setIsResolvingAddress(false);
        }
      }
    },
    [resolveAddress],
  );

  /**
   * Mengambil static map thumbnail dari koordinat bila berubah secara signifikan.
   * Kegagalan/keterlambatan tidak pernah menjadi fatal (rules #6.6) — hanya
   * mempertahankan thumbnail terakhir yang berhasil, atau null bila belum ada.
   */
  const resolveMapThumbnailImage = useCallback(
    async (lat: number, lon: number) => {
      if (!resolveMapThumbnail) return;

      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (lastMapKeyRef.current === cacheKey) return;

      const requestId = ++mapRequestIdRef.current;

      try {
        const mapProvider = getMapProvider();
        const result = await mapProvider.getStaticMap(lat, lon, MAP_THUMBNAIL_OPTIONS);

        // Abaikan hasil basi bila sudah ada request map thumbnail yang lebih baru.
        if (requestId !== mapRequestIdRef.current) {
          if (result.status === "success") {
            URL.revokeObjectURL(result.data);
          }
          return;
        }

        if (result.status === "success") {
          lastMapKeyRef.current = cacheKey;
          // Revoke object URL lama SETELAH URL baru siap dipakai, agar tidak
          // ada window di mana <img>/canvas yang masih memegang URL lama gagal.
          const previousUrl = currentMapObjectUrlRef.current;
          currentMapObjectUrlRef.current = result.data;
          setMapThumbnailUrl(result.data);
          if (previousUrl) {
            URL.revokeObjectURL(previousUrl);
          }
        }
      } catch {
        // Fallback aman: kegagalan map thumbnail tidak boleh menggagalkan status lokasi
      }
    },
    [resolveMapThumbnail],
  );

  /**
   * Handler pembaruan koordinat dari Geolocation API.
   */
  const handlePositionUpdate = useCallback(
    (result: GeolocationReadResult) => {
      setStatus(result.status);

      if (result.status === "ready" && result.coordinate) {
        setCoordinate(result.coordinate);
        setQuality(result.quality ?? null);
        setErrorMessage(null);
        void resolveLocationAddress(result.coordinate.latitude, result.coordinate.longitude);
        void resolveMapThumbnailImage(result.coordinate.latitude, result.coordinate.longitude);
      } else if (
        result.status === "denied" ||
        result.status === "error" ||
        result.status === "unsupported"
      ) {
        setErrorMessage(result.errorMessage ?? "Gagal memperoleh lokasi.");
      }
    },
    [resolveLocationAddress, resolveMapThumbnailImage],
  );

  /**
   * Menghentikan pengawasan posisi GPS aktif.
   */
  const stopWatching = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsWatching(false);
  }, []);

  /**
   * Memulai pengawasan posisi GPS secara berkelanjutan.
   */
  const startWatching = useCallback(() => {
    if (!isGeolocationSupported()) {
      setStatus("unsupported");
      setErrorMessage("Browser Anda tidak mendukung Geolocation API.");
      return;
    }

    // Bersihkan listener lama bila ada
    stopWatching();

    setStatus("searching");
    setIsWatching(true);

    const unsub = watchPosition(handlePositionUpdate, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    unsubscribeRef.current = unsub;
  }, [handlePositionUpdate, stopWatching]);

  /**
   * Memperbarui koordinat sekali pakai secara langsung.
   */
  const refresh = useCallback(async (): Promise<GeolocationReadResult> => {
    setStatus("searching");
    const result = await getCurrentPosition({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
    handlePositionUpdate(result);
    return result;
  }, [handlePositionUpdate]);

  // Efek autoStart saat inisialisasi: langganan watchPosition tanpa setState sinkron
  useEffect(() => {
    if (!autoStart || !isGeolocationSupported()) return;

    const unsub = watchPosition(handlePositionUpdate, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => {
      unsub();
    };
  }, [autoStart, handlePositionUpdate]);

  // Revoke object URL map thumbnail terakhir saat hook di-unmount agar tidak leak.
  useEffect(() => {
    return () => {
      if (currentMapObjectUrlRef.current) {
        URL.revokeObjectURL(currentMapObjectUrlRef.current);
        currentMapObjectUrlRef.current = null;
      }
    };
  }, []);

  return {
    status,
    coordinate,
    quality,
    errorMessage,
    isWatching,
    addressInfo,
    isResolvingAddress,
    mapThumbnailUrl,
    startWatching,
    stopWatching,
    refresh,
  };
}
