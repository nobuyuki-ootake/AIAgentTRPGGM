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
  Map as MapIcon,
  Assignment,
  Bolt,
  Save,
  Casino,
  NavigateNext,
  CalendarToday,
  ShoppingCart,
  Forum,
  People,
  Backpack,
  Psychology,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState, sessionStateAtom, developerModeState } from "../store/atoms";
import { AIAssistButton } from "../components/ui/AIAssistButton";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { v4 as uuidv4 } from "uuid";
import { TRPGCharacter, GameSession } from "@novel-ai-assistant/types";
import ChatInterface, { ChatMessage, DiceRoll } from "../components/trpg-session/ChatInterface";
import DiceRollUI from "../components/trpg-session/DiceRollUI";
import CharacterDisplay from "../components/trpg-session/CharacterDisplay";
import SkillCheckUI, { SkillCheckResult } from "../components/trpg-session/SkillCheckUI";
import PowerCheckUI, { PowerCheckResult } from "../components/trpg-session/PowerCheckUI";

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
  const [currentCampaign] = useRecoilState(currentCampaignState);
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
  const [currentLocation, setCurrentLocation] = useState("街の中心");
  const [availableActions, setAvailableActions] = useState<ActionChoice[]>([]);
  const [combatMode, setCombatMode] = useState(false);
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>([]);
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>([]);

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
    if (!sessionState) {
      const newSession: GameSession = {
        id: uuidv4(),
        campaignId: currentCampaign?.id || "",
        sessionNumber: (currentCampaign?.sessions?.length || 0) + 1,
        title: `セッション ${(currentCampaign?.sessions?.length || 0) + 1}`,
        date: new Date(),
        summary: "",
        npcsEncountered: [],
        combatEncounters: [],
        lootObtained: [],
        questProgress: {},
        playerNotes: {},
        gmNotes: "",
        recordingUrl: "",
        duration: 0,
      };
      setSessionState(newSession);
    }
  }, [sessionState, setSessionState, currentCampaign]);

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

  // 利用可能な行動を更新
  const updateAvailableActions = () => {
    const actions: ActionChoice[] = [
      {
        id: "move",
        type: "move",
        label: "移動",
        description: "他の場所へ移動する",
        icon: <MapIcon />,
        requiresTarget: true,
        targetType: "location",
      },
      {
        id: "shop",
        type: "shop",
        label: "買い物",
        description: "アイテムを購入する",
        icon: <ShoppingCart />,
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
        id: "interact",
        type: "interact",
        label: "キャラクター交流",
        description: "他のキャラクターと交流する",
        icon: <People />,
        requiresTarget: true,
        targetType: "character",
      },
    ];

    // 現在地に応じて行動を追加・制限
    if (currentLocation === "ダンジョン") {
      actions.push({
        id: "explore",
        type: "skill",
        label: "探索",
        description: "周囲を探索する",
        icon: <Psychology />,
      });
    }

    setAvailableActions(actions);
  };

  // 行動選択処理
  const handleActionChoice = async (action: ActionChoice) => {
    if (actionCount >= maxActionsPerDay) {
      const confirmNextDay = window.confirm("今日の行動回数が上限に達しました。次の日に進みますか？");
      if (confirmNextDay) {
        handleDayAdvance();
      }
      return;
    }

    // AI に行動結果を生成してもらう
    await openAIAssist(
      "session-gm",
      {
        title: "行動実行",
        description: `${action.label}の結果を生成します`,
        defaultMessage: `プレイヤーが「${action.label}」を選択しました。
現在地: ${currentLocation}
キャラクター: ${selectedCharacter?.name}
行動内容: ${action.description}

この行動の結果を描写し、必要に応じてスキルチェックやダイスロールを提案してください。`,
        onComplete: (result) => {
          if (result.content) {
            const actionMessage: ChatMessage = {
              id: uuidv4(),
              sender: "ゲームマスター",
              senderType: "gm",
              message: result.content as string,
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, actionMessage]);
            setActionCount(prev => prev + 1);
          }
        },
      },
      { action, character: selectedCharacter, location: currentLocation }
    );
  };

  // 日程進行
  const handleDayAdvance = () => {
    setCurrentDay(prev => prev + 1);
    setActionCount(0);
    
    const dayMessage: ChatMessage = {
      id: uuidv4(),
      sender: "システム",
      senderType: "system",
      message: `--- ${currentDay + 1}日目の朝 ---`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, dayMessage]);

    // 日付に応じたイベントチェック
    checkDailyEvents(currentDay + 1);
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
  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      sender: selectedCharacter?.name || "プレイヤー",
      senderType: selectedCharacter ? "player" : "system",
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
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
                icon={<MapIcon />}
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
              startIcon={<NavigateNext />}
              onClick={handleDayAdvance}
              disabled={actionCount === 0}
            >
              次の日へ
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
              onCharacterSelect={setSelectedCharacter}
              onEnemyToggle={(id) => setSelectedEnemies(prev =>
                prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
              )}
              onStartCombat={() => setCombatMode(true)}
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
            <Typography variant="h6" gutterBottom>
              行動選択
            </Typography>
            <Grid container spacing={1}>
              {availableActions.map((action) => (
                <Grid item xs={6} sm={3} key={action.id}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={action.icon}
                    onClick={() => handleActionChoice(action)}
                    disabled={!selectedCharacter || actionCount >= maxActionsPerDay}
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
                startIcon={<Casino />}
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