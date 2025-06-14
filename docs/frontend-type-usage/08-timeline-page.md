# TimelinePage 型使用状況調査

## 概要
キャンペーンのイベント管理画面の型使用状況を調査。TRPGタイムラインイベントの作成・編集・管理機能を提供。

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/TimelinePage.tsx`
- **関連コンポーネント**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/timeline/`

## 使用している型定義

### 共通型のimport
```typescript
import {
  TimelineEventSeed,
  TimelineEvent,
  PlaceElement,
  BaseLocation,
  ClearCondition,
  EventCondition,
} from "@trpg-ai-gm/types";
```

### TimelineEvent型 (packages/types/index.ts: 749-779行目)
```typescript
export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  dayNumber?: number; // 1日目、2日目など
  relatedCharacters: string[];
  relatedPlaces: string[];
  order: number;
  eventType?:
    | "battle"
    | "rest"
    | "dialogue"
    | "journey"
    | "discovery"
    | "turning_point"
    | "info"
    | "mystery"
    | "setup"
    | "celebration"
    | "other";
  outcome?: "success" | "failure" | "partial" | "ongoing";
  postEventCharacterStatuses?: {
    [characterId: string]: CharacterStatus[];
  };
  relatedPlotIds?: string[]; // 関連するプロット/クエストのID配列
  placeId?: string; // 主要な場所ID
  experienceAwarded?: number;
  results?: EventResult[]; // イベントの結果（アイテム取得、フラグ設定など）
  conditions?: EventCondition[]; // イベントの発生条件
}
```

### SessionEvent型 (packages/types/index.ts: 721-746行目)
```typescript
export interface SessionEvent {
  id: string;
  title: string;
  description: string;
  sessionDay: number; // セッション内の日数
  sessionTime?: string; // セッション内の時刻
  relatedCharacters: string[];
  relatedPlaces: string[];
  order: number;
  eventType:
    | "combat"
    | "roleplay"
    | "exploration"
    | "puzzle"
    | "social"
    | "discovery"
    | "rest";
  outcome?: "success" | "failure" | "partial" | "ongoing";
  postEventCharacterStatuses?: {
    [characterId: string]: CharacterStatus[];
  };
  relatedQuestIds?: string[]; // 関連するクエストのID配列
  placeId?: string; // 主要な場所ID
  experienceAwarded?: number;
  lootGained?: Equipment[];
}
```

## データアクセスパターン

### ❌ 型不整合の問題
```typescript
// TRPGCampaign型の定義 (16行目)
timeline: SessionEvent[]; // SessionEvent配列として定義

// TimelinePage.tsxでの使用
// 実際にはTimelineEvent配列として使用されている
const timelineEvents: TimelineEvent[] = useTimeline();
```

### TRPGCampaignからのデータアクセス
```typescript
// TimelinePage.tsx内でアクセス
const currentCampaign = useRecoilValue(currentCampaignState);

// アクセスしているプロパティ
currentCampaign?.plot || []              // QuestElement[]
currentCampaign?.sessions || []          // GameSession[]
currentCampaign?.clearConditions || []   // ClearCondition[]
currentCampaign?.items || []             // Item[]
```

## イベント管理の実装

### 1. 新規イベント作成
```typescript
// デフォルトイベント状態
const [newEvent, setNewEvent] = useState<TimelineEvent>({
  id: "",
  title: "",
  description: "",
  date: moment().toISOString(),
  dayNumber: 1,
  relatedCharacters: [],
  relatedPlaces: [],
  order: 0,
  eventType: "other" as const,
  postEventCharacterStatuses: {},
  relatedPlotIds: [],
});
```

### 2. AI生成イベントの統合
```typescript
// TimelineEventSeedからTimelineEventへの変換
const convertSeedToTimelineEvent = (seed: TimelineEventSeed): TimelineEvent => ({
  id: uuidv4(),
  title: seed.eventName,
  description: seed.description || "",
  date: moment().toISOString(),
  dayNumber: seed.estimatedTime ? parseTimeToDay(seed.estimatedTime) : 1,
  relatedCharacters: seed.characterIds || [],
  relatedPlaces: seed.relatedPlaceIds || [],
  order: timelineEvents.length,
  eventType: "other",
  relatedPlotIds: seed.relatedPlotIds || [],
});
```

### 3. イベント結果システム
```typescript
// EventResult型の活用
results?: EventResult[]

// EventResult型 (packages/types/index.ts: 782-810行目)
export interface EventResult {
  id: string;
  type:
    | "item_gained"
    | "item_lost"
    | "flag_set"
    | "flag_unset"
    | "condition_met"
    | "story_progress"
    | "character_change"
    | "hp_change"
    | "mp_change"
    | "gold_change"
    | "experience_change"
    | "status_effect_add"
    | "status_effect_remove"
    | "location_change";
  description: string;
  itemId?: string;
  itemQuantity?: number;
  flagKey?: string;
  flagValue?: string | number | boolean;
  characterId?: string;
  value?: number;
  statusEffect?: string;
  newLocation?: string;
  metadata?: Record<string, string | number | boolean>;
}

// 使用例
const handleEventResultSubmit = (results: EventResult[]) => {
  setSelectedEventForResult(prev => prev ? {
    ...prev,
    results: [...(prev.results || []), ...results]
  } : null);
};
```

