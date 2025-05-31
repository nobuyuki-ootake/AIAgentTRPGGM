# TRPGプロジェクト変更のためのTODOリスト

## 1. インフラストラクチャ・デプロイメント変更

### 1.1 Google Cloud Run対応（モノリポ→マルチサービス構成）
- [x] `railway.json` → 削除（不要）
- [x] `apprunner.yaml` → 削除（不要）
- [x] `apps/frontend/Dockerfile` → Cloud Run用フロントエンド用Dockerfile作成
- [x] `apps/proxy-server/Dockerfile` → Cloud Run用バックエンド用Dockerfile作成
- [x] `apps/frontend/cloudbuild.yaml` → フロントエンド用ビルド設定作成
- [x] `apps/proxy-server/cloudbuild.yaml` → バックエンド用ビルド設定作成
- [x] `.gcloudignore` → Cloud Build最適化用ignoreファイル作成
- [x] `turbo.json` → Cloud Run用ビルド最適化設定追加
- [x] Cloud Storage設定ファイル作成（環境変数設定）
- [x] Litestream設定ファイル作成（`litestream.yml`）

### 1.2 Docker設定の最適化
- [x] `apps/frontend/Dockerfile` → `turbo prune`を使用した最適化Dockerfile
- [x] `apps/proxy-server/Dockerfile` → `turbo prune`を使用した最適化Dockerfile
- [x] `.dockerignore` → ビルド効率化用設定
- [ ] `docker-compose.yml` → 開発用にCloud Storage・Litestream エミュレータ対応

### 1.3 CI/CD パイプライン設定
- [ ] Cloud Build トリガー設定（フロントエンド・バックエンド別々）
- [ ] Cloud Run サービス設定（trpg-frontend, trpg-backend）
- [ ] Cloud Run IAM設定（適切な権限付与）
- [ ] Cloud Storage バケット設定（画像保存用）
- [ ] 環境変数・シークレット管理設定

### 1.4 パッケージ依存関係追加
- [ ] `apps/frontend/package.json` - 新規依存関係追加:
  - dice-typescript (ダイスロール)
  - jspdf (PDF生成)
  - socket.io-client (リアルタイム通信)
- [x] `apps/proxy-server/package.json` - 新規依存関係追加:
  - socket.io (リアルタイム通信)
  - better-sqlite3 (Litestreamと組み合わせる軽量DB)
  - @google-cloud/storage (Cloud Storage)
  - @google-cloud/vertexai (Google AI 画像生成)
  - google-auth-library (Google認証)
  - multer (ファイルアップロード)
  - joi (バリデーション)
  - passport (認証)
  - passport-jwt (JWT認証)
  - jsonwebtoken (JWT)
  - bcryptjs (パスワードハッシュ化)
  - stripe (決済処理)
  - express-rate-limit (レート制限)
  - helmet (セキュリティ)
  - sharp (画像処理)

## 2. 型定義の変更・追加

### 2.1 既存型の変更
- [x] `packages/types/index.ts` - `NovelProject` → `TRPGCampaign`に変更
- [x] `packages/types/index.ts` - `Character` → `TRPGCharacter`に拡張
- [x] `packages/types/index.ts` - `PlotElement` → `QuestElement`に変更
- [x] `packages/types/index.ts` - `Chapter` → `GameSession`に変更

### 2.2 新規型定義追加
- [x] `packages/types/index.ts` - `TRPGCampaign`インターフェース
- [x] `packages/types/index.ts` - `TRPGCharacter`インターフェース
- [x] `packages/types/index.ts` - `CharacterSheet`インターフェース
- [x] `packages/types/index.ts` - `GameSession`インターフェース
- [x] `packages/types/index.ts` - `CombatEncounter`インターフェース
- [x] `packages/types/index.ts` - `Quest`インターフェース
- [x] `packages/types/index.ts` - `Handout`インターフェース
- [x] `packages/types/index.ts` - `CampaignRule`インターフェース
- [x] `packages/types/index.ts` - `NPCCharacter`インターフェース
- [x] `packages/types/index.ts` - `PlayerCharacter`インターフェース
- [x] `packages/types/index.ts` - `Equipment`インターフェース
- [x] `packages/types/index.ts` - `Spell`インターフェース
- [x] `packages/types/index.ts` - `CharacterProgression`インターフェース

