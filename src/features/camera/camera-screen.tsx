"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useCamera } from "./use-camera";
import { getCameraCurrentZoom } from "@/lib/browser/camera";
import { useFullscreen } from "./use-fullscreen";
import { CameraViewport } from "./camera-viewport";
import { CameraControls, ZoomControlsPill } from "./camera-controls";
import { useCapturePipeline } from "./use-capture-pipeline";
import { SessionGalleryDrawer } from "@/features/sessions";
import { useGeolocation } from "@/features/location";
import { useMetadataConfig, MetadataEditorSheet } from "@/features/metadata";
import { useAppSettings, SettingsSheet } from "@/features/settings";
import {
  useSystemDiagnostics,
  DiagnosticsModal,
  StorageWarningBanner,
  GpsFallbackAlert,
} from "@/features/diagnostics";
import { StatusChip, GpsQualityChip } from "@/components/ui/StatusChip";
import {
  EditIcon,
  MapPinIcon,
  ClockIcon,
  SlidersIcon,
  SettingsIcon,
  MaximizeIcon,
  MinimizeIcon,
  ArrowUpDownIcon,
  CrosshairIcon,
} from "@/components/icons";
import { useToast } from "@/components/ui/Toast";

/**
 * Komponen layar utama Kamera GeoPatriot Web (Integrasi Phase 1-6).
 * Menyajikan live camera feed, live GPS tracking, watermark rendering engine, dan capture pipeline ke IndexedDB.
 */
