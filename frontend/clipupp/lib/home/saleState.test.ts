import { describe, expect, it } from "vitest";
import { saleDay, saleState } from "./saleState";

const now = new Date("2026-10-10T06:00:00Z");

describe("saleState", () => {
  it("is live between start and end", () => {
    expect(saleState("2026-10-02T00:00:00Z", "2026-10-16T00:00:00Z", now)).toBe("live");
  });
  it("is soon before start", () => {
    expect(saleState("2026-10-12T00:00:00Z", "2026-10-16T00:00:00Z", now)).toBe("soon");
  });
  it("is ended after end", () => {
    expect(saleState("2026-10-01T00:00:00Z", "2026-10-09T00:00:00Z", now)).toBe("ended");
  });
});

describe("saleDay", () => {
  it("formats day and month in IST", () => {
    expect(saleDay("2026-10-02T00:00:00+05:30", "en")).toBe("2 Oct");
    expect(saleDay("2026-11-03T12:00:00+05:30", "en")).toBe("3 Nov");
    expect(saleDay("2026-09-03T12:00:00+05:30", "en")).toBe("3 Sep");
  });
  it("uses IST not UTC for the day", () => {
    expect(saleDay("2026-10-01T20:00:00Z", "en")).toBe("2 Oct");
  });
  it("formats in the active locale", () => {
    expect(saleDay("2026-10-02T00:00:00+05:30", "hi-IN")).not.toMatch(/Oct/);
    expect(saleDay("2026-10-02T00:00:00+05:30", "hi-IN")).toMatch(/^2 /);
  });
});
