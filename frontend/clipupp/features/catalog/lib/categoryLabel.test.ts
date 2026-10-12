import { describe, expect, it } from "vitest";
import { categoryLabel } from "./categoryLabel";

describe("categoryLabel", () => {
  it("keeps every word of a multi-word slug", () => {
    expect(categoryLabel("live-events")).toBe("Live events");
    expect(categoryLabel("gym-and-fitness")).toBe("Gym and fitness");
  });
  it("handles single words and stray dashes", () => {
    expect(categoryLabel("fashion")).toBe("Fashion");
    expect(categoryLabel("-travel-")).toBe("Travel");
  });
});
