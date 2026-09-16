"use client";

import React from "react";
import { AlertTriangleIcon, ArchiveIcon } from "@/components/icons";
import type { StorageExplicitState } from "@/types/diagnostics";

export interface StorageWarningBannerProps {
  storageState: StorageExplicitState;
  percentUsed: number;
  onOpenSettings: () => void;
}

/**
 * Banner Peringatan Kapasitas Penyimpanan Lokal (Phase 14 / PRD #22 & Rules #10.5).
 * Ditampilkan saat memori IndexedDB browser mencapai tingkat warning (>=80%) atau full (>=95%).
 */
export function StorageWarningBanner({
  storageState,
  percentUsed,
  onOpenSettings,
}: StorageWarningBannerProps) {
  if (storageState === "storage_ok") return null;

  const isFull = storageState === "storage_full";

  return (
    <div
      role="alert"
      className={`w-full px-3 py-2 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md transition-all ${
        isFull
          ? "bg-rose-950/95 border-b border-rose-700 text-white"
          : "bg-amber-950/90 border-b border-amber-600/80 text-amber-100"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isFull ? "bg-rose-800 text-rose-200" : "bg-amber-800/80 text-amber-200"
          }`}
        >
          <AlertTriangleIcon size={14} />
        </div>
        <p className="text-[11px] font-medium leading-tight truncate">
          {isFull
            ? `Penyimpanan Penuh (${percentUsed}%)! Segera bersihkan foto.`
            : `Penyimpanan ${percentUsed}% terpakai. Disarankan unduh ZIP.`}
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide transition-transform active:scale-95 flex items-center gap-1 shadow ${
          isFull
            ? "bg-white text-rose-950 hover:bg-rose-100"
            : "bg-[#dcab55] text-[#08111d] hover:bg-[#eac47a]"
        }`}
      >
        <ArchiveIcon size={12} />
        <span>Kelola</span>
      </button>
    </div>
  );
}
