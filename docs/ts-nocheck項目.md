# TypeScript @ts-nocheck 技術的負債管理

このドキュメントは、TypeScriptの厳密な型チェックを回避するために`@ts-nocheck`ディレクティブを追加したファイルの一覧と、対応優先度を管理します。

## 概要

- **作成日**: 2025年6月9日
- **目的**: TypeScriptエラーを機能を減らすことなく修正し、commit可能な状態にする
- **対応方針**: 利用状況と重要度に基づく段階的な技術的負債解消

## 対応優先度の定義

- **🔴 Critical**: 現在利用中 & 重要度高 → 即座対応（1週間以内）
- **🟠 High**: 現在利用中 & 重要度中 → 中期対応（1ヶ月以内）
- **🟡 Medium**: 部分利用 & 重要度中 → 長期対応（3ヶ月以内）
- **🟢 Low**: 未使用 or 重要度低 → 対応不要

---

## 🔴 Critical - 優先対応が必要

### フロントエンド（コア機能）

- [ ] `/apps/frontend/src/components/ai/AIOperationProgress.tsx`
  - **利用状況**: 現在利用中
  - **重要度**: 高（AI操作の進捗表示）
  - **問題**: Material-UI Avatar/LinearProgressの無効prop（`size`プロパティ）
  - **対応内容**: 無効なpropsの削除、明示的なreturn文の追加

- [ ] `/apps/frontend/src/utils/trpgLocalStorage.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 高（データ永続化の中核）
  - **問題**: サンプルデータの複雑な型不一致
  - **対応内容**: 型定義の統一、TRPGCharacter型との整合性確保

- [ ] `/apps/frontend/src/components/ai/AISettingsTab.tsx`
  - **利用状況**: 現在利用中
  - **重要度**: 高（AI設定管理）
  - **問題**: undefined型の処理、null coalescing
  - **対応内容**: `apiKey || ""`、`modelName || ""`の適切な型処理

### バックエンド（コア機能）

- [ ] `/apps/proxy-server/src/services/aiIntegration.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 高（AI統合の中核サービス）
  - **問題**: 環境変数のインデックスシグネチャアクセス、型不一致
  - **対応内容**: `process.env['OPENAI_API_KEY']`記法への変更、型安全性の確保

- [ ] `/apps/proxy-server/src/index.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 高（プロキシサーバーのメインファイル）
  - **問題**: 環境変数アクセス、関数戻り値の型
  - **対応内容**: 環境変数の適切なアクセス、全コードパスでの戻り値保証

---

## 🟠 High - 中期対応

### フロントエンド

- [ ] `/apps/frontend/src/utils/resourceTracker.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（パフォーマンス監視）
  - **問題**: `undefined`型を`null`型に変換する処理
  - **対応内容**: `current?.memory?.used || 0`の型安全性確保

- [ ] `/apps/frontend/src/store/selectors.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（Recoilセレクタ）
  - **問題**: TRPGCharacterの`role`属性不一致
  - **対応内容**: 型定義の統一、共通型の利用

### バックエンド

- [ ] `/apps/proxy-server/src/auth/auth.service.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（認証サービス）
  - **問題**: JWT型不一致、環境変数アクセス
  - **対応内容**: JWT署名オプションの型修正、環境変数の適切なアクセス

- [ ] `/apps/proxy-server/src/db/connection.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（データベース接続）
  - **問題**: 環境変数アクセス、関数引数の型
  - **対応内容**: `process.env['DB_DIR']`記法、関数呼び出しの引数修正

- [ ] `/apps/proxy-server/src/services/google-cloud.service.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（Google Cloud統合）
  - **問題**: エラーハンドリングの型、数値/文字列変換
  - **対応内容**: `error instanceof Error`チェック、型変換の明示化

- [ ] `/apps/proxy-server/src/services/socket.service.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（WebSocket通信）
  - **問題**: 環境変数アクセス、型比較
  - **対応内容**: 環境変数の適切なアクセス、文字列/数値比較の修正

---

## 🟡 Medium - 長期対応

### フロントエンド

- [ ] `/apps/frontend/src/components/characters/PartyBalanceEvaluator.tsx`
  - **利用状況**: 部分利用
  - **重要度**: 中（パーティバランス分析）
  - **問題**: TRPGCharacter型の`stats`属性不一致、配列メソッドの型
  - **対応内容**: 共通型定義の利用、型安全なスキルチェック

- [ ] `/apps/frontend/src/utils/CharacterSheetExporter.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（キャラクターシート出力）
  - **問題**: インデックスシグネチャアクセス、属性不一致
  - **対応内容**: ブラケット記法への変更、型定義の統一

### バックエンド（API Routes）

- [ ] `/apps/proxy-server/src/routes/aiAgent.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（AI API）
  - **対応内容**: 戻り値の型保証、エラーハンドリング

- [ ] `/apps/proxy-server/src/routes/characters.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（キャラクター API）
  - **対応内容**: 戻り値の型保証、TRPGCharacter型の統一

- [ ] `/apps/proxy-server/src/routes/campaigns.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（キャンペーン API）
  - **対応内容**: 戻り値の型保証、エラーハンドリング

- [ ] `/apps/proxy-server/src/routes/sessions.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（セッション API）
  - **対応内容**: 戻り値の型保証、unknown型の処理

