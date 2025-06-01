# TRPG プロジェクト変更のための TODO リスト（詳細版）

## 作業要領

詳細な変更内容については、必ず docs\TRPG GM プロジェクト用変更点-清書版.md を参照して確認すること。

## 1. インフラストラクチャ・デプロイメント変更

### 1.1 Google Cloud Run 対応（モノリポ → マルチサービス構成）

- [x] `railway.json` → 削除（不要）
- [x] `apprunner.yaml` → 削除（不要）
- [x] `apps/frontend/Dockerfile` → Cloud Run 用フロントエンド用 Dockerfile 作成
- [x] `apps/proxy-server/Dockerfile` → Cloud Run 用バックエンド用 Dockerfile 作成
- [x] `apps/frontend/cloudbuild.yaml` → フロントエンド用ビルド設定作成
- [x] `apps/proxy-server/cloudbuild.yaml` → バックエンド用ビルド設定作成
- [x] `.gcloudignore` → Cloud Build 最適化用 ignore ファイル作成
- [x] `turbo.json` → Cloud Run 用ビルド最適化設定追加
- [x] Cloud Storage 設定ファイル作成（環境変数設定）
- [x] Litestream 設定ファイル作成（`litestream.yml`）

### 1.2 Docker 設定の最適化

- [x] `apps/frontend/Dockerfile` → `turbo prune`を使用した最適化 Dockerfile
- [x] `apps/proxy-server/Dockerfile` → `turbo prune`を使用した最適化 Dockerfile
- [x] `.dockerignore` → ビルド効率化用設定
- [x] `docker-compose.yml` → 開発用に Cloud Storage・Litestream エミュレータ対応

### 1.3 CI/CD パイプライン設定

- [ ] Cloud Build トリガー設定（フロントエンド・バックエンド別々）
- [ ] Cloud Run サービス設定（trpg-frontend, trpg-backend）
- [ ] Cloud Run IAM 設定（適切な権限付与）
- [ ] Cloud Storage バケット設定（画像保存用）
- [ ] 環境変数・シークレット管理設定

### 1.4 パッケージ依存関係追加

- [x] `apps/frontend/package.json` - 新規依存関係追加:
  - dice-typescript (ダイスロール)
  - jspdf (PDF 生成)
  - socket.io-client (リアルタイム通信)
- [x] `apps/proxy-server/package.json` - 新規依存関係追加:
  - socket.io (リアルタイム通信)
  - better-sqlite3 (Litestream と組み合わせる軽量 DB)
  - @google-cloud/storage (Cloud Storage)
  - @google-cloud/vertexai (Google AI 画像生成)
  - google-auth-library (Google 認証)
  - multer (ファイルアップロード)
  - joi (バリデーション)
  - passport (認証)
  - passport-jwt (JWT 認証)
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

### 2.2 新規型定義追加（TRPG 専用）

- [x] `packages/types/index.ts` - `TRPGCampaign`インターフェース
- [x] `packages/types/index.ts` - `TRPGCharacter`インターフェース（Stormbringer ベース）
  - 基本情報: name, profession, gender, age, nation, religion, player
  - 能力値: STR, CON, SIZ, INT, POW, DEX, CHA
  - 派生値: HP, MP, SW(Strike Rank), RES(抵抗値)
  - 武器: name, attack, damage, hit, parry, range
  - 装甲: head, body, leftArm, rightArm, leftLeg, rightLeg
  - スキル: AgilitySkills, CommunicationSkills, KnowledgeSkills, ManipulationSkills, PerceptionSkills, StealthSkills, MagicSkills, WeaponSkills
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
- [ ] `packages/types/index.ts` - `EnemyCharacter`インターフェース追加
  - 基本情報: name, rank(モブ/中ボス/ボス/EX ボス), type, description, level
  - 能力値: strength, dexterity, constitution, intelligence, wisdom
  - 派生値: hp, mp, attack, defense, magic_attack, magic_defense, accuracy, evasion, critical_rate, initiative
  - スキル: basic_attack, special_skills, passives
  - AI 行動: ai_pattern, targeting
  - ドロップ: exp, gold, items, rare_drops
  - 状態: current_hp, current_mp, status_effects, location
