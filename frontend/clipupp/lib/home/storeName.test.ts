import { describe, expect, it } from "vitest";
import { displayShortName } from "./storeName";

describe("displayShortName", () => {
  it("strips a trailing India", () => {
    expect(displayShortName("Amazon India")).toBe("Amazon");
    expect(displayShortName("Nike india")).toBe("Nike");
  });
  it("keeps names without a trailing India", () => {
    expect(displayShortName("Flipkart")).toBe("Flipkart");
    expect(displayShortName("India Today")).toBe("India Today");
  });
  it("never returns an empty name", () => {
    expect(displayShortName("India")).toBe("India");
  });
});
