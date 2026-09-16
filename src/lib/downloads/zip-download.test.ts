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
});
