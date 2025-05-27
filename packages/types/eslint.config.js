import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".turbo"] }, // node_modules と .turbo も無視対象に追加
  {
    files: ["**/*.ts"], // .ts ファイルのみを対象とする
    languageOptions: {
      ecmaVersion: 2020,
      // globals: globals.browser, // ブラウザ固有のグローバル変数は不要
    },
    plugins: {
      // React関連のプラグインは削除
    },
    rules: {
      // React関連のルールは削除
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 必要に応じて `packages/types` 固有のルールを追加
    },
  },
  ...tseslint.configs.recommended, // 推奨ルールセットを適用 (extends の代わりに直接展開)
  js.configs.recommended // JavaScript の推奨ルールセットも適用
);
