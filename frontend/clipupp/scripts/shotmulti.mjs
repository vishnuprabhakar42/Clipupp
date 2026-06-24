import { chromium } from "playwright";
const b = await chromium.launch();
const pages = [
  ["/en", "home"],
  ["/en/coupons", "coupons"],
  ["/en/sign-in", "signin"],
];
for (const [path, name] of pages) {
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  try {
    await p.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(700);
    await p.screenshot({ path: `/tmp/ds-${name}.png` });
  } catch (e) { console.log(name, "ERR", e.message); }
  await p.close();
}
await b.close();
console.log("ok");