- [ ] `packages/types/index.ts` - `BaseLocation`インターフェース追加
  - 基本情報: name, type, region, description, rank, importance
  - 施設: inn, shops, armory, temple, guild, blacksmith
  - NPC: name, role, function
  - 機能: fast_travel, player_base, quest_hub, defense_event
  - 脅威: danger_level, current_events, controlling_faction
  - 経済: currency, local_goods, trade_goods
  - メタ: location_id, unlocked, last_updated

## 3. 既存ページの改修

### 3.1 ホーム画面系

- [x] `apps/frontend/src/pages/HomePage.tsx` - キャンペーン管理画面に変更
- [x] `apps/frontend/src/pages/ProjectsPage.tsx` - キャンペーン一覧画面に変更
- [x] `apps/frontend/src/pages/NewProjectPage.tsx` - 新規キャンペーン作成画面に変更

### 3.2 あらすじ画面（キャンペーン背景）

- [x] `apps/frontend/src/pages/SynopsisPage.tsx` - TRPG セッション用システムプロンプト画面に変更
  - シナリオの全体設定と TRPG 世界観の設定
  - AI エージェント用のシステムプロンプト特化
- [x] `apps/frontend/src/hooks/useSynopsis.ts` - キャンペーン背景管理用に変更

### 3.3 プロット画面（クエスト管理）

- [x] `apps/frontend/src/pages/PlotPage.tsx` - 日程ベースイベント管理に変更
  - 「X 日目に～～が起きる」形式でイベントを定義
  - セッション進行の骨格を提供
- [x] `apps/frontend/src/hooks/usePlot.ts` - シナリオ・アドベンチャー管理用に変更
- [x] `apps/frontend/src/components/plot/PlotItem.tsx` - 日程イベント表示に変更
- [x] `apps/frontend/src/components/plot/PlotItemEditDialog.tsx` - 日程イベント編集に変更

### 3.4 キャラクター画面（パーティ編成）

- [x] `apps/frontend/src/pages/CharactersPage.tsx` - パーティ編成画面に変更
  - 新規キャラクター追加
  - シナリオ許容人数内でのキャラクター設定
  - TRPG ステータス形式への変更
- [x] `apps/frontend/src/hooks/useCharacters.ts` - PC/NPC 管理用に変更
- [x] `apps/frontend/src/components/characters/CharacterCard.tsx` - TRPG キャラクター表示に変更
- [x] `apps/frontend/src/components/characters/CharacterForm.tsx` - キャラクターシート入力に変更
- [ ] `apps/frontend/src/components/characters/CharacterStatusEditorDialog.tsx` - TRPG 用ステータス編集に変更
- [ ] `apps/frontend/src/components/characters/CharacterStatusList.tsx` - TRPG 用ステータス一覧に変更

### 3.5 タイムライン画面（セッション履歴/イベント管理）

- [x] `apps/frontend/src/pages/TimelinePage.tsx` - 日単位タイムラインに変更
  - 年単位から日単位の時間軸に変更
  - レイアウト: 1 日目〜X 日目（ユーザー設定可能）
- [x] `apps/frontend/src/hooks/useTimeline.ts` - セッション年表管理用に変更
- [x] `apps/frontend/src/components/timeline/TimelineChart.tsx` - 日単位表示に変更
- [x] `apps/frontend/src/components/timeline/TimelineEventCard.tsx` - セッションイベント表示に変更
- [x] `apps/frontend/src/components/timeline/TimelineEventDialog.tsx` - セッションイベント編集に変更
- [ ] **開発者モード対応**: 動作モードの二重実装
  - プレイ中モード: 「セッション履歴」として実際のゲームプレイログを表示
  - 開発者モード: 「キャンペーンのイベント管理」として事前シナリオ設計機能
  - 敵キャラクターの場所・日程固定配置、同一時間・場所での戦闘発生システム設計

### 3.6 世界観構築画面（ワールド設定）

- [x] `apps/frontend/src/pages/WorldBuildingPage.tsx` - 拠点設定タブ追加
  - 大まかな世界設定
  - 拠点情報の設定（拠点.md 参照）
  - 拠点画像の設定
- [x] `apps/frontend/src/hooks/useWorldBuilding.ts` - 拠点管理機能追加
- [x] 新規作成: `apps/frontend/src/components/worldbuilding/BaseTab.tsx` - 拠点設定タブ
- [ ] 新規作成: `apps/frontend/src/components/worldbuilding/BaseForm.tsx` - 拠点入力フォーム
- [ ] **拠点情報詳細実装**:
  - 施設情報管理（宿屋、店舗、武具屋、魔法ギルド、鍛冶屋、酒場等）
  - NPC 管理（村長、店主、クエスト提供者等）
  - 機能管理（ファストトラベル、クエスト発生、拠点防衛等）
  - 経済管理（通貨、物価、特産品、交易品）
