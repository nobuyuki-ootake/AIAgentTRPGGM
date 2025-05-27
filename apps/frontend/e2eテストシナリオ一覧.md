# e2e テストシナリオ一覧

## 概要

小説創作支援ツールの各ページについて、**実際の AI 機能を前提とした**画面表示と AI 機能のテストを実装します。

## 🔧 **ChapterList 修正検証テスト（2025-01-25 追加）**

### 📋 **修正内容**

- **問題**: `ChapterList.tsx:43`で「0 is read-only」エラーが発生
- **原因**: Recoil の読み取り専用配列を直接ソートしようとしていた
- **解決**: `chapters.sort()` → `[...chapters].sort()` に変更

### 🧪 **検証テストファイル**

**ファイル**: `e2e/pages/chapter-list-fix-verification.spec.ts`

#### テストシナリオ

- [x] **修正検証テスト**: 複数章の作成とソート機能

  - [x] 初期状態（章なし）のスクリーンショット
  - [x] 第 1 章作成と ChapterList 表示確認
  - [x] 第 2 章作成とソート機能確認
  - [x] 第 3 章作成と完全ソート確認
  - [x] 章選択機能の動作確認
  - [x] エラーが発生しないことの確認

- [x] **エラーハンドリング検証**: 集中的なソート処理テスト

  - [x] 5 つの章を連続作成
  - [x] 章選択の繰り返し実行
  - [x] コンソールエラーとページエラーの監視
  - [x] 「read-only」エラーが発生しないことの確認

- [x] **レスポンシブ表示検証**: 各デバイスサイズでの表示確認
  - [x] デスクトップサイズでの表示
  - [x] タブレットサイズでの表示
  - [x] モバイルサイズでの表示
  - [x] 全サイズで ChapterList が正常表示されることの確認

### 🎯 **テスト目的**

1. **修正の有効性確認**: 「0 is read-only」エラーが解決されていることを証明
2. **機能の完全性確認**: 修正後も全ての機能が正常に動作することを確認
3. **保守性の向上**: 今後の変更時に回帰テストとして活用
4. **視覚的記録**: スクリーンショットで修正前後の状態を記録

### 📸 **スクリーンショット一覧**

- `chapter-list-fix-01-initial-empty`: 初期状態（章なし）
- `chapter-list-fix-02-new-chapter-dialog`: 新規章作成ダイアログ
- `chapter-list-fix-03-chapter1-filled`: 第 1 章入力完了
- `chapter-list-fix-04-chapter1-created`: 第 1 章作成後
- `chapter-list-fix-05-chapter2-filled`: 第 2 章入力完了
- `chapter-list-fix-06-chapter2-created-sorted`: 第 2 章作成後（ソート確認）
- `chapter-list-fix-07-chapter3-filled`: 第 3 章入力完了
- `chapter-list-fix-08-chapter3-created-all-sorted`: 第 3 章作成後（完全ソート確認）
- `chapter-list-fix-09-chapter1-selected`: 第 1 章選択状態
- `chapter-list-fix-10-chapter2-selected`: 第 2 章選択状態
- `chapter-list-fix-11-chapter3-selected`: 第 3 章選択状態
- `chapter-list-fix-12-verification-complete`: 検証完了状態

## 新しいテスト方針（2025-01-25 更新）

### 🎯 **ユーザー体験重視のテスト**

従来の「AI アシスト機能が見つからない場合はスキップ」という消極的なアプローチから、**実際の AI 機能を前提とした積極的なテスト**に変更しました。

### 🚀 **AI アシスト機能の完全テスト**

1. **フローティングボタンから AI チャットパネルを開く**
2. **アシストタブでコンテンツ生成**
3. **チャットタブで AI と対話**
4. **生成されたコンテンツの確認**
5. **UI の更新状況をスクリーンショット**

### 📝 **執筆画面での小説作成フロー**

特に執筆ページでは、「AI アシスト機能を使って実際に小説を作成できる」ことを重点的にテストします。

## テスト実行の前提条件と手順

### 1. 開発サーバーの起動

e2e テストを実行する前に、必ず開発サーバーを手動で起動してください：

```bash
cd apps/frontend
npm run dev
```

開発サーバーが `http://localhost:5173` で起動していることを確認してください。

