# 📚 e2e テスト実施手引

## 概要

小説創作支援ツールの e2e テスト実施に関する包括的な手引書です。Playwright を使用したエンドツーエンドテストの実行方法、テストシナリオ、トラブルシューティングについて説明します。

## 🎯 テストの目的

### 1. 機能検証

- 全ページの基本機能が正常に動作することを確認
- AI 機能（OpenAI、Claude、Gemini）の統合テスト
- ユーザーワークフローの完全性確認

### 2. 品質保証

- UI/UX の一貫性確認
- レスポンシブデザインの動作確認
- エラーハンドリングの適切性確認

### 3. 回帰テスト

- 新機能追加時の既存機能への影響確認
- バグ修正後の再発防止確認

## 🛠️ 環境セットアップ

### 前提条件

```bash
# Node.js 18以上
node --version

# プロジェクトの依存関係インストール
npm install

# Playwrightブラウザインストール
npx playwright install
```

### 開発サーバー起動

**重要**: e2e テスト実行前に必ず開発サーバーを手動で起動してください。

```bash
# フロントエンド開発サーバー起動
cd apps/frontend
npm run dev

# プロキシサーバー起動（AI機能テスト用）
cd apps/proxy-server
npm run dev
```

### 環境変数設定

```bash
# .env.local ファイルを作成
OPENAI_API_KEY=your_openai_api_key
CLAUDE_API_KEY=your_claude_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## 📋 テスト実行方法

### 基本的な実行コマンド

```bash
# 全テスト実行
npx playwright test

# 特定のページテスト実行
npx playwright test e2e/pages/writing-page.spec.ts
npx playwright test e2e/pages/timeline-page.spec.ts
npx playwright test e2e/pages/world-building-page.spec.ts

# ヘッドレスモードで実行（ブラウザ表示）
npx playwright test --headed

# デバッグモード
npx playwright test --debug

# 特定のテストケースのみ実行
npx playwright test --grep "AI機能"
```

### エビデンステスト実行

```bash
# 執筆機能エビデンステスト（推奨）
npm run test:evidence

# ブラウザ表示付きエビデンステスト
npm run test:evidence:headed

# 詳細版エビデンステスト
npm run test:evidence:full

# 回帰テストのみ
npm run test:regression
```

### AI 機能完全対応テスト実行

```bash
# タイムラインページAI機能テスト
npm run test:timeline:ai

# タイムラインページAI機能テスト（ブラウザ表示）
npm run test:timeline:ai:headed

# 世界観構築ページAI機能テスト
npm run test:worldbuilding:ai

# 世界観構築ページAI機能テスト（ブラウザ表示）
npm run test:worldbuilding:ai:headed

# 両方のAI機能テストを同時実行
npm run test:ai-enhanced

# 両方のAI機能テストを同時実行（ブラウザ表示）
npm run test:ai-enhanced:headed
```

### レポート確認

```bash
# テストレポート表示
npx playwright show-report

# 失敗したテストのトレース確認
npx playwright show-trace test-results/trace.zip
```

## 🎭 テスト対象ページ

### ✅ 完全対応済み

#### 1. HomePage（ホームページ）

- **ファイル**: `e2e/pages/home-page.spec.ts`
- **機能**: プロジェクト作成、選択、削除
- **AI 機能**: なし

#### 2. WritingPage（執筆ページ）

- **ファイル**: `e2e/pages/writing-page.spec.ts`
- **機能**: 章管理、文章入力、保存
- **AI 機能**: ✅ 完全対応（アシスト、チャット）

#### 3. SynopsisPage（あらすじページ）

- **ファイル**: `e2e/pages/synopsis-page.spec.ts`
- **機能**: あらすじ作成、編集、保存
- **AI 機能**: ✅ 完全対応（アシスト、チャット）

#### 4. PlotPage（プロットページ）

- **ファイル**: `e2e/pages/plot-page.spec.ts`
- **機能**: プロット作成、編集、保存
- **AI 機能**: ✅ 完全対応（アシスト、チャット）

### 🔄 更新予定

#### 5. TimelinePage（タイムラインページ）

- **ファイル**: `e2e/pages/timeline-page.spec.ts`
- **機能**: イベント管理、タイムライン表示
- **AI 機能**: 🔄 更新予定（基本実装済み）

#### 6. WorldBuildingPage（世界観構築ページ）

- **ファイル**: `e2e/pages/world-building-page.spec.ts`
- **機能**: 世界観要素管理、タブ切り替え
- **AI 機能**: 🔄 更新予定（基本実装済み）

### 🆕 AI 機能完全対応版（新規作成）

#### 5. TimelinePage AI 機能完全対応版

- **ファイル**: `e2e/pages/timeline-page-ai-enhanced.spec.ts`
- **機能**: イベント管理、タイムライン表示、設定・フィルタ
- **AI 機能**: ✅ 完全対応（アシスト、チャット、タイムライン生成）
- **テスト内容**:
  - 基本機能と AI 機能の完全テスト
  - タイムライン設定とフィルタ機能
  - レスポンシブ表示確認
  - パフォーマンステスト

#### 6. WorldBuildingPage AI 機能完全対応版

- **ファイル**: `e2e/pages/world-building-page-ai-enhanced.spec.ts`
- **機能**: 世界観要素管理、タブ切り替え、データ管理
- **AI 機能**: ✅ 完全対応（アシスト、チャット、世界観生成）
- **テスト内容**:
  - 基本機能と AI 機能の完全テスト
  - 世界観設定とカテゴリ管理
  - レスポンシブ表示確認
  - パフォーマンステスト
  - データエクスポート・インポート

### ⚠️ 部分対応

#### 7. ProjectsPage（プロジェクト一覧ページ）

- **ファイル**: `e2e/pages/projects-page.spec.ts`
- **機能**: プロジェクト一覧、検索、フィルタ
- **AI 機能**: なし
- **状況**: セレクター改善中

## 🧪 テストシナリオ詳細

### AI 機能テストフロー

#### 1. フローティングボタンから AI パネル開く

```typescript
// AIアシストボタンをクリック
const aiButton = page.locator('[data-testid="ai-assist-button"]');
await aiButton.click();

