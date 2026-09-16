import { describe, expect, it, vi, afterEach } from "vitest";
import { zip, unzipSync } from "fflate";
import type { ZipWorkerRequest } from "./zip-worker";

/**
 * Menguji PROTOKOL pemilihan jalur Worker vs fallback main-thread di
 * createZipBlob (audit finding: ZIP main-thread berisiko UI freeze).
 * Karena Vitest berjalan di Node (tanpa Worker asli), kita mock global
 * `Worker` untuk memverifikasi: (a) jalur worker dipakai & hasilnya benar,
 * (b) fallback otomatis ke main-thread saat worker error, (c) fallback
 * otomatis saat construct Worker throw. Jalur fallback itu sendiri sudah
 * tercakup otomatis oleh seluruh test lain di zip-download.test.ts karena
 * `Worker` tidak ada secara default di environment Node.
 */

class FakeWorkerSuccess {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminate = vi.fn();
  postMessage(message: ZipWorkerRequest) {
    // Kompresi nyata via fflate, disimulasikan berjalan di "worker" (microtask async).
    queueMicrotask(() => {
      zip(message.zippable, (error, data) => {
        if (error) {
          this.onerror?.({ message: error.message } as ErrorEvent);
          return;
        }
        this.onmessage?.({
          data: { status: "success", buffer: data.buffer },
        } as MessageEvent);
      });
    });
  }
}

class FakeWorkerAlwaysErrors {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminate = vi.fn();
  postMessage() {
    queueMicrotask(() => {
      this.onerror?.({ message: "Simulasi worker crash" } as ErrorEvent);
    });
  }
}

class FakeWorkerThrowsOnConstruct {
  constructor() {
    throw new Error("Simulasi Worker tidak bisa di-construct (browser tidak dukung modul di worker)");
  }
}

describe("createZipBlob - protokol Worker vs fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("memakai jalur Worker saat tersedia & sukses, hasil ZIP identik dengan entries", async () => {
    vi.stubGlobal("Worker", FakeWorkerSuccess);
    const { createZipBlob } = await import("./zip-download");

    const entries = [
      { filename: "foto-1.jpg", blob: new Blob(["konten-1"]) },
      { filename: "foto-2.jpg", blob: new Blob(["konten-2"]) },
    ];

    const result = await createZipBlob(entries);
    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    const buffer = new Uint8Array(await result.blob.arrayBuffer());
    const unzipped = unzipSync(buffer);
    expect(Object.keys(unzipped).sort()).toEqual(["foto-1.jpg", "foto-2.jpg"]);
    expect(new TextDecoder().decode(unzipped["foto-1.jpg"])).toBe("konten-1");
    expect(new TextDecoder().decode(unzipped["foto-2.jpg"])).toBe("konten-2");
  });

  it("fallback ke kompresi main-thread saat worker memanggil onerror", async () => {
    vi.stubGlobal("Worker", FakeWorkerAlwaysErrors);
    const { createZipBlob } = await import("./zip-download");

    const entries = [{ filename: "foto-1.jpg", blob: new Blob(["konten-1"]) }];
    const result = await createZipBlob(entries);

    // Fallback harus tetap menghasilkan ZIP sukses walau worker gagal total.
    expect(result.status).toBe("success");
  });

  it("fallback ke kompresi main-thread saat construct Worker throw", async () => {
    vi.stubGlobal("Worker", FakeWorkerThrowsOnConstruct);
    const { createZipBlob } = await import("./zip-download");

    const entries = [{ filename: "foto-1.jpg", blob: new Blob(["konten-1"]) }];
    const result = await createZipBlob(entries);

    expect(result.status).toBe("success");
  });
});
