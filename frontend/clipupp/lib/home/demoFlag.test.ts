import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDemoFeedEnabled } from "./demoFlag";

describe("isDemoFeedEnabled", () => {
  // The default parameter reads process.env, so the "unset" cases must not
  // inherit whatever the shell or CI job exported.
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_HOME_DEMO_FEED", undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
  it("ignores an inherited environment value when the caller passes nothing", () => {
    vi.stubEnv("NEXT_PUBLIC_HOME_DEMO_FEED", "true");
    expect(isDemoFeedEnabled(undefined, "production")).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_HOME_DEMO_FEED", undefined);
    expect(isDemoFeedEnabled(undefined, "production")).toBe(false);
  });
});
