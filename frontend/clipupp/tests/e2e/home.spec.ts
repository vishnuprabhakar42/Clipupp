import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { acceptCookies, collectConsoleErrors, openHome, scrollThrough } from "./helpers";

const fixture = JSON.parse(readFileSync(join(__dirname, "../../features/home/fixtures/demo-feed.json"), "utf8")) as {
  sectionOrder: string[];
};

for (const path of ["/", "/hi"]) {
  test.describe(`homepage ${path}`, () => {
    test("renders one h1 and every fixture section", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      for (const code of fixture.sectionOrder) {
        await expect(page.locator(`[id="${code}"]`), `section ${code}`).toHaveCount(1);
      }
    });

    test("has no horizontal overflow", async ({ page }) => {
      await page.goto(path);
      await scrollThrough(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("logs no unexpected console errors", async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(path);
      await scrollThrough(page);
      // Let lazy chunks, images and deferred widgets settle.
      await page.waitForTimeout(1500);
      expect(errors).toEqual([]);
    });
  });
}

test.describe("homepage interactions", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });
  test.beforeEach(async ({ page }) => {
    await acceptCookies(page);
    await openHome(page);
  });

  test("header search keyboard flow", async ({ page }) => {
    // Backend-independent: without a backend the proxy answers the suggest call with a 500.
    await page.route("**/api/v1/search/suggest**", (route) =>
      route.fulfill({
        json: [{ id: "s-myntra", slug: "myntra", title: "Myntra", snippet: null, imageUrl: null, kind: "STORE", rank: 1 }],
      }),
    );
    const box = page.getByRole("banner").getByRole("combobox");
    await page.locator("body").press("/");
    await expect(box).toBeFocused();
    // The list rebuilds (and the highlight resets) once the remote suggest settles, so wait for it.
    const suggest = page.waitForResponse((r) => r.url().includes("/api/v1/search/suggest") && r.url().includes("q=myntra"));
    await box.fill("myntra");
    await suggest;
    await expect(box).toHaveAttribute("aria-expanded", "true");
    const option = page.getByRole("banner").getByRole("listbox").getByRole("option").first();
    await expect(option).toBeVisible();
    await box.press("ArrowDown");
    await expect(option).toHaveAttribute("aria-selected", "true");
    await expect(box).toHaveAttribute("aria-activedescendant", (await option.getAttribute("id")) ?? "");
    await box.press("Escape");
    await expect(box).toHaveAttribute("aria-expanded", "false");
  });

  test("reveal opens the coupon sheet", async ({ page }) => {
    const today = page.locator("#top_deals");
    // A revealed card swaps its cover for the code; the list can grow while it loads, so count those.
    const revealed = today.getByRole("link", { name: /^Code .+, open details$/ });
    await expect(revealed).toHaveCount(0);
    await today.getByRole("link", { name: /^Show code for / }).first().click();
    const sheet = page.locator("dialog[open]");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: /^(Copy|Copied)/ }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(revealed.first()).toBeVisible();
  });

  test("heart toggles the saved badge", async ({ page }) => {
    const saved = page.getByRole("banner").getByRole("button", { name: "Saved", exact: true });
    const rail = page.locator("#trending_coupons");
    const heart = rail.getByRole("button", { name: /^Save .+ coupon$/ }).first();
    const label = (await heart.getAttribute("aria-label")) ?? "";
    const store = label.replace(/^Save (.+) coupon$/, "$1");
    await heart.click();
    const unsave = rail.getByRole("button", { name: `Remove ${store} coupon` }).first();
    await expect(unsave).toBeVisible();
    await expect(saved).toHaveText("1");
    await unsave.click();
    await expect(rail.getByRole("button", { name: label }).first()).toBeVisible();
    await expect(saved).toHaveText("");
  });

  test("Today tabs move selection with ArrowRight", async ({ page }) => {
    const tabs = page.getByRole("tablist", { name: "Coupon categories" }).getByRole("tab");
    const first = tabs.nth(0);
    await expect(first).toHaveAttribute("aria-selected", "true");
    await first.focus();
    await first.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(first).toHaveAttribute("aria-selected", "false");
  });

  test("dark theme persists across reload", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "desktop project only");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  });
});

