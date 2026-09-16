"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCamera } from "./use-camera";
import { CameraViewport } from "./camera-viewport";
import { CameraControls } from "./camera-controls";
import { GpsQualityChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";

/**
 * Komponen layar utama Kamera GeoPatriot Web dengan identitas visual resmi Kementerian Transmigrasi RI.
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
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#08111d] flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Top Header Bar: Status & Branding Kementerian Transmigrasi */}
      <header className="absolute top-0 inset-x-0 z-30 pt-4 pb-3 px-4 bg-gradient-to-b from-[#08111d]/90 via-[#08111d]/50 to-transparent flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-[#c5984f]/60 bg-[#08111d] flex items-center justify-center shrink-0">
            <Image
              src="/app-icon.png"
              alt="Logo GeoPatriot Kementerian Transmigrasi"
              width={36}
              height={36}
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-wide leading-tight drop-shadow-md">
              GeoPatriot
            </span>
            <span className="text-[10px] font-semibold text-[#dcab55] tracking-tight leading-none drop-shadow">
              Kementerian Transmigrasi RI
            </span>
          </div>
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
            <div className="p-3 rounded-xl bg-[#0e2035]/85 backdrop-blur-md border border-[#2f6d8b]/30 text-[11px] text-zinc-200 leading-relaxed max-w-xs shadow-xl">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5984f]" />
                GeoPatriot • Kemen Transmigrasi RI
              </p>
              <p className="text-[#94a3b8] text-[10px] mt-0.5">
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
