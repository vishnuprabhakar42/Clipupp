import { describe, expect, it } from "vitest";
import { timeAgo } from "./timeAgo";

const now = new Date("2026-10-12T12:00:00Z");

describe("timeAgo", () => {
  it("returns null for null, undefined or garbage", () => {
    expect(timeAgo(null, now)).toBeNull();
    expect(timeAgo(undefined, now)).toBeNull();
    expect(timeAgo("not a date", now)).toBeNull();
  });
  it("formats minutes, hours and days", () => {
    expect(timeAgo("2026-10-12T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-10-12T11:35:00Z", now)).toBe("25m ago");
    expect(timeAgo("2026-10-12T10:00:00Z", now)).toBe("2h ago");
    expect(timeAgo("2026-10-09T12:00:00Z", now)).toBe("3d ago");
  });
  it("treats future timestamps as just now", () => {
    expect(timeAgo("2026-10-12T13:00:00Z", now)).toBe("just now");
  });
});
