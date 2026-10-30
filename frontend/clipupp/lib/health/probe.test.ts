import { afterEach, describe, expect, it, vi } from "vitest";
import { probeBackend } from "./probe";

describe("probeBackend", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports up on a 200 readiness response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await probeBackend("http://backend:8080", 50)).toBe("up");
  });

  it("reports down on a non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })));
    expect(await probeBackend("http://backend:8080", 50)).toBe("down");
  });

  it("reports down when the fetch rejects or times out", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect(await probeBackend("http://backend:8080", 50)).toBe("down");
    vi.stubGlobal("fetch", vi.fn((_: string, init?: RequestInit) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    })));
    expect(await probeBackend("http://backend:8080", 20)).toBe("down");
  });
});