- [ ] **AI エージェントによる拠点画像生成機能**
- [ ] **ゲーム連携**: 拠点にいる非操作キャラクターの立ち絵表示

### 3.7 執筆画面（セッションノート）

- [ ] `apps/frontend/src/pages/WritingPage.tsx` - セッションノート画面に改修
- [ ] `apps/frontend/src/hooks/useWriting.ts` - セッションノート管理用に変更
- [ ] `apps/frontend/src/components/writing/ChapterList.tsx` - セッション一覧に変更
- [ ] `apps/frontend/src/components/writing/NewChapterDialog.tsx` - 新規セッション作成に変更

## 4. 新規画面・コンポーネント作成

### 4.1 TRPG セッション画面（メイン）

- [x] 新規作成: `apps/frontend/src/pages/TRPGSessionPage.tsx`
  - **ゲーム進行フロー**:
    1. 開始時: キャラクター選択 → ゲーム開始
    2. 導入: AI エージェントからのゲーム解説
    3. 行動選択: エージェント提供の選択肢から選択
    4. 日程進行: イベント完了条件達成または行動回数上限で次日へ
  - **UI 構成要素**:
    - イラスト表示: プロジェクト定義から URL 取得
    - チャット機能: 日付指定でのログ遡及機能
    - キャラクター表示: 参加全キャラクターの常時表示
    - 装備・スキル表示: 操作キャラクターの詳細情報
- [ ] 新規作成: `apps/frontend/src/hooks/useTRPGSession.ts`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/SessionInterface.tsx`
- [x] 新規作成: `apps/frontend/src/components/trpg-session/ChatInterface.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/InteractionPanel.tsx`
- [x] 新規作成: `apps/frontend/src/components/trpg-session/DiceRollUI.tsx`
  - 攻撃威力・イベント成功判定
- [x] 新規作成: `apps/frontend/src/components/trpg-session/SkillCheckUI.tsx`
  - 円形ゲージの緑ゾーン停止ゲーム
- [x] 新規作成: `apps/frontend/src/components/trpg-session/PowerCheckUI.tsx`
  - 連打による成功・失敗判定
- [x] 新規作成: `apps/frontend/src/components/trpg-session/CharacterDisplay.tsx`
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/EquipmentDisplay.tsx`

### 4.2 敵キャラクター定義画面

- [x] 新規作成: `apps/frontend/src/pages/EnemyPage.tsx`
- [ ] 新規作成: `apps/frontend/src/hooks/useEnemy.ts`
- [ ] 新規作成: `apps/frontend/src/components/enemy/EnemyCard.tsx`
- [ ] 新規作成: `apps/frontend/src/components/enemy/EnemyForm.tsx`
- [ ] 新規作成: `apps/frontend/src/components/enemy/EnemyEditDialog.tsx`
- [ ] **敵キャラクター詳細機能**:
  - 体力設定: プレイヤーキャラクターより少なめ
  - クラス分類: モブ、エネミーリーダー、ボス
  - AI 制御: 行動パターンは AI エージェントが決定
  - ランク別特徴: モブ（グループ出現）、中ボス（戦略必要）、ボス（全キャラ協力必須）

### 4.3 NPC 設定画面

- [x] 新規作成: `apps/frontend/src/pages/NPCPage.tsx`
- [ ] 新規作成: `apps/frontend/src/hooks/useNPC.ts`
- [ ] 新規作成: `apps/frontend/src/components/npc/NPCCard.tsx`
- [ ] 新規作成: `apps/frontend/src/components/npc/NPCForm.tsx`
- [ ] 新規作成: `apps/frontend/src/components/npc/NPCEditDialog.tsx`
- [ ] **NPC 機能**:
  - 基本機能: 街での定型文章提供
  - AI 制御: 返答内容と行動は AI エージェントが生成

### 4.4 開発モード切り替え機能