### 2. Playwright 設定の調整

現在の設定では、webServer の自動起動を無効にしています。手動で開発サーバーを起動した後にテストを実行してください。

### 3. テスト実行コマンド

```bash
# 全テスト実行
npx playwright test e2e/pages/ --reporter=line

# 特定のページのテスト実行（推奨）
npx playwright test e2e/pages/writing-page.spec.ts --reporter=line
npx playwright test e2e/pages/plot-page.spec.ts --reporter=line
npx playwright test e2e/pages/synopsis-page.spec.ts --reporter=line

# ヘッドレスモードでの実行
npx playwright test --headed

# デバッグモード
npx playwright test --debug
```

### 4. 現在の実行結果

**最新テスト実行結果（2025-01-25）:**

- ✅ **78 個のテストが成功**
- ⚠️ **19 個のテストが失敗**（主にスクリーンショット比較とタイムアウト）

**AI 機能テスト対応状況:**

- ✅ **WritingPage**: AI アシスト機能を使った小説執筆フロー実装済み
- ✅ **PlotPage**: AI アシスト機能を使ったプロット作成フロー実装済み
- ✅ **SynopsisPage**: AI アシスト機能を使ったあらすじ作成フロー実装済み
- 🔄 **TimelinePage**: AI 機能テスト更新予定
- 🔄 **WorldBuildingPage**: AI 機能テスト更新予定

## テスト対象ページ

### 1. HomePage (ホームページ) - ✅ 完了

**ファイル**: `e2e/pages/home-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [x] 新規プロジェクト作成ダイアログの表示
- [x] プロジェクト一覧の表示
- [x] プロジェクト削除機能の確認
- [x] ツールの特徴と使い方セクションの表示
- [x] レスポンシブデザインの確認

**修正完了**: タイトル検証とセレクター修正済み

### 2. ProjectsPage (プロジェクト一覧ページ) - ⚠️ 部分的に動作

**ファイル**: `e2e/pages/projects-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [⚠️] プロジェクト選択機能の確認（要素検出改善中）
- [⚠️] プロジェクト作成機能の確認（要素検出改善中）
- [⚠️] プロジェクト詳細情報の表示（要素検出改善中）
- [x] プロジェクト検索・フィルタ機能の確認
- [x] レスポンシブデザインの確認

**修正状況**: セレクター改善、待機時間追加済み

### 3. SynopsisPage (あらすじページ) - ✅ AI 機能完全対応

**ファイル**: `e2e/pages/synopsis-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [x] **🆕 AI アシスト機能を使ったあらすじ作成フロー**
  - [x] フローティングボタンから AI チャットパネルを開く
  - [x] アシストタブであらすじ生成
  - [x] チャットタブで AI と対話
  - [x] 生成完了後の UI 確認
- [x] あらすじ編集機能の確認
- [x] 保存機能の確認
- [x] あらすじ編集のキャンセル機能
- [x] あらすじのヒント・ティップス表示
- [x] 未保存変更の警告ダイアログ
- [x] レスポンシブデザインの確認

**テスト結果**: AI 機能完全対応済み ✅

### 4. PlotPage (プロットページ) - ✅ AI 機能完全対応

**ファイル**: `e2e/pages/plot-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [x] **🆕 AI アシスト機能を使ったプロット作成フロー**
  - [x] フローティングボタンから AI チャットパネルを開く
  - [x] アシストタブでプロット生成
  - [x] チャットタブで AI と対話
  - [x] 生成完了後の UI 確認
- [x] プロット項目の追加機能
- [x] プロット項目の編集機能
- [x] プロット項目のステータス変更
- [x] プロット項目の削除機能
- [x] 変更保存機能の確認
- [x] プロット項目の統計表示
- [x] レスポンシブデザインの確認

**テスト結果**: AI 機能完全対応済み ✅

### 5. TimelinePage (タイムラインページ) - 🔄 AI 機能更新予定

