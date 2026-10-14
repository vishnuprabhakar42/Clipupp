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

describe("todayParamsToSearch keeps params in place", () => {
  it("returns an already canonical search unchanged", () => {
    const base = new URLSearchParams("tab=food&utm_source=x&sort=end");
    expect(todayParamsToSearch({ tab: "food", sort: "end", store: null }, undefined, base)).toBe("?tab=food&utm_source=x&sort=end");
  });
  it("keeps a preceding utm param first and the view params where they were", () => {
    const base = new URLSearchParams("utm_source=x&tab=food&utm_medium=y");
    expect(todayParamsToSearch({ tab: "food", sort: "pop", store: null }, undefined, base)).toBe("?utm_source=x&tab=food&utm_medium=y");
  });
  it("updates a value in place and deletes only defaults", () => {
    const base = new URLSearchParams("sort=new&utm_source=x&tab=food");
    expect(todayParamsToSearch({ tab: "all", sort: "end", store: null }, undefined, base)).toBe("?sort=end&utm_source=x");
  });
});
