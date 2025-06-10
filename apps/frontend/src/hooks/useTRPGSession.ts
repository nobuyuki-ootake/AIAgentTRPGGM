import { useState, useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState, sessionStateAtom } from "../store/atoms";
import { TRPGCharacter, NPCCharacter, BaseLocation, GameSession, EnemyCharacter } from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";
import { trpgEncounterDetection, EncounterInfo, EncounterContext } from "../utils/TRPGEncounterDetection";
import { aiTacticalEngine, TacticalDecision } from "../utils/AITacticalEngine";

// セッション用の追加型定義
export interface SessionAction {
  id: string;
  type: "move" | "shop" | "talk" | "interact" | "skill" | "custom" | "attack";
  label: string;
  description: string;
  requiresTarget?: boolean;
  targetType?: "location" | "npc" | "character" | "item" | "enemy";
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
  modifier?: number;
}

export interface AIControlledDiceRequest {
  dice: string;
  reason: string;
  difficulty?: number;
  characterId?: string;
  skillName?: string;
  tacticalDecision?: TacticalDecision;
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
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<TRPGCharacter | null>(null);
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([]);
  const [combatMode, setCombatMode] = useState(false);
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>([]);
  const [pendingEncounters, setPendingEncounters] = useState<EncounterInfo[]>([]);
  const [aiDiceRequest, setAiDiceRequest] = useState<AIControlledDiceRequest | null>(null);
  const [partyStatus, setPartyStatus] = useState({ averageHP: 100, resources: 100, morale: 100 });

  // データ取得
  const playerCharacters = currentCampaign?.characters?.filter(c => c.characterType === "PC") || [];
  const npcs = currentCampaign?.npcs || [];
  const enemies = currentCampaign?.enemies || [];
  const bases = currentCampaign?.bases || [];

  // 現在地の初期化（基地データが読み込まれた時）
  useEffect(() => {
    if (bases.length > 0 && !currentLocation) {
      const firstBase = bases[0];
      setCurrentLocation(firstBase.name);
      console.log('[TRPGSession] 現在地を初期化しました:', firstBase.name);
    }
  }, [bases, currentLocation]);

  // 現在の拠点を取得
  const getCurrentBase = useCallback((): BaseLocation | undefined => {
    return bases.find(base => base.name === currentLocation);
  }, [bases, currentLocation]);

