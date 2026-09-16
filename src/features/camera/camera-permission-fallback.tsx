import React from "react";
import Image from "next/image";
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
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#08111d]/95 text-white text-center">
        <div className="w-16 h-16 rounded-full bg-[#0e2035] border border-[#c5984f]/40 flex items-center justify-center text-[#dcab55] mb-4 animate-spin shadow-xl">
          <RefreshCwIcon size={28} />
        </div>
        <h2 className="text-lg font-bold text-white">Menghubungkan Kamera...</h2>
        <p className="text-xs text-[#94a3b8] mt-2 max-w-xs leading-relaxed">
          Mohon berikan izin akses kamera pada dialog browser Anda.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#08111d] text-white text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <AlertTriangleIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Izin Kamera Ditolak</h2>
        <p className="text-xs text-zinc-300 mt-2 max-w-xs leading-relaxed">
          GeoPatriot membutuhkan izin kamera untuk mengambil foto dokumentasi ber-watermark resmi.
          Foto diproses secara lokal di perangkat Anda dan tidak diunggah ke server.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-[#0e2035] border border-[#1a3c61] text-left max-w-xs w-full text-xs text-zinc-300 shadow-xl">
          <p className="font-semibold text-[#dcab55] mb-2 flex items-center gap-1.5">
            <InfoIcon size={14} /> Cara mengaktifkan kembali:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#94a3b8]">
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
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#08111d] text-white text-center">
        <div className="w-16 h-16 rounded-full bg-[#261e0e] border border-[#c5984f]/60 flex items-center justify-center text-[#dcab55] mb-4 shadow-xl">
          <AlertTriangleIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">
          {isInsecureContext ? "Kamera Memerlukan HTTPS" : "Browser Tidak Didukung"}
        </h2>
        <p className="text-xs text-zinc-300 mt-2 max-w-xs leading-relaxed">
          {isInsecureContext
            ? "Browser memblokir kamera & GPS jika diakses melalui IP jaringan lokal (192.168.x.x) dengan protokol HTTP biasa."
            : errorMessage ||
              "Browser yang Anda gunakan tidak mendukung Web Media Capture API. Silakan gunakan Chrome atau Safari terbaru."}
        </p>

        {isInsecureContext && (
          <div className="mt-5 p-4 rounded-xl bg-[#0e2035] border border-[#1a3c61] text-left max-w-xs w-full text-xs text-zinc-300 shadow-xl">
            <p className="font-semibold text-[#dcab55] mb-2 flex items-center gap-1.5">
              <InfoIcon size={14} /> Solusi Akses dari HP (Wi-Fi):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#94a3b8]">
              <li>
                Di terminal PC/laptop, hentikan server lalu jalankan:
                <code className="block my-1 px-2 py-1 bg-[#08111d] text-[#dcab55] border border-[#1a3c61] rounded font-mono text-[10px]">
                  pnpm dev:https
                </code>
              </li>
              <li>
                Di browser HP, buka dengan awalan <strong>https://</strong>:
                <span className="block mt-0.5 text-white font-mono text-[10px]">
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
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#08111d] text-white text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <AlertTriangleIcon size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Kamera Tidak Tersedia</h2>
        <p className="text-xs text-[#94a3b8] mt-2 max-w-xs leading-relaxed">
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
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#08111d] via-[#0b1b2d] to-[#08111d] text-white text-center">
      {/* Logo Aplikasi Resmi */}
      <div className="relative w-24 h-24 rounded-3xl p-1 bg-gradient-to-b from-[#c5984f]/40 to-[#0e2b47]/80 border border-[#c5984f]/60 shadow-2xl flex items-center justify-center mb-5">
        <Image
          src="/app-icon.png"
          alt="Logo GeoPatriot Web"
          width={88}
          height={88}
          className="object-contain drop-shadow-xl"
          priority
        />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
        GeoPatriot Web
      </h1>
      <p className="text-xs font-semibold text-[#dcab55] mt-1 tracking-wide">
        Kamera GPS & Dokumentasi Lapangan
      </p>
      <p className="text-xs text-[#94a3b8] mt-2 max-w-xs leading-relaxed">
        Ambil foto dokumentasi dengan watermark lokasi dan waktu terverifikasi langsung dari browser
        tanpa upload ke server.
      </p>

      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={onRequestCamera}
          leftIcon={<CameraIcon size={20} />}
          className="shadow-2xl font-bold tracking-wide"
        >
          Buka Kamera
        </Button>
      </div>

      <p className="text-[11px] text-[#2f6d8b] mt-6 flex items-center gap-1.5 font-medium">
        <InfoIcon size={13} /> Akses kamera hanya digunakan untuk live preview lokal.
      </p>
    </div>
  );
}
