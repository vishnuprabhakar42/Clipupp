import { expect, test } from "@playwright/test";

for (const path of ["/", "/hi"]) {
  test(`copy on ${path} has no em dash, cashback or WhatsApp`, async ({ page }) => {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    // Also the text in closed disclosures and visually hidden labels.
    const all = await page.evaluate(() => document.body.textContent ?? "");
    for (const t of [text, all]) {
      expect(t).not.toContain("\u2014"); // em dash
      expect(t.toLowerCase()).not.toContain("cashback");
      expect(t.toLowerCase()).not.toContain("whatsapp");
    }
  });
}
