import { describe, expect, it, vi } from "vitest";

/**
 * Test terpisah khusus skenario kegagalan kompresi fflate.zip() itu sendiri
 * (bukan hanya precheck "entries kosong"). Dipisah dari zip-download.test.ts
 * karena butuh mock modul "fflate" di level module, yang akan mengganggu
 * test sukses lain bila digabung dalam satu file (audit finding AUD-07).
 */
vi.mock("fflate", () => ({
  zip: (
    _entries: unknown,
    callback: (error: Error | null, data: Uint8Array | null) => void,
  ) => {
    callback(new Error("Simulasi kegagalan kompresi fflate"), null);
  },
}));

describe("createZipBlob - kegagalan kompresi fflate", () => {
  it("mengembalikan status error (bukan throw) saat fflate.zip() gagal", async () => {
    const { createZipBlob } = await import("./zip-download");

    const entries = [
      { filename: "foto-1.jpg", blob: new Blob(["konten-1"]) },
      { filename: "foto-2.jpg", blob: new Blob(["konten-2"]) },
    ];

    const result = await createZipBlob(entries);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("Simulasi kegagalan kompresi fflate");
    }
  });
});
