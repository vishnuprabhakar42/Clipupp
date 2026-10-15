import { defineConfig, devices } from "@playwright/test";

// Artifacts live under node_modules/.cache: `next dev` watches the project root and recompiles on
// every write there, and a recompile mid-download truncates the chunk the page is fetching.
const ARTIFACTS = "node_modules/.cache/playwright";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: `${ARTIFACTS}/test-results`,
  timeout: 60_000,
  // The dev server compiles routes and lazy chunks on first hit; give assertions room for that.
  expect: { timeout: 15_000 },
  // Locally the suite usually runs against `next dev`, which slows down under many parallel pages.
  workers: process.env.CI ? undefined : 2,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: `${ARTIFACTS}/report` }]] : "list",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
