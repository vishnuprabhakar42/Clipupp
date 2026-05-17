import type { ReactElement } from "react";

/**
 * Server-renders a JSON-LD `<script>` tag with the given data. We use raw
 * `<script type="application/ld+json">` rather than `next/script` because
 * structured data must be present in the initial HTML for Googlebot to see
 * it without executing JavaScript.
 *
 * The `__html` payload comes from a JSON.stringify of a typed object, so
 * there's no untrusted string interpolation. We still sanitize `<` and `>`
 * defensively in case a future caller passes user-controlled text.
 */
export function JsonLd({ data, id }: { data: object; id?: string }): ReactElement {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return (
    <script
      id={id}
      type="application/ld+json"
      // Pre-escaped above; safe to set.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