- [x] `apps/frontend/src/components/layout/SettingsMenu.tsx` - 開発者モード切り替えスイッチ追加
- [x] `apps/frontend/src/store/atoms.ts` - 開発者モード状態管理追加
- [x] `apps/frontend/src/components/ai/AIChatPanel.tsx` - 開発者モード対応
- [x] `apps/frontend/src/components/layout/Sidebar.tsx` - 開発者モード対応
- [ ] **開発者モード詳細実装**:
  - デフォルト: オフ状態
  - オフ時の表示:
    - ゲーム開始前: パーティ設定と TRPG セッション移行のみ
    - ゲーム開始後: 設定タブと AIChat パネルが非表示
    - セッション履歴画面: プレイ履歴の閲覧のみ
  - オン時:
    - 全設定項目が表示可能
    - セッション履歴画面: キャンペーンイベント管理・事前設計機能が利用可能

### 4.5 キャラクター相互作用システム

- [ ] 新規作成: `packages/types/index.ts` - キャラクター実行イベント型追加
- [ ] 新規作成: `apps/frontend/src/components/trpg-session/CharacterInteractionPanel.tsx`
- [ ] **機能詳細**:
  - キャラクター間での影響行動
  - HP 減少、状態異常回復・付与など
  - 対象への直接的な効果適用

## 5. API・バックエンド変更

### 5.1 データベース・永続化レイヤー

- [x] `apps/proxy-server/src/db/` - データベース設定ディレクトリ作成
- [x] `apps/proxy-server/src/db/connection.ts` - Litestream + SQLite 接続設定
- [x] `apps/proxy-server/src/db/migrations/` - マイグレーションファイル作成
- [x] `apps/proxy-server/src/db/migrations/001_initial_trpg_schema.sql` - TRPG 用テーブル作成
- [x] `apps/proxy-server/src/db/models/` - データモデル定義
- [x] `apps/proxy-server/src/db/models/Campaign.ts` - キャンペーンモデル
- [x] `apps/proxy-server/src/db/models/Character.ts` - キャラクターモデル
- [x] `apps/proxy-server/src/db/models/Session.ts` - セッションモデル
- [x] `apps/proxy-server/src/db/models/Enemy.ts` - 敵キャラクターモデル
- [x] `apps/proxy-server/src/db/models/NPC.ts` - NPC モデル
- [x] `apps/proxy-server/src/db/repositories/` - リポジトリパターン実装
- [ ] **拡張データモデル**:
  - Enemy モデル: エネミー.md 仕様に基づく詳細実装
  - BaseLocation モデル: 拠点.md 仕様に基づく実装
  - CharacterInteraction モデル: キャラクター相互作用用

### 5.2 新規 API エンドポイント（CRUD 操作）

- [x] `apps/proxy-server/src/routes/campaigns.ts` - キャンペーン管理 API
- [x] `apps/proxy-server/src/routes/characters.ts` - キャラクター管理 API
- [x] `apps/proxy-server/src/routes/sessions.ts` - セッション管理 API
- [x] `apps/proxy-server/src/routes/enemies.ts` - 敵キャラクター管理 API
- [x] `apps/proxy-server/src/routes/npcs.ts` - NPC 管理 API
- [x] `apps/proxy-server/src/routes/image-upload.ts` - 画像アップロード API
- [x] `apps/proxy-server/src/routes/session-realtime.ts` - リアルタイムセッション API（Socket.IO 統合）
- [ ] `apps/proxy-server/src/routes/bases.ts` - 拠点管理 API

### 5.3 新規 AI エンドポイント

- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/character-sheet-generation`追加
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/enemy-generation`追加
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/npc-generation`追加
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/quest-generation`追加
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/encounter-generation`追加
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/base-image-generation`追加（Google Imagen 使用）
- [ ] `apps/proxy-server/src/routes/aiAgent.ts` - `/character-image-generation`追加（Google Imagen 使用）
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/session-gm-assist`追加
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/combat-resolution`追加
- [x] `apps/proxy-server/src/routes/aiAgent.ts` - `/story-progression`追加

### 5.4 認証・ユーザー管理

- [x] `apps/proxy-server/src/auth/` - 認証関連ディレクトリ作成
- [x] `apps/proxy-server/src/auth/middleware.ts` - JWT 認証ミドルウェア
- [x] `apps/proxy-server/src/auth/passport-config.ts` - Passport.js 設定
- [x] `apps/proxy-server/src/routes/auth.ts` - 認証 API
- [x] `apps/proxy-server/src/routes/users.ts` - ユーザー管理 API
- [x] `apps/proxy-server/src/models/User.ts` - ユーザーモデル

