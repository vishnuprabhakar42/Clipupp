import { describe, expect, it } from "vitest";
import { isDemoFeedEnabled } from "./demoFlag";

describe("isDemoFeedEnabled", () => {
  it("is on for \"true\" anywhere", () => {
    expect(isDemoFeedEnabled("true", "production")).toBe(true);
  });
  it("defaults on in development, off elsewhere", () => {
    expect(isDemoFeedEnabled(undefined, "development")).toBe(true);
    expect(isDemoFeedEnabled(undefined, "production")).toBe(false);
    expect(isDemoFeedEnabled(undefined, "test")).toBe(false);
  });
  it("\"false\" turns development off", () => {
    expect(isDemoFeedEnabled("false", "development")).toBe(false);
  });
});
