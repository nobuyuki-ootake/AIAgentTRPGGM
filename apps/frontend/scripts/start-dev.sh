#!/bin/bash

# 5173ポートを使用しているプロセスを強制終了
echo "🔍 5173ポートの使用状況を確認中..."
PID=$(lsof -ti:5173)

if [ -n "$PID" ]; then
  echo "⚠️  5173ポートが使用されています (PID: $PID)"
  echo "🔄 プロセスを停止中..."
  kill -9 $PID
  echo "✅ プロセス停止完了"
  sleep 1
else
  echo "✅ 5173ポートは使用されていません"
fi

# 開発サーバーを起動
echo "🚀 開発サーバーを5173ポートで起動中..."
pnpm dev