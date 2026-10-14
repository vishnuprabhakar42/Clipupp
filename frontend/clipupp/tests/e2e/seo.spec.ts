import { expect, test } from "@playwright/test";

for (const path of ["/", "/hi"]) {
  test(`hreflang on ${path} has en, hi and x-default`, async ({ page }) => {
    await page.goto(path);
    const langs = await page.locator("link[rel=alternate][hreflang]").evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
    expect(langs).toEqual(expect.arrayContaining(["en", "hi", "x-default"]));
  });

  test(`json-ld on ${path} parses and has breadcrumb, faq and item list`, async ({ page }) => {
    await page.goto(path);
    const raw = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ""));
    expect(raw.length).toBeGreaterThan(0);
    const types = new Set<string>();
    const collect = (n: unknown) => {
      if (!n || typeof n !== "object") return;
      const o = n as Record<string, unknown>;
      if (Array.isArray(o["@graph"])) o["@graph"].forEach(collect);
      const t = o["@type"];
      for (const x of Array.isArray(t) ? t : t ? [t] : []) types.add(String(x));
    };
    for (const r of raw) collect(JSON.parse(r));
    for (const t of ["BreadcrumbList", "FAQPage", "ItemList"]) expect(types).toContain(t);
  });
}
