import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a real Supabase project (use a separate DEV project, never production).
 * Requires .env.local. Start: `npm run test:e2e` (builds nothing — uses `next dev`).
 */
process.loadEnvFile?.(".env.local");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