test.describe("homepage at tablet width", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  // Rail columns come from per-breakpoint CSS vars (Rail.tsx cols): at md the trending rail
  // sizes cards at (100% - 32px) / 3.15 and deals at (100% - 60px) / 4.25, so 3 and 4 cards
  // sit fully inside the rail with the next one peeking.
  for (const [rail, full] of [
    ["trending-rail", 3],
    ["deals-rail", 4],
  ] as const) {
    test(`${rail} shows ${full} full cards and a peek at md`, async ({ page }) => {
      await openHome(page);
      const track = page.locator(`[id="${rail}"]`);
      await expect(track).toBeAttached();
      const fit = await track.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const kids = [...el.children].map((c) => c.getBoundingClientRect()).filter((c) => c.width > 0);
        return {
          full: kids.filter((c) => c.left >= r.left - 1 && c.right <= r.right + 1).length,
          partial: kids.filter((c) => c.left < r.right - 1 && c.right > r.right + 1).length,
          total: kids.length,
        };
      });
      expect(fit.total).toBeGreaterThan(full);
      expect(fit.full).toBe(full);
      expect(fit.partial).toBe(1);
    });
  }
});

test.describe("homepage state and fallbacks", () => {
  test.beforeEach(async ({ page }) => {
    await acceptCookies(page);
  });

  test("blocked clipboard shows the code, never Copied", async ({ page }, info) => {
    // No clipboard permission, and writeText rejects the way a blocked or insecure context does.
    await page.addInitScript(() => {
      const reject = () => Promise.reject(new DOMException("Write permission denied.", "NotAllowedError"));
      if (navigator.clipboard) Object.defineProperty(navigator.clipboard, "writeText", { value: reject, configurable: true });
    });
    const errors = collectConsoleErrors(page);
    await openHome(page);
    const today = page.locator("#top_deals");
    await today.getByRole("link", { name: /^Show code for / }).first().click();
    const sheet = page.locator("dialog[open]");
    await expect(sheet).toBeVisible();
    const revealed = today.getByRole("link", { name: /^Code .+, open details$/ }).first();
    const code = ((await revealed.getAttribute("aria-label")) ?? "").replace(/^Code (.+), open details$/, "$1");
    expect(code).not.toBe("");
    // The code box keeps the code and the button stays "Copy", even after pressing it again.
    await expect(sheet.getByText(code, { exact: true }).first()).toBeVisible();
    const copy = sheet.getByRole("button", { name: "Copy", exact: true });
    await expect(copy).toBeVisible();
    await copy.click();
    await expect(copy).toHaveText("Copy");
    await expect(sheet.getByRole("button", { name: "Copied" })).toHaveCount(0);
    await expect(sheet.getByText("Copied. Paste at checkout.")).toHaveCount(0);
    await expect(page.getByText("Code selected, press copy to use it").first()).toBeVisible();
    if (info.project.name === "phone") {
      // Sticky bar (below lg): the code in place of "Copied", and the store link opens /r/{id} in a new tab.
      const bar = sheet.locator("div.sticky");
      await expect(bar.getByText(code, { exact: true })).toBeVisible();
      const open = bar.getByRole("link", { name: /^Open / });
      await expect(open).toHaveAttribute("href", /^\/r\/[^/]+$/);
      await expect(open).toHaveAttribute("target", "_blank");
    }
    expect(errors).toEqual([]);
  });

  test("Today tab and sort live in the URL", async ({ page }) => {
    await openHome(page);
    const tabs = page.getByRole("tablist", { name: "Coupon categories" }).getByRole("tab");
    const second = tabs.nth(1);
    await second.click();
    await expect(second).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/[?&]tab=[a-z0-9-]+/);
    const tab = new URL(page.url()).searchParams.get("tab");

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`[?&]tab=${tab}(?:&|#|$)`));
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");

    const sort = page.getByLabel("Sort coupons");
    await sort.selectOption("end");
    await expect(page).toHaveURL(/[?&]sort=end(?:&|#|$)/);
    expect(new URL(page.url()).searchParams.get("tab")).toBe(tab);

    // The logo starts a fresh visit at "/"; Back restores the view from the URL.
    await page.getByRole("banner").getByRole("link", { name: "Clipupp home" }).first().click();
    await expect(page).toHaveURL((u) => !u.searchParams.has("tab") && !u.searchParams.has("sort"));
    await page.goBack();
    await expect(page).toHaveURL(/[?&]sort=end(?:&|#|$)/);
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(sort).toHaveValue("end");
  });

  test("Today ignores a store the feed does not know", async ({ page }) => {
    await page.goto("/?store=not-a-known-store&utm_source=e2e");
    await page.getByRole("button", { name: /^Switch to (dark|light) theme$/ }).waitFor();
    const tabs = page.getByRole("tablist", { name: "Coupon categories" }).getByRole("tab");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: /^Clear store filter/ })).toHaveCount(0);
    await expect(page).toHaveURL((u) => !u.searchParams.has("store") && u.searchParams.get("utm_source") === "e2e");
  });

  test("header search highlights, says no results, clears and remembers", async ({ page }) => {
    // Backend-independent: no remote coupon hits, so results come from the feed alone.
    await page.route("**/api/v1/search/suggest**", (route) => route.fulfill({ json: [] }));
    await openHome(page);
    const banner = page.getByRole("banner");
    const box = banner.getByRole("combobox");
    await box.click();
    await box.fill("ama");
    const listbox = banner.getByRole("listbox");
    await expect(listbox.locator("mark").first()).toHaveText(/^ama$/i);

    await box.fill("zzqxzzqx");
    // The visible row, and the same text in the live region for assistive tech.
    await expect(banner.getByText("No matches for “zzqxzzqx”").first()).toBeVisible();
    await expect(banner.getByRole("status")).toHaveText("No matches for “zzqxzzqx”");

    await banner.getByRole("button", { name: "Clear search" }).click();
    await expect(box).toHaveValue("");
    await expect(box).toBeFocused();

    // Choosing a result records the query as a recent search.
    await box.fill("ama");
    await expect(listbox.locator("mark").first()).toBeVisible();
    await box.press("Enter");
    await page.waitForURL((u) => u.pathname !== "/");
    await openHome(page);
    await page.getByRole("banner").getByRole("combobox").click();
    await expect(page.getByRole("banner").getByRole("group", { name: "Recent" }).getByRole("option", { name: "Amazon" })).toBeVisible();
  });

  test("reporting a coupon persists across reload", async ({ page }) => {
    await openHome(page);
    const today = page.locator("#top_deals");
    await today.getByRole("link", { name: /^Show code for / }).first().click();
    const sheet = page.locator("dialog[open]");
    await expect(sheet).toBeVisible();
    const href = (await sheet.locator('a[href^="/r/"]').first().getAttribute("href")) ?? "";
    const id = href.replace(/^\/r\//, "");
    expect(id).not.toBe("");

    await sheet.getByRole("button", { name: "Report not working" }).click();
    await sheet.getByRole("group", { name: "What went wrong?" }).getByRole("button", { name: "Expired" }).click();
    await expect(sheet.getByRole("status").filter({ hasText: "Thanks, we will re-check this code." })).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem("clipupp:reports") ?? "");
    expect(Object.keys((JSON.parse(stored) as { state: { reports: Record<string, unknown> } }).state.reports)).toContain(id);

    await page.reload();
    await page.getByRole("button", { name: /^Switch to (dark|light) theme$/ }).waitFor();
    await today.locator(`a[href="${href}"]`).first().click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Thanks, we will re-check this code.")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Report not working" })).toHaveCount(0);
  });
});
