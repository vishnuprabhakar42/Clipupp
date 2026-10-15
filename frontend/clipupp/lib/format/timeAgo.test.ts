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
    expect(timeAgo("2026-10-12T11:59:40Z", now)).toEqual({ unit: "now", n: 0 });
    expect(timeAgo("2026-10-12T11:35:00Z", now)).toEqual({ unit: "m", n: 25 });
    expect(timeAgo("2026-10-12T10:00:00Z", now)).toEqual({ unit: "h", n: 2 });
    expect(timeAgo("2026-10-09T12:00:00Z", now)).toEqual({ unit: "d", n: 3 });
  });
  it("treats future timestamps as now", () => {
    expect(timeAgo("2026-10-12T13:00:00Z", now)).toEqual({ unit: "now", n: 0 });
  });
});
