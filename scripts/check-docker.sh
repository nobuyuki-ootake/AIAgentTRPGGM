#!/bin/bash

# Docker環境診断スクリプト

echo "🔍 Docker環境を診断中..."

echo ""
echo "1. Docker バージョン確認:"
docker --version 2>/dev/null || echo "❌ Docker接続エラー"

echo ""
echo "2. Docker Daemon 状態確認:"
docker info >/dev/null 2>&1 && echo "✅ Docker Daemon 起動中" || echo "❌ Docker Daemon 接続エラー"

echo ""
echo "3. Docker Compose 確認:"
docker compose version 2>/dev/null && echo "✅ Docker Compose 利用可能" || echo "⚠️ docker-compose を使用"

echo ""
echo "4. WSL統合確認:"
if [ -S /var/run/docker.sock ]; then
    echo "✅ Docker socket 存在"
    ls -la /var/run/docker.sock
else
    echo "❌ Docker socket なし"
fi

echo ""
echo "5. ユーザーグループ確認:"
groups | grep -q docker && echo "✅ dockerグループに所属" || echo "❌ dockerグループに未所属"

echo ""
echo "📋 解決方法:"
echo "1. Docker Desktop を再起動"
echo "2. Settings > Resources > WSL Integration でWSLディストリビューションを有効化"
echo "3. WSLターミナルを再起動: wsl --shutdown → 新しいターミナル"