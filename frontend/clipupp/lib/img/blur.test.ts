import { describe, expect, it } from "vitest";
import { blurDataUrl } from "./blur";

describe("blurDataUrl", () => {
  it("returns an svg data url carrying the colour", () => {
    const u = blurDataUrl("#e8eefc");
    expect(u.startsWith("data:image/svg+xml")).toBe(true);
    expect(decodeURIComponent(u)).toContain("#e8eefc");
  });
});