- [ ] `/apps/proxy-server/src/routes/enemies.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（エネミー API）
  - **対応内容**: 戻り値の型保証、型定義の統一

- [ ] `/apps/proxy-server/src/routes/npcs.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（NPC API）
  - **対応内容**: 戻り値の型保証、キャラクタータイプの統一

- [ ] `/apps/proxy-server/src/routes/google-cloud.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（Google Cloud API）
  - **対応内容**: 環境変数アクセス、戻り値の型保証

- [ ] `/apps/proxy-server/src/routes/image-upload.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（画像アップロード API）
  - **対応内容**: 戻り値の型保証、未使用変数の削除

- [ ] `/apps/proxy-server/src/routes/auth.ts`
  - **利用状況**: 部分利用
  - **重要度**: 中（認証 API）
  - **対応内容**: 戻り値の型保証、エラーハンドリング

### バックエンド（その他）

- [ ] `/apps/proxy-server/src/db/models/Character.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（キャラクターモデル）
  - **対応内容**: TRPGCharacter型との整合性確保

- [ ] `/apps/proxy-server/src/db/models/Campaign.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（キャンペーンモデル）
  - **対応内容**: TRPGCampaign型との整合性確保

- [ ] `/apps/proxy-server/src/middleware/auth.middleware.ts`
  - **利用状況**: 現在利用中
  - **重要度**: 中（認証ミドルウェア）
  - **対応内容**: 戻り値の型保証、環境変数アクセス

---

## 🟢 Low - 対応不要

### 未使用・実験的機能

- [ ] `/apps/frontend/src/utils/AITacticalEngine.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（戦術エンジン）
  - **理由**: 実験的機能、現在未使用

- [ ] `/apps/frontend/src/components/ai/AIImageGenerator.tsx`
  - **利用状況**: 未使用
  - **重要度**: 低（AI画像生成）
  - **理由**: Material-UI Grid v7互換性、現在未使用

- [ ] `/apps/frontend/src/components/ai/AdvancedAIGMSystem.tsx`
  - **利用状況**: 未使用
  - **重要度**: 低（高度なAI GM）
  - **理由**: 実験的機能、現在未使用

- [ ] `/apps/frontend/src/utils/trpgPerformanceTesting.ts`
  - **利用状況**: テスト専用
  - **重要度**: 低（パフォーマンステスト）
  - **理由**: テスト用ユーティリティ

### テストファイル

- [ ] `/apps/frontend/src/test/TRPGSessionIntegrationTest.tsx`
  - **利用状況**: テストファイル
  - **重要度**: 低
  - **理由**: 統合テスト用コンポーネント

### 永続化関連（複雑な型システム）

- [ ] `/apps/frontend/src/utils/persistence/DataPersistenceManager.ts`
- [ ] `/apps/frontend/src/utils/persistence/IndexedDBManager.ts`
- [ ] `/apps/frontend/src/utils/persistence/SessionStorageManager.ts`
- [ ] `/apps/frontend/src/utils/persistence/SyncManager.ts`
  - **利用状況**: 部分利用
  - **重要度**: 低（データ永続化）
  - **理由**: 複雑な型システム、代替手段あり

### バックエンド（未使用・実験的）

- [ ] `/apps/proxy-server/src/agents/index.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（Mastraエージェント）

- [ ] `/apps/proxy-server/src/mastra/index.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（Mastraモック）

- [ ] `/apps/proxy-server/src/networks/index.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（ネットワーク定義）

- [ ] `/apps/proxy-server/src/tools/index.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（AI ツール）

- [ ] `/apps/proxy-server/src/utils/aiErrorHandler.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（AIエラーハンドラ）

- [ ] `/apps/proxy-server/src/utils/aiRequestStandard.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（AI リクエスト標準化）

- [ ] `/apps/proxy-server/src/utils/aiTemplateManager.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（AIテンプレート管理）

- [ ] `/apps/proxy-server/src/utils/systemPrompts.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（システムプロンプト）

- [ ] `/apps/proxy-server/src/utils/worldBuildingSchemas.ts`
  - **利用状況**: 未使用
  - **重要度**: 低（世界観構築スキーマ）

---

## 対応ガイドライン

### 即座対応（Critical）の進め方

1. **AIOperationProgress.tsx**: 
   - Material-UI v7の正しいAPI確認
   - 無効なpropsの削除
   - useEffectの明示的return追加

2. **trpgLocalStorage.ts**:
   - `/packages/types/index.ts`の型定義確認
   - サンプルデータの型修正
   - 型変換ヘルパー関数の削除検討

3. **AISettingsTab.tsx**:
   - null coalescing演算子の活用
   - optional chainingの適切な使用

### 中期対応（High）の進め方

1. **環境変数アクセスの統一**:
   ```typescript
   // 修正前
   process.env.API_KEY
   
   // 修正後
   process.env['API_KEY']
   ```

2. **戻り値の型保証**:
   ```typescript
   // 修正前
   function handler() {
     if (condition) {
       return response;
     }
     // return文なし
   }
   
   // 修正後
   function handler() {
     if (condition) {
       return response;
     }
     return defaultResponse;
   }
   ```

### 進捗管理

- [ ] 週次で進捗確認
- [ ] Critical項目完了後、High項目へ移行
- [ ] 各項目完了時にチェックボックスを更新
- [ ] 技術的負債の削減状況をメトリクスで追跡

---

## 更新履歴

- **2025/06/09**: 初回作成、全95ファイルの分析と分類完了