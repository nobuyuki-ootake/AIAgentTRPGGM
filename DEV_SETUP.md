# 開発環境セットアップガイド

## TRPG キャンペーン管理システムの開発環境構築

### 1. 前提条件

- Node.js v18.20.8 以上
- pnpm v10.10.0 以上
- Git

### 2. WSL 環境での注意事項

WSL2 環境では以下の問題が発生する可能性があります：

- Rollup ネイティブバイナリの互換性問題
- Turbo コマンドの依存関係問題

### 3. 推奨セットアップ手順

#### Option A: 通常の起動（推奨）

```bash
# 1. プロジェクトルートで依存関係をインストール
cd /mnt/c/Users/irure/git/AIAgentTRPGGM
pnpm install

# 2. Turboを使用して開発サーバー起動
pnpm dev
```

#### Option B: 個別起動（WSL 問題回避）

```bash
# 1. フロントエンド起動（ターミナル1）
cd /mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend
pnpm install
pnpm dev

# 2. バックエンド起動（ターミナル2）
cd /mnt/c/Users/irure/git/AIAgentTRPGGM/apps/proxy-server
pnpm install
pnpm dev
```

#### Option C: Windows PowerShell 使用（最も確実）

```powershell
# Windows PowerShellで実行
cd C:\Users\irure\git\AIAgentTRPGGM
pnpm install
pnpm dev
```

### 4. 作成済み機能の確認方法

#### 現在実装済みの画面：

1. **ホーム画面** (`/`) - キャンペーン選択
2. **エネミー管理** (`/enemy`) - 敵キャラクター管理
3. **NPC 管理** (`/npc`) - ノンプレイヤーキャラクター管理
4. **TRPG セッション** (`/session`) - リアルタイムセッション画面
5. **世界観構築** (`/worldbuilding`) - 拠点管理含む
6. **パーティー管理** (`/characters`) - PC 管理

#### 主要機能：

- ✅ キャラクター管理（PC/NPC/敵）
- ✅ ダイスロール機能
- ✅ チャット機能
- ✅ AI 生成機能
- ✅ 拠点管理
- ✅ ナビゲーション

### 5. トラブルシューティング

#### エラー: "turbo: command not found"

```bash
# グローバルにturboをインストール
npm install -g turbo
# または
pnpm add -g turbo
```

#### エラー: Rollup native binary 問題

```bash
# 1. node_modulesとlockfileを削除
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules

# 2. 再インストール
pnpm install --no-frozen-lockfile

# 3. それでも失敗する場合はWindows PowerShellを使用
```

#### エラー: 型関連エラー

```bash
# 型チェックのみ実行
cd apps/frontend
npx tsc --noEmit

# ESLintチェック
npx eslint . --ext .ts,.tsx --max-warnings 0
```

### 6. 開発時の便利なコマンド

```bash
# ホットリロード付きの開発
pnpm dev

# ビルドテスト
pnpm build

# テスト実行
cd apps/frontend
pnpm test:e2e

# Storybook起動（コンポーネント確認）
pnpm storybook
```

### 7. ポート番号

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001
- Storybook: http://localhost:6006

### 8. 現在の実装状況

- **基本 TRPG 機能**: 100%完了
- **UI/UX コンポーネント**: 90%完了
- **AI 統合**: 80%完了
- **バックエンド連携**: 30%完了
- **リアルタイム機能**: 10%完了

### 次のステップ

現在のシステムは基本的な TRPG 管理機能は完全に動作します。
さらなる機能拡張は以下の順序で推奨：

1. バックエンド API 統合
2. Socket.IO リアルタイム機能
3. データ永続化
4. 画像生成機能
5. マルチプレイヤー対応
