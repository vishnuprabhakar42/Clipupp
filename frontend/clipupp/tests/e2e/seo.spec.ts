import { expect, test } from "@playwright/test";

for (const path of ["/", "/hi"]) {
  test(`hreflang on ${path} has en, hi and x-default with the right targets`, async ({ page }) => {
    await page.goto(path);
    const links = await page
      .locator("link[rel=alternate][hreflang]")
      .evaluateAll((els) => els.map((e) => [e.getAttribute("hreflang") ?? "", e.getAttribute("href") ?? ""] as const));
    const href = Object.fromEntries(links);
    expect(Object.keys(href)).toEqual(expect.arrayContaining(["en", "hi", "x-default"]));
    // Contract (lib/seo/urls.ts): en has no locale prefix, hi is under /hi, x-default is the en URL,
    // all on the canonical origin.
    const canonical = new URL((await page.locator("link[rel=canonical]").getAttribute("href")) ?? "");
    const en = new URL(href.en);
    const hi = new URL(href.hi);
    expect(en.origin).toBe(canonical.origin);
    expect(hi.origin).toBe(canonical.origin);
    expect(en.pathname).toBe("/");
    expect(hi.pathname).toBe("/hi");
    expect(href["x-default"]).toBe(href.en);
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

  test(`deals offer schema on ${path} is an ItemList of Offers in INR`, async ({ page }) => {
    await page.goto(path);
    const raw = await page.locator('script#ld-deals[type="application/ld+json"]').textContent();
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw ?? "");
    expect(data["@type"]).toBe("ItemList");
    const first = data.itemListElement[0].item;
    expect(first["@type"]).toBe("Offer");
    expect(first.priceCurrency).toBe("INR");
    // Ended deals are left out, so no listed offer is already past its end.
    const ends = (data.itemListElement as Array<{ item: { priceValidUntil?: string } }>).map((e) => e.item.priceValidUntil);
    for (const end of ends) if (end) expect(Date.parse(end)).toBeGreaterThan(Date.now());
  });
}
