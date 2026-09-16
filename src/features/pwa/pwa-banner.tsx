"use client";

import React, { useState } from "react";
import { usePwa } from "./use-pwa";
import { DownloadIcon, CloseIcon, AlertTriangleIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

/**
 * Komponen banner notifikasi PWA (Phase 12 / PRD #18, #19).
 * Menampilkan:
 * 1. Peringatan status saat perangkat berada di mode offline (lapangan).
 * 2. Banner ajakan instalasi aplikasi ke layar utama (Add to Home Screen) jika didukung peramban.
 */
export function PwaBanner() {
  const { isOnline, isInstallable, isStandalone, installApp } = usePwa();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  // 1. Tampilkan banner offline jika perangkat kehilangan koneksi internet
  if (!isOnline) {
    return (
      <aside
        aria-label="Status koneksi offline"
        className="w-full bg-[#1a0f05] border-b border-[#c5984f]/40 px-3 py-1.5 flex items-center justify-between gap-2 z-40 text-xs text-[#dcab55] shadow-md animate-in slide-in-from-top duration-200"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertTriangleIcon size={14} className="shrink-0 text-[#c5984f]" />
          <span className="font-semibold truncate">Mode Offline Lapangan</span>
          <span className="text-zinc-400 hidden sm:inline">— Kamera & galeri lokal tetap aktif</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0e2035] border border-[#2f6d8b]/30 text-[#7ec7e8] shrink-0">
          Local-First
        </span>
      </aside>
    );
  }

  // 2. Tampilkan banner ajakan instalasi jika didukung dan belum terpasang
  if (isInstallable && !isStandalone && !isDismissed) {
    return (
      <aside
        aria-label="Pemberitahuan instalasi aplikasi"
        className="w-full bg-[#08111d]/95 backdrop-blur-md border-b border-[#2f6d8b]/40 px-3 py-2 flex items-center justify-between gap-3 z-40 text-xs text-white shadow-xl animate-in slide-in-from-top duration-200"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#0e2035] border border-[#2f6d8b]/50 flex items-center justify-center text-[#c5984f] shrink-0">
            <DownloadIcon size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white tracking-tight truncate leading-tight">
              Pasang GeoPatriot Web
            </span>
            <span className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">
              Akses cepat tanpa browser bar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleInstall}
            isLoading={isInstalling}
            className="text-[11px] py-1 px-2.5 h-7 font-bold"
          >
            Pasang
          </Button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Tutup banner instalasi"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      </aside>
    );
  }

  return null;
}
