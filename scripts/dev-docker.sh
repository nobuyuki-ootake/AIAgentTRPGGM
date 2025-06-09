#!/bin/bash

# Docker開発環境起動スクリプト

echo "🐳 Docker開発環境を起動中..."

# Docker Desktop の WSL統合が有効になっているかチェック
if ! command -v docker &> /dev/null; then
    echo "❌ Docker Desktop の WSL統合が無効です"
    echo "Docker Desktop の設定で WSL integration を有効にしてください:"
    echo "1. Docker Desktop を開く"
    echo "2. Settings > Resources > WSL Integration"
    echo "3. 使用中のWSLディストリビューションを有効化"
    exit 1
fi

# Docker Compose の確認
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ docker-compose が見つかりません。docker compose を使用します"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 開発環境の起動
echo "🚀 フロントエンド開発サーバーを起動中..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up --build frontend-dev

echo "✅ 開発サーバーが起動しました！"
echo "📱 ブラウザで http://localhost:5173 にアクセスしてください"