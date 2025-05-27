# 執筆機能エビデンステスト

## 概要

このドキュメントは、「ユーザーが執筆できること」を証明するための自動化されたエビデンステストについて説明します。

## 背景

- **問題**: ChapterList コンポーネントで「0 is read-only」エラーが発生し、執筆機能が使用できない状態でした
- **修正**: `chapters.sort()` を `[...chapters].sort()` に変更してエラーを解決
- **目的**: 修正の効果を証明し、今後の回帰を防ぐためのエビデンスを自動撮影

## テストファイル構成

### 1. メインテストファイル

#### `writing-evidence-simplified.spec.ts`（推奨）

- **用途**: 日常的なエビデンス撮影と CI/CD
- **特徴**: ヘルパー関数を使用した簡潔で保守性の高いテスト
- **実行時間**: 約 3-5 分

#### `writing-functionality-evidence.spec.ts`（詳細版）

- **用途**: 詳細な検証が必要な場合
- **特徴**: 手動操作ログを完全に再現した包括的なテスト
- **実行時間**: 約 8-12 分

### 2. ヘルパーファイル

#### `utils/evidence-helpers.ts`

- **用途**: テスト共通機能の提供
- **機能**: スクリーンショット撮影、エラー監視、パフォーマンス測定など

## テスト実行方法

### 基本的な実行

```bash
# 簡潔版エビデンステスト（推奨）
npm run test:evidence

# ブラウザ表示付きで実行（デバッグ用）
npm run test:evidence:headed

# 詳細版エビデンステスト
npm run test:evidence:full

# 回帰テストのみ実行
npm run test:regression
```

### 個別テスト実行

```bash
# 特定のテストのみ実行
npx playwright test e2e/pages/writing-evidence-simplified.spec.ts --grep="ワークフロー証明"

# レスポンシブテストのみ実行
npx playwright test e2e/pages/writing-evidence-simplified.spec.ts --grep="レスポンシブ"

# パフォーマンステストのみ実行
npx playwright test e2e/pages/writing-evidence-simplified.spec.ts --grep="パフォーマンス"
```

## 撮影されるエビデンス

### 基本ワークフロー（8 枚）

1. `evidence-01-home-before-project-selection.png` - ホームページ（プロジェクト選択前）
2. `evidence-02-project-detail-before-writing.png` - プロジェクト詳細画面
3. `evidence-03-writing-page-chapter-list-fixed.png` - 執筆画面（ChapterList 修正後）
4. `evidence-04-chapter-selected-editor-ready.png` - 章選択後のエディター表示
5. `evidence-05-writing-in-progress-text-entered.png` - 文章入力中
6. `evidence-06-writing-saved-successfully.png` - 保存完了後
7. `evidence-07-chapter-switching-works.png` - 章切り替え機能
8. `evidence-08-final-writing-functionality-confirmed.png` - 最終確認

### レスポンシブ対応（3 枚）

- `evidence-responsive-desktop-writing.png` - デスクトップ表示
- `evidence-responsive-tablet-writing.png` - タブレット表示
- `evidence-responsive-mobile-writing.png` - モバイル表示

### 回帰テスト（章数分）

- `evidence-regression-chapter-1.png` - 第 1 章選択
- `evidence-regression-chapter-2.png` - 第 2 章選択
- `evidence-regression-chapter-3.png` - 第 3 章選択（存在する場合）

### パフォーマンステスト（1 枚）

- `evidence-performance-large-text.png` - 大量テキスト入力後

## 検証項目

### ✅ 機能検証

- [x] プロジェクト選択機能
- [x] 執筆画面への移動
- [x] ChapterList の正常表示（ソート機能）
- [x] 章選択機能
- [x] 文章入力機能
- [x] 保存機能
- [x] 章切り替え機能
- [x] 内容の永続化

### ✅ エラー検証

- [x] 「0 is read-only」エラーが発生しない
- [x] TypeError が発生しない
- [x] コンソールエラーの監視

### ✅ パフォーマンス検証

- [x] ページ読み込み時間（10 秒以内）
- [x] 章選択時間（2 秒以内）
- [x] テキスト入力時間（5 秒以内）
- [x] 保存時間（3 秒以内）

### ✅ レスポンシブ検証

- [x] デスクトップ表示（1920x1080）
- [x] タブレット表示（768x1024）
- [x] モバイル表示（375x667）

## CI/CD 統合

### GitHub Actions 例

```yaml
name: Evidence Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  evidence-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install

      - name: Run evidence tests
        run: npm run test:evidence

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: evidence-screenshots
          path: apps/frontend/evidence-*.png
```

## トラブルシューティング

### よくある問題

#### 1. テストが失敗する

```bash
# 開発サーバーが起動していることを確認
npm run dev

# ポート5173でアクセスできることを確認
curl http://localhost:5173
```

#### 2. スクリーンショットが真っ白

```bash
# ブラウザ表示付きで実行してデバッグ
npm run test:evidence:headed

# Playwrightの設定を確認
npx playwright show-report
```

#### 3. プロジェクトが見つからない

- テストデータが正しく設定されているか確認
- プロジェクト名のパターンマッチングを確認

### デバッグ方法

```bash
# デバッグモードで実行
npx playwright test --debug

# 特定のテストをステップ実行
npx playwright test --debug --grep="ワークフロー証明"

# トレースファイルの確認
npx playwright show-trace test-results/trace.zip
```

## 保守性向上のポイント

### 1. ヘルパー関数の活用

- 共通操作をヘルパー関数に集約
- テストコードの重複を削減
- 変更時の影響範囲を最小化

### 2. 設定の外部化

- テキストサンプルを定数として定義
- パフォーマンス基準を設定ファイルに
- 環境依存の設定を分離

### 3. エラーハンドリング

- 適切なエラーメッセージの提供
- 失敗時の詳細情報出力
- 回復可能なエラーの自動処理

## 今後の拡張

### 1. 追加テストシナリオ

- [ ] 複数プロジェクトでの動作確認
- [ ] 大量章数での性能テスト
- [ ] 同時編集シナリオ
- [ ] オフライン/オンライン切り替え

### 2. 自動化の改善

- [ ] 失敗時の自動リトライ
- [ ] 動的なテストデータ生成
- [ ] 並列実行の最適化
- [ ] レポート生成の自動化

### 3. 監視の強化

- [ ] リアルタイムエラー監視
- [ ] パフォーマンス劣化の検出
- [ ] ユーザビリティメトリクス
- [ ] アクセシビリティチェック

## まとめ

このエビデンステストにより、以下が保証されます：

1. **機能の完全性**: ユーザーが確実に執筆できること
2. **修正の効果**: ChapterList 修正が正常に動作すること
3. **回帰の防止**: 今後の変更で機能が壊れないこと
4. **品質の維持**: 継続的な品質保証の仕組み

コンテキスト長の問題を解決し、コードとして保存されたこれらのテストは、長期的な保守性と信頼性を提供します。
