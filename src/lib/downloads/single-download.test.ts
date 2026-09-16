import { describe, expect, it, vi } from "vitest";
import { downloadBlob, type DownloadEnvironment } from "./single-download";

function createFakeEnv(): { env: DownloadEnvironment; clickSpy: ReturnType<typeof vi.fn> } {
  const clickSpy = vi.fn();
  const env: DownloadEnvironment = {
    createObjectURL: vi.fn().mockReturnValue("blob:fake-url"),
    revokeObjectURL: vi.fn(),
    createAnchor: () => ({ href: "", download: "", click: clickSpy }),
  };
  return { env, clickSpy };
}

describe("downloadBlob", () => {
  it("membuat object URL, memicu klik anchor, lalu revoke URL", () => {
    const { env, clickSpy } = createFakeEnv();
    const blob = new Blob(["fake"], { type: "image/jpeg" });

    downloadBlob(blob, "GeoPatriot_2026-09-16_08-31-12.jpg", env);

    expect(env.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(env.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });
});
