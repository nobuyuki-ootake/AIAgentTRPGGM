# AI PC会話システム実装報告

## 🎯 実装目的
ユーザーフィードバック対応:
- 「一人で遊んでいる感覚」の解消
- AI PCからの協調的働きかけ強化
- システムアナウンス後の最適タイミングでの会話挿入

## ✅ 実装内容

### 1. AI PC会話生成関数
**ファイル**: `apps/frontend/src/hooks/useTRPGSessionUI.ts:2093`

```typescript
const generateAIPCDialogue = useCallback(async (context: string) => {
  const otherPCs = playerCharacters.filter(pc => pc.id !== selectedCharacter?.id);
  if (otherPCs.length === 0) return;

  const dialogues = [];
  
  // エルフィンの会話パターン
  const elfin = otherPCs.find(pc => pc.name.includes("エルフィン"));
  if (elfin) {
    const elfinDialogues = [
      "アレックス、どうする？私は周りを警戒してるよ",
      "この場所、何か気になるね。慎重に行こう",
      "一緒に行動した方が安全だと思うな",
      "私の弓で援護するから、安心して進んで"
    ];
    dialogues.push({
      character: elfin,
      message: elfinDialogues[Math.floor(Math.random() * elfinDialogues.length)]
    });
  }

  // ライナの会話パターン  
  const lina = otherPCs.find(pc => pc.name.includes("ライナ"));
  if (lina) {
    const linaDialogues = [
      "情報収集は任せて。何か見つけたら教えるよ",
      "装備の準備はできてる？一緒に確認しようか",
      "この辺りの噂、聞いたことがあるんだ",
      "連携して進めば、きっと大丈夫"
    ];
    dialogues.push({
      character: lina,
      message: linaDialogues[Math.floor(Math.random() * linaDialogues.length)]
    });
  }

  // AI PC会話を順次表示（2秒間隔）
  for (let i = 0; i < dialogues.length; i++) {
    const dialogue = dialogues[i];
    setTimeout(() => {
      const aiPCMessage: ChatMessage = {
        id: uuidv4(),
        sender: dialogue.character.name,
        senderType: "ai_pc",
        message: `💬 ${dialogue.message}`,
        timestamp: new Date(),
      };

      setUIState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, aiPCMessage],
      }));
    }, (i + 1) * 2000);
  }
}, [playerCharacters, selectedCharacter]);
```

### 2. 最適タイミング会話システム
**ファイル**: `apps/frontend/src/hooks/useTRPGSessionUI.ts:2200-2203`

```typescript
// 🎯 NEW: システムメッセージ後にAI PC会話を生成
setTimeout(() => {
  generateAIPCDialogue(currentLocation);
}, 1000);
```

**設計意図**:
- システム：「行動可能。右パネルから行動を選択！」
- ⏳ 1秒遅延
- エルフィン：「💬 アレックス、どうする？私は周りを警戒してるよ」
- ⏳ 2秒遅延  
- ライナ：「💬 情報収集は任せて。何か見つけたら教えるよ」
- ユーザー行動選択

### 3. 新しいメッセージタイプ対応
**ファイル**: `apps/frontend/src/components/trpg-session/ChatInterface.tsx:29`

```typescript
export interface ChatMessage {
  id: string;
  sender: string;
  senderType: "player" | "gm" | "system" | "ai_pc"; // ← NEW!
  message: string;
  timestamp: Date;
  diceRoll?: DiceRoll;
}
```

## 🎭 キャラクター別個性設計

### エルフィンの特徴
- **役割**: 警戒・安全確保担当
- **性格**: 慎重で仲間思い、弓使いとしての自信
- **会話パターン**: 
  - 周囲への警戒を伝える
  - 安全な行動を提案
  - 援護を申し出る

### ライナの特徴  
- **役割**: 情報収集・装備管理担当
- **性格**: 頼れる仲間、準備万端タイプ
- **会話パターン**:
  - 情報収集を請け負う
  - 装備チェックを提案
  - 連携行動を推奨

## 📊 期待される改善効果

### Before (改善前)
```
システム: 行動可能。右パネルから行動を選択！
[空白の時間 - ユーザーが迷う]
ユーザー: 行動選択
```

### After (改善後)  
```
システム: 行動可能。右パネルから行動を選択！
エルフィン: 💬 アレックス、どうする？私は周りを警戒してるよ
ライナ: 💬 情報収集は任せて。何か見つけたら教えるよ
[自然な相談感でユーザーが行動選択]
ユーザー: 行動選択
```

## 🎯 解決される問題

1. **「一人でプレイしている感」の解消**
   - AI PCからの積極的な話しかけ
   - パーティーメンバーとしての協調感

2. **行動選択時の迷いの軽減**
   - キャラクターからの意見・提案
   - 自然な相談タイムの演出

3. **パーティー一体感の向上**
   - 各キャラクターの個性表現
   - 連携行動の提案

## 🔧 技術的特徴

- **非同期処理**: API負荷を避けてランダム会話パターンを使用
- **キャラクター識別**: 名前による動的キャラクター検出
- **タイミング制御**: setTimeout で自然な会話間隔を実現
- **状態管理**: Recoil による一貫したUI状態更新

## 📋 今後の拡張可能性

1. **コンテキスト連動会話**
   - 現在地に応じた会話内容
   - 直前の行動結果への反応

2. **感情状態システム**
   - キャラクターのHP/状態による会話変化
   - ピンチ時の励まし、成功時の称賛

3. **プレイヤー名呼びかけ**
   - 選択キャラクター名を動的に取得
   - より個人的な呼びかけ

4. **会話頻度調整**
   - ユーザー設定による会話量制御
   - 重要場面でのみ発言するモード

## 🎮 テスト推奨手順

1. キャラクター選択（アレックス推奨）
2. セッション開始ボタンクリック
3. システムメッセージ後の1-3秒を観察
4. エルフィンとライナの順次会話を確認
5. 会話内容の個性とタイミングを評価

## 📈 成功指標

- ✅ システムメッセージ後1秒でAI PC会話開始
- ✅ 2秒間隔での複数キャラクター発言
- ✅ キャラクター個性に基づいた会話内容
- ✅ 「💬」アイコンによる視覚的識別
- ✅ パーティー相談感の演出

---

**実装完了日**: 2025-06-12  
**対応Issue**: AI GM存在感不足・一人プレイ感覚の改善  
**影響範囲**: TRPGセッションUI体験全体