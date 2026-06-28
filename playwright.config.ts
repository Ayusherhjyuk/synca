import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Boots the Next.js dev server automatically. The sync-engine
 * specs that require MongoDB + the WS server are tagged @integration and are
 * skipped unless RUN_INTEGRATION=1 (so CI without a DB still runs the smoke
 * tests). See the README for running the full offline-sync E2E locally.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
