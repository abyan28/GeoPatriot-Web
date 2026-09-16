import React, { useState, useEffect } from "react";
import { FlipCameraIcon, ImagesIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import type { Photo } from "@/types/session";
import type { ZoomCapabilities } from "@/lib/browser/camera";

export interface CameraControlsProps {
  onCapture: () => void;
  onToggleFacingMode: () => void;
  onOpenGallery?: () => void;
  sessionPhotoCount?: number;
  isCapturing?: boolean;
  disabled?: boolean;
  thumbnailUrl?: string | null;
  lastPhoto?: Photo | null;
  zoom?: number;
  zoomCapabilities?: ZoomCapabilities | null;
  zoomPresets?: number[];
  onZoomChange?: (zoom: number) => void;
}

/**
 * Komponen thumbnail individual dengan manajemen memori URL aman.
 */
function GalleryThumbnailImage({ photo }: { photo: Photo }) {
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
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={thumbUrl}
      alt="Thumbnail foto terakhir"
      className="w-full h-full object-cover rounded-2xl"
    />
  );
}

/**
 * Kontrol kamera bawah (Thumb Zone) yang dirancang ramah navigasi satu tangan.
 * Rules #15.3: Kontrol shutter mudah dijangkau ibu jari pada smartphone portrait.
 */
export function CameraControls({
  onCapture,
  onToggleFacingMode,
  onOpenGallery,
  sessionPhotoCount = 0,
  isCapturing = false,
  disabled = false,
  thumbnailUrl,
  lastPhoto,
  zoom = 1,
  zoomCapabilities,
  zoomPresets = [],
  onZoomChange,
}: CameraControlsProps) {
  return (
    // Padding bawah mempertimbangkan safe-area (home indicator iPhone) — relevan
    // saat browser chrome hilang, baik via Fullscreen API maupun PWA standalone.
    <div className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] px-6 flex flex-col z-30 select-none">
      {/* Baris Kontrol Zoom Adaptif (Thumb Zone, Rules #3.11) */}
      {zoomCapabilities && zoomPresets.length > 1 && onZoomChange && (
        <div className="flex items-center justify-center pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 shadow-xl">
            {zoomPresets.map((level) => {
              const isSelected = Math.abs(zoom - level) < 0.1;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onZoomChange(level)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all ${
                    isSelected
                      ? "bg-[#c5984f] text-[#08111d] font-black shadow-md scale-105"
                      : "text-zinc-300 hover:text-white hover:bg-white/10 font-semibold"
                  }`}
                  aria-label={`Atur zoom ke ${level}x`}
                >
                  {level}×
                </button>
              );
            })}
            {/* Tampilkan indikator custom bila zoom saat ini tidak tepat di salah satu preset (misal hasil pinch 1.7x) */}
            {!zoomPresets.some((level) => Math.abs(zoom - level) < 0.1) && (
              <span className="px-2.5 py-1 rounded-full bg-[#c5984f] text-[#08111d] text-xs font-black shadow-md">
                {zoom.toFixed(1)}×
              </span>
            )}
          </div>
        </div>
      )}

      {/* Baris Utama: Galeri, Shutter, dan Flip Kamera */}
      <div className="flex items-center justify-between w-full">
      {/* Sisi Kiri: Tombol Buka Galeri Sesi */}
      <div className="flex-1 flex justify-start">
        <button
          type="button"
          onClick={onOpenGallery}
          aria-label={`Buka galeri sesi. Tersimpan ${sessionPhotoCount} foto`}
          className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-[#2f6d8b]/40 text-white active:scale-95 transition-all shadow-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5984f]"
        >
          {lastPhoto ? (
            <GalleryThumbnailImage key={lastPhoto.id} photo={lastPhoto} />
          ) : thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnailUrl}
              alt="Thumbnail foto terakhir"
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <>
              <ImagesIcon size={22} className="text-zinc-300" />
              <span className="text-[9px] text-zinc-400 font-medium mt-0.5">Galeri</span>
            </>
          )}

          {sessionPhotoCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#c5984f] text-[#08111d] text-[10px] font-black rounded-full flex items-center justify-center shadow-md border border-[#08111d]">
              {sessionPhotoCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Tengah: Tombol Shutter Utama (Thumb Zone) */}
      <div className="flex justify-center px-4">
        <Button
          variant="shutter"
          onClick={onCapture}
          disabled={disabled || isCapturing}
          isLoading={isCapturing}
          aria-label="Ambil foto"
        />
      </div>

      {/* Sisi Kanan: Tombol Beralih Kamera Depan/Belakang */}
      <div className="flex-1 flex justify-end">
        <Button
          variant="icon"
          onClick={onToggleFacingMode}
          disabled={disabled}
          aria-label="Putar kamera ke depan atau belakang"
          className="w-14 h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 shadow-lg"
        >
          <FlipCameraIcon size={22} className="text-zinc-300" />
        </Button>
      </div>
    </div>
    </div>
  );
}
