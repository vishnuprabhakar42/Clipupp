import { describe, expect, it } from "vitest";
import { rootCategoryOf } from "./categoryLabel";

describe("rootCategoryOf", () => {
  const cats = [
    { id: "fashion", parent: null },
    { id: "mens-clothing", parent: "fashion" },
    { id: "gadgets" },
    { id: "orphan", parent: "missing" },
  ];
  it("maps a leaf to its root", () => expect(rootCategoryOf("mens-clothing", cats)).toBe("fashion"));
  it("keeps a root", () => expect(rootCategoryOf("fashion", cats)).toBe("fashion"));
  it("falls back to the leaf when no root is known", () => {
    expect(rootCategoryOf("gadgets", cats)).toBe("gadgets");
    expect(rootCategoryOf("orphan", cats)).toBe("orphan");
    expect(rootCategoryOf("unknown", cats)).toBe("unknown");
  });
});
