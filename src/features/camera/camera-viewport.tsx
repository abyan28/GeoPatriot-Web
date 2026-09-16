import React, { useRef } from "react";
import type { CameraFacingMode, CameraStatus, ZoomCapabilities } from "@/lib/browser/camera";
import { CameraPermissionFallback } from "./camera-permission-fallback";

export interface CameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  facingMode: CameraFacingMode;
  errorMessage?: string | null;
  isFlashing?: boolean;
  onRequestCamera: () => void;
  children?: React.ReactNode;
  zoom?: number;
  zoomCapabilities?: ZoomCapabilities | null;
  onZoomChange?: (newZoom: number) => void;
}

/**
 * Viewport utama video kamera GeoPatriot Web.
 * Menangani rasio aspek live preview, mirror kamera depan, efek shutter flash,
 * serta gestur sentuh pinch-to-zoom native (rules #3.11 & #15.9).
 */
export function CameraViewport({
  videoRef,
  status,
  facingMode,
  errorMessage,
  isFlashing = false,
  onRequestCamera,
  children,
  zoom = 1,
  zoomCapabilities,
  onZoomChange,
}: CameraViewportProps) {
  const isMirror = facingMode === "user";
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(zoom);

  /**
   * Mendeteksi sentuhan dua jari untuk inisiasi gestur pinch-to-zoom.
   */
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && zoomCapabilities) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  /**
   * Mengatur zoom proporsional saat jarak antara dua jari berubah.
   */
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      e.touches.length === 2 &&
      touchStartDistRef.current !== null &&
      zoomCapabilities &&
      onZoomChange
    ) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY,
      );
      if (touchStartDistRef.current > 0) {
        const ratio = currentDist / touchStartDistRef.current;
        const targetZoom = touchStartZoomRef.current * ratio;
        onZoomChange(targetZoom);
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  return (
    <div
      className="relative w-full h-full flex-1 bg-black overflow-hidden flex items-center justify-center select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
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
