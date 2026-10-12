import { describe, expect, it } from "vitest";
import { emit, on, peek } from "./homeBus";

describe("homeBus", () => {
  it("delivers payload and source to subscribers and records the last payload", () => {
    const seen: unknown[] = [];
    const off = on("today:tab", (p, m) => seen.push([p, m.source]));
    const me = Symbol("me");
    emit("today:tab", "fashion", me);
    emit("today:tab", "food");
    off();
    emit("today:tab", "ignored");
    expect(seen).toEqual([["fashion", me], ["food", undefined]]);
    expect(peek("today:tab")).toBe("ignored");
  });

  it("lets a subscriber skip its own emissions via the source token", () => {
    const me = Symbol("me");
    const other = Symbol("other");
    const got: string[] = [];
    const off = on("today:tab", (p, m) => {
      if (m.source !== me) got.push(p);
    });
    emit("today:tab", "a", me);
    emit("today:tab", "b", other);
    off();
    expect(got).toEqual(["b"]);
  });
});
