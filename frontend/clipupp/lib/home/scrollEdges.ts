export type ScrollEdges = { atStart: boolean; atEnd: boolean };

/**
 * Which ends of a horizontal scroller are reached. `slack` absorbs subpixel
 * remainders from zoom and fractional widths. Uses the scroll magnitude so a
 * right-to-left scroller (negative scrollLeft) reads the same way.
 */
export function edges(scrollLeft: number, scrollWidth: number, clientWidth: number, slack = 1): ScrollEdges {
  const pos = Math.abs(scrollLeft);
  const max = Math.max(0, scrollWidth - clientWidth);
  return { atStart: pos <= slack, atEnd: pos >= max - slack };
}
