import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* TRPG用の拡張タイムアウト */
  timeout: 60 * 1000,
  /* TRPG-specific test configurations */
  expect: {
    /**
     * TRPG UIの動的コンテンツに対応した寛容なスクリーンショット比較
     */
    toHaveScreenshot: { 
      maxDiffPixelRatio: 0.08,
      animationHandling: "disallow"
    },
    /* アサーションタイムアウト（AI応答を考慮） */
    timeout: 10000,
  },
  /* TRPG session tests require sequential execution for state management */
  fullyParallel: false,
  /* TRPG tests retry strategy */
  retries: process.env.CI ? 2 : 1,
  /* Worker configuration for TRPG session isolation */
  workers: process.env.CI ? 2 : 1,
  /* Enhanced reporting for TRPG scenarios */
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["line"]
  ],
  /* TRPG-optimized browser settings */
  use: {
    baseURL: "http://localhost:5173",
    /* Enhanced screenshot capture for TRPG UI verification */
    screenshot: { mode: "only-on-failure", fullPage: true },
    /* Video recording for TRPG session debugging */
    video: process.env.CI ? "retain-on-failure" : "off",
    /* Comprehensive tracing for complex TRPG workflows */
    trace: "retain-on-failure",
    /* Browser context settings optimized for TRPG */
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
  },

  /* TRPG-specific project configurations */
  projects: [
    /* Main TRPG testing suite */
    {
      name: "trpg-desktop",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./e2e/trpg-core",
      testMatch: "**/*.spec.ts",
    },
    /* Page tests */
    {
      name: "pages",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./e2e/pages",
      testMatch: "**/*.spec.ts",
    },
    /* TRPG session-specific tests */
    {
      name: "trpg-session",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./e2e/trpg-session",
      testMatch: "**/*.spec.ts",
      dependencies: ["trpg-desktop"],
    },
    /* Performance testing for TRPG workflows */
    {
      name: "trpg-performance",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./e2e/performance",
      testMatch: "**/*.spec.ts",
    },
    /* Mobile TRPG experience */
    {
      name: "trpg-mobile",
      use: devices["Pixel 5"],
      testDir: "./e2e/mobile",
      testMatch: "**/*.spec.ts",
    },
    /* Accessibility for TRPG UI */
    {
      name: "trpg-accessibility",
      use: { 
        ...devices["Desktop Chrome"],
        reducedMotion: "reduce",
        forcedColors: "none",
        viewport: { width: 1920, height: 1080 },
      },
      testDir: "./e2e/accessibility",
      testMatch: "*.spec.ts",
    },
  ],

  /* Global test setup and teardown */
  // globalSetup: require.resolve("./e2e/global-setup.ts"),
  // globalTeardown: require.resolve("./e2e/global-teardown.ts"),

  /* ローカル開発サーバーの設定 */
  webServer: {
    command: "pnpm dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
