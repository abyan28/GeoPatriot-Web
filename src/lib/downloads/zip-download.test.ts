import { describe, expect, it } from "vitest";
import { createZipBlob } from "./zip-download";

describe("createZipBlob", () => {
  it("mengembalikan error saat entries kosong (bukan ZIP kosong senyap)", async () => {
    const result = await createZipBlob([]);
    expect(result.status).toBe("error");
  });

  it("menghasilkan Blob ZIP valid dari beberapa foto", async () => {
    const entries = [
      { filename: "GeoPatriot_2026-09-16_08-31-12.jpg", blob: new Blob(["foto-1"]) },
      { filename: "GeoPatriot_2026-09-16_08-32-07.jpg", blob: new Blob(["foto-2"]) },
    ];

    const result = await createZipBlob(entries);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.blob.type).toBe("application/zip");
      expect(result.blob.size).toBeGreaterThan(0);
    }
  });

  it("memanggil onProgress callback dengan tahapan progres yang valid", async () => {
    const entries = [
      { filename: "foto-1.jpg", blob: new Blob(["konten-1"]) },
      { filename: "foto-2.jpg", blob: new Blob(["konten-2"]) },
    ];

    const progressUpdates: Array<{ phase: string; percent: number }> = [];
    const result = await createZipBlob(entries, (p) => {
      progressUpdates.push({ phase: p.phase, percent: p.percent });
    });

    expect(result.status).toBe("success");
    expect(progressUpdates.length).toBeGreaterThanOrEqual(3);
    expect(progressUpdates.some((p) => p.phase === "reading")).toBe(true);
    expect(progressUpdates.some((p) => p.phase === "compressing")).toBe(true);
    expect(progressUpdates.some((p) => p.phase === "done" && p.percent === 100)).toBe(true);
  });
});
