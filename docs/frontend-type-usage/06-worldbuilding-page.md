# WorldBuildingPage 型使用状況調査

## 概要
場所・拠点設定画面の型使用状況を調査。TRPGの世界観構築機能を提供。

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/WorldBuildingPage.tsx`
- **拠点タブ**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/worldbuilding/BaseTab.tsx`
- **場所タブ**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/worldbuilding/LocationTab.tsx`

## 使用している型定義

### 共通型のimport
```typescript
// BaseTab.tsx
import { BaseLocation, StartingLocationInfo } from "@trpg-ai-gm/types";

// LocationTab.tsx - 問題: 独自型を定義
// packages/typesを使用せず、独自のExplorationLocation型を定義
```

### WorldBuilding型 (packages/types/index.ts: 355-367行目)
```typescript
export interface WorldBuilding {
  id: string;
  // 基本設定（TRPG必須）
  setting: TRPGSettingElement[];
  // 拠点・場所管理（TRPG核心機能）
  places: TRPGPlaceElement[];
  // ワールドマップ（TRPG重要機能）
  worldmaps: TRPGWorldMapElement[];
  // ゲームルール（TRPG運用）
  rules: TRPGRuleElement[];
  // 世界地図画像
  worldMapImageUrl?: string;
}
```

### BaseLocation型 (packages/types/index.ts: 1736-1850行目)
```typescript
export interface BaseLocation {
  id: string;
  name: string;
  type: string; // 村、町、都市、砦、城、神殿、浮遊島など
  region: string; // 所在地・地域
  description: string;
  rank: string; // 小村、中規模都市、大都市、要塞都市
  importance: "主要拠点" | "サブ拠点" | "隠し拠点";

  // 施設情報
  facilities: {
    inn?: Inn;
    shops?: Shop[];
    armory?: Armory;
    temple?: Temple;
    guild?: Guild;
    blacksmith?: Blacksmith;
    otherFacilities?: OtherFacility[];
  };

  // 機能・用途
  features: {
    fastTravel: boolean; // ファストトラベル可能か
    playerBase: boolean; // プレイヤー拠点として使えるか
    questHub: boolean; // クエスト発生ポイントか
    defenseEvent: boolean; // 拠点防衛イベントの有無
  };

  // 危険・影響要素
  threats: {
    dangerLevel: string; // 低、中、高
    monsterAttackRate: number; // モンスター襲撃率
    playerReputation: number; // プレイヤーの評判
    currentEvents: string[]; // 現在の情勢
    controllingFaction: string; // 支配勢力
  };

  // TRPGセッション用: 行動可能リスト
  availableActions?: {
    id: string;
    name: string;
    description: string;
    category: "exploration" | "social" | "shopping" | "training" | "rest" | "quest" | "custom";
  }[];
}
```

## データアクセスパターン

### TRPGCampaignからのデータアクセス
```typescript
// WorldBuildingPage.tsx
const currentCampaign = useRecoilValue(currentCampaignState);

// アクセスするプロパティ
currentCampaign?.title
currentCampaign?.synopsis
currentCampaign?.plot
currentCampaign?.characters
currentCampaign?.worldBuilding?.worldMapImageUrl
currentCampaign?.startingLocation

// BaseTab.tsx
currentCampaign?.bases        // BaseLocation[]
currentCampaign?.startingLocation  // StartingLocationInfo

// LocationTab.tsx - 問題: worldBuilding.placesを使用せず
// currentCampaign?.worldBuilding?.places を使うべきだが使用していない
```

## 型使用状況の詳細分析

### ✅ 正しく実装されている部分

#### 1. BaseTab（拠点管理）
```typescript
// 正しくBaseLocation型を使用
const [bases, setBases] = useState<BaseLocation[]>(
  currentCampaign?.bases || []
);

// 施設情報の型安全な管理
facilities: {
  inn?: Inn;
  shops?: Shop[];
  armory?: Armory;
  temple?: Temple;
  guild?: Guild;
  blacksmith?: Blacksmith;
}

