import { zip, type Zippable } from "fflate";

/**
 * Web Worker khusus tahap kompresi ZIP (fflate.zip), agar CPU-bound work
 * tidak memblokir UI thread untuk sesi besar (50-200 foto ukuran asli).
 *
 * Worker ini HANYA menangani kompresi — tahap baca Blob->Uint8Array tetap
 * di main thread (src/lib/downloads/zip-download.ts) karena murah dan
 * sudah punya progress callback sendiri.
 *
 * Kontrak message:
 *   in:  { zippable: Record<string, Uint8Array> }
 *   out: { status: "success", buffer: ArrayBuffer } | { status: "error", message: string }
 */

export interface ZipWorkerRequest {
  zippable: Zippable;
}

export type ZipWorkerResponse =
  | { status: "success"; buffer: ArrayBuffer }
  | { status: "error"; message: string };

self.onmessage = (event: MessageEvent<ZipWorkerRequest>) => {
  const { zippable } = event.data;

  zip(zippable, (error, data) => {
    if (error) {
      const response: ZipWorkerResponse = {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengompresi ZIP di worker.",
      };
      self.postMessage(response);
      return;
    }

    const response: ZipWorkerResponse = { status: "success", buffer: data.buffer as ArrayBuffer };
    self.postMessage(response);
  });
};
