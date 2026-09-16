"use client";

import React from "react";
import { EditIcon, MapPinIcon } from "@/components/icons";
import type { GpsExplicitState } from "@/types/diagnostics";

export interface GpsFallbackAlertProps {
  gpsState: GpsExplicitState;
  gpsAccuracy?: number;
  locationMode: "gps" | "manual";
  onSwitchToManual: () => void;
}

/**
 * Banner Peringatan Sinyal GPS & Tawaran Fallback Mode Manual (Phase 14 / workflow #6 & #16).
 * Membantu surveyor lapangan beralih seketika ke lokasi manual bila GPS terkendala.
 */
export function GpsFallbackAlert({
  gpsState,
  gpsAccuracy,
  locationMode,
  onSwitchToManual,
}: GpsFallbackAlertProps) {
  // Hanya tampil saat pengguna berada pada mode GPS dan terjadi kendala
  if (locationMode !== "gps") return null;

  // Saat izin GPS ditolak, notifikasi sudah diwakili oleh chip merah di header atas.
  // Banner memanjang di-skip agar tidak menutupi layar kamera (user feedback).
  const isDenied = gpsState === "gps_denied";
  if (isDenied) return null;

  const isPoor = gpsState === "gps_ready" && (gpsAccuracy ?? 0) > 50;
  if (!isPoor) return null;

  return (
    <div className="w-full px-3 py-1.5 bg-[#08111d]/90 border-b border-[#2f6d8b]/40 backdrop-blur-md flex items-center justify-between gap-2 shadow text-white">
      <div className="flex items-center gap-1.5 min-w-0">
        <MapPinIcon
          size={14}
          className={isDenied ? "text-rose-400 shrink-0" : "text-amber-400 shrink-0"}
        />
        <p className="text-[10px] text-zinc-300 font-medium truncate">
          {isDenied
            ? "Izin GPS ditolak oleh browser."
            : `Akurasi sinyal GPS rendah (±${Math.round(gpsAccuracy ?? 0)}m). Coba pindah ke area terbuka.`}
        </p>
      </div>

      <button
        type="button"
        onClick={onSwitchToManual}
        className="shrink-0 px-2 py-0.5 rounded-md bg-[#0e2035] hover:bg-[#1a3c61] border border-[#c5984f]/60 text-[#dcab55] hover:text-white text-[10px] font-semibold transition-all flex items-center gap-1 active:scale-95"
      >
        <EditIcon size={10} />
        <span>{isDenied ? "Pilih Manual" : "Gunakan Manual"}</span>
      </button>
    </div>
  );
}
