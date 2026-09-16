"use client";

import React, { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import {
  MapPinIcon,
  ClockIcon,
  CrosshairIcon,
  CheckIcon,
  RefreshCwIcon,
  EditIcon,
} from "@/components/icons";
import type {
  GeoCoordinate,
  GpsQuality,
  LocationSource,
  ManualLocationInput,
} from "@/types/location";
import type { TimeMode } from "@/types/metadata";
import { getLocalTimezone } from "./use-metadata-config";
import { formatCoordinatePair, parseCoordinatePair } from "./parse-coordinate-pair";

export interface MetadataEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locationMode: LocationSource;
  timeMode: TimeMode;
  manualLocation: ManualLocationInput;
  manualDateTime: string;
  customNote: string;
  gpsCoordinate?: GeoCoordinate | null;
  gpsQuality?: GpsQuality | null;
  gpsAddressInfo?: { locationName?: string; address?: string } | null;
  onRefreshGps?: () => void;
  onSave: (config: {
    locationMode: LocationSource;
    timeMode: TimeMode;
    manualLocation: ManualLocationInput;
    manualDateTime: string;
    customNote: string;
  }) => void;
  onReset: () => void;
}

/**
 * Komponen form isi editor metadata (mount fresh saat drawer dibuka, bebas efek setState sinkron).
 */