**ファイル**: `e2e/pages/timeline-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [🔄] **AI アシスト機能を使ったタイムライン作成フロー**（更新予定）
- [x] イベント追加機能
- [x] イベントのドラッグ&ドロップ機能
- [x] タイムライン設定機能
- [x] タイムラインチャートの表示
- [x] 変更保存機能の確認
- [x] レスポンシブデザインの確認

**修正状況**: 基本機能完了、AI 機能テスト更新予定

### 6. WorldBuildingPage (世界観構築ページ) - 🔄 AI 機能更新予定

**ファイル**: `e2e/pages/world-building-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [🔄] **AI アシスト機能を使った世界観構築フロー**（更新予定）
- [x] 各タブの表示確認
- [x] 世界観要素の追加・編集機能
- [x] 保存機能の確認
- [x] 世界観設定タブの編集機能
- [x] ワールドマップタブの機能
- [x] 世界観リセット機能
- [x] 状態定義タブの機能
- [x] レスポンシブデザインの確認

**修正状況**: 基本機能完了、AI 機能テスト更新予定

### 7. WritingPage (執筆ページ) - ✅ AI 機能完全対応

**ファイル**: `e2e/pages/writing-page.spec.ts`

#### テストシナリオ

- [x] ページの初期表示確認
- [x] スクリーンショット撮影
- [x] **🆕 AI アシスト機能を使った小説執筆フロー**
  - [x] フローティングボタンから AI チャットパネルを開く
  - [x] アシストタブで章生成
  - [x] チャットタブで AI と対話
  - [x] 生成完了後の UI 確認
- [x] 章の作成機能
- [x] エディターでの執筆機能
- [x] AI 章生成機能の確認
- [x] 保存機能の確認
- [x] 関連イベントの割り当て機能
- [x] ページ機能の確認
- [x] 章リストの表示と選択
- [x] レスポンシブデザインの確認

**テスト結果**: AI 機能完全対応済み ✅

## 🆕 新しい AI 機能テストヘルパー

### 追加されたヘルパー関数

```typescript
// AIチャットパネルを開く（フローティングボタンから）
await openAIChatPanel(page);

// アシストタブに切り替える
await switchToAIAssistTab(page);

// AIアシスト機能でコンテンツ生成
await generateAIContent(page, "指示内容");

// AIチャットでメッセージ送信
await sendAIChatMessage(page, "メッセージ");

// AIチャットパネルを閉じる
await closeAIChatPanel(page);
```

### 実際の AI 機能構造

1. **フローティングボタン**: 右下の固定位置にあるチャットアイコン
2. **Drawer**: MUI の Drawer コンポーネントでパネル表示
3. **3 つのタブ**: チャット、アシスト、設定
4. **アシストタブ**: 各ページ専用の AI 機能
5. **チャットタブ**: 自由な AI 対話

## 修正完了項目

### 共通修正事項

1. **AI アシスト機能の完全対応**: 実際の実装に基づいたテスト
2. **フローティングボタンの検出**: 右下固定位置のボタンを正確に検出
3. **Drawer の待機**: MUIDrawer の開閉を適切に待機
4. **タブ切り替え**: アシストタブとチャットタブの切り替え
5. **AI 生成の待機**: 生成完了まで最大 30 秒待機

### 個別修正事項

1. **WritingPage**: 小説執筆フローの完全実装
2. **PlotPage**: プロット作成フローの完全実装
3. **SynopsisPage**: あらすじ作成フローの完全実装

## 既知の問題と対処法

### 1. AI 機能の前提条件

**前提**: AI アシスト機能が実装済みであること
**対処法**: 実際の AI 機能を前提としたテストに変更済み

### 2. フローティングボタンの検出

**問題**: 右下のフローティングボタンが見つからない
**対処法**:

```typescript
const floatingButton = page.locator(
  'button[style*="position: fixed"][style*="bottom: 20"][style*="right: 20"], ' +
    'button:has(svg[data-testid="ChatBubbleIcon"])'
);
```

### 3. AI 生成の待機時間

**問題**: AI 生成に時間がかかる
**対処法**: 最大 30 秒の待機時間を設定

### 4. スクリーンショット比較

**問題**: AI 生成後の UI が動的に変化
**対処法**: 生成完了後に適切なタイミングでスクリーンショット撮影

## 次の修正予定

1. **TimelinePage**: AI 機能テストの追加
2. **WorldBuildingPage**: AI 機能テストの追加
3. **ProjectsPage**: MUI コンポーネントの要素検出改善

## 共通テスト要件

### 画面表示テスト

