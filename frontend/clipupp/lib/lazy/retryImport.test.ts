import { describe, expect, it, vi } from "vitest";
import { retryImport } from "./retryImport";

describe("retryImport", () => {
  it("resolves after a transient rejection", async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error("chunk")).mockResolvedValueOnce("ok");
    await expect(retryImport(fn, { retries: 2, delayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("rethrows the last error after the final attempt", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValueOnce(new Error("second"))
      .mockRejectedValueOnce(new Error("last"));
    await expect(retryImport(fn, { retries: 2, delayMs: 1 })).rejects.toThrow("last");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry a first-try success", async () => {
    const fn = vi.fn<() => Promise<number>>().mockResolvedValue(1);
    await expect(retryImport(fn)).resolves.toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