### 5.5 リアルタイム通信（Socket.IO）

- [x] `apps/proxy-server/src/socket/` - Socket.IO 関連ディレクトリ作成
- [x] `apps/proxy-server/src/socket/sessionSocket.ts` - セッション用 Socket 処理
- [x] `apps/proxy-server/src/socket/combatSocket.ts` - 戦闘用 Socket 処理
- [x] `apps/proxy-server/src/socket/chatSocket.ts` - チャット用 Socket 処理
- [x] `apps/proxy-server/src/socket/gameStateSocket.ts` - ゲーム状態同期

### 5.6 画像管理・Cloud Storage 統合（Google AI 重点）

- [x] `apps/proxy-server/src/services/` - サービス層ディレクトリ作成
- [x] `apps/proxy-server/src/services/imageService.ts` - 画像管理サービス
- [x] `apps/proxy-server/src/services/cloudStorageService.ts` - Cloud Storage 連携
- [x] `apps/proxy-server/src/services/googleAIImageService.ts` - Google Imagen API 連携サービス
- [x] `apps/proxy-server/src/services/vertexAIService.ts` - Vertex AI 統合サービス
- [x] `apps/proxy-server/src/middleware/upload.ts` - ファイルアップロードミドルウェア
- [x] `apps/proxy-server/src/config/googleAI.ts` - Google AI 設定・認証

### 5.7 セッション管理・ゲーム状態管理

- [ ] `apps/proxy-server/src/services/sessionService.ts` - セッション管理サービス
- [ ] `apps/proxy-server/src/services/gameStateService.ts` - ゲーム状態管理
- [ ] `apps/proxy-server/src/services/combatService.ts` - 戦闘処理サービス
- [ ] `apps/proxy-server/src/services/diceService.ts` - ダイスロール処理
- [ ] `apps/proxy-server/src/services/eventService.ts` - ゲームイベント処理

### 5.8 システムプロンプト更新

- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPG キャラクター作成用プロンプト追加
- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPG 敵キャラクター作成用プロンプト追加
- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPGNPC 作成用プロンプト追加
- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPG クエスト作成用プロンプト追加
- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPG エンカウンター作成用プロンプト追加
- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - TRPG ゲームマスター用プロンプト追加
- [x] `apps/proxy-server/src/utils/systemPrompts.ts` - 戦闘解決用プロンプト追加

### 5.9 バリデーション・セキュリティ

- [ ] `apps/proxy-server/src/validators/` - バリデーションディレクトリ作成
- [ ] `apps/proxy-server/src/validators/campaignValidator.ts` - キャンペーンバリデーション
- [ ] `apps/proxy-server/src/validators/characterValidator.ts` - キャラクターバリデーション
- [ ] `apps/proxy-server/src/validators/sessionValidator.ts` - セッションバリデーション
- [ ] `apps/proxy-server/src/validators/enemyValidator.ts` - 敵キャラクターバリデーション
- [ ] `apps/proxy-server/src/validators/baseValidator.ts` - 拠点バリデーション
- [ ] `apps/proxy-server/src/middleware/rateLimiter.ts` - レート制限ミドルウェア
- [ ] `apps/proxy-server/src/middleware/corsConfig.ts` - CORS 設定

### 5.10 課金・決済システム（将来実装）

- [ ] `apps/proxy-server/src/payment/` - 決済関連ディレクトリ作成
- [ ] `apps/proxy-server/src/payment/stripeService.ts` - Stripe 連携
- [ ] `apps/proxy-server/src/routes/billing.ts` - 課金 API
- [ ] `apps/proxy-server/src/models/Subscription.ts` - サブスクリプションモデル
- [ ] `apps/proxy-server/src/models/Transaction.ts` - 取引記録モデル

### 5.11 フロントエンド API 更新

- [ ] `apps/frontend/src/api/aiAgent.ts` - TRPG 用エンドポイント関数追加
- [ ] `apps/frontend/src/api/campaigns.ts` - キャンペーン API 関数
- [ ] `apps/frontend/src/api/characters.ts` - キャラクター API 関数
- [ ] `apps/frontend/src/api/sessions.ts` - セッション API 関数
- [ ] `apps/frontend/src/api/enemies.ts` - 敵キャラクター API 関数
- [ ] `apps/frontend/src/api/npcs.ts` - NPCAPI 関数
- [ ] `apps/frontend/src/api/bases.ts` - 拠点 API 関数
- [ ] `apps/frontend/src/api/auth.ts` - 認証 API 関数
- [ ] `apps/frontend/src/api/images.ts` - 画像管理 API 関数
- [ ] `apps/frontend/src/api/websocket.ts` - WebSocket 接続管理

