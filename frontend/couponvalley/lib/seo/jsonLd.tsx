import type { ReactElement } from "react";

// JSON line-terminator escape sequences. Using fromCharCode keeps the literal
// U+2028 / U+2029 characters out of this source file — both are valid JS
// line terminators and would break the surrounding regex literal otherwise.
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

/**
 * Server-renders a JSON-LD `<script>` tag with the given data. Raw script
 * (not next/script) because structured data must be present in the initial
 * HTML for Googlebot to see without executing JS.
 *
 * Payload is JSON.stringify'd and the characters that could break out of a
 * `<script>` block or be interpreted as JS line terminators inside a string
 * literal are escaped defensively: < > & U+2028 U+2029.
 */
export function JsonLd({
  data,
  id,
}: {
  data: object;
  id?: string;
}): ReactElement {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEP)
    .join("\\u2028")
    .split(PARA_SEP)
    .join("\\u2029");
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
