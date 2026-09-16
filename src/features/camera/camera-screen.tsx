"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useCamera } from "./use-camera";
import { getCameraCurrentZoom } from "@/lib/browser/camera";
import { CameraViewport } from "./camera-viewport";
import { CameraControls } from "./camera-controls";
import { useCapturePipeline } from "./use-capture-pipeline";
import { SessionGalleryDrawer } from "@/features/sessions";
import { useGeolocation } from "@/features/location";
import { useMetadataConfig, MetadataEditorSheet, getLocalTimezone } from "@/features/metadata";
import { useAppSettings, SettingsSheet } from "@/features/settings";
import {
  useSystemDiagnostics,
  DiagnosticsModal,
  StorageWarningBanner,
  GpsFallbackAlert,
} from "@/features/diagnostics";
import { StatusChip, GpsQualityChip } from "@/components/ui/StatusChip";
import { EditIcon, MapPinIcon, ClockIcon, SlidersIcon, SettingsIcon } from "@/components/icons";
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
    status: geoStatus,
    coordinate: geoCoord,
    quality: geoQuality,
    addressInfo: geoAddress,
    mapThumbnailUrl,
    refresh: refreshGps,
  } = useGeolocation({
    autoStart: true,
    resolveAddress: true,
    resolveMapThumbnail: watermarkSettings.visibleFields.mapThumbnail,
  });

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
        gpsAddressInfo: geoAddress,
        // Baca zoom aktual dari hardware track (bukan React state UI) tepat di
        // detik shutter, agar tidak stale terhadap gestur pinch yang baru
        // selesai (audit finding FINDING-05).
        zoom: getCameraCurrentZoom(cameraStream),
      }),
    mapThumbnailUrl,
  });

  const { showToast } = useToast();
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isMetadataSheetOpen, setIsMetadataSheetOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [liveClock, setLiveClock] = useState<string>("");

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

  // Koordinat & alamat aktif untuk ditampilkan pada Live HUD
  const activeLatitude =
    locationMode === "gps" && geoCoord ? geoCoord.latitude : manualLocation.latitude;
  const activeLongitude =
    locationMode === "gps" && geoCoord ? geoCoord.longitude : manualLocation.longitude;
  const activeLocationName =
    locationMode === "gps"
      ? geoAddress?.locationName || (geoCoord ? "Koordinat GPS Lapangan" : "Mencari Lokasi...")
      : manualLocation.locationName || "Lokasi Manual";
  const activeAddress = locationMode === "gps" ? geoAddress?.address : manualLocation.address;
  const activeTimeDisplay = timeMode === "auto" ? liveClock : manualDateTime.replace("T", " ");

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#08111d] flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Top Header Bar: Branding & GPS Status Chip (Clickable) */}
      <header className="absolute top-0 inset-x-0 z-30 pt-4 pb-3 px-4 bg-gradient-to-b from-[#08111d]/95 via-[#08111d]/60 to-transparent flex items-center justify-between pointer-events-none">
        {/* Branding Logo: Ketuk untuk membuka Diagnostik Kesehatan Sistem (Phase 14) */}
        <button
          type="button"
          onClick={() => setIsDiagnosticsOpen(true)}
          aria-label="Buka Diagnostik Kesehatan Sistem"
          title="Diagnostik Kesehatan Sistem"
          className="pointer-events-auto flex items-center gap-2.5 text-left active:scale-95 transition-transform group"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-[#c5984f]/60 bg-[#08111d] flex items-center justify-center shrink-0">
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
            <span className="text-sm font-black text-white tracking-wide leading-tight drop-shadow-md group-hover:text-[#dcab55] transition-colors">
              GeoPatriot
            </span>
            <span className="text-[10px] font-semibold text-[#dcab55] tracking-tight leading-none drop-shadow">
              GPS Camera
            </span>
          </div>
        </button>

        {/* GPS / Manual Status Chip & Tombol Pengaturan Cepat (Phase 13) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {locationMode === "manual" ? (
            <StatusChip
              label="Mode Manual"
              subLabel="Koordinat Tetap"
              tone="amber"
              icon={<EditIcon size={12} />}
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Mode lokasi manual. Ketuk untuk ubah koordinat."
              className="cursor-pointer active:scale-95 transition-transform"
            />
          ) : geoStatus === "ready" && geoCoord ? (
            <GpsQualityChip
              quality={geoQuality ?? "good"}
              accuracy={geoCoord.accuracy}
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Status kualitas GPS. Ketuk untuk pengaturan metadata."
              className="cursor-pointer active:scale-95 transition-transform"
            />
          ) : geoStatus === "searching" ? (
            <StatusChip
              label="Mencari GPS..."
              tone="sky"
              active
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Sedang mencari sinyal GPS. Ketuk untuk opsi manual."
              className="cursor-pointer active:scale-95 transition-transform"
            />
          ) : geoStatus === "denied" ? (
            <StatusChip
              label="GPS Ditolak"
              subLabel="Ketuk ganti Manual"
              tone="rose"
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="Izin GPS ditolak. Ketuk untuk beralih ke input manual."
              className="cursor-pointer active:scale-95 transition-transform"
            />
          ) : (
            <StatusChip
              label="GPS Offline"
              subLabel="Gunakan Manual"
              tone="zinc"
              onClick={() => setIsMetadataSheetOpen(true)}
              role="button"
              aria-label="GPS tidak tersedia. Ketuk untuk input manual."
              className="cursor-pointer active:scale-95 transition-transform"
            />
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Buka Pengaturan Aplikasi"
            title="Pengaturan Aplikasi"
            className="w-11 h-11 rounded-xl bg-[#08111d]/90 hover:bg-[#0e2035] border border-[#2f6d8b]/50 text-zinc-300 hover:text-white flex items-center justify-center transition-all shadow-md active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#c5984f]"
          >
            <SettingsIcon size={16} className="text-[#dcab55]" />
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
          {/* Watermark Live HUD Overlay (Interaktif & Real-time) */}
          <div className="absolute bottom-4 inset-x-3 pointer-events-auto">
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
              className="p-3 rounded-2xl bg-[#08111d]/85 hover:bg-[#0e2035]/95 backdrop-blur-md border border-[#2f6d8b]/40 text-white shadow-2xl transition-all cursor-pointer group active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5984f]"
            >
              <div className="flex items-center justify-between border-b border-[#1a3c61]/80 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#c5984f] shadow-[0_0_8px_rgba(197,152,79,0.8)]" />
                  <span className="text-xs font-bold text-white tracking-wide">GeoPatriot Web</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0e2035] border border-[#2f6d8b]/30 text-[#7ec7e8] font-medium">
                    {locationMode === "gps" ? "GPS Live" : "Manual"}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-[#dcab55] font-semibold group-hover:underline">
                  <SlidersIcon size={12} />
                  <span>Ubah</span>
                </div>
              </div>

              {/* Detail Lokasi & Koordinat */}
              <div className="space-y-0.5 font-mono text-[11px] text-zinc-300">
                <p className="font-sans font-semibold text-white text-xs line-clamp-1">
                  {activeLocationName}
                </p>
                {activeAddress && (
                  <p className="text-[10px] text-zinc-400 font-sans line-clamp-1">
                    {activeAddress}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-[#7ec7e8] pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPinIcon size={12} className="text-[#c5984f]" />
                    {activeLatitude.toFixed(6)}, {activeLongitude.toFixed(6)}
                  </span>
                  {locationMode === "gps" && geoCoord?.accuracy !== undefined && (
                    <span className="text-zinc-400">±{Math.round(geoCoord.accuracy)}m</span>
                  )}
                </div>

                {/* Waktu & Timezone */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <ClockIcon size={12} className="text-[#dcab55]" />
                    {activeTimeDisplay}
                  </span>
                  <span className="text-[#2f6d8b] font-medium">{getLocalTimezone()}</span>
                </div>

                {/* Catatan Lapangan Opsional */}
                {customNote.trim() && (
                  <p className="text-[10px] text-[#eac47a] font-sans italic pt-1 line-clamp-1">
                    &ldquo;{customNote.trim()}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </CameraViewport>
      </main>

      {/* Bottom Controls (Thumb Zone) */}
      {cameraStatus === "ready" && (
        <footer className="absolute bottom-0 inset-x-0 z-30 pointer-events-auto">
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
          />
        </footer>
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
