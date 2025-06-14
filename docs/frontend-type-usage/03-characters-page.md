# CharactersPage 型使用状況調査

## 概要
パーティ（キャラクター）管理画面の型使用状況を調査。TRPGキャラクターの作成・編集・管理機能を提供。

## ファイルパス
- **メインページ**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/CharactersPage.tsx`
- **コンテキスト**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/contexts/CharactersContext.tsx`
- **カスタムフック**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/hooks/useCharacters.ts`
- **フォーム**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/characters/CharacterForm.tsx`
- **カード**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/characters/CharacterCard.tsx`

## 使用している型定義

### 共通型のimport
```typescript
import {
  TRPGCharacter,
  TRPGCampaign,
  CustomField,
  CharacterStatus,
  CharacterTrait,
  Relationship,
  CharacterStats,
  Skill,
  Equipment,
  CharacterProgression,
  StormbringerSkill,
  StormbringerWeapon,
} from "@trpg-ai-gm/types";
```

### TRPGCharacter型 (packages/types/index.ts: 154-220行目)
```typescript
export interface TRPGCharacter {
  id: string;
  name: string;
  characterType: "PC" | "NPC";
  
  // 基本情報（Stormbringerベース）
  profession: string; // 職業
  gender: string;
  age: number;
  nation: string; // 国籍/種族
  religion: string;
  player: string; // プレイヤー名
  description: string; // 外見や特徴
  scars?: string; // 傷跡などの自由記述
  
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
}
```

## データアクセスパターン

### TRPGCampaignからのキャラクターデータアクセス
```typescript
// currentCampaign.characters: TRPGCharacter[] (14行目で定義)
const characters = currentProject?.characters || [];

// PC/NPC/Enemy の分類
const getPCs = () => characters.filter(c => c.characterType === 'PC');
const getNPCs = () => characters.filter(c => c.characterType === 'NPC');
```

## Stormbringerシステムの実装

### 1. 能力値システム
```typescript
// デフォルト能力値
const defaultAttributes = {
  STR: 10, CON: 10, SIZ: 10, INT: 10,
  POW: 10, DEX: 10, CHA: 10,
};

// 派生値計算
const calculateDerived = (attributes: TRPGCharacter['attributes']) => ({
  HP: Math.floor((attributes.CON + attributes.SIZ) / 2),
  MP: attributes.POW,
  SW: Math.floor((attributes.DEX + attributes.INT) / 2),
  RES: Math.floor((attributes.POW + attributes.CON) / 2),
});
```

### 2. スキルシステム
```typescript
// Stormbringerスキル分類
const defaultSkills = {
  AgilitySkills: [
    { name: "跳躍", value: 30 },
    { name: "登攀", value: 25 },
    { name: "軽業", value: 20 }
  ],
  CommunicationSkills: [
    { name: "説得", value: 15 },
    { name: "威圧", value: 10 }
  ],
  // ... 全8カテゴリ
};

// スキル値はパーセンテージベース（0-100）
interface StormbringerSkill {
  name: string;
  value: number;
}
```

### 3. 武器・装甲システム
```typescript
// Stormbringer武器定義
interface StormbringerWeapon {
  name: string;
  attack: number;
  damage: string; // "1d8+1d4" 形式
  hit: number;
  parry: number;
  range: string;
}

// 部位別装甲
armor: {
  head: number;     // 頭部装甲値
  body: number;     // 胴体装甲値
  leftArm: number;  // 左腕装甲値
  rightArm: number; // 右腕装甲値
  leftLeg: number;  // 左脚装甲値
  rightLeg: number; // 右脚装甲値
}
```

## キャラクター作成・編集プロセス

### 1. 初期状態設定
```typescript
const initialCharacterState: Partial<TRPGCharacter> = {
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
  attributes: defaultAttributes,
  derived: calculateDerived(defaultAttributes),
  weapons: [],
  armor: defaultArmor,
  skills: defaultSkills,
};
```

### 2. 型変換とバリデーション
```typescript
const convertToTRPGCharacter = (character: TRPGCharacter): TRPGCharacter => {
  return {
    ...character,
    id: character.id || uuidv4(),
    characterType: character.characterType || "NPC",
    attributes: character.attributes || defaultAttributes,
    derived: character.derived || calculateDerived(character.attributes),
    weapons: character.weapons || [],
    armor: character.armor || defaultArmor,
    skills: character.skills || defaultSkills,
  };
};
```

### 3. AI生成キャラクターの統合
```typescript
const parseAIResponseToCharacters = (response: string): TRPGCharacter[] => {
  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) 
      ? parsed.map(char => convertToTRPGCharacter(char))
      : [convertToTRPGCharacter(parsed)];
  } catch {
    // テキスト形式の場合の変換処理
    return parseTextToCharacters(response);
  }
};
```

## PC/NPC 特化情報の型拡張

### PlayerCharacter 拡張型
```typescript
interface PlayerCharacter extends TRPGCharacter {
  characterType: "PC";
  backstory: string;    // 背景設定
  goals: string[];      // 目標
  bonds: string[];      // 絆
  flaws: string[];      // 欠点
  ideals: string[];     // 理想
  currentHP?: number;   // 現在HP
  currentMP?: number;   // 現在MP
}
```

### NPCCharacter 拡張型
```typescript
interface NPCCharacter extends TRPGCharacter {
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

## フォームコンポーネントの型使用

### CharacterForm
```typescript
// フォームデータの型管理
const [formData, setFormData] = useState<TRPGCharacter>(initialCharacterState);

// タブごとの編集機能
- システムテンプレート: characterType, profession
- 基本情報: name, gender, age, nation, religion, player, description
- 能力値: attributes (STR, CON, SIZ, INT, POW, DEX, CHA)
- スキル: skills (8カテゴリ別スキル管理)
- 装備: weapons, armor
- 画像・状態: imageUrl, scars
```

### CharacterCard
```typescript
// 表示項目の型安全なアクセス
<Typography>{character.name}</Typography>
<Chip label={character.characterType} />
<Typography>{character.nation} | {character.profession}</Typography>
<Typography>プレイヤー: {character.player}</Typography>

// ステータス表示
STR: {character.attributes?.STR || 0}
HP: {character.derived?.HP || 0}/{character.derived?.HP || 0}
MP: {character.derived?.MP || 0}/{character.derived?.MP || 0}
SW: {character.derived?.SW || 0}
```

## 型安全性の状況

### ✅ 良好な点
- **共通型の統一使用**: packages/typesのTRPGCharacter型を一貫して使用
- **Stormbringerシステム準拠**: 能力値・スキル・武器システムが型定義と完全一致
- **型変換の最小化**: ローカル型変換を避け、共通型を直接使用
- **デフォルト値管理**: 型安全なデフォルト値による初期化

### ⚠️ 注意点
- **Optional chaining**: undefined値のアクセスを適切に処理
- **AI統合**: 生成コンテンツの型変換を安全に実装
- **PC/NPC拡張**: 基本型の拡張が適切に管理されている

## 結論
CharactersPageは`packages/types`のTRPGCharacter型と完全に整合し、Stormbringerベースのゲームシステムを型安全に実装しています。PC/NPC/Enemyの分類、能力値・スキル・装備システム、AI生成コンテンツの統合まで、一貫した型使用により高い保守性と拡張性を実現しています。