## 3. 既存ページの改修

### 3.1 ホーム画面系
- [ ] `apps/frontend/src/pages/HomePage.tsx` - キャンペーン管理画面に変更
- [ ] `apps/frontend/src/pages/ProjectsPage.tsx` - キャンペーン一覧画面に変更
- [ ] `apps/frontend/src/pages/NewProjectPage.tsx` - 新規キャンペーン作成画面に変更

### 3.2 あらすじ画面
- [ ] `apps/frontend/src/pages/SynopsisPage.tsx` - TRPGセッション用システムプロンプト画面に変更
- [ ] `apps/frontend/src/hooks/useSynopsis.ts` - キャンペーン背景管理用に変更

### 3.3 プロット画面
- [ ] `apps/frontend/src/pages/PlotPage.tsx` - 日程ベースイベント管理に変更
- [ ] `apps/frontend/src/hooks/usePlot.ts` - シナリオ・アドベンチャー管理用に変更
- [ ] `apps/frontend/src/components/plot/PlotItem.tsx` - 日程イベント表示に変更
- [ ] `apps/frontend/src/components/plot/PlotItemEditDialog.tsx` - 日程イベント編集に変更

### 3.4 キャラクター画面
- [ ] `apps/frontend/src/pages/CharactersPage.tsx` - パーティ編成画面に変更
- [ ] `apps/frontend/src/hooks/useCharacters.ts` - PC/NPC管理用に変更
- [ ] `apps/frontend/src/components/characters/CharacterCard.tsx` - TRPGキャラクター表示に変更
- [ ] `apps/frontend/src/components/characters/CharacterForm.tsx` - キャラクターシート入力に変更
- [ ] `apps/frontend/src/components/characters/CharacterStatusEditorDialog.tsx` - TRPG用ステータス編集に変更
- [ ] `apps/frontend/src/components/characters/CharacterStatusList.tsx` - TRPG用ステータス一覧に変更

### 3.5 タイムライン画面
- [ ] `apps/frontend/src/pages/TimelinePage.tsx` - 日単位タイムラインに変更
- [ ] `apps/frontend/src/hooks/useTimeline.ts` - セッション年表管理用に変更
- [ ] `apps/frontend/src/components/timeline/TimelineChart.tsx` - 日単位表示に変更
- [ ] `apps/frontend/src/components/timeline/TimelineEventCard.tsx` - セッションイベント表示に変更
- [ ] `apps/frontend/src/components/timeline/TimelineEventDialog.tsx` - セッションイベント編集に変更

### 3.6 世界観構築画面
- [ ] `apps/frontend/src/pages/WorldBuildingPage.tsx` - 拠点設定タブ追加
- [ ] `apps/frontend/src/hooks/useWorldBuilding.ts` - 拠点管理機能追加
- [ ] 新規作成: `apps/frontend/src/components/worldbuilding/BaseTab.tsx` - 拠点設定タブ
- [ ] 新規作成: `apps/frontend/src/components/worldbuilding/BaseForm.tsx` - 拠点入力フォーム

### 3.7 執筆画面
- [ ] `apps/frontend/src/pages/WritingPage.tsx` - TRPGセッション画面に全面改修
- [ ] `apps/frontend/src/hooks/useWriting.ts` - セッションノート管理用に変更
- [ ] `apps/frontend/src/components/writing/ChapterList.tsx` - セッション一覧に変更
- [ ] `apps/frontend/src/components/writing/NewChapterDialog.tsx` - 新規セッション作成に変更

## 4. 新規画面・コンポーネント作成