## 6. ルーティング・ナビゲーション変更

### 6.1 ルート定義変更

- [x] `apps/frontend/src/App.tsx` - TRPG セッション画面ルート追加
- [x] `apps/frontend/src/App.tsx` - 敵キャラクター画面ルート追加
- [x] `apps/frontend/src/App.tsx` - NPC 画面ルート追加

### 6.2 サイドバー・ナビゲーション

- [x] `apps/frontend/src/components/layout/Sidebar.tsx` - TRPG セッション項目追加
- [x] `apps/frontend/src/components/layout/Sidebar.tsx` - 敵キャラクター項目追加
- [x] `apps/frontend/src/components/layout/Sidebar.tsx` - NPC 項目追加
- [x] `apps/frontend/src/components/layout/Sidebar.tsx` - 項目名を小説 →TRPG 用に変更

## 7. 状態管理・コンテキスト変更

### 7.1 Recoil Atoms 更新

- [x] `apps/frontend/src/store/atoms.ts` - `currentProjectAtom` → `currentCampaignAtom`
- [x] `apps/frontend/src/store/atoms.ts` - 開発者モード状態追加
- [x] `apps/frontend/src/store/atoms.ts` - TRPG セッション状態追加
- [x] `apps/frontend/src/store/atoms.ts` - 敵キャラクター状態追加
- [x] `apps/frontend/src/store/atoms.ts` - NPC 状態追加

### 7.2 コンテキスト更新

- [x] `apps/frontend/src/contexts/CharactersContext.tsx` - PC/NPC 対応
- [x] `apps/frontend/src/contexts/PlotContext.tsx` - クエスト・シナリオ対応
- [ ] `apps/frontend/src/contexts/WritingContext.tsx` - セッションノート対応

## 8. UI/UX コンポーネント追加

### 8.1 TRPG 専用 UI コンポーネント

- [ ] 新規作成: `apps/frontend/src/components/ui/DiceRoller.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/CharacterSheetInput.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/InitiativeTracker.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/HealthTracker.tsx`
- [ ] 新規作成: `apps/frontend/src/components/ui/StatusEffectTracker.tsx`

## 9. テスト・E2E テスト更新

### 9.1 既存テスト修正

- [ ] `apps/frontend/e2e/pages/home-page.spec.ts` - キャンペーン画面用に修正
- [ ] `apps/frontend/e2e/pages/characters-page.spec.ts` - TRPG 用に修正
- [ ] `apps/frontend/e2e/pages/plot-page.spec.ts` - シナリオ用に修正
- [ ] `apps/frontend/e2e/pages/timeline-page.spec.ts` - 日単位用に修正
- [ ] `apps/frontend/e2e/pages/writing-page.spec.ts` - セッション用に修正

### 9.2 新規テスト作成

- [ ] 新規作成: `apps/frontend/e2e/pages/trpg-session-page.spec.ts`
- [ ] 新規作成: `apps/frontend/e2e/pages/enemy-page.spec.ts`
- [ ] 新規作成: `apps/frontend/e2e/pages/npc-page.spec.ts`

## 10. ドキュメント・設定ファイル更新

### 10.1 設定ファイル

- [ ] `CLAUDE.md` - TRPG 用開発ガイド更新
- [ ] `README.md` - プロジェクト説明を TRPG 用に更新
- [ ] `apps/frontend/README.md` - フロントエンド説明更新
- [ ] `apps/proxy-server/README.md` - バックエンド説明更新

### 10.2 新規ドキュメント作成

- [x] 新規作成: `docs/キャラクター.md` - TRPG キャラクターステータス仕様
  - Stormbringer ベースの詳細キャラクターシート仕様
  - 能力値、派生値、武器、装甲、スキル体系を定義
- [x] 新規作成: `docs/拠点.md` - 拠点情報設定仕様
  - 基本情報、施設、NPC、機能、経済、脅威要素を定義
