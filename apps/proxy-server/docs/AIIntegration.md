# AI統合モジュール

## 概要

このドキュメントではNovelWithAgentアプリケーションのAI統合モジュールについて説明します。
このモジュールは異なるAIプロバイダー（OpenAI、Claude、Gemini等）との通信を一元管理し、一貫したインターフェースを提供します。

## 重要な原則

### モデル選択の透明性と忠実性

1. **ユーザーの選択を尊重**: ユーザーが明示的に選択したモデルのみを使用し、バックエンド側で自動的にモデルを変更（フォールバック）することは**絶対に禁止**します。

2. **明示的なエラー処理**: APIキーの欠如など、選択したモデルが利用できない場合は、適切なエラーメッセージを返し、ユーザーに明示的な選択を促します。

3. **透明性の確保**: 使用されているモデルや設定は、常にユーザーに明示的に通知されるべきです。

これらの原則は、ユーザーの信頼を維持し、予測可能で一貫した体験を提供するために不可欠です。

## 主要コンポーネント

### 1. AIリクエスト標準化（aiRequestStandard.ts）

異なるAIサービスへのリクエストと応答を標準化するインターフェースを定義します。

- `StandardAIRequest`: リクエスト内容を標準化
- `StandardAIResponse`: 応答内容を標準化
- システムプロンプト構築関数: 特定の用途に応じた適切なプロンプトを生成

### 2. テンプレート管理（aiTemplateManager.ts）

AIとの通信で使用するプロンプトテンプレートを一元管理します。

- シングルトンパターンによる一貫したテンプレート管理
- モデル固有のテンプレート対応（Geminiなど）
- 世界観要素、キャラクターなど用途別のテンプレート
- **JSONとYAMLの両形式に対応したテンプレート**

### 3. エラーハンドリング（aiErrorHandler.ts）

AIサービスとの通信における様々なエラーを処理し、安定性を確保します。

- エラータイプの分類と適切な処理
- 自動リトライ機構
- JSONパース回復機構
- **YAMLパース回復機構**
- 詳細なエラーログ記録

### 4. サービス統合（aiIntegration.ts）

上記コンポーネントを統合し、AIサービスへの単一インターフェースを提供します。

- 異なるAIプロバイダー（OpenAI, Claude, Gemini）への対応
- 用途に応じた適切なモデル選択
- 透過的なリトライとエラーハンドリング
- **複数データフォーマット（JSON/YAML/テキスト）のサポート**

## データフォーマットサポート

### JSONとYAML形式

システムは構造化データを以下の形式でサポートしています：

1. **JSON形式**

   - 厳格な構文規則
   - ほとんどのAIモデルでネイティブサポート
   - 括弧やクォートの欠落などによるエラーが発生しやすい

2. **YAML形式**（推奨）
   - より柔軟な構文規則
   - インデントベースでエラーに強い
   - 可読性が高い
   - 特に大規模なデータ構造で優れたパフォーマンス

レスポンス形式は`responseFormat`パラメータ（`json`または`yaml`）で指定できます。
指定がない場合は`yaml`がデフォルトとして使用されます。

### フォーマット変換

`/format-conversion`エンドポイントで、異なるフォーマット間の変換が可能です：

```json
{
  "data": "変換するデータ",
  "fromFormat": "yaml",
  "toFormat": "json"
}
```

## エラーハンドリング強化

エラー発生時には、以下の詳細情報がログに記録されます：

- エラータイプとメッセージ
- ステータスコード
- **リクエスト内容**（デバッグ用）
- **レスポンス内容**（デバッグ用）

これにより、AIサービスとの通信における問題をより効果的にトラブルシューティングできます。

## 使用例

```typescript
// 世界観要素の詳細を生成（YAML形式）
const request: StandardAIRequest = {
  requestType: 'worldbuilding-detail',
  model: 'gpt-4o',
  userPrompt: '魔法の森について詳しく教えてください',
  context: {
    elementName: '魔法の森',
    elementType: '場所',
  },
  options: {
    responseFormat: 'yaml', // yaml または json
    temperature: 0.7,
  },
};

// AIリクエストの実行
try {
  const response = await processAIRequest(request);

  // 成功時の処理
  if (response.status === 'success') {
    console.log(response.content); // 構造化データ（オブジェクト）
    console.log(response.rawContent); // 生のYAML/JSONテキスト
  } else {
    // エラーの適切な処理
    console.error(`エラー: ${response.error?.message}`);

    // クライアントに適切なエラーメッセージを返す
    return {
      status: 'error',
      message: response.error?.message,
      suggestion: 'APIキーを設定するか、別のモデルを選択してください。',
    };
  }
} catch (error) {
  // 予期しないエラーの処理
  console.error('AIリクエスト処理中にエラーが発生しました:', error);
  throw error;
}
```

### エラー処理のベストプラクティス

- **適切なエラーメッセージ**: 選択したモデルが利用できない場合、具体的な理由と対応策を提示
- **代替オプションの提案**: 利用可能なモデルのリストを提示することを検討
- **ユーザー選択の保持**: エラー後も元のユーザー設定を保持し、自動変更しない

```typescript
// モデルが利用できない場合の適切なエラー処理例
if (modelType === 'openai' && !isOpenAIAvailable()) {
  return {
    status: 'error',
    message:
      'OpenAI APIキーが設定されていないため、このモデルは利用できません。',
    availableModels: getAvailableModels(), // 利用可能なモデルのリスト
  };
}
```

## Gemini特有の考慮事項

Gemini APIは他のモデルと比較して以下の特徴があります：

- JSON生成の正確さが低い場合がある
- **YAMLを使用することで信頼性が向上**
- 各モデル向けに最適化されたプロンプトテンプレートを用意

---

© 2023 ノベル作成支援ツール開発チーム
