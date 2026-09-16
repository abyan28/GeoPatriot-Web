/**
 * Wrapper tipis di atas Media Capture API (getUserMedia) untuk kebutuhan kamera.
 * Lihat agents/rules-geopatriot-web.md #3 dan agents/workflow-geopatriot-web.md #4.
 *
 * Penting: fungsi di sini TIDAK boleh dipanggil otomatis saat modul di-load.
 * Permission kamera hanya boleh diminta ketika pengguna benar-benar masuk ke
 * fitur kamera (rules #3.2).
 */

/** Status eksplisit kamera, dipakai UI untuk menampilkan state yang sesuai (workflow #16). */
export type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unsupported" | "error";

/** Arah kamera yang diminta. */
export type CameraFacingMode = "user" | "environment";

/** Hasil upaya menyalakan kamera: status eksplisit + stream (bila berhasil) + pesan error. */
export interface CameraStartResult {
  status: CameraStatus;
  stream?: MediaStream;
  errorMessage?: string;
}

/** Mengecek apakah browser saat ini mendukung getUserMedia sama sekali. */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Mengecek apakah halaman berjalan di Secure Context (HTTPS atau localhost).
 * Standar browser memblokir getUserMedia secara otomatis pada koneksi HTTP non-localhost.
 */
export function isSecureContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext !== false;
}

/**
 * Menyalakan kamera dengan facing mode tertentu.
 * Mengembalikan status eksplisit alih-alih melempar exception mentah,
 * supaya lapisan UI dapat menampilkan pesan/izin yang sesuai (rules #3.3).
 */
export async function startCamera(
  facingMode: CameraFacingMode = "environment",
): Promise<CameraStartResult> {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return {
      status: "unsupported",
      errorMessage:
        "Akses kamera memerlukan koneksi aman (HTTPS). Browser memblokir kamera saat diakses melalui HTTP biasa pada IP jaringan lokal (192.168.x.x).",
    };
  }

  if (!isCameraSupported()) {
    return { status: "unsupported", errorMessage: "Browser tidak mendukung akses kamera." };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });
    return { status: "ready", stream };
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      return { status: "denied", errorMessage: "Izin kamera ditolak oleh pengguna." };
    }
    return {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Gagal mengakses kamera.",
    };
  }
}

/** Menghentikan seluruh track pada stream kamera yang sedang aktif. */
export function stopCamera(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/**
 * Beralih kamera (depan/belakang) dengan mematikan stream lama lalu
 * menyalakan stream baru pada facing mode yang diminta.
 */
export async function switchCamera(
  currentStream: MediaStream,
  nextFacingMode: CameraFacingMode,
): Promise<CameraStartResult> {
  stopCamera(currentStream);
  return startCamera(nextFacingMode);
}
