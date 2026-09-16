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
      // width/height "ideal" (bukan exact/min) diminta agar browser mencoba
      // resolusi sensor tinggi tanpa memicu OverconstrainedError pada device
      // dengan kamera lebih rendah — tanpa constraint ini browser sering
      // memilih default rendah (mis. 640x480) walau sensor mendukung lebih.
      video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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

// HTMLMediaElement.HAVE_CURRENT_DATA per spec (=2), literal agar tidak
// bergantung global HTMLMediaElement (tidak ada di environment test Node).
const HAVE_CURRENT_DATA = 2;

/**
 * Menunggu frame pertama video benar-benar ter-decode sebelum dianggap siap
 * di-capture. `videoWidth`/`videoHeight` bisa sudah terisi lewat event
 * `loadedmetadata` SEBELUM frame nyata tampil (`readyState < HAVE_CURRENT_DATA`)
 * — capture pada kondisi ini menghasilkan Blob valid berisi frame hitam
 * (audit finding: foto terbaru tampil hitam). Timeout tetap resolve (tidak
 * pernah menggantung kamera selamanya) karena ini pencegahan race, bukan
 * syarat mutlak — rules #3: capture tidak boleh diblokir tanpa batas waktu.
 */
export function waitForVideoFrame(
  video: HTMLVideoElement | null,
  timeoutMs = 3000,
): Promise<void> {
  return new Promise((resolve) => {
    if (!video || video.readyState >= HAVE_CURRENT_DATA) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);

    function handleLoadedData() {
      cleanup();
      resolve();
    }

    function cleanup() {
      clearTimeout(timer);
      video?.removeEventListener("loadeddata", handleLoadedData);
    }

    video.addEventListener("loadeddata", handleLoadedData);
  });
}

/**
 * Rentang kapabilitas native camera zoom yang dilaporkan oleh browser/hardware.
 * Sesuai W3C Image Capture spec (rules #3.8).
 */
export interface ZoomCapabilities {
  min: number;
  max: number;
  step: number;
}

/**
 * Mendapatkan kapabilitas zoom dari video track aktif.
 * Mengembalikan null jika browser atau kamera tidak mendukung MediaTrackCapabilities.zoom (rules #3.8, #3.9).
 */
export function getCameraZoomCapabilities(stream: MediaStream | null): ZoomCapabilities | null {
  if (!stream) return null;
  const track = stream.getVideoTracks()[0];
  if (!track || typeof track.getCapabilities !== "function") return null;

  try {
    const capabilities = track.getCapabilities() as {
      zoom?: { min?: number; max?: number; step?: number };
    };

    if (
      capabilities &&
      capabilities.zoom &&
      typeof capabilities.zoom.min === "number" &&
      typeof capabilities.zoom.max === "number" &&
      capabilities.zoom.max > capabilities.zoom.min
    ) {
      return {
        min: capabilities.zoom.min,
        max: capabilities.zoom.max,
        step:
          capabilities.zoom.step && capabilities.zoom.step > 0 ? capabilities.zoom.step : 0.1,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Membaca level zoom yang saat ini sedang aktif pada stream kamera.
 */
export function getCameraCurrentZoom(stream: MediaStream | null): number {
  if (!stream) return 1;
  const track = stream.getVideoTracks()[0];
  if (!track || typeof track.getSettings !== "function") return 1;

  try {
    const settings = track.getSettings() as { zoom?: number };
    return typeof settings.zoom === "number" ? settings.zoom : 1;
  } catch {
    return 1;
  }
}

/**
 * Menerapkan tingkat zoom pada kamera aktif melalui MediaTrackConstraints (rules #3.7).
 * Menggunakan format W3C advanced: [{ zoom }].
 */
export async function applyCameraZoom(
  stream: MediaStream | null,
  targetZoom: number,
): Promise<boolean> {
  if (!stream) return false;
  const track = stream.getVideoTracks()[0];
  if (!track || typeof track.applyConstraints !== "function") return false;

  try {
    await track.applyConstraints({
      advanced: [{ zoom: targetZoom } as MediaTrackConstraintSet],
    });
    return true;
  } catch (error) {
    console.warn("Gagal menerapkan camera zoom:", error);
    return false;
  }
}

/**
 * Menghitung tombol-tombol preset zoom adaptif berdasarkan kapabilitas min/max perangkat (rules #3.11).
 * Contoh: perangkat dengan max 3x menghasilkan [1, 2, 3].
 */
export function calculateZoomPresets(capabilities: ZoomCapabilities | null): number[] {
  if (!capabilities || capabilities.max <= capabilities.min) return [];

  const { min, max } = capabilities;
  const presets: number[] = [];

  // Level dasar 1x jika masuk dalam rentang min-max
  if (min <= 1 && max >= 1) {
    presets.push(1);
  } else {
    presets.push(Number(min.toFixed(1)));
  }

  // Tambahkan level kandidat umum kamera smartphone (2x, 3x, 5x) jika didukung
  const candidateLevels = [2, 3, 5];
  for (const level of candidateLevels) {
    if (max >= level && !presets.includes(level)) {
      presets.push(level);
    }
  }

  // Jika hanya ada 1 preset (misal max = 1.5x), tambahkan max sebagai alternatif
  if (presets.length === 1 && max > min) {
    const roundedMax = Number(max.toFixed(1));
    if (roundedMax > presets[0]) {
      presets.push(roundedMax);
    }
  }

  return presets.sort((a, b) => a - b);
}

