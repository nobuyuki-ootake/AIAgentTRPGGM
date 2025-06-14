# SynopsisPage 型使用状況調査

## 概要
キャンペーン背景（あらすじ）編集画面の型使用状況を調査

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/SynopsisPage.tsx`
- **カスタムフック**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/hooks/useSynopsis.ts`
- **コンポーネント**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/synopsis/`

## 使用している型定義

### メイン型
- **`TRPGCampaign`** (packages/types/index.ts: 4-42行目)
  - 基本キャンペーン情報の型定義

### 使用プロパティ
```typescript
interface TRPGCampaign {
  title: string;          // キャンペーンタイトル
  synopsis: string;       // あらすじ内容
  updatedAt: Date;        // 最終更新日時
}
```

## Recoil状態管理

### 状態アトム
```typescript
// currentCampaignState: TRPGCampaign | null
export const currentCampaignState = atom<TRPGCampaign | null>({
  key: "currentCampaign",
  default: null,
});

// 後方互換性エイリアス
export const currentProjectState = currentCampaignState;
```

## データアクセスパターン

### 1. 表示処理
```typescript
// キャンペーンタイトル表示
currentProject?.title: string | undefined

// あらすじ内容表示
currentProject?.synopsis: string | undefined
```

### 2. 更新処理
```typescript
// フォーム保存時
setCurrentProject({
  ...currentProject,           // 既存データ保持
  synopsis,                   // string: 新しいあらすじ
  updatedAt: new Date(),      // Date: 更新日時
});
```

### 3. フォーム入力処理
```typescript
// ローカル状態管理
const [synopsis, setSynopsis] = useState<string>("");

// 入力イベントハンドリング
handleSynopsisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSynopsis(e.target.value); // string型
};
```

## エラーハンドリング

### 1. キャンペーン未選択チェック
```typescript
if (!currentProject) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography>キャンペーンが選択されていません。</Typography>
    </Box>
  );
}
```

### 2. AI統合エラー処理
```typescript
type IntegrationError = "invalid_config" | "missing_project" | "invalid_context";

interface ValidationResult {
  isValid: boolean;
  error?: IntegrationError;
  message?: string;
}
```

## 型安全性の状況

### ✅ 良好な点
- `TRPGCampaign`型を正しく使用
- プロパティアクセスが型定義と一致
- ローカル状態とグローバル状態の型が一貫

### ⚠️ 注意点
- ローカル状態とグローバル状態の同期が重要
- nullable チェックが適切に実装されている

## 結論
SynopsisPageは`packages/types`の型定義と完全に整合しており、型安全な実装が維持されています。`TRPGCampaign`型の`title`、`synopsis`、`updatedAt`プロパティを適切に使用し、フロントエンドとバックエンドの型統一が保たれています。