export function CameraScreen() {
  const {
    status: cameraStatus,
    facingMode,
    errorMessage: cameraError,
    videoRef,
    stream: cameraStream,
    zoom,
    zoomCapabilities,
    zoomPresets,
    setZoom,
    start,
    toggleFacingMode,
  } = useCamera();

  const appSettings = useAppSettings();
  const { watermarkSettings } = appSettings;

  const {
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
    createSnapshot,
    resetToDefaults,
  } = useMetadataConfig();

  const {
    status: geoStatus,
    coordinate: geoCoord,
    quality: geoQuality,
    addressInfo: geoAddress,
    mapThumbnailUrl,
    resolveForCoordinate,
    refresh: refreshGps,
  } = useGeolocation({
    autoStart: true,
    resolveAddress: true,
    resolveMapThumbnail: watermarkSettings.visibleFields.mapThumbnail,
    mapZoom: watermarkSettings.mapZoom,
    // Saat mode manual aktif, resolve GPS watch di-skip agar tidak berebut
    // addressInfo/mapThumbnailUrl dengan hasil resolve koordinat manual (di bawah).
    isManualLocationActive: locationMode === "manual",
  });

  // Memicu reverse geocoding + map thumbnail untuk koordinat manual yang
  // diisi/diubah user — sebelumnya field ini kosong karena tidak ada wiring
  // sama sekali ke LocationIQ untuk mode manual.
  useEffect(() => {
    if (locationMode !== "manual") return;
    resolveForCoordinate(manualLocation.latitude, manualLocation.longitude);
  }, [locationMode, manualLocation.latitude, manualLocation.longitude, resolveForCoordinate]);

  const {
    capturePhoto,
    isCapturing,
    lastPhoto,
    sessionPhotoCount,
    currentSessionId,
    reloadSessionPhotos,
  } = useCapturePipeline({
    videoRef,
    isCameraReady: cameraStatus === "ready",
    watermarkSettings,
    createSnapshot: () =>
      createSnapshot({
        gpsCoordinate: geoCoord,
        gpsQuality: geoQuality,
        resolvedAddressInfo: geoAddress,
        // Baca zoom aktual dari hardware track (bukan React state UI) tepat di
        // detik shutter, agar tidak stale terhadap gestur pinch yang baru
        // selesai (audit finding FINDING-05).
        zoom: getCameraCurrentZoom(cameraStream),
      }),
    mapThumbnailUrl,
  });

  const { showToast } = useToast();
  // Root element target Fullscreen API — BERBEDA dari PWA standalone
  // (src/features/pwa/use-pwa.ts): ini murni Web Fullscreen API yang dipicu
  // tombol di dalam app, berlaku juga saat dibuka di tab browser biasa.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } =
    useFullscreen(rootRef);
  // Deteksi orientasi layar (landscape vs portrait) untuk penyesuaian tata letak bebas tumpang tindih
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);
    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  // Tinggi footer kontrol kamera diukur secara live (bukan angka statis) agar
  // HUD watermark di atasnya selalu punya jarak aman terlepas dari apakah
  // safe-area-inset-bottom device berbeda-beda — mencegah HUD ketutupan tombol shutter/kontrol.
  // Default 114px memastikan clearance shutter (shutter 80px + padding bawah 24px + margin)
  // tetap aman saat awal render maupun saat kembali dari orientasi landscape.
  const footerRef = useRef<HTMLElement | null>(null);
  const [footerHeight, setFooterHeight] = useState<number>(114);

  useEffect(() => {
    if (isLandscape) return;
    const node = footerRef.current;
    if (!node) return;

    // Ukur tinggi aktual footer langsung saat mount / kembali dari mode landscape
    const rect = node.getBoundingClientRect();
    if (rect.height > 0) {
      setFooterHeight(rect.height);
    }

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ??
          entry.target.getBoundingClientRect().height;
        if (height > 0) {
          setFooterHeight(height);
        }
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cameraStatus, isLandscape]);

  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isMetadataSheetOpen, setIsMetadataSheetOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [liveClock, setLiveClock] = useState<string>("");

  // Posisi HUD live watermark: "bottom" (default bawah-kiri) atau "top" (atas-kiri)
  const [hudPosition, setHudPosition] = useState<"bottom" | "top">(() => {
    return watermarkSettings.position === "top" || watermarkSettings.position === "topLeft"
      ? "top"
      : "bottom";
  });

  // State minimize HUD untuk framing viewfinder tanpa halangan
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  // Evaluasi diagnostik kesehatan subsistem (Phase 14 / workflow #16)
  const diagnostics = useSystemDiagnostics({
    cameraStatus,
    zoomCapabilities,
    geoStatus,
    geoCoordinate: geoCoord,
    isResolvingAddress: false,
    hasResolvedAddress: Boolean(geoAddress?.locationName || geoAddress?.address),
    storageInfo: appSettings.storageInfo,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  });

  // Live timer untuk update jam di preview watermark HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setLiveClock(
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
          now.getHours(),
        )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handler tombol capture: mengeksekusi pipeline capture frame & watermark canvas (Phase 5 & 6).
   */
  const handleCapture = async () => {
    if (cameraStatus !== "ready") {
      showToast("Kamera belum aktif", "error");
      return;
    }

    // Efek visual shutter flash instan
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const result = await capturePhoto();
    if (result.status === "success" && result.photo) {
      const source = result.photo.snapshot.metadataSource.location.toUpperCase();
      const lat = result.photo.snapshot.coordinate.latitude.toFixed(4);
      const lon = result.photo.snapshot.coordinate.longitude.toFixed(4);
      showToast(`Foto tersimpan [${source}] ${lat}, ${lon}`, "success");
    } else {
      showToast(result.errorMessage || "Gagal mengambil foto", "error");
    }
  };

  /**
   * Membuka Galeri Sesi (Phase 10).
   */
  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  /**
   * Toggle Fullscreen API. Enhancement opsional — kegagalan/ketidaktersediaan
   * tidak boleh mengganggu kamera/session, hanya ditampilkan sebagai toast ringan.
   */
  const handleToggleFullscreen = async () => {
    const result = await toggleFullscreen();
    if (result.status === "error") {
      showToast("Layar penuh tidak tersedia di browser ini.", "info");
    }
  };

  // Koordinat & alamat aktif untuk ditampilkan pada Live HUD
  const activeLatitude =
    locationMode === "gps" && geoCoord ? geoCoord.latitude : manualLocation.latitude;
  const activeLongitude =
    locationMode === "gps" && geoCoord ? geoCoord.longitude : manualLocation.longitude;
  const activeLocationName =
    locationMode === "gps"
      ? geoAddress?.locationName || (geoCoord ? "Koordinat GPS Lapangan" : "Mencari Lokasi...")
      : // geoAddress di mode manual berisi hasil resolveForCoordinate untuk
        // koordinat manual (bukan posisi GPS) — dipakai sebagai fallback bila
        // user belum mengisi nama lokasi/alamat sendiri.
        manualLocation.locationName || geoAddress?.locationName || "Lokasi Manual";
  const activeTimeDisplay = timeMode === "auto" ? liveClock : manualDateTime.replace("T", " ");

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-[100dvh] bg-[#08111d] flex flex-col justify-between overflow-hidden shadow-2xl ${
        isFullscreen || isLandscape ? "max-w-none" : "max-w-md mx-auto"
      }`}
    >
      {/* Top Header Bar: Branding & GPS Status Chip (Clickable) */}
      <header
        className={`absolute top-0 left-0 z-30 pt-[max(1rem,env(safe-area-inset-top))] pb-3 bg-gradient-to-b from-[#08111d]/95 via-[#08111d]/60 to-transparent flex items-center justify-between pointer-events-none ${
          isLandscape ? "right-24 pr-2 pl-3 sm:pl-4" : "right-0 px-3 sm:px-4"
        }`}
      >
        {/* Branding Logo: Ketuk untuk membuka Diagnostik Kesehatan Sistem (Phase 14) */}
        <button
          type="button"
          onClick={() => setIsDiagnosticsOpen(true)}
          aria-label="Buka Diagnostik Kesehatan Sistem"
          title="Diagnostik Kesehatan Sistem"
          className="pointer-events-auto flex items-center gap-2 text-left active:scale-95 transition-transform group shrink-0"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-lg border border-[#c5984f]/60 bg-[#08111d] flex items-center justify-center shrink-0">
            <Image
              src="/app-icon.png"
              alt="Logo GeoPatriot Web"
              width={36}
              height={36}
              className="object-cover"
              priority
            />
            {/* Status Dot Indikator Diagnostik */}
            {diagnostics.hasErrors ? (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#08111d] animate-pulse" />
            ) : diagnostics.hasWarnings ? (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#08111d]" />
            ) : null}
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-white tracking-wide leading-tight drop-shadow-md group-hover:text-[#dcab55] transition-colors">
              GeoPatriot
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#dcab55] tracking-tight leading-none drop-shadow">
              GPS Camera
            </span>
          </div>
        </button>

        {/* GPS / Manual Status Chip & Tombol Pengaturan Cepat */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          {locationMode === "manual" ? (
            <StatusChip
              label="Mode Manual"
              tone="amber"
              icon={<EditIcon size={12} />}
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Mode lokasi manual. Ketuk untuk ubah koordinat."
              className="cursor-pointer active:scale-95 transition-transform text-[11px] py-1 px-2"
            />
          ) : geoStatus === "ready" && geoCoord ? (
            <GpsQualityChip
              quality={geoQuality ?? "good"}
              accuracy={geoCoord.accuracy}
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Status kualitas GPS. Ketuk untuk pengaturan metadata."
              className="cursor-pointer active:scale-95 transition-transform text-[11px] py-1 px-2"
            />
          ) : geoStatus === "searching" ? (
            <StatusChip
              label="Mencari GPS..."
              tone="sky"
              active
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Sedang mencari sinyal GPS. Ketuk untuk opsi manual."
              className="cursor-pointer active:scale-95 transition-transform text-[11px] py-1 px-2"
            />
          ) : geoStatus === "denied" ? (
            <StatusChip
              label="GPS Ditolak"
              tone="rose"
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Izin GPS ditolak. Ketuk untuk beralih ke input manual."
              className="cursor-pointer active:scale-95 transition-transform text-[11px] py-1 px-2"
            />
          ) : (
            <StatusChip
              label="GPS Offline"
              tone="zinc"
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="GPS tidak tersedia. Ketuk untuk input manual."
              className="cursor-pointer active:scale-95 transition-transform text-[11px] py-1 px-2"
            />
          )}

          {isFullscreenSupported && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen ? "Keluar layar penuh" : "Masuk layar penuh"}
              title={isFullscreen ? "Keluar layar penuh" : "Masuk layar penuh"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#08111d]/90 hover:bg-[#0e2035] border border-[#2f6d8b]/50 text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-md active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#c5984f] shrink-0"
            >
              {isFullscreen ? (
                <MinimizeIcon size={15} className="text-[#dcab55]" />
              ) : (
                <MaximizeIcon size={15} className="text-[#dcab55]" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Buka Pengaturan Aplikasi"
            title="Pengaturan Aplikasi"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#08111d]/90 hover:bg-[#0e2035] border border-[#2f6d8b]/50 text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-md active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#c5984f] shrink-0"
          >
            <SettingsIcon size={15} className="text-[#dcab55]" />
          </button>
        </div>
      </header>

      {/* Banner Peringatan Diagnostik & Fallback Proaktif (Phase 14) */}
      <div className="absolute top-[62px] inset-x-0 z-25 pointer-events-auto flex flex-col">
        <StorageWarningBanner
          storageState={diagnostics.storage}
          percentUsed={diagnostics.storagePercentUsed}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <GpsFallbackAlert
          gpsState={diagnostics.gps}
          gpsAccuracy={diagnostics.gpsAccuracy}
          locationMode={locationMode}
          onSwitchToManual={() => {
            setLocationMode("manual");
            setIsMetadataSheetOpen(true);
            showToast("Beralih ke mode lokasi manual", "info");
          }}
        />
      </div>

      {/* Main Viewport */}
      <main className="w-full h-full flex-1 flex flex-col">
        <CameraViewport
          videoRef={videoRef}
          status={cameraStatus}
          facingMode={facingMode}
          errorMessage={cameraError}
          isFlashing={isFlashing}
          onRequestCamera={() => start()}
          zoom={zoom}
          zoomCapabilities={zoomCapabilities}
          onZoomChange={setZoom}
        >
          {/* Watermark Live HUD Overlay: Compact Content-Based Card berposisi CENTER
              (horizontal center di portrait & landscape).
              Opasitas tipis/translucent terhubung dengan preferensi watermarkSettings.opacity pengguna.
              Dilengkapi tombol flip posisi (atas/bawah) dan tombol minimize untuk framing leluasa. */}
          {isHudMinimized ? (
            <div
              className="absolute pointer-events-auto transition-all duration-200 z-20"
              style={{
                left: isLandscape ? "calc(50% - 44px)" : "50%",
                transform: "translateX(-50%)",
                bottom:
                  hudPosition === "top"
                    ? "auto"
                    : isLandscape
                    ? "1.25rem"
                    : Math.max(footerHeight + 10, 114),
                top:
                  hudPosition === "top"
                    ? "max(4.5rem, env(safe-area-inset-top) + 3.5rem)"
                    : "auto",
              }}
            >
              <button
                type="button"
                onClick={() => setIsHudMinimized(false)}
                aria-label="Tampilkan panel watermark"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#08111d]/75 hover:bg-[#0e2035] backdrop-blur-md border border-[#c5984f]/60 text-white shadow-xl active:scale-95 transition-all text-xs font-semibold"
              >
                <MapPinIcon size={12} className="text-[#c5984f]" />
                <span className="truncate max-w-[180px]">{activeLocationName}</span>
                <MaximizeIcon size={11} className="text-zinc-400 ml-0.5" />
              </button>
            </div>
          ) : (
            <div
              className="absolute pointer-events-auto transition-[bottom,top,transform] duration-200 z-20 flex flex-col items-end"
              style={{
                left: isLandscape ? "calc(50% - 44px)" : "50%",
                transform: "translateX(-50%)",
                bottom:
                  hudPosition === "top"
                    ? "auto"
                    : isLandscape
                    ? "1.25rem"
                    : Math.max(footerHeight + 10, 114),
                top:
                  hudPosition === "top"
                    ? "max(4.5rem, env(safe-area-inset-top) + 3.5rem)"
                    : "auto",
                maxWidth: isLandscape
                  ? "min(50vw, 380px)"
                  : "min(calc(100vw - 6rem), 310px)",
              }}
            >
              {/* Lencana Brand GeoPatriot menempel di pojok kanan-atas card */}
              {watermarkSettings.visibleFields.branding && (
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-t-xl backdrop-blur-md border-t border-x border-[#2f6d8b]/50 shadow-lg text-[10px] text-white -mb-0.5 mr-2 relative z-10"
                  style={{
                    backgroundColor: `rgba(8, 17, 29, ${Math.max(
                      0.45,
                      Math.min(0.95, watermarkSettings.opacity + 0.1),
                    )})`,
                  }}
                >
                  <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                    <Image src="/app-icon.png" alt="GeoPatriot" width={14} height={14} />
                  </div>
                  <span className="font-bold text-[#dcab55]">GeoPatriot</span>
                  <div className="h-3 w-px bg-white/20 mx-0.5" />
                  {/* Tombol flip cepat posisi atas / bawah */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHudPosition((prev) => (prev === "bottom" ? "top" : "bottom"));
                    }}
                    aria-label={hudPosition === "bottom" ? "Pindahkan ke atas" : "Pindahkan ke bawah"}
                    title={hudPosition === "bottom" ? "Pindahkan ke atas" : "Pindahkan ke bawah"}
                    className="p-0.5 hover:text-[#dcab55] text-zinc-400 hover:bg-white/10 rounded transition-colors"
                  >
                    <ArrowUpDownIcon size={11} />
                  </button>
                  {/* Tombol ciutkan / minimize HUD */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHudMinimized(true);
                    }}
                    aria-label="Ciutkan watermark HUD"
                    title="Ciutkan watermark HUD"
                    className="p-0.5 hover:text-[#dcab55] text-zinc-400 hover:bg-white/10 rounded transition-colors"
                  >
                    <MinimizeIcon size={11} />
                  </button>
                </div>
              )}

              {/* Card Watermark Utama (Center-Aligned, Translucent, Map di Kiri, Metadata di Kanan) */}
              <div
                onClick={() => setIsMetadataSheetOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsMetadataSheetOpen(true);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Buka pengaturan metadata watermark"
                className="w-full p-2.5 rounded-2xl backdrop-blur-md border border-[#2f6d8b]/50 text-white shadow-2xl transition-all cursor-pointer group active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5984f]"
                style={{
                  backgroundColor: `rgba(8, 17, 29, ${Math.max(
                    0.35,
                    Math.min(0.85, watermarkSettings.opacity),
                  )})`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Sisi Kiri: Map Thumbnail */}
                  {watermarkSettings.visibleFields.mapThumbnail && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#0e2035]/80 border border-[#2f6d8b]/40 shrink-0 flex items-center justify-center shadow-inner">
                      {mapThumbnailUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={mapThumbnailUrl}
                          alt="Map thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <CrosshairIcon size={18} className="text-[#c5984f] animate-pulse" />
                          <span className="text-[8px] font-mono text-[#7ec7e8] mt-0.5">GPS</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sisi Kanan: Tumpukan Teks Metadata */}
                  <div className="flex-1 min-w-0 text-left space-y-0.5">
                    {/* Baris 1: Judul / Nama Lokasi */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-sans font-bold text-white truncate">
                        {activeLocationName}
                      </span>
                      <span className="text-[9px] text-[#dcab55] font-semibold shrink-0 group-hover:underline flex items-center gap-0.5">
                        <SlidersIcon size={10} />
                        <span>Ubah</span>
                      </span>
                    </div>

                    {/* Baris 2: Alamat Lengkap */}
                    {watermarkSettings.visibleFields.address && geoAddress?.address && (
                      <p className="text-[10px] text-zinc-300 truncate">
                        {geoAddress.address}
                      </p>
                    )}

                    {/* Baris 3: Koordinat */}
                    {watermarkSettings.visibleFields.coordinate && (
                      <div className="flex items-center gap-1 font-mono text-[9px] text-[#7ec7e8] truncate">
                        <MapPinIcon size={10} className="text-[#c5984f] shrink-0" />
                        <span>
                          {activeLatitude.toFixed(5)}, {activeLongitude.toFixed(5)}
                        </span>
                      </div>
                    )}

                    {/* Baris 4: Tanggal & Jam */}
                    {(watermarkSettings.visibleFields.date || watermarkSettings.visibleFields.time) && (
                      <div className="flex items-center gap-1 text-[9px] text-zinc-400 truncate">
                        <ClockIcon size={10} className="text-[#dcab55] shrink-0" />
                        <span>{activeTimeDisplay}</span>
                      </div>
                    )}

                    {/* Baris 5: Akurasi GPS */}
                    {watermarkSettings.visibleFields.accuracy && geoCoord?.accuracy !== undefined && (
                      <div className="text-[8px] text-[#94a3b8] truncate">
                        Akurasi ±{Math.round(geoCoord.accuracy)} m
                        {geoQuality
                          ? ` (${
                              geoQuality === "excellent"
                                ? "Sangat Baik"
                                : geoQuality === "good"
                                ? "Baik"
                                : geoQuality === "fair"
                                ? "Cukup"
                                : "Buruk"
                            })`
                          : ""}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CameraViewport>
      </main>

      {/* Kontrol Kamera Adaptif: Bilah Kanan (Right Sidebar) saat Landscape, Bilah Bawah (Footer) saat Portrait */}
      {cameraStatus === "ready" && (
        isLandscape ? (
          <aside className="absolute right-0 inset-y-0 z-30 pointer-events-auto flex items-center justify-center">
            <CameraControls
              onCapture={handleCapture}
              onToggleFacingMode={toggleFacingMode}
              sessionPhotoCount={sessionPhotoCount}
              onOpenGallery={handleOpenGallery}
              isCapturing={isCapturing}
              lastPhoto={lastPhoto}
              zoom={zoom}
              zoomCapabilities={zoomCapabilities}
              zoomPresets={zoomPresets}
              onZoomChange={setZoom}
              isLandscape={true}
            />
          </aside>
        ) : (
          <footer ref={footerRef} className="absolute bottom-0 inset-x-0 z-30 pointer-events-auto">
            <CameraControls
              onCapture={handleCapture}
              onToggleFacingMode={toggleFacingMode}
              sessionPhotoCount={sessionPhotoCount}
              onOpenGallery={handleOpenGallery}
              isCapturing={isCapturing}
              lastPhoto={lastPhoto}
              zoom={zoom}
              zoomCapabilities={zoomCapabilities}
              zoomPresets={zoomPresets}
              onZoomChange={setZoom}
              isLandscape={false}
            />
          </footer>
        )
      )}

      {/* Kolom Preset Zoom Vertikal Sisi Kanan (Mode Portrait) */}
      {!isLandscape && cameraStatus === "ready" && zoomCapabilities && zoomPresets.length > 1 && (
        <ZoomControlsPill
          zoom={zoom}
          zoomCapabilities={zoomCapabilities}
          zoomPresets={zoomPresets}
          onZoomChange={setZoom}
          orientation="vertical"
          className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 z-25 pointer-events-auto"
        />
      )}

      {/* Drawer Editor Metadata & Lokasi (Phase 4) */}
      <MetadataEditorSheet
        isOpen={isMetadataSheetOpen}
        onClose={() => setIsMetadataSheetOpen(false)}
        locationMode={locationMode}
        timeMode={timeMode}
        manualLocation={manualLocation}
        manualDateTime={manualDateTime}
        customNote={customNote}
        gpsCoordinate={geoCoord}
        gpsQuality={geoQuality}
        gpsAddressInfo={geoAddress}
        onRefreshGps={refreshGps}
        onSave={(config) => {
          setLocationMode(config.locationMode);
          setTimeMode(config.timeMode);
          setManualLocation(config.manualLocation);
          setManualDateTime(config.manualDateTime);
          setCustomNote(config.customNote);
          showToast("Pengaturan metadata disimpan", "success");
        }}
        onReset={() => {
          resetToDefaults();
          showToast("Pengaturan dikembalikan ke default", "info");
        }}
      />

      {/* Drawer Galeri Sesi (Phase 9 & 10) */}
      <SessionGalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          void reloadSessionPhotos();
        }}
        activeSessionId={currentSessionId}
        onPhotoDeleted={() => {
          void reloadSessionPhotos();
        }}
      />

      {/* Drawer Pengaturan Aplikasi & Penyimpanan (Phase 13) */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          void reloadSessionPhotos();
        }}
        onSettingsChanged={() => {
          void reloadSessionPhotos();
        }}
        settingsHook={appSettings}
      />

      {/* Drawer Diagnostik Kesehatan Sistem & Panduan Izin (Phase 14) */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        diagnostics={diagnostics}
        onOpenSettings={() => {
          setIsDiagnosticsOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenManualLocation={() => {
          setIsDiagnosticsOpen(false);
          setLocationMode("manual");
          setIsMetadataSheetOpen(true);
        }}
        onRefreshGps={() => {
          void refreshGps();
        }}
      />
    </div>
  );
}
