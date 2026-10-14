import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openHome, scrollThrough } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  test(`homepage has no axe violations in ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme });
    await page.addInitScript((t) => {
      try {
        localStorage.setItem("clipupp:theme", t);
      } catch {}
    }, theme);
    await openHome(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await scrollThrough(page);
    // The cookie banner stays up on purpose: it is part of the first-visit page.
    await expect(page.getByRole("dialog", { name: "Cookie consent" })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude("[data-a11y-exception]")
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
