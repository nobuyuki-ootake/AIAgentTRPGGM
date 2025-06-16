import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "*.config.js", "*.config.ts", "vite.config.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // === 重要なルール（エラーレベル）=== 
      "@typescript-eslint/no-unsafe-function-type": "error",
      "no-case-declarations": "warn", // 開発段階のため警告レベルに変更
      
      // === 重要だが開発効率を考慮（警告レベル）===
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "off", // 開発段階のため一時的に無効化
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      
      // === React関連（警告レベル）===
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      
      // === 開発効率を重視して警告に変更 ===
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "no-console": "off", // 開発段階のため一時的に無効化
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-useless-escape": "warn", // 開発段階のため警告レベルに変更
      
      // === 無効化（開発効率重視）===
      "@typescript-eslint/no-explicit-any": "off", // 開発効率重視で無効化
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "off", // TypeScriptで型チェックされるため
    },
  }
);
