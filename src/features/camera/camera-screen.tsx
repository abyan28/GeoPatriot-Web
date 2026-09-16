"use client";

import React, { useState } from "react";
import { useCamera } from "./use-camera";
import { CameraViewport } from "./camera-viewport";
import { CameraControls } from "./camera-controls";
import { GpsQualityChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";

/**
 * Komponen layar utama Kamera GeoPatriot Web (Phase 1 & Phase 2).
 * Menyajikan live viewport, top status header, dan bottom controls.
 */
export function CameraScreen() {
  const { status, facingMode, errorMessage, videoRef, start, toggleFacingMode } = useCamera();
  const { showToast } = useToast();
  const [isFlashing, setIsFlashing] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  /**
   * Handler untuk simulasi aksi capture foto pada Phase 2 (sebelum pipeline lengkap di Phase 5).
   */
  const handleCapture = () => {
    if (status !== "ready") {
      showToast("Kamera belum aktif", "error");
      return;
    }

    // Efek visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    setSessionCount((prev) => prev + 1);
    showToast("Foto berhasil diambil (Kamera PoC)", "success");
  };

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-black flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Top Header Bar: Status & Branding */}
      <header className="absolute top-0 inset-x-0 z-30 pt-4 pb-3 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
            GP
          </div>
          <span className="text-sm font-bold text-white tracking-wide drop-shadow-md">
            GeoPatriot
          </span>
        </div>

        {/* GPS Status Chip (Placeholder untuk Phase 3) */}
        <div className="pointer-events-auto">
          <GpsQualityChip quality="good" accuracy={8} />
        </div>
      </header>

      {/* Main Viewport */}
      <main className="w-full h-full flex-1 flex flex-col">
        <CameraViewport
          videoRef={videoRef}
          status={status}
          facingMode={facingMode}
          errorMessage={errorMessage}
          isFlashing={isFlashing}
          onRequestCamera={() => start()}
        >
          {/* Watermark Live HUD (Akan dihubungkan di Phase 6) */}
          <div className="absolute bottom-4 inset-x-4 pointer-events-none">
            <div className="p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-200 leading-relaxed max-w-xs shadow-lg">
              <p className="font-semibold text-white">GeoPatriot Web Viewfinder</p>
              <p className="text-zinc-400 text-[10px]">
                Watermark live preview akan aktif di tahap berikutnya.
              </p>
            </div>
          </div>
        </CameraViewport>
      </main>

      {/* Bottom Controls (Thumb Zone) */}
      {status === "ready" && (
        <footer className="absolute bottom-0 inset-x-0 z-30 pointer-events-auto">
          <CameraControls
            onCapture={handleCapture}
            onToggleFacingMode={toggleFacingMode}
            sessionPhotoCount={sessionCount}
            onOpenGallery={() => showToast(`Sesi ini memiliki ${sessionCount} foto`, "info")}
          />
        </footer>
      )}
    </div>
  );
}
