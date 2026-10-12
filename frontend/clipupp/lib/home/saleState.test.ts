import { describe, expect, it } from "vitest";
import { saleDateRange, saleState } from "./saleState";

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

describe("saleDateRange", () => {
  it("formats a same-month range in IST", () => {
    expect(saleDateRange("2026-10-02T00:00:00+05:30", "2026-10-16T12:00:00+05:30")).toBe("2 Oct to 16 Oct");
  });
  it("formats a range crossing a month", () => {
    expect(saleDateRange("2026-10-28T00:00:00+05:30", "2026-11-03T12:00:00+05:30")).toBe("28 Oct to 3 Nov");
  });
  it("uses IST not UTC for the day", () => {
    expect(saleDateRange("2026-10-01T20:00:00Z", "2026-10-15T20:00:00Z")).toBe("2 Oct to 16 Oct");
  });
});
