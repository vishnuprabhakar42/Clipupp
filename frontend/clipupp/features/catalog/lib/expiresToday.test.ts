import { describe, expect, it } from "vitest";
import { expiresToday } from "./expiresToday";

const now = new Date("2026-10-12T10:00:00Z");

describe("expiresToday", () => {
  it("is true later the same IST day", () => {
    expect(expiresToday("2026-10-12T17:00:00Z", now)).toBe(true);
  });
  it("is false once IST has rolled to the next day", () => {
    expect(expiresToday("2026-10-12T19:00:00Z", now)).toBe(false);
  });
  it("is false when already past", () => {
    expect(expiresToday("2026-10-12T09:00:00Z", now)).toBe(false);
  });
  it("is false for null and invalid input", () => {
    expect(expiresToday(null, now)).toBe(false);
    expect(expiresToday("garbage", now)).toBe(false);
  });
});
