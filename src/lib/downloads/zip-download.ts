import { zip, type Zippable } from "fflate";
import type { ZipWorkerRequest, ZipWorkerResponse } from "./zip-worker";

/**
 * Generator ZIP client-side untuk download batch/all foto sesi.
 * Lihat agents/prd-geopatriot-web.md #15 dan agents/rules-geopatriot-web.md #10.4-10.5.
 *
 * PENTING: kegagalan ZIP tidak boleh menghapus foto sumber (rules #10.5) —
 * itu tanggung jawab pemanggil (jangan menghapus foto sebelum ZIP berhasil dibuat).
 * Fungsi ini murni membuat Blob ZIP, tidak menyentuh storage.
 *
 * Tahap kompresi (CPU-bound) dijalankan di Web Worker bila tersedia, agar
 * tidak memblokir UI thread pada sesi besar. Bila Worker tidak tersedia atau
 * gagal (construct/timeout/onerror), otomatis fallback ke kompresi sinkron
 * di main thread — capture/download tidak pernah gagal hanya karena Worker
 * bermasalah (selaras rules #10.5/#10.7).
 */

export interface ZipEntry {
  filename: string;
  blob: Blob;
}

export interface ZipProgressInfo {
  phase: "reading" | "compressing" | "done";
  current: number;
  total: number;
  filename?: string;
  percent: number;
}

export type ZipProgressCallback = (progress: ZipProgressInfo) => void;

export type ZipResult = { status: "success"; blob: Blob } | { status: "error"; message: string };

const WORKER_TIMEOUT_MS = 30000;

/**
 * Menjalankan kompresi fflate.zip() secara sinkron di thread pemanggil.
 * Dipakai sebagai jalur utama bila Worker tidak tersedia, dan sebagai
 * fallback bila jalur Worker gagal.
 */
function compressSync(zippable: Zippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(zippable, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });
}

/**
 * Menjalankan kompresi fflate.zip() di Web Worker terpisah agar tidak
 * memblokir UI thread. TIDAK memakai transfer list pada postMessage
 * (structured-clone copy, bukan transfer/detach) — dengan sengaja, agar
 * `zippable` di main thread tetap valid untuk fallback bila worker gagal.
 * Dibatasi timeout agar worker yang hang tidak pernah menggantung proses
 * download selamanya.
 */
function compressInWorker(zippable: Zippable, timeoutMs = WORKER_TIMEOUT_MS): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./zip-worker.ts", import.meta.url));
    } catch (error) {
      reject(error);
      return;
    }

    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Timeout menunggu kompresi ZIP di Worker."));
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<ZipWorkerResponse>) => {
      clearTimeout(timer);
      worker.terminate();
      const response = event.data;
      if (response.status === "success") {
        resolve(new Uint8Array(response.buffer));
      } else {
        reject(new Error(response.message));
      }
    };

    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(event.message || "Worker ZIP mengalami error."));
    };

    const request: ZipWorkerRequest = { zippable };
    worker.postMessage(request);
  });
}

/** Membuat satu file ZIP dari kumpulan foto (in-memory, tanpa server). */
export async function createZipBlob(
  entries: ZipEntry[],
  onProgress?: ZipProgressCallback,
): Promise<ZipResult> {
  if (entries.length === 0) {
    return { status: "error", message: "Tidak ada foto yang dipilih untuk di-ZIP." };
  }

  try {
    const total = entries.length;
    const zippable: Zippable = {};

    for (let i = 0; i < total; i++) {
      const entry = entries[i];
      const percent = Math.round(((i + 0.5) / total) * 60);
      onProgress?.({
        phase: "reading",
        current: i + 1,
        total,
        filename: entry.filename,
        percent,
      });

      const arrayBuffer = await entry.blob.arrayBuffer();
      zippable[entry.filename] = new Uint8Array(arrayBuffer);

      onProgress?.({
        phase: "reading",
        current: i + 1,
        total,
        filename: entry.filename,
        percent: Math.round(((i + 1) / total) * 60),
      });
    }

    onProgress?.({
      phase: "compressing",
      current: total,
      total,
      percent: 75,
    });

    // Coba jalur Worker dulu (tidak memblokir UI thread); fallback otomatis
    // ke kompresi sinkron bila Worker tidak tersedia atau gagal apa pun
    // alasannya. `zippable` masih valid untuk fallback karena tidak
    // ditransfer (structured-clone copy) ke worker.
    let zippedBytes: Uint8Array;
    if (typeof Worker !== "undefined") {
      try {
        zippedBytes = await compressInWorker(zippable);
      } catch {
        zippedBytes = await compressSync(zippable);
      }
    } else {
      zippedBytes = await compressSync(zippable);
    }

    onProgress?.({
      phase: "done",
      current: total,
      total,
      percent: 100,
    });

    return {
      status: "success",
      blob: new Blob([zippedBytes.buffer as ArrayBuffer], { type: "application/zip" }),
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Gagal membuat file ZIP.",
    };
  }
}
