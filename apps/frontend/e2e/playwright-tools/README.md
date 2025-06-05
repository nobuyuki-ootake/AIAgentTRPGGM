# Playwright Tools

このフォルダーには、Playwrightを使用したTRPGアプリケーションのテストとデバッグ用のスクリプトが含まれています。

## ファイル構成

### デバッグ・確認用スクリプト
- `check-localhost.cjs` - localhost:5173の状態をPlaywrightで確認
- `capture-localhost.js` - localhost画面のキャプチャ
- `show-browser.js/mjs` - ブラウザー表示用スクリプト
- `simple-screenshot.js` - 簡単なスクリーンショット撮影

### TRPG機能テスト用
- `capture-trpg-session.js` - TRPGセッション画面のキャプチャ
- `simple-trpg-test.cjs` - TRPGアプリケーションの基本テスト
- `test-browser-mcp.js` - MCP機能のブラウザーテスト

### HTMLテストページ
- `manual-test.html` - 手動テスト用ページ
- `session-page-content.html` - セッションページのコンテンツ
- `trpg-session-capture.html` - セッションキャプチャ用ページ

### ユーティリティ
- `check-app-status.js` - アプリケーション状態確認
- `fetch-localhost-info.js` - localhost情報取得
- `refresh-browser.mjs` - ブラウザーリフレッシュ用

## 使用方法

### 基本的なデバッグ
```bash
# localhost:5173の状態確認
node e2e/playwright-tools/check-localhost.cjs

# アプリケーション状態確認  
node e2e/playwright-tools/check-app-status.js
```

### 画面キャプチャ
```bash
# 基本的なスクリーンショット
node e2e/playwright-tools/simple-screenshot.js

# TRPGセッション画面のキャプチャ
node e2e/playwright-tools/capture-trpg-session.js
```

### ブラウザー表示
```bash
# ブラウザーを表示してデバッグ
node e2e/playwright-tools/show-browser.mjs
```

## 注意事項

- これらのスクリプトを実行する前に、開発サーバー（`pnpm dev`）が起動していることを確認してください
- 一部のスクリプトは`.cjs`拡張子を使用してCommonJS形式で記述されています
- `.mjs`ファイルはES Module形式で記述されています