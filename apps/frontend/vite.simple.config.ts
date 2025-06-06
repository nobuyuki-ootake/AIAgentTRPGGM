import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Simplified Vite config for testing
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  server: {
    port: 5173,
    strictPort: true,
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