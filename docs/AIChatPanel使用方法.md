# AIChatPanel 使用方法

## 概要

AIChatPanel は、AI を活用した小説作成支援ツールの統一されたインターフェースです。従来の個別 AIAssistModal を統合し、一貫性のある AI 体験を提供します。

## 基本的な使用方法

### 1. AIChatPanel の開閉

AIChatPanel は画面右下のフローティングボタンから開閉できます。

```tsx
// フローティングボタンをクリックしてパネルを開く
<AIChatPanel />
```

### 2. タブの種類

AIChatPanel には 3 つのタブがあります：

- **チャット**: 基本的な AI との対話
- **アシスト**: 各画面専用の AI アシスト機能
- **設定**: AI プロバイダーの設定

### 3. アシスト機能の使用

各画面の「AI アシスト」ボタンをクリックすると、AIChatPanel のアシストタブが開き、その画面専用の AI 機能が利用できます。

## 画面別の AI アシスト機能

### キャラクターページ

```tsx
// AIAssistButton を使用
<AIAssistButton
  onAssist={handleOpenAIAssist}
  text="AIにキャラクターを考えてもらう"
  variant="default"
/>
```

**機能:**

- キャラクター一括生成
- プロット選択機能
- バッチ生成対応

### プロットページ

**機能:**

- プロット作成アシスタント
- あらすじ参照機能
- プロットアイテムの生成

### タイムラインページ

**機能:**

- イベント生成アシスト
- プロット選択機能
- 動的プロンプト生成

### 世界観構築ページ

**機能:**

- 世界観要素生成
- バッチ生成対応
- 複数要素タイプの同時生成

### あらすじエディター

**機能:**

- あらすじ作成支援
- 既存内容の改善提案

### 執筆ページ

**機能:**

- 章の AI 生成
- 長さ設定（短め/普通/長め）
- 追加指示機能
- 上書き確認

## 開発者向け情報

### useAIChatIntegration フックの使用

```tsx
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";

const { openAIAssist } = useAIChatIntegration();

const handleOpenAIAssist = async () => {
  await openAIAssist(
    "characters", // ページコンテキスト
    {
      title: "AIにキャラクターを考えてもらう",
      description: "あらすじとプロットを参照して、キャラクターを生成します。",
      defaultMessage: "キャラクターを考えてください。",
      supportsBatchGeneration: true,
      customControls: {
        plotSelection: true,
      },
      onComplete: (result) => {
        // AI応答の処理
        if (result.content) {
          // 結果を処理
        }
      },
    },
    currentProject, // プロジェクトデータ
    [] // 選択された要素
  );
};
```

### AssistConfig の設定項目

```typescript
interface AssistConfig {
  title: string; // アシスト機能のタイトル
  description: string; // 機能の説明
  defaultMessage: string; // デフォルトプロンプト
  supportsBatchGeneration?: boolean; // バッチ生成対応
  customControls?: {
    targetLength?: "short" | "medium" | "long" | ""; // 章の長さ設定
    userInstructions?: string; // ユーザー指示
    plotSelection?: boolean; // プロット選択機能
  };
  onComplete?: (result: ResponseData) => void; // 完了時のコールバック
  onGenerate?: (params: any) => Promise<void>; // 生成時のコールバック（WritingPage用）
}
```

### AI 応答の解析

共通ユーティリティを使用して AI 応答を解析できます：

```tsx
import {
  parseAIResponseToCharacter,
  parseAIResponseToCharacters,
  parseAIResponseToPlotItems,
} from "../utils/aiResponseParser";

// 単一キャラクターの解析
const character = parseAIResponseToCharacter(aiResponse);

// 複数キャラクターの解析
const characters = parseAIResponseToCharacters(aiResponse);

// プロットアイテムの解析
const plotItems = parseAIResponseToPlotItems(aiResponse);
```

## カスタマイズ

### 新しい画面への対応

1. **PageContext の追加**

```typescript
// apps/frontend/src/store/atoms.ts
export type PageContext =
  | "characters"
  | "plot"
  | "timeline"
  | "worldbuilding"
  | "writing"
  | "synopsis"
  | "plot-item"
  | "new-page"; // 新しいページを追加
```

2. **AI アシスト機能の実装**

```tsx
const handleOpenAIAssist = async () => {
  await openAIAssist(
    "new-page",
    {
      title: "新しいページのAI機能",
      description: "新しいページ専用のAI機能です。",
      defaultMessage: "新しいページ用のプロンプト",
      onComplete: (result) => {
        // 結果の処理
      },
    },
    currentProject
  );
};
```

3. **AIAssistButton の配置**

```tsx
<AIAssistButton
  onAssist={handleOpenAIAssist}
  text="新しいAI機能"
  variant="default"
/>
```

## トラブルシューティング

### よくある問題

1. **AI アシストボタンが反応しない**

   - useAIChatIntegration フックが正しくインポートされているか確認
   - openAIAssist 関数が正しく呼び出されているか確認

2. **AI 応答が正しく解析されない**

   - AI 応答の形式が期待される形式と一致しているか確認
   - parseAIResponse 関数の正規表現パターンを調整

3. **プロジェクトデータが渡されない**
   - currentProjectState が正しく設定されているか確認
   - useRecoilValue(currentProjectState) が正しく使用されているか確認

### デバッグ方法

```tsx
// AI応答のデバッグ
onComplete: (result) => {
  console.log("AI応答:", result);
  console.log("解析結果:", parseAIResponse(result.content));
},
```

## 今後の拡張予定

- [ ] AI プロバイダーの追加
- [ ] カスタムプロンプトテンプレート
- [ ] AI 応答の履歴機能
- [ ] バッチ処理の進捗表示改善
- [ ] エラーハンドリングの強化
