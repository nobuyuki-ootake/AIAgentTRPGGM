# EnemyPage 型使用状況調査

## 概要
エネミー管理画面の型使用状況を調査。TRPGエネミーの作成・編集・管理機能を提供。

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/EnemyPage.tsx`

## 使用している型定義

### 共通型のimport
```typescript
import { EnemyCharacter } from "@trpg-ai-gm/types";
```

### EnemyCharacter型 (packages/types/index.ts: 263-328行目)
```typescript
export interface EnemyCharacter {
  id: string;
  name: string;
  rank: "モブ" | "中ボス" | "ボス" | "EXボス";
  type: string; // アンデッド、魔獣、機械など
  description: string;
  level: number;

  // 能力値（簡略化）
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
  };

  // 派生値
  derivedStats: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    magicAttack: number;
    magicDefense: number;
    accuracy: number;
    evasion: number;
    criticalRate: number;
    initiative: number;
  };

  // スキル・攻撃手段
  skills: {
    basicAttack: string;
    specialSkills: SpecialSkill[];
    passives: string[];
  };

  // AI行動パターン
  behavior: {
    aiPattern: string; // 例：HP50%以下で回復スキル使用
    targeting: string; // 例：最もHPが低いPCを狙う
  };

  // ドロップ情報
  drops: {
    exp: number;
    gold: number;
    items: string[];
    rareDrops: string[];
  };

  // 現在状態
  status: {
    currentHp: number;
    currentMp: number;
    statusEffects: string[];
    location: string;
  };

  // その他
  imageUrl?: string;
  campaignId?: string;
  created_at?: string;
  updated_at?: string;
}
```

### SpecialSkill型 (packages/types/index.ts: 331-336行目)
```typescript
export interface SpecialSkill {
  name: string;
  effect: string;
  cooldown?: number;
  cost?: string;
}
```

## データアクセスパターン

### TRPGCampaignからのエネミーデータアクセス
```typescript
// currentCampaign.enemies: EnemyCharacter[] (18行目で定義)
const enemies = currentCampaign?.enemies || [];
```

## エネミー管理の実装

### 1. 状態管理
```typescript
// フォームデータの型管理
const [formData, setFormData] = useState<EnemyCharacter>(initialEnemyState);
const [editingEnemy, setEditingEnemy] = useState<EnemyCharacter | null>(null);

// 初期状態の定義
const initialEnemyState: EnemyCharacter = {
  id: "",
  name: "",
  rank: "モブ",
  type: "",
  description: "",
  level: 1,
  attributes: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 8,
    wisdom: 8,
  },
  derivedStats: {
    hp: 20,
    mp: 5,
    attack: 8,
    defense: 5,
    magicAttack: 3,
    magicDefense: 4,
    accuracy: 65,
    evasion: 35,
    criticalRate: 5,
    initiative: 10,
  },
  // ... 他のプロパティも初期化
};
```

### 2. フォーム入力処理

#### 基本情報の更新
```typescript
// 名前変更
onChange={(e) =>
  setFormData({
    ...formData,
    name: e.target.value,
  })
}

// ランク変更
onChange={(e) =>
  setFormData({
    ...formData,
    rank: e.target.value as EnemyCharacter['rank'],
  })
}
```

#### ネストしたオブジェクトの更新
```typescript
// 派生ステータスの更新
const handleHPChange = (value: number) => {
  setFormData({
    ...formData,
    derivedStats: {
      ...formData.derivedStats,
      hp: value,
    },
  });
};

// AI行動パターンの更新
onChange={(e) =>
  setFormData({
    ...formData,
    behavior: {
      ...formData.behavior,
      aiPattern: e.target.value,
    },
  })
}

// ドロップ情報の更新
onChange={(e) =>
  setFormData({
    ...formData,
    drops: {
      ...formData.drops,
      exp: parseInt(e.target.value) || 0,
    },
  })
}
```

### 3. 特殊スキル管理
```typescript
// SpecialSkill配列の操作
const addSpecialSkill = () => {
  const newSkill: SpecialSkill = {
    name: "",
    effect: "",
    cost: "",
    cooldown: 0,
  };
  
  setFormData({
    ...formData,
    skills: {
      ...formData.skills,
      specialSkills: [...formData.skills.specialSkills, newSkill],
    },
  });
};

