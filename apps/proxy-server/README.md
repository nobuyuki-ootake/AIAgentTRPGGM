# ノベル作成AIエージェントプロキシ

小説創作を支援するAIエージェントシステムのバックエンド実装です。このプロキシサーバーは各種AI APIへのアクセスを提供し、Mastraフレームワークを活用したインテリジェントなエージェントシステムを実装しています。

## 機能

- Mastraフレームワークを使用した拡張可能なAIエージェントアーキテクチャ
- OpenAI、Claude、Gemini APIへの統合的なアクセス
- 各AIモデルのレスポンスキャッシング（Redis）
- 複数のエージェント役割（プロットアドバイザー、キャラクターデザイナーなど）
- エージェントネットワークによる最適な返答生成

## 技術スタック

- TypeScript + Express.js
- Mastra AIエージェントフレームワーク
- Redis（キャッシング）
- OpenAI API、Claude API、Gemini API

## セットアップ

### 必要条件

- Node.js 16+
- npm または yarn
- Redis（オプション）

### インストール

```bash
# 依存パッケージのインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してAPIキーなどを設定
```

### 環境変数

以下の環境変数を`.env`ファイルに設定します：

- `PORT`: サーバーのポート（デフォルト: 3000）
- `API_KEY`: APIアクセス用のキー
- `ALLOWED_ORIGINS`: CORSで許可するオリジン
- `REDIS_URL`: Redisサーバーの接続URL（オプション）
- `OPENAI_API_KEY`: OpenAI APIキー
- `ANTHROPIC_API_KEY`: Anthropic APIキー（Claude）
- `GEMINI_API_KEY`: Google Gemini APIキー

## 使い方

### 開発モード

```bash
npm run dev
```

### ビルドと本番実行

```bash
npm run build
npm start
```

## APIエンドポイント

### AIエージェント

- `POST /api/agent/chat`: 汎用的なAIアシスタントチャット
- `POST /api/agent/plot-advice`: プロット構造に関するアドバイス
- `POST /api/agent/character-advice`: キャラクター設計に関するアドバイス
- `POST /api/agent/style-advice`: 文章表現や文体に関するアドバイス
- `POST /api/agent/worldbuilding-advice`: 世界観構築に関するアドバイス

### AI APIプロキシ

- `POST /api/openai`: OpenAI APIへの直接アクセス
- `POST /api/claude`: Claude APIへの直接アクセス
- `POST /api/gemini`: Gemini APIへの直接アクセス

## フレームワーク拡張

### 新しいエージェントの追加

`src/agents/index.ts`に新しいエージェント定義を追加します：

```typescript
export const myNewAgent = mastra
  .agent('my-new-agent')
  .description('新しいエージェントの説明').systemMessage(`
    エージェントの詳細な指示...
  `);
```

### 新しいツールの追加

`src/tools/index.ts`に新しいツール定義を追加します：

```typescript
export const myNewTool = mastra
  .tool('my-new-tool')
  .description('新しいツールの説明')
  .schema({
    input1: 'string',
    input2: 'number?',
  })
  .handler(async ({ input1, input2 }) => {
    // ツールのロジック実装
    return { result: '何らかの結果' };
  });
```

### エージェントネットワークの拡張

`src/networks/index.ts`で既存のネットワークを拡張するか、新しいネットワークを追加します。

## ライセンス

ISC
