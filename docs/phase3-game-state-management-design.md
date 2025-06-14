# Phase 3: ゲーム状態変更システム設計書

## 📋 概要

Phase 2で実装した構造化行動結果システムにより、AIから「HP+5」「MP-10」「金貨-50」などのゲーム効果を受け取ることができるようになった。Phase 3では、これらの効果を実際のキャラクターステータスに反映する機能を実装する。

## 🎯 目的

- プレイヤーの行動結果が実際のゲーム状態に反映される
- TRPGの核心体験である「行動→結果→状態変化」のサイクルを完成
- AI GMが生成した効果を実際のキャラクターデータに適用

## 📊 現在の状況

### ✅ 実装済み
- 構造化行動結果システム（Phase 2）
- AI GMからのゲーム効果受信
- チャットメッセージとしての効果表示
- キャラクター型定義（`currentHP`, `currentMP`）

### ❌ 未実装（Phase 3で対応）
- 実際のキャラクターステータス更新
- 所持金管理
- インベントリ管理
- キャンペーンフラグ管理

## 🏗️ アーキテクチャ設計

### データフロー
```
プレイヤー行動 → AI GM → 構造化レスポンス → applyGameEffects → キャラクターデータ更新 → UI反映
```

### 状態管理
- **キャラクターデータ**: `currentCampaign.characters`（Recoil state）
- **更新方法**: `setCurrentCampaign`を使用してimmutableな更新
- **永続化**: 既存のキャンペーン保存システムを活用

## 🔧 実装設計

### Phase 3a: HP/MP管理システム

#### 1. 基本更新関数
```typescript
// キャラクターステータス汎用更新関数
const updateCharacterStatus = useCallback((
  characterId: string, 
  updates: Partial<PlayerCharacter>
) => {
  setCurrentCampaign(prev => {
    if (!prev) return prev;
    
    return {
      ...prev,
      characters: prev.characters?.map(char => 
        char.id === characterId 
          ? { ...char, ...updates }
          : char
      )
    };
  });
}, [setCurrentCampaign]);
```

#### 2. HP管理関数
```typescript
const updateCharacterHP = useCallback((characterId: string, change: number) => {
  const character = playerCharacters.find(c => c.id === characterId);
  if (!character) return;
  
  const currentHP = character.currentHP ?? character.derived.HP;
  const maxHP = character.derived.HP;
  const newHP = Math.max(0, Math.min(maxHP, currentHP + change));
  
  updateCharacterStatus(characterId, { currentHP: newHP });
}, [playerCharacters, updateCharacterStatus]);
```

#### 3. MP管理関数
```typescript
const updateCharacterMP = useCallback((characterId: string, change: number) => {
  const character = playerCharacters.find(c => c.id === characterId);
  if (!character) return;
  
  const currentMP = character.currentMP ?? character.derived.MP;
  const maxMP = character.derived.MP;
  const newMP = Math.max(0, Math.min(maxMP, currentMP + change));
  
  updateCharacterStatus(characterId, { currentMP: newMP });
}, [playerCharacters, updateCharacterStatus]);
```

#### 4. applyGameEffects関数の修正
```typescript
const applyGameEffects = useCallback(async (
  gameEffects: EventResult[],
  targetCharacter: any
): Promise<void> => {
  for (const effect of gameEffects) {
    try {
      console.log("🎲 ゲーム効果適用:", effect);

      switch (effect.type) {
        case "hp_change":
          if (effect.value && effect.characterId) {
            // 🎯 実際のHP更新
            updateCharacterHP(effect.characterId, effect.value);
            
            // メッセージ表示
            const effectMessage: ChatMessage = {
              id: uuidv4(),
              sender: "システム",
              senderType: "system",
              message: `💗 ${targetCharacter.name}のHP: ${effect.value > 0 ? '+' : ''}${effect.value} (${effect.description})`,
              timestamp: new Date(),
            };
            
            setUIState(prev => ({
              ...prev,
              chatMessages: [...prev.chatMessages, effectMessage],
            }));
          }
          break;

        case "mp_change":
          if (effect.value && effect.characterId) {
            // 🎯 実際のMP更新
            updateCharacterMP(effect.characterId, effect.value);
            
            // メッセージ表示
            const effectMessage: ChatMessage = {
              id: uuidv4(),
              sender: "システム",
              senderType: "system",
              message: `🔮 ${targetCharacter.name}のMP: ${effect.value > 0 ? '+' : ''}${effect.value} (${effect.description})`,
              timestamp: new Date(),
            };
            
            setUIState(prev => ({
              ...prev,
              chatMessages: [...prev.chatMessages, effectMessage],
            }));
          }
          break;

        // 他のケースも同様に実装
      }
    } catch (effectError) {
      console.error("ゲーム効果適用エラー:", effectError);
    }
  }
}, [updateCharacterHP, updateCharacterMP]);
```

