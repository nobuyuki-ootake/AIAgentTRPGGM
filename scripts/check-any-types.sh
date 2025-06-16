#!/bin/bash

# any型チェックスクリプト
# 変更されたファイルの中でany型が使用されていないかチェック

echo "🔍 any型の使用をチェック中..."

FILES="$@"
ANY_COUNT=0
ERROR_FILES=()

for file in $FILES; do
  if [[ $file == *.ts ]] || [[ $file == *.tsx ]]; then
    # any型の使用をチェック（コメント行は除外）
    ANY_USAGE=$(grep -n ": any\|<any>\|as any\|any\[\]\|any," "$file" | grep -v "^[[:space:]]*//\|^[[:space:]]*\*" || true)
    
    if [[ ! -z "$ANY_USAGE" ]]; then
      echo ""
      echo "❌ $file でany型が使用されています:"
      echo "$ANY_USAGE"
      echo ""
      ANY_COUNT=$((ANY_COUNT + 1))
      ERROR_FILES+=("$file")
    fi
  fi
done

if [[ $ANY_COUNT -gt 0 ]]; then
  echo "🚫 any型が $ANY_COUNT 個のファイルで見つかりました。"
  echo ""
  echo "🔧 修正方法:"
  echo "  • 適切な型定義を使用してください"
  echo "  • packages/types/index.ts の共通型を活用してください"
  echo "  • 必要に応じて新しい型定義を作成してください"
  echo ""
  echo "📋 修正が必要なファイル:"
  for file in "${ERROR_FILES[@]}"; do
    echo "  - $file"
  done
  echo ""
  exit 1
else
  echo "✅ any型の使用は見つかりませんでした。"
fi