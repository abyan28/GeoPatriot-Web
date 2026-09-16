"use client";

import React, { useState, useEffect } from "react";
import type { Photo } from "@/types/session";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DownloadIcon, MapPinIcon, ClockIcon } from "@/components/icons";
import { downloadBlob } from "@/lib/downloads/single-download";
import { buildPhotoFilename } from "@/lib/downloads/filename";
import { useToast } from "@/components/ui/Toast";

export interface PhotoPreviewDialogProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Konten dialog pratinjau foto hasil watermark (mount saat dialog terbuka).
 */
function PhotoPreviewContent({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const { showToast } = useToast();

  // URL objek dibuat langsung dari blob saat komponen di-mount
  const [imageUrl] = useState<string>(() => {
    const blobToPreview = photo.processedBlob || photo.originalBlob;
    return URL.createObjectURL(blobToPreview);
  });

  // Revoke object URL saat unmount untuk mencegah memory leak
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleDownload = () => {
    const blobToDownload = photo.processedBlob || photo.originalBlob;
    const filename = buildPhotoFilename(photo.snapshot.capturedAt);
    downloadBlob(blobToDownload, filename);
    showToast(`Foto diunduh: ${filename}`, "success");
  };

  const fileSizeKb = photo.processedBlob
    ? Math.round(photo.processedBlob.size / 1024)
    : photo.originalBlob
      ? Math.round(photo.originalBlob.size / 1024)
      : 0;

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Hasil Foto Dokumentasi"
      description="Pratinjau foto ber-watermark resmi yang tersimpan di memori lokal perangkat Anda."
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            leftIcon={<DownloadIcon size={18} />}
            className="font-bold"
          >
            Unduh Foto ({fileSizeKb} KB)
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Gambar Foto dengan Watermark */}
        <div className="relative w-full aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden bg-black border border-[#2f6d8b]/30 flex items-center justify-center shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Foto dokumentasi hasil watermark"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Info Ringkas Metadata */}
        <div className="p-3 rounded-xl bg-[#08111d] border border-[#1a3c61] text-xs space-y-1 font-mono">
          <div className="flex items-center justify-between font-sans">
            <span className="font-bold text-white text-xs">
              {photo.snapshot.locationName || "Titik Lapangan"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0e2035] text-[#dcab55] border border-[#c5984f]/40 font-semibold uppercase">
              {photo.snapshot.metadataSource.location}
            </span>
          </div>

          {photo.snapshot.address && (
            <p className="text-[11px] text-zinc-400 font-sans line-clamp-1">
              {photo.snapshot.address}
            </p>
          )}

          <div className="flex items-center gap-1 text-[11px] text-[#7ec7e8] pt-1">
            <MapPinIcon size={12} className="text-[#c5984f]" />
            <span>
              {photo.snapshot.coordinate.latitude.toFixed(6)},{" "}
              {photo.snapshot.coordinate.longitude.toFixed(6)}
            </span>
            {photo.snapshot.coordinate.accuracy && (
              <span className="text-zinc-500">
                ±{Math.round(photo.snapshot.coordinate.accuracy)}m
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <ClockIcon size={12} className="text-[#dcab55]" />
            <span>
              {photo.snapshot.capturedAt.replace("T", " ").slice(0, 19)} ({photo.snapshot.timezone})
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Dialog pratinjau foto hasil watermark dan aksi unduh langsung (Single Download, Rules #10.1).
 */
export function PhotoPreviewDialog({ photo, isOpen, onClose }: PhotoPreviewDialogProps) {
  if (!photo || !isOpen) return null;
  return <PhotoPreviewContent photo={photo} onClose={onClose} />;
}