### Phase 3b: 所持金管理システム

#### 型定義の拡張
```typescript
// キャンペーンレベルでの資金管理
export interface TRPGCampaign {
  // ... 既存フィールド
  partyGold?: number; // パーティ共通の所持金
}
```

#### 実装
```typescript
const updatePartyGold = useCallback((change: number) => {
  setCurrentCampaign(prev => {
    if (!prev) return prev;
    
    const currentGold = prev.partyGold ?? 500; // デフォルト500G
    const newGold = Math.max(0, currentGold + change);
    
    return {
      ...prev,
      partyGold: newGold
    };
  });
}, [setCurrentCampaign]);
```

### Phase 3c: インベントリ管理システム

#### 型定義の拡張
```typescript
export interface TRPGCampaign {
  // ... 既存フィールド
  partyInventory?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category: "weapon" | "armor" | "consumable" | "treasure" | "misc";
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
}
```

#### 実装
```typescript
const addInventoryItem = useCallback((item: Omit<InventoryItem, "id">) => {
  setCurrentCampaign(prev => {
    if (!prev) return prev;
    
    const inventory = prev.partyInventory ?? [];
    const existingItem = inventory.find(i => i.name === item.name);
    
    if (existingItem) {
      // 既存アイテムの数量を増加
      return {
        ...prev,
        partyInventory: inventory.map(i =>
          i.name === item.name
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      };
    } else {
      // 新しいアイテムを追加
      return {
        ...prev,
        partyInventory: [
          ...inventory,
          { ...item, id: uuidv4() }
        ]
      };
    }
  });
}, [setCurrentCampaign]);
```

## 📋 実装タスク一覧

### Phase 3a: HP/MP管理（優先度: 最高）
- [ ] `updateCharacterStatus`関数の実装
- [ ] `updateCharacterHP`関数の実装
- [ ] `updateCharacterMP`関数の実装
- [ ] `applyGameEffects`関数の修正（hp_change, mp_change対応）
- [ ] テスト実行とデバッグ

### Phase 3b: 所持金管理（優先度: 高）
- [ ] `TRPGCampaign`型定義の拡張（`partyGold`）
- [ ] `updatePartyGold`関数の実装
- [ ] `applyGameEffects`関数の修正（gold_change対応）
- [ ] UI表示の更新

### Phase 3c: インベントリ管理（優先度: 中）
- [ ] `InventoryItem`型定義の実装
- [ ] `TRPGCampaign`型定義の拡張（`partyInventory`）
- [ ] `addInventoryItem`関数の実装
- [ ] `removeInventoryItem`関数の実装
- [ ] `applyGameEffects`関数の修正（item_gained対応）

### Phase 3d: キャンペーンフラグ管理（優先度: 中）
- [ ] `TRPGCampaign`型定義の拡張（`campaignFlags`）
- [ ] `setCampaignFlag`関数の実装
- [ ] `applyGameEffects`関数の修正（flag_set対応）

## 🧪 テスト戦略

### 単体テスト
- `updateCharacterHP`関数の境界値テスト（0以下、最大値以上）
- `updateCharacterMP`関数の境界値テスト
- `updatePartyGold`関数の負の値テスト

### 統合テスト
- 行動選択 → AI応答 → ゲーム効果適用 → UI更新の一連のフロー
- 複数の効果が同時に適用される場合のテスト
- セッション保存・読み込み時の状態保持テスト

### UI テスト
- HPバーの更新確認
- ステータス表示の即座反映
- エラー時の適切な表示

## 📈 期待される成果

### 実装後の動作例
1. プレイヤーが「宿屋で休息する」を選択
2. AI GMが「HP+10, MP+5, 金貨-20」の効果を生成
3. アレックスのHPが30/40 → 40/40に更新
4. アレックスのMPが15/20 → 20/20に更新
5. パーティの所持金が500G → 480Gに更新
6. UI上のHPバー、ステータス表示が即座に更新

### ユーザー体験の向上
- 行動の結果が目に見える形で反映される
- TRPGらしい「リソース管理」の体験
- AI GMの効果が実際のゲーム進行に影響

## 🔄 今後の拡張可能性

- 状態異常管理（毒、麻痺など）
- 経験値とレベルアップシステム
- 装備品管理と能力値への影響
- パーティメンバー間でのアイテム譲渡
- 時間経過による自動回復

---

**作成日**: 2025年6月12日  
**最終更新**: 2025年6月12日  
**ステータス**: Phase 3a実装準備完了