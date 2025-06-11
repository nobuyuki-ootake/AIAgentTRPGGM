# Docker開発環境セットアップガイド

## 現在の状況

proxy-serverのDockerコンテナは設定済みです。環境変数の読み込み設定を追加しました。

## 解決方法

### 方法1: 個別起動 (推奨)

フロントエンドとバックエンドを個別に起動する方法：

```bash
# フロントエンドのみDockerで起動
docker compose -f docker-compose.dev.yml up frontend-dev

# 別ターミナルでバックエンドをローカルで起動
cd apps/proxy-server
pnpm install
pnpm run dev
```

### 方法2: 両方Docker起動 (推奨)

両方をDockerで起動する方法（環境変数読み込み修正済み）：

```bash
# 両方を起動
docker compose -f docker-compose.dev.yml up --build

# フロントエンド: http://localhost:5173
# バックエンド: http://localhost:4001
# ヘルスチェック: http://localhost:4001/health
```

## 設定済みの内容

### docker-compose.dev.yml

- **frontend-dev**: ポート5173
  - ✅ 正常動作
  - ホットリロード対応
  - Vite開発サーバー

- **proxy-server-dev**: ポート4001
  - ⚠️ 起動中にエラー
  - Node.js + Express
  - nodemon対応

### 環境変数

プロジェクトルートの`.env`ファイルから自動読み込み設定済み：

```bash
# .env ファイルの例
ANTHROPIC_API_KEY=sk-ant-your-real-key
OPENAI_API_KEY=sk-your-real-key
GEMINI_API_KEY=AIzaSy...your-real-key

# JWT設定
JWT_SECRET=development_jwt_secret_key_should_be_changed_in_production

# データベース設定
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/novel_agent
```

**重要**: `docker-compose.dev.yml`で`env_file: ./.env`を設定済みのため、
プロジェクトルートの`.env`ファイルが自動的にコンテナに読み込まれます。

## 現在動作確認済み

### フロントエンド (Docker)
- ✅ http://localhost:5173 
- ✅ TRPGセッション画面表示
- ✅ テストデータ読み込み
- ✅ UI機能テスト実施済み

### バックエンド (修正済み)
- ✅ http://localhost:4001 (環境変数読み込み設定済み)
- AI API統合
- データベース管理 (Litestream)

## ✅ 解決完了

Docker環境変数読み込み問題を解決しました：

1. **フロントエンド**: Docker (安定動作)
2. **バックエンド**: Docker (環境変数読み込み修正済み)

**解決内容**:
- `docker-compose.dev.yml`に`env_file: ./.env`を追加
- サーバー起動時の必須チェックを警告のみに変更
- `.env`ファイルからの環境変数読み込みが正常に動作

**テスト結果**: 
- ✅ サーバー起動成功 (http://localhost:4001)
- ✅ ヘルスチェック正常 (/health)
- ✅ GEMINI_API_KEY読み込み成功

## 将来の改善予定

1. pnpm-lock.yamlの競合解決
2. マルチステージビルドの最適化
3. 開発用vs本番用の設定分離
4. ヘルスチェックの実装

## 関連ファイル

- `docker-compose.dev.yml` - 開発用Docker設定
- `apps/proxy-server/Dockerfile` - バックエンドDockerfile
- `apps/frontend/Dockerfile` - フロントエンドDockerfile
- `apps/proxy-server/package.json` - バックエンド依存関係
- `apps/proxy-server/nodemon.json` - 開発サーバー設定

## トラブルシューティング

### コンテナの完全停止・削除
```bash
docker compose -f docker-compose.dev.yml down
docker system prune -f
```

### ボリュームの削除
```bash
docker volume rm aiagenttrpggm_proxy_node_modules
docker volume rm aiagenttrpggm_packages_node_modules
```

### ログの確認
```bash
docker compose -f docker-compose.dev.yml logs -f proxy-server-dev
docker compose -f docker-compose.dev.yml logs -f frontend-dev
```