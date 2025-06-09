# Husky + TypeScript エラー検知強化実装ガイド

## 実装完了内容

### 1. ✅ Huskyの導入と設定

- **husky** と **lint-staged** をワークスペースレベルでインストール
- `.husky/pre-commit` フックを作成
- `.husky/_/husky.sh` ヘルパースクリプトを設定

### 2. ✅ Pre-commitフックでの必須チェック

**実行される順序**:
1. **TypeScriptチェック（フロントエンド）**: `npx tsc --project tsconfig.app.json --noEmit`
2. **ESLintチェック（フロントエンド）**: `npx eslint . --ext .ts,.tsx --max-warnings 0`
3. **TypeScriptチェック（バックエンド）**: `npx tsc --noEmit`
4. **ESLintチェック（バックエンド）**: `npx eslint . --ext .ts,.js --max-warnings 0`
5. **TypeScriptチェック（共通型定義）**: `npx tsc --noEmit`
6. **ビルドテスト（フロントエンド）**: `pnpm build`
7. **ビルドテスト（バックエンド）**: `pnpm build`
8. **Lint-staged実行**: 変更されたファイルに対するlintとprettier

### 3. ✅ TypeScript エラー検知強化オプション

すべてのtsconfig.jsonファイルに以下のオプションを追加:

```json
{
  "compilerOptions": {
    // 既存の設定...
    
    /* エラー検知強化オプション */
    "noImplicitReturns": true,           // 関数の全てのパスでreturnを要求
    "noPropertyAccessFromIndexSignature": true, // インデックスシグネチャのプロパティはブラケット記法を要求
    "noUncheckedIndexedAccess": true,    // 配列・オブジェクトアクセスでundefinedチェックを要求
    "noImplicitOverride": true,          // オーバーライド時にoverride修飾子を要求
    "allowUnusedLabels": false,          // 未使用ラベルを禁止
    "allowUnreachableCode": false,       // 到達不可能なコードを禁止
    "noUnusedLocals": true,              // 未使用ローカル変数を禁止
    "noUnusedParameters": true,          // 未使用パラメータを禁止
    "noFallthroughCasesInSwitch": true, // switchのfall-throughを禁止
    "skipLibCheck": true                 // ライブラリ型定義チェックをスキップ（パフォーマンス向上）
  }
}
```

### 4. ✅ 追加されたnpmスクリプト

**ルートレベル（package.json）**:
```json
{
  "scripts": {
    "typecheck": "npx turbo run typecheck",
    "typecheck:frontend": "cd apps/frontend && npx tsc --project tsconfig.app.json --noEmit",
    "typecheck:proxy": "cd apps/proxy-server && npx tsc --noEmit",
    "typecheck:types": "cd packages/types && npx tsc --noEmit",
    "precommit-check": "pnpm run typecheck && pnpm run lint && pnpm run build"
  }
}
```

**各アプリケーション**:
- `apps/frontend/package.json`: `"typecheck": "tsc --project tsconfig.app.json --noEmit"`
- `apps/proxy-server/package.json`: `"typecheck": "tsc --noEmit"`
- `packages/types/package.json`: `"typecheck": "tsc --noEmit"`

### 5. ✅ Lint-staged設定

```json
{
  "lint-staged": {
    "apps/frontend/**/*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "apps/proxy-server/**/*.{ts,js}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "packages/types/**/*.ts": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ]
  }
}
```

### 6. ✅ Turbo設定更新

```json
{
  "pipeline": {
    "typecheck": {
      "outputs": []
    }
  }
}
```

## 使用方法

### 手動でのチェック実行

```bash
# 全体のTypeScriptチェック
pnpm run typecheck

# 個別のTypeScriptチェック
pnpm run typecheck:frontend
pnpm run typecheck:proxy
pnpm run typecheck:types

# Pre-commitと同じチェックを手動実行
pnpm run precommit-check
```

### コミット時の自動実行

通常通り `git commit` を実行すると、pre-commitフックが自動実行されます:

```bash
git add .
git commit -m "機能追加: 新しい機能の実装"
# → 自動的にTypeScriptチェック、ESLint、ビルドが実行される
```

### フックをスキップする場合（緊急時のみ）

```bash
git commit --no-verify -m "緊急修正: 重要なバグフィックス"
```

## エラー検知の強化ポイント

### 1. `noPropertyAccessFromIndexSignature: true`
```typescript
// ❌ エラー: インデックスシグネチャのプロパティは[]記法が必要
const value = response.data;

// ✅ 正しい記法
const value = response['data'];
```

### 2. `noUncheckedIndexedAccess: true`
```typescript
// ❌ エラー: 配列アクセスでundefinedチェックが必要
const first = items[0].name;

// ✅ 正しい記法
const first = items[0]?.name;
```

### 3. `noImplicitReturns: true`
```typescript
// ❌ エラー: 全てのパスでreturnが必要
function getValue(condition: boolean) {
  if (condition) {
    return "value";
  }
  // returnが不足
}

// ✅ 正しい記法
function getValue(condition: boolean) {
  if (condition) {
    return "value";
  }
  return "default";
}
```

## トラブルシューティング

### TypeScriptエラーが多すぎる場合

1. **段階的な修正**: まず重要なエラーから修正
2. **一時的な無効化**: 必要に応じて `// @ts-ignore` を使用
3. **設定調整**: 特定のオプションを一時的に無効化

### Pre-commitが重すぎる場合

```bash
# より軽量なチェックのみ実行
HUSKY_SKIP_HOOKS=1 git commit -m "メッセージ"
```

### ライブラリ互換性問題

- `skipLibCheck: true` でライブラリ型定義のチェックをスキップ
- 特定のライブラリで問題がある場合、exclude設定を追加

## メリット

1. **コード品質向上**: 潜在的なバグを事前に検出
2. **開発効率向上**: 実行時エラーの削減
3. **チーム開発**: 統一されたコード品質基準
4. **CI/CD安定性**: ビルド失敗の事前防止
5. **型安全性**: より厳密な型チェック

## 次のステップ

1. 既存のTypeScriptエラーを段階的に修正
2. ESLintルールの追加設定
3. より詳細なlint-staged設定
4. CI/CDパイプラインとの統合
5. VS Codeの設定ファイル（.vscode/settings.json）での自動チェック有効化