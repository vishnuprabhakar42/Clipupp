import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

function keys(o: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const live = (m: Record<string, unknown>) => keys(m).filter((k) => !k.startsWith("legacy.")).sort();

describe("messages", () => {
  it("en and hi have identical key sets (ignoring legacy.*)", () => {
    expect(live(hi)).toEqual(live(en));
  });

  it("has no empty values", () => {
    const empty = (m: Record<string, unknown>, p = ""): string[] =>
      Object.entries(m).flatMap(([k, v]) =>
        typeof v === "string" ? (v.trim() ? [] : [p + k]) : v && typeof v === "object" ? empty(v as Record<string, unknown>, `${p}${k}.`) : [],
      );
    expect(empty(hi)).toEqual([]);
  });
});
