import { describe, expect, it } from "vitest";
import { STORE_COLS, fit, storeRows } from "./storeRows";

const TOTALS = [5, 11, 12, 13, 40];

describe("storeRows", () => {
  for (const [label, cols, key, tileKey] of [
    ["phone", STORE_COLS.phone, "phone", "tilePhone"],
    ["wide", STORE_COLS.wide, "wide", "tileWide"],
  ] as const) {
    const cap = cols * 2;
    describe(`${cols} columns (${label}, ${cap} cells)`, () => {
      for (const total of TOTALS) {
        const r = storeRows(total);
        const cells = r[key] + (r[tileKey] ? 1 : 0);
        if (total > cap) {
          it(`${total} stores overflow: ${cap - 1} tiles plus the All stores tile fill exactly two rows`, () => {
            expect(r[key]).toBe(cap - 1);
            expect(r[tileKey]).toBe(true);
            expect(cells).toBe(cap);
            expect(cells % cols).toBe(0);
          });
        } else {
          it(`${total} stores fit: every store shows and there is no All stores tile`, () => {
            expect(r[key]).toBe(total);
            expect(r[tileKey]).toBe(false);
            expect(cells).toBeLessThanOrEqual(cap);
          });
        }
      }
    });
  }

  it("the All stores tile never sits alone on a row", () => {
    for (let total = 1; total <= 60; total++) {
      const r = storeRows(total);
      if (r.tilePhone) expect((r.phone + 1) % STORE_COLS.phone).toBe(0);
      if (r.tileWide) expect((r.wide + 1) % STORE_COLS.wide).toBe(0);
    }
  });

  it("fit leaves one cell for the tile only when the stores overflow", () => {
    expect(fit(8, 8)).toBe(8);
    expect(fit(9, 8)).toBe(7);
  });
});