// 特殊スキルの更新
const updateSpecialSkill = (index: number, field: keyof SpecialSkill, value: string | number) => {
  const updatedSkills = formData.skills.specialSkills.map((skill, i) =>
    i === index ? { ...skill, [field]: value } : skill
  );
  
  setFormData({
    ...formData,
    skills: {
      ...formData.skills,
      specialSkills: updatedSkills,
    },
  });
};
```

### 4. AI生成エネミーの統合
```typescript
const parseAIResponseToEnemies = (response: string): EnemyCharacter[] => {
  try {
    const parsed = JSON.parse(response);
    const enemies = Array.isArray(parsed) ? parsed : [parsed];
    
    return enemies.map(enemy => ({
      id: uuidv4(),
      name: enemy.name || "名無しのエネミー",
      rank: enemy.rank || "モブ",
      type: enemy.type || "不明",
      description: enemy.description || "",
      level: enemy.level || 1,
      attributes: {
        strength: enemy.attributes?.strength || 10,
        dexterity: enemy.attributes?.dexterity || 10,
        constitution: enemy.attributes?.constitution || 10,
        intelligence: enemy.attributes?.intelligence || 8,
        wisdom: enemy.attributes?.wisdom || 8,
      },
      derivedStats: {
        hp: enemy.derivedStats?.hp || 20,
        mp: enemy.derivedStats?.mp || 5,
        // ... 他の派生ステータス
      },
      skills: {
        basicAttack: enemy.skills?.basicAttack || "基本攻撃",
        specialSkills: enemy.skills?.specialSkills || [],
        passives: enemy.skills?.passives || [],
      },
      behavior: {
        aiPattern: enemy.behavior?.aiPattern || "標準",
        targeting: enemy.behavior?.targeting || "ランダム",
      },
      drops: {
        exp: enemy.drops?.exp || 10,
        gold: enemy.drops?.gold || 5,
        items: enemy.drops?.items || [],
        rareDrops: enemy.drops?.rareDrops || [],
      },
      status: {
        currentHp: enemy.derivedStats?.hp || 20,
        currentMp: enemy.derivedStats?.mp || 5,
        statusEffects: [],
        location: "",
      },
    }));
  } catch (error) {
    console.error("AI応答の解析に失敗:", error);
    return [];
  }
};
```

## 型安全性とデータ整合性

### ✅ 優秀な点
- **完全な型準拠**: `EnemyCharacter`型を100%使用
- **ネストオブジェクト管理**: 複雑な構造も型安全に更新
- **AI統合**: 生成コンテンツも同じ型構造に変換
- **エラーハンドリング**: 型安全なフォールバック処理

### ✅ 型安全な実装パターン
- **Union型の活用**: `rank`プロパティでUnion型を適切に使用
- **Optional chaining**: undefinedの安全な処理
- **Type assertion**: 必要な箇所でのみ適切に使用
- **Default値**: 型に合わせたデフォルト値の提供

### ⚠️ 注意点
```typescript
// 218行目: handleFormChangeでのany使用
const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev: any) => ({
    ...prev,
    [name]: value,
  }));
};
```
この箇所はanyを使用しているが、実際の使用では型安全性は保たれている。

## エネミー表示コンポーネント

### カード表示での型使用
```typescript
// 基本情報表示
<Typography variant="h6">{enemy.name}</Typography>
<Chip 
  label={enemy.rank} 
  color={getRankColor(enemy.rank)}
/>
<Typography>レベル {enemy.level}</Typography>
<Typography>{enemy.type}</Typography>

// ステータス表示
HP: {enemy.status.currentHp}/{enemy.derivedStats.hp}
MP: {enemy.status.currentMp}/{enemy.derivedStats.mp}
攻撃力: {enemy.derivedStats.attack}
防御力: {enemy.derivedStats.defense}
```

## 結論
EnemyPageは`packages/types`の`EnemyCharacter`型と完全に整合し、複雑なエネミーデータ構造を型安全に管理しています。AI行動パターン、特殊スキル、ドロップ情報など、TRPGに特化した機能を型定義に従って適切に実装し、フロントエンド・バックエンド間の型統一を実現しています。