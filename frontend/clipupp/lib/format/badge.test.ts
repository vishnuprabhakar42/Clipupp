import { describe, expect, it } from "vitest";
import { badgeFor } from "./badge";

describe("badgeFor", () => {
  it("prefers a percentage", () => {
    expect(badgeFor({ savingsLabel: "Save up to 12% extra", title: "x", code: "A" })).toBe("12%");
  });
  it("falls back to a rupee amount", () => {
    expect(badgeFor({ savingsLabel: "Flat ₹500 off on ₹2,999", title: "x", code: null })).toBe("₹500");
  });
  it("returns Deal when nothing matches", () => {
    expect(badgeFor({ savingsLabel: "Free shipping", title: "Free delivery", code: null })).toBe("Deal");
  });
  it("uses the title when the label is null", () => {
    expect(badgeFor({ savingsLabel: null, title: "Extra 7% off for Prime", code: null })).toBe("7%");
    expect(badgeFor({ savingsLabel: null, title: "Flat ₹ 125 off", code: null })).toBe("₹125");
  });
  it("finds a percentage in the title before a rupee amount in the label", () => {
    expect(badgeFor({ savingsLabel: "₹100 off", title: "10% off", code: null })).toBe("10%");
  });
});
