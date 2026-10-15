import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./isChunkLoadError";

describe("isChunkLoadError", () => {
  it("recognises webpack and browser chunk failures", () => {
    const named = Object.assign(new Error("x"), { name: "ChunkLoadError" });
    expect(isChunkLoadError(named)).toBe(true);
    expect(isChunkLoadError(new Error("Loading chunk 123 failed."))).toBe(true);
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: /a.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
  });

  it("leaves ordinary render errors alone", () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError("Loading chunk")).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});