// AIパネルの表示確認
const aiPanel = page.locator('[data-testid="ai-chat-panel"]');
await expect(aiPanel).toBeVisible();
```

#### 2. アシストタブでコンテンツ生成

```typescript
// アシストタブをクリック
const assistTab = page.locator('[data-testid="assist-tab"]');
await assistTab.click();

// 生成ボタンをクリック
const generateButton = page.locator('[data-testid="generate-button"]');
await generateButton.click();

// 生成結果の確認
const generatedContent = page.locator('[data-testid="generated-content"]');
await expect(generatedContent).toBeVisible();
```

#### 3. チャットタブで AI 対話

```typescript
// チャットタブをクリック
const chatTab = page.locator('[data-testid="chat-tab"]');
await chatTab.click();

// メッセージ入力
const messageInput = page.locator('[data-testid="message-input"]');
await messageInput.fill("テストメッセージ");

// 送信ボタンをクリック
const sendButton = page.locator('[data-testid="send-button"]');
await sendButton.click();

// AIレスポンスの確認
const aiResponse = page.locator('[data-testid="ai-response"]');
await expect(aiResponse).toBeVisible();
```

### エラーハンドリングテスト

#### 1. コンソールエラー監視

```typescript
// エラーログ収集
const errors: string[] = [];
page.on("console", (msg) => {
  if (msg.type() === "error") {
    errors.push(msg.text());
  }
});

// テスト実行後にエラーチェック
expect(errors).toHaveLength(0);
```

#### 2. ネットワークエラーテスト

```typescript
// ネットワークエラーをシミュレート
await page.route("**/api/**", (route) => {
  route.abort("failed");
});

// エラーハンドリングの確認
const errorMessage = page.locator('[data-testid="error-message"]');
await expect(errorMessage).toBeVisible();
```

### パフォーマンステスト

#### 1. ページ読み込み時間測定

```typescript
const startTime = Date.now();
await page.goto("/writing");
await page.waitForLoadState("networkidle");
const loadTime = Date.now() - startTime;

// 10秒以内での読み込み確認
expect(loadTime).toBeLessThan(10000);
```

#### 2. レスポンシブテスト

```typescript
// デスクトップ
await page.setViewportSize({ width: 1920, height: 1080 });
await takeScreenshot(page, "desktop-view");

// タブレット
await page.setViewportSize({ width: 768, height: 1024 });
await takeScreenshot(page, "tablet-view");

// モバイル
await page.setViewportSize({ width: 375, height: 667 });
await takeScreenshot(page, "mobile-view");
```

## 📸 スクリーンショット管理

### 命名規則

```
{page-name}-{test-scenario}-{step}.png

例:
- writing-page-ai-assist-panel.png
- timeline-page-add-event-dialog.png
- world-building-page-tab-places.png
```

### 自動撮影されるエビデンス

#### 基本ワークフロー（8 枚）

1. `evidence-01-home-before-project-selection.png`
2. `evidence-02-project-detail-before-writing.png`
3. `evidence-03-writing-page-chapter-list-fixed.png`
4. `evidence-04-chapter-selected-editor-ready.png`
5. `evidence-05-writing-in-progress-text-entered.png`
6. `evidence-06-writing-saved-successfully.png`
7. `evidence-07-chapter-switching-works.png`
8. `evidence-08-final-writing-functionality-confirmed.png`

#### レスポンシブ対応（3 枚）

- `evidence-responsive-desktop-{page}.png`
- `evidence-responsive-tablet-{page}.png`
- `evidence-responsive-mobile-{page}.png`

#### AI 機能テスト（各ページ 5 枚）

- `{page}-ai-panel-opened.png`
- `{page}-ai-assist-tab.png`
- `{page}-ai-chat-tab.png`
- `{page}-ai-response-received.png`
- `{page}-ai-panel-closed.png`

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. テストが失敗する

**問題**: テストが途中で失敗する

```bash
# 解決方法
# 1. 開発サーバーが起動していることを確認
npm run dev

