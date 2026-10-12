import { describe, expect, it } from "vitest";
import { formatCount } from "./number";

describe("formatCount", () => {
  it("groups with en-IN separators", () => {
    expect(formatCount(1204)).toBe("1,204");
    expect(formatCount(129999)).toBe("1,29,999");
    expect(formatCount(0)).toBe("0");
  });
});