### 4.1 TRPGセッション画面（メイン）
- [ ] 新規作成: `apps/frontend/src/pages/TRPGSessionPage.tsx`
- [ ] 新規作成: `apps/frontend/src/hooks/useTRPGSession.ts`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/SessionInterface.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/ChatInterface.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/InteractionPanel.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/DiceRollUI.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/SkillCheckUI.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/PowerCheckUI.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/CharacterDisplay.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/EquipmentDisplay.tsx`

### 4.2 敵キャラクター定義画面
- [ ] 新規作成: `apps/frontend/src/pages/EnemyPage.tsx`
- [ ] 新規作成: `apps/frontend/src/hooks/useEnemy.ts`
- [ ] 新規作成: `apps/frontend/src/components/enemy/EnemyCard.tsx`
- [ ] 新規作成: `apps/frontend/src/components/enemy/EnemyForm.tsx`
- [ ] 新規作成: `apps/frontend/src/components/enemy/EnemyEditDialog.tsx`

### 4.3 NPC設定画面
- [ ] 新規作成: `apps/frontend/src/pages/NPCPage.tsx`
- [ ] 新規作成: `apps/frontend/src/hooks/useNPC.ts`
- [ ] 新規作成: `apps/frontend/src/components/npc/NPCCard.tsx`
- [ ] 新規作成: `apps/frontend/src/components/npc/NPCForm.tsx`
- [ ] 新規作成: `apps/frontend/src/components/npc/NPCEditDialog.tsx`

### 4.4 開発モード切り替え機能
- [ ] `apps/frontend/src/components/layout/SettingsMenu.tsx` - 開発者モード切り替えスイッチ追加
- [ ] `apps/frontend/src/store/atoms.ts` - 開発者モード状態管理追加
- [ ] `apps/frontend/src/components/ai/AIChatPanel.tsx` - 開発者モード対応
- [ ] `apps/frontend/src/components/layout/Sidebar.tsx` - 開発者モード対応

## 5. API・バックエンド変更

### 5.1 データベース・永続化レイヤー
- [x] `apps/proxy-server/src/db/` - データベース設定ディレクトリ作成
- [x] `apps/proxy-server/src/db/connection.ts` - Litestream + SQLite接続設定
- [x] `apps/proxy-server/src/db/migrations/` - マイグレーションファイル作成
- [x] `apps/proxy-server/src/db/migrations/001_initial_trpg_schema.sql` - TRPG用テーブル作成
- [x] `apps/proxy-server/src/db/models/` - データモデル定義
- [x] `apps/proxy-server/src/db/models/Campaign.ts` - キャンペーンモデル
- [x] `apps/proxy-server/src/db/models/Character.ts` - キャラクターモデル
- [x] `apps/proxy-server/src/db/models/Session.ts` - セッションモデル
- [x] `apps/proxy-server/src/db/models/Enemy.ts` - 敵キャラクターモデル
- [x] `apps/proxy-server/src/db/models/NPC.ts` - NPCモデル
- [ ] `apps/proxy-server/src/db/repositories/` - リポジトリパターン実装

### 5.2 新規APIエンドポイント（CRUD操作）
- [x] `apps/proxy-server/src/routes/campaigns.ts` - キャンペーン管理API
- [x] `apps/proxy-server/src/routes/characters.ts` - キャラクター管理API
- [x] `apps/proxy-server/src/routes/sessions.ts` - セッション管理API
- [x] `apps/proxy-server/src/routes/enemies.ts` - 敵キャラクター管理API
- [x] `apps/proxy-server/src/routes/npcs.ts` - NPC管理API
- [x] `apps/proxy-server/src/routes/image-upload.ts` - 画像アップロードAPI
- [x] `apps/proxy-server/src/routes/session-realtime.ts` - リアルタイムセッションAPI（Socket.IO統合）

### 5.3 新規AIエンドポイント
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/character-sheet-generation`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/enemy-generation`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/npc-generation`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/quest-generation`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/encounter-generation`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/base-image-generation`追加（Google Imagen使用）
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/character-image-generation`追加（Google Imagen使用）
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/session-gm-assist`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/combat-resolution`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/story-progression`追加

### 5.4 認証・ユーザー管理
- [x] `apps/proxy-server/src/auth/` - 認証関連ディレクトリ作成
- [x] `apps/proxy-server/src/auth/middleware.ts` - JWT認証ミドルウェア
- [x] `apps/proxy-server/src/auth/passport-config.ts` - Passport.js設定
- [x] `apps/proxy-server/src/routes/auth.ts` - 認証API
- [x] `apps/proxy-server/src/routes/users.ts` - ユーザー管理API
- [x] `apps/proxy-server/src/models/User.ts` - ユーザーモデル

### 5.5 リアルタイム通信（Socket.IO）
- [x] `apps/proxy-server/src/socket/` - Socket.IO関連ディレクトリ作成
- [x] `apps/proxy-server/src/socket/sessionSocket.ts` - セッション用Socket処理
- [x] `apps/proxy-server/src/socket/combatSocket.ts` - 戦闘用Socket処理
- [x] `apps/proxy-server/src/socket/chatSocket.ts` - チャット用Socket処理
- [x] `apps/proxy-server/src/socket/gameStateSocket.ts` - ゲーム状態同期

### 5.6 画像管理・Cloud Storage統合（Google AI重点）
- [x] `apps/proxy-server/src/services/` - サービス層ディレクトリ作成
- [x] `apps/proxy-server/src/services/imageService.ts` - 画像管理サービス
- [x] `apps/proxy-server/src/services/cloudStorageService.ts` - Cloud Storage連携
- [x] `apps/proxy-server/src/services/googleAIImageService.ts` - Google Imagen API連携サービス
- [x] `apps/proxy-server/src/services/vertexAIService.ts` - Vertex AI統合サービス
- [x] `apps/proxy-server/src/middleware/upload.ts` - ファイルアップロードミドルウェア
- [x] `apps/proxy-server/src/config/googleAI.ts` - Google AI設定・認証

### 5.7 セッション管理・ゲーム状態管理
- [ ] `apps/proxy-server/src/services/sessionService.ts` - セッション管理サービス
- [ ] `apps/proxy-server/src/services/gameStateService.ts` - ゲーム状態管理
- [ ] `apps/proxy-server/src/services/combatService.ts` - 戦闘処理サービス
- [ ] `apps/proxy-server/src/services/diceService.ts` - ダイスロール処理
- [ ] `apps/proxy-server/src/services/eventService.ts` - ゲームイベント処理

### 5.8 システムプロンプト更新
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPGキャラクター作成用プロンプト追加
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPG敵キャラクター作成用プロンプト追加
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPGNPC作成用プロンプト追加
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPGクエスト作成用プロンプト追加
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPGエンカウンター作成用プロンプト追加
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPGゲームマスター用プロンプト追加
- [ ] `apps/proxy-server/src/utils/systemPrompts.ts` - 戦闘解決用プロンプト追加

### 5.9 バリデーション・セキュリティ
- [ ] `apps/proxy-server/src/validators/` - バリデーションディレクトリ作成
- [ ] `apps/proxy-server/src/validators/campaignValidator.ts` - キャンペーンバリデーション
- [ ] `apps/proxy-server/src/validators/characterValidator.ts` - キャラクターバリデーション
- [ ] `apps/proxy-server/src/validators/sessionValidator.ts` - セッションバリデーション
- [ ] `apps/proxy-server/src/middleware/rateLimiter.ts` - レート制限ミドルウェア
- [ ] `apps/proxy-server/src/middleware/corsConfig.ts` - CORS設定

### 5.10 課金・決済システム（将来実装）
- [ ] `apps/proxy-server/src/payment/` - 決済関連ディレクトリ作成
- [ ] `apps/proxy-server/src/payment/stripeService.ts` - Stripe連携
- [ ] `apps/proxy-server/src/routes/billing.ts` - 課金API
- [ ] `apps/proxy-server/src/models/Subscription.ts` - サブスクリプションモデル
- [ ] `apps/proxy-server/src/models/Transaction.ts` - 取引記録モデル

### 5.11 フロントエンドAPI更新
- [ ] `apps/frontend/src/api/aiAgent.ts` - TRPG用エンドポイント関数追加
- [ ] `apps/frontend/src/api/campaigns.ts` - キャンペーンAPI関数
- [ ] `apps/frontend/src/api/characters.ts` - キャラクターAPI関数
- [ ] `apps/frontend/src/api/sessions.ts` - セッションAPI関数
- [ ] `apps/frontend/src/api/enemies.ts` - 敵キャラクターAPI関数
- [ ] `apps/frontend/src/api/npcs.ts` - NPCAPI関数
- [ ] `apps/frontend/src/api/auth.ts` - 認証API関数
- [ ] `apps/frontend/src/api/images.ts` - 画像管理API関数
- [ ] `apps/frontend/src/api/websocket.ts` - WebSocket接続管理

## 6. ルーティング・ナビゲーション変更

### 6.1 ルート定義変更
- [ ] `apps/frontend/src/App.tsx` - TRPGセッション画面ルート追加
- [ ] `apps/frontend/src/App.tsx` - 敵キャラクター画面ルート追加
- [ ] `apps/frontend/src/App.tsx` - NPC画面ルート追加

### 6.2 サイドバー・ナビゲーション
- [ ] `apps/frontend/src/components/layout/Sidebar.tsx` - TRPGセッション項目追加
- [ ] `apps/frontend/src/components/layout/Sidebar.tsx` - 敵キャラクター項目追加
- [ ] `apps/frontend/src/components/layout/Sidebar.tsx` - NPC項目追加
- [ ] `apps/frontend/src/components/layout/Sidebar.tsx` - 項目名を小説→TRPG用に変更

## 7. 状態管理・コンテキスト変更

### 7.1 Recoil Atoms更新
- [ ] `apps/frontend/src/store/atoms.ts` - `currentProjectAtom` → `currentCampaignAtom`
- [ ] `apps/frontend/src/store/atoms.ts` - 開発者モード状態追加
- [ ] `apps/frontend/src/store/atoms.ts` - TRPGセッション状態追加
- [ ] `apps/frontend/src/store/atoms.ts` - 敵キャラクター状態追加
- [ ] `apps/frontend/src/store/atoms.ts` - NPC状態追加

### 7.2 コンテキスト更新
- [ ] `apps/frontend/src/contexts/CharactersContext.tsx` - PC/NPC対応
- [ ] `apps/frontend/src/contexts/PlotContext.tsx` - クエスト・シナリオ対応
- [ ] `apps/frontend/src/contexts/WritingContext.tsx` - セッションノート対応

## 8. UI/UXコンポーネント追加

### 8.1 TRPG専用UIコンポーネント
- [ ] 新規作成: `apps/frontend/src/components/ui/DiceRoller.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/CharacterSheetInput.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/InitiativeTracker.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/HealthTracker.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/StatusEffectTracker.tsx`

## 9. テスト・E2Eテスト更新

### 9.1 既存テスト修正
- [ ] `apps/frontend/e2e/pages/home-page.spec.ts` - キャンペーン画面用に修正
- [ ] `apps/frontend/e2e/pages/characters-page.spec.ts` - TRPG用に修正
- [ ] `apps/frontend/e2e/pages/plot-page.spec.ts` - シナリオ用に修正
- [ ] `apps/frontend/e2e/pages/timeline-page.spec.ts` - 日単位用に修正
- [ ] `apps/frontend/e2e/pages/writing-page.spec.ts` - セッション用に修正

### 9.2 新規テスト作成
- [ ] 新規作成: `apps/frontend/e2e/pages/trpg-session-page.spec.ts`
- [ ] 新規作成: `apps/frontend/e2e/pages/enemy-page.spec.ts`
- [ ] 新規作成: `apps/frontend/e2e/pages/npc-page.spec.ts`

## 10. ドキュメント・設定ファイル更新

### 10.1 設定ファイル
- [ ] `CLAUDE.md` - TRPG用開発ガイド更新
- [ ] `README.md` - プロジェクト説明をTRPG用に更新
- [ ] `apps/frontend/README.md` - フロントエンド説明更新
- [ ] `apps/proxy-server/README.md` - バックエンド説明更新

### 10.2 新規ドキュメント作成
- [ ] 新規作成: `docs/キャラクター.md` - TRPGキャラクターステータス仕様
- [ ] 新規作成: `docs/拠点.md` - 拠点情報設定仕様
- [ ] 新規作成: `docs/エネミー.md` - 敵キャラクター型定義
- [ ] 既存確認: `docs/UI考案.png` - TRPGセッション画面ワイヤーフレーム

## 11. 画像生成・管理機能（Google AI中心）

### 11.1 Google AI画像生成統合
- [x] Google Cloud認証設定・サービスアカウント作成
- [x] Vertex AI API有効化・権限設定
- [x] Google Imagen 3 API統合（コスパ優先：$0.03/画像）
- [x] Gemini 2.0 Flash画像生成統合（会話型生成）
- [x] 画像生成パラメータ最適化（アスペクト比、品質設定）
- [x] 画像アップロード・管理機能
- [x] 画像URL管理システム
- [x] Google Cloud Storage連携・自動保存

### 11.2 画像生成コスト最適化
- [x] 画像生成頻度制限・ユーザーごとの制限
- [x] 画像キャッシュ機能（類似プロンプトの再利用）
- [x] 段階的画質設定（プレビュー→高品質）
- [x] バッチ処理による効率化

## 12. 最終統合・テスト

### 12.1 API統合テスト
- [ ] CRUD API動作テスト（キャンペーン・キャラクター・セッション）
- [ ] AI API統合テスト（生成・アシスト機能）
- [ ] リアルタイム通信テスト（Socket.IO）
- [ ] 認証・認可テスト
- [ ] 画像アップロード・表示テスト
- [ ] データベース整合性テスト
- [ ] API パフォーマンステスト

### 12.2 統合テスト
- [ ] 全画面遷移テスト
- [ ] エンドツーエンドワークフローテスト
- [ ] セッション進行テスト
- [ ] マルチユーザーセッションテスト

### 12.3 デプロイメントテスト
- [ ] Google Cloud Run デプロイテスト（フロントエンド・バックエンド）
- [ ] Cloud Storage 動作テスト
- [ ] Litestream バックアップテスト
- [ ] マルチサービス間通信テスト
- [ ] Cloud Build パイプラインテスト
- [ ] 負荷テスト・スケーリングテスト

## 13. Cloud Run特有の追加設定

### 13.1 環境設定・セキュリティ
- [ ] Cloud Run サービス間認証設定
- [ ] CORS設定（フロントエンド→バックエンド通信）
- [ ] 環境変数設定（本番・ステージング・開発）
- [ ] Google Cloud IAM設定（Vertex AI・Cloud Storage権限）
- [ ] Google AI APIキー・サービスアカウント設定
- [ ] Cloud Endpoints設定（API管理）
- [ ] Cloud Armor設定（セキュリティ）

### 13.2 モニタリング・ロギング
- [ ] Cloud Logging設定
- [ ] Cloud Monitoring設定
- [ ] Error Reporting設定
- [ ] Cloud Trace設定（分散トレーシング）
- [ ] アラート設定

---

## 優先順位（Cloud Run対応版）

### Phase 0 (最高優先度) - インフラ基盤
- Docker設定の最適化
- Cloud Build設定
- 基本的なCloud Run デプロイ設定

### Phase 1 (高優先度)
- 型定義の変更・追加
- データベース・永続化レイヤー構築
- 基本的なCRUD API実装
- 認証・ユーザー管理システム
- 基本的なCI/CD設定

### Phase 2 (中優先度)
- 既存ページの基本的な改修
- 新規画面・コンポーネント作成
- AI API拡張・統合
- リアルタイム通信（Socket.IO）
- 画像管理・Cloud Storage統合
- 状態管理の更新

### Phase 3 (低優先度)  
- セッション管理・ゲーム状態管理
- 画像生成機能
- 課金・決済システム
- テスト更新・統合テスト
- 最終統合・デプロイメント
- モニタリング・ロギング最適化