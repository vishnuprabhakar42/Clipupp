import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

/*
 * Copy rules checked on every message, not only on what the homepage renders
 * first: sheets, search, report and coming-soon strings never reach the e2e
 * copy scan. No em dash, no "cashback" (Phase 1 is coupons only), no
 * "WhatsApp" (the channel is Telegram). Hindi transliterations count too.
 */
const BANNED: Array<[string, RegExp]> = [
  ["em dash", /—/],
  ["cashback", /cash\s*-?\s*back|कैशबैक/i],
  ["WhatsApp", /whats\s*app|व्हाट्सएप|व्हाट्सऐप/i],
];

function strings(o: unknown, path = ""): Array<[string, string]> {
  if (typeof o === "string") return [[path, o]];
  if (Array.isArray(o)) return o.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  return [];
}

describe.each([
  ["en", en],
  ["hi", hi],
])("%s copy", (_locale, messages) => {
  const all = strings(messages);

  it("has strings to scan", () => {
    expect(all.length).toBeGreaterThan(100);
  });

  it.each(BANNED)("never contains %s", (_name, re) => {
    expect(all.filter(([, v]) => re.test(v)).map(([k, v]) => `${k}: ${v}`)).toEqual([]);
  });
});
