import { describe, expect, it } from "vitest";
import type { Session } from "@/types/session";
import { createSession, deleteSession, getSession, listSessions } from "./session-repository";

function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    mode: "gps-auto-time",
    watermarkSettings: {
      template: "default",
      position: "bottom",
      opacity: 0.8,
      fontSizePx: 16,
      mapThumbnailSizePx: 96,
      marginPx: 12,
      radiusPx: 8,
      spacingPx: 4,
      alignment: "left",
      visibleFields: {
        locationName: true,
        address: true,
        coordinate: true,
        date: true,
        time: true,
        timezone: true,
        accuracy: true,
        altitude: false,
        mapThumbnail: true,
        customText: false,
        branding: true,
      },
    },
    ...overrides,
  };
}

describe("session-repository", () => {
  it("create -> get -> list -> delete berjalan sesuai lifecycle", async () => {
    const session = buildSession();

    const created = await createSession(session);
    expect(created.status).toBe("success");

    const fetched = await getSession(session.id);
    expect(fetched.status).toBe("success");
    if (fetched.status === "success") {
      expect(fetched.data.id).toBe(session.id);
    }

    const list = await listSessions();
    expect(list.status).toBe("success");
    if (list.status === "success") {
      expect(list.data.some((s) => s.id === session.id)).toBe(true);
    }

    const deleted = await deleteSession(session.id);
    expect(deleted.status).toBe("success");

    const afterDelete = await getSession(session.id);
    expect(afterDelete.status).toBe("error");
    expect(afterDelete.status === "error" && afterDelete.reason).toBe("not-found");
  });
});
