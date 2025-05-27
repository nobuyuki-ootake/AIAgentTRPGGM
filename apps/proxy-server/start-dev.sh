#!/bin/bash
# 開発環境でプロキシサーバーを起動するスクリプト

# .envファイルを確認
if [ ! -f .env ]; then
  echo ".envファイルが見つかりません。.env.exampleをコピーします。"
  cp .env.example .env
  echo "APKキーを.envファイルに設定してください。"
fi

# 依存関係をインストール
npm install

# 開発モードで起動
npm run dev 