import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/stories/pages/WritingPage.stories.test.tsx"], // テスト対象を1ファイルに絞る
    setupFiles: ["./src/test/setupMocks.ts"], // モック設定ファイル
    testTimeout: 10000, // テストのタイムアウト10秒に設定
    hookTimeout: 10000, // フックのタイムアウトも設定
    teardownTimeout: 5000, // 終了処理のタイムアウト
    pool: "threads", // threads モードで実行（デフォルト）
    poolOptions: {
      threads: {
        singleThread: true, // シングルスレッドで実行
        maxThreads: 1, // 同時実行数を1に制限
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@mui/material": path.resolve(
        __dirname,
        "./src/__mocks__/@mui/material.js"
      ),
      "@mui/icons-material": path.resolve(
        __dirname,
        "./src/__mocks__/@mui/icons-material.js"
      ),
    },
  },
});
