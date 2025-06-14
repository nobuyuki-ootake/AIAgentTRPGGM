# QuestPage 型使用状況調査

## 概要
クエスト管理画面の型使用状況を調査。TRPGキャンペーンのクエスト作成・編集・管理機能を提供。

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/QuestPage.tsx`
- **関連コンポーネント**: クエスト作成・編集ダイアログ

## 使用している型定義

### 共通型のimport
```typescript
import { TRPGCampaign, QuestElement, NPCCharacter } from "@trpg-ai-gm/types";
import { currentCampaignState } from "../store/atoms";
```

### QuestElement型 (packages/types/index.ts: 55-68行目)
```typescript
export interface QuestElement {
  id: string;
  title: string;
  description: string;
  order: number;
  status: "未開始" | "進行中" | "完了" | "失敗" | "保留";
  questType: "メイン" | "サブ" | "個人" | "隠し";
  difficulty: 1 | 2 | 3 | 4 | 5;
  rewards?: string[];
  prerequisites?: string[];
  sessionId?: string;
  relatedCharacterIds?: string[];
  relatedPlaceIds?: string[];
}
```

## データアクセスパターン

### TRPGCampaignからのクエストデータアクセス
```typescript
// currentCampaign.plot: QuestElement[] (13行目で定義)
const quests = currentCampaign?.plot || [];
```

## 型拡張と問題点

### 1. ローカル拡張型：EnhancedQuest (54-80行目)
```typescript
interface EnhancedQuest extends QuestElement {
  objectives: QuestObjective[];
  detailedRewards: {
    experience: number;
    items: string[];
    gold: number;
    reputation?: string;
  };
  discoveryConditions: {
    npcId?: string;
    location?: string;
    itemRequired?: string;
    questboardAvailable: boolean;
  };
  timeLimit?: {
    days: number;
    consequences?: string;
  };
  priority: "low" | "medium" | "high";
  giver: string;
  notes: string;
}
```

### 2. 重複型定義の問題
```typescript
// 44-45行目: QuestElementのstatusと重複
type QuestStatus = "未開始" | "進行中" | "完了" | "失敗" | "保留";

// 47-52行目: 追加のローカル型
interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  order: number;
}
```

## 型安全性の問題

### ❌ 重大な問題
1. **型安全性の放棄** (109行目)
```typescript
// any型への回避により型チェックが無効化
const enhancedQuests: EnhancedQuest[] = quests.map((quest: any) => ({
  // QuestElement → EnhancedQuest変換
}));
```

2. **データ損失リスク** (129-142行目)
```typescript
// EnhancedQuest → QuestElement へのダウンキャスト
const saveQuests = (questsToSave: EnhancedQuest[]) => {
  const questElements: QuestElement[] = questsToSave.map(quest => ({
    // 拡張プロパティが失われる
    id: quest.id,
    title: quest.title,
    // ... 基本プロパティのみ保存
  }));
};
```

### ⚠️ 型連携の課題
1. **NPC連携**
```typescript
// 文字列ベースの連携（型安全でない）
giver: string  // NPCCharacter.id への参照だが型チェックなし
```

2. **セッション連携**
```typescript
// 基本的な関連付けのみ
sessionId?: string  // GameSession.id への参照
```

## データフロー

### 1. 読み込み
```
TRPGCampaign.plot: QuestElement[]
↓ (108-125行目)
EnhancedQuest[] (any型経由で変換)
```

### 2. 保存
```
EnhancedQuest[] (フォーム入力)
↓ (129-142行目)
QuestElement[] (ダウンキャスト)
↓
TRPGCampaign.plot 更新
```

## リスク評価

### 🔴 高リスク
- **データ損失**: EnhancedQuestの拡張データが保存されない
- **型安全性**: any型使用により実行時エラーのリスク

### 🟡 中リスク
- **保守性**: 重複型定義による非一貫性
- **連携**: NPC・セッションとの型安全でない関連付け

## 推奨改善策

1. **共通型の拡張**: QuestElementを直接拡張してEnhancedQuestの機能を統合
2. **型安全な変換**: any型を排除し、型安全な変換関数を実装
3. **関連型の強化**: NPC・セッションとの型安全な関連付け
4. **重複排除**: ローカル型定義を共通型に統合

## 結論
QuestPageは機能豊富だが、型安全性と共通型との整合性に重大な問題があります。特にEnhancedQuest型の拡張データが永続化されない点は、データ損失の重大なリスクとなっています。