import { describe, expect, it } from "vitest";
import { shortCount } from "./short";

describe("shortCount", () => {
  it.each([
    [0, "0"],
    [276, "276"],
    [999, "999"],
    [6400, "6.4K"],
    [6000, "6K"],
    [12040, "12K"],
    [89000, "89K"],
    [1_200_000, "1.2M"],
  ])("%d -> %s", (n, out) => {
    expect(shortCount(n)).toBe(out);
  });
});
