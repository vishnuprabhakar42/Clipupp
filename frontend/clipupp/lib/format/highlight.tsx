import type { ReactNode } from "react";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Splits `text` around the first case-insensitive match of `query` and wraps the match in a
 * `<mark>`. The text content of the result always equals `text`, so a combobox option that
 * renders it keeps its label as its accessible name.
 */
export function highlight(text: string, query: string): ReactNode[] {
  const q = query.trim();
  if (!q) return [text];
  const m = new RegExp(escapeRe(q), "i").exec(text);
  if (!m) return [text];
  const end = m.index + m[0].length;
  return [
    text.slice(0, m.index),
    <mark key="m" className="bg-transparent font-semibold text-clipupp-neutral-900">
      {text.slice(m.index, end)}
    </mark>,
    text.slice(end),
  ];
}
