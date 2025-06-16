import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { currentCampaignState, developerModeState } from "../store/atoms";
import { useAIChatIntegration } from "./useAIChatIntegration";
import { useTRPGSession } from "./useTRPGSession";
import {
  ChatMessage,
  DiceRoll,
} from "../components/trpg-session/ChatInterface";
import { SkillCheckResult } from "../components/trpg-session/SkillCheckUI";
import { PowerCheckResult } from "../components/trpg-session/PowerCheckUI";
import {
  ShoppingBag,
  Home,
  Explore,
  FitnessCenter,
  Info,
  LocalDining,
  Build,
  Search,
} from "@mui/icons-material";
import {
  loadTestCampaignData,
  applyTestDataToLocalStorage,
  clearTestData,
} from "../utils/testDataLoader";
import { createTrulyEmptyCampaign } from "../utils/emptyCampaignDefaults";
import { EnemyCharacter } from "@trpg-ai-gm/types";
import { aiAgentApi } from "../api/aiAgent";
import {
  TRPGActionRequest,
  TRPGActionResult,
  EventResult,
  PartyInventoryItem,
  ClearCondition,
  PlayerCharacter,
  BaseLocation,
  StartingLocationInfo,
  TRPGCharacter,
  NPCCharacter,
  Inn,
  Shop,
  Armory,
  Temple,
  Guild,
  Blacksmith,
  OtherFacility,
} from "@trpg-ai-gm/types";
import { useTRPGSessionWithMilestone } from "./useTRPGSessionWithMilestone";

// ターンベース行動管理
interface CharacterAction {
  characterId: string;
  characterName: string;
  characterType: "PC" | "NPC";
  actionText: string;
  timestamp: Date;
}

interface TurnState {
  currentTurn: number;
  actionsThisTurn: CharacterAction[];
  awaitingCharacters: string[]; // まだ行動していないキャラクターのID
  isProcessingTurn: boolean;
}

// ActionChoice型定義を追加
interface ActionChoice {
  id: string;
  type: "move" | "shop" | "talk" | "interact" | "skill" | "custom" | "attack";
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresTarget?: boolean;
  targetType?: "location" | "npc" | "character" | "item" | "enemy";
}

// UI状態の管理
interface TRPGSessionUIState {
  // ダイアログ状態
  diceDialog: boolean;
  skillCheckDialog: boolean;
  powerCheckDialog: boolean;
  aiDiceDialog: boolean;
  startingLocationDialog: boolean;

  // タブ状態
  tabValue: number;
  rightPanelTab: number;

  // チャット状態
  chatInput: string;
  chatMessages: ChatMessage[];

  // ダイス結果状態
  lastDiceResult: {
    result: number;
    notation: string;
    details: string;
  } | null;

  // その他UI状態
  selectedEnemies: string[];
  isSessionStarted: boolean;
  lockedCharacterId: string | null;
  aiRequiredDice: string | null;

  // アクション選択状態
  isAwaitingActionSelection: boolean;
  actionSelectionPrompt: string;
  availableActions: ActionChoice[];

  // ターン管理状態
  turnState: TurnState;

  // 戦闘・難易度状態
  currentCombatSession: object | null;
  combatSessions: object[];
  currentDifficulty: string | number | null;
  recentCombatActions: object[];

  // デバッグパネル状態
  showDebugPanel: boolean;

  // 🎯 イベント・エネミー・トラップ状態（AI PC会話用）
  activeEnemies: EnemyCharacter[];
  currentEvent: object | null;
  activeTrap: object | null;

  // セッション状態
  sessionStatus: string;

  // マイルストーン関連状態
  showMilestoneWarning: boolean;
  milestoneWarningMessage: string | null;
  lastMilestoneCheck: number;
  milestoneNotificationQueue: Array<{
    id: string;
    type: "achievement" | "warning" | "guidance";
    message: string;
    timestamp: Date;
  }>;
}

