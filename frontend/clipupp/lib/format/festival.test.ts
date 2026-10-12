import { describe, expect, it } from "vitest";
import { festivalLabel } from "./festival";

describe("festivalLabel", () => {
  const date = "2026-11-08";
  it("counts days ahead", () => {
    expect(festivalLabel("Diwali", date, new Date("2026-10-12T06:00:00Z"))).toBe("Diwali in 27 days");
  });
  it("says tomorrow", () => {
    expect(festivalLabel("Diwali", date, new Date("2026-11-07T06:00:00Z"))).toBe("Diwali is tomorrow");
  });
  it("greets on the day", () => {
    expect(festivalLabel("Diwali", date, new Date("2026-11-08T20:00:00+05:30"))).toBe("Happy Diwali!");
  });
  it("returns null after the day", () => {
    expect(festivalLabel("Diwali", date, new Date("2026-11-09T00:30:00+05:30"))).toBeNull();
  });
  it("uses IST calendar days near midnight", () => {
    // 2026-11-07T19:00Z is already 8 Nov 00:30 IST
    expect(festivalLabel("Diwali", date, new Date("2026-11-07T19:00:00Z"))).toBe("Happy Diwali!");
  });
});