// TRPGセッション機能との連携
availableActions?: {
  id: string;
  name: string;
  description: string;
  category: "exploration" | "social" | "shopping" | "training" | "rest" | "quest" | "custom";
}[]
```

#### 2. 開始場所設定機能
```typescript
// StartingLocationInfo型を正しく使用
interface StartingLocationInfo {
  id: string; // 場所のID
  name: string; // 場所の名前
  type: "base" | "location"; // 拠点かフィールドかを区別
  description?: string; // 場所の説明
  imageUrl?: string; // 場所の画像URL
  setAt: Date; // 設定された日時
  isActive: boolean; // 現在アクティブな開始場所か
}
```

### ❌ 重大な問題が発見された部分

#### LocationTab（場所管理）の独自型定義
```typescript
// 問題: packages/typesを使わず独自型を定義
interface ExplorationLocation {
  id: string;
  name: string;
  type: "森" | "山" | "洞窟" | "遺跡" | "平原" | "海岸" | "砂漠" | "湿地" | "その他";
  region: string;
  description: string;
  dangerLevel: "極低" | "低" | "中" | "高" | "極高";
  availableActions?: {
    id: string;
    name: string;
    description: string;
    category: string;
    skillCheck?: {
      skill: string;
      difficulty: number;
    };
  }[];
  encounters: {
    probability: number;
    types: string[];
    notes: string;
  };
  environment: {
    climate: string;
    terrain: string;
    naturalResources: string[];
    hazards: string[];
  };
  meta: {
    created_at: string;
    updated_at: string;
    unlock_conditions?: string[];
  };
  imageUrl?: string;
  created_at: string;
  updated_at: string;
}
```

## 型統合の問題点

### 1. 重複する機能
```typescript
// BaseLocation（拠点）
availableActions?: {
  category: "exploration" | "social" | "shopping" | "training" | "rest" | "quest" | "custom";
}

// ExplorationLocation（探索地）- 独自実装
availableActions?: {
  category: string; // 型安全でない
  skillCheck?: {    // BaseLocationにない機能
    skill: string;
    difficulty: number;
  };
}
```

### 2. データソースの分離
```typescript
// 拠点データ
currentCampaign.bases: BaseLocation[]

// 探索地データ（本来使うべき）
currentCampaign.worldBuilding.places: TRPGPlaceElement[]

// 実際（問題）
LocationTab内で独自のローカル状態を管理
```

### 3. TRPGPlaceElement型の未活用
```typescript
// packages/types/index.ts で定義されているが使用されていない
export interface TRPGPlaceElement {
  id: string;
  name: string;
  type: "town" | "dungeon" | "field" | "landmark" | "other";
  description: string;
  region?: string;
  connections?: string[]; // 接続する場所のID
  dangerLevel?: "safe" | "low" | "medium" | "high" | "extreme";
  features?: string; // 特徴的な施設・地形
  npcs?: string[]; // この場所にいるNPCのID
  enemies?: string[]; // この場所に出現するエネミーのID
  treasures?: string[]; // この場所で入手可能なアイテム
  quests?: string[]; // この場所で発生するクエストのID
  imageUrl?: string;
  unlocked?: boolean; // プレイヤーが発見済みか
}
```

## 小説作成機能の名残

### 発見された問題
1. **ExplorationLocation型**: 完全に独自実装で、共通型を使用していない
2. **データ分離**: worldBuilding.placesが活用されていない
3. **型の重複**: BaseLocationと似た機能を独自実装

### 影響範囲
- LocationTab.tsx 全体
- 場所データの永続化（共通データストアとの非整合）
- TRPGセッション機能との連携不備

## 推奨改善策

### 1. 型統合
```typescript
// LocationTab.tsxの修正案
import { TRPGPlaceElement } from "@trpg-ai-gm/types";

// ExplorationLocation型を削除し、TRPGPlaceElement型を使用
const [places, setPlaces] = useState<TRPGPlaceElement[]>(
  currentCampaign?.worldBuilding?.places || []
);
```

### 2. データフロー統一
```typescript
// 拠点と探索地の明確な分離
拠点（定住地）: currentCampaign.bases (BaseLocation[])
探索地（野外）: currentCampaign.worldBuilding.places (TRPGPlaceElement[])
```

### 3. 機能統合
```typescript
// availableActionsの型統一
// BaseLocationとTRPGPlaceElementで共通の行動選択肢型を使用
```

## 結論
WorldBuildingPageは部分的に共通型を使用していますが、LocationTabで独自型を定義している重大な問題があります。BaseLocation型は正しく活用されている一方、TRPGPlaceElement型が未活用で、型システムの一貫性が損なわれています。LocationTabの完全な型統合が必要です。