# 2. ポート5173でアクセスできることを確認
curl http://localhost:5173

# 3. ブラウザ表示付きで実行してデバッグ
npx playwright test --headed

# 4. 特定のテストのみ実行
npx playwright test --grep "特定のテスト名"
```

#### 2. スクリーンショットが真っ白

**問題**: 撮影されたスクリーンショットが真っ白になる

```bash
# 解決方法
# 1. 待機時間を追加
await page.waitForTimeout(3000);

# 2. 要素の表示を確認してから撮影
await expect(element).toBeVisible();
await takeScreenshot(page, 'screenshot-name');

# 3. ネットワーク待機
await page.waitForLoadState('networkidle');
```

#### 3. AI 機能テストが失敗する

**問題**: AI API との通信でエラーが発生する

```bash
# 解決方法
# 1. 環境変数の確認
echo $OPENAI_API_KEY

# 2. プロキシサーバーの起動確認
curl http://localhost:4001/health

# 3. APIキーの有効性確認
# 4. レート制限の確認
```

#### 4. セレクターが見つからない

**問題**: 要素のセレクターが見つからない

```typescript
// 解決方法
// 1. 複数のセレクターを試す
const element = page.locator(
  'button:has-text("保存"), [data-testid="save-button"]'
);

// 2. 待機時間を追加
await page.waitForSelector('button:has-text("保存")', { timeout: 10000 });

// 3. 要素の存在確認
if ((await element.count()) > 0) {
  await element.click();
}
```

#### 5. タイムアウトエラー

**問題**: テストがタイムアウトで失敗する

```typescript
// 解決方法
// 1. タイムアウト時間を延長
test.setTimeout(60000); // 60秒

// 2. 段階的な待機
await page.waitForLoadState("domcontentloaded");
await page.waitForLoadState("networkidle");

// 3. 特定の要素の待機
await page.waitForSelector('[data-testid="target-element"]', {
  timeout: 30000,
});
```

## 🚀 CI/CD 統合

### GitHub Actions 設定例

```yaml
name: E2E Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start development server
        run: |
          npm run dev &
          npx wait-on http://localhost:5173

      - name: Run E2E tests
        run: npm run test:evidence
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-screenshots
          path: apps/frontend/evidence-*.png

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
```

## 📊 テスト結果の分析

### 成功基準

#### 機能テスト

- ✅ 全ページの基本機能が正常動作
- ✅ AI 機能の完全なワークフロー実行
- ✅ エラーハンドリングの適切な動作

#### パフォーマンステスト

- ✅ ページ読み込み時間: 10 秒以内
- ✅ 章選択時間: 2 秒以内
- ✅ テキスト入力応答: 1 秒以内
- ✅ 保存処理時間: 3 秒以内

#### レスポンシブテスト

- ✅ デスクトップ（1920x1080）での正常表示
- ✅ タブレット（768x1024）での正常表示
- ✅ モバイル（375x667）での正常表示

### 失敗時の対応

#### 1. 即座に対応が必要

- セキュリティエラー
- データ損失の可能性
- 基本機能の完全停止

#### 2. 優先度高

- AI 機能の部分的な不具合
- パフォーマンスの大幅な劣化
- レスポンシブ表示の問題

#### 3. 優先度中

- UI/UX の軽微な問題
- スクリーンショットの差異
- 非クリティカルな機能の不具合

## 📝 テスト記録とレポート

### 実行ログの保存

```bash
# テスト実行ログを保存
npx playwright test --reporter=json > test-results.json

# HTMLレポート生成
npx playwright test --reporter=html

# JUnit形式でのレポート出力
npx playwright test --reporter=junit
```

### 定期実行スケジュール

#### 日次実行

- 基本機能テスト
- エビデンステスト
- パフォーマンステスト

#### 週次実行

- 全ページ包括テスト
- レスポンシブテスト
- AI 機能完全テスト

#### リリース前実行

- 全テストスイート実行
- 回帰テスト
- ストレステスト

## 🔄 継続的改善

### テストの追加・更新

#### 新機能追加時

1. 新機能のテストシナリオ作成
2. 既存テストへの影響確認
3. エビデンステストの更新

#### バグ修正時

1. バグ再現テストの作成
2. 修正後の検証テスト追加
3. 回帰テストの強化

### メンテナンス

#### 月次メンテナンス

- セレクターの更新確認
- タイムアウト設定の見直し
- スクリーンショット基準の更新

#### 四半期メンテナンス

- テスト戦略の見直し
- パフォーマンス基準の調整
- CI/CD 設定の最適化

---

## 📞 サポート

### 問い合わせ先

- 技術的な問題: 開発チーム
- テスト戦略: QA チーム
- CI/CD 関連: DevOps チーム

### 参考資料

- [Playwright 公式ドキュメント](https://playwright.dev/)
- [プロジェクト技術要件](./技術要件.md)
- [AI エージェント実装方針](./AIエージェント実装方針.md)

---

**最終更新**: 2025 年 1 月 25 日
**バージョン**: 1.0.0
