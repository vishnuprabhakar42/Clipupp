import { chromium } from "playwright";
const b = await chromium.launch();
const targets = [
  ["/en", "home"],
  ["/en/stores/amazon-india", "store"],
  ["/en/coupons/amazon-india-code-7", "detail"],
  ["/en/sign-in", "signin"],
  ["/en/stores", "stores-list"],
];
for (const [path, name] of targets) {
  const p = await b.newPage({ viewport: { width: 1280, height: 1100 } });
  try {
    await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `/tmp/sw-${name}.png` });
  } catch (e) { console.log(name, "ERR", e.message); }
  await p.close();
}
await b.close();
console.log("ok");
