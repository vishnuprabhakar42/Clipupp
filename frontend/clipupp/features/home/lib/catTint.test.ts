import { describe, expect, it } from "vitest";
import { DEFAULT_TINT, catTint } from "./catTint";

describe("catTint", () => {
  it("matches exact and prefixed slugs", () => {
    expect(catTint("electronics").fg).toBe("#1f3f9a");
    expect(catTint("home-living").fg).toBe("#a1500f");
  });
  it("falls back to the default tint", () => {
    expect(catTint(null)).toEqual(DEFAULT_TINT);
    expect(catTint("travel")).toEqual(DEFAULT_TINT);
  });
});
