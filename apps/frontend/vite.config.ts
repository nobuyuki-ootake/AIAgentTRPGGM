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
    host: "localhost",
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:4001", // バックエンドサーバーのポートを4001に指定
        changeOrigin: true,
      },
    },
  },
});
