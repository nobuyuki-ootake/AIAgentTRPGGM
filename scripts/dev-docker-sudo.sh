#!/bin/bash

# Docker開発環境起動スクリプト（sudo版）

echo "🐳 Docker開発環境を起動中（sudo使用）..."

# Dockerの確認
if ! command -v docker &> /dev/null; then
    echo "❌ Docker が見つかりません"
    exit 1
fi

# Docker Compose の確認
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ docker-compose が見つかりません。docker compose を使用します"
    DOCKER_COMPOSE="sudo docker compose"
else
    DOCKER_COMPOSE="sudo docker-compose"
fi

# 開発環境の起動
echo "🚀 フロントエンド開発サーバーを起動中..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up --build frontend-dev

echo "✅ 開発サーバーが起動しました！"
echo "📱 ブラウザで http://localhost:5173 にアクセスしてください"