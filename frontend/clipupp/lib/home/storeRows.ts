/** Top stores grid: two full rows, 4 columns below md and 6 from md. */
export const STORE_COLS = { phone: 4, wide: 6 } as const;
const ROWS = 2;

/**
 * Tiles to show in `cap` cells: all of them when they fit, else one cell less
 * so the "All stores" tile takes the last cell of the last row.
 */
export function fit(total: number, cap: number): number {
  return total > cap ? cap - 1 : total;
}

export type StoreRows = {
  /** Store tiles shown below md before expanding. */
  phone: number;
  /** Store tiles shown from md before expanding. */
  wide: number;
  /** The "All stores" tile shows below md. */
  tilePhone: boolean;
  /** The "All stores" tile shows from md. */
  tileWide: boolean;
};

/** Collapsed Top stores layout for `total` stores at both column counts. */
export function storeRows(total: number): StoreRows {
  const phoneCap = STORE_COLS.phone * ROWS;
  const wideCap = STORE_COLS.wide * ROWS;
  return {
    phone: fit(total, phoneCap),
    wide: fit(total, wideCap),
    tilePhone: total > phoneCap,
    tileWide: total > wideCap,
  };
}
