# TRPG AI Agent GM

AI 技術を活用したテーブルトーク RPG（TRPG）のゲームマスター支援ツールです。

## 🎯 プロジェクト概要

このプロジェクトは、AI 駆動のゲームマスター機能により、TRPG セッションの質を向上させることを目的としています。プレイヤーとの対話的なセッション管理、世界観構築、キャラクター管理、シナリオ生成を自動化し、より豊かな TRPG エクスペリエンスを提供します。

## 🏗️ アーキテクチャ

このプロジェクトはモノレポ構造を採用しており、以下のような構成になっています：

```
├── apps/
│   ├── frontend/          # Next.js 15 + React 19 フロントエンド
│   └── proxy-server/      # Express.js プロキシサーバー
├── packages/
│   └── types/            # 共有型定義
└── .taskmaster/          # Taskmaster AI 設定
```

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Shadcn UI, Tailwind CSS
- **バックエンド**: Express.js, TypeScript
- **AI 統合**: OpenAI, Claude, Gemini API
- **データ管理**: Redis
- **開発管理**: Taskmaster AI

## 📋 タスク管理

このプロジェクトでは[Taskmaster AI](https://www.npmjs.com/package/task-master-ai)を使用してタスク管理を行っています。

### Taskmaster AI の使用方法

#### 基本コマンド

```bash
# タスク一覧を表示
task-master list

# 次に取り組むべきタスクを表示
task-master next

# 特定のタスクの詳細を表示
task-master show <id>

# タスクのステータスを更新
task-master set-status --id=<id> --status=<status>
```

# Dockerキャッシュをクリアしてビルド
  docker system prune -af
  docker compose -f docker-compose.dev.yml up --build frontend-dev

  # すでにビルド済みの場合（高速起動）
  docker compose -f docker-compose.dev.yml up frontend-dev

  # バックグラウンドで実行
  docker compose -f docker-compose.dev.yml up -d frontend-dev

  # ログを確認
  docker compose -f docker-compose.dev.yml logs -f frontend-dev

#### PRD からタスクを生成

```bash
# PRDを解析してタスクを生成
task-master parse-prd .taskmaster/docs/prd.txt

# 個別のタスクファイルを生成
task-master generate
```

#### 複雑なタスクの管理

```bash
# タスクの複雑さを分析
task-master analyze-complexity

# 複雑なタスクをサブタスクに分割
task-master expand --id=<id> --num=<number>
```

### MCP 設定

Cursor エディタで taskmaster-ai を使用するには、`.cursor/mcp.json`に設定が必要です：

```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE",
        "OPENAI_API_KEY": "YOUR_OPENAI_KEY_HERE"
      }
    }
  }
}
```

## 🚀 開発環境のセットアップ

### 前提条件

- Node.js 18.0.0 以上
- pnpm 8.0.0 以上
- Redis（開発環境用）

### インストール

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

### 環境変数の設定

各アプリケーションの`.env.local`ファイルに必要な環境変数を設定してください：

```bash
# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key

# Redis設定
REDIS_URL=redis://localhost:6379
```

## 📚 開発ガイドライン

### コードスタイル

- TypeScript を使用し、型安全性を重視
- 関数型プログラミングパターンを採用
- 早期リターンによる可読性向上
- 説明的な変数名・関数名の使用

### 型定義管理

- 汎用的な型定義は`packages/types/index.ts`に集約
- コンポーネント固有の型は各アプリケーション内で定義
- `packages/types/index.ts`の型定義を優先し、実装側を修正

### タスク管理ワークフロー

1. `task-master next`で次のタスクを確認
2. タスクを`in-progress`に設定
3. 実装とテストを行う
4. 完了後、タスクを`done`に設定

## 🧪 テスト

```bash
# E2Eテスト
pnpm test:e2e

# TRPGセッションテスト
pnpm test:trpg-session

# AI機能強化テスト
pnpm test:ai-enhanced
```

## 📖 ドキュメント

- [開発セットアップ](DEV_SETUP.md)
- [TRPG 機能分析](TRPG_Application_Analysis.md)
- [セッションテストレポート](TRPG_SESSION_TEST_REPORT.md)
- [開発回避策](DEVELOPMENT_WORKAROUND.md)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🔗 関連リンク

- [Taskmaster AI](https://www.npmjs.com/package/task-master-ai)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude](https://docs.anthropic.com/)

## 主要機能

- **キャンペーン管理**: TRPG キャンペーンの作成・管理
- **キャラクター作成**: Stormbringer ベースのキャラクターシート
- **世界観構築**: ルール、地名、文化、歴史の管理
- **ターンベースセッション**: AI によるゲームマスター支援
- **リアルタイム進行**: プレイヤーと AI キャラクターの協調プレイ

## 開発環境セットアップ

### 前提条件

- Node.js (18 以降)
- pnpm
- Git

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd AIAgentTRPGGM

# 依存関係のインストール
pnpm install

# 開発サーバーの起動（フロントエンド + プロキシサーバー）
pnpm dev
```

### 個別起動

```bash
# フロントエンドのみ
pnpm dev:frontend

# プロキシサーバーのみ
pnpm dev:proxy
```

## 環境変数設定

### フロントエンド (apps/frontend/.env.local)

```env
VITE_API_BASE_URL=http://localhost:4001
```

### プロキシサーバー (apps/proxy-server/.env)

```env
PORT=4001
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## テスト

```bash
# E2Eテスト（Playwright）
pnpm test:e2e

# TRPGセッション機能テスト
pnpm test:trpg-session
```

## デプロイ

```bash
# ビルド
pnpm build

# プロダクション起動
pnpm start
```

## ドキュメント

### 開発関連

- [開発セットアップガイド](DEV_SETUP.md) - 開発環境の詳細設定
- [TRPG セッションテストガイド](docs/TRPG_SESSION_TEST_GUIDE.md) - セッション機能のテスト手順
- [プロジェクト状態まとめ](docs/プロジェクト状態まとめ.md) - 実装状況の概要

### 機能仕様

- [TRPG AI エージェント GM 仕様書](docs/TRPG-AIエージェントGM-プロジェクト仕様書.md) - プロジェクト全体仕様
- [インタラクション仕様](docs/TRPG-Interaction-Specification.md) - UI/UX インタラクション設計
- [アクセシビリティガイドライン](docs/Accessibility-Guidelines.md) - アクセシビリティ対応

### テストと QA

- [E2E テストガイド](TRPG_E2E_TESTING_GUIDE.md) - 自動テストの実行方法
- [テスト実行サマリー](TEST_EXECUTION_SUMMARY.md) - テスト結果概要

### システム設計

- [画面遷移図](docs/画面遷移図.md) - アプリケーションの画面構成
- [ユーザー操作ワークフロー図](docs/ユーザー操作ワークフロー図.md) - ユーザーの操作フロー

## 技術スタック

### フロントエンド

- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **UI**: Material UI
- **状態管理**: Recoil
- **ルーティング**: React Router v7
- **エディター**: Slate.js

### バックエンド

- **フレームワーク**: Express.js + TypeScript
- **AI 統合**: OpenAI, Anthropic (Claude), Google (Gemini)
- **データベース**: Litestream
- **キャッシュ**: Redis (オプション)
- **認証**: JWT

### テスト

- **E2E**: Playwright
- **ユニット**: Jest
- **型チェック**: TypeScript

## ライセンス

このプロジェクトは学習目的で作成されています。

## 貢献

1. Issue を作成して議論
2. フィーチャーブランチを作成
3. テストを追加/更新
4. プルリクエストを作成

## 問題報告

バグや機能要求は [Issues](../../issues) で報告してください。

---

**Note**: このプロジェクトは学習プロジェクトです。プロダクション環境での使用前に十分なテストを行ってください。
