import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // WSL環境対応
    open: false,
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    watch: {
      usePolling: true, // WSL環境でのファイル監視改善
    },
    proxy: {
      "/api": {
        target: "http://localhost:4001", // バックエンドサーバーのポートを4001に指定
        changeOrigin: true,
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /packages\/types/],
    },
  },
  optimizeDeps: {
    include: ["@trpg-ai-gm/types"],
  },
});
