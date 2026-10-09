import { defineConfig, devices } from "next/experimental/testmode/playwright";

import { loadTestEnv } from "./tests/setup/load-test-env";

loadTestEnv();

const defaultTestDatabaseUrl =
  "postgres://vert_impact:vert_impact@localhost:5432/vert_impact_test";
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  defaultTestDatabaseUrl;
process.env.DATABASE_URL = testDatabaseUrl;
delete process.env.NO_COLOR;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testMatch: "tests/*.spec.ts",
  globalSetup: "./tests/playwright-global-setup.mjs",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev:test",
    url: "http://localhost:4000",
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: testDatabaseUrl,
      NEXT_DIST_DIR: ".next-test",
      NEXT_TEST_PROXY: "1",
      NODE_ENV: "development",
    },
  },
});
