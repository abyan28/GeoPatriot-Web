"use client";

import dynamic from "next/dynamic";

/**
 * Memuat CameraScreen secara dinamis hanya di sisi klien (ssr: false).
 * Menghindari hydration mismatch yang dipicu oleh ekstensi browser pada elemen kamera.
 */
const CameraScreen = dynamic(() => import("@/features/camera").then((mod) => mod.CameraScreen), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[100dvh] max-w-md mx-auto bg-black flex items-center justify-center text-zinc-500">
      <span className="w-6 h-6 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function HomePage() {
  return <CameraScreen />;
}
