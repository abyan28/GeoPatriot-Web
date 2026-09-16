"use client";

import React, { useState, useEffect } from "react";
import type { Photo } from "@/types/session";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  ImagesIcon,
  TrashIcon,
  ArchiveIcon,
  AlertTriangleIcon,
  CheckIcon,
  PlusIcon,
  CheckSquareIcon,
  SquareIcon,
  MapPinIcon,
  ClockIcon,
} from "@/components/icons";
import { useSessionGallery } from "./use-session-gallery";
import { PhotoPreviewDialog } from "@/features/camera/photo-preview-dialog";
import { useDownloadManager, DownloadProgressDialog } from "@/features/downloads";

export interface SessionGalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionId?: string | null;
  onPhotoDeleted?: (deletedPhotoId: string) => void;
}

/**
 * Komponen kartu thumbnail foto individual dengan manajemen memori object URL aman.
 */
function PhotoThumbnailCard({
  photo,
  isSelected,
  onToggleSelect,
  onOpenPreview,
}: {
  photo: Photo;
  isSelected: boolean;
  onToggleSelect: (photoId: string) => void;
  onOpenPreview: (photo: Photo) => void;
}) {
  const [thumbUrl] = useState<string>(() => {
    const blob = photo.thumbnailBlob || photo.processedBlob || photo.originalBlob;
    return URL.createObjectURL(blob);
  });

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  return (
    <div
      className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-black border-2 transition-all cursor-pointer select-none ${
        isSelected
          ? "border-[#c5984f] shadow-lg shadow-[#c5984f]/20 ring-2 ring-[#c5984f]/50"
          : "border-[#1a3c61] hover:border-[#2f6d8b]"
      }`}
      onClick={() => onOpenPreview(photo)}
    >
      {/* Gambar Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl}
        alt={`Foto ${photo.id}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        loading="lazy"
      />

      {/* Checkbox Overlay Seleksi */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(photo.id);
        }}
        aria-label={isSelected ? "Batalkan seleksi foto" : "Pilih foto"}
        className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
          isSelected
            ? "bg-[#c5984f] text-[#08111d]"
            : "bg-black/50 text-white/80 hover:bg-black/80 hover:text-white border border-white/20"
        }`}
      >
        {isSelected ? <CheckSquareIcon size={16} /> : <SquareIcon size={16} />}
      </button>

      {/* Badge Status Unduh (PRD #14) */}
      <div className="absolute top-2 right-2">
        {photo.downloaded ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/85 border border-emerald-500/40 text-[10px] font-medium text-emerald-300 backdrop-blur-md shadow-sm">
            <CheckIcon size={10} />
            Diunduh
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/85 border border-[#c5984f]/50 text-[10px] font-medium text-[#dcab55] backdrop-blur-md shadow-sm">
            <AlertTriangleIcon size={10} />
            Belum
          </span>
        )}
      </div>

      {/* Overlay Info Ringkas di Bagian Bawah */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-[10px] text-zinc-300">
        <p className="font-semibold text-white truncate">
          {photo.snapshot.locationName || "Titik Lapangan"}
        </p>
        <div className="flex items-center justify-between text-zinc-400 mt-0.5">
          <span className="flex items-center gap-0.5">
            <ClockIcon size={10} className="text-[#c5984f]" />
            {photo.snapshot.capturedAt.slice(11, 16)}
          </span>
          <span className="flex items-center gap-0.5">
            <MapPinIcon size={10} className="text-[#2f6d8b]" />
            {photo.snapshot.coordinate.latitude.toFixed(3)},{" "}
            {photo.snapshot.coordinate.longitude.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Konten utama SessionGallery saat drawer dibuka.
 */
function SessionGalleryContent({
  activeSessionId,
  onClose,
  onPhotoDeleted,
}: {
  activeSessionId?: string | null;
  onClose: () => void;
  onPhotoDeleted?: (deletedPhotoId: string) => void;
}) {
  const { showToast } = useToast();
  const gallery = useSessionGallery(activeSessionId);
  const downloadManager = useDownloadManager();
  const {
    sessions,
    activeSession,
    photos,
    selectedPhotoIds,
    isDownloadingZip,
    undownloadedCount,
    selectSession,
    toggleSelectPhoto,
    selectAllPhotos,
    clearSelection,
    deleteSelectedPhotos,
    deleteSinglePhoto,
    clearCurrentSession,
    createNewSession,
  } = gallery;

  // State untuk dialog konfirmasi dan preview individual
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);

  const isAllSelected = photos.length > 0 && selectedPhotoIds.size === photos.length;

  /**
   * Eksekusi unduhan ZIP untuk foto yang dipilih atau seluruh sesi dengan pelacakan progres (Phase 11 / PRD #15).
   */
  const handleDownloadZip = async () => {
    const targetPhotos =
      selectedPhotoIds.size > 0
        ? photos.filter((p) => selectedPhotoIds.has(p.id))
        : photos;

    if (targetPhotos.length === 0) {
      showToast("Tidak ada foto yang dipilih untuk diunduh.", "error");
      return;
    }

    const res = await downloadManager.downloadBatchZip(targetPhotos);
    if (res.success) {
      showToast(`Berhasil mengunduh ZIP: ${res.filename}`, "success");
      await gallery.reloadPhotos();
    } else {
      showToast(res.error || "Gagal mengunduh ZIP", "error");
    }
  };

  /**
   * Konfirmasi dan eksekusi penghapusan foto yang dipilih (Rules #8.7, #8.8).
   */
  const handleExecuteDelete = async () => {
    const deletedIds = Array.from(selectedPhotoIds);
    const res = await deleteSelectedPhotos();
    setIsConfirmDeleteOpen(false);

    if (res.success) {
      showToast(`${res.count} foto berhasil dihapus.`, "info");
      if (onPhotoDeleted && deletedIds.length > 0) {
        onPhotoDeleted(deletedIds[0]);
      }
    } else {
      showToast("Gagal menghapus foto.", "error");
    }
  };

  /**
   * Konfirmasi dan eksekusi pengosongan seluruh sesi saat ini.
   */
  const handleExecuteClearSession = async () => {
    const success = await clearCurrentSession();
    setIsConfirmClearOpen(false);
    if (success) {
      showToast("Sesi berhasil dibersihkan dan dihapus.", "info");
      if (onPhotoDeleted) {
        onPhotoDeleted("all");
      }
    } else {
      showToast("Gagal mengosongkan sesi.", "error");
    }
  };

  /**
   * Pembuatan sesi baru untuk pengambilan foto terpisah (Phase 9).
   */
  const handleCreateNewSession = async () => {
    const newId = await createNewSession();
    showToast(`Sesi baru dibuat: ${newId.slice(-6)}`, "success");
  };

  return (
    <div className="space-y-4">
      {/* Baris Pemilih Sesi & Tombol Sesi Baru */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#08111d] border border-[#1a3c61]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <label htmlFor="session-select" className="text-xs text-zinc-400 font-medium shrink-0">
            Sesi:
          </label>
          <select
            id="session-select"
            value={gallery.activeSessionId ?? ""}
            onChange={(e) => void selectSession(e.target.value)}
            className="flex-1 min-w-0 bg-[#0e2035] border border-[#2f6d8b]/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5984f] truncate"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id.replace("session_", "Sesi ")} ({new Date(s.createdAt).toLocaleDateString("id-ID")})
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCreateNewSession}
          leftIcon={<PlusIcon size={14} />}
          className="shrink-0 text-xs py-1.5"
          title="Mulai sesi baru"
        >
          Sesi Baru
        </Button>
      </div>

      {/* Ringkasan Status Sesi & Peringatan Belum Diunduh (PRD #14) */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">
            {photos.length} Foto Tersimpan
          </span>
          {activeSession && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#142d4a] text-[#7ec7e8] border border-[#2f6d8b]/30">
              Mode: {activeSession.mode}
            </span>
          )}
        </div>

        {undownloadedCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 border border-[#c5984f]/40 text-[11px] text-[#dcab55] font-medium">
            <AlertTriangleIcon size={12} />
            {undownloadedCount} belum diunduh
          </span>
        ) : photos.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckIcon size={12} />
            Semua diunduh
          </span>
        ) : null}
      </div>

      {/* Toolbar Aksi: Multi-Select, Unduh ZIP, & Hapus */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1a3c61]">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? clearSelection : selectAllPhotos}
              leftIcon={isAllSelected ? <CheckSquareIcon size={14} /> : <SquareIcon size={14} />}
              className="text-xs"
            >
              {isAllSelected ? "Batal Pilih" : "Pilih Semua"}
            </Button>

            {selectedPhotoIds.size > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
                leftIcon={<TrashIcon size={14} />}
                className="text-xs"
              >
                Hapus ({selectedPhotoIds.size})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadZip}
              isLoading={isDownloadingZip || downloadManager.isDownloading}
              leftIcon={<ArchiveIcon size={14} />}
              className="text-xs font-semibold"
            >
              {selectedPhotoIds.size > 0
                ? `Unduh ZIP (${selectedPhotoIds.size})`
                : "Unduh Semua ZIP"}
            </Button>

            {selectedPhotoIds.size === 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors border border-transparent hover:border-red-900/40"
                title="Kosongkan Sesi Ini"
                aria-label="Kosongkan Sesi Ini"
              >
                <TrashIcon size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid Foto atau Empty State */}
      {photos.length === 0 ? (
        <EmptyState
          icon={<ImagesIcon size={32} className="text-[#c5984f]" />}
          title="Belum Ada Foto di Sesi Ini"
          description="Arahkan kamera ke objek lapangan dan tekan tombol rana untuk mengambil foto dokumentasi ber-watermark."
          action={
            <Button variant="secondary" size="sm" onClick={onClose}>
              Kembali ke Kamera
            </Button>
          }
          className="my-6 bg-[#08111d]/60 border-[#1a3c61]"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1 pb-2">
          {photos.map((photo) => (
            <PhotoThumbnailCard
              key={photo.id}
              photo={photo}
              isSelected={selectedPhotoIds.has(photo.id)}
              onToggleSelect={toggleSelectPhoto}
              onOpenPreview={setPreviewPhoto}
            />
          ))}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Foto Terpilih (Rules #8.8) */}
      <Dialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title={`Hapus ${selectedPhotoIds.size} Foto Terpilih?`}
        description="Foto yang dihapus akan dihilangkan secara permanen dari penyimpanan lokal perangkat Anda dan tidak dapat dipulihkan."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleExecuteDelete}
              leftIcon={<TrashIcon size={14} />}
            >
              Ya, Hapus Foto
            </Button>
          </>
        }
      />

      {/* Dialog Konfirmasi Kosongkan Seluruh Sesi (Rules #8.7, #8.8) */}
      <Dialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        title="Kosongkan Sesi Ini?"
        description="Semua foto dalam sesi ini akan dihapus secara permanen dari penyimpanan lokal IndexedDB."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmClearOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleExecuteClearSession}
              leftIcon={<TrashIcon size={14} />}
            >
              Ya, Kosongkan Sesi
            </Button>
          </>
        }
      />

      {/* Dialog Pratinjau Foto Individual (dengan opsi unduh single & hapus) */}
      <PhotoPreviewDialog
        photo={previewPhoto}
        isOpen={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        onDownload={async (p) => {
          const success = await downloadManager.downloadSingle(p);
          if (success) {
            await gallery.reloadPhotos();
            showToast("Foto berhasil diunduh.", "success");
          } else {
            showToast("Gagal mengunduh foto.", "error");
          }
        }}
        onDelete={async (p) => {
          await deleteSinglePhoto(p.id);
          if (onPhotoDeleted) {
            onPhotoDeleted(p.id);
          }
          showToast("Foto berhasil dihapus.", "info");
        }}
      />

      {/* Dialog Progres Unduhan ZIP Real-Time (Phase 11 / PRD #15) */}
      <DownloadProgressDialog
        state={downloadManager.state}
        onClose={downloadManager.closeDialog}
      />
    </div>
  );
}

/**
 * Drawer Galeri Sesi Foto Lapangan (Phase 10 / PRD #14, #15).
 * Menyediakan penglihatan multi-foto per sesi, batch ZIP download, dan manajemen hapus aman.
 */
export function SessionGalleryDrawer({
  isOpen,
  onClose,
  activeSessionId,
  onPhotoDeleted,
}: SessionGalleryDrawerProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Galeri Foto Lapangan"
      description="Kelola foto dokumentasi, unduh ZIP sesi, atau hapus berkas lokal."
    >
      {isOpen && (
        <SessionGalleryContent
          activeSessionId={activeSessionId}
          onClose={onClose}
          onPhotoDeleted={onPhotoDeleted}
        />
      )}
    </BottomSheet>
  );
}
