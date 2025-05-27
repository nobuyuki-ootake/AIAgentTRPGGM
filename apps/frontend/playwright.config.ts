import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* 最大タイムアウト時間 */
  timeout: 30 * 1000,
  /* テスト実行時のグローバル設定 */
  expect: {
    /**
     * スクリーンショットの比較には少しの差を許容する
     * 異なるレンダリングエンジンやOSでの見た目の違いに対応するため
     */
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
    /* アサーションタイムアウト */
    timeout: 5000,
  },
  /* 実行全体の設定 */
  fullyParallel: false,
  /* 失敗したテストの再試行回数 */
  retries: 1,
  /* テスト実行者数 */
  workers: 1,
  /* テスト結果のレポーター */
  reporter: "html",
  /* 共通のステージング設定 */
  use: {
    /* Base URLはここで設定 */
    baseURL: "http://localhost:5173",
    /* すべてのテストでスクリーンショットを撮影 */
    screenshot: "on",
    /* コンテキストを保持するためのトレースを記録 */
    trace: "on-first-retry",
  },

  /* プロジェクトごとの設定 */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    /* その他のブラウザが必要な場合はコメントを解除
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],

  /* ローカル開発サーバーの設定 - 手動起動のため一時的にコメントアウト */
  /*
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  */
});
