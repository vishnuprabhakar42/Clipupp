import { describe, expect, it } from "vitest";
import { contrastRatio, monogramInk, readableInk } from "./contrast";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#fff", "#e91e63")).toBeCloseTo(4.34, 1);
  });
  it("returns null for non-hex colours", () => {
    expect(contrastRatio("var(--x)", "#fff")).toBeNull();
  });
});

describe("readableInk", () => {
  it("keeps white on dark brand colours", () => {
    expect(readableInk("#2c3e50")).toBe("#FFFFFF");
  });
  it("switches to near-black purple on light or mid colours that fail 4.5:1", () => {
    expect(readableInk("#ffc72c")).toBe("#170A2E");
    expect(readableInk("#fc8019")).toBe("#170A2E");
    expect(readableInk("#0b8f77")).toBe("#170A2E");
  });
  it("keeps the better ink when neither reaches 4.5:1", () => {
    expect(readableInk("#e91e63")).toBe("#FFFFFF");
  });
  it("keeps a preferred colour that already passes", () => {
    expect(readableInk("#ffffff", "#2A0F52")).toBe("#2A0F52");
  });
  it("keeps the preferred colour for CSS-variable backgrounds", () => {
    expect(readableInk("var(--clipupp-logo-bg)", "var(--clipupp-deep)")).toBe("var(--clipupp-deep)");
  });
});

describe("monogramInk", () => {
  it("flags tiles where even the best ink stays under 4.5:1", () => {
    expect(monogramInk("#e91e63")).toEqual({ ink: "#FFFFFF", lowContrast: true });
  });
  it("does not flag tiles that reach 4.5:1", () => {
    expect(monogramInk("#fc8019", "#fff")).toEqual({ ink: "#170A2E", lowContrast: false });
  });
  it("does not flag CSS-variable backgrounds", () => {
    expect(monogramInk("var(--x)", "var(--y)").lowContrast).toBe(false);
  });
});
