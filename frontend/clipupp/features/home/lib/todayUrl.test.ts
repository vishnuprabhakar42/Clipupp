import { describe, expect, it } from "vitest";
import { parseTodayParams, todayParamsToSearch } from "./todayUrl";

const known = { tabs: ["all", "fashion", "food"], sorts: ["pop", "new", "end", "rate"] };

describe("parseTodayParams", () => {
  it("falls back on unknown values", () => {
    expect(parseTodayParams(new URLSearchParams("tab=zzz&sort=nope"), known)).toEqual({ tab: "all", sort: "pop", store: null });
  });
  it("reads known values", () => {
    expect(parseTodayParams(new URLSearchParams("tab=food&sort=end&store=amazon"), known)).toEqual({ tab: "food", sort: "end", store: "amazon" });
  });
  it("drops a store that is not a slug", () => {
    expect(parseTodayParams(new URLSearchParams("store=%3Cscript%3E"), known).store).toBeNull();
    expect(parseTodayParams(new URLSearchParams("store="), known).store).toBeNull();
  });
});

describe("todayParamsToSearch", () => {
  it("is empty for defaults", () => {
    expect(todayParamsToSearch({ tab: "all", sort: "pop", store: null })).toBe("");
  });
  it("serialises non-defaults only", () => {
    expect(todayParamsToSearch({ tab: "food", sort: "pop", store: "amazon" })).toBe("?tab=food&store=amazon");
  });
  it("includes the sort when it is not the default", () => {
    expect(todayParamsToSearch({ tab: "all", sort: "end", store: null })).toBe("?sort=end");
  });
  it("honours custom defaults", () => {
    expect(todayParamsToSearch({ tab: "food", sort: "new", store: null }, { tab: "food", sort: "new" })).toBe("");
  });
});

describe("todayParamsToSearch with a base", () => {
  it("keeps unrelated params and replaces stale view params", () => {
    const base = new URLSearchParams("utm_source=x&tab=fashion&sort=end");
    expect(todayParamsToSearch({ tab: "food", sort: "pop", store: null }, undefined, base)).toBe("?utm_source=x&tab=food");
  });
});
