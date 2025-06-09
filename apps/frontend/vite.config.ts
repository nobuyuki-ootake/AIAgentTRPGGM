import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc"; // SWCに変更

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  esbuild: {
    // WSL環境での安定性向上
    keepNames: true,
    logLevel: 'error',
    // WSL環境でのプロセス通信問題を回避
    platform: 'node',
    target: 'node18'
  },
  worker: {
    // Worker使用を無効化してプロセス間通信エラーを回避
    format: 'es'
  },
  server: {
    port: 5173,
    strictPort: true, // ポートが使用中の場合は別ポートを使わずエラーにする
    host: '0.0.0.0', // WSL環境対応
    open: false,
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    watch: {
      usePolling: true, // WSL環境でのファイル監視改善
      interval: 300,    // ポーリング間隔を調整
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
    // WSL環境での安定性向上
    force: false,
    esbuildOptions: {
      // プロセス通信の安定化
      keepNames: true,
      target: 'node18'
    }
  },
});