  // セッション初期化
  const initializeSession = useCallback(() => {
    if (!currentCampaign) return;

    const newSession: GameSession = {
      id: uuidv4(),
      campaignId: currentCampaign.id,
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
      currentState: {
        day: 1,
        weather: "clear",
        locationId: currentLocation?.id || "",
        partyStatus: "active",
      },
      spatialTracking: {
        partyLocation: currentLocation?.id || "",
        visitedLocations: [],
        travelHistory: [],
      },
      encounterHistory: [],
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

    // 敵がいる場合は攻撃アクションを追加
    if (enemies.length > 0) {
      baseActions.push({
        id: "attack",
        type: "attack",
        label: "攻撃",
        description: "敵を攻撃する",
        requiresTarget: true,
        targetType: "enemy",
      });
    }

    // 戦闘中の場合の追加行動
    if (combatMode) {
      baseActions.push(
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
  }, [getCurrentBase, combatMode, enemies.length]);

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
  const rollDice = useCallback(async (dice: string, purpose?: string): Promise<DiceRollResult & { modifier: number }> => {
    // 簡単なダイスロール実装（実際にはより複雑なパーサーが必要）
    const diceMatch = dice.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!diceMatch) {
      throw new Error("無効なダイス表記です");
    }

    const count = parseInt(diceMatch[1] || "1");
    const sides = parseInt(diceMatch[2]);
    const modifier = parseInt(diceMatch[3] || "0");

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    const result = {
      dice,
      rolls,
      total,
      modifier,
      purpose: purpose || "ダイスロール",
    };

    // ダイスロール結果をメッセージに追加
    if (purpose) {
      const diceMessage: SessionMessage = {
        id: uuidv4(),
        sender: selectedCharacter?.name || "システム",
        senderType: "system",
        message: `${purpose}: ${dice} = [${rolls.join(", ")}] + ${modifier} = ${total}`,
        timestamp: new Date(),
      };

      setSessionMessages(prev => [...prev, diceMessage]);
    }

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

  // 遭遇チェック - 場所変更や時間経過時に呼び出す
  const checkForEncounters = useCallback(() => {
    if (!currentCampaign || !currentLocation) return;

    const currentBase = bases.find(b => b.name === currentLocation);
    if (!currentBase) return;

    // 現在の時間帯を判定
    const timeOfDay = actionCount < 2 ? 'morning' : 
                      actionCount < 3 ? 'afternoon' : 
                      actionCount < 4 ? 'evening' : 'night';

    const encounterContext: EncounterContext = {
      location: currentBase,
      time: { day: currentDay, timeOfDay },
      playerCharacters,
      npcs,
      enemies,
      events: currentCampaign.timeline || [],
    };

    const { encounters, immediateAction } = trpgEncounterDetection.detectEncounters(encounterContext);

    if (encounters.length > 0) {
      setPendingEncounters(encounters);

      // 最優先の遭遇を処理
      if (immediateAction) {
        const aiRequest: AIControlledDiceRequest = {
          dice: immediateAction.requiredCheck.dice,
          reason: immediateAction.requiredCheck.reason,
          difficulty: immediateAction.requiredCheck.difficulty,
          skillName: immediateAction.requiredCheck.skillName,
          tacticalDecision: {
            action: encounters[0].type === 'combat' ? 'combat' : 
                   encounters[0].type === 'trap' ? 'trap' : 'dialogue',
            priority: encounters[0].priority === 'high' ? 'critical' : 'medium',
            consequences: {
              success: immediateAction.possibleOutcomes.success,
              failure: immediateAction.possibleOutcomes.failure,
            },
          },
        };

        setAiDiceRequest(aiRequest);

        // GMメッセージ追加
        addMessage(
          "ゲームマスター",
          "gm",
          immediateAction.tacticalAdvice || `${immediateAction.encounterType}が発生しました！`
        );
      }
    }
  }, [currentCampaign, currentLocation, currentDay, actionCount, playerCharacters, npcs, enemies, bases, addMessage]);

  // パーティーステータス更新
  const updatePartyStatus = useCallback((modifiers: {
    hpModifier?: number;
    resourcesModifier?: number;
    moraleModifier?: number;
  }) => {
    setPartyStatus(prev => {
      const newStatus = {
        averageHP: Math.max(0, Math.min(100, prev.averageHP + (modifiers.hpModifier || 0))),
        resources: Math.max(0, Math.min(100, prev.resources + (modifiers.resourcesModifier || 0))),
        morale: Math.max(0, Math.min(100, prev.morale + (modifiers.moraleModifier || 0))),
      };

      // ステータス変化をメッセージで通知
      const changes: string[] = [];
      if (modifiers.hpModifier) {
        changes.push(`HP: ${modifiers.hpModifier > 0 ? '+' : ''}${modifiers.hpModifier}`);
      }
      if (modifiers.resourcesModifier) {
        changes.push(`資源: ${modifiers.resourcesModifier > 0 ? '+' : ''}${modifiers.resourcesModifier}`);
      }
      if (modifiers.moraleModifier) {
        changes.push(`士気: ${modifiers.moraleModifier > 0 ? '+' : ''}${modifiers.moraleModifier}`);
      }

      if (changes.length > 0) {
        addMessage(
          "システム",
          "system",
          `パーティーステータス変化: ${changes.join(', ')}`
        );
      }

      return newStatus;
    });
  }, [addMessage]);

  // AI戦術判断に基づくダイスリクエスト処理
  const handleAIDiceRequest = useCallback((request: AIControlledDiceRequest) => {
    if (!request.tacticalDecision) {
      // 通常のダイスロール
      return rollDice(request.dice, request.reason);
    }

    const context: EncounterContext = {
      location: getCurrentBase() || bases[0],
      time: {
        day: currentDay,
        timeOfDay: actionCount < 2 ? 'morning' : 
                   actionCount < 3 ? 'afternoon' : 
                   actionCount < 4 ? 'evening' : 'night'
      },
      playerCharacters,
      enemies: enemies.filter(e => pendingEncounters.some(enc => 
        enc.participants.some(p => 'id' in p && p.id === e.id)
      )),
      npcs: npcs.filter(n => pendingEncounters.some(enc => 
        enc.participants.some(p => 'id' in p && p.id === n.id)
      )),
      currentEvent: undefined,
      partyStatus,
    };

    // 戦術エンジンで最適なダイスチェックを選択
    const optimalCheck = aiTacticalEngine.selectOptimalDiceCheck(context, request.tacticalDecision);
    
    // 難易度クラスを計算
    const dc = aiTacticalEngine.calculateDifficultyClass(
      request.difficulty || optimalCheck.difficulty,
      context
    );

    // ダイスロールをリクエスト
    const updatedRequest: AIControlledDiceRequest = {
      ...request,
      dice: optimalCheck.dice,
      difficulty: dc,
      skillName: optimalCheck.skillName,
      reason: optimalCheck.reason,
    };

    setAiDiceRequest(updatedRequest);

    // メッセージ追加
    addMessage(
      "システム",
      "system",
      `${optimalCheck.skillName}判定が必要です。難易度: ${dc}`
    );

    return updatedRequest;
  }, [getCurrentBase, actionCount, playerCharacters, enemies, npcs, pendingEncounters, partyStatus, bases, rollDice, addMessage]);

  // ダイスロール結果の処理
  const processDiceResult = useCallback((result: DiceRollResult, request: AIControlledDiceRequest) => {
    if (!request.tacticalDecision || !request.difficulty) return;

    const context: EncounterContext = {
      location: getCurrentBase() || bases[0],
      time: {
        day: currentDay,
        timeOfDay: actionCount < 2 ? 'morning' : 
                   actionCount < 3 ? 'afternoon' : 
                   actionCount < 4 ? 'evening' : 'night'
      },
      playerCharacters,
      enemies: enemies.filter(e => pendingEncounters.some(enc => 
        enc.participants.some(p => 'id' in p && p.id === e.id)
      )),
      npcs: npcs.filter(n => pendingEncounters.some(enc => 
        enc.participants.some(p => 'id' in p && p.id === n.id)
      )),
      currentEvent: undefined,
      partyStatus,
    };

    // 結果を判定
    const outcome = aiTacticalEngine.determineConsequences(
      result.total,
      request.difficulty,
      request.tacticalDecision
    );

    // 結果に応じたメッセージを追加
    addMessage(
      "ゲームマスター",
      "gm",
      outcome.description
    );

    // 戦闘開始の処理
    if (request.tacticalDecision.action === 'combat' && 
        (outcome.outcome === 'failure' || outcome.outcome === 'critical_failure')) {
      const enemyIds = pendingEncounters[0].participants
        .filter(p => 'enemyType' in p)
        .map(e => e.id);
      
      if (enemyIds.length > 0) {
        startCombat(enemyIds);
      }
    }

    // パーティーステータスの更新
    if (outcome.outcome === 'critical_failure') {
      updatePartyStatus({ hpModifier: -10, moraleModifier: -5 });
    } else if (outcome.outcome === 'failure') {
      updatePartyStatus({ hpModifier: -5, moraleModifier: -2 });
    } else if (outcome.outcome === 'critical_success') {
      updatePartyStatus({ moraleModifier: 5 });
    }

    // AIダイスリクエストをクリア
    setAiDiceRequest(null);
  }, [getCurrentBase, actionCount, playerCharacters, enemies, npcs, pendingEncounters, partyStatus, bases, addMessage, startCombat, updatePartyStatus]);

  // 初期化時の処理
  useEffect(() => {
    if (currentCampaign && !sessionState) {
      initializeSession();
    }
  }, [currentCampaign, sessionState, initializeSession]);

  // 場所変更時の遭遇チェック
  useEffect(() => {
    if (currentLocation && sessionState) {
      checkForEncounters();
    }
  }, [currentLocation, checkForEncounters]);

  // 時間経過時の遭遇チェック
  useEffect(() => {
    if (actionCount > 0 && sessionState) {
      checkForEncounters();
    }
  }, [actionCount, checkForEncounters]);

  return {
    // セッション状態
    sessionState,
    setSessionState,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    selectedCharacter,
    sessionMessages,
    combatMode,
    initiativeOrder,
    pendingEncounters,
    aiDiceRequest,
    partyStatus,
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
    setCurrentDay,
    setActionCount,
    getAvailableActions,
    executeAction,
    advanceDay,
    rollDice,
    startCombat,
    endCombat,
    addMessage,
    saveSession,
    initializeSession,
    checkForEncounters,
    handleAIDiceRequest,
    processDiceResult,
    updatePartyStatus,

    // ヘルパー
    getCurrentBase,
  };
};