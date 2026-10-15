import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../../..");
const raw = readFileSync(join(__dirname, "demo-feed.json"), "utf8");

describe("demo feed fixture", () => {
  // CI renders the homepage from this fixture with no backend, and the e2e console check
  // tolerates logo 404s, so a missing file here would only show up as a monogram.
  it("points every local image at a file in public/", () => {
    const paths = [...new Set(raw.match(/"\/[^"]+\.(?:png|svg|jpe?g|webp|avif)"/g) ?? [])].map((p) => p.slice(1, -1));
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.filter((p) => !existsSync(join(root, "public", p)))).toEqual([]);
  });
});