// ビジネスロジックとUIの統合フック
export const useTRPGSessionUI = () => {
  const [currentCampaign, setCurrentCampaign] =
    useRecoilState(currentCampaignState);
  const [developerMode, _setDeveloperMode] = useRecoilState(developerModeState);
  const { openAIAssist: _openAIAssist } = useAIChatIntegration();

  // TRPGセッションのコアロジック
  const sessionHookData = useTRPGSession();
  const {
    sessionState: _sessionState,
    sessionMessages: _sessionMessages,
    selectedCharacter,
    setSelectedCharacter,
    currentDay,
    actionCount,
    setActionCount,
    maxActionsPerDay,
    currentLocation,
    setCurrentLocation,
    combatMode,
    aiDiceRequest,
    initializeSession: _initializeSession,
    getAvailableActions,
    executeAction,
    advanceDay,
    saveSession,
    processDiceResult,
  } = sessionHookData;

  // マイルストーン統合機能
  const milestoneIntegration = useTRPGSessionWithMilestone();
  const {
    currentMilestone,
    activeMilestones,
    checkMilestonesAfterAction,
    enhanceMessageWithMilestone,
    performDailyMilestoneCheck,
    getMilestoneWarnings,
    getMilestoneProgress,
    getUrgentMilestoneNotification,
  } = milestoneIntegration;

  // 初期案内メッセージを生成
  const createInitialWelcomeMessages = useCallback((): ChatMessage[] => {
    return [
      {
        id: `welcome-${Date.now()}-1`,
        sender: "システム",
        senderType: "system",
        message:
          "🎲 **TRPGセッション画面へようこそ！**\n\nこちらではAI Game Masterと一緒にTRPGセッションを楽しむことができます。",
        timestamp: new Date(),
      },
      {
        id: `welcome-${Date.now()}-2`,
        sender: "システム",
        senderType: "system",
        message:
          "**📋 セッション開始の手順:**\n\n1️⃣ 左側のキャラクター一覧から操作したいキャラクターをクリック\n2️⃣ 「AIにセッションを始めてもらう」ボタンをクリック\n3️⃣ AI Game Masterの案内に従ってゲームを進行\n\n💡 セッション中は右下のチャットエリアで行動を入力したり、探索タブのボタンで行動を選択できます。",
        timestamp: new Date(),
      },
      {
        id: `welcome-${Date.now()}-3`,
        sender: "システム",
        senderType: "system",
        message:
          "🌟 **ここにセッションの進行情報が表示されます**\n\nセッションが開始されると:\n• AI Game Masterからのメッセージ\n• キャラクターの行動結果\n• ターン進行の情報\n• システムからの案内\n\nなどがこのエリアに表示されます。まずはキャラクターを選択してセッションを開始してみましょう！",
        timestamp: new Date(),
      },
    ];
  }, []);

  // UI状態の初期化
  const [uiState, setUIState] = useState<TRPGSessionUIState>({
    diceDialog: false,
    skillCheckDialog: false,
    powerCheckDialog: false,
    aiDiceDialog: false,
    startingLocationDialog: false,
    tabValue: 0,
    rightPanelTab: 0,
    chatInput: "",
    chatMessages: createInitialWelcomeMessages(),
    lastDiceResult: null,
    selectedEnemies: [],
    isSessionStarted: false,
    lockedCharacterId: null,
    aiRequiredDice: null,
    currentCombatSession: null,
    combatSessions: [],
    currentDifficulty: null,
    recentCombatActions: [],
    showDebugPanel: false,

    // アクション選択状態の初期化
    isAwaitingActionSelection: false,
    actionSelectionPrompt: "",
    availableActions: [],

    // ターン管理状態の初期化
    turnState: {
      currentTurn: 1,
      actionsThisTurn: [],
      awaitingCharacters: [],
      isProcessingTurn: false,
    },

    // 🎯 イベント・エネミー・トラップ状態の初期化
    activeEnemies: [],
    currentEvent: null,
    activeTrap: null,

    // セッション状態の初期化
    sessionStatus: "waiting",

    // マイルストーン関連状態の初期化
    showMilestoneWarning: false,
    milestoneWarningMessage: null,
    lastMilestoneCheck: 0,
    milestoneNotificationQueue: [],
  });

  // TRPGセッションページでのテストデータ自動読み込み - 初回のみ実行
  useEffect(() => {
    // キャンペーンデータが存在しない場合、テストデータを自動読み込み
    if (!currentCampaign || !currentCampaign.id) {
      console.log(
        "[TRPGSession] キャンペーンデータなし - テストデータを読み込みます",
      );
      try {
        applyTestDataToLocalStorage();
        const testData = loadTestCampaignData();
        setCurrentCampaign(testData);
        console.log("[TRPGSession] テストデータを適用しました:", {
          id: testData.id,
          title: testData.title,
          characters: testData.characters?.length,
          bases: testData.bases?.length,
        });
      } catch (error) {
        console.error("[TRPGSession] テストデータ読み込みエラー:", error);
      }
    }
  }, [setCurrentCampaign]);

  // データ取得（計算プロパティ）- IDのみに依存してレンダリング無限ループを防ぐ
  const playerCharacters = useMemo(
    () =>
      currentCampaign?.characters?.filter((c) => c.characterType === "PC") ||
      [],
    [currentCampaign?.id],
  );

  const npcs = useMemo(
    () => currentCampaign?.npcs || [],
    [currentCampaign?.id],
  );
  const enemies = useMemo(
    () => currentCampaign?.enemies || [],
    [currentCampaign?.id],
  );
  const bases = useMemo(
    () => currentCampaign?.bases || [],
    [currentCampaign?.id],
  );

  // デバッグ用ログ（currentCampaignの変更時のみ実行）
  useEffect(() => {
    if (currentCampaign) {
      console.log("[Debug] データ計算結果:", {
        playerCharactersCount:
          currentCampaign.characters?.filter((c) => c.characterType === "PC")
            .length || 0,
        npcsCount: currentCampaign.npcs?.length || 0,
        enemiesCount: currentCampaign.enemies?.length || 0,
        basesCount: currentCampaign.bases?.length || 0,
      });
    }
  }, [currentCampaign?.id]); // IDの変更時のみ実行

  // developerModeの変更をlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem("developerMode", developerMode.toString());
      console.log(`Developer mode saved to localStorage: ${developerMode}`);
    } catch (error) {
      console.error("Failed to save developer mode to localStorage:", error);
    }
  }, [developerMode]);

  // 現在の拠点情報を取得
  const getCurrentBase = useCallback(() => {
    return bases.find((base) => base.name === currentLocation);
  }, [bases, currentLocation]);

  // 現在の拠点のイラストURL取得
  const currentBaseImage =
    bases.find((base) => base.name === currentLocation)?.imageUrl ||
    currentCampaign?.imageUrl ||
    "/default-location.jpg";

  // 拠点の施設から利用可能な行動を取得するヘルパー関数
  const getLocationBasedActions = useCallback(
    (base: BaseLocation | null): string[] => {
      if (!base?.facilities) return [];

      const availableActions: string[] = [];

      // 宿屋がある場合
      if (base.facilities.inn) {
        availableActions.push("宿屋で休息する");
      }

      // 店舗がある場合
      if (base.facilities.shops && base.facilities.shops.length > 0) {
        availableActions.push("装備品を購入する");
        availableActions.push("アイテムを売却する");
      }

      // 武具屋がある場合
      if (base.facilities.armory) {
        availableActions.push("武器を購入する");
        availableActions.push("防具を購入する");
      }

      // 神殿がある場合
      if (base.facilities.temple) {
        availableActions.push("治療を受ける");
        availableActions.push("祝福を受ける");
      }

      // ギルドがある場合
      if (base.facilities.guild) {
        availableActions.push("クエストを確認する");
        availableActions.push("ギルドで情報収集する");
      }

      // 鍛冶屋がある場合
      if (base.facilities.blacksmith) {
        availableActions.push("装備を修理する");
        availableActions.push("装備を強化する");
      }

      return availableActions;
    },
    [],
  );

  // 職業別の行動選択肢を取得するヘルパー関数
  const getProfessionSpecificActions = useCallback(
    (profession: string): string[] => {
      switch (profession?.toLowerCase()) {
        case "戦士":
        case "warrior":
        case "fighter":
          return ["武器の手入れ", "戦術を考える"];
        case "魔法使い":
        case "mage":
        case "wizard":
          return ["魔法の研究", "呪文の準備"];
        case "盗賊":
        case "thief":
        case "rogue":
          return ["隠密行動", "罠の確認"];
        case "僧侶":
        case "priest":
        case "cleric":
          return ["祈りを捧げる", "癒しの準備"];
        case "狩人":
        case "ranger":
        case "hunter":
          return ["周囲の偵察", "狩猟の準備"];
        default:
          return ["技能の確認", "装備の点検"];
      }
    },
    [],
  );

  // 入力された行動内容が有効かどうかをチェックするヘルパー関数
  const validateActionInput = useCallback(
    (
      actionText: string,
    ): { isValid: boolean; normalizedAction: string; reason?: string } => {
      const trimmedInput = actionText.trim();

      // 空の入力をチェック
      if (!trimmedInput) {
        return {
          isValid: false,
          normalizedAction: "",
          reason: "行動内容を入力してください",
        };
      }

      // 最小文字数チェック
      if (trimmedInput.length < 2) {
        return {
          isValid: false,
          normalizedAction: trimmedInput,
          reason: "行動は2文字以上で入力してください",
        };
      }

      // 基本的な行動キーワードをチェック
      const validActionKeywords = [
        "移動",
        "会話",
        "攻撃",
        "調べる",
        "探索",
        "休息",
        "準備",
        "情報収集",
        "警戒",
        "様子",
        "購入",
        "買い物",
        "装備",
        "宿屋",
        "神殿",
        "ギルド",
        "訓練",
        "鍛錬",
        "魔法",
        "呪文",
        "研究",
        "隠密",
        "罠",
        "祈り",
        "偵察",
        "狩猟",
        "武器",
        "戦術",
      ];

      // 現在の拠点の行動もチェック
      const currentBase = getCurrentBase();
      const locationActionNames =
        currentBase?.availableActions?.map((action) => action.name) || [];

      const allValidActions = [...validActionKeywords, ...locationActionNames];

      // 入力内容が有効な行動を含んでいるかチェック
      const containsValidAction = allValidActions.some(
        (keyword) =>
          trimmedInput.includes(keyword) || keyword.includes(trimmedInput),
      );

      if (containsValidAction) {
        return { isValid: true, normalizedAction: trimmedInput };
      } else {
        return {
          isValid: true, // 自由記述も許可
          normalizedAction: trimmedInput,
          reason: "自由行動として処理されます",
        };
      }
    },
    [getCurrentBase],
  );

  // 場所と行動に基づいた簡単な結果説明を生成するヘルパー関数
  const getLocationBasedResult = useCallback(
    (location: string, actions: CharacterAction[]): string => {
      if (!actions || actions.length === 0) {
        return `${location}で静かに時間が過ぎていきます。`;
      }

      // 行動の種類を分析
      const actionTypes = actions.map((action) =>
        action.actionText.toLowerCase(),
      );
      const hasExploration = actionTypes.some(
        (action) =>
          action.includes("調べる") ||
          action.includes("探索") ||
          action.includes("情報"),
      );
      const hasInteraction = actionTypes.some(
        (action) => action.includes("会話") || action.includes("交流"),
      );
      const hasPreparation = actionTypes.some(
        (action) =>
          action.includes("準備") ||
          action.includes("装備") ||
          action.includes("休息"),
      );
      const hasTraining = actionTypes.some(
        (action) =>
          action.includes("訓練") ||
          action.includes("鍛錬") ||
          action.includes("研究"),
      );

      // 場所に基づいた結果
      const locationResults: Record<string, string[]> = {
        リバーベント街: [
          "賑やかな商業街で活動が展開されました。",
          "街の人々が興味深そうに皆の行動を見守っています。",
          "石畳の街道に冒険者たちの足音が響きます。",
        ],
        冒険者ギルド: [
          "ギルドホールで多くの冒険者が活動しています。",
          "依頼掲示板の前で活発な議論が交わされています。",
        ],
        森: [
          "深い森の中で自然の音が響いています。",
          "木々の間から差し込む光が美しい影を作っています。",
        ],
      };

      let baseResult = locationResults[location]
        ? locationResults[location][
            Math.floor(Math.random() * locationResults[location].length)
          ]
        : `${location}で冒険者たちが活動しました。`;

      // 行動タイプに基づいた追加説明
      if (hasExploration) {
        baseResult += " 周囲の調査により、新たな発見があるかもしれません。";
      }
      if (hasInteraction) {
        baseResult += " キャラクター同士の交流が深まりました。";
      }
      if (hasPreparation) {
        baseResult +=
          " しっかりとした準備により、次の行動への準備が整いました。";
      }
      if (hasTraining) {
        baseResult += " 訓練により、技能の向上が期待できます。";
      }

      return baseResult;
    },
    [],
  );

  // テストデータ初期化フラグ
  const hasInitializedRef = useRef(false);

  // 空のキャンペーンの自動作成（一度だけ実行）
  useEffect(() => {
    if (!currentCampaign && !hasInitializedRef.current) {
      console.log(
        "🔄 TRPGSessionPage: キャンペーンデータがありません。空のキャンペーンを作成中...",
      );
      hasInitializedRef.current = true;

      // 完全に空のキャンペーンを作成
      const emptyCampaign = createTrulyEmptyCampaign("新しいTRPGキャンペーン");
      setCurrentCampaign(emptyCampaign);

      // 空のキャンペーンでは現在地を設定しない
      // setCurrentLocation("未設定");

      console.log("✅ TRPGSessionPage: 空のキャンペーンを作成しました");
    }
  }, [currentCampaign]); // currentCampaignの変化のみを監視

  // AI制御ダイスリクエストの監視
  useEffect(() => {
    if (aiDiceRequest) {
      const diceSpec = {
        dice: aiDiceRequest.dice,
        reason: aiDiceRequest.reason,
        difficulty: aiDiceRequest.difficulty,
        characterId: aiDiceRequest.characterId,
        skillName: aiDiceRequest.skillName,
        modifier: 0,
      };
      setUIState((prev) => ({
        ...prev,
        aiRequiredDice: diceSpec,
        aiDiceDialog: true,
      }));
    }
  }, [aiDiceRequest]);

  // 🎯 日次マイルストーンチェック
  useEffect(() => {
    if (
      currentDay > 1 &&
      currentCampaign?.milestones &&
      currentCampaign.milestones.length > 0
    ) {
      // 非同期で日次マイルストーンチェックを実行
      performDailyMilestoneCheck()
        .then((dailyMessages) => {
          if (dailyMessages.length > 0) {
            console.log(
              "📅 日次マイルストーンメッセージを追加:",
              dailyMessages.length,
            );
            setUIState((prev) => ({
              ...prev,
              chatMessages: [...prev.chatMessages, ...dailyMessages],
            }));
          }
        })
        .catch((error) => {
          console.warn("日次マイルストーンチェックエラー:", error);
        });
    }
  }, [currentDay, currentCampaign?.milestones]);

  // マイルストーン警告の監視
  useEffect(() => {
    if (currentMilestone) {
      const warnings = getMilestoneWarnings();
      setUIState((prev) => ({
        ...prev,
        showMilestoneWarning: warnings.hasUrgentMilestone,
        milestoneWarningMessage: warnings.warningMessage || null,
      }));
    } else {
      setUIState((prev) => ({
        ...prev,
        showMilestoneWarning: false,
        milestoneWarningMessage: null,
      }));
    }
  }, [currentMilestone, currentDay]);

  // セッション自動開始は削除 - ユーザーが明示的に「AIにセッションを始めてもらう」ボタンを押した時のみ開始

  // ===== 開始場所設定機能 =====

  // 有効な開始場所があるかチェック
  const hasValidStartingLocation = useCallback(() => {
    const startingLocation = currentCampaign?.startingLocation;
    if (!startingLocation || !startingLocation.isActive) {
      return false;
    }

    // 設定された開始場所が実際に存在し、利用可能かチェック
    const matchingBase = bases.find((base) => base.id === startingLocation.id);
    if (!matchingBase) {
      return false;
    }

    // プレイヤー拠点として利用可能で、アンロック済みかチェック
    return (
      matchingBase.features.playerBase &&
      matchingBase.meta.unlocked &&
      matchingBase.importance !== "隠し拠点"
    );
  }, [currentCampaign?.startingLocation, bases]);

  // 開始場所設定ダイアログを開く
  const handleOpenStartingLocationDialog = useCallback(() => {
    setUIState((prev) => ({ ...prev, startingLocationDialog: true }));
  }, []);

  // 開始場所を設定する
  const handleSetStartingLocation = useCallback(
    (locationInfo: StartingLocationInfo) => {
      if (!currentCampaign) return;

      const updatedCampaign = {
        ...currentCampaign,
        startingLocation: locationInfo,
        updatedAt: new Date(),
      };

      setCurrentCampaign(updatedCampaign);

      // ローカルストレージにも保存
      try {
        localStorage.setItem(
          "currentCampaign",
          JSON.stringify(updatedCampaign),
        );
        handleAddSystemMessage(
          `📍 開始場所を「${locationInfo.name}」に設定しました`,
        );
      } catch (error) {
        console.error("開始場所の保存に失敗しました:", error);
        handleAddSystemMessage("⚠️ 開始場所の保存に失敗しました");
      }
    },
    [currentCampaign, setCurrentCampaign],
  );

  // ===== UI アクションハンドラー =====

  // ダイアログ管理
  const handleOpenDialog = useCallback(
    (
      dialogType: keyof Pick<
        TRPGSessionUIState,
        "diceDialog" | "skillCheckDialog" | "powerCheckDialog"
      >,
    ) => {
      setUIState((prev) => ({ ...prev, [dialogType]: true }));
    },
    [],
  );

  const handleCloseDialog = useCallback(
    (
      dialogType: keyof Pick<
        TRPGSessionUIState,
        | "diceDialog"
        | "skillCheckDialog"
        | "powerCheckDialog"
        | "aiDiceDialog"
        | "startingLocationDialog"
      >,
    ) => {
      setUIState((prev) => ({ ...prev, [dialogType]: false }));
    },
    [],
  );

  // タブ変更
  const handleTabChange = useCallback(
    (tabType: "tabValue" | "rightPanelTab", value: number) => {
      setUIState((prev) => ({ ...prev, [tabType]: value }));
    },
    [],
  );

  // チャット関連
  const handleChatInputChange = useCallback((value: string) => {
    setUIState((prev) => ({ ...prev, chatInput: value }));
  }, []);

  // システムメッセージ追加（他の関数で使用されるため先に定義）
  const handleAddSystemMessage = useCallback((message: string) => {
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message,
      timestamp: new Date(),
    };
    setUIState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, systemMessage],
    }));
  }, []);

  // アクション内容からアイコンを決定するヘルパー関数（早期定義）
  const getActionIcon = useCallback(
    (actionText: string): React.ReactElement => {
      const text = actionText.toLowerCase();

      if (
        text.includes("情報") ||
        text.includes("話") ||
        text.includes("聞く") ||
        text.includes("調べる")
      ) {
        return React.createElement(Info);
      } else if (
        text.includes("装備") ||
        text.includes("買い物") ||
        text.includes("購入") ||
        text.includes("店") ||
        text.includes("商店")
      ) {
        return React.createElement(ShoppingBag);
      } else if (
        text.includes("宿屋") ||
        text.includes("休息") ||
        text.includes("泊まる") ||
        text.includes("食事")
      ) {
        return React.createElement(LocalDining);
      } else if (
        text.includes("探索") ||
        text.includes("冒険") ||
        text.includes("調査") ||
        text.includes("森") ||
        text.includes("ダンジョン")
      ) {
        return React.createElement(Explore);
      } else if (
        text.includes("訓練") ||
        text.includes("鍛錬") ||
        text.includes("練習") ||
        text.includes("修行")
      ) {
        return React.createElement(FitnessCenter);
      } else if (
        text.includes("拠点") ||
        text.includes("基地") ||
        text.includes("本部")
      ) {
        return React.createElement(Home);
      } else if (
        text.includes("作成") ||
        text.includes("製作") ||
        text.includes("修理") ||
        text.includes("工房")
      ) {
        return React.createElement(Build);
      } else if (
        text.includes("捜索") ||
        text.includes("発見") ||
        text.includes("探し")
      ) {
        return React.createElement(Search);
      }

      // デフォルトアイコン
      return React.createElement(Explore);
    },
    [],
  );

  // 基本アクションの初期化（現在の拠点から行動選択肢を取得）
  useEffect(() => {
    if (!uiState.isSessionStarted && uiState.availableActions.length === 0) {
      // 現在の拠点から行動選択肢を取得
      const currentBase = getCurrentBase();
      if (
        currentBase?.availableActions &&
        currentBase.availableActions.length > 0
      ) {
        const convertedActions: ActionChoice[] =
          currentBase.availableActions.map((action, index) => ({
            id: action.id || `base-action-${Date.now()}-${index}`,
            type: "custom",
            label: action.name,
            description: action.description,
            icon: getActionIcon(action.name),
            requiresTarget: false,
            targetType: undefined,
          }));

        setUIState((prev) => ({
          ...prev,
          availableActions: convertedActions,
        }));

        console.log(
          `[Debug] 拠点 ${currentLocation} から行動選択肢を読み込み:`,
          convertedActions.length,
          "個",
        );
      } else {
        // フォールバック: 拠点に行動選択肢がない場合は基本アクション
        const baseActions = getAvailableActions();
        if (baseActions.length > 0) {
          const convertedActions: ActionChoice[] = baseActions.map(
            (action, index) => ({
              id: `fallback-action-${Date.now()}-${index}`,
              type: action.type || "custom",
              label: action.label,
              description: action.description,
              icon: getActionIcon(action.label),
              requiresTarget: action.requiresTarget,
              targetType: action.targetType,
            }),
          );

          setUIState((prev) => ({
            ...prev,
            availableActions: convertedActions,
          }));

          console.log(
            `[Debug] フォールバック行動選択肢を読み込み:`,
            convertedActions.length,
            "個",
          );
        }
      }
    }
  }, [
    uiState.isSessionStarted,
    uiState.availableActions.length,
    currentLocation,
    getCurrentBase,
    getAvailableActions,
    getActionIcon,
  ]);

  // AIレスポンスからアクション選択肢を抽出するヘルパー関数（早期定義）
  const extractActionsFromAIResponse = useCallback(
    (response: string): string[] => {
      const actions: string[] = [];

      console.log("🔍 AIレスポンス抽出開始:", response.substring(0, 200));

      // 【利用可能なアクション】または【次の行動選択肢】または【キャラクター名の行動選択肢】セクションを探す
      const actionSectionMatch = response.match(
        /【(利用可能なアクション|次の行動選択肢|.*の行動選択肢)】([\s\S]*?)(?=【|$)/,
      );

      if (actionSectionMatch) {
        const actionSection = actionSectionMatch[2];
        console.log("🎯 アクションセクション発見:", actionSection);

        // ダッシュで始まる行動項目を抽出（絵文字文字化け対応）
        const actionMatches = actionSection.match(
          /.*行動\d+\s*-\s*(.+?)(?=説明:|[\n\r])/g,
        );

        if (actionMatches) {
          console.log("✅ アクションマッチ:", actionMatches);
          actionMatches.forEach((match) => {
            // "行動N - " の後の部分を抽出
            const actionMatch = match.match(
              /行動\d+\s*-\s*(.+?)(?=\s*説明:|$)/,
            );
            if (actionMatch) {
              const cleanAction = actionMatch[1].trim();
              if (cleanAction) {
                actions.push(cleanAction);
              }
            }
          });
        } else {
          console.log("❌ アクションマッチなし");

          // フォールバック: 番号付きリストから抽出
          const numberedMatches = actionSection.match(/\d+\.\s*(.+?)(?=\n|$)/g);
          if (numberedMatches) {
            console.log("🔄 番号付きマッチ:", numberedMatches);
            numberedMatches.forEach((match) => {
              const cleanAction = match.replace(/\d+\.\s*/, "").trim();
              if (cleanAction && !cleanAction.includes("行動")) {
                actions.push(cleanAction);
              }
            });
          }
        }
      } else {
        console.log("❌ アクションセクションなし");

        // フォールバック: 全体から行動パターンを探す
        const directMatches = response.match(
          /行動\d+\s*-\s*(.+?)(?=説明:|[\n\r])/g,
        );
        if (directMatches) {
          console.log("🔄 直接マッチ:", directMatches);
          directMatches.forEach((match) => {
            const actionMatch = match.match(
              /行動\d+\s*-\s*(.+?)(?=\s*説明:|$)/,
            );
            if (actionMatch) {
              const cleanAction = actionMatch[1].trim();
              if (cleanAction) {
                actions.push(cleanAction);
              }
            }
          });
        }
      }

      console.log("📊 抽出されたアクション:", actions);
      return actions;
    },
    [],
  );

  // アクション管理機能
  const setAvailableActions = useCallback((actions: ActionChoice[]) => {
    setUIState((prev) => ({
      ...prev,
      availableActions: actions,
    }));
  }, []);

  // AIレスポンスから行動選択肢をパースして更新
  const parseAndUpdateActionsFromMessage = useCallback(
    (message: string) => {
      console.log("🔍 AIメッセージから行動選択肢をパース中:", message);

      // 「新しい選択肢」や「💡 新しい選択肢」パターンを検索
      const actionPattern = /💡\s*新しい選択肢[:\s]*\n?([\s\S]*?)(?=\n\n|$)/i;
      const match = message.match(actionPattern);

      if (match) {
        const actionsText = match[1];
        console.log("📋 抽出された選択肢テキスト:", actionsText);

        // 選択肢を行ごとに分割
        const actionLines = actionsText
          .split("\n")
          .map((line) => line.trim())
          .filter(
            (line) =>
              line.length > 0 &&
              (line.startsWith("•") ||
                line.startsWith("-") ||
                line.startsWith("*")),
          );

        if (actionLines.length > 0) {
          const newActions: ActionChoice[] = actionLines.map((line, index) => {
            // '• アクション名: 説明' または '• アクション名' 形式をパース
            const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
            const colonIndex = cleanLine.indexOf(":");

            let actionName: string;
            let actionDescription: string;

            if (colonIndex > 0) {
              actionName = cleanLine.substring(0, colonIndex).trim();
              actionDescription = cleanLine.substring(colonIndex + 1).trim();
            } else {
              actionName = cleanLine;
              actionDescription = cleanLine;
            }

            return {
              id: `ai-action-${Date.now()}-${index}`,
              type: "custom" as const,
              label: actionName,
              description: actionDescription,
              icon: getActionIcon(actionName),
              requiresTarget: false,
            };
          });

          console.log("✅ 新しい行動選択肢を設定:", newActions);
          setAvailableActions(newActions);
        } else {
          console.log("⚠️ 行動選択肢が見つかりませんでした");
        }
      } else {
        console.log("⚠️ '新しい選択肢' パターンが見つかりませんでした");
      }
    },
    [getActionIcon, setAvailableActions],
  );

  // システムメッセージ監視：行動選択肢の自動パース
  useEffect(() => {
    const latestMessage = uiState.chatMessages[uiState.chatMessages.length - 1];
    if (
      latestMessage &&
      latestMessage.senderType === "system" &&
      latestMessage.message.includes("💡 新しい選択肢")
    ) {
      console.log("🔄 システムメッセージから行動選択肢をパース");
      setTimeout(() => {
        parseAndUpdateActionsFromMessage(latestMessage.message);
      }, 100);
    }
  }, [uiState.chatMessages]);

  // ターン管理機能（プレイヤーキャラクターのみ）
  const initializeTurn = useCallback(() => {
    // プレイヤーキャラクターのみをターン管理対象にする
    const characterIds = playerCharacters.map((c) => c.id);

    console.log(
      `ターン ${uiState.turnState.currentTurn} 初期化: ${playerCharacters.length}人のプレイヤーキャラクター`,
    );

    setUIState((prev) => ({
      ...prev,
      turnState: {
        ...prev.turnState,
        awaitingCharacters: characterIds,
        actionsThisTurn: [],
        isProcessingTurn: false,
      },
    }));
  }, [playerCharacters, uiState.turnState.currentTurn]);

  // ===============================
  // 🎯 Phase 2: 構造化行動結果処理
  // ===============================

  // ===============================
  // 🎯 Phase 3: ゲーム状態変更システム
  // ===============================

  /**
   * キャラクターステータス汎用更新関数
   */
  const updateCharacterStatus = useCallback(
    (characterId: string, updates: Partial<PlayerCharacter>) => {
      console.log("🔄 キャラクターステータス更新:", { characterId, updates });

      setCurrentCampaign((prev) => {
        if (!prev) {
          console.warn("❌ currentCampaignが存在しません");
          return prev;
        }

        const updatedCampaign = {
          ...prev,
          characters: prev.characters?.map((char) =>
            char.id === characterId ? { ...char, ...updates } : char,
          ),
        };

        console.log("✅ キャラクターステータス更新完了:", characterId);
        return updatedCampaign;
      });
    },
    [setCurrentCampaign],
  );

  /**
   * キャラクターHP更新関数
   */
  const updateCharacterHP = useCallback(
    (characterId: string, change: number) => {
      console.log("💗 HP更新開始:", { characterId, change });

      const character = playerCharacters.find((c) => c.id === characterId);
      if (!character) {
        console.warn("❌ キャラクターが見つかりません:", characterId);
        return;
      }

      const currentHP =
        (character as PlayerCharacter).currentHP ?? character.derived?.HP ?? 40;
      const maxHP = character.derived?.HP ?? 40;
      const newHP = Math.max(0, Math.min(maxHP, currentHP + change));

      console.log("💗 HP計算:", { currentHP, maxHP, change, newHP });

      updateCharacterStatus(characterId, { currentHP: newHP });
    },
    [playerCharacters, updateCharacterStatus],
  );

  /**
   * キャラクターMP更新関数
   */
  const updateCharacterMP = useCallback(
    (characterId: string, change: number) => {
      console.log("🔮 MP更新開始:", { characterId, change });

      const character = playerCharacters.find((c) => c.id === characterId);
      if (!character) {
        console.warn("❌ キャラクターが見つかりません:", characterId);
        return;
      }

      const currentMP =
        (character as PlayerCharacter).currentMP ?? character.derived?.MP ?? 20;
      const maxMP = character.derived?.MP ?? 20;
      const newMP = Math.max(0, Math.min(maxMP, currentMP + change));

      console.log("🔮 MP計算:", { currentMP, maxMP, change, newMP });

      updateCharacterStatus(characterId, { currentMP: newMP });
    },
    [playerCharacters, updateCharacterStatus],
  );

  /**
   * パーティ所持金更新関数
   */
  const updatePartyGold = useCallback(
    (change: number) => {
      console.log("💰 所持金更新開始:", { change });

      setCurrentCampaign((prev) => {
        if (!prev) {
          console.warn("❌ currentCampaignが存在しません");
          return prev;
        }

        const currentGold = prev.partyGold ?? 500; // デフォルト500G
        const newGold = Math.max(0, currentGold + change);

        console.log("💰 所持金計算:", { currentGold, change, newGold });

        const updatedCampaign = {
          ...prev,
          partyGold: newGold,
        };

        console.log("✅ パーティ所持金更新完了:", newGold);
        return updatedCampaign;
      });
    },
    [setCurrentCampaign],
  );

  /**
   * インベントリアイテム追加関数
   */
  const addInventoryItem = useCallback(
    (itemId: string, quantity = 1) => {
      console.log("📦 アイテム追加開始:", { itemId, quantity });

      setCurrentCampaign((prev) => {
        if (!prev) {
          console.warn("❌ currentCampaignが存在しません");
          return prev;
        }

        const currentInventory = prev.partyInventory ?? [];
        const existingItemIndex = currentInventory.findIndex(
          (item) => item.itemId === itemId,
        );

        let updatedInventory;
        if (existingItemIndex >= 0) {
          // 既存アイテムの数量を増やす
          updatedInventory = [...currentInventory];
          updatedInventory[existingItemIndex] = {
            ...updatedInventory[existingItemIndex],
            quantity: updatedInventory[existingItemIndex].quantity + quantity,
          };
          console.log(
            "📦 既存アイテム数量更新:",
            updatedInventory[existingItemIndex],
          );
        } else {
          // 新規アイテムを追加
          const newItem: PartyInventoryItem = {
            itemId,
            quantity,
          };
          updatedInventory = [...currentInventory, newItem];
          console.log("📦 新規アイテム追加:", newItem);
        }

        const updatedCampaign = {
          ...prev,
          partyInventory: updatedInventory,
        };

        console.log("✅ インベントリ更新完了");
        return updatedCampaign;
      });
    },
    [setCurrentCampaign],
  );

  /**
   * インベントリアイテム削除関数
   */
  const removeInventoryItem = useCallback(
    (itemId: string, quantity = 1) => {
      console.log("📦 アイテム削除開始:", { itemId, quantity });

      setCurrentCampaign((prev) => {
        if (!prev) {
          console.warn("❌ currentCampaignが存在しません");
          return prev;
        }

        const currentInventory = prev.partyInventory ?? [];
        const existingItemIndex = currentInventory.findIndex(
          (item) => item.itemId === itemId,
        );

        if (existingItemIndex < 0) {
          console.warn("❌ アイテムが見つかりません:", itemId);
          return prev;
        }

        const updatedInventory = [...currentInventory];
        const currentItem = updatedInventory[existingItemIndex];

        if (currentItem.quantity <= quantity) {
          // アイテムを完全に削除
          updatedInventory.splice(existingItemIndex, 1);
          console.log("📦 アイテム完全削除:", itemId);
        } else {
          // 数量を減らす
          updatedInventory[existingItemIndex] = {
            ...currentItem,
            quantity: currentItem.quantity - quantity,
          };
          console.log(
            "📦 アイテム数量減少:",
            updatedInventory[existingItemIndex],
          );
        }

        const updatedCampaign = {
          ...prev,
          partyInventory: updatedInventory,
        };

        console.log("✅ インベントリ削除完了");
        return updatedCampaign;
      });
    },
    [setCurrentCampaign],
  );

  /**
   * キャンペーンフラグ設定関数
   */
  const setCampaignFlag = useCallback(
    (flagKey: string, flagValue: any) => {
      console.log("🚩 フラグ設定開始:", { flagKey, flagValue });

      setCurrentCampaign((prev) => {
        if (!prev) {
          console.warn("❌ currentCampaignが存在しません");
          return prev;
        }

        const currentFlags = prev.campaignFlags ?? {};
        const updatedFlags = {
          ...currentFlags,
          [flagKey]: flagValue,
        };

        const updatedCampaign = {
          ...prev,
          campaignFlags: updatedFlags,
        };

        console.log("✅ フラグ設定完了:", { flagKey, flagValue });
        return updatedCampaign;
      });
    },
    [setCurrentCampaign],
  );

  /**
   * キャンペーンフラグ取得関数
   */
  const getCampaignFlag = useCallback(
    (flagKey: string, defaultValue: any = null): any => {
      const campaign = currentCampaign;
      if (!campaign?.campaignFlags) {
        return defaultValue;
      }

      const value = campaign.campaignFlags[flagKey];
      return value !== undefined ? value : defaultValue;
    },
    [currentCampaign],
  );

  /**
   * クリア条件チェック関数
   */
  const checkClearConditions = useCallback((): {
    condition: ClearCondition;
    isCompleted: boolean;
    progress: string;
  }[] => {
    if (!currentCampaign?.clearConditions) {
      return [];
    }

    return currentCampaign.clearConditions.map((condition) => {
      let isCompleted = false;
      let progress = "未達成";

      switch (condition.type) {
        case "item_collection":
          if (condition.requiredItems && currentCampaign.partyInventory) {
            const inventory = currentCampaign.partyInventory;
            const totalRequired = condition.requiredItems.length;
            let completedItems = 0;

            for (const requiredItem of condition.requiredItems) {
              const inventoryItem = inventory.find(
                (item) => item.itemId === requiredItem.itemId,
              );
              if (
                inventoryItem &&
                inventoryItem.quantity >= requiredItem.quantity
              ) {
                completedItems++;
              }
            }

            isCompleted = completedItems === totalRequired;
            progress = `${completedItems}/${totalRequired} アイテム取得済み`;
          }
          break;

        case "story_milestone":
          if (condition.storyMilestone) {
            const flagValue = getCampaignFlag(condition.storyMilestone, false);
            isCompleted = !!flagValue;
            progress = isCompleted ? "達成済み" : "未達成";
          }
          break;

        case "custom":
          // カスタム条件はフラグで管理
          const customFlagKey = `custom_condition_${condition.id}`;
          const customValue = getCampaignFlag(customFlagKey, false);
          isCompleted = !!customValue;
          progress = isCompleted ? "達成済み" : "未達成";
          break;

        default:
          progress = "未実装の条件タイプ";
          break;
      }

      return {
        condition,
        isCompleted,
        progress,
      };
    });
  }, [currentCampaign, getCampaignFlag]);

  /**
   * ゲーム効果を実際のゲーム状態に適用する
   */
  const applyGameEffects = useCallback(
    async (
      gameEffects: EventResult[],
      targetCharacter: TRPGCharacter | NPCCharacter | null,
    ): Promise<void> => {
      for (const effect of gameEffects) {
        try {
          console.log("🎲 ゲーム効果適用:", effect);

          switch (effect.type) {
            case "hp_change":
              if (effect.value && effect.characterId) {
                // 🎯 実際のHP更新
                updateCharacterHP(effect.characterId, effect.value);

                const effectMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: "システム",
                  senderType: "system",
                  message: `💗 ${targetCharacter.name}のHP: ${effect.value > 0 ? "+" : ""}${effect.value} (${effect.description})`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, effectMessage],
                }));
              }
              break;

            case "mp_change":
              if (effect.value && effect.characterId) {
                // 🎯 実際のMP更新
                updateCharacterMP(effect.characterId, effect.value);

                const effectMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: "システム",
                  senderType: "system",
                  message: `🔮 ${targetCharacter.name}のMP: ${effect.value > 0 ? "+" : ""}${effect.value} (${effect.description})`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, effectMessage],
                }));
              }
              break;

            case "gold_change":
              if (effect.value) {
                // 🎯 実際の所持金更新
                updatePartyGold(effect.value);

                const effectMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: "システム",
                  senderType: "system",
                  message: `💰 所持金: ${effect.value > 0 ? "+" : ""}${effect.value}G (${effect.description})`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, effectMessage],
                }));
              }
              break;

            case "item_gained":
              if (effect.itemId && effect.itemQuantity) {
                // 🎯 実際のアイテム追加
                addInventoryItem(effect.itemId, effect.itemQuantity);

                const effectMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: "システム",
                  senderType: "system",
                  message: `📦 アイテム取得: ${effect.itemId} x${effect.itemQuantity} (${effect.description})`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, effectMessage],
                }));
              }
              break;

            case "flag_set":
              if (effect.flagKey && effect.flagValue !== undefined) {
                // 🎯 実際のキャンペーンフラグ設定
                setCampaignFlag(effect.flagKey, effect.flagValue);

                const effectMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: "システム",
                  senderType: "system",
                  message: `🚩 ${effect.description}`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, effectMessage],
                }));
              }
              break;

            case "flag_unset":
              if (effect.flagKey) {
                // 🎯 キャンペーンフラグの削除
                setCampaignFlag(effect.flagKey, null);

                const effectMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: "システム",
                  senderType: "system",
                  message: `🚩 ${effect.description}`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, effectMessage],
                }));
              }
              break;

            default:
              console.log("🔧 未対応のゲーム効果:", effect.type);
              break;
          }
        } catch (effectError) {
          console.error("ゲーム効果適用エラー:", effectError);
        }
      }
    },
    [
      updateCharacterHP,
      updateCharacterMP,
      updatePartyGold,
      addInventoryItem,
      setCampaignFlag,
    ],
  );

  /**
   * 構造化されたアクション結果を処理する
   */
  const processStructuredActionResult = useCallback(
    async (
      actionText: string,
      characterId: string,
      character: TRPGCharacter | NPCCharacter,
    ): Promise<void> => {
      try {
        console.log("🎯 構造化行動結果処理開始:", { actionText, characterId });

        // リッチなコンテキスト情報を構築
        const actionRequest: TRPGActionRequest = {
          actionText,
          characterId,
          location: currentLocation,
          dayNumber: currentDay,
          timeOfDay: "morning", // TODO: 実際の時刻管理を実装
          partyMembers: playerCharacters.map((pc) => ({
            id: pc.id,
            name: pc.name,
            currentHP: pc.derived?.HP || 40,
            maxHP: pc.derived?.HP || 40,
            currentMP: pc.derived?.MP || 20,
            maxMP: pc.derived?.MP || 20,
            level: 1, // TODO: 実際のレベル管理
            gold: 500, // TODO: 実際の所持金管理
          })),
          availableFacilities: getCurrentBase()?.facilities
            ? Object.keys(getCurrentBase()!.facilities).filter((key) => {
                const facilities = getCurrentBase()!.facilities;
                return facilities[key as keyof typeof facilities] !== undefined;
              })
            : [],
          activeQuests: [], // TODO: 実際のクエスト管理
          campaignFlags: {}, // TODO: 実際のフラグ管理
          partyInventory: [], // TODO: 実際のインベントリ管理
          previousActions: uiState.turnState.actionsThisTurn
            .slice(-3)
            .map((action) => action.actionText),
          locationDescription:
            getCurrentBase()?.description || `${currentLocation}での冒険`,
          currentEvents: [], // TODO: 実際のイベント管理
        };

        // AIから構造化結果を取得
        const response =
          await aiAgentApi.generateTRPGActionResult(actionRequest);

        if (response.status === "success") {
          const result: TRPGActionResult = response.data;

          console.log("✅ 構造化レスポンス取得成功:", {
            narrativeLength: result.narrative.length,
            gameEffectsCount: result.gameEffects.length,
            newOpportunitiesCount: result.newOpportunities?.length || 0,
          });

          // 1. ナラティブテキストをチャットに表示
          const narrativeMessage: ChatMessage = {
            id: uuidv4(),
            sender: "AIゲームマスター",
            senderType: "gm",
            message: `🎭 ${result.narrative}`,
            timestamp: new Date(),
          };

          setUIState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages, narrativeMessage],
          }));

          // 2. ゲーム効果を適用
          await applyGameEffects(result.gameEffects, character);

          // 3. 新しい機会があれば表示
          if (result.newOpportunities && result.newOpportunities.length > 0) {
            const opportunitiesText = result.newOpportunities
              .map((opp) => `• ${opp.actionName}: ${opp.description}`)
              .join("\n");

            const opportunitiesMessage: ChatMessage = {
              id: uuidv4(),
              sender: "システム",
              senderType: "system",
              message: `💡 新しい選択肢:\n${opportunitiesText}`,
              timestamp: new Date(),
            };

            setUIState((prev) => ({
              ...prev,
              chatMessages: [...prev.chatMessages, opportunitiesMessage],
            }));
          }

          // 4. 将来の影響があれば記録
          if (
            result.futureConsequences &&
            result.futureConsequences.length > 0
          ) {
            console.log("📝 将来への影響:", result.futureConsequences);
            // TODO: キャンペーンフラグとして保存
          }
        } else {
          throw new Error("AI API からの無効なレスポンス");
        }
      } catch (error) {
        console.error("❌ 構造化行動結果処理エラー:", error);

        // フォールバック: 基本的なメッセージを表示
        const fallbackMessage: ChatMessage = {
          id: uuidv4(),
          sender: "システム",
          senderType: "system",
          message: `⚠️ ${actionText}を実行しましたが、詳細な結果の取得に失敗しました。`,
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, fallbackMessage],
        }));
      }
    },
    [
      currentLocation,
      currentDay,
      playerCharacters,
      getCurrentBase,
      uiState.turnState.actionsThisTurn,
      applyGameEffects,
    ],
  );

  const processPlayerAction = useCallback(
    async (actionText: string) => {
      if (!selectedCharacter) return;

      const action: CharacterAction = {
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        characterType: "PC",
        actionText,
        timestamp: new Date(),
      };

      setUIState((prev) => ({
        ...prev,
        turnState: {
          ...prev.turnState,
          actionsThisTurn: [...prev.turnState.actionsThisTurn, action],
          awaitingCharacters: prev.turnState.awaitingCharacters.filter(
            (id) => id !== selectedCharacter.id,
          ),
        },
      }));

      // システムメッセージでプレイヤーアクションを記録
      handleAddSystemMessage(
        `🎯 ${selectedCharacter.name}の行動: ${actionText}`,
      );

      // 🎯 行動回数をインクリメント
      setActionCount((prev) => prev + 1);
      console.log(
        `📊 行動回数をインクリメント: ${actionCount + 1}/${maxActionsPerDay}`,
      );

      // 🎯 Phase 2: 構造化行動結果処理を実行
      console.log("🚀 構造化行動結果処理を開始...");
      try {
        await processStructuredActionResult(
          actionText,
          selectedCharacter.id,
          selectedCharacter,
        );
      } catch (error) {
        console.error("構造化行動結果処理エラー:", error);
        // フォールバックとして従来の処理は不要（processStructuredActionResult内でフォールバック処理済み）
      }

      // 🎯 Phase 2.5: マイルストーンチェックを実行
      console.log("🏁 マイルストーンチェックを開始...");
      try {
        const actionRequest: TRPGActionRequest = {
          actionText: actionText,
          characterId: selectedCharacter.id,
          location: currentLocation,
          dayNumber: currentDay,
          timeOfDay: "morning", // TODO: 実際の時刻システムから取得
          partyMembers: playerCharacters.map((pc) => ({
            id: pc.id,
            name: pc.name,
            currentHP:
              (pc as PlayerCharacter).currentHP || pc.derived?.HP || 40,
            maxHP: pc.derived?.HP || 40,
            currentMP:
              (pc as PlayerCharacter).currentMP || pc.derived?.MP || 20,
            maxMP: pc.derived?.MP || 20,
            level: 1, // TODO: TRPGCharacterにlevelプロパティがないので固定値
            gold: currentCampaign?.partyGold || 0,
          })),
          campaignFlags: currentCampaign?.campaignFlags,
          partyInventory:
            currentCampaign?.partyInventory?.map((item) => ({
              itemId: item.itemId,
              itemName: item.itemId, // TODO: アイテム名を実際に取得
              quantity: item.quantity,
            })) || [],
        };

        const actionResult: TRPGActionResult = {
          narrative: `${selectedCharacter.name}が${actionText}を実行しました`,
          gameEffects: [],
          newOpportunities: [],
          futureConsequences: [],
        };

        const milestoneResults = await checkMilestonesAfterAction(
          actionRequest,
          actionResult,
        );

        // マイルストーンメッセージをチャットに追加
        if (milestoneResults.milestoneMessages.length > 0) {
          setUIState((prev) => ({
            ...prev,
            chatMessages: [
              ...prev.chatMessages,
              ...milestoneResults.milestoneMessages,
            ],
          }));
        }

        // 達成があった場合は通知を表示
        if (milestoneResults.shouldShowAchievement) {
          setUIState((prev) => ({
            ...prev,
            milestoneNotificationQueue: [
              ...prev.milestoneNotificationQueue,
              {
                id: `achievement-${Date.now()}`,
                type: "achievement" as const,
                message: "🎉 マイルストーンが達成されました！",
                timestamp: new Date(),
              },
            ],
          }));
        }

        console.log("✅ マイルストーンチェック完了", {
          messagesAdded: milestoneResults.milestoneMessages.length,
          milestonesUpdated: milestoneResults.updatedMilestones.length,
          achievement: milestoneResults.shouldShowAchievement,
        });
      } catch (error) {
        console.error("❌ マイルストーンチェックエラー:", error);
      }

      // 他のプレイヤーキャラクターの自動行動を処理
      console.log(
        `🎯 ${selectedCharacter.name} 行動完了 - 他キャラクター処理をトリガー`,
      );
    },
    [
      selectedCharacter,
      handleAddSystemMessage,
      processStructuredActionResult,
      setActionCount,
      actionCount,
      maxActionsPerDay,
    ],
  );

  // プレイヤーアクション完了後に他のキャラクターの処理を自動開始
  useEffect(() => {
    // セッション開始済み、かつターン処理中でない、かつ待機中キャラクターが1人以上いる場合
    if (
      uiState.isSessionStarted &&
      !uiState.turnState.isProcessingTurn &&
      uiState.turnState.awaitingCharacters.length > 0 &&
      selectedCharacter &&
      !uiState.turnState.awaitingCharacters.includes(selectedCharacter.id) // 選択キャラクターが行動済み
    ) {
      const otherCharacters = playerCharacters.filter(
        (pc) =>
          pc.id !== selectedCharacter.id &&
          uiState.turnState.awaitingCharacters.includes(pc.id),
      );

      if (otherCharacters.length > 0) {
        console.log(
          `⏰ 他プレイヤーキャラクター処理を自動開始: ${otherCharacters.length}人`,
        );
        setTimeout(() => {
          processOtherPlayerCharacters();
        }, 1000);
      }
    }
  }, [
    uiState.isSessionStarted,
    uiState.turnState.isProcessingTurn,
    uiState.turnState.awaitingCharacters,
    selectedCharacter?.id,
    playerCharacters.length, // 配列の長さのみを監視
  ]);

  const processOtherPlayerCharacters = useCallback(async () => {
    // 操作していない他のプレイヤーキャラクターを取得
    const otherPlayerCharacters = playerCharacters.filter(
      (pc) =>
        pc.id !== selectedCharacter?.id &&
        uiState.turnState.awaitingCharacters.includes(pc.id),
    );

    console.log(
      `[ターン制] 待機中の他キャラクター数: ${otherPlayerCharacters.length}`,
    );
    console.log(
      `[ターン制] 現在の待機中キャラクターID:`,
      uiState.turnState.awaitingCharacters,
    );
    console.log(
      `[ターン制] 全プレイヤーキャラクター数: ${playerCharacters.length}`,
    );

    if (otherPlayerCharacters.length === 0) {
      console.log(
        `[ターン制] 他のキャラクターがいないため、ターン完了チェックを実行`,
      );
      // 他のキャラクターがいない場合、少し待ってからターン完了チェック
      setTimeout(() => checkTurnCompletion(), 1000); // 1秒待機してからターン完了チェック
      return;
    }

    console.log(
      `[ターン制] ${otherPlayerCharacters.length}人の他プレイヤーキャラクターの行動を処理中...`,
    );
    handleAddSystemMessage(
      `🎭 他のプレイヤーキャラクター（${otherPlayerCharacters.length}人）の行動を決定中...`,
    );

    setUIState((prev) => ({
      ...prev,
      turnState: {
        ...prev.turnState,
        isProcessingTurn: true,
      },
    }));

    // 各キャラクターの行動を順次処理
    for (const character of otherPlayerCharacters) {
      console.log(`[ターン制] ${character.name}の行動を処理中...`);
      await processIndividualPlayerCharacterAction(character);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // キャラクターアクション間の間隔
    }

    setUIState((prev) => ({
      ...prev,
      turnState: {
        ...prev.turnState,
        isProcessingTurn: false,
      },
    }));

    console.log(`[ターン制] 全ての他キャラクターの行動決定完了`);
    // 全キャラクターの行動が完了したかチェック
    setTimeout(() => checkTurnCompletion(), 500);
  }, [
    playerCharacters,
    selectedCharacter?.id, // IDのみを依存に変更
    uiState.turnState.awaitingCharacters,
    handleAddSystemMessage,
  ]);

  // キャラクター固有の能力・スキルに基づく行動を取得
  const getCharacterAbilityActions = useCallback(
    (character: TRPGCharacter | NPCCharacter): string[] => {
      const abilityActions: string[] = [];

      // TRPGCharacterの場合はattributesから能力値を確認
      if ("attributes" in character && character.attributes) {
        const attrs = character.attributes;

        // 高い能力値に基づく特殊行動
        if (attrs.strength && attrs.strength > 15) {
          abilityActions.push("力技で解決を試みる");
        }
        if (attrs.dexterity && attrs.dexterity > 15) {
          abilityActions.push("敏捷性を活かした行動");
        }
        if (attrs.intelligence && attrs.intelligence > 15) {
          abilityActions.push("知識を活用して分析する");
        }
        if (attrs.wisdom && attrs.wisdom > 15) {
          abilityActions.push("直感で危険を察知する");
        }
        if (attrs.charisma && attrs.charisma > 15) {
          abilityActions.push("交渉や説得を試みる");
        }
      }

      // スキルに基づく行動
      if (
        "skills" in character &&
        character.skills &&
        Array.isArray(character.skills)
      ) {
        character.skills.forEach((skill: string | object) => {
          if (typeof skill === "string") {
            switch (skill.toLowerCase()) {
              case "stealth":
              case "隠密":
                abilityActions.push("隠密行動を取る");
                break;
              case "perception":
              case "知覚":
                abilityActions.push("周囲を詳しく観察する");
                break;
              case "investigation":
              case "調査":
                abilityActions.push("手がかりを詳しく調べる");
                break;
              case "medicine":
              case "医術":
                abilityActions.push("仲間の状態をチェックする");
                break;
            }
          }
        });
      }

      return abilityActions;
    },
    [],
  );

  // キャラクターの状態に基づく行動を取得
  const getStatusBasedActions = useCallback(
    (character: TRPGCharacter | NPCCharacter): string[] => {
      const statusActions: string[] = [];

      // HP状態による行動
      const hp =
        "derived" in character && character.derived
          ? (character.currentHP ?? character.derived.HP)
          : 100;
      const maxHp =
        "derived" in character && character.derived
          ? character.derived.HP
          : 100;

      const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 100;

      if (hpPercentage < 30) {
        statusActions.push("安全な場所で休息する");
        statusActions.push("治療を優先する");
      } else if (hpPercentage < 60) {
        statusActions.push("慎重に行動する");
      } else {
        statusActions.push("積極的に行動する");
      }

      // 装備による行動
      if ("equipment" in character && character.equipment) {
        const equipment = character.equipment;
        if (equipment.weapon) {
          statusActions.push("武器を活用した行動");
        }
        if (equipment.armor) {
          statusActions.push("防具を信頼した前進");
        }
      }

      return statusActions;
    },
    [],
  );

  // キャラクター個別の位置情報に基づく行動を取得
  const getCharacterLocationActions = useCallback(
    (
      character: TRPGCharacter | NPCCharacter,
    ): { actions: string[]; location: string } => {
      // キャラクター個別の位置情報を取得（フォールバック: 全体の現在地）
      const characterLocation = character.currentLocation || currentLocation;

      // そのキャラクターがいる場所の拠点情報を取得
      const characterBase = bases.find(
        (base) => base.name === characterLocation,
      );

      // その場所での利用可能行動を取得
      const locationActions = characterBase
        ? getLocationBasedActions(characterBase)
        : [];

      console.log(`📍 ${character.name}の位置: ${characterLocation}`);
      console.log(
        `🏢 利用可能施設:`,
        Object.keys(characterBase?.facilities || {}),
      );

      return {
        actions: locationActions,
        location: characterLocation,
      };
    },
    [bases, currentLocation, getLocationBasedActions],
  );

  const generateCharacterSpecificActions = useCallback(
    async (character: TRPGCharacter | NPCCharacter): Promise<string[]> => {
      console.log(`\n🎯 === ${character.name} 固有行動選択肢生成開始 ===`);

      // 基本行動（全キャラクター共通）
      const baseActions = [
        "様子を見る",
        "情報収集を行う",
        "周囲を警戒する",
        "準備を整える",
      ];

      // 1. キャラクター個別の位置情報に基づく行動
      const { actions: locationActions, location: characterLocation } =
        getCharacterLocationActions(character);

      // 2. 職業に基づく行動
      const professionActions = getProfessionSpecificActions(
        character.profession,
      );

      // 3. キャラクター固有の能力・スキルに基づく行動
      const abilityActions = getCharacterAbilityActions(character);

      // 4. キャラクターの現在状態に基づく行動
      const statusActions = getStatusBasedActions(character);

      // 全ての行動をまとめる（重複除去）
      const allUniqueActions = Array.from(
        new Set([
          ...baseActions,
          ...locationActions.slice(0, 2), // 拠点固有行動は2つまで
          ...professionActions.slice(0, 1), // 職業固有行動は1つまで
          ...abilityActions.slice(0, 1), // 能力固有行動は1つまで
          ...statusActions.slice(0, 1), // 状態固有行動は1つまで
        ]),
      );

      console.log(`📋 ${character.name}の行動詳細:`);
      console.log(`  位置: ${characterLocation}`);
      console.log(`  職業: ${character.profession || "不明"}`);
      console.log(`  拠点行動: [${locationActions.join(", ")}]`);
      console.log(`  職業行動: [${professionActions.join(", ")}]`);
      console.log(`  能力行動: [${abilityActions.join(", ")}]`);
      console.log(`  状態行動: [${statusActions.join(", ")}]`);
      console.log(
        `🎯 最終選択肢 (${allUniqueActions.length}個):`,
        allUniqueActions,
      );
      console.log(`=== ${character.name} 行動選択肢生成完了 ===\n`);

      return allUniqueActions.slice(0, 6); // 最大6つまで
    },
    [
      getCharacterLocationActions,
      getProfessionSpecificActions,
      getCharacterAbilityActions,
      getStatusBasedActions,
    ],
  );

  const processIndividualPlayerCharacterAction = useCallback(
    async (character: TRPGCharacter | NPCCharacter) => {
      try {
        // キャラクター向けの行動選択肢を固定値で生成
        const availableActions =
          await generateCharacterSpecificActions(character);

        // キャラクター固有の情報に基づく行動選択ロジック
        let actionText = "様子を見ている";

        if (availableActions.length > 0) {
          console.log(`🤖 ${character.name} の行動選択処理開始`);

          // 1. HP状態による優先行動の決定
          const hp =
            "derived" in character && character.derived
              ? (character.currentHP ?? character.derived.HP)
              : 100;
          const maxHp =
            "derived" in character && character.derived
              ? character.derived.HP
              : 100;
          const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 100;

          // HP低下時は安全な行動を優先
          if (hpPercentage < 30) {
            const safeActions = availableActions.filter(
              (action) =>
                action.includes("休息") ||
                action.includes("治療") ||
                action.includes("安全") ||
                action.includes("慎重"),
            );
            if (safeActions.length > 0) {
              actionText = safeActions[0];
              console.log(
                `💔 ${character.name} HP低下により安全行動選択: ${actionText}`,
              );
            }
          }
          // HP正常時は通常の行動選択
          else {
            // 2. 職業による行動優先度
            const profession = character.profession?.toLowerCase() || "";
            let preferredActions: string[] = [];

            if (profession.includes("戦士") || profession.includes("fighter")) {
              preferredActions = availableActions.filter(
                (action) =>
                  action.includes("力技") ||
                  action.includes("積極的") ||
                  action.includes("武器") ||
                  action.includes("戦術") ||
                  action.includes("前進"),
              );
            } else if (
              profession.includes("魔法使い") ||
              profession.includes("mage")
            ) {
              preferredActions = availableActions.filter(
                (action) =>
                  action.includes("知識") ||
                  action.includes("分析") ||
                  action.includes("研究") ||
                  action.includes("魔法") ||
                  action.includes("呪文"),
              );
            } else if (
              profession.includes("盗賊") ||
              profession.includes("rogue")
            ) {
              preferredActions = availableActions.filter(
                (action) =>
                  action.includes("隠密") ||
                  action.includes("情報") ||
                  action.includes("敏捷性") ||
                  action.includes("観察") ||
                  action.includes("調べる"),
              );
            } else if (
              profession.includes("僧侶") ||
              profession.includes("cleric")
            ) {
              preferredActions = availableActions.filter(
                (action) =>
                  action.includes("治療") ||
                  action.includes("仲間") ||
                  action.includes("祈り") ||
                  action.includes("祝福") ||
                  action.includes("チェック"),
              );
            }

            // 3. 能力値による行動選択（高い能力値の行動を優先）
            if (
              preferredActions.length === 0 &&
              "attributes" in character &&
              character.attributes
            ) {
              const attrs = character.attributes;
              const highestStat = Math.max(
                attrs.strength || 0,
                attrs.dexterity || 0,
                attrs.intelligence || 0,
                attrs.wisdom || 0,
                attrs.charisma || 0,
              );

              if (attrs.strength === highestStat && attrs.strength > 12) {
                preferredActions = availableActions.filter(
                  (action) =>
                    action.includes("力技") || action.includes("積極的"),
                );
              } else if (
                attrs.intelligence === highestStat &&
                attrs.intelligence > 12
              ) {
                preferredActions = availableActions.filter(
                  (action) =>
                    action.includes("知識") || action.includes("分析"),
                );
              } else if (
                attrs.dexterity === highestStat &&
                attrs.dexterity > 12
              ) {
                preferredActions = availableActions.filter(
                  (action) =>
                    action.includes("敏捷性") || action.includes("隠密"),
                );
              } else if (attrs.wisdom === highestStat && attrs.wisdom > 12) {
                preferredActions = availableActions.filter(
                  (action) =>
                    action.includes("直感") || action.includes("観察"),
                );
              } else if (
                attrs.charisma === highestStat &&
                attrs.charisma > 12
              ) {
                preferredActions = availableActions.filter(
                  (action) =>
                    action.includes("交渉") || action.includes("説得"),
                );
              }
            }

            // 4. 最終的な行動決定
            if (preferredActions.length > 0) {
              actionText =
                preferredActions[
                  Math.floor(Math.random() * preferredActions.length)
                ];
              console.log(`⚡ ${character.name} 優先行動選択: ${actionText}`);
            } else {
              // フォールバック: 利用可能な行動からランダム選択
              actionText =
                availableActions[
                  Math.floor(Math.random() * availableActions.length)
                ];
              console.log(
                `🎲 ${character.name} ランダム行動選択: ${actionText}`,
              );
            }
          }

          console.log(`✅ ${character.name} 最終選択行動: ${actionText}`);
        }

        const action: CharacterAction = {
          characterId: character.id,
          characterName: character.name,
          characterType: "PC",
          actionText,
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          turnState: {
            ...prev.turnState,
            actionsThisTurn: [...prev.turnState.actionsThisTurn, action],
            awaitingCharacters: prev.turnState.awaitingCharacters.filter(
              (id) => id !== character.id,
            ),
          },
        }));

        // システムメッセージでプレイヤーキャラクターアクションを記録
        handleAddSystemMessage(
          `🎭 ${character.name}（AIが代理決定）: ${actionText}`,
        );
      } catch (error) {
        console.error(
          `プレイヤーキャラクターアクションエラー (${character.name}):`,
          error,
        );
        // エラーの場合はデフォルトアクション
        const defaultAction: CharacterAction = {
          characterId: character.id,
          characterName: character.name,
          characterType: "PC",
          actionText: "様子を見ている",
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          turnState: {
            ...prev.turnState,
            actionsThisTurn: [...prev.turnState.actionsThisTurn, defaultAction],
            awaitingCharacters: prev.turnState.awaitingCharacters.filter(
              (id) => id !== character.id,
            ),
          },
        }));

        handleAddSystemMessage(
          `🎭 ${character.name}（AIが代理決定）: 様子を見ている`,
        );
      }
    },
    [generateCharacterSpecificActions, handleAddSystemMessage],
  );

  const processTurnCompletion = useCallback(async () => {
    // ターン完了の処理
    handleAddSystemMessage(
      `\n🔄 ターン ${uiState.turnState.currentTurn} 完了\n`,
    );

    // 全アクションの要約をAIに生成させる
    await generateTurnSummary();

    // 次のターンを開始
    setTimeout(() => startNextTurn(), 2000);
  }, [uiState.turnState.currentTurn]);

  const generateTurnSummary = useCallback(async () => {
    try {
      const actionsText = uiState.turnState.actionsThisTurn
        .map((action) => `${action.characterName}: ${action.actionText}`)
        .join("\n");

      // AI APIを使わず、固定のロジックでターン結果を生成
      const currentTurn = uiState.turnState.currentTurn;

      // 基本的なターン結果メッセージを固定値で生成
      let summaryMessage = `🎯 ターン${currentTurn}結果\n\n`;

      // 各キャラクターの行動を要約
      summaryMessage += `📋 実行された行動：\n${actionsText}\n\n`;

      // 場所に基づく簡単な結果説明
      const locationDescription = getLocationBasedResult(
        currentLocation,
        uiState.turnState.actionsThisTurn,
      );
      summaryMessage += `🌟 ${locationDescription}\n\n`;

      summaryMessage += `⚡ 次のターンの行動を選択してください。`;

      const gmMessage: ChatMessage = {
        id: uuidv4(),
        sender: "ゲームマスター",
        senderType: "gm",
        message: summaryMessage,
        timestamp: new Date(),
      };

      setUIState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, gmMessage],
      }));

      // 次のターンの行動選択肢を施設ベースで設定
      const currentBase = getCurrentBase();
      const locationActions = getLocationBasedActions(currentBase);

      if (locationActions.length > 0) {
        const actionObjects = locationActions.map((action, index) => ({
          id: `turn-${currentTurn + 1}-location-action-${Date.now()}-${index}`,
          type: "custom" as const,
          label: action,
          description: `${currentLocation}で${action}`,
          icon: getActionIcon(action),
          requiresTarget: false,
        }));

        setAvailableActions(actionObjects);
        console.log(
          `🔄 ターン完了後: 施設ベース行動選択肢 ${actionObjects.length} 個を設定`,
        );
      } else {
        // フォールバック: 基本的な探索行動
        const basicActions = [
          { name: "周囲を調べる", description: "現在地を詳しく調査する" },
          { name: "情報収集", description: "地域の情報を収集する" },
          { name: "準備を整える", description: "次の行動に向けて準備する" },
          { name: "休息する", description: "体力を回復する" },
        ];

        const actionObjects = basicActions.map((action, index) => ({
          id: `turn-${currentTurn + 1}-basic-action-${Date.now()}-${index}`,
          type: "custom" as const,
          label: action.name,
          description: action.description,
          icon: getActionIcon(action.name),
          requiresTarget: false,
        }));

        setAvailableActions(actionObjects);
        console.log(
          `🔄 フォールバック: 基本行動選択肢 ${actionObjects.length} 個を設定`,
        );
      }
    } catch (error) {
      console.error("ターン要約生成エラー:", error);
      handleAddSystemMessage(
        `⚠️ ターン ${uiState.turnState.currentTurn} の要約生成に失敗しました`,
      );
    }
  }, [
    uiState.turnState.currentTurn,
    uiState.turnState.actionsThisTurn,
    currentLocation,
    getCurrentBase,
    getLocationBasedActions,
    getActionIcon,
    handleAddSystemMessage,
  ]);

  const startNextTurn = useCallback(() => {
    const nextTurn = uiState.turnState.currentTurn + 1;
    // プレイヤーキャラクター（PC）のみをターン管理対象にする
    const characterIds = playerCharacters.map((c) => c.id);

    console.log(`🎯 ターン ${nextTurn} 開始準備:`);
    console.log(`  - プレイヤーキャラクター数: ${playerCharacters.length}`);
    console.log(`  - 待機対象キャラクターID: [${characterIds.join(", ")}]`);

    setUIState((prev) => ({
      ...prev,
      turnState: {
        currentTurn: nextTurn,
        actionsThisTurn: [],
        awaitingCharacters: characterIds, // プレイヤーキャラクターのみ
        isProcessingTurn: false,
      },
      isAwaitingActionSelection: true,
      actionSelectionPrompt: `ターン ${nextTurn}: チャット形式で行動を連絡、もしくはボタンで行動を選択してください`,
    }));

    handleAddSystemMessage(`\n🎯 ターン ${nextTurn} 開始！\n`);
  }, [uiState.turnState.currentTurn, playerCharacters, handleAddSystemMessage]);

  const checkTurnCompletion = useCallback(() => {
    console.log(`[ターン制] ターン完了チェック:`, {
      awaitingCharacters: uiState.turnState.awaitingCharacters.length,
      isProcessingTurn: uiState.turnState.isProcessingTurn,
      awaitingList: uiState.turnState.awaitingCharacters,
    });

    if (
      uiState.turnState.awaitingCharacters.length === 0 &&
      !uiState.turnState.isProcessingTurn
    ) {
      console.log(`[ターン制] 全キャラクターの行動完了、ターン完了処理を開始`);
      processTurnCompletion();
    } else {
      console.log(`[ターン制] まだ行動待ちのキャラクターがいるか、処理中です`);
    }
  }, [
    uiState.turnState.awaitingCharacters,
    uiState.turnState.isProcessingTurn,
    processTurnCompletion,
  ]);

  const handleSendMessage = useCallback(async () => {
    if (uiState.chatInput.trim()) {
      // 入力された行動の有効性をチェック
      const validationResult = validateActionInput(uiState.chatInput);

      const playerMessage: ChatMessage = {
        id: uuidv4(),
        sender: selectedCharacter?.name || "プレイヤー",
        senderType: "player",
        message: uiState.chatInput,
        timestamp: new Date(),
      };

      // プレイヤーメッセージを追加
      setUIState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, playerMessage],
        chatInput: "",
      }));

      // 有効性チェックの結果に基づいてフィードバックを表示
      if (!validationResult.isValid) {
        const validationMessage: ChatMessage = {
          id: uuidv4(),
          sender: "システム",
          senderType: "system",
          message: `⚠️ ${validationResult.reason}`,
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, validationMessage],
        }));

        return; // 無効な行動の場合は処理を終了
      }

      // 有効な行動の場合、フィードバックメッセージを表示（必要に応じて）
      if (validationResult.reason) {
        const feedbackMessage: ChatMessage = {
          id: uuidv4(),
          sender: "システム",
          senderType: "system",
          message: `💡 ${validationResult.reason}`,
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, feedbackMessage],
        }));
      }

      // 🎯 マイルストーン誘導機能: チャットメッセージを拡張
      try {
        const enhancementResult = await enhanceMessageWithMilestone(
          validationResult.normalizedAction,
          uiState.chatMessages,
        );

        // マイルストーン誘導メッセージがある場合は追加
        if (enhancementResult.guidanceMessage) {
          const guidanceMessage: ChatMessage = {
            id: uuidv4(),
            sender: "AI Game Master",
            senderType: "gm",
            message: `🎯 ${enhancementResult.guidanceMessage}`,
            timestamp: new Date(),
          };

          setUIState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages, guidanceMessage],
          }));
        }
      } catch (error) {
        console.warn("マイルストーン誘導生成エラー:", error);
      }

      // アクション選択状態をリセット
      setUIState((prev) => ({
        ...prev,
        isAwaitingActionSelection: false,
        actionSelectionPrompt: "",
      }));

      // ターン中の場合はプレイヤーアクションとして処理（即座にGM応答は生成しない）
      if (
        uiState.turnState.awaitingCharacters.includes(
          selectedCharacter?.id || "",
        )
      ) {
        // プレイヤーの行動をターン状態に記録（GM応答は全員の行動が揃ってから）
        processPlayerAction(validationResult.normalizedAction);
      } else {
        // セッション外の場合のみ即座にAI GM応答を生成
        generateAIGameMasterResponse(
          validationResult.normalizedAction,
          selectedCharacter,
          currentLocation,
          currentDay,
          actionCount,
          maxActionsPerDay,
        );
      }
    }
  }, [
    uiState.chatInput,
    uiState.turnState.awaitingCharacters,
    selectedCharacter,
    currentLocation,
    currentDay,
    actionCount,
    maxActionsPerDay,
    processPlayerAction,
    validateActionInput,
  ]);

  // ダイス結果処理
  const handleDiceRoll = useCallback((result: DiceRoll) => {
    console.log("Dice rolled:", result);
    setUIState((prev) => ({
      ...prev,
      lastDiceResult: {
        result: result.total,
        notation: result.dice,
        details: `ロール結果: ${result.rolls.join(", ")} | 合計: ${
          result.total
        } | 目的: ${result.purpose}`,
      },
      diceDialog: false,
    }));
  }, []);

  const handleSkillCheckResult = useCallback((result: SkillCheckResult) => {
    console.log("Skill check result:", result);
    setUIState((prev) => ({
      ...prev,
      lastDiceResult: {
        result: result.value,
        notation: `スキル判定`,
        details: `スキル判定: ${result.value} (${
          result.success ? "成功" : "失敗"
        })`,
      },
      skillCheckDialog: false,
    }));
  }, []);

  const handlePowerCheckResult = useCallback((result: PowerCheckResult) => {
    console.log("Power check result:", result);
    setUIState((prev) => ({
      ...prev,
      lastDiceResult: {
        result: result.powerLevel,
        notation: `パワー判定`,
        details: `パワー判定: ${result.powerLevel} (${
          result.success ? "成功" : "失敗"
        })`,
      },
      powerCheckDialog: false,
    }));
  }, []);

  const handleAIDiceRoll = useCallback(
    (result: DiceRoll) => {
      // AI制御ダイスの場合、現在のリクエスト情報を使用
      if (uiState.aiRequiredDice) {
        processDiceResult(result, uiState.aiRequiredDice);
      }
      setUIState((prev) => ({ ...prev, aiDiceDialog: false }));
    },
    [processDiceResult, uiState.aiRequiredDice],
  );

  // 拠点インタラクション
  const handleFacilityInteract = useCallback(
    (
      facility:
        | Inn
        | Shop
        | Armory
        | Temple
        | Guild
        | Blacksmith
        | OtherFacility,
    ) => {
      console.log("Facility interaction:", facility);
    },
    [],
  );

  // 場所変更ハンドラー
  const handleLocationChange = useCallback(
    (locationName: string) => {
      console.log(`[Debug] 場所変更: ${currentLocation} → ${locationName}`);
      setCurrentLocation(locationName);

      // 新しい場所の行動選択肢を読み込み
      const newBase = bases.find((base) => base.name === locationName);
      if (newBase?.availableActions && newBase.availableActions.length > 0) {
        const newActions: ActionChoice[] = newBase.availableActions.map(
          (action, index) => ({
            id: action.id || `location-change-action-${Date.now()}-${index}`,
            type: "custom",
            label: action.name,
            description: action.description,
            icon: getActionIcon(action.name),
            requiresTarget: false,
          }),
        );

        setUIState((prev) => ({
          ...prev,
          availableActions: newActions,
        }));

        console.log(
          `[Debug] 新しい場所 ${locationName} の行動選択肢を読み込み:`,
          newActions.length,
          "個",
        );
      }

      // システムメッセージを追加
      handleAddSystemMessage(`📍 ${locationName} に移動しました`);
    },
    [
      currentLocation,
      setCurrentLocation,
      bases,
      getActionIcon,
      handleAddSystemMessage,
    ],
  );

  // カスタムアクション実行
  // マイルストーン探索行動実行ハンドラ
  const handleExecuteMilestoneAction = useCallback(
    async (actionId: string) => {
      console.log("Executing milestone action:", actionId);

      try {
        // マイルストーン探索行動を取得
        // TODO: useMilestoneExplorationから実際のアクションを取得
        const mockAction = {
          id: actionId,
          type: "custom" as const,
          label: "マイルストーン関連行動",
          description: "マイルストーンに関連する探索行動を実行します",
          icon: "🎯",
          requiresTarget: false,
        };

        // 通常のアクション実行フローと同じ処理
        executeAction(mockAction);

        // Phase 2.5: マイルストーンチェックを実行
        // TODO: 実際のアクション結果を使用してマイルストーンをチェック
        const milestoneResults = await checkMilestonesAfterAction(
          {
            actionText: "マイルストーン関連探索行動",
            characterId: selectedCharacter?.id || "",
            location: currentLocation || "リバーベント街",
            dayNumber: currentDay,
            timeOfDay: "morning" as const,
            partyMembers: playerCharacters.map((pc) => ({
              id: pc.id,
              name: pc.name,
              currentHP: pc.derived?.HP || 0,
              maxHP: pc.derived?.HP || 0,
              currentMP: pc.derived?.MP,
              maxMP: pc.derived?.MP,
              level: 1,
              gold: 0,
            })),
            availableActions: [],
            inventory: [],
            statusEffects: [],
            recentEvents: [],
            campaignFlags: currentCampaign?.campaignFlags || {},
            questStates: [],
            environmentConditions: {
              weather: "clear",
              lighting: "bright",
              temperature: "normal",
              hazards: [],
            },
          },
          {
            success: true,
            result: "マイルストーン関連行動を実行しました",
            effects: [],
            consequenceEvents: [],
            gainedItems: [],
            lostItems: [],
            discoveredLocations: [],
            unlockedQuests: [],
            completedQuests: [],
            metCharacters: [],
            flagsSet: [],
            flagsUnset: [],
          },
        );

        // マイルストーン達成メッセージを追加
        if (milestoneResults.milestoneMessages.length > 0) {
          setUIState((prev) => ({
            ...prev,
            chatMessages: [
              ...prev.chatMessages,
              ...milestoneResults.milestoneMessages,
            ],
          }));
        }

        // 達成通知表示
        if (milestoneResults.shouldShowAchievement) {
          handleAddSystemMessage("🎯 マイルストーンが達成されました！");
        }
      } catch (error) {
        console.error("マイルストーンアクション実行エラー:", error);
        handleAddSystemMessage(
          "⚠️ マイルストーンアクションの実行に失敗しました",
        );
      }
    },
    [
      selectedCharacter?.id,
      currentLocation,
      currentDay,
      playerCharacters,
      currentCampaign?.campaignFlags,
      executeAction,
      checkMilestonesAfterAction,
      handleAddSystemMessage,
    ],
  );

  const handleExecuteAction = useCallback(
    (action: ActionChoice) => {
      console.log("Executing action:", action);

      // ターンベース中でプレイヤーが操作キャラクターでアクションを選択した場合
      if (
        uiState.isSessionStarted &&
        uiState.turnState.awaitingCharacters.includes(
          selectedCharacter?.id || "",
        )
      ) {
        processPlayerAction(action.label);

        // アクション選択状態をリセット
        setUIState((prev) => ({
          ...prev,
          isAwaitingActionSelection: false,
          actionSelectionPrompt: "",
          availableActions: [],
        }));
      } else {
        // 通常のアクション実行
        executeAction(action);
      }
    },
    [
      uiState.isSessionStarted,
      uiState.turnState.awaitingCharacters,
      selectedCharacter,
      processPlayerAction,
      executeAction,
    ],
  );

  // Gemini APIを使用したAIゲームマスター応答生成（早期定義）
  const generateAIGameMasterResponse = useCallback(
    async (
      playerAction: string,
      character: TRPGCharacter | NPCCharacter,
      location: string,
      day: number,
      actions: number,
      maxActions: number,
    ) => {
      try {
        const provider =
          localStorage.getItem("selected-ai-provider") || "gemini";

        const prompt = `あなたはTRPGのゲームマスターです。プレイヤーの行動に対して構造化された応答をしてください。

現在の状況:
- 場所: ${location || "リバーベント街"}
- 日数: ${day}日目
- キャラクター: ${character?.name || "冒険者"}
- 残り行動回数: ${maxActions - actions}回

プレイヤーの行動: "${playerAction}"

以下の形式で応答してください：

【GM応答】
${character?.name || "冒険者"}が${playerAction}を行います。
（結果の簡潔な描写）

【次の行動選択肢】
🎯 行動A - 具体的な行動の説明
🎯 行動B - 具体的な行動の説明
🎯 行動C - 具体的な行動の説明

【ステータス】
📍 場所: ${location || "リバーベント街"} | 🗓️ ${day}日目 | ⚡ 残り行動: ${
          maxActions - actions
        }回`;

        // AI APIにリクエスト送信
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/ai/assist`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              context: {
                campaign: currentCampaign,
                location,
                day,
                character,
                action: playerAction,
              },
              provider,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`AI API エラー: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse =
          data.response || "【GM】 応答を生成できませんでした。";

        const gmMessage: ChatMessage = {
          id: uuidv4(),
          sender: "AIゲームマスター",
          senderType: "gm",
          message: aiResponse.trim(),
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, gmMessage],
        }));

        // AIレスポンスから行動選択肢をパースして抽出
        setTimeout(() => {
          parseAndUpdateActionsFromMessage(aiResponse);
        }, 100);

        // ユーザー操作キャラクター固有の行動選択肢を設定
        if (character) {
          console.log(
            `🎯 AI応答後: ${character.name} 固有の行動選択肢を生成中...`,
          );

          try {
            // キャラクター固有の行動選択肢を生成
            const characterActions =
              await generateCharacterSpecificActions(character);

            const actionObjects = characterActions.map((action, index) => ({
              id: `ai-response-action-${Date.now()}-${index}`,
              type: "custom" as const,
              label: action,
              description: `${character.name}の行動: ${action}`,
              icon: getActionIcon(action),
              requiresTarget: false,
            }));

            setAvailableActions(actionObjects);
            console.log(
              `✅ AI応答後: ${character.name} 固有行動選択肢設定完了:`,
              actionObjects.length,
              "個",
            );

            // アクション選択待ち状態を有効にする
            setUIState((prev) => ({
              ...prev,
              isAwaitingActionSelection: true,
              actionSelectionPrompt:
                "チャット形式で行動を連絡、もしくはボタンで行動を選択してください",
            }));
          } catch (error) {
            console.error(
              `❌ AI応答後の ${character.name} 行動選択肢生成エラー:`,
              error,
            );

            // エラー時のフォールバック: AIレスポンスから抽出
            const extractedActions = extractActionsFromAIResponse(aiResponse);

            if (extractedActions.length > 0) {
              console.log(
                "🔄 フォールバック: AIから抽出されたアクション:",
                extractedActions,
              );
              const actionObjects = extractedActions.map((action, index) => ({
                id: `ai-fallback-action-${Date.now()}-${index}`,
                type: "custom" as const,
                label: action,
                description: action,
                icon: getActionIcon(action),
                requiresTarget: false,
              }));

              setAvailableActions(actionObjects);

              // アクション選択待ち状態を有効にする
              setUIState((prev) => ({
                ...prev,
                isAwaitingActionSelection: true,
                actionSelectionPrompt:
                  "チャット形式で行動を連絡、もしくはボタンで行動を選択してください",
              }));
            }
          }
        }
      } catch (error) {
        console.error("AI応答生成エラー:", error);

        // ユーザーに実際のエラーを表示
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorSystemMessage: ChatMessage = {
          id: uuidv4(),
          sender: "システム",
          senderType: "system",
          message: `❌ AI応答生成エラー: ${errorMessage}\n\nプレイヤー行動: "${playerAction}"\n\n解決方法:\n1. APIキーを確認\n2. プロキシサーバーの接続を確認\n3. しばらく待ってから再試行`,
          timestamp: new Date(),
        };

        setUIState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, errorSystemMessage],
        }));
      }
    },
    [
      currentCampaign,
      extractActionsFromAIResponse,
      getActionIcon,
      generateCharacterSpecificActions,
    ],
  );

  // 場所に応じた案内メッセージを生成するヘルパー関数
  const generateLocationGuidanceMessage = useCallback(
    (base: BaseLocation | null, location: string): string => {
      let guidance = `あなたは今、**${location}**にいます。\n\n`;

      if (!base?.facilities) {
        // 一般的な場所の場合
        guidance += "🔍 探索をすると、何かが見つかるかもしれません。";
        return guidance;
      }

      // 拠点の場合、施設に応じた案内を追加
      const facilityMessages: string[] = [];

      if (base.facilities.inn) {
        facilityMessages.push(
          "🏨 街中に宿屋が見えます。休憩をしても良いかもしれませんね。",
        );
      }

      if (base.facilities.shops && base.facilities.shops.length > 0) {
        facilityMessages.push(
          "🛒 商店が営業しています。装備品の購入や売却ができそうです。",
        );
      }

      if (base.facilities.armory) {
        facilityMessages.push(
          "⚔️ 武器屋が見えています。装備を整えるのも良いかもしれませんよ。",
        );
      }

      if (base.facilities.temple) {
        facilityMessages.push(
          "⛪ 神殿があります。治療や祝福を受けることができそうです。",
        );
      }

      if (base.facilities.guild) {
        facilityMessages.push(
          "🏛️ ギルドの建物があります。クエストや情報が得られるかもしれません。",
        );
      }

      if (base.facilities.blacksmith) {
        facilityMessages.push(
          "🔨 鍛冶屋の煙が上がっています。装備の修理や強化ができそうです。",
        );
      }

      if (facilityMessages.length > 0) {
        guidance += facilityMessages.join("\n");
      } else {
        guidance += "🔍 探索をすると、何かが見つかるかもしれません。";
      }

      return guidance;
    },
    [],
  );

  // 🤖 汎用AI PC会話生成関数（任意のキャラクター対応）
  const generateAIPCDialogue = useCallback(
    async (context: string) => {
      console.log("🤖 汎用AI PC会話生成中（全キャラクター対応）...");

      try {
        const otherPCs = playerCharacters.filter(
          (pc) => pc.id !== selectedCharacter?.id,
        );
        if (otherPCs.length === 0) {
          console.log("⚠️ 他のPCが存在しないため、AI PC会話をスキップ");
          return;
        }

        console.log(
          `📊 対象PC数: ${otherPCs.length}人 (${otherPCs.map((pc) => pc.name).join(", ")})`,
        );

        // 現在の状況情報を詳細に収集
        const currentBase = getCurrentBase();
        const sessionContext = {
          campaignTitle: currentCampaign?.title || "TRPGセッション",
          campaignSynopsis: currentCampaign?.synopsis || "",
          currentLocation: currentLocation,
          currentDay: currentDay,
          actionCount: actionCount,
          maxActions: maxActionsPerDay,
          situation: context || "行動選択待ち",
          baseInfo: currentBase
            ? {
                name: currentBase.name,
                type: currentBase.type,
                description: currentBase.description,
              }
            : null,
        };

        console.log("📋 セッションコンテキスト:", sessionContext);

        // AI PC会話を順次生成（最大2人まで、処理負荷を考慮）
        const pcToProcess = otherPCs.slice(0, 2);

        for (let i = 0; i < pcToProcess.length; i++) {
          const character = pcToProcess[i];

          setTimeout(
            async () => {
              try {
                console.log(
                  `🎭 ${character.name}(${character.profession})の会話をAI生成中...`,
                );

                // 状況説明を動的に生成
                const situationDescription = `${sessionContext.campaignTitle}の${sessionContext.currentDay}日目、
現在地「${sessionContext.currentLocation}」での${sessionContext.situation}の場面。
行動回数: ${sessionContext.actionCount}/${sessionContext.maxActions}`;

                // 包括的なコンテキスト情報を収集
                const currentBase = getCurrentBase();

                // 現在アクティブなエネミー情報を取得
                const activeEnemies = uiState.activeEnemies || [];

                // 現在のイベント情報を取得（セッションログや状態から判定）
                const activeEvent = uiState.currentEvent || null;

                // 現在のトラップ情報を取得
                const activeTrap = uiState.activeTrap || null;

                // AIに会話を生成させる（包括的パラメータ）
                const response = await aiAgentApi.generateAIPCDialogue({
                  characterName: character.name,
                  characterInfo: character,
                  currentSituation: situationDescription,
                  currentLocation: sessionContext.currentLocation,
                  sessionContext: sessionContext.campaignSynopsis,
                  playerCharacterName: selectedCharacter?.name || "",
                  // 🎯 包括的なコンテキスト情報
                  allPlayerCharacters: playerCharacters,
                  currentBaseInfo: currentBase,
                  activeEvent: activeEvent,
                  activeEnemies: activeEnemies,
                  activeTrap: activeTrap,
                  campaignInfo: currentCampaign || undefined,
                  currentDay: sessionContext.currentDay,
                  actionCount: sessionContext.actionCount,
                  maxActionsPerDay: sessionContext.maxActions,
                  currentSession: {
                    day: sessionContext.currentDay,
                    location: sessionContext.currentLocation,
                    baseInfo: currentBase,
                  },
                });

                if (response.status === "success" && response.data?.dialogue) {
                  const aiPCMessage: ChatMessage = {
                    id: uuidv4(),
                    sender: character.name,
                    senderType: "ai_pc",
                    message: `💬 ${response.data.dialogue}`,
                    timestamp: new Date(),
                  };

                  setUIState((prev) => ({
                    ...prev,
                    chatMessages: [...prev.chatMessages, aiPCMessage],
                  }));

                  console.log(
                    `✅ ${character.name}のAI生成会話完了: "${response.data.dialogue}"`,
                  );
                } else {
                  console.warn(
                    `⚠️ ${character.name}の会話生成失敗、汎用フォールバック使用`,
                  );

                  // 汎用フォールバック（キャラクター情報を活用）
                  const fallbackMessage: ChatMessage = {
                    id: uuidv4(),
                    sender: character.name,
                    senderType: "ai_pc",
                    message: `💬 ${selectedCharacter?.name || "みんな"}、${character.profession}の視点から何かアドバイスできるかも`,
                    timestamp: new Date(),
                  };

                  setUIState((prev) => ({
                    ...prev,
                    chatMessages: [...prev.chatMessages, fallbackMessage],
                  }));
                }
              } catch (error) {
                console.error(`❌ ${character.name}の会話生成エラー:`, error);

                // 汎用エラーフォールバック
                const errorFallbackMessage: ChatMessage = {
                  id: uuidv4(),
                  sender: character.name,
                  senderType: "ai_pc",
                  message: `💬 ${selectedCharacter?.name || "チーム"}、一緒に考えよう`,
                  timestamp: new Date(),
                };

                setUIState((prev) => ({
                  ...prev,
                  chatMessages: [...prev.chatMessages, errorFallbackMessage],
                }));
              }
            },
            (i + 1) * 2500,
          ); // 2.5秒間隔で表示（API処理時間を考慮）
        }
      } catch (error) {
        console.error("❌ 汎用AI PC会話生成エラー:", error);
      }
    },
    [
      playerCharacters,
      selectedCharacter,
      currentLocation,
      currentDay,
      currentCampaign,
      actionCount,
      maxActionsPerDay,
      getCurrentBase,
    ],
  );

  // シンプルな行動案内生成（固定値版）
  const generateSimpleActionGuidance = useCallback(async () => {
    console.log("📊 行動案内メッセージを生成中...");

    try {
      const currentBase = getCurrentBase();

      // ターン・行動回数情報
      const turnInfo = `**${currentDay}日目、${actionCount + 1}回目の行動 (${actionCount + 1}/${maxActionsPerDay})**`;

      // 選択中のキャラクターの行動可能状態
      const characterStatus = selectedCharacter
        ? `**${selectedCharacter.name}**: 行動可能`
        : "**キャラクターを選択してください**";

      // 操作案内
      const operationGuide = "📱 右パネルの探索・拠点のボタンから行動を選択！";

      // 場所に応じた案内メッセージ
      const locationGuidance = generateLocationGuidanceMessage(
        currentBase,
        currentLocation,
      );

      // 統合メッセージ
      const guidanceMessage = `${turnInfo}\n\n${characterStatus}\n\n${operationGuide}\n\n${locationGuidance}`;

      const actionGuidanceMessage: ChatMessage = {
        id: uuidv4(),
        sender: "システム",
        senderType: "system",
        message: guidanceMessage,
        timestamp: new Date(),
      };

      setUIState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, actionGuidanceMessage],
      }));

      console.log("✅ 行動案内メッセージ生成完了");

      // 🎯 NEW: システムメッセージ後にAI PC会話を生成
      setTimeout(() => {
        generateAIPCDialogue(currentLocation);
      }, 1000);

      // ユーザー操作キャラクター固有の行動選択肢を設定
      if (selectedCharacter) {
        console.log(`🎯 ${selectedCharacter.name} 固有の行動選択肢を生成中...`);

        try {
          // キャラクター固有の行動選択肢を生成
          const characterActions =
            await generateCharacterSpecificActions(selectedCharacter);

          const actionObjects = characterActions.map((action, index) => ({
            id: `character-action-${Date.now()}-${index}`,
            type: "custom" as const,
            label: action,
            description: `${selectedCharacter.name}の行動: ${action}`,
            icon: getActionIcon(action),
            requiresTarget: false,
          }));

          setAvailableActions(actionObjects);
          console.log(
            `✅ ${selectedCharacter.name} 固有行動選択肢設定完了:`,
            actionObjects.length,
            "個",
          );
        } catch (error) {
          console.error(
            `❌ ${selectedCharacter.name} 行動選択肢生成エラー:`,
            error,
          );

          // エラー時のフォールバック: 基本行動
          const basicActions = [
            { name: "周囲を調べる", description: "現在地を詳しく調査する" },
            { name: "情報収集", description: "地域の情報を収集する" },
            { name: "準備を整える", description: "次の行動に向けて準備する" },
            { name: "休息する", description: "体力を回復する" },
          ];

          const actionObjects = basicActions.map((action, index) => ({
            id: `fallback-action-${Date.now()}-${index}`,
            type: "custom" as const,
            label: action.name,
            description: action.description,
            icon: getActionIcon(action.name),
            requiresTarget: false,
          }));

          setAvailableActions(actionObjects);
          console.log(
            "🔄 フォールバック行動選択肢を設定:",
            actionObjects.length,
            "個",
          );
        }
      } else {
        // キャラクターが選択されていない場合の基本行動
        const basicActions = [
          { name: "周囲を調べる", description: "現在地を詳しく調査する" },
          { name: "情報収集", description: "地域の情報を収集する" },
          { name: "準備を整える", description: "次の行動に向けて準備する" },
          { name: "休息する", description: "体力を回復する" },
        ];

        const actionObjects = basicActions.map((action, index) => ({
          id: `no-character-action-${Date.now()}-${index}`,
          type: "custom" as const,
          label: action.name,
          description: action.description,
          icon: getActionIcon(action.name),
          requiresTarget: false,
        }));

        setAvailableActions(actionObjects);
        console.log(
          "⚠️ キャラクター未選択のため基本行動選択肢を設定:",
          actionObjects.length,
          "個",
        );
      }
    } catch (error) {
      console.error("❌ 行動案内生成エラー:", error);
      handleAddSystemMessage("⚠️ 行動案内の生成中にエラーが発生しました。");
    }
  }, [
    getCurrentBase,
    generateLocationGuidanceMessage,
    generateCharacterSpecificActions,
    getActionIcon,
    currentDay,
    actionCount,
    maxActionsPerDay,
    selectedCharacter,
    currentLocation,
    handleAddSystemMessage,
  ]);

  // AIゲームマスターセッション開始
  const handleStartAISession = useCallback(async () => {
    // キャラクター選択チェック
    if (!selectedCharacter) {
      handleAddSystemMessage(
        "❌ セッションを開始するには、キャラクターを選択してください。",
      );
      return;
    }

    if (playerCharacters.length < 1) {
      handleAddSystemMessage("❌ 最低1人のプレイヤーキャラクターが必要です。");
      return;
    }

    // 開始場所チェック
    if (!hasValidStartingLocation()) {
      handleAddSystemMessage(
        "❌ ゲーム開始場所が設定されていません。開始場所設定ダイアログから設定してください。",
      );
      // 開始場所設定ダイアログを自動で開く
      handleOpenStartingLocationDialog();
      return;
    }

    // 設定された開始場所を使用
    const startingLocation = currentCampaign?.startingLocation;
    const currentLocationName = startingLocation?.name || "リバーベント街";
    if (startingLocation) {
      setCurrentLocation(startingLocation.name);
    }

    // セッション開始状態を設定
    setUIState((prev) => ({
      ...prev,
      isSessionStarted: true,
      sessionStatus: "active", // タブを有効化するために追加
      turnState: {
        currentTurn: 1,
        actionsThisTurn: [],
        awaitingCharacters: playerCharacters.map((pc) => pc.id),
        isProcessingTurn: false,
      },
    }));

    // セッション開始メッセージ
    handleAddSystemMessage(
      `🎲 AIセッション開始！\n操作キャラクター: ${
        selectedCharacter.name
      }\n参加者: ${playerCharacters.map((pc) => pc.name).join(", ")}`,
    );

    console.log("[Debug] セッション開始:", {
      selectedCharacter: selectedCharacter.name,
      playerCharacters: playerCharacters.map((pc) => pc.name),
      location: currentLocationName,
    });

    try {
      // AI APIを使用してセッション開始メッセージを生成
      const provider = localStorage.getItem("selected-ai-provider") || "gemini";

      const prompt = `TRPGセッション開始。簡潔に状況説明してください。

場所: ${currentLocationName}
キャラクター: ${playerCharacters.map((pc) => pc.name).join(", ")}

以下の形式で簡潔に：

🎲 ${currentLocationName}でセッション開始！

🌟 [場所の簡潔な描写（1-2行）]

冒険の始まりです。`;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai-agent/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            context: {
              campaign: currentCampaign,
              location: currentLocationName,
              day: currentDay,
              characters: playerCharacters,
            },
            provider,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      const gmMessage: ChatMessage = {
        id: uuidv4(),
        sender: "AIゲームマスター",
        senderType: "gm",
        message:
          data.response ||
          `🎲 ${currentLocationName}でセッション開始！\n\n🌟 冒険者たちが集まり、新たな物語が始まろうとしています。\n\n冒険の始まりです。`,
        timestamp: new Date(),
      };

      setUIState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, gmMessage],
      }));

      // セッション開始後、少し間を置いてからシンプルな行動案内を生成
      setTimeout(async () => {
        try {
          // シンプルな行動案内を生成
          await generateSimpleActionGuidance();

          // ターンベースシステムを初期化
          initializeTurn();

          // アクション選択待ち状態を有効にする
          setUIState((prev) => ({
            ...prev,
            isAwaitingActionSelection: true,
            actionSelectionPrompt:
              "チャット形式で行動を連絡、もしくはボタンで行動を選択してください",
          }));
        } catch (error) {
          console.error("行動案内処理でエラー:", error);
          handleAddSystemMessage(
            "⚠️ 行動案内の準備中にエラーが発生しました。基本的な選択肢を使用します。",
          );
        }
      }, 2000); // 2秒待機してから案内を表示
    } catch (error) {
      console.error("AI APIエラー:", error);

      // ユーザーに実際のエラーを表示（APIキーは表示しない）
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const provider = localStorage.getItem("selected-ai-provider") || "なし";
      const hasApiKey = !!localStorage.getItem("gemini-api-key");

      const gmMessage: ChatMessage = {
        id: uuidv4(),
        sender: "システム",
        senderType: "system",
        message: `❌ AI APIエラーが発生しました: ${errorMessage}\n\n設定を確認してください:\n1. AIプロバイダー: ${provider}\n2. APIキー: ${
          hasApiKey ? "設定済み" : "未設定"
        }\n3. プロキシサーバー接続: 確認が必要`,
        timestamp: new Date(),
      };

      setUIState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, gmMessage],
      }));
    }

    console.log("🎮 AIゲームマスターセッション開始");
  }, [
    bases,
    setCurrentLocation,
    currentCampaign,
    currentDay,
    playerCharacters,
    generateSimpleActionGuidance,
    initializeTurn,
    handleAddSystemMessage,
  ]);

  // ===== デバッグアクション =====

  // デバッグパネルの表示/非表示切り替え
  const toggleDebugPanel = useCallback(() => {
    setUIState((prev) => ({ ...prev, showDebugPanel: !prev.showDebugPanel }));
  }, []);

  // デバッグアクションの実装
  const debugActions = useMemo(
    () => ({
      checkEncounters: () => {
        console.log("[Debug] 遭遇チェック実行");
        handleAddSystemMessage("🔍 遭遇チェックを実行しました");

        // 基本的な遭遇判定ロジック（シンプル版）
        const encounterChance = Math.random();
        if (encounterChance < 0.3) {
          const encounterTypes = ["NPC", "エネミー", "イベント"];
          const encounterType =
            encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
          handleAddSystemMessage(`⚡ ${encounterType}との遭遇が発生しました！`);
        } else {
          handleAddSystemMessage("✅ 遭遇はありませんでした");
        }
      },

      simulateEnemyMovement: () => {
        console.log("[Debug] エネミー移動シミュレーション実行");
        handleAddSystemMessage("🗡️ エネミーの移動をシミュレーションしました");

        // エネミーの位置更新シミュレーション
        enemies.forEach((enemy) => {
          const locations = bases.map((base) => base.name);
          if (locations.length > 0) {
            const newLocation =
              locations[Math.floor(Math.random() * locations.length)];
            console.log(`[Debug] ${enemy.name} が ${newLocation} に移動`);
          }
        });
      },

      reloadTestData: async () => {
        console.log("[Debug] テストデータリロード開始");
        try {
          // 既存データクリア
          clearTestData();
          setUIState((prev) => ({
            ...prev,
            isSessionStarted: false,
            lockedCharacterId: null,
            chatMessages: [],
          }));

          // セッション状態リセット
          if (setSelectedCharacter) {
            setSelectedCharacter(null);
          }

          // まず状態をクリア
          setCurrentCampaign(null);

          // JSONから再ロード
          setTimeout(() => {
            console.log("[Debug] テストデータ適用開始");
            applyTestDataToLocalStorage();
            const newTestData = loadTestCampaignData();

            console.log("[Debug] ロードされたテストデータ:", {
              id: newTestData.id,
              title: newTestData.title,
              charactersCount: newTestData.characters?.length || 0,
              basesCount: newTestData.bases?.length || 0,
              npcsCount: newTestData.npcs?.length || 0,
              enemiesCount: newTestData.enemies?.length || 0,
            });

            // テストデータは既に正しい型なので、そのまま使用
            setCurrentCampaign(newTestData);

            // 詳細ログ
            console.log("[Debug] setCurrentCampaign実行完了");

            // 最初のPCキャラクターを自動選択
            if (newTestData.characters?.length > 0) {
              const firstPC = newTestData.characters.find(
                (c) => c.characterType === "PC",
              );
              console.log("[Debug] 最初のPCキャラクター:", firstPC?.name);
              if (firstPC && setSelectedCharacter) {
                setSelectedCharacter(firstPC);
              }
            }

            // 最初の拠点を設定
            if (newTestData.bases?.length > 0) {
              console.log("[Debug] 最初の拠点設定:", newTestData.bases[0].name);
              setCurrentLocation(newTestData.bases[0].name);
            }

            console.log("[Debug] テストデータリロード完了", newTestData);
            handleAddSystemMessage("🔄 テストデータをリロードしました");

            // 強制的にUIを更新（セッション開始状態はリセット）
            setUIState((prev) => ({
              ...prev,
              isSessionStarted: false,
              chatMessages: [
                ...prev.chatMessages,
                {
                  id: `system-${Date.now()}`,
                  sender: "システム",
                  senderType: "system",
                  message: `📊 データ詳細:\n- キャラクター: ${
                    newTestData.characters?.length || 0
                  }人\n- 拠点: ${newTestData.bases?.length || 0}箇所\n- NPC: ${
                    newTestData.npcs?.length || 0
                  }人\n- エネミー: ${newTestData.enemies?.length || 0}体`,
                  timestamp: new Date(),
                },
              ],
            }));
          }, 100);
        } catch (error) {
          console.error("[Debug] テストデータリロードエラー:", error);
          handleAddSystemMessage(
            "❌ テストデータのリロードに失敗しました: " +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      },

      loadEmptyCampaign: () => {
        console.log("[Debug] 空のキャンペーン作成開始");
        try {
          // 既存データクリア
          clearTestData();
          setUIState((prev) => ({
            ...prev,
            isSessionStarted: false,
            lockedCharacterId: null,
            chatMessages: [],
          }));

          // セッション状態リセット
          if (setSelectedCharacter) {
            setSelectedCharacter(null);
          }

          // 完全に空のキャンペーンを作成
          const emptyCampaign =
            createTrulyEmptyCampaign("新しいTRPGキャンペーン");
          setCurrentCampaign(emptyCampaign);

          // 空のキャンペーンでは現在地を設定しない
          // setCurrentLocation("未設定");

          console.log("[Debug] 空のキャンペーン作成完了", emptyCampaign);
          handleAddSystemMessage("🆕 新しい空のキャンペーンを作成しました");
        } catch (error) {
          console.error("[Debug] 空のキャンペーン作成エラー:", error);
          handleAddSystemMessage("❌ 空のキャンペーンの作成に失敗しました");
        }
      },

      exportDebugLog: () => {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          sessionData: {
            currentCampaign: currentCampaign?.title || "なし",
            selectedCharacter: selectedCharacter?.name || "なし",
            currentLocation,
            currentDay,
            actionCount,
            maxActionsPerDay,
            isSessionStarted: uiState.isSessionStarted,
          },
          characters: {
            pcs: playerCharacters.length,
            npcs: npcs.length,
            enemies: enemies.length,
          },
          uiState: {
            tabValue: uiState.tabValue,
            rightPanelTab: uiState.rightPanelTab,
            combatMode,
          },
          chatMessages: uiState.chatMessages.length,
          lastDiceResult: uiState.lastDiceResult,
        };

        console.log("=== TRPGセッション デバッグ情報 ===");
        console.log(debugInfo);
        console.log("==============================");

        handleAddSystemMessage("🖨️ デバッグログをコンソールに出力しました");
        return debugInfo;
      },
    }),
    [
      handleAddSystemMessage,
      enemies,
      bases,
      setCurrentCampaign,
      setSelectedCharacter,
      setCurrentLocation,
      currentCampaign,
      selectedCharacter,
      currentLocation,
      currentDay,
      actionCount,
      maxActionsPerDay,
      uiState,
      playerCharacters,
      npcs,
      combatMode,
    ],
  );

  // ===============================
  // 🎯 Phase 2: 構造化行動結果処理
  // ===============================

  return {
    // セッションデータ
    currentCampaign,
    developerMode,
    selectedCharacter,
    setSelectedCharacter,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    setCurrentLocation,
    combatMode,
    playerCharacters,
    npcs,
    enemies,
    bases,
    availableActions: uiState.availableActions,
    getCurrentBase,
    currentBaseImage,

    // UI状態
    uiState,

    // マイルストーン関連
    currentMilestone,
    activeMilestones,
    getMilestoneProgress,
    getMilestoneWarnings,
    getUrgentMilestoneNotification,
    showMilestoneWarning: uiState.showMilestoneWarning,
    milestoneWarningMessage: uiState.milestoneWarningMessage,
    milestoneNotificationQueue: uiState.milestoneNotificationQueue,

    // アクション選択状態
    isAwaitingActionSelection: uiState.isAwaitingActionSelection,
    actionSelectionPrompt: uiState.actionSelectionPrompt,

    // ターン管理状態
    turnState: uiState.turnState,
    initializeTurn,
    processPlayerAction,

    // 開始場所設定機能
    hasValidStartingLocation,
    handleOpenStartingLocationDialog,
    handleSetStartingLocation,

    // セッションアクション (Phase 2: 構造化処理)
    executeAction: handleExecuteAction,
    originalExecuteAction: executeAction,
    handleExecuteMilestoneAction,
    processStructuredActionResult,
    applyGameEffects,

    // Phase 3: ゲーム状態変更システム
    updateCharacterStatus,
    updateCharacterHP,
    updateCharacterMP,
    updatePartyGold,
    addInventoryItem,
    removeInventoryItem,
    setCampaignFlag,
    getCampaignFlag,
    checkClearConditions,

    advanceDay,
    saveSession,
    openAIAssist: handleStartAISession,
    handleLocationChange,

    // UIアクションハンドラー
    handleOpenDialog,
    handleCloseDialog,
    handleTabChange,
    handleChatInputChange,
    handleSendMessage,
    handleAddSystemMessage,
    handleDiceRoll,
    handleSkillCheckResult,
    handlePowerCheckResult,
    handleAIDiceRoll,
    handleFacilityInteract,

    // デバッグ機能
    toggleDebugPanel,
    debugActions,
  };
};

// フック関数外でカスタムイベントリスナーを設定
export const useDebugItemListener = (
  addInventoryItem: (itemId: string, quantity: number) => void,
) => {
  useEffect(() => {
    const handleDebugAddItem = (event: CustomEvent) => {
      const { itemId, quantity } = event.detail;
      console.log("🔧 デバッグ: アイテム追加", { itemId, quantity });
      addInventoryItem(itemId, quantity);
    };

    window.addEventListener(
      "debug-add-item",
      handleDebugAddItem as EventListener,
    );

    return () => {
      window.removeEventListener(
        "debug-add-item",
        handleDebugAddItem as EventListener,
      );
    };
  }, [addInventoryItem]);
};
