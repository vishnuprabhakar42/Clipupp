import { describe, expect, it } from "vitest";
import { applyPage, safeLoad, type ListState } from "./todayState";

type It = { coupon: { id: string } };
const it1 = (id: string): It => ({ coupon: { id } });
const prev: ListState<It> = { items: [it1("a"), it1("b")], cursor: "c1", hasMore: true, error: false };

describe("applyPage", () => {
  it("appends and de-duplicates", () => {
    const next = applyPage(prev, "append", { ok: true, items: [it1("b"), it1("c")], nextCursor: null });
    expect(next.items.map((i) => i.coupon.id)).toEqual(["a", "b", "c"]);
    expect(next.hasMore).toBe(false);
  });
  it("replaces on reset", () => {
    const next = applyPage(prev, "reset", { ok: true, items: [it1("z")], nextCursor: "n" });
    expect(next).toEqual({ items: [it1("z")], cursor: "n", hasMore: true, error: false });
  });
  it("clears the old tab's list when a reset fails", () => {
    expect(applyPage(prev, "reset", { ok: false, items: [], nextCursor: null })).toEqual({ items: [], cursor: null, hasMore: false, error: true });
  });
  it("keeps the list when an append fails", () => {
    const next = applyPage(prev, "append", { ok: false, items: [], nextCursor: null });
    expect(next.items).toHaveLength(2);
    expect(next.cursor).toBe("c1");
    expect(next.error).toBe(true);
  });
});

describe("safeLoad", () => {
  it("turns a rejection into ok:false", async () => {
    expect(await safeLoad(() => Promise.reject(new Error("boom")))).toEqual({ ok: false, items: [], nextCursor: null });
  });
});
