# NPCPage 型使用状況調査

## 概要
NPC管理画面の型使用状況を調査。TRPGのNPCキャラクターの作成・編集・管理機能を提供。

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/NPCPage.tsx`

## 使用している型定義

### 共通型のimport
```typescript
import { NPCCharacter } from "@trpg-ai-gm/types";
import { useRecoilState } from "recoil";
import { currentCampaignState } from "../store/atoms";
```

### NPCCharacter型 (packages/types/index.ts: 251-260行目)
```typescript
export interface NPCCharacter extends TRPGCharacter {
  characterType: "NPC";
  location?: string;           // 主な居場所
  occupation?: string;         // 職業
  attitude: "friendly" | "neutral" | "hostile" | "unknown";
  knowledge?: string[];        // 知っている情報
  services?: string[];         // 提供できるサービス
  questIds?: string[];         // 関連クエスト
  dialoguePatterns?: string[]; // 会話パターン
}
```

## 継承関係とデータ構造

### TRPGCharacterからの継承
NPCCharacterは`TRPGCharacter`を完全に継承し、以下の全ての機能を含む：

```typescript
// 基本情報（Stormbringerベース）
id: string;
name: string;
characterType: "NPC"; // 固定値
profession: string;    // 職業
gender: string;
age: number;
nation: string;        // 国籍/種族
religion: string;
player: string;        // プレイヤー名（NPCの場合は通常"GM"）
description: string;   // 外見や特徴
scars?: string;        // 傷跡などの自由記述

// 能力値（Stormbringer）
attributes: {
  STR: number; // 筋力
  CON: number; // 耐久力
  SIZ: number; // 体格
  INT: number; // 知性
  POW: number; // 魔力・意志力
  DEX: number; // 器用さ
  CHA: number; // 魅力
};

// 派生値
derived: {
  HP: number; // ヒットポイント
  MP: number; // マジックポイント
  SW: number; // Strike Rank（先制値）
  RES: number; // 抵抗値
};

// 武器・装甲・スキル
weapons: StormbringerWeapon[];
armor: {
  head: number;
  body: number;
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
};
skills: {
  AgilitySkills: StormbringerSkill[];
  CommunicationSkills: StormbringerSkill[];
  KnowledgeSkills: StormbringerSkill[];
  ManipulationSkills: StormbringerSkill[];
  PerceptionSkills: StormbringerSkill[];
  StealthSkills: StormbringerSkill[];
  MagicSkills: StormbringerSkill[];
  WeaponSkills: StormbringerSkill[];
};

imageUrl?: string;
```

## データアクセスパターン

### TRPGCampaignからのNPCデータアクセス
```typescript
// currentCampaign.npcs: NPCCharacter[] (19行目で定義)
const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
const [npcs, setNpcs] = useState<NPCCharacter[]>(currentCampaign?.npcs || []);
```

## NPC専用機能の実装

### 1. 場所・職業管理
```typescript
// 居場所の設定
location?: string        // "リバーベント街", "翠の森道" など

// 職業の管理
profession: string       // TRPGCharacterの基本職業
occupation?: string      // NPC特有の職業（店主、村長など）
```

### 2. 態度システム
```typescript
// 4段階の態度設定
attitude: "friendly" | "neutral" | "hostile" | "unknown"

// フォームでの型安全な更新
onChange={(e) => 
  handleFormChange("attitude", e.target.value as NPCCharacter["attitude"])
}
```

### 3. 知識・サービス管理
```typescript
// 配列フィールドの文字列変換処理
knowledge?: string[]     // NPCが知っている情報
services?: string[]      // 提供できるサービス

// UI処理での配列⇔文字列変換
value={formData.services?.join(", ") || ""}
onChange={(e) => 
  handleFormChange("services", 
    e.target.value.split(",").map(s => s.trim()).filter(s => s)
  )
}
```

### 4. クエスト・会話システム
```typescript
questIds?: string[]         // 関連クエストのID配列
dialoguePatterns?: string[] // 会話パターン配列

