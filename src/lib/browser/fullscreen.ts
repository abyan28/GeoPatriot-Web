/**
 * Wrapper tipis di atas Fullscreen API browser.
 * Cross-vendor: standar + `webkit*` untuk Safari yang belum/baru dukung
 * elemen sembarang (iOS Safari baru dukung generic-element fullscreen sejak
 * versi relatif baru, ~16.4+, dan perilakunya bisa berbeda dari Chrome).
 *
 * Semua fungsi TIDAK PERNAH throw — Fullscreen adalah enhancement opsional
 * (PRD: "Fullscreen API adalah enhancement, bukan dependency utama aplikasi"),
 * kegagalan dikembalikan sebagai status eksplisit agar caller bisa
 * menampilkan feedback ringan tanpa mengganggu kamera/session.
 */

/** Elemen dengan API fullscreen standar + fallback vendor-prefixed (Safari lama). */
interface FullscreenCapableElement extends Element {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenCapableDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

function getDoc(): FullscreenCapableDocument | null {
  if (typeof document === "undefined") return null;
  return document as FullscreenCapableDocument;
}

/** Mengecek apakah browser saat ini mendukung Fullscreen API sama sekali. */
export function isFullscreenSupported(): boolean {
  const doc = getDoc();
  if (!doc) return false;
  return Boolean(doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? false);
}

/** Mengambil elemen yang sedang fullscreen saat ini, atau null bila tidak ada. */
export function getFullscreenElement(): Element | null {
  const doc = getDoc();
  if (!doc) return null;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export type FullscreenResult = { status: "success" } | { status: "error"; message: string };

/** Meminta elemen tertentu masuk ke mode fullscreen. Tidak pernah throw. */
export async function requestFullscreen(element: Element): Promise<FullscreenResult> {
  try {
    const el = element as FullscreenCapableElement;
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen();
    } else if (typeof el.webkitRequestFullscreen === "function") {
      await el.webkitRequestFullscreen();
    } else {
      return { status: "error", message: "Fullscreen API tidak didukung browser ini." };
    }
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal masuk mode layar penuh.",
    };
  }
}

/** Keluar dari mode fullscreen aktif. Tidak pernah throw. */
export async function exitFullscreen(): Promise<FullscreenResult> {
  try {
    const doc = getDoc();
    if (!doc) return { status: "error", message: "Document tidak tersedia." };

    if (typeof doc.exitFullscreen === "function") {
      await doc.exitFullscreen();
    } else if (typeof doc.webkitExitFullscreen === "function") {
      await doc.webkitExitFullscreen();
    } else {
      return { status: "error", message: "Fullscreen API tidak didukung browser ini." };
    }
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal keluar mode layar penuh.",
    };
  }
}
