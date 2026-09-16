"use client";

import React, { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import {
  LayersIcon,
  MapPinIcon,
  ArchiveIcon,
  TrashIcon,
  CheckSquareIcon,
  SquareIcon,
  CheckIcon,
  RefreshCwIcon,
} from "@/components/icons";
import { useAppSettings, type UseAppSettingsReturn } from "./use-app-settings";
import type {
  WatermarkFieldVisibility,
  WatermarkPosition,
  WatermarkTemplate,
} from "@/types/watermark";

export interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: () => void;
  settingsHook?: UseAppSettingsReturn;
}

type SettingsTab = "watermark" | "location" | "storage";

/**
 * Format ukuran bytes menjadi KB atau MB yang mudah dibaca pengguna.
 */
function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drawer BottomSheet Pengaturan Aplikasi (Phase 13 / PRD #20 & workflow #15).
 * Menyediakan kontrol visual watermark, preferensi lokasi, serta indikator dan manajemen penyimpanan IndexedDB.
 */
export function SettingsSheet({
  isOpen,
  onClose,
  onSettingsChanged,
  settingsHook,
}: SettingsSheetProps) {
  const { showToast } = useToast();
  const internalSettings = useAppSettings();
  const appSettings = settingsHook ?? internalSettings;
  const {
    watermarkSettings,
    locationSettings,
    storageInfo,
    updateWatermarkSettings,
    updateLocationSettings,
    clearDownloaded,
    clearAllLocalData,
    resetToDefaults,
    refreshStorageInfo,
  } = appSettings;

  const [activeTab, setActiveTab] = useState<SettingsTab>("watermark");
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  // Refresh info penyimpanan IndexedDB setiap kali sheet dibuka
  useEffect(() => {
    if (isOpen) {
      void refreshStorageInfo();
    }
  }, [isOpen, refreshStorageInfo]);

  /**
   * Mengubah template watermark aktif.
   */
  const handleTemplateChange = async (template: WatermarkTemplate) => {
    await updateWatermarkSettings({ template });
    onSettingsChanged?.();
    showToast(`Template ${template} diaktifkan`, "success");
  };

  /**
   * Mengubah posisi panel watermark.
   */
  const handlePositionChange = async (position: WatermarkPosition) => {
    await updateWatermarkSettings({ position });
    onSettingsChanged?.();
  };

  /**
   * Toggle visibilitas salah satu field pada watermark.
   */
  const handleToggleField = async (field: keyof WatermarkFieldVisibility) => {
    const nextValue = !watermarkSettings.visibleFields[field];
    await updateWatermarkSettings({
      visibleFields: {
        ...watermarkSettings.visibleFields,
        [field]: nextValue,
      },
    });
    onSettingsChanged?.();
  };

  /**
   * Membersihkan foto yang sudah diunduh.
   */
  const handleClearDownloaded = async () => {
    setIsCleaning(true);
    const count = await clearDownloaded();
    setIsCleaning(false);
    showToast(`${count} foto yang sudah diunduh berhasil dibersihkan`, "info");
    onSettingsChanged?.();
  };

  /**
   * Eksekusi reset dan penghapusan seluruh data lokal.
   */
  const handleExecuteClearAll = async () => {
    setIsCleaning(true);
    const success = await clearAllLocalData();
    setIsCleaning(false);
    setIsConfirmClearAllOpen(false);

    if (success) {
      showToast("Seluruh data lokal & sesi berhasil dihapus.", "info");
      onSettingsChanged?.();
    } else {
      showToast("Gagal membersihkan data.", "error");
    }
  };

  /**
   * Reset konfigurasi pengaturan ke default awal.
   */
  const handleResetDefaults = async () => {
    await resetToDefaults();
    showToast("Pengaturan dikembalikan ke default awal.", "info");
    onSettingsChanged?.();
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Pengaturan GeoPatriot"
        description="Sesuaikan preferensi watermark, penyedia lokasi, dan kapasitas memori perangkat."
      >
        <div className="space-y-4">
          {/* Tab Navigation Segmented Control */}
          <div className="flex rounded-xl bg-[#08111d] p-1 border border-[#1a3c61]">
            <button
              type="button"
              onClick={() => setActiveTab("watermark")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "watermark"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayersIcon size={14} />
              <span>Watermark</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("location")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "location"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <MapPinIcon size={14} />
              <span>Lokasi & GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("storage")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "storage"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ArchiveIcon size={14} />
              <span>Penyimpanan</span>
            </button>
          </div>

          {/* Tab 1: Watermark Settings */}
          {activeTab === "watermark" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Pilihan Template */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Pilihan Template Watermark</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["default", "ringkas", "detail"] as WatermarkTemplate[]).map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => void handleTemplateChange(tmpl)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold capitalize transition-all text-center ${
                        watermarkSettings.template === tmpl
                          ? "bg-[#0e2035] border-[#c5984f] text-[#dcab55] shadow-md"
                          : "bg-[#08111d] border-[#1a3c61] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posisi & Transparansi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Posisi Panel</label>
                  <div className="flex rounded-xl bg-[#08111d] p-1 border border-[#1a3c61]">
                    <button
                      type="button"
                      onClick={() => void handlePositionChange("bottom")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        watermarkSettings.position === "bottom"
                          ? "bg-[#0e2035] text-white font-bold border border-[#2f6d8b]/50"
                          : "text-zinc-400"
                      }`}
                    >
                      Bawah
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePositionChange("top")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        watermarkSettings.position === "top"
                          ? "bg-[#0e2035] text-white font-bold border border-[#2f6d8b]/50"
                          : "text-zinc-400"
                      }`}
                    >
                      Atas
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">Opasitas</label>
                    <span className="text-xs font-mono text-[#c5984f]">
                      {Math.round(watermarkSettings.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={Math.round(watermarkSettings.opacity * 100)}
                    onChange={(e) => {
                      void updateWatermarkSettings({ opacity: Number(e.target.value) / 100 });
                      onSettingsChanged?.();
                    }}
                    className="w-full accent-[#c5984f] cursor-pointer"
                  />
                </div>
              </div>

              {/* Field yang Ditampilkan */}
              <div className="space-y-2 pt-2 border-t border-[#1a3c61]">
                <label className="text-xs font-bold text-zinc-300">
                  Visibilitas Informasi Watermark
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: "locationName", label: "Nama Lokasi" },
                    { key: "address", label: "Alamat Lengkap" },
                    { key: "coordinate", label: "Koordinat GPS" },
                    { key: "date", label: "Tanggal" },
                    { key: "time", label: "Jam & Menit" },
                    { key: "timezone", label: "Zona Waktu" },
                    { key: "gpsQuality", label: "Akurasi GPS" },
                    { key: "branding", label: "Logo & Branding" },
                  ].map((field) => {
                    const isChecked = Boolean(
                      watermarkSettings.visibleFields[field.key as keyof WatermarkFieldVisibility],
                    );
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() =>
                          void handleToggleField(field.key as keyof WatermarkFieldVisibility)
                        }
                        className="flex items-center gap-2 p-2 rounded-xl bg-[#08111d] border border-[#1a3c61] text-left hover:border-[#2f6d8b]/50 transition-colors"
                      >
                        {isChecked ? (
                          <CheckSquareIcon size={16} className="text-[#c5984f] shrink-0" />
                        ) : (
                          <SquareIcon size={16} className="text-zinc-500 shrink-0" />
                        )}
                        <span className={`text-xs ${isChecked ? "text-white" : "text-zinc-400"}`}>
                          {field.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Location & GPS Settings */}
          {activeTab === "location" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-[#08111d] border border-[#1a3c61] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Penyedia Lokasi (Provider)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#0e2035] text-[#7ec7e8] border border-[#2f6d8b]/40">
                    LocationIQ Free
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Digunakan untuk reverse geocoding nama tempat dan alamat otomatis dari koordinat GPS.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#08111d] border border-[#1a3c61]">
                  <div>
                    <p className="text-xs font-bold text-white">Mode GPS Akurasi Tinggi</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Memanfaatkan satelit GPS perangkat untuk akurasi meter terbaik
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={locationSettings.highAccuracy}
                    onClick={() =>
                      void updateLocationSettings({ highAccuracy: !locationSettings.highAccuracy })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      locationSettings.highAccuracy ? "bg-[#c5984f]" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`bg-[#08111d] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        locationSettings.highAccuracy ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#08111d] border border-[#1a3c61]">
                  <div>
                    <p className="text-xs font-bold text-white">Fallback Otomatis ke Manual</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Alihkan ke input manual saat izin GPS ditolak atau sinyal hilang
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={locationSettings.autoFallbackToManual}
                    onClick={() =>
                      void updateLocationSettings({
                        autoFallbackToManual: !locationSettings.autoFallbackToManual,
                      })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      locationSettings.autoFallbackToManual ? "bg-[#c5984f]" : "bg-zinc-700"
                    }`}
                  >
                    <div
                      className={`bg-[#08111d] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        locationSettings.autoFallbackToManual ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Storage Settings & Indicator */}
          {activeTab === "storage" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Kartu Indikator Kapasitas Penyimpanan */}
              <div className="p-4 rounded-2xl bg-[#08111d] border border-[#1a3c61] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Status Penyimpanan Perangkat</span>
                  <span className="font-mono text-xs text-[#dcab55]">
                    {storageInfo.isEstimateSupported
                      ? `${formatBytes(storageInfo.usageBytes)} / ${formatBytes(
                          storageInfo.quotaBytes,
                        )}`
                      : `${storageInfo.photoCount} foto tersimpan`}
                  </span>
                </div>

                {/* Progress Bar Penyimpanan */}
                <div className="w-full h-2 rounded-full bg-[#0e2035] border border-[#2f6d8b]/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c5984f] to-[#7ec7e8] transition-all duration-300"
                    style={{ width: `${Math.max(2, storageInfo.percentUsed)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-zinc-400 border-t border-[#1a3c61]/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#c5984f]" />
                    <span>Total Foto: <strong className="text-white">{storageInfo.photoCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Diunduh: <strong className="text-white">{storageInfo.downloadedPhotoCount}</strong></span>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Pembersihan */}
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  onClick={handleClearDownloaded}
                  disabled={isCleaning || storageInfo.downloadedPhotoCount === 0}
                  className="w-full justify-center text-xs py-2.5 border border-[#2f6d8b]/40"
                  leftIcon={<CheckIcon size={14} />}
                >
                  Bersihkan Foto yang Sudah Diunduh ({storageInfo.downloadedPhotoCount})
                </Button>

                <Button
                  variant="danger"
                  onClick={() => setIsConfirmClearAllOpen(true)}
                  disabled={isCleaning}
                  className="w-full justify-center text-xs py-2.5"
                  leftIcon={<TrashIcon size={14} />}
                >
                  Hapus Seluruh Data & Sesi Lokal
                </Button>
              </div>
            </div>
          )}

          {/* Footer Reset Defaults */}
          <div className="pt-3 border-t border-[#1a3c61] flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCwIcon size={12} />
              <span>Kembalikan Default</span>
            </button>

            <Button variant="primary" size="sm" onClick={onClose} className="px-4 py-1.5 text-xs font-bold">
              Selesai
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Dialog Konfirmasi Hapus Seluruh Data Lokal (Rules #8.7, #8.8) */}
      <Dialog
        isOpen={isConfirmClearAllOpen}
        onClose={() => setIsConfirmClearAllOpen(false)}
        title="Hapus Seluruh Data Lokal?"
        description="Tindakan ini akan mengosongkan seluruh foto dan sesi yang tersimpan di browser ini. Data yang belum diunduh akan hilang secara permanen."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmClearAllOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleExecuteClearAll}
              isLoading={isCleaning}
            >
              Hapus Semua Data
            </Button>
          </>
        }
      />
    </>
  );
}
