# プロキシサーバー

ノベル作成エージェント用の API プロキシサーバーです。

## 機能

- **OpenAI API** プロキシ - GPT モデルにリクエストを送信
- **Claude API** プロキシ - Anthropic のモデルにリクエストを送信
- **Gemini API** プロキシ - Google の Gemini モデルにリクエストを送信
- **キャッシュ機能** - Redis を使用して同一リクエストのキャッシュ
- **レート制限** - API リクエスト制限
- **認証** - API キーによる認証

## 開発環境のセットアップ

### 前提条件

- Node.js 20 以上
- pnpm
- Redis
- Docker (オプション)

### インストール

```bash
# リポジトリのクローン後
cd proxy-server
pnpm install
```

### 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```
# API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-gemini-key

# サーバー設定
PORT=3001
NODE_ENV=development

# Redis設定
REDIS_URL=redis://localhost:6379

# 認証
API_KEY=your-api-key-for-authentication

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### 開発サーバーの起動

```bash
pnpm dev
```

## テスト

```bash
# 全てのテストを実行
pnpm test

# ユニットテストのみ実行
pnpm test:unit

# 統合テストのみ実行
pnpm test:integration

# カバレッジレポートを生成
pnpm test:coverage
```

## Docker での実行

```bash
# リポジトリのルートディレクトリで実行
docker-compose up --build
```

## API エンドポイント

### OpenAI API

```
POST /api/openai
```

### Claude API

```
POST /api/claude
```

### Gemini API

```
POST /api/gemini
```

### ヘルスチェック

```
GET /health
```

## 認証

すべての API リクエストには`x-api-key`ヘッダーが必要です。この値は環境変数`API_KEY`と一致する必要があります。
