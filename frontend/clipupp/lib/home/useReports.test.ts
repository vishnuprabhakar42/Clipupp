import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// The suite runs in node; give the persist middleware a localStorage before the store loads.
const mem = new Map<string, string>();
beforeAll(() => {
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  } as Storage;
});

async function load() {
  return import("./useReports");
}

describe("useReports", () => {
  beforeEach(async () => {
    mem.clear();
    const { useReportsStore } = await load();
    useReportsStore.setState({ reports: {} });
  });

  it("stores a reason and time under the coupon id and reads it back", async () => {
    const { useReportsStore, REPORTS_KEY } = await load();
    useReportsStore.getState().report("c1", "expired", 1000);
    expect(useReportsStore.getState().reports).toEqual({ c1: { reason: "expired", at: 1000 } });
    expect(useReportsStore.getState().get("c1")).toEqual({ reason: "expired", at: 1000 });
    expect(useReportsStore.getState().get("c2")).toBeNull();
    expect(REPORTS_KEY).toBe("clipupp:reports");
  });

  it("persists under clipupp:reports", async () => {
    const { useReportsStore } = await load();
    useReportsStore.getState().report("c1", "min_order", 42);
    const raw = JSON.parse(mem.get("clipupp:reports") ?? "null");
    expect(raw.state.reports).toEqual({ c1: { reason: "min_order", at: 42 } });
  });

  it("replaces an earlier report for the same coupon", async () => {
    const { useReportsStore } = await load();
    useReportsStore.getState().report("c1", "expired", 1);
    useReportsStore.getState().report("c1", "other", 2);
    useReportsStore.getState().report("c2", "invalid", 3);
    expect(useReportsStore.getState().reports).toEqual({
      c1: { reason: "other", at: 2 },
      c2: { reason: "invalid", at: 3 },
    });
  });

  it("keeps stored reports when the first report comes before hydration", async () => {
    // A fresh module: the store has not loaded storage yet.
    vi.resetModules();
    const { useReportsStore } = await load();
    expect(useReportsStore.persist.hasHydrated()).toBe(false);
    mem.set("clipupp:reports", JSON.stringify({ state: { reports: { c1: { reason: "expired", at: 1 }, c2: { reason: "invalid", at: 2 } } }, version: 0 }));
    useReportsStore.getState().report("c1", "other", 5);
    await useReportsStore.persist.rehydrate();
    expect(useReportsStore.getState().reports).toEqual({
      c1: { reason: "other", at: 5 },
      c2: { reason: "invalid", at: 2 },
    });
  });

  it("restores saved reports from storage", async () => {
    const { useReportsStore } = await load();
    mem.set("clipupp:reports", JSON.stringify({ state: { reports: { c9: { reason: "invalid", at: 7 } } }, version: 0 }));
    await useReportsStore.persist.rehydrate();
    expect(useReportsStore.getState().get("c9")).toEqual({ reason: "invalid", at: 7 });
  });
});
