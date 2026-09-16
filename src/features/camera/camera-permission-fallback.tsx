import React from "react";
import type { CameraStatus } from "@/lib/browser/camera";
import { CameraIcon, AlertTriangleIcon, RefreshCwIcon, InfoIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";

export interface CameraPermissionFallbackProps {
  status: CameraStatus;
  errorMessage?: string | null;
  onRequestCamera: () => void;
}

/**
 * Komponen fallback permission kamera dengan panduan jelas dan ramah pengguna.
 * Sesuai Rules #3.2 (permission on demand) dan PRD #22 (Camera denied handling).
 */
export function CameraPermissionFallback({
  status,
  errorMessage,
  onRequestCamera,
}: CameraPermissionFallbackProps) {
  if (status === "ready") return null;

  if (status === "requesting") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/90 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-amber-400 mb-4 animate-spin">
          <RefreshCwIcon size={28} />
        </div>
        <h2 className="text-lg font-bold text-zinc-100">Menghubungkan Kamera...</h2>
        <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
          Mohon berikan izin akses kamera pada dialog browser Anda.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangleIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Izin Kamera Ditolak</h2>
        <p className="text-xs text-zinc-300 mt-2 max-w-xs leading-relaxed">
          GeoPatriot membutuhkan izin kamera untuk mengambil foto dokumentasi ber-watermark. Foto
          diproses secara lokal di perangkat Anda dan tidak diunggah ke server.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left max-w-xs w-full text-xs text-zinc-300">
          <p className="font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
            <InfoIcon size={14} /> Cara mengaktifkan kembali:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
            <li>Ketuk ikon gembok / setelan di bilah alamat browser.</li>
            <li>
              Pilih <strong>Izin Situs</strong> atau <strong>Kamera</strong>.
            </li>
            <li>
              Ubah status menjadi <strong>Izinkan</strong>.
            </li>
            <li>Kembali ke halaman ini dan tekan tombol di bawah.</li>
          </ol>
        </div>

        <div className="mt-6">
          <Button
            variant="primary"
            size="md"
            onClick={onRequestCamera}
            leftIcon={<RefreshCwIcon size={16} />}
          >
            Coba Minta Izin Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (status === "unsupported") {
    const isInsecureContext = typeof window !== "undefined" && window.isSecureContext === false;

    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-4">
          <AlertTriangleIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">
          {isInsecureContext ? "Kamera Memerlukan HTTPS" : "Browser Tidak Didukung"}
        </h2>
        <p className="text-xs text-zinc-300 mt-2 max-w-xs leading-relaxed">
          {isInsecureContext
            ? "Browser memblokir kamera & GPS jika diakses melalui IP jaringan lokal (192.168.x.x) dengan protokol HTTP biasa."
            : errorMessage ||
              "Browser yang Anda gunakan tidak mendukung Web Media Capture API. Silakan gunakan Chrome atau Safari terbaru."}
        </p>

        {isInsecureContext && (
          <div className="mt-5 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left max-w-xs w-full text-xs text-zinc-300">
            <p className="font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
              <InfoIcon size={14} /> Solusi Akses dari HP (Wi-Fi):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400">
              <li>
                Di terminal PC/laptop, hentikan server lalu jalankan:
                <code className="block my-1 px-2 py-1 bg-black/80 text-amber-300 rounded font-mono text-[10px]">
                  pnpm dev:https
                </code>
              </li>
              <li>
                Di browser HP, buka dengan awalan <strong>https://</strong>:
                <span className="block mt-0.5 text-zinc-300 font-mono text-[10px]">
                  https://192.168.100.10:3000
                </span>
              </li>
              <li>
                Jika muncul peringatan sertifikat di HP, klik <strong>Lanjutan (Advanced)</strong>{" "}
                lalu <strong>Lanjutkan ke situs</strong>.
              </li>
            </ol>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={onRequestCamera}
            leftIcon={<RefreshCwIcon size={16} />}
          >
            Coba Periksa Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-zinc-950 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangleIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Kamera Tidak Tersedia</h2>
        <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
          {errorMessage || "Terjadi kesalahan saat mencoba membuka kamera perangkat."}
        </p>
        <div className="mt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={onRequestCamera}
            leftIcon={<RefreshCwIcon size={16} />}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // State: "idle" (Menunggu pengguna memulai kamera)
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-2xl">
        <CameraIcon size={36} />
      </div>
      <h1 className="text-2xl font-black tracking-tight text-white">GeoPatriot Web</h1>
      <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
        GPS Camera dengan watermark lokasi dan waktu terintegrasi. Sepenuhnya berjalan lokal di
        browser Anda.
      </p>

      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={onRequestCamera}
          leftIcon={<CameraIcon size={20} />}
          className="shadow-xl"
        >
          Buka Kamera
        </Button>
      </div>

      <p className="text-[11px] text-zinc-500 mt-6 flex items-center gap-1.5">
        <InfoIcon size={13} /> Akses kamera hanya digunakan untuk live preview lokal.
      </p>
    </div>
  );
}
