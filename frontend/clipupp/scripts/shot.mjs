import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000/en/stores/amazon-india";
const out = process.argv[3] ?? "/tmp/card";

const browser = await chromium.launch();

// Desktop
const d = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
await d.goto(url, { waitUntil: "networkidle" });
await d.waitForTimeout(600);
await d.screenshot({ path: `${out}-desktop.png`, fullPage: false });

// Desktop hover on first code CTA (to capture the slide reveal)
const cta = d.locator(".clipupp-coupon-cover").first();
if (await cta.count()) {
  await cta.hover();
  await d.waitForTimeout(500);
  await d.screenshot({ path: `${out}-desktop-hover.png`, fullPage: false });
}

// Mobile
const m = await browser.newPage({
  viewport: { width: 390, height: 1500 },
  isMobile: true,
  deviceScaleFactor: 2,
});
await m.goto(url, { waitUntil: "networkidle" });
await m.waitForTimeout(600);
await m.screenshot({ path: `${out}-mobile.png`, fullPage: false });

await browser.close();
console.log("done");