### 4. イベント発生条件システム
```typescript
// EventCondition型の活用
conditions?: EventCondition[]

// EventCondition型 (packages/types/index.ts: 812-835行目)
export interface EventCondition {
  id: string;
  type:
    | "item_required"
    | "flag_required"
    | "character_status"
    | "location_required"
    | "quest_completed"
    | "day_range"
    | "custom";
  description: string;
  itemId?: string;
  itemQuantity?: number;
  flagKey?: string;
  flagValue?: string | number | boolean;
  characterId?: string;
  characterStatusId?: string;
  locationId?: string;
  questId?: string;
  dayMin?: number;
  dayMax?: number;
  customCondition?: string;
  operator?: "AND" | "OR";
}

// 使用例
const handleEventConditionsChange = (conditions: EventCondition[]) => {
  setNewEvent(prev => ({
    ...prev,
    conditions
  }));
};
```

## ClearCondition型との連携

### クリア条件管理
```typescript
// ClearCondition型 (packages/types/index.ts: 838-862行目)
export interface ClearCondition {
  id: string;
  title: string;
  description: string;
  type:
    | "item_collection"
    | "quest_completion"
    | "character_survival"
    | "location_reached"
    | "story_milestone"
    | "custom";
  requiredItems?: {
    itemId: string;
    itemName: string;
    quantity: number;
  }[];
  requiredQuests?: string[];
  requiredCharacters?: string[];
  requiredLocation?: string;
  storyMilestone?: string;
  customDescription?: string;
  priority: "primary" | "secondary" | "optional";
  successDescription: string;
  failureDescription?: string;
}

// TimelinePageでの使用
const handleSaveClearConditions = (clearConditions: ClearCondition[]) => {
  setCurrentCampaign(prev => prev ? {
    ...prev,
    clearConditions
  } : null);
};
```

## 型不整合の問題

### ❌ 重大な型不整合
```typescript
// 1. TRPGCampaign.timeline型の不整合
timeline: SessionEvent[]     // 型定義
timelineEvents: TimelineEvent[]  // 実際の使用

// 2. 場所型の統合問題
places={[...(places || []), ...(bases || [])]}
// PlaceElement[] + BaseLocation[] → 型エラー

// 3. eventType列挙値の不整合
// SessionEvent.eventType: "combat" | "roleplay" | "exploration" | ...
// TimelineEvent.eventType: "battle" | "rest" | "dialogue" | ...
```

### 型変換の必要性
```typescript
// SessionEvent → TimelineEvent の変換関数が必要
const convertSessionEventToTimelineEvent = (sessionEvent: SessionEvent): TimelineEvent => ({
  id: sessionEvent.id,
  title: sessionEvent.title,
  description: sessionEvent.description,
  date: new Date().toISOString(), // sessionDayから変換
  dayNumber: sessionEvent.sessionDay,
  relatedCharacters: sessionEvent.relatedCharacters,
  relatedPlaces: sessionEvent.relatedPlaces,
  order: sessionEvent.order,
  eventType: mapSessionEventTypeToTimelineEventType(sessionEvent.eventType),
  outcome: sessionEvent.outcome,
  postEventCharacterStatuses: sessionEvent.postEventCharacterStatuses,
  relatedPlotIds: sessionEvent.relatedQuestIds,
  placeId: sessionEvent.placeId,
  experienceAwarded: sessionEvent.experienceAwarded,
});
```

## ドラッグ&ドロップ機能

### 型安全なドラッグ操作
```typescript
// DnD状態管理
const [activeDragItem, setActiveDragItem] = useState<TimelineEvent | null>(null);

// イベント順序変更
const handleEventOrderChange = (reorderedEvents: TimelineEvent[]) => {
  // order プロパティを更新
  const updatedEvents = reorderedEvents.map((event, index) => ({
    ...event,
    order: index
  }));
  setTimelineEvents(updatedEvents);
};
```

## 型安全性の状況

### ⚠️ 重大な問題
- **型定義不整合**: SessionEvent vs TimelineEvent
- **場所型混在**: PlaceElement + BaseLocation
- **eventType不整合**: 列挙値の違い

### ✅ 良好な点
- **EventResult/EventCondition**: 詳細なイベントシステム
- **ClearCondition連携**: 型安全なクリア条件管理
- **AI統合**: TimelineEventSeedの適切な変換

### 📋 推奨改善策
1. **TRPGCampaign.timeline型の統一**: `TimelineEvent[]`に変更
2. **場所型の統合**: 共通インターフェースの作成
3. **eventType統一**: 列挙値の一致
4. **変換関数実装**: SessionEvent ⟷ TimelineEvent

## 結論
TimelinePageは豊富なイベント管理機能を提供していますが、SessionEventとTimelineEventの型不整合、場所型の混在など、重大な型システムの問題があります。EventResult/EventConditionシステムは適切に実装されており、型安全なイベント管理の基盤は整っていますが、型定義の統一が急務です。