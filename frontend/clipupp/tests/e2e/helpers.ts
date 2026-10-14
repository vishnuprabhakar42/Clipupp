import type { Page } from "@playwright/test";

/**
 * Console noise accepted on the homepage, matched on the failing resource URL:
 * - store logos that point at files missing from public/brands (the monogram
 *   fallback renders). Which stores those are depends on the backend's data;
 *   the demo fixture's own logos are checked in features/home/fixtures/demo-feed.test.ts.
 * - the signed-out session probe (401 with a backend, 500 from the proxy without one).
 * - link prefetches of other pages that need the backend (CI runs without one;
 *   a failed prefetch is retried on navigation). A failed RSC fetch of the
 *   homepage itself still fails the test.
 */
const KNOWN_NOISE = [
  /\/brands\/[a-z0-9-]+\.(?:svg|png)$/,
  /\/api\/v1\/users\/me$/,
  /\/api\/v1\/auth\/refresh$/,
  /^https?:\/\/[^/]+\/(?!(?:en|hi)?\?)[^?]+\?(?:.*&)?_rsc=/,
];

/** Collects console errors and page errors, minus the known noise above. */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const url = m.location().url ?? "";
    if (KNOWN_NOISE.some((re) => re.test(url))) return;
    errors.push(`${m.text()} ${url}`.trim());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** Scrolls to the bottom and back so lazy and reveal-on-scroll blocks mount. */
export async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

/** Opens the English homepage and waits for hydration (the theme toggle renders only after mount). */
export async function openHome(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: /^Switch to (dark|light) theme$/ }).waitFor();
}

/** Records a cookie choice before load so the consent banner does not cover the page. */
export async function acceptCookies(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      const choice = { necessary: true, analytics: false, marketing: false, decidedAt: new Date().toISOString(), version: 1 };
      localStorage.setItem("clipupp_consent", JSON.stringify(choice));
    } catch {}
  });
}
