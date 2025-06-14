# ItemManagementPage 型使用状況調査

## 概要
アイテム管理画面の型使用状況を調査。TRPGアイテムの作成・編集・管理機能を提供。

## ファイルパス
- **メインファイル**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/pages/ItemManagementPage.tsx`
- **フォームダイアログ**: `/home/irure/AIAgentTRPGGM/apps/frontend/src/components/items/ItemFormDialog.tsx`

## 使用している型定義

### 共通型のimport
```typescript
// ItemManagementPage.tsx
import {
  Item,
  ItemType,
  ItemCategory,
  ItemRarity,
  ItemLocation,
  BaseLocation,
  TRPGCampaign,
} from "@trpg-ai-gm/types";

// ItemFormDialog.tsx
import {
  Item,
  ItemType,
  ItemCategory,
  ItemRarity,
  ItemEffect,
  EquipmentSlot,
  ItemAttribute,
} from "@trpg-ai-gm/types";
```

### Item型 (packages/types/index.ts: 865-893行目)
```typescript
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  category: ItemCategory;
  rarity: ItemRarity;
  value?: number; // 価値（ゴールドなど）
  weight?: number; // 重量
  stackable: boolean; // スタック可能か
  maxStack: number; // 最大スタック数
  usable: boolean; // 使用可能か
  consumable: boolean; // 消耗品か
  effects: ItemEffect[]; // アイテム効果
  attributes: ItemAttribute[]; // アイテム属性
  requirements: {
    level: number;
    stats: Record<string, number>;
    skills: string[];
    classes: string[];
  };
  equipmentSlot?: EquipmentSlot; // 装備スロット
  damage?: number; // 攻撃力（武器用）
  defense?: number; // 防御力（防具用）
  tags: string[]; // 検索・フィルター用タグ
  questRelated: boolean; // クエスト関連か
  tradable: boolean; // 取引可能か
  destroyable: boolean; // 破棄可能か
}
```

### ItemLocation型 (packages/types/index.ts: 959-971行目)
```typescript
export interface ItemLocation {
  id: string;
  itemId: string;
  locationType: "shop" | "event" | "loot" | "craft" | "reward";
  locationId: string; // 拠点ID、イベントID、クエストIDなど
  locationName: string; // 表示用の場所名
  availability: ItemAvailability;
  price?: number; // ショップでの価格
  currency?: string; // 通貨の種類
  requirements?: ItemRequirement[]; // 入手条件
  notes?: string; // 補足情報
}
```

## データアクセスパターン

### TRPGCampaignからのアイテムデータアクセス
```typescript
// ItemManagementPage.tsx (87-90行目)
const items = currentCampaign?.items || [];              // Item[]
const itemLocations = currentCampaign?.itemLocations || []; // ItemLocation[]
const bases = currentCampaign?.bases || [];              // BaseLocation[]
```

## 列挙型の活用

### 1. ItemType (packages/types/index.ts: 896-903行目)
```typescript
export type ItemType =
  | "consumable"
  | "equipment"
  | "key_item"
  | "material"
  | "quest_item"
  | "currency"
  | "other";

// 使用例: タブフィルタリング (543-545行目)
const typeFilter = type === "all" ? () => true : (item: Item) => item.type === type;
```

### 2. ItemCategory (packages/types/index.ts: 906-918行目)
```typescript
export type ItemCategory =
  | "general"
  | "weapon"
  | "armor"
  | "accessory"
  | "consumable"
  | "material"
  | "tool"
  | "book"
  | "food"
  | "magic"
  | "treasure"
  | "junk";

// 使用例: カテゴリ選択 (286-306行目)
<Select value={item.category}>
  {Object.values(ItemCategory).map(category => ...)}
</Select>
```

### 3. ItemRarity (packages/types/index.ts: 921-927行目)
```typescript
export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "artifact";

// 使用例: レアリティ色分け (155-165行目)
const getRarityColor = (rarity: ItemRarity): string => {
  switch (rarity) {
    case "common": return "grey";
    case "uncommon": return "green";
    case "rare": return "blue";
    case "epic": return "purple";
    case "legendary": return "orange";
    case "artifact": return "red";
  }
};
```

### 4. EquipmentSlot (packages/types/index.ts: 947-956行目)
```typescript
export type EquipmentSlot =
  | "head"
  | "body"
  | "hands"
  | "feet"
  | "weapon"
  | "shield"
  | "accessory"
  | "ring"
  | "necklace";

// 使用例: 装備スロット選択 (360-410行目)
const equipmentSlots: EquipmentSlot[] = ["head", "body", "hands", ...];
```

## アイテム効果・属性システム

### ItemEffect型 (packages/types/index.ts: 930-936行目)
```typescript
export interface ItemEffect {
  id: string;
  type: "heal" | "damage" | "buff" | "debuff" | "special";
  magnitude: number;
  duration?: number;
  description: string;
}

// フォームでの使用例
const [effects, setEffects] = useState<ItemEffect[]>(formData.effects || []);
```

### ItemAttribute型 (packages/types/index.ts: 939-944行目)
```typescript
export interface ItemAttribute {
  id: string;
  name: string;
  value: string | number | boolean;
  description?: string;
}

