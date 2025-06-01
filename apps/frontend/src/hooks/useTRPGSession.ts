import { useState, useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState, sessionStateAtom } from "../store/atoms";
import { TRPGCharacter, EnemyCharacter, NPCCharacter, BaseLocation, GameSession } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

// セッション用の追加型定義
export interface SessionAction {
  id: string;
  type: "move" | "shop" | "talk" | "interact" | "skill" | "custom";
  label: string;
  description: string;
  requiresTarget?: boolean;
  targetType?: "location" | "npc" | "character" | "item";
}

export interface SessionMessage {
  id: string;
  sender: string;
  senderType: "player" | "gm" | "system";
  message: string;
  timestamp: Date;
  actionType?: string;
}

export interface DiceRollResult {
  dice: string;
  rolls: number[];
  total: number;
  purpose: string;
}

export const useTRPGSession = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [sessionState, setSessionState] = useRecoilState(sessionStateAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // セッション状態管理
  const [currentDay, setCurrentDay] = useState(1);
  const [actionCount, setActionCount] = useState(0);
  const [maxActionsPerDay] = useState(5);
  const [currentLocation, setCurrentLocation] = useState<string>("街の中心");
  const [selectedCharacter, setSelectedCharacter] = useState<TRPGCharacter | null>(null);
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [combatMode, setCombatMode] = useState(false);
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>([]);

  // データ取得
  const playerCharacters = currentCampaign?.characters?.filter(c => c.characterType === "PC") || [];
  const npcs = currentCampaign?.npcs || [];
  const enemies = currentCampaign?.enemies || [];
  const bases = currentCampaign?.bases || [];

  // 現在の拠点を取得
  const getCurrentBase = useCallback((): BaseLocation | undefined => {
    return bases.find(base => base.name === currentLocation);
  }, [bases, currentLocation]);

  // セッション初期化
  const initializeSession = useCallback(() => {
    if (!currentCampaign) return;

    const newSession: GameSession = {
      id: uuidv4(),
      sessionNumber: (currentCampaign.sessions?.length || 0) + 1,
      title: `セッション ${(currentCampaign.sessions?.length || 0) + 1}`,
      date: new Date(),
      duration: 0,
      attendees: playerCharacters.map(pc => pc.id),
      gamemaster: currentCampaign.gamemaster,
      content: [],
      events: [],
      combats: [],
      questsAdvanced: [],
      questsCompleted: [],
      experienceAwarded: 0,
      status: "inProgress",
    };

    setSessionState(newSession);

    // 導入メッセージを追加
    const introMessage: SessionMessage = {
      id: uuidv4(),
      sender: "ゲームマスター",
      senderType: "gm",
      message: `キャンペーン「${currentCampaign.title}」のセッションを開始します。`,
      timestamp: new Date(),
    };

    setSessionMessages([introMessage]);
  }, [currentCampaign, playerCharacters, setSessionState]);

  // 利用可能な行動を取得
  const getAvailableActions = useCallback((): SessionAction[] => {
    const baseActions: SessionAction[] = [
      {
        id: "move",
        type: "move",
        label: "移動",
        description: "他の場所へ移動する",
        requiresTarget: true,
        targetType: "location",
      },
      {
        id: "talk",
        type: "talk",
        label: "NPC会話",
        description: "NPCと会話する",
        requiresTarget: true,
        targetType: "npc",
      },
      {
        id: "interact",
        type: "interact",
        label: "キャラクター交流",
        description: "他のキャラクターと交流する",
        requiresTarget: true,
        targetType: "character",
      },
    ];

    const currentBase = getCurrentBase();
    if (currentBase) {
      // 拠点の施設に応じて行動を追加
      if (currentBase.facilities.shops && currentBase.facilities.shops.length > 0) {
        baseActions.push({
          id: "shop",
          type: "shop",
          label: "買い物",
          description: "アイテムを購入する",
        });
      }

      if (currentBase.facilities.inn) {
        baseActions.push({
          id: "rest",
          type: "custom",
          label: "休息",
          description: "宿屋で休息する",
        });
      }

      if (currentBase.facilities.temple) {
        baseActions.push({
          id: "prayer",
          type: "custom",
          label: "祈祷",
          description: "神殿で祈りを捧げる",
        });
      }
    }

    // 戦闘中の場合の行動
    if (combatMode) {
      baseActions.push(
        {
          id: "attack",
          type: "custom",
          label: "攻撃",
          description: "敵を攻撃する",
          requiresTarget: true,
          targetType: "character",
        },
        {
          id: "defend",
          type: "custom",
          label: "防御",
          description: "防御態勢を取る",
        },
        {
          id: "skill",
          type: "skill",
          label: "スキル使用",
          description: "特殊スキルを使用する",
        }
      );
    }

    return baseActions;
  }, [getCurrentBase, combatMode]);

  // 行動実行
  const executeAction = useCallback(async (action: SessionAction, target?: any) => {
    if (!selectedCharacter) {
      setError("キャラクターが選択されていません");
      return false;
    }

    if (actionCount >= maxActionsPerDay) {
      setError("今日の行動回数が上限に達しました");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      let resultMessage: string;

      switch (action.type) {
        case "move":
          if (target && typeof target === "string") {
            setCurrentLocation(target);
            resultMessage = `${selectedCharacter.name}は${target}に移動しました。`;
          } else {
            resultMessage = `${selectedCharacter.name}は移動しました。`;
          }
          break;

        case "shop":
          resultMessage = `${selectedCharacter.name}は店で買い物をしました。`;
          break;

        case "talk":
          if (target && typeof target === "object" && target.name) {
            resultMessage = `${selectedCharacter.name}は${target.name}と会話しました。`;
          } else {
            resultMessage = `${selectedCharacter.name}はNPCと会話しました。`;
          }
          break;

        case "interact":
          if (target && typeof target === "object" && target.name) {
            resultMessage = `${selectedCharacter.name}は${target.name}と交流しました。`;
          } else {
            resultMessage = `${selectedCharacter.name}は他のキャラクターと交流しました。`;
          }
          break;

        case "skill":
          resultMessage = `${selectedCharacter.name}はスキルを使用しました。`;
          break;

        case "custom":
          resultMessage = `${selectedCharacter.name}は${action.label}を実行しました。`;
          break;

        default:
          resultMessage = `${selectedCharacter.name}は${action.label}を実行しました。`;
      }

      // メッセージを追加
      const actionMessage: SessionMessage = {
        id: uuidv4(),
        sender: selectedCharacter.name,
        senderType: "player",
        message: resultMessage,
        timestamp: new Date(),
        actionType: action.type,
      };

      setSessionMessages(prev => [...prev, actionMessage]);
      setActionCount(prev => prev + 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "行動の実行に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedCharacter, actionCount, maxActionsPerDay]);

  // 日程進行
  const advanceDay = useCallback(() => {
    setCurrentDay(prev => prev + 1);
    setActionCount(0);

    const dayMessage: SessionMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message: `--- ${currentDay + 1}日目の朝 ---`,
      timestamp: new Date(),
    };

    setSessionMessages(prev => [...prev, dayMessage]);

    // 日付に応じたイベントチェック
    const dailyEvents = currentCampaign?.plot?.filter(q => 
      q.sessionId && parseInt(q.sessionId) === currentDay + 1
    ) || [];

    if (dailyEvents.length > 0) {
      dailyEvents.forEach(event => {
        const eventMessage: SessionMessage = {
          id: uuidv4(),
          sender: "ゲームマスター",
          senderType: "gm",
          message: `イベント「${event.title}」が発生しました: ${event.description}`,
          timestamp: new Date(),
        };
        setSessionMessages(prev => [...prev, eventMessage]);
      });
    }
  }, [currentDay, currentCampaign]);

  // ダイスロール実行
  const rollDice = useCallback((dice: string, purpose: string): DiceRollResult => {
    // 簡単なダイスロール実装（実際にはより複雑なパーサーが必要）
    const diceMatch = dice.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
    if (!diceMatch) {
      throw new Error("無効なダイス表記です");
    }

    const count = parseInt(diceMatch[1]);
    const sides = parseInt(diceMatch[2]);
    const modifier = parseInt(diceMatch[3] || "0");

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    const result: DiceRollResult = {
      dice,
      rolls,
      total,
      purpose,
    };

    // ダイスロール結果をメッセージに追加
    const diceMessage: SessionMessage = {
      id: uuidv4(),
      sender: selectedCharacter?.name || "システム",
      senderType: "system",
      message: `${purpose}: ${dice} = [${rolls.join(", ")}] + ${modifier} = ${total}`,
      timestamp: new Date(),
    };

    setSessionMessages(prev => [...prev, diceMessage]);

    return result;
  }, [selectedCharacter]);

  // 戦闘開始
  const startCombat = useCallback((enemyIds: string[]) => {
    setCombatMode(true);

    // イニシアティブ順序を決定（簡単な実装）
    const participants = [
      ...playerCharacters.map(pc => ({ id: pc.id, name: pc.name, initiative: pc.derived.SW })),
      ...enemies
        .filter(enemy => enemyIds.includes(enemy.id))
        .map(enemy => ({ id: enemy.id, name: enemy.name, initiative: enemy.derivedStats.initiative }))
    ];

    participants.sort((a, b) => b.initiative - a.initiative);
    setInitiativeOrder(participants.map(p => p.id));

    const combatMessage: SessionMessage = {
      id: uuidv4(),
      sender: "ゲームマスター",
      senderType: "gm",
      message: "戦闘が開始されました！",
      timestamp: new Date(),
    };

    setSessionMessages(prev => [...prev, combatMessage]);
  }, [playerCharacters, enemies]);

  // 戦闘終了
  const endCombat = useCallback(() => {
    setCombatMode(false);
    setInitiativeOrder([]);

    const endMessage: SessionMessage = {
      id: uuidv4(),
      sender: "ゲームマスター",
      senderType: "gm",
      message: "戦闘が終了しました。",
      timestamp: new Date(),
    };

    setSessionMessages(prev => [...prev, endMessage]);
  }, []);

  // メッセージ追加
  const addMessage = useCallback((sender: string, senderType: SessionMessage["senderType"], message: string) => {
    const newMessage: SessionMessage = {
      id: uuidv4(),
      sender,
      senderType,
      message,
      timestamp: new Date(),
    };

    setSessionMessages(prev => [...prev, newMessage]);
  }, []);

  // セッション保存
  const saveSession = useCallback(async () => {
    if (!sessionState || !currentCampaign) return false;

    setIsLoading(true);
    setError(null);

    try {
      const updatedSession: GameSession = {
        ...sessionState,
        duration: Date.now() - sessionState.date.getTime(),
        status: "completed",
      };

      const updatedCampaign = {
        ...currentCampaign,
        sessions: currentCampaign.sessions 
          ? currentCampaign.sessions.map(s => s.id === updatedSession.id ? updatedSession : s)
          : [updatedSession],
      };

      setCurrentCampaign(updatedCampaign);
      setSessionState(updatedSession);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "セッションの保存に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionState, currentCampaign, setCurrentCampaign, setSessionState]);

  // 初期化時の処理
  useEffect(() => {
    if (currentCampaign && !sessionState) {
      initializeSession();
    }
  }, [currentCampaign, sessionState, initializeSession]);

  return {
    // セッション状態
    sessionState,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    selectedCharacter,
    sessionMessages,
    combatMode,
    initiativeOrder,
    isLoading,
    error,

    // データ
    playerCharacters,
    npcs,
    enemies,
    bases,

    // アクション
    setSelectedCharacter,
    setCurrentLocation,
    getAvailableActions,
    executeAction,
    advanceDay,
    rollDice,
    startCombat,
    endCombat,
    addMessage,
    saveSession,
    initializeSession,

    // ヘルパー
    getCurrentBase,
  };
};