- [x] 新規作成: `docs/エネミー.md` - 敵キャラクター型定義
  - ランク別敵キャラクター（モブ、中ボス、ボス）の詳細仕様
  - AI 行動パターン、ドロップアイテム、戦闘バランス定義
- [x] 既存確認: `docs/UI考案.png` - TRPG セッション画面ワイヤーフレーム

## 11. 画像生成・管理機能（Google AI 中心）

### 11.1 Google AI 画像生成統合

- [x] Google Cloud 認証設定・サービスアカウント作成
- [x] Vertex AI API 有効化・権限設定
- [x] Google Imagen 3 API 統合（コスパ優先：$0.03/画像）
- [x] Gemini 2.0 Flash 画像生成統合（会話型生成）
- [x] 画像生成パラメータ最適化（アスペクト比、品質設定）
- [x] 画像アップロード・管理機能
- [x] 画像 URL 管理システム
- [x] Google Cloud Storage 連携・自動保存

### 11.2 画像生成コスト最適化

- [x] 画像生成頻度制限・ユーザーごとの制限
- [x] 画像キャッシュ機能（類似プロンプトの再利用）
- [x] 段階的画質設定（プレビュー → 高品質）
- [x] バッチ処理による効率化

### 11.3 キャラクター・拠点画像生成

- [ ] **AI エージェントによるキャラクターイメージ画像生成機能**
- [ ] **AI エージェントによる拠点画像生成機能**

## 12. 最終統合・テスト

### 12.1 API 統合テスト

- [ ] CRUD API 動作テスト（キャンペーン・キャラクター・セッション）
- [ ] AI API 統合テスト（生成・アシスト機能）
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

## 13. Cloud Run 特有の追加設定

### 13.1 環境設定・セキュリティ

- [ ] Cloud Run サービス間認証設定
- [ ] CORS 設定（フロントエンド → バックエンド通信）
- [ ] 環境変数設定（本番・ステージング・開発）
- [ ] Google Cloud IAM 設定（Vertex AI・Cloud Storage 権限）
- [ ] Google AI API キー・サービスアカウント設定
- [ ] Cloud Endpoints 設定（API 管理）
- [ ] Cloud Armor 設定（セキュリティ）

### 13.2 モニタリング・ロギング

- [ ] Cloud Logging 設定
- [ ] Cloud Monitoring 設定
- [ ] Error Reporting 設定
- [ ] Cloud Trace 設定（分散トレーシング）
- [ ] アラート設定

## 14. 今後の実装課題（仕様書より）

### 14.1 開発者モード対応機能

- [ ] **セッション履歴画面の二重機能実装**:
  - プレイ中モード: リアルタイムセッション履歴の閲覧・検索
  - 開発者モード: 事前イベント設計、エネミー配置、シナリオ構築
- [ ] **モード切り替えによる UI 動的変更**
- [ ] **データ構造の統合**: セッション実績データとシナリオ設計データの管理

### 14.2 ユーザー認証・サーバーサイド実装

- [ ] **マルチプレイヤーモード**: TRPG 複数人プレイ対応
- [ ] **課金システム**: チケット制（1 プレイ 200 円想定）
- [ ] **収益分配**: ユーザー作成シナリオの作者還元（60%想定）
- [ ] **拡散促進**: ユーザー生成コンテンツによるエコシステム構築

---

## 優先順位（Cloud Run 対応版）

### Phase 0 (最高優先度) - インフラ基盤

- Docker 設定の最適化
- Cloud Build 設定
- 基本的な Cloud Run デプロイ設定

### Phase 1 (高優先度)

- 型定義の変更・追加（特に EnemyCharacter、BaseLocation）
- データベース・永続化レイヤー構築
- 基本的な CRUD API 実装
- 認証・ユーザー管理システム
- 基本的な CI/CD 設定

### Phase 2 (中優先度)

- 既存ページの基本的な改修
- 新規画面・コンポーネント作成
- AI API 拡張・統合
- リアルタイム通信（Socket.IO）
- 画像管理・Cloud Storage 統合
- 状態管理の更新
- 開発者モード詳細実装

### Phase 3 (低優先度)

- セッション管理・ゲーム状態管理
- 画像生成機能
- 課金・決済システム
- テスト更新・統合テスト
- 最終統合・デプロイメント
- モニタリング・ロギング最適化
- シングルプレイ・マルチモードプレイの実装(マルチモード: 有料機能)
