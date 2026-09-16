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

export type ZipResult = { status: "success"; blob: Blob } | { status: "error"; message: string };

/** Membuat satu file ZIP dari kumpulan foto (in-memory, tanpa server). */
export async function createZipBlob(entries: ZipEntry[]): Promise<ZipResult> {
  if (entries.length === 0) {
    return { status: "error", message: "Tidak ada foto yang dipilih untuk di-ZIP." };
  }

  try {
    const zippable: Zippable = {};
    for (const entry of entries) {
      const arrayBuffer = await entry.blob.arrayBuffer();
      zippable[entry.filename] = new Uint8Array(arrayBuffer);
    }

    const zippedBytes = await new Promise<Uint8Array>((resolve, reject) => {
      zip(zippable, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data);
      });
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