// クエストとの連携
const relatedQuests = currentCampaign?.plot?.filter(quest => 
  formData.questIds?.includes(quest.id)
);
```

## フォームデータ処理

### 1. 初期化処理
```typescript
// 新規NPC作成時のデフォルト値
const defaultNPC: NPCCharacter = {
  id: "",
  name: "",
  characterType: "NPC",
  profession: "",
  gender: "",
  age: 25,
  nation: "",
  religion: "",
  player: "GM",
  description: "",
  
  // Stormbringer能力値
  attributes: {
    STR: 10, CON: 10, SIZ: 10, INT: 10,
    POW: 10, DEX: 10, CHA: 10,
  },
  
  // NPC専用フィールド
  location: "",
  occupation: "",
  attitude: "neutral",
  knowledge: [],
  services: [],
  questIds: [],
  dialoguePatterns: [],
  
  // 派生値、武器、装甲、スキルも初期化
  derived: { HP: 20, MP: 10, SW: 10, RES: 10 },
  weapons: [],
  armor: { head: 0, body: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 },
  skills: { /* 8カテゴリのスキル */ },
};
```

### 2. フォーム更新処理
```typescript
// 汎用フォーム更新関数
const handleFormChange = (field: keyof NPCCharacter, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value,
  }));
};

// 配列フィールドの特別処理
const updateArrayField = (field: 'knowledge' | 'services' | 'dialoguePatterns', value: string) => {
  const arrayValue = value.split(",").map(s => s.trim()).filter(s => s);
  handleFormChange(field, arrayValue);
};
```

### 3. AI生成NPCの統合
```typescript
// AI生成データの型変換
const parseAIResponseToNPCs = (response: string): NPCCharacter[] => {
  try {
    const parsed = JSON.parse(response);
    const npcs = Array.isArray(parsed) ? parsed : [parsed];
    
    return npcs.map(npc => ({
      id: uuidv4(),
      characterType: "NPC" as const,
      
      // TRPGCharacterの全フィールドを設定
      name: npc.name || "名無しのNPC",
      profession: npc.profession || "",
      // ... 他の基本フィールド
      
      // Stormbringer能力値
      attributes: {
        STR: npc.attributes?.STR || 10,
        CON: npc.attributes?.CON || 10,
        // ... 他の能力値
      },
      
      // NPC専用フィールド
      location: npc.location || "",
      attitude: npc.attitude || "neutral",
      knowledge: Array.isArray(npc.knowledge) ? npc.knowledge : [],
      services: Array.isArray(npc.services) ? npc.services : [],
      questIds: Array.isArray(npc.questIds) ? npc.questIds : [],
      dialoguePatterns: Array.isArray(npc.dialoguePatterns) ? npc.dialoguePatterns : [],
      
      // 派生値、武器、装甲、スキルもデフォルト値で初期化
    }));
  } catch (error) {
    console.error("AI応答の解析に失敗:", error);
    return [];
  }
};
```

## 型安全性の状況

### ✅ 優秀な点
- **完全な継承**: TRPGCharacterの全機能を継承
- **Stormbringerシステム準拠**: ゲームシステムとして完全に機能
- **型安全な配列処理**: 文字列⇔配列変換も型安全
- **AI統合**: 生成コンテンツも同じ型構造に変換

### ✅ 設計の一貫性
- **共通型使用**: packages/typesの型定義を完全に使用
- **PCとの互換性**: TRPGCharacterベースでPCと同じ能力を持つ
- **拡張性**: NPC専用機能を適切に追加

### ⚠️ 注意点
```typescript
// professionとoccupationの概念重複
profession: string;    // TRPGCharacterから継承
occupation?: string;   // NPC専用（概念が重複）

// この2つの使い分けが不明確
```

## NPC表示とインタラクション

### NPCカード表示
```typescript
// 基本情報表示
<Typography variant="h6">{npc.name}</Typography>
<Typography>{npc.nation} | {npc.profession}</Typography>
{npc.occupation && <Typography>職業: {npc.occupation}</Typography>}
<Chip 
  label={npc.attitude} 
  color={getAttitudeColor(npc.attitude)}
/>

// 能力値表示
STR: {npc.attributes.STR}
HP: {npc.derived.HP}
MP: {npc.derived.MP}

// NPC機能表示
場所: {npc.location}
サービス: {npc.services?.join(", ")}
知識: {npc.knowledge?.join(", ")}
```

### クエスト連携
```typescript
// 関連クエストの表示
const relatedQuests = currentCampaign?.plot?.filter(quest => 
  npc.questIds?.includes(quest.id)
);

{relatedQuests?.map(quest => (
  <Chip key={quest.id} label={quest.title} />
))}
```

## 結論
NPCPageは`packages/types`の`NPCCharacter`型と完全に整合し、TRPGCharacterの全機能を継承しながらNPC専用機能を適切に実装しています。Stormbringerベースのゲームシステムを完全に準拠し、PC・NPC間で一貫した型システムを実現。AI生成コンテンツの統合、クエストシステムとの連携まで型安全に実装されています。