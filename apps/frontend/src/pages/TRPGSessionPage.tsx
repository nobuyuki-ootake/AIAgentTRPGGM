import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  TextField,
  Divider,
  Card,
  CardMedia,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  ListItemAvatar,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import {
  Bolt,
  Save,
  NavigateNext,
  CalendarToday,
  ShoppingCart,
  Forum,
  Backpack,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import {
  DiceD20Icon,
  QuestScrollIcon,
  DungeonIcon,
  GameMasterIcon,
  BaseIcon,
} from "../components/icons/TRPGIcons";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState, sessionStateAtom, developerModeState } from "../store/atoms";
import { AIAssistButton } from "../components/ui/AIAssistButton";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { v4 as uuidv4 } from "uuid";
import { 
  TRPGCharacter, 
  GameSession, 
  SessionCurrentState, 
  SpatialTrackingSystem, 
  EncounterRecord,
  TimeOfDay,
  PositionInfo,
  EncounterRule,
  CollisionDetectionConfig
} from "@novel-ai-assistant/types";
import ChatInterface, { ChatMessage, DiceRoll } from "../components/trpg-session/ChatInterface";
import DiceRollUI from "../components/trpg-session/DiceRollUI";
import CharacterDisplay from "../components/trpg-session/CharacterDisplay";
import SkillCheckUI, { SkillCheckResult } from "../components/trpg-session/SkillCheckUI";
import PowerCheckUI, { PowerCheckResult } from "../components/trpg-session/PowerCheckUI";
import { 
  loadTestCampaignData, 
  applyTestDataToLocalStorage, 
  clearTestData,
  isTestCampaign,
  getTestLocationOptions 
} from "../utils/testDataLoader";

// 行動選択の型定義
interface ActionChoice {
  id: string;
  type: "move" | "shop" | "talk" | "interact" | "skill" | "custom";
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresTarget?: boolean;
  targetType?: "location" | "npc" | "character" | "item";
}


// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const TRPGSessionPage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [sessionState, setSessionState] = useRecoilState(sessionStateAtom);
  const developerMode = useRecoilValue(developerModeState);
  
  // UI状態
  const [tabValue, setTabValue] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<TRPGCharacter | null>(null);
  const [diceDialog, setDiceDialog] = useState(false);
  const [skillCheckDialog, setSkillCheckDialog] = useState(false);
  const [powerCheckDialog, setPowerCheckDialog] = useState(false);
  
  // ゲーム状態
  const [currentDay, setCurrentDay] = useState(1);
  const [actionCount, setActionCount] = useState(0);
  const [maxActionsPerDay] = useState(5);
  const [currentLocation, setCurrentLocation] = useState("リバーベント街");
  const [availableActions, setAvailableActions] = useState<ActionChoice[]>([]);
  const [combatMode, setCombatMode] = useState(false);
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>([]);
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>([]);
  const [isSessionStarted, setIsSessionStarted] = useState(false); // 🔒 セッション開始フラグ
  const [lockedCharacterId, setLockedCharacterId] = useState<string | null>(null); // 🔒 固定されたキャラクターID

  const { openAIAssist } = useAIChatIntegration();

  // データ取得
  const playerCharacters = currentCampaign?.characters?.filter(c => c.characterType === "PC") || [];
  const npcs = currentCampaign?.npcs || [];
  const enemies = currentCampaign?.enemies || [];
  const worldBuilding = currentCampaign?.worldBuilding || {};
  const bases = worldBuilding.bases || [];

  // 現在の拠点のイラストURL取得
  const currentBaseImage = bases.find(base => base.name === currentLocation)?.imageUrl || 
    currentCampaign?.imageUrl || "/default-location.jpg";

  // セッション初期化
  useEffect(() => {
    if (!sessionState && currentCampaign) {
      const initialTimeOfDay: TimeOfDay = "morning";
      
      // 🎯 **詳細なセッション状態管理の初期化**
      const currentState: SessionCurrentState = {
        currentDay: 1,
        currentTimeOfDay: initialTimeOfDay,
        actionCount: 0,
        maxActionsPerDay: 5,
        currentLocation: currentLocation,
        currentLocationId: bases.find(base => base.name === currentLocation)?.id,
        activeCharacter: playerCharacters[0]?.id || "",
        partyLocation: {
          groupLocation: currentLocation,
          memberLocations: {},
          movementHistory: []
        },
        partyStatus: "exploring",
        activeEvents: [],
        completedEvents: [],
        triggeredEvents: []
      };

      // パーティーメンバーの初期位置設定
      playerCharacters.forEach(character => {
        currentState.partyLocation.memberLocations[character.id] = {
          location: currentLocation,
          timeArrived: new Date().toISOString(),
          isWithGroup: true
        };
      });

      // 🎯 **空間追跡システムの初期化**
      const spatialTracking: SpatialTrackingSystem = {
        currentPositions: {
          players: {},
          npcs: {},
          enemies: {}
        },
        collisionDetection: {
          enableSpatialCollision: true,
          enableTemporalCollision: true,
          collisionRadius: 100, // メートル
          timeWindow: 30, // 分
          automaticEncounters: true,
          encounterProbability: {
            npc: 0.3,
            enemy: 0.2,
            event: 0.25
          }
        },
        definedAreas: [],
        encounterRules: []
      };

      // プレイヤーキャラクターの初期位置設定
      playerCharacters.forEach(character => {
        spatialTracking.currentPositions.players[character.id] = {
          location: currentLocation,
          arrivalTime: new Date(),
          dayNumber: 1,
          timeOfDay: initialTimeOfDay,
          isActive: true,
          visibilityRange: 50,
          movementSpeed: 5
        };
      });

      // NPCの初期位置設定
      npcs.forEach(npc => {
        if (npc.location) {
          spatialTracking.currentPositions.npcs[npc.id] = {
            location: npc.location,
            arrivalTime: new Date(),
            dayNumber: 1,
            timeOfDay: initialTimeOfDay,
            isActive: true,
            visibilityRange: 30,
            movementSpeed: 3
          };
        }
      });

      // エネミーの初期位置設定
      enemies.forEach(enemy => {
        if (enemy.location) {
          spatialTracking.currentPositions.enemies[enemy.id] = {
            location: enemy.location,
            arrivalTime: new Date(),
            dayNumber: 1,
            timeOfDay: initialTimeOfDay,
            isActive: true,
            visibilityRange: 40,
            movementSpeed: 4
          };
        }
      });

      const newSession: GameSession = {
        id: uuidv4(),
        campaignId: currentCampaign.id,
        sessionNumber: (currentCampaign.sessions?.length || 0) + 1,
        title: `セッション ${(currentCampaign.sessions?.length || 0) + 1}`,
        date: new Date(),
        duration: 0,
        
        // 🎯 **新しい詳細状態管理**
        currentState,
        spatialTracking,
        encounterHistory: [],
        
        // レガシー互換性
        summary: "",
        npcsEncountered: [],
        combatEncounters: [],
        lootObtained: [],
        questProgress: {},
        playerNotes: {},
        gmNotes: "",
        recordingUrl: "",
      };
      
      setSessionState(newSession);
      setCurrentDay(1);
      setActionCount(0);
      
      // 🧪 テストキャンペーンの場合、データが不足していたら再ロード
      if (isTestCampaign(currentCampaign.id)) {
        const needsReload = !currentCampaign.characters || 
                           currentCampaign.characters.length < 2 ||
                           !currentCampaign.npcs ||
                           !currentCampaign.enemies ||
                           !currentCampaign.quests;
        
        if (needsReload) {
          console.log('📝 テストデータを再ロード...');
          applyTestDataToLocalStorage();
          // リロードして新しいデータを反映
          setTimeout(() => window.location.reload(), 100);
        }
      }
    }
    
    // デフォルトキャラクター選択（最初のPCキャラクター）
    if (!selectedCharacter && playerCharacters.length > 0) {
      setSelectedCharacter(playerCharacters[0]);
    }
  }, [sessionState, setSessionState, currentCampaign, selectedCharacter, playerCharacters, currentLocation, bases, npcs, enemies]);

  // ゲーム開始時のAI解説
  useEffect(() => {
    if (chatMessages.length === 0 && currentCampaign) {
      handleGameIntroduction();
    }
  }, [currentCampaign]);

  // 利用可能な行動の更新
  useEffect(() => {
    updateAvailableActions();
  }, [currentLocation, selectedCharacter, currentDay]);

  // ゲーム導入
  const handleGameIntroduction = async () => {
    await openAIAssist(
      "session-gm",
      {
        title: "ゲーム開始",
        description: "キャンペーンの導入を行います",
        defaultMessage: `キャンペーン「${currentCampaign?.title}」の導入を行ってください。
背景: ${currentCampaign?.synopsis}
現在地: ${currentLocation}
参加キャラクター: ${playerCharacters.map(c => c.name).join(", ")}`,
        onComplete: (result) => {
          if (result.content) {
            const introMessage: ChatMessage = {
              id: uuidv4(),
              sender: "ゲームマスター",
              senderType: "gm",
              message: result.content as string,
              timestamp: new Date(),
            };
            setChatMessages([introMessage]);
          }
        },
      },
      currentCampaign
    );
  };

  // AI主導で利用可能な行動を更新
  const updateAvailableActions = async () => {
    if (!currentCampaign || !selectedCharacter) {
      setAvailableActions([]);
      return;
    }

    // 🎮 **確実に移動選択肢を含むデフォルト行動を設定**
    // AIが失敗した場合のフォールバックとして、まず確実な行動選択肢を設定
    setDefaultActions();

    // AIによる追加の行動選択肢生成（オプション）
    try {
      await openAIAssist(
        "action-options",
        {
          title: "行動選択肢生成",
          description: "現在の状況に応じた行動選択肢をAIが提案します",
          defaultMessage: `TRPGセッションで、プレイヤーが取れる行動選択肢を3-5個提案してください。

**現在の状況:**
- 場所: ${currentLocation}
- キャラクター: ${selectedCharacter.name}
- 日付: ${currentDay}日目
- 行動回数: ${actionCount}/${maxActionsPerDay}

**キャンペーン背景:**
${currentCampaign.synopsis}

**本日のイベント:**
${currentCampaign.quests?.filter(q => q.scheduledDay === currentDay)
  .map(e => `- ${e.title}: ${e.description}`).join('\n') || '特別なイベントはありません'}

**利用可能なNPC:**
${npcs.map(npc => `- ${npc.name}: ${npc.description}`).join('\n')}

**利用可能な拠点:**
${bases.map(base => `- ${base.name}: ${base.description}`).join('\n')}

**重要**: 必ず移動アクション（type: "move"）を含めてください。

以下のJSON形式で、プレイヤーが選択できる行動を提案してください：
{
  "actions": [
    {
      "id": "unique-id",
      "label": "行動名",
      "description": "行動の詳細説明",
      "type": "move|talk|shop|interact|skill|investigate|custom",
      "icon": "move|talk|shop|interact|skill|investigate|custom",
      "priority": "high|medium|low"
    }
  ]
}`,
          onComplete: (result) => {
            try {
              const aiResponse = typeof result.content === 'string' 
                ? JSON.parse(result.content) 
                : result.content;
              
              if (aiResponse.actions && Array.isArray(aiResponse.actions)) {
                const aiActions: ActionChoice[] = aiResponse.actions.map((action: any, index: number) => ({
                  id: action.id || `ai-action-${index}`,
                  type: action.type || "custom",
                  label: action.label || "行動",
                  description: action.description || "",
                  icon: getActionIcon(action.icon || action.type),
                  requiresTarget: action.type === "move" || action.type === "talk",
                  targetType: action.type === "move" ? "location" : action.type === "talk" ? "npc" : undefined,
                }));
                
                // 🎯 デフォルト行動（移動含む）とAI提案行動をマージ
                const testLocations = getTestLocationOptions();
                const moveActions = testLocations
                  .filter(location => location.name !== currentLocation)
                  .map(location => ({
                    id: `move-to-${location.id}`,
                    type: "move" as const,
                    label: `${location.name}へ移動`,
                    description: `${location.description}へ移動する`,
                    icon: <DungeonIcon />,
                  }));

                const basicActions = [
                  {
                    id: "talk",
                    type: "talk" as const,
                    label: "NPC会話",
                    description: "NPCと会話する",
                    icon: <Forum />,
                    requiresTarget: true,
                    targetType: "npc" as const,
                  },
                  {
                    id: "investigate",
                    type: "skill" as const,
                    label: "調査",
                    description: "周囲を調査する",
                    icon: <DiceD20Icon />,
                  },
                ];

                // AI提案と基本行動をマージ（重複排除）
                const allActions = [...moveActions, ...basicActions, ...aiActions.filter(ai => 
                  !moveActions.some(move => move.label === ai.label) && 
                  !basicActions.some(basic => basic.label === ai.label)
                )];
                
                setAvailableActions(allActions);
              } else {
                console.log("AI応答の形式が不正:", result);
                // フォールバックは既に setDefaultActions() で設定済み
              }
            } catch (error) {
              console.error("AI行動選択肢解析エラー:", error);
              // フォールバックは既に setDefaultActions() で設定済み
            }
          },
        },
        { location: currentLocation, character: selectedCharacter, day: currentDay }
      );
    } catch (error) {
      console.error("AI行動選択肢生成エラー:", error);
      // フォールバックは既に setDefaultActions() で設定済み
    }
  };

  // アイコン取得ヘルパー
  const getActionIcon = (iconType: string) => {
    switch (iconType) {
      case "move": return <DungeonIcon />;
      case "talk": case "interact": return <Forum />;
      case "shop": return <ShoppingCart />;
      case "skill": case "investigate": return <DiceD20Icon />;
      case "quest": return <QuestScrollIcon />;
      default: return <NavigateNext />;
    }
  };

  // デフォルトの行動設定（フォールバック用）
  const setDefaultActions = () => {
    const testLocations = getTestLocationOptions();
    const actions: ActionChoice[] = [
      {
        id: "move",
        type: "move",
        label: "移動",
        description: "他の場所へ移動する",
        icon: <DungeonIcon />,
        requiresTarget: true,
        targetType: "location",
      },
      {
        id: "talk",
        type: "talk",
        label: "NPC会話",
        description: "NPCと会話する",
        icon: <Forum />,
        requiresTarget: true,
        targetType: "npc",
      },
      {
        id: "investigate",
        type: "skill",
        label: "調査",
        description: "周囲を調査する",
        icon: <DiceD20Icon />,
      },
    ];

    // 🎮 テスト用: 各場所への直接移動アクションを追加
    testLocations.forEach(location => {
      if (location.name !== currentLocation) {
        actions.push({
          id: `move-to-${location.id}`,
          type: "move",
          label: `${location.name}へ移動`,
          description: `${location.description}へ移動する`,
          icon: <DungeonIcon />,
        });
      }
    });

    setAvailableActions(actions);
  };

  // 行動選択処理
  const handleActionChoice = async (action: ActionChoice) => {
    if (!selectedCharacter) {
      alert("キャラクターを選択してください");
      return;
    }

    // 🎮 移動アクションの特別処理
    if (action.type === "move" && action.id.startsWith("move-to-")) {
      const locationId = action.id.replace("move-to-", "");
      const testLocations = getTestLocationOptions();
      const targetLocation = testLocations.find(loc => loc.id === locationId);
      
      if (targetLocation && selectedCharacter) {
        // 位置更新を実行
        updatePlayerPosition(selectedCharacter.id, targetLocation.name);
        
        // 移動メッセージをチャットに追加
        const moveMessage: ChatMessage = {
          id: uuidv4(),
          sender: selectedCharacter.name,
          senderType: "player",
          message: `${targetLocation.name}に移動しました`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, moveMessage]);
        
        // AIによる移動結果応答
        setTimeout(() => {
          const aiResponse: ChatMessage = {
            id: uuidv4(),
            sender: "AIゲームマスター",
            senderType: "gm",
            message: `${targetLocation.name}に到着しました。${targetLocation.description}が見えます。`,
            timestamp: new Date(),
          };
          setChatMessages(prev => [...prev, aiResponse]);
          
          // 移動後の行動選択肢を更新
          setDefaultActions();
        }, 1000);
        
        // 行動回数更新
        setActionCount(prev => prev + 1);
        return;
      }
    }

    // ユーザーの行動をチャットに追加
    const userActionMessage: ChatMessage = {
      id: uuidv4(),
      sender: selectedCharacter.name,
      senderType: "player",
      message: `${action.label}: ${action.description}`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userActionMessage]);

    // 行動回数チェック
    setActionCount(prev => prev + 1);

    // AI に行動結果を生成してもらう
    await openAIAssist(
      "session-gm",
      {
        title: "行動実行",
        description: `${action.label}の結果を生成します`,
        defaultMessage: `${selectedCharacter.name}が「${action.label}」を実行しました。

**現在の状況:**
- 場所: ${currentLocation}
- 日付: ${currentDay}日目
- 行動回数: ${actionCount + 1}/${maxActionsPerDay}

**行動内容:**
${action.description}

**キャンペーン状況:**
${currentCampaign?.synopsis}

**本日のイベント:**
${currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay)
  .map(e => `- ${e.title}: ${e.description}`).join('\n') || '特別なイベントはありません'}

**指示:**
1. この行動の結果を詳細に描写してください
2. 必要に応じてダイスロールやスキルチェックを提案してください
3. NPCとの遭遇があれば会話を開始してください
4. ストーリーを前進させる情報や発見があれば含めてください
5. 次に取れる行動のヒントを自然に織り込んでください

ゲームマスターとして、没入感のある応答をお願いします。`,
        onComplete: async (result) => {
          if (result.content) {
            const gmResponse: ChatMessage = {
              id: uuidv4(),
              sender: "AIゲームマスター",
              senderType: "gm",
              message: result.content as string,
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, gmResponse]);

            // 🎯 **タイムライン連動遭遇判定**
            await checkTimelineEncounters();

            // 🗡️ **エネミー移動シミュレーション**（25%の確率で実行）
            if (Math.random() < 0.25) {
              setTimeout(() => {
                simulateEnemyMovement();
              }, 1500);
            }

            // AIパーティーメンバーの自動行動
            await handleAIPartyActions();

            // AIによる日進行判定
            const dayProgressionResult = await checkDayProgressionByAI(
              result.content as string,
              actionCount + 1
            );
            
            if (dayProgressionResult.shouldAdvanceDay) {
              const progressionMessage: ChatMessage = {
                id: uuidv4(),
                sender: "システム",
                senderType: "system",
                message: dayProgressionResult.reason || "本日の主要な活動が完了しました。次の日に進みます。",
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, progressionMessage]);
              
              // 遅延を入れてから日進行
              setTimeout(() => {
                handleDayAdvance();
              }, 2000);
            } else {
              // 新しい行動選択肢を生成
              updateAvailableActions();
            }
          }
        },
      },
      { 
        action, 
        character: selectedCharacter, 
        location: currentLocation, 
        day: currentDay,
        actionCount: actionCount + 1,
        chatHistory: chatMessages.slice(-5)
      }
    );
  };

  // 日程進行
  // AIゲームマスターにセッション開始を依頼
  const handleStartAIGameMaster = async () => {
    // 🔒 キャラクター選択が必要な場合
    if (!selectedCharacter) {
      alert("セッションを開始する前にキャラクターを選択してください");
      return;
    }

    // 🔒 セッション開始とキャラクターの固定
    setIsSessionStarted(true);
    setLockedCharacterId(selectedCharacter.id);

    const startMessage: ChatMessage = {
      id: uuidv4(),
      sender: "AIゲームマスター",
      senderType: "gm",
      message: `${currentDay}日目のセッションを開始します。${selectedCharacter.name}でプレイします。今日予定されているイベントや状況をご案内しますね。`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, startMessage]);

    // 日付に応じたイベントチェック
    checkDailyEvents(currentDay);
    
    // AIエージェントにセッション開始を依頼
    await requestAIGameMasterStart();
  };

  // AIゲームマスター開始リクエスト
  const requestAIGameMasterStart = async () => {
    try {
      const prompt = `
${currentDay}日目のTRPGセッションを開始してください。

**キャンペーン情報:**
- タイトル: ${currentCampaign?.title}
- 現在の日付: ${currentDay}日目

**本日の予定イベント:**
${currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay)
  .map(event => `- ${event.title}: ${event.description}`)
  .join('\n') || '特別なイベントは予定されていません'}

**パーティー状況:**
${currentCampaign?.characters?.map(char => 
  `- ${char.name}: ${char.description}`).join('\n') || 'キャラクター情報がありません'}

ゲームマスターとして、今日一日の流れや状況を説明し、プレイヤーが行動を選択できるよう導いてください。
`;

      // AI統合機能を使用してGMの応答を取得
      // 実装は既存のAI統合システムを使用
      console.log("AI GMリクエスト:", prompt);
      
    } catch (error) {
      console.error("AI GM開始エラー:", error);
    }
  };

  // アクティブなイベントが存在するかチェック
  const hasActiveEvent = (): boolean => {
    const dailyEvents = currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay) || [];
    return dailyEvents.length > 0;
  };

  // AIによる日進行判定
  const checkDayProgressionByAI = async (
    actionResult: string, 
    currentActionCount: number
  ): Promise<{ shouldAdvanceDay: boolean; reason?: string }> => {
    try {
      const activeEvents = currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay) || [];
      
      return new Promise((resolve) => {
        openAIAssist(
          "day-progression",
          {
            title: "日進行判定",
            description: "現在の状況から一日を終了すべきかAIが判定します",
            defaultMessage: `TRPGセッションの日進行タイミングを判定してください。

**現在の状況:**
- 日付: ${currentDay}日目
- 行動回数: ${currentActionCount}/${maxActionsPerDay}
- 場所: ${currentLocation}

**本日のイベント:**
${activeEvents.map(event => `- ${event.title}: ${event.description}`).join('\n') || '特別なイベントはありません'}

**最新の行動結果:**
${actionResult}

**最近のセッション履歴:**
${chatMessages.slice(-3).map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

**判定基準:**
1. 本日の主要イベントが完了した場合
2. 重要なストーリー展開が一段落した場合
3. 行動回数上限に達し、自然な終了点に来た場合
4. プレイヤーが十分な活動を行い、次の日に進むのが適切な場合

以下のJSON形式で回答してください：
{
  "shouldAdvanceDay": true/false,
  "reason": "具体的な理由",
  "nextDayPreview": "次の日の予告や状況説明（進行する場合）"
}`,
            onComplete: (result) => {
              try {
                const aiResponse = typeof result.content === 'string' 
                  ? JSON.parse(result.content) 
                  : result.content;
                
                resolve({
                  shouldAdvanceDay: aiResponse.shouldAdvanceDay || false,
                  reason: aiResponse.reason || undefined
                });
              } catch (error) {
                console.error("AI日進行判定解析エラー:", error);
                // フォールバック：行動回数ベースの判定
                resolve({
                  shouldAdvanceDay: currentActionCount >= maxActionsPerDay,
                  reason: currentActionCount >= maxActionsPerDay 
                    ? "本日の行動回数が上限に達しました。"
                    : undefined
                });
              }
            },
          },
          { 
            day: currentDay, 
            actionCount: currentActionCount, 
            events: activeEvents,
            recentHistory: chatMessages.slice(-3)
          }
        );
      });
    } catch (error) {
      console.error("AI日進行判定エラー:", error);
      return {
        shouldAdvanceDay: currentActionCount >= maxActionsPerDay,
        reason: currentActionCount >= maxActionsPerDay 
          ? "本日の行動回数が上限に達しました。"
          : undefined
      };
    }
  };

  // 日進行（自動または手動）
  const handleDayAdvance = async () => {
    const newDay = currentDay + 1;
    setCurrentDay(newDay);
    setActionCount(0);
    
    const dayMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message: `--- ${newDay}日目の朝 ---`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, dayMessage]);

    // キャンペーン終了チェック（最終日の場合）
    const maxDays = currentCampaign?.maxDays || 30;
    if (newDay > maxDays) {
      await handleCampaignCompletion();
      return;
    }

    // 新しい日のイベントチェック
    await checkDailyEvents(newDay);
    
    // 新しい日の行動選択肢を生成
    updateAvailableActions();
  };

  // キャンペーン完了判定
  const handleCampaignCompletion = async () => {
    try {
      await openAIAssist(
        "campaign-completion",
        {
          title: "キャンペーン終了判定",
          description: "キャンペーンの成功・失敗をAIが判定します",
          defaultMessage: `キャンペーン「${currentCampaign?.title}」が終了しました。成功・失敗を判定してください。

**キャンペーン目標:**
${currentCampaign?.synopsis}

**キャンペーン期間:**
${currentCampaign?.maxDays || 30}日間

**プレイヤーの行動履歴:**
${chatMessages.filter(msg => msg.senderType === "player" || msg.senderType === "gm")
  .slice(-10).map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

**完了したクエスト:**
${currentCampaign?.quests?.filter(q => q.status === "completed")
  .map(q => `- ${q.title}: ${q.description}`).join('\n') || 'なし'}

**未完了のクエスト:**
${currentCampaign?.quests?.filter(q => q.status !== "completed")
  .map(q => `- ${q.title}: ${q.description}`).join('\n') || 'なし'}

**キャラクターの最終状態:**
${playerCharacters.map(char => 
  `- ${char.name}: HP ${char.stats?.HP || 10}, レベル ${char.level || 1}`
).join('\n')}

**判定基準:**
1. 主要な目標が達成されたか
2. 重要なクエストが完了したか
3. キャラクターが生存しているか
4. ストーリー的に満足のいく結末か

以下のJSON形式で回答してください：
{
  "result": "success" | "failure" | "partial_success",
  "score": 数値（0-100）,
  "summary": "結果の詳細説明",
  "achievements": ["達成した項目1", "達成した項目2"],
  "missed_opportunities": ["逃した機会1", "逃した機会2"],
  "final_message": "プレイヤーへの最終メッセージ"
}`,
          onComplete: (result) => {
            try {
              const aiResponse = typeof result.content === 'string' 
                ? JSON.parse(result.content) 
                : result.content;
              
              displayCampaignResults(aiResponse);
            } catch (error) {
              console.error("キャンペーン判定解析エラー:", error);
              displayCampaignResults({
                result: "partial_success",
                score: 70,
                summary: "キャンペーンが完了しました。",
                achievements: ["キャンペーンを最後まで完走"],
                missed_opportunities: [],
                final_message: "お疲れ様でした！"
              });
            }
          },
        },
        { 
          campaign: currentCampaign,
          sessionHistory: chatMessages,
          characters: playerCharacters
        }
      );
    } catch (error) {
      console.error("キャンペーン完了判定エラー:", error);
    }
  };

  // キャンペーン結果表示
  const displayCampaignResults = (results: any) => {
    const resultMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message: `🎊 キャンペーン終了 🎊

**結果:** ${results.result === 'success' ? '大成功！' : 
              results.result === 'partial_success' ? '成功' : '失敗'}

**スコア:** ${results.score}/100

**達成項目:**
${results.achievements?.map((achievement: string) => `✅ ${achievement}`).join('\n') || 'なし'}

**逃した機会:**
${results.missed_opportunities?.map((missed: string) => `❌ ${missed}`).join('\n') || 'なし'}

**総評:**
${results.summary}

**最終メッセージ:**
${results.final_message}`,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, resultMessage]);
  };

  // 🎯 **タイムライン連動遭遇判定システム**
  const checkTimelineEncounters = async () => {
    if (!sessionState || !currentCampaign) return;

    const currentState = sessionState.currentState;
    const spatialTracking = sessionState.spatialTracking;

    // 1. 時空間衝突判定
    const encounters = await detectSpatialTemporalCollisions(currentState, spatialTracking);
    
    // 2. 各遭遇の処理
    for (const encounter of encounters) {
      await processEncounter(encounter);
    }
  };

  // 時空間衝突検出
  const detectSpatialTemporalCollisions = async (
    currentState: SessionCurrentState, 
    spatialTracking: SpatialTrackingSystem
  ) => {
    const encounters = [];
    const playerPositions = spatialTracking.currentPositions.players;
    const npcPositions = spatialTracking.currentPositions.npcs;
    const enemyPositions = spatialTracking.currentPositions.enemies;

    // プレイヤーと同じ場所・時間にいるNPC/エネミーを検出
    Object.entries(playerPositions).forEach(([playerId, playerPos]) => {
      if (!playerPos.isActive) return;

      // NPC遭遇チェック
      Object.entries(npcPositions).forEach(([npcId, npcPos]) => {
        if (npcPos.location === playerPos.location && 
            npcPos.dayNumber === playerPos.dayNumber) {
          encounters.push({
            type: "npc_encounter",
            playerId,
            targetId: npcId,
            location: playerPos.location,
            dayNumber: playerPos.dayNumber,
            timeOfDay: playerPos.timeOfDay
          });
        }
      });

      // エネミー遭遇チェック
      Object.entries(enemyPositions).forEach(([enemyId, enemyPos]) => {
        if (enemyPos.location === playerPos.location && 
            enemyPos.dayNumber === playerPos.dayNumber) {
          encounters.push({
            type: "enemy_encounter",
            playerId,
            targetId: enemyId,
            location: playerPos.location,
            dayNumber: playerPos.dayNumber,
            timeOfDay: playerPos.timeOfDay
          });
        }
      });
    });

    // タイムラインイベント遭遇チェック
    const scheduledEvents = currentCampaign.quests?.filter(quest => 
      quest.scheduledDay === currentState.currentDay &&
      quest.location === currentState.currentLocation
    ) || [];

    scheduledEvents.forEach(event => {
      encounters.push({
        type: "timeline_event",
        eventId: event.id,
        location: currentState.currentLocation,
        dayNumber: currentState.currentDay,
        timeOfDay: currentState.currentTimeOfDay
      });
    });

    return encounters;
  };

  // 遭遇処理
  const processEncounter = async (encounter: any) => {
    try {
      const encounterId = uuidv4();
      
      await openAIAssist(
        "encounter-processing",
        {
          title: "遭遇イベント処理",
          description: "タイムライン連動遭遇を処理します",
          defaultMessage: `遭遇が発生しました。状況に応じた処理を行ってください。

**遭遇情報:**
- タイプ: ${encounter.type}
- 場所: ${encounter.location}
- 日付: ${encounter.dayNumber}日目
- 時刻: ${encounter.timeOfDay}

**現在の状況:**
- プレイヤー: ${selectedCharacter?.name}
- 行動回数: ${actionCount}/${maxActionsPerDay}

**遭遇対象:**
${encounter.type === "npc_encounter" ? 
  `NPC: ${npcs.find(npc => npc.id === encounter.targetId)?.name}` :
  encounter.type === "enemy_encounter" ?
  `エネミー: ${enemies.find(enemy => enemy.id === encounter.targetId)?.name}` :
  `イベント: ${currentCampaign?.quests?.find(q => q.id === encounter.eventId)?.title}`
}

**指示:**
1. この遭遇の詳細な状況を描写してください
2. プレイヤーが取れる行動選択肢を提示してください
3. 必要に応じてダイス判定を要求してください
4. ストーリーを前進させる要素を含めてください

このイベントをドラマチックに演出してください。`,
          onComplete: (result) => {
            if (result.content) {
              const encounterMessage: ChatMessage = {
                id: uuidv4(),
                sender: "AIゲームマスター",
                senderType: "gm",
                message: result.content as string,
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, encounterMessage]);

              // 遭遇記録をセッション状態に追加
              recordEncounter(encounterId, encounter, result.content as string);
            }
          },
        },
        { 
          encounter,
          sessionState,
          character: selectedCharacter
        }
      );
    } catch (error) {
      console.error("遭遇処理エラー:", error);
    }
  };

  // 遭遇記録
  const recordEncounter = (encounterId: string, encounter: any, description: string) => {
    if (!sessionState) return;

    const encounterRecord: EncounterRecord = {
      id: encounterId,
      timestamp: new Date(),
      dayNumber: encounter.dayNumber,
      timeOfDay: encounter.timeOfDay,
      location: encounter.location,
      encounterType: encounter.type === "npc_encounter" ? "npc_dialogue" :
                    encounter.type === "enemy_encounter" ? "enemy_combat" : "event_trigger",
      participants: {
        players: [selectedCharacter?.id || ""],
        npcs: encounter.type === "npc_encounter" ? [encounter.targetId] : undefined,
        enemies: encounter.type === "enemy_encounter" ? [encounter.targetId] : undefined
      },
      result: {
        outcome: "ongoing"
      },
      aiDecisions: {
        wasAIInitiated: true,
        difficultyCalculated: 50, // デフォルト値
        tacticalAdvantage: "neutral"
      },
      description,
      tags: [encounter.type, encounter.location]
    };

    // セッション状態更新
    const updatedSession = {
      ...sessionState,
      encounterHistory: [...sessionState.encounterHistory, encounterRecord]
    };
    setSessionState(updatedSession);
  };

  // 位置更新システム
  const updatePlayerPosition = (characterId: string, newLocation: string) => {
    if (!sessionState) return;

    const currentTimeOfDay: TimeOfDay = getCurrentTimeOfDay();
    
    // 空間追跡システム更新
    const updatedSpatialTracking = {
      ...sessionState.spatialTracking,
      currentPositions: {
        ...sessionState.spatialTracking.currentPositions,
        players: {
          ...sessionState.spatialTracking.currentPositions.players,
          [characterId]: {
            ...sessionState.spatialTracking.currentPositions.players[characterId],
            location: newLocation,
            arrivalTime: new Date(),
            dayNumber: currentDay,
            timeOfDay: currentTimeOfDay
          }
        }
      }
    };

    // セッション状態更新
    const updatedCurrentState = {
      ...sessionState.currentState,
      currentLocation: newLocation,
      partyLocation: {
        ...sessionState.currentState.partyLocation,
        groupLocation: newLocation,
        memberLocations: {
          ...sessionState.currentState.partyLocation.memberLocations,
          [characterId]: {
            location: newLocation,
            timeArrived: new Date().toISOString(),
            isWithGroup: true
          }
        },
        movementHistory: [
          ...sessionState.currentState.partyLocation.movementHistory,
          {
            characterId,
            fromLocation: currentLocation,
            toLocation: newLocation,
            timestamp: new Date(),
            dayNumber: currentDay,
            timeOfDay: currentTimeOfDay
          }
        ]
      }
    };

    const updatedSession = {
      ...sessionState,
      currentState: updatedCurrentState,
      spatialTracking: updatedSpatialTracking
    };

    setSessionState(updatedSession);
    setCurrentLocation(newLocation);

    // 移動後の遭遇チェック
    setTimeout(() => {
      checkTimelineEncounters();
    }, 1000);
  };

  // 現在時刻取得
  const getCurrentTimeOfDay = (): TimeOfDay => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 14) return "noon";
    if (hour >= 14 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    if (hour >= 22 || hour < 2) return "night";
    return "late_night";
  };

  // 🗡️ **エネミー移動シミュレーション**
  const simulateEnemyMovement = () => {
    if (!sessionState || !enemies || enemies.length === 0) return;

    const testLocations = getTestLocationOptions();
    const updatedSpatialTracking = { ...sessionState.spatialTracking };

    enemies.forEach(enemy => {
      const currentPosition = updatedSpatialTracking.currentPositions.enemies[enemy.id];
      if (!currentPosition || !currentPosition.isActive) return;

      // エネミーの移動確率とパターンに基づいて移動を決定
      const moveChance = enemy.behavior === "パトロール" ? 0.3 : 
                       enemy.behavior === "彷徨" ? 0.2 :
                       enemy.behavior === "待ち伏せ" ? 0.1 : 0.05;

      if (Math.random() < moveChance) {
        // 移動可能な場所をランダムに選択
        const possibleLocations = testLocations.filter(loc => loc.name !== currentPosition.location);
        if (possibleLocations.length > 0) {
          const newLocation = possibleLocations[Math.floor(Math.random() * possibleLocations.length)];
          
          // エネミーの位置を更新
          updatedSpatialTracking.currentPositions.enemies[enemy.id] = {
            ...currentPosition,
            location: newLocation.name,
            arrivalTime: new Date(),
            dayNumber: currentDay,
            timeOfDay: getCurrentTimeOfDay()
          };

          // 移動ログを出力
          console.log(`🗡️ エネミー移動: ${enemy.name} が ${currentPosition.location} から ${newLocation.name} に移動しました`);

          // チャットにエネミー移動メッセージを追加（開発者モード時のみ）
          if (developerMode) {
            const moveMessage: ChatMessage = {
              id: uuidv4(),
              sender: "システム",
              senderType: "system",
              message: `🗡️ エネミー移動報告: ${enemy.name}が${newLocation.name}に移動しました`,
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, moveMessage]);
          }
        }
      }
    });

    // セッション状態を更新
    const updatedSession = {
      ...sessionState,
      spatialTracking: updatedSpatialTracking
    };
    setSessionState(updatedSession);

    // 移動後の遭遇チェック
    setTimeout(() => {
      checkTimelineEncounters();
    }, 500);
  };

  // AIパーティーメンバー自動行動
  const handleAIPartyActions = async () => {
    const aiControlledCharacters = playerCharacters.filter(char => char.id !== selectedCharacter?.id);
    
    if (aiControlledCharacters.length === 0) return;

    // ランダムで1-2名のAIキャラクターが行動
    const actingCharacters = aiControlledCharacters
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(2, aiControlledCharacters.length));

    for (const character of actingCharacters) {
      // 30%の確率でAIキャラクターが行動
      if (Math.random() < 0.3) {
        await generateAICharacterAction(character);
        
        // AIキャラクター間の間隔を空ける
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // AI操作キャラクターの行動生成
  const generateAICharacterAction = async (character: TRPGCharacter) => {
    try {
      await openAIAssist(
        "ai-party-action",
        {
          title: "AIパーティーメンバー行動",
          description: `${character.name}の自動行動を生成します`,
          defaultMessage: `${character.name}の行動を決めてください。

**キャラクター情報:**
- 名前: ${character.name}
- 説明: ${character.description}
- 性格: ${character.personality || "不明"}
- スキル: ${character.skills?.map(s => s.name).join(", ") || "なし"}

**現在の状況:**
- 場所: ${currentLocation}
- 日付: ${currentDay}日目
- 現在のプレイヤー行動: ${selectedCharacter?.name}が最近行動

**最近の会話:**
${chatMessages.slice(-3).map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

**本日のイベント:**
${currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay)
  .map(e => `- ${e.title}: ${e.description}`).join('\n') || '特別なイベントはありません'}

**指示:**
このキャラクターらしい行動や発言を1つ選んでください。行動は以下のいずれかにしてください：
1. プレイヤーキャラクターへの助言や提案
2. 状況に対する独自の調査や行動
3. NPCとの会話や交流
4. 仲間への励ましやサポート
5. その場の雰囲気に合った自然な発言

短い行動と発言（1-2文）で回答してください。`,
          onComplete: (result) => {
            if (result.content) {
              const aiCharacterMessage: ChatMessage = {
                id: uuidv4(),
                sender: `${character.name} (AI)`,
                senderType: "player",
                message: result.content as string,
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, aiCharacterMessage]);
            }
          },
        },
        { 
          character,
          situation: {
            location: currentLocation,
            day: currentDay,
            recentContext: chatMessages.slice(-3)
          }
        }
      );
    } catch (error) {
      console.error("AIパーティー行動生成エラー:", error);
    }
  };

  // NPC接触時のAI操作
  const handleNPCInteraction = async (npcName: string) => {
    const npc = npcs.find(n => n.name === npcName);
    if (!npc) return;

    try {
      await openAIAssist(
        "npc-interaction",
        {
          title: "NPC会話",
          description: `${npcName}との会話をAIが進行します`,
          defaultMessage: `${npcName}との会話を開始してください。

**NPC情報:**
- 名前: ${npc.name}
- 説明: ${npc.description}
- 性格: ${npc.personality || "友好的"}
- 関連クエスト: ${npc.associatedQuests?.join(", ") || "なし"}

**現在の状況:**
- 場所: ${currentLocation}
- 日付: ${currentDay}日目
- 話しかけているキャラクター: ${selectedCharacter?.name}

**キャンペーン背景:**
${currentCampaign?.synopsis}

**最近の出来事:**
${chatMessages.slice(-3).map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

**指示:**
このNPCらしい応答をしてください。以下を含めることができます：
1. キャラクターへの挨拶や反応
2. 情報提供や助言
3. クエストの提案や進行
4. 世界観に関する話題
5. 個性的な癖や特徴的な話し方

NPCとして自然で魅力的な会話をお願いします。`,
          onComplete: (result) => {
            if (result.content) {
              const npcMessage: ChatMessage = {
                id: uuidv4(),
                sender: npcName,
                senderType: "npc",
                message: result.content as string,
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, npcMessage]);
            }
          },
        },
        { 
          npc,
          player: selectedCharacter,
          situation: {
            location: currentLocation,
            day: currentDay,
            campaign: currentCampaign
          }
        }
      );
    } catch (error) {
      console.error("NPC会話生成エラー:", error);
    }
  };

  // 日付イベントチェック
  const checkDailyEvents = async (day: number) => {
    const dailyEvents = currentCampaign?.quests?.filter(q => q.scheduledDay === day) || [];
    
    if (dailyEvents.length > 0) {
      await openAIAssist(
        "session-gm",
        {
          title: "日程イベント",
          description: "予定されたイベントを実行します",
          defaultMessage: `${day}日目のイベント:
${dailyEvents.map(e => `- ${e.title}: ${e.description}`).join("\n")}

これらのイベントの発生を描写してください。`,
          onComplete: (result) => {
            if (result.content) {
              const eventMessage: ChatMessage = {
                id: uuidv4(),
                sender: "ゲームマスター",
                senderType: "gm",
                message: result.content as string,
                timestamp: new Date(),
              };
              setChatMessages(prev => [...prev, eventMessage]);
            }
          },
        },
        { day, events: dailyEvents }
      );
    }
  };

  // チャット送信
  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedCharacter) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      sender: selectedCharacter.name,
      senderType: "player",
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageContent = chatInput;
    setChatInput("");

    // AIゲームマスターに応答を生成してもらう
    await openAIAssist(
      "chat-response",
      {
        title: "チャット応答",
        description: "プレイヤーの発言にAIゲームマスターが応答します",
        defaultMessage: `${selectedCharacter.name}が以下のように発言しました：
"${messageContent}"

**現在の状況:**
- 場所: ${currentLocation}
- 日付: ${currentDay}日目
- 行動回数: ${actionCount}/${maxActionsPerDay}

**最近の会話:**
${chatMessages.slice(-3).map(msg => `${msg.sender}: ${msg.message}`).join('\n')}

**指示:**
ゲームマスターとして、この発言に対して適切に応答してください。
- 質問があれば答える
- 新しい情報を提供する
- ストーリーを進展させる
- 必要に応じて行動の結果を描写する

自然で魅力的な応答をお願いします。`,
        onComplete: (result) => {
          if (result.content) {
            const gmResponse: ChatMessage = {
              id: uuidv4(),
              sender: "AIゲームマスター",
              senderType: "gm",
              message: result.content as string,
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, gmResponse]);
          }
        },
      },
      { 
        playerMessage: messageContent,
        character: selectedCharacter,
        context: {
          location: currentLocation,
          day: currentDay,
          actionCount
        }
      }
    );
  };

  // ダイスロール処理
  const handleDiceRoll = (diceRoll: DiceRoll) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      sender: selectedCharacter?.name || "システム",
      senderType: "system",
      message: `${diceRoll.purpose}: ${diceRoll.dice} = [${diceRoll.rolls.join(", ")}] = ${diceRoll.total}`,
      timestamp: new Date(),
      diceRoll,
    };

    setChatMessages([...chatMessages, newMessage]);
  };

  // スキルチェック結果処理
  const handleSkillCheckResult = (result: SkillCheckResult) => {
    const resultMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message: `スキルチェック: ${result.criticalSuccess ? "クリティカル成功！" : result.success ? "成功！" : result.criticalFailure ? "ファンブル！" : "失敗..."}（値: ${result.value} / 目標: ${result.difficulty}）`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, resultMessage]);
    setSkillCheckDialog(false);
  };

  // パワーチェック結果処理
  const handlePowerCheckResult = (result: PowerCheckResult) => {
    const resultMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message: `パワーチェック: ${result.success ? "成功！" : "失敗..."}（クリック数: ${result.clickCount} / パワーレベル: ${result.powerLevel}%）`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, resultMessage]);
    setPowerCheckDialog(false);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* ヘッダー */}
      <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {currentCampaign?.title || "キャンペーン"}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<CalendarToday />}
                label={`${currentDay}日目`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<BaseIcon />}
                label={currentLocation}
                color="secondary"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                行動回数: {actionCount} / {maxActionsPerDay}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            {combatMode && (
              <Chip
                icon={<Bolt />}
                label="戦闘中"
                color="error"
                variant="filled"
              />
            )}
            <Button
              variant="contained"
              startIcon={<GameMasterIcon />}
              onClick={handleStartAIGameMaster}
              disabled={isSessionStarted}
            >
              {isSessionStarted 
                ? `セッション進行中 (${selectedCharacter?.name})`
                : "AIゲームマスターにセッションを始めてもらう"}
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => {
                console.log("セッション保存");
              }}
            >
              保存
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, display: "flex", gap: 1, overflow: "hidden", p: 1 }}>
        {/* 左側 - イラスト＋キャラクター */}
        <Box sx={{ width: 350, display: "flex", flexDirection: "column", gap: 1 }}>
          {/* イラスト表示 */}
          <Card sx={{ height: 300 }}>
            <CardMedia
              component="img"
              height="300"
              image={currentBaseImage}
              alt={currentLocation}
              sx={{ objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                p: 1,
              }}
            >
              <Typography variant="h6">{currentLocation}</Typography>
            </Box>
          </Card>

          {/* キャラクター情報 */}
          <Paper sx={{ flex: 1, overflow: "auto" }}>
            <CharacterDisplay
              playerCharacters={playerCharacters}
              npcs={npcs}
              enemies={enemies}
              selectedCharacter={selectedCharacter}
              selectedEnemies={selectedEnemies}
              tabValue={tabValue}
              combatMode={combatMode}
              onTabChange={(e, v) => setTabValue(v)}
              onCharacterSelect={isSessionStarted ? undefined : setSelectedCharacter} // 🔒 セッション開始後は選択不可
              onEnemyToggle={(id) => setSelectedEnemies(prev =>
                prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
              )}
              onStartCombat={() => setCombatMode(true)}
              isSelectionDisabled={isSessionStarted} // 🔒 選択無効化フラグ
            />
          </Paper>
        </Box>

        {/* 中央 - チャット＋インタラクション */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {/* チャットエリア */}
          <Paper sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <ChatInterface
              messages={chatMessages}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              onSendMessage={handleSendChat}
              onOpenDiceDialog={() => setDiceDialog(true)}
            />
          </Paper>

          {/* 行動選択エリア */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">
                行動選択
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip 
                  label={`操作中: ${selectedCharacter?.name || "未選択"}`}
                  color="primary"
                  size="small"
                />
                {actionCount >= maxActionsPerDay && (
                  <Chip 
                    label="行動上限到達"
                    color="warning"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            
            <Grid container spacing={1}>
              {availableActions.map((action) => (
                <Grid item xs={6} sm={3} key={action.id}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={action.icon}
                    onClick={() => {
                      if (action.type === "talk" && npcs.length > 0) {
                        // NPC選択ダイアログを表示
                        const npcNames = npcs.map(npc => npc.name);
                        const selectedNPC = prompt(`話しかけるNPCを選択してください:\n${npcNames.join('\n')}`);
                        if (selectedNPC && npcNames.includes(selectedNPC)) {
                          handleNPCInteraction(selectedNPC);
                        }
                      } else {
                        handleActionChoice(action);
                      }
                    }}
                    disabled={!selectedCharacter}
                    sx={{ 
                      height: '100%',
                      flexDirection: 'column',
                      py: 2,
                      '& .MuiButton-startIcon': {
                        margin: 0,
                        mb: 1,
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="button" display="block">
                        {action.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
              
              {/* 手動日進行ボタン */}
              <Grid item xs={6} sm={3}>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  startIcon={<NavigateNext />}
                  onClick={() => {
                    if (window.confirm("本日を終了して次の日に進みますか？")) {
                      handleDayAdvance();
                    }
                  }}
                  sx={{ 
                    height: '100%',
                    flexDirection: 'column',
                    py: 2,
                    '& .MuiButton-startIcon': {
                      margin: 0,
                      mb: 1,
                    }
                  }}
                >
                  <Box>
                    <Typography variant="button" display="block">
                      日程進行
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      次の日に進む
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* 右側 - 詳細情報 */}
        <Paper sx={{ width: 300, p: 2 }}>
          <Tabs value={0} onChange={() => {}}>
            <Tab label="ステータス" />
            <Tab label="インタラクト" />
            <Tab label="ログ" />
          </Tabs>
          
          <TabPanel value={0} index={0}>
            {selectedCharacter && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedCharacter.name}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="HP" 
                      secondary={`${selectedCharacter.stats?.HP || 10} / ${selectedCharacter.stats?.HP || 10}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="MP" 
                      secondary={`${selectedCharacter.stats?.MP || 5} / ${selectedCharacter.stats?.MP || 5}`}
                    />
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  装備
                </Typography>
                <List dense>
                  {selectedCharacter.equipment?.map((equip, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <Backpack fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={equip.name} />
                    </ListItem>
                  )) || (
                    <ListItem>
                      <ListItemText primary="装備なし" secondary="アイテムを装備してください" />
                    </ListItem>
                  )}
                </List>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  スキル
                </Typography>
                <List dense>
                  {selectedCharacter.skills?.map((skill, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={skill.name} 
                        secondary={`レベル ${skill.level}`}
                      />
                    </ListItem>
                  )) || (
                    <ListItem>
                      <ListItemText primary="スキルなし" secondary="スキルを習得してください" />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={0} index={1}>
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<DiceD20Icon />}
                onClick={() => setDiceDialog(true)}
                fullWidth
              >
                ダイスロール
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setSkillCheckDialog(true)}
                fullWidth
              >
                スキルチェック
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setPowerCheckDialog(true)}
                fullWidth
              >
                パワーチェック
              </Button>
            </Stack>
          </TabPanel>

          <TabPanel value={0} index={2}>
            <Typography variant="body2" color="text.secondary">
              セッションログ（実装予定）
            </Typography>
          </TabPanel>
        </Paper>
      </Box>

      {/* 🧪 開発テスト用デバッグパネル */}
      {developerMode && sessionState && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            top: 10, 
            right: 10, 
            p: 2, 
            maxWidth: 350, 
            fontSize: '0.8rem',
            bgcolor: 'rgba(255,255,255,0.95)',
            zIndex: 1000,
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <Typography variant="h6" gutterBottom>
            🔍 タイムライン遭遇判定デバッグ
          </Typography>
          
          <Typography variant="body2" color="primary">
            <strong>🎯 現在の状況</strong>
          </Typography>
          <Typography variant="caption" display="block" sx={{ ml: 1 }}>
            現在地: {currentLocation}
          </Typography>
          <Typography variant="caption" display="block" sx={{ ml: 1 }}>
            日数: {currentDay}日目 ({actionCount}/{maxActionsPerDay}行動)
          </Typography>
          <Typography variant="caption" display="block" sx={{ ml: 1 }}>
            セッション: {isSessionStarted ? `進行中 (${selectedCharacter?.name})` : '未開始'}
          </Typography>
          
          {/* 🎭 キャラクター情報 */}
          <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
            <strong>🎭 キャラクター登録状況</strong>
          </Typography>
          {playerCharacters && playerCharacters.length > 0 ? (
            playerCharacters.map(char => (
              <Typography 
                key={char.id} 
                variant="caption" 
                display="block" 
                sx={{ 
                  ml: 1,
                  color: char.id === selectedCharacter?.id ? 'success.main' : 'text.secondary',
                  fontWeight: char.id === selectedCharacter?.id ? 'bold' : 'normal'
                }}
              >
                {char.id === selectedCharacter?.id ? '✅' : '👤'} {char.name} ({char.class} Lv.{char.level})
              </Typography>
            ))
          ) : (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              PCキャラクターが未登録
            </Typography>
          )}
          
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            <strong>📅 本日のイベント ({currentDay}日目)</strong>
          </Typography>
          {currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay).length > 0 ? (
            currentCampaign?.quests?.filter(q => q.scheduledDay === currentDay).map(event => {
              const isAtLocation = event.location === currentLocation;
              return (
                <Typography 
                  key={event.id} 
                  variant="caption" 
                  display="block" 
                  sx={{ 
                    ml: 1, 
                    color: isAtLocation ? 'success.main' : 'text.secondary',
                    fontWeight: isAtLocation ? 'bold' : 'normal'
                  }}
                >
                  {isAtLocation ? '🎯' : '📍'} {event.title} @ {event.location}
                  {isAtLocation && ' (遭遇可能!)'}
                </Typography>
              );
            })
          ) : (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              本日はイベントなし
            </Typography>
          )}
          
          <Typography variant="body2" color="secondary.main" sx={{ mt: 2 }}>
            <strong>📋 全イベント一覧</strong>
          </Typography>
          {currentCampaign?.quests?.map(event => (
            <Typography 
              key={event.id} 
              variant="caption" 
              display="block" 
              sx={{ 
                ml: 1,
                color: event.scheduledDay === currentDay ? 'primary.main' : 'text.secondary'
              }}
            >
              Day{event.scheduledDay || '?'}: {event.title} @ {event.location || '場所未設定'}
            </Typography>
          )) || (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              イベントが未設定
            </Typography>
          )}
          
          {/* 🏠 NPC位置情報 */}
          <Typography variant="body2" color="info.main" sx={{ mt: 2 }}>
            <strong>🏠 NPC配置状況</strong>
          </Typography>
          {npcs && npcs.length > 0 ? (
            npcs.map(npc => {
              const isAtLocation = npc.location === currentLocation;
              
              return (
                <Typography 
                  key={npc.id} 
                  variant="caption" 
                  display="block" 
                  sx={{ 
                    ml: 1,
                    color: isAtLocation ? 'info.main' : 'text.secondary',
                    fontWeight: isAtLocation ? 'bold' : 'normal'
                  }}
                >
                  {isAtLocation ? '💬' : '🏠'} {npc.name} @ {npc.location || '場所未設定'}
                  <span style={{ fontSize: '0.7em', marginLeft: '4px' }}>
                    ({npc.npcType || 'タイプ未設定'})
                  </span>
                </Typography>
              );
            })
          ) : (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              NPCが未設定
            </Typography>
          )}
          
          {/* 🗡️ エネミー位置情報 */}
          <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
            <strong>⚔️ エネミー配置状況</strong>
          </Typography>
          {enemies && enemies.length > 0 ? (
            enemies.map(enemy => {
              const isAtLocation = enemy.location === currentLocation;
              const enemyPosition = sessionState.spatialTracking?.currentPositions?.enemies?.[enemy.id];
              const isActive = enemyPosition?.isActive !== false;
              
              return (
                <Typography 
                  key={enemy.id} 
                  variant="caption" 
                  display="block" 
                  sx={{ 
                    ml: 1,
                    color: isAtLocation && isActive ? 'error.main' : 'text.secondary',
                    fontWeight: isAtLocation && isActive ? 'bold' : 'normal'
                  }}
                >
                  {isAtLocation && isActive ? '⚔️' : '👁️'} {enemy.name} @ {enemy.location}
                  {isAtLocation && isActive && ' (接敵可能!)'}
                  <span style={{ fontSize: '0.7em', marginLeft: '4px' }}>
                    (危険度{enemy.dangerLevel || enemy.level || '?'})
                  </span>
                </Typography>
              );
            })
          ) : (
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              エネミーが未設定
            </Typography>
          )}
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>📊 遭遇履歴: {sessionState.encounterHistory?.length || 0}件</strong>
          </Typography>
          {sessionState.encounterHistory?.slice(-3).map(encounter => (
            <Typography key={encounter.id} variant="caption" display="block" sx={{ ml: 1 }}>
              • {encounter.encounterType} @ {encounter.location} (Day{encounter.dayNumber})
            </Typography>
          ))}
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => checkTimelineEncounters()} 
            >
              🔄 遭遇チェック
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              color="warning"
              onClick={() => simulateEnemyMovement()}
            >
              🗡️ エネミー移動
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => {
                console.log('=== デバッグ情報 ===');
                console.log('セッション状態:', sessionState);
                console.log('キャンペーン:', currentCampaign);
                console.log('現在地:', currentLocation);
                console.log('日数:', currentDay);
                console.log('エネミー位置:', sessionState?.spatialTracking?.currentPositions?.enemies);
                console.log('クエスト:', currentCampaign?.quests);
              }}
            >
              🖨️ ログ出力
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              color="error"
              onClick={() => {
                if (window.confirm('テストデータをJSONファイルからリロードしますか？\n注意：現在のデータは上書きされます。')) {
                  // 既存のデータをクリア
                  clearTestData();
                  
                  // セッション状態もクリア
                  setSessionState(null);
                  setIsSessionStarted(false);
                  setLockedCharacterId(null);
                  setSelectedCharacter(null);
                  
                  // JSONファイルから再ロードしてRecoil状態も更新
                  setTimeout(() => {
                    applyTestDataToLocalStorage();
                    const newTestData = loadTestCampaignData();
                    setCurrentCampaign(newTestData);
                    console.log('🔄 Recoil状態も更新しました', {
                      id: newTestData.id,
                      title: newTestData.title,
                      characters: newTestData.characters?.length,
                      characterNames: newTestData.characters?.map(c => c.name),
                      npcs: newTestData.npcs?.length,
                      enemies: newTestData.enemies?.length,
                      quests: newTestData.quests?.length
                    });
                    // すぐに新しいキャラクターが反映されるように強制的に最初のキャラクターを選択
                    if (newTestData.characters && newTestData.characters.length > 0) {
                      setSelectedCharacter(newTestData.characters[0]);
                    }
                  }, 100);
                }
              }}
            >
              🔄 JSONから再ロード
            </Button>
          </Box>
        </Paper>
      )}

      {/* ダイアログ群 */}
      <DiceRollUI
        open={diceDialog}
        onClose={() => setDiceDialog(false)}
        onRoll={handleDiceRoll}
        selectedCharacterName={selectedCharacter?.name}
      />
      
      <SkillCheckUI
        open={skillCheckDialog}
        onClose={() => setSkillCheckDialog(false)}
        onResult={handleSkillCheckResult}
        difficulty={50}
        skillName={selectedCharacter?.skills?.[0]?.name || "スキル"}
        characterName={selectedCharacter?.name || "キャラクター"}
      />
      
      <PowerCheckUI
        open={powerCheckDialog}
        onClose={() => setPowerCheckDialog(false)}
        onResult={handlePowerCheckResult}
        targetClicks={30}
        timeLimit={5}
        powerName="パワー"
        characterName={selectedCharacter?.name || "キャラクター"}
      />
    </Box>
  );
};

export default TRPGSessionPage;