- ページの正常な読み込み確認
- 主要 UI 要素の表示確認
- レスポンシブデザインの確認

### AI アシスト機能テスト

- フローティングボタンのクリック
- AI チャットパネルの表示確認
- アシストタブでのコンテンツ生成
- チャットタブでの AI 対話
- 生成完了後の UI 確認
- 各段階でのスクリーンショット撮影

### スクリーンショットテスト

- 初期表示状態
- AI 機能使用前
- AI チャットパネル表示
- アシストタブ表示
- AI 生成完了後
- AI 対話後
- パネル閉じた後

## テスト実行環境

- ブラウザ: Chromium (Desktop Chrome)
- 解像度: 1280x720
- ベース URL: http://localhost:5173
- 開発サーバー: 手動起動必須
- AI 機能: 実装済み前提

## 進捗管理

- ❌ 未実装
- ⚠️ 部分実装/修正中
- 🔄 AI 機能更新予定
- ✅ 完了

## 実装済みファイル一覧

1. `e2e/utils/test-helpers.ts` - AI 機能対応ヘルパー（完全更新済み）
2. `e2e/pages/home-page.spec.ts` - ホームページテスト（完了）
3. `e2e/pages/projects-page.spec.ts` - プロジェクト一覧ページテスト（部分的）
4. `e2e/pages/synopsis-page.spec.ts` - あらすじページテスト（AI 機能完全対応）
5. `e2e/pages/plot-page.spec.ts` - プロットページテスト（AI 機能完全対応）
6. `e2e/pages/timeline-page.spec.ts` - タイムラインページテスト（AI 機能更新予定）
7. `e2e/pages/world-building-page.spec.ts` - 世界観構築ページテスト（AI 機能更新予定）
8. `e2e/pages/writing-page.spec.ts` - 執筆ページテスト（AI 機能完全対応）

## テスト実行方法

### 推奨実行手順

1. **開発サーバー起動**

```bash
cd apps/frontend
npm run dev
```

2. **サーバー起動確認**

```bash
curl -I http://localhost:5173
```

3. **AI 機能対応テスト実行**

```bash
# AI機能完全対応ページ（推奨）
npx playwright test e2e/pages/writing-page.spec.ts --reporter=line
npx playwright test e2e/pages/plot-page.spec.ts --reporter=line
npx playwright test e2e/pages/synopsis-page.spec.ts --reporter=line

# 全テスト実行
npx playwright test e2e/pages/ --reporter=line
```

### 特定の AI 機能テスト実行

```bash
# AIアシスト機能のテストのみ
npx playwright test --grep "AIアシスト機能を使った"

# AI生成フローのテストのみ
npx playwright test --grep "フロー"
```

## 注意事項

- **AI 機能が実装済みであることが前提**
- AI 生成には実際の API 呼び出しが発生するため、テスト環境での API 設定が必要
- AI 生成の待機時間は最大 30 秒に設定
- スクリーンショットは AI 生成完了後に撮影
- フローティングボタンは右下固定位置に配置

## トラブルシューティング

### よくある問題

1. **フローティングボタンが見つからない**: AI チャットパネルが実装されていない

   - 解決法: AIChatPanel コンポーネントの実装確認

2. **AI 生成がタイムアウト**: API 設定やネットワークの問題

   - 解決法: AI 設定タブで API キーの確認

3. **Drawer が開かない**: MUI コンポーネントの問題
   - 解決法: セレクターの調整

### デバッグ方法

```bash
# デバッグモードでAI機能テスト実行
npx playwright test e2e/pages/writing-page.spec.ts --debug

# ヘッドレスモードで実行
npx playwright test --headed
```

### 修正履歴

- 2025-01-25: **AI 機能完全対応への大幅更新**
  - WritingPage: AI アシスト機能を使った小説執筆フロー実装
  - PlotPage: AI アシスト機能を使ったプロット作成フロー実装
  - SynopsisPage: AI アシスト機能を使ったあらすじ作成フロー実装
  - test-helpers.ts: AI 機能対応ヘルパー関数追加
  - 実際のユーザー体験を重視したテスト方針に変更
- 2025-01-25: 実行条件と手順を明確化
- 2025-01-25: 全ページの e2e テスト修正完了（基本機能）
