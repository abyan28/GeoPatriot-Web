import React from "react";
import type { CameraFacingMode, CameraStatus } from "@/lib/browser/camera";
import { CameraPermissionFallback } from "./camera-permission-fallback";

export interface CameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  facingMode: CameraFacingMode;
  errorMessage?: string | null;
  isFlashing?: boolean;
  onRequestCamera: () => void;
  children?: React.ReactNode;
}

/**
 * Viewport utama video kamera GeoPatriot Web.
 * Menangani rasio aspek live preview, mirror kamera depan, dan efek shutter flash.
 */
export function CameraViewport({
  videoRef,
  status,
  facingMode,
  errorMessage,
  isFlashing = false,
  onRequestCamera,
  children,
}: CameraViewportProps) {
  const isMirror = facingMode === "user";

  return (
    <div className="relative w-full h-full flex-1 bg-black overflow-hidden flex items-center justify-center select-none">
      {/* Elemen Video Native Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-transform duration-200 ${
          isMirror ? "scale-x-[-1]" : ""
        } ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />

      {/* Efek Shutter Flash Putih Saat Pengambilan Foto */}
      {isFlashing && (
        <div
          className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Fallback Permission / Idle / Error */}
      {status !== "ready" && (
        <CameraPermissionFallback
          status={status}
          errorMessage={errorMessage}
          onRequestCamera={onRequestCamera}
        />
      )}

      {/* Overlay Children (Watermark HUD, Status Badge, dsb.) */}
      {status === "ready" && children}
    </div>
  );
}
