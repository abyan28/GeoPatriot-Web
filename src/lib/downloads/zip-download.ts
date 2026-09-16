import { zip, type Zippable } from "fflate";

/**
 * Generator ZIP client-side untuk download batch/all foto sesi.
 * Lihat agents/prd-geopatriot-web.md #15 dan agents/rules-geopatriot-web.md #10.4-10.5.
 *
 * PENTING: kegagalan ZIP tidak boleh menghapus foto sumber (rules #10.5) —
 * itu tanggung jawab pemanggil (jangan menghapus foto sebelum ZIP berhasil dibuat).
 * Fungsi ini murni membuat Blob ZIP, tidak menyentuh storage.
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

    const zippedBytes = await new Promise<Uint8Array>((resolve, reject) => {
      zip(zippable, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data);
      });
    });

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