function MetadataEditorContent({
  onClose,
  locationMode,
  timeMode,
  manualLocation,
  manualDateTime,
  customNote,
  gpsCoordinate,
  gpsQuality,
  gpsAddressInfo,
  onRefreshGps,
  onSave,
  onReset,
}: Omit<MetadataEditorSheetProps, "isOpen">) {
  // Local form state diinisialisasi langsung dari props saat mount
  const [draftLocationMode, setDraftLocationMode] = useState<LocationSource>(locationMode);
  const [draftTimeMode, setDraftTimeMode] = useState<TimeMode>(timeMode);
  const [draftManualLoc, setDraftManualLoc] = useState<ManualLocationInput>(manualLocation);
  const [draftDateTime, setDraftDateTime] = useState<string>(manualDateTime);
  const [draftNote, setDraftNote] = useState<string>(customNote);
  // Field teks gabungan untuk koordinat, agar pengguna bisa paste langsung dari
  // Google Maps (format "-9.620308,124.879609") tanpa harus memisah manual.
  const [coordinateText, setCoordinateText] = useState<string>(
    formatCoordinatePair(manualLocation.latitude, manualLocation.longitude),
  );
  const [coordinateError, setCoordinateError] = useState<string | null>(null);

  /**
   * Menangani perubahan pada field koordinat gabungan: parse, lalu update
   * draftManualLoc bila valid. Nilai draft terakhir dipertahankan bila format
   * belum lengkap/tidak valid, supaya user tetap bisa mengetik tanpa terputus.
   */
  const handleCoordinateTextChange = (value: string) => {
    setCoordinateText(value);
    const parsed = parseCoordinatePair(value);
    if (parsed) {
      setCoordinateError(null);
      setDraftManualLoc((prev) => ({ ...prev, ...parsed }));
    } else {
      setCoordinateError("Format tidak dikenali. Gunakan: -9.620308,124.879609");
    }
  };

  /**
   * Mengisi form manual menggunakan pembacaan GPS saat ini.
   */
  const handleCopyFromGps = () => {
    if (gpsCoordinate) {
      const latitude = Number(gpsCoordinate.latitude.toFixed(6));
      const longitude = Number(gpsCoordinate.longitude.toFixed(6));
      setDraftManualLoc({
        latitude,
        longitude,
        locationName: gpsAddressInfo?.locationName || "Titik Koordinat Lapangan",
        address: gpsAddressInfo?.address || "",
      });
      setCoordinateText(formatCoordinatePair(latitude, longitude));
      setCoordinateError(null);
      setDraftLocationMode("manual");
    }
  };

  /**
   * Menyimpan perubahan ke state aplikasi utama dan menutup drawer.
   */
  const handleSave = () => {
    onSave({
      locationMode: draftLocationMode,
      timeMode: draftTimeMode,
      manualLocation: draftManualLoc,
      manualDateTime: draftDateTime,
      customNote: draftNote,
    });
    onClose();
  };

  /**
   * Mereset form ke nilai standar.
   */
  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title="Pengaturan Metadata & Lokasi"
      description="Konfigurasikan sumber koordinat, waktu, dan catatan lapangan untuk watermark foto."
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="md"
            onClick={handleReset}
            className="flex-1 text-xs text-zinc-400 hover:text-white"
          >
            Reset Default
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            leftIcon={<CheckIcon size={18} />}
            className="flex-2 font-bold"
          >
            Simpan Pengaturan
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-2">
        {/* Section 1: Mode Lokasi */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcab55] mb-2">
            1. Sumber Lokasi
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#08111d] rounded-xl border border-[#1a3c61]">
            <button
              type="button"
              onClick={() => setDraftLocationMode("gps")}
              className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                draftLocationMode === "gps"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <CrosshairIcon size={16} />
              GPS Otomatis
            </button>
            <button
              type="button"
              onClick={() => setDraftLocationMode("manual")}
              className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                draftLocationMode === "manual"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <EditIcon size={16} />
              Manual Koordinat
            </button>
          </div>

          {/* Info Status GPS saat mode GPS aktif */}
          {draftLocationMode === "gps" && (
            <div className="mt-3 p-3 rounded-xl bg-[#08111d]/70 border border-[#2f6d8b]/30 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <MapPinIcon size={14} className="text-[#c5984f]" /> Sinyal GPS:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {gpsCoordinate
                      ? `Akurasi ±${Math.round(gpsCoordinate.accuracy ?? 0)} m (${gpsQuality ?? "Aktif"})`
                      : "Menunggu sinyal..."}
                  </span>
                  {onRefreshGps && (
                    <button
                      type="button"
                      onClick={onRefreshGps}
                      title="Perbarui GPS"
                      aria-label="Perbarui sinyal GPS sekarang"
                      className="p-1 rounded bg-[#0e2035] hover:bg-[#1a3c61] text-[#dcab55] transition-colors"
                    >
                      <RefreshCwIcon size={12} />
                    </button>
                  )}
                </div>
              </div>
              {gpsCoordinate && (
                <p className="font-mono text-[11px] text-[#7ec7e8] mt-1">
                  {gpsCoordinate.latitude.toFixed(6)}, {gpsCoordinate.longitude.toFixed(6)}
                </p>
              )}
              {gpsAddressInfo?.address && (
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                  {gpsAddressInfo.address}
                </p>
              )}
            </div>
          )}

          {/* Formulir Input Manual jika mode manual dipilih */}
          {draftLocationMode === "manual" && (
            <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-[#08111d]/90 border border-[#1a3c61]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-400">Input Manual:</span>
                {gpsCoordinate && (
                  <button
                    type="button"
                    onClick={handleCopyFromGps}
                    className="text-[11px] font-semibold text-[#dcab55] hover:underline flex items-center gap-1"
                  >
                    <RefreshCwIcon size={12} /> Salin dari GPS saat ini
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Koordinat (Salin dari Google Maps)
                </label>
                <input
                  type="text"
                  inputMode="text"
                  value={coordinateText}
                  onChange={(e) => handleCoordinateTextChange(e.target.value)}
                  aria-invalid={coordinateError !== null}
                  className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#0e2035] border text-white font-mono text-xs focus:outline-none ${
                    coordinateError
                      ? "border-rose-500/60 focus:border-rose-500"
                      : "border-[#2f6d8b]/40 focus:border-[#c5984f]"
                  }`}
                  placeholder="-9.620308, 124.879609"
                />
                {coordinateError && (
                  <p className="text-[10px] text-rose-400 mt-1">{coordinateError}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Nama Lokasi / Objek Lapangan
                </label>
                <input
                  type="text"
                  value={draftManualLoc.locationName}
                  onChange={(e) =>
                    setDraftManualLoc((prev) => ({
                      ...prev,
                      locationName: e.target.value,
                    }))
                  }
                  maxLength={100}
                  className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#0e2035] border border-[#2f6d8b]/40 text-white text-xs focus:border-[#c5984f] focus:outline-none"
                  placeholder="Mis. Posko Pengamatan Blok B"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">
                  Alamat Lengkap / Keterangan Wilayah
                </label>
                <input
                  type="text"
                  value={draftManualLoc.address ?? ""}
                  onChange={(e) =>
                    setDraftManualLoc((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  maxLength={120}
                  className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#0e2035] border border-[#2f6d8b]/40 text-white text-xs focus:border-[#c5984f] focus:outline-none"
                  placeholder="Mis. Desa Sukamaju, Kec. Sepaku"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Mode Waktu */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcab55] mb-2">
            2. Sumber Waktu
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#08111d] rounded-xl border border-[#1a3c61]">
            <button
              type="button"
              onClick={() => setDraftTimeMode("auto")}
              className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                draftTimeMode === "auto"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ClockIcon size={16} />
              Waktu Otomatis
            </button>
            <button
              type="button"
              onClick={() => setDraftTimeMode("manual")}
              className={`min-h-[44px] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                draftTimeMode === "manual"
                  ? "bg-[#c5984f] text-[#08111d] shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <EditIcon size={16} />
              Manual Waktu
            </button>
          </div>

          {draftTimeMode === "auto" ? (
            <div className="mt-2.5 p-3 rounded-xl bg-[#08111d]/70 border border-[#2f6d8b]/30 text-xs text-zinc-300 flex items-center justify-between">
              <span className="text-zinc-400">Timezone aktif:</span>
              <span className="font-semibold text-[#dcab55]">{getLocalTimezone()}</span>
            </div>
          ) : (
            <div className="mt-3 p-3.5 rounded-xl bg-[#08111d]/90 border border-[#1a3c61]">
              <label className="block text-[10px] text-zinc-400 mb-1">
                Pilih Tanggal & Waktu Manual:
              </label>
              <input
                type="datetime-local"
                value={draftDateTime}
                onChange={(e) => setDraftDateTime(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-[#0e2035] border border-[#2f6d8b]/40 text-white font-mono text-xs focus:border-[#c5984f] focus:outline-none"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Waktu ini akan dibekukan pada watermark foto saat tombol shutter ditekan.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Catatan Lapangan Opsional */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#dcab55] mb-2">
            3. Catatan Lapangan (Opsional)
          </label>
          <input
            type="text"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Mis. Pengecekan Patok Batas Tahap II"
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#08111d] border border-[#1a3c61] text-white text-xs focus:border-[#c5984f] focus:outline-none"
            maxLength={80}
          />
          <p className="text-[10px] text-zinc-400 mt-1">
            Catatan singkat yang akan disematkan di baris bawah panel watermark.
          </p>
        </div>

        {/* Section 4: Live Watermark Preview */}
        <div className="p-3.5 rounded-xl bg-[#0e2035] border border-[#2f6d8b]/40 text-xs shadow-inner">
          <p className="text-[10px] font-bold text-[#dcab55] uppercase tracking-wider mb-2">
            Preview Teks Watermark yang Akan Muncul:
          </p>
          <div className="space-y-1 font-mono text-[11px] text-zinc-300">
            <p className="font-sans font-bold text-white">
              {draftLocationMode === "manual"
                ? draftManualLoc.locationName || "Lokasi Manual"
                : gpsAddressInfo?.locationName || "Titik GPS Terdeteksi"}
            </p>
            <p className="text-zinc-400 text-[10px] line-clamp-1">
              {draftLocationMode === "manual"
                ? draftManualLoc.address || "Alamat tidak diisi"
                : gpsAddressInfo?.address || "Mencari alamat..."}
            </p>
            <p className="text-[#7ec7e8]">
              {draftLocationMode === "manual"
                ? `${draftManualLoc.latitude.toFixed(6)}, ${draftManualLoc.longitude.toFixed(6)}`
                : gpsCoordinate
                  ? `${gpsCoordinate.latitude.toFixed(6)}, ${gpsCoordinate.longitude.toFixed(6)}`
                  : "0.000000, 0.000000"}
            </p>
            <p className="text-zinc-400 text-[10px]">
              {draftTimeMode === "manual" ? draftDateTime.replace("T", " ") : "Waktu Saat Shutter"}{" "}
              • {getLocalTimezone()}
            </p>
            {draftNote.trim() && (
              <p className="text-[#eac47a] text-[10px]">&ldquo;{draftNote.trim()}&rdquo;</p>
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

/**
 * BottomSheet editor metadata lokasi dan waktu (Phase 4).
 * Memungkinkan pengguna beralih antara GPS live vs input manual dan mengatur catatan dokumentasi.
 */
export function MetadataEditorSheet({ isOpen, ...props }: MetadataEditorSheetProps) {
  if (!isOpen) return null;
  return <MetadataEditorContent {...props} />;
}
