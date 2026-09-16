import { describe, expect, it } from "vitest";
import { deleteSetting, getSetting, setSetting } from "./settings-repository";

describe("settings-repository", () => {
  it("set -> get -> delete berjalan sesuai lifecycle", async () => {
    await setSetting("watermark-template", "detail");

    const fetched = await getSetting<string>("watermark-template");
    expect(fetched.status).toBe("success");
    expect(fetched.status === "success" && fetched.data).toBe("detail");

    await deleteSetting("watermark-template");
    const afterDelete = await getSetting("watermark-template");
    expect(afterDelete.status).toBe("error");
  });

  it("mengembalikan not-found untuk key yang belum pernah diset", async () => {
    const result = await getSetting("never-set-key");
    expect(result.status).toBe("error");
    expect(result.status === "error" && result.reason).toBe("not-found");
  });
});
