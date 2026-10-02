"use client";

import React, { useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { UploadIcon, CloseIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { parseCoordinatePair } from "@/features/metadata/parse-coordinate-pair";
import type { UsePhotoUploadReturn, UploadItem } from "./use-photo-upload";

export interface PhotoUploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  upload: UsePhotoUploadReturn;
  /** Dipanggil setelah batch selesai agar galeri dimuat ulang. */
  onProcessed?: (result: { succeeded: number; failed: number }) => void;
}

const inputClass =
  "w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#0e2035] border border-[#2f6d8b]/40 text-white font-mono text-xs focus:border-[#c5984f] focus:outline-none";

function UploadItemRow({
  item,
  disabled,
  onChange,
  onRemove,
}: {
  item: UploadItem;
  disabled: boolean;
  onChange: (patch: { coordText?: string; dateTime?: string }) => void;
  onRemove: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const coordInvalid = item.coordText.trim() !== "" && !parseCoordinatePair(item.coordText);
  const hasOverride = item.coordText.trim() !== "" || item.dateTime !== "";

  return (
    <li className="rounded-xl bg-[#08111d]/90 border border-[#1a3c61] p-2.5">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.previewUrl}
          alt=""
          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#0e2035]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white truncate">{item.file.name}</p>
          <p className="text-[10px] mt-0.5">
            {item.status === "done" ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckIcon size={11} /> Tersimpan di galeri
              </span>
            ) : item.status === "processing" ? (
              <span className="text-sky-300">Memproses...</span>
            ) : item.status === "error" ? (
              <span className="text-rose-400">{item.errorMessage ?? "Gagal"}</span>
            ) : item.exifCoordText || item.exifDateTime ? (
              <span className="text-zinc-400">
                EXIF terbaca
                {item.exifCoordText ? " • GPS" : ""}
                {item.exifDateTime ? " • waktu" : ""}
              </span>
            ) : (
              <span className="text-zinc-500">Tanpa data EXIF</span>
            )}
          </p>
        </div>
        {item.status !== "done" && item.status !== "processing" && (
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            disabled={disabled}
            className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
              hasOverride ? "bg-[#c5984f] text-[#08111d]" : "text-[#dcab55] hover:underline"
            }`}
          >
            {hasOverride ? "Diubah" : "Atur"}
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Hapus ${item.file.name} dari daftar`}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-40"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {isOpen && item.status !== "done" && (
        <div className="mt-2.5 space-y-2 pt-2.5 border-t border-[#1a3c61]">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Koordinat khusus foto ini (kosongkan untuk ikut koordinat bersama)
            </label>
            <input
              type="text"
              value={item.coordText}
              onChange={(e) => onChange({ coordText: e.target.value })}
              placeholder={item.exifCoordText ?? "-9.620308, 124.879609"}
              aria-invalid={coordInvalid}
              className={`${inputClass} ${coordInvalid ? "border-rose-500/60" : ""}`}
            />
            {coordInvalid && (
              <p className="text-[10px] text-rose-400 mt-1">
                Format tidak dikenali. Gunakan: -9.620308,124.879609
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Waktu khusus foto ini (kosongkan untuk ikut waktu bersama)
            </label>
            <input
              type="datetime-local"
              value={item.dateTime}
              onChange={(e) => onChange({ dateTime: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * BottomSheet upload foto: pilih beberapa foto dari galeri, isi satu koordinat & waktu bersama
 * (bisa di-override per foto), lalu watermark diterapkan satu per satu.
 */
export function PhotoUploadSheet({ isOpen, onClose, upload, onProcessed }: PhotoUploadSheetProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    items,
    sharedCoordText,
    sharedDateTime,
    sharedNote,
    isProcessing,
    setSharedCoordText,
    setSharedDateTime,
    setSharedNote,
    addFiles,
    updateItem,
    removeItem,
    clearAll,
    processAll,
  } = upload;

  const sharedCoordInvalid = sharedCoordText.trim() !== "" && !parseCoordinatePair(sharedCoordText);
  const actionableCount = items.filter((it) => it.status === "pending" || it.status === "error").length;
  const doneCount = items.filter((it) => it.status === "done").length;

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const { rejected } = await addFiles(files);
    if (rejected > 0) {
      showToast(`${rejected} file dilewati (hanya JPG, PNG, atau WebP).`, "info");
    }
    // Reset agar memilih file yang sama dua kali tetap memicu onChange.
    event.target.value = "";
  };

  const handleProcess = async () => {
    const result = await processAll();
    if (result.succeeded > 0 && result.failed === 0) {
      showToast(`${result.succeeded} foto berhasil diberi watermark`, "success");
    } else if (result.failed > 0) {
      showToast(
        `${result.succeeded} berhasil, ${result.failed} gagal. Periksa pesan di tiap foto.`,
        "error",
      );
    }
    onProcessed?.(result);
  };

  const handleClose = () => {
    if (isProcessing) return;
    // Daftar yang sudah selesai dibersihkan agar pembukaan berikutnya mulai bersih.
    if (items.length > 0 && actionableCount === 0) clearAll();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Foto & Watermark"
      description="Tambahkan watermark GeoPatriot ke foto yang diambil tanpa sinyal. Isi koordinat & waktu pengambilan foto."
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            leftIcon={<PlusIcon size={16} />}
            className="flex-1 text-xs"
          >
            Pilih Foto
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleProcess}
            disabled={isProcessing || actionableCount === 0 || sharedCoordInvalid}
            isLoading={isProcessing}
            leftIcon={<UploadIcon size={16} />}
            className="flex-2 font-bold"
          >
            {actionableCount > 0 ? `Beri Watermark (${actionableCount})` : "Beri Watermark"}
          </Button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      <div className="space-y-5 pb-2">
        <div className="p-3.5 rounded-xl bg-[#08111d]/90 border border-[#1a3c61] space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#dcab55]">
            Data untuk semua foto
          </p>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Koordinat (salin dari Google Maps)
            </label>
            <input
              type="text"
              value={sharedCoordText}
              onChange={(e) => setSharedCoordText(e.target.value)}
              placeholder="-9.620308, 124.879609"
              aria-invalid={sharedCoordInvalid}
              disabled={isProcessing}
              className={`${inputClass} ${sharedCoordInvalid ? "border-rose-500/60" : ""}`}
            />
            {sharedCoordInvalid && (
              <p className="text-[10px] text-rose-400 mt-1">
                Format tidak dikenali. Gunakan: -9.620308,124.879609
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">Tanggal & waktu foto diambil</label>
            <input
              type="datetime-local"
              value={sharedDateTime}
              onChange={(e) => setSharedDateTime(e.target.value)}
              disabled={isProcessing}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">Catatan lapangan (opsional)</label>
            <input
              type="text"
              value={sharedNote}
              onChange={(e) => setSharedNote(e.target.value)}
              maxLength={80}
              disabled={isProcessing}
              placeholder="Mis. Pengecekan Patok Batas Tahap II"
              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-[#0e2035] border border-[#2f6d8b]/40 text-white text-xs focus:border-[#c5984f] focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            Bila foto memiliki data EXIF (GPS/waktu), kolom di atas terisi otomatis dari foto
            pertama. Periksa kembali sebelum memproses. Alamat dan peta dicari otomatis dari
            koordinat saat perangkat online.
          </p>
        </div>

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 rounded-xl border border-dashed border-[#2f6d8b]/60 text-zinc-400 hover:text-white hover:border-[#c5984f] flex flex-col items-center gap-2 transition-colors"
          >
            <UploadIcon size={26} className="text-[#c5984f]" />
            <span className="text-xs font-semibold">Pilih satu atau beberapa foto</span>
            <span className="text-[10px] text-zinc-500">JPG, PNG, atau WebP</span>
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white">
                {items.length} foto{doneCount > 0 ? ` • ${doneCount} selesai` : ""}
              </p>
              <button
                type="button"
                onClick={clearAll}
                disabled={isProcessing}
                className="text-[11px] text-zinc-400 hover:text-white disabled:opacity-40"
              >
                Kosongkan daftar
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((item) => (
                <UploadItemRow
                  key={item.id}
                  item={item}
                  disabled={isProcessing}
                  onChange={(patch) => updateItem(item.id, patch)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
