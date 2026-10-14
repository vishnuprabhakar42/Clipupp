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
