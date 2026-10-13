import { describe, expect, it } from "vitest";
import { festivalDaysAway } from "./festival";

describe("festivalDaysAway", () => {
  const date = "2026-11-08";
  it("counts days ahead", () => {
    expect(festivalDaysAway(date, new Date("2026-10-12T06:00:00Z"))).toBe(27);
  });
  it("is 1 the day before", () => {
    expect(festivalDaysAway(date, new Date("2026-11-07T06:00:00Z"))).toBe(1);
  });
  it("is 0 on the day", () => {
    expect(festivalDaysAway(date, new Date("2026-11-08T20:00:00+05:30"))).toBe(0);
  });
  it("is null after the day", () => {
    expect(festivalDaysAway(date, new Date("2026-11-09T00:30:00+05:30"))).toBeNull();
  });
  it("uses IST calendar days near midnight", () => {
    // 2026-11-07T19:00Z is already 8 Nov 00:30 IST
    expect(festivalDaysAway(date, new Date("2026-11-07T19:00:00Z"))).toBe(0);
  });
  it("is null for an unreadable date", () => {
    expect(festivalDaysAway("soon", new Date("2026-11-07T19:00:00Z"))).toBeNull();
  });
});