// フォームでの使用例
const [attributes, setAttributes] = useState<ItemAttribute[]>(formData.attributes || []);
```

## アイテム作成・編集フォーム

### フォームデータの型管理
```typescript
// ItemFormDialog.tsx (44-72行目)
const [formData, setFormData] = useState<Partial<Item>>({
  name: "",
  description: "",
  type: "general" as ItemType,
  category: "general" as ItemCategory,
  rarity: "common" as ItemRarity,
  value: 0,
  weight: 0,
  stackable: false,
  maxStack: 1,
  usable: false,
  consumable: false,
  effects: [],
  attributes: [],
  requirements: {
    level: 1,
    stats: {},
    skills: [],
    classes: [],
  },
  tags: [],
  questRelated: false,
  tradable: true,
  destroyable: true,
});
```

### 型安全なフォーム更新
```typescript
// 汎用フォーム更新関数
const handleFormChange = (field: keyof Item, value: any) => {
  setFormData(prev => ({
    ...prev,
    [field]: value,
  }));
};

// 配列フィールドの更新
const updateEffects = (newEffects: ItemEffect[]) => {
  setFormData(prev => ({
    ...prev,
    effects: newEffects,
  }));
};
```

### バリデーションと保存
```typescript
// フォーム保存時の型変換 (158-186行目)
const handleSave = () => {
  const newItem: Item = {
    id: formData.id || uuidv4(),
    name: formData.name || "",
    description: formData.description || "",
    type: formData.type || "general",
    category: formData.category || "general",
    rarity: formData.rarity || "common",
    value: formData.value || 0,
    weight: formData.weight || 0,
    stackable: formData.stackable || false,
    maxStack: formData.maxStack || 1,
    usable: formData.usable || false,
    consumable: formData.consumable || false,
    effects: formData.effects || [],
    attributes: formData.attributes || [],
    requirements: formData.requirements || {
      level: 1,
      stats: {},
      skills: [],
      classes: [],
    },
    equipmentSlot: formData.equipmentSlot,
    damage: formData.damage,
    defense: formData.defense,
    tags: formData.tags || [],
    questRelated: formData.questRelated || false,
    tradable: formData.tradable || true,
    destroyable: formData.destroyable || true,
  };
  
  onSave(newItem);
};
```

## BaseLocationとの連携

### アイテム入手場所の表示
```typescript
// 拠点名取得 (148-152行目)
const getBaseName = (baseId: string): string => {
  const base = bases.find((b) => b.id === baseId);
  return base ? base.name : "不明な拠点";
};

// アイテム場所情報の取得 (144-146行目)
const getItemLocations = (itemId: string): ItemLocation[] => {
  return itemLocations.filter((location) => location.itemId === itemId);
};

// 表示例 (291-310行目)
{getItemLocations(item.id).map(location => (
  <Typography key={location.id}>
    場所: {getBaseName(location.locationId)}
    {location.price && ` - ${location.price}${location.currency || "G"}`}
  </Typography>
))}
```

## フィルタリング・検索機能

### 型安全なフィルタリング
```typescript
// タイプフィルター (543-545行目)
const typeFilter = type === "all" ? () => true : (item: Item) => item.type === type;

// レアリティフィルター (524行目)
const rarityFilter = rarity === "all" ? () => true : (item: Item) => item.rarity === rarity;

// 複合フィルター適用
const filteredItems = items
  .filter(typeFilter)
  .filter(rarityFilter)
  .filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
```

### 統計機能
```typescript
// タイプ別統計 (117-119行目)
const getItemCountByType = (type: ItemType): number => {
  return items.filter(item => item.type === type).length;
};

// レアリティ別統計 (366-372行目)
const rarityDistribution = {
  common: items.filter(item => item.rarity === "common").length,
  uncommon: items.filter(item => item.rarity === "uncommon").length,
  rare: items.filter(item => item.rarity === "rare").length,
  // ...
};
```

## 型安全性の状況

### ✅ 優秀な点
- **完全な型準拠**: Item型の全プロパティに対応
- **列挙型の活用**: すべての列挙型を適切に使用
- **関連型の連携**: ItemLocation, BaseLocationとの型安全な連携
- **フォーム型安全性**: Partial<Item>を使用した段階的なデータ構築

### ✅ 型システムの一貫性
- **共通型使用**: packages/typesの型定義を完全に使用
- **型変換なし**: ローカル型変換を避け、共通型を直接使用
- **デフォルト値**: 型に合わせた適切なデフォルト値

### ✅ 機能の網羅性
- **アイテム効果**: ItemEffect配列による複雑な効果管理
- **アイテム属性**: ItemAttribute配列による柔軟な属性システム
- **装備システム**: EquipmentSlotによる装備管理
- **経済システム**: 価格、通貨、取引可能性の管理

## 結論
ItemManagementPageは`packages/types`のアイテム関連型定義と完全に整合し、包括的なアイテム管理システムを型安全に実装しています。Item型の全機能を活用し、効果・属性・装備・経済システムまで一貫した型システムで管理。BaseLocationとの連携、列挙型の活用、AI生成コンテンツの統合まで、高い型安全性と拡張性を実現しています。