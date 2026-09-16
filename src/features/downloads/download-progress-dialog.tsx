"use client";

import React, { useEffect } from "react";
import {
  ArchiveIcon,
  DownloadIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CloseIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import type { DownloadProgressState } from "./use-download-manager";

export interface DownloadProgressDialogProps {
  state: DownloadProgressState;
  onClose: () => void;
}

/**
 * Memformat ukuran byte menjadi representasi KB / MB yang ramah dibaca pengguna.
 */
function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Dialog visual progres unduhan foto & berkas ZIP (Phase 11 / PRD #15).
 * Menampilkan status proses, persentase live, estimasi ukuran berkas,
 * serta memastikan pengguna mengetahui bahwa foto lokal aman saat terjadi kendala (Rules #10.5).
 */
export function DownloadProgressDialog({ state, onClose }: DownloadProgressDialogProps) {
  const {
    isOpen,
    phase,
    percent,
    currentCount,
    totalCount,
    currentFilename,
    targetFilename,
    fileSizeBytes,
    errorMessage,
  } = state;

  // Tutup dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && (phase === "completed" || phase === "error")) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, phase, onClose]);

  if (!isOpen) return null;

  const isFinished = phase === "completed" || phase === "error";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={isFinished ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-progress-title"
    >
      <div
        className="w-full max-w-sm bg-[#08111d] border border-[#2f6d8b]/40 rounded-3xl text-white shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ikon & Judul Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {phase === "preparing" && (
              <div className="w-12 h-12 rounded-2xl bg-[#0e2035] border border-[#2f6d8b]/50 flex items-center justify-center text-[#c5984f] shadow-lg shadow-[#08111d]">
                <ArchiveIcon size={24} className="animate-pulse" />
              </div>
            )}
            {phase === "compressing" && (
              <div className="w-12 h-12 rounded-2xl bg-[#0e2035] border border-[#2f6d8b]/50 flex items-center justify-center text-[#c5984f] shadow-lg shadow-[#08111d]">
                <RefreshCwIcon size={24} className="animate-spin text-[#c5984f]" />
              </div>
            )}
            {phase === "downloading" && (
              <div className="w-12 h-12 rounded-2xl bg-[#0e2035] border border-[#2f6d8b]/50 flex items-center justify-center text-[#7ec7e8] shadow-lg shadow-[#08111d]">
                <DownloadIcon size={24} className="animate-bounce" />
              </div>
            )}
            {phase === "completed" && (
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-[#08111d]">
                <CheckIcon size={24} />
              </div>
            )}
            {phase === "error" && (
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-[#08111d]">
                <AlertTriangleIcon size={24} />
              </div>
            )}

            <div>
              <h3 id="download-progress-title" className="text-base font-bold text-white leading-snug">
                {phase === "preparing" && "Menyiapkan Foto..."}
                {phase === "compressing" && "Mengompresi ke ZIP..."}
                {phase === "downloading" && "Menyimpan ke Perangkat..."}
                {phase === "completed" && "Unduhan Berhasil!"}
                {phase === "error" && "Gagal Mengunduh"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {phase === "preparing" && `Membaca foto ${currentCount} dari ${totalCount}`}
                {phase === "compressing" && "Mengompresi berkas secara client-side"}
                {phase === "downloading" && "Memicu penyimpanan di peramban"}
                {phase === "completed" && `${totalCount} foto tersimpan dalam format ZIP`}
                {phase === "error" && "Terjadi kendala pada kompresi ZIP"}
              </p>
            </div>
          </div>

          {isFinished && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#0e2035] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Progress Bar & Informasi Persentase */}
        <div className="space-y-2 py-1">
          <div className="w-full h-3 rounded-full bg-[#0e2035] border border-[#2f6d8b]/30 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                phase === "completed"
                  ? "bg-emerald-500"
                  : phase === "error"
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-[#c5984f] to-[#7ec7e8]"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="truncate max-w-[200px] text-[11px]">
              {phase === "preparing" && currentFilename}
              {phase === "compressing" && "Algoritma kompresi ZIP aktif..."}
              {phase === "downloading" && targetFilename}
              {phase === "completed" && targetFilename}
              {phase === "error" && "Proses dihentikan"}
            </span>
            <span className="font-mono font-semibold text-white shrink-0">{percent}%</span>
          </div>
        </div>

        {/* Detail Tambahan: Ukuran File atau Pesan Error */}
        {fileSizeBytes && fileSizeBytes > 0 ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e2035]/60 border border-[#2f6d8b]/30 text-xs">
            <span className="text-zinc-400">Ukuran Berkas:</span>
            <span className="font-mono font-semibold text-[#dcab55]">
              {formatBytes(fileSizeBytes)}
            </span>
          </div>
        ) : null}

        {phase === "error" && errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Catatan Jaminan Keamanan Data (Rules #10.5) */}
        {phase === "error" && (
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-[#c5984f]/30 text-[11px] text-amber-200 leading-relaxed">
            Foto sumber Anda tetap aman dan tersimpan di penyimpanan lokal tanpa pengurangan data.
          </div>
        )}

        {/* Tombol Aksi Bawah */}
        <div className="pt-2">
          {phase === "completed" && (
            <Button variant="primary" onClick={onClose} className="w-full">
              Selesai
            </Button>
          )}

          {phase === "error" && (
            <Button variant="secondary" onClick={onClose} className="w-full">
              Tutup
            </Button>
          )}

          {!isFinished && (
            <div className="text-center">
              <p className="text-[11px] text-zinc-500 italic">
                Mohon jangan menutup peramban hingga proses pengunduhan selesai.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
