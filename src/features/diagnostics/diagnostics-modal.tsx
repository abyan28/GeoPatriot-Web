"use client";

import React from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
  CameraIcon,
  MapPinIcon,
  ArchiveIcon,
  AlertTriangleIcon,
  CheckIcon,
  InfoIcon,
  RefreshCwIcon,
  SlidersIcon,
  EditIcon,
} from "@/components/icons";
import type { SystemHealthDiagnostics } from "@/types/diagnostics";

export interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: SystemHealthDiagnostics;
  onOpenSettings?: () => void;
  onOpenManualLocation?: () => void;
  onRefreshGps?: () => void;
}

/**
 * Format bytes ke MB atau KB.
 */
function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drawer Diagnostik Kesehatan Sistem & Panduan Izin Lapangan (Phase 14 / workflow #16).
 * Memaparkan status 6 subsistem (Kamera, Zoom, GPS, Geocoding, Peta, Storage) secara transparan.
 */
export function DiagnosticsModal({
  isOpen,
  onClose,
  diagnostics,
  onOpenSettings,
  onOpenManualLocation,
  onRefreshGps,
}: DiagnosticsModalProps) {
  const {
    camera,
    cameraZoom,
    gps,
    geocoding,
    map,
    storage,
    storagePercentUsed,
    storageUsageBytes,
    storageQuotaBytes,
    gpsAccuracy,
    hasErrors,
    hasWarnings,
    recommendedAction,
  } = diagnostics;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Diagnostik Sistem Lapangan"
      description="Status operasional subsistem kamera, sensor GPS, konektivitas, dan memori perangkat."
    >
      <div className="space-y-4 text-xs text-zinc-300 pb-2">
        {/* Banner Status Keseluruhan */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
            hasErrors
              ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
              : hasWarnings
                ? "bg-amber-950/40 border-amber-800/60 text-amber-200"
                : "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              hasErrors
                ? "bg-rose-900/60 text-rose-400"
                : hasWarnings
                  ? "bg-amber-900/60 text-amber-400"
                  : "bg-emerald-900/60 text-emerald-400"
            }`}
          >
            {hasErrors ? (
              <AlertTriangleIcon size={18} />
            ) : hasWarnings ? (
              <InfoIcon size={18} />
            ) : (
              <CheckIcon size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm tracking-wide">
              {hasErrors
                ? "Kendala Terdeteksi pada Subsistem"
                : hasWarnings
                  ? "Sistem Berfungsi dengan Catatan"
                  : "Semua Subsistem Beroperasi Optimal"}
            </h3>
            {recommendedAction && (
              <p className="text-[11px] mt-1 opacity-90 leading-relaxed font-medium">
                {recommendedAction}
              </p>
            )}
          </div>
        </div>

        {/* Grid Kartu 6 Subsistem Eksplisit */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Subsistem Kamera */}
          <div className="p-3 rounded-xl bg-[#0e2035]/90 border border-[#1a3c61] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400 text-[11px] flex items-center gap-1">
                <CameraIcon size={14} className="text-[#c5984f]" /> Kamera
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  camera === "camera_ready"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                    : camera === "camera_requesting"
                      ? "bg-sky-950 text-sky-400 border border-sky-800/60 animate-pulse"
                      : "bg-rose-950 text-rose-400 border border-rose-800/60"
                }`}
              >
                {camera === "camera_ready"
                  ? "Siap"
                  : camera === "camera_requesting"
                    ? "Meminta Izin"
                    : camera === "camera_denied"
                      ? "Izin Ditolak"
                      : "Kendala"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">
              State: {camera}
            </p>
          </div>

          {/* 2. Subsistem Zoom Kamera */}
          <div className="p-3 rounded-xl bg-[#0e2035]/90 border border-[#1a3c61] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400 text-[11px] flex items-center gap-1">
                <SlidersIcon size={14} className="text-[#dcab55]" /> Zoom Lensa
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cameraZoom === "camera_zoom_supported"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {cameraZoom === "camera_zoom_supported" ? "Didukung" : "Standar (1x)"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">
              State: {cameraZoom}
            </p>
          </div>

          {/* 3. Subsistem GPS Lapangan */}
          <div className="p-3 rounded-xl bg-[#0e2035]/90 border border-[#1a3c61] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400 text-[11px] flex items-center gap-1">
                <MapPinIcon size={14} className="text-[#c5984f]" /> Sinyal GPS
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  gps === "gps_ready"
                    ? (gpsAccuracy ?? 999) <= 15
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                      : "bg-amber-950 text-amber-400 border border-amber-800/60"
                    : gps === "gps_searching"
                      ? "bg-sky-950 text-sky-400 border border-sky-800/60 animate-pulse"
                      : "bg-rose-950 text-rose-400 border border-rose-800/60"
                }`}
              >
                {gps === "gps_ready"
                  ? `Akurat ±${Math.round(gpsAccuracy ?? 0)}m`
                  : gps === "gps_searching"
                    ? "Mencari Sinyal"
                    : gps === "gps_denied"
                      ? "Ditolak"
                      : "Tidak Aktif"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">
              State: {gps}
            </p>
          </div>

          {/* 4. Subsistem Reverse Geocoding */}
          <div className="p-3 rounded-xl bg-[#0e2035]/90 border border-[#1a3c61] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400 text-[11px]">Geocoding Alamat</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  geocoding === "geocoding_success"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                    : geocoding === "geocoding_loading"
                      ? "bg-sky-950 text-sky-400 border border-sky-800/60"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {geocoding === "geocoding_success"
                  ? "Tersedia"
                  : geocoding === "geocoding_loading"
                    ? "Memuat..."
                    : "Fallback Koordinat"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">
              State: {geocoding}
            </p>
          </div>

          {/* 5. Subsistem Peta / Peta Mini */}
          <div className="p-3 rounded-xl bg-[#0e2035]/90 border border-[#1a3c61] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400 text-[11px]">Peta / Tiles</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  map === "map_success"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {map === "map_success" ? "Online" : "Mode Offline"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">
              State: {map}
            </p>
          </div>

          {/* 6. Subsistem Memori Penyimpanan */}
          <div className="p-3 rounded-xl bg-[#0e2035]/90 border border-[#1a3c61] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400 text-[11px] flex items-center gap-1">
                <ArchiveIcon size={14} className="text-[#2f6d8b]" /> Penyimpanan
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  storage === "storage_ok"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                    : storage === "storage_warning"
                      ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                      : "bg-rose-950 text-rose-400 border border-rose-800/60"
                }`}
              >
                {storagePercentUsed}% Terpakai
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">
              {formatSize(storageUsageBytes)} / {formatSize(storageQuotaBytes)}
            </p>
          </div>
        </div>

        {/* Panduan Izin Lapangan jika Kamera atau GPS Ditolak */}
        {(camera === "camera_denied" || gps === "gps_denied") && (
          <div className="p-4 rounded-xl bg-[#08111d] border border-amber-500/30 text-zinc-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <InfoIcon size={16} />
              <span>Panduan Mengaktifkan Izin Browser:</span>
            </div>
            <div className="space-y-1 text-[11px] text-zinc-300 leading-relaxed">
              <p>
                <strong>Android Chrome:</strong> Ketuk ikon gembok/setelan di kiri bilah URL &rarr;{" "}
                <strong>Izin</strong> &rarr; Izinkan Kamera & Lokasi &rarr; Muat Ulang Halaman.
              </p>
              <p>
                <strong>iOS Safari:</strong> Buka <strong>Pengaturan iPhone</strong> &rarr;{" "}
                <strong>Safari</strong> &rarr; <strong>Kamera / Lokasi</strong> &rarr; Pilih{" "}
                <strong>Izinkan</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Tombol Aksi Cepat / Recovery */}
        <div className="pt-2 flex items-center gap-2">
          {gps === "gps_denied" && onOpenManualLocation && (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => {
                onClose();
                onOpenManualLocation();
              }}
              leftIcon={<EditIcon size={14} />}
            >
              Ganti ke Lokasi Manual
            </Button>
          )}

          {gps === "gps_searching" && onRefreshGps && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onRefreshGps}
              leftIcon={<RefreshCwIcon size={14} />}
            >
              Cari Ulang Sinyal
            </Button>
          )}

          {onOpenSettings && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              leftIcon={<SlidersIcon size={14} />}
            >
              Buka Pengaturan
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
