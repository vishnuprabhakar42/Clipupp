import { describe, expect, it } from "vitest";
import { ctaLabel, headline } from "./couponCta";

describe("ctaLabel", () => {
  it("is Show code only when a code exists", () => {
    expect(ctaLabel({ type: "CODE", code: "MYNTRA12" })).toBe("Show code");
    expect(ctaLabel({ type: "CODE", code: null })).toBe("Get deal");
    expect(ctaLabel({ type: "DEAL", code: null })).toBe("Get deal");
    expect(ctaLabel({ type: "FREE_SHIPPING", code: "SHIP" })).toBe("Show code");
  });
});

describe("headline", () => {
  it("prefers the savings label, falls back to title", () => {
    expect(headline({ savingsLabel: "Up to 12% off", title: "x" })).toBe("Up to 12% off");
    expect(headline({ savingsLabel: "  ", title: "Flat 500 off" })).toBe("Flat 500 off");
    expect(headline({ savingsLabel: null, title: "Flat 500 off" })).toBe("Flat 500 off");
  });
});
