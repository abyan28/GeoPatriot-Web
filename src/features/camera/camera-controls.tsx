import React from "react";
import { FlipCameraIcon, ImagesIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export interface CameraControlsProps {
  onCapture: () => void;
  onToggleFacingMode: () => void;
  onOpenGallery?: () => void;
  sessionPhotoCount?: number;
  isCapturing?: boolean;
  disabled?: boolean;
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
}: CameraControlsProps) {
  return (
    <div className="w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-6 pb-8 px-6 flex items-center justify-between z-30 select-none">
      {/* Sisi Kiri: Tombol Buka Galeri Sesi */}
      <div className="flex-1 flex justify-start">
        <button
          type="button"
          onClick={onOpenGallery}
          aria-label={`Buka galeri sesi. Tersimpan ${sessionPhotoCount} foto`}
          className="relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 text-white active:scale-95 transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ImagesIcon size={22} className="text-zinc-300" />
          {sessionPhotoCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
              {sessionPhotoCount}
            </span>
          ) : null}
          <span className="text-[9px] text-zinc-400 font-medium mt-0.5">Galeri</span>
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
  );
}
