import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { currentCampaignState, developerModeState } from "../store/atoms";
import { useAIChatIntegration } from "./useAIChatIntegration";
import { useTRPGSession } from "./useTRPGSession";
import { ChatMessage } from "../components/trpg-session/ChatInterface";
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
  aiRequiredDice: any;

  // アクション選択状態
  isAwaitingActionSelection: boolean;
  actionSelectionPrompt: string;
  availableActions: ActionChoice[];

  // ターン管理状態
  turnState: TurnState;

  // 戦闘・難易度状態
  currentCombatSession: any;
  combatSessions: any[];
  currentDifficulty: any;
  recentCombatActions: any[];

  // デバッグパネル状態
  showDebugPanel: boolean;
}

// ビジネスロジックとUIの統合フック
export const useTRPGSessionUI = () => {
  const [currentCampaign, setCurrentCampaign] =
    useRecoilState(currentCampaignState);
  const [developerMode, setDeveloperMode] = useRecoilState(developerModeState);
  const { openAIAssist } = useAIChatIntegration();

  // TRPGセッションのコアロジック
  const sessionHookData = useTRPGSession();
  const {
    sessionState,
    sessionMessages,
    selectedCharacter,
    setSelectedCharacter,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    setCurrentLocation,
    combatMode,
    aiDiceRequest,
    initializeSession,
    getAvailableActions,
    executeAction,
    advanceDay,
    saveSession,
    processDiceResult,
  } = sessionHookData;

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
  });

  // TRPGセッションページでのテストデータ自動読み込み
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
  }, [currentCampaign, setCurrentCampaign]);

  // currentCampaignの変更を監視
  useEffect(() => {
    console.log("[Debug] currentCampaign変更検知:", {
      campaign: currentCampaign
        ? {
            id: currentCampaign.id,
            title: currentCampaign.title,
            charactersCount: currentCampaign.characters?.length || 0,
            basesCount: currentCampaign.bases?.length || 0,
          }
        : null,
    });
  }, [currentCampaign]);

  // データ取得（計算プロパティ）
  const playerCharacters =
    currentCampaign?.characters?.filter((c) => c.characterType === "PC") || [];
  const npcs = currentCampaign?.npcs || [];
  const enemies = currentCampaign?.enemies || [];
  const bases = currentCampaign?.bases || [];

  // デバッグ用ログ
  useEffect(() => {
    console.log("[Debug] データ計算結果:", {
      playerCharactersCount: playerCharacters.length,
      npcsCount: npcs.length,
      enemiesCount: enemies.length,
      basesCount: bases.length,
    });
  }, [playerCharacters, npcs, enemies, bases]);

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
  const getLocationBasedActions = useCallback((base: any): string[] => {
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
  }, []);

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
    (locationInfo: any) => {
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

  const processPlayerAction = useCallback(
    (actionText: string) => {
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

      // 他のプレイヤーキャラクターの自動行動を処理
      console.log(
        `🎯 ${selectedCharacter.name} 行動完了 - 他キャラクター処理をトリガー`,
      );
    },
    [selectedCharacter, handleAddSystemMessage],
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
  const getCharacterAbilityActions = useCallback((character: any): string[] => {
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
      character.skills.forEach((skill: any) => {
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
  }, []);

  // キャラクターの状態に基づく行動を取得
  const getStatusBasedActions = useCallback((character: any): string[] => {
    const statusActions: string[] = [];

    // HP状態による行動
    const hp =
      "derived" in character && character.derived
        ? (character.currentHP ?? character.derived.HP)
        : 100;
    const maxHp =
      "derived" in character && character.derived ? character.derived.HP : 100;

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
  }, []);

  // キャラクター個別の位置情報に基づく行動を取得
  const getCharacterLocationActions = useCallback(
    (character: any): { actions: string[]; location: string } => {
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
    async (character: any): Promise<string[]> => {
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
    async (character: any) => {
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

  const handleSendMessage = useCallback(() => {
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
  const handleDiceRoll = useCallback((result: any) => {
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
    (result: any) => {
      // AI制御ダイスの場合、現在のリクエスト情報を使用
      if (uiState.aiRequiredDice) {
        processDiceResult(result, uiState.aiRequiredDice);
      }
      setUIState((prev) => ({ ...prev, aiDiceDialog: false }));
    },
    [processDiceResult, uiState.aiRequiredDice],
  );

  // 拠点インタラクション
  const handleFacilityInteract = useCallback((facility: any) => {
    console.log("Facility interaction:", facility);
  }, []);

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
      character: any,
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
    (base: any, location: string): string => {
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

    // セッションアクション
    executeAction: handleExecuteAction,
    originalExecuteAction: executeAction,
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
