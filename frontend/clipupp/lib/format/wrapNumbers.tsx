import type { ReactNode } from "react";

const NUMBER = /(₹?\d[\d,.]*%?)/;

/**
 * Splits a headline on numbers, percentages and rupee amounts and wraps each
 * match in `.clipupp-num` (tabular Inter) so figures stay crisp inside the
 * serif title. Plain text pieces are returned as strings.
 */
export function wrapNumbers(text: string): ReactNode[] {
  return text.split(NUMBER).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="clipupp